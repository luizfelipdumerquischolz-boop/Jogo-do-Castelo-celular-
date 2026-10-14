// Economia e vida de um assentamento: construções, trabalhadores, produção,
// alimentação, saúde, felicidade, lealdade, população, impostos e recrutamento.
import { BALANCE, YEAR_SECONDS } from './data/balance';
import {
  BUILDINGS,
  buildCost,
  buildTime,
  levelOutput,
  workersAt,
  type BuildingCategory,
  type BuildingId,
  type Vocation,
} from './data/buildings';
import { FOOD_GROUPS, FOOD_IDS, ITEMS, ITEM_IDS, hasItems, stockAdd, stockGet, takeItems, type FoodGroup, type ItemId, type Stock } from './data/items';
import { UNITS, addTroops, troopCount, type Troops, type UnitId } from './data/units';
import { getMap, idx, inBounds, RIVER_NONE } from './map';
import { armyById, rt, settlementById } from './runtime';
import type { GameState, PlacedBuilding, Settlement, Zone } from './types';
import { adults, dist, elders, isPlayer, newId, population, pushEvent, season, takeAdults } from './util';

export const FRAME = 24;
export const DEFAULT_PRIORITIES: BuildingCategory[] = ['food', 'materials', 'military', 'industry', 'civic', 'admin'];

export type ActionResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): ActionResult => ({ ok: false, reason });
const OK: ActionResult = { ok: true };

// Terreno ------------------------------------------------------------------

export function keepLevel(s: Settlement): number {
  const k = s.buildings.find((b) => b.type === 'keep' || b.type === 'governor_hall');
  return k ? k.level : 0;
}

export function gridSizeFor(s: Settlement): number {
  const lvl = Math.max(1, keepLevel(s));
  switch (s.kind) {
    case 'capital':
      return BALANCE.capitalGridByKeep[Math.min(10, lvl)];
    case 'city':
      return Math.min(FRAME, BALANCE.gridSize.city + 2 * (lvl - 1));
    case 'village':
      return Math.min(18, BALANCE.gridSize.village + 2 * (lvl - 1));
    case 'castle':
      return Math.min(20, BALANCE.gridSize.castle + 2 * (lvl - 1));
    case 'outpost':
      return BALANCE.gridSize.outpost;
    default:
      return 8;
  }
}

export function usableBounds(s: Settlement): { x0: number; y0: number; x1: number; y1: number } {
  const g = s.gridSize;
  const o = (FRAME - g) / 2;
  return { x0: o, y0: o, x1: o + g, y1: o + g };
}

/** Quadrante do bairro (0 NO, 1 NE, 2 SO, 3 SE) ou -1 se for o núcleo. */
export function quadrantOf(x: number, y: number): number {
  const c0 = (FRAME - BALANCE.capitalCore) / 2;
  const c1 = c0 + BALANCE.capitalCore;
  if (x >= c0 && x < c1 && y >= c0 && y < c1) return -1;
  return (y < FRAME / 2 ? 0 : 2) + (x < FRAME / 2 ? 0 : 1);
}

export function districtsUnlocked(s: Settlement): number {
  if (s.kind !== 'capital') return 0;
  const lvl = keepLevel(s);
  return BALANCE.districtKeepLevels.filter((l) => lvl >= l).length;
}

/** Quadrante comum a todas as casas do retângulo, ou -1. */
function footprintQuadrant(x: number, y: number, size: number): number {
  const q = quadrantOf(x, y);
  for (let oy = 0; oy < size; oy++) for (let ox = 0; ox < size; ox++) if (quadrantOf(x + ox, y + oy) !== q) return -1;
  return q;
}

export function buildingAt(s: Settlement, x: number, y: number): PlacedBuilding | undefined {
  return s.buildings.find((b) => {
    const sz = BUILDINGS[b.type].size;
    return x >= b.x && x < b.x + sz && y >= b.y && y < b.y + sz;
  });
}

export function nearWater(s: Settlement): boolean {
  const m = getMap();
  for (let oy = -3; oy <= 3; oy++) {
    for (let ox = -3; ox <= 3; ox++) {
      const x = s.x + ox;
      const y = s.y + oy;
      if (!inBounds(x, y)) continue;
      const i = idx(x, y);
      if (m.base[i] === 0 || m.river[i] !== RIVER_NONE) return true;
    }
  }
  return false;
}

export function onCoast(s: Settlement): boolean {
  const m = getMap();
  for (let oy = -2; oy <= 2; oy++) {
    for (let ox = -2; ox <= 2; ox++) {
      const x = s.x + ox;
      const y = s.y + oy;
      if (inBounds(x, y) && m.coast[idx(x, y)] === 1) return true;
    }
  }
  return false;
}

export function depositNear(state: GameState, s: Settlement, type: string) {
  return state.deposits.find((d) => d.type === type && d.amount > 0 && dist(d.x, d.y, s.x, s.y) <= BALANCE.depositReach);
}

/** A construção pode existir neste tipo de assentamento (sem olhar a posição)? */
export function kindAllows(s: Settlement, id: BuildingId): boolean {
  const def = BUILDINGS[id];
  if (s.kind === 'camp' || s.kind === 'tribal') return false;
  if (def.kinds.includes(s.kind)) return true;
  if (s.kind === 'capital' && def.kinds.includes('city')) return true;
  if (s.kind === 'capital' && def.districts) return true;
  return false;
}

export function maxBuildingLevel(s: Settlement, id: BuildingId): number {
  const def = BUILDINGS[id];
  if (id === 'keep' || id === 'governor_hall') return def.maxLevel;
  if (s.kind === 'outpost') return Math.min(2, def.maxLevel);
  return Math.min(def.maxLevel, Math.max(1, keepLevel(s)));
}

