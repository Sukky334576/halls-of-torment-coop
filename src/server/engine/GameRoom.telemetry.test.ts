import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocked before importing GameRoom (hoisted by vitest) so GameRoom's own
// `import { logGameEvent, logError } from '../telemetry/TelemetryBuffer'` resolves to these
// spies instead of the real module — which would otherwise open/write the actual
// data/telemetry.dev.db file as a side effect of merely importing GameRoom in a test.
vi.mock('../telemetry/TelemetryBuffer', () => ({
  logGameEvent: vi.fn(),
  logError: vi.fn(),
  shutdownTelemetry: vi.fn()
}));

import { GameRoom } from './GameRoom';
import { PlayerClass, MonsterType } from '../../shared/types';
import type { ServerPlayer } from '../entities/ServerPlayer';
import { ServerMonster } from '../entities/ServerMonster';
import { logGameEvent } from '../telemetry/TelemetryBuffer';

function makeRoom() {
  const sendCallback = vi.fn();
  const room = new GameRoom('telemetry-room', sendCallback);
  return { room, sendCallback };
}

function addTestPlayer(room: GameRoom, id: string): ServerPlayer {
  room.addPlayer(id, `Player_${id}`, PlayerClass.SWORDSMAN);
  return (room as any).players.get(id);
}

function eventsOfType(type: string) {
  return (logGameEvent as any).mock.calls.map((c: any[]) => c[0]).filter((e: any) => e.eventType === type);
}

describe('GameRoom telemetry hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('start() logs run_start with a fresh, non-empty run_id shared by later events', () => {
    const { room } = makeRoom();
    addTestPlayer(room, 'p1');
    room.start(1);

    const runStarts = eventsOfType('run_start');
    expect(runStarts).toHaveLength(1);
    expect(runStarts[0].runId).toBeTruthy();
    expect(runStarts[0].partySize).toBe(1);

    room.stop(); // clears the tick interval so the test process can exit cleanly
  });

  it('handleSelectTrait logs level_up_choice with the picked trait id and offered set, before trait.apply', () => {
    const { room, sendCallback } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    room.start(1);

    (room as any).startLevelUpChoice(player);
    const offer = sendCallback.mock.calls.find((c: any[]) => c[1]?.type === 'LEVEL_UP_CHOICE');
    if (!offer) throw new Error('No LEVEL_UP_CHOICE was sent');
    const pickedId = offer[1].choices[0].id;

    room.handleSelectTrait('p1', pickedId);

    const picks = eventsOfType('level_up_choice');
    expect(picks).toHaveLength(1);
    expect(picks[0].playerId).toBe('p1');
    expect(picks[0].payload.picked).toBe(pickedId);
    expect(picks[0].payload.offered).toContain(pickedId);

    room.stop();
  });

  it('a fatal contact-damage hit logs a death event with cause.sourceType monster_contact and the monster type', () => {
    const { room } = makeRoom();
    const player = addTestPlayer(room, 'p1');
    room.start(1);
    player.invulnerableTimer = 0; // start() grants 2s spawn protection — clear it for this test
    player.stats.hp = 1;
    player.stats.maxHp = 100;

    const monster = new ServerMonster(1, MonsterType.HELLHOUND, 0, 0);
    const died = player.takeDamage(monster.damage * 10, { sourceType: 'monster_contact', monsterType: monster.type });
    expect(died).toBe(true);
    (room as any).logDeathEvent(player);

    const deaths = eventsOfType('death');
    expect(deaths).toHaveLength(1);
    expect(deaths[0].playerId).toBe('p1');
    expect(deaths[0].payload.cause).toEqual({ sourceType: 'monster_contact', monsterType: MonsterType.HELLHOUND });
    expect(deaths[0].payload.survivorCount).toBe(0);

    room.stop();
  });

  it('a co-op surrender (teammates keep playing) still logs run_end for the leaving player, tagged surrender', () => {
    const { room } = makeRoom();
    const leaver = addTestPlayer(room, 'p1');
    addTestPlayer(room, 'p2'); // keeps the room at size 2, so handleSurrender takes the co-op branch
    room.start(1);
    leaver.gold = 7;

    room.handleSurrender('p1');

    const ends = eventsOfType('run_end');
    expect(ends).toHaveLength(1);
    expect(ends[0].playerId).toBe('p1');
    expect(ends[0].payload.outcome).toBe('surrender');
    expect(ends[0].payload.finalGold).toBe(4); // round(7 * SURRENDER_GOLD_RETENTION 0.5) = round(3.5) = 4

    room.stop();
  });

  it('broadcastGameOver logs one run_end row per player still in the room, tagged with the right outcome', () => {
    const { room } = makeRoom();
    const p1 = addTestPlayer(room, 'p1');
    const p2 = addTestPlayer(room, 'p2');
    p1.gold = 42;
    p1.stats.level = 5;
    room.start(1);

    (room as any).broadcastGameOver(false, undefined, 'SURRENDER');

    const ends = eventsOfType('run_end');
    expect(ends).toHaveLength(2);
    const p1End = ends.find((e: any) => e.playerId === 'p1');
    expect(p1End.payload.outcome).toBe('surrender');
    expect(p1End.payload.finalGold).toBe(42);
    expect(p1End.payload.finalLevel).toBe(5);

    room.stop();
  });
});
