# SPEC — Card List Documentation (`docs/card-list.md`)

> สถานะ: **เสร็จสมบูรณ์** (2026-09-12) | วันที่ร่าง: 2026-09-12 | ประเภท: documentation-only (+ ค้นพบ stability risk ใหม่ ไม่ได้แก้โค้ด)
> การตัดสินใจที่อนุมัติ (ผ่าน AskUserQuestion กลางบทสนทนา แทนไฟล์ spec แยกก่อนเริ่ม — เก็บ archive ย้อนหลังตาม policy):
> 1. คอลัมน์ "Type" = map จาก `targetClass` field จริง + ต่อท้าย `[Signature]`/`[Evolution]` ถ้า flag ตรงจริงใน source
> 2. ตัดคอลัมน์ "Cooldown" ออกทั้งตาราง (ไม่มี field นี้ในระดับการ์ดใน `TraitOption`)
> 3. `docs/card-list.md` เป็น quick-reference คนละ scope จาก `docs/APPENDIX_TRAITPOOL.md` ที่มีอยู่แล้ว (ไม่ใช่การซ้ำซ้อนที่ต้องรวมไฟล์)

## สรุปผลการทำงานจริง (post-mortem)

**คำขอเริ่มต้น**: user ขอสำรวจ repo หา source ของระบบ "การ์ด" แล้วสร้าง `card-list.md` พร้อมตาราง
(ชื่อ/rarity/type/เอฟเฟค/scaling/cooldown) — สำรวจแล้วพบว่าระบบ "การ์ด" ของเกมนี้คือ Level-Up Trait
System (`TRAIT_POOL` ใน `src/shared/classes.ts:647-1855`, 70 ใบ) ไม่ใช่ card-game แยกต่างหาก และ
`docs/APPENDIX_TRAITPOOL.md` มีข้อมูลชุดเดียวกันอยู่แล้วแบบ deep-dive — ถามยืนยัน 3 จุดที่ field ที่ user
ขอไม่ตรงกับ data model จริง (Type, Cooldown, ความซ้ำซ้อนกับ appendix) ก่อนเขียนไฟล์ ตาม Working Process
ข้อ 0.1/0.4

**รอบ 2 (feedback)**: user ถามกลับว่าทำไมต้องมี Cooldown/Type — เป้าหมายจริงคือเอาไป **วิเคราะห์/ปรับ
balance การ์ด** ไม่ใช่แค่ดูเฉยๆ สรุปคือ Type/Rarity ยังจำเป็น (วิเคราะห์ balance มักทำแยกตาม
class/rarity) มีแค่ Cooldown ที่ตัดออกถูกแล้วเพราะไม่มีจริงในโค้ด — ไม่ต้องแก้โครงสร้างไฟล์เพิ่ม

**รอบ 3 (ไล่หา root cause ตามคำสั่ง "ไล่หาต่อ")**: ระหว่างสร้างตาราง พบว่า 5 ใบมี `description`
(ภาษาอังกฤษใน source) ไม่ตรงกับสิ่งที่ `apply()`/โค้ดจริงทำ — ไล่ grep หาทุกจุดที่ field ถูกอ่านจริงใน
`GameRoom.ts`/`ServerPlayer.ts` (ไม่ใช่แค่เดาว่าอยู่ที่อื่น) แล้ว spot-check ยืนยันเองอีกชั้นด้วยการอ่าน
source โดยตรง (ไม่เชื่อ subagent เพียงอย่างเดียว) — สรุปแยกเป็น 3 กลุ่ม:
- **Dead mechanic** (บอกไว้ใน description แต่โค้ดไม่มีเลย): Soul Siphon Attunement (+15% EXP),
  Golden Fortune Aura (+35% coin drop), Quick Draw Fanning (ลด cooldown 15%)
- **ตัวเลขผิด**: Armor Piercing 5.56mm (description บอก +2 pierce, โค้ดจริงให้ +1 ต่อ rank)
- **ผูก field ผิด**: Royal Flush Razor (ตัวเลข +2 การ์ดถูกแล้ว แต่ขับเคลื่อนด้วย boolean `fortuneCards`
  ไม่ใช่ `fortuneCardsRank` ที่การ์ดโชว์เป็น rank-up ได้ — เก็บซ้ำ rank 2-3 ไม่มีผลอะไรเพิ่ม)

**ไฟล์ที่แก้ทั้งหมด**: `docs/card-list.md` (ใหม่), `docs/GAME_WIKI.md` (Change Log +1 แถว, §4.7 เพิ่ม
bullet risk ใหม่, §6 Top Stability Risks เพิ่ม item #27)

**ไม่มีโค้ดถูกแก้ในรอบนี้** — เป็นงาน documentation-only ล้วน จึงไม่ต้อง commit+deploy ก่อนแล้วค่อยทำ
Patch Note/Dev Update (ข้ามได้ตามหลักการ: ไม่มี user-facing change ให้ patch note)

## Source of truth ที่ใช้อ้างอิง

- `src/shared/classes.ts:647-1855` — `export const TRAIT_POOL: TraitOption[]` (70 รายการ, นับด้วย
  `grep -c "id:"` ตรงจากไฟล์)
- `src/shared/types.ts:246` — `interface TraitOption` (ยืนยันว่าไม่มี field cooldown)
- `src/server/engine/GameRoom.ts:3282` — จุดที่ server ใช้ `TRAIT_POOL` จริงตอน level-up
- `src/server/engine/GameRoom.ts:1935,2003,2069,2209,2713-2718` — จุดอ่านค่า rank/flag จริงของ
  5 การ์ดที่มีปัญหา (ยืนยันด้วย `sed -n` อ่านตรงจากไฟล์อีกรอบ ไม่ใช่เชื่อผลจาก subagent อย่างเดียว)
- `src/server/entities/ServerPlayer.ts:125-126,256-262,347-349` — ระบบ EXP multiplier (มาจาก
  skill-tree passive คนละระบบ) และระบบ attack cooldown จริง

## Open item — ยังไม่ตัดสินใจ (ส่งต่อให้ user)

5 การ์ดที่ description ไม่ตรงโค้ด (`docs/GAME_WIKI.md` §4.7 risk #27, รายละเอียดเต็มใน
`docs/card-list.md`) ยังไม่ได้แก้อะไร เพราะเป็น **design decision** ไม่ใช่ bug ที่ชัดเจนว่าอันไหนถูก:
แก้ description ให้ตรงโค้ด (ยอมรับ mechanic ปัจจุบัน) หรือแก้โค้ดให้ตรง description เดิม (เปลี่ยน
gameplay balance จริง) — ถ้า user ตัดสินใจแนวทางแล้วต้องเปิด spec ใหม่แยกเป็นงาน "bug fix / balance
change" ตาม Working Process ข้อ 0 (คนละประเภทงานกับ documentation-only รอบนี้)
