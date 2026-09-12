// Must be the first import — see loadEnv.ts for why.
import './loadEnv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import serveStatic from 'serve-static';
import { ClientMessage, ServerMessage, PlayerClass, RoomSummary } from '../shared/types';
import { GameRoom } from './engine/GameRoom';
import { createUser, findUserByUsername, findUserById, getProgression, setProgression } from './db';
import { hashPassword, verifyPassword, signToken, verifyToken, isRateLimited, USERNAME_RE, MIN_PASSWORD_LENGTH } from './auth';
import { logGameEvent, logError, shutdownTelemetry } from './telemetry/TelemetryBuffer';
import { telemetryDb } from './telemetry/telemetryDb';
import { getEventSummary, getErrorSummary, getSystemMetricsSeries, getCardPickStats } from './telemetry/telemetryQueries';
import { SystemMetricsSampler } from './telemetry/systemMetrics';
import { SERVER_BUILD_VERSION } from './telemetry/buildVersion';
import type { GameEventType, ErrorCategory } from '../shared/telemetryTypes';
import fs from 'fs';

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  // Stable per-device identity (persisted client-side) used as the GameRoom player key,
  // so a refresh/reconnect resumes the same in-progress character instead of a fresh one.
  deviceId: string;
  name: string;
  playerClass: PlayerClass;
  ready: boolean;
  roomId: string | null;
  unlockedSkills?: string[];
  treePassives?: Record<string, number>;
  verified: boolean;
}

const PORT = 8080;
// `npm run server` (no NODE_ENV) behaves as before for local dev — the Vite dev server on
// :3000 still serves the client and proxies /ws here. `npm run server:prod` sets this so a
// deployed box only needs one process/port: this server also serves the built client below.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Serves the Vite build (`npm run build` -> dist/) directly. Needed in production because
// `vite preview` has no /ws proxy config (only `vite dev` does), which left the WebSocket
// completely unreachable if you tried to run a build with `vite preview` standalone.
const serveClientBuild = serveStatic(path.resolve(__dirname, '../../dist'), { fallthrough: true });
const clients: Map<string, ConnectedClient> = new Map();
let nextClientId = 1;

// Multiple concurrent rooms — anyone can create one or join any open one from the public
// room browser (see main-menu -> multiplayer flow). Each room exists (players can join,
// pick a class, ready up) before it's actually started; START_GAME starts the room the
// sender is already in rather than creating a new one, unlike the old single-room model.
interface RoomEntry {
  room: GameRoom;
  name: string;
  hostClientId: string;
  hostName: string;
  // Plain in-memory string, never persisted or sent back to clients (see RoomSummary's
  // hasPassword) — a lightweight room passcode shared verbally/by chat between friends,
  // not an account credential, so this doesn't warrant hashing like login passwords do.
  password: string | null;
}
const MAX_PLAYERS_PER_ROOM = 4;
// A raw WS client bypasses any maxlength on the real UI's inputs entirely, so these need
// enforcing here — otherwise an oversized name/room name gets re-broadcast to everyone in
// LOBBY_STATE/ROOM_LIST on every ready-toggle/join/leave, a cheap bandwidth/CPU amplification.
const MAX_NAME_LENGTH = 32;
const MAX_ROOM_NAME_LENGTH = 40;
const MAX_ROOM_PASSWORD_LENGTH = 64;
const MAX_DEVICE_ID_LENGTH = 128;
// Each started room runs its own tick-loop simulation (SpatialGrid, HordeDirector) — without
// a ceiling, one client could open many connections and spin up unbounded live simulations.
const MAX_ROOMS = 100;
const rooms: Map<string, RoomEntry> = new Map();
let nextRoomId = 1;

function getClientRoom(client: ConnectedClient): RoomEntry | undefined {
  return client.roomId ? rooms.get(client.roomId) : undefined;
}

function roomSummaries(): RoomSummary[] {
  return Array.from(rooms.entries()).map(([id, entry]) => ({
    id,
    name: entry.name,
    hostName: entry.hostName,
    hasPassword: !!entry.password,
    playerCount: entry.room.getPlayerCount(),
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    isStarted: entry.room.isStarted && !entry.room.isOver
  }));
}

