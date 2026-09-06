import { GearSlot, GearItem, GEAR_CATALOG } from '../../shared/gearData';
import { MetaProgression } from '../engine/MetaProgression';
import { SoundManager } from '../engine/SoundManager';
import { I18n } from '../engine/I18n';

export class GearVaultUI {
  private container: HTMLElement;
  private root: HTMLElement;
  private sound: SoundManager | null = null;
  private selectedSlotFilter: GearSlot | 'ALL' = 'ALL';
  private selectedItemId: string | null = null;
  public onEquipChange?: () => void;

  constructor(container: HTMLElement, sound?: SoundManager) {
    this.container = container;
    this.sound = sound || null;

    this.root = document.createElement('div');
    this.root.id = 'gear-vault-modal';
    this.root.className = 'meta-modal-backdrop';
    this.root.style.display = 'none';
    this.container.appendChild(this.root);

    this.render();
  }

  public show(): void {
    this.selectedItemId = null;
    this.render();
    this.root.style.display = 'flex';
    this.sound?.playClick();
  }

  public hide(): void {
    this.root.style.display = 'none';
    this.sound?.playClick();
    this.onEquipChange?.();
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
    const equipped = MetaProgression.getEquippedGear();
    const inventory = MetaProgression.getVaultInventory();
    const statsTotal = MetaProgression.getEquippedStatsTotal();

    const filteredInventory = this.selectedSlotFilter === 'ALL'
      ? inventory
      : inventory.filter((item) => item.slot === this.selectedSlotFilter);

    // Selected item for details
    const activeItem = this.selectedItemId
      ? GEAR_CATALOG[this.selectedItemId]
      : (filteredInventory[0] || Object.values(equipped)[0] || null);

    const slotNames: Record<GearSlot, { en: string; th: string; icon: string }> = {
      HEAD: { en: 'Head', th: 'ศีรษะ', icon: '👑' },
      CHEST: { en: 'Chest', th: 'เสื้อเกราะ', icon: '🥋' },
      BOOTS: { en: 'Boots', th: 'รองเท้า', icon: '🥾' },
      GLOVES: { en: 'Gloves', th: 'ถุงมือ', icon: '🧤' },
      RING: { en: 'Ring', th: 'แหวน', icon: '💍' },
      AMULET: { en: 'Amulet', th: 'สร้อยคอ', icon: '📿' }
    };

    const slots: GearSlot[] = ['HEAD', 'CHEST', 'BOOTS', 'GLOVES', 'RING', 'AMULET'];

    this.root.innerHTML = `
      <div class="meta-modal-panel gear-vault-panel">
        <!-- Header -->
        <div class="meta-modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">🛡️</span>
            <div>
              <h2 class="modal-title">${isTh ? 'คลังอุปกรณ์ผู้พิทักษ์บ่อ (GEAR VAULT)' : 'THE WELLKEEPER VAULT'}</h2>
              <span class="modal-subtitle">${isTh ? 'สวมใส่อุปกรณ์ที่กู้คืนมาจากบ่อน้ำลึกเพื่อเสริมสเตตัสนักรบ' : 'Equip extracted artifacts secured from the deep well to empower your heroes'}</span>
            </div>
          </div>
          <button id="btn-close-vault" class="btn-modal-close" title="Close">✕</button>
        </div>

        <div class="vault-body-layout">
          <!-- LEFT: Character Paperdoll & Stats -->
          <div class="vault-paperdoll-section">
            <h3 class="section-badge-title">${isTh ? '👤 อุปกรณ์ที่สวมใส่' : '👤 EQUIPPED GEAR'}</h3>
            
            <div class="paperdoll-grid">
              ${slots.map((slot) => {
                const item = equipped[slot];
                const sInfo = slotNames[slot];
                const rarityClass = item ? `rarity-${item.rarity}` : 'slot-empty';
                return `
                  <div class="paperdoll-slot ${rarityClass}" data-slot="${slot}" data-item-id="${item ? item.id : ''}">
                    <span class="slot-type-icon">${sInfo.icon}</span>
                    <span class="slot-type-label">${isTh ? sInfo.th : sInfo.en}</span>
                    ${item ? `
                      <div class="slot-item-content">
                        <span class="item-visual-icon">${item.icon}</span>
                        <span class="item-mini-name">${isTh ? item.thaiName : item.name}</span>
                      </div>
                    ` : `
                      <div class="slot-empty-text">${isTh ? 'ว่าง' : 'Empty'}</div>
                    `}
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Equipped Stats Summary Box -->
            <div class="equipped-stats-box">
              <h4 class="stats-box-title">${isTh ? '⚡ โบนัสรวมจากอุปกรณ์' : '⚡ TOTAL GEAR BONUSES'}</h4>
              <div class="gear-stats-list">
                <div class="gear-stat-row">
                  <span class="stat-label">❤️ ${isTh ? 'พลังชีวิตสูงสุด (HP)' : 'Max HP'}:</span>
                  <span class="stat-val ${statsTotal.flatMaxHp > 0 ? 'pos' : ''}">+${statsTotal.flatMaxHp}</span>
                </div>
                <div class="gear-stat-row">
                  <span class="stat-label">🛡️ ${isTh ? 'เกราะป้องกัน (DEF)' : 'Defense'}:</span>
                  <span class="stat-val ${statsTotal.flatDefense > 0 ? 'pos' : ''}">+${statsTotal.flatDefense}</span>
                </div>
                <div class="gear-stat-row">
                  <span class="stat-label">⚔️ ${isTh ? 'โบนัสดาเมจ (DMG)' : 'Damage Bonus'}:</span>
                  <span class="stat-val ${statsTotal.flatDamageBonusPct > 0 ? 'pos' : ''}">+${statsTotal.flatDamageBonusPct}%</span>
                </div>
                <div class="gear-stat-row">
                  <span class="stat-label">👟 ${isTh ? 'ความเร็วเคลื่อนที่ (SPD)' : 'Move Speed'}:</span>
                  <span class="stat-val ${statsTotal.flatMoveSpeedPct > 0 ? 'pos' : ''}">+${statsTotal.flatMoveSpeedPct}%</span>
                </div>
                <div class="gear-stat-row">
                  <span class="stat-label">🎯 ${isTh ? 'โอกาสคริติคอล (CRIT)' : 'Crit Chance'}:</span>
                  <span class="stat-val ${statsTotal.flatCritChancePct > 0 ? 'pos' : ''}">+${statsTotal.flatCritChancePct}%</span>
                </div>
                <div class="gear-stat-row">
                  <span class="stat-label">⚡ ${isTh ? 'ความเร็วโจมตี (ATK SPD)' : 'Attack Speed'}:</span>
                  <span class="stat-val ${statsTotal.flatAttackSpeedPct > 0 ? 'pos' : ''}">+${statsTotal.flatAttackSpeedPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Inventory Grid & Item Inspector -->
          <div class="vault-inventory-section">
            <div class="vault-filter-bar">
              <button class="vault-filter-btn ${this.selectedSlotFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">${isTh ? 'ทั้งหมด' : 'All'}</button>
              ${slots.map(s => `
                <button class="vault-filter-btn ${this.selectedSlotFilter === s ? 'active' : ''}" data-filter="${s}">${slotNames[s].icon} ${isTh ? slotNames[s].th : slotNames[s].en}</button>
              `).join('')}
            </div>

            <!-- Item Inventory Grid -->
            <div class="vault-grid-container">
              ${filteredInventory.length === 0 ? `
                <div class="vault-empty-notice">
                  <span>🏺 ${isTh ? 'ยังไม่มีอุปกรณ์ในหมวดนี้' : 'No items found in this category'}</span>
                  <small>${isTh ? 'ออกรบและหย่อนไอเทมลงบ่อน้ำ Wellkeeper ในดันเจี้ยน!' : 'Extract items down the Wellkeeper Well during combat!'}</small>
                </div>
              ` : `
                <div class="vault-items-grid">
                  ${filteredInventory.map((item) => {
                    const isEquipped = equipped[item.slot]?.id === item.id;
                    const isSelected = activeItem?.id === item.id;
                    return `
                      <div class="vault-item-card rarity-${item.rarity} ${isEquipped ? 'item-is-equipped' : ''} ${isSelected ? 'selected' : ''}" data-item-id="${item.id}">
                        ${isEquipped ? `<span class="equipped-tag">E</span>` : ''}
                        <div class="vault-item-icon">${item.icon}</div>
                        <div class="vault-item-name">${isTh ? item.thaiName : item.name}</div>
                        <div class="vault-item-rarity">${item.rarity.toUpperCase()}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Item Inspector Panel -->
            ${activeItem ? `
              <div class="vault-inspector-card rarity-${activeItem.rarity}">
                <div class="inspector-header">
                  <span class="inspector-icon">${activeItem.icon}</span>
                  <div>
                    <h4 class="inspector-name">${isTh ? activeItem.thaiName : activeItem.name}</h4>
                    <span class="inspector-meta">${activeItem.rarity.toUpperCase()} • ${isTh ? slotNames[activeItem.slot].th : slotNames[activeItem.slot].en}</span>
                  </div>
                </div>

                <p class="inspector-desc">${isTh ? activeItem.thaiDescription : activeItem.description}</p>

                <div class="inspector-stats-grid">
                  ${Object.entries(activeItem.stats).map(([k, v]) => {
                    let label = k;
                    if (k === 'maxHp') label = isTh ? 'พลังชีวิต' : 'Max HP';
                    else if (k === 'defense') label = isTh ? 'เกราะ' : 'Defense';
                    else if (k === 'damageBonusPct') label = isTh ? 'พลังโจมตี' : 'Damage';
                    else if (k === 'moveSpeedPct') label = isTh ? 'ความเร็วเดิน' : 'Move Speed';
                    else if (k === 'critChancePct') label = isTh ? 'คริติคอล' : 'Crit Chance';
                    else if (k === 'attackSpeedPct') label = isTh ? 'ความเร็วตี' : 'Attack Speed';
                    else if (k === 'pickupRadiusPct') label = isTh ? 'ระยะเก็บของ' : 'Pickup Range';
                    const isPct = k.endsWith('Pct');
                    return `
                      <span class="inspector-stat-badge">
                        +${v}${isPct ? '%' : ''} ${label}
                      </span>
                    `;
                  }).join('')}
                </div>

                <div class="inspector-actions">
                  ${equipped[activeItem.slot]?.id === activeItem.id ? `
                    <button id="btn-vault-action" class="btn-vault-unequip" data-slot="${activeItem.slot}">
                      ✕ ${isTh ? 'ถอดอุปกรณ์' : 'UNEQUIP'}
                    </button>
                  ` : `
                    <button id="btn-vault-action" class="btn-vault-equip" data-slot="${activeItem.slot}" data-item-id="${activeItem.id}">
                      ⚡ ${isTh ? 'สวมใส่อุปกรณ์' : 'EQUIP ITEM'}
                    </button>
                  `}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Close button
    const closeBtn = this.root.querySelector('#btn-close-vault');
    closeBtn?.addEventListener('click', () => this.hide());

    // Slot filter buttons
    this.root.querySelectorAll('.vault-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        this.selectedSlotFilter = target.getAttribute('data-filter') as GearSlot | 'ALL';
        this.sound?.playClick();
        this.render();
      });
    });

    // Click on paperdoll slot to inspect or unequip
    this.root.querySelectorAll('.paperdoll-slot').forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const itemId = target.getAttribute('data-item-id');
        if (itemId) {
          this.selectedItemId = itemId;
          this.sound?.playClick();
          this.render();
        }
      });
    });

    // Click on inventory item to inspect
    this.root.querySelectorAll('.vault-item-card').forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const itemId = target.getAttribute('data-item-id');
        if (itemId) {
          this.selectedItemId = itemId;
          this.sound?.playClick();
          this.render();
        }
      });
    });

    // Equip / Unequip Action button
    const actionBtn = this.root.querySelector('#btn-vault-action');
    actionBtn?.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const slot = target.getAttribute('data-slot') as GearSlot;
      const itemId = target.getAttribute('data-item-id');

      if (itemId) {
        MetaProgression.equipGear(slot, itemId);
      } else {
        MetaProgression.unequipGear(slot);
      }

      this.sound?.playClick();
      this.render();
      this.onEquipChange?.();
    });
  }
}
