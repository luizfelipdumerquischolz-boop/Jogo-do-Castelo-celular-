import { tickInvaders, tickLord } from './ai';
import { BUILDINGS, UNITS } from './config';
import { tickCastle } from './economy';
import { PLAYER_ID } from './state';
import type { GameState } from './types';
import { pushEvent, tickCamps, tickMarches } from './world';

/** Maior passo interno de simulação, para manter o resultado igual com qualquer taxa de quadros. */
export const MAX_STEP = 1;

function step(state: GameState, dt: number): void {
  state.time += dt;
  for (const f of state.fortresses) {
    if (!f.castle) continue;
    const res = tickCastle(f.castle, dt);
    if (f.id === PLAYER_ID) {
      for (const b of res.built) pushEvent(state, `${BUILDINGS[b.building].name} chegou ao nível ${b.level}.`, 'good');
      for (const t of res.finishedBatches) {
        const text = t.count > 1 ? `${t.count} ${UNITS[t.unit].plural} prontos` : `1 ${UNITS[t.unit].name} pronto`;
        pushEvent(state, `Treino concluído: ${text} para a batalha.`, 'good');
      }
    } else if (f.faction === 'lord') {
      tickLord(state, f, dt);
    }
  }
  tickCamps(state, dt);
  tickInvaders(state, dt);
  tickMarches(state, dt);
}

/**
 * Avança o jogo em `seconds` segundos de tempo de jogo.
 * Função pura em relação ao mundo exterior: não lê relógio, não faz I/O.
 * Só é chamada enquanto o app está aberto — por isso nada é produzido com o jogo fechado.
 */
export function tick(state: GameState, seconds: number): GameState {
  if (!(seconds > 0)) return state;
  let left = seconds;
  while (left > 1e-9) {
    const dt = Math.min(MAX_STEP, left);
    step(state, dt);
    left -= dt;
  }
  return state;
}
