// Todos os números de equilíbrio num só lugar, para ajustar depois de jogar.

export const BALANCE = {
  // Tempo
  seasonSeconds: 300,
  dayNightSeconds: 120,
  maxStep: 1,

  // População
  adultAge: 4,
  elderAge: 16,
  maxAge: 30,
  /** Nascimentos por ano, por adulto. */
  birthRate: 0.32,
  /** Probabilidade anual de morte de idosos (cresce 6% por ano acima da idade idosa). */
  elderDeath: 0.08,
  /** Fração de produção de um idoso trabalhando. */
  elderWork: 0.5,

  // Comida
  /** Porções por pessoa por minuto, ração normal. */
  foodPerPerson: 0.22,
  rationFactor: { none: 0, low: 0.6, normal: 1, high: 1.4 } as Record<string, number>,
  /** Bônus por número de grupos alimentares cobertos (0 a 4). */
  varietyBonus: [0, 0, 0.06, 0.13, 0.2],
  excessShare: 0.6,
  pleasureExcess: 0.35,

  // Armazém
  baseStorage: 400,

  // Lavouras por estação: primavera, verão, outono, inverno
  seasonFarm: [0.6, 1.0, 2.0, 0.15],

  // Construção
  maxConstructions: { capital: 2, city: 2, village: 1, castle: 1, outpost: 1 } as Record<string, number>,

  // Território (raio em casas)
  claimRadius: { capital: 11, city: 9, village: 6, castle: 7, outpost: 5 } as Record<string, number>,
  /** Distância até território estrangeiro: abaixo de frontier = fronteira, abaixo de middle = meio. */
  zoneFrontier: 10,
  zoneMiddle: 26,
  depositReach: 7,

  // Terreno dos assentamentos (lado da grade)
  gridSize: { city: 16, village: 10, castle: 12, outpost: 6 } as Record<string, number>,
  capitalGridByKeep: [0, 14, 16, 16, 18, 18, 20, 20, 22, 22, 24],
  capitalCore: 12,
  districtKeepLevels: [3, 5, 7, 9],
  districtBonus: [0, 0.04, 0.07, 0.1, 0.12, 0.14],
  districtInvest: { gold: 80, stone: 120, wood: 120 },
  vocationBonus: 0.4,
  vocationSwitchSeconds: 300,

  // Assentamentos
  settlementLimitByKeep: [0, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10],
  colonistsVillage: 10,
  colonistsCastle: 14,
  colonistsOutpost: 4,
  foundCost: {
    village: { wood: 150, stone: 80, gold: 60 },
    castle: { wood: 250, stone: 300, gold: 150 },
    outpost: { wood: 80, stone: 40, gold: 30 },
  } as Record<string, { wood: number; stone: number; gold: number }>,
  cityPopulation: 120,

  // Muralhas e defesas
  wallHpPerLevel: 400,
  gateHpPerLevel: 250,
  wallBonus: [0, 0.2, 0.4, 0.65, 0.9, 1.2],
  towerBonus: 0.25,

  // Exércitos
  baseMarchSpeed: 0.25,
  winterMarch: 0.7,
  nightAttackBonus: 0.15,
  /** Dano por segundo = poder × fator. */
  battleRate: 0.02,
  routThreshold: 0.25,
  woundedBase: 0.2,
  woundedPerLevel: 0.05,
  woundedRecovery: 120,
  ladderCarry: 10,
  towerCarry: 25,
  ladderPenalty: 0.7,

  // Logística
  wagonCapacity: 120,
  wagonSpeed: 0.4,
  messengerSpeed: 1,
  roadSpeed: 1.8,
  roadCostStone: 4,
  interceptRange: 1.2,

  // Espionagem
  spyBasePrice: 25,
  spyPricePerTile: 0.4,
  spySpeed: 0.8,

  // Inimigos
  tension: { pacific: 60, watchful: 30, tense: 10 },
  thinkRival: 10,
  thinkCommander: 5,
  thinkTribe: 20,
  thinkBandit: 30,
  banditRebuild: 360,
  tribeGrowYears: 4,
  hordeFirstWave: 2400,
  hordeInterval: 900,
  hordeGrowth: 1.18,
  hordeBossEvery: 5,
  emperorHordeMultiplier: 2,

  // Vitória
  victoryLandShare: 0.75,
};

export const SEASON_NAMES = ['Primavera', 'Verão', 'Outono', 'Inverno'];
export const YEAR_SECONDS = BALANCE.seasonSeconds * 4;
