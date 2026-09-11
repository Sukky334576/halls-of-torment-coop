# 📜 GAME SPECIFICATION & ARCHITECTURE REFERENCE
## Project: Torment of Souls (Dark Fantasy 4-Player Co-op Horde Survival)
*A Complete Developer & Architectural Guide for Ongoing Development*

---

## 1. Project Overview & Core Vision

**Torment of Souls** is a 4-player cooperative dark fantasy roguelike survival game inspired by *Halls of Torment* and *Diablo II*, engineered with high-performance web technologies (**TypeScript, Node.js Authoritative Server, WebSockets, Canvas2D Rendering**).

> Rendering note (corrected 2026-09-09): the live render path is **100% Canvas2D** — `Renderer.ts` (Three.js/WebGL) and `InstancedHorde.ts` exist in the source tree but are never imported or instantiated anywhere in the client. Don't extend them expecting them to run; see §2 directory notes.

### Core Highlights:
- **True Co-op Multiplayer**: 1 to 4 players simultaneously combating thousands of demonic entities on screen with authoritative physics and server-side hit detection.
- **9 Distinct Character Classes**: Unique combat styles, weapons, innate passive abilities, and element affinities.
- **Elemental Reaction System**: Combinations of Status Effects (Frost, Burn, Shock, Bleed, Holy) triggering massive secondary reactions (Shatter, Bloodflame, Superconduct, Conflagration).
- **Deep PoE-Style Skill Tree**: "Ancient Roots of Ascension" with interactive runic nodes, major keystones, and stat progression.
- **Mythic Evolution Crafting**: Synergy combinations allowing base skills to ascend into catastrophic battlefield-clearing powers.
- **Gear Drops & Vault Equipment**: Monster kills can drop gear mid-run (bosses guaranteed, weighted toward higher rarity) — banked straight to the finder's persistent Vault, never handed out by an achievement (see §7).
- **Live GM Airdrop Engine**: Real-time HTTP & CLI event dispatcher for instant player compensation and live server rewards.

---

## 2. Directory Structure & Architecture

