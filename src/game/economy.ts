import {
  BASE_PRODUCTION,
  BUILDINGS,
  BUILDING_IDS,
  COST_GROWTH,
  GOLD_PER_BUILDING_LEVEL,
  MAX_LEVEL,
  PRODUCTION_BY_LEVEL,
  PROTECTED_BY_LEVEL,
  RESOURCE_IDS,
  STORAGE_BY_LEVEL,
  TIME_GROWTH,
  TROOP_CAP_BY_LEVEL,
  UNITS,
  emptyResources,
} from './config';
import type { BuildingId, Castle, Resources, UnitId } from './types';

/** Custo para levar o edifício até `toLevel` (1..5). */
export function buildingCost(id: BuildingId, toLevel: number): Resources {
  const def = BUILDINGS[id];
  const factor = Math.pow(COST_GROWTH, toLevel - 1);
  const cost = emptyResources();
  for (const r of RESOURCE_IDS) cost[r] = Math.round((def.baseCost[r] ?? 0) * factor);
  return cost;
}

/** Tempo de construção (s) para chegar a `toLevel`. */
export function buildingTime(id: BuildingId, toLevel: number): number {
  return Math.round(BUILDINGS[id].baseTime * Math.pow(TIME_GROWTH, toLevel - 1));
}

export function unitCost(unit: UnitId, count = 1): Resources {
  const cost = emptyResources();
  for (const r of RESOURCE_IDS) cost[r] = (UNITS[unit].cost[r] ?? 0) * count;
  return cost;
}

/** Cada nível do quartel acelera o treino em 10%. */
export function unitTrainTime(unit: UnitId, barracksLevel: number): number {
  const factor = 1 - 0.1 * Math.max(0, barracksLevel - 1);
  return Math.max(1, Math.round(UNITS[unit].trainTime * factor * 10) / 10);
}

export function storageCapacity(c: Castle): number {
  return STORAGE_BY_LEVEL[c.buildings.storehouse];
}

export function protectedFraction(c: Castle): number {
  return PROTECTED_BY_LEVEL[c.buildings.storehouse];
}

/** Produção por segundo de cada recurso. */
export function productionRates(c: Castle): Resources {
  const totalLevels = BUILDING_IDS.reduce((s, b) => s + c.buildings[b], 0);
  return {
    food: BASE_PRODUCTION.food + PRODUCTION_BY_LEVEL[c.buildings.farm],
    wood: BASE_PRODUCTION.wood + PRODUCTION_BY_LEVEL[c.buildings.sawmill],
    stone: BASE_PRODUCTION.stone + PRODUCTION_BY_LEVEL[c.buildings.quarry],
    gold: BASE_PRODUCTION.gold + GOLD_PER_BUILDING_LEVEL * totalLevels,
  };
}

export function canAfford(have: Resources, cost: Resources): boolean {
  return RESOURCE_IDS.every((r) => have[r] >= cost[r]);
}

export function pay(have: Resources, cost: Resources): void {
  for (const r of RESOURCE_IDS) have[r] -= cost[r];
}

export function addResources(c: Castle, amount: Resources): void {
  const cap = storageCapacity(c);
  for (const r of RESOURCE_IDS) c.resources[r] = Math.min(cap, c.resources[r] + amount[r]);
}

export type ActionResult = { ok: true } | { ok: false; reason: string };

export function canUpgrade(c: Castle, id: BuildingId): ActionResult {
  const level = c.buildings[id];
  if (level >= MAX_LEVEL) return { ok: false, reason: 'Nível máximo' };
  if (c.buildQueue) return { ok: false, reason: 'Construtores ocupados' };
  const cost = buildingCost(id, level + 1);
  if (cost.food > storageCapacity(c) || cost.wood > storageCapacity(c) || cost.stone > storageCapacity(c) || cost.gold > storageCapacity(c)) {
    return { ok: false, reason: 'Armazém pequeno demais' };
  }
  if (!canAfford(c.resources, cost)) return { ok: false, reason: 'Recursos insuficientes' };
  return { ok: true };
}

