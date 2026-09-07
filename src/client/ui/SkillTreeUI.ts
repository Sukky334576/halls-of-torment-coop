import { MetaProgression } from '../engine/MetaProgression';
import { PlayerClass, ElementType } from '../../shared/types';
import { CLASS_SKILL_TREES, SkillTreeNode, ClassSkillTree } from '../../shared/skillTreeData';
import { SoundManager } from '../engine/SoundManager';

export class SkillTreeUI {
  private container: HTMLElement;
  private sound?: SoundManager;
  private onDataChanged: () => void;
  private activeClass: PlayerClass | 'universal' = PlayerClass.SWORDSMAN;
  private modalEl: HTMLElement | null = null;

  // Viewport Pan & Zoom state
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

  constructor(container: HTMLElement, onDataChanged: () => void, sound?: SoundManager) {
    this.container = container;
    this.onDataChanged = onDataChanged;
    this.sound = sound;
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
    }
  }

  public isOpen(): boolean {
    return this.modalEl ? this.modalEl.style.display === 'flex' : false;
  }

  private resetView(): void {
    this.zoom = 1.0;
    // Center around root at (500, 350)
    const viewportWidth = window.innerWidth * 0.88;
    const viewportHeight = window.innerHeight * 0.76;
    this.panX = viewportWidth / 2 - 500;
    this.panY = viewportHeight / 2 - 350;
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

    this.modalEl.innerHTML = `
      <div class="poe-tree-panel">
        <!-- Runic Header -->
        <div class="poe-tree-header">
          <div class="poe-header-left">
            <h2 class="poe-tree-title">🏛️ ANCIENT ROOTS OF ASCENSION 🏛️</h2>
            <div class="poe-tree-subtitle">
              <span>${tree.title}</span> • <span class="poe-elem-badge">${tree.elementTitle}</span>
            </div>
          </div>

          <div class="poe-header-center">
            <div class="poe-class-tabs">
              ${[
                { key: PlayerClass.SWORDSMAN, label: 'SWORDSMAN', icon: '🛡️' },
                { key: PlayerClass.ARCHER, label: 'ARCHER', icon: '🏹' },
                { key: PlayerClass.SORCERESS, label: 'SORCERESS', icon: '🔮' },
                { key: PlayerClass.CLERIC, label: 'CLERIC', icon: '✝️' },
                { key: PlayerClass.COMMANDO, label: 'COMMANDO', icon: '🎖️' },
                { key: PlayerClass.CAT_TANK, label: 'CAT TANK', icon: '🐱' },
                { key: PlayerClass.COWBOY, label: 'COWBOY', icon: '🤠' },
                { key: PlayerClass.CELESTIAL_MECHA, label: 'MECHA', icon: '🤖' },
                { key: PlayerClass.GAMBLER, label: 'GAMBLER', icon: '🃏' },
                { key: 'universal', label: 'ผังกลาง (EXP)', icon: '🌟' }
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

          <div class="poe-header-right">
            <div class="poe-coin-counter">
              <span class="coin-icon">🪙</span>
              <span class="coin-num" id="poe-coin-val">${coins}</span>
              <span class="coin-label">SOUL COINS</span>
            </div>
            <button class="poe-btn-close" id="poe-btn-close" title="Close Tree">✕ CLOSE</button>
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

  private showAllocateConfirm(node: SkillTreeNode): void {
    const modal = document.getElementById('skilltree-confirm-modal');
    const msg = document.getElementById('skilltree-confirm-msg');
    const okBtn = document.getElementById('btn-skilltree-confirm-ok');
    const cancelBtn = document.getElementById('btn-skilltree-confirm-cancel');
    if (!modal || !msg || !okBtn || !cancelBtn) return;

    // This modal matches the rest of SkillTreeUI, which is English-only (no I18n usage
    // elsewhere in this file) — kept consistent rather than partially localizing just this bit.
    msg.textContent = `Spend ${node.cost} Gold to permanently unlock "${node.name}"?`;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = () => {
      cleanup();
      if (MetaProgression.allocateNode(node)) {
        this.sound?.playLevelUp();
        this.onDataChanged();
        this.render();
        this.hoveredNode = node;
        this.showTooltip(node);
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
            ${filterAttr}
          />
        `;
      }
    }

    return linesHtml;
  }

  private renderNodes(tree: ClassSkillTree): string {
    return Object.values(tree.nodes)
      .map((node) => {
        const isAllocated = MetaProgression.isNodeAllocated(node.id);
        const canAllocateCheck = MetaProgression.canAllocateNode(node);
        const isAvailable = canAllocateCheck.can;

        let stateClass = 'state-locked';
        if (isAllocated) stateClass = 'state-allocated';
        else if (isAvailable) stateClass = 'state-available';

        return `
          <div
            class="poe-node-socket type-${node.type} ${stateClass}"
            data-node-id="${node.id}"
            style="left: ${node.x}px; top: ${node.y}px;"
          >
            <div class="node-halo"></div>
            <div class="node-frame">
              <span class="node-icon">${node.icon}</span>
              ${
                isAllocated
                  ? '<span class="node-badge-check">✓</span>'
                  : isAvailable
                  ? `<span class="node-badge-cost">🪙${node.cost}</span>`
                  : '<span class="node-badge-lock">🔒</span>'
              }
            </div>
            <div class="node-label-pill">${node.name}</div>
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

    // 2. Class Tab switching
    this.modalEl.querySelectorAll('.poe-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const targetClass = tabBtn.getAttribute('data-class') as PlayerClass | 'universal';
        if (targetClass) {
          this.activeClass = targetClass;
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
      this.zoom = Math.max(0.6, this.zoom - 0.15);
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
        this.zoom = Math.max(0.6, Math.min(1.6, this.zoom + delta));
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
        this.showTooltip(node);
      });

      nodeEl.addEventListener('mouseleave', () => {
        this.hoveredNode = null;
        this.hideTooltip();
      });

      // Click to Allocate
      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();

        if (MetaProgression.isNodeAllocated(node.id)) {
          // Already allocated
          return;
        }

        const canCheck = MetaProgression.canAllocateNode(node);
        if (canCheck.can) {
          this.showAllocateConfirm(node);
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
    const canCheck = MetaProgression.canAllocateNode(node);

    let typeTag = 'MINOR ATTRIBUTE';
    if (node.type === 'root') typeTag = 'ORIGIN CORE';
    else if (node.type === 'notable') typeTag = 'NOTABLE SIGNATURE';
    else if (node.type === 'keystone') typeTag = 'KEYSTONE MASTERY';

    let statusHtml = '';
    if (isAllocated) {
      statusHtml = '<div class="tooltip-status status-allocated">✓ ALLOCATED & ACTIVE</div>';
    } else if (canCheck.can) {
      statusHtml = `<div class="tooltip-status status-available">🪙 CLICK TO ALLOCATE (${node.cost} COINS)</div>`;
    } else {
      statusHtml = `<div class="tooltip-status status-locked">🔒 ${canCheck.reason || 'Locked'}</div>`;
    }

    tooltip.innerHTML = `
      <div class="tooltip-card">
        <div class="tooltip-header">
          <div class="tooltip-type-badge type-${node.type}">${typeTag}</div>
          <h3 class="tooltip-title">${node.icon} ${node.name}</h3>
        </div>
        <div class="tooltip-body">
          <p class="tooltip-desc">${node.description}</p>
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
    let left = this.mouseScreenX + pad;
    let top = this.mouseScreenY + pad;

    // Prevent overflowing screen edges
    const rect = tooltip.getBoundingClientRect();
    if (left + 320 > window.innerWidth) {
      left = this.mouseScreenX - 330;
    }
    if (top + 220 > window.innerHeight) {
      top = window.innerHeight - 230;
    }

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