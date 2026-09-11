# SPEC — Round 1: Functional Bug Fixes

> สถานะ: **เสร็จสมบูรณ์** (2026-09-11) | วันที่ร่าง: 2026-09-11 | ประเภท: bug fix (functional) + doc correction
> การตัดสินใจที่อนุมัติ: (1) FIX-1 heal 25% maxHp ตอน skip (2) FIX-2 validate ทั้ง "อยู่ใน choices ปัจจุบัน" + ตรวจคลาส/rank ซ้ำอีกชั้น

## สรุปผลการทำงานจริง (post-mortem)

ทุก fix ที่ระบุใน spec ทำเสร็จและ verify แล้ว (typecheck ผ่าน, build ผ่าน, test 74/74 ผ่าน) แต่มี
**2 จุดที่แนวทางจริงต่างจากที่ร่างไว้ตอนแรก** เพราะพบข้อมูลเพิ่มเติมระหว่างลงมือ (root-cause based —
ไม่ใช่ literal ตาม spec เดิมที่คลาดเคลื่อน):

1. **FIX-3 (potion double-click)**: spec เดิมวางแผนแก้ที่ server (`ServerPlayer.potionActionPending`
   flag) แต่พบว่า `ws.on('message', ...)` ฝั่ง server เป็น synchronous ล้วน (ไม่มี `await`) ทำให้
   flag แบบนั้น**เป็น dead code จริง** — ไม่มี race window ฝั่ง server เลยในสถาปัตยกรรมปัจจุบัน
   ย้ายไปแก้ที่ client (`TraitSelector.ts`) แทน ซึ่งเป็นจุดที่ race จริงเกิดขึ้น (ปุ่มเช็ค cached
   `currentPotions` ที่ยัง stale ระหว่างรอ network round-trip) — ตรงกับที่ `GAME_BLUEPRINT.md`
   Refactor Roadmap #9 เคยทายไว้แล้วว่า "client-only fix เพียงพอ"
2. **FIX-2 (rank re-check)**: ต้องแยก `getSkillRank()` ออกจาก local closure ใน
   `triggerLevelUpChoices()` เป็น private class method เพื่อให้ `handleSelectTrait()` เรียกใช้ร่วมกันได้
   (ไม่ได้ระบุไว้ใน spec เดิม แต่จำเป็นสำหรับ implement ตามที่อนุมัติ)

**พบเพิ่มระหว่างทำ**: Risk #7 (Superconduct recursive) ที่วางแผนไว้ใน `GAME_BLUEPRINT.md` Phase 2
กลายเป็น **false positive** เมื่อตรวจโค้ดจริง (chain ไม่ส่ง `sourceElement` param จึงไม่ recurse) —
ไม่ต้องแก้อะไร ปรับเอกสารเป็น ⚠️ Correction แทน

**ไฟล์ที่แก้ทั้งหมด**: `GameRoom.ts`, `GameRoom.test.ts` (+ 6 test cases ใหม่), `ServerPlayer.ts`,
`ServerMonster.ts`, `ServerMonster.test.ts` (ใหม่), `gearData.ts`, `gearData.test.ts` (ใหม่),
`types.ts`, `main.ts`, `TraitSelector.ts`, `GAME_WIKI.md`, `GAME_BLUEPRINT.md`
> ที่มา: คำสั่ง user "แก้บัคที่ยังคงมีอยู่ในเอกสาร" → เลือก scope "Functional bugs ที่ทำเกมพัง"
> อ้างอิง risk: `docs/GAME_WIKI.md` §4.7, §3.7, §2.6, §6 (Top Stability Risks)

## ขอบเขต (5 code fixes + 2 doc corrections)

### FIX-1 (Risk #2 🔴) — Level-up choices ว่าง → เกมค้างถาวร
- **Root cause:** `triggerLevelUpChoices()` ([GameRoom.ts:3095](../src/server/engine/GameRoom.ts)) สร้าง `selectedTraits` ได้ `[]` เมื่อ pool หมด (ปลดครบ rank 3 + banish เยอะ / คลาสการ์ดน้อย) แล้วส่ง `LEVEL_UP_CHOICE {choices:[]}` ออกไป → client เปิด modal เปล่า, `isChoosingTrait` ค้าง true, โซโล่ `isPaused` ค้าง
- **แนวทางแก้ (root-cause):**
  1. แยก bookkeeping ท้าย `handleSelectTrait()` (บรรทัด 289–318: reset flag → pop `catchUpChoicesRemaining` → pop `pendingLevelUpChoices` → unpause) ออกเป็น helper `private finishLevelUpChoice(player)` แล้วให้ `handleSelectTrait` เรียก helper แทน (behavior เดิม 100%)
  2. ใน `triggerLevelUpChoices()` **ก่อนส่ง**: ถ้า `choices.length === 0` → ไม่ส่ง `LEVEL_UP_CHOICE`, ส่ง message ใหม่ `LEVEL_UP_SKIPPED` แทน แล้วเรียก `finishLevelUpChoice(player)` (ปิด modal + ปลด pause + เดิน queue ต่อ)
  3. Consolation (กัน level-up สูญเปล่า): heal `min(maxHp, hp + 25% maxHp)` ก่อน skip — **จุดตัดสินใจ** (ดูด้านล่าง)
  4. Client: `main.ts` handle `LEVEL_UP_SKIPPED` → `this.traits.hide()` + toast สั้น (เช่น "No new upgrades available")
