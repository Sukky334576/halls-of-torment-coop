import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessage, ServerMessage, PlayerClass } from '../shared/types';
import { GameRoom } from './engine/GameRoom';

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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
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

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });
server.listen(PORT, () => {
  console.log(`🗡️ [Torment of Souls] Dedicated Game Server running on port ${PORT}`);
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

  // Grant 35,000 Gold Gift to current players (Blackout Compensation)
  const giftMsg: ServerMessage = {
    type: 'GRANT_GOLD',
    amount: 35000,
    grantId: 'airdrop_35k_blackout',
    message: '🎁 Server Reward: 35,000 Gold Coins awarded to all survivors!',
    thaiMessage: '🎁 ของขวัญชดเชยจากเซิร์ฟเวอร์: ได้รับ 35,000 Gold Coins เรียบร้อย!'
  };
  ws.send(JSON.stringify(giftMsg));

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
            sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: currentRoom.getStageId() });
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
            sendToClient(client.id, { type: 'GAME_START', yourId: client.deviceId, stageId: currentRoom.getStageId() });
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
