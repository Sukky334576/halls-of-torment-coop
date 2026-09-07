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

### 2. รันระบบ (Development)
เปิด Terminal 2 หน้าต่าง:

**หน้าต่างที่ 1 — Dedicated Game Server (WebSocket Port 8080):**
```bash
npx tsx src/server/server.ts
```

**หน้าต่างที่ 2 — Web Client & Game UI (Vite Port 3000):**
```bash
npm run dev
# หรือ npx vite --port 3000
```

เปิด Browser ไปที่ http://localhost:3000 เพื่อเริ่มเล่น!

---

## 🌐 เล่นออนไลน์ข้ามเครื่อง (Multiplayer via Cloudflare Tunnel)
เซิร์ฟเวอร์รองรับการแชร์ลิงก์ให้เพื่อนเข้าเล่นได้ทันทีโดยไม่ต้อง Forward Port (รันได้ทั้ง Windows/macOS/Linux):
```bash
npm run tunnel
```
(บน Windows ที่มี `tools\cloudflared.exe` อยู่แล้วสามารถใช้ `npm run tunnel:windows` แทนได้)

แล้วนำ URL ที่ได้ส่งให้เพื่อนเข้าเล่นได้ทันที

⚠️ **URL ที่ได้จาก Cloudflare Tunnel เป็น public link** ใครก็ตามที่เดา/เจอ URL นี้จะเข้าร่วมปาร์ตี้ (และแทรกเข้าเกมที่กำลังเล่นอยู่) ได้ทันทีโดยไม่ต้องขออนุญาต ถ้าต้องการกันคนแปลกหน้า ให้ตั้งรหัสปาร์ตี้ก่อนรัน server:
```bash
set PARTY_CODE=ABC123
npx tsx src/server/server.ts
```
จากนั้นแชร์ลิงก์พร้อมรหัสให้เพื่อน เช่น `https://xxxx.trycloudflare.com/?code=ABC123` — ผู้ที่เข้าโดยไม่มีรหัสที่ตรงกันจะไม่ถูกนับเป็นผู้เล่นในปาร์ตี้ ถ้าไม่ตั้ง `PARTY_CODE` ไว้ ระบบจะเปิดให้ทุกคนเข้าร่วมได้เหมือนเดิม (เหมาะกับการทดสอบคนเดียว/ในวง LAN ที่ไว้ใจได้)

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
- src/client/engine/ : Renderer (3D + 2.5D), input, camera, meta-progression, sound
- src/client/ui/ : Lobby, Character Selection, Skill Tree, Gear Vault, Hall of Trials, HUD, Esc Menu
- GAME_SPEC.md : Master Game Design Document & Formula Reference