- **ครอบคลุม edge case สำคัญ:** BANISH ใบสุดท้ายจน pool ว่าง (potion เรียก `triggerLevelUpChoices` ตอน modal เปิดอยู่) — `LEVEL_UP_SKIPPED` ปิด modal ให้ด้วย ไม่ค้าง
- **ไฟล์กระทบ:** `src/server/engine/GameRoom.ts`, `src/client/main.ts`, `src/shared/types.ts` (เพิ่ม message type), `src/client/ui/TraitSelector.ts` (ใช้ `hide()` เดิม — ไม่ต้องแก้)

### FIX-2 (Risk #6 🟡) — Trait select/potion ไม่ validate ว่า traitId อยู่ในตัวเลือกจริง
- **Root cause:** `handleSelectTrait()` ([:277](../src/server/engine/GameRoom.ts)) apply trait ใดก็ได้ที่อยู่ใน `TRAIT_POOL` ไม่ตรวจว่าอยู่ใน choices ที่ส่งให้จริง; `handleUsePotion()` BANISH/LOCK ก็ไม่ตรวจ → client ที่แก้ payload หยิบ trait นอกตัวเลือก/นอกคลาสได้
- **แนวทางแก้:** เก็บ `player.currentTraitChoiceIds: Set<string>` ทุกครั้งที่ส่ง `LEVEL_UP_CHOICE`; `handleSelectTrait` reject ถ้า `traitId` ไม่อยู่ใน set (ไม่ reset flag, ปล่อยให้เลือกใหม่); BANISH validate เช่นกัน (LOCK ให้ล็อกได้เฉพาะ id ในตัวเลือก)
- **ไฟล์กระทบ:** `src/server/engine/GameRoom.ts`, `src/server/entities/ServerPlayer.ts` (field ใหม่)
- **หมายเหตุ:** เป็น defense-in-depth คนละชั้นกับ Risk #1 (ยังไม่แก้รอบนี้) — validate ระดับ choice ไม่ใช่ระดับ stat

### FIX-3 (Risk #9 🟡) — Potion double-click ไม่มี lock (สิ้นเปลือง potion)
- **Root cause:** `handleUsePotion()` REROLL/BANISH ไม่กันการยิงซ้อนก่อน state อัปเดต → double-click หัก potion 2 ครั้ง/reroll ซ้อน
- **แนวทางแก้:** guard `player.potionActionPending` (boolean) — set ตอนเริ่ม action ที่ re-trigger choices, clear เมื่อ `triggerLevelUpChoices` ส่ง choice ใหม่เสร็จ; ถ้า pending อยู่ → ignore action ซ้ำ
- **ไฟล์กระทบ:** `src/server/engine/GameRoom.ts`, `src/server/entities/ServerPlayer.ts`

### FIX-4 (Risk #11 🟡) — ServerMonster.update() พิกัดพังเป็น NaN เมื่อ dist=0
- **Root cause:** caller default `targetX/Y = monster.x/y` เมื่อไม่มี alive player ([GameRoom.ts:604](../src/server/engine/GameRoom.ts)); ถ้า target ทับตำแหน่ง mob → `dist=0` → `dx/dist = NaN` → `monster.x -= NaN` พังถาวร ([ServerMonster.ts:108](../src/server/entities/ServerMonster.ts))
- **แนวทางแก้:** ใน `update()` ถ้า `dist < 1e-6` → skip movement (return เร็ว/ข้ามบล็อกเดิน) ป้องกันหาร 0 ทุก branch (ranged + melee)
- **ไฟล์กระทบ:** `src/server/entities/ServerMonster.ts`

