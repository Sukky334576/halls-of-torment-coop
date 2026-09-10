# ⚔️ Torment of Souls (Halls of Torment Co-op)

> **Online Multiplayer Roguelite Bullet Heaven Action RPG**
> รองรับการเล่นแบบ Co-op พร้อมกันหลายคนผ่าน WebSocket Realtime Server พร้อมระบบต่อสู้, ธาตุปฏิกิริยา (Elemental Reactions), ทักษะอาชีพ และระบบอุปกรณ์ Vault Extraction

---

## 📖 เอกสารระบบเกมฉบับเต็ม (Game Specification)
อ่านระบบตัวละคร, สูตรคำนวณดาเมจ, ธาตุ, สายอัพเกรด, ทักษะ Passive และ API ผู้ดูแลระบบแบบละเอียดยิบได้ที่:
👉 **[GAME_SPEC.md](./GAME_SPEC.md)**

เอกสารออกแบบตั้งต้นก่อนเริ่มพัฒนา (ไอเดียบางส่วนยังไม่ implement — มี checklist สถานะกำกับไว้) อยู่ที่ [GAME_SPEC_AND_ARCHITECTURE.md](./GAME_SPEC_AND_ARCHITECTURE.md)

---

## 🚀 Quick Start (สำหรับผู้พัฒนา / เพื่อนที่จะเอาไปทำต่อ)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
ระบบบัญชีผู้เล่น (login/JWT) ต้องมีไฟล์ `.env.server` — copy จาก template แล้วใส่ค่าเอง:
```bash
cp .env.server.example .env.server
```
ใส่ `JWT_SECRET` (gen ด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) — ถ้าไม่ตั้ง เซิร์ฟเวอร์จะรันได้แต่ใช้ secret แบบ hardcode ที่ไม่ปลอดภัย (มี warning เตือนตอนสตาร์ท) `.env.server` ไม่ถูก commit ขึ้น git (ดู `.gitignore`) และตั้งใจใช้ชื่อนี้แทน `.env` เพื่อไม่ให้ Vite (client build) มาสแกนเจอโดยไม่ได้ตั้งใจ

### 3. รันระบบ (Development)
เปิด Terminal 2 หน้าต่าง:

**หน้าต่างที่ 1 — Dedicated Game Server (WebSocket + Auth API Port 8080):**
```bash
npx tsx src/server/server.ts
```

**หน้าต่างที่ 2 — Web Client & Game UI (Vite Port 3000):**
```bash
npm run dev
# หรือ npx vite --port 3000
```

เปิด Browser ไปที่ http://localhost:3000 — ต้องสมัคร/ล็อกอินก่อนถึงจะเล่นได้ (ไม่มีโหมด guest) แล้วเลือกเล่นคนเดียวหรือหลายคน

### 4. Production Deploy
รันผ่าน pm2 ด้วย config ที่ track ไว้แล้ว (ดู [ecosystem.config.cjs](./ecosystem.config.cjs)) แทนการ `pm2 start` ด้วยมือ:
```bash
npm run build          # build client → dist/
pm2 start ecosystem.config.cjs
pm2 save
```
`NODE_ENV=production` ถูกตั้งใน `ecosystem.config.cjs` แล้ว (คุม path ของ SQLite db ที่ใช้ — `game.db` แทน `game.dev.db`) ส่วน secret (`JWT_SECRET`, `PARTY_CODE`) มาจาก `.env.server` เท่านั้น

---

## 🔐 ระบบบัญชีผู้เล่น & ห้องเล่นหลายคน (Accounts & Rooms)
- สมัคร/ล็อกอินด้วย Username + Password (bcrypt hash + JWT, เก็บใน SQLite — `data/game.dev.db` ตอน dev, `data/game.db` ตอน prod) ความคืบหน้า (ทอง/ฮีโร่ที่ปลดล็อก/สกิล) sync ขึ้นเซิร์ฟเวอร์อัตโนมัติ
- หลังล็อกอินเลือกเล่นคนเดียว หรือเล่นหลายคน (เข้าหน้ารายชื่อห้องที่เปิดอยู่ สร้าง/เข้าร่วมได้)
- ห้องตั้งรหัสผ่านได้ (optional) — ห้องที่ล็อกจะมีไอคอน 🔒 ในลิสต์ ต้องใส่รหัสถูกถึงจะเข้าร่วมได้
- รายละเอียดสถาปัตยกรรมเต็มๆ ดูที่ [GAME_SPEC.md §8.3-8.4](./GAME_SPEC.md)

---

## 🌐 เล่นออนไลน์ข้ามเครื่อง (Multiplayer via Cloudflare Tunnel)
เซิร์ฟเวอร์รองรับการแชร์ลิงก์ให้เพื่อนเข้าเล่นได้ทันทีโดยไม่ต้อง Forward Port (รันได้ทั้ง Windows/macOS/Linux):
```bash
npm run tunnel
```
(บน Windows ที่มี `tools\cloudflared.exe` อยู่แล้วสามารถใช้ `npm run tunnel:windows` แทนได้)

แล้วนำ URL ที่ได้ส่งให้เพื่อนเข้าเล่นได้ทันที

⚠️ **URL ที่ได้จาก Cloudflare Tunnel เป็น public link** ใครก็ตามที่เดา/เจอ URL นี้สามารถสมัครบัญชีแล้วเข้าเล่นได้ทันที ถ้าต้องการกันคนแปลกหน้าเพิ่มอีกชั้นนอกเหนือจากระบบ login ให้ตั้ง `PARTY_CODE` ใน `.env.server`:
```
PARTY_CODE=ABC123
```
จากนั้นแชร์ลิงก์พร้อมรหัสให้เพื่อน เช่น `https://xxxx.trycloudflare.com/?code=ABC123` — ผู้ที่เข้าโดยไม่มีรหัสที่ตรงกันจะต่อเซิร์ฟเวอร์ไม่ได้เลย ถ้าไม่ตั้ง `PARTY_CODE` ไว้ ระบบจะเปิดให้ทุกคนที่ล็อกอินเข้าร่วมได้ตามปกติ

---

## 🎁 GM Admin Airdrop Tool (เครื่องมือแจกเงิน / ไอเทมผู้เล่น)
แจกทองให้ผู้เล่นทุกคนที่อยู่ในเกมแบบ Real-time โดยไม่ต้องรีสตาร์ท:
```bash
# แจกทอง 10,000 Gold ให้ทุกคน
curl -X POST http://localhost:8080/api/grant-gold -H "Content-Type: application/json" -d "{\"amount\": 10000}"
```

⚠️ Endpoint นี้ไม่มีการยืนยันตัวตน (auth) ใดๆ ในปัจจุบัน — ตั้งใจเปิดไว้แบบนี้สำหรับช่วงทดสอบภายใน อย่าเปิด port 8080 สู่อินเทอร์เน็ตสาธารณะโดยไม่ป้องกันก่อน deploy จริง

---

## 🛠️ โครงสร้างโปรเจกต์ (Project Structure)
- src/shared/ : Types, hero/gear/skill-tree/stage data ที่ client-server ใช้ร่วมกัน
- src/server/engine/ : Combat resolver, Elemental reaction system, Spatial hash grid, Horde director
- src/client/engine/ : Renderer (Canvas2D — the Three.js renderer in the same folder is unused dead code), input, camera, meta-progression, sound
- src/client/ui/ : Lobby, Character Selection, Skill Tree, Gear Vault, Hall of Trials, HUD, Esc Menu
- GAME_SPEC.md : Master Game Design Document & Formula Reference
