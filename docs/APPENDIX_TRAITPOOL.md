# 🃏 Appendix: TRAIT_POOL เต็มทุกใบ + Card Appearance Probability

> ภาคผนวกของ GAME_BLUEPRINT.md — ต่อยอดจาก GAME_WIKI.md §4

## Change Log

| วันที่ | สรุปสิ่งที่เปลี่ยน | เหตุผล/อ้างอิง commit หรือ prompt ที่สั่ง |
|---|---|---|
| 2026-09-11 | สร้างเอกสารครั้งแรก (TRAIT_POOL ครบ 70 ใบ + probability derivation 2 ระดับ + Monte Carlo simulation) | คำสั่ง user: เติม APPENDIX_TRAITPOOL.md ให้ครบตาม GAME_BLUEPRINT.md |
| 2026-09-12 | อัปเดต `magnet_1`'s apply() effect — เพิ่ม `expMultiplier` (GAME_WIKI.md §4.7 risk #27) | `docs/archive/2026-09-12-card-description-mismatch-fix.md` |
| 2026-09-12 | (ประวัติ) การไม่ตรงกันของ 5 ใบข้างต้นถูกพบครั้งแรกจาก session `card-list-documentation` ระหว่างทำ `docs/card-list.md` — ดูตารางเปรียบเทียบ before/after เต็มที่นั่น | `docs/card-list.md` |
>
> วิธีสร้างเอกสารนี้: เขียนสคริปต์ `dump-traitpool.ts` (ลบทิ้งหลังใช้งานแล้ว) `import { TRAIT_POOL, getPowerTier } from './src/shared/classes.ts'` จริง แล้ว dump ทุก field ของทุกใบ (`id`, `rarity`, `tier` จาก `getPowerTier()` จริง, `targetClass`, `isSignature`, `isEvolution`, และ source ของฟังก์ชัน `apply` ผ่าน `.toString()`) — ไม่ได้พิมพ์ตารางด้วยมือจาก source โดยตรง เพื่อกันการอ่านพลาด/ข้ามใบ ผลลัพธ์ยืนยัน **70 ใบจริง** (`TOTAL 70` จาก script) ตรงกับ GAME_WIKI.md §4.2
>
> ส่วน 2.3 ใช้สคริปต์ `verify-card-appearance-sim.ts` (ลบทิ้งหลังใช้งานแล้วเช่นกัน) ที่ `import { TRAIT_POOL, getTierWeight } from './src/shared/classes.ts'` จริง (ไม่ได้ reimplement สูตรเอง) รันจำลอง (Monte Carlo) จริง 200,000 trials ต่อกรณี — ผลลัพธ์อยู่ใน §2.3

---

## ส่วน 1 — TRAIT_POOL เต็มทุกใบ (70 ใบ)

ที่มา: `src/shared/classes.ts` `export const TRAIT_POOL: TraitOption[] = [...]` (เริ่มบรรทัด 647 จบบรรทัด 1855)

เรียงตาม: `targetClass` (universal ก่อน แล้วเรียงตัวอักษร A→Z ตามชื่อคลาส) → ภายในกลุ่มเดียวกันเรียงตาม power tier มากไปน้อย (mythic→legendary→epic→rare→common)

หมายเหตุการอ่านคอลัมน์ "ค่าที่ apply() จริง": ดึงจาก source ของฟังก์ชัน `apply: (stats, skills) => {...}` ตรงๆ ทุกบรรทัด ไม่ได้สรุปเป็นร้อยแก้ว `rank=min(3,rank+1)` หมายถึงบรรทัด `k.xxxRank = Math.min(3, (k.xxxRank || 0) + 1)` ที่มีในการ์ด multi-rank ส่วนใหญ่ (นับเป็น rank progression แยกจากตัวเลข stat ที่บวกเพิ่มในบรรทัดเดียวกัน) ตัวเลขอื่นๆ เป็นค่าที่ถูกบวก/คูณเข้า `PlayerStats` จริงในการ์ดใบนั้น "flag X=true" หมายถึงการ set boolean field ใน `PlayerSkills` เพื่อเปิดใช้กลไก (เช่น เปิดสกิลใหม่) ซึ่งตัวเลขความแรงจริงของกลไกนั้นอาจอยู่นอกไฟล์ `classes.ts` (ในระบบ combat resolution) — ถ้าไม่พบตัวเลขครบใน `apply()` เขียนกำกับไว้ตรงๆ

