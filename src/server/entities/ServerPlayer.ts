import { PlayerClass, PlayerStats, PlayerNetworkData, PlayerSkills, ShrineType } from '../../shared/types';
import { CLASS_DEFINITIONS, DEFAULT_PLAYER_SKILLS, CLASS_STARTER_SKILLS } from '../../shared/classes';
import { GAME_CONSTANTS } from '../../shared/constants';
import { GridEntity } from '../engine/SpatialGrid';

export class ServerPlayer implements GridEntity {
  public id: string;
  public name: string;
  public playerClass: PlayerClass;
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 18;

  public stats: PlayerStats;
  public skills: PlayerSkills;
  public aimAngle: number = 0;
  public isAttacking: boolean = false;
  public attackSeq: number = 0;
  public isDead: boolean = false;
  public isChoosingTrait: boolean = false;
  // Late joiners pick their own catch-up cards instead of inheriting a teammate's build —
  // this counts down one level-up choice at a time until they reach the party's level.
  public catchUpChoicesRemaining: number = 0;
  // A second (or third...) level-up landed from a different EXP source while a card was
  // already on screen (e.g. an EXP gem and a treasure chest both crossing a level threshold
  // in the same tick) — queued here instead of firing a second LEVEL_UP_CHOICE that would
  // silently replace the first. See GameRoom.startLevelUpChoice/handleSelectTrait.
  public pendingLevelUpChoices: number = 0;
  // Set while their connection is down but their character is kept alive for a grace
  // period in case they reconnect (see GameRoom.disconnectPlayer/reconnectPlayer).
  public isDisconnected: boolean = false;
  public gold: number = 0; // personal gold collected this run — whoever picks it up keeps it
  public reviveTimer: number = 0; // seconds teammate has stood in revive circle
  public invulnerableTimer: number = 0; // protection timer on start and level up

  // Dash mechanic (Spacebar)
  public dashCooldown: number = 0; // 3.0s cooldown
  public dashDuration: number = 0; // 0.22s burst
  public dashVx: number = 0;
  public dashVy: number = 0;

  // Active battlefield shrine buff
  public shrineBuff?: { type: ShrineType; remaining: number };

  // Timers for signature abilities
  public holyHealTimer: number = 0;
  public judgmentTimer: number = 0;
  public frostNovaTimer: number = 0;
  public whirlwindCounter: number = 0;
  public shieldBashTimer: number = 0;
  public frostTrapTimer: number = 0;
  public meteorTimer: number = 0;
  public blizzardTimer: number = 0;
  public heavenlyThunderTimer: number = 0;
  public sanctumTimer: number = 0;
  public fragGrenadeTimer: number = 0;
  public airstrikeTimer: number = 0;
  public aggroTauntTimer: number = 0;
  public hairballTimer: number = 0;
  public lassoTimer: number = 0;
  public wingLaserTimer: number = 0;
  public luckyDiceTimer: number = 0;
  public slotJackpotTimer: number = 0;
  public attackCount: number = 0;

  public inputMoveX: number = 0;
  public inputMoveY: number = 0;
  public attackCooldown: number = 0;

  public unlockedSkills: Set<string> = new Set();
  public treePassives: Record<string, number> = {};
  public acquiredTraits: string[] = [];

  // Alchemist Potions (Reroll, Banish, Lock) — start at 0 (2026-09-11): each is now gated
  // behind its own Skill Tree node (uni_alchemist_reroll/banish/lock, see skillTreeData.ts)
  // instead of being free by default. initSkillTreeUnlocks() below adds whatever the player's
  // allocated nodes (+ any Trial Quest bonus) grant.
  public potionRerolls: number = 0;
  public potionBanishes: number = 0;
  public potionLocks: number = 0;
  public banishedTraits: Set<string> = new Set();
  public lockedTraitId: string | null = null;

  constructor(id: string, name: string, playerClass: PlayerClass) {
    this.id = id;
    this.name = name;
    this.playerClass = playerClass;

    const classDef = CLASS_DEFINITIONS[playerClass] || CLASS_DEFINITIONS[PlayerClass.SWORDSMAN];
    this.playerClass = CLASS_DEFINITIONS[playerClass] ? playerClass : PlayerClass.SWORDSMAN;
    this.stats = JSON.parse(JSON.stringify(classDef.stats));
    this.skills = JSON.parse(JSON.stringify(DEFAULT_PLAYER_SKILLS));
    const starter = CLASS_STARTER_SKILLS[this.playerClass];
    if (starter) {
      Object.assign(this.skills, starter);
    }
    this.invulnerableTimer = 2.0; // 2 seconds spawn protection
  }

