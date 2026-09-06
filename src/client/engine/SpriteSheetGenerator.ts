import { PlayerClass, MonsterType } from '../../shared/types';

export interface SpriteFrame {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface CharacterSprites {
  idle: SpriteFrame[];
  walk: SpriteFrame[];
  attack: SpriteFrame[];
  death: SpriteFrame[];
}

export class SpriteSheetGenerator {
  public playerSprites: Map<PlayerClass, CharacterSprites> = new Map();
  public monsterSprites: Map<MonsterType, CharacterSprites> = new Map();
  public slashFrames: HTMLCanvasElement[] = [];

  constructor() {
    this.generatePlayerSprites();
    this.generateMonsterSprites();
    this.generateSlashVFX();
  }

  // ==========================================
  // 1. HERO SPRITES (Dark Fantasy ARPG Style)
  // ==========================================
  private generatePlayerSprites(): void {
    const classFiles: Record<PlayerClass, string> = {
      [PlayerClass.SWORDSMAN]: 'swordsman',
      [PlayerClass.ARCHER]: 'archer',
      [PlayerClass.SORCERESS]: 'sorceress',
      [PlayerClass.CLERIC]: 'cleric',
      [PlayerClass.COMMANDO]: 'commando',
      [PlayerClass.CAT_TANK]: 'cat_tank',
      [PlayerClass.COWBOY]: 'cowboy',
      [PlayerClass.CELESTIAL_MECHA]: 'celestial_mecha',
      [PlayerClass.GAMBLER]: 'gambler'
    };

    for (const [clsKey, prefix] of Object.entries(classFiles)) {
      const cls = clsKey as PlayerClass;
      this.playerSprites.set(cls, this.loadHeroFrames(prefix));
    }
  }

  private loadHeroFrames(prefix: string): CharacterSprites {
    const createFrame = (frameIdx: number): SpriteFrame => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.src = `/sprites/${prefix}_frame_${frameIdx}.png`;
      img.onload = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 128, 128);
      };