export function canPlace(state: GameState, s: Settlement, id: BuildingId, x: number, y: number, ignoreId = -1): ActionResult {
  const def = BUILDINGS[id];
  if (!kindAllows(s, id)) return fail(`Não existe em ${s.kind === 'capital' ? 'capital' : 'este tipo de assentamento'}`);
  const bnd = usableBounds(s);
  if (x < bnd.x0 || y < bnd.y0 || x + def.size > bnd.x1 || y + def.size > bnd.y1) return fail('Fora do terreno');
  for (let oy = 0; oy < def.size; oy++) {
    for (let ox = 0; ox < def.size; ox++) {
      const other = buildingAt(s, x + ox, y + oy);
      if (other && other.id !== ignoreId) return fail('Espaço ocupado');
    }
  }
  if (def.unique && s.buildings.some((b) => b.type === id && b.id !== ignoreId)) return fail('Só pode haver uma');
  if (s.kind === 'capital') {
    const needsDistrict = !def.kinds.includes('capital') && !def.kinds.includes('city');
    if (id === 'keep' && footprintQuadrant(x, y, def.size) !== -1) return fail('A Torre fica no núcleo');
    if (needsDistrict) {
      const q = footprintQuadrant(x, y, def.size);
      if (q < 0 || q >= districtsUnlocked(s)) return fail('Precisa de um bairro liberado');
      const voc = s.districts[q]?.vocation;
      if (!voc || !def.districts?.includes(voc)) return fail(`Precisa de bairro ${def.districts?.map((v) => v).join(' ou ')}`);
    }
  }
  if (def.requiresDeposit && !depositNear(state, s, def.requiresDeposit)) return fail('Sem depósito por perto');
  if (def.requiresWater && !(id === 'port' ? onCoast(s) : nearWater(s))) return fail(id === 'port' ? 'Precisa estar na costa' : 'Precisa de água por perto');
  return OK;
}

function constructionsRunning(s: Settlement): number {
  return s.buildings.filter((b) => b.build).length;
}

function costFactor(state: GameState, s: Settlement): number {
  let f = state.nations[s.nation].research.done.includes('con2') ? 0.85 : 1;
  if (s.zone === 'frontier') f *= 1;
  return f;
}

function payBuild(state: GameState, s: Settlement, id: BuildingId, toLevel: number): ActionResult {
  const { items, gold } = buildCost(id, toLevel);
  const f = costFactor(state, s);
  const scaled: Stock = {};
  for (const k in items) scaled[k as ItemId] = Math.round((items[k as ItemId] ?? 0) * f);
  const nation = state.nations[s.nation];
  if (!hasItems(s.stock, scaled)) return fail('Faltam materiais');
  if (nation.gold < gold * f) return fail('Falta ouro');
  takeItems(s.stock, scaled);
  nation.gold -= gold * f;
  return OK;
}

function buildSeconds(state: GameState, id: BuildingId, toLevel: number): number {
  const fast = state.nations.some((n) => n.id >= 0) ? 1 : 1;
  return buildTime(id, toLevel) * fast;
}

export function placeBuilding(state: GameState, sId: number, id: BuildingId, x: number, y: number): ActionResult {
  const s = settlementById(state, sId);
  if (!s) return fail('Assentamento inválido');
  const check = canPlace(state, s, id, x, y);
  if (!check.ok) return check;
  if (constructionsRunning(s) >= (BALANCE.maxConstructions[s.kind] ?? 1)) return fail('Construtores ocupados');
  const paid = payBuild(state, s, id, 1);
  if (!paid.ok) return paid;
  const t = constructionTime(state, s, id, 1);
  s.buildings.push({
    id: newId(state),
    type: id,
    x,
    y,
    level: 0,
    build: { toLevel: 1, remaining: t, total: t },
    workers: 0,
    recipeWeights: {},
    stalled: 0,
    efficiency: 0,
  });
  return OK;
}

export function constructionTime(state: GameState, s: Settlement, id: BuildingId, toLevel: number): number {
  let t = buildSeconds(state, id, toLevel);
  if (state.nations[s.nation].research.done.includes('con1')) t *= 0.8;
  return Math.max(3, Math.round(t));
}

export function upgradeBuilding(state: GameState, sId: number, bId: number): ActionResult {
  const s = settlementById(state, sId);
  const b = s?.buildings.find((x) => x.id === bId);
  if (!s || !b) return fail('Construção inválida');
  if (b.build) return fail('Já está em obra');
  if (b.level >= maxBuildingLevel(s, b.type)) {
    return fail(b.level >= BUILDINGS[b.type].maxLevel ? 'Nível máximo' : s.kind === 'capital' ? 'Suba a Torre de Menagem primeiro' : 'Suba o Salão do governador primeiro');
  }
  if (constructionsRunning(s) >= (BALANCE.maxConstructions[s.kind] ?? 1)) return fail('Construtores ocupados');
  const paid = payBuild(state, s, b.type, b.level + 1);
  if (!paid.ok) return paid;
  const t = constructionTime(state, s, b.type, b.level + 1);
  b.build = { toLevel: b.level + 1, remaining: t, total: t };
  return OK;
}

export function moveBuilding(state: GameState, sId: number, bId: number, x: number, y: number): ActionResult {
  const s = settlementById(state, sId);
  const b = s?.buildings.find((v) => v.id === bId);
  if (!s || !b) return fail('Construção inválida');
  const check = canPlace(state, s, b.type, x, y, b.id);
  if (!check.ok) return check;
  b.x = x;
  b.y = y;
  return OK;
}

export function demolishBuilding(state: GameState, sId: number, bId: number): ActionResult {
  const s = settlementById(state, sId);
  const b = s?.buildings.find((v) => v.id === bId);
  if (!s || !b) return fail('Construção inválida');
  if (BUILDINGS[b.type].unique) return fail('Não pode ser demolida');
  const { items } = buildCost(b.type, Math.max(1, b.level));
  for (const k in items) stockAdd(s.stock, k as ItemId, Math.floor((items[k as ItemId] ?? 0) * 0.3));
  s.buildings = s.buildings.filter((v) => v !== b);
  return OK;
}

export function setRecipeWeight(state: GameState, sId: number, bId: number, recipe: string, weight: number): ActionResult {
  const s = settlementById(state, sId);
  const b = s?.buildings.find((v) => v.id === bId);
  if (!s || !b) return fail('Construção inválida');
  b.recipeWeights[recipe] = Math.max(0, Math.min(10, weight));
  return OK;
}

// Bairros e vocações ----------------------------------------------------------

