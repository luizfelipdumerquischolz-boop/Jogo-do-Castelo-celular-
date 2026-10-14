// Exércitos em campo: formação, marcha pelo mapa, suprimento e fome.
import { BALANCE } from './data/balance';
import { FOOD_IDS, stockAdd, stockGet, type Stock } from './data/items';
import { UNITS, addTroops, troopCount, type Troops, type UnitId } from './data/units';
import { MAP_SIZE, getMap, idx, moveCost, tileX, tileY } from './map';
import { findPath } from './path';
import { armyById, heroById, rt, settlementById } from './runtime';
import { dietEffects, garrisonOf, storageCap, type ActionResult } from './settlement';
import type { Army, GameState, Settlement } from './types';
import { dist, isHostile, isPlayer, pushEvent, season } from './util';
import { rand } from './rng';
import { newArmy } from './create';

const fail = (reason: string): ActionResult => ({ ok: false, reason });

export function armySize(a: Army): number {
  return troopCount(a.troops);
}

export function fightingSize(a: Army): number {
  return troopCount(a.troops, false);
}

/** Velocidade em casas por segundo (a unidade mais lenta manda). */
export function armySpeed(state: GameState, a: Army): number {
  let v = Infinity;
  for (const k in a.troops) {
    if ((a.troops[k as UnitId] ?? 0) > 0) v = Math.min(v, UNITS[k as UnitId].speed);
  }
  if (v === Infinity) v = BALANCE.baseMarchSpeed;
  const nation = state.nations[a.nation];
  if (nation?.research.done.includes('mil2')) v *= 1.15;
  if (season(state.time) === 3) v *= BALANCE.winterMarch;
  const home = settlementById(state, a.homeId);
  if (home && home.kind !== 'camp' && home.kind !== 'tribal') v *= dietEffects(home).speed;
  if (a.starving > 0) v *= 0.8;
  return v;
}

export function carryCapacity(t: Troops): number {
  let c = 0;
  for (const k in t) c += (t[k as UnitId] ?? 0) * UNITS[k as UnitId].carry;
  return c;
}

export function foodUpkeep(t: Troops): number {
  let u = 0;
  for (const k in t) u += (t[k as UnitId] ?? 0) * UNITS[k as UnitId].upkeep;
  return u / 60;
}

/** Pega comida do estoque (porções), distribuindo entre os alimentos. */
export function takeFood(stock: Stock, amount: number): number {
  let left = amount;
  let avail = FOOD_IDS.filter((f) => stockGet(stock, f) > 0.01);
  let guard = 0;
  while (left > 1e-6 && avail.length && guard++ < 10) {
    const share = left / avail.length;
    const next: typeof avail = [];
    for (const f of avail) {
      const have = stockGet(stock, f);
      const t = Math.min(have, share);
      stockAdd(stock, f, -t);
      left -= t;
      if (have - t > 0.01) next.push(f);
    }
    avail = next;
  }
  return amount - left;
}

/** Forma um exército de campo tirando tropas da guarnição. */
export function formArmy(state: GameState, settlementId: number, troops: Troops, name = ''): ActionResult & { armyId?: number } {
  const s = settlementById(state, settlementId);
  if (!s) return fail('Assentamento inválido');
  const g = garrisonOf(state, s);
  if (!g) return fail('Sem guarnição');
  const take: Troops = {};
  for (const k in troops) {
    const u = k as UnitId;
    const n = Math.floor(troops[u] ?? 0);
    if (n <= 0) continue;
    if ((g.troops[u] ?? 0) < n) return fail('Tropas insuficientes');
    take[u] = n;
  }
  if (troopCount(take) <= 0) return fail('Escolha ao menos uma tropa');
  addTroops(g.troops, take, -1);
  const a = newArmy(state, s.nation, s.x, s.y, take, s.id, null, name || `Exército de ${s.name}`);
  a.xp = g.xp;
  a.morale = Math.max(40, s.morale);
  // Leva comida para 6 minutos.
  a.food = takeFood(s.stock, foodUpkeep(take) * 360);
  return { ok: true, armyId: a.id };
}