  public initSkillTreeUnlocks(unlockedSkills?: string[], treePassives?: Record<string, number>): void {
    if (unlockedSkills && Array.isArray(unlockedSkills)) {
      for (const id of unlockedSkills) {
        this.unlockedSkills.add(id);
      }
    }
    if (treePassives) {
      this.treePassives = treePassives;
      // Field names match PlayerStats (shared/types.ts) directly — no flatXxx/flatXxxPct
      // translation layer. Values are still contributions to scale or add into the base
      // stat, not finished values; see MetaProgression.getPassiveTiersForClass() for how
      // each one was derived (STAT_SCALE_FACTORS there matches the /100 or *N used below).
      if (treePassives.expMultiplier !== undefined) {
        this.stats.expMultiplier = 1.0 + (treePassives.expMultiplier / 100);
      }
      if (treePassives.maxHp !== undefined) {
        this.stats.maxHp += treePassives.maxHp;
        this.stats.hp = this.stats.maxHp;
      }
      if (treePassives.defense !== undefined) {
        this.stats.defense += treePassives.defense;
      }
      if (treePassives.moveSpeed !== undefined) {
        this.stats.moveSpeed *= (1.0 + treePassives.moveSpeed / 100);
      }
      if (treePassives.pickupRadius !== undefined) {
        this.stats.pickupRadius *= (1.0 + treePassives.pickupRadius / 100);
      }
      if (treePassives.damageBonus !== undefined) {
        this.stats.damageBonus += treePassives.damageBonus / 100;
      }
      if (treePassives.critChance !== undefined) {
        this.stats.critChance += treePassives.critChance / 100;
      }
      if (treePassives.attackSpeed !== undefined) {
        this.stats.attackSpeed *= (1.0 + treePassives.attackSpeed / 100);
      }
      if (treePassives.extraRerolls !== undefined) {
        this.potionRerolls += treePassives.extraRerolls;
      }
      if (treePassives.extraBanishes !== undefined) {
        this.potionBanishes += treePassives.extraBanishes;
      }
      if (treePassives.extraLocks !== undefined) {
        this.potionLocks += treePassives.extraLocks;
      }
      if (treePassives.tierLuck !== undefined) {
        this.stats.tierLuck = treePassives.tierLuck;
      }
    }
  }

