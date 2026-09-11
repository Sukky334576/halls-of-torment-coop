import { describe, it, expect } from 'vitest';
import { SpatialGrid } from './SpatialGrid';
import { ServerMonster } from '../entities/ServerMonster';
import { MonsterType } from '../../shared/types';
import { MONSTER_STATS } from '../../shared/constants';

/**
 * Regression test for the IMP hitbox-vs-sprite mismatch (docs/archive/2026-09-11-imp-hitbox-fix.md,
 * user report: "ธนู archer โดนตัวค้างคาว (IMP) แต่ไม่โดน dmg เลย"). IMP's collision radius (12) used
 * to be the smallest of any monster while sharing the same fixed 64x64 sprite draw size as every
 * other ground monster — an Archer arrow (radius 10) visually appearing to connect with the sprite
 * would frequently miss the much-smaller true hitbox underneath. Bumped IMP's radius to 16
 * (matching SKELETON) in src/shared/constants.ts.
 *
 * This drives the real SpatialGrid.queryRadius() collision check (same method GameRoom uses for
 * player-projectile-vs-monster hits) with the actual Archer arrow radius (10, from
 * GameRoom.ts's ARROW projectile creation) against a real ServerMonster(IMP) — not a
 * hand-rolled distance formula — so it would have failed before the constants.ts fix.
 */
const ARCHER_ARROW_RADIUS = 10; // matches GameRoom.ts's ProjectileType.ARROW radius

describe('IMP hitbox vs Archer arrow (SpatialGrid collision)', () => {
  it("IMP's collision radius is no longer the smallest-possible outlier (12)", () => {
    expect(MONSTER_STATS[MonsterType.IMP].radius).toBe(16);
  });

  it('an arrow landing 20px off-center from the IMP now registers a hit (used to miss at radius 12)', () => {
    const grid = new SpatialGrid<ServerMonster>(100);
    const imp = new ServerMonster(1, MonsterType.IMP, 100, 100);
    grid.insert(imp);

    // Arrow center 20px away from the imp's center — a near-miss a player would reasonably
    // expect to connect with given the imp's ~64px-wide rendered sprite. With the old radius
    // 12, combinedRadius (10 + 12 = 22) still technically covers 20px on paper, so pick a
    // distance that makes the before/after difference unambiguous: 24px, which the OLD
    // combined radius (22) would have missed, and the NEW combined radius (10 + 16 = 26) hits.
    const arrowX = imp.x + 24;
    const arrowY = imp.y;

    const hits = grid.queryRadius(arrowX, arrowY, ARCHER_ARROW_RADIUS);

    expect(hits).toContain(imp);
  });

  it('a clean miss well outside the sprite entirely still correctly registers no hit', () => {
    const grid = new SpatialGrid<ServerMonster>(100);
    const imp = new ServerMonster(2, MonsterType.IMP, 100, 100);
    grid.insert(imp);

    const hits = grid.queryRadius(imp.x + 80, imp.y, ARCHER_ARROW_RADIUS);

    expect(hits).not.toContain(imp);
  });
});
