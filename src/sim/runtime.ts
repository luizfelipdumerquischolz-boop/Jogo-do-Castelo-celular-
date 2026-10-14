// Dados derivados do estado que não vão para o save (são recalculados ao carregar).
import { BALANCE } from './data/balance';
import { MAP_SIZE, getMap, type MoveContext } from './map';
import type { Army, GameState, Hero, Nation, Settlement } from './types';

export interface Runtime {
  ctx: MoveContext;
  /** Dono de cada casa do mapa (-1 = ninguém). */
  owner: Int16Array;
  /** Assentamento que reivindica cada casa (-1 = nenhum). */
  claim: Int32Array;
  territoryDirty: boolean;
  explored: Uint8Array;
  /** Casas visíveis agora para o jogador. */
  visible: Uint8Array;
  settlements: Map<number, Settlement>;
  armies: Map<number, Army>;
  nations: Map<number, Nation>;
  heroes: Map<number, Hero>;
  landOwned: Map<number, number>;
  roadsVersion: number;
}

const cache = new WeakMap<GameState, Runtime>();

class RuntimeImpl implements Runtime {
  ctx: MoveContext;
  territoryDirty = true;
  settlements = new Map<number, Settlement>();
  armies = new Map<number, Army>();
  nations = new Map<number, Nation>();
  heroes = new Map<number, Hero>();
  landOwned = new Map<number, number>();
  roadsVersion = 0;
  private _owner?: Int16Array;
  private _claim?: Int32Array;
  private _explored?: Uint8Array;
  private _visible?: Uint8Array;
  constructor(private state: GameState) {
    this.ctx = { roads: new Set(state.roads), bridges: new Set(state.bridges), forestCut: new Set(state.forestCut) };
  }
  get owner(): Int16Array {
    return (this._owner ??= new Int16Array(MAP_SIZE * MAP_SIZE).fill(-1));
  }
  get claim(): Int32Array {
    return (this._claim ??= new Int32Array(MAP_SIZE * MAP_SIZE).fill(-1));
  }
  get explored(): Uint8Array {
    return (this._explored ??= decodeBits(this.state.explored));
  }
  set explored(v: Uint8Array) {
    this._explored = v;
  }
  get visible(): Uint8Array {
    return (this._visible ??= new Uint8Array(MAP_SIZE * MAP_SIZE));
  }
}

export function rt(state: GameState): Runtime {
  let r = cache.get(state);
  if (!r) {
    r = new RuntimeImpl(state);
    cache.set(state, r);
    reindex(state);
  }
  return r;
}

export function reindex(state: GameState): void {
  const r = rt(state);
  r.settlements.clear();
  for (const s of state.settlements) r.settlements.set(s.id, s);
  r.armies.clear();
  for (const a of state.armies) r.armies.set(a.id, a);
  r.nations.clear();
  for (const n of state.nations) r.nations.set(n.id, n);
  r.heroes.clear();
  for (const h of state.heroes) r.heroes.set(h.id, h);
}

export function settlementById(state: GameState, id: number | null | undefined): Settlement | undefined {
  if (id == null) return undefined;
  const r = rt(state);
  let s = r.settlements.get(id);
  if (!s || !state.settlements.includes(s)) {
    s = state.settlements.find((x) => x.id === id);
    if (s) r.settlements.set(id, s);
  }
  return s;
}

export function armyById(state: GameState, id: number | null | undefined): Army | undefined {
  if (id == null) return undefined;
  const r = rt(state);
  let a = r.armies.get(id);
  if (!a || !state.armies.includes(a)) {
    a = state.armies.find((x) => x.id === id);
    if (a) r.armies.set(id, a);
    else r.armies.delete(id);
  }
  return a;
}

export function nationById(state: GameState, id: number): Nation {
  return state.nations[id];
}

export function heroById(state: GameState, id: number | null | undefined): Hero | undefined {
  if (id == null) return undefined;
  return state.heroes.find((h) => h.id === id);
}

/** Recalcula o território de todos os reinos a partir dos assentamentos. */
export function updateTerritory(state: GameState): void {
  const r = rt(state);
  if (!r.territoryDirty) return;
  r.territoryDirty = false;
  const m = getMap();
  const N = MAP_SIZE;
  const best = new Float32Array(N * N).fill(Infinity);
  r.owner.fill(-1);
  r.claim.fill(-1);
  for (const s of state.settlements) {
    if (s.kind === 'camp' || s.ruinedFor > 0) continue;
    const rad = s.kind === 'tribal' ? 3 + state.nations[s.nation].tribeLevel : BALANCE.claimRadius[s.kind] ?? 5;
    const weight = s.kind === 'capital' ? 0.85 : 1;
    for (let oy = -rad; oy <= rad; oy++) {
      for (let ox = -rad; ox <= rad; ox++) {
        const x = s.x + ox;
        const y = s.y + oy;
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const d = Math.hypot(ox, oy);
        if (d > rad) continue;
        const i = y * N + x;
        if (m.base[i] === 0) continue;
        const score = d * weight;
        if (score < best[i]) {
          best[i] = score;
          r.owner[i] = s.nation;
          r.claim[i] = s.id;
        }
      }
    }
  }
  r.landOwned.clear();
  for (let i = 0; i < N * N; i++) {
    const o = r.owner[i];
    if (o >= 0) r.landOwned.set(o, (r.landOwned.get(o) ?? 0) + 1);
  }
}

export function markTerritoryDirty(state: GameState): void {
  rt(state).territoryDirty = true;
}

export function syncMoveContext(state: GameState): void {
  const r = rt(state);
  r.ctx.roads = new Set(state.roads);
  r.ctx.bridges = new Set(state.bridges);
  r.ctx.forestCut = new Set(state.forestCut);
  r.roadsVersion++;
}

// Bitmap de exploração <-> base64 (save leve).
export function encodeBits(bits: Uint8Array): string {
  const packed = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) if (bits[i]) packed[i >> 3] |= 1 << (i & 7);
  let s = '';
  for (let i = 0; i < packed.length; i++) s += String.fromCharCode(packed[i]);
  return btoa(s);
}

export function decodeBits(b64: string): Uint8Array {
  const out = new Uint8Array(MAP_SIZE * MAP_SIZE);
  if (!b64) return out;
  const s = atob(b64);
  for (let i = 0; i < out.length; i++) {
    const byte = s.charCodeAt(i >> 3);
    if (byte & (1 << (i & 7))) out[i] = 1;
  }
  return out;
}
