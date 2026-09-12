# 🃏 Card List — Level-Up Trait System

## Change Log

| วันที่ | สรุปสิ่งที่เปลี่ยน | เหตุผล/อ้างอิง |
|---|---|---|
| 2026-09-12 | สร้างเอกสารครั้งแรก — quick-reference ตาราง 70 ใบ | คำสั่ง user: สำรวจ repo แล้วสร้าง card-list.md |
| 2026-09-12 | ไล่หา root cause ของ 5 การ์ดที่ description ไม่ตรง apply() จนสุดสาย (grep ทุกจุดที่อ่าน field จริงใน `GameRoom.ts`/`ServerPlayer.ts`) เปลี่ยนหมายเหตุท้ายเอกสารจาก "ยังไม่ยืนยัน" เป็นตารางสรุป source จริงครบทุกใบ + sync เข้า `GAME_WIKI.md` §4.7 risk #27 | คำสั่ง user: "ไล่หาต่อ" |
| 2026-09-12 | Rebase บน `main` หลัง session PM ตัดสินใจแก้ 5 การ์ดแล้ว (commit `91ae614`) — อัปเดตตารางหลัก 2 แถว (magnet_1, gambler_fortune_greed) ให้ตรง `apply()` เวอร์ชันใหม่ + เปลี่ยนหมายเหตุท้ายเอกสารจาก "รอตัดสินใจ" เป็น "แก้แล้ว" พร้อมตาราง before/after | PM session แจ้งผล + ขอให้ sync เอกสารก่อน merge |

> เอกสารนี้เป็น **quick-reference** คนละ scope กับ [`docs/APPENDIX_TRAITPOOL.md`](APPENDIX_TRAITPOOL.md)
> (เอกสารนั้นมี column แบบ deep-dive: power tier, `apply()` แบบเต็ม, isSignature/isEvolution แยกคอลัมน์)
> เอกสารนี้ทำเป็นตาราง flat อ่านเร็วตามที่ user ขอ (ชื่อ/rarity/type/เอฟเฟค/scaling) — **ข้อมูลดิบมาจาก source เดียวกัน**
> อ่านและ verify ตรงจากไฟล์จริงอิสระอีกรอบ (ไม่ได้ copy จาก appendix)