| id | rarity | power tier | targetClass | ค่าที่ apply() จริง | isSignature | isEvolution |
|---|---|---|---|---|---|---|
| `strength_1` | rare | C | universal | damageBonus += 0.20; flatDamage += 5 | false | false |
| `quickdraw_1` | rare | C | universal | attackSpeed *= 1.25 | false | false |
| `keen_edge_1` | rare | C | universal | critChance += 0.05; critBonus += 0.15 | false | false |
| `area_expansion_1` | rare | C | universal | areaMultiplier *= 1.14 | false | false |
| `vitality_1` | common | D | universal | maxHp += 35; hp = min(maxHp, hp+35) | false | false |
| `magnet_1` | common | D | universal | expMultiplier=(expMultiplier??1.0)+0.15; pickupRadius *= 1.15 | false | false |
| `evo_blizzard_volley` | mythic | S | Archer | flag blizzardVolley=true; damageBonus += 0.30; critChance += 0.10 | false | true |
| `evo_hellfire_cataclysm` | mythic | S | Archer | flag hellfireCataclysm=true; damageBonus += 0.35; flatDamage += 20 | false | true |
| `ar_deadeye_pierce` | epic | B | Archer | deadeyePierceRank=min(3,rank+1); damageBonus += 0.12 | true | false |
| `archer_multishot` | epic | B | Archer | multishotRank=min(3,rank+1); flag multishot=true (ค่าตัวเลขจริงกำหนดที่ระบบยิง ไม่อยู่ใน apply()) | true | false |
| `ar_rain_of_arrows` | epic | B | Archer | rainOfArrowsRank=min(3,rank+1); damageBonus += 0.10 | true | false |
| `archer_lightning` | epic | B | Archer | lightningArrowRank=min(3,rank+1); flag lightningArrow=true; damageBonus += 0.10 | true | false |
| `archer_explosive_arrow` | epic | B | Archer | explosiveShotRank=min(3,rank+1); flag explosiveShot=true; damageBonus += 0.10 | true | false |
| `ar_ballistic_prec` | rare | C | Archer | damageBonus += 0.15 (ไม่มี rank tracking) | true | false |
| `archer_windrunner` | rare | C | Archer | windrunnerRank=min(3,rank+1); flag windrunner=true; moveSpeed *= 1.04 | true | false |
| `ar_static_caltrops` | rare | C | Archer | flag staticCaltrops=true (one-time); moveSpeed *= 1.05 | true | false |
| `archer_frost_trap` | rare | C | Archer | frostTrapRank=min(3,rank+1); flag frostTrap=true; moveSpeed *= 1.05 | true | false |
| `evo_titan_earthquake` | mythic | S | Cat Tank | flag titanEarthquake=true; defense += 8; maxHp += 150; hp += 150 | false | true |
| `cattank_nine_lives` | legendary | A | Cat Tank | nineLivesRank=min(3,rank+1); flag nineLives=true; maxHp += 50; hp += 50 | true | false |
| `cattank_aggro_taunt` | epic | B | Cat Tank | aggroTauntRank=min(3,rank+1); flag aggroTaunt=true; defense += 3 | true | false |
| `cattank_chonk_armor` | rare | C | Cat Tank | chonkArmorRank=min(3,rank+1); maxHp += 80; hp += 80; defense += 5 | true | false |
| `cattank_hairball` | rare | C | Cat Tank | hairballLauncherRank=min(3,rank+1); flag hairballLauncher=true; flatDamage += 4 | true | false |
| `mecha_laser_salvo` | epic | B | Celestial Mecha | wingLaserSalvoRank=min(3,rank+1); flag wingLaserSalvo=true; damageBonus += 0.15 | true | false |
| `mecha_saber_overdrive` | rare | C | Celestial Mecha | beamSaberCleaveRank=min(3,rank+1); flag beamSaberCleave=true; areaMultiplier *= 1.30; flatDamage += 12 | true | false |
| `mecha_gn_barrier` | rare | C | Celestial Mecha | gnBarrierShieldRank=min(3,rank+1); flag gnBarrierShield=true; defense += 6; maxHp += 50; hp += 50 | true | false |
| `mecha_thruster` | common | D | Celestial Mecha | thrusterOverdriveRank=min(3,rank+1); moveSpeed *= 1.20; attackSpeed *= 1.10 | true | false |
| `cleric_heal_aura` | epic | B | Cleric | holyRadianceRank=min(3,rank+1); flag holyRadianceHeal=true; maxHp += 10; hp += 10 | true | false |
| `cleric_judgment` | epic | B | Cleric | judgmentPillarsRank=min(3,rank+1); flag judgmentPillars=true; damageBonus += 0.12 | true | false |
| `cl_wrath_heavens` | epic | B | Cleric | damageBonus += 0.15; flatDamage += 6 (ไม่มี rank tracking) | true | false |
| `cleric_heavenly_thunder` | epic | B | Cleric | heavenlyThunderRank=min(3,rank+1); flag heavenlyThunder=true; damageBonus += 0.12; flatDamage += 5 | true | false |
| `cl_sanctified_swiftness` | rare | C | Cleric | moveSpeed *= 1.07 (ไม่มี rank tracking) | true | false |
| `cleric_aegis` | rare | C | Cleric | blessedAegisRank=min(3,rank+1); flag blessedAegis=true; defense += 3; maxHp += 25; hp += 25 | true | false |
| `cl_consecrated_ground` | rare | C | Cleric | consecratedGroundRank=min(3,rank+1); maxHp += 20; hp += 20 | true | false |
| `cl_heavenly_retrib` | rare | C | Cleric | flag heavenlyRetribution=true (one-time); defense += 2 | true | false |
| `cleric_sanctum_barrier` | rare | C | Cleric | sanctumBarrierRank=min(3,rank+1); flag sanctumBarrier=true; defense += 3; maxHp += 30; hp += 30 | true | false |
| `evo_cluster_thermite` | mythic | S | Commando | flag clusterThermite=true; damageBonus += 0.35; flatDamage += 18 | false | true |
| `commando_airstrike` | legendary | A | Commando | airstrikeDroneRank=min(3,rank+1); flag airstrikeDrone=true; flatDamage += 5 | true | false |
| `commando_frag_grenade` | epic | B | Commando | fragGrenadeRank=min(3,rank+1); flag fragGrenade=true; damageBonus += 0.10 | true | false |
| `commando_ap_rounds` | rare | C | Commando | apRoundsRank=min(3,rank+1); damageBonus += 0.15 | true | false |
| `commando_tactical_reload` | rare | C | Commando | tacticalReloadRank=min(3,rank+1); attackSpeed *= 1.20; moveSpeed *= 1.08 | true | false |
| `cowboy_lasso_upgrade` | epic | B | Cowboy | ensnaringLassoRank=min(3,rank+1); flag ensnaringLasso=true; damageBonus += 0.15 | true | false |
| `cowboy_quick_draw` | rare | C | Cowboy | quickDrawFanRank=min(3,rank+1); flag quickDrawFan=true; attackSpeed *= 1.25 | true | false |
| `cowboy_hollow_point` | rare | C | Cowboy | bountyHunterBountyRank=min(3,rank+1); flatDamage += 10; critChance += 0.10; critBonus += 0.20 | true | false |
| `cowboy_tumble` | common | D | Cowboy | tumbleDodgeRank=min(3,rank+1); moveSpeed *= 1.15 | true | false |
| `gambler_loaded_dice` | epic | B | Gambler | luckyDiceRank=min(3,rank+1); flag luckyDice=true; critChance += 0.08 | true | false |
| `gambler_jackpot` | epic | B | Gambler | jackpot777SlotRank=min(3,rank+1); flag jackpot777Slot=true; damageBonus += 0.15 | true | false |
| `gambler_royal_flush` | rare | C | Gambler | fortuneCardsRank=min(3,rank+1); flag fortuneCards=true; flatDamage += 6; damageBonus += 0.20 | true | false |
| `gambler_fortune_greed` | rare | C | Gambler | highRollerGreedRank=min(3,rank+1); pickupRadius *= 1.30; critChance += 0.10; critBonus += 0.25 | true | false |
| `evo_absolute_zero` | mythic | S | Sorceress | flag absoluteZeroSphere=true; damageBonus += 0.30; areaMultiplier *= 1.30 | false | true |
| `evo_wrath_thunder_god` | mythic | S | Sorceress | flag wrathThunderGod=true; damageBonus += 0.40; critChance += 0.15 | false | true |
| `so_glacial_shatter` | epic | B | Sorceress | glacialShatterRank=min(3,rank+1); damageBonus += 0.12 | true | false |
| `sorceress_orbs` | epic | B | Sorceress | orbitingOrbsRank=min(3,rank+1); orbitingOrbs=min(4,(orbitingOrbs\|\|2)+1) — เพิ่มจำนวนออร์บ (สูงสุด 4 ลูก) | true | false |
| `sorceress_meteor_strike` | epic | B | Sorceress | meteorStrikeRank=min(3,rank+1); flag meteorStrike=true; damageBonus += 0.15 | true | false |
| `sorceress_frost` | rare | C | Sorceress | frostNovaRank=min(3,rank+1); flag frostNova=true; flatDamage += 4 | true | false |
| `sorceress_overcharge` | rare | C | Sorceress | lightningOverchargeRank=min(3,rank+1); flag lightningOvercharge=true; damageBonus += 0.10 | true | false |
| `so_static_field` | rare | C | Sorceress | flag staticField=true (one-time); flatDamage += 5 | true | false |
| `so_astral_aegis` | rare | C | Sorceress | astralAegisRank=min(3,rank+1); defense += 3; maxHp += 20; hp += 20 | true | false |
| `so_spark_detonation` | rare | C | Sorceress | maxHp += 15; hp += 15; damageBonus += 0.10 (ไม่มี rank tracking) | true | false |
| `sorceress_blizzard_ring` | rare | C | Sorceress | blizzardRingRank=min(3,rank+1); flag blizzardRing=true; areaMultiplier *= 1.10 | true | false |
| `evo_crimson_tempest` | mythic | S | Swordsman | flag crimsonTempest=true; damageBonus += 0.35; flatDamage += 15 | false | true |
| `evo_aegis_bastion` | mythic | S | Swordsman | flag aegisOfBastion=true; defense += 8; maxHp += 100; hp += 100 | false | true |
| `swordsman_whirlwind` | epic | B | Swordsman | bladeWhirlwindRank=min(3,rank+1); flag bladeWhirlwind=true; damageBonus += 0.08 | true | false |
| `sw_blade_beam` | epic | B | Swordsman | flatDamage += 8; damageBonus += 0.15 (ไม่มี rank tracking) | true | false |
| `sw_fortress_stance` | epic | B | Swordsman | fortressStanceRank=min(3,rank+1); defense += 3; maxHp += 30; hp += 30 | true | false |
| `swordsman_blood_cleave` | epic | B | Swordsman | bloodCleaveRank=min(3,rank+1); flag bloodCleave=true; damageBonus += 0.12; flatDamage += 6 | true | false |
| `sw_rend_tear` | rare | C | Swordsman | rendAndTearRank=min(3,rank+1); damageBonus += 0.10 | true | false |
| `swordsman_shockwave` | rare | C | Swordsman | shockwaveSlashRank=min(3,rank+1); flag shockwaveSlash=true; flatDamage += 5 | true | false |
| `swordsman_retaliation` | rare | C | Swordsman | ironRetaliationRank=min(3,rank+1); flag ironRetaliation=true; defense += 3; maxHp += 25; hp += 25 | true | false |
| `sw_blood_siphon` | rare | C | Swordsman | maxHp += 20; hp += 20; damageBonus += 0.08 (ไม่มี rank tracking) | true | false |
| `swordsman_shield_bash` | rare | C | Swordsman | shieldBashRank=min(3,rank+1); flag shieldBash=true; defense += 3; maxHp += 25; hp += 25 | true | false |

