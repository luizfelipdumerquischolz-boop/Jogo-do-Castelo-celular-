// Vida na cidade: moradores com casa e profissão, carregadores, guardas e crianças,
// fumaça, estações e noite. É só enfeite visual: não muda nada na simulação.
//
// Regras dos moradores:
// - Cada morador tem uma casa e, se for adulto, um trabalho (o padeiro trabalha na padaria,
//   o moleiro no moinho...). Guardas moram no quartel (ou na Torre).
// - Ninguém aparece nem some do nada: todo mundo sai de uma construção e entra em outra.
//   Enquanto está dentro de uma construção, o morador não aparece na tela.
// - De dia vão trabalhar; à noite voltam para casa. Quem trabalha numa produção leva a
//   mercadoria ao armazém de vez em quando. Crianças brincam entre as casas.
// - No máximo 30 moradores na cidade (1 para cada 5 habitantes).
import { BUILDINGS, type BuildingId } from '../sim/data/buildings';
import { buildingAt, garrisonOf, usableBounds } from '../sim/settlement';
import type { GameState, PlacedBuilding, Settlement } from '../sim/types';
import { children, isNight, population, season } from '../sim/util';
import { art } from '../art/loader';

export const MAX_CITIZENS = 30;

type Kind = 'campones' | 'camponesa' | 'carregador-saco' | 'carregador-tora' | 'guarda' | 'crianca';
type Role = 'worker' | 'child' | 'guard';
type Pt = { x: number; y: number };

interface Agent {
  id: number;
  role: Role;
  female: boolean;
  home: number;
  job: number | null;
  /** Construção onde está agora (invisível) ou null se está andando. */
  inside: number | null;
  wait: number;
  /** Caminho atual: sai da borda de uma construção e termina na borda de outra. */
  path: Pt[];
  i: number;
  /** Distância andada e total do caminho (para aparecer e sumir suavemente nas portas). */
  walked: number;
  length: number;
  dest: number | null;
  carrying: 'saco' | 'tora' | null;
  /** O que fazer ao chegar. */
  next: 'work' | 'home' | 'store' | 'back-to-work' | 'play' | 'patrol-end' | 'drill-start';
  /** O caminho começa na borda de uma construção (aparece aos poucos ao sair). */
  fadeIn: boolean;
  base: number;
  /** Parado treinando na porta do quartel. */
  drill: number;
  x: number;
  y: number;
  speed: number;
  t: number;
  face: 1 | -1;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

/** Construções que soltam fumaça pela chaminé. */
const SMOKE: Partial<Record<BuildingId, number>> = {
  bakery: 1,
  blacksmith: 1.4,
  foundry: 1.8,
  kitchen: 1,
  charcoal_kiln: 1.6,
  brewery: 1,
  house: 0.35,
  dairy: 0.5,
  butcher: 0.5,
  tavern: 0.7,
};

/** O que o trabalhador leva ao armazém. */
function cargoOf(type: BuildingId): 'saco' | 'tora' | null {
  const def = BUILDINGS[type];
  if (!def.recipes.length) return null;
  const outs = def.recipes.flatMap((r) => Object.keys(r.output));
  return outs.includes('wood') || outs.includes('charcoal') ? 'tora' : 'saco';
}

export interface SpriteBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Door {
  /** Casa livre na frente da porta. */
  x: number;
  y: number;
  /** Ponto na borda da construção (onde o morador entra/sai). */
  ex: number;
  ey: number;
}

const GRID = 40;

export class CityLife {
  private agents: Agent[] = [];
  private smoke: Particle[] = [];
  private weather: Particle[] = [];
  private grid: Uint8Array | null = null;
  private gridKey = '';
  private doors = new Map<number, Door | null>();
  private sid = -1;
  private last = 0;
  private rnd = 1;
  private nextId = 1;
  private buildings = new Map<number, PlacedBuilding>();

  private rand(): number {
    this.rnd = (this.rnd * 16807) % 2147483647;
    return (this.rnd - 1) / 2147483646;
  }

  /** Moradores (para testes). */
  debugAgents(): readonly { inside: number | null; x: number; y: number }[] {
    return this.agents;
  }

  /** Quantos moradores estão andando na rua agora (para testes). */
  visibleCount(): number {
    return this.agents.filter((a) => a.inside == null).length;
  }

