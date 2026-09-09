import { PlayerClass } from '../../shared/types';
import { CLASS_SKILL_TREES, SkillTreeNode, ClassSkillTree, StatModType } from '../../shared/skillTreeData';
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

/**
 * Skill tree nodes store small "points" per stat (e.g. `moveSpeed: 0.5` on a minor node).
 * These are the fixed multipliers that convert a node's raw stat point into the percentage
 * bonus actually applied to the matching PlayerStats field — chosen once during tree
 * balancing, kept here as named constants instead of bare numbers scattered across
 * getPassiveTiersForClass(). maxHp, defense, expMultiplier, and tierLuck pass through
 * unscaled (1 point = 1 unit) and aren't listed since there's nothing to name.
 */
const STAT_SCALE_FACTORS = {
  moveSpeed: 6, // e.g. a 0.5-point node grants +3% move speed (0.5 * 6)
  pickupRadius: 25, // e.g. a 0.5-point node grants +12.5% pickup radius (0.5 * 25)
  damageBonus: 8 // e.g. a 0.5-point node grants +4% damage bonus (0.5 * 8)
} as const;

/**
 * A Vampire-Survivors-style build stacks far more items/nodes than a PoE build ever stacks
 * keystones, so an uncapped product of 'more' modifiers on one stat would compound out of
 * control fast (four +20% 'more' mods already multiply to 1.2^4 ≈ 2.07x). This caps how many
 * 'more' modifiers on the SAME stat count toward the product — extra ones beyond this are
 * ignored (not refunded, not blocked from allocating, just inert) with a console warning,
 * rather than silently or unpredictably breaking build math.
 */
export const MAX_MORE_MODIFIERS_PER_STAT = 4;

/**
 * Combines a stat's 'increased' and 'more' contributions PoE-style: every 'increased'
 * value pools additively into one bucket and is applied once, then multiplied by each
 * 'more' modifier as its own separate multiplicative layer — final = base * (1 +
 * sum(increased)/100) * product(more). Returns a single equivalent percentage so the
 * existing `base *= (1 + pct/100)` call sites in ServerPlayer.ts don't need to change.
 *
 * When there are no 'more' modifiers this returns `increasedSum` completely unchanged
 * (no arithmetic round-trip at all) — every node today is 'increased' by default, so this
 * is what keeps every existing build's numbers bit-for-bit identical to before this system
 * existed, not just numerically close.
 */
export function combineIncreasedAndMore(increasedSum: number, moreMultipliers: number[]): number {
  if (moreMultipliers.length === 0) return increasedSum;

  let capped = moreMultipliers;
  if (moreMultipliers.length > MAX_MORE_MODIFIERS_PER_STAT) {
    console.warn(
      `[SkillTree] ${moreMultipliers.length} 'more' modifiers stacked on one stat — ` +
      `capping at ${MAX_MORE_MODIFIERS_PER_STAT} to prevent power creep. Extras are ignored.`
    );
    capped = moreMultipliers.slice(0, MAX_MORE_MODIFIERS_PER_STAT);
  }

  const moreProduct = capped.reduce((product, multiplier) => product * multiplier, 1);
  return ((1 + increasedSum / 100) * moreProduct - 1) * 100;
}

export const ALL_PLAYABLE_HEROES: PlayerClass[] = [
  PlayerClass.SWORDSMAN,
  PlayerClass.ARCHER,
  PlayerClass.SORCERESS,
  PlayerClass.CLERIC,
  PlayerClass.COMMANDO,
  PlayerClass.CAT_TANK,
  PlayerClass.COWBOY,
  PlayerClass.CELESTIAL_MECHA,
  PlayerClass.GAMBLER
];

export class MetaProgressionManager {
  private static STORAGE_KEY = 'torment_meta_save_v2';
  private data: MetaSaveData;

