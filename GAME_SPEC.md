# 📜 GAME SPECIFICATION & ARCHITECTURE REFERENCE
## Project: Torment of Souls (Dark Fantasy 4-Player Co-op Horde Survival)
*A Complete Developer & Architectural Guide for Ongoing Development*

---

## 1. Project Overview & Core Vision

**Torment of Souls** is a 4-player cooperative dark fantasy roguelike survival game inspired by *Halls of Torment* and *Diablo II*, engineered with high-performance web technologies (**TypeScript, Node.js Authoritative Server, WebSockets, Three.js 3D & Canvas 2.5D Rendering**).

### Core Highlights:
- **True Co-op Multiplayer**: 1 to 4 players simultaneously combating thousands of demonic entities on screen with authoritative physics and server-side hit detection.
- **9 Distinct Character Classes**: Unique combat styles, weapons, innate passive abilities, and element affinities.
- **Elemental Reaction System**: Combinations of Status Effects (Frost, Burn, Shock, Bleed, Holy) triggering massive secondary reactions (Shatter, Bloodflame, Superconduct, Conflagration).
- **Deep PoE-Style Skill Tree**: "Ancient Roots of Ascension" with interactive runic nodes, major keystones, and stat progression.
- **Mythic Evolution Crafting**: Synergy combinations allowing base skills to ascend into catastrophic battlefield-clearing powers.
- **Wellkeeper & Vault Equipment**: Extract loot during active runs via Well Shrines to unlock persistent gear at camp.
- **Live GM Airdrop Engine**: Real-time HTTP & CLI event dispatcher for instant player compensation and live server rewards.

---

## 2. Directory Structure & Architecture

```
halls-of-torment-coop/
├── package.json               # Dependencies (Three.js, ws, vite, typescript, etc.)
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite frontend bundler config
├── run-game.bat               # 1-Click launcher script (Windows: Client + Server + Tunnel)
├── GAME_SPEC.md               # Complete game documentation & developer handbook
├── src/
│   ├── shared/                # Universal Code (Shared 1:1 between Client & Server)
│   │   ├── types.ts           # Game state models, networking protocols, enums
│   │   ├── classes.ts         # 9 Hero definitions, baseline stats, signature cards
│   │   ├── gearData.ts        # Weapons, Armor, Boots, Accessories & Shrines
│   │   ├── skillTreeData.ts   # Massive PoE-style constellation graph & keystones
│   │   ├── stages.ts          # Stage multipliers, monsters & boss data
│   │   ├── trialQuests.ts     # In-game achievements, trial milestones & potion rewards
│   │   ├── constants.ts       # Shared tunable gameplay constants
│   │   └── i18n data lives in src/client/engine/I18n.ts (client-only, see below)
│   ├── server/                # Authoritative Node.js WebSocket Game Engine
│   │   ├── server.ts          # WebSocket & HTTP server, connection manager, GM API
│   │   ├── benchmark.ts       # Server-side perf benchmarking harness
│   │   ├── entities/
│   │   │   ├── ServerPlayer.ts# Authoritative player state & stat recalculation
│   │   │   └── ServerMonster.ts# Monster entity state, status effects, speed scaling
│   │   └── engine/
│   │       ├── GameRoom.ts    # Main game loop (20 Hz), combat resolver, pickups
│   │       ├── SpatialGrid.ts # O(1) Spatial Hash Grid for 2,000+ monsters
│   │       └── HordeDirector.ts# Wave pacing, spawn rings, difficulty progression
│   └── client/                # Browser Client Application
│       ├── main.ts            # Client network controller, loop runner, state interpolator, input handling
│       ├── engine/
│       │   ├── Renderer.ts    # 3D Three.js scene
│       │   ├── Renderer2D.ts  # 2D Canvas dynamic lighting/rendering
│       │   ├── InstancedHorde.ts# Instanced 3D rendering for large monster counts
│       │   ├── HordeSpriteRenderer.ts# 2.5D monster sprite batching
│       │   ├── SpriteSheetGenerator.ts# Procedural pixel-art sprite generation
│       │   ├── I18n.ts        # Bilingual Thai & English dictionary + language switching
│       │   ├── MetaProgression.ts# LocalStorage persistence (coins, unlocks, vault)
│       │   └── SoundManager.ts# Web Audio API synthesizers & sound effects
│       ├── entities/
│       │   ├── PlayerMesh.ts  # 3D player representation
│       │   ├── PlayerSprite.ts# Class sprites, rotation, signature passive visual halos
│       │   ├── VFX2D.ts       # 2D Canvas projectiles, shockwaves, laser beams, winds
│       │   └── VisualEffects.ts# 3D meshes & glowing particle systems
│       └── ui/
│           ├── LobbyUI.ts     # Character selector, party lobby, ready buttons
│           ├── HUD.ts         # Player health, team status, damage numbers
│           ├── MiniMap.ts     # In-run minimap
│           ├── SkillTreeUI.ts # Interactive PoE constellation web interface
│           ├── TraitSelector.ts# Level-up card selection (Reroll, Banish, Lock)
│           ├── GearVaultUI.ts # Wellkeeper equipment armory & blacksmith
│           ├── HallOfTrialsUI.ts# Achievement/trial browser & reward claiming
│           └── EscMenuUI.ts   # In-game pause, surrender, and settings menu
└── scratch/                   # Developer tools, CLI airdrop scripts, Puppeteer e2e tests
```

