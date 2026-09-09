import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetaProgressionManager, combineIncreasedAndMore, MAX_MORE_MODIFIERS_PER_STAT } from './MetaProgression';
import { PlayerClass } from '../../shared/types';
import { CLASS_SKILL_TREES } from '../../shared/skillTreeData';

/**
 * Regression test for the skill-tree stat schema refactor: getPassiveTiersForClass() used to
 * return flatXxx/flatXxxPct-named fields that ServerPlayer.ts translated back to PlayerStats
 * names. It now returns PlayerStats-named fields directly. This test locks in the exact
 * numeric output for a known allocation set, covering every stat type the skill tree can
 * grant, so a future change to STAT_SCALE_FACTORS or the aggregation loop can't silently
 * change what players actually receive without failing here first.
 *
 * Node choices are real ids from skillTreeData.ts with hand-verified `stats` at the time of
 * writing — if one of these nodes' own stats value changes, this test's expected numbers
 * must be updated to match (that's an intentional rebalance, not a regression).
 *
 * This file also doubles as the Phase 2 (increased/more modifier system) regression guard:
 * every node here is 'increased' by omission (no modType set), so the expected numbers are
 * unchanged from before that system existed — see the "Increased vs More" describe block
 * below for the new behavior once 'more' modifiers are actually present.
 */
describe('MetaProgression.getPassiveTiersForClass — schema refactor snapshot', () => {
  let manager: MetaProgressionManager;

  beforeEach(() => {
    manager = new MetaProgressionManager();
    // Bypass the adjacency/cost-gated public allocate flow — this test is about the stat
    // aggregation math in getPassiveTiersForClass(), not the allocation UI's own rules, so
    // it sets up allocated-node state directly (private field, hence the `as any`).
    const data = (manager as any).data;
    data.equippedGear = {}; // Isolate tree-passive math from the separate gear-stat system.
    data.allocatedNodes.push(
      'sw_atk_spd_1',     // damageBonus: 0.5   -> *8  = +4
      'sw_def_1',         // defense: 0.5       -> +0.5 (no scale factor)
      'sw_universal_haste', // moveSpeed: 0.3   -> *6  = +1.8
      'sw_universal_reach', // pickupRadius: 0.4 -> *25 = +10
      'sw_universal_focus', // expMultiplier: 3 -> +3 (no scale factor)
      'uni_right_filler_1'  // tierLuck: 5      -> +5 (no scale factor)
    );
    // sw_root (maxHp: 10) and uni_root (maxHp: 10) are allocated by default already.
  });

  it('sums every stat type to the exact pre-refactor numbers, under the new plain field names', () => {
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    expect(totals.maxHp).toBe(20); // sw_root(10) + uni_root(10), unscaled
    expect(totals.defense).toBeCloseTo(0.5, 10); // sw_def_1, unscaled
    expect(totals.moveSpeed).toBeCloseTo(1.8, 10); // sw_universal_haste(0.3) * 6
    expect(totals.pickupRadius).toBeCloseTo(10, 10); // sw_universal_reach(0.4) * 25
    expect(totals.damageBonus).toBeCloseTo(4, 10); // sw_atk_spd_1(0.5) * 8
    expect(totals.expMultiplier).toBeCloseTo(3, 10); // sw_universal_focus, unscaled
    expect(totals.tierLuck).toBeCloseTo(5, 10); // uni_right_filler_1, unscaled

    // No gear equipped and no skill tree node grants these — must stay exactly 0, not just
    // "falsy", since a stray NaN or undefined here would also fail ServerPlayer.ts silently.
    expect(totals.critChance).toBe(0);
    expect(totals.attackSpeed).toBe(0);
  });

  it('uses PlayerStats field names, not the old flatXxx/flatXxxPct convention', () => {
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    for (const oldKey of [
      'flatMaxHp',
      'flatDefense',
      'flatMoveSpeedPct',
      'flatPickupRadiusPct',
      'flatDamageBonusPct',
      'flatExpMultiplierPct',
      'flatCritChancePct',
      'flatAttackSpeedPct',
      'flatTierLuckPct'
    ]) {
      expect(totals).not.toHaveProperty(oldKey);
    }

    for (const newKey of [
      'maxHp',
      'defense',
      'moveSpeed',
      'pickupRadius',
      'damageBonus',
      'expMultiplier',
      'critChance',
      'attackSpeed',
      'tierLuck'
    ]) {
      expect(totals).toHaveProperty(newKey);
    }
  });

  it('still carries the unrelated extra-potion counts through untouched', () => {
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);
    expect(totals.extraRerolls).toBe(0);
    expect(totals.extraBanishes).toBe(0);
    expect(totals.extraLocks).toBe(0);
  });
});