  constructor() {
    this.data = this.load();
    // Ensure all 9 heroes are unlocked for testing immediately
    this.data.unlockedHeroes = [...ALL_PLAYABLE_HEROES];
    this.save();
    this.checkAndGrantAirdrop();
    this.recomputeSignatures();
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

        const unlockedHeroes: PlayerClass[] = [...ALL_PLAYABLE_HEROES];

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
      highestStageUnlocked: 1,
      unlockedHeroes: [...ALL_PLAYABLE_HEROES],
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

    if (node.classType !== 'universal' && !this.isHeroUnlocked(node.classType)) {
      return { can: false, reason: 'Unlock this hero first' };
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
    this.recomputeSignatures();
    this.save();
    return true;
  }

  private findNodeInAnyTree(nodeId: string): SkillTreeNode | undefined {
    for (const tree of Object.values(CLASS_SKILL_TREES)) {
      if (tree.nodes[nodeId]) return tree.nodes[nodeId];
    }
    return undefined;
  }

  /** BFS from a tree's root through a given set of allocated node ids, following `connections`. */
  private reachableFromRoot(tree: ClassSkillTree, allocatedIds: Set<string>): Set<string> {
    const reachable = new Set<string>([tree.rootId]);
    const queue = [tree.rootId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = tree.nodes[currentId];
      if (!current) continue;
      for (const neighborId of current.connections) {
        if (allocatedIds.has(neighborId) && !reachable.has(neighborId)) {
          reachable.add(neighborId);
          queue.push(neighborId);
        }
      }
    }
    return reachable;
  }

  /**
   * A node can be freely un-invested as long as removing it doesn't cut off another
   * currently-allocated node's path back to the tree's root — mirrors how a passive-skill
   * web (e.g. Path of Exile's) lets you respec freely from the outside in, but blocks
   * yanking out a node that's propping up picks further down the line.
   *
   * Compares reachability BEFORE vs. AFTER removing the node, rather than requiring full
   * reachability of the whole current allocation: older save data can carry allocations
   * from a since-rebalanced tree shape that were never strictly connected node-by-node
   * under today's `connections` graph, and those pre-existing gaps shouldn't block a player
   * from un-investing an unrelated, cleanly-connected node elsewhere in the same tree.
   */
  public canUnallocateNode(nodeId: string): { can: boolean; reason?: string } {
    if (!this.isNodeAllocated(nodeId)) {
      return { can: false, reason: 'Not allocated' };
    }
    const node = this.findNodeInAnyTree(nodeId);
    if (!node) return { can: false, reason: 'Unknown node' };
    if (node.type === 'root') return { can: false, reason: 'Cannot un-invest the origin root' };

    const tree = CLASS_SKILL_TREES[node.classType];
    if (!tree) return { can: false, reason: 'Unknown tree' };

    const allocatedInTree = new Set(this.data.allocatedNodes.filter((id) => tree.nodes[id]));
    const reachableBefore = this.reachableFromRoot(tree, allocatedInTree);

    const allocatedWithoutNode = new Set(allocatedInTree);
    allocatedWithoutNode.delete(nodeId);
    const reachableAfter = this.reachableFromRoot(tree, allocatedWithoutNode);

    const orphaned = [...reachableBefore].filter((id) => id !== nodeId && !reachableAfter.has(id));
    if (orphaned.length > 0) {
      return {
        can: false,
        reason: `${orphaned.length} skill${orphaned.length > 1 ? 's' : ''} further down this path depend on it — un-invest those first`
      };
    }
    return { can: true };
  }

  /** 70% of a node's gold cost comes back on respec — a real choice, not a free do-over. */
  public static readonly RESPEC_REFUND_RATE = 0.7;

  public getRespecRefundAmount(cost: number): number {
    // Math.round rather than Math.floor: floating-point multiplication (e.g. 360 * 0.7 ===
    // 251.99999999999997) would otherwise silently shortchange the player by 1 coin.
    return Math.round(cost * MetaProgressionManager.RESPEC_REFUND_RATE);
  }

  /** Refunds 70% of the node's gold cost and frees the point. See canUnallocateNode() for the rule. */
  public unallocateNode(nodeId: string): boolean {
    const check = this.canUnallocateNode(nodeId);
    if (!check.can) return false;
    const node = this.findNodeInAnyTree(nodeId);
    if (!node) return false;

    this.data.coins += this.getRespecRefundAmount(node.cost);
    this.data.allocatedNodes = this.data.allocatedNodes.filter((id) => id !== nodeId);

    // Signature skills earned via a node stay unlocked in the in-game level-up pool even
    // after a respec — matches how unlockedSkills is treated everywhere else as a permanent
    // "you've proven this build once" ledger, not a live mirror of currently-allocated nodes.
    this.recomputeSignatures();
    this.save();
    return true;
  }

  /**
   * Scans every allocated node across all trees and records which signature abilities
   * (for the in-game level-up blessing pool) they've unlocked. Stat totals are NOT computed
   * here — that's getPassiveTiersForClass()'s job, computed fresh per-class on demand rather
   * than cached on this.data, since a stale cached copy was never actually read by anything.
   */
  public recomputeSignatures(): void {
    const signatures: Set<string> = new Set(this.data.unlockedSkills);

    for (const tree of Object.values(CLASS_SKILL_TREES)) {
      for (const node of Object.values(tree.nodes)) {
        if (this.data.allocatedNodes.includes(node.id) && node.signatureSkillId) {
          signatures.add(node.signatureSkillId);
        }
      }
    }

    this.data.unlockedSkills = Array.from(signatures);
  }

  public getUnlockedSkillIds(): string[] {
    return [...this.data.unlockedSkills];
  }

  public getAllocatedNodeIds(): string[] {
    return [...this.data.allocatedNodes];
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

  /**
   * Combined tree + gear stat contributions for a class, keyed by the SAME field names as
   * PlayerStats (types.ts) so ServerPlayer.ts can apply each one without a name-translation
   * step. Values are still deltas/contributions to add or scale into the base stat, not
   * finished PlayerStats values — see STAT_SCALE_FACTORS for the conversion each one needs.
   * extraRerolls/extraBanishes/extraLocks ride along on the same object for historical
   * reasons but aren't PlayerStats fields; ServerPlayer.ts reads them separately.
   *
   * moveSpeed/pickupRadius/damageBonus/expMultiplier go through the increased/more modifier
   * system (see combineIncreasedAndMore) since they're percentage bonuses to an underlying
   * multiplier. maxHp/defense/tierLuck stay plain flat sums regardless of a node's modType —
   * they're absolute point values in this game (not a percentage of a base), so "multiply
   * this flat +10 HP by another modifier" has no well-defined meaning the way it does for a
   * percentage stat; a node putting 'more' on one of these three is simply treated as flat.
   */
  public getPassiveTiersForClass(playerClass: PlayerClass): Record<string, number> {
    const statsTotal: Record<string, number> = {
      maxHp: 0,
      defense: 0,
      moveSpeed: 0,
      pickupRadius: 0,
      damageBonus: 0,
      expMultiplier: 0,
      critChance: 0,
      attackSpeed: 0,
      tierLuck: 0
    };

    // Per-stat buckets for the increased/more combination — populated across BOTH the
    // class tree and the universal tree before being combined once at the end, so a
    // 'more' modifier in one tree still stacks correctly against 'increased' nodes in
    // the other (they're one shared pool per stat, not per-tree).
    type PctBucket = { increasedSum: number; moreMultipliers: number[] };
    const newBucket = (): PctBucket => ({ increasedSum: 0, moreMultipliers: [] });
    const pct = {
      moveSpeed: newBucket(),
      pickupRadius: newBucket(),
      damageBonus: newBucket(),
      expMultiplier: newBucket()
    };
    const addPct = (bucket: PctBucket, rawPoints: number, scale: number, modType: StatModType) => {
      const amount = rawPoints * scale;
      if (modType === 'more') bucket.moreMultipliers.push(1 + amount / 100);
      else bucket.increasedSum += amount;
    };

    const addTreeNodes = (tree: ClassSkillTree | undefined) => {
      if (!tree) return;
      for (const node of Object.values(tree.nodes)) {
        if (!this.data.allocatedNodes.includes(node.id)) continue;
        if (node.stats?.maxHp) statsTotal.maxHp += node.stats.maxHp;
        if (node.stats?.defense) statsTotal.defense += node.stats.defense;
        if (node.stats?.tierLuck) statsTotal.tierLuck += node.stats.tierLuck;

        const modType: StatModType = node.modType ?? 'increased';
        if (node.stats?.moveSpeed) addPct(pct.moveSpeed, node.stats.moveSpeed, STAT_SCALE_FACTORS.moveSpeed, modType);
        if (node.stats?.pickupRadius) addPct(pct.pickupRadius, node.stats.pickupRadius, STAT_SCALE_FACTORS.pickupRadius, modType);
        if (node.stats?.damageBonus) addPct(pct.damageBonus, node.stats.damageBonus, STAT_SCALE_FACTORS.damageBonus, modType);
        if (node.stats?.expMultiplier) addPct(pct.expMultiplier, node.stats.expMultiplier, 1, modType);
      }
    };

    // 1. Class-Specific Tree Passives
    addTreeNodes(CLASS_SKILL_TREES[playerClass]);

    // 2. Universal Central Tree Passives (Shared across all heroes!)
    addTreeNodes(CLASS_SKILL_TREES['universal']);

    statsTotal.moveSpeed = combineIncreasedAndMore(pct.moveSpeed.increasedSum, pct.moveSpeed.moreMultipliers);
    statsTotal.pickupRadius = combineIncreasedAndMore(pct.pickupRadius.increasedSum, pct.pickupRadius.moreMultipliers);
    statsTotal.damageBonus = combineIncreasedAndMore(pct.damageBonus.increasedSum, pct.damageBonus.moreMultipliers);
    statsTotal.expMultiplier = combineIncreasedAndMore(pct.expMultiplier.increasedSum, pct.expMultiplier.moreMultipliers);

    // 3. Add Equipped Gear Vault Stats! (getEquippedStatsTotal keeps its own flatXxx naming —
    // that's GearVaultUI's display contract, unrelated to this function's schema fix — so map
    // its fields into the plain names here rather than changing that function too. Gear isn't
    // part of the increased/more system — it folds in afterward as a plain additive bonus on
    // top of the tree's already-combined percentage, same as before this system existed.)
    const gearStats = this.getEquippedStatsTotal();
    statsTotal.maxHp += gearStats.flatMaxHp;
    statsTotal.defense += gearStats.flatDefense;
    statsTotal.moveSpeed += gearStats.flatMoveSpeedPct;
    statsTotal.pickupRadius += gearStats.flatPickupRadiusPct;
    statsTotal.damageBonus += gearStats.flatDamageBonusPct;
    statsTotal.critChance += gearStats.flatCritChancePct;
    statsTotal.attackSpeed += gearStats.flatAttackSpeedPct;

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
    // All 9 heroes fully unlocked for gameplay and testing
    return true;
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
