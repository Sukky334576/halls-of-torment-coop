import { GameStateTick, PlayerNetworkData, PlayerClass, ShrineType } from '../../shared/types';
import { CLASS_DEFINITIONS, TRAIT_POOL } from '../../shared/classes';
import { I18n } from '../engine/I18n';
import { SoundManager } from '../engine/SoundManager';
import { GraphicsSettings, GraphicsQuality } from '../engine/GraphicsSettings';

export class EscMenuUI {
  private container: HTMLElement;
  private root: HTMLElement;
  private sound: SoundManager | null = null;
  public isOpen: boolean = false;
  private currentTab: 'stats' | 'traits' | 'crusade' = 'stats';
  private isSolo: boolean = true;

  public onResume: (() => void) | null = null;
  public onSurrender: (() => void) | null = null;
  public onPauseToggle: ((isPaused: boolean) => void) | null = null;

  constructor(container: HTMLElement, sound?: SoundManager) {
    this.container = container;
    this.sound = sound || null;

    this.root = document.createElement('div');
    this.root.id = 'esc-menu-modal';
    this.root.className = 'esc-menu-backdrop';
    this.root.style.display = 'none';

    this.render();
    this.container.appendChild(this.root);
    this.setupListeners();

    I18n.onLanguageChanged(() => {
      if (this.isOpen) {
        this.updateStaticLabels();
      }
    });
  }

