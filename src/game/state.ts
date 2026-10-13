import { INVADER_FIRST_WAVE, emptyArmy, emptyResources } from './config';
import type { Army, Castle, Faction, Fortress, GameState, LordPersonality, Resources } from './types';

export const SAVE_VERSION = 1;
export const PLAYER_ID = 'player';

export function newCastle(partial: Partial<Castle> = {}): Castle {
  return {
    resources: { food: 0, wood: 0, stone: 0, gold: 0 },
    buildings: { farm: 0, sawmill: 0, quarry: 0, barracks: 0, wall: 0, storehouse: 0 },
    troops: emptyArmy(),
    buildQueue: null,
    trainQueue: [],
    ...partial,
  };
}

function fortress(
  id: string,
  name: string,
  faction: Faction,
  x: number,
  y: number,
  level: number,
  troops: Army,
  loot: Resources,
  castle?: Castle,
): Fortress {
  return {
    id,
    name,
    faction,
    x,
    y,
    level,
    castle,
    troops,
    loot,
    rebuildIn: 0,
    attackCooldown: 0,
    thinkIn: 0,
    stats: { attacksLaunched: 0, attacksOnPlayer: 0, wins: 0, losses: 0 },
  };
}

/** Guarnição e saque padrão de um acampamento de bandidos por nível. */
export function banditGarrison(level: number): Army {
  const table: Army[] = [
    { spearman: 3, archer: 2, cavalry: 0 },
    { spearman: 6, archer: 4, cavalry: 1 },
    { spearman: 10, archer: 7, cavalry: 3 },
  ];
  return { ...table[Math.min(level, 3) - 1] };
}

export function banditLoot(level: number): Resources {
  return { food: 160 * level, wood: 160 * level, stone: 90 * level, gold: 45 * level };
}

export function invaderCampGarrison(): Army {
  return { spearman: 40, archer: 30, cavalry: 15 };
}

export function invaderCampLoot(): Resources {
  return { food: 800, wood: 600, stone: 600, gold: 500 };
}

export function createInitialState(seed = 12345, playerName = 'Seu Castelo'): GameState {
  const player = fortress(PLAYER_ID, playerName, 'player', 4, 5, 1, emptyArmy(), emptyResources(),
    newCastle({ resources: { food: 400, wood: 400, stone: 300, gold: 120 } }));

  const lordCastle = (food: number): Castle =>
    newCastle({
      resources: { food, wood: food, stone: Math.round(food * 0.8), gold: 100 },
      buildings: { farm: 1, sawmill: 1, quarry: 1, barracks: 1, wall: 0, storehouse: 0 },
      troops: { spearman: 4, archer: 0, cavalry: 0 },
    });

  const lords = [
    fortress('lord-aldren', 'Lorde Aldren de Pedravelha', 'lord', 8, 1, 1, emptyArmy(), emptyResources(), lordCastle(320)),
    fortress('lord-ysolde', 'Dama Ysolde do Vale Cinzento', 'lord', 1, 1, 1, emptyArmy(), emptyResources(), lordCastle(280)),
    fortress('lord-corvino', 'Barão Corvino de Brumafria', 'lord', 8, 8, 1, emptyArmy(), emptyResources(), lordCastle(300)),
  ];
  const personalities: LordPersonality[] = [
    { title: 'o Construtor', guard: 0.4, margin: 1.4, buildBias: { wall: -0.6, storehouse: -0.3, barracks: 0.4 }, trainBatch: 3 },
    { title: 'a Estrategista', guard: 0.3, margin: 1.2, buildBias: {}, trainBatch: 4 },
    { title: 'o Saqueador', guard: 0.15, margin: 1.05, buildBias: { barracks: -0.5, wall: 0.8 }, trainBatch: 6 },
  ];
  lords.forEach((l, i) => {
    l.thinkIn = 2 + i * 3;
    l.personality = personalities[i];
  });

  const bandits = [
    fortress('bandit-ratos', 'Covil dos Ratos de Estrada', 'bandit', 2, 6, 1, banditGarrison(1), banditLoot(1)),
    fortress('bandit-garra', 'Acampamento Garra Torta', 'bandit', 6, 4, 1, banditGarrison(1), banditLoot(1)),
    fortress('bandit-lobo', 'Toca do Lobo Magro', 'bandit', 5, 8, 2, banditGarrison(2), banditLoot(2)),
    fortress('bandit-mata', 'Esconderijo da Mata Escura', 'bandit', 1, 4, 2, banditGarrison(2), banditLoot(2)),
    fortress('bandit-ponte', 'Forte da Ponte Quebrada', 'bandit', 7, 6, 3, banditGarrison(3), banditLoot(3)),
  ];

  const invaders = [
    fortress('invader-norte', 'Fenda Gélida do Norte', 'invader', 4, 0, 5, invaderCampGarrison(), invaderCampLoot()),
    fortress('invader-leste', 'Marco da Horda Cinzenta', 'invader', 9, 4, 5, invaderCampGarrison(), invaderCampLoot()),
  ];

  return {
    version: SAVE_VERSION,
    time: 0,
    seed,
    rng: seed >>> 0,
    playerName,
    fortresses: [player, ...lords, ...bandits, ...invaders],
    marches: [],
    reports: [],
    events: [],
    nextId: 1,
    invaders: { wave: 0, nextWaveIn: INVADER_FIRST_WAVE },
    raidCooldown: 0,
  };
}

export function getFortress(state: GameState, id: string): Fortress {
  const f = state.fortresses.find((x) => x.id === id);
  if (!f) throw new Error(`Fortaleza desconhecida: ${id}`);
  return f;
}

export function getPlayer(state: GameState): Fortress {
  return getFortress(state, PLAYER_ID);
}

export function playerCastle(state: GameState): Castle {
  return getPlayer(state).castle!;
}

export function lords(state: GameState): Fortress[] {
  return state.fortresses.filter((f) => f.faction === 'lord');
}

/** Gerador pseudoaleatório determinístico (mulberry32) guardado no estado. */
export function random(state: GameState): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
