import { PlayerNetworkData, DamageNumberData, MonsterNetworkData, PickupNetworkData, PlayerClass } from '../../shared/types';
import { CLASS_DEFINITIONS } from '../../shared/classes';
import { SoundManager } from '../engine/SoundManager';
import { MiniMap } from './MiniMap';
import { I18n } from '../engine/I18n';
import { escapeHtml } from '../engine/sanitize';

interface ActiveFloatingText {
  x: number;
  y: number;
  amount: number;
  isCrit: boolean;
  label?: string;
  color?: string;
  age: number; // 0 to 1
}

// A burst kill (AoE clearing a pack) spawns one damage number per monster in the same tick,
// all first-rendered on the same frame — with no cap, that's an unbounded stutter spike
// exactly when a lot of enemies (and their drops) appear at once. Bounding this trims the
// oldest excess rather than dropping the newest, so a burst never shows a half-finished set.
const MAX_FLOATING_TEXTS = 60;

export class HUD {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floatingTexts: ActiveFloatingText[] = [];
  private sound: SoundManager | null = null;
  public miniMap: MiniMap;
  public onDash: (() => void) | null = null;
  public onEscMenu: (() => void) | null = null;
  public onContinueRun: (() => void) | null = null;
  public onReturnToHub: (() => void) | null = null;