  /** Avança a animação. */
  update(st: GameState, s: Settlement, now: number, boxes: Map<number, SpriteBox>, cw: number, ch: number): void {
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    if (this.sid !== s.id) {
      this.sid = s.id;
      this.agents = [];
      this.smoke = [];
      this.rnd = 1 + s.id * 7919;
      this.gridKey = '';
    }
    this.buildings = new Map(s.buildings.map((b) => [b.id, b]));
    this.ensureGrid(s);
    this.population(st, s);
    const night = isNight(st.time);
    for (const a of this.agents) this.think(a, s, night, dt);

    // Fumaça das chaminés.
    for (const b of s.buildings) {
      const rate = SMOKE[b.type];
      const box = boxes.get(b.id);
      if (!rate || !box || b.level === 0 || b.efficiency <= 0.05) continue;
      if (this.rand() < rate * dt * 2.2) {
        this.smoke.push({ x: box.x + box.w * (0.55 + this.rand() * 0.12), y: box.y + box.h * 0.12, vx: 4 + this.rand() * 6, vy: -14 - this.rand() * 8, life: 0, max: 2.4 + this.rand(), size: box.w * 0.08 });
      }
    }
    for (const p of this.smoke) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.smoke = this.smoke.filter((p) => p.life < p.max).slice(-160);

    // Neve no inverno, folhas no outono.
    const se = season(st.time);
    const target = se === 3 ? 90 : se === 2 ? 22 : 0;
    while (this.weather.length < target) {
      this.weather.push({ x: this.rand() * cw, y: this.rand() * ch, vx: 0, vy: 0, life: this.rand() * 10, max: 0, size: se === 3 ? 1.2 + this.rand() * 1.8 : 3 + this.rand() * 2 });
    }
    if (this.weather.length > target) this.weather.length = target;
    for (const p of this.weather) {
      p.life += dt;
      if (se === 3) {
        p.y += (22 + p.size * 8) * dt;
        p.x += Math.sin(p.life * 1.3 + p.size) * 10 * dt;
      } else {
        p.y += 26 * dt;
        p.x += Math.sin(p.life * 2 + p.size) * 30 * dt;
      }
      if (p.y > ch + 8) {
        p.y = -8;
        p.x = this.rand() * cw;
      }
      if (p.x < -8) p.x = cw + 8;
      if (p.x > cw + 8) p.x = -8;
    }
  }

  // Moradores ---------------------------------------------------------------------

  /** Mantém a lista de moradores do tamanho certo, com casa e trabalho válidos. */
  private population(st: GameState, s: Settlement): void {
    const built = s.buildings.filter((b) => b.level > 0);
    const homes = built.filter((b) => b.type === 'house');
    const hall = built.find((b) => b.type === 'keep' || b.type === 'governor_hall');
    const homeList = homes.length ? homes : hall ? [hall] : [];
    const barracks = built.find((b) => b.type === 'barracks' || b.type === 'training_ground') ?? hall;
    const slots: PlacedBuilding[] = [];
    for (const b of built) {
      if (b.workers <= 0 || b.type === 'barracks' || b.type === 'training_ground') continue;
      for (let i = 0; i < b.workers; i++) slots.push(b);
    }
    if (!homeList.length) {
      this.agents = this.agents.filter((a) => a.inside == null);
      return;
    }
    const pop = population(s);
    const total = Math.min(MAX_CITIZENS, Math.ceil(pop / 5));
    const g = garrisonOf(st, s);
    const soldiers = g ? Object.values(g.troops).reduce((p, q) => p + (q ?? 0), 0) : 0;
    const guards = barracks ? Math.min(4, Math.ceil(soldiers / 8), total) : 0;
    const kids = Math.min(5, Math.round((children(s) / Math.max(1, pop)) * total), total - guards);
    const workers = Math.max(0, total - guards - kids);
    const want: Role[] = [...Array(guards).fill('guard'), ...Array(kids).fill('child'), ...Array(workers).fill('worker')];

    // Remove só quem está dentro de uma construção (ninguém some no meio da rua).
    for (const role of ['guard', 'child', 'worker'] as Role[]) {
      let extra = this.agents.filter((a) => a.role === role).length - want.filter((r) => r === role).length;
      for (let k = this.agents.length - 1; k >= 0 && extra > 0; k--) {
        const a = this.agents[k];
        if (a.role === role && a.inside != null) {
          this.agents.splice(k, 1);
          extra--;
        }
      }
    }
    // Novos moradores nascem dentro de casa.
    for (const role of ['guard', 'child', 'worker'] as Role[]) {
      let missing = want.filter((r) => r === role).length - this.agents.filter((a) => a.role === role).length;
      while (missing-- > 0) {
        const home = role === 'guard' ? barracks! : homeList[this.agents.length % homeList.length];
        this.agents.push({
          id: this.nextId++,
          role,
          female: this.rand() < 0.5,
          home: home.id,
          job: null,
          inside: home.id,
          wait: 1 + this.rand() * 12,
          path: [],
          i: 0,
          walked: 0,
          length: 0,
          dest: null,
          carrying: null,
          next: 'work',
          drill: 0,
          x: 0,
          y: 0,
          speed: 1,
          base: role === 'child' ? 1.3 : 0.85 + this.rand() * 0.3,
          fadeIn: true,
          t: this.rand() * 10,
          face: 1,
        });
      }
    }
    // Casa e trabalho sempre válidos (construções demolidas ou movidas).
    let w = 0;
    for (const a of this.agents) {
      if (!this.buildings.has(a.home) || (a.role === 'guard' && barracks && a.home !== barracks.id && a.inside !== a.home)) {
        a.home = (a.role === 'guard' ? barracks : homeList[a.id % homeList.length])!.id;
      }
      if (a.role === 'worker') {
        const job = slots.length ? slots[Math.floor((w++ * slots.length) / Math.max(1, workers))] ?? slots[0] : null;
        if (a.job == null || !this.buildings.has(a.job) || (a.inside !== a.job && job && !slots.some((b) => b.id === a.job))) a.job = job ? job.id : null;
      }
      if (a.inside != null && !this.buildings.has(a.inside)) a.inside = a.home;
    }
  }

