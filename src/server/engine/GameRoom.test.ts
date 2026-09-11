import { describe, it, expect, vi } from 'vitest';
import { GameRoom } from './GameRoom';
import { PlayerClass } from '../../shared/types';
import type { ServerPlayer } from '../entities/ServerPlayer';
import { TRAIT_POOL } from '../../shared/classes';

/**
 * Regression suite for the LEVEL_UP_CHOICE double-trigger bug: startLevelUpChoice() used to
 * call triggerLevelUpChoices() unconditionally, so a second level-up landing while a card was
 * still on screen (e.g. an EXP gem and a treasure chest both crossing a level threshold before
 * the player responded) would silently replace the first LEVEL_UP_CHOICE message before the
 * player ever saw it. The fix queues extra level-ups in `pendingLevelUpChoices` (mirroring the
 * existing `catchUpChoicesRemaining` pattern) instead of re-triggering immediately.
 *
 * These tests drive the private startLevelUpChoice()/players map directly (`as any`) rather
 * than going through the real EXP-granting pickup logic — the bug and its fix live entirely in
 * the choose-a-card bookkeeping, not in how EXP is earned, so the tests isolate that mechanism.
 */
function makeRoom() {
  const sent: { playerId: string; msg: any }[] = [];
  const sendCallback = vi.fn((playerId: string, msg: any) => {
    sent.push({ playerId, msg });
  });
  const room = new GameRoom('test-room', sendCallback);
  return { room, sent, sendCallback };
}

function addTestPlayer(room: GameRoom, id: string): ServerPlayer {
  room.addPlayer(id, `Player_${id}`, PlayerClass.SWORDSMAN);
  return (room as any).players.get(id);
}

function levelUpMessagesFor(sent: { playerId: string; msg: any }[], playerId: string) {
  return sent.filter((s) => s.playerId === playerId && s.msg.type === 'LEVEL_UP_CHOICE');
}

// FIX-2 (server-side trait-choice validation) means tests can no longer resolve a pick with an
// arbitrary placeholder id — it has to be one of the ids the player was actually offered. This
// reads the most recent LEVEL_UP_CHOICE sent to a player and grabs its first choice's id.
function latestOfferedTraitId(sent: { playerId: string; msg: any }[], playerId: string): string {
  const msgs = levelUpMessagesFor(sent, playerId);
  const latest = msgs[msgs.length - 1];
  if (!latest || !latest.msg.choices?.length) {
    throw new Error(`No LEVEL_UP_CHOICE with choices found for ${playerId}`);
  }
  return latest.msg.choices[0].id;
}

describe('GameRoom level-up choice queueing (pendingLevelUpChoices)', () => {
  it('1. queues a second level-up instead of sending a second LEVEL_UP_CHOICE immediately', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');

    (room as any).startLevelUpChoice(player); // first EXP source levels them up
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(1);
    expect(player.isChoosingTrait).toBe(true);
    expect(player.pendingLevelUpChoices).toBe(0);

    (room as any).startLevelUpChoice(player); // second EXP source, same "frame", card still open
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(1); // still just the one — no replace
    expect(player.pendingLevelUpChoices).toBe(1); // queued instead
    expect(player.isChoosingTrait).toBe(true); // still mid-choice on the first card
  });

  it('2. sends the second card after the first is selected, instead of skipping it', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');

    (room as any).startLevelUpChoice(player);
    (room as any).startLevelUpChoice(player); // queues one (per test 1)
    expect(player.pendingLevelUpChoices).toBe(1);

    room.handleSelectTrait('p1', latestOfferedTraitId(sent, 'p1')); // resolve card #1

    expect(player.pendingLevelUpChoices).toBe(0); // popped
    expect(player.isChoosingTrait).toBe(true); // card #2 is now open, not closed out
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(2); // card #2 was actually sent

    room.handleSelectTrait('p1', latestOfferedTraitId(sent, 'p1')); // resolve card #2
    expect(player.isChoosingTrait).toBe(false); // now genuinely done
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(2); // no further cards queued
  });

  it('3. solo mode: isPaused stays true across both queued picks, only clearing after both resolve', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'solo');

    (room as any).startLevelUpChoice(player);
    (room as any).startLevelUpChoice(player);
    expect(room.isPaused).toBe(true);

    room.handleSelectTrait('solo', latestOfferedTraitId(sent, 'solo')); // card #1 resolved, card #2 opens
    expect(room.isPaused).toBe(true); // must NOT unpause yet — card #2 is still pending

    room.handleSelectTrait('solo', latestOfferedTraitId(sent, 'solo')); // card #2 resolved, queue empty
    expect(room.isPaused).toBe(false); // now safe to unpause
  });

  it("4. co-op mode: another player's isChoosingTrait/movement is untouched while one has a 2-deep queue", () => {
    const { room, sent } = makeRoom();
    const busy = addTestPlayer(room, 'busy');
    const other = addTestPlayer(room, 'other');

    (room as any).startLevelUpChoice(busy);
    (room as any).startLevelUpChoice(busy); // busy now has 1 queued (2 total picks needed)

    expect(room.isPaused).toBe(false); // co-op never pauses the room at all
    expect(other.isChoosingTrait).toBe(false);
    expect(other.pendingLevelUpChoices).toBe(0);

    room.handleSelectTrait('busy', latestOfferedTraitId(sent, 'busy')); // busy's card #2 opens
    expect(other.isChoosingTrait).toBe(false); // still untouched
    expect(room.isPaused).toBe(false);

    room.handleSelectTrait('busy', latestOfferedTraitId(sent, 'busy')); // busy fully done
    expect(busy.isChoosingTrait).toBe(false);
    expect(other.isChoosingTrait).toBe(false); // never touched throughout
  });

  it('5. regression: a single non-overlapping level-up behaves exactly as before', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');

    (room as any).startLevelUpChoice(player);
    expect(player.isChoosingTrait).toBe(true);
    expect(player.pendingLevelUpChoices).toBe(0);
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(1);
    expect(room.isPaused).toBe(true); // solo (this room has only 1 player)

    room.handleSelectTrait('p1', latestOfferedTraitId(sent, 'p1'));
    expect(player.isChoosingTrait).toBe(false);
    expect(player.pendingLevelUpChoices).toBe(0);
    expect(room.isPaused).toBe(false); // unpauses immediately, no queued card held it open
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(1); // no phantom second card
  });
});

