// Inteligência dos inimigos. Ninguém joga por turnos: cada um tem um timer de
// pensamento próprio e desencontrado, e toma uma decisão pequena quando ele zera.
import { BALANCE, YEAR_SECONDS } from './data/balance';
import { BUILDINGS, buildCost, type BuildingId, type Vocation } from './data/buildings';
import { hasItems, stockGet, type ItemId } from './data/items';
import { RESEARCH } from './data/research';
import { UNITS, troopCount, type Troops, type UnitId } from './data/units';
import { BASE_SEA, MAP_SIZE, getMap, idx, inBounds, isBuildable } from './map';
import { armyById, rt, settlementById } from './runtime';
import { armySize, fightingSize, formArmy, nearestOwnSettlement, orderAttack, orderMove, orderReturn, removeArmy, setPath } from './army';
import { battleStrength } from './battle';
import { banditGarrison, newArmy, tribalGarrison } from './create';
import { counterIntelEffect, hireSpy, nationStrength, spyQuote } from './spy';
import { declareWar, perceivedTension, propose } from './diplomacy';
import { canFoundAt, newTraveler, sendColonists, settlementLimit } from './logistics';
import { rand } from './rng';
import {
  canPlace,
  canRecruit,
  garrisonOf,
  housing,
  investDistrict,
  keepLevel,
  maxBuildingLevel,
  placeBuilding,
  recruit,
  setDistrictVocation,
  setVocation,
  storageCap,
  upgradeBuilding,
  upgradeDefense,
  usableBounds,
  wallMaxHp,
} from './settlement';
import type { Army, GameState, Nation, Settlement } from './types';
import { adults, dist, isHostile, isPlayer, population, pushEvent, relation } from './util';

// Construção automática ----------------------------------------------------------

/** Procura o lugar livre mais perto do centro para uma construção. */
export function findSpot(state: GameState, s: Settlement, type: BuildingId): { x: number; y: number } | null {
  const b = usableBounds(s);
  const c = 11.5;
  let best: { x: number; y: number } | null = null;
  let bd = Infinity;
  const size = BUILDINGS[type].size;
  for (let y = b.y0; y <= b.y1 - size; y++) {
    for (let x = b.x0; x <= b.x1 - size; x++) {
      const d = Math.hypot(x + size / 2 - c, y + size / 2 - c);
      if (d >= bd) continue;
      if (canPlace(state, s, type, x, y).ok) {
        bd = d;
        best = { x, y };
      }
    }
  }
  return best;
}

function count(s: Settlement, t: BuildingId): number {
  return s.buildings.filter((b) => b.type === t).length;
}

/** Alguma construção do assentamento produz este item? */
function produces(s: Settlement, item: ItemId): boolean {
  return s.buildings.some((b) => BUILDINGS[b.type].recipes.some((r) => (r.output[item] ?? 0) > 0));
}

/** Os insumos da construção existem (em estoque ou sendo produzidos)? */
function inputsAvailable(s: Settlement, type: BuildingId): boolean {
  const def = BUILDINGS[type];
  if (!def.recipes.length) return true;
  return def.recipes.some((r) => Object.keys(r.input).every((k) => stockGet(s.stock, k as ItemId) > 10 || produces(s, k as ItemId)));
}

/** Plano de construção: o que um senhor quer ter, na ordem de importância. */
function buildWishes(_state: GameState, s: Settlement, n: Nation): [BuildingId, number][] {
  const pop = population(s);
  const lvl = Math.max(1, keepLevel(s));
  const war = n.personality === 'conqueror' ? 1.5 : n.personality === 'merchant' ? 0.6 : 1;
  const wishes: [BuildingId, number][] = [];
  const have = (ids: ItemId[]) => ids.reduce((k, i) => k + stockGet(s.stock, i), 0);
  const capped = (t: BuildingId, max: number) => wishes.push([t, Math.min(max, count(s, t) + 1)]);
  if (housing(s) < pop + 6) capped('house', 6 + 5 * lvl);
  wishes.push(['sawmill', 1], ['quarry', 1]);
  if (s.kind !== 'outpost') wishes.push(['barracks', 1]);
  wishes.push(['wheat_farm', 1], ['mill', 1], ['bakery', 1], ['vegetable_garden', 1], ['oat_farm', 1], ['henhouse', 1], ['kitchen', 1]);
  if (have(['bread', 'porridge']) < pop * 5) {
    if (stockGet(s.stock, 'flour') > pop * 2) capped('bakery', 1 + Math.floor(pop / 40));
    else if (stockGet(s.stock, 'wheat') > pop * 2) capped('mill', 1 + Math.floor(pop / 60));
    else if (stockGet(s.stock, 'oats') > pop * 2) capped('kitchen', 1 + Math.floor(pop / 60));
    else capped('wheat_farm', 1 + Math.floor(pop / 50));
  }
  if (have(['vegetables', 'fruit']) < pop * 2.5) capped('vegetable_garden', 1 + Math.floor(pop / 35));
  if (have(['eggs', 'meat', 'fish', 'cheese']) < pop * 2.5) {
    if (stockGet(s.stock, 'oats') < 30) capped('oat_farm', 1 + Math.floor(pop / 60));
    else capped('henhouse', 1 + Math.floor(pop / 40));
  }
  wishes.push(['iron_mine', 1], ['blacksmith', 1], ['fletcher', 1], ['well', 1]);
  const cap = storageCapOf(s);
  if (Object.values(s.stock).some((v) => (v ?? 0) > cap * 0.9)) capped('storehouse', 2 + lvl);
  wishes.push(['sawmill', 1 + Math.floor(lvl / 3)], ['quarry', 1 + Math.floor(lvl / 3)]);
  if (lvl >= 2) wishes.push(['stable', Math.round(1 * war)], ['chapel', 1]);
  if (lvl >= 2 && (s.kind === 'capital' || s.kind === 'city')) wishes.push(['library', 1]);
  if (lvl >= 2) wishes.push(['pasture', 1], ['butcher', 1], ['fisher', 1], ['orchard', 1]);
  if (lvl >= 3) wishes.push(['tavern', 1], ['charcoal_kiln', 1], ['foundry', 1], ['tannery', 1], ['infirmary', 1], ['watchtower', 1 + (s.zone === 'frontier' ? 1 : 0)]);
  if (lvl >= 3 && war > 1) wishes.push(['siege_workshop', 1]);
  if (lvl >= 4) wishes.push(['barley_farm', 1], ['brewery', 1], ['dairy', 1], ['market', 1], ['statue', 1], ['garden', 1]);
  if (n.personality === 'builder' || n.personality === 'merchant') wishes.push(['market', 1], ['chapel', 2], ['garden', 2]);
  return wishes;
}

