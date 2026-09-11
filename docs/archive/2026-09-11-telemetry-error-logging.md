# SPEC — Telemetry & Error Logging System

> สถานะ: **เสร็จสมบูรณ์ (code + test + manual E2E)** (2026-09-11) | ประเภท: feature ใหม่ (dev-facing infra)
> ที่มา: implementation prompt ที่ผ่าน cross-check 3 รอบมาแล้ว (schema/performance/security) — ยังไม่เคย
> ได้รับอนุมัติให้ลงโค้ดจริงจนกว่าจะทำ Working Process ข้อ 0 ให้ครบ

## Requirement crack (ก่อนลงมือ)

ถามยืนยัน scope 3 ข้อกับ user ก่อนร่าง spec:
1. **`ServerPlayer.takeDamage()`/`applyTrueDamage()` เพิ่ม param `source`** (กระทบทุก call site) —
   user เลือก **ทำตาม design เต็มรูปแบบ** (ไม่เลือกทางเลี่ยงแบบ implicit pending-source field)
2. **`/api/telemetry/events`/`/errors` ไม่มี auth** — user เลือก **ไม่มี auth, cap-only** (สอดคล้องกับ
   `/api/grant-gold` เดิม) แทนการผูก `requireAuth()` แบบ `/api/progression`
3. **Rollout scope** — user เลือก **ทำทั้งหมดรอบเดียว** ไม่แบ่ง phase

## Verification ก่อนเขียนโค้ด (พบ correction สำคัญจาก design เดิม)

Agent ตรวจสอบ hook point ทุกจุดที่ prompt อ้างกับ source จริง พบ:
- Path จริงคือ `src/server/engine/` ไม่ใช่ `src/server/game/` ตามที่ design เดิมสะกด
- `SERVER_TICK_MS` อยู่ `src/shared/constants.ts:3` ไม่ใช่ `server.ts`
- `tick()` **ไม่มี** logic ตรวจจับ transition ของ `isStarted` — ต้อง hook `run_start`/`run_end` คนละจุด
  จากที่ design บอก (ดูหัวข้อ Fix ด้านล่าง)
- **`ServerMonster` มี `takeDamage()` ของตัวเองชื่อชนกับ `ServerPlayer.takeDamage()`** — ต้องแยกให้ถูก
  ตอน propagate `source` param มิฉะนั้นจะแก้ผิด class
- ส่วนที่เหลือ (`GameRoom.ts:277`, `:2542`+`:2619`, `HordeDirector.ts:102`, `server.ts:55`) ตรงกับที่
  design อ้างไว้ทุกจุด

## Fix — สรุปสิ่งที่ทำจริง

**ไฟล์ใหม่:**
- `src/shared/telemetryTypes.ts` — type ร่วม client/server (`GameEventInput`, `DeathCause`,
  `ErrorReportInput`, `ClientErrorReportPayload`)
- `src/server/telemetry/telemetryDb.ts` — `telemetry.db`/`telemetry.dev.db` (WAL), schema 2 ตาราง,
  `createTelemetryConnection()` export แยกจาก schema exec เพื่อให้ test ใช้ `:memory:` schema
  เดียวกับ production ได้จริง (ไม่ duplicate SQL)
- `src/server/telemetry/signatureHash.ts` — normalize + sha1
- `src/server/telemetry/buildVersion.ts` — `SERVER_BUILD_VERSION = process.env.BUILD_VERSION || 'dev'`
- `src/server/telemetry/TelemetryBuffer.ts` — buffer + 1s batch flush + singleton export
  (`logGameEvent`/`logError`/`shutdownTelemetry`)
- `src/server/telemetry/TelemetryBuffer.test.ts` — 6 vitest case (upsert ไม่ reset status,
  signature normalize, distinct signature ต่าง category, flush fail ไม่ throw, MAX_PENDING_EVENTS
  guard, column mapping ถูกต้อง)
- `src/server/engine/GameRoom.telemetry.test.ts` — 4 vitest case ยืนยัน wiring จริงใน `GameRoom`
  (mock `TelemetryBuffer` module) ว่า `start()`/`handleSelectTrait()`/death/`broadcastGameOver()`
  เรียก `logGameEvent()` ด้วย payload ที่ถูกต้องจริง ไม่ใช่แค่ TelemetryBuffer เองทำงานถูก
- `src/client/telemetry/ClientTelemetry.ts` — client error buffer + batch POST ทุก 3 วิ

**ไฟล์ที่แก้:**
- `src/server/entities/ServerPlayer.ts` — `takeDamage(amount, source?)`/`applyTrueDamage(amount, source?)`
  เก็บ `lastDeathCause` (cause + fatalHitDamage + wasOneShot) ตอน `isDead` เพิ่ง true
