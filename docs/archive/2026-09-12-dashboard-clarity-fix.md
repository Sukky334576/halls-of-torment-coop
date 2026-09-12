# SPEC — Telemetry Dashboard Clarity Fix

> สถานะ: **เสร็จสมบูรณ์** (2026-09-12) | ประเภท: UX improvement (front-end) + เพิ่ม backend query field
> ที่มา: user report ตรง ("ดูแล้วก็ยังงงว่าจะเอามาใช้ทำไมบางค่า มันอ้างอิงหรือวิเคราะห์อะไรไม่ได้เลย")

## Requirement crack

ถามยืนยันจุดที่งงก่อนแก้ (ตาม Working Process ข้อ 0.1 — ห้ามเดา) แบ่งเป็น 2 รอบเพราะ user เพิ่มจุดเข้ามาระหว่างทำ:

**รอบ 1** — อ่าน source `admin/telemetry-dashboard.html` จริงก่อนถาม (ไม่เดาว่าจุดไหนงง) แล้วเสนอ 3
สมมติฐานพร้อมหลักฐาน `(file:line)` ให้ user เลือก user ยืนยันทั้ง 3 ข้อ:
1. ตัวเลขไม่มี sample size/N กำกับเลย
2. "จำนวนเกมที่จบแล้ว" ซ่อนข้อมูลชนะ/แพ้ไว้ข้างใน (อยู่คนละ section กับ pie chart ผลจบเกม)
3. ไม่มีตัวชี้ confidence — ตาราง pick-rate ไฮไลต์สีจาก % อย่างเดียว ไม่สนใจว่าตัวอย่างมีกี่ครั้ง

**รอบ 2** (เพิ่มระหว่างทำ) — user ชี้จุดเพิ่ม: กราฟ "จำนวน Event แยกตามประเภท" สอง bar คือ
"เลือกการ์ดเลเวลอัพ" กับ "ฆ่าบอสสำเร็จ" ก็งงเหมือนกัน ถามต่อจนได้คำตอบชัด:
- level_up_choice: "เอามาแสดงแล้วจะช่วยอะไร ไม่รู้ว่ามีไว้ทำอะไร/ตัดสินใจอะไรได้"
- boss_kill: "หมายถึงบอสตัวไหน ทั้งหมดหรอ"

## การวิเคราะห์ + แก้ (front-end only, `admin/telemetry-dashboard.html`)

### 1. เพิ่ม win/loss breakdown ที่การ์ด "จำนวนเกมที่จบแล้ว"
เพิ่ม `<div class="stat-sub" id="stat-total-runs-sub">` เซ็ตค่าจาก `events.runOutcomes` (ข้อมูลชุด
เดียวกับที่ pie chart "ผลจบเกม" ใช้อยู่แล้ว — ไม่ต้องเรียก API เพิ่ม) format: `ชนะ N · แพ้ทั้งทีม N · ...`
ใช้ `OUTCOME_LABELS` เดิม ไม่ fix แค่ win/loss เพราะเกมมี outcome 4 แบบ (`victory`/`wipe`/`surrender`/
`boss_enrage_execute`) การ hardcode แค่ 2 แบบจะซ่อนข้อมูลอีก 2 แบบเหมือนปัญหาเดิม

### 2. เพิ่ม N กำกับที่การ์ด "เวลาเล่นเฉลี่ยต่อเกม"
เพิ่ม sub-text `จาก N เกม` ใช้ `events.totalRunEnds` เดิม

### 3. Threshold "ตัวอย่างน้อยเกินไป" ในตาราง pick-rate การ์ด
เสนอ 3 ทางเลือก (< 5 / < 10 / < 20 ครั้งที่เสนอ) user เลือก **< 10 ครั้ง** แถวที่ `timesOffered < 10`
เปลี่ยนจากไฮไลต์สี `pick-low`/`pick-high` ตามปกติ เป็น `opacity: 0.45` ทั้งแถว (class `low-confidence`)
แทน — ไม่ไฮไลต์สีใดๆ เพราะยังไม่น่าเชื่อพอจะบอกว่าต่ำ/สูงจริง เพิ่ม legend บรรทัดเดียวเหนือตารางอธิบาย
threshold ตรงๆ

