# SPEC — IMP Hitbox Fix (พบและแก้เสร็จในรอบเดียว)

> สถานะ: **เสร็จสมบูรณ์** (2026-09-11) | ประเภท: balance/bug fix (visual-vs-hitbox mismatch)
> ที่มา: user report — "มีเพิ่มอีกนิดหน่อย เรื่อง ดาเมจไม่โดนมอนบางครั้ง ตอนนี้เจอแค่ archer ที่ธนูโดนตัวค้างคาวแต่ไม่โดน dmg เลย ไล่เช็คให้หน่อย"

## Requirement crack

"ค้างคาว" (bat) ไม่มี MonsterType ชื่อนี้ตรงๆ — ตรวจ sprite/geometry แล้วยืนยันว่าหมายถึง **IMP**
("Demonic winged gargoyle with horns and bat wings", `InstancedHorde.ts:61`) ซึ่ง `MAGMA_IMP`/
`VOID_WARLOCK` ก็ reuse sprite เดียวกัน แต่ scope ที่ user รายงาน + อนุมัติคือ IMP เท่านั้น

## Root cause (ยืนยันจาก source)

1. **Server collision math ถูกต้อง** — `SpatialGrid.ts:57-58`: `combinedRadius = arrow.radius +
   monster.radius`, เช็ค `dist² <= combinedRadius²` แบบ circle-circle ปกติ ไม่มีบั๊ก logic ใดๆ
2. **แต่ `MONSTER_STATS[IMP].radius` เดิม = 12** (`constants.ts`) — เล็กที่สุดในบรรดามอนสเตอร์ทั้งหมด
   (Skeleton 16, Zombie 20, Hellhound 22, Magma Imp 14, Void Warlock 18) รวมกับ Archer arrow
   (`radius: 10`, `GameRoom.ts:1640`) ได้ combined hit radius แค่ **22px** — เล็กที่สุดในเกม
3. **Sprite วาดขนาดคงที่ไม่ผูกกับ radius** — `HordeSpriteRenderer.ts:145`:
   `ctx.drawImage(frame.canvas, -32, -56, 64, 64)` วาดทุก ground monster type ที่ 64×64px เท่ากันหมด
   (IMP ไม่มี `scale` พิเศษเหมือน boss/elite) — ไม่มีจุดไหนใน client ที่ scale sprite ตาม
   `monster.radius` เลย (grep ยืนยันแล้ว)

**สรุป:** ภาพ IMP กว้าง ~64px แต่ hit-circle จริงรวมกับธนูมีแค่ ~22px — ผู้เล่นเล็งไปที่ปีก/ขอบ sprite
(นอก hitbox จริง) จึงเห็น "ธนูโดนชัดๆ" แต่ server ตัดสินว่าไม่โดน ถูกต้องตาม hitbox ที่เล็กเกินไปของมัน
ไม่ใช่ดาเมจหายหรือ collision บั๊ก — IMP ความเร็วสูง (180, เร็วอันดับ 2) ยิ่งซ้ำเติมให้เล็งพลาดง่ายขึ้น

## Fix

`src/shared/constants.ts`: `MONSTER_STATS[IMP].radius: 12 → 16` (เท่า SKELETON) — ค่าเดียว ไหลผ่าน
`ServerMonster.radius` อัตโนมัติ (set จาก `MONSTER_STATS` ตอน constructor) เข้าสู่ทุกจุดที่ใช้
(collision hit detection, contact damage trigger `nearestDist < monster.radius + 20`,
prop collision resolution) — ไม่ต้องแก้โค้ด logic ใดๆ เพิ่ม

**Scope ที่ไม่แตะ:** `MAGMA_IMP` (radius 14) และ `VOID_WARLOCK` (radius 18) ไม่ได้เล็กผิดปกติเท่า IMP
เดิม — user อนุมัติ scope เฉพาะ IMP เท่านั้น

## Test

เพิ่ม `src/server/engine/SpatialGrid.impHitbox.test.ts` — ขับเคลื่อนด้วย `SpatialGrid.queryRadius()`
จริง (เมธอดเดียวกับที่ `GameRoom.ts` ใช้จริง) + `ServerMonster(IMP)` จริง + ค่า Archer arrow radius
จริง (10, คัดลอกมาจาก `GameRoom.ts` พร้อม comment อ้างอิง) ไม่ใช่สูตรคำนวณระยะแบบแยกต่างหาก — เทสนี้
จะ**พังจริง**ถ้า revert radius กลับเป็น 12 (ระยะทดสอบ 24px: combined เดิม 22 พลาด, combined ใหม่
26 โดน)

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ 81/81 (78 เดิม + 3 ใหม่)
- `npm run build` ✅

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§3.1 monster table, §3.7 risk ใหม่ #20, §6 Top Stability Risks, Change Log),
`GAME_BLUEPRINT.md` (Refactor Roadmap #20, Change Log)