// Only pushed to clients who are actually browsing (not already in a room) — everyone else
// doesn't need it and would just be wasted sends on every create/join/leave/start.
function broadcastRoomList() {
  const msg: ServerMessage = { type: 'ROOM_LIST', rooms: roomSummaries() };
  const payload = JSON.stringify(msg);
  for (const client of clients.values()) {
    if (!client.roomId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastRoomState(roomId: string) {
  const entry = rooms.get(roomId);
  if (!entry) return;
  const playerList = Array.from(clients.values())
    .filter((c) => c.roomId === roomId)
    .map((c) => ({ id: c.id, name: c.name, playerClass: c.playerClass, ready: c.ready }));

  const msg: ServerMessage = {
    type: 'LOBBY_STATE',
    players: playerList,
    isStarted: entry.room.isStarted && !entry.room.isOver,
    stageId: entry.room.getStageId()
  };
  broadcastToRoom(roomId, msg);
}

// Optional shared invite code (set PARTY_CODE env var) so a shared tunnel URL
// doesn't let random strangers auto drop into an active crusade.
// Unset by default to keep local/LAN testing frictionless.
const PARTY_CODE = process.env.PARTY_CODE || null;
if (PARTY_CODE) {
  console.log(`🔑 Party code required to join: ${PARTY_CODE}`);
}

export function grantGoldToAll(amount: number): { success: boolean; amount: number; activePlayers: number; grantId: string } {
  const grantId = `grant_${Date.now()}`;
  const thaiMsg = `🎁 ของขวัญจากเซิร์ฟเวอร์: ได้รับ ${amount.toLocaleString()} เหรียญวิญญาณ เรียบร้อย!`;
  const engMsg = `🎁 Server Reward: ${amount.toLocaleString()} Soul Coins awarded!`;

  const msg: ServerMessage = {
    type: 'GRANT_GOLD',
    amount,
    grantId,
    message: engMsg,
    thaiMessage: thaiMsg
  };
  const payload = JSON.stringify(msg);

  let activeCount = 0;
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
      activeCount++;
    }
  }

  // If any match is in progress, also add to that room's teamGold in-game!
  for (const entry of rooms.values()) {
    if (entry.room.isStarted && !entry.room.isOver) {
      entry.room.grantBonusGold(amount);
    }
  }

  console.log(`💰 Airdropped ${amount} Gold to ${activeCount} active players! (grantId: ${grantId})`);
  return { success: true, amount, activePlayers: activeCount, grantId };
}

// --- Account system: username/password login + server-side progression sync ---
// No framework (see the rest of this file) — a tiny manual body reader instead of a
// body-parsing middleware, matching how /api/grant-gold already just reads query params.
const MAX_BODY_BYTES = 64 * 1024; // Progression saves are a modest JSON blob; way over-generous.
function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** These handlers are `async` but called without `await`/`.catch()` below — an unhandled
 * rejection (e.g. a DB error) would otherwise crash the whole process (Node terminates on
 * unhandled rejections by default). Wraps any of them into a generic 500 instead. */
function safeHandler(
  fn: (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>
): (req: http.IncomingMessage, res: http.ServerResponse) => void {
  return (req, res) => {
    fn(req, res).catch((err) => {
      console.error('Unhandled error in HTTP handler:', err);
      if (!res.headersSent) {
        sendJson(res, 500, { success: false, error: 'Internal server error' });
      }
    });
  };
}

/** The real client IP for rate-limiting. Behind nginx (see the deploy's site config),
 * `req.socket.remoteAddress` is always 127.0.0.1 — every request looks like it comes from the
 * same place, so isRateLimited(ip) would throttle one shared bucket for every visitor instead
 * of one per real client. `X-Real-IP` is nginx's own view of the connecting IP ($remote_addr,
 * not client-suppliable) so it's trustworthy; X-Forwarded-For's last hop is equivalent but only
 * used as a fallback since earlier hops in that header can be forged by the client. */
function getClientIp(req: http.IncomingMessage): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor) {
    const hops = forwardedFor.split(',').map((h) => h.trim());
    return hops[hops.length - 1];
  }
  return req.socket.remoteAddress || 'unknown';
}

/** Reads the Bearer token from the Authorization header. Returns the authenticated user id,
 * or null (and already wrote a 401 response) if the token is missing/invalid/stale.
 *
 * A signature-valid JWT alone isn't enough — TOKEN_TTL is 30 days, so a token issued against a
 * `users` row that no longer exists (dev DB reset/recreated, or an account otherwise removed)
 * still verifies fine. GET /api/progression masked this (a SELECT on a nonexistent user_id just
 * returns no rows), but POST /api/progression's INSERT has a FOREIGN KEY REFERENCES users(id)
 * and crashed with an unhandled 500 instead of a clean, already-client-handled 401. Checking the
 * user still exists turns that crash into the same "please log in again" case as a missing token. */
