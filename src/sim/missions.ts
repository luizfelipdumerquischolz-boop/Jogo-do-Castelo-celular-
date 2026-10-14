// Missões curtas que guiam o jogador no começo.
import type { Stock } from './data/items';
import type { GameState } from './types';
import { population, pushEvent } from './util';
import { stockAdd } from './data/items';

interface MissionDef {
  id: string;
  text: string;
  reward: { gold?: number; items?: Stock };
  check: (state: GameState) => boolean;
}

const mine = (state: GameState) => state.settlements.filter((s) => s.nation === state.playerNation);
const hasB = (state: GameState, type: string, level = 1) => mine(state).some((s) => s.buildings.some((b) => b.type === type && b.level >= level));

export const MISSIONS: MissionDef[] = [
  { id: 'farm2', text: 'Construa uma Fazenda de aveia', reward: { items: { wood: 80 } }, check: (s) => hasB(s, 'oat_farm') },
  { id: 'kitchen', text: 'Construa uma Cozinha comunitária (mingau)', reward: { items: { stone: 60 } }, check: (s) => hasB(s, 'kitchen') },
  { id: 'quarry', text: 'Construa uma Pedreira', reward: { gold: 40 }, check: (s) => hasB(s, 'quarry') },
  { id: 'barracks', text: 'Construa um Quartel', reward: { items: { weapon: 10 } }, check: (s) => hasB(s, 'barracks') },
  { id: 'iron', text: 'Construa uma Mina de ferro perto de um depósito', reward: { gold: 60 }, check: (s) => hasB(s, 'iron_mine') },
  { id: 'smith', text: 'Construa um Ferreiro', reward: { items: { iron: 40 } }, check: (s) => hasB(s, 'blacksmith') },
  { id: 'vitamins', text: 'Alimente o povo com os três grupos: energia, proteína e vitaminas', reward: { gold: 80 }, check: (s) => mine(s).some((x) => x.diet.energy > 0.1 && x.diet.protein > 0.1 && x.diet.vitamins > 0.1) },
  { id: 'bandits', text: 'Derrote um acampamento de bandidos', reward: { gold: 100 }, check: (s) => (s.stats.banditCampsDestroyed ?? 0) > 0 },
  { id: 'keep2', text: 'Suba a Torre de Menagem para o nível 2', reward: { items: { stone: 150 } }, check: (s) => hasB(s, 'keep', 2) },
  { id: 'village', text: 'Funde a sua primeira aldeia com colonos', reward: { gold: 150 }, check: (s) => mine(s).length >= 2 },
  { id: 'pop100', text: 'Chegue a 100 cidadãos no reino', reward: { gold: 120 }, check: (s) => mine(s).reduce((n, x) => n + population(x), 0) >= 100 },
  { id: 'library', text: 'Construa uma Biblioteca e comece uma pesquisa', reward: { gold: 100 }, check: (s) => hasB(s, 'library') && !!s.nations[s.playerNation].research.current },
  { id: 'tribe', text: 'Derrote ou torne vassala uma tribo bárbara', reward: { gold: 250 }, check: (s) => (s.stats.tribesBeaten ?? 0) > 0 },
  { id: 'keep5', text: 'Suba a Torre de Menagem para o nível 5', reward: { gold: 300 }, check: (s) => hasB(s, 'keep', 5) },
];

export function checkMissions(state: GameState): void {
  for (const m of state.missions) {
    if (m.done) continue;
    const def = MISSIONS.find((d) => d.id === m.id);
    if (!def || !def.check(state)) continue;
    m.done = true;
    const nation = state.nations[state.playerNation];
    if (m.reward.gold) nation.gold += m.reward.gold;
    const cap = state.settlements.find((s) => s.id === nation.capitalId);
    if (cap && m.reward.items) for (const k in m.reward.items) stockAdd(cap.stock, k as keyof Stock, m.reward.items[k as keyof Stock] ?? 0);
    pushEvent(state, `Missão cumprida: ${m.text}. Recompensa entregue.`, 'good');
  }
}