### FIX-5 (Risk #12 🟢) — rarity `'magic'` → `undefined` เงียบ
- **Root cause:** `GearRarity` มี `'magic'` แต่ไม่มีไอเทม → `getRandomGearOfRarity('magic')` คืน `undefined` เงียบ
- **แนวทางแก้ (เลือกทางที่กระทบน้อย):** ให้ `getRandomGearOfRarity()` fallback ไป `'common'` เมื่อ tier ว่าง + `console.warn` แทนคืน `undefined` (กัน crash อนาคต) — **ไม่**ลบ type `'magic'` (อาจมีที่อื่นอ้าง)
- **ไฟล์กระทบ:** `src/shared/gearData.ts`

### DOC-1 (Risk #5) — เอกสารล้าสมัย: `COOP_HP_SCALE_PER_PLAYER` ถูกใช้จริงแล้ว
- แก้ `GAME_WIKI.md` §3.7 + §6 ข้อ 5 เป็น "⚠️ Correction (2026-09-11): ใช้จริงแล้วที่ `GameRoom.ts:582`" (ตามข้อ 3.4 Document Sync Policy — ไม่ลบเงียบ)

### DOC-2 (Risk #7) — เอกสาร overstate: Superconduct ไม่ recurse จริง
- Chain เรียก `damageMonster(cm, dmg, false)` ไม่ส่ง `sourceElement` → reaction block (`if (element)`) ไม่ทำงาน → ไม่ recurse; แก้ `GAME_WIKI.md` §5.6 + §6 ข้อ 7 เป็น "⚠️ Correction: guarded โดยไม่ส่ง element param ตอน chain"

## Test plan
- **Unit (vitest, ต่อยอด `GameRoom.test.ts` ที่มีอยู่):**
  - FIX-1: player ที่ maxed ทุก trait → `triggerLevelUpChoices` ไม่ส่ง `LEVEL_UP_CHOICE`, ส่ง `LEVEL_UP_SKIPPED`, `isChoosingTrait=false`, `isPaused=false`; co-op: อีกคนไม่ถูกกระทบ; BANISH ใบสุดท้าย → skip ปิด modal
  - FIX-2: `handleSelectTrait` ด้วย traitId นอก choices → ไม่ apply, flag ยังค้างเลือกได้; BANISH id นอกตัวเลือก → ไม่หัก potion
  - FIX-3: เรียก REROLL 2 ครั้งติดก่อน choice ใหม่ → potion หัก 1 ครั้ง
  - FIX-4: `new ServerMonster(...).update(dt, m.x, m.y)` (target=ตำแหน่งตัวเอง) → x/y ไม่เป็น NaN
  - FIX-5: `getRandomGearOfRarity('magic')` → ไม่ `undefined`
- **Build/type check:** `npm run build` (tsc) ผ่าน
- **รัน:** `npx vitest run` ผ่านทั้งชุด (รวม regression เดิม)

## Risk / edge case ที่เฝ้าระวัง
- FIX-1: ต้องมั่นใจ `finishLevelUpChoice` refactor ไม่เปลี่ยน behavior เดิมของ catch-up/pending queue (มี test เดิมคุมอยู่แล้ว 6 เคส — ต้องยังเขียว)
- FIX-2: ต้อง set `currentTraitChoiceIds` ทุก path ที่ส่ง choices (initial + reroll + banish) ไม่งั้น valid pick อาจถูก reject ผิด
- FIX-3: lock ต้อง clear ทุก exit path ของ `triggerLevelUpChoices` (รวม path skip ของ FIX-1) กัน deadlock potion
- ทุก FIX เป็น **server-authoritative** เพิ่มขึ้น — ปลอดภัยขึ้น ไม่ลดความสามารถผู้เล่นปกติ

## จุดตัดสินใจที่ขออนุมัติ
1. **FIX-1 consolation:** heal 25% maxHp ตอน skip (กัน level-up สูญเปล่า) — เอา / ไม่เอา (skip เฉยๆ)?
2. **FIX-2 ขอบเขต:** validate เฉพาะ "อยู่ใน choices ปัจจุบัน" (แนะนำ) พอไหม หรือให้ตรวจคลาส/rank ซ้ำด้วย?

## หลัง merge (ตามข้อ 0.6 + ข้อ 5)
- อัปเดต `GAME_WIKI.md` (§ risk + Change Log + Top Risks), `GAME_BLUEPRINT.md` (Refactor Roadmap ทำเครื่องหมายเสร็จ)
- archive spec นี้ → `docs/archive/2026-09-11-round1-functional-bugfixes.md`
- สร้าง Patch Note (ผู้เล่น) + Developer Update (dev)