export function setPath(state: GameState, a: Army, tx: number, ty: number): boolean {
  const sx = Math.round(a.x);
  const sy = Math.round(a.y);
  const p = findPath(sx, sy, tx, ty, rt(state).ctx);
  if (!p) return false;
  a.path = p;
  a.pathIdx = 0;
  a.targetX = tx;
  a.targetY = ty;
  return true;
}

export function orderMove(state: GameState, armyId: number, tx: number, ty: number): ActionResult {
  const a = armyById(state, armyId);
  if (!a || a.stationedAt != null) return fail('Exército inválido');
  if (a.battleId != null) return fail('Em batalha');
  if (!setPath(state, a, tx, ty)) return fail('Sem caminho até lá');
  a.order = 'move';
  a.targetId = null;
  return { ok: true };
}

export function orderAttack(state: GameState, armyId: number, settlementId: number, mode: 'attack' | 'raid' = 'attack'): ActionResult {
  const a = armyById(state, armyId);
  const s = settlementById(state, settlementId);
  if (!a || !s || a.stationedAt != null) return fail('Alvo inválido');
  if (s.nation === a.nation) return fail('É do seu reino');
  if (s.ruinedFor > 0) return fail('Está em ruínas');
  if (a.battleId != null) return fail('Em batalha');
  if (!setPath(state, a, s.x, s.y)) return fail('Sem caminho até lá');
  a.order = mode;
  a.targetId = s.id;
  return { ok: true };
}

export function orderReturn(state: GameState, armyId: number): ActionResult {
  const a = armyById(state, armyId);
  if (!a || a.stationedAt != null) return fail('Exército inválido');
  let home = settlementById(state, a.homeId);
  if (!home || home.nation !== a.nation) home = nearestOwnSettlement(state, a.nation, a.x, a.y);
  if (!home) return fail('Sem lugar para voltar');
  a.homeId = home.id;
  if (!setPath(state, a, home.x, home.y)) return fail('Sem caminho de volta');
  a.order = 'return';
  a.targetId = home.id;
  return { ok: true };
}

export function orderDefend(state: GameState, armyId: number, x: number, y: number): ActionResult {
  const a = armyById(state, armyId);
  if (!a || a.stationedAt != null) return fail('Exército inválido');
  if (!setPath(state, a, x, y)) return fail('Sem caminho até lá');
  a.order = 'defend';
  a.targetX = x;
  a.targetY = y;
  return { ok: true };
}

export function setFormation(state: GameState, armyId: number, f: Army['formation']): ActionResult {
  const a = armyById(state, armyId);
  if (!a) return fail('Exército inválido');
  a.formation = f;
  return { ok: true };
}

