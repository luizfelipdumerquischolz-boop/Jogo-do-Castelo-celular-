// A função de tick: avança o mundo de forma determinística, em passos de no máximo 1 s.
// Não lê relógio nem faz I/O. Só é chamada com o app aberto, então nada acontece com ele fechado.
import './wire';
import { BALANCE } from './data/balance';
import { tickAI, tickHordes, cultureConversion } from './ai';
import { tickArmies, updateVision } from './army';
import { tickBattles, tickCamps } from './battle';
import { tickDiplomacy, updateTensions } from './diplomacy';
import { tickHeroes } from './heroes';
import { tickTravelers } from './logistics';
import { checkMissions } from './missions';
import { tickProgress } from './progress';
import { reindex, updateTerritory } from './runtime';
import { ageOneYear, tickSettlement } from './settlement';
import { tickSpies } from './spy';
import type { GameState } from './types';
import { year } from './util';

function step(state: GameState, dt: number): void {
  const before = year(state.time);
  state.time += dt;
  if (year(state.time) !== before) {
    for (const s of state.settlements) ageOneYear(s);
  }
  reindex(state);
  updateTerritory(state);
  for (const s of state.settlements) tickSettlement(state, s, dt);
  tickArmies(state, dt);
  tickBattles(state, dt);
  tickTravelers(state, dt);
  tickCamps(state, dt);
  tickHeroes(state, dt);
  tickSpies(state, dt);
  tickAI(state, dt);
  tickHordes(state, dt);
  tickDiplomacy(state, dt);
  tickProgress(state, dt);
  if (state.time % 10 < dt) {
    updateTensions(state);
    checkMissions(state);
  }
  if (state.time % 30 < dt) cultureConversion(state);
  updateVision(state);
}

/** Avança o jogo `seconds` segundos de tempo de jogo. */
export function tick(state: GameState, seconds: number): GameState {
  if (!(seconds > 0) || state.defeated) return state;
  let left = seconds;
  while (left > 1e-9) {
    const dt = Math.min(BALANCE.maxStep, left);
    step(state, dt);
    left -= dt;
  }
  return state;
}