export function setDistrictVocation(state: GameState, sId: number, q: number, voc: Vocation): ActionResult {
  const s = settlementById(state, sId);
  if (!s || s.kind !== 'capital') return fail('Só a capital tem bairros');
  if (q < 0 || q >= districtsUnlocked(s)) return fail('Bairro ainda não liberado');
  const d = s.districts[q];
  if (d.vocation === voc) return OK;
  d.vocation = voc;
  d.level = 0;
  return OK;
}

export function investDistrict(state: GameState, sId: number, q: number): ActionResult {
  const s = settlementById(state, sId);
  if (!s || s.kind !== 'capital') return fail('Só a capital tem bairros');
  const d = s.districts[q];
  if (!d || !d.vocation) return fail('Escolha a vocação do bairro');
  if (d.level >= 5) return fail('Investimento máximo');
  const f = d.level + 1;
  const cost = { wood: BALANCE.districtInvest.wood * f, stone: BALANCE.districtInvest.stone * f };
  const gold = BALANCE.districtInvest.gold * f;
  if (!hasItems(s.stock, cost)) return fail('Faltam materiais');
  const n = state.nations[s.nation];
  if (n.gold < gold) return fail('Falta ouro');
  takeItems(s.stock, cost);
  n.gold -= gold;
  d.level++;
  return OK;
}

export function setVocation(state: GameState, sId: number, voc: Vocation): ActionResult {
  const s = settlementById(state, sId);
  if (!s) return fail('Assentamento inválido');
  if (s.kind === 'capital' || s.kind === 'outpost' || s.kind === 'camp' || s.kind === 'tribal') return fail('Este assentamento não tem vocação');
  if (s.vocation === voc && !s.vocationSwitch) return OK;
  if (s.vocation === null) {
    s.vocation = voc;
    return OK;
  }
  s.vocationSwitch = { to: voc, remaining: BALANCE.vocationSwitchSeconds };
  return OK;
}

// Muralhas e defesas ----------------------------------------------------------

export function wallMaxHp(state: GameState, level: number, nation: number): number {
  const stone = state.nations[nation].research.done.includes('stone_walls') ? 1.5 : 1;
  return Math.round(level * BALANCE.wallHpPerLevel * stone);
}

export function gateMaxHp(level: number): number {
  return level * BALANCE.gateHpPerLevel;
}

export type DefenseUpgrade = 'wall' | 'gate' | 'tower' | 'moat' | 'oil' | 'stakes' | 'pits' | 'repair';

export function defenseCost(s: Settlement, what: DefenseUpgrade): { items: Stock; gold: number } | null {
  const d = s.defenses;
  const frontier = s.zone === 'frontier' ? 0.7 : 1;
  const fort = s.vocation === 'fortress' ? 0.8 : 1;
  const f = frontier * fort;
  switch (what) {
    case 'wall':
      if (d.wallLevel >= 5) return null;
      return { items: { stone: Math.round(150 * Math.pow(1.8, d.wallLevel) * f), wood: Math.round(60 * Math.pow(1.6, d.wallLevel) * f) }, gold: Math.round(20 * (d.wallLevel + 1)) };
    case 'gate':
      if (d.gateLevel >= 5 || d.gateLevel >= d.wallLevel) return null;
      return { items: { wood: Math.round(100 * Math.pow(1.7, d.gateLevel) * f), iron: Math.round(20 * (d.gateLevel + 1)) }, gold: 10 * (d.gateLevel + 1) };
    case 'tower':
      if (d.towers >= d.wallLevel * 2) return null;
      return { items: { stone: Math.round(120 * f), wood: Math.round(40 * f) }, gold: 15 };
    case 'moat':
      if (d.moat || !(s.kind === 'castle' || s.kind === 'capital')) return null;
      return { items: { stone: 300, wood: 100 }, gold: 100 };
    case 'oil':
      if (d.oil || d.gateLevel < 1) return null;
      return { items: { charcoal: 40, iron: 20 }, gold: 40 };
    case 'stakes':
      if (d.stakes) return null;
      return { items: { wood: 80 }, gold: 10 };
    case 'pits':
      if (d.pits) return null;
      return { items: { wood: 60 }, gold: 20 };
    case 'repair':
      return { items: { stone: 20 }, gold: 0 };
  }
}

export function upgradeDefense(state: GameState, sId: number, what: DefenseUpgrade): ActionResult {
  const s = settlementById(state, sId);
  if (!s) return fail('Assentamento inválido');
  if (what === 'moat' && !state.nations[s.nation].research.done.includes('moat')) return fail('Pesquise o Fosso primeiro');
  if (what === 'repair') return repairWalls(state, s, Infinity) ? OK : fail('Nada a reparar ou falta pedra');
  const cost = defenseCost(s, what);
  if (!cost) return fail('Não disponível');
  const n = state.nations[s.nation];
  if (!hasItems(s.stock, cost.items)) return fail('Faltam materiais');
  if (n.gold < cost.gold) return fail('Falta ouro');
  takeItems(s.stock, cost.items);
  n.gold -= cost.gold;
  const d = s.defenses;
  switch (what) {
    case 'wall':
      d.wallLevel++;
      d.wallHp = wallMaxHp(state, d.wallLevel, s.nation);
      break;
    case 'gate':
      d.gateLevel++;
      d.gateHp = gateMaxHp(d.gateLevel);
      break;
    case 'tower':
      d.towers++;
      break;
    case 'moat':
      d.moat = true;
      break;
    case 'oil':
      d.oil = true;
      break;
    case 'stakes':
      d.stakes = true;
      break;
    case 'pits':
      d.pits = true;
      break;
  }
  return OK;
}

/** Repara muralha e portão gastando pedra (20 pedra = 100 de vida). Retorna se reparou algo. */
export function repairWalls(state: GameState, s: Settlement, maxStone: number): boolean {
  const d = s.defenses;
  const missing = wallMaxHp(state, d.wallLevel, s.nation) - d.wallHp + gateMaxHp(d.gateLevel) - d.gateHp;
  if (missing <= 0) return false;
  const stoneNeeded = Math.ceil(missing / 5);
  const stone = Math.min(stoneNeeded, maxStone, Math.floor(stockGet(s.stock, 'stone')));
  if (stone <= 0) return false;
  stockAdd(s.stock, 'stone', -stone);
  let hp = stone * 5;
  const gateMissing = gateMaxHp(d.gateLevel) - d.gateHp;
  const g = Math.min(gateMissing, hp);
  d.gateHp += g;
  hp -= g;
  d.wallHp = Math.min(wallMaxHp(state, d.wallLevel, s.nation), d.wallHp + hp);
  return true;
}

