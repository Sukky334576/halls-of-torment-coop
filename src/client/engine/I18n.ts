export type Language = 'th' | 'en';

type TranslationKeys = Record<string, { th: string; en: string }>;

const TRANSLATIONS: TranslationKeys = {
  // Game Title & Subtitle
  'game.title': { th: 'ทัณฑ์ทรมานแห่งวิญญาณ', en: 'TORMENT OF SOULS' },
  'game.subtitle': { th: 'ศึกท้าทายความมืด 4 ผู้เล่น (ระบบ 2.5D)', en: '4-PLAYER CO-OP DARK FANTASY CRUSADE (2.5D ENGINE)' },

  // Lobby Top Bar
  'lobby.coins': { th: 'เหรียญวิญญาณ', en: 'COINS' },
  'lobby.skill_tree_btn': { th: 'ผังทักษะ', en: 'SKILL TREE' },
  'lobby.gear_vault_btn': { th: 'คลังอุปกรณ์', en: 'GEAR VAULT' },
  'lobby.trials_btn': { th: 'บททดสอบ', en: 'TRIALS' },
  'lobby.instructions': {
    th: 'เลือกนักรบเพื่อส่งเข้าสู่สมรภูมิวิญญาณ',
    en: 'Inspect and select your champion for the crusade'
  },

  // Lobby Inspector
  'lobby.weapon': { th: 'อาวุธ:', en: 'Weapon:' },
  'lobby.cooldown': { th: 'คูลดาวน์', en: 'Cooldown' },
  'lobby.specialization': { th: 'ความชำนาญ:', en: 'Specialization:' },
  'lobby.stat_hp': { th: 'พลังชีวิต (HP)', en: 'HP' },
  'lobby.stat_speed': { th: 'ความเร็ว (SPD)', en: 'SPEED' },
  'lobby.stat_damage': { th: 'พลังโจมตี (DMG)', en: 'DAMAGE' },
  'lobby.stat_defense': { th: 'เกราะป้องกัน (DEF)', en: 'DEFENSE' },

  // Lobby Party & Controls
  'lobby.name_label': { th: 'ชื่อนักรบ:', en: 'HERO NAME:' },
  'lobby.name_placeholder': { th: 'ระบุชื่อของคุณ...', en: 'Enter hero name...' },
  'lobby.party_title': { th: 'ปาร์ตี้ร่วมศึก (1-4 คน)', en: 'CRUSADE PARTY (1-4 PLAYERS)' },
  'lobby.party_you': { th: 'คุณ', en: 'You' },
  'lobby.status_ready': { th: 'พร้อม', en: 'READY' },
  'lobby.status_waiting': { th: 'รอพร้อม', en: 'WAITING' },
  'lobby.btn_ready': { th: 'พร้อมลุย', en: 'READY' },
  'lobby.btn_ready_active': { th: 'ยกเลิก', en: 'CANCEL' },
  'lobby.btn_enter_gate': { th: 'เริ่มศึกทรมาน', en: 'ENTER THE REALM' },
  'lobby.btn_gate_walking': { th: 'กำลังเข้าสู่ประตูมิติ...', en: 'ENTERING PORTAL...' },

  // Stage Selection Modal
  'stage.modal_badge': { th: 'ประตูแห่งความทรมาน — เลือกระดับมิติสมรภูมิ', en: 'GATE OF TORMENT — REALM SELECTION' },
  'stage.modal_title': { th: '⚡ เลือกประตูมิติสู่สมรภูมิ ⚡', en: '⚡ CHOOSE REALM DESTINATION ⚡' },
  'stage.modal_subtitle': {
    th: 'มอนสเตอร์จะทวีความดุร้ายขึ้นในแต่ละมิติ แต่รางวัลเหรียญวิญญาณและค่าประสบการณ์จะคุ้มค่ายิ่งขึ้น!',
    en: 'Monsters grow deadlier in deeper realms, but Soul Coin and EXP rewards scale significantly!'
  },
  'stage.enemies_label': { th: '⚔️ ศัตรู:', en: '⚔️ Foes:' },
  'stage.rewards_label': { th: '💰 รางวัล:', en: '💰 Rewards:' },
  'stage.enter_btn': { th: 'ก้าวสู่ประตูมิติ (ENTER)', en: 'ENTER PORTAL' },
  'stage.locked_btn': { th: '🔒 ล็อกอยู่', en: '🔒 LOCKED' },
  'stage.back_btn': { th: '↩ กลับไปเลือกตัวละคร (BACK)', en: '↩ BACK TO HEROES' },

  // Stage 1
  'stage.1.name': { th: 'สุสานโบราณใต้พิภพ', en: 'The Haunted Catacombs' },
  'stage.1.diff': { th: 'ความยาก: เริ่มต้น', en: 'DIFFICULTY: NOVICE' },
  'stage.1.desc': {
    th: 'สุสานใต้ดินโบราณที่เต็มไปด้วยซากกระดูกและปีศาจกินศพ เหมาะสำหรับผู้เริ่มต้นก้าวสู่แดนทรมาน',
    en: 'Ancient burial crypts teeming with skeletal horrors and flesh scavengers. Ideal for new Crusaders.'
  },

  // Stage 2
  'stage.2.name': { th: 'ถ้ำเพลิงอเวจี', en: 'The Infernal Caverns' },
  'stage.2.diff': { th: 'ความยาก: ยาก', en: 'DIFFICULTY: HARD' },
  'stage.2.desc': {
    th: 'โพรงลาวาเดือดพล่าน อุดมด้วยอิมป์เพลิงและหมานรก ศัตรูอึดและตีหนักขึ้น พร้อมดรอปเหรียญวิญญาณมหาศาล',
    en: 'Boiling subterranean volcanic shafts crawled by fiery fiends. Tougher enemies, significantly higher Soul Coin drops.'
  },
  'stage.2.lock': { th: 'ต้องพิชิตด่านที่ 1 ก่อน', en: 'Must clear Stage 1 first' },

  // Stage 3
  'stage.3.name': { th: 'หุบเหวทมิฬออบซิเดียน', en: 'The Obsidian Abyss' },
  'stage.3.diff': { th: 'ความยาก: นรกภูมิ', en: 'DIFFICULTY: TORMENT NIGHTMARE' },
  'stage.3.desc': {
    th: 'มิติมืดมิดไร้ขอบเขต ที่สถิตของวอร์ล็อกและเจ้าแห่งความทรมาน มอนสเตอร์โหดสุดขีด รางวัลสูงสุดในโลกหล้า',
    en: 'Pitch-black void of agony where shadow warlocks dwell. Extreme monster threat, supreme bounty rewards.'
  },
  'stage.3.lock': { th: 'ต้องพิชิตด่านที่ 2 ก่อน', en: 'Must clear Stage 2 first' },

  // In-Game HUD
  'hud.wave': { th: 'เวฟ {wave}/{maxWaves}', en: 'WAVE {wave}/{maxWaves}' },
  'hud.wave_boss': { th: 'เวฟ {wave}/{maxWaves} [เผชิญหน้าบอส]', en: 'WAVE {wave}/{maxWaves} [BOSS BATTLE]' },
  'hud.defeat_boss': { th: '⚔️ กำจัดบอส! ⚔️', en: '⚔️ DEFEAT BOSS ⚔️' },
  'hud.boss_encounter': { th: '⚠️ บอสสุดแกร่งปรากฏตัว! ⚠️', en: '⚠️ DREADFUL BOSS ENCOUNTER ⚠️' },
  'hud.deadline_warning': { th: '💀 พลังมืดกำลังกลืนกินสนามรบ! รีบจบศึกก่อนหมดเวลา! 💀', en: '💀 DARKNESS IS CONSUMING THE BATTLEFIELD — END THIS FIGHT! 💀' },
  'gameover.boss_enrage_execute': {
    th: 'บอสทรงพลังเกินกว่าจะสู้ต่อไหว ความมืดกลืนกินปาร์ตี้ของคุณ',
    en: 'The boss proved too powerful — the darkness consumed your party.'
  },
  'gameover.surrender_sub': {
    th: 'คุณยอมแพ้ถอยทัพ — ได้รับเหรียญวิญญาณเพียง 50% จากที่เก็บมาได้',
    en: 'You surrendered and retreated — only 50% of collected Soul Coins is kept.'
  },
  'hud.boss_slain': {
    th: '🏆 {boss} ถูกกำจัดแล้ว! เวฟต่อไปใน {sec} วิ... 🏆',
    en: '🏆 {boss} SLAIN! NEXT WAVE IN {sec}S... 🏆'
  },
  'hud.boss_advance': { th: '— กำจัดบอสเพื่อผ่านด่าน!', en: '— DEFEAT TO ADVANCE!' },
  'hud.move_hint': { th: '[W,A,S,D] เดิน', en: '[W,A,S,D] Move' },
  'hud.aim_hint': { th: '[เมาส์] เล็ง & โจมตี', en: '[Mouse] Aim & Attack' },
  'hud.dash_btn': { th: 'พุ่งตัว [SPACE]', en: 'DASH [SPACE]' },
  'hud.dash_ready': { th: 'พร้อม', en: 'READY' },
  'hud.autoaim_on': { th: 'เล็งอัตโนมัติ: เปิด', en: 'AUTO-AIM: ON' },
  'hud.autoaim_off': { th: 'เล็งอัตโนมัติ: ปิด', en: 'AUTO-AIM: OFF' },
  'hud.level_format': { th: 'เลเวล {lvl} ({exp} / {maxExp} EXP)', en: 'LEVEL {lvl} ({exp} / {maxExp} EXP)' },
  'hud.hp_format': { th: '{hp} / {maxHp} HP', en: '{hp} / {maxHp} HP' },
  'hud.party_you': { th: '(คุณ)', en: '(You)' },
  'hud.downed_status': { th: '⚠️ ล้มลง - เข้าใกล้เพื่อชุบชีวิต!', en: '⚠️ DOWNED - STAND NEAR TO REVIVE!' },
  'hud.wasd_title': { th: '🕹️ ปุ่มเดิน WASD', en: '🕹️ WASD CONTROLS' },
  'hud.wasd_hint': { th: 'กดคีย์บอร์ด หรือ แตะบนจอได้', en: 'Use keyboard or tap screen' },

  // Shrines & Altars
  'shrine.SPEED': { th: '⚡ แท่นบูชาความเร็ว (+25% เดินไว)', en: '⚡ SHRINE OF SPEED (+25% SPD)' },
  'shrine.FRENZY': { th: '⚔️ แท่นบูชาคลุ้มคลั่ง (+30% ตีไว)', en: '⚔️ SHRINE OF FRENZY (+30% ATK SPD)' },
  'shrine.AEGIS': { th: '🛡️ แท่นบูชาพิทักษ์ (เกราะ & ฟื้นเลือด)', en: '🛡️ SHRINE OF AEGIS (SHIELD & REGEN)' },
  'shrine.GOLD_RUSH': { th: '💰 แท่นบูชาขุมทอง (เหรียญวิญญาณ x2)', en: '💰 SHRINE OF GOLD RUSH (2X SOUL COINS)' },
  'shrine.ALTAR_BLOOD': { th: '🩸 แท่นบูชาโลหิต (สละ 30% HP แลก +35% พลังโจมตีถาวร)', en: '🩸 ALTAR OF BLOOD (Sacrifice 30% HP for +35% Perm DMG)' },
  'shrine.ALTAR_TEMPEST': { th: '⚡ แท่นบูชาวายุคลั่ง (ออร่าสายฟ้าฟาด & +40% วิ่งไว 45วิ)', en: '⚡ ALTAR OF TEMPEST (Storm Lightning & +40% Speed for 45s)' },
  'shrine.ALTAR_VOID': { th: '🌌 แท่นบูชาความว่างเปล่า (อัญเชิญบอสพิทักษ์มิติ รับรางวัลสูงสุด)', en: '🌌 ALTAR OF THE VOID (Summons Void Guardian Boss for Epic Loot)' },

  // Level Up / Trait Selection
  'trait.levelup_badge': { th: 'อัปเกรดเลเวลสำเร็จ!', en: 'LEVEL UP ACHIEVED' },
  'trait.paused_banner': { th: '⏸️ สนามรบหยุดชั่วขณะ — ปลอดภัยในการเลือก', en: '⏸️ BATTLEFIELD PAUSED — SAFE TO CHOOSE' },
  'trait.title': { th: '⚡ เลือกพรแห่งพลังศักดิ์สิทธิ์ ⚡', en: '⚡ CHOOSE YOUR BLESSING ⚡' },
  'trait.subtitle': {
    th: 'แดนทรมานมอบพลังโบราณให้แก่นักรบของคุณ',
    en: 'THE TORMENT YIELDS ITS ANCIENT POWER TO YOUR CRUSADE'
  },
  'trait.click_hint': { th: 'คลิกเพื่อรับพลัง', en: 'CLICK TO EMBRACE' },
  'trait.signature_badge': { th: '⭐ สกิลประจำตัว', en: '⭐ SIGNATURE SKILL' },
  'potion.reroll': { th: '🎲 รีโรล ({n})', en: '🎲 Reroll ({n})' },
  'potion.banish': { th: '🚫 แบนการ์ด ({n})', en: '🚫 Banish ({n})' },
  'potion.banish_active': { th: '🚫 คลิกการ์ดเพื่อแบนถาวร!', en: '🚫 Click card to banish forever!' },
  'potion.lock': { th: '🔒 ล็อกการ์ด ({n})', en: '🔒 Lock ({n})' },
  'potion.lock_active': { th: '🔒 คลิกการ์ดเพื่อล็อกไว้รอบหน้า!', en: '🔒 Click card to lock for next level!' },
  'potion.locked_tag': { th: '🔒 ล็อกไว้แล้ว', en: '🔒 LOCKED' },
  'potion.evolution_badge': { th: '⚡ การจุติของอาวุธ ⚡', en: '⚡ WEAPON EVOLUTION ⚡' },

  // Game Over Modal
  'gameover.victory_title': { th: 'ชัยชนะอันยิ่งใหญ่!', en: 'VICTORY ACHIEVED' },
  'gameover.victory_sub': { th: 'จอมมารแห่งแดนทรมานถูกขับไล่แล้ว!', en: 'THE LORD OF TORMENT HAS BEEN BANISHED' },
  'gameover.defeat_title': { th: 'พ่ายแพ้', en: 'DEFEAT' },
  'gameover.defeat_sub': { th: 'ความมืดแห่งแดนทรมานได้กลืนกินปาร์ตี้ของคุณแล้ว', en: 'THE TORMENT HAS CONSUMED YOUR PARTY' },
  'gameover.time': { th: 'เวลาที่เอาชีวิตรอด:', en: 'Survival Time:' },
  'gameover.kills': { th: 'ศัตรูที่กำจัดได้:', en: 'Total Enemies Slain:' },
  'gameover.gold': { th: 'เหรียญวิญญาณที่คว้ามาได้:', en: 'Soul Coins Secured:' },
  'gameover.btn_retry': { th: 'กลับสู่ล็อบบี้ (RETURN TO HUB)', en: 'RETURN TO HUB' },

  // Classes Localized Names & Titles
  'class.swordsman.name': { th: 'นักรบดาบเหล็ก', en: 'Swordsman' },
  'class.swordsman.title': { th: 'กำแพงเหล็กกล้า', en: 'The Steel Bulwark' },
  'class.swordsman.desc': {
    th: 'นักรบชุดเกราะหนัก ผู้เชี่ยวชาญการฟันกวาดดาบยักษ์ สร้างดาเมจเลือดออก และทนทานต่อการโจมตี',
    en: 'A steadfast frontliner with sweeping broadsword slashes, thick plate armor, and bleeding strikes.'
  },
  'class.swordsman.weapon': { th: 'ฟันดาบยักษ์กวาดศัตรู', en: 'Greatsword Cleave' },
  'class.swordsman.spec': { th: 'เกราะหนา, เลือดออกต่อเนื่อง, ฟันกวาดระยะประชิด', en: 'High Defense, Bleed DoT & Melee Cleave' },

  'class.archer.name': { th: 'พลธนูวายุ', en: 'Archer' },
  'class.archer.title': { th: 'เงาเพชฌฆาตมืด', en: 'The Shadow Stalker' },
  'class.archer.desc': {
    th: 'พลธนูผู้รวดเร็ว ยิงธนูวายุเจาะทะลุศัตรูจากระยะไกล และสังหารด้วยคริติคอลปลิดชีพ',
    en: 'Ranged precision striker with gale-force piercing arrows and lethal critical assassinations.'
  },
  'class.archer.weapon': { th: 'ศรวายุทะลวง', en: 'Piercing Gale Arrow' },
  'class.archer.spec': { th: 'ยิงไกลความเร็วสูง, ศรเจาะทะลวง, ตัวคูณคริติคอลรุนแรง', en: 'Sniper Velocity, Piercing Fans & Critical Multipliers' },

  'class.sorceress.name': { th: 'จอมเวทสายฟ้า', en: 'Sorceress' },
  'class.sorceress.title': { th: 'ผู้ควบคุมสายฟ้าสวรรค์', en: 'The Astral Conduit' },
  'class.sorceress.desc': {
    th: 'ผู้ควบคุมพลังเวท ร่ายสายฟ้าฟาดชิ่งต่อเนื่อง ลูกแก้วเวทมนตร์ และคลื่นความเย็นเยือกแข็งศัตรู',
    en: 'Master of arcane arcing electricity, orbiting star orbs, and frost novas that shatter clusters.'
  },
  'class.sorceress.weapon': { th: 'สายฟ้าฟาดชิ่ง', en: 'Chain Lightning' },
  'class.sorceress.spec': { th: 'สายฟ้าชิ่งต่อเนื่อง, ลูกแก้วเวทป้องกัน, ระเบิดน้ำแข็งแช่แข็ง', en: 'Chain Lightning Chaining, Orbiting Orbs & Freeze Control' },

  'class.cleric.name': { th: 'นักบวชศักดิ์สิทธิ์', en: 'Cleric' },
  'class.cleric.title': { th: 'ตุลาการแสงตะวัน', en: 'The Radiant Arbiter' },
  'class.cleric.desc': {
    th: 'ผู้ใช้พลังศักดิ์สิทธิ์ ฟาดค้อนสายฟ้าสร้างคลื่นกระแทก และกางออร่าฮีลฟื้นฟูเลือดให้เพื่อนร่วมทีม',
    en: 'Channels holy solar wrath with radial smites that weaken enemies and celestial auras that heal allies.'
  },
  'class.cleric.weapon': { th: 'ค้อนแสงศักดิ์สิทธิ์', en: 'Holy Smite' },
  'class.cleric.spec': { th: 'คลื่นกระแทกรอบตัว, ออร่าฮีลฟื้นฟูเพื่อนร่วมทีม, เสาแสงพิพากษา', en: 'Radial Shockwaves, Group Healing & Holy Retribution' },

  'class.commando.name': { th: 'คอมมานโดหน่วยรบพิเศษ', en: 'Commando' },
  'class.commando.title': { th: 'จอมยุทธการกลยุทธ์', en: 'The Tactical Vanguard' },
  'class.commando.desc': {
    th: 'ผู้ชำนาญอาวุธสงครามและยุทธวิธี ยิงไรเฟิลจู่โจม M4A1 รัวสามนัด พร้อมปาระเบิดสังหารและเรียกดดรนทิ้งระเบิด',
    en: 'Special forces combatant wielding rapid 3-round burst M4A1 carbine, frag grenades, and tactical drone strikes.'
  },
  'class.commando.weapon': { th: 'ไรเฟิลจู่โจม M4A1', en: 'M4A1 Assault Rifle' },
  'class.commando.spec': { th: 'ยิงรัว 3 นัด, ระเบิดสังหาร, โดรนทิ้งระเบิดทางยุทธวิธี', en: '3-Round Burst, Frag Grenade, Drone Airstrikes' },

  'class.cat_tank.name': { th: 'แมวอ้วนพุงโต', en: 'Cat Tank' },
  'class.cat_tank.title': { th: 'ปราการเหมียวนุ่มนิ่ม', en: 'The Chonk Citadel' },
  'class.cat_tank.desc': {
    th: 'แมวสก็อตติชโฟลด์ร่างยักษ์ผู้มี 9 ชีวิต ทนทานด้วยพุงนุ่มหนาเตอะ ขู่ฟ่อดึงดูดมอนสเตอร์ และทุบอุ้งเท้ามหาประลัย',
    en: 'A colossal Scottish Fold fortress blessed with 9 lives, titanic paw slams, aggro hissing taunts, and toxic hairballs.'
  },
  'class.cat_tank.weapon': { th: 'ทุบอุ้งเท้ามหาประลัย', en: 'Heavy Paw Slam' },
  'class.cat_tank.spec': { th: 'คืนชีพ 9 ชีวิต, ล่อมอนสเตอร์รวมกลุ่ม, เกราะพุงนุ่มกันดาเมจ', en: '9 Lives Revive, AoE Aggro Taunts & Chonk Armor' },

  'class.cowboy.name': { th: 'คาวบอยสิงห์ปืนไว', en: 'Cowboy' },
  'class.cowboy.title': { th: 'มือปืนแดนเถื่อน', en: 'The Gunslinger' },
  'class.cowboy.desc': {
    th: 'ยอดมือปืนตะวันตกผู้สับไกปืนลูกโม่คู่ด้วยความเร็วสูง ปลิดชีพศัตรูด้วยบ่วงบาศก์ลวดหนาม และกระสุนหัวระเบิดฉีกร่าง',
    en: 'Dual revolver fanning gunslinger with quick-draw crits, barbed wire ensnaring lassos, and tumbling combat rolls.'
  },
  'class.cowboy.weapon': { th: 'ปืนลูกโม่คู่สับไกไว', en: 'Twin Revolvers' },
  'class.cowboy.spec': { th: 'ยิงลูกโม่คู่รัวไว, บ่วงบาศก์มัดรวมศัตรู, คริติคอลฉีกร่าง', en: 'Dual Revolver Fanning, Ensnaring Lasso & Deadeye Crits' },

  'class.celestial_mecha.name': { th: 'หุ่นรบสวรรค์ GN', en: 'Celestial Mecha' },
  'class.celestial_mecha.title': { th: 'ปีกแสงแห่งอนาคต', en: 'The GN Vanguard' },
  'class.celestial_mecha.desc': {
    th: 'หุ่นยนต์รบอวกาศไฮเทคลอยตัวกลางอากาศ กวัดแกว่งดาบแสงพลาสมาคู่ และระดมยิงปีกเลเซอร์ Full Burst',
    en: 'Futuristic hover mech armed with dual plasma beam sabers, full burst wing laser cannons, and GN energy shielding.'
  },
  'class.celestial_mecha.weapon': { th: 'ดาบแสงคู่พลาสมา', en: 'Dual Beam Sabers' },
  'class.celestial_mecha.spec': { th: 'ฟันดาบแสงคู่, ระดมยิงปีกเลเซอร์, บาเรียสนามพลัง GN', en: 'Dual Saber Cleave, Wing Laser Salvo & GN Barrier' },

  'class.gambler.name': { th: 'นักเสี่ยงโชคแห่งโชคชะตา', en: 'The Gambler' },
  'class.gambler.title': { th: 'เจ้ามือไพ่ไร้พ่าย', en: 'The High Roller' },
  'class.gambler.desc': {
    th: 'นักพนันผู้กุมโชคชะตา ซัดไพ่สังหารเฉือนศัตรู ทอดลูกเต๋าเสี่ยงดวงระเบิดมหาเวท และหมุนตู้สล็อตแจ็กพอตแตก 777',
    en: 'Master of luck and fortune throwing razor playing cards, tossing loaded fate dice, and triggering slot machine 777 jackpots.'
  },
  'class.gambler.weapon': { th: 'ไพ่ทาโรต์สังหาร', en: 'Arcane Playing Cards' },
  'class.gambler.spec': { th: 'ปาไพ่เป็นพัด, ทอดลูกเต๋าเสี่ยงทาย, แจ็กพอต 777 โปรยเหรียญวิญญาณ', en: 'Fan of Razor Cards, Fate Dice Explosion & 777 Jackpot Rain' },

  // ESC Menu Translations
  'esc.title': { th: 'เมนูพักรบ & ข้อมูลสมรภูมิ', en: 'BATTLE CODEX & PAUSE' },
  'esc.solo_paused': { th: '🟢 เล่นคนเดียว (เกมหยุดเวลาชั่วคราว)', en: '🟢 Solo Mode (Time Frozen)' },
  'esc.coop_running': { th: '⚔️ สมรภูมิออนไลน์ (เวลาไม่หยุด - เพื่อนกำลังรบ)', en: '⚔️ Online Co-op (Real-time Battle)' },
  'esc.tab_stats': { th: '📊 สเตตัสตัวละคร', en: '📊 Hero Attributes' },
  'esc.tab_traits': { th: '📜 พรแห่งพลัง & บัฟ', en: '📜 Traits & Blessings' },
  'esc.tab_crusade': { th: '🗺️ สถิติการรบ & ปาร์ตี้', en: '🗺️ Realm & Party' },
  
  'esc.stat_hp': { th: 'พลังชีวิต (HP)', en: 'Health (HP)' },
  'esc.stat_def': { th: 'เกราะป้องกัน (DEF)', en: 'Defense' },
  'esc.stat_def_desc': { th: 'ลดดาเมจที่ได้รับ', en: 'Damage Reduction' },
  'esc.stat_dmg': { th: 'โบนัสพลังโจมตี (DMG)', en: 'Damage Bonus' },
  'esc.stat_atk_spd': { th: 'ความเร็วโจมตี (ATK SPD)', en: 'Attack Speed' },
  'esc.stat_crit_rate': { th: 'โอกาสคริติคอล (CRIT)', en: 'Critical Chance' },
  'esc.stat_crit_dmg': { th: 'ความเสียหายคริติคอล', en: 'Crit Damage' },
  'esc.stat_move_spd': { th: 'ความเร็วเคลื่อนที่', en: 'Movement Speed' },
  'esc.stat_pickup': { th: 'ระยะเก็บของ', en: 'Pickup Radius' },
  'esc.stat_area': { th: 'ขนาดพื้นที่สกิล', en: 'Skill Area' },
  
  'esc.no_traits': { th: 'ยังไม่มีพรแห่งพลังที่เลือก (เพิ่มเลเวลเพื่อปลดล็อก)', en: 'No traits acquired yet (Level up to unlock)' },
  'esc.shrine_active': { th: 'แท่นบูชาที่ใช้งานอยู่:', en: 'Active Shrine Blessing:' },
  'esc.shrine_none': { th: 'ไม่มีบัฟแท่นบูชาในขณะนี้', en: 'No active shrine buff' },
  
  'esc.party_title': { th: 'สมาชิกปาร์ตี้ร่วมศึก:', en: 'Crusade Party Members:' },
  'esc.stage_title': { th: 'สมรภูมิปัจจุบัน:', en: 'Current Realm:' },
  'esc.time_survived': { th: 'เวลาที่เอาชีวิตรอด:', en: 'Time Survived:' },
  'esc.kills': { th: 'ศัตรูที่สังหาร:', en: 'Monsters Slain:' },
  'esc.gold': { th: 'เหรียญวิญญาณของทีม:', en: 'Team Soul Coins:' },
  
  'esc.btn_resume': { th: '▶️ กลับสู่การรบ (RESUME)', en: '▶️ Resume Crusade' },
  'esc.btn_surrender': { th: '🏳️ กดยอมแพ้ / ถอยทัพ', en: '🏳️ Surrender / Abandon' },
  
  'esc.confirm_surrender_title': { th: '⚠️ ยืนยันการถอยทัพยอมแพ้?', en: '⚠️ Confirm Surrender?' },
  'esc.confirm_surrender_msg': {
    th: 'คุณแน่ใจหรือไม่ที่จะยอมแพ้? เหรียญวิญญาณและสถิติที่เก็บได้ในรอบนี้จะถูกนำกลับไปยังล็อบบี้อย่างปลอดภัย',
    en: 'Are you sure you want to abandon the crusade? Soul Coins earned in this run will be safely brought back to Sanctuary.'
  },
  'esc.btn_confirm_surrender': { th: 'ยอมแพ้ทันที', en: 'Surrender Now' },
  'esc.btn_cancel_surrender': { th: 'กลับไปสู้ต่อ', en: 'Keep Fighting' },

  // Graphics Quality Toggle
  'esc.graphics_prefix': { th: '🖥️ กราฟิก:', en: '🖥️ Graphics:' },
  'esc.graphics_low': { th: 'ต่ำ (ประหยัดสุด)', en: 'Low (Best Performance)' },
  'esc.graphics_medium': { th: 'กลาง', en: 'Medium' },
  'esc.graphics_high': { th: 'สูง', en: 'High' }
};

class I18nService {
  private currentLang: Language = 'th';
  private listeners: ((lang: Language) => void)[] = [];

  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('torment_lang') : null;
    if (saved === 'en' || saved === 'th') {
      this.currentLang = saved;
    } else {
      this.currentLang = 'th'; // Default to Thai
    }
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public setLanguage(lang: Language): void {
    if (this.currentLang !== lang) {
      this.currentLang = lang;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('torment_lang', lang);
      }
      this.notify();
    }
  }

  public toggleLanguage(): Language {
    const next = this.currentLang === 'th' ? 'en' : 'th';
    this.setLanguage(next);
    return next;
  }

  public t(key: string, params?: Record<string, string | number>): string {
    const entry = TRANSLATIONS[key];
    let text = entry ? (entry[this.currentLang] || entry['th'] || key) : key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  public onLanguageChanged(cb: (lang: Language) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    for (const l of this.listeners) {
      try {
        l(this.currentLang);
      } catch (err) {
        console.error('Error in i18n listener:', err);
      }
    }
  }
}

export const I18n = new I18nService();