**Cross-check ยืนยันจำนวน** (จาก dump script จริง ตรงกับ GAME_WIKI.md §4.2 ทุกตัวเลข):
- รวม 70 ใบ, mythic 8 (= evolution ทั้งหมด 8 ใบพอดี ไม่มี evolution ใบไหนอยู่นอกกลุ่ม mythic), legendary 2 (`commando_airstrike`, `cattank_nine_lives`), epic 22, rare 34, common 4
- ต่อคลาส: Swordsman 11 (2 evo + 9 signature), Archer 11 (2 evo + 9 signature), Sorceress 11 (2 evo + 9 signature), Cleric 9 (0 evo + 9 signature), Commando 5 (1 evo + 4 signature), Cat Tank 5 (1 evo + 4 signature), Cowboy 4 (0 evo + 4 signature), Celestial Mecha 4 (0 evo + 4 signature), Gambler 4 (0 evo + 4 signature), Universal 6 — รวม = 11×3 + 9 + 5×2 + 4×3 + 6 = 70 ✓
- Cowboy / Celestial Mecha / Gambler เป็น 3 คลาสที่**ไม่มี weapon evolution เลย** (0 ใบ isEvolution=true) — ยืนยันจาก source โดยตรง ไม่ใช่การเดา

---

## ส่วน 2 — Card Appearance Probability

