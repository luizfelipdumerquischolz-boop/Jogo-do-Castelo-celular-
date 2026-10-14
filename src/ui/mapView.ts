// Mapa-múndi isométrico desenhado em canvas.
// Só os blocos de 16×16 casas visíveis são percorridos; com zoom longe, usa uma
// versão simplificada (cores de terreno e território) em vez das artes.
import { UNITS, troopCount, type UnitId } from '../sim/data/units';
import {
  BASE_DIRT,
  BASE_SAND,
  BASE_SEA,
  BASE_SNOW,
  MAP_SIZE,
  RELIEF_HILL,
  RELIEF_MOUNTAIN,
  RIVER,
  RIVER_FORD,
  VEG_FOREST,
  VEG_MARSH,
  VEG_WOODS,
  getMap,
  idx,
} from '../sim/map';
import type { Army, GameState, Settlement, Traveler } from '../sim/types';
import { art } from '../art/loader';
import type { Snapshot } from '../client/core';

export const TW = 64;
export const TH = 32;
const CHUNK = 16;

export type MapHit =
  | { kind: 'settlement'; id: number }
  | { kind: 'army'; id: number }
  | { kind: 'traveler'; id: number }
  | { kind: 'tile'; x: number; y: number };

export class MapView {
  zoom = 1;
  camX = 0;
  camY = 0;
  private ctx: CanvasRenderingContext2D;
  private overview: HTMLCanvasElement | null = null;
  private overviewExplored = -1;
  private territory: HTMLCanvasElement | null = null;
  private territoryVersion = -1;
  snap: Snapshot | null = null;
  owner: Int16Array = new Int16Array(MAP_SIZE * MAP_SIZE).fill(-1);
  selected: MapHit | null = null;
  highlightTile: { x: number; y: number } | null = null;
  dirty = true;
  private dpr = 1;

  constructor(public canvas: HTMLCanvasElement, private onTap: (hit: MapHit) => void) {
    this.ctx = canvas.getContext('2d')!;
    this.bindInput();
  }

  setSnapshot(s: Snapshot): void {
    this.snap = s;
    if (s.owner) this.owner = s.owner;
    this.dirty = true;
  }

  /** Centraliza numa casa. Com `upper`, deixa o ponto no quarto de cima (um painel cobre a parte de baixo). */
  centerOn(x: number, y: number, upper = false): void {
    const p = this.iso(x + 0.5, y + 0.5);
    this.camX = p.x;
    this.camY = p.y + (upper ? ((this.ch() > 50 ? this.ch() : window.innerHeight * 0.8) * 0.27) / this.zoom : 0);
    this.dirty = true;
  }

  iso(x: number, y: number): { x: number; y: number } {
    return { x: ((x - y) * TW) / 2, y: ((x + y) * TH) / 2 };
  }

  toScreen(x: number, y: number): { x: number; y: number } {
    const p = this.iso(x, y);
    return { x: (p.x - this.camX) * this.zoom + this.cw() / 2, y: (p.y - this.camY) * this.zoom + this.ch() / 2 };
  }

  toTile(sx: number, sy: number): { x: number; y: number } {
    const ix = (sx - this.cw() / 2) / this.zoom + this.camX;
    const iy = (sy - this.ch() / 2) / this.zoom + this.camY;
    const x = (ix / (TW / 2) + iy / (TH / 2)) / 2;
    const y = (iy / (TH / 2) - ix / (TW / 2)) / 2;
    return { x, y };
  }

  private cw(): number {
    return this.canvas.width / this.dpr;
  }
  private ch(): number {
    return this.canvas.height / this.dpr;
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
    this.dirty = true;
  }

  // Entrada: arrastar, pinça e toque --------------------------------------------------------

