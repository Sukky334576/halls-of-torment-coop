# SPEC — Ground Slam Telegraph Duration Increase

> สถานะ: **เสร็จสมบูรณ์** (2026-09-14) | ประเภท: balance tweak (single constant)
> ที่มา: user report ขณะกำลังเล่นอยู่ ("แก้วงแดงก่อนที่บอสจะออก skill หน่อย ให้มีหน่วงซัก 1.5 วินาที")

## Requirement crack

"วงแดง" ไม่ระบุบอสตัวไหน — ไล่ดู `updateBossAbilities()` (`GameRoom.ts:2377`) พบว่ามีแค่ **Ground
Slam ของ ELITE_GOLEM** เท่านั้นที่มี warning ring สีแดงจริง (`TITAN_QUAKE_TELEGRAPH`, rendered เป็น
`rgba(220,38,38,...)` ที่ `VFX2D.ts:1141`) บอสอื่น (LORD_OF_TORMENT, HELLHOUND) ยิง projectile
ทันทีไม่มีวงเตือนเลย ยืนยันกับ user ก่อนแก้ (ไม่เดา) — ตรงตามที่คิด และต้องการเปลี่ยนจาก 0.4s (ค่าเดิม
ตั้งแต่ `docs/archive/2026-09-11-projectile-zorder-fix.md`) เป็น **1.5s** ตรงๆ ตามตัวเลขที่ user ระบุ

## การแก้

`SLAM_TELEGRAPH_DURATION` (`GameRoom.ts`, ภายใน `updateBossAbilities()`'s ELITE_GOLEM branch):
`0.4` → `1.5` — ค่าคงที่ตัวเดียว ไหลเข้าทั้ง server-side countdown (`slamTelegraphTimer`) และ
client-side visual `lifeTime` ของ `TITAN_QUAKE_TELEGRAPH` projectile อัตโนมัติ ไม่ต้องแก้จุดอื่น

**ไม่แตะ**: `SLAM_COOLDOWN` (7s), `SLAM_RADIUS` (180px), ดาเมจ ×2.5 — เป็นแค่การขยายเวลาเตือนเฉยๆ
ตามที่ user ขอ ไม่ใช่การ nerf/buff ท่า

อัปเดต comment ที่ `GameRoom.ts:2382` (เดิมระบุ "0.4s" ตรงๆ ในคอมเมนต์ ตอนนี้ตัดตัวเลขออกไปอ้างอิง
ตัวแปรแทน กัน comment ล้าสมัยซ้ำรอยเดิม) และ `VFX2D.ts`'s comment (เดิมพูดถึง "~0.4s window" ตรงๆ)

## Test

- `src/server/engine/GameRoom.test.ts`'s "GameRoom Ground Slam telegraph" describe block —
  อัปเดต `dt` ที่ป้อนให้ 3 test case เดิม (เคยรวมกัน 0.4s พอดี ตอนนี้ต้องรวมกัน 1.5s พอดี) ไม่ได้เพิ่ม
  test ใหม่เพราะ behavior/logic ไม่เปลี่ยน แค่ตัวเลข threshold — test เดิมครอบคลุมพฤติกรรมสำคัญอยู่
  แล้ว (ไม่ดาเมจก่อนหมดเวลา, ดาเมจพอดีตอนหมดเวลา, epicenter แช่แข็งตอน cast, หลบออกนอกวงได้จริง)
- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ **95/95**

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§3.3 ตาราง boss ability, Change Log), `GAME_BLUEPRINT.md` (Change Log)
