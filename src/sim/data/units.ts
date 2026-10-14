import type { Stock } from './items';

export type UnitId =
  | 'spearman'
  | 'archer'
  | 'knight'
  | 'shieldman'
  | 'crossbowman'
  | 'scout'
  | 'horseArcher'
  | 'heavyKnight'
  | 'ram'
  | 'catapult'
  | 'ladder'
  | 'siegeTower'
  // tribos
  | 'axeman'
  | 'hunter'
  | 'tribalRider'
  // bandidos
  | 'brigand'
  // hordas
  | 'northman'
  | 'steppeRider'
  | 'mercenary'
  | 'warlord'
  | 'militia';

export type UnitClass = 'infantry' | 'ranged' | 'cavalry' | 'siege';
export type Recruiter = 'barracks' | 'siege_workshop' | 'none';

export interface UnitDef {
  id: UnitId;
  name: string;
  plural: string;
  description: string;
  cls: UnitClass;
  attack: number;
  defense: number;
  hp: number;
  /** Casas por segundo. */
  speed: number;
  carry: number;
  /** Comida por minuto. */
  upkeep: number;
  cost: Stock;
  gold: number;
  /** Cidadãos adultos consumidos (0 para máquinas de cerco operadas pela tropa). */
  people: number;
  trainTime: number;
  recruiter: Recruiter;
  /** Nível mínimo do quartel/oficina. */
  minLevel: number;
  strong: UnitId[];
  weak: UnitId[];
  /** Pode ser recrutada pelo jogador e pelas nações. */
  playable: boolean;
  /** Dano extra contra muralha e portão. */
  siegeDamage?: { gate?: number; wall?: number };
  /** Pesquisa necessária. */
  research?: string;
}

