import {
  PlayerClass,
  PlayerStats,
  PlayerSkills,
  MonsterType,
  PickupType,
  ProjectileType,
  ShrineType,
  ShrineData,
  GameStateTick,
  DamageNumberData,
  ServerMessage,
  ClientMessage,
  TraitOption
} from '../../shared/types';
import { GAME_CONSTANTS } from '../../shared/constants';
import { TRAIT_POOL, WEAPON_EVOLUTIONS } from '../../shared/classes';
import { ServerPlayer } from '../entities/ServerPlayer';
import { ServerMonster, ElementStatus } from '../entities/ServerMonster';
import { SpatialGrid } from './SpatialGrid';
import { HordeDirector } from './HordeDirector';
import { STAGES } from '../../shared/stages';

interface Projectile {
  id: number;
  type: ProjectileType;
  ownerId?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isCrit: boolean;
  radius: number;
  lifeTime: number;
  pierceRemaining: number;
  hitEntityIds: Set<number>;
  isLightning?: boolean;
}

interface Pickup {
  id: number;
  type: PickupType;
  x: number;
  y: number;
  value: number;
  radius: number;
  duration?: number;
  maxDuration?: number;
}

export class GameRoom {
  public id: string;
  public isStarted: boolean = false;
  public isOver: boolean = false;
  public isPaused: boolean = false;

  private players: Map<string, ServerPlayer> = new Map();
  private sendCallback: (playerId: string, msg: ServerMessage) => void;

  private monsters: Map<number, ServerMonster> = new Map();
  private monsterGrid: SpatialGrid<ServerMonster> = new SpatialGrid<ServerMonster>(GAME_CONSTANTS.SPATIAL_CELL_SIZE);
  private hordeDirector: HordeDirector = new HordeDirector();
  private stageId: number = 1;

  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private shrines: ShrineData[] = [];
  private damageNumbers: DamageNumberData[] = [];

  private nextProjId: number = 1;
  private nextPickupId: number = 1;
  private nextShrineId: number = 2000;
  private nextDmgId: number = 1;

  private tickCount: number = 0;
  private totalKills: number = 0;
  private teamGold: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private worldSpawnTimer: number = 0;
  private shrineSpawnTimer: number = 15.0;

  constructor(id: string, sendCallback: (playerId: string, msg: ServerMessage) => void) {
    this.id = id;
    this.sendCallback = sendCallback;
  }

  public addPlayer(
    id: string,
    name: string,
    playerClass: PlayerClass,
    unlockedSkills?: string[],
    treePassives?: Record<string, number>
  ): void {
    const player = new ServerPlayer(id, name, playerClass);
    player.initSkillTreeUnlocks(unlockedSkills, treePassives);

    // If game has already started, spawn near an alive teammate and grant catchup stats
    if (this.isStarted && this.players.size > 0) {
      const alivePlayer = Array.from(this.players.values()).find((p) => !p.isDead);
      if (alivePlayer) {
        player.x = alivePlayer.x + (Math.random() - 0.5) * 80;
        player.y = alivePlayer.y + (Math.random() - 0.5) * 80;
        player.stats.level = alivePlayer.stats.level;
        player.stats.exp = alivePlayer.stats.exp;
        player.stats.maxExp = alivePlayer.stats.maxExp;
        player.stats.maxHp = Math.round(player.stats.maxHp * (1 + (alivePlayer.stats.level - 1) * 0.08));
        player.stats.hp = player.stats.maxHp;
      }
    } else {
      // Spawn near center with slight offset
      const angle = (this.players.size * Math.PI) / 2;
      player.x = Math.cos(angle) * 50;
      player.y = Math.sin(angle) * 50;
    }
    this.players.set(id, player);
  }