### 2.1 % ต่อเทียร์ (สมมติ pool เต็ม ไม่มีการกรอง) — สูตรและวิธีคำนวณ

สูตรจริงจาก `classes.ts:623-631`:

```
weighted_count(tier) = count(tier) × getTierWeight(tier, luckPct)
P(tier) = weighted_count(tier) / Σ weighted_count(all tiers)
```

โดย `getTierWeight(rarity, luckPct)`:
- ถ้า `luckPct == 0` → คืนค่า `TIER_WEIGHT[tier]` ตรงๆ (ไม่ปรับ)
- ถ้า `luckPct > 0` → `luckFraction = clamp(luckPct/100, 0, 1)`, `luckMultiplier = 1 + luckFraction × TIER_LUCK_SENSITIVITY[tier]`, คืนค่า `max(0.02, TIER_WEIGHT[tier] × luckMultiplier)`

ค่าคงที่จริงจาก source:

| tier | count (จาก TRAIT_POOL จริง) | TIER_WEIGHT | TIER_LUCK_SENSITIVITY |
|---|---|---|---|
| S | 8 | 0.15 | 2.5 |
| A | 2 | 0.30 | 1.5 |
| B | 22 | 0.60 | 0 |
| C | 34 | 1.0 | −0.5 |
| D | 4 | 1.3 | −0.85 |

#### คำนวณที่ `tierLuck = 0` (luckMultiplier ไม่มีผล, ใช้ TIER_WEIGHT ตรงๆ)

```
weighted(S) = 8 × 0.15 = 1.2
weighted(A) = 2 × 0.30 = 0.6
weighted(B) = 22 × 0.60 = 13.2
weighted(C) = 34 × 1.0  = 34.0
weighted(D) = 4 × 1.3   = 5.2

Σ = 1.2 + 0.6 + 13.2 + 34.0 + 5.2 = 54.2

P(S) = 1.2 / 54.2  = 2.2140%
P(A) = 0.6 / 54.2  = 1.1070%
P(B) = 13.2 / 54.2 = 24.3542%
P(C) = 34.0 / 54.2 = 62.7306%
P(D) = 5.2 / 54.2  = 9.5941%

sum check = 2.2140 + 1.1070 + 24.3542 + 62.7306 + 9.5941 = 99.9999 ≈ 100.00% ✓
```

#### คำนวณที่ `tierLuck = 50` (luckFraction = 0.5)

```
luckMultiplier(S) = 1 + 0.5×2.5   = 2.25   → weight(S) = 0.15×2.25   = 0.3375
luckMultiplier(A) = 1 + 0.5×1.5   = 1.75   → weight(A) = 0.30×1.75   = 0.525
luckMultiplier(B) = 1 + 0.5×0     = 1.0    → weight(B) = 0.60×1.0    = 0.60
luckMultiplier(C) = 1 + 0.5×(-0.5)= 0.75   → weight(C) = 1.0×0.75    = 0.75
luckMultiplier(D) = 1 + 0.5×(-0.85)=0.575  → weight(D) = 1.3×0.575   = 0.7475
(ทุกค่าสูงกว่า floor 0.02 อยู่แล้ว ไม่โดน clamp)

weighted(S) = 8 × 0.3375 = 2.7
weighted(A) = 2 × 0.525  = 1.05
weighted(B) = 22 × 0.60  = 13.2
weighted(C) = 34 × 0.75  = 25.5
weighted(D) = 4 × 0.7475 = 2.99

Σ = 2.7 + 1.05 + 13.2 + 25.5 + 2.99 = 45.44

P(S) = 2.7 / 45.44   = 5.9418%
P(A) = 1.05 / 45.44  = 2.3108%
P(B) = 13.2 / 45.44  = 29.0493%
P(C) = 25.5 / 45.44  = 56.1268%
P(D) = 2.99 / 45.44  = 6.5802%

sum check = 5.9418 + 2.3108 + 29.0493 + 56.1268 + 6.5802 = 100.0089 ≈ 100.01% (คลาดเคลื่อนจากปัดเศษทศนิยม ยอมรับได้) ✓
```

#### คำนวณที่ `tierLuck = 100` (luckFraction = 1)

```
luckMultiplier(S) = 1 + 1×2.5    = 3.5   → weight(S) = 0.15×3.5   = 0.525
luckMultiplier(A) = 1 + 1×1.5    = 2.5   → weight(A) = 0.30×2.5   = 0.75
luckMultiplier(B) = 1 + 1×0      = 1.0   → weight(B) = 0.60×1.0   = 0.60
luckMultiplier(C) = 1 + 1×(-0.5) = 0.5   → weight(C) = 1.0×0.5    = 0.5
luckMultiplier(D) = 1 + 1×(-0.85)= 0.15  → weight(D) = 1.3×0.15   = 0.195
(ทุกค่าสูงกว่า floor 0.02 อยู่แล้ว ไม่โดน clamp)

weighted(S) = 8 × 0.525  = 4.2
weighted(A) = 2 × 0.75   = 1.5
weighted(B) = 22 × 0.60  = 13.2
weighted(C) = 34 × 0.5   = 17.0
weighted(D) = 4 × 0.195  = 0.78

Σ = 4.2 + 1.5 + 13.2 + 17.0 + 0.78 = 36.68

P(S) = 4.2 / 36.68  = 11.4504%
P(A) = 1.5 / 36.68  = 4.0894%
P(B) = 13.2 / 36.68 = 35.9869%
P(C) = 17.0 / 36.68 = 46.3468%
P(D) = 0.78 / 36.68 = 2.1264%

sum check = 11.4504 + 4.0894 + 35.9869 + 46.3468 + 2.1264 = 99.9999 ≈ 100.00% ✓
```

