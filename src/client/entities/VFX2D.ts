import {
  ProjectileNetworkData,
  ProjectileType,
  PickupNetworkData,
  PickupType,
  ShrineData,
  ShrineType,
  PlayerClass
} from '../../shared/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
}

interface DashGhost {
  x: number;
  y: number;
  playerClass: PlayerClass;
  life: number;
  maxLife: number;
}

export class VFX2D {
  private particles: Particle[] = [];
  private currentProjectiles: ProjectileNetworkData[] = [];
  private currentPickups: PickupNetworkData[] = [];
  private currentShrines: ShrineData[] = [];
  private dashGhosts: DashGhost[] = [];

  public updateProjectiles(projectiles: ProjectileNetworkData[]): void {
    this.currentProjectiles = projectiles;
  }

  public updatePickups(pickups: PickupNetworkData[]): void {
    this.currentPickups = pickups;
  }

  public updateShrines(shrines: ShrineData[]): void {
    this.currentShrines = shrines;
  }

  public spawnDashGhost(x: number, y: number, playerClass: PlayerClass): void {
    this.dashGhosts.push({
      x,
      y,
      playerClass,
      life: 0,
      maxLife: 0.28
    });
  }

  public spawnHitImpact(x: number, y: number, isCrit: boolean): void {
    const count = isCrit ? 14 : 7;
    const colors = isCrit ? ['#ff0055', '#ffd166', '#ffffff'] : ['#ffdd00', '#f59e0b', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isCrit ? 180 : 100) * (0.5 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: isCrit ? 2.5 + Math.random() * 2 : 1.5 + Math.random() * 1.5,
        life: 0,
        maxLife: isCrit ? 0.35 : 0.2
      });
    }
  }

  public updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
      const g = this.dashGhosts[i];
      g.life += dt;
      if (g.life >= g.maxLife) {
        this.dashGhosts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, time: number): void {
    // 0. Render Dash Ghosts
    for (const g of this.dashGhosts) {
      const alpha = Math.max(0, 1.0 - g.life / g.maxLife) * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(g.x, g.y);

      let ghostColor = '#3a86ff';
      if (g.playerClass === PlayerClass.ARCHER) ghostColor = '#10b981';
      else if (g.playerClass === PlayerClass.SORCERESS) ghostColor = '#c084fc';
      else if (g.playerClass === PlayerClass.CLERIC) ghostColor = '#ffd166';

      ctx.fillStyle = ghostColor;
      ctx.shadowColor = ghostColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, -12, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 0.5. Render Battlefield Shrines
    for (const s of this.currentShrines) {
      const bob = Math.sin(time * 3 + s.id) * 4;
      ctx.save();
      ctx.translate(s.x, s.y);

      let shrineColor = '#00f5d4';
      let icon = '⚡';
      let label = 'SPEED';
      const isAltar = s.type === ShrineType.ALTAR_BLOOD || s.type === ShrineType.ALTAR_TEMPEST || s.type === ShrineType.ALTAR_VOID;

      if (s.type === ShrineType.FRENZY) {
        shrineColor = '#ef4444';
        icon = '⚔️';
        label = 'FRENZY';
      } else if (s.type === ShrineType.AEGIS) {
        shrineColor = '#ffd166';
        icon = '🛡️';
        label = 'AEGIS';
      } else if (s.type === ShrineType.GOLD_RUSH) {
        shrineColor = '#f59e0b';
        icon = '💰';
        label = 'GOLD RUSH';
      } else if (s.type === ShrineType.ALTAR_BLOOD) {
        shrineColor = '#ef4444';
        icon = '🩸';
        label = 'ALTAR OF BLOOD';
      } else if (s.type === ShrineType.ALTAR_TEMPEST) {
        shrineColor = '#38bdf8';
        icon = '⚡';
        label = 'TEMPEST ALTAR';
      } else if (s.type === ShrineType.ALTAR_VOID) {
        shrineColor = '#c084fc';
        icon = '🌌';
        label = 'VOID ALTAR';
      }

      // Ground aura ring
      const auraPulse = 0.4 + Math.sin(time * 4) * 0.2;
      const baseRadius = isAltar ? 38 : 32;
      ctx.fillStyle = shrineColor;
      ctx.globalAlpha = auraPulse * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = shrineColor;
      ctx.lineWidth = isAltar ? 3.5 : 2.5;
      ctx.globalAlpha = auraPulse;
      ctx.beginPath();
      ctx.arc(0, 0, isAltar ? 32 : 26, 0, Math.PI * 2);
      ctx.stroke();

      if (isAltar) {
        // Outer celestial orbit ring
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 44 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Stone Pedestal
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#182030';
      ctx.beginPath();
      ctx.ellipse(0, 4, isAltar ? 22 : 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Floating Rune Stone with icon
      ctx.translate(0, -18 + bob);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = shrineColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, isAltar ? 18 : 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = isAltar ? '18px serif' : '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 1);

      // Label above shrine
      ctx.font = isAltar ? 'bold 10px "Inter", sans-serif' : 'bold 9px "Inter", sans-serif';
      ctx.fillStyle = shrineColor;
      ctx.shadowColor = shrineColor;
      ctx.shadowBlur = 8;
      ctx.fillText(label, 0, -22);

      ctx.restore();
    }

    // 1. Render Pickups
    for (const item of this.currentPickups) {
      const bob = Math.sin(time * 6 + item.id) * 3;
      ctx.save();
      ctx.translate(item.x, item.y + bob);

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 5 - bob, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vanishing blink if duration is low
      if (item.duration !== undefined && item.duration < 12.0) {
        ctx.globalAlpha = Math.sin(time * 14) > 0 ? 1.0 : 0.35;
      }

      switch (item.type) {
        case PickupType.EXP_GEM_SMALL:
        case PickupType.EXP_GEM_MEDIUM:
        case PickupType.EXP_GEM_LARGE: {
          // Gem facet
          const isLarge = item.type === PickupType.EXP_GEM_LARGE;
          const isMed = item.type === PickupType.EXP_GEM_MEDIUM;
          const gemColor = isLarge ? '#ef4444' : (isMed ? '#3b82f6' : '#10b981');
          const r = isLarge ? 8 : (isMed ? 6 : 4.5);

          // Glow aura
          ctx.fillStyle = gemColor;
          ctx.shadowColor = gemColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -r * 1.3);
          ctx.lineTo(r, 0);
          ctx.lineTo(0, r * 1.3);
          ctx.lineTo(-r, 0);
          ctx.closePath();
          ctx.fill();

          // Highlight facet
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(0, -r * 1.3);
          ctx.lineTo(r * 0.4, -r * 0.3);
          ctx.lineTo(0, 0);
          ctx.lineTo(-r * 0.4, -r * 0.3);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case PickupType.GOLD_COIN: {
          // Spinning gold coin
          const spin = Math.abs(Math.cos(time * 8 + item.id));
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#d97706';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 6 * spin, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case PickupType.HEALTH_POTION: {
          // Crimson potion vial
          ctx.fillStyle = '#dc2626';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 2, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#78350f'; // cork
          ctx.fillRect(-2, -7, 4, 3);
          break;
        }

        case PickupType.TREASURE_CHEST: {
          // Gilded Ornate Gothic Treasure Chest (Spawns every 30s in the world)
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;

          // Chest Base
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-12, -6, 24, 13);

          // Gold Trim & Iron Bands
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-12, -6, 24, 3);
          ctx.fillRect(-12, 4, 24, 3);
          ctx.fillRect(-8, -6, 3, 13);
          ctx.fillRect(5, -6, 3, 13);

          // Chest Domed Lid
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.ellipse(0, -6, 12, 6, 0, Math.PI, 0);
          ctx.fill();

          // Golden Lock Plate & Gem
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, -2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-1, -3, 2, 2);

          // Floating Sparkles
          const sparkle = Math.sin(time * 8 + item.id);
          if (sparkle > 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-8 + sparkle * 16, -14 - sparkle * 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Mini countdown ring if timed
          if (item.duration !== undefined && item.maxDuration) {
            const pct = Math.max(0, item.duration / item.maxDuration);
            ctx.strokeStyle = pct < 0.25 ? '#ef4444' : '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 11, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
            ctx.stroke();
          }
          break;
        }

        case PickupType.TOME_OF_ASCENSION: {
          // Celestial Golden Tome / Relic (Drops from Bosses for +1 Level)
          ctx.shadowColor = '#ffd166';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-9, -11, 18, 15);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-8, -10, 16, 13);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -8, 12, 9);
          // Holy cross / star insignia
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(0, -3.5, 3.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        default: {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // 2. Render Projectiles
    for (const proj of this.currentProjectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.angle);

      switch (proj.type) {
        case ProjectileType.SWORD_CLEAVE: {
          // Swordsman Greatsword Sweep Arc (Scales dynamically with proj.radius = 75 * areaMultiplier)
          const r = proj.radius || 75;
          const sweep = (Math.PI * 2) * 0.32; // ~115 deg sweep arc matching server combat hit box

          // Crescent body fill / fan sweep showing area of effect clearly
          const grad = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          grad.addColorStop(0.65, 'rgba(56, 189, 248, 0.22)');
          grad.addColorStop(0.92, 'rgba(125, 211, 252, 0.55)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.arc(0, 0, r * 0.35, sweep / 2, -sweep / 2, true);
          ctx.closePath();
          ctx.fill();

          // Outer radiant energy glow on blade edge
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 5.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.stroke();

          // Razor sharp white-hot cutting edge
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.stroke();

          // Inner steel speed line
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.75, -sweep / 2.3, sweep / 2.3);
          ctx.stroke();

          // Slash tip sparks
          ctx.fillStyle = '#ffffff';
          for (const tipAngle of [-sweep / 2, sweep / 2]) {
            const tx = Math.cos(tipAngle) * r;
            const ty = Math.sin(tipAngle) * r;
            ctx.beginPath();
            ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case ProjectileType.ARROW: {
          // Sharp Ranger Wind Arrow (High-velocity aerodynamic emerald shaft)
          ctx.save();
          // Wind streak trail behind arrow
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-36, 0);
          ctx.lineTo(-14, 0);
          ctx.stroke();

          // Arrow shaft with luminous jade glow
          ctx.strokeStyle = '#34d399';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(16, 0);
          ctx.stroke();

          // High-velocity sharp arrowhead
          ctx.fillStyle = '#ecfdf5';
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(12, -5);
          ctx.lineTo(14, 0);
          ctx.lineTo(12, 5);
          ctx.closePath();
          ctx.fill();

          // Emerald fletching feathers
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(-24, -5);
          ctx.lineTo(-20, 0);
          ctx.lineTo(-24, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }

        case ProjectileType.CHAIN_LIGHTNING: {
          // Arcing Arcane Lightning Bolt
          ctx.strokeStyle = '#c084fc';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-20, 0);
          ctx.lineTo(-10, -6);
          ctx.lineTo(0, 6);
          ctx.lineTo(15, -3);
          ctx.lineTo(25, 0);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          break;
        }

        case ProjectileType.HOLY_SMITE: {
          // Radiant Templar Hammer / Smite shockwave
          const r = proj.radius || 95;
          ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case ProjectileType.SHOCKWAVE_SLASH: {
          // Swordsman Piercing Razor Energy Blade Wave (Scales with radius)
          const r = proj.radius || 25;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, r, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(r * 0.15, 0, r * 0.8, -Math.PI * 0.35, Math.PI * 0.35);
          ctx.stroke();
          break;
        }

        case ProjectileType.WHIRLWIND_360: {
          // Swordsman 360 Whirlwind Blade Hurricane
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
          ctx.shadowColor = '#94a3b8';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius || 110, 0, Math.PI * 2);
          ctx.stroke();

          // Second inner steel spiral
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, (proj.radius || 110) * 0.65, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case ProjectileType.FROST_NOVA: {
          // Sorceress Glacial Freeze Shockwave
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 22;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius || 155, 0, Math.PI * 2);
          ctx.stroke();

          // Jagged frost spikes
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          const numSpikes = 12;
          const r = proj.radius || 155;
          ctx.beginPath();
          for (let s = 0; s < numSpikes; s++) {
            const angle = (s * Math.PI * 2) / numSpikes;
            const sx1 = Math.cos(angle) * (r - 12);
            const sy1 = Math.sin(angle) * (r - 12);
            const sx2 = Math.cos(angle) * (r + 12);
            const sy2 = Math.sin(angle) * (r + 12);
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
          }
          ctx.stroke();
          break;
        }

        case ProjectileType.HOLY_AURA_PULSE: {
          // Cleric Holy Radiance Healing Ring
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 24;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius || 220, 0, Math.PI * 2);
          ctx.stroke();

          // Golden healing crosses
          ctx.fillStyle = '#fef08a';
          const r = proj.radius || 220;
          for (let cross = 0; cross < 6; cross++) {
            const angle = (cross * Math.PI * 2) / 6;
            const cx = Math.cos(angle) * r;
            const cy = Math.sin(angle) * r;
            ctx.fillRect(cx - 2, cy - 8, 4, 16);
            ctx.fillRect(cx - 8, cy - 2, 16, 4);
          }
          break;
        }

        case ProjectileType.JUDGMENT_PILLAR: {
          // Cleric Divine Celestial Judgment Beam (Scales with radius)
          const r = proj.radius || 50;
          ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 30;
          ctx.fillRect(-r * 0.45, -260, r * 0.9, 260);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(-r * 0.18, -260, r * 0.36, 260);

          // Impact crater ring on ground
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 0.85, r * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case ProjectileType.LIGHTNING_DISCHARGE: {
          // Archer Lightning Arrow secondary discharge (Scales with radius)
          const r = proj.radius || 85;
          ctx.strokeStyle = '#67e8f9';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 2.5;

          const branches = 6;
          for (let b = 0; b < branches; b++) {
            const bAngle = (b * Math.PI * 2) / branches;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(bAngle) * (r * 0.45), Math.sin(bAngle) * (r * 0.45));
            ctx.lineTo(Math.cos(bAngle + 0.3) * r, Math.sin(bAngle + 0.3) * r);
            ctx.stroke();
          }
          break;
        }

        case ProjectileType.ENEMY_FIREBALL: {
          // Demonic Hellfire
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffedd5';
          ctx.beginPath();
          ctx.arc(2, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.ENEMY_ARROW: {
          // Ghostly Poison/Bone Arrow from Skeleton Archer
          ctx.strokeStyle = '#84cc16';
          ctx.shadowColor = '#65a30d';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(10, 0);
          ctx.stroke();

          ctx.fillStyle = '#d9f99d';
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(6, -4);
          ctx.lineTo(6, 4);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case ProjectileType.ENEMY_VOID_ORB: {
          // Abyssal Void Sphere from Void Warlock
          ctx.fillStyle = '#7c3aed';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.BLOOD_CLEAVE_WAVE: {
          // Swordsman Crimson Blood Wave
          const r = proj.radius || 35;
          ctx.strokeStyle = '#dc2626';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, r, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();

          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(r * 0.2, 0, r * 0.8, -Math.PI * 0.35, Math.PI * 0.35);
          ctx.stroke();
          break;
        }

        case ProjectileType.EXPLOSIVE_ARROW: {
          // Archer Fiery Explosive Arrow
          ctx.strokeStyle = '#ea580c';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(12, 0);
          ctx.stroke();

          // Blazing arrowhead
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(8, -5);
          ctx.lineTo(8, 5);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case ProjectileType.FROST_TRAP: {
          // Archer Ground Frostwire Trap
          const r = proj.radius || 45;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
          ctx.stroke();

          // Trap ice spikes
          ctx.fillStyle = '#7dd3fc';
          for (let s = 0; s < 4; s++) {
            const sAngle = (s * Math.PI) / 2;
            ctx.fillRect(Math.cos(sAngle) * (r * 0.65) - 3, Math.sin(sAngle) * (r * 0.65) - 3, 6, 6);
          }
          break;
        }

        case ProjectileType.METEOR_STRIKE: {
          // Sorceress Falling Astral Meteor Impact
          const r = proj.radius || 90;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.HEAVENLY_THUNDER: {
          // Cleric Celestial Holy Thunder Lightning Strike
          const r = proj.radius || 60;
          ctx.strokeStyle = '#facc15';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 24;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, -220);
          ctx.lineTo(-8, -120);
          ctx.lineTo(12, -40);
          ctx.lineTo(0, 0);
          ctx.stroke();

          ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.SANCTUM_BARRIER: {
          // Cleric Consecrated Sanctum Rune Circle
          const r = proj.radius || 120;
          ctx.fillStyle = 'rgba(253, 224, 71, 0.12)';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Holy Cross in center
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-3, -16, 6, 32);
          ctx.fillRect(-12, -8, 24, 6);
          break;
        }

        case ProjectileType.M4A1_BULLET: {
          // Commando 5.56mm Tracer Bullet Streak
          // Fiery tracer glow
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fillRect(-12, -2, 24, 4);

          // Tracer core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -1, 14, 2);

          // Red-orange heat trail behind
          ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.fillRect(-22, -1.5, 10, 3);
          break;
        }

        case ProjectileType.FRAG_GRENADE: {
          // Military Frag Grenade Detonation Blast
          const r = proj.radius || 85;
          // Outer blast shockwave
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 16;
          ctx.stroke();

          // Inner fiery core
          ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
          ctx.fill();

          // Detonation shrapnel sparks
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 6; i++) {
            const sparkAngle = (i * Math.PI) / 3;
            const sx = Math.cos(sparkAngle) * (r * 0.7);
            const sy = Math.sin(sparkAngle) * (r * 0.7);
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case ProjectileType.CAT_BELLY_SLAM: {
          // Colossal Scottish Fold Paw Slam Ground Shockwave (Scales dynamically with proj.radius)
          const r = proj.radius || 110;
          const sweep = Math.PI * 0.75;

          // Expanding frontal impact fan
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          grad.addColorStop(0, 'rgba(244, 162, 97, 0.45)');
          grad.addColorStop(0.7, 'rgba(231, 111, 81, 0.25)');
          grad.addColorStop(1, 'rgba(231, 111, 81, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();

          // Outer shockwave crust
          ctx.strokeStyle = '#f4a261';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#e76f51';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.stroke();

          // Full seismic ground tremor circle
          ctx.strokeStyle = 'rgba(244, 162, 97, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          ctx.stroke();

          // Giant cute paw print stamped in the center
          ctx.fillStyle = '#f4a261';
          ctx.font = 'bold 36px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐾', 0, 0);
          break;
        }

        case ProjectileType.CAT_HAIRBALL: {
          // Fuzzy acidic green furball
          const r = proj.radius || 14;
          ctx.fillStyle = '#84cc16';
          ctx.shadowColor = '#a3e635';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#4d7c0f';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Fur fibers
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-2, -r + 2, 4, r * 2 - 4);
          ctx.fillRect(-r + 2, -2, r * 2 - 4, 4);
          break;
        }

        case ProjectileType.CRIMSON_TEMPEST_SLASH: {
          // Mythic Evolution: Crimson Tempest 360 blood vortex
          const r = proj.radius || 140;
          ctx.fillStyle = 'rgba(185, 28, 28, 0.22)';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Swirling blood blades
          const time = Date.now() * 0.008;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#f87171';
          ctx.shadowBlur = 18;
          for (let b = 0; b < 4; b++) {
            const bAngle = time + (b * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.85, bAngle, bAngle + Math.PI * 0.35);
            ctx.stroke();
          }

          // Inner crimson core
          ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.BLIZZARD_VOLLEY_ARROW: {
          // Mythic Evolution: Crystalline diamond icicle arrow
          const len = 26;
          ctx.fillStyle = '#e0f2fe';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(len, 0);
          ctx.lineTo(-len * 0.5, -6);
          ctx.lineTo(-len * 0.3, 0);
          ctx.lineTo(-len * 0.5, 6);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Cyan frost core
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(len * 0.3, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.HELLFIRE_METEOR: {
          // Mythic Evolution: Blazing cataclysm explosion
          const r = proj.radius || 80;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          grad.addColorStop(0, '#fef08a');
          grad.addColorStop(0.3, '#f97316');
          grad.addColorStop(0.7, '#dc2626');
          grad.addColorStop(1, 'rgba(153, 27, 27, 0)');

          ctx.fillStyle = grad;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Outer flame blast ring
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case ProjectileType.CLUSTER_BOMB: {
          // Mythic Evolution: Incendiary thermite bomblet
          const r = proj.radius || 35;
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          // Spark blast ring
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case ProjectileType.TITAN_QUAKE_WAVE: {
          // Mythic Evolution: Colossal earthquake shockwave
          const r = proj.radius || 280;
          ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Radiating seismic rings
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
          ctx.stroke();

          // Giant glowing gold paw emblem
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 52px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐾', 0, 0);
          break;
        }

        case ProjectileType.REVOLVER_BULLET: {
          // Cowboy High-Velocity Lead Slug & Golden Tracer
          // Fiery tracer glow
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.fillRect(-14, -2.5, 28, 5);

          // White-hot bullet core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -1.5, 16, 3);

          // Gunpowder smoke & orange heat streak behind
          ctx.fillStyle = 'rgba(245, 158, 11, 0.65)';
          ctx.fillRect(-26, -2, 12, 4);
          ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
          ctx.fillRect(-34, -3, 10, 6);
          break;
        }

        case ProjectileType.COWBOY_LASSO: {
          // Cowboy Ensnaring Braided Rope Lasso Ring
          const r = proj.radius || 100;
          ctx.fillStyle = 'rgba(217, 119, 6, 0.15)';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Braided rope coiled loop
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
          ctx.stroke();

          // Inner loop rope spiral
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.6, 0, Math.PI * 1.6);
          ctx.stroke();

          // Lasso Knot & Barbed Hook sparks
          ctx.fillStyle = '#fbbf24';
          for (let i = 0; i < 6; i++) {
            const knotAngle = (i * Math.PI) / 3 + Date.now() * 0.005;
            const kx = Math.cos(knotAngle) * (r * 0.9);
            const ky = Math.sin(knotAngle) * (r * 0.9);
            ctx.beginPath();
            ctx.arc(kx, ky, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case ProjectileType.BEAM_SABER_SLASH: {
          // Celestial Mecha Dual Plasma Beam Sabers Cleave (Scales dynamically with proj.radius)
          const r = proj.radius || 95;
          const sweep = Math.PI * 0.85; // 150 degree sweep

          // Plasma energy field fill
          const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.22)');
          grad.addColorStop(0.95, 'rgba(34, 211, 238, 0.55)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.arc(0, 0, r * 0.3, sweep / 2, -sweep / 2, true);
          ctx.closePath();
          ctx.fill();

          // Radiant cyan plasma blade crescent
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 5.5;
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(0, 0, r, -sweep / 2, sweep / 2);
          ctx.stroke();

          // Inner white-hot laser cutting core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.96, -sweep / 2.2, sweep / 2.2);
          ctx.stroke();

          // Secondary GN particle after-slice (Magenta)
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.78, -sweep / 2.4, sweep / 2.4);
          ctx.stroke();

          // Dual Saber tips sparkles
          ctx.fillStyle = '#ffffff';
          for (const tipAngle of [-sweep / 2, sweep / 2]) {
            const tx = Math.cos(tipAngle) * r;
            const ty = Math.sin(tipAngle) * r;
            ctx.beginPath();
            ctx.arc(tx, ty, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case ProjectileType.WING_LASER_BEAM: {
          // Celestial Mecha Hyper-Velocity Plasma Laser Beam
          // Outer plasma beam bloom
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 18;
          ctx.fillRect(-20, -3.5, 40, 7);

          // White-hot hyper-laser needle core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-12, -1.5, 28, 3);

          // Plasma energy flares
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(14, -4);
          ctx.lineTo(14, 4);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case ProjectileType.GAMBLER_CARD: {
          // The Gambler Spinning Razor Tarot Card
          const spin = proj.angle + Date.now() * 0.015;
          ctx.rotate(spin);

          // Card gold border
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;
          ctx.fillRect(-8, -13, 16, 26);

          // Card face
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(-6.5, -11.5, 13, 23);

          // Mystic card suit emblem (♠ / ♦)
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 12px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♦', 0, 0);
          break;
        }

        case ProjectileType.LUCKY_DICE: {
          // The Gambler Bouncing Polyhedral Fate Die
          const tumble = Date.now() * 0.012;
          ctx.rotate(tumble);

          const size = 18;
          // Die body with gold border
          ctx.fillStyle = '#fef3c7';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 16;
          ctx.fillRect(-size / 2, -size / 2, size, size);

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.strokeRect(-size / 2, -size / 2, size, size);

          // Red dice pips
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(-4, -4, 2, 0, Math.PI * 2);
          ctx.arc(4, 4, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case ProjectileType.SLOT_COIN_RAIN: {
          // The Gambler 777 Slot Machine Jackpot & Golden Coin Fountain
          const r = proj.radius || 240;
          ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Jackpot marquee ring
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
          ctx.stroke();

          // Cascading spinning gold coins
          const time = Date.now() * 0.008;
          for (let i = 0; i < 8; i++) {
            const cAngle = (i * Math.PI) / 4 + time;
            const cx = Math.cos(cAngle) * (r * 0.65);
            const cy = Math.sin(cAngle) * (r * 0.65);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Center 777 emblem
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 36px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎰 777 🎰', 0, 0);
          break;
        }

        default: {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // 3. Render Particles (Hit Sparks)
    for (const p of this.particles) {
      const alpha = 1.0 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
