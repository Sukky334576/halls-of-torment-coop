import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import serveStatic from 'serve-static';
import { ClientMessage, ServerMessage, PlayerClass } from '../shared/types';
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
let currentRoom: GameRoom | null = null;
let nextClientId = 1;

// Optional shared invite code (set PARTY_CODE env var) so a shared tunnel URL
// doesn't let random strangers auto drop into an active crusade.
// Unset by default to keep local/LAN testing frictionless.
const PARTY_CODE = process.env.PARTY_CODE || null;
if (PARTY_CODE) {
  console.log(`🔑 Party code required to join: ${PARTY_CODE}`);
}

export function grantGoldToAll(amount: number): { success: boolean; amount: number; activePlayers: number; grantId: string } {
  const grantId = `grant_${Date.now()}`;
  const thaiMsg = `🎁 ของขวัญจากเซิร์ฟเวอร์: ได้รับ ${amount.toLocaleString()} Gold Coins เรียบร้อย!`;
  const engMsg = `🎁 Server Reward: ${amount.toLocaleString()} Gold Coins awarded!`;

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

  // If a match is in progress, also add to teamGold in-game!
  if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
    currentRoom.grantBonusGold(amount);
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
  const user = createUser(username, passwordHash);
  const token = signToken(user.id);
  console.log(`📝 New account registered: ${username}`);
  sendJson(res, 201, { success: true, token, username: user.username });
}

async function handleLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  const ip = req.socket.remoteAddress || 'unknown';
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
    handleRegister(req, res);
    return;
  }
  if (url.pathname === '/api/login' && req.method === 'POST') {
    handleLogin(req, res);
    return;
  }
  if (url.pathname === '/api/progression' && req.method === 'GET') {
    handleGetProgression(req, res);
    return;
  }
  if (url.pathname === '/api/progression' && req.method === 'POST') {
    handleSaveProgression(req, res);
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
      isGameRunning: currentRoom ? currentRoom.isStarted && !currentRoom.isOver : false
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

const wss = new WebSocketServer({ server });
server.listen(PORT, () => {
  const mode = IS_PRODUCTION ? 'production' : 'development';
  console.log(`🗡️ [Torment of Souls] Dedicated Game Server running on port ${PORT} (${mode} mode)`);
});

function broadcastLobbyState() {
  const playerList = Array.from(clients.values())
    .filter((c) => c.verified)
    .map((c) => ({
      id: c.id,
      name: c.name,
      playerClass: c.playerClass,
      ready: c.ready
    }));

  const isStarted = currentRoom ? currentRoom.isStarted && !currentRoom.isOver : false;
  const stageId = currentRoom ? currentRoom.getStageId() : 1;
  const msg: ServerMessage = {
    type: 'LOBBY_STATE',
    players: playerList,
    isStarted,
    stageId
  };

  const payload = JSON.stringify(msg);
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

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

  broadcastLobbyState();

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
          client.deviceId = msg.deviceId || client.deviceId;
          client.name = msg.name || client.name;
          client.playerClass = msg.playerClass || client.playerClass;
          client.unlockedSkills = msg.unlockedSkills;
          client.treePassives = msg.treePassives;

          // Resuming an in-progress match after a refresh/dropped connection — jump
          // straight back into the same character instead of waiting at the lobby.
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver && currentRoom.hasPlayer(client.deviceId)) {
            currentRoom.reconnectPlayer(client.deviceId);
            client.roomId = currentRoom.id;
            console.log(`🔌 Player ${client.deviceId} (${client.name}) reconnected to Stage ${currentRoom.getStageId()}`);
            sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: currentRoom.getStageId(), props: currentRoom.getProps() });
            broadcastLobbyState();
            break;
          }

          broadcastLobbyState();
          break;
        }

        case 'READY_UP': {
          client.ready = msg.ready;
          broadcastLobbyState();
          break;
        }

        case 'START_GAME': {
          if (!client.verified) {
            sendToClient(client.id, { type: 'JOIN_REJECTED', reason: 'Invalid or missing party code.' });
            break;
          }

          // If a crusade is already active, allow drop-in joining! (A reconnect of an
          // existing player is already handled in JOIN_LOBBY above, so this is always
          // a genuinely new character.)
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
            console.log(`🚀 Player ${client.deviceId} (${client.name}) dropping into active Stage ${currentRoom.getStageId()}!`);
            currentRoom.addPlayer(client.deviceId, client.name, client.playerClass, client.unlockedSkills, client.treePassives);
            client.roomId = currentRoom.id;
            sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: currentRoom.getStageId(), props: currentRoom.getProps() });
            broadcastLobbyState();
            break;
          }

          // Cleanly stop and reset any previous room
          if (currentRoom) {
            currentRoom.stop();
            currentRoom = null;
          }

          const verifiedClients = Array.from(clients.values()).filter((c) => c.verified);
          currentRoom = new GameRoom(
            'main_room',
            sendToClient,
            () => { currentRoom = null; },
            (msg) => broadcastToRoom('main_room', msg)
          );
          for (const c of verifiedClients) {
            currentRoom.addPlayer(c.deviceId, c.name, c.playerClass, c.unlockedSkills, c.treePassives);
            c.roomId = currentRoom.id;
          }
          currentRoom.start(msg.stageId || 1);
          console.log(`⚔️ Game crusade launched in Stage ${msg.stageId || 1} with ${verifiedClients.length} players!`);

          broadcastLobbyState();
          break;
        }

        case 'INPUT': {
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
            currentRoom.handleInput(client.deviceId, msg.moveX, msg.moveY, msg.aimAngle, msg.isAttacking);
          }
          break;
        }

        case 'DASH': {
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
            currentRoom.handleDash(client.deviceId, msg.aimAngle);
          }
          break;
        }

        case 'SELECT_TRAIT': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handleSelectTrait(client.deviceId, msg.traitId);
          }
          break;
        }

        case 'USE_POTION': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handleUsePotion(client.deviceId, msg.action, msg.traitId);
          }
          break;
        }

        case 'SURRENDER': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handleSurrender(client.deviceId);
          }
          break;
        }

        case 'PAUSE_GAME': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handlePauseGame(client.deviceId, msg.isPaused);
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
    if (currentRoom && currentRoom.hasPlayer(client.deviceId)) {
      if (currentRoom.isStarted && !currentRoom.isOver) {
        // Mid-match: keep their character alive for a grace period in case this was
        // just a refresh or a flaky connection, rather than deleting their progress.
        console.log(`⏳ Player ${client.deviceId} disconnected mid-match — grace period started`);
        currentRoom.disconnectPlayer(client.deviceId);
      } else {
        currentRoom.removePlayer(client.deviceId);
      }
    }
    clients.delete(clientId);
    broadcastLobbyState();
  });
});
