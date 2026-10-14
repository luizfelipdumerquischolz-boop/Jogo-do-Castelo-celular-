// Tudo o que viaja entre assentamentos: carroças, caravanas, mensageiros, colonos e navios.
import { BALANCE } from './data/balance';
import { ITEMS, stockAdd, stockGet, type ItemId, type Stock } from './data/items';
import type { SettlementKind } from './data/buildings';
import { MAP_SIZE, getMap, idx, inBounds, isBuildable, moveCost, tileX, tileY } from './map';
import { findPath } from './path';
import { markTerritoryDirty, rt, settlementById, syncMoveContext } from './runtime';
import { addBuilding, newSettlement, randomPlaceName } from './create';
import { garrisonOf, gridSizeFor, keepLevel, storageCap, type ActionResult } from './settlement';
import type { GameState, Letter, LetterAction, Settlement, Traveler } from './types';
import { MAX_LETTERS, addAdults, adults, dist, isHostile, isPlayer, newId, pushEvent, takeAdults } from './util';

const fail = (reason: string): ActionResult => ({ ok: false, reason });

export function newTraveler(state: GameState, t: Partial<Traveler> & Pick<Traveler, 'kind' | 'nation' | 'x' | 'y' | 'speed'>): Traveler {
  const tr: Traveler = {
    id: newId(state),
    path: [],
    pathIdx: 0,
    fromId: -1,
    toId: -1,
    cargo: {},
    gold: 0,
    letterId: null,
    colonists: null,
    spyMissionId: null,
    routeId: null,
    armyTroops: null,
    wave: 0,
    returning: false,
    ...t,
  };
  state.travelers.push(tr);
  return tr;
}

function pathBetween(state: GameState, ax: number, ay: number, bx: number, by: number): number[] | null {
  return findPath(Math.round(ax), Math.round(ay), bx, by, rt(state).ctx, 60000);
}

// Cartas -----------------------------------------------------------------------

export function messengerSpeed(state: GameState, nation: number): number {
  return BALANCE.messengerSpeed * (state.nations[nation]?.research.done.includes('adm4') ? 1.5 : 1);
}

/**
 * Envia uma carta. Se sair de longe, um mensageiro leva até a capital do destinatário
 * (e pode ser interceptado no caminho).
 */
export function sendLetter(
  state: GameState,
  opts: {
    fromNation: number;
    toNation: number;
    sender: string;
    subject: string;
    body: string;
    fromX?: number;
    fromY?: number;
    settlementId?: number | null;
    actions?: LetterAction[];
    proposal?: Letter['proposal'];
  },
): Letter {
  const letter: Letter = {
    id: newId(state),
    fromNation: opts.fromNation,
    toNation: opts.toNation,
    sender: opts.sender,
    subject: opts.subject,
    body: opts.body,
    time: state.time,
    arrived: false,
    read: false,
    intercepted: false,
    settlementId: opts.settlementId ?? null,
    actions: opts.actions ?? [],
    proposal: opts.proposal ?? null,
  };
  state.letters.push(letter);
  if (state.letters.length > MAX_LETTERS) {
    const drop = state.letters.findIndex((l) => l.arrived && l.read);
    state.letters.splice(drop >= 0 ? drop : 0, 1);
  }
  const dest = settlementById(state, state.nations[opts.toNation]?.capitalId);
  const fx = opts.fromX ?? dest?.x ?? 0;
  const fy = opts.fromY ?? dest?.y ?? 0;
  if (!dest || dist(fx, fy, dest.x, dest.y) < 2) {
    deliverLetter(state, letter);
    return letter;
  }
  const path = pathBetween(state, fx, fy, dest.x, dest.y);
  if (!path) {
    deliverLetter(state, letter);
    return letter;
  }
  newTraveler(state, { kind: 'messenger', nation: opts.fromNation, x: fx, y: fy, speed: messengerSpeed(state, opts.fromNation), path, toId: dest.id, letterId: letter.id });
  return letter;
}

export let letterArrivedHook = (_state: GameState, _l: Letter): void => {};
export function setLetterArrivedHook(fn: typeof letterArrivedHook): void {
  letterArrivedHook = fn;
}

function deliverLetter(state: GameState, l: Letter): void {
  l.arrived = true;
  l.time = state.time;
  if (isPlayer(state, l.toNation)) pushEvent(state, `Chegou uma carta: ${l.subject}`, 'info');
  letterArrivedHook(state, l);
}

