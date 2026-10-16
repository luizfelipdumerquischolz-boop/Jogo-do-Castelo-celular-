// Nomes originais do Continente X.

export const CONTINENT_NAME = 'Continente X';
export const OTHER_CONTINENT_NAME = 'Continente Y';

export interface RivalTemplate {
  nation: string;
  ruler: string;
  capital: string;
  color: string;
}

export const RIVALS: RivalTemplate[] = [
  { nation: 'Ducado de Pedravelha', ruler: 'Lorde Aldren', capital: 'Pedravelha', color: '#8e44ad' },
  { nation: 'Marca do Vale Cinzento', ruler: 'Dama Ysolde', capital: 'Vale Cinzento', color: '#c0392b' },
  { nation: 'Baronato de Brumafria', ruler: 'Barão Corvino', capital: 'Brumafria', color: '#16a085' },
  { nation: 'Principado de Aurenvale', ruler: 'Princesa Sabela', capital: 'Aurenvale', color: '#d68910' },
];

export const PLAYER_COLOR = '#2f6fb3';
export const TRIBE_COLOR = '#7f6a4d';
export const BANDIT_COLOR = '#5d5d5d';
export const HORDE_COLOR = '#2c3e50';

const SYL_A = ['Bra', 'Cor', 'Dun', 'Esc', 'Fal', 'Gor', 'Har', 'Ir', 'Kar', 'Lo', 'Mor', 'Nor', 'Os', 'Pra', 'Quel', 'Ro', 'Sar', 'Tor', 'Ul', 'Var', 'Zan'];
const SYL_B = ['ga', 'ra', 'le', 'mi', 'do', 'nu', 'ta', 'si', 'ro', 'va', 'el', 'an', 'or'];
const SYL_C = ['dor', 'mar', 'vale', 'via', 'bur', 'lem', 'ster', 'nho', 'ral', 'gard', 'fim', 'rio', 'nte'];

const TRIBE_A = ['Lobo', 'Urso', 'Corvo', 'Javali', 'Falcão', 'Cervo', 'Serpente', 'Touro', 'Raposa', 'Águia', 'Lince', 'Texugo'];
const TRIBE_B = ['Cinzento', 'Rubro', 'Negro', 'das Pedras', 'do Gelo', 'das Brumas', 'Ferido', 'Uivante', 'da Colina', 'do Pântano', 'Velho', 'Dourado'];

const BANDIT_A = ['Covil', 'Toca', 'Esconderijo', 'Acampamento', 'Refúgio', 'Ninho'];
const BANDIT_B = ['dos Ratos de Estrada', 'da Garra Torta', 'do Lobo Magro', 'da Mata Escura', 'dos Sem-Nome', 'do Olho Vazado', 'dos Cães Soltos', 'da Ponte Quebrada', 'dos Encapuzados', 'da Adaga Fina'];

const HERO_FIRST = ['Aldo', 'Bruna', 'Caio', 'Dália', 'Edmar', 'Fausta', 'Gil', 'Helena', 'Ivo', 'Joana', 'Lúcio', 'Mirela', 'Nuno', 'Olga', 'Paio', 'Rosa', 'Sancho', 'Teresa', 'Ulrico', 'Vera'];
const HERO_LAST = ['do Rochedo', 'Mão-de-Ferro', 'o Sereno', 'da Ponte', 'Barba-Ruiva', 'a Astuta', 'do Moinho', 'Olho-de-Falcão', 'o Velho', 'da Serra', 'Pé-Ligeiro', 'a Justa'];

export function pick<T>(list: readonly T[], r: number): T {
  return list[Math.floor(r * list.length) % list.length];
}

export function placeName(r1: number, r2: number, r3: number): string {
  return pick(SYL_A, r1) + pick(SYL_B, r2) + pick(SYL_C, r3);
}

export function tribeName(r1: number, r2: number): string {
  return `Tribo do ${pick(TRIBE_A, r1)} ${pick(TRIBE_B, r2)}`;
}

export function banditName(r1: number, r2: number): string {
  return `${pick(BANDIT_A, r1)} ${pick(BANDIT_B, r2)}`;
}

const FEMALE = new Set(['Bruna', 'Dália', 'Fausta', 'Helena', 'Joana', 'Mirela', 'Olga', 'Rosa', 'Teresa', 'Vera']);
const EPITHET_F: Record<string, string> = { 'o Sereno': 'a Serena', 'o Velho': 'a Velha' };
const EPITHET_M: Record<string, string> = { 'a Astuta': 'o Astuto', 'a Justa': 'o Justo' };

/** Retrato do herói (1–8): mulheres usam os pares, homens os ímpares. */
export function heroPortrait(name: string, id: number): number {
  const female = FEMALE.has(name.split(' ')[0]);
  return (id % 4) * 2 + (female ? 2 : 1);
}

export function heroName(r1: number, r2: number): string {
  const first = pick(HERO_FIRST, r1);
  const last = pick(HERO_LAST, r2);
  const fixed = FEMALE.has(first) ? EPITHET_F[last] ?? last : EPITHET_M[last] ?? last;
  return `${first} ${fixed}`;
}
