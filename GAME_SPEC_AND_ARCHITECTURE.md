# 📜 GAME SPECIFICATION & 100% AI ARCHITECTURE
## Project: Torment of Souls (Dark Fantasy 4-Player Horde Survival)
*Inspired by Halls of Torment & Diablo II — Enhanced with Modern 3D Visuals & 4-Player Co-op*

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
