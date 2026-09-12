import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTelemetryConnection } from './telemetryDb';
import { getEventSummary, getErrorSummary, getSystemMetricsSeries } from './telemetryQueries';

function seedEvent(
  db: Database.Database,
  eventType: string,
  opts: { wave?: number | null; payload?: unknown; playerId?: string } = {}
): void {
  db.prepare(
    `INSERT INTO game_events (run_id, player_id, class, stage_id, party_size, build_version, event_type, wave, elapsed_ms, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('run-1', opts.playerId ?? null, null, 1, 1, 'test', eventType, opts.wave ?? null, 1000, opts.payload ? JSON.stringify(opts.payload) : null, Date.now());
}

function seedError(db: Database.Database, source: string, category: string, occurrenceCount: number, status: string): void {
  db.prepare(
    `INSERT INTO error_log (source, category, message, signature_hash, occurrence_count, first_seen_at, last_seen_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(source, category, `${source}-${category}-message`, `${source}-${category}-${Math.random()}`, occurrenceCount, Date.now(), Date.now(), status);
}

describe('telemetryQueries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTelemetryConnection(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('getEventSummary', () => {
    it('counts events by type', () => {
      seedEvent(db, 'run_start');
      seedEvent(db, 'death', { payload: { cause: { sourceType: 'monster_contact', monsterType: 0 } } });
      seedEvent(db, 'death', { payload: { cause: { sourceType: 'monster_contact', monsterType: 0 } } });
      const summary = getEventSummary(db);
      expect(summary.totalEvents).toBe(3);
      expect(summary.eventCounts).toEqual({ run_start: 1, death: 2 });
    });

    it('breaks down death causes, grouping by sourceType+monsterType', () => {
      seedEvent(db, 'death', { payload: { cause: { sourceType: 'monster_contact', monsterType: 0 } } });
      seedEvent(db, 'death', { payload: { cause: { sourceType: 'monster_contact', monsterType: 0 } } });
      seedEvent(db, 'death', { payload: { cause: { sourceType: 'execute_deadline' } } });
      const summary = getEventSummary(db);
      expect(summary.deathCauses).toEqual([
        { sourceType: 'monster_contact', monsterType: 0, count: 2 },
        { sourceType: 'execute_deadline', count: 1 }
      ]);
    });

    it('tolerates a malformed payload row instead of throwing', () => {
      db.prepare(
        `INSERT INTO game_events (run_id, player_id, class, stage_id, party_size, build_version, event_type, wave, elapsed_ms, payload, created_at)
         VALUES ('run-1', NULL, NULL, 1, 1, 'test', 'death', NULL, 1000, 'not valid json{{{', ?)`
      ).run(Date.now());
      expect(() => getEventSummary(db)).not.toThrow();
      const summary = getEventSummary(db);
      expect(summary.totalEvents).toBe(1);
      expect(summary.deathCauses).toEqual([]);
    });

    it('builds wave distribution from wave_reached events only', () => {
      seedEvent(db, 'wave_reached', { wave: 5 });
      seedEvent(db, 'wave_reached', { wave: 5 });
      seedEvent(db, 'wave_reached', { wave: 10 });
      seedEvent(db, 'run_start', { wave: 1 }); // not wave_reached — must not count
      const summary = getEventSummary(db);
      expect(summary.waveDistribution).toEqual({ 5: 2, 10: 1 });
    });

    it('computes card pick rate by rarity from level_up_choice payloads', () => {
      seedEvent(db, 'level_up_choice', { payload: { picked: 'a', rarity: 'common' } });
      seedEvent(db, 'level_up_choice', { payload: { picked: 'b', rarity: 'mythic' } });
      seedEvent(db, 'level_up_choice', { payload: { picked: 'c', rarity: 'common' } });
      const summary = getEventSummary(db);
      expect(summary.cardPickRateByRarity).toEqual({ common: 2, mythic: 1 });
    });

    it('computes run outcomes and average playtime from run_end payloads', () => {
      seedEvent(db, 'run_end', { payload: { outcome: 'wipe', playtimeMs: 10_000 } });
      seedEvent(db, 'run_end', { payload: { outcome: 'wipe', playtimeMs: 20_000 } });
      seedEvent(db, 'run_end', { payload: { outcome: 'victory', playtimeMs: 60_000 } });
      const summary = getEventSummary(db);
      expect(summary.runOutcomes).toEqual({ wipe: 2, victory: 1 });
      expect(summary.averagePlaytimeMs).toBe(30_000);
      expect(summary.totalRunEnds).toBe(3);
    });

    it('returns averagePlaytimeMs: null when there are no run_end events', () => {
      seedEvent(db, 'run_start');
      const summary = getEventSummary(db);
      expect(summary.averagePlaytimeMs).toBeNull();
      expect(summary.totalRunEnds).toBe(0);
    });
  });

  describe('getErrorSummary', () => {
    it('splits open vs fixed counts and sums occurrences by source/category', () => {
      seedError(db, 'server', 'tick_error', 5, 'open');
      seedError(db, 'client', 'js_exception', 3, 'fixed');
      seedError(db, 'server', 'db_error', 1, 'open');
      const summary = getErrorSummary(db);
      expect(summary.totalSignatures).toBe(3);
      expect(summary.openCount).toBe(2);
      expect(summary.fixedCount).toBe(1);
      expect(summary.occurrencesBySource).toEqual({ server: 6, client: 3 });
      expect(summary.occurrencesByCategory).toEqual({ tick_error: 5, js_exception: 3, db_error: 1 });
    });

    it('sorts topErrors by occurrence_count descending and respects the limit', () => {
      seedError(db, 'server', 'tick_error', 2, 'open');
      seedError(db, 'server', 'server_exception', 50, 'open');
      seedError(db, 'client', 'render_error', 10, 'open');
      const summary = getErrorSummary(db, 2);
      expect(summary.topErrors).toHaveLength(2);
      expect(summary.topErrors[0].category).toBe('server_exception');
      expect(summary.topErrors[1].category).toBe('render_error');
    });
  });

  describe('getSystemMetricsSeries', () => {
    function seedMetric(createdAt: number, hostCpuPct: number): void {
      db.prepare(
        `INSERT INTO system_metrics (host_cpu_pct, host_mem_used_mb, host_mem_total_mb, process_cpu_pct, process_rss_mb, created_at)
         VALUES (?, 100, 1000, 5, 30, ?)`
      ).run(hostCpuPct, createdAt);
    }

    it('returns points oldest-first, ready for a chart x-axis', () => {
      seedMetric(3000, 30);
      seedMetric(1000, 10);
      seedMetric(2000, 20);
      const series = getSystemMetricsSeries(db);
      expect(series.map((p) => p.createdAt)).toEqual([1000, 2000, 3000]);
      expect(series.map((p) => p.hostCpuPct)).toEqual([10, 20, 30]);
    });

    it('caps to the most recent maxPoints samples', () => {
      for (let i = 0; i < 10; i++) seedMetric(i * 1000, i);
      const series = getSystemMetricsSeries(db, 3);
      expect(series).toHaveLength(3);
      expect(series.map((p) => p.createdAt)).toEqual([7000, 8000, 9000]); // the 3 most recent, still oldest-first
    });
  });
});
