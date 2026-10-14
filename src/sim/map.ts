// O Continente X: mapa fixo de 256 × 256 casas, gerado sempre igual a partir de uma
// semente de desenho. Só os depósitos, acampamentos e tribos mudam a cada partida.
import { fbm, makeNoise, mulberry } from './rng';

export const MAP_SIZE = 256;
export const DESIGN_SEED = 7331;
export const CRADLE_COUNT = 5;

export const BASE_SEA = 0;
export const BASE_GRASS = 1;
export const BASE_DIRT = 2;
export const BASE_SAND = 3;
export const BASE_SNOW = 4;

export const RELIEF_NONE = 0;
export const RELIEF_HILL = 1;
export const RELIEF_MOUNTAIN = 2;

export const VEG_NONE = 0;
export const VEG_FOREST = 1;
export const VEG_WOODS = 2;
export const VEG_MARSH = 3;

export const RIVER_NONE = 0;
export const RIVER = 1;
export const RIVER_FORD = 2;

export const REGION_CRADLE = 0;
export const REGION_NEAR = 1;
export const REGION_WILD = 2;

export const REGION_NAMES = ['Berço', 'Terras próximas', 'Terras selvagens'];

export interface WorldMap {
  size: number;
  base: Uint8Array;
  relief: Uint8Array;
  veg: Uint8Array;
  river: Uint8Array;
  region: Uint8Array;
  pass: Uint8Array;
  coast: Uint8Array;
  cradleOf: Int8Array;
  cradles: { x: number; y: number }[];
  landCount: number;
}

export const idx = (x: number, y: number) => y * MAP_SIZE + x;
export const tileX = (i: number) => i % MAP_SIZE;
export const tileY = (i: number) => Math.floor(i / MAP_SIZE);
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE;

let cached: WorldMap | null = null;

export function getMap(): WorldMap {
  if (!cached) cached = generateMap();
  return cached;
}

