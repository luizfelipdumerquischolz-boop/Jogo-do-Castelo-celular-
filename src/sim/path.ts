import { MAP_SIZE, getMap, moveCost, type MoveContext } from './map';

/** Fila de prioridade mínima simples (heap binário). */
class Heap {
  private items: number[] = [];
  private prio: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, p: number) {
    const a = this.items;
    const pr = this.prio;
    a.push(item);
    pr.push(p);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (pr[parent] <= pr[i]) break;
      [a[i], a[parent]] = [a[parent], a[i]];
      [pr[i], pr[parent]] = [pr[parent], pr[i]];
      i = parent;
    }
  }
  pop(): number {
    const a = this.items;
    const pr = this.prio;
    const top = a[0];
    const lastI = a.pop()!;
    const lastP = pr.pop()!;
    if (a.length) {
      a[0] = lastI;
      pr[0] = lastP;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && pr[l] < pr[m]) m = l;
        if (r < a.length && pr[r] < pr[m]) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        [pr[i], pr[m]] = [pr[m], pr[i]];
        i = m;
      }
    }
    return top;
  }
}

const N = MAP_SIZE;
const DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, 1.414],
  [1, -1, 1.414],
  [-1, 1, 1.414],
  [-1, -1, 1.414],
];

let gScore = new Float32Array(N * N);
let came = new Int32Array(N * N);
let stamp = new Uint32Array(N * N);
let curStamp = 0;

/**
 * Caminho mais barato entre duas casas (A* com 8 direções).
 * Retorna a lista de casas a partir da seguinte à origem, ou null se não houver caminho.
 * `maxNodes` limita o trabalho para não travar.
 */
export function findPath(fromX: number, fromY: number, toX: number, toY: number, ctx: MoveContext, maxNodes = 40000): number[] | null {
  const m = getMap();
  const start = fromY * N + fromX;
  const goal = toY * N + toX;
  if (start === goal) return [];
  if (moveCost(m, goal, ctx) === Infinity) return null;
  curStamp++;
  if (curStamp === 0xffffffff) {
    stamp = new Uint32Array(N * N);
    gScore = new Float32Array(N * N);
    came = new Int32Array(N * N);
    curStamp = 1;
  }
  const open = new Heap();
  stamp[start] = curStamp;
  gScore[start] = 0;
  came[start] = -1;
  open.push(start, 0);
  let expanded = 0;
  const closedStamp = curStamp;
  const closed = new Set<number>();
  while (open.size) {
    const cur = open.pop();
    if (cur === goal) break;
    if (closed.has(cur)) continue;
    closed.add(cur);
    if (++expanded > maxNodes) return null;
    const cx = cur % N;
    const cy = (cur / N) | 0;
    const gc = gScore[cur];
    for (const [dx, dy, dl] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx;
      const c = moveCost(m, ni, ctx);
      if (c === Infinity) continue;
      // Não corta cantos entre duas casas intransponíveis.
      if (dx && dy && (moveCost(m, cy * N + nx, ctx) === Infinity || moveCost(m, ny * N + cx, ctx) === Infinity)) continue;
      const ng = gc + c * dl;
      if (stamp[ni] !== closedStamp || ng < gScore[ni]) {
        stamp[ni] = closedStamp;
        gScore[ni] = ng;
        came[ni] = cur;
        const h = Math.hypot(toX - nx, toY - ny) * 0.55;
        open.push(ni, ng + h);
      }
    }
  }
  if (stamp[goal] !== closedStamp) return null;
  const path: number[] = [];
  let c = goal;
  while (c !== start && c !== -1) {
    path.push(c);
    c = came[c];
  }
  path.reverse();
  return path;
}

/** Custo total de um caminho (para estimar tempo de viagem). */
export function pathCost(path: number[], ctx: MoveContext): number {
  const m = getMap();
  let s = 0;
  for (const i of path) s += moveCost(m, i, ctx);
  return s;
}
