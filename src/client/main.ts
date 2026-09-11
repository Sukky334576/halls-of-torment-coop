import { Renderer2D } from './engine/Renderer2D';
import { SpriteSheetGenerator } from './engine/SpriteSheetGenerator';
import { HordeSpriteRenderer } from './engine/HordeSpriteRenderer';
import { PlayerSpriteManager } from './entities/PlayerSprite';
import { VFX2D } from './entities/VFX2D';
import { SoundManager } from './engine/SoundManager';
import { HUD } from './ui/HUD';
import { LobbyUI } from './ui/LobbyUI';
import { TraitSelector } from './ui/TraitSelector';
import { EscMenuUI } from './ui/EscMenuUI';
import { ClientMessage, ServerMessage, PlayerClass, GameStateTick, ProjectileType, PickupType } from '../shared/types';
import { MetaProgression } from './engine/MetaProgression';
import { CLASS_DEFINITIONS } from '../shared/classes';
import { I18n } from './engine/I18n';
import { AuthClient } from './engine/AuthClient';
import { AuthGateUI } from './ui/AuthGateUI';
import { MainMenuUI, GameMode } from './ui/MainMenuUI';
import { RoomBrowserUI } from './ui/RoomBrowserUI';

const DEVICE_ID_KEY = 'torment_device_id';

// Stable per-browser identity, independent of any single WebSocket connection, so a
// refresh or dropped connection can resume the same in-progress character server-side.
function getOrCreateDeviceId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to a session-only id.
  }
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(DEVICE_ID_KEY, id);
    } catch {
      // Ignore — this device just won't survive a refresh mid-match.
    }
  }
  return id;
}

class GameApp {
  // Definite-assignment: always set by connectWebSocket(), called synchronously from the
  // constructor (and again on every reconnect) — TS can't see through that indirection.
  private ws!: WebSocket;
  private myId: string = '';
  private isGameRunning: boolean = false;
  // Only tracked so input-driven actions (currently just Dash) can check it — tick-driven
  // sounds (attacks, pickups, hits) already stop correctly on their own once paused, since
  // the server re-broadcasts the same frozen tick and nothing changes to trigger them. Dash
  // is different: it plays its sound and sends DASH straight from the keypress handler, with
  // no tick data in between to naturally gate it.
  private isPaused: boolean = false;
  private autoAim: boolean = false;

  private renderer: Renderer2D;
  private spriteGen: SpriteSheetGenerator;
  private hordeRenderer: HordeSpriteRenderer;
  private playerSprites: PlayerSpriteManager;
  private vfx: VFX2D;
  private sound: SoundManager;
  public hud: HUD;
  public lobby: LobbyUI;
  public traits: TraitSelector;
  public escMenu: EscMenuUI;
  private mode: GameMode;
  private roomBrowser: RoomBrowserUI | null = null;
  private appEl: HTMLElement;
  private connectionBanner: HTMLElement;
  // The server already grants a reconnect grace period (see server.ts's JOIN_LOBBY handler /
  // GAME_CONSTANTS.RECONNECT_GRACE_MS) for exactly this — a dropped connection (mobile
  // backgrounding, a stray back-gesture, a network blip) used to leave the client with no way
  // to actually use it: there was no onclose/onerror handler at all, so the render loop just
  // kept drawing the last-known tick forever (looks like the game is fine) while every
  // outgoing action silently no-op'd on the dead socket (`send()` checks readyState). Retry
  // with linear backoff up to a cap, matched loosely to the server's own grace window.
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly MAX_RECONNECT_ATTEMPTS = 20;

  // Input states
  private keys: Record<string, boolean> = {};
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseAimAngle: number = 0;
  private isMouseDown: boolean = false;

  // Last tick state & frame delta
  private latestTick: GameStateTick | null = null;
  private selectedClass: PlayerClass = PlayerClass.SWORDSMAN;
  private lastFrameTime: number = performance.now() / 1000;
  private lastAttackSeq: number = 0;
  private lastExp: number = 0;
  private lastShrineBuffType: string | null = null;
  private lastEnemyProjCount: number = 0;
  private lastWasDead: boolean = false;
  private collectedTomeIds: Set<number> = new Set();

