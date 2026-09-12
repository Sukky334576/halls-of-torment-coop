import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameRoom } from './GameRoom';
import { PlayerClass, MonsterType, ProjectileType, PickupType } from '../../shared/types';
import { ServerMonster } from '../entities/ServerMonster';

/**
 * Regression test for the Golden Fortune Aura (gambler_fortune_greed) fix — its bonus coin
 * drop chance on a GAMBLER_CARD hit used to be a flat 3.5% regardless of rank (any rank 1-3
 * just checked `> 0`). Now scales per rank: 3.5% * rank. See
 * docs/archive/2026-09-12-card-description-mismatch-fix.md.
 */
function makeRoom() {
  const sendCallback = vi.fn();
  const room = new GameRoom('test-room', sendCallback);
  return room;
}

function addTestPlayer(room: GameRoom, id: string, greedRank: number) {
  room.addPlayer(id, `Player_${id}`, PlayerClass.GAMBLER);
  const player = (room as any).players.get(id);
  player.skills.highRollerGreedRank = greedRank;
  return player;
}

function seedMonsterAndCardHit(room: GameRoom, ownerId: string) {
  const monster = new ServerMonster(1, MonsterType.SKELETON, 100, 100);
  (room as any).monsters.set(monster.id, monster);
  (room as any).monsterGrid.insert(monster);

  (room as any).projectiles.push({
    id: 1,
    type: ProjectileType.GAMBLER_CARD,
    ownerId,
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    damage: 5,
    isCrit: false,
    radius: 20,
    lifeTime: 1.0,
    pierceRemaining: 1,
    hitEntityIds: new Set<number>()
  });
}

function goldCoinPickups(room: GameRoom) {
  return (room as any).pickups.filter((p: any) => p.type === PickupType.GOLD_COIN);
}

describe('Golden Fortune Aura coin-drop chance scales with rank (fix, GameRoom.ts)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rank 0 (no skill) never drops a bonus coin, even with a guaranteed roll', () => {
    const room = makeRoom();
    const player = addTestPlayer(room, 'p1', 0);
    seedMonsterAndCardHit(room, player.id);
    vi.spyOn(Math, 'random').mockReturnValue(0); // would pass any positive threshold

    (room as any).updateProjectiles(0.016);

    expect(goldCoinPickups(room)).toHaveLength(0);
  });

  it('rank 1: a roll just under 3.5% succeeds, just over fails (old and new behavior agree here)', () => {
    const room = makeRoom();
    const player = addTestPlayer(room, 'p1', 1);
    seedMonsterAndCardHit(room, player.id);
    vi.spyOn(Math, 'random').mockReturnValue(0.03); // < 0.035

    (room as any).updateProjectiles(0.016);

    expect(goldCoinPickups(room)).toHaveLength(1);
  });

  it('rank 3: a roll of 0.08 fails the OLD flat-3.5% check but succeeds the fixed 10.5% (0.035*3)', () => {
    const room = makeRoom();
    const player = addTestPlayer(room, 'p1', 3);
    seedMonsterAndCardHit(room, player.id);
    vi.spyOn(Math, 'random').mockReturnValue(0.08); // > 0.035, < 0.105

    (room as any).updateProjectiles(0.016);

    expect(goldCoinPickups(room)).toHaveLength(1); // proves rank actually scales the chance now
  });

  it('rank 3 still respects the upper bound — a roll past 10.5% still fails', () => {
    const room = makeRoom();
    const player = addTestPlayer(room, 'p1', 3);
    seedMonsterAndCardHit(room, player.id);
    vi.spyOn(Math, 'random').mockReturnValue(0.2); // > 0.105

    (room as any).updateProjectiles(0.016);

    expect(goldCoinPickups(room)).toHaveLength(0);
  });
});
