import { describe, it, expect } from 'vitest';
import { TRAIT_POOL } from './classes';
import type { PlayerStats, PlayerSkills } from './types';

/**
 * Regression tests for the 5 description-vs-code mismatches found by the
 * "card-list-documentation" session and verified against source on 2026-09-12 (see
 * docs/archive/2026-09-12-card-description-mismatch-fix.md). Two of the five got an actual
 * code fix; this file covers those two. The other three (gambler_royal_flush left as-is,
 * commando_ap_rounds and cowboy_quick_draw description-only) don't need new tests — no
 * behavior changed for them.
 */
function findTrait(id: string) {
  const trait = TRAIT_POOL.find((t) => t.id === id);
  if (!trait) throw new Error(`Trait ${id} not found in TRAIT_POOL`);
  return trait;
}

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    maxHp: 100, hp: 100, moveSpeed: 200, attackSpeed: 1.0, damageBonus: 1.0, flatDamage: 20,
    critChance: 0.1, critBonus: 1.5, areaMultiplier: 1.0, pickupRadius: 100, defense: 0,
    level: 1, exp: 0, maxExp: 20, ...overrides
  } as PlayerStats;
}

function makeSkills(overrides: Partial<PlayerSkills> = {}): PlayerSkills {
  return { ...overrides } as PlayerSkills;
}

describe('magnet_1 (Soul Siphon Attunement) — expMultiplier fix', () => {
  it('adds +0.15 expMultiplier on top of the undefined default (treated as 1.0)', () => {
    const trait = findTrait('magnet_1');
    const stats = makeStats(); // expMultiplier left undefined, matching a fresh player
    const skills = makeSkills();

    trait.apply(stats, skills);

    expect(stats.expMultiplier).toBeCloseTo(1.15);
    expect(stats.pickupRadius).toBeCloseTo(115); // pickupRadius effect untouched by the fix
  });

  it('stacks additively across repeat picks (magnet_1 has no rank cap)', () => {
    const trait = findTrait('magnet_1');
    const stats = makeStats();
    const skills = makeSkills();

    trait.apply(stats, skills);
    trait.apply(stats, skills);
    trait.apply(stats, skills);

    expect(stats.expMultiplier).toBeCloseTo(1.45); // 1.0 + 0.15*3
  });

  it('adds on top of an existing skill-tree-derived expMultiplier instead of overwriting it', () => {
    const trait = findTrait('magnet_1');
    const stats = makeStats({ expMultiplier: 1.2 }); // e.g. from a skill tree passive
    const skills = makeSkills();

    trait.apply(stats, skills);

    expect(stats.expMultiplier).toBeCloseTo(1.35);
  });
});

describe('gambler_fortune_greed (Golden Fortune Aura) — description now matches code', () => {
  it('still applies its other two stats correctly (crit + pickup radius unaffected by the fix)', () => {
    const trait = findTrait('gambler_fortune_greed');
    const stats = makeStats();
    const skills = makeSkills();

    trait.apply(stats, skills);

    expect(stats.pickupRadius).toBeCloseTo(130);
    expect(stats.critChance).toBeCloseTo(0.2);
    expect(stats.critBonus).toBeCloseTo(1.75);
    expect(skills.highRollerGreedRank).toBe(1);
  });
});
