# 📖 Torment of Souls — Game Mechanics Wiki & Stability Reference

> เอกสารนี้สร้างจากการวิเคราะห์ source code จริงเท่านั้น (ไม่มีการเดา/เติม mechanic ที่ไม่มีหลักฐานในโค้ด) จุดประสงค์คือใช้เป็นฐานอ้างอิงสำหรับไล่ปรับความเสถียรของระบบ นอกเหนือจากการบันทึกกลไกที่มีอยู่ ทุกหมวดมี sub-section **Stability Risk** และปิดท้ายด้วย **Top Stability Risks** สรุปรวมทุกหมวด
>
> สร้างเมื่อ 2026-09-11 · อ้างอิง commit ล่าสุดของ branch `main`

## Change Log

| วันที่ | สรุปสิ่งที่เปลี่ยน | เหตุผล/อ้างอิง commit หรือ prompt ที่สั่ง |
|---|---|---|
| 2026-09-11 | สร้างเอกสารครั้งแรก (compile จาก source code จริง 5 หมวด + Top Stability Risks) | คำสั่ง user: ใช้ GAME_WIKI.md เป็นฐานข้อมูล วิเคราะห์จาก source จริง |
| 2026-09-11 | Round 1 functional bugfix: แก้ risk #2 (level-up choices ว่าง), #6 (validate traitId), #9 (potion double-click), #11 (NaN guard), #12 (magic rarity fallback) + ⚠️ Correction risk #5, #7 ที่ล้าสมัย/overstate | `docs/archive/2026-09-11-round1-functional-bugfixes.md` |

## สารบัญ

