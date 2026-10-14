// Todos os bens que existem no jogo: materiais, alimentos e itens militares.

export const ITEM_IDS = [
  // materiais brutos
  'wood',
  'stone',
  'iron',
  'diamond',
  'wheat',
  'oats',
  'barley',
  'grapes',
  'cattle',
  'milk',
  'wool',
  'wax',
  // processados
  'flour',
  'charcoal',
  'steel',
  'leather',
  'cloth',
  'jewels',
  // alimentos
  'bread',
  'porridge',
  'meat',
  'fish',
  'eggs',
  'cheese',
  'vegetables',
  'fruit',
  'beer',
  'wine',
  'honey',
  // itens militares
  'weapon',
  'armor',
  'shield',
  'crossbow',
  'steelWeapon',
  'steelArmor',
  'bow',
  'horse',
  'banner',
] as const;

export type ItemId = (typeof ITEM_IDS)[number];
export type Stock = Partial<Record<ItemId, number>>;

export type ItemKind = 'material' | 'food' | 'military';
export type FoodGroup = 'energy' | 'protein' | 'vitamins' | 'pleasure';

export interface ItemDef {
  name: string;
  kind: ItemKind;
  /** Grupo alimentar (só alimentos). */
  group?: FoodGroup;
  /** Fração que estraga por minuto no armazém (alimentos frescos). */
  spoil?: number;
  /** Valor de referência em ouro, usado no mercado. */
  value: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  wood: { name: 'Madeira', kind: 'material', value: 1 },
  stone: { name: 'Pedra', kind: 'material', value: 1.2 },
  iron: { name: 'Ferro', kind: 'material', value: 2 },
  diamond: { name: 'Diamante', kind: 'material', value: 25 },
  wheat: { name: 'Trigo', kind: 'material', value: 0.8 },
  oats: { name: 'Aveia', kind: 'material', value: 0.8 },
  barley: { name: 'Cevada', kind: 'material', value: 0.8 },
  grapes: { name: 'Uva', kind: 'material', value: 1, spoil: 0.01 },
  cattle: { name: 'Gado', kind: 'material', value: 4 },
  milk: { name: 'Leite', kind: 'material', value: 0.8, spoil: 0.02 },
  wool: { name: 'Lã', kind: 'material', value: 1.5 },
  wax: { name: 'Cera', kind: 'material', value: 2 },
  flour: { name: 'Farinha', kind: 'material', value: 1.2 },
  charcoal: { name: 'Carvão', kind: 'material', value: 1.5 },
  steel: { name: 'Aço', kind: 'material', value: 5 },
  leather: { name: 'Couro', kind: 'material', value: 3 },
  cloth: { name: 'Tecido', kind: 'material', value: 3 },
  jewels: { name: 'Joias', kind: 'material', value: 60 },
  bread: { name: 'Pão', kind: 'food', group: 'energy', value: 1.5, spoil: 0.004 },
  porridge: { name: 'Mingau', kind: 'food', group: 'energy', value: 1.2, spoil: 0.006 },
  meat: { name: 'Carne', kind: 'food', group: 'protein', value: 2.5, spoil: 0.012 },
  fish: { name: 'Peixe', kind: 'food', group: 'protein', value: 2, spoil: 0.015 },
  eggs: { name: 'Ovos', kind: 'food', group: 'protein', value: 1.5, spoil: 0.008 },
  cheese: { name: 'Queijo', kind: 'food', group: 'protein', value: 2.5, spoil: 0.002 },
  vegetables: { name: 'Legumes', kind: 'food', group: 'vitamins', value: 1.2, spoil: 0.01 },
  fruit: { name: 'Frutas', kind: 'food', group: 'vitamins', value: 1.5, spoil: 0.012 },
  beer: { name: 'Cerveja', kind: 'food', group: 'pleasure', value: 2, spoil: 0.001 },
  wine: { name: 'Vinho', kind: 'food', group: 'pleasure', value: 4, spoil: 0 },
  honey: { name: 'Mel', kind: 'food', group: 'pleasure', value: 3, spoil: 0 },
  weapon: { name: 'Arma', kind: 'military', value: 6 },
  armor: { name: 'Armadura', kind: 'military', value: 8 },
  shield: { name: 'Escudo', kind: 'military', value: 6 },
  crossbow: { name: 'Besta', kind: 'military', value: 12 },
  steelWeapon: { name: 'Arma de aço', kind: 'military', value: 14 },
  steelArmor: { name: 'Armadura de aço', kind: 'military', value: 18 },
  bow: { name: 'Arco', kind: 'military', value: 4 },
  horse: { name: 'Cavalo', kind: 'military', value: 15 },
  banner: { name: 'Estandarte', kind: 'military', value: 10 },
};

export const FOOD_IDS = ITEM_IDS.filter((i) => ITEMS[i].kind === 'food');
export const FOOD_GROUPS: FoodGroup[] = ['energy', 'protein', 'vitamins', 'pleasure'];
export const FOOD_GROUP_NAMES: Record<FoodGroup, string> = {
  energy: 'Energia',
  protein: 'Proteína',
  vitamins: 'Vitaminas',
  pleasure: 'Prazer',
};

export function stockGet(s: Stock, id: ItemId): number {
  return s[id] ?? 0;
}

export function stockAdd(s: Stock, id: ItemId, n: number): void {
  const v = (s[id] ?? 0) + n;
  if (v <= 1e-9) delete s[id];
  else s[id] = v;
}

export function hasItems(s: Stock, cost: Stock, times = 1): boolean {
  for (const k in cost) {
    const id = k as ItemId;
    if (stockGet(s, id) + 1e-9 < (cost[id] ?? 0) * times) return false;
  }
  return true;
}

export function takeItems(s: Stock, cost: Stock, times = 1): void {
  for (const k in cost) {
    const id = k as ItemId;
    stockAdd(s, id, -(cost[id] ?? 0) * times);
  }
}