**Source of truth**: [`src/shared/classes.ts:647-1855`](../src/shared/classes.ts#L647) — `export const TRAIT_POOL: TraitOption[]` (70 รายการ, ยืนยันด้วย `grep -c "id:"` ในช่วงบรรทัดนี้ = 70)
ใช้งานจริงโดย server ตอน level-up ที่ [`src/server/engine/GameRoom.ts:3282`](../src/server/engine/GameRoom.ts#L3282) (`TRAIT_POOL.filter(...)` เลือกการ์ดให้ผู้เล่น)
Type definition: [`src/shared/types.ts:246`](../src/shared/types.ts#L246) `interface TraitOption`

**หมายเหตุเรื่อง field ที่ user ขอแต่ไม่มีใน source (ยืนยันกับ user แล้วก่อนทำตารางนี้):**
- **ไม่มีคอลัมน์ Cooldown** — `TraitOption` ไม่มี field cooldown ระดับการ์ด (การ์ดเป็น one-time pick ตอน level-up คนละอย่างกับ cooldown ของ weapon/skill ที่ทำงานอยู่ระดับอื่นของโค้ด)
- **Type** = map จาก `targetClass` field จริง (หรือ "Universal" ถ้าไม่มี) + `[Signature]`/`[Evolution]` ต่อท้ายถ้า flag นั้นเป็น `true` จริงใน source

---

## ตารางการ์ดทั้งหมด (70 ใบ)

เรียงตามลำดับที่ปรากฏใน `TRAIT_POOL` array จริง (Mythic Evolution ก่อน → ตามด้วยแต่ละคลาส → Universal ท้ายสุด)

| ชื่อการ์ด | Rarity | Type | เอฟเฟค (จาก apply()) | Scaling/Condition |
|---|---|---|---|---|
| Crimson Tempest | mythic | Swordsman [Evolution] | `crimsonTempest = true; damageBonus += 0.35; flatDamage += 15` | Continuous cyclone spin; restores 3% HP on hit |
| Aegis of the Bastion | mythic | Swordsman [Evolution] | `aegisOfBastion = true; defense += 8; maxHp += 100; hp += 100` | Reflects 200% damage taken on attack shockwave |
| Blizzard Volley | mythic | Archer [Evolution] | `blizzardVolley = true; damageBonus += 0.30; critChance += 0.10` | 8-arrow barrage, infinite pierce, freezes foes solid |
| Hellfire Cataclysm | mythic | Archer [Evolution] | `hellfireCataclysm = true; damageBonus += 0.35; flatDamage += 20` | Detonates into 3 cascading cluster explosions |
| Absolute Zero Sphere | mythic | Sorceress [Evolution] | `absoluteZeroSphere = true; damageBonus += 0.30; areaMultiplier *= 1.30` | Permanently freezes surrounding foes |
| Wrath of the Thunder God | mythic | Sorceress [Evolution] | `wrathThunderGod = true; damageBonus += 0.40; critChance += 0.15` | Chain Lightning hits 12 foes; smites divine pillar on every critical hit |
| Cluster Thermite Mortar | mythic | Commando [Evolution] | `clusterThermite = true; damageBonus += 0.35; flatDamage += 18` | Detonates into 5 secondary thermite bomblets |
| Titan Chonk Earthquake | mythic | Cat Tank [Evolution] | `titanEarthquake = true; defense += 8; maxHp += 150; hp += 150` | Knocks back all foes and draws all monster aggro |
| Blade Whirlwind | epic | Swordsman [Signature] | `bladeWhirlwindRank = min(3, rank+1); bladeWhirlwind = true; damageBonus += 0.08` | Rank 1: every 6th hit ➔ Rank 3: every 3rd hit + enlarged radius |
| Rend & Tear | rare | Swordsman [Signature] | `rendAndTearRank = min(3, rank+1); damageBonus += 0.10` | Stacking laceration bleed, up to 5 stacks |
| Shockwave Slash | rare | Swordsman [Signature] | `shockwaveSlashRank = min(3, rank+1); shockwaveSlash = true; flatDamage += 5` | Rank 1: 35% proc ➔ Rank 3: 100% proc with longer reach |
| Blade Beam Volley | epic | Swordsman [Signature] | `flatDamage += 8; damageBonus += 0.15` | — |
| Iron Retaliation | rare | Swordsman [Signature] | `ironRetaliationRank = min(3, rank+1); ironRetaliation = true; defense += 3; maxHp += 25; hp += 25` | Rank 1: 30% reflection ➔ Rank 3: 100% reflection |
| Fortress Stance | epic | Swordsman [Signature] | `fortressStanceRank = min(3, rank+1); defense += 3; maxHp += 30; hp += 30` | Taking hits builds Fortify stacks (+3 Armor each, max 5) |
| Bloodthirsty Siphon | rare | Swordsman [Signature] | `maxHp += 20; hp += 20; damageBonus += 0.08` | Slaying bleeding/stunned foes restores +2 HP and +10% move speed for 3s |
| Blood Cleave | epic | Swordsman [Signature] | `bloodCleaveRank = min(3, rank+1); bloodCleave = true; damageBonus += 0.12; flatDamage += 6` | Every 4th sword strike unleashes blood arc (+40% bleed damage) |
| Shield Bash Stun | rare | Swordsman [Signature] | `shieldBashRank = min(3, rank+1); shieldBash = true; defense += 3; maxHp += 25; hp += 25` | Every 7.0s, charges shield, stunning enemies for 1.2s |
| Deadeye Longbow | epic | Archer [Signature] | `deadeyePierceRank = min(3, rank+1); damageBonus += 0.12` | Rank 1: 2 foes ➔ Rank 3: infinite pierce |
| Ballistic Precision | rare | Archer [Signature] | `damageBonus += 0.15` | Damage scales up to +50% with arrow travel distance |
| Gale Multishot | epic | Archer [Signature] | `multishotRank = min(3, rank+1); multishot = true` | Rank 1: 2 arrows ➔ Rank 2: 3 arrows ➔ Rank 3: 4 sweeping arrows |
| Rain of Arrows | epic | Archer [Signature] | `rainOfArrowsRank = min(3, rank+1); damageBonus += 0.10` | Every 6th volley triggers rain of 12 shadow arrows |
| Windrunner Phantom | rare | Archer [Signature] | `windrunnerRank = min(3, rank+1); windrunner = true; moveSpeed *= 1.04` | Move speed +4% per rank; Rank 1: 10% evasion ➔ Rank 3: 25% evasion |
| Static Caltrops | rare | Archer [Signature] | `staticCaltrops = true; moveSpeed *= 1.05` | While moving, leaves shocking caltrops behind |
| Lightning Arrow | epic | Archer [Signature] | `lightningArrowRank = min(3, rank+1); lightningArrow = true; damageBonus += 0.10` | Rank 1: 30% chance to 1 foe ➔ Rank 3: 100% chance to 3 foes |
| Explosive Shot | epic | Archer [Signature] | `explosiveShotRank = min(3, rank+1); explosiveShot = true; damageBonus += 0.10` | Triggers 120% AoE explosive splash upon hitting enemies |
| Frostwire Snare Trap | rare | Archer [Signature] | `frostTrapRank = min(3, rank+1); frostTrap = true; moveSpeed *= 1.05` | Every 6.0s, drops frost trap; freezes foes for 2.0s on trigger |
| Frost Nova Surge | rare | Sorceress [Signature] | `frostNovaRank = min(3, rank+1); frostNova = true; flatDamage += 4` | Rank 1: 1.0s freeze ➔ Rank 3: 1.8s freeze + wider blast |
| Glacial Shatter | epic | Sorceress [Signature] | `glacialShatterRank = min(3, rank+1); damageBonus += 0.12` | Slaying frozen monsters shatters them into 6 piercing icicles |
| Lightning Overcharge | rare | Sorceress [Signature] | `lightningOverchargeRank = min(3, rank+1); lightningOvercharge = true; damageBonus += 0.10` | Rank 1: +1 target ➔ Rank 3: +3 targets with ionic detonations |
| Static Field Pulse | rare | Sorceress [Signature] | `staticField = true; flatDamage += 5` | Every 4th lightning strike discharges field, shocking foes within 200 units |
| Orbital Frost Orbs | epic | Sorceress [Signature] | `orbitingOrbsRank = min(3, rank+1); orbitingOrbs = min(4, orbitingOrbs(starts 2)+1)` | Rank 1: 2 orbs ➔ Rank 2: 3 orbs ➔ Rank 3: 4 orbs with high-speed rotation |
| Astral Aegis | rare | Sorceress [Signature] | `astralAegisRank = min(3, rank+1); defense += 3; maxHp += 20; hp += 20` | Orbs periodically shoot out homing ice shards |
| Spark Detonation | rare | Sorceress [Signature] | `maxHp += 15; hp += 15; damageBonus += 0.10` | Slaying shocked/frozen foes causes ionic burst, restoring +2 HP |
| Astral Meteor Strike | epic | Sorceress [Signature] | `meteorStrikeRank = min(3, rank+1); meteorStrike = true; damageBonus += 0.15` | Every 5.5s, calls down meteor onto densest foe swarm |
| Glacial Blizzard Vortex | rare | Sorceress [Signature] | `blizzardRingRank = min(3, rank+1); blizzardRing = true; areaMultiplier *= 1.10` | Continuous swirling aura, 40% slow |
| Holy Radiance Aura | epic | Cleric [Signature] | `holyRadianceRank = min(3, rank+1); holyRadianceHeal = true; maxHp += 10; hp += 10` | Rank 1: heals 10 HP ➔ Rank 3: heals 22 HP every 8.0s |
| Sanctified Swiftness | rare | Cleric [Signature] | `moveSpeed *= 1.07` | — |
| Divine Judgment | epic | Cleric [Signature] | `judgmentPillarsRank = min(3, rank+1); judgmentPillars = true; damageBonus += 0.12` | Rank 1: 1 pillar ➔ Rank 3: 3 pillars every 3.8s |
| Wrath of the Heavens | epic | Cleric [Signature] | `damageBonus += 0.15; flatDamage += 6` | Pillars leave scorched ground burning for 3.0s (+25% holy damage) |
| Blessed Aegis | rare | Cleric [Signature] | `blessedAegisRank = min(3, rank+1); blessedAegis = true; defense += 3; maxHp += 25; hp += 25` | Rank 1: 20 dmg ward ➔ Rank 3: 70 dmg ward |
| Consecrated Ground | rare | Cleric [Signature] | `consecratedGroundRank = min(3, rank+1); maxHp += 20; hp += 20` | Walking blesses ground beneath Cleric, healing standing allies |
| Heavenly Retribution | rare | Cleric [Signature] | `heavenlyRetribution = true; defense += 2` | Taking damage triggers solar counter-blast (knockback + blind) |
| Heavenly Thunder Smite | epic | Cleric [Signature] | `heavenlyThunderRank = min(3, rank+1); heavenlyThunder = true; damageBonus += 0.12; flatDamage += 5` | Every 4.0s, strikes highest-HP enemy, chains blinding bolts |
| Sanctum Barrier | rare | Cleric [Signature] | `sanctumBarrierRank = min(3, rank+1); sanctumBarrier = true; defense += 3; maxHp += 30; hp += 30` | Every 9.0s, ward grants allies within +5 Armor and +15% Damage |
| Frag Grenade Shrapnel | epic | Commando [Signature] | `fragGrenadeRank = min(3, rank+1); fragGrenade = true; damageBonus += 0.10` | Every 4.5s, grenade explosion deals 220% AoE damage |
| Tactical Drone Bombardment | legendary | Commando [Signature] | `airstrikeDroneRank = min(3, rank+1); airstrikeDrone = true; flatDamage += 5` | Every 8.0s, drone strike hits dense monster clusters |
| Armor Piercing 5.56mm | rare | Commando [Signature] | `apRoundsRank = min(3, rank+1); damageBonus += 0.15` | — |
| Tactical Reload & Agility | rare | Commando [Signature] | `tacticalReloadRank = min(3, rank+1); attackSpeed *= 1.20; moveSpeed *= 1.08` | — |
| Nine Lives Blessing | legendary | Cat Tank [Signature] | `nineLivesRank = min(3, rank+1); nineLives = true; maxHp += 50; hp += 50` | When taking lethal damage, survive with 100% HP (once per run) |
| Territorial Meow & Hiss | epic | Cat Tank [Signature] | `aggroTauntRank = min(3, rank+1); aggroTaunt = true; defense += 3` | Every 5.0s, pulls monsters within 350px and taunts them |
| Absolute Chonk Bulk | rare | Cat Tank [Signature] | `chonkArmorRank = min(3, rank+1); maxHp += 80; hp += 80; defense += 5` | — |
| Toxic Hairball Mortar | rare | Cat Tank [Signature] | `hairballLauncherRank = min(3, rank+1); hairballLauncher = true; flatDamage += 4` | Every 4.0s, hairball slows enemies by 40% + poison damage |
| Quick Draw Fanning | rare | Cowboy [Signature] | `quickDrawFanRank = min(3, rank+1); quickDrawFan = true; attackSpeed *= 1.25` | — |
| Hollow Point Rounds | rare | Cowboy [Signature] | `bountyHunterBountyRank = min(3, rank+1); flatDamage += 10; critChance += 0.10; critBonus += 0.20` | — |
| Barbed Wire Lasso | epic | Cowboy [Signature] | `ensnaringLassoRank = min(3, rank+1); ensnaringLasso = true; damageBonus += 0.15` | — |
| Gunslinger Tumble | common | Cowboy [Signature] | `tumbleDodgeRank = min(3, rank+1); moveSpeed *= 1.15` | — |
| GN Saber Overdrive | rare | Celestial Mecha [Signature] | `beamSaberCleaveRank = min(3, rank+1); beamSaberCleave = true; areaMultiplier *= 1.30; flatDamage += 12` | — |
| Full Burst Wing Cannons | epic | Celestial Mecha [Signature] | `wingLaserSalvoRank = min(3, rank+1); wingLaserSalvo = true; damageBonus += 0.15` | Every 5.0s, fires 8 radial beams for 240% damage |
| GN Forcefield Barrier | rare | Celestial Mecha [Signature] | `gnBarrierShieldRank = min(3, rank+1); gnBarrierShield = true; defense += 6; maxHp += 50; hp += 50` | — |
| Afterburner Boosters | common | Celestial Mecha [Signature] | `thrusterOverdriveRank = min(3, rank+1); moveSpeed *= 1.20; attackSpeed *= 1.10` | — |
| Royal Flush Razor | rare | Gambler [Signature] | `fortuneCardsRank = min(3, rank+1); fortuneCards = true; flatDamage += 6; damageBonus += 0.20` | — |
| Loaded Fate Dice | epic | Gambler [Signature] | `luckyDiceRank = min(3, rank+1); luckyDice = true; critChance += 0.08` | Every 6.0s, rolling 4-6 triggers 300% shockwave explosion |
| Jackpot 777 Frenzy | epic | Gambler [Signature] | `jackpot777SlotRank = min(3, rank+1); jackpot777Slot = true; damageBonus += 0.15` | Every 10.0s, hitting 777 drops coins and blasts monsters |
| Golden Fortune Aura | rare | Gambler [Signature] | `highRollerGreedRank = min(3, rank+1); pickupRadius *= 1.30; critChance += 0.10; critBonus += 0.25` | ✅ 2026-09-12: bonus-coin proc chance (GameRoom.ts, นอก apply()) แก้เป็น scale ตาม rank จริง `0.035 * rank` — ดูหมายเหตุท้ายเอกสาร |
| Iron Constitution | common | Universal | `maxHp += 35; hp = min(maxHp, hp + 35)` | — |
| Colossal Might | rare | Universal | `damageBonus += 0.20; flatDamage += 5` | — |
| Flurry of Blows | rare | Universal | `attackSpeed *= 1.25` | — |
| Deadly Precision | rare | Universal | `critChance += 0.05; critBonus += 0.15` | — |
| Soul Siphon Attunement | common | Universal | `expMultiplier = (expMultiplier ?? 1.0) + 0.15; pickupRadius *= 1.15` | ✅ 2026-09-12: EXP bonus แก้แล้ว — เดิม apply() ไม่เคยแตะ expMultiplier เลย |
| Astral Reach | rare | Universal | `areaMultiplier *= 1.14` | — |

---

## สรุปจำนวนการ์ด

**รวมทั้งหมด: 70 ใบ** (ตรวจนับตรงจาก `TRAIT_POOL` ด้วย `grep -c "id:"` ในช่วงบรรทัด 647–1855 = 70 พอดี)

### แยกตาม Rarity

| Rarity | จำนวน |
|---|---|
| mythic | 8 |
| legendary | 2 |
| epic | 22 |
| rare | 34 |
| common | 4 |
| **รวม** | **70** |

### แยกตาม Type (targetClass)

| Type | จำนวน |
|---|---|
| Swordsman | 11 (9 signature + 2 evolution) |
| Archer | 11 (9 signature + 2 evolution) |
| Sorceress | 11 (9 signature + 2 evolution) |
| Cleric | 9 (9 signature) |
| Commando | 5 (4 signature + 1 evolution) |
| Cat Tank | 5 (4 signature + 1 evolution) |
| Cowboy | 4 (4 signature) |
| Celestial Mecha | 4 (4 signature) |
| Gambler | 4 (4 signature) |
| Universal | 6 |
| **รวม** | **70** |

---

## ✅ 5 การ์ดที่ description เคยไม่ตรงกับโค้ดจริง — แก้แล้ว (2026-09-12)

พบระหว่างสร้างเอกสารนี้ (ไล่ grep หาทุกจุดที่ field ถูกอ่านจริงใน `src/server/engine/GameRoom.ts`/`src/server/entities/ServerPlayer.ts` แล้ว ไม่ใช่เดา) ส่งต่อให้ user ตัดสินใจทีละใบผ่าน spec แยก (`docs/archive/2026-09-12-card-description-mismatch-fix.md`, commit `91ae614` บน `main`) ผลตัดสินใจ (before → after):

| การ์ด | เดิม (before) | ตอนนี้ (after) | ทางแก้ที่เลือก |
|---|---|---|---|
| **Soul Siphon Attunement** (`magnet_1`) | description สัญญา "+15% EXP" แต่ `apply()` มีแค่ `pickupRadius *= 1.15` — EXP ไม่มีอยู่จริง | `apply()` เพิ่ม `expMultiplier = (expMultiplier ?? 1.0) + 0.15` — comment เดิมในโค้ดระบุสูตรนี้ไว้อยู่แล้ว (design intent เดิมที่ไม่เคย implement) | **แก้โค้ด** |
| **Golden Fortune Aura** (`gambler_fortune_greed`) | description สัญญา "+35% Soul Coin drops" แต่ของจริงคือ 3.5% chance คงที่ ไม่ scale ตาม rank (`GameRoom.ts:2209`) | โอกาส spawn เหรียญพิเศษ scale ตาม rank จริง (`0.035 * highRollerGreedRank`) + แก้ description ให้ตรงกลไก | **แก้โค้ดบางส่วน + แก้ description** (ไม่ implement +35% เต็มรูปเพราะไม่มีหลักฐาน design intent ชัดเท่าใบบน — ดู spec) |
| **Royal Flush Razor** (`gambler_royal_flush`) | ตัวเลข +2 การ์ดถูกแล้ว แต่ขับเคลื่อนด้วย boolean `fortuneCards` ไม่ใช่ `fortuneCardsRank` | ไม่เปลี่ยนอะไร — ตรวจแล้วเป็น pattern ปกติของ signature card อื่นจำนวนมาก ไม่ใช่ bug | **ไม่แก้** |
| **Armor Piercing 5.56mm** (`commando_ap_rounds`) | description บอก +2 Pierce แต่โค้ดให้ +1/rank | แก้ description เป็น "+1 Pierce ต่อ rank" | **แก้ description** (คงโค้ดเดิม — +2/rank จริงจะ overpower เทียบ pierce card อื่น) |
| **Quick Draw Fanning** (`cowboy_quick_draw`) | description พูดถึง cooldown reduction แยกที่ไม่มีอยู่จริง (attack speed ที่เพิ่มคือสิ่งเดียวกัน) | ตัดประโยค cooldown ซ้ำออกจาก description | **แก้ description** |

รายละเอียดการวิเคราะห์เต็ม (เหตุผลที่เลือกแก้โค้ดหรือแก้ description แต่ละใบ) อยู่ที่ [`docs/GAME_WIKI.md` §4.7 (Stability Risk #27)](GAME_WIKI.md) และ `docs/archive/2026-09-12-card-description-mismatch-fix.md` — ตารางหลักด้านบนของเอกสารนี้อัปเดตแล้วให้ตรงกับ `apply()` เวอร์ชันปัจจุบัน (post-fix)
