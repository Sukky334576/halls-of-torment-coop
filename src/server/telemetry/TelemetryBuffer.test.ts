import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { TelemetryBuffer, MAX_PENDING_EVENTS } from './TelemetryBuffer';
import { createTelemetryConnection } from './telemetryDb';
import { computeSignatureHash } from './signatureHash';

/** Every test drives its own in-memory DB + a TelemetryBuffer with a flush interval far longer
 * than any test run, calling the private flush() directly (`as any`, matching this project's
 * existing test style for private members — see GameRoom.test.ts) instead of waiting on the
 * real timer. */
function makeBuffer(): { db: Database.Database; buffer: TelemetryBuffer } {
  const db = createTelemetryConnection(':memory:');
  const buffer = new TelemetryBuffer(db, 999_999);
  return { db, buffer };
}

describe('TelemetryBuffer', () => {
  let db: Database.Database;
  let buffer: TelemetryBuffer;

  beforeEach(() => {
    ({ db, buffer } = makeBuffer());
  });

  afterEach(() => {
    buffer.shutdown();
    db.close();
  });

  it('upsert on a repeat signature bumps occurrence_count but never resets status back to open', () => {
    buffer.logError({ source: 'server', category: 'tick_error', message: 'monster 42 at x=13 y=99' });
    (buffer as any).flush();

    const hash = computeSignatureHash('server', 'tick_error', 'monster 42 at x=13 y=99');
    db.prepare('UPDATE error_log SET status = ? WHERE signature_hash = ?').run('fixed', hash);

    // Same normalized shape, different numbers — must hash to the same row.
    buffer.logError({ source: 'server', category: 'tick_error', message: 'monster 7 at x=500 y=2' });
    (buffer as any).flush();

    const row = db.prepare('SELECT status, occurrence_count FROM error_log WHERE signature_hash = ?').get(hash) as
      | { status: string; occurrence_count: number }
      | undefined;
    expect(row?.status).toBe('fixed');
    expect(row?.occurrence_count).toBe(2);
  });

  it('normalizes uuid/player-id/number variance in the message into one signature', () => {
    buffer.logError({
      source: 'server',
      category: 'server_exception',
      message: 'player p_42 hit monster 7 for 100 dmg (run a1b2c3d4-e5f6-7890-abcd-ef1234567890)'
    });
    buffer.logError({
      source: 'server',
      category: 'server_exception',
      message: 'player p_999 hit monster 3 for 250 dmg (run 00000000-1111-2222-3333-444444444444)'
    });
    (buffer as any).flush();

    const rows = db.prepare('SELECT * FROM error_log').all() as { occurrence_count: number }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].occurrence_count).toBe(2);
  });

  it('keeps a distinct signature per category even when the normalized message matches', () => {
    buffer.logError({ source: 'server', category: 'tick_error', message: 'anomaly at wave 5' });
    buffer.logError({ source: 'server', category: 'logic_anomaly', message: 'anomaly at wave 9' });
    (buffer as any).flush();

    const rows = db.prepare('SELECT * FROM error_log').all();
    expect(rows).toHaveLength(2);
  });

  it('a failed flush (closed DB) is swallowed, not thrown out to the caller', () => {
    buffer.logEvent({ runId: 'r1', partySize: 1, buildVersion: 'test', eventType: 'run_start', elapsedMs: 0 });
    db.close(); // guarantees the next flush's statement.run() throws
    expect(() => (buffer as any).flush()).not.toThrow();
  });

  it('MAX_PENDING_EVENTS guard drops events past the cap instead of growing unbounded', () => {
    for (let i = 0; i < MAX_PENDING_EVENTS + 50; i++) {
      buffer.logEvent({ runId: 'r1', partySize: 1, buildVersion: 'test', eventType: 'wave_reached', elapsedMs: i });
    }
    expect((buffer as any).pendingEvents.length).toBe(MAX_PENDING_EVENTS);

    (buffer as any).flush();
    const count = (db.prepare('SELECT COUNT(*) AS n FROM game_events').get() as { n: number }).n;
    expect(count).toBe(MAX_PENDING_EVENTS);
  });

  it('writes a game_event row with the expected columns', () => {
    buffer.logEvent({
      runId: 'run-abc',
      playerId: 'p_1',
      playerClass: 'archer' as any,
      stageId: 2,
      partySize: 3,
      buildVersion: 'test-build',
      eventType: 'death',
      wave: 12,
      elapsedMs: 456_000,
      payload: { cause: { sourceType: 'monster_contact' } }
    });
    (buffer as any).flush();

    const row = db.prepare('SELECT * FROM game_events').get() as any;
    expect(row.run_id).toBe('run-abc');
    expect(row.player_id).toBe('p_1');
    expect(row.class).toBe('archer');
    expect(row.stage_id).toBe(2);
    expect(row.party_size).toBe(3);
    expect(row.event_type).toBe('death');
    expect(row.wave).toBe(12);
    expect(row.elapsed_ms).toBe(456_000);
    expect(JSON.parse(row.payload)).toEqual({ cause: { sourceType: 'monster_contact' } });
  });
});
