import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createTelemetryConnection } from './telemetryDb';

describe('telemetryDb schema migration', () => {
  it('adds disk_used_mb/disk_total_mb to a system_metrics table created before those columns existed', () => {
    // A real temp file (not ':memory:') is required here — the whole point is simulating two
    // separate opens of the SAME on-disk database across a code upgrade, which an in-memory DB
    // can't do (each :memory: open is its own independent, empty database).
    const tmpPath = path.join(os.tmpdir(), `telemetry-migration-test-${Date.now()}-${Math.random()}.db`);
    try {
      // Simulate a database created by the pre-disk-tracking code.
      const oldDb = new Database(tmpPath);
      oldDb.exec(`
        CREATE TABLE system_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          host_cpu_pct REAL NOT NULL,
          host_mem_used_mb INTEGER NOT NULL,
          host_mem_total_mb INTEGER NOT NULL,
          process_cpu_pct REAL NOT NULL,
          process_rss_mb INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
      oldDb
        .prepare(
          `INSERT INTO system_metrics (host_cpu_pct, host_mem_used_mb, host_mem_total_mb, process_cpu_pct, process_rss_mb, created_at)
           VALUES (1, 2, 3, 4, 5, 6)`
        )
        .run();
      oldDb.close();

      // Reopen through the real migration path this project actually uses on every server start.
      const migratedDb = createTelemetryConnection(tmpPath);
      const columns = (migratedDb.prepare('PRAGMA table_info(system_metrics)').all() as { name: string }[]).map((c) => c.name);
      expect(columns).toContain('disk_used_mb');
      expect(columns).toContain('disk_total_mb');

      // The pre-migration row survives, with nulls for the columns it predates.
      const row = migratedDb.prepare('SELECT * FROM system_metrics').get() as any;
      expect(row.host_cpu_pct).toBe(1);
      expect(row.disk_used_mb).toBeNull();

      // A fresh insert using the new columns works without error.
      expect(() => {
        migratedDb
          .prepare(
            `INSERT INTO system_metrics (host_cpu_pct, host_mem_used_mb, host_mem_total_mb, process_cpu_pct, process_rss_mb, disk_used_mb, disk_total_mb, created_at)
             VALUES (1, 2, 3, 4, 5, 100, 200, 7)`
          )
          .run();
      }).not.toThrow();

      migratedDb.close();
    } finally {
      for (const suffix of ['', '-wal', '-shm']) {
        fs.rmSync(tmpPath + suffix, { force: true });
      }
    }
  });

  it('is idempotent — running the migration twice on an already-migrated DB does not throw', () => {
    const tmpPath = path.join(os.tmpdir(), `telemetry-migration-idempotent-${Date.now()}-${Math.random()}.db`);
    try {
      createTelemetryConnection(tmpPath).close();
      expect(() => createTelemetryConnection(tmpPath).close()).not.toThrow();
    } finally {
      for (const suffix of ['', '-wal', '-shm']) {
        fs.rmSync(tmpPath + suffix, { force: true });
      }
    }
  });
});