let storageCapOf: (s: Settlement) => number = () => 1000;

function aiBuild(state: GameState, s: Settlement, n: Nation): void {
  storageCapOf = (x) => storageCap(state, x);
  const running = s.buildings.filter((b) => b.build).length;
  if (running >= (BALANCE.maxConstructions[s.kind] ?? 1)) return;
  // A Torre/Salão vem antes de tudo quando o resto já acompanha o nível.
  const hall0 = s.buildings.find((b) => b.type === 'keep' || b.type === 'governor_hall');
  if (hall0 && !hall0.build && hall0.level < BUILDINGS[hall0.type].maxLevel) {
    const avg = s.buildings.filter((b) => b !== hall0 && b.level > 0 && BUILDINGS[b.type].workers > 0).reduce((k, b, _i, arr) => k + b.level / arr.length, 0);
    if ((hall0.level < 3 || avg >= hall0.level - 1.5) && upgradeBuilding(state, s.id, hall0.id).ok) return;
  }
  for (const [type, want] of buildWishes(state, s, n)) {
    if (count(s, type) >= want) continue;
    if (!inputsAvailable(s, type)) continue;
    const def = BUILDINGS[type];
    const { items, gold } = buildCost(type, 1);
    if (!hasItems(s.stock, items) || n.gold < gold) continue;
    const spot = findSpot(state, s, type);
    if (!spot) continue;
    if (placeBuilding(state, s.id, type, spot.x, spot.y).ok) return;
    void def;
  }
  // Nada novo: melhora algo. A Torre/Salão primeiro, quando os outros já alcançaram o nível.
  const hall = s.buildings.find((b) => b.type === 'keep' || b.type === 'governor_hall');
  const others = s.buildings.filter((b) => b !== hall && b.level > 0);
  const lowest = others.length ? Math.min(...others.map((b) => b.level)) : 0;
  if (hall && !hall.build && hall.level <= lowest + 1 && hall.level < BUILDINGS[hall.type].maxLevel) {
    if (upgradeBuilding(state, s.id, hall.id).ok) return;
  }
  const order = [...others].sort((a, b) => a.level - b.level);
  for (const b of order) {
    if (b.build || b.level >= maxBuildingLevel(s, b.type)) continue;
    if (upgradeBuilding(state, s.id, b.id).ok) return;
  }
}

function aiDefenses(state: GameState, s: Settlement, n: Nation): void {
  const want = s.zone === 'frontier' || n.personality === 'cautious' || s.kind === 'castle' ? 4 : s.kind === 'capital' ? 3 : 1;
  const d = s.defenses;
  if (d.wallLevel < Math.min(want, Math.max(1, keepLevel(s)))) upgradeDefense(state, s.id, 'wall');
  else if (d.gateLevel < d.wallLevel) upgradeDefense(state, s.id, 'gate');
  else if (d.towers < d.wallLevel && n.personality !== 'merchant') upgradeDefense(state, s.id, 'tower');
  if (d.wallHp < wallMaxHp(state, d.wallLevel, s.nation)) upgradeDefense(state, s.id, 'repair');
}

/** Ajusta o ferreiro para fazer o que falta. */
function aiSmith(_state: GameState, s: Settlement): void {
  const smith = s.buildings.find((b) => b.type === 'blacksmith' && b.level > 0);
  if (!smith) return;
  const w = stockGet(s.stock, 'weapon');
  const a = stockGet(s.stock, 'armor');
  smith.recipeWeights = { weapon: w < 30 ? 3 : 1, armor: a < 15 ? 2 : 1, shield: stockGet(s.stock, 'leather') > 10 ? 1 : 0, crossbow: stockGet(s.stock, 'steel') > 6 ? 1 : 0 };
}

