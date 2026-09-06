export type GearSlot = 'HEAD' | 'CHEST' | 'BOOTS' | 'GLOVES' | 'RING' | 'AMULET';

export type GearRarity = 'common' | 'magic' | 'rare' | 'unique';

export interface GearStats {
  maxHp?: number;
  defense?: number;
  damageBonusPct?: number;
  moveSpeedPct?: number;
  critChancePct?: number;
  attackSpeedPct?: number;
  pickupRadiusPct?: number;
}

export interface GearItem {
  id: string;
  name: string;
  thaiName: string;
  slot: GearSlot;
  rarity: GearRarity;
  icon: string;
  stats: GearStats;
  description: string;
  thaiDescription: string;
}

export const GEAR_CATALOG: Record<string, GearItem> = {
  // HEAD
  helm_iron_visage: {
    id: 'helm_iron_visage',
    name: 'Iron Visage',
    thaiName: 'หน้ากากเหล็กกล้า',
    slot: 'HEAD',
    rarity: 'common',
    icon: '🪖',
    stats: { maxHp: 30, defense: 2 },
    description: 'Sturdy iron faceguard forged for frontline trench warfare.',
    thaiDescription: 'หน้ากากเหล็กกล้าแข็งแกร่ง ป้องกันใบหน้าจากการปะทะในแนวรบ'
  },
  helm_crown_shadows: {
    id: 'helm_crown_shadows',
    name: 'Crown of Shadows',
    thaiName: 'มงกุฎแห่งเงามืด',
    slot: 'HEAD',
    rarity: 'rare',
    icon: '👑',
    stats: { critChancePct: 12, moveSpeedPct: 10 },
    description: 'Weaves ethereal shadows that quicken reflexes and lethal strikes.',
    thaiDescription: 'ถักทอจากเงาอเวจี เร่งปฏิกิริยาหลบหลีกและเพิ่มโอกาสติดคริติคอลอย่างรุนแรง'
  },
  helm_celestial_diadem: {
    id: 'helm_celestial_diadem',
    name: 'Celestial Diadem',
    thaiName: 'รัดเกล้าเทวะประกายฟ้า',
    slot: 'HEAD',
    rarity: 'unique',
    icon: '✨',
    stats: { maxHp: 65, defense: 5, damageBonusPct: 15 },
    description: 'An ancient relic blessed by the gods, radiating divine sovereignty.',
    thaiDescription: 'วัตถุโบราณที่ได้รับพรจากทวยเทพ แผ่อำนาจศักดิ์สิทธิ์ปกป้องและเสริมพลังโจมตี'
  },

  // CHEST
  chest_chainmail: {
    id: 'chest_chainmail',
    name: 'Reinforced Hauberk',
    thaiName: 'เสื้อเกราะโซ่ถักเสริมแกร่ง',
    slot: 'CHEST',
    rarity: 'common',
    icon: '🥋',
    stats: { maxHp: 45, defense: 4 },
    description: 'Heavy interlocking steel rings dampening brutal blunt blows.',
    thaiDescription: 'โซ่ถักเหล็กกล้าสองชั้น ลดทอนแรงกระแทกจากคมเขี้ยวและอาวุธศัตรู'
  },
  chest_blood_carapace: {
    id: 'chest_blood_carapace',
    name: 'Blood Carapace',
    thaiName: 'เกราะกระดองโลหิต',
    slot: 'CHEST',
    rarity: 'rare',
    icon: '🩸',
    stats: { maxHp: 85, defense: 3, damageBonusPct: 12 },
    description: 'Hardened chitin pulsating with necrotic blood thirst.',
    thaiDescription: 'กระดองไคตินแข็งแกร่ง สูบฉีดโลหิตปีศาจเร่งพลังทำลายล้าง'
  },
  chest_aegis_titan: {
    id: 'chest_aegis_titan',
    name: "Titan's Bastion Cuirass",
    thaiName: 'เกราะอกป้อมปราการไททัน',
    slot: 'CHEST',
    rarity: 'unique',
    icon: '🛡️',
    stats: { maxHp: 130, defense: 8, attackSpeedPct: 10 },
    description: 'Imbued with the unyielding bedrock of mountain colossi.',
    thaiDescription: 'หลอมจากแก่นศิลาแห่งเทือกเขาไททัน ทนทานต่อการโจมตีทุกรูปแบบดั่งปราการหิน'
  },

  // BOOTS
  boots_leather_treads: {
    id: 'boots_leather_treads',
    name: 'Stalker Treads',
    thaiName: 'รองเท้านักแกะรอย',
    slot: 'BOOTS',
    rarity: 'common',
    icon: '🥾',
    stats: { moveSpeedPct: 12 },
    description: 'Light supple hide boots offering silent and swift stride.',
    thaiDescription: 'รองเท้าหนังฟอกน้ำหนักเบา ก้าวย่างรวดเร็วและเงียบงัน'
  },
  boots_windrunner_greaves: {
    id: 'boots_windrunner_greaves',
    name: 'Windrunner Greaves',
    thaiName: 'สนับแข้งเหยียบวายุ',
    slot: 'BOOTS',
    rarity: 'rare',
    icon: '🌪️',
    stats: { moveSpeedPct: 22, critChancePct: 8 },
    description: 'Harnesses gale winds to slip past mortal grasps.',
    thaiDescription: 'สลักอักขระแห่งสายลม พริ้วไหวดั่งวายุและจู่โจมจุดตายอย่างแม่นยำ'
  },
  boots_abyssal_striders: {
    id: 'boots_abyssal_striders',
    name: 'Abyssal Striders',
    thaiName: 'รองเท้าผู้ท่องห้วงอเวจี',
    slot: 'BOOTS',
    rarity: 'unique',
    icon: '🌌',
    stats: { moveSpeedPct: 28, maxHp: 40, defense: 3 },
    description: 'Phases slightly between dimensions, defying the gravitas of Torment.',
    thaiDescription: 'เหยียบย่างข้ามมิติ ละเลยพันธนาการแห่งแรงโน้มถ่วงในแดนทรมาน'
  },

  // GLOVES
  gloves_iron_gauntlets: {
    id: 'gloves_iron_gauntlets',
    name: 'Heavy Gauntlets',
    thaiName: 'ถุงมือเหล็กกล้าหนัก',
    slot: 'GLOVES',
    rarity: 'common',
    icon: '🧤',
    stats: { defense: 3, damageBonusPct: 8 },
    description: 'Iron knuckles delivering jarring impact to every weapon strike.',
    thaiDescription: 'สนับเหล็กหนาแน่น เพิ่มน้ำหนักและความรุนแรงในทุกวงดาบ'
  },
  gloves_frenzy_grips: {
    id: 'gloves_frenzy_grips',
    name: 'Grips of Frenzy',
    thaiName: 'ถุงมือคลั่งบันดาล',
    slot: 'GLOVES',
    rarity: 'rare',
    icon: '⚡',
    stats: { attackSpeedPct: 20, critChancePct: 6 },
    description: 'Fills the wearer with hyperactive adrenal combat fury.',
    thaiDescription: 'ปลุกสัญชาตญาณสัตว์ป่า เร่งความเร็วในการฟาดฟันและยิงธนูอย่างบ้าคลั่ง'
  },
  gloves_thunder_touch: {
    id: 'gloves_thunder_touch',
    name: 'Thunderstrike Gauntlets',
    thaiName: 'ถุงมืออัสนีบาตฟาดสายฟ้า',
    slot: 'GLOVES',
    rarity: 'unique',
    icon: '⚡',
    stats: { attackSpeedPct: 25, damageBonusPct: 18, defense: 5 },
    description: 'Crackles with celestial lightning arcs with each swing.',
    thaiDescription: 'แผ่ประกายสายฟ้าศักดิ์สิทธิ์ ทุกการโจมตีสร้างความเสียหายมหาศาล'
  },

  // RING
  ring_copper_band: {
    id: 'ring_copper_band',
    name: 'Magnetic Copper Band',
    thaiName: 'แหวนทองแดงแม่เหล็ก',
    slot: 'RING',
    rarity: 'common',
    icon: '💍',
    stats: { maxHp: 25, pickupRadiusPct: 25 },
    description: 'Attracts distant soul crystals and gold coins with magnetic ease.',
    thaiDescription: 'ดูดซับผลึกวิญญาณและเหรียญทองจากระยะไกลเข้าหาตัวผู้สวมใส่'
  },
  ring_ruby_eye: {
    id: 'ring_ruby_eye',
    name: 'Ruby Eye Ring',
    thaiName: 'แหวนเนตรทับทิมโลหิต',
    slot: 'RING',
    rarity: 'rare',
    icon: '🔴',
    stats: { damageBonusPct: 18, critChancePct: 8 },
    description: 'Gleams with fiery malice, burning through enemy defenses.',
    thaiDescription: 'เปล่งประกายสีแดงชาด เผาผลาญเกราะศัตรูและเสริมพลังทำลายล้าง'
  },
  ring_ring_of_torment: {
    id: 'ring_ring_of_torment',
    name: 'Ring of Ancient Torment',
    thaiName: 'แหวนมหาทรมานโบราณกาล',
    slot: 'RING',
    rarity: 'unique',
    icon: '💍',
    stats: { damageBonusPct: 26, critChancePct: 14, pickupRadiusPct: 35 },
    description: 'Infused with the screams of a thousand fallen crusaders.',
    thaiDescription: 'ผนึกวิญญาณและความเจ็บปวดของนักรบโบราณนับพัน เพิ่มพลังโจมตีและคริติคอลถึงขีดสุด'
  },

  // AMULET
  amulet_talisman_health: {
    id: 'amulet_talisman_health',
    name: 'Pendant of Vigor',
    thaiName: 'เครื่องรางพลังชีวิต',
    slot: 'AMULET',
    rarity: 'common',
    icon: '📿',
    stats: { maxHp: 50 },
    description: 'Warm soothing stone pulsing in tune with a warrior heartbeat.',
    thaiDescription: 'หินอุ่นเสริมพลังชีพ ช่วยฟื้นฟูและเพิ่มขีดจำกัดเลือดสูงสุด'
  },
  amulet_heart_of_fire: {
    id: 'amulet_heart_of_fire',
    name: 'Heart of the Infernal',
    thaiName: 'หัวใจเพลิงอเวจี',
    slot: 'AMULET',
    rarity: 'rare',
    icon: '🔥',
    stats: { damageBonusPct: 22, attackSpeedPct: 12 },
    description: 'Forged in volcanic depths, stoking eternal inner fury.',
    thaiDescription: 'หลอมในก้นบึ้งภูเขาไฟ สุมไฟแค้นให้ลุกโชนโจมตีรวดเร็วและหนักหน่วง'
  },
  amulet_wellkeepers_pendant: {
    id: 'amulet_wellkeepers_pendant',
    name: "The Wellkeeper's Relic",
    thaiName: 'สร้อยโบราณผู้พิทักษ์บ่อน้ำ',
    slot: 'AMULET',
    rarity: 'unique',
    icon: '🏺',
    stats: { maxHp: 80, defense: 6, damageBonusPct: 20, moveSpeedPct: 15 },
    description: 'Gifted by the eternal hermit of the deep well, blessing the crusader with immortality.',
    thaiDescription: 'ของขวัญจากฤาษีแห่งบ่อน้ำลึก มอบการคุ้มครองและพลังไร้ขีดจำกัดแด่นักรบผู้กล้า'
  }
};

export function getGearItem(id: string): GearItem | undefined {
  return GEAR_CATALOG[id];
}
