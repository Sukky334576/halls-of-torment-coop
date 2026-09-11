import { MonsterType } from '../../shared/types';
import { MONSTER_STATS } from '../../shared/constants';
import { GridEntity } from '../engine/SpatialGrid';

export type ElementStatus = 'BLEED' | 'FROST' | 'SHOCK' | 'BURN' | 'HOLY';

export interface MonsterStatusEffect {
  type: ElementStatus;
  duration: number; // remaining seconds
  stacks: number;
}

export class ServerMonster implements GridEntity {
  public id: number;
  public type: MonsterType;
  public x: number;
  public y: number;
  public radius: number;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public damage: number;
  public expValue: number;
  public isDead: boolean = false;

  public isBoss: boolean = false;
  public bossName?: string;
  public attackTimer: number = Math.random() * 1.5; // Stagger initial attacks
  // Bosses used to have no attacks beyond the default melee chaser's contact damage — same AI
  // as a basic skeleton, just tankier. These two generic timers back whatever special moves
  // GameRoom.updateBossAbilities() gives each boss type (ground slam / void barrage / summon).
  // Staggered starts so a boss doesn't fire every ability in its first second alive.
  public bossAbilityTimer: number = Math.random() * 3;
  public bossSummonTimer: number = Math.random() * 6;
  public statusEffects: Map<ElementStatus, MonsterStatusEffect> = new Map();
  public defenseDebuff: number = 0; // e.g. 0.50 from Superconduct

  constructor(
    id: number,
    type: MonsterType,
    x: number,
    y: number,
    hpMultiplier: number = 1.0,
    damageMultiplier: number = 1.0,
    speedMultiplier: number = 1.0,
    isBoss: boolean = false,
    bossName?: string
  ) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.isBoss = isBoss;
    this.bossName = bossName;

    const baseStats = MONSTER_STATS[type];
    this.maxHp = Math.round(baseStats.maxHp * hpMultiplier);
    this.hp = this.maxHp;
    this.speed = Math.round(baseStats.speed * speedMultiplier);
    this.damage = Math.round(baseStats.damage * damageMultiplier);
    this.radius = baseStats.radius;
    this.expValue = Math.round(baseStats.expValue * (isBoss ? 5 : 1));
  }

  public isRanged(): boolean {
    return (
      this.type === MonsterType.SKELETON_ARCHER ||
      this.type === MonsterType.MAGMA_IMP ||
      this.type === MonsterType.VOID_WARLOCK
    );
  }

  public applyStatus(type: ElementStatus, duration: number, stacks: number = 1): void {
    const existing = this.statusEffects.get(type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.stacks = Math.min(5, existing.stacks + stacks);
    } else {
      this.statusEffects.set(type, { type, duration, stacks });
    }
  }

  public hasStatus(type: ElementStatus): boolean {
    const s = this.statusEffects.get(type);
    return !!(s && s.duration > 0);
  }

  public consumeStatus(type: ElementStatus): boolean {
    return this.statusEffects.delete(type);
  }

  public update(dt: number, targetX: number, targetY: number): boolean {
    if (this.isDead) return false;

    // Decay status effects
    for (const [type, effect] of this.statusEffects.entries()) {
      effect.duration -= dt;
      if (effect.duration <= 0) {
        this.statusEffects.delete(type);
      }
    }

    // Decay defense debuff
    if (this.defenseDebuff > 0) {
      this.defenseDebuff = Math.max(0, this.defenseDebuff - dt * 0.12);
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.isRanged()) {
      // Ranged Kiting Behavior: keep distance around 190 - 260
      if (dist > 260) {
        const step = this.speed * dt;
        this.x += (dx / dist) * Math.min(step, dist);
        this.y += (dy / dist) * Math.min(step, dist);
      } else if (dist < 120 && dist > 1e-6) {
        // Back off away from player (slower retreat so player can catch them). Guarded against
        // dist===0 (target sitting exactly on top of us — e.g. caller defaults target to our
        // own position when every player is dead) which would otherwise divide by zero and
        // set x/y to NaN, permanently breaking this monster's position.
        const step = this.speed * 0.5 * dt;
        this.x -= (dx / dist) * step;
        this.y -= (dy / dist) * step;
      }

      this.attackTimer += dt;
      const cooldown =
        this.type === MonsterType.SKELETON_ARCHER ? 4.5 : this.type === MonsterType.MAGMA_IMP ? 4.0 : 5.0;

      if (this.attackTimer >= cooldown && dist < 420) {
        this.attackTimer = 0;
        return true; // Fire ranged projectile!
      }
      return false;
    }

    // Default Melee Chaser
    if (dist > 5) {
      const step = this.speed * dt;
      this.x += (dx / dist) * Math.min(step, dist);
      this.y += (dy / dist) * Math.min(step, dist);
    }
    return false;
  }

  public takeDamage(amount: number): boolean {
    // Defense debuff increases damage taken (e.g. +50% from Superconduct)
    const effectiveDmg = this.defenseDebuff > 0 ? Math.round(amount * (1.0 + this.defenseDebuff)) : amount;
    this.hp -= effectiveDmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      return true; // Just died
    }
    return false;
  }

  public get hpPercent(): number {
    return Math.max(0, Math.min(100, Math.round((this.hp / this.maxHp) * 100)));
  }
}
