// Todas as ações que o jogador pode fazer, num formato serializável
// (a interface manda estas mensagens para o Web Worker da simulação).
import type { BuildingCategory, BuildingId, Vocation } from './data/buildings';
import type { ItemId, Stock } from './data/items';
import type { Troops, UnitId } from './data/units';
import { formArmy, orderAttack, orderDefend, orderMove, orderReturn, setFormation } from './army';
import { orderEscort, orderHunt, orderPatrol } from './ai';
import { answerProposal, freePrisoner, payRansom, propose, type ProposalType } from './diplomacy';
import { assignCommander, assignConsul, dismissHero, hireHero, unassign } from './heroes';
import { buildRoad, createRoute, deleteRoute, reinforceFromCapital, sendColonists, sendWagon, toggleRoute } from './logistics';
import { buy, sell, sendCaravan } from './market';
import { buyFromMerchant, startResearch } from './progress';
import { armyById, heroById, settlementById } from './runtime';
import {
  demolishBuilding,
  dismissTroops,
  investDistrict,
  moveBuilding,
  placeBuilding,
  recruit,
  setDistrictVocation,
  setRecipeWeight,
  setVocation,
  upgradeBuilding,
  upgradeDefense,
  type ActionResult,
  type DefenseUpgrade,
} from './settlement';
import { hireSpy, setCounterIntel } from './spy';
import type { Formation, GameState, Ration } from './types';

export type Action =
  | { type: 'place'; settlement: number; building: BuildingId; x: number; y: number }
  | { type: 'upgrade'; settlement: number; building: number }
  | { type: 'move-building'; settlement: number; building: number; x: number; y: number }
  | { type: 'demolish'; settlement: number; building: number }
  | { type: 'recipe'; settlement: number; building: number; recipe: string; weight: number }
  | { type: 'defense'; settlement: number; what: DefenseUpgrade }
  | { type: 'recruit'; settlement: number; unit: UnitId; count: number }
  | { type: 'dismiss'; settlement: number; unit: UnitId; count: number }
  | { type: 'ration'; settlement: number; ration: Ration }
  | { type: 'tax'; settlement: number; tax: number }
  | { type: 'priorities'; settlement: number; priorities: BuildingCategory[] }
  | { type: 'vocation'; settlement: number; vocation: Vocation }
  | { type: 'district'; settlement: number; quadrant: number; vocation: Vocation }
  | { type: 'invest'; settlement: number; quadrant: number }
  | { type: 'form-army'; settlement: number; troops: Troops; name?: string }
  | { type: 'army-move'; army: number; x: number; y: number }
  | { type: 'army-attack'; army: number; target: number; mode: 'attack' | 'raid' }
  | { type: 'army-return'; army: number }
  | { type: 'army-defend'; army: number; x: number; y: number }
  | { type: 'army-patrol'; army: number; x: number; y: number }
  | { type: 'army-hunt'; army: number }
  | { type: 'army-escort'; army: number }
  | { type: 'army-formation'; army: number; formation: Formation }
  | { type: 'army-direct'; army: number }
  | { type: 'colonize'; settlement: number; x: number; y: number; kind: 'village' | 'castle' | 'outpost' }
  | { type: 'wagon'; from: number; to: number; cargo: Stock }
  | { type: 'route-create'; from: number; to: number; item: ItemId; amount: number }
  | { type: 'route-toggle'; route: number; active: boolean }
  | { type: 'route-delete'; route: number }
  | { type: 'road'; from: number; to: number }
  | { type: 'caravan'; from: number; to: number; cargo: Stock }
  | { type: 'sell'; settlement: number; item: ItemId; qty: number }
  | { type: 'buy'; settlement: number; item: ItemId; qty: number }
  | { type: 'hire-hero'; hero: number }
  | { type: 'commander'; hero: number; army: number }
  | { type: 'consul'; hero: number; settlement: number }
  | { type: 'unassign-hero'; hero: number }
  | { type: 'dismiss-hero'; hero: number }
  | { type: 'spy'; from: number; target: number; offer: number }
  | { type: 'counter-intel'; level: number }
  | { type: 'propose'; to: number; proposal: ProposalType; gold?: number }
  | { type: 'answer'; letter: number; accept: boolean }
  | { type: 'letter-action'; letter: number; index: number }
  | { type: 'read-letter'; letter: number }
  | { type: 'read-reports' }
  | { type: 'research'; id: string }
  | { type: 'ransom-pay'; prisoner: number }
  | { type: 'ransom-ask'; prisoner: number }
  | { type: 'release-prisoner'; prisoner: number };

const fail = (reason: string): ActionResult => ({ ok: false, reason });

function own(state: GameState, settlementId: number): boolean {
  return settlementById(state, settlementId)?.nation === state.playerNation;
}

function ownArmy(state: GameState, armyId: number): boolean {
  return armyById(state, armyId)?.nation === state.playerNation;
}

