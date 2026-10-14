// Espionagem: espiões contratados na taverna, que podem mentir.
import { BALANCE } from './data/balance';
import { ITEMS, stockGet, type ItemId } from './data/items';
import { UNITS, type UnitId } from './data/units';
import { findPath } from './path';
import { rt, settlementById } from './runtime';
import { garrisonOf, type ActionResult } from './settlement';
import { newTraveler, sendLetter } from './logistics';
import { rand } from './rng';
import type { GameState, Settlement, SpyMission, SpyReport, Traveler } from './types';
import { dist, isPlayer, newId, population, pushEvent, relation } from './util';
import { battleStrength } from './battle';

const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason });

/** Moral média do reino (felicidade ponderada pela população). */
export function nationMorale(state: GameState, nation: number): number {
  let m = 0;
  let n = 0;
  for (const s of state.settlements) {
    if (s.nation !== nation) continue;
    const p = Math.max(1, population(s));
    m += s.morale * p;
    n += p;
  }
  return n > 0 ? m / n : 50;
}

export function spyQuote(state: GameState, fromId: number, targetId: number): number {
  const a = settlementById(state, fromId);
  const b = settlementById(state, targetId);
  if (!a || !b) return 0;
  const towers = b.buildings.filter((x) => x.type === 'watchtower' && x.level > 0).length;
  return Math.round(BALANCE.spyBasePrice + dist(a.x, a.y, b.x, b.y) * BALANCE.spyPricePerTile + towers * 10 + (b.kind === 'capital' ? 20 : 0));
}

/**
 * Confiabilidade: pagamento + moral do reino que contratou + facilidade do alvo.
 * O jogador nunca vê este número.
 */
export function spyReliability(state: GameState, nation: number, priceRatio: number, target: Settlement): number {
  const morale = nationMorale(state, nation) / 100;
  let r = 0.35 + 0.3 * morale + 0.3 * Math.min(1.5, Math.max(0.5, priceRatio)) - 0.15;
  // Povo do alvo com moral baixa fala demais.
  r += (50 - target.morale) / 250;
  return Math.max(0.3, Math.min(0.97, r));
}

export type SpyOffer = { ok: true; missionId: number } | { ok: false; reason: string; refused?: boolean };

/** Contrata um espião oferecendo um preço. Abaixo de 60% do pedido ele recusa. */
export function hireSpy(state: GameState, fromId: number, targetId: number, offer: number): SpyOffer {
  const from = settlementById(state, fromId);
  const target = settlementById(state, targetId);
  if (!from || !target) return fail('Alvo inválido');
  if (!from.buildings.some((b) => b.type === 'tavern' && b.level > 0)) return fail('Precisa de uma Taverna aqui');
  if (target.nation === from.nation) return fail('É do seu reino');
  const nation = state.nations[from.nation];
  const base = spyQuote(state, fromId, targetId);
  const price = Math.round(offer);
  if (price < base * 0.6) return { ok: false, reason: 'O espião riu da oferta e foi embora.', refused: true };
  if (nation.gold < price) return fail('Falta ouro');
  const path = findPath(from.x, from.y, target.x, target.y, rt(state).ctx, 60000);
  if (!path) return fail('Sem caminho até o alvo');
  nation.gold -= price;
  const ratio = price / base;
  const reliability = spyReliability(state, from.nation, ratio, target);
  const mission: SpyMission = {
    id: newId(state),
    nation: from.nation,
    targetId,
    fromId,
    price,
    basePrice: base,
    reliability,
    state: 'traveling',
    travelerId: null,
    report: null,
    doubleAgent: ratio < 0.9 && nationMorale(state, from.nation) < 40 && rand(state) < 0.35,
  };
  const t = newTraveler(state, { kind: 'spy', nation: from.nation, x: from.x, y: from.y, speed: BALANCE.spySpeed, path, fromId, toId: targetId, spyMissionId: mission.id });
  mission.travelerId = t.id;
  state.spyMissions.push(mission);
  return { ok: true, missionId: mission.id };
}

