import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// One file, no separate DB server to run/manage — matches this project's scale (a friend-
// testing co-op game, not a service that needs concurrent-writer scaling). Lives outside
// dist/ and node_modules so it survives a rebuild/redeploy.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Separate file per environment so `npm run server` (local/dev) never touches — or gets
// reset alongside — real player accounts sitting in the production file. Matches the
// existing NODE_ENV convention from server.ts's IS_PRODUCTION. DB_PATH overrides both if
// you ever need a specific file (e.g. a one-off test run).
const DB_FILENAME = process.env.NODE_ENV === 'production' ? 'game.db' : 'game.dev.db';
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, DB_FILENAME);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
console.log(`🗄️  Database: ${DB_PATH}`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progression (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
}

const insertUserStmt = db.prepare(
  'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
);
const findUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const findUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const getProgressionStmt = db.prepare('SELECT data FROM progression WHERE user_id = ?');
const upsertProgressionStmt = db.prepare(`
  INSERT INTO progression (user_id, data, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);

export function createUser(username: string, passwordHash: string): UserRow {
  const info = insertUserStmt.run(username, passwordHash, Date.now());
  return findUserByIdStmt.get(info.lastInsertRowid) as UserRow;
}

export function findUserByUsername(username: string): UserRow | undefined {
  return findUserByUsernameStmt.get(username) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return findUserByIdStmt.get(id) as UserRow | undefined;
}

/** Returns the raw saved MetaSaveData JSON string, or null if this user never synced one. */
export function getProgression(userId: number): string | null {
  const row = getProgressionStmt.get(userId) as { data: string } | undefined;
  return row ? row.data : null;
}

/** `dataJson` is trusted to already be a JSON string — the shape itself is the client's
 * MetaSaveData, which this server intentionally does not validate (see server.ts route
 * comment): syncing your own progression isn't worth an anti-cheat schema check at this
 * project's current (friend-testing) scale. */
export function setProgression(userId: number, dataJson: string): void {
  upsertProgressionStmt.run(userId, dataJson, Date.now());
}
