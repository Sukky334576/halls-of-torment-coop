# ⚔️ Torment of Souls (Halls of Torment Co-op)

> **Online Multiplayer Roguelite Bullet Heaven Action RPG**  
> รองรับการเล่นแบบ Co-op พร้อมกันหลายคนผ่าน WebSocket Realtime Server พร้อมระบบต่อสู้, ธาตุปฏิกิริยา (Elemental Reactions), ทักษะอาชีพ และระบบอุปกรณ์ Vault Extraction

---

## 📖 เอกสารระบบเกมฉบับเต็ม (Game Specification)
อ่านระบบตัวละคร, สูตรคำนวณดาเมจ, ธาตุ, สายอัพเกรด, ทักษะ Passive และ API ผู้ดูแลระบบแบบละเอียดยิบได้ที่:  
👉 **[GAME_SPEC.md](./GAME_SPEC.md)**

---

## 🚀 Quick Start (สำหรับผู้พัฒนา / เพื่อนที่จะเอาไปทำต่อ)

### 1. ติดตั้ง Dependencies
`ash
npm install
`

### 2. รันระบบ (Development)
เปิด Terminal 2 หน้าต่าง:

**หน้าต่างที่ 1 — Dedicated Game Server (WebSocket Port 8080):**
`ash
npx tsx src/server/server.ts
`

**หน้าต่างที่ 2 — Web Client & Game UI (Vite Port 3000):**
`ash
npm run dev
# หรือ npx vite --port 3000
`

เปิด Browser ไปที่ http://localhost:3000 เพื่อเริ่มเล่น!

---

## 🌐 เล่นออนไลน์ข้ามเครื่อง (Multiplayer via Cloudflare Tunnel)
เซิร์ฟเวอร์รองรับการแชร์ลิงก์ให้เพื่อนเข้าเล่นได้ทันทีโดยไม่ต้อง Forward Port:
`ash
tools\cloudflared.exe tunnel --url http://localhost:3000
`
แล้วนำ URL ที่ได้ส่งให้เพื่อนเข้าเล่นได้ทันที

---

## 🎁 GM Admin Airdrop Tool (เครื่องมือแจกเงิน / ไอเทมผู้เล่น)
แจกทองให้ผู้เล่นทุกคนที่อยู่ในเกมแบบ Real-time โดยไม่ต้องรีสตาร์ท:
`ash
# แจกทอง 10,000 Gold ให้ทุกคน
curl -X POST http://localhost:8080/api/grant-gold -H "Content-Type: application/json" -d "{\"amount\": 10000}"
`

---

## 🛠️ โครงสร้างโปรเจกต์ (Project Structure)
- src/core/ : Combat formula, Elemental reaction system, Weapon evolution, Skill tree
- src/entities/ : Player, Hero classes, Enemy AI & Boss behaviors
- src/server/ : WebSocket Authoritative/Sync Server, Lobby manager, Airdrop REST API
- src/ui/ : Lobby, Character Selection, Ancient Roots Tree, Wellkeeper & Vault Shop
- GAME_SPEC.md : Master Game Design Document & Formula Reference