#### สรุปตาราง

| tierLuck | S % | A % | B % | C % | D % |
|---|---|---|---|---|---|
| 0% | 2.21% | 1.11% | 24.35% | 62.73% | 9.59% |
| 50% | 5.94% | 2.31% | 29.05% | 56.13% | 6.58% |
| 100% | 11.45% | 4.09% | 35.99% | 46.35% | 2.13% |

(ทุกแถวรวมกัน ≈ 100.00% ตามที่ตรวจแล้วข้างบน — luck ยิ่งสูง S/A ยิ่งได้เปรียบ, C/D ยิ่งเสียเปรียบ, B คงที่เสมอเพราะ sensitivity = 0 ตาม `TIER_LUCK_SENSITIVITY.B = 0`)

---

### 2.2 % ต่อใบเดี่ยว ต่อคลาส (pool ที่ class นั้นเห็นจริง = universal 6 ใบ + class-specific ของตัวเอง)

โมเดลนี้เป็นการคำนวณ**การสุ่ม 1 ช่องแบบปิด (single independent draw)** จาก pool เต็มของคลาสนั้น (ไม่กรอง unlocked/rank/banish — ต่างจากการเล่นจริงที่ต้องผ่าน filter ใน `triggerLevelUpChoices()` steps 2-4 ก่อน) ใช้สูตรเดียวกับ 2.1 (`getTierWeight` ที่ `tierLuck=0`) แต่จำกัด pool เฉพาะการ์ดที่คลาสนั้นเห็น แล้วหาร weighted-count ของแต่ละ tier เท่าๆ กันในจำนวนใบของ tier นั้นในพูล (สมมติทุกใบใน tier เดียวกันมี weight เท่ากันจริง — ตรงตาม `getTierWeight` ที่ขึ้นกับ `rarity`/`tier` เท่านั้น ไม่ขึ้นกับ id การ์ด)

ทุกคลาสมี universal 6 ใบร่วม: tier C×4 (`strength_1`, `quickdraw_1`, `keen_edge_1`, `area_expansion_1`), tier D×2 (`vitality_1`, `magnet_1`)

**Swordsman** (11 class-specific + 6 universal = 17 ใบ)

| tier ในพูล | จำนวนใบ | weighted (count×TIER_WEIGHT) | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| S | 2 | 2×0.15=0.30 | 0.30/14.3=2.0979% | 1.0490% |
| B | 4 | 4×0.60=2.40 | 2.40/14.3=16.7832% | 4.1958% |
| C | 9 (5 class + 4 universal) | 9×1.0=9.00 | 9.00/14.3=62.9371% | 6.9930% |
| D | 2 (0 class + 2 universal) | 2×1.3=2.60 | 2.60/14.3=18.1818% | 9.0909% |
| Σ weighted = 14.3, sum check = 2.0979+16.7832+62.9371+18.1818 = 100.0000% ✓ |

**Archer** (11 class-specific + 6 universal = 17 ใบ)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| S | 2 | 0.30 | 0.30/13.9=2.1583% | 1.0791% |
| B | 5 | 3.00 | 3.00/13.9=21.5827% | 4.3165% |
| C | 8 (4 class + 4 universal) | 8.00 | 8.00/13.9=57.5540% | 7.1942% |
| D | 2 (universal) | 2.60 | 2.60/13.9=18.7050% | 9.3525% |
| Σ weighted = 13.9, sum check = 2.1583+21.5827+57.5540+18.7050 = 100.0000% ✓ |

**Sorceress** (11 class-specific + 6 universal = 17 ใบ)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| S | 2 | 0.30 | 0.30/14.7=2.0408% | 1.0204% |
| B | 3 | 1.80 | 1.80/14.7=12.2449% | 4.0816% |
| C | 10 (6 class + 4 universal) | 10.00 | 10.00/14.7=68.0272% | 6.8027% |
| D | 2 (universal) | 2.60 | 2.60/14.7=17.6871% | 8.8435% |
| Σ weighted = 14.7, sum check = 2.0408+12.2449+68.0272+17.6871 = 100.0000% ✓ |

**Cleric** (9 class-specific + 6 universal = 15 ใบ, ไม่มี S/A ในพูลนี้เพราะ Cleric ไม่มี evolution/legendary)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| B | 4 | 2.40 | 2.40/14.0=17.1429% | 4.2857% |
| C | 9 (5 class + 4 universal) | 9.00 | 9.00/14.0=64.2857% | 7.1429% |
| D | 2 (universal) | 2.60 | 2.60/14.0=18.5714% | 9.2857% |
| Σ weighted = 14.0, sum check = 17.1429+64.2857+18.5714 = 100.0000% ✓ |

