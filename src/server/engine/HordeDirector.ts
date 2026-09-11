import { MonsterType } from '../../shared/types';
import { GAME_CONSTANTS } from '../../shared/constants';
import { STAGES } from '../../shared/stages';

export interface SpawnRequest {
  id: number;
  type: MonsterType;
  hpScale: number;
  dmgScale: number;
  speedScale: number;
  isBoss: boolean;
  bossName?: string;
}

export class HordeDirector {
  public static readonly MAX_WAVES = 30;
  public static readonly WAVE_DURATION_SEC = 40; // 40s per wave = 1200s (20 mins) total run

  // Hard deadline for the final-wave boss encounter (see isDeadlineExpired()). Without this,
  // a final boss the party can't kill (and nobody surrenders) leaves the room's tick loop
  // running forever — no other end condition in GameRoom.tick() covers this case. Deliberately
  // a flat timeout + guaranteed execute rather than gradual enrage/attrition: smallest test
  // surface, easiest to reason about/debug, and it guarantees the match actually ends.
  public static readonly BOSS_DEADLINE_GRACE_SEC = 90; // no countdown shown yet — let players get their bearings
  public static readonly BOSS_DEADLINE_WARNING_SEC = 210; // countdown-visible window after grace
  public static readonly BOSS_DEADLINE_TOTAL_SEC =
    HordeDirector.BOSS_DEADLINE_GRACE_SEC + HordeDirector.BOSS_DEADLINE_WARNING_SEC; // 300s (5 min) total

  private stageId: number = 1;
  private stageHpMult: number = 1.0;
  private stageDmgMult: number = 1.0;
  private stageSpeedMult: number = 1.0;

  private elapsedTime: number = 0;
  private currentWave: number = 1;
  private waveTimer: number = HordeDirector.WAVE_DURATION_SEC;
  private nextEntityId: number = 1000;
  private spawnAccumulator: number = 0;
  private bossSpawnedForWave: boolean = false;
  private bossAlive: boolean = false;
  // Set once the party picks "Continue" on the post-wave-30 victory screen (GameRoom.
  // handleContinueRun) — lifts the wave-30 cap so waves keep advancing indefinitely, with the
  // Lord of Torment cycling back in as the boss checkpoint every 5 waves.
  private endlessMode: boolean = false;
  private pendingTomeDrop: boolean = false;
  // Seconds spent in the FINAL wave's boss encounter specifically (not earlier boss waves at
  // 5/10/15/20/25 — those can't soft-lock the room since a normal wave always follows them).
  private bossEncounterTimer: number = 0;

  constructor(stageId: number = 1) {
    this.setStage(stageId);
  }

  public setStage(stageId: number): void {
    this.stageId = stageId;
    const stage = STAGES[stageId] || STAGES[1];
    this.stageHpMult = stage.mobHpMultiplier;
    this.stageDmgMult = stage.mobDmgMultiplier;
    this.stageSpeedMult = 1.0 + (stageId - 1) * 0.1;
  }

  public getStageId(): number {
    return this.stageId;
  }

  public getNextEntityId(): number {
    return ++this.nextEntityId;
  }

  public enableEndlessMode(): void {
    this.endlessMode = true;
  }

  public isEndlessMode(): boolean {
    return this.endlessMode;
  }

