import { MonsterType, PlayerClass } from './types';

export type GameEventType =
  | 'run_start'
  | 'level_up_choice'
  | 'death'
  | 'wave_reached'
  | 'boss_kill'
  | 'run_end';

export type DeathSourceType = 'monster_contact' | 'projectile' | 'boss_ability' | 'execute_deadline';

/** Why a player died — attached to ServerPlayer.takeDamage()/applyTrueDamage() by the GameRoom
 * call site that already knows what hit them, then read back off ServerPlayer.lastDeathCause
 * once the call returns true (see GameRoom.logDeathEvent). */
export interface DeathCause {
  sourceType: DeathSourceType;
  monsterType?: MonsterType;
  abilityId?: string;
}

export interface GameEventInput {
  runId: string;
  playerId?: string;
  playerClass?: PlayerClass;
  stageId?: number;
  partySize: number;
  buildVersion: string;
  eventType: GameEventType;
  wave?: number;
  elapsedMs: number;
  payload?: Record<string, unknown>;
}

export type ErrorSource = 'client' | 'server';

export type ErrorCategory =
  | 'js_exception'
  | 'promise_rejection'
  | 'render_error'
  | 'ws_disconnect'
  | 'ws_reconnect'
  | 'server_exception'
  | 'tick_error'
  | 'db_error'
  | 'high_latency'
  | 'logic_anomaly';

export interface ErrorReportInput {
  source: ErrorSource;
  category: ErrorCategory;
  message: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  /** Browser/OS/screen only — never IP or a device fingerprint (see the telemetry spec's
   * client_info whitelist guard). */
  clientInfo?: Record<string, unknown>;
  buildVersion?: string;
  /** Server-only: the first stack frame, folded into the signature hash so two different
   * server exceptions with a similarly-normalized message don't collide (see signatureHash.ts). */
  topFrame?: string;
}

/** What ClientTelemetry actually posts to POST /api/telemetry/errors — a subset of
 * ErrorReportInput with `source`/`topFrame` omitted (the server route fills source: 'client' in
 * itself; topFrame is a server-only signature-hash input, see signatureHash.ts's comment on why
 * a minified client stack can't be used the same way). */
export type ClientErrorReportPayload = Omit<ErrorReportInput, 'source' | 'topFrame'>;