const MIX: UnitId[] = ['spearman', 'archer', 'spearman', 'knight', 'shieldman', 'crossbowman', 'archer'];

function aiRecruit(state: GameState, s: Settlement, n: Nation, danger: boolean): void {
  const g = garrisonOf(state, s);
  if (!g) return;
  const pop = population(s);
  const ratio = n.personality === 'conqueror' ? 0.35 : n.personality === 'cautious' ? 0.28 : n.personality === 'merchant' ? 0.15 : 0.22;
  const want = Math.floor(pop * ratio * (danger ? 1.4 : 1));
  const have = troopCount(g.troops, false) + s.trainQueue.reduce((k, j) => k + j.count, 0);
  if (have >= want || adults(s) < 12) return;
  for (let i = 0; i < MIX.length; i++) {
    const u = MIX[(Math.floor(state.time / 10) + i) % MIX.length];
    const c = Math.min(5, want - have);
    if (c > 0 && canRecruit(state, s, u, c).ok) {
      recruit(state, s.id, u, c);
      return;
    }
  }
  // Máquinas de cerco para conquistadores.
  if (n.personality === 'conqueror' && (g.troops.ram ?? 0) < 1 && canRecruit(state, s, 'ram', 1).ok) recruit(state, s.id, 'ram', 1);
}

/** Melhor lugar para fundar uma aldeia perto do reino. */
function expansionSite(state: GameState, n: Nation): { x: number; y: number; from: Settlement } | null {
  const own = state.settlements.filter((s) => s.nation === n.id);
  const m = getMap();
  let best: { x: number; y: number; from: Settlement } | null = null;
  let bestScore = -Infinity;
  for (let k = 0; k < 60; k++) {
    const from = own[Math.floor(rand(state) * own.length)];
    if (!from) break;
    const a = rand(state) * Math.PI * 2;
    const r = 12 + rand(state) * 14;
    const x = Math.round(from.x + Math.cos(a) * r);
    const y = Math.round(from.y + Math.sin(a) * r);
    if (!inBounds(x, y) || !isBuildable(m, idx(x, y))) continue;
    if (!canFoundAt(state, n.id, x, y).ok) continue;
    let score = -r;
    for (const d of state.deposits) {
      const dd = dist(d.x, d.y, x, y);
      if (dd < BALANCE.depositReach) score += d.type === 'gold' || d.type === 'diamond' ? 12 : 6;
    }
    if (m.coast[idx(x, y)]) score += 3;
    for (const o of state.settlements) if (o.nation !== n.id && dist(o.x, o.y, x, y) < 20) score -= 8;
    if (score > bestScore) {
      bestScore = score;
      best = { x, y, from };
    }
  }
  return best;
}

function aiExpand(state: GameState, n: Nation): void {
  const own = state.settlements.filter((s) => s.nation === n.id);
  if (own.length >= settlementLimit(state, n.id)) return;
  if (state.travelers.some((t) => t.kind === 'colonists' && t.nation === n.id)) return;
  const cap = settlementById(state, n.capitalId);
  if (!cap || adults(cap) < 30) return;
  const site = expansionSite(state, n);
  if (!site) return;
  const kind = n.personality === 'cautious' && own.length % 3 === 2 ? 'castle' : own.length % 4 === 3 ? 'outpost' : 'village';
  const from = adults(site.from) >= 30 ? site.from : cap;
  sendColonists(state, from.id, site.x, site.y, kind);
}

function aiVocation(state: GameState, s: Settlement, n: Nation): void {
  if (s.kind === 'capital') {
    const prefs: Record<string, Vocation[]> = {
      conqueror: ['military', 'industrial', 'agricultural', 'fortress'],
      merchant: ['commercial', 'agricultural', 'cultural', 'industrial'],
      builder: ['cultural', 'agricultural', 'commercial', 'industrial'],
      treacherous: ['commercial', 'military', 'industrial', 'agricultural'],
      cautious: ['fortress', 'agricultural', 'industrial', 'military'],
    };
    const list = prefs[n.personality ?? 'builder'];
    s.districts.forEach((d, q) => {
      if (!d.vocation) setDistrictVocation(state, s.id, q, list[q]);
      else if (n.gold > 400) investDistrict(state, s.id, q);
    });
    return;
  }
  if (s.vocation || s.kind === 'outpost') return;
  const nearMine = state.deposits.some((d) => d.type !== 'fertile' && d.type !== 'fish' && dist(d.x, d.y, s.x, s.y) < BALANCE.depositReach);
  setVocation(state, s.id, s.zone === 'frontier' ? (s.kind === 'castle' ? 'fortress' : 'military') : nearMine ? 'mining' : s.zone === 'middle' ? 'industrial' : 'agricultural');
}