> Directory tree audited against the actual source tree on 2026-09-07 — update this section whenever files are added, renamed, or removed so it doesn't drift again.

---

## 3. Playable Hero Classes (9 Classes)

| # | Class Name | Title | Element | Primary Weapon | Innate Signature Skill | Role |
|---|------------|-------|---------|----------------|------------------------|------|
| 1 | **Swordsman** (นักรบดาบเหล็ก) | The Steel Bulwark | 🩸 Bleed | Greatsword Cleave | **Blade Whirlwind**: Every 3 attacks triggers a 360° hurricane spin & fires a flying crescent wave. | Tank / Frontline |
| 2 | **Archer** (พลธนูวายุ) | The Shadow Stalker | 🍃 Wind | Piercing Longbow | **Multishot**: High-velocity emerald arrows pierce multiple enemies across the entire screen. | Ranged / Sniper |
| 3 | **Sorceress** (จอมเวทสายฟ้า) | The Storm Weaver | ⚡ Lightning / ❄️ Frost | Chain Lightning | **Orbiting Orbs**: 2 revolving glacial orbs that deal 26-30 frost damage on contact and knock back foes. | AoE / Control |
| 4 | **Cleric** (นักบวชศักดิ์สิทธิ์) | The Dawnbringer | ✨ Holy | Holy Smite | **Holy Radiance**: Consecrated ground burning foes every 0.5s + 6s Radiant Pulse healing allies & smiting. | Support / Healer |
| 5 | **Commando** (ทหารคอมมานโด) | The Lead Rain | 🔥 Fire | M4A1 Carbine | **Frag Grenade**: Throws high-explosive shrapnel grenades every 4.5s that detonate into fiery shockwaves. | Rapid Burst |
| 6 | **Cat Tank** (แมวส้มหูพับ) | The Immortal Feline | 🐾 Earth | Heavy Claws & Bash | **9 Lives & Aggro Taunt**: Taunts enemies towards itself every 4.0s and resurrects up to 9 times! | Ultimate Meatshield |
| 7 | **Cowboy** (คาวบอยตะวันตก) | The Lone Gunslinger | 🩸 Bleed | Six-Shooter Revolver | **Ensnaring Lasso**: Throws a spinning lasso pulling enemies together into a tight pack every 4.5s. | Grouping / Finisher |
| 8 | **Celestial Mecha** (หุ่นรบสวรรค์) | Aegis-01 Apex | ⚡ Plasma / Shock | Dual Beam Sabers | **Wing Laser Salvo**: Locks onto nearby targets and fires twin piercing plasma laser beams every 4.0s. | Sci-Fi Bruiser |
| 9 | **The Gambler** (นักพนันเสี่ยงดวง) | Ace of Shadows | 🎲 RNG / Fate | Piercing Cards Fan | **Lucky Dice**: Tosses rolling dice every 5.5s. Rolling a 6 triggers a massive Jackpot gold explosion! | RNG / Gold Farming |

