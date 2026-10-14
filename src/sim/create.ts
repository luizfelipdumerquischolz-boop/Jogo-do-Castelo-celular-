import { BALANCE } from './data/balance';
import type { BuildingId, DepositType, SettlementKind } from './data/buildings';
import type { Stock } from './data/items';
import { BANDIT_COLOR, HORDE_COLOR, PLAYER_COLOR, RIVALS, TRIBE_COLOR, banditName, heroName, placeName, tribeName } from './data/names';
import type { Troops } from './data/units';
import {
  BASE_SEA,
  MAP_SIZE,
  REGION_CRADLE,
  REGION_NEAR,
  REGION_WILD,
  RELIEF_HILL,
  RELIEF_MOUNTAIN,
  RIVER_NONE,
  getMap,
  idx,
  inBounds,
  isBuildable,
} from './map';
import { encodeBits, markTerritoryDirty, reindex, rt } from './runtime';
import { FRAME, DEFAULT_PRIORITIES, gridSizeFor, wallMaxHp, gateMaxHp } from './settlement';
import type { Army, GameState, Hero, Nation, NationKind, Personality, Settlement, SettlementKindAny } from './types';
import { initialAges, newId } from './util';
import { rand } from './rng';
import { MISSIONS } from './missions';

export const SAVE_VERSION = 2;

const PERSONALITIES: Personality[] = ['conqueror', 'merchant', 'builder', 'treacherous', 'cautious'];
export const PERSONALITY_NAMES: Record<Personality, string> = {
  conqueror: 'Conquistador',
  merchant: 'Mercador',
  builder: 'Construtor',
  treacherous: 'Traiçoeiro',
  cautious: 'Cauteloso',
};

function newNation(state: GameState, kind: NationKind, name: string, ruler: string, color: string, personality: Personality | null): Nation {
  const n: Nation = {
    id: state.nations.length,
    kind,
    name,
    ruler,
    color,
    personality,
    capitalId: null,
    gold: kind === 'player' || kind === 'rival' ? 300 : 0,
    research: { done: [], current: null, progress: 0 },
    alive: true,
    knowledge: {},
    counterIntel: 0,
    reputation: 0,
    tribeLevel: 1,
    tribeCalm: 0,
    vassalOf: null,
    thinkIn: 3 + state.nations.length * 1.7,
    emperor: false,
  };
  state.nations.push(n);
  return n;
}

export function newArmy(state: GameState, nation: number, x: number, y: number, troops: Troops, homeId: number, stationedAt: number | null, name = ''): Army {
  const a: Army = {
    id: newId(state),
    nation,
    name,
    x,
    y,
    troops: { ...troops },
    xp: 0,
    morale: 70,
    food: 0,
    homeId,
    stationedAt,
    path: [],
    pathIdx: 0,
    order: 'idle',
    targetId: null,
    targetX: x,
    targetY: y,
    commanderId: null,
    autonomous: false,
    battleId: null,
    formation: 'balanced',
    wave: 0,
    loot: {},
    lootGold: 0,
    thinkIn: 2,
    starving: 0,
  };
  state.armies.push(a);
  return a;
}

export function newSettlement(
  state: GameState,
  nation: number,
  kind: SettlementKindAny,
  x: number,
  y: number,
  name: string,
  people: number,
): Settlement {
  const s: Settlement = {
    id: newId(state),
    name,
    nation,
    kind,
    x,
    y,
    gridSize: 8,
    buildings: [],
    stock: {},
    ages: initialAges(people),
    birthAcc: 0,
    deathAcc: 0,
    priorities: [...DEFAULT_PRIORITIES],
    ration: 'normal',
    tax: 1,
    vocation: null,
    vocationSwitch: null,
    districts: kind === 'capital' ? [0, 1, 2, 3].map(() => ({ vocation: null, level: 0 })) : [],
    happiness: 60,
    health: 0.8,
    loyalty: kind === 'capital' ? 100 : 60,
    culture: 0,
    morale: 60,
    diet: { energy: 0.6, protein: 0.2, vitamins: 0.2, pleasure: 0 },
    dietVariety: 2,
    hunger: 0,
    noVitamins: 0,
    sick: 0,
    outbreak: 0,
    defenses: { wallLevel: 0, wallHp: 0, gateLevel: 0, gateHp: 0, towers: 0, moat: false, oil: false, stakes: false, pits: false },
    garrisonId: 0,
    trainQueue: [],
    siegeQueue: [],
    consulId: null,
    zone: 'center',
    foreignDistance: 999,
    modifiers: { bumperUntil: 0, blightUntil: 0, ratsAt: 0 },
    wounded: [],
    ruinedFor: 0,
    lastNotice: {},
    taxIncome: 0,
    revolt: false,
    foundedAt: state.time,
  };
  state.settlements.push(s);
  const g = newArmy(state, nation, x, y, {}, s.id, s.id, `Guarnição de ${name}`);
  s.garrisonId = g.id;
  markTerritoryDirty(state);
  return s;
}

