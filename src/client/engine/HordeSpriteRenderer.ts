import { MonsterNetworkData, MonsterType } from '../../shared/types';
import { SpriteSheetGenerator } from './SpriteSheetGenerator';
import { Renderer2D } from './Renderer2D';

interface TrackedMonster {
  x: number;
  y: number;
  type: MonsterType;
  facingRight: boolean;
  hpPercent: number;
}

export class HordeSpriteRenderer {
  private spriteGen: SpriteSheetGenerator;
  private renderer: Renderer2D;
  private previousMonsters: Map<number, TrackedMonster> = new Map();

  constructor(spriteGen: SpriteSheetGenerator, renderer: Renderer2D) {
    this.spriteGen = spriteGen;
    this.renderer = renderer;
  }

  public render(monsters: MonsterNetworkData[], time: number): void {
    const ctx = this.renderer.ctx;
    const cam = this.renderer.camera;
    const w = this.renderer.canvas.width;
    const h = this.renderer.canvas.height;
    const zoom = cam.zoom;

    // Viewport Culling Bounds (with safety padding)
    const halfW = (w / zoom) / 2 + 100;
    const halfH = (h / zoom) / 2 + 100;
    const minX = cam.x - halfW;
    const maxX = cam.x + halfW;
    const minY = cam.y - halfH;
    const maxY = cam.y + halfH;

    const currentMap = new Map<number, MonsterNetworkData>();

    // 1. Detect Deaths to stamp blood decals
    for (const m of monsters) {
      currentMap.set(m.id, m);
    }

    for (const [id, prev] of this.previousMonsters.entries()) {
      if (!currentMap.has(id)) {
        // Monster died! Spawn 3-second death remains (bone dust for skeletons, blood for flesh, etc.)
        const isBoss = prev.hpPercent <= 10;
        this.renderer.spawnDeathDecal(prev.x, prev.y, prev.type, isBoss);
        this.previousMonsters.delete(id); // CRITICAL: Delete from tracking so it only spawns ONCE!
      }
    }

    // Sort visible monsters by Y for correct 2.5D depth ordering (occlusion)
    const visibleMonsters: MonsterNetworkData[] = [];
    for (const m of monsters) {
      if (m.x >= minX && m.x <= maxX && m.y >= minY && m.y <= maxY) {
        visibleMonsters.push(m);
      }
    }
    visibleMonsters.sort((a, b) => a.y - b.y);

    // 2. Batch Render Mobs
    for (const m of visibleMonsters) {
      let sprites = this.spriteGen.monsterSprites.get(m.type);
      if (!sprites) {
        if (m.type === MonsterType.SKELETON_ARCHER) {
          sprites = this.spriteGen.monsterSprites.get(MonsterType.SKELETON);
        } else if (m.type === MonsterType.MAGMA_IMP || m.type === MonsterType.VOID_WARLOCK) {
          sprites = this.spriteGen.monsterSprites.get(MonsterType.IMP);
        } else {
          sprites = this.spriteGen.monsterSprites.get(MonsterType.SKELETON);
        }
      }
      if (!sprites) continue;

      let prev = this.previousMonsters.get(m.id);
      let facingRight = true;
      if (prev) {
        if (Math.abs(m.x - prev.x) > 0.3) {
          facingRight = m.x >= prev.x;
        } else {
          facingRight = prev.facingRight;
        }
      }

      this.previousMonsters.set(m.id, {
        x: m.x,
        y: m.y,
        type: m.type,
        facingRight,
        hpPercent: m.hpPercent
      });

      // Walk cycle phase staggered by mob ID so the horde has organic desynchronized movement
      const walkFrame = Math.floor((time * 8 + (m.id % 4)) % 4);
      const frame = sprites.walk[walkFrame] || sprites.walk[0];

      // Boss / Elite scaling
      let scale = 1.0;
      let isBoss = !!m.isBoss;
      let isElite = false;

      if (m.type === MonsterType.LORD_OF_TORMENT) {
        scale = 2.4;
        isBoss = true;
      } else if (m.type === MonsterType.ELITE_GOLEM) {
        scale = isBoss ? 2.0 : 1.6;
        isElite = !isBoss;
      } else if (m.type === MonsterType.HELLHOUND) {
        scale = isBoss ? 1.85 : 1.15;
      } else if (isBoss) {
        scale = 1.9; // Scale any stage boss up to imposing boss size
      }

      ctx.save();
      ctx.translate(m.x, m.y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 14 * scale, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boss Aura
      if (isBoss) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fill();
      } else if (isElite) {
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sprite drawing
      ctx.scale(facingRight ? scale : -scale, scale);
      ctx.drawImage(frame.canvas, -32, -56, 64, 64);
      ctx.restore();

      // Damaged HP Bar
      if (m.hpPercent < 100) {
        ctx.save();
        ctx.translate(m.x, m.y);
        const barW = isBoss ? 60 : (isElite ? 36 : 24);
        const barH = isBoss ? 6 : 4;
        const barY = isBoss ? -90 : (isElite ? -60 : -42);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-barW / 2, barY, barW, barH);

        ctx.fillStyle = isBoss ? '#dc2626' : '#ef4444';
        ctx.fillRect(-barW / 2, barY, barW * (m.hpPercent / 100), barH);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barW / 2, barY, barW, barH);

        if (isBoss) {
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 11px "Cinzel", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('LORD OF TORMENT', 0, barY - 6);
        }
        ctx.restore();
      }
    }

    // Clean up old monsters from tracking map
    if (this.previousMonsters.size > 2000) {
      this.previousMonsters = new Map(
        Array.from(this.previousMonsters.entries()).slice(-1000)
      );
    }
  }
}