function generateMap(): WorldMap {
  const N = MAP_SIZE;
  const size = N * N;
  const base = new Uint8Array(size);
  const relief = new Uint8Array(size);
  const veg = new Uint8Array(size);
  const river = new Uint8Array(size);
  const region = new Uint8Array(size);
  const pass = new Uint8Array(size);
  const coast = new Uint8Array(size);
  const cradleOf = new Int8Array(size);
  const nShape = makeNoise(DESIGN_SEED);
  const nHeight = makeNoise(DESIGN_SEED + 1);
  const nVeg = makeNoise(DESIGN_SEED + 2);
  const nWiggle = makeNoise(DESIGN_SEED + 3);
  const nSoil = makeNoise(DESIGN_SEED + 4);
  const rnd = mulberry(DESIGN_SEED);
  const cx = N / 2;
  const cy = N / 2;

  // Berços: o do jogador ao sul, os rivais em volta.
  const cradles: { x: number; y: number }[] = [];
  for (let k = 0; k < CRADLE_COUNT; k++) {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / CRADLE_COUNT;
    cradles.push({ x: Math.round(cx + Math.cos(a) * 78), y: Math.round(cy + Math.sin(a) * 78) });
  }

  // 1. Forma do continente.
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const dx = (x - cx) / (N * 0.47);
      const dy = (y - cy) / (N * 0.47);
      const e = 1 - (dx * dx + dy * dy);
      let land = fbm(nShape, x / 38, y / 38) * 0.55 + e * 0.75 > 0.5;
      for (const c of cradles) {
        if ((x - c.x) ** 2 + (y - c.y) ** 2 < 30 * 30) land = true;
      }
      if (x < 6 || y < 6 || x >= N - 6 || y >= N - 6) land = false;
      base[i] = land ? BASE_GRASS : BASE_SEA;
    }
  }

  // Remove ilhas pequenas: mantém só a terra conectada ao berço do jogador.
  {
    const seen = new Uint8Array(size);
    const start = cradles[0].y * N + cradles[0].x;
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % N;
      const y = (i / N) | 0;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + ox;
        const ny = y + oy;
        if (!inBounds(nx, ny)) continue;
        const j = ny * N + nx;
        if (!seen[j] && base[j] !== BASE_SEA) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    for (let i = 0; i < size; i++) if (!seen[i]) base[i] = BASE_SEA;
  }

  // 2. Cordilheiras entre os berços, com passagens.
  const passRadii = [54, 90];
  for (let k = 0; k < CRADLE_COUNT; k++) {
    const a = Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / CRADLE_COUNT;
    for (let rad = 26; rad < 130; rad += 0.5) {
      const w = (nWiggle(rad / 12, k * 10) - 0.5) * 14;
      const px = cx + Math.cos(a) * rad + Math.cos(a + Math.PI / 2) * w;
      const py = cy + Math.sin(a) * rad + Math.sin(a + Math.PI / 2) * w;
      const isPass = passRadii.some((p) => Math.abs(rad - p) < 3);
      for (let oy = -4; oy <= 4; oy++) {
        for (let ox = -4; ox <= 4; ox++) {
          const x = Math.round(px + ox);
          const y = Math.round(py + oy);
          if (!inBounds(x, y)) continue;
          const i = y * N + x;
          if (base[i] === BASE_SEA) continue;
          const d = Math.hypot(ox, oy);
          if (isPass) {
            if (d <= 2.5) pass[i] = 1;
            else if (d <= 4 && relief[i] < RELIEF_HILL) relief[i] = RELIEF_HILL;
            continue;
          }
          if (d <= 1.8) relief[i] = RELIEF_MOUNTAIN;
          else if (d <= 4 && relief[i] < RELIEF_HILL) relief[i] = RELIEF_HILL;
        }
      }
    }
  }

  // 3. Montanhas e colinas soltas nas terras selvagens e próximas.
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (base[i] === BASE_SEA || pass[i]) continue;
      const nearCradle = cradles.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 < 22 * 22);
      const h = fbm(nHeight, x / 22, y / 22);
      if (!nearCradle && h > 0.7) relief[i] = RELIEF_MOUNTAIN;
      else if (h > 0.6 && relief[i] === RELIEF_NONE) relief[i] = RELIEF_HILL;
    }
  }

  // Garante que as passagens e o centro dos berços ficam livres.
  for (let i = 0; i < size; i++) if (pass[i]) relief[i] = RELIEF_NONE;
  for (const c of cradles) {
    for (let oy = -14; oy <= 14; oy++) {
      for (let ox = -14; ox <= 14; ox++) {
        const x = c.x + ox;
        const y = c.y + oy;
        if (inBounds(x, y) && ox * ox + oy * oy <= 196) relief[y * N + x] = RELIEF_NONE;
      }
    }
  }

  // 4. Rios: descem das cordilheiras até o mar.
  for (let k = 0; k < CRADLE_COUNT; k++) {
    for (const side of [-1, 1]) {
      const a = Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / CRADLE_COUNT;
      let x = Math.round(cx + Math.cos(a) * 66 + Math.cos(a + (side * Math.PI) / 2) * 7);
      let y = Math.round(cy + Math.sin(a) * 66 + Math.sin(a + (side * Math.PI) / 2) * 7);
      const dirA = a + side * 0.55;
      let steps = 0;
      let sinceFord = 0;
      while (inBounds(x, y) && base[y * N + x] !== BASE_SEA && steps < 400) {
        const i = y * N + x;
        if (relief[i] !== RELIEF_MOUNTAIN) {
          river[i] = sinceFord > 16 ? RIVER_FORD : RIVER;
          if (river[i] === RIVER_FORD) sinceFord = 0;
          sinceFord++;
          if (relief[i] === RELIEF_HILL) relief[i] = RELIEF_NONE;
        }
        const wig = (nWiggle(steps / 9, k * 7 + side) - 0.5) * 2.2;
        const d = dirA + wig;
        const fx = Math.cos(d);
        const fy = Math.sin(d);
        if (Math.abs(fx) > Math.abs(fy) ? rnd() < 0.85 : rnd() < 0.15) x += Math.sign(fx);
        else y += Math.sign(fy);
        steps++;
      }
    }
  }

  // 5. Base: areia na costa, neve no norte alto, manchas de terra.
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (base[i] === BASE_SEA) continue;
      let nearSea = false;
      for (let oy = -1; oy <= 1 && !nearSea; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (inBounds(nx, ny) && base[ny * N + nx] === BASE_SEA) {
            nearSea = true;
            break;
          }
        }
      }
      if (nearSea) {
        base[i] = BASE_SAND;
        coast[i] = 1;
      } else if (y < 70 && (relief[i] === RELIEF_MOUNTAIN || fbm(nSoil, x / 15, y / 15) > 0.62)) base[i] = BASE_SNOW;
      else if (fbm(nSoil, x / 10 + 50, y / 10) > 0.64) base[i] = BASE_DIRT;
    }
  }
  // Costa estendida: terra a até 3 casas do mar conta como litoral.
  for (let pass2 = 0; pass2 < 2; pass2++) {
    const add: number[] = [];
    for (let i = 0; i < size; i++) {
      if (base[i] === BASE_SEA || coast[i]) continue;
      const x = i % N;
      const y = (i / N) | 0;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => inBounds(x + ox, y + oy) && coast[(y + oy) * N + x + ox])) add.push(i);
    }
    for (const i of add) coast[i] = 2;
  }

  // 6. Vegetação.
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (base[i] === BASE_SEA || river[i] || relief[i] === RELIEF_MOUNTAIN || pass[i]) continue;
      const v = fbm(nVeg, x / 14, y / 14);
      const nearCradleCenter = cradles.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 < 7 * 7);
      if (nearCradleCenter) continue;
      if (v > 0.63) veg[i] = VEG_FOREST;
      else if (v > 0.55) veg[i] = VEG_WOODS;
      else if (v < 0.3 && base[i] === BASE_GRASS && relief[i] === RELIEF_NONE) {
        const cradleDist = Math.min(...cradles.map((c) => Math.hypot(x - c.x, y - c.y)));
        if (cradleDist > 40) veg[i] = VEG_MARSH;
      }
    }
  }

  // 7. Regiões.
  let landCount = 0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      let best = 0;
      let bestD = Infinity;
      cradles.forEach((c, k) => {
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      cradleOf[i] = best;
      region[i] = bestD < 26 ? REGION_CRADLE : bestD < 46 ? REGION_NEAR : REGION_WILD;
      if (base[i] !== BASE_SEA) landCount++;
    }
  }

  return { size: N, base, relief, veg, river, region, pass, coast, cradleOf, cradles, landCount };
}

