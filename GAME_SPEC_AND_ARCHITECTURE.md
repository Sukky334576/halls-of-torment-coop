# 📜 GAME SPECIFICATION & 100% AI ARCHITECTURE
## Project: Torment of Souls (Dark Fantasy 4-Player Horde Survival)
*Inspired by Halls of Torment & Diablo II — Enhanced with Modern 3D Visuals & 4-Player Co-op*

> ⚠️ **สถานะเอกสาร:** นี่คือเอกสาร**ออกแบบตั้งต้น (pre-production design pitch)** ก่อนเริ่มพัฒนาจริง เก็บไว้เพื่ออ้างอิงประวัติศาสตร์/ไอเดียเท่านั้น **ไม่ใช่สเปกปัจจุบันของเกม** — เนื้อหาหลายจุดด้านล่างยังไม่ถูก implement หรือถูกเปลี่ยนแนวทางไปแล้วเมื่อเทียบกับโค้ดจริง (ดู checklist ด้านล่าง) สเปกที่ตรงกับของจริงตอนนี้อยู่ที่ **[GAME_SPEC.md](./GAME_SPEC.md)**

---

## ✅ Implementation Status Checklist (audited against source code, 2026-09-07)

**Core Gameplay Loop**
- [~] Camp/Hub (Wellkeeper equip, Shrine of Blessings, Hall of Heroes) — แนวคิดมีจริงผ่าน Lobby/Gear Vault/Skill Tree UI แต่ไม่ได้แยกเป็น 3 โซนตามที่อธิบาย
- [~] Survival Stage แบบจับเวลา พร้อม Early/Mid/End Phase — **แก้ไข (เดิมเขียนผิดว่าไม่มี — grep ครั้งแรกพลาดเพราะไม่ใส่ `-i` เลยไม่เจอ `WAVE_DURATION_SEC`):** มีระบบจับเวลาจริง `WAVE_DURATION_SEC = 40` วินาที/เวฟ × 30 เวฟ ≈ 20 นาทีรวม ([HordeDirector.ts:17](src/server/engine/HordeDirector.ts:17)) ใกล้เคียงกับดีไซน์เดิมมาก แต่เป็น 20 นาที ไม่ใช่ 30 และไม่ได้แบ่งชื่อ Early/Mid/End Phase ตามที่อธิบายไว้
- [x] บอส "Lord of Torment" — **แก้ไข (เดิมเขียนผิดว่าไม่มี):** implement จริง สปอนเป็นบอสเวฟที่ 30 ([HordeDirector.ts:191](src/server/engine/HordeDirector.ts:191)), ฆ่าแล้ว trigger `GAME_OVER` victory ([GameRoom.ts:2138](src/server/engine/GameRoom.ts:2138)) — จังหวะจริงอยู่ที่ ~20 นาที ไม่ใช่ 30:00 เป๊ะ แต่กลไก "เวฟสุดท้าย = บอสจบเกม" มีจริง
- [ ] Well Shrines โผล่กลางด่านให้ส่งเกียร์ขึ้นบ่อ — `SEND_WELL_GEAR` message ประกาศไว้ใน [types.ts:360](src/shared/types.ts:360) แต่ client ไม่เคยส่ง และ server ไม่มี handler
- [~] Run Complete ได้ Gold + ปลดล็อกเกียร์ถาวร — ได้ Gold จริง (`teamGold`) แต่การปลดล็อกเกียร์ผ่านบ่อน้ำยังไม่มี

**Character Classes**
- [🔄] ตารางนี้มีแค่ 4 คลาส (Swordsman/Archer/Sorceress/Cleric) — ของจริงมี **9 คลาส** แล้ว (ดู [GAME_SPEC.md §3](GAME_SPEC.md)) เอกสารนี้สะท้อนสโคปยุคแรกก่อนขยายคลาส

**Combat Math**
- [x] สูตร Base Damage / Crit — มีจริง ถูกพัฒนาต่อเป็นสูตรปัจจุบันใน [GAME_SPEC.md §4.1](GAME_SPEC.md)
- [🔄] สถานะ Fragile/Affliction/Electrify — ถูกแทนที่ด้วยระบบ Elemental Reaction ที่ซับซ้อนกว่า (Frost/Burn/Shock/Bleed/Holy → Shatter/Bloodflame/Superconduct/Holy Conflagration) ใน [GAME_SPEC.md §4.2](GAME_SPEC.md)