function aiResearch(_state: GameState, n: Nation): void {
  if (n.research.current) return;
  const order: Record<string, string[]> = {
    conqueror: ['mil1', 'mil2', 'crossbows', 'con1', 'eco1', 'adm1', 'horse_archery', 'mil3', 'heavy_cavalry', 'stone_walls'],
    cautious: ['con1', 'stone_walls', 'mil1', 'eco1', 'moat', 'crossbows', 'adm1', 'con2'],
  };
  const list = order[n.personality ?? ''] ?? ['eco1', 'con1', 'adm1', 'mil1', 'eco2', 'con2', 'adm2', 'crossbows', 'eco3', 'stone_walls'];
  const next = list.find((id) => !n.research.done.includes(id) && RESEARCH.find((r) => r.id === id && (!r.requires || n.research.done.includes(r.requires))))
    ?? RESEARCH.find((r) => !n.research.done.includes(r.id) && (!r.requires || n.research.done.includes(r.requires)))?.id;
  if (next) {
    n.research.current = next;
    n.research.progress = 0;
  }
}

/** Estimativa de força que a IA tem de outro reino (espiões, ou o que vê). */
export function estimateStrength(state: GameState, me: Nation, other: number): number {
  const k = me.knowledge[other];
  if (k && state.time - k.time < 900) return k.strength;
  // Sem espiões: chuta pelos exércitos na fronteira e pelo tamanho do reino.
  let est = 0;
  for (const a of state.armies) {
    if (a.nation !== other) continue;
    const seen = state.settlements.some((s) => s.nation === me.id && dist(s.x, s.y, a.x, a.y) < 20);
    est += battleStrength(a.troops) * (seen ? 1 : 0.8);
  }
  if (isPlayer(state, other)) {
    const ci = counterIntelEffect(state, other);
    if (ci.silence) est *= 1.3;
    est *= ci.falseFactor;
  }
  return est;
}

function strongestGarrison(state: GameState, n: Nation): Settlement | undefined {
  return state.settlements
    .filter((s) => s.nation === n.id)
    .sort((a, b) => fightingSize(garrisonOf(state, b)!) - fightingSize(garrisonOf(state, a)!))[0];
}

function aiWar(state: GameState, n: Nation): void {
  const mine = nationStrength(state, n.id);
  // Defesa: socorre assentamentos sitiados.
  for (const b of state.battles) {
    const s = b.settlementId != null ? settlementById(state, b.settlementId) : undefined;
    if (!s || s.nation !== n.id) continue;
    const helper = state.armies.find((a) => a.nation === n.id && a.stationedAt == null && a.battleId == null && a.order !== 'attack');
    if (helper) orderMove(state, helper.id, s.x, s.y);
  }
  if (state.armies.some((a) => a.nation === n.id && a.stationedAt == null && (a.order === 'attack' || a.order === 'raid'))) return;

  // Escolhe o alvo: o vizinho hostil mais fraco.
  let target: Settlement | null = null;
  let bestScore = 0;
  for (const other of state.nations) {
    if (!other.alive || other.id === n.id || (other.kind !== 'player' && other.kind !== 'rival' && other.kind !== 'tribe')) continue;
    if (other.vassalOf === n.id || n.vassalOf === other.id) continue;
    const rel = relation(state, n.id, other.id);
    if (rel.state === 'alliance' && n.personality !== 'treacherous') continue;
    if (rel.state === 'truce' && state.time < rel.truceUntil) continue;
    const t = perceivedTension(state, n.id, other.id);
    const hostileEnough = t === 'hostile' || (t === 'tense' && (n.personality === 'conqueror' || n.personality === 'treacherous' || other.kind === 'tribe'));
    if (!hostileEnough) continue;
    const theirs = estimateStrength(state, n, other.id);
    const margin = n.personality === 'cautious' ? 2 : n.personality === 'conqueror' ? 1.15 : 1.4;
    // Traiçoeiro quebra alianças quando o aliado está fraco.
    if (rel.state === 'alliance' && mine < theirs * 2.2) continue;
    if (mine < theirs * margin) continue;
    for (const s of state.settlements) {
      if (s.nation !== other.id || s.ruinedFor > 0) continue;
      const home = nearestOwnSettlement(state, n.id, s.x, s.y);
      if (!home) continue;
      const d = dist(home.x, home.y, s.x, s.y);
      if (d > 70) continue;
      const g = garrisonOf(state, s);
      const def = (g ? battleStrength(g.troops) : 0) * (1 + (BALANCE.wallBonus[s.defenses.wallLevel] ?? 0));
      const score = 1000 / (d + 10) + (s.kind === 'capital' ? 0 : 5) - def / 50;
      if (score > bestScore) {
        bestScore = score;
        target = s;
      }
    }
  }
  if (!target) return;
  const from = strongestGarrison(state, n);
  if (!from) return;
  const g = garrisonOf(state, from)!;
  const send: Troops = {};
  for (const k in g.troops) {
    const u = k as UnitId;
    if (u === 'militia') continue;
    const keep = UNITS[u].cls === 'siege' ? 0 : 0.35;
    const c = Math.floor((g.troops[u] ?? 0) * (1 - keep));
    if (c > 0) send[u] = c;
  }
  const tg = garrisonOf(state, target);
  const need = (tg ? battleStrength(tg.troops) : 0) * (1 + (BALANCE.wallBonus[target.defenses.wallLevel] ?? 0)) * 1.3 + 40;
  if (battleStrength(send) < need) return;
  const res = formArmy(state, from.id, send, `Exército de ${n.name}`);
  if (!res.ok || res.armyId == null) return;
  if (!isHostile(state, n.id, target.nation)) declareWar(state, n.id, target.nation);
  const mode = state.nations[target.nation].kind === 'tribe' || n.personality === 'conqueror' || target.kind !== 'capital' ? 'attack' : 'raid';
  const ord = orderAttack(state, res.armyId, target.id, mode);
  if (!ord.ok) {
    const a = armyById(state, res.armyId);
    if (a) orderReturn(state, a.id);
    return;
  }
  if (isPlayer(state, target.nation)) {
    pushEvent(state, `${n.name} marcha contra ${target.name}!`, 'bad', target.x, target.y);
  }
}

