import { I18n } from '../engine/I18n';

export interface TraitChoiceView {
  id: string;
  name: string;
  desc: string;
  rarity: string;
  tier: string;
  icon: string;
  thaiName?: string;
  thaiDesc?: string;
  isEvolution?: boolean;
  evolutionTitle?: string;
  isSignature?: boolean;
}

export interface PotionState {
  rerolls: number;
  banishes: number;
  locks: number;
  lockedTraitId?: string | null;
}

export class TraitSelector {
  private container: HTMLElement;
  private onSelect: (id: string) => void;
  private onUsePotion?: (action: 'REROLL' | 'BANISH' | 'LOCK', traitId?: string) => void;
  public isShowing: boolean = false;

  private currentChoices: TraitChoiceView[] = [];
  private currentPotions: PotionState = { rerolls: 0, banishes: 0, locks: 0, lockedTraitId: null };
  private activeMode: 'NONE' | 'BANISH' | 'LOCK' = 'NONE';
  // True from the moment a REROLL/BANISH/LOCK click fires until the server's response
  // (showChoices for REROLL/BANISH, updatePotions for LOCK) lands and refreshes currentPotions.
  // The button handlers below gate on this instead of only on currentPotions counts, because
  // currentPotions is stale for the whole network round-trip — a real double-click sends two
  // separate USE_POTION messages that the server (which has no way to tell them apart from two
  // deliberate clicks) will both honor, silently spending an extra potion. See
  // docs/GAME_WIKI.md §4.7 risk "potion action ซ้อนกันได้".
  private isPotionActionPending: boolean = false;

  constructor(
    container: HTMLElement,
    onSelect: (id: string) => void,
    onUsePotion?: (action: 'REROLL' | 'BANISH' | 'LOCK', traitId?: string) => void
  ) {
    this.container = container;
    this.onSelect = onSelect;
    this.onUsePotion = onUsePotion;
  }

  // Every server-initiated LEVEL_UP_CHOICE call that can arrive while isShowing is already
  // true is a Reroll/Banish refresh of THIS same still-open pick (a genuinely new, unrelated
  // level-up is queued server-side in GameRoom's pendingLevelUpChoices and only re-sent after
  // the client has already closed this modal) — so always replace what's on screen immediately
  // rather than queuing, or a reroll/banish response silently never gets shown.
  public showChoices(choices: TraitChoiceView[], potions?: PotionState): void {
    this.isShowing = true;
    this.currentChoices = choices;
    if (potions) {
      this.currentPotions = potions;
    }
    this.activeMode = 'NONE';
    this.isPotionActionPending = false; // the REROLL/BANISH this response answers (if any) is done

    document.body.classList.add('trait-modal-open');
    this.render();
  }

  /** Force-closes an open trait pick — needed for GAME_OVER/SURRENDER while a level-up choice
   * happens to be on screen. Without this, the modal's own inline `display: flex` (set in
   * render()) just stays put — the match-end handler previously only cleared the
   * `trait-modal-open` body class, which doesn't touch the modal element itself — so the
   * defeat/victory screen underneath was rendered but never actually visible. */
  public hide(): void {
    const modal = this.container.querySelector('#trait-modal') as HTMLElement | null;
    if (modal) modal.style.display = 'none';
    this.isShowing = false;
    this.activeMode = 'NONE';
    this.isPotionActionPending = false; // whatever request was in flight, there's nothing left to answer it
    document.body.classList.remove('trait-modal-open');
  }

  public updatePotions(potions: PotionState): void {
    this.currentPotions = potions;
    this.isPotionActionPending = false; // answers the LOCK click (REROLL/BANISH clear via showChoices)
    if (this.isShowing) {
      this.render();
    }
  }

  private render(): void {
    let modal = this.container.querySelector('#trait-modal') as HTMLElement;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'trait-modal';
      modal.className = 'trait-modal-backdrop';
      this.container.appendChild(modal);
    }

    const isTh = I18n.getLanguage() === 'th';
    const choices = this.currentChoices;
    const potions = this.currentPotions;

    modal.style.display = 'flex';

    // Status banner if in Banish or Lock mode
    let modeNoticeHtml = '';
    if (this.activeMode === 'BANISH') {
      modeNoticeHtml = `<div class="potion-mode-banner banish-mode">${I18n.t('potion.banish_active')}</div>`;
    } else if (this.activeMode === 'LOCK') {
      modeNoticeHtml = `<div class="potion-mode-banner lock-mode">${I18n.t('potion.lock_active')}</div>`;
    }