**Co-op Mechanics**
- [x] Dynamic HP/Density Scaling ตามจำนวนผู้เล่น — มีจริง: `COOP_HP_SCALE_PER_PLAYER` (+35%/คน) และ `COOP_SPAWN_SCALE_PER_PLAYER` (+25%/คน) ใน [constants.ts](src/shared/constants.ts), ใช้งานจริงใน [GameRoom.ts:395](src/server/engine/GameRoom.ts:395) และ [HordeDirector.ts:103](src/server/engine/HordeDirector.ts:103) (ตัวเลข % ต่างจากที่ระบุไว้ (+40%) แต่กลไกเดียวกัน)
- [x] Shared EXP Orb Pool — มีจริงตรงตามที่อธิบาย โค้ดมีคอมเมนต์ "SHARED EXP for all teammates!" ที่ [GameRoom.ts:2231](src/server/engine/GameRoom.ts:2231)
- [x] Soul Beacon (ยืนชุบชีวิตเพื่อน) — มีจริง: revive circle/timer/ฟื้นที่ 50% HP ใน [ServerPlayer.ts:294](src/server/entities/ServerPlayer.ts:294) + [GameRoom.ts:336](src/server/engine/GameRoom.ts:336) (รัศมี/เวลาต่างจากที่ระบุเล็กน้อย: 100px/4.0s)
- [ ] Wellkeeper Shared Haul (ทีมปลดล็อกเกียร์ที่เพื่อนส่งบ่อน้ำร่วมกัน) — ช่องว่างเดียวกับ Well Shrine ด้านบน

**Architecture (ภาคที่ 2)**
- [🔄] Three.js InstancedMesh แบบ 3D ล้วน + Binary-packed WebSocket state — ของจริงใช้ JSON over WebSocket ([types.ts](src/shared/types.ts)) แบบ hybrid 3D (Three.js) + 2D Canvas ไม่ได้ pack เป็น binary
- [x] Node.js authoritative server + Spatial Hash Grid + tick 20Hz — มีจริง ตรงกับ [GAME_SPEC.md §8.1](GAME_SPEC.md)
- [ ] Export เป็น `.exe` ด้วย Tauri สำหรับ Steam — ไม่พบ Tauri config/dependency ในโปรเจกต์

**Legend:** [x] Implemented ・ [~] Partial ・ [ ] Not implemented ・ [🔄] Superseded by a different actual implementation

---

## ภาคที่ 1: Game Specification (สเปกเกมและระบบเกมแบบละเอียด)

### 1. Core Gameplay Loop
```
[ Camp / Hub ]
  ├── Wellkeeper: เลือกสวมใส่อุปกรณ์ (Gear) ที่กู้กลับมาได้จากรอบก่อน
  ├── Shrine of Blessings: อัปเกรดค่าพลังถาวรด้วยทอง (Gold)
  └── Hall of Heroes: เลือกคลาสตัวละคร (Swordsman, Archer, Sorceress, Cleric ฯลฯ)
          │
          ▼ [จับตี้ Co-op 1-4 คน]
[ 30-Minute Survival Stage ]
  ├── 00:00 - 10:00 (Early Phase): มอนสเตอร์ระดับล่าง ฝึกลูกเล่น เก็บ EXP ลูกแก้ว
  ├── 10:00 - 20:00 (Mid Phase): มอนสเตอร์ Elite เกิด, แท่น Well Shrines ปรากฏ, ส่ง Gear ขึ้นบ่อน้ำ
  ├── 20:00 - 29:59 (End Phase): ฝูงศัตรูหนาแน่นสูงสุด (Swarm Rush) ต้องประสานสกิลทีม
  └── 30:00 (Lord of Torment): บอสประจำฉากปรากฏตัว ฝูงมอนหยุดเกิด ต้องโค่นบอสให้สำเร็จ
          │
          ▼
[ Run Complete / Defeat ]
  └── ได้รับ Gold, นำอุปกรณ์ที่ส่งผ่านบ่อน้ำมาให้ Wellkeeper ปลดล็อก, อัปเกรดถาวร
```

---

### 2. Character Classes & Roles (ระบบ 4 คลาสเริ่มต้นสำหรับ Co-op 4 คน)