describe('combineIncreasedAndMore — pure formula', () => {
  it('returns the increased sum unchanged when there are no more modifiers (exact legacy behavior)', () => {
    expect(combineIncreasedAndMore(36.5, [])).toBe(36.5);
    expect(combineIncreasedAndMore(0, [])).toBe(0);
  });

  it('applies increased additively, then multiplies once by each more modifier separately', () => {
    // final = base * (1 + sum(increased)/100) * product(more), expressed back as one
    // equivalent percentage: (0.20 combined increased) * (1.15 more) -> +38%, not +35%.
    const result = combineIncreasedAndMore(20, [1.15]);
    expect(result).toBeCloseTo(38, 10);
  });

  it('stacks multiple more modifiers multiplicatively against each other, not additively', () => {
    // Two +20% "more" modifiers: 1.2 * 1.2 = 1.44 (a real +44%), never 1.4 (+40%, which
    // would be what treating them as 'increased' would give instead).
    const result = combineIncreasedAndMore(0, [1.2, 1.2]);
    expect(result).toBeCloseTo(44, 10);
    expect(result).not.toBeCloseTo(40, 1);
  });

  it('caps the number of more modifiers that count toward the product and warns once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fiveEqualMoreMods = [1.1, 1.1, 1.1, 1.1, 1.1];

    const capped = combineIncreasedAndMore(0, fiveEqualMoreMods);
    const expectedFromFirstFour = combineIncreasedAndMore(0, fiveEqualMoreMods.slice(0, MAX_MORE_MODIFIERS_PER_STAT));
    // What the result WOULD be if the cap didn't exist — 1.1^5 vs the capped 1.1^4 — used
    // below only to prove the 5th modifier was actually excluded, not to assert equality.
    const hypotheticalIfUncapped = (1.1 ** 5 - 1) * 100;

    expect(MAX_MORE_MODIFIERS_PER_STAT).toBe(4); // documents the currently-configured cap
    expect(capped).toBeCloseTo(expectedFromFirstFour, 10); // the 5th multiplier had zero effect
    expect(capped).not.toBeCloseTo(hypotheticalIfUncapped, 2); // and measurably differs from letting all 5 count
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/more.*modifiers.*capping/i);

    warnSpy.mockRestore();
  });
});

describe('getPassiveTiersForClass — increased vs more integration (Phase 2)', () => {
  // Real Swordsman nodes that all grant moveSpeed, temporarily repurposed as two
  // 'increased' and two 'more' modifiers on the SAME stat to prove the full pipeline
  // (not just the pure formula) combines them PoE-style instead of summing everything.
  const INCREASED_NODE_IDS = ['sw_universal_haste', 'sw_universal_swift_spark']; // moveSpeed 0.3 each -> +1.8% each
  const MORE_NODE_IDS = ['sw_sonic_minor_1', 'sw_sonic_minor_2']; // moveSpeed 0.5 each -> +3% each

  let manager: MetaProgressionManager;

  function getNode(id: string) {
    const node = CLASS_SKILL_TREES[PlayerClass.SWORDSMAN].nodes[id];
    if (!node) throw new Error(`Test fixture node ${id} not found — did skillTreeData.ts change?`);
    return node;
  }

  beforeEach(() => {
    manager = new MetaProgressionManager();
    const data = (manager as any).data;
    data.equippedGear = {};
    data.allocatedNodes.push(...INCREASED_NODE_IDS, ...MORE_NODE_IDS);

    for (const id of INCREASED_NODE_IDS) getNode(id).modType = 'increased';
    for (const id of MORE_NODE_IDS) getNode(id).modType = 'more';
  });

  afterEach(() => {
    // These mutate the shared CLASS_SKILL_TREES singleton (real game data), not a per-test
    // copy, so every node touched above MUST be reset or it'll leak modType into whichever
    // test (or real game session in the same process) runs next.
    for (const id of [...INCREASED_NODE_IDS, ...MORE_NODE_IDS]) delete getNode(id).modType;
  });

  it('combines 2 increased + 2 more on the same stat via the PoE formula, not a flat sum', () => {
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    // increasedSum = (0.3*6) + (0.3*6) = 3.6 ; more = [1+0.5*6/100, 1+0.5*6/100] = [1.03, 1.03]
    // combined = ((1 + 3.6/100) * 1.03 * 1.03 - 1) * 100
    const expected = ((1 + 3.6 / 100) * 1.03 * 1.03 - 1) * 100;
    expect(totals.moveSpeed).toBeCloseTo(expected, 10);
    expect(totals.moveSpeed).toBeCloseTo(9.90924, 4);

    // The naive pre-Phase-2 "sum everything" result would have been 1.8+1.8+3+3 = 9.6 —
    // confirm the real result is measurably different, i.e. 'more' is actually multiplying.
    expect(totals.moveSpeed).not.toBeCloseTo(9.6, 2);
  });

  it("falls back to the plain additive sum when every node is 'increased' (the default)", () => {
    // Flip the two 'more' nodes back to 'increased' for this one case, proving the divergence
    // above comes from modType specifically, not from which nodes happen to be allocated.
    for (const id of MORE_NODE_IDS) getNode(id).modType = 'increased';

    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);
    expect(totals.moveSpeed).toBeCloseTo(1.8 + 1.8 + 3 + 3, 10);
  });
});

