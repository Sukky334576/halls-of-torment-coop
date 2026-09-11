# 📐 Appendix: Skill Tree เต็มทุก Node

> ภาคผนวกของ GAME_BLUEPRINT.md — ข้อมูลดิบเต็มจาก src/shared/skillTreeData.ts ทุก node ไม่มีการตัดทอน
> สร้างโดยสคริปต์ import CLASS_SKILL_TREES จริงจาก source แล้ว dump ทุก field + BFS/DFS หาทุก simple path จาก root ไป keystone จริงบน connections graph (ไม่ได้ไล่ตาด้วยมือ)

## Change Log

| วันที่ | สรุปสิ่งที่เปลี่ยน | เหตุผล/อ้างอิง commit หรือ prompt ที่สั่ง |
|---|---|---|
| 2026-09-11 | สร้างเอกสารครั้งแรก (dump ครบ 418 node ทุกคลาส + text-tree ทุก root→keystone path) | คำสั่ง user: เติม APPENDIX_SKILLTREE.md ให้ครบตาม GAME_BLUEPRINT.md |

## สารบัญ

- [Swordsman](#swordsman)
- [Sorceress](#sorceress)
- [Archer](#archer)
- [Cleric](#cleric)
- [Commando](#commando)
- [Cat Tank](#cat-tank)
- [Cowboy](#cowboy)
- [Celestial Mecha](#celestial-mecha)
- [Gambler](#gambler)
- [Universal](#universal)

<a id="swordsman"></a>
## Swordsman (rootId: sw_root, 60 nodes)

_title: The Steel Bulwark — 3 Archetype Mastery Web / กำแพงเหล็กกล้า — สายพลังแห่งความเชี่ยวชาญ 3 อาชีพ_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| sw_root | หัวใจเหล็กกล้า / Heart of Iron | root | sw_universal_reach, sw_universal_bulk, sw_universal_focus, sw_universal_haste | 0 | maxHp:10 | — |
| sw_universal_reach | ระยะเอื้อมพื้นฐานสากล / Universal Reach | minor | sw_root, sw_atk_spd_1 | 45 | pickupRadius:0.4 | — |
| sw_universal_bulk | ความหนาแน่นพื้นฐานสากล / Universal Bulk | minor | sw_root, sw_dmg_1 | 45 | defense:1 | — |
| sw_universal_focus | สมาธิพื้นฐานสากล / Universal Focus | minor | sw_root, sw_def_1 | 45 | expMultiplier:3 | — |
| sw_universal_haste | ความไวพื้นฐานสากล / Universal Haste | minor | sw_root, sw_hp_1 | 45 | moveSpeed:0.3 | — |
| sw_atk_spd_1 | คมดาบลับคม / Honed Edge | minor | sw_universal_reach, sw_atk_spd_2, sw_dmg_1 | 50 | damageBonus:0.5 | — |
| sw_atk_spd_2 | เขี้ยวคมกริบ / Keener Bite | minor | sw_atk_spd_1, sw_universal_vigor_spark | 45 | damageBonus:0.5 | — |
| sw_universal_vigor_spark | ประกายพลังพื้นฐานสากล / Universal Vigor Spark | minor | sw_atk_spd_2, sw_bleed_minor_1 | 50 | maxHp:4 | — |
| sw_bleed_minor_1 | เขี้ยวฉีกเนื้อ / Lacerating Fang | minor | sw_universal_vigor_spark, sw_bleed_minor_2, sw_def_minor_1 | 55 | maxHp:5 | — |
| sw_bleed_minor_2 | บาดแผลเน่าร้าย / Festering Gash | minor | sw_bleed_minor_1, sw_universal_vigor | 55 | maxHp:5 | — |
| sw_universal_vigor | พลังพื้นฐานสากล / Universal Vigor | minor | sw_bleed_minor_2, swordsman_whirlwind | 60 | maxHp:6 | — |
| swordsman_whirlwind | พายุหมุนคมดาบ / Blade Whirlwind | notable | sw_universal_vigor, sw_bleed_filler_1 | 360 | — [element: physical_bleed] | swordsman_whirlwind |
| sw_bleed_filler_1 | โทสะเลือดพลุ่ง / Hemorrhagic Fury | minor | swordsman_whirlwind, sw_rend_tear | 150 | maxHp:8 | — |
| sw_rend_tear | ฉีกและกระชาก / Rend & Tear | notable | sw_bleed_filler_1, sw_bleed_filler_2 | 380 | — [element: physical_bleed] | sw_rend_tear |
| sw_bleed_filler_2 | โจมตีสูบเลือดจนแห้ง / Exsanguinating Strikes | minor | sw_rend_tear, sw_keystone_bleed | 180 | damageBonus:0.5 | — |
| sw_keystone_bleed | หายนะสีเลือด / Crimson Cataclysm | keystone | sw_bleed_filler_2, sw_keystone_reckless_bloodlust, sw_keystone_bleed_asc1 | 780 | maxHp:30, damageBonus:2 | — |
| sw_keystone_reckless_bloodlust | กระหายเลือดไม่ยั้งคิด / Reckless Bloodlust | keystone | sw_keystone_bleed | 950 | damageBonus:3, defense:-3 [modType: more] | — |
| sw_keystone_bleed_asc1 | หายนะขั้นสูง / Greater Cataclysm | minor | sw_keystone_bleed, sw_keystone_bleed_asc2 | 275 | maxHp:9, damageBonus:0.5 | — |
| sw_keystone_bleed_asc2 | หายนะเหนือขีดจำกัด / Transcendent Cataclysm | keystone | sw_keystone_bleed_asc1 | 1010 | maxHp:30, damageBonus:2 | — |
| sw_dmg_1 | เหล็กกล้าผ่านการชุบ / Tempered Steel | minor | sw_universal_bulk, sw_atk_spd_1, sw_dmg_2 | 50 | damageBonus:0.5 | — |
| sw_dmg_2 | ชุบคมกริบ / Razor Temper | minor | sw_dmg_1, sw_universal_swift_spark | 45 | damageBonus:0.5 | — |
| sw_universal_swift_spark | ประกายความเร็วพื้นฐานสากล / Universal Swiftness Spark | minor | sw_dmg_2, sw_sonic_minor_1 | 50 | moveSpeed:0.3 | — |
| sw_sonic_minor_1 | คมสั่นสะเทือน / Vibrating Edge | minor | sw_universal_swift_spark, sw_sonic_minor_2, sw_speed_1 | 55 | moveSpeed:0.5 | — |
| sw_sonic_minor_2 | ก้าวย่างกังวาน / Resonant Step | minor | sw_sonic_minor_1, sw_universal_swift | 55 | moveSpeed:0.5 | — |
| sw_universal_swift | ความเร็วพื้นฐานสากล / Universal Swiftness | minor | sw_sonic_minor_2, swordsman_shockwave | 60 | moveSpeed:0.5 | — |
| swordsman_shockwave | ฟันคลื่นกระแทก / Shockwave Slash | notable | sw_universal_swift, sw_sonic_filler_1 | 380 | — [element: physical_bleed] | swordsman_shockwave |
| sw_sonic_filler_1 | โอเวอร์โหลดเสียงสะท้อน / Harmonic Overload | minor | swordsman_shockwave, sw_blade_beam | 150 | damageBonus:0.5 | — |
| sw_blade_beam | กระหน่ำลำแสงคมดาบ / Blade Beam Volley | notable | sw_sonic_filler_1, sw_sonic_filler_2 | 400 | — [element: physical_bleed] | sw_blade_beam |
| sw_sonic_filler_2 | ความถี่ทะลุทะลวง / Piercing Frequency | minor | sw_blade_beam, sw_keystone_shockwave | 180 | moveSpeed:0.5 | — |
| sw_keystone_shockwave | เสียงกังวานแยกสลาย / Sundering Resonance | keystone | sw_sonic_filler_2, sw_keystone_overcharged_reflexes, sw_keystone_shockwave_asc1 | 800 | damageBonus:2 | — |
| sw_keystone_overcharged_reflexes | ปฏิกิริยาตอบสนองเกินขีดจำกัด / Overcharged Reflexes | keystone | sw_keystone_shockwave | 950 | moveSpeed:5, maxHp:-30 [modType: more] | — |
| sw_keystone_shockwave_asc1 | เสียงกังวานขั้นสูง / Greater Resonance | minor | sw_keystone_shockwave, sw_keystone_shockwave_asc2 | 280 | damageBonus:0.5 | — |
| sw_keystone_shockwave_asc2 | เสียงกังวานเหนือขีดจำกัด / Transcendent Resonance | keystone | sw_keystone_shockwave_asc1 | 1040 | damageBonus:2 | — |
| sw_def_1 | เกราะกระดองหิน / Carapace of Stone | minor | sw_universal_focus, sw_def_2, sw_hp_1 | 50 | defense:0.5 | — |
| sw_def_2 | เกล็ดแข็งแกร่ง / Hardened Scale | minor | sw_def_1, sw_universal_ward_spark | 45 | defense:0.5 | — |
| sw_universal_ward_spark | ประกายการป้องกันพื้นฐานสากล / Universal Warding Spark | minor | sw_def_2, sw_def_minor_1 | 50 | defense:1 | — |
| sw_def_minor_1 | เกราะลวดหนาม / Barbed Mail | minor | sw_bleed_minor_1, sw_universal_ward_spark, sw_def_minor_2 | 60 | defense:0.5, maxHp:5 | — |
| sw_def_minor_2 | แผ่นเกราะหนาม / Thorned Plating | minor | sw_def_minor_1, sw_universal_ward | 55 | defense:0.5, maxHp:5 | — |
| sw_universal_ward | การป้องกันพื้นฐานสากล / Universal Warding | minor | sw_def_minor_2, swordsman_retaliation | 60 | defense:1 | — |
| swordsman_retaliation | การตอบโต้เหล็กกล้า / Iron Retaliation | notable | sw_universal_ward, sw_def_filler_1 | 350 | — [element: physical_bleed] | swordsman_retaliation |
| sw_def_filler_1 | ร่างกายไม่ย่อท้อ / Unyielding Bulk | minor | swordsman_retaliation, sw_fortress_stance | 150 | maxHp:8 | — |
| sw_fortress_stance | ท่าประจัญบานป้อมปราการ / Fortress Stance | notable | sw_def_filler_1, sw_def_filler_2 | 390 | — [element: physical_bleed] | sw_fortress_stance |
| sw_def_filler_2 | ปณิธานแห่งป้อมปราการ / Bastion's Resolve | minor | sw_fortress_stance, sw_keystone_juggernaut | 180 | defense:1 | — |
| sw_keystone_juggernaut | ป้อมปราการอมตะ / Immortal Bastion | keystone | sw_def_filler_2, sw_keystone_leaden_bulwark, sw_keystone_juggernaut_asc1 | 820 | defense:2, maxHp:35 | — |
| sw_keystone_leaden_bulwark | ปราการเหล็กหนัก / Leaden Bulwark | keystone | sw_keystone_juggernaut | 950 | defense:6, moveSpeed:-4 [modType: more] | — |
| sw_keystone_juggernaut_asc1 | ป้อมปราการขั้นสูง / Greater Bastion | minor | sw_keystone_juggernaut, sw_keystone_juggernaut_asc2 | 285 | maxHp:11, defense:0.5 | — |
| sw_keystone_juggernaut_asc2 | ป้อมปราการเหนือขีดจำกัด / Transcendent Bastion | keystone | sw_keystone_juggernaut_asc1 | 1070 | maxHp:35, defense:2 | — |
| sw_hp_1 | เถาวัลย์แห่งชีวิต / Vitality Tendril | minor | sw_universal_haste, sw_def_1, sw_hp_2 | 50 | maxHp:8 | — |
| sw_hp_2 | เส้นเลือดแตกหน่อ / Sprouting Vein | minor | sw_hp_1, sw_speed_1 | 45 | maxHp:7 | — |
| sw_speed_1 | ก้าวทัพหน้า / Vanguard Stride | minor | sw_sonic_minor_1, sw_hp_2, sw_speed_2 | 50 | moveSpeed:0.5 | — |
| sw_speed_2 | พุ่งทะยานเท้าไว / Fleetfoot Charge | minor | sw_speed_1, sw_universal_insight_spark | 50 | moveSpeed:0.5 | — |
| sw_universal_insight_spark | ประกายปัญญาพื้นฐานสากล / Universal Insight Spark | minor | sw_speed_2, sw_magnet_1 | 50 | expMultiplier:3 | — |
| sw_magnet_1 | แม่เหล็กวิญญาณ / Soul Magnet | minor | sw_universal_insight_spark, sw_magnet_2 | 55 | pickupRadius:0.5 | — |
| sw_magnet_2 | แรงดึงจากหลุมศพ / Gravebound Pull | minor | sw_magnet_1, sw_blood_siphon | 55 | pickupRadius:0.5 | — |
| sw_blood_siphon | ดูดกลืนกระหายเลือด / Bloodthirsty Siphon | notable | sw_magnet_2, sw_warlord_filler_1 | 370 | — [element: physical_bleed] | sw_blood_siphon |
| sw_warlord_filler_1 | โมเมนตัมขุนศึก / Warlord's Momentum | minor | sw_blood_siphon, sw_keystone_warlord | 180 | maxHp:8 | — |
| sw_keystone_warlord | ขุนศึกนิรันดร์ / Eternal Warlord | keystone | sw_warlord_filler_1, sw_keystone_gilded_greed, sw_keystone_warlord_asc1 | 800 | pickupRadius:1, maxHp:20, damageBonus:1 | — |
| sw_keystone_gilded_greed | ความโลภสีทอง / Gilded Greed | keystone | sw_keystone_warlord | 950 | expMultiplier:25, maxHp:-25 [modType: more] | — |
| sw_keystone_warlord_asc1 | ขุนศึกขั้นสูง / Greater Warlord | minor | sw_keystone_warlord, sw_keystone_warlord_asc2 | 280 | maxHp:6, pickupRadius:0.5, damageBonus:0.5 | — |
| sw_keystone_warlord_asc2 | ขุนศึกเหนือขีดจำกัด / Transcendent Warlord | keystone | sw_keystone_warlord_asc1 | 1040 | maxHp:20, pickupRadius:1, damageBonus:1 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → sw_keystone_bleed (หายนะสีเลือด / Crimson Cataclysm, cost 780)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_bleed_minor_2 (cost 55)
                                   └─ sw_universal_vigor (cost 60)
                                        └─ swordsman_whirlwind [notable] (cost 360)
                                             └─ sw_bleed_filler_1 (cost 150)
                                                  └─ sw_rend_tear [notable] (cost 380)
                                                       └─ sw_bleed_filler_2 (cost 180)
                                                            └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_bleed_minor_2 (cost 55)
                                        └─ sw_universal_vigor (cost 60)
                                             └─ swordsman_whirlwind [notable] (cost 360)
                                                  └─ sw_bleed_filler_1 (cost 150)
                                                       └─ sw_rend_tear [notable] (cost 380)
                                                            └─ sw_bleed_filler_2 (cost 180)
                                                                 └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_bleed_minor_2 (cost 55)
                                        └─ sw_universal_vigor (cost 60)
                                             └─ swordsman_whirlwind [notable] (cost 360)
                                                  └─ sw_bleed_filler_1 (cost 150)
                                                       └─ sw_rend_tear [notable] (cost 380)
                                                            └─ sw_bleed_filler_2 (cost 180)
                                                                 └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_bleed_minor_2 (cost 55)
                                             └─ sw_universal_vigor (cost 60)
                                                  └─ swordsman_whirlwind [notable] (cost 360)
                                                       └─ sw_bleed_filler_1 (cost 150)
                                                            └─ sw_rend_tear [notable] (cost 380)
                                                                 └─ sw_bleed_filler_2 (cost 180)
                                                                      └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_universal_swift_spark (cost 50)
                                   └─ sw_dmg_2 (cost 45)
                                        └─ sw_dmg_1 (cost 50)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_atk_spd_2 (cost 45)
                                                       └─ sw_universal_vigor_spark (cost 50)
                                                            └─ sw_bleed_minor_1 (cost 55)
                                                                 └─ sw_bleed_minor_2 (cost 55)
                                                                      └─ sw_universal_vigor (cost 60)
                                                                           └─ swordsman_whirlwind [notable] (cost 360)
                                                                                └─ sw_bleed_filler_1 (cost 150)
                                                                                     └─ sw_rend_tear [notable] (cost 380)
                                                                                          └─ sw_bleed_filler_2 (cost 180)
                                                                                               └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_hp_2 (cost 45)
                                        └─ sw_hp_1 (cost 50)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_def_2 (cost 45)
                                                       └─ sw_universal_ward_spark (cost 50)
                                                            └─ sw_def_minor_1 (cost 60)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_bleed_minor_2 (cost 55)
                                                                           └─ sw_universal_vigor (cost 60)
                                                                                └─ swordsman_whirlwind [notable] (cost 360)
                                                                                     └─ sw_bleed_filler_1 (cost 150)
                                                                                          └─ sw_rend_tear [notable] (cost 380)
                                                                                               └─ sw_bleed_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_universal_swift_spark (cost 50)
                                        └─ sw_dmg_2 (cost 45)
                                             └─ sw_dmg_1 (cost 50)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_atk_spd_2 (cost 45)
                                                            └─ sw_universal_vigor_spark (cost 50)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_bleed_minor_2 (cost 55)
                                                                           └─ sw_universal_vigor (cost 60)
                                                                                └─ swordsman_whirlwind [notable] (cost 360)
                                                                                     └─ sw_bleed_filler_1 (cost 150)
                                                                                          └─ sw_rend_tear [notable] (cost 380)
                                                                                               └─ sw_bleed_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_hp_2 (cost 45)
                                             └─ sw_hp_1 (cost 50)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_def_2 (cost 45)
                                                            └─ sw_universal_ward_spark (cost 50)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_bleed_minor_1 (cost 55)
                                                                           └─ sw_bleed_minor_2 (cost 55)
                                                                                └─ sw_universal_vigor (cost 60)
                                                                                     └─ swordsman_whirlwind [notable] (cost 360)
                                                                                          └─ sw_bleed_filler_1 (cost 150)
                                                                                               └─ sw_rend_tear [notable] (cost 380)
                                                                                                    └─ sw_bleed_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_bleed [KEYSTONE] (cost 780)
```

#### → sw_keystone_reckless_bloodlust (กระหายเลือดไม่ยั้งคิด / Reckless Bloodlust, cost 950)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_bleed_minor_2 (cost 55)
                                   └─ sw_universal_vigor (cost 60)
                                        └─ swordsman_whirlwind [notable] (cost 360)
                                             └─ sw_bleed_filler_1 (cost 150)
                                                  └─ sw_rend_tear [notable] (cost 380)
                                                       └─ sw_bleed_filler_2 (cost 180)
                                                            └─ sw_keystone_bleed (cost 780)
                                                                 └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_bleed_minor_2 (cost 55)
                                        └─ sw_universal_vigor (cost 60)
                                             └─ swordsman_whirlwind [notable] (cost 360)
                                                  └─ sw_bleed_filler_1 (cost 150)
                                                       └─ sw_rend_tear [notable] (cost 380)
                                                            └─ sw_bleed_filler_2 (cost 180)
                                                                 └─ sw_keystone_bleed (cost 780)
                                                                      └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_bleed_minor_2 (cost 55)
                                        └─ sw_universal_vigor (cost 60)
                                             └─ swordsman_whirlwind [notable] (cost 360)
                                                  └─ sw_bleed_filler_1 (cost 150)
                                                       └─ sw_rend_tear [notable] (cost 380)
                                                            └─ sw_bleed_filler_2 (cost 180)
                                                                 └─ sw_keystone_bleed (cost 780)
                                                                      └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_bleed_minor_2 (cost 55)
                                             └─ sw_universal_vigor (cost 60)
                                                  └─ swordsman_whirlwind [notable] (cost 360)
                                                       └─ sw_bleed_filler_1 (cost 150)
                                                            └─ sw_rend_tear [notable] (cost 380)
                                                                 └─ sw_bleed_filler_2 (cost 180)
                                                                      └─ sw_keystone_bleed (cost 780)
                                                                           └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_universal_swift_spark (cost 50)
                                   └─ sw_dmg_2 (cost 45)
                                        └─ sw_dmg_1 (cost 50)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_atk_spd_2 (cost 45)
                                                       └─ sw_universal_vigor_spark (cost 50)
                                                            └─ sw_bleed_minor_1 (cost 55)
                                                                 └─ sw_bleed_minor_2 (cost 55)
                                                                      └─ sw_universal_vigor (cost 60)
                                                                           └─ swordsman_whirlwind [notable] (cost 360)
                                                                                └─ sw_bleed_filler_1 (cost 150)
                                                                                     └─ sw_rend_tear [notable] (cost 380)
                                                                                          └─ sw_bleed_filler_2 (cost 180)
                                                                                               └─ sw_keystone_bleed (cost 780)
                                                                                                    └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_hp_2 (cost 45)
                                        └─ sw_hp_1 (cost 50)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_def_2 (cost 45)
                                                       └─ sw_universal_ward_spark (cost 50)
                                                            └─ sw_def_minor_1 (cost 60)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_bleed_minor_2 (cost 55)
                                                                           └─ sw_universal_vigor (cost 60)
                                                                                └─ swordsman_whirlwind [notable] (cost 360)
                                                                                     └─ sw_bleed_filler_1 (cost 150)
                                                                                          └─ sw_rend_tear [notable] (cost 380)
                                                                                               └─ sw_bleed_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_bleed (cost 780)
                                                                                                         └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_universal_swift_spark (cost 50)
                                        └─ sw_dmg_2 (cost 45)
                                             └─ sw_dmg_1 (cost 50)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_atk_spd_2 (cost 45)
                                                            └─ sw_universal_vigor_spark (cost 50)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_bleed_minor_2 (cost 55)
                                                                           └─ sw_universal_vigor (cost 60)
                                                                                └─ swordsman_whirlwind [notable] (cost 360)
                                                                                     └─ sw_bleed_filler_1 (cost 150)
                                                                                          └─ sw_rend_tear [notable] (cost 380)
                                                                                               └─ sw_bleed_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_bleed (cost 780)
                                                                                                         └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_hp_2 (cost 45)
                                             └─ sw_hp_1 (cost 50)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_def_2 (cost 45)
                                                            └─ sw_universal_ward_spark (cost 50)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_bleed_minor_1 (cost 55)
                                                                           └─ sw_bleed_minor_2 (cost 55)
                                                                                └─ sw_universal_vigor (cost 60)
                                                                                     └─ swordsman_whirlwind [notable] (cost 360)
                                                                                          └─ sw_bleed_filler_1 (cost 150)
                                                                                               └─ sw_rend_tear [notable] (cost 380)
                                                                                                    └─ sw_bleed_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_bleed (cost 780)
                                                                                                              └─ sw_keystone_reckless_bloodlust [KEYSTONE] (cost 950)
```

#### → sw_keystone_bleed_asc2 (หายนะเหนือขีดจำกัด / Transcendent Cataclysm, cost 1010)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_bleed_minor_2 (cost 55)
                                   └─ sw_universal_vigor (cost 60)
                                        └─ swordsman_whirlwind [notable] (cost 360)
                                             └─ sw_bleed_filler_1 (cost 150)
                                                  └─ sw_rend_tear [notable] (cost 380)
                                                       └─ sw_bleed_filler_2 (cost 180)
                                                            └─ sw_keystone_bleed (cost 780)
                                                                 └─ sw_keystone_bleed_asc1 (cost 275)
                                                                      └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_bleed_minor_2 (cost 55)
                                        └─ sw_universal_vigor (cost 60)
                                             └─ swordsman_whirlwind [notable] (cost 360)
                                                  └─ sw_bleed_filler_1 (cost 150)
                                                       └─ sw_rend_tear [notable] (cost 380)
                                                            └─ sw_bleed_filler_2 (cost 180)
                                                                 └─ sw_keystone_bleed (cost 780)
                                                                      └─ sw_keystone_bleed_asc1 (cost 275)
                                                                           └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_bleed_minor_2 (cost 55)
                                        └─ sw_universal_vigor (cost 60)
                                             └─ swordsman_whirlwind [notable] (cost 360)
                                                  └─ sw_bleed_filler_1 (cost 150)
                                                       └─ sw_rend_tear [notable] (cost 380)
                                                            └─ sw_bleed_filler_2 (cost 180)
                                                                 └─ sw_keystone_bleed (cost 780)
                                                                      └─ sw_keystone_bleed_asc1 (cost 275)
                                                                           └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_bleed_minor_2 (cost 55)
                                             └─ sw_universal_vigor (cost 60)
                                                  └─ swordsman_whirlwind [notable] (cost 360)
                                                       └─ sw_bleed_filler_1 (cost 150)
                                                            └─ sw_rend_tear [notable] (cost 380)
                                                                 └─ sw_bleed_filler_2 (cost 180)
                                                                      └─ sw_keystone_bleed (cost 780)
                                                                           └─ sw_keystone_bleed_asc1 (cost 275)
                                                                                └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_universal_swift_spark (cost 50)
                                   └─ sw_dmg_2 (cost 45)
                                        └─ sw_dmg_1 (cost 50)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_atk_spd_2 (cost 45)
                                                       └─ sw_universal_vigor_spark (cost 50)
                                                            └─ sw_bleed_minor_1 (cost 55)
                                                                 └─ sw_bleed_minor_2 (cost 55)
                                                                      └─ sw_universal_vigor (cost 60)
                                                                           └─ swordsman_whirlwind [notable] (cost 360)
                                                                                └─ sw_bleed_filler_1 (cost 150)
                                                                                     └─ sw_rend_tear [notable] (cost 380)
                                                                                          └─ sw_bleed_filler_2 (cost 180)
                                                                                               └─ sw_keystone_bleed (cost 780)
                                                                                                    └─ sw_keystone_bleed_asc1 (cost 275)
                                                                                                         └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_hp_2 (cost 45)
                                        └─ sw_hp_1 (cost 50)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_def_2 (cost 45)
                                                       └─ sw_universal_ward_spark (cost 50)
                                                            └─ sw_def_minor_1 (cost 60)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_bleed_minor_2 (cost 55)
                                                                           └─ sw_universal_vigor (cost 60)
                                                                                └─ swordsman_whirlwind [notable] (cost 360)
                                                                                     └─ sw_bleed_filler_1 (cost 150)
                                                                                          └─ sw_rend_tear [notable] (cost 380)
                                                                                               └─ sw_bleed_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_bleed (cost 780)
                                                                                                         └─ sw_keystone_bleed_asc1 (cost 275)
                                                                                                              └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_universal_swift_spark (cost 50)
                                        └─ sw_dmg_2 (cost 45)
                                             └─ sw_dmg_1 (cost 50)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_atk_spd_2 (cost 45)
                                                            └─ sw_universal_vigor_spark (cost 50)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_bleed_minor_2 (cost 55)
                                                                           └─ sw_universal_vigor (cost 60)
                                                                                └─ swordsman_whirlwind [notable] (cost 360)
                                                                                     └─ sw_bleed_filler_1 (cost 150)
                                                                                          └─ sw_rend_tear [notable] (cost 380)
                                                                                               └─ sw_bleed_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_bleed (cost 780)
                                                                                                         └─ sw_keystone_bleed_asc1 (cost 275)
                                                                                                              └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_hp_2 (cost 45)
                                             └─ sw_hp_1 (cost 50)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_def_2 (cost 45)
                                                            └─ sw_universal_ward_spark (cost 50)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_bleed_minor_1 (cost 55)
                                                                           └─ sw_bleed_minor_2 (cost 55)
                                                                                └─ sw_universal_vigor (cost 60)
                                                                                     └─ swordsman_whirlwind [notable] (cost 360)
                                                                                          └─ sw_bleed_filler_1 (cost 150)
                                                                                               └─ sw_rend_tear [notable] (cost 380)
                                                                                                    └─ sw_bleed_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_bleed (cost 780)
                                                                                                              └─ sw_keystone_bleed_asc1 (cost 275)
                                                                                                                   └─ sw_keystone_bleed_asc2 [KEYSTONE] (cost 1010)
```

#### → sw_keystone_shockwave (เสียงกังวานแยกสลาย / Sundering Resonance, cost 800)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_sonic_minor_2 (cost 55)
                                   └─ sw_universal_swift (cost 60)
                                        └─ swordsman_shockwave [notable] (cost 380)
                                             └─ sw_sonic_filler_1 (cost 150)
                                                  └─ sw_blade_beam [notable] (cost 400)
                                                       └─ sw_sonic_filler_2 (cost 180)
                                                            └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_sonic_minor_2 (cost 55)
                                   └─ sw_universal_swift (cost 60)
                                        └─ swordsman_shockwave [notable] (cost 380)
                                             └─ sw_sonic_filler_1 (cost 150)
                                                  └─ sw_blade_beam [notable] (cost 400)
                                                       └─ sw_sonic_filler_2 (cost 180)
                                                            └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_sonic_minor_2 (cost 55)
                                        └─ sw_universal_swift (cost 60)
                                             └─ swordsman_shockwave [notable] (cost 380)
                                                  └─ sw_sonic_filler_1 (cost 150)
                                                       └─ sw_blade_beam [notable] (cost 400)
                                                            └─ sw_sonic_filler_2 (cost 180)
                                                                 └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_sonic_minor_2 (cost 55)
                                        └─ sw_universal_swift (cost 60)
                                             └─ swordsman_shockwave [notable] (cost 380)
                                                  └─ sw_sonic_filler_1 (cost 150)
                                                       └─ sw_blade_beam [notable] (cost 400)
                                                            └─ sw_sonic_filler_2 (cost 180)
                                                                 └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_universal_ward_spark (cost 50)
                                        └─ sw_def_2 (cost 45)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_hp_1 (cost 50)
                                                       └─ sw_hp_2 (cost 45)
                                                            └─ sw_speed_1 (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_sonic_minor_2 (cost 55)
                                                                           └─ sw_universal_swift (cost 60)
                                                                                └─ swordsman_shockwave [notable] (cost 380)
                                                                                     └─ sw_sonic_filler_1 (cost 150)
                                                                                          └─ sw_blade_beam [notable] (cost 400)
                                                                                               └─ sw_sonic_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_universal_vigor_spark (cost 50)
                                        └─ sw_atk_spd_2 (cost 45)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_dmg_1 (cost 50)
                                                       └─ sw_dmg_2 (cost 45)
                                                            └─ sw_universal_swift_spark (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_sonic_minor_2 (cost 55)
                                                                           └─ sw_universal_swift (cost 60)
                                                                                └─ swordsman_shockwave [notable] (cost 380)
                                                                                     └─ sw_sonic_filler_1 (cost 150)
                                                                                          └─ sw_blade_beam [notable] (cost 400)
                                                                                               └─ sw_sonic_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_universal_ward_spark (cost 50)
                                             └─ sw_def_2 (cost 45)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_hp_1 (cost 50)
                                                            └─ sw_hp_2 (cost 45)
                                                                 └─ sw_speed_1 (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_sonic_minor_2 (cost 55)
                                                                                └─ sw_universal_swift (cost 60)
                                                                                     └─ swordsman_shockwave [notable] (cost 380)
                                                                                          └─ sw_sonic_filler_1 (cost 150)
                                                                                               └─ sw_blade_beam [notable] (cost 400)
                                                                                                    └─ sw_sonic_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_universal_vigor_spark (cost 50)
                                             └─ sw_atk_spd_2 (cost 45)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_dmg_1 (cost 50)
                                                            └─ sw_dmg_2 (cost 45)
                                                                 └─ sw_universal_swift_spark (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_sonic_minor_2 (cost 55)
                                                                                └─ sw_universal_swift (cost 60)
                                                                                     └─ swordsman_shockwave [notable] (cost 380)
                                                                                          └─ sw_sonic_filler_1 (cost 150)
                                                                                               └─ sw_blade_beam [notable] (cost 400)
                                                                                                    └─ sw_sonic_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_shockwave [KEYSTONE] (cost 800)
```

#### → sw_keystone_overcharged_reflexes (ปฏิกิริยาตอบสนองเกินขีดจำกัด / Overcharged Reflexes, cost 950)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_sonic_minor_2 (cost 55)
                                   └─ sw_universal_swift (cost 60)
                                        └─ swordsman_shockwave [notable] (cost 380)
                                             └─ sw_sonic_filler_1 (cost 150)
                                                  └─ sw_blade_beam [notable] (cost 400)
                                                       └─ sw_sonic_filler_2 (cost 180)
                                                            └─ sw_keystone_shockwave (cost 800)
                                                                 └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_sonic_minor_2 (cost 55)
                                   └─ sw_universal_swift (cost 60)
                                        └─ swordsman_shockwave [notable] (cost 380)
                                             └─ sw_sonic_filler_1 (cost 150)
                                                  └─ sw_blade_beam [notable] (cost 400)
                                                       └─ sw_sonic_filler_2 (cost 180)
                                                            └─ sw_keystone_shockwave (cost 800)
                                                                 └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_sonic_minor_2 (cost 55)
                                        └─ sw_universal_swift (cost 60)
                                             └─ swordsman_shockwave [notable] (cost 380)
                                                  └─ sw_sonic_filler_1 (cost 150)
                                                       └─ sw_blade_beam [notable] (cost 400)
                                                            └─ sw_sonic_filler_2 (cost 180)
                                                                 └─ sw_keystone_shockwave (cost 800)
                                                                      └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_sonic_minor_2 (cost 55)
                                        └─ sw_universal_swift (cost 60)
                                             └─ swordsman_shockwave [notable] (cost 380)
                                                  └─ sw_sonic_filler_1 (cost 150)
                                                       └─ sw_blade_beam [notable] (cost 400)
                                                            └─ sw_sonic_filler_2 (cost 180)
                                                                 └─ sw_keystone_shockwave (cost 800)
                                                                      └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_universal_ward_spark (cost 50)
                                        └─ sw_def_2 (cost 45)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_hp_1 (cost 50)
                                                       └─ sw_hp_2 (cost 45)
                                                            └─ sw_speed_1 (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_sonic_minor_2 (cost 55)
                                                                           └─ sw_universal_swift (cost 60)
                                                                                └─ swordsman_shockwave [notable] (cost 380)
                                                                                     └─ sw_sonic_filler_1 (cost 150)
                                                                                          └─ sw_blade_beam [notable] (cost 400)
                                                                                               └─ sw_sonic_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_shockwave (cost 800)
                                                                                                         └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_universal_vigor_spark (cost 50)
                                        └─ sw_atk_spd_2 (cost 45)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_dmg_1 (cost 50)
                                                       └─ sw_dmg_2 (cost 45)
                                                            └─ sw_universal_swift_spark (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_sonic_minor_2 (cost 55)
                                                                           └─ sw_universal_swift (cost 60)
                                                                                └─ swordsman_shockwave [notable] (cost 380)
                                                                                     └─ sw_sonic_filler_1 (cost 150)
                                                                                          └─ sw_blade_beam [notable] (cost 400)
                                                                                               └─ sw_sonic_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_shockwave (cost 800)
                                                                                                         └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_universal_ward_spark (cost 50)
                                             └─ sw_def_2 (cost 45)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_hp_1 (cost 50)
                                                            └─ sw_hp_2 (cost 45)
                                                                 └─ sw_speed_1 (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_sonic_minor_2 (cost 55)
                                                                                └─ sw_universal_swift (cost 60)
                                                                                     └─ swordsman_shockwave [notable] (cost 380)
                                                                                          └─ sw_sonic_filler_1 (cost 150)
                                                                                               └─ sw_blade_beam [notable] (cost 400)
                                                                                                    └─ sw_sonic_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_shockwave (cost 800)
                                                                                                              └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_universal_vigor_spark (cost 50)
                                             └─ sw_atk_spd_2 (cost 45)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_dmg_1 (cost 50)
                                                            └─ sw_dmg_2 (cost 45)
                                                                 └─ sw_universal_swift_spark (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_sonic_minor_2 (cost 55)
                                                                                └─ sw_universal_swift (cost 60)
                                                                                     └─ swordsman_shockwave [notable] (cost 380)
                                                                                          └─ sw_sonic_filler_1 (cost 150)
                                                                                               └─ sw_blade_beam [notable] (cost 400)
                                                                                                    └─ sw_sonic_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_shockwave (cost 800)
                                                                                                              └─ sw_keystone_overcharged_reflexes [KEYSTONE] (cost 950)
```

#### → sw_keystone_shockwave_asc2 (เสียงกังวานเหนือขีดจำกัด / Transcendent Resonance, cost 1040)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_sonic_minor_2 (cost 55)
                                   └─ sw_universal_swift (cost 60)
                                        └─ swordsman_shockwave [notable] (cost 380)
                                             └─ sw_sonic_filler_1 (cost 150)
                                                  └─ sw_blade_beam [notable] (cost 400)
                                                       └─ sw_sonic_filler_2 (cost 180)
                                                            └─ sw_keystone_shockwave (cost 800)
                                                                 └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                      └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_sonic_minor_2 (cost 55)
                                   └─ sw_universal_swift (cost 60)
                                        └─ swordsman_shockwave [notable] (cost 380)
                                             └─ sw_sonic_filler_1 (cost 150)
                                                  └─ sw_blade_beam [notable] (cost 400)
                                                       └─ sw_sonic_filler_2 (cost 180)
                                                            └─ sw_keystone_shockwave (cost 800)
                                                                 └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                      └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_sonic_minor_2 (cost 55)
                                        └─ sw_universal_swift (cost 60)
                                             └─ swordsman_shockwave [notable] (cost 380)
                                                  └─ sw_sonic_filler_1 (cost 150)
                                                       └─ sw_blade_beam [notable] (cost 400)
                                                            └─ sw_sonic_filler_2 (cost 180)
                                                                 └─ sw_keystone_shockwave (cost 800)
                                                                      └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                           └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_sonic_minor_2 (cost 55)
                                        └─ sw_universal_swift (cost 60)
                                             └─ swordsman_shockwave [notable] (cost 380)
                                                  └─ sw_sonic_filler_1 (cost 150)
                                                       └─ sw_blade_beam [notable] (cost 400)
                                                            └─ sw_sonic_filler_2 (cost 180)
                                                                 └─ sw_keystone_shockwave (cost 800)
                                                                      └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                           └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_universal_ward_spark (cost 50)
                                        └─ sw_def_2 (cost 45)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_hp_1 (cost 50)
                                                       └─ sw_hp_2 (cost 45)
                                                            └─ sw_speed_1 (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_sonic_minor_2 (cost 55)
                                                                           └─ sw_universal_swift (cost 60)
                                                                                └─ swordsman_shockwave [notable] (cost 380)
                                                                                     └─ sw_sonic_filler_1 (cost 150)
                                                                                          └─ sw_blade_beam [notable] (cost 400)
                                                                                               └─ sw_sonic_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_shockwave (cost 800)
                                                                                                         └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                                                              └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_universal_vigor_spark (cost 50)
                                        └─ sw_atk_spd_2 (cost 45)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_dmg_1 (cost 50)
                                                       └─ sw_dmg_2 (cost 45)
                                                            └─ sw_universal_swift_spark (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_sonic_minor_2 (cost 55)
                                                                           └─ sw_universal_swift (cost 60)
                                                                                └─ swordsman_shockwave [notable] (cost 380)
                                                                                     └─ sw_sonic_filler_1 (cost 150)
                                                                                          └─ sw_blade_beam [notable] (cost 400)
                                                                                               └─ sw_sonic_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_shockwave (cost 800)
                                                                                                         └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                                                              └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_universal_ward_spark (cost 50)
                                             └─ sw_def_2 (cost 45)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_hp_1 (cost 50)
                                                            └─ sw_hp_2 (cost 45)
                                                                 └─ sw_speed_1 (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_sonic_minor_2 (cost 55)
                                                                                └─ sw_universal_swift (cost 60)
                                                                                     └─ swordsman_shockwave [notable] (cost 380)
                                                                                          └─ sw_sonic_filler_1 (cost 150)
                                                                                               └─ sw_blade_beam [notable] (cost 400)
                                                                                                    └─ sw_sonic_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_shockwave (cost 800)
                                                                                                              └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                                                                   └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_universal_vigor_spark (cost 50)
                                             └─ sw_atk_spd_2 (cost 45)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_dmg_1 (cost 50)
                                                            └─ sw_dmg_2 (cost 45)
                                                                 └─ sw_universal_swift_spark (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_sonic_minor_2 (cost 55)
                                                                                └─ sw_universal_swift (cost 60)
                                                                                     └─ swordsman_shockwave [notable] (cost 380)
                                                                                          └─ sw_sonic_filler_1 (cost 150)
                                                                                               └─ sw_blade_beam [notable] (cost 400)
                                                                                                    └─ sw_sonic_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_shockwave (cost 800)
                                                                                                              └─ sw_keystone_shockwave_asc1 (cost 280)
                                                                                                                   └─ sw_keystone_shockwave_asc2 [KEYSTONE] (cost 1040)
```

#### → sw_keystone_juggernaut (ป้อมปราการอมตะ / Immortal Bastion, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_def_minor_2 (cost 55)
                                   └─ sw_universal_ward (cost 60)
                                        └─ swordsman_retaliation [notable] (cost 350)
                                             └─ sw_def_filler_1 (cost 150)
                                                  └─ sw_fortress_stance [notable] (cost 390)
                                                       └─ sw_def_filler_2 (cost 180)
                                                            └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_def_minor_2 (cost 55)
                                        └─ sw_universal_ward (cost 60)
                                             └─ swordsman_retaliation [notable] (cost 350)
                                                  └─ sw_def_filler_1 (cost 150)
                                                       └─ sw_fortress_stance [notable] (cost 390)
                                                            └─ sw_def_filler_2 (cost 180)
                                                                 └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_def_minor_2 (cost 55)
                                        └─ sw_universal_ward (cost 60)
                                             └─ swordsman_retaliation [notable] (cost 350)
                                                  └─ sw_def_filler_1 (cost 150)
                                                       └─ sw_fortress_stance [notable] (cost 390)
                                                            └─ sw_def_filler_2 (cost 180)
                                                                 └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_def_minor_2 (cost 55)
                                             └─ sw_universal_ward (cost 60)
                                                  └─ swordsman_retaliation [notable] (cost 350)
                                                       └─ sw_def_filler_1 (cost 150)
                                                            └─ sw_fortress_stance [notable] (cost 390)
                                                                 └─ sw_def_filler_2 (cost 180)
                                                                      └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_hp_2 (cost 45)
                                        └─ sw_hp_1 (cost 50)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_def_2 (cost 45)
                                                       └─ sw_universal_ward_spark (cost 50)
                                                            └─ sw_def_minor_1 (cost 60)
                                                                 └─ sw_def_minor_2 (cost 55)
                                                                      └─ sw_universal_ward (cost 60)
                                                                           └─ swordsman_retaliation [notable] (cost 350)
                                                                                └─ sw_def_filler_1 (cost 150)
                                                                                     └─ sw_fortress_stance [notable] (cost 390)
                                                                                          └─ sw_def_filler_2 (cost 180)
                                                                                               └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_hp_2 (cost 45)
                                             └─ sw_hp_1 (cost 50)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_def_2 (cost 45)
                                                            └─ sw_universal_ward_spark (cost 50)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_def_minor_2 (cost 55)
                                                                           └─ sw_universal_ward (cost 60)
                                                                                └─ swordsman_retaliation [notable] (cost 350)
                                                                                     └─ sw_def_filler_1 (cost 150)
                                                                                          └─ sw_fortress_stance [notable] (cost 390)
                                                                                               └─ sw_def_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_universal_swift_spark (cost 50)
                                   └─ sw_dmg_2 (cost 45)
                                        └─ sw_dmg_1 (cost 50)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_atk_spd_2 (cost 45)
                                                       └─ sw_universal_vigor_spark (cost 50)
                                                            └─ sw_bleed_minor_1 (cost 55)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_def_minor_2 (cost 55)
                                                                           └─ sw_universal_ward (cost 60)
                                                                                └─ swordsman_retaliation [notable] (cost 350)
                                                                                     └─ sw_def_filler_1 (cost 150)
                                                                                          └─ sw_fortress_stance [notable] (cost 390)
                                                                                               └─ sw_def_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_universal_swift_spark (cost 50)
                                        └─ sw_dmg_2 (cost 45)
                                             └─ sw_dmg_1 (cost 50)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_atk_spd_2 (cost 45)
                                                            └─ sw_universal_vigor_spark (cost 50)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_def_minor_1 (cost 60)
                                                                           └─ sw_def_minor_2 (cost 55)
                                                                                └─ sw_universal_ward (cost 60)
                                                                                     └─ swordsman_retaliation [notable] (cost 350)
                                                                                          └─ sw_def_filler_1 (cost 150)
                                                                                               └─ sw_fortress_stance [notable] (cost 390)
                                                                                                    └─ sw_def_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_juggernaut [KEYSTONE] (cost 820)
```

#### → sw_keystone_leaden_bulwark (ปราการเหล็กหนัก / Leaden Bulwark, cost 950)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_def_minor_2 (cost 55)
                                   └─ sw_universal_ward (cost 60)
                                        └─ swordsman_retaliation [notable] (cost 350)
                                             └─ sw_def_filler_1 (cost 150)
                                                  └─ sw_fortress_stance [notable] (cost 390)
                                                       └─ sw_def_filler_2 (cost 180)
                                                            └─ sw_keystone_juggernaut (cost 820)
                                                                 └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_def_minor_2 (cost 55)
                                        └─ sw_universal_ward (cost 60)
                                             └─ swordsman_retaliation [notable] (cost 350)
                                                  └─ sw_def_filler_1 (cost 150)
                                                       └─ sw_fortress_stance [notable] (cost 390)
                                                            └─ sw_def_filler_2 (cost 180)
                                                                 └─ sw_keystone_juggernaut (cost 820)
                                                                      └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_def_minor_2 (cost 55)
                                        └─ sw_universal_ward (cost 60)
                                             └─ swordsman_retaliation [notable] (cost 350)
                                                  └─ sw_def_filler_1 (cost 150)
                                                       └─ sw_fortress_stance [notable] (cost 390)
                                                            └─ sw_def_filler_2 (cost 180)
                                                                 └─ sw_keystone_juggernaut (cost 820)
                                                                      └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_def_minor_2 (cost 55)
                                             └─ sw_universal_ward (cost 60)
                                                  └─ swordsman_retaliation [notable] (cost 350)
                                                       └─ sw_def_filler_1 (cost 150)
                                                            └─ sw_fortress_stance [notable] (cost 390)
                                                                 └─ sw_def_filler_2 (cost 180)
                                                                      └─ sw_keystone_juggernaut (cost 820)
                                                                           └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_hp_2 (cost 45)
                                        └─ sw_hp_1 (cost 50)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_def_2 (cost 45)
                                                       └─ sw_universal_ward_spark (cost 50)
                                                            └─ sw_def_minor_1 (cost 60)
                                                                 └─ sw_def_minor_2 (cost 55)
                                                                      └─ sw_universal_ward (cost 60)
                                                                           └─ swordsman_retaliation [notable] (cost 350)
                                                                                └─ sw_def_filler_1 (cost 150)
                                                                                     └─ sw_fortress_stance [notable] (cost 390)
                                                                                          └─ sw_def_filler_2 (cost 180)
                                                                                               └─ sw_keystone_juggernaut (cost 820)
                                                                                                    └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_hp_2 (cost 45)
                                             └─ sw_hp_1 (cost 50)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_def_2 (cost 45)
                                                            └─ sw_universal_ward_spark (cost 50)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_def_minor_2 (cost 55)
                                                                           └─ sw_universal_ward (cost 60)
                                                                                └─ swordsman_retaliation [notable] (cost 350)
                                                                                     └─ sw_def_filler_1 (cost 150)
                                                                                          └─ sw_fortress_stance [notable] (cost 390)
                                                                                               └─ sw_def_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_juggernaut (cost 820)
                                                                                                         └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_universal_swift_spark (cost 50)
                                   └─ sw_dmg_2 (cost 45)
                                        └─ sw_dmg_1 (cost 50)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_atk_spd_2 (cost 45)
                                                       └─ sw_universal_vigor_spark (cost 50)
                                                            └─ sw_bleed_minor_1 (cost 55)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_def_minor_2 (cost 55)
                                                                           └─ sw_universal_ward (cost 60)
                                                                                └─ swordsman_retaliation [notable] (cost 350)
                                                                                     └─ sw_def_filler_1 (cost 150)
                                                                                          └─ sw_fortress_stance [notable] (cost 390)
                                                                                               └─ sw_def_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_juggernaut (cost 820)
                                                                                                         └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_universal_swift_spark (cost 50)
                                        └─ sw_dmg_2 (cost 45)
                                             └─ sw_dmg_1 (cost 50)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_atk_spd_2 (cost 45)
                                                            └─ sw_universal_vigor_spark (cost 50)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_def_minor_1 (cost 60)
                                                                           └─ sw_def_minor_2 (cost 55)
                                                                                └─ sw_universal_ward (cost 60)
                                                                                     └─ swordsman_retaliation [notable] (cost 350)
                                                                                          └─ sw_def_filler_1 (cost 150)
                                                                                               └─ sw_fortress_stance [notable] (cost 390)
                                                                                                    └─ sw_def_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_juggernaut (cost 820)
                                                                                                              └─ sw_keystone_leaden_bulwark [KEYSTONE] (cost 950)
```

#### → sw_keystone_juggernaut_asc2 (ป้อมปราการเหนือขีดจำกัด / Transcendent Bastion, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_def_minor_2 (cost 55)
                                   └─ sw_universal_ward (cost 60)
                                        └─ swordsman_retaliation [notable] (cost 350)
                                             └─ sw_def_filler_1 (cost 150)
                                                  └─ sw_fortress_stance [notable] (cost 390)
                                                       └─ sw_def_filler_2 (cost 180)
                                                            └─ sw_keystone_juggernaut (cost 820)
                                                                 └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                      └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_def_minor_2 (cost 55)
                                        └─ sw_universal_ward (cost 60)
                                             └─ swordsman_retaliation [notable] (cost 350)
                                                  └─ sw_def_filler_1 (cost 150)
                                                       └─ sw_fortress_stance [notable] (cost 390)
                                                            └─ sw_def_filler_2 (cost 180)
                                                                 └─ sw_keystone_juggernaut (cost 820)
                                                                      └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                           └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_def_minor_2 (cost 55)
                                        └─ sw_universal_ward (cost 60)
                                             └─ swordsman_retaliation [notable] (cost 350)
                                                  └─ sw_def_filler_1 (cost 150)
                                                       └─ sw_fortress_stance [notable] (cost 390)
                                                            └─ sw_def_filler_2 (cost 180)
                                                                 └─ sw_keystone_juggernaut (cost 820)
                                                                      └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                           └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_def_minor_2 (cost 55)
                                             └─ sw_universal_ward (cost 60)
                                                  └─ swordsman_retaliation [notable] (cost 350)
                                                       └─ sw_def_filler_1 (cost 150)
                                                            └─ sw_fortress_stance [notable] (cost 390)
                                                                 └─ sw_def_filler_2 (cost 180)
                                                                      └─ sw_keystone_juggernaut (cost 820)
                                                                           └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                                └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_hp_2 (cost 45)
                                        └─ sw_hp_1 (cost 50)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_def_2 (cost 45)
                                                       └─ sw_universal_ward_spark (cost 50)
                                                            └─ sw_def_minor_1 (cost 60)
                                                                 └─ sw_def_minor_2 (cost 55)
                                                                      └─ sw_universal_ward (cost 60)
                                                                           └─ swordsman_retaliation [notable] (cost 350)
                                                                                └─ sw_def_filler_1 (cost 150)
                                                                                     └─ sw_fortress_stance [notable] (cost 390)
                                                                                          └─ sw_def_filler_2 (cost 180)
                                                                                               └─ sw_keystone_juggernaut (cost 820)
                                                                                                    └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                                                         └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_hp_2 (cost 45)
                                             └─ sw_hp_1 (cost 50)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_def_2 (cost 45)
                                                            └─ sw_universal_ward_spark (cost 50)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_def_minor_2 (cost 55)
                                                                           └─ sw_universal_ward (cost 60)
                                                                                └─ swordsman_retaliation [notable] (cost 350)
                                                                                     └─ sw_def_filler_1 (cost 150)
                                                                                          └─ sw_fortress_stance [notable] (cost 390)
                                                                                               └─ sw_def_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_juggernaut (cost 820)
                                                                                                         └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                                                              └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_universal_swift_spark (cost 50)
                                   └─ sw_dmg_2 (cost 45)
                                        └─ sw_dmg_1 (cost 50)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_atk_spd_2 (cost 45)
                                                       └─ sw_universal_vigor_spark (cost 50)
                                                            └─ sw_bleed_minor_1 (cost 55)
                                                                 └─ sw_def_minor_1 (cost 60)
                                                                      └─ sw_def_minor_2 (cost 55)
                                                                           └─ sw_universal_ward (cost 60)
                                                                                └─ swordsman_retaliation [notable] (cost 350)
                                                                                     └─ sw_def_filler_1 (cost 150)
                                                                                          └─ sw_fortress_stance [notable] (cost 390)
                                                                                               └─ sw_def_filler_2 (cost 180)
                                                                                                    └─ sw_keystone_juggernaut (cost 820)
                                                                                                         └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                                                              └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_universal_swift_spark (cost 50)
                                        └─ sw_dmg_2 (cost 45)
                                             └─ sw_dmg_1 (cost 50)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_atk_spd_2 (cost 45)
                                                            └─ sw_universal_vigor_spark (cost 50)
                                                                 └─ sw_bleed_minor_1 (cost 55)
                                                                      └─ sw_def_minor_1 (cost 60)
                                                                           └─ sw_def_minor_2 (cost 55)
                                                                                └─ sw_universal_ward (cost 60)
                                                                                     └─ swordsman_retaliation [notable] (cost 350)
                                                                                          └─ sw_def_filler_1 (cost 150)
                                                                                               └─ sw_fortress_stance [notable] (cost 390)
                                                                                                    └─ sw_def_filler_2 (cost 180)
                                                                                                         └─ sw_keystone_juggernaut (cost 820)
                                                                                                              └─ sw_keystone_juggernaut_asc1 (cost 285)
                                                                                                                   └─ sw_keystone_juggernaut_asc2 [KEYSTONE] (cost 1070)
```

#### → sw_keystone_warlord (ขุนศึกนิรันดร์ / Eternal Warlord, cost 800)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_speed_2 (cost 50)
                              └─ sw_universal_insight_spark (cost 50)
                                   └─ sw_magnet_1 (cost 55)
                                        └─ sw_magnet_2 (cost 55)
                                             └─ sw_blood_siphon [notable] (cost 370)
                                                  └─ sw_warlord_filler_1 (cost 180)
                                                       └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_speed_2 (cost 50)
                                   └─ sw_universal_insight_spark (cost 50)
                                        └─ sw_magnet_1 (cost 55)
                                             └─ sw_magnet_2 (cost 55)
                                                  └─ sw_blood_siphon [notable] (cost 370)
                                                       └─ sw_warlord_filler_1 (cost 180)
                                                            └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_speed_2 (cost 50)
                                        └─ sw_universal_insight_spark (cost 50)
                                             └─ sw_magnet_1 (cost 55)
                                                  └─ sw_magnet_2 (cost 55)
                                                       └─ sw_blood_siphon [notable] (cost 370)
                                                            └─ sw_warlord_filler_1 (cost 180)
                                                                 └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_speed_2 (cost 50)
                                             └─ sw_universal_insight_spark (cost 50)
                                                  └─ sw_magnet_1 (cost 55)
                                                       └─ sw_magnet_2 (cost 55)
                                                            └─ sw_blood_siphon [notable] (cost 370)
                                                                 └─ sw_warlord_filler_1 (cost 180)
                                                                      └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_universal_ward_spark (cost 50)
                                        └─ sw_def_2 (cost 45)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_hp_1 (cost 50)
                                                       └─ sw_hp_2 (cost 45)
                                                            └─ sw_speed_1 (cost 50)
                                                                 └─ sw_speed_2 (cost 50)
                                                                      └─ sw_universal_insight_spark (cost 50)
                                                                           └─ sw_magnet_1 (cost 55)
                                                                                └─ sw_magnet_2 (cost 55)
                                                                                     └─ sw_blood_siphon [notable] (cost 370)
                                                                                          └─ sw_warlord_filler_1 (cost 180)
                                                                                               └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_universal_ward_spark (cost 50)
                                             └─ sw_def_2 (cost 45)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_hp_1 (cost 50)
                                                            └─ sw_hp_2 (cost 45)
                                                                 └─ sw_speed_1 (cost 50)
                                                                      └─ sw_speed_2 (cost 50)
                                                                           └─ sw_universal_insight_spark (cost 50)
                                                                                └─ sw_magnet_1 (cost 55)
                                                                                     └─ sw_magnet_2 (cost 55)
                                                                                          └─ sw_blood_siphon [notable] (cost 370)
                                                                                               └─ sw_warlord_filler_1 (cost 180)
                                                                                                    └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_universal_vigor_spark (cost 50)
                                        └─ sw_atk_spd_2 (cost 45)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_dmg_1 (cost 50)
                                                       └─ sw_dmg_2 (cost 45)
                                                            └─ sw_universal_swift_spark (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_speed_1 (cost 50)
                                                                           └─ sw_speed_2 (cost 50)
                                                                                └─ sw_universal_insight_spark (cost 50)
                                                                                     └─ sw_magnet_1 (cost 55)
                                                                                          └─ sw_magnet_2 (cost 55)
                                                                                               └─ sw_blood_siphon [notable] (cost 370)
                                                                                                    └─ sw_warlord_filler_1 (cost 180)
                                                                                                         └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_universal_vigor_spark (cost 50)
                                             └─ sw_atk_spd_2 (cost 45)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_dmg_1 (cost 50)
                                                            └─ sw_dmg_2 (cost 45)
                                                                 └─ sw_universal_swift_spark (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_speed_1 (cost 50)
                                                                                └─ sw_speed_2 (cost 50)
                                                                                     └─ sw_universal_insight_spark (cost 50)
                                                                                          └─ sw_magnet_1 (cost 55)
                                                                                               └─ sw_magnet_2 (cost 55)
                                                                                                    └─ sw_blood_siphon [notable] (cost 370)
                                                                                                         └─ sw_warlord_filler_1 (cost 180)
                                                                                                              └─ sw_keystone_warlord [KEYSTONE] (cost 800)
```

#### → sw_keystone_gilded_greed (ความโลภสีทอง / Gilded Greed, cost 950)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_speed_2 (cost 50)
                              └─ sw_universal_insight_spark (cost 50)
                                   └─ sw_magnet_1 (cost 55)
                                        └─ sw_magnet_2 (cost 55)
                                             └─ sw_blood_siphon [notable] (cost 370)
                                                  └─ sw_warlord_filler_1 (cost 180)
                                                       └─ sw_keystone_warlord (cost 800)
                                                            └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_speed_2 (cost 50)
                                   └─ sw_universal_insight_spark (cost 50)
                                        └─ sw_magnet_1 (cost 55)
                                             └─ sw_magnet_2 (cost 55)
                                                  └─ sw_blood_siphon [notable] (cost 370)
                                                       └─ sw_warlord_filler_1 (cost 180)
                                                            └─ sw_keystone_warlord (cost 800)
                                                                 └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_speed_2 (cost 50)
                                        └─ sw_universal_insight_spark (cost 50)
                                             └─ sw_magnet_1 (cost 55)
                                                  └─ sw_magnet_2 (cost 55)
                                                       └─ sw_blood_siphon [notable] (cost 370)
                                                            └─ sw_warlord_filler_1 (cost 180)
                                                                 └─ sw_keystone_warlord (cost 800)
                                                                      └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_speed_2 (cost 50)
                                             └─ sw_universal_insight_spark (cost 50)
                                                  └─ sw_magnet_1 (cost 55)
                                                       └─ sw_magnet_2 (cost 55)
                                                            └─ sw_blood_siphon [notable] (cost 370)
                                                                 └─ sw_warlord_filler_1 (cost 180)
                                                                      └─ sw_keystone_warlord (cost 800)
                                                                           └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_universal_ward_spark (cost 50)
                                        └─ sw_def_2 (cost 45)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_hp_1 (cost 50)
                                                       └─ sw_hp_2 (cost 45)
                                                            └─ sw_speed_1 (cost 50)
                                                                 └─ sw_speed_2 (cost 50)
                                                                      └─ sw_universal_insight_spark (cost 50)
                                                                           └─ sw_magnet_1 (cost 55)
                                                                                └─ sw_magnet_2 (cost 55)
                                                                                     └─ sw_blood_siphon [notable] (cost 370)
                                                                                          └─ sw_warlord_filler_1 (cost 180)
                                                                                               └─ sw_keystone_warlord (cost 800)
                                                                                                    └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_universal_ward_spark (cost 50)
                                             └─ sw_def_2 (cost 45)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_hp_1 (cost 50)
                                                            └─ sw_hp_2 (cost 45)
                                                                 └─ sw_speed_1 (cost 50)
                                                                      └─ sw_speed_2 (cost 50)
                                                                           └─ sw_universal_insight_spark (cost 50)
                                                                                └─ sw_magnet_1 (cost 55)
                                                                                     └─ sw_magnet_2 (cost 55)
                                                                                          └─ sw_blood_siphon [notable] (cost 370)
                                                                                               └─ sw_warlord_filler_1 (cost 180)
                                                                                                    └─ sw_keystone_warlord (cost 800)
                                                                                                         └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_universal_vigor_spark (cost 50)
                                        └─ sw_atk_spd_2 (cost 45)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_dmg_1 (cost 50)
                                                       └─ sw_dmg_2 (cost 45)
                                                            └─ sw_universal_swift_spark (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_speed_1 (cost 50)
                                                                           └─ sw_speed_2 (cost 50)
                                                                                └─ sw_universal_insight_spark (cost 50)
                                                                                     └─ sw_magnet_1 (cost 55)
                                                                                          └─ sw_magnet_2 (cost 55)
                                                                                               └─ sw_blood_siphon [notable] (cost 370)
                                                                                                    └─ sw_warlord_filler_1 (cost 180)
                                                                                                         └─ sw_keystone_warlord (cost 800)
                                                                                                              └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_universal_vigor_spark (cost 50)
                                             └─ sw_atk_spd_2 (cost 45)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_dmg_1 (cost 50)
                                                            └─ sw_dmg_2 (cost 45)
                                                                 └─ sw_universal_swift_spark (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_speed_1 (cost 50)
                                                                                └─ sw_speed_2 (cost 50)
                                                                                     └─ sw_universal_insight_spark (cost 50)
                                                                                          └─ sw_magnet_1 (cost 55)
                                                                                               └─ sw_magnet_2 (cost 55)
                                                                                                    └─ sw_blood_siphon [notable] (cost 370)
                                                                                                         └─ sw_warlord_filler_1 (cost 180)
                                                                                                              └─ sw_keystone_warlord (cost 800)
                                                                                                                   └─ sw_keystone_gilded_greed [KEYSTONE] (cost 950)
```

#### → sw_keystone_warlord_asc2 (ขุนศึกเหนือขีดจำกัด / Transcendent Warlord, cost 1040)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_hp_2 (cost 45)
                    └─ sw_speed_1 (cost 50)
                         └─ sw_speed_2 (cost 50)
                              └─ sw_universal_insight_spark (cost 50)
                                   └─ sw_magnet_1 (cost 55)
                                        └─ sw_magnet_2 (cost 55)
                                             └─ sw_blood_siphon [notable] (cost 370)
                                                  └─ sw_warlord_filler_1 (cost 180)
                                                       └─ sw_keystone_warlord (cost 800)
                                                            └─ sw_keystone_warlord_asc1 (cost 280)
                                                                 └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 2:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_hp_1 (cost 50)
                    └─ sw_hp_2 (cost 45)
                         └─ sw_speed_1 (cost 50)
                              └─ sw_speed_2 (cost 50)
                                   └─ sw_universal_insight_spark (cost 50)
                                        └─ sw_magnet_1 (cost 55)
                                             └─ sw_magnet_2 (cost 55)
                                                  └─ sw_blood_siphon [notable] (cost 370)
                                                       └─ sw_warlord_filler_1 (cost 180)
                                                            └─ sw_keystone_warlord (cost 800)
                                                                 └─ sw_keystone_warlord_asc1 (cost 280)
                                                                      └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 3:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_dmg_2 (cost 45)
                    └─ sw_universal_swift_spark (cost 50)
                         └─ sw_sonic_minor_1 (cost 55)
                              └─ sw_speed_1 (cost 50)
                                   └─ sw_speed_2 (cost 50)
                                        └─ sw_universal_insight_spark (cost 50)
                                             └─ sw_magnet_1 (cost 55)
                                                  └─ sw_magnet_2 (cost 55)
                                                       └─ sw_blood_siphon [notable] (cost 370)
                                                            └─ sw_warlord_filler_1 (cost 180)
                                                                 └─ sw_keystone_warlord (cost 800)
                                                                      └─ sw_keystone_warlord_asc1 (cost 280)
                                                                           └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 4:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_dmg_1 (cost 50)
                    └─ sw_dmg_2 (cost 45)
                         └─ sw_universal_swift_spark (cost 50)
                              └─ sw_sonic_minor_1 (cost 55)
                                   └─ sw_speed_1 (cost 50)
                                        └─ sw_speed_2 (cost 50)
                                             └─ sw_universal_insight_spark (cost 50)
                                                  └─ sw_magnet_1 (cost 55)
                                                       └─ sw_magnet_2 (cost 55)
                                                            └─ sw_blood_siphon [notable] (cost 370)
                                                                 └─ sw_warlord_filler_1 (cost 180)
                                                                      └─ sw_keystone_warlord (cost 800)
                                                                           └─ sw_keystone_warlord_asc1 (cost 280)
                                                                                └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 5:**
```
sw_root (cost 0)
     └─ sw_universal_reach (cost 45)
          └─ sw_atk_spd_1 (cost 50)
               └─ sw_atk_spd_2 (cost 45)
                    └─ sw_universal_vigor_spark (cost 50)
                         └─ sw_bleed_minor_1 (cost 55)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_universal_ward_spark (cost 50)
                                        └─ sw_def_2 (cost 45)
                                             └─ sw_def_1 (cost 50)
                                                  └─ sw_hp_1 (cost 50)
                                                       └─ sw_hp_2 (cost 45)
                                                            └─ sw_speed_1 (cost 50)
                                                                 └─ sw_speed_2 (cost 50)
                                                                      └─ sw_universal_insight_spark (cost 50)
                                                                           └─ sw_magnet_1 (cost 55)
                                                                                └─ sw_magnet_2 (cost 55)
                                                                                     └─ sw_blood_siphon [notable] (cost 370)
                                                                                          └─ sw_warlord_filler_1 (cost 180)
                                                                                               └─ sw_keystone_warlord (cost 800)
                                                                                                    └─ sw_keystone_warlord_asc1 (cost 280)
                                                                                                         └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 6:**
```
sw_root (cost 0)
     └─ sw_universal_bulk (cost 45)
          └─ sw_dmg_1 (cost 50)
               └─ sw_atk_spd_1 (cost 50)
                    └─ sw_atk_spd_2 (cost 45)
                         └─ sw_universal_vigor_spark (cost 50)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_def_minor_1 (cost 60)
                                        └─ sw_universal_ward_spark (cost 50)
                                             └─ sw_def_2 (cost 45)
                                                  └─ sw_def_1 (cost 50)
                                                       └─ sw_hp_1 (cost 50)
                                                            └─ sw_hp_2 (cost 45)
                                                                 └─ sw_speed_1 (cost 50)
                                                                      └─ sw_speed_2 (cost 50)
                                                                           └─ sw_universal_insight_spark (cost 50)
                                                                                └─ sw_magnet_1 (cost 55)
                                                                                     └─ sw_magnet_2 (cost 55)
                                                                                          └─ sw_blood_siphon [notable] (cost 370)
                                                                                               └─ sw_warlord_filler_1 (cost 180)
                                                                                                    └─ sw_keystone_warlord (cost 800)
                                                                                                         └─ sw_keystone_warlord_asc1 (cost 280)
                                                                                                              └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 7:**
```
sw_root (cost 0)
     └─ sw_universal_focus (cost 45)
          └─ sw_def_1 (cost 50)
               └─ sw_def_2 (cost 45)
                    └─ sw_universal_ward_spark (cost 50)
                         └─ sw_def_minor_1 (cost 60)
                              └─ sw_bleed_minor_1 (cost 55)
                                   └─ sw_universal_vigor_spark (cost 50)
                                        └─ sw_atk_spd_2 (cost 45)
                                             └─ sw_atk_spd_1 (cost 50)
                                                  └─ sw_dmg_1 (cost 50)
                                                       └─ sw_dmg_2 (cost 45)
                                                            └─ sw_universal_swift_spark (cost 50)
                                                                 └─ sw_sonic_minor_1 (cost 55)
                                                                      └─ sw_speed_1 (cost 50)
                                                                           └─ sw_speed_2 (cost 50)
                                                                                └─ sw_universal_insight_spark (cost 50)
                                                                                     └─ sw_magnet_1 (cost 55)
                                                                                          └─ sw_magnet_2 (cost 55)
                                                                                               └─ sw_blood_siphon [notable] (cost 370)
                                                                                                    └─ sw_warlord_filler_1 (cost 180)
                                                                                                         └─ sw_keystone_warlord (cost 800)
                                                                                                              └─ sw_keystone_warlord_asc1 (cost 280)
                                                                                                                   └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 8:**
```
sw_root (cost 0)
     └─ sw_universal_haste (cost 45)
          └─ sw_hp_1 (cost 50)
               └─ sw_def_1 (cost 50)
                    └─ sw_def_2 (cost 45)
                         └─ sw_universal_ward_spark (cost 50)
                              └─ sw_def_minor_1 (cost 60)
                                   └─ sw_bleed_minor_1 (cost 55)
                                        └─ sw_universal_vigor_spark (cost 50)
                                             └─ sw_atk_spd_2 (cost 45)
                                                  └─ sw_atk_spd_1 (cost 50)
                                                       └─ sw_dmg_1 (cost 50)
                                                            └─ sw_dmg_2 (cost 45)
                                                                 └─ sw_universal_swift_spark (cost 50)
                                                                      └─ sw_sonic_minor_1 (cost 55)
                                                                           └─ sw_speed_1 (cost 50)
                                                                                └─ sw_speed_2 (cost 50)
                                                                                     └─ sw_universal_insight_spark (cost 50)
                                                                                          └─ sw_magnet_1 (cost 55)
                                                                                               └─ sw_magnet_2 (cost 55)
                                                                                                    └─ sw_blood_siphon [notable] (cost 370)
                                                                                                         └─ sw_warlord_filler_1 (cost 180)
                                                                                                              └─ sw_keystone_warlord (cost 800)
                                                                                                                   └─ sw_keystone_warlord_asc1 (cost 280)
                                                                                                                        └─ sw_keystone_warlord_asc2 [KEYSTONE] (cost 1040)
```


<a id="sorceress"></a>
## Sorceress (rootId: so_root, 45 nodes)

_title: The Storm Weaver — 3 Elemental Archetypes / ผู้ทอสายฟ้าและพายุ — 3 สายธาตุแห่งความเชี่ยวชาญ_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| so_root | แก่นเส้นเวทสายฟ้า / Arcane Leyline Core | root | so_cryo_minor_1, so_volt_minor_1, so_orb_minor_1, so_mana_1 | 0 | maxHp:10 | — |
| so_cryo_minor_1 | ผลึกน้ำค้างแข็ง / Rime Crystal | minor | so_root, so_cryo_minor_1b, so_volt_minor_1 | 50 | damageBonus:0.5 | — |
| so_cryo_minor_1b | เข็มน้ำแข็งขาว / Hoarfrost Needle | minor | so_cryo_minor_1, so_cryo_minor_2 | 45 | damageBonus:0.5 | — |
| so_cryo_minor_2 | ความเย็นน้ำแข็งถาวร / Permafrost Chill | minor | so_cryo_minor_1b, so_cryo_minor_2b, so_orb_minor_2 | 55 | maxHp:5 | — |
| so_cryo_minor_2b | ไขกระดูกน้ำแข็งกัด / Frostbitten Marrow | minor | so_cryo_minor_2, sorceress_frost | 55 | maxHp:5 | — |
| sorceress_frost | คลื่นระเบิดน้ำแข็ง / Frost Nova Surge | notable | so_cryo_minor_2b, so_frost_filler_1 | 370 | — [element: lightning_frost] | sorceress_frost |
| so_frost_filler_1 | สมาธิผูกน้ำแข็ง / Rime-Bound Focus | minor | sorceress_frost, so_glacial_shatter | 160 | damageBonus:0.5 | — |
| so_glacial_shatter | แตกกระจายน้ำแข็ง / Glacial Shatter | notable | so_frost_filler_1, so_frost_filler_2 | 390 | — [element: lightning_frost] | so_glacial_shatter |
| so_frost_filler_2 | แก่นน้ำแข็งนิรันดร์ / Everfrost Core | minor | so_glacial_shatter, so_keystone_frost | 170 | maxHp:8 | — |
| so_keystone_frost | ศูนย์องศาสัมบูรณ์ / Absolute Zero | keystone | so_frost_filler_2, so_keystone_frost_asc1 | 820 | maxHp:30, damageBonus:2 | — |
| so_keystone_frost_asc1 | ศูนย์องศาขั้นสูง / Greater Zero | minor | so_keystone_frost, so_keystone_frost_asc2 | 285 | maxHp:9, damageBonus:0.5 | — |
| so_keystone_frost_asc2 | ศูนย์องศาเหนือขีดจำกัด / Transcendent Zero | keystone | so_keystone_frost_asc1 | 1070 | maxHp:30, damageBonus:2 | — |
| so_volt_minor_1 | ประกายไฟประจุไฟฟ้า / Ionic Spark | minor | so_root, so_cryo_minor_1, so_volt_minor_1b | 50 | damageBonus:0.5 | — |
| so_volt_minor_1b | เส้นใยสายฟ้าฟาด / Arcing Filament | minor | so_volt_minor_1, so_volt_minor_2 | 45 | damageBonus:0.5 | — |
| so_volt_minor_2 | ตัวนำไฟฟ้าสถิต / Static Conductor | minor | so_volt_minor_1b, so_volt_minor_2b, so_speed_1 | 55 | moveSpeed:0.5 | — |
| so_volt_minor_2b | ปฏิกิริยาไฟฟ้าประจุ / Charged Reflexes | minor | so_volt_minor_2, sorceress_overcharge | 55 | moveSpeed:0.5 | — |
| sorceress_overcharge | สายฟ้าโอเวอร์ชาร์จ / Lightning Overcharge | notable | so_volt_minor_2b, so_volt_filler_1 | 370 | — [element: lightning_frost] | sorceress_overcharge |
| so_volt_filler_1 | สะสมประจุไฟฟ้า / Voltaic Buildup | minor | sorceress_overcharge, so_static_field | 160 | damageBonus:0.5 | — |
| so_static_field | คลื่นสนามไฟฟ้าสถิต / Static Field Pulse | notable | so_volt_filler_1, so_volt_filler_2 | 390 | — [element: lightning_frost] | so_static_field |
| so_volt_filler_2 | ท่อนำพายุ / Storm Conduit | minor | so_static_field, so_keystone_tempest | 170 | moveSpeed:0.5 | — |
| so_keystone_tempest | จอมราชันย์วังวนพายุ / Maelstrom Sovereign | keystone | so_volt_filler_2, so_keystone_tempest_asc1 | 820 | damageBonus:2 | — |
| so_keystone_tempest_asc1 | จอมราชันย์ขั้นสูง / Greater Sovereign | minor | so_keystone_tempest, so_keystone_tempest_asc2 | 285 | damageBonus:0.5 | — |
| so_keystone_tempest_asc2 | จอมราชันย์เหนือขีดจำกัด / Transcendent Sovereign | keystone | so_keystone_tempest_asc1 | 1070 | damageBonus:2 | — |
| so_orb_minor_1 | เกราะป้องกันน้ำแข็ง / Glacial Ward | minor | so_root, so_orb_minor_1b, so_mana_1 | 50 | defense:0.5 | — |
| so_orb_minor_1b | น้ำแข็งพิทักษ์ / Warding Frost | minor | so_orb_minor_1, so_orb_minor_2 | 45 | defense:0.5 | — |
| so_orb_minor_2 | พลังผูกพันวงโคจร / Orbital Affinity | minor | so_cryo_minor_2, so_orb_minor_1b, so_orb_minor_2b | 60 | defense:0.5, maxHp:5 | — |
| so_orb_minor_2b | ป้อมปราการน้ำแข็ง / Frozen Bastion | minor | so_orb_minor_2, sorceress_orbs | 55 | defense:0.5, maxHp:5 | — |
| sorceress_orbs | ลูกแก้วน้ำแข็งโคจร / Orbital Frost Orbs | notable | so_orb_minor_2b, so_orb_filler_1 | 420 | — [element: lightning_frost] | sorceress_orbs |
| so_orb_filler_1 | แผ่นเกราะน้ำแข็ง / Glacial Plating | minor | sorceress_orbs, so_astral_aegis | 160 | defense:0.5 | — |
| so_astral_aegis | โล่ดวงดาว / Astral Aegis | notable | so_orb_filler_1, so_orb_filler_2 | 390 | — [element: lightning_frost] | so_astral_aegis |
| so_orb_filler_2 | แก่นแห่งโล่ / Aegis Core | minor | so_astral_aegis, so_keystone_celestial | 170 | maxHp:8 | — |
| so_keystone_celestial | จุดบรรจบแห่งสวรรค์ / Celestial Convergence | keystone | so_orb_filler_2, so_keystone_celestial_asc1 | 840 | defense:2, maxHp:30 | — |
| so_keystone_celestial_asc1 | จุดบรรจบขั้นสูง / Greater Convergence | minor | so_keystone_celestial, so_keystone_celestial_asc2 | 295 | maxHp:9, defense:0.5 | — |
| so_keystone_celestial_asc2 | จุดบรรจบเหนือขีดจำกัด / Transcendent Convergence | keystone | so_keystone_celestial_asc1 | 1090 | maxHp:30, defense:2 | — |
| so_mana_1 | อ่างเก็บพลังดวงดาว / Astral Reservoir | minor | so_root, so_orb_minor_1, so_mana_1b | 50 | maxHp:8 | — |
| so_mana_1b | พลังล้นอ่างเก็บ / Reservoir Overflow | minor | so_mana_1, so_speed_1 | 45 | maxHp:7 | — |
| so_speed_1 | ก้าวข้ามมิติอีเธอร์ / Aether Phase | minor | so_volt_minor_2, so_mana_1b, so_speed_1b | 50 | moveSpeed:0.5 | — |
| so_speed_1b | อีเธอร์ล่องลม / Windswept Aether | minor | so_speed_1, so_magnet_1 | 50 | moveSpeed:0.5 | — |
| so_magnet_1 | ดูดพลังเส้นเวท / Leyline Siphon | minor | so_speed_1b, so_magnet_1b | 55 | pickupRadius:0.5 | — |
| so_magnet_1b | หลุมแรงโน้มถ่วง / Gravity Well | minor | so_magnet_1, so_spark_detonation | 55 | pickupRadius:0.5 | — |
| so_spark_detonation | ระเบิดประกายไฟ / Spark Detonation | notable | so_magnet_1b, so_mana_filler_1 | 370 | — [element: lightning_frost] | so_spark_detonation |
| so_mana_filler_1 | คลื่นประจุไฟฟ้าพุ่ง / Ionized Surge | minor | so_spark_detonation, so_keystone_singularity | 175 | damageBonus:0.5 | — |
| so_keystone_singularity | ภาวะเอกฐานแห่งดวงดาว / Astral Singularity | keystone | so_mana_filler_1, so_keystone_singularity_asc1 | 800 | pickupRadius:1, maxHp:15, damageBonus:1 | — |
| so_keystone_singularity_asc1 | ภาวะเอกฐานขั้นสูง / Greater Singularity | minor | so_keystone_singularity, so_keystone_singularity_asc2 | 280 | maxHp:5, pickupRadius:0.5, damageBonus:0.5 | — |
| so_keystone_singularity_asc2 | ภาวะเอกฐานเหนือขีดจำกัด / Transcendent Singularity | keystone | so_keystone_singularity_asc1 | 1040 | maxHp:15, pickupRadius:1, damageBonus:1 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → so_keystone_frost (ศูนย์องศาสัมบูรณ์ / Absolute Zero, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_cryo_minor_2b (cost 55)
                         └─ sorceress_frost [notable] (cost 370)
                              └─ so_frost_filler_1 (cost 160)
                                   └─ so_glacial_shatter [notable] (cost 390)
                                        └─ so_frost_filler_2 (cost 170)
                                             └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_2b (cost 55)
                              └─ sorceress_frost [notable] (cost 370)
                                   └─ so_frost_filler_1 (cost 160)
                                        └─ so_glacial_shatter [notable] (cost 390)
                                             └─ so_frost_filler_2 (cost 170)
                                                  └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_2b (cost 55)
                              └─ sorceress_frost [notable] (cost 370)
                                   └─ so_frost_filler_1 (cost 160)
                                        └─ so_glacial_shatter [notable] (cost 390)
                                             └─ so_frost_filler_2 (cost 170)
                                                  └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_cryo_minor_2 (cost 55)
                              └─ so_cryo_minor_2b (cost 55)
                                   └─ sorceress_frost [notable] (cost 370)
                                        └─ so_frost_filler_1 (cost 160)
                                             └─ so_glacial_shatter [notable] (cost 390)
                                                  └─ so_frost_filler_2 (cost 170)
                                                       └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_1b (cost 45)
                              └─ so_volt_minor_1 (cost 50)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_cryo_minor_1b (cost 45)
                                             └─ so_cryo_minor_2 (cost 55)
                                                  └─ so_cryo_minor_2b (cost 55)
                                                       └─ sorceress_frost [notable] (cost 370)
                                                            └─ so_frost_filler_1 (cost 160)
                                                                 └─ so_glacial_shatter [notable] (cost 390)
                                                                      └─ so_frost_filler_2 (cost 170)
                                                                           └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_speed_1 (cost 50)
                         └─ so_mana_1b (cost 45)
                              └─ so_mana_1 (cost 50)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_orb_minor_1b (cost 45)
                                             └─ so_orb_minor_2 (cost 60)
                                                  └─ so_cryo_minor_2 (cost 55)
                                                       └─ so_cryo_minor_2b (cost 55)
                                                            └─ sorceress_frost [notable] (cost 370)
                                                                 └─ so_frost_filler_1 (cost 160)
                                                                      └─ so_glacial_shatter [notable] (cost 390)
                                                                           └─ so_frost_filler_2 (cost 170)
                                                                                └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_volt_minor_2 (cost 55)
                              └─ so_volt_minor_1b (cost 45)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_cryo_minor_1 (cost 50)
                                             └─ so_cryo_minor_1b (cost 45)
                                                  └─ so_cryo_minor_2 (cost 55)
                                                       └─ so_cryo_minor_2b (cost 55)
                                                            └─ sorceress_frost [notable] (cost 370)
                                                                 └─ so_frost_filler_1 (cost 160)
                                                                      └─ so_glacial_shatter [notable] (cost 390)
                                                                           └─ so_frost_filler_2 (cost 170)
                                                                                └─ so_keystone_frost [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_speed_1 (cost 50)
                              └─ so_mana_1b (cost 45)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_orb_minor_1 (cost 50)
                                             └─ so_orb_minor_1b (cost 45)
                                                  └─ so_orb_minor_2 (cost 60)
                                                       └─ so_cryo_minor_2 (cost 55)
                                                            └─ so_cryo_minor_2b (cost 55)
                                                                 └─ sorceress_frost [notable] (cost 370)
                                                                      └─ so_frost_filler_1 (cost 160)
                                                                           └─ so_glacial_shatter [notable] (cost 390)
                                                                                └─ so_frost_filler_2 (cost 170)
                                                                                     └─ so_keystone_frost [KEYSTONE] (cost 820)
```

#### → so_keystone_frost_asc2 (ศูนย์องศาเหนือขีดจำกัด / Transcendent Zero, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_cryo_minor_2b (cost 55)
                         └─ sorceress_frost [notable] (cost 370)
                              └─ so_frost_filler_1 (cost 160)
                                   └─ so_glacial_shatter [notable] (cost 390)
                                        └─ so_frost_filler_2 (cost 170)
                                             └─ so_keystone_frost (cost 820)
                                                  └─ so_keystone_frost_asc1 (cost 285)
                                                       └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_2b (cost 55)
                              └─ sorceress_frost [notable] (cost 370)
                                   └─ so_frost_filler_1 (cost 160)
                                        └─ so_glacial_shatter [notable] (cost 390)
                                             └─ so_frost_filler_2 (cost 170)
                                                  └─ so_keystone_frost (cost 820)
                                                       └─ so_keystone_frost_asc1 (cost 285)
                                                            └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_2b (cost 55)
                              └─ sorceress_frost [notable] (cost 370)
                                   └─ so_frost_filler_1 (cost 160)
                                        └─ so_glacial_shatter [notable] (cost 390)
                                             └─ so_frost_filler_2 (cost 170)
                                                  └─ so_keystone_frost (cost 820)
                                                       └─ so_keystone_frost_asc1 (cost 285)
                                                            └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_cryo_minor_2 (cost 55)
                              └─ so_cryo_minor_2b (cost 55)
                                   └─ sorceress_frost [notable] (cost 370)
                                        └─ so_frost_filler_1 (cost 160)
                                             └─ so_glacial_shatter [notable] (cost 390)
                                                  └─ so_frost_filler_2 (cost 170)
                                                       └─ so_keystone_frost (cost 820)
                                                            └─ so_keystone_frost_asc1 (cost 285)
                                                                 └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_1b (cost 45)
                              └─ so_volt_minor_1 (cost 50)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_cryo_minor_1b (cost 45)
                                             └─ so_cryo_minor_2 (cost 55)
                                                  └─ so_cryo_minor_2b (cost 55)
                                                       └─ sorceress_frost [notable] (cost 370)
                                                            └─ so_frost_filler_1 (cost 160)
                                                                 └─ so_glacial_shatter [notable] (cost 390)
                                                                      └─ so_frost_filler_2 (cost 170)
                                                                           └─ so_keystone_frost (cost 820)
                                                                                └─ so_keystone_frost_asc1 (cost 285)
                                                                                     └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_speed_1 (cost 50)
                         └─ so_mana_1b (cost 45)
                              └─ so_mana_1 (cost 50)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_orb_minor_1b (cost 45)
                                             └─ so_orb_minor_2 (cost 60)
                                                  └─ so_cryo_minor_2 (cost 55)
                                                       └─ so_cryo_minor_2b (cost 55)
                                                            └─ sorceress_frost [notable] (cost 370)
                                                                 └─ so_frost_filler_1 (cost 160)
                                                                      └─ so_glacial_shatter [notable] (cost 390)
                                                                           └─ so_frost_filler_2 (cost 170)
                                                                                └─ so_keystone_frost (cost 820)
                                                                                     └─ so_keystone_frost_asc1 (cost 285)
                                                                                          └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_volt_minor_2 (cost 55)
                              └─ so_volt_minor_1b (cost 45)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_cryo_minor_1 (cost 50)
                                             └─ so_cryo_minor_1b (cost 45)
                                                  └─ so_cryo_minor_2 (cost 55)
                                                       └─ so_cryo_minor_2b (cost 55)
                                                            └─ sorceress_frost [notable] (cost 370)
                                                                 └─ so_frost_filler_1 (cost 160)
                                                                      └─ so_glacial_shatter [notable] (cost 390)
                                                                           └─ so_frost_filler_2 (cost 170)
                                                                                └─ so_keystone_frost (cost 820)
                                                                                     └─ so_keystone_frost_asc1 (cost 285)
                                                                                          └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_speed_1 (cost 50)
                              └─ so_mana_1b (cost 45)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_orb_minor_1 (cost 50)
                                             └─ so_orb_minor_1b (cost 45)
                                                  └─ so_orb_minor_2 (cost 60)
                                                       └─ so_cryo_minor_2 (cost 55)
                                                            └─ so_cryo_minor_2b (cost 55)
                                                                 └─ sorceress_frost [notable] (cost 370)
                                                                      └─ so_frost_filler_1 (cost 160)
                                                                           └─ so_glacial_shatter [notable] (cost 390)
                                                                                └─ so_frost_filler_2 (cost 170)
                                                                                     └─ so_keystone_frost (cost 820)
                                                                                          └─ so_keystone_frost_asc1 (cost 285)
                                                                                               └─ so_keystone_frost_asc2 [KEYSTONE] (cost 1070)
```

#### → so_keystone_tempest (จอมราชันย์วังวนพายุ / Maelstrom Sovereign, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_volt_minor_2b (cost 55)
                         └─ sorceress_overcharge [notable] (cost 370)
                              └─ so_volt_filler_1 (cost 160)
                                   └─ so_static_field [notable] (cost 390)
                                        └─ so_volt_filler_2 (cost 170)
                                             └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_2b (cost 55)
                              └─ sorceress_overcharge [notable] (cost 370)
                                   └─ so_volt_filler_1 (cost 160)
                                        └─ so_static_field [notable] (cost 390)
                                             └─ so_volt_filler_2 (cost 170)
                                                  └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_2b (cost 55)
                              └─ sorceress_overcharge [notable] (cost 370)
                                   └─ so_volt_filler_1 (cost 160)
                                        └─ so_static_field [notable] (cost 390)
                                             └─ so_volt_filler_2 (cost 170)
                                                  └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_volt_minor_2 (cost 55)
                              └─ so_volt_minor_2b (cost 55)
                                   └─ sorceress_overcharge [notable] (cost 370)
                                        └─ so_volt_filler_1 (cost 160)
                                             └─ so_static_field [notable] (cost 390)
                                                  └─ so_volt_filler_2 (cost 170)
                                                       └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_1b (cost 45)
                              └─ so_cryo_minor_1 (cost 50)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_volt_minor_1b (cost 45)
                                             └─ so_volt_minor_2 (cost 55)
                                                  └─ so_volt_minor_2b (cost 55)
                                                       └─ sorceress_overcharge [notable] (cost 370)
                                                            └─ so_volt_filler_1 (cost 160)
                                                                 └─ so_static_field [notable] (cost 390)
                                                                      └─ so_volt_filler_2 (cost 170)
                                                                           └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_1b (cost 45)
                              └─ so_orb_minor_1 (cost 50)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_mana_1b (cost 45)
                                             └─ so_speed_1 (cost 50)
                                                  └─ so_volt_minor_2 (cost 55)
                                                       └─ so_volt_minor_2b (cost 55)
                                                            └─ sorceress_overcharge [notable] (cost 370)
                                                                 └─ so_volt_filler_1 (cost 160)
                                                                      └─ so_static_field [notable] (cost 390)
                                                                           └─ so_volt_filler_2 (cost 170)
                                                                                └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_cryo_minor_2 (cost 55)
                              └─ so_cryo_minor_1b (cost 45)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_volt_minor_1 (cost 50)
                                             └─ so_volt_minor_1b (cost 45)
                                                  └─ so_volt_minor_2 (cost 55)
                                                       └─ so_volt_minor_2b (cost 55)
                                                            └─ sorceress_overcharge [notable] (cost 370)
                                                                 └─ so_volt_filler_1 (cost 160)
                                                                      └─ so_static_field [notable] (cost 390)
                                                                           └─ so_volt_filler_2 (cost 170)
                                                                                └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_orb_minor_2 (cost 60)
                              └─ so_orb_minor_1b (cost 45)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_mana_1 (cost 50)
                                             └─ so_mana_1b (cost 45)
                                                  └─ so_speed_1 (cost 50)
                                                       └─ so_volt_minor_2 (cost 55)
                                                            └─ so_volt_minor_2b (cost 55)
                                                                 └─ sorceress_overcharge [notable] (cost 370)
                                                                      └─ so_volt_filler_1 (cost 160)
                                                                           └─ so_static_field [notable] (cost 390)
                                                                                └─ so_volt_filler_2 (cost 170)
                                                                                     └─ so_keystone_tempest [KEYSTONE] (cost 820)
```

#### → so_keystone_tempest_asc2 (จอมราชันย์เหนือขีดจำกัด / Transcendent Sovereign, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_volt_minor_2b (cost 55)
                         └─ sorceress_overcharge [notable] (cost 370)
                              └─ so_volt_filler_1 (cost 160)
                                   └─ so_static_field [notable] (cost 390)
                                        └─ so_volt_filler_2 (cost 170)
                                             └─ so_keystone_tempest (cost 820)
                                                  └─ so_keystone_tempest_asc1 (cost 285)
                                                       └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_2b (cost 55)
                              └─ sorceress_overcharge [notable] (cost 370)
                                   └─ so_volt_filler_1 (cost 160)
                                        └─ so_static_field [notable] (cost 390)
                                             └─ so_volt_filler_2 (cost 170)
                                                  └─ so_keystone_tempest (cost 820)
                                                       └─ so_keystone_tempest_asc1 (cost 285)
                                                            └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_2b (cost 55)
                              └─ sorceress_overcharge [notable] (cost 370)
                                   └─ so_volt_filler_1 (cost 160)
                                        └─ so_static_field [notable] (cost 390)
                                             └─ so_volt_filler_2 (cost 170)
                                                  └─ so_keystone_tempest (cost 820)
                                                       └─ so_keystone_tempest_asc1 (cost 285)
                                                            └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_volt_minor_2 (cost 55)
                              └─ so_volt_minor_2b (cost 55)
                                   └─ sorceress_overcharge [notable] (cost 370)
                                        └─ so_volt_filler_1 (cost 160)
                                             └─ so_static_field [notable] (cost 390)
                                                  └─ so_volt_filler_2 (cost 170)
                                                       └─ so_keystone_tempest (cost 820)
                                                            └─ so_keystone_tempest_asc1 (cost 285)
                                                                 └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_1b (cost 45)
                              └─ so_cryo_minor_1 (cost 50)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_volt_minor_1b (cost 45)
                                             └─ so_volt_minor_2 (cost 55)
                                                  └─ so_volt_minor_2b (cost 55)
                                                       └─ sorceress_overcharge [notable] (cost 370)
                                                            └─ so_volt_filler_1 (cost 160)
                                                                 └─ so_static_field [notable] (cost 390)
                                                                      └─ so_volt_filler_2 (cost 170)
                                                                           └─ so_keystone_tempest (cost 820)
                                                                                └─ so_keystone_tempest_asc1 (cost 285)
                                                                                     └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_1b (cost 45)
                              └─ so_orb_minor_1 (cost 50)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_mana_1b (cost 45)
                                             └─ so_speed_1 (cost 50)
                                                  └─ so_volt_minor_2 (cost 55)
                                                       └─ so_volt_minor_2b (cost 55)
                                                            └─ sorceress_overcharge [notable] (cost 370)
                                                                 └─ so_volt_filler_1 (cost 160)
                                                                      └─ so_static_field [notable] (cost 390)
                                                                           └─ so_volt_filler_2 (cost 170)
                                                                                └─ so_keystone_tempest (cost 820)
                                                                                     └─ so_keystone_tempest_asc1 (cost 285)
                                                                                          └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_cryo_minor_2 (cost 55)
                              └─ so_cryo_minor_1b (cost 45)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_volt_minor_1 (cost 50)
                                             └─ so_volt_minor_1b (cost 45)
                                                  └─ so_volt_minor_2 (cost 55)
                                                       └─ so_volt_minor_2b (cost 55)
                                                            └─ sorceress_overcharge [notable] (cost 370)
                                                                 └─ so_volt_filler_1 (cost 160)
                                                                      └─ so_static_field [notable] (cost 390)
                                                                           └─ so_volt_filler_2 (cost 170)
                                                                                └─ so_keystone_tempest (cost 820)
                                                                                     └─ so_keystone_tempest_asc1 (cost 285)
                                                                                          └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_orb_minor_2 (cost 60)
                              └─ so_orb_minor_1b (cost 45)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_mana_1 (cost 50)
                                             └─ so_mana_1b (cost 45)
                                                  └─ so_speed_1 (cost 50)
                                                       └─ so_volt_minor_2 (cost 55)
                                                            └─ so_volt_minor_2b (cost 55)
                                                                 └─ sorceress_overcharge [notable] (cost 370)
                                                                      └─ so_volt_filler_1 (cost 160)
                                                                           └─ so_static_field [notable] (cost 390)
                                                                                └─ so_volt_filler_2 (cost 170)
                                                                                     └─ so_keystone_tempest (cost 820)
                                                                                          └─ so_keystone_tempest_asc1 (cost 285)
                                                                                               └─ so_keystone_tempest_asc2 [KEYSTONE] (cost 1070)
```

#### → so_keystone_celestial (จุดบรรจบแห่งสวรรค์ / Celestial Convergence, cost 840)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_orb_minor_2b (cost 55)
                         └─ sorceress_orbs [notable] (cost 420)
                              └─ so_orb_filler_1 (cost 160)
                                   └─ so_astral_aegis [notable] (cost 390)
                                        └─ so_orb_filler_2 (cost 170)
                                             └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_2b (cost 55)
                              └─ sorceress_orbs [notable] (cost 420)
                                   └─ so_orb_filler_1 (cost 160)
                                        └─ so_astral_aegis [notable] (cost 390)
                                             └─ so_orb_filler_2 (cost 170)
                                                  └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_2b (cost 55)
                              └─ sorceress_orbs [notable] (cost 420)
                                   └─ so_orb_filler_1 (cost 160)
                                        └─ so_astral_aegis [notable] (cost 390)
                                             └─ so_orb_filler_2 (cost 170)
                                                  └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_orb_minor_2 (cost 60)
                              └─ so_orb_minor_2b (cost 55)
                                   └─ sorceress_orbs [notable] (cost 420)
                                        └─ so_orb_filler_1 (cost 160)
                                             └─ so_astral_aegis [notable] (cost 390)
                                                  └─ so_orb_filler_2 (cost 170)
                                                       └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_speed_1 (cost 50)
                         └─ so_mana_1b (cost 45)
                              └─ so_mana_1 (cost 50)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_orb_minor_1b (cost 45)
                                             └─ so_orb_minor_2 (cost 60)
                                                  └─ so_orb_minor_2b (cost 55)
                                                       └─ sorceress_orbs [notable] (cost 420)
                                                            └─ so_orb_filler_1 (cost 160)
                                                                 └─ so_astral_aegis [notable] (cost 390)
                                                                      └─ so_orb_filler_2 (cost 170)
                                                                           └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_speed_1 (cost 50)
                              └─ so_mana_1b (cost 45)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_orb_minor_1 (cost 50)
                                             └─ so_orb_minor_1b (cost 45)
                                                  └─ so_orb_minor_2 (cost 60)
                                                       └─ so_orb_minor_2b (cost 55)
                                                            └─ sorceress_orbs [notable] (cost 420)
                                                                 └─ so_orb_filler_1 (cost 160)
                                                                      └─ so_astral_aegis [notable] (cost 390)
                                                                           └─ so_orb_filler_2 (cost 170)
                                                                                └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_1b (cost 45)
                              └─ so_volt_minor_1 (cost 50)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_cryo_minor_1b (cost 45)
                                             └─ so_cryo_minor_2 (cost 55)
                                                  └─ so_orb_minor_2 (cost 60)
                                                       └─ so_orb_minor_2b (cost 55)
                                                            └─ sorceress_orbs [notable] (cost 420)
                                                                 └─ so_orb_filler_1 (cost 160)
                                                                      └─ so_astral_aegis [notable] (cost 390)
                                                                           └─ so_orb_filler_2 (cost 170)
                                                                                └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_volt_minor_2 (cost 55)
                              └─ so_volt_minor_1b (cost 45)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_cryo_minor_1 (cost 50)
                                             └─ so_cryo_minor_1b (cost 45)
                                                  └─ so_cryo_minor_2 (cost 55)
                                                       └─ so_orb_minor_2 (cost 60)
                                                            └─ so_orb_minor_2b (cost 55)
                                                                 └─ sorceress_orbs [notable] (cost 420)
                                                                      └─ so_orb_filler_1 (cost 160)
                                                                           └─ so_astral_aegis [notable] (cost 390)
                                                                                └─ so_orb_filler_2 (cost 170)
                                                                                     └─ so_keystone_celestial [KEYSTONE] (cost 840)
```

#### → so_keystone_celestial_asc2 (จุดบรรจบเหนือขีดจำกัด / Transcendent Convergence, cost 1090)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_orb_minor_2b (cost 55)
                         └─ sorceress_orbs [notable] (cost 420)
                              └─ so_orb_filler_1 (cost 160)
                                   └─ so_astral_aegis [notable] (cost 390)
                                        └─ so_orb_filler_2 (cost 170)
                                             └─ so_keystone_celestial (cost 840)
                                                  └─ so_keystone_celestial_asc1 (cost 295)
                                                       └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_2b (cost 55)
                              └─ sorceress_orbs [notable] (cost 420)
                                   └─ so_orb_filler_1 (cost 160)
                                        └─ so_astral_aegis [notable] (cost 390)
                                             └─ so_orb_filler_2 (cost 170)
                                                  └─ so_keystone_celestial (cost 840)
                                                       └─ so_keystone_celestial_asc1 (cost 295)
                                                            └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_2b (cost 55)
                              └─ sorceress_orbs [notable] (cost 420)
                                   └─ so_orb_filler_1 (cost 160)
                                        └─ so_astral_aegis [notable] (cost 390)
                                             └─ so_orb_filler_2 (cost 170)
                                                  └─ so_keystone_celestial (cost 840)
                                                       └─ so_keystone_celestial_asc1 (cost 295)
                                                            └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_orb_minor_2 (cost 60)
                              └─ so_orb_minor_2b (cost 55)
                                   └─ sorceress_orbs [notable] (cost 420)
                                        └─ so_orb_filler_1 (cost 160)
                                             └─ so_astral_aegis [notable] (cost 390)
                                                  └─ so_orb_filler_2 (cost 170)
                                                       └─ so_keystone_celestial (cost 840)
                                                            └─ so_keystone_celestial_asc1 (cost 295)
                                                                 └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_speed_1 (cost 50)
                         └─ so_mana_1b (cost 45)
                              └─ so_mana_1 (cost 50)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_orb_minor_1b (cost 45)
                                             └─ so_orb_minor_2 (cost 60)
                                                  └─ so_orb_minor_2b (cost 55)
                                                       └─ sorceress_orbs [notable] (cost 420)
                                                            └─ so_orb_filler_1 (cost 160)
                                                                 └─ so_astral_aegis [notable] (cost 390)
                                                                      └─ so_orb_filler_2 (cost 170)
                                                                           └─ so_keystone_celestial (cost 840)
                                                                                └─ so_keystone_celestial_asc1 (cost 295)
                                                                                     └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_speed_1 (cost 50)
                              └─ so_mana_1b (cost 45)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_orb_minor_1 (cost 50)
                                             └─ so_orb_minor_1b (cost 45)
                                                  └─ so_orb_minor_2 (cost 60)
                                                       └─ so_orb_minor_2b (cost 55)
                                                            └─ sorceress_orbs [notable] (cost 420)
                                                                 └─ so_orb_filler_1 (cost 160)
                                                                      └─ so_astral_aegis [notable] (cost 390)
                                                                           └─ so_orb_filler_2 (cost 170)
                                                                                └─ so_keystone_celestial (cost 840)
                                                                                     └─ so_keystone_celestial_asc1 (cost 295)
                                                                                          └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_volt_minor_1b (cost 45)
                              └─ so_volt_minor_1 (cost 50)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_cryo_minor_1b (cost 45)
                                             └─ so_cryo_minor_2 (cost 55)
                                                  └─ so_orb_minor_2 (cost 60)
                                                       └─ so_orb_minor_2b (cost 55)
                                                            └─ sorceress_orbs [notable] (cost 420)
                                                                 └─ so_orb_filler_1 (cost 160)
                                                                      └─ so_astral_aegis [notable] (cost 390)
                                                                           └─ so_orb_filler_2 (cost 170)
                                                                                └─ so_keystone_celestial (cost 840)
                                                                                     └─ so_keystone_celestial_asc1 (cost 295)
                                                                                          └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_volt_minor_2 (cost 55)
                              └─ so_volt_minor_1b (cost 45)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_cryo_minor_1 (cost 50)
                                             └─ so_cryo_minor_1b (cost 45)
                                                  └─ so_cryo_minor_2 (cost 55)
                                                       └─ so_orb_minor_2 (cost 60)
                                                            └─ so_orb_minor_2b (cost 55)
                                                                 └─ sorceress_orbs [notable] (cost 420)
                                                                      └─ so_orb_filler_1 (cost 160)
                                                                           └─ so_astral_aegis [notable] (cost 390)
                                                                                └─ so_orb_filler_2 (cost 170)
                                                                                     └─ so_keystone_celestial (cost 840)
                                                                                          └─ so_keystone_celestial_asc1 (cost 295)
                                                                                               └─ so_keystone_celestial_asc2 [KEYSTONE] (cost 1090)
```

#### → so_keystone_singularity (ภาวะเอกฐานแห่งดวงดาว / Astral Singularity, cost 800)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_speed_1b (cost 50)
                         └─ so_magnet_1 (cost 55)
                              └─ so_magnet_1b (cost 55)
                                   └─ so_spark_detonation [notable] (cost 370)
                                        └─ so_mana_filler_1 (cost 175)
                                             └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_speed_1 (cost 50)
                         └─ so_speed_1b (cost 50)
                              └─ so_magnet_1 (cost 55)
                                   └─ so_magnet_1b (cost 55)
                                        └─ so_spark_detonation [notable] (cost 370)
                                             └─ so_mana_filler_1 (cost 175)
                                                  └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_speed_1b (cost 50)
                              └─ so_magnet_1 (cost 55)
                                   └─ so_magnet_1b (cost 55)
                                        └─ so_spark_detonation [notable] (cost 370)
                                             └─ so_mana_filler_1 (cost 175)
                                                  └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_speed_1 (cost 50)
                              └─ so_speed_1b (cost 50)
                                   └─ so_magnet_1 (cost 55)
                                        └─ so_magnet_1b (cost 55)
                                             └─ so_spark_detonation [notable] (cost 370)
                                                  └─ so_mana_filler_1 (cost 175)
                                                       └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_1b (cost 45)
                              └─ so_orb_minor_1 (cost 50)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_mana_1b (cost 45)
                                             └─ so_speed_1 (cost 50)
                                                  └─ so_speed_1b (cost 50)
                                                       └─ so_magnet_1 (cost 55)
                                                            └─ so_magnet_1b (cost 55)
                                                                 └─ so_spark_detonation [notable] (cost 370)
                                                                      └─ so_mana_filler_1 (cost 175)
                                                                           └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_orb_minor_2 (cost 60)
                              └─ so_orb_minor_1b (cost 45)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_mana_1 (cost 50)
                                             └─ so_mana_1b (cost 45)
                                                  └─ so_speed_1 (cost 50)
                                                       └─ so_speed_1b (cost 50)
                                                            └─ so_magnet_1 (cost 55)
                                                                 └─ so_magnet_1b (cost 55)
                                                                      └─ so_spark_detonation [notable] (cost 370)
                                                                           └─ so_mana_filler_1 (cost 175)
                                                                                └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_1b (cost 45)
                              └─ so_cryo_minor_1 (cost 50)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_volt_minor_1b (cost 45)
                                             └─ so_volt_minor_2 (cost 55)
                                                  └─ so_speed_1 (cost 50)
                                                       └─ so_speed_1b (cost 50)
                                                            └─ so_magnet_1 (cost 55)
                                                                 └─ so_magnet_1b (cost 55)
                                                                      └─ so_spark_detonation [notable] (cost 370)
                                                                           └─ so_mana_filler_1 (cost 175)
                                                                                └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_cryo_minor_2 (cost 55)
                              └─ so_cryo_minor_1b (cost 45)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_volt_minor_1 (cost 50)
                                             └─ so_volt_minor_1b (cost 45)
                                                  └─ so_volt_minor_2 (cost 55)
                                                       └─ so_speed_1 (cost 50)
                                                            └─ so_speed_1b (cost 50)
                                                                 └─ so_magnet_1 (cost 55)
                                                                      └─ so_magnet_1b (cost 55)
                                                                           └─ so_spark_detonation [notable] (cost 370)
                                                                                └─ so_mana_filler_1 (cost 175)
                                                                                     └─ so_keystone_singularity [KEYSTONE] (cost 800)
```

#### → so_keystone_singularity_asc2 (ภาวะเอกฐานเหนือขีดจำกัด / Transcendent Singularity, cost 1040)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_mana_1b (cost 45)
               └─ so_speed_1 (cost 50)
                    └─ so_speed_1b (cost 50)
                         └─ so_magnet_1 (cost 55)
                              └─ so_magnet_1b (cost 55)
                                   └─ so_spark_detonation [notable] (cost 370)
                                        └─ so_mana_filler_1 (cost 175)
                                             └─ so_keystone_singularity (cost 800)
                                                  └─ so_keystone_singularity_asc1 (cost 280)
                                                       └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 2:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_volt_minor_1b (cost 45)
               └─ so_volt_minor_2 (cost 55)
                    └─ so_speed_1 (cost 50)
                         └─ so_speed_1b (cost 50)
                              └─ so_magnet_1 (cost 55)
                                   └─ so_magnet_1b (cost 55)
                                        └─ so_spark_detonation [notable] (cost 370)
                                             └─ so_mana_filler_1 (cost 175)
                                                  └─ so_keystone_singularity (cost 800)
                                                       └─ so_keystone_singularity_asc1 (cost 280)
                                                            └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 3:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_mana_1 (cost 50)
               └─ so_mana_1b (cost 45)
                    └─ so_speed_1 (cost 50)
                         └─ so_speed_1b (cost 50)
                              └─ so_magnet_1 (cost 55)
                                   └─ so_magnet_1b (cost 55)
                                        └─ so_spark_detonation [notable] (cost 370)
                                             └─ so_mana_filler_1 (cost 175)
                                                  └─ so_keystone_singularity (cost 800)
                                                       └─ so_keystone_singularity_asc1 (cost 280)
                                                            └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 4:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_volt_minor_1 (cost 50)
               └─ so_volt_minor_1b (cost 45)
                    └─ so_volt_minor_2 (cost 55)
                         └─ so_speed_1 (cost 50)
                              └─ so_speed_1b (cost 50)
                                   └─ so_magnet_1 (cost 55)
                                        └─ so_magnet_1b (cost 55)
                                             └─ so_spark_detonation [notable] (cost 370)
                                                  └─ so_mana_filler_1 (cost 175)
                                                       └─ so_keystone_singularity (cost 800)
                                                            └─ so_keystone_singularity_asc1 (cost 280)
                                                                 └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 5:**
```
so_root (cost 0)
     └─ so_cryo_minor_1 (cost 50)
          └─ so_cryo_minor_1b (cost 45)
               └─ so_cryo_minor_2 (cost 55)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_orb_minor_1b (cost 45)
                              └─ so_orb_minor_1 (cost 50)
                                   └─ so_mana_1 (cost 50)
                                        └─ so_mana_1b (cost 45)
                                             └─ so_speed_1 (cost 50)
                                                  └─ so_speed_1b (cost 50)
                                                       └─ so_magnet_1 (cost 55)
                                                            └─ so_magnet_1b (cost 55)
                                                                 └─ so_spark_detonation [notable] (cost 370)
                                                                      └─ so_mana_filler_1 (cost 175)
                                                                           └─ so_keystone_singularity (cost 800)
                                                                                └─ so_keystone_singularity_asc1 (cost 280)
                                                                                     └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 6:**
```
so_root (cost 0)
     └─ so_volt_minor_1 (cost 50)
          └─ so_cryo_minor_1 (cost 50)
               └─ so_cryo_minor_1b (cost 45)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_orb_minor_2 (cost 60)
                              └─ so_orb_minor_1b (cost 45)
                                   └─ so_orb_minor_1 (cost 50)
                                        └─ so_mana_1 (cost 50)
                                             └─ so_mana_1b (cost 45)
                                                  └─ so_speed_1 (cost 50)
                                                       └─ so_speed_1b (cost 50)
                                                            └─ so_magnet_1 (cost 55)
                                                                 └─ so_magnet_1b (cost 55)
                                                                      └─ so_spark_detonation [notable] (cost 370)
                                                                           └─ so_mana_filler_1 (cost 175)
                                                                                └─ so_keystone_singularity (cost 800)
                                                                                     └─ so_keystone_singularity_asc1 (cost 280)
                                                                                          └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 7:**
```
so_root (cost 0)
     └─ so_orb_minor_1 (cost 50)
          └─ so_orb_minor_1b (cost 45)
               └─ so_orb_minor_2 (cost 60)
                    └─ so_cryo_minor_2 (cost 55)
                         └─ so_cryo_minor_1b (cost 45)
                              └─ so_cryo_minor_1 (cost 50)
                                   └─ so_volt_minor_1 (cost 50)
                                        └─ so_volt_minor_1b (cost 45)
                                             └─ so_volt_minor_2 (cost 55)
                                                  └─ so_speed_1 (cost 50)
                                                       └─ so_speed_1b (cost 50)
                                                            └─ so_magnet_1 (cost 55)
                                                                 └─ so_magnet_1b (cost 55)
                                                                      └─ so_spark_detonation [notable] (cost 370)
                                                                           └─ so_mana_filler_1 (cost 175)
                                                                                └─ so_keystone_singularity (cost 800)
                                                                                     └─ so_keystone_singularity_asc1 (cost 280)
                                                                                          └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 8:**
```
so_root (cost 0)
     └─ so_mana_1 (cost 50)
          └─ so_orb_minor_1 (cost 50)
               └─ so_orb_minor_1b (cost 45)
                    └─ so_orb_minor_2 (cost 60)
                         └─ so_cryo_minor_2 (cost 55)
                              └─ so_cryo_minor_1b (cost 45)
                                   └─ so_cryo_minor_1 (cost 50)
                                        └─ so_volt_minor_1 (cost 50)
                                             └─ so_volt_minor_1b (cost 45)
                                                  └─ so_volt_minor_2 (cost 55)
                                                       └─ so_speed_1 (cost 50)
                                                            └─ so_speed_1b (cost 50)
                                                                 └─ so_magnet_1 (cost 55)
                                                                      └─ so_magnet_1b (cost 55)
                                                                           └─ so_spark_detonation [notable] (cost 370)
                                                                                └─ so_mana_filler_1 (cost 175)
                                                                                     └─ so_keystone_singularity (cost 800)
                                                                                          └─ so_keystone_singularity_asc1 (cost 280)
                                                                                               └─ so_keystone_singularity_asc2 [KEYSTONE] (cost 1040)
```


<a id="archer"></a>
## Archer (rootId: ar_root, 45 nodes)

_title: The Shadow Stalker — 3 Ballistic Archetypes / เงาเพชฌฆาตมืด — 3 สายกระสุนแห่งความเชี่ยวชาญ_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| ar_root | ดวงตาเหยี่ยว / Eye of the Hawk | root | ar_pierce_1, ar_multishot_minor_1, ar_evasion_1, ar_swift_1 | 0 | maxHp:10 | — |
| ar_pierce_1 | ขนนกคมกริบ / Razor Feather | minor | ar_root, ar_pierce_edge, ar_multishot_minor_1 | 50 | damageBonus:0.5 | — |
| ar_pierce_edge | รอยบากลับคม / Whetted Nock | minor | ar_pierce_1, ar_pierce_2 | 45 | damageBonus:0.5 | — |
| ar_pierce_2 | สมาธินักแม่นปืน / Sniper Focus | minor | ar_pierce_edge, ar_pierce_patience, ar_evasion_2 | 55 | maxHp:5 | — |
| ar_pierce_patience | ความอดทนแห่งเหยี่ยว / Falcon's Patience | minor | ar_pierce_2, ar_deadeye_pierce | 55 | maxHp:5 | — |
| ar_deadeye_pierce | ธนูยาวแม่นปืน / Deadeye Longbow | notable | ar_pierce_patience, ar_pierce_filler_1 | 370 | — [element: wind_pierce] | ar_deadeye_pierce |
| ar_pierce_filler_1 | สมาธิล่องลม / Windrift Focus | minor | ar_deadeye_pierce, ar_ballistic_prec | 150 | damageBonus:0.5 | — |
| ar_ballistic_prec | ความแม่นยำวิถีกระสุน / Ballistic Precision | notable | ar_pierce_filler_1, ar_pierce_filler_2 | 390 | — [element: wind_pierce] | ar_ballistic_prec |
| ar_pierce_filler_2 | พลังกรงเล็บ / Talon's Vigor | minor | ar_ballistic_prec, ar_keystone_sniper | 180 | maxHp:8 | — |
| ar_keystone_sniper | จุดสูงสุดแห่งการทะลุทะลวงไม่สิ้นสุด / Infinite Pierce Apex | keystone | ar_pierce_filler_2, ar_keystone_sniper_asc1 | 820 | damageBonus:2 | — |
| ar_keystone_sniper_asc1 | จุดสูงสุดการทะลุทะลวงขั้นสูง / Greater Pierce Apex | minor | ar_keystone_sniper, ar_keystone_sniper_asc2 | 285 | damageBonus:0.5 | — |
| ar_keystone_sniper_asc2 | จุดสูงสุดการทะลุทะลวงเหนือขีดจำกัด / Transcendent Pierce Apex | keystone | ar_keystone_sniper_asc1 | 1070 | damageBonus:2 | — |
| ar_multishot_minor_1 | ขนนกวิ่งลม / Windrunner Plume | minor | ar_root, ar_pierce_1, ar_gale_feather | 50 | damageBonus:0.5 | — |
| ar_gale_feather | ขนนกสัมผัสวายุ / Gale-Touched Feather | minor | ar_multishot_minor_1, ar_multishot_minor_2 | 45 | damageBonus:0.5 | — |
| ar_multishot_minor_2 | แล่งธนูแห่งวายุ / Quiver of Gales | minor | ar_gale_feather, ar_storm_step, ar_speed_1 | 55 | moveSpeed:0.5 | — |
| ar_storm_step | การง้างสายธนูแห่งพายุ / Storm-Step Draw | minor | ar_multishot_minor_2, archer_multishot | 55 | moveSpeed:0.5 | — |
| archer_multishot | ยิงกระจายสายวายุ / Gale Multishot | notable | ar_storm_step, ar_multishot_filler_1 | 380 | — [element: wind_pierce] | archer_multishot |
| ar_multishot_filler_1 | จังหวะพายุ / Tempest Cadence | minor | archer_multishot, ar_rain_of_arrows | 150 | moveSpeed:0.5 | — |
| ar_rain_of_arrows | ห่าฝนลูกธนู / Rain of Arrows | notable | ar_multishot_filler_1, ar_multishot_filler_2 | 400 | — [element: wind_pierce] | ar_rain_of_arrows |
| ar_multishot_filler_2 | โมเมนตัมพายุฝน / Squall Momentum | minor | ar_rain_of_arrows, ar_keystone_barrage | 180 | damageBonus:0.5 | — |
| ar_keystone_barrage | กระหน่ำยิงพายุ / Tempest Barrage | keystone | ar_multishot_filler_2, ar_keystone_barrage_asc1 | 820 | damageBonus:2 | — |
| ar_keystone_barrage_asc1 | กระหน่ำยิงขั้นสูง / Greater Barrage | minor | ar_keystone_barrage, ar_keystone_barrage_asc2 | 285 | damageBonus:0.5 | — |
| ar_keystone_barrage_asc2 | กระหน่ำยิงเหนือขีดจำกัด / Transcendent Barrage | keystone | ar_keystone_barrage_asc1 | 1070 | damageBonus:2 | — |
| ar_evasion_1 | เสื้อคลุมกระซิบ / Whispering Cloak | minor | ar_root, ar_shadow_wrap, ar_swift_1 | 50 | defense:0.5 | — |
| ar_shadow_wrap | ผ้าพันเงามืด / Shadowed Wraps | minor | ar_evasion_1, ar_evasion_2 | 45 | defense:0.5 | — |
| ar_evasion_2 | การเลื่อนไหลภูตผี / Phantom Shift | minor | ar_pierce_2, ar_shadow_wrap, ar_phantom_veil | 60 | defense:0.5, maxHp:5 | — |
| ar_phantom_veil | ม่านภูตผี / Phantom Veil | minor | ar_evasion_2, archer_windrunner | 55 | defense:0.5, maxHp:5 | — |
| archer_windrunner | ภูตแห่งสายลม / Windrunner Phantom | notable | ar_phantom_veil, ar_windrunner_filler_1 | 350 | — [element: wind_pierce] | archer_windrunner |
| ar_windrunner_filler_1 | ปราการแห่งลมอ่อน / Zephyr's Ward | minor | archer_windrunner, ar_static_caltrops | 150 | defense:0.5 | — |
| ar_static_caltrops | เหล็กแหลมไฟฟ้าสถิต / Static Caltrops | notable | ar_windrunner_filler_1, ar_windrunner_filler_2 | 390 | — [element: wind_pierce] | ar_static_caltrops |
| ar_windrunner_filler_2 | พลังสำรองประจุไฟฟ้า / Charged Reserves | minor | ar_static_caltrops, ar_keystone_phantom | 180 | maxHp:8 | — |
| ar_keystone_phantom | จุดสูงสุดแห่งการก้าวภูตผี / Phantom Step Apex | keystone | ar_windrunner_filler_2, ar_keystone_phantom_asc1 | 820 | moveSpeed:1, maxHp:30, defense:1 | — |
| ar_keystone_phantom_asc1 | จุดสูงสุดการก้าวภูตผีขั้นสูง / Greater Step Apex | minor | ar_keystone_phantom, ar_keystone_phantom_asc2 | 285 | maxHp:9, defense:0.5, moveSpeed:0.5 | — |
| ar_keystone_phantom_asc2 | จุดสูงสุดการก้าวภูตผีเหนือขีดจำกัด / Transcendent Step Apex | keystone | ar_keystone_phantom_asc1 | 1070 | maxHp:30, defense:1, moveSpeed:1 | — |
| ar_swift_1 | ก้าวย่างนักไล่ล่า / Stalker Stride | minor | ar_root, ar_evasion_1, ar_stalker_heart | 50 | maxHp:8 | — |
| ar_stalker_heart | ลมหายใจที่สองของนักไล่ล่า / Stalker's Second Wind | minor | ar_swift_1, ar_speed_1 | 45 | maxHp:7 | — |
| ar_speed_1 | ความคล่องแคล่วแห่งลมอ่อน / Zephyr Agility | minor | ar_multishot_minor_2, ar_stalker_heart, ar_gale_momentum | 50 | moveSpeed:0.5 | — |
| ar_gale_momentum | โมเมนตัมวายุ / Gale Momentum | minor | ar_speed_1, ar_magnet_1 | 50 | moveSpeed:0.5 | — |
| ar_magnet_1 | แม่เหล็กวังวนวายุ / Gale Vortex Magnet | minor | ar_gale_momentum, ar_vortex_pull | 55 | pickupRadius:0.5 | — |
| ar_vortex_pull | กระแสน้ำวนใต้ / Vortex Undertow | minor | ar_magnet_1, archer_lightning | 55 | pickupRadius:0.5 | — |
| archer_lightning | ลูกธนูสายฟ้า / Lightning Arrow | notable | ar_vortex_pull, ar_lightning_filler_1 | 380 | — [element: wind_pierce] | archer_lightning |
| ar_lightning_filler_1 | สะสมไฟฟ้าสถิต / Static Buildup | minor | archer_lightning, ar_keystone_superconductor | 180 | maxHp:8 | — |
| ar_keystone_superconductor | คลื่นตัวนำยิ่งยวด / Superconductor Surge | keystone | ar_lightning_filler_1, ar_keystone_superconductor_asc1 | 820 | pickupRadius:1, maxHp:15, damageBonus:1 | — |
| ar_keystone_superconductor_asc1 | คลื่นตัวนำยิ่งยวดขั้นสูง / Greater Surge | minor | ar_keystone_superconductor, ar_keystone_superconductor_asc2 | 285 | maxHp:5, pickupRadius:0.5, damageBonus:0.5 | — |
| ar_keystone_superconductor_asc2 | คลื่นตัวนำยิ่งยวดเหนือขีดจำกัด / Transcendent Surge | keystone | ar_keystone_superconductor_asc1 | 1070 | maxHp:15, pickupRadius:1, damageBonus:1 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → ar_keystone_sniper (จุดสูงสุดแห่งการทะลุทะลวงไม่สิ้นสุด / Infinite Pierce Apex, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_pierce_patience (cost 55)
                         └─ ar_deadeye_pierce [notable] (cost 370)
                              └─ ar_pierce_filler_1 (cost 150)
                                   └─ ar_ballistic_prec [notable] (cost 390)
                                        └─ ar_pierce_filler_2 (cost 180)
                                             └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_patience (cost 55)
                              └─ ar_deadeye_pierce [notable] (cost 370)
                                   └─ ar_pierce_filler_1 (cost 150)
                                        └─ ar_ballistic_prec [notable] (cost 390)
                                             └─ ar_pierce_filler_2 (cost 180)
                                                  └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_patience (cost 55)
                              └─ ar_deadeye_pierce [notable] (cost 370)
                                   └─ ar_pierce_filler_1 (cost 150)
                                        └─ ar_ballistic_prec [notable] (cost 390)
                                             └─ ar_pierce_filler_2 (cost 180)
                                                  └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_pierce_2 (cost 55)
                              └─ ar_pierce_patience (cost 55)
                                   └─ ar_deadeye_pierce [notable] (cost 370)
                                        └─ ar_pierce_filler_1 (cost 150)
                                             └─ ar_ballistic_prec [notable] (cost 390)
                                                  └─ ar_pierce_filler_2 (cost 180)
                                                       └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_gale_feather (cost 45)
                              └─ ar_multishot_minor_1 (cost 50)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_pierce_edge (cost 45)
                                             └─ ar_pierce_2 (cost 55)
                                                  └─ ar_pierce_patience (cost 55)
                                                       └─ ar_deadeye_pierce [notable] (cost 370)
                                                            └─ ar_pierce_filler_1 (cost 150)
                                                                 └─ ar_ballistic_prec [notable] (cost 390)
                                                                      └─ ar_pierce_filler_2 (cost 180)
                                                                           └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_stalker_heart (cost 45)
                              └─ ar_swift_1 (cost 50)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_shadow_wrap (cost 45)
                                             └─ ar_evasion_2 (cost 60)
                                                  └─ ar_pierce_2 (cost 55)
                                                       └─ ar_pierce_patience (cost 55)
                                                            └─ ar_deadeye_pierce [notable] (cost 370)
                                                                 └─ ar_pierce_filler_1 (cost 150)
                                                                      └─ ar_ballistic_prec [notable] (cost 390)
                                                                           └─ ar_pierce_filler_2 (cost 180)
                                                                                └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_multishot_minor_2 (cost 55)
                              └─ ar_gale_feather (cost 45)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_pierce_1 (cost 50)
                                             └─ ar_pierce_edge (cost 45)
                                                  └─ ar_pierce_2 (cost 55)
                                                       └─ ar_pierce_patience (cost 55)
                                                            └─ ar_deadeye_pierce [notable] (cost 370)
                                                                 └─ ar_pierce_filler_1 (cost 150)
                                                                      └─ ar_ballistic_prec [notable] (cost 390)
                                                                           └─ ar_pierce_filler_2 (cost 180)
                                                                                └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_speed_1 (cost 50)
                              └─ ar_stalker_heart (cost 45)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_evasion_1 (cost 50)
                                             └─ ar_shadow_wrap (cost 45)
                                                  └─ ar_evasion_2 (cost 60)
                                                       └─ ar_pierce_2 (cost 55)
                                                            └─ ar_pierce_patience (cost 55)
                                                                 └─ ar_deadeye_pierce [notable] (cost 370)
                                                                      └─ ar_pierce_filler_1 (cost 150)
                                                                           └─ ar_ballistic_prec [notable] (cost 390)
                                                                                └─ ar_pierce_filler_2 (cost 180)
                                                                                     └─ ar_keystone_sniper [KEYSTONE] (cost 820)
```

#### → ar_keystone_sniper_asc2 (จุดสูงสุดการทะลุทะลวงเหนือขีดจำกัด / Transcendent Pierce Apex, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_pierce_patience (cost 55)
                         └─ ar_deadeye_pierce [notable] (cost 370)
                              └─ ar_pierce_filler_1 (cost 150)
                                   └─ ar_ballistic_prec [notable] (cost 390)
                                        └─ ar_pierce_filler_2 (cost 180)
                                             └─ ar_keystone_sniper (cost 820)
                                                  └─ ar_keystone_sniper_asc1 (cost 285)
                                                       └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_patience (cost 55)
                              └─ ar_deadeye_pierce [notable] (cost 370)
                                   └─ ar_pierce_filler_1 (cost 150)
                                        └─ ar_ballistic_prec [notable] (cost 390)
                                             └─ ar_pierce_filler_2 (cost 180)
                                                  └─ ar_keystone_sniper (cost 820)
                                                       └─ ar_keystone_sniper_asc1 (cost 285)
                                                            └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_patience (cost 55)
                              └─ ar_deadeye_pierce [notable] (cost 370)
                                   └─ ar_pierce_filler_1 (cost 150)
                                        └─ ar_ballistic_prec [notable] (cost 390)
                                             └─ ar_pierce_filler_2 (cost 180)
                                                  └─ ar_keystone_sniper (cost 820)
                                                       └─ ar_keystone_sniper_asc1 (cost 285)
                                                            └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_pierce_2 (cost 55)
                              └─ ar_pierce_patience (cost 55)
                                   └─ ar_deadeye_pierce [notable] (cost 370)
                                        └─ ar_pierce_filler_1 (cost 150)
                                             └─ ar_ballistic_prec [notable] (cost 390)
                                                  └─ ar_pierce_filler_2 (cost 180)
                                                       └─ ar_keystone_sniper (cost 820)
                                                            └─ ar_keystone_sniper_asc1 (cost 285)
                                                                 └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_gale_feather (cost 45)
                              └─ ar_multishot_minor_1 (cost 50)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_pierce_edge (cost 45)
                                             └─ ar_pierce_2 (cost 55)
                                                  └─ ar_pierce_patience (cost 55)
                                                       └─ ar_deadeye_pierce [notable] (cost 370)
                                                            └─ ar_pierce_filler_1 (cost 150)
                                                                 └─ ar_ballistic_prec [notable] (cost 390)
                                                                      └─ ar_pierce_filler_2 (cost 180)
                                                                           └─ ar_keystone_sniper (cost 820)
                                                                                └─ ar_keystone_sniper_asc1 (cost 285)
                                                                                     └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_stalker_heart (cost 45)
                              └─ ar_swift_1 (cost 50)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_shadow_wrap (cost 45)
                                             └─ ar_evasion_2 (cost 60)
                                                  └─ ar_pierce_2 (cost 55)
                                                       └─ ar_pierce_patience (cost 55)
                                                            └─ ar_deadeye_pierce [notable] (cost 370)
                                                                 └─ ar_pierce_filler_1 (cost 150)
                                                                      └─ ar_ballistic_prec [notable] (cost 390)
                                                                           └─ ar_pierce_filler_2 (cost 180)
                                                                                └─ ar_keystone_sniper (cost 820)
                                                                                     └─ ar_keystone_sniper_asc1 (cost 285)
                                                                                          └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_multishot_minor_2 (cost 55)
                              └─ ar_gale_feather (cost 45)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_pierce_1 (cost 50)
                                             └─ ar_pierce_edge (cost 45)
                                                  └─ ar_pierce_2 (cost 55)
                                                       └─ ar_pierce_patience (cost 55)
                                                            └─ ar_deadeye_pierce [notable] (cost 370)
                                                                 └─ ar_pierce_filler_1 (cost 150)
                                                                      └─ ar_ballistic_prec [notable] (cost 390)
                                                                           └─ ar_pierce_filler_2 (cost 180)
                                                                                └─ ar_keystone_sniper (cost 820)
                                                                                     └─ ar_keystone_sniper_asc1 (cost 285)
                                                                                          └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_speed_1 (cost 50)
                              └─ ar_stalker_heart (cost 45)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_evasion_1 (cost 50)
                                             └─ ar_shadow_wrap (cost 45)
                                                  └─ ar_evasion_2 (cost 60)
                                                       └─ ar_pierce_2 (cost 55)
                                                            └─ ar_pierce_patience (cost 55)
                                                                 └─ ar_deadeye_pierce [notable] (cost 370)
                                                                      └─ ar_pierce_filler_1 (cost 150)
                                                                           └─ ar_ballistic_prec [notable] (cost 390)
                                                                                └─ ar_pierce_filler_2 (cost 180)
                                                                                     └─ ar_keystone_sniper (cost 820)
                                                                                          └─ ar_keystone_sniper_asc1 (cost 285)
                                                                                               └─ ar_keystone_sniper_asc2 [KEYSTONE] (cost 1070)
```

#### → ar_keystone_barrage (กระหน่ำยิงพายุ / Tempest Barrage, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_storm_step (cost 55)
                         └─ archer_multishot [notable] (cost 380)
                              └─ ar_multishot_filler_1 (cost 150)
                                   └─ ar_rain_of_arrows [notable] (cost 400)
                                        └─ ar_multishot_filler_2 (cost 180)
                                             └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_storm_step (cost 55)
                              └─ archer_multishot [notable] (cost 380)
                                   └─ ar_multishot_filler_1 (cost 150)
                                        └─ ar_rain_of_arrows [notable] (cost 400)
                                             └─ ar_multishot_filler_2 (cost 180)
                                                  └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_storm_step (cost 55)
                              └─ archer_multishot [notable] (cost 380)
                                   └─ ar_multishot_filler_1 (cost 150)
                                        └─ ar_rain_of_arrows [notable] (cost 400)
                                             └─ ar_multishot_filler_2 (cost 180)
                                                  └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_multishot_minor_2 (cost 55)
                              └─ ar_storm_step (cost 55)
                                   └─ archer_multishot [notable] (cost 380)
                                        └─ ar_multishot_filler_1 (cost 150)
                                             └─ ar_rain_of_arrows [notable] (cost 400)
                                                  └─ ar_multishot_filler_2 (cost 180)
                                                       └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_edge (cost 45)
                              └─ ar_pierce_1 (cost 50)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_gale_feather (cost 45)
                                             └─ ar_multishot_minor_2 (cost 55)
                                                  └─ ar_storm_step (cost 55)
                                                       └─ archer_multishot [notable] (cost 380)
                                                            └─ ar_multishot_filler_1 (cost 150)
                                                                 └─ ar_rain_of_arrows [notable] (cost 400)
                                                                      └─ ar_multishot_filler_2 (cost 180)
                                                                           └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_shadow_wrap (cost 45)
                              └─ ar_evasion_1 (cost 50)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_stalker_heart (cost 45)
                                             └─ ar_speed_1 (cost 50)
                                                  └─ ar_multishot_minor_2 (cost 55)
                                                       └─ ar_storm_step (cost 55)
                                                            └─ archer_multishot [notable] (cost 380)
                                                                 └─ ar_multishot_filler_1 (cost 150)
                                                                      └─ ar_rain_of_arrows [notable] (cost 400)
                                                                           └─ ar_multishot_filler_2 (cost 180)
                                                                                └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_pierce_2 (cost 55)
                              └─ ar_pierce_edge (cost 45)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_multishot_minor_1 (cost 50)
                                             └─ ar_gale_feather (cost 45)
                                                  └─ ar_multishot_minor_2 (cost 55)
                                                       └─ ar_storm_step (cost 55)
                                                            └─ archer_multishot [notable] (cost 380)
                                                                 └─ ar_multishot_filler_1 (cost 150)
                                                                      └─ ar_rain_of_arrows [notable] (cost 400)
                                                                           └─ ar_multishot_filler_2 (cost 180)
                                                                                └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_evasion_2 (cost 60)
                              └─ ar_shadow_wrap (cost 45)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_swift_1 (cost 50)
                                             └─ ar_stalker_heart (cost 45)
                                                  └─ ar_speed_1 (cost 50)
                                                       └─ ar_multishot_minor_2 (cost 55)
                                                            └─ ar_storm_step (cost 55)
                                                                 └─ archer_multishot [notable] (cost 380)
                                                                      └─ ar_multishot_filler_1 (cost 150)
                                                                           └─ ar_rain_of_arrows [notable] (cost 400)
                                                                                └─ ar_multishot_filler_2 (cost 180)
                                                                                     └─ ar_keystone_barrage [KEYSTONE] (cost 820)
```

#### → ar_keystone_barrage_asc2 (กระหน่ำยิงเหนือขีดจำกัด / Transcendent Barrage, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_storm_step (cost 55)
                         └─ archer_multishot [notable] (cost 380)
                              └─ ar_multishot_filler_1 (cost 150)
                                   └─ ar_rain_of_arrows [notable] (cost 400)
                                        └─ ar_multishot_filler_2 (cost 180)
                                             └─ ar_keystone_barrage (cost 820)
                                                  └─ ar_keystone_barrage_asc1 (cost 285)
                                                       └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_storm_step (cost 55)
                              └─ archer_multishot [notable] (cost 380)
                                   └─ ar_multishot_filler_1 (cost 150)
                                        └─ ar_rain_of_arrows [notable] (cost 400)
                                             └─ ar_multishot_filler_2 (cost 180)
                                                  └─ ar_keystone_barrage (cost 820)
                                                       └─ ar_keystone_barrage_asc1 (cost 285)
                                                            └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_storm_step (cost 55)
                              └─ archer_multishot [notable] (cost 380)
                                   └─ ar_multishot_filler_1 (cost 150)
                                        └─ ar_rain_of_arrows [notable] (cost 400)
                                             └─ ar_multishot_filler_2 (cost 180)
                                                  └─ ar_keystone_barrage (cost 820)
                                                       └─ ar_keystone_barrage_asc1 (cost 285)
                                                            └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_multishot_minor_2 (cost 55)
                              └─ ar_storm_step (cost 55)
                                   └─ archer_multishot [notable] (cost 380)
                                        └─ ar_multishot_filler_1 (cost 150)
                                             └─ ar_rain_of_arrows [notable] (cost 400)
                                                  └─ ar_multishot_filler_2 (cost 180)
                                                       └─ ar_keystone_barrage (cost 820)
                                                            └─ ar_keystone_barrage_asc1 (cost 285)
                                                                 └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_edge (cost 45)
                              └─ ar_pierce_1 (cost 50)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_gale_feather (cost 45)
                                             └─ ar_multishot_minor_2 (cost 55)
                                                  └─ ar_storm_step (cost 55)
                                                       └─ archer_multishot [notable] (cost 380)
                                                            └─ ar_multishot_filler_1 (cost 150)
                                                                 └─ ar_rain_of_arrows [notable] (cost 400)
                                                                      └─ ar_multishot_filler_2 (cost 180)
                                                                           └─ ar_keystone_barrage (cost 820)
                                                                                └─ ar_keystone_barrage_asc1 (cost 285)
                                                                                     └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_shadow_wrap (cost 45)
                              └─ ar_evasion_1 (cost 50)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_stalker_heart (cost 45)
                                             └─ ar_speed_1 (cost 50)
                                                  └─ ar_multishot_minor_2 (cost 55)
                                                       └─ ar_storm_step (cost 55)
                                                            └─ archer_multishot [notable] (cost 380)
                                                                 └─ ar_multishot_filler_1 (cost 150)
                                                                      └─ ar_rain_of_arrows [notable] (cost 400)
                                                                           └─ ar_multishot_filler_2 (cost 180)
                                                                                └─ ar_keystone_barrage (cost 820)
                                                                                     └─ ar_keystone_barrage_asc1 (cost 285)
                                                                                          └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_pierce_2 (cost 55)
                              └─ ar_pierce_edge (cost 45)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_multishot_minor_1 (cost 50)
                                             └─ ar_gale_feather (cost 45)
                                                  └─ ar_multishot_minor_2 (cost 55)
                                                       └─ ar_storm_step (cost 55)
                                                            └─ archer_multishot [notable] (cost 380)
                                                                 └─ ar_multishot_filler_1 (cost 150)
                                                                      └─ ar_rain_of_arrows [notable] (cost 400)
                                                                           └─ ar_multishot_filler_2 (cost 180)
                                                                                └─ ar_keystone_barrage (cost 820)
                                                                                     └─ ar_keystone_barrage_asc1 (cost 285)
                                                                                          └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_evasion_2 (cost 60)
                              └─ ar_shadow_wrap (cost 45)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_swift_1 (cost 50)
                                             └─ ar_stalker_heart (cost 45)
                                                  └─ ar_speed_1 (cost 50)
                                                       └─ ar_multishot_minor_2 (cost 55)
                                                            └─ ar_storm_step (cost 55)
                                                                 └─ archer_multishot [notable] (cost 380)
                                                                      └─ ar_multishot_filler_1 (cost 150)
                                                                           └─ ar_rain_of_arrows [notable] (cost 400)
                                                                                └─ ar_multishot_filler_2 (cost 180)
                                                                                     └─ ar_keystone_barrage (cost 820)
                                                                                          └─ ar_keystone_barrage_asc1 (cost 285)
                                                                                               └─ ar_keystone_barrage_asc2 [KEYSTONE] (cost 1070)
```

#### → ar_keystone_phantom (จุดสูงสุดแห่งการก้าวภูตผี / Phantom Step Apex, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_phantom_veil (cost 55)
                         └─ archer_windrunner [notable] (cost 350)
                              └─ ar_windrunner_filler_1 (cost 150)
                                   └─ ar_static_caltrops [notable] (cost 390)
                                        └─ ar_windrunner_filler_2 (cost 180)
                                             └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_phantom_veil (cost 55)
                              └─ archer_windrunner [notable] (cost 350)
                                   └─ ar_windrunner_filler_1 (cost 150)
                                        └─ ar_static_caltrops [notable] (cost 390)
                                             └─ ar_windrunner_filler_2 (cost 180)
                                                  └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_phantom_veil (cost 55)
                              └─ archer_windrunner [notable] (cost 350)
                                   └─ ar_windrunner_filler_1 (cost 150)
                                        └─ ar_static_caltrops [notable] (cost 390)
                                             └─ ar_windrunner_filler_2 (cost 180)
                                                  └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_evasion_2 (cost 60)
                              └─ ar_phantom_veil (cost 55)
                                   └─ archer_windrunner [notable] (cost 350)
                                        └─ ar_windrunner_filler_1 (cost 150)
                                             └─ ar_static_caltrops [notable] (cost 390)
                                                  └─ ar_windrunner_filler_2 (cost 180)
                                                       └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_stalker_heart (cost 45)
                              └─ ar_swift_1 (cost 50)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_shadow_wrap (cost 45)
                                             └─ ar_evasion_2 (cost 60)
                                                  └─ ar_phantom_veil (cost 55)
                                                       └─ archer_windrunner [notable] (cost 350)
                                                            └─ ar_windrunner_filler_1 (cost 150)
                                                                 └─ ar_static_caltrops [notable] (cost 390)
                                                                      └─ ar_windrunner_filler_2 (cost 180)
                                                                           └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_speed_1 (cost 50)
                              └─ ar_stalker_heart (cost 45)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_evasion_1 (cost 50)
                                             └─ ar_shadow_wrap (cost 45)
                                                  └─ ar_evasion_2 (cost 60)
                                                       └─ ar_phantom_veil (cost 55)
                                                            └─ archer_windrunner [notable] (cost 350)
                                                                 └─ ar_windrunner_filler_1 (cost 150)
                                                                      └─ ar_static_caltrops [notable] (cost 390)
                                                                           └─ ar_windrunner_filler_2 (cost 180)
                                                                                └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_gale_feather (cost 45)
                              └─ ar_multishot_minor_1 (cost 50)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_pierce_edge (cost 45)
                                             └─ ar_pierce_2 (cost 55)
                                                  └─ ar_evasion_2 (cost 60)
                                                       └─ ar_phantom_veil (cost 55)
                                                            └─ archer_windrunner [notable] (cost 350)
                                                                 └─ ar_windrunner_filler_1 (cost 150)
                                                                      └─ ar_static_caltrops [notable] (cost 390)
                                                                           └─ ar_windrunner_filler_2 (cost 180)
                                                                                └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_multishot_minor_2 (cost 55)
                              └─ ar_gale_feather (cost 45)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_pierce_1 (cost 50)
                                             └─ ar_pierce_edge (cost 45)
                                                  └─ ar_pierce_2 (cost 55)
                                                       └─ ar_evasion_2 (cost 60)
                                                            └─ ar_phantom_veil (cost 55)
                                                                 └─ archer_windrunner [notable] (cost 350)
                                                                      └─ ar_windrunner_filler_1 (cost 150)
                                                                           └─ ar_static_caltrops [notable] (cost 390)
                                                                                └─ ar_windrunner_filler_2 (cost 180)
                                                                                     └─ ar_keystone_phantom [KEYSTONE] (cost 820)
```

#### → ar_keystone_phantom_asc2 (จุดสูงสุดการก้าวภูตผีเหนือขีดจำกัด / Transcendent Step Apex, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_phantom_veil (cost 55)
                         └─ archer_windrunner [notable] (cost 350)
                              └─ ar_windrunner_filler_1 (cost 150)
                                   └─ ar_static_caltrops [notable] (cost 390)
                                        └─ ar_windrunner_filler_2 (cost 180)
                                             └─ ar_keystone_phantom (cost 820)
                                                  └─ ar_keystone_phantom_asc1 (cost 285)
                                                       └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_phantom_veil (cost 55)
                              └─ archer_windrunner [notable] (cost 350)
                                   └─ ar_windrunner_filler_1 (cost 150)
                                        └─ ar_static_caltrops [notable] (cost 390)
                                             └─ ar_windrunner_filler_2 (cost 180)
                                                  └─ ar_keystone_phantom (cost 820)
                                                       └─ ar_keystone_phantom_asc1 (cost 285)
                                                            └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_phantom_veil (cost 55)
                              └─ archer_windrunner [notable] (cost 350)
                                   └─ ar_windrunner_filler_1 (cost 150)
                                        └─ ar_static_caltrops [notable] (cost 390)
                                             └─ ar_windrunner_filler_2 (cost 180)
                                                  └─ ar_keystone_phantom (cost 820)
                                                       └─ ar_keystone_phantom_asc1 (cost 285)
                                                            └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_evasion_2 (cost 60)
                              └─ ar_phantom_veil (cost 55)
                                   └─ archer_windrunner [notable] (cost 350)
                                        └─ ar_windrunner_filler_1 (cost 150)
                                             └─ ar_static_caltrops [notable] (cost 390)
                                                  └─ ar_windrunner_filler_2 (cost 180)
                                                       └─ ar_keystone_phantom (cost 820)
                                                            └─ ar_keystone_phantom_asc1 (cost 285)
                                                                 └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_stalker_heart (cost 45)
                              └─ ar_swift_1 (cost 50)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_shadow_wrap (cost 45)
                                             └─ ar_evasion_2 (cost 60)
                                                  └─ ar_phantom_veil (cost 55)
                                                       └─ archer_windrunner [notable] (cost 350)
                                                            └─ ar_windrunner_filler_1 (cost 150)
                                                                 └─ ar_static_caltrops [notable] (cost 390)
                                                                      └─ ar_windrunner_filler_2 (cost 180)
                                                                           └─ ar_keystone_phantom (cost 820)
                                                                                └─ ar_keystone_phantom_asc1 (cost 285)
                                                                                     └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_speed_1 (cost 50)
                              └─ ar_stalker_heart (cost 45)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_evasion_1 (cost 50)
                                             └─ ar_shadow_wrap (cost 45)
                                                  └─ ar_evasion_2 (cost 60)
                                                       └─ ar_phantom_veil (cost 55)
                                                            └─ archer_windrunner [notable] (cost 350)
                                                                 └─ ar_windrunner_filler_1 (cost 150)
                                                                      └─ ar_static_caltrops [notable] (cost 390)
                                                                           └─ ar_windrunner_filler_2 (cost 180)
                                                                                └─ ar_keystone_phantom (cost 820)
                                                                                     └─ ar_keystone_phantom_asc1 (cost 285)
                                                                                          └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_gale_feather (cost 45)
                              └─ ar_multishot_minor_1 (cost 50)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_pierce_edge (cost 45)
                                             └─ ar_pierce_2 (cost 55)
                                                  └─ ar_evasion_2 (cost 60)
                                                       └─ ar_phantom_veil (cost 55)
                                                            └─ archer_windrunner [notable] (cost 350)
                                                                 └─ ar_windrunner_filler_1 (cost 150)
                                                                      └─ ar_static_caltrops [notable] (cost 390)
                                                                           └─ ar_windrunner_filler_2 (cost 180)
                                                                                └─ ar_keystone_phantom (cost 820)
                                                                                     └─ ar_keystone_phantom_asc1 (cost 285)
                                                                                          └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_multishot_minor_2 (cost 55)
                              └─ ar_gale_feather (cost 45)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_pierce_1 (cost 50)
                                             └─ ar_pierce_edge (cost 45)
                                                  └─ ar_pierce_2 (cost 55)
                                                       └─ ar_evasion_2 (cost 60)
                                                            └─ ar_phantom_veil (cost 55)
                                                                 └─ archer_windrunner [notable] (cost 350)
                                                                      └─ ar_windrunner_filler_1 (cost 150)
                                                                           └─ ar_static_caltrops [notable] (cost 390)
                                                                                └─ ar_windrunner_filler_2 (cost 180)
                                                                                     └─ ar_keystone_phantom (cost 820)
                                                                                          └─ ar_keystone_phantom_asc1 (cost 285)
                                                                                               └─ ar_keystone_phantom_asc2 [KEYSTONE] (cost 1070)
```

#### → ar_keystone_superconductor (คลื่นตัวนำยิ่งยวด / Superconductor Surge, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_gale_momentum (cost 50)
                         └─ ar_magnet_1 (cost 55)
                              └─ ar_vortex_pull (cost 55)
                                   └─ archer_lightning [notable] (cost 380)
                                        └─ ar_lightning_filler_1 (cost 180)
                                             └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_gale_momentum (cost 50)
                              └─ ar_magnet_1 (cost 55)
                                   └─ ar_vortex_pull (cost 55)
                                        └─ archer_lightning [notable] (cost 380)
                                             └─ ar_lightning_filler_1 (cost 180)
                                                  └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_gale_momentum (cost 50)
                              └─ ar_magnet_1 (cost 55)
                                   └─ ar_vortex_pull (cost 55)
                                        └─ archer_lightning [notable] (cost 380)
                                             └─ ar_lightning_filler_1 (cost 180)
                                                  └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_speed_1 (cost 50)
                              └─ ar_gale_momentum (cost 50)
                                   └─ ar_magnet_1 (cost 55)
                                        └─ ar_vortex_pull (cost 55)
                                             └─ archer_lightning [notable] (cost 380)
                                                  └─ ar_lightning_filler_1 (cost 180)
                                                       └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_shadow_wrap (cost 45)
                              └─ ar_evasion_1 (cost 50)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_stalker_heart (cost 45)
                                             └─ ar_speed_1 (cost 50)
                                                  └─ ar_gale_momentum (cost 50)
                                                       └─ ar_magnet_1 (cost 55)
                                                            └─ ar_vortex_pull (cost 55)
                                                                 └─ archer_lightning [notable] (cost 380)
                                                                      └─ ar_lightning_filler_1 (cost 180)
                                                                           └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_evasion_2 (cost 60)
                              └─ ar_shadow_wrap (cost 45)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_swift_1 (cost 50)
                                             └─ ar_stalker_heart (cost 45)
                                                  └─ ar_speed_1 (cost 50)
                                                       └─ ar_gale_momentum (cost 50)
                                                            └─ ar_magnet_1 (cost 55)
                                                                 └─ ar_vortex_pull (cost 55)
                                                                      └─ archer_lightning [notable] (cost 380)
                                                                           └─ ar_lightning_filler_1 (cost 180)
                                                                                └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_edge (cost 45)
                              └─ ar_pierce_1 (cost 50)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_gale_feather (cost 45)
                                             └─ ar_multishot_minor_2 (cost 55)
                                                  └─ ar_speed_1 (cost 50)
                                                       └─ ar_gale_momentum (cost 50)
                                                            └─ ar_magnet_1 (cost 55)
                                                                 └─ ar_vortex_pull (cost 55)
                                                                      └─ archer_lightning [notable] (cost 380)
                                                                           └─ ar_lightning_filler_1 (cost 180)
                                                                                └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_pierce_2 (cost 55)
                              └─ ar_pierce_edge (cost 45)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_multishot_minor_1 (cost 50)
                                             └─ ar_gale_feather (cost 45)
                                                  └─ ar_multishot_minor_2 (cost 55)
                                                       └─ ar_speed_1 (cost 50)
                                                            └─ ar_gale_momentum (cost 50)
                                                                 └─ ar_magnet_1 (cost 55)
                                                                      └─ ar_vortex_pull (cost 55)
                                                                           └─ archer_lightning [notable] (cost 380)
                                                                                └─ ar_lightning_filler_1 (cost 180)
                                                                                     └─ ar_keystone_superconductor [KEYSTONE] (cost 820)
```

#### → ar_keystone_superconductor_asc2 (คลื่นตัวนำยิ่งยวดเหนือขีดจำกัด / Transcendent Surge, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_stalker_heart (cost 45)
               └─ ar_speed_1 (cost 50)
                    └─ ar_gale_momentum (cost 50)
                         └─ ar_magnet_1 (cost 55)
                              └─ ar_vortex_pull (cost 55)
                                   └─ archer_lightning [notable] (cost 380)
                                        └─ ar_lightning_filler_1 (cost 180)
                                             └─ ar_keystone_superconductor (cost 820)
                                                  └─ ar_keystone_superconductor_asc1 (cost 285)
                                                       └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_gale_feather (cost 45)
               └─ ar_multishot_minor_2 (cost 55)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_gale_momentum (cost 50)
                              └─ ar_magnet_1 (cost 55)
                                   └─ ar_vortex_pull (cost 55)
                                        └─ archer_lightning [notable] (cost 380)
                                             └─ ar_lightning_filler_1 (cost 180)
                                                  └─ ar_keystone_superconductor (cost 820)
                                                       └─ ar_keystone_superconductor_asc1 (cost 285)
                                                            └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_swift_1 (cost 50)
               └─ ar_stalker_heart (cost 45)
                    └─ ar_speed_1 (cost 50)
                         └─ ar_gale_momentum (cost 50)
                              └─ ar_magnet_1 (cost 55)
                                   └─ ar_vortex_pull (cost 55)
                                        └─ archer_lightning [notable] (cost 380)
                                             └─ ar_lightning_filler_1 (cost 180)
                                                  └─ ar_keystone_superconductor (cost 820)
                                                       └─ ar_keystone_superconductor_asc1 (cost 285)
                                                            └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_multishot_minor_1 (cost 50)
               └─ ar_gale_feather (cost 45)
                    └─ ar_multishot_minor_2 (cost 55)
                         └─ ar_speed_1 (cost 50)
                              └─ ar_gale_momentum (cost 50)
                                   └─ ar_magnet_1 (cost 55)
                                        └─ ar_vortex_pull (cost 55)
                                             └─ archer_lightning [notable] (cost 380)
                                                  └─ ar_lightning_filler_1 (cost 180)
                                                       └─ ar_keystone_superconductor (cost 820)
                                                            └─ ar_keystone_superconductor_asc1 (cost 285)
                                                                 └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
ar_root (cost 0)
     └─ ar_pierce_1 (cost 50)
          └─ ar_pierce_edge (cost 45)
               └─ ar_pierce_2 (cost 55)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_shadow_wrap (cost 45)
                              └─ ar_evasion_1 (cost 50)
                                   └─ ar_swift_1 (cost 50)
                                        └─ ar_stalker_heart (cost 45)
                                             └─ ar_speed_1 (cost 50)
                                                  └─ ar_gale_momentum (cost 50)
                                                       └─ ar_magnet_1 (cost 55)
                                                            └─ ar_vortex_pull (cost 55)
                                                                 └─ archer_lightning [notable] (cost 380)
                                                                      └─ ar_lightning_filler_1 (cost 180)
                                                                           └─ ar_keystone_superconductor (cost 820)
                                                                                └─ ar_keystone_superconductor_asc1 (cost 285)
                                                                                     └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
ar_root (cost 0)
     └─ ar_multishot_minor_1 (cost 50)
          └─ ar_pierce_1 (cost 50)
               └─ ar_pierce_edge (cost 45)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_evasion_2 (cost 60)
                              └─ ar_shadow_wrap (cost 45)
                                   └─ ar_evasion_1 (cost 50)
                                        └─ ar_swift_1 (cost 50)
                                             └─ ar_stalker_heart (cost 45)
                                                  └─ ar_speed_1 (cost 50)
                                                       └─ ar_gale_momentum (cost 50)
                                                            └─ ar_magnet_1 (cost 55)
                                                                 └─ ar_vortex_pull (cost 55)
                                                                      └─ archer_lightning [notable] (cost 380)
                                                                           └─ ar_lightning_filler_1 (cost 180)
                                                                                └─ ar_keystone_superconductor (cost 820)
                                                                                     └─ ar_keystone_superconductor_asc1 (cost 285)
                                                                                          └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
ar_root (cost 0)
     └─ ar_evasion_1 (cost 50)
          └─ ar_shadow_wrap (cost 45)
               └─ ar_evasion_2 (cost 60)
                    └─ ar_pierce_2 (cost 55)
                         └─ ar_pierce_edge (cost 45)
                              └─ ar_pierce_1 (cost 50)
                                   └─ ar_multishot_minor_1 (cost 50)
                                        └─ ar_gale_feather (cost 45)
                                             └─ ar_multishot_minor_2 (cost 55)
                                                  └─ ar_speed_1 (cost 50)
                                                       └─ ar_gale_momentum (cost 50)
                                                            └─ ar_magnet_1 (cost 55)
                                                                 └─ ar_vortex_pull (cost 55)
                                                                      └─ archer_lightning [notable] (cost 380)
                                                                           └─ ar_lightning_filler_1 (cost 180)
                                                                                └─ ar_keystone_superconductor (cost 820)
                                                                                     └─ ar_keystone_superconductor_asc1 (cost 285)
                                                                                          └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
ar_root (cost 0)
     └─ ar_swift_1 (cost 50)
          └─ ar_evasion_1 (cost 50)
               └─ ar_shadow_wrap (cost 45)
                    └─ ar_evasion_2 (cost 60)
                         └─ ar_pierce_2 (cost 55)
                              └─ ar_pierce_edge (cost 45)
                                   └─ ar_pierce_1 (cost 50)
                                        └─ ar_multishot_minor_1 (cost 50)
                                             └─ ar_gale_feather (cost 45)
                                                  └─ ar_multishot_minor_2 (cost 55)
                                                       └─ ar_speed_1 (cost 50)
                                                            └─ ar_gale_momentum (cost 50)
                                                                 └─ ar_magnet_1 (cost 55)
                                                                      └─ ar_vortex_pull (cost 55)
                                                                           └─ archer_lightning [notable] (cost 380)
                                                                                └─ ar_lightning_filler_1 (cost 180)
                                                                                     └─ ar_keystone_superconductor (cost 820)
                                                                                          └─ ar_keystone_superconductor_asc1 (cost 285)
                                                                                               └─ ar_keystone_superconductor_asc2 [KEYSTONE] (cost 1070)
```


<a id="cleric"></a>
## Cleric (rootId: cl_root, 45 nodes)

_title: The Radiant Arbiter — 3 Divine Archetypes / ตุลาการแสงตะวัน — 3 สายศักดิ์สิทธิ์แห่งความเชี่ยวชาญ_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| cl_root | แท่นบูชาแห่งรุ่งอรุณ / Altar of the Dawn | root | cl_holy_1, cl_radiance_1, cl_armor_1, cl_faith_1 | 0 | maxHp:10 | — |
| cl_holy_1 | แสงศักดิ์สิทธิ์ที่ได้รับการชำระ / Consecrated Light | minor | cl_root, cl_holy_1a, cl_radiance_1 | 50 | damageBonus:0.5 | — |
| cl_holy_1a | ประกายไฟรัศมี / Radiant Ember | minor | cl_holy_1, cl_holy_2 | 45 | damageBonus:0.5 | — |
| cl_holy_2 | ออร่าแห่งพระคุณ / Aura of Grace | minor | cl_holy_1a, cl_holy_2a, cl_armor_2 | 55 | maxHp:5 | — |
| cl_holy_2a | พระคุณไร้ขอบเขต / Grace Unbound | minor | cl_holy_2, cleric_heal_aura | 55 | maxHp:5 | — |
| cleric_heal_aura | ออร่ารัศมีศักดิ์สิทธิ์ / Holy Radiance Aura | notable | cl_holy_2a, cl_holy_filler_1 | 380 | — [element: holy_light] | cleric_heal_aura |
| cl_holy_filler_1 | สัญญาณไฟแห่งความเมตตา / Beacon of Mercy | minor | cleric_heal_aura, cl_sanctified_swiftness | 160 | maxHp:8 | — |
| cl_sanctified_swiftness | ความรวดเร็วที่ได้รับการชำระ / Sanctified Swiftness | notable | cl_holy_filler_1, cl_holy_filler_2 | 390 | — [element: holy_light] | cl_sanctified_swiftness |
| cl_holy_filler_2 | โมเมนตัมผู้ได้รับพร / Hallowed Momentum | minor | cl_sanctified_swiftness, cl_keystone_benediction | 170 | moveSpeed:0.5 | — |
| cl_keystone_benediction | พรแห่งเทพเจ้า / Divine Benediction | keystone | cl_holy_filler_2, cl_keystone_benediction_asc1 | 820 | maxHp:30, damageBonus:2 | — |
| cl_keystone_benediction_asc1 | พรแห่งเทพเจ้าขั้นสูง / Greater Benediction | minor | cl_keystone_benediction, cl_keystone_benediction_asc2 | 285 | maxHp:9, damageBonus:0.5 | — |
| cl_keystone_benediction_asc2 | พรแห่งเทพเจ้าเหนือขีดจำกัด / Transcendent Benediction | keystone | cl_keystone_benediction_asc1 | 1070 | maxHp:30, damageBonus:2 | — |
| cl_radiance_1 | ตราสุริยเพลิง / Sunfire Brand | minor | cl_root, cl_holy_1, cl_radiance_1a | 50 | damageBonus:0.5 | — |
| cl_radiance_1a | สายธารประกายไฟ / Ember Cascade | minor | cl_radiance_1, cl_radiance_2 | 45 | damageBonus:0.5 | — |
| cl_radiance_2 | พิโรธสุริยะ / Solar Wrath | minor | cl_radiance_1a, cl_radiance_2a, cl_speed_1 | 55 | moveSpeed:0.5 | — |
| cl_radiance_2a | ก้าวเปลวสุริยะ / Solar Flare Step | minor | cl_radiance_2, cleric_judgment | 55 | moveSpeed:0.5 | — |
| cleric_judgment | การพิพากษาแห่งเทพเจ้า / Divine Judgment | notable | cl_radiance_2a, cl_radiance_filler_1 | 400 | — [element: holy_light] | cleric_judgment |
| cl_radiance_filler_1 | การดิ่งลงแผดเผา / Searing Descent | minor | cleric_judgment, cl_wrath_heavens | 165 | damageBonus:0.5 | — |
| cl_wrath_heavens | พิโรธแห่งสรวงสวรรค์ / Wrath of the Heavens | notable | cl_radiance_filler_1, cl_radiance_filler_2 | 400 | — [element: holy_light] | cl_wrath_heavens |
| cl_radiance_filler_2 | ความคลั่งไคล้โอเวอร์ชาร์จ / Zealous Overcharge | minor | cl_wrath_heavens, cl_keystone_archangel | 175 | moveSpeed:0.5 | — |
| cl_keystone_archangel | มหันตภัยแห่งอัครทูตสวรรค์ / Cataclysm of the Archangel | keystone | cl_radiance_filler_2, cl_keystone_archangel_asc1 | 840 | damageBonus:2 | — |
| cl_keystone_archangel_asc1 | อัครทูตสวรรค์ขั้นสูง / Greater Archangel | minor | cl_keystone_archangel, cl_keystone_archangel_asc2 | 295 | damageBonus:0.5 | — |
| cl_keystone_archangel_asc2 | อัครทูตสวรรค์เหนือขีดจำกัด / Transcendent Archangel | keystone | cl_keystone_archangel_asc1 | 1090 | damageBonus:2 | — |
| cl_armor_1 | เกราะได้รับพร / Blessed Mail | minor | cl_root, cl_armor_1a, cl_faith_1 | 50 | defense:0.5 | — |
| cl_armor_1a | แผ่นเกราะชำระบาป / Sanctified Plate | minor | cl_armor_1, cl_armor_2 | 45 | defense:0.5 | — |
| cl_armor_2 | โล่แห่งศรัทธา / Shield of Faith | minor | cl_holy_2, cl_armor_1a, cl_armor_2a | 60 | defense:0.5, maxHp:5 | — |
| cl_armor_2a | ปราการแห่งการอุทิศตน / Bulwark of Devotion | minor | cl_armor_2, cleric_aegis | 55 | defense:0.5, maxHp:5 | — |
| cleric_aegis | โล่ได้รับพร / Blessed Aegis | notable | cl_armor_2a, cl_armor_filler_1 | 360 | — [element: holy_light] | cleric_aegis |
| cl_armor_filler_1 | เกราะแห่งความมั่นคง / Ward of Steadfastness | minor | cleric_aegis, cl_consecrated_ground | 160 | defense:0.5 | — |
| cl_consecrated_ground | พื้นดินได้รับการชำระ / Consecrated Ground | notable | cl_armor_filler_1, cl_armor_filler_2 | 380 | — [element: holy_light] | cl_consecrated_ground |
| cl_armor_filler_2 | รากฐานผู้ได้รับพร / Hallowed Foundation | minor | cl_consecrated_ground, cl_keystone_sanctuary | 175 | maxHp:8 | — |
| cl_keystone_sanctuary | สถานศักดิ์สิทธิ์ไร้เทียมทาน / Impervious Sanctuary | keystone | cl_armor_filler_2, cl_keystone_sanctuary_asc1 | 820 | defense:2, maxHp:30 | — |
| cl_keystone_sanctuary_asc1 | สถานศักดิ์สิทธิ์ขั้นสูง / Greater Sanctuary | minor | cl_keystone_sanctuary, cl_keystone_sanctuary_asc2 | 285 | maxHp:9, defense:0.5 | — |
| cl_keystone_sanctuary_asc2 | สถานศักดิ์สิทธิ์เหนือขีดจำกัด / Transcendent Sanctuary | keystone | cl_keystone_sanctuary_asc1 | 1070 | maxHp:30, defense:2 | — |
| cl_faith_1 | ภาชนะแห่งพระคุณ / Vessel of Grace | minor | cl_root, cl_armor_1, cl_faith_1a | 50 | maxHp:8 | — |
| cl_faith_1a | พลังชีวิตได้รับพร / Blessed Vitality | minor | cl_faith_1, cl_speed_1 | 45 | maxHp:7 | — |
| cl_speed_1 | ความกระตือรือร้นของผู้แสวงบุญ / Pilgrim Zeal | minor | cl_radiance_2, cl_faith_1a, cl_speed_1a | 50 | moveSpeed:0.5 | — |
| cl_speed_1a | พระคุณของผู้พเนจร / Wanderer's Grace | minor | cl_speed_1, cl_magnet_1 | 50 | moveSpeed:0.5 | — |
| cl_magnet_1 | แม่เหล็กรวบรวมพระคุณ / Grace Collector Magnet | minor | cl_speed_1a, cl_magnet_1a | 55 | pickupRadius:0.5 | — |
| cl_magnet_1a | แรงดึงจากคลังศักดิ์สิทธิ์ / Reliquary Draw | minor | cl_magnet_1, cl_heavenly_retrib | 55 | pickupRadius:0.5 | — |
| cl_heavenly_retrib | การลงทัณฑ์จากสวรรค์ / Heavenly Retribution | notable | cl_magnet_1a, cl_faith_filler_1 | 370 | — [element: holy_light] | cl_heavenly_retrib |
| cl_faith_filler_1 | ส่วนสิบแห่งการอุทิศตน / Tithe of Devotion | minor | cl_heavenly_retrib, cl_keystone_providence | 170 | maxHp:8 | — |
| cl_keystone_providence | พรหมลิขิตแห่งเทพเจ้า / Divine Providence | keystone | cl_faith_filler_1, cl_keystone_providence_asc1 | 800 | pickupRadius:1, maxHp:15, damageBonus:1 | — |
| cl_keystone_providence_asc1 | พรหมลิขิตขั้นสูง / Greater Providence | minor | cl_keystone_providence, cl_keystone_providence_asc2 | 280 | maxHp:5, pickupRadius:0.5, damageBonus:0.5 | — |
| cl_keystone_providence_asc2 | พรหมลิขิตเหนือขีดจำกัด / Transcendent Providence | keystone | cl_keystone_providence_asc1 | 1040 | maxHp:15, pickupRadius:1, damageBonus:1 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → cl_keystone_benediction (พรแห่งเทพเจ้า / Divine Benediction, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_holy_2a (cost 55)
                         └─ cleric_heal_aura [notable] (cost 380)
                              └─ cl_holy_filler_1 (cost 160)
                                   └─ cl_sanctified_swiftness [notable] (cost 390)
                                        └─ cl_holy_filler_2 (cost 170)
                                             └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_2a (cost 55)
                              └─ cleric_heal_aura [notable] (cost 380)
                                   └─ cl_holy_filler_1 (cost 160)
                                        └─ cl_sanctified_swiftness [notable] (cost 390)
                                             └─ cl_holy_filler_2 (cost 170)
                                                  └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_2a (cost 55)
                              └─ cleric_heal_aura [notable] (cost 380)
                                   └─ cl_holy_filler_1 (cost 160)
                                        └─ cl_sanctified_swiftness [notable] (cost 390)
                                             └─ cl_holy_filler_2 (cost 170)
                                                  └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_holy_2 (cost 55)
                              └─ cl_holy_2a (cost 55)
                                   └─ cleric_heal_aura [notable] (cost 380)
                                        └─ cl_holy_filler_1 (cost 160)
                                             └─ cl_sanctified_swiftness [notable] (cost 390)
                                                  └─ cl_holy_filler_2 (cost 170)
                                                       └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_1a (cost 45)
                              └─ cl_radiance_1 (cost 50)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_holy_1a (cost 45)
                                             └─ cl_holy_2 (cost 55)
                                                  └─ cl_holy_2a (cost 55)
                                                       └─ cleric_heal_aura [notable] (cost 380)
                                                            └─ cl_holy_filler_1 (cost 160)
                                                                 └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                      └─ cl_holy_filler_2 (cost 170)
                                                                           └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_faith_1a (cost 45)
                              └─ cl_faith_1 (cost 50)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_armor_1a (cost 45)
                                             └─ cl_armor_2 (cost 60)
                                                  └─ cl_holy_2 (cost 55)
                                                       └─ cl_holy_2a (cost 55)
                                                            └─ cleric_heal_aura [notable] (cost 380)
                                                                 └─ cl_holy_filler_1 (cost 160)
                                                                      └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                           └─ cl_holy_filler_2 (cost 170)
                                                                                └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_radiance_2 (cost 55)
                              └─ cl_radiance_1a (cost 45)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_holy_1 (cost 50)
                                             └─ cl_holy_1a (cost 45)
                                                  └─ cl_holy_2 (cost 55)
                                                       └─ cl_holy_2a (cost 55)
                                                            └─ cleric_heal_aura [notable] (cost 380)
                                                                 └─ cl_holy_filler_1 (cost 160)
                                                                      └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                           └─ cl_holy_filler_2 (cost 170)
                                                                                └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_speed_1 (cost 50)
                              └─ cl_faith_1a (cost 45)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_armor_1 (cost 50)
                                             └─ cl_armor_1a (cost 45)
                                                  └─ cl_armor_2 (cost 60)
                                                       └─ cl_holy_2 (cost 55)
                                                            └─ cl_holy_2a (cost 55)
                                                                 └─ cleric_heal_aura [notable] (cost 380)
                                                                      └─ cl_holy_filler_1 (cost 160)
                                                                           └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                                └─ cl_holy_filler_2 (cost 170)
                                                                                     └─ cl_keystone_benediction [KEYSTONE] (cost 820)
```

#### → cl_keystone_benediction_asc2 (พรแห่งเทพเจ้าเหนือขีดจำกัด / Transcendent Benediction, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_holy_2a (cost 55)
                         └─ cleric_heal_aura [notable] (cost 380)
                              └─ cl_holy_filler_1 (cost 160)
                                   └─ cl_sanctified_swiftness [notable] (cost 390)
                                        └─ cl_holy_filler_2 (cost 170)
                                             └─ cl_keystone_benediction (cost 820)
                                                  └─ cl_keystone_benediction_asc1 (cost 285)
                                                       └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_2a (cost 55)
                              └─ cleric_heal_aura [notable] (cost 380)
                                   └─ cl_holy_filler_1 (cost 160)
                                        └─ cl_sanctified_swiftness [notable] (cost 390)
                                             └─ cl_holy_filler_2 (cost 170)
                                                  └─ cl_keystone_benediction (cost 820)
                                                       └─ cl_keystone_benediction_asc1 (cost 285)
                                                            └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_2a (cost 55)
                              └─ cleric_heal_aura [notable] (cost 380)
                                   └─ cl_holy_filler_1 (cost 160)
                                        └─ cl_sanctified_swiftness [notable] (cost 390)
                                             └─ cl_holy_filler_2 (cost 170)
                                                  └─ cl_keystone_benediction (cost 820)
                                                       └─ cl_keystone_benediction_asc1 (cost 285)
                                                            └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_holy_2 (cost 55)
                              └─ cl_holy_2a (cost 55)
                                   └─ cleric_heal_aura [notable] (cost 380)
                                        └─ cl_holy_filler_1 (cost 160)
                                             └─ cl_sanctified_swiftness [notable] (cost 390)
                                                  └─ cl_holy_filler_2 (cost 170)
                                                       └─ cl_keystone_benediction (cost 820)
                                                            └─ cl_keystone_benediction_asc1 (cost 285)
                                                                 └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_1a (cost 45)
                              └─ cl_radiance_1 (cost 50)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_holy_1a (cost 45)
                                             └─ cl_holy_2 (cost 55)
                                                  └─ cl_holy_2a (cost 55)
                                                       └─ cleric_heal_aura [notable] (cost 380)
                                                            └─ cl_holy_filler_1 (cost 160)
                                                                 └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                      └─ cl_holy_filler_2 (cost 170)
                                                                           └─ cl_keystone_benediction (cost 820)
                                                                                └─ cl_keystone_benediction_asc1 (cost 285)
                                                                                     └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_faith_1a (cost 45)
                              └─ cl_faith_1 (cost 50)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_armor_1a (cost 45)
                                             └─ cl_armor_2 (cost 60)
                                                  └─ cl_holy_2 (cost 55)
                                                       └─ cl_holy_2a (cost 55)
                                                            └─ cleric_heal_aura [notable] (cost 380)
                                                                 └─ cl_holy_filler_1 (cost 160)
                                                                      └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                           └─ cl_holy_filler_2 (cost 170)
                                                                                └─ cl_keystone_benediction (cost 820)
                                                                                     └─ cl_keystone_benediction_asc1 (cost 285)
                                                                                          └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_radiance_2 (cost 55)
                              └─ cl_radiance_1a (cost 45)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_holy_1 (cost 50)
                                             └─ cl_holy_1a (cost 45)
                                                  └─ cl_holy_2 (cost 55)
                                                       └─ cl_holy_2a (cost 55)
                                                            └─ cleric_heal_aura [notable] (cost 380)
                                                                 └─ cl_holy_filler_1 (cost 160)
                                                                      └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                           └─ cl_holy_filler_2 (cost 170)
                                                                                └─ cl_keystone_benediction (cost 820)
                                                                                     └─ cl_keystone_benediction_asc1 (cost 285)
                                                                                          └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_speed_1 (cost 50)
                              └─ cl_faith_1a (cost 45)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_armor_1 (cost 50)
                                             └─ cl_armor_1a (cost 45)
                                                  └─ cl_armor_2 (cost 60)
                                                       └─ cl_holy_2 (cost 55)
                                                            └─ cl_holy_2a (cost 55)
                                                                 └─ cleric_heal_aura [notable] (cost 380)
                                                                      └─ cl_holy_filler_1 (cost 160)
                                                                           └─ cl_sanctified_swiftness [notable] (cost 390)
                                                                                └─ cl_holy_filler_2 (cost 170)
                                                                                     └─ cl_keystone_benediction (cost 820)
                                                                                          └─ cl_keystone_benediction_asc1 (cost 285)
                                                                                               └─ cl_keystone_benediction_asc2 [KEYSTONE] (cost 1070)
```

#### → cl_keystone_archangel (มหันตภัยแห่งอัครทูตสวรรค์ / Cataclysm of the Archangel, cost 840)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_radiance_2a (cost 55)
                         └─ cleric_judgment [notable] (cost 400)
                              └─ cl_radiance_filler_1 (cost 165)
                                   └─ cl_wrath_heavens [notable] (cost 400)
                                        └─ cl_radiance_filler_2 (cost 175)
                                             └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_2a (cost 55)
                              └─ cleric_judgment [notable] (cost 400)
                                   └─ cl_radiance_filler_1 (cost 165)
                                        └─ cl_wrath_heavens [notable] (cost 400)
                                             └─ cl_radiance_filler_2 (cost 175)
                                                  └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_2a (cost 55)
                              └─ cleric_judgment [notable] (cost 400)
                                   └─ cl_radiance_filler_1 (cost 165)
                                        └─ cl_wrath_heavens [notable] (cost 400)
                                             └─ cl_radiance_filler_2 (cost 175)
                                                  └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_radiance_2 (cost 55)
                              └─ cl_radiance_2a (cost 55)
                                   └─ cleric_judgment [notable] (cost 400)
                                        └─ cl_radiance_filler_1 (cost 165)
                                             └─ cl_wrath_heavens [notable] (cost 400)
                                                  └─ cl_radiance_filler_2 (cost 175)
                                                       └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_1a (cost 45)
                              └─ cl_holy_1 (cost 50)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_radiance_1a (cost 45)
                                             └─ cl_radiance_2 (cost 55)
                                                  └─ cl_radiance_2a (cost 55)
                                                       └─ cleric_judgment [notable] (cost 400)
                                                            └─ cl_radiance_filler_1 (cost 165)
                                                                 └─ cl_wrath_heavens [notable] (cost 400)
                                                                      └─ cl_radiance_filler_2 (cost 175)
                                                                           └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_1a (cost 45)
                              └─ cl_armor_1 (cost 50)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_faith_1a (cost 45)
                                             └─ cl_speed_1 (cost 50)
                                                  └─ cl_radiance_2 (cost 55)
                                                       └─ cl_radiance_2a (cost 55)
                                                            └─ cleric_judgment [notable] (cost 400)
                                                                 └─ cl_radiance_filler_1 (cost 165)
                                                                      └─ cl_wrath_heavens [notable] (cost 400)
                                                                           └─ cl_radiance_filler_2 (cost 175)
                                                                                └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_holy_2 (cost 55)
                              └─ cl_holy_1a (cost 45)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_radiance_1 (cost 50)
                                             └─ cl_radiance_1a (cost 45)
                                                  └─ cl_radiance_2 (cost 55)
                                                       └─ cl_radiance_2a (cost 55)
                                                            └─ cleric_judgment [notable] (cost 400)
                                                                 └─ cl_radiance_filler_1 (cost 165)
                                                                      └─ cl_wrath_heavens [notable] (cost 400)
                                                                           └─ cl_radiance_filler_2 (cost 175)
                                                                                └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_armor_2 (cost 60)
                              └─ cl_armor_1a (cost 45)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_faith_1 (cost 50)
                                             └─ cl_faith_1a (cost 45)
                                                  └─ cl_speed_1 (cost 50)
                                                       └─ cl_radiance_2 (cost 55)
                                                            └─ cl_radiance_2a (cost 55)
                                                                 └─ cleric_judgment [notable] (cost 400)
                                                                      └─ cl_radiance_filler_1 (cost 165)
                                                                           └─ cl_wrath_heavens [notable] (cost 400)
                                                                                └─ cl_radiance_filler_2 (cost 175)
                                                                                     └─ cl_keystone_archangel [KEYSTONE] (cost 840)
```

#### → cl_keystone_archangel_asc2 (อัครทูตสวรรค์เหนือขีดจำกัด / Transcendent Archangel, cost 1090)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_radiance_2a (cost 55)
                         └─ cleric_judgment [notable] (cost 400)
                              └─ cl_radiance_filler_1 (cost 165)
                                   └─ cl_wrath_heavens [notable] (cost 400)
                                        └─ cl_radiance_filler_2 (cost 175)
                                             └─ cl_keystone_archangel (cost 840)
                                                  └─ cl_keystone_archangel_asc1 (cost 295)
                                                       └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_2a (cost 55)
                              └─ cleric_judgment [notable] (cost 400)
                                   └─ cl_radiance_filler_1 (cost 165)
                                        └─ cl_wrath_heavens [notable] (cost 400)
                                             └─ cl_radiance_filler_2 (cost 175)
                                                  └─ cl_keystone_archangel (cost 840)
                                                       └─ cl_keystone_archangel_asc1 (cost 295)
                                                            └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_2a (cost 55)
                              └─ cleric_judgment [notable] (cost 400)
                                   └─ cl_radiance_filler_1 (cost 165)
                                        └─ cl_wrath_heavens [notable] (cost 400)
                                             └─ cl_radiance_filler_2 (cost 175)
                                                  └─ cl_keystone_archangel (cost 840)
                                                       └─ cl_keystone_archangel_asc1 (cost 295)
                                                            └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_radiance_2 (cost 55)
                              └─ cl_radiance_2a (cost 55)
                                   └─ cleric_judgment [notable] (cost 400)
                                        └─ cl_radiance_filler_1 (cost 165)
                                             └─ cl_wrath_heavens [notable] (cost 400)
                                                  └─ cl_radiance_filler_2 (cost 175)
                                                       └─ cl_keystone_archangel (cost 840)
                                                            └─ cl_keystone_archangel_asc1 (cost 295)
                                                                 └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_1a (cost 45)
                              └─ cl_holy_1 (cost 50)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_radiance_1a (cost 45)
                                             └─ cl_radiance_2 (cost 55)
                                                  └─ cl_radiance_2a (cost 55)
                                                       └─ cleric_judgment [notable] (cost 400)
                                                            └─ cl_radiance_filler_1 (cost 165)
                                                                 └─ cl_wrath_heavens [notable] (cost 400)
                                                                      └─ cl_radiance_filler_2 (cost 175)
                                                                           └─ cl_keystone_archangel (cost 840)
                                                                                └─ cl_keystone_archangel_asc1 (cost 295)
                                                                                     └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_1a (cost 45)
                              └─ cl_armor_1 (cost 50)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_faith_1a (cost 45)
                                             └─ cl_speed_1 (cost 50)
                                                  └─ cl_radiance_2 (cost 55)
                                                       └─ cl_radiance_2a (cost 55)
                                                            └─ cleric_judgment [notable] (cost 400)
                                                                 └─ cl_radiance_filler_1 (cost 165)
                                                                      └─ cl_wrath_heavens [notable] (cost 400)
                                                                           └─ cl_radiance_filler_2 (cost 175)
                                                                                └─ cl_keystone_archangel (cost 840)
                                                                                     └─ cl_keystone_archangel_asc1 (cost 295)
                                                                                          └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_holy_2 (cost 55)
                              └─ cl_holy_1a (cost 45)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_radiance_1 (cost 50)
                                             └─ cl_radiance_1a (cost 45)
                                                  └─ cl_radiance_2 (cost 55)
                                                       └─ cl_radiance_2a (cost 55)
                                                            └─ cleric_judgment [notable] (cost 400)
                                                                 └─ cl_radiance_filler_1 (cost 165)
                                                                      └─ cl_wrath_heavens [notable] (cost 400)
                                                                           └─ cl_radiance_filler_2 (cost 175)
                                                                                └─ cl_keystone_archangel (cost 840)
                                                                                     └─ cl_keystone_archangel_asc1 (cost 295)
                                                                                          └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_armor_2 (cost 60)
                              └─ cl_armor_1a (cost 45)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_faith_1 (cost 50)
                                             └─ cl_faith_1a (cost 45)
                                                  └─ cl_speed_1 (cost 50)
                                                       └─ cl_radiance_2 (cost 55)
                                                            └─ cl_radiance_2a (cost 55)
                                                                 └─ cleric_judgment [notable] (cost 400)
                                                                      └─ cl_radiance_filler_1 (cost 165)
                                                                           └─ cl_wrath_heavens [notable] (cost 400)
                                                                                └─ cl_radiance_filler_2 (cost 175)
                                                                                     └─ cl_keystone_archangel (cost 840)
                                                                                          └─ cl_keystone_archangel_asc1 (cost 295)
                                                                                               └─ cl_keystone_archangel_asc2 [KEYSTONE] (cost 1090)
```

#### → cl_keystone_sanctuary (สถานศักดิ์สิทธิ์ไร้เทียมทาน / Impervious Sanctuary, cost 820)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_armor_2a (cost 55)
                         └─ cleric_aegis [notable] (cost 360)
                              └─ cl_armor_filler_1 (cost 160)
                                   └─ cl_consecrated_ground [notable] (cost 380)
                                        └─ cl_armor_filler_2 (cost 175)
                                             └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_2a (cost 55)
                              └─ cleric_aegis [notable] (cost 360)
                                   └─ cl_armor_filler_1 (cost 160)
                                        └─ cl_consecrated_ground [notable] (cost 380)
                                             └─ cl_armor_filler_2 (cost 175)
                                                  └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_2a (cost 55)
                              └─ cleric_aegis [notable] (cost 360)
                                   └─ cl_armor_filler_1 (cost 160)
                                        └─ cl_consecrated_ground [notable] (cost 380)
                                             └─ cl_armor_filler_2 (cost 175)
                                                  └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_armor_2 (cost 60)
                              └─ cl_armor_2a (cost 55)
                                   └─ cleric_aegis [notable] (cost 360)
                                        └─ cl_armor_filler_1 (cost 160)
                                             └─ cl_consecrated_ground [notable] (cost 380)
                                                  └─ cl_armor_filler_2 (cost 175)
                                                       └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_faith_1a (cost 45)
                              └─ cl_faith_1 (cost 50)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_armor_1a (cost 45)
                                             └─ cl_armor_2 (cost 60)
                                                  └─ cl_armor_2a (cost 55)
                                                       └─ cleric_aegis [notable] (cost 360)
                                                            └─ cl_armor_filler_1 (cost 160)
                                                                 └─ cl_consecrated_ground [notable] (cost 380)
                                                                      └─ cl_armor_filler_2 (cost 175)
                                                                           └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_speed_1 (cost 50)
                              └─ cl_faith_1a (cost 45)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_armor_1 (cost 50)
                                             └─ cl_armor_1a (cost 45)
                                                  └─ cl_armor_2 (cost 60)
                                                       └─ cl_armor_2a (cost 55)
                                                            └─ cleric_aegis [notable] (cost 360)
                                                                 └─ cl_armor_filler_1 (cost 160)
                                                                      └─ cl_consecrated_ground [notable] (cost 380)
                                                                           └─ cl_armor_filler_2 (cost 175)
                                                                                └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_1a (cost 45)
                              └─ cl_radiance_1 (cost 50)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_holy_1a (cost 45)
                                             └─ cl_holy_2 (cost 55)
                                                  └─ cl_armor_2 (cost 60)
                                                       └─ cl_armor_2a (cost 55)
                                                            └─ cleric_aegis [notable] (cost 360)
                                                                 └─ cl_armor_filler_1 (cost 160)
                                                                      └─ cl_consecrated_ground [notable] (cost 380)
                                                                           └─ cl_armor_filler_2 (cost 175)
                                                                                └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_radiance_2 (cost 55)
                              └─ cl_radiance_1a (cost 45)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_holy_1 (cost 50)
                                             └─ cl_holy_1a (cost 45)
                                                  └─ cl_holy_2 (cost 55)
                                                       └─ cl_armor_2 (cost 60)
                                                            └─ cl_armor_2a (cost 55)
                                                                 └─ cleric_aegis [notable] (cost 360)
                                                                      └─ cl_armor_filler_1 (cost 160)
                                                                           └─ cl_consecrated_ground [notable] (cost 380)
                                                                                └─ cl_armor_filler_2 (cost 175)
                                                                                     └─ cl_keystone_sanctuary [KEYSTONE] (cost 820)
```

#### → cl_keystone_sanctuary_asc2 (สถานศักดิ์สิทธิ์เหนือขีดจำกัด / Transcendent Sanctuary, cost 1070)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_armor_2a (cost 55)
                         └─ cleric_aegis [notable] (cost 360)
                              └─ cl_armor_filler_1 (cost 160)
                                   └─ cl_consecrated_ground [notable] (cost 380)
                                        └─ cl_armor_filler_2 (cost 175)
                                             └─ cl_keystone_sanctuary (cost 820)
                                                  └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                       └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_2a (cost 55)
                              └─ cleric_aegis [notable] (cost 360)
                                   └─ cl_armor_filler_1 (cost 160)
                                        └─ cl_consecrated_ground [notable] (cost 380)
                                             └─ cl_armor_filler_2 (cost 175)
                                                  └─ cl_keystone_sanctuary (cost 820)
                                                       └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                            └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_2a (cost 55)
                              └─ cleric_aegis [notable] (cost 360)
                                   └─ cl_armor_filler_1 (cost 160)
                                        └─ cl_consecrated_ground [notable] (cost 380)
                                             └─ cl_armor_filler_2 (cost 175)
                                                  └─ cl_keystone_sanctuary (cost 820)
                                                       └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                            └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_armor_2 (cost 60)
                              └─ cl_armor_2a (cost 55)
                                   └─ cleric_aegis [notable] (cost 360)
                                        └─ cl_armor_filler_1 (cost 160)
                                             └─ cl_consecrated_ground [notable] (cost 380)
                                                  └─ cl_armor_filler_2 (cost 175)
                                                       └─ cl_keystone_sanctuary (cost 820)
                                                            └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                                 └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_faith_1a (cost 45)
                              └─ cl_faith_1 (cost 50)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_armor_1a (cost 45)
                                             └─ cl_armor_2 (cost 60)
                                                  └─ cl_armor_2a (cost 55)
                                                       └─ cleric_aegis [notable] (cost 360)
                                                            └─ cl_armor_filler_1 (cost 160)
                                                                 └─ cl_consecrated_ground [notable] (cost 380)
                                                                      └─ cl_armor_filler_2 (cost 175)
                                                                           └─ cl_keystone_sanctuary (cost 820)
                                                                                └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                                                     └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_speed_1 (cost 50)
                              └─ cl_faith_1a (cost 45)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_armor_1 (cost 50)
                                             └─ cl_armor_1a (cost 45)
                                                  └─ cl_armor_2 (cost 60)
                                                       └─ cl_armor_2a (cost 55)
                                                            └─ cleric_aegis [notable] (cost 360)
                                                                 └─ cl_armor_filler_1 (cost 160)
                                                                      └─ cl_consecrated_ground [notable] (cost 380)
                                                                           └─ cl_armor_filler_2 (cost 175)
                                                                                └─ cl_keystone_sanctuary (cost 820)
                                                                                     └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                                                          └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_radiance_1a (cost 45)
                              └─ cl_radiance_1 (cost 50)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_holy_1a (cost 45)
                                             └─ cl_holy_2 (cost 55)
                                                  └─ cl_armor_2 (cost 60)
                                                       └─ cl_armor_2a (cost 55)
                                                            └─ cleric_aegis [notable] (cost 360)
                                                                 └─ cl_armor_filler_1 (cost 160)
                                                                      └─ cl_consecrated_ground [notable] (cost 380)
                                                                           └─ cl_armor_filler_2 (cost 175)
                                                                                └─ cl_keystone_sanctuary (cost 820)
                                                                                     └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                                                          └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_radiance_2 (cost 55)
                              └─ cl_radiance_1a (cost 45)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_holy_1 (cost 50)
                                             └─ cl_holy_1a (cost 45)
                                                  └─ cl_holy_2 (cost 55)
                                                       └─ cl_armor_2 (cost 60)
                                                            └─ cl_armor_2a (cost 55)
                                                                 └─ cleric_aegis [notable] (cost 360)
                                                                      └─ cl_armor_filler_1 (cost 160)
                                                                           └─ cl_consecrated_ground [notable] (cost 380)
                                                                                └─ cl_armor_filler_2 (cost 175)
                                                                                     └─ cl_keystone_sanctuary (cost 820)
                                                                                          └─ cl_keystone_sanctuary_asc1 (cost 285)
                                                                                               └─ cl_keystone_sanctuary_asc2 [KEYSTONE] (cost 1070)
```

#### → cl_keystone_providence (พรหมลิขิตแห่งเทพเจ้า / Divine Providence, cost 800)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_speed_1a (cost 50)
                         └─ cl_magnet_1 (cost 55)
                              └─ cl_magnet_1a (cost 55)
                                   └─ cl_heavenly_retrib [notable] (cost 370)
                                        └─ cl_faith_filler_1 (cost 170)
                                             └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_speed_1a (cost 50)
                              └─ cl_magnet_1 (cost 55)
                                   └─ cl_magnet_1a (cost 55)
                                        └─ cl_heavenly_retrib [notable] (cost 370)
                                             └─ cl_faith_filler_1 (cost 170)
                                                  └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_speed_1a (cost 50)
                              └─ cl_magnet_1 (cost 55)
                                   └─ cl_magnet_1a (cost 55)
                                        └─ cl_heavenly_retrib [notable] (cost 370)
                                             └─ cl_faith_filler_1 (cost 170)
                                                  └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_speed_1 (cost 50)
                              └─ cl_speed_1a (cost 50)
                                   └─ cl_magnet_1 (cost 55)
                                        └─ cl_magnet_1a (cost 55)
                                             └─ cl_heavenly_retrib [notable] (cost 370)
                                                  └─ cl_faith_filler_1 (cost 170)
                                                       └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_1a (cost 45)
                              └─ cl_armor_1 (cost 50)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_faith_1a (cost 45)
                                             └─ cl_speed_1 (cost 50)
                                                  └─ cl_speed_1a (cost 50)
                                                       └─ cl_magnet_1 (cost 55)
                                                            └─ cl_magnet_1a (cost 55)
                                                                 └─ cl_heavenly_retrib [notable] (cost 370)
                                                                      └─ cl_faith_filler_1 (cost 170)
                                                                           └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_armor_2 (cost 60)
                              └─ cl_armor_1a (cost 45)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_faith_1 (cost 50)
                                             └─ cl_faith_1a (cost 45)
                                                  └─ cl_speed_1 (cost 50)
                                                       └─ cl_speed_1a (cost 50)
                                                            └─ cl_magnet_1 (cost 55)
                                                                 └─ cl_magnet_1a (cost 55)
                                                                      └─ cl_heavenly_retrib [notable] (cost 370)
                                                                           └─ cl_faith_filler_1 (cost 170)
                                                                                └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_1a (cost 45)
                              └─ cl_holy_1 (cost 50)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_radiance_1a (cost 45)
                                             └─ cl_radiance_2 (cost 55)
                                                  └─ cl_speed_1 (cost 50)
                                                       └─ cl_speed_1a (cost 50)
                                                            └─ cl_magnet_1 (cost 55)
                                                                 └─ cl_magnet_1a (cost 55)
                                                                      └─ cl_heavenly_retrib [notable] (cost 370)
                                                                           └─ cl_faith_filler_1 (cost 170)
                                                                                └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_holy_2 (cost 55)
                              └─ cl_holy_1a (cost 45)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_radiance_1 (cost 50)
                                             └─ cl_radiance_1a (cost 45)
                                                  └─ cl_radiance_2 (cost 55)
                                                       └─ cl_speed_1 (cost 50)
                                                            └─ cl_speed_1a (cost 50)
                                                                 └─ cl_magnet_1 (cost 55)
                                                                      └─ cl_magnet_1a (cost 55)
                                                                           └─ cl_heavenly_retrib [notable] (cost 370)
                                                                                └─ cl_faith_filler_1 (cost 170)
                                                                                     └─ cl_keystone_providence [KEYSTONE] (cost 800)
```

#### → cl_keystone_providence_asc2 (พรหมลิขิตเหนือขีดจำกัด / Transcendent Providence, cost 1040)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_faith_1a (cost 45)
               └─ cl_speed_1 (cost 50)
                    └─ cl_speed_1a (cost 50)
                         └─ cl_magnet_1 (cost 55)
                              └─ cl_magnet_1a (cost 55)
                                   └─ cl_heavenly_retrib [notable] (cost 370)
                                        └─ cl_faith_filler_1 (cost 170)
                                             └─ cl_keystone_providence (cost 800)
                                                  └─ cl_keystone_providence_asc1 (cost 280)
                                                       └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 2:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_radiance_1a (cost 45)
               └─ cl_radiance_2 (cost 55)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_speed_1a (cost 50)
                              └─ cl_magnet_1 (cost 55)
                                   └─ cl_magnet_1a (cost 55)
                                        └─ cl_heavenly_retrib [notable] (cost 370)
                                             └─ cl_faith_filler_1 (cost 170)
                                                  └─ cl_keystone_providence (cost 800)
                                                       └─ cl_keystone_providence_asc1 (cost 280)
                                                            └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 3:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_faith_1 (cost 50)
               └─ cl_faith_1a (cost 45)
                    └─ cl_speed_1 (cost 50)
                         └─ cl_speed_1a (cost 50)
                              └─ cl_magnet_1 (cost 55)
                                   └─ cl_magnet_1a (cost 55)
                                        └─ cl_heavenly_retrib [notable] (cost 370)
                                             └─ cl_faith_filler_1 (cost 170)
                                                  └─ cl_keystone_providence (cost 800)
                                                       └─ cl_keystone_providence_asc1 (cost 280)
                                                            └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 4:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_radiance_1 (cost 50)
               └─ cl_radiance_1a (cost 45)
                    └─ cl_radiance_2 (cost 55)
                         └─ cl_speed_1 (cost 50)
                              └─ cl_speed_1a (cost 50)
                                   └─ cl_magnet_1 (cost 55)
                                        └─ cl_magnet_1a (cost 55)
                                             └─ cl_heavenly_retrib [notable] (cost 370)
                                                  └─ cl_faith_filler_1 (cost 170)
                                                       └─ cl_keystone_providence (cost 800)
                                                            └─ cl_keystone_providence_asc1 (cost 280)
                                                                 └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 5:**
```
cl_root (cost 0)
     └─ cl_holy_1 (cost 50)
          └─ cl_holy_1a (cost 45)
               └─ cl_holy_2 (cost 55)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_armor_1a (cost 45)
                              └─ cl_armor_1 (cost 50)
                                   └─ cl_faith_1 (cost 50)
                                        └─ cl_faith_1a (cost 45)
                                             └─ cl_speed_1 (cost 50)
                                                  └─ cl_speed_1a (cost 50)
                                                       └─ cl_magnet_1 (cost 55)
                                                            └─ cl_magnet_1a (cost 55)
                                                                 └─ cl_heavenly_retrib [notable] (cost 370)
                                                                      └─ cl_faith_filler_1 (cost 170)
                                                                           └─ cl_keystone_providence (cost 800)
                                                                                └─ cl_keystone_providence_asc1 (cost 280)
                                                                                     └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 6:**
```
cl_root (cost 0)
     └─ cl_radiance_1 (cost 50)
          └─ cl_holy_1 (cost 50)
               └─ cl_holy_1a (cost 45)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_armor_2 (cost 60)
                              └─ cl_armor_1a (cost 45)
                                   └─ cl_armor_1 (cost 50)
                                        └─ cl_faith_1 (cost 50)
                                             └─ cl_faith_1a (cost 45)
                                                  └─ cl_speed_1 (cost 50)
                                                       └─ cl_speed_1a (cost 50)
                                                            └─ cl_magnet_1 (cost 55)
                                                                 └─ cl_magnet_1a (cost 55)
                                                                      └─ cl_heavenly_retrib [notable] (cost 370)
                                                                           └─ cl_faith_filler_1 (cost 170)
                                                                                └─ cl_keystone_providence (cost 800)
                                                                                     └─ cl_keystone_providence_asc1 (cost 280)
                                                                                          └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 7:**
```
cl_root (cost 0)
     └─ cl_armor_1 (cost 50)
          └─ cl_armor_1a (cost 45)
               └─ cl_armor_2 (cost 60)
                    └─ cl_holy_2 (cost 55)
                         └─ cl_holy_1a (cost 45)
                              └─ cl_holy_1 (cost 50)
                                   └─ cl_radiance_1 (cost 50)
                                        └─ cl_radiance_1a (cost 45)
                                             └─ cl_radiance_2 (cost 55)
                                                  └─ cl_speed_1 (cost 50)
                                                       └─ cl_speed_1a (cost 50)
                                                            └─ cl_magnet_1 (cost 55)
                                                                 └─ cl_magnet_1a (cost 55)
                                                                      └─ cl_heavenly_retrib [notable] (cost 370)
                                                                           └─ cl_faith_filler_1 (cost 170)
                                                                                └─ cl_keystone_providence (cost 800)
                                                                                     └─ cl_keystone_providence_asc1 (cost 280)
                                                                                          └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```

**เส้นทางที่ 8:**
```
cl_root (cost 0)
     └─ cl_faith_1 (cost 50)
          └─ cl_armor_1 (cost 50)
               └─ cl_armor_1a (cost 45)
                    └─ cl_armor_2 (cost 60)
                         └─ cl_holy_2 (cost 55)
                              └─ cl_holy_1a (cost 45)
                                   └─ cl_holy_1 (cost 50)
                                        └─ cl_radiance_1 (cost 50)
                                             └─ cl_radiance_1a (cost 45)
                                                  └─ cl_radiance_2 (cost 55)
                                                       └─ cl_speed_1 (cost 50)
                                                            └─ cl_speed_1a (cost 50)
                                                                 └─ cl_magnet_1 (cost 55)
                                                                      └─ cl_magnet_1a (cost 55)
                                                                           └─ cl_heavenly_retrib [notable] (cost 370)
                                                                                └─ cl_faith_filler_1 (cost 170)
                                                                                     └─ cl_keystone_providence (cost 800)
                                                                                          └─ cl_keystone_providence_asc1 (cost 280)
                                                                                               └─ cl_keystone_providence_asc2 [KEYSTONE] (cost 1040)
```


<a id="commando"></a>
## Commando (rootId: cmd_root, 40 nodes)

_title: Tactical Vanguard — Special Warfare Mastery Web / จอมยุทธการกลยุทธ์ — สายทักษะขั้นสูงสุดแห่งสงครามพิเศษ_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| cmd_root | ศูนย์บัญชาการ / Vanguard Headquarters | root | cmd_frag_minor, cmd_ap_minor, cmd_hp_minor, cmd_speed_minor | 0 | maxHp:15 | — |
| cmd_frag_minor | ปรับแต่งดินระเบิด / Munitions Conditioning | minor | cmd_root, cmd_frag_calibration, commando_frag_grenade | 48 | damageBonus:0.5 | — |
| cmd_frag_calibration | ปรับเทียบชนวน / Primer Calibration | minor | cmd_frag_minor, cmd_radius_minor | 47 | damageBonus:0.5 | — |
| cmd_radius_minor | ขยายรัศมีแรงอัด / Blast Radius | minor | cmd_frag_calibration, cmd_blast_dispersal, cmd_napalm | 55 | damageBonus:0.5 | — |
| cmd_blast_dispersal | ชนวนกระจายกว้าง / Wide-Dispersal Fuse | minor | cmd_radius_minor, cmd_shrapnel_1 | 55 | damageBonus:0.5 | — |
| commando_frag_grenade | ระเบิดลูกปราย / Frag Grenade Satchel | notable | cmd_frag_minor, cmd_shrapnel_1 | 360 | — [element: ballistic_fire] | commando_frag_grenade |
| cmd_shrapnel_1 | สะเก็ดเพลิง / Thermite Shrapnel | minor | cmd_blast_dispersal, commando_frag_grenade, cmd_incendiary_fragments | 68 | damageBonus:1 | — |
| cmd_incendiary_fragments | สะเก็ดเพลิงไหม้ / Incendiary Fragments | minor | cmd_shrapnel_1, commando_airstrike | 67 | damageBonus:1 | — |
| cmd_napalm | ระเบิดเพลิงนาปาล์ม / Napalm Cluster | notable | cmd_radius_minor, cmd_cluster_payload | 380 | damageBonus:2 [element: ballistic_fire] | — |
| cmd_cluster_payload | หัวรบคลัสเตอร์ / Cluster Payload | minor | cmd_napalm, commando_airstrike | 160 | damageBonus:1 | — |
| commando_airstrike | การโจมตีทางอากาศ / Precision Airstrike | keystone | cmd_incendiary_fragments, cmd_cluster_payload, commando_airstrike_asc1 | 450 | — [element: ballistic_fire] | commando_airstrike |
| commando_airstrike_asc1 | โจมตีทางอากาศขั้นสูง / Greater Airstrike | minor | commando_airstrike, commando_airstrike_asc2 | 160 | damageBonus:0.5 | — |
| commando_airstrike_asc2 | โจมตีทางอากาศจอมพลัง / Transcendent Airstrike | keystone | commando_airstrike_asc1 | 590 | damageBonus:2 | — |
| cmd_ap_minor | กระสุนเจาะเกราะ / Tungsten AP Core | minor | cmd_root, cmd_ap_stabilization, commando_ap_rounds | 48 | damageBonus:0.5 | — |
| cmd_ap_stabilization | ปลอกกระสุนเสถียร / Stabilized Cartridge | minor | cmd_ap_minor, cmd_recoil_minor | 47 | damageBonus:0.5 | — |
| cmd_recoil_minor | ลดแรงดีด / Recoil Compensator | minor | cmd_ap_stabilization, cmd_grip_stabilizer, cmd_bullet_fury | 55 | moveSpeed:0.5 | — |
| cmd_grip_stabilizer | ด้ามจับสมดุล / Ergonomic Grip | minor | cmd_recoil_minor, cmd_fire_rate_1 | 55 | moveSpeed:0.5 | — |
| commando_ap_rounds | หัวกระสุนทังสเตน / High-Caliber AP | notable | cmd_ap_minor, cmd_fire_rate_1 | 360 | — [element: ballistic_fire] | commando_ap_rounds |
| cmd_fire_rate_1 | เกลียวลำกล้องคู่ / Heavy Barrel Rifling | minor | cmd_grip_stabilizer, commando_ap_rounds, cmd_chrome_barrel | 68 | damageBonus:1 | — |
| cmd_chrome_barrel | ลำกล้องเคลือบโครเมียม / Chrome-Lined Barrel | minor | cmd_fire_rate_1, commando_tactical_reload | 67 | damageBonus:1 | — |
| cmd_bullet_fury | กระหน่ำยิงกดดัน / Suppressing Fire | notable | cmd_recoil_minor, cmd_belt_feed | 380 | damageBonus:2 | — |
| cmd_belt_feed | สายพานกระสุนต่อเนื่อง / Belt-Fed Magazine | minor | cmd_bullet_fury, commando_tactical_reload | 160 | damageBonus:1 | — |
| commando_tactical_reload | รีโหลดฉับพลัน / Tactical Mag Reloader | keystone | cmd_chrome_barrel, cmd_belt_feed, commando_tactical_reload_asc1 | 450 | — [element: ballistic_fire] | commando_tactical_reload |
| commando_tactical_reload_asc1 | รีโหลดฉับพลันขั้นสูง / Greater Mag Reloader | minor | commando_tactical_reload, commando_tactical_reload_asc2 | 160 | damageBonus:0.5 | — |
| commando_tactical_reload_asc2 | รีโหลดฉับพลันจอมพลัง / Transcendent Mag Reloader | keystone | commando_tactical_reload_asc1 | 590 | damageBonus:2 | — |
| cmd_hp_minor | เกราะเคฟลาร์ / Kevlar Weave | minor | cmd_root, cmd_trauma_padding, cmd_speed_minor | 50 | maxHp:8, defense:1 | — |
| cmd_trauma_padding | แผ่นรองกันกระแทก / Trauma Padding | minor | cmd_hp_minor, cmd_kevlar | 50 | maxHp:7 | — |
| cmd_speed_minor | วิ่งแทคติคอล / Tactical Sprint | minor | cmd_root, cmd_hp_minor, cmd_rapid_deployment | 50 | moveSpeed:0.5 | — |
| cmd_rapid_deployment | ฝึกส่งกำลังเร็ว / Rapid Deployment Drill | minor | cmd_speed_minor, cmd_combat_boots | 50 | moveSpeed:0.5 | — |
| cmd_kevlar | แผ่นเกราะเซรามิก / Ceramic Trauma Plates | notable | cmd_trauma_padding, cmd_reinforced_plating, cmd_adrenaline | 320 | defense:2, maxHp:20 | — |
| cmd_reinforced_plating | แผ่นเซรามิกเสริมแรง / Reinforced Ceramic Plating | minor | cmd_kevlar, cmd_juggernaut | 170 | defense:1 | — |
| cmd_combat_boots | โครงเสริมกำลังรบ / Vanguard Exosuit | notable | cmd_rapid_deployment, cmd_servo_reinforcement, cmd_last_stand | 320 | moveSpeed:1, pickupRadius:1 | — |
| cmd_servo_reinforcement | เซอร์โวเสริมกำลัง / Servo Reinforcement | minor | cmd_combat_boots, cmd_juggernaut | 170 | moveSpeed:0.5 | — |
| cmd_adrenaline | อะดรีนาลีนสงคราม / Combat Adrenaline | minor | cmd_kevlar, cmd_stim_injector | 75 | maxHp:13 | — |
| cmd_stim_injector | เข็มฉีดสารกระตุ้นสนามรบ / Combat Stim Injector | minor | cmd_adrenaline, cmd_juggernaut | 75 | maxHp:12 | — |
| cmd_last_stand | คำสั่งสู้ตาย / Last Stand Protocol | minor | cmd_combat_boots, cmd_bunker_discipline | 75 | defense:1 | — |
| cmd_bunker_discipline | วินัยประจำที่มั่น / Bunker Discipline | minor | cmd_last_stand, cmd_juggernaut | 75 | defense:1 | — |
| cmd_juggernaut | สุดยอดทหารศึก / Apex Warfighter | keystone | cmd_reinforced_plating, cmd_servo_reinforcement, cmd_stim_injector, cmd_bunker_discipline, cmd_juggernaut_asc1 | 450 | maxHp:50, defense:3 | — |
| cmd_juggernaut_asc1 | สุดยอดทหารศึกขั้นสูง / Greater Warfighter | minor | cmd_juggernaut, cmd_juggernaut_asc2 | 160 | maxHp:15, defense:1 | — |
| cmd_juggernaut_asc2 | สุดยอดทหารศึกจอมพลัง / Transcendent Warfighter | keystone | cmd_juggernaut_asc1 | 590 | maxHp:50, defense:3 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → commando_airstrike (การโจมตีทางอากาศ / Precision Airstrike, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ commando_frag_grenade [notable] (cost 360)
               └─ cmd_shrapnel_1 (cost 68)
                    └─ cmd_incendiary_fragments (cost 67)
                         └─ commando_airstrike [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ cmd_frag_calibration (cost 47)
               └─ cmd_radius_minor (cost 55)
                    └─ cmd_napalm [notable] (cost 380)
                         └─ cmd_cluster_payload (cost 160)
                              └─ commando_airstrike [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ cmd_frag_calibration (cost 47)
               └─ cmd_radius_minor (cost 55)
                    └─ cmd_blast_dispersal (cost 55)
                         └─ cmd_shrapnel_1 (cost 68)
                              └─ cmd_incendiary_fragments (cost 67)
                                   └─ commando_airstrike [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ commando_frag_grenade [notable] (cost 360)
               └─ cmd_shrapnel_1 (cost 68)
                    └─ cmd_blast_dispersal (cost 55)
                         └─ cmd_radius_minor (cost 55)
                              └─ cmd_napalm [notable] (cost 380)
                                   └─ cmd_cluster_payload (cost 160)
                                        └─ commando_airstrike [KEYSTONE] (cost 450)
```

#### → commando_airstrike_asc2 (โจมตีทางอากาศจอมพลัง / Transcendent Airstrike, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ commando_frag_grenade [notable] (cost 360)
               └─ cmd_shrapnel_1 (cost 68)
                    └─ cmd_incendiary_fragments (cost 67)
                         └─ commando_airstrike (cost 450)
                              └─ commando_airstrike_asc1 (cost 160)
                                   └─ commando_airstrike_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ cmd_frag_calibration (cost 47)
               └─ cmd_radius_minor (cost 55)
                    └─ cmd_napalm [notable] (cost 380)
                         └─ cmd_cluster_payload (cost 160)
                              └─ commando_airstrike (cost 450)
                                   └─ commando_airstrike_asc1 (cost 160)
                                        └─ commando_airstrike_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ cmd_frag_calibration (cost 47)
               └─ cmd_radius_minor (cost 55)
                    └─ cmd_blast_dispersal (cost 55)
                         └─ cmd_shrapnel_1 (cost 68)
                              └─ cmd_incendiary_fragments (cost 67)
                                   └─ commando_airstrike (cost 450)
                                        └─ commando_airstrike_asc1 (cost 160)
                                             └─ commando_airstrike_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cmd_root (cost 0)
     └─ cmd_frag_minor (cost 48)
          └─ commando_frag_grenade [notable] (cost 360)
               └─ cmd_shrapnel_1 (cost 68)
                    └─ cmd_blast_dispersal (cost 55)
                         └─ cmd_radius_minor (cost 55)
                              └─ cmd_napalm [notable] (cost 380)
                                   └─ cmd_cluster_payload (cost 160)
                                        └─ commando_airstrike (cost 450)
                                             └─ commando_airstrike_asc1 (cost 160)
                                                  └─ commando_airstrike_asc2 [KEYSTONE] (cost 590)
```

#### → commando_tactical_reload (รีโหลดฉับพลัน / Tactical Mag Reloader, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ commando_ap_rounds [notable] (cost 360)
               └─ cmd_fire_rate_1 (cost 68)
                    └─ cmd_chrome_barrel (cost 67)
                         └─ commando_tactical_reload [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ cmd_ap_stabilization (cost 47)
               └─ cmd_recoil_minor (cost 55)
                    └─ cmd_bullet_fury [notable] (cost 380)
                         └─ cmd_belt_feed (cost 160)
                              └─ commando_tactical_reload [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ cmd_ap_stabilization (cost 47)
               └─ cmd_recoil_minor (cost 55)
                    └─ cmd_grip_stabilizer (cost 55)
                         └─ cmd_fire_rate_1 (cost 68)
                              └─ cmd_chrome_barrel (cost 67)
                                   └─ commando_tactical_reload [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ commando_ap_rounds [notable] (cost 360)
               └─ cmd_fire_rate_1 (cost 68)
                    └─ cmd_grip_stabilizer (cost 55)
                         └─ cmd_recoil_minor (cost 55)
                              └─ cmd_bullet_fury [notable] (cost 380)
                                   └─ cmd_belt_feed (cost 160)
                                        └─ commando_tactical_reload [KEYSTONE] (cost 450)
```

#### → commando_tactical_reload_asc2 (รีโหลดฉับพลันจอมพลัง / Transcendent Mag Reloader, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ commando_ap_rounds [notable] (cost 360)
               └─ cmd_fire_rate_1 (cost 68)
                    └─ cmd_chrome_barrel (cost 67)
                         └─ commando_tactical_reload (cost 450)
                              └─ commando_tactical_reload_asc1 (cost 160)
                                   └─ commando_tactical_reload_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ cmd_ap_stabilization (cost 47)
               └─ cmd_recoil_minor (cost 55)
                    └─ cmd_bullet_fury [notable] (cost 380)
                         └─ cmd_belt_feed (cost 160)
                              └─ commando_tactical_reload (cost 450)
                                   └─ commando_tactical_reload_asc1 (cost 160)
                                        └─ commando_tactical_reload_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ cmd_ap_stabilization (cost 47)
               └─ cmd_recoil_minor (cost 55)
                    └─ cmd_grip_stabilizer (cost 55)
                         └─ cmd_fire_rate_1 (cost 68)
                              └─ cmd_chrome_barrel (cost 67)
                                   └─ commando_tactical_reload (cost 450)
                                        └─ commando_tactical_reload_asc1 (cost 160)
                                             └─ commando_tactical_reload_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cmd_root (cost 0)
     └─ cmd_ap_minor (cost 48)
          └─ commando_ap_rounds [notable] (cost 360)
               └─ cmd_fire_rate_1 (cost 68)
                    └─ cmd_grip_stabilizer (cost 55)
                         └─ cmd_recoil_minor (cost 55)
                              └─ cmd_bullet_fury [notable] (cost 380)
                                   └─ cmd_belt_feed (cost 160)
                                        └─ commando_tactical_reload (cost 450)
                                             └─ commando_tactical_reload_asc1 (cost 160)
                                                  └─ commando_tactical_reload_asc2 [KEYSTONE] (cost 590)
```

#### → cmd_juggernaut (สุดยอดทหารศึก / Apex Warfighter, cost 450)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_trauma_padding (cost 50)
               └─ cmd_kevlar [notable] (cost 320)
                    └─ cmd_reinforced_plating (cost 170)
                         └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_rapid_deployment (cost 50)
               └─ cmd_combat_boots [notable] (cost 320)
                    └─ cmd_servo_reinforcement (cost 170)
                         └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_speed_minor (cost 50)
               └─ cmd_rapid_deployment (cost 50)
                    └─ cmd_combat_boots [notable] (cost 320)
                         └─ cmd_servo_reinforcement (cost 170)
                              └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_trauma_padding (cost 50)
               └─ cmd_kevlar [notable] (cost 320)
                    └─ cmd_adrenaline (cost 75)
                         └─ cmd_stim_injector (cost 75)
                              └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 5:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_hp_minor (cost 50)
               └─ cmd_trauma_padding (cost 50)
                    └─ cmd_kevlar [notable] (cost 320)
                         └─ cmd_reinforced_plating (cost 170)
                              └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 6:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_rapid_deployment (cost 50)
               └─ cmd_combat_boots [notable] (cost 320)
                    └─ cmd_last_stand (cost 75)
                         └─ cmd_bunker_discipline (cost 75)
                              └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 7:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_speed_minor (cost 50)
               └─ cmd_rapid_deployment (cost 50)
                    └─ cmd_combat_boots [notable] (cost 320)
                         └─ cmd_last_stand (cost 75)
                              └─ cmd_bunker_discipline (cost 75)
                                   └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

**เส้นทางที่ 8:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_hp_minor (cost 50)
               └─ cmd_trauma_padding (cost 50)
                    └─ cmd_kevlar [notable] (cost 320)
                         └─ cmd_adrenaline (cost 75)
                              └─ cmd_stim_injector (cost 75)
                                   └─ cmd_juggernaut [KEYSTONE] (cost 450)
```

#### → cmd_juggernaut_asc2 (สุดยอดทหารศึกจอมพลัง / Transcendent Warfighter, cost 590)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_trauma_padding (cost 50)
               └─ cmd_kevlar [notable] (cost 320)
                    └─ cmd_reinforced_plating (cost 170)
                         └─ cmd_juggernaut (cost 450)
                              └─ cmd_juggernaut_asc1 (cost 160)
                                   └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_rapid_deployment (cost 50)
               └─ cmd_combat_boots [notable] (cost 320)
                    └─ cmd_servo_reinforcement (cost 170)
                         └─ cmd_juggernaut (cost 450)
                              └─ cmd_juggernaut_asc1 (cost 160)
                                   └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_speed_minor (cost 50)
               └─ cmd_rapid_deployment (cost 50)
                    └─ cmd_combat_boots [notable] (cost 320)
                         └─ cmd_servo_reinforcement (cost 170)
                              └─ cmd_juggernaut (cost 450)
                                   └─ cmd_juggernaut_asc1 (cost 160)
                                        └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_trauma_padding (cost 50)
               └─ cmd_kevlar [notable] (cost 320)
                    └─ cmd_adrenaline (cost 75)
                         └─ cmd_stim_injector (cost 75)
                              └─ cmd_juggernaut (cost 450)
                                   └─ cmd_juggernaut_asc1 (cost 160)
                                        └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 5:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_hp_minor (cost 50)
               └─ cmd_trauma_padding (cost 50)
                    └─ cmd_kevlar [notable] (cost 320)
                         └─ cmd_reinforced_plating (cost 170)
                              └─ cmd_juggernaut (cost 450)
                                   └─ cmd_juggernaut_asc1 (cost 160)
                                        └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 6:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_rapid_deployment (cost 50)
               └─ cmd_combat_boots [notable] (cost 320)
                    └─ cmd_last_stand (cost 75)
                         └─ cmd_bunker_discipline (cost 75)
                              └─ cmd_juggernaut (cost 450)
                                   └─ cmd_juggernaut_asc1 (cost 160)
                                        └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 7:**
```
cmd_root (cost 0)
     └─ cmd_hp_minor (cost 50)
          └─ cmd_speed_minor (cost 50)
               └─ cmd_rapid_deployment (cost 50)
                    └─ cmd_combat_boots [notable] (cost 320)
                         └─ cmd_last_stand (cost 75)
                              └─ cmd_bunker_discipline (cost 75)
                                   └─ cmd_juggernaut (cost 450)
                                        └─ cmd_juggernaut_asc1 (cost 160)
                                             └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 8:**
```
cmd_root (cost 0)
     └─ cmd_speed_minor (cost 50)
          └─ cmd_hp_minor (cost 50)
               └─ cmd_trauma_padding (cost 50)
                    └─ cmd_kevlar [notable] (cost 320)
                         └─ cmd_adrenaline (cost 75)
                              └─ cmd_stim_injector (cost 75)
                                   └─ cmd_juggernaut (cost 450)
                                        └─ cmd_juggernaut_asc1 (cost 160)
                                             └─ cmd_juggernaut_asc2 [KEYSTONE] (cost 590)
```


<a id="cat-tank"></a>
## Cat Tank (rootId: cat_root, 40 nodes)

_title: The Feline Bastion — Titan Chonk Mastery Web / ปราการเหมียวนุ่มนิ่ม — สายทักษะไททันจอมอ้วน_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| cat_root | ปราสาทแมวเหมียว / Cat Castle Core | root | cat_slam_minor, cat_spit_minor, cat_def_minor, cat_taunt_minor | 0 | maxHp:25 | — |
| cat_slam_minor | อุ้งมือทรงพลัง / Heavy Paws | minor | cat_root, cat_slam_minor_2, cattank_chonk_armor | 50 | damageBonus:0.5 | — |
| cat_slam_minor_2 | แผ่นรองอุ้งเท้าเหล็ก / Iron Paw Pads | minor | cat_slam_minor, cat_aoe_minor | 45 | damageBonus:0.5 | — |
| cat_aoe_minor | รัศมีความอ้วน / Chonk Radius | minor | cat_slam_minor_2, cat_aoe_minor_2, cat_seismic_1 | 55 | damageBonus:0.5 | — |
| cat_aoe_minor_2 | เขตระเบิดไขมัน / Blubber Blast Zone | minor | cat_aoe_minor, cat_belly_flop | 55 | damageBonus:0.5 | — |
| cattank_chonk_armor | เกราะไขมันหนานุ่ม / Titan Chonk Armor | notable | cat_slam_minor, cat_seismic_1 | 360 | maxHp:40, defense:2 [element: chonk_fortress] | cattank_chonk_armor |
| cat_seismic_1 | กรงเล็บแผ่นดินไหว / Seismic Claws | minor | cat_aoe_minor, cattank_chonk_armor, cat_seismic_2 | 70 | damageBonus:1 | — |
| cat_seismic_2 | รอยเลื่อนแตกร้าว / Fault Line Fury | minor | cat_seismic_1, cat_titan_quake | 65 | damageBonus:1 | — |
| cat_belly_flop | พุงทิ้งดิ่ง / Colossal Belly Flop | notable | cat_aoe_minor_2, cat_tremor_filler | 380 | damageBonus:2 | — |
| cat_tremor_filler | แรงสั่นสะเทือนติดตาม / Aftershock Padding | minor | cat_belly_flop, cat_titan_quake | 160 | damageBonus:0.5 | — |
| cat_titan_quake | มหาแผ่นดินไหวไททัน / Titan Earthshaker | keystone | cat_seismic_2, cat_tremor_filler, cat_titan_quake_asc1 | 450 | — [element: chonk_fortress] | — |
| cat_titan_quake_asc1 | มหาแผ่นดินไหวไททันขั้นสูง / Greater Earthshaker | minor | cat_titan_quake, cat_titan_quake_asc2 | 160 | damageBonus:0.5 | — |
| cat_titan_quake_asc2 | มหาแผ่นดินไหวไททันจอมพลัง / Transcendent Earthshaker | keystone | cat_titan_quake_asc1 | 590 | damageBonus:2 | — |
| cat_spit_minor | น้ำลายกรดเข้มข้น / Acid Saliva | minor | cat_root, cat_spit_minor_2, cattank_hairball | 50 | damageBonus:0.5 | — |
| cat_spit_minor_2 | เคลือบน้ำลายลื่นไหล / Slick Saliva Coating | minor | cat_spit_minor, cat_digest_minor | 45 | damageBonus:0.5 | — |
| cat_digest_minor | คลังเก็บก้อนขน / Fur Ball Storage | minor | cat_spit_minor_2, cat_digest_minor_2, cat_acid_pool | 55 | damageBonus:0.5 | — |
| cat_digest_minor_2 | แรงดันในกระเพาะ / Gizzard Pressure Build | minor | cat_digest_minor, cat_furball_frenzy | 55 | damageBonus:0.5 | — |
| cattank_hairball | เครื่องยิงก้อนขนกรด / Hairball Launcher | notable | cat_spit_minor, cat_acid_pool | 360 | — [element: chonk_fortress] | cattank_hairball |
| cat_acid_pool | บ่อกรดกัดกร่อน / Corrosive Puddle | minor | cat_digest_minor, cattank_hairball, cat_acid_pool_2 | 70 | damageBonus:1 | — |
| cat_acid_pool_2 | การกัดกร่อนยืดเยื้อ / Prolonged Corrosion | minor | cat_acid_pool, cat_hairball_gatling | 65 | damageBonus:1 | — |
| cat_furball_frenzy | สำลักก้อนขนรัว / Coughing Fit | notable | cat_digest_minor_2, cat_toxin_filler | 380 | — [element: chonk_fortress] | — |
| cat_toxin_filler | สะสมสารพิษ / Bilious Buildup | minor | cat_furball_frenzy, cat_hairball_gatling | 160 | damageBonus:0.5 | — |
| cat_hairball_gatling | ปืนกลก้อนขนพิษ / Gatling Vomit | keystone | cat_acid_pool_2, cat_toxin_filler, cat_hairball_gatling_asc1 | 450 | — [element: chonk_fortress] | — |
| cat_hairball_gatling_asc1 | ปืนกลก้อนขนพิษขั้นสูง / Greater Gatling Vomit | minor | cat_hairball_gatling, cat_hairball_gatling_asc2 | 160 | damageBonus:0.5 | — |
| cat_hairball_gatling_asc2 | ปืนกลก้อนขนพิษจอมพลัง / Transcendent Gatling Vomit | keystone | cat_hairball_gatling_asc1 | 590 | damageBonus:2 | — |
| cat_def_minor | หนวดเหล็กกล้า / Iron Whiskers | minor | cat_root, cat_def_minor_2, cat_taunt_minor | 55 | maxHp:10, defense:1 | — |
| cat_def_minor_2 | พุงนุ่มกันกระแทก / Padded Underbelly | minor | cat_def_minor, cattank_nine_lives | 45 | maxHp:10 | — |
| cat_taunt_minor | เสียงขู่ฟ่อ / Feline Hiss | minor | cat_root, cat_def_minor, cat_taunt_minor_2 | 50 | moveSpeed:0.5 | — |
| cat_taunt_minor_2 | ท่าทีจ่าฝูงเหมียว / Alpha Cat Presence | minor | cat_taunt_minor, cattank_aggro_taunt | 50 | moveSpeed:0.5 | — |
| cattank_nine_lives | พรแห่ง 9 ชีวิต / Nine Lives Aegis | notable | cat_def_minor_2, cat_immortal_purr, cat_spirit_filler | 360 | maxHp:30, defense:2 | cattank_nine_lives |
| cattank_aggro_taunt | เสียงคำรามเจ้าเหมียว / Royal Cat Taunt | notable | cat_taunt_minor_2, cat_zoomies, cat_regal_filler | 360 | defense:3 | cattank_aggro_taunt |
| cat_immortal_purr | เสียงกรนฟื้นฟู / Healing Purr | minor | cattank_nine_lives, cat_immortal_purr_2 | 75 | maxHp:13 | — |
| cat_immortal_purr_2 | การกรนสะท้อนพลัง / Resonant Purrfusion | minor | cat_immortal_purr, cat_colossus | 75 | maxHp:12 | — |
| cat_zoomies | วิ่งพล่านกลางดึก / Midnight Zoomies | minor | cattank_aggro_taunt, cat_zoomies_2 | 75 | moveSpeed:1 | — |
| cat_zoomies_2 | แรงส่งดุร้าย / Feral Momentum | minor | cat_zoomies, cat_colossus | 75 | moveSpeed:1 | — |
| cat_spirit_filler | เสียงสะท้อนวิญญาณพิทักษ์ / Guardian Spirit Echo | minor | cattank_nine_lives, cat_colossus | 170 | maxHp:15 | — |
| cat_regal_filler | ท่วงท่าแห่งราชา / Regal Bearing | minor | cattank_aggro_taunt, cat_colossus | 170 | defense:2 | — |
| cat_colossus | จักรพรรดิเหมียวอมตะ / Immortal Feline Colossus | keystone | cat_immortal_purr_2, cat_zoomies_2, cat_spirit_filler, cat_regal_filler, cat_colossus_asc1 | 450 | maxHp:80, defense:5 | — |
| cat_colossus_asc1 | จักรพรรดิเหมียวอมตะขั้นสูง / Greater Colossus | minor | cat_colossus, cat_colossus_asc2 | 160 | maxHp:24, defense:1.5 | — |
| cat_colossus_asc2 | จักรพรรดิเหมียวอมตะจอมพลัง / Transcendent Colossus | keystone | cat_colossus_asc1 | 590 | maxHp:80, defense:5 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → cat_titan_quake (มหาแผ่นดินไหวไททัน / Titan Earthshaker, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cattank_chonk_armor [notable] (cost 360)
               └─ cat_seismic_1 (cost 70)
                    └─ cat_seismic_2 (cost 65)
                         └─ cat_titan_quake [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cat_slam_minor_2 (cost 45)
               └─ cat_aoe_minor (cost 55)
                    └─ cat_seismic_1 (cost 70)
                         └─ cat_seismic_2 (cost 65)
                              └─ cat_titan_quake [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cat_slam_minor_2 (cost 45)
               └─ cat_aoe_minor (cost 55)
                    └─ cat_aoe_minor_2 (cost 55)
                         └─ cat_belly_flop [notable] (cost 380)
                              └─ cat_tremor_filler (cost 160)
                                   └─ cat_titan_quake [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cattank_chonk_armor [notable] (cost 360)
               └─ cat_seismic_1 (cost 70)
                    └─ cat_aoe_minor (cost 55)
                         └─ cat_aoe_minor_2 (cost 55)
                              └─ cat_belly_flop [notable] (cost 380)
                                   └─ cat_tremor_filler (cost 160)
                                        └─ cat_titan_quake [KEYSTONE] (cost 450)
```

#### → cat_titan_quake_asc2 (มหาแผ่นดินไหวไททันจอมพลัง / Transcendent Earthshaker, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cattank_chonk_armor [notable] (cost 360)
               └─ cat_seismic_1 (cost 70)
                    └─ cat_seismic_2 (cost 65)
                         └─ cat_titan_quake (cost 450)
                              └─ cat_titan_quake_asc1 (cost 160)
                                   └─ cat_titan_quake_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cat_slam_minor_2 (cost 45)
               └─ cat_aoe_minor (cost 55)
                    └─ cat_seismic_1 (cost 70)
                         └─ cat_seismic_2 (cost 65)
                              └─ cat_titan_quake (cost 450)
                                   └─ cat_titan_quake_asc1 (cost 160)
                                        └─ cat_titan_quake_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cat_slam_minor_2 (cost 45)
               └─ cat_aoe_minor (cost 55)
                    └─ cat_aoe_minor_2 (cost 55)
                         └─ cat_belly_flop [notable] (cost 380)
                              └─ cat_tremor_filler (cost 160)
                                   └─ cat_titan_quake (cost 450)
                                        └─ cat_titan_quake_asc1 (cost 160)
                                             └─ cat_titan_quake_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cat_root (cost 0)
     └─ cat_slam_minor (cost 50)
          └─ cattank_chonk_armor [notable] (cost 360)
               └─ cat_seismic_1 (cost 70)
                    └─ cat_aoe_minor (cost 55)
                         └─ cat_aoe_minor_2 (cost 55)
                              └─ cat_belly_flop [notable] (cost 380)
                                   └─ cat_tremor_filler (cost 160)
                                        └─ cat_titan_quake (cost 450)
                                             └─ cat_titan_quake_asc1 (cost 160)
                                                  └─ cat_titan_quake_asc2 [KEYSTONE] (cost 590)
```

#### → cat_hairball_gatling (ปืนกลก้อนขนพิษ / Gatling Vomit, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cattank_hairball [notable] (cost 360)
               └─ cat_acid_pool (cost 70)
                    └─ cat_acid_pool_2 (cost 65)
                         └─ cat_hairball_gatling [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cat_spit_minor_2 (cost 45)
               └─ cat_digest_minor (cost 55)
                    └─ cat_acid_pool (cost 70)
                         └─ cat_acid_pool_2 (cost 65)
                              └─ cat_hairball_gatling [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cat_spit_minor_2 (cost 45)
               └─ cat_digest_minor (cost 55)
                    └─ cat_digest_minor_2 (cost 55)
                         └─ cat_furball_frenzy [notable] (cost 380)
                              └─ cat_toxin_filler (cost 160)
                                   └─ cat_hairball_gatling [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cattank_hairball [notable] (cost 360)
               └─ cat_acid_pool (cost 70)
                    └─ cat_digest_minor (cost 55)
                         └─ cat_digest_minor_2 (cost 55)
                              └─ cat_furball_frenzy [notable] (cost 380)
                                   └─ cat_toxin_filler (cost 160)
                                        └─ cat_hairball_gatling [KEYSTONE] (cost 450)
```

#### → cat_hairball_gatling_asc2 (ปืนกลก้อนขนพิษจอมพลัง / Transcendent Gatling Vomit, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cattank_hairball [notable] (cost 360)
               └─ cat_acid_pool (cost 70)
                    └─ cat_acid_pool_2 (cost 65)
                         └─ cat_hairball_gatling (cost 450)
                              └─ cat_hairball_gatling_asc1 (cost 160)
                                   └─ cat_hairball_gatling_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cat_spit_minor_2 (cost 45)
               └─ cat_digest_minor (cost 55)
                    └─ cat_acid_pool (cost 70)
                         └─ cat_acid_pool_2 (cost 65)
                              └─ cat_hairball_gatling (cost 450)
                                   └─ cat_hairball_gatling_asc1 (cost 160)
                                        └─ cat_hairball_gatling_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cat_spit_minor_2 (cost 45)
               └─ cat_digest_minor (cost 55)
                    └─ cat_digest_minor_2 (cost 55)
                         └─ cat_furball_frenzy [notable] (cost 380)
                              └─ cat_toxin_filler (cost 160)
                                   └─ cat_hairball_gatling (cost 450)
                                        └─ cat_hairball_gatling_asc1 (cost 160)
                                             └─ cat_hairball_gatling_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cat_root (cost 0)
     └─ cat_spit_minor (cost 50)
          └─ cattank_hairball [notable] (cost 360)
               └─ cat_acid_pool (cost 70)
                    └─ cat_digest_minor (cost 55)
                         └─ cat_digest_minor_2 (cost 55)
                              └─ cat_furball_frenzy [notable] (cost 380)
                                   └─ cat_toxin_filler (cost 160)
                                        └─ cat_hairball_gatling (cost 450)
                                             └─ cat_hairball_gatling_asc1 (cost 160)
                                                  └─ cat_hairball_gatling_asc2 [KEYSTONE] (cost 590)
```

#### → cat_colossus (จักรพรรดิเหมียวอมตะ / Immortal Feline Colossus, cost 450)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_def_minor_2 (cost 45)
               └─ cattank_nine_lives [notable] (cost 360)
                    └─ cat_spirit_filler (cost 170)
                         └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_taunt_minor_2 (cost 50)
               └─ cattank_aggro_taunt [notable] (cost 360)
                    └─ cat_regal_filler (cost 170)
                         └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_taunt_minor (cost 50)
               └─ cat_taunt_minor_2 (cost 50)
                    └─ cattank_aggro_taunt [notable] (cost 360)
                         └─ cat_regal_filler (cost 170)
                              └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_def_minor_2 (cost 45)
               └─ cattank_nine_lives [notable] (cost 360)
                    └─ cat_immortal_purr (cost 75)
                         └─ cat_immortal_purr_2 (cost 75)
                              └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 5:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_def_minor (cost 55)
               └─ cat_def_minor_2 (cost 45)
                    └─ cattank_nine_lives [notable] (cost 360)
                         └─ cat_spirit_filler (cost 170)
                              └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 6:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_taunt_minor_2 (cost 50)
               └─ cattank_aggro_taunt [notable] (cost 360)
                    └─ cat_zoomies (cost 75)
                         └─ cat_zoomies_2 (cost 75)
                              └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 7:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_taunt_minor (cost 50)
               └─ cat_taunt_minor_2 (cost 50)
                    └─ cattank_aggro_taunt [notable] (cost 360)
                         └─ cat_zoomies (cost 75)
                              └─ cat_zoomies_2 (cost 75)
                                   └─ cat_colossus [KEYSTONE] (cost 450)
```

**เส้นทางที่ 8:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_def_minor (cost 55)
               └─ cat_def_minor_2 (cost 45)
                    └─ cattank_nine_lives [notable] (cost 360)
                         └─ cat_immortal_purr (cost 75)
                              └─ cat_immortal_purr_2 (cost 75)
                                   └─ cat_colossus [KEYSTONE] (cost 450)
```

#### → cat_colossus_asc2 (จักรพรรดิเหมียวอมตะจอมพลัง / Transcendent Colossus, cost 590)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_def_minor_2 (cost 45)
               └─ cattank_nine_lives [notable] (cost 360)
                    └─ cat_spirit_filler (cost 170)
                         └─ cat_colossus (cost 450)
                              └─ cat_colossus_asc1 (cost 160)
                                   └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_taunt_minor_2 (cost 50)
               └─ cattank_aggro_taunt [notable] (cost 360)
                    └─ cat_regal_filler (cost 170)
                         └─ cat_colossus (cost 450)
                              └─ cat_colossus_asc1 (cost 160)
                                   └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_taunt_minor (cost 50)
               └─ cat_taunt_minor_2 (cost 50)
                    └─ cattank_aggro_taunt [notable] (cost 360)
                         └─ cat_regal_filler (cost 170)
                              └─ cat_colossus (cost 450)
                                   └─ cat_colossus_asc1 (cost 160)
                                        └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_def_minor_2 (cost 45)
               └─ cattank_nine_lives [notable] (cost 360)
                    └─ cat_immortal_purr (cost 75)
                         └─ cat_immortal_purr_2 (cost 75)
                              └─ cat_colossus (cost 450)
                                   └─ cat_colossus_asc1 (cost 160)
                                        └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 5:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_def_minor (cost 55)
               └─ cat_def_minor_2 (cost 45)
                    └─ cattank_nine_lives [notable] (cost 360)
                         └─ cat_spirit_filler (cost 170)
                              └─ cat_colossus (cost 450)
                                   └─ cat_colossus_asc1 (cost 160)
                                        └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 6:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_taunt_minor_2 (cost 50)
               └─ cattank_aggro_taunt [notable] (cost 360)
                    └─ cat_zoomies (cost 75)
                         └─ cat_zoomies_2 (cost 75)
                              └─ cat_colossus (cost 450)
                                   └─ cat_colossus_asc1 (cost 160)
                                        └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 7:**
```
cat_root (cost 0)
     └─ cat_def_minor (cost 55)
          └─ cat_taunt_minor (cost 50)
               └─ cat_taunt_minor_2 (cost 50)
                    └─ cattank_aggro_taunt [notable] (cost 360)
                         └─ cat_zoomies (cost 75)
                              └─ cat_zoomies_2 (cost 75)
                                   └─ cat_colossus (cost 450)
                                        └─ cat_colossus_asc1 (cost 160)
                                             └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 8:**
```
cat_root (cost 0)
     └─ cat_taunt_minor (cost 50)
          └─ cat_def_minor (cost 55)
               └─ cat_def_minor_2 (cost 45)
                    └─ cattank_nine_lives [notable] (cost 360)
                         └─ cat_immortal_purr (cost 75)
                              └─ cat_immortal_purr_2 (cost 75)
                                   └─ cat_colossus (cost 450)
                                        └─ cat_colossus_asc1 (cost 160)
                                             └─ cat_colossus_asc2 [KEYSTONE] (cost 590)
```


<a id="cowboy"></a>
## Cowboy (rootId: cow_root, 40 nodes)

_title: The Desperado — Twin Peacemaker Mastery Web / มือปืนแดนเถื่อน — เว็บทักษะปืนลูกโม่คู่_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| cow_root | บาร์คาวบอยชายแดน / Frontier Saloon | root | cow_draw_minor, cow_lasso_minor, cow_bounty_minor, cow_dodge_minor | 0 | moveSpeed:1, maxHp:10 | — |
| cow_draw_minor | ไกปืนเบาพิเศษ / Hair Trigger | minor | cow_root, cow_draw_minor_2, cowboy_quick_draw | 50 | damageBonus:0.5 | — |
| cow_draw_minor_2 | กระบอกลื่นไว / Slick Cylinder | minor | cow_draw_minor, cow_lead_minor | 45 | damageBonus:0.5 | — |
| cow_lead_minor | กระสุนหัวรู / Hollow-Point Lead | minor | cow_draw_minor_2, cow_lead_minor_2, cow_fan_hammer | 55 | damageBonus:0.5 | — |
| cow_lead_minor_2 | กระสุนแกนแข็ง / Hardcast Slugs | minor | cow_lead_minor, cow_ricochet_1 | 55 | damageBonus:0.5 | — |
| cowboy_quick_draw | ปืนลูกโม่คู่ / Twin Peacemakers | notable | cow_draw_minor, cow_ricochet_1 | 360 | — [element: deadeye_pierce] | cowboy_quick_draw |
| cow_ricochet_1 | กระสุนชิ่ง / Copper Ricochet | minor | cow_lead_minor_2, cowboy_quick_draw, cow_ricochet_2 | 68 | damageBonus:1 | — |
| cow_ricochet_2 | กระสุนเด้งสองชั้น / Double Bounce | minor | cow_ricochet_1, cow_deadeye | 67 | damageBonus:1 | — |
| cow_fan_hammer | สับนกปืนรัว / Fan the Hammer | notable | cow_lead_minor, cow_fan_filler | 380 | damageBonus:2 | — |
| cow_fan_filler | นิ้วไกมั่นคง / Steady Trigger Finger | minor | cow_fan_hammer, cow_deadeye | 160 | damageBonus:1 | — |
| cow_deadeye | ตาทิพย์เที่ยงตรง / High Noon Dead Eye | keystone | cow_ricochet_2, cow_fan_filler, cow_deadeye_asc1 | 450 | — [element: deadeye_pierce] | — |
| cow_deadeye_asc1 | ตาทิพย์เที่ยงตรงขั้นสูง / Greater Dead Eye | minor | cow_deadeye, cow_deadeye_asc2 | 160 | damageBonus:0.5 | — |
| cow_deadeye_asc2 | ตาทิพย์เที่ยงตรงระดับเทพ / Transcendent Dead Eye | keystone | cow_deadeye_asc1 | 590 | damageBonus:2 | — |
| cow_lasso_minor | บ่วงเชือกหนังถัก / Braided Rawhide | minor | cow_root, cow_lasso_minor_2, cowboy_lasso_upgrade | 50 | damageBonus:0.5 | — |
| cow_lasso_minor_2 | บ่วงเชือกชุบน้ำมัน / Oiled Coil | minor | cow_lasso_minor, cow_snare_minor | 45 | damageBonus:0.5 | — |
| cow_snare_minor | ขดลวดหนาม / Barbed Wire | minor | cow_lasso_minor_2, cow_snare_minor_2, cow_hogtie | 55 | damageBonus:0.5 | — |
| cow_snare_minor_2 | หนามขึ้นสนิม / Rusty Barbs | minor | cow_snare_minor, cow_barbed_ring | 55 | damageBonus:0.5 | — |
| cowboy_lasso_upgrade | บ่วงบาศก์ตรึงวิญญาณ / Ensnaring Lasso | notable | cow_lasso_minor, cow_barbed_ring | 360 | — [element: deadeye_pierce] | cowboy_lasso_upgrade |
| cow_barbed_ring | วงล้อลวดหนาม / Barbed Whirl | minor | cow_snare_minor_2, cowboy_lasso_upgrade, cow_barbed_ring_2 | 68 | damageBonus:1 | — |
| cow_barbed_ring_2 | ขอบมีดโกน / Razor Fringe | minor | cow_barbed_ring, cow_rodeo_king | 67 | damageBonus:1 | — |
| cow_hogtie | มัดตรึงล่ามโซ่ / Hogtie Stun | notable | cow_snare_minor, cow_hogtie_filler | 380 | damageBonus:2 | — |
| cow_hogtie_filler | ปมรัดคอ / Chokehold Knot | minor | cow_hogtie, cow_rodeo_king | 170 | damageBonus:1 | — |
| cow_rodeo_king | ราชันโรเดโอ / Rodeo Dominator | keystone | cow_barbed_ring_2, cow_hogtie_filler, cow_rodeo_king_asc1 | 450 | — [element: deadeye_pierce] | — |
| cow_rodeo_king_asc1 | ราชันโรเดโอขั้นสูง / Greater Dominator | minor | cow_rodeo_king, cow_rodeo_king_asc2 | 160 | damageBonus:0.5 | — |
| cow_rodeo_king_asc2 | ราชันโรเดโอระดับเทพ / Transcendent Dominator | keystone | cow_rodeo_king_asc1 | 590 | damageBonus:2 | — |
| cow_bounty_minor | ตรานายอำเภอ / Bounty Hunter Badge | minor | cow_root, cow_bounty_minor_2, cow_dodge_minor | 50 | moveSpeed:0.5 | — |
| cow_bounty_minor_2 | ใบประกาศจับ / Wanted Poster | minor | cow_bounty_minor, cowboy_hollow_point | 50 | moveSpeed:0.5 | — |
| cow_dodge_minor | รองเท้าติดเดือย / Spur Boots | minor | cow_root, cow_bounty_minor, cow_dodge_minor_2 | 50 | moveSpeed:0.5, maxHp:5 | — |
| cow_dodge_minor_2 | เดือยรองเท้ากรุ๊งกริ๊ง / Jingling Rowels | minor | cow_dodge_minor, cowboy_tumble | 50 | moveSpeed:0.5, maxHp:5 | — |
| cowboy_hollow_point | หมายจับล่าหัว / Bounty Mark | notable | cow_bounty_minor_2, cow_gold_pouch, cow_bounty_filler | 360 | damageBonus:2 | cowboy_hollow_point |
| cowboy_tumble | ม้วนตัวหลบกระสุน / Gunslinger Tumble | notable | cow_dodge_minor_2, cow_gunslinger_stride, cow_tumble_filler | 360 | moveSpeed:2 | cowboy_tumble |
| cow_gold_pouch | ถุงวิญญาณนอกกฎหมาย / Outlaw Soul Bag | minor | cowboy_hollow_point, cow_gold_pouch_2 | 75 | pickupRadius:1, maxHp:8 | — |
| cow_gold_pouch_2 | เครื่องรางกระเป๋าอาน / Saddlebag Charm | minor | cow_gold_pouch, cow_legend_west | 75 | pickupRadius:1, maxHp:7 | — |
| cow_gunslinger_stride | ผู้พเนจรทะเลทราย / Desert Drifter | minor | cowboy_tumble, cow_gunslinger_stride_2 | 75 | moveSpeed:0.5 | — |
| cow_gunslinger_stride_2 | หนังเหนียวดั่งกระบองเพชร / Cactus-Tough Hide | minor | cow_gunslinger_stride, cow_legend_west | 75 | moveSpeed:0.5, defense:1 | — |
| cow_bounty_filler | สมุดบันทึกรองนายอำเภอ / Deputy's Ledger | minor | cowboy_hollow_point, cow_legend_west | 170 | damageBonus:1 | — |
| cow_tumble_filler | เดือยลมหายใจที่สอง / Second Wind Spurs | minor | cowboy_tumble, cow_legend_west | 170 | moveSpeed:1 | — |
| cow_legend_west | ตำนานแดนเถื่อน / Legend of the West | keystone | cow_gold_pouch_2, cow_gunslinger_stride_2, cow_bounty_filler, cow_tumble_filler, cow_legend_west_asc1 | 450 | moveSpeed:2, damageBonus:3 | — |
| cow_legend_west_asc1 | ตำนานแดนเถื่อนขั้นสูง / Greater Legend | minor | cow_legend_west, cow_legend_west_asc2 | 160 | moveSpeed:0.5, damageBonus:1 | — |
| cow_legend_west_asc2 | ตำนานแดนเถื่อนระดับเทพ / Transcendent Legend | keystone | cow_legend_west_asc1 | 590 | moveSpeed:2, damageBonus:3 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → cow_deadeye (ตาทิพย์เที่ยงตรง / High Noon Dead Eye, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cowboy_quick_draw [notable] (cost 360)
               └─ cow_ricochet_1 (cost 68)
                    └─ cow_ricochet_2 (cost 67)
                         └─ cow_deadeye [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cow_draw_minor_2 (cost 45)
               └─ cow_lead_minor (cost 55)
                    └─ cow_fan_hammer [notable] (cost 380)
                         └─ cow_fan_filler (cost 160)
                              └─ cow_deadeye [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cow_draw_minor_2 (cost 45)
               └─ cow_lead_minor (cost 55)
                    └─ cow_lead_minor_2 (cost 55)
                         └─ cow_ricochet_1 (cost 68)
                              └─ cow_ricochet_2 (cost 67)
                                   └─ cow_deadeye [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cowboy_quick_draw [notable] (cost 360)
               └─ cow_ricochet_1 (cost 68)
                    └─ cow_lead_minor_2 (cost 55)
                         └─ cow_lead_minor (cost 55)
                              └─ cow_fan_hammer [notable] (cost 380)
                                   └─ cow_fan_filler (cost 160)
                                        └─ cow_deadeye [KEYSTONE] (cost 450)
```

#### → cow_deadeye_asc2 (ตาทิพย์เที่ยงตรงระดับเทพ / Transcendent Dead Eye, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cowboy_quick_draw [notable] (cost 360)
               └─ cow_ricochet_1 (cost 68)
                    └─ cow_ricochet_2 (cost 67)
                         └─ cow_deadeye (cost 450)
                              └─ cow_deadeye_asc1 (cost 160)
                                   └─ cow_deadeye_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cow_draw_minor_2 (cost 45)
               └─ cow_lead_minor (cost 55)
                    └─ cow_fan_hammer [notable] (cost 380)
                         └─ cow_fan_filler (cost 160)
                              └─ cow_deadeye (cost 450)
                                   └─ cow_deadeye_asc1 (cost 160)
                                        └─ cow_deadeye_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cow_draw_minor_2 (cost 45)
               └─ cow_lead_minor (cost 55)
                    └─ cow_lead_minor_2 (cost 55)
                         └─ cow_ricochet_1 (cost 68)
                              └─ cow_ricochet_2 (cost 67)
                                   └─ cow_deadeye (cost 450)
                                        └─ cow_deadeye_asc1 (cost 160)
                                             └─ cow_deadeye_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cow_root (cost 0)
     └─ cow_draw_minor (cost 50)
          └─ cowboy_quick_draw [notable] (cost 360)
               └─ cow_ricochet_1 (cost 68)
                    └─ cow_lead_minor_2 (cost 55)
                         └─ cow_lead_minor (cost 55)
                              └─ cow_fan_hammer [notable] (cost 380)
                                   └─ cow_fan_filler (cost 160)
                                        └─ cow_deadeye (cost 450)
                                             └─ cow_deadeye_asc1 (cost 160)
                                                  └─ cow_deadeye_asc2 [KEYSTONE] (cost 590)
```

#### → cow_rodeo_king (ราชันโรเดโอ / Rodeo Dominator, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cowboy_lasso_upgrade [notable] (cost 360)
               └─ cow_barbed_ring (cost 68)
                    └─ cow_barbed_ring_2 (cost 67)
                         └─ cow_rodeo_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cow_lasso_minor_2 (cost 45)
               └─ cow_snare_minor (cost 55)
                    └─ cow_hogtie [notable] (cost 380)
                         └─ cow_hogtie_filler (cost 170)
                              └─ cow_rodeo_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cow_lasso_minor_2 (cost 45)
               └─ cow_snare_minor (cost 55)
                    └─ cow_snare_minor_2 (cost 55)
                         └─ cow_barbed_ring (cost 68)
                              └─ cow_barbed_ring_2 (cost 67)
                                   └─ cow_rodeo_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cowboy_lasso_upgrade [notable] (cost 360)
               └─ cow_barbed_ring (cost 68)
                    └─ cow_snare_minor_2 (cost 55)
                         └─ cow_snare_minor (cost 55)
                              └─ cow_hogtie [notable] (cost 380)
                                   └─ cow_hogtie_filler (cost 170)
                                        └─ cow_rodeo_king [KEYSTONE] (cost 450)
```

#### → cow_rodeo_king_asc2 (ราชันโรเดโอระดับเทพ / Transcendent Dominator, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cowboy_lasso_upgrade [notable] (cost 360)
               └─ cow_barbed_ring (cost 68)
                    └─ cow_barbed_ring_2 (cost 67)
                         └─ cow_rodeo_king (cost 450)
                              └─ cow_rodeo_king_asc1 (cost 160)
                                   └─ cow_rodeo_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cow_lasso_minor_2 (cost 45)
               └─ cow_snare_minor (cost 55)
                    └─ cow_hogtie [notable] (cost 380)
                         └─ cow_hogtie_filler (cost 170)
                              └─ cow_rodeo_king (cost 450)
                                   └─ cow_rodeo_king_asc1 (cost 160)
                                        └─ cow_rodeo_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cow_lasso_minor_2 (cost 45)
               └─ cow_snare_minor (cost 55)
                    └─ cow_snare_minor_2 (cost 55)
                         └─ cow_barbed_ring (cost 68)
                              └─ cow_barbed_ring_2 (cost 67)
                                   └─ cow_rodeo_king (cost 450)
                                        └─ cow_rodeo_king_asc1 (cost 160)
                                             └─ cow_rodeo_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cow_root (cost 0)
     └─ cow_lasso_minor (cost 50)
          └─ cowboy_lasso_upgrade [notable] (cost 360)
               └─ cow_barbed_ring (cost 68)
                    └─ cow_snare_minor_2 (cost 55)
                         └─ cow_snare_minor (cost 55)
                              └─ cow_hogtie [notable] (cost 380)
                                   └─ cow_hogtie_filler (cost 170)
                                        └─ cow_rodeo_king (cost 450)
                                             └─ cow_rodeo_king_asc1 (cost 160)
                                                  └─ cow_rodeo_king_asc2 [KEYSTONE] (cost 590)
```

#### → cow_legend_west (ตำนานแดนเถื่อน / Legend of the West, cost 450)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_bounty_minor_2 (cost 50)
               └─ cowboy_hollow_point [notable] (cost 360)
                    └─ cow_bounty_filler (cost 170)
                         └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_dodge_minor_2 (cost 50)
               └─ cowboy_tumble [notable] (cost 360)
                    └─ cow_tumble_filler (cost 170)
                         └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_dodge_minor (cost 50)
               └─ cow_dodge_minor_2 (cost 50)
                    └─ cowboy_tumble [notable] (cost 360)
                         └─ cow_tumble_filler (cost 170)
                              └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_bounty_minor_2 (cost 50)
               └─ cowboy_hollow_point [notable] (cost 360)
                    └─ cow_gold_pouch (cost 75)
                         └─ cow_gold_pouch_2 (cost 75)
                              └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 5:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_bounty_minor (cost 50)
               └─ cow_bounty_minor_2 (cost 50)
                    └─ cowboy_hollow_point [notable] (cost 360)
                         └─ cow_bounty_filler (cost 170)
                              └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 6:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_dodge_minor_2 (cost 50)
               └─ cowboy_tumble [notable] (cost 360)
                    └─ cow_gunslinger_stride (cost 75)
                         └─ cow_gunslinger_stride_2 (cost 75)
                              └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 7:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_dodge_minor (cost 50)
               └─ cow_dodge_minor_2 (cost 50)
                    └─ cowboy_tumble [notable] (cost 360)
                         └─ cow_gunslinger_stride (cost 75)
                              └─ cow_gunslinger_stride_2 (cost 75)
                                   └─ cow_legend_west [KEYSTONE] (cost 450)
```

**เส้นทางที่ 8:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_bounty_minor (cost 50)
               └─ cow_bounty_minor_2 (cost 50)
                    └─ cowboy_hollow_point [notable] (cost 360)
                         └─ cow_gold_pouch (cost 75)
                              └─ cow_gold_pouch_2 (cost 75)
                                   └─ cow_legend_west [KEYSTONE] (cost 450)
```

#### → cow_legend_west_asc2 (ตำนานแดนเถื่อนระดับเทพ / Transcendent Legend, cost 590)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_bounty_minor_2 (cost 50)
               └─ cowboy_hollow_point [notable] (cost 360)
                    └─ cow_bounty_filler (cost 170)
                         └─ cow_legend_west (cost 450)
                              └─ cow_legend_west_asc1 (cost 160)
                                   └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_dodge_minor_2 (cost 50)
               └─ cowboy_tumble [notable] (cost 360)
                    └─ cow_tumble_filler (cost 170)
                         └─ cow_legend_west (cost 450)
                              └─ cow_legend_west_asc1 (cost 160)
                                   └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_dodge_minor (cost 50)
               └─ cow_dodge_minor_2 (cost 50)
                    └─ cowboy_tumble [notable] (cost 360)
                         └─ cow_tumble_filler (cost 170)
                              └─ cow_legend_west (cost 450)
                                   └─ cow_legend_west_asc1 (cost 160)
                                        └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_bounty_minor_2 (cost 50)
               └─ cowboy_hollow_point [notable] (cost 360)
                    └─ cow_gold_pouch (cost 75)
                         └─ cow_gold_pouch_2 (cost 75)
                              └─ cow_legend_west (cost 450)
                                   └─ cow_legend_west_asc1 (cost 160)
                                        └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 5:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_bounty_minor (cost 50)
               └─ cow_bounty_minor_2 (cost 50)
                    └─ cowboy_hollow_point [notable] (cost 360)
                         └─ cow_bounty_filler (cost 170)
                              └─ cow_legend_west (cost 450)
                                   └─ cow_legend_west_asc1 (cost 160)
                                        └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 6:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_dodge_minor_2 (cost 50)
               └─ cowboy_tumble [notable] (cost 360)
                    └─ cow_gunslinger_stride (cost 75)
                         └─ cow_gunslinger_stride_2 (cost 75)
                              └─ cow_legend_west (cost 450)
                                   └─ cow_legend_west_asc1 (cost 160)
                                        └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 7:**
```
cow_root (cost 0)
     └─ cow_bounty_minor (cost 50)
          └─ cow_dodge_minor (cost 50)
               └─ cow_dodge_minor_2 (cost 50)
                    └─ cowboy_tumble [notable] (cost 360)
                         └─ cow_gunslinger_stride (cost 75)
                              └─ cow_gunslinger_stride_2 (cost 75)
                                   └─ cow_legend_west (cost 450)
                                        └─ cow_legend_west_asc1 (cost 160)
                                             └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 8:**
```
cow_root (cost 0)
     └─ cow_dodge_minor (cost 50)
          └─ cow_bounty_minor (cost 50)
               └─ cow_bounty_minor_2 (cost 50)
                    └─ cowboy_hollow_point [notable] (cost 360)
                         └─ cow_gold_pouch (cost 75)
                              └─ cow_gold_pouch_2 (cost 75)
                                   └─ cow_legend_west (cost 450)
                                        └─ cow_legend_west_asc1 (cost 160)
                                             └─ cow_legend_west_asc2 [KEYSTONE] (cost 590)
```


<a id="celestial-mecha"></a>
## Celestial Mecha (rootId: mecha_root, 40 nodes)

_title: The GN Vanguard — Orbital Plasma Mastery Web / ปีกแสงแห่งอนาคต — เว็บทักษะพลาสมาวงโคจร_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| mecha_root | โรงเก็บยานอวกาศ / Orbital Hangar | root | mecha_drive_minor, mecha_cannon_minor, mecha_shield_minor, mecha_thruster_minor | 0 | defense:1, moveSpeed:1 | — |
| mecha_drive_minor | เตาปฏิกรณ์ GN / GN Drive Core | minor | mecha_root, mecha_drive_core | 50 | damageBonus:0.5 | — |
| mecha_drive_core | แกนควบแน่น GN / GN Condenser Core | minor | mecha_drive_minor, mecha_flow_minor, mecha_saber_overdrive | 45 | damageBonus:0.5 | — |
| mecha_flow_minor | ท่อส่งพลาสมา / Plasma Conduit | minor | mecha_drive_core, mecha_arc_conduit, mecha_plasma_edge | 55 | damageBonus:0.5 | — |
| mecha_arc_conduit | ท่อปล่อยกระแสอาร์ค / Arc Discharge Conduit | minor | mecha_flow_minor, mecha_twin_cleave | 55 | damageBonus:0.5 | — |
| mecha_saber_overdrive | เร่งพลังดาบแสง / GN Saber Overdrive | notable | mecha_drive_core, mecha_plasma_edge | 360 | — [element: celestial_plasma] | mecha_saber_overdrive |
| mecha_plasma_edge | คมมีดความร้อนสูง / Thermal Edge | minor | mecha_flow_minor, mecha_saber_overdrive, mecha_plasma_core | 68 | damageBonus:1 | — |
| mecha_plasma_core | แกนความร้อนสูงยิ่ง / Superheated Core | minor | mecha_plasma_edge, mecha_trans_am | 67 | damageBonus:1 | — |
| mecha_twin_cleave | ท่าฟันดาบคู่กากบาท / Dual Saber X-Slash | notable | mecha_arc_conduit, mecha_cleave_capacitor | 380 | — [element: celestial_plasma] | — |
| mecha_cleave_capacitor | แบตเตอรี่ตัวเก็บประจุฟัน / Cleave Capacitor Bank | minor | mecha_twin_cleave, mecha_trans_am | 165 | damageBonus:1 | — |
| mecha_trans_am | ทรานซัมฟันไร้เงา / Trans-Am Omnislash | keystone | mecha_plasma_core, mecha_cleave_capacitor, mecha_trans_am_asc1 | 450 | — [element: celestial_plasma] | — |
| mecha_trans_am_asc1 | ทรานซัมฟันไร้เงาขั้นสูง / Greater Omnislash | minor | mecha_trans_am, mecha_trans_am_asc2 | 160 | moveSpeed:0.5 | — |
| mecha_trans_am_asc2 | ทรานซัมฟันไร้เงาระดับเทพ / Transcendent Omnislash | keystone | mecha_trans_am_asc1 | 590 | moveSpeed:1 | — |
| mecha_cannon_minor | แบตเตอรี่พลาสมา / Capacitor Banks | minor | mecha_root, mecha_cannon_core | 50 | damageBonus:0.5 | — |
| mecha_cannon_core | แกนฉีดพลาสมา / Plasma Injector Core | minor | mecha_cannon_minor, mecha_lens_minor, mecha_laser_salvo | 45 | damageBonus:0.5 | — |
| mecha_lens_minor | คริสตัลรวมแสง / Focusing Crystals | minor | mecha_cannon_core, mecha_lens_prism, mecha_array_1 | 55 | damageBonus:0.5 | — |
| mecha_lens_prism | ปริซึมหักเหแสง / Prism Refractor | minor | mecha_lens_minor, mecha_hyper_beam | 55 | damageBonus:0.5 | — |
| mecha_laser_salvo | ระดมยิงปีกเลเซอร์ / Wing Laser Salvo | notable | mecha_cannon_core, mecha_array_1 | 360 | — [element: celestial_plasma] | mecha_laser_salvo |
| mecha_array_1 | แถบกระจายลำแสง / Collimator Array | minor | mecha_lens_minor, mecha_laser_salvo, mecha_array_core | 68 | damageBonus:1 | — |
| mecha_array_core | แกนรวมลำแสง / Beam Collimator Core | minor | mecha_array_1, mecha_full_burst | 67 | damageBonus:1 | — |
| mecha_hyper_beam | ปืนใหญ่ไฮเปอร์เมก้า / Hyper Mega Launcher | notable | mecha_lens_prism, mecha_beam_stabilizer | 380 | — [element: celestial_plasma] | — |
| mecha_beam_stabilizer | คอยล์เสถียรอนุภาค / Particle Stabilizer Coil | minor | mecha_hyper_beam, mecha_full_burst | 165 | damageBonus:1 | — |
| mecha_full_burst | ฟูลเบิร์สทำลายล้าง / Full Burst Calamity | keystone | mecha_array_core, mecha_beam_stabilizer, mecha_full_burst_asc1 | 450 | — [element: celestial_plasma] | — |
| mecha_full_burst_asc1 | ฟูลเบิร์สทำลายล้างขั้นสูง / Greater Burst Calamity | minor | mecha_full_burst, mecha_full_burst_asc2 | 160 | damageBonus:0.5 | — |
| mecha_full_burst_asc2 | ฟูลเบิร์สทำลายล้างระดับเทพ / Transcendent Burst Calamity | keystone | mecha_full_burst_asc1 | 590 | damageBonus:2 | — |
| mecha_shield_minor | เคลือบผิวอนุภาค / Particle Coating | minor | mecha_root, mecha_shield_layer, mecha_thruster_minor | 50 | maxHp:10, defense:0.5 | — |
| mecha_shield_layer | ชั้นเกราะปฏิกิริยา / Reactive Plating Layer | minor | mecha_shield_minor, mecha_gn_barrier | 50 | maxHp:10, defense:0.5 | — |
| mecha_thruster_minor | ไอออนเวอร์เนียร์ / Ion Verniers | minor | mecha_root, mecha_shield_minor, mecha_thruster_vernier | 50 | moveSpeed:0.5 | — |
| mecha_thruster_vernier | แถวเครื่องยนต์เวอร์เนียร์ / Vernier Thruster Array | minor | mecha_thruster_minor, mecha_thruster | 50 | moveSpeed:0.5 | — |
| mecha_gn_barrier | บาเรียสนามพลัง GN / GN Forcefield | notable | mecha_shield_layer, mecha_fortress, mecha_barrier_conduit | 360 | defense:2, maxHp:20 | mecha_gn_barrier |
| mecha_thruster | ไอพ่นขับดัน / Afterburner Boosters | notable | mecha_thruster_vernier, mecha_warp_dash, mecha_thrust_manifold | 360 | moveSpeed:2 | mecha_thruster |
| mecha_fortress | โล่พลาสมาบริสุทธิ์ / Plasma Aegis | minor | mecha_gn_barrier, mecha_fortress_core | 75 | maxHp:15, defense:1 | — |
| mecha_fortress_core | โครงแกนโล่พิทักษ์ / Aegis Core Lattice | minor | mecha_fortress, mecha_gundam_core | 75 | maxHp:15, defense:1 | — |
| mecha_warp_dash | พุ่งวาร์ปควอนตัม / Quantum Warp Dash | minor | mecha_thruster, mecha_warp_core | 75 | moveSpeed:0.5 | — |
| mecha_warp_core | แกนเฟสควอนตัม / Quantum Phase Core | minor | mecha_warp_dash, mecha_gundam_core | 75 | moveSpeed:0.5 | — |
| mecha_barrier_conduit | ท่อสั่นพ้องเกราะพลัง / Barrier Resonance Conduit | minor | mecha_gn_barrier, mecha_gundam_core | 170 | defense:1 | — |
| mecha_thrust_manifold | ท่อร่วมแรงขับเกินพิกัด / Thrust Manifold Overcharge | minor | mecha_thruster, mecha_gundam_core | 170 | moveSpeed:0.5 | — |
| mecha_gundam_core | จ้าวแห่งอวกาศขั้นสูงสุด / Celestial Dominator | keystone | mecha_fortress_core, mecha_warp_core, mecha_barrier_conduit, mecha_thrust_manifold, mecha_gundam_core_asc1 | 450 | maxHp:60, defense:3, moveSpeed:2 | — |
| mecha_gundam_core_asc1 | จ้าวแห่งอวกาศขั้นสูง / Greater Dominator | minor | mecha_gundam_core, mecha_gundam_core_asc2 | 160 | maxHp:18, defense:1, moveSpeed:0.5 | — |
| mecha_gundam_core_asc2 | จ้าวแห่งอวกาศระดับเทพ / Transcendent Dominator | keystone | mecha_gundam_core_asc1 | 590 | maxHp:60, defense:3, moveSpeed:2 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → mecha_trans_am (ทรานซัมฟันไร้เงา / Trans-Am Omnislash, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_saber_overdrive [notable] (cost 360)
                    └─ mecha_plasma_edge (cost 68)
                         └─ mecha_plasma_core (cost 67)
                              └─ mecha_trans_am [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_flow_minor (cost 55)
                    └─ mecha_plasma_edge (cost 68)
                         └─ mecha_plasma_core (cost 67)
                              └─ mecha_trans_am [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_flow_minor (cost 55)
                    └─ mecha_arc_conduit (cost 55)
                         └─ mecha_twin_cleave [notable] (cost 380)
                              └─ mecha_cleave_capacitor (cost 165)
                                   └─ mecha_trans_am [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_saber_overdrive [notable] (cost 360)
                    └─ mecha_plasma_edge (cost 68)
                         └─ mecha_flow_minor (cost 55)
                              └─ mecha_arc_conduit (cost 55)
                                   └─ mecha_twin_cleave [notable] (cost 380)
                                        └─ mecha_cleave_capacitor (cost 165)
                                             └─ mecha_trans_am [KEYSTONE] (cost 450)
```

#### → mecha_trans_am_asc2 (ทรานซัมฟันไร้เงาระดับเทพ / Transcendent Omnislash, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_saber_overdrive [notable] (cost 360)
                    └─ mecha_plasma_edge (cost 68)
                         └─ mecha_plasma_core (cost 67)
                              └─ mecha_trans_am (cost 450)
                                   └─ mecha_trans_am_asc1 (cost 160)
                                        └─ mecha_trans_am_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_flow_minor (cost 55)
                    └─ mecha_plasma_edge (cost 68)
                         └─ mecha_plasma_core (cost 67)
                              └─ mecha_trans_am (cost 450)
                                   └─ mecha_trans_am_asc1 (cost 160)
                                        └─ mecha_trans_am_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_flow_minor (cost 55)
                    └─ mecha_arc_conduit (cost 55)
                         └─ mecha_twin_cleave [notable] (cost 380)
                              └─ mecha_cleave_capacitor (cost 165)
                                   └─ mecha_trans_am (cost 450)
                                        └─ mecha_trans_am_asc1 (cost 160)
                                             └─ mecha_trans_am_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
mecha_root (cost 0)
     └─ mecha_drive_minor (cost 50)
          └─ mecha_drive_core (cost 45)
               └─ mecha_saber_overdrive [notable] (cost 360)
                    └─ mecha_plasma_edge (cost 68)
                         └─ mecha_flow_minor (cost 55)
                              └─ mecha_arc_conduit (cost 55)
                                   └─ mecha_twin_cleave [notable] (cost 380)
                                        └─ mecha_cleave_capacitor (cost 165)
                                             └─ mecha_trans_am (cost 450)
                                                  └─ mecha_trans_am_asc1 (cost 160)
                                                       └─ mecha_trans_am_asc2 [KEYSTONE] (cost 590)
```

#### → mecha_full_burst (ฟูลเบิร์สทำลายล้าง / Full Burst Calamity, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_laser_salvo [notable] (cost 360)
                    └─ mecha_array_1 (cost 68)
                         └─ mecha_array_core (cost 67)
                              └─ mecha_full_burst [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_lens_minor (cost 55)
                    └─ mecha_array_1 (cost 68)
                         └─ mecha_array_core (cost 67)
                              └─ mecha_full_burst [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_lens_minor (cost 55)
                    └─ mecha_lens_prism (cost 55)
                         └─ mecha_hyper_beam [notable] (cost 380)
                              └─ mecha_beam_stabilizer (cost 165)
                                   └─ mecha_full_burst [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_laser_salvo [notable] (cost 360)
                    └─ mecha_array_1 (cost 68)
                         └─ mecha_lens_minor (cost 55)
                              └─ mecha_lens_prism (cost 55)
                                   └─ mecha_hyper_beam [notable] (cost 380)
                                        └─ mecha_beam_stabilizer (cost 165)
                                             └─ mecha_full_burst [KEYSTONE] (cost 450)
```

#### → mecha_full_burst_asc2 (ฟูลเบิร์สทำลายล้างระดับเทพ / Transcendent Burst Calamity, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_laser_salvo [notable] (cost 360)
                    └─ mecha_array_1 (cost 68)
                         └─ mecha_array_core (cost 67)
                              └─ mecha_full_burst (cost 450)
                                   └─ mecha_full_burst_asc1 (cost 160)
                                        └─ mecha_full_burst_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_lens_minor (cost 55)
                    └─ mecha_array_1 (cost 68)
                         └─ mecha_array_core (cost 67)
                              └─ mecha_full_burst (cost 450)
                                   └─ mecha_full_burst_asc1 (cost 160)
                                        └─ mecha_full_burst_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_lens_minor (cost 55)
                    └─ mecha_lens_prism (cost 55)
                         └─ mecha_hyper_beam [notable] (cost 380)
                              └─ mecha_beam_stabilizer (cost 165)
                                   └─ mecha_full_burst (cost 450)
                                        └─ mecha_full_burst_asc1 (cost 160)
                                             └─ mecha_full_burst_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
mecha_root (cost 0)
     └─ mecha_cannon_minor (cost 50)
          └─ mecha_cannon_core (cost 45)
               └─ mecha_laser_salvo [notable] (cost 360)
                    └─ mecha_array_1 (cost 68)
                         └─ mecha_lens_minor (cost 55)
                              └─ mecha_lens_prism (cost 55)
                                   └─ mecha_hyper_beam [notable] (cost 380)
                                        └─ mecha_beam_stabilizer (cost 165)
                                             └─ mecha_full_burst (cost 450)
                                                  └─ mecha_full_burst_asc1 (cost 160)
                                                       └─ mecha_full_burst_asc2 [KEYSTONE] (cost 590)
```

#### → mecha_gundam_core (จ้าวแห่งอวกาศขั้นสูงสุด / Celestial Dominator, cost 450)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_shield_layer (cost 50)
               └─ mecha_gn_barrier [notable] (cost 360)
                    └─ mecha_barrier_conduit (cost 170)
                         └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_thruster_vernier (cost 50)
               └─ mecha_thruster [notable] (cost 360)
                    └─ mecha_thrust_manifold (cost 170)
                         └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_shield_layer (cost 50)
               └─ mecha_gn_barrier [notable] (cost 360)
                    └─ mecha_fortress (cost 75)
                         └─ mecha_fortress_core (cost 75)
                              └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_thruster_minor (cost 50)
               └─ mecha_thruster_vernier (cost 50)
                    └─ mecha_thruster [notable] (cost 360)
                         └─ mecha_thrust_manifold (cost 170)
                              └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 5:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_shield_minor (cost 50)
               └─ mecha_shield_layer (cost 50)
                    └─ mecha_gn_barrier [notable] (cost 360)
                         └─ mecha_barrier_conduit (cost 170)
                              └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 6:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_thruster_vernier (cost 50)
               └─ mecha_thruster [notable] (cost 360)
                    └─ mecha_warp_dash (cost 75)
                         └─ mecha_warp_core (cost 75)
                              └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 7:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_thruster_minor (cost 50)
               └─ mecha_thruster_vernier (cost 50)
                    └─ mecha_thruster [notable] (cost 360)
                         └─ mecha_warp_dash (cost 75)
                              └─ mecha_warp_core (cost 75)
                                   └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

**เส้นทางที่ 8:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_shield_minor (cost 50)
               └─ mecha_shield_layer (cost 50)
                    └─ mecha_gn_barrier [notable] (cost 360)
                         └─ mecha_fortress (cost 75)
                              └─ mecha_fortress_core (cost 75)
                                   └─ mecha_gundam_core [KEYSTONE] (cost 450)
```

#### → mecha_gundam_core_asc2 (จ้าวแห่งอวกาศระดับเทพ / Transcendent Dominator, cost 590)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_shield_layer (cost 50)
               └─ mecha_gn_barrier [notable] (cost 360)
                    └─ mecha_barrier_conduit (cost 170)
                         └─ mecha_gundam_core (cost 450)
                              └─ mecha_gundam_core_asc1 (cost 160)
                                   └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_thruster_vernier (cost 50)
               └─ mecha_thruster [notable] (cost 360)
                    └─ mecha_thrust_manifold (cost 170)
                         └─ mecha_gundam_core (cost 450)
                              └─ mecha_gundam_core_asc1 (cost 160)
                                   └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_shield_layer (cost 50)
               └─ mecha_gn_barrier [notable] (cost 360)
                    └─ mecha_fortress (cost 75)
                         └─ mecha_fortress_core (cost 75)
                              └─ mecha_gundam_core (cost 450)
                                   └─ mecha_gundam_core_asc1 (cost 160)
                                        └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_thruster_minor (cost 50)
               └─ mecha_thruster_vernier (cost 50)
                    └─ mecha_thruster [notable] (cost 360)
                         └─ mecha_thrust_manifold (cost 170)
                              └─ mecha_gundam_core (cost 450)
                                   └─ mecha_gundam_core_asc1 (cost 160)
                                        └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 5:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_shield_minor (cost 50)
               └─ mecha_shield_layer (cost 50)
                    └─ mecha_gn_barrier [notable] (cost 360)
                         └─ mecha_barrier_conduit (cost 170)
                              └─ mecha_gundam_core (cost 450)
                                   └─ mecha_gundam_core_asc1 (cost 160)
                                        └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 6:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_thruster_vernier (cost 50)
               └─ mecha_thruster [notable] (cost 360)
                    └─ mecha_warp_dash (cost 75)
                         └─ mecha_warp_core (cost 75)
                              └─ mecha_gundam_core (cost 450)
                                   └─ mecha_gundam_core_asc1 (cost 160)
                                        └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 7:**
```
mecha_root (cost 0)
     └─ mecha_shield_minor (cost 50)
          └─ mecha_thruster_minor (cost 50)
               └─ mecha_thruster_vernier (cost 50)
                    └─ mecha_thruster [notable] (cost 360)
                         └─ mecha_warp_dash (cost 75)
                              └─ mecha_warp_core (cost 75)
                                   └─ mecha_gundam_core (cost 450)
                                        └─ mecha_gundam_core_asc1 (cost 160)
                                             └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 8:**
```
mecha_root (cost 0)
     └─ mecha_thruster_minor (cost 50)
          └─ mecha_shield_minor (cost 50)
               └─ mecha_shield_layer (cost 50)
                    └─ mecha_gn_barrier [notable] (cost 360)
                         └─ mecha_fortress (cost 75)
                              └─ mecha_fortress_core (cost 75)
                                   └─ mecha_gundam_core (cost 450)
                                        └─ mecha_gundam_core_asc1 (cost 160)
                                             └─ mecha_gundam_core_asc2 [KEYSTONE] (cost 590)
```


<a id="gambler"></a>
## Gambler (rootId: gam_root, 38 nodes)

_title: The High Roller — Fortune Deck Mastery Web / เจ้ามือไพ่ไร้พ่าย — เว็บทักษะไพ่แห่งโชคชะตา_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| gam_root | คาสิโนทองคำ / Golden Casino Core | root | gam_card_minor, gam_dice_minor, gam_greed_minor, gam_luck_minor | 0 | damageBonus:1, moveSpeed:1 | — |
| gam_card_minor | ขอบไพ่คมกริบ / Razor Card Edge | minor | gam_root, gam_card_minor_2, gambler_royal_flush | 50 | damageBonus:0.5 | — |
| gam_card_minor_2 | สำรับไพ่ลับคม / Whetted Deck | minor | gam_card_minor, gam_spread_minor | 45 | damageBonus:0.5 | — |
| gam_spread_minor | กรีดไพ่รูปพัด / Card Fan Spread | minor | gam_card_minor_2, gam_spread_minor_2, gam_wild_joker | 55 | damageBonus:0.5 | — |
| gam_spread_minor_2 | พัดไพ่เต็มมือ / Full Fan Mastery | minor | gam_spread_minor, gam_ace_spades | 55 | damageBonus:0.5 | — |
| gambler_royal_flush | ไพ่รอยัลฟลัช / Royal Flush Cascade | notable | gam_card_minor, gam_ace_spades | 360 | — [element: lucky_arcane] | gambler_royal_flush |
| gam_ace_spades | เอซโพดำมรณะ / Ace of Spades | minor | gam_spread_minor_2, gambler_royal_flush, gam_ace_spades_2 | 68 | damageBonus:1 | — |
| gam_ace_spades_2 | เอซฝังเศษระเบิด / Shard-Forged Ace | minor | gam_ace_spades, gam_royal_cascade | 67 | damageBonus:1 | — |
| gam_wild_joker | ไพ่โจ๊กเกอร์หลอน / Wild Joker Shuffle | notable | gam_spread_minor, gam_joker_filler | 380 | — [element: lucky_arcane] | — |
| gam_joker_filler | เดิมพันโจ๊กเกอร์ / Joker's Ante | minor | gam_wild_joker, gam_royal_cascade | 160 | damageBonus:0.5 | — |
| gam_royal_cascade | จอมบงการชะตา / Dealer of Destiny | keystone | gam_ace_spades_2, gam_joker_filler, gam_royal_cascade_asc1 | 450 | — [element: lucky_arcane] | — |
| gam_royal_cascade_asc1 | จอมบงการชะตาขั้นสูง / Greater Destiny | minor | gam_royal_cascade, gam_royal_cascade_asc2 | 160 | damageBonus:0.5 | — |
| gam_royal_cascade_asc2 | จอมบงการชะตาระดับเทพ / Transcendent Destiny | keystone | gam_royal_cascade_asc1 | 590 | damageBonus:2 | — |
| gam_dice_minor | ลูกเต๋าถ่วงน้ำหนัก / Weighted Die | minor | gam_root, gam_dice_minor_2, gambler_loaded_dice | 50 | damageBonus:0.5 | — |
| gam_dice_minor_2 | ขอบเต๋าเสริมแกร่ง / Reinforced Dice Rim | minor | gam_dice_minor, gam_high_roller_crit | 45 | damageBonus:0.5 | — |
| gam_high_roller_crit | สตรีคคริติคอล / Critical Streak | minor | gam_dice_minor_2, gam_high_roller_crit_2, gambler_jackpot | 55 | damageBonus:0.5 | — |
| gam_high_roller_crit_2 | ตัวคูณสายชนะ / Streak Multiplier | minor | gam_high_roller_crit, gam_golden_roll | 55 | damageBonus:0.5 | — |
| gambler_loaded_dice | ทอยเต๋านำโชค / Loaded Dice Throw | notable | gam_dice_minor, gam_golden_roll | 360 | — [element: lucky_arcane] | gambler_loaded_dice |
| gam_golden_roll | เต๋าหกนำโชค / Golden Sixes | minor | gam_high_roller_crit_2, gambler_loaded_dice, gam_golden_roll_2 | 68 | damageBonus:1 | — |
| gam_golden_roll_2 | เลขหกลุกโชน / Blazing Sixes | minor | gam_golden_roll, gambler_jackpot | 67 | damageBonus:1 | — |
| gambler_jackpot | แจ็กพอตแตก 777 / Jackpot 777 Frenzy | keystone | gam_high_roller_crit, gam_golden_roll_2, gambler_jackpot_asc1 | 450 | — [element: lucky_arcane] | gambler_jackpot |
| gambler_jackpot_asc1 | แจ็กพอตแตก 777 ขั้นสูง / Greater Jackpot Frenzy | minor | gambler_jackpot, gambler_jackpot_asc2 | 160 | pickupRadius:0.5 | — |
| gambler_jackpot_asc2 | แจ็กพอตแตก 777 ระดับเทพ / Transcendent Jackpot Frenzy | keystone | gambler_jackpot_asc1 | 590 | pickupRadius:1 | — |
| gam_greed_minor | ชิปเดิมพันทองคำ / Golden Ante | minor | gam_root, gam_greed_minor_2, gam_luck_minor | 50 | maxHp:8 | — |
| gam_greed_minor_2 | เบาะรองโชคลาภ / Fortune's Cushion | minor | gam_greed_minor, gambler_fortune_greed | 50 | maxHp:7 | — |
| gam_luck_minor | พรแห่งเทพีนำโชค / Lady Luck Favor | minor | gam_root, gam_greed_minor, gam_luck_minor_2 | 50 | moveSpeed:0.5, pickupRadius:0.5 | — |
| gam_luck_minor_2 | เกือกม้านำโชค / Charmed Horseshoe | minor | gam_luck_minor, gam_coin_storm | 50 | moveSpeed:0.5, pickupRadius:0.5 | — |
| gambler_fortune_greed | แม่เหล็กนักเสี่ยงโชค / High Roller Magnetism | notable | gam_greed_minor_2, gam_fortune_filler, gam_vault_ante | 360 | pickupRadius:2 | gambler_fortune_greed |
| gam_fortune_filler | ไมตรีเจ้ามือ / Croupier's Favor | minor | gambler_fortune_greed, gam_casino_king | 170 | pickupRadius:0.5 | — |
| gam_coin_storm | สะเก็ดเหรียญวิญญาณ / Golden Shrapnel | notable | gam_luck_minor_2, gam_coinstorm_filler, gam_all_in | 360 | damageBonus:2 | — |
| gam_coinstorm_filler | สายเหรียญกระเซ็น / Coin Cascade | minor | gam_coin_storm, gam_casino_king | 165 | damageBonus:0.5 | — |
| gam_vault_ante | ประกันภัยคาสิโน / Vault Insurance | minor | gambler_fortune_greed, gam_vault_ante_2 | 75 | maxHp:13 | — |
| gam_vault_ante_2 | เงินสำรองประกันภัย / Insured Reserves | minor | gam_vault_ante, gam_casino_king | 75 | maxHp:12 | — |
| gam_all_in | สองเท่าหรือศูนย์ / Double or Nothing | minor | gam_coin_storm, gam_all_in_2 | 75 | moveSpeed:0.5, damageBonus:1 | — |
| gam_all_in_2 | พลิกโต๊ะเดิมพัน / Table-Flip Gambit | minor | gam_all_in, gam_casino_king | 75 | moveSpeed:0.5, damageBonus:1 | — |
| gam_casino_king | ราชาแห่งเวกัส / Vegas Casino King | keystone | gam_fortune_filler, gam_coinstorm_filler, gam_vault_ante_2, gam_all_in_2, gam_casino_king_asc1 | 450 | maxHp:50, moveSpeed:2, damageBonus:3 | — |
| gam_casino_king_asc1 | ราชาแห่งเวกัสขั้นสูง / Greater Casino King | minor | gam_casino_king, gam_casino_king_asc2 | 160 | maxHp:15, moveSpeed:0.5, damageBonus:1 | — |
| gam_casino_king_asc2 | ราชาแห่งเวกัสระดับเทพ / Transcendent Casino King | keystone | gam_casino_king_asc1 | 590 | maxHp:50, moveSpeed:2, damageBonus:3 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → gam_royal_cascade (จอมบงการชะตา / Dealer of Destiny, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gambler_royal_flush [notable] (cost 360)
               └─ gam_ace_spades (cost 68)
                    └─ gam_ace_spades_2 (cost 67)
                         └─ gam_royal_cascade [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gam_card_minor_2 (cost 45)
               └─ gam_spread_minor (cost 55)
                    └─ gam_wild_joker [notable] (cost 380)
                         └─ gam_joker_filler (cost 160)
                              └─ gam_royal_cascade [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gam_card_minor_2 (cost 45)
               └─ gam_spread_minor (cost 55)
                    └─ gam_spread_minor_2 (cost 55)
                         └─ gam_ace_spades (cost 68)
                              └─ gam_ace_spades_2 (cost 67)
                                   └─ gam_royal_cascade [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gambler_royal_flush [notable] (cost 360)
               └─ gam_ace_spades (cost 68)
                    └─ gam_spread_minor_2 (cost 55)
                         └─ gam_spread_minor (cost 55)
                              └─ gam_wild_joker [notable] (cost 380)
                                   └─ gam_joker_filler (cost 160)
                                        └─ gam_royal_cascade [KEYSTONE] (cost 450)
```

#### → gam_royal_cascade_asc2 (จอมบงการชะตาระดับเทพ / Transcendent Destiny, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gambler_royal_flush [notable] (cost 360)
               └─ gam_ace_spades (cost 68)
                    └─ gam_ace_spades_2 (cost 67)
                         └─ gam_royal_cascade (cost 450)
                              └─ gam_royal_cascade_asc1 (cost 160)
                                   └─ gam_royal_cascade_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gam_card_minor_2 (cost 45)
               └─ gam_spread_minor (cost 55)
                    └─ gam_wild_joker [notable] (cost 380)
                         └─ gam_joker_filler (cost 160)
                              └─ gam_royal_cascade (cost 450)
                                   └─ gam_royal_cascade_asc1 (cost 160)
                                        └─ gam_royal_cascade_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gam_card_minor_2 (cost 45)
               └─ gam_spread_minor (cost 55)
                    └─ gam_spread_minor_2 (cost 55)
                         └─ gam_ace_spades (cost 68)
                              └─ gam_ace_spades_2 (cost 67)
                                   └─ gam_royal_cascade (cost 450)
                                        └─ gam_royal_cascade_asc1 (cost 160)
                                             └─ gam_royal_cascade_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
gam_root (cost 0)
     └─ gam_card_minor (cost 50)
          └─ gambler_royal_flush [notable] (cost 360)
               └─ gam_ace_spades (cost 68)
                    └─ gam_spread_minor_2 (cost 55)
                         └─ gam_spread_minor (cost 55)
                              └─ gam_wild_joker [notable] (cost 380)
                                   └─ gam_joker_filler (cost 160)
                                        └─ gam_royal_cascade (cost 450)
                                             └─ gam_royal_cascade_asc1 (cost 160)
                                                  └─ gam_royal_cascade_asc2 [KEYSTONE] (cost 590)
```

#### → gambler_jackpot (แจ็กพอตแตก 777 / Jackpot 777 Frenzy, cost 450)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gam_dice_minor_2 (cost 45)
               └─ gam_high_roller_crit (cost 55)
                    └─ gambler_jackpot [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gambler_loaded_dice [notable] (cost 360)
               └─ gam_golden_roll (cost 68)
                    └─ gam_golden_roll_2 (cost 67)
                         └─ gambler_jackpot [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gambler_loaded_dice [notable] (cost 360)
               └─ gam_golden_roll (cost 68)
                    └─ gam_high_roller_crit_2 (cost 55)
                         └─ gam_high_roller_crit (cost 55)
                              └─ gambler_jackpot [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gam_dice_minor_2 (cost 45)
               └─ gam_high_roller_crit (cost 55)
                    └─ gam_high_roller_crit_2 (cost 55)
                         └─ gam_golden_roll (cost 68)
                              └─ gam_golden_roll_2 (cost 67)
                                   └─ gambler_jackpot [KEYSTONE] (cost 450)
```

#### → gambler_jackpot_asc2 (แจ็กพอตแตก 777 ระดับเทพ / Transcendent Jackpot Frenzy, cost 590)

_พบ 4 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gam_dice_minor_2 (cost 45)
               └─ gam_high_roller_crit (cost 55)
                    └─ gambler_jackpot (cost 450)
                         └─ gambler_jackpot_asc1 (cost 160)
                              └─ gambler_jackpot_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gambler_loaded_dice [notable] (cost 360)
               └─ gam_golden_roll (cost 68)
                    └─ gam_golden_roll_2 (cost 67)
                         └─ gambler_jackpot (cost 450)
                              └─ gambler_jackpot_asc1 (cost 160)
                                   └─ gambler_jackpot_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gambler_loaded_dice [notable] (cost 360)
               └─ gam_golden_roll (cost 68)
                    └─ gam_high_roller_crit_2 (cost 55)
                         └─ gam_high_roller_crit (cost 55)
                              └─ gambler_jackpot (cost 450)
                                   └─ gambler_jackpot_asc1 (cost 160)
                                        └─ gambler_jackpot_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
gam_root (cost 0)
     └─ gam_dice_minor (cost 50)
          └─ gam_dice_minor_2 (cost 45)
               └─ gam_high_roller_crit (cost 55)
                    └─ gam_high_roller_crit_2 (cost 55)
                         └─ gam_golden_roll (cost 68)
                              └─ gam_golden_roll_2 (cost 67)
                                   └─ gambler_jackpot (cost 450)
                                        └─ gambler_jackpot_asc1 (cost 160)
                                             └─ gambler_jackpot_asc2 [KEYSTONE] (cost 590)
```

#### → gam_casino_king (ราชาแห่งเวกัส / Vegas Casino King, cost 450)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_greed_minor_2 (cost 50)
               └─ gambler_fortune_greed [notable] (cost 360)
                    └─ gam_fortune_filler (cost 170)
                         └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 2:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_luck_minor_2 (cost 50)
               └─ gam_coin_storm [notable] (cost 360)
                    └─ gam_coinstorm_filler (cost 165)
                         └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 3:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_luck_minor (cost 50)
               └─ gam_luck_minor_2 (cost 50)
                    └─ gam_coin_storm [notable] (cost 360)
                         └─ gam_coinstorm_filler (cost 165)
                              └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 4:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_greed_minor_2 (cost 50)
               └─ gambler_fortune_greed [notable] (cost 360)
                    └─ gam_vault_ante (cost 75)
                         └─ gam_vault_ante_2 (cost 75)
                              └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 5:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_greed_minor (cost 50)
               └─ gam_greed_minor_2 (cost 50)
                    └─ gambler_fortune_greed [notable] (cost 360)
                         └─ gam_fortune_filler (cost 170)
                              └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 6:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_luck_minor_2 (cost 50)
               └─ gam_coin_storm [notable] (cost 360)
                    └─ gam_all_in (cost 75)
                         └─ gam_all_in_2 (cost 75)
                              └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 7:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_luck_minor (cost 50)
               └─ gam_luck_minor_2 (cost 50)
                    └─ gam_coin_storm [notable] (cost 360)
                         └─ gam_all_in (cost 75)
                              └─ gam_all_in_2 (cost 75)
                                   └─ gam_casino_king [KEYSTONE] (cost 450)
```

**เส้นทางที่ 8:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_greed_minor (cost 50)
               └─ gam_greed_minor_2 (cost 50)
                    └─ gambler_fortune_greed [notable] (cost 360)
                         └─ gam_vault_ante (cost 75)
                              └─ gam_vault_ante_2 (cost 75)
                                   └─ gam_casino_king [KEYSTONE] (cost 450)
```

#### → gam_casino_king_asc2 (ราชาแห่งเวกัสระดับเทพ / Transcendent Casino King, cost 590)

_พบ 8 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_greed_minor_2 (cost 50)
               └─ gambler_fortune_greed [notable] (cost 360)
                    └─ gam_fortune_filler (cost 170)
                         └─ gam_casino_king (cost 450)
                              └─ gam_casino_king_asc1 (cost 160)
                                   └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 2:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_luck_minor_2 (cost 50)
               └─ gam_coin_storm [notable] (cost 360)
                    └─ gam_coinstorm_filler (cost 165)
                         └─ gam_casino_king (cost 450)
                              └─ gam_casino_king_asc1 (cost 160)
                                   └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 3:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_luck_minor (cost 50)
               └─ gam_luck_minor_2 (cost 50)
                    └─ gam_coin_storm [notable] (cost 360)
                         └─ gam_coinstorm_filler (cost 165)
                              └─ gam_casino_king (cost 450)
                                   └─ gam_casino_king_asc1 (cost 160)
                                        └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 4:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_greed_minor_2 (cost 50)
               └─ gambler_fortune_greed [notable] (cost 360)
                    └─ gam_vault_ante (cost 75)
                         └─ gam_vault_ante_2 (cost 75)
                              └─ gam_casino_king (cost 450)
                                   └─ gam_casino_king_asc1 (cost 160)
                                        └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 5:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_greed_minor (cost 50)
               └─ gam_greed_minor_2 (cost 50)
                    └─ gambler_fortune_greed [notable] (cost 360)
                         └─ gam_fortune_filler (cost 170)
                              └─ gam_casino_king (cost 450)
                                   └─ gam_casino_king_asc1 (cost 160)
                                        └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 6:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_luck_minor_2 (cost 50)
               └─ gam_coin_storm [notable] (cost 360)
                    └─ gam_all_in (cost 75)
                         └─ gam_all_in_2 (cost 75)
                              └─ gam_casino_king (cost 450)
                                   └─ gam_casino_king_asc1 (cost 160)
                                        └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 7:**
```
gam_root (cost 0)
     └─ gam_greed_minor (cost 50)
          └─ gam_luck_minor (cost 50)
               └─ gam_luck_minor_2 (cost 50)
                    └─ gam_coin_storm [notable] (cost 360)
                         └─ gam_all_in (cost 75)
                              └─ gam_all_in_2 (cost 75)
                                   └─ gam_casino_king (cost 450)
                                        └─ gam_casino_king_asc1 (cost 160)
                                             └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```

**เส้นทางที่ 8:**
```
gam_root (cost 0)
     └─ gam_luck_minor (cost 50)
          └─ gam_greed_minor (cost 50)
               └─ gam_greed_minor_2 (cost 50)
                    └─ gambler_fortune_greed [notable] (cost 360)
                         └─ gam_vault_ante (cost 75)
                              └─ gam_vault_ante_2 (cost 75)
                                   └─ gam_casino_king (cost 450)
                                        └─ gam_casino_king_asc1 (cost 160)
                                             └─ gam_casino_king_asc2 [KEYSTONE] (cost 590)
```


<a id="universal"></a>
## Universal (rootId: uni_root, 25 nodes)

_title: Universal Ancient Roots — Soul Ascension Web / รากเหง้าโบราณสากล — เว็บทักษะแห่งการเลื่อนขั้นวิญญาณ_

### ตาราง Node เต็ม

| node id | name (TH/EN) | type | parent(s) via connections | cost | stats/effect เต็ม | signatureSkillId |
|---|---|---|---|---|---|---|
| uni_root | แก่นวิญญาณบรรพกาล / Ancestral Soul Core | root | uni_alchemist_reroll, uni_alchemist_banish, uni_alchemist_lock, uni_exp_1, uni_exp_branch_left, uni_exp_branch_right | 0 | maxHp:10 | — |
| uni_alchemist_reroll | ขวดยารีโรลนักเล่นแร่แปรธาตุ / Alchemist's Reroll Vial | minor | uni_root | 40 | extraRerolls:2 | — |
| uni_alchemist_banish | ผงเถ้าสาปนักเล่นแร่แปรธาตุ / Alchemist's Banishing Ash | minor | uni_root | 40 | extraBanishes:2 | — |
| uni_alchemist_lock | อักขระผนึกนักเล่นแร่แปรธาตุ / Alchemist's Binding Sigil | minor | uni_root | 30 | extraLocks:1 | — |
| uni_exp_1 | ดูดซับวิญญาณ 1 / Soul Attunement I | minor | uni_root, uni_soul_kindling | 23 | expMultiplier:5 | — |
| uni_soul_kindling | สายใยวิญญาณเริ่มแรก / Nascent Soulbond | minor | uni_exp_1, uni_exp_2 | 22 | expMultiplier:5 | — |
| uni_exp_2 | ดูดซับวิญญาณ 2 / Soul Attunement II | minor | uni_soul_kindling, uni_soul_deepening | 48 | expMultiplier:5 | — |
| uni_soul_deepening | สายใยวิญญาณลึกซึ้ง / Deepening Soulbond | minor | uni_exp_2, uni_exp_3 | 47 | expMultiplier:5 | — |
| uni_exp_3 | ปรีชาญาณโบราณ / Wisdom of the Elders | notable | uni_soul_deepening, uni_exp_filler_1 | 175 | expMultiplier:10, pickupRadius:1 | — |
| uni_exp_filler_1 | เศษวัตถุศักดิ์สิทธิ์ / Reliquary Fragment | minor | uni_exp_3, uni_exp_4 | 150 | maxHp:10 | — |
| uni_exp_4 | สมาธิรู้แจ้ง / Transcendental Focus | notable | uni_exp_filler_1, uni_exp_filler_2 | 280 | expMultiplier:10, maxHp:20 | — |
| uni_exp_filler_2 | ประกายแห่งการเลื่อนขั้น / Ascendant Spark | minor | uni_exp_4, uni_keystone_mastery | 350 | damageBonus:0.25 | — |
| uni_keystone_mastery | การรู้แจ้งอันสมบูรณ์ / Ascendant Enlightenment | keystone | uni_exp_filler_2, uni_keystone_mastery_asc1 | 450 | expMultiplier:10, damageBonus:1 | — |
| uni_keystone_mastery_asc1 | การรู้แจ้งอันสมบูรณ์ขั้นสูง / Greater Enlightenment | minor | uni_keystone_mastery, uni_keystone_mastery_asc2 | 160 | damageBonus:0.5, expMultiplier:3 | — |
| uni_keystone_mastery_asc2 | การรู้แจ้งอันสมบูรณ์ระดับเทพ / Transcendent Enlightenment | keystone | uni_keystone_mastery_asc1 | 590 | damageBonus:1, expMultiplier:10 | — |
| uni_exp_branch_left | เกราะคุ้มวิญญาณ / Essence Shielding | minor | uni_root, uni_left_ward | 35 | expMultiplier:3, maxHp:8 | — |
| uni_left_ward | เสียงสะท้อนปกป้อง / Warding Echo | minor | uni_exp_branch_left, uni_left_notable | 35 | expMultiplier:2, maxHp:7 | — |
| uni_left_notable | ปราการบรรพบุรุษ / Aegis of the Ancestors | notable | uni_left_ward | 160 | expMultiplier:5, defense:3 | — |
| uni_exp_branch_right | ก้าวย่างว่องไว / Swift Attunement | minor | uni_root, uni_right_zephyr | 35 | expMultiplier:3, moveSpeed:0.5 | — |
| uni_right_zephyr | การผสานสายลม / Zephyr's Attunement | minor | uni_exp_branch_right, uni_right_notable | 35 | expMultiplier:2, moveSpeed:0.5 | — |
| uni_right_notable | แรงดึงดูดดวงดาว / Celestial Vacuum | notable | uni_right_zephyr, uni_right_filler_1 | 160 | expMultiplier:5, pickupRadius:1 | — |
| uni_right_filler_1 | ประกายนำโชค / Lucky Ember | minor | uni_right_notable, uni_luck_keystone | 110 | tierLuck:5 | — |
| uni_luck_keystone | โชคชะตาเป็นใจ / Fortune's Favor | keystone | uni_right_filler_1, uni_luck_keystone_asc1 | 260 | tierLuck:15 | — |
| uni_luck_keystone_asc1 | โชคชะตาเป็นใจขั้นสูง / Greater Fortune's Favor | minor | uni_luck_keystone, uni_luck_keystone_asc2 | 90 | tierLuck:5 | — |
| uni_luck_keystone_asc2 | โชคชะตาเป็นใจระดับเทพ / Transcendent Fortune's Favor | keystone | uni_luck_keystone_asc1 | 340 | tierLuck:15 | — |

### เส้นทางจาก Root ไปทุก Keystone

#### → uni_keystone_mastery (การรู้แจ้งอันสมบูรณ์ / Ascendant Enlightenment, cost 450)

_พบ 1 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
uni_root (cost 0)
     └─ uni_exp_1 (cost 23)
          └─ uni_soul_kindling (cost 22)
               └─ uni_exp_2 (cost 48)
                    └─ uni_soul_deepening (cost 47)
                         └─ uni_exp_3 [notable] (cost 175)
                              └─ uni_exp_filler_1 (cost 150)
                                   └─ uni_exp_4 [notable] (cost 280)
                                        └─ uni_exp_filler_2 (cost 350)
                                             └─ uni_keystone_mastery [KEYSTONE] (cost 450)
```

#### → uni_keystone_mastery_asc2 (การรู้แจ้งอันสมบูรณ์ระดับเทพ / Transcendent Enlightenment, cost 590)

_พบ 1 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
uni_root (cost 0)
     └─ uni_exp_1 (cost 23)
          └─ uni_soul_kindling (cost 22)
               └─ uni_exp_2 (cost 48)
                    └─ uni_soul_deepening (cost 47)
                         └─ uni_exp_3 [notable] (cost 175)
                              └─ uni_exp_filler_1 (cost 150)
                                   └─ uni_exp_4 [notable] (cost 280)
                                        └─ uni_exp_filler_2 (cost 350)
                                             └─ uni_keystone_mastery (cost 450)
                                                  └─ uni_keystone_mastery_asc1 (cost 160)
                                                       └─ uni_keystone_mastery_asc2 [KEYSTONE] (cost 590)
```

#### → uni_luck_keystone (โชคชะตาเป็นใจ / Fortune's Favor, cost 260)

_พบ 1 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
uni_root (cost 0)
     └─ uni_exp_branch_right (cost 35)
          └─ uni_right_zephyr (cost 35)
               └─ uni_right_notable [notable] (cost 160)
                    └─ uni_right_filler_1 (cost 110)
                         └─ uni_luck_keystone [KEYSTONE] (cost 260)
```

#### → uni_luck_keystone_asc2 (โชคชะตาเป็นใจระดับเทพ / Transcendent Fortune's Favor, cost 340)

_พบ 1 เส้นทางทั้งหมดจาก root_

**เส้นทางที่ 1:**
```
uni_root (cost 0)
     └─ uni_exp_branch_right (cost 35)
          └─ uni_right_zephyr (cost 35)
               └─ uni_right_notable [notable] (cost 160)
                    └─ uni_right_filler_1 (cost 110)
                         └─ uni_luck_keystone (cost 260)
                              └─ uni_luck_keystone_asc1 (cost 90)
                                   └─ uni_luck_keystone_asc2 [KEYSTONE] (cost 340)
```


## หมายเหตุการตรวจสอบ

- จำนวน node รวมที่นับได้จริงจากไฟล์: 418 (เทียบกับที่ GAME_WIKI.md §1.5 รายงานไว้ 418 — ตรงกัน)
- รายชื่อ node ที่ `connections` ชี้ไปหา id ที่ไม่มีอยู่จริงในคลาสนั้น: ไม่พบ — ทุก connections ในทุกคลาสชี้ไปหา node ที่มีอยู่จริง
