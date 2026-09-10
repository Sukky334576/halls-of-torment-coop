import { PlayerClass } from '../../shared/types';
import { CLASS_DEFINITIONS } from '../../shared/classes';
import { SpriteSheetGenerator } from '../engine/SpriteSheetGenerator';
import { MetaProgression } from '../engine/MetaProgression';
import { SkillTreeUI } from './SkillTreeUI';
import { GearVaultUI } from './GearVaultUI';
import { HallOfTrialsUI } from './HallOfTrialsUI';
import { AccountUI } from './AccountUI';
import { AuthClient } from '../engine/AuthClient';
import { SoundManager } from '../engine/SoundManager';
import { STAGES } from '../../shared/stages';
import { I18n } from '../engine/I18n';
import { escapeHtml } from '../engine/sanitize';

interface PedestalSlot {
  heroClass: PlayerClass;
  x: number;
  y: number;
  radius: number;
  name: string;
  icon: string;
  tier: 'FRONT' | 'BACK';
}

export class LobbyUI {
  private container: HTMLElement;
  private onSelectClass: (c: PlayerClass) => void;
  private onReady: (ready: boolean) => void;
  private onStartGame: (stageId: number) => void;

  private selectedClass: PlayerClass = PlayerClass.SWORDSMAN;
  private hoveredClass: PlayerClass | null = null;
  // drawChamberBackground()'s scene-geometry gradients (wall ambient, dais, shadows, floor)
  // don't depend on `time` at all — same inputs every frame — but were being rebuilt from
  // scratch every single frame of the lobby's own requestAnimationFrame loop regardless.
  // Cached here and invalidated only if the canvas is resized (see the w/h check at use).
  private cachedBgGradients: {
    w: number;
    h: number;
    wallAmbient: CanvasGradient;
    dais: CanvasGradient;
    leftShadow: CanvasGradient;
    rightShadow: CanvasGradient;
    floor: CanvasGradient;
    floorAura: CanvasGradient;
  } | null = null;
  private isReady: boolean = false;
  private playerName: string = '';
  public onNameChange: ((newName: string) => void) | null = null;
  private spriteGen: SpriteSheetGenerator;
  public skillTree: SkillTreeUI;
  public gearVault: GearVaultUI;
  public hallOfTrials: HallOfTrialsUI;
  public accountUI: AccountUI;
  private sound?: SoundManager;
  // Both modes use the same room/server — a lone player already works fine there (see
  // GameRoom.test.ts's solo cases). This only affects presentation: solo hides the party
  // list (nothing to show) and skips the manual ready-up step (nothing to coordinate).
  private mode: 'solo' | 'multiplayer' = 'multiplayer';
  private onLeaveRoom?: () => void;

  // Real-time Multiplayer Party & Lobby State
  private connectedPlayers: { id: string; name: string; playerClass: PlayerClass; ready: boolean }[] = [];
  private isCrusadeActive: boolean = false;
  private activeStageId: number = 1;
  private toastNotification: { text: string; expiry: number } | null = null;

  // Chamber Stage Canvas
  private stageCanvas: HTMLCanvasElement | null = null;
  private stageCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number = 0;

  // 2-Tier Sanctuary Configuration (1600 x 540 canvas — widened from the original 1040 so the
  // scene actually fills wide viewports instead of being letterboxed at a narrower aspect ratio)
  // Back Tier: 5 Unlockable / Trial Heroes on elevated stone gallery (y = 255)
  // Front Tier: 4 Starter / Usable Heroes prominently in the foreground (y = 415)
  private pedestals: PedestalSlot[] = [
    // --- BACK TIER: 5 Sealed Trial Legends (Elevated stone gallery, y = 255) ---
    { heroClass: PlayerClass.COMMANDO, x: 206, y: 255, radius: 40, name: 'Commando', icon: '', tier: 'BACK' },
    { heroClass: PlayerClass.COWBOY, x: 496, y: 255, radius: 40, name: 'Cowboy', icon: '', tier: 'BACK' },
    { heroClass: PlayerClass.CELESTIAL_MECHA, x: 800, y: 245, radius: 44, name: 'Celestial Mecha', icon: '', tier: 'BACK' },
    { heroClass: PlayerClass.CAT_TANK, x: 1105, y: 255, radius: 40, name: 'Cat Tank', icon: '', tier: 'BACK' },
    { heroClass: PlayerClass.GAMBLER, x: 1395, y: 255, radius: 40, name: 'Gambler', icon: '', tier: 'BACK' },

    // --- FRONT TIER: 4 Starter Usable Champions (Grand foreground floor, y = 415) ---
    { heroClass: PlayerClass.SWORDSMAN, x: 336, y: 415, radius: 48, name: 'Swordsman', icon: '', tier: 'FRONT' },
    { heroClass: PlayerClass.ARCHER, x: 641, y: 415, radius: 48, name: 'Archer', icon: '', tier: 'FRONT' },
    { heroClass: PlayerClass.SORCERESS, x: 960, y: 415, radius: 48, name: 'Sorceress', icon: '', tier: 'FRONT' },
    { heroClass: PlayerClass.CLERIC, x: 1264, y: 415, radius: 48, name: 'Cleric', icon: '', tier: 'FRONT' }
  ];

  // Gate of Torment position
  private readonly gateX = 800;
  private readonly gateY = 145;

  // Gate Walk Animation State
  private lobbyState: 'CHOOSING' | 'WALKING_TO_GATE' | 'SELECTING_STAGE' | 'TRANSITION_COMPLETE' = 'CHOOSING';
  private walkStartTime: number = 0;
  private readonly walkDuration: number = 1600; // 1.6s dramatic entrance
  private walkingHeroState = {
    startX: 293,
    startY: 380,
    currentX: 293,
    currentY: 380,
    scale: 1.35,
    alpha: 1.0
  };

  constructor(
    container: HTMLElement,
    onSelectClass: (c: PlayerClass) => void,
    onReady: (ready: boolean) => void,
    onStartGame: (stageId: number) => void,
    sound?: SoundManager,
    mode: 'solo' | 'multiplayer' = 'multiplayer',
    onLeaveRoom?: () => void
  ) {
    this.container = container;
    this.onSelectClass = onSelectClass;
    this.onReady = onReady;
    this.onStartGame = onStartGame;
    this.sound = sound;
    this.mode = mode;
    this.onLeaveRoom = onLeaveRoom;

    const savedName = typeof localStorage !== 'undefined' ? localStorage.getItem('torment_player_name') : null;
    this.playerName = savedName || `Crusader_${Math.floor(Math.random() * 900 + 100)}`;

    this.spriteGen = new SpriteSheetGenerator();
    this.skillTree = new SkillTreeUI(document.body, () => this.refreshCoins(), this.sound);
    this.gearVault = new GearVaultUI(document.body, this.sound);
    this.hallOfTrials = new HallOfTrialsUI(document.body, this.sound);
    this.accountUI = new AccountUI(document.body, this.sound);
    // A synced login/register can change coins, unlocked heroes, skill tree, and gear vault
    // all at once — those are drawn across several places (DOM text, canvas pedestals, other
    // modals), so a full reload is the simplest way to guarantee everything reflects the
    // newly-loaded account state correctly, rather than auditing every render path.
    this.accountUI.onProgressionSynced = () => window.location.reload();

    this.gearVault.onEquipChange = () => {
      this.refreshCoins();
      this.updateClassUI(this.selectedClass);
    };

    this.hallOfTrials.onRewardClaimed = () => {
      this.refreshCoins();
      this.updateClassUI(this.selectedClass);
    };

    this.renderInitialDOM();
    this.initChamberCanvas();
    this.updateClassUI(this.selectedClass);
    this.refreshCoins();

    if (this.mode === 'solo') {
      // No one else to coordinate with — skip the manual ready-up step entirely. Only a
      // local flag, not sent to the server: nothing server-side actually gates starting a
      // match on `ready` (see GameRoom/server.ts's START_GAME handler), and calling the
      // onReady callback here would fire before GameApp finishes constructing its own
      // WebSocket (this constructor runs first) — it would throw reading `this.ws` on an
      // object that doesn't exist yet.
      this.isReady = true;
    }

    I18n.onLanguageChanged(() => {
      this.renderInitialDOM();
      this.initChamberCanvas();
      this.updateClassUI(this.selectedClass);
      this.refreshCoins();
    });
  }