export function applyAction(state: GameState, a: Action): ActionResult & { armyId?: number; missionId?: number } {
  const p = state.playerNation;
  if (state.defeated) return fail('O reino caiu');
  if ('settlement' in a && !own(state, a.settlement)) return fail('Assentamento não é seu');
  if ('army' in a && a.type !== 'commander' && !ownArmy(state, a.army)) return fail('Exército não é seu');
  switch (a.type) {
    case 'place':
      return placeBuilding(state, a.settlement, a.building, a.x, a.y);
    case 'upgrade':
      return upgradeBuilding(state, a.settlement, a.building);
    case 'move-building':
      return moveBuilding(state, a.settlement, a.building, a.x, a.y);
    case 'demolish':
      return demolishBuilding(state, a.settlement, a.building);
    case 'recipe':
      return setRecipeWeight(state, a.settlement, a.building, a.recipe, a.weight);
    case 'defense':
      return upgradeDefense(state, a.settlement, a.what);
    case 'recruit':
      return recruit(state, a.settlement, a.unit, a.count);
    case 'dismiss':
      return dismissTroops(state, a.settlement, a.unit, a.count);
    case 'ration':
      settlementById(state, a.settlement)!.ration = a.ration;
      return { ok: true };
    case 'tax':
      settlementById(state, a.settlement)!.tax = Math.max(0, Math.min(3, Math.round(a.tax)));
      return { ok: true };
    case 'priorities':
      settlementById(state, a.settlement)!.priorities = a.priorities;
      return { ok: true };
    case 'vocation':
      return setVocation(state, a.settlement, a.vocation);
    case 'district':
      return setDistrictVocation(state, a.settlement, a.quadrant, a.vocation);
    case 'invest':
      return investDistrict(state, a.settlement, a.quadrant);
    case 'form-army':
      return formArmy(state, a.settlement, a.troops, a.name);
    case 'army-move':
      return orderMove(state, a.army, a.x, a.y);
    case 'army-attack':
      return orderAttack(state, a.army, a.target, a.mode);
    case 'army-return':
      return orderReturn(state, a.army);
    case 'army-defend':
      return orderDefend(state, a.army, a.x, a.y);
    case 'army-patrol':
      return orderPatrol(state, a.army, a.x, a.y) as ActionResult;
    case 'army-hunt':
      return orderHunt(state, a.army) as ActionResult;
    case 'army-escort':
      return orderEscort(state, a.army) as ActionResult;
    case 'army-formation':
      return setFormation(state, a.army, a.formation);
    case 'army-direct': {
      const ar = armyById(state, a.army)!;
      ar.autonomous = false;
      return { ok: true };
    }
    case 'colonize':
      return sendColonists(state, a.settlement, a.x, a.y, a.kind);
    case 'wagon':
      if (!own(state, a.from) || !own(state, a.to)) return fail('Rota inválida');
      return sendWagon(state, a.from, a.to, a.cargo);
    case 'route-create':
      if (!own(state, a.from)) return fail('Rota inválida');
      return createRoute(state, a.from, a.to, a.item, a.amount);
    case 'route-toggle':
      return toggleRoute(state, a.route, a.active);
    case 'route-delete':
      return deleteRoute(state, a.route);
    case 'road':
      if (!own(state, a.from)) return fail('Estrada inválida');
      return buildRoad(state, a.from, a.to);
    case 'caravan':
      if (!own(state, a.from)) return fail('Origem inválida');
      return sendCaravan(state, a.from, a.to, a.cargo);
    case 'sell':
      return sell(state, a.settlement, a.item, a.qty);
    case 'buy':
      return buy(state, a.settlement, a.item, a.qty);
    case 'hire-hero':
      return hireHero(state, p, a.hero);
    case 'commander':
      if (!ownArmy(state, a.army)) return fail('Exército não é seu');
      return assignCommander(state, a.hero, a.army);
    case 'consul':
      return assignConsul(state, a.hero, a.settlement);
    case 'unassign-hero': {
      const h = heroById(state, a.hero);
      if (!h || h.nation !== p) return fail('Herói inválido');
      unassign(state, h);
      return { ok: true };
    }
    case 'dismiss-hero':
      if (heroById(state, a.hero)?.nation !== p) return fail('Herói inválido');
      return dismissHero(state, a.hero);
    case 'spy':
      if (!own(state, a.from)) return fail('Origem inválida');
      return hireSpy(state, a.from, a.target, a.offer);
    case 'counter-intel':
      return setCounterIntel(state, p, a.level);
    case 'propose':
      return propose(state, p, a.to, a.proposal, a.gold ?? 0);
    case 'answer':
      return answerProposal(state, a.letter, a.accept);
    case 'letter-action':
      return letterAction(state, a.letter, a.index);
    case 'read-letter': {
      const l = state.letters.find((x) => x.id === a.letter && x.toNation === p);
      if (l) l.read = true;
      return { ok: true };
    }
    case 'read-reports':
      for (const r of state.reports) r.read = true;
      return { ok: true };
    case 'research':
      return startResearch(state, p, a.id);
    case 'ransom-pay':
      return payRansom(state, a.prisoner);
    case 'ransom-ask': {
      const pr = state.prisoners.find((x) => x.id === a.prisoner && x.holder === p);
      if (!pr) return fail('Prisioneiro inválido');
      return propose(state, p, pr.owner, 'ransom', pr.ransom);
    }
    case 'release-prisoner': {
      const pr = state.prisoners.find((x) => x.id === a.prisoner && x.holder === p);
      if (!pr) return fail('Prisioneiro inválido');
      freePrisoner(state, pr.id);
      state.nations[p].reputation += 3;
      return { ok: true };
    }
  }
  return fail('Ação desconhecida');
}

function letterAction(state: GameState, letterId: number, index: number): ActionResult {
  const l = state.letters.find((x) => x.id === letterId && x.toNation === state.playerNation);
  if (!l) return fail('Carta inválida');
  const act = l.actions[index];
  if (!act) return fail('Ação inválida');
  switch (act.action) {
    case 'accept':
      return answerProposal(state, l.id, true);
    case 'refuse':
      return answerProposal(state, l.id, false);
    case 'merchant':
      return buyFromMerchant(state, l.id);
    case 'reinforce':
      l.actions = [];
      return reinforceFromCapital(state, Number(act.arg), (s, from, t) => formArmy(s, from, t), orderMove);
    case 'ration-low': {
      const s = settlementById(state, Number(act.arg));
      if (s) s.ration = 'low';
      l.actions = [];
      return { ok: true };
    }
  }
  return fail('Ação desconhecida');
}