export function addBuilding(state: GameState, s: Settlement, type: BuildingId, x: number, y: number, level = 1): void {
  s.buildings.push({ id: newId(state), type, x, y, level, build: null, workers: 0, recipeWeights: {}, stalled: 0, efficiency: 0 });
}

/** Layout inicial de uma capital (coordenadas na moldura de 24×24). */
const CAPITAL_START: [BuildingId, number, number][] = [
  ['keep', 10, 10],
  ['house', 8, 8],
  ['house', 9, 8],
  ['house', 8, 9],
  ['house', 13, 8],
  ['house', 7, 8],
  ['house', 7, 9],
  ['house', 9, 9],
  ['house', 8, 10],
  ['wheat_farm', 6, 14],
  ['mill', 9, 14],
  ['bakery', 11, 14],
  ['vegetable_garden', 12, 14],
  ['sawmill', 14, 10],
  ['storehouse', 14, 13],
  ['well', 13, 9],
];

export function setupCapital(state: GameState, s: Settlement, rich = false): void {
  for (const [t, x, y] of CAPITAL_START) addBuilding(state, s, t, x, y);
  s.gridSize = gridSizeFor(s);
  const stock: Stock = {
    wood: 350,
    stone: 300,
    wheat: 80,
    flour: 40,
    bread: 160,
    vegetables: 80,
    porridge: 30,
    eggs: 20,
    weapon: 12,
    bow: 4,
    iron: 20,
  };
  if (rich) for (const k in stock) stock[k as keyof Stock] = Math.round((stock[k as keyof Stock] ?? 0) * 1.3);
  s.stock = stock;
  s.defenses.wallLevel = 1;
  s.defenses.wallHp = wallMaxHp(state, 1, s.nation);
  s.defenses.gateLevel = 1;
  s.defenses.gateHp = gateMaxHp(1);
}

function setupTribal(state: GameState, s: Settlement, level: number): void {
  s.defenses.wallLevel = level >= 2 ? level - 1 : 0;
  s.defenses.wallHp = s.defenses.wallLevel * 300;
  s.defenses.gateLevel = s.defenses.wallLevel;
  s.defenses.gateHp = s.defenses.gateLevel * 200;
  const g = state.armies.find((a) => a.id === s.garrisonId)!;
  g.troops = tribalGarrison(level);
  s.stock = { wood: 60 * level, stone: 30 * level, meat: 40 * level, bread: 20 * level, iron: 10 * level, leather: 10 * level };
}

export function tribalGarrison(level: number): Troops {
  const f = [0, 1, 2.4, 4.5, 8][level] ?? 1;
  return { axeman: Math.round(6 * f), hunter: Math.round(4 * f), tribalRider: Math.round((level >= 2 ? 2 : 0) * f) };
}

export function banditGarrison(strength: number): Troops {
  return { brigand: Math.round(5 + strength * 4) };
}

export function banditLoot(strength: number): Stock {
  return { wood: 60 + 40 * strength, stone: 30 + 20 * strength, bread: 40 + 20 * strength, iron: 5 + 8 * strength, weapon: Math.round(strength) };
}