function requireAuth(req: http.IncomingMessage, res: http.ServerResponse): number | null {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload || !findUserById(payload.uid)) {
    sendJson(res, 401, { success: false, error: 'Missing or invalid auth token' });
    return null;
  }
  return payload.uid;
}

async function handleRegister(req: http.IncomingMessage, res: http.ServerResponse) {
  // Namespaced key so this doesn't share a bucket with /api/login's throttle on the same IP —
  // a burst of failed logins shouldn't also block someone from registering, or vice versa.
  const ip = `register:${getClientIp(req)}`;
  if (isRateLimited(ip)) {
    return sendJson(res, 429, { success: false, error: 'Too many registration attempts — try again in a minute' });
  }

  let body: { username?: string; password?: string };
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { success: false, error: 'Invalid JSON body' });
  }
  const username = (body.username || '').trim();
  const password = body.password || '';

  if (!USERNAME_RE.test(username)) {
    return sendJson(res, 400, { success: false, error: 'Username must be 3-20 letters, numbers, or underscores' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return sendJson(res, 400, { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (findUserByUsername(username)) {
    return sendJson(res, 409, { success: false, error: 'Username already taken' });
  }

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = createUser(username, passwordHash);
  } catch (err) {
    // The findUserByUsername check above isn't atomic with this insert — two concurrent
    // registrations for the same name can both pass it, and the second hits the column's
    // UNIQUE constraint here instead. Treat that specific case as the same 409, not a 500.
    if (err instanceof Error && 'code' in err && String((err as { code: unknown }).code).startsWith('SQLITE_CONSTRAINT')) {
      return sendJson(res, 409, { success: false, error: 'Username already taken' });
    }
    throw err;
  }
  const token = signToken(user.id);
  console.log(`📝 New account registered: ${username}`);
  sendJson(res, 201, { success: true, token, username: user.username });
}

async function handleLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return sendJson(res, 429, { success: false, error: 'Too many login attempts — try again in a minute' });
  }

  let body: { username?: string; password?: string };
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { success: false, error: 'Invalid JSON body' });
  }
  const username = (body.username || '').trim();
  const password = body.password || '';

  const user = findUserByUsername(username);
  // Same generic message whether the username doesn't exist or the password is wrong —
  // confirming which one was wrong would let an attacker enumerate registered usernames.
  const genericError = { success: false, error: 'Invalid username or password' };
  if (!user) {
    return sendJson(res, 401, genericError);
  }
  const passwordOk = await verifyPassword(password, user.password_hash);
  if (!passwordOk) {
    return sendJson(res, 401, genericError);
  }

  const token = signToken(user.id);
  sendJson(res, 200, { success: true, token, username: user.username });
}

async function handleGetProgression(req: http.IncomingMessage, res: http.ServerResponse) {
  const userId = requireAuth(req, res);
  if (userId === null) return;

  const raw = getProgression(userId);
  // `data` is already a JSON-shaped object once parsed here — the client sends/receives
  // its MetaSaveData directly, not double-encoded as a JSON string within JSON.
  sendJson(res, 200, { success: true, data: raw ? JSON.parse(raw) : null });
}

async function handleSaveProgression(req: http.IncomingMessage, res: http.ServerResponse) {
  const userId = requireAuth(req, res);
  if (userId === null) return;

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { success: false, error: 'Invalid JSON body' });
  }
  // Intentionally not schema-validated (see db.ts setProgression comment) — this project's
  // current friend-testing scale doesn't warrant an anti-cheat check on your own save data.
  setProgression(userId, JSON.stringify(body));
  sendJson(res, 200, { success: true });
}

// --- Telemetry ingest: POST /api/telemetry/events, POST /api/telemetry/errors ---
// Deliberately unauthenticated, like /api/grant-gold — this project's other no-auth internal
// endpoint (see testing_phase_known_risks memory) — rather than requireAuth()'d like
// /api/progression: telemetry has to accept reports from guests too (never logged in is a fully
// supported way to play, see AuthClient's comment). Guarded instead by two independent caps: a
// per-IP request-rate limit (isTelemetryRateLimited, below) and a per-request payload cap
// (MAX_TELEMETRY_BATCH/MAX_TELEMETRY_STRING) — together they bound both "how often" and "how
// much per hit" a spammer (or a runaway client bug) can push, without needing a login.
const MAX_TELEMETRY_BATCH = 50;
const MAX_TELEMETRY_STRING = 4000;