```
halls-of-torment-coop/
├── package.json               # Dependencies (Three.js, ws, vite, typescript, etc.)
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite frontend bundler config
├── ecosystem.config.cjs       # pm2 process definition for production (see §8.3, §13)
├── .env.server.example        # Template for the gitignored .env.server (JWT_SECRET, PARTY_CODE)
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
│   │   ├── loadEnv.ts         # First import in server.ts — loads .env.server before anything else (see §8.3, §13)
│   │   ├── server.ts          # WebSocket & HTTP server, connection manager, room registry, GM API
│   │   ├── auth.ts            # bcrypt hashing, JWT sign/verify, login/register rate limiting
│   │   ├── db.ts              # SQLite (better-sqlite3) — users & progression tables
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
│       │   ├── Renderer.ts    # ⚠️ DEAD CODE — Three.js/WebGL scene, never instantiated by GameApp
│       │   ├── Renderer2D.ts  # THE live renderer — Canvas2D, resolution scale + DPR cap driven by GraphicsSettings
│       │   ├── InstancedHorde.ts# ⚠️ DEAD CODE — Three.js InstancedMesh horde renderer, never instantiated
│       │   ├── HordeSpriteRenderer.ts# The actual live horde renderer — Canvas2D sprite-sheet batching
│       │   ├── SpriteSheetGenerator.ts# Procedural pixel-art sprite generation
│       │   ├── GraphicsSettings.ts# Low/Medium/High render-quality setting (localStorage), cycled from EscMenuUI
│       │   ├── I18n.ts        # Bilingual Thai & English dictionary + language switching
│       │   ├── MetaProgression.ts# LocalStorage persistence (coins, unlocks, vault)
│       │   ├── AuthClient.ts  # Register/login HTTP calls, JWT storage (see §8.3)
│       │   ├── sanitize.ts    # escapeHtml() — required before any user-controlled name reaches innerHTML (see §13)
│       │   └── SoundManager.ts# Web Audio API synthesizers & sound effects
│       ├── entities/
│       │   ├── PlayerMesh.ts  # 3D player representation
│       │   ├── PlayerSprite.ts# Class sprites, rotation, signature passive visual halos
│       │   ├── VFX2D.ts       # 2D Canvas projectiles, shockwaves, laser beams, winds
│       │   └── VisualEffects.ts# 3D meshes & glowing particle systems
│       └── ui/
│           ├── AuthGateUI.ts  # Mandatory login/register screen — blocks everything until authenticated
│           ├── MainMenuUI.ts  # Post-login solo/multiplayer choice
│           ├── RoomBrowserUI.ts# Public room list — create/join, optional password (see §8.4)
│           ├── AccountUI.ts   # Account panel (logged-in-as, logout) reachable from the lobby
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

> Directory tree audited against the actual source tree on 2026-09-10 — update this section whenever files are added, renamed, or removed so it doesn't drift again.

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
- **Node Allocation**: Players spend **Soul Coins** (renamed from Gold Coins 2026-09-11, see §11.1) to allocate nodes. A node can only be unlocked if an adjacent connected node has already been allocated.
- **Node Types**:
  - *Minor Nodes*: +HP, +Damage, +Move Speed, +Area of Effect.
  - *Notable Nodes*: Unique combat perks (e.g. Outlaw Soul Bag, Golden Sixes, Astral Aegis).
  - *Keystones*: Game-changing build modifiers (e.g. Converting excess heal into absorption shields).
- **Persistence**: Saved automatically in `localStorage` under `torment_meta_save_v2`.
- **Safeguards**: `MetaProgression.canAllocateNode()` rejects spending on a node whose `classType` hero isn't unlocked, and `SkillTreeUI` shows a confirm dialog ("Spend N Soul Coins to permanently unlock X?") before any node purchase — both added after a bug allowed spending currency on classes the player didn't own with no confirmation.

---

## 7. Equipment, Gear Drops & Vault System

- **Equipment Slots**: 6 slots (Head, Chest, Boots, Gloves, Ring, Amulet) — `GearSlot` in `gearData.ts`.
- **Rarity Hierarchy**: Common ➔ Rare ➔ Unique, 3 items per slot (18 items total in `GEAR_CATALOG`). `GearRarity` also allows a `'magic'` tier but no catalog item currently uses it.
- **Monster Gear Drops** (added 2026-09-11, replaces an earlier unfinished "Well Shrine deposit" design that was never wired up server-side — only a stub `PickupType.WELL_GEAR` enum value and a minimap filter existed): a normal monster kill has a `GAME_CONSTANTS.GEAR_DROP_CHANCE` (1.5%) chance to drop one piece of gear, weighted toward common (`GameRoom.rollGearDrop()`: common 70 / rare 25 / unique 5). **Every boss kill guarantees exactly one gear drop instead**, weighted toward higher rarity (common 30 / rare 45 / unique 25). The dropped `WELL_GEAR` pickup expires after 60s uncollected, same as other timed world drops. On pickup, only the collector is granted the item — `GameRoom` sends them a personal `WELL_GEAR_RETRIEVED` message (client calls `MetaProgression.addGearToVault()`), while every player nearby just sees a `broadcastDamageNumber` callout naming the finder and the item.
- **Gear must only ever come from monster kills, never from an achievement**: `trialQuests.ts`'s `TrialRewardType` deliberately has no `'GEAR'` case (removed 2026-09-11 — 3 quests that used to hand out specific unique/rare items now pay Soul Coins instead, scaled to difficulty). Equipment should feel earned from a real fight.
- **Blacksmith Forge**: At Camp, players can equip gear (`MetaProgression.equipGear()`) from their Vault (`vaultInventory`) before launching a run; stats stack additively across all 6 equipped slots (`getEquippedStatsTotal()`).

---

## 8. Networking & Server Engine

### 8.1 Architecture
- **Protocol**: Raw WebSockets using lightweight JSON messaging (`types.ts`). The `TICK` payload is serialized **once per room per tick** (`broadcastToRoom()` in `server.ts`) and reused for every connected client, not re-stringified per player.
- **Tick Rate**: **25 Hz (40ms per tick)**, see `GAME_CONSTANTS.SERVER_TICK_RATE`/`SERVER_TICK_MS` in `constants.ts`.
- **Authoritative Simulation**: Monster health, movement, knockbacks, item drops, and cooldowns are calculated strictly on the server to prevent cheating or desync.
- **Spatial Hash Grid**: `SpatialGrid.ts` partitions the $4,500 \times 4,500$ map into $150\text{px}$ cells (`GAME_CONSTANTS.SPATIAL_CELL_SIZE`), enabling $O(1)$ collision and radius checks. Measured live: at the documented worst case (4 players, 740 monsters — the `HordeDirector.ts` cap of `380 + (playerCount-1)*120` — plus 150 projectiles), a full `tick()` averages **~0.9ms** (worst observed ~4.4ms) against the 40ms budget, and the resulting JSON payload is **~78KB/tick/client** (~1.9MB/s at 25Hz) since WebSocket compression (`perMessageDeflate`) is not currently enabled.
- **Multi-room design** (updated 2026-09-10, was single-room): `server.ts` holds a `Map<string, RoomEntry>` — the server hosts many concurrent rooms (each up to 4 players), not just one active match. See §8.4.

### 8.1.1 Reliability: Reconnect & Party Codes
- **Device identity**: the client generates a persistent `deviceId` (`localStorage: torment_device_id`, `main.ts`) independent of the WebSocket connection, used as the player's key inside `GameRoom` instead of the ephemeral per-connection id.
- **Disconnect grace period**: a dropped connection mid-match calls `GameRoom.disconnectPlayer()`, which ghosts the character (untargetable, `ServerPlayer.isDisconnected`) and starts a `GAME_CONSTANTS.RECONNECT_GRACE_MS` (60s) timer before the character is actually removed. Reconnecting within that window (`reconnectPlayer()`) resumes the same level/gold/position instead of a fresh character.
- **Client-side auto-reconnect** (added 2026-09-10): this grace period used to only be reachable by manually refreshing the page — the client had no `ws.onclose`/`onerror` handler at all, so a connection silently dropped (mobile backgrounding, a stray back-gesture, a network blip) left the render loop quietly redrawing the last-known tick forever (looks fine) while every outgoing action (surrender included) silently no-op'd on the dead socket. `GameApp.connectWebSocket()` in `main.ts` now retries with linear backoff (capped at 5s, `MAX_RECONNECT_ATTEMPTS = 20`) and shows a fixed top-of-viewport banner (`#connection-banner`, above every other screen) while retrying. On reconnect, `onopen` skips the fresh-connect flow (auto-`CREATE_ROOM`/room browser) whenever `isGameRunning` is already true, since the server's own `JOIN_LOBBY` resume path already sends `GAME_START` back.
- **Party code**: an optional `PARTY_CODE` env var gates `JOIN_LOBBY` — clients must supply a matching `?code=` query param (`JOIN_REJECTED` otherwise). Unset by default for frictionless LAN/local testing.

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

