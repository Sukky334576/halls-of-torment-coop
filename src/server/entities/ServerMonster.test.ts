import { describe, it, expect } from 'vitest';
import { ServerMonster } from './ServerMonster';
import { MonsterType } from '../../shared/types';

/**
 * Regression test for FIX-4 (docs/GAME_WIKI.md §3.7 / §6 risk #11): ServerMonster.update()'s
 * ranged "back off" branch only guarded `dist < 120`, not `dist > 0` — if the target sits
 * exactly on top of the monster (e.g. GameRoom defaults targetX/Y to the monster's own position
 * when every player is dead), `dx/dist` divides by zero and permanently sets x/y to NaN.
 */
describe('ServerMonster.update() zero-distance guard (FIX-4)', () => {
  it('does not produce NaN coordinates for a ranged monster when the target is exactly on top of it', () => {
    const monster = new ServerMonster(1, MonsterType.SKELETON_ARCHER, 100, 200);
    expect(monster.isRanged()).toBe(true);

    monster.update(0.016, monster.x, monster.y); // target === own position, dist === 0

    expect(Number.isNaN(monster.x)).toBe(false);
    expect(Number.isNaN(monster.y)).toBe(false);
    expect(monster.x).toBe(100);
    expect(monster.y).toBe(200);
  });

  it('still retreats normally once outside the zero-distance edge case', () => {
    const monster = new ServerMonster(2, MonsterType.SKELETON_ARCHER, 0, 0);
    monster.update(0.1, 50, 0); // target 50px away (inside the <120 retreat band)

    // Should have moved AWAY from the target (negative x), not stayed put or gone NaN.
    expect(Number.isNaN(monster.x)).toBe(false);
    expect(monster.x).toBeLessThan(0);
  });
});