// Recrutamento ----------------------------------------------------------------

export function troopCapacity(s: Settlement): number {
  const barracks = s.buildings.filter((b) => b.type === 'barracks' && b.level > 0).reduce((n, b) => n + b.level, 0);
  const base = s.kind === 'castle' ? 40 : s.kind === 'capital' ? 30 : s.kind === 'outpost' ? 10 : 15;
  return base + barracks * 25;
}

export function garrisonOf(state: GameState, s: Settlement) {
  return armyById(state, s.garrisonId);
}

function recruiterLevel(s: Settlement, unit: UnitId): number {
  const rec = UNITS[unit].recruiter;
  if (rec === 'none') return 0;
  return s.buildings.filter((b) => b.type === rec && b.level > 0).reduce((m, b) => Math.max(m, b.level), 0);
}

export function canRecruit(state: GameState, s: Settlement, unit: UnitId, count: number): ActionResult {
  const def = UNITS[unit];
  if (!def.playable) return fail('Unidade indisponível');
  if (count < 1) return fail('Quantidade inválida');
  const lvl = recruiterLevel(s, unit);
  if (lvl < 1) return fail(def.recruiter === 'siege_workshop' ? 'Precisa de Oficina de cerco' : 'Precisa de Quartel');
  if (lvl < def.minLevel) return fail(`Precisa de nível ${def.minLevel}`);
  if (def.research && !state.nations[s.nation].research.done.includes(def.research)) return fail('Precisa de pesquisa');
  if (!hasItems(s.stock, def.cost, count)) return fail('Faltam itens');
  if (state.nations[s.nation].gold < def.gold * count) return fail('Falta ouro');
  if (def.people > 0 && adults(s) < def.people * count) return fail('Faltam cidadãos adultos');
  if (def.people > 0) {
    const g = garrisonOf(state, s);
    const queued = s.trainQueue.reduce((n, j) => n + j.count, 0);
    if ((g ? troopCount(g.troops, false) : 0) + queued + count > troopCapacity(s)) return fail(`Limite de ${troopCapacity(s)} soldados`);
  }
  return OK;
}

export function recruit(state: GameState, sId: number, unit: UnitId, count: number): ActionResult {
  const s = settlementById(state, sId);
  if (!s) return fail('Assentamento inválido');
  const c = Math.floor(count);
  const check = canRecruit(state, s, unit, c);
  if (!check.ok) return check;
  const def = UNITS[unit];
  takeItems(s.stock, def.cost, c);
  state.nations[s.nation].gold -= def.gold * c;
  if (def.people > 0) takeAdults(s, def.people * c);
  const per = trainSeconds(state, s, unit);
  const queue = def.recruiter === 'siege_workshop' ? s.siegeQueue : s.trainQueue;
  const last = queue[queue.length - 1];
  if (last && last.unit === unit) last.count += c;
  else queue.push({ unit, count: c, remaining: per, perUnit: per });
  return OK;
}

export function trainSeconds(_state: GameState, s: Settlement, unit: UnitId): number {
  const lvl = Math.max(1, recruiterLevel(s, unit));
  let t = UNITS[unit].trainTime * (1 - 0.1 * (lvl - 1));
  if (s.zone === 'center') t *= 1.5;
  if (s.zone === 'frontier') t *= 0.7;
  if (s.vocation === 'military') t *= 0.75;
  if (s.vocation === 'commercial') t *= 1.3;
  const district = militaryDistrictBonus(s);
  t *= 1 - district;
  return Math.max(2, Math.round(t * 10) / 10);
}

function militaryDistrictBonus(s: Settlement): number {
  if (s.kind !== 'capital') return 0;
  let best = 0;
  s.districts.forEach((d, q) => {
    if (q < districtsUnlocked(s) && d.vocation === 'military') best = Math.max(best, BALANCE.districtBonus[d.level]);
  });
  return best;
}

/** Dispensa soldados da guarnição: voltam a ser cidadãos. */
export function dismissTroops(state: GameState, sId: number, unit: UnitId, count: number): ActionResult {
  const s = settlementById(state, sId);
  const g = s && garrisonOf(state, s);
  if (!s || !g) return fail('Sem guarnição');
  const n = Math.min(count, g.troops[unit] ?? 0);
  if (n <= 0) return fail('Nenhuma tropa');
  addTroops(g.troops, { [unit]: n }, -1);
  if (UNITS[unit].people > 0) {
    const span = BALANCE.elderAge - BALANCE.adultAge;
    for (let i = 0; i < n; i++) s.ages[BALANCE.adultAge + (i % span)]++;
  }
  return OK;
}

// Armazém ---------------------------------------------------------------------

export function storageCap(state: GameState, s: Settlement): number {
  let cap = BALANCE.baseStorage;
  for (const b of s.buildings) {
    const st = BUILDINGS[b.type].storage;
    if (st && b.level > 0) cap += st * b.level;
  }
  if (state.nations[s.nation].research.done.includes('eco4')) cap *= 1.5;
  return Math.round(cap);
}

export function housing(s: Settlement): number {
  let h = s.kind === 'outpost' ? 12 : 6;
  for (const b of s.buildings) {
    const v = BUILDINGS[b.type].housing;
    if (v && b.level > 0) h += v * b.level;
  }
  return h;
}

/** Parte do estoque escondida dos saqueadores. */
export function protectedShare(s: Settlement): number {
  const levels = s.buildings.filter((b) => b.type === 'storehouse').reduce((n, b) => n + b.level, 0);
  return Math.min(0.5, 0.1 + 0.04 * levels);
}

// Bônus -----------------------------------------------------------------------

function vocationOf(s: Settlement): Vocation | null {
  return s.vocationSwitch ? null : s.vocation;
}

