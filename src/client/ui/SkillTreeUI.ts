import { MetaProgression } from '../engine/MetaProgression';
import { PlayerClass, ElementType } from '../../shared/types';
import { CLASS_SKILL_TREES, SkillTreeNode, ClassSkillTree, getNodeName, getNodeDescription } from '../../shared/skillTreeData';
import { SoundManager } from '../engine/SoundManager';
import { I18n } from '../engine/I18n';

export class SkillTreeUI {
  private container: HTMLElement;
  private sound?: SoundManager;
  private onDataChanged: () => void;
  private activeClass: PlayerClass | 'universal' = PlayerClass.SWORDSMAN;
  private modalEl: HTMLElement | null = null;

  // Viewport Pan & Zoom state
  // Floor was 0.4 originally; the tree has since grown (ascension tiers past every keystone,
  // extra spliced-in nodes) past what 0.4 can fit on screen, so a fixed 40% left large trees
  // clipped no matter how hard "fit to bounding box" tried. Lowered so both the auto-fit and
  // the manual zoom-out button can actually reach whatever a given tree's true size needs.
  private static readonly MIN_ZOOM = 0.15;
  private zoom: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;
  private isDragging: boolean = false;
  private startDragX: number = 0;
  private startDragY: number = 0;

  // Hovered node for POE tooltip
  private hoveredNode: SkillTreeNode | null = null;
  private mouseScreenX: number = 0;
  private mouseScreenY: number = 0;
  // Set only for keyboard-focus previews, which have no associated mouse position — the
  // tooltip anchors to this element's own screen rect instead of the (stale/irrelevant)
  // last mouse coordinates. Null means "use the mouse position" (real hover).
  private tooltipAnchorEl: HTMLElement | null = null;

  // Queued (not-yet-spent) node picks — lets a player plan several allocations
  // across tabs and pay for all of them at once via the "Confirm" bar, instead
  // of a spend-confirmation popup on every single click.
  private pendingNodeIds: string[] = [];

  constructor(container: HTMLElement, onDataChanged: () => void, sound?: SoundManager) {
    this.container = container;
    this.onDataChanged = onDataChanged;
    this.sound = sound;
    I18n.onLanguageChanged(() => {
      if (this.isOpen()) this.render();
    });
  }