  public getStageId(): number {
    return this.stageId;
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
    if (this.players.size === 0) {
      this.stop();
    }
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public start(stageId: number = 1): void {
    this.stageId = stageId;
    this.hordeDirector.setStage(stageId);
    this.isStarted = true;
    this.teamGold = 35000; // Initial 35,000 gold gift for current players!
    for (const [id] of this.players) {
      this.sendCallback(id, { type: 'GAME_START', yourId: id, stageId });
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, GAME_CONSTANTS.SERVER_TICK_MS);
  }

  public grantBonusGold(amount: number): void {
    this.teamGold += amount;
    for (const p of this.players.values()) {
      if (!p.isDead) {
        this.broadcastDamageNumber(p.x, p.y - 40, amount, true, `🎁 +${amount.toLocaleString()} GOLD!`, '#facc15');
      }
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public handleInput(playerId: string, moveX: number, moveY: number, aimAngle: number, isAttacking: boolean): void {
    const player = this.players.get(playerId);
    if (!player || player.isDead) return;

    player.inputMoveX = moveX;
    player.inputMoveY = moveY;
    player.aimAngle = aimAngle;
    player.isAttacking = isAttacking;
  }

  public handleDash(playerId: string, aimAngle?: number): void {
    const player = this.players.get(playerId);
    if (!player || player.isDead || this.isPaused) return;
    player.tryDash(aimAngle);
  }

  public handleSelectTrait(playerId: string, traitId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const trait = TRAIT_POOL.find((t) => t.id === traitId);
    if (trait) {
      trait.apply(player.stats, player.skills);
      player.acquiredTraits.push(traitId);
    }
    if (player.lockedTraitId === traitId) {
      player.lockedTraitId = null;
    }
    player.isChoosingTrait = false;

    // Unpause if no players are currently choosing traits
    let anyChoosing = false;
    for (const p of this.players.values()) {
      if (p.isChoosingTrait) {
        anyChoosing = true;
        break;
      }
    }
    if (!anyChoosing) {
      this.isPaused = false;
    }
  }

  public handleUsePotion(playerId: string, action: 'REROLL' | 'BANISH' | 'LOCK', traitId?: string): void {
    const player = this.players.get(playerId);
    if (!player || !player.isChoosingTrait) return;

    if (action === 'REROLL') {
      if (player.potionRerolls > 0) {
        player.potionRerolls--;
        this.triggerLevelUpChoices(player);
      }
    } else if (action === 'BANISH') {
      if (player.potionBanishes > 0 && traitId) {
        player.potionBanishes--;
        player.banishedTraits.add(traitId);
        if (player.lockedTraitId === traitId) {
          player.lockedTraitId = null;
        }
        this.triggerLevelUpChoices(player);
      }
    } else if (action === 'LOCK') {
      if (traitId) {
        if (player.lockedTraitId === traitId) {
          // Toggle off
          player.lockedTraitId = null;
        } else if (player.potionLocks > 0) {
          player.potionLocks--;
          player.lockedTraitId = traitId;
        }
        this.sendCallback(player.id, {
          type: 'POTION_UPDATE',
          potionRerolls: player.potionRerolls,
          potionBanishes: player.potionBanishes,
          potionLocks: player.potionLocks,
          lockedTraitId: player.lockedTraitId
        });
      }
    }
  }

  public handlePauseGame(playerId: string, isPaused: boolean): void {
    // Only allow manual freeze pause if solo player
    if (this.players.size <= 1) {
      this.isPaused = isPaused;
    }
  }

  private applyKnockback(monster: ServerMonster, angle: number, force: number): void {
    if (monster.isBoss || monster.type === MonsterType.LORD_OF_TORMENT || monster.type === MonsterType.ELITE_GOLEM) {
      return;
    }
    monster.x += Math.cos(angle) * force;
    monster.y += Math.sin(angle) * force;
    const mapLimit = (GAME_CONSTANTS.MAP_SIZE / 2) - 80;
    monster.x = Math.max(-mapLimit, Math.min(mapLimit, monster.x));
    monster.y = Math.max(-mapLimit, Math.min(mapLimit, monster.y));
  }

  public handleSurrender(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player || this.isOver) return;

    console.log(`🏳️ Player ${player.name} (${playerId}) surrendered`);

    // If solo or last player, trigger room-wide GAME_OVER
    if (this.players.size <= 1) {
      this.isOver = true;
      this.broadcast({
        type: 'GAME_OVER',
        victory: false,
        survivalTime: Math.round(this.hordeDirector.getElapsedTime()),
        totalKills: this.totalKills,
        teamGold: this.teamGold
      });
    } else {
      // In co-op, send GAME_OVER directly to surrendering player
      this.sendCallback(playerId, {
        type: 'GAME_OVER',
        victory: false,
        survivalTime: Math.round(this.hordeDirector.getElapsedTime()),
        totalKills: this.totalKills,
        teamGold: this.teamGold
      });
      player.isDead = true;
      player.stats.hp = 0;

      let aliveCount = 0;
      for (const p of this.players.values()) {
        if (!p.isDead) aliveCount++;
      }
      if (aliveCount === 0) {
        this.isOver = true;
        this.broadcast({
          type: 'GAME_OVER',
          victory: false,
          survivalTime: Math.round(this.hordeDirector.getElapsedTime()),
          totalKills: this.totalKills,
          teamGold: this.teamGold
        });
      }
    }
  }

  private tick(): void {
    if (!this.isStarted || this.isOver) return;

    // 0. If paused (level up trait selection), keep network alive and freeze world
    if (this.isPaused) {
      this.broadcastTick();
      return;
    }

    const dt = GAME_CONSTANTS.SERVER_TICK_MS / 1000;
    this.tickCount++;
    this.damageNumbers = [];

    // 1. Update Players & Co-op Revive
    let aliveCount = 0;
    const alivePlayers: ServerPlayer[] = [];

    for (const player of this.players.values()) {
      if (!player.isDead) {
        aliveCount++;
        alivePlayers.push(player);
        player.update(dt);

        // Process Player Attack
        if (player.canAttack()) {
          this.executePlayerAttack(player);
        }
      } else {
        // Dead player: check if alive teammates are in revive circle
        let revivingTeammates = 0;
        for (const aliveP of alivePlayers) {
          const dist = Math.hypot(aliveP.x - player.x, aliveP.y - player.y);
          if (dist <= GAME_CONSTANTS.REVIVE_ZONE_RADIUS) {
            revivingTeammates++;
          }
        }

        if (revivingTeammates > 0) {
          player.reviveTimer += dt * revivingTeammates;
          if (player.reviveTimer >= GAME_CONSTANTS.REVIVE_TIME_SECONDS) {
            player.revive();
            this.broadcastDamageNumber(player.x, player.y, 100, false); // Green heal/revive indicator
          }
        } else {
          player.reviveTimer = Math.max(0, player.reviveTimer - dt * 0.5);
        }
      }
    }

    // 1b. Update Player Class Signature Passives
    this.updatePlayerClassPassives(alivePlayers, dt);

    // Check Total Party Wipe
    if (aliveCount === 0 && this.players.size > 0) {
      this.isOver = true;
      this.broadcast({
        type: 'GAME_OVER',
        victory: false,
        survivalTime: Math.round(this.hordeDirector.getElapsedTime()),
        totalKills: this.totalKills,
        teamGold: this.teamGold
      });
      return;
    }

    // 2. Horde Director: Spawn new monsters
    const newSpawns = this.hordeDirector.update(dt, this.players.size, this.monsters.size);
    const mapLimit = (GAME_CONSTANTS.MAP_SIZE / 2) - 80;
    if (alivePlayers.length > 0 && newSpawns.length > 0) {
      for (const spawn of newSpawns) {
        // Pick random alive player to spawn around
        const targetPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        let spawnAngle = Math.random() * Math.PI * 2;
        const distFromCenter = Math.hypot(targetPlayer.x, targetPlayer.y);
        // If target player is near map boundary, steer spawns inward towards center (0, 0)
        if (distFromCenter > mapLimit - 350) {
          const angleToCenter = Math.atan2(-targetPlayer.y, -targetPlayer.x);
          spawnAngle = angleToCenter + (Math.random() - 0.5) * Math.PI;
        }
        const spawnDist = 550 + Math.random() * 220;
        let x = targetPlayer.x + Math.cos(spawnAngle) * spawnDist;
        let y = targetPlayer.y + Math.sin(spawnAngle) * spawnDist;

        // Strictly clamp within playable arena so monsters never spawn in the void
        x = Math.max(-mapLimit, Math.min(mapLimit, x));
        y = Math.max(-mapLimit, Math.min(mapLimit, y));

        const coopHpScale = 1.0 + (this.players.size - 1) * GAME_CONSTANTS.COOP_HP_SCALE_PER_PLAYER;
        const monster = new ServerMonster(
          spawn.id,
          spawn.type,
          x,
          y,
          spawn.hpScale * coopHpScale,
          spawn.dmgScale,
          spawn.speedScale,
          spawn.isBoss,
          spawn.bossName
        );
        this.monsters.set(monster.id, monster);
      }
    }

    // 3. Update Monsters & Spatial Grid
    this.monsterGrid.clear();
    for (const monster of this.monsters.values()) {
      if (monster.isDead) continue;

      // Find nearest alive player (Cat Tank with aggroTaunt draws extra attention)
      let nearestDist = Infinity;
      let targetX = monster.x;
      let targetY = monster.y;

      for (const p of alivePlayers) {
        let d = Math.hypot(p.x - monster.x, p.y - monster.y);
        if (p.playerClass === PlayerClass.CAT_TANK && p.skills?.aggroTaunt) {
          d /= 2.2; // 2.2x effective magnetic pull for monsters
        }
        if (d < nearestDist) {
          nearestDist = d;
          targetX = p.x;
          targetY = p.y;
        }
      }

      const shouldShoot = monster.update(dt, targetX, targetY);
      monster.x = Math.max(-mapLimit, Math.min(mapLimit, monster.x));
      monster.y = Math.max(-mapLimit, Math.min(mapLimit, monster.y));
      this.monsterGrid.insert(monster);

      if (shouldShoot) {
        const angle = Math.atan2(targetY - monster.y, targetX - monster.x);
        let projType = ProjectileType.ENEMY_ARROW;
        let projSpeed = 195; // Nerfed from 340 px/s (now reactable and dodgeable)
        let projRadius = 5;  // Fair pinpoint hitbox
        if (monster.type === MonsterType.MAGMA_IMP) {
          projType = ProjectileType.ENEMY_FIREBALL;
          projSpeed = 175; // Nerfed from 300 px/s
          projRadius = 7;
        } else if (monster.type === MonsterType.VOID_WARLOCK) {
          projType = ProjectileType.ENEMY_VOID_ORB;
          projSpeed = 140; // Nerfed from 250 px/s
          projRadius = 8;
        }

        this.projectiles.push({
          id: ++this.nextProjId,
          type: projType,
          x: monster.x,
          y: monster.y,
          vx: Math.cos(angle) * projSpeed,
          vy: Math.sin(angle) * projSpeed,
          damage: monster.damage,
          isCrit: false,
          radius: projRadius,
          lifeTime: 1.8,
          pierceRemaining: 1,
          hitEntityIds: new Set()
        });
      }

      // Check damage to nearest player
      if (nearestDist < monster.radius + 20) {
        const player = alivePlayers.find((p) => Math.hypot(p.x - monster.x, p.y - monster.y) === nearestDist);
        if (player) {
          player.takeDamage(monster.damage * dt * 2); // Contact damage tick
          if (player.skills?.ironRetaliation) {
            this.damageMonster(monster, Math.max(2, Math.round(player.stats.flatDamage * 0.35)), false);
          }
          if (player.skills?.aegisOfBastion) {
            // Reflect 200% damage back to all surrounding monsters
            const refDmg = Math.max(8, Math.round(monster.damage * dt * 4));
            const nearby = this.monsterGrid.queryRadius(player.x, player.y, 140 * (player.stats.areaMultiplier || 1.0));
            for (const nb of nearby) {
              this.damageMonster(nb, refDmg, false);
            }
          }
        }
      }
    }

    // 4. Update Projectiles
    this.updateProjectiles(dt);

    // 5. Update Pickups & Shared EXP collection
    this.updatePickups(alivePlayers, dt);

    // 5.5. Dynamic Timed World Spawns (Treasure Chests every 30s)
    this.updateTimedWorldSpawns(dt);

    // 5.6. Battlefield Shrines
    this.updateShrines(alivePlayers, dt);

    // 6. Broadcast Game State Tick
    this.broadcastTick();
  }

  private updatePlayerClassPassives(alivePlayers: ServerPlayer[], dt: number): void {
    for (const player of alivePlayers) {
      // Pantheon Altar: Tempest Storm Discharge
      if (player.shrineBuff?.type === ShrineType.ALTAR_TEMPEST && this.tickCount % 8 === 0) {
        const stormMobs = this.monsterGrid.queryRadius(player.x, player.y, 220);
        if (stormMobs.length > 0) {
          const target = stormMobs[Math.floor(Math.random() * stormMobs.length)];
          const tempestDmg = Math.max(14, Math.round(player.stats.flatDamage * 0.85 * player.stats.damageBonus));
          this.damageMonster(target, tempestDmg, true, 'SHOCK');
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.CHAIN_LIGHTNING,
            x: player.x,
            y: player.y,
            vx: target.x,
            vy: target.y,
            damage: 0,
            isCrit: true,
            radius: 24,
            lifeTime: 0.22,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }

      const skills = player.skills;
      if (!skills) continue;

      // 0a. Mythic Evolution: Crimson Tempest (Continuous 360° blood cyclone with lifesteal)
      if (skills.crimsonTempest && this.tickCount % 6 === 0) {
        const cycloneRadius = 140 * player.stats.areaMultiplier;
        const hitMobs = this.monsterGrid.queryRadius(player.x, player.y, cycloneRadius);
        if (hitMobs.length > 0) {
          const cycloneDmg = Math.max(8, Math.round(player.stats.flatDamage * 0.9 * player.stats.damageBonus));
          let healed = 0;
          for (const m of hitMobs) {
            this.damageMonster(m, cycloneDmg, false, 'BLEED');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, 16);
            healed += Math.max(1, Math.round(player.stats.maxHp * 0.03));
          }
          const cappedHeal = Math.min(15, healed);
          player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + cappedHeal);

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.CRIMSON_TEMPEST_SLASH,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: true,
            radius: cycloneRadius,
            lifeTime: 0.20,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }

      // 0b. Mythic Evolution: Absolute Zero Sphere (Hypersonic cryogenic blizzard ring)
      if (skills.absoluteZeroSphere && this.tickCount % 6 === 0) {
        const azRadius = 155 * player.stats.areaMultiplier;
        const chilledMobs = this.monsterGrid.queryRadius(player.x, player.y, azRadius);
        const coldDmg = Math.max(10, Math.round(player.stats.flatDamage * 0.65));
        for (const m of chilledMobs) {
          this.damageMonster(m, coldDmg, false, 'FROST');
          m.speed = 0; // Freeze solid
        }
      }

      // 1. Sorceress Orbiting Orbs contact damage (Calibrated 1:1 with Client Visuals & Responsive Per-Mob CD)
      if (skills.orbitingOrbs && skills.orbitingOrbs > 0) {
        const orbCount = skills.orbitingOrbs;
        const area = player.stats.areaMultiplier || 1.0;
        const orbDist = 72 * area;
        const orbHitRadius = 30 * area;
        const timeSec = (this.tickCount * GAME_CONSTANTS.SERVER_TICK_MS) / 1000;
        const baseAngle = (timeSec * 2.8) % (Math.PI * 2);

        for (let i = 0; i < orbCount; i++) {
          const angle = baseAngle + (i * Math.PI * 2) / orbCount;
          const orbX = player.x + Math.cos(angle) * orbDist;
          const orbY = (player.y - 20) + Math.sin(angle) * orbDist; // -20 offset matches client torso rendering

          const nearby = this.monsterGrid.queryRadius(orbX, orbY, orbHitRadius);
          for (const m of nearby) {
            const lastHit = (m as any)._lastOrbHitTick || 0;
            // Every 5 ticks (0.25s) per monster upon physical contact
            if (this.tickCount - lastHit >= 5) {
              (m as any)._lastOrbHitTick = this.tickCount;
              const orbDmg = Math.max(18, Math.round(player.stats.flatDamage * 0.75));
              this.damageMonster(m, orbDmg, false, 'FROST', '❄️ FROST ORB', '#38bdf8');
              const pushAngle = Math.atan2(m.y - orbY, m.x - orbX);
              this.applyKnockback(m, pushAngle, 22);
            }
          }
        }
      }

      // 2. Sorceress Frost Nova (Rank 1: 6.5s cd, 1.0s freeze -> Rank 3: 4.5s cd, 1.8s freeze + wider blast)
      if (skills.frostNova) {
        player.frostNovaTimer = (player.frostNovaTimer || 0) + dt;
        const rank = skills.frostNovaRank || 1;
        const cooldown = Math.max(4.5, 7.5 - rank);
        if (player.frostNovaTimer >= cooldown) {
          player.frostNovaTimer = 0;
          const novaRadius = (135 + rank * 20) * player.stats.areaMultiplier;
          const frozenMobs = this.monsterGrid.queryRadius(player.x, player.y, novaRadius);
          const novaDmg = Math.max(12, Math.round(player.stats.flatDamage * (0.65 + rank * 0.2)));
          const slowFactor = Math.max(0.25, 0.70 - rank * 0.15);

          for (const m of frozenMobs) {
            this.damageMonster(m, novaDmg, false, 'FROST');
            m.speed = Math.max(15, m.speed * slowFactor);
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.FROST_NOVA,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: false,
            radius: novaRadius,
            lifeTime: 0.35,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }

      // 3. Cleric Holy Radiance: Consecrated Ground Burn (Every 0.5s) + Radiant Pulse Heal & Smite (Every 6.0s)
      if (skills.holyRadianceHeal) {
        const rank = skills.holyRadianceRank || 1;
        const holyRadius = (95 + rank * 15) * player.stats.areaMultiplier; // Reduced by 30%

        // A. Continuous Consecrated Ground Burn (every 10 ticks = 0.5s)
        if (this.tickCount % 10 === 0) {
          const surrounding = this.monsterGrid.queryRadius(player.x, player.y, holyRadius);
          const burnDmg = Math.max(5, Math.round(player.stats.flatDamage * (0.28 + rank * 0.08)));
          for (const m of surrounding) {
            this.damageMonster(m, burnDmg, false, 'HOLY');
          }
        }

        // B. Periodic Radiant Pulse: Heals nearby allies AND blasts surrounding monsters with Holy Smite
        player.holyHealTimer = (player.holyHealTimer || 0) + dt;
        if (player.holyHealTimer >= 6.0) {
          player.holyHealTimer = 0;
          const healAmount = 12 + rank * 5;
          for (const ally of alivePlayers) {
            if (Math.hypot(ally.x - player.x, ally.y - player.y) <= holyRadius) {
              ally.stats.hp = Math.min(ally.stats.maxHp, ally.stats.hp + healAmount);
              this.broadcastDamageNumber(ally.x, ally.y - 15, healAmount, false, '💚 HOLY HEAL', '#4ade80');
            }
          }

          // Smite and knock back all monsters caught in the holy pulse
          const smiteMobs = this.monsterGrid.queryRadius(player.x, player.y, holyRadius);
          const pulseDmg = Math.round(player.stats.flatDamage * (1.2 + rank * 0.3));
          for (const m of smiteMobs) {
            this.damageMonster(m, pulseDmg, true, 'HOLY');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, 40);
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.HOLY_AURA_PULSE,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: true,
            radius: holyRadius,
            lifeTime: 0.45,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }

      // 4. Cleric Divine Judgment Pillars (Rank 1: 1 pillar -> Rank 3: 3 pillars every 4.2s)
      if (skills.judgmentPillars) {
        player.judgmentTimer = (player.judgmentTimer || 0) + dt;
        if (player.judgmentTimer >= 4.2) {
          player.judgmentTimer = 0;
          const searchRange = 260 * player.stats.areaMultiplier;
          const candidates = this.monsterGrid.queryRadius(player.x, player.y, searchRange);
          if (candidates.length > 0) {
            const pillarCount = Math.min(candidates.length, skills.judgmentPillarsRank || 1);
            const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random());

            for (let pIdx = 0; pIdx < pillarCount; pIdx++) {
              const targetMob = shuffledCandidates[pIdx];
              const pillarDmg = Math.round(player.stats.flatDamage * 2.2);
              this.damageMonster(targetMob, pillarDmg, true, 'HOLY');

              this.projectiles.push({
                id: ++this.nextProjId,
                type: ProjectileType.JUDGMENT_PILLAR,
                x: targetMob.x,
                y: targetMob.y,
                vx: 0,
                vy: 0,
                damage: 0,
                isCrit: true,
                radius: 50 * player.stats.areaMultiplier,
                lifeTime: 0.4,
                pierceRemaining: 0,
                hitEntityIds: new Set()
              });
            }
          }
        }
      }

      // 5. Swordsman Shield Bash (Every 7.0s: charges forward with a 180° frontal stun wave)
      if (skills.shieldBash) {
        player.shieldBashTimer = (player.shieldBashTimer || 0) + dt;
        const rank = skills.shieldBashRank || 1;
        const cooldown = Math.max(4.5, 7.5 - rank * 0.8);
        if (player.shieldBashTimer >= cooldown) {
          player.shieldBashTimer = 0;
          const bashRadius = 95 * player.stats.areaMultiplier;
          const arc = Math.PI; // 180 degrees frontal arc
          const mobs = this.monsterGrid.queryRadius(player.x, player.y, bashRadius);
          for (const m of mobs) {
            const angleToMob = Math.atan2(m.y - player.y, m.x - player.x);
            let diff = Math.abs(angleToMob - player.aimAngle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
            if (diff <= arc / 2) {
              const bashDmg = Math.round(player.stats.flatDamage * 1.5);
              this.damageMonster(m, bashDmg, true, 'PHYSICAL');
              m.speed = Math.max(10, m.speed * 0.15); // Stun / slow
              const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
              this.applyKnockback(m, kbAngle, 55);
            }
          }
        }
      }

      // 6. Archer Frostwire Trap (Every 6.0s drops a tactical freeze trap)
      if (skills.frostTrap) {
        player.frostTrapTimer = (player.frostTrapTimer || 0) + dt;
        const rank = skills.frostTrapRank || 1;
        const cooldown = Math.max(3.8, 6.5 - rank * 0.8);
        if (player.frostTrapTimer >= cooldown) {
          player.frostTrapTimer = 0;
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.FROST_TRAP,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: Math.round(player.stats.flatDamage * (0.8 + rank * 0.3)),
            isCrit: false,
            radius: 45 * player.stats.areaMultiplier,
            lifeTime: 8.0,
            pierceRemaining: 1,
            hitEntityIds: new Set()
          });
        }
      }

      // 7. Sorceress Astral Meteor Strike (Every 5.5s crashes down on densest monster cluster)
      if (skills.meteorStrike) {
        player.meteorTimer = (player.meteorTimer || 0) + dt;
        const rank = skills.meteorStrikeRank || 1;
        const cooldown = Math.max(3.5, 6.0 - rank * 0.7);
        if (player.meteorTimer >= cooldown) {
          player.meteorTimer = 0;
          const candidates = this.monsterGrid.queryRadius(player.x, player.y, 350 * player.stats.areaMultiplier);
          if (candidates.length > 0) {
            let bestTarget = candidates[0];
            let maxNeighbors = 0;
            for (const c of candidates) {
              const count = this.monsterGrid.queryRadius(c.x, c.y, 80).length;
              if (count > maxNeighbors) {
                maxNeighbors = count;
                bestTarget = c;
              }
            }
            const blastRadius = 90 * player.stats.areaMultiplier;
            const blastMobs = this.monsterGrid.queryRadius(bestTarget.x, bestTarget.y, blastRadius);
            const meteorDmg = Math.round(player.stats.flatDamage * (1.8 + rank * 0.4));
            for (const m of blastMobs) {
              this.damageMonster(m, meteorDmg, true, 'FIRE');
            }
            this.projectiles.push({
              id: ++this.nextProjId,
              type: ProjectileType.METEOR_STRIKE,
              x: bestTarget.x,
              y: bestTarget.y,
              vx: 0,
              vy: 0,
              damage: 0,
              isCrit: true,
              radius: blastRadius,
              lifeTime: 0.45,
              pierceRemaining: 0,
              hitEntityIds: new Set()
            });
          }
        }
      }

      // 8. Sorceress Glacial Blizzard Ring (Continuous swirling blizzard slowing and chilling nearby monsters)
      if (skills.blizzardRing && this.tickCount % 8 === 0) {
        const ringRadius = 130 * player.stats.areaMultiplier;
        const chilledMobs = this.monsterGrid.queryRadius(player.x, player.y, ringRadius);
        const coldDmg = Math.max(4, Math.round(player.stats.flatDamage * 0.25));
        for (const m of chilledMobs) {
          this.damageMonster(m, coldDmg, false, 'FROST');
          m.speed = Math.max(20, m.speed * 0.70); // 30% slow
        }
      }

      // 9. Cleric Heavenly Thunder Smite (Every 4.0s calls down celestial lightning on highest HP mob)
      if (skills.heavenlyThunder) {
        player.heavenlyThunderTimer = (player.heavenlyThunderTimer || 0) + dt;
        const rank = skills.heavenlyThunderRank || 1;
        const cooldown = Math.max(2.5, 4.5 - rank * 0.6);
        if (player.heavenlyThunderTimer >= cooldown) {
          player.heavenlyThunderTimer = 0;
          const candidates = this.monsterGrid.queryRadius(player.x, player.y, 320 * player.stats.areaMultiplier);
          if (candidates.length > 0) {
            candidates.sort((a, b) => b.hp - a.hp);
            const primary = candidates[0];
            const thunderDmg = Math.round(player.stats.flatDamage * (2.2 + rank * 0.5));
            this.damageMonster(primary, thunderDmg, true, 'SHOCK');

            // Chain to 2 closest neighbors
            const neighbors = this.monsterGrid.queryRadius(primary.x, primary.y, 110)
              .filter(m => m.id !== primary.id)
              .slice(0, 2);
            for (const n of neighbors) {
              this.damageMonster(n, Math.round(thunderDmg * 0.6), false, 'SHOCK');
            }

            this.projectiles.push({
              id: ++this.nextProjId,
              type: ProjectileType.HEAVENLY_THUNDER,
              x: primary.x,
              y: primary.y,
              vx: 0,
              vy: 0,
              damage: 0,
              isCrit: true,
              radius: 60 * player.stats.areaMultiplier,
              lifeTime: 0.35,
              pierceRemaining: 0,
              hitEntityIds: new Set()
            });
          }
        }
      }

      // 10. Cleric Sanctum Barrier (Every 9.0s consecrates holy sanctuary ward)
      if (skills.sanctumBarrier) {
        player.sanctumTimer = (player.sanctumTimer || 0) + dt;
        const rank = skills.sanctumBarrierRank || 1;
        const cooldown = Math.max(6.0, 9.5 - rank * 1.0);
        if (player.sanctumTimer >= cooldown) {
          player.sanctumTimer = 0;
          const sanctumRadius = 120 * player.stats.areaMultiplier;
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.SANCTUM_BARRIER,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: Math.round(18 * (1 + rank * 0.3)),
            isCrit: false,
            radius: sanctumRadius,
            lifeTime: 5.0,
            pierceRemaining: 999,
            hitEntityIds: new Set()
          });
        }
      }

      // 11. Commando Frag Grenade (Every 4.5s throws an explosive shrapnel canister)
      if (skills.fragGrenade) {
        player.fragGrenadeTimer = (player.fragGrenadeTimer || 0) + dt;
        const rank = skills.fragGrenadeRank || 1;
        const cooldown = Math.max(2.8, 5.0 - rank * 0.7);
        if (player.fragGrenadeTimer >= cooldown) {
          player.fragGrenadeTimer = 0;
          const throwDist = 160;
          const targetX = player.x + Math.cos(player.aimAngle) * throwDist;
          const targetY = player.y + Math.sin(player.aimAngle) * throwDist;
          const blastRadius = (85 + rank * 15) * player.stats.areaMultiplier;
          const blastMobs = this.monsterGrid.queryRadius(targetX, targetY, blastRadius);
          const grenadeDmg = Math.round(player.stats.flatDamage * (2.2 + rank * 0.6));

          for (const m of blastMobs) {
            this.damageMonster(m, grenadeDmg, true, 'FIRE');
            const kb = Math.atan2(m.y - targetY, m.x - targetX);
            this.applyKnockback(m, kb, 35);
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.FRAG_GRENADE,
            x: targetX,
            y: targetY,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: true,
            radius: blastRadius,
            lifeTime: 0.40,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });

          // Mythic Evolution: Cluster Thermite Mortar (5 secondary bomblets)
          if (skills.clusterThermite) {
            for (let c = 0; c < 5; c++) {
              const cAngle = (c / 5) * Math.PI * 2;
              const cSpeed = 220;
              this.projectiles.push({
                id: ++this.nextProjId,
                type: ProjectileType.CLUSTER_BOMB,
                ownerId: player.id,
                x: targetX,
                y: targetY,
                vx: Math.cos(cAngle) * cSpeed,
                vy: Math.sin(cAngle) * cSpeed,
                damage: Math.round(grenadeDmg * 0.6),
                isCrit: true,
                radius: 45 * player.stats.areaMultiplier,
                lifeTime: 0.35,
                pierceRemaining: 1,
                hitEntityIds: new Set()
              });
            }
          }
        }
      }

      // 12. Commando Airstrike Drone Bombardment (Every 8.0s tactical drone drops missiles)
      if (skills.airstrikeDrone) {
        player.airstrikeTimer = (player.airstrikeTimer || 0) + dt;
        const rank = skills.airstrikeDroneRank || 1;
        const cooldown = Math.max(5.0, 9.0 - rank * 1.0);
        if (player.airstrikeTimer >= cooldown) {
          player.airstrikeTimer = 0;
          const targets = this.monsterGrid.queryRadius(player.x, player.y, 350 * player.stats.areaMultiplier);
          if (targets.length > 0) {
            const count = Math.min(targets.length, 2 + rank);
            const shuffled = [...targets].sort(() => 0.5 - Math.random());
            for (let i = 0; i < count; i++) {
              const t = shuffled[i];
              const rocketDmg = Math.round(player.stats.flatDamage * 2.8);
              this.damageMonster(t, rocketDmg, true, 'FIRE');
              this.projectiles.push({
                id: ++this.nextProjId,
                type: ProjectileType.FRAG_GRENADE,
                x: t.x,
                y: t.y,
                vx: 0,
                vy: 0,
                damage: 0,
                isCrit: true,
                radius: 65 * player.stats.areaMultiplier,
                lifeTime: 0.35,
                pierceRemaining: 0,
                hitEntityIds: new Set()
              });
            }
          }
        }
      }

      // 13. Cat Tank Aggro Taunt & Hiss (Every 5.0s taunts monsters within 350px towards cat)
      if (skills.aggroTaunt) {
        player.aggroTauntTimer = (player.aggroTauntTimer || 0) + dt;
        const rank = skills.aggroTauntRank || 1;
        const cooldown = Math.max(3.0, 5.5 - rank * 0.7);
        if (player.aggroTauntTimer >= cooldown) {
          player.aggroTauntTimer = 0;
          const tauntRadius = (skills.titanEarthquake ? 420 : 320 + rank * 40) * player.stats.areaMultiplier;
          const mobs = this.monsterGrid.queryRadius(player.x, player.y, tauntRadius);
          for (const m of mobs) {
            const pullAngle = Math.atan2(player.y - m.y, player.x - m.x);
            this.applyKnockback(m, pullAngle, skills.titanEarthquake ? 50 : 25);
            if (skills.titanEarthquake) {
              this.damageMonster(m, Math.round(player.stats.flatDamage * 2.2), true, 'PHYSICAL');
            }
          }
          this.broadcastDamageNumber(player.x, player.y - 25, 0, false);

          if (skills.titanEarthquake) {
            this.projectiles.push({
              id: ++this.nextProjId,
              type: ProjectileType.TITAN_QUAKE_WAVE,
              x: player.x,
              y: player.y,
              vx: 0,
              vy: 0,
              damage: 0,
              isCrit: true,
              radius: tauntRadius,
              lifeTime: 0.45,
              pierceRemaining: 0,
              hitEntityIds: new Set()
            });
          }
        }
      }

      // 14. Cat Tank Hairball Mortar (Every 4.0s spits acidic sticky hairball)
      if (skills.hairballLauncher) {
        player.hairballTimer = (player.hairballTimer || 0) + dt;
        const rank = skills.hairballLauncherRank || 1;
        const cooldown = Math.max(2.5, 4.5 - rank * 0.5);
        if (player.hairballTimer >= cooldown) {
          player.hairballTimer = 0;
          const speed = 420;
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.CAT_HAIRBALL,
            ownerId: player.id,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.aimAngle) * speed,
            vy: Math.sin(player.aimAngle) * speed,
            damage: Math.round(player.stats.flatDamage * (1.2 + rank * 0.4)),
            isCrit: false,
            radius: 16 * player.stats.areaMultiplier,
            lifeTime: 0.65,
            pierceRemaining: 2,
            hitEntityIds: new Set()
          });
        }
      }

      // 15. Cowboy Ensnaring Lasso (Every 4.5s throws spinning lasso pulling & rooting enemies)
      if (skills.ensnaringLasso) {
        player.lassoTimer = (player.lassoTimer || 0) + dt;
        const rank = skills.ensnaringLassoRank || 1;
        const cooldown = Math.max(2.6, 4.8 - rank * 0.6);
        if (player.lassoTimer >= cooldown) {
          player.lassoTimer = 0;
          const throwDist = 170;
          const targetX = player.x + Math.cos(player.aimAngle) * throwDist;
          const targetY = player.y + Math.sin(player.aimAngle) * throwDist;
          const lassoRadius = (100 + rank * 20) * player.stats.areaMultiplier;
          const trappedMobs = this.monsterGrid.queryRadius(targetX, targetY, lassoRadius);
          const lassoDmg = Math.round(player.stats.flatDamage * (1.8 + rank * 0.5));

          const maxTargets = 3 + rank * 2;
          const caught = trappedMobs.slice(0, maxTargets);
          for (const m of caught) {
            this.damageMonster(m, lassoDmg, true, 'BLEED');
            // Pull monsters tightly towards center of the lasso (bosses immune)
            const pullAngle = Math.atan2(targetY - m.y, targetX - m.x);
            this.applyKnockback(m, pullAngle, 45);
            m.speed = Math.max(10, m.speed * 0.4); // Snare slow
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.COWBOY_LASSO,
            x: targetX,
            y: targetY,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: true,
            radius: lassoRadius,
            lifeTime: 0.38,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }

      // 16. Celestial Mecha Wing Laser Salvo (Every 4.0s locks on & fires hyper-velocity plasma beams)
      if (skills.wingLaserSalvo) {
        player.wingLaserTimer = (player.wingLaserTimer || 0) + dt;
        const rank = skills.wingLaserSalvoRank || 1;
        const cooldown = Math.max(2.5, 4.5 - rank * 0.6);
        if (player.wingLaserTimer >= cooldown) {
          player.wingLaserTimer = 0;
          const searchRadius = 380 * player.stats.areaMultiplier;
          const targets = this.monsterGrid.queryRadius(player.x, player.y, searchRadius);
          if (targets.length > 0) {
            const maxBeams = 4 + rank * 2;
            const chosen = targets.slice(0, maxBeams);
            for (const t of chosen) {
              const beamAngle = Math.atan2(t.y - player.y, t.x - player.x);
              const beamSpeed = 950;
              const beamDmg = Math.round(player.stats.flatDamage * (2.0 + rank * 0.5));
              this.projectiles.push({
                id: ++this.nextProjId,
                type: ProjectileType.WING_LASER_BEAM,
                ownerId: player.id,
                x: player.x,
                y: player.y,
                vx: Math.cos(beamAngle) * beamSpeed,
                vy: Math.sin(beamAngle) * beamSpeed,
                damage: beamDmg,
                isCrit: true,
                radius: 12,
                lifeTime: 0.40,
                pierceRemaining: 3,
                hitEntityIds: new Set()
              });
            }
          }
        }
      }

      // 17. The Gambler Lucky Dice (Every 3.8s throws lucky fate dice rolling 1-6 AoE blast)
      if (skills.luckyDice) {
        player.luckyDiceTimer = (player.luckyDiceTimer || 0) + dt;
        const rank = skills.luckyDiceRank || 1;
        const cooldown = Math.max(2.2, 4.2 - rank * 0.5);
        if (player.luckyDiceTimer >= cooldown) {
          player.luckyDiceTimer = 0;
          const tossSpeed = 480;
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.LUCKY_DICE,
            ownerId: player.id,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.aimAngle) * tossSpeed,
            vy: Math.sin(player.aimAngle) * tossSpeed,
            damage: 0,
            isCrit: false,
            radius: 20,
            lifeTime: 0.35, // Lands & detonates after 0.35s
            pierceRemaining: 1,
            hitEntityIds: new Set()
          });
        }
      }

      // 18. The Gambler Jackpot 777 Slot (Every 9.0s pulls slot machine for 777 coin rain)
      if (skills.jackpot777Slot) {
        player.slotJackpotTimer = (player.slotJackpotTimer || 0) + dt;
        const rank = skills.jackpot777SlotRank || 1;
        const cooldown = Math.max(5.5, 9.0 - rank * 1.0);
        if (player.slotJackpotTimer >= cooldown) {
          player.slotJackpotTimer = 0;
          const jackpotRadius = 260 * player.stats.areaMultiplier;
          const mobs = this.monsterGrid.queryRadius(player.x, player.y, jackpotRadius);
          const jackpotDmg = Math.round(player.stats.flatDamage * (2.5 + rank * 0.6));
          for (const m of mobs) {
            this.damageMonster(m, jackpotDmg, true, 'FIRE');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, 40);
          }
          this.broadcastDamageNumber(player.x, player.y - 30, 0, true, 'JACKPOT 777!', '#facc15');

          // Spawn bonus gold coin pickups
          for (let g = 0; g < 3; g++) {
            const gAngle = (g / 3) * Math.PI * 2;
            this.pickups.push({
              id: ++this.nextPickupId,
              type: PickupType.GOLD_COIN,
              x: player.x + Math.cos(gAngle) * 35,
              y: player.y + Math.sin(gAngle) * 35,
              value: 3,
              radius: 14
            });
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.SLOT_COIN_RAIN,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: true,
            radius: jackpotRadius,
            lifeTime: 0.55,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }
    }
  }

  private executePlayerAttack(player: ServerPlayer): void {
    player.resetAttackCooldown();
    player.attackSeq++;

    const stats = player.stats;
    const skills = player.skills;
    const isCrit = Math.random() < stats.critChance;
    const critMult = isCrit ? 1.0 + stats.critBonus : 1.0;
    const finalDamage = Math.round((stats.flatDamage) * stats.damageBonus * critMult);

    switch (player.playerClass) {
      case PlayerClass.SWORDSMAN: {
        player.whirlwindCounter = (player.whirlwindCounter || 0) + 1;
        const wwRank = skills?.bladeWhirlwindRank || (skills?.bladeWhirlwind ? 1 : 0);
        // Whirlwind triggers every 3 swings at Rank 1 (2 swings at Rank 2+)
        const wwFreq = Math.max(2, 4 - wwRank);
        const isWhirlwind = wwRank > 0 && (player.whirlwindCounter % wwFreq === 0);

        if (isWhirlwind) {
          // 360 Whirlwind Spin attack hitting all surrounding foes
          const wwRadius = 115 * stats.areaMultiplier;
          const hitMobs = this.monsterGrid.queryRadius(player.x, player.y, wwRadius);
          for (const m of hitMobs) {
            this.damageMonster(m, Math.round(finalDamage * 1.35), isCrit, 'PHYSICAL');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, 35);
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.WHIRLWIND_360,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit,
            radius: wwRadius,
            lifeTime: 0.28,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });

          // Also launch a flying crescent wave in the aim direction
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.SHOCKWAVE_SLASH,
            ownerId: player.id,
            x: player.x + Math.cos(player.aimAngle) * 30,
            y: player.y + Math.sin(player.aimAngle) * 30,
            vx: Math.cos(player.aimAngle) * 450,
            vy: Math.sin(player.aimAngle) * 450,
            damage: Math.round(finalDamage * 1.1),
            isCrit,
            radius: 26 * stats.areaMultiplier,
            lifeTime: 0.45,
            pierceRemaining: 3,
            hitEntityIds: new Set()
          });
        } else {
          // Melee Arc Cleave: Matches visible greatsword blade + crescent arc reach (75 units)
          const range = 75 * stats.areaMultiplier;
          const arc = (Math.PI * 2) * 0.32; // ~115 degree tight sweep
          const monstersInRange = this.monsterGrid.queryRadius(player.x, player.y, range);
          const cleaveElem = (skills?.rendAndTearRank || 0) > 0 ? 'BLEED' : 'PHYSICAL';

          for (const m of monstersInRange) {
            const angleToMob = Math.atan2(m.y - player.y, m.x - player.x);
            let diff = Math.abs(angleToMob - player.aimAngle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

            if (diff <= arc / 2) {
              this.damageMonster(m, finalDamage, isCrit, cleaveElem);
              const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
              this.applyKnockback(m, kbAngle, 20);
            }
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.SWORD_CLEAVE,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.aimAngle) * 200,
            vy: Math.sin(player.aimAngle) * 200,
            damage: 0,
            isCrit,
            radius: range,
            lifeTime: 0.16,
            pierceRemaining: 999,
            hitEntityIds: new Set()
          });
        }

        // Signature Skill: Shockwave Slash beam (Rank 1: 35% proc -> Rank 3: 100% proc)
        if (skills?.shockwaveSlash) {
          const slashProc = skills.shockwaveSlashRank === 1 ? 0.35 : (skills.shockwaveSlashRank === 2 ? 0.70 : 1.0);
          if (Math.random() < slashProc) {
            const speed = 480;
            const slashRadius = Math.round(25 * stats.areaMultiplier);
            this.projectiles.push({
              id: ++this.nextProjId,
              type: ProjectileType.SHOCKWAVE_SLASH,
              x: player.x,
              y: player.y,
              vx: Math.cos(player.aimAngle) * speed,
              vy: Math.sin(player.aimAngle) * speed,
              damage: Math.round(finalDamage * 0.75),
              isCrit,
              radius: slashRadius,
              lifeTime: 0.58, // travels ~280 units
              pierceRemaining: 3 + (skills.shockwaveSlashRank || 1),
              hitEntityIds: new Set()
            });
          }
        }

        // Signature Skill: Blood Cleave (Every 4th attack slashes a crimson arc)
        player.attackCount = (player.attackCount || 0) + 1;
        if (skills?.bloodCleave && player.attackCount % 4 === 0) {
          const cleaveSpeed = 420;
          const cleaveRadius = Math.round(35 * stats.areaMultiplier);
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.BLOOD_CLEAVE_WAVE,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.aimAngle) * cleaveSpeed,
            vy: Math.sin(player.aimAngle) * cleaveSpeed,
            damage: Math.round(finalDamage * 1.35),
            isCrit: true,
            radius: cleaveRadius,
            lifeTime: 0.50,
            pierceRemaining: 5 + (skills.bloodCleaveRank || 1),
            hitEntityIds: new Set()
          });
        }

        // Mythic Evolution: Aegis of the Bastion (360° seismic earthquake shockwave)
        if (skills?.aegisOfBastion) {
          const bastionRadius = 170 * stats.areaMultiplier;
          const bastionMobs = this.monsterGrid.queryRadius(player.x, player.y, bastionRadius);
          for (const m of bastionMobs) {
            this.damageMonster(m, Math.round(finalDamage * 1.8), isCrit, 'PHYSICAL');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, 55);
            m.speed = Math.max(10, m.speed * 0.2); // Stun
          }
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.TITAN_QUAKE_WAVE,
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: true,
            radius: bastionRadius,
            lifeTime: 0.35,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
        break;
      }

      case PlayerClass.ARCHER: {
        const speed = 850;

        // Mythic Evolution: Blizzard Volley (8-arrow freezing barrage with infinite pierce)
        if (skills?.blizzardVolley) {
          const bSpeed = 900;
          const arrowCount = 8;
          const spreadArc = Math.PI * 0.55; // ~100 degree fan
          for (let a = 0; a < arrowCount; a++) {
            const angle = player.aimAngle - spreadArc / 2 + (a / (arrowCount - 1)) * spreadArc;
            this.projectiles.push({
              id: ++this.nextProjId,
              type: ProjectileType.BLIZZARD_VOLLEY_ARROW,
              ownerId: player.id,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * bSpeed,
              vy: Math.sin(angle) * bSpeed,
              damage: Math.round(finalDamage * 1.3),
              isCrit,
              radius: 12,
              lifeTime: 1.6,
              pierceRemaining: 999,
              hitEntityIds: new Set()
            });
          }
        } else {
          const mRank = skills?.multishotRank || (skills?.multishot ? 2 : 0);
          let angles: number[] = [player.aimAngle];
          if (mRank === 1) {
            angles = [player.aimAngle - 0.12, player.aimAngle + 0.12]; // 2 arrows
          } else if (mRank === 2) {
            angles = [player.aimAngle - 0.22, player.aimAngle, player.aimAngle + 0.22]; // 3 arrows
          } else if (mRank >= 3) {
            angles = [player.aimAngle - 0.30, player.aimAngle - 0.10, player.aimAngle + 0.10, player.aimAngle + 0.30]; // 4 arrows
          }

          const lRank = skills?.lightningArrowRank || (skills?.lightningArrow ? 1 : 0);
          const isLightning = lRank > 0 && Math.random() < (0.35 * lRank);
          const pierce = 2 + (skills?.deadeyePierceRank || 0) * 2;
          const arrowType = skills?.explosiveShot ? ProjectileType.EXPLOSIVE_ARROW : ProjectileType.ARROW;

          for (const angle of angles) {
            this.projectiles.push({
              id: ++this.nextProjId,
              type: arrowType,
              ownerId: player.id,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              damage: finalDamage,
              isCrit,
              radius: 10,
              lifeTime: 1.6, // ~1360 units travel distance across the entire screen!
              pierceRemaining: pierce,
              hitEntityIds: new Set(),
              isLightning
            });
          }
        }
        break;
      }

      case PlayerClass.SORCERESS: {
        // Chain Lightning
        const queryRange = 180 * stats.areaMultiplier;
        const candidates = this.monsterGrid.queryRadius(player.x, player.y, queryRange);

        if (candidates.length > 0) {
          candidates.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
          const primary = candidates[0];
          this.damageMonster(primary, finalDamage, isCrit, 'SHOCK');

          // Mythic Evolution: Wrath of the Thunder God (12 bounces + smite pillars on crit)
          const isWrath = !!skills?.wrathThunderGod;
          const maxBounces = isWrath ? 12 : (2 + (skills?.lightningOverchargeRank || (skills?.lightningOvercharge ? 2 : 0)));
          let currentTarget = primary;
          const hitIds = new Set<number>([primary.id]);

          if (isWrath && isCrit) {
            this.projectiles.push({
              id: ++this.nextProjId,
              type: ProjectileType.JUDGMENT_PILLAR,
              x: primary.x,
              y: primary.y,
              vx: 0,
              vy: 0,
              damage: 0,
              isCrit: true,
              radius: 65 * stats.areaMultiplier,
              lifeTime: 0.35,
              pierceRemaining: 0,
              hitEntityIds: new Set()
            });
            this.damageMonster(primary, Math.round(finalDamage * 1.5), true, 'SHOCK');
          }

          for (let bounce = 0; bounce < maxBounces; bounce++) {
            const nearby = this.monsterGrid.queryRadius(currentTarget.x, currentTarget.y, 130)
              .filter((m) => !hitIds.has(m.id));
            if (nearby.length === 0) break;

            const nextTarget = nearby[0];
            hitIds.add(nextTarget.id);
            this.damageMonster(nextTarget, Math.round(finalDamage * (isWrath ? 0.95 : 0.75)), isCrit, 'SHOCK');

            if (isWrath && isCrit) {
              this.projectiles.push({
                id: ++this.nextProjId,
                type: ProjectileType.JUDGMENT_PILLAR,
                x: nextTarget.x,
                y: nextTarget.y,
                vx: 0,
                vy: 0,
                damage: 0,
                isCrit: true,
                radius: 55 * stats.areaMultiplier,
                lifeTime: 0.30,
                pierceRemaining: 0,
                hitEntityIds: new Set()
              });
              this.damageMonster(nextTarget, Math.round(finalDamage * 1.2), true, 'SHOCK');
            }

            currentTarget = nextTarget;
          }

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.CHAIN_LIGHTNING,
            x: player.x,
            y: player.y,
            vx: primary.x,
            vy: primary.y,
            damage: 0,
            isCrit,
            radius: 16,
            lifeTime: 0.20,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
        break;
      }

      case PlayerClass.CLERIC: {
        // Holy Smite: Intimate sacred blast aura around cleric
        const smiteRadius = 95 * stats.areaMultiplier;
        const hitMobs = this.monsterGrid.queryRadius(player.x, player.y, smiteRadius);

        for (const m of hitMobs) {
          this.damageMonster(m, finalDamage, isCrit, 'HOLY');
          const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
          this.applyKnockback(m, kbAngle, 35);
        }

        this.projectiles.push({
          id: ++this.nextProjId,
          type: ProjectileType.HOLY_SMITE,
          x: player.x,
          y: player.y,
          vx: 0,
          vy: 0,
          damage: 0,
          isCrit,
          radius: smiteRadius,
          lifeTime: 0.35,
          pierceRemaining: 0,
          hitEntityIds: new Set()
        });
        break;
      }

      case PlayerClass.COMMANDO: {
        // Commando M4A1 3-Round Rapid Burst
        const speed = 720;
        const pierce = 2 + (skills?.apRoundsRank || 0);
        const burstCount = 3;
        const spread = 0.08;

        for (let b = 0; b < burstCount; b++) {
          const angle = player.aimAngle + (b - 1) * spread * 0.5;
          const offsetDist = b * 6;
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.M4A1_BULLET,
            ownerId: player.id,
            x: player.x + Math.cos(angle) * offsetDist,
            y: player.y + Math.sin(angle) * offsetDist,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: Math.round(finalDamage * 0.75), // 3 shots = 225% total
            isCrit,
            radius: 8,
            lifeTime: 0.55,
            pierceRemaining: pierce,
            hitEntityIds: new Set()
          });
        }
        break;
      }

      case PlayerClass.CAT_TANK: {
        // Heavy Paw Slam: Close-range high-impact ground slam
        // Mythic Evolution: Titan Chonk Earthquake (Colossal paw slam shaking entire screen)
        const isTitan = !!skills?.titanEarthquake;
        const slamRadius = (isTitan ? 280 : 110) * stats.areaMultiplier;
        const arc = isTitan ? Math.PI * 2 : Math.PI * 0.75;
        const mobs = this.monsterGrid.queryRadius(player.x, player.y, slamRadius);

        for (const m of mobs) {
          const angleToMob = Math.atan2(m.y - player.y, m.x - player.x);
          let diff = Math.abs(angleToMob - player.aimAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          if (isTitan || diff <= arc / 2) {
            this.damageMonster(m, isTitan ? Math.round(finalDamage * 2.0) : finalDamage, isCrit, 'PHYSICAL');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, isTitan ? 75 : 45);
          }
        }

        this.projectiles.push({
          id: ++this.nextProjId,
          type: isTitan ? ProjectileType.TITAN_QUAKE_WAVE : ProjectileType.CAT_BELLY_SLAM,
          x: player.x + Math.cos(player.aimAngle) * 35,
          y: player.y + Math.sin(player.aimAngle) * 35,
          vx: 0,
          vy: 0,
          damage: 0,
          isCrit,
          radius: slamRadius,
          lifeTime: isTitan ? 0.40 : 0.28,
          pierceRemaining: 0,
          hitEntityIds: new Set()
        });
        break;
      }

      case PlayerClass.COWBOY: {
        // Cowboy Twin Revolver Quick-Draw & Fanning
        player.attackCount++;
        const speed = 820;
        const pierce = 1 + (skills?.bountyHunterBountyRank || 0);
        const bulletCount = skills?.quickDrawFan ? 2 : 1;
        const perp = player.aimAngle + Math.PI / 2;
        const sideOffset = (player.attackCount % 2 === 0 ? 9 : -9);

        for (let b = 0; b < bulletCount; b++) {
          const spread = (b - (bulletCount - 1) / 2) * 0.08;
          const shotAngle = player.aimAngle + spread;
          const spawnX = player.x + Math.cos(perp) * sideOffset + Math.cos(shotAngle) * (b * 8);
          const spawnY = player.y + Math.sin(perp) * sideOffset + Math.sin(shotAngle) * (b * 8);

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.REVOLVER_BULLET,
            ownerId: player.id,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(shotAngle) * speed,
            vy: Math.sin(shotAngle) * speed,
            damage: Math.round(finalDamage * (bulletCount > 1 ? 0.85 : 1.15)),
            isCrit,
            radius: 8,
            lifeTime: 0.50,
            pierceRemaining: pierce,
            hitEntityIds: new Set()
          });
        }
        break;
      }

      case PlayerClass.CELESTIAL_MECHA: {
        // Celestial Mecha Dual Beam Sabers Cleaving Arc
        const saberRadius = (95 + (skills?.beamSaberCleaveRank || 0) * 15) * stats.areaMultiplier;
        const saberArc = Math.PI * 0.85; // 150 degree sweep
        const mobs = this.monsterGrid.queryRadius(player.x, player.y, saberRadius);

        for (const m of mobs) {
          const angleToMob = Math.atan2(m.y - player.y, m.x - player.x);
          let diff = Math.abs(angleToMob - player.aimAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          if (diff <= saberArc / 2) {
            this.damageMonster(m, Math.round(finalDamage * 1.25), isCrit, 'SHOCK');
            const kbAngle = Math.atan2(m.y - player.y, m.x - player.x);
            this.applyKnockback(m, kbAngle, 35);
          }
        }

        this.projectiles.push({
          id: ++this.nextProjId,
          type: ProjectileType.BEAM_SABER_SLASH,
          x: player.x + Math.cos(player.aimAngle) * 30,
          y: player.y + Math.sin(player.aimAngle) * 30,
          vx: Math.cos(player.aimAngle) * 200,
          vy: Math.sin(player.aimAngle) * 200,
          damage: 0,
          isCrit,
          radius: saberRadius,
          lifeTime: 0.26,
          pierceRemaining: 0,
          hitEntityIds: new Set()
        });
        break;
      }

      case PlayerClass.GAMBLER: {
        // The Gambler Arcane Playing Cards Fan
        const cardCount = 3 + (skills?.fortuneCards ? 2 : 0);
        const cardSpeed = 640;
        const spreadAngle = 0.16;

        for (let c = 0; c < cardCount; c++) {
          const offset = (c - (cardCount - 1) / 2) * spreadAngle;
          const cardAngle = player.aimAngle + offset;

          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.GAMBLER_CARD,
            ownerId: player.id,
            x: player.x + Math.cos(cardAngle) * 15,
            y: player.y + Math.sin(cardAngle) * 15,
            vx: Math.cos(cardAngle) * cardSpeed,
            vy: Math.sin(cardAngle) * cardSpeed,
            damage: Math.round(finalDamage * 0.80),
            isCrit,
            radius: 10,
            lifeTime: 0.52,
            pierceRemaining: 1,
            hitEntityIds: new Set()
          });
        }
        break;
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifeTime -= dt;

      if (p.lifeTime <= 0 || p.pierceRemaining <= 0) {
        if (p.type === ProjectileType.LUCKY_DICE) {
          const owner = p.ownerId ? this.players.get(p.ownerId) : null;
          const minRoll = (owner?.skills?.luckyDiceRank || 0) >= 2 ? 3 : 1;
          const roll = Math.floor(Math.random() * (6 - minRoll + 1)) + minRoll;
          const blastRadius = (110 + roll * 15) * (owner?.stats?.areaMultiplier || 1.0);
          const mobs = this.monsterGrid.queryRadius(p.x, p.y, blastRadius);
          const isJackpot = roll === 6;
          const diceDmg = Math.round((owner?.stats?.flatDamage || 30) * (1.6 + roll * 0.45));
          for (const m of mobs) {
            this.damageMonster(m, diceDmg, isJackpot, 'FIRE');
            const kbAngle = Math.atan2(m.y - p.y, m.x - p.x);
            this.applyKnockback(m, kbAngle, isJackpot ? 60 : 30);
          }
          this.broadcastDamageNumber(p.x, p.y - 20, 0, isJackpot, `DICE [${roll}]!`, isJackpot ? '#facc15' : '#60a5fa');
          if (isJackpot) {
            for (let g = 0; g < 2; g++) {
              const gAngle = (g / 2) * Math.PI * 2;
              this.pickups.push({
                id: ++this.nextPickupId,
                type: PickupType.GOLD_COIN,
                x: p.x + Math.cos(gAngle) * 25,
                y: p.y + Math.sin(gAngle) * 25,
                value: 2,
                radius: 14
              });
            }
          }
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (
        p.type === ProjectileType.ENEMY_ARROW ||
        p.type === ProjectileType.ENEMY_FIREBALL ||
        p.type === ProjectileType.ENEMY_VOID_ORB
      ) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Check collision against alive players
        for (const player of this.players.values()) {
          if (!player.isDead) {
            const dist = Math.hypot(player.x - p.x, player.y - p.y);
            if (dist <= player.radius + p.radius) {
              const damaged = player.takeDamage(p.damage);
              this.broadcastDamageNumber(player.x, player.y - 15, p.damage, false);
              p.pierceRemaining = 0;
              p.lifeTime = 0;
              break;
            }
          }
        }
        continue;
      }

      if (
        p.type === ProjectileType.ARROW ||
        p.type === ProjectileType.SHOCKWAVE_SLASH ||
        p.type === ProjectileType.EXPLOSIVE_ARROW ||
        p.type === ProjectileType.BLOOD_CLEAVE_WAVE ||
        p.type === ProjectileType.M4A1_BULLET ||
        p.type === ProjectileType.CAT_HAIRBALL ||
        p.type === ProjectileType.BLIZZARD_VOLLEY_ARROW ||
        p.type === ProjectileType.CLUSTER_BOMB ||
        p.type === ProjectileType.REVOLVER_BULLET ||
        p.type === ProjectileType.WING_LASER_BEAM ||
        p.type === ProjectileType.GAMBLER_CARD ||
        p.type === ProjectileType.LUCKY_DICE
      ) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Check hits against monsters
        const hits = this.monsterGrid.queryRadius(p.x, p.y, p.radius);
        for (const m of hits) {
          if (!p.hitEntityIds.has(m.id)) {
            p.hitEntityIds.add(m.id);
            let projElem: ElementStatus | 'FIRE' | 'PHYSICAL' = 'PHYSICAL';
            if (p.type === ProjectileType.BLIZZARD_VOLLEY_ARROW) projElem = 'FROST';
            else if (p.type === ProjectileType.EXPLOSIVE_ARROW || p.type === ProjectileType.CLUSTER_BOMB || p.type === ProjectileType.GAMBLER_CARD) projElem = 'FIRE';
            else if (p.type === ProjectileType.BLOOD_CLEAVE_WAVE) projElem = 'BLEED';
            else if (p.type === ProjectileType.WING_LASER_BEAM || p.isLightning) projElem = 'SHOCK';
            else if (p.type === ProjectileType.REVOLVER_BULLET) {
              const rOwner = p.ownerId ? this.players.get(p.ownerId) : null;
              projElem = (rOwner?.skills?.bountyHunterBountyRank || 0) > 0 ? 'BLEED' : 'PHYSICAL';
            }

            this.damageMonster(m, p.damage, p.isCrit, projElem);

            // Gambler lucky coin drop chance on card hit
            if (p.type === ProjectileType.GAMBLER_CARD) {
              const cOwner = p.ownerId ? this.players.get(p.ownerId) : null;
              if (cOwner && (cOwner.skills?.highRollerGreedRank || 0) > 0 && Math.random() < 0.035) {
                this.pickups.push({
                  id: ++this.nextPickupId,
                  type: PickupType.GOLD_COIN,
                  x: m.x,
                  y: m.y,
                  value: 1,
                  radius: 14
                });
              }
            }

            // Lucky Dice detonates on direct mob impact
            if (p.type === ProjectileType.LUCKY_DICE) {
              p.pierceRemaining = 0;
              p.lifeTime = 0;
              break;
            }

            // Blizzard Volley freeze
            if (p.type === ProjectileType.BLIZZARD_VOLLEY_ARROW) {
              m.speed = 0; // Freeze solid
            }

            // Cluster Bomb secondary burn
            if (p.type === ProjectileType.CLUSTER_BOMB) {
              const clusterSplash = this.monsterGrid.queryRadius(m.x, m.y, 65);
              for (const cm of clusterSplash) {
                if (cm.id !== m.id) {
                  this.damageMonster(cm, Math.round(p.damage * 0.75), false, 'FIRE');
                }
              }
            }

            // Mythic Evolution: Hellfire Cataclysm (3 cascading cluster explosions)
            const projOwner = p.ownerId ? this.players.get(p.ownerId) : null;
            if (
              projOwner?.skills.hellfireCataclysm &&
              (p.type === ProjectileType.ARROW ||
                p.type === ProjectileType.EXPLOSIVE_ARROW ||
                p.type === ProjectileType.BLIZZARD_VOLLEY_ARROW)
            ) {
              for (let c = 0; c < 3; c++) {
                const cAngle = (c / 3) * Math.PI * 2 + Math.random() * 0.5;
                const cDist = 25 + Math.random() * 35;
                const cx = m.x + Math.cos(cAngle) * cDist;
                const cy = m.y + Math.sin(cAngle) * cDist;
                const cRadius = 75 * (projOwner.stats.areaMultiplier || 1.0);
                const cMobs = this.monsterGrid.queryRadius(cx, cy, cRadius);
                for (const cm of cMobs) {
                  this.damageMonster(cm, Math.round(p.damage * 0.8), true, 'FIRE');
                }
                this.projectiles.push({
                  id: ++this.nextProjId,
                  type: ProjectileType.HELLFIRE_METEOR,
                  x: cx,
                  y: cy,
                  vx: 0,
                  vy: 0,
                  damage: 0,
                  isCrit: true,
                  radius: cRadius,
                  lifeTime: 0.35 + c * 0.08,
                  pierceRemaining: 0,
                  hitEntityIds: new Set()
                });
              }
            }

            // Explosive Arrow secondary AoE explosion
            if (p.type === ProjectileType.EXPLOSIVE_ARROW) {
              const splashMobs = this.monsterGrid.queryRadius(m.x, m.y, 75);
              for (const sm of splashMobs) {
                if (sm.id !== m.id) {
                  this.damageMonster(sm, Math.round(p.damage * 0.8), false, 'FIRE');
                }
              }
            }

            // Blood Cleave: slow bleeding monsters
            if (p.type === ProjectileType.BLOOD_CLEAVE_WAVE) {
              m.speed = Math.max(15, m.speed * 0.65);
            }

            // Cat Hairball: slow sticky poison
            if (p.type === ProjectileType.CAT_HAIRBALL) {
              m.speed = Math.max(10, m.speed * 0.55);
            }

            // Lightning Arrow secondary discharge
            if (p.isLightning) {
              const owner = p.ownerId ? this.players.get(p.ownerId) : null;
              const shockRadius = Math.round(85 * (owner?.stats.areaMultiplier || 1.0));
              const shockMobs = this.monsterGrid.queryRadius(m.x, m.y, shockRadius);
              for (const sm of shockMobs) {
                if (sm.id !== m.id) {
                  this.damageMonster(sm, Math.round(p.damage * 0.5), false, 'SHOCK');
                }
              }
              this.projectiles.push({
                id: ++this.nextProjId,
                type: ProjectileType.LIGHTNING_DISCHARGE,
                x: m.x,
                y: m.y,
                vx: 0,
                vy: 0,
                damage: 0,
                isCrit: false,
                radius: shockRadius,
                lifeTime: 0.22,
                pierceRemaining: 0,
                hitEntityIds: new Set()
              });
            }

            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) break;
          }
        }
      }

      // Frost Trap trigger & freeze detonation
      if (p.type === ProjectileType.FROST_TRAP) {
        const trapTriggerMobs = this.monsterGrid.queryRadius(p.x, p.y, p.radius);
        if (trapTriggerMobs.length > 0) {
          p.lifeTime = 0; // Detonates!
          const freezeRadius = 80;
          const frozenMobs = this.monsterGrid.queryRadius(p.x, p.y, freezeRadius);
          for (const m of frozenMobs) {
            this.damageMonster(m, p.damage, true, 'FROST');
            m.speed = 10; // Freeze root
          }
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.FROST_NOVA,
            x: p.x,
            y: p.y,
            vx: 0,
            vy: 0,
            damage: 0,
            isCrit: false,
            radius: freezeRadius,
            lifeTime: 0.25,
            pierceRemaining: 0,
            hitEntityIds: new Set()
          });
        }
      }

      // Sanctum Barrier continuous ground sanctification
      if (p.type === ProjectileType.SANCTUM_BARRIER && this.tickCount % 15 === 0) {
        const sanctumMobs = this.monsterGrid.queryRadius(p.x, p.y, p.radius);
        for (const m of sanctumMobs) {
          this.damageMonster(m, p.damage, false, 'HOLY');
        }
      }
    }
  }

  private damageMonster(
    monster: ServerMonster,
    amount: number,
    isCrit: boolean,
    sourceElement?: ElementStatus | 'FIRE' | 'PHYSICAL',
    customLabel?: string,
    customColor?: string
  ): void {
    if (monster.isDead) return;

    const element: ElementStatus | 'PHYSICAL' | undefined = sourceElement === 'FIRE' ? 'BURN' : sourceElement;
    let finalAmount = amount;
    let reactionLabel: string | undefined = customLabel;
    let reactionColor: string | undefined = customColor;

    if (element) {
      // 1. Shatter: PHYSICAL on FROST -> consumes FROST, deals 300% dmg, emits 6 radial ice shards
      if (element === 'PHYSICAL' && monster.hasStatus('FROST')) {
        monster.consumeStatus('FROST');
        finalAmount = Math.round(finalAmount * 3.0);
        reactionLabel = '💥 SHATTER!';
        reactionColor = '#38bdf8';

        // 6 Radial Ice Shards
        const shardCount = 6;
        for (let s = 0; s < shardCount; s++) {
          const sAngle = (s / shardCount) * Math.PI * 2;
          const sSpeed = 380;
          this.projectiles.push({
            id: ++this.nextProjId,
            type: ProjectileType.FROST_NOVA,
            x: monster.x,
            y: monster.y,
            vx: Math.cos(sAngle) * sSpeed,
            vy: Math.sin(sAngle) * sSpeed,
            damage: Math.round(amount * 0.5),
            isCrit: true,
            radius: 18,
            lifeTime: 0.35,
            pierceRemaining: 2,
            hitEntityIds: new Set([monster.id])
          });
        }
      }
      // 2. Bloodflame: FIRE on BLEED or BLEED on BURN -> consumes both, deals 220% dmg + 8% monster Max HP
      else if (
        (element === 'BURN' && monster.hasStatus('BLEED')) ||
        (element === 'BLEED' && monster.hasStatus('BURN'))
      ) {
        monster.consumeStatus('BLEED');
        monster.consumeStatus('BURN');
        finalAmount = Math.round(finalAmount * 2.2 + monster.maxHp * 0.08);
        reactionLabel = '🔥 BLOODFLAME!';
        reactionColor = '#f97316';
      }
      // 3. Superconduct: SHOCK on FROST or FROST on SHOCK -> consumes both, sets defenseDebuff = 0.5, chains to 8 targets
      else if (
        (element === 'SHOCK' && monster.hasStatus('FROST')) ||
        (element === 'FROST' && monster.hasStatus('SHOCK'))
      ) {
        monster.consumeStatus('SHOCK');
        monster.consumeStatus('FROST');
        monster.defenseDebuff = 0.5; // +50% dmg taken
        reactionLabel = '⚡ SUPERCONDUCT! -50% DEF';
        reactionColor = '#a855f7';

        // Chain lightning up to 8 nearby monsters within 160 radius
        const chainMobs = this.monsterGrid.queryRadius(monster.x, monster.y, 160)
          .filter((m) => m.id !== monster.id)
          .slice(0, 8);
        for (const cm of chainMobs) {
          cm.defenseDebuff = 0.5;
          this.damageMonster(cm, Math.round(amount * 0.6), false);
        }
      }
      // 4. Holy Conflagration: HOLY on BURN or BURN on HOLY -> consumes both, deals 200% dmg, heals alive allies 5% HP
      else if (
        (element === 'HOLY' && monster.hasStatus('BURN')) ||
        (element === 'BURN' && monster.hasStatus('HOLY'))
      ) {
        monster.consumeStatus('HOLY');
        monster.consumeStatus('BURN');
        finalAmount = Math.round(finalAmount * 2.0);
        reactionLabel = '✨ CONFLAGRATION!';
        reactionColor = '#fbbf24';

        // Heal nearby players within 260 radius
        for (const p of this.players.values()) {
          if (!p.isDead && Math.hypot(p.x - monster.x, p.y - monster.y) <= 260) {
            p.heal(Math.max(5, Math.round(p.stats.maxHp * 0.05)));
            this.broadcastDamageNumber(p.x, p.y - 20, Math.round(p.stats.maxHp * 0.05), false, '💚 HEAL', '#22c55e');
          }
        }
      }
      // If not physical and no reaction occurred, prime the monster with the element!
      else if (element !== 'PHYSICAL') {
        monster.applyStatus(element, 4.5, 1);
      }
    }

    this.broadcastDamageNumber(monster.x, monster.y, finalAmount, isCrit, reactionLabel, reactionColor);
    const died = monster.takeDamage(finalAmount);

    if (died) {
      this.totalKills++;
      this.monsters.delete(monster.id);

      // Stage Reward Multipliers
      const stage = STAGES[this.stageId] || STAGES[1];

      // Drop EXP Gem (Scaled by Stage EXP multiplier, clamped within playable arena)
      const mapLimit = (GAME_CONSTANTS.MAP_SIZE / 2) - 80;
      const dropX = Math.max(-mapLimit, Math.min(mapLimit, monster.x));
      const dropY = Math.max(-mapLimit, Math.min(mapLimit, monster.y));

      const gemType = monster.expValue >= 50 ? PickupType.EXP_GEM_LARGE : monster.expValue >= 5 ? PickupType.EXP_GEM_MEDIUM : PickupType.EXP_GEM_SMALL;
      const scaledExp = Math.max(1, Math.round(monster.expValue * stage.expMultiplier));
      this.pickups.push({
        id: ++this.nextPickupId,
        type: gemType,
        x: dropX,
        y: dropY,
        value: scaledExp,
        radius: 14
      });

      // Chance to drop Gold (2.2% drop chance, 1 gold scaled by Stage Gold multiplier and Gold Rush Shrine)
      if (Math.random() < 0.022) {
        const hasGoldRush = Array.from(this.players.values()).some((p) => p.shrineBuff?.type === ShrineType.GOLD_RUSH);
        const baseGold = 1;
        const goldMultiplier = stage.goldMultiplier * (hasGoldRush ? 2.0 : 1.0);
        const scaledGold = Math.max(1, Math.round(baseGold * goldMultiplier));
        this.pickups.push({
          id: ++this.nextPickupId,
          type: PickupType.GOLD_COIN,
          x: Math.max(-mapLimit, Math.min(mapLimit, dropX + (Math.random() * 20 - 10))),
          y: Math.max(-mapLimit, Math.min(mapLimit, dropY + (Math.random() * 20 - 10))),
          value: scaledGold,
          radius: 12
        });
      }

      // Boss Defeat Rewards: drops 3 gold coins scaled by stage + Tome of Greater Ascension
      if (monster.isBoss) {
        if (monster.bossName !== 'Elite Void Guardian') {
          this.hordeDirector.onBossDefeated();
        }
        for (let g = 0; g < 3; g++) {
          const bossGold = Math.max(2, Math.round(2 * stage.goldMultiplier));
          this.pickups.push({
            id: ++this.nextPickupId,
            type: PickupType.GOLD_COIN,
            x: Math.max(-mapLimit, Math.min(mapLimit, dropX + (Math.random() * 60 - 30))),
            y: Math.max(-mapLimit, Math.min(mapLimit, dropY + (Math.random() * 60 - 30))),
            value: bossGold,
            radius: 14
          });
        }

        // Drop Tome of Greater Ascension (+1 Level to all players)
        this.pickups.push({
          id: ++this.nextPickupId,
          type: PickupType.TOME_OF_ASCENSION,
          x: dropX,
          y: dropY,
          value: 1,
          radius: 20
        });

        // Check Ultimate Final Boss Defeat
        if (monster.type === MonsterType.LORD_OF_TORMENT) {
          this.isOver = true;
          this.broadcast({
            type: 'GAME_OVER',
            victory: true,
            survivalTime: Math.round(this.hordeDirector.getElapsedTime()),
            totalKills: this.totalKills,
            teamGold: this.teamGold,
            clearedStageId: this.stageId
          });
        }
      }
    }
  }

  private updatePickups(alivePlayers: ServerPlayer[], dt: number): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];

      // Expire timed world drops (Treasure chests, health caches)
      if (p.duration !== undefined) {
        p.duration -= dt;
        if (p.duration <= 0) {
          this.pickups.splice(i, 1);
          continue;
        }
      }

      for (const player of alivePlayers) {
        const dist = Math.hypot(player.x - p.x, player.y - p.y);

        if (dist <= player.stats.pickupRadius) {
          // Magnetize towards player
          p.x += ((player.x - p.x) / dist) * 450 * dt;
          p.y += ((player.y - p.y) / dist) * 450 * dt;

          if (dist <= player.radius + p.radius) {
            // Collected!
            this.handlePickupCollection(p);
            this.pickups.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private handlePickupCollection(pickup: Pickup): void {
    if (pickup.type === PickupType.GOLD_COIN) {
      this.teamGold += pickup.value;
      return;
    }

    if (pickup.type === PickupType.HEALTH_POTION) {
      for (const p of this.players.values()) {
        if (!p.isDead) {
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + 40);
        }
      }
      return;
    }

    // Dynamic World Treasure Chest (+8 to 12 Gold + 150 EXP!)
    if (pickup.type === PickupType.TREASURE_CHEST) {
      this.teamGold += pickup.value;
      for (const player of this.players.values()) {
        if (!player.isDead) {
          const leveledUp = player.addExp(150);
          if (leveledUp) {
            player.stats.hp = player.stats.maxHp;
            player.isChoosingTrait = true;
            this.isPaused = true;
            this.triggerLevelUpChoices(player);
          }
        }
      }
      return;
    }

    // Tome of Greater Ascension: Boss Drop granting +1 Level & Full 100% HP Heal!
    if (pickup.type === PickupType.TOME_OF_ASCENSION) {
      for (const player of this.players.values()) {
        if (!player.isDead) {
          player.stats.level++;
          player.stats.hp = player.stats.maxHp; // 100% Full Heal!
          player.isChoosingTrait = true;
          this.isPaused = true;
          this.triggerLevelUpChoices(player);
        }
      }
      return;
    }

    // EXP Gem: SHARED EXP for all teammates!
    for (const player of this.players.values()) {
      const leveledUp = player.addExp(pickup.value);
      if (leveledUp) {
        player.stats.hp = player.stats.maxHp; // 100% Full Heal on Level-Up!
        player.isChoosingTrait = true;
        this.isPaused = true;
        this.triggerLevelUpChoices(player);
      }
    }
  }

  private updateTimedWorldSpawns(dt: number): void {
    if (this.isPaused || this.isOver) return;

    // Guaranteed Tome of Ascension Drop every 3 waves (Waves 3, 6, 9, 12, 15...)
    if (this.hordeDirector.checkTomeDropTrigger()) {
      const alivePlayers = Array.from(this.players.values()).filter((p) => !p.isDead);
      if (alivePlayers.length > 0) {
        const avgX = alivePlayers.reduce((sum, p) => sum + p.x, 0) / alivePlayers.length;
        const avgY = alivePlayers.reduce((sum, p) => sum + p.y, 0) / alivePlayers.length;
        const angle = Math.random() * Math.PI * 2;
        const dist = 55 + Math.random() * 40;
        this.pickups.push({
          id: ++this.nextPickupId,
          type: PickupType.TOME_OF_ASCENSION,
          x: Math.round(avgX + Math.cos(angle) * dist),
          y: Math.round(avgY + Math.sin(angle) * dist),
          value: 1,
          radius: 20
        });
      }
    }

    this.worldSpawnTimer += dt;
    if (this.worldSpawnTimer >= 30.0) {
      this.worldSpawnTimer = 0;
      // Spawn random world drop within [-1800, 1800]
      const spawnX = (Math.random() * 2 - 1) * 1800;
      const spawnY = (Math.random() * 2 - 1) * 1800;
      const isChest = Math.random() < 0.65;

      this.pickups.push({
        id: ++this.nextPickupId,
        type: isChest ? PickupType.TREASURE_CHEST : PickupType.HEALTH_POTION,
        x: Math.round(spawnX),
        y: Math.round(spawnY),
        value: isChest ? (8 + Math.floor(Math.random() * 5)) : 40,
        radius: 18,
        duration: 60.0,
        maxDuration: 60.0
      });
    }
  }

  private updateShrines(alivePlayers: ServerPlayer[], dt: number): void {
    if (this.isPaused || this.isOver) return;

    this.shrineSpawnTimer += dt;
    if (this.shrineSpawnTimer >= 35.0 && this.shrines.length < 2) {
      this.shrineSpawnTimer = 0;
      const types = [
        ShrineType.SPEED,
        ShrineType.FRENZY,
        ShrineType.AEGIS,
        ShrineType.GOLD_RUSH,
        ShrineType.ALTAR_BLOOD,
        ShrineType.ALTAR_TEMPEST,
        ShrineType.ALTAR_VOID
      ];
      const pickedType = types[Math.floor(Math.random() * types.length)];
      const spawnX = (Math.random() * 2 - 1) * 1400;
      const spawnY = (Math.random() * 2 - 1) * 1400;

      this.shrines.push({
        id: ++this.nextShrineId,
        type: pickedType,
        x: Math.round(spawnX),
        y: Math.round(spawnY),
        duration: 45.0,
        maxDuration: 45.0,
        active: true
      });
    }

    for (let i = this.shrines.length - 1; i >= 0; i--) {
      const s = this.shrines[i];
      s.duration -= dt;

      if (s.duration <= 0) {
        this.shrines.splice(i, 1);
        continue;
      }

      for (const player of alivePlayers) {
        if (Math.hypot(player.x - s.x, player.y - s.y) <= player.radius + 28) {
          if (s.type === ShrineType.ALTAR_BLOOD) {
            // Player sacrifices 30% current HP for +35% permanent DMG
            player.applyShrineBuff(s.type, 0);
            this.broadcastDamageNumber(player.x, player.y - 25, 0, true, '🩸 BLOOD SACRIFICE! +35% DMG', '#ef4444');
          } else if (s.type === ShrineType.ALTAR_TEMPEST) {
            // Grants all alive players 45s storm aura & +40% speed
            for (const p of alivePlayers) {
              p.applyShrineBuff(s.type, 45.0);
            }
            this.broadcastDamageNumber(player.x, player.y - 25, 0, false, '⚡ TEMPEST WRATH! (45s)', '#38bdf8');
          } else if (s.type === ShrineType.ALTAR_VOID) {
            // Spawns Elite Void Guardian boss which drops Tome of Ascension + 6 Gold coins!
            const boss = new ServerMonster(
              this.hordeDirector.getNextEntityId(),
              MonsterType.VOID_WARLOCK,
              s.x + 30,
              s.y + 30,
              4.5,
              1.6,
              1.1,
              true,
              'Elite Void Guardian'
            );
            this.monsters.set(boss.id, boss);
            this.monsterGrid.insert(boss);
            this.broadcastDamageNumber(s.x, s.y - 25, 0, true, '🌌 VOID INVASION!', '#a855f7');
          } else {
            const buffDuration =
              s.type === ShrineType.SPEED ? 10.0 : s.type === ShrineType.FRENZY ? 8.0 : s.type === ShrineType.AEGIS ? 5.0 : 12.0;

            // Grant buff to all alive players
            for (const p of alivePlayers) {
              p.applyShrineBuff(s.type, buffDuration);
            }
          }
          this.shrines.splice(i, 1);
          break;
        }
      }
    }
  }

  private triggerLevelUpChoices(player: ServerPlayer): void {
    const getSkillRank = (id: string, s: PlayerSkills): number => {
      switch (id) {
        // Swordsman
        case 'swordsman_whirlwind': return s.bladeWhirlwindRank || 0;
        case 'swordsman_shockwave': return s.shockwaveSlashRank || 0;
        case 'swordsman_retaliation': return s.ironRetaliationRank || 0;
        case 'sw_rend_tear': return s.rendAndTearRank || 0;
        case 'sw_fortress_stance': return s.fortressStanceRank || 0;
        case 'swordsman_blood_cleave': return s.bloodCleaveRank || 0;
        case 'swordsman_shield_bash': return s.shieldBashRank || 0;
        // Archer
        case 'archer_multishot': return s.multishotRank || 0;
        case 'archer_lightning': return s.lightningArrowRank || 0;
        case 'archer_windrunner': return s.windrunnerRank || 0;
        case 'ar_rain_of_arrows': return s.rainOfArrowsRank || 0;
        case 'ar_deadeye_pierce': return s.deadeyePierceRank || 0;
        case 'archer_explosive_arrow': return s.explosiveShotRank || 0;
        case 'archer_frost_trap': return s.frostTrapRank || 0;
        // Sorceress
        case 'sorceress_orbs': return s.orbitingOrbsRank || 0;
        case 'sorceress_frost': return s.frostNovaRank || 0;
        case 'sorceress_overcharge': return s.lightningOverchargeRank || 0;
        case 'so_glacial_shatter': return s.glacialShatterRank || 0;
        case 'so_astral_aegis': return s.astralAegisRank || 0;
        case 'sorceress_meteor_strike': return s.meteorStrikeRank || 0;
        case 'sorceress_blizzard_ring': return s.blizzardRingRank || 0;
        // Cleric
        case 'cleric_heal_aura': return s.holyRadianceRank || 0;
        case 'cleric_judgment': return s.judgmentPillarsRank || 0;
        case 'cleric_aegis': return s.blessedAegisRank || 0;
        case 'cl_consecrated_ground': return s.consecratedGroundRank || 0;
        case 'cleric_heavenly_thunder': return s.heavenlyThunderRank || 0;
        case 'cleric_sanctum_barrier': return s.sanctumBarrierRank || 0;
        // Commando
        case 'commando_frag_grenade': return s.fragGrenadeRank || 0;
        case 'commando_airstrike': return s.airstrikeDroneRank || 0;
        case 'commando_ap_rounds': return s.apRoundsRank || 0;
        case 'commando_tactical_reload': return s.tacticalReloadRank || 0;
        // Cat Tank
        case 'cattank_nine_lives': return s.nineLivesRank || 0;
        case 'cattank_aggro_taunt': return s.aggroTauntRank || 0;
        case 'cattank_chonk_armor': return s.chonkArmorRank || 0;
        case 'cattank_hairball': return s.hairballLauncherRank || 0;
        // Cowboy
        case 'cowboy_quick_draw': return s.quickDrawFanRank || 0;
        case 'cowboy_hollow_point': return s.bountyHunterBountyRank || 0;
        case 'cowboy_lasso_upgrade': return s.ensnaringLassoRank || 0;
        case 'cowboy_tumble': return s.tumbleDodgeRank || 0;
        // Celestial Mecha
        case 'mecha_saber_overdrive': return s.beamSaberCleaveRank || 0;
        case 'mecha_laser_salvo': return s.wingLaserSalvoRank || 0;
        case 'mecha_gn_barrier': return s.gnBarrierShieldRank || 0;
        case 'mecha_thruster': return s.thrusterOverdriveRank || 0;
        // The Gambler
        case 'gambler_royal_flush': return s.fortuneCardsRank || 0;
        case 'gambler_loaded_dice': return s.luckyDiceRank || 0;
        case 'gambler_jackpot': return s.jackpot777SlotRank || 0;
        case 'gambler_fortune_greed': return s.highRollerGreedRank || 0;
        default: return -1;
      }
    };

    // 1. Check for eligible Weapon Evolutions
    const eligibleEvolutions: TraitOption[] = [];
    for (const evo of WEAPON_EVOLUTIONS) {
      if (evo.targetClass === player.playerClass) {
        const baseRank = (player.skills as any)[evo.baseSkillKey] || 0;
        const hasSynergy = player.acquiredTraits.includes(evo.synergyTraitId);
        const alreadyEvolved = (player.skills as any)[evo.evolvedSkillKey];
        if (baseRank >= evo.baseRankRequired && hasSynergy && !alreadyEvolved) {
          const evoTrait = TRAIT_POOL.find((t) => t.id === evo.id);
          if (evoTrait && !player.banishedTraits.has(evoTrait.id)) {
            eligibleEvolutions.push(evoTrait);
          }
        }
      }
    }

    // 2. Filter choices for player's class & tree unlocks & banished traits
    const availableTraits = TRAIT_POOL.filter((t) => {
      // Exclude evolution traits from normal random pool
      if (t.isEvolution) return false;
      // Exclude banished traits
      if (player.banishedTraits.has(t.id)) return false;
      // Class filter: universal or matches player class
      if (t.targetClass && t.targetClass !== player.playerClass) {
        return false;
      }
      // Skill Tree Unlock filter: signature skills MUST be unlocked in player's skill tree!
      if (t.isSignature) {
        if (!player.unlockedSkills.has(t.id)) {
          return false;
        }
      }
      // Multi-rank skill progression (Cap at Rank 3)
      const curRank = getSkillRank(t.id, player.skills);
      if (curRank >= 3) return false;

      // One-time passive acquisitions
      if (t.id === 'ar_static_caltrops' && player.skills.staticCaltrops) return false;
      if (t.id === 'so_static_field' && player.skills.staticField) return false;
      if (t.id === 'cl_heavenly_retrib' && player.skills.heavenlyRetribution) return false;
      if (t.id === 'sw_shield_bash' && player.skills.shieldBashShock) return false;

      return true;
    });

    const selectedTraits: TraitOption[] = [];
    const pool = [...availableTraits];

    // 3. Guaranteed Locked Trait (if valid and not already selected)
    if (player.lockedTraitId) {
      const lockedTrait = TRAIT_POOL.find((t) => t.id === player.lockedTraitId);
      if (lockedTrait && !player.banishedTraits.has(lockedTrait.id)) {
        const curRank = getSkillRank(lockedTrait.id, player.skills);
        if (curRank < 3) {
          selectedTraits.push(lockedTrait);
          const poolIdx = pool.findIndex((t) => t.id === lockedTrait.id);
          if (poolIdx !== -1) pool.splice(poolIdx, 1);
        }
      }
    }

    // 4. Guaranteed Eligible Evolution offer (front-and-center)
    for (const evo of eligibleEvolutions) {
      if (selectedTraits.length < 3 && !selectedTraits.some((st) => st.id === evo.id)) {
        selectedTraits.push(evo);
      }
    }

    // 5. Weighted random selection for remaining slots
    const getTraitWeight = (t: TraitOption): number => {
      if (t.rarity === 'legendary') return 0.20;
      if (t.isSignature) return 0.40;
      return 1.0;
    };

    while (selectedTraits.length < 3 && pool.length > 0) {
      const totalWeight = pool.reduce((sum, t) => sum + getTraitWeight(t), 0);
      let rand = Math.random() * totalWeight;
      let chosenIdx = 0;
      for (let i = 0; i < pool.length; i++) {
        rand -= getTraitWeight(pool[i]);
        if (rand <= 0) {
          chosenIdx = i;
          break;
        }
      }
      selectedTraits.push(pool[chosenIdx]);
      pool.splice(chosenIdx, 1);
    }

    const choices = selectedTraits.map((t) => {
      const curRank = getSkillRank(t.id, player.skills);
      let displayName = t.name;
      let displayThaiName = t.thaiName || t.name;
      if (curRank >= 0) {
        displayName = `[Rank ${curRank + 1}/3] ${t.name}`;
        displayThaiName = `[ขั้น ${curRank + 1}/3] ${t.thaiName || t.name}`;
      }
      return {
        id: t.id,
        name: displayName,
        desc: t.description,
        thaiName: displayThaiName,
        thaiDesc: t.thaiDesc || t.description,
        rarity: t.rarity,
        icon: t.icon,
        isEvolution: t.isEvolution,
        evolutionTitle: t.evolutionTitle
      };
    });

    this.sendCallback(player.id, {
      type: 'LEVEL_UP_CHOICE',
      choices,
      potionRerolls: player.potionRerolls,
      potionBanishes: player.potionBanishes,
      potionLocks: player.potionLocks,
      lockedTraitId: player.lockedTraitId
    });
  }

  private broadcastDamageNumber(x: number, y: number, amount: number, isCrit: boolean, label?: string, color?: string): void {
    this.damageNumbers.push({
      id: ++this.nextDmgId,
      x: Math.round(x),
      y: Math.round(y),
      amount: Math.round(amount),
      isCrit,
      label,
      color
    });
  }

  private broadcastTick(): void {
    const tickData: GameStateTick = {
      tick: this.tickCount,
      timeRemaining: Math.max(0, GAME_CONSTANTS.STAGE_DURATION_SECONDS - this.hordeDirector.getElapsedTime()),
      isPaused: this.isPaused,
      currentWave: this.hordeDirector.getCurrentWave(),
      maxWaves: HordeDirector.MAX_WAVES,
      waveTimeRemaining: Math.round(this.hordeDirector.getWaveTimeRemaining()),
      isBossWave: this.hordeDirector.isBossWave(),
      bossName: this.hordeDirector.getBossName(),
      bossAlive: this.hordeDirector.isBossAlive(),
      players: Array.from(this.players.values()).map((p) => p.toNetworkData()),
      monsters: Array.from(this.monsters.values()).map((m) => ({
        id: m.id,
        type: m.type,
        x: Math.round(m.x),
        y: Math.round(m.y),
        hpPercent: m.hpPercent,
        isBoss: m.isBoss,
        bossName: m.bossName
      })),
      projectiles: this.projectiles.map((p) => ({
        id: p.id,
        type: p.type,
        x: Math.round(p.x),
        y: Math.round(p.y),
        targetX: Math.round(p.vx),
        targetY: Math.round(p.vy),
        angle: Math.atan2(p.vy, p.vx),
        radius: p.radius
      })),
      pickups: this.pickups.map((p) => ({
        id: p.id,
        type: p.type,
        x: Math.round(p.x),
        y: Math.round(p.y),
        value: p.value,
        duration: p.duration,
        maxDuration: p.maxDuration
      })),
      shrines: this.shrines.map((s) => ({
        id: s.id,
        type: s.type,
        x: s.x,
        y: s.y,
        duration: s.duration,
        maxDuration: s.maxDuration,
        active: s.active
      })),
      damageNumbers: this.damageNumbers,
      totalKills: this.totalKills,
      teamGold: this.teamGold,
      stageId: this.stageId
    };

    this.broadcast({
      type: 'TICK',
      data: tickData
    });
  }

  private broadcast(msg: ServerMessage): void {
    for (const [id] of this.players) {
      this.sendCallback(id, msg);
    }
  }
}