  private think(a: Agent, s: Settlement, night: boolean, dt: number): void {
    a.t += dt;
    if (a.inside != null) {
      a.wait -= dt;
      if (a.wait > 0) return;
      this.decide(a, s, night);
      return;
    }
    if (a.drill > 0) {
      a.drill -= dt;
      if (a.drill <= 0) this.walkTo(a, a.home, 'home');
      return;
    }
    // Se uma construção nova ocupou o caminho, a pessoa entra nela e segue depois.
    const tx = Math.floor(a.x);
    const ty = Math.floor(a.y);
    const here = buildingAt(s, tx, ty);
    if (here && a.walked > 0.6 && a.length - a.walked > 0.6) {
      this.enter(a, here.id, 0.5 + this.rand());
      return;
    }
    let move = a.speed * dt;
    while (move > 0 && a.i < a.path.length) {
      const p = a.path[a.i];
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const d = Math.hypot(dx, dy);
      const sx = dx - dy;
      if (Math.abs(sx) > 0.01) a.face = sx > 0 ? 1 : -1;
      if (d <= move) {
        a.x = p.x;
        a.y = p.y;
        a.i++;
        move -= d;
        a.walked += d;
      } else {
        a.x += (dx / d) * move;
        a.y += (dy / d) * move;
        a.walked += move;
        move = 0;
      }
    }
    if (a.i >= a.path.length) this.arrive(a);
  }