/** Aviso de um assentamento: carta do cônsul (ou do escrivão) para a capital. */
export function settlementNotice(state: GameState, s: Settlement, key: string, text: string, bad: boolean): void {
  if (!isPlayer(state, s.nation)) return;
  const nation = state.nations[s.nation];
  if (nation.capitalId === s.id) {
    pushEvent(state, text, bad ? 'bad' : 'info', s.x, s.y);
    return;
  }
  const consul = state.heroes.find((h) => h.id === s.consulId);
  const actions: LetterAction[] = [];
  if (key === 'attack') actions.push({ label: 'Enviar reforços da capital', action: 'reinforce', arg: s.id });
  if (key === 'hunger') actions.push({ label: 'Ordenar ração pequena', action: 'ration-low', arg: s.id });
  sendLetter(state, {
    fromNation: s.nation,
    toNation: s.nation,
    sender: consul ? `${consul.name}, cônsul de ${s.name}` : `Escrivão de ${s.name}`,
    subject: text.length > 60 ? `${text.slice(0, 57)}…` : text,
    body: text,
    fromX: s.x,
    fromY: s.y,
    settlementId: s.id,
    actions,
  });
}

// Rotas de carroças -----------------------------------------------------------

export function createRoute(state: GameState, fromId: number, toId: number, item: ItemId, amount: number): ActionResult {
  const a = settlementById(state, fromId);
  const b = settlementById(state, toId);
  if (!a || !b || a.nation !== b.nation || a === b) return fail('Rota inválida');
  if (!ITEMS[item]) return fail('Item inválido');
  state.routes.push({ id: newId(state), nation: a.nation, fromId, toId, item, amount: Math.max(10, Math.min(BALANCE.wagonCapacity, Math.round(amount))), active: true, busy: false });
  return { ok: true };
}

export function toggleRoute(state: GameState, routeId: number, active: boolean): ActionResult {
  const r = state.routes.find((x) => x.id === routeId);
  if (!r) return fail('Rota inválida');
  r.active = active;
  return { ok: true };
}

export function deleteRoute(state: GameState, routeId: number): ActionResult {
  state.routes = state.routes.filter((x) => x.id !== routeId);
  return { ok: true };
}

/** Envia uma carroça única com recursos. */
export function sendWagon(state: GameState, fromId: number, toId: number, cargo: Stock, routeId: number | null = null): ActionResult {
  const a = settlementById(state, fromId);
  const b = settlementById(state, toId);
  if (!a || !b || a === b) return fail('Destino inválido');
  let total = 0;
  for (const k in cargo) {
    const n = Math.floor(cargo[k as ItemId] ?? 0);
    if (n > stockGet(a.stock, k as ItemId)) return fail('Recursos insuficientes');
    total += n;
  }
  if (total <= 0) return fail('Nada para levar');
  if (total > BALANCE.wagonCapacity * 3) return fail(`No máximo ${BALANCE.wagonCapacity * 3} por envio`);
  const path = pathBetween(state, a.x, a.y, b.x, b.y);
  if (!path) return fail('Sem caminho');
  for (const k in cargo) stockAdd(a.stock, k as ItemId, -Math.floor(cargo[k as ItemId] ?? 0));
  const speed = BALANCE.wagonSpeed * (a.zone === 'middle' ? 1.2 : 1);
  newTraveler(state, { kind: 'wagon', nation: a.nation, x: a.x, y: a.y, speed, path, fromId, toId, cargo: { ...cargo }, routeId });
  return { ok: true };
}

function tickRoutes(state: GameState): void {
  for (const r of state.routes) {
    if (!r.active || r.busy) continue;
    const a = settlementById(state, r.fromId);
    const b = settlementById(state, r.toId);
    if (!a || !b || a.nation !== r.nation || b.nation !== r.nation) {
      r.active = false;
      continue;
    }
    const have = Math.floor(stockGet(a.stock, r.item as ItemId));
    const room = storageCap(state, b) - stockGet(b.stock, r.item as ItemId);
    const n = Math.min(have, r.amount, Math.floor(room));
    if (n < 5) continue;
    if (sendWagon(state, a.id, b.id, { [r.item]: n }, r.id).ok) r.busy = true;
  }
}