function aiDiplomacy(state: GameState, n: Nation): void {
  const player = state.nations[state.playerNation];
  if (!player.alive) return;
  const rel = relation(state, n.id, player.id);
  const mine = nationStrength(state, n.id);
  const theirs = estimateStrength(state, n, player.id);
  // Perdendo a guerra: pede paz ou oferece tributo.
  if (rel.state === 'war' && mine < theirs * 0.6 && rand(state) < 0.15) {
    propose(state, n.id, player.id, mine < theirs * 0.3 ? 'tribute-offer' : 'peace', Math.round(40 + mine / 10));
    return;
  }
  const t = perceivedTension(state, n.id, player.id);
  if (rel.state === 'peace' && !rel.trade && n.personality === 'merchant' && t !== 'pacific' && rand(state) < 0.05) propose(state, n.id, player.id, 'trade');
  if (rel.state === 'peace' && n.personality === 'treacherous' && t === 'tense' && rand(state) < 0.04) propose(state, n.id, player.id, 'alliance');
  if (rel.state !== 'war' && n.personality === 'conqueror' && t === 'hostile' && mine > theirs * 2.5 && rand(state) < 0.05) propose(state, n.id, player.id, 'tribute-demand', 80);
}

function aiSpy(state: GameState, n: Nation): void {
  if (rand(state) > 0.08) return;
  const tav = state.settlements.find((s) => s.nation === n.id && s.buildings.some((b) => b.type === 'tavern' && b.level > 0));
  if (!tav) return;
  const targets = state.settlements.filter((s) => s.nation !== n.id && (state.nations[s.nation].kind === 'player' || state.nations[s.nation].kind === 'rival') && perceivedTension(state, n.id, s.nation) !== 'pacific');
  if (!targets.length) return;
  const t = targets.sort((a, b) => dist(a.x, a.y, tav.x, tav.y) - dist(b.x, b.y, tav.x, tav.y))[0];
  const price = spyQuote(state, tav.id, t.id) * (n.personality === 'merchant' ? 0.9 : 1.1);
  if (n.gold > price * 2) hireSpy(state, tav.id, t.id, price);
}

export function thinkRival(state: GameState, n: Nation): void {
  const own = state.settlements.filter((s) => s.nation === n.id);
  const danger = state.battles.some((b) => own.some((s) => s.id === b.settlementId));
  for (const s of own) {
    aiBuild(state, s, n);
    aiSmith(state, s);
    aiRecruit(state, s, n, danger);
    aiDefenses(state, s, n);
    aiVocation(state, s, n);
    if (s.tax !== 1 && s.happiness > 40) s.tax = 1;
    if (s.happiness < 30) s.tax = 0;
    s.ration = s.hunger > 0.3 ? 'low' : 'normal';
  }
  aiResearch(state, n);
  if (rand(state) < 0.3) aiExpand(state, n);
  aiWar(state, n);
  aiDiplomacy(state, n);
  aiSpy(state, n);
}

// Comandantes ----------------------------------------------------------------------

/** Exército com comandante decide sozinho conforme a ordem recebida. */
export function thinkCommander(state: GameState, a: Army): void {
  if (a.battleId != null || a.stationedAt != null) return;
  if (a.order === 'defend' || a.order === 'idle') {
    // Intercepta inimigos a até 10 casas da posição a defender.
    const enemy = state.armies.find((e) => e.stationedAt == null && isHostile(state, a.nation, e.nation) && dist(e.x, e.y, a.targetX, a.targetY) < 10 && armySize(e) > 0);
    if (enemy) {
      setPath(state, a, Math.round(enemy.x), Math.round(enemy.y));
      return;
    }
    if (a.order === 'defend' && dist(a.x, a.y, a.targetX, a.targetY) > 1.5 && a.pathIdx >= a.path.length) setPath(state, a, a.targetX, a.targetY);
  }
  if (a.order === 'hunt') {
    const camp = state.settlements
      .filter((s) => s.kind === 'camp' && s.ruinedFor <= 0 && dist(s.x, s.y, a.x, a.y) < 25)
      .sort((p, q) => dist(p.x, p.y, a.x, a.y) - dist(q.x, q.y, a.x, a.y))[0];
    if (camp) orderAttack(state, a.id, camp.id, 'raid');
    else orderReturn(state, a.id);
  }
  if (a.order === 'patrol' && a.pathIdx >= a.path.length) {
    // Vai e volta entre o ponto alvo e a casa.
    const home = settlementById(state, a.homeId);
    if (home) {
      const atTarget = dist(a.x, a.y, a.targetX, a.targetY) < 1.5;
      if (atTarget) setPath(state, a, home.x, home.y);
      else setPath(state, a, a.targetX, a.targetY);
      a.order = 'patrol';
    }
  }
  if (a.order === 'escort') {
    const w = state.travelers.find((t) => t.nation === a.nation && (t.kind === 'wagon' || t.kind === 'caravan' || t.kind === 'colonists'));
    if (w) setPath(state, a, Math.round(w.x), Math.round(w.y));
  }
  // Recua se a tropa estiver quase destruída.
  if (fightingSize(a) < 3 && a.order !== 'return') orderReturn(state, a.id);
}

