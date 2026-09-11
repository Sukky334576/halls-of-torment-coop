export const GAME_CONSTANTS = {
  SERVER_TICK_RATE: 25, // 25 updates per second = 40ms per tick
  SERVER_TICK_MS: 40,
  MAP_SIZE: 4500, // 4500 x 4500 expanded tactical playfield
  SPATIAL_CELL_SIZE: 150, // 150x150 grid cell for O(1) broadphase
  
  // Co-op scaling factors
  COOP_HP_SCALE_PER_PLAYER: 0.35, // +35% enemy HP per additional player
  COOP_SPAWN_SCALE_PER_PLAYER: 0.25, // +25% spawn rate per additional player
  
  // Base player stats
  BASE_PICKUP_RADIUS: 80,
  REVIVE_ZONE_RADIUS: 100,
  REVIVE_TIME_SECONDS: 4.0,
  // How long a disconnected player's character stays alive (ghosted, untargetable) waiting
  // for them to reconnect (browser refresh, dropped WebSocket) before being removed for real.
  RECONNECT_GRACE_MS: 60_000,
  GOLD_DROP_CHANCE: 0.022, // 2.2% chance per kill — drops 1 gold coin, scaled by stage.goldMultiplier / Gold Rush Shrine
  // Gear must only ever come from monster kills, never from an achievement (see trialQuests.ts)
  // — bosses always drop one instead of rolling this (see damageMonster's boss-reward block).
  GEAR_DROP_CHANCE: 0.015, // 1.5% chance per kill for a normal monster to drop a piece of gear
  MAGNET_DROP_CHANCE: 0.0075, // 0.75% chance per kill (halved from 1.5%, still felt too common) — pulls every EXP gem & gold coin on the map to the team when collected
  // Surrendering is a deliberate choice to bail, not a consequence of difficulty like dying
  // or timing out — those still pay out 100% of collected gold. Keep this in sync with the
  // "รางวัลได้แค่ xx%" framing if the percentage ever changes.
  SURRENDER_GOLD_RETENTION: 0.5, // keep 50% of personally-collected gold on surrender

  // EXP requirements (nerfed progression by ~30%)
  EXP_BASE: 20,
  EXP_GROWTH: 1.25,
};

export const MONSTER_STATS = {
  0: { // SKELETON
    name: 'Skeleton',
    maxHp: 25,
    speed: 110,
    damage: 8,
    radius: 16,
    expValue: 1,
    color: 0xe0e0e0
  },
  1: { // ZOMBIE
    name: 'Rotting Zombie',
    maxHp: 65,
    speed: 70,
    damage: 15,
    radius: 20,
    expValue: 3,
    color: 0x4a7c59
  },
  2: { // IMP
    name: 'Crimson Imp',
    maxHp: 18,
    speed: 180,
    damage: 6,
    // 12 -> 16 (2026-09-11): matches SKELETON's radius. Was the smallest hitbox in the game by
    // a wide margin while sharing the exact same fixed 64x64 sprite draw size as every other
    // ground monster (HordeSpriteRenderer draws every type at scale 1.0 / 64px regardless of
    // `radius` — nothing here scales the sprite down to match a small hitbox). Combined with
    // IMP's speed (180, second-fastest after Hellhound), landing an Archer arrow (radius 10)
    // against its visually-much-larger sprite consistently read as "the arrow clearly hit it
    // but dealt no damage" — a real miss against the tiny true hitbox, not a damage bug. See
    // docs/archive/2026-09-11-imp-hitbox-fix.md.
    radius: 16,
    expValue: 2,
    color: 0xd9381e
  },
  3: { // HELLHOUND
    name: 'Hellhound',
    maxHp: 90,
    speed: 210,
    damage: 20,
    radius: 22,
    expValue: 5,
    color: 0x8a1c14
  },
  4: { // ELITE_GOLEM
    name: 'Corrupted Golem',
    maxHp: 800,
    speed: 60,
    damage: 35,
    radius: 36,
    expValue: 50,
    color: 0x694285
  },
  5: { // LORD_OF_TORMENT
    name: 'Lord of Torment',
    maxHp: 10000,
    speed: 90,
    damage: 50,
    radius: 48,
    expValue: 500,
    color: 0xff1053
  },
  6: { // SKELETON_ARCHER
    name: 'Skeleton Archer',
    maxHp: 22,   // Nerfed from 40 (frail archer archetype)
    speed: 68,   // Nerfed from 85 (easier for player to close distance)
    damage: 5,   // Nerfed from 12 (-58% damage)
    radius: 14,
    expValue: 4,
    color: 0x90e0ef
  },
  7: { // MAGMA_IMP
    name: 'Magma Imp',
    maxHp: 30,   // Nerfed from 55 (-45% HP)
    speed: 75,   // Nerfed from 100
    damage: 7,   // Nerfed from 16 (-56% damage)
    radius: 14,
    expValue: 6,
    color: 0xf77f00
  },
  8: { // VOID_WARLOCK
    name: 'Void Warlock',
    maxHp: 65,   // Nerfed from 120 (-46% HP)
    speed: 55,   // Nerfed from 75
    damage: 11,  // Nerfed from 24 (-54% damage)
    radius: 18,
    expValue: 12,
    color: 0x7209b7
  }
};
