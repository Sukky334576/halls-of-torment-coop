import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessage, ServerMessage, PlayerClass } from '../shared/types';
import { GameRoom } from './engine/GameRoom';

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name: string;
  playerClass: PlayerClass;
  ready: boolean;
  roomId: string | null;
  unlockedSkills?: string[];
  treePassives?: Record<string, number>;
}

const PORT = 8080;
const clients: Map<string, ConnectedClient> = new Map();
let currentRoom: GameRoom | null = null;
let nextClientId = 1;

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
  const playerList = Array.from(clients.values()).map((c) => ({
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

function sendToClient(clientId: string, msg: ServerMessage) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(msg));
  }
}

wss.on('connection', (ws: WebSocket) => {
  const clientId = `p_${nextClientId++}`;
  const client: ConnectedClient = {
    ws,
    id: clientId,
    name: `Survivor_${clientId}`,
    playerClass: PlayerClass.SWORDSMAN,
    ready: false,
    roomId: null
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
          client.name = msg.name || client.name;
          client.playerClass = msg.playerClass || client.playerClass;
          client.unlockedSkills = msg.unlockedSkills;
          client.treePassives = msg.treePassives;
          broadcastLobbyState();
          break;
        }

        case 'READY_UP': {
          client.ready = msg.ready;
          broadcastLobbyState();
          break;
        }

        case 'START_GAME': {
          // If a crusade is already active, allow drop-in joining!
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
            console.log(`🚀 Player ${client.id} (${client.name}) dropping into active Stage ${currentRoom.getStageId()}!`);
            currentRoom.addPlayer(client.id, client.name, client.playerClass, client.unlockedSkills, client.treePassives);
            client.roomId = currentRoom.id;
            sendToClient(client.id, { type: 'GAME_START', yourId: client.id, stageId: currentRoom.getStageId() });
            broadcastLobbyState();
            break;
          }

          // Cleanly stop and reset any previous room
          if (currentRoom) {
            currentRoom.stop();
            currentRoom = null;
          }

          currentRoom = new GameRoom('main_room', sendToClient);
          for (const c of clients.values()) {
            currentRoom.addPlayer(c.id, c.name, c.playerClass, c.unlockedSkills, c.treePassives);
            c.roomId = currentRoom.id;
          }
          currentRoom.start(msg.stageId || 1);
          console.log(`⚔️ Game crusade launched in Stage ${msg.stageId || 1} with ${clients.size} players!`);

          broadcastLobbyState();
          break;
        }

        case 'INPUT': {
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
            currentRoom.handleInput(client.id, msg.moveX, msg.moveY, msg.aimAngle, msg.isAttacking);
          }
          break;
        }

        case 'DASH': {
          if (currentRoom && currentRoom.isStarted && !currentRoom.isOver) {
            currentRoom.handleDash(client.id, msg.aimAngle);
          }
          break;
        }

        case 'SELECT_TRAIT': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handleSelectTrait(client.id, msg.traitId);
          }
          break;
        }

        case 'USE_POTION': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handleUsePotion(client.id, msg.action, msg.traitId);
          }
          break;
        }

        case 'SURRENDER': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handleSurrender(client.id);
          }
          break;
        }

        case 'PAUSE_GAME': {
          if (currentRoom && currentRoom.isStarted) {
            currentRoom.handlePauseGame(client.id, msg.isPaused);
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
    if (currentRoom) {
      currentRoom.removePlayer(clientId);
      if (currentRoom.getPlayerCount() === 0) {
        currentRoom.stop();
        currentRoom = null;
        console.log(`🛑 Room cleaned up (all players left)`);
      }
    }
    clients.delete(clientId);
    broadcastLobbyState();
  });
});