  private renderInitialDOM(): void {
    const isTh = I18n.getLanguage() === 'th';
    this.container.innerHTML = `
      <div id="lobby-backdrop" class="lobby-screen">
        <div class="lobby-chamber-card">
          <!-- Top Bar -->
          <div class="lobby-top-bar">
            <div class="lobby-title-group">
              <h1 class="game-title">${I18n.t('game.title')}</h1>
              <p class="game-subtitle">${I18n.t('game.subtitle')}</p>
            </div>
            <div class="lobby-top-bar-right">
              <button id="btn-lang-toggle" class="btn btn-lang-toggle" title="สลับภาษา / Toggle Language">
                ${isTh ? 'ภาษาไทย' : 'English'}
              </button>
              ${
                this.mode === 'multiplayer'
                  ? `<button id="btn-leave-room" class="btn btn-leave-room" title="${isTh ? 'ออกจากห้อง' : 'Leave Room'}">
                      ${isTh ? '🚪 ออกจากห้อง' : '🚪 Leave Room'}
                    </button>`
                  : ''
              }
              <button id="btn-open-account" class="btn btn-account" title="${isTh ? 'บัญชีผู้เล่น' : 'Account'}">
                👤 ${AuthClient.isLoggedIn() ? AuthClient.getUsername() : (isTh ? 'บัญชี' : 'Account')}
              </button>
              <div class="lobby-coin-badge">
                <span class="coin-icon-svg">
                  <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: -2px;">
                    <circle cx="12" cy="12" r="9" fill="#e5c158" stroke="#8a6f3b" stroke-width="1.5"/>
                    <circle cx="12" cy="12" r="6" fill="none" stroke="#b38a2e" stroke-width="1"/>
                    <path d="M12 7v10M9.5 9.5h5M10 14.5h4" stroke="#6d4f18" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                </span>
                <span id="lobby-coin-count" class="coin-num">0</span>
                <span class="coin-lbl">${I18n.t('lobby.coins')}</span>
              </div>
              <button id="btn-open-gear-vault" class="btn btn-gear-vault" title="คลังอุปกรณ์ / Gear Vault">
                ${I18n.t('lobby.gear_vault_btn')}
              </button>
              <button id="btn-open-trials" class="btn btn-trials-btn" title="บททดสอบ / Hall of Trials">
                ${I18n.t('lobby.trials_btn')}
                <span id="trials-claim-badge" class="badge-claim-counter" style="display: none;">0</span>
              </button>
              <button id="btn-open-skill-tree" class="btn btn-skill-tree">${I18n.t('lobby.skill_tree_btn')}</button>
            </div>
          </div>

          <!-- Interactive 2.5D Hero Selection Chamber -->
          <div class="chamber-canvas-wrapper">
            <canvas id="lobby-stage-canvas" width="1600" height="540"></canvas>
          </div>

          <!-- Bottom Panel: Hero Inspector & Crusade Controls -->
          <div class="lobby-bottom-panel">
            <!-- Left: Hero Detail Info -->
            <div class="hero-inspector-card">
              <div class="inspector-header">
                <div id="insp-icon" class="inspector-crest">I</div>
                <div class="inspector-header-info">
                  <h2 id="insp-name">SWORDSMAN</h2>
                  <div class="inspector-sub-row">
                    <div id="insp-title" class="inspector-title">THE STEEL BULWARK</div>
                    <div id="insp-element" class="inspector-element">Rend & Crimson Steel</div>
                  </div>
                </div>
              </div>

              <!-- Sleek Stat Badges Grid -->
              <div class="stat-pill-grid">
                <div class="stat-pill hp" title="Max Health">
                  <span class="pill-lbl">HP</span>
                  <div class="pill-bar-track"><div id="stat-hp" class="pill-bar-fill hp" style="width: 100%"></div></div>
                  <span id="val-hp" class="pill-val">270</span>
                </div>
                <div class="stat-pill spd" title="Movement Speed">
                  <span class="pill-lbl">SPD</span>
                  <div class="pill-bar-track"><div id="stat-spd" class="pill-bar-fill spd" style="width: 75%"></div></div>
                  <span id="val-spd" class="pill-val">165</span>
                </div>
                <div class="stat-pill dmg" title="Base Damage">
                  <span class="pill-lbl">DMG</span>
                  <div class="pill-bar-track"><div id="stat-dmg" class="pill-bar-fill dmg" style="width: 75%"></div></div>
                  <span id="val-dmg" class="pill-val">28</span>
                </div>
                <div class="stat-pill def" title="Armor & Defense">
                  <span class="pill-lbl">DEF</span>
                  <div class="pill-bar-track"><div id="stat-def" class="pill-bar-fill def" style="width: 100%"></div></div>
                  <span id="val-def" class="pill-val">12</span>
                </div>
              </div>

              <div class="inspector-specs">
                <div><strong>${I18n.t('lobby.weapon')}</strong> <span id="insp-weapon">Greatsword Cleave</span></div>
                <div><strong>${I18n.t('lobby.specialization')}</strong> <span id="insp-spec">High Defense, Bleed DoT & Melee Cleave</span></div>
              </div>
              <p id="insp-desc" class="inspector-desc">A steadfast frontliner with sweeping broadsword slashes and bleed DoT.</p>

              <!-- Hero Unlock & Shop Progression Banner -->
              <div id="hero-unlock-container" style="display: none;"></div>
            </div>

            <!-- Right: Party & Actions -->
            <div class="lobby-party-action-col">
              <!-- Crusader Nickname Box -->
              <div class="lobby-nickname-card">
                <span class="nickname-label">${I18n.t('lobby.name_label')}</span>
                <div class="nickname-input-wrapper">
                  <input
                    type="text"
                    id="input-player-name"
                    class="input-player-name"
                    maxlength="16"
                    placeholder="${I18n.t('lobby.name_placeholder')}"
                    value="${escapeHtml(this.playerName)}"
                  />
                  <button id="btn-save-name" class="btn-save-name" title="บันทึกชื่อ / Save Name">SET</button>
                </div>
              </div>

              <div class="lobby-party-container" style="${this.mode === 'solo' ? 'display: none;' : ''}">
                <h3>${I18n.t('lobby.party_title')}</h3>
                <div id="party-list" class="party-list">
                  <div class="party-slot">
                    <div class="party-color" style="background: #3a86ff"></div>
                    <div class="party-name">${escapeHtml(this.playerName)}</div>
                    <div class="party-class">Swordsman</div>
                    <div class="party-status not-ready">${I18n.t('lobby.status_waiting')}</div>
                  </div>
                </div>
              </div>

              <div class="lobby-actions">
                <button id="btn-ready" class="btn btn-ready-toggle" style="${this.mode === 'solo' ? 'display: none;' : ''}">${this.isReady ? I18n.t('lobby.btn_ready_active') : I18n.t('lobby.btn_ready')}</button>
                <button id="btn-start" class="btn btn-enter-gate">${I18n.t('lobby.btn_enter_gate')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    this.container.querySelector('#btn-lang-toggle')?.addEventListener('click', () => {
      I18n.toggleLanguage();
    });

    this.container.querySelector('#btn-open-skill-tree')?.addEventListener('click', () => {
      this.skillTree.show();
    });

    this.container.querySelector('#btn-open-gear-vault')?.addEventListener('click', () => {
      this.gearVault.show();
    });

    this.container.querySelector('#btn-open-trials')?.addEventListener('click', () => {
      this.hallOfTrials.show();
    });

    this.container.querySelector('#btn-open-account')?.addEventListener('click', () => {
      this.accountUI.show();
    });

    this.container.querySelector('#btn-leave-room')?.addEventListener('click', () => {
      this.onLeaveRoom?.();
    });

    // Nickname input handlers
    const nameInput = this.container.querySelector('#input-player-name') as HTMLInputElement;
    const handleSaveName = () => {
      const val = nameInput?.value?.trim();
      if (val && val !== this.playerName) {
        this.playerName = val;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('torment_player_name', val);
        }
        this.onNameChange?.(val);
      }
    };
    nameInput?.addEventListener('change', handleSaveName);
    nameInput?.addEventListener('blur', handleSaveName);
    nameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSaveName();
        nameInput.blur();
      }
    });
    this.container.querySelector('#btn-save-name')?.addEventListener('click', handleSaveName);

    const readyBtn = this.container.querySelector('#btn-ready');
    readyBtn?.addEventListener('click', () => {
      if (this.lobbyState !== 'CHOOSING') return;
      this.isReady = !this.isReady;
      readyBtn.textContent = this.isReady ? I18n.t('lobby.btn_ready_active') : I18n.t('lobby.btn_ready');
      readyBtn.classList.toggle('btn-active', this.isReady);
      this.onReady(this.isReady);
    });

    const startBtn = this.container.querySelector('#btn-start');
    startBtn?.addEventListener('click', () => {
      if (this.isCrusadeActive) {
        this.sound?.playPortalEnter();
        this.onStartGame(this.activeStageId);
      } else {
        this.triggerGateWalk();
      }
    });
  }

  private initChamberCanvas(): void {
    this.stageCanvas = this.container.querySelector('#lobby-stage-canvas') as HTMLCanvasElement;
    if (!this.stageCanvas) return;
    this.stageCtx = this.stageCanvas.getContext('2d')!;

    // Mouse hover and selection handlers
    this.stageCanvas.addEventListener('mousemove', (e) => {
      if (this.lobbyState !== 'CHOOSING' || !this.stageCanvas) return;
      const rect = this.stageCanvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) * (this.stageCanvas.width / (rect.width || 1));
      const canvasY = (e.clientY - rect.top) * (this.stageCanvas.height / (rect.height || 1));

      let found: PlayerClass | null = null;
      // Check front-tier first, then back-tier
      const sortedByFront = [...this.pedestals].sort((a, b) => b.y - a.y);
      for (const slot of sortedByFront) {
        const yOffset = slot.tier === 'FRONT' ? 42 : 28;
        const hitRadius = slot.tier === 'FRONT' ? 52 : 42;
        const dx = canvasX - slot.x;
        const dy = canvasY - (slot.y - yOffset);
        if (Math.hypot(dx, dy) < hitRadius) {
          found = slot.heroClass;
          break;
        }
      }

      // Check if hovering gate
      const isOverGate = Math.abs(canvasX - this.gateX) < 100 && Math.abs(canvasY - this.gateY) < 80;

      if (found !== this.hoveredClass) {
        this.hoveredClass = found;
        if (found) {
          this.updateClassUI(found);
        } else {
          this.updateClassUI(this.selectedClass);
        }
      }

      this.stageCanvas.style.cursor = (found || isOverGate) ? 'pointer' : 'default';
    });

    this.stageCanvas.addEventListener('mouseleave', () => {
      if (this.lobbyState !== 'CHOOSING') return;
      this.hoveredClass = null;
      this.updateClassUI(this.selectedClass);
      if (this.stageCanvas) this.stageCanvas.style.cursor = 'default';
    });

    this.stageCanvas.addEventListener('click', (e) => {
      if (this.lobbyState !== 'CHOOSING' || !this.stageCanvas) return;
      const rect = this.stageCanvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) * (this.stageCanvas.width / (rect.width || 1));
      const canvasY = (e.clientY - rect.top) * (this.stageCanvas.height / (rect.height || 1));

      // 1. Click Hero Pedestal (front-tier prioritized)
      const sortedByFront = [...this.pedestals].sort((a, b) => b.y - a.y);
      for (const slot of sortedByFront) {
        const yOffset = slot.tier === 'FRONT' ? 42 : 28;
        const hitRadius = slot.tier === 'FRONT' ? 52 : 42;
        const dx = canvasX - slot.x;
        const dy = canvasY - (slot.y - yOffset);
        if (Math.hypot(dx, dy) < hitRadius) {
          this.selectClass(slot.heroClass);
          return;
        }
      }

      // 2. Click Dungeon Gate directly to start
      if (Math.abs(canvasX - this.gateX) < 100 && Math.abs(canvasY - this.gateY) < 80) {
        this.triggerGateWalk();
      }
    });

    // Start render loop
    const renderLoop = (time: number) => {
      this.renderChamber(time);
      this.animFrameId = requestAnimationFrame(renderLoop);
    };
    this.animFrameId = requestAnimationFrame(renderLoop);
  }

  private selectClass(c: PlayerClass): void {
    if (this.selectedClass === c && this.lobbyState === 'CHOOSING') return;
    this.selectedClass = c;
    this.updateClassUI(c);
    this.onSelectClass(c);

    // Play class signature attack/ready sound
    if (this.sound) {
      if (c === PlayerClass.SWORDSMAN) this.sound.playSlash();
      else if (c === PlayerClass.ARCHER) this.sound.playBowShot();
      else if (c === PlayerClass.SORCERESS) this.sound.playLightning();
      else if (c === PlayerClass.CLERIC) this.sound.playHolySmite();
      else if (c === PlayerClass.COMMANDO) this.sound.playRifleBurst();
      else if (c === PlayerClass.CAT_TANK) this.sound.playCatPawSlam();
      else if (c === PlayerClass.COWBOY) this.sound.playRevolverShot();
      else if (c === PlayerClass.CELESTIAL_MECHA) this.sound.playBeamSaber();
      else if (c === PlayerClass.GAMBLER) this.sound.playCardThrow();
    }
  }

  public triggerGateWalk(): void {
    if (this.lobbyState !== 'CHOOSING') return;

    if (!MetaProgression.isHeroUnlocked(this.selectedClass)) {
      const isTh = I18n.getLanguage() === 'th';
      this.showToast(isTh ? '🔒 ต้องปลดล็อกตัวละครนี้ก่อนเข้าสู่ประตูดันเจี้ยน!' : '🔒 Unlock this hero before entering the Gate of Torment!');
      return;
    }

    // Find starting coordinates of chosen hero
    const slot = this.pedestals.find((p) => p.heroClass === this.selectedClass) || this.pedestals[0];
    this.walkingHeroState.startX = slot.x;
    this.walkingHeroState.startY = slot.y;
    this.walkingHeroState.currentX = slot.x;
    this.walkingHeroState.currentY = slot.y;
    this.walkingHeroState.scale = 1.20;
    this.walkingHeroState.alpha = 1.0;

    this.lobbyState = 'WALKING_TO_GATE';
    this.walkStartTime = performance.now();

    // Play portal gate rumble sound
    this.sound?.playPortalEnter();

    // Disable buttons
    const startBtn = this.container.querySelector('#btn-start') as HTMLButtonElement;
    const readyBtn = this.container.querySelector('#btn-ready') as HTMLButtonElement;
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = '<span class="btn-gate-icon">⚡</span> ENTERING GATE...';
      startBtn.style.opacity = '0.7';
    }
    if (readyBtn) readyBtn.disabled = true;
  }

  private renderChamber(time: number): void {
    if (!this.stageCtx || !this.stageCanvas) return;
    const ctx = this.stageCtx;
    const w = this.stageCanvas.width;
    const h = this.stageCanvas.height;

    // 1. Draw Dungeon Crypt Background (with 2-tier dais & stairs)
    this.drawChamberBackground(ctx, w, h, time);

    // 2. Draw The Ancient Gate of Torment (Portal)
    const isWalking = this.lobbyState === 'WALKING_TO_GATE';
    this.drawGateOfTorment(ctx, w, h, time, isWalking);

    // 3. Handle Pedestals & Heroes Rendering (depth sorted: back row first, front row on top)
    const renderSlots = [...this.pedestals].sort((a, b) => a.y - b.y);

    if (this.lobbyState === 'CHOOSING') {
      for (const slot of renderSlots) {
        const isHovered = this.hoveredClass === slot.heroClass;
        const isSelected = this.selectedClass === slot.heroClass;
        this.drawPedestal(ctx, slot, isHovered, isSelected, time, 1.0);
        this.drawPlayerGroundAura(ctx, slot, time);
        this.drawHeroOnPedestal(ctx, slot, isHovered, isSelected, time, 1.0);
        this.drawPlayerBadgesOnPedestal(ctx, slot, time);
      }
      this.drawLobbyToast(ctx, w, time);
    } else if (this.lobbyState === 'WALKING_TO_GATE') {
      const elapsed = performance.now() - this.walkStartTime;
      const progress = Math.min(1, elapsed / this.walkDuration);

      // Unselected heroes fade into shadows quickly (first 35% of animation)
      const unselectedAlpha = Math.max(0, 1 - progress * 2.8);

      for (const slot of renderSlots) {
        if (slot.heroClass !== this.selectedClass) {
          if (unselectedAlpha > 0.01) {
            this.drawPedestal(ctx, slot, false, false, time, unselectedAlpha);
            this.drawHeroOnPedestal(ctx, slot, false, false, time, unselectedAlpha);
          }
        } else {
          // Keep pedestal shadow but hero walks away
          this.drawPedestal(ctx, slot, false, true, time, unselectedAlpha);
        }
      }

      // Draw Selected Hero Walking into Gate
      this.drawWalkingHero(ctx, progress, time);

      // Finish Gate Walk -> Present Stage Selection Portal
      if (progress >= 1.0 && this.lobbyState === 'WALKING_TO_GATE') {
        this.lobbyState = 'SELECTING_STAGE';
        this.showStageSelectionModal();
      }
    } else if (this.lobbyState === 'SELECTING_STAGE') {
      // Hero stands before Ancient Gate awaiting realm choice
      this.drawWalkingHero(ctx, 1.0, time);
    }
  }

  private drawChamberBackground(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    // 1. Deep stone foundation
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    // 2. Upper dungeon crypt wall (y: 0 -> 210)
    ctx.fillStyle = '#0f141f';
    ctx.fillRect(0, 0, w, 210);

    // Wall mortar brick pattern
    ctx.strokeStyle = '#080a10';
    ctx.lineWidth = 1.5;
    for (let y = 25; y < 210; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const offset = (Math.floor(y / 32) % 2) * 45;
      for (let x = offset; x < w; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 32);
        ctx.stroke();
      }
    }

    // Build once per canvas size instead of every frame — see cachedBgGradients' field
    // comment. Only geometry changes with w/h; the colors themselves are always the same.
    if (!this.cachedBgGradients || this.cachedBgGradients.w !== w || this.cachedBgGradients.h !== h) {
      const wallAmbient = ctx.createRadialGradient(this.gateX, this.gateY + 20, 40, this.gateX, this.gateY + 20, 420);
      wallAmbient.addColorStop(0, 'rgba(255, 150, 50, 0.08)');
      wallAmbient.addColorStop(0.6, 'rgba(180, 80, 20, 0.03)');
      wallAmbient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      const dais = ctx.createLinearGradient(0, 210, 0, 295);
      dais.addColorStop(0, '#131826');
      dais.addColorStop(1, '#1a2233');

      const leftShadow = ctx.createLinearGradient(0, 295, 583, 295);
      leftShadow.addColorStop(0, 'rgba(8, 11, 17, 0.55)');
      leftShadow.addColorStop(1, 'rgba(8, 11, 17, 0.05)');

      const rightShadow = ctx.createLinearGradient(w, 295, 1018, 295);
      rightShadow.addColorStop(0, 'rgba(8, 11, 17, 0.55)');
      rightShadow.addColorStop(1, 'rgba(8, 11, 17, 0.05)');

      const floor = ctx.createLinearGradient(0, 330, 0, h);
      floor.addColorStop(0, '#141a27');
      floor.addColorStop(0.4, '#1b2234');
      floor.addColorStop(1, '#0c1017');

      const floorAura = ctx.createRadialGradient(w / 2, 430, 80, w / 2, 430, 480);
      floorAura.addColorStop(0, 'rgba(40, 56, 85, 0.22)');
      floorAura.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.cachedBgGradients = { w, h, wallAmbient, dais, leftShadow, rightShadow, floor, floorAura };
    }
    const bgGrad = this.cachedBgGradients;

    // Wall torchlight ambient warmth
    ctx.fillStyle = bgGrad.wallAmbient;
    ctx.fillRect(0, 0, w, 210);

    // 3. Elevated Dais / Balcony for Back-Tier Heroes (y: 210 -> 295)
    ctx.fillStyle = bgGrad.dais;
    ctx.fillRect(0, 210, w, 85);

    // Dais stone trim cornice at top (y: 208 -> 214)
    ctx.fillStyle = '#263045';
    ctx.fillRect(0, 208, w, 4);
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, 212, w, 2);

    // Dais floor flagstone grid
    ctx.strokeStyle = '#101520';
    ctx.lineWidth = 1.2;
    for (let y = 240; y < 295; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 40; x < w; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, 214);
      ctx.lineTo(x, 295);
      ctx.stroke();
    }

    // Dais edge border curb
    ctx.fillStyle = '#222b3d';
    ctx.fillRect(0, 295, w, 3);
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 298, w, 2);

    // 4. Central Ceremonial Flight of Steps (x: 583 -> 1018, y: 298 -> 330)
    // Avoids cutting across foreground champions on left/right wings
    const stepTreads = [
      { y: 298, left: 612, right: 989 },
      { y: 306, left: 597, right: 1003 },
      { y: 314, left: 583, right: 1018 },
      { y: 322, left: 568, right: 1032 }
    ];
    stepTreads.forEach((st, i) => {
      const sw = st.right - st.left;
      ctx.fillStyle = '#07090e';
      ctx.fillRect(st.left, st.y, sw, 3);
      ctx.fillStyle = i % 2 === 0 ? '#181f2c' : '#1c2433';
      ctx.fillRect(st.left, st.y + 3, sw, 5);
      ctx.fillStyle = 'rgba(197, 160, 89, 0.25)';
      ctx.fillRect(st.left, st.y + 3, sw, 1);
    });

    // Shadowing on dais wings (behind front heroes) for smooth atmospheric depth
    ctx.fillStyle = bgGrad.leftShadow;
    ctx.fillRect(0, 295, 583, 35);

    ctx.fillStyle = bgGrad.rightShadow;
    ctx.fillRect(1018, 295, w - 1018, 35);

    // 5. Grand Foreground Sanctuary Floor (y: 330 -> 540)
    ctx.fillStyle = bgGrad.floor;
    ctx.fillRect(0, 330, w, h - 330);

    // Flagstone horizontal joints
    ctx.strokeStyle = '#0a0e16';
    ctx.lineWidth = 1.5;
    for (let y = 330; y < h; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Perspective radial floor lines radiating from portal center
    for (let x = 0; x <= w; x += 115) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(this.gateX + (x - this.gateX) * 0.32, 330);
      ctx.stroke();
    }

    // Grand foreground ambient lighting pool
    ctx.fillStyle = bgGrad.floorAura;
    ctx.fillRect(0, 330, w, h - 330);
  }

  private drawGateOfTorment(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, isWalking: boolean): void {
    const gx = this.gateX;
    const gy = this.gateY;

    // 1. Torches on left and right walls
    const torchFlicker1 = 0.9 + Math.sin(time * 0.012) * 0.1;
    const torchFlicker2 = 0.9 + Math.cos(time * 0.015) * 0.1;

    // Left Torch light aura
    const light1 = ctx.createRadialGradient(gx - 145, gy + 15, 10, gx - 145, gy + 15, 120);
    light1.addColorStop(0, `rgba(255, 140, 40, ${0.28 * torchFlicker1})`);
    light1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = light1;
    ctx.beginPath();
    ctx.arc(gx - 145, gy + 15, 120, 0, Math.PI * 2);
    ctx.fill();

    // Right Torch light aura
    const light2 = ctx.createRadialGradient(gx + 145, gy + 15, 10, gx + 145, gy + 15, 120);
    light2.addColorStop(0, `rgba(255, 140, 40, ${0.28 * torchFlicker2})`);
    light2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = light2;
    ctx.beginPath();
    ctx.arc(gx + 145, gy + 15, 120, 0, Math.PI * 2);
    ctx.fill();

    // 2. Swirling Portal Vortex inside Gate
    const portalRadius = isWalking ? 82 : 72;
    const portalSpeed = isWalking ? 0.006 : 0.0025;
    const portalGrad = ctx.createRadialGradient(gx, gy + 20, 5, gx, gy + 20, portalRadius);
    portalGrad.addColorStop(0, isWalking ? '#ffffff' : '#ffd166');
    portalGrad.addColorStop(0.25, '#c77dff');
    portalGrad.addColorStop(0.65, '#5a189a');
    portalGrad.addColorStop(0.95, '#10002b');
    portalGrad.addColorStop(1, '#05010a');

    ctx.save();
    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    // Portal Arch shape
    ctx.arc(gx, gy + 20, portalRadius, Math.PI, 0, false);
    ctx.lineTo(gx + portalRadius, gy + 100);
    ctx.lineTo(gx - portalRadius, gy + 100);
    ctx.closePath();
    ctx.fill();

    // Swirling portal soul wisps
    ctx.translate(gx, gy + 20);
    const swirlAngle = time * portalSpeed;
    ctx.rotate(swirlAngle);
    ctx.strokeStyle = 'rgba(235, 190, 255, 0.4)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 20 + i * 12, i * 1.5, i * 1.5 + Math.PI * 0.8);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Ancient Stone Arch Architecture
    ctx.save();
    ctx.translate(gx, gy);

    // Stone Pillars Left & Right
    ctx.fillStyle = '#262f3e';
    ctx.strokeStyle = '#3e4c63';
    ctx.lineWidth = 2.5;

    // Left Pillar
    ctx.fillRect(-105, 10, 32, 115);
    ctx.strokeRect(-105, 10, 32, 115);

    // Right Pillar
    ctx.fillRect(73, 10, 32, 115);
    ctx.strokeRect(73, 10, 32, 115);

    // Massive Stone Arch Vault Top
    ctx.beginPath();
    ctx.arc(0, 20, 105, Math.PI, 0, false);
    ctx.lineWidth = 28;
    ctx.strokeStyle = '#222a38';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 20, 105, Math.PI, 0, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4a5b78';
    ctx.stroke();

    // Keystone sigil emblem at top of arch
    ctx.fillStyle = '#1c2331';
    ctx.beginPath();
    ctx.arc(0, -90, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '600 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c5a059';
    ctx.fillText('Ω', 0, -89);

    // Iron Wall Torch Sconces
    // Left Torch
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(-147, 30, 8, 20);
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.ellipse(-143, 25, 7, 14 * torchFlicker1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe49e';
    ctx.beginPath();
    ctx.ellipse(-143, 27, 4, 8 * torchFlicker1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right Torch
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(139, 30, 8, 20);
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.ellipse(143, 25, 7, 14 * torchFlicker2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe49e';
    ctx.beginPath();
    ctx.ellipse(143, 27, 4, 8 * torchFlicker2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Runic Header Banner
    ctx.font = '700 12px "Prompt", Cinzel, sans-serif';
    ctx.fillStyle = '#c5a059';
    ctx.shadowColor = 'rgba(197, 160, 89, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText('◆  GATE OF TORMENT  ◆', 0, -118);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private drawPedestal(
    ctx: CanvasRenderingContext2D,
    slot: PedestalSlot,
    isHovered: boolean,
    isSelected: boolean,
    time: number,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(slot.x, slot.y);

    const def = CLASS_DEFINITIONS[slot.heroClass];
    const classColor = `#${def.color.toString(16).padStart(6, '0')}`;

    const isFront = slot.tier === 'FRONT';
    const discRadiusX = isFront ? 72 : 52;
    const discRadiusY = isFront ? 20 : 15;
    const cylRadiusY = isFront ? 22 : 16;
    const cylOffsetY = isFront ? 10 : 8;
    const ringRadiusX = isFront ? 60 : 42;
    const ringRadiusY = isFront ? 16 : 12;
    const shadowRadiusX = isFront ? 38 : 26;
    const shadowRadiusY = isFront ? 11 : 8;
    const shadowOffsetY = isFront ? -4 : -3;
    const pillY = isFront ? 32 : 24;
    const pillWidth = isFront ? 118 : 96;
    const pillHeight = isFront ? 20 : 18;
    const pillFont = isFront ? 'bold 11px Cinzel, serif' : 'bold 9.5px Cinzel, serif';

    // Ground aura when hovered or selected
    if (isSelected || isHovered) {
      const auraRadiusX = isFront ? 80 : 58;
      const auraRadiusY = isFront ? 28 : 20;
      const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadiusX);
      auraGrad.addColorStop(0, isSelected ? `${classColor}55` : `${classColor}25`);
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, auraRadiusX, auraRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Base Stone Cylinder (Lower rim)
    ctx.fillStyle = '#171d29';
    ctx.beginPath();
    ctx.ellipse(0, cylOffsetY, discRadiusX, cylRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0e121a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Upper Stone Disc Surface
    ctx.fillStyle = isSelected ? '#252f42' : isHovered ? '#202838' : '#1c2331';
    ctx.beginPath();
    ctx.ellipse(0, 0, discRadiusX, discRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Runic Ring
    if (isSelected) {
      // Animated spinning golden runic circle
      ctx.save();
      ctx.rotate(time * 0.001);
      ctx.strokeStyle = '#c5a059';
      ctx.shadowColor = 'rgba(197, 160, 89, 0.6)';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = isHovered ? classColor : '#36435c';
      ctx.lineWidth = isHovered ? 2 : 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hero Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, shadowOffsetY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pedestal Nameplate Plaque below
    const isUnlocked = MetaProgression.isHeroUnlocked(slot.heroClass);
    ctx.font = isFront ? '600 11px "Prompt", Cinzel, sans-serif' : '600 9.5px "Prompt", Cinzel, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const pillText = !isUnlocked
      ? `SEALED · ${slot.name.toUpperCase()}`
      : isSelected
        ? `◆ ${slot.name.toUpperCase()} ◆`
        : slot.name.toUpperCase();

    ctx.fillStyle = isSelected
      ? 'rgba(28, 22, 12, 0.95)'
      : isHovered
        ? 'rgba(20, 26, 38, 0.92)'
        : 'rgba(12, 16, 24, 0.90)';
    ctx.strokeStyle = !isUnlocked
      ? '#334155'
      : isSelected
        ? '#c5a059'
        : isHovered
          ? classColor
          : '#1f283b';
    ctx.lineWidth = isSelected ? 1.5 : 1;

    // Draw plaque background with crisp 2px corners
    ctx.beginPath();
    ctx.roundRect(-pillWidth / 2, pillY - pillHeight / 2, pillWidth, pillHeight, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = !isUnlocked
      ? '#64748b'
      : isSelected
        ? '#e6c875'
        : isHovered
          ? '#ffffff'
          : '#cbd5e1';
    ctx.fillText(pillText, 0, pillY);

    ctx.restore();
  }

  private drawHeroOnPedestal(
    ctx: CanvasRenderingContext2D,
    slot: PedestalSlot,
    isHovered: boolean,
    isSelected: boolean,
    time: number,
    alpha: number
  ): void {
    const sprites = this.spriteGen.playerSprites.get(slot.heroClass);
    if (!sprites) return;

    const isUnlocked = MetaProgression.isHeroUnlocked(slot.heroClass);
    const isFront = slot.tier === 'FRONT';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(slot.x, slot.y);

    // Subtle bobbing motion
    let bobY = 0;
    if (slot.heroClass === PlayerClass.SORCERESS || slot.heroClass === PlayerClass.CELESTIAL_MECHA) {
      // Levitating enchantress & GN hover thrusters
      bobY = Math.sin(time * 0.0035) * 5 - 6;
    } else {
      // Idle breathing sway
      bobY = Math.sin(time * 0.0025 + slot.x) * 2;
    }
    ctx.translate(0, bobY);

    const scale = isFront
      ? (isHovered && !isSelected ? 1.30 : isSelected ? 1.35 : 1.22)
      : (isHovered && !isSelected ? 1.02 : isSelected ? 1.08 : 0.95);
    ctx.scale(scale, scale);

    // Frame selection
    let frame: HTMLCanvasElement;
    if (isSelected) {
      // Selected hero alternates between idle stance and subtle weapon ready
      const cycle = (time / 1000) % 4.0;
      if (cycle > 3.0) {
        // Quick attack pose
        const atkIdx = Math.floor(((cycle - 3.0) / 1.0) * 4) % 4;
        frame = sprites.attack[atkIdx]?.canvas || sprites.attack[0].canvas;
      } else {
        frame = sprites.idle[0]?.canvas || sprites.walk[0].canvas;
      }
    } else if (isHovered) {
      // Hovered hero stands alert
      frame = sprites.idle[1]?.canvas || sprites.idle[0]?.canvas || sprites.walk[0].canvas;
    } else {
      // Normal idle breathing
      const idleStep = Math.floor((time / 700) % 2);
      frame = sprites.idle[idleStep]?.canvas || sprites.walk[0].canvas;
    }

    ctx.imageSmoothingEnabled = false;

    // Dark silhouette for locked heroes
    if (!isUnlocked) {
      ctx.filter = 'brightness(0.32) grayscale(85%)';
    }

    ctx.drawImage(frame, -64, -112, 128, 128);

    if (!isUnlocked) {
      ctx.filter = 'none';

      // Forged iron padlock seal on locked champions (crafted vector badge, NO raw emoji)
      const lockY = isFront ? -54 : -46;
      ctx.save();
      ctx.translate(0, lockY);

      // Dark seal circular backplate
      ctx.fillStyle = 'rgba(10, 14, 22, 0.92)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Padlock shackle
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -4, 4.5, Math.PI, 0, false);
      ctx.stroke();

      // Padlock body
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-5.5, -3, 11, 9, 1.5);
      ctx.fill();
      ctx.stroke();

      // Keyhole dot
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  private drawPlayerGroundAura(ctx: CanvasRenderingContext2D, slot: PedestalSlot, time: number): void {
    const playersOnPedestal = this.connectedPlayers.filter((p) => p.playerClass === slot.heroClass);
    if (playersOnPedestal.length === 0) return;

    const isFront = slot.tier === 'FRONT';
    const hasReady = playersOnPedestal.some((p) => p.ready);
    const auraRadiusX = isFront ? 66 : 46;
    const auraRadiusY = isFront ? 19 : 14;

    ctx.save();
    ctx.translate(slot.x, slot.y);

    // Soft feathered radial floor glow under hero's feet (flat ellipse on pedestal, NO vertical rectangle box)
    const pulse = 0.9 + Math.sin(time * 0.004) * 0.1;
    const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, auraRadiusX);
    if (hasReady) {
      auraGrad.addColorStop(0, `rgba(46, 196, 182, ${0.40 * pulse})`);
      auraGrad.addColorStop(0.5, `rgba(46, 196, 182, ${0.15 * pulse})`);
      auraGrad.addColorStop(1, 'rgba(46, 196, 182, 0)');
    } else {
      auraGrad.addColorStop(0, `rgba(229, 193, 88, ${0.35 * pulse})`);
      auraGrad.addColorStop(0.5, `rgba(229, 193, 88, ${0.12 * pulse})`);
      auraGrad.addColorStop(1, 'rgba(229, 193, 88, 0)');
    }

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, auraRadiusX, auraRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawWalkingHero(ctx: CanvasRenderingContext2D, progress: number, time: number): void {
    const sprites = this.spriteGen.playerSprites.get(this.selectedClass);
    if (!sprites) return;

    // Smoothstep easing for walking path towards gate
    const ease = progress * progress * (3 - 2 * progress);
    const startX = this.walkingHeroState.startX;
    const startY = this.walkingHeroState.startY;
    const targetX = this.gateX;
    const targetY = this.gateY + 30;

    const currentX = startX + (targetX - startX) * ease;
    const currentY = startY + (targetY - startY) * ease;
    // Perspective scale decreases as hero enters the distance
    const currentScale = 1.35 * (1 - 0.50 * ease);

    // Hero remains visible while standing before the gate waiting for stage choice
    const alpha = 1.0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(currentX, currentY);
    ctx.scale(currentScale, currentScale);

    // Footstep shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, -4, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stance: Walk cycle while moving, idle breathing when arrived at the gate
    let frame: HTMLCanvasElement;
    if (progress >= 1.0) {
      const idleStep = Math.floor((time / 700) % 2);
      frame = sprites.idle[idleStep]?.canvas || sprites.walk[0].canvas;
    } else {
      const walkStep = Math.floor((time / 140) % 4);
      frame = sprites.walk[walkStep]?.canvas || sprites.walk[0].canvas;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, -64, -112, 128, 128);

    ctx.restore();
  }

  private drawPlayerBadgesOnPedestal(ctx: CanvasRenderingContext2D, slot: PedestalSlot, time: number): void {
    // Check which connected players picked this hero class
    const playersOnPedestal = this.connectedPlayers.filter((p) => p.playerClass === slot.heroClass);
    if (playersOnPedestal.length === 0) return;

    const isFront = slot.tier === 'FRONT';

    ctx.save();
    ctx.translate(slot.x, slot.y);

    // Floating Nameplate Badges above Hero (stacked if multiple players)
    // Clear elevation above champion head so it doesn't overlap back-tier dais
    const baseBadgeY = isFront ? -126 : -112;
    const badgeSpacing = 26;

    // Prioritize local player at primary bottom position
    const sortedPlayers = [...playersOnPedestal].sort((a, b) => (a.name === this.playerName ? -1 : 1));

    sortedPlayers.forEach((player, idx) => {
      const isMe = player.name === this.playerName;
      const badgeY = baseBadgeY - idx * badgeSpacing;
      const isReady = player.ready;

      // Floating gentle bob
      const bob = Math.sin(time * 0.003 + idx * 1.5) * 2.5;
      const y = Math.round(badgeY + bob);

      // Text setup - Prompt font for clean gaming typography
      const isTh = I18n.getLanguage() === 'th';
      const meTag = isMe ? (isTh ? ' [คุณ]' : ' [YOU]') : '';
      const nameText = `${player.name}${meTag}`;
      const statusText = isReady ? (isTh ? 'พร้อม' : 'READY') : (isTh ? 'รอพร้อม' : 'WAIT');

      ctx.font = '600 11px "Prompt", sans-serif';
      const nameWidth = ctx.measureText(nameText).width;
      ctx.font = '600 9.5px "Prompt", sans-serif';
      const statusWidth = ctx.measureText(statusText).width;

      const statusBoxPadding = 14;
      const statusBoxWidth = Math.max(38, statusWidth + statusBoxPadding);
      const totalWidth = nameWidth + statusBoxWidth + 24;
      const badgeHeight = 24;
      const startX = -totalWidth / 2;

      // Badge background - Gothic forged slate with 2px corners
      ctx.beginPath();
      ctx.roundRect(startX, y - 12, totalWidth, badgeHeight, 2);
      ctx.fillStyle = isMe ? 'rgba(17, 21, 30, 0.95)' : 'rgba(12, 16, 24, 0.93)';
      ctx.fill();

      // Badge border
      ctx.lineWidth = isMe ? 1.5 : 1;
      ctx.strokeStyle = isReady ? '#2ec4b6' : isMe ? '#c5a059' : '#334155';
      if (isReady || isMe) {
        ctx.shadowColor = isReady ? 'rgba(46, 196, 182, 0.5)' : 'rgba(197, 160, 89, 0.4)';
        ctx.shadowBlur = 6;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Name text
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '600 11px "Prompt", sans-serif';
      ctx.fillStyle = isMe ? '#e5c158' : '#e2e8f0';
      ctx.fillText(nameText, startX + 9, y);

      // Status bracket on right side
      const statusX = startX + nameWidth + 15;
      ctx.beginPath();
      ctx.roundRect(statusX, y - 8, statusBoxWidth, 16, 2);
      ctx.fillStyle = isReady ? 'rgba(46, 196, 182, 0.2)' : 'rgba(51, 65, 85, 0.35)';
      ctx.fill();
      ctx.strokeStyle = isReady ? '#2ec4b6' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '600 9.5px "Prompt", sans-serif';
      ctx.fillStyle = isReady ? '#2ec4b6' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, statusX + statusBoxWidth / 2, y);
    });

    ctx.restore();
  }

  public showToast(text: string): void {
    this.toastNotification = {
      text,
      expiry: performance.now() + 3500
    };
  }

  private drawLobbyToast(ctx: CanvasRenderingContext2D, w: number, time: number): void {
    if (!this.toastNotification) return;
    const now = performance.now();
    if (now > this.toastNotification.expiry) {
      this.toastNotification = null;
      return;
    }

    const remaining = this.toastNotification.expiry - now;
    const alpha = Math.min(1, remaining / 500);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 12px "Prompt", sans-serif';
    const textWidth = ctx.measureText(this.toastNotification.text).width;
    const pillWidth = textWidth + 36;
    const pillHeight = 30;
    const pillX = w / 2 - pillWidth / 2;
    const pillY = 16;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 2);
    ctx.fillStyle = 'rgba(12, 16, 24, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(197, 160, 89, 0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.toastNotification.text, w / 2, pillY + pillHeight / 2);

    ctx.restore();
  }

  public updateParty(
    players: { id: string; name: string; playerClass: PlayerClass; ready: boolean }[],
    isStarted: boolean = false,
    stageId: number = 1
  ): void {
    // Detect new players joining to show Toast notification!
    if (this.connectedPlayers.length > 0 && players.length > this.connectedPlayers.length) {
      const existingIds = new Set(this.connectedPlayers.map((p) => p.id));
      const newJoined = players.filter((p) => !existingIds.has(p.id));
      if (newJoined.length > 0) {
        const isTh = I18n.getLanguage() === 'th';
        const msg = isTh
          ? `${newJoined.map((p) => p.name).join(', ')} เข้าร่วมห้องรบแล้ว`
          : `${newJoined.map((p) => p.name).join(', ')} joined the crusade`;
        this.showToast(msg);
        this.sound?.playLevelUp();
      }
    }

    this.connectedPlayers = players;
    this.isCrusadeActive = isStarted;
    this.activeStageId = stageId;

    const listEl = this.container.querySelector('#party-list');
    if (listEl) {
      const isTh = I18n.getLanguage() === 'th';
      listEl.innerHTML = players
        .map((p) => {
          const def = CLASS_DEFINITIONS[p.playerClass];
          const className = isTh ? def.thaiName : def.name;
          const statusText = p.ready ? I18n.t('lobby.status_ready') : I18n.t('lobby.status_waiting');
          const isMe = p.name === this.playerName;
          return `
            <div class="party-slot ${isMe ? 'party-slot-me' : ''}">
              <div class="party-color" style="background: #${def.color.toString(16).padStart(6, '0')}"></div>
              <div class="party-name">${escapeHtml(p.name)} ${isMe ? `<span class="party-you-tag">(${I18n.t('lobby.party_you')})</span>` : ''}</div>
              <div class="party-class">${className}</div>
              <div class="party-status ${p.ready ? 'ready' : 'not-ready'}">${statusText}</div>
            </div>
          `;
        })
        .join('');
    }

    // Update Start Button state if crusade is active
    const startBtn = this.container.querySelector('#btn-start') as HTMLButtonElement;
    if (startBtn && this.lobbyState === 'CHOOSING') {
      const isTh = I18n.getLanguage() === 'th';
      const isUnlocked = MetaProgression.isHeroUnlocked(this.selectedClass);
      if (!isUnlocked) {
        startBtn.disabled = true;
        startBtn.classList.add('btn-locked');
        startBtn.innerHTML = isTh ? 'ต้องปลดล็อกตัวละครก่อน' : 'HERO LOCKED';
      } else if (this.isCrusadeActive) {
        startBtn.disabled = false;
        startBtn.classList.remove('btn-locked');
        startBtn.classList.add('btn-dropin-active');
        startBtn.innerHTML = isTh ? `เข้าร่วมการรบ (ด่าน ${this.activeStageId})` : `JOIN CRUSADE (STAGE ${this.activeStageId})`;
      } else {
        startBtn.disabled = false;
        startBtn.classList.remove('btn-locked');
        startBtn.classList.remove('btn-dropin-active');
        startBtn.innerHTML = I18n.t('lobby.btn_enter_gate');
      }
    }
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public setPlayerName(name: string): void {
    this.playerName = name;
    const input = this.container.querySelector('#input-player-name') as HTMLInputElement;
    if (input) input.value = name;
  }

  public refreshCoins(): void {
    const coinEl = this.container.querySelector('#lobby-coin-count');
    if (coinEl) {
      coinEl.textContent = MetaProgression.getCoins().toString();
    }
    const claimCount = MetaProgression.getClaimableTrialsCount();
    const badge = this.container.querySelector('#trials-claim-badge') as HTMLElement;
    if (badge) {
      if (claimCount > 0) {
        badge.textContent = claimCount.toString();
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  private updateClassUI(c: PlayerClass): void {
    const def = CLASS_DEFINITIONS[c];
    const classColor = `#${def.color.toString(16).padStart(6, '0')}`;

    const sigilMap: Record<PlayerClass, string> = {
      [PlayerClass.SWORDSMAN]: 'I',
      [PlayerClass.ARCHER]: 'II',
      [PlayerClass.SORCERESS]: 'III',
      [PlayerClass.CLERIC]: 'IV',
      [PlayerClass.COMMANDO]: 'V',
      [PlayerClass.CAT_TANK]: 'VI',
      [PlayerClass.COWBOY]: 'VII',
      [PlayerClass.CELESTIAL_MECHA]: 'VIII',
      [PlayerClass.GAMBLER]: 'IX'
    };

    const isTh = I18n.getLanguage() === 'th';
    const defName = isTh ? def.thaiName : def.name;
    const defTitle = isTh ? def.thaiTitle : def.title;
    const defDesc = isTh ? def.thaiDescription : def.description;
    const defWeapon = isTh ? def.thaiWeaponName : def.weaponName;
    const defSpec = isTh ? def.thaiSpecialization : def.specialization;

    const nameEl = this.container.querySelector('#insp-name');
    const titleEl = this.container.querySelector('#insp-title');
    const elemEl = this.container.querySelector('#insp-element');
    const descEl = this.container.querySelector('#insp-desc');
    const weaponEl = this.container.querySelector('#insp-weapon');
    const specEl = this.container.querySelector('#insp-spec');
    const iconEl = this.container.querySelector('#insp-icon');

    if (nameEl) {
      nameEl.textContent = defName.toUpperCase();
      (nameEl as HTMLElement).style.color = classColor;
    }
    if (titleEl) titleEl.textContent = defTitle.toUpperCase();
    if (elemEl) elemEl.textContent = `${def.elementalTitle}`;
    if (descEl) descEl.textContent = defDesc;
    if (weaponEl) weaponEl.textContent = `${defWeapon} (${def.weaponCooldown}s ${I18n.t('lobby.cooldown')})`;
    if (specEl) specEl.textContent = defSpec;
    if (iconEl) {
      iconEl.textContent = sigilMap[c] || '◆';
      (iconEl as HTMLElement).style.borderColor = classColor;
      (iconEl as HTMLElement).style.color = classColor;
    }

    const hpEl = this.container.querySelector('#stat-hp') as HTMLElement;
    const spdEl = this.container.querySelector('#stat-spd') as HTMLElement;
    const dmgEl = this.container.querySelector('#stat-dmg') as HTMLElement;
    const defEl = this.container.querySelector('#stat-def') as HTMLElement;

    if (hpEl) hpEl.style.width = `${Math.min(100, (def.stats.maxHp / 350) * 100)}%`;
    if (spdEl) spdEl.style.width = `${Math.min(100, (def.stats.moveSpeed / 220) * 100)}%`;
    if (dmgEl) dmgEl.style.width = `${Math.min(100, (def.stats.flatDamage / 40) * 100)}%`;
    if (defEl) defEl.style.width = `${Math.min(100, (def.stats.defense / 12) * 100)}%`;

    const valHp = this.container.querySelector('#val-hp');
    const valSpd = this.container.querySelector('#val-spd');
    const valDmg = this.container.querySelector('#val-dmg');
    const valDef = this.container.querySelector('#val-def');
    if (valHp) valHp.textContent = Math.round(def.stats.maxHp).toString();
    if (valSpd) valSpd.textContent = Math.round(def.stats.moveSpeed).toString();
    if (valDmg) valDmg.textContent = Math.round(def.stats.flatDamage).toString();
    if (valDef) valDef.textContent = Math.round(def.stats.defense).toString();

    // Hero Unlock Progress & Shop Buy Action
    const unlockContainer = this.container.querySelector('#hero-unlock-container') as HTMLElement;
    const isUnlocked = MetaProgression.isHeroUnlocked(c);

    if (unlockContainer) {
      if (isUnlocked) {
        unlockContainer.style.display = 'none';
        unlockContainer.innerHTML = '';
      } else {
        const req = MetaProgression.getHeroUnlockRequirement(c);
        const buyStatus = MetaProgression.canBuyHero(c);
        unlockContainer.style.display = 'block';

        if (req) {
          const reqText = isTh ? req.labelTh : req.labelEn;
          const conditionPassed = buyStatus.conditionMet;
          const progressPercent = Math.min(100, Math.round((buyStatus.currentVal / Math.max(1, buyStatus.targetVal)) * 100));
          const hasCoins = MetaProgression.getCoins() >= req.price;
          const canBuy = buyStatus.canBuy;

          unlockContainer.innerHTML = `
            <div class="hero-locked-banner ${conditionPassed ? 'unlocked-ready' : ''}">
              <div class="hero-unlock-condition">
                <span style="color: ${conditionPassed ? '#48bfe3' : '#64748b'}; font-weight: bold; font-size: 13px;">${conditionPassed ? '◆' : '◇'}</span>
                <span>${isTh ? 'เงื่อนไขปลดล็อก:' : 'Unlock Requirement:'} <strong>${reqText}</strong> (${buyStatus.currentVal.toLocaleString()} / ${buyStatus.targetVal.toLocaleString()})</span>
              </div>
              <div class="hero-unlock-progress-bar">
                <div class="hero-unlock-progress-fill" style="width: ${progressPercent}%;"></div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; gap: 8px;">
                <button id="btn-buy-hero" class="btn-buy-hero ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="10" fill="#ffd166" stroke="#b45309" stroke-width="2"/><circle cx="12" cy="12" r="7" stroke="#d97706" stroke-width="1.5" stroke-dasharray="2 2"/><text x="12" y="16" font-family="'Cinzel', serif" font-size="11" font-weight="900" fill="#78350f" text-anchor="middle">G</text></svg>
                  ${isTh ? `ซื้อตัวละคร (${req.price.toLocaleString()} ทอง)` : `Unlock Hero (${req.price.toLocaleString()} Gold)`}
                </button>
                <span style="font-size: 0.74rem; font-weight: 600; color: ${hasCoins ? '#c5a059' : '#ef4444'};">
                  ${isTh ? `ทองของคุณ: ${MetaProgression.getCoins().toLocaleString()} / ${req.price.toLocaleString()}` : `Your Gold: ${MetaProgression.getCoins().toLocaleString()} / ${req.price.toLocaleString()}`}
                </span>
              </div>
            </div>
          `;

          unlockContainer.querySelector('#btn-buy-hero')?.addEventListener('click', () => {
            if (MetaProgression.buyHero(c)) {
              this.sound?.playLevelUp();
              this.refreshCoins();
              this.updateClassUI(c);
              this.showToast(isTh ? `ปลดล็อก ${defName} สำเร็จ!` : `${def.name} Unlocked!`);
            }
          });
        }
      }
    }

    // Update Start Button state
    const startBtn = this.container.querySelector('#btn-start') as HTMLButtonElement;
    if (startBtn && this.lobbyState === 'CHOOSING') {
      if (!isUnlocked) {
        startBtn.disabled = true;
        startBtn.classList.add('btn-locked');
        startBtn.innerHTML = isTh ? 'ต้องปลดล็อกตัวละครก่อน' : 'HERO LOCKED';
      } else if (this.isCrusadeActive) {
        startBtn.disabled = false;
        startBtn.classList.remove('btn-locked');
        startBtn.classList.add('btn-dropin-active');
        startBtn.innerHTML = isTh ? `เข้าร่วมการรบ (ด่าน ${this.activeStageId})` : `JOIN CRUSADE (STAGE ${this.activeStageId})`;
      } else {
        startBtn.disabled = false;
        startBtn.classList.remove('btn-locked');
        startBtn.classList.remove('btn-dropin-active');
        startBtn.innerHTML = I18n.t('lobby.btn_enter_gate');
      }
    }
  }

  public stopPreview(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  public hide(): void {
    this.stopPreview();
    this.container.style.display = 'none';
  }

  public show(): void {
    this.container.style.display = 'block';
    this.lobbyState = 'CHOOSING';
    this.updateClassUI(this.selectedClass);
    const readyBtn = this.container.querySelector('#btn-ready') as HTMLButtonElement;
    if (readyBtn) readyBtn.disabled = false;
    this.initChamberCanvas();
  }

  private showStageSelectionModal(): void {
    let modal = this.container.querySelector('#stage-select-modal') as HTMLElement;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'stage-select-modal';
      modal.className = 'stage-modal-backdrop';
      this.container.appendChild(modal);
    }

    const isTh = I18n.getLanguage() === 'th';
    const stageList = [1, 2, 3];
    const cardsHtml = stageList
      .map((id) => {
        const stage = STAGES[id];
        const unlocked = MetaProgression.isStageUnlocked(id);
        const lockText = id === 2 ? I18n.t('stage.2.lock') : id === 3 ? I18n.t('stage.3.lock') : '';
        const stageName = isTh ? stage.thaiName : stage.name;
        const stageSub = isTh ? stage.name : stage.thaiName;
        const stageDesc = isTh ? I18n.t(`stage.${id}.desc`) : stage.description;
        const stageDiff = isTh ? I18n.t(`stage.${id}.diff`) : stage.difficultyLabel;

        return `
          <div class="stage-card ${unlocked ? 'unlocked' : 'locked'}" style="--stage-color: ${stage.themeColor}">
            <div class="stage-portal-glow"></div>
            <div class="stage-card-icon">${unlocked ? stage.portalIcon : '🔒'}</div>
            <div class="stage-card-title">${stageName}</div>
            <div class="stage-card-sub">${stageSub}</div>
            <div class="stage-diff-badge">${stageDiff}</div>

            <p class="stage-desc">${stageDesc}</p>

            <div class="stage-stats-box">
              <div class="stage-stat-row">
                <span class="stat-lbl">${I18n.t('stage.enemies_label')}</span>
                <span class="stat-val ${unlocked ? 'stat-danger' : ''}">HP x${stage.mobHpMultiplier} / DMG x${stage.mobDmgMultiplier}</span>
              </div>
              <div class="stage-stat-row">
                <span class="stat-lbl">${I18n.t('stage.rewards_label')}</span>
                <span class="stat-val ${unlocked ? 'stat-gold' : ''}">EXP x${stage.expMultiplier} / ${isTh ? 'ทอง' : 'Gold'} x${stage.goldMultiplier}</span>
              </div>
            </div>

            ${
              unlocked
                ? `<button class="btn-enter-stage" data-stage="${id}">${I18n.t('stage.enter_btn')}</button>`
                : `<div class="stage-lock-notice">🔒 ${lockText}</div>
                   <button class="btn-enter-stage btn-stage-locked" disabled>${I18n.t('stage.locked_btn')}</button>`
            }
          </div>
        `;
      })
      .join('');

    modal.innerHTML = `
      <div class="stage-modal-card">
        <div class="stage-modal-top">
          <div class="stage-modal-badge">${I18n.t('stage.modal_badge')}</div>
          <h2 class="stage-modal-title">${I18n.t('stage.modal_title')}</h2>
          <p class="stage-modal-subtitle">${I18n.t('stage.modal_subtitle')}</p>
        </div>

        <div class="stage-grid">
          ${cardsHtml}
        </div>

        <div class="stage-modal-footer">
          <button id="btn-stage-back" class="btn btn-secondary btn-stage-back">${I18n.t('stage.back_btn')}</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    modal.querySelectorAll('.btn-enter-stage:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stageId = parseInt((btn as HTMLElement).getAttribute('data-stage') || '1', 10);
        modal.style.display = 'none';
        this.sound?.playPortalEnter();
        this.lobbyState = 'TRANSITION_COMPLETE';
        this.stopPreview();
        this.onStartGame(stageId);
      });
    });

    modal.querySelector('#btn-stage-back')?.addEventListener('click', () => {
      modal.style.display = 'none';
      this.cancelGateWalk();
    });
  }

  public cancelGateWalk(): void {
    this.lobbyState = 'CHOOSING';
    this.updateClassUI(this.selectedClass);
    const readyBtn = this.container.querySelector('#btn-ready') as HTMLButtonElement;
    if (readyBtn) readyBtn.disabled = false;
  }
}