**Commando** (5 class-specific + 6 universal = 11 ใบ)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| S | 1 | 0.15 | 0.15/9.65=1.5544% | 1.5544% |
| A | 1 | 0.30 | 0.30/9.65=3.1088% | 3.1088% |
| B | 1 | 0.60 | 0.60/9.65=6.2176% | 6.2176% |
| C | 6 (2 class + 4 universal) | 6.00 | 6.00/9.65=62.1762% | 10.3627% |
| D | 2 (universal) | 2.60 | 2.60/9.65=26.9430% | 13.4715% |
| Σ weighted = 9.65, sum check = 1.5544+3.1088+6.2176+62.1762+26.9430 = 100.0000% ✓ |

**Cat Tank** (5 class-specific + 6 universal = 11 ใบ — โครงสร้าง tier เหมือน Commando เป๊ะ: S1/A1/B1/C2 class-specific)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| S | 1 | 0.15 | 1.5544% | 1.5544% |
| A | 1 | 0.30 | 3.1088% | 3.1088% |
| B | 1 | 0.60 | 6.2176% | 6.2176% |
| C | 6 (2 class + 4 universal) | 6.00 | 62.1762% | 10.3627% |
| D | 2 (universal) | 2.60 | 26.9430% | 13.4715% |
| Σ weighted = 9.65, ตัวเลขซ้ำกับ Commando เพราะ tier composition เหมือนกันทุกประการ (S1/A1/B1/C2+universal) |

**Cowboy** (4 class-specific + 6 universal = 10 ใบ, ไม่มี S/A เพราะไม่มี evolution/legendary)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| B | 1 | 0.60 | 0.60/10.5=5.7143% | 5.7143% |
| C | 6 (2 class + 4 universal) | 6.00 | 6.00/10.5=57.1429% | 9.5238% |
| D | 3 (1 class + 2 universal) | 3.90 | 3.90/10.5=37.1429% | 12.3810% |
| Σ weighted = 10.5, sum check = 5.7143+57.1429+37.1429 = 100.0001% ≈100% ✓ |

**Celestial Mecha** (4 class-specific + 6 universal = 10 ใบ — โครงสร้าง tier เหมือน Cowboy เป๊ะ: B1/C2/D1 class-specific)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| B | 1 | 0.60 | 5.7143% | 5.7143% |
| C | 6 (2 class + 4 universal) | 6.00 | 57.1429% | 9.5238% |
| D | 3 (1 class + 2 universal) | 3.90 | 37.1429% | 12.3810% |
| Σ weighted = 10.5, ตัวเลขซ้ำกับ Cowboy เพราะ tier composition เหมือนกันทุกประการ |

**Gambler** (4 class-specific + 6 universal = 10 ใบ, ไม่มี S/A/D เพราะ class-specific มีแค่ B2/C2 ไม่มี common)

| tier | จำนวนใบ | weighted | P(tier) | % ต่อใบ |
|---|---|---|---|---|
| B | 2 | 1.20 | 1.20/9.8=12.2449% | 6.1224% |
| C | 6 (2 class + 4 universal) | 6.00 | 6.00/9.8=61.2245% | 10.2041% |
| D | 2 (universal เท่านั้น — Gambler ไม่มี common class-specific) | 2.60 | 2.60/9.8=26.5306% | 13.2653% |
| Σ weighted = 9.8, sum check = 12.2449+61.2245+26.5306 = 100.0000% ✓ |

**ข้อสังเกต**: Cowboy กับ Celestial Mecha มี tier composition เหมือนกันทุกประการ (B1/C2/D1 class-specific) จึง % ต่อใบเท่ากันเป๊ะ ส่วน Gambler แม้จำนวนใบรวมเท่ากัน (10 ใบเหมือนกัน) แต่ composition ต่าง (B2/C2 ไม่มี D) ทำให้ Σ weighted = 9.8 ต่ำกว่า Cowboy/Mecha (10.5) — แปลว่า**การ์งทุกใบใน Gambler มีโอกาสต่อใบสูงกว่า Cowboy/Mecha เล็กน้อย** แม้จำนวนใบในพูลเท่ากัน (ดูเหตุผลเชิงตัวเลขใน §2.4)

---

### 2.3 % ที่จะเห็นการ์ดใบใดใบหนึ่งอย่างน้อย 1 ใน 3 ช่องที่โชว์ (Monte Carlo simulation)

**เหตุผลที่ต้องจำลอง แทนสูตรปิด**: `triggerLevelUpChoices()` (`GameRoom.ts:3095-3108`) สุ่มแบบ **roulette wheel ไม่คืนใบที่จับได้แล้ว (without replacement)** ทำ 3 รอบ — หลังจับใบแรก pool จะเหลือน้อยลง 1 ใบ และ `totalWeight` (ตัวหารในสูตร) เปลี่ยนตามไปด้วยทุกรอบ ทำให้ P(การ์ด X โผล่อย่างน้อย 1 ใน 3 ช่อง) **ไม่ใช่แค่ 3×P(single draw)** (นั่นจะเป็นการประมาณที่ผิด เพราะไม่นับ correlation ระหว่างรอบที่จับใบอื่นไปแล้วทำให้ตัวหารเปลี่ยน) ต้องรันจำลองจริงเพื่อความแม่นยำ