const LIST: UnitDef[] = [
  {
    id: 'spearman',
    name: 'Lanceiro',
    plural: 'Lanceiros',
    description: 'Infantaria barata com lança longa. Segura a cavalaria.',
    cls: 'infantry',
    attack: 8,
    defense: 14,
    hp: 30,
    speed: 0.25,
    carry: 12,
    upkeep: 0.3,
    cost: { weapon: 1 },
    gold: 3,
    people: 1,
    trainTime: 12,
    recruiter: 'barracks',
    minLevel: 1,
    strong: ['knight', 'horseArcher', 'tribalRider', 'steppeRider'],
    weak: ['archer', 'hunter'],
    playable: true,
  },
  {
    id: 'archer',
    name: 'Arqueiro',
    plural: 'Arqueiros',
    description: 'Atira de longe. Desfaz formações de infantaria.',
    cls: 'ranged',
    attack: 12,
    defense: 8,
    hp: 22,
    speed: 0.25,
    carry: 8,
    upkeep: 0.3,
    cost: { bow: 1 },
    gold: 4,
    people: 1,
    trainTime: 14,
    recruiter: 'barracks',
    minLevel: 1,
    strong: ['spearman', 'axeman', 'brigand'],
    weak: ['knight', 'shieldman', 'tribalRider'],
    playable: true,
  },
  {
    id: 'knight',
    name: 'Cavaleiro',
    plural: 'Cavaleiros',
    description: 'Carga veloz que esmaga arqueiros.',
    cls: 'cavalry',
    attack: 20,
    defense: 12,
    hp: 45,
    speed: 0.45,
    carry: 25,
    upkeep: 0.6,
    cost: { horse: 1, weapon: 1, armor: 1 },
    gold: 12,
    people: 1,
    trainTime: 25,
    recruiter: 'barracks',
    minLevel: 2,
    strong: ['archer', 'hunter', 'crossbowman'],
    weak: ['spearman', 'crossbowman'],
    playable: true,
  },
  {
    id: 'shieldman',
    name: 'Escudeiro',
    plural: 'Escudeiros',
    description: 'Parede de escudos: aguenta flechas.',
    cls: 'infantry',
    attack: 7,
    defense: 18,
    hp: 40,
    speed: 0.22,
    carry: 10,
    upkeep: 0.35,
    cost: { shield: 1, armor: 1 },
    gold: 6,
    people: 1,
    trainTime: 18,
    recruiter: 'barracks',
    minLevel: 2,
    strong: ['archer', 'hunter'],
    weak: ['crossbowman', 'knight', 'axeman'],
    playable: true,
  },
  {
    id: 'crossbowman',
    name: 'Besteiro',
    plural: 'Besteiros',
    description: 'Virotes atravessam armaduras e escudos.',
    cls: 'ranged',
    attack: 16,
    defense: 10,
    hp: 26,
    speed: 0.22,
    carry: 8,
    upkeep: 0.35,
    cost: { crossbow: 1 },
    gold: 8,
    people: 1,
    trainTime: 20,
    recruiter: 'barracks',
    minLevel: 3,
    strong: ['knight', 'shieldman', 'heavyKnight', 'northman'],
    weak: ['spearman', 'tribalRider'],
    playable: true,
    research: 'crossbows',
  },
  {
    id: 'scout',
    name: 'Batedor',
    plural: 'Batedores',
    description: 'Explora a névoa, caça carroças e mensageiros. Não luta bem.',
    cls: 'cavalry',
    attack: 4,
    defense: 4,
    hp: 20,
    speed: 0.7,
    carry: 5,
    upkeep: 0.4,
    cost: { horse: 1 },
    gold: 3,
    people: 1,
    trainTime: 12,
    recruiter: 'barracks',
    minLevel: 1,
    strong: [],
    weak: ['spearman', 'archer', 'knight', 'shieldman', 'crossbowman'],
    playable: true,
  },
  {
    id: 'horseArcher',
    name: 'Arqueiro montado',
    plural: 'Arqueiros montados',
    description: 'Atira a cavalo e foge antes do contato.',
    cls: 'cavalry',
    attack: 14,
    defense: 9,
    hp: 32,
    speed: 0.5,
    carry: 15,
    upkeep: 0.6,
    cost: { horse: 1, bow: 1 },
    gold: 10,
    people: 1,
    trainTime: 24,
    recruiter: 'barracks',
    minLevel: 4,
    strong: ['spearman', 'axeman', 'shieldman'],
    weak: ['archer', 'crossbowman'],
    playable: true,
    research: 'horse_archery',
  },
  {
    id: 'heavyKnight',
    name: 'Cavaleiro pesado',
    plural: 'Cavaleiros pesados',
    description: 'Aço da cabeça aos cascos. Caro e lento, mas quase imparável.',
    cls: 'cavalry',
    attack: 34,
    defense: 28,
    hp: 80,
    speed: 0.35,
    carry: 20,
    upkeep: 0.9,
    cost: { horse: 1, steelWeapon: 1, steelArmor: 1 },
    gold: 40,
    people: 1,
    trainTime: 45,
    recruiter: 'barracks',
    minLevel: 5,
    strong: ['spearman', 'archer', 'knight', 'shieldman', 'axeman', 'northman'],
    weak: ['crossbowman'],
    playable: true,
    research: 'heavy_cavalry',
  },
  {
    id: 'ram',
    name: 'Aríete',
    plural: 'Aríetes',
    description: 'Derruba portões.',
    cls: 'siege',
    attack: 2,
    defense: 20,
    hp: 120,
    speed: 0.15,
    carry: 0,
    upkeep: 0,
    cost: { wood: 60, leather: 10 },
    gold: 10,
    people: 0,
    trainTime: 40,
    recruiter: 'siege_workshop',
    minLevel: 1,
    strong: [],
    weak: ['knight', 'heavyKnight'],
    playable: true,
    siegeDamage: { gate: 25 },
  },
  {
    id: 'catapult',
    name: 'Catapulta',
    plural: 'Catapultas',
    description: 'Arremessa pedras na muralha e nas construções.',
    cls: 'siege',
    attack: 4,
    defense: 6,
    hp: 80,
    speed: 0.12,
    carry: 0,
    upkeep: 0,
    cost: { wood: 80, stone: 40 },
    gold: 15,
    people: 0,
    trainTime: 50,
    recruiter: 'siege_workshop',
    minLevel: 2,
    strong: [],
    weak: ['knight', 'heavyKnight'],
    playable: true,
    siegeDamage: { wall: 18, gate: 6 },
  },
  {
    id: 'ladder',
    name: 'Escada de cerco',
    plural: 'Escadas de cerco',
    description: 'Cada escada leva até 10 soldados por cima da muralha, enfraquecidos.',
    cls: 'siege',
    attack: 0,
    defense: 2,
    hp: 20,
    speed: 0.2,
    carry: 0,
    upkeep: 0,
    cost: { wood: 25 },
    gold: 2,
    people: 0,
    trainTime: 15,
    recruiter: 'siege_workshop',
    minLevel: 1,
    strong: [],
    weak: [],
    playable: true,
  },
  {
    id: 'siegeTower',
    name: 'Torre de cerco',
    plural: 'Torres de cerco',
    description: 'Leva até 25 soldados por cima da muralha sem penalidade. Bloqueada pelo fosso.',
    cls: 'siege',
    attack: 0,
    defense: 25,
    hp: 160,
    speed: 0.1,
    carry: 0,
    upkeep: 0,
    cost: { wood: 140, leather: 20 },
    gold: 25,
    people: 0,
    trainTime: 70,
    recruiter: 'siege_workshop',
    minLevel: 3,
    strong: [],
    weak: ['catapult'],
    playable: true,
  },
  {
    id: 'axeman',
    name: 'Guerreiro do machado',
    plural: 'Guerreiros do machado',
    description: 'Guerreiro tribal que racha escudos.',
    cls: 'infantry',
    attack: 11,
    defense: 8,
    hp: 30,
    speed: 0.27,
    carry: 12,
    upkeep: 0.3,
    cost: {},
    gold: 0,
    people: 1,
    trainTime: 15,
    recruiter: 'none',
    minLevel: 1,
    strong: ['shieldman'],
    weak: ['archer', 'knight', 'horseArcher'],
    playable: false,
  },
  {
    id: 'hunter',
    name: 'Arqueiro de caça',
    plural: 'Arqueiros de caça',
    description: 'Caçador tribal com arco curto.',
    cls: 'ranged',
    attack: 9,
    defense: 6,
    hp: 20,
    speed: 0.27,
    carry: 8,
    upkeep: 0.3,
    cost: {},
    gold: 0,
    people: 1,
    trainTime: 15,
    recruiter: 'none',
    minLevel: 1,
    strong: ['spearman', 'axeman'],
    weak: ['knight', 'shieldman'],
    playable: false,
  },
  {
    id: 'tribalRider',
    name: 'Cavaleiro bárbaro',
    plural: 'Cavaleiros bárbaros',
    description: 'Ginete tribal rápido e sem armadura.',
    cls: 'cavalry',
    attack: 14,
    defense: 7,
    hp: 34,
    speed: 0.45,
    carry: 20,
    upkeep: 0.5,
    cost: {},
    gold: 0,
    people: 1,
    trainTime: 20,
    recruiter: 'none',
    minLevel: 1,
    strong: ['archer', 'hunter', 'crossbowman'],
    weak: ['spearman'],
    playable: false,
  },
  {
    id: 'brigand',
    name: 'Bandido',
    plural: 'Bandidos',
    description: 'Salteador de estrada mal armado.',
    cls: 'infantry',
    attack: 6,
    defense: 6,
    hp: 22,
    speed: 0.3,
    carry: 15,
    upkeep: 0.2,
    cost: {},
    gold: 0,
    people: 1,
    trainTime: 10,
    recruiter: 'none',
    minLevel: 1,
    strong: [],
    weak: ['archer', 'knight'],
    playable: false,
  },
  {
    id: 'northman',
    name: 'Nórdico',
    plural: 'Nórdicos',
    description: 'Infantaria pesada das hordas do mar.',
    cls: 'infantry',
    attack: 16,
    defense: 18,
    hp: 50,
    speed: 0.22,
    carry: 20,
    upkeep: 0,
    cost: {},
    gold: 0,
    people: 0,
    trainTime: 0,
    recruiter: 'none',
    minLevel: 1,
    strong: ['spearman', 'shieldman', 'axeman'],
    weak: ['archer', 'crossbowman'],
    playable: false,
  },
  {
    id: 'steppeRider',
    name: 'Cavaleiro das estepes',
    plural: 'Cavaleiros das estepes',
    description: 'Ginete veloz das hordas, mestre das incursões.',
    cls: 'cavalry',
    attack: 18,
    defense: 10,
    hp: 40,
    speed: 0.55,
    carry: 25,
    upkeep: 0,
    cost: {},
    gold: 0,
    people: 0,
    trainTime: 0,
    recruiter: 'none',
    minLevel: 1,
    strong: ['archer', 'crossbowman', 'hunter'],
    weak: ['spearman'],
    playable: false,
  },
  {
    id: 'mercenary',
    name: 'Mercenário',
    plural: 'Mercenários',
    description: 'Soldado de aluguel bem equipado.',
    cls: 'infantry',
    attack: 13,
    defense: 13,
    hp: 38,
    speed: 0.25,
    carry: 20,
    upkeep: 0,
    cost: {},
    gold: 0,
    people: 0,
    trainTime: 0,
    recruiter: 'none',
    minLevel: 1,
    strong: ['axeman', 'brigand'],
    weak: ['knight', 'crossbowman'],
    playable: false,
  },
  {
    id: 'warlord',
    name: 'Chefe da horda',
    plural: 'Chefes da horda',
    description: 'Comandante temido que vem a cada cinco ondas.',
    cls: 'infantry',
    attack: 120,
    defense: 120,
    hp: 600,
    speed: 0.25,
    carry: 100,
    upkeep: 0,
    cost: {},
    gold: 0,
    people: 0,
    trainTime: 0,
    recruiter: 'none',
    minLevel: 1,
    strong: ['spearman', 'archer', 'shieldman', 'axeman'],
    weak: ['crossbowman'],
    playable: false,
  },
  {
    id: 'militia',
    name: 'Miliciano',
    plural: 'Milicianos',
    description: 'Cidadão armado às pressas para defender as muralhas.',
    cls: 'infantry',
    attack: 4,
    defense: 9,
    hp: 20,
    speed: 0.2,
    carry: 5,
    upkeep: 0,
    cost: {},
    gold: 0,
    people: 1,
    trainTime: 0,
    recruiter: 'none',
    minLevel: 1,
    strong: [],
    weak: ['knight', 'northman'],
    playable: false,
  },
];