// Estradas ---------------------------------------------------------------------

/** Constrói estrada entre dois assentamentos do próprio reino (custa pedra por casa). */
export function buildRoad(state: GameState, fromId: number, toId: number): ActionResult {
  const a = settlementById(state, fromId);
  const b = settlementById(state, toId);
  if (!a || !b || a.nation !== b.nation) return fail('Estrada inválida');
  const path = pathBetween(state, a.x, a.y, b.x, b.y);
  if (!path) return fail('Sem caminho');
  const roads = new Set(state.roads);
  const newTiles = path.filter((i) => !roads.has(i));
  const cost = newTiles.length * BALANCE.roadCostStone;
  if (stockGet(a.stock, 'stone') < cost) return fail(`Precisa de ${cost} de pedra em ${a.name}`);
  stockAdd(a.stock, 'stone', -cost);
  const m = getMap();
  for (const i of newTiles) {
    state.roads.push(i);
    if (m.river[i] === 1) state.bridges.push(i);
  }
  syncMoveContext(state);
  return { ok: true };
}

// Colonos -------------------------------------------------------------------------

export function settlementLimit(state: GameState, nation: number): number {
  const n = state.nations[nation];
  const cap = settlementById(state, n.capitalId);
  let lim = BALANCE.settlementLimitByKeep[Math.min(10, cap ? keepLevel(cap) : 1)];
  if (n.research.done.includes('adm1')) lim += 1;
  if (n.research.done.includes('adm2')) lim += 1;
  if (n.research.done.includes('adm4')) lim += 2;
  return lim;
}

export function canFoundAt(state: GameState, nation: number, x: number, y: number): ActionResult {
  const m = getMap();
  if (!inBounds(x, y)) return fail('Fora do mapa');
  const i = idx(x, y);
  if (!isBuildable(m, i)) return fail('Terreno impróprio');
  if (!rt(state).explored[i] && isPlayer(state, nation)) return fail('Área ainda não explorada');
  for (const s of state.settlements) {
    if (dist(s.x, s.y, x, y) < 7) return fail('Muito perto de outro assentamento');
  }
  const owner = rt(state).owner[i];
  if (owner >= 0 && owner !== nation) return fail('Território de outro reino');
  return { ok: true };
}

export function sendColonists(state: GameState, fromId: number, x: number, y: number, kind: 'village' | 'castle' | 'outpost'): ActionResult {
  const s = settlementById(state, fromId);
  if (!s) return fail('Origem inválida');
  const nation = state.nations[s.nation];
  const mine = state.settlements.filter((o) => o.nation === s.nation).length;
  const pending = state.travelers.filter((t) => t.kind === 'colonists' && t.nation === s.nation).length;
  if (mine + pending >= settlementLimit(state, s.nation)) return fail('Limite de assentamentos (suba a Torre de Menagem ou pesquise Administração)');
  const check = canFoundAt(state, s.nation, x, y);
  if (!check.ok) return check;
  const people = kind === 'village' ? BALANCE.colonistsVillage : kind === 'castle' ? BALANCE.colonistsCastle : BALANCE.colonistsOutpost;
  if (adults(s) < people + 4) return fail(`Precisa de ${people} adultos sobrando`);
  const cost = BALANCE.foundCost[kind];
  if (stockGet(s.stock, 'wood') < cost.wood || stockGet(s.stock, 'stone') < cost.stone) return fail('Faltam madeira e pedra');
  if (nation.gold < cost.gold) return fail('Falta ouro');
  const path = pathBetween(state, s.x, s.y, x, y);
  if (!path) return fail('Sem caminho até lá');
  stockAdd(s.stock, 'wood', -cost.wood);
  stockAdd(s.stock, 'stone', -cost.stone);
  nation.gold -= cost.gold;
  takeAdults(s, people);
  newTraveler(state, {
    kind: 'colonists',
    nation: s.nation,
    x: s.x,
    y: s.y,
    speed: 0.3,
    path,
    fromId: s.id,
    colonists: { count: people, kind, tx: x, ty: y },
    cargo: { wood: 60, stone: 30, bread: 40, vegetables: 20 },
  });
  return { ok: true };
}

