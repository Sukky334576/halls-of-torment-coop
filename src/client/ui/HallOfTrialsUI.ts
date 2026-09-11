import { TRIAL_QUESTS, TrialQuest } from '../../shared/trialQuests';
import { MetaProgression } from '../engine/MetaProgression';
import { SoundManager } from '../engine/SoundManager';
import { I18n } from '../engine/I18n';

export class HallOfTrialsUI {
  private container: HTMLElement;
  private root: HTMLElement;
  private sound: SoundManager | null = null;
  public onRewardClaimed?: () => void;

  constructor(container: HTMLElement, sound?: SoundManager) {
    this.container = container;
    this.sound = sound || null;

    this.root = document.createElement('div');
    this.root.id = 'hall-of-trials-modal';
    this.root.className = 'meta-modal-backdrop';
    this.root.style.display = 'none';
    this.container.appendChild(this.root);

    this.render();
  }

  public show(): void {
    this.render();
    this.root.style.display = 'flex';
    this.sound?.playClick();
  }

  public hide(): void {
    this.root.style.display = 'none';
    this.sound?.playClick();
    this.onRewardClaimed?.();
  }

  public toggle(): void {
    if (this.root.style.display === 'flex') {
      this.hide();
    } else {
      this.show();
    }
  }

  private render(): void {
    const isTh = I18n.getLanguage() === 'th';
    const trialStats = MetaProgression.getTrialStats();
    const claimableCount = MetaProgression.getClaimableTrialsCount();

    this.root.innerHTML = `
      <div class="meta-modal-panel trials-modal-panel">
        <!-- Header -->
        <div class="meta-modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">📜</span>
            <div>
              <h2 class="modal-title">${isTh ? 'โถงแห่งบททดสอบ (HALL OF TRIALS)' : 'THE HALL OF TRIALS'}</h2>
              <span class="modal-subtitle">${isTh ? 'บรรลุพันธสัญญาศักดิ์สิทธิ์เพื่อรับเหรียญวิญญาณ, ศาสตราโบราณ, และน้ำยาวิเศษถาวร' : 'Conquer sacred ordeals to earn Soul Coins, ancient artifacts, and permanent potion capacity'}</span>
            </div>
          </div>
          <button id="btn-close-trials" class="btn-modal-close" title="Close">✕</button>
        </div>

        <!-- Quick Summary Stats Bar -->
        <div class="trials-summary-bar">
          <div class="summary-stat-chip">
            <span class="chip-icon">💀</span>
            <span class="chip-label">${isTh ? 'สังหารรวม:' : 'Total Kills:'}</span>
            <span class="chip-val">${trialStats.totalKills.toLocaleString()}</span>
          </div>
          <div class="summary-stat-chip">
            <span class="chip-icon">⏳</span>
            <span class="chip-label">${isTh ? 'รอดนานสุด:' : 'Max Survival:'}</span>
            <span class="chip-val">${Math.floor(trialStats.maxSurvivalSeconds / 60)}m ${trialStats.maxSurvivalSeconds % 60}s</span>
          </div>
          <div class="summary-stat-chip">
            <span class="chip-icon">⚡</span>
            <span class="chip-label">${isTh ? 'จุติอาวุธ:' : 'Evolutions:'}</span>
            <span class="chip-val">${trialStats.evolutionsCrafted}</span>
          </div>
          <div class="summary-stat-chip">
            <span class="chip-icon">💥</span>
            <span class="chip-label">${isTh ? 'คอมโบธาตุ:' : 'Combos:'}</span>
            <span class="chip-val">${trialStats.elementalReactionsTriggered}</span>
          </div>
          ${claimableCount > 0 ? `
            <div class="summary-claimable-chip">
              <span>🎁 ${isTh ? `รับรางวัลได้ ${claimableCount} รายการ!` : `${claimableCount} Rewards Ready!`}</span>
            </div>
          ` : ''}
        </div>

        <!-- Quest Cards List -->
        <div class="trials-cards-container">
          ${TRIAL_QUESTS.map((quest) => {
            const current = MetaProgression.getTrialCurrentProgress(quest);
            const target = quest.target;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = current >= target;
            const isClaimed = MetaProgression.isTrialClaimed(quest.id);

            let statusHtml = '';
            if (isClaimed) {
              statusHtml = `
                <button class="btn-trial-status claimed" disabled>
                  ✓ ${isTh ? 'รับแล้ว' : 'CLAIMED'}
                </button>
              `;
            } else if (isCompleted) {
              statusHtml = `
                <button class="btn-trial-status ready btn-claim-trial" data-trial-id="${quest.id}">
                  🏆 ${isTh ? 'รับรางวัล' : 'CLAIM'}
                </button>
              `;
            } else {
              statusHtml = `
                <button class="btn-trial-status in-progress" disabled>
                  🔒 ${pct}%
                </button>
              `;
            }

            return `
              <div class="trial-quest-card ${isClaimed ? 'is-claimed' : isCompleted ? 'is-ready' : 'is-pending'}">
                <div class="trial-icon-box">${quest.icon}</div>
                <div class="trial-info-box">
                  <div class="trial-header-line">
                    <h4 class="trial-title">${isTh ? quest.thaiTitle : quest.title}</h4>
                    <span class="trial-reward-tag">${isTh ? quest.thaiRewardLabel : quest.rewardLabel}</span>
                  </div>
                  <p class="trial-desc">${isTh ? quest.thaiDesc : quest.desc}</p>
                  
                  <!-- Progress Bar -->
                  <div class="trial-progress-wrapper">
                    <div class="trial-progress-bar">
                      <div class="trial-progress-fill" style="width: ${pct}%"></div>
                    </div>
                    <span class="trial-progress-numbers">${current} / ${target}</span>
                  </div>
                </div>

                <div class="trial-action-box">
                  ${statusHtml}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Close button
    const closeBtn = this.root.querySelector('#btn-close-trials');
    closeBtn?.addEventListener('click', () => this.hide());

    // Claim trial reward buttons
    this.root.querySelectorAll('.btn-claim-trial').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const trialId = target.getAttribute('data-trial-id');
        if (trialId) {
          const res = MetaProgression.claimTrial(trialId);
          if (res.success) {
            this.sound?.playLevelUp();
            this.render();
            this.onRewardClaimed?.();
          }
        }
      });
    });
  }
}