### 4. ตัด `level_up_choice` ออกจากกราฟ "จำนวน Event แยกตามประเภท"
Pattern เดียวกับที่ `wave_reached` เคยถูกตัดออกไปแล้ว (ดู §5.7.3/Change Log 2026-09-12 รอบก่อน) — raw
count ของ event ประเภทนี้ไม่ actionable เอง เพราะ breakdown ที่มีประโยชน์จริง (การ์ดไหนถูกเสนอ/เลือก)
อยู่ในตาราง "สถิติการเลือกการ์ด" อยู่แล้วแยกต่างหาก

### 5. เพิ่ม breakdown "ฆ่าบอสสำเร็จ (แยกตามตัวบอส)" — ต้องแก้ backend
ตรวจสอบ `GameRoom.ts:2777` พบว่า event `boss_kill` เก็บ `bossName` มาด้วยอยู่แล้วทุกครั้ง (เช่น
"Elite Golem", "Elite Void Guardian") แต่ `getEventSummary()` (`telemetryQueries.ts`) เดิมนับรวมเป็น
ก้อนเดียวใน `eventCounts.boss_kill` ทิ้ง `bossName` ไป — ข้อมูลมีอยู่แล้วแค่ไม่ถูกใช้ แก้โดย:
- เพิ่ม `BossKillCount { bossName, count }` + field `bossKills: BossKillCount[]` ใน `EventSummary`
  (pattern เดียวกับ `DeathCauseCount`/`deathCauses` ที่มีอยู่แล้ว)
- Parse `payload.bossName` จาก event type `boss_kill` ใน loop เดิม, fallback เป็น `` `type ${bossType}` ``
  ถ้า `bossName` หายไป (กัน row เก่าก่อน field นี้ถูกเพิ่มไม่ให้หายไปเงียบๆ)
- ตัด `boss_kill` ออกจากกราฟ "จำนวน Event แยกตามประเภท" ด้วย (เหตุผลเดียวกับ #4 — จะซ้ำซ้อนกับกราฟ
  breakdown ใหม่ที่แทนที่)
- เพิ่มกราฟแท่งใหม่ "ฆ่าบอสสำเร็จ (แยกตามตัวบอส)" (`chart-boss-kills`) ในหน้า dashboard

## Test

- `src/server/telemetry/telemetryQueries.test.ts` — เพิ่ม 2 case: `bossKills` แยกกลุ่มถูกต้องตาม
  `bossName` (sort มาก→น้อยเหมือน `deathCauses`), fallback เป็น `type {bossType}` เมื่อไม่มี `bossName`
  ในแถวเก่า
- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ **95/95** (93 เดิม + 2 ใหม่)
- Manual verify ผ่าน browser preview: inject mock `data` object เข้า `renderDashboard()` ตรงๆ (ข้าม
  auth gate เพราะไม่มี live server/telemetry.db ในรอบตรวจนี้) ยืนยัน:
  - `stat-total-runs-sub` แสดง `ชนะ 3 · แพ้ทั้งทีม 8 · ยอมแพ้ 1` ถูกต้องจาก mock `runOutcomes`
  - `stat-avg-playtime-sub` แสดง `จาก 12 เกม` ถูกต้อง
  - แถวการ์ดที่ `timesOffered: 2` ได้ class `low-confidence` + cell สีไม่ถูกไฮไลต์, แถวที่
    `timesOffered: 40` ยังไฮไลต์ตามปกติ
  - `chart-event-counts` labels เหลือแค่ event type อื่นที่ไม่ใช่ `wave_reached`/`level_up_choice`/
    `boss_kill`
  - `chart-boss-kills` แสดง labels/data ตรงกับ mock `bossKills` ถูกต้อง
  - ไม่มี console error

## เอกสารที่อัปเดต

`GAME_WIKI.md` (§5.7.1 เพิ่ม bug note, §5.7.3 sync กับ field ใหม่, Change Log)