  private render(): void {
    const isTh = I18n.getLanguage() === 'th';

    this.root.innerHTML = `
      <div class="esc-menu-card">
        <!-- Header -->
        <div class="esc-header">
          <div class="esc-title-group">
            <span class="esc-icon">⏸️</span>
            <h2 id="esc-main-title" class="esc-title">${I18n.t('esc.title')}</h2>
            <span id="esc-mode-badge" class="esc-mode-badge solo">${I18n.t('esc.solo_paused')}</span>
          </div>
          <button id="btn-esc-close" class="btn-esc-close" title="Close / Resume">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="esc-nav-tabs">
          <button id="esc-tab-stats" class="esc-tab-btn active" data-tab="stats">${I18n.t('esc.tab_stats')}</button>
          <button id="esc-tab-traits" class="esc-tab-btn" data-tab="traits">${I18n.t('esc.tab_traits')}</button>
          <button id="esc-tab-crusade" class="esc-tab-btn" data-tab="crusade">${I18n.t('esc.tab_crusade')}</button>
        </div>

        <!-- Body Panels -->
        <div class="esc-body">
          <!-- 1. Stats Panel -->
          <div id="esc-panel-stats" class="esc-panel active">
            <div class="esc-hero-summary">
              <div id="esc-hero-icon" class="esc-hero-avatar">⚔️</div>
              <div class="esc-hero-meta">
                <div class="esc-hero-name-row">
                  <span id="esc-hero-name" class="hero-name">Survivor</span>
                  <span id="esc-hero-class" class="hero-class-tag">นักรบดาบเหล็ก</span>
                  <span id="esc-hero-level" class="hero-level-tag">Lv. 1</span>
                </div>
                <div id="esc-hero-title" class="hero-spec-desc">กำแพงเหล็กกล้า</div>
              </div>
            </div>

            <div class="esc-stat-grid">
              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">❤️</span>
                  <span class="stat-lbl" data-i18n="esc.stat_hp">${I18n.t('esc.stat_hp')}</span>
                </div>
                <div id="esc-val-hp" class="stat-val">200 / 200</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">🛡️</span>
                  <span class="stat-lbl" data-i18n="esc.stat_def">${I18n.t('esc.stat_def')}</span>
                </div>
                <div id="esc-val-def" class="stat-val">0</div>
                <div id="esc-sub-def" class="stat-sub">ลดดาเมจ: 0%</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">⚔️</span>
                  <span class="stat-lbl" data-i18n="esc.stat_dmg">${I18n.t('esc.stat_dmg')}</span>
                </div>
                <div id="esc-val-dmg" class="stat-val">+0%</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-lbl" data-i18n="esc.stat_atk_spd">${I18n.t('esc.stat_atk_spd')}</span>
                </div>
                <div id="esc-val-atkspd" class="stat-val">1.00x</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">🎯</span>
                  <span class="stat-lbl" data-i18n="esc.stat_crit_rate">${I18n.t('esc.stat_crit_rate')}</span>
                </div>
                <div id="esc-val-critrate" class="stat-val">5%</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">💥</span>
                  <span class="stat-lbl" data-i18n="esc.stat_crit_dmg">${I18n.t('esc.stat_crit_dmg')}</span>
                </div>
                <div id="esc-val-critdmg" class="stat-val">200%</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">👟</span>
                  <span class="stat-lbl" data-i18n="esc.stat_move_spd">${I18n.t('esc.stat_move_spd')}</span>
                </div>
                <div id="esc-val-movespd" class="stat-val">190 px/s</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">🧲</span>
                  <span class="stat-lbl" data-i18n="esc.stat_pickup">${I18n.t('esc.stat_pickup')}</span>
                </div>
                <div id="esc-val-pickup" class="stat-val">120 px</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">🌀</span>
                  <span class="stat-lbl" data-i18n="esc.stat_area">${I18n.t('esc.stat_area')}</span>
                </div>
                <div id="esc-val-area" class="stat-val">100%</div>
              </div>

              <div class="esc-stat-item">
                <div class="stat-top">
                  <span class="stat-icon">🌟</span>
                  <span class="stat-lbl">${isTh ? 'ตัวคูณ EXP' : 'EXP Multiplier'}</span>
                </div>
                <div id="esc-val-exp-mult" class="stat-val">+0%</div>
              </div>
            </div>
          </div>

          <!-- 2. Traits Panel -->
          <div id="esc-panel-traits" class="esc-panel">
            <div class="esc-shrine-status-box">
              <span class="shrine-box-title" data-i18n="esc.shrine_active">${I18n.t('esc.shrine_active')}</span>
              <div id="esc-shrine-content" class="shrine-box-content">
                <span id="esc-shrine-text">${I18n.t('esc.shrine_none')}</span>
              </div>
            </div>

            <div class="esc-traits-header-bar">
              <span id="esc-traits-count" class="traits-count-badge">พรที่ได้รับ: 0</span>
            </div>
            <div id="esc-traits-grid" class="esc-traits-grid">
              <div class="esc-no-traits-msg">${I18n.t('esc.no_traits')}</div>
            </div>
          </div>

          <!-- 3. Crusade & Party Panel -->
          <div id="esc-panel-crusade" class="esc-panel">
            <div class="esc-crusade-meta-grid">
              <div class="meta-card">
                <span class="meta-lbl" data-i18n="esc.stage_title">${I18n.t('esc.stage_title')}</span>
                <span id="esc-crusade-stage" class="meta-val highlight">สุสานโบราณใต้พิภพ</span>
              </div>
              <div class="meta-card">
                <span class="meta-lbl">ระลอกปัจจุบัน (Wave):</span>
                <span id="esc-crusade-wave" class="meta-val">เวฟ 1/30</span>
              </div>
              <div class="meta-card">
                <span class="meta-lbl" data-i18n="esc.time_survived">${I18n.t('esc.time_survived')}</span>
                <span id="esc-crusade-time" class="meta-val">00:00</span>
              </div>
              <div class="meta-card">
                <span class="meta-lbl" data-i18n="esc.kills">${I18n.t('esc.kills')}</span>
                <span id="esc-crusade-kills" class="meta-val">0</span>
              </div>
              <div class="meta-card">
                <span class="meta-lbl" data-i18n="esc.gold">${I18n.t('esc.gold')}</span>
                <span id="esc-crusade-gold" class="meta-val gold">0</span>
              </div>
            </div>

            <div class="esc-party-section">
              <div class="party-section-title" data-i18n="esc.party_title">${I18n.t('esc.party_title')}</div>
              <div id="esc-party-list" class="esc-party-list"></div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="esc-footer">
          <div class="esc-footer-left">
            <button id="btn-esc-lang" class="btn-esc-aux">
              ${isTh ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
            </button>
            <button id="btn-esc-graphics" class="btn-esc-aux">
              ${this.graphicsLabel()}
            </button>
            <div class="esc-volume-wrap">
              <button id="btn-esc-vol-mute" class="btn-esc-vol">🔊</button>
              <input type="range" id="esc-vol-slider" class="esc-slider" min="0" max="100" value="30" />
            </div>
          </div>

          <div class="esc-footer-right">
            <button id="btn-esc-surrender" class="btn-esc-danger" data-i18n="esc.btn_surrender">
              ${I18n.t('esc.btn_surrender')}
            </button>
            <button id="btn-esc-resume" class="btn-esc-primary" data-i18n="esc.btn_resume">
              ${I18n.t('esc.btn_resume')}
            </button>
          </div>
        </div>
      </div>

      <!-- Surrender Confirmation Sub-Modal -->
      <div id="esc-confirm-modal" class="esc-confirm-backdrop" style="display: none;">
        <div class="esc-confirm-card">
          <div class="confirm-icon">⚠️</div>
          <h3 id="esc-confirm-title" class="confirm-title">${I18n.t('esc.confirm_surrender_title')}</h3>
          <p id="esc-confirm-msg" class="confirm-msg">${I18n.t('esc.confirm_surrender_msg')}</p>
          <div class="confirm-actions">
            <button id="btn-confirm-cancel" class="btn-esc-aux">${I18n.t('esc.btn_cancel_surrender')}</button>
            <button id="btn-confirm-ok" class="btn-esc-danger">${I18n.t('esc.btn_confirm_surrender')}</button>
          </div>
        </div>
      </div>
    `;
  }