  /** O que fazer ao sair de dentro de uma construção. */
  private decide(a: Agent, s: Settlement, night: boolean): void {
    const at = a.inside!;
    const built = s.buildings.filter((b) => b.level > 0);
    if (a.role === 'guard') {
      if (at !== a.home) return this.goTo(a, a.home, 'home');
      if (night && this.rand() < 0.6) return this.stay(a, 6, 12);
      if (this.rand() < 0.4) {
        // Treino na porta do quartel.
        const d = this.door(at);
        if (!d) return this.stay(a, 5, 10);
        this.leave(a, at, [{ x: d.x + 0.2 + this.rand() * 0.6, y: d.y + 0.2 + this.rand() * 0.6 }], 'drill-start', null);
        return;
      }
      return this.patrol(a, s);
    }
    if (a.role === 'child') {
      if (night) return at === a.home ? this.stay(a, 8, 15) : this.goTo(a, a.home, 'home');
      if (at !== a.home) return this.goTo(a, a.home, 'home');
      const spots = built.filter((b) => b.id !== at && ['house', 'garden', 'statue', 'market', 'well', 'vegetable_garden', 'chapel'].includes(b.type));
      const spot = spots[Math.floor(this.rand() * spots.length)];
      return spot ? this.goTo(a, spot.id, 'play') : this.stay(a, 6, 12);
    }
    // Trabalhador.
    if (night) {
      if (at === a.home) return this.stay(a, 8, 16);
      const tavern = built.find((b) => b.type === 'tavern');
      if (tavern && at !== tavern.id && this.rand() < 0.25) return this.goTo(a, tavern.id, 'home');
      return this.goTo(a, a.home, 'home');
    }
    if (a.job == null) {
      // Sem trabalho: passeia até o mercado, a capela ou o poço e volta.
      if (at !== a.home) return this.goTo(a, a.home, 'home');
      const spots = built.filter((b) => ['market', 'chapel', 'well', 'tavern', 'garden'].includes(b.type));
      const spot = spots[Math.floor(this.rand() * spots.length)];
      return spot && this.rand() < 0.5 ? this.goTo(a, spot.id, 'play') : this.stay(a, 8, 16);
    }
    if (at === a.job) {
      const job = this.buildings.get(a.job);
      const cargo = job ? cargoOf(job.type) : null;
      const stores = built.filter((b) => b.type === 'storehouse' || b.type === 'keep' || b.type === 'governor_hall');
      if (cargo && stores.length && this.rand() < 0.55) {
        const store = stores[Math.floor(this.rand() * stores.length)];
        a.carrying = cargo;
        return this.goTo(a, store.id, 'back-to-work');
      }
      if (this.rand() < 0.3) return this.goTo(a, a.home, 'home');
      return this.stay(a, 6, 14);
    }
    if (at !== a.home && a.next === 'back-to-work') {
      a.carrying = null;
      return this.goTo(a, a.job, 'work');
    }
    return this.goTo(a, a.job, 'work');
  }

  private stay(a: Agent, min: number, max: number): void {
    a.wait = min + this.rand() * (max - min);
  }

  private enter(a: Agent, id: number, wait: number): void {
    a.inside = id;
    a.wait = wait;
    a.path = [];
    a.drill = 0;
  }

  private arrive(a: Agent): void {
    if (a.next === 'drill-start') {
      a.drill = 8 + this.rand() * 8;
      return;
    }
    if (a.dest == null || !this.buildings.has(a.dest)) {
      // A construção de destino sumiu: anda até a casa.
      if (!this.walkTo(a, a.home, 'home') && !this.walkTo(a, [...this.buildings.keys()][0], 'home')) a.drill = 2;
      return;
    }
    const what = a.next;
    const wait = what === 'work' ? 10 + this.rand() * 12 : what === 'home' ? 6 + this.rand() * 10 : what === 'back-to-work' ? 1.5 + this.rand() * 2 : 3 + this.rand() * 6;
    if (what === 'back-to-work') a.carrying = null;
    this.enter(a, a.dest, wait);
    // Ao sair do armazém, o carregador volta para o trabalho.
    a.next = what === 'back-to-work' ? 'back-to-work' : what;
  }

  /** Anda (já na rua) até uma construção. Devolve false se não houver caminho. */
  private walkTo(a: Agent, dest: number | undefined, next: Agent['next']): boolean {
    if (dest == null) return false;
    const d = this.door(dest);
    const here = this.nearestFree({ x: Math.floor(a.x), y: Math.floor(a.y) });
    const r = d && here ? this.route(here, d) : null;
    if (!d || !r) return false;
    a.path = [...r, { x: d.ex, y: d.ey }];
    a.i = 0;
    a.walked = 0;
    a.length = this.pathLength(a);
    a.dest = dest;
    a.next = next;
    a.fadeIn = false;
    a.drill = 0;
    a.speed = a.base;
    return true;
  }

  private pathLength(a: Agent): number {
    let len = 0;
    let px = a.x;
    let py = a.y;
    for (const p of a.path) {
      len += Math.hypot(p.x - px, p.y - py);
      px = p.x;
      py = p.y;
    }
    return len;
  }

  /** Sai da construção atual e anda até outra. */
  private goTo(a: Agent, dest: number, next: Agent['next']): void {
    const from = a.inside;
    const fromB = from != null ? this.buildings.get(from) : undefined;
    const toB = this.buildings.get(dest);
    if (!fromB || !toB || from === dest) return this.stay(a, 3, 6);
    const d1 = this.door(fromB.id);
    const d2 = this.door(toB.id);
    if (!d1 || !d2) return this.stay(a, 4, 8);
    const mid = this.route(d1, d2);
    if (!mid) return this.stay(a, 4, 8);
    this.leave(a, fromB.id, [...mid, { x: d2.ex, y: d2.ey }], next, dest);
  }