export function nearestOwnSettlement(state: GameState, nation: number, x: number, y: number): Settlement | undefined {
  let best: Settlement | undefined;
  let bd = Infinity;
  for (const s of state.settlements) {
    if (s.nation !== nation || s.ruinedFor > 0) continue;
    const d = dist(s.x, s.y, x, y);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

/** Junta o exército à guarnição de um assentamento do próprio reino. */
export function garrisonArmy(state: GameState, a: Army, s: Settlement): void {
  const g = garrisonOf(state, s);
  if (!g) return;
  const before = armySize(g);
  addTroops(g.troops, a.troops);
  const after = armySize(g);
  if (after > 0) g.xp = (g.xp * before + a.xp * armySize(a)) / after;
  const cap = storageCap(state, s);
  for (const k in a.loot) {
    const id = k as keyof Stock;
    stockAdd(s.stock, id, Math.min(a.loot[id] ?? 0, Math.max(0, cap - stockGet(s.stock, id))));
  }
  state.nations[a.nation].gold += a.lootGold;
  // Comida que sobrou volta ao estoque como pão.
  if (a.food > 1) stockAdd(s.stock, 'bread', Math.floor(a.food));
  if (a.commanderId != null) {
    const h = heroById(state, a.commanderId);
    if (h) h.assignedTo = null;
  }
  removeArmy(state, a);
}

export function removeArmy(state: GameState, a: Army): void {
  state.armies = state.armies.filter((x) => x !== a);
  rt(state).armies.delete(a.id);
  for (const b of state.battles) {
    b.attackers = b.attackers.filter((id) => id !== a.id);
    b.defenders = b.defenders.filter((id) => id !== a.id);
  }
}

function supply(state: GameState, a: Army, dt: number): void {
  const need = foodUpkeep(a.troops) * dt;
  if (need <= 0) return;
  const r = rt(state);
  const i = idx(Math.round(a.x), Math.round(a.y));
  // Em território próprio, come do armazém mais próximo.
  if (r.owner[i] === a.nation) {
    const s = nearestOwnSettlement(state, a.nation, a.x, a.y);
    if (s && dist(s.x, s.y, a.x, a.y) < 16) {
      const got = takeFood(s.stock, need + Math.max(0, foodUpkeep(a.troops) * 240 - a.food) * 0.02);
      if (got >= need) {
        a.food += got - need;
        a.starving = 0;
        return;
      }
    }
  }
  if (a.food >= need) {
    a.food -= need;
    a.starving = 0;
  } else {
    a.food = 0;
    a.starving += dt;
  }
}

function starve(state: GameState, a: Army, dt: number): void {
  if (a.starving <= 0) {
    a.morale = Math.min(100, a.morale + dt * 0.05);
    return;
  }
  a.morale = Math.max(0, a.morale - dt * 0.3);
  if (a.starving > 60 && a.morale < 40) {
    // Deserção: 2% a cada 10 segundos.
    const frac = 0.002 * dt;
    let lost = 0;
    for (const k in a.troops) {
      const u = k as UnitId;
      if (UNITS[u].cls === 'siege') continue;
      const n = a.troops[u] ?? 0;
      const d = Math.min(n, Math.floor(n * frac + rand(state)));
      if (d > 0) {
        addTroops(a.troops, { [u]: d }, -1);
        lost += d;
      }
    }
    if (lost > 0 && isPlayer(state, a.nation) && state.time % 30 < dt) pushEvent(state, `${a.name} passa fome e soldados desertam.`, 'bad', a.x, a.y);
  }
}

function advance(state: GameState, a: Army, dt: number): void {
  if (a.pathIdx >= a.path.length) return;
  const m = getMap();
  const ctx = rt(state).ctx;
  let budget = armySpeed(state, a) * dt;
  while (budget > 0 && a.pathIdx < a.path.length) {
    const t = a.path[a.pathIdx];
    const tx = tileX(t);
    const ty = tileY(t);
    const c = moveCost(m, t, ctx);
    if (c === Infinity) {
      a.path = [];
      break;
    }
    const d = dist(a.x, a.y, tx, ty);
    const stepCost = d * c;
    if (stepCost <= budget) {
      a.x = tx;
      a.y = ty;
      a.pathIdx++;
      budget -= stepCost;
    } else {
      const f = budget / stepCost;
      a.x += (tx - a.x) * f;
      a.y += (ty - a.y) * f;
      budget = 0;
    }
  }
}

/** Callback de chegada (preenchido pelo módulo de batalha para evitar ciclo). */
export const arrivalHooks: {
  siege: (state: GameState, a: Army, s: Settlement) => void;
  field: (state: GameState, a: Army, enemy: Army) => void;
} = { siege: () => {}, field: () => {} };

export function tickArmies(state: GameState, dt: number): void {
  for (const a of [...state.armies]) {
    if (!state.armies.includes(a)) continue;
    if (a.stationedAt != null) {
      const s = settlementById(state, a.stationedAt);
      if (s) {
        a.x = s.x;
        a.y = s.y;
      }
      continue;
    }
    if (armySize(a) <= 0 && a.battleId == null) {
      removeArmy(state, a);
      continue;
    }
    if (a.wave === 0) {
      supply(state, a, dt);
      starve(state, a, dt);
    }
    if (a.battleId != null) continue;
    advance(state, a, dt);

    // Encontro com exército inimigo em campo.
    const enemy = state.armies.find(
      (b) => b !== a && b.stationedAt == null && b.battleId == null && armySize(b) > 0 && isHostile(state, a.nation, b.nation) && dist(a.x, a.y, b.x, b.y) < 0.8,
    );
    if (enemy && (a.order !== 'return' || enemy.order === 'attack' || enemy.order === 'raid')) {
      if (fightingSize(a) > 0 || fightingSize(enemy) > 0) {
        arrivalHooks.field(state, a, enemy);
        continue;
      }
    }

    if (a.pathIdx < a.path.length) continue;
    // Chegou ao destino.
    if ((a.order === 'attack' || a.order === 'raid') && a.targetId != null) {
      const s = settlementById(state, a.targetId);
      if (s && s.nation !== a.nation && s.ruinedFor <= 0 && dist(a.x, a.y, s.x, s.y) < 1.1) {
        if (!isHostile(state, a.nation, s.nation) && state.nations[s.nation].kind !== 'tribe') {
          // Atacar sem guerra declarada é declarar guerra (o módulo de diplomacia cuida da reputação).
          declareWarHook(state, a.nation, s.nation);
        }
        arrivalHooks.siege(state, a, s);
        continue;
      }
      a.order = 'idle';
    }
    if (a.order === 'return' || a.order === 'move') {
      const s = state.settlements.find((x) => x.nation === a.nation && Math.round(a.x) === x.x && Math.round(a.y) === x.y);
      if (s && (a.order === 'return' || a.targetId === s.id || (a.order === 'move' && dist(a.targetX, a.targetY, s.x, s.y) < 0.5))) {
        garrisonArmy(state, a, s);
        continue;
      }
      a.order = a.order === 'return' ? 'idle' : 'idle';
    }
  }
}

export let declareWarHook = (_state: GameState, _a: number, _b: number): void => {};
export function setDeclareWarHook(fn: typeof declareWarHook): void {
  declareWarHook = fn;
}

/** Revela a névoa em volta dos assentamentos e exércitos do jogador. */
export function updateVision(state: GameState): void {
  const r = rt(state);
  r.visible.fill(0);
  const reveal = (x: number, y: number, rad: number) => {
    const cx = Math.round(x);
    const cy = Math.round(y);
    for (let oy = -rad; oy <= rad; oy++) {
      for (let ox = -rad; ox <= rad; ox++) {
        if (ox * ox + oy * oy > rad * rad) continue;
        const px = cx + ox;
        const py = cy + oy;
        if (px < 0 || py < 0 || px >= MAP_SIZE || py >= MAP_SIZE) continue;
        const i = py * MAP_SIZE + px;
        r.visible[i] = 1;
        r.explored[i] = 1;
      }
    }
  };
  const p = state.playerNation;
  for (const s of state.settlements) {
    if (s.nation !== p) continue;
    const towers = s.buildings.filter((b) => b.type === 'watchtower' && b.level > 0).reduce((n, b) => n + b.level, 0);
    reveal(s.x, s.y, 9 + Math.min(8, towers * 2));
  }
  for (const a of state.armies) {
    if (a.nation !== p || a.stationedAt != null) continue;
    const scouts = a.troops.scout ?? 0;
    reveal(a.x, a.y, scouts > 0 ? 7 : 4);
  }
  for (const t of state.travelers) if (t.nation === p) reveal(t.x, t.y, 3);
  // Aliados compartilham visão dos seus assentamentos.
}

export function isVisible(state: GameState, x: number, y: number): boolean {
  const r = rt(state);
  return r.visible[idx(Math.round(x), Math.round(y))] === 1;
}

export function isExplored(state: GameState, x: number, y: number): boolean {
  const r = rt(state);
  return r.explored[idx(Math.round(x), Math.round(y))] === 1;
}

