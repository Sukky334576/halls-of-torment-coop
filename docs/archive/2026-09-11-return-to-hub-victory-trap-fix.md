# SPEC — "Return to Hub" Post-Boss-Victory Trap Fix (พบและแก้เสร็จในรอบเดียว)

> สถานะ: **เสร็จสมบูรณ์** (2026-09-11) | ประเภท: bug fix (client-server state desync, ทำเกมค้าง)
> ที่มา: user report — "บัคเมื่อจบบอส แล้ว มี 2 ตัวเลือก (กลับสู่เกม / โหมดไร้ขีดจำกัด) พอกด กลับสู่เกม
> แล้วไม่ยอมกลับไปหน้า lobby มันค้างที่หน้าเหมือนการ pause แต่เมนูไม่มีแล้ว ต้องกดยอมแพ้เพื่อออก"

## Requirement crack

ถามยืนยันกับ user แล้ว: บัคเกิดใน **solo** (ยังไม่ได้แยกทดสอบ coop) ขอบเขตที่อนุมัติคือ
**ตรวจทั้ง 2 ปุ่มพร้อมกัน** (Return to Hub + Continue/Endless Mode) ไม่มี log/error เพิ่มเติม
ให้ไปดู source code เอง

## Root cause (ยืนยันจาก source)

ปุ่มจริงคือ `#btn-retry` (`gameover.btn_retry` = "กลับสู่ล็อบบี้ / RETURN TO HUB",
`I18n.ts:149`) ใน game-over modal เดียวกันที่ใช้ทั้งตอนแพ้และตอนชนะบอส (`HUD.ts:180-193`)

1. **Client เดิม**: `btn-retry` click handler (`HUD.ts:249-251`) แค่ `window.location.reload()`
   ไม่แจ้ง server ว่าผู้เล่นตั้งใจออกจากห้องเลย
2. **Server เดิม**: ตอนบอส Lord of Torment ตาย (`GameRoom.ts:2645-2652`) ตั้ง `victoryPending = true`
   เพื่อ freeze โลกรอผู้เล่นเลือก Continue — **แต่ไม่เคยตั้ง `isOver = true`**
3. เมื่อ reload ตัด socket แล้วต่อใหม่ ส่ง `JOIN_LOBBY` — resume-check ที่ `server.ts:476-490`
   เห็นห้องยัง `isStarted && !isOver` จึงลากผู้เล่นกลับเข้าห้องเดิมที่ยัง `victoryPending` freeze
   อยู่ (ไม่ใช่ไป lobby) → หน้าจอเลยค้างเหมือน pause โดยไม่มีเมนู ตรงกับอาการที่ user รายงานเป๊ะ
4. **ไม่ใช่บัค solo-only** — เกิดกับ coop เหมือนกันทุกประการ เพราะกลไก `victoryPending`/`isOver`
   เป็น room-level ไม่แยก solo/coop เลย (แค่ user เจอครั้งแรกใน solo)
5. Comment ใน `handleSurrender()` (`GameRoom.ts:438-441`) **อธิบาย bug class นี้ไว้ตรงๆ อยู่แล้ว**
   และมีการแก้ปัญหานี้ไปแล้วสำหรับปุ่ม "ยอมแพ้" (solo/คนสุดท้าย → `isOver=true`, ยังมีเพื่อนเล่นต่อ →
   `removePlayer`) — แต่การแก้นั้น **ไม่เคยถูกเอาไปใช้กับ flow บอสชนะ (`victoryPending`) เลย** ซึ่งเป็น
   จุดที่เจอบัคจริง
6. ปุ่ม "โหมดไร้ขีดจำกัด" (`btn-continue-run` → `CONTINUE_RUN` → `handleContinueRun()`) ตรวจสอบแล้ว
   **ทำงานถูกต้องตามดีไซน์** เคลียร์ `victoryPending` และเปิด endless mode ปกติ ไม่พบปัญหา

## Fix

เพิ่ม flow ใหม่คู่ขนานกับ `handleSurrender` แทนที่จะยืมโค้ด surrender ตรงๆ หรือยืม `LEAVE_ROOM`
(message เดิมที่ออกแบบไว้สำหรับ pre-game lobby เท่านั้น — reuse ตรงๆ มิดแมตช์จะยิง
`broadcastRoomState`/`LOBBY_STATE` ที่ไม่เคยถูกทดสอบระหว่างแมตช์ ไม่คุ้มความเสี่ยงสำหรับ fix เล็กๆ):