  private bindInput(): void {
    const pts = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinchDist = 0;
    let downAt = 0;
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      downAt = performance.now();
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    c.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (pts.size === 1) {
        this.camX -= dx / this.zoom;
        this.camY -= dy / this.zoom;
        moved += Math.abs(dx) + Math.abs(dy);
      }
      p.x = e.clientX;
      p.y = e.clientY;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) this.setZoom(this.zoom * (d / pinchDist));
        pinchDist = d;
        moved += 10;
      }
      this.clampCamera();
      this.dirty = true;
    });
    const end = (e: PointerEvent) => {
      const had = pts.has(e.pointerId);
      pts.delete(e.pointerId);
      if (pts.size < 2) pinchDist = 0;
      if (had && pts.size === 0 && moved < 10 && performance.now() - downAt < 600) {
        const r = c.getBoundingClientRect();
        this.onTap(this.hitTest(e.clientX - r.left, e.clientY - r.top));
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', (e) => {
      pts.delete(e.pointerId);
    });
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 0.87));
      },
      { passive: false },
    );
  }

  setZoom(z: number): void {
    this.zoom = Math.max(0.12, Math.min(2.5, z));
    this.dirty = true;
  }

  private clampCamera(): void {
    const max = MAP_SIZE * TW;
    this.camX = Math.max(-max / 2, Math.min(max / 2, this.camX));
    this.camY = Math.max(0, Math.min(MAP_SIZE * TH, this.camY));
  }

  hitTest(sx: number, sy: number): MapHit {
    const st = this.snap?.state;
    const t = this.toTile(sx, sy);
    if (!st) return { kind: 'tile', x: Math.floor(t.x), y: Math.floor(t.y) };
    const near = (x: number, y: number, r: number) => Math.hypot(x + 0.5 - t.x, y + 0.5 - t.y) < r;
    const vis = this.snap!.visible;
    // Exércitos e viajantes (visíveis) têm prioridade.
    let best: MapHit | null = null;
    let bd = 0.9;
    for (const a of st.armies) {
      if (a.stationedAt != null) continue;
      if (a.nation !== st.playerNation && !vis[idx(Math.round(a.x), Math.round(a.y))]) continue;
      const d = Math.hypot(a.x + 0.5 - t.x, a.y + 0.5 - t.y);
      if (d < bd) {
        bd = d;
        best = { kind: 'army', id: a.id };
      }
    }
    if (best) return best;
    for (const s of st.settlements) {
      if (!this.snap!.explored[idx(s.x, s.y)]) continue;
      if (near(s.x, s.y, s.kind === 'capital' ? 1.6 : 1.2)) return { kind: 'settlement', id: s.id };
    }
    for (const tr of st.travelers) {
      if (tr.nation !== st.playerNation && !vis[idx(Math.round(tr.x), Math.round(tr.y))]) continue;
      if (near(tr.x, tr.y, 0.7)) return { kind: 'traveler', id: tr.id };
    }
    return { kind: 'tile', x: Math.floor(t.x), y: Math.floor(t.y) };
  }

  // Desenho ----------------------------------------------------------------------------------

  private buildOverview(explored: Uint8Array): void {
    const m = getMap();
    const W = MAP_SIZE * 4;
    const H = MAP_SIZE * 2;
    const c = this.overview ?? document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const col = (i: number): [number, number, number] => {
      if (!explored[i]) return [24, 18, 10];
      if (m.base[i] === BASE_SEA) return [44, 93, 143];
      if (m.relief[i] === RELIEF_MOUNTAIN) return [120, 114, 104];
      if (m.river[i]) return [63, 127, 191];
      if (m.veg[i] === VEG_FOREST) return [47, 90, 38];
      if (m.veg[i] === VEG_WOODS) return [76, 122, 50];
      if (m.veg[i] === VEG_MARSH) return [100, 115, 80];
      if (m.base[i] === BASE_SNOW) return [235, 240, 245];
      if (m.base[i] === BASE_SAND) return [220, 200, 144];
      if (m.base[i] === BASE_DIRT) return [160, 138, 90];
      if (m.relief[i] === RELIEF_HILL) return [106, 140, 64];
      return [122, 160, 74];
    };
    // Projeção isométrica de cada casa num losango 4×2.
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const [r, g, b] = col(idx(x, y));
        const px = (x - y) * 2 + W / 2;
        const py = x + y;
        for (const [ox, oy] of [[-1, 0], [0, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]]) {
          const X = px + ox;
          const Y = py + oy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const o = (Y * W + X) * 4;
          img.data[o] = r;
          img.data[o + 1] = g;
          img.data[o + 2] = b;
          img.data[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    this.overview = c;
  }

  private buildTerritory(state: GameState): void {
    const W = MAP_SIZE * 4;
    const H = MAP_SIZE * 2;
    const c = this.territory ?? document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const colors = state.nations.map((n) => hexRgb(n.color));
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const o0 = this.owner[idx(x, y)];
        if (o0 < 0) continue;
        const [r, g, b] = colors[o0] ?? [128, 128, 128];
        const border = (x + 1 < MAP_SIZE && this.owner[idx(x + 1, y)] !== o0) || (y + 1 < MAP_SIZE && this.owner[idx(x, y + 1)] !== o0) || (x > 0 && this.owner[idx(x - 1, y)] !== o0) || (y > 0 && this.owner[idx(x, y - 1)] !== o0);
        const a = border ? 220 : 60;
        const px = (x - y) * 2 + W / 2;
        const py = x + y;
        for (const [ox, oy] of [[-1, 0], [0, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]]) {
          const X = px + ox;
          const Y = py + oy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const o = (Y * W + X) * 4;
          img.data[o] = r;
          img.data[o + 1] = g;
          img.data[o + 2] = b;
          img.data[o + 3] = a;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    this.territory = c;
  }

  draw(now: number): void {
    const snap = this.snap;
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#18120a';
    c.fillRect(0, 0, this.cw(), this.ch());
    if (!snap) return;
    const st = snap.state;
    const explored = snap.explored;
    const exploredCount = countSome(explored);
    if (!this.overview || Math.abs(exploredCount - this.overviewExplored) > 40) {
      this.buildOverview(explored);
      this.overviewExplored = exploredCount;
    }
    if (snap.ownerVersion !== this.territoryVersion) {
      this.buildTerritory(st);
      this.territoryVersion = snap.ownerVersion;
    }
    const far = this.zoom < 0.42;
    if (far) this.drawOverview(c);
    else this.drawTiles(c, explored, snap.visible);
    this.drawObjects(c, st, explored, snap.visible, now, far);
    this.dirty = false;
  }

  private drawOverview(c: CanvasRenderingContext2D): void {
    // 1 casa = 4×2 px na imagem; na tela, TW×TH × zoom.
    const scale = (TW / 4) * this.zoom;
    const o = this.toScreen(0, 0);
    const x0 = o.x - (MAP_SIZE * 4 * scale) / 2;
    c.imageSmoothingEnabled = false;
    c.drawImage(this.overview!, x0, o.y, MAP_SIZE * 4 * scale, MAP_SIZE * 2 * scale);
    if (this.territory) c.drawImage(this.territory, x0, o.y, MAP_SIZE * 4 * scale, MAP_SIZE * 2 * scale);
    c.imageSmoothingEnabled = true;
  }

  private drawTiles(c: CanvasRenderingContext2D, explored: Uint8Array, visible: Uint8Array): void {
    const m = getMap();
    const W = this.cw();
    const H = this.ch();
    // Casas visíveis: cantos da tela convertidos em casas, com margem.
    const corners = [this.toTile(0, 0), this.toTile(W, 0), this.toTile(0, H), this.toTile(W, H)];
    const minX = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.x))) - 2);
    const maxX = Math.min(MAP_SIZE - 1, Math.ceil(Math.max(...corners.map((p) => p.x))) + 2);
    const minY = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.y))) - 2);
    const maxY = Math.min(MAP_SIZE - 1, Math.ceil(Math.max(...corners.map((p) => p.y))) + 4);
    const tw = TW * this.zoom;
    const th = TH * this.zoom;
    const s = tw / 128;
    const roads = new Set(this.snap!.state.roads);
    const bridges = new Set(this.snap!.state.bridges);
    const cut = new Set(this.snap!.state.forestCut);
    // Blocos de 16×16: só os que cruzam a tela são percorridos.
    const chunks = MAP_SIZE / CHUNK;
    const chunkVisible = new Uint8Array(chunks * chunks);
    for (let cy = Math.floor(minY / CHUNK); cy <= Math.floor(maxY / CHUNK); cy++) {
      for (let cx = Math.floor(minX / CHUNK); cx <= Math.floor(maxX / CHUNK); cx++) {
        const pts = [this.toScreen(cx * CHUNK, cy * CHUNK), this.toScreen((cx + 1) * CHUNK, cy * CHUNK), this.toScreen(cx * CHUNK, (cy + 1) * CHUNK), this.toScreen((cx + 1) * CHUNK, (cy + 1) * CHUNK)];
        const x0 = Math.min(...pts.map((q) => q.x));
        const x1 = Math.max(...pts.map((q) => q.x));
        const y0 = Math.min(...pts.map((q) => q.y)) - th * 4;
        const y1 = Math.max(...pts.map((q) => q.y)) + th;
        if (x1 >= 0 && x0 <= W && y1 >= 0 && y0 <= H) chunkVisible[cy * chunks + cx] = 1;
      }
    }
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!chunkVisible[Math.floor(y / CHUNK) * chunks + Math.floor(x / CHUNK)]) continue;
        const i = idx(x, y);
        const p = this.toScreen(x, y);
        if (p.x < -tw || p.x > W + tw || p.y < -th * 4 || p.y > H + th) continue;
        if (!explored[i]) {
          diamond(c, p.x, p.y, tw, th, '#18120a');
          continue;
        }
        const key = tileArt(m, i, roads, bridges, cut);
        const img = art(key);
        const ih = (img.height as number) * s;
        c.drawImage(img, p.x - tw / 2, p.y + th - ih, tw, ih);
        if (roads.has(i) && key !== 'terreno-estrada' && key !== 'terreno-ponte') {
          c.globalAlpha = 0.7;
          const r = art('terreno-estrada');
          c.drawImage(r, p.x - tw / 2, p.y, tw, th);
          c.globalAlpha = 1;
        }
        const o = this.owner[i];
        if (o >= 0) {
          const col = this.snap!.state.nations[o]?.color ?? '#888';
          diamond(c, p.x, p.y, tw, th, hexA(col, 0.13));
          if ((x + 1 < MAP_SIZE && this.owner[i + 1] !== o) || (y + 1 < MAP_SIZE && this.owner[i + MAP_SIZE] !== o) || (x > 0 && this.owner[i - 1] !== o) || (y > 0 && this.owner[i - MAP_SIZE] !== o)) {
            diamondStroke(c, p.x, p.y, tw, th, hexA(col, 0.8));
          }
        }
        if (!visible[i]) diamond(c, p.x, p.y, tw, th, 'rgba(10,8,4,0.35)');
      }
    }
    // Depósitos explorados.
    for (const d of this.snap!.state.deposits) {
      if (!explored[idx(d.x, d.y)]) continue;
      const p = this.toScreen(d.x, d.y);
      if (p.x < -tw || p.x > W + tw || p.y < -th * 3 || p.y > H + th) continue;
      const img = art(`deposito-${d.type}${d.amount <= 0 ? '-esgotado' : ''}`);
      const sz = tw * 0.75;
      c.drawImage(img, p.x - sz / 2, p.y + th * 0.8 - sz, sz, sz);
    }
    if (this.highlightTile) {
      const p = this.toScreen(this.highlightTile.x, this.highlightTile.y);
      diamondStroke(c, p.x, p.y, tw, th, '#f2c94c', 3);
    }
  }

  private drawObjects(c: CanvasRenderingContext2D, st: GameState, explored: Uint8Array, visible: Uint8Array, now: number, far: boolean): void {
    const tw = TW * this.zoom;
    const W = this.cw();
    const H = this.ch();
    type Item = { y: number; draw: () => void };
    const items: Item[] = [];
    const onScreen = (p: { x: number; y: number }, m = 80) => p.x > -m && p.x < W + m && p.y > -m && p.y < H + m;
    for (const s of st.settlements) {
      if (!explored[idx(s.x, s.y)]) continue;
      const p = this.toScreen(s.x + 0.5, s.y + 0.5);
      if (!onScreen(p)) continue;
      items.push({ y: p.y, draw: () => this.drawSettlement(c, st, s, p, far) });
    }
    for (const t of st.travelers) {
      if (t.nation !== st.playerNation && !visible[idx(Math.round(t.x), Math.round(t.y))]) continue;
      const p = this.toScreen(t.x + 0.5, t.y + 0.5);
      if (!onScreen(p)) continue;
      items.push({ y: p.y, draw: () => this.drawTraveler(c, st, t, p, far) });
    }
    for (const a of st.armies) {
      if (a.stationedAt != null) continue;
      if (a.nation !== st.playerNation && !visible[idx(Math.round(a.x), Math.round(a.y))]) continue;
      const p = this.toScreen(a.x + 0.5, a.y + 0.5);
      if (!onScreen(p)) continue;
      items.push({ y: p.y + 1, draw: () => this.drawArmy(c, st, a, p, far, now) });
    }
    for (const b of st.battles) {
      if (!visible[idx(Math.round(b.x), Math.round(b.y))] && !st.armies.some((a) => a.nation === st.playerNation && (b.attackers.includes(a.id) || b.defenders.includes(a.id)))) continue;
      const p = this.toScreen(b.x + 0.5, b.y + 0.5);
      if (!onScreen(p)) continue;
      items.push({ y: p.y + 2, draw: () => this.drawBattle(c, st, b, p, now, far) });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
    // Seleção.
    if (this.selected && this.selected.kind !== 'tile') {
      const sel = this.selected;
      let pos: { x: number; y: number } | null = null;
      if (sel.kind === 'settlement') {
        const s = st.settlements.find((x) => x.id === sel.id);
        if (s) pos = this.toScreen(s.x + 0.5, s.y + 0.5);
      } else if (sel.kind === 'army') {
        const a = st.armies.find((x) => x.id === sel.id);
        if (a) {
          pos = this.toScreen(a.x + 0.5, a.y + 0.5);
          // Caminho planejado.
          if (a.path.length > a.pathIdx) {
            c.strokeStyle = 'rgba(242,201,76,0.85)';
            c.setLineDash([6, 6]);
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(pos.x, pos.y);
            for (let k = a.pathIdx; k < a.path.length; k++) {
              const q = this.toScreen((a.path[k] % MAP_SIZE) + 0.5, Math.floor(a.path[k] / MAP_SIZE) + 0.5);
              c.lineTo(q.x, q.y);
            }
            c.stroke();
            c.setLineDash([]);
          }
        }
      }
      if (pos) {
        c.strokeStyle = '#f2c94c';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(pos.x, pos.y, Math.max(14, tw * 0.6), Math.max(7, tw * 0.3), 0, 0, Math.PI * 2);
        c.stroke();
      }
    }
  }

  private drawSettlement(c: CanvasRenderingContext2D, st: GameState, s: Settlement, p: { x: number; y: number }, far: boolean): void {
    const n = st.nations[s.nation];
    const kind = s.kind === 'camp' ? (s.ruinedFor > 0 ? 'camp-ruin' : 'camp') : s.kind === 'tribal' ? `tribe${n.tribeLevel}` : s.kind;
    const base = s.kind === 'capital' ? 2.4 : s.kind === 'city' ? 2 : s.kind === 'camp' ? 1.3 : 1.7;
    const size = Math.max(far ? 18 : 22, TW * this.zoom * base);
    const img = art(`mapa-${kind}`);
    c.drawImage(img, p.x - size / 2, p.y - size * 0.82, size, size);
    // Bandeira com a cor do reino.
    c.fillStyle = n.color;
    c.strokeStyle = 'rgba(0,0,0,0.6)';
    c.lineWidth = 1;
    const fx = p.x + size * 0.12;
    const fy = p.y - size * 0.82;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(fx + size * 0.2, fy + size * 0.05);
    c.lineTo(fx, fy + size * 0.11);
    c.closePath();
    c.fill();
    c.stroke();
    if (this.zoom > 0.3 || s.kind === 'capital') {
      const label = s.name;
      c.font = `${s.kind === 'capital' ? 'bold ' : ''}${Math.max(10, Math.min(14, 11 * this.zoom + 4))}px Georgia, serif`;
      c.textAlign = 'center';
      const w = c.measureText(label).width + 8;
      c.fillStyle = 'rgba(20,14,8,0.7)';
      c.fillRect(p.x - w / 2, p.y + 2, w, 15);
      c.fillStyle = s.nation === st.playerNation ? '#f2c94c' : '#efe6d0';
      c.fillText(label, p.x, p.y + 13);
    }
  }

  private drawTraveler(c: CanvasRenderingContext2D, st: GameState, t: Traveler, p: { x: number; y: number }, far: boolean): void {
    const size = Math.max(far ? 12 : 16, TW * this.zoom * (t.kind === 'ship' ? 1.4 : 0.7));
    const img = art(`viajante-${t.kind}`);
    c.drawImage(img, p.x - size / 2, p.y - size * 0.85, size, size);
    void st;
  }

  private drawArmy(c: CanvasRenderingContext2D, st: GameState, a: Army, p: { x: number; y: number }, far: boolean, now: number): void {
    const n = st.nations[a.nation];
    let main: UnitId = 'spearman';
    let best = -1;
    for (const k in a.troops) {
      const v = a.troops[k as UnitId] ?? 0;
      if (v > best) {
        best = v;
        main = k as UnitId;
      }
    }
    const size = Math.max(far ? 16 : 22, TW * this.zoom * 0.9);
    const moving = a.pathIdx < a.path.length;
    const bob = moving ? Math.sin(now / 120 + a.id) * 1.5 : 0;
    c.fillStyle = hexA(n.color, 0.9);
    c.beginPath();
    c.ellipse(p.x, p.y, size * 0.45, size * 0.18, 0, 0, Math.PI * 2);
    c.fill();
    c.drawImage(art(`boneco-${main}`), p.x - size / 2, p.y - size * 0.95 + bob, size, size);
    const count = Math.floor(troopCount(a.troops));
    const label = `${count}`;
    c.font = 'bold 11px sans-serif';
    c.textAlign = 'center';
    const w = c.measureText(label).width + 8;
    c.fillStyle = n.color;
    c.fillRect(p.x - w / 2, p.y + 3, w, 14);
    c.fillStyle = '#fff';
    c.fillText(label, p.x, p.y + 14);
    void UNITS;
  }

  private drawBattle(c: CanvasRenderingContext2D, st: GameState, b: GameState['battles'][number], p: { x: number; y: number }, now: number, far: boolean): void {
    const size = Math.max(far ? 20 : 26, TW * this.zoom * 1.2);
    // Soldados lutando: alguns bonecos de cada lado balançando.
    if (!far) {
      const sideUnits = (ids: number[]) => {
        const out: UnitId[] = [];
        for (const id of ids) {
          const a = st.armies.find((x) => x.id === id);
          if (!a) continue;
          for (const k in a.troops) if ((a.troops[k as UnitId] ?? 0) > 0 && UNITS[k as UnitId].cls !== 'siege') out.push(k as UnitId);
        }
        return out.slice(0, 3);
      };
      const att = sideUnits(b.attackers);
      const def = sideUnits(b.defenders);
      const us = size * 0.7;
      att.forEach((u, i) => {
        const swing = Math.sin(now / 90 + i * 2) * 4;
        c.drawImage(art(`boneco-${u}`), p.x - us * (1.4 - i * 0.3) + swing, p.y - us * 0.9 + i * 4, us, us);
      });
      def.forEach((u, i) => {
        const swing = Math.sin(now / 100 + i * 3) * 4;
        c.save();
        c.translate(p.x + us * (1.4 - i * 0.3) - swing, p.y - us * 0.9 + i * 4);
        c.scale(-1, 1);
        c.drawImage(art(`boneco-${u}`), -us, 0, us, us);
        c.restore();
      });
      // Números das baixas recentes subindo.
      const lost = Object.values(b.attackerLosses).reduce((k, v) => k + (v ?? 0), 0) + Object.values(b.defenderLosses).reduce((k, v) => k + (v ?? 0), 0);
      const t = (now / 1000) % 1.5;
      c.globalAlpha = 1 - t / 1.5;
      c.fillStyle = '#ff5a4a';
      c.font = 'bold 12px sans-serif';
      c.textAlign = 'center';
      c.fillText(`−${Math.round(lost)}`, p.x, p.y - size - t * 18);
      c.globalAlpha = 1;
    }
    const pulse = 1 + Math.sin(now / 150) * 0.12;
    const s2 = size * pulse;
    c.drawImage(art('mapa-batalha'), p.x - s2 / 2, p.y - s2 * 0.9, s2, s2);
  }
}