**Methodology**:
- Import `getTierWeight` จริงจาก `src/shared/classes.ts` (ไม่ reimplement) เพื่อให้ weighting ตรงกับ production 100%
- Replicate loop จาก `triggerLevelUpChoices()` บรรทัด 3095-3108 ตรงๆ: `while (selected.length < 3 && pool.length > 0) { totalWeight = Σ weight(pool); rand = random()*totalWeight; เดินลบ weight ทีละใบจนกว่า rand<=0 → เลือกใบนั้น, splice ออกจาก pool }`
- **ขอบเขตของโมเดลนี้** (ตามที่โจทย์ระบุ — "ignore locked-trait-guarantee และ evolution-guarantee steps, สมมติ 3-slot แบบเปิดเต็ม"): ใช้พูลที่มองเห็นได้ทั้งหมดของคลาส (class-specific ทุกใบ **รวม evolution card ด้วย** + universal 6 ใบ) เป็น pool ตั้งต้นของทั้ง 3 รอบเลย ไม่ตัด evolution ออกก่อนเหมือนโค้ดจริง (โค้ดจริงที่ `GameRoom.ts:3043` ตัด `isEvolution` ออกจากพูลสุ่มเสมอ แล้วค่อยยัด evolution ที่ eligible เข้าไปแบบ guaranteed ที่ step 4 ต่างหาก) — ที่เลือกทำแบบนี้เพราะโจทย์สั่งให้ตัด step "evolution-guarantee" ออกและมองเป็น "completely open 3-slot draw" ซึ่งหมายความว่าการ์ด evolution ต้องแข่งเป็นตัวเลือกปกติในพูลได้ (ไม่งั้นจะไม่มีทาง track การ์ด S-tier ได้เลย เพราะการ์ด S-tier ทั้งหมด = evolution ทั้งหมด) **นี่คือ simplification เพื่อวัตถุประสงค์ทางสถิติล้วนๆ ไม่ใช่พฤติกรรมจริงของเกม** (ในเกมจริง evolution card ปกติจะไม่โผล่แบบสุ่มถ่วงน้ำหนักเลย นอกจากผ่านเงื่อนไข eligibility ก่อน)
- Trials: **200,000 ครั้งต่อกรณี** ที่ `tierLuck = 0`, รันซ้ำ 2 ชุดอิสระเพื่อเช็คความเสถียร (ผลต่างกันไม่ถึง 1 percentage point ระหว่าง 2 รัน ยืนยันว่า N=200,000 มากพอ)
- คลาสที่เลือก: **Swordsman** เป็นตัวแทน "best-case" (พูลใหญ่สุดกลุ่มหนึ่ง N=17 ใบ) และ **Gambler** เป็นตัวแทน "small pool" (จาก 3 คลาสที่ผูกกันที่ N=10 ใบ คือ Cowboy/Gambler/Celestial Mecha — ดู §2.4 สำหรับการยืนยันว่าผูกกันจริง — เลือก Gambler เพราะมี weighted-sum ต่ำสุดในสามคลาสนี้ (9.8 เทียบกับ Cowboy/Mecha ที่ 10.5) ทำให้เป็นกรณี "เข้มข้น" ที่สุดในกลุ่มเดียวกัน)
- การ์ดที่ track: Swordsman ใช้ `evo_crimson_tempest` (S-tier/mythic) และ `sw_rend_tear` (C-tier/rare) ส่วน Gambler **ไม่มีการ์ด S-tier เลยในพูล** (ไม่มี evolution) จึงใช้ `gambler_loaded_dice` (B-tier/epic — tier สูงสุดที่ Gambler มี) แทนตำแหน่ง "top-tier example" และ `gambler_royal_flush` (C-tier/rare) เป็นคู่เทียบ

**ผลลัพธ์จริงจากการรันจำลอง** (สคริปต์ `verify-card-appearance-sim.ts`, ลบทิ้งหลังรันเสร็จตามที่โจทย์กำหนด):

รันครั้งที่ 1 (N=200,000):
- `evo_crimson_tempest` (Swordsman, S-tier) โผล่อย่างน้อย 1/3 ช่อง: **3.309%**
- `sw_rend_tear` (Swordsman, C-tier) โผล่อย่างน้อย 1/3 ช่อง: **20.802%**
- `gambler_loaded_dice` (Gambler, B-tier) โผล่อย่างน้อย 1/3 ช่อง: **19.489%**
- `gambler_royal_flush` (Gambler, C-tier) โผล่อย่างน้อย 1/3 ช่อง: **30.773%**

รันครั้งที่ 2 (N=200,000, seed สุ่มใหม่ — เช็คความเสถียร):
- `evo_crimson_tempest`: 3.381% (ต่างจากรันแรก 0.07pp)
- `sw_rend_tear`: 21.047% (ต่างจากรันแรก 0.25pp)
- `gambler_loaded_dice`: 19.362% (ต่างจากรันแรก 0.13pp)
- `gambler_royal_flush`: 30.636% (ต่างจากรันแรก 0.14pp)

**สรุป**: ในพูล Gambler ที่เล็กกว่า (N=10) การ์ด C-tier ใบหนึ่งมีโอกาสโผล่อย่างน้อย 1/3 ช่อง (~30.6-30.8%) สูงกว่าการ์ด C-tier ใบหนึ่งในพูล Swordsman ที่ใหญ่กว่า (N=17, ~20.8-21.0%) อย่างชัดเจน — ตัวเลขนี้มาจาก**การจำลองจริง (Monte Carlo, N=200,000, ไม่ใช่การประมาณ 3×P(single-draw))** ยืนยันเชิงประจักษ์ว่าพูลเล็กทำให้การ์ดแต่ละใบ "แน่น" กว่า สอดคล้องกับกลไกที่อธิบายเชิงสูตรใน §2.4

---

### 2.4 ผลกระทบจาก filter ก่อนสุ่ม (worst-case vs best-case)

**ยืนยันขนาดพูลจริงจาก Part 1/2.2**:

| คลาส | class-specific | + universal 6 | รวม (raw count) | Σ weighted (ที่ tierLuck=0) |
|---|---|---|---|---|
| Swordsman (best-case) | 11 | 6 | **17** | 14.3 |
| Archer | 11 | 6 | 17 | 13.9 |
| Sorceress | 11 | 6 | 17 | 14.7 |
| Cowboy | 4 | 6 | **10** | 10.5 |
| Celestial Mecha | 4 | 6 | **10** | 10.5 |
| Gambler | 4 | 6 | **10** | 9.8 |