      return { canvas, width: 128, height: 128 };
    };

    // 6 Base Frames:
    // Frame 0: Idle Vigil Guard
    // Frame 1: Walk Step 1 (Left stride)
    // Frame 2: Walk Step 2 (Right stride)
    // Frame 3: Attack Windup / Arrow draw / Spell gather / Hammer lift
    // Frame 4: Attack Strike / Arrow release / Spell burst / Smite slam
    // Frame 5: Attack Recovery / Idle 2
    const f0 = createFrame(0);
    const f1 = createFrame(1);
    const f2 = createFrame(2);
    const f3 = createFrame(3);
    const f4 = createFrame(4);
    const f5 = createFrame(5);

    // Death frame: collapsed fallen hero
    const deathCanvas = document.createElement('canvas');
    deathCanvas.width = 128;
    deathCanvas.height = 128;
    const dctx = deathCanvas.getContext('2d')!;
    const deathImg = new Image();
    deathImg.src = `/sprites/${prefix}_frame_0.png`;
    deathImg.onload = () => {
      dctx.save();
      dctx.translate(64, 96);
      dctx.rotate(Math.PI / 2);
      dctx.globalAlpha = 0.55;
      dctx.drawImage(deathImg, -64, -112, 128, 128);
      dctx.restore();
    };
    const deathFrame: SpriteFrame = { canvas: deathCanvas, width: 128, height: 128 };

    return {
      idle: [f0, f5],
      walk: [f1, f0, f2, f0], // 4-step walk cycle: Left step -> Neutral -> Right step -> Neutral
      attack: [f3, f4, f5, f0], // 4-frame attack combo: Windup -> Strike -> Recovery -> Ready
      death: [deathFrame, deathFrame]
    };
  }

  // ==========================================
  // 2. MONSTER SPRITES (Authentic Dark Fantasy)
  // ==========================================
  private generateMonsterSprites(): void {
    // 1. SKELETON: White bone, hollow skull, rusty blade, clattering stride
    this.monsterSprites.set(MonsterType.SKELETON, this.buildMonsterSprite((ctx, f) => {
      const bob = Math.abs(Math.sin((f / 4) * Math.PI * 2)) * 2;
      const legOffset = Math.sin((f / 4) * Math.PI * 2) * 4;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(32, 54, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bone Legs
      ctx.strokeStyle = '#dedede';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, 40);
      ctx.lineTo(28 - legOffset, 52);
      ctx.moveTo(36, 40);
      ctx.lineTo(36 + legOffset, 52);
      ctx.stroke();

      // Spine & Ribs
      ctx.fillStyle = '#dedede';
      ctx.fillRect(30, 24 - bob, 4, 16);
      ctx.fillRect(24, 26 - bob, 16, 2.5);
      ctx.fillRect(26, 30 - bob, 12, 2.5);
      ctx.fillRect(27, 34 - bob, 10, 2.5);

      // Skull
      ctx.beginPath();
      ctx.arc(32, 16 - bob, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Red Eye Sockets
      ctx.fillStyle = '#ff1053';
      ctx.fillRect(30, 15 - bob, 1.8, 1.8);
      ctx.fillRect(33, 15 - bob, 1.8, 1.8);

      // Rusty dagger in hand
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(40, 26 - bob, 2, 10);
      ctx.fillStyle = '#a8dadc';
      ctx.fillRect(39, 20 - bob, 4, 7);
    }));

    // 2. ZOMBIE: Mossy green decaying corpse with outstretched arms
    this.monsterSprites.set(MonsterType.ZOMBIE, this.buildMonsterSprite((ctx, f) => {
      const bob = Math.abs(Math.sin((f / 4) * Math.PI * 2)) * 1.5;
      const legOffset = Math.sin((f / 4) * Math.PI * 2) * 3;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(32, 54, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shuffling legs
      ctx.fillStyle = '#283618';
      ctx.fillRect(27, 38, 4, 14 + legOffset);
      ctx.fillRect(33, 38, 4, 14 - legOffset);

      // Rotting green torso
      ctx.fillStyle = '#4a6b52';
      ctx.fillRect(24, 22 - bob, 16, 18);

      // Torn clothes
      ctx.fillStyle = '#3a5a40';
      ctx.fillRect(23, 26 - bob, 18, 5);

      // Outstretched decaying arms
      ctx.fillStyle = '#588157';
      ctx.fillRect(16, 24 - bob, 9, 4);
      ctx.fillRect(39, 24 - bob, 9, 4);

      // Head (hunched)
      ctx.beginPath();
      ctx.arc(32, 14 - bob, 7, 0, Math.PI * 2);
      ctx.fill();

      // Yellow dead eyes
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(30, 13 - bob, 2, 2);
      ctx.fillRect(33, 13 - bob, 2, 2);
    }));

    // 3. IMP: Crimson fiend with flapping bat wings
    this.monsterSprites.set(MonsterType.IMP, this.buildMonsterSprite((ctx, f) => {
      const wingFlap = Math.sin((f / 4) * Math.PI * 2) * 8;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(32, 52, 10, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bat Wings
      ctx.fillStyle = '#6a040f';
      ctx.beginPath();
      ctx.moveTo(32, 26);
      ctx.lineTo(12, 18 + wingFlap);
      ctx.lineTo(20, 32 + wingFlap);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(32, 26);
      ctx.lineTo(52, 18 + wingFlap);
      ctx.lineTo(44, 32 + wingFlap);
      ctx.closePath();
      ctx.fill();

      // Fiery Crimson Torso
      ctx.fillStyle = '#d90429';
      ctx.beginPath();
      ctx.arc(32, 28, 7, 0, Math.PI * 2);
      ctx.fill();

      // Horned Head
      ctx.beginPath();
      ctx.arc(32, 18, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Dark horns
      ctx.fillStyle = '#2b090e';
      ctx.beginPath();
      ctx.moveTo(28, 16);
      ctx.lineTo(24, 8);
      ctx.lineTo(29, 14);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(36, 16);
      ctx.lineTo(40, 8);
      ctx.lineTo(35, 14);
      ctx.fill();

      // Glowing yellow eyes
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(30, 17, 1.5, 1.5);
      ctx.fillRect(33, 17, 1.5, 1.5);
    }));

    // 4. HELLHOUND: Quadruped dark predator with glowing jaws
    this.monsterSprites.set(MonsterType.HELLHOUND, this.buildMonsterSprite((ctx, f) => {
      const runCycle = Math.sin((f / 4) * Math.PI * 2) * 5;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(32, 52, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Muscular torso
      ctx.fillStyle = '#3a0908';
      ctx.fillRect(20, 26, 24, 12);

      // 4 running legs
      ctx.fillStyle = '#220606';
      ctx.fillRect(22 - runCycle, 36, 4, 14);
      ctx.fillRect(28 + runCycle, 36, 4, 14);
      ctx.fillRect(36 - runCycle, 36, 4, 14);
      ctx.fillRect(42 + runCycle, 36, 4, 14);

      // Fanged Predator Head
      ctx.fillStyle = '#5c100c';
      ctx.fillRect(38, 18, 14, 10);
      // Glowing fiery eyes
      ctx.fillStyle = '#ff7b00';
      ctx.fillRect(44, 20, 2.5, 2.5);
      // Teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(48, 25, 2, 2);
      ctx.fillRect(45, 25, 2, 2);
    }));

    // 5. ELITE GOLEM: Massive stone titan
    this.monsterSprites.set(MonsterType.ELITE_GOLEM, this.buildMonsterSprite((ctx, f) => {
      const bob = Math.sin((f / 4) * Math.PI * 2) * 2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(32, 56, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Massive Stone Torso
      ctx.fillStyle = '#3d344d';
      ctx.fillRect(16, 16 - bob, 32, 26);

      // Glowing Runic Core
      ctx.fillStyle = '#c77dff';
      ctx.beginPath();
      ctx.arc(32, 28 - bob, 5, 0, Math.PI * 2);
      ctx.fill();

      // Boulder Shoulders
      ctx.fillStyle = '#5a4d70';
      ctx.fillRect(10, 14 - bob, 8, 10);
      ctx.fillRect(46, 14 - bob, 8, 10);

      // Heavy Stone Fists
      ctx.fillStyle = '#2c2538';
      ctx.fillRect(8, 28 - bob, 10, 14);
      ctx.fillRect(46, 28 - bob, 10, 14);

      // Stone Legs
      ctx.fillRect(20, 42, 9, 14);
      ctx.fillRect(35, 42, 9, 14);
    }));

    // 6. LORD OF TORMENT: Colossal demon lord
    this.monsterSprites.set(MonsterType.LORD_OF_TORMENT, this.buildMonsterSprite((ctx, f) => {
      const wingSpan = Math.sin((f / 4) * Math.PI * 2) * 6;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Giant Wings
      ctx.fillStyle = '#4a0815';
      ctx.beginPath();
      ctx.moveTo(32, 20);
      ctx.lineTo(4, 4 + wingSpan);
      ctx.lineTo(16, 36);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(32, 20);
      ctx.lineTo(60, 4 + wingSpan);
      ctx.lineTo(48, 36);
      ctx.closePath();
      ctx.fill();

      // Armored Demonic Body
      ctx.fillStyle = '#800f2f';
      ctx.fillRect(18, 18, 28, 28);

      // Skull & Horns
      ctx.fillStyle = '#a4161a';
      ctx.beginPath();
      ctx.arc(32, 14, 9, 0, Math.PI * 2);
      ctx.fill();

      // Colossal Horns
      ctx.fillStyle = '#0b090a';
      ctx.beginPath();
      ctx.moveTo(25, 12);
      ctx.lineTo(14, 0);
      ctx.lineTo(26, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(39, 12);
      ctx.lineTo(50, 0);
      ctx.lineTo(38, 8);
      ctx.fill();

      // Glowing Demon Eyes
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(29, 13, 2.5, 2.5);
      ctx.fillRect(33, 13, 2.5, 2.5);
    }));

    // 7. SKELETON ARCHER (Type 6): Hooded skeleton with bone recurve bow & cyan spectral eyes
    this.monsterSprites.set(MonsterType.SKELETON_ARCHER, this.buildMonsterSprite((ctx, f) => {
      const bob = Math.abs(Math.sin((f / 4) * Math.PI * 2)) * 2;
      const legOffset = Math.sin((f / 4) * Math.PI * 2) * 4;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(32, 54, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Quiver on back (brown leather with arrow tails)
      ctx.fillStyle = '#4a3728';
      ctx.fillRect(20, 22 - bob, 5, 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(19, 17 - bob, 2, 5);
      ctx.fillRect(22, 16 - bob, 2, 6);

      // Bone Legs
      ctx.strokeStyle = '#dedede';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, 40);
      ctx.lineTo(28 - legOffset, 52);
      ctx.moveTo(36, 40);
      ctx.lineTo(36 + legOffset, 52);
      ctx.stroke();

      // Spine & Ribs
      ctx.fillStyle = '#dedede';
      ctx.fillRect(30, 24 - bob, 4, 16);
      ctx.fillRect(25, 27 - bob, 14, 2.5);
      ctx.fillRect(27, 31 - bob, 10, 2.5);
      ctx.fillRect(28, 35 - bob, 8, 2.5);

      // Skull & Tattered Archer Hood
      ctx.fillStyle = '#2b3542';
      ctx.beginPath();
      ctx.arc(32, 16 - bob, 8, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();

      // Face Bone
      ctx.fillStyle = '#dedede';
      ctx.beginPath();
      ctx.arc(32, 17 - bob, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Eerie Cyan/Teal Spectral Glowing Eyes
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 4;
      ctx.fillRect(30, 16 - bob, 1.8, 1.8);
      ctx.fillRect(33, 16 - bob, 1.8, 1.8);
      ctx.shadowBlur = 0;

      // Bone Recurve Bow in hands
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(42, 28 - bob, 12, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(42 + Math.cos(-Math.PI * 0.45) * 12, 28 - bob + Math.sin(-Math.PI * 0.45) * 12);
      ctx.lineTo(38, 28 - bob);
      ctx.lineTo(42 + Math.cos(Math.PI * 0.45) * 12, 28 - bob + Math.sin(Math.PI * 0.45) * 12);
      ctx.stroke();

      // Nocked Bone Arrow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(36, 28 - bob);
      ctx.lineTo(47, 28 - bob);
      ctx.stroke();
    }));

    // 8. MAGMA IMP (Type 7): Volcanic obsidian fiend with lava cracks & blazing wings
    this.monsterSprites.set(MonsterType.MAGMA_IMP, this.buildMonsterSprite((ctx, f) => {
      const wingFlap = Math.sin((f / 4) * Math.PI * 2) * 8;
      const bob = Math.abs(Math.sin((f / 4) * Math.PI * 2)) * 1.5;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(32, 52, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Molten Bat Wings with fiery edges
      ctx.fillStyle = '#ff5400';
      ctx.beginPath();
      ctx.moveTo(32, 26);
      ctx.lineTo(10, 16 + wingFlap);
      ctx.lineTo(18, 34 + wingFlap);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(32, 26);
      ctx.lineTo(54, 16 + wingFlap);
      ctx.lineTo(46, 34 + wingFlap);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1f0d0e';
      ctx.beginPath();
      ctx.moveTo(32, 26);
      ctx.lineTo(13, 19 + wingFlap);
      ctx.lineTo(19, 31 + wingFlap);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(32, 26);
      ctx.lineTo(51, 19 + wingFlap);
      ctx.lineTo(45, 31 + wingFlap);
      ctx.closePath();
      ctx.fill();

      // Obsidian Body with Glowing Lava Veins
      ctx.fillStyle = '#21090c';
      ctx.beginPath();
      ctx.arc(32, 28 - bob, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Lava Core Crack
      ctx.fillStyle = '#ff9e00';
      ctx.shadowColor = '#ff5400';
      ctx.shadowBlur = 6;
      ctx.fillRect(30, 26 - bob, 4, 5);
      ctx.shadowBlur = 0;

      // Horned Head
      ctx.fillStyle = '#21090c';
      ctx.beginPath();
      ctx.arc(32, 18 - bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Fiery Horns
      ctx.fillStyle = '#ff5400';
      ctx.beginPath();
      ctx.moveTo(28, 16 - bob);
      ctx.lineTo(23, 7 - bob);
      ctx.lineTo(29, 14 - bob);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(36, 16 - bob);
      ctx.lineTo(41, 7 - bob);
      ctx.lineTo(35, 14 - bob);
      ctx.fill();

      // Blazing Yellow-Orange Eyes
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(30, 17 - bob, 1.8, 1.8);
      ctx.fillRect(33, 17 - bob, 1.8, 1.8);

      // Fireball gathering in claws
      ctx.fillStyle = '#ff7b00';
      ctx.beginPath();
      ctx.arc(42, 30 - bob, 3, 0, Math.PI * 2);
      ctx.fill();
    }));

    // 9. VOID WARLOCK (Type 8): Levitating shadowy cultist with staff & swirling void orb
    this.monsterSprites.set(MonsterType.VOID_WARLOCK, this.buildMonsterSprite((ctx, f) => {
      const floatBob = Math.sin((f / 4) * Math.PI * 2) * 3;
      const orbPulse = 1.0 + Math.sin((f / 4) * Math.PI * 2) * 0.25;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(32, 54, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trailing Void Smoke beneath robe
      ctx.fillStyle = 'rgba(60, 9, 108, 0.4)';
      ctx.beginPath();
      ctx.moveTo(24, 44 - floatBob);
      ctx.lineTo(32, 52);
      ctx.lineTo(40, 44 - floatBob);
      ctx.closePath();
      ctx.fill();

      // Flowing Dark Violet Robe
      ctx.fillStyle = '#240046';
      ctx.beginPath();
      ctx.moveTo(32, 16 - floatBob);
      ctx.lineTo(21, 46 - floatBob);
      ctx.lineTo(43, 46 - floatBob);
      ctx.closePath();
      ctx.fill();

      // Cultist Hood
      ctx.fillStyle = '#3c096c';
      ctx.beginPath();
      ctx.arc(32, 18 - floatBob, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Hollow Black Face Shroud
      ctx.fillStyle = '#10002b';
      ctx.beginPath();
      ctx.arc(32, 19 - floatBob, 5, 0, Math.PI * 2);
      ctx.fill();

      // Piercing Ethereal Violet Eyes
      ctx.fillStyle = '#e0aaff';
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 5;
      ctx.fillRect(30, 18 - floatBob, 1.8, 1.8);
      ctx.fillRect(33, 18 - floatBob, 1.8, 1.8);
      ctx.shadowBlur = 0;

      // Gnarled Staff
      ctx.strokeStyle = '#10002b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(44, 48 - floatBob);
      ctx.lineTo(44, 14 - floatBob);
      ctx.stroke();

      // Swirling Void Orb on top of staff
      ctx.fillStyle = 'rgba(123, 44, 191, 0.35)';
      ctx.beginPath();
      ctx.arc(44, 11 - floatBob, 6 * orbPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9d4edd';
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(44, 11 - floatBob, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }));
  }

  private buildMonsterSprite(renderFn: (ctx: CanvasRenderingContext2D, frame: number) => void): CharacterSprites {
    const size = 64;

    const createFrame = (f: number): SpriteFrame => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      renderFn(ctx, f);
      return { canvas, width: size, height: size };
    };

    const walk = [0, 1, 2, 3].map(createFrame);
    const idle = [0, 1].map(createFrame);
    const attack = [0, 1, 2, 3].map(createFrame);

    // Death frame: shattered bones or red splatter
    const death = [0, 1].map((f) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(128, 15, 30, 0.8)';
      ctx.beginPath();
      ctx.arc(32, 40, 14 + f * 6, 0, Math.PI * 2);
      ctx.fill();
      return { canvas, width: size, height: size };
    });

    return { idle, walk, attack, death };
  }

  // ==========================================
  // 3. SLASH VFX (Crescent Blade Energy Arc - 1:1 Matched to 75 Hitbox Range)
  // ==========================================
  private generateSlashVFX(): void {
    const size = 180;
    for (let f = 0; f < 4; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const progress = f / 3;
      // Arc sweeps from -55 deg to +55 deg (matching server ~115 deg cone)
      const startAngle = -Math.PI * 0.32;
      const endAngle = startAngle + (Math.PI * 0.64) * (0.35 + progress * 0.65);

      ctx.save();
      ctx.translate(size / 2, size / 2);

      // Radiant energy glow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;

      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - progress * 0.65})`;
      ctx.lineWidth = 8 - progress * 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Reach out to exactly 72-75 units
      ctx.arc(0, 0, 70 + progress * 4, startAngle, endAngle);
      ctx.stroke();

      // Sharp white cutting edge
      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 70 + progress * 4, startAngle, endAngle);
      ctx.stroke();

      ctx.restore();
      this.slashFrames.push(canvas);
    }
  }
}
