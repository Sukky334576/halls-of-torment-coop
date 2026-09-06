import { MonsterType } from '../../shared/types';
import { STAGES } from '../../shared/stages';

export interface Camera2D {
  x: number;
  y: number;
  zoom: number;
}

export interface GroundDecal {
  x: number;
  y: number;
  type: 'BONE_DUST' | 'BLOOD' | 'STONE_RUBBLE' | 'DEMONIC_ASH';
  radius: number;
  createdAt: number;
  durationMs: number; // 3000ms = 3 seconds
  rotation: number;
  debris: {
    dx: number;
    dy: number;
    size: number;
    color: string;
    shape: 'dust' | 'shard' | 'skull_chip' | 'rib' | 'droplet' | 'rubble';
    angle?: number;
  }[];
}

export class Renderer2D {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public camera: Camera2D = { x: 0, y: 0, zoom: 1.2 };

  // Screen shake
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  private shakeMagnitude: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  // Gothic floor pattern & dynamic 3-second death remains
  private floorPattern: CanvasPattern | null = null;
  private groundDecals: GroundDecal[] = [];
  private readonly WORLD_BOUNDS = 4500;

  // Torchlight flicker
  private torchFlicker: number = 1.0;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'render-canvas';
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.imageRendering = 'pixelated'; // Crisp retro pixels
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d', { alpha: false })!;

    this.createGothicFloorPattern();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  public setStage(stageId: number): void {
    this.createGothicFloorPattern(stageId);
  }

  private createGothicFloorPattern(stageId: number = 1): void {
    const stage = STAGES[stageId] || STAGES[1];
    const tileCanvas = document.createElement('canvas');
    const tileSize = 128;
    tileCanvas.width = tileSize;
    tileCanvas.height = tileSize;
    const tCtx = tileCanvas.getContext('2d')!;

    // Base dark dungeon flagstone
    tCtx.fillStyle = stage.floorColorB;
    tCtx.fillRect(0, 0, tileSize, tileSize);

    // Stone flagstone bricks with stage-specific theme
    const isStage2 = stageId === 2;
    const isStage3 = stageId === 3;

    const stones = [
      { x: 2, y: 2, w: 60, h: 38, col: isStage2 ? '#2e150f' : isStage3 ? '#1f1030' : '#1c2029', border: isStage2 ? '#481d14' : isStage3 ? '#3c1d5d' : '#292f3d' },
      { x: 66, y: 2, w: 60, h: 38, col: isStage2 ? '#24100b' : isStage3 ? '#180b26' : '#181c24', border: isStage2 ? '#3b160e' : isStage3 ? '#30154c' : '#242a36' },
      { x: 2, y: 44, w: 40, h: 40, col: isStage2 ? '#27110c' : isStage3 ? '#1a0d28' : '#161921', border: isStage2 ? '#3e1810' : isStage3 ? '#341752' : '#222733' },
      { x: 46, y: 44, w: 80, h: 40, col: isStage2 ? '#331711' : isStage3 ? '#231236' : '#1f242e', border: isStage2 ? '#522116' : isStage3 ? '#452068' : '#2c3342' },
      { x: 2, y: 88, w: 75, h: 38, col: isStage2 ? '#2b130e' : isStage3 ? '#1d0e2c' : '#1a1d26', border: isStage2 ? '#431b12' : isStage3 ? '#391a57' : '#262c38' },
      { x: 81, y: 88, w: 45, h: 38, col: isStage2 ? '#220e0a' : isStage3 ? '#160922' : '#151820', border: isStage2 ? '#36140c' : isStage3 ? '#2b1244' : '#202530' },
    ];

    for (const s of stones) {
      tCtx.fillStyle = s.col;
      tCtx.fillRect(s.x, s.y, s.w, s.h);

      // Stone highlights & borders
      tCtx.strokeStyle = s.border;
      tCtx.lineWidth = 1.5;
      tCtx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);

      // Glowing cracks in stone (Fiery Lava Orange in Stage 2, Abyssal Violet in Stage 3)
      tCtx.strokeStyle = stage.crackColor;
      tCtx.lineWidth = isStage2 || isStage3 ? 1.5 : 1;
      tCtx.beginPath();
      tCtx.moveTo(s.x + 8, s.y + 12);
      tCtx.lineTo(s.x + 18, s.y + 20);
      tCtx.lineTo(s.x + 14, s.y + 30);
      tCtx.stroke();
    }