---

## 4. Combat Math & Formula Engine

### 4.1 Base Damage Formula
$$\text{FinalDamage} = (\text{FlatDamage} + \text{WeaponDamage}) \times \text{DamageBonus} \times (\text{CritChance Check ? } \text{CritBonus} : 1.0)$$

### 4.2 Elemental Reaction System
Monsters can hold element statuses for 4.5 seconds. Hitting an afflicted monster with a reacting element consumes both and triggers powerful reactions:

1. **Shatter (แตกกระจาย)**: `PHYSICAL` on `FROST`
   - Consumes Frost
   - Deals **300% Damage**
   - Erupts into **6 radial high-speed ice shards** hitting surrounding foes.
2. **Bloodflame (เพลิงโลหิต)**: `FIRE` on `BLEED` or `BLEED` on `BURN`
   - Consumes both statuses
   - Deals **220% Damage + 8% of Monster Max HP** in a catastrophic burst.
3. **Superconduct (ตัวนำยวดยิ่ง)**: `SHOCK` on `FROST` or `FROST` on `SHOCK`
   - Consumes both statuses
   - Inflicts **-50% Defense Debuff** (+50% all damage taken)
   - Arcs lightning to **up to 8 nearby monsters**.
4. **Holy Conflagration (เพลิงสุริยะ)**: `HOLY` on `BURN` or `BURN` on `HOLY`
   - Consumes both statuses
   - Deals **200% Holy Burst Damage**
   - Heals all alive teammates within 260px radius for **5% Max HP**.

---

## 5. Mythic Evolution System (Awakened Skills)

When a player levels up a signature skill to **Rank 3** and acquires its required synergy trait, a **Mythic Evolution Card** appears in the level-up choice:

| Evolution Name | Recipe Required | Evolution Effect |
|----------------|-----------------|------------------|
| **Crimson Tempest** (พายุโลหิตจุติ) | Whirlwind Rank 3 + Blood Cleave | Slashes expand into a 360° crimson hurricane that leeches life on kill. |
| **Blizzard Volley** (ห่าฝนหิมะจุติ) | Multishot Rank 3 + Frost Trap | Arrows become 8 hypersonic crystalline ice shards with infinite pierce. |
| **Hellfire Cataclysm** (มหันตภัยเพลิงจุติ) | Frag Grenade Rank 3 + Deadeye Pierce | Grenades call down falling napalm meteors devastating the battlefield. |
| **Absolute Zero Sphere** (วงแหวนศูนย์สัมบูรณ์) | Orbiting Orbs Rank 3 + Frost Nova | Orbs fuse into a hypersonic blizzard ring permanently freezing near monsters. |
| **Wrath of the Thunder God** (มหาอัสนีพิโรธ) | Chain Lightning + Static Field | Arcs chain across 12 targets, calling down divine thunder pillars on crits. |
| **Titan Earthquake** (ธรณีกัมปนาทจุติ) | Aggro Taunt Rank 3 + Nine Lives | Cat slam creates a massive 280px tectonic shockwave stunning and crushing mobs. |

---

## 6. Ancient Roots of Ascension (Passive Skill Tree)

