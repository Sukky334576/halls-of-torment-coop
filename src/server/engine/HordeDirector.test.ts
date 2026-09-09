import { describe, it, expect, beforeEach } from 'vitest';
import { HordeDirector } from './HordeDirector';

/**
 * Tests for the final-boss execute deadline (bossEncounterTimer / isInDeadlineWarning /
 * deadlineSecondsRemaining / isDeadlineExpired) — the fix for a soft-lock where an unkillable
 * wave-30 boss with nobody surrendering left GameRoom's tick loop running forever, since no
 * other end condition covers "boss won't die and won't be surrendered against".
 *
 * These drive `currentWave`/`bossAlive` directly (`as any`) rather than fast-forwarding through
 * 29 real waves — the wave-progression mechanics are unchanged by this feature and are covered
 * by their own existing behavior; these tests isolate the deadline timer itself.
 */
function setFinalBossEncounter(director: HordeDirector, alive: boolean = true): void {
  (director as any).currentWave = HordeDirector.MAX_WAVES; // 30 — isBossWave() is wave % 5 === 0
  (director as any).bossAlive = alive;
}

function setEarlyBossEncounter(director: HordeDirector, wave: number, alive: boolean = true): void {
  (director as any).currentWave = wave;
  (director as any).bossAlive = alive;
}

describe('HordeDirector boss execute deadline', () => {
  let director: HordeDirector;

  beforeEach(() => {
    director = new HordeDirector(1);
  });

  it('documents the configured timings: 90s grace + 210s warning = 300s total', () => {
    expect(HordeDirector.BOSS_DEADLINE_GRACE_SEC).toBe(90);
    expect(HordeDirector.BOSS_DEADLINE_WARNING_SEC).toBe(210);
    expect(HordeDirector.BOSS_DEADLINE_TOTAL_SEC).toBe(300);
  });

  it('does not start counting outside the final-wave boss encounter at all', () => {
    // Normal waves 1-29, no boss.
    director.update(1000, 1, 0);
    expect(director.isDeadlineExpired()).toBe(false);
    expect(director.isInDeadlineWarning()).toBe(false);
  });

  it('does NOT count during an earlier boss wave (5/10/15/20/25) — only the final wave 30 can soft-lock', () => {
    setEarlyBossEncounter(director, 25, true);
    for (let i = 0; i < 400; i++) director.update(1, 1, 0); // 400 "seconds" of an early boss fight
    expect(director.isDeadlineExpired()).toBe(false);
    expect(director.isInDeadlineWarning()).toBe(false);
    expect(director.deadlineSecondsRemaining()).toBe(HordeDirector.BOSS_DEADLINE_TOTAL_SEC); // untouched
  });

  it('stays silent (no warning) during the grace period on the final boss', () => {
    setFinalBossEncounter(director, true);
    director.update(HordeDirector.BOSS_DEADLINE_GRACE_SEC - 1, 1, 0);
    expect(director.isInDeadlineWarning()).toBe(false);
    expect(director.isDeadlineExpired()).toBe(false);
  });

  it('enters the warning window exactly after the grace period elapses', () => {
    setFinalBossEncounter(director, true);
    director.update(HordeDirector.BOSS_DEADLINE_GRACE_SEC + 1, 1, 0);
    expect(director.isInDeadlineWarning()).toBe(true);
    expect(director.isDeadlineExpired()).toBe(false);
    expect(director.deadlineSecondsRemaining()).toBeCloseTo(HordeDirector.BOSS_DEADLINE_WARNING_SEC - 1, 5);
  });

  it('expires at exactly the total deadline and stays expired past it', () => {
    setFinalBossEncounter(director, true);
    director.update(HordeDirector.BOSS_DEADLINE_TOTAL_SEC - 1, 1, 0);
    expect(director.isDeadlineExpired()).toBe(false);

    director.update(1, 1, 0); // crosses the line
    expect(director.isDeadlineExpired()).toBe(true);
    expect(director.deadlineSecondsRemaining()).toBe(0);

    director.update(1000, 1, 0); // well past it — still expired, never goes negative
    expect(director.isDeadlineExpired()).toBe(true);
    expect(director.deadlineSecondsRemaining()).toBe(0);
  });

  it('resets immediately once the boss stops blocking (killed) — a defeated-in-time boss leaves no stale timer', () => {
    setFinalBossEncounter(director, true);
    director.update(HordeDirector.BOSS_DEADLINE_GRACE_SEC + 50, 1, 0);
    expect(director.isInDeadlineWarning()).toBe(true);

    (director as any).bossAlive = false; // boss defeated
    director.update(1, 1, 0);
    expect(director.isInDeadlineWarning()).toBe(false);
    expect(director.deadlineSecondsRemaining()).toBe(HordeDirector.BOSS_DEADLINE_TOTAL_SEC);
  });
});
