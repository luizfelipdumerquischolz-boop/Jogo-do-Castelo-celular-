import type { BuildingCategory, BuildingId, DepositType, SettlementKind, Vocation } from './data/buildings';
import type { FoodGroup, Stock } from './data/items';
import type { Troops, UnitId } from './data/units';

export type NationKind = 'player' | 'rival' | 'tribe' | 'bandit' | 'horde';
export type Personality = 'conqueror' | 'merchant' | 'builder' | 'treacherous' | 'cautious';
export type TensionState = 'pacific' | 'watchful' | 'tense' | 'hostile';
export type RelationState = 'peace' | 'war' | 'truce' | 'alliance';

export interface Nation {
  id: number;
  kind: NationKind;
  name: string;
  ruler: string;
  color: string;
  personality: Personality | null;
  capitalId: number | null;
  gold: number;
  research: { done: string[]; current: string | null; progress: number };
  alive: boolean;
  /** Estimativas de força militar dos outros (o que os espiões contaram). */
  knowledge: Record<number, { strength: number; time: number }>;
  /** Contraespionagem: 0 nenhuma, 1 silêncio, 2 desinformação. */
  counterIntel: number;
  reputation: number;
  /** Nível da tribo (1 a 4). */
  tribeLevel: number;
  /** Segundos sem ser atacada (tribos crescem com isso). */
  tribeCalm: number;
  vassalOf: number | null;
  thinkIn: number;
  emperor: boolean;
}

export interface Relation {
  a: number;
  b: number;
  state: RelationState;
  truceUntil: number;
  /** Tributo anual em ouro de `tributeFrom` para o outro lado. */
  tribute: { from: number; gold: number } | null;
  /** Rancor de cada lado contra o outro (some com o tempo). */
  grudge: Record<number, number>;
  tension: number;
  tensionState: TensionState;
  /** Distância entre as fronteiras (casas). */
  borderDistance: number;
  /** Acordo de comércio: +10% de impostos para os dois. */
  trade: boolean;
}

export interface Construction {
  toLevel: number;
  remaining: number;
  total: number;
}

export interface PlacedBuilding {
  id: number;
  type: BuildingId;
  x: number;
  y: number;
  level: number;
  /** Obra em andamento (nível 0 = sendo erguida pela primeira vez). */
  build: Construction | null;
  /** Trabalhadores ocupados (calculado). */
  workers: number;
  /** Pesos das receitas (ferreiro, tecelagem). */
  recipeWeights: Record<string, number>;
  /** Segundos parada por falta de insumo. */
  stalled: number;
  /** Fração de produção no último segundo (para a interface). */
  efficiency: number;
}

export type Ration = 'none' | 'low' | 'normal' | 'high';
export type SettlementKindAny = SettlementKind | 'camp' | 'tribal';
export type Zone = 'center' | 'middle' | 'frontier';

export interface Defenses {
  wallLevel: number;
  wallHp: number;
  gateLevel: number;
  gateHp: number;
  towers: number;
  moat: boolean;
  oil: boolean;
  stakes: boolean;
  pits: boolean;
}

export interface TrainJob {
  unit: UnitId;
  count: number;
  remaining: number;
  perUnit: number;
}

export interface District {
  vocation: Vocation | null;
  level: number;
}

export interface Settlement {
  id: number;
  name: string;
  nation: number;
  kind: SettlementKindAny;
  x: number;
  y: number;
  gridSize: number;
  buildings: PlacedBuilding[];
  stock: Stock;
  /** Quantidade de pessoas por idade em anos (índice = idade). */
  ages: number[];
  birthAcc: number;
  deathAcc: number;
  priorities: BuildingCategory[];
  ration: Ration;
  /** 0 baixo, 1 normal, 2 alto, 3 extorsivo. */
  tax: number;
  vocation: Vocation | null;
  vocationSwitch: { to: Vocation; remaining: number } | null;
  districts: District[];
  happiness: number;
  health: number;
  loyalty: number;
  culture: number;
  morale: number;
  /** Participação de cada grupo alimentar na dieta (média móvel). */
  diet: Record<FoodGroup, number>;
  /** Alimentos diferentes consumidos no último minuto. */
  dietVariety: number;
  /** Fração da fome no último minuto (0 a 1). */
  hunger: number;
  noVitamins: number;
  sick: number;
  outbreak: number;
  defenses: Defenses;
  garrisonId: number;
  trainQueue: TrainJob[];
  siegeQueue: TrainJob[];
  consulId: number | null;
  zone: Zone;
  /** Distância até território estrangeiro. */
  foreignDistance: number;
  modifiers: { bumperUntil: number; blightUntil: number; ratsAt: number };
  wounded: { troops: Troops; until: number }[];
  /** Para acampamentos destruídos: segundos até se reerguer. */
  ruinedFor: number;
  /** Último aviso de cada tipo (para não repetir cartas). */
  lastNotice: Record<string, number>;
  /** Ouro de impostos no último minuto (interface). */
  taxIncome: number;
  revolt: boolean;
  foundedAt: number;
}

export type ArmyOrder = 'idle' | 'move' | 'attack' | 'defend' | 'patrol' | 'escort' | 'hunt' | 'return' | 'raid';
export type Formation = 'balanced' | 'strongFlanks' | 'strongCenter';