  // Optional invite code carried in the shared link (?code=XXXX), forwarded on every JOIN_LOBBY
  private readonly partyCode: string | undefined = new URLSearchParams(window.location.search).get('code') || undefined;
  private readonly deviceId: string = getOrCreateDeviceId();

  constructor(mode: GameMode = 'multiplayer') {
    (window as any).game = this;
    this.mode = mode;
    this.appEl = document.getElementById('app')!;

    // Create isolated containers so subsystems never overwrite each other
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    this.appEl.appendChild(gameContainer);

    const hudContainer = document.createElement('div');
    hudContainer.id = 'hud-container';
    this.appEl.appendChild(hudContainer);

    const traitContainer = document.createElement('div');
    traitContainer.id = 'trait-container';
    this.appEl.appendChild(traitContainer);

    const lobbyContainer = document.createElement('div');
    lobbyContainer.id = 'lobby-container';
    this.appEl.appendChild(lobbyContainer);

    const escContainer = document.createElement('div');
    escContainer.id = 'esc-container';
    this.appEl.appendChild(escContainer);

    // Appended to <body>, not appEl — needs to stay visible regardless of which screen
    // (lobby, room browser, esc menu, active match) is currently showing.
    this.connectionBanner = document.createElement('div');
    this.connectionBanner.id = 'connection-banner';
    this.connectionBanner.style.display = 'none';
    document.body.appendChild(this.connectionBanner);

    // 1. Initialize 2.5D Engine Subsystems
    this.renderer = new Renderer2D(gameContainer);
    this.spriteGen = new SpriteSheetGenerator();
    this.hordeRenderer = new HordeSpriteRenderer(this.spriteGen, this.renderer);
    this.playerSprites = new PlayerSpriteManager(this.spriteGen);
    this.vfx = new VFX2D();
    this.sound = new SoundManager();
    this.hud = new HUD(hudContainer, this.sound);
    this.hud.onDash = () => this.performDash();
    this.hud.onContinueRun = () => {
      this.send({ type: 'CONTINUE_RUN' });
      this.hud.hideGameOver();
    };

    this.escMenu = new EscMenuUI(escContainer, this.sound);
    this.escMenu.onSurrender = () => {
      this.send({ type: 'SURRENDER' });
    };
    this.escMenu.onPauseToggle = (isPaused: boolean) => {
      this.isPaused = isPaused;
      this.send({ type: 'PAUSE_GAME', isPaused });
    };

    this.hud.onEscMenu = () => {
      if (this.isGameRunning) {
        const isSolo = (this.latestTick?.players.length ?? 1) <= 1;
        this.escMenu.toggle(isSolo);
        if (this.escMenu.isOpen && this.latestTick) {
          this.escMenu.update(this.latestTick, this.myId);
        }
      }
    };

    this.traits = new TraitSelector(
      traitContainer,
      (traitId) => {
        this.send({ type: 'SELECT_TRAIT', traitId });
      },
      (action, traitId) => {
        this.send({ type: 'USE_POTION', action, traitId });
      }
    );

    this.lobby = new LobbyUI(
      lobbyContainer,
      (c) => {
        this.selectedClass = c;
        this.send({
          type: 'JOIN_LOBBY',
          name: this.lobby.getPlayerName(),
          playerClass: c,
          unlockedSkills: MetaProgression.getUnlockedSkillIds(),
          treePassives: MetaProgression.getPassiveTiersForClass(c),
          partyCode: this.partyCode,
          deviceId: this.deviceId
        });
      },
      (ready) => {
        this.send({ type: 'READY_UP', ready });
      },
      (stageId: number = 1) => {
        this.renderer.setStage(stageId);
        this.send({
          type: 'JOIN_LOBBY',
          name: this.lobby.getPlayerName(),
          playerClass: this.selectedClass,
          unlockedSkills: MetaProgression.getUnlockedSkillIds(),
          treePassives: MetaProgression.getPassiveTiersForClass(this.selectedClass),
          partyCode: this.partyCode,
          deviceId: this.deviceId
        });
        this.send({ type: 'START_GAME', stageId });
      },
      this.sound,
      mode,
      () => this.leaveRoom()
    );

    // Listen to custom player nickname change
    this.lobby.onNameChange = (newName: string) => {
      this.send({
        type: 'JOIN_LOBBY',
        name: newName,
        playerClass: this.selectedClass,
        unlockedSkills: MetaProgression.getUnlockedSkillIds(),
        treePassives: MetaProgression.getPassiveTiersForClass(this.selectedClass),
        partyCode: this.partyCode,
        deviceId: this.deviceId
      });
    };

    // 2. Setup Input Handlers
    this.setupInputs();

    // 3. Connect to WebSocket Server (via unified /ws proxy, works for local, LAN, and HTTPS tunnels)
    this.connectWebSocket();

    // 4. Start 2.5D Render Loop
    this.loop();
  }

