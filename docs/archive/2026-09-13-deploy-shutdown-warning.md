# SPEC — Deploy Shutdown Warning

> สถานะ: **เสร็จสมบูรณ์** (2026-09-13) | ประเภท: feature (ops/reliability) — ไม่ใช่ bug fix
> ที่มา: user report ตรง ("เมื่อเราอัพเดตเกม จะทำให้คนที่กำลังเล่นเจอปัญหา disconnect เนื่องจาก server restart")

## Requirement crack + วิเคราะห์

อ่าน source ก่อนเสนอทางแก้ (ไม่เดา):

- Client มี auto-reconnect อยู่แล้ว (`main.ts:457`, retry สูงสุด 20 ครั้ง) และ server มี
  `RECONNECT_GRACE_MS=60,000` (`constants.ts:17`) resume ตัวละครเดิมได้ — **แต่ใช้ได้แค่กรณี process
  เดิมยังรันอยู่** (เช่น WiFi หลุดชั่วคราว)
- `pm2 restart` ฆ่า process ทั้งตัว — `GameRoom` state (HP/wave/gold/ตำแหน่ง) อยู่ใน memory ล้วนๆ
  ไม่มี persistence เลย แม้ client จะ reconnect กลับมาได้ก็เจอ process ใหม่ที่ไม่รู้จัก room เดิม =
  **เสียรันทิ้งอยู่ดี**
- `SIGTERM` handler เดิม (`server.ts:696`) แค่ flush telemetry แล้ว exit ทันที ไม่เตือนผู้เล่นก่อนเลย

เสนอ 3 ทางเลือกตาม effort ให้ user เลือก:
- **S**: เตือนก่อน restart (broadcast + delay, ไม่แก้ปัญหาเสียรัน แค่ทำให้รู้ตัว)
- **M**: รอไม่มีคนเล่นก่อนค่อย restart (interrupt รันจริงน้อยลง แต่ deploy อาจใช้เวลาไม่แน่นอน)
- **L**: persist + migrate game state จริง (ไม่เสียรันเลย แต่ effort สูงมาก ไม่เหมาะกับ scale
  friend-testing ตอนนี้)

User เลือก **S** — ยอมรับว่าไม่ใช่ zero-downtime จริง แค่ต้องการให้ผู้เล่นรู้ตัวว่ากำลังจะหลุดเพราะ
อัปเดต ไม่ใช่บั๊ก

## การแก้ (S)

### 1. `ServerMessage` ใหม่ (`src/shared/types.ts`)
```ts
| { type: 'SERVER_SHUTDOWN_WARNING'; secondsRemaining: number };
```

### 2. `broadcastToAll()` ใหม่ (`src/server/server.ts`)
เหมือน `broadcastToRoom()` เดิมทุกประการแต่ไม่กรอง `roomId` — ยิงทุก client ที่ต่ออยู่ (`readyState ===
OPEN`) return จำนวนที่ยิงถึงจริง (ไว้ log/ตอบ endpoint)

### 3. Endpoint ใหม่ `POST /api/admin/broadcast-shutdown-warning`
รับ body `{ seconds?: number }` (default 30, invalid/ไม่ส่งมา = ใช้ default เงียบๆ ไม่ error)
เรียก `broadcastToAll({ type: 'SERVER_SHUTDOWN_WARNING', secondsRemaining })` ตอบกลับ
`{ success: true, notified: <count> }`

**⚠️ Correction (2026-09-13, พบระหว่าง deploy จริงรอบแรก)**: ตัดสินใจแรกคือ "ไม่ผูก `ADMIN_SECRET`"
โดยอ้างว่า nginx ไม่มี `location` block proxy path นี้เลย เรียกได้แค่จาก `curl 127.0.0.1:8080/...`
บนเครื่อง VPS เอง **ข้อสันนิษฐานนี้ผิด** — nginx มี `location /api/` block แบบกว้าง proxy **ทุก path
ใต้ `/api/`** มาที่ Node อยู่แล้ว (ไม่ใช่ whitelist เฉพาะ path ที่เคยตั้งใจเปิด แบบที่ `/admin/`
เคยต้องเพิ่ม block แยกก่อนถึงจะใช้ได้) ยืนยันจริงด้วยการ `curl` จากเครื่องนอกไปที่
`http://109.123.235.170/api/admin/broadcast-shutdown-warning` หลัง deploy ครั้งแรก แล้วได้ `200`
กลับมาจริง (endpoint ใช้งานได้แบบไม่มี auth เลยบน public internet ช่วงสั้นๆ ก่อนแก้) แก้ทันทีด้วยการ
เพิ่ม `requireAdminSecret()` guard เดียวกับ telemetry endpoints อื่น (เหมือนที่ควรทำตั้งแต่แรก) —
deploy script ต้องอ่านค่า `ADMIN_SECRET` จาก `.env.server` บนเครื่อง VPS เองแล้วส่งเป็น header
`X-Admin-Secret` (ไม่พิมพ์/echo ค่าออกมาที่ไหนเลย ตามกฎการจัดการ secret เดิม)