function districtBonusFor(s: Settlement, b: PlacedBuilding): number {
  if (s.kind !== 'capital') return 0;
  const q = footprintQuadrant(b.x, b.y, BUILDINGS[b.type].size);
  if (q < 0 || q >= districtsUnlocked(s)) return 0;
  const d = s.districts[q];
  if (d.vocation && BUILDINGS[b.type].boostedBy.includes(d.vocation)) return BALANCE.districtBonus[d.level];
  return 0;
}

export function productionMultiplier(state: GameState, s: Settlement, b: PlacedBuilding): number {
  const def = BUILDINGS[b.type];
  const nation = state.nations[s.nation];
  let m = levelOutput(b.level);
  const done = nation.research.done;
  if (done.includes('eco1')) m *= 1.1;
  if (done.includes('eco2')) m *= 1.1;
  if (done.includes('eco3')) m *= 1.1;
  const voc = vocationOf(s);
  if (voc && def.boostedBy.includes(voc)) {
    const hall = Math.max(1, keepLevel(s));
    m *= 1 + BALANCE.vocationBonus * (0.5 + 0.1 * (hall - 0));
  }
  m *= 1 + districtBonusFor(s, b);
  // Custos das vocações.
  if (voc === 'agricultural' && def.category === 'industry') m *= 0.8;
  if (voc === 'cultural' && def.category !== 'civic') m *= 0.85;
  if (voc === 'military' && (def.category === 'food' || def.category === 'materials')) m *= 0.85;
  if (voc === 'fortress' && def.category !== 'military') m *= 0.6;
  // Zona.
  if (s.zone === 'middle' && def.category === 'industry') m *= 1.15;
  if (s.zone === 'frontier' && (def.category === 'food' || def.category === 'materials' || def.category === 'civic')) m *= 0.85;
  // Lavouras: estação, solo fértil, eventos.
  if (def.recipes.some((r) => r.seasonal)) {
    if (depositNear(state, s, 'fertile')) m *= 1.3;
    if (state.time < s.modifiers.bumperUntil) m *= 1.5;
    if (state.time < s.modifiers.blightUntil) m *= 0.5;
  }
  // Povo: felicidade, saúde, fome, embriaguez, revolta.
  m *= 0.7 + 0.6 * (s.happiness / 100);
  m *= 1 - 0.5 * s.hunger;
  if (s.diet.pleasure > BALANCE.pleasureExcess) m *= 0.9;
  if (s.revolt) m *= 0.5;
  return m;
}

// Tick do assentamento ----------------------------------------------------------

const TAX_MULT = [0.6, 1, 1.5, 2.2];
const TAX_HAPPY = [6, 0, -10, -25];
const RATION_HAPPY: Record<string, number> = { none: -40, low: -10, normal: 0, high: 8 };

/** A oficina está parada porque tudo o que ela faz já encheu o armazém? */
function saturated(cap: number, s: Settlement, b: PlacedBuilding): boolean {
  const def = BUILDINGS[b.type];
  if (!def.recipes.length) return false;
  return def.recipes.every((r) => {
    const outs = Object.keys(r.output) as ItemId[];
    return outs.length > 0 && !r.gold && outs.every((o) => stockGet(s.stock, o) >= cap * 0.98);
  });
}

function assignWorkers(state: GameState, s: Settlement): void {
  const cap = storageCap(state, s);
  const sickShare = population(s) > 0 ? s.sick / population(s) : 0;
  let available = Math.floor((adults(s) + elders(s) * 0.5) * (1 - sickShare));
  for (const b of s.buildings) b.workers = 0;
  const order = [...s.priorities];
  for (const cat of order) {
    for (const b of s.buildings) {
      if (BUILDINGS[b.type].category !== cat || b.level === 0 || saturated(cap, s, b)) continue;
      const need = workersAt(b.type, b.level);
      const got = Math.min(need, available);
      b.workers = got;
      available -= got;
    }
  }
}

function produce(state: GameState, s: Settlement, dt: number): void {
  const nation = state.nations[s.nation];
  const cap = storageCap(state, s);
  const seasonF = BALANCE.seasonFarm[season(state.time)];
  let researchPoints = 0;
  for (const b of s.buildings) {
    b.efficiency = 0;
    if (b.level === 0) continue;
    const def = BUILDINGS[b.type];
    const need = workersAt(b.type, b.level);
    const eff = need === 0 ? 1 : b.workers / need;
    if (b.type === 'library') {
      researchPoints += (b.workers * 2 * levelOutput(b.level) * (s.zone === 'center' ? 1.25 : 1) * dt) / 60;
      b.efficiency = eff;
      continue;
    }
    if (!def.recipes.length || eff <= 0) {
      b.efficiency = def.recipes.length ? 0 : eff;
      continue;
    }
    const mult = productionMultiplier(state, s, b) * eff;
    const totalW = def.recipes.reduce((n, r) => n + (b.recipeWeights[r.id] ?? (def.recipes.length > 1 ? (r === def.recipes[0] ? 1 : 0) : 1)), 0);
    if (totalW <= 0) continue;
    let produced = 0;
    for (const r of def.recipes) {
      const w = (b.recipeWeights[r.id] ?? (def.recipes.length > 1 ? (r === def.recipes[0] ? 1 : 0) : 1)) / totalW;
      if (w <= 0) continue;
      let amount = (mult * w * dt) / 60;
      if (r.seasonal) amount *= seasonF;
      // Limite por insumo.
      let frac = 1;
      for (const k in r.input) {
        const need2 = (r.input[k as ItemId] ?? 0) * amount;
        if (need2 > 0) frac = Math.min(frac, stockGet(s.stock, k as ItemId) / need2);
      }
      if (r.gold && r.gold < 0) {
        const goldNeed = -r.gold * amount;
        frac = Math.min(frac, goldNeed > 0 ? nation.gold / goldNeed : 1);
      }
      // Limite por espaço no armazém.
      const outs = Object.keys(r.output) as ItemId[];
      if (outs.length && outs.every((o) => stockGet(s.stock, o) >= cap)) frac = 0;
      // Minas gastam o depósito.
      let deposit = def.requiresDeposit ? depositNear(state, s, def.requiresDeposit) : undefined;
      if (def.requiresDeposit && !deposit) frac = 0;
      frac = Math.max(0, Math.min(1, frac));
      if (frac <= 0) continue;
      const a = amount * frac;
      for (const k in r.input) stockAdd(s.stock, k as ItemId, -(r.input[k as ItemId] ?? 0) * a);
      for (const o of outs) {
        const before = stockGet(s.stock, o);
        const add = Math.min((r.output[o] ?? 0) * a, Math.max(0, cap - before));
        stockAdd(s.stock, o, add);
      }
      if (r.gold) nation.gold += r.gold * a;
      if (deposit) {
        const used = Object.values(r.output).reduce((n, v) => n + (v ?? 0), 0) * a + (r.gold ? r.gold * a : 0);
        deposit.amount = Math.max(0, deposit.amount - used);
        if (deposit.amount <= 0 && isPlayer(state, s.nation)) pushEvent(state, `Um depósito perto de ${s.name} se esgotou.`, 'bad', deposit.x, deposit.y);
        deposit = undefined;
      }
      produced += frac * w;
    }
    b.efficiency = eff * Math.min(1, produced);
    if (produced < 0.5 && def.recipes.some((r) => Object.keys(r.input).length > 0)) b.stalled += dt;
    else b.stalled = 0;
  }
  if (researchPoints > 0) addResearch(state, s.nation, researchPoints);
}