| คลาส | อาวุธหลัก (Main Weapon) | บทบาทในทีม (Co-op Role) | จุดเด่นของสเตตัส |
| :--- | :--- | :--- | :--- |
| **Swordsman** | Greatsword Cleave (ฟันกวาดระยะประชิดมุมกว้าง) | **Vanguard / Frontliner** (เปิดทาง, ดูดความสนใจ) | HP สูง, Armor สูง, Base Attack Area กว้าง |
| **Archer** | Rapid Piercing Bow (ยิงทะลวงระยะไกลความเร็วสูง) | **Single-target / Boss Killer** | Attack Speed สูง, Crit Chance สูง, ระยะยิงไกล |
| **Sorceress** | Chain Lightning & Arcane Orbs (สายฟ้าชิ่งและบอลเวท) | **Crowd Control & AoE Damage** | Shock/Electrify status, กระจายดาเมจหมู่ |
| **Cleric** | Holy Smite & Aura (กระแทกคลื่นศักดิ์สิทธิ์ + ออร่าดีบัฟ) | **Support & Zone Control** | Affliction/Fragile debuffs, รัศมีป้องกันเพื่อน, ออร่าฮีล |

---

### 3. Combat Math & Formula (สูตรคำนวณดาเมจตาม Halls of Torment)

1. **Base Damage Calculation:**
   $$\text{FinalBaseDamage} = (\text{WeaponBaseDamage} + \text{FlatBonusDamage}) \times (1 + \text{PercentageDamageBonus})$$
   *หมายเหตุ: ค่า Flat Bonus (เช่น +5 Base Damage) มีผลมหาศาลเพราะถูกนำไปคูณกับ % ทั้งหมด*

2. **Critical Hit Check:**
   * $\text{Random}(0, 1) \le \text{CritChance}$
   * $\text{Damage} = \text{FinalBaseDamage} \times (1 + \text{CritMultiplier})$ (โดยทั่วไป CritMultiplier เริ่มที่ 100% = ดาเมจ 2 เท่า)

3. **Status Effect Synergy:**
   * **Fragile (เปราะบาง):** เพิ่มความเสียหายจากการโจมตีตรง (Direct Damage) $+X\%$
   * **Affliction (ทุกข์ทรมาน):** เพิ่มความเสียหายจาก Damage over Time (DoT) $+X\%$
   * **Electrify (ช็อต):** เมื่อศัตรูถูกโจมตี จะสะท้อนสายฟ้ากระจายไปยังศัตรูข้างเคียง

---

### 4. Co-op Mechanics สำหรับ 4 ผู้เล่น (จุดชี้ชะตาความสนุก)

1. **Dynamic Swarm & Boss Scaling:**
   * เลือดศัตรู (HP Scaling): $+40\%$ ต่อนักผจญภัยที่เพิ่มขึ้น ($4\text{ คน} = +120\%$ HP ไม่ใช่ $400\%$ เพื่อให้เกมไม่หน่วงเกินไป)
   * จำนวนมอนสเตอร์ (Density Scaling): เพิ่มมอนสเตอร์ตามโซนที่ผู้เล่นกระจายตัวอยู่ (Dynamic Cluster Spawning)

2. **Shared EXP Orb Pool:**
   * EXP ไม่แย่งกัน: เมื่อผู้เล่นคนใดคนหนึ่งเดินเก็บลูกแก้ว EXP ทุกคนในทีมจะได้ EXP เท่ากัน และหน้าจอ Level Up จะเด้งให้เลือกการ์ดแยกกันตามคลาสตัวเอง

3. **Soul Beacon (ระบบชุบชีวิตเพื่อน):**
   * เมื่อเพื่อนเลือดหมด จะกลายเป็น "Soul Crystal" (วิญญาณ) ลอยอยู่กับที่
   * เพื่อนร่วมทีมต้องเข้าไปยืนในวงล้อมเป็นเวลา 5 วินาที เพื่อชุบชีวิต (โดยระหว่างยืนชุบ มอนสเตอร์จะวิ่งมารุมรอบวง)

4. **Wellkeeper Shared Haul:**
   * เมื่อเจอบ่อน้ำกลางด่าน ใครเป็นคนส่งอุปกรณ์ขึ้นบ่อน้ำ สมาชิกทุกคนในห้องจะได้รับสิทธิ์ในการซื้ออุปกรณ์ชิ้นนั้นที่แคมป์เช่นกัน

---

## ภาคที่ 2: สถาปัตยกรรมสร้างเกม 100% ผ่าน Antigravity (Code-First Architecture)

เพื่อให้ Antigravity สามารถ **สร้าง คอมไพล์ รัน และแก้บั๊กได้แบบ 100%** โดยผู้ใช้ไม่ต้องแตะโปรแกรมกราฟิกภายนอก เราจะใช้สถาปัตยกรรม **Web-Native 3D + Node.js Authoritative Engine**