export function orderPatrol(state: GameState, armyId: number, x: number, y: number): { ok: boolean; reason?: string } {
  const a = armyById(state, armyId);
  if (!a) return { ok: false, reason: 'Exército inválido' };
  if (!setPath(state, a, x, y)) return { ok: false, reason: 'Sem caminho' };
  a.order = 'patrol';
  a.targetX = x;
  a.targetY = y;
  a.autonomous = true;
  return { ok: true };
}

export function orderHunt(state: GameState, armyId: number): { ok: boolean; reason?: string } {
  const a = armyById(state, armyId);
  if (!a) return { ok: false, reason: 'Exército inválido' };
  a.order = 'hunt';
  a.autonomous = true;
  thinkCommander(state, a);
  return { ok: true };
}

export function orderEscort(state: GameState, armyId: number): { ok: boolean; reason?: string } {
  const a = armyById(state, armyId);
  if (!a) return { ok: false, reason: 'Exército inválido' };
  a.order = 'escort';
  a.autonomous = true;
  return { ok: true };
}

// Tribos ---------------------------------------------------------------------------

export function thinkTribe(state: GameState, n: Nation): void {
  const home = settlementById(state, n.capitalId);
  if (!home) return;
  n.tribeCalm += BALANCE.thinkTribe;
  // Cresce quando ninguém a enfrenta.
  if (n.tribeLevel < 3 && n.tribeCalm > (BALANCE.tribeGrowYears + 3 * (n.tribeLevel - 1)) * YEAR_SECONDS) {
    n.tribeLevel++;
    n.tribeCalm = 0;
    home.defenses.wallLevel = Math.max(home.defenses.wallLevel, n.tribeLevel - 1);
    home.defenses.wallHp = home.defenses.wallLevel * 300;
    pushEventIfNear(state, home, `${n.name} cresceu e agora é ${n.tribeLevel === 2 ? 'uma aldeia tribal' : 'uma fortaleza tribal'}.`);
  } else if (n.tribeLevel === 3 && n.vassalOf == null && n.tribeCalm > 10 * YEAR_SECONDS) {
    // Confederação: une tribos fortes vizinhas.
    const allies = state.nations.filter(
      (o) => o.kind === 'tribe' && o.alive && o.id !== n.id && o.tribeLevel >= 2 && o.vassalOf == null && dist(settlementById(state, o.capitalId)?.x ?? 0, settlementById(state, o.capitalId)?.y ?? 0, home.x, home.y) < 40,
    );
    if (allies.length >= 2) {
      n.tribeLevel = 4;
      n.name = n.name.replace('Tribo', 'Confederação');
      for (const o of allies) o.vassalOf = n.id;
      n.tribeCalm = 0;
      pushEvent(state, `As tribos se uniram: nasceu a ${n.name}!`, 'bad', home.x, home.y);
    }
  }
  // Repõe a guarnição devagar.
  const g = garrisonOf(state, home);
  if (g && g.battleId == null) {
    const target = tribalGarrison(n.tribeLevel);
    for (const k in target) {
      const u = k as UnitId;
      if ((g.troops[u] ?? 0) < (target[u] ?? 0)) g.troops[u] = (g.troops[u] ?? 0) + 1;
    }
  }
  // Saqueia vizinhos próximos (nível 2 em diante).
  if (n.tribeLevel < 2 || n.vassalOf != null || !g) return;
  if (state.armies.some((a) => a.nation === n.id && a.stationedAt == null)) return;
  if (rand(state) > 0.25) return;
  const victim = state.settlements
    .filter((s) => (state.nations[s.nation].kind === 'player' || state.nations[s.nation].kind === 'rival') && dist(s.x, s.y, home.x, home.y) < 18)
    .filter((s) => perceivedTension(state, n.id, s.nation) === 'hostile' && state.nations[n.id].vassalOf !== s.nation)
    .sort((a, b) => dist(a.x, a.y, home.x, home.y) - dist(b.x, b.y, home.x, home.y))[0];
  if (!victim) return;
  const send: Troops = {};
  for (const k in g.troops) {
    const c = Math.floor((g.troops[k as UnitId] ?? 0) * 0.4);
    if (c > 0) send[k as UnitId] = c;
  }
  if (troopCount(send) < 4) return;
  const res = formArmy(state, home.id, send, `Saqueadores de ${n.name}`);
  if (!res.ok || res.armyId == null) return;
  declareWar(state, n.id, victim.nation, true);
  orderAttack(state, res.armyId, victim.id, 'raid');
  if (isPlayer(state, victim.nation)) pushEvent(state, `Saqueadores de ${n.name} vêm em direção a ${victim.name}!`, 'bad', victim.x, victim.y);
}

