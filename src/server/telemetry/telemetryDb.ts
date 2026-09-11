import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Separate file from game.db/game.dev.db (see ../db.ts) — telemetry write volume and retention
// needs are unrelated to account/progression data, and this way a telemetry.db reset/prune
// later never touches real player accounts.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILENAME = process.env.NODE_ENV === 'production' ? 'telemetry.db' : 'telemetry.dev.db';
const DEFAULT_DB_PATH = process.env.TELEMETRY_DB_PATH || path.join(DATA_DIR, DB_FILENAME);

const SCHEMA_SQL = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS game_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id        TEXT NOT NULL,
    player_id     TEXT,
    class         TEXT,
    stage_id      INTEGER,
    party_size    INTEGER NOT NULL,
    build_version TEXT NOT NULL,
    event_type    TEXT NOT NULL,
    wave          INTEGER,
    elapsed_ms    INTEGER NOT NULL,
    payload       TEXT,
    created_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_game_events_run   ON game_events(run_id);
  CREATE INDEX IF NOT EXISTS idx_game_events_type  ON game_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_game_events_build ON game_events(build_version);

  CREATE TABLE IF NOT EXISTS error_log (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    source           TEXT NOT NULL,
    category         TEXT NOT NULL,
    message          TEXT NOT NULL,
    signature_hash   TEXT NOT NULL UNIQUE,
    stack_trace      TEXT,
    context          TEXT,
    client_info      TEXT,
    build_version    TEXT,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    first_seen_at    INTEGER NOT NULL,
    last_seen_at     INTEGER NOT NULL,
    status           TEXT NOT NULL DEFAULT 'open',
    fixed_at         INTEGER,
    fixed_note       TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_error_log_status   ON error_log(status);
  CREATE INDEX IF NOT EXISTS idx_error_log_category ON error_log(category);
`;

/** Opens (and schema-initializes) a telemetry SQLite connection. Exported — not just used for
 * the production singleton below — so tests can point this at ':memory:' and get the exact same
 * schema/pragmas real telemetry.db gets, instead of a hand-duplicated copy that could drift. */
export function createTelemetryConnection(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  const db = new Database(dbPath);
  db.exec(SCHEMA_SQL);
  return db;
}

export const telemetryDb = createTelemetryConnection();
console.log(`📊 Telemetry database: ${DEFAULT_DB_PATH}`);