// A dedicated limiter, not auth.ts's isRateLimited() (that one is tuned for login brute-force —
// 8 attempts/60s — far stricter than telemetry's legitimate traffic: ClientTelemetry alone
// flushes every 3s whenever it has something queued, ~20 req/min from one healthy client during
// an error burst). 40/60s per IP gives headroom over that normal cadence while still bounding a
// deliberate spammer to a fixed ceiling — the batch/string caps above are the primary defense,
// this is a second layer against sheer request volume specifically.
const TELEMETRY_RATE_WINDOW_MS = 60_000;
const MAX_TELEMETRY_REQUESTS_PER_WINDOW = 40;
const telemetryRequestLog = new Map<string, number[]>();

function isTelemetryRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (telemetryRequestLog.get(ip) || []).filter((t) => now - t < TELEMETRY_RATE_WINDOW_MS);
  attempts.push(now);
  telemetryRequestLog.set(ip, attempts);
  return attempts.length > MAX_TELEMETRY_REQUESTS_PER_WINDOW;
}

function capString(value: unknown, max: number = MAX_TELEMETRY_STRING): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

const VALID_GAME_EVENT_TYPES = new Set<GameEventType>([
  'run_start',
  'level_up_choice',
  'death',
  'wave_reached',
  'boss_kill',
  'run_end'
]);

async function handleTelemetryEvents(req: http.IncomingMessage, res: http.ServerResponse) {
  if (isTelemetryRateLimited(getClientIp(req))) {
    return sendJson(res, 429, { success: false, error: 'Too many telemetry requests — try again shortly' });
  }
  let body: { events?: unknown[] };
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { success: false, error: 'Invalid JSON body' });
  }
  const events = Array.isArray(body.events) ? body.events.slice(0, MAX_TELEMETRY_BATCH) : [];
  let accepted = 0;
  for (const raw of events) {
    const e = asRecord(raw);
    if (!e) continue;
    const runId = capString(e.runId, 200);
    const eventType = capString(e.eventType, 40);
    if (
      !runId ||
      !eventType ||
      !VALID_GAME_EVENT_TYPES.has(eventType as GameEventType) ||
      typeof e.elapsedMs !== 'number' ||
      typeof e.partySize !== 'number'
    )
      continue;
    // elapsed_ms is a client-reported DURATION (safe from clock skew — it's a relative span, not
    // an absolute time), but created_at is always server time below, never anything the client
    // supplies — see the telemetry spec's guard against trusting client wall-clock.
    logGameEvent({
      runId,
      playerId: capString(e.playerId, 200),
      playerClass: capString(e.playerClass, 40) as PlayerClass | undefined,
      stageId: typeof e.stageId === 'number' ? e.stageId : undefined,
      partySize: e.partySize,
      buildVersion: capString(e.buildVersion, 100) || 'unknown-client',
      eventType: eventType as GameEventType,
      wave: typeof e.wave === 'number' ? e.wave : undefined,
      elapsedMs: e.elapsedMs,
      payload: asRecord(e.payload)
    });
    accepted++;
  }
  sendJson(res, 200, { success: true, accepted });
}

// Client-supplied `category` was previously only length-capped, not checked against this list —
// an arbitrary string would flow straight into error_log and, if a future consumer (the
// telemetry dashboard included) ever rendered it unescaped, that's a stored-XSS vector from an
// unauthenticated endpoint. Rejecting anything outside the known set closes that off at the
// boundary regardless of how any downstream consumer renders it.
const VALID_ERROR_CATEGORIES = new Set<ErrorCategory>([
  'js_exception',
  'promise_rejection',
  'render_error',
  'ws_disconnect',
  'ws_reconnect',
  'server_exception',
  'tick_error',
  'db_error',
  'high_latency',
  'logic_anomaly'
]);

async function handleTelemetryErrors(req: http.IncomingMessage, res: http.ServerResponse) {
  if (isTelemetryRateLimited(getClientIp(req))) {
    return sendJson(res, 429, { success: false, error: 'Too many telemetry requests — try again shortly' });
  }
  let body: { errors?: unknown[] };
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { success: false, error: 'Invalid JSON body' });
  }
  const errors = Array.isArray(body.errors) ? body.errors.slice(0, MAX_TELEMETRY_BATCH) : [];
  let accepted = 0;
  for (const raw of errors) {
    const e = asRecord(raw);
    if (!e) continue;
    const category = capString(e.category, 40);
    const message = capString(e.message, 500);
    if (!category || !message || !VALID_ERROR_CATEGORIES.has(category as ErrorCategory)) continue;
    // client_info is whitelisted to browser/os/screen by ClientTelemetry itself before this ever
    // ships — never IP or a device fingerprint (see the telemetry spec's guard on this field).
    logError({
      source: 'client',
      category: category as ErrorCategory,
      message,
      stackTrace: capString(e.stackTrace),
      context: asRecord(e.context),
      clientInfo: asRecord(e.clientInfo),
      buildVersion: capString(e.buildVersion, 100)
    });
    accepted++;
  }
  sendJson(res, 200, { success: true, accepted });
}