/**
 * Phase 3: real trade-off keystones. The whole point of these nodes is that they are NOT
 * pure buffs — each one's debuff must land in the SAME totals object as its buff. A bug
 * that applied the buff but silently dropped the debuff (e.g. a typo'd stat key, or a
 * modType check that accidentally skipped the negative-value branch) would be invisible
 * from the buff numbers alone, so every test below asserts both sides explicitly.
 */
describe('Trade-off keystones (Phase 3) — buff and debuff both apply', () => {
  let manager: MetaProgressionManager;

  beforeEach(() => {
    manager = new MetaProgressionManager();
    (manager as any).data.equippedGear = {};
  });

  function allocate(...nodeIds: string[]) {
    (manager as any).data.allocatedNodes.push(...nodeIds);
  }

  it('Reckless Bloodlust: +24% more damageBonus AND -3 defense together, not just the buff', () => {
    allocate('sw_keystone_reckless_bloodlust');
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    expect(totals.damageBonus).toBeCloseTo(24, 10); // buff: (3 pts * 8) as a lone 'more' -> +24%
    expect(totals.defense).toBeCloseTo(-3, 10); // debuff: flat, unconditional
    // A regression that dropped the debuff would leave defense at 0 — assert it's actually
    // negative, not just "close to -3 or 0".
    expect(totals.defense).toBeLessThan(0);
  });

  it("Reckless Bloodlust's 'more' damage stacks multiplicatively on top of existing 'increased' damage nodes", () => {
    allocate('sw_atk_spd_1', 'sw_keystone_reckless_bloodlust'); // sw_atk_spd_1: damageBonus 0.5 * 8 = +4%, 'increased' (default)
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    const expected = ((1 + 4 / 100) * 1.24 - 1) * 100; // increasedSum=4, more=[1.24]
    expect(totals.damageBonus).toBeCloseTo(expected, 10);
    expect(totals.damageBonus).not.toBeCloseTo(4 + 24, 2); // must NOT equal the naive flat sum (28)
  });

  it('Overcharged Reflexes: +30% more moveSpeed AND -30 maxHp together', () => {
    allocate('sw_keystone_overcharged_reflexes');
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    expect(totals.moveSpeed).toBeCloseTo(30, 10); // 5 pts * 6 = +30%, lone 'more'
    expect(totals.maxHp).toBe(20 - 30); // sw_root(10) + uni_root(10) default, minus this keystone's -30
    expect(totals.maxHp).toBeLessThan(0); // this build genuinely goes HP-negative on tree bonus alone
  });

  it('Leaden Bulwark: +6 defense AND -24% more moveSpeed together (the debuff is on the OTHER stat than the buff)', () => {
    allocate('sw_keystone_leaden_bulwark');
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    expect(totals.defense).toBeCloseTo(6, 10); // buff: flat
    expect(totals.moveSpeed).toBeCloseTo(-24, 10); // debuff: (4 pts * 6) as a lone negative 'more' -> -24%
    expect(totals.moveSpeed).toBeLessThan(0);
  });

  it('Gilded Greed: +25% more expMultiplier AND -25 maxHp together', () => {
    allocate('sw_keystone_gilded_greed');
    const totals = manager.getPassiveTiersForClass(PlayerClass.SWORDSMAN);

    expect(totals.expMultiplier).toBeCloseTo(25, 10); // buff: lone 'more', no scale factor
    expect(totals.maxHp).toBe(20 - 25); // default roots (20) minus this keystone's -25
    expect(totals.maxHp).toBeLessThan(0);
  });

  it('every trade-off keystone node data actually declares both a positive and a negative stat', () => {
    const tree = CLASS_SKILL_TREES[PlayerClass.SWORDSMAN];
    const tradeOffIds = [
      'sw_keystone_reckless_bloodlust',
      'sw_keystone_overcharged_reflexes',
      'sw_keystone_leaden_bulwark',
      'sw_keystone_gilded_greed'
    ];
    for (const id of tradeOffIds) {
      const node = tree.nodes[id];
      expect(node, `${id} should exist`).toBeTruthy();
      expect(node.modType, `${id} should use modType 'more'`).toBe('more');
      const values = Object.values(node.stats ?? {});
      expect(values.some((v) => (v ?? 0) > 0), `${id} should have at least one positive (buff) stat`).toBe(true);
      expect(values.some((v) => (v ?? 0) < 0), `${id} should have at least one negative (debuff) stat`).toBe(true);
    }
  });
});
