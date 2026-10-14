import type { ItemId, Stock } from './items';

export type SettlementKind = 'capital' | 'city' | 'village' | 'castle' | 'outpost';
export type Vocation = 'agricultural' | 'mining' | 'industrial' | 'commercial' | 'cultural' | 'military' | 'fortress';
export type DepositType = 'iron' | 'stone' | 'gold' | 'diamond' | 'fertile' | 'fish';

export const SETTLEMENT_KIND_NAMES: Record<SettlementKind, string> = {
  capital: 'Capital',
  city: 'Cidade',
  village: 'Aldeia',
  castle: 'Castelo',
  outpost: 'Entreposto',
};

export const VOCATION_NAMES: Record<Vocation, string> = {
  agricultural: 'Agrícola',
  mining: 'Mineira',
  industrial: 'Industrial',
  commercial: 'Comercial',
  cultural: 'Cultural',
  military: 'Militar',
  fortress: 'Fortaleza',
};

export type BuildingId =
  | 'keep'
  | 'governor_hall'
  | 'house'
  | 'wheat_farm'
  | 'oat_farm'
  | 'barley_farm'
  | 'vegetable_garden'
  | 'orchard'
  | 'vineyard'
  | 'pasture'
  | 'sheep_pasture'
  | 'henhouse'
  | 'fisher'
  | 'apiary'
  | 'mill'
  | 'bakery'
  | 'kitchen'
  | 'butcher'
  | 'dairy'
  | 'brewery'
  | 'winepress'
  | 'sawmill'
  | 'quarry'
  | 'iron_mine'
  | 'gold_mine'
  | 'diamond_mine'
  | 'charcoal_kiln'
  | 'foundry'
  | 'tannery'
  | 'weaver'
  | 'jeweler'
  | 'storehouse'
  | 'blacksmith'
  | 'fletcher'
  | 'stable'
  | 'barracks'
  | 'training_ground'
  | 'siege_workshop'
  | 'infirmary'
  | 'watchtower'
  | 'dungeon'
  | 'market'
  | 'tavern'
  | 'chapel'
  | 'library'
  | 'well'
  | 'port'
  | 'statue'
  | 'garden';

export type BuildingCategory = 'admin' | 'food' | 'materials' | 'industry' | 'military' | 'civic';

export const CATEGORY_NAMES: Record<BuildingCategory, string> = {
  admin: 'Administração',
  food: 'Comida',
  materials: 'Materiais',
  industry: 'Indústria',
  military: 'Militar',
  civic: 'Vida e cultura',
};

/** Uma receita: o que entra e o que sai por minuto, no nível 1 com todos os trabalhadores. */
export interface Recipe {
  id: string;
  name: string;
  input: Stock;
  output: Stock;
  /** Ouro produzido (vai para o tesouro do reino). */
  gold?: number;
  /** Afetada pela estação (lavouras). */
  seasonal?: boolean;
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  size: 1 | 2 | 3;
  workers: number;
  category: BuildingCategory;
  /** Tipos de assentamento onde pode existir. A capital aceita também tudo o que uma cidade aceita. */
  kinds: SettlementKind[];
  /** Na capital, construções de outros tipos ficam liberadas num bairro destas vocações. */
  districts?: Vocation[];
  /** Vocações que ganham bônus nesta construção. */
  boostedBy: Vocation[];
  recipes: Recipe[];
  cost: Stock;
  /** Ouro do tesouro exigido além dos materiais. */
  goldCost?: number;
  buildTime: number;
  maxLevel: number;
  requiresDeposit?: DepositType;
  requiresWater?: boolean;
  /** Vagas de moradia por nível. */
  housing?: number;
  /** Capacidade extra de armazém por nível. */
  storage?: number;
  /** Felicidade por nível. */
  happiness?: number;
  /** Cultura por nível. */
  culture?: number;
  /** Ouro de impostos por minuto, por nível (multiplicado pela taxa). */
  tax?: number;
  /** Não pode ser demolida nem movida para fora do núcleo. */
  unique?: boolean;
}

const ALL: SettlementKind[] = ['capital', 'city', 'village', 'castle', 'outpost'];
const CIVIL: SettlementKind[] = ['capital', 'city', 'village', 'castle'];

