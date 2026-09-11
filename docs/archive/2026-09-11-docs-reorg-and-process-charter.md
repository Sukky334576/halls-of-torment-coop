# [Archived] Docs Reorg + Project Working Process Charter

**วันที่**: 2026-09-11
**ประเภทงาน**: documentation-only / process setup (ไม่แตะ game code)

## Requirement (จาก user)

1. ผู้ใช้กำหนด Working Process ฉบับเต็ม (ข้อ 0-5 + กฎ "ห้ามข้ามเด็ดขาด" + Self-Check) ให้ยึดทุกครั้งจากนี้ไป
2. ยืนยันให้เก็บ charter นี้เป็นไฟล์ถาวรในโปรเจกต์ (`CLAUDE.md`) แทนที่จะอยู่ในแชทอย่างเดียว
3. รวม spec เดิมที่รออนุมัติอยู่ (ย้าย `GAME_WIKI.md` / `GAME_BLUEPRINT.md` / `APPENDIX_SKILLTREE.md` / `APPENDIX_TRAITPOOL.md` เข้า `docs/` ตามโครงสร้างใหม่ในข้อ 3 ของ charter) เข้ามาทำพร้อมกัน

## Spec ที่อนุมัติแล้ว

- `mkdir -p docs/archive`
- ย้าย 4 ไฟล์เอกสาร (untracked, ยังไม่เคย commit) จาก repo root เข้า `docs/` ด้วย `mv` (ใช้ `git mv` ไม่ได้เพราะไฟล์ยังไม่ถูก track)
- เพิ่ม Change Log table หัวไฟล์ทั้ง 4 ไฟล์ ตาม format ในข้อ 3 ของ charter
- เขียน `CLAUDE.md` ที่ root ของ repo รวม charter ทั้งหมด (โหลดอัตโนมัติทุก session ต่อจากนี้)

## สิ่งที่ทำจริง

- สร้าง `docs/` + `docs/archive/`
- ย้าย 4 ไฟล์เข้า `docs/` — ตรวจแล้วว่า relative cross-link ระหว่างไฟล์ (`./GAME_WIKI.md`, `./APPENDIX_SKILLTREE.md`, `./APPENDIX_TRAITPOOL.md`) ยังใช้งานได้ปกติเพราะทุกไฟล์ย้ายไปอยู่ dir เดียวกัน
- เพิ่ม Change Log table หัวไฟล์ทั้ง 4 ไฟล์ (entry แรก: สร้างเอกสารครั้งแรกเมื่อ 2026-09-11)
- สร้าง `CLAUDE.md` ที่ root โดยคัดลอก charter ทั้งหมดจากคำสั่ง user แบบคำต่อคำ (ข้อ 0-5, กฎห้ามข้าม, Self-Check)

## Risk/Edge case ที่เช็คแล้ว

- ไฟล์ทั้ง 4 เป็น untracked ตั้งแต่แรก ไม่มี CI/deploy/โค้ดส่วนไหนอ้างอิง path เดิมที่ root จึงย้ายได้โดยไม่กระทบระบบอื่น
- ตรวจ `git status` ก่อนย้าย ยืนยันไม่มีงานค้างอื่นที่จะหาย

## Test/Verify

- `ls docs/` ยืนยันไฟล์ครบ 4 ไฟล์ + โฟลเดอร์ `archive/`
- เปิดอ่านบรรทัดแรกของแต่ละไฟล์ยืนยัน Change Log table ถูกแทรกถูกตำแหน่ง (ใต้ title/intro blockquote)

## Patch Note

**N/A** — งานนี้เป็นการจัดโครงสร้างเอกสาร + ตั้งกฎการทำงานภายในทีมล้วนๆ ไม่มีการเปลี่ยนแปลง game code/gameplay ใดๆ จึงไม่มีเนื้อหาที่เกี่ยวข้องกับผู้เล่นให้โพสต์ (ไม่ใช่การข้ามขั้นตอน แต่ระบุชัดว่าไม่มี player-facing content ในงานนี้)

## Developer Update

```
🔧 Dev Update — 2026-09-11
สิ่งที่ทำ
จัดโครงสร้างเอกสารโปรเจกต์ใหม่ตาม process charter ที่ทีมกำหนด: ย้าย GAME_WIKI.md, GAME_BLUEPRINT.md, APPENDIX_SKILLTREE.md, APPENDIX_TRAITPOOL.md เข้าโฟลเดอร์ docs/ พร้อมเพิ่ม Change Log table หัวไฟล์ และเพิ่ม CLAUDE.md ที่ root เก็บ working process ทั้งหมดให้โหลดอัตโนมัติทุก session

Stability Risk ที่กระทบ
ไม่มี — งานนี้ไม่แตะ game code ใดๆ

Test ที่ทำ
ตรวจ git status ก่อน/หลังย้ายไฟล์, ตรวจ cross-link ระหว่างเอกสารยังเปิดได้ปกติ

เอกสารที่อัปเดต
docs/GAME_WIKI.md, docs/GAME_BLUEPRINT.md, docs/APPENDIX_SKILLTREE.md, docs/APPENDIX_TRAITPOOL.md (เพิ่ม Change Log), CLAUDE.md (ใหม่), spec นี้ archive ไว้ที่ docs/archive/2026-09-11-docs-reorg-and-process-charter.md
```
