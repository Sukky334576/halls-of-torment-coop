# SPEC — Projectile Z-Order Bug (พบและแก้เสร็จในรอบเดียว)

> สถานะ: **เสร็จสมบูรณ์** (2026-09-11) | ประเภท: bug fix (client rendering) | นอกเหนือ 18 ข้อเดิมใน Round 1
> ที่มา: user report — "เช็ค animation ของกระสุนบอสหน่อยเหมือน render ภาพออกมาสั้น แต่ยังโดนดาเมจโดยไม่รู้สาเหตุ" ตามด้วย "ทำไมถึงโดนดาเมจแล้วตายโดยไม่รู้ว่าดาเมจมาจากไหน ตอนลาสบอส ด่าน 2"

## Requirement crack

ถามยืนยันกับ user ว่าตรงกับ Ground Slam (Elite Golem, telegraph-free) หรือกระสุนวิ่งอื่น — user ตอบ
"ไม่แน่ใจ/เจอทั้งสองแบบ" ตรวจสอบเพิ่มพบสาเหตุที่สอง (z-order) ซึ่งอธิบาย "ลาสบอสด่าน 2" ได้ตรงกว่า —
user ยืนยันให้ทำ z-order fix ก่อน (Ground Slam telegraph ยังไม่ทำรอบนี้)

## Root cause (ยืนยันจาก source)

`src/client/main.ts` render pass เดิม:
```
this.vfx.render(this.renderer.ctx, now);              // pickups + กระสุนทุกชนิด
this.hordeRenderer.render(this.latestTick.monsters, now); // ฝูงมอน ← วาดทับกระสุน
this.playerSprites.render(...);
```

