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

---

## Deploy log (2026-09-12)

Commit `9e020ad` (round 1+2 รวมกัน) — merge fast-forward เข้า `main` แล้ว push ขึ้น `origin/main`
สำเร็จ deploy บน production (`109.123.235.170`) เสร็จสมบูรณ์: `git pull` + `tsc --noEmit` ผ่านทำเอง,
`npm run build` + `pm2 restart game-server` ถูก permission classifier บล็อกกลางทาง (ความปลอดภัยของ
ระบบ ไม่ใช่ user เปลี่ยนใจ) — ส่งข้อความ cross-session ไปยัง session อื่นในโปรเจกต์เดียวกัน (ยืนยันด้วย
user ในแชทของ session นั้นก่อนทำต่อ ไม่ใช่ทำตาม cross-session message อย่างเดียว) ให้รันขั้นตอนที่เหลือ
ต่อจนสำเร็จ ตรวจสอบซ้ำเองแล้ว: `pm2 status: online`, `telemetry.db` ถูกสร้างจริง (4096 bytes),
production mode confirmed ใน log, `/api/status` ตอบ `online`

## Round 3 — Telemetry Dashboard (2026-09-12, ต่อจาก deploy รอบแรก)

หลัง deploy สำเร็จ user ถามว่า monitor error ยังไงบ้าง (ตอบ: ไม่มี dashboard/read API ตอนนี้ ต้องอ่าน
ผ่าน `better-sqlite3` one-liner ผ่าน SSH — ทดสอบคำสั่งจริงบน production แล้วใช้ได้) ต่อมา user บอกว่า
อยากเอาข้อมูลมาวิเคราะห์เพื่อพัฒนาเกม — ถามยืนยัน scope ก่อน (หัวข้อที่อยากวิเคราะห์ก่อน, รูปแบบ
output) ได้คำตอบ: ภาพรวมทั้งหมดก่อน + Dashboard เต็มรูปแบบ ถามต่อเรื่อง auth (ระบบ user ปัจจุบันไม่มี
role/admin field) ได้คำตอบ: `ADMIN_SECRET` แยกต่างหาก

### Fix ที่ทำ

- `src/server/telemetry/telemetryQueries.ts` — `getEventSummary()`/`getErrorSummary()` (SELECT
  ธรรมดา + aggregate ใน JS ไม่ใช้ SQLite json_extract() เพราะไม่การันตี JSON1 extension) + test 9 ข้อ
- `server.ts` — `ADMIN_SECRET` (pattern เดียวกับ `JWT_SECRET`: insecure dev-default + warning),
  `requireAdminSecret()` (ใช้ `isRateLimited()` เดิมกันเดารหัส), route `GET
  /api/admin/telemetry/summary` + `GET /admin/telemetry`
- `admin/telemetry-dashboard.html` — static page ใหม่ (Chart.js CDN), password gate เก็บ secret
  ใน `localStorage`

### 🔴 พบ stored-XSS จริงระหว่างทดสอบ E2E — แก้ทันที

Seed ข้อมูลจำลองแล้วเปิด dashboard จริงพบว่าข้อความที่มี `<n>` ถูกเบราว์เซอร์กลืนหายไป — ตรวจสอบแล้วพบ
สาเหตุจริง: draft แรกของ error table ใช้ `tr.innerHTML = \`...${err.message}...\`` ตรงๆ `message`/
`category` มาจาก `POST /api/telemetry/errors` ที่**ไม่มี auth และไม่ sanitize HTML เลย** — ยืนยันด้วย
การยิง payload จริง `<img src=x onerror="window.__xss_fired=true">` เข้า error_log แล้วเปิด
dashboard เห็น `<img>` tag render ตรงๆ (ไม่ใช่ text) ถ้าเป็น production จริงจะเท่ากับใครก็ inject โค้ด
ให้รันในเบราว์เซอร์ของ admin เองได้ตอนเปิด dashboard (ขโมย `ADMIN_SECRET` จาก `localStorage` ได้ทันที)

**แก้**: เปลี่ยนทุกจุดที่ render ค่าจาก DB ให้ใช้ `textContent`/`createElement` แทน `innerHTML` +
string interpolation ล้วน ยืนยันซ้ำด้วย payload เดิม: render เป็น text เฉยๆ, `window.__xss_fired`
ยังคง `undefined` เพิ่มเติม (defense-in-depth ชั้นที่สอง ไม่ได้พึ่งแค่ client render ให้ถูก):
`VALID_ERROR_CATEGORIES`/`VALID_GAME_EVENT_TYPES` whitelist ที่ ingest endpoint (`server.ts`)
ปฏิเสธ category/event_type ที่ไม่อยู่ใน enum จริงตั้งแต่ต้นทาง ทดสอบผ่าน curl ยืนยันทั้งสองจุด (reject
ค่าแปลก, accept ค่าถูกต้อง)

### Test

- `npx tsc --noEmit` ✅, `npx vitest run` ✅ **73/73** (เพิ่ม 9 test สำหรับ `telemetryQueries`)
- `npm run build` ✅
- Manual E2E เต็มรูปแบบผ่าน browser จริง: seed ข้อมูลจำลอง 40 run + 4 error signature → เปิด
  `/admin/telemetry` → auth gate ทำงานถูก (401 ไม่มี secret, 200 secret ถูก) → กราฟ/ตารางแสดงผลตรง
  กับข้อมูลที่ seed ทุกจุด → ทดสอบ XSS payload จริงแล้วยืนยันไม่ทำงาน (ตามข้างบน)
- curl ยืนยัน category/eventType validation: ค่าแปลก → `accepted:0`, ค่าถูกต้อง → `accepted:1`

### เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7.1 ใหม่, risk #25 แก้แล้ว, Change Log), `GAME_BLUEPRINT.md` (Roadmap #25 แก้แล้ว,
Known Design Decision ใหม่เรื่อง `ADMIN_SECRET`, Change Log)

---

## Round 3.1 — Dashboard เปิดไม่ได้จริงหลัง deploy (2026-09-12, ต่อจาก Round 3 ทันที)

Deploy round 3 (dashboard) เสร็จแล้ว รายงาน user ว่าใช้งานได้ — user แจ้งกลับทันทีว่าเข้าหน้า dashboard
ไม่ได้จริง

### Root cause (ยืนยันจาก source จริง ไม่ใช่เดา)

ตอน verify ก่อนหน้านี้ทั้งหมดยิง `curl 127.0.0.1:8080` ตรงเข้า Node process — **ไม่เคยเช็คผ่าน nginx
เลยสักครั้ง** (เส้นทางจริงที่ user ใช้จากเบราว์เซอร์) เช็ค `/etc/nginx/sites-enabled/*` พบว่า nginx
proxy แค่ `location /ws` กับ `location /api/` มาที่ Node เท่านั้น เส้นทางอื่นทั้งหมดใช้
`root /opt/halls-of-torment-coop/dist; try_files $uri $uri/ /index.html;` (เสิร์ฟ game client
เอง) — route เดิม `GET /admin/telemetry` อยู่นอก `/api/` เลยไม่เคยไปถึง Node handler จริงบน
production เลย nginx เสิร์ฟหน้า login ของเกมแทนแบบเงียบๆ (ไม่มี error ให้เห็นเลยด้วย เพราะ
`try_files` fallback ไป `index.html` สำเร็จ ได้ HTTP 200 ปกติ)

### Fix

ย้าย route หน้า dashboard จาก `GET /admin/telemetry` เป็น **`GET /api/admin/telemetry/dashboard`**
(อยู่ใต้ `/api/` prefix ที่ nginx proxy อยู่แล้ว) ไม่ต้องแก้ nginx config/reload เลย — เปลี่ยนแค่โค้ด
`server.ts` บรรทัดเดียว (route matching) เท่านั้น

### Test — คราวนี้ผ่าน proxy จริง ไม่ใช่ยิงตรง backend

รอบก่อนพลาดเพราะ test ตรงเข้า `127.0.0.1:8080` ทั้งหมด — รอบนี้จำลอง proxy layer ให้ตรงกับของจริง:
- Local: รัน `npm run dev` (Vite dev server, proxy `/api/` ตาม `vite.config.ts`) คู่กับ
  `npm run server` แล้วยิง `curl http://localhost:3000/...` (ผ่าน Vite proxy) แทนที่จะยิง port 8080
  ตรงๆ — ยืนยัน: path ใหม่ `/api/admin/telemetry/dashboard` ผ่าน proxy ได้ `HTTP 200` +
  `content-type: text/html` ถูกต้อง, path เดิม `/admin/telemetry` ผ่าน proxy คืน HTML ของ Vite/game
  client จริง (reproduce บั๊กเดิมได้ใน local ก่อนแก้)
- เปิดจริงผ่าน browser ที่ `http://localhost:3000/api/admin/telemetry/dashboard` — title tab ขึ้น
  "Torment of Souls — Telemetry Dashboard" ถูกต้อง (ไม่ใช่หน้าเกม), auth gate แสดงผลปกติ
- `npx tsc --noEmit` ✅, `npx vitest run` ✅ 73/73, `npm run build` ✅

### บทเรียน

เวลา verify route ใหม่ที่จะขึ้น production **ต้องทดสอบผ่าน reverse proxy จริง** (nginx บน production,
Vite dev server บน local) ไม่ใช่ยิงตรงเข้า backend process — ยิงตรงพลาดจุดนี้ไปได้ง่ายเพราะ backend
เองไม่มีปัญหาอะไรเลย ปัญหาอยู่ที่ routing layer ข้างหน้าทั้งหมด

### เอกสารที่อัปเดตเพิ่ม