  private showRoomBrowser(): void {
    this.appEl.style.display = 'none';
    this.roomBrowser = new RoomBrowserUI(
      document.body,
      (name, password) => this.send({ type: 'CREATE_ROOM', roomName: name || undefined, password: password || undefined }),
      (roomId, password) => this.send({ type: 'JOIN_ROOM', roomId, password: password || undefined })
    );
    this.send({ type: 'LIST_ROOMS' });
  }

  /** Sends the player back to the room browser — only meaningful in multiplayer; solo's
   * silently-created room has no browser to return to. */
  public leaveRoom(): void {
    this.send({ type: 'LEAVE_ROOM' });
    this.lobby.hide();
    this.showRoomBrowser();
  }

  public performDash(): void {
    if (!this.isGameRunning || this.isPaused) return;
    const me = this.latestTick?.players.find((p) => p.id === this.myId);
    if (!me || me.isDead || (me.dashCooldownRemaining !== undefined && me.dashCooldownRemaining > 0)) return;

    this.sound.playDash();
    this.send({
      type: 'DASH',
      aimAngle: this.mouseAimAngle
    });
  }

  private setupInputs(): void {
    // 1. Keyboard event listeners (Supports English, Thai layout, and Arrow keys)
    window.addEventListener('keydown', (e) => {
      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();

      // ESC / Pause & Codex Menu
      if (code === 'escape' || key === 'escape') {
        e.preventDefault();
        if (this.isGameRunning) {
          const isSolo = (this.latestTick?.players.length ?? 1) <= 1;
          this.escMenu.toggle(isSolo);
          if (this.escMenu.isOpen && this.latestTick) {
            this.escMenu.update(this.latestTick, this.myId);
          }
        }
      }

      // Spacebar Dash / Dodge
      if (code === 'space' || key === ' ' || key === 'spacebar') {
        e.preventDefault();
        this.performDash();
      }

      // W / Up (KeyW, 'w', Thai 'ไ', ArrowUp)
      if (code === 'keyw' || key === 'w' || key === 'ไ' || code === 'arrowup' || key === 'arrowup') {
        this.keys['w'] = true;
        document.getElementById('wasd-btn-w')?.classList.add('active');
      }
      // A / Left (KeyA, 'a', Thai 'ฟ', ArrowLeft)
      if (code === 'keya' || key === 'a' || key === 'ฟ' || code === 'arrowleft' || key === 'arrowleft') {
        this.keys['a'] = true;
        document.getElementById('wasd-btn-a')?.classList.add('active');
      }
      // S / Down (KeyS, 's', Thai 'ห', ArrowDown)
      if (code === 'keys' || key === 's' || key === 'ห' || code === 'arrowdown' || key === 'arrowdown') {
        this.keys['s'] = true;
        document.getElementById('wasd-btn-s')?.classList.add('active');
      }
      // D / Right (KeyD, 'd', Thai 'ก', ArrowRight)
      if (code === 'keyd' || key === 'd' || key === 'ก' || code === 'arrowright' || key === 'arrowright') {
        this.keys['d'] = true;
        document.getElementById('wasd-btn-d')?.classList.add('active');
      }

      // T / Auto-Aim toggle (KeyT, 't', Thai 'ะ')
      if (code === 'keyt' || key === 't' || key === 'ะ') {
        this.autoAim = !this.autoAim;
        const btn = document.getElementById('btn-toggle-autoaim');
        if (btn) btn.textContent = I18n.t(this.autoAim ? 'hud.autoaim_on' : 'hud.autoaim_off');
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();

      if (code === 'keyw' || key === 'w' || key === 'ไ' || code === 'arrowup' || key === 'arrowup') {
        this.keys['w'] = false;
        document.getElementById('wasd-btn-w')?.classList.remove('active');
      }
      if (code === 'keya' || key === 'a' || key === 'ฟ' || code === 'arrowleft' || key === 'arrowleft') {
        this.keys['a'] = false;
        document.getElementById('wasd-btn-a')?.classList.remove('active');
      }
      if (code === 'keys' || key === 's' || key === 'ห' || code === 'arrowdown' || key === 'arrowdown') {
        this.keys['s'] = false;
        document.getElementById('wasd-btn-s')?.classList.remove('active');
      }
      if (code === 'keyd' || key === 'd' || key === 'ก' || code === 'arrowright' || key === 'arrowright') {
        this.keys['d'] = false;
        document.getElementById('wasd-btn-d')?.classList.remove('active');
      }
    });

    // Clear stuck keys on window blur
    window.addEventListener('blur', () => {
      this.keys = {};
      ['w', 'a', 's', 'd'].forEach((k) => {
        document.getElementById(`wasd-btn-${k}`)?.classList.remove('active');
      });
    });

    // 2. On-Screen Virtual WASD Buttons (Mouse click & touch control)
    const bindOnScreenKey = (btnId: string, keyName: string) => {
      const el = document.getElementById(btnId);
      if (!el) return;

      const press = (ev: Event) => {
        ev.preventDefault();
        this.keys[keyName] = true;
        el.classList.add('active');
      };

      const release = (ev: Event) => {
        ev.preventDefault();
        this.keys[keyName] = false;
        el.classList.remove('active');
      };

      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
    };

    bindOnScreenKey('wasd-btn-w', 'w');
    bindOnScreenKey('wasd-btn-a', 'a');
    bindOnScreenKey('wasd-btn-s', 's');
    bindOnScreenKey('wasd-btn-d', 'd');

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      // Project 2D screen coordinate into world coordinate
      const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);

      const me = this.latestTick?.players.find((p) => p.id === this.myId);
      if (me) {
        this.mouseAimAngle = Math.atan2(worldPos.y - me.y, worldPos.x - me.x);
      }
    });

    window.addEventListener('mousedown', () => {
      this.isMouseDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    const btn = document.getElementById('btn-toggle-autoaim');
    if (btn) {
      btn.textContent = I18n.t(this.autoAim ? 'hud.autoaim_on' : 'hud.autoaim_off');
      btn.addEventListener('click', () => {
        this.autoAim = !this.autoAim;
        btn.textContent = I18n.t(this.autoAim ? 'hud.autoaim_on' : 'hud.autoaim_off');
      });
    }

    I18n.onLanguageChanged(() => {
      const aimBtn = document.getElementById('btn-toggle-autoaim');
      if (aimBtn) aimBtn.textContent = I18n.t(this.autoAim ? 'hud.autoaim_on' : 'hud.autoaim_off');
    });
  }

  private connectWebSocket(): void {
    const isHttps = window.location.protocol === 'https:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);
    this.setupNetwork();
  }

  private showConnectionBanner(text: string): void {
    this.connectionBanner.textContent = text;
    this.connectionBanner.style.display = '';
  }

  private hideConnectionBanner(): void {
    this.connectionBanner.style.display = 'none';
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return; // a retry is already queued
    const isTh = I18n.getLanguage() === 'th';
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.showConnectionBanner(isTh ? '❌ เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ — กรุณารีเฟรชหน้าเว็บ' : '❌ Could not reconnect — please refresh the page');
      return;
    }
    this.reconnectAttempts++;
    this.showConnectionBanner(
      isTh ? `🔌 หลุดการเชื่อมต่อ กำลังเชื่อมต่อใหม่... (${this.reconnectAttempts})` : `🔌 Connection lost — reconnecting... (${this.reconnectAttempts})`
    );
    const delayMs = Math.min(1000 * this.reconnectAttempts, 5000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delayMs);
  }

  private setupNetwork(): void {
    this.ws.onopen = () => {
      console.log('⚔️ Connected to Torment 2.5D Dedicated Server!');
      this.reconnectAttempts = 0;
      this.hideConnectionBanner();
      this.send({
        type: 'JOIN_LOBBY',
        name: this.lobby.getPlayerName(),
        playerClass: this.selectedClass,
        unlockedSkills: MetaProgression.getUnlockedSkillIds(),
        treePassives: MetaProgression.getPassiveTiersForClass(this.selectedClass),
        partyCode: this.partyCode,
        deviceId: this.deviceId
      });

      // Reconnecting mid-match: the server's JOIN_LOBBY handler already detects an
      // in-progress room for this deviceId and resumes it (sends GAME_START back) — don't
      // also re-run the fresh-connect flow below, which would create a stray empty room or
      // pop the room browser on top of an active match.
      if (this.isGameRunning) return;

      // No offline mode (see MainMenuUI) — both paths use the same server, just differ in
      // how a room is picked. Solo never needs the browser at all: create one silently.
      if (this.mode === 'solo') {
        this.send({ type: 'CREATE_ROOM' });
      } else {
        this.showRoomBrowser();
      }
    };

    this.ws.onclose = () => {
      this.scheduleReconnect();
    };

    this.ws.onerror = (event) => {
      // 'close' always follows 'error' for a WebSocket — onclose owns the actual retry so
      // it isn't scheduled twice; this is just for visibility while debugging.
      console.warn('⚠️ WebSocket error:', event);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'JOIN_REJECTED': {
            if (this.roomBrowser) {
              this.roomBrowser.showError(msg.reason);
            } else {
              this.lobby.showToast(`🔒 ${msg.reason}`);
            }
            break;
          }

          case 'ROOM_LIST': {
            this.roomBrowser?.updateRooms(msg.rooms);
            break;
          }

          case 'LOBBY_STATE': {
            // First LOBBY_STATE after CREATE_ROOM/JOIN_ROOM means we're actually in a room
            // now — dismiss the browser (if any, i.e. multiplayer) and reveal the game.
            if (this.roomBrowser) {
              this.roomBrowser.destroy();
              this.roomBrowser = null;
              this.appEl.style.display = '';
            }
            this.lobby.updateParty(msg.players, msg.isStarted, msg.stageId);
            break;
          }

          case 'GAME_START': {
            console.log('🔥 2.5D Crusade Started! Player ID:', msg.yourId, 'Stage:', msg.stageId);
            this.myId = msg.yourId;
            this.isGameRunning = true;
            this.lobby.hide();
            document.body.classList.add('in-game');
            if (msg.stageId) {
              this.renderer.setStage(msg.stageId);
            }
            this.renderer.setProps(msg.props || []);
            break;
          }

          case 'TICK': {
            this.handleTick(msg.data);
            break;
          }

          case 'LEVEL_UP_CHOICE': {
            this.sound.playLevelUp();
            this.traits.showChoices(msg.choices, {
              rerolls: msg.potionRerolls ?? 0,
              banishes: msg.potionBanishes ?? 0,
              locks: msg.potionLocks ?? 0,
              lockedTraitId: msg.lockedTraitId ?? null
            });
            break;
          }

          case 'POTION_UPDATE': {
            this.traits.updatePotions({
              rerolls: msg.potionRerolls ?? 0,
              banishes: msg.potionBanishes ?? 0,
              locks: msg.potionLocks ?? 0,
              lockedTraitId: msg.lockedTraitId ?? null
            });
            break;
          }

          case 'GRANT_GOLD': {
            const grantKey = msg.grantId ? `torment_grant_${msg.grantId}` : 'torment_server_airdrop_35k_v2';
            if (!localStorage.getItem(grantKey)) {
              MetaProgression.addCoins(msg.amount);
              localStorage.setItem(grantKey, 'claimed');
            }
            this.lobby.refreshCoins();
            const isTh = I18n.getLanguage() === 'th';
            const notice = isTh ? msg.thaiMessage : msg.message;
            this.lobby.showToast(notice);
            if (this.isGameRunning && this.latestTick) {
              const me = this.latestTick.players.find((p) => p.id === this.myId);
              if (me) {
                this.hud.addFloatingMessage(me.x, me.y - 45, `🎁 +${msg.amount.toLocaleString()} SOUL COINS!`, '#facc15');
              }
            }
            break;
          }

          case 'WELL_GEAR_RETRIEVED': {
            // Only the collector's own client gets this message (see GameRoom's
            // handlePickupCollection) — teammates just see the floating callout text via the
            // normal damage-number broadcast, nothing to bank on their end.
            MetaProgression.addGearToVault(msg.gearId);
            break;
          }

          case 'GAME_OVER': {
            // A continuable victory (cleared wave 30, Continue button offered) freezes the
            // world server-side (GameRoom.victoryPending) but doesn't actually end the match —
            // don't tear down the in-game view for it, only show the modal on top. Everything
            // else below (banking gold/stats) stays unconditional: GameRoom.handleContinueRun()
            // resets totalKills/gold to 0 on continue specifically so double-banking is safe.
            if (!msg.canContinue) {
              this.isGameRunning = false;
              this.isPaused = false;
              this.escMenu.hide();
              this.traits.hide(); // also clears the trait-modal-open body class
              document.body.classList.remove('in-game');
            }
            // personalGold is what this player actually picked up themselves this run;
            // teamGold/playerCount is the leftover shared/bonus bucket (airdrops, starting gift), split evenly.
            const sharedShare = Math.floor(msg.teamGold / Math.max(1, msg.playerCount));
            const totalGoldEarned = msg.personalGold + sharedShare;
            if (totalGoldEarned > 0) {
              MetaProgression.addCoins(totalGoldEarned);
              this.lobby.refreshCoins();
            }
            if (msg.victory && msg.clearedStageId) {
              MetaProgression.unlockStage(msg.clearedStageId + 1);
              this.lobby.refreshCoins();
            }
            MetaProgression.recordRunResults(
              msg.totalKills || 0,
              msg.survivalTime || 0,
              totalGoldEarned,
              0,
              0,
              msg.victory ? (msg.clearedStageId || 1) : undefined
            );
            this.lobby.refreshCoins();
            this.hud.showGameOver(msg.victory, msg.survivalTime, msg.totalKills, totalGoldEarned, msg.reason, msg.canContinue);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse server message:', err);
      }
    };
  }

  public send(msg: ClientMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleTick(data: GameStateTick): void {
    this.latestTick = data;
    const me = data.players.find((p) => p.id === this.myId);
    if (!me) return;

    // 0. Track local player death count for Hall of Trials & Hero Unlocks
    if (me.isDead && !this.lastWasDead) {
      MetaProgression.recordHeroDeath();
    }
    this.lastWasDead = !!me.isDead;

    // 0.1 Track Tome of Ascension pickups
    for (const p of data.pickups) {
      if (p.type === PickupType.TOME_OF_ASCENSION) {
        const dist = Math.hypot(p.x - me.x, p.y - me.y);
        const pickupRad = me.stats?.pickupRadius ?? 100;
        if (dist <= pickupRad + 30 && !this.collectedTomeIds.has(p.id)) {
          this.collectedTomeIds.add(p.id);
          MetaProgression.recordTomeCollected();
        }
      }
    }

    // 1. Update Projectiles & Pickups
    this.vfx.updateProjectiles(data.projectiles);
    this.vfx.updatePickups(data.pickups);

    // 1.1 Update Shrines on VFX and MiniMap
    if (data.shrines) {
      this.vfx.updateShrines(data.shrines);
      this.hud.miniMap.updateShrines(data.shrines);
    }

    // 1.2 Shrine buff audio notification
    if (me.activeBuff && me.activeBuff.type !== this.lastShrineBuffType) {
      this.lastShrineBuffType = me.activeBuff.type;
      this.sound.playShrineBuff();
    } else if (!me.activeBuff) {
      this.lastShrineBuffType = null;
    }

    // 1.3 Enemy projectile shoot audio
    const enemyProjCount = data.projectiles.filter(
      (p) =>
        p.type === ProjectileType.ENEMY_ARROW ||
        p.type === ProjectileType.ENEMY_FIREBALL ||
        p.type === ProjectileType.ENEMY_VOID_ORB
    ).length;
    if (enemyProjCount > this.lastEnemyProjCount) {
      this.sound.playEnemyShoot();
    }
    this.lastEnemyProjCount = enemyProjCount;

    // 2. Synchronized Weapon Attack Audio (Fires at exact moment of attack swing/cast)
    if (me.attackSeq !== undefined && me.attackSeq > this.lastAttackSeq && !me.isDead) {
      this.lastAttackSeq = me.attackSeq;
      if (me.playerClass === PlayerClass.SWORDSMAN) this.sound.playSlash();
      else if (me.playerClass === PlayerClass.ARCHER) this.sound.playBowShot();
      else if (me.playerClass === PlayerClass.SORCERESS) this.sound.playLightning();
      else if (me.playerClass === PlayerClass.CLERIC) this.sound.playHolySmite();
      else if (me.playerClass === PlayerClass.COMMANDO) this.sound.playRifleBurst();
      else if (me.playerClass === PlayerClass.CAT_TANK) this.sound.playCatPawSlam();
      else if (me.playerClass === PlayerClass.COWBOY) this.sound.playRevolverShot();
      else if (me.playerClass === PlayerClass.CELESTIAL_MECHA) this.sound.playBeamSaber();
      else if (me.playerClass === PlayerClass.GAMBLER) this.sound.playCardThrow();
    }

    // 3. EXP Pickup Audio Feedback
    if (me.exp > this.lastExp) {
      this.sound.playExpPickup();
    }
    this.lastExp = me.exp;

    // 4. Hit impacts, flesh crunch audio, blood spatters & screen shake
    if (data.damageNumbers.length > 0) {
      let hasCrit = false;
      for (const dmg of data.damageNumbers) {
        this.vfx.spawnHitImpact(dmg.x, dmg.y, dmg.isCrit);
        if (dmg.isCrit) {
          hasCrit = true;
        }
      }

      this.sound.playHitImpact(hasCrit);

      if (hasCrit) {
        this.renderer.addScreenShake(3.5, 0.12);
      }
    }

    // 5. Update HUD with Waves and Boss status
    this.hud.update(
      data.players,
      this.myId,
      data.elapsedTime,
      data.totalKills,
      me.gold,
      data.damageNumbers,
      this.renderer.camera,
      data.currentWave,
      data.maxWaves,
      data.isBossWave,
      data.bossName,
      data.waveTimeRemaining,
      data.bossAlive,
      data.monsters,
      data.pickups,
      me.dashCooldownRemaining || 0,
      me.activeBuff,
      data.bossDeadlineRemaining ?? null,
      data.isEndless ?? false
    );

    // 6. Update ESC Codex Menu if open
    if (this.escMenu.isOpen) {
      this.escMenu.update(data, this.myId);
    }
  }

  private sendPlayerInput(): void {
    if (!this.isGameRunning) return;

    let moveX = 0;
    let moveY = 0;

    // Movement: WASD primary (or Arrow keys)
    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Dynamically calculate mouse aim angle relative to player in real-time
    const worldPos = this.renderer.screenToWorld(this.mouseX, this.mouseY);
    const me = this.latestTick?.players.find((p) => p.id === this.myId);
    if (me) {
      this.mouseAimAngle = Math.atan2(worldPos.y - me.y, worldPos.x - me.x);
    }

    let finalAngle = this.mouseAimAngle;

    // Only if player explicitly turned ON auto-aim (default OFF)
    if (this.autoAim && !this.isMouseDown && this.latestTick && this.latestTick.monsters.length > 0) {
      if (me) {
        let closestDist = Infinity;
        let targetAngle = finalAngle;

        for (const m of this.latestTick.monsters) {
          const d = Math.hypot(m.x - me.x, m.y - me.y);
          if (d < closestDist) {
            closestDist = d;
            targetAngle = Math.atan2(m.y - me.y, m.x - me.x);
          }
        }

        if (closestDist < 450) {
          finalAngle = targetAngle;
        }
      }
    }

    this.send({
      type: 'INPUT',
      moveX,
      moveY,
      aimAngle: finalAngle,
      isAttacking: true
    });
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    const now = performance.now() / 1000;
    const dt = Math.min(0.1, now - this.lastFrameTime);
    this.lastFrameTime = now;

    if (this.isGameRunning && this.latestTick) {
      this.sendPlayerInput();

      const me = this.latestTick.players.find((p) => p.id === this.myId);
      if (me) {
        this.renderer.updateCamera(me.x, me.y, dt);
      }

      this.playerSprites.update(this.latestTick.players, this.myId, dt, this.latestTick.tick);
      this.vfx.updateParticles(dt);

      // Dash ghost afterimages
      for (const p of this.latestTick.players) {
        if (p.isDashing) {
          this.vfx.spawnDashGhost(p.x, p.y, p.playerClass);
        }
      }

      // --- 2.5D RENDER PASS ---
      this.renderer.beginScene();

      // 1. Pickups & Ground VFX
      this.vfx.render(this.renderer.ctx, now);

      // 2. Monster Horde (Y-sorted)
      this.hordeRenderer.render(this.latestTick.monsters, now);

      // 3. Heroes with Class-Specific Visuals & Status
      this.playerSprites.render(this.renderer.ctx, this.latestTick.players, this.myId);

      // 4. Dark Fantasy Torchlight Ambiance Pass
      this.renderer.endScene(this.playerSprites.getPlayerPositions());

      // 5. Gothic Targeting Crosshair in Screen Space (Zero-offset 1:1 precision tracking)
      const cPos = this.renderer.clientToCanvas(this.mouseX, this.mouseY);
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.translate(cPos.x, cPos.y);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair ticks
      ctx.beginPath();
      ctx.moveTo(-15, 0); ctx.lineTo(-6, 0);
      ctx.moveTo(6, 0); ctx.lineTo(15, 0);
      ctx.moveTo(0, -15); ctx.lineTo(0, -6);
      ctx.moveTo(0, 6); ctx.lineTo(0, 15);
      ctx.stroke();
      ctx.restore();
    }
  };
}

