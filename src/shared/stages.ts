import { PropInstance } from './types';
import { GAME_CONSTANTS } from './constants';

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
    description: 'ถ้ำลาวาใต้พิภพ มอนสเตอร์เดือดดาลและทนทานขึ้น 60% แต่ดรอปเหรียญวิญญาณและ EXP มากกว่าเดิมเกือบเท่าตัว!',
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
    description: 'มิติสูญสิ้นแห่งความมืดมิด มอนสเตอร์เลือดหนาและโจมตีรุนแรง 2.5 เท่า แต่รางวัลเหรียญวิญญาณและ EXP มหาศาล!',
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

const PROP_KIND_RADIUS: Record<PropInstance['kind'], number> = {
  PILLAR: 30,
  SPIKE: 22,
  RUBBLE: 26
};
const PROP_KINDS: PropInstance['kind'][] = ['PILLAR', 'SPIKE', 'RUBBLE'];
const PROPS_PER_STAGE = 22;
const SPAWN_CLEARANCE_RADIUS = 350; // Keep the player start area near the origin free of obstacles.
const PROP_MIN_SPACING = 90; // Avoid props overlapping each other.

/** Deterministic PRNG (mulberry32) so the same stage always scatters props identically. */
function mulberry32(seed: number): () => number {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Scatters a fixed set of collidable dungeon obstacles around a stage's arena. Deterministic
 * per stageId — the same stage always lays out the same props, no per-run randomness to sync.
 */
export function generateStageProps(stageId: number): PropInstance[] {
  const rand = mulberry32(stageId * 9973 + 17);
  const half = GAME_CONSTANTS.MAP_SIZE / 2 - 150; // Inset from the outer wall.
  const props: PropInstance[] = [];

  let attempts = 0;
  while (props.length < PROPS_PER_STAGE && attempts < PROPS_PER_STAGE * 20) {
    attempts++;
    const x = (rand() * 2 - 1) * half;
    const y = (rand() * 2 - 1) * half;

    if (Math.hypot(x, y) < SPAWN_CLEARANCE_RADIUS) continue;

    const kind = PROP_KINDS[Math.floor(rand() * PROP_KINDS.length)];
    const radius = PROP_KIND_RADIUS[kind];

    const overlapsExisting = props.some(
      (p) => Math.hypot(p.x - x, p.y - y) < p.radius + radius + PROP_MIN_SPACING
    );
    if (overlapsExisting) continue;

    props.push({ id: props.length + 1, kind, x, y, radius });
  }

  return props;
}