- `src/shared/types.ts`: เพิ่ม `ClientMessage` variant `{ type: 'RETURN_TO_HUB' }`
- `src/shared/constants.ts`: เพิ่ม `RETURN_TO_HUB_FLUSH_DELAY_MS: 150`
- `src/server/engine/GameRoom.ts`: เพิ่ม `handleReturnToHub(playerId)` — solo/คนสุดท้าย →
  `isOver=true`, ยังมีเพื่อนเล่นต่อ → `removePlayer(playerId)` เฉยๆ **ไม่มี** gold penalty และ
  **ไม่** resend GAME_OVER (ต่างจาก surrender เพราะผู้เล่นชนะแล้ว ไม่ใช่แพ้ — banked ไปแล้วตอนบอสตาย)
- `src/server/server.ts`: เพิ่ม `case 'RETURN_TO_HUB'` เรียก `handleReturnToHub`
- `src/client/ui/HUD.ts`: เพิ่ม `onReturnToHub` callback แทนการ reload ตรงๆ ใน click handler
- `src/client/main.ts`: wire `onReturnToHub` → ส่ง `RETURN_TO_HUB` แล้วหน่วง reload
  `RETURN_TO_HUB_FLUSH_DELAY_MS` (150ms) ให้ WebSocket frame มีเวลาหลุดออกจาก client ก่อน reload
  ตัด connection ทิ้ง (ไม่มี guarantee 100% ตามสเปกเบราว์เซอร์ แต่ไม่มี debounce/ack mechanism
  ใน codebase นี้อยู่แล้ว — ยอมรับ residual risk นี้เพราะ likelihood ต่ำมากบน connection ที่เปิดอยู่)

**Backward-compatible โดยสมบูรณ์**: `handleReturnToHub` guard ด้วย `if (!player || this.isOver) return`
— กรณีแพ้ปกติ (`isOver` ตั้งไว้ก่อนหน้าแล้ว) เรียกแล้ว no-op ทันที ไม่กระทบ flow เดิมที่ทำงานถูกอยู่แล้ว