function pushEventIfNear(state: GameState, s: Settlement, text: string): void {
  if (rt(state).explored[idx(s.x, s.y)]) pushEvent(state, text, 'info', s.x, s.y);
}

/** Influência cultural do jogador pode converter tribos pacíficas. */
export function cultureConversion(state: GameState): void {
  const p = state.playerNation;
  for (const n of state.nations) {
    if (n.kind !== 'tribe' || !n.alive || n.vassalOf != null) continue;
    const home = settlementById(state, n.capitalId);
    if (!home) continue;
    if (relation(state, p, n.id).state === 'war') continue;
    let influence = 0;
    for (const s of state.settlements) if (s.nation === p) influence += s.culture * Math.max(0, 1 - dist(s.x, s.y, home.x, home.y) / 30);
    if (influence > 25 * n.tribeLevel && !state.letters.some((l) => l.proposal?.type === 'vassal' && l.proposal.from === n.id && !l.read)) {
      // A tribo pede para se juntar ao reino.
      propose(state, n.id, p, 'vassal');
      const last = state.letters[state.letters.length - 1];
      if (last?.proposal) {
        last.proposal = { type: 'vassal-join', from: n.id, to: p };
        last.subject = `${n.name} quer se juntar ao seu reino`;
        last.body = 'A fama da sua cultura chegou até nós. Aceitamos servir como vassalos.';
      }
    }
  }
}

// Bandidos -------------------------------------------------------------------------

export function thinkBandits(state: GameState, n: Nation): void {
  for (const s of state.settlements) {
    if (s.nation !== n.id || s.ruinedFor > 0) continue;
    const g = garrisonOf(state, s);
    if (!g || g.battleId != null) continue;
    const target = banditGarrison(s.loyalty);
    if ((g.troops.brigand ?? 0) < (target.brigand ?? 0)) g.troops.brigand = (g.troops.brigand ?? 0) + 1;
    // De vez em quando, um bando sai para assaltar estradas e aldeias fracas.
    if (rand(state) < 0.06 && (g.troops.brigand ?? 0) >= 6 && !state.armies.some((a) => a.nation === n.id && a.homeId === s.id && a.stationedAt == null)) {
      const victim = state.settlements
        .filter((o) => o.nation !== n.id && o.kind !== 'camp' && dist(o.x, o.y, s.x, s.y) < 14 && state.time > 900)
        .filter((o) => {
          const og = garrisonOf(state, o);
          return !og || fightingSize(og) < 8;
        })
        .sort((a, b) => dist(a.x, a.y, s.x, s.y) - dist(b.x, b.y, s.x, s.y))[0];
      const res = formArmy(state, s.id, { brigand: Math.floor((g.troops.brigand ?? 0) / 2) }, `Bando de ${s.name}`);
      if (!res.ok || res.armyId == null) continue;
      if (victim) {
        orderAttack(state, res.armyId, victim.id, 'raid');
        if (isPlayer(state, victim.nation)) pushEvent(state, `Bandidos vêm saquear ${victim.name}!`, 'bad', victim.x, victim.y);
      } else {
        // Fica rondando a estrada mais próxima.
        const road = state.roads.find((i) => dist(i % MAP_SIZE, Math.floor(i / MAP_SIZE), s.x, s.y) < 12);
        if (road != null) orderMove(state, res.armyId, road % MAP_SIZE, Math.floor(road / MAP_SIZE));
        else {
          const a = armyById(state, res.armyId);
          if (a) removeArmyBack(state, a, s);
        }
      }
    }
  }
  // Bandos parados há muito tempo voltam ao covil.
  for (const a of state.armies) {
    if (a.nation !== n.id || a.stationedAt != null || a.battleId != null) continue;
    if (a.order === 'idle' || a.order === 'move') {
      if (rand(state) < 0.1) orderReturn(state, a.id);
    }
  }
}

function removeArmyBack(state: GameState, a: Army, s: Settlement): void {
  const g = garrisonOf(state, s);
  if (g) for (const k in a.troops) g.troops[k as UnitId] = (g.troops[k as UnitId] ?? 0) + (a.troops[k as UnitId] ?? 0);
  removeArmy(state, a);
}

// Hordas do mar --------------------------------------------------------------------

const HORDE_TYPES = ['nordic', 'steppe', 'mercenary'] as const;
export const HORDE_NAMES: Record<string, string> = { nordic: 'Nórdicos', steppe: 'Cavaleiros das estepes', mercenary: 'Mercenários' };

export function hordeArmy(wave: number, emperor: boolean): Troops {
  const type = HORDE_TYPES[(wave - 1) % 3];
  const size = 8 * Math.pow(BALANCE.hordeGrowth, wave - 1) * (emperor ? BALANCE.emperorHordeMultiplier : 1);
  const t: Troops = {};
  if (type === 'nordic') {
    t.northman = Math.round(size * 0.8);
    t.mercenary = Math.round(size * 0.2);
  } else if (type === 'steppe') {
    t.steppeRider = Math.round(size * 0.8);
    t.northman = Math.round(size * 0.2);
  } else {
    t.mercenary = Math.round(size);
    t.ram = Math.max(1, Math.round(size / 12));
    t.catapult = Math.round(size / 18);
    t.ladder = Math.round(size / 10);
  }
  if (wave % BALANCE.hordeBossEvery === 0) t.warlord = 1;
  return t;
}

