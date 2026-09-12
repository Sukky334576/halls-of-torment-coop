# 📖 Torment of Souls — Game Mechanics Wiki & Stability Reference

> เอกสารนี้สร้างจากการวิเคราะห์ source code จริงเท่านั้น (ไม่มีการเดา/เติม mechanic ที่ไม่มีหลักฐานในโค้ด) จุดประสงค์คือใช้เป็นฐานอ้างอิงสำหรับไล่ปรับความเสถียรของระบบ นอกเหนือจากการบันทึกกลไกที่มีอยู่ ทุกหมวดมี sub-section **Stability Risk** และปิดท้ายด้วย **Top Stability Risks** สรุปรวมทุกหมวด
>
> สร้างเมื่อ 2026-09-11 · อ้างอิง commit ล่าสุดของ branch `main`

## Change Log

| วันที่ | สรุปสิ่งที่เปลี่ยน | เหตุผล/อ้างอิง commit หรือ prompt ที่สั่ง |
|---|---|---|
| 2026-09-11 | สร้างเอกสารครั้งแรก (compile จาก source code จริง 5 หมวด + Top Stability Risks) | คำสั่ง user: ใช้ GAME_WIKI.md เป็นฐานข้อมูล วิเคราะห์จาก source จริง |
| 2026-09-11 | Round 1 functional bugfix: แก้ risk #2 (level-up choices ว่าง), #6 (validate traitId), #9 (potion double-click), #11 (NaN guard), #12 (magic rarity fallback) + ⚠️ Correction risk #5, #7 ที่ล้าสมัย/overstate | `docs/archive/2026-09-11-round1-functional-bugfixes.md` |
| 2026-09-11 | พบและแก้ risk ใหม่ #19 (กระสุนบอสถูกวาดใต้ฝูงมอน — client z-order bug) จาก user report ตายไม่รู้สาเหตุที่ลาสบอสด่าน 2 | `docs/archive/2026-09-11-projectile-zorder-fix.md` |
| 2026-09-11 | Fix B: เปลี่ยน ELITE_GOLEM Ground Slam จาก telegraph-free เป็น 2-phase (warning ring 0.4s ก่อนดาเมจ) — §3.3 table correction | `docs/archive/2026-09-11-projectile-zorder-fix.md` |
| 2026-09-11 | พบและแก้ risk ใหม่ #20 (IMP hitbox radius 12→16 — visual-vs-hitbox mismatch) จาก user report ธนู archer โดนค้างคาวแต่ไม่มี dmg | `docs/archive/2026-09-11-imp-hitbox-fix.md` |
| 2026-09-11 | พบและแก้ risk ใหม่ #21 ("Return to Hub" หลังบอสตายค้างเกม — `victoryPending` ไม่เคยตั้ง `isOver`) จาก user report กดกลับสู่เกมหลังจบบอสแล้วเกมค้าง ต้องกดยอมแพ้เพื่อออก | `docs/archive/2026-09-11-return-to-hub-victory-trap-fix.md` |
| 2026-09-11 | Risk audit หลังแก้ #21: เปลี่ยน RETURN_TO_HUB จาก fixed-delay (150ms) เป็น ack-based (`RETURN_TO_HUB_ACK` + fallback timeout 800ms) + พบและแก้ risk ใหม่ #22 (`requireAuth` ไม่เช็คว่า user ยังมีอยู่จริง ทำ `POST /api/progression` พังแบบ unhandled 500 ถ้า token เก่ากว่า DB) | `docs/archive/2026-09-11-return-to-hub-victory-trap-fix.md` |
| 2026-09-11 | เพิ่มระบบ Telemetry & Error Logging ใหม่ทั้งระบบ (`telemetry.db` แยกจาก `game.db`, ตาราง `game_events`+`error_log`, `TelemetryBuffer` batched flush, capture point ฝั่ง server 6 event type + client error capture) — ดู §5.7-5.8 ใหม่ + risk #23, #24 | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-11 | Risk audit หลังพัฒนา telemetry (user ขอ "ลดความเสี่ยงให้ต่ำที่สุด"): เพิ่ม per-IP rate limit บน telemetry endpoint (แก้ risk #23), เพิ่ม `run_end` ให้ผู้เล่น co-op ที่ surrender ระหว่างทีมเล่นต่อด้วย (เดิมไม่มี), เพิ่ม `checkMonsterSanity()` คู่กับ `checkPlayerSanity()` เดิม | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | เพิ่ม Telemetry Dashboard (`GET /api/admin/telemetry/dashboard` + `GET /api/admin/telemetry/summary`, auth: `ADMIN_SECRET`) แก้ risk #25 — ระหว่างทดสอบพบ stored-XSS ในตาราง error ของ dashboard (draft แรกใช้ `innerHTML` render ค่าจาก endpoint ที่ไม่มี auth) แก้เป็น `textContent` ทันที + เพิ่ม category/event_type whitelist validation ที่ ingest endpoint เป็นชั้นป้องกันที่สอง — ดู §5.7.1 | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | หลัง deploy รอบแรกของ dashboard เปิดหน้าไม่ได้จริง — root cause: route เดิม `/admin/telemetry` อยู่นอก `/api/` ที่ nginx proxy มา Node เลยโดน SPA catch-all ของ game client เสิร์ฟหน้า login แทนเงียบๆ ย้าย route มาเป็น `/api/admin/telemetry/dashboard` แทน ไม่ต้องแก้ nginx | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | เพิ่ม `location /admin/` block ใหม่ใน nginx site config บน production (mirror `/api/` เดิม) แล้วย้าย dashboard route กลับมาที่ `/admin/telemetry` ตามที่ user ต้องการ (URL สะอาดกว่า) เพิ่ม risk ใหม่ #26 (nginx config ไม่ได้อยู่ใน git) | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | ทำ dashboard เป็นภาษาไทยเป็นหลัก (ตรวจ `I18n.ts`/`classes.ts`/`HUD.ts` ก่อนแปล ใช้คำเดิมที่เกมมีอยู่แล้วสำหรับ outcome, บัญญัติคำใหม่เฉพาะ rarity ที่เกมเองก็ไม่มีคำไทย) + เพิ่มระบบ System Metrics (CPU/RAM ทั้ง host และ process ใหม่ทั้งหมด — ดู §5.7.2) พบและแก้ edge case จาก unit test: `computeProcessCpuPercent()` return `null` ผิดตอน delta เวลาเป็นศูนย์ ทำแถวทั้งแถวหายไปทั้งที่ข้อมูลอื่นวัดได้ปกติ | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | เพิ่ม disk space เข้า System Metrics (`fs.statfsSync`) + auto-refresh 30 วิบน dashboard (หยุดตอนสลับแท็บ) — ต้อง migrate schema `system_metrics` ที่ deploy ไปแล้ว (`ensureColumn()` ใหม่) พบและแก้ **race condition จริงในชุด test ทั้งหมด** (ไม่ใช่แค่ feature นี้): module-level singleton เปิดไฟล์ dev DB จริงเป็น side effect ของการ import ชนกันข้าม vitest worker ได้ `database is locked` — เคยเข้าใจผิดว่าเป็น flake มาหลายรอบ | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | ตัดกราฟ "พื้นที่ดิสก์ตามเวลา" ออก (เหลือแค่ stat card — user ถามว่าจำเป็นไหม, ดิสก์เปลี่ยนช้า), เปลี่ยน "card pick rate ต่อ rarity" เป็นตารางแยกทีละใบการ์ดจริง (`getCardPickStats()` ใหม่ — ดู §5.7.3), รัน `/impeccable layout` แก้ grid wrap ไม่สม่ำเสมอ + ตัด emoji section-icon (craft-floor ban) + เพิ่ม scrollable table + sticky header (ดู §5.7.4) | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | พบและแก้ bug จาก user report: หน้า dashboard โชว์หน้ากรอก admin secret แว๊บขึ้นมาก่อนทุกครั้งที่ refresh แม้เคยล็อกอินไว้แล้ว — root cause: `#gate` ไม่มี `hidden` attribute ใน markup เริ่มต้น ส่วน JS ซ่อนมันได้แค่ตอน `fetchSummary()` (async) resolve สำเร็จ ทำให้มีช่วงจาก initial paint ถึง fetch resolve ที่ gate โชว์ค้างอยู่ แก้โดยเช็ค `localStorage` แบบ synchronous ทันทีที่ element ถูก parse (ก่อนสคริปต์หลักท้ายไฟล์จะรันด้วยซ้ำ) — ดู §5.7.1 | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | พบ gap เพิ่มเติมระหว่างพยายาม verify bug ข้างบนผ่าน real proxy: `vite.config.ts` (dev server local) ไม่เคยมี proxy rule ให้ `/admin/` เลยตั้งแต่แรก — ตอนแก้ nginx production ก่อนหน้านี้ (2026-09-12 รอบก่อน) ไม่ได้แก้ dev config คู่กันไปด้วย ทำให้ `localhost:3000/admin/telemetry` ตกไปที่ SPA ของเกม เหมือน nginx bug เดิมทุกประการ แต่คนละ layer (`vite proxy` ไม่ใช่ `nginx`) เพิ่ม `location /admin` ใน vite proxy ให้ mirror `/api/` เดิม — ดู §5.7.1 | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | เพิ่ม stage filter บน dashboard (dropdown เลือกด่าน 1-3 หรือทุกด่าน) — user เตือนว่าเกมมี 3 ด่านที่ความยากต่างกันมาก (`mobHpMultiplier` 1.0→1.6→2.5, `src/shared/stages.ts`) รวมสถิติทุกด่านเข้าด้วยกันจะทำให้ตีความผิด (เช่น wave distribution ถูก dominate ด้วยด่านที่คนเข้าเล่นเยอะสุด ไม่ใช่ด่านที่ยากสุด) `getEventSummary()`/`getCardPickStats()` รับ `stageId?: number` เพิ่มใหม่, `GET /api/admin/telemetry/summary?stage=1\|2\|3` — สุขภาพเซิร์ฟเวอร์ (CPU/RAM/ดิสก์) และ error log ตั้งใจไม่กรองตามด่าน (ไม่ใช่แนวคิดที่ผูกกับด่านโดยธรรมชาติ) — ดู §5.7.5 | `docs/archive/2026-09-11-telemetry-error-logging.md` |
| 2026-09-12 | แก้ risk #27 (description กับ apply()/โค้ดจริงของ 5 การ์ดไม่ตรงกัน — พบจาก session `card-list-documentation`) — 2 ใบแก้โค้ด (`magnet_1` เพิ่ม expMultiplier, `gambler_fortune_greed` ให้ coin-drop chance scale ตาม rank), 2 ใบแก้ description (`commando_ap_rounds`, `cowboy_quick_draw`), 1 ใบไม่ต้องแก้ (`gambler_royal_flush` เป็น pattern ปกติของระบบ ไม่ใช่ bug) | `docs/archive/2026-09-12-card-description-mismatch-fix.md` |
| 2026-09-12 | แก้ risk #28 (ไม่มี `vitest.config.ts` ทำให้ test count เพี้ยนจาก git worktree อื่นที่ทำงานขนานกัน — พบจาก session `card-list-documentation` ตรวจสอบ archive spec ก่อนหน้า) — เพิ่ม `vitest.config.ts` exclude `.claude/**`, ยืนยันตัวเลขจริง 93/93 คงที่ | `docs/archive/2026-09-12-card-description-mismatch-fix.md` |
| 2026-09-12 | พบและแก้ bug จาก user report: การ์ด "สถิติการเลือกการ์ด" กับ "Error ที่เจอบ่อยที่สุด" ติดกันไม่มีช่องว่าง — root cause: ทั้งคู่เป็น `.card` เดียวที่อยู่เป็น direct child ของ `#dashboard` ตรงๆ (ไม่ได้ห่อด้วย `.grid--*` เหมือนการ์ดอื่นทุกใบ) เลยไม่ได้ spacing จาก grid `gap` แก้ด้วย CSS scoped rule `#dashboard > .card { margin-bottom: 20px; }` เลือก selector นี้เพราะกระทบแค่ 2 การ์ดนี้เท่านั้น (การ์ดอื่นทั้งหมดซ้อนอยู่ในกริดอีกชั้น ไม่ตรงกับ selector นี้) ไม่เสี่ยง double-spacing กับ `gap` ของกริดเดิม | `docs/archive/2026-09-11-telemetry-error-logging.md` |

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
| 2 | IMP | Crimson Imp | 18 | 180 | 6 | 16 | 2 | เร็วที่สุดในกลุ่มมอนธรรมดา — ⚠️ radius แก้จาก 12→16 (2026-09-11, ดู §3.7) |
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
| ELITE_GOLEM | Ground Slam (melee AOE) | 7s | มีผู้เล่นในระยะ ≤260px | ⚠️ **แก้ 2026-09-11**: เดิม telegraph-free (ดาเมจลงทันทีตอน cast) ตอนนี้เป็น 2 phase — warning ring (`TITAN_QUAKE_TELEGRAPH`, ไม่ดาเมจ) 0.4s ก่อน แล้วค่อยดาเมจ ×2.5 แก่ทุกคนในรัศมี 180px ที่ตำแหน่ง**ตอน cast** (ไม่ใช่ตำแหน่งบอสตอน impact — golem เดินหนีระหว่าง charge ได้ แต่วงระเบิดไม่ตาม) |
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
- ✅ **พบและแก้แล้ว (2026-09-11)** — 🔴 **สูง — กระสุนถูกวาดใต้ฝูงมอนสเตอร์ (client z-order bug)**: `main.ts`'s render pass วาด `vfx.render()` (pickup + **กระสุนทุกชนิด** รวมกระสุนบอส) **ก่อน** `hordeRenderer.render()` (ฝูงมอน) เสมอ — ที่ wave ท้ายๆ ที่มีมอนถึง 380+ ตัว กระสุนที่วิ่งผ่าน/เกิดใกล้ฝูงมอนจะถูกวาดทับจนมองไม่เห็น ทั้งที่ server ยังคำนวณ hit ปกติ → ผู้เล่นรู้สึกว่า "โดนดาเมจไม่รู้สาเหตุ" ชัดเจนที่สุดกับ **LORD_OF_TORMENT** (บอสด่านสุดท้าย wave 30) เพราะ Void Barrage ยิง 5 ลูกพร้อมกัน + Summon Reinforcements เรียก Hellhound มาล้อมตัวเองทุก 15s ทำให้กระสุนโดนบังตั้งแต่เกิด แก้โดยแยก `VFX2D.render()` เป็น `renderGround()` (pickup/shrine, วาดก่อนฝูงมอนเหมือนเดิม) + `renderOverlay()` (กระสุน+particle, ย้ายไปวาด**หลัง**ฝูงมอนแทน) (`src/client/entities/VFX2D.ts`, `src/client/main.ts`, spec: `docs/archive/2026-09-11-projectile-zorder-fix.md`) — พบจาก user report "ตายไม่รู้สาเหตุตอนลาสบอสด่าน 2"
- ✅ **พบและแก้แล้ว (2026-09-11)** — 🟡 **กลาง — IMP hitbox เล็กกว่า sprite ที่วาดมาก (visual-vs-hitbox mismatch)**: `MONSTER_STATS[IMP].radius` เดิม = 12 (`constants.ts`) — **เล็กที่สุดในเกม** ขณะที่ `HordeSpriteRenderer.ts:145` วาดทุก monster type ที่ 64×64px คงที่ (IMP ไม่มี scale พิเศษ ไม่ได้ผูกกับ `radius` เลย) รวมกับ Archer arrow (`radius: 10`) ได้ combined hit radius แค่ 22px — ผู้เล่นเล็งไปที่ปีก/ขอบ sprite ที่มองเห็น (นอก hitbox จริง) จึงรู้สึกว่า "ธนูโดนชัดๆ แต่ไม่มีดาเมจ" ทั้งที่ server คำนวณ collision ถูกต้อง (`SpatialGrid.queryRadius()` ใช้ `combinedRadius = arrow.radius + monster.radius` แบบ circle-circle ปกติ ไม่มีบั๊ก logic) แก้โดยปรับ `radius: 12→16` (เท่า SKELETON) (`src/shared/constants.ts`, test: `SpatialGrid.impHitbox.test.ts`, spec: `docs/archive/2026-09-11-imp-hitbox-fix.md`) — พบจาก user report "ธนู archer โดนตัวค้างคาวแต่ไม่โดน dmg เลย"

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
- ✅ **พบและแก้แล้ว (2026-09-12)** — 🟡 **กลาง — Description กับ `apply()`/โค้ดจริงของ 5 การ์ดไม่ตรงกัน** (พบจาก session `card-list-documentation` ตอนสร้าง `docs/card-list.md`, ไล่ root cause จนสุดสายด้วย grep ทุกจุดที่ field ถูกอ่านจริงใน `GameRoom.ts`/`ServerPlayer.ts`) — ตัดสินใจแยกทีละใบ (บางใบแก้โค้ด บางใบแก้ description ตามหลักฐาน design-intent ที่มี/ไม่มี):
  - **Soul Siphon Attunement** (`magnet_1`) — **แก้โค้ด**: comment ในไฟล์เดิม (`classes.ts:1838`) ระบุสูตร EXP ไว้ชัด (`22% * TIER_POWER_MULTIPLIER.D = 15%`) แสดง design intent เดิมจริง แต่ `apply()` ไม่เคย implement EXP เลย เพิ่ม `s.expMultiplier = (s.expMultiplier ?? 1.0) + 0.15` ให้ตรงตามที่ตั้งใจไว้แต่แรก — เป็นการ์ดใบแรกในเกมที่แตะ `expMultiplier` (ก่อนหน้านี้มีแค่ skill tree passive เท่านั้นที่แตะ field นี้)
  - **Golden Fortune Aura** (`gambler_fortune_greed`) — **แก้โค้ดบางส่วน + แก้ description**: "+35% coin drop" ไม่มีหลักฐาน design intent ชัดเท่าใบบน (ไม่มี comment, `GOLD_DROP_CHANCE` เป็น global constant ไม่เคยมี per-player multiplier เลยทั้งระบบ — เพิ่มแบบเต็มรูปจะต้องสร้างกลไกใหม่ทั้งหมด) เลือกทางกลาง: คง mechanism เดิม (3.5% chance ดรอปเหรียญพิเศษต่อไพ่โดนศัตรู) แต่ให้ **scale ตาม rank จริง** (`0.035 * highRollerGreedRank` แทนที่จะเช็คแค่ `>0`) แล้วแก้ description ให้ตรงกลไกจริง
  - **Royal Flush Razor** (`gambler_royal_flush`) — **ไม่แก้อะไร**: ตัวเลข +2 การ์ดถูกต้อง 100% ตอน rank 1 ขับเคลื่อนด้วย boolean `fortuneCards` (rank 2-3 ไม่เพิ่มจำนวนการ์ดอีก) — ตรวจสอบแล้วว่าเป็น pattern เดียวกับ signature card อื่นจำนวนมาก (เช่น `swordsman_whirlwind`) ที่ rank สูงกว่าให้แค่ stat เสริม ไม่ใช่ description mismatch จริง
  - **Armor Piercing 5.56mm** (`commando_ap_rounds`) — **แก้ description**: `pierce = 2 + apRoundsRank` (GameRoom.ts) คือ +1/rank ไม่ใช่ +2 ตามที่ description เดิมบอก — เลือกแก้ description แทนแก้โค้ด เพราะ +2/rank จริงจะทำให้ rank 3 ทะลุ 8 ตัว แรงกว่า pierce card อื่นในเกมมาก (เสี่ยง overpower ให้คลาสที่มี pierce จากการยิง burst 3 นัดอยู่แล้วโดยธรรมชาติ)
  - **Quick Draw Fanning** (`cowboy_quick_draw`) — **แก้ description**: `apply()` มีแค่ `attackSpeed *= 1.25` ไม่มี cooldown-reduction mechanic แยกต่างหากอยู่จริง (attackSpeed ที่เพิ่มขึ้นเองก็คือสิ่งที่ลด cooldown โดยอัตโนมัติผ่านสูตร `attackCooldown = weaponCooldown/attackSpeed` อยู่แล้ว) description เดิมพูดผลลัพธ์เดียวกันซ้ำเป็น 2 ประโยคให้เข้าใจผิดว่ามี 2 เอฟเฟกต์
  - Test: `src/shared/classes.traitFixes.test.ts` (magnet_1 expMultiplier stack), `src/server/engine/GameRoom.gamblerCoinDrop.test.ts` (rank-scaling ยืนยันด้วย roll ที่ old-vs-new threshold ต่างกัน) — spec: `docs/archive/2026-09-12-card-description-mismatch-fix.md`