### 8.3 Player Accounts (added 2026-09-10)
- **Storage**: SQLite via `better-sqlite3` (`src/server/db.ts`) — two tables, `users` (id, username, `password_hash`, created_at) and `progression` (user_id, JSON `data` blob, updated_at). File picked by `NODE_ENV`: `data/game.dev.db` in development, `data/game.db` in production.
- **Auth**: `src/server/auth.ts` — passwords hashed with `bcryptjs` (10 rounds); sessions are a JWT (`HS256`, algorithm pinned explicitly on both sign and verify — see §13), 30-day expiry, signed with `JWT_SECRET`. Loaded from a gitignored `.env.server` via `src/server/loadEnv.ts` (named `.env.server`, not `.env`, specifically so Vite's client build never scans it and risks inlining a secret into the browser bundle).
- **HTTP endpoints**: `POST /api/register`, `POST /api/login` (both rate-limited per-IP, see §13), `GET`/`POST /api/progression` (Bearer-token authed, syncs `MetaProgression`'s save data).
- **Client flow**: login is mandatory — `AuthGateUI` blocks everything until authenticated (no guest mode), then `MainMenuUI` offers solo/multiplayer. `AuthClient.ts` stores the token in `localStorage`.

### 8.4 Multi-Room Lobby System (added 2026-09-10)
- **Rooms**: `rooms: Map<string, RoomEntry>` in `server.ts` — each `RoomEntry` wraps a `GameRoom` plus `name`, `hostName`, and an optional plaintext `password` (a lightweight room passcode shared between friends, not an account credential — never sent back to clients, only `hasPassword: boolean` is). Solo mode silently `CREATE_ROOM`s for the player with no browser; multiplayer shows `RoomBrowserUI`, a public list of every open room (`LIST_ROOMS`/`ROOM_LIST`, pushed automatically on every create/join/leave/start).
- **Room naming**: default name is `Room #<n>` (a counter), not derived from the host's player name, so renaming your character doesn't imply anything about who owns a room.
- **Capacity/DoS limits** (added alongside a security pass, see §13): `MAX_ROOMS = 100` total concurrent rooms server-wide; room name/password/player name/deviceId are length-capped server-side (a raw WS client bypasses the real UI's input `maxlength` entirely).
- **Lifecycle**: a room is deleted and `broadcastRoomList()`'d the moment its last player leaves (`GameRoom`'s existing `onEmpty` callback) — if the host leaves, the room simply continues for whoever's left; there's no host migration logic because there's no host-only capability to migrate.
- **Hero selection happens after joining a room** (fixed 2026-09-10): `GameRoom.addPlayer()` — which builds the actual `ServerPlayer`, class-dependent stats and all — used to only ever run once, at `CREATE_ROOM`/`JOIN_ROOM` time, before the player had picked a hero in the lobby. Picking any class always played as the connection default (Swordsman) as a result. `server.ts`'s `JOIN_LOBBY` handler now re-runs `addPlayer()` (a plain `Map` overwrite keyed by `deviceId`, safe pre-match) whenever the player is already in a not-yet-started room, so a hero change actually reaches the room.

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
2. **Configure secrets** (required since accounts were added — see §8.3):
   ```bash
   cp .env.server.example .env.server
   # fill in JWT_SECRET; see the comment in .env.server.example for how to generate one
   ```
3. **Start Game Server** (WebSocket, HTTP auth API, and GM API on port 8080):
   ```bash
   npm run server
   # or: npx tsx src/server/server.ts
   ```
4. **Start Client Dev Server** (Vite on port 3000):
   ```bash
   npm run dev
   # or: npx vite --port 3000
   ```
   Login is mandatory now (no guest mode) — register an account on first load.
5. **Build Production Bundle**:
   ```bash
   npm run build
   ```
6. **One-Click Launch (Windows)**:
   Double-click `run-game.bat` to launch Vite, the Game Server, and Cloudflare Tunnel concurrently!

### 9.3 Production Deploy
Run via the tracked pm2 config rather than a manual `pm2 start` — see the caution note in §13 about why:
```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```
`ecosystem.config.cjs` sets `NODE_ENV=production` (picks `game.db` over `game.dev.db`, §8.3); `.env.server` on the deploy box supplies `JWT_SECRET`/`PARTY_CODE`. To pick up a code change afterward, `pm2 restart game-server` is enough — no need to delete/recreate the process.

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

## 11. Co-op Soul Coin Economy & Trait Power Tiers

> Renamed 2026-09-11: the currency was previously called "Gold Coin" everywhere in the UI — pure display rename to "Soul Coin" (Thai: เหรียญวิญญาณ), no mechanics change. Internal identifiers (`gold`, `GOLD_COIN`, `GOLD_DROP_CHANCE`, `/api/grant-gold`, etc.) were deliberately left as-is; only player-facing text changed.

### 11.1 Personal Soul Coin Wallets
Soul Coins are **per-player, not a shared team pool**: `ServerPlayer.gold` credits whoever actually collects a `GOLD_COIN` or `TREASURE_CHEST` pickup (`handlePickupCollection()` in `GameRoom.ts`), at `GAME_CONSTANTS.GOLD_DROP_CHANCE` (2.2% per kill, named constant added 2026-09-11 — was previously an inline `0.022`). A run's `GAME_OVER` payload reports `personalGold` (this player's own collected total) separately from a `teamGold`/`playerCount` bucket split evenly across the party — `teamGold` starts at **0** every match (fixed 2026-09-10; it used to seed 35,000 as a "starting gift", silently handing out free gold every single run) and only grows via `grantBonusGold()`, the `/api/grant-gold` GM command. EXP remains fully shared team-wide regardless of who lands the kill.

**Surrendering** (added 2026-09-11) keeps only `GAME_CONSTANTS.SURRENDER_GOLD_RETENTION` (50%) of a player's personally-collected gold, rounded down — a deliberate-bailout penalty, unlike dying or timing out which still pay out 100%. Scoped precisely in `GameRoom.handleSurrender()`: applies to the surrendering player only, tagged via `GAME_OVER.reason: 'SURRENDER'` so the client shows a distinct subtitle — the co-op fallback broadcast that reaches teammates who died naturally (not by choice) is untouched.

### 11.2 Power Tiers (S/A/B/C/D)
Every trait card's `rarity` maps 1:1 to a power tier via `getPowerTier()` in `classes.ts`:

| Rarity | Tier | Relative drop weight | Effect multiplier (`TIER_POWER_MULTIPLIER`) |
|---|---|---|---|
| Mythic | S | rarest | ×2.2 |
| Legendary | A | rare | ×1.7 |
| Epic | B | uncommon | ×1.35 |
| Rare | C | common | ×1.0 (baseline) |
| Common | D | most common | ×0.7 |

Tier affects **both** drop odds (`getTierWeight(rarity, tierLuckPct)`, shifted by the `flatTierLuckPct` skill-tree keystone) and the actual magnitude of a card's effect — a D-tier and an S-tier card with the same theme (e.g. both granting Max HP) differ in value proportionally to `TIER_POWER_MULTIPLIER`, not just in how often they appear. The tier letter and a color-coded badge (matching the card's rarity border) render on every level-up card in `TraitSelector.ts`; cards flagged `isSignature` (a class's personal skill, gated behind unlocking it in the Skill Tree) additionally show a cyan "Signature Skill" badge so they read as visually distinct from universal cards.

### 11.3 Magnet Pickup
A low-chance (`GAME_CONSTANTS.MAGNET_DROP_CHANCE`, **0.75%** per kill — halved from 1.5% on 2026-09-11, still felt too common at the old rate) pickup that, when collected, sweeps every EXP gem and Soul Coin currently on the map to the collecting player with a cosmetic pull-in spark animation (`MAGNET_PULL_SPARK` projectile, purely visual — it does not change who ends up keeping the gold, that's still decided by the personal-wallet rule above). Also added 2026-09-11: the pickup now expires after 60s if uncollected (`duration`/`maxDuration`, same mechanism as Treasure Chest/Health Potion) — previously it had no expiry at all, so one dropped behind the ever-advancing swarm front line would sit on the map as permanent clutter for the rest of the run.

## 12. Performance & Graphics Quality
- **Server**: broadcast payload is serialized once per room per tick (§8.1); `VFX2D.ts` avoids `ctx.shadowBlur`/regenerated gradients on the highest-frequency draws (EXP gems, gold coins); `HordeSpriteRenderer.ts` (the monster renderer — up to 740 concurrent) uses pure sprite-sheet `drawImage` batching, no per-monster `shadowBlur`/gradients at all.
- **Client Graphics Quality setting** (`GraphicsSettings.ts`, cycled from the ESC menu footer): Low/Medium/High presets scale the Canvas2D backing-buffer resolution (`dprCap` × `renderScale`) live, no reload required. **Medium is the default and matches pre-setting behavior exactly** (dprCap 1.5, renderScale 1.0), so existing play is unaffected unless a player opts into Low (dprCap 1.0 × 0.75 — roughly half the pixels to fill, reads as a deliberate retro pixel-art look since the canvas already renders with `image-rendering: pixelated`) or High (dprCap 2.0, for crisper output on high-DPI displays with headroom to spare).

### 12.1 Burst-kill stutter audit (2026-09-10)
Reported as "stutters when items drop" — the actual trigger is any moment many monsters die at once (an AoE clearing a pack), since that's also when many damage numbers and death decals spawn simultaneously, all first-rendered on the same frame. Two real, fixed causes plus a broader per-frame-waste sweep prompted by the same report:
- **Floating damage numbers** (`HUD.ts`): every number (one per hit) drew with both `strokeText` and `fillText` for its whole ~1s life — `strokeText` builds glyph outline geometry to stroke rather than just rasterizing a fill, and is markedly more expensive. Common (non-crit, unlabeled) numbers — by far the most frequent case — now use a small `shadowBlur` instead; crit/labeled numbers keep the stroke since they're rarer. Also capped at `MAX_FLOATING_TEXTS = 60` so an unusually large burst can't scale the cost unbounded.
- **Death decals** (`Renderer2D.ts`, `spawnDeathDecal`/`groundDecals`): `BONE_DUST`/`DEMONIC_ASH` decals rebuilt their radial gradient from scratch every frame for their whole 3-second life (up to 250 concurrent, an existing cap) even though the gradient only depends on `radius`, fixed at spawn — a larger raw cost than the damage-number case since decals live 3× as long. Now cached on the decal object, built once on first draw.
- **Static gradients rebuilt every frame regardless of bursts** (found during the same sweep, not burst-specific): the minimap's brass ring border and 6 of `LobbyUI`'s scene-background gradients (wall ambient, dais, both dais-wing shadows, floor, floor ambient pool) never actually change frame to frame — fixed canvas dimensions and hardcoded color stops, no `time` term — but were rebuilt 60×/second for as long as either screen was up. Cached now, invalidated only on canvas resize. (The gate torch auras were left alone — their alpha genuinely animates via a flicker term, so they can't be cached as-is.)
- **Caution for future VFX work**: before adding a new per-kill or per-drop visual effect, check whether it allocates a `CanvasGradient`/`CanvasPattern` or sets `shadowBlur` inside a loop over a variable-count collection — that's the exact shape every bug above took. If the shape/color of the gradient doesn't depend on anything that changes after creation, cache it on the entity instead of recreating it per frame.

### 12.2 UI layering fixes (2026-09-10)
Two unrelated bugs where one screen/overlay silently hid another, found while testing the fixes above:
- **Boss-encounter HUD banners crowding each other**: `.hud-boss-banner` was defined twice in `index.html` with conflicting `top`/`z-index` (only the later rule ever applied), and along with the shrine-buff and execute-deadline banners, each guessed its own fixed pixel `top` offset stacked below the one before it — a longer boss name/label was enough to push the deadline countdown into overlapping the banner above it. All three now share one flex-column wrapper (`.hud-banner-stack`, see `HUD.ts`) that spaces them by actual rendered height instead.
- **Defeat/victory screen hidden behind an open level-up card**: `GAME_OVER`'s cleanup only removed the `trait-modal-open` body class — it never touched the trait modal's own inline `display: flex` (set when a card renders) — so a match ending (surrender, death, or victory) while a level-up choice was still on screen left the result screen rendered but invisible underneath it. `TraitSelector.hide()` now force-closes (and drops any still-queued choices) alongside the existing `escMenu.hide()`.

---

## 13. Security Hardening (2026-09-10 audit + fixes)

A 3-part audit (host VPS, server code, client code) plus follow-up fixes closed several real, exploitable gaps. Kept here so the reasoning isn't lost — don't casually revert any of these without re-reading why.

- **Client-controlled name/room-name XSS**: `RoomBrowserUI`, `LobbyUI`, `HUD`, and `EscMenuUI` all interpolated a player's display name or a room's name into `innerHTML` unescaped. Unlike account usernames (regex-gated `[a-zA-Z0-9_]{3,20}` at registration), display names and room names have no character restriction — a crafted name ran arbitrary script in every other viewer's browser, able to read the JWT out of `localStorage`. Fixed via `src/client/engine/sanitize.ts`'s `escapeHtml()`, applied everywhere a server-sourced name reaches `innerHTML`.
- **Login rate limiter was a single shared bucket, not per-client**: it keyed on `req.socket.remoteAddress`, which behind nginx is always `127.0.0.1` — every visitor shared one throttle, so a handful of failed logins from anyone locked out login for everyone. Fixed by reading `X-Real-IP` (nginx's own view of the connection, not client-suppliable) with an `X-Forwarded-For`-last-hop fallback. `/api/register` had no rate limit at all — added one, namespaced separately from login's so the two don't drain each other's allowance.
- **WS/HTTP abuse surface**: free-text WS fields (name/roomName/password/deviceId) had no length cap server-side (a raw client bypasses the real UI's `maxlength`) and got re-broadcast on every lobby-state update; `WebSocketServer` had no `maxPayload` (the `ws` library default is 100MB); nothing capped concurrent rooms. Fixed with explicit length caps, `maxPayload: 32KB`, and `MAX_ROOMS = 100` (§8.4). **Caution if touching `maxPayload` again**: it requires a `ws.on('error', ...)` listener on every connection — an 'error' event with none crashes the whole Node process, which is exactly what an oversized-frame rejection fires.
- **JWT algorithm not pinned**: `jwt.verify()` trusted library defaults instead of explicitly requiring `HS256`. Not currently exploitable (no asymmetric key exists to enable classic algorithm-confusion), but pinned as defense-in-depth — `signToken`/`verifyToken` in `auth.ts` both specify `algorithm`/`algorithms` now.
- **Unhandled promise rejections could kill the process**: the progression HTTP handlers and a TOCTOU race in `/api/register` (two concurrent registrations for the same username could both pass the pre-check) threw without being caught, and Node terminates on unhandled rejections by default. Wrapped via a `safeHandler()` helper returning a generic 500, plus an explicit `SQLITE_CONSTRAINT` catch in register.
- **Host (Contabo VPS)**: SSH password auth was actually enabled (two conflicting `sshd_config.d` drop-ins; the wrong one won) with a usable root password and no fail2ban — now `PasswordAuthentication no` / `PermitRootLogin prohibit-password` via a drop-in that sorts first. The Node process listened on the wildcard address, one firewall misconfiguration away from bypassing nginx entirely — now bound to `127.0.0.1` explicitly (override with `HOST` env if a deploy genuinely needs otherwise). `data/game.db*` tightened from `644` to `600`. nginx: added `X-Content-Type-Options`/`X-Frame-Options`, hid the version string (`server_tokens off`), and added `limit_req` zones (`api_zone` 5r/s on `/api/`, `general_zone` 20r/s on `/ws`). **Caution**: don't put `limit_req` on the static-file `location /` — sprite assets legitimately burst dozens of parallel requests on page load and this broke real gameplay the first time it was tried.
- **Deliberately left open**: `/api/grant-gold` still has no auth (an explicit, accepted GM command for friend-testing — don't "fix" this without asking), locking root's password entirely, splitting the game-server process off root into its own user, and TLS (needs a domain name first, currently IP-only).

---

## 14. Boss Combat: Attack Patterns (added 2026-09-11)

Bosses previously had zero abilities beyond the same "Default Melee Chaser" contact-damage AI every basic monster uses — `ServerMonster.isRanged()` never included `ELITE_GOLEM`/`LORD_OF_TORMENT`. `GameRoom.updateBossAbilities()` (called once per tick per boss, right after grid insertion) now gives each boss type its own kit:

- **Elite Golem — Ground Slam**: every 7s, if any player is within 260px, deals 2.5× the golem's base damage to every player within a 180px radius and spawns a `TITAN_QUAKE_WAVE` visual (existing projectile type, reused so no new client rendering was needed).
- **Lord of Torment — Void Barrage**: every 6s, if the nearest player is within 550px, fires 5 `ENEMY_VOID_ORB` projectiles in a fan spread (±0.5 rad) at 80% of the boss's base damage each.
- **Lord of Torment — Reinforcements**: every 15s, summons 2 Hellhounds near itself via `HordeDirector.getNextEntityId()` (the same collision-safe ID minting used by the `ALTAR_VOID` shrine's boss-spawn).

`ServerMonster` gained two staggered timer fields (`bossAbilityTimer`, `bossSummonTimer`, randomized 0-3s/0-6s on spawn) so a boss doesn't fire every ability in its first second alive.

## 15. Client-Side Bug Fixes (2026-09-11)

Three unrelated client bugs found and fixed in the same session:

- **Pause didn't actually stop sound**: `GameRoom.tick()` reset `this.damageNumbers = []` *after* its `isPaused` early-return, so whatever was in the array from the last active tick (e.g. mid-combat when the pause menu opened) kept re-broadcasting unchanged on every frozen tick — the client's hit-impact sound/VFX trigger just checks "is this tick's damageNumbers non-empty," so it fired continuously for as long as the game stayed paused. Fixed by moving the reset before the pause check. (An earlier, incomplete fix only covered the Dash sound specifically, via a client-side `isPaused` guard on `performDash()` — that stayed in place since it's a real, if redundant, belt-and-suspenders guard, but the actual root cause was server-side.)
- **Reroll/Banish potions looked like no-ops**: `TraitSelector.showChoices()` queued (`pendingQueue`) any second `LEVEL_UP_CHOICE` message that arrived while the trait modal was already open, on the assumption it could only be a second, unrelated level-up stacking up. In practice the server already handles that exact scenario itself (`GameRoom.startLevelUpChoice()`'s `pendingLevelUpChoices` counter only re-sends a fresh choice *after* the client has closed the current modal) — so the only time a second `LEVEL_UP_CHOICE` can arrive while `isShowing` is true is a Reroll or Banish response to the currently-open pick. The queue silently swallowed it instead of displaying it. Fixed by removing the queue entirely — `showChoices()` now always replaces what's on screen immediately.
- **English-mode stage descriptions showed Thai text**: `LobbyUI.ts`'s stage-select card had `stageDesc = isTh ? I18n.t(...) : stage.description`, but `stage.description` in `stages.ts` is itself Thai text (unlike the `stageName`/`stageSub` fields one line above, which already picked the correct language) — swapped to match that existing pattern.

---
*Created and maintained with Antigravity AI — Built for limitless dark fantasy co-op survival.*