// --- Telemetry dashboard: GET /admin/telemetry (page) + GET /api/admin/telemetry/summary (data) ---
// The page briefly lived at /api/admin/telemetry/dashboard instead — nginx (see the deploy's site
// config) originally only proxied /ws and /api/ to this Node process, so a route outside /api/
// (this one) silently served the GAME's login page instead of ever reaching this handler (its SPA
// catch-all, `try_files $uri $uri/ /index.html`, returns 200 with the wrong page — no error to
// notice). Moved to /api/ as an immediate fix, then back here once nginx got its own
// `location /admin/` proxy block added (matching /api/'s shape, same api_zone rate limit) — this
// URL reads better for a page that isn't really a JSON API endpoint.
// Separate secret from JWT_SECRET — this isn't a player account, there's no admin/role concept
// in the `users` table today (see GAME_WIKI.md's telemetry section), and this data (error stack
// traces, per-player behavior patterns) shouldn't be reachable by just any registered player.
// Same insecure-dev-default-with-warning pattern as JWT_SECRET (auth.ts) for local dev.
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-only-admin-secret-set-ADMIN_SECRET-before-deploying';
if (!process.env.ADMIN_SECRET) {
  console.warn('⚠️  ADMIN_SECRET not set — using an insecure development default. Set it before deploying.');
}

/** Returns true (caller proceeds) or has already written a 401/429 response and returned false.
 * Reuses auth.ts's isRateLimited() — the same brute-force-guard purpose as login, so sharing its
 * bucket/threshold is fine, not a separate concern like the telemetry ingest rate limit above. */
function requireAdminSecret(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const provided = req.headers['x-admin-secret'];
  if (typeof provided === 'string' && provided === ADMIN_SECRET) return true;
  if (isRateLimited(`admin:${getClientIp(req)}`)) {
    sendJson(res, 429, { success: false, error: 'Too many attempts — try again shortly' });
    return false;
  }
  sendJson(res, 401, { success: false, error: 'Missing or invalid admin secret' });
  return false;
}

// 30s cadence: frequent enough to see a trend on the dashboard chart, far below anything that
// could matter for load (one plain SELECT+INSERT every 30s, nowhere near the 25Hz tick path).
const SYSTEM_METRICS_INTERVAL_MS = 30_000;
const systemMetricsSampler = new SystemMetricsSampler(telemetryDb);
systemMetricsSampler.start(SYSTEM_METRICS_INTERVAL_MS);

function handleTelemetrySummary(req: http.IncomingMessage, res: http.ServerResponse) {
  if (!requireAdminSecret(req, res)) return;

  // ?stage=1|2|3 filters the stage-shaped stats (event/card breakdowns) — omitted or anything
  // that doesn't parse to a real stage id means "all stages combined". System health and error
  // log are never stage-scoped concepts, so they ignore this entirely regardless.
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const rawStage = url.searchParams.get('stage');
  const stageId = rawStage && [1, 2, 3].includes(Number(rawStage)) ? Number(rawStage) : undefined;

  sendJson(res, 200, {
    success: true,
    events: getEventSummary(telemetryDb, stageId),
    errors: getErrorSummary(telemetryDb),
    system: getSystemMetricsSeries(telemetryDb),
    cardStats: getCardPickStats(telemetryDb, stageId)
  });
}

const TELEMETRY_DASHBOARD_PATH = path.resolve(__dirname, '../../admin/telemetry-dashboard.html');