    // Mortar channels
    tCtx.fillStyle = stage.mortarColor;
    tCtx.fillRect(0, 41, tileSize, 2);
    tCtx.fillRect(0, 85, tileSize, 2);
    tCtx.fillRect(63, 0, 2, 42);
    tCtx.fillRect(43, 42, 2, 44);
    tCtx.fillRect(78, 86, 2, 42);

    this.floorPattern = this.ctx.createPattern(tileCanvas, 'repeat');
  }

  public updateCamera(targetX: number, targetY: number, dt: number): void {
    // Smooth camera lerp
    const lerpFactor = Math.min(1, dt * 10);
    this.camera.x += (targetX - this.camera.x) * lerpFactor;
    this.camera.y += (targetY - this.camera.y) * lerpFactor;

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = this.shakeTimer / this.shakeDuration;
      const mag = this.shakeMagnitude * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * mag;
      this.shakeOffsetY = (Math.random() * 2 - 1) * mag;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Torch flicker
    this.torchFlicker = 0.96 + Math.sin(performance.now() * 0.008) * 0.03 + (Math.random() - 0.5) * 0.02;
  }

  public addScreenShake(magnitude: number, duration: number): void {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  public spawnDeathDecal(worldX: number, worldY: number, monsterType: MonsterType = MonsterType.SKELETON, isBoss: boolean = false): void {
    const now = performance.now();
    const radius = isBoss ? 26 : 13;
    const debris: GroundDecal['debris'] = [];

    let decalType: GroundDecal['type'];

    if (monsterType === MonsterType.SKELETON || monsterType === MonsterType.SKELETON_ARCHER || (monsterType as any) === 'SKELETON') {
      // 💀 SKELETON & SKELETON ARCHER: Pure Bone Dust, Calcified Ash & Skull/Bone Shards (ZERO RED BLOOD!)
      decalType = 'BONE_DUST';
      const boneColors = ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'];

      // 1. Powder cloud specks
      const dustCount = 6 + Math.floor(Math.random() * 4);
      for (let i = 0; i < dustCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius * 0.9;
        debris.push({
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          size: 1.5 + Math.random() * 2.0,
          color: boneColors[Math.floor(Math.random() * boneColors.length)],
          shape: 'dust'
        });
      }

      // 2. Bone shards & rib splinters
      const shardCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < shardCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = (0.2 + Math.random() * 0.7) * radius;
        debris.push({
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          size: 2.2 + Math.random() * 2.2,
          color: '#e2e8f0',
          shape: Math.random() < 0.35 ? 'rib' : 'shard',
          angle: Math.random() * Math.PI * 2
        });
      }

      // 3. Central shattered skull fragment
      debris.push({
        dx: (Math.random() - 0.5) * 3,
        dy: (Math.random() - 0.5) * 3,
        size: 3.8 + Math.random() * 1.2,
        color: '#f1f5f9',
        shape: 'skull_chip',
        angle: Math.random() * Math.PI * 2
      });

    } else if (monsterType === MonsterType.ELITE_GOLEM || (monsterType as any) === 'ELITE_GOLEM') {
      // 🪨 GOLEM: Crumbling basalt stone rubble & dust
      decalType = 'STONE_RUBBLE';
      const stoneColors = ['#334155', '#475569', '#1e293b', '#64748b'];
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        debris.push({
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          size: 3 + Math.random() * 4,
          color: stoneColors[Math.floor(Math.random() * stoneColors.length)],
          shape: 'rubble',
          angle: Math.random() * Math.PI * 2
        });
      }

    } else if (
      monsterType === MonsterType.IMP ||
      monsterType === MonsterType.MAGMA_IMP ||
      monsterType === MonsterType.VOID_WARLOCK ||
      monsterType === MonsterType.LORD_OF_TORMENT ||
      (monsterType as any) === 'IMP' ||
      (monsterType as any) === 'LORD_OF_TORMENT'
    ) {
      // 🔥 DEMON & WARLOCK: Brimstone ash, glowing embers and void dust
      decalType = 'DEMONIC_ASH';
      const ashColors = ['#0f0f17', '#2b1b17', '#ff5400', '#7209b7', '#3c096c'];
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        debris.push({
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          size: 2.5 + Math.random() * 3,
          color: ashColors[Math.floor(Math.random() * ashColors.length)],
          shape: 'dust'
        });
      }

    } else {
      // 🩸 ZOMBIE / HELLHOUND: Crimson Gore & Blood Splatter
      decalType = 'BLOOD';
      const bloodColors = ['#590d22', '#800f2f', '#a4161a', '#660708'];
      for (let i = 0; i < 7; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        debris.push({
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          size: 2.5 + Math.random() * 3.5,
          color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
          shape: 'droplet'
        });
      }
    }

    this.groundDecals.push({
      x: worldX,
      y: worldY,
      type: decalType,
      radius,
      createdAt: now,
      durationMs: 3000, // Exactly 3 seconds
      rotation: Math.random() * Math.PI * 2,
      debris
    });

    if (this.groundDecals.length > 250) {
      this.groundDecals.splice(0, this.groundDecals.length - 250);
    }
  }

  public stampBlood(worldX: number, worldY: number, radius: number = 10): void {
    this.spawnDeathDecal(worldX, worldY, MonsterType.ZOMBIE, radius > 20);
  }

  public beginScene(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const zoom = this.camera.zoom;

    ctx.save();
    // Fill background
    ctx.fillStyle = '#0a0d13';
    ctx.fillRect(0, 0, w, h);

    // Apply Camera transform (Center of screen + shake)
    ctx.translate(w / 2 + this.shakeOffsetX, h / 2 + this.shakeOffsetY);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    const viewLeft = this.camera.x - (w / zoom) / 2 - 200;
    const viewTop = this.camera.y - (h / zoom) / 2 - 200;
    const viewW = w / zoom + 400;
    const viewH = h / zoom + 400;

    const half = this.WORLD_BOUNDS / 2;

    // 1. Draw Flagstone Floor Pattern (strictly within arena bounds)
    const floorX = Math.max(viewLeft, -half);
    const floorY = Math.max(viewTop, -half);
    const floorR = Math.min(viewLeft + viewW, half);
    const floorB = Math.min(viewTop + viewH, half);
    const floorW = Math.max(0, floorR - floorX);
    const floorH = Math.max(0, floorB - floorY);

    if (this.floorPattern && floorW > 0 && floorH > 0) {
      ctx.save();
      ctx.fillStyle = this.floorPattern;
      ctx.fillRect(floorX, floorY, floorW, floorH);
      ctx.restore();
    }

    // 2. Render Temporary 3-Second Death Remains (Bone Dust for Skeletons, Blood for Flesh)
    const now = performance.now();
    const activeDecals: GroundDecal[] = [];

    for (const d of this.groundDecals) {
      const age = now - d.createdAt;
      if (age >= d.durationMs) {
        continue; // Expired after 3 seconds! Clean floor!
      }
      activeDecals.push(d);

      // Viewport culling
      if (d.x < viewLeft - 40 || d.x > viewLeft + viewW + 40 || d.y < viewTop - 40 || d.y > viewTop + viewH + 40) {
        continue;
      }

      // Smooth fade-out over the final 1000ms (2s - 3s)
      const alpha = age < 2000 ? 0.85 : Math.max(0, 0.85 * (1 - (age - 2000) / 1000));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(d.x, d.y);

      if (d.type === 'BONE_DUST') {
        // Soft bone dust powdery cloud on dungeon floor
        const dustGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, d.radius * 0.9);
        dustGrad.addColorStop(0, 'rgba(226, 232, 240, 0.50)');
        dustGrad.addColorStop(0.5, 'rgba(148, 163, 184, 0.22)');
        dustGrad.addColorStop(1, 'rgba(100, 116, 139, 0)');
        ctx.fillStyle = dustGrad;
        ctx.beginPath();
        ctx.arc(0, 0, d.radius * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Render bone chips, skull fragments, and dust grains
        for (const p of d.debris) {
          ctx.fillStyle = p.color;
          if (p.shape === 'skull_chip') {
            ctx.save();
            ctx.translate(p.dx, p.dy);
            ctx.rotate(p.angle || 0);
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            // Tiny eye socket dots on skull chip
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-1, -0.5, 0.8, 0, Math.PI * 2);
            ctx.arc(1.2, -0.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (p.shape === 'rib' || p.shape === 'shard') {
            ctx.save();
            ctx.translate(p.dx, p.dy);
            ctx.rotate(p.angle || 0);
            ctx.fillRect(-p.size / 2, -1, p.size, 2);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(p.dx, p.dy, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (d.type === 'STONE_RUBBLE') {
        for (const p of d.debris) {
          ctx.save();
          ctx.translate(p.dx, p.dy);
          ctx.rotate(p.angle || 0);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      } else if (d.type === 'DEMONIC_ASH') {
        const ashGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, d.radius * 0.8);
        ashGrad.addColorStop(0, 'rgba(114, 9, 183, 0.35)');
        ashGrad.addColorStop(0.6, 'rgba(255, 84, 0, 0.15)');
        ashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ashGrad;
        ctx.beginPath();
        ctx.arc(0, 0, d.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        for (const p of d.debris) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.dx, p.dy, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // BLOOD
        ctx.fillStyle = '#660708';
        ctx.beginPath();
        ctx.arc(0, 0, d.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        for (const p of d.debris) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.dx, p.dy, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
    this.groundDecals = activeDecals;

    // 3. Render Gothic Spiked Iron Palisades & Perimeter Braziers
    this.renderBoundaries(ctx, viewLeft, viewTop, viewW, viewH, half);
  }

  private renderBoundaries(ctx: CanvasRenderingContext2D, vl: number, vt: number, vw: number, vh: number, half: number): void {
    const vr = vl + vw;
    const vb = vt + vh;
    const now = performance.now();

    ctx.save();

    // Red boundary warning mist along edges
    const mistPulse = 0.15 + Math.sin(now * 0.003) * 0.08;

    // TOP BORDER (y = -half)
    if (vt <= -half + 120 && vb >= -half - 120) {
      // Warning glow
      const grad = ctx.createLinearGradient(0, -half, 0, -half + 100);
      grad.addColorStop(0, `rgba(220, 38, 38, ${mistPulse})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(vl, -half, vw, 100);

      // Stone Wall Base
      ctx.fillStyle = '#11141a';
      ctx.fillRect(vl, -half - 24, vw, 24);
      ctx.fillStyle = '#222834';
      ctx.fillRect(vl, -half - 4, vw, 4);

      // Spikes & Braziers
      const startX = Math.floor(vl / 30) * 30;
      for (let x = startX; x <= vr; x += 30) {
        if (x < -half - 30 || x > half + 30) continue;
        // Spiked Iron Fence
        ctx.fillStyle = '#374151';
        ctx.fillRect(x - 2, -half - 38, 4, 38);
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(x - 5, -half - 34);
        ctx.lineTo(x, -half - 48);
        ctx.lineTo(x + 5, -half - 34);
        ctx.closePath();
        ctx.fill();

        // Horizontal Iron Rails
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x - 15, -half - 28, 30, 4);
        ctx.fillRect(x - 15, -half - 14, 30, 4);
      }

      // Burning Skull Braziers every 150px
      const brazierStart = Math.floor(vl / 150) * 150;
      for (let bx = brazierStart; bx <= vr; bx += 150) {
        if (bx < -half || bx > half) continue;
        this.drawBrazier(ctx, bx, -half, now);
      }
    }

    // BOTTOM BORDER (y = half)
    if (vt <= half + 120 && vb >= half - 120) {
      // Warning glow
      const grad = ctx.createLinearGradient(0, half, 0, half - 100);
      grad.addColorStop(0, `rgba(220, 38, 38, ${mistPulse})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(vl, half - 100, vw, 100);

      // Stone Wall Base
      ctx.fillStyle = '#11141a';
      ctx.fillRect(vl, half, vw, 24);
      ctx.fillStyle = '#222834';
      ctx.fillRect(vl, half, vw, 4);

      // Spikes
      const startX = Math.floor(vl / 30) * 30;
      for (let x = startX; x <= vr; x += 30) {
        if (x < -half - 30 || x > half + 30) continue;
        ctx.fillStyle = '#374151';
        ctx.fillRect(x - 2, half, 4, 38);
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(x - 5, half + 34);
        ctx.lineTo(x, half + 48);
        ctx.lineTo(x + 5, half + 34);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x - 15, half + 10, 30, 4);
        ctx.fillRect(x - 15, half + 24, 30, 4);
      }

      const brazierStart = Math.floor(vl / 150) * 150;
      for (let bx = brazierStart; bx <= vr; bx += 150) {
        if (bx < -half || bx > half) continue;
        this.drawBrazier(ctx, bx, half, now);
      }
    }

    // LEFT BORDER (x = -half)
    if (vl <= -half + 120 && vr >= -half - 120) {
      const grad = ctx.createLinearGradient(-half, 0, -half + 100, 0);
      grad.addColorStop(0, `rgba(220, 38, 38, ${mistPulse})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-half, vt, 100, vh);

      ctx.fillStyle = '#11141a';
      ctx.fillRect(-half - 24, vt, 24, vh);
      ctx.fillStyle = '#222834';
      ctx.fillRect(-half - 4, vt, 4, vh);

      const startY = Math.floor(vt / 30) * 30;
      for (let y = startY; y <= vb; y += 30) {
        if (y < -half - 30 || y > half + 30) continue;
        ctx.fillStyle = '#374151';
        ctx.fillRect(-half - 38, y - 2, 38, 4);
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(-half - 34, y - 5);
        ctx.lineTo(-half - 48, y);
        ctx.lineTo(-half - 34, y + 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-half - 28, y - 15, 4, 30);
        ctx.fillRect(-half - 14, y - 15, 4, 30);
      }

      const brazierStart = Math.floor(vt / 150) * 150;
      for (let by = brazierStart; by <= vb; by += 150) {
        if (by < -half || by > half) continue;
        this.drawBrazier(ctx, -half, by, now);
      }
    }

    // RIGHT BORDER (x = half)
    if (vl <= half + 120 && vr >= half - 120) {
      const grad = ctx.createLinearGradient(half, 0, half - 100, 0);
      grad.addColorStop(0, `rgba(220, 38, 38, ${mistPulse})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(half - 100, vt, 100, vh);

      ctx.fillStyle = '#11141a';
      ctx.fillRect(half, vt, 24, vh);
      ctx.fillStyle = '#222834';
      ctx.fillRect(half, vt, 4, vh);

      const startY = Math.floor(vt / 30) * 30;
      for (let y = startY; y <= vb; y += 30) {
        if (y < -half - 30 || y > half + 30) continue;
        ctx.fillStyle = '#374151';
        ctx.fillRect(half, y - 2, 38, 4);
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(half + 34, y - 5);
        ctx.lineTo(half + 48, y);
        ctx.lineTo(half + 34, y + 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(half + 10, y - 15, 4, 30);
        ctx.fillRect(half + 24, y - 15, 4, 30);
      }

      const brazierStart = Math.floor(vt / 150) * 150;
      for (let by = brazierStart; by <= vb; by += 150) {
        if (by < -half || by > half) continue;
        this.drawBrazier(ctx, half, by, now);
      }
    }

    // Four Massive Gothic Corner Bastions
    const corners = [
      { x: -half, y: -half },
      { x: half, y: -half },
      { x: -half, y: half },
      { x: half, y: half }
    ];
    for (const c of corners) {
      if (c.x >= vl - 100 && c.x <= vr + 100 && c.y >= vt - 100 && c.y <= vb + 100) {
        // Bastion base
        ctx.fillStyle = '#0f1218';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner crest
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
        ctx.fill();

        this.drawBrazier(ctx, c.x, c.y, now, 1.4);
      }
    }

    ctx.restore();
  }

  private drawBrazier(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, scale: number = 1.0): void {
    // Pedestal
    ctx.fillStyle = '#1e232d';
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Burning Flame Core
    const flicker = 0.85 + Math.sin(now * 0.01 + x * 0.1) * 0.25;
    const flameRadius = 14 * scale * flicker;

    const grad = ctx.createRadialGradient(x, y, 2, x, y, flameRadius * 2);
    grad.addColorStop(0, 'rgba(255, 240, 150, 0.9)');
    grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.7)');
    grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, flameRadius * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  public endScene(playerPositions: { x: number; y: number }[]): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const zoom = this.camera.zoom;

    // Restore from camera world-space translation
    ctx.restore();

    // 3. Dynamic Dark Fantasy Torchlight Ambiance Pass
    // Creates high-contrast darkness with warm torchlight halo around players
    ctx.save();
    
    // Create an offscreen dark mask
    const lightGradRadius = 380 * zoom * this.torchFlicker;

    for (const player of playerPositions) {
      const screenPos = this.worldToScreen(player.x, player.y);

      // Warm radial illumination
      const grad = ctx.createRadialGradient(
        screenPos.x, screenPos.y, 40 * zoom,
        screenPos.x, screenPos.y, lightGradRadius
      );
      grad.addColorStop(0, 'rgba(255, 180, 70, 0.08)');
      grad.addColorStop(0.4, 'rgba(255, 120, 30, 0.03)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, lightGradRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark dungeon vignette overlay
    const vignette = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.35,
      w / 2, h / 2, Math.max(w, h) * 0.75
    );
    vignette.addColorStop(0, 'rgba(5, 7, 12, 0)');
    vignette.addColorStop(0.7, 'rgba(5, 7, 12, 0.45)');
    vignette.addColorStop(1, 'rgba(3, 4, 8, 0.88)');

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }

  public clientToCanvas(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (this.canvas.width / (rect.width || 1)),
      y: (clientY - rect.top) * (this.canvas.height / (rect.height || 1))
    };
  }

  public worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.camera.zoom;
    const canvasX = (wx - this.camera.x) * zoom + this.canvas.width / 2 + this.shakeOffsetX;
    const canvasY = (wy - this.camera.y) * zoom + this.canvas.height / 2 + this.shakeOffsetY;
    return {
      x: canvasX * ((rect.width || 1) / this.canvas.width) + rect.left,
      y: canvasY * ((rect.height || 1) / this.canvas.height) + rect.top
    };
  }

  public screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (clientX - rect.left) * (this.canvas.width / (rect.width || 1));
    const canvasY = (clientY - rect.top) * (this.canvas.height / (rect.height || 1));
    const zoom = this.camera.zoom;
    return {
      x: (canvasX - this.canvas.width / 2 - this.shakeOffsetX) / zoom + this.camera.x,
      y: (canvasY - this.canvas.height / 2 - this.shakeOffsetY) / zoom + this.camera.y
    };
  }
}
