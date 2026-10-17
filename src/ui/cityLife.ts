// Vida na cidade: cidadãos andando, carregadores, guardas, crianças, fumaça,
// estações e noite. É só enfeite visual: não muda nada na simulação.
import { BUILDINGS, type BuildingId } from '../sim/data/buildings';
import { buildingAt, garrisonOf, usableBounds } from '../sim/settlement';
import type { GameState, PlacedBuilding, Settlement } from '../sim/types';
import { children, isNight, population, season } from '../sim/util';
import { art } from '../art/loader';

type Kind = 'campones' | 'camponesa' | 'carregador-saco' | 'carregador-tora' | 'guarda' | 'crianca';

interface Walker {
  kind: Kind;
  path: { x: number; y: number }[];
  i: number;
  x: number;
  y: number;
  speed: number;
  t: number;
  loop: boolean;
  /** Parado no lugar (treino no quartel): balança em vez de andar. */
  drill?: boolean;
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

/** O que cada produtor manda para o armazém (define o carregador). */
function carrierFor(type: BuildingId): Kind | null {
  const def = BUILDINGS[type];
  if (!def.recipes.length) return null;
  const outs = def.recipes.flatMap((r) => Object.keys(r.output));
  if (outs.includes('wood')) return 'carregador-tora';
  return 'carregador-saco';
}

export interface SpriteBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class CityLife {
  private walkers: Walker[] = [];
  private smoke: Particle[] = [];
  private weather: Particle[] = [];
  private grid: Uint8Array | null = null;
  private gridKey = '';
  private sid = -1;
  private spawnIn = 0;
  private last = 0;
  private rnd = 1;

  private rand(): number {
    this.rnd = (this.rnd * 16807) % 2147483647;
    return (this.rnd - 1) / 2147483646;
  }

  /** Avança a animação. `dt` em segundos reais. */
  update(st: GameState, s: Settlement, now: number, boxes: Map<number, SpriteBox>, cw: number, ch: number): void {
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    if (this.sid !== s.id) {
      this.sid = s.id;
      this.walkers = [];
      this.smoke = [];
      this.rnd = 1 + s.id * 7919;
    }
    this.ensureGrid(s);

    // Mantém a quantidade certa de gente na rua.
    const want = this.targetCounts(st, s);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = 0.35;
      for (const kind of Object.keys(want) as Kind[]) {
        const have = this.walkers.filter((w) => w.kind === kind).length;
        if (have < want[kind]!) {
          const w = this.spawn(st, s, kind);
          if (w) this.walkers.push(w);
          break;
        }
      }
    }
    for (const w of this.walkers) this.step(w, dt);
    this.walkers = this.walkers.filter((w) => w.loop || w.drill || w.i < w.path.length);

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

  private targetCounts(st: GameState, s: Settlement): Partial<Record<Kind, number>> {
    const pop = population(s);
    const total = Math.min(30, Math.ceil(pop / 5));
    const kids = Math.min(6, Math.round((children(s) / Math.max(1, pop)) * total));
    const workers = s.buildings.filter((b) => b.level > 0 && b.workers > 0);
    const producers = workers.filter((b) => carrierFor(b.type));
    const carriers = Math.min(8, producers.length ? Math.round(total * 0.3) : 0);
    const people = Math.max(0, total - kids - carriers);
    const g = garrisonOf(st, s);
    const soldiers = g ? Object.values(g.troops).reduce((a, b) => a + (b ?? 0), 0) : 0;
    const guards = Math.min(6, Math.ceil(soldiers / 6));
    return {
      campones: Math.ceil(people / 2),
      camponesa: Math.floor(people / 2),
      'carregador-saco': Math.ceil(carriers / 2),
      'carregador-tora': Math.floor(carriers / 2),
      crianca: kids,
      guarda: guards,
    };
  }

  // Grade de passagem ------------------------------------------------------------

  private ensureGrid(s: Settlement): void {
    const b = usableBounds(s);
    const key = `${b.x0},${b.y0},${b.x1},${b.y1}|${s.buildings.map((x) => `${x.x},${x.y},${x.type}`).join(';')}`;
    if (key === this.gridKey) return;
    this.gridKey = key;
    const W = 40;
    const g = new Uint8Array(W * W);
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) if (!buildingAt(s, x, y)) g[y * W + x] = 1;
    this.grid = g;
    // Quem estava andando por onde agora há construção some e reaparece depois.
    this.walkers = this.walkers.filter((w) => w.drill || w.loop || w.path.slice(w.i).every((p) => this.free(Math.floor(p.x), Math.floor(p.y))));
  }

  private free(x: number, y: number): boolean {
    return !!this.grid && x >= 0 && y >= 0 && x < 40 && y < 40 && this.grid[y * 40 + x] === 1;
  }

  /** Casa livre colada na construção (a "porta"), de preferência na frente. */
  private door(b: PlacedBuilding): { x: number; y: number } | null {
    const n = BUILDINGS[b.type].size;
    const cand: [number, number][] = [];
    for (let i = 0; i < n; i++) cand.push([b.x + n, b.y + i], [b.x + i, b.y + n], [b.x - 1, b.y + i], [b.x + i, b.y - 1]);
    for (const [x, y] of cand) if (this.free(x, y)) return { x, y };
    return null;
  }