### 4. Client handler ใหม่ (`src/client/main.ts`)
รับ `SERVER_SHUTDOWN_WARNING` แล้วโชว์ผ่าน `connectionBanner` เดิม (element เดียวกับตอน reconnect —
ไม่สร้าง UI ใหม่) ข้อความนับถอยหลังวินาทีที่เหลือ ทั้งไทย/อังกฤษตาม `I18n.getLanguage()`

### 5. Deploy flow เปลี่ยน (ไม่ใช่โค้ดในนี้ repo — ขั้นตอน SSH ที่ใช้จริงตอน deploy)
หลัง `npm run build` สำเร็จ **ก่อน** `pm2 restart game-server` (⚠️ ต้องมี `X-Admin-Secret` header
หลัง correction ด้านบน — อ่านค่าจาก `.env.server` บนเครื่องเอง ไม่ hardcode/พิมพ์ค่าที่ไหน):
```bash
ADMIN_SECRET_VALUE=$(grep -oP '^ADMIN_SECRET=\K.*' .env.server)
curl -s -X POST http://127.0.0.1:8080/api/admin/broadcast-shutdown-warning \
  -H "X-Admin-Secret: $ADMIN_SECRET_VALUE" -d '{"seconds":30}'
sleep 30
pm2 restart game-server
```

## Test

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ **95/95** (ไม่มี test ใหม่ในชุดนี้ — ดูเหตุผลด้านล่าง)
- **ไม่มี unit test ใหม่สำหรับ `broadcastToAll()`/endpoint** — `server.ts` ทั้งไฟล์ไม่มี unit test
  มาตั้งแต่ต้น (เปิด WS/HTTP/DB จริงตอน import เป็น side effect ทำให้ isolate ยาก — pattern เดียวกับที่
  เจอตอนแก้ risk #28 เรื่อง module-level singleton) logic ใหม่ที่เพิ่ม (for-loop broadcast + JSON parse
  พร้อม fallback default) ก็เรียบง่ายไม่ซับซ้อนพอจะคุ้มการ refactor เพื่อ unit test ได้ ใช้ manual
  integration test แทน (สอดคล้องกับ pattern เดิมของไฟล์นี้ทั้งไฟล์):
  - รัน `npm run server` (dev mode) จริง
  - เปิด WS client 1 ตัว → `curl -X POST .../broadcast-shutdown-warning -d '{"seconds":15}'` →
    ยืนยัน client ได้รับ `{"type":"SERVER_SHUTDOWN_WARNING","secondsRemaining":15}` ตรงตาม input
  - `curl -X POST .../broadcast-shutdown-warning` (ไม่ส่ง body เลย) → ยืนยันไม่ error, ตอบ
    `{"success":true,"notified":0}` (ตอนนั้นไม่มี client ต่ออยู่ — ยืนยัน default 30s path ทำงานไม่พัง)
  - เปิด WS client 3 ตัวพร้อมกัน → broadcast ครั้งเดียว → ยืนยันทั้ง 3 ตัวได้รับข้อความ, endpoint ตอบ
    `notified: 3` ตรงกับจำนวนจริง

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.5 ขยาย bullet reconnect เดิม + เพิ่มหัวข้อ "Deploy Shutdown Warning", Change Log),
`GAME_BLUEPRINT.md` (Change Log)

## หมายเหตุสำหรับ session อื่น/รอบ deploy ถัดไป

**Deploy script บน production ต้องอัปเดตด้วย** — ฟีเจอร์นี้จะไม่มีผลอะไรเลยถ้า deploy flow ที่ใช้จริง
ยังเป็น `git pull && npm run build && pm2 restart` แบบเดิมที่ไม่เรียก broadcast endpoint ก่อน ต้องแทรก
ขั้นตอน curl+sleep (ดูข้อ 5 ด้านบน) เข้าไปในทุกครั้งที่ deploy นับจากนี้