describe('GameRoom trait-choice server-side validation (FIX-2, docs/GAME_WIKI.md §4.7)', () => {
  it('rejects a traitId that was never offered — no trait applied, pick stays open', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    (room as any).startLevelUpChoice(player);
    const offeredId = latestOfferedTraitId(sent, 'p1');

    room.handleSelectTrait('p1', 'totally-not-an-offered-id');

    expect(player.isChoosingTrait).toBe(true); // still waiting on a real pick
    expect(player.acquiredTraits).toHaveLength(0);
    // Sanity check the offered id itself still resolves normally, proving the rejection above
    // was about validation, not a broken pool.
    room.handleSelectTrait('p1', offeredId);
    expect(player.acquiredTraits).toEqual([offeredId]);
    expect(player.isChoosingTrait).toBe(false);
  });

  it('rejects BANISH for a traitId outside the current offer — no potion spent, nothing banished', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    player.potionBanishes = 1;
    (room as any).startLevelUpChoice(player);

    room.handleUsePotion('p1', 'BANISH', 'totally-not-an-offered-id');

    expect(player.potionBanishes).toBe(1); // untouched
    expect(player.banishedTraits.has('totally-not-an-offered-id')).toBe(false);
    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(1); // no reroll was triggered
  });

  it('rejects LOCK for a traitId outside the current offer — no potion spent', () => {
    const { room } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    player.potionLocks = 1;
    (room as any).startLevelUpChoice(player);

    room.handleUsePotion('p1', 'LOCK', 'totally-not-an-offered-id');

    expect(player.potionLocks).toBe(1); // untouched
    expect(player.lockedTraitId).toBeNull();
  });
});

describe('GameRoom empty trait-pool skip (FIX-1, docs/GAME_WIKI.md §4.7 / §6 risk #2)', () => {
  it('sends LEVEL_UP_SKIPPED with a consolation heal instead of an empty LEVEL_UP_CHOICE, and resolves the pick', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    player.stats.hp = Math.max(1, player.stats.maxHp - 100); // room to observe the heal
    for (const t of TRAIT_POOL) player.banishedTraits.add(t.id); // exhaust every possible offer

    (room as any).startLevelUpChoice(player);

    expect(levelUpMessagesFor(sent, 'p1')).toHaveLength(0); // never an empty-choices modal
    const skipped = sent.filter((s) => s.playerId === 'p1' && s.msg.type === 'LEVEL_UP_SKIPPED');
    expect(skipped).toHaveLength(1);
    expect(skipped[0].msg.healedAmount).toBeGreaterThan(0);
    expect(player.stats.hp).toBeGreaterThan(player.stats.maxHp - 100);
    expect(player.isChoosingTrait).toBe(false); // resolved immediately, not stuck open
  });

  it('co-op: an empty pool for one player does not pause the room or affect a teammate', () => {
    const { room } = makeRoom();
    const empty = addTestPlayer(room, 'empty');
    const other = addTestPlayer(room, 'other');
    for (const t of TRAIT_POOL) empty.banishedTraits.add(t.id);

    (room as any).startLevelUpChoice(empty);

    expect(empty.isChoosingTrait).toBe(false);
    expect(room.isPaused).toBe(false); // co-op never pauses on a single player's card
    expect(other.isChoosingTrait).toBe(false);
  });

  it('does not heal past maxHp when the pool is empty', () => {
    const { room, sent } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    // Already at full HP — the 25% consolation heal should clamp to 0 actual healing.
    for (const t of TRAIT_POOL) player.banishedTraits.add(t.id);

    (room as any).startLevelUpChoice(player);

    const skipped = sent.filter((s) => s.playerId === 'p1' && s.msg.type === 'LEVEL_UP_SKIPPED');
    expect(skipped[0].msg.healedAmount).toBe(0);
    expect(player.stats.hp).toBe(player.stats.maxHp);
  });
});