export function startUpgrade(c: Castle, id: BuildingId): ActionResult {
  const check = canUpgrade(c, id);
  if (!check.ok) return check;
  const toLevel = c.buildings[id] + 1;
  pay(c.resources, buildingCost(id, toLevel));
  const t = buildingTime(id, toLevel);
  c.buildQueue = { building: id, toLevel, remaining: t, total: t };
  return { ok: true };
}

export function troopCapacity(c: Castle): number {
  return TROOP_CAP_BY_LEVEL[c.buildings.barracks];
}

/** Tropas em casa + em treino (as que estão em marcha são passadas em `away`). */
export function troopsCommitted(c: Castle, away = 0): number {
  const home = c.troops.spearman + c.troops.archer + c.troops.cavalry;
  return home + c.trainQueue.reduce((s, j) => s + j.count, 0) + away;
}

export function canTrain(c: Castle, unit: UnitId, count: number, away = 0): ActionResult {
  if (count < 1) return { ok: false, reason: 'Quantidade inválida' };
  if (c.buildings.barracks < UNITS[unit].barracksLevel) {
    return { ok: false, reason: `Requer Quartel nível ${UNITS[unit].barracksLevel}` };
  }
  if (troopsCommitted(c, away) + count > troopCapacity(c)) {
    return { ok: false, reason: `Limite de ${troopCapacity(c)} tropas` };
  }
  if (!canAfford(c.resources, unitCost(unit, count))) return { ok: false, reason: 'Recursos insuficientes' };
  return { ok: true };
}

export function startTraining(c: Castle, unit: UnitId, count: number, away = 0): ActionResult {
  const check = canTrain(c, unit, count, away);
  if (!check.ok) return check;
  pay(c.resources, unitCost(unit, count));
  const perUnit = unitTrainTime(unit, c.buildings.barracks);
  const last = c.trainQueue[c.trainQueue.length - 1];
  if (last && last.unit === unit) last.count += count;
  else c.trainQueue.push({ unit, count, remaining: perUnit, perUnit, done: 0 });
  return { ok: true };
}

/** Quantas unidades o castelo consegue pagar agora. */
export function maxAffordable(c: Castle, unit: UnitId): number {
  let n = Infinity;
  for (const r of RESOURCE_IDS) {
    const each = UNITS[unit].cost[r] ?? 0;
    if (each > 0) n = Math.min(n, Math.floor(c.resources[r] / each));
  }
  return n === Infinity ? 0 : n;
}

export interface CastleTickResult {
  built: { building: BuildingId; level: number }[];
  /** Unidades que ficaram prontas neste passo. */
  trained: { unit: UnitId; count: number }[];
  /** Lotes de treino concluídos neste passo. */
  finishedBatches: { unit: UnitId; count: number }[];
}

/** Avança a economia de um castelo por `dt` segundos. */
export function tickCastle(c: Castle, dt: number): CastleTickResult {
  const result: CastleTickResult = { built: [], trained: [], finishedBatches: [] };
  const rates = productionRates(c);
  const gained = emptyResources();
  for (const r of RESOURCE_IDS) gained[r] = rates[r] * dt;
  addResources(c, gained);

  if (c.buildQueue) {
    c.buildQueue.remaining -= dt;
    if (c.buildQueue.remaining <= 1e-9) {
      c.buildings[c.buildQueue.building] = c.buildQueue.toLevel;
      result.built.push({ building: c.buildQueue.building, level: c.buildQueue.toLevel });
      c.buildQueue = null;
    }
  }

  let time = dt;
  while (time > 1e-9 && c.trainQueue.length > 0) {
    const job = c.trainQueue[0];
    const step = Math.min(time, job.remaining);
    job.remaining -= step;
    time -= step;
    if (job.remaining <= 1e-9) {
      c.troops[job.unit] += 1;
      job.count -= 1;
      job.done += 1;
      const prev = result.trained.find((t) => t.unit === job.unit);
      if (prev) prev.count += 1;
      else result.trained.push({ unit: job.unit, count: 1 });
      if (job.count <= 0) {
        result.finishedBatches.push({ unit: job.unit, count: job.done });
        c.trainQueue.shift();
      }
      else job.remaining = job.perUnit;
    }
  }
  return result;
}
