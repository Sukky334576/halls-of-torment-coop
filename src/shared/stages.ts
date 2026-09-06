export interface StageDefinition {
  id: number;
  name: string;
  thaiName: string;
  description: string;
  themeColor: string;
  portalIcon: string;
  difficultyLabel: string;
  mobHpMultiplier: number;
  mobDmgMultiplier: number;
  expMultiplier: number;
  goldMultiplier: number;
  floorColorA: string;
  floorColorB: string;
  crackColor: string;
  mortarColor: string;
  ambientTint: string;
  unlockRequirement: number; // 0 for Stage 1, 1 for Stage 2, 2 for Stage 3
}

export const STAGES: Record<number, StageDefinition> = {
  1: {
    id: 1,
    name: 'The Haunted Catacombs',
    thaiName: 'สุสานวิญญาณหลอน',
    description: 'สุสานโบราณใต้ดินอันมืดมิด เต็มไปด้วยโครงกระดูกและซากศพคืนชีพ',
    themeColor: '#38bdf8',
    portalIcon: '💀',
    difficultyLabel: 'NORMAL (มาตรฐาน)',
    mobHpMultiplier: 1.0,
    mobDmgMultiplier: 1.0,
    expMultiplier: 1.0,
    goldMultiplier: 1.0,
    floorColorA: '#1a1e27',
    floorColorB: '#14171d',
    crackColor: '#0a0c10',
    mortarColor: '#080a0e',
    ambientTint: '#38bdf8',
    unlockRequirement: 0
  },
  2: {
    id: 2,
    name: 'The Infernal Caverns',
    thaiName: 'ถ้ำเพลิงอเวจี',
    description: 'ถ้ำลาวาใต้พิภพ มอนสเตอร์เดือดดาลและทนทานขึ้น 60% แต่ดรอปทองและ EXP มากกว่าเดิมเกือบเท่าตัว!',
    themeColor: '#f97316',
    portalIcon: '🔥',
    difficultyLabel: 'TORMENT I (นรกขั้น 1)',
    mobHpMultiplier: 1.6,
    mobDmgMultiplier: 1.4,
    expMultiplier: 1.6,
    goldMultiplier: 1.35,
    floorColorA: '#2a140e',
    floorColorB: '#1c0c08',
    crackColor: '#ff5400',
    mortarColor: '#3f1508',
    ambientTint: '#f97316',
    unlockRequirement: 1
  },
  3: {
    id: 3,
    name: 'The Obsidian Abyss',
    thaiName: 'ขุมนรกทมิฬศิลาดำ',
    description: 'มิติสูญสิ้นแห่งความมืดมิด มอนสเตอร์เลือดหนาและโจมตีรุนแรง 2.5 เท่า แต่รางวัลทองและ EXP มหาศาล!',
    themeColor: '#c084fc',
    portalIcon: '👁️',
    difficultyLabel: 'TORMENT II (นรกคลั่งขั้น 2)',
    mobHpMultiplier: 2.5,
    mobDmgMultiplier: 2.0,
    expMultiplier: 2.5,
    goldMultiplier: 1.75,
    floorColorA: '#1c0f2a',
    floorColorB: '#12081d',
    crackColor: '#9333ea',
    mortarColor: '#2b0c3f',
    ambientTint: '#a855f7',
    unlockRequirement: 2
  }
};
