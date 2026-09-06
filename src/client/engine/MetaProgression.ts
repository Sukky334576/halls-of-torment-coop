import { PlayerClass } from '../../shared/types';
import { CLASS_SKILL_TREES, SkillTreeNode } from '../../shared/skillTreeData';
import { GearSlot, GearItem, GEAR_CATALOG, getGearItem } from '../../shared/gearData';
import { TrialQuest, TRIAL_QUESTS, getTrialQuest } from '../../shared/trialQuests';

export interface HeroUnlockRequirement {
  id: PlayerClass;
  price: number;
  conditionType: 'KILLS' | 'DEATHS' | 'TOMES' | 'CLEAR_REALM_1' | 'CLEAR_REALM_2';
  requiredValue: number;
  labelTh: string;
  labelEn: string;
}

export const HERO_UNLOCK_REQUIREMENTS: Record<PlayerClass, HeroUnlockRequirement | null> = {
  [PlayerClass.SWORDSMAN]: null,
  [PlayerClass.ARCHER]: null,
  [PlayerClass.SORCERESS]: null,
  [PlayerClass.CLERIC]: null,
  [PlayerClass.COMMANDO]: {
    id: PlayerClass.COMMANDO,
    price: 2750,
    conditionType: 'KILLS',
    requiredValue: 2000,
    labelTh: 'สังหารมอนสเตอร์เกิน 2,000 ตัว',
    labelEn: 'Slain over 2,000 monsters'
  },
  [PlayerClass.CAT_TANK]: {
    id: PlayerClass.CAT_TANK,
    price: 3200,
    conditionType: 'DEATHS',
    requiredValue: 10,
    labelTh: 'ตายในสนามรบเกิน 10 ครั้ง',
    labelEn: 'Died over 10 times in battle'
  },
  [PlayerClass.COWBOY]: {
    id: PlayerClass.COWBOY,
    price: 4600,
    conditionType: 'TOMES',
    requiredValue: 30,
    labelTh: 'เก็บคัมภีร์เลื่อนขั้นครบ 30 เล่ม',
    labelEn: 'Collect 30 Tomes of Ascension'
  },
  [PlayerClass.GAMBLER]: {
    id: PlayerClass.GAMBLER,
    price: 7777,
    conditionType: 'CLEAR_REALM_1',
    requiredValue: 1,
    labelTh: 'พิชิตสุสานปีศาจ ด่านที่ 1 (Clear Realm 1)',
    labelEn: 'Clear Realm 1 (Haunted Catacombs)'
  },
  [PlayerClass.CELESTIAL_MECHA]: {
    id: PlayerClass.CELESTIAL_MECHA,
    price: 11111,
    conditionType: 'CLEAR_REALM_2',
    requiredValue: 2,
    labelTh: 'พิชิตถ้ำเพลิงอเวจี ด่านที่ 2 (Clear Realm 2)',
    labelEn: 'Clear Realm 2 (Infernal Caverns)'
  }
};

export interface TrialStats {
  totalKills: number;
  totalDeaths: number;
  tomesCollected: number;
  maxSurvivalSeconds: number;
  evolutionsCrafted: number;
  elementalReactionsTriggered: number;
  totalGoldCollected: number;
  stagesCleared: number[];
}

export interface MetaSaveData {
  coins: number;
  unlockedSkills: string[];
  allocatedNodes: string[];
  passiveTiers: Record<string, number>;
  highestStageUnlocked?: number;
  unlockedHeroes: PlayerClass[];

  // Pillar 1: Gear Vault
  vaultInventory: string[]; // item IDs
  equippedGear: Partial<Record<GearSlot, string>>; // slot -> item ID

  // Pillar 5: Hall of Trials
  trialStats: TrialStats;
  claimedTrialIds: string[];
  extraPotions: {
    rerolls: number;
    banishes: number;
    locks: number;
  };
}

export class MetaProgressionManager {
  private static STORAGE_KEY = 'torment_meta_save_v2';
  private data: MetaSaveData;

  constructor() {
    this.data = this.load();
    this.checkAndGrantAirdrop();
    this.recomputePassivesAndSignatures();
  }