function range(v: number, width: number, factor: number): [number, number] {
  const c = v * factor;
  const lo = Math.max(0, Math.floor(c * (1 - width)));
  const hi = Math.ceil(c * (1 + width));
  return [lo, Math.max(lo, hi)];
}

export function makeReport(state: GameState, m: SpyMission, target: Settlement): SpyReport {
  const lied = rand(state) > m.reliability;
  const factor = lied ? (rand(state) < 0.5 ? 0.4 + rand(state) * 0.3 : 1.5 + rand(state) * 0.7) : 1;
  const width = 0.08 + (1 - m.reliability) * 0.5;
  const g = garrisonOf(state, target);
  const troops: SpyReport['troops'] = {};
  if (g) for (const k in g.troops) troops[k as UnitId] = range(g.troops[k as UnitId] ?? 0, width, factor);
  const stock: Record<string, [number, number]> = {};
  for (const k of ['wood', 'stone', 'iron', 'bread', 'weapon', 'horse'] as ItemId[]) {
    const v = stockGet(target.stock, k);
    if (v > 0) stock[ITEMS[k].name] = range(v, width, factor);
  }
  let clue: string;
  if (lied) clue = rand(state) < 0.6 ? 'O espião parecia nervoso e evitava olhar nos seus olhos.' : 'Ele voltou rápido demais para quem foi tão longe.';
  else if (m.reliability > 0.8) clue = rand(state) < 0.5 ? 'Trouxe anotações detalhadas e desenhos das muralhas.' : 'Respondeu a todas as perguntas sem hesitar.';
  else clue = rand(state) < 0.5 ? 'O relatório é vago em alguns pontos.' : 'Pediu mais vinho antes de contar o resto.';
  if (target.morale < 35) clue += ' Disse que o povo de lá reclama de tudo e fala demais.';
  return {
    time: state.time,
    targetId: target.id,
    targetName: target.name,
    troops,
    stock,
    wall: range(target.defenses.wallLevel, 0, lied ? factor : 1).map((v) => Math.min(5, Math.round(v))) as [number, number],
    population: range(population(target), width, factor),
    clue,
    lied,
  };
}

function spyArrived(state: GameState, t: Traveler): boolean {
  const m = state.spyMissions.find((x) => x.id === t.spyMissionId);
  if (!m) return true;
  const target = settlementById(state, m.targetId);
  if (m.state === 'traveling' && target) {
    // Captura: alvos com moral alta e torres de vigia pegam mais espiões.
    const towers = target.buildings.filter((b) => b.type === 'watchtower' && b.level > 0).length;
    const capture = 0.08 + Math.max(0, target.morale - 50) / 200 + towers * 0.08 - m.reliability * 0.08;
    if (rand(state) < capture) {
      m.state = 'captured';
      const r = relation(state, m.nation, target.nation);
      r.grudge[target.nation] = Math.min(100, (r.grudge[target.nation] ?? 0) + 15);
      if (isPlayer(state, m.nation)) pushEvent(state, `Seu espião foi capturado em ${target.name}.`, 'bad', target.x, target.y);
      if (isPlayer(state, target.nation)) pushEvent(state, `Um espião de ${state.nations[m.nation].name} foi capturado em ${target.name}.`, 'good', target.x, target.y);
      return true;
    }
    m.report = makeReport(state, m, target);
    if (m.doubleAgent) {
      // Agente duplo: conta ao alvo a força de quem o contratou.
      const k = state.nations[target.nation].knowledge;
      k[m.nation] = { strength: nationStrength(state, m.nation), time: state.time };
    }
    // Volta para casa.
    const home = settlementById(state, m.fromId);
    const path = home ? findPath(Math.round(t.x), Math.round(t.y), home.x, home.y, rt(state).ctx, 60000) : null;
    if (home && path) {
      m.state = 'returning';
      t.path = path;
      t.pathIdx = 0;
      t.returning = true;
      return false;
    }
  }
  if (m.report) deliverReport(state, m);
  m.state = 'done';
  return true;
}

