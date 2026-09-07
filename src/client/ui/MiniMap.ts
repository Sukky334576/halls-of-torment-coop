import {
  PlayerNetworkData,
  MonsterNetworkData,
  PickupNetworkData,
  PickupType,
  MonsterType,
  ShrineData
} from '../../shared/types';

export class MiniMap {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private radarRadius: number = 1100; // World units visible in radar
  private isFarZoom: boolean = false;
  private readonly MAP_SIZE = 176; // Canvas width and height (CSS px)
  private readonly ARENA_BOUNDS = 4500;
  private lootBadge: HTMLElement | null = null;
  private zoomBtn: HTMLElement | null = null;
  private currentShrines: ShrineData[] = [];
  // The radar canvas size never changes post-construction, so this gradient's inputs
  // (cx, cy, rimRadius) never change either — build it once instead of every update()
  // call (20-25Hz), which was previously reallocating a gradient every single tick.
  private cachedBgGrad: CanvasGradient | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'minimap-container';
    this.container.className = 'minimap-wrapper';

    this.container.innerHTML = `
      <div class="minimap-frame">
        <canvas id="minimap-canvas" width="${this.MAP_SIZE * 2}" height="${this.MAP_SIZE * 2}"></canvas>
        <div class="minimap-compass-n">N</div>
        <button id="minimap-zoom-btn" class="minimap-zoom-btn" title="Toggle Radar Zoom [M]">1.0x</button>
        <div id="minimap-loot-badge" class="minimap-loot-badge">
          <span class="loot-item loot-gem" title="EXP Gems">💎 <b id="loot-count-gem">0</b></span>
          <span class="loot-item loot-gold" title="Gold Coins">💰 <b id="loot-count-gold">0</b></span>
        </div>
      </div>
    `;

    parent.appendChild(this.container);

