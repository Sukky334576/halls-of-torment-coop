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

  CREATE TABLE IF NOT EXISTS system_metrics (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    host_cpu_pct      REAL NOT NULL,
    host_mem_used_mb  INTEGER NOT NULL,
    host_mem_total_mb INTEGER NOT NULL,
    process_cpu_pct   REAL NOT NULL,
    process_rss_mb    INTEGER NOT NULL,
    disk_used_mb      INTEGER,
    disk_total_mb     INTEGER,
    created_at        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_system_metrics_created ON system_metrics(created_at);
`;

/** Adds `column` to `table` if it isn't there yet — for columns introduced after a table already
 * shipped (disk_used_mb/disk_total_mb landed after system_metrics was already live on
 * production). `CREATE TABLE IF NOT EXISTS` alone would silently skip re-creating an existing
 * table, leaving old deployments on the pre-migration schema and failing on the next insert that
 * references the new column. Nullable/no-default columns only — SQLite can't ADD COLUMN NOT NULL
 * without a DEFAULT on a table that may already have rows. */
function ensureColumn(db: Database.Database, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** Opens (and schema-initializes) a telemetry SQLite connection. Exported — not just used for
 * the production singleton below — so tests can point this at ':memory:' and get the exact same
 * schema/pragmas real telemetry.db gets, instead of a hand-duplicated copy that could drift. */
export function createTelemetryConnection(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  const db = new Database(dbPath);
  db.exec(SCHEMA_SQL);
  ensureColumn(db, 'system_metrics', 'disk_used_mb', 'INTEGER');
  ensureColumn(db, 'system_metrics', 'disk_total_mb', 'INTEGER');
  return db;
}

// Under vitest, use a private in-memory DB instead of the real dev-DB file. No test actually
// reads/writes through this singleton — every test that needs a DB makes its own via
// createTelemetryConnection(':memory:') — but merely IMPORTING this module (transitively, via
// TelemetryBuffer.ts/server.ts) already runs this line as a side effect. With the real file,
// multiple test files running in parallel vitest workers all opened + migrated (ALTER TABLE) the
// SAME on-disk file concurrently, intermittently throwing 'SqliteError: database is locked' —
// found via a real, reproducible failure (not a flake) once this file gained an ALTER TABLE
// migration step, which is far more collision-prone than the plain CREATE TABLE IF NOT EXISTS
// this had before.
export const telemetryDb = process.env.VITEST ? createTelemetryConnection(':memory:') : createTelemetryConnection();
if (!process.env.VITEST) {
  console.log(`📊 Telemetry database: ${DEFAULT_DB_PATH}`);
}