  public update(dt: number, playerCount: number, activeMonsterCount: number): SpawnRequest[] {
    this.elapsedTime += dt;
    this.waveTimer -= dt;

    // Advance to next wave:
    // If it's a boss wave, the boss MUST be defeated before wave can advance!
    const isBossBlocking = this.isBossWave() && this.bossAlive;
    if (isBossBlocking && this.waveTimer < 0) {
      this.waveTimer = 0; // Hold at 0 during boss encounter
    }

    // Final-wave execute deadline: ticks during the wave-30 boss encounter, and — once the party
    // has opted into endless mode — every later Lord of Torment checkpoint too (wave 35, 40, ...),
    // since each of those can just as easily soft-lock the room as the original wave 30 fight.
    // Earlier boss waves (5/10/15/20/25) always resolve into a following normal wave, so they're
    // never affected. Resets immediately once the boss stops blocking (killed, or any other
    // reason), so a defeated-in-time boss never leaves a stale timer running into the next state.
    if (isBossBlocking && this.currentWave >= HordeDirector.MAX_WAVES) {
      this.bossEncounterTimer += dt;
    } else {
      this.bossEncounterTimer = 0;
    }

    if (!isBossBlocking && this.waveTimer <= 0 && (this.currentWave < HordeDirector.MAX_WAVES || this.endlessMode)) {
      this.currentWave++;
      this.waveTimer = HordeDirector.WAVE_DURATION_SEC;
      this.bossSpawnedForWave = false;
      this.bossAlive = false;
      if (this.currentWave % 3 === 0) {
        this.pendingTomeDrop = true;
      }
    }

    const newSpawns: SpawnRequest[] = [];

    // Max monster cap
    const maxMonsters = 380 + (playerCount - 1) * 120;
    if (activeMonsterCount >= maxMonsters) {
      return newSpawns;
    }

    // Wave-based scaling multipliers (scaled by Stage difficulty)
    const waveProgress = (this.currentWave - 1) / (HordeDirector.MAX_WAVES - 1);
    const hpScale = (1.0 + (this.currentWave - 1) * 0.12) * this.stageHpMult;
    const dmgScale = (1.0 + (this.currentWave - 1) * 0.08) * this.stageDmgMult;
    const speedScale = (1.0 + Math.min(0.35, (this.currentWave - 1) * 0.015)) * this.stageSpeedMult;

    // Check Boss Wave Spawn (Every 5 waves: 5, 10, 15, 20, 25, 30)
    if (this.isBossWave() && !this.bossSpawnedForWave) {
      this.bossSpawnedForWave = true;
      this.bossAlive = true;
      const boss = this.createBossSpawn(this.currentWave, hpScale, dmgScale);
      newSpawns.push(boss);
    }

    // Regular horde spawns
    // Base spawn rate scales from 3 mobs/sec at Wave 1 up to 18 mobs/sec at Wave 30
    let baseRate = 3.0 + waveProgress * 15.0;
    if (isBossBlocking) {
      // Throttle trash horde spawns to 35% during overtime boss battle to let players focus on boss
      baseRate *= 0.35;
    }
    const coOpMultiplier = 1.0 + (playerCount - 1) * GAME_CONSTANTS.COOP_SPAWN_SCALE_PER_PLAYER;
    const totalSpawnRate = baseRate * coOpMultiplier;

    this.spawnAccumulator += totalSpawnRate * dt;

    while (this.spawnAccumulator >= 1.0 && activeMonsterCount + newSpawns.length < maxMonsters) {
      this.spawnAccumulator -= 1.0;
      const type = this.pickMonsterType(this.currentWave);
      newSpawns.push({
        id: ++this.nextEntityId,
        type,
        hpScale,
        dmgScale,
        speedScale,
        isBoss: false
      });
    }

    return newSpawns;
  }

  public checkTomeDropTrigger(): boolean {
    if (this.pendingTomeDrop) {
      this.pendingTomeDrop = false;
      return true;
    }
    return false;
  }

  public isBossWave(): boolean {
    return this.currentWave % 5 === 0;
  }

  public getBossName(): string | undefined {
    if (this.currentWave > HordeDirector.MAX_WAVES && this.isBossWave()) {
      // wave 35 is the first post-victory checkpoint -> cycle 1 ("AWAKENING 1"), wave 40 -> 2, etc.
      const cycle = Math.floor((this.currentWave - HordeDirector.MAX_WAVES) / 5);
      return `THE LORD OF TORMENT — AWAKENING ${cycle}`;
    }
    switch (this.currentWave) {
      case 5:
        if (this.stageId === 2) return 'MAGMA OVERLORD VULCAN';
        if (this.stageId === 3) return 'VOID SHADOW ARCHON';
        return 'ELITE GOLEM OF TORMENT';
      case 10:
        if (this.stageId === 2) return 'PYROCLAST HELLHOUND PACK';
        if (this.stageId === 3) return 'ABYSSAL HORROR CERBERUS';
        return 'CERBERUS ALPHA HELLHOUND';
      case 15:
        if (this.stageId === 2) return 'INFERNO REVENANT CHIEFTAIN';
        if (this.stageId === 3) return 'VOID WEAVER LICH';
        return 'LICH KING NECROMANCER';
      case 20:
        return 'FROST REVENANT TITAN';
      case 25:
        return 'ABYSSAL VOID COLOSSUS';
      case 30:
        return 'THE LORD OF TORMENT';
      default:
        return undefined;
    }
  }