  private leave(a: Agent, from: number, rest: Pt[], next: Agent['next'], dest: number | null): void {
    const d = this.door(from)!;
    a.path = [{ x: d.x + 0.5, y: d.y + 0.5 }, ...rest];
    a.x = d.ex;
    a.y = d.ey;
    a.i = 0;
    a.walked = 0;
    a.length = this.pathLength(a);
    a.inside = null;
    a.next = next;
    a.dest = dest;
    a.drill = 0;
    a.fadeIn = true;
    a.speed = a.base;
  }

  /** Ronda: sai do quartel, passa pelos 4 cantos de dentro da muralha e volta. */
  private patrol(a: Agent, s: Settlement): void {
    const bd = usableBounds(s);
    const corners: Pt[] = [
      { x: bd.x0, y: bd.y0 },
      { x: bd.x1 - 1, y: bd.y0 },
      { x: bd.x1 - 1, y: bd.y1 - 1 },
      { x: bd.x0, y: bd.y1 - 1 },
    ].map((c) => this.nearestFree(c) ?? c);
    const home = a.inside!;
    const d = this.door(home);
    if (!d) return this.stay(a, 5, 10);
    const start = Math.floor(this.rand() * 4);
    let cur: Pt = { x: d.x, y: d.y };
    const pts: Pt[] = [];
    for (let k = 0; k <= 4; k++) {
      const c = corners[(start + k) % 4];
      const r = this.route(cur, c);
      if (!r) return this.stay(a, 5, 10);
      pts.push(...r.slice(1));
      cur = c;
    }
    const back = this.route(cur, d);
    if (!back) return this.stay(a, 5, 10);
    pts.push(...back.slice(1), { x: d.ex, y: d.ey });
    this.leave(a, home, pts, 'patrol-end', home);
    a.speed = 0.6;
  }

  // Grade de passagem ------------------------------------------------------------

  private ensureGrid(s: Settlement): void {
    const b = usableBounds(s);
    const key = `${b.x0},${b.y0},${b.x1},${b.y1}|${s.buildings.map((x) => `${x.id}:${x.x},${x.y}`).join(';')}`;
    if (key === this.gridKey) return;
    this.gridKey = key;
    const g = new Uint8Array(GRID * GRID);
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) if (!buildingAt(s, x, y)) g[y * GRID + x] = 1;
    this.grid = g;
    this.doors.clear();
  }

  private free(x: number, y: number): boolean {
    return !!this.grid && x >= 0 && y >= 0 && x < GRID && y < GRID && this.grid[y * GRID + x] === 1;
  }

  private nearestFree(p: Pt): Pt | null {
    for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (this.free(p.x + dx, p.y + dy)) return { x: p.x + dx, y: p.y + dy };
    return null;
  }

  /** Porta da construção: casa livre colada nela, de preferência na frente (lado de baixo da tela). */
  private door(id: number): Door | null {
    if (this.doors.has(id)) return this.doors.get(id)!;
    const b = this.buildings.get(id);
    let found: Door | null = null;
    if (b) {
      const n = BUILDINGS[b.type].size;
      const mid = Math.floor(n / 2);
      const cand: [number, number, number, number][] = [];
      // Frente (x+n e y+n), depois os lados de trás.
      for (let i = 0; i < n; i++) {
        const k = (mid + i) % n;
        cand.push([b.x + n, b.y + k, b.x + n, b.y + k + 0.5], [b.x + k, b.y + n, b.x + k + 0.5, b.y + n]);
      }
      for (let i = 0; i < n; i++) cand.push([b.x - 1, b.y + i, b.x, b.y + i + 0.5], [b.x + i, b.y - 1, b.x + i + 0.5, b.y]);
      for (const [x, y, ex, ey] of cand) {
        if (this.free(x, y)) {
          found = { x, y, ex, ey };
          break;
        }
      }
    }
    this.doors.set(id, found);
    return found;
  }

