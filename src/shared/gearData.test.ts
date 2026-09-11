import { describe, it, expect, vi, afterEach } from 'vitest';
import { getRandomGearOfRarity } from './gearData';

/**
 * Regression test for FIX-5 (docs/GAME_WIKI.md §2.6 / §6 risk #12): GearRarity's 'magic' tier
 * has no catalog items, so getRandomGearOfRarity('magic') used to silently return undefined —
 * a future weighted-drop change that adds 'magic' to the roll table would hand out "nothing"
 * with no diagnostic trail. It should fall back to 'common' (with a console.warn) instead.
 */
describe('getRandomGearOfRarity fallback for an empty tier (FIX-5)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to a common item instead of undefined for the empty "magic" tier', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const item = getRandomGearOfRarity('magic');

    expect(item).toBeDefined();
    expect(item?.rarity).toBe('common');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('still returns a normal item for a populated tier without warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const item = getRandomGearOfRarity('common');

    expect(item).toBeDefined();
    expect(item?.rarity).toBe('common');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