  constructor(container: HTMLElement, sound?: SoundManager) {
    this.container = container;
    this.sound = sound || null;

    const isTh = I18n.getLanguage() === 'th';

    // Create HUD wrapper
    const hudWrapper = document.createElement('div');
    hudWrapper.id = 'hud-layer';
    hudWrapper.className = 'hud-layer';
    hudWrapper.innerHTML = `
      <!-- Wraps the top stat bar and the banner stack below it in ONE flex column so the two
           space themselves based on actual rendered height, instead of each guessing a fixed
           top-offset for the other (see the '.hud-header-stack' CSS comment in index.html —
           this used to overlap visibly whenever the stat bar rendered slightly taller than the
           66px gap '.hud-banner-stack' assumed). -->
      <div class="hud-header-stack">
        <!-- Top Center Bar -->
        <div class="hud-top-bar">
          <div class="hud-stat-box wave-box">
            <span class="icon">⚔️</span>
            <span id="hud-wave">WAVE 1/30</span>
          </div>
          <div class="hud-stat-box timer-box">
            <span class="icon">⏳</span>
            <span id="hud-timer">00:00</span>
          </div>
          <div class="hud-stat-box kill-box">
            <span class="icon">💀</span>
            <span id="hud-kills">0</span>
          </div>
          <div class="hud-stat-box gold-box">
            <span class="icon">💰</span>
            <span id="hud-gold">0</span>
          </div>
        </div>

        <!-- Wraps the three banners below in a flex column so they space themselves based on
             actual rendered height instead of each guessing its own fixed top-offset (that's
             what let a long boss name push the deadline countdown into overlapping it). -->
        <div class="hud-banner-stack">
          <!-- Active Shrine Buff Banner -->
          <div id="hud-shrine-buff" class="hud-shrine-buff" style="display: none;">
            <span id="shrine-buff-icon" class="shrine-buff-icon">⚡</span>
            <span id="shrine-buff-name" class="shrine-buff-name">SHRINE OF SPEED</span>
            <span id="shrine-buff-timer" class="shrine-buff-timer">10.0s</span>
          </div>

          <!-- Boss Announcement Banner -->
          <div id="hud-boss-banner" class="hud-boss-banner" style="display: none;">
            <div class="boss-banner-label" id="hud-boss-banner-label">${I18n.t('hud.boss_encounter')}</div>
            <div id="hud-boss-name" class="boss-banner-name">ELITE GOLEM OF TORMENT</div>
            <div class="boss-hpbar-track">
              <div id="hud-boss-hpbar-fill" class="boss-hpbar-fill" style="width: 100%;"></div>
            </div>
          </div>

          <!-- Boss Execute Deadline Countdown (only visible once the grace period has passed) -->
          <div id="hud-deadline-banner" class="hud-deadline-banner" style="display: none;">
            <div class="deadline-banner-label">${I18n.t('hud.deadline_warning')}</div>
            <div id="hud-deadline-timer" class="deadline-banner-timer">5:00</div>
          </div>
        </div>
      </div>

      <!-- Full-screen red vignette that intensifies as the execute deadline approaches -->
      <div id="hud-deadline-vignette" class="hud-deadline-vignette" style="opacity: 0;"></div>

      <!-- Top Right: Volume Settings, Language Panel & ESC Menu -->
      <div class="hud-volume-panel">
        <button id="btn-hud-esc" class="btn-hud-esc" title="พักรบ & ดูข้อมูล (ESC) / Pause & Codex">⚙️ ESC</button>
        <button id="btn-hud-lang-toggle" class="btn-hud-lang" title="สลับภาษา / Toggle Language">
          ${isTh ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
        </button>
        <button id="btn-volume-mute" class="btn-vol" title="Toggle Mute">🔊</button>
        <input type="range" id="hud-volume-slider" class="volume-slider" min="0" max="100" value="30" title="Adjust Volume" />
        <span id="hud-volume-text" class="volume-text">30%</span>
      </div>

      <!-- Co-op Party Frames (Top Left) -->
      <div id="party-frames" class="party-frames"></div>

      <!-- On-Screen WASD Controller Pad (Bottom Left) -->
      <div id="wasd-controller" class="wasd-controller">
        <div class="wasd-title">${I18n.t('hud.wasd_title')}</div>
        <div class="wasd-row">
          <button id="wasd-btn-w" class="wasd-key" data-key="w" title="เดินขึ้น (W)">
            <span class="key-letter">W</span>
            <span class="key-sub">▲</span>
          </button>
        </div>
        <div class="wasd-row">
          <button id="wasd-btn-a" class="wasd-key" data-key="a" title="เดินซ้าย (A)">
            <span class="key-letter">A</span>
            <span class="key-sub">◀</span>
          </button>
          <button id="wasd-btn-s" class="wasd-key" data-key="s" title="เดินลง (S)">
            <span class="key-letter">S</span>
            <span class="key-sub">▼</span>
          </button>
          <button id="wasd-btn-d" class="wasd-key" data-key="d" title="เดินขวา (D)">
            <span class="key-letter">D</span>
            <span class="key-sub">▶</span>
          </button>
        </div>
        <div class="wasd-hint">${I18n.t('hud.wasd_hint')}</div>
      </div>

      <!-- Bottom Bar: Local Player Status -->
      <div class="hud-bottom-bar">
        <div class="exp-bar-container">
          <div id="hud-exp-fill" class="exp-fill"></div>
          <div id="hud-exp-text" class="exp-text">LEVEL 1 (0 / 10 EXP)</div>
        </div>

        <div class="hp-bar-container">
          <div id="hud-hp-fill" class="hp-fill"></div>
          <div id="hud-hp-text" class="hp-text">200 / 200 HP</div>
        </div>

        <!-- Innate Signature Passive Badge -->
        <div id="hud-passive-badge" class="hud-passive-badge" title="สกิลติดตัวประจำสายอาชีพ (Innate Hero Passive)">
          <div class="passive-badge-icon" id="hud-passive-icon">✨</div>
          <div class="passive-badge-content">
            <div class="passive-badge-header">
              <span class="passive-badge-tag">${isTh ? 'สกิลติดตัว' : 'INNATE PASSIVE'}</span>
              <span class="passive-badge-name" id="hud-passive-name">---</span>
            </div>
            <span class="passive-badge-desc" id="hud-passive-desc">---</span>
          </div>
        </div>

        <div class="controls-hint">
          <span id="hud-move-hint">${I18n.t('hud.move_hint')}</span>
          <span id="hud-aim-hint">${I18n.t('hud.aim_hint')}</span>
          <button id="btn-dash" class="btn-dash" title="Dash / Dodge Roll (Spacebar)">
            <span class="dash-icon">💨</span>
            <span id="hud-dash-lbl" class="dash-label">${I18n.t('hud.dash_btn')}</span>
            <div id="hud-dash-cd-overlay" class="dash-cd-overlay"></div>
            <span id="hud-dash-cd-text" class="dash-cd-text">${I18n.t('hud.dash_ready')}</span>
          </button>
          <button id="btn-toggle-autoaim" class="btn-toggle">${I18n.t('hud.autoaim_on')}</button>
        </div>
      </div>

      <!-- Game Over Modal -->
      <div id="game-over-modal" class="game-over-backdrop" style="display: none;">
        <div class="game-over-card">
          <h1 id="game-over-title">${I18n.t('gameover.defeat_title')}</h1>
          <p id="game-over-subtitle">${I18n.t('gameover.defeat_sub')}</p>
          <div class="game-over-stats">
            <div><span id="go-time-lbl">${I18n.t('gameover.time')}</span> <span id="go-time">00:00</span></div>
            <div><span id="go-kills-lbl">${I18n.t('gameover.kills')}</span> <span id="go-kills">0</span></div>
            <div><span id="go-gold-lbl">${I18n.t('gameover.gold')}</span> <span id="go-gold">0</span></div>
          </div>
          <button id="btn-continue-run" class="btn btn-primary" style="display: none;">${I18n.t('gameover.btn_continue')}</button>
          <button id="btn-retry" class="btn btn-primary">${I18n.t('gameover.btn_retry')}</button>
        </div>
      </div>
    `;

    // Canvas for floating damage numbers
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'damage-canvas';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d')!;

    hudWrapper.appendChild(this.canvas);
    this.miniMap = new MiniMap(hudWrapper);
    this.container.appendChild(hudWrapper);

    // Setup Volume Controls
    if (this.sound) {
      const currentVol = Math.round(this.sound.getVolume() * 100);
      const isMuted = this.sound.getIsMuted();
      const slider = document.getElementById('hud-volume-slider') as HTMLInputElement;
      const volText = document.getElementById('hud-volume-text');
      const muteBtn = document.getElementById('btn-volume-mute');

      if (slider) slider.value = currentVol.toString();
      if (volText) volText.textContent = isMuted ? 'MUTE' : `${currentVol}%`;
      if (muteBtn) muteBtn.textContent = isMuted ? '🔇' : (currentVol === 0 ? '🔇' : (currentVol < 50 ? '🔉' : '🔊'));

      slider?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        this.sound?.setVolume(val / 100);
        if (volText) volText.textContent = `${val}%`;
        if (muteBtn) muteBtn.textContent = val === 0 ? '🔇' : (val < 50 ? '🔉' : '🔊');
      });

