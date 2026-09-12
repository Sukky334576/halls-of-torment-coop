import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTelemetryConnection } from './telemetryDb';
import { getEventSummary, getErrorSummary, getSystemMetricsSeries, getCardPickStats } from './telemetryQueries';

function seedEvent(
  db: Database.Database,
  eventType: string,
  opts: { wave?: number | null; payload?: unknown; playerId?: string; stageId?: number } = {}
): void {
  db.prepare(
    `INSERT INTO game_events (run_id, player_id, class, stage_id, party_size, build_version, event_type, wave, elapsed_ms, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'run-1',
    opts.playerId ?? null,
    null,
    opts.stageId ?? 1,
    1,
    'test',
    eventType,
    opts.wave ?? null,
    1000,
    opts.payload ? JSON.stringify(opts.payload) : null,
    Date.now()
  );
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

    it('filters to a single stage when stageId is given, and combines all stages when omitted', () => {
      seedEvent(db, 'wave_reached', { wave: 5, stageId: 1 });
      seedEvent(db, 'wave_reached', { wave: 20, stageId: 2 });
      seedEvent(db, 'wave_reached', { wave: 20, stageId: 2 });

      const stage1 = getEventSummary(db, 1);
      expect(stage1.totalEvents).toBe(1);
      expect(stage1.waveDistribution).toEqual({ 5: 1 });

      const stage2 = getEventSummary(db, 2);
      expect(stage2.totalEvents).toBe(2);
      expect(stage2.waveDistribution).toEqual({ 20: 2 });

      const allStages = getEventSummary(db);
      expect(allStages.totalEvents).toBe(3);
      expect(allStages.waveDistribution).toEqual({ 5: 1, 20: 2 });
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
    function seedMetric(createdAt: number, hostCpuPct: number, diskUsedMb: number | null = 5000): void {
      db.prepare(
        `INSERT INTO system_metrics (host_cpu_pct, host_mem_used_mb, host_mem_total_mb, process_cpu_pct, process_rss_mb, disk_used_mb, disk_total_mb, created_at)
         VALUES (?, 100, 1000, 5, 30, ?, 10000, ?)`
      ).run(hostCpuPct, diskUsedMb, createdAt);
    }

    it('passes through disk fields, including null for rows written before disk tracking existed', () => {
      seedMetric(1000, 10, 5000);
      seedMetric(2000, 20, null);
      const series = getSystemMetricsSeries(db);
      expect(series[0].diskUsedMb).toBe(5000);
      expect(series[0].diskTotalMb).toBe(10000);
      expect(series[1].diskUsedMb).toBeNull();
    });

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

  describe('getCardPickStats', () => {
    // Real TRAIT_POOL ids (src/shared/classes.ts) — the function filters against the real pool,
    // so a made-up id would silently disappear from the result and the test would prove nothing.
    const VITALITY = 'vitality_1'; // common, thaiName 'กายาเหล็กไหล (เลือดสูงสุด)'
    const STRENGTH = 'strength_1'; // rare, thaiName 'พลังยักษ์ทรงพลัง (เพิ่มดาเมจ)'

    it('computes offered/picked counts and pick rate per card, using the Thai display name', () => {
      // Offered together 3 times, but only ever actually picked once (33.3%).
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY, STRENGTH], picked: VITALITY } });
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY, STRENGTH], picked: STRENGTH } });
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY, STRENGTH], picked: STRENGTH } });

      const stats = getCardPickStats(db);
      const vitality = stats.find((s) => s.id === VITALITY)!;
      const strength = stats.find((s) => s.id === STRENGTH)!;

      expect(vitality.name).toBe('กายาเหล็กไหล (เลือดสูงสุด)');
      expect(vitality.timesOffered).toBe(3);
      expect(vitality.timesPicked).toBe(1);
      expect(vitality.pickRatePct).toBeCloseTo(33.3, 1);

      expect(strength.timesOffered).toBe(3);
      expect(strength.timesPicked).toBe(2);
      expect(strength.pickRatePct).toBeCloseTo(66.7, 1);
    });

    it('sorts worst pick rate first — the point of the whole view', () => {
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY, STRENGTH], picked: STRENGTH } }); // vitality never picked
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY, STRENGTH], picked: STRENGTH } });
      const stats = getCardPickStats(db);
      expect(stats[0].id).toBe(VITALITY); // 0% pick rate — worst — comes first
      expect(stats[0].pickRatePct).toBe(0);
    });

    it('excludes cards that have never been offered — no data yet is not the same as "ignored"', () => {
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY], picked: VITALITY } });
      const stats = getCardPickStats(db);
      expect(stats.some((s) => s.id === STRENGTH)).toBe(false);
    });

    it('filters to a single stage when stageId is given', () => {
      seedEvent(db, 'level_up_choice', { payload: { offered: [VITALITY], picked: VITALITY }, stageId: 1 });
      seedEvent(db, 'level_up_choice', { payload: { offered: [STRENGTH], picked: STRENGTH }, stageId: 2 });

      const stage1 = getCardPickStats(db, 1);
      expect(stage1.some((s) => s.id === VITALITY)).toBe(true);
      expect(stage1.some((s) => s.id === STRENGTH)).toBe(false);

      const stage2 = getCardPickStats(db, 2);
      expect(stage2.some((s) => s.id === STRENGTH)).toBe(true);
      expect(stage2.some((s) => s.id === VITALITY)).toBe(false);

      const allStages = getCardPickStats(db);
      expect(allStages.some((s) => s.id === VITALITY)).toBe(true);
      expect(allStages.some((s) => s.id === STRENGTH)).toBe(true);
    });
  });
});