  private createBossSpawn(wave: number, baseHpScale: number, baseDmgScale: number): SpawnRequest {
    const bossName = this.getBossName()!;
    let type = MonsterType.ELITE_GOLEM;
    // Wave 5 was nerfed from 12.0 down to 5.2 to eliminate a tedious slog, then re-buffed to
    // 8.0 (2026-09-11) once it had actual abilities (Ground Slam + Boulder Toss ranged, see
    // updateBossAbilities) worth surviving for — the earlier nerf predates those and was
    // tuned for a boss that could only walk at you.
    let bossHpMultiplier = 8.0;

    if (wave === 5) {
      if (this.stageId === 2) {
        type = MonsterType.MAGMA_IMP;
        bossHpMultiplier = 8.5;
      } else if (this.stageId === 3) {
        type = MonsterType.VOID_WARLOCK;
        bossHpMultiplier = 9.0;
      } else {
        type = MonsterType.ELITE_GOLEM;
        bossHpMultiplier = 8.0;
      }
    } else if (wave === 10) {
      type = MonsterType.HELLHOUND;
      // Nerfed from 14.0, then re-buffed to 12.0 (2026-09-11) now that it has an actual ability
      // (Hellfire Spit, see updateBossAbilities) instead of being a pure fast melee chaser.
      bossHpMultiplier = 12.0;
    } else if (wave === 15) {
      type = this.stageId === 2 ? MonsterType.MAGMA_IMP : this.stageId === 3 ? MonsterType.VOID_WARLOCK : MonsterType.ELITE_GOLEM;
      bossHpMultiplier = 12.0; // Nerfed from 18.0
    } else if (wave === 20) {
      type = MonsterType.ELITE_GOLEM;
      bossHpMultiplier = 15.0; // Nerfed from 24.0
    } else if (wave === 25) {
      type = MonsterType.ELITE_GOLEM;
      bossHpMultiplier = 18.0; // Nerfed from 30.0
    } else if (wave === 30) {
      type = MonsterType.LORD_OF_TORMENT;
      bossHpMultiplier = 26.0; // Nerfed from 45.0
    } else if (wave > 30) {
      // Endless mode (past the wave-30 victory, see GameRoom.handleContinueRun): the Lord of
      // Torment keeps coming back every 5 waves, escalating past the wave-30 baseline.
      type = MonsterType.LORD_OF_TORMENT;
      const cycle = Math.floor((wave - 30) / 5);
      bossHpMultiplier = 26.0 + cycle * 8.0;
    }

    return {
      id: ++this.nextEntityId,
      type,
      hpScale: baseHpScale * bossHpMultiplier,
      dmgScale: baseDmgScale * 1.5,
      speedScale: 1.05,
      isBoss: true,
      bossName
    };
  }

  private pickMonsterType(wave: number): MonsterType {
    const rand = Math.random();

    // Thematic Ranged Spawns based on Stage and Wave (Nerfed spawn ratios & delayed to Wave 3+)
    if (this.stageId === 2 && rand < 0.10 && wave >= 3) {
      return MonsterType.MAGMA_IMP;
    }
    if (this.stageId === 3 && rand < 0.09 && wave >= 3) {
      return MonsterType.VOID_WARLOCK;
    }
    if (rand < 0.07 && wave >= 3) {
      return MonsterType.SKELETON_ARCHER;
    }

    if (wave <= 4) {
      return MonsterType.SKELETON;
    } else if (wave <= 9) {
      return rand < 0.65 ? MonsterType.SKELETON : MonsterType.ZOMBIE;
    } else if (wave <= 14) {
      if (rand < 0.40) return MonsterType.SKELETON;
      if (rand < 0.75) return MonsterType.ZOMBIE;
      return MonsterType.IMP;
    } else if (wave <= 24) {
      if (rand < 0.30) return MonsterType.SKELETON;
      if (rand < 0.55) return MonsterType.ZOMBIE;
      if (rand < 0.80) return MonsterType.IMP;
      return MonsterType.HELLHOUND;
    } else {
      if (rand < 0.20) return MonsterType.SKELETON;
      if (rand < 0.45) return MonsterType.ZOMBIE;
      if (rand < 0.70) return MonsterType.IMP;
      return MonsterType.HELLHOUND;
    }
  }

  public onBossDefeated(): void {
    this.bossAlive = false;
    // 3-second victory celebration to collect loot/tome before advancing to next wave
    this.waveTimer = 3.0;
  }

  public isBossAlive(): boolean {
    return this.isBossWave() && this.bossAlive;
  }

  public getCurrentWave(): number {
    return this.currentWave;
  }

  public getWaveTimeRemaining(): number {
    return Math.max(0, this.waveTimer);
  }

  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  /** True once the grace period has elapsed and the countdown should become visible to players. */
  public isInDeadlineWarning(): boolean {
    return this.bossEncounterTimer > HordeDirector.BOSS_DEADLINE_GRACE_SEC;
  }

  /** Seconds left before isDeadlineExpired() fires — only meaningful once isInDeadlineWarning() is true. */
  public deadlineSecondsRemaining(): number {
    return Math.max(0, HordeDirector.BOSS_DEADLINE_TOTAL_SEC - this.bossEncounterTimer);
  }

  /** True once the final-boss encounter has run past the hard deadline — GameRoom must force-end the match. */
  public isDeadlineExpired(): boolean {
    return this.bossEncounterTimer >= HordeDirector.BOSS_DEADLINE_TOTAL_SEC;
  }
}