export function addResearch(state: GameState, nationId: number, points: number): void {
  const n = state.nations[nationId];
  if (!n.research.current) return;
  n.research.progress += points;
}

function spoil(state: GameState, s: Settlement, dt: number): void {
  const half = state.nations[s.nation].research.done.includes('eco2') ? 0.5 : 1;
  for (const id of ITEM_IDS) {
    const sp = ITEMS[id].spoil;
    const v = stockGet(s.stock, id);
    if (sp && v > 0) stockAdd(s.stock, id, -v * sp * half * (dt / 60));
  }
}

/** Porções por segundo que o assentamento precisa (povo + guarnição). */
export function foodNeed(state: GameState, s: Settlement): number {
  const people = population(s) * BALANCE.foodPerPerson * (BALANCE.rationFactor[s.ration] ?? 1);
  const g = garrisonOf(state, s);
  let troops = 0;
  if (g) for (const k in g.troops) troops += (g.troops[k as UnitId] ?? 0) * UNITS[k as UnitId].upkeep;
  return (people + troops) / 60;
}

function eat(state: GameState, s: Settlement, dt: number): void {
  const need = foodNeed(state, s) * dt;
  const eaten: Record<FoodGroup, number> = { energy: 0, protein: 0, vitamins: 0, pleasure: 0 };
  let total = 0;
  let variety = 0;
  if (need > 0) {
    // Divide a necessidade igualmente entre os alimentos disponíveis.
    let left = need;
    let avail = FOOD_IDS.filter((f) => stockGet(s.stock, f) > 0.001);
    variety = avail.length;
    let guard = 0;
    while (left > 1e-6 && avail.length && guard++ < 10) {
      const share = left / avail.length;
      const next: ItemId[] = [];
      for (const f of avail) {
        const have = stockGet(s.stock, f);
        const take = Math.min(have, share);
        stockAdd(s.stock, f, -take);
        eaten[ITEMS[f].group!] += take;
        total += take;
        left -= take;
        if (have - take > 0.001) next.push(f);
      }
      avail = next;
    }
  }
  const alpha = Math.min(1, dt / 60);
  if (total > 0) {
    for (const gname of FOOD_GROUPS) s.diet[gname] += (eaten[gname] / total - s.diet[gname]) * alpha;
  }
  s.dietVariety += (variety - s.dietVariety) * alpha;
  const hungerNow = need > 0 ? Math.max(0, 1 - total / need) : 0;
  s.hunger += (hungerNow - s.hunger) * alpha;
  if (s.diet.vitamins < 0.05) s.noVitamins += dt;
  else s.noVitamins = Math.max(0, s.noVitamins - dt * 2);
}

export function groupsCovered(s: Settlement): number {
  return FOOD_GROUPS.filter((g) => s.diet[g] >= 0.1).length;
}

/** Efeitos da dieta nos soldados e no povo. */
export function dietEffects(s: Settlement): { strength: number; speed: number; disease: number; label: string[] } {
  const label: string[] = [];
  let strength = 1 + BALANCE.varietyBonus[groupsCovered(s)];
  let speed = 1;
  let disease = 0;
  if (s.diet.protein > BALANCE.excessShare) {
    speed *= 0.85;
    label.push('Excesso de proteína: o povo engordou');
  }
  if (s.diet.energy > BALANCE.excessShare) {
    strength *= 0.85;
    disease += 0.1;
    label.push('Desnutrição: só pão e mingau');
  }
  if (s.noVitamins > BALANCE.seasonSeconds) {
    disease += 0.2;
    label.push('Sem vitaminas: doenças se espalham');
  }
  if (s.diet.pleasure > BALANCE.pleasureExcess) label.push('Embriaguez: menos disciplina');
  if (s.hunger > 0.2) {
    strength *= 1 - s.hunger * 0.5;
    label.push('Fome');
  }
  return { strength, speed, disease, label };
}

function hasBuilding(s: Settlement, id: BuildingId): number {
  return s.buildings.filter((b) => b.type === id && b.level > 0).reduce((n, b) => n + b.level, 0);
}

