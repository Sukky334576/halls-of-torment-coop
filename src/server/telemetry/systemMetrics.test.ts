import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTelemetryConnection } from './telemetryDb';
import { SystemMetricsSampler } from './systemMetrics';

/** CPU% depends on real OS/process state, which varies run to run — these tests assert
 * structural behavior (first call has nothing to diff against, later calls produce a plausible
 * reading and a row) rather than exact numbers. */
describe('SystemMetricsSampler', () => {
  let db: Database.Database;
  let sampler: SystemMetricsSampler;

  beforeEach(() => {
    db = createTelemetryConnection(':memory:');
    sampler = new SystemMetricsSampler(db);
  });

  afterEach(() => {
    sampler.stop();
    db.close();
  });

  it('writes no row on the first sampleOnce() call — no earlier snapshot to diff against yet', () => {
    sampler.sampleOnce();
    const count = (db.prepare('SELECT COUNT(*) AS n FROM system_metrics').get() as { n: number }).n;
    expect(count).toBe(0);
  });

  it('writes exactly one plausible row per sampleOnce() call from the second call onward', async () => {
    // os.cpus()' counters only update at OS tick granularity (commonly ~10ms+) — calling
    // sampleOnce() back-to-back with no real elapsed time between calls sees a zero delta and
    // (correctly) skips the row, same as it would for two genuinely simultaneous samples. A
    // short real delay here matches how this is actually used (30s apart via start()), not the
    // pathological zero-elapsed-time case.
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    sampler.sampleOnce(); // establishes the baseline, writes nothing
    await wait(30);
    sampler.sampleOnce();
    await wait(30);
    sampler.sampleOnce();

    const rows = db.prepare('SELECT * FROM system_metrics ORDER BY id').all() as any[];
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.host_cpu_pct).toBeGreaterThanOrEqual(0);
      expect(row.process_cpu_pct).toBeGreaterThanOrEqual(0);
      expect(row.host_mem_total_mb).toBeGreaterThan(0);
      expect(row.host_mem_used_mb).toBeGreaterThan(0);
      expect(row.host_mem_used_mb).toBeLessThanOrEqual(row.host_mem_total_mb);
      expect(row.process_rss_mb).toBeGreaterThan(0);
      expect(typeof row.created_at).toBe('number');
    }
  });

  it('start()/stop() schedule and cancel the timer without throwing', () => {
    expect(() => {
      sampler.start(50);
      sampler.stop();
    }).not.toThrow();
  });
});