/** Casa de terra na costa mais próxima de um alvo, e um ponto no mar ao largo dela. */
function landingFor(target: Settlement): { land: number; sea: { x: number; y: number } } | null {
  const m = getMap();
  let best = -1;
  let bd = Infinity;
  for (let oy = -30; oy <= 30; oy++) {
    for (let ox = -30; ox <= 30; ox++) {
      const x = target.x + ox;
      const y = target.y + oy;
      if (!inBounds(x, y)) continue;
      const i = idx(x, y);
      if (m.coast[i] !== 1 || !isBuildable(m, i)) continue;
      const d = ox * ox + oy * oy;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
  }
  if (best < 0) return null;
  const lx = best % MAP_SIZE;
  const ly = Math.floor(best / MAP_SIZE);
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const ang = Math.atan2(ly - cy, lx - cx);
  let sx = lx;
  let sy = ly;
  for (let r = 1; r < 200; r++) {
    const x = Math.round(lx + Math.cos(ang) * r);
    const y = Math.round(ly + Math.sin(ang) * r);
    if (!inBounds(x, y)) break;
    sx = x;
    sy = y;
    if (m.base[idx(x, y)] === BASE_SEA && r > 25) break;
  }
  return { land: best, sea: { x: sx, y: sy } };
}

export function launchHordeWave(state: GameState): void {
  const horde = state.nations.find((n) => n.kind === 'horde')!;
  state.hordes.wave++;
  const wave = state.hordes.wave;
  const emperor = state.nations.some((n) => n.emperor);
  const candidates = state.settlements.filter((s) => s.kind !== 'camp' && s.ruinedFor <= 0 && state.nations[s.nation].kind !== 'horde');
  if (!candidates.length) return;
  // Incursões: de vez em quando a horda mira uma cidade do interior.
  const interior = rand(state) < 0.2;
  const weighted = candidates.filter((s) => (interior ? s.zone === 'center' : true) && (state.nations[s.nation].kind === 'player' ? true : rand(state) < 0.6));
  const pool = weighted.length ? weighted : candidates;
  const target = pool[Math.floor(rand(state) * pool.length)];
  const landing = landingFor(target);
  if (!landing) return;
  const troops = hordeArmy(wave, emperor);
  newTraveler(state, {
    kind: 'ship',
    nation: horde.id,
    x: landing.sea.x,
    y: landing.sea.y,
    speed: 0.6,
    path: [],
    toId: landing.land,
    fromId: target.id,
    armyTroops: troops,
    wave,
  });
  const type = HORDE_NAMES[HORDE_TYPES[(wave - 1) % 3]];
  for (const n of state.nations) {
    if (n.kind !== 'player') continue;
    const near = state.settlements.some((s) => s.nation === n.id && dist(s.x, s.y, landing.land % MAP_SIZE, Math.floor(landing.land / MAP_SIZE)) < 40);
    pushEvent(state, `Velas no horizonte! A onda ${wave} da horda (${type}${troops.warlord ? ', com um chefe' : ''}) navega rumo a ${target.name}.`, near ? 'bad' : 'info', landing.land % MAP_SIZE, Math.floor(landing.land / MAP_SIZE));
  }
}

export function shipArrived(state: GameState, t: GameState['travelers'][number]): boolean {
  const target = settlementById(state, t.fromId);
  const x = t.toId % MAP_SIZE;
  const y = Math.floor(t.toId / MAP_SIZE);
  const a = newArmy(state, t.nation, x, y, t.armyTroops ?? {}, -1, null, `Horda da onda ${t.wave}`);
  a.wave = t.wave;
  a.morale = 90;
  if (target && target.ruinedFor <= 0) orderAttack(state, a.id, target.id, 'raid');
  return true;
}

export function tickHordes(state: GameState, dt: number): void {
  if (state.era < 2 && state.time < BALANCE.hordeFirstWave * 2) return;
  state.hordes.nextIn -= dt;
  if (state.hordes.nextIn <= 0) {
    state.hordes.nextIn += BALANCE.hordeInterval;
    launchHordeWave(state);
  }
}

// Agenda de pensamento ---------------------------------------------------------------

export function tickAI(state: GameState, dt: number): void {
  for (const n of state.nations) {
    if (!n.alive || n.kind === 'player' || n.kind === 'horde') continue;
    n.thinkIn -= dt;
    if (n.thinkIn > 0) continue;
    if (n.kind === 'rival') {
      n.thinkIn += BALANCE.thinkRival;
      thinkRival(state, n);
    } else if (n.kind === 'tribe') {
      n.thinkIn += BALANCE.thinkTribe;
      thinkTribe(state, n);
    } else if (n.kind === 'bandit') {
      n.thinkIn += BALANCE.thinkBandit;
      thinkBandits(state, n);
    }
  }
  for (const a of state.armies) {
    if (!a.autonomous || a.stationedAt != null) continue;
    a.thinkIn -= dt;
    if (a.thinkIn > 0) continue;
    a.thinkIn += BALANCE.thinkCommander;
    thinkCommander(state, a);
  }
}