  private route(a: Pt, b: Pt): Pt[] | null {
    const prev = new Int32Array(GRID * GRID).fill(-1);
    const start = a.y * GRID + a.x;
    const goal = b.y * GRID + b.x;
    if (!this.free(a.x, a.y) || !this.free(b.x, b.y)) return null;
    prev[start] = start;
    const q = [start];
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      if (i === goal) break;
      const x = i % GRID;
      const y = (i / GRID) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const j = ny * GRID + nx;
        if (this.free(nx, ny) && prev[j] < 0) {
          prev[j] = i;
          q.push(j);
        }
      }
    }
    if (prev[goal] < 0) return null;
    const out: Pt[] = [];
    for (let i = goal; i !== start; i = prev[i]) out.push({ x: (i % GRID) + 0.5, y: ((i / GRID) | 0) + 0.5 });
    out.push({ x: a.x + 0.5, y: a.y + 0.5 });
    return out.reverse();
  }

  // Desenho ----------------------------------------------------------------------

  private kindOf(a: Agent): Kind {
    if (a.role === 'guard') return 'guarda';
    if (a.role === 'child') return 'crianca';
    if (a.carrying === 'tora') return 'carregador-tora';
    if (a.carrying === 'saco') return 'carregador-saco';
    return a.female ? 'camponesa' : 'campones';
  }

  /** Itens com profundidade, para entrar na ordenação junto com as construções. */
  people(toScreen: (x: number, y: number) => { x: number; y: number }, tw: number): { depth: number; draw: (c: CanvasRenderingContext2D) => void }[] {
    return this.agents
      .filter((a) => a.inside == null)
      .map((a) => ({
        depth: a.x + a.y - 0.5,
        draw: (c: CanvasRenderingContext2D) => {
          const p = toScreen(a.x, a.y);
          const kind = this.kindOf(a);
          const moving = a.drill <= 0;
          const frame = !moving ? (Math.sin(a.t * 6) > 0 ? 2 : 1) : (Math.floor(a.t * 6) % 2) + 2;
          const img = art(`cidadao-${kind}-${frame}`);
          const size = tw * (kind === 'crianca' ? 0.36 : 0.44);
          const bob = moving ? Math.abs(Math.sin(a.t * 12)) * size * 0.03 : 0;
          // Aparece ao sair pela porta e some ao entrar (meia casa de transição).
          const fadeIn = a.fadeIn ? a.walked / 0.5 : 1;
          const fadeOut = a.dest != null ? (a.length - a.walked) / 0.5 : 1;
          const fade = moving ? Math.max(0, Math.min(1, fadeIn, fadeOut)) : 1;
          if (fade <= 0) return;
          c.save();
          c.globalAlpha = fade;
          c.fillStyle = 'rgba(0,0,0,0.25)';
          c.beginPath();
          c.ellipse(p.x, p.y, size * 0.22, size * 0.09, 0, 0, Math.PI * 2);
          c.fill();
          c.translate(p.x, p.y - bob);
          if (a.face < 0) c.scale(-1, 1);
          c.drawImage(img, -size / 2, -size * 0.96, size, size);
          c.restore();
        },
      }));
  }

  drawSmoke(c: CanvasRenderingContext2D): void {
    for (const p of this.smoke) {
      const k = p.life / p.max;
      const r = p.size * (0.6 + k * 1.6);
      c.fillStyle = `rgba(210,205,200,${0.45 * (1 - k)})`;
      c.beginPath();
      c.arc(p.x, p.y, r, 0, Math.PI * 2);
      c.fill();
    }
  }

  /** Neve/folhas, escuridão da noite e janelas acesas. */
  drawSky(c: CanvasRenderingContext2D, st: GameState, s: Settlement, boxes: Map<number, SpriteBox>, cw: number, ch: number): void {
    const se = season(st.time);
    if (se === 3) {
      c.fillStyle = 'rgba(235,242,255,0.12)';
      c.fillRect(0, 0, cw, ch);
    }
    if (isNight(st.time)) {
      c.fillStyle = 'rgba(14,20,52,0.42)';
      c.fillRect(0, 0, cw, ch);
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const b of s.buildings) {
        const box = boxes.get(b.id);
        if (!box || b.level === 0) continue;
        const lights = b.type === 'house' ? 1 : Math.min(3, BUILDINGS[b.type].size);
        for (let i = 0; i < lights; i++) {
          const x = box.x + box.w * (0.3 + 0.4 * ((i + 1) / (lights + 1)));
          const y = box.y + box.h * (0.6 + 0.1 * (i % 2));
          const r = box.w * 0.12;
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(255,190,90,0.55)');
          g.addColorStop(1, 'rgba(255,150,40,0)');
          c.fillStyle = g;
          c.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
      c.restore();
    }
    for (const p of this.weather) {
      if (se === 3) {
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      } else {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.life * 2);
        c.fillStyle = p.size > 4 ? '#c8641e' : '#d99a2b';
        c.beginPath();
        c.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }
  }
}