function updateWellbeing(state: GameState, s: Settlement, dt: number): void {
  const pop = population(s);
  const fx = dietEffects(s);
  // Saúde
  let health = 0.72;
  if (s.diet.vitamins >= 0.1) health += 0.1;
  health += Math.min(0.08, hasBuilding(s, 'well') * 0.03);
  health += Math.min(0.12, hasBuilding(s, 'infirmary') * 0.04);
  if (season(state.time) === 3) health -= 0.1;
  health -= fx.disease;
  health -= s.hunger * 0.4;
  if (pop > housing(s)) health -= 0.12;
  health = Math.max(0.05, Math.min(1, health));
  s.health += (health - s.health) * Math.min(1, dt * 0.01);

  // Surtos de doença
  if (s.outbreak > 0) {
    s.outbreak -= dt;
    if (s.outbreak <= 0) {
      s.outbreak = 0;
      s.sick = 0;
    }
  } else if (s.health < 0.45 && pop > 0) {
    const chance = (0.45 - s.health) * 0.002 * dt / (1 + hasBuilding(s, 'infirmary') * 0.5);
    if (rnd(state) < chance) {
      s.outbreak = 120;
      s.sick = Math.round(pop * (0.1 + rnd(state) * 0.15));
      const deaths = Math.round(s.sick * 0.15 / (1 + hasBuilding(s, 'infirmary') * 0.5));
      killSome(s, deaths);
      notice(state, s, 'disease', `Surto de doença em ${s.name}: ${s.sick} doentes, ${deaths} mortos.`);
    }
  }

  // Cultura e felicidade
  let culture = 0;
  let happyBuildings = 0;
  for (const b of s.buildings) {
    if (b.level === 0) continue;
    const def = BUILDINGS[b.type];
    let h = (def.happiness ?? 0) * b.level;
    if (b.type === 'chapel' && b.efficiency > 0.5) h *= 1.5;
    happyBuildings += h * (def.workers ? b.efficiency || (b.workers > 0 ? 1 : 0) : 1);
    culture += (def.culture ?? 0) * b.level * (1 + districtBonusFor(s, b));
  }
  if (vocationOf(s) === 'cultural') culture *= 1.4;
  if (vocationOf(s) === 'industrial') culture *= 0.5;
  if (s.zone === 'center') culture *= 1.25;
  s.culture = culture;
  let happy = 50;
  happy += BALANCE.varietyBonus[groupsCovered(s)] * 60;
  happy += Math.min(4, Math.max(0, s.dietVariety - groupsCovered(s)) * 1);
  happy += RATION_HAPPY[s.ration] ?? 0;
  happy += Math.min(25, happyBuildings);
  happy += Math.min(10, culture / 4);
  happy += TAX_HAPPY[s.tax] ?? 0;
  happy -= s.hunger * 40;
  happy -= pop > 0 ? (s.sick / pop) * 60 : 0;
  if (s.zone === 'frontier') happy -= 8;
  if (s.zone === 'center') happy += 5;
  if (vocationOf(s) === 'mining') happy -= 8;
  if (state.battles.some((b) => b.settlementId === s.id)) happy -= 15;
  if (state.nations[s.nation].emperor) happy += 5;
  happy = Math.max(0, Math.min(100, happy));
  s.happiness += (happy - s.happiness) * Math.min(1, dt * 0.03);
  let morale = s.happiness;
  if (s.diet.pleasure >= 0.1) morale += 5;
  s.morale += (Math.max(0, Math.min(100, morale)) - s.morale) * Math.min(1, dt * 0.03);

  // Lealdade
  if (s.kind === 'capital') s.loyalty = 100;
  else if (s.kind !== 'camp' && s.kind !== 'tribal') {
    const nation = state.nations[s.nation];
    const capital = settlementById(state, nation.capitalId);
    let loyal = 45 + (s.happiness - 50) * 0.6;
    let nearCulture = 0;
    for (const o of state.settlements) {
      if (o.nation === s.nation && o !== s && dist(o.x, o.y, s.x, s.y) < 24) nearCulture += o.culture;
    }
    loyal += Math.min(20, nearCulture / 5);
    if (s.consulId != null) loyal += nation.research.done.includes('adm3') ? 15 : 10;
    if (capital) loyal -= Math.min(20, dist(capital.x, capital.y, s.x, s.y) / 10);
    loyal -= s.tax * 5;
    loyal = Math.max(0, Math.min(100, loyal));
    s.loyalty += (loyal - s.loyalty) * Math.min(1, dt * 0.01);
    const wasRevolt = s.revolt;
    s.revolt = s.loyalty < 20;
    if (s.revolt && !wasRevolt) notice(state, s, 'revolt', `${s.name} está em revolta! A lealdade caiu para ${Math.round(s.loyalty)}.`, true);
  }
}

function killSome(s: Settlement, n: number): void {
  let left = n;
  for (let a = s.ages.length - 1; a >= 0 && left > 0; a--) {
    const k = Math.min(left, Math.ceil(s.ages[a] * 0.3));
    s.ages[a] -= k;
    left -= k;
  }
}

function rnd(state: GameState): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Envia um aviso (carta do cônsul ou evento) sem repetir o mesmo tipo em menos de 2 minutos. */
export function notice(state: GameState, s: Settlement, key: string, text: string, bad = true): void {
  if (state.time - (s.lastNotice[key] ?? -1e9) < 120) return;
  s.lastNotice[key] = state.time;
  noticeHook(state, s, key, text, bad);
}

/** Substituído pelo módulo de cartas (evita dependência circular). */
export let noticeHook = (state: GameState, s: Settlement, _key: string, text: string, bad: boolean): void => {
  if (isPlayer(state, s.nation)) pushEvent(state, text, bad ? 'bad' : 'info', s.x, s.y);
};
export function setNoticeHook(fn: typeof noticeHook): void {
  noticeHook = fn;
}

function populationTick(state: GameState, s: Settlement, dt: number): void {
  const pop = population(s);
  const room = housing(s) - pop;
  const ad = adults(s);
  if (room > 0 && ad > 1) {
    const seasonF = [1.4, 1, 0.9, 0.7][season(state.time)];
    const f = Math.max(0.3, Math.min(1.3, s.happiness / 60)) * (1 - s.hunger) * s.health * seasonF;
    s.birthAcc += (ad * BALANCE.birthRate * f * dt) / YEAR_SECONDS;
    while (s.birthAcc >= 1 && housing(s) > population(s)) {
      s.ages[0]++;
      s.birthAcc -= 1;
    }
    if (s.birthAcc > 1) s.birthAcc = 1;
  }
  const old = elders(s);
  if (old > 0) {
    s.deathAcc += (old * BALANCE.elderDeath * dt) / YEAR_SECONDS;
    while (s.deathAcc >= 1) {
      for (let a = s.ages.length - 1; a >= BALANCE.elderAge; a--) {
        if (s.ages[a] > 0) {
          s.ages[a]--;
          break;
        }
      }
      s.deathAcc -= 1;
    }
  }
  // Fome severa mata e espanta gente.
  if (s.hunger > 0.6 && pop > 0 && rnd(state) < 0.02 * dt) {
    killSome(s, 1);
    notice(state, s, 'hunger', `O povo de ${s.name} passa fome!`);
  }
}

