import { PlayerNetworkData, PlayerClass } from '../../shared/types';
import { SpriteSheetGenerator } from '../engine/SpriteSheetGenerator';

interface PlayerRenderState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  aimAngle: number;
  isMoving: boolean;
  facingRight: boolean;
  animTimer: number;
  walkFrame: number;
  // Discrete attack swing state
  lastAttackSeq: number;
  isSwinging: boolean;
  swingTimer: number;
  swingDuration: number;
  swingAngle: number;
}

export class PlayerSpriteManager {
  private spriteGen: SpriteSheetGenerator;
  private playerStates: Map<string, PlayerRenderState> = new Map();
  private serverTick: number = 0;
  private tickAccumulator: number = 0;

  constructor(spriteGen: SpriteSheetGenerator) {
    this.spriteGen = spriteGen;
  }

  public update(players: PlayerNetworkData[], localId: string, dt: number, currentServerTick?: number): void {
    if (currentServerTick !== undefined) {
      if (currentServerTick !== this.serverTick) {
        this.serverTick = currentServerTick;
        this.tickAccumulator = 0;
      } else {
        this.tickAccumulator += dt;
      }
    }

    for (const p of players) {
      let state = this.playerStates.get(p.id);
      if (!state) {
        state = {
          currentX: p.x,
          currentY: p.y,
          targetX: p.x,
          targetY: p.y,
          aimAngle: p.aimAngle,
          isMoving: false,
          facingRight: true,
          animTimer: 0,
          walkFrame: 0,
          lastAttackSeq: p.attackSeq || 0,
          isSwinging: false,
          swingTimer: 0,
          swingDuration: 0.24,
          swingAngle: p.aimAngle
        };
        this.playerStates.set(p.id, state);
      }

      state.targetX = p.x;
      state.targetY = p.y;
      state.aimAngle = p.aimAngle;

      // Detect new attack event triggered by server
      if (p.attackSeq !== undefined && p.attackSeq > state.lastAttackSeq && !p.isDead) {
        state.lastAttackSeq = p.attackSeq;
        state.isSwinging = true;
        state.swingTimer = 0;
        state.swingDuration = 0.24;
        state.swingAngle = p.aimAngle;
      }

      // Smooth position interpolation
      const dx = state.targetX - state.currentX;
      const dy = state.targetY - state.currentY;
      const dist = Math.hypot(dx, dy);

      state.isMoving = dist > 1.5;
      const lerpSpeed = Math.min(1, dt * 25);
      state.currentX += dx * lerpSpeed;
      state.currentY += dy * lerpSpeed;

      // Facing direction: based on aimAngle (-PI/2 to PI/2 is right)
      state.facingRight = Math.cos(p.aimAngle) >= 0;

      // Walk cycle animation
      state.animTimer += dt;
      if (state.isMoving) {
        if (state.animTimer > 0.12) {
          state.animTimer = 0;
          state.walkFrame = (state.walkFrame + 1) % 4;
        }
      } else {
        if (state.animTimer > 0.4) {
          state.animTimer = 0;
          state.walkFrame = (state.walkFrame + 1) % 2; // Idle breathing
        }
      }

      // Advance discrete swing animation
      if (state.isSwinging) {
        state.swingTimer += dt;
        if (state.swingTimer >= state.swingDuration) {
          state.isSwinging = false;
          state.swingTimer = 0;
        }
      }
    }

    // Clean up disconnected players
    const activeIds = new Set(players.map((p) => p.id));
    for (const id of this.playerStates.keys()) {
      if (!activeIds.has(id)) {
        this.playerStates.delete(id);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, players: PlayerNetworkData[], localId: string): void {
    for (const p of players) {
      const state = this.playerStates.get(p.id);
      if (!state) continue;

      const sprites = this.spriteGen.playerSprites.get(p.playerClass);
      if (!sprites) continue;

      const x = state.currentX;
      const y = state.currentY;

      ctx.save();
      ctx.translate(x, y);

      const nowSec = performance.now() / 1000;

      // 1. Shadow beneath hero
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Downed / Revive Beacon & Pillar of Light
      if (p.isDead) {
        // A. Colossal vertical beacon of light (reaching 480px into the sky, visible above hordes!)
        const beaconGrad = ctx.createLinearGradient(0, 0, 0, -480);
        beaconGrad.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
        beaconGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.4)');
        beaconGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.25)');
        beaconGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = beaconGrad;
        ctx.fillRect(-28, -480, 56, 480);

        // Core bright shaft
        const coreGrad = ctx.createLinearGradient(0, 0, 0, -480);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        coreGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.35)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(-8, -480, 16, 480);

        // B. Pulsing ground revive circle
        const revivePulse = 1.0 + Math.sin(nowSec * 5) * 0.2;
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 42 * revivePulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();

        // Inner golden revive ring
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Floating spirit wisp / skull above
        const bob = Math.sin(nowSec * 4) * 6;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀', 0, -68 + bob);

        // Glowing text banner
        ctx.font = 'bold 11px "Cinzel", sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillText('⚠️ ต้องการการชุบชีวิต (REVIVE ME)!', 0, -90 + bob);
        ctx.shadowBlur = 0;
      }

      // 3. Render Hero Sprite Frame
      let frameCanvas: HTMLCanvasElement;
      let swingProgress = 0;

      if (p.isDead) {
        frameCanvas = sprites.death[0]?.canvas || sprites.idle[0].canvas;
      } else if (state.isSwinging) {
        swingProgress = Math.min(0.999, state.swingTimer / state.swingDuration);
        const attackIdx = Math.min(3, Math.floor(swingProgress * 4));
        frameCanvas = sprites.attack[attackIdx]?.canvas || sprites.attack[0].canvas;
      } else if (state.isMoving) {
        frameCanvas = sprites.walk[state.walkFrame]?.canvas || sprites.walk[0].canvas;
      } else {
        frameCanvas = sprites.idle[state.walkFrame % 2]?.canvas || sprites.idle[0].canvas;
      }

      ctx.save();
      if (!state.facingRight) {
        ctx.scale(-1, 1);
      }
      ctx.imageSmoothingEnabled = false;
      if (p.isChoosingTrait) {
        // Ghosted & untargetable while picking a level-up card — the rest of the
        // party keeps fighting instead of the whole co-op session freezing for it.
        ctx.globalAlpha = 0.4 + Math.sin(nowSec * 6) * 0.1;
      }
      ctx.drawImage(frameCanvas, -36, -63, 72, 72);
      ctx.restore();

      if (p.isChoosingTrait) {
        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.85 + Math.sin(nowSec * 6) * 0.15;
        ctx.fillText('🃏', 0, -78 + Math.sin(nowSec * 3) * 3);
        ctx.restore();
      }

      // 4. Class-Specific Signature Passives VFX (Continuous Aura)
      const skills = p.skills;
      const area = p.areaMultiplier || 1.0;

      if (!p.isDead && skills) {
        // Sorceress: Arcane Orbs revolving around her (Calibrated 1:1 with Server Hitbox)
        if (skills.orbitingOrbs && skills.orbitingOrbs > 0) {
          const orbCount = skills.orbitingOrbs;
          const orbDist = 72 * area;
          const orbHitRadius = 28 * area;
          const gameTimeSec = this.serverTick > 0 ? (this.serverTick * 0.05 + this.tickAccumulator) : nowSec;
          const baseOrbAngle = (gameTimeSec * 2.8) % (Math.PI * 2);

          // 1. Faint glowing dashed orbit track ring (matching exact orbit boundary!)
          ctx.save();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(0, -20, orbDist, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // 2. Orbs revolving at exact distance matching server contact damage
          for (let i = 0; i < orbCount; i++) {
            const angle = baseOrbAngle + (i * Math.PI * 2) / orbCount;
            const ox = Math.cos(angle) * orbDist;
            const oy = Math.sin(angle) * orbDist - 20;

            ctx.save();
            // Contact damage hitbox aura (glow matches exact hit radius!)
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 16 * area;
            ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
            ctx.beginPath();
            ctx.arc(ox, oy, orbHitRadius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Orb glowing body
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(ox, oy, 8 * area, 0, Math.PI * 2);
            ctx.fill();

            // Orb hot core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ox, oy, 4 * area, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Cleric: Consecrated Holy Ground Aura (Continuous radiant sun halo under feet)
        if (skills.holyRadianceHeal) {
          const holyRadius = (95 + (skills.holyRadianceRank || 1) * 15) * area; // Reduced by 30% matching server
          ctx.save();
          // Soft golden ground sanctuary glow
          const holyGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, holyRadius);
          holyGrad.addColorStop(0, 'rgba(250, 204, 21, 0.18)');
          holyGrad.addColorStop(0.6, 'rgba(234, 179, 8, 0.08)');
          holyGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.fillStyle = holyGrad;
          ctx.beginPath();
          ctx.arc(0, 0, holyRadius, 0, Math.PI * 2);
          ctx.fill();

          // Rotating sacred solar halo ring with holy glyph ticks
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 12;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, holyRadius * 0.75, nowSec * 0.6, nowSec * 0.6 + Math.PI * 2);
          ctx.stroke();

          // Inner prayer ring
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(0, 0, 32 * area, -nowSec * 1.2, -nowSec * 1.2 + Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Swordsman: Razor Steel Whirlwind Aura (Continuous orbiting blade gleams)
        if (skills.bladeWhirlwind) {
          ctx.save();
          const steelRadius = 38 * area;
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#94a3b8';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, -18, steelRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 3 orbiting steel razor blades
          for (let b = 0; b < 3; b++) {
            const bAngle = (nowSec * 3.5) + (b * Math.PI * 2 / 3);
            const bx = Math.cos(bAngle) * steelRadius;
            const by = Math.sin(bAngle) * (steelRadius * 0.6) - 18;
            ctx.fillStyle = '#f8fafc';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(bx, by, 3.5 * area, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Cleric: Blessed Aegis holy shield
        if (skills.blessedAegis) {
          const aegisRadius = 36 * area;
          ctx.save();
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, -22, aegisRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
          ctx.fill();
          ctx.restore();
        }

        // Swordsman: Iron Retaliation spiked ring
        if (skills.ironRetaliation) {
          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 2;
          const spR1 = 28 * area;
          const spR2 = 38 * area;
          for (let spike = 0; spike < 6; spike++) {
            const spAngle = (nowSec * 0.8) + (spike * Math.PI / 3);
            const sx1 = Math.cos(spAngle) * spR1;
            const sy1 = Math.sin(spAngle) * (spR1 * 0.75) - 15;
            const sx2 = Math.cos(spAngle) * spR2;
            const sy2 = Math.sin(spAngle) * (spR2 * 0.75) - 15;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Archer: Windrunner speed trails
        if (skills.windrunner) {
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
          ctx.lineWidth = 1.5;
          const gustAngle = (nowSec * 4) % (Math.PI * 2);
          ctx.beginPath();
          ctx.ellipse(0, 0, 26 * area, 12 * area, gustAngle, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4b. Class-Specific Attack Animation (Fires only during active swing!)
      if (state.isSwinging && !p.isDead) {
        const attackProgress = Math.min(0.999, state.swingTimer / state.swingDuration);

        ctx.save();
        ctx.rotate(state.swingAngle);
        // Scale entire attack animation by areaMultiplier!
        ctx.scale(area, area);

        switch (p.playerClass) {
          case PlayerClass.SWORDSMAN: {
            // Crescent Greatsword Cleave (Scales with areaMultiplier)
            const slashIdx = Math.min(3, Math.floor(attackProgress * 4));
            const slashFrame = this.spriteGen.slashFrames[slashIdx];
            if (slashFrame) {
              ctx.drawImage(slashFrame, -90, -90, 180, 180);
            }
            break;
          }

          case PlayerClass.SORCERESS: {
            // Arcane Burst & Lightning Arc - NOT a sword slash!
            const alpha = 1.0 - attackProgress;
            ctx.globalAlpha = alpha;

            // Arcane runic ring at staff tip
            ctx.strokeStyle = '#c084fc';
            ctx.shadowColor = '#9333ea';
            ctx.shadowBlur = 16;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(32, 0, 14 * (0.8 + attackProgress * 0.5), 0, Math.PI * 2);
            ctx.stroke();

            // Crackling lightning beam surging outward
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(35, -6);
            ctx.lineTo(65, 8);
            ctx.lineTo(95, -4);
            ctx.lineTo(130, 0);
            ctx.stroke();

            // Flash glow at tip
            ctx.fillStyle = '#e879f9';
            ctx.beginPath();
            ctx.arc(130, 0, 8 * (1 - attackProgress), 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case PlayerClass.ARCHER: {
            // Bow Draw Streak & Arrow Flash
            const alpha = 1.0 - attackProgress;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#34d399';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;

            // Wind streak release line
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(75 + attackProgress * 45, 0);
            ctx.stroke();

            // Arrow release arrowhead flash
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(75 + attackProgress * 45, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case PlayerClass.CLERIC: {
            // Sacred Shockwave Flash expanding outward to full radial smite reach
            const alpha = 1.0 - attackProgress;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#fde047';
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 4;

            // Expanding golden holy shockwave
            const curR = 25 + attackProgress * 70;
            ctx.beginPath();
            ctx.arc(0, 0, curR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            break;
          }
        }
        ctx.restore();
      }

      // 5. Overhead Nameplate & Small HP Bar
      const isMe = p.id === localId;
      ctx.textAlign = 'center';

      // Name & Level
      ctx.font = isMe ? 'bold 12px "Cinzel", sans-serif' : '11px "Cinzel", sans-serif';
      ctx.fillStyle = isMe ? '#ffd166' : '#e2e8f0';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(`${p.name} (Lv.${p.level})`, 0, -66);
      ctx.shadowBlur = 0;

      // Small overhead HP Bar
      const barW = 40;
      const barH = 5;
      const hpRatio = Math.max(0, p.hp / p.maxHp);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-barW / 2, -62, barW, barH);

      ctx.fillStyle = p.isDead ? '#64748b' : (isMe ? '#22c55e' : '#38bdf8');
      ctx.fillRect(-barW / 2, -62, barW * hpRatio, barH);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, -62, barW, barH);

      ctx.restore();
    }
  }

  public getPlayerPositions(): { x: number; y: number }[] {
    const list: { x: number; y: number }[] = [];
    for (const state of this.playerStates.values()) {
      list.push({ x: state.currentX, y: state.currentY });
    }
    return list;
  }
}