function handleTelemetryDashboardPage(req: http.IncomingMessage, res: http.ServerResponse) {
  // The page itself is served with no auth (it's just static HTML/JS — nothing sensitive is in
  // it), same as index.html; the actual data fetch inside it carries X-Admin-Secret and is what
  // requireAdminSecret() above gates. Read fresh off disk each request rather than cached in
  // memory — this is an infrequently-hit internal tool, not the 25Hz game loop.
  fs.readFile(TELEMETRY_DASHBOARD_PATH, 'utf-8', (err, html) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Dashboard page not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/register' && req.method === 'POST') {
    safeHandler(handleRegister)(req, res);
    return;
  }
  if (url.pathname === '/api/login' && req.method === 'POST') {
    safeHandler(handleLogin)(req, res);
    return;
  }
  if (url.pathname === '/api/progression' && req.method === 'GET') {
    safeHandler(handleGetProgression)(req, res);
    return;
  }
  if (url.pathname === '/api/progression' && req.method === 'POST') {
    safeHandler(handleSaveProgression)(req, res);
    return;
  }
  if (url.pathname === '/api/telemetry/events' && req.method === 'POST') {
    safeHandler(handleTelemetryEvents)(req, res);
    return;
  }
  if (url.pathname === '/api/telemetry/errors' && req.method === 'POST') {
    safeHandler(handleTelemetryErrors)(req, res);
    return;
  }
  if (url.pathname === '/api/admin/telemetry/summary' && req.method === 'GET') {
    handleTelemetrySummary(req, res);
    return;
  }
  if (url.pathname === '/admin/telemetry' && req.method === 'GET') {
    handleTelemetryDashboardPage(req, res);
    return;
  }

  if (url.pathname === '/api/grant-gold') {
    const amount = parseInt(url.searchParams.get('amount') || '35000', 10);
    const MAX_GRANT_AMOUNT = 1_000_000;
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_GRANT_AMOUNT) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: `amount must be a number between 1 and ${MAX_GRANT_AMOUNT}` }));
      return;
    }
    const result = grantGoldToAll(amount);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      activePlayers: clients.size,
      activeRooms: rooms.size,
      roomsInProgress: Array.from(rooms.values()).filter((e) => e.room.isStarted && !e.room.isOver).length
    }));
    return;
  }

  // Falls through to a 404 in local dev, since dist/ doesn't exist until you build — the
  // Vite dev server on :3000 is what actually serves the client while developing.
  serveClientBuild(req, res, () => {
    res.writeHead(404);
    res.end();
  });
});

// Default maxPayload is 100MB — real messages here (input/room/chat control packets) are all
// tiny, so cap it hard rather than let one client send an oversized frame to spike memory.
const wss = new WebSocketServer({ server, maxPayload: 32 * 1024 });
// nginx (or Vite's dev proxy) is always the actual public entry point — this process only
// ever needs to be reachable from the same machine. Binding the wildcard address (Node's
// default with no host argument) meant a firewall misconfiguration was the only thing standing
// between the raw, unproxied WS/API and the internet. Override with HOST if a real deploy
// setup needs otherwise.
const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => {
  const mode = IS_PRODUCTION ? 'production' : 'development';
  console.log(`🗡️ [Torment of Souls] Dedicated Game Server running on ${HOST}:${PORT} (${mode} mode)`);
});

/** Records the crash to telemetry, then exits — this project never had an uncaughtException/
 * unhandledRejection handler before this feature, so the default Node behavior (print + exit 1)
 * is what pm2's crash-restart today relies on. Adding a handler at all suppresses that default
 * exit unless it's called explicitly here, so this MUST still exit(1) itself, not just log and
 * keep running — silently continuing after a truly uncaught exception in a now-possibly-
 * corrupted process would be worse than today's clean crash-and-restart, not an improvement.
 * shutdownTelemetry() flushes synchronously (better-sqlite3 has no async path) so the crash
 * report is actually on disk before process.exit() tears everything down. */
function reportFatalAndExit(err: unknown): never {
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    logError({
      source: 'server',
      category: 'server_exception',
      message: e.message,
      stackTrace: e.stack,
      topFrame: (e.stack || '').split('\n')[1]?.trim(),
      buildVersion: SERVER_BUILD_VERSION
    });
    shutdownTelemetry();
  } catch (telemetryErr) {
    console.error('[telemetry] failed to record fatal crash:', telemetryErr);
  }
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception — logging to telemetry, then exiting:', err);
  reportFatalAndExit(err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection — logging to telemetry, then exiting:', reason);
  reportFatalAndExit(reason);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received — flushing telemetry before exit');
  systemMetricsSampler.stop();
  shutdownTelemetry();
  process.exit(0);
});

function sendToClient(id: string, msg: ServerMessage) {
  // GameRoom addresses players by deviceId; a couple of call sites here still use the
  // ephemeral per-connection id directly (e.g. rejecting a not-yet-joined client) — match
  // either so both keep working. Connection counts are small, a scan is plenty fast.
  for (const client of clients.values()) {
    if ((client.id === id || client.deviceId === id) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(msg));
      return;
    }
  }
}

