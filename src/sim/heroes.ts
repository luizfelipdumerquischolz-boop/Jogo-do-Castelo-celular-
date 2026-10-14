// Heróis: contratados na taverna, servem como comandantes de exército ou cônsules.
import { armyById, heroById, settlementById } from './runtime';
import { randomHero } from './create';
import { repairWalls, type ActionResult } from './settlement';
import type { GameState, Hero } from './types';
import { isPlayer, pushEvent } from './util';

const fail = (reason: string): ActionResult => ({ ok: false, reason });

export const TRAIT_INFO: Record<string, string> = {
  cauteloso: 'Comandante: +10% de defesa e recua mais cedo.',
  ousado: 'Comandante: +10% de ataque.',
  'bom em cerco': 'Comandante: máquinas de cerco causam 50% mais dano.',
  protetor: 'Comandante: 15% menos baixas.',
  administrador: 'Cônsul: +10% de produção no assentamento.',
  general: 'Comandante: +5% de ataque e defesa. Cônsul: reparos automáticos.',
  mercador: 'Cônsul: +20% de impostos.',
  honesto: 'Cônsul: +8 de lealdade.',
  corrupto: 'Cônsul: −15% de impostos (desvia para si).',
};

export function tavernHeroes(state: GameState): Hero[] {
  return state.heroes.filter((h) => h.nation === -1);
}

export function hasTavern(state: GameState, nation: number): boolean {
  return state.settlements.some((s) => s.nation === nation && s.buildings.some((b) => b.type === 'tavern' && b.level > 0));
}

export function hireHero(state: GameState, nation: number, heroId: number): ActionResult {
  const h = heroById(state, heroId);
  if (!h || h.nation !== -1) return fail('Herói indisponível');
  if (!hasTavern(state, nation)) return fail('Precisa de uma Taverna');
  const n = state.nations[nation];
  if (n.gold < h.hirePrice) return fail('Falta ouro');
  n.gold -= h.hirePrice;
  h.nation = nation;
  if (isPlayer(state, nation)) pushEvent(state, `${h.name} entrou para o seu serviço.`, 'good');
  return { ok: true };
}

export function assignCommander(state: GameState, heroId: number, armyId: number): ActionResult {
  const h = heroById(state, heroId);
  const a = armyById(state, armyId);
  if (!h || !a || h.nation !== a.nation) return fail('Inválido');
  if (h.captiveOf != null) return fail('Herói capturado');
  unassign(state, h);
  if (a.commanderId != null) {
    const old = heroById(state, a.commanderId);
    if (old) unassign(state, old);
  }
  h.role = 'commander';
  h.assignedTo = a.id;
  a.commanderId = h.id;
  a.autonomous = true;
  return { ok: true };
}

export function assignConsul(state: GameState, heroId: number, settlementId: number): ActionResult {
  const h = heroById(state, heroId);
  const s = settlementById(state, settlementId);
  if (!h || !s || h.nation !== s.nation) return fail('Inválido');
  if (s.kind === 'capital') return fail('A capital é governada por você');
  if (h.captiveOf != null) return fail('Herói capturado');
  unassign(state, h);
  if (s.consulId != null) {
    const old = heroById(state, s.consulId);
    if (old) unassign(state, old);
  }
  h.role = 'consul';
  h.assignedTo = s.id;
  s.consulId = h.id;
  return { ok: true };
}

export function unassign(state: GameState, h: Hero): void {
  if (h.role === 'commander') {
    const a = armyById(state, h.assignedTo);
    if (a && a.commanderId === h.id) {
      a.commanderId = null;
      a.autonomous = false;
    }
  }
  if (h.role === 'consul') {
    const s = settlementById(state, h.assignedTo);
    if (s && s.consulId === h.id) s.consulId = null;
  }
  h.role = 'none';
  h.assignedTo = null;
}

export function dismissHero(state: GameState, heroId: number): ActionResult {
  const h = heroById(state, heroId);
  if (!h) return fail('Inválido');
  unassign(state, h);
  h.nation = -1;
  return { ok: true };
}

/** Salários, renovação da taverna e ações automáticas dos cônsules. */
export function tickHeroes(state: GameState, dt: number): void {
  for (const h of state.heroes) {
    if (h.nation < 0 || h.captiveOf != null) continue;
    const n = state.nations[h.nation];
    n.gold -= (h.wage * dt) / 60 / 5;
    if (n.gold < -50 && isPlayer(state, h.nation)) {
      unassign(state, h);
      h.nation = -1;
      pushEvent(state, `${h.name} foi embora por falta de pagamento.`, 'bad');
    }
  }
  // A taverna recebe heróis novos de tempos em tempos.
  if (state.time % 240 < dt && tavernHeroes(state).length < 4) state.heroes.push(randomHero(state));
  // Cônsules: reparos e ração.
  if (state.time % 15 < dt) {
    for (const s of state.settlements) {
      if (s.consulId == null) continue;
      const h = heroById(state, s.consulId);
      if (!h) continue;
      if (s.hunger > 0.2 && s.ration === 'high') s.ration = 'normal';
      if (s.hunger > 0.4 && s.ration === 'normal') s.ration = 'low';
      if (s.hunger < 0.02 && s.ration === 'low') s.ration = 'normal';
      if (h.traits.includes('general') || h.traits.includes('administrador')) repairWalls(state, s, 30);
    }
  }
}

/** Bônus de cônsul na produção e impostos (lido pela economia). */
export function consulBonus(state: GameState, settlementId: number): { production: number; tax: number; loyalty: number } {
  const s = settlementById(state, settlementId);
  const h = s ? heroById(state, s.consulId) : undefined;
  if (!h) return { production: 1, tax: 1, loyalty: 0 };
  return {
    production: (h.traits.includes('administrador') ? 1.1 : 1) * (1 + h.level * 0.01),
    tax: (h.traits.includes('mercador') ? 1.2 : 1) * (h.traits.includes('corrupto') ? 0.85 : 1),
    loyalty: h.traits.includes('honesto') ? 8 : 0,
  };
}
