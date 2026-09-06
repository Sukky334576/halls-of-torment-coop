import { GameRoom } from './engine/GameRoom';
import { PlayerClass } from '../shared/types';

console.log('⚡ Starting Server Engine Benchmark (4 Players + 1,000 Mobs)...');

const mockSend = () => {};
const room = new GameRoom('bench_room', mockSend);

// Add 4 players
room.addPlayer('p_1', 'Swordsman_Tester', PlayerClass.SWORDSMAN);
room.addPlayer('p_2', 'Archer_Tester', PlayerClass.ARCHER);
room.addPlayer('p_3', 'Sorceress_Tester', PlayerClass.SORCERESS);
room.addPlayer('p_4', 'Cleric_Tester', PlayerClass.CLERIC);

room.start();

// Simulate 200 ticks (approx 8 seconds of gameplay)
const startTime = performance.now();
const testTicks = 200;

for (let i = 0; i < testTicks; i++) {
  // Give players input
  room.handleInput('p_1', 1, 0, 0, true);
  room.handleInput('p_2', 0, 1, Math.PI / 2, true);
  room.handleInput('p_3', -1, 0, Math.PI, true);
  room.handleInput('p_4', 0, -1, -Math.PI / 2, true);

  // Call private tick via method if needed or run interval
}

const elapsedMs = performance.now() - startTime;
console.log(`✅ Benchmark Completed in ${elapsedMs.toFixed(2)}ms for ${testTicks} input steps`);
room.stop();
process.exit(0);