function b(def: Omit<BuildingDef, 'maxLevel' | 'recipes' | 'boostedBy'> & Partial<Pick<BuildingDef, 'maxLevel' | 'recipes' | 'boostedBy'>>): BuildingDef {
  return { maxLevel: 5, recipes: [], boostedBy: [], ...def };
}

function r(id: string, name: string, input: Stock, output: Stock, extra: Partial<Recipe> = {}): Recipe {
  return { id, name, input, output, ...extra };
}

const LIST: BuildingDef[] = [
  // Administração e moradia
  b({
    id: 'keep',
    name: 'Torre de Menagem',
    description: 'Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos.',
    size: 3,
    workers: 4,
    category: 'admin',
    kinds: ['capital'],
    cost: { wood: 120, stone: 200 },
    goldCost: 50,
    buildTime: 60,
    maxLevel: 10,
    housing: 16,
    storage: 200,
    tax: 2,
    unique: true,
  }),
  b({
    id: 'governor_hall',
    name: 'Salão do governador',
    description: 'Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação.',
    size: 2,
    workers: 2,
    category: 'admin',
    kinds: ['city', 'village', 'castle'],
    cost: { wood: 80, stone: 100 },
    goldCost: 30,
    buildTime: 45,
    housing: 8,
    storage: 150,
    tax: 1,
    unique: true,
  }),
  b({
    id: 'house',
    name: 'Casa',
    description: 'Moradia para 8 cidadãos por nível. Gera impostos.',
    size: 1,
    workers: 0,
    category: 'admin',
    kinds: CIVIL,
    boostedBy: ['commercial'],
    cost: { wood: 30, stone: 10 },
    buildTime: 15,
    housing: 8,
    tax: 0.6,
  }),
  // Comida e campo
  b({
    id: 'wheat_farm',
    name: 'Fazenda de trigo',
    description: 'Planta trigo. A colheita se concentra no outono.',
    size: 2,
    workers: 4,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('wheat', 'Trigo', {}, { wheat: 14 }, { seasonal: true })],
    cost: { wood: 40, stone: 10 },
    buildTime: 20,
  }),
  b({
    id: 'oat_farm',
    name: 'Fazenda de aveia',
    description: 'Planta aveia para mingau e para os cavalos.',
    size: 2,
    workers: 4,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('oats', 'Aveia', {}, { oats: 14 }, { seasonal: true })],
    cost: { wood: 40, stone: 10 },
    buildTime: 20,
  }),
  b({
    id: 'barley_farm',
    name: 'Fazenda de cevada',
    description: 'Planta cevada para a cervejaria.',
    size: 2,
    workers: 4,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('barley', 'Cevada', {}, { barley: 12 }, { seasonal: true })],
    cost: { wood: 40, stone: 10 },
    buildTime: 20,
  }),
  b({
    id: 'vegetable_garden',
    name: 'Horta',
    description: 'Legumes: o grupo das vitaminas, que protege contra doenças.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('vegetables', 'Legumes', {}, { vegetables: 9 }, { seasonal: true })],
    cost: { wood: 20 },
    buildTime: 12,
  }),
  b({
    id: 'orchard',
    name: 'Pomar',
    description: 'Árvores frutíferas: vitaminas para o povo.',
    size: 2,
    workers: 3,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('fruit', 'Frutas', {}, { fruit: 11 }, { seasonal: true })],
    cost: { wood: 50, stone: 10 },
    buildTime: 25,
  }),
  b({
    id: 'vineyard',
    name: 'Vinhedo',
    description: 'Uvas para o lagar.',
    size: 2,
    workers: 3,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('grapes', 'Uva', {}, { grapes: 10 }, { seasonal: true })],
    cost: { wood: 50, stone: 10 },
    buildTime: 25,
  }),
  b({
    id: 'pasture',
    name: 'Pasto',
    description: 'Cria gado e dá leite.',
    size: 2,
    workers: 2,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('cattle', 'Gado e leite', { oats: 2 }, { cattle: 1, milk: 7 })],
    cost: { wood: 50 },
    buildTime: 20,
  }),
  b({
    id: 'sheep_pasture',
    name: 'Pasto de ovelhas',
    description: 'Ovelhas dão lã para a tecelagem.',
    size: 2,
    workers: 2,
    category: 'food',
    kinds: ['village'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('wool', 'Lã', {}, { wool: 6 })],
    cost: { wood: 50 },
    buildTime: 20,
  }),
  b({
    id: 'henhouse',
    name: 'Galinheiro',
    description: 'Galinhas botam ovos: proteína barata.',
    size: 1,
    workers: 1,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('eggs', 'Ovos', { oats: 1 }, { eggs: 7 })],
    cost: { wood: 25 },
    buildTime: 12,
  }),
  b({
    id: 'fisher',
    name: 'Pescador',
    description: 'Pesca no rio ou no mar. Precisa de água perto.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('fish', 'Peixe', {}, { fish: 10 })],
    cost: { wood: 35 },
    buildTime: 15,
    requiresWater: true,
  }),
  b({
    id: 'apiary',
    name: 'Apiário',
    description: 'Abelhas dão mel e cera.',
    size: 1,
    workers: 1,
    category: 'food',
    kinds: ['village'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('honey', 'Mel e cera', {}, { honey: 3, wax: 1 }, { seasonal: true })],
    cost: { wood: 30 },
    buildTime: 15,
  }),
  b({
    id: 'mill',
    name: 'Moinho',
    description: 'Mói o trigo e faz farinha.',
    size: 2,
    workers: 2,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('flour', 'Farinha', { wheat: 10 }, { flour: 9 })],
    cost: { wood: 60, stone: 30 },
    buildTime: 30,
  }),
  b({
    id: 'bakery',
    name: 'Padaria',
    description: 'Transforma farinha em pão.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('bread', 'Pão', { flour: 8 }, { bread: 12 })],
    cost: { wood: 40, stone: 20 },
    buildTime: 20,
  }),
  b({
    id: 'kitchen',
    name: 'Cozinha comunitária',
    description: 'Cozinha aveia e faz mingau.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: CIVIL,
    boostedBy: ['agricultural'],
    recipes: [r('porridge', 'Mingau', { oats: 8 }, { porridge: 12 })],
    cost: { wood: 35, stone: 10 },
    buildTime: 18,
  }),
  b({
    id: 'butcher',
    name: 'Açougue',
    description: 'Gado vira carne.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('meat', 'Carne', { cattle: 1 }, { meat: 12 })],
    cost: { wood: 40, stone: 20 },
    buildTime: 20,
  }),
  b({
    id: 'dairy',
    name: 'Queijaria',
    description: 'Leite vira queijo, que dura muito no armazém.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural'],
    boostedBy: ['agricultural'],
    recipes: [r('cheese', 'Queijo', { milk: 8 }, { cheese: 6 })],
    cost: { wood: 40, stone: 20 },
    buildTime: 20,
  }),
  b({
    id: 'brewery',
    name: 'Cervejaria',
    description: 'Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez.',
    size: 2,
    workers: 3,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural', 'commercial'],
    boostedBy: ['agricultural'],
    recipes: [r('beer', 'Cerveja', { barley: 8 }, { beer: 10 })],
    cost: { wood: 60, stone: 30 },
    buildTime: 30,
  }),
  b({
    id: 'winepress',
    name: 'Lagar',
    description: 'Uva vira vinho.',
    size: 1,
    workers: 2,
    category: 'food',
    kinds: ['village', 'city'],
    districts: ['agricultural', 'commercial'],
    boostedBy: ['agricultural'],
    recipes: [r('wine', 'Vinho', { grapes: 8 }, { wine: 6 })],
    cost: { wood: 40, stone: 30 },
    buildTime: 25,
  }),
  // Materiais e indústria
  b({
    id: 'sawmill',
    name: 'Serraria',
    description: 'Lenhadores e serras: madeira.',
    size: 2,
    workers: 4,
    category: 'materials',
    kinds: CIVIL,
    boostedBy: ['mining'],
    recipes: [r('wood', 'Madeira', {}, { wood: 12 })],
    cost: { wood: 20, stone: 20 },
    buildTime: 20,
  }),
  b({
    id: 'quarry',
    name: 'Pedreira',
    description: 'Corta blocos de pedra.',
    size: 2,
    workers: 5,
    category: 'materials',
    kinds: CIVIL,
    boostedBy: ['mining'],
    recipes: [r('stone', 'Pedra', {}, { stone: 10 })],
    cost: { wood: 50 },
    buildTime: 25,
  }),
  b({
    id: 'iron_mine',
    name: 'Mina de ferro',
    description: 'Extrai ferro. Só perto de um depósito de ferro.',
    size: 2,
    workers: 6,
    category: 'materials',
    kinds: ALL.filter((k) => k !== 'outpost'),
    boostedBy: ['mining'],
    recipes: [r('iron', 'Ferro', {}, { iron: 8 })],
    cost: { wood: 80, stone: 40 },
    buildTime: 35,
    requiresDeposit: 'iron',
  }),
  b({
    id: 'gold_mine',
    name: 'Mina de ouro',
    description: 'Extrai ouro para o tesouro. Só perto de um depósito de ouro.',
    size: 2,
    workers: 6,
    category: 'materials',
    kinds: ALL.filter((k) => k !== 'outpost'),
    boostedBy: ['mining'],
    recipes: [r('gold', 'Ouro', {}, {}, { gold: 5 })],
    cost: { wood: 100, stone: 80 },
    buildTime: 45,
    requiresDeposit: 'gold',
  }),
  b({
    id: 'diamond_mine',
    name: 'Mina de diamante',
    description: 'Extrai diamantes. Só perto de um depósito de diamante.',
    size: 2,
    workers: 8,
    category: 'materials',
    kinds: ALL.filter((k) => k !== 'outpost'),
    boostedBy: ['mining'],
    recipes: [r('diamond', 'Diamante', {}, { diamond: 0.6 })],
    cost: { wood: 120, stone: 120 },
    goldCost: 50,
    buildTime: 60,
    requiresDeposit: 'diamond',
  }),
  b({
    id: 'charcoal_kiln',
    name: 'Carvoaria',
    description: 'Queima madeira e faz carvão para a fundição.',
    size: 1,
    workers: 2,
    category: 'industry',
    kinds: CIVIL,
    boostedBy: ['industrial'],
    recipes: [r('charcoal', 'Carvão', { wood: 8 }, { charcoal: 6 })],
    cost: { wood: 30, stone: 20 },
    buildTime: 18,
  }),
  b({
    id: 'foundry',
    name: 'Fundição',
    description: 'Ferro e carvão viram aço.',
    size: 2,
    workers: 4,
    category: 'industry',
    kinds: ['capital', 'city', 'castle'],
    boostedBy: ['industrial'],
    recipes: [r('steel', 'Aço', { iron: 6, charcoal: 6 }, { steel: 4 })],
    cost: { wood: 80, stone: 120 },
    goldCost: 30,
    buildTime: 45,
  }),
  b({
    id: 'tannery',
    name: 'Curtume',
    description: 'Gado vira couro para escudos e máquinas de cerco.',
    size: 1,
    workers: 2,
    category: 'industry',
    kinds: ['village', 'city'],
    districts: ['agricultural', 'industrial'],
    boostedBy: ['industrial'],
    recipes: [r('leather', 'Couro', { cattle: 1 }, { leather: 4 })],
    cost: { wood: 40, stone: 20 },
    buildTime: 20,
  }),
  b({
    id: 'weaver',
    name: 'Tecelagem',
    description: 'Lã vira tecido; tecido vira estandartes.',
    size: 2,
    workers: 3,
    category: 'industry',
    kinds: ['city'],
    boostedBy: ['industrial'],
    recipes: [r('cloth', 'Tecido', { wool: 6 }, { cloth: 4 }), r('banner', 'Estandarte', { cloth: 4 }, { banner: 1 })],
    cost: { wood: 60, stone: 30 },
    buildTime: 30,
  }),
  b({
    id: 'jeweler',
    name: 'Joalheiro',
    description: 'Diamante e ouro viram joias de alto valor.',
    size: 1,
    workers: 2,
    category: 'industry',
    kinds: ['capital', 'city'],
    boostedBy: ['commercial'],
    recipes: [r('jewels', 'Joias', { diamond: 1 }, { jewels: 1 }, { gold: -10 })],
    cost: { wood: 40, stone: 60 },
    goldCost: 40,
    buildTime: 35,
  }),
  b({
    id: 'storehouse',
    name: 'Armazém',
    description: 'Aumenta o limite de cada recurso e esconde parte deles dos saqueadores.',
    size: 2,
    workers: 1,
    category: 'materials',
    kinds: ALL,
    cost: { wood: 60, stone: 40 },
    buildTime: 25,
    storage: 500,
  }),
  // Militar
  b({
    id: 'blacksmith',
    name: 'Ferreiro',
    description: 'Forja armas, armaduras, escudos, bestas e itens de aço.',
    size: 2,
    workers: 4,
    category: 'military',
    kinds: CIVIL,
    boostedBy: ['industrial'],
    recipes: [
      r('weapon', 'Armas', { iron: 4, wood: 2 }, { weapon: 2 }),
      r('armor', 'Armaduras', { iron: 6 }, { armor: 2 }),
      r('shield', 'Escudos', { wood: 3, leather: 2 }, { shield: 2 }),
      r('crossbow', 'Bestas', { wood: 3, steel: 2 }, { crossbow: 2 }),
      r('steelWeapon', 'Armas de aço', { steel: 4, wood: 2 }, { steelWeapon: 2 }),
      r('steelArmor', 'Armaduras de aço', { steel: 6 }, { steelArmor: 2 }),
    ],
    cost: { wood: 60, stone: 50 },
    buildTime: 30,
  }),
  b({
    id: 'fletcher',
    name: 'Flecheiro',
    description: 'Faz arcos com madeira.',
    size: 1,
    workers: 2,
    category: 'military',
    kinds: CIVIL,
    boostedBy: ['industrial'],
    recipes: [r('bow', 'Arcos', { wood: 4 }, { bow: 3 })],
    cost: { wood: 40, stone: 10 },
    buildTime: 18,
  }),
  b({
    id: 'stable',
    name: 'Estábulo',
    description: 'Cria cavalos com aveia.',
    size: 2,
    workers: 3,
    category: 'military',
    kinds: CIVIL,
    boostedBy: ['military'],
    recipes: [r('horse', 'Cavalos', { oats: 8 }, { horse: 1 })],
    cost: { wood: 70, stone: 30 },
    buildTime: 30,
  }),
  b({
    id: 'barracks',
    name: 'Quartel',
    description: 'Recruta soldados. O nível acelera o treino.',
    size: 2,
    workers: 2,
    category: 'military',
    kinds: ALL,
    boostedBy: ['military'],
    cost: { wood: 60, stone: 50 },
    buildTime: 30,
  }),
  b({
    id: 'training_ground',
    name: 'Campo de treino',
    description: 'A guarnição ganha experiência sem lutar.',
    size: 2,
    workers: 2,
    category: 'military',
    kinds: ['castle', 'city'],
    boostedBy: ['military'],
    cost: { wood: 50, stone: 30 },
    buildTime: 25,
  }),
  b({
    id: 'siege_workshop',
    name: 'Oficina de cerco',
    description: 'Constrói aríetes, catapultas, escadas e torres de cerco.',
    size: 3,
    workers: 5,
    category: 'military',
    kinds: ['city', 'castle'],
    boostedBy: ['industrial'],
    cost: { wood: 120, stone: 60 },
    goldCost: 40,
    buildTime: 50,
  }),
  b({
    id: 'infirmary',
    name: 'Enfermaria',
    description: 'Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças.',
    size: 2,
    workers: 3,
    category: 'military',
    kinds: CIVIL,
    cost: { wood: 50, stone: 40 },
    buildTime: 25,
  }),
  b({
    id: 'watchtower',
    name: 'Torre de vigia',
    description: 'Avisa ataques mais cedo, revela exércitos e dificulta espiões.',
    size: 1,
    workers: 1,
    category: 'military',
    kinds: ALL,
    boostedBy: ['fortress'],
    cost: { wood: 30, stone: 30 },
    buildTime: 15,
  }),
  b({
    id: 'dungeon',
    name: 'Masmorra',
    description: 'Guarda prisioneiros para pedir resgate.',
    size: 2,
    workers: 2,
    category: 'military',
    kinds: ['castle', 'capital'],
    cost: { wood: 30, stone: 80 },
    buildTime: 30,
  }),
  // Vida e cultura
  b({
    id: 'market',
    name: 'Mercado',
    description: 'Troca recursos com taxa e envia caravanas.',
    size: 2,
    workers: 3,
    category: 'civic',
    kinds: ['capital', 'city'],
    boostedBy: ['commercial'],
    cost: { wood: 60, stone: 40 },
    buildTime: 30,
    tax: 1,
  }),
  b({
    id: 'tavern',
    name: 'Taverna',
    description: 'Contrata espiões, heróis e mercenários; contraespionagem.',
    size: 2,
    workers: 2,
    category: 'civic',
    kinds: ['capital', 'city', 'castle'],
    boostedBy: ['commercial'],
    cost: { wood: 60, stone: 30 },
    buildTime: 25,
    happiness: 2,
  }),
  b({
    id: 'chapel',
    name: 'Capela',
    description: 'Felicidade, moral e cultura. Usa cera para velas, se houver.',
    size: 2,
    workers: 2,
    category: 'civic',
    kinds: CIVIL,
    boostedBy: ['cultural'],
    recipes: [r('candles', 'Velas', { wax: 0.5 }, {})],
    cost: { wood: 40, stone: 70 },
    buildTime: 30,
    happiness: 4,
    culture: 3,
  }),
  b({
    id: 'library',
    name: 'Biblioteca',
    description: 'Gera pontos de pesquisa.',
    size: 2,
    workers: 3,
    category: 'civic',
    kinds: ['capital', 'city'],
    boostedBy: ['cultural'],
    cost: { wood: 60, stone: 60 },
    goldCost: 30,
    buildTime: 35,
    culture: 2,
  }),
  b({
    id: 'well',
    name: 'Poço',
    description: 'Reduz incêndios e doenças.',
    size: 1,
    workers: 0,
    category: 'civic',
    kinds: CIVIL,
    cost: { stone: 30 },
    buildTime: 10,
    maxLevel: 3,
  }),
  b({
    id: 'port',
    name: 'Porto',
    description: 'Pesca no mar e comércio. Só na costa.',
    size: 3,
    workers: 6,
    category: 'civic',
    kinds: ['capital', 'city', 'village'],
    boostedBy: ['commercial'],
    recipes: [r('fish', 'Peixe', {}, { fish: 18 }, { gold: 2 })],
    cost: { wood: 150, stone: 80 },
    goldCost: 40,
    buildTime: 60,
    requiresWater: true,
    tax: 1,
  }),
  b({
    id: 'statue',
    name: 'Estátua',
    description: 'Decoração: felicidade e cultura.',
    size: 1,
    workers: 0,
    category: 'civic',
    kinds: CIVIL,
    boostedBy: ['cultural'],
    cost: { stone: 60 },
    goldCost: 20,
    buildTime: 20,
    maxLevel: 3,
    happiness: 2,
    culture: 2,
  }),
  b({
    id: 'garden',
    name: 'Jardim',
    description: 'Decoração: felicidade e cultura.',
    size: 1,
    workers: 0,
    category: 'civic',
    kinds: CIVIL,
    boostedBy: ['cultural'],
    cost: { wood: 20, stone: 20 },
    buildTime: 15,
    maxLevel: 3,
    happiness: 2,
    culture: 1,
  }),
];