export function randomHero(state: GameState): Hero {
  const traitsPool = ['cauteloso', 'ousado', 'bom em cerco', 'protetor', 'administrador', 'general', 'mercador', 'honesto', 'corrupto'];
  const t1 = traitsPool[Math.floor(rand(state) * traitsPool.length)];
  let t2 = traitsPool[Math.floor(rand(state) * traitsPool.length)];
  if (t2 === t1) t2 = traitsPool[(traitsPool.indexOf(t1) + 3) % traitsPool.length];
  const level = 1 + Math.floor(rand(state) * 3);
  return {
    id: newId(state),
    name: heroName(rand(state), rand(state)),
    nation: -1,
    role: 'none',
    traits: [t1, t2],
    level,
    xp: 0,
    wage: 8 + level * 4,
    hirePrice: 60 + level * 40,
    assignedTo: null,
    equipment: [],
    captiveOf: null,
  };
}

function shuffle<T>(state: GameState, list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(state) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function farEnough(points: { x: number; y: number }[], x: number, y: number, d: number): boolean {
  return points.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 >= d * d);
}

function placeDeposits(state: GameState): void {
  const m = getMap();
  const add = (type: DepositType, x: number, y: number, amount: number) =>
    state.deposits.push({ id: newId(state), type, x, y, amount, max: amount });
  const hillish = (i: number) => m.relief[i] === RELIEF_HILL || neighborMountain(i);
  const neighborMountain = (i: number) => {
    const x = i % MAP_SIZE;
    const y = (i / MAP_SIZE) | 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (inBounds(x + ox, y + oy) && m.relief[idx(x + ox, y + oy)] === RELIEF_MOUNTAIN) return true;
    return false;
  };
  const nearRiver = (x: number, y: number) => {
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) if (inBounds(x + ox, y + oy) && m.river[idx(x + ox, y + oy)] !== RIVER_NONE) return true;
    return false;
  };
  // Justiça: cada berço recebe o básico.
  m.cradles.forEach((c) => {
    const ring = (rmin: number, rmax: number, ok: (i: number) => boolean) => {
      for (let tries = 0; tries < 400; tries++) {
        const a = rand(state) * Math.PI * 2;
        const r = rmin + rand(state) * (rmax - rmin);
        const x = Math.round(c.x + Math.cos(a) * r);
        const y = Math.round(c.y + Math.sin(a) * r);
        if (!inBounds(x, y)) continue;
        const i = idx(x, y);
        if (m.base[i] === BASE_SEA || m.relief[i] === RELIEF_MOUNTAIN || m.river[i]) continue;
        if (!ok(i)) continue;
        if (state.deposits.some((d) => d.x === x && d.y === y)) continue;
        return { x, y };
      }
      return { x: c.x + Math.round(rmin), y: c.y };
    };
    for (let k = 0; k < 2; k++) {
      const p = ring(3, 6, () => true);
      add('stone', p.x, p.y, 4000);
    }
    for (let k = 0; k < 2; k++) {
      const p = ring(4, 6.5, () => true);
      add('iron', p.x, p.y, 3000);
    }
    for (let k = 0; k < 2; k++) {
      const p = ring(2, 6, () => true);
      add('fertile', p.x, p.y, 1e9);
    }
  });
  // Resto do mapa, com coerência de terreno e raridade crescente para fora.
  for (let tries = 0; tries < 6000; tries++) {
    const x = 8 + Math.floor(rand(state) * (MAP_SIZE - 16));
    const y = 8 + Math.floor(rand(state) * (MAP_SIZE - 16));
    const i = idx(x, y);
    if (m.base[i] === BASE_SEA || m.relief[i] === RELIEF_MOUNTAIN || m.river[i]) continue;
    if (state.deposits.some((d) => Math.abs(d.x - x) + Math.abs(d.y - y) < 6)) continue;
    const reg = m.region[i];
    const roll = rand(state);
    if (hillish(i)) {
      if (reg === REGION_WILD && roll < 0.18) add('diamond', x, y, 900);
      else if (reg !== REGION_CRADLE && roll < 0.45) add('gold', x, y, 1500);
      else if (roll < 0.75) add('iron', x, y, 3000);
      else add('stone', x, y, 4000);
    } else if (nearRiver(x, y) && roll < 0.5) add('fertile', x, y, 1e9);
    else if (m.coast[i] && roll < 0.3) add('fish', x, y, 1e9);
    else if (roll < 0.06) add('stone', x, y, 3000);
    if (state.deposits.length > 260) break;
  }
}