```
+-------------------------------------------------------------------------+
|                              CLIENT (Browser)                           |
|  +--------------------------+  +-------------------------------------+  |
|  |   Three.js 3D Engine     |  |          HTML5 / Canvas UI          |  |
|  | - InstancedMesh (Horde)  |  | - HUD, Health Bars, Skill Cards    |  |
|  | - Custom PBR/Toon Shader |  | - Damage Numbers (CSS2D/Canvas)     |  |
|  | - Bloom & Dark Tone Post |  +-------------------------------------+  |
|  +--------------------------+                     ▲                     |
|               ▲                                   │                     |
|               │ Client Interpolation (60 FPS)     │ Trait Selection     |
+---------------┼───────────────────────────────────┼---------------------+
                │                                   │
      WebSocket │ Binary Stream (20-30 Hz)          │
                ▼                                   ▼
+-------------------------------------------------------------------------+
|                           SERVER (Node.js / TS)                         |
|  +-------------------------------------------------------------------+  |
|  | Spatial Hash Grid (O(1) Collision for 2,000+ Entities)            |  |
|  | Horde Spawner & Wave Director (Time-based Spawn Tables)            |  |
|  | Combat Math & Damage Resolver (Authoritative HP & EXP)             |  |
|  | Room State Manager (Lobby, 1-4 Player Sessions, Reconnect)        |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

### 1. เทคนิคกราฟิก "ภาพสวยกว่า Halls of Torment" ด้วย Three.js Code
1. **Three.js Post-Processing Pipeline:**
   * `UnrealBloomPass`: สร้างแสงฟุ้งที่เรืองแสงออกมาจากกระสุนเวทมนตร์, รอยฟันดาบ, และลูกแก้ว EXP
   * `ShaderPass (Vignette & Color Grading)`: โทนสีมืดมน หม่น คอนทราสต์จัดสไตล์ Dark Fantasy
   * `THREE.FogExp2`: หมอกดำคลุมบรรยากาศรอบนอกจอ
2. **Horde Performance ด้วย `THREE.InstancedMesh`:**
   * ศัตรูชนิดเดียวกัน 1,000 ตัว วาดใน **Draw Call เดียว**!
   * ข้อมูล Matrix ตำแหน่ง หมุน และสเกล ถูกแพ็กส่งเข้า GPU Direct Memory
3. **Procedural 3D Models & Shaders:**
   * Antigravity เขียน Code สร้างโมเดล 3D Stylized (โครงกระดูก อัศวิน ปีศาจ) พร้อมอนิเมชั่นแกว่งดาบและกระสุนเวท โดยไม่ต้องพึ่งพาไฟล์ภายนอกในเฟสแรก และสามารถเปลี่ยนใส่โมเดล `.gltf` สวยๆ ได้ภายหลัง

### 2. เทคนิคเน็ตเวิร์ก 4 คน มอนสเตอร์ 2,000 ตัวไม่แล็ก
* **Server-Authoritative with Spatial Hash Grid:**
  * ฝั่ง Server ทำงานที่ 20-30 Ticks/วินาที แบ่งแผนที่เป็นตาราง Grid ช่องละ $64\times64$ units ทำให้การตรวจจับการโดนดาเมจใช้เวลาเพียง $O(1)$
* **Binary Packed State Sync:**
  * ข้อมูลมอนสเตอร์จะไม่ส่ง JSON แต่ส่งเป็น **TypedArray (Uint8 / Int16)**:
    `[EntityID(2 bytes), PosX(2 bytes), PosY(2 bytes), HP%(1 byte), State(1 byte)]` = **เพียง 8 bytes ต่อมอนสเตอร์ 1 ตัว!**
  * ฝั่ง Client นำพิกัดมาทำ **Linear Interpolation (Lerp)** วิ่งเนียนกริบ 60 FPS บนหน้าจอ

---

## ภาคที่ 3: สรุปข้อดีของการพัฒนาด้วยวิธีนี้

1. **Zero Setup Pain:** ไม่ต้องติดตั้ง Unity, Unreal หรือโหลด Engine ขนาด 40GB
2. **Instant Multi-tab Testing:** Antigravity สั่งรันคำสั่งเดียว คุณเปิด Chrome 4 แท็บ แบ่งจอเล่นทดสอบ Co-op 4 คนได้ทันทีบนเครื่องตัวเอง
3. **Export to Steam Ready:** โค้ดทั้งหมดสามารถห่อหุ้มด้วย **Tauri** เพื่อส่งออกเป็นไฟล์ `.exe` สำหรับปล่อยขายบน Steam ได้ 100%
