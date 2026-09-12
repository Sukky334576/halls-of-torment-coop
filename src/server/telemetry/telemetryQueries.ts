import type Database from 'better-sqlite3';
import { TRAIT_POOL } from '../../shared/classes';

/** Aggregation happens here in JS after a plain SELECT, not via SQLite's json_extract() on the
 * `payload` TEXT column — keeps this portable across whatever SQLite build better-sqlite3 bundles
 * (JSON1 support isn't guaranteed) and this project's data volume (friend-testing scale) is small
 * enough that scanning every row in JS is not a real cost. */

export interface DeathCauseCount {
  sourceType: string;
  monsterType?: number;
  count: number;
}

export interface BossKillCount {
  bossName: string;
  count: number;
}

export interface EventSummary {
  totalEvents: number;
  eventCounts: Record<string, number>;
  deathCauses: DeathCauseCount[];
  bossKills: BossKillCount[];
  waveDistribution: Record<number, number>;
  runOutcomes: Record<string, number>;
  averagePlaytimeMs: number | null;
  totalRunEnds: number;
}

/** `stageId` filters everything to one of the 3 stages (src/shared/stages.ts) when given —
 * omitted/undefined means all stages combined. Stages scale monster HP/damage very differently
 * (1.0/1.0 → 1.6/1.4 → 2.5/2.0 per GAME_WIKI.md), so mixing them is misleading for anything
 * difficulty-shaped: "most runs stall around wave 12" could be almost entirely a stage 3 effect
 * while stage 1 sails past it, and averaging the two together shows neither picture correctly. */
