// Must be the first import — see loadEnv.ts for why.
import './loadEnv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import serveStatic from 'serve-static';
import { ClientMessage, ServerMessage, PlayerClass, RoomSummary } from '../shared/types';
import { GameRoom } from './engine/GameRoom';
import { createUser, findUserByUsername, getProgression, setProgression } from './db';
import { hashPassword, verifyPassword, signToken, verifyToken, isRateLimited, USERNAME_RE, MIN_PASSWORD_LENGTH } from './auth';

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
 * or null (and already wrote a 401 response) if the token is missing/invalid. */
function requireAuth(req: http.IncomingMessage, res: http.ServerResponse): number | null {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
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

        case 'PAUSE_GAME': {
          const entry = getClientRoom(client);
          if (entry && entry.room.isStarted) {
            entry.room.handlePauseGame(client.deviceId, msg.isPaused);
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