  public tryDash(aimAngle?: number): boolean {
    if (this.isDead || this.dashCooldown > 0) return false;

    let nx = 0;
    let ny = 0;
    if (this.inputMoveX !== 0 || this.inputMoveY !== 0) {
      const len = Math.hypot(this.inputMoveX, this.inputMoveY);
      nx = this.inputMoveX / len;
      ny = this.inputMoveY / len;
    } else {
      const angle = aimAngle !== undefined ? aimAngle : this.aimAngle;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    }

    const dashSpeed = 680;
    this.dashVx = nx * dashSpeed;
    this.dashVy = ny * dashSpeed;
    this.dashDuration = 0.22;
    this.dashCooldown = 3.0;
    this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.22); // i-frame during dash!
    return true;
  }

  public applyShrineBuff(type: ShrineType, duration: number): void {
    if (type === ShrineType.ALTAR_BLOOD) {
      const hpCost = Math.max(1, Math.round(this.stats.hp * 0.30));
      this.stats.hp = Math.max(1, this.stats.hp - hpCost);
      this.stats.damageBonus += 0.35;
      return;
    }
    this.shrineBuff = { type, remaining: duration };
    if (type === ShrineType.AEGIS) {
      this.invulnerableTimer = Math.max(this.invulnerableTimer, duration);
    }
  }

  public update(dt: number): void {
    if (this.isDead) return;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    if (this.shrineBuff) {
      this.shrineBuff.remaining -= dt;
      if (this.shrineBuff.remaining <= 0) {
        this.shrineBuff = undefined;
      }
    }

    // Handle Dash Movement vs Normal Movement
    if (this.dashDuration > 0) {
      this.dashDuration -= dt;
      this.x += this.dashVx * dt;
      this.y += this.dashVy * dt;
    } else if (this.inputMoveX !== 0 || this.inputMoveY !== 0) {
      const len = Math.hypot(this.inputMoveX, this.inputMoveY);
      const nx = this.inputMoveX / len;
      const ny = this.inputMoveY / len;

      let speedMult = 1.0;
      if (this.shrineBuff?.type === ShrineType.SPEED) {
        speedMult = 1.25; // +25% Speed Shrine buff
      } else if (this.shrineBuff?.type === ShrineType.ALTAR_TEMPEST) {
        speedMult = 1.40; // +40% Tempest Altar buff
      }

      this.x += nx * (this.stats.moveSpeed * speedMult) * dt;
      this.y += ny * (this.stats.moveSpeed * speedMult) * dt;
    }

    // Restrict to map boundaries
    const limit = GAME_CONSTANTS.MAP_SIZE / 2;
    this.x = Math.max(-limit, Math.min(limit, this.x));
    this.y = Math.max(-limit, Math.min(limit, this.y));

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
  }

  public canAttack(): boolean {
    if (this.isDead) return false;
    return this.attackCooldown <= 0;
  }

  public resetAttackCooldown(): void {
    const classDef = CLASS_DEFINITIONS[this.playerClass];
    let atkSpeed = this.stats.attackSpeed;
    if (this.shrineBuff?.type === ShrineType.FRENZY) {
      atkSpeed *= 1.50; // Frenzy Shrine buff (+50% attack speed)
    }
    this.attackCooldown = classDef.weaponCooldown / Math.max(0.2, atkSpeed);
  }

  public heal(amount: number): number {
    if (this.isDead) return 0;
    const actual = Math.min(this.stats.maxHp - this.stats.hp, amount);
    this.stats.hp += actual;
    return actual;
  }

  public takeDamage(amount: number): boolean {
    // Ghosted while picking a level-up card so co-op doesn't have to pause for the whole team,
    // and while disconnected so nobody can farm a reconnecting player's idle body for free.
    if (this.isDead || this.invulnerableTimer > 0 || this.dashDuration > 0 || this.isChoosingTrait || this.isDisconnected) return false;

    // Archer Windrunner Evasion (Rank 1: 10%, Rank 2: 18%, Rank 3: 25%)
    if (this.skills?.windrunner) {
      const evasionChance = this.skills.windrunnerRank === 3 ? 0.25 : this.skills.windrunnerRank === 2 ? 0.18 : 0.10;
      if (Math.random() < evasionChance) {
        return false; // Evaded!
      }
    }

    // Armor & Aegis damage reduction
    let armor = Math.max(0, this.stats.defense);
    if (this.skills?.blessedAegis) armor += 3 + (this.skills.blessedAegisRank || 1) * 2;
    if (this.skills?.ironRetaliation) armor += 2 + (this.skills.ironRetaliationRank || 1) * 2;
    if (this.skills?.astralAegisRank) armor += this.skills.astralAegisRank * 2;
    if (this.skills?.chonkArmorRank) armor += this.skills.chonkArmorRank * 4;
    const damageReduction = 100 / (100 + armor * 5);
    const actualDamage = Math.max(1, Math.round(amount * damageReduction));

    this.stats.hp -= actualDamage;
    if (this.stats.hp <= 0) {
      if (this.skills?.nineLives && !this.skills.nineLivesUsed) {
        this.skills.nineLivesUsed = true;
        this.stats.hp = this.stats.maxHp;
        this.invulnerableTimer = 3.0; // 3 seconds invulnerable
        return false; // Saved by Nine Lives!
      }

      this.stats.hp = 0;
      this.isDead = true;
      this.reviveTimer = 0;
      return true; // Just died
    }
    return false;
  }

  /**
   * Damage that bypasses armor mitigation, Nine Lives, invulnerability, and dash i-frames —
   * exists specifically for HordeDirector's final-boss execute deadline (see GameRoom.tick()),
   * which must guarantee death through any survivability mechanic since the whole point is
   * forcing an unkillable match to actually end. Still respects isChoosingTrait/isDisconnected/
   * isDead exactly like takeDamage() does: those mean the player is already out of the fight
   * entirely, not a defense that an unavoidable execute should have to punch through.
   */
  public applyTrueDamage(amount: number): boolean {
    if (this.isDead || this.isChoosingTrait || this.isDisconnected) return false;

    this.stats.hp -= amount;
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.isDead = true;
      this.reviveTimer = 0;
      return true; // Just died
    }
    return false;
  }

  public revive(): void {
    this.isDead = false;
    this.stats.hp = Math.round(this.stats.maxHp * 0.5); // Revive with 50% HP
    this.reviveTimer = 0;
    this.invulnerableTimer = 2.5; // Revive protection
  }

  public addExp(amount: number): boolean {
    const mult = this.stats.expMultiplier || 1.0;
    const actualExp = Math.max(1, Math.round(amount * mult));
    this.stats.exp += actualExp;
    let leveledUp = false;

    while (this.stats.exp >= this.stats.maxExp) {
      this.stats.exp -= this.stats.maxExp;
      this.stats.level += 1;
      this.stats.maxExp = Math.round(
        GAME_CONSTANTS.EXP_BASE * Math.pow(GAME_CONSTANTS.EXP_GROWTH, this.stats.level)
      );
      leveledUp = true;
      this.invulnerableTimer = 2.5; // Level up protection
    }

    return leveledUp;
  }

  public toNetworkData(): PlayerNetworkData {
    return {
      id: this.id,
      name: this.name,
      playerClass: this.playerClass,
      x: this.x,
      y: this.y,
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      aimAngle: this.aimAngle,
      isAttacking: this.isAttacking,
      attackSeq: this.attackSeq,
      isDead: this.isDead,
      reviveProgress: this.isDead ? Math.min(1, this.reviveTimer / GAME_CONSTANTS.REVIVE_TIME_SECONDS) : undefined,
      isChoosingTrait: this.isChoosingTrait,
      level: this.stats.level,
      exp: this.stats.exp,
      maxExp: this.stats.maxExp,
      gold: this.gold,
      skills: this.skills,
      areaMultiplier: this.stats.areaMultiplier,
      isDashing: this.dashDuration > 0,
      dashCooldownRemaining: Math.max(0, this.dashCooldown),
      activeBuff: this.shrineBuff
        ? { type: this.shrineBuff.type, durationRemaining: Math.max(0, this.shrineBuff.remaining) }
        : undefined,
      stats: this.stats,
      acquiredTraits: [...this.acquiredTraits],
      potionRerolls: this.potionRerolls,
      potionBanishes: this.potionBanishes,
      potionLocks: this.potionLocks,
      lockedTraitId: this.lockedTraitId
    };
  }
}