function tileArt(m: ReturnType<typeof getMap>, i: number, roads: Set<number>, bridges: Set<number>, cut: Set<number>): string {
  if (m.base[i] === BASE_SEA) return 'terreno-mar';
  if (m.relief[i] === RELIEF_MOUNTAIN) return 'terreno-montanha';
  if (m.river[i] === RIVER) return bridges.has(i) ? 'terreno-ponte' : 'terreno-rio';
  if (m.river[i] === RIVER_FORD) return 'terreno-vau';
  if (!cut.has(i)) {
    if (m.veg[i] === VEG_FOREST) return 'terreno-floresta';
    if (m.veg[i] === VEG_WOODS) return 'terreno-bosque';
    if (m.veg[i] === VEG_MARSH) return 'terreno-pantano';
  }
  if (m.relief[i] === RELIEF_HILL) return 'terreno-colina';
  if (roads.has(i)) return 'terreno-estrada';
  if (m.coast[i] === 1) return 'terreno-areia';
  if (m.base[i] === BASE_SNOW) return 'terreno-neve';
  if (m.base[i] === BASE_SAND) return 'terreno-areia';
  if (m.base[i] === BASE_DIRT) return 'terreno-terra';
  return 'terreno-grama';
}

function diamond(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w / 2, y + h / 2);
  c.lineTo(x, y + h);
  c.lineTo(x - w / 2, y + h / 2);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function diamondStroke(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string, lw = 1.5): void {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w / 2, y + h / 2);
  c.lineTo(x, y + h);
  c.lineTo(x - w / 2, y + h / 2);
  c.closePath();
  c.strokeStyle = stroke;
  c.lineWidth = lw;
  c.stroke();
}

export function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexA(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function countSome(a: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < a.length; i += 7) n += a[i];
  return n;
}