export interface Army {
  id: number;
  nation: number;
  name: string;
  x: number;
  y: number;
  troops: Troops;
  /** Experiência média (0 a 1). */
  xp: number;
  morale: number;
  /** Comida carregada (porções). */
  food: number;
  homeId: number;
  stationedAt: number | null;
  path: number[];
  pathIdx: number;
  order: ArmyOrder;
  targetId: number | null;
  targetX: number;
  targetY: number;
  commanderId: number | null;
  /** Comandante decide sozinho (false = comando direto do jogador). */
  autonomous: boolean;
  battleId: number | null;
  formation: Formation;
  wave: number;
  loot: Stock;
  lootGold: number;
  thinkIn: number;
  /** Fome acumulada (segundos sem comida). */
  starving: number;
}

export interface Battle {
  id: number;
  x: number;
  y: number;
  attackers: number[];
  defenders: number[];
  attackerNation: number;
  defenderNation: number;
  settlementId: number | null;
  elapsed: number;
  startAttack: number;
  startDefense: number;
  night: boolean;
  attackerLosses: Troops;
  defenderLosses: Troops;
  /** Escadas e torres já usadas. */
  climbed: number;
  /** Dano fracionário acumulado por exército e unidade. */
  damage: Record<string, number>;
}

export type TravelerKind = 'wagon' | 'messenger' | 'colonists' | 'spy' | 'ship' | 'caravan';

export interface Traveler {
  id: number;
  kind: TravelerKind;
  nation: number;
  x: number;
  y: number;
  path: number[];
  pathIdx: number;
  speed: number;
  fromId: number;
  toId: number;
  cargo: Stock;
  gold: number;
  letterId: number | null;
  colonists: { count: number; kind: 'village' | 'castle' | 'outpost'; tx: number; ty: number } | null;
  spyMissionId: number | null;
  routeId: number | null;
  /** Navios das hordas: exército a bordo. */
  armyTroops: Troops | null;
  wave: number;
  returning: boolean;
}

export interface Route {
  id: number;
  nation: number;
  fromId: number;
  toId: number;
  item: string;
  amount: number;
  active: boolean;
  busy: boolean;
}

export interface LetterAction {
  label: string;
  action: string;
  arg?: number | string;
}

export interface Letter {
  id: number;
  fromNation: number;
  toNation: number;
  sender: string;
  subject: string;
  body: string;
  time: number;
  arrived: boolean;
  read: boolean;
  /** Carta de outro reino que caiu nas mãos do jogador. */
  intercepted: boolean;
  settlementId: number | null;
  actions: LetterAction[];
  /** Proposta diplomática: tipo e dados. */
  proposal: { type: string; from: number; to: number; gold?: number } | null;
}

export type HeroRole = 'none' | 'commander' | 'consul';

export interface Hero {
  id: number;
  name: string;
  /** -1 = disponível na taverna. */
  nation: number;
  role: HeroRole;
  traits: string[];
  level: number;
  xp: number;
  wage: number;
  hirePrice: number;
  assignedTo: number | null;
  equipment: string[];
  captiveOf: number | null;
}

export interface SpyReport {
  time: number;
  targetId: number;
  targetName: string;
  troops: Partial<Record<UnitId, [number, number]>>;
  stock: Record<string, [number, number]>;
  wall: [number, number];
  population: [number, number];
  clue: string;
  /** Verdade escondida (só para os testes e para a IA conferir). */
  lied: boolean;
}

export interface SpyMission {
  id: number;
  nation: number;
  targetId: number;
  fromId: number;
  price: number;
  basePrice: number;
  reliability: number;
  state: 'traveling' | 'returning' | 'done' | 'captured';
  travelerId: number | null;
  report: SpyReport | null;
  doubleAgent: boolean;
}

export interface Deposit {
  id: number;
  type: DepositType;
  x: number;
  y: number;
  amount: number;
  max: number;
}

export interface BattleReport {
  id: number;
  time: number;
  x: number;
  y: number;
  attackerNation: number;
  defenderNation: number;
  attackerName: string;
  defenderName: string;
  placeName: string;
  attackerTroops: Troops;
  defenderTroops: Troops;
  attackerLosses: Troops;
  defenderLosses: Troops;
  winner: 'attacker' | 'defender';
  outcome: string;
  loot: Stock;
  lootGold: number;
  read: boolean;
}

export interface GameEvent {
  id: number;
  time: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
  x?: number;
  y?: number;
}

export interface Mission {
  id: string;
  text: string;
  done: boolean;
  reward: { gold?: number; items?: Stock };
}

export interface Prisoner {
  id: number;
  holder: number;
  owner: number;
  heroId: number | null;
  troops: Troops;
  ransom: number;
  name: string;
}

export interface GameState {
  version: number;
  seed: number;
  time: number;
  rng: number;
  nextId: number;
  playerNation: number;
  kingdomName: string;
  nations: Nation[];
  relations: Record<string, Relation>;
  settlements: Settlement[];
  armies: Army[];
  battles: Battle[];
  travelers: Traveler[];
  routes: Route[];
  letters: Letter[];
  heroes: Hero[];
  spyMissions: SpyMission[];
  deposits: Deposit[];
  roads: number[];
  bridges: number[];
  forestCut: number[];
  /** Casas exploradas pelo jogador (bitmap em base64). */
  explored: string;
  reports: BattleReport[];
  events: GameEvent[];
  era: number;
  hordes: { wave: number; nextIn: number };
  missions: Mission[];
  victory: { achieved: boolean; at: number; secret: boolean };
  defeated: boolean;
  prisoners: Prisoner[];
  stats: Record<string, number>;
}
