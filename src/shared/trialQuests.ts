export type TrialGoalType =
  | 'KILLS'
  | 'SURVIVE_TIME'
  | 'EVOLUTIONS'
  | 'ELEMENTAL_COMBOS'
  | 'GOLD_COLLECTED'
  | 'STAGE_CLEARED';

export type TrialRewardType = 'GOLD' | 'GEAR' | 'POTION_REROLL' | 'POTION_BANISH' | 'POTION_LOCK';

export interface TrialQuest {
  id: string;
  title: string;
  thaiTitle: string;
  desc: string;
  thaiDesc: string;
  icon: string;
  goalType: TrialGoalType;
  target: number;
  rewardType: TrialRewardType;
  rewardValue: number | string;
  rewardLabel: string;
  thaiRewardLabel: string;
}

export const TRIAL_QUESTS: TrialQuest[] = [
  {
    id: 'trial_slayer_100',
    title: 'Slayer of the Crypt',
    thaiTitle: 'ผู้สยบสุสานกระดูก',
    desc: 'Slay 100 monsters throughout your crusades.',
    thaiDesc: 'กำจัดปีศาจสะสมให้ครบ 100 ตัวในสมรภูมิ',
    icon: '💀',
    goalType: 'KILLS',
    target: 100,
    rewardType: 'GOLD',
    rewardValue: 40,
    rewardLabel: '+40 Gold Coins',
    thaiRewardLabel: '+40 เหรียญทอง'
  },
  {
    id: 'trial_slayer_500',
    title: 'Master of the Horde',
    thaiTitle: 'จอมบดขยี้ฝูงอสูร',
    desc: 'Slay 500 monsters across any runs.',
    thaiDesc: 'กำจัดปีศาจสะสมให้ครบ 500 ตัว',
    icon: '⚔️',
    goalType: 'KILLS',
    target: 500,
    rewardType: 'GEAR',
    rewardValue: 'ring_ruby_eye',
    rewardLabel: 'Rare Gear: Ruby Eye Ring',
    thaiRewardLabel: 'ไอเทมระดับแรร์: แหวนเนตรทับทิมโลหิต'
  },
  {
    id: 'trial_survivor_5m',
    title: 'Endure the Torment',
    thaiTitle: 'ผู้ยืนหยัดในแดนทรมาน',
    desc: 'Survive at least 300 seconds (5 minutes) in a single battle.',
    thaiDesc: 'เอาชีวิตรอดในสนามรบให้ได้อย่างน้อย 300 วินาที (5 นาที)',
    icon: '⏳',
    goalType: 'SURVIVE_TIME',
    target: 300,
    rewardType: 'POTION_REROLL',
    rewardValue: 1,
    rewardLabel: '+1 Starting Reroll Potion',
    thaiRewardLabel: '+1 น้ำยารีโรลเริ่มต้น (ถาวร)'
  },
  {
    id: 'trial_survivor_10m',
    title: 'Defier of Death',
    thaiTitle: 'ผู้ท้าทายความตาย',
    desc: 'Survive at least 600 seconds (10 minutes) in a single battle.',
    thaiDesc: 'เอาชีวิตรอดในสนามรบให้ได้อย่างน้อย 600 วินาที (10 นาที)',
    icon: '🛡️',
    goalType: 'SURVIVE_TIME',
    target: 600,
    rewardType: 'POTION_BANISH',
    rewardValue: 1,
    rewardLabel: '+1 Starting Banish Potion',
    thaiRewardLabel: '+1 น้ำยาแบนการ์ดเริ่มต้น (ถาวร)'
  },
  {
    id: 'trial_evolution',
    title: 'Weapon Transmutation',
    thaiTitle: 'การจุติแห่งศาสตรา',
    desc: 'Successfully awaken and forge any Mythic Weapon Evolution.',
    thaiDesc: 'วิวัฒนาการอาวุธระดับ Mythic จุติสำเร็จอย่างน้อย 1 ครั้ง',
    icon: '⚡',
    goalType: 'EVOLUTIONS',
    target: 1,
    rewardType: 'GEAR',
    rewardValue: 'amulet_wellkeepers_pendant',
    rewardLabel: "Unique Gear: The Wellkeeper's Relic",
    thaiRewardLabel: 'ไอเทมระดับยูนีค: สร้อยโบราณผู้พิทักษ์บ่อน้ำ'
  },
  {
    id: 'trial_elemental_20',
    title: 'Elemental Resonance Master',
    thaiTitle: 'จอมมนตราธาตุประสาน',
    desc: 'Trigger 20 Elemental Reactions (Shatter, Bloodflame, Superconduct, Conflagration).',
    thaiDesc: 'ทำคอมโบปฏิกิริยาธาตุสะสมครบ 20 ครั้ง',
    icon: '💥',
    goalType: 'ELEMENTAL_COMBOS',
    target: 20,
    rewardType: 'POTION_LOCK',
    rewardValue: 1,
    rewardLabel: '+1 Starting Lock Potion',
    thaiRewardLabel: '+1 น้ำยาล็อกการ์ดเริ่มต้น (ถาวร)'
  },
  {
    id: 'trial_gold_50',
    title: 'Wealth of the Damned',
    thaiTitle: 'ขุมทรัพย์คนบาป',
    desc: 'Accumulate a total of 50 gold coins.',
    thaiDesc: 'เก็บสะสมเหรียญทองรวม 50 เหรียญ',
    icon: '💰',
    goalType: 'GOLD_COLLECTED',
    target: 50,
    rewardType: 'GOLD',
    rewardValue: 60,
    rewardLabel: '+60 Gold Coins',
    thaiRewardLabel: '+60 เหรียญทอง'
  },
  {
    id: 'trial_stage_cleared',
    title: 'Lord of Torment Vanquisher',
    thaiTitle: 'ผู้พิชิตจอมปีศาจแห่งความทรมาน',
    desc: 'Defeat the final boss of Stage 1 or higher.',
    thaiDesc: 'เอาชนะบอสใหญ่ประจำด่านที่ 1 หรือสูงกว่า',
    icon: '👑',
    goalType: 'STAGE_CLEARED',
    target: 1,
    rewardType: 'GEAR',
    rewardValue: 'chest_aegis_titan',
    rewardLabel: "Unique Gear: Titan's Bastion Cuirass",
    thaiRewardLabel: 'ไอเทมระดับยูนีค: เกราะอกป้อมปราการไททัน'
  }
];

export function getTrialQuest(id: string): TrialQuest | undefined {
  return TRIAL_QUESTS.find((q) => q.id === id);
}
