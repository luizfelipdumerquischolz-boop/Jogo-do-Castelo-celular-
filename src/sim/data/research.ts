export type ResearchBranch = 'economy' | 'military' | 'construction' | 'administration';

export const BRANCH_NAMES: Record<ResearchBranch, string> = {
  economy: 'Economia',
  military: 'Militar',
  construction: 'Construção',
  administration: 'Administração',
};

export interface ResearchDef {
  id: string;
  name: string;
  branch: ResearchBranch;
  description: string;
  cost: number;
  requires?: string;
}

/** Pontos de pesquisa vêm das bibliotecas (por trabalhador ocupado). */
export const RESEARCH: ResearchDef[] = [
  { id: 'eco1', name: 'Rotação de culturas', branch: 'economy', description: '+10% em toda a produção.', cost: 120 },
  { id: 'eco2', name: 'Celeiros ventilados', branch: 'economy', description: '+10% de produção e alimentos estragam pela metade.', cost: 300, requires: 'eco1' },
  { id: 'eco3', name: 'Guildas de ofício', branch: 'economy', description: '+10% de produção e mercado com taxa menor.', cost: 650, requires: 'eco2' },
  { id: 'eco4', name: 'Armazéns de pedra', branch: 'economy', description: 'Armazéns guardam 50% a mais.', cost: 900, requires: 'eco3' },
  { id: 'mil1', name: 'Disciplina', branch: 'military', description: '+10% de ataque e defesa.', cost: 150 },
  { id: 'crossbows', name: 'Bestas', branch: 'military', description: 'Libera o besteiro.', cost: 280, requires: 'mil1' },
  { id: 'mil2', name: 'Marcha forçada', branch: 'military', description: 'Exércitos marcham 15% mais rápido.', cost: 350, requires: 'mil1' },
  { id: 'horse_archery', name: 'Arquearia montada', branch: 'military', description: 'Libera o arqueiro montado.', cost: 500, requires: 'mil2' },
  { id: 'heavy_cavalry', name: 'Cavalaria pesada', branch: 'military', description: 'Libera o cavaleiro pesado.', cost: 900, requires: 'horse_archery' },
  { id: 'mil3', name: 'Táticas de flanco', branch: 'military', description: '+10% de ataque e defesa.', cost: 800, requires: 'crossbows' },
  { id: 'con1', name: 'Andaimes', branch: 'construction', description: 'Constrói 20% mais rápido.', cost: 120 },
  { id: 'con2', name: 'Pedreiros mestres', branch: 'construction', description: 'Construções custam 15% menos.', cost: 300, requires: 'con1' },
  { id: 'stone_walls', name: 'Muralhas de pedra', branch: 'construction', description: 'Muralhas com 50% mais vida.', cost: 450, requires: 'con1' },
  { id: 'moat', name: 'Fosso', branch: 'construction', description: 'Libera o fosso em castelos e na capital.', cost: 600, requires: 'stone_walls' },
  { id: 'adm1', name: 'Escrivães', branch: 'administration', description: '+1 assentamento no limite e menos corrupção.', cost: 150 },
  { id: 'adm2', name: 'Cartórios', branch: 'administration', description: '+1 assentamento e impostos +10%.', cost: 400, requires: 'adm1' },
  { id: 'adm3', name: 'Escola de cônsules', branch: 'administration', description: 'Cônsules dão +10% de lealdade.', cost: 600, requires: 'adm2' },
  { id: 'adm4', name: 'Correio real', branch: 'administration', description: '+2 assentamentos; mensageiros 50% mais rápidos.', cost: 1000, requires: 'adm3' },
];

export const RESEARCH_BY_ID = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));