function deliverReport(state: GameState, m: SpyMission): void {
  const r = m.report!;
  const lines = [
    `Relatório sobre ${r.targetName}:`,
    ...Object.entries(r.troops).map(([u, v]) => `• ${UNITS[u as UnitId].plural}: entre ${v![0]} e ${v![1]}`),
    `• População: entre ${r.population[0]} e ${r.population[1]}`,
    `• Muralha: nível ${r.wall[0]}${r.wall[1] !== r.wall[0] ? ` a ${r.wall[1]}` : ''}`,
    ...Object.entries(r.stock).map(([k, v]) => `• ${k}: entre ${v[0]} e ${v[1]}`),
    '',
    r.clue,
  ];
  if (state.nations[m.nation].kind === 'player') {
    sendLetter(state, { fromNation: m.nation, toNation: m.nation, sender: 'Seu espião', subject: `Relatório de espionagem: ${r.targetName}`, body: lines.join('\n') });
  } else {
    // A IA usa o relatório (mentiroso ou não) para decidir guerras.
    const target = settlementById(state, m.targetId);
    if (target) {
      const est = Object.entries(r.troops).reduce((n, [u, v]) => n + ((v![0] + v![1]) / 2) * ((UNITS[u as UnitId].attack + UNITS[u as UnitId].defense) / 2), 0);
      state.nations[m.nation].knowledge[target.nation] = { strength: est * Math.max(1, state.settlements.filter((s) => s.nation === target.nation).length * 0.7), time: state.time };
    }
  }
}

/** Força militar total de um reino (verdade, usada pela IA quando tem informação). */
export function nationStrength(state: GameState, nation: number): number {
  let s = 0;
  for (const a of state.armies) if (a.nation === nation) s += battleStrength(a.troops);
  return s;
}

/**
 * Contraespionagem do jogador: 0 nada, 1 silêncio, 2 desinformação.
 * Custa ouro por minuto; com moral baixa custa mais e falha mais.
 */
export function setCounterIntel(state: GameState, nation: number, level: number): ActionResult {
  const n = state.nations[nation];
  if (level < 0 || level > 2) return fail('Nível inválido');
  if (level > 0 && !state.settlements.some((s) => s.nation === nation && s.buildings.some((b) => b.type === 'tavern' && b.level > 0))) return fail('Precisa de uma Taverna');
  n.counterIntel = level;
  return { ok: true };
}

export function counterIntelCost(state: GameState, nation: number): number {
  const n = state.nations[nation];
  if (!n.counterIntel) return 0;
  const morale = nationMorale(state, nation);
  return (n.counterIntel === 1 ? 4 : 8) * (1 + Math.max(0, 50 - morale) / 50);
}

/**
 * Quando a IA espiona alguém, a contraespionagem do alvo pode silenciar ou
 * falsear o relatório. Chamado pela IA ao montar a estimativa.
 */
export function counterIntelEffect(state: GameState, target: number): { silence: boolean; falseFactor: number } {
  const n = state.nations[target];
  if (!n.counterIntel) return { silence: false, falseFactor: 1 };
  const morale = nationMorale(state, target);
  const success = 0.5 + morale / 200;
  if (rand(state) > success) return { silence: false, falseFactor: 1 };
  if (n.counterIntel === 1) return { silence: true, falseFactor: 1 };
  return { silence: false, falseFactor: rand(state) < 0.5 ? 0.5 : 1.8 };
}

export function tickSpies(state: GameState, dt: number): void {
  for (const n of state.nations) {
    if (n.counterIntel) n.gold -= (counterIntelCost(state, n.id) * dt) / 60;
  }
  state.spyMissions = state.spyMissions.filter((m) => m.state === 'traveling' || m.state === 'returning' || state.time - (m.report?.time ?? state.time) < 1200);
}

export { spyArrived };
