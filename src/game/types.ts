// Tipos centrais do jogo. Toda a lógica trabalha sobre um GameState serializável (JSON puro).

export type ResourceId = 'food' | 'wood' | 'stone' | 'gold';
export type Resources = Record<ResourceId, number>;

export type BuildingId = 'farm' | 'sawmill' | 'quarry' | 'barracks' | 'wall' | 'storehouse';
export type Buildings = Record<BuildingId, number>;

export type UnitId = 'spearman' | 'archer' | 'cavalry';
export type Army = Record<UnitId, number>;

export type Faction = 'player' | 'bandit' | 'lord' | 'invader';

export interface BuildJob {
  building: BuildingId;
  /** Nível que o edifício terá quando terminar. */
  toLevel: number;
  remaining: number;
  total: number;
}

export interface TrainJob {
  unit: UnitId;
  count: number;
  /** Segundos restantes para a próxima unidade sair do quartel. */
  remaining: number;
  perUnit: number;
}

/** Um castelo "completo" (jogador ou senhor rival) com economia própria. */
export interface Castle {
  resources: Resources;
  buildings: Buildings;
  troops: Army;
  buildQueue: BuildJob | null;
  trainQueue: TrainJob[];
}

/** Traços de comportamento de um senhor rival. */
export interface LordPersonality {
  title: string;
  /** Fração das tropas mantida em casa ao atacar. */
  guard: number;
  /** Vantagem de força exigida para atacar. */
  margin: number;
  /** Ajustes na prioridade de construção (menor = mais cedo). */
  buildBias: Partial<Buildings>;
  /** Máximo de tropas treinadas por decisão. */
  trainBatch: number;
}

export interface Fortress {
  id: string;
  name: string;
  faction: Faction;
  x: number;
  y: number;
  /** Nível exibido no mapa. Para senhores é derivado dos edifícios. */
  level: number;
  /** Presente para o jogador e para os senhores rivais. */
  castle?: Castle;
  /** Guarnição e saque de acampamentos (bandidos/invasores). */
  troops: Army;
  loot: Resources;
  /** Bandidos: segundos até o acampamento se reerguer (0 = ativo). */
  rebuildIn: number;
  /** Senhores: tempo de recarga até poder atacar de novo. */
  attackCooldown: number;
  /** Senhores: segundos até a próxima decisão da IA. */
  thinkIn: number;
  /** Senhores: personalidade da IA. */
  personality?: LordPersonality;
  /** Estatísticas para relatórios/testes. */
  stats: { attacksLaunched: number; attacksOnPlayer: number; wins: number; losses: number };
}

export type MarchKind = 'attack' | 'return';

export interface March {
  id: number;
  kind: MarchKind;
  ownerId: string;
  fromId: string;
  targetId: string;
  troops: Army;
  loot: Resources;
  remaining: number;
  total: number;
  /** Ondas de invasores não retornam e não têm castelo de origem real. */
  waveNumber?: number;
}

export interface BattleReport {
  id: number;
  time: number;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  attackerArmy: Army;
  defenderArmy: Army;
  attackerLosses: Army;
  defenderLosses: Army;
  attackPower: number;
  defensePower: number;
  wallBonus: number;
  attackerWon: boolean;
  loot: Resources;
  waveNumber?: number;
  read: boolean;
}

export interface GameEvent {
  id: number;
  time: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
}

export interface GameState {
  version: number;
  /** Tempo de jogo em segundos. Só avança com o app aberto. */
  time: number;
  seed: number;
  rng: number;
  playerName: string;
  fortresses: Fortress[];
  marches: March[];
  reports: BattleReport[];
  events: GameEvent[];
  nextId: number;
  invaders: { wave: number; nextWaveIn: number };
  /** Segundos até qualquer senhor poder atacar o jogador de novo. */
  raidCooldown: number;
}
