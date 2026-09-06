import { PlayerClass, PlayerStats, TraitOption, PlayerSkills, ElementType } from './types';

export const DEFAULT_PLAYER_SKILLS: PlayerSkills = {
  // Swordsman
  bladeWhirlwind: false,
  bladeWhirlwindRank: 0,
  shockwaveSlash: false,
  shockwaveSlashRank: 0,
  ironRetaliation: false,
  ironRetaliationRank: 0,
  rendAndTearRank: 0,
  fortressStanceRank: 0,
  shieldBashShock: false,
  bloodCleave: false,
  bloodCleaveRank: 0,
  shieldBash: false,
  shieldBashRank: 0,

  // Archer
  lightningArrow: false,
  lightningArrowRank: 0,
  multishot: false,
  multishotRank: 0,
  windrunner: false,
  windrunnerRank: 0,
  rainOfArrowsRank: 0,
  deadeyePierceRank: 0,
  staticCaltrops: false,
  explosiveShot: false,
  explosiveShotRank: 0,
  frostTrap: false,
  frostTrapRank: 0,

  // Sorceress
  orbitingOrbs: 0,
  orbitingOrbsRank: 0,
  lightningOvercharge: false,
  lightningOverchargeRank: 0,
  frostNova: false,
  frostNovaRank: 0,
  glacialShatterRank: 0,
  astralAegisRank: 0,
  staticField: false,
  meteorStrike: false,
  meteorStrikeRank: 0,
  blizzardRing: false,
  blizzardRingRank: 0,

  // Cleric
  holyRadianceHeal: false,
  holyRadianceRank: 0,
  judgmentPillars: false,
  judgmentPillarsRank: 0,
  blessedAegis: false,
  blessedAegisRank: 0,
  consecratedGroundRank: 0,
  heavenlyRetribution: false,
  heavenlyThunder: false,
  heavenlyThunderRank: 0,
  sanctumBarrier: false,
  sanctumBarrierRank: 0,

  // Commando
  fragGrenade: false,
  fragGrenadeRank: 0,
  airstrikeDrone: false,
  airstrikeDroneRank: 0,
  apRoundsRank: 0,
  tacticalReloadRank: 0,

  // Cat Tank
  nineLives: false,
  nineLivesRank: 0,
  nineLivesUsed: false,
  aggroTaunt: false,
  aggroTauntRank: 0,
  hairballLauncher: false,
  hairballLauncherRank: 0,
  chonkArmorRank: 0,

  // Cowboy
  quickDrawFan: false,
  quickDrawFanRank: 0,
  ensnaringLasso: false,
  ensnaringLassoRank: 0,
  bountyHunterBountyRank: 0,
  tumbleDodgeRank: 0,

  // Celestial Mecha
  beamSaberCleave: false,
  beamSaberCleaveRank: 0,
  wingLaserSalvo: false,
  wingLaserSalvoRank: 0,
  gnBarrierShield: false,
  gnBarrierShieldRank: 0,
  thrusterOverdriveRank: 0,

  // The Gambler
  fortuneCards: false,
  fortuneCardsRank: 0,
  luckyDice: false,
  luckyDiceRank: 0,
  jackpot777Slot: false,
  jackpot777SlotRank: 0,
  highRollerGreedRank: 0,

  // Mythic Evolutions
  crimsonTempest: false,
  aegisOfBastion: false,
  blizzardVolley: false,
  hellfireCataclysm: false,
  absoluteZeroSphere: false,
  wrathThunderGod: false,
  clusterThermite: false,
  titanEarthquake: false
};

export const CLASS_STARTER_SKILLS: Record<PlayerClass, Partial<PlayerSkills>> = {
  [PlayerClass.SWORDSMAN]: { bladeWhirlwind: true, bladeWhirlwindRank: 1 },
  [PlayerClass.ARCHER]: { multishot: true, multishotRank: 1 },
  [PlayerClass.SORCERESS]: { orbitingOrbs: 2, orbitingOrbsRank: 1 },
  [PlayerClass.CLERIC]: { holyRadianceHeal: true, holyRadianceRank: 1 },
  [PlayerClass.COMMANDO]: { fragGrenade: true, fragGrenadeRank: 1 },
  [PlayerClass.CAT_TANK]: { nineLives: true, nineLivesRank: 1, aggroTaunt: true, aggroTauntRank: 1 },
  [PlayerClass.COWBOY]: { ensnaringLasso: true, ensnaringLassoRank: 1 },
  [PlayerClass.CELESTIAL_MECHA]: { wingLaserSalvo: true, wingLaserSalvoRank: 1 },
  [PlayerClass.GAMBLER]: { luckyDice: true, luckyDiceRank: 1 }
};