export function foundSettlement(state: GameState, nation: number, kind: SettlementKind, x: number, y: number, people: number, cargo: Stock): Settlement {
  const s = newSettlement(state, nation, kind, x, y, randomPlaceName(state), 0);
  s.ages = s.ages.map(() => 0);
  addAdults(s, people);
  s.loyalty = 70;
  if (kind !== 'outpost') {
    addBuilding(state, s, 'governor_hall', 11, 11, 1);
    addBuilding(state, s, 'house', 10, 11, 1);
  } else {
    addBuilding(state, s, 'storehouse', 11, 11, 1);
  }
  if (kind === 'castle') {
    s.defenses.wallLevel = 1;
    s.defenses.wallHp = 400;
    s.defenses.gateLevel = 1;
    s.defenses.gateHp = 250;
  }
  s.gridSize = gridSizeFor(s);
  for (const k in cargo) stockAdd(s.stock, k as ItemId, cargo[k as ItemId] ?? 0);
  markTerritoryDirty(state);
  return s;
}

// Movimento e interceptação --------------------------------------------------------

function advanceTraveler(state: GameState, t: Traveler, dt: number): void {
  if (t.kind === 'ship') {
    // Navios vão em linha reta pelo mar até o ponto de desembarque.
    const d = dist(t.x, t.y, tileX(t.toId), tileY(t.toId));
    const step = t.speed * dt;
    if (d <= step) {
      t.x = tileX(t.toId);
      t.y = tileY(t.toId);
      t.pathIdx = 1;
      t.path = [t.toId];
    } else {
      t.x += ((tileX(t.toId) - t.x) / d) * step;
      t.y += ((tileY(t.toId) - t.y) / d) * step;
    }
    return;
  }
  const m = getMap();
  const ctx = rt(state).ctx;
  let budget = t.speed * dt;
  while (budget > 0 && t.pathIdx < t.path.length) {
    const tile = t.path[t.pathIdx];
    const tx = tileX(tile);
    const ty = tileY(tile);
    const c = Math.min(4, moveCost(m, tile, ctx));
    const d = dist(t.x, t.y, tx, ty);
    const cost = d * (c === Infinity ? 4 : c);
    if (cost <= budget) {
      t.x = tx;
      t.y = ty;
      t.pathIdx++;
      budget -= cost;
    } else {
      const f = budget / cost;
      t.x += (tx - t.x) * f;
      t.y += (ty - t.y) * f;
      budget = 0;
    }
  }
}

function protectedByTower(state: GameState, t: Traveler): boolean {
  for (const s of state.settlements) {
    if (s.nation !== t.nation) continue;
    if (!s.buildings.some((b) => b.type === 'watchtower' && b.level > 0)) continue;
    if (dist(s.x, s.y, t.x, t.y) < 8) return true;
  }
  return false;
}

export let interceptHook = (_state: GameState, _t: Traveler, _captor: number): void => {};
export function setInterceptHook(fn: typeof interceptHook): void {
  interceptHook = fn;
}

function checkInterception(state: GameState, t: Traveler): boolean {
  if (t.kind === 'ship' || t.kind === 'spy') return false;
  if (protectedByTower(state, t)) return false;
  for (const a of state.armies) {
    if (a.stationedAt != null || a.battleId != null) continue;
    if (!isHostile(state, a.nation, t.nation)) continue;
    if (dist(a.x, a.y, t.x, t.y) > BALANCE.interceptRange) continue;
    // Capturado!
    if (t.kind === 'wagon' || t.kind === 'caravan') {
      for (const k in t.cargo) stockAdd(a.loot, k as ItemId, t.cargo[k as ItemId] ?? 0);
      a.lootGold += t.gold;
      if (isPlayer(state, t.nation)) pushEvent(state, `Uma carroça foi saqueada por ${state.nations[a.nation].name}.`, 'bad', t.x, t.y);
      if (isPlayer(state, a.nation)) pushEvent(state, 'Suas tropas capturaram uma carroça inimiga.', 'good', t.x, t.y);
      const r = state.routes.find((x) => x.id === t.routeId);
      if (r) r.busy = false;
    } else if (t.kind === 'colonists') {
      if (isPlayer(state, t.nation)) pushEvent(state, `Colonos foram atacados no caminho por ${state.nations[a.nation].name}.`, 'bad', t.x, t.y);
    }
    interceptHook(state, t, a.nation);
    return true;
  }
  return false;
}