Canvas 2D z-order = ลำดับการวาด — กระสุน (รวมกระสุนบอส) ถูกวาด**ก่อน**ฝูงมอนเสมอ ที่ wave ท้ายๆ
(มอนถึง 380+ ตัวตาม GAME_WIKI §5.6) กระสุนที่วิ่งผ่าน/เกิดใกล้ฝูงมอนถูกวาดทับจนมองไม่เห็น ทั้งที่
server (`GameRoom.ts`'s `updateProjectiles`) ยังคำนวณ hit ปกติทุกอย่าง — ผู้เล่นเลยรู้สึกว่า
"โดนดาเมจไม่รู้สาเหตุ"

**ด่าน 2 ลาสบอส (wave 30) = LORD_OF_TORMENT** ซึ่งหนักกว่าบอสอื่นเพราะ:
1. Void Barrage ยิง 5 ลูก (`ENEMY_VOID_ORB`) พร้อมกันเข้าหาผู้เล่น
2. Summon Reinforcements เรียก Hellhound 2 ตัวมาล้อม**ตัวบอสเอง**ทุก 15s — orb ที่ยิงออกจาก
   ตำแหน่งบอสเลยโดนฝูง hellhound บังตั้งแต่เฟรมแรกที่เกิด
3. Contact damage จากบอส+hellhound ซ้อนกันในความโกลาหล แยกไม่ออกว่าตัวไหนตี

**ไม่ใช่สาเหตุ** (ตรวจแล้วตัดออก): deadline execute ที่ 300s มี warning countdown ส่งให้ client
อยู่แล้ว (`bossDeadlineRemaining` in TICK, `HUD.updateDeadlineWarning`) — ไม่ silent

## Fix

แยก `VFX2D.render()` เป็น 2 เมธอด:
- `renderGround(ctx, time)` — dash ghost, shrine, pickup (วาดก่อนฝูงมอนเหมือนเดิม)
- `renderOverlay(ctx, time)` — กระสุน + hit-spark particle (ย้ายไปวาด**หลัง**ฝูงมอน)

`main.ts` เรียกตามลำดับใหม่: `renderGround()` → `hordeRenderer.render()` → `renderOverlay()` →
`playerSprites.render()`

**ผลกระทบ:** แก้ทั้งกระสุนบอสและกระสุนผู้เล่นเอง (บั๊กเดียวกัน ไม่ใช่แค่ฝั่งบอส) — ไม่เปลี่ยน logic
การคำนวณตำแหน่ง/ดาเมจใดๆ เป็น pure rendering z-order change

## Test / Verify

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ 74/74 (ไม่มี test ใหม่ — เป็น pure rendering z-order ไม่มี logic ให้ unit test
  ได้ตามปกติ, ตรวจ ctx.save()/restore() balance ในทั้งสองเมธอดด้วยมือแล้วสมดุล 3/3 ทั้งคู่)
- `npm run build` ✅
- **ไม่ได้ทำ live browser verification**: ต้องรัน WS server + vite dev + login + สร้าง lobby + เล่น
  ถึง wave 30 เพื่อเห็น LORD_OF_TORMENT จริง ซึ่งเกินเวลาที่เหมาะสมสำหรับ commit นี้ — แนะนำให้ user
  ทดสอบจริงในเกมแล้ว feedback กลับมาหากยังเห็นปัญหา

## เอกสารที่อัปเดต

`GAME_WIKI.md` (Change Log, §3.7 risk item ใหม่ #19, §6 Top Stability Risks),
`GAME_BLUEPRINT.md` (Change Log, Refactor Roadmap #19 ใหม่ใน Phase 1)

## Fix B — Ground Slam telegraph (เสร็จแล้ว 2026-09-11 ต่อในรอบเดียวกัน)

User ยืนยันให้ทำต่อทันที (`fix-b ด้วยเลย`) + confirm telegraph duration 0.4 วินาที

**เปลี่ยนจาก:** instant-trigger (ดาเมจลงในทิกเดียวกับที่ cast, มีแค่ visual **หลัง**ดาเมจ 0.45s ที่เป็น
cosmetic ล้วน) — comment เดิมเรียกว่า "telegraph-free แต่ fair"

**เป็น:** 2-phase state machine ใน `ServerMonster`:
- `slamTelegraphTimer`/`slamTelegraphX`/`slamTelegraphY` field ใหม่
- Cast: freeze epicenter ที่ตำแหน่งบอส ณ ตอนนั้น, push `TITAN_QUAKE_TELEGRAPH` (ring กระพริบ
  สีแดง/ส้ม dashed, ไม่ดาเมจ) นาน 0.4s
- Resolve: หลัง 0.4s เช็คระยะผู้เล่น**ปัจจุบัน**เทียบกับ epicenter ที่ freeze ไว้ (ไม่ใช่ตำแหน่งบอส
  ปัจจุบัน) → ดาเมจ ×2.5 ตามเดิม + push `TITAN_QUAKE_WAVE` (impact visual เดิม)

**ผล:** บอสยังเดินไล่ล่าได้ระหว่าง charge (ไม่ได้ freeze การเคลื่อนที่ของบอส) แต่วงระเบิดจริงจะลงที่
จุดที่ cast เท่านั้น — ผู้เล่นที่ขยับหนีออกจากวง warning ทันเวลาจะรอดจริง ไม่ใช่แค่ "เห็น warning
เฉยๆ แต่หนีไม่ได้"

**Edge case ที่ verify แล้ว:** ถ้าบอสตายระหว่าง telegraph (`monster.isDead`) — caller (`tick()`)
skip `updateBossAbilities()` ทั้งบล็อกด้วย `if (monster.isDead) continue;` ที่มีอยู่แล้ว ดังนั้น
telegraph จะไม่ resolve และไม่มี ghost damage — ปลอดภัยโดยไม่ต้องแก้เพิ่ม

**Test:** เพิ่ม 4 เคสใน `GameRoom.test.ts` describe "GameRoom Ground Slam telegraph" — ไม่ดาเมจตอน
cast, ดาเมจหลัง 0.4s เท่านั้น, epicenter freeze (บอสเดินหนีไม่กระทบ), หลบออกจากวงได้จริง
(พบและแก้บั๊กเทส accessory ระหว่างทำ: `addTestPlayer()` ให้ spawn protection 2s เป็นค่าเริ่มต้น
ทำให้ `takeDamage()` no-op เงียบๆ — เพิ่ม `clearSpawnProtection()` helper)

**เอกสารที่อัปเดตเพิ่ม:** `GAME_WIKI.md` §3.3 Boss Abilities table (correction บรรทัด Ground Slam)

**ไฟล์ที่แก้:** `types.ts` (enum `TITAN_QUAKE_TELEGRAPH`), `ServerMonster.ts` (field ใหม่),
`GameRoom.ts` (state machine), `VFX2D.ts` (telegraph visual), `GameRoom.test.ts` (4 test ใหม่)

## กฎใหม่ที่เพิ่มระหว่างทำงานนี้ (บันทึกใน CLAUDE.md แล้ว)

User สั่งเพิ่ม: Patch Note + Developer Update ให้สร้าง**หลัง commit + deploy สำเร็จเท่านั้น** ไม่ใช่
ทันทีที่ archive spec เสร็จเหมือนเดิม — อัปเดต `CLAUDE.md` ข้อ 0 (เพิ่มข้อ 0.7) และข้อ 5 แล้ว