/** Envelhece todos em um ano (chamado na virada do ano). */
export function ageOneYear(s: Settlement): void {
  for (let a = s.ages.length - 1; a > 0; a--) s.ages[a] = s.ages[a - 1];
  s.ages[0] = 0;
  s.ages[s.ages.length - 1] = 0;
}

function taxes(state: GameState, s: Settlement, dt: number): void {
  const nation = state.nations[s.nation];
  let perMin = adults(s) * 0.025;
  for (const b of s.buildings) {
    const t = BUILDINGS[b.type].tax;
    if (t && b.level > 0) perMin += t * b.level * (1 + districtBonusFor(s, b));
  }
  perMin *= TAX_MULT[s.tax] ?? 1;
  if (s.zone === 'center') perMin *= 1.25;
  if (vocationOf(s) === 'commercial') perMin *= 1.4;
  if (nation.research.done.includes('adm2')) perMin *= 1.1;
  const capital = settlementById(state, nation.capitalId);
  if (capital && capital !== s) {
    const corr = Math.min(0.5, dist(capital.x, capital.y, s.x, s.y) / 200) * (nation.research.done.includes('adm1') ? 0.6 : 1);
    perMin *= 1 - corr;
  }
  if (s.revolt) perMin *= 0.2;
  s.taxIncome = perMin;
  nation.gold += (perMin * dt) / 60;
}

function constructionTick(state: GameState, s: Settlement, dt: number): void {
  for (const b of s.buildings) {
    if (!b.build) continue;
    b.build.remaining -= dt;
    if (b.build.remaining <= 0) {
      b.level = b.build.toLevel;
      b.build = null;
      if (b.type === 'keep' || b.type === 'governor_hall') {
        s.gridSize = gridSizeFor(s);
        while (s.districts.length < 4) s.districts.push({ vocation: null, level: 0 });
      }
      if (isPlayer(state, s.nation)) pushEvent(state, `${BUILDINGS[b.type].name} em ${s.name} chegou ao nível ${b.level}.`, 'good', s.x, s.y);
    }
  }
}

function trainingTick(state: GameState, s: Settlement, dt: number): void {
  for (const queue of [s.trainQueue, s.siegeQueue]) {
    let time = dt;
    while (time > 1e-9 && queue.length) {
      const job = queue[0];
      const step = Math.min(time, job.remaining);
      job.remaining -= step;
      time -= step;
      if (job.remaining <= 1e-9) {
        const g = garrisonOf(state, s);
        if (g) addTroops(g.troops, { [job.unit]: 1 });
        job.count--;
        if (job.count <= 0) {
          queue.shift();
          if (isPlayer(state, s.nation)) pushEvent(state, `Treino concluído em ${s.name}: ${UNITS[job.unit].plural}.`, 'good', s.x, s.y);
        } else job.remaining = job.perUnit;
      }
    }
  }
  // Feridos voltam.
  if (s.wounded.length) {
    const g = garrisonOf(state, s);
    s.wounded = s.wounded.filter((w) => {
      if (state.time >= w.until) {
        if (g) addTroops(g.troops, w.troops);
        return false;
      }
      return true;
    });
  }
  // Campo de treino: a guarnição ganha experiência.
  const tg = hasBuilding(s, 'training_ground');
  if (tg > 0) {
    const g = garrisonOf(state, s);
    if (g && troopCount(g.troops) > 0) g.xp = Math.min(1, g.xp + (tg * 0.0004 * dt));
  }
}

function vocationTick(state: GameState, s: Settlement, dt: number): void {
  if (!s.vocationSwitch) return;
  s.vocationSwitch.remaining -= dt;
  if (s.vocationSwitch.remaining <= 0) {
    s.vocation = s.vocationSwitch.to;
    s.vocationSwitch = null;
    if (isPlayer(state, s.nation)) pushEvent(state, `${s.name} completou a troca de vocação.`, 'good', s.x, s.y);
  }
}

/** Zona do assentamento pela distância até território estrangeiro. */
export function computeZone(state: GameState, s: Settlement): Zone {
  let best = Infinity;
  for (const o of state.settlements) {
    if (o.nation === s.nation || o.ruinedFor > 0 || o.kind === 'camp') continue;
    const kindO = state.nations[o.nation].kind;
    if (kindO === 'bandit' || kindO === 'horde') continue;
    if (state.nations[o.nation].vassalOf === s.nation) continue;
    const r = o.kind === 'tribal' ? 3 + state.nations[o.nation].tribeLevel : BALANCE.claimRadius[o.kind] ?? 5;
    best = Math.min(best, dist(o.x, o.y, s.x, s.y) - r);
  }
  s.foreignDistance = Math.max(0, best);
  if (best < BALANCE.zoneFrontier) return 'frontier';
  if (best < BALANCE.zoneMiddle) return 'middle';
  return 'center';
}

export function tickSettlement(state: GameState, s: Settlement, dt: number): void {
  if (s.kind === 'camp' || s.kind === 'tribal') return;
  constructionTick(state, s, dt);
  assignWorkers(state, s);
  produce(state, s, dt);
  spoil(state, s, dt);
  eat(state, s, dt);
  updateWellbeing(state, s, dt);
  populationTick(state, s, dt);
  taxes(state, s, dt);
  trainingTick(state, s, dt);
  vocationTick(state, s, dt);
  if (state.time % 10 < dt) s.zone = computeZone(state, s);
  // Muralha se recupera sozinha bem devagar fora de combate (manutenção básica).
  void rt;
}

export function stockSummary(s: Settlement, ids: ItemId[]): string {
  return ids.map((i) => `${ITEMS[i].name} ${Math.floor(stockGet(s.stock, i))}`).join(', ');
}

export function totalTroops(t: Troops): number {
  return troopCount(t);
}