function arrive(state: GameState, t: Traveler): boolean {
  switch (t.kind) {
    case 'messenger': {
      const l = state.letters.find((x) => x.id === t.letterId);
      if (l) deliverLetter(state, l);
      return true;
    }
    case 'caravan':
      return caravanHook(state, t);
    case 'wagon': {
      if (t.returning) {
        const r = state.routes.find((x) => x.id === t.routeId);
        if (r) r.busy = false;
        return true;
      }
      const dest = settlementById(state, t.toId);
      if (dest && dest.nation === t.nation) {
        const cap = storageCap(state, dest);
        for (const k in t.cargo) {
          const id = k as ItemId;
          stockAdd(dest.stock, id, Math.min(t.cargo[id] ?? 0, Math.max(0, cap - stockGet(dest.stock, id))));
        }
        state.nations[t.nation].gold += t.gold;
      }
      // Volta vazia para a origem (rotas fixas).
      if (t.routeId != null) {
        const from = settlementById(state, t.fromId);
        if (from) {
          const path = pathBetween(state, t.x, t.y, from.x, from.y);
          if (path) {
            t.returning = true;
            t.cargo = {};
            t.path = path;
            t.pathIdx = 0;
            return false;
          }
        }
        const r = state.routes.find((x) => x.id === t.routeId);
        if (r) r.busy = false;
      }
      return true;
    }
    case 'colonists': {
      const c = t.colonists!;
      const check = canFoundAt(state, t.nation, c.tx, c.ty);
      if (check.ok) {
        const s = foundSettlement(state, t.nation, c.kind, c.tx, c.ty, c.count, t.cargo);
        if (isPlayer(state, t.nation)) pushEvent(state, `Colonos fundaram ${s.name}!`, 'good', s.x, s.y);
      } else {
        const home = settlementById(state, t.fromId);
        if (home) addAdults(home, c.count);
        if (isPlayer(state, t.nation)) pushEvent(state, `Os colonos não puderam se assentar: ${check.reason}. Voltaram para casa.`, 'bad');
      }
      return true;
    }
    case 'spy':
      return spyArrivedHook(state, t);
    case 'ship':
      return shipArrivedHook(state, t);
  }
  return true;
}

export let caravanHook = (_state: GameState, _t: Traveler): boolean => true;
export function setCaravanHook(fn: typeof caravanHook): void {
  caravanHook = fn;
}
export let spyArrivedHook = (_state: GameState, _t: Traveler): boolean => true;
export let shipArrivedHook = (_state: GameState, _t: Traveler): boolean => true;
export function setSpyArrivedHook(fn: typeof spyArrivedHook): void {
  spyArrivedHook = fn;
}
export function setShipArrivedHook(fn: typeof shipArrivedHook): void {
  shipArrivedHook = fn;
}

export function tickTravelers(state: GameState, dt: number): void {
  if (state.time % 5 < dt) tickRoutes(state);
  const remove = new Set<Traveler>();
  for (const t of [...state.travelers]) {
    advanceTraveler(state, t, dt);
    if (checkInterception(state, t)) {
      remove.add(t);
      continue;
    }
    if (t.pathIdx >= t.path.length) {
      if (arrive(state, t)) remove.add(t);
    }
  }
  if (remove.size) state.travelers = state.travelers.filter((t) => !remove.has(t));
}

/** Reforço rápido: manda metade da guarnição da capital para um assentamento. */
export function reinforceFromCapital(state: GameState, settlementId: number, formArmy: (s: GameState, from: number, t: Record<string, number>) => { ok: boolean; armyId?: number }, orderMove: (s: GameState, a: number, x: number, y: number) => ActionResult): ActionResult {
  const target = settlementById(state, settlementId);
  if (!target) return fail('Destino inválido');
  const cap = settlementById(state, state.nations[target.nation].capitalId);
  if (!cap || cap === target) return fail('Sem capital');
  const g = garrisonOf(state, cap);
  if (!g) return fail('Sem guarnição');
  const send: Record<string, number> = {};
  for (const k in g.troops) {
    const n = Math.floor((g.troops[k as keyof typeof g.troops] ?? 0) / 2);
    if (n > 0 && k !== 'militia') send[k] = n;
  }
  const res = formArmy(state, cap.id, send);
  if (!res.ok || res.armyId == null) return fail('Sem tropas disponíveis');
  return orderMove(state, res.armyId, target.x, target.y);
}

export { MAP_SIZE };
