export enum PlayerClass {
  SWORDSMAN = 'swordsman',
  ARCHER = 'archer',
  SORCERESS = 'sorceress',
  CLERIC = 'cleric',
  COMMANDO = 'commando',
  CAT_TANK = 'cat_tank',
  COWBOY = 'cowboy',
  CELESTIAL_MECHA = 'celestial_mecha',
  GAMBLER = 'gambler'
}

export enum MonsterType {
  SKELETON = 0,
  ZOMBIE = 1,
  IMP = 2,
  HELLHOUND = 3,
  ELITE_GOLEM = 4,
  LORD_OF_TORMENT = 5,
  SKELETON_ARCHER = 6,
  MAGMA_IMP = 7,
  VOID_WARLOCK = 8
}

export enum ElementType {
  PHYSICAL_BLEED = 'physical_bleed',
  LIGHTNING_FROST = 'lightning_frost',
  WIND_PIERCE = 'wind_pierce',
  HOLY_LIGHT = 'holy_light',
  BALLISTIC_FIRE = 'ballistic_fire',
  CHONK_FORTRESS = 'chonk_fortress',
  DEADEYE_PIERCE = 'deadeye_pierce',
  CELESTIAL_PLASMA = 'celestial_plasma',
  LUCKY_ARCANE = 'lucky_arcane'
}

export enum PickupType {
  EXP_GEM_SMALL = 0,
  EXP_GEM_MEDIUM = 1,
  EXP_GEM_LARGE = 2,
  HEALTH_POTION = 3,
  GOLD_COIN = 4,
  WELL_GEAR = 5,
  TOME_OF_ASCENSION = 6,
  TREASURE_CHEST = 7,
  MAGNET = 8
}

export enum ProjectileType {
  SWORD_CLEAVE = 0,
  ARROW = 1,
  CHAIN_LIGHTNING = 2,
  HOLY_SMITE = 3,
  ENEMY_FIREBALL = 4,
  SHOCKWAVE_SLASH = 5,
  ORBITING_ORB = 6,
  FROST_NOVA = 7,
  HOLY_AURA_PULSE = 8,
  JUDGMENT_PILLAR = 9,
  LIGHTNING_DISCHARGE = 10,
  WHIRLWIND_360 = 11,
  ENEMY_ARROW = 12,
  ENEMY_VOID_ORB = 13,
  BLOOD_CLEAVE_WAVE = 14,
  EXPLOSIVE_ARROW = 15,
  FROST_TRAP = 16,
  METEOR_STRIKE = 17,
  HEAVENLY_THUNDER = 18,
  SANCTUM_BARRIER = 19,
  M4A1_BULLET = 20,
  FRAG_GRENADE = 21,
  CAT_BELLY_SLAM = 22,
  CAT_HAIRBALL = 23,
  CRIMSON_TEMPEST_SLASH = 24,
  BLIZZARD_VOLLEY_ARROW = 25,
  HELLFIRE_METEOR = 26,
  CLUSTER_BOMB = 27,
  TITAN_QUAKE_WAVE = 28,
  REVOLVER_BULLET = 29,
  COWBOY_LASSO = 30,
  BEAM_SABER_SLASH = 31,
  WING_LASER_BEAM = 32,
  GAMBLER_CARD = 33,
  LUCKY_DICE = 34,
  SLOT_COIN_RAIN = 35,
  MAGNET_PULL_SPARK = 36
}

export enum ShrineType {
  SPEED = 'SPEED',
  FRENZY = 'FRENZY',
  AEGIS = 'AEGIS',
  GOLD_RUSH = 'GOLD_RUSH',
  ALTAR_BLOOD = 'ALTAR_BLOOD',
  ALTAR_TEMPEST = 'ALTAR_TEMPEST',
  ALTAR_VOID = 'ALTAR_VOID'
}

export interface ShrineData {
  id: number;
  type: ShrineType;
  x: number;
  y: number;
  duration: number;
  maxDuration: number;
  active: boolean;
}

export interface PlayerSkills {
  // Swordsman
  bladeWhirlwind: boolean;
  bladeWhirlwindRank: number;
  shockwaveSlash: boolean;
  shockwaveSlashRank: number;
  ironRetaliation: boolean;
  ironRetaliationRank: number;
  rendAndTearRank: number;
  fortressStanceRank: number;
  shieldBashShock: boolean;
  bloodCleave: boolean;
  bloodCleaveRank: number;
  shieldBash: boolean;
  shieldBashRank: number;