function gameOverMessagesFor(sent: { playerId: string; msg: any }[], playerId: string) {
  return sent.filter((s) => s.playerId === playerId && s.msg.type === 'GAME_OVER');
}

/** Forces the room into "final-wave boss has been fought for `seconds`" without needing to
 *  fast-forward through 29 real waves — see HordeDirector.test.ts for the timer's own unit
 *  tests; these tests are about GameRoom.tick()'s reaction to the deadline, not the timer math. */
function forceFinalBossEncounter(room: GameRoom, encounterSeconds: number): void {
  const director = (room as any).hordeDirector;
  director.currentWave = 30; // HordeDirector.MAX_WAVES — isBossWave() is wave % 5 === 0
  director.bossAlive = true;
  director.bossEncounterTimer = encounterSeconds;
}

describe('GameRoom final-boss execute deadline (soft-lock fix)', () => {
  it('force-ends the match once the deadline expires, even with nobody surrendering', () => {
    const { room, sent } = makeRoom();
    addTestPlayer(room, 'p1');
    (room as any).isStarted = true;

    forceFinalBossEncounter(room, 299);
    (room as any).tick();
    expect((room as any).isOver).toBe(false); // not yet — one second short

    forceFinalBossEncounter(room, 300); // crosses the line
    (room as any).tick();

    expect((room as any).isOver).toBe(true);
    const overMsgs = gameOverMessagesFor(sent, 'p1');
    expect(overMsgs).toHaveLength(1);
    expect(overMsgs[0].msg.victory).toBe(false);
    expect(overMsgs[0].msg.reason).toBe('BOSS_ENRAGE_EXECUTE');
  });

  it('kills every still-standing player through the normal isDead path (true damage, not a teleport to game-over)', () => {
    const { room } = makeRoom();
    const p1 = addTestPlayer(room, 'p1');
    const p2 = addTestPlayer(room, 'p2');
    (room as any).isStarted = true;

    expect(p1.isDead).toBe(false);
    expect(p2.isDead).toBe(false);

    forceFinalBossEncounter(room, 300);
    (room as any).tick();

    expect(p1.isDead).toBe(true);
    expect(p2.isDead).toBe(true);
    expect(p1.stats.hp).toBe(0);
    expect(p2.stats.hp).toBe(0);
  });

  it('skips a disconnected or level-up-choosing player instead of executing them', () => {
    const { room } = makeRoom();
    const disconnected = addTestPlayer(room, 'ghost1');
    const choosing = addTestPlayer(room, 'ghost2');
    (room as any).isStarted = true;
    disconnected.isDisconnected = true;
    choosing.isChoosingTrait = true;

    forceFinalBossEncounter(room, 300);
    (room as any).tick();

    // The match still ends (that's the whole point — no ghost state can block the deadline),
    // but neither ghosted player is force-killed by it.
    expect((room as any).isOver).toBe(true);
    expect(disconnected.isDead).toBe(false);
    expect(choosing.isDead).toBe(false);
  });

  it('never fires during an earlier boss wave (e.g. wave 25) — only wave 30 can trigger it', () => {
    const { room } = makeRoom();
    const p1 = addTestPlayer(room, 'p1');
    (room as any).isStarted = true;
    const director = (room as any).hordeDirector;
    director.currentWave = 25;
    director.bossAlive = true;
    // Drive the SAME update() the real tick loop calls, not a direct field poke — the
    // wave-30-only gating lives in update()'s own logic (see HordeDirector.test.ts for the
    // focused unit test of that), so this has to go through it to be a meaningful check that
    // GameRoom's tick() doesn't need its own separate wave guard on top of it.
    for (let i = 0; i < 400; i++) director.update(1, 1, 0); // 400s of an early boss fight

    (room as any).tick();

    expect(director.isDeadlineExpired()).toBe(false);
    expect((room as any).isOver).toBe(false);
    expect(p1.isDead).toBe(false);
  });

  it('regression: a normal party wipe (no boss encounter at all) is untouched by this feature', () => {
    const { room, sent } = makeRoom();
    const p1 = addTestPlayer(room, 'p1');
    (room as any).isStarted = true;
    p1.isDead = true; // simulate the party already having wiped in combat

    (room as any).tick();

    expect((room as any).isOver).toBe(true);
    const overMsgs = gameOverMessagesFor(sent, 'p1');
    expect(overMsgs).toHaveLength(1);
    expect(overMsgs[0].msg.reason).toBeUndefined(); // plain wipe, not the boss-execute reason
  });
});