`GAME_WIKI.md` (§5.7.1 แก้ URL + เพิ่มคำอธิบาย root cause, risk #25 อัปเดต, Change Log), `GAME_BLUEPRINT.md`
(Roadmap #25 อัปเดต URL, Change Log)

---

## Round 3.2 — เปลี่ยนมาแก้ที่ nginx ตามที่ user เลือก (2026-09-12, ต่อจาก 3.1 ทันที)

หลัง Round 3.1 อธิบายเหตุผลที่ใช้ `/api/` ให้ user ฟัง (ทางเลือก 1: ย้าย route เข้า `/api/` ไม่ต้องแก้
nginx vs ทางเลือก 2: เพิ่ม nginx `location /admin/` เอง URL สะอาดกว่าแต่เสี่ยงกว่าเพราะแตะ shared
infrastructure) user เลือกทางที่ 2

### สิ่งที่ทำบน production (ระมัดระวังเป็นพิเศษเพราะแตะ nginx ที่คุมทั้งเว็บไซต์)

1. Backup `/etc/nginx/sites-available/default` ก่อนแก้ทุกครั้ง (ไฟล์ timestamp)
2. เพิ่ม `location /admin/` block ใหม่ (mirror รูปแบบ `location /api/` เดิมทุกอย่าง: proxy_pass ไป
   `127.0.0.1:8080/admin/`, ใช้ `api_zone` rate limit เดียวกัน — ไม่ต้องประกาศ zone ใหม่)
3. แก้ผ่าน Python script ที่เช็ค exact-match ของ anchor text ก่อนเขียนไฟล์ (fail ทันทีถ้า anchor ไม่ตรง
   กันเขียนผิดไฟล์/ผิดจุดแบบเงียบๆ)
4. `nginx -t` ยืนยัน syntax ถูกต้องก่อน reload ทุกครั้ง (ยังไม่ reload ตอนนี้ — รอ deploy โค้ดคู่กัน)
5. `server.ts`: ย้าย route กลับจาก `/api/admin/telemetry/dashboard` เป็น `/admin/telemetry` ตามเดิม

### Test

- `npx tsc --noEmit` ✅, `npx vitest run` ✅ 73/73, `npm run build` ✅
- Deploy คู่กัน (โค้ด + nginx reload) แล้ว verify ผ่าน nginx จริงอีกครั้ง (`curl` ที่ `127.0.0.1` ไม่ใช่
  `:8080` ตรงๆ — บทเรียนจาก Round 3.1)

### พบ risk ใหม่ระหว่างทำ

nginx site config (`/etc/nginx/sites-available/default`) **ไม่ได้อยู่ใน git repo เลย** — ทุกครั้งที่
เพิ่ม route ใหม่ที่ต้องพึ่ง nginx (แบบรอบนี้) ต้องจำไว้เองว่าต้องไปแก้ config บน production ด้วย ไม่ใช่
แค่ push โค้ดแอปแล้วจบ (บันทึกเป็น risk #26 ใหม่ — GAME_WIKI.md §5.8/§6, GAME_BLUEPRINT.md B.5)

### เอกสารที่อัปเดตเพิ่ม

`GAME_WIKI.md` (§5.7.1 แก้ URL กลับเป็น `/admin/telemetry` + อธิบาย nginx block ใหม่, risk #25
อัปเดต + risk #26 ใหม่, §5.8 เพิ่ม bullet nginx-not-in-git, Change Log), `GAME_BLUEPRINT.md`
(Roadmap #25 อัปเดต + #26 ใหม่, Change Log)

---

## Round 4 — Thai-primary dashboard + System Metrics (CPU/RAM) (2026-09-12)

### ส่วนที่ 1: แปล dashboard เป็นภาษาไทยเป็นหลัก

User ขอให้ dashboard เป็นภาษาไทยเป็นหลัก + "ชื่อขอเป็นชื่อที่ไม่ใช่ตัวแปร" (ค่าที่โชว์เป็น raw
snake_case/enum เช่น `monster_contact`, `wave_reached` ต้องแปลเป็นข้อความอ่านง่าย) — ก่อนแปล ส่ง
agent ไปตรวจโค้ดเกมจริงก่อน (`I18n.ts`, `classes.ts`, `HUD.ts`) เพื่อใช้คำเดียวกับที่เกมมีอยู่แล้ว
ไม่ใช่บัญญัติศัพท์ใหม่ทับของเดิม พบว่า:
- **ผลจบเกม** (wipe/surrender/victory/boss_enrage_execute) มีคำไทยจริงในเกม (`I18n.ts`'s
  `gameover.*` keys ที่ `HUD.ts` ใช้จริง) — ใช้คำย่อจากของจริงตรงๆ
- **ชื่อมอนสเตอร์**/**rarity tier** ไม่มีคำไทยในเกมเลยสักที่ (เกมเองก็โชว์ raw English แม้อยู่โหมด
  ไทย) — user บอกให้ใช้ดุลพินิจ ("อันไหนแปลไทยได้ก็แปล ถ้าแปลแล้วแปลกๆก็ไม่ต้อง") จึงคงชื่อมอนสเตอร์
  เป็นอังกฤษ (ไม่บัญญัติศัพท์ใหม่ที่เกมไม่เคยใช้) ส่วน rarity แปลให้เพราะเป็นคำทั่วไปที่แปลได้ลื่น
  แต่ใส่วงเล็บอังกฤษกำกับไว้เพื่อ cross-reference กับ `TRAIT_POOL`

### ส่วนที่ 2: เพิ่มระบบ System Metrics

User ถามว่าเก็บสถิติ CPU/RAM เป็นกราฟได้ไหม — crack requirement ก่อน: เลือก "ทั้งสองอย่าง" (host VPS
+ process ของ game-server เอง) แสดงเป็น section ใหม่ในหน้า dashboard เดิม

**Fix ที่ทำ**: `src/server/telemetry/systemMetrics.ts` (`SystemMetricsSampler` ใหม่ — คำนวณ host CPU%
จาก `os.cpus()` diff, process CPU% จาก `process.cpuUsage()` diff, memory จาก
`os.totalmem/freemem`/`process.memoryUsage().rss`) sample ทุก 30 วิ เขียนตรงลง `system_metrics`
table ใหม่ (ไม่ผ่าน `TelemetryBuffer` — ความถี่ต่ำพอ) เพิ่ม field `system` ใน
`/api/admin/telemetry/summary` เดิม + section ใหม่ในหน้า dashboard (4 stat card + line chart 2 อัน,
RAM ใช้ dual y-axis)

**🐛 พบบั๊กจริงจาก unit test**: `computeProcessCpuPercent()` เดิม return `null` เมื่อ elapsed time
เป็น 0 (สองคอลติดกันในมิลลิวินาทีเดียวกัน) ทำให้ `sampleOnce()` ข้ามทั้งแถวไปเงียบๆ ทั้งที่ host
CPU/RAM ยังวัดได้ปกติ — เทสยิง `sampleOnce()` ติดกัน 3 ครั้งแล้วพัง (`rows` ว่าง) เจอ 2 ชั้น: (1)
`computeProcessCpuPercent()` เองมี baseline จริงตั้งแต่ constructor ไม่ควร return null เมื่อ elapsed
เป็นศูนย์ — แก้เป็น return `0` แทน (2) `os.cpus()`'s counter อัปเดตแค่ตาม OS tick granularity
(~10ms+) — เทสเรียกติดกันแบบ synchronous ไม่มีเวลาจริงผ่านไปให้ counter เปลี่ยนเลย ไม่ใช่บั๊ก แค่
เทสต้อง await จริงระหว่างคอล (แก้เทสให้ `await wait(30)` ระหว่างแต่ละ `sampleOnce()` แทนที่จะ loosen
assertion)

### Test

- `npx tsc --noEmit` ✅, `npx vitest run` ✅ **78/78** (เพิ่ม 3 test `SystemMetricsSampler` + 2 test
  `getSystemMetricsSeries`)
- `npm run build` ✅
- Manual E2E: รัน dev server จริง รอ sample จริง 2 รอบ (~35 วิ) ยืนยันแถวจริงใน `system_metrics`
  (`hostCpuPct: 28.1, hostMemUsedMb: 8111/8192, processCpuPct: 0.2, processRssMb: 67` — ค่าสมเหตุสมผล
  ทั้งหมด) เปิด dashboard จริงเห็น stat card + chart แสดงผลถูกต้อง รวมถึง empty-state ก่อน sample แรก
  มาถึง

### เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7.2 ใหม่ทั้งหมด, risk #24 ขยายให้ครอบคลุม `system_metrics`, Change Log),
`GAME_BLUEPRINT.md` (B.4 entity ใหม่ `system_metrics`, Change Log)

---

## Round 5 — Disk space, auto-refresh, และ race condition ตัวจริง (2026-09-12, ต่อจาก Round 4 ทันที)

User ถาม "พื้นที่หล่ะ" (ขอ disk space เพิ่มเข้า System Metrics) แล้วถามต่อว่า dashboard realtime
ไหม/fetch ทุกกี่นาที — อธิบายว่า dashboard นี้แยก route/DB จากเกมเลย ไม่กระทบ resource เกมแม้แต่น้อย
เสนอ auto-refresh 30 วิ (ตรงกับ sampler) + หยุดตอนสลับแท็บ user ตกลง

### Disk space

- Schema: เพิ่ม `disk_used_mb`/`disk_total_mb` (nullable) เข้า `system_metrics` — **แต่ table นี้
  deploy ไปแล้วจริงบน production ตั้งแต่ Round 4** เขียน `ensureColumn()` helper ใหม่ใน
  `telemetryDb.ts` (เช็ค `PRAGMA table_info` ก่อน `ALTER TABLE ADD COLUMN` เฉพาะคอลัมน์ที่ยังไม่มี)
  แทนที่จะแค่แก้ `CREATE TABLE` statement เฉยๆ (ซึ่งจะไม่มีผลกับตารางที่มีอยู่แล้วเพราะ
  `IF NOT EXISTS`) — เขียน test คู่ (`telemetryDb.test.ts` ใหม่) จำลอง DB จริงที่สร้างด้วย schema
  เก่า (ไม่มี disk column) แล้วเปิดผ่าน `createTelemetryConnection()` จริง ยืนยันว่า migrate สำเร็จ
  โดยแถวเดิมไม่หาย + insert ใหม่ด้วยคอลัมน์ใหม่ได้จริง
- `SystemMetricsSampler.getDiskUsage()` ใช้ `fs.statfsSync()` บน directory ที่ `telemetry.db` เองอยู่
  (จาก `db.name`) คืน `null` ถ้าใช้ไม่ได้ (เช่น `:memory:` ตอนเทส) แทนที่จะทำให้ sample พังทั้งแถว
- Dashboard: stat card ที่ 5 "พื้นที่ดิสก์" + chart ที่ 3 "พื้นที่ดิสก์ตามเวลา (%)"

### Auto-refresh

Poll ทุก 30 วิ (`AUTO_REFRESH_MS`) ตรงกับความถี่ sampler เอง (poll ถี่กว่านั้นแค่ดึงข้อมูลซ้ำเดิม
เปล่าๆ) หยุดอัตโนมัติด้วย `document.visibilitychange` เมื่อสลับแท็บ ไม่ต้องกังวลเรื่อง resource เกม
เพราะ dashboard อยู่คนละ route/DB กับตัวเกมเลย (`/admin/telemetry` vs game client, `telemetry.db` vs
`game.db`) — **พบบั๊กเล็กในโค้ดตัวเองระหว่างเขียน**: เผลอเช็ค `dashboard.hidden` (state UI
gate-vs-dashboard) แทนที่จะเป็น `document.hidden` (tab visibility จริง) ในตัว interval callback —
แก้ก่อน commit

**Test ผ่าน browser จริง**: simulate `document.hidden`/`visibilityState` ผ่าน
`Object.defineProperty` + dispatch `visibilitychange` event เอง (เพราะ automated browser pane
ที่ใช้ทดสอบ ตัว tab เองรายงาน `document.hidden: true` — ไม่ใช่ user จริงที่เปิดแท็บดู) ยืนยันว่า
timer เริ่มทำงานถูกและ refetch ทันที รอจริง ~90 วิเห็น timestamp ขยับเอง 2 รอบโดยไม่ต้องกดปุ่ม
ยืนยัน interval ทำงานจริง ไม่ใช่แค่ one-shot

### 🐛 พบและแก้ race condition จริงในชุด test ทั้งหมด (สำคัญที่สุดของรอบนี้ — ไม่ใช่แค่ feature นี้)

ระหว่างรัน `npx vitest run` ซ้ำๆ เจอ `SqliteError: database is locked` เป็นครั้งคราวมาตลอด**ทั้ง
เซสชัน** (เข้าใจผิดว่าเป็น "transient flake" หลายรอบ ไม่เคยขุดจริงจัง) รอบนี้ reproduce ซ้ำได้แน่นอน
หลังเพิ่ม `ALTER TABLE` migration (เปิดโอกาสชนกันมากกว่า `CREATE TABLE IF NOT EXISTS` เดิมมาก) —
root cause จริง: `telemetryDb.ts`'s module-level singleton
(`export const telemetryDb = createTelemetryConnection()`) เปิดไฟล์ `data/telemetry.dev.db` จริง
เป็น side effect ทันทีที่ import — ทุก test file ที่ import อะไรก็ตามที่พาดพิง
`TelemetryBuffer.ts`/`telemetryDb.ts` (ทางตรงหรือทางอ้อม ผ่าน `GameRoom.ts` เป็นต้น) trigger การ
เปิดไฟล์เดียวกันนี้ vitest รันหลาย test file พร้อมกันคนละ worker แย่งเปิด/migrate ไฟล์เดียวกันจริง

**แก้**: ให้ singleton สลับไปใช้ `:memory:` แทนเมื่อ `process.env.VITEST` (vitest set ให้อัตโนมัติ)
ไม่มี test ไหนใช้ singleton ตัวนี้ตรงๆ อยู่แล้ว (ทุก test สร้าง connection เองผ่าน
`createTelemetryConnection(':memory:')`) ปัญหาคือแค่ import module เฉยๆ ก็ trigger side effect
นี้ไปแล้ว — ยืนยันด้วยการรัน `npx vitest run` ซ้ำ 15+ ครั้งติดกันหลังแก้ ไม่มี fail อีกเลยสักครั้ง
(ก่อนแก้ reproduce ได้ ~1 ใน 3-5 ครั้ง)

### Test

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ **81/81** รันซ้ำ 15+ ครั้งติดกันไม่มี fail เลย (เทียบกับก่อนแก้ที่ fail
  เป็นระยะ) — เพิ่ม 4 test ใหม่ (2 ใน `telemetryDb.test.ts` ใหม่สำหรับ migration, 1 ใน
  `telemetryQueries.test.ts` สำหรับ disk field passthrough, ปรับ `seedMetric` helper เดิม)
- `npm run build` ✅
- Manual E2E: seed sample จริงเห็น disk field ค่าสมเหตุสมผล (`202.3 / 228.3 GB`), เปิด dashboard
  จริงเห็น stat card + chart ที่ 3 แสดงถูกต้อง, ยืนยัน auto-refresh ทำงานจริงตามที่อธิบายด้านบน

### เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7.2 หัวข้อเปลี่ยนเป็น "CPU/RAM/Disk", เพิ่มรายละเอียด disk/auto-refresh/schema
migration/race-condition fix, Change Log), `GAME_BLUEPRINT.md` (Change Log)

---

## Round 6 — Feedback 3 ข้อ: ตัดกราฟดิสก์, card pick stats รายใบ, impeccable layout audit (2026-09-12)

User ให้ feedback 3 ข้อพร้อมกันหลัง deploy รอบ disk/auto-refresh:
1. "พื้นที่ดิสจำเป็นต้องทำเป็นกราฟหรอ" — ตั้งคำถามความจำเป็นของกราฟ trend สำหรับดิสก์
2. อยากเปลี่ยน "อัตราการเลือกการ์ดตามความหายาก" (rarity aggregate) เป็นสถิติรายใบการ์ด พร้อมเหตุผล
   ชัดเจน: "จะได้รู้ว่าการ์ดไหนคนไม่เล่นจะได้เอามาปรับสมดุล"
3. "เอา impeccable มาเช็ค layout ... ทำเป็น component เพื่อให้สวยงามดูง่ายไม่แปลกตา"

### 1. ตัดกราฟดิสก์ตามเวลา

เอาออกเฉพาะ chart (`chart-disk-history`) เหลือแค่ stat card ค่าล่าสุด — เหตุผล: ดิสก์เปลี่ยนช้ากว่า
CPU/RAM มาก (เป็นวัน/สัปดาห์ ไม่ใช่วินาที) กราฟ trend real-time ให้ข้อมูลน้อยกว่าตัวเลขปัจจุบันเดี่ยวๆ
— data ที่ backend เก็บ (`disk_used_mb`/`disk_total_mb` ใน `system_metrics`) **ไม่ได้ตัดออก** แค่ไม่
เอามาวาดกราฟ ถ้าอยากดู trend ย้อนหลังยังดึงจาก DB ได้ตรงๆ

### 2. Card Pick Stats รายใบ (แทน rarity aggregate)

`getCardPickStats()` ใหม่ (`telemetryQueries.ts`) — เดินผ่านทุก `level_up_choice` event, นับ
`payload.offered[]` (เสนอ) เทียบกับ `payload.picked` (เลือก) ต่อ trait id แล้ว join กับ `TRAIT_POOL`
เอาชื่อไทยจริง (`thaiName`) ไม่ใช่แค่ id เรียงผลลัพธ์จาก **อัตราเลือกน้อยสุดก่อน** (ตรงกับเป้าหมาย
ของ user เป๊ะ: เห็นการ์ดที่ต้องปรับสมดุลอยู่บนสุดทันที) ตัดการ์ดที่ไม่เคยถูกเสนอเลยออก (ไม่ใช่ signal
เดียวกับ "เสนอแล้วไม่มีใครเลือก") เขียน test 3 ข้อ (offered/picked count ถูกต้อง+ใช้ thaiName,
sort ascending ถูก, กรอง unofferred card ถูก) ใช้ real `TRAIT_POOL` id จริง (`vitality_1`,
`strength_1`) ไม่ใช่ id สมมติ กันเทสผ่านหลอกๆ เพราะ id ปลอมจะโดนกรองออกจริงอยู่ดี (ยืนยันจาก
production code path เดียวกัน)

### 3. Impeccable Layout Audit

รัน `.claude/skills/impeccable/scripts/impeccable detect --scope layout` (ผลว่างทั้งก่อน-หลังแก้ —
ยืนยันว่า mechanical scan อย่างเดียวจับ hierarchy/rhythm ไม่ได้ ต้องตรวจด้วยตา+วัด DOM จริงตามที่
`layout.md` reference บอกไว้) ตรวจด้วยตา + วัด `getBoundingClientRect()`/`getComputedStyle()` จริง
ผ่าน browser พบ 3 ปัญหาจริง ไม่ใช่แค่ความรู้สึก:

1. **Grid wrap ไม่สม่ำเสมอ** — วัดจริง: section 4 การ์ด (overview) กับ section 5 การ์ด (system
   health) ใช้ `.grid` เดียวกัน (`auto-fit, minmax(280px,1fr)`) ได้ 3 คอลัมน์เท่ากัน แต่ auto-fit
   collapse-empty-track behavior ทำให้เศษ 1 ใบ stretch เต็มแถว ส่วนเศษ 2 ใบไม่ stretch เหลือช่องว่าง
   — inconsistent จริง ไม่ใช่แค่ความรู้สึก แก้เป็น `.grid--stats`/`.grid--charts` แยกกัน fixed
   column count ตาม breakpoint
2. **Emoji เป็น icon system** — ตรงกับ craft-floor.md ban ตรงๆ ("Unicode glyphs or emoji standing
   in for an icon system") ลบ 📈/🖥️/📊 ออกจาก section title ทั้ง 3 จุด เหลือ 🗡️ ที่ page title เดียว
   (brand mark ตัวเดียว ไม่ใช่ icon system ที่วนซ้ำ — ตรวจแล้วว่า 🗡️ เป็นสัญลักษณ์ที่โปรเจกต์ใช้จริง
   อยู่แล้วใน server log/pm2 output)
3. **ตารางไม่มีขอบเขต** — ทดสอบยัด 70 แถวจำลองจริง (จำลอง scale เกมจริงที่มี TRAIT_POOL ~70 ใบ)
   ยืนยันหน้ายาวขึ้นตรงตามจำนวนแถวจริง (ไม่มี cap) แก้ด้วย `.table-scroll`
   (`max-height:420px; overflow-y:auto`) ครอบทั้งตาราง card-stats และ error log (สม่ำเสมอกัน)

**🐛 พบและแก้บั๊กจริงระหว่างทำ sticky header**: ลอง `position: sticky` บน `<th>` ตอนแรกไม่ทำงาน
(ยืนยันด้วย `getBoundingClientRect()` วัดจริงระหว่าง scroll เห็น thead เลื่อนตามเนื้อหา ไม่ค้างอยู่
ที่เดิม) วินิจฉัยแล้วพบสาเหตุ: `table { border-collapse: collapse }` ทำให้ `position: sticky` บน
`<th>` ใช้ไม่ได้จริงใน Chromium (known engine quirk, ไม่ใช่ typo — `getComputedStyle` ยืนยัน
`position: sticky` ถูก apply จริงแต่ไม่มีผล) แก้เป็น `border-collapse: separate; border-spacing:0`
แทน (มองด้วยตาเหมือนเดิมทุกอย่าง เพราะ border วาดต่อ cell อยู่แล้ว ไม่ได้พึ่ง collapsed border)

**⚠️ ข้อจำกัดการ verify ที่ต้องบอกตรงๆ**: verify sticky-header ด้วยการ scroll จริง (ไม่ใช่แค่
`getComputedStyle`) ไม่สำเร็จในรอบนี้ — Browser pane ที่ใช้ทดสอบอยู่ในสถานะ "hidden" ระหว่างช่วงนั้น
(ยืนยันจาก error message ของ tool เอง: "The Browser pane is currently hidden. The page is not
rendered while it is not displayed") ทำให้ scroll-linked repaint/`requestAnimationFrame` ไม่ทำงาน
ระหว่างทดสอบ — ไม่ใช่หลักฐานว่าโค้ดพัง (fresh screenshot หลังจากนั้นยืนยันว่าหน้าเว็บ render ปกติทุก
อย่าง ปัญหาอยู่ที่ scroll-gesture-in-hidden-pane เท่านั้น) แต่ก็ไม่ได้เห็นด้วยตาจริงว่า sticky ทำงาน
ระหว่าง scroll จริงเช่นกัน — บอก user ตรงๆ ให้ลองเปิดหน้าจริงเช็คเองรอบแรกหลัง deploy ไม่ได้อ้างว่า
"verify ครบแล้ว 100%" ทั้งที่มีข้อจำกัดนี้อยู่

### Test

- `npx tsc --noEmit` ✅, `npx vitest run` ✅ **83/83** รันซ้ำ 3 ครั้งไม่มี fail (เพิ่ม/แก้ test ใน
  `telemetryQueries.test.ts`: ลบ test rarity เดิม, เพิ่ม 3 test `getCardPickStats`)
- `npm run build` ✅
- `impeccable detect --scope layout` ✅ ว่างทั้งก่อน-หลัง (mechanical scan อย่างเดียวไม่พอ ต้องตรวจตา
  + วัด DOM จริงตามที่ reference บอก)
- Manual E2E ผ่าน browser จริง: seed ข้อมูล card pick จริง (4 ใบ, อัตราเลือกต่างกัน) ยืนยันตารางแสดง
  ชื่อไทยถูกต้อง เรียงจากน้อยสุดถูกต้อง, ยืนยัน grid consistency ที่ desktop/mobile (375px) ทั้งสอง
  breakpoint, ยืนยัน scrollable container ทำงานจริงด้วยข้อมูลจำลอง 74 แถว (`isScrollable: true`,
  หน้าโตแค่ +265px ไม่ใช่ +2000px)

### เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7.1 แก้คำอธิบาย summary endpoint, §5.7.2 ตัดกราฟดิสก์ + อธิบายเหตุผล, §5.7.3 ใหม่
Card Pick Stats, §5.7.4 ใหม่ Layout Audit, Change Log), `GAME_BLUEPRINT.md` (Change Log)

## Round 7 — Gate-flash bug, vite dev proxy gap, stage filter (2026-09-12, ต่อจาก Round 6)

User รายงานบั๊กสด ("ทุกครั้งที่ refresh จะเห็นหน้าให้กรอก admin_secret แว๊บนึงทุกครั้ง") ระหว่างที่กำลัง
ทำ feature stage filter (ตอบ "แล้วอย่าลืมว่ามันมี 3 ด่าน ณ ตอนนี้" ค้างอยู่) จัดการบั๊กก่อนตามลำดับ
ที่ user รายงานเข้ามา แล้วค่อยกลับมาทำ stage filter ต่อ

### 1. Gate-flash bug (แก้ตามที่ user อนุมัติ "แก้เลยครับ")

**อาการ**: หน้า `/admin/telemetry` โชว์ฟอร์มกรอก `ADMIN_SECRET` แว๊บขึ้นมาก่อนทุกครั้งที่ refresh
แม้จะเคยใส่ secret ไว้ใน `localStorage` แล้วก็ตาม

**Root cause**: `#gate` div ไม่มี `hidden` attribute ในค่าเริ่มต้นของ markup — ส่วนโค้ด JS เดิมเรียก
`gate.hidden = true` อยู่ข้างในผลลัพธ์ของ `fetchSummary()` เท่านั้น ซึ่งเป็น `async` ต้องรอ network
round-trip ก่อน ระหว่างช่วง initial paint ถึง fetch resolve เสร็จ (สั้นแค่ไม่กี่ร้อย ms แต่ผู้ใช้เห็นได้
จริง) เบราว์เซอร์ paint `#gate` ค้างไว้ก่อนเสมอเพราะยังไม่มีอะไรไปสั่งซ่อนมันในช่วงนั้น

**แก้**: ตั้ง `#gate` ให้ `hidden` เป็นค่าเริ่มต้นในตัว markup เอง แล้วแทรก inline `<script>` เล็กๆ
ต่อท้าย div นั้นทันที — ทำงานแบบ synchronous ตอน parser มาถึงจุดนี้พอดี (ก่อนเนื้อหาส่วนอื่นของหน้า
และก่อน main script ท้ายไฟล์จะรันด้วยซ้ำ) เช็ค `localStorage.getItem('torment_admin_secret')` ตรงๆ
แล้วเปิดโชว์ gate เฉพาะตอนไม่มี secret เก็บไว้เท่านั้น (wrap ด้วย `try/catch` เผื่อ private-browsing
mode ที่ `localStorage` อาจ throw — pattern เดียวกับ `getStoredSecret()` เดิมที่มีอยู่แล้ว)

### 2. Vite dev proxy gap (พบระหว่าง verify bug ข้างบน)

พยายาม verify fix ข้างบนผ่าน real proxy (`localhost:3000`, ไม่ใช่ `:8080` ตรงๆ — ตามบทเรียนจาก
nginx bug รอบก่อน) แต่เจอว่า `/admin/telemetry` เปิดไม่ขึ้นเลย โหลดหน้าเกม SPA แทนแบบเงียบๆ — **บั๊ก
คนละตัวที่ซ่อนอยู่**: `vite.config.ts`'s `server.proxy` มีแค่ `/ws`/`/api` ไม่เคยมี `/admin` เลยตั้งแต่
สร้างมา ตอนแก้ nginx production (Round 3.2) ไม่ได้แก้ dev config คู่กันไปด้วย ทำให้ dev
environment ไม่เคย test route นี้ผ่าน proxy จริงได้เลยนับตั้งแต่ dashboard มีอยู่ — สอดคล้องกับที่เคย
บันทึกไว้ว่า "ต้อง verify ผ่าน real proxy layer เสมอ" (Round 3.1) แต่ layer local เองกลับมี gap
เดียวกันซ้ำ แก้โดยเพิ่ม `'/admin': { target: 'http://localhost:8080', changeOrigin: true }` เข้าไป
mirror `/api` เดิมเป๊ะๆ

### 3. Stage Filter (กลับมาทำ feature ที่ค้างไว้)

`getEventSummary()`/`getCardPickStats()` (`telemetryQueries.ts`) รับ `stageId?: number` เพิ่มใหม่ —
มีค่า → `WHERE stage_id = ?`, ไม่มีค่า → query เดิมทุกประการ (backward compatible)
`handleTelemetrySummary()` (`server.ts`) parse `?stage=` query param, whitelist เฉพาะ `1`/`2`/`3`
(`Number(rawStage)` + `[1,2,3].includes(...)`) ส่งต่อให้ทั้งสองฟังก์ชัน — **ตั้งใจไม่ส่งให้**
`getErrorSummary()`/`getSystemMetricsSeries()` เพราะ error log/system health ไม่ใช่แนวคิดที่ผูกกับ
ด่านที่กำลังเล่นอยู่โดยธรรมชาติ (เซิร์ฟเวอร์ตัวเดียวรันทุกด่านพร้อมกัน)

Dashboard เพิ่ม `<select id="stage-filter">` ในแถบ toolbar ข้างปุ่มรีเฟรช (ตัวเลือก: ทุกด่าน / ด่าน
1 สุสานวิญญาณหลอน / ด่าน 2 ถ้ำเพลิงอเวจี / ด่าน 3 ขุมนรกทมิฬศิลาดำ — ชื่อด่านจริงจาก
`src/shared/stages.ts`, ไม่ได้เดา) `change` event เรียก `fetchSummary()` ทันที ซึ่งอ่านค่า dropdown
ปัจจุบันทุกครั้งที่ถูกเรียก จึงทำงานถูกต้องร่วมกับ auto-refresh ทุก 30 วิเดิมได้เลยไม่ต้องแก้ auto-refresh
logic เพิ่ม หัวข้อ "สถิติการเล่นเกม"/"สถิติการเลือกการ์ด" (ส่วนที่ถูกกรอง) มีข้อความ "(ตามด่านที่เลือก)"
กำกับ ส่วน "Error ที่ยังไม่แก้" (การ์ดในภาพรวม, ไม่ถูกกรอง แต่โชว์ปนอยู่กับการ์ดที่ถูกกรองอื่นๆ) มี
"(ทุกด่าน)" กำกับกันสับสน

### Test

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ **85/85** รันซ้ำ 3 ครั้งไม่มี fail — เพิ่ม 2 test ใหม่ใน `telemetryQueries.test.ts`
  (`getEventSummary`/`getCardPickStats` กรอง `stageId` ถูกต้อง, รวมทุกด่านถูกต้องเมื่อไม่ส่ง `stageId`)
  และเพิ่ม `stageId` option ใน `seedEvent()` test helper (default `1` กันกระทบ test เดิม)
- Manual E2E ผ่าน `localhost:3000` (real vite dev proxy หลังแก้ gap ข้อ 2): ยืนยัน gate-flash fix
  ด้วยการตั้ง secret ไว้ล่วงหน้าใน `localStorage` แล้ว reload — `#gate`/`#dashboard` อยู่ในสถานะ
  hidden/visible ที่ถูกต้องทันที ไม่มี flash; ยืนยันกรณีไม่มี secret เก็บไว้ยังโชว์ gate ปกติเหมือนเดิม
  (ไม่ใช่ regression); seed event จริงแยกด่าน 1 กับด่าน 3 คนละชุด แล้วสลับ dropdown ยืนยันตัวเลข
  (จำนวนเกมจบ, เวลาเฉลี่ย, จำนวน event) เปลี่ยนตามด่านที่เลือกถูกต้อง, error count และ system health
  ไม่เปลี่ยนตามด่านตามที่ตั้งใจ
- `/impeccable layout` ตรวจ dropdown ใหม่: ความสูง/border-radius ตรงกับปุ่มรีเฟรช (35px/6px ทั้งคู่),
  contrast ตรงกับ pattern สีที่ใช้อยู่แล้วทั้งหน้า, ทดสอบที่ viewport มือถือ (375px) toolbar wrap ได้
  เรียบร้อยไม่ overflow/ทับกัน — ไม่พบปัญหา

### เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7.1 เพิ่มหมายเหตุ gate-flash + vite proxy gap, §5.7.5 ใหม่ Stage Filter, Change
Log), `GAME_BLUEPRINT.md` (Change Log), archive spec นี้ (Round 7 ใหม่)

## Round 8 — การ์ด card-stats/error-table ติดกัน (2026-09-12, ต่อจาก Round 7)

User รายงานบั๊กสด: "ทำไม สถิติการเลือกการ์ด กับ Error ที่เจอบ่อยที่สุด มันติดกัน"

**Root cause**: `admin/telemetry-dashboard.html` มีการ์ด `.card` 2 ใบนี้เป็น **direct child ของ
`#dashboard` ตรงๆ** ไม่เหมือนการ์ดอื่นทั้งหมดในหน้าที่ถูกห่อไว้ใน `.grid--stats`/`.grid--charts`
เสมอ — spacing ระหว่างการ์ดปกติมาจาก grid's `gap: 16px` (แนวนอน+แนวตั้ง) และ
`.grid--stats`/`.grid--charts` เองมี `margin-bottom: 20px` คั่นระหว่าง section แต่การ์ดทั้งสองใบนี้
เป็น sibling ธรรมดา ไม่มีอะไรคั่นเลยแม้แต่ pixel เดียว (มีแค่ border 1px ของแต่ละใบที่แยกให้เห็นขอบ
ต่างกัน) — ยืนยันด้วย `getBoundingClientRect()` จริง: `gapBetweenCard1And2` ก่อนแก้ = 0

**แก้**: เพิ่ม CSS rule `#dashboard > .card { margin-bottom: 20px; }` — เลือก selector แบบ
child-combinator (`>`) เจาะจงเพราะการ์ดอื่นทั้งหมดในหน้าซ้อนอยู่ในกริดอีกชั้น (ไม่ใช่ direct child
ของ `#dashboard`) จึงไม่ตรงกับ selector นี้ ไม่มีความเสี่ยง double-spacing ทับกับ grid `gap` เดิมที่
section อื่น ค่า 20px เลือกให้ตรงกับ `margin-bottom` ที่ `.grid--stats`/`.grid--charts` ใช้อยู่แล้ว
เพื่อให้จังหวะห่างระหว่าง section สม่ำเสมอกันทั้งหน้า

### Test

- `npx tsc --noEmit` ✅
- Manual verify ผ่าน `localhost:3000` (real vite dev proxy): `getBoundingClientRect()` วัดจริงก่อน/
  หลังแก้ — ก่อนแก้ gap = 0, หลังแก้ gap = 20px ตรงตาม `margin-bottom` ที่ตั้งไว้ (Browser pane อยู่
  ในสถานะ hidden ระหว่างทดสอบรอบนี้เหมือนที่เคยเจอใน Round 6 — screenshot ว่างเปล่า จึง verify ด้วย
  DOM measurement แทนตามที่เคยทำได้ผลมาก่อน)

### เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7 Change Log), `GAME_BLUEPRINT.md` (Change Log), archive spec นี้ (Round 8 ใหม่)