export const UNITS = Object.fromEntries(LIST.map((u) => [u.id, u])) as Record<UnitId, UnitDef>;
export const UNIT_IDS = LIST.map((u) => u.id);
export const PLAYABLE_UNITS = LIST.filter((u) => u.playable).map((u) => u.id);
export const SIEGE_UNITS: UnitId[] = ['ram', 'catapult', 'ladder', 'siegeTower'];

export type Troops = Partial<Record<UnitId, number>>;

export const ADVANTAGE = 1.5;
export const DISADVANTAGE = 0.67;

export function matchup(a: UnitId, b: UnitId): number {
  if (UNITS[a].strong.includes(b)) return ADVANTAGE;
  if (UNITS[a].weak.includes(b)) return DISADVANTAGE;
  return 1;
}

export function troopCount(t: Troops, includeSiege = true): number {
  let n = 0;
  for (const k in t) {
    const id = k as UnitId;
    if (!includeSiege && UNITS[id].cls === 'siege') continue;
    n += t[id] ?? 0;
  }
  return n;
}

export function addTroops(into: Troops, from: Troops, sign = 1): void {
  for (const k in from) {
    const id = k as UnitId;
    const v = (into[id] ?? 0) + sign * (from[id] ?? 0);
    if (v <= 1e-9) delete into[id];
    else into[id] = v;
  }
}