1. [Character System](#1-character-system)
2. [Item / Gear System](#2-item--gear-system)
3. [Monster System](#3-monster-system)
4. [Card / Skill System (Level-Up Traits)](#4-card--skill-system-level-up-traits)
5. [Game Logic & Mechanics](#5-game-logic--mechanics)
6. [Top Stability Risks (สรุปรวม)](#6-top-stability-risks-สรุปรวม)

---

## 1. Character System

### 1.1 สาย Class/Job ทั้งหมด (9 คลาส)

ที่มา: `src/shared/types.ts:1-11` (enum `PlayerClass`), `src/shared/classes.ts:130-445` (`CLASS_DEFINITIONS`)

| Class | HP | SPD | DMG | DEF | Weapon | Specialization | Starter? |
|---|---|---|---|---|---|---|---|
| SWORDSMAN | 220 | 180 | 32 | 7 | Greatsword Cleave | เกราะหนา, เลือดออกต่อเนื่อง, ฟันกวาดระยะประชิด | ✅ ฟรี |
| ARCHER | 130 | 205 | 24 | 2 | Piercing Longbow | ยิงไกล, ศรทะลวง, คริติคอลแรง | ✅ ฟรี |
| SORCERESS | 120 | 188 | 34 | 1 | Chain Lightning | สายฟ้าชิ่ง, ป้องกันเวท, แช่แข็ง | ✅ ฟรี |
| CLERIC | 175 | 182 | 30 | 5 | Holy Smite | คลื่นกระแทก, ออร่าฮีล, เสาแสง | ✅ ฟรี |
| COMMANDO | 160 | 195 | 18 | 4 | M4A1 Burst Rifle | รัวกระสุน, เจาะเกราะ, ระเบิดมือ | ❌ 2,000 kills + 2,750 coins |
| CAT_TANK | 350 | 170 | 38 | 12 | Heavy Paw Slam | เลือดมหาศาล, ดึงเกลียด, ฟื้นคืนชีพ | ❌ ปลดล็อกด้วยเงื่อนไข |
| COWBOY | 180 | 205 | 24 | 3 | Dual Revolvers | ยิงคู่, บ่วงบาศก์, คริติคอลสูง | ❌ ปลดล็อกด้วยเงื่อนไข |
| CELESTIAL_MECHA | 260 | 215 | 30 | 7 | Twin Beam Sabers | ดาบแสงคู่, เลเซอร์รอบทิศ, สนามพลัง | ❌ ปลดล็อกด้วยเงื่อนไข |
| GAMBLER | 190 | 195 | 22 | 5 | Razor Fortune Cards | ไพ่กรีด, ลูกเต๋าสุ่ม, สล็อต | ❌ พิชิต Realm 1 + 7,777 coins |

`weaponCooldown` (วินาที/การโจมตี ก่อนหาร attackSpeed) อยู่ในชุดข้อมูลเดียวกัน: Cowboy เร็วสุด (0.55s), Cleric ช้าสุด (1.45s), Swordsman 1.15s เงื่อนไขปลดล็อกฮีโร่แบบเต็มอยู่ใน `HERO_UNLOCK_REQUIREMENTS` (`MetaProgression.ts:16-61`)

### 1.2 โครงสร้าง PlayerStats

ที่มา: `src/shared/types.ts:224-241`

| field | type | description |
|---|---|---|
| `maxHp` / `hp` | number | พลังชีวิตสูงสุด / ปัจจุบัน |
| `moveSpeed` | number | ความเร็วเดิน (หน่วย/วินาที) |
| `attackSpeed` | number | ตัวคูณจำนวนครั้งโจมตีต่อวินาที |
| `damageBonus` | number | ตัวคูณดาเมจ (1.0 = ฐาน) |
| `flatDamage` | number | ดาเมจฐานแบบบวกตรง |
| `critChance` | number | โอกาสคริติคอล (0.05 = 5%) |
| `critBonus` | number | ตัวคูณดาเมจคริติคอล (1.0 = +200%) |
| `areaMultiplier` | number | ตัวคูณพื้นที่/รัศมีเอฟเฟกต์ |
| `pickupRadius` | number | รัศมีดูดไอเทม/เหรียญ/EXP |
| `defense` | number | ค่าเกราะ (ใช้ในสูตรลดดาเมจ) |
| `level` / `exp` / `maxExp` | number | ระบบเลเวล |
| `expMultiplier?` | number | ตัวคูณ EXP ที่ได้รับ |
| `tierLuck?` | number | % เพิ่มโอกาสได้การ์ดเทียร์สูง — ดู §4.3 |

### 1.3 ระบบ PlayerSkills

`PlayerSkills` (`types.ts:109-222`) เป็น interface แบนราบ **93 field รวม** แบ่ง 9 กลุ่มตามคลาส (6-13 field ต่อกลุ่ม) + 8 field "Mythic Evolutions" รูปแบบชื่อส่วนใหญ่เป็นคู่ `xxx: boolean` + `xxxRank: number` เริ่มจาก `DEFAULT_PLAYER_SKILLS` (ทุกอย่าง false/0) ผสมสกิลเริ่มต้น 1 ตัวต่อคลาสจาก `CLASS_STARTER_SKILLS`

### 1.4 โครงสร้าง Skill Tree

ที่มา: `src/shared/skillTreeData.ts:1-58`

```typescript
type NodeType = 'root' | 'minor' | 'notable' | 'keystone';
type StatModType = 'increased' | 'more';

interface SkillTreeNode {
  id: string; name: string; nameTh?: string;
  type: NodeType; classType: PlayerClass | 'universal';
  icon: string; cost: number; x: number; y: number;
  connections: string[];
  description: string; descriptionTh?: string;
  element?: ElementType;
  stats?: {
    maxHp?: number; defense?: number; moveSpeed?: number;
    pickupRadius?: number; damageBonus?: number; expMultiplier?: number;
    tierLuck?: number;
    extraRerolls?: number; extraBanishes?: number; extraLocks?: number;
  };
  modType?: StatModType;       // default 'increased'
  signatureSkillId?: string;   // ผูกกับการ์ด isSignature ใน TRAIT_POOL
  isUniversalBasic?: boolean;  // flag แสดงผลอย่างเดียว ไม่กระทบกลไก
}
```

### 1.5 สรุปทั้ง 10 สาย (9 คลาส + universal) — **418 node รวมทั้งไฟล์**

| Tree | รวม | root/minor/notable/keystone | Cost min–max (avg) |
|---|---|---|---|
| Swordsman | 60 | 1/40/7/12 | 0–1070 (293) |
| Sorceress | 45 | 1/29/7/8 | 0–1090 (300) |
| Archer | 45 | 1/29/7/8 | 0–1070 (299) |
| Cleric | 45 | 1/29/7/8 | 0–1090 (299) |
| Commando | 40 | 1/27/6/6 | 0–590 (189) |
| Cat Tank | 40 | 1/27/6/6 | 0–590 (191) |
| Cowboy | 40 | 1/27/6/6 | 0–590 (191) |
| Celestial Mecha | 40 | 1/27/6/6 | 0–590 (191) |
| Gambler | 38 | 1/26/5/6 | 0–590 (187) |
| **Universal** | 25 | 1/16/4/4 | 0–590 (147) |

ทุก notable/keystone (ยกเว้น universal) มี `signatureSkillId` ครบ `modType: 'more'` พบเฉพาะ 5 โหนดใน Swordsman tree เท่านั้น

**ตัวอย่าง root ของทุกคลาส** (ทุกคลาสให้ +HP อย่างน้อยที่ root): Swordsman "Heart of Iron" (+10), Sorceress "Arcane Leyline Core" (+10), Archer "Eye of the Hawk" (+10), Cleric "Altar of the Dawn" (+10), Commando "Vanguard Headquarters" (+15), Cat Tank "Cat Castle Core" (+25), Cowboy "Frontier Saloon" (+moveSpeed 1, +10hp), Celestial Mecha "Orbital Hangar" (+defense 1, +moveSpeed 1), Gambler "Golden Casino Core" (+damageBonus 1, +moveSpeed 1)

**ตัวอย่าง notable ที่ผูก signature skill**: `swordsman_whirlwind` (cost 360, Blade Whirlwind — หมุนฟันรอบตัวทุก 6 ฮิต scale ถึง rank 3), `sorceress_frost` (cost 370, Frost Nova Surge), `ar_deadeye_pierce` (cost 370, Deadeye Longbow — ทะลุ 2→3→infinite ตาม rank), `cleric_heal_aura` (cost 380, Holy Radiance Aura), `commando_frag_grenade` (cost 360), `cattank_chonk_armor` (cost 360, +40 maxHp +2 def), `cowboy_quick_draw` (cost 360), `mecha_saber_overdrive` (cost 360), `gambler_royal_flush` (cost 360)

### 1.6 Increased vs More Stacking — สูตรจริง

ที่มา: `src/client/engine/MetaProgression.ts:131-145`

```typescript
function combineIncreasedAndMore(increasedSum: number, moreMultipliers: number[]): number {
  const capped = moreMultipliers.slice(0, MAX_MORE_MODIFIERS_PER_STAT); // cap 4 ตัว/stat
  const moreProduct = capped.reduce((p, m) => p * m, 1);
  return ((1 + increasedSum / 100) * moreProduct - 1) * 100;
}
```

สูตร: **`final = base × (1 + Σincreased/100) × Π(more)`** — ใช้เฉพาะ `moveSpeed/pickupRadius/damageBonus/expMultiplier` ส่วน `maxHp/defense/tierLuck` **บวกตรงเสมอ**ไม่ว่า modType ใด `more` เกิน 4 ตัวต่อ stat จะถูกเพิกเฉย (ไม่ refund, ไม่บล็อก) พร้อม console warning

### 1.7 Pipeline: Skill Tree → ServerPlayer

1. **Allocate** (client) — `canAllocateNode()` เช็คเงื่อนไข (เหรียญพอ, hero ปลดแล้ว, ไม่ allocate ซ้ำ, ต่อกับ neighbor ที่ allocate แล้ว) → push เข้า `allocatedNodes` (array แบนเดียว ไม่แยกคลาส) → `recomputeSignatures()`
2. **Fold เป็นตัวเลข** (client) — `getPassiveTiersForClass(playerClass)` วนทั้ง class tree + universal tree จาก `allocatedNodes` ก้อนเดียวกัน + บวก gear stats (§2.3) + trial potion bonus
3. **ส่งไปเซิร์ฟเวอร์** — `JOIN_LOBBY` พร้อม `unlockedSkills` + `treePassives` (ส่งซ้ำ 4 จุดใน `main.ts`)
4. **Server เก็บ** — `server.ts` เก็บลง `client.treePassives` ตรงๆ (3 จุด) → `GameRoom.addPlayer()` → `initSkillTreeUnlocks()`
5. **Apply จริง** — `ServerPlayer.initSkillTreeUnlocks()`: flat stat บวกตรง, %stat คูณ `*= (1+x/100)`, potion บวกเข้า count ตรง
6. **กรองการ์ดเลเวลอัพ** — การ์ด `isSignature` ต้องมี id อยู่ใน `unlockedSkills` ถึงจะโผล่ในพูลสุ่ม (ดู §4.3)

**ยืนยันแล้ว: เป็นระบบ account-wide/shared ไม่ใช่ per-character** — `MetaSaveData.allocatedNodes: string[]` เป็น array แบนก้อนเดียว ไม่มี key แยกตามคลาส (comment ยืนยันตรงๆ ที่ `MetaProgression.ts:640`: *"Universal Central Tree Passives (Shared across all heroes!)"*) — Swordsman กับ Archer แชร์ allocation pool และ Gear Vault เดียวกันทั้งหมด

### 1.8 ระบบเลเวลอัพในเกม

ที่มา: `ServerPlayer.ts:328-345`

```typescript
public addExp(amount: number): boolean {
  const actualExp = Math.max(1, Math.round(amount * (this.stats.expMultiplier || 1.0)));
  this.stats.exp += actualExp;
  let leveledUp = false;
  while (this.stats.exp >= this.stats.maxExp) {
    this.stats.exp -= this.stats.maxExp;
    this.stats.level += 1;
    this.stats.maxExp = Math.round(GAME_CONSTANTS.EXP_BASE * Math.pow(GAME_CONSTANTS.EXP_GROWTH, this.stats.level));
    leveledUp = true;
    this.invulnerableTimer = 2.5;
  }
  return leveledUp;
}
```

สูตรเลเวล: `maxExp = round(20 × 1.25^level)` — เติบโตแบบ exponential ทุกเลเวลอัพให้คุ้มกัน 2.5 วิ **ไม่พบหลักฐานว่ามีการฮีล HP เต็มตอนเลเวลอัพ** (ตรวจทุกจุดเรียก `addExp()` แล้วไม่มี `heal()` เลย — ต่างจากที่มักสันนิษฐานในเกมแนวนี้ ยกเว้นจาก Tome of Ascension ที่ฮีลเต็มแยกต่างหาก §3.6)

### 1.9 ระบบ Revive

ที่มา: `ServerPlayer.ts:321-326`, `GameRoom.ts:485-532`

```typescript
public revive(): void {
  this.isDead = false;
  this.stats.hp = Math.round(this.stats.maxHp * 0.5); // ฟื้นด้วย 50% HP เสมอ
  this.reviveTimer = 0;
  this.invulnerableTimer = 2.5;
}
```

ทุก tick, `GameRoom.ts` ทำ **contention-based assignment**: ผู้เล่นที่ยังไม่ตายแต่ละคนเลือกเป้าฟื้นคืนชีพ 1 คนต่อ tick โดยเลือกร่างที่ยังไม่มีใครจับจอง (ทำให้ 2 คนช่วยฟื้น 2 ร่างพร้อมกันได้) ถ้าทุกร่างมีคนจับจองแล้วจะเสริมให้ร่างที่ progress สูงสุดก่อน `reviveTimer += dt × จำนวนคนช่วยฟื้น`, ครบ `REVIVE_TIME_SECONDS` (4.0 วิ) → ฟื้น ถ้าไม่มีใครช่วยจะ decay ที่ `dt × 0.5` ค่าคงที่ `REVIVE_ZONE_RADIUS = 100` progress ที่ client เห็นมาจาก `reviveProgress: min(1, reviveTimer/4.0)`

### 1.10 Stability Risk — Character System

- 🔴 **สูง — Server เชื่อ `treePassives` จาก client โดยไม่ validate ซ้ำ**: ตัวเลขสถิติทั้งหมด (คำนวณฝั่ง client ล้วนๆ) ส่งผ่าน `JOIN_LOBBY` แล้ว apply ตรงเข้าเซิร์ฟเวอร์ ไม่มีการ re-derive จาก `allocatedNodes` ฝั่ง server หรือ clamp ค่าใดๆ เลย ในทำนองเดียวกัน `client.playerClass` ก็ไม่ถูกตรวจว่าอยู่ใน `unlockedHeroes` จริงหรือไม่ (เช็คแค่ฝั่ง client) — เกมเป็น co-op แชร์ห้องกับคนอื่นจริง client ที่ถูกแก้ไข (hack payload หรือแก้ localStorage save `torment_meta_save_v3`) จะฉีดสถิติ/ฮีโร่ตามอำเภอใจเข้าไปในแมตช์ที่มีผู้เล่นคนอื่นร่วมอยู่ได้ทันที **ความเสี่ยงสูงสุดของทั้งเอกสาร**
- 🟡 **กลาง — Magic number กระจายใน `ServerPlayer.takeDamage()`**: โบนัสเกราะจากสกิล (`blessedAegis`, `ironRetaliation`, `astralAegis`, `chonkArmor`) และ evasion% ของ Windrunner hardcode ตรงในฟังก์ชันเดียว ไม่ได้มาจาก skill tree data เหมือน stat อื่น — balance data กระจาย 2 แหล่ง
- 🟡 **กลาง — โค้ดสร้าง JOIN_LOBBY payload + เรียก addPlayer ซ้ำ 4+3 จุด**: เพิ่ม field ใหม่ต้องแก้ให้ครบทุกจุด เสี่ยงตกหล่น
- 🟢 **ต่ำ — Naming ไม่ตรงกันระหว่าง `SkillTreeNode.stats`/`PlayerStats` กับ `GearItem.stats`**: gear ใช้ `flatMaxHp/flatMoveSpeedPct` ส่วน skill tree ใช้ `maxHp/moveSpeed` ตรงๆ ต้อง map มือทุกบรรทัด

---

## 2. Item / Gear System

### 2.1 โครงสร้างข้อมูล GearItem

ที่มา: `src/shared/gearData.ts`

```typescript
type GearSlot = 'HEAD' | 'CHEST' | 'BOOTS' | 'GLOVES' | 'RING' | 'AMULET';
type GearRarity = 'common' | 'magic' | 'rare' | 'unique';

interface GearStats {
  maxHp?: number; defense?: number; damageBonusPct?: number;
  moveSpeedPct?: number; critChancePct?: number;
  attackSpeedPct?: number; pickupRadiusPct?: number;
}

interface GearItem {
  id: string; name: string; thaiName: string;
  slot: GearSlot; rarity: GearRarity; icon: string;
  stats: GearStats; description: string; thaiDescription: string;
}
```

### 2.2 ตารางไอเทมทั้งหมด (18 ชิ้น ครบทุกชิ้น)

ที่มา: `gearData.ts:27-237`

| ID | ชื่อ (EN/TH) | ช่อง | ความหายาก | สถิติ |
|---|---|---|---|---|
| helm_iron_visage | Iron Visage / หน้ากากเหล็กกล้า | HEAD | common | maxHp 30, defense 2 |
| helm_crown_shadows | Crown of Shadows / มงกุฎแห่งเงามืด | HEAD | rare | crit 12%, moveSpeed 10% |
| helm_celestial_diadem | Celestial Diadem / รัดเกล้าเทวะประกายฟ้า | HEAD | unique | maxHp 65, def 5, dmg 15% |
| chest_chainmail | Reinforced Hauberk | CHEST | common | maxHp 45, def 4 |
| chest_blood_carapace | Blood Carapace | CHEST | rare | maxHp 85, def 3, dmg 12% |
| chest_aegis_titan | Titan's Bastion Cuirass | CHEST | unique | maxHp 130, def 8, atkSpd 10% |
| boots_leather_treads | Stalker Treads | BOOTS | common | moveSpeed 12% |
| boots_windrunner_greaves | Windrunner Greaves | BOOTS | rare | moveSpeed 22%, crit 8% |
| boots_abyssal_striders | Abyssal Striders | BOOTS | unique | moveSpeed 28%, maxHp 40, def 3 |
| gloves_iron_gauntlets | Heavy Gauntlets | GLOVES | common | def 3, dmg 8% |
| gloves_frenzy_grips | Grips of Frenzy | GLOVES | rare | atkSpd 20%, crit 6% |
| gloves_thunder_touch | Thunderstrike Gauntlets | GLOVES | unique | atkSpd 25%, dmg 18%, def 5 |
| ring_copper_band | Magnetic Copper Band | RING | common | maxHp 25, pickupRadius 25% |
| ring_ruby_eye | Ruby Eye Ring | RING | rare | dmg 18%, crit 8% |
| ring_ring_of_torment | Ring of Ancient Torment | RING | unique | dmg 26%, crit 14%, pickupRadius 35% |
| amulet_talisman_health | Pendant of Vigor | AMULET | common | maxHp 50 |
| amulet_heart_of_fire | Heart of the Infernal | AMULET | rare | dmg 22%, atkSpd 12% |
| amulet_wellkeepers_pendant | The Wellkeeper's Relic | AMULET | unique | maxHp 80, def 6, dmg 20%, moveSpeed 15% |

**สรุป**: 6 ช่อง × 3 ระดับ (common/rare/unique) = 18 ชิ้นพอดี **rarity `'magic'` มี type ไว้แต่ไม่มีไอเทมใช้จริงเลยสักชิ้น**

### 2.3 ระบบ Equip/Vault

ที่มา: `MetaProgression.ts:500-567`

`getVaultInventory()` / `getEquippedGear()` / `equipGear(slot, itemId)` (เช็ค `item.slot !== slot` → false ถ้าไม่ตรงช่อง) / `unequipGear(slot)` / `addGearToVault(itemId)` — ทุกฟังก์ชัน sync กลับ `localStorage` ทันที

`getEquippedStatsTotal()`: ลูปผ่านของที่ใส่อยู่ทั้ง 6 ช่อง รวมเป็น `flatMaxHp/flatDefense/flatMoveSpeedPct/flatPickupRadiusPct/flatDamageBonusPct/flatCritChancePct/flatAttackSpeedPct` แบบบวกตรง (additive ล้วน ไม่มี diminishing returns) แล้วบวกทับเข้า `getPassiveTiersForClass()` — **รวมกับ Skill Tree ในพูลเดียวกัน**

### 2.4 ระบบดรอปจากมอนสเตอร์ — แปลง % จริงครบ

⚠️ เป็นระบบ **2-stage independent roll** (ไม่ใช่ single table ต้องรวม 100%) — ชั้น 1 คือ "ดรอปไหม" ชั้น 2 คือ "หายากแค่ไหน"

**ชั้น 1 — โอกาสดรอป** (`GEAR_DROP_CHANCE = 0.015`, `GameRoom.ts:2506,2571`):
- มอนทั่วไป: **1.5%**
- บอส: **100% (การันตี)**

**ชั้น 2 — สุ่ม rarity** (`rollGearDrop()`, `GameRoom.ts:2743-2754`):

```typescript
private rollGearDrop(isBoss: boolean): GearItem | undefined {
  const weights: [GearRarity, number][] = isBoss
    ? [['common', 30], ['rare', 45], ['unique', 25]]
    : [['common', 70], ['rare', 25], ['unique', 5]];
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of weights) {
    roll -= w;
    if (roll <= 0) return getRandomGearOfRarity(rarity);
  }
  return getRandomGearOfRarity(weights[weights.length - 1][0]);
}
```

| Rarity | มอนทั่วไป | บอส |
|---|---|---|
| common | 70/100 = **70%** | 30/100 = **30%** |
| rare | 25/100 = **25%** | 45/100 = **45%** |
| unique | 5/100 = **5%** | 25/100 = **25%** |
| รวม | **100% ✓** | **100% ✓** |

**ความน่าจะเป็นรวม (คูณสองชั้น) ต่อการฆ่ามอนทั่วไป 1 ตัว:**

| ผล | สูตร | % |
|---|---|---|
| ได้ common | 1.5% × 70% | **1.05%** |
| ได้ rare | 1.5% × 25% | **0.375%** |
| ได้ unique | 1.5% × 5% | **0.075%** |
| ไม่ได้อะไร | — | **98.5%** |

(รวมกันได้ 100% พอดี ยืนยันการคำนวณถูกต้อง)

**เลือกไอเทมภายใน rarity** (`getRandomGearOfRarity()`, `gearData.ts:245-248`): สุ่ม **uniform** เท่ากันทั้ง 6 ชิ้นในแต่ละ tier (1/6 ≈ 16.67% ต่อชิ้น)

**ตำแหน่ง/อายุ**: กระจายรอบจุดตาย (±10 unit มอนทั่วไป, ±20 unit บอส) หมดอายุ 60 วิถ้าไม่มีใครเก็บ เก็บแล้วเข้า vault คนเก็บคนเดียว ไม่แชร์ทีม

### 2.5 แหล่งอื่นที่เคยมี/ถูกถอด

`trialQuests.ts:9-12` — comment ยืนยันชัดเจนว่า **ตั้งใจถอด GEAR ออกจาก reward type**:

> *"Gear is deliberately not a reward type here — equipment must only ever come from monster drops during a run, never from a one-time account-wide achievement."*

`TrialRewardType` ปัจจุบันมีแค่ `'GOLD' | 'POTION_REROLL' | 'POTION_BANISH' | 'POTION_LOCK'`

### 2.6 Stability Risk — Item/Gear System

- ✅ **แก้แล้ว (2026-09-11)** — ~~🟢 ต่ำ — Rarity `'magic'` นิยามไว้แต่ไม่มีไอเทมใช้เลย: ถ้า `rollGearDrop`/`getRandomGearOfRarity` ถูกเรียกด้วย `'magic'` วันไหน (เช่น มีคนเพิ่ม weight เข้าไปอนาคต) จะได้ `undefined` เงียบๆ~~ — `getRandomGearOfRarity()` เพิ่ม fallback ไป `'common'` + `console.warn` เมื่อ tier ว่าง ไม่คืน `undefined` เงียบๆ อีกต่อไป (`src/shared/gearData.ts`, spec: `docs/archive/2026-09-11-round1-functional-bugfixes.md`)
- 🟢 **ต่ำ — Magic number ของ weight array ไม่มีชื่อ constant**: `[['common',70],['rare',25],['unique',5]]` เขียนตรงในฟังก์ชัน ไม่ใช่ named constant เหมือน `GEAR_DROP_CHANCE`
- 🟢 **ต่ำ — vaultInventory ไม่มี cap**: `addGearToVault` push เข้า array ไม่จำกัดขนาด

---

## 3. Monster System

### 3.1 MonsterType และสถานะพื้นฐาน

ที่มา: `types.ts:13-23` (enum), `constants.ts:33-115` (MONSTER_STATS)

| id | MonsterType | ชื่อ | maxHp | speed | damage | radius | expValue | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| 0 | SKELETON | Skeleton | 25 | 110 | 8 | 16 | 1 | มอนพื้นฐานสุด |
| 1 | ZOMBIE | Rotting Zombie | 65 | 70 | 15 | 20 | 3 | |
| 2 | IMP | Crimson Imp | 18 | 180 | 6 | 12 | 2 | เร็วที่สุดในกลุ่มมอนธรรมดา |
| 3 | HELLHOUND | Hellhound | 90 | 210 | 20 | 22 | 5 | เร็วกว่าผู้เล่นทุกคน |
| 4 | ELITE_GOLEM | Corrupted Golem | 800 | 60 | 35 | 36 | 50 | บอส wave 5/15/20/25 (stage 1) |
| 5 | LORD_OF_TORMENT | Lord of Torment | 10000 | 90 | 50 | 48 | 500 | บอส wave 30 + endless mode |
| 6 | SKELETON_ARCHER | Skeleton Archer | 22 | 68 | 5 | 14 | 4 | ranged |
| 7 | MAGMA_IMP | Magma Imp | 30 | 75 | 7 | 14 | 6 | ranged, บอส wave 5/15 stage 2 |
| 8 | VOID_WARLOCK | Void Warlock | 65 | 55 | 11 | 18 | 12 | ranged, บอส wave 5/15 stage 3 |

ค่าจริงต่อตัว = `MONSTER_STATS[type].X × multiplier` (คำนวณใน `ServerMonster` constructor, ปัดเศษด้วย `Math.round()` ทุกจุด) `expValue` ของบอสคูณเพิ่ม ×5 เสมอ

### 3.2 AI Behavior

ที่มา: `ServerMonster.ts:65-71` (isRanged), `92-143` (update)

มอนสเตอร์มี AI แค่ **2 แบบ** กำหนดโดย `isRanged()`:

**1. Ranged Kiting** (เฉพาะ SKELETON_ARCHER, MAGMA_IMP, VOID_WARLOCK):
- ระยะ > 260px → เดินเข้าหา / ระยะ < 120px → ถอยหลัง (50% speed)
- ยิงเมื่อ `attackTimer >= cooldown` (Archer 4.5s, Magma Imp 4.0s, Warlock 5.0s) และระยะ < 420px
- โปรเจกไทล์: `ENEMY_ARROW` (default), `ENEMY_FIREBALL` (Magma Imp), `ENEMY_VOID_ORB` (Void Warlock)

**2. Default Melee Chaser** (ทุกตัวที่เหลือ รวม ELITE_GOLEM/HELLHOUND/LORD_OF_TORMENT): เดินตรงเข้าหาเป้าหมายเสมอ ไม่มี logic หลบหลีก

**ไม่พบหลักฐานใน source**: ไม่มี state machine/behavior tree แยก, ไม่มี aggro range/patrol/flee-เมื่อเลือดน้อย

### 3.3 Boss Abilities

ที่มา: `updateBossAbilities()`, `GameRoom.ts` ~บรรทัด 2189-2327

| Monster | ท่า | Cooldown | เงื่อนไข | ดาเมจ/เอฟเฟกต์ |
|---|---|---|---|---|
| ELITE_GOLEM | Ground Slam (melee AOE) | 7s | มีผู้เล่นในระยะ ≤260px | ดาเมจ ×2.5 แก่ทุกคนในรัศมี 180px |
| ELITE_GOLEM | Boulder Toss (ranged) | 5s | ผู้เล่นใกล้สุด 260-650px | `ENEMY_ARROW` ดาเมจ ×1.4 |
| LORD_OF_TORMENT | Void Barrage (ranged fan 5 นัด) | 6s | ผู้เล่นใกล้สุด ≤550px | `ENEMY_VOID_ORB` ×5 กระจาย ±0.5 rad ดาเมจ ×0.8/นัด |
| LORD_OF_TORMENT | Reinforcements | 15s | — | Spawn HELLHOUND ปกติ 2 ตัว |
| HELLHOUND | Hellfire Spit (ranged) | 4.5s | ผู้เล่นใกล้สุด 150-500px | `ENEMY_FIREBALL` ดาเมจ ×1.2 |

`bossAbilityTimer`/`bossSummonTimer` เริ่มต้นสุ่ม (`Math.random()*3` / `×6`) กันบอสยิงทุกท่าพร้อมกันตอนเพิ่งเกิด

### 3.4 Status Effects (Elemental)

ที่มา: `ServerMonster.ts:5,7-11,73-90,95-101`

ชนิด: `BLEED | FROST | SHOCK | BURN | HOLY` เก็บใน `Map<ElementStatus, MonsterStatusEffect>` มี `duration`+`stacks` (สูงสุด 5) ปฏิกิริยาข้ามธาตุอยู่ใน `damageMonster()` — ดู §5.2

### 3.5 Spawn Logic & Difficulty Scaling

ที่มา: `HordeDirector.ts` ทั้งไฟล์

**Wave**: 30 wave ปกติ, 40 วิ/wave, รวม 1,200 วิ (20 นาที) บอสทุก 5 wave wave ไม่ขยับถ้าบอสยังไม่ตาย

**สูตร scaling ต่อ wave**:
```
waveProgress = (currentWave - 1) / 29
hpScale    = (1.0 + (currentWave-1) × 0.12) × stageHpMult
dmgScale   = (1.0 + (currentWave-1) × 0.08) × stageDmgMult
speedScale = (1.0 + min(0.35, (currentWave-1) × 0.015)) × stageSpeedMult   // cap +35%
```
Stage multiplier: Stage 1 = 1.0/1.0, Stage 2 = 1.6/1.4, Stage 3 = 2.5/2.0 (HP/DMG) `stageSpeedMult = 1.0 + (stageId-1)×0.1`

**อัตราเกิด**: `baseRate = 3.0 + waveProgress × 15.0` (มอน/วิ, 3→18) ลดเหลือ 35% ตอนบอสยังไม่ตาย คูณ `1.0 + (playerCount-1)×0.25` เพดานมอนพร้อมกัน `380 + (playerCount-1)×120`

**เลือกชนิดมอน** (`pickMonsterType()`): if-chain ถ่วงน้ำหนักตามช่วง wave, stage 2 มี 10% ได้ Magma Imp, stage 3 มี 9% ได้ Void Warlock, ทุก stage มี 7% ได้ Skeleton Archer (wave≥3)

**Boss ต่อ wave** (`createBossSpawn()`):

| Wave | Stage 1 | Stage 2 | Stage 3 | HP Multiplier |
|---|---|---|---|---|
| 5 | ELITE_GOLEM | MAGMA_IMP | VOID_WARLOCK | 8.0 / 8.5 / 9.0 |
| 10 | HELLHOUND (ทุก stage) | | | 12.0 |
| 15 | ELITE_GOLEM | MAGMA_IMP | VOID_WARLOCK | 12.0 (ทุก stage) |
| 20 | ELITE_GOLEM (ทุก stage) | | | 15.0 |
| 25 | ELITE_GOLEM (ทุก stage) | | | 18.0 |
| 30 | LORD_OF_TORMENT (ทุก stage) | | | 26.0 |
| >30 (endless) | LORD_OF_TORMENT | | | 26.0 + cycle × 8.0 |

ดาเมจบอสคูณเพิ่ม ×1.5 เสมอทุก wave

**Endless Mode**: เมื่อ `enableEndlessMode()` ถูกเรียก (กด "เล่นต่อ" หลังฆ่า wave 30) เพดาน `MAX_WAVES=30` ถูกยกเลิกสำหรับการเดิน wave ต่อ และ deadline safety-net ขยายจากเฉพาะ wave 30 ไปเป็นทุก wave ที่ `currentWave >= 30`

### 3.6 Drop Table เต็ม (ต่อการฆ่า 1 ตัว)

⚠️ **ไม่ใช่ weighted table ที่ต้องรวม 100%** — แต่ละไอเทมสุ่มอิสระต่อกัน (independent roll) ดีไซน์ตั้งใจ ไม่ใช่บั๊ก

| ไอเทม | เงื่อนไข | อัตรา | หมายเหตุ |
|---|---|---|---|
| EXP Gem | การันตีทุกครั้ง | 100% | ชนิด (S/M/L) ตาม `expValue` มอนตัวนั้น |
| Gold Coin | สุ่มอิสระ | **2.2%** | `GOLD_DROP_CHANCE`, ×stage.goldMultiplier ×2 ถ้ามี Gold Rush buff |
| Gear (มอนทั่วไป) | สุ่มอิสระ, ข้ามถ้าเป็นบอส | **1.5%** | ดู §2.4 |
| Magnet | สุ่มอิสระ | **0.75%** | หมดอายุ 60 วิ |
| Gold Coin (บอส) | การันตี ×3 | 100% | round(2×stage.goldMultiplier)/เหรียญ |
| Tome of Ascension (บอส) | การันตี | 100% | +1 level ทุกคน + ฮีลเต็ม |
| Gear (บอส) | การันตี | 100% | rarity เอียงสูงกว่ามอนทั่วไป (§2.4) |

### 3.7 Stability Risk — Monster System

- ⚠️ **Correction (2026-09-11)** — ~~🟡 กลาง — `COOP_HP_SCALE_PER_PLAYER` นิยามไว้แต่ไม่ถูกใช้จริง~~: **ล้าสมัย** ตอนตรวจสอบซ้ำพบว่าค่านี้ถูกใช้จริงแล้วที่ `GameRoom.ts:582` (`const coopHpScale = 1.0 + (this.players.size - 1) * GAME_CONSTANTS.COOP_HP_SCALE_PER_PLAYER;`) — ไม่ใช่ dead code อีกต่อไป ไม่ทราบว่าถูกเพิ่มเข้ามาตั้งแต่เมื่อไหร่ (ก่อนหน้าที่ข้อมูลในเอกสารนี้จะถูก compile) เอกสารฉบับแรกวิเคราะห์คลาดเคลื่อน
- ✅ **แก้แล้ว (2026-09-11)** — 🟡 กลาง — AI ไม่มี fallback เมื่อ target ตายกลางทาง: `ServerMonster.update(dt, targetX, targetY)` ไม่เช็คว่าผู้เล่นเป้าหมายยังมีชีวิตอยู่ ณ ตอนเรียก — **การแสดงออกจริงของ risk นี้ที่ยืนยันได้จาก source**: เมื่อไม่มีผู้เล่นที่ยังมีชีวิตเลย (`alivePlayers` ว่าง) caller จะ default `targetX/Y = monster.x/y` เอง (`GameRoom.ts`) ทำให้ `dist=0` → หารด้วยศูนย์ใน ranged retreat branch → พิกัด mob กลายเป็น `NaN` ถาวร แก้โดยเพิ่ม guard `dist > 1e-6` ก่อนหาร (`src/server/entities/ServerMonster.ts`, test: `ServerMonster.test.ts`, spec: `docs/archive/2026-09-11-round1-functional-bugfixes.md`)
- 🟢 **ต่ำ — Boss ability คำนวณ "ผู้เล่นใกล้สุด" ซ้ำ 3-4 รอบ**: โค้ดคล้ายกันสูงใน `updateBossAbilities()` แต่ละท่าต่างคนต่าง loop เอง
- 🟢 **ต่ำ — `pickMonsterType()` เป็น if-chain ไม่ใช่ data table**: เพิ่ม/แก้สัดส่วนต้องแก้ logic โดยตรง ไม่มีระบบเช็ครวมไม่เกิน 1.0 อัตโนมัติ
- 🟢 **ต่ำ — HELLHOUND เร็วกว่าผู้เล่นทุกคน**: เป็น design choice ที่ตั้งใจ (คอมเมนต์ยืนยัน) ไม่ใช่บั๊ก แต่ถ้า move speed จาก gear/skill tree สูงพอในอนาคตอาจกลับมาเป็นปัญหาสมดุล

---

## 4. Card / Skill System (Level-Up Traits)

### 4.1 โครงสร้าง TraitOption

ที่มา: `types.ts:243-257`

```typescript
interface TraitOption {
  id: string; name: string; description: string;
  thaiName?: string; thaiDesc?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
  targetClass?: PlayerClass;   // ไม่มีค่า = universal
  isSignature?: boolean;       // ต้องปลดล็อกใน Skill Tree
  isEvolution?: boolean;       // การ์ด Weapon Evolution
  evolutionTitle?: string;
  element?: ElementType;
  apply: (stats: PlayerStats, skills: PlayerSkills) => void;
}
```

### 4.2 ภาพรวม TRAIT_POOL

ที่มา: `classes.ts` (เริ่มบรรทัด 647) — **นับจริง 70 ใบ** (comment ในโค้ดบรรทัด 587 เขียนว่า "78" — ล้าสมัย)

| rarity | จำนวน | Power Tier |
|---|---|---|
| mythic | 8 | S |
| legendary | 2 | A |
| epic | 22 | B |
| rare | 34 | C |
| common | 4 | D |

| กลุ่ม | จำนวน |
|---|---|
| Swordsman / Archer / Sorceress | 11 / 11 / 11 |
| Cleric | 9 |
| Commando / Cat Tank | 5 / 5 |
| Cowboy / Celestial Mecha / Gambler | 4 / 4 / 4 |
| **Universal** | **6** |

**ตัวอย่างจริง**: mythic `evo_crimson_tempest` (+35% dmg, +15 flatDmg), legendary `commando_airstrike` (signature rank-up), rare `strength_1` (+20% dmg +5 flatDmg universal), common `vitality_1` (+35 maxHp — ยืนยันคำนวณจาก base 50 × TIER_POWER_MULTIPLIER.D(0.7) = 35)

### 4.3 ระบบ Power Tier + การสุ่มถ่วงน้ำหนัก

ที่มา: `classes.ts:586-645`

```typescript
const TIER_WEIGHT = { S: 0.15, A: 0.30, B: 0.60, C: 1.0, D: 1.3 };
const TIER_LUCK_SENSITIVITY = { S: 2.5, A: 1.5, B: 0, C: -0.5, D: -0.85 };

function getTierWeight(rarity, luckPct = 0): number {
  const tier = getPowerTier(rarity);
  if (!luckPct) return TIER_WEIGHT[tier];
  const luckFraction = clamp(luckPct / 100, 0, 1);
  const luckMultiplier = 1 + luckFraction * TIER_LUCK_SENSITIVITY[tier];
  return Math.max(0.02, TIER_WEIGHT[tier] * luckMultiplier);
}

const TIER_POWER_MULTIPLIER = { S: 2.2, A: 1.7, B: 1.35, C: 1.0, D: 0.7 };
```

น้ำหนักฐาน D (1.3) สูงกว่า S (0.15) ~8.7 เท่าที่ luck=0 ที่ `tierLuck` เต็ม 100%: S×3.5, A×2.5, B×1, C×0.5, D×0.15 — floor 0.02 กันน้ำหนักติดลบ/เป็นศูนย์ `TIER_POWER_MULTIPLIER` เป็นคนละสูตร ใช้คูณ "ค่าตัวเลขจริงในการ์ด" ไม่ใช่โอกาสสุ่ม

### 4.4 อัลกอริทึม `triggerLevelUpChoices()` (step-by-step)

ที่มา: `GameRoom.ts:2961-3142`

1. `getSkillRank(id, skills)` — แปลง trait id → rank ปัจจุบัน (hardcode switch ทุกสกิล, -1 ถ้าไม่มี rank)
2. เช็ค Weapon Evolution ที่ eligible (targetClass ตรง + baseRank≥required + มี synergy trait + ยังไม่เคย evolve)
3. กรองพูลปกติ: ตัด evolution, banished, class ไม่ตรง, signature ที่ยังไม่ปลดล็อก, rank เต็ม 3, การ์ด one-time ที่ได้แล้ว
4. **การันตี locked trait** ก่อน (ถ้ามี + ยังไม่ banish + rank ไม่เต็ม)
5. **การันตี eligible evolution** เติมจนครบ 3 ช่อง
6. **สุ่มถ่วงน้ำหนัก (roulette wheel, ไม่ซ้ำใบ)** เติมช่องที่เหลือด้วย `getTierWeight(rarity, tierLuck)`
7. ส่ง `LEVEL_UP_CHOICE` พร้อม tier badge + rank suffix

⚠️ **ไม่มี fallback ถ้า pool หมดก่อนครบ 3 ใบ** — ดู §4.7

### 4.5 ระบบ Weapon Evolution

ที่มา: `classes.ts:463-584` — **นับจริง 8 อัน** (comment โค้ดยืนยัน "8 Ultimate Unions")

| id | Class | Recipe | Effect ที่ยืนยันได้ |
|---|---|---|---|
| `evo_crimson_tempest` | Swordsman | Whirlwind R3 + Rend&Tear | +35% dmg, +15 flatDmg, พายุเลือดหมุนต่อเนื่อง |
| `evo_aegis_bastion` | Swordsman | Shield Bash R3 + Fortress Stance | +8 def, +100 maxHp, shockwave สะท้อน 200% dmg |
| `evo_blizzard_volley` | Archer | Multishot R3 + Frost Trap | +30% dmg, +10% crit, ยิง 8 ดอกทะลุ+แช่แข็ง |
| `evo_hellfire_cataclysm` | Archer | Explosive Shot R3 + Deadeye Pierce | +35% dmg (ตัวเลขอื่นไม่พบครบใน source) |
| `evo_absolute_zero` | Sorceress | Orbiting Orbs R3 + Frost Nova | ไม่พบหลักฐานตัวเลขครบใน source |
| `evo_wrath_thunder_god` | Sorceress | Lightning Overcharge R3 + Static Field | ไม่พบหลักฐานตัวเลขครบใน source |
| `evo_cluster_thermite` | Commando | Frag Grenade R3 + AP Rounds | ไม่พบหลักฐานตัวเลขครบใน source |
| `evo_titan_earthquake` | Cat Tank | Aggro Taunt R3 + Chonk Armor | ไม่พบหลักฐานตัวเลขครบใน source |

### 4.6 ระบบ Alchemist Potion (Reroll/Banish/Lock)

**เงื่อนไขปลดล็อก** (เพิ่ม 2026-09-11): `ServerPlayer.ts:76-84` ทุก potion เริ่มที่ **0** ต้องปลดผ่าน `uni_alchemist_reroll` (+2, cost 40) / `uni_alchemist_banish` (+2, cost 40) / `uni_alchemist_lock` (+1, cost 30) ทั้งสามต่อจาก `uni_root` โดยตรง ปลดแยกกันได้

**Server logic** (`handleUsePotion`, `GameRoom.ts:321-357`):

| action | เงื่อนไข | ผล |
|---|---|---|
| REROLL | `rerolls > 0` | ลด count, สุ่มใหม่ทั้งชุด 3 ใบ |
| BANISH | `banishes > 0 && traitId` | ลด count, เพิ่มเข้า `banishedTraits` ถาวรตลอด run, สุ่มใหม่ |
| LOCK | toggle off ถ้า id ตรง `lockedTraitId` เดิม, ไม่งั้นถ้า `locks > 0` → ตั้งใหม่ | ส่ง `POTION_UPDATE` เฉยๆ ไม่สุ่มใหม่ |

⚠️ ทั้ง BANISH และ LOCK **ไม่เช็คว่า `traitId` อยู่ในตัวเลือกที่กำลังแสดงจริง**

**Client** (`TraitSelector.ts`, หลัง fix bug pendingQueue 2026-09-11): `showChoices()` แทนที่การ์ดทันทีทุกครั้ง ไม่มี queue อีกแล้ว

### 4.7 Stability Risk — Card/Skill System

- ✅ **แก้แล้ว (2026-09-11)** — ~~🔴 สูง — Weighted-random selection อาจได้ choices ว่างเปล่า~~: `triggerLevelUpChoices()` ตอนนี้เช็ค `selectedTraits.length === 0` ก่อนส่ง — ถ้าว่างจริง จะไม่ส่ง `LEVEL_UP_CHOICE` เปล่าอีกต่อไป แต่ส่ง `LEVEL_UP_SKIPPED` (heal 25% max HP เป็น consolation) แล้ว resolve pick ทันทีผ่าน `finishLevelUpChoice()` (`src/server/engine/GameRoom.ts`, client: `src/client/main.ts`, test: `GameRoom.test.ts` describe "empty trait-pool skip", spec: `docs/archive/2026-09-11-round1-functional-bugfixes.md`)
- ✅ **แก้แล้ว (2026-09-11)** — ~~🟡 กลาง — LOCK/BANISH ไม่ validate ว่า traitId อยู่ในตัวเลือกปัจจุบันจริง~~: `ServerPlayer.currentTraitChoiceIds` เก็บ id ที่เสนอจริงทุกครั้งที่ส่ง choices; `handleSelectTrait`/`handleUsePotion` (BANISH/LOCK) reject ถ้า traitId ไม่อยู่ในนั้น + ตรวจคลาส/signature-unlock/rank ซ้ำอีกชั้น (defense-in-depth) (`src/server/engine/GameRoom.ts`, `ServerPlayer.ts`)
- ✅ **แก้แล้ว (2026-09-11)** — ~~🟡 กลาง — Race condition ที่ potion action ซ้อนกันได้~~: ตรวจสอบเพิ่มเติมพบว่า root cause จริงอยู่ฝั่ง **client** ไม่ใช่ server — `ws.on('message', ...)` ฝั่ง server เป็น synchronous ล้วน (ไม่มี `await`) จึงไม่มี race window จริงในกระบวนการฝั่ง server เลย ตัวปัญหาจริงคือปุ่ม REROLL/BANISH/LOCK ฝั่ง client เช็คแค่ `currentPotions` (ค่าที่ cache ไว้ ยังไม่ update จนกว่า response จะมา) ไม่ gate การคลิกซ้ำระหว่างรอ network round-trip แก้โดยเพิ่ม `isPotionActionPending` flag ใน `TraitSelector.ts` ที่ set ทันทีตอนคลิก และ clear เมื่อ response (`showChoices`/`updatePotions`) กลับมา (`src/client/ui/TraitSelector.ts`)
- 🟡 **กลาง — Tier weight/multiplier เป็น magic number ในโค้ด ไม่ใช่ config**: ปรับ balance ต้องแก้โค้ด+build ใหม่ทุกครั้ง
- 🟢 **ต่ำ — สองระบบคำศัพท์คู่ขนาน** (rarity string vs tier letter S/A/B/C/D)
- 🟢 **ต่ำ — comment จำนวนการ์ดในโค้ดล้าสมัย** (อ้าง 78 ทั้งที่จริง 70)

---

## 5. Game Logic & Mechanics

### 5.1 Core Game Loop

ที่มา: `GameRoom.ts:434-` (`tick()`)

เซิร์ฟเวอร์เป็น **authoritative เต็มรูปแบบ** — client เป็นแค่ตัวส่ง input + เรนเดอร์

- **Tick rate**: 25Hz (`SERVER_TICK_MS=40`)
- **State machine ระดับ tick**:
  1. `!isStarted || isOver` → return
  2. เคลียร์ `damageNumbers` (ต้องเคลียร์**ก่อน**เช็ค pause เสมอ — บั๊กเก่าเคยทำให้เสียง/เลขดาเมจวนซ้ำตลอดตอน pause)
  3. `isPaused` (เลือกการ์ดเลเวลอัพ) → freeze โลก
  4. `victoryPending` (รอกดเล่นต่อหลัง wave 30) → freeze เหมือนกัน
  5. รัน simulation frame เต็ม แล้ว `broadcastTick()`
- **Map**: 4500×4500, broadphase ด้วย spatial grid 150×150
- **Network**: WebSocket, tagged-union message type, ส่ง `TICK` ทุก tick พร้อม state ทั้งหมดของโลกในข้อความเดียว ไม่มี delta-compression

### 5.2 ระบบ Combat Resolution

**สูตรดาเมจขาออก** (`executePlayerAttack()`, `GameRoom.ts:1396-1404`):

```
isCrit = Math.random() < stats.critChance
critMult = isCrit ? (1.0 + stats.critBonus) : 1.0
finalDamage = round(stats.flatDamage × stats.damageBonus × critMult)
```
แต่ละคลาส/ท่าคูณ `finalDamage` เพิ่มด้วย multiplier เฉพาะท่า (เช่น Swordsman Whirlwind ×1.35)

**สูตรดาเมจขาเข้า** (`ServerPlayer.takeDamage()`, `ServerPlayer.ts:261-298`):

```
armor = max(0, stats.defense) + โบนัสจาก skill (blessedAegis/ironRetaliation/astralAegis/chonkArmor)
damageReduction = 100 / (100 + armor × 5)
actualDamage = max(1, round(incomingAmount × damageReduction))
```
สูตร **diminishing returns มาตรฐาน** ดาเมจขั้นต่ำ 1 เสมอ เช็คก่อนคำนวณ: `isDead || invulnerableTimer>0 || dashDuration>0 || isChoosingTrait || isDisconnected` → ไม่โดนดาเมจเลย + Archer Windrunner evasion (10/18/25% ตาม rank)

**Nine Lives** (Cat Tank): ถ้าจะตาย + มี `nineLives && !nineLivesUsed` → ฟื้น HP เต็ม + คุ้มกัน 3 วิ ใช้ได้ครั้งเดียวต่อ run

**True Damage** (`applyTrueDamage()`): ข้าม armor/Nine Lives/invuln/dash ทั้งหมด ใช้เฉพาะจุดเดียวคือ final-boss execute deadline

### 5.3 ระบบปฏิกิริยาธาตุ (Elemental Reactions)

ที่มา: `damageMonster()`, `GameRoom.ts:2362-2460`

| ปฏิกิริยา | เงื่อนไข | ผล |
|---|---|---|
| 💥 Shatter | PHYSICAL ชน FROST | ดาเมจ ×3.0, ยิงเศษน้ำแข็ง 6 ทิศ (50% ของดาเมจต้นฉบับ, crit เสมอ) |
| 🔥 Bloodflame | FIRE(BURN) ชน BLEED (สลับได้) | ดาเมจ ×2.2 + 8% ของ maxHp มอนสเตอร์ |
| ⚡ Superconduct | SHOCK ชน FROST (สลับได้) | `defenseDebuff=0.5` (โดนดาเมจเพิ่ม 50%), ลูกโซ่ไปมอนอื่นในระยะ 160 สูงสุด 8 ตัว (60% ดาเมจ) |
| ✨ Conflagration | HOLY ชน BURN (สลับได้) | ดาเมจ ×2.0, ฮีลผู้เล่นในระยะ 260 คนละ 5% ของ maxHp ตัวเอง |
| (ไม่มีปฏิกิริยา) | ธาตุใหม่ไม่ตรงเงื่อนไขไหน | ฝัง status ใหม่ (duration 4.5 วิ) รอปฏิกิริยาครั้งถัดไป |

`defenseDebuff` สลายเองทีละนิด (`-= dt×0.12`/วิ) ไม่ใช่หมดทันทีตอนหมด duration status

### 5.4 ระบบเศรษฐกิจ/สกุลเงิน (Soul Coin Economy)

- **Personal wallet**: `player.gold` เป็นของส่วนตัว ไม่แชร์ทีม
- **Team pool**: `teamGold` เริ่มที่ 0 ทุกแมตช์ (เคยมีบั๊กแจกฟรี 35,000 ตอนเริ่มเกม ถูกถอดแล้ว) โตได้ทางเดียวคือ `grantBonusGold()` (GM command `/api/grant-gold`)
- **ตอนจบเกม**: แต่ละคนได้ `personalGold` + ส่วนแบ่ง `teamGold/playerCount` แปลงเป็น permanent coin ทันที
- **บทลงโทษยอมแพ้**: หัก `gold *= SURRENDER_GOLD_RETENTION` (0.5) เฉพาะคนกดยอมแพ้
- **Endless mode reset**: `handleContinueRun()` รีเซ็ต `gold=0`/`totalKills=0` ทุกคน กัน GAME_OVER ตอนจบจริงนับซ้ำยอดที่แบงค์ไปแล้วตอนกด Continue

### 5.5 ระบบอื่นๆ ที่พบใน repo

- **Shrine system** (SPEED/FRENZY/AEGIS/GOLD_RUSH/ALTAR_BLOOD/ALTAR_TEMPEST/ALTAR_VOID) — บัฟชั่วคราวยืนในโซน (นอก scope เอกสารนี้ แนะนำทำแยกถ้าต้องการรายละเอียดเต็ม)
- **Prop/obstacle system** — สุ่ม deterministic ด้วย `mulberry32` PRNG ตาม stageId (22 ชิ้น/ด่าน)
- **Reconnect system** (`RECONNECT_GRACE_MS=60,000`) — หลุดต่อไม่ตายทันที ghost ไว้ 60 วิ

### 5.6 Stability Risk — Game Logic & Mechanics

- 🔴 **สูง — TICK message ไม่มี delta compression**: ทุก 40ms ส่ง state ผู้เล่น/มอนสเตอร์/กระสุน/pickup **ทั้งหมด**ในข้อความเดียว ที่ wave ท้ายๆ (มอนถึง 380+120×(playerCount-1) ตัว) payload ต่อ tick ใหญ่มาก คูณ 25 ครั้ง/วิ ไม่มี mechanism ลด payload เมื่อ scale ขึ้น
- ⚠️ **Correction (2026-09-11)** — ~~🟡 กลาง — Superconduct chain lightning เรียกตัวเองแบบ recursive: ไม่มี guard กันการ trigger ซ้ำในเฟรมเดียว~~: **Overstate** ตรวจสอบซ้ำพบว่า chain damage เรียก `this.damageMonster(cm, Math.round(amount * 0.6), false)` **ไม่ส่ง** `sourceElement` param — reaction block (`if (element) {...}`) จึงไม่ทำงานกับเป้าหมายที่โดน chain ต่อ ทำให้ chain ไม่ recurse ต่อจริง (guard อยู่แล้วโดยบังเอิญจากการไม่ส่ง element ไม่ใช่ recursion bug จริง) (`src/server/engine/GameRoom.ts`)
- 🟡 **กลาง — Armor formula ไม่มี cap บนขีดสุด**: ไม่มี "effective HP cap" ที่ตั้งใจออกแบบไว้ชัดเจน (แม้ actualDamage floor ที่ 1 จะกันสุดทางไว้อยู่)
- 🟢 **ต่ำ — Elemental reaction logic ยาวเป็น if/else chain เดียว**: เพิ่มปฏิกิริยาใหม่เสี่ยง order-of-check ผิด

---

## 6. Top Stability Risks (สรุปรวม)

### 🔴 สูง — แก้ก่อน (เสี่ยงกระทบผู้เล่นจริง/ทำให้เกมค้าง)

1. **Server ไม่ validate `treePassives`/สถิติที่ client ส่งมา** (§1.10) — ช่องโหว่ cheat ตรงที่สุด เกมเป็น co-op แชร์ห้องกับคนอื่น ผู้เล่นคนเดียวแก้ payload กระทบทุกคนในแมตช์ได้ทันที — **ยังไม่แก้** (scope ใหญ่ ต้องแยก Phase ของตัวเอง ดู `GAME_BLUEPRINT.md` Phase 1)
2. ~~`triggerLevelUpChoices()` อาจส่งการ์ดว่างเปล่าไม่มี fallback~~ (§4.7) — **✅ แก้แล้ว 2026-09-11**
3. **TICK message ส่ง full state ทุก 40ms ไม่มี delta compression** (§5.6) — payload โตตามจำนวนมอน/ผู้เล่น/เวฟ เป็นความเสี่ยง scaling ระยะยาว — **ยังไม่แก้** (scope ใหญ่)

### 🟡 กลาง — ควรแก้รอบถัดไป

4. Magic number กระจายใน `ServerPlayer.takeDamage()` แทนที่จะเป็น config (§1.10) — ยังไม่แก้
5. ~~`COOP_HP_SCALE_PER_PLAYER` นิยามไว้แต่ไม่เคยถูกเรียกใช้จริง~~ (§3.7) — **⚠️ ล้าสมัย 2026-09-11**: ใช้จริงแล้วที่ `GameRoom.ts:582`
6. ~~`LOCK`/`BANISH` potion ไม่ validate ว่า `traitId` อยู่ในตัวเลือกปัจจุบันจริง~~ (§4.7) — **✅ แก้แล้ว 2026-09-11**
7. ~~Superconduct chain lightning เรียกตัวเองแบบ recursive ไม่มี guard~~ (§5.6) — **⚠️ Overstate 2026-09-11**: ไม่ recurse จริง (ไม่ส่ง element param ตอน chain)
8. โค้ดสร้าง JOIN_LOBBY payload/addPlayer ซ้ำหลายจุด (§1.10) — ยังไม่แก้
9. ~~Race condition ที่ potion action ยิงซ้อนกันได้ไม่มี lock~~ (§4.7) — **✅ แก้แล้ว 2026-09-11** (root cause จริงอยู่ฝั่ง client)
10. Tier weight/multiplier เป็น magic number ไม่ใช่ config ปรับได้ (§4.7) — ยังไม่แก้
11. ~~`ServerMonster.update()` ไม่เช็คว่า target ยังมีชีวิตอยู่~~ (§3.7) — **✅ แก้แล้ว 2026-09-11** (NaN guard สำหรับกรณี dist=0)

### 🟢 ต่ำ — Maintainability (ไม่เร่งด่วน)

12. ~~Rarity `'magic'` นิยามไว้แต่ไม่มีไอเทมใช้เลย~~ (§2.6) — **✅ แก้แล้ว 2026-09-11** (fallback ไป common)
13. Naming ไม่ตรงกันระหว่าง `SkillTreeNode.stats`/`PlayerStats` vs `GearItem.stats` (§1.10) — ยังไม่แก้
14. `pickMonsterType()` เป็น if-chain ไม่ใช่ data table (§3.7) — ยังไม่แก้
15. TRAIT_POOL count comment ล้าสมัย (อ้าง 78 จริง 70) (§4.7) — ยังไม่แก้
16. สองระบบคำศัพท์คู่ขนาน rarity string vs tier letter (§4.7) — ยังไม่แก้
17. Duplicated "หา nearest player" logic ใน boss abilities 4 จุด (§3.7) — ยังไม่แก้
18. vaultInventory ไม่มี cap (§2.6) — ยังไม่แก้

---

*เอกสารนี้สร้างจากการวิเคราะห์ source code จริง ณ วันที่ 2026-09-11 — หากโค้ดมีการเปลี่ยนแปลงหลังจากนี้ ควรตรวจสอบซ้ำก่อนใช้อ้างอิง*
*อัปเดตล่าสุด: 2026-09-11 (Round 1 functional bugfix) — ดูรายละเอียดที่ `docs/archive/2026-09-11-round1-functional-bugfixes.md`*
