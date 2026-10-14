import type { Army, BuildingId, Resources, ResourceId, UnitId } from './types';

export const RESOURCE_IDS: ResourceId[] = ['food', 'wood', 'stone', 'gold'];
export const BUILDING_IDS: BuildingId[] = ['farm', 'sawmill', 'quarry', 'barracks', 'wall', 'storehouse'];
export const UNIT_IDS: UnitId[] = ['spearman', 'archer', 'cavalry'];
export const MAX_LEVEL = 5;

export const RESOURCE_NAMES: Record<ResourceId, string> = {
  food: 'Comida',
  wood: 'Madeira',
  stone: 'Pedra',
  gold: 'Ouro',
};

export interface BuildingDef {
  name: string;
  description: string;
  baseCost: Partial<Resources>;
  baseTime: number;
}

/** Custos crescem 1,9x e tempos 2,5x por nível. */
export const COST_GROWTH = 1.9;
export const TIME_GROWTH = 2.5;

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  farm: {
    name: 'Fazenda',
    description: 'Campos de trigo e cevada que alimentam o castelo.',
    baseCost: { wood: 30, stone: 10 },
    baseTime: 5,
  },
  sawmill: {
    name: 'Serraria',
    description: 'Lenhadores e serras movidas a roda d’água.',
    baseCost: { food: 30, stone: 15 },
    baseTime: 6,
  },
  quarry: {
    name: 'Pedreira',
    description: 'Cortadores de pedra extraem blocos da encosta.',
    baseCost: { food: 30, wood: 30 },
    baseTime: 7,
  },
  barracks: {
    name: 'Quartel',
    description: 'Treina tropas. Nível 1: lanceiros, 2: arqueiros, 3: cavaleiros.',
    baseCost: { wood: 60, stone: 40, gold: 10 },
    baseTime: 8,
  },
  wall: {
    name: 'Muralha',
    description: 'Fortifica o castelo e multiplica a força dos defensores.',
    baseCost: { wood: 40, stone: 80 },
    baseTime: 10,
  },
  storehouse: {
    name: 'Armazém',
    description: 'Aumenta o limite de recursos e esconde parte deles de saqueadores.',
    baseCost: { wood: 50, stone: 50 },
    baseTime: 8,
  },
};

/** Produção por segundo de cada edifício produtor, por nível (índice 0 = não construído). */
export const PRODUCTION_BY_LEVEL = [0, 0.6, 1.1, 1.7, 2.4, 3.2];
/** Produção base do castelo (os camponeses trabalham mesmo sem edifícios). */
export const BASE_PRODUCTION: Resources = { food: 0.3, wood: 0.3, stone: 0.2, gold: 0.1 };
/** Ouro de impostos: cada nível de edifício rende um pouco de ouro. */
export const GOLD_PER_BUILDING_LEVEL = 0.025;
/** Capacidade de cada recurso por nível do armazém. */
export const STORAGE_BY_LEVEL = [600, 1000, 1600, 2500, 4000, 6000];
/** Limite de tropas (em casa, em marcha e em treino) por nível do quartel. */
export const TROOP_CAP_BY_LEVEL = [0, 20, 35, 55, 80, 110];
/** Fração dos recursos escondida dos saqueadores, por nível do armazém. */
export const PROTECTED_BY_LEVEL = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35];
/** Bônus de defesa da muralha por nível. */
export const WALL_BONUS_BY_LEVEL = [0, 0.15, 0.3, 0.5, 0.75, 1.0];
/** Milícia que sempre defende um castelo, mesmo sem tropas. */
export const CASTLE_BASE_DEFENSE = 25;

export interface UnitDef {
  name: string;
  plural: string;
  description: string;
  attack: number;
  defense: number;
  carry: number;
  cost: Partial<Resources>;
  trainTime: number;
  barracksLevel: number;
  /** Tipo contra o qual esta unidade tem vantagem. */
  strongAgainst: UnitId;
}

export const UNITS: Record<UnitId, UnitDef> = {
  spearman: {
    name: 'Lanceiro',
    plural: 'Lanceiros',
    description: 'Muralha de lanças: forte contra cavaleiros, fraco contra arqueiros.',
    attack: 8,
    defense: 14,
    carry: 12,
    cost: { food: 20, wood: 12, gold: 2 },
    trainTime: 4,
    barracksLevel: 1,
    strongAgainst: 'cavalry',
  },
  archer: {
    name: 'Arqueiro',
    plural: 'Arqueiros',
    description: 'Flechas a distância: fortes contra lanceiros, fracos contra cavaleiros.',
    attack: 12,
    defense: 10,
    carry: 8,
    cost: { food: 22, wood: 25, gold: 4 },
    trainTime: 5,
    barracksLevel: 2,
    strongAgainst: 'spearman',
  },
  cavalry: {
    name: 'Cavaleiro',
    plural: 'Cavaleiros',
    description: 'Carga veloz: forte contra arqueiros, fraco contra lanceiros.',
    attack: 20,
    defense: 12,
    carry: 25,
    cost: { food: 45, wood: 10, gold: 15 },
    trainTime: 8,
    barracksLevel: 3,
    strongAgainst: 'archer',
  },
};

export const ADVANTAGE = 1.5;
export const DISADVANTAGE = 0.67;

/** Segundos de marcha por casa da grade. */
export const MARCH_SECONDS_PER_TILE = 4;
export const MAP_SIZE = 10;

export const BANDIT_REBUILD_SECONDS = 240;
export const INVADER_CAMP_REBUILD_SECONDS = 600;
export const INVADER_FIRST_WAVE = 600;
export const INVADER_WAVE_INTERVAL = 540;
export const INVADER_WAVE_GROWTH = 1.2;
export const INVADER_BASE_WAVE: Army = { spearman: 6, archer: 5, cavalry: 2 };
export const LORD_THINK_INTERVAL = 10;
export const LORD_ATTACK_COOLDOWN = 150;
/** Intervalo mínimo entre ataques de senhores (quaisquer) ao jogador. */
export const PLAYER_RAID_GAP = 150;
export const MAX_REPORTS = 60;
export const MAX_EVENTS = 60;

export function emptyArmy(): Army {
  return { spearman: 0, archer: 0, cavalry: 0 };
}

export function emptyResources(): Resources {
  return { food: 0, wood: 0, stone: 0, gold: 0 };
}