  private setupListeners(): void {
    // Tab switching
    const tabs = ['stats', 'traits', 'crusade'] as const;
    tabs.forEach((tab) => {
      const btn = document.getElementById(`esc-tab-${tab}`);
      btn?.addEventListener('click', () => {
        this.currentTab = tab;
        tabs.forEach((t) => {
          document.getElementById(`esc-tab-${t}`)?.classList.toggle('active', t === tab);
          document.getElementById(`esc-panel-${t}`)?.classList.toggle('active', t === tab);
        });
      });
    });

    // Close / Resume
    document.getElementById('btn-esc-close')?.addEventListener('click', () => this.hide());
    document.getElementById('btn-esc-resume')?.addEventListener('click', () => this.hide());

    // Surrender Flow
    const confirmModal = document.getElementById('esc-confirm-modal');
    document.getElementById('btn-esc-surrender')?.addEventListener('click', () => {
      if (confirmModal) confirmModal.style.display = 'flex';
    });

    document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => {
      if (confirmModal) confirmModal.style.display = 'none';
    });

    document.getElementById('btn-confirm-ok')?.addEventListener('click', () => {
      if (confirmModal) confirmModal.style.display = 'none';
      this.hide();
      this.onSurrender?.();
    });

    // Language Toggle
    document.getElementById('btn-esc-lang')?.addEventListener('click', () => {
      I18n.toggleLanguage();
    });

    // Graphics Quality Cycle (Low -> Medium -> High -> Low)
    document.getElementById('btn-esc-graphics')?.addEventListener('click', () => {
      GraphicsSettings.cycleQuality();
      const graphicsBtn = document.getElementById('btn-esc-graphics');
      if (graphicsBtn) graphicsBtn.textContent = this.graphicsLabel();
    });

