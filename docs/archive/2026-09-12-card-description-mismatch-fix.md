# SPEC — Card Description/Code Mismatch Fix (5 cards)

> สถานะ: **เสร็จสมบูรณ์** (2026-09-12) | ประเภท: mix (2 bug fix + 2 doc correction + 1 no-op)
> ที่มา: cross-session report จาก session `card-list-documentation` — 5 การ์ดที่ `description`
> ไม่ตรงกับสิ่งที่ `apply()`/โค้ดจริงทำ ยืนยันแล้วด้วย grep+อ่าน source ตรง ไม่ใช่การเดา

## Requirement crack

Peer session รายงานเข้ามาผ่าน cross-session message พร้อมหลักฐาน — session นี้ (ในฐานะ project
coordinator) verify ซ้ำอิสระกับ source จริง (`classes.ts`, `GameRoom.ts`) ก่อนเชื่อ ยืนยัน**ถูกต้อง
ทั้ง 5 ข้อ 100%** จากนั้นร่าง spec วิเคราะห์ทีละใบ + เสนอทางเลือก ส่งให้ user อนุมัติก่อนแก้จริง
(ตาม Working Process ข้อ 0 — ไม่ implement ทันทีที่ได้รับรายงาน)

## การวิเคราะห์ + ตัดสินใจต่อใบ (สรุปจาก spec ที่อนุมัติแล้ว)

### 1. Soul Siphon Attunement (`magnet_1`) — แก้โค้ด
Comment เดิมในไฟล์ (`classes.ts:1838`, ก่อนแก้) ระบุสูตร EXP ไว้ชัด: `22% * TIER_POWER_MULTIPLIER.D
(0.7) = 15.4% ≈ 15%` — หลักฐาน design intent เดิมจริง แต่ `apply()` ไม่เคย implement EXP เลย
(มีแค่ `pickupRadius *= 1.15`) **ทั้งเกมไม่มีการ์ดไหนเคยแตะ `expMultiplier` เลยสักใบ** (grep ยืนยัน
— มีแต่ skill tree passive ที่แตะ field นี้) เพิ่ม:
```ts
apply: (s) => {
  s.expMultiplier = (s.expMultiplier ?? 1.0) + 0.15;
  s.pickupRadius *= 1.15;
}
```
Additive (ไม่ใช่ multiplicative) เพื่อให้ตรงกับ pattern ของ percentage-bonus field อื่น (`damageBonus`,
`critChance`) ที่ตรวจสอบแล้วว่าใช้ `+=` ทั้งหมดใน TRAIT_POOL — `magnet_1` เป็น universal ไม่มี rank
cap จึงสแตกซ้ำได้ไม่จำกัดเหมือนการ์ด universal อื่น

### 2. Golden Fortune Aura (`gambler_fortune_greed`) — แก้โค้ดบางส่วน + แก้ description
"+35% coin drop" ไม่มีหลักฐาน design intent ชัดเท่าใบบน — `GOLD_DROP_CHANCE` (constants.ts) เป็น
global constant **ไม่เคยมี per-player multiplier เลยทั้งระบบ** เพิ่มแบบเต็มรูป (buff จริงตามตัวเลข
description เดิม) ต้องสร้าง field ใหม่ + แก้ทุกจุดที่ GOLD_COIN drop (kill/boss/treasure chest) —
ประเมินว่า over-engineer เกินความจำเป็น เลือกทางกลาง: คง mechanism เดิม (3.5% chance ดรอปเหรียญ
พิเศษต่อไพ่ GAMBLER_CARD โดนศัตรู, `GameRoom.ts:2209` เดิม) แต่แก้ให้ **scale ตาม rank จริง**:
```ts
const greedRank = cOwner?.skills?.highRollerGreedRank || 0;
if (cOwner && greedRank > 0 && Math.random() < 0.035 * greedRank) { /* ... */ }
```
(เดิมเช็คแค่ `> 0` — rank 1/2/3 ได้ 3.5% เท่ากันหมด) แก้ description ให้ตรงกลไกจริงหลังแก้

