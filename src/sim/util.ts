import { BALANCE, YEAR_SECONDS } from './data/balance';
import type { GameEvent, GameState, Nation, Relation, Settlement } from './types';

export const MAX_EVENTS = 120;
export const MAX_REPORTS = 80;
export const MAX_LETTERS = 150;

export function newId(state: GameState): number {
  return state.nextId++;
}

export function pushEvent(state: GameState, text: string, kind: GameEvent['kind'] = 'info', x?: number, y?: number): void {
  state.events.push({ id: newId(state), time: state.time, text, kind, x, y });
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
}

export function season(time: number): number {
  return Math.floor(time / BALANCE.seasonSeconds) % 4;
}

export function year(time: number): number {
  return Math.floor(time / YEAR_SECONDS) + 1;
}

export function isNight(time: number): boolean {
  return time % BALANCE.dayNightSeconds >= BALANCE.dayNightSeconds / 2;
}

export function relKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function relation(state: GameState, a: number, b: number): Relation {
  const key = relKey(a, b);
  let r = state.relations[key];
  if (!r) {
    r = {
      a: Math.min(a, b),
      b: Math.max(a, b),
      state: 'peace',
      truceUntil: 0,
      tribute: null,
      grudge: {},
      tension: 0,
      tensionState: 'pacific',
      borderDistance: 999,
      trade: false,
    };
    state.relations[key] = r;
  }
  return r;
}

/** Duas nações estão em luta? Bandidos e hordas são hostis a todos. */
export function isHostile(state: GameState, a: number, b: number): boolean {
  if (a === b) return false;
  const na = state.nations[a];
  const nb = state.nations[b];
  if (!na || !nb) return false;
  if (na.kind === 'bandit' || nb.kind === 'bandit' || na.kind === 'horde' || nb.kind === 'horde') return true;
  if (na.vassalOf === b || nb.vassalOf === a) return false;
  return relation(state, a, b).state === 'war';
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function playerNation(state: GameState): Nation {
  return state.nations[state.playerNation];
}

export function isPlayer(state: GameState, nation: number): boolean {
  return nation === state.playerNation;
}

// População -----------------------------------------------------------------

export function population(s: Settlement): number {
  let n = 0;
  for (const v of s.ages) n += v;
  return n;
}

export function children(s: Settlement): number {
  let n = 0;
  for (let a = 0; a < BALANCE.adultAge && a < s.ages.length; a++) n += s.ages[a];
  return n;
}

export function adults(s: Settlement): number {
  let n = 0;
  for (let a = BALANCE.adultAge; a < BALANCE.elderAge && a < s.ages.length; a++) n += s.ages[a];
  return n;
}

export function elders(s: Settlement): number {
  let n = 0;
  for (let a = BALANCE.elderAge; a < s.ages.length; a++) n += s.ages[a];
  return n;
}

/** Retira `count` adultos (para soldados ou colonos). Retorna quantos saíram. */
export function takeAdults(s: Settlement, count: number): number {
  let left = count;
  for (let a = BALANCE.adultAge; a < BALANCE.elderAge && left > 0; a++) {
    const t = Math.min(left, s.ages[a]);
    s.ages[a] -= t;
    left -= t;
  }
  return count - left;
}

/** Acrescenta adultos (colonos chegando, soldados dispensados). */
export function addAdults(s: Settlement, count: number): void {
  const span = BALANCE.elderAge - BALANCE.adultAge;
  const each = Math.floor(count / span);
  let rest = count - each * span;
  for (let a = BALANCE.adultAge; a < BALANCE.elderAge; a++) {
    s.ages[a] += each + (rest > 0 ? 1 : 0);
    rest--;
  }
}

/** Remove pessoas de todas as idades proporcionalmente (doença, fome, saque). */
export function killPeople(s: Settlement, count: number): number {
  const total = population(s);
  if (total <= 0 || count <= 0) return 0;
  let removed = 0;
  const frac = Math.min(1, count / total);
  for (let a = 0; a < s.ages.length; a++) {
    const k = Math.min(s.ages[a], Math.round(s.ages[a] * frac));
    s.ages[a] -= k;
    removed += k;
  }
  for (let a = s.ages.length - 1; a >= 0 && removed < Math.min(count, total); a--) {
    if (s.ages[a] > 0) {
      s.ages[a]--;
      removed++;
    }
  }
  return removed;
}

/** Distribuição inicial de idades para uma população. */
export function initialAges(total: number): number[] {
  const ages = new Array(BALANCE.maxAge + 1).fill(0);
  // ~25% crianças, ~62% adultos, ~13% idosos
  const kids = Math.round(total * 0.25);
  const old = Math.round(total * 0.13);
  const adult = total - kids - old;
  for (let i = 0; i < kids; i++) ages[i % BALANCE.adultAge]++;
  for (let i = 0; i < adult; i++) ages[BALANCE.adultAge + (i % (BALANCE.elderAge - BALANCE.adultAge))]++;
  for (let i = 0; i < old; i++) ages[BALANCE.elderAge + (i % 6)]++;
  return ages;
}

export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(r).padStart(2, '0')}s`;
  return `${r}s`;
}