export const CLASS_DEFINITIONS: Record<PlayerClass, {
  name: string;
  thaiName: string;
  title: string;
  thaiTitle: string;
  description: string;
  thaiDescription: string;
  element: ElementType;
  elementalTitle: string;
  elementIcon: string;
  specialization: string;
  thaiSpecialization: string;
  color: number;
  stats: PlayerStats;
  weaponName: string;
  thaiWeaponName: string;
  weaponCooldown: number; // in seconds (Paced & deliberate combat)
}> = {
  [PlayerClass.SWORDSMAN]: {
    name: 'Swordsman',
    thaiName: 'นักรบดาบเหล็ก',
    title: 'The Steel Bulwark',
    thaiTitle: 'กำแพงเหล็กกล้า',
    description: 'A steadfast frontliner with sweeping broadsword slashes, thick plate armor, and bleeding strikes.',
    thaiDescription: 'นักรบชุดเกราะหนัก ผู้เชี่ยวชาญการฟันกวาดดาบยักษ์ สร้างดาเมจเลือดออก และทนทานต่อการโจมตี',
    element: ElementType.PHYSICAL_BLEED,
    elementalTitle: '🩸 Rend & Crimson Steel',
    elementIcon: '🩸',
    specialization: 'High Defense, Bleed DoT & Melee Cleave',
    thaiSpecialization: 'เกราะหนา, เลือดออกต่อเนื่อง, ฟันกวาดระยะประชิด',
    color: 0x3a86ff,
    stats: {
      maxHp: 220,
      hp: 220,
      moveSpeed: 180,
      attackSpeed: 0.9,
      damageBonus: 1.0,
      flatDamage: 32,
      critChance: 0.07,
      critBonus: 1.35,
      areaMultiplier: 1.0,
      pickupRadius: 90,
      defense: 7,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Greatsword Cleave',
    thaiWeaponName: 'ฟันดาบยักษ์กวาดศัตรู',
    weaponCooldown: 1.15 // Nerfed from 0.85s for deliberate swing weight
  },
  [PlayerClass.ARCHER]: {
    name: 'Archer',
    thaiName: 'พลธนูวายุ',
    title: 'The Shadow Stalker',
    thaiTitle: 'เงาเพชฌฆาตมืด',
    description: 'Ranged precision striker with gale-force piercing arrows and lethal critical assassinations.',
    thaiDescription: 'พลธนูผู้รวดเร็ว ยิงธนูวายุเจาะทะลุศัตรูจากระยะไกล และสังหารด้วยคริติคอลปลิดชีพ',
    element: ElementType.WIND_PIERCE,
    elementalTitle: '🍃 Gale Force & Tempest Wind',
    elementIcon: '🍃',
    specialization: 'Sniper Velocity, Piercing Fans & Critical Multipliers',
    thaiSpecialization: 'ยิงไกลความเร็วสูง, ศรเจาะทะลวง, ตัวคูณคริติคอลรุนแรง',
    color: 0x06d6a0,
    stats: {
      maxHp: 130,
      hp: 130,
      moveSpeed: 205,
      attackSpeed: 1.1,
      damageBonus: 1.0,
      flatDamage: 24,
      critChance: 0.14,
      critBonus: 1.50,
      areaMultiplier: 1.0,
      pickupRadius: 85,
      defense: 2,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Piercing Longbow',
    thaiWeaponName: 'ศรวายุทะลวง',
    weaponCooldown: 0.90 // Nerfed from 0.55s
  },
  [PlayerClass.SORCERESS]: {
    name: 'Sorceress',
    thaiName: 'จอมเวทสายฟ้า',
    title: 'The Storm Weaver',
    thaiTitle: 'ผู้ควบคุมสายฟ้าสวรรค์',
    description: 'Master of elemental devastation, commanding arcing storm bolts and protective orbiting orbs.',
    thaiDescription: 'ผู้ควบคุมพลังเวท ร่ายสายฟ้าฟาดชิ่งต่อเนื่อง ลูกแก้วเวทมนตร์ และคลื่นความเย็นเยือกแข็งศัตรู',
    element: ElementType.LIGHTNING_FROST,
    elementalTitle: '⚡ Arcane Lightning & Frost',
    elementIcon: '⚡',
    specialization: 'Chaining Detonations, Frost Slows & Orbiting Defense',
    thaiSpecialization: 'สายฟ้าชิ่งต่อเนื่อง, ลูกแก้วเวทป้องกัน, ระเบิดน้ำแข็งแช่แข็ง',
    color: 0x9d4edd,
    stats: {
      maxHp: 120,
      hp: 120,
      moveSpeed: 188,
      attackSpeed: 0.85,
      damageBonus: 1.15,
      flatDamage: 34,
      critChance: 0.10,
      critBonus: 1.40,
      areaMultiplier: 1.0,
      pickupRadius: 100,
      defense: 1,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Chain Lightning',
    thaiWeaponName: 'สายฟ้าฟาดชิ่ง',
    weaponCooldown: 1.25 // Nerfed from 0.95s
  },
  [PlayerClass.CLERIC]: {
    name: 'Cleric',
    thaiName: 'นักบวชศักดิ์สิทธิ์',
    title: 'The Radiant Arbiter',
    thaiTitle: 'ตุลาการแสงตะวัน',
    description: 'Channels holy solar wrath with radial smites that weaken enemies and celestial auras that heal allies.',
    thaiDescription: 'ผู้ใช้พลังศักดิ์สิทธิ์ ฟาดค้อนสายฟ้าสร้างคลื่นกระแทก และกางออร่าฮีลฟื้นฟูเลือดให้เพื่อนร่วมทีม',
    element: ElementType.HOLY_LIGHT,
    elementalTitle: '✨ Solar Dawn & Holy Divinity',
    elementIcon: '✨',
    specialization: 'Radial Shockwaves, Group Healing & Holy Retribution',
    thaiSpecialization: 'คลื่นกระแทกรอบตัว, ออร่าฮีลฟื้นฟูเพื่อนร่วมทีม, เสาแสงพิพากษา',
    color: 0xffb703,
    stats: {
      maxHp: 175,
      hp: 175,
      moveSpeed: 182,
      attackSpeed: 0.75,
      damageBonus: 1.05,
      flatDamage: 30,
      critChance: 0.06,
      critBonus: 1.30,
      areaMultiplier: 1.0,
      pickupRadius: 110,
      defense: 5,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Holy Smite',
    thaiWeaponName: 'ค้อนแสงศักดิ์สิทธิ์',
    weaponCooldown: 1.45 // Nerfed from 1.1s
  },
  [PlayerClass.COMMANDO]: {
    name: 'Commando',
    thaiName: 'คอมมานโด M4A1',
    title: 'The Modern Vanguard',
    thaiTitle: 'ทหารหน่วยรบพิเศษ',
    description: 'Modern military operator with rapid-fire assault rifle bursts, explosive frag grenades, and tactical drone strikes.',
    thaiDescription: 'หน่วยรบพิเศษติดอาวุธหนัก กราดยิงกระสุน M4A1 เจาะทะลวง ปาระเบิดสังหาร และเรียกโดรนทิ้งบอมบ์',
    element: ElementType.BALLISTIC_FIRE,
    elementalTitle: '🔥 Ballistic & High-Explosive',
    elementIcon: '🎖️',
    specialization: 'High RoF, Piercing Bullets & Frag Grenades',
    thaiSpecialization: 'รัวกระสุนเร็วสูง, กระสุนเจาะเกราะ, ระเบิดมือลูกปรายสังหาร',
    color: 0x2a9d8f,
    stats: {
      maxHp: 160,
      hp: 160,
      moveSpeed: 195,
      attackSpeed: 1.35,
      damageBonus: 1.0,
      flatDamage: 18,
      critChance: 0.12,
      critBonus: 1.45,
      areaMultiplier: 1.0,
      pickupRadius: 95,
      defense: 4,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'M4A1 Burst Rifle',
    thaiWeaponName: 'ปืนไรเฟิลจู่โจม M4A1',
    weaponCooldown: 0.65
  },
  [PlayerClass.CAT_TANK]: {
    name: 'Cat Tank',
    thaiName: 'แมวส้มหูพับมหาถึก',
    title: 'The Unstoppable Chonk',
    thaiTitle: 'เจ้าก้อนขนอมตะ',
    description: 'A colossal Scottish Fold chonker with immense health pool, paw slam shockwaves, aggro meow taunt, and 9 lives revive.',
    thaiDescription: 'แมวส้มหูพับตัวยักษ์ เลือดมหาศาล ทุบพุงกระแทกพื้น ขู่ฟ่อดึงดูดมอนสเตอร์ และฟื้นชีพด้วยพร 9 ชีวิต',
    element: ElementType.CHONK_FORTRESS,
    elementalTitle: '🐱 Chonk Fortress & Nine Lives',
    elementIcon: '🐱',
    specialization: 'Massive HP, Aggro Taunts & Revive Mechanism',
    thaiSpecialization: 'เลือดมหาศาล, ขู่คำรามดึงมอนสเตอร์, ตะปบพื้น, ฟื้นคืนชีพ 9 ชีวิต',
    color: 0xf4a261,
    stats: {
      maxHp: 350,
      hp: 350,
      moveSpeed: 170,
      attackSpeed: 0.8,
      damageBonus: 1.0,
      flatDamage: 38,
      critChance: 0.05,
      critBonus: 1.25,
      areaMultiplier: 1.2,
      pickupRadius: 105,
      defense: 12,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Heavy Paw Slam',
    thaiWeaponName: 'อุ้งเท้าตะปบมหาประลัย',
    weaponCooldown: 1.35
  },
  [PlayerClass.COWBOY]: {
    name: 'Cowboy',
    thaiName: 'คาวบอยล่าค่าหัว',
    title: 'The Bounty Gunslinger',
    thaiTitle: 'มือปืนนอกกฎหมาย',
    description: 'Dead-eye frontier gunslinger fanning dual revolvers, ensnaring targets with steel wire lassos, and tumbling with deadly crit strikes.',
    thaiDescription: 'มือปืนแดนเถื่อน ผู้ควงปืนลูกโม่คู่สะบัดยิงรัว ปาบ่วงบาศก์สตั๊นรวบศัตรู และมีโอกาสติดคริติคอลมหาศาล',
    element: ElementType.DEADEYE_PIERCE,
    elementalTitle: '🎯 Dead-Eye & Quick Draw',
    elementIcon: '🤠',
    specialization: 'Dual Revolver Burst, Lasso Crowd Control & High Criticals',
    thaiSpecialization: 'ยิงลูกโม่คู่ 2 นัดซ้อน, บ่วงบาศก์หยุดศัตรู, คริติคอลสูงลิ่ว',
    color: 0xd4a373,
    stats: {
      maxHp: 180,
      hp: 180,
      moveSpeed: 205,
      attackSpeed: 1.4,
      damageBonus: 1.0,
      flatDamage: 24,
      critChance: 0.18,
      critBonus: 1.6,
      areaMultiplier: 1.0,
      pickupRadius: 100,
      defense: 3,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Dual Peacekeeper Revolvers',
    thaiWeaponName: 'ปืนลูกโม่คู่พีซคีปเปอร์',
    weaponCooldown: 0.55
  },
  [PlayerClass.CELESTIAL_MECHA]: {
    name: 'Celestial Mecha',
    thaiName: 'กันดั้มสวรรค์ขาวแดง',
    title: 'The Divine Armored Vanguard',
    thaiTitle: 'หุ่นรบเทวะปีกสวรรค์',
    description: 'Advanced angelic mecha slicing hordes with twin GN beam sabers, discharging full burst wing lasers, and deploying protective forcefields.',
    thaiDescription: 'หุ่นรบจักรกลศักดิ์สิทธิ์ ฟันกวาดด้วยดาบแสงคู่ ยิงเลเซอร์ปีกสวรรค์ Full Burst และกางบาเรียสนามพลังสะท้อน',
    element: ElementType.CELESTIAL_PLASMA,
    elementalTitle: '⚡ GN Plasma & Angelic Wings',
    elementIcon: '🤖',
    specialization: 'Twin Beam Saber Cleaves, Full Burst Lasers & Energy Barrier',
    thaiSpecialization: 'ดาบแสงคู่กากบาท, ปีกเลเซอร์รอบทิศ, สนามพลัง GN ป้องกัน',
    color: 0x00b4d8,
    stats: {
      maxHp: 260,
      hp: 260,
      moveSpeed: 215,
      attackSpeed: 1.15,
      damageBonus: 1.0,
      flatDamage: 30,
      critChance: 0.10,
      critBonus: 1.5,
      areaMultiplier: 1.15,
      pickupRadius: 110,
      defense: 7,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Twin GN Beam Sabers',
    thaiWeaponName: 'ดาบแสงคู่ GN บีมเซเบอร์',
    weaponCooldown: 0.85
  },
  [PlayerClass.GAMBLER]: {
    name: 'The Gambler',
    thaiName: 'เซียนพนันแห่งโชคชะตา',
    title: 'The Master of Fortune',
    thaiTitle: 'จอมเสี่ยงโชคอเวจี',
    description: 'Dapper high-roller hurling razor-sharp playing cards, tossing volatile fate dice, and triggering slot machine gold showers.',
    thaiDescription: 'จอมเสี่ยงดวงชุดทักซิโด้ กรีดไพ่สังหารเฉือนเนื้อ ทอยลูกเต๋าเสี่ยงดวงระเบิด และโยกตู้สล็อตแจ็กพอตแตก 777',
    element: ElementType.LUCKY_ARCANE,
    elementalTitle: '🎰 High-Roller & Fortune 777',
    elementIcon: '🎰',
    specialization: 'Piercing Razor Cards, RNG Fate Dice & Slot Gold Showers',
    thaiSpecialization: 'ไพ่กรีดกระจาย 3 ทิศ, ลูกเต๋าสุ่มระเบิด/บัฟ, ตู้สล็อตเหรียญทอง',
    color: 0xe0a96d,
    stats: {
      maxHp: 190,
      hp: 190,
      moveSpeed: 195,
      attackSpeed: 1.25,
      damageBonus: 1.0,
      flatDamage: 22,
      critChance: 0.15,
      critBonus: 1.7,
      areaMultiplier: 1.0,
      pickupRadius: 130,
      defense: 5,
      level: 1,
      exp: 0,
      maxExp: 20
    },
    weaponName: 'Razor Fortune Cards',
    thaiWeaponName: 'สำรับไพ่กรีดวิญญาณ',
    weaponCooldown: 0.75
  }
};

export interface WeaponEvolutionRule {
  id: string;
  name: string;
  thaiName: string;
  description: string;
  thaiDesc: string;
  icon: string;
  targetClass: PlayerClass;
  baseSkillKey: keyof PlayerSkills;
  baseRankRequired: number;
  synergyTraitId: string;
  synergyName: string;
  evolvedSkillKey: keyof PlayerSkills;
  element: ElementType;
}

export const WEAPON_EVOLUTIONS: WeaponEvolutionRule[] = [
  {
    id: 'evo_crimson_tempest',
    name: 'Crimson Tempest',
    thaiName: 'พายุโลหิตอมตะ (จุติ)',
    description: 'EVOLUTION: Blade Whirlwind + Rend & Tear. Endless blood cyclone spins continuously, shredding all foes and restoring 3% HP on hit!',
    thaiDesc: 'การจุติ: พายุหมุนใบดาบ + ฉีกกระชากโลหิต. หมุนควงพายุเลือดสังหารรอบตัวต่อเนื่องตลอดเวลา บดขยี้ศัตรูพร้อมดูดเลือด 3%!',
    icon: '🩸🌪️',
    targetClass: PlayerClass.SWORDSMAN,
    baseSkillKey: 'bladeWhirlwindRank',
    baseRankRequired: 3,
    synergyTraitId: 'sw_rend_tear',
    synergyName: 'Rend & Tear',
    evolvedSkillKey: 'crimsonTempest',
    element: ElementType.PHYSICAL_BLEED
  },
  {
    id: 'evo_aegis_bastion',
    name: 'Aegis of the Bastion',
    thaiName: 'กำแพงพสุธาไร้พ่าย (จุติ)',
    description: 'EVOLUTION: Shield Bash + Fortress Stance. Frontal bash transforms into 360° seismic earthquake shockwave reflecting 200% damage taken!',
    thaiDesc: 'การจุติ: โล่กระแทกพสุธา + ท่ายืนป้อมปราการ. โล่กระแทกแปรสภาพเป็นคลื่นแผ่นดินไหว 360 องศา สะท้อนความเสียหาย 200%!',
    icon: '🛡️⚡',
    targetClass: PlayerClass.SWORDSMAN,
    baseSkillKey: 'shieldBashRank',
    baseRankRequired: 3,
    synergyTraitId: 'sw_fortress_stance',
    synergyName: 'Fortress Stance',
    evolvedSkillKey: 'aegisOfBastion',
    element: ElementType.PHYSICAL_BLEED
  },
  {
    id: 'evo_blizzard_volley',
    name: 'Blizzard Volley',
    thaiName: 'ห่าฝนศรเยือกแข็ง (จุติ)',
    description: 'EVOLUTION: Multishot + Frostwire Snare. Fires an 8-arrow barrage piercing infinitely and freezing all monsters solid!',
    thaiDesc: 'การจุติ: ธนูหลายสาย + กับดักเหมันต์. ปลดปล่อยห่าฝนลูกศรน้ำแข็ง 8 ดอกพร้อมกัน ทะลวงไม่จำกัดและแช่แข็งศัตรูทันที!',
    icon: '❄️🏹',
    targetClass: PlayerClass.ARCHER,
    baseSkillKey: 'multishotRank',
    baseRankRequired: 3,
    synergyTraitId: 'archer_frost_trap',
    synergyName: 'Frostwire Snare Trap',
    evolvedSkillKey: 'blizzardVolley',
    element: ElementType.WIND_PIERCE
  },
  {
    id: 'evo_hellfire_cataclysm',
    name: 'Hellfire Cataclysm',
    thaiName: 'ศรอุกกาบาตล้างพิภพ (จุติ)',
    description: 'EVOLUTION: Explosive Shot + Deadeye Pierce. Explosive arrows detonate into 3 cascading fiery cluster cataclysms burning the battlefield!',
    thaiDesc: 'การจุติ: ศรเพลิงระเบิด + ยิงเจาะจุดตาย. ลูกศรระเบิดจะจุดชนวนระเบิดไฟซ้อน 3 ระลอก เผาไหม้มอนสเตอร์ทั้งหน้าจอ!',
    icon: '💥☄️',
    targetClass: PlayerClass.ARCHER,
    baseSkillKey: 'explosiveShotRank',
    baseRankRequired: 3,
    synergyTraitId: 'ar_deadeye_pierce',
    synergyName: 'Deadeye Pierce',
    evolvedSkillKey: 'hellfireCataclysm',
    element: ElementType.WIND_PIERCE
  },
  {
    id: 'evo_absolute_zero',
    name: 'Absolute Zero Sphere',
    thaiName: 'วงแหวนศูนย์สัมบูรณ์ (จุติ)',
    description: 'EVOLUTION: Orbiting Orbs + Frost Nova Surge. Orbiting orbs expand into a hypersonic blizzard ring permanently freezing near enemies!',
    thaiDesc: 'การจุติ: ลูกแก้วเวทมนตร์ + ระเบิดคลื่นเยือกแข็ง. ลูกแก้วขยายตัวเป็นพายุน้ำแข็งความเร็วสูง แช่แข็งศัตรูรอบตัวถาวร!',
    icon: '🔮❄️',
    targetClass: PlayerClass.SORCERESS,
    baseSkillKey: 'orbitingOrbsRank',
    baseRankRequired: 3,
    synergyTraitId: 'sorceress_frost',
    synergyName: 'Frost Nova Surge',
    evolvedSkillKey: 'absoluteZeroSphere',
    element: ElementType.LIGHTNING_FROST
  },
  {
    id: 'evo_wrath_thunder_god',
    name: 'Wrath of the Thunder God',
    thaiName: 'มหาอัสนีพิโรธ (จุติ)',
    description: 'EVOLUTION: Lightning Overcharge + Static Field. Chain Lightning arcs across 12 enemies, calling down heavenly thunder on every critical hit!',
    thaiDesc: 'การจุติ: สายฟ้าประจุเกินพิกัด + สนามไฟฟ้าสถิต. สายฟ้าฟาดชิ่ง 12 เป้าหมาย พร้อมผ่าเสาแสงสวรรค์ทุกครั้งที่ติดคริติคอล!',
    icon: '⚡🌩️',
    targetClass: PlayerClass.SORCERESS,
    baseSkillKey: 'lightningOverchargeRank',
    baseRankRequired: 3,
    synergyTraitId: 'so_static_field',
    synergyName: 'Static Field Pulse',
    evolvedSkillKey: 'wrathThunderGod',
    element: ElementType.LIGHTNING_FROST
  },
  {
    id: 'evo_cluster_thermite',
    name: 'Cluster Thermite Mortar',
    thaiName: 'ลูกปรายเทอร์ไมต์ล้างผลาญ (จุติ)',
    description: 'EVOLUTION: Frag Grenade + Armor Piercing 5.56mm. Grenades detonate into 5 secondary thermite bomblets that incinerate everything in radius!',
    thaiDesc: 'การจุติ: ระเบิดมือลูกปราย + กระสุนเจาะเกราะ. ระเบิดมือแตกตัวเป็นลูกระเบิดเพลิงเทอร์ไมต์ 5 ลูกย่อย เผาผลาญศัตรูต่อเนื่อง!',
    icon: '💣🔥',
    targetClass: PlayerClass.COMMANDO,
    baseSkillKey: 'fragGrenadeRank',
    baseRankRequired: 3,
    synergyTraitId: 'commando_ap_rounds',
    synergyName: 'Armor Piercing 5.56mm',
    evolvedSkillKey: 'clusterThermite',
    element: ElementType.BALLISTIC_FIRE
  },
  {
    id: 'evo_titan_earthquake',
    name: 'Titan Chonk Earthquake',
    thaiName: 'แผ่นดินไหวแมวยักษ์เขย่าโลก (จุติ)',
    description: 'EVOLUTION: Territorial Meow & Hiss + Absolute Chonk Bulk. Paw slams and hisses shake the entire arena, knocking back all foes and drawing all aggro!',
    thaiDesc: 'การจุติ: เสียงขู่ฟ่ออาณาเขต + พุงนุ่มกันกระแทก. การตะปบพื้นและขู่ฟ่อจะสั่นสะเทือนทั้งสมรภูมิ ผลักมอนสเตอร์ทั้งจอกระเด็นและล่อมอนสเตอร์มาที่แมว!',
    icon: '🐾🌋',
    targetClass: PlayerClass.CAT_TANK,
    baseSkillKey: 'aggroTauntRank',
    baseRankRequired: 3,
    synergyTraitId: 'cattank_chonk_armor',
    synergyName: 'Absolute Chonk Bulk',
    evolvedSkillKey: 'titanEarthquake',
    element: ElementType.CHONK_FORTRESS
  }
];

export const TRAIT_POOL: TraitOption[] = [
  // ==========================================
  // 0. MYTHIC WEAPON EVOLUTIONS (8 Ultimate Unions)
  // ==========================================
  {
    id: 'evo_crimson_tempest',
    name: 'Crimson Tempest',
    thaiName: 'พายุโลหิตอมตะ (จุติ)',
    description: 'EVOLUTION: Endless blood cyclone spins continuously, shredding all foes and restoring 3% HP on hit!',
    thaiDesc: 'การจุติ: หมุนควงพายุเลือดสังหารรอบตัวต่อเนื่องตลอดเวลา บดขยี้ศัตรูพร้อมดูดเลือด 3%!',
    rarity: 'mythic',
    icon: '🩸🌪️',
    targetClass: PlayerClass.SWORDSMAN,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.crimsonTempest = true;
      s.damageBonus += 0.35;
      s.flatDamage += 15;
    }
  },
  {
    id: 'evo_aegis_bastion',
    name: 'Aegis of the Bastion',
    thaiName: 'กำแพงพสุธาไร้พ่าย (จุติ)',
    description: 'EVOLUTION: 360° seismic earthquake shockwave on attack, reflecting 200% damage taken and +8 Armor Defense!',
    thaiDesc: 'การจุติ: ปล่อยคลื่นแผ่นดินไหว 360 องศา สะท้อนความเสียหาย 200% และเพิ่มเกราะป้องกัน +8!',
    rarity: 'mythic',
    icon: '🛡️⚡',
    targetClass: PlayerClass.SWORDSMAN,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.aegisOfBastion = true;
      s.defense += 8;
      s.maxHp += 100;
      s.hp += 100;
    }
  },
  {
    id: 'evo_blizzard_volley',
    name: 'Blizzard Volley',
    thaiName: 'ห่าฝนศรเยือกแข็ง (จุติ)',
    description: 'EVOLUTION: 8-arrow freezing barrage piercing infinitely and freezing all foes solid!',
    thaiDesc: 'การจุติ: ห่าฝนลูกศรน้ำแข็ง 8 ดอกทะลวงไม่จำกัดและแช่แข็งศัตรูทันที!',
    rarity: 'mythic',
    icon: '❄️🏹',
    targetClass: PlayerClass.ARCHER,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.blizzardVolley = true;
      s.damageBonus += 0.30;
      s.critChance += 0.10;
    }
  },
  {
    id: 'evo_hellfire_cataclysm',
    name: 'Hellfire Cataclysm',
    thaiName: 'ศรอุกกาบาตล้างพิภพ (จุติ)',
    description: 'EVOLUTION: Explosive arrows detonate into 3 cascading fiery cluster cataclysms burning the screen!',
    thaiDesc: 'การจุติ: ลูกศรระเบิดจุดระเบิดซ้อน 3 ระลอก เผาไหม้มอนสเตอร์ทั้งหน้าจอ!',
    rarity: 'mythic',
    icon: '💥☄️',
    targetClass: PlayerClass.ARCHER,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.hellfireCataclysm = true;
      s.damageBonus += 0.35;
      s.flatDamage += 20;
    }
  },
  {
    id: 'evo_absolute_zero',
    name: 'Absolute Zero Sphere',
    thaiName: 'วงแหวนศูนย์สัมบูรณ์ (จุติ)',
    description: 'EVOLUTION: Hypersonic cryogenic blizzard ring permanently freezing and shredding surrounding foes!',
    thaiDesc: 'การจุติ: วงแหวนน้ำแข็งความเร็วสูงแช่แข็งศัตรูรอบตัวถาวรและบดขยี้อย่างต่อเนื่อง!',
    rarity: 'mythic',
    icon: '🔮❄️',
    targetClass: PlayerClass.SORCERESS,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.absoluteZeroSphere = true;
      s.damageBonus += 0.30;
      s.areaMultiplier *= 1.30;
    }
  },
  {
    id: 'evo_wrath_thunder_god',
    name: 'Wrath of the Thunder God',
    thaiName: 'มหาอัสนีพิโรธ (จุติ)',
    description: 'EVOLUTION: Chain Lightning strikes 12 foes and smites divine pillars from heaven on every critical hit!',
    thaiDesc: 'การจุติ: สายฟ้าฟาดชิ่ง 12 เป้าหมาย และผ่าเสาแสงสวรรค์ทุกครั้งที่ติดคริติคอล!',
    rarity: 'mythic',
    icon: '⚡🌩️',
    targetClass: PlayerClass.SORCERESS,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.wrathThunderGod = true;
      s.damageBonus += 0.40;
      s.critChance += 0.15;
    }
  },
  {
    id: 'evo_cluster_thermite',
    name: 'Cluster Thermite Mortar',
    thaiName: 'ลูกปรายเทอร์ไมต์ล้างผลาญ (จุติ)',
    description: 'EVOLUTION: Frag grenades detonate into 5 secondary thermite bomblets that incinerate everything in radius!',
    thaiDesc: 'การจุติ: ระเบิดมือลูกปรายแตกตัวเป็นระเบิดเพลิงเทอร์ไมต์ 5 ลูกย่อย เผาผลาญศัตรูต่อเนื่อง!',
    rarity: 'mythic',
    icon: '💣🔥',
    targetClass: PlayerClass.COMMANDO,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.BALLISTIC_FIRE,
    apply: (s, k) => {
      k.clusterThermite = true;
      s.damageBonus += 0.35;
      s.flatDamage += 18;
    }
  },
  {
    id: 'evo_titan_earthquake',
    name: 'Titan Chonk Earthquake',
    thaiName: 'แผ่นดินไหวแมวยักษ์เขย่าโลก (จุติ)',
    description: 'EVOLUTION: Paw slams and hisses shake the entire arena, knocking back all foes and drawing all monster aggro!',
    thaiDesc: 'การจุติ: การตะปบพื้นและขู่ฟ่อจะสั่นสะเทือนทั้งสมรภูมิ ผลักมอนสเตอร์ทั้งจอกระเด็นและล่อมอนสเตอร์มาที่แมว!',
    rarity: 'mythic',
    icon: '🐾🌋',
    targetClass: PlayerClass.CAT_TANK,
    isEvolution: true,
    evolutionTitle: '⚡ WEAPON EVOLUTION ⚡',
    element: ElementType.CHONK_FORTRESS,
    apply: (s, k) => {
      k.titanEarthquake = true;
      s.defense += 8;
      s.maxHp += 150;
      s.hp += 150;
    }
  },
  // ==========================================
  // 1. SWORDSMAN ARCHETYPE SKILLS
  // ==========================================
  {
    id: 'swordsman_whirlwind',
    name: 'Blade Whirlwind',
    thaiName: 'พายุหมุนใบดาบสังหาร',
    description: 'Cyclone spin hitting all surrounding foes (Rank 1: every 6th hit ➔ Rank 3: every 3rd hit + enlarged radius).',
    thaiDesc: 'หมุนควงดาบฟันกวาดศัตรูรอบตัว 360 องศา (ขั้น 1: ทุกการฟัน 6 ครั้ง ➔ ขั้น 3: ทุก 3 ครั้ง พร้อมขยายรัศมี)',
    rarity: 'epic',
    icon: '🌪️',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.bladeWhirlwindRank = Math.min(3, (k.bladeWhirlwindRank || 0) + 1);
      k.bladeWhirlwind = true;
      s.damageBonus += 0.08;
    }
  },
  {
    id: 'sw_rend_tear',
    name: 'Rend & Tear',
    thaiName: 'ฉีกกระชากโลหิต',
    description: 'Slashes apply stacking laceration bleed (up to 5 stacks) dealing ticking physical damage.',
    thaiDesc: 'การฟันดาบทำให้ศัตรูติดสถานะเลือดออกซ้อนทับได้สูงสุด 5 ขั้น สร้างความเสียหายกายภาพอย่างต่อเนื่อง',
    rarity: 'rare',
    icon: '🩸',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.rendAndTearRank = Math.min(3, (k.rendAndTearRank || 0) + 1);
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'swordsman_shockwave',
    name: 'Shockwave Slash',
    thaiName: 'คลื่นพลังดาบผ่ามิติ',
    description: 'Slashes fire piercing razor energy beams (Rank 1: 35% proc ➔ Rank 3: 100% proc with longer reach).',
    thaiDesc: 'การฟันดาบจะปล่อยคลื่นพลังดาบเจาะทะลวงศัตรูเป็นเส้นตรง (ขั้น 1: โอกาส 35% ➔ ขั้น 3: ปล่อยทุกครั้ง 100%)',
    rarity: 'rare',
    icon: '🗡️',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.shockwaveSlashRank = Math.min(3, (k.shockwaveSlashRank || 0) + 1);
      k.shockwaveSlash = true;
      s.flatDamage += 5;
    }
  },
  {
    id: 'sw_blade_beam',
    name: 'Blade Beam Volley',
    thaiName: 'ระดมคลื่นจันทร์เสี้ยว',
    description: 'Shockwaves split into twin crescent beams with +40% travel width and +15% damage.',
    thaiDesc: 'คลื่นพลังดาบแยกออกเป็น 2 เสี้ยวจันทร์ เพิ่มระยะกว้าง +40% และเพิ่มดาเมจ +15%',
    rarity: 'epic',
    icon: '💥',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s) => {
      s.flatDamage += 8;
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'swordsman_retaliation',
    name: 'Iron Retaliation',
    thaiName: 'เกราะเหล็กสะท้อนกลับ',
    description: '+Armor Defense and reflects damage taken back as razor shrapnel (Rank 1: 30% ➔ Rank 3: 100% reflection).',
    thaiDesc: 'เพิ่มเกราะป้องกัน +3 และสะท้อนความเสียหายที่ได้รับกลับเป็นเศษเหล็กแหลม (ขั้น 1: 30% ➔ ขั้น 3: 100%)',
    rarity: 'rare',
    icon: '🛡️',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.ironRetaliationRank = Math.min(3, (k.ironRetaliationRank || 0) + 1);
      k.ironRetaliation = true;
      s.defense += 3;
      s.maxHp += 25;
      s.hp += 25;
    }
  },
  {
    id: 'sw_fortress_stance',
    name: 'Fortress Stance',
    thaiName: 'ท่ายืนป้อมปราการหินผา',
    description: 'Taking hits builds Fortify stacks (+3 Armor each, max 5) and releases a concussive stun slam.',
    thaiDesc: 'เมื่อถูกโจมตีจะสะสมเกราะหินผา (+3 เกราะต่อขั้น สูงสุด 5) และระเบิดคลื่นสตันรอบตัว',
    rarity: 'epic',
    icon: '🏰',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.fortressStanceRank = Math.min(3, (k.fortressStanceRank || 0) + 1);
      s.defense += 3;
      s.maxHp += 30;
      s.hp += 30;
    }
  },
  {
    id: 'sw_blood_siphon',
    name: 'Bloodthirsty Siphon',
    thaiName: 'กระหายกลืนโลหิต',
    description: 'Slaying bleeding or stunned foes restores +2 HP and grants +10% movement speed for 3s.',
    thaiDesc: 'การสังหารศัตรูที่เลือดออกหรือสตันจะฟื้นฟู +2 HP และเพิ่มความเร็วเดิน +10% นาน 3 วินาที',
    rarity: 'rare',
    icon: '🍷',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s) => {
      s.maxHp += 20;
      s.hp += 20;
      s.damageBonus += 0.08;
    }
  },
  {
    id: 'swordsman_blood_cleave',
    name: 'Blood Cleave',
    thaiName: 'คมดาบโลหิตสังหาร',
    description: 'Every 4th sword strike unleashes a wide crimson blood arc dealing +40% bleed damage and creating a bleeding pool.',
    thaiDesc: 'การฟันดาบทุกครั้งที่ 4 จะปล่อยคลื่นดาบโลหิตสีเลือด สร้างความเสียหายเลือดออก +40% และทิ้งบ่อเลือดทำลายล้างบนพื้น',
    rarity: 'epic',
    icon: '🩸',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.bloodCleaveRank = Math.min(3, (k.bloodCleaveRank || 0) + 1);
      k.bloodCleave = true;
      s.damageBonus += 0.12;
      s.flatDamage += 6;
    }
  },
  {
    id: 'swordsman_shield_bash',
    name: 'Shield Bash Stun',
    thaiName: 'โล่กระแทกทำลายล้าง',
    description: 'Every 7.0s, charges with a towering tower shield in a 180° frontal arc, knocking back and stunning enemies for 1.2s.',
    thaiDesc: 'ทุก 7.0 วินาที จะพุ่งกระแทกโล่ยักษ์ด้านหน้า 180 องศา ผลักศัตรูกระเด็นและสตันนาน 1.2 วินาที',
    rarity: 'rare',
    icon: '🛡️',
    targetClass: PlayerClass.SWORDSMAN,
    isSignature: true,
    element: ElementType.PHYSICAL_BLEED,
    apply: (s, k) => {
      k.shieldBashRank = Math.min(3, (k.shieldBashRank || 0) + 1);
      k.shieldBash = true;
      s.defense += 3;
      s.maxHp += 25;
      s.hp += 25;
    }
  },

  // ==========================================
  // 2. ARCHER ARCHETYPE SKILLS
  // ==========================================
  {
    id: 'ar_deadeye_pierce',
    name: 'Deadeye Longbow',
    thaiName: 'ศรสายตาเหยี่ยวเจาะทะลวง',
    description: 'Arrows gain velocity and pierce through enemies (Rank 1: 2 foes ➔ Rank 3: infinite pierce).',
    thaiDesc: 'ลูกศรพุ่งเร็วขึ้นและเจาะทะลวงผ่านศัตรู (ขั้น 1: ทะลุ 2 ตัว ➔ ขั้น 3: ทะลวงไม่จำกัดตัว)',
    rarity: 'epic',
    icon: '🎯',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.deadeyePierceRank = Math.min(3, (k.deadeyePierceRank || 0) + 1);
      s.damageBonus += 0.12;
    }
  },
  {
    id: 'ar_ballistic_prec',
    name: 'Ballistic Precision',
    thaiName: 'วิถียิงแม่นยำระยะไกล',
    description: 'Arrows deal up to +50% amplified damage the further they travel across the screen.',
    thaiDesc: 'ลูกศรจะรุนแรงขึ้นสูงสุด +50% ยิ่งศรพุ่งไปไกลข้ามจอ ดาเมจยิ่งทวีคูณ',
    rarity: 'rare',
    icon: '🏹',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s) => {
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'archer_multishot',
    name: 'Gale Multishot',
    thaiName: 'ศรวายุกระจายหลายดอก',
    description: 'Bow fires a fan of arrows simultaneously (Rank 1: 2 arrows ➔ Rank 2: 3 arrows ➔ Rank 3: 4 sweeping arrows).',
    thaiDesc: 'ยิงลูกศรออกไปเป็นพัดกระจายพร้อมกัน (ขั้น 1: 2 ดอก ➔ ขั้น 2: 3 ดอก ➔ ขั้น 3: 4 ดอก)',
    rarity: 'epic',
    icon: '🏹',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.multishotRank = Math.min(3, (k.multishotRank || 0) + 1);
      k.multishot = true;
    }
  },
  {
    id: 'ar_rain_of_arrows',
    name: 'Rain of Arrows',
    thaiName: 'ห่าฝนลูกศรเงา',
    description: 'Every 6th volley triggers a localized rain of 12 shadow arrows shredding a targeted area.',
    thaiDesc: 'ทุกการยิงครั้งที่ 6 จะเรียกห่าฝนลูกศรเงา 12 ดอกตกลงมาบดขยี้พื้นที่เป้าหมาย',
    rarity: 'epic',
    icon: '🌧️',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.rainOfArrowsRank = Math.min(3, (k.rainOfArrowsRank || 0) + 1);
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'archer_windrunner',
    name: 'Windrunner Phantom',
    thaiName: 'เงาวายุลวงตา',
    description: 'Movement speed bonus (+4% per rank) and chance to evade attacks completely (Rank 1: 10% ➔ Rank 3: 25% evasion).',
    thaiDesc: 'เพิ่มความเร็วเดิน (+4% ต่อขั้น) และมีโอกาสหลบการโจมตีได้สมบูรณ์ (ขั้น 1: 10% ➔ ขั้น 3: 25%)',
    rarity: 'rare',
    icon: '💨',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.windrunnerRank = Math.min(3, (k.windrunnerRank || 0) + 1);
      k.windrunner = true;
      s.moveSpeed *= 1.04;
    }
  },
  {
    id: 'ar_static_caltrops',
    name: 'Static Caltrops',
    thaiName: 'กับดักหนามสายฟ้า',
    description: 'Leaves shocking caltrops behind while moving that slow and electrocute pursuers.',
    thaiDesc: 'ทิ้งกับดักหนามไฟฟ้าไว้ตามทางที่วิ่ง ช่วยสโลว์และช็อตศัตรูที่วิ่งตามหลัง',
    rarity: 'rare',
    icon: '⚡',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.staticCaltrops = true;
      s.moveSpeed *= 1.05;
    }
  },
  {
    id: 'archer_lightning',
    name: 'Lightning Arrow',
    thaiName: 'ศรสายฟ้าชิ่ง',
    description: 'Arrows shock targets on hit (Rank 1: 30% chance to 1 foe ➔ Rank 3: 100% chance to 3 foes).',
    thaiDesc: 'ลูกศรช็อตสายฟ้าเมื่อโดนศัตรู (ขั้น 1: โอกาส 30% ชิ่ง 1 ตัว ➔ ขั้น 3: โอกาส 100% ชิ่ง 3 ตัว)',
    rarity: 'epic',
    icon: '⚡',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.lightningArrowRank = Math.min(3, (k.lightningArrowRank || 0) + 1);
      k.lightningArrow = true;
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'archer_explosive_arrow',
    name: 'Explosive Shot',
    thaiName: 'ศรเพลิงระเบิดกัมปนาท',
    description: 'Arrows trigger a fiery blast upon hitting enemies dealing 120% AoE explosive splash damage.',
    thaiDesc: 'ลูกศรจะระเบิดออกเป็นเปลวเพลิงเมื่อกระทบศัตรู สร้างความเสียหายระเบิดรอบข้าง 120%',
    rarity: 'epic',
    icon: '💥',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.explosiveShotRank = Math.min(3, (k.explosiveShotRank || 0) + 1);
      k.explosiveShot = true;
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'archer_frost_trap',
    name: 'Frostwire Snare Trap',
    thaiName: 'กับดักเหมันต์ตรึงวิญญาณ',
    description: 'Every 6.0s, drops a tactical frost trap on the ground. Detonates when foes step near, freezing them solid for 2.0s.',
    thaiDesc: 'ทุก 6.0 วินาที จะวางกับดักน้ำแข็งบนพื้น ระเบิดแช่แข็งศัตรูที่เหยียบเข้ามาให้หยุดนิ่งนาน 2.0 วินาที',
    rarity: 'rare',
    icon: '❄️',
    targetClass: PlayerClass.ARCHER,
    isSignature: true,
    element: ElementType.WIND_PIERCE,
    apply: (s, k) => {
      k.frostTrapRank = Math.min(3, (k.frostTrapRank || 0) + 1);
      k.frostTrap = true;
      s.moveSpeed *= 1.05;
    }
  },

  // ==========================================
  // 3. SORCERESS ARCHETYPE SKILLS
  // ==========================================
  {
    id: 'sorceress_frost',
    name: 'Frost Nova Surge',
    thaiName: 'ระเบิดคลื่นเยือกแข็ง',
    description: 'Periodically unleashes a freezing shockwave (Rank 1: 1.0s freeze ➔ Rank 3: 1.8s freeze + wider blast).',
    thaiDesc: 'ปลดปล่อยระเบิดคลื่นน้ำแข็งแช่แข็งศัตรูรอบตัวเป็นระยะ (ขั้น 1: แช่แข็ง 1.0 วิ ➔ ขั้น 3: แช่แข็ง 1.8 วิ + รัศมีกว้างขึ้น)',
    rarity: 'rare',
    icon: '❄️',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.frostNovaRank = Math.min(3, (k.frostNovaRank || 0) + 1);
      k.frostNova = true;
      s.flatDamage += 4;
    }
  },
  {
    id: 'so_glacial_shatter',
    name: 'Glacial Shatter',
    thaiName: 'เสี้ยวน้ำแข็งแตกระเบิด',
    description: 'Slaying frozen monsters shatters them into 6 piercing icicles dealing AoE damage.',
    thaiDesc: 'การสังหารศัตรูที่ถูกแช่แข็งจะทำให้ร่างแตกกระจายเป็นเสี้ยวน้ำแข็งแหลม 6 เล่มพุ่งเจาะศัตรูรอบข้าง',
    rarity: 'epic',
    icon: '🧊',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.glacialShatterRank = Math.min(3, (k.glacialShatterRank || 0) + 1);
      s.damageBonus += 0.12;
    }
  },
  {
    id: 'sorceress_overcharge',
    name: 'Lightning Overcharge',
    thaiName: 'สายฟ้าประจุเกินพิกัด',
    description: 'Chain Lightning arcs to additional targets (Rank 1: +1 target ➔ Rank 3: +3 targets with ionic detonations).',
    thaiDesc: 'สายฟ้าฟาดชิ่งไปยังเป้าหมายเพิ่มขึ้น (ขั้น 1: +1 เป้าหมาย ➔ ขั้น 3: +3 เป้าหมายพร้อมระเบิดประจุไอออน)',
    rarity: 'rare',
    icon: '🌩️',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.lightningOverchargeRank = Math.min(3, (k.lightningOverchargeRank || 0) + 1);
      k.lightningOvercharge = true;
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'so_static_field',
    name: 'Static Field Pulse',
    thaiName: 'สนามแม่เหล็กไฟฟ้าสถิต',
    description: 'Every 4th lightning strike discharges a radial electric field shocking all foes within 200 units.',
    thaiDesc: 'ทุกการฟาดสายฟ้าครั้งที่ 4 จะปล่อยสนามไฟฟ้าสถิตกระจายรอบตัว ช็อตศัตรูทั้งหมดในระยะ 200 ยูนิต',
    rarity: 'rare',
    icon: '✨',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.staticField = true;
      s.flatDamage += 5;
    }
  },
  {
    id: 'sorceress_orbs',
    name: 'Orbital Frost Orbs',
    thaiName: 'ลูกแก้วน้ำแข็งโคจรรอบตัว',
    description: 'Conjures revolving glacial orbs (Rank 1: 2 orbs ➔ Rank 2: 3 orbs ➔ Rank 3: 4 orbs with high-speed rotation and frost damage).',
    thaiDesc: 'เสกลูกแก้วน้ำแข็งหมุนวนรอบตัว (ขั้น 1: 2 ลูก ➔ ขั้น 2: 3 ลูก ➔ ขั้น 3: 4 ลูก หมุนเร็วขึ้นพร้อมดาเมจเยือกแข็งรุนแรง)',
    rarity: 'epic',
    icon: '🔮',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.orbitingOrbsRank = Math.min(3, (k.orbitingOrbsRank || 0) + 1);
      k.orbitingOrbs = Math.min(4, (k.orbitingOrbs || 2) + 1);
    }
  },
  {
    id: 'so_astral_aegis',
    name: 'Astral Aegis',
    thaiName: 'เกราะดวงดาวพิทักษ์',
    description: 'Each active orb grants +3 Armor Defense and orbs periodically shoot out homing ice shards.',
    thaiDesc: 'ลูกแก้วแต่ละลูกเพิ่มเกราะป้องกัน +3 และลูกแก้วจะยิงเสี้ยวน้ำแข็งติดตามศัตรูออกมาเป็นระยะ',
    rarity: 'rare',
    icon: '🛡️',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.astralAegisRank = Math.min(3, (k.astralAegisRank || 0) + 1);
      s.defense += 3;
      s.maxHp += 20;
      s.hp += 20;
    }
  },
  {
    id: 'so_spark_detonation',
    name: 'Spark Detonation',
    thaiName: 'ประกายไฟประจุระเบิด',
    description: 'Slaying shocked or frozen foes causes an ionic burst, restoring +2 HP and recharging spells faster.',
    thaiDesc: 'การสังหารศัตรูที่ติดช็อตหรือแช่แข็งจะเกิดการระเบิด ฟื้นฟู +2 HP และรีชาร์จเวทมนตร์เร็วขึ้น',
    rarity: 'rare',
    icon: '⚡',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s) => {
      s.maxHp += 15;
      s.hp += 15;
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'sorceress_meteor_strike',
    name: 'Astral Meteor Strike',
    thaiName: 'อุกกาบาตดวงดาวพิฆาต',
    description: 'Every 5.5s, calls down a blazing cosmic meteor crashing into the densest swarm of foes for massive AoE fire damage.',
    thaiDesc: 'ทุก 5.5 วินาที จะเรียกอุกกาบาตเพลิงอเวจีตกลงมาถล่มจุดที่ศัตรูรวมตัวกันหนาแน่นที่สุด สร้างความเสียหายไฟรุนแรงเป็นวงกว้าง',
    rarity: 'epic',
    icon: '☄️',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.meteorStrikeRank = Math.min(3, (k.meteorStrikeRank || 0) + 1);
      k.meteorStrike = true;
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'sorceress_blizzard_ring',
    name: 'Glacial Blizzard Vortex',
    thaiName: 'พายุหิมะเยือกแข็ง',
    description: 'Conjures a continuous swirling blizzard aura slowing enemies by 40% and dealing rapid frost damage ticks.',
    thaiDesc: 'สร้างพายุหิมะหมุนวนรอบตัวอย่างต่อเนื่อง สโลว์ศัตรูในระยะ 40% พร้อมสร้างความเสียหายน้ำแข็งกัดกร่อนต่อเนื่อง',
    rarity: 'rare',
    icon: '🌨️',
    targetClass: PlayerClass.SORCERESS,
    isSignature: true,
    element: ElementType.LIGHTNING_FROST,
    apply: (s, k) => {
      k.blizzardRingRank = Math.min(3, (k.blizzardRingRank || 0) + 1);
      k.blizzardRing = true;
      s.areaMultiplier *= 1.10;
    }
  },

  // ==========================================
  // 4. CLERIC ARCHETYPE SKILLS
  // ==========================================
  {
    id: 'cleric_heal_aura',
    name: 'Holy Radiance Aura',
    thaiName: 'ออร่าแสงศักดิ์สิทธิ์',
    description: 'Golden aura healing self and allies while burning foes (Rank 1: heals 10 HP ➔ Rank 3: heals 22 HP every 8.0s).',
    thaiDesc: 'ออร่าแสงสีทองฟื้นฟูเลือดตนเองและเพื่อนร่วมทีม พร้อมเผาไหม้ศัตรูรอบข้าง (ขั้น 1: ฮีล 10 HP ➔ ขั้น 3: ฮีล 22 HP ทุก 8 วิ)',
    rarity: 'epic',
    icon: '✨',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.holyRadianceRank = Math.min(3, (k.holyRadianceRank || 0) + 1);
      k.holyRadianceHeal = true;
      s.maxHp += 10;
      s.hp += 10;
    }
  },
  {
    id: 'cl_sanctified_swiftness',
    name: 'Sanctified Swiftness',
    thaiName: 'ความเร็วแห่งพรศักดิ์สิทธิ์',
    description: 'Holy Radiance grants +7% movement speed to all nearby party members; revive time reduced by 50%.',
    thaiDesc: 'ออร่าแสงช่วยเพิ่มความเร็วเดิน +7% ให้เพื่อนในปาร์ตี้ และลดเวลาชุบชีวิตเพื่อนลง 50%',
    rarity: 'rare',
    icon: '🕊️',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s) => {
      s.moveSpeed *= 1.07;
    }
  },
  {
    id: 'cleric_judgment',
    name: 'Divine Judgment',
    thaiName: 'เสาแสงสวรรค์พิพากษา',
    description: 'Calls down celestial pillars crushing random monsters (Rank 1: 1 pillar ➔ Rank 3: 3 pillars every 3.8s).',
    thaiDesc: 'เรียกเสาแสงสวรรค์ทัณฑ์พิพากษาผ่าลงมาบดขยี้มอนสเตอร์ (ขั้น 1: 1 เสา ➔ ขั้น 3: 3 เสา ทุก 3.8 วิ)',
    rarity: 'epic',
    icon: '✝️',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.judgmentPillarsRank = Math.min(3, (k.judgmentPillarsRank || 0) + 1);
      k.judgmentPillars = true;
      s.damageBonus += 0.12;
    }
  },
  {
    id: 'cl_wrath_heavens',
    name: 'Wrath of the Heavens',
    thaiName: 'เพลิงสวรรค์เผาผลาญ',
    description: 'Judgment pillars leave scorched ground burning monsters for 3.0s and dealing +25% holy damage.',
    thaiDesc: 'เสาแสงพิพากษาจะทิ้งพื้นศักดิ์สิทธิ์เผาไหม้มอนสเตอร์นาน 3 วิ และเพิ่มความเสียหายศักดิ์สิทธิ์ +25%',
    rarity: 'epic',
    icon: '⚖️',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s) => {
      s.damageBonus += 0.15;
      s.flatDamage += 6;
    }
  },
  {
    id: 'cleric_aegis',
    name: 'Blessed Aegis',
    thaiName: 'โล่พิทักษ์แห่งทวยเทพ',
    description: '+Armor Defense and provides a golden ward absorbing damage (Rank 1: 20 dmg ward ➔ Rank 3: 70 dmg ward).',
    thaiDesc: 'เพิ่มเกราะ +3 และมอบม่านพลังทองคำดูดซับความเสียหาย (ขั้น 1: กัน 20 ดาเมจ ➔ ขั้น 3: กัน 70 ดาเมจ)',
    rarity: 'rare',
    icon: '🛡️',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.blessedAegisRank = Math.min(3, (k.blessedAegisRank || 0) + 1);
      k.blessedAegis = true;
      s.defense += 3;
      s.maxHp += 25;
      s.hp += 25;
    }
  },
  {
    id: 'cl_consecrated_ground',
    name: 'Consecrated Ground',
    thaiName: 'แดนศักดิ์สิทธิ์ชำระล้าง',
    description: 'Walking blesses the ground beneath the Cleric, healing standing allies and burning evil monsters.',
    thaiDesc: 'การเดินจะอวยพรพื้นดินใต้เท้า ฮีลฟื้นฟูเพื่อนที่ยืนอยู่ และเผาทำลายมอนสเตอร์ที่เหยียบเข้ามา',
    rarity: 'rare',
    icon: '⛪',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.consecratedGroundRank = Math.min(3, (k.consecratedGroundRank || 0) + 1);
      s.maxHp += 20;
      s.hp += 20;
    }
  },
  {
    id: 'cl_heavenly_retrib',
    name: 'Heavenly Retribution',
    thaiName: 'ทัณฑ์สุริยันย้อนรอย',
    description: 'Taking damage triggers a solar counter-blast knocking back and blinding attackers.',
    thaiDesc: 'เมื่อได้รับความเสียหายจะระเบิดคลื่นแสงอาทิตย์ผลักกระเด็นและทำให้ศัตรูตาพร่ามัว',
    rarity: 'rare',
    icon: '☀️',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.heavenlyRetribution = true;
      s.defense += 2;
    }
  },
  {
    id: 'cleric_heavenly_thunder',
    name: 'Heavenly Thunder Smite',
    thaiName: 'อัสนีบาตสวรรค์พิพากษา',
    description: 'Every 4.0s, celestial holy thunder strikes down upon the highest-health enemy, chaining blinding radiant bolts.',
    thaiDesc: 'ทุก 4.0 วินาที สายฟ้าศักดิ์สิทธิ์จะผ่าลงมาจากสรวงสวรรค์ใส่ศัตรูที่มีเลือดมากที่สุด พร้อมชิ่งคลื่นแสงตาพร่ามัวใส่ศัตรูรอบข้าง',
    rarity: 'epic',
    icon: '⚡',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.heavenlyThunderRank = Math.min(3, (k.heavenlyThunderRank || 0) + 1);
      k.heavenlyThunder = true;
      s.damageBonus += 0.12;
      s.flatDamage += 5;
    }
  },
  {
    id: 'cleric_sanctum_barrier',
    name: 'Sanctum Barrier',
    thaiName: 'แดนศักดิ์สิทธิ์คุ้มภัย',
    description: 'Every 9.0s, consecrates an illuminated sanctuary ward on the ground. Allies within gain +5 Armor Defense and +15% Damage.',
    thaiDesc: 'ทุก 9.0 วินาที จะเสกวงแหวนแดนศักดิ์สิทธิ์สีทองบนพื้น เพื่อนร่วมทีมที่ยืนอยู่ในวงจะได้รับ +5 เกราะ และ +15% พลังโจมตี พร้อมเผามอนสเตอร์ที่บุกเข้ามา',
    rarity: 'rare',
    icon: '✨',
    targetClass: PlayerClass.CLERIC,
    isSignature: true,
    element: ElementType.HOLY_LIGHT,
    apply: (s, k) => {
      k.sanctumBarrierRank = Math.min(3, (k.sanctumBarrierRank || 0) + 1);
      k.sanctumBarrier = true;
      s.defense += 3;
      s.maxHp += 30;
      s.hp += 30;
    }
  },

  // ==========================================
  // 5. COMMANDO ARCHETYPE SKILLS
  // ==========================================
  {
    id: 'commando_frag_grenade',
    name: 'Frag Grenade Shrapnel',
    thaiName: 'ระเบิดมือลูกปรายสังหาร',
    description: 'Every 4.5s, hurls a fragmentation grenade causing a massive explosion (220% AoE DMG + shrapnel knockback).',
    thaiDesc: 'ทุก 4.5 วินาที จะขว้างระเบิดสังหารสร้างแรงระเบิดรุนแรงรอบจุดตก (ดาเมจ 220% พร้อมผลักกระเด็น)',
    rarity: 'epic',
    icon: '💣',
    targetClass: PlayerClass.COMMANDO,
    isSignature: true,
    element: ElementType.BALLISTIC_FIRE,
    apply: (s, k) => {
      k.fragGrenadeRank = Math.min(3, (k.fragGrenadeRank || 0) + 1);
      k.fragGrenade = true;
      s.damageBonus += 0.10;
    }
  },
  {
    id: 'commando_airstrike',
    name: 'Tactical Drone Bombardment',
    thaiName: 'โดรนทิ้งระเบิดนำวิถี',
    description: 'Every 8.0s, calls in an automated drone strike dropping rockets on dense monster clusters.',
    thaiDesc: 'ทุก 8.0 วินาที เรียกโดรนลาดตระเวนยิงจรวดมิสไซล์ทิ้งบอมบ์ใส่ฝูงมอนสเตอร์',
    rarity: 'legendary',
    icon: '🚀',
    targetClass: PlayerClass.COMMANDO,
    isSignature: true,
    element: ElementType.BALLISTIC_FIRE,
    apply: (s, k) => {
      k.airstrikeDroneRank = Math.min(3, (k.airstrikeDroneRank || 0) + 1);
      k.airstrikeDrone = true;
      s.flatDamage += 5;
    }
  },
  {
    id: 'commando_ap_rounds',
    name: 'Armor Piercing 5.56mm',
    thaiName: 'กระสุนเจาะเกราะ 5.56 มม.',
    description: 'M4A1 rounds pierce through additional enemies (+2 Pierce) and gain +15% damage bonus.',
    thaiDesc: 'กระสุนปืนไรเฟิลทะลวงศัตรูเพิ่มขึ้น (+2 ทะลุ) และเพิ่มพลังโจมตี +15%',
    rarity: 'rare',
    icon: '🎯',
    targetClass: PlayerClass.COMMANDO,
    isSignature: true,
    element: ElementType.BALLISTIC_FIRE,
    apply: (s, k) => {
      k.apRoundsRank = Math.min(3, (k.apRoundsRank || 0) + 1);
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'commando_tactical_reload',
    name: 'Tactical Reload & Agility',
    thaiName: 'ความคล่องตัวรบพิเศษ',
    description: 'Rigorous military conditioning: +20% Attack Speed and +8% Movement Speed.',
    thaiDesc: 'การฝึกฝนแบบทหารระดับสูง: เพิ่มความเร็วโจมตี +20% และเพิ่มความเร็วเดิน +8%',
    rarity: 'rare',
    icon: '⚡',
    targetClass: PlayerClass.COMMANDO,
    isSignature: true,
    element: ElementType.BALLISTIC_FIRE,
    apply: (s, k) => {
      k.tacticalReloadRank = Math.min(3, (k.tacticalReloadRank || 0) + 1);
      s.attackSpeed *= 1.20;
      s.moveSpeed *= 1.08;
    }
  },

  // ==========================================
  // 6. CAT TANK ARCHETYPE SKILLS
  // ==========================================
  {
    id: 'cattank_nine_lives',
    name: 'Nine Lives Blessing',
    thaiName: 'พร 9 ชีวิตคืนชีพอมตะ',
    description: 'When taking lethal damage, survive and immediately restore 100% HP with a massive shockwave (Once per run).',
    thaiDesc: 'เมื่อได้รับความเสียหายถึงชีวิต จะฟื้นคืนชีพทันทีพร้อมเลือดเต็ม 100% และคลื่นกระแทกผลักมอนสเตอร์ (1 ครั้งต่อรอบ)',
    rarity: 'legendary',
    icon: '🐱',
    targetClass: PlayerClass.CAT_TANK,
    isSignature: true,
    element: ElementType.CHONK_FORTRESS,
    apply: (s, k) => {
      k.nineLivesRank = Math.min(3, (k.nineLivesRank || 0) + 1);
      k.nineLives = true;
      s.maxHp += 50;
      s.hp += 50;
    }
  },
  {
    id: 'cattank_aggro_taunt',
    name: 'Territorial Meow & Hiss',
    thaiName: 'เสียงขู่ฟ่ออาณาเขต (ล่อมอนสเตอร์)',
    description: 'Every 5.0s, emits a ferocious territorial hiss pulling all monsters within 350px towards the cat and taunting them.',
    thaiDesc: 'ทุก 5.0 วินาที จะขู่ฟ่อเสียงดังกึกก้อง ดึงมอนสเตอร์รอบตัว 350px ให้พุ่งเข้ามาหาแมวและรับดาเมจเพิ่มขึ้น',
    rarity: 'epic',
    icon: '🐾',
    targetClass: PlayerClass.CAT_TANK,
    isSignature: true,
    element: ElementType.CHONK_FORTRESS,
    apply: (s, k) => {
      k.aggroTauntRank = Math.min(3, (k.aggroTauntRank || 0) + 1);
      k.aggroTaunt = true;
      s.defense += 3;
    }
  },
  {
    id: 'cattank_chonk_armor',
    name: 'Absolute Chonk Bulk',
    thaiName: 'พุงนุ่มกันกระแทก (มหาเกราะ)',
    description: 'Thick blubber layer provides +80 Max HP and +5 Armor Defense.',
    thaiDesc: 'ชั้นไขมันนุ่มหนาเตอะ เพิ่มเลือดสูงสุด +80 HP และเพิ่มเกราะป้องกัน +5',
    rarity: 'rare',
    icon: '🛡️',
    targetClass: PlayerClass.CAT_TANK,
    isSignature: true,
    element: ElementType.CHONK_FORTRESS,
    apply: (s, k) => {
      k.chonkArmorRank = Math.min(3, (k.chonkArmorRank || 0) + 1);
      s.maxHp += 80;
      s.hp += 80;
      s.defense += 5;
    }
  },
  {
    id: 'cattank_hairball',
    name: 'Toxic Hairball Mortar',
    thaiName: 'ปืนใหญ่ก้อนขนพิษ',
    description: 'Spits a sticky acidic hairball every 4.0s slowing enemies by 40% and dealing lingering poison damage.',
    thaiDesc: 'ขย้อนก้อนขนพิษเหนียวหนึบทุก 4.0 วินาที ชะลอศัตรูลง 40% พร้อมสร้างดาเมจพิษกัดกร่อน',
    rarity: 'rare',
    icon: '🧶',
    targetClass: PlayerClass.CAT_TANK,
    isSignature: true,
    element: ElementType.CHONK_FORTRESS,
    apply: (s, k) => {
      k.hairballLauncherRank = Math.min(3, (k.hairballLauncherRank || 0) + 1);
      k.hairballLauncher = true;
      s.flatDamage += 4;
    }
  },

  // ==========================================
  // 6. COWBOY TRAITS
  // ==========================================
  {
    id: 'cowboy_quick_draw',
    name: 'Quick Draw Fanning',
    thaiName: 'สะบัดไกยิงไว',
    description: 'Fanning technique increases attack speed by +25% and reduces weapon cooldown by 15%.',
    thaiDesc: 'เทคนิคสับนกสะบัดไก เพิ่มความเร็วโจมตี +25% และลดคูลดาวน์อาวุธ 15%',
    rarity: 'rare',
    icon: '⚡',
    targetClass: PlayerClass.COWBOY,
    isSignature: true,
    element: ElementType.DEADEYE_PIERCE,
    apply: (s, k) => {
      k.quickDrawFanRank = Math.min(3, (k.quickDrawFanRank || 0) + 1);
      k.quickDrawFan = true;
      s.attackSpeed *= 1.25;
    }
  },
  {
    id: 'cowboy_hollow_point',
    name: 'Hollow Point Rounds',
    thaiName: 'กระสุนหัวระเบิดฉีกร่าง',
    description: 'Expansive lead slugs grant +10 Flat Damage and +10% Critical Strike Chance.',
    thaiDesc: 'หัวกระสุนตะกั่วบาน เพิ่มพลังโจมตีพื้นฐาน +10 หน่วย และเพิ่มโอกาสคริติคอล +10%',
    rarity: 'rare',
    icon: '🎯',
    targetClass: PlayerClass.COWBOY,
    isSignature: true,
    element: ElementType.DEADEYE_PIERCE,
    apply: (s, k) => {
      k.bountyHunterBountyRank = Math.min(3, (k.bountyHunterBountyRank || 0) + 1);
      s.flatDamage += 10;
      s.critChance += 0.10;
      s.critBonus += 0.20;
    }
  },
  {
    id: 'cowboy_lasso_upgrade',
    name: 'Barbed Wire Lasso',
    thaiName: 'บ่วงบาศก์ลวดหนาม',
    description: 'Steel wire lasso pulls all enemies within 320px, stunning them for 1.8s and dealing 220% bleed damage.',
    thaiDesc: 'บ่วงบาศก์ลวดหนาม ดึงกระชากศัตรูในรัศมี 320px เข้ามารวมกัน สตั๊น 1.8 วินาที และทำดาเมจเลือดออก 220%',
    rarity: 'epic',
    icon: '🪢',
    targetClass: PlayerClass.COWBOY,
    isSignature: true,
    element: ElementType.DEADEYE_PIERCE,
    apply: (s, k) => {
      k.ensnaringLassoRank = Math.min(3, (k.ensnaringLassoRank || 0) + 1);
      k.ensnaringLasso = true;
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'cowboy_tumble',
    name: 'Gunslinger Tumble',
    thaiName: 'ม้วนตัวตีลังกาหลบ',
    description: 'Combat agility decreases dash cooldown by 1.0s and increases movement speed by +15%.',
    thaiDesc: 'ความคล่องตัวในสนามรบ ลดคูลดาวน์การพุ่งตัวลง 1.0 วินาที และเพิ่มความเร็วเดิน +15%',
    rarity: 'common',
    icon: '👟',
    targetClass: PlayerClass.COWBOY,
    isSignature: true,
    element: ElementType.DEADEYE_PIERCE,
    apply: (s, k) => {
      k.tumbleDodgeRank = Math.min(3, (k.tumbleDodgeRank || 0) + 1);
      s.moveSpeed *= 1.15;
    }
  },

  // ==========================================
  // 7. CELESTIAL MECHA TRAITS
  // ==========================================
  {
    id: 'mecha_saber_overdrive',
    name: 'GN Saber Overdrive',
    thaiName: 'เร่งพลังงานดาบแสง',
    description: 'Supercharges twin beam sabers, granting +30% Melee Cleave Area and +12 Flat Damage.',
    thaiDesc: 'อัดพลังงานเข้มข้นใส่ดาบแสงคู่ เพิ่มรัศมีการฟันกวาด +30% และเพิ่มดาเมจพื้นฐาน +12',
    rarity: 'rare',
    icon: '⚔️',
    targetClass: PlayerClass.CELESTIAL_MECHA,
    isSignature: true,
    element: ElementType.CELESTIAL_PLASMA,
    apply: (s, k) => {
      k.beamSaberCleaveRank = Math.min(3, (k.beamSaberCleaveRank || 0) + 1);
      k.beamSaberCleave = true;
      s.areaMultiplier *= 1.30;
      s.flatDamage += 12;
    }
  },
  {
    id: 'mecha_laser_salvo',
    name: 'Full Burst Wing Cannons',
    thaiName: 'ระดมยิงปีกเลเซอร์',
    description: 'Wing cannons fire 8 radial plasma beams every 5.0s, piercing all monsters for 240% damage.',
    thaiDesc: 'ปืนใหญ่ปีกสวรรค์ยิงลำแสงพลาสมา 8 ทิศทางทุก 5.0 วินาที ทะลวงมอนสเตอร์ทั้งหมด 240% ดาเมจ',
    rarity: 'epic',
    icon: '✨',
    targetClass: PlayerClass.CELESTIAL_MECHA,
    isSignature: true,
    element: ElementType.CELESTIAL_PLASMA,
    apply: (s, k) => {
      k.wingLaserSalvoRank = Math.min(3, (k.wingLaserSalvoRank || 0) + 1);
      k.wingLaserSalvo = true;
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'mecha_gn_barrier',
    name: 'GN Forcefield Barrier',
    thaiName: 'บาเรียสนามพลัง GN',
    description: 'Generates protective electromagnetic shield granting +6 Armor Defense and +50 Max HP.',
    thaiDesc: 'กางสนามพลังแม่เหล็กไฟฟ้าป้องกันตัว เพิ่มเกราะ +6 หน่วย และเพิ่มเลือดสูงสุด +50 HP',
    rarity: 'rare',
    icon: '🛡️',
    targetClass: PlayerClass.CELESTIAL_MECHA,
    isSignature: true,
    element: ElementType.CELESTIAL_PLASMA,
    apply: (s, k) => {
      k.gnBarrierShieldRank = Math.min(3, (k.gnBarrierShieldRank || 0) + 1);
      k.gnBarrierShield = true;
      s.defense += 6;
      s.maxHp += 50;
      s.hp += 50;
    }
  },
  {
    id: 'mecha_thruster',
    name: 'Afterburner Boosters',
    thaiName: 'ไอพ่นขับดันความเร็วสูง',
    description: 'High-output thrusters increase base movement speed by +20% and attack speed by +10%.',
    thaiDesc: 'ไอพ่นขับดันพลังงานสูง เพิ่มความเร็วการบินเคลื่อนที่ +20% และเพิ่มความเร็วโจมตี +10%',
    rarity: 'common',
    icon: '🚀',
    targetClass: PlayerClass.CELESTIAL_MECHA,
    isSignature: true,
    element: ElementType.CELESTIAL_PLASMA,
    apply: (s, k) => {
      k.thrusterOverdriveRank = Math.min(3, (k.thrusterOverdriveRank || 0) + 1);
      s.moveSpeed *= 1.20;
      s.attackSpeed *= 1.10;
    }
  },

  // ==========================================
  // 8. THE GAMBLER TRAITS
  // ==========================================
  {
    id: 'gambler_royal_flush',
    name: 'Royal Flush Razor',
    thaiName: 'ไพ่รอยัลฟลัชสังหาร',
    description: 'Throws +2 additional razor playing cards per volley and increases card damage by +20%.',
    thaiDesc: 'ปาไพ่สังหารเพิ่มขึ้นอีก +2 ใบต่อครั้ง และเพิ่มดาเมจไพ่ +20%',
    rarity: 'rare',
    icon: '🃏',
    targetClass: PlayerClass.GAMBLER,
    isSignature: true,
    element: ElementType.LUCKY_ARCANE,
    apply: (s, k) => {
      k.fortuneCardsRank = Math.min(3, (k.fortuneCardsRank || 0) + 1);
      k.fortuneCards = true;
      s.flatDamage += 6;
      s.damageBonus += 0.20;
    }
  },
  {
    id: 'gambler_loaded_dice',
    name: 'Loaded Fate Dice',
    thaiName: 'ลูกเต๋าถ่วงน้ำหนัก',
    description: 'Throws a lucky 6-sided die every 6.0s. Rolling 4-6 triggers a massive 300% gold shockwave explosion.',
    thaiDesc: 'ขว้างลูกเต๋าเสี่ยงดวงทุก 6.0 วินาที หากออกแต้ม 4-6 จะระเบิดคลื่นทองคำรุนแรง 300% ดาเมจ',
    rarity: 'epic',
    icon: '🎲',
    targetClass: PlayerClass.GAMBLER,
    isSignature: true,
    element: ElementType.LUCKY_ARCANE,
    apply: (s, k) => {
      k.luckyDiceRank = Math.min(3, (k.luckyDiceRank || 0) + 1);
      k.luckyDice = true;
      s.critChance += 0.08;
    }
  },
  {
    id: 'gambler_jackpot',
    name: 'Jackpot 777 Frenzy',
    thaiName: 'แจ็กพอตแตก 777',
    description: 'Every 10.0s, pulls the slot lever. Hitting 777 drops gold coins and blasts all nearby monsters.',
    thaiDesc: 'ทุก 10.0 วินาที จะดึงคันโยกตู้สล็อต เมื่อออก 777 จะโปรยเหรียญทองและระเบิดดาเมจใส่มอนสเตอร์รอบตัว',
    rarity: 'epic',
    icon: '🎰',
    targetClass: PlayerClass.GAMBLER,
    isSignature: true,
    element: ElementType.LUCKY_ARCANE,
    apply: (s, k) => {
      k.jackpot777SlotRank = Math.min(3, (k.jackpot777SlotRank || 0) + 1);
      k.jackpot777Slot = true;
      s.damageBonus += 0.15;
    }
  },
  {
    id: 'gambler_fortune_greed',
    name: 'Golden Fortune Aura',
    thaiName: 'ออร่าดวงมหาเศรษฐี',
    description: 'Increases gold drops by +35%, pickup range by +30%, and critical strike chance by +10%.',
    thaiDesc: 'เพิ่มอัตราดรอปทอง +35%, เพิ่มระยะดูดเก็บของ +30%, และเพิ่มโอกาสติดคริติคอล +10%',
    rarity: 'rare',
    icon: '💰',
    targetClass: PlayerClass.GAMBLER,
    isSignature: true,
    element: ElementType.LUCKY_ARCANE,
    apply: (s, k) => {
      k.highRollerGreedRank = Math.min(3, (k.highRollerGreedRank || 0) + 1);
      s.pickupRadius *= 1.30;
      s.critChance += 0.10;
      s.critBonus += 0.25;
    }
  },

  // ==========================================
  // 9. UNIVERSAL STAT TRAITS (Available to All)
  // ==========================================
  {
    id: 'vitality_1',
    name: 'Iron Constitution',
    thaiName: 'กายาเหล็กไหล (เลือดสูงสุด)',
    description: '+50 Max HP and restores 50 HP immediately',
    thaiDesc: 'เพิ่มพลังชีวิตสูงสุด +50 HP และฟื้นฟูเลือดทันที 50 HP',
    rarity: 'common',
    icon: '❤️',
    apply: (s) => { s.maxHp += 50; s.hp = Math.min(s.maxHp, s.hp + 50); }
  },
  {
    id: 'strength_1',
    name: 'Colossal Might',
    thaiName: 'พลังยักษ์ทรงพลัง (เพิ่มดาเมจ)',
    description: '+20% Damage and +5 Flat Damage',
    thaiDesc: 'เพิ่มพลังโจมตี +20% และเพิ่มดาเมจพื้นฐาน +5 หน่วย',
    rarity: 'rare',
    icon: '⚔️',
    apply: (s) => { s.damageBonus += 0.20; s.flatDamage += 5; }
  },
  {
    id: 'quickdraw_1',
    name: 'Flurry of Blows',
    thaiName: 'ระดมโจมตีรวดเร็ว (ตีไว)',
    description: '+25% Attack Speed',
    thaiDesc: 'เพิ่มความเร็วในการโจมตี +25%',
    rarity: 'rare',
    icon: '⚡',
    apply: (s) => { s.attackSpeed *= 1.25; }
  },
  {
    id: 'keen_edge_1',
    name: 'Deadly Precision',
    thaiName: 'ความแม่นยำปลิดชีพ (คริติคอล)',
    description: '+5% Critical Strike Chance and +15% Crit Damage',
    thaiDesc: 'เพิ่มโอกาสคริติคอล +5% และเพิ่มความแรงคริติคอล +15%',
    rarity: 'rare',
    icon: '🎯',
    apply: (s) => { s.critChance += 0.05; s.critBonus += 0.15; }
  },
  {
    id: 'magnet_1',
    name: 'Soul Siphon Attunement',
    thaiName: 'แรงดึงดูดวิญญาณ (ระยะเก็บของ)',
    description: '+22% EXP and Item Pickup Radius',
    thaiDesc: 'เพิ่มระยะการดูดเก็บ EXP และไอเทมบนพื้น +22%',
    rarity: 'common',
    icon: '🧲',
    apply: (s) => { s.pickupRadius *= 1.22; }
  },
  {
    id: 'area_expansion_1',
    name: 'Astral Reach',
    thaiName: 'ห้วงดวงดาวแผ่กว้าง (รัศมีสกิล)',
    description: '+14% Skill & Attack Radius — expand all weapon arcs, orbs, and spells!',
    thaiDesc: 'เพิ่มรัศมีการโจมตีและสกิล +14% — ขยายวงดาบ ลูกศร ลูกแก้ว และเวทมนตร์ทั้งหมด!',
    rarity: 'rare',
    icon: '🌌',
    apply: (s) => { s.areaMultiplier *= 1.14; }
  }
];