export function isLand(m: WorldMap, i: number): boolean {
  return m.base[i] !== BASE_SEA;
}

/** Casa onde dá para construir um assentamento. */
export function isBuildable(m: WorldMap, i: number): boolean {
  return m.base[i] !== BASE_SEA && m.relief[i] !== RELIEF_MOUNTAIN && !m.river[i] && m.veg[i] !== VEG_MARSH;
}

export interface MoveContext {
  roads: Set<number>;
  bridges: Set<number>;
  forestCut: Set<number>;
}

/** Custo de entrar numa casa (Infinity = intransponível). */
export function moveCost(m: WorldMap, i: number, ctx: MoveContext): number {
  if (m.base[i] === BASE_SEA) return Infinity;
  if (m.relief[i] === RELIEF_MOUNTAIN) return Infinity;
  let c = 1;
  if (m.river[i] === RIVER) c = ctx.bridges.has(i) ? 1 : 4;
  else if (m.river[i] === RIVER_FORD) c = 1.6;
  if (m.relief[i] === RELIEF_HILL) c *= 1.6;
  const v = ctx.forestCut.has(i) ? VEG_NONE : m.veg[i];
  if (v === VEG_FOREST) c *= 2;
  else if (v === VEG_WOODS) c *= 1.4;
  else if (v === VEG_MARSH) c *= 3;
  if (m.base[i] === BASE_SNOW) c *= 1.4;
  if (ctx.roads.has(i)) c *= 0.55;
  return c;
}

export function describeTile(m: WorldMap, i: number): string {
  if (m.base[i] === BASE_SEA) return 'Mar';
  const parts: string[] = [];
  if (m.relief[i] === RELIEF_MOUNTAIN) parts.push('Montanha');
  else if (m.relief[i] === RELIEF_HILL) parts.push('Colina');
  if (m.river[i] === RIVER) parts.push('Rio');
  if (m.river[i] === RIVER_FORD) parts.push('Vau');
  if (m.veg[i] === VEG_FOREST) parts.push('Floresta');
  if (m.veg[i] === VEG_WOODS) parts.push('Bosque');
  if (m.veg[i] === VEG_MARSH) parts.push('Pântano');
  if (m.pass[i]) parts.push('Passagem');
  if (!parts.length) parts.push(['Mar', 'Campo', 'Terra', 'Areia', 'Neve'][m.base[i]]);
  return parts.join(', ');
}