  // Archer
  lightningArrow: boolean;
  lightningArrowRank: number;
  multishot: boolean;
  multishotRank: number;
  windrunner: boolean;
  windrunnerRank: number;
  rainOfArrowsRank: number;
  deadeyePierceRank: number;
  staticCaltrops: boolean;
  explosiveShot: boolean;
  explosiveShotRank: number;
  frostTrap: boolean;
  frostTrapRank: number;

  // Sorceress
  orbitingOrbs: number;
  orbitingOrbsRank: number;
  lightningOvercharge: boolean;
  lightningOverchargeRank: number;
  frostNova: boolean;
  frostNovaRank: number;
  glacialShatterRank: number;
  astralAegisRank: number;
  staticField: boolean;
  meteorStrike: boolean;
  meteorStrikeRank: number;
  blizzardRing: boolean;
  blizzardRingRank: number;

  // Cleric
  holyRadianceHeal: boolean;
  holyRadianceRank: number;
  judgmentPillars: boolean;
  judgmentPillarsRank: number;
  blessedAegis: boolean;
  blessedAegisRank: number;
  consecratedGroundRank: number;
  heavenlyRetribution: boolean;
  heavenlyThunder: boolean;
  heavenlyThunderRank: number;
  sanctumBarrier: boolean;
  sanctumBarrierRank: number;

  // Commando
  fragGrenade: boolean;
  fragGrenadeRank: number;
  airstrikeDrone: boolean;
  airstrikeDroneRank: number;
  apRoundsRank: number;
  tacticalReloadRank: number;

  // Cat Tank
  nineLives: boolean;
  nineLivesRank: number;
  nineLivesUsed: boolean;
  aggroTaunt: boolean;
  aggroTauntRank: number;
  hairballLauncher: boolean;
  hairballLauncherRank: number;
  chonkArmorRank: number;

  // Cowboy
  quickDrawFan: boolean;
  quickDrawFanRank: number;
  ensnaringLasso: boolean;
  ensnaringLassoRank: number;
  bountyHunterBountyRank: number;
  tumbleDodgeRank: number;

  // Celestial Mecha
  beamSaberCleave: boolean;
  beamSaberCleaveRank: number;
  wingLaserSalvo: boolean;
  wingLaserSalvoRank: number;
  gnBarrierShield: boolean;
  gnBarrierShieldRank: number;
  thrusterOverdriveRank: number;

  // The Gambler
  fortuneCards: boolean;
  fortuneCardsRank: number;
  luckyDice: boolean;
  luckyDiceRank: number;
  jackpot777Slot: boolean;
  jackpot777SlotRank: number;
  highRollerGreedRank: number;

  // Mythic Evolutions
  crimsonTempest?: boolean;
  aegisOfBastion?: boolean;
  blizzardVolley?: boolean;
  hellfireCataclysm?: boolean;
  absoluteZeroSphere?: boolean;
  wrathThunderGod?: boolean;
  clusterThermite?: boolean;
  titanEarthquake?: boolean;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  moveSpeed: number;
  attackSpeed: number; // Attacks per second multiplier
  damageBonus: number; // Multiplier, 1.0 = base
  flatDamage: number;
  critChance: number; // 0.05 = 5%
  critBonus: number;  // 1.0 = 200% crit dmg
  areaMultiplier: number;
  pickupRadius: number;
  defense: number;
  level: number;
  exp: number;
  maxExp: number;
  expMultiplier?: number;
  tierLuck?: number; // % shift toward rarer (S/A) level-up card tiers, see getTierWeight()
}

export interface TraitOption {
  id: string;
  name: string;
  description: string;
  thaiName?: string;
  thaiDesc?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
  targetClass?: PlayerClass; // If defined, only given to this class
  isSignature?: boolean;     // Requires unlocking in Skill Tree
  isEvolution?: boolean;     // Mythic weapon union evolution
  evolutionTitle?: string;
  element?: ElementType;
  apply: (stats: PlayerStats, skills: PlayerSkills) => void;
}

/** A static, collidable dungeon obstacle scattered around a stage's arena (see stages.ts generateStageProps). */
export interface PropInstance {
  id: number;
  kind: 'PILLAR' | 'SPIKE' | 'RUBBLE';
  x: number;
  y: number;
  radius: number; // Collision radius — players & monsters are blocked from entering it.
}

export interface PlayerNetworkData {
  id: string;
  name: string;
  playerClass: PlayerClass;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  aimAngle: number;
  isAttacking: boolean;
  attackSeq: number;
  isDead: boolean;
  isChoosingTrait?: boolean;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  skills?: PlayerSkills;
  areaMultiplier?: number;
  isDashing?: boolean;
  dashCooldownRemaining?: number;
  activeBuff?: { type: ShrineType; durationRemaining: number };
  stats?: PlayerStats;
  acquiredTraits?: string[];
  potionRerolls?: number;
  potionBanishes?: number;
  potionLocks?: number;
  lockedTraitId?: string | null;
}