export function createGame(seed = 1234, kingdomName = 'Reino de Valmor', capitalName = 'Valmor'): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    seed,
    time: 0,
    rng: (seed * 2654435761) >>> 0,
    nextId: 1,
    playerNation: 0,
    kingdomName,
    nations: [],
    relations: {},
    settlements: [],
    armies: [],
    battles: [],
    travelers: [],
    routes: [],
    letters: [],
    heroes: [],
    spyMissions: [],
    deposits: [],
    roads: [],
    bridges: [],
    forestCut: [],
    explored: '',
    reports: [],
    events: [],
    era: 1,
    hordes: { wave: 0, nextIn: BALANCE.hordeFirstWave },
    missions: MISSIONS.map((mm) => ({ id: mm.id, text: mm.text, done: false, reward: mm.reward })),
    victory: { achieved: false, at: 0, secret: false },
    defeated: false,
    prisoners: [],
    stats: {},
  };
  const m = getMap();

  // Nações
  const player = newNation(state, 'player', kingdomName, 'Você', PLAYER_COLOR, null);
  const pers = shuffle(state, PERSONALITIES).slice(0, 4);
  const rivals = shuffle(state, RIVALS).map((t, i) => newNation(state, 'rival', t.nation, t.ruler, t.color, pers[i]));

  // Capitais
  const pc = newSettlement(state, player.id, 'capital', m.cradles[0].x, m.cradles[0].y, capitalName, 80);
  setupCapital(state, pc);
  player.capitalId = pc.id;
  const pg = state.armies.find((a) => a.id === pc.garrisonId)!;
  pg.troops = { spearman: 8, archer: 4 };
  rivals.forEach((n, k) => {
    const c = m.cradles[k + 1];
    const tmpl = RIVALS.find((r) => r.nation === n.name)!;
    const s = newSettlement(state, n.id, 'capital', c.x, c.y, tmpl.capital, 80);
    setupCapital(state, s, true);
    n.capitalId = s.id;
    const g = state.armies.find((a) => a.id === s.garrisonId)!;
    g.troops = { spearman: 10, archer: 5 };
  });

  placeDeposits(state);

  // Tribos bárbaras nas terras próximas e selvagens.
  const used: { x: number; y: number }[] = m.cradles.map((c) => ({ x: c.x, y: c.y }));
  const tribeSpots: { x: number; y: number; reg: number }[] = [];
  for (let tries = 0; tries < 8000 && tribeSpots.length < 22; tries++) {
    const x = 10 + Math.floor(rand(state) * (MAP_SIZE - 20));
    const y = 10 + Math.floor(rand(state) * (MAP_SIZE - 20));
    const i = idx(x, y);
    if (!isBuildable(m, i) || m.region[i] === REGION_CRADLE || m.pass[i]) continue;
    if (!farEnough(used, x, y, 15)) continue;
    if (!farEnough(m.cradles, x, y, 30)) continue;
    tribeSpots.push({ x, y, reg: m.region[i] });
    used.push({ x, y });
  }
  for (const t of tribeSpots) {
    const level = t.reg === REGION_NEAR ? 1 + (rand(state) < 0.4 ? 1 : 0) : 2 + (rand(state) < 0.35 ? 1 : 0);
    let tname = tribeName(rand(state), rand(state));
    for (let k = 0; k < 20 && state.nations.some((n) => n.name === tname); k++) tname = tribeName(rand(state), rand(state));
    const tn = newNation(state, 'tribe', tname, 'Chefe tribal', TRIBE_COLOR, null);
    tn.tribeLevel = level;
    tn.thinkIn = 5 + rand(state) * BALANCE.thinkTribe;
    const s = newSettlement(state, tn.id, 'tribal', t.x, t.y, tn.name.replace('Tribo do ', ''), 20 + level * 15);
    tn.capitalId = s.id;
    setupTribal(state, s, level);
    // Fortalezas tribais guardam depósitos raros.
    if (level >= 3 && !state.deposits.some((d) => d.type === 'diamond' && Math.hypot(d.x - t.x, d.y - t.y) < 8)) {
      const dx = t.x + 3;
      const dy = t.y + 2;
      if (inBounds(dx, dy) && m.base[idx(dx, dy)] !== BASE_SEA) state.deposits.push({ id: newId(state), type: 'diamond', x: dx, y: dy, amount: 900, max: 900 });
    }
  }

  // Bandidos espalhados por todo o mapa, inclusive dois fracos em cada berço.
  const bandits = newNation(state, 'bandit', 'Bandidos', 'Ninguém', BANDIT_COLOR, null);
  const camps: { x: number; y: number; strength: number }[] = [];
  m.cradles.forEach((c) => {
    let placed = 0;
    for (let tries = 0; tries < 300 && placed < 2; tries++) {
      const a = rand(state) * Math.PI * 2;
      const r = 13 + rand(state) * 9;
      const x = Math.round(c.x + Math.cos(a) * r);
      const y = Math.round(c.y + Math.sin(a) * r);
      if (!inBounds(x, y) || !isBuildable(m, idx(x, y)) || !farEnough(used, x, y, 6)) continue;
      camps.push({ x, y, strength: 0.5 + placed * 0.5 });
      used.push({ x, y });
      placed++;
    }
  });
  for (let tries = 0; tries < 6000 && camps.length < 40; tries++) {
    const x = 10 + Math.floor(rand(state) * (MAP_SIZE - 20));
    const y = 10 + Math.floor(rand(state) * (MAP_SIZE - 20));
    const i = idx(x, y);
    if (!isBuildable(m, i) || !farEnough(used, x, y, 10) || !farEnough(m.cradles, x, y, 24)) continue;
    camps.push({ x, y, strength: m.region[i] === REGION_WILD ? 2.5 : 1.5 });
    used.push({ x, y });
  }
  for (const c of camps) {
    const s = newSettlement(state, bandits.id, 'camp', c.x, c.y, banditName(rand(state), rand(state)), 0);
    s.ages = new Array(BALANCE.maxAge + 1).fill(0);
    const g = state.armies.find((a) => a.id === s.garrisonId)!;
    g.troops = banditGarrison(c.strength);
    s.stock = banditLoot(c.strength);
    s.vocation = null;
    s.loyalty = c.strength;
  }

  newNation(state, 'horde', 'Hordas do Mar', 'Senhores da guerra', HORDE_COLOR, null);

  // Heróis na taverna
  for (let i = 0; i < 4; i++) state.heroes.push(randomHero(state));

  // Exploração inicial: o berço do jogador.
  const r = rt(state);
  for (let oy = -18; oy <= 18; oy++) {
    for (let ox = -18; ox <= 18; ox++) {
      const x = pc.x + ox;
      const y = pc.y + oy;
      if (inBounds(x, y) && ox * ox + oy * oy <= 18 * 18) r.explored[idx(x, y)] = 1;
    }
  }
  state.explored = encodeBits(r.explored);
  reindex(state);
  void FRAME;
  return state;
}

export function settlementKindLabel(kind: SettlementKind | 'camp' | 'tribal', tribeLevel = 1): string {
  if (kind === 'camp') return 'Acampamento de bandidos';
  if (kind === 'tribal') return ['Acampamento tribal', 'Acampamento tribal', 'Aldeia tribal', 'Fortaleza tribal', 'Confederação'][tribeLevel] ?? 'Tribo';
  return { capital: 'Capital', city: 'Cidade', village: 'Aldeia', castle: 'Castelo', outpost: 'Entreposto' }[kind];
}

export function randomPlaceName(state: GameState): string {
  return placeName(rand(state), rand(state), rand(state));
}

export { REGION_WILD };