// Start application — mandatory login gate, then a main-menu mode choice, before the
// hero-select lobby/game itself ever becomes visible. Both "solo" and "multiplayer" use the
// same server (see LobbyUI's mode param); this is a menu/flow gate only, no offline mode.
window.addEventListener('DOMContentLoaded', () => {
  const appEl = document.getElementById('app')!;
  appEl.style.display = 'none';

  function showMainMenu(): void {
    const menu = new MainMenuUI(document.body, (mode) => {
      menu.destroy();
      // Solo auto-creates its own room the instant it connects (see GameApp.setupNetwork),
      // so #app can show right away. Multiplayer stays hidden behind the room browser until
      // a room is actually joined — GameApp reveals it itself once that happens.
      if (mode === 'solo') appEl.style.display = '';
      (window as any).gameApp = new GameApp(mode);
    });
  }

  if (AuthClient.isLoggedIn()) {
    showMainMenu();
  } else {
    const gate = new AuthGateUI(document.body, async () => {
      // A fresh login/register during this boot happens after MetaProgression's own
      // constructor already ran (it only auto-syncs if a token already existed at module
      // load) — sync explicitly now so the menu/lobby reflect the right account state.
      await MetaProgression.syncFromServer();
      gate.destroy();
      showMainMenu();
    });
  }
});