export const BUILDINGS = Object.fromEntries(LIST.map((d) => [d.id, d])) as Record<BuildingId, BuildingDef>;
export const BUILDING_IDS = LIST.map((d) => d.id);

/** Custo cresce 1,8x por nível; tempo cresce 1,7x. */
export const BUILD_COST_GROWTH = 1.8;
export const BUILD_TIME_GROWTH = 1.7;

export function buildCost(id: BuildingId, toLevel: number): { items: Stock; gold: number } {
  const def = BUILDINGS[id];
  const f = Math.pow(BUILD_COST_GROWTH, toLevel - 1);
  const items: Stock = {};
  for (const k in def.cost) {
    const item = k as ItemId;
    items[item] = Math.round((def.cost[item] ?? 0) * f);
  }
  return { items, gold: Math.round((def.goldCost ?? 0) * f) };
}

export function buildTime(id: BuildingId, toLevel: number): number {
  return Math.round(BUILDINGS[id].buildTime * Math.pow(BUILD_TIME_GROWTH, toLevel - 1));
}

/** Trabalhadores necessários num nível. */
export function workersAt(id: BuildingId, level: number): number {
  const base = BUILDINGS[id].workers;
  return base === 0 ? 0 : Math.round(base * (1 + 0.5 * (level - 1)));
}

/** Multiplicador de produção por nível. */
export function levelOutput(level: number): number {
  return 1 + 0.6 * (level - 1);
}