    modal.innerHTML = `
      <div class="trait-modal-content">
        <div class="level-up-badge">${I18n.t('trait.levelup_badge')}</div>
        <div class="level-up-paused-banner">${I18n.t('trait.paused_banner')}</div>
        <h2 class="level-up-title">${I18n.t('trait.title')}</h2>
        <p class="level-up-subtitle">${I18n.t('trait.subtitle')}</p>
        ${modeNoticeHtml}

        <div class="trait-card-grid ${this.activeMode !== 'NONE' ? 'targeting-mode' : ''}">
          ${choices
            .map((c) => {
              const displayName = isTh && c.thaiName ? c.thaiName : c.name;
              const displayDesc = isTh && c.thaiDesc ? c.thaiDesc : c.desc;
              const isLocked = potions.lockedTraitId === c.id;
              const isEvo = c.isEvolution || c.rarity === 'mythic';
              const evoBadge = isEvo
                ? `<div class="trait-evolution-badge">${c.evolutionTitle || I18n.t('potion.evolution_badge')}</div>`
                : '';
              const signatureBadge = c.isSignature
                ? `<div class="trait-signature-badge">${I18n.t('trait.signature_badge')}</div>`
                : '';
              const lockedBadge = isLocked
                ? `<div class="card-locked-badge">${I18n.t('potion.locked_tag')}</div>`
                : '';

              let clickPrompt = I18n.t('trait.click_hint');
              if (this.activeMode === 'BANISH') {
                clickPrompt = isTh ? '🚫 คลิกเพื่อแบน' : '🚫 CLICK TO BANISH';
              } else if (this.activeMode === 'LOCK') {
                clickPrompt = isTh ? '🔒 คลิกเพื่อล็อก' : '🔒 CLICK TO LOCK';
              }

              return `
            <div class="trait-card rarity-${c.rarity} ${isEvo ? 'trait-card-evolution' : ''} ${isLocked ? 'trait-card-locked' : ''}" data-id="${c.id}">
              ${lockedBadge}
              ${evoBadge}
              ${signatureBadge}
              <div class="trait-icon">${c.icon}</div>
              <div class="trait-rarity-tag">${c.tier} · ${c.rarity.toUpperCase()}</div>
              <h3 class="trait-name">${displayName}</h3>
              <p class="trait-desc">${displayDesc}</p>
              <div class="trait-btn-hint">${clickPrompt}</div>
            </div>
          `;
            })
            .join('')}
        </div>

        <!-- Pillar 4: Alchemist Potion Control Bar -->
        <div class="potion-control-bar">
          <button class="potion-btn potion-reroll-btn" id="btn-potion-reroll" ${potions.rerolls <= 0 ? 'disabled' : ''}>
            ${I18n.t('potion.reroll').replace('{n}', potions.rerolls.toString())}
          </button>
          <button class="potion-btn potion-banish-btn ${this.activeMode === 'BANISH' ? 'active' : ''}" id="btn-potion-banish" ${potions.banishes <= 0 ? 'disabled' : ''}>
            ${I18n.t('potion.banish').replace('{n}', potions.banishes.toString())}
          </button>
          <button class="potion-btn potion-lock-btn ${this.activeMode === 'LOCK' ? 'active' : ''}" id="btn-potion-lock" ${potions.locks <= 0 && !potions.lockedTraitId ? 'disabled' : ''}>
            ${I18n.t('potion.lock').replace('{n}', potions.locks.toString())}
          </button>
        </div>
      </div>
    `;

    // Bind Potion Buttons
    const rerollBtn = modal.querySelector('#btn-potion-reroll');
    if (rerollBtn) {
      rerollBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isPotionActionPending) return; // ignore double-click while awaiting the server's reroll
        if (this.currentPotions.rerolls > 0 && this.onUsePotion) {
          this.isPotionActionPending = true;
          this.activeMode = 'NONE';
          this.onUsePotion('REROLL');
        }
      });
    }

    const banishBtn = modal.querySelector('#btn-potion-banish');
    if (banishBtn) {
      banishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentPotions.banishes > 0) {
          this.activeMode = this.activeMode === 'BANISH' ? 'NONE' : 'BANISH';
          this.render();
        }
      });
    }

    const lockBtn = modal.querySelector('#btn-potion-lock');
    if (lockBtn) {
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentPotions.locks > 0 || this.currentPotions.lockedTraitId) {
          this.activeMode = this.activeMode === 'LOCK' ? 'NONE' : 'LOCK';
          this.render();
        }
      });
    }

    // Bind Trait Cards Click
    modal.querySelectorAll('.trait-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (!id) return;

        if (this.activeMode === 'BANISH') {
          if (this.isPotionActionPending) return; // ignore double-click while awaiting the server's response
          if (this.onUsePotion) {
            this.isPotionActionPending = true;
            this.activeMode = 'NONE';
            this.onUsePotion('BANISH', id);
          }
          return;
        }

        if (this.activeMode === 'LOCK') {
          if (this.isPotionActionPending) return; // ignore double-click while awaiting the server's response
          if (this.onUsePotion) {
            this.isPotionActionPending = true;
            this.activeMode = 'NONE';
            this.onUsePotion('LOCK', id);
          }
          return;
        }

        // Standard selection
        modal.style.display = 'none';
        this.isShowing = false;
        document.body.classList.remove('trait-modal-open');
        this.onSelect(id);
      });
    });
  }
}