  private route(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }[] | null {
    const W = 40;
    const prev = new Int32Array(W * W).fill(-1);
    const start = a.y * W + a.x;
    const goal = b.y * W + b.x;
    prev[start] = start;
    const q = [start];
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      if (i === goal) break;
      const x = i % W;
      const y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const j = ny * W + nx;
        if (this.free(nx, ny) && prev[j] < 0) {
          prev[j] = i;
          q.push(j);
        }
      }
    }
    if (prev[goal] < 0) return null;
    const out: { x: number; y: number }[] = [];
    for (let i = goal; i !== start; i = prev[i]) out.push({ x: (i % W) + 0.5, y: ((i / W) | 0) + 0.5 });
    out.push({ x: a.x + 0.5, y: a.y + 0.5 });
    return out.reverse();
  }

  private pick<T>(list: T[]): T | undefined {
    return list.length ? list[Math.floor(this.rand() * list.length)] : undefined;
  }

  private spawn(st: GameState, s: Settlement, kind: Kind): Walker | null {
    const built = s.buildings.filter((b) => b.level > 0);
    const homes = built.filter((b) => b.type === 'house' || b.type === 'keep' || b.type === 'governor_hall');
    const jobs = built.filter((b) => b.workers > 0);
    const stores = built.filter((b) => b.type === 'storehouse' || b.type === 'keep' || b.type === 'governor_hall' || b.type === 'market');
    let from: PlacedBuilding | undefined;
    let to: PlacedBuilding | undefined;
    const wk: Walker = { kind, path: [], i: 0, x: 0, y: 0, speed: 0.9 + this.rand() * 0.4, t: this.rand() * 10, loop: false, face: 1 };
    if (kind === 'guarda') {
      const barracks = built.find((b) => b.type === 'barracks' || b.type === 'training_ground');
      const drills = this.walkers.filter((w) => w.drill).length;
      if (barracks && drills < 3) {
        const d = this.door(barracks);
        if (!d) return null;
        wk.drill = true;
        wk.x = d.x + 0.2 + this.rand() * 0.6;
        wk.y = d.y + 0.2 + this.rand() * 0.6;
        wk.face = this.rand() < 0.5 ? 1 : -1;
        return wk;
      }
      // Ronda junto à muralha, por dentro.
      const bd = usableBounds(s);
      const ring: { x: number; y: number }[] = [];
      for (let x = bd.x0; x < bd.x1; x++) ring.push({ x: x + 0.5, y: bd.y0 + 0.5 });
      for (let y = bd.y0; y < bd.y1; y++) ring.push({ x: bd.x1 - 0.5, y: y + 0.5 });
      for (let x = bd.x1 - 1; x >= bd.x0; x--) ring.push({ x: x + 0.5, y: bd.y1 - 0.5 });
      for (let y = bd.y1 - 1; y >= bd.y0; y--) ring.push({ x: bd.x0 + 0.5, y: y + 0.5 });
      const off = Math.floor(this.rand() * ring.length);
      wk.path = ring.slice(off).concat(ring.slice(0, off));
      wk.loop = true;
      wk.speed = 0.6;
      wk.x = wk.path[0].x;
      wk.y = wk.path[0].y;
      return wk;
    }
    if (kind === 'carregador-saco' || kind === 'carregador-tora') {
      from = this.pick(jobs.filter((b) => carrierFor(b.type) === kind));
      to = this.pick(stores);
    } else if (kind === 'crianca') {
      from = this.pick(homes);
      to = this.pick(homes.length > 1 ? homes.filter((h) => h !== from) : jobs);
      wk.speed = 1.4;
    } else {
      // Metade vai de casa para o trabalho, metade volta.
      const h = this.pick(homes);
      const j = this.pick(jobs);
      [from, to] = this.rand() < 0.5 ? [h, j] : [j, h];
    }
    if (!from || !to || from === to) return null;
    const a = this.door(from);
    const b = this.door(to);
    if (!a || !b) return null;
    const p = this.route(a, b);
    if (!p || p.length < 2) return null;
    wk.path = p;
    wk.x = p[0].x;
    wk.y = p[0].y;
    void st;
    return wk;
  }

  private step(w: Walker, dt: number): void {
    w.t += dt;
    if (w.drill) return;
    if (w.loop && w.i >= w.path.length) w.i = 0;
    let move = w.speed * dt;
    while (move > 0 && w.i < w.path.length) {
      const p = w.path[w.i];
      const dx = p.x - w.x;
      const dy = p.y - w.y;
      const d = Math.hypot(dx, dy);
      if (d <= move) {
        w.x = p.x;
        w.y = p.y;
        w.i++;
        move -= d;
        if (w.loop && w.i >= w.path.length) w.i = 0;
      } else {
        w.x += (dx / d) * move;
        w.y += (dy / d) * move;
        move = 0;
      }
      // Na tela isométrica, ir para +x ou -y anda para a direita.
      const sx = dx - dy;
      if (Math.abs(sx) > 0.01) w.face = sx > 0 ? 1 : -1;
    }
  }

  // Desenho ----------------------------------------------------------------------

  /** Itens com profundidade, para entrar na ordenação junto com as construções. */
  people(toScreen: (x: number, y: number) => { x: number; y: number }, tw: number): { depth: number; draw: (c: CanvasRenderingContext2D) => void }[] {
    return this.walkers.map((w) => ({
      depth: w.x + w.y - 0.5,
      draw: (c: CanvasRenderingContext2D) => {
        const p = toScreen(w.x, w.y);
        const frame = w.drill ? (Math.sin(w.t * 6) > 0 ? 2 : 1) : w.i >= w.path.length && !w.loop ? 1 : ((Math.floor(w.t * 6) % 2) + 2);
        const img = art(`cidadao-${w.kind}-${frame}`);
        const size = tw * (w.kind === 'crianca' ? 0.36 : 0.44);
        const bob = w.drill ? 0 : Math.abs(Math.sin(w.t * 12)) * size * 0.03;
        c.save();
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.beginPath();
        c.ellipse(p.x, p.y, size * 0.22, size * 0.09, 0, 0, Math.PI * 2);
        c.fill();
        c.translate(p.x, p.y - bob);
        if (w.face < 0) c.scale(-1, 1);
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
