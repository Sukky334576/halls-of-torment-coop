import type Database from 'better-sqlite3';
import { telemetryDb } from './telemetryDb';
import { computeSignatureHash } from './signatureHash';
import type { GameEventInput, ErrorReportInput } from '../../shared/telemetryTypes';

const FLUSH_INTERVAL_MS = 1000;
// Comfortably above any realistic burst at this project's scale (MAX_PLAYERS_PER_ROOM=4, a
// handful of rooms) between two 1s flushes — a guard against a runaway caller, not a limit meant
// to ever actually bind in normal play.
export const MAX_PENDING_EVENTS = 5000;
// An error entry's context/stack/build_version only get re-captured this often while it keeps
// recurring within one flush window — occurrence_count still increments on every hit, this just
// avoids re-serializing an effectively-identical context object on every single occurrence.
const CONTEXT_REFRESH_INTERVAL_MS = 5000;

interface PendingErrorRow {
  source: string;
  category: string;
  message: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  clientInfo?: Record<string, unknown>;
  buildVersion?: string;
}

interface PendingErrorEntry {
  count: number;
  row: PendingErrorRow;
  lastContextUpdateAt: number;
}

function toPendingRow(input: ErrorReportInput): PendingErrorRow {
  return {
    source: input.source,
    category: input.category,
    message: input.message,
    stackTrace: input.stackTrace,
    context: input.context,
    clientInfo: input.clientInfo,
    buildVersion: input.buildVersion
  };
}

/** Buffers game_events/error_log writes in memory and flushes them as one batched transaction
 * on a timer — never from the 25Hz tick loop directly, since better-sqlite3 is fully synchronous
 * and a DB write on every tick call path would block the whole room's simulation on disk I/O. */
export class TelemetryBuffer {
  private pendingEvents: (GameEventInput & { createdAt: number })[] = [];
  private pendingErrors: Map<string, PendingErrorEntry> = new Map();
  private flushTimer: ReturnType<typeof setInterval>;
  private insertGameEventStmt: Database.Statement;
  private upsertErrorLogStmt: Database.Statement;

  constructor(private db: Database.Database, flushIntervalMs: number = FLUSH_INTERVAL_MS) {
    this.insertGameEventStmt = db.prepare(`
      INSERT INTO game_events
        (run_id, player_id, class, stage_id, party_size, build_version, event_type, wave, elapsed_ms, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    this.upsertErrorLogStmt = db.prepare(`
      INSERT INTO error_log
        (source, category, message, signature_hash, stack_trace, context, client_info,
         build_version, occurrence_count, first_seen_at, last_seen_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
      ON CONFLICT(signature_hash) DO UPDATE SET
        occurrence_count = occurrence_count + excluded.occurrence_count,
        last_seen_at      = excluded.last_seen_at,
        stack_trace        = excluded.stack_trace,
        context             = excluded.context,
        build_version        = excluded.build_version
    `);
    this.flushTimer = setInterval(() => this.flush(), flushIntervalMs);
    // A live flush timer alone shouldn't keep the process from exiting (e.g. during a script/
    // test run that never calls shutdown()).
    this.flushTimer.unref?.();
  }

  logEvent(row: GameEventInput): void {
    if (this.pendingEvents.length >= MAX_PENDING_EVENTS) return;
    this.pendingEvents.push({ ...row, createdAt: Date.now() });
  }

  /** Returns the computed signature hash — mostly useful for tests/debugging; callers don't
   * need it for normal use. */
  logError(input: ErrorReportInput): string {
    const signatureHash = computeSignatureHash(input.source, input.category, input.message, input.topFrame);
    const now = Date.now();
    const existing = this.pendingErrors.get(signatureHash);
    if (existing) {
      existing.count++;
      if (now - existing.lastContextUpdateAt > CONTEXT_REFRESH_INTERVAL_MS) {
        existing.row = toPendingRow(input);
        existing.lastContextUpdateAt = now;
      }
    } else {
      this.pendingErrors.set(signatureHash, { count: 1, row: toPendingRow(input), lastContextUpdateAt: now });
      console.error(`[telemetry] new error signature: ${signatureHash} (${input.category}: ${input.message})`);
    }
    return signatureHash;
  }

  private flush(): void {
    if (this.pendingEvents.length === 0 && this.pendingErrors.size === 0) return;
    const t0 = Date.now();
    const events = this.pendingEvents.splice(0);
    const errors = [...this.pendingErrors.entries()];
    this.pendingErrors.clear();

    try {
      this.db.transaction(() => {
        for (const e of events) {
          this.insertGameEventStmt.run(
            e.runId,
            e.playerId ?? null,
            e.playerClass ?? null,
            e.stageId ?? null,
            e.partySize,
            e.buildVersion,
            e.eventType,
            e.wave ?? null,
            e.elapsedMs,
            e.payload ? JSON.stringify(e.payload) : null,
            e.createdAt
          );
        }
        for (const [hash, entry] of errors) {
          const now = Date.now();
          this.upsertErrorLogStmt.run(
            entry.row.source,
            entry.row.category,
            entry.row.message,
            hash,
            entry.row.stackTrace ?? null,
            entry.row.context ? JSON.stringify(entry.row.context) : null,
            entry.row.clientInfo ? JSON.stringify(entry.row.clientInfo) : null,
            entry.row.buildVersion ?? null,
            entry.count,
            now,
            now
          );
        }
      })();
    } catch (err) {
      // Telemetry must never take gameplay down with it — a bad flush drops this batch and
      // moves on rather than throwing out to whatever triggered it (the flush timer, or
      // shutdown() during a crash handler).
      console.error('[telemetry] flush failed, batch dropped:', err);
      return;
    }

    const durationMs = Date.now() - t0;
    if (durationMs > 15) {
      this.logError({
        source: 'server',
        category: 'db_error',
        message: `telemetry flush took ${durationMs}ms (${events.length} events, ${errors.length} error signatures)`
      });
    }
  }

  /** Synchronous — better-sqlite3 has no async path, so by the time this returns the pending
   * batch is either on disk or has failed loudly to the console. Safe to call right before
   * process.exit() (see server.ts's uncaughtException/SIGTERM handlers). */
  shutdown(): void {
    clearInterval(this.flushTimer);
    this.flush();
  }
}

export const telemetryBuffer = new TelemetryBuffer(telemetryDb);

export function logGameEvent(row: GameEventInput): void {
  telemetryBuffer.logEvent(row);
}

export function logError(input: ErrorReportInput): void {
  telemetryBuffer.logError(input);
}

export function shutdownTelemetry(): void {
  telemetryBuffer.shutdown();
}