The Skill Tree is modeled after the *Path of Exile* constellation web:
- **Starting Point**: Each class has a dedicated root (`sw_root`, `ar_root`, `so_root`, etc.).
- **Universal Hub**: Connects all class trees via `uni_root`.
- **Node Allocation**: Players spend **Gold Coins** to allocate nodes. A node can only be unlocked if an adjacent connected node has already been allocated.
- **Node Types**:
  - *Minor Nodes*: +HP, +Damage, +Move Speed, +Area of Effect.
  - *Notable Nodes*: Unique combat perks (e.g. Outlaw Gold Bag, Golden Sixes, Astral Aegis).
  - *Keystones*: Game-changing build modifiers (e.g. Converting excess heal into absorption shields).
- **Persistence**: Saved automatically in `localStorage` under `torment_meta_save_v2`.

---

## 7. Equipment, Wellkeeper & Vault System

- **Equipment Slots**: 5 Slots (Head, Chest, Boots, Ring, Amulet).
- **Rarity Hierarchy**: Common (White) ➔ Rare (Blue) ➔ Epic (Purple) ➔ Legendary (Gold) ➔ Mythic (Crimson).
- **Well Shrines**:
  - Found during active runs.
  - A player standing at the well can deposit found gear items.
  - **Shared Team Reward**: When extracted, all team members unlock the item in the Camp Vault!
- **Blacksmith Forge**: At Camp, players can equip and forge gear before launching a run.

---

## 8. Networking & Server Engine

### 8.1 Architecture
- **Protocol**: Raw WebSockets using lightweight JSON messaging (`types.ts`).
- **Tick Rate**: **20 Hz (50ms per tick)** for optimal network efficiency and smooth client interpolation.
- **Authoritative Simulation**: Monster health, movement, knockbacks, item drops, and cooldowns are calculated strictly on the server to prevent cheating or desync.
- **Spatial Hash Grid**: `SpatialGrid.ts` partitions the $4,500 \times 4,500$ map into $128\text{px}$ cells, enabling $O(1)$ collision and radius checks for over 2,000 entities simultaneously without lag.

### 8.2 Live GM Airdrop Engine
The server includes a dual HTTP/WebSocket administrative endpoint on port 8080:
```http
GET /api/grant-gold?amount=35000
```
- **Zero Downtime**: Distributes gold immediately to all connected players without restarting the server or kicking players from their runs.
- **CLI Command**:
  ```bash
  node scratch/airdrop.cjs [amount]
  ```
- **Feedback**: Displays a golden toast notification on the client lobby and floats gold numbers above characters in-game.

---

## 9. Developer Quick-Start Guide (For Handover)

### 9.1 Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm or yarn

### 9.2 Running Locally
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Game Server** (WebSocket & GM API on port 8080):
   ```bash
   npm run server
   # or: npx tsx src/server/server.ts
   ```
3. **Start Client Dev Server** (Vite on port 3000):
   ```bash
   npm run dev
   # or: npx vite --port 3000
   ```
4. **Build Production Bundle**:
   ```bash
   npm run build
   ```
5. **One-Click Launch (Windows)**:
   Double-click `run-game.bat` to launch Vite, the Game Server, and Cloudflare Tunnel concurrently!

---

## 10. How to Extend the Game

### Adding a New Hero Class
1. Open `src/shared/types.ts` and add the class enum to `PlayerClass`.
2. Open `src/shared/classes.ts` and define:
   - Base stats in `CLASS_DEFINITIONS`.
   - Starter skills in `CLASS_STARTER_SKILLS`.
   - Level-up blessing cards in `CLASS_UPGRADE_CARDS`.
3. Add class sprites and visual halo in `src/client/entities/PlayerSprite.ts`.
4. Add weapons and attack logic in `src/server/engine/GameRoom.ts`.

### Adding a New Elemental Reaction
1. Open `src/server/engine/GameRoom.ts` and locate `damageMonster()`.
2. Add a new reaction conditional checking `monster.hasStatus(elemA)` and `sourceElement === elemB`.
3. Define multiplier, visual shockwave projectile, and floating text label.

---
*Created and maintained with Antigravity AI — Built for limitless dark fantasy co-op survival.*