    this.canvas = this.container.querySelector('#minimap-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.lootBadge = this.container.querySelector('#minimap-loot-badge');
    this.zoomBtn = this.container.querySelector('#minimap-zoom-btn');

    this.zoomBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleZoom();
    });

    this.container.addEventListener('click', () => {
      this.toggleZoom();
    });

    // Toggle with 'M' hotkey
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        this.toggleZoom();
      }
    });
  }

  public toggleZoom(): void {
    this.isFarZoom = !this.isFarZoom;
    this.radarRadius = this.isFarZoom ? 2200 : 1100;
    if (this.zoomBtn) {
      this.zoomBtn.textContent = this.isFarZoom ? '0.5x' : '1.0x';
    }
  }

  public updateShrines(shrines: ShrineData[]): void {
    this.currentShrines = shrines;
  }

  public update(
    players: PlayerNetworkData[],
    localPlayerId: string,
    monsters: MonsterNetworkData[],
    pickups: PickupNetworkData[],
    bossAlive: boolean = false
  ): void {
    const me = players.find((p) => p.id === localPlayerId);
    if (!me) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const rimRadius = cx - 10; // Radar inner circle radius in canvas pixels
    const scale = rimRadius / this.radarRadius; // World units to canvas pixels
    const now = performance.now();

    // Clear frame
    ctx.clearRect(0, 0, w, h);

    // 1. Radar Clip Area (Circular)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rimRadius, 0, Math.PI * 2);
    ctx.clip();

    // Background gradient: Dark obsidian dungeon stone (cached — see field comment)
    if (!this.cachedBgGrad) {
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rimRadius);
      bgGrad.addColorStop(0, '#0d131f');
      bgGrad.addColorStop(0.7, '#070a10');
      bgGrad.addColorStop(1, '#030508');
      this.cachedBgGrad = bgGrad;
    }
    ctx.fillStyle = this.cachedBgGrad;
    ctx.fillRect(0, 0, w, h);

    // Concentric Range Rings
    ctx.strokeStyle = 'rgba(74, 85, 104, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rimRadius * 0.33, 0, Math.PI * 2);
    ctx.arc(cx, cy, rimRadius * 0.66, 0, Math.PI * 2);
    ctx.arc(cx, cy, rimRadius * 0.99, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal Crosshairs (faint)
    ctx.strokeStyle = 'rgba(74, 85, 104, 0.2)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - rimRadius);
    ctx.lineTo(cx, cy + rimRadius);
    ctx.moveTo(cx - rimRadius, cy);
    ctx.lineTo(cx + rimRadius, cy);
    ctx.stroke();

    // 2. Arena Outer Wall Boundary
    const half = this.ARENA_BOUNDS / 2;
    const arenaLeft = cx + (-half - me.x) * scale;
    const arenaRight = cx + (half - me.x) * scale;
    const arenaTop = cy + (-half - me.y) * scale;
    const arenaBottom = cy + (half - me.y) * scale;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(arenaLeft, arenaTop, arenaRight - arenaLeft, arenaBottom - arenaTop);

    // 3. Render Monsters (Subtle small dots so loot remains super visible)
    for (const m of monsters) {
      const dx = (m.x - me.x) * scale;
      const dy = (m.y - me.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isBossMob = m.type === MonsterType.LORD_OF_TORMENT || m.type === MonsterType.ELITE_GOLEM;

      if (dist < rimRadius - 4) {
        if (isBossMob) {
          // Boss Marker inside radar: Pulsing Crimson Skull / Diamond
          const bossPulse = 1.0 + Math.sin(now * 0.008) * 0.25;
          ctx.save();
          ctx.translate(cx + dx, cy + dy);
          ctx.fillStyle = 'rgba(220, 38, 38, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 10 * bossPulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px "Cinzel", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💀', 0, 0);
          ctx.restore();
        } else {
          // Common Monster: Small faint red dot
          ctx.fillStyle = 'rgba(239, 68, 68, 0.42)';
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. DROPPED ITEMS (Loot) - Key Feature!
    let gemCount = 0;
    let goldCount = 0;

    for (const p of pickups) {
      const dx = (p.x - me.x) * scale;
      const dy = (p.y - me.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const isExpGem =
        p.type === PickupType.EXP_GEM_SMALL ||
        p.type === PickupType.EXP_GEM_MEDIUM ||
        p.type === PickupType.EXP_GEM_LARGE;
      const isGold = p.type === PickupType.GOLD_COIN;
      const isPotion = p.type === PickupType.HEALTH_POTION;
      const isTomeOrChest =
        p.type === PickupType.TOME_OF_ASCENSION ||
        p.type === PickupType.TREASURE_CHEST ||
        p.type === PickupType.WELL_GEAR;

      if (isExpGem) gemCount++;
      if (isGold) goldCount++;

      if (dist < rimRadius - 5) {
        // Inside radar circle
        const px = cx + dx;
        const py = cy + dy;

        if (isExpGem) {
          // 💎 EXP Gem: Glowing Cyan / Emerald Diamond
          const isLarge = p.type === PickupType.EXP_GEM_LARGE;
          const isMed = p.type === PickupType.EXP_GEM_MEDIUM;
          const gemSize = isLarge ? 4.5 : isMed ? 3.5 : 2.5;

          ctx.fillStyle = isLarge ? '#a855f7' : isMed ? '#38bdf8' : '#34d399';
          ctx.beginPath();
          ctx.moveTo(px, py - gemSize);
          ctx.lineTo(px + gemSize, py);
          ctx.lineTo(px, py + gemSize);
          ctx.lineTo(px - gemSize, py);
          ctx.closePath();
          ctx.fill();
        } else if (isGold) {
          // 💰 Gold Coin: Bright pulsating golden circle with shimmer
          const pulse = 1.0 + Math.sin((now + p.id * 100) * 0.007) * 0.2;
          ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
          ctx.beginPath();
          ctx.arc(px, py, 5 * pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (isPotion) {
          // 🧪 Health Potion: Vivid ruby red cross
          const pulse = 1.0 + Math.sin(now * 0.01) * 0.25;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.arc(px, py, 6 * pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px - 1.5, py - 4, 3, 8);
          ctx.fillRect(px - 4, py - 1.5, 8, 3);
        } else if (isTomeOrChest) {
          // ⭐ Tome of Ascension / Chest: Radiant Star beacon
          const starPulse = 1.0 + Math.sin(now * 0.009) * 0.3;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.beginPath();
          ctx.arc(px, py, 8 * starPulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', px, py);
        }
      }
    }

    // 4.5. Render Battlefield Shrines on MiniMap
    for (const s of this.currentShrines) {
      const dx = (s.x - me.x) * scale;
      const dy = (s.y - me.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < rimRadius - 8) {
        const px = cx + dx;
        const py = cy + dy;

        const pulse = 1.0 + Math.sin(now * 0.008) * 0.25;
        ctx.fillStyle = 'rgba(0, 245, 212, 0.35)';
        ctx.beginPath();
        ctx.arc(px, py, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00f5d4';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛩️', px, py);
      } else {
        const angle = Math.atan2(dy, dx);
        const bx = cx + Math.cos(angle) * (rimRadius - 7);
        const by = cy + Math.sin(angle) * (rimRadius - 7);

        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Render Other Players (Teammates)
    for (const player of players) {
      if (player.id === localPlayerId) continue;
      const dx = (player.x - me.x) * scale;
      const dy = (player.y - me.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (player.isDead) {
        // DEAD / DOWNED TEAMMATE — UNMISSABLE DISTRESS BEACON!
        if (dist < rimRadius - 6) {
          const px = cx + dx;
          const py = cy + dy;

          // Pulsating crimson aura
          const distressPulse = 1.0 + Math.sin(now * 0.009) * 0.35;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.arc(px, py, 13 * distressPulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 9 * distressPulse, 0, Math.PI * 2);
          ctx.stroke();

          // Skull icon
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💀', px, py);

          // Friend name badge
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 9px "Cinzel", sans-serif';
          ctx.fillText(player.name.slice(0, 5), px, py - 12);
        } else {
          // Off-radar downed friend: Big flashing perimeter pointer!
          const angle = Math.atan2(dy, dx);
          const bx = cx + Math.cos(angle) * (rimRadius - 7);
          const by = cy + Math.sin(angle) * (rimRadius - 7);

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(angle);

          const arrowPulse = 1.0 + Math.sin(now * 0.012) * 0.3;
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(8 * arrowPulse, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Skull badge on rim
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💀', bx, by - 9);
        }
        continue;
      }

      // Alive Teammate
      if (dist < rimRadius - 6) {
        const px = cx + dx;
        const py = cy + dy;
        ctx.fillStyle = '#06d6a0';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Cinzel", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name.slice(0, 3), px, py - 6);
      }
    }

    // 6. Local Player (Center Chevron Oriented with Aim Angle)
    ctx.save();
    ctx.translate(cx, cy);

    // Radiating player radar pulse
    const myPulse = (now * 0.002) % 1;
    ctx.strokeStyle = `rgba(255, 209, 102, ${0.4 * (1 - myPulse)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 6 + myPulse * 16, 0, Math.PI * 2);
    ctx.stroke();

    // Aim / facing arrow
    ctx.rotate(me.aimAngle);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    // Core dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // End Radar Clip

    // 7. OFF-SCREEN BEACON POINTERS (Along the Rim)
    // For Bosses, Tomes, Chests, and Potions outside current radar radius
    for (const m of monsters) {
      const isBossMob = m.type === MonsterType.LORD_OF_TORMENT || m.type === MonsterType.ELITE_GOLEM;
      if (!isBossMob) continue;
      const dx = (m.x - me.x) * scale;
      const dy = (m.y - me.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= rimRadius - 4) {
        // Clamp to perimeter rim
        const angle = Math.atan2(dy, dx);
        const bx = cx + Math.cos(angle) * (rimRadius - 7);
        const by = cy + Math.sin(angle) * (rimRadius - 7);

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀', 0, -8);
        ctx.restore();
      }
    }

    // Off-screen pointer for rare loot (Tome / Chest / Potion)
    for (const p of pickups) {
      const isRare =
        p.type === PickupType.TOME_OF_ASCENSION ||
        p.type === PickupType.TREASURE_CHEST ||
        p.type === PickupType.HEALTH_POTION;
      if (!isRare) continue;

      const dx = (p.x - me.x) * scale;
      const dy = (p.y - me.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= rimRadius - 5) {
        const angle = Math.atan2(dy, dx);
        const bx = cx + Math.cos(angle) * (rimRadius - 6);
        const by = cy + Math.sin(angle) * (rimRadius - 6);

        ctx.save();
        ctx.translate(bx, by);
        ctx.fillStyle = p.type === PickupType.HEALTH_POTION ? '#ef4444' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 8. Gothic Ornate Brass Compass Frame Ring
    ctx.save();
    // Outer brass border
    const ringGrad = ctx.createLinearGradient(0, 0, w, h);
    ringGrad.addColorStop(0, '#d4af37');
    ringGrad.addColorStop(0.5, '#785918');
    ringGrad.addColorStop(1, '#b8860b');

    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rimRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Rivet studs around perimeter
    const rivetCount = 8;
    for (let i = 0; i < rivetCount; i++) {
      const ang = (i / rivetCount) * Math.PI * 2;
      const rx = cx + Math.cos(ang) * (rimRadius + 0.5);
      const ry = cy + Math.sin(ang) * (rimRadius + 0.5);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Update loot badge counts
    const gemEl = document.getElementById('loot-count-gem');
    const goldEl = document.getElementById('loot-count-gold');
    if (gemEl) gemEl.textContent = gemCount.toString();
    if (goldEl) goldEl.textContent = goldCount.toString();
  }
}