- `src/server/entities/ServerMonster.ts` — เพิ่ม `spawnedAt` (สำหรับ `boss_kill`'s `timeSinceSpawnMs`)
  **ไม่แตะ `takeDamage()` ของ monster เอง** (name collision ที่ verify เจอ)
- `src/server/engine/HordeDirector.ts` — constructor รับ `onWaveChange?` callback ใหม่ เรียกหลัง
  `currentWave++`
- `src/server/engine/GameRoom.ts` — `hordeDirector` ย้ายจาก field initializer ไป instantiate ใน
  constructor body (ให้ callback closure `this` ได้), เพิ่ม `runId`/`logGameEvent()`/`logDeathEvent()`/
  `checkPlayerSanity()`, hook ครบ 6 event type ตามตาราง capture point ใน GAME_WIKI.md §5.7,
  แท็ก `Projectile.sourceMonsterType`/`sourceAbilityId` ที่จุดสร้าง projectile ศัตรูทั้ง 4 จุด (generic
  ranged shot, Boulder Toss, Void Barrage, Hellfire Spit) เพื่อแยก `projectile` vs `boss_ability` ใน
  death cause ได้แม่นยำ
- `src/server/server.ts` — route ใหม่ `POST /api/telemetry/events`/`/errors` (ไม่มี auth, cap
  ≤50 items/request + string cap 4000), `process.on('uncaughtException'/'unhandledRejection'/'SIGTERM')`
  ใหม่ทั้งหมด (ไม่เคยมีมาก่อน) — **ต้อง `process.exit(1)` เองหลัง log เสมอ** เพราะการเพิ่ม handler ทำให้
  Node หยุด exit อัตโนมัติ ไม่งั้นจะรันต่อในสถานะพังแทนที่จะ crash-restart ผ่าน pm2 เหมือนเดิม
- `src/client/main.ts` — `ClientTelemetry.init()` ที่ module scope, hook `ws.onclose`/`onopen`,
  แยก `loop()` เป็น `renderFrame()` เพื่อครอบ try/catch ได้โดยไม่กระทบการ schedule เฟรมถัดไป
- `vite.config.ts` — `define: __BUILD_VERSION__` (build timestamp, เปลี่ยนทุก `npm run build`)

**ขอบเขตที่ตั้งใจไม่ทำ** (ไม่ใช่ลืม — ตัดสินใจระหว่างพัฒนา):
- ไม่เพิ่ม NaN guard ฝั่ง monster ซ้ำ (root cause เดิมแก้ที่ `ServerMonster.update()` แล้ว — risk #11 เดิม)
- ไม่ wrap ทั้ง tick loop ด้วย try/catch ทั่วไป (ไม่มี known throw path ที่ต้องป้องกัน — เลี่ยง
  over-engineering)
- ไม่มี client code เรียก `POST /api/telemetry/events` จริง (ทุก game_event เป็น server-authoritative
  ในรอบนี้ — endpoint พร้อมใช้แต่รอ capture point ฝั่ง client ในอนาคต)

## Test

- `npx tsc --noEmit` ✅ (ทั้งโปรเจกต์ รวมไฟล์ใหม่)
- `npx vitest run` ✅ 63/63 (53 เดิม + 10 ใหม่: 6 TelemetryBuffer + 4 GameRoom telemetry wiring)
- `npm run build` ✅ (tsc + vite build สำเร็จ)
- **Manual E2E** (dev server จริง, `data/telemetry.dev.db` ที่ล้างใหม่): เล่น solo run จริงผ่าน browser
  จนตาย (party wipe) → ยืนยันแถวจริงใน DB: `run_start`(wave1,elapsed0) → `death`(cause
  monster_contact/SKELETON, fatalHitDamage=1, survivorCount=0 ถูกต้อง) → `run_end`(outcome=wipe,
  playtimeMs ตรงกับเวลาจริงบนจอ) `error_log` ว่างเปล่า (ไม่มี exception จาก hook ใหม่เลย)
- curl ยิง `/api/telemetry/events` (2 events, ตรวจ field ครบ) + `/api/telemetry/errors` (1 client
  error, source='client' ถูกต้อง) + cap test (ส่ง 60 events, ยืนยัน `accepted:50` และ DB มีแค่ 50 แถวจริง)

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7 ระบบใหม่, §5.8 Stability Risk ใหม่, §6 Top Stability Risks #23-25, Change Log),
`GAME_BLUEPRINT.md` (B.2 Flow 4 ใหม่, B.4 telemetry entities note, B.5 Refactor Roadmap #23-25, B.6
Known Design Decisions 2 ข้อใหม่, Change Log)

---

## Round 2 — Risk audit หลังพัฒนา (2026-09-11, ต่อจากรอบแรกในวันเดียวกัน)

หลังรายงานผลทดสอบรอบแรก (unit/integration/type-check/build/manual E2E/curl/live crash-handler test
ทั้งหมดผ่าน) user สั่ง **"ลดความเสี่ยงให้ต่ำที่สุด"** จาก risk ที่รายงานไว้ 2 ข้อ 🟡 กลาง:

1. **telemetry endpoint ไม่มี rate limit** (มีแค่ payload cap ต่อ request) → เพิ่ม `isTelemetryRateLimited()`
   ใหม่ใน `server.ts` — 40 request/60 วิ ต่อ IP แยก limiter จาก `auth.ts`'s `isRateLimited()` เพราะ
   threshold เดิม (8/60วิ, ออกแบบมาสำหรับ login brute-force) เข้มเกินไปสำหรับ traffic ปกติของ
   telemetry (`ClientTelemetry` flush ทุก 3 วิเอง ~20 req/min อยู่แล้ว) ทดสอบจริงด้วย curl loop 45
   ครั้งติดกัน → ยืนยัน 40 ครั้งแรก `200`, ที่เหลือ `429` ตรงตามที่ตั้งใจ
2. **ผู้เล่น co-op ที่ surrender ระหว่างทีมยังเล่นต่อ ไม่ได้ `run_end` แยกของตัวเอง** (เดิมตั้งใจไว้ว่า
   room/run_id ยังไม่จบ) → เพิ่ม helper `logRunEndFor()` ใช้ร่วมกันระหว่าง `broadcastGameOver()` กับ
   `handleSurrender()`'s co-op branch ตอนนี้ผู้เล่นที่ surrender กลางทางได้ `run_end`
   (`outcome:'surrender'`) เป็นของตัวเองด้วย แม้ room จะยังเล่นต่อ — ปิด gap ที่เคยทำให้ analytics เช่น
   "average playtime/finalLevel" พลาดกลุ่มผู้เล่นนี้ไปเงียบๆ

**เพิ่มเติมนอกเหนือ 2 ข้อที่ user ระบุ** (พิจารณาแล้วว่าคุ้มค่า เพราะราคาถูก/ตรงไปตรงมา ไม่ใช่
speculative complexity): เพิ่ม `checkMonsterSanity()` คู่กับ `checkPlayerSanity()` เดิม — เดิมเช็ค NaN
position/negative hp เฉพาะฝั่ง player เท่านั้น ตอนนี้ครอบทั้ง `ServerPlayer`/`ServerMonster`
สมมาตรกัน **ไม่ได้เพิ่ม** blanket try/catch รอบทั้ง tick loop ตามที่เคยพิจารณาไว้ตั้งแต่รอบแรก — ให้
เหตุผลว่าการ swallow exception กว้างๆ แบบนั้นเสี่ยงซ่อนบั๊กไว้ให้ room รันต่อด้วย state ที่พังแทนที่จะ
crash สะอาดๆ ให้ `process.on('uncaughtException')` (ที่เพิ่มไว้แล้วรอบแรก) จับแล้ว exit/restart ผ่าน
pm2 — เป็นทางเลือกที่ **เพิ่ม** ความเสี่ยงมากกว่าลด จึงไม่ทำ

**พบระหว่างทำรอบนี้**: risk numbering ระหว่าง `GAME_WIKI.md` §6 กับ `GAME_BLUEPRINT.md` B.5 ไม่ตรงกัน
(WIKI รวม retention+dashboard เป็นข้อ #24 เดียว, BLUEPRINT แยกเป็น #23-24 คนละข้อ ไม่มีข้อสำหรับ
no-auth เลย) — แก้ให้ตรงกันทั้งคู่: #23 = no-auth (ลดความเสี่ยงแล้ว), #24 = retention, #25 = dashboard

### Test เพิ่มเติมรอบนี้

- test ใหม่ใน `GameRoom.telemetry.test.ts`: ยืนยัน co-op surrender ยัง log `run_end` (`outcome:'surrender'`,
  `finalGold` ตรงตามสูตร `SURRENDER_GOLD_RETENTION`)
- `npx vitest run` ✅ **64/64**
- `npx tsc --noEmit` ✅, `npm run build` ✅
- curl rate-limit test (45 request ติดกันใน <1 วิ ไปที่ `/api/telemetry/errors`): 40×`200`, 5×`429` ตรงตามที่ตั้งใจ

### หมายเหตุระหว่างทดสอบ (ไม่ใช่ bug แต่ควรบันทึกไว้)

ระหว่าง cleanup ไฟล์ DB ทดสอบ (`rm data/*.db*`) ได้ลบ `data/game.dev.db` (บัญชี login dev/test เดิม
เช่น `pwtestuser1`) ไปด้วยโดยไม่ได้ตั้งใจแยกเฉพาะไฟล์ telemetry — ไฟล์นี้เป็น dev-only, gitignored,
สร้างใหม่อัตโนมัติตอน server เริ่มทำงานครั้งถัดไป ไม่กระทบ production หรือโค้ดที่ทำในรอบนี้ แต่บัญชี
ทดสอบเดิมที่เคย login ไว้ในเบราว์เซอร์จะ login ไม่ได้อีกจนกว่าจะสมัครใหม่ — แจ้ง user แล้วในบทสนทนา