export interface MonsterNetworkData {
  id: number;
  type: MonsterType;
  x: number;
  y: number;
  hpPercent: number; // 0 - 100
  isBoss?: boolean;
  bossName?: string;
}

export interface ProjectileNetworkData {
  id: number;
  type: ProjectileType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  radius: number;
  isCrit?: boolean;
}

export interface PickupNetworkData {
  id: number;
  type: PickupType;
  x: number;
  y: number;
  value: number;
  duration?: number;
  maxDuration?: number;
}

export interface DamageNumberData {
  id: number;
  x: number;
  y: number;
  amount: number;
  isCrit: boolean;
  label?: string;
  color?: string;
}

export interface GameStateTick {
  tick: number;
  elapsedTime: number;
  isPaused?: boolean;
  currentWave: number;
  maxWaves: number;
  waveTimeRemaining: number;
  isBossWave: boolean;
  bossName?: string;
  bossAlive?: boolean;
  players: PlayerNetworkData[];
  monsters: MonsterNetworkData[];
  projectiles: ProjectileNetworkData[];
  pickups: PickupNetworkData[];
  shrines?: ShrineData[];
  damageNumbers: DamageNumberData[];
  totalKills: number;
  teamGold: number;
  stageId?: number;
  // Seconds left before the final-boss (wave 30) execute deadline fires — see
  // HordeDirector.isInDeadlineWarning(). null until the warning window actually starts
  // (the first BOSS_DEADLINE_GRACE_SEC of the encounter show no countdown at all).
  bossDeadlineRemaining?: number | null;
}

export type ClientMessage =
  | {
      type: 'JOIN_LOBBY';
      name: string;
      playerClass: PlayerClass;
      unlockedSkills?: string[];
      treePassives?: Record<string, number>;
      partyCode?: string;
      deviceId?: string;
    }
  | { type: 'READY_UP'; ready: boolean }
  | { type: 'START_GAME'; stageId?: number }
  | { type: 'INPUT'; moveX: number; moveY: number; aimAngle: number; isAttacking: boolean }
  | { type: 'DASH'; aimAngle?: number }
  | { type: 'SELECT_TRAIT'; traitId: string }
  | { type: 'USE_POTION'; action: 'REROLL' | 'BANISH' | 'LOCK'; traitId?: string }
  | { type: 'SEND_WELL_GEAR'; gearId: string }
  | { type: 'SURRENDER' }
  | { type: 'PAUSE_GAME'; isPaused: boolean }
  | { type: 'CREATE_ROOM'; roomName?: string }
  | { type: 'LIST_ROOMS' }
  | { type: 'JOIN_ROOM'; roomId: string }
  | { type: 'LEAVE_ROOM' };

/** One entry in the public room browser (see server.ts's room list) — everyone who's
 * logged in and not currently in a room sees this list and can join any of them directly. */
export interface RoomSummary {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  isStarted: boolean;
}

export type ServerMessage =
  | { type: 'JOIN_REJECTED'; reason: string }
  | { type: 'LOBBY_STATE'; players: { id: string; name: string; playerClass: PlayerClass; ready: boolean }[]; isStarted: boolean; stageId?: number }
  | { type: 'GAME_START'; yourId: string; stageId?: number; props?: PropInstance[] }
  | { type: 'TICK'; data: GameStateTick }
  | {
      type: 'LEVEL_UP_CHOICE';
      choices: {
        id: string;
        name: string;
        desc: string;
        rarity: string;
        tier: string; // S/A/B/C/D power tier derived from rarity, see getPowerTier()
        icon: string;
        thaiName?: string;
        thaiDesc?: string;
        isEvolution?: boolean;
        evolutionTitle?: string;
        isSignature?: boolean; // Personal/signature class skill vs. a universal card
      }[];
      potionRerolls?: number;
      potionBanishes?: number;
      potionLocks?: number;
      lockedTraitId?: string | null;
    }
  | {
      type: 'POTION_UPDATE';
      potionRerolls: number;
      potionBanishes: number;
      potionLocks: number;
      lockedTraitId?: string | null;
    }
  | { type: 'WELL_GEAR_RETRIEVED'; gearName: string; retrievedBy: string }
  | { type: 'ROOM_LIST'; rooms: RoomSummary[] }
  | { type: 'GRANT_GOLD'; amount: number; message: string; thaiMessage: string; grantId?: string }
  | { type: 'GAME_OVER'; victory: boolean; survivalTime: number; totalKills: number; teamGold: number; personalGold: number; playerCount: number; clearedStageId?: number; reason?: 'BOSS_ENRAGE_EXECUTE' };