    // Sound Controls
    if (this.sound) {
      const slider = document.getElementById('esc-vol-slider') as HTMLInputElement;
      const muteBtn = document.getElementById('btn-esc-vol-mute');

      if (slider) slider.value = Math.round(this.sound.getVolume() * 100).toString();
      if (muteBtn) muteBtn.textContent = this.sound.getIsMuted() ? '🔇' : '🔊';

      slider?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        this.sound?.setVolume(val / 100);
        if (muteBtn) muteBtn.textContent = val === 0 ? '🔇' : '🔊';
      });

      muteBtn?.addEventListener('click', () => {
        if (!this.sound) return;
        const muted = this.sound.toggleMute();
        if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
      });
    }
  }

  public show(isSolo: boolean = true): void {
    this.isOpen = true;
    this.isSolo = isSolo;
    this.root.style.display = 'flex';

    const confirmModal = document.getElementById('esc-confirm-modal');
    if (confirmModal) confirmModal.style.display = 'none';

    this.updateStaticLabels();

    if (this.isSolo) {
      this.onPauseToggle?.(true);
    }
  }

  public hide(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.style.display = 'none';

    const confirmModal = document.getElementById('esc-confirm-modal');
    if (confirmModal) confirmModal.style.display = 'none';

    if (this.isSolo) {
      this.onPauseToggle?.(false);
    }
    this.onResume?.();
  }

  public toggle(isSolo: boolean = true): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show(isSolo);
    }
  }

  public update(tick: GameStateTick, myId: string): void {
    if (!this.isOpen) return;

    this.isSolo = tick.players.length <= 1;

    // Mode badge
    const modeBadge = document.getElementById('esc-mode-badge');
    if (modeBadge) {
      if (this.isSolo) {
        modeBadge.className = 'esc-mode-badge solo';
        modeBadge.textContent = I18n.t('esc.solo_paused');
      } else {
        modeBadge.className = 'esc-mode-badge coop';
        modeBadge.textContent = I18n.t('esc.coop_running');
      }
    }

    const me = tick.players.find((p) => p.id === myId);
    if (!me) return;

    const classDef = CLASS_DEFINITIONS[me.playerClass] || CLASS_DEFINITIONS[PlayerClass.SWORDSMAN];
    const isTh = I18n.getLanguage() === 'th';

    // 1. Hero Identity
    const heroName = document.getElementById('esc-hero-name');
    if (heroName) heroName.textContent = me.name || 'Survivor';

    const heroClass = document.getElementById('esc-hero-class');
    if (heroClass) {
      heroClass.textContent = isTh ? classDef.thaiName || classDef.name : classDef.name;
    }

    const heroLevel = document.getElementById('esc-hero-level');
    if (heroLevel) heroLevel.textContent = `Lv. ${me.level}`;

    const heroTitle = document.getElementById('esc-hero-title');
    if (heroTitle) {
      heroTitle.textContent = isTh ? classDef.thaiTitle || classDef.title : classDef.title;
    }

    const heroIcon = document.getElementById('esc-hero-icon');
    if (heroIcon) {
      if (me.playerClass === PlayerClass.SWORDSMAN) heroIcon.textContent = '⚔️';
      else if (me.playerClass === PlayerClass.ARCHER) heroIcon.textContent = '🏹';
      else if (me.playerClass === PlayerClass.SORCERESS) heroIcon.textContent = '⚡';
      else if (me.playerClass === PlayerClass.CLERIC) heroIcon.textContent = '🔨';
    }

    // 2. Real-time Battle Stats
    const stats = me.stats;
    if (stats) {
      const hpEl = document.getElementById('esc-val-hp');
      if (hpEl) hpEl.textContent = `${Math.round(me.hp)} / ${Math.round(stats.maxHp)}`;

      const defEl = document.getElementById('esc-val-def');
      if (defEl) defEl.textContent = `${Math.round(stats.defense)}`;

      const defSub = document.getElementById('esc-sub-def');
      if (defSub) {
        const dmgReduction = Math.round((stats.defense / (stats.defense + 100)) * 100);
        defSub.textContent = `${I18n.t('esc.stat_def_desc')}: ${dmgReduction}%`;
      }

      const dmgEl = document.getElementById('esc-val-dmg');
      if (dmgEl) {
        const bonusPct = Math.round((stats.damageBonus - 1) * 100);
        dmgEl.textContent = `${bonusPct >= 0 ? '+' : ''}${bonusPct}%`;
      }

      const atkSpdEl = document.getElementById('esc-val-atkspd');
      if (atkSpdEl) atkSpdEl.textContent = `${stats.attackSpeed.toFixed(2)}x`;

      const critRateEl = document.getElementById('esc-val-critrate');
      if (critRateEl) critRateEl.textContent = `${Math.round(stats.critChance * 100)}%`;

      const critDmgEl = document.getElementById('esc-val-critdmg');
      if (critDmgEl) critDmgEl.textContent = `${Math.round(stats.critBonus * 100)}%`;

      const moveSpdEl = document.getElementById('esc-val-movespd');
      if (moveSpdEl) moveSpdEl.textContent = `${Math.round(stats.moveSpeed)} px/s`;

      const pickupEl = document.getElementById('esc-val-pickup');
      if (pickupEl) pickupEl.textContent = `${Math.round(stats.pickupRadius)} px`;

      const areaEl = document.getElementById('esc-val-area');
      if (areaEl) areaEl.textContent = `${Math.round((stats.areaMultiplier || 1.0) * 100)}%`;

      const expMultEl = document.getElementById('esc-val-exp-mult');
      if (expMultEl) {
        const mult = stats.expMultiplier || 1.0;
        const pct = Math.round((mult - 1.0) * 100);
        expMultEl.textContent = `+${pct}% (${mult.toFixed(2)}x)`;
      }
    }

    // 3. Shrine Status
    const shrineContent = document.getElementById('esc-shrine-content');
    if (shrineContent) {
      if (me.activeBuff) {
        const buffName = this.getShrineName(me.activeBuff.type, isTh);
        shrineContent.innerHTML = `
          <div class="shrine-active-badge">
            <span class="shrine-icon">${this.getShrineIcon(me.activeBuff.type)}</span>
            <span class="shrine-name">${buffName}</span>
            <span class="shrine-time">(${me.activeBuff.durationRemaining.toFixed(1)}s)</span>
          </div>
        `;
      } else {
        shrineContent.innerHTML = `<span class="shrine-none-text">${I18n.t('esc.shrine_none')}</span>`;
      }
    }

    // 4. Acquired Traits List
    const traitsCountBadge = document.getElementById('esc-traits-count');
    const traitsGrid = document.getElementById('esc-traits-grid');
    const traits = me.acquiredTraits || [];

    if (traitsCountBadge) {
      traitsCountBadge.textContent = isTh ? `พรที่ได้รับ: ${traits.length}` : `Traits Acquired: ${traits.length}`;
    }

    if (traitsGrid) {
      if (traits.length === 0) {
        traitsGrid.innerHTML = `<div class="esc-no-traits-msg">${I18n.t('esc.no_traits')}</div>`;
      } else {
        traitsGrid.innerHTML = traits
          .map((traitId) => {
            const def = TRAIT_POOL.find((t) => t.id === traitId);
            if (!def) return '';
            const tName = isTh ? def.thaiName || def.name : def.name;
            const tDesc = isTh ? def.thaiDesc || def.description : def.description;
            return `
              <div class="esc-trait-pill ${def.rarity}">
                <span class="trait-icon">${def.icon}</span>
                <div class="trait-text">
                  <div class="trait-title">${tName}</div>
                  <div class="trait-desc">${tDesc}</div>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    // 5. Crusade & Party Meta
    const stageEl = document.getElementById('esc-crusade-stage');
    if (stageEl) {
      stageEl.textContent = this.getStageName(tick.stageId || 1, isTh);
    }

    const waveEl = document.getElementById('esc-crusade-wave');
    if (waveEl) {
      const bossSuffix = tick.isBossWave ? (isTh ? ' [เผชิญหน้าบอส!]' : ' [BOSS!]') : '';
      waveEl.textContent = isTh
        ? `เวฟ ${tick.currentWave}/${tick.maxWaves}${bossSuffix}`
        : `Wave ${tick.currentWave}/${tick.maxWaves}${bossSuffix}`;
    }

    const timeEl = document.getElementById('esc-crusade-time');
    if (timeEl) {
      const totalSec = Math.max(0, Math.round(tick.elapsedTime));
      const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const ss = (totalSec % 60).toString().padStart(2, '0');
      timeEl.textContent = `${mm}:${ss}`;
    }

    const killsEl = document.getElementById('esc-crusade-kills');
    if (killsEl) killsEl.textContent = tick.totalKills.toString();

    const goldEl = document.getElementById('esc-crusade-gold');
    if (goldEl) {
      const me = tick.players.find((p) => p.id === myId);
      goldEl.textContent = (me?.gold ?? 0).toString();
    }

    // 6. Party Members Table
    const partyList = document.getElementById('esc-party-list');
    if (partyList) {
      partyList.innerHTML = tick.players
        .map((p) => {
          const pClass = CLASS_DEFINITIONS[p.playerClass] || CLASS_DEFINITIONS[PlayerClass.SWORDSMAN];
          const className = isTh ? pClass.thaiName || pClass.name : pClass.name;
          const hpPct = Math.max(0, Math.min(100, Math.round((p.hp / (p.stats?.maxHp || p.maxHp || 100)) * 100)));
          const isYou = p.id === myId;
          const statusText = p.isDead ? (isTh ? '💀 ล้มลง' : '💀 Downed') : `${Math.round(p.hp)} HP`;

          return `
            <div class="esc-party-row ${p.isDead ? 'dead' : ''}">
              <div class="party-col-user">
                <span class="user-avatar">${this.getClassAvatar(p.playerClass)}</span>
                <span class="user-name">${p.name || 'Crusader'} ${isYou ? (isTh ? '(คุณ)' : '(You)') : ''}</span>
              </div>
              <div class="party-col-class">${className} (Lv.${p.level})</div>
              <div class="party-col-hp">
                <div class="party-hp-mini-bar">
                  <div class="mini-hp-fill" style="width: ${hpPct}%;"></div>
                </div>
                <span class="mini-hp-text">${statusText}</span>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  private graphicsLabel(): string {
    const quality: GraphicsQuality = GraphicsSettings.getQuality();
    const key = quality === 'low' ? 'esc.graphics_low' : quality === 'high' ? 'esc.graphics_high' : 'esc.graphics_medium';
    return `${I18n.t('esc.graphics_prefix')} ${I18n.t(key)}`;
  }

  public updateStaticLabels(): void {
    const isTh = I18n.getLanguage() === 'th';

    const titleEl = document.getElementById('esc-main-title');
    if (titleEl) titleEl.textContent = I18n.t('esc.title');

    const tabStats = document.getElementById('esc-tab-stats');
    if (tabStats) tabStats.textContent = I18n.t('esc.tab_stats');

    const tabTraits = document.getElementById('esc-tab-traits');
    if (tabTraits) tabTraits.textContent = I18n.t('esc.tab_traits');

    const tabCrusade = document.getElementById('esc-tab-crusade');
    if (tabCrusade) tabCrusade.textContent = I18n.t('esc.tab_crusade');

    const langBtn = document.getElementById('btn-esc-lang');
    if (langBtn) langBtn.textContent = isTh ? '🇹🇭 ภาษาไทย' : '🇬🇧 English';

    const graphicsBtn = document.getElementById('btn-esc-graphics');
    if (graphicsBtn) graphicsBtn.textContent = this.graphicsLabel();

    const resumeBtn = document.getElementById('btn-esc-resume');
    if (resumeBtn) resumeBtn.textContent = I18n.t('esc.btn_resume');

    const surrenderBtn = document.getElementById('btn-esc-surrender');
    if (surrenderBtn) surrenderBtn.textContent = I18n.t('esc.btn_surrender');

    const confirmTitle = document.getElementById('esc-confirm-title');
    if (confirmTitle) confirmTitle.textContent = I18n.t('esc.confirm_surrender_title');

    const confirmMsg = document.getElementById('esc-confirm-msg');
    if (confirmMsg) confirmMsg.textContent = I18n.t('esc.confirm_surrender_msg');

    const confirmOk = document.getElementById('btn-confirm-ok');
    if (confirmOk) confirmOk.textContent = I18n.t('esc.btn_confirm_surrender');

    const confirmCancel = document.getElementById('btn-confirm-cancel');
    if (confirmCancel) confirmCancel.textContent = I18n.t('esc.btn_cancel_surrender');

    // Update all elements with data-i18n
    this.root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = I18n.t(key);
    });
  }

  private getClassAvatar(pClass: PlayerClass): string {
    switch (pClass) {
      case PlayerClass.SWORDSMAN: return '⚔️';
      case PlayerClass.ARCHER: return '🏹';
      case PlayerClass.SORCERESS: return '⚡';
      case PlayerClass.CLERIC: return '🔨';
      default: return '🛡️';
    }
  }

  private getShrineIcon(type: ShrineType): string {
    switch (type) {
      case ShrineType.SPEED: return '⚡';
      case ShrineType.FRENZY: return '⚔️';
      case ShrineType.AEGIS: return '🛡️';
      case ShrineType.GOLD_RUSH: return '💰';
      case ShrineType.ALTAR_BLOOD: return '🩸';
      case ShrineType.ALTAR_TEMPEST: return '⚡';
      case ShrineType.ALTAR_VOID: return '🌌';
      default: return '✨';
    }
  }

  private getShrineName(type: ShrineType, isTh: boolean): string {
    switch (type) {
      case ShrineType.SPEED: return isTh ? 'แท่นบูชาความเร็ว (+25% เดินไว)' : 'Shrine of Speed (+25% Move Speed)';
      case ShrineType.FRENZY: return isTh ? 'แท่นบูชาคลุ้มคลั่ง (+30% โจมตีไว)' : 'Shrine of Frenzy (+30% Attack Speed)';
      case ShrineType.AEGIS: return isTh ? 'แท่นบูชาพิทักษ์ (เกราะ & ฟื้นฟูเลือด)' : 'Shrine of Aegis (Armor & Regen)';
      case ShrineType.GOLD_RUSH: return isTh ? 'แท่นบูชาขุมทอง (เหรียญทอง x2)' : 'Shrine of Gold Rush (Gold x2)';
      case ShrineType.ALTAR_BLOOD: return isTh ? 'แท่นบูชาโลหิต (+35% พลังโจมตีถาวร)' : 'Altar of Blood (+35% Perm Damage)';
      case ShrineType.ALTAR_TEMPEST: return isTh ? 'แท่นบูชาวายุคลั่ง (ออร่าสายฟ้า & +40% วิ่งไว)' : 'Altar of Tempest (Storm Aura & +40% Speed)';
      case ShrineType.ALTAR_VOID: return isTh ? 'แท่นบูชาความว่างเปล่า (บอสพิทักษ์มิติ)' : 'Altar of the Void (Void Guardian)';
      default: return type;
    }
  }

  private getStageName(stageId: number, isTh: boolean): string {
    switch (stageId) {
      case 1: return isTh ? 'สุสานโบราณใต้พิภพ (The Haunted Catacombs)' : 'The Haunted Catacombs (Stage 1)';
      case 2: return isTh ? 'ถ้ำเพลิงอเวจี (The Infernal Caverns)' : 'The Infernal Caverns (Stage 2)';
      case 3: return isTh ? 'หุบเหวทมิฬออบซิเดียน (The Obsidian Abyss)' : 'The Obsidian Abyss (Stage 3)';
      default: return `Stage ${stageId}`;
    }
  }
}