### 3. Royal Flush Razor (`gambler_royal_flush`) — ไม่แก้
+2 การ์ดถูกต้อง 100% ตอน rank 1 (`cardCount = 3 + (skills?.fortuneCards ? 2 : 0)`, GameRoom.ts:2069)
ขับเคลื่อนด้วย boolean ไม่ใช่ rank — ตรวจสอบแล้วว่าเป็น pattern เดียวกับการ์ด signature อื่นจำนวนมาก
(เช่น `swordsman_whirlwind`, `sorceress_frost`) ที่ rank 2-3 ให้แค่ stat เสริม ไม่ scale ability หลัก
— ไม่ใช่ description mismatch จริง ไม่ต้องแก้อะไร

### 4. Armor Piercing 5.56mm (`commando_ap_rounds`) — แก้ description
`pierce = 2 + apRoundsRank` (GameRoom.ts:1935) คือ **+1/rank ไม่ใช่ +2** ตามที่ description เดิมบอก
เลือกแก้ description แทนแก้โค้ด: +2/rank จริงจะทำ rank 3 ทะลุ 8 ตัว แรงกว่า pierce card อื่นในเกม
มาก สำหรับคลาสที่มี pierce จาก burst 3 นัดอยู่แล้วโดยธรรมชาติ — เสี่ยง overpower

### 5. Quick Draw Fanning (`cowboy_quick_draw`) — แก้ description
`apply()` มีแค่ `attackSpeed *= 1.25` ไม่มี cooldown-reduction mechanic แยกอยู่จริง (attackSpeed ที่
เพิ่มขึ้นก็คือสิ่งที่ลด cooldown อัตโนมัติผ่าน `attackCooldown = weaponCooldown/attackSpeed` อยู่แล้ว)
description เดิมพูดผลลัพธ์เดียวกันซ้ำเป็น 2 ประโยค ตัดประโยค cooldown ซ้ำออก

## การ์ดที่ไม่แก้ (สรุปซ้ำ)

`gambler_royal_flush` — ไม่ใช่ bug, เป็น design pattern ปกติของระบบ signature-card rank

## Cross-session coordination note

พบระหว่างทำ: session `card-list-documentation` (branch `claude/card-list-documentation-d50d64`,
push แล้วที่ origin) **fork มาจากจุดก่อนหน้าหลาย commit ของ dashboard fixes บน `main`** (gate-flash
fix, vite-proxy fix, stage-filter section 5.7.5) — `git diff main..branch` แสดงว่า branch นั้นจะ
**ลบ**เนื้อหาเหล่านี้ถ้า merge ตรงๆ โดยไม่ rebase ก่อน แจ้ง user + peer session แล้วให้ rebase ก่อน
merge จริง — ไม่ได้แก้ให้เองในรอบนี้ (นอกขอบเขตงานนี้)

`docs/card-list.md`/`APPENDIX_TRAITPOOL.md` risk #27 entry ต้นฉบับที่ peer session เขียนไว้ (ยังไม่
merge เข้า main) ถูกใช้เป็นฐานอ้างอิงเนื้อหาของ fix นี้ (เลขริสก์ #27 ตรงกัน) — เมื่อ branch นั้น
rebase+merge ในอนาคต ให้ sync สถานะ "แก้แล้ว" เข้าไปด้วย (ไม่ใช่ "ยังไม่แก้" ตามที่เขียนไว้ตอนแรก)

## Test

- `src/shared/classes.traitFixes.test.ts` — 4 case: magnet_1 expMultiplier เพิ่ม/สแตก/บวกทับของเดิม,
  gambler_fortune_greed stat อื่นไม่เปลี่ยน
- `src/server/engine/GameRoom.gamblerCoinDrop.test.ts` — 4 case: rank 0 ไม่มีทาง drop, rank 1
  threshold เดิม/ใหม่ตรงกัน, rank 3 threshold ใหม่ทำงานจริง (roll ที่ old-3.5%-fail แต่
  new-10.5%-pass), rank 3 ยัง respect upper bound
- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ 293/293 (285 เดิม + 8 ใหม่: 4 trait-fix + 4 gambler-coin-drop)
- `npm run build` ✅

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§4.7 risk #27 เต็ม, §6 Top Stability Risks, Change Log), `GAME_BLUEPRINT.md`
(Refactor Roadmap #27, Change Log), `APPENDIX_TRAITPOOL.md` (`magnet_1` apply() effect column,
Change Log)