// Room-wide broadcasts (the 20-25Hz TICK above all) serialize the SAME payload for every
// recipient — do that once here instead of once per player inside GameRoom.broadcast(),
// which used to call sendToClient (and re-run JSON.stringify) per player every tick.
function broadcastToRoom(roomId: string, msg: ServerMessage) {
  const payload = JSON.stringify(msg);
  for (const client of clients.values()) {
    if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const clientId = `p_${nextClientId++}`;
  const client: ConnectedClient = {
    ws,
    id: clientId,
    deviceId: clientId, // replaced with the client's persisted deviceId once JOIN_LOBBY arrives
    name: `Survivor_${clientId}`,
    playerClass: PlayerClass.SWORDSMAN,
    ready: false,
    roomId: null,
    verified: !PARTY_CODE
  };
  clients.set(clientId, client);
  console.log(`👤 Player connected: ${clientId} (Total active: ${clients.size})`);

  // An 'error' event with no listener is an uncaught exception in Node — crashes the whole
  // process, taking down every other connected player. Oversized frames (over the maxPayload
  // set on WebSocketServer above) surface exactly this way, so this handler is required, not
  // optional. The socket closes itself after emitting this; nothing else to do here.
  ws.on('error', (err) => {
    console.warn(`⚠️  WebSocket error on ${clientId}:`, err.message);
  });

  ws.on('message', (raw: string) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'JOIN_LOBBY': {
          if (PARTY_CODE && msg.partyCode !== PARTY_CODE) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Invalid or missing party code.' });
            break;
          }
          client.verified = true;
          client.deviceId = (msg.deviceId || client.deviceId).slice(0, MAX_DEVICE_ID_LENGTH);
          client.name = (msg.name || client.name).slice(0, MAX_NAME_LENGTH);
          client.playerClass = msg.playerClass || client.playerClass;
          client.unlockedSkills = msg.unlockedSkills;
          client.treePassives = msg.treePassives;

          // Resuming an in-progress match after a refresh/dropped connection — search every
          // room (not just "the" room, now that there can be several) for this deviceId.
          let resumed = false;
          for (const [roomId, entry] of rooms.entries()) {
            if (entry.room.isStarted && !entry.room.isOver && entry.room.hasPlayer(client.deviceId)) {
              entry.room.reconnectPlayer(client.deviceId);
              client.roomId = roomId;
              console.log(`🔌 Player ${client.deviceId} (${client.name}) reconnected to Stage ${entry.room.getStageId()}`);
              sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: entry.room.getStageId(), props: entry.room.getProps() });
              broadcastRoomState(roomId);
              resumed = true;
              break;
            }
          }
          if (resumed) break;

          // Already in a (not-yet-started) room — e.g. changing hero class mid-lobby. The
          // room only ever learns a player's class here — CREATE_ROOM/JOIN_ROOM add them with
          // whatever client.playerClass was at the time, which is still the connection
          // default (Swordsman) since hero selection happens only after joining a room. Re-
          // running addPlayer() re-creates their ServerPlayer with the now-current class
          // (safe: it's a no-op-position-wise re-add keyed by the same deviceId, and this
          // whole branch is unreached once the match has actually started).
          if (client.roomId) {
            const entry = rooms.get(client.roomId);
            if (entry) {
              entry.room.addPlayer(client.deviceId, client.name, client.playerClass, client.unlockedSkills, client.treePassives);
            }
            broadcastRoomState(client.roomId);
          }
          break;
        }

        case 'READY_UP': {
          client.ready = msg.ready;
          if (client.roomId) broadcastRoomState(client.roomId);
          break;
        }

        case 'CREATE_ROOM': {
          if (!client.verified) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Invalid or missing party code.' });
            break;
          }
          if (client.roomId) break; // already in a room — leave it first
          if (rooms.size >= MAX_ROOMS) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Server is full — too many active rooms right now.' });
            break;
          }

          const roomNumber = nextRoomId++;
          const roomId = `room_${roomNumber}`;
          const roomName = (msg.roomName || '').trim().slice(0, MAX_ROOM_NAME_LENGTH) || `Room #${roomNumber}`;
          const password = (msg.password || '').trim().slice(0, MAX_ROOM_PASSWORD_LENGTH) || null;
          const room = new GameRoom(
            roomId,
            sendToClient,
            () => {
              rooms.delete(roomId);
              broadcastRoomList();
            },
            (m) => broadcastToRoom(roomId, m)
          );
          rooms.set(roomId, { room, name: roomName, hostClientId: client.id, hostName: client.name, password });
          room.addPlayer(client.deviceId, client.name, client.playerClass, client.unlockedSkills, client.treePassives);
          client.roomId = roomId;
          console.log(`🏠 Room created: ${roomName} (${roomId}) by ${client.name}${password ? ' [locked]' : ''}`);
          broadcastRoomState(roomId);
          broadcastRoomList();
          break;
        }

        case 'LIST_ROOMS': {
          sendToClient(client.id, { type: 'ROOM_LIST', rooms: roomSummaries() });
          break;
        }

        case 'JOIN_ROOM': {
          if (!client.verified) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Invalid or missing party code.' });
            break;
          }
          const entry = rooms.get(msg.roomId);
          if (!entry) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Room not found — it may have just closed.' });
            break;
          }
          if (entry.room.getPlayerCount() >= MAX_PLAYERS_PER_ROOM) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Room is full.' });
            break;
          }
          if (entry.password && entry.password !== (msg.password || '')) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Incorrect room password.' });
            break;
          }

          entry.room.addPlayer(client.deviceId, client.name, client.playerClass, client.unlockedSkills, client.treePassives);
          client.roomId = entry.room.id;

          // Dropping into a match already in progress vs. joining a waiting room's lobby.
          if (entry.room.isStarted && !entry.room.isOver) {
            console.log(`🚀 Player ${client.deviceId} (${client.name}) dropping into active Stage ${entry.room.getStageId()} in room ${entry.room.id}`);
            sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: entry.room.getStageId(), props: entry.room.getProps() });
          }
          broadcastRoomState(entry.room.id);
          broadcastRoomList();
          break;
        }

        case 'LEAVE_ROOM': {
          const entry = getClientRoom(client);
          if (!entry) break;
          const roomId = entry.room.id;
          client.roomId = null;
          client.ready = false;
          entry.room.removePlayer(client.deviceId); // may trigger the room's onEmpty cleanup above
          if (rooms.has(roomId)) broadcastRoomState(roomId);
          broadcastRoomList();
          break;
        }

        case 'START_GAME': {
          if (!client.verified) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Invalid or missing party code.' });
            break;
          }
          const entry = getClientRoom(client);
          if (!entry) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'You are not in a room.' });
            break;
          }

          // Already running — a genuinely new character dropping in (a reconnect is already
          // handled in JOIN_LOBBY above), safety net in case START_GAME fires twice.
          if (entry.room.isStarted && !entry.room.isOver) {
            sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: entry.room.getStageId(), props: entry.room.getProps() });
            break;
          }

          entry.room.start(msg.stageId || 1);
          console.log(`⚔️ Game crusade launched in room ${entry.room.id} (Stage ${msg.stageId || 1}, ${entry.room.getPlayerCount()} players)`);
          broadcastRoomState(entry.room.id);
          broadcastRoomList();
          break;
        }

        case 'INPUT': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted && !entry.room.isOver) {
            entry.room.handleInput(client.deviceId, msg.moveX, msg.moveY, msg.aimAngle, msg.isAttacking);
          }
          break;
        }

        case 'DASH': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted && !entry.room.isOver) {
            entry.room.handleDash(client.deviceId, msg.aimAngle);
          }
          break;
        }

        case 'SELECT_TRAIT': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handleSelectTrait(client.deviceId, msg.traitId);
          }
          break;
        }

        case 'USE_POTION': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handleUsePotion(client.deviceId, msg.action, msg.traitId);
          }
          break;
        }

        case 'SURRENDER': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handleSurrender(client.deviceId);
          }
          break;
        }

        case 'RETURN_TO_HUB': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handleReturnToHub(client.deviceId);
          }
          // Ack unconditionally (even with no room / already-over) so the client's reload isn't
          // left waiting on its no-ack fallback timeout for a case that needed no server work.
          sendToClient(client.id, { type: 'RETURN_TO_HUB_ACK' });
          break;
        }

        case 'PAUSE_GAME': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handlePauseGame(client.deviceId, msg.isPaused);
          }
          break;
        }

        case 'CONTINUE_RUN': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handleContinueRun();
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling client message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`🚪 Player disconnected: ${clientId}`);
    const entry = getClientRoom(client);
    if (entry) {
      const roomId = entry.room.id;
      if (entry.room.isStarted && !entry.room.isOver) {
        // Mid-match: keep their character alive for a grace period in case this was
        // just a refresh or a flaky connection, rather than deleting their progress.
        console.log(`⏳ Player ${client.deviceId} disconnected mid-match — grace period started`);
        entry.room.disconnectPlayer(client.deviceId);
      } else {
        entry.room.removePlayer(client.deviceId); // may trigger the room's onEmpty cleanup above
      }
      if (rooms.has(roomId)) broadcastRoomState(roomId);
    }
    clients.delete(clientId);
    broadcastRoomList();
  });
});