export function getEventSummary(db: Database.Database, stageId?: number): EventSummary {
  const rows = (
    stageId !== undefined
      ? db.prepare('SELECT event_type, wave, payload FROM game_events WHERE stage_id = ?').all(stageId)
      : db.prepare('SELECT event_type, wave, payload FROM game_events').all()
  ) as {
    event_type: string;
    wave: number | null;
    payload: string | null;
  }[];

  const eventCounts: Record<string, number> = {};
  const deathCauseMap = new Map<string, number>();
  const bossKillMap = new Map<string, number>();
  const waveDistribution: Record<number, number> = {};
  const runOutcomes: Record<string, number> = {};
  let totalPlaytimeMs = 0;
  let runEndCount = 0;

  for (const row of rows) {
    eventCounts[row.event_type] = (eventCounts[row.event_type] || 0) + 1;

    let payload: Record<string, any> | null = null;
    if (row.payload) {
      try {
        payload = JSON.parse(row.payload);
      } catch {
        payload = null; // A malformed payload row shouldn't break the whole summary.
      }
    }

    if (row.event_type === 'death' && payload?.cause?.sourceType) {
      const cause = payload.cause;
      const key = cause.monsterType !== undefined ? `${cause.sourceType}:${cause.monsterType}` : cause.sourceType;
      deathCauseMap.set(key, (deathCauseMap.get(key) || 0) + 1);
    }

    if (row.event_type === 'boss_kill') {
      // bossName is a human label (e.g. "Elite Golem") logged alongside bossType (GameRoom.ts's
      // logGameEvent('boss_kill', ...) call) — fall back to bossType if an older row predates
      // bossName being added, so a schema-migration gap doesn't just drop the row silently.
      const key = typeof payload?.bossName === 'string' ? payload.bossName : `type ${payload?.bossType ?? 'unknown'}`;
      bossKillMap.set(key, (bossKillMap.get(key) || 0) + 1);
    }

    if (row.event_type === 'wave_reached' && row.wave !== null) {
      waveDistribution[row.wave] = (waveDistribution[row.wave] || 0) + 1;
    }

    if (row.event_type === 'run_end' && payload) {
      if (typeof payload.outcome === 'string') {
        runOutcomes[payload.outcome] = (runOutcomes[payload.outcome] || 0) + 1;
      }
      if (typeof payload.playtimeMs === 'number') {
        totalPlaytimeMs += payload.playtimeMs;
        runEndCount++;
      }
    }
  }

  const deathCauses: DeathCauseCount[] = Array.from(deathCauseMap.entries())
    .map(([key, count]) => {
      const sepIndex = key.lastIndexOf(':');
      if (sepIndex === -1) return { sourceType: key, count };
      const monsterType = Number(key.slice(sepIndex + 1));
      return Number.isFinite(monsterType) ? { sourceType: key.slice(0, sepIndex), monsterType, count } : { sourceType: key, count };
    })
    .sort((a, b) => b.count - a.count);

  const bossKills: BossKillCount[] = Array.from(bossKillMap.entries())
    .map(([bossName, count]) => ({ bossName, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEvents: rows.length,
    eventCounts,
    deathCauses,
    bossKills,
    waveDistribution,
    runOutcomes,
    averagePlaytimeMs: runEndCount > 0 ? Math.round(totalPlaytimeMs / runEndCount) : null,
    totalRunEnds: runEndCount
  };
}

export interface CardPickStat {
  id: string;
  name: string;
  rarity: string;
  timesOffered: number;
  timesPicked: number;
  /** Percent of offers this card was actually chosen on — the useful balance signal (a card
   * offered 500 times and picked 5 is clearly weak; a card only ever offered twice tells you
   * almost nothing yet, which is why timesOffered is surfaced too instead of just a bare %). */
  pickRatePct: number;
}

/** Per-card breakdown (not just per-rarity) of how often each TRAIT_POOL card was offered vs.
 * actually picked in a level_up_choice — sorted worst-pick-rate-first, since the point is
 * spotting cards nobody chooses so they can be buffed/reworked. Only includes cards that have
 * been offered at least once; a card that's never appeared yet has no signal either way (not
 * the same as "offered but ignored"). */
export function getCardPickStats(db: Database.Database, stageId?: number): CardPickStat[] {
  const rows = (
    stageId !== undefined
      ? db.prepare("SELECT payload FROM game_events WHERE event_type = 'level_up_choice' AND stage_id = ?").all(stageId)
      : db.prepare("SELECT payload FROM game_events WHERE event_type = 'level_up_choice'").all()
  ) as { payload: string | null }[];

  const timesOffered = new Map<string, number>();
  const timesPicked = new Map<string, number>();

  for (const row of rows) {
    if (!row.payload) continue;
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(row.payload);
    } catch {
      continue;
    }
    if (Array.isArray(payload.offered)) {
      for (const id of payload.offered) {
        if (typeof id === 'string') timesOffered.set(id, (timesOffered.get(id) || 0) + 1);
      }
    }
    if (typeof payload.picked === 'string') {
      timesPicked.set(payload.picked, (timesPicked.get(payload.picked) || 0) + 1);
    }
  }

  const stats: CardPickStat[] = [];
  for (const trait of TRAIT_POOL) {
    const offered = timesOffered.get(trait.id) || 0;
    if (offered === 0) continue; // No data yet for this card — not the same as "picked 0%".
    const picked = timesPicked.get(trait.id) || 0;
    stats.push({
      id: trait.id,
      name: trait.thaiName || trait.name,
      rarity: trait.rarity,
      timesOffered: offered,
      timesPicked: picked,
      pickRatePct: Math.round((picked / offered) * 1000) / 10
    });
  }

  return stats.sort((a, b) => a.pickRatePct - b.pickRatePct);
}

export interface TopError {
  category: string;
  message: string;
  source: string;
  occurrenceCount: number;
  status: string;
  lastSeenAt: number;
}

export interface ErrorSummary {
  totalSignatures: number;
  openCount: number;
  fixedCount: number;
  occurrencesBySource: Record<string, number>;
  occurrencesByCategory: Record<string, number>;
  topErrors: TopError[];
}

export function getErrorSummary(db: Database.Database, topN: number = 20): ErrorSummary {
  const rows = db
    .prepare('SELECT source, category, message, occurrence_count, status, last_seen_at FROM error_log')
    .all() as {
    source: string;
    category: string;
    message: string;
    occurrence_count: number;
    status: string;
    last_seen_at: number;
  }[];

  let openCount = 0;
  let fixedCount = 0;
  const occurrencesBySource: Record<string, number> = {};
  const occurrencesByCategory: Record<string, number> = {};

  for (const row of rows) {
    if (row.status === 'open') openCount++;
    else fixedCount++;
    occurrencesBySource[row.source] = (occurrencesBySource[row.source] || 0) + row.occurrence_count;
    occurrencesByCategory[row.category] = (occurrencesByCategory[row.category] || 0) + row.occurrence_count;
  }

  const topErrors: TopError[] = [...rows]
    .sort((a, b) => b.occurrence_count - a.occurrence_count)
    .slice(0, topN)
    .map((r) => ({
      category: r.category,
      message: r.message,
      source: r.source,
      occurrenceCount: r.occurrence_count,
      status: r.status,
      lastSeenAt: r.last_seen_at
    }));

  return { totalSignatures: rows.length, openCount, fixedCount, occurrencesBySource, occurrencesByCategory, topErrors };
}

export interface SystemMetricPoint {
  createdAt: number;
  hostCpuPct: number;
  hostMemUsedMb: number;
  hostMemTotalMb: number;
  processCpuPct: number;
  processRssMb: number;
  // Nullable — rows written before disk tracking was added have neither, and getDiskUsage()
  // itself returns null if statfs isn't available (see SystemMetricsSampler).
  diskUsedMb: number | null;
  diskTotalMb: number | null;
}

/** Returns the most recent `maxPoints` samples, oldest first (chart-ready order) — bounds the
 * response size regardless of how long system_metrics has been accumulating (see
 * SystemMetricsSampler; there's no retention/prune policy on this table yet, same accepted gap
 * as game_events/error_log). Default 500 points at the sampler's 30s cadence is ~4 hours of
 * history, a reasonable default trend window for a dashboard chart. */
export function getSystemMetricsSeries(db: Database.Database, maxPoints: number = 500): SystemMetricPoint[] {
  const rows = db
    .prepare(
      `SELECT host_cpu_pct, host_mem_used_mb, host_mem_total_mb, process_cpu_pct, process_rss_mb,
              disk_used_mb, disk_total_mb, created_at
       FROM system_metrics ORDER BY created_at DESC LIMIT ?`
    )
    .all(maxPoints) as {
    host_cpu_pct: number;
    host_mem_used_mb: number;
    host_mem_total_mb: number;
    process_cpu_pct: number;
    process_rss_mb: number;
    disk_used_mb: number | null;
    disk_total_mb: number | null;
    created_at: number;
  }[];

  return rows.reverse().map((r) => ({
    createdAt: r.created_at,
    hostCpuPct: r.host_cpu_pct,
    hostMemUsedMb: r.host_mem_used_mb,
    hostMemTotalMb: r.host_mem_total_mb,
    processCpuPct: r.process_cpu_pct,
    diskUsedMb: r.disk_used_mb,
    diskTotalMb: r.disk_total_mb,
    processRssMb: r.process_rss_mb
  }));
}