  public show(): void {
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.id = 'skill-tree-modal';
      this.modalEl.className = 'poe-tree-backdrop';
      this.container.appendChild(this.modalEl);
      this.setupGlobalEvents();
    }
    this.modalEl.style.display = 'flex';
    this.resetView();
    this.render();
  }

  public hide(): void {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
      this.hoveredNode = null;
      this.hideTooltip();
      // Closing without confirming discards the queued (unpaid) picks, same as
      // navigating away from any other unsaved draft.
      this.pendingNodeIds = [];
    }
  }

  public isOpen(): boolean {
    return this.modalEl ? this.modalEl.style.display === 'flex' : false;
  }

  private resetView(): void {
    const viewportWidth = window.innerWidth * 0.88;
    const viewportHeight = window.innerHeight * 0.76;

    // Fit the active tree's actual node bounding box instead of assuming every tree is small
    // enough to read at a fixed 100% zoom centered on the root. Trees vary a lot in footprint
    // (a freshly-expanded one can span 2-3x what a compact one does), so a flat zoom/pan left
    // most of a big tree off-screen until the player manually zoomed out and recentered.
    const tree = CLASS_SKILL_TREES[this.activeClass];
    const nodes = tree ? Object.values(tree.nodes) : [];

    if (nodes.length === 0) {
      this.zoom = 1.0;
      this.panX = viewportWidth / 2 - 500;
      this.panY = viewportHeight / 2 - 350;
      return;
    }

    // Padding accounts for each node's own radius plus its label chip extending below it.
    const PADDING = 140;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
    const contentWidth = (maxX - minX) + PADDING * 2;
    const contentHeight = (maxY - minY) + PADDING * 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const fitZoom = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight);
    // Never auto zoom-in past 100% for a small tree — only zoom out to fit a large one.
    // Floor matches the manual zoom-out limit below so a big tree can actually reach a
    // fit that shows every node instead of being clamped tighter than the true fit needs.
    this.zoom = Math.max(SkillTreeUI.MIN_ZOOM, Math.min(1.0, fitZoom));
    this.panX = viewportWidth / 2 - this.zoom * centerX;
    this.panY = viewportHeight / 2 - this.zoom * centerY;
  }

  private setupGlobalEvents(): void {
    if (!this.modalEl) return;

    // Window resize handler
    window.addEventListener('resize', () => {
      if (this.isOpen()) {
        this.render();
      }
    });
  }

  private render(): void {
    if (!this.modalEl) return;
    const coins = MetaProgression.getCoins();
    const tree = CLASS_SKILL_TREES[this.activeClass] || CLASS_SKILL_TREES[PlayerClass.SWORDSMAN];
    const isTh = I18n.getLanguage() === 'th';

    this.modalEl.innerHTML = `
      <div class="poe-tree-panel">
        <!-- Runic Header — top row (title/subtitle + coins/close) and the tab strip are
             each forced onto their own row (see .poe-header-top / .poe-header-center in
             index.html) so a longer per-class subtitle can never steal the tab strip's row
             or vice versa; only the tab strip's own internal wrapping varies by class. -->
        <div class="poe-tree-header">
          <div class="poe-header-top">
            <div class="poe-header-left">
              <h2 class="poe-tree-title">🏛️ ANCIENT ROOTS OF ASCENSION 🏛️</h2>
              <div class="poe-tree-subtitle">
                <span>${isTh && tree.titleTh ? tree.titleTh : tree.title}</span> • <span class="poe-elem-badge">${isTh && tree.elementTitleTh ? tree.elementTitleTh : tree.elementTitle}</span>
              </div>
            </div>

            <div class="poe-header-right">
              ${
                this.pendingNodeIds.length > 0
                  ? `
                <div class="poe-pending-summary">
                  <span class="pending-count">${this.pendingNodeIds.length} เลือกไว้</span>
                  <span class="pending-cost">-🪙${this.getPendingTotalCost()}</span>
                  <button class="poe-btn-pending-clear" id="poe-btn-pending-clear" title="Clear queued selections">✕ ล้าง</button>
                  <button class="poe-btn-pending-confirm" id="poe-btn-pending-confirm">✅ ยืนยัน (${this.pendingNodeIds.length})</button>
                </div>
              `
                  : ''
              }
              <div class="poe-coin-counter">
                <span class="coin-icon">🪙</span>
                <span class="coin-num" id="poe-coin-val">${coins}</span>
                <span class="coin-label">SOUL COINS</span>
              </div>
              <button class="poe-btn-close" id="poe-btn-close" title="Close Tree">✕ CLOSE</button>
            </div>
          </div>

          <div class="poe-header-center">
            <div class="poe-class-tabs">
              ${[
                { key: PlayerClass.SWORDSMAN, label: I18n.t('class.swordsman.name').toUpperCase(), icon: '🛡️' },
                { key: PlayerClass.ARCHER, label: I18n.t('class.archer.name').toUpperCase(), icon: '🏹' },
                { key: PlayerClass.SORCERESS, label: I18n.t('class.sorceress.name').toUpperCase(), icon: '🔮' },
                { key: PlayerClass.CLERIC, label: I18n.t('class.cleric.name').toUpperCase(), icon: '✝️' },
                { key: PlayerClass.COMMANDO, label: I18n.t('class.commando.name').toUpperCase(), icon: '🎖️' },
                { key: PlayerClass.CAT_TANK, label: I18n.t('class.cat_tank.name').toUpperCase(), icon: '🐱' },
                { key: PlayerClass.COWBOY, label: I18n.t('class.cowboy.name').toUpperCase(), icon: '🤠' },
                { key: PlayerClass.CELESTIAL_MECHA, label: I18n.t('class.celestial_mecha.name').toUpperCase(), icon: '🤖' },
                { key: PlayerClass.GAMBLER, label: I18n.t('class.gambler.name').toUpperCase(), icon: '🃏' },
                { key: 'universal', label: isTh ? 'ผังกลาง (EXP)' : 'GENERAL (EXP)', icon: '🌟' }
              ]
                .map(
                  (t) => `
                <button
                  class="poe-tab ${this.activeClass === t.key ? 'active' : ''} ${t.key === 'universal' ? 'universal-tab' : ''}"
                  data-class="${t.key}"
                >
                  ${t.icon} ${t.label}
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <!-- Interactive Pan & Zoom Tree Viewport -->
        <div class="poe-viewport" id="poe-viewport">
          <!-- Floating Zoom Controls -->
          <div class="poe-viewport-controls">
            <button class="poe-ctrl-btn" id="poe-btn-zoom-in" title="Zoom In">➕</button>
            <button class="poe-ctrl-btn" id="poe-btn-zoom-out" title="Zoom Out">➖</button>
            <button class="poe-ctrl-btn" id="poe-btn-recenter" title="Center on Origin Root">🎯 RECENTER</button>
            <span class="poe-zoom-indicator" id="poe-zoom-val">${Math.round(this.zoom * 100)}%</span>
          </div>

          <!-- Tree World (Transforms with Pan & Zoom) -->
          <div class="poe-world" id="poe-world" style="transform: translate(${this.panX}px, ${this.panY}px) scale(${this.zoom});">
            <!-- Layer 1: SVG Root Tendrils & Connecting Paths -->
            <svg class="poe-svg-layer" width="1000" height="700" viewBox="0 0 1000 700">
              <defs>
                <filter id="poe-glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="poe-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              ${this.renderSvgBranches(tree)}
            </svg>

            <!-- Layer 1.5: Branch Category Labels (prototype, decorative only) -->
            <div class="poe-category-layer">
              ${this.renderCategoryLabels(tree)}
            </div>

            <!-- Layer 2: Interactive Node Sockets -->
            <div class="poe-nodes-layer">
              ${this.renderNodes(tree)}
            </div>
          </div>

          <!-- Legend Bar (Bottom Center) -->
          <div class="poe-legend-bar">
            <div class="legend-item"><span class="legend-pip pip-root"></span> Class Origin</div>
            <div class="legend-item"><span class="legend-pip pip-minor"></span> Minor Attribute</div>
            <div class="legend-item"><span class="legend-pip pip-notable"></span> Signature Skill</div>
            <div class="legend-item"><span class="legend-pip pip-keystone"></span> Keystone Mastery</div>
            <div class="legend-hint">🖱️ Click & Drag to Pan • Scroll Wheel to Zoom • Click Node to Allocate</div>
          </div>
        </div>

        <!-- Floating POE Dark Fantasy Tooltip -->
        <div id="poe-node-tooltip" class="poe-node-tooltip" style="display: none;"></div>
      </div>

      <!-- Allocation Confirmation Sub-Modal -->
      <div id="skilltree-confirm-modal" class="esc-confirm-backdrop" style="display: none;">
        <div class="esc-confirm-card">
          <div class="confirm-icon">🌌</div>
          <h3 id="skilltree-confirm-title" class="confirm-title">Allocate Node?</h3>
          <p id="skilltree-confirm-msg" class="confirm-msg"></p>
          <div class="confirm-actions">
            <button id="btn-skilltree-confirm-cancel" class="btn-esc-aux">Cancel</button>
            <button id="btn-skilltree-confirm-ok" class="btn-esc-primary">Confirm</button>
          </div>
        </div>
      </div>
    `;

    this.bindViewportInteractions();
    this.bindNodeClicks();
  }

  /** Finds a node by id across every class tree (queued ids aren't scoped to the active tab). */
  private findNodeById(nodeId: string): SkillTreeNode | undefined {
    for (const tree of Object.values(CLASS_SKILL_TREES)) {
      if (tree.nodes[nodeId]) return tree.nodes[nodeId];
    }
    return undefined;
  }

  private getPendingTotalCost(): number {
    return this.pendingNodeIds.reduce((sum, id) => sum + (this.findNodeById(id)?.cost || 0), 0);
  }

  private isNodeAllocatedOrPending(nodeId: string): boolean {
    return MetaProgression.isNodeAllocated(nodeId) || this.pendingNodeIds.includes(nodeId);
  }

  /**
   * Mirrors MetaProgression.canAllocateNode(), but treats queued-not-yet-paid picks as
   * allocated for connection-path purposes, and checks affordability against gold left
   * over after every other queued pick (so the queue can never plan more than the wallet
   * can actually cover once "Confirm" is pressed).
   */
  private canQueueNode(node: SkillTreeNode): { can: boolean; reason?: string } {
    if (MetaProgression.isNodeAllocated(node.id)) {
      return { can: false, reason: 'Already Allocated' };
    }
    if (node.classType !== 'universal' && !MetaProgression.isHeroUnlocked(node.classType)) {
      return { can: false, reason: 'Unlock this hero first' };
    }
    const remainingGold = MetaProgression.getCoins() - this.getPendingTotalCost();
    if (remainingGold < node.cost) {
      return { can: false, reason: `Need ${node.cost} Coins (${remainingGold} left after queued picks)` };
    }
    const hasConnectedNeighbor = node.connections.some((id) => this.isNodeAllocatedOrPending(id));
    if (!hasConnectedNeighbor && node.type !== 'root') {
      return { can: false, reason: 'Locked: Must allocate/queue an adjacent connected node first' };
    }
    return { can: true };
  }

  /** Removes a node from the queue, cascading to any other queued node that was only reachable through it. */
  private removeFromPendingWithDependents(nodeId: string): void {
    this.pendingNodeIds = this.pendingNodeIds.filter((id) => id !== nodeId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of [...this.pendingNodeIds]) {
        const n = this.findNodeById(id);
        if (!n || n.type === 'root') continue;
        const stillConnected = n.connections.some((cid) => this.isNodeAllocatedOrPending(cid));
        if (!stillConnected) {
          this.pendingNodeIds = this.pendingNodeIds.filter((pid) => pid !== id);
          changed = true;
        }
      }
    }
  }

  private confirmPendingAllocations(): void {
    let successCount = 0;
    for (const nodeId of this.pendingNodeIds) {
      const node = this.findNodeById(nodeId);
      if (node && MetaProgression.allocateNode(node)) {
        successCount++;
      }
    }
    this.pendingNodeIds = [];
    if (successCount > 0) {
      this.sound?.playLevelUp();
      this.onDataChanged();
    }
    this.render();
  }

  private showBatchConfirm(): void {
    const modal = document.getElementById('skilltree-confirm-modal');
    const title = document.getElementById('skilltree-confirm-title');
    const msg = document.getElementById('skilltree-confirm-msg');
    const okBtn = document.getElementById('btn-skilltree-confirm-ok');
    const cancelBtn = document.getElementById('btn-skilltree-confirm-cancel');
    if (!modal || !msg || !okBtn || !cancelBtn) return;

    const count = this.pendingNodeIds.length;
    const totalCost = this.getPendingTotalCost();
    const isTh = I18n.getLanguage() === 'th';

    // Name the specific skill(s) rather than just a count — without hover preview on
    // touch, this confirm step is the only remaining checkpoint to catch a mis-tap before
    // gold is actually spent. Cap the listed names so a large queue doesn't blow up the modal.
    const MAX_NAMED = 4;
    const names = this.pendingNodeIds
      .map((id) => this.findNodeById(id))
      .filter((n): n is SkillTreeNode => !!n)
      .map((n) => getNodeName(n, isTh ? 'th' : 'en'));
    const namedList = names.slice(0, MAX_NAMED).join(isTh ? ', ' : ', ');
    const extra = names.length - MAX_NAMED;
    const nameSuffix = extra > 0 ? (isTh ? ` และอีก ${extra}` : ` and ${extra} more`) : '';

    if (title) title.textContent = isTh ? 'ยืนยันการปลดล็อก' : 'Confirm Allocation';
    msg.textContent = isTh
      ? `ปลดล็อก "${namedList}"${nameSuffix} รวม ${count} สกิล ด้วยเหรียญทอง ${totalCost}?`
      : `Unlock "${namedList}"${nameSuffix} (${count} skill${count > 1 ? 's' : ''}) for ${totalCost} Gold?`;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = () => {
      cleanup();
      this.confirmPendingAllocations();
    };
    const onCancel = () => cleanup();

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  }

  private showUnallocateConfirm(node: SkillTreeNode): void {
    const modal = document.getElementById('skilltree-confirm-modal');
    const title = document.getElementById('skilltree-confirm-title');
    const msg = document.getElementById('skilltree-confirm-msg');
    const okBtn = document.getElementById('btn-skilltree-confirm-ok');
    const cancelBtn = document.getElementById('btn-skilltree-confirm-cancel');
    if (!modal || !msg || !okBtn || !cancelBtn) return;

    const isTh = I18n.getLanguage() === 'th';
    const refund = MetaProgression.getRespecRefundAmount(node.cost);
    if (title) title.textContent = isTh ? 'ถอนสกิลนี้?' : 'Un-invest this skill?';
    msg.textContent = isTh
      ? `คืนสกิล "${getNodeName(node, 'th')}" รับเหรียญคืน ${refund} จาก ${node.cost} เหรียญ (70%)?`
      : `Refund "${node.name}" and get ${refund} of ${node.cost} Gold back (70%)?`;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = () => {
      cleanup();
      if (MetaProgression.unallocateNode(node.id)) {
        this.onDataChanged();
        this.render();
      }
    };
    const onCancel = () => cleanup();

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  }

  private renderSvgBranches(tree: ClassSkillTree): string {
    const renderedEdges = new Set<string>();
    let linesHtml = '';

    for (const node of Object.values(tree.nodes)) {
      for (const neighborId of node.connections) {
        const neighbor = tree.nodes[neighborId];
        if (!neighbor) continue;

        // Canonical edge key
        const edgeKey = [node.id, neighborId].sort().join('--');
        if (renderedEdges.has(edgeKey)) continue;
        renderedEdges.add(edgeKey);

        const isNodeAAllocated = MetaProgression.isNodeAllocated(node.id);
        const isNodeBAllocated = MetaProgression.isNodeAllocated(neighborId);

        let branchClass = 'branch-locked';
        let strokeColor = '#242938';
        let strokeWidth = '3';
        let filterAttr = '';

        if (isNodeAAllocated && isNodeBAllocated) {
          branchClass = 'branch-allocated';
          strokeColor = '#ffd166';
          strokeWidth = '5';
          filterAttr = 'filter="url(#poe-glow-gold)"';
        } else if (isNodeAAllocated || isNodeBAllocated) {
          // One is allocated: available tendril!
          branchClass = 'branch-available';
          strokeColor = '#00f5d4';
          strokeWidth = '3.5';
          filterAttr = 'filter="url(#poe-glow-cyan)"';
        } else if (this.pendingNodeIds.includes(node.id) || this.pendingNodeIds.includes(neighborId)) {
          // Neither is actually allocated yet, but one side is queued.
          branchClass = 'branch-pending';
          strokeColor = '#e879f9';
          strokeWidth = '3.5';
        }

        // Curved organic bezier path or line
        const dx = neighbor.x - node.x;
        const dy = neighbor.y - node.y;
        const cx = (node.x + neighbor.x) / 2 - dy * 0.08;
        const cy = (node.y + neighbor.y) / 2 + dx * 0.08;

        linesHtml += `
          <path
            d="M ${node.x} ${node.y} Q ${cx} ${cy} ${neighbor.x} ${neighbor.y}"
            class="poe-root-tendril ${branchClass}"
            stroke="${strokeColor}"
            stroke-width="${strokeWidth}"
            fill="none"
            vector-effect="non-scaling-stroke"
            ${filterAttr}
          />
        `;
      }
    }

    return linesHtml;
  }

  /** Prototype: floating, non-interactive labels marking each branch's cluster (Swordsman only for now). */
  private renderCategoryLabels(tree: ClassSkillTree): string {
    if (!tree.categories || tree.categories.length === 0) return '';
    const isTh = I18n.getLanguage() === 'th';
    return tree.categories
      .map((cat) => {
        const text = isTh && cat.labelTh ? cat.labelTh : cat.label;
        const color = cat.color || '#e2e8f0';
        return `
          <div class="poe-category-label" style="left: ${cat.x}px; top: ${cat.y}px; color: ${color}; border-color: ${color};">
            ${text}
          </div>
        `;
      })
      .join('');
  }

  private renderNodes(tree: ClassSkillTree): string {
    const isTh = I18n.getLanguage() === 'th';
    return Object.values(tree.nodes)
      .map((node) => {
        const isAllocated = MetaProgression.isNodeAllocated(node.id);
        const isPending = this.pendingNodeIds.includes(node.id);
        const isAvailable = !isAllocated && !isPending && this.canQueueNode(node).can;

        let stateClass = 'state-locked';
        if (isAllocated) stateClass = 'state-allocated';
        else if (isPending) stateClass = 'state-pending';
        else if (isAvailable) stateClass = 'state-available';

        // Touch/click target stays a comfortable on-screen size (~40px) even when the tree
        // is auto-fit-zoomed way out — an invisible hit area sized in WORLD units so it
        // renders at a constant screen size (world-units * zoom = target px), without
        // changing the visible node's own size (which still shrinks with zoom, preserving
        // the overview/spacing this session's overlap fix depends on).
        const baseWorldSize = node.type === 'root' ? 66 : node.type === 'keystone' ? 52 : node.type === 'notable' ? 46 : 34;
        const hitAreaSize = Math.max(40 / this.zoom, baseWorldSize);

        const displayName = getNodeName(node, isTh ? 'th' : 'en');
        const statusLabel = isAllocated
          ? (isTh ? 'ปลดล็อกแล้ว' : 'allocated')
          : isPending
          ? (isTh ? `จ่อคิว, ${node.cost} เหรียญ` : `queued, ${node.cost} coins`)
          : isAvailable
          ? (isTh ? `กดเพื่อจ่อคิว, ${node.cost} เหรียญ` : `available, ${node.cost} coins`)
          : (isTh ? 'ล็อกอยู่' : 'locked');

        return `
          <div
            class="poe-node-socket type-${node.type} ${stateClass} ${node.isUniversalBasic ? 'is-universal-basic' : ''}"
            data-node-id="${node.id}"
            style="left: ${node.x}px; top: ${node.y}px;"
            role="button"
            tabindex="0"
            aria-label="${displayName}, ${statusLabel}"
          >
            <div class="node-hit-area" style="width: ${hitAreaSize}px; height: ${hitAreaSize}px;"></div>
            <div class="node-halo"></div>
            <div class="node-frame">
              <span class="node-icon">${node.icon}</span>
              ${
                isAllocated
                  ? '<span class="node-badge-check">✓</span>'
                  : isPending
                  ? `<span class="node-badge-pending">🕓${node.cost}</span>`
                  : isAvailable
                  ? `<span class="node-badge-cost">🪙${node.cost}</span>`
                  : '<span class="node-badge-lock">🔒</span>'
              }
            </div>
            <div class="node-label-pill">${displayName}</div>
          </div>
        `;
      })
      .join('');
  }

  private bindViewportInteractions(): void {
    if (!this.modalEl) return;

    // 1. Close button
    this.modalEl.querySelector('#poe-btn-close')?.addEventListener('click', () => {
      this.hide();
    });

    // 1b. Pending-queue confirm/clear bar
    this.modalEl.querySelector('#poe-btn-pending-clear')?.addEventListener('click', () => {
      this.pendingNodeIds = [];
      this.render();
    });
    this.modalEl.querySelector('#poe-btn-pending-confirm')?.addEventListener('click', () => {
      this.showBatchConfirm();
    });

    // 2. Class Tab switching
    this.modalEl.querySelectorAll('.poe-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const targetClass = tabBtn.getAttribute('data-class') as PlayerClass | 'universal';
        if (targetClass) {
          this.activeClass = targetClass;
          // Each class tree has its own footprint, so the pan/zoom tuned for the previous
          // tab's tree rarely fits this one — refit instead of carrying it over.
          this.resetView();
          this.render();
        }
      });
    });

    // 3. Zoom Controls
    const worldEl = this.modalEl.querySelector('#poe-world') as HTMLElement;
    const zoomValEl = this.modalEl.querySelector('#poe-zoom-val');

    const updateWorldTransform = () => {
      if (worldEl) {
        worldEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
      }
      if (zoomValEl) {
        zoomValEl.textContent = `${Math.round(this.zoom * 100)}%`;
      }
    };

    this.modalEl.querySelector('#poe-btn-zoom-in')?.addEventListener('click', () => {
      this.zoom = Math.min(1.6, this.zoom + 0.15);
      updateWorldTransform();
    });

    this.modalEl.querySelector('#poe-btn-zoom-out')?.addEventListener('click', () => {
      this.zoom = Math.max(SkillTreeUI.MIN_ZOOM, this.zoom - 0.15);
      updateWorldTransform();
    });

    this.modalEl.querySelector('#poe-btn-recenter')?.addEventListener('click', () => {
      this.resetView();
      updateWorldTransform();
    });

    // 4. Viewport Pan & Wheel Drag
    const viewport = this.modalEl.querySelector('#poe-viewport') as HTMLElement;
    if (!viewport) return;

    viewport.addEventListener('mousedown', (e) => {
      // Only drag if not clicking directly on a node
      if ((e.target as HTMLElement).closest('.poe-node-socket')) return;
      this.isDragging = true;
      this.startDragX = e.clientX - this.panX;
      this.startDragY = e.clientY - this.panY;
      viewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreenX = e.clientX;
      this.mouseScreenY = e.clientY;

      if (this.isDragging) {
        this.panX = e.clientX - this.startDragX;
        this.panY = e.clientY - this.startDragY;
        updateWorldTransform();
      }

      if (this.hoveredNode) {
        this.updateTooltipPosition();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (viewport) viewport.style.cursor = 'grab';
      }
    });

    viewport.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zoom = Math.max(SkillTreeUI.MIN_ZOOM, Math.min(1.6, this.zoom + delta));
        updateWorldTransform();
      },
      { passive: false }
    );
  }

  private bindNodeClicks(): void {
    if (!this.modalEl) return;
    const tree = CLASS_SKILL_TREES[this.activeClass];

    this.modalEl.querySelectorAll('.poe-node-socket').forEach((nodeEl) => {
      const nodeId = nodeEl.getAttribute('data-node-id');
      if (!nodeId) return;
      const node = tree.nodes[nodeId];
      if (!node) return;

      // Mouseenter & Mouseleave for POE Tooltip
      nodeEl.addEventListener('mouseenter', () => {
        this.hoveredNode = node;
        this.tooltipAnchorEl = null; // real mouse hover — position off the cursor
        this.showTooltip(node);
      });

      nodeEl.addEventListener('mouseleave', () => {
        this.hoveredNode = null;
        this.hideTooltip();
      });

      // Keyboard parity for the same preview + activate flow mouse hover/click gets —
      // tab-focusing a node previews it (focus mirrors mouseenter), Enter/Space activates it.
      nodeEl.addEventListener('focus', () => {
        this.hoveredNode = node;
        // No mouse position is involved in a keyboard focus — anchor the tooltip to the
        // focused node itself instead of whatever the mouse cursor last happened to touch.
        this.tooltipAnchorEl = nodeEl as HTMLElement;
        this.showTooltip(node);
      });

      nodeEl.addEventListener('blur', () => {
        this.hoveredNode = null;
        this.tooltipAnchorEl = null;
        this.hideTooltip();
      });

      nodeEl.addEventListener('keydown', (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ' || ke.key === 'Spacebar') {
          ke.preventDefault();
          (nodeEl as HTMLElement).click();
        }
      });

      // Click to queue/unqueue — no per-node spend confirmation. Gold is only ever
      // actually spent when the player presses the batch "Confirm" bar.
      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();

        if (MetaProgression.isNodeAllocated(node.id)) {
          const canCheck = MetaProgression.canUnallocateNode(node.id);
          if (canCheck.can) {
            this.showUnallocateConfirm(node);
          } else {
            nodeEl.classList.add('node-shake');
            setTimeout(() => nodeEl.classList.remove('node-shake'), 400);
          }
          return;
        }

        if (this.pendingNodeIds.includes(node.id)) {
          this.removeFromPendingWithDependents(node.id);
          this.render();
          return;
        }

        const canCheck = this.canQueueNode(node);
        if (canCheck.can) {
          this.pendingNodeIds.push(node.id);
          this.render();
        } else {
          // Shake node for rejection feedback
          nodeEl.classList.add('node-shake');
          setTimeout(() => nodeEl.classList.remove('node-shake'), 400);
        }
      });
    });
  }

  private showTooltip(node: SkillTreeNode): void {
    const tooltip = document.getElementById('poe-node-tooltip');
    if (!tooltip) return;

    const isAllocated = MetaProgression.isNodeAllocated(node.id);
    const isPending = this.pendingNodeIds.includes(node.id);
    const canCheck = this.canQueueNode(node);
    const isTh = I18n.getLanguage() === 'th';

    let typeTag = 'MINOR ATTRIBUTE';
    if (node.type === 'root') typeTag = 'ORIGIN CORE';
    else if (node.type === 'notable') typeTag = 'NOTABLE SIGNATURE';
    else if (node.type === 'keystone') typeTag = 'KEYSTONE MASTERY';
    if (node.isUniversalBasic) typeTag = 'UNIVERSAL FOUNDATION';

    let statusHtml = '';
    if (isAllocated) {
      if (node.type === 'root') {
        statusHtml = '<div class="tooltip-status status-allocated">✓ ALLOCATED & ACTIVE</div>';
      } else {
        const unallocCheck = MetaProgression.canUnallocateNode(node.id);
        const refund = MetaProgression.getRespecRefundAmount(node.cost);
        statusHtml = unallocCheck.can
          ? `<div class="tooltip-status status-allocated">✓ ACTIVE — click to un-invest & refund ${refund} coins (70%)</div>`
          : `<div class="tooltip-status status-allocated">✓ ACTIVE — ${unallocCheck.reason}</div>`;
      }
    } else if (isPending) {
      statusHtml = `<div class="tooltip-status status-pending">🕓 QUEUED — click again to remove, or Confirm to spend ${node.cost} coins</div>`;
    } else if (canCheck.can) {
      statusHtml = `<div class="tooltip-status status-available">🪙 CLICK TO QUEUE (${node.cost} COINS)</div>`;
    } else {
      statusHtml = `<div class="tooltip-status status-locked">🔒 ${canCheck.reason || 'Locked'}</div>`;
    }

    tooltip.innerHTML = `
      <div class="tooltip-card">
        <div class="tooltip-header">
          <div class="tooltip-type-badge type-${node.type} ${node.isUniversalBasic ? 'is-universal-basic' : ''}">${typeTag}</div>
          <h3 class="tooltip-title">${node.icon} ${getNodeName(node, isTh ? 'th' : 'en')}</h3>
        </div>
        <div class="tooltip-body">
          <p class="tooltip-desc">${getNodeDescription(node, isTh ? 'th' : 'en')}</p>
          ${
            node.signatureSkillId
              ? '<div class="tooltip-special">★ Unlocks for in-game level-up blessing pool!</div>'
              : ''
          }
        </div>
        ${statusHtml}
      </div>
    `;

    tooltip.style.display = 'block';
    this.updateTooltipPosition();
  }

  private updateTooltipPosition(): void {
    const tooltip = document.getElementById('poe-node-tooltip');
    if (!tooltip) return;

    const pad = 18;
    let left: number;
    let top: number;

    if (this.tooltipAnchorEl) {
      // Keyboard focus: anchor to the focused node's own screen position, not the mouse.
      const anchorRect = this.tooltipAnchorEl.getBoundingClientRect();
      left = anchorRect.right + pad;
      top = anchorRect.top;
      if (left + 320 > window.innerWidth) {
        left = anchorRect.left - 330;
      }
    } else {
      left = this.mouseScreenX + pad;
      top = this.mouseScreenY + pad;
      if (left + 320 > window.innerWidth) {
        left = this.mouseScreenX - 330;
      }
    }

    // Always keep the tooltip fully inside the viewport on every edge, regardless of
    // anchor source — a stale/unset mouse position must never be able to pin it over
    // the header or tab bar. Floor `top` below the fixed header/tab-bar chrome (not just
    // the viewport edge) so even an unrealistic (0,0)-style stale position can't overlap it.
    const headerEl = this.modalEl?.querySelector('.poe-tree-header') as HTMLElement | null;
    const minTop = headerEl ? headerEl.getBoundingClientRect().bottom + 8 : 8;
    left = Math.max(8, Math.min(left, window.innerWidth - 328));
    top = Math.max(minTop, Math.min(top, window.innerHeight - 230));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  private hideTooltip(): void {
    const tooltip = document.getElementById('poe-node-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
}