      muteBtn?.addEventListener('click', () => {
        if (!this.sound) return;
        const muted = this.sound.toggleMute();
        const vol = Math.round(this.sound.getVolume() * 100);
        if (volText) volText.textContent = muted ? 'MUTE' : `${vol}%`;
        if (muteBtn) muteBtn.textContent = muted ? '🔇' : (vol < 50 ? '🔉' : '🔊');
      });
    }

    // Setup Language Toggle Button
    document.getElementById('btn-hud-lang-toggle')?.addEventListener('click', () => {
      I18n.toggleLanguage();
    });

    I18n.onLanguageChanged(() => {
      this.updateStaticLabels();
    });

    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      this.onReturnToHub?.();
    });

    document.getElementById('btn-continue-run')?.addEventListener('click', () => {
      this.onContinueRun?.();
    });

    document.getElementById('btn-dash')?.addEventListener('click', () => {
      this.onDash?.();
    });

    document.getElementById('btn-hud-esc')?.addEventListener('click', () => {
      this.onEscMenu?.();
    });
  }

  public updateStaticLabels(): void {
    const isTh = I18n.getLanguage() === 'th';
    const langBtn = document.getElementById('btn-hud-lang-toggle');
    if (langBtn) langBtn.textContent = isTh ? '🇹🇭 ภาษาไทย' : '🇬🇧 English';

    const wasdTitle = document.querySelector('.wasd-title');
    if (wasdTitle) wasdTitle.textContent = I18n.t('hud.wasd_title');

    const wasdHint = document.querySelector('.wasd-hint');
    if (wasdHint) wasdHint.textContent = I18n.t('hud.wasd_hint');

    const moveHint = document.getElementById('hud-move-hint');
    if (moveHint) moveHint.textContent = I18n.t('hud.move_hint');

    const aimHint = document.getElementById('hud-aim-hint');
    if (aimHint) aimHint.textContent = I18n.t('hud.aim_hint');

    const dashLbl = document.getElementById('hud-dash-lbl');
    if (dashLbl) dashLbl.textContent = I18n.t('hud.dash_btn');

    const bossBannerLabel = document.getElementById('hud-boss-banner-label');
    if (bossBannerLabel) bossBannerLabel.textContent = I18n.t('hud.boss_encounter');

    const goTimeLbl = document.getElementById('go-time-lbl');
    if (goTimeLbl) goTimeLbl.textContent = I18n.t('gameover.time');

    const goKillsLbl = document.getElementById('go-kills-lbl');
    if (goKillsLbl) goKillsLbl.textContent = I18n.t('gameover.kills');

    const goGoldLbl = document.getElementById('go-gold-lbl');
    if (goGoldLbl) goGoldLbl.textContent = I18n.t('gameover.gold');

    const btnRetry = document.getElementById('btn-retry');
    if (btnRetry) btnRetry.textContent = I18n.t('gameover.btn_retry');
  }

  public update(
    players: PlayerNetworkData[],
    localPlayerId: string,
    elapsedTime: number,
    totalKills: number,
    gold: number,
    damageNumbers: DamageNumberData[],
    camera: { x: number; y: number; zoom: number },
    currentWave: number = 1,
    maxWaves: number = 30,
    isBossWave: boolean = false,
    bossName?: string,
    waveTimeRemaining: number = 40,
    bossAlive: boolean = false,
    monsters: MonsterNetworkData[] = [],
    pickups: PickupNetworkData[] = [],
    dashCooldownRemaining: number = 0,
    activeBuff?: { type: string; durationRemaining: number },
    bossDeadlineRemaining: number | null = null,
    isEndless: boolean = false
  ): void {
    this.updateDeadlineWarning(bossDeadlineRemaining);

    // 0. Update Wave & Boss Banner
    const waveEl = document.getElementById('hud-wave');
    if (waveEl) {
      if (isBossWave && bossAlive) {
        waveEl.textContent = isEndless
          ? I18n.t('hud.wave_boss_endless', { wave: currentWave })
          : I18n.t('hud.wave_boss', { wave: currentWave, maxWaves });
        waveEl.style.color = '#ff4d6d';
      } else if (isEndless) {
        waveEl.textContent = I18n.t('hud.wave_endless', { wave: currentWave || 1 });
        waveEl.style.color = '#ffd166';
      } else {
        waveEl.textContent = I18n.t('hud.wave', { wave: currentWave || 1, maxWaves: maxWaves || 30 });
        waveEl.style.color = '#ffd166';
      }
    }

    const bossBannerEl = document.getElementById('hud-boss-banner');
    const bossNameEl = document.getElementById('hud-boss-name');
    const bossHpFillEl = document.getElementById('hud-boss-hpbar-fill');
    if (bossHpFillEl) {
      const bossMob = isBossWave && bossAlive ? monsters.find((m) => m.isBoss) : undefined;
      bossHpFillEl.style.width = `${bossMob ? bossMob.hpPercent : 100}%`;
    }
    if (bossBannerEl && bossNameEl) {
      if (isBossWave && bossName) {
        bossBannerEl.style.display = 'block';
        if (bossAlive) {
          bossNameEl.textContent = `${bossName} ${I18n.t('hud.boss_advance')}`;
        } else if (waveTimeRemaining > 0 && waveTimeRemaining <= 3) {
          bossNameEl.textContent = I18n.t('hud.boss_slain', { boss: bossName, sec: Math.ceil(waveTimeRemaining) });
        } else {
          bossNameEl.textContent = bossName;
        }
      } else {
        bossBannerEl.style.display = 'none';
      }
    }

    // 1. Update Timer (formatted mm:ss from 00:00 upwards, or DEFEAT BOSS when time runs out on boss wave)
    const timerEl = document.getElementById('hud-timer');
    if (timerEl) {
      if (isBossWave && bossAlive && waveTimeRemaining <= 0) {
        timerEl.textContent = I18n.t('hud.defeat_boss');
        timerEl.style.color = '#ff4d6d';
      } else {
        const elapsed = Math.max(0, Math.floor(elapsedTime));
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
        timerEl.style.color = '#ffffff';
      }
    }

    const killsEl = document.getElementById('hud-kills');
    if (killsEl) killsEl.textContent = totalKills.toString();

    const goldEl = document.getElementById('hud-gold');
    if (goldEl) goldEl.textContent = gold.toString();

    // 2. Update Local Player HP & EXP
    const localPlayer = players.find((p) => p.id === localPlayerId);
    if (localPlayer) {
      const hpPercent = Math.max(0, (localPlayer.hp / localPlayer.maxHp) * 100);
      const hpFill = document.getElementById('hud-hp-fill');
      const hpText = document.getElementById('hud-hp-text');
      if (hpFill) hpFill.style.width = `${hpPercent}%`;
      if (hpText) hpText.textContent = I18n.t('hud.hp_format', { hp: Math.round(localPlayer.hp), maxHp: localPlayer.maxHp });

      const expPercent = Math.max(0, (localPlayer.exp / localPlayer.maxExp) * 100);
      const expFill = document.getElementById('hud-exp-fill');
      const expText = document.getElementById('hud-exp-text');
      if (expFill) expFill.style.width = `${expPercent}%`;
      if (expText) expText.textContent = I18n.t('hud.level_format', { lvl: localPlayer.level, exp: localPlayer.exp, maxExp: localPlayer.maxExp });

      // Update Innate Passive Badge
      const passiveNameEl = document.getElementById('hud-passive-name');
      const passiveDescEl = document.getElementById('hud-passive-desc');
      const passiveIconEl = document.getElementById('hud-passive-icon');
      if (passiveNameEl && passiveDescEl && passiveIconEl) {
        const isTh = I18n.getLanguage() === 'th';
        const passiveInfo = this.getInnatePassiveInfo(localPlayer.playerClass, isTh);
        passiveNameEl.textContent = passiveInfo.name;
        passiveDescEl.textContent = passiveInfo.desc;
        passiveIconEl.textContent = passiveInfo.icon;
      }
    }

    // 2.1 Update Dash Button UI
    const dashBtn = document.getElementById('btn-dash');
    const dashOverlay = document.getElementById('hud-dash-cd-overlay');
    const dashText = document.getElementById('hud-dash-cd-text');
    if (dashBtn && dashOverlay && dashText) {
      if (dashCooldownRemaining > 0) {
        dashBtn.classList.add('on-cooldown');
        const pct = Math.min(100, Math.max(0, (dashCooldownRemaining / 3.0) * 100));
        dashOverlay.style.height = `${pct}%`;
        dashText.textContent = `${dashCooldownRemaining.toFixed(1)}s`;
      } else {
        dashBtn.classList.remove('on-cooldown');
        dashOverlay.style.height = '0%';
        dashText.textContent = I18n.t('hud.dash_ready');
      }
    }

    // 2.2 Update Active Shrine Buff Banner
    const shrineBuffEl = document.getElementById('hud-shrine-buff');
    const buffIconEl = document.getElementById('shrine-buff-icon');
    const buffNameEl = document.getElementById('shrine-buff-name');
    const buffTimerEl = document.getElementById('shrine-buff-timer');
    if (shrineBuffEl && buffIconEl && buffNameEl && buffTimerEl) {
      if (activeBuff && activeBuff.durationRemaining > 0) {
        shrineBuffEl.style.display = 'flex';
        buffTimerEl.textContent = `${activeBuff.durationRemaining.toFixed(1)}s`;
        if (activeBuff.type === 'SPEED') {
          buffIconEl.textContent = '⚡';
          buffNameEl.textContent = I18n.t('shrine.SPEED');
          shrineBuffEl.style.borderColor = '#00f2fe';
          shrineBuffEl.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.4)';
        } else if (activeBuff.type === 'FRENZY') {
          buffIconEl.textContent = '⚔️';
          buffNameEl.textContent = I18n.t('shrine.FRENZY');
          shrineBuffEl.style.borderColor = '#ff0055';
          shrineBuffEl.style.boxShadow = '0 0 15px rgba(255, 0, 85, 0.4)';
        } else if (activeBuff.type === 'AEGIS') {
          buffIconEl.textContent = '🛡️';
          buffNameEl.textContent = I18n.t('shrine.AEGIS');
          shrineBuffEl.style.borderColor = '#ffd700';
          shrineBuffEl.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.4)';
        } else if (activeBuff.type === 'GOLD_RUSH') {
          buffIconEl.textContent = '💰';
          buffNameEl.textContent = I18n.t('shrine.GOLD_RUSH');
          shrineBuffEl.style.borderColor = '#00ff88';
          shrineBuffEl.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.4)';
        }
      } else {
        shrineBuffEl.style.display = 'none';
      }
    }

    // 3. Update Co-op Party Frames (for all players)
    const partyFramesEl = document.getElementById('party-frames');
    if (partyFramesEl) {
      const isTh = I18n.getLanguage() === 'th';
      partyFramesEl.innerHTML = players
        .map((p) => {
          const classDef = CLASS_DEFINITIONS[p.playerClass];
          const className = isTh ? (classDef.thaiName || classDef.name) : classDef.name;
          const youLabel = isTh ? ` ${I18n.t('hud.party_you')}` : ' (You)';
          const hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
          const isDead = p.isDead;
          return `
            <div class="party-frame ${isDead ? 'frame-dead' : ''}">
              <div class="frame-header">
                <span class="frame-name">${escapeHtml(p.name)}${p.id === localPlayerId ? youLabel : ''}</span>
                <span class="frame-lvl">Lv.${p.level}</span>
              </div>
              <div class="frame-class" style="color: #${classDef.color.toString(16).padStart(6, '0')}">
                ${className}
              </div>
              <div class="frame-hp-bar">
                <div class="frame-hp-fill ${isDead ? 'dead-fill' : ''}" style="width: ${hpPct}%"></div>
              </div>
              ${isDead ? `<div class="frame-status">${I18n.t('hud.downed_status')}</div>` : ''}
            </div>
          `;
        })
        .join('');
    }

    // 4. Ingest new damage numbers
    for (const dmg of damageNumbers) {
      this.floatingTexts.push({
        x: dmg.x,
        y: dmg.y,
        amount: dmg.amount,
        isCrit: dmg.isCrit,
        label: dmg.label,
        color: dmg.color,
        age: 0
      });
    }
    if (this.floatingTexts.length > MAX_FLOATING_TEXTS) {
      this.floatingTexts.splice(0, this.floatingTexts.length - MAX_FLOATING_TEXTS);
    }

    // 5. Render floating damage numbers and offscreen revive indicators on 2D canvas
    this.renderFloatingNumbers(camera, players, localPlayerId);

    // 6. Update Radar MiniMap with items, boss and monsters
    this.miniMap.update(players, localPlayerId, monsters, pickups, bossAlive);
  }

  /**
   * Boss-execute deadline countdown + escalating red vignette (see HordeDirector.
   * isInDeadlineWarning/deadlineSecondsRemaining and GameRoom.tick()'s execute check).
   * `remaining` is null for the entire grace period — the countdown only appears once the
   * server actually starts counting down, matching "players get 90s to get their bearings
   * with no timer pressure at all" from the design.
   */
  private updateDeadlineWarning(remaining: number | null): void {
    const banner = document.getElementById('hud-deadline-banner');
    const timerEl = document.getElementById('hud-deadline-timer');
    const vignette = document.getElementById('hud-deadline-vignette');
    if (!banner || !timerEl || !vignette) return;

    if (remaining === null) {
      this.hideDeadlineWarning();
      return;
    }

    banner.style.display = 'flex';
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60).toString().padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;

    // Vignette only appears in the final minute so it doesn't wash out the screen for the
    // whole (up to 210s) warning window — ramps 0 -> ~0.55 opacity as remaining hits 0.
    const urgency = Math.max(0, Math.min(1, (60 - remaining) / 60));
    vignette.style.opacity = (urgency * 0.55).toString();
  }

  private hideDeadlineWarning(): void {
    const banner = document.getElementById('hud-deadline-banner');
    const vignette = document.getElementById('hud-deadline-vignette');
    if (banner) banner.style.display = 'none';
    if (vignette) vignette.style.opacity = '0';
  }

  private renderFloatingNumbers(
    camera: { x: number; y: number; zoom: number },
    players?: PlayerNetworkData[],
    localPlayerId?: string
  ): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 5.1 Render Off-screen Downed Teammates Pointers
    if (players && localPlayerId) {
      const localMe = players.find((p) => p.id === localPlayerId);
      for (const p of players) {
        if (p.id === localPlayerId || !p.isDead) continue;

        const screenX = (p.x - camera.x) * camera.zoom + this.canvas.width / 2;
        const screenY = (p.y - camera.y) * camera.zoom + this.canvas.height / 2;

        const distPx = localMe ? Math.hypot(p.x - localMe.x, p.y - localMe.y) : 0;
        const distM = Math.round(distPx / 20);

        const margin = 50;
        const isOffScreen =
          screenX < margin ||
          screenX > this.canvas.width - margin ||
          screenY < margin ||
          screenY > this.canvas.height - margin;

        if (isOffScreen) {
          const cx = this.canvas.width / 2;
          const cy = this.canvas.height / 2;
          const angle = Math.atan2(screenY - cy, screenX - cx);

          // Clamped boundary on screen edges
          const maxDistX = this.canvas.width / 2 - margin;
          const maxDistY = this.canvas.height / 2 - margin;
          const clampedX = Math.max(margin, Math.min(this.canvas.width - margin, cx + Math.cos(angle) * maxDistX));
          const clampedY = Math.max(margin, Math.min(this.canvas.height - margin, cy + Math.sin(angle) * maxDistY));

          this.ctx.save();
          this.ctx.translate(clampedX, clampedY);

          // Pulsating arrow pointer
          const pulse = 1.0 + Math.sin(Date.now() * 0.009) * 0.2;
          this.ctx.save();
          this.ctx.rotate(angle);
          this.ctx.scale(pulse, pulse);
          this.ctx.fillStyle = '#ef4444';
          this.ctx.shadowColor = '#dc2626';
          this.ctx.shadowBlur = 14;
          this.ctx.beginPath();
          this.ctx.moveTo(15, 0);
          this.ctx.lineTo(-7, -8);
          this.ctx.lineTo(-2, 0);
          this.ctx.lineTo(-7, 8);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.restore();

          // Text pill indicating friend name and distance
          const label = `💀 ${p.name} (${distM}m)`;
          this.ctx.font = 'bold 12px "Cinzel", sans-serif';
          this.ctx.fillStyle = '#fca5a5';
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
          this.ctx.lineWidth = 3;
          this.ctx.textAlign = 'center';
          this.ctx.strokeText(label, 0, -16);
          this.ctx.fillText(label, 0, -16);

          this.ctx.restore();
        }
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      text.age += 0.025;

      if (text.age >= 1.0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      // Convert 2.5D world coord to 2D screen coord
      const screenX = (text.x - camera.x) * camera.zoom + this.canvas.width / 2;
      const screenY = (text.y - camera.y) * camera.zoom + this.canvas.height / 2 - text.age * 45;

      // Skip offscreen numbers
      if (screenX < -100 || screenX > this.canvas.width + 100 || screenY < -100 || screenY > this.canvas.height + 100) {
        continue;
      }

      this.ctx.save();
      const alpha = 1.0 - text.age;
      this.ctx.globalAlpha = alpha;

      if (text.label) {
        this.ctx.font = 'bold 15px "Cinzel", sans-serif';
        this.ctx.fillStyle = text.color || '#f59e0b';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(text.label, screenX, screenY - 14);
        this.ctx.fillText(text.label, screenX, screenY - 14);
      }

      if (text.amount > 0) {
        if (text.isCrit) {
          this.ctx.fillStyle = text.color || '#ff0055';
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 3;
          this.ctx.font = 'bold 22px "Cinzel", sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.strokeText(`CRIT! ${text.amount}`, screenX, screenY);
          this.ctx.fillText(`CRIT! ${text.amount}`, screenX, screenY);
        } else {
          // This is the by-far-most-common case — one of these per hit, and a burst kill
          // (AoE clearing a pack) spawns a dozen-plus in the same frame. strokeText is
          // markedly more expensive than fillText (it builds glyph outline geometry to
          // stroke rather than just rasterizing the fill), and paying that per number was a
          // real, measured stutter right when a lot of enemies died/dropped loot at once. A
          // small shadow reads as an outline at this font size for a fraction of the cost —
          // see the EXP-gem/gold-coin comments above for the same shadowBlur-cost lesson
          // applied in reverse (small radius here, not skipped entirely, since legibility
          // against bright backgrounds still matters for a number this size).
          this.ctx.fillStyle = text.color || '#f8f9fa';
          this.ctx.shadowColor = '#000000';
          this.ctx.shadowBlur = 3;
          this.ctx.font = 'bold 16px "Cinzel", sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(`${text.amount}`, screenX, screenY);
          this.ctx.shadowBlur = 0;
        }
      }

      this.ctx.restore();
    }
  }

  public showGameOver(
    victory: boolean,
    survivalTime: number,
    totalKills: number,
    goldEarned: number,
    reason?: 'BOSS_ENRAGE_EXECUTE' | 'SURRENDER',
    canContinue: boolean = false
  ): void {
    const modal = document.getElementById('game-over-modal');
    if (!modal) return;

    const btnContinue = document.getElementById('btn-continue-run');
    if (btnContinue) btnContinue.style.display = canContinue ? 'inline-block' : 'none';

    modal.style.display = 'flex';
    const title = document.getElementById('game-over-title');
    const sub = document.getElementById('game-over-subtitle');
    const timeEl = document.getElementById('go-time');
    const killsEl = document.getElementById('go-kills');
    const goldEl = document.getElementById('go-gold');

    if (victory) {
      if (title) {
        title.textContent = I18n.t('gameover.victory_title');
        title.style.color = '#ffd166';
      }
      if (sub) sub.textContent = I18n.t('gameover.victory_sub');
    } else {
      if (title) {
        title.textContent = I18n.t('gameover.defeat_title');
        title.style.color = '#ef4444';
      }
      // The hard boss-execute deadline and a self-inflicted surrender each get their own
      // message so neither reads as a normal combat wipe — see HordeDirector.isDeadlineExpired
      // / GameRoom.tick() for the former, GameRoom.handleSurrender for the latter.
      if (sub) {
        if (reason === 'BOSS_ENRAGE_EXECUTE') sub.textContent = I18n.t('gameover.boss_enrage_execute');
        else if (reason === 'SURRENDER') sub.textContent = I18n.t('gameover.surrender_sub');
        else sub.textContent = I18n.t('gameover.defeat_sub');
      }
    }

    // Reset the deadline countdown UI so it doesn't linger into the next run's HUD.
    this.hideDeadlineWarning();

    const mins = Math.floor(survivalTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(survivalTime % 60).toString().padStart(2, '0');
    if (timeEl) timeEl.textContent = `${mins}:${secs}`;
    if (killsEl) killsEl.textContent = totalKills.toString();
    if (goldEl) goldEl.textContent = goldEarned.toString();
  }

  /** Hides the game-over/victory modal without touching the rest of the in-game view — used
   * by the Continue button (see onContinueRun) since the game keeps running underneath it. */
  public hideGameOver(): void {
    const modal = document.getElementById('game-over-modal');
    if (modal) modal.style.display = 'none';
  }

  public addFloatingMessage(x: number, y: number, text: string, color: string = '#facc15'): void {
    this.floatingTexts.push({
      x,
      y,
      amount: 0,
      isCrit: true,
      label: text,
      color,
      age: 0
    });
  }

  public getInnatePassiveInfo(playerClass: PlayerClass, isTh: boolean): { name: string; desc: string; icon: string } {
    switch (playerClass) {
      case PlayerClass.SWORDSMAN:
        return {
          icon: '🌪️',
          name: isTh ? 'พายุหมุนสะบั้นดาบ (Whirlwind)' : 'Blade Whirlwind',
          desc: isTh ? 'ทุกฟันครบ 3 ครั้ง ระเบิดพายุหมุน 360° + ปล่อยคลื่นดาบพิฆาต' : 'Every 3 swings: 360° whirlwind cleave + flying crescent wave'
        };
      case PlayerClass.CLERIC:
        return {
          icon: '☀️',
          name: isTh ? 'ประกายแสงศักดิ์สิทธิ์ (Holy Radiance)' : 'Holy Radiance',
          desc: isTh ? 'รัศมีเผามอนสเตอร์ต่อเนื่อง 0.5s พร้อมระเบิดฮีล & สไมต์ทุก 6s' : 'Aura burns foes every 0.5s; pulses holy heal & smite every 6s'
        };
      case PlayerClass.SORCERESS:
        return {
          icon: '🔮',
          name: isTh ? 'ลูกแก้วเวทมนตร์ (Orbiting Orbs)' : 'Orbiting Orbs',
          desc: isTh ? 'ลูกแก้วเยือกแข็งโคจรสร้างดาเมจน้ำแข็ง & ผลักศัตรูต่อเนื่อง' : 'Orbiting frost orbs deal continuous damage & knockback'
        };
      case PlayerClass.ARCHER:
        return {
          icon: '🏹',
          name: isTh ? 'ยิงลูกศรแยกสาย (Multishot)' : 'Multishot',
          desc: isTh ? 'ยิงลูกศรหลายดอกพร้อมกัน เจาะทะลวงฝูงศัตรู' : 'Fires multiple piercing arrows per shot'
        };
      case PlayerClass.COMMANDO:
        return {
          icon: '💣',
          name: isTh ? 'ระเบิดสังหาร (Frag Grenade)' : 'Frag Grenade',
          desc: isTh ? 'ปาระเบิดสังหารระเบิดเพลิงใส่ฝูงศัตรูทุก 4.5s' : 'Throws fragmentation grenades every 4.5s'
        };
      case PlayerClass.CAT_TANK:
        return {
          icon: '🐾',
          name: isTh ? 'คำรามล่อเป้า & 9 ชีวิต (Taunt & 9 Lives)' : 'Aggro Taunt & 9 Lives',
          desc: isTh ? 'ดึงดูดมอนสเตอร์เข้าหาตัว พร้อมคืนชีพพลังชีวิต 9 ครั้ง' : 'Taunts monsters toward cat & survives with 9 lives'
        };
      case PlayerClass.COWBOY:
        return {
          icon: '🤠',
          name: isTh ? 'บ่วงบาศคาวบอย (Ensnaring Lasso)' : 'Ensnaring Lasso',
          desc: isTh ? 'ปาบ่วงบาศรัดและดึงศัตรูเข้ามารวมกันทุก 4.5s' : 'Throws lasso pulling & ensnaring enemies every 4.5s'
        };
      case PlayerClass.CELESTIAL_MECHA:
        return {
          icon: '🚀',
          name: isTh ? 'ปีกเลเซอร์พิฆาต (Wing Laser Salvo)' : 'Wing Laser Salvo',
          desc: isTh ? 'ล็อกเป้าและยิงลำแสงพลาสมาความเร็วสูงทุก 4.0s' : 'Locks on & fires plasma laser salvos every 4.0s'
        };
      case PlayerClass.GAMBLER:
        return {
          icon: '🎲',
          name: isTh ? 'ลูกเต๋าเสี่ยงโชค (Lucky Dice)' : 'Lucky Dice',
          desc: isTh ? 'โยนลูกเต๋าเสี่ยงดวงระเบิดวงกว้าง + แจ็กพอตเหรียญวิญญาณ' : 'Tosses lucky dice explosive + chance for jackpot Soul Coins'
        };
      default:
        return { icon: '✨', name: isTh ? 'สกิลติดตัว' : 'Innate Skill', desc: '' };
    }
  }
}