**⚠️ Revision (2026-09-11, หลัง risk audit)**: เดิมใช้ fixed delay 150ms ก่อน reload (`RETURN_TO_HUB_FLUSH_DELAY_MS`)
ไม่มี guarantee ว่า message หลุดออกจาก client จริงก่อน reload ตัด connection — เปลี่ยนเป็น
**ack-based**: server ส่ง `RETURN_TO_HUB_ACK` กลับทันทีหลังประมวลผล (`server.ts`'s `case 'RETURN_TO_HUB'`)
client รอ ack แล้วค่อย reload, มี fallback timeout `RETURN_TO_HUB_ACK_TIMEOUT_MS` (800ms) เผื่อ
ack หาย/connection มีปัญหา กันไม่ให้ผู้เล่นติดค้างที่ปุ่มกดไม่ตอบสนอง

## Test

เพิ่ม 4 testcase ใน `src/server/engine/GameRoom.test.ts` (`describe('GameRoom.handleReturnToHub...')`):

- Solo: `victoryPending=true` แล้วเรียก `handleReturnToHub` → `isOver` ต้องกลาย `true`
- Coop: เอาแค่คนกด return ออกจากห้อง, `isOver` ยังเป็น `false`, เพื่อนอีกคนยังอยู่ในห้อง
- ไม่ resend `GAME_OVER` และไม่แตะ `player.gold` (ต่างจาก surrender)
- Regression: เรียกซ้ำตอน `isOver` เป็น `true` อยู่แล้ว (flow แพ้ปกติ) ต้อง no-op ไม่ throw

ผลทดสอบ:
- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ 85/85 (81 เดิม + 4 ใหม่)
- `npm run build` ✅
- Manual E2E (Browser pane, solo, dev server + game server จริง, ทำซ้ำ 2 รอบ — รอบแรกด้วย fixed-delay
  เวอร์ชันแรก รอบสองด้วย ack-based เวอร์ชันแก้ไข): ฆ่าตัวเองด้วย ESC menu → Surrender → เห็นหน้า DEFEAT
  → กด "RETURN TO HUB" → กลับสู่หน้า main menu ได้ถูกต้องทั้งสองรอบ (ไม่ค้าง) — ยืนยัน wiring ใหม่
  (callback + RETURN_TO_HUB message + ack round-trip) ไม่มี regression บน flow ที่ทำงานถูกอยู่แล้ว
  ส่วน flow `victoryPending` จริง (ต้องถึง wave 30 boss) ไม่ได้ทดสอบสดในเซสชันนี้เพราะใช้เวลาเล่นจริง
  นานเกินไป — ครอบคลุมด้วย unit test ข้างต้นแทนซึ่งจำลอง state `victoryPending` ตรงจุดที่เป็น root
  cause จริง (ไม่ใช่ risk ที่แก้เพิ่มได้ด้วยโค้ด — เป็นข้อจำกัดด้าน test feasibility ที่ยอมรับไว้แทน)

## Fix #2 (พบระหว่างทาง, user อนุมัติให้แก้ในรอบเดียวกัน — "แก้ risk ทั้งหมดก่อนครับ")

`POST /api/progression` ล้มเหลวด้วย `SqliteError: FOREIGN KEY constraint failed`
(`src/server/db.ts:83`, `handleSaveProgression`) พบระหว่างทดสอบสดตอน verify fix ด้านบน — **ไม่เกี่ยวกับ
`victoryPending`/`RETURN_TO_HUB` เลย** เป็นบัคคนละจุด เกิดตั้งแต่ก่อน join ห้องด้วยซ้ำ

**Root cause**: `requireAuth()` (`server.ts:222-231`) เช็คแค่ว่า JWT signature valid (`verifyToken()`)
ไม่เคยเช็คว่า `uid` ที่ decode ได้ยังมีอยู่จริงใน `users` table — TOKEN_TTL 30 วัน ทำให้ token ที่ออกให้
ก่อนหน้านี้ (เช่น dev DB ถูกล้าง/สร้างใหม่, หรือ account ถูกลบ) ยัง verify ผ่านอยู่ `GET /api/progression`
ไม่พังเพราะ `SELECT ... WHERE user_id=?` กับ id ที่ไม่มีอยู่แค่คืน "ไม่มีข้อมูล" เฉยๆ แต่ `POST` ที่ทำ
`INSERT INTO progression` มี `FOREIGN KEY REFERENCES users(id)` เลย throw exception ไม่มีใคร catch
เป็น `SqliteError` unhandled จนกลายเป็น 500

**Fix**: เพิ่มเช็ค `findUserById(payload.uid)` ใน `requireAuth()` — ถ้า user ไม่มีอยู่จริงแล้วตอบ 401
เหมือนกรณี token ขาด/ผิด แทนที่จะปล่อยให้ layer ถัดไปพังแบบ unhandled — client (`AuthClient.pushProgression`)
already treat non-OK response เหมือนกันหมดอยู่แล้ว (`res.ok` check, ไม่ throw) เปลี่ยนแค่ semantics
ฝั่ง server จาก "server พัง" เป็น "auth ไม่ผ่านแล้ว" ที่ถูกต้องกว่า ไม่กระทบ client behavior ที่สังเกตได้
(progression ยัง fallback ไป localStorage เหมือนเดิมทั้งสองกรณี)

**Scope ที่ไม่แตะ**: ไม่ได้เพิ่ม auto-logout ฝั่ง client ตอนเจอ 401 (ปัจจุบัน client ไม่เคยมี logic นี้
สำหรับ endpoint ไหนเลย) — เป็นงาน UX แยกต่างหาก ถ้าต้องการให้ user เห็น prompt login ใหม่เมื่อ token
เสียต้องคุย scope เพิ่ม ไม่ใช่ส่วนของบัคคอขวดที่ทำให้ server 500 ที่แก้ในรอบนี้

**Test**: ไม่มี unit test เพิ่ม — `server.ts` ทั้งไฟล์ไม่มี test harness ในโปรเจกต์นี้เลย (import จะเริ่ม
HTTP+WS listener จริงทันที ไม่ตรงกับแนวทาง unit test ที่มีอยู่ซึ่งทดสอบ `GameRoom` class โดยตรง) ยืนยันด้วย
manual E2E แทน: รัน dev server จริง, สังเกต `POST /api/progression` จาก 500 (ก่อนแก้) → 401 (หลังแก้)
ทั้ง server log (`Unhandled error in HTTP handler` หายไป) และ network tab ของ browser

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.5, §5.6 risk ใหม่ #21 + #22, §6 Top Stability Risks, Change Log),
`GAME_BLUEPRINT.md` (Refactor Roadmap Phase 1 #21 + #22, Change Log)