  private checkAndGrantAirdrop(): void {
    const AIRDROP_KEY = 'torment_server_airdrop_35k_v2';
    try {
      if (!localStorage.getItem(AIRDROP_KEY)) {
        this.data.coins += 35000;
        this.data.trialStats.totalGoldCollected += 35000;
        this.save();
        localStorage.setItem(AIRDROP_KEY, 'claimed');
        console.log('🎁 Claimed server airdrop: +35,000 Gold Coins!');
      }
    } catch (e) {
      console.warn('Could not check airdrop key', e);
    }
  }

  public load(): MetaSaveData {
    try {
      const raw = localStorage.getItem(MetaProgressionManager.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const allocatedNodes: string[] = Array.isArray(parsed.allocatedNodes)
          ? parsed.allocatedNodes
          : [];

        // Roots default to allocated
        const defaultRoots = ['sw_root', 'so_root', 'ar_root', 'cl_root', 'uni_root'];
        for (const rootId of defaultRoots) {
          if (!allocatedNodes.includes(rootId)) {
            allocatedNodes.push(rootId);
          }
        }

        const vaultInventory = Array.isArray(parsed.vaultInventory) && parsed.vaultInventory.length > 0
          ? parsed.vaultInventory
          : ['helm_iron_visage', 'boots_leather_treads', 'ring_copper_band'];

        const equippedGear = typeof parsed.equippedGear === 'object' && parsed.equippedGear
          ? parsed.equippedGear
          : { HEAD: 'helm_iron_visage' };

        const defaultHeroes = [
          PlayerClass.SWORDSMAN,
          PlayerClass.ARCHER,
          PlayerClass.SORCERESS,
          PlayerClass.CLERIC
        ];
        const unlockedHeroes: PlayerClass[] = Array.isArray(parsed.unlockedHeroes) && parsed.unlockedHeroes.length > 0
          ? Array.from(new Set([...defaultHeroes, ...parsed.unlockedHeroes]))
          : defaultHeroes;

        const trialStats: TrialStats = {
          totalKills: parsed.trialStats?.totalKills || 0,
          totalDeaths: parsed.trialStats?.totalDeaths || 0,
          tomesCollected: parsed.trialStats?.tomesCollected || 0,
          maxSurvivalSeconds: parsed.trialStats?.maxSurvivalSeconds || 0,
          evolutionsCrafted: parsed.trialStats?.evolutionsCrafted || 0,
          elementalReactionsTriggered: parsed.trialStats?.elementalReactionsTriggered || 0,
          totalGoldCollected: parsed.trialStats?.totalGoldCollected || 0,
          stagesCleared: Array.isArray(parsed.trialStats?.stagesCleared) ? parsed.trialStats.stagesCleared : []
        };

        const claimedTrialIds: string[] = Array.isArray(parsed.claimedTrialIds) ? parsed.claimedTrialIds : [];

        const extraPotions = {
          rerolls: parsed.extraPotions?.rerolls || 0,
          banishes: parsed.extraPotions?.banishes || 0,
          locks: parsed.extraPotions?.locks || 0
        };

        return {
          coins: typeof parsed.coins === 'number' ? parsed.coins : 25,
          unlockedSkills: Array.isArray(parsed.unlockedSkills) ? parsed.unlockedSkills : [],
          allocatedNodes,
          passiveTiers: typeof parsed.passiveTiers === 'object' && parsed.passiveTiers ? parsed.passiveTiers : {},
          highestStageUnlocked: typeof parsed.highestStageUnlocked === 'number' ? Math.max(1, Math.min(3, parsed.highestStageUnlocked)) : 1,
          unlockedHeroes,
          vaultInventory,
          equippedGear,
          trialStats,
          claimedTrialIds,
          extraPotions
        };
      }
    } catch (e) {
      console.warn('Failed to load meta progression save, using defaults', e);
    }

    // Default: start with 25 coins, roots allocated, Stage 1 unlocked, starter gear in vault, 4 starter heroes
    const defaultData: MetaSaveData = {
      coins: 25,
      unlockedSkills: [],
      allocatedNodes: ['sw_root', 'so_root', 'ar_root', 'cl_root', 'uni_root'],
      passiveTiers: {},
      highestStageUnlocked: 1,
      unlockedHeroes: [
        PlayerClass.SWORDSMAN,
        PlayerClass.ARCHER,
        PlayerClass.SORCERESS,
        PlayerClass.CLERIC
      ],
      vaultInventory: ['helm_iron_visage', 'boots_leather_treads', 'ring_copper_band'],
      equippedGear: { HEAD: 'helm_iron_visage' },
      trialStats: {
        totalKills: 0,
        totalDeaths: 0,
        tomesCollected: 0,
        maxSurvivalSeconds: 0,
        evolutionsCrafted: 0,
        elementalReactionsTriggered: 0,
        totalGoldCollected: 0,
        stagesCleared: []
      },
      claimedTrialIds: [],
      extraPotions: { rerolls: 0, banishes: 0, locks: 0 }
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: MetaSaveData): void {
    try {
      localStorage.setItem(MetaProgressionManager.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save meta progression data', e);
    }
  }

  public save(): void {
    this.saveData(this.data);
  }

  public getCoins(): number {
    return this.data.coins;
  }

  public addCoins(amount: number): void {
    this.data.coins += Math.max(0, Math.round(amount));
    this.data.trialStats.totalGoldCollected += Math.max(0, Math.round(amount));
    this.save();
  }

  public canAfford(cost: number): boolean {
    return this.data.coins >= cost;
  }

  public isNodeAllocated(nodeId: string): boolean {
    return this.data.allocatedNodes.includes(nodeId);
  }

  public isSkillUnlocked(skillId: string): boolean {
    return this.data.unlockedSkills.includes(skillId);
  }

  public canAllocateNode(node: SkillTreeNode): { can: boolean; reason?: string } {
    if (this.isNodeAllocated(node.id)) {
      return { can: false, reason: 'Already Allocated' };
    }

    if (this.data.coins < node.cost) {
      return { can: false, reason: `Need ${node.cost} Coins (Defeat bosses & mobs)` };
    }

    // Check path connection: at least one adjacent connected node MUST be allocated!
    const hasConnectedAllocatedNeighbor = node.connections.some((neighborId) =>
      this.isNodeAllocated(neighborId)
    );

    if (!hasConnectedAllocatedNeighbor && node.type !== 'root') {
      return { can: false, reason: 'Locked: Must allocate an adjacent connected root node first' };
    }

    return { can: true };
  }

  public allocateNode(node: SkillTreeNode): boolean {
    const check = this.canAllocateNode(node);
    if (!check.can) return false;

    this.data.coins -= node.cost;
    this.data.allocatedNodes.push(node.id);

    // If signature skill, add to unlockedSkills for in-game level-up blessings
    if (node.signatureSkillId && !this.data.unlockedSkills.includes(node.signatureSkillId)) {
      this.data.unlockedSkills.push(node.signatureSkillId);
    }

    // Recompute total passive bonuses from all allocated nodes
    this.recomputePassivesAndSignatures();
    this.save();
    return true;
  }

  public recomputePassivesAndSignatures(): void {
    const statsTotal: Record<string, number> = {};
    const signatures: Set<string> = new Set(this.data.unlockedSkills);

    for (const tree of Object.values(CLASS_SKILL_TREES)) {
      for (const node of Object.values(tree.nodes)) {
        if (this.data.allocatedNodes.includes(node.id)) {
          if (node.signatureSkillId) {
            signatures.add(node.signatureSkillId);
          }
          if (node.stats) {
            for (const [key, val] of Object.entries(node.stats)) {
              statsTotal[key] = (statsTotal[key] || 0) + (val || 0);
            }
          }
        }
      }
    }

    this.data.unlockedSkills = Array.from(signatures);
    this.data.passiveTiers = statsTotal;
  }

  public getUnlockedSkillIds(): string[] {
    return [...this.data.unlockedSkills];
  }

  public getAllocatedNodeIds(): string[] {
    return [...this.data.allocatedNodes];
  }

  public getPassiveTiers(): Record<string, number> {
    return { ...this.data.passiveTiers };
  }

  // ==========================================
  // PILLAR 1: GEAR VAULT & EXTRACTION
  // ==========================================
  public getVaultInventory(): GearItem[] {
    return this.data.vaultInventory
      .map((id) => getGearItem(id))
      .filter((g): g is GearItem => !!g);
  }

  public getEquippedGear(): Partial<Record<GearSlot, GearItem>> {
    const res: Partial<Record<GearSlot, GearItem>> = {};
    for (const [slot, id] of Object.entries(this.data.equippedGear)) {
      if (id) {
        const item = getGearItem(id);
        if (item) res[slot as GearSlot] = item;
      }
    }
    return res;
  }

  public equipGear(slot: GearSlot, itemId: string): boolean {
    const item = getGearItem(itemId);
    if (!item || item.slot !== slot) return false;
    this.data.equippedGear[slot] = itemId;
    this.save();
    return true;
  }

  public unequipGear(slot: GearSlot): boolean {
    if (this.data.equippedGear[slot]) {
      delete this.data.equippedGear[slot];
      this.save();
      return true;
    }
    return false;
  }

  public addGearToVault(itemId: string): boolean {
    const item = getGearItem(itemId);
    if (!item) return false;
    this.data.vaultInventory.push(itemId);
    this.save();
    return true;
  }

  public getEquippedStatsTotal(): Record<string, number> {
    const totals: Record<string, number> = {
      flatMaxHp: 0,
      flatDefense: 0,
      flatMoveSpeedPct: 0,
      flatPickupRadiusPct: 0,
      flatDamageBonusPct: 0,
      flatCritChancePct: 0,
      flatAttackSpeedPct: 0
    };

    for (const itemId of Object.values(this.data.equippedGear)) {
      if (!itemId) continue;
      const item = getGearItem(itemId);
      if (!item) continue;
      if (item.stats.maxHp) totals.flatMaxHp += item.stats.maxHp;
      if (item.stats.defense) totals.flatDefense += item.stats.defense;
      if (item.stats.moveSpeedPct) totals.flatMoveSpeedPct += item.stats.moveSpeedPct;
      if (item.stats.pickupRadiusPct) totals.flatPickupRadiusPct += item.stats.pickupRadiusPct;
      if (item.stats.damageBonusPct) totals.flatDamageBonusPct += item.stats.damageBonusPct;
      if (item.stats.critChancePct) totals.flatCritChancePct += item.stats.critChancePct;
      if (item.stats.attackSpeedPct) totals.flatAttackSpeedPct += item.stats.attackSpeedPct;
    }

    return totals;
  }

  public getPassiveTiersForClass(playerClass: PlayerClass): Record<string, number> {
    const statsTotal: Record<string, number> = {
      flatMaxHp: 0,
      flatDefense: 0,
      flatMoveSpeedPct: 0,
      flatPickupRadiusPct: 0,
      flatDamageBonusPct: 0,
      flatExpMultiplierPct: 0,
      flatCritChancePct: 0,
      flatAttackSpeedPct: 0
    };

    // 1. Class-Specific Tree Passives
    const tree = CLASS_SKILL_TREES[playerClass];
    if (tree) {
      for (const node of Object.values(tree.nodes)) {
        if (this.data.allocatedNodes.includes(node.id)) {
          if (node.stats?.maxHp) statsTotal.flatMaxHp += node.stats.maxHp;
          if (node.stats?.defense) statsTotal.flatDefense += node.stats.defense;
          if (node.stats?.moveSpeed) statsTotal.flatMoveSpeedPct += node.stats.moveSpeed * 6;
          if (node.stats?.pickupRadius) statsTotal.flatPickupRadiusPct += node.stats.pickupRadius * 25;
          if (node.stats?.damageBonus) statsTotal.flatDamageBonusPct += node.stats.damageBonus * 8;
        }
      }
    }

    // 2. Universal Central Tree Passives (Shared across all heroes!)
    const uniTree = CLASS_SKILL_TREES['universal'];
    if (uniTree) {
      for (const node of Object.values(uniTree.nodes)) {
        if (this.data.allocatedNodes.includes(node.id)) {
          if (node.stats?.expMultiplier) statsTotal.flatExpMultiplierPct += node.stats.expMultiplier;
          if (node.stats?.maxHp) statsTotal.flatMaxHp += node.stats.maxHp;
          if (node.stats?.defense) statsTotal.flatDefense += node.stats.defense;
          if (node.stats?.moveSpeed) statsTotal.flatMoveSpeedPct += node.stats.moveSpeed * 6;
          if (node.stats?.pickupRadius) statsTotal.flatPickupRadiusPct += node.stats.pickupRadius * 25;
          if (node.stats?.damageBonus) statsTotal.flatDamageBonusPct += node.stats.damageBonus * 8;
        }
      }
    }

    // 3. Add Equipped Gear Vault Stats!
    const gearStats = this.getEquippedStatsTotal();
    statsTotal.flatMaxHp += gearStats.flatMaxHp;
    statsTotal.flatDefense += gearStats.flatDefense;
    statsTotal.flatMoveSpeedPct += gearStats.flatMoveSpeedPct;
    statsTotal.flatPickupRadiusPct += gearStats.flatPickupRadiusPct;
    statsTotal.flatDamageBonusPct += gearStats.flatDamageBonusPct;
    statsTotal.flatCritChancePct += gearStats.flatCritChancePct;
    statsTotal.flatAttackSpeedPct += gearStats.flatAttackSpeedPct;

    // 4. Add Extra Starting Potions from Trials!
    const extraPotions = this.getExtraPotions();
    statsTotal.extraRerolls = extraPotions.rerolls;
    statsTotal.extraBanishes = extraPotions.banishes;
    statsTotal.extraLocks = extraPotions.locks;

    return statsTotal;
  }

  // ==========================================
  // PILLAR 5: HALL OF TRIALS
  // ==========================================
  public getTrialStats(): TrialStats {
    return { ...this.data.trialStats };
  }

  public recordRunResults(
    kills: number,
    survivalSeconds: number,
    gold: number,
    evolutions: number,
    combos: number,
    clearedStageId?: number
  ): void {
    this.data.trialStats.totalKills += Math.max(0, kills);
    this.data.trialStats.maxSurvivalSeconds = Math.max(
      this.data.trialStats.maxSurvivalSeconds,
      survivalSeconds
    );
    this.data.trialStats.totalGoldCollected += Math.max(0, gold);
    this.data.trialStats.evolutionsCrafted += Math.max(0, evolutions);
    this.data.trialStats.elementalReactionsTriggered += Math.max(0, combos);

    if (clearedStageId && !this.data.trialStats.stagesCleared.includes(clearedStageId)) {
      this.data.trialStats.stagesCleared.push(clearedStageId);
    }
    this.save();
  }

  public isTrialClaimed(trialId: string): boolean {
    return this.data.claimedTrialIds.includes(trialId);
  }

  public getTrialCurrentProgress(quest: TrialQuest): number {
    switch (quest.goalType) {
      case 'KILLS': return this.data.trialStats.totalKills;
      case 'SURVIVE_TIME': return this.data.trialStats.maxSurvivalSeconds;
      case 'EVOLUTIONS': return this.data.trialStats.evolutionsCrafted;
      case 'ELEMENTAL_COMBOS': return this.data.trialStats.elementalReactionsTriggered;
      case 'GOLD_COLLECTED': return this.data.trialStats.totalGoldCollected;
      case 'STAGE_CLEARED': return this.data.trialStats.stagesCleared.length;
      default: return 0;
    }
  }

  public isTrialCompleted(quest: TrialQuest): boolean {
    return this.getTrialCurrentProgress(quest) >= quest.target;
  }

  public claimTrial(trialId: string): { success: boolean; rewardLabel: string } {
    const quest = getTrialQuest(trialId);
    if (!quest) return { success: false, rewardLabel: 'Unknown Trial' };
    if (this.isTrialClaimed(trialId)) return { success: false, rewardLabel: 'Already Claimed' };
    if (!this.isTrialCompleted(quest)) return { success: false, rewardLabel: 'Goal Not Met' };

    this.data.claimedTrialIds.push(trialId);

    // Grant Reward
    if (quest.rewardType === 'GOLD') {
      this.addCoins(quest.rewardValue as number);
    } else if (quest.rewardType === 'GEAR') {
      this.addGearToVault(quest.rewardValue as string);
    } else if (quest.rewardType === 'POTION_REROLL') {
      this.data.extraPotions.rerolls += quest.rewardValue as number;
    } else if (quest.rewardType === 'POTION_BANISH') {
      this.data.extraPotions.banishes += quest.rewardValue as number;
    } else if (quest.rewardType === 'POTION_LOCK') {
      this.data.extraPotions.locks += quest.rewardValue as number;
    }

    this.save();
    return { success: true, rewardLabel: quest.rewardLabel };
  }

  public getExtraPotions(): { rerolls: number; banishes: number; locks: number } {
    return { ...this.data.extraPotions };
  }

  public getClaimableTrialsCount(): number {
    return TRIAL_QUESTS.filter((q) => this.isTrialCompleted(q) && !this.isTrialClaimed(q.id)).length;
  }

  public getHighestStageUnlocked(): number {
    return this.data.highestStageUnlocked || 1;
  }

  public isStageUnlocked(stageId: number): boolean {
    if (stageId === 1) return true;
    return stageId <= (this.data.highestStageUnlocked || 1);
  }

  public unlockStage(stageId: number): void {
    const current = this.data.highestStageUnlocked || 1;
    if (stageId > current && stageId <= 3) {
      this.data.highestStageUnlocked = stageId;
      this.saveData(this.data);
      console.log(`🏆 NEW REALM UNLOCKED: Stage ${stageId}!`);
    }
  }

  // --- Hero Unlock & Shop Progression ---
  public isHeroUnlocked(heroClass: PlayerClass): boolean {
    if (
      heroClass === PlayerClass.SWORDSMAN ||
      heroClass === PlayerClass.ARCHER ||
      heroClass === PlayerClass.SORCERESS ||
      heroClass === PlayerClass.CLERIC
    ) {
      return true;
    }
    return (this.data.unlockedHeroes || []).includes(heroClass);
  }

  public getHeroUnlockRequirement(heroClass: PlayerClass): HeroUnlockRequirement | null {
    return HERO_UNLOCK_REQUIREMENTS[heroClass] || null;
  }

  public canBuyHero(heroClass: PlayerClass): {
    canBuy: boolean;
    conditionMet: boolean;
    currentVal: number;
    targetVal: number;
    reasonTh: string;
    reasonEn: string;
    price: number;
  } {
    const req = this.getHeroUnlockRequirement(heroClass);
    if (!req) {
      return { canBuy: true, conditionMet: true, currentVal: 1, targetVal: 1, reasonTh: '', reasonEn: '', price: 0 };
    }

    let currentVal = 0;
    let targetVal = req.requiredValue;
    let conditionMet = false;

    if (req.conditionType === 'KILLS') {
      currentVal = this.data.trialStats.totalKills;
      conditionMet = currentVal >= targetVal;
    } else if (req.conditionType === 'DEATHS') {
      currentVal = this.data.trialStats.totalDeaths || 0;
      conditionMet = currentVal >= targetVal;
    } else if (req.conditionType === 'TOMES') {
      currentVal = this.data.trialStats.tomesCollected || 0;
      conditionMet = currentVal >= targetVal;
    } else if (req.conditionType === 'CLEAR_REALM_1') {
      conditionMet = (this.data.highestStageUnlocked || 1) >= 2 || (this.data.trialStats.stagesCleared || []).includes(1);
      currentVal = conditionMet ? 1 : 0;
      targetVal = 1;
    } else if (req.conditionType === 'CLEAR_REALM_2') {
      conditionMet = (this.data.highestStageUnlocked || 1) >= 3 || (this.data.trialStats.stagesCleared || []).includes(2);
      currentVal = conditionMet ? 1 : 0;
      targetVal = 1;
    }

    const hasEnoughCoins = this.data.coins >= req.price;
    const canBuy = conditionMet && hasEnoughCoins;

    return {
      canBuy,
      conditionMet,
      currentVal,
      targetVal,
      reasonTh: req.labelTh,
      reasonEn: req.labelEn,
      price: req.price
    };
  }

  public buyHero(heroClass: PlayerClass): boolean {
    if (this.isHeroUnlocked(heroClass)) return true;
    const status = this.canBuyHero(heroClass);
    if (!status.canBuy) return false;

    this.data.coins -= status.price;
    if (!this.data.unlockedHeroes) {
      this.data.unlockedHeroes = [
        PlayerClass.SWORDSMAN,
        PlayerClass.ARCHER,
        PlayerClass.SORCERESS,
        PlayerClass.CLERIC
      ];
    }
    this.data.unlockedHeroes.push(heroClass);
    this.save();
    return true;
  }

  public recordHeroDeath(): void {
    this.data.trialStats.totalDeaths = (this.data.trialStats.totalDeaths || 0) + 1;
    this.save();
  }

  public recordTomeCollected(): void {
    this.data.trialStats.tomesCollected = (this.data.trialStats.tomesCollected || 0) + 1;
    this.save();
  }
}

export const MetaProgression = new MetaProgressionManager();