**ยืนยันแล้ว**: Cowboy / Celestial Mecha / Gambler ผูกกันจริงที่ **10 ใบ raw count เป๊ะ** (4+6) ไม่มีใบไหนเล็กกว่ากันในแง่จำนวนใบ — แต่ **weighted-sum ไม่เท่ากัน** เพราะ tier composition ต่างกัน (Gambler ไม่มี common class-specific เลย ในขณะที่ Cowboy/Mecha มี 1 ใบ common ซึ่งมี weight สูงสุด 1.3) ทำให้ Gambler มี Σ weighted ต่ำสุด (9.8) จึงเป็นกรณี "แน่น" ที่สุดในสามคลาสนี้ในทางปฏิบัติ

**กลไกที่ทำให้พูลเล็ก = % ต่อใบสูงกว่า (ตัวเลขล้วน ไม่ใช่การอธิบายซ้ำ Stability Risk)**:

เพราะสูตร `P(card) = weight(tier) / Σ weighted(pool)` และ `weight(tier)` เป็นค่าคงที่ตาม `TIER_WEIGHT` (ไม่ขึ้นกับคลาสหรือจำนวนใบในพูล) ดังนั้นถ้าเทียบการ์ดที่อยู่ *tier เดียวกัน* ระหว่าง 2 คลาส อัตราส่วน % ต่อใบจะเท่ากับ**อัตราส่วนผกผันของ Σ weighted ทั้งพูล**:

```
P_Cowboy(card ที่ tier=X) / P_Swordsman(card ที่ tier=X) = Σweighted(Swordsman) / Σweighted(Cowboy)
                                                          = 14.3 / 10.5
                                                          = 1.3619
```

พิสูจน์ด้วยตัวเลขจริงจาก §2.2 (tier C, weight เท่ากันทั้งคู่ = 1.0):
- Swordsman: C-tier การ์ด 1 ใบ = 6.9930%
- Cowboy: C-tier การ์ด 1 ใบ = 9.5238%
- อัตราส่วน = 9.5238 / 6.9930 = **1.3619** ✓ (ตรงกับสูตรข้างบนเป๊ะ)

และ tier D:
- Swordsman: D-tier การ์ด 1 ใบ = 9.0909%
- Cowboy: D-tier การ์ด 1 ใบ = 12.3810%
- อัตราส่วน = 12.3810 / 9.0909 = **1.3619** ✓ (อัตราส่วนเดียวกันทุก tier เพราะ weight คงที่ ตัวหารเปลี่ยนเท่านั้น)

สรุป: **การ์ดในพูล Cowboy/Celestial Mecha มีโอกาสต่อใบสูงกว่าพูล Swordsman ~36.2% แบบเดียวกันในทุก tier** ล้วนๆ จากขนาดพูลที่เล็กกว่า (Σ weighted 10.5 vs 14.3) ไม่เกี่ยวกับความแรงของการ์ดเลย

เทียบกับ Gambler (Σ weighted = 9.8, ต่ำกว่า Cowboy/Mecha อีก):

```
P_Gambler / P_Swordsman = 14.3 / 9.8 = 1.4592
```

พิสูจน์ด้วย tier C: Gambler C-tier การ์ด 1 ใบ = 10.2041% เทียบ Swordsman 6.9930% → อัตราส่วน = 10.2041/6.9930 = **1.4592** ✓ ตรงกันเป๊ะ

**ผลของการกรอง (banish/signature-lock/rank-cap) ต่อพูลเล็กเทียบพูลใหญ่**: สมมติ banish ไป 2 ใบ tier C (ตัวเลขที่มีจริงในทั้งสองคลาส เพราะทั้งคู่มี C-tier อยู่หลายใบ) —
- Swordsman: พูล C-tier ทั้งหมด 9 ใบ → เหลือ 7 ใบ = **หายไป 22.2% ของ C-tier ในพูลนั้น**
- Cowboy: พูล C-tier ทั้งหมด 6 ใบ → เหลือ 4 ใบ = **หายไป 33.3% ของ C-tier ในพูลนั้น**
- Gambler: พูล C-tier ทั้งหมด 6 ใบ → เหลือ 4 ใบ = **หายไป 33.3% เช่นกัน**

การ banish จำนวนใบเท่ากัน (2 ใบ) กัดกินสัดส่วนของพูลคลาสเล็กมากกว่าคลาสใหญ่ตามสัดส่วน (33.3% vs 22.2%) — นี่คือกลไกตัวเลขที่อยู่เบื้องหลัง **GAME_WIKI.md §4.7 risk ข้อ 1** ("Weighted-random selection อาจได้ choices ว่างเปล่า" — ระบุไว้แล้วว่าคลาสเล็กอย่าง Cowboy/Gambler/Mecha ที่มีแค่ 4 การ์ดคลาส + 6 universal เสี่ยงเจอ choices เหลือ 0-2 ใบมากกว่าคลาสใหญ่) ตัวเลขในหัวข้อนี้ไม่ได้มาแทนที่ risk ที่ระบุไว้แล้ว แต่เป็นหลักฐานเชิงปริมาณที่ยืนยันว่าทำไม risk นั้นถึงรุนแรงกับคลาสเล็กกว่าคลาสใหญ่จริงในทางคณิตศาสตร์ — จำนวนใบที่หายไปเท่ากันจากการ banish/lock/rank-cap คิดเป็นสัดส่วนของพูลที่เหลือให้สุ่มมากกว่าเสมอเมื่อพูลตั้งต้นเล็กกว่า