- ✅ **พบและแก้แล้ว (2026-09-12)** — 🟡 **กลาง — ไม่มี `vitest.config.ts` ทำให้ `vitest run` sweep เจอ test file ของ git worktree อื่นที่ทำงานขนานกัน** (พบระหว่าง cross-session review ของ risk #27 ข้างบน — session `card-list-documentation` ทักท้วงว่า spec รายงาน test count "293/293" แต่รันจริงได้ "93/93") root cause: หลาย Claude session ทำงานขนานกันในโปรเจกต์นี้ผ่าน `git worktree` ที่ checkout ไว้ใต้ `.claude/worktrees/<name>/` (full copy ของ repo รวม `*.test.ts` ทุกไฟล์) — vitest ไม่มี config exclude ปกติจะไม่รู้จัก path นี้ ทำให้ `vitest run` จาก root directory sweep เจอไฟล์ test ของทุก worktree ที่มีอยู่ ณ ขณะนั้นซ้ำเข้าไปด้วย ตัวเลขเลย**พองและไม่คงที่**ตามจำนวน worktree ที่มีอยู่ตอนรัน (293 → 311 ในการรันติดกันของวันเดียวกัน) แก้โดยเพิ่ม `vitest.config.ts` (`exclude: [...configDefaults.exclude, '.claude/**']`) ยืนยันแล้วว่าให้ผลคงที่ 93/93 ไม่ว่าจะมี worktree อื่นอยู่กี่ตัว **⚠️ กระทบเอกสารอื่นที่อ้างตัวเลข test count ไว้ระหว่างช่วงที่มีหลาย worktree ทำงานขนานกันวันนี้** (เช่น telemetry-error-logging spec ที่อ้าง 64/64) — ตัวเลขที่รายงานไว้ในอดีตอาจคลาดเคลื่อนแม้ fix เองยังถูกต้อง ไม่ได้แก้ย้อนหลังทุกไฟล์ archive (เก็บไว้เป็นบันทึกประวัติศาสตร์ตามที่เกิดขึ้นจริง)
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
- **Leave-room-mid-match flows**: `SURRENDER` (solo/คนสุดท้าย → `isOver=true`, coop → `removePlayer`)
  และ `RETURN_TO_HUB` (เหมือนกันทุกประการแต่ไม่มี gold penalty/ไม่ resend GAME_OVER — ใช้ตอนกด
  "กลับสู่ล็อบบี้" บนหน้า GAME_OVER ใดก็ได้ รวมโพสต์-victory, ack ผ่าน `RETURN_TO_HUB_ACK` ก่อน client
  reload มี fallback timeout `RETURN_TO_HUB_ACK_TIMEOUT_MS`=800ms เผื่อ ack หาย) ทั้งคู่มีไว้กัน
  resume-check ของ `JOIN_LOBBY` (`server.ts:476-490`) ลากผู้เล่นที่ตั้งใจออกกลับเข้าห้องเดิมที่
  `isStarted && !isOver`
- **Account/Auth system** (`server.ts`/`auth.ts`/`db.ts`) — JWT (`uid` payload, HS256, TTL 30 วัน),
  `requireAuth()` ยืนยัน signature + เช็คว่า `uid` ยังมีอยู่จริงใน `users` table ก่อนอนุญาต
  (`findUserById`) ป้องกัน token เก่ากว่าที่ DB มีจริง (เช่น dev DB ถูกล้าง/สร้างใหม่) ทำให้ query ที่มี
  `FOREIGN KEY` พัง

### 5.6 Stability Risk — Game Logic & Mechanics

- 🔴 **สูง — TICK message ไม่มี delta compression**: ทุก 40ms ส่ง state ผู้เล่น/มอนสเตอร์/กระสุน/pickup **ทั้งหมด**ในข้อความเดียว ที่ wave ท้ายๆ (มอนถึง 380+120×(playerCount-1) ตัว) payload ต่อ tick ใหญ่มาก คูณ 25 ครั้ง/วิ ไม่มี mechanism ลด payload เมื่อ scale ขึ้น
- ⚠️ **Correction (2026-09-11)** — ~~🟡 กลาง — Superconduct chain lightning เรียกตัวเองแบบ recursive: ไม่มี guard กันการ trigger ซ้ำในเฟรมเดียว~~: **Overstate** ตรวจสอบซ้ำพบว่า chain damage เรียก `this.damageMonster(cm, Math.round(amount * 0.6), false)` **ไม่ส่ง** `sourceElement` param — reaction block (`if (element) {...}`) จึงไม่ทำงานกับเป้าหมายที่โดน chain ต่อ ทำให้ chain ไม่ recurse ต่อจริง (guard อยู่แล้วโดยบังเอิญจากการไม่ส่ง element ไม่ใช่ recursion bug จริง) (`src/server/engine/GameRoom.ts`)
- 🟡 **กลาง — Armor formula ไม่มี cap บนขีดสุด**: ไม่มี "effective HP cap" ที่ตั้งใจออกแบบไว้ชัดเจน (แม้ actualDamage floor ที่ 1 จะกันสุดทางไว้อยู่)
- 🟢 **ต่ำ — Elemental reaction logic ยาวเป็น if/else chain เดียว**: เพิ่มปฏิกิริยาใหม่เสี่ยง order-of-check ผิด
- ✅ **พบและแก้แล้ว (2026-09-11)** — 🔴 **สูง — "Return to Hub" หลังบอสตายทำเกมค้าง (`victoryPending` ไม่เคยตั้ง `isOver`)**: บอส Lord of Torment ตาย (`GameRoom.ts:2645-2652`) ตั้ง `victoryPending=true` freeze โลกรอผู้เล่นเลือก Continue แต่ไม่เคยตั้ง `isOver=true` — client เดิมกดปุ่ม "กลับสู่ล็อบบี้" (`HUD.ts:249-251`) แค่ `window.location.reload()` ไม่แจ้ง server เลย พอ reload ต่อ socket ใหม่ ส่ง `JOIN_LOBBY` resume-check (`server.ts:476-490`) เห็นห้องยัง `isStarted && !isOver` จึงลากกลับเข้าห้องเดิมที่ยัง freeze อยู่แทนที่จะไป lobby → หน้าจอค้างเหมือน pause ไม่มีเมนู ต้องกดยอมแพ้เพื่อออก เกิดเหมือนกันทั้ง solo/coop (ไม่ใช่ solo-only ตามที่ user เจอครั้งแรก) — comment ใน `handleSurrender()` (`GameRoom.ts:438-441`) อธิบาย bug class นี้ไว้ตรงๆ อยู่แล้วและเคยแก้ให้ปุ่มยอมแพ้แล้ว แต่ไม่เคยพอร์ตมาใช้กับ flow ชนะบอส แก้โดยเพิ่ม `handleReturnToHub()` (คู่ขนานกับ `handleSurrender` แต่ไม่มี gold penalty/ไม่ resend GAME_OVER) + message ใหม่ `RETURN_TO_HUB` + ack round-trip (`RETURN_TO_HUB_ACK`, fallback timeout 800ms) ก่อน client reload (`src/shared/types.ts`, `src/shared/constants.ts`, `src/server/engine/GameRoom.ts`, `src/server/server.ts`, `src/client/ui/HUD.ts`, `src/client/main.ts`, test: `GameRoom.test.ts`, spec: `docs/archive/2026-09-11-return-to-hub-victory-trap-fix.md`) — พบจาก user report "กดกลับสู่เกมหลังจบบอสแล้วเกมค้าง ต้องกดยอมแพ้เพื่อออก"
- ✅ **พบและแก้แล้ว (2026-09-11)** — 🟡 **กลาง — `requireAuth()` ไม่เช็คว่า user ยังมีอยู่จริง ทำ `POST /api/progression` พังแบบ unhandled 500**: `requireAuth()` (`server.ts:222-231`) เดิมเช็คแค่ JWT signature ถูกต้อง (`verifyToken()`) ไม่เคยเช็คว่า `uid` ที่ decode ได้ยังมีแถวอยู่จริงใน `users` table — TOKEN_TTL 30 วันทำให้ token ที่ออกไว้ก่อนหน้า (เช่น dev DB ถูกล้าง/สร้างใหม่, หรือ account ถูกลบ) ยัง verify ผ่านอยู่ `GET /api/progression` ไม่พังเพราะ `SELECT` กับ id ที่ไม่มีอยู่แค่คืนค่าเปล่า แต่ `POST`'s `INSERT INTO progression` มี `FOREIGN KEY REFERENCES users(id)` เลย throw `SqliteError` ไม่มีใคร catch จนกลายเป็น 500 พบระหว่างทดสอบสด fix ด้านบน (ไม่เกี่ยวข้องกันเลย คนละ root cause) แก้โดยเพิ่ม `findUserById(payload.uid)` ใน `requireAuth()` ถ้าไม่พบให้ตอบ 401 เหมือนกรณี token ขาด/ผิด (`src/server/server.ts`, spec: `docs/archive/2026-09-11-return-to-hub-victory-trap-fix.md`) — ไม่มี unit test เพิ่ม เพราะ `server.ts` ทั้งไฟล์ไม่มี test harness ในโปรเจกต์นี้ (import จะเริ่ม HTTP+WS listener จริงทันที) ยืนยันด้วย manual E2E แทน (500 → 401 ทั้ง server log และ network tab)

### 5.7 ระบบ Telemetry & Error Logging

ที่มา: `src/server/telemetry/` (ใหม่ทั้งโฟลเดอร์), `src/shared/telemetryTypes.ts`, hook เข้า
`src/server/engine/GameRoom.ts` หลายจุด, `src/client/telemetry/ClientTelemetry.ts`, route ใหม่ใน
`server.ts`

**DB แยกไฟล์**: `telemetry.db`/`telemetry.dev.db` (WAL mode, `telemetryDb.ts`) แยกจาก `game.db`
โดยสิ้นเชิง — 2 ตาราง:
- `game_events` — gameplay telemetry: `run_start | level_up_choice | death | wave_reached | boss_kill | run_end`
- `error_log` — dedup ด้วย `signature_hash` (sha1 ของ message ที่ normalize uuid/player-id/ตัวเลขออก
  แล้ว — ดู `signatureHash.ts`) พร้อม `occurrence_count`/`status` (`open`/`fixed`) ให้ไล่ปิดบั๊กได้

**TelemetryBuffer** (`TelemetryBuffer.ts`): buffer เข้า memory ล้วน (`logEvent`/`logError`) แล้ว
flush เป็น batch ผ่าน `db.transaction()` ทุก 1 วิ — **ไม่มี DB write ใน tick() call path โดยตรงเลย**
(`better-sqlite3` synchronous ล้วน write ตรงจาก tick() จะ block 25Hz loop) flush ที่ fail ถูก
try/catch กลืนไว้ ไม่ throw ออกไปกระทบ caller `MAX_PENDING_EVENTS=5000` กัน caller ที่พังไม่ให้ buffer
โตไม่จำกัด

**Capture point ฝั่ง server** (ทั้งหมดอยู่ใน `GameRoom.ts`):

| Event | Hook จริง | หมายเหตุ |
|---|---|---|
| `run_start` | `start()` — generate `run_id` ด้วย `crypto.randomUUID()` | server-only เสมอ ไม่เชื่อ client |
| `level_up_choice` | `handleSelectTrait()` ก่อน `trait.apply()` (`GameRoom.ts:277`) | payload: offered/picked/rarity/currentRank |
| `death` | `ServerPlayer.takeDamage()`/`applyTrueDamage()` เพิ่ม param `source: DeathCause` ทุก call site | ดู "Death cause tagging" ด้านล่าง |
| `wave_reached` | `HordeDirector`'s `currentWave++` ผ่าน callback `onWaveChange` ใหม่ (constructor param) | ต่อห้อง ไม่ผูก player |
| `boss_kill` | `damageMonster()`'s `if (monster.isBoss)` block | เพิ่ม `ServerMonster.spawnedAt` ใหม่ คำนวณ `timeSinceSpawnMs` |
| `run_end` | `broadcastGameOver()` (จุดเดียวที่ทุกทางจบแมตช์จริงไหลผ่าน: wipe/surrender-as-last-player/boss-enrage-execute/boss victory — log 1 row ต่อผู้เล่นที่ยังอยู่ในห้อง) **+** `handleSurrender()`'s co-op branch (เรียก `logRunEndFor()` เดียวกันตรงๆ) | ผู้เล่น co-op ที่ surrender ระหว่างทีมยังเล่นต่อได้ `run_end` (`outcome:'surrender'`) แยกของตัวเองด้วย แม้ room/`run_id` จะยังไม่จบ — ผ่าน helper `logRunEndFor()` ที่ทั้งสองจุดเรียกร่วมกัน |

**Death cause tagging** (`DeathCause` ใน `telemetryTypes.ts`): `sourceType` มี 4 แบบ —
`monster_contact` (contact dmg loop) / `projectile` (ยิงปกติจากมอนธรรมดาหรือมอนที่เป็นบอส) /
`boss_ability` (Ground Slam, Boulder Toss, Void Barrage, Hellfire Spit — แท็กผ่าน field ใหม่
`Projectile.sourceMonsterType`/`sourceAbilityId` ที่ตั้งตอนสร้าง projectile ทั้ง 4 จุด) /
`execute_deadline` (final-boss timeout execute) `fatalHitDamage`/`wasOneShot` คำนวณจาก hp ก่อน-หลัง
โดน hit ภายใน `takeDamage()`/`applyTrueDamage()` เอง เก็บไว้ที่ `ServerPlayer.lastDeathCause` ให้
`GameRoom.logDeathEvent()` อ่านทันทีที่ return `true`

**Capture point ฝั่ง client** (`ClientTelemetry.ts`, hook เข้า `main.ts`): `window.onerror`/
`onunhandledrejection` (module scope, ติดตั้งก่อน `DOMContentLoaded`), render loop try/catch (`loop()`
แยก body ออกเป็น `renderFrame()` เพื่อครอบ try/catch ได้โดยไม่กระทบการ schedule
`requestAnimationFrame` เฟรมถัดไป), `ws.onclose`→`ws_disconnect`, `ws.onopen` (เมื่อ
`reconnectAttempts>0`)→`ws_reconnect` — **`ws.onerror` ไม่ log แยก** (comment เดิมในโค้ดยืนยัน `close`
ตามหลัง `error` เสมอ กัน double-count) buffer เอง ส่ง batch ทุก 3 วิไปที่ `POST /api/telemetry/errors`

**Server-side error capture ใหม่**: `process.on('uncaughtException'/'unhandledRejection')`
(ไม่เคยมีมาก่อนในโปรเจกต์นี้) — **สำคัญ**: ต้องเรียก `process.exit(1)` เองหลัง log เสมอ เพราะการเพิ่ม
handler พวกนี้ทำให้ Node **หยุด exit อัตโนมัติตามดีฟอลต์** — ถ้าไม่ exit เอง จะกลายเป็นรันต่อในสถานะ
process ที่อาจพังแล้วไปเรื่อยๆ แทนที่จะ crash-restart ผ่าน pm2 เหมือนพฤติกรรมเดิมก่อนมี handler นี้
(`shutdownTelemetry()` flush แบบ synchronous ก่อน exit เสมอ กันรายงาน crash หายไปพร้อมกับ process)
เพิ่ม `checkPlayerSanity()`/`checkMonsterSanity()` ใน `tick()`'s alive-player/monster loop ตามลำดับ
เช็ค NaN position/negative hp (`logic_anomaly` category, clamp กลับเป็นค่าปลอดภัยทันที) — ครอบทั้ง
`ServerPlayer` และ `ServerMonster` (`ServerMonster` เดิมมี guard เฉพาะ `dist>1e-6` ที่ root cause เก่า
อยู่แล้ว — risk #11 — `checkMonsterSanity()` เป็น backstop ชั้นที่สองแบบเดียวกับฝั่ง player ไม่ใช่เพราะ
พบบั๊กใหม่) ยังไม่ได้ wrap ทั้ง tick loop ด้วย try/catch ทั่วไป เพราะไม่มี known throw path ที่ต้อง
ป้องกันจริง — และการ swallow exception แบบกว้างๆ เสี่ยงซ่อนบั๊กจริงไว้ให้ room รันต่อด้วย state ที่พังแทน
ที่จะ crash สะอาดๆ ให้ pm2 restart (ดู `process.on('uncaughtException')` ด้านบนที่ทำหน้าที่นี้อยู่แล้ว
ในระดับ process)

**Transport**: `POST /api/telemetry/events` / `POST /api/telemetry/errors` (ผ่าน nginx proxy `/api/`
เดิม ไม่ต้องแก้ config) — **ไม่มี auth** เหมือน `/api/grant-gold` (ตั้งใจ ตามที่ user อนุมัติตอน spec)
การันตีความปลอดภัยด้วย 2 ชั้นแทน auth: (1) per-request cap — ≤50 items/request, string field cap
4000 ตัวอักษร (`MAX_TELEMETRY_BATCH`/`MAX_TELEMETRY_STRING`) (2) per-IP rate limit ใหม่ (เพิ่มหลัง risk
audit) — `isTelemetryRateLimited()` (`server.ts`) จำกัด 40 request/60 วิ ต่อ IP (limiter แยกจาก
`auth.ts`'s `isRateLimited()` ที่ใช้กับ login เพราะ threshold เดิม 8/60วิ เข้มเกินไปสำหรับ traffic
telemetry ปกติ — `ClientTelemetry` flush ทุก 3 วิเองก็ ~20 req/min อยู่แล้ว) เกิน limit ตอบ `429`

**Build version**: server ใช้ `process.env.BUILD_VERSION || 'dev'` (`buildVersion.ts`) — ต้องตั้ง env
var ตอน deploy เองถึงจะมีความหมายข้าม deploy ได้จริง ไม่งั้นทุก row จะเป็น `'dev'` เหมือนกันหมด ฝั่ง
client ใช้ vite `define: __BUILD_VERSION__` (`vite.config.ts`) ที่เปลี่ยนค่าอัตโนมัติทุก
`npm run build` (timestamp) แม้ไม่ตั้ง env var ก็ตาม

**⚠️ หมายเหตุสำคัญ**: `POST /api/telemetry/events` implementation พร้อมใช้งานเต็มรูปแบบ (ทดสอบผ่าน
curl แล้ว — ดู dev-update ที่อ้างอิง) **แต่ยังไม่มี client code เรียกจริง** — capture point ทั้ง 6 ของ
`game_events` เป็น server-authoritative ล้วนในรอบนี้ (ไม่มี game_event ฝั่ง client ที่ต้อง capture)
endpoint นี้เตรียมไว้สำหรับ client-side game telemetry ในอนาคตเท่านั้น

### 5.7.1 Telemetry Dashboard

ที่มา: `admin/telemetry-dashboard.html` (static page ใหม่), `src/server/telemetry/telemetryQueries.ts`,
route ใหม่ใน `server.ts`

หน้าเว็บ internal สำหรับดูภาพรวม `game_events`/`error_log` — ไม่มี dashboard มาก่อน (เดิม risk #25
บอกว่าต้องอ่านผ่าน SQLite client ตรงๆ) ตอนนี้แก้แล้ว:

- **`GET /admin/telemetry`** — หน้า dashboard (static HTML, เสิร์ฟตรงจาก server เดิม อ่านไฟล์สดทุก
  request ไม่ cache เพราะเป็น internal tool ที่ไม่ได้ถูกเรียกบ่อย) ตัวหน้าเองไม่มี auth (ไม่มีอะไร
  sensitive อยู่ใน markup) แต่การดึงข้อมูลจริงข้างในต้องผ่าน auth
  **⚠️ nginx ต้องมี `location /admin/` proxy มาที่ Node เอง** — nginx เดิม (production site config)
  proxy แค่ `/ws` กับ `/api/` มาที่ process นี้ เส้นทางอื่นทั้งหมดตกไปที่ SPA catch-all ของ game client
  (`try_files $uri $uri/ /index.html`) draft แรก deploy ไปที่ `/admin/telemetry` ตรงๆ แล้วเปิดไม่ได้
  จริง (nginx เสิร์ฟหน้า login ของเกมแทนเงียบๆ ไม่ error ให้เห็นด้วย) แก้ชั่วคราวด้วยการย้ายไปไว้ใต้
  `/api/` ก่อน แล้วค่อยเพิ่ม `location /admin/` block ใหม่ใน
  `/etc/nginx/sites-available/default` บน production (mirror รูปแบบเดียวกับ `location /api/`
  เดิม, ใช้ `api_zone` rate limit เดียวกัน) แล้วย้าย route กลับมาที่ `/admin/telemetry` ตามเดิม —
  **การ deploy ครั้งถัดไปต้องแน่ใจว่า nginx config บน production มี block นี้อยู่ด้วย ไม่ใช่แค่ pull
  โค้ดแอปอย่างเดียว** (ไฟล์ nginx ไม่ได้อยู่ใน git repo)
- **`GET /api/admin/telemetry/summary`** — endpoint เดียวคืนสรุปทั้งหมด (event count ต่อ type, death
  cause breakdown, wave distribution, run outcome breakdown, average playtime, error summary,
  card pick stats ต่อใบ — ดู §5.7.3) คำนวณจาก `getEventSummary()`/`getErrorSummary()`/
  `getCardPickStats()` (`telemetryQueries.ts`) — SELECT ธรรมดาแล้ว aggregate ใน JS ไม่ใช้ SQLite
  `json_extract()` เพราะไม่การันตีว่า build ของ `better-sqlite3` มี JSON1 extension เปิดอยู่
- **Auth**: `ADMIN_SECRET` env var ใหม่ แยกจาก `JWT_SECRET` โดยสิ้นเชิง (ระบบ user ปัจจุบันไม่มี
  role/admin field เลย ไม่อยากผูกกับ player account) มี insecure dev-default + warning เหมือน
  `JWT_SECRET` ส่งผ่าน header `X-Admin-Secret` เก็บไว้ใน `localStorage` ฝั่ง browser หลัง submit
  ครั้งแรก auth ผิดโดน `isRateLimited()` เดิม (bucket เดียวกับ login brute-force guard)

**🐛 พบและแก้ bug "gate โชว์แว๊บ" (2026-09-12, user report)**: หน้า `#gate` (ฟอร์มกรอก
`ADMIN_SECRET`) ไม่มี `hidden` attribute ในค่าเริ่มต้นของ markup ส่วน JS เดิมซ่อนมันได้ก็ต่อเมื่อ
`fetchSummary()` (async, ต้องรอ network round-trip) resolve สำเร็จเท่านั้น — ระหว่าง initial paint
ถึง fetch resolve เสร็จ (แม้จะสั้นระดับ ms) เบราว์เซอร์ paint `#gate` ค้างไว้ก่อนเสมอ ทำให้ visitor
ที่ login ไว้แล้วเห็นฟอร์มกรอก secret แว๊บขึ้นมาทุกครั้งที่ refresh แก้โดยตั้ง `#gate` ให้ `hidden`
เป็นค่าเริ่มต้น แล้วแทรก inline `<script>` เล็กๆ ต่อท้าย div นั้นทันที (รันแบบ synchronous ตอน parser
มาถึงจุดนี้พอดี ก่อนส่วนอื่นของหน้าและก่อน main script ท้ายไฟล์จะรันด้วยซ้ำ) เช็ค `localStorage` ตรงๆ
แล้วเปิดโชว์ gate เฉพาะตอนไม่มี secret เก็บไว้เท่านั้น

**🐛 พบ gap เพิ่มเติมระหว่าง verify bug ข้างบน (2026-09-12)**: `vite.config.ts` (dev server ที่ใช้
ตอนพัฒนา local) ไม่เคยมี proxy rule ให้ `/admin/` เลยตั้งแต่แรก — ตอนแก้ nginx production
(§Change Log 2026-09-12 รอบก่อน) ไม่ได้แก้ dev config คู่กันไปด้วย ทำให้ `localhost:3000/admin/telemetry`
ตกไปที่ SPA fallback ของ Vite เอง (เสิร์ฟหน้าเกมแทนเงียบๆ) — เหมือน nginx bug เดิมทุกประการ แค่คนละ
layer (`vite proxy` ไม่ใช่ `nginx`) ทำให้การ verify ผ่าน real proxy ตามที่ตั้งเป้าไว้หลัง nginx bug
รอบก่อน (ดู Change Log 2026-09-12) ไม่ครบจริงสำหรับ route นี้โดยเฉพาะ แก้โดยเพิ่ม `'/admin'` เข้าไปใน
`server.proxy` ของ `vite.config.ts` mirror รูปแบบเดียวกับ `/api` เดิม (`target: 'http://localhost:8080', changeOrigin: true`)

**⚠️ พบและแก้ stored-XSS ระหว่างทดสอบ (2026-09-12)**: draft แรกของหน้า dashboard render ตาราง error
ด้วย `tr.innerHTML = \`...${err.message}...\`` — `message`/`category` มาจาก
`POST /api/telemetry/errors` ที่**ไม่มี auth และไม่ sanitize HTML** โดยตรง เท่ากับใครก็ inject
`<img src=x onerror=...>` เข้าไปได้ แล้วโค้ดจะรันในเบราว์เซอร์ของ admin เองตอนเปิด dashboard (ขโมย
`ADMIN_SECRET` จาก `localStorage` ได้ทันที) ยืนยันด้วยการยิง payload จริงเข้า error_log แล้วเปิด
dashboard เห็น `<img>` tag render ตรงๆ ไม่ใช่ text แก้โดยเปลี่ยนไปใช้ `textContent` ล้วนแทน
`innerHTML` ทุกจุดที่ render ค่าจาก DB (ยืนยันซ้ำ: payload เดิมกลับมาเป็น text เฉยๆ,
`window.__xss_fired` ยังคง `undefined`) พร้อมเพิ่ม `VALID_ERROR_CATEGORIES`/`VALID_GAME_EVENT_TYPES`
whitelist ที่ `server.ts`'s ingest endpoint ปฏิเสธ category/event_type ที่ไม่อยู่ใน enum จริง
(defense-in-depth ชั้นที่สอง กันไม่ให้ค่าแปลกๆ เข้า DB เลย ไม่ต้องพึ่งแค่การ render ฝั่ง client ให้ถูก)

### 5.7.2 System Metrics (CPU/RAM/Disk)

ที่มา: `src/server/telemetry/systemMetrics.ts` (ใหม่), เพิ่ม field ใน `telemetryQueries.ts`

`SystemMetricsSampler` เก็บ CPU/RAM ทั้งระดับ **host (ทั้ง VPS)** และ **process (แค่
`game-server` เอง)** ทุก 30 วิ (`SYSTEM_METRICS_INTERVAL_MS`, `server.ts`) เขียนตรงลงตาราง
`system_metrics` ใหม่ใน `telemetry.db` **ไม่ผ่าน `TelemetryBuffer`** เหมือน `game_events`/
`error_log` — เพราะความถี่ต่ำมาก (1 ครั้ง/30 วิ ไม่ใช่ 25Hz) insert ตรงแบบ synchronous ไม่กระทบ
performance เลย

**วิธีคำนวณ**:
- Host CPU % — diff ของ `os.cpus()[].times` ระหว่าง 2 รอบ sample (`idle`/`total` time delta) —
  ต้องมี baseline รอบก่อนหน้าก่อนถึงจะคำนวณได้ (รอบแรกหลัง server เริ่มจะยังไม่มีข้อมูล ไม่เขียนแถว)
- Process CPU % — diff ของ `process.cpuUsage()` (user+system microseconds) หารด้วยเวลาที่ผ่านไป
  จริง — ต่างจาก host ตรงที่มี baseline ตั้งแต่ constructor แล้ว (ไม่ต้องรอรอบแรก) แต่ยังมี edge case
  ที่พบจาก unit test: เรียกถี่กว่าความละเอียดของ `Date.now()`/`os.cpus()` (เช่นสองครั้งในมิลลิวินาที
  เดียวกัน) จะได้ delta เป็นศูนย์ — เดิม return `null` ทำให้แถวทั้งแถวถูกข้ามไปเงียบๆ ทั้งที่ host
  CPU/RAM ยังวัดได้ปกติ แก้เป็น return `0` แทน (มี baseline จริง แค่ยังไม่มีเวลาผ่านไปพอจะวัด ไม่ใช่
  "ไม่มีข้อมูล")
- Memory — `os.totalmem()/os.freemem()` (host), `process.memoryUsage().rss` (process) หน่วย MB
- Disk — `fs.statfsSync()` บน directory ที่ `telemetry.db` เองอยู่ (อ่านจาก `better-sqlite3`'s
  `db.name`) ใช้ `bavail` (ไม่ใช่ `bfree`) เพราะไม่รวม block ที่กันไว้สำหรับ root ตรงกับพื้นที่ที่
  process จริงเขียนได้จริง — เกี่ยวข้องตรงกับ risk #24 (ไม่มี retention policy) เพราะเป็นตัวเช็คว่า
  ข้อมูลที่โตไม่มีเพดานนี้กำลังกินพื้นที่ดิสก์แค่ไหนจริง `null` ถ้า `fs.statfsSync` ใช้ไม่ได้ (เช่น
  `:memory:` DB ตอนเทส) หรือ platform ไม่รองรับ — ไม่ทำให้ sample ทั้งแถวพังเหมือนที่เคยเป็นปัญหากับ
  CPU ด้านบน

**Dashboard**: section ใหม่ "สุขภาพเซิร์ฟเวอร์" ใน `/admin/telemetry` — stat card 5 ใบ (ค่าล่าสุด:
host CPU/RAM, process CPU/RAM, disk) + line chart 2 อัน (CPU ตามเวลา, RAM ตามเวลา — dual y-axis
เพราะ host/process หน่วยต่างกันมาก) **⚠️ ตั้งใจไม่ทำกราฟ "พื้นที่ดิสก์ตามเวลา" แยก** (มีแค่ stat card
ค่าล่าสุด) — user ถามตรงๆ ว่า "จำเป็นต้องทำเป็นกราฟหรอ" ตอบว่าไม่จำเป็นเพราะดิสก์เปลี่ยนช้ากว่า CPU/RAM
มาก ดู trend แบบ real-time ไม่ค่อยมีประโยชน์เท่า มี empty-state ถ้ายังไม่มี sample เลย (รอ 30 วิแรก
หลัง deploy/restart) **Auto-refresh ทุก 30 วิ** (ตรงกับ sampler เอง — poll ถี่กว่านั้นก็ได้ข้อมูลซ้ำเดิม)
**หยุด poll อัตโนมัติเมื่อสลับแท็บ** (`document.visibilitychange`) กันเปลืองตอนเปิดค้างไว้ไม่ได้ดู
แล้ว refetch ทันทีตอนกลับมาดูแท็บ (ไม่ต้องรอ tick ถัดไป)

**API**: field `system` ใหม่ใน `GET /api/admin/telemetry/summary` เดิม (ไม่แยก endpoint ใหม่) —
`getSystemMetricsSeries()` คืนค่าย้อนหลังสูงสุด 500 sample (default) เรียงเก่า→ใหม่พร้อมใช้กับ chart
ได้ตรงๆ (~4 ชม. ที่ interval 30 วิ) ไม่มี retention/prune บนตารางเองเหมือน `game_events`/`error_log`
เดิม (risk เดียวกัน — ดู #24)

**Schema migration**: `disk_used_mb`/`disk_total_mb` เพิ่มเข้ามา**หลัง** `system_metrics` ถูก deploy
ไปแล้วรอบแรกบน production — แก้ด้วย `ensureColumn()` helper ใหม่ใน `telemetryDb.ts` (เช็ค
`PRAGMA table_info` ก่อน `ALTER TABLE ADD COLUMN` เฉพาะที่ยังไม่มี) เพื่อ migrate DB ที่มีอยู่แล้วโดย
ไม่ทำข้อมูลเดิมหาย — คอลัมน์ใหม่เป็น nullable ล้วน (ไม่ใส่ `NOT NULL`) เพราะ SQLite `ALTER TABLE ADD
COLUMN` ใส่ `NOT NULL` ไม่ได้ถ้าไม่มี `DEFAULT` บนตารางที่มีแถวอยู่แล้ว

**🐛 พบและแก้ race condition จริงในชุด test (ไม่ใช่แค่ feature นี้ — กระทบ test suite ทั้งหมด)**:
`telemetryDb.ts`'s module-level singleton (`export const telemetryDb = createTelemetryConnection()`)
เปิดไฟล์ dev DB จริง (`data/telemetry.dev.db`) เป็น side effect ทันทีที่ import — ทุก test file ที่
import อะไรก็ตามที่พาดพิงถึง `TelemetryBuffer.ts`/`telemetryDb.ts` (ทางตรงหรือทางอ้อม) จะ trigger
การเปิดไฟล์เดียวกันนี้ พอ vitest รันหลาย test file พร้อมกันใน worker คนละตัว ทุกตัวแย่งเปิด/แก้ไฟล์
เดียวกันจริง ได้ `SqliteError: database is locked` เป็นครั้งคราว (เคยเข้าใจผิดว่าเป็น "transient
flake" มาหลายรอบในเซสชันนี้ ก่อนจะ reproduce ซ้ำได้แน่นอนหลังเพิ่ม `ALTER TABLE` migration ซึ่งเปิด
โอกาสชนกันมากกว่า `CREATE TABLE IF NOT EXISTS` เดิม) แก้โดยให้ singleton ใช้ `:memory:` แทนเมื่อรันใต้
vitest (เช็ค `process.env.VITEST` ที่ vitest set ให้อัตโนมัติ) — ไม่มี test ไหนใช้ singleton ตัวนี้
โดยตรงอยู่แล้ว (ทุก test สร้าง connection ของตัวเองผ่าน `createTelemetryConnection(':memory:')`)
ปัญหาคือแค่การ import module เฉยๆ ก็ trigger side effect นี้ไปแล้ว

### 5.7.3 Card Pick Stats (แทนที่ card pick rate ต่อ rarity เดิม)

ที่มา: `getCardPickStats()` ใหม่ใน `telemetryQueries.ts`

**เปลี่ยนจาก**: pie chart รวมยอด pick ต่อ rarity tier (common/rare/epic/legendary/mythic) —
**เป็น**: ตารางแยกทีละใบการ์ดจริง (ชื่อการ์ดจาก `TRAIT_POOL[...].thaiName`) พร้อม "เสนอกี่ครั้ง/เลือก
กี่ครั้ง/อัตราเลือก %" เรียงจากอัตราเลือกน้อยสุดก่อน — user ขอเปลี่ยนเพราะอยากรู้ว่า **การ์ดใบไหน**
(ไม่ใช่แค่ tier ไหน) ที่คนไม่ค่อยเลือก เพื่อเอาไปปรับสมดุลให้มีความสำคัญมากขึ้น สรุปยอด "เสนอ" จาก
`payload.offered[]` เทียบกับ "เลือก" จาก `payload.picked` ของทุก `level_up_choice` event — การ์ดที่
`timesOffered === 0` (ไม่เคยถูกเสนอเลย) ถูกตัดออกจากผลลัพธ์ เพราะ "ยังไม่มีข้อมูล" กับ "เสนอแล้วไม่มี
ใครเลือก" เป็นคนละความหมายกัน ไม่ควรปนกัน

Dashboard: table ใหม่ "สถิติการเลือกการ์ด" อยู่ใน `.table-scroll` (ดู §5.7.4) พร้อม color-code คอลัมน์
อัตราเลือก (`.pick-low` แดง <15%, `.pick-high` เขียว ≥50%)

### 5.7.4 Layout Audit (`/impeccable layout`)

ที่มา: user ขอ "เอา impeccable มาเช็ค layout ... ทำเป็น component เพื่อให้สวยงามดูง่าย" — รัน
mechanical scan (`impeccable detect --scope layout`, ผลว่าง ทั้งก่อนและหลังแก้) + ตรวจด้วยตาเอง +
วัด DOM จริงผ่าน browser พบ 3 ปัญหาจริง แก้ครบ:

1. **Grid wrap ไม่สม่ำเสมอ**: `.grid` เดิมใช้ `repeat(auto-fit, minmax(280px,1fr))` ตัวเดียวทั้ง
   หน้า — section 4 การ์ด (เหลือ 1 ใบแถวสุดท้าย) กับ section 5 การ์ด (เหลือ 2 ใบ) ได้ผลลัพธ์
   **ไม่เหมือนกัน**: 1 ใบ stretch เต็มแถว (auto-fit collapse track ว่าง), 2 ใบ เหลือช่องว่างข้างๆ ไม่
   stretch — เป็น "framework default" ไม่ใช่ design ตั้งใจ แก้โดยแยกเป็น `.grid--stats` (fixed 4
   คอลัมน์, breakpoint 2/1 ตาม viewport) กับ `.grid--charts` (fixed 2 คอลัมน์ — chart ต้องการพื้นที่
   มากกว่า stat tile) ผลลัพธ์: สม่ำเสมอทุก section ไม่ว่าจะเหลือกี่ใบในแถวสุดท้าย
2. **Emoji เป็น icon system**: 📈/🖥️/📊 หน้า section title ทั้ง 3 จุด ตรงกับ craft-floor ban ตรงๆ
   ("Unicode glyphs or emoji standing in for an icon system") — ลบออก เหลือแค่ 🗡️ ที่ page title
   (ใช้ครั้งเดียวเป็น brand mark ตามที่โปรเจกต์ใช้จริงอยู่แล้วใน server log/pm2 output ไม่ใช่ icon
   system ที่วนซ้ำ)
3. **ตารางยาวไม่มีขอบเขต**: `#card-stats-table` ไม่มี cap เลย — ในเกมจริงมีได้ถึง ~70 แถว (ทุกใบใน
   `TRAIT_POOL` ที่เคยถูกเสนอ) จะทำให้หน้ายาวมากโดยไม่จำเป็น (ทดสอบยัด 70 แถวจำลองจริง หน้าเดิมจะยาว
   ขึ้นตรงๆ ตามจำนวนแถว) แก้ด้วย `.table-scroll` (`max-height: 420px; overflow-y: auto;`) ครอบทั้ง
   ตาราง card-stats และ error log (สม่ำเสมอกัน) + sticky header (`position: sticky` บน `<th>`
   ร่วมกับ `border-collapse: separate` แทน `collapse` — `collapse` ทำให้ sticky บน `<th>` ใช้ไม่ได้
   จริงใน Chromium เป็น known quirk) **⚠️ หมายเหตุความน่าเชื่อถือของการ verify**: ยืนยัน
   `max-height`/`overflow-y` ทำงานจริงผ่านการวัด DOM ตรงๆ (`scrollHeight`/`clientHeight`) แต่ verify
   sticky header ด้วยการ scroll จริงไม่สำเร็จในรอบนี้เพราะ Browser pane ที่ใช้ทดสอบอยู่ในสถานะ
   "hidden" (ไม่ได้แสดงผลจริงให้ user เห็น) ทำให้ paint/scroll-linked reflow บางส่วนไม่ทำงานระหว่าง
   ทดสอบ (ยืนยันจาก error message ของ tool เองว่า "page is not rendered while not displayed") —
   `position: sticky` ยืนยันแล้วว่าถูก apply จริง (`getComputedStyle`) และเป็น pattern มาตรฐานที่
   รองรับกว้างขวางร่วมกับ `border-collapse: separate` แต่ยังไม่ได้เห็นด้วยตาจริงว่า sticky ทำงาน
   ระหว่าง scroll — ควรเช็คตอนเปิดหน้าจริงครั้งแรกหลัง deploy

### 5.7.5 Stage Filter

ที่มา: `stageId?: number` param ใหม่ใน `getEventSummary()`/`getCardPickStats()`
(`telemetryQueries.ts`), `?stage=` query param ใน `GET /api/admin/telemetry/summary`
(`server.ts`), dropdown ใหม่ใน `admin/telemetry-dashboard.html`

เกมมี 3 ด่าน (`src/shared/stages.ts`) ที่ความยากต่างกันมาก — `mobHpMultiplier`/`mobDmgMultiplier`
ไล่จาก 1.0/1.0 (ด่าน 1) → 1.6/1.4 (ด่าน 2) → 2.5/2.0 (ด่าน 3) รวมสถิติทุกด่านเข้าด้วยกันแบบเดิม
(ก่อนรอบนี้) ทำให้ตีความผิดได้ง่าย เช่น "ส่วนใหญ่ผู้เล่นตันแถวเวฟ 12" อาจเป็นภาพของด่าน 3 เกือบทั้งหมด
ขณะที่ด่าน 1 ผ่านเวฟนั้นไปเรียบร้อยแล้ว แต่ค่าเฉลี่ยรวมไม่เห็นความต่างนี้เลย

**Backend**: `getEventSummary(db, stageId?)`/`getCardPickStats(db, stageId?)` — เมื่อส่ง `stageId`
มา เปลี่ยนจาก `SELECT ... FROM game_events` เป็น `SELECT ... FROM game_events WHERE stage_id = ?`
ไม่ส่งมาเลย (`undefined`) = รวมทุกด่านเหมือนพฤติกรรมเดิมก่อนรอบนี้ (backward compatible, ไม่กระทบ
caller เดิมที่ไม่รู้จัก param ใหม่) `server.ts`'s `handleTelemetrySummary()` parse
`?stage=1|2|3` จาก query string, whitelist เฉพาะค่า 1/2/3 (ค่าอื่น/ไม่มีค่า = `undefined` = ทุกด่าน)

**ตั้งใจไม่กรอง**: `getErrorSummary()`/`getSystemMetricsSeries()` — CPU/RAM/ดิสก์ของเซิร์ฟเวอร์และ
error log ไม่ใช่แนวคิดที่ผูกกับด่านที่ผู้เล่นกำลังเล่นอยู่ (เซิร์ฟเวอร์ตัวเดียวรันทุกด่านพร้อมกัน,
error อาจเกิดจากโค้ดที่ใช้ร่วมกันทุกด่าน) กรองแยกตามด่านจะทำให้เข้าใจผิดว่ามันสัมพันธ์กับด่านโดยตรง

**Dashboard**: dropdown "ทุกด่าน / ด่าน 1 (สุสานวิญญาณหลอน) / ด่าน 2 (ถ้ำเพลิงอเวจี) / ด่าน 3
(ขุมนรกทมิฬศิลาดำ)" ในแถบ toolbar ข้าง "รีเฟรช" — เปลี่ยนค่าแล้ว fetch ใหม่ทันที (ไม่ต้องกดรีเฟรช
เอง) `fetchSummary()` อ่านค่า dropdown ปัจจุบันทุกครั้งที่เรียก จึงทำงานถูกต้องร่วมกับ auto-refresh
ทุก 30 วิเดิมโดยไม่ต้องแก้ auto-refresh logic เลย ส่วนที่ถูกกรอง ("สถิติการเล่นเกม",
"สถิติการเลือกการ์ด") มีข้อความ "(ตามด่านที่เลือก)" ต่อท้ายหัวข้อ ส่วน "Error ที่ยังไม่แก้"
(ในการ์ดภาพรวม, ไม่ถูกกรอง) มีข้อความ "(ทุกด่าน)" กำกับไว้กันสับสน เพราะอยู่ปนกับสถิติอื่นที่ถูกกรอง
ในการ์ดชุดเดียวกัน

### 5.8 Stability Risk — Telemetry & Error Logging System

- ✅ **ลดความเสี่ยงแล้ว (2026-09-11, risk audit หลังพัฒนา)** — ~~🟡 กลาง — `/api/telemetry/events`/`/errors` ไม่มี auth เลย~~: ยังไม่มี auth ตามที่ตั้งใจไว้ (สอดคล้องกับ `/api/grant-gold`) แต่เพิ่ม `isTelemetryRateLimited()` (40 req/60วิ ต่อ IP, `server.ts`) เป็นชั้นป้องกันที่สอง คู่กับ per-request cap เดิม — ทดสอบแล้วว่า request ที่ 41+ ใน 60 วิ โดน `429` จริง (curl loop 45 ครั้ง: 40×200, 5×429)
- 🟢 **ต่ำ — ไม่มี retention/prune policy**: `telemetry.db` โตไปเรื่อยๆ ไม่มี cron/cleanup ตัดข้อมูลเก่า
  (ตั้งใจไม่ทำตอนนี้ ตามที่ระบุไว้ใน spec ตั้งแต่ต้น)
- ✅ **แก้แล้ว (2026-09-12)** — ~~🟢 ต่ำ — ไม่มี dashboard~~: `GET /admin/telemetry` (ดู §5.7.1) —
  ระหว่างทำพบ stored-XSS จริง (แก้แล้ว) และพบว่า nginx เดิมไม่ proxy `/admin/` มา Node (แก้แล้วด้วย
  `location /admin/` block ใหม่)
- 🟢 **ต่ำ — server crash (uncaught) = ไม่มี `run_end` แถวนั้น**: ต้อง cross-check `run_start` vs
  `run_end` ที่ไม่ match กันเพื่อประเมิน crash rate ทางอ้อม (ตั้งใจ ไม่ใช่บั๊ก — ดูเหตุผลเรื่อง
  `process.exit(1)` ด้านบน)
- 🟢 **ต่ำ — `POST /api/telemetry/events` ยังไม่มี client caller จริง**: เตรียมไว้สำหรับอนาคต ไม่ใช่
  dead code แต่ก็ไม่ได้ถูกใช้งานในฟีเจอร์ชุดนี้เลย
- 🟢 **ต่ำ — nginx site config ไม่ได้อยู่ใน git repo**: `location /admin/`/`/api/`/`/ws` ทั้งหมดอยู่แค่
  บน production filesystem เท่านั้น (`/etc/nginx/sites-available/default`) ไม่มี version control —
  server สร้างใหม่/config ถูก revert จะทำ routing พังเงียบๆ อีก (ดู risk #26 ใน §6)

---

## 6. Top Stability Risks (สรุปรวม)

### 🔴 สูง — แก้ก่อน (เสี่ยงกระทบผู้เล่นจริง/ทำให้เกมค้าง)

1. **Server ไม่ validate `treePassives`/สถิติที่ client ส่งมา** (§1.10) — ช่องโหว่ cheat ตรงที่สุด เกมเป็น co-op แชร์ห้องกับคนอื่น ผู้เล่นคนเดียวแก้ payload กระทบทุกคนในแมตช์ได้ทันที — **ยังไม่แก้** (scope ใหญ่ ต้องแยก Phase ของตัวเอง ดู `GAME_BLUEPRINT.md` Phase 1)
2. ~~`triggerLevelUpChoices()` อาจส่งการ์ดว่างเปล่าไม่มี fallback~~ (§4.7) — **✅ แก้แล้ว 2026-09-11**
3. **TICK message ส่ง full state ทุก 40ms ไม่มี delta compression** (§5.6) — payload โตตามจำนวนมอน/ผู้เล่น/เวฟ เป็นความเสี่ยง scaling ระยะยาว — **ยังไม่แก้** (scope ใหญ่)
19. ~~กระสุนถูกวาดใต้ฝูงมอนสเตอร์ (client z-order bug)~~ (§3.7) — **✅ แก้แล้ว 2026-09-11** (พบใหม่นอก 18 ข้อเดิม — user report "ตายไม่รู้สาเหตุตอนลาสบอสด่าน 2")
21. ~~"Return to Hub" หลังบอสตายทำเกมค้าง (`victoryPending` ไม่เคยตั้ง `isOver`)~~ (§5.6) — **✅ แก้แล้ว 2026-09-11** (พบใหม่นอก 20 ข้อเดิม — user report "กดกลับสู่เกมหลังจบบอสแล้วเกมค้าง ต้องกดยอมแพ้เพื่อออก")
22. ~~`requireAuth()` ไม่เช็คว่า user ยังมีอยู่จริง — `POST /api/progression` พังแบบ unhandled 500 ถ้า token เก่ากว่า DB~~ (§5.6) — **✅ แก้แล้ว 2026-09-11** (พบใหม่นอก 21 ข้อเดิม ระหว่าง manual test ของ #21 — คนละ root cause กัน)

### 🟡 กลาง — ควรแก้รอบถัดไป

4. Magic number กระจายใน `ServerPlayer.takeDamage()` แทนที่จะเป็น config (§1.10) — ยังไม่แก้
5. ~~`COOP_HP_SCALE_PER_PLAYER` นิยามไว้แต่ไม่เคยถูกเรียกใช้จริง~~ (§3.7) — **⚠️ ล้าสมัย 2026-09-11**: ใช้จริงแล้วที่ `GameRoom.ts:582`
6. ~~`LOCK`/`BANISH` potion ไม่ validate ว่า `traitId` อยู่ในตัวเลือกปัจจุบันจริง~~ (§4.7) — **✅ แก้แล้ว 2026-09-11**
7. ~~Superconduct chain lightning เรียกตัวเองแบบ recursive ไม่มี guard~~ (§5.6) — **⚠️ Overstate 2026-09-11**: ไม่ recurse จริง (ไม่ส่ง element param ตอน chain)
8. โค้ดสร้าง JOIN_LOBBY payload/addPlayer ซ้ำหลายจุด (§1.10) — ยังไม่แก้
9. ~~Race condition ที่ potion action ยิงซ้อนกันได้ไม่มี lock~~ (§4.7) — **✅ แก้แล้ว 2026-09-11** (root cause จริงอยู่ฝั่ง client)
20. ~~IMP hitbox เล็กกว่า sprite ที่วาดมาก (visual-vs-hitbox mismatch)~~ (§3.7) — **✅ แก้แล้ว 2026-09-11** (พบใหม่นอก 19 ข้อเดิม — user report "ธนู archer โดนตัวค้างคาวแต่ไม่โดน dmg เลย")
10. Tier weight/multiplier เป็น magic number ไม่ใช่ config ปรับได้ (§4.7) — ยังไม่แก้
27. ~~Description กับ `apply()`/โค้ดจริงของ 5 การ์ดไม่ตรงกัน~~ (§4.7) — **✅ แก้แล้ว 2026-09-12** (พบจาก session `card-list-documentation` ตอนทำ `docs/card-list.md` — 2 ใบแก้โค้ด, 2 ใบแก้ description, 1 ใบไม่ต้องแก้)
11. ~~`ServerMonster.update()` ไม่เช็คว่า target ยังมีชีวิตอยู่~~ (§3.7) — **✅ แก้แล้ว 2026-09-11** (NaN guard สำหรับกรณี dist=0)
23. ~~`/api/telemetry/events`/`/errors` ไม่มี auth เลย~~ (§5.8) — **✅ ลดความเสี่ยงแล้ว 2026-09-11**: ยังไม่มี auth ตามที่ตั้งใจ (สอดคล้อง `/api/grant-gold`) แต่เพิ่ม per-IP rate limit (40 req/60วิ) เป็นชั้นป้องกันที่สองแล้ว

### 🟢 ต่ำ — Maintainability (ไม่เร่งด่วน)

12. ~~Rarity `'magic'` นิยามไว้แต่ไม่มีไอเทมใช้เลย~~ (§2.6) — **✅ แก้แล้ว 2026-09-11** (fallback ไป common)
13. Naming ไม่ตรงกันระหว่าง `SkillTreeNode.stats`/`PlayerStats` vs `GearItem.stats` (§1.10) — ยังไม่แก้
14. `pickMonsterType()` เป็น if-chain ไม่ใช่ data table (§3.7) — ยังไม่แก้
15. TRAIT_POOL count comment ล้าสมัย (อ้าง 78 จริง 70) (§4.7) — ยังไม่แก้
16. สองระบบคำศัพท์คู่ขนาน rarity string vs tier letter (§4.7) — ยังไม่แก้
17. Duplicated "หา nearest player" logic ใน boss abilities 4 จุด (§3.7) — ยังไม่แก้
18. vaultInventory ไม่มี cap (§2.6) — ยังไม่แก้
24. `telemetry.db` ไม่มี retention/prune policy (§5.8, ครอบคลุมทั้ง `game_events`/`error_log`/`system_metrics` ใหม่) — ตั้งใจไม่ทำตอนนี้ (friend-testing scale) — ยังไม่แก้
25. ~~ไม่มี dashboard อ่าน telemetry~~ (§5.7.1) — **✅ แก้แล้ว 2026-09-12**: `GET /admin/telemetry` + `GET /api/admin/telemetry/summary` (auth: `ADMIN_SECRET`) — ระหว่างทำพบ stored-XSS ใน draft แรก แก้แล้ว, ระหว่าง deploy พบว่าเปิดไม่ได้จริงเพราะ nginx ไม่ proxy `/admin/` มา Node (แก้ชั่วคราวด้วย `/api/` ก่อน) สุดท้ายเพิ่ม `location /admin/` ใหม่ใน nginx site config แล้วย้าย route กลับมาที่ `/admin/telemetry` ตามเดิม (ดู §5.7.1 + risk ใหม่ #26)
26. **nginx site config ไม่ได้อยู่ใน git repo** (§5.7.1, ใหม่) — `location /admin/` block ที่เพิ่งเพิ่ม (และ `/ws`/`/api/` เดิม) อยู่แค่บน production filesystem เท่านั้น (`/etc/nginx/sites-available/default`) ไม่มีใน version control เลย ถ้า server ถูกสร้างใหม่หรือ config ถูก revert จะทำให้ dashboard (และฟีเจอร์อื่นที่ผูกกับ nginx routing) พังแบบเงียบๆ อีกโดยไม่มีการแจ้งเตือน — ยังไม่แก้ (ควรพิจารณาเก็บ nginx config ไว้ใน repo เป็นเอกสารอ้างอิงอย่างน้อย)
28. ~~ไม่มี `vitest.config.ts` — `vitest run` จาก root sweep เจอ `*.test.ts` ของ git worktree อื่นที่ทำงานขนานกัน (`.claude/worktrees/*`) ด้วย ทำให้ตัวเลข test เพี้ยน/ไม่คงที่~~ (พบจาก session `card-list-documentation` ตรวจสอบ archive spec ก่อนหน้าที่รายงาน "293/293" ทั้งที่จริงคือ 93/93) — **✅ แก้แล้ว 2026-09-12**: เพิ่ม `vitest.config.ts` (`exclude: [...configDefaults.exclude, '.claude/**']`) — กระทบ**ทุก archive spec ของวันนี้ที่อ้างตัวเลข test count ระหว่างช่วงที่มีหลาย worktree ทำงานขนานกัน** (เช่น telemetry-error-logging spec ที่อ้าง 64/64) ตัวเลข test count เดิมในเอกสารเหล่านั้นอาจไม่ตรงกับจำนวนจริง — ผลของ fix เองยังถูกต้องหมด (ยืนยันจาก tsc/build ที่ไม่พึ่งจำนวน test) แค่ตัวเลขที่รายงานไว้คลาดเคลื่อน ไม่ได้แก้ย้อนหลังทุกไฟล์ archive (เก็บเป็นบันทึกประวัติศาสตร์) — อ้างอิงตัวเลขจริงให้ดูจาก `vitest run` รอบใหม่แทน

---

*เอกสารนี้สร้างจากการวิเคราะห์ source code จริง ณ วันที่ 2026-09-11 — หากโค้ดมีการเปลี่ยนแปลงหลังจากนี้ ควรตรวจสอบซ้ำก่อนใช้อ้างอิง*
*อัปเดตล่าสุด: 2026-09-11 ("Return to Hub" post-boss-victory trap fix) — ดูรายละเอียดที่ `docs/archive/2026-09-11-return-to-hub-victory-trap-fix.md`*
