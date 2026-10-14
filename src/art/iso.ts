// Ferramentas de desenho isométrico 2:1 usadas pela arte padrão (gerada por código).
// Unidade: uma casa do chão = 128 × 64 px na resolução da arte.

export const TILE_W = 128;
export const TILE_H = 64;

export type Ctx = CanvasRenderingContext2D;

export interface Pt {
  x: number;
  y: number;
}

export function shade(color: string, f: number): string {
  let r: number;
  let g: number;
  let b: number;
  if (color.startsWith('rgb')) {
    const m = color.match(/[\d.]+/g) ?? ['0', '0', '0'];
    [r, g, b] = m.slice(0, 3).map(Number);
  } else {
    const n = parseInt(color.slice(1), 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  }
  if (f < 0) {
    r *= 1 + f;
    g *= 1 + f;
    b *= 1 + f;
  } else {
    r += (255 - r) * f;
    g += (255 - g) * f;
    b += (255 - b) * f;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

export function poly(c: Ctx, pts: Pt[], fill: string, stroke = 'rgba(30,20,10,0.55)', lw = 1.5): void {
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.lineJoin = 'round';
    c.stroke();
  }
}

/** Losango do chão de um retângulo de casas (n × m), com a ponta de baixo em `base`. */
export function footprint(base: Pt, n: number, m = n, inset = 0): { top: Pt; right: Pt; bottom: Pt; left: Pt } {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const i = inset;
  return {
    bottom: { x: base.x + (n - m) * hw * 0, y: base.y - i },
    right: { x: base.x + n * hw - i * 2, y: base.y - n * hh },
    top: { x: base.x + (n - m) * hw, y: base.y - (n + m) * hh + i },
    left: { x: base.x - m * hw + i * 2, y: base.y - m * hh },
  };
}

/** Caixa isométrica (paredes esquerda e direita + topo). Retorna o losango do topo. */
export function box(c: Ctx, base: Pt, w: number, d: number, h: number, color: string, opts: { top?: string; stroke?: string } = {}) {
  // w = largura em px no eixo direito, d = profundidade no eixo esquerdo (em "casas" de 1 = TILE).
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const B = base;
  const R = { x: B.x + w * hw, y: B.y - w * hh };
  const L = { x: B.x - d * hw, y: B.y - d * hh };
  const T = { x: R.x - d * hw, y: R.y - d * hh };
  const up = (p: Pt) => ({ x: p.x, y: p.y - h });
  poly(c, [L, B, up(B), up(L)], shade(color, -0.15), opts.stroke);
  poly(c, [B, R, up(R), up(B)], shade(color, -0.35), opts.stroke);
  poly(c, [up(L), up(B), up(R), up(T)], opts.top ?? shade(color, 0.1), opts.stroke);
  return { B: up(B), R: up(R), L: up(L), T: up(T), base: { B, R, L, T } };
}

/** Telhado de duas águas sobre o topo de uma caixa. Cumeeira paralela ao eixo esquerdo. */
export function gableRoof(c: Ctx, top: { B: Pt; R: Pt; L: Pt; T: Pt }, rise: number, color: string, overhang = 4): void {
  const mid1 = { x: (top.B.x + top.R.x) / 2, y: (top.B.y + top.R.y) / 2 - rise };
  const mid2 = { x: (top.L.x + top.T.x) / 2, y: (top.L.y + top.T.y) / 2 - rise };
  const o = overhang;
  const B = { x: top.B.x, y: top.B.y + o };
  const R = { x: top.R.x + o, y: top.R.y };
  const L = { x: top.L.x - o, y: top.L.y };
  const T = { x: top.T.x, y: top.T.y - o };
  // Lado da frente (B-L) e de trás (R-T)
  poly(c, [L, B, mid1, mid2], shade(color, -0.05));
  poly(c, [B, R, mid1], shade(color, -0.4));
  poly(c, [mid2, mid1, R, T], shade(color, 0.12));
}

/** Telhado piramidal (torres, tendas). */
export function pyramidRoof(c: Ctx, top: { B: Pt; R: Pt; L: Pt; T: Pt }, rise: number, color: string): void {
  const apex = { x: (top.L.x + top.R.x) / 2, y: (top.T.y + top.B.y) / 2 - rise };
  poly(c, [top.L, top.B, apex], shade(color, -0.05));
  poly(c, [top.B, top.R, apex], shade(color, -0.35));
}

export function circle(c: Ctx, x: number, y: number, r: number, fill: string, stroke?: string): void {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.5;
    c.stroke();
  }
}

export function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string): void {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

export function flag(c: Ctx, x: number, y: number, h: number, color: string): void {
  c.strokeStyle = '#3b2a1a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - h);
  c.stroke();
  poly(c, [{ x, y: y - h }, { x: x + h * 0.55, y: y - h + h * 0.15 }, { x, y: y - h + h * 0.3 }], color, 'rgba(0,0,0,0.4)', 1);
}

/** Janelinha numa face (posição relativa 0..1 ao longo da parede esquerda). */
export function windowOnLeft(c: Ctx, base: Pt, d: number, t: number, y: number, size = 8, color = '#2b1d10'): void {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const x = base.x - d * hw * t;
  const yy = base.y - d * hh * t - y;
  poly(c, [{ x: x - size / 2, y: yy + size / 4 }, { x: x + size / 2, y: yy - size / 4 }, { x: x + size / 2, y: yy - size / 4 - size }, { x: x - size / 2, y: yy + size / 4 - size }], color, '', 0);
}

export function windowOnRight(c: Ctx, base: Pt, w: number, t: number, y: number, size = 8, color = '#1d130a'): void {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const x = base.x + w * hw * t;
  const yy = base.y - w * hh * t - y;
  poly(c, [{ x: x - size / 2, y: yy - size / 4 }, { x: x + size / 2, y: yy + size / 4 }, { x: x + size / 2, y: yy + size / 4 - size }, { x: x - size / 2, y: yy - size / 4 - size }], color, '', 0);
}

/** Ponto dentro do losango do chão: u ao longo do eixo direito, v ao longo do esquerdo (em casas). */
export function groundPt(base: Pt, u: number, v: number): Pt {
  return { x: base.x + (u - v) * (TILE_W / 2), y: base.y - (u + v) * (TILE_H / 2) };
}

export function groundQuad(c: Ctx, base: Pt, u0: number, v0: number, u1: number, v1: number, fill: string, stroke = ''): void {
  poly(c, [groundPt(base, u0, v0), groundPt(base, u1, v0), groundPt(base, u1, v1), groundPt(base, u0, v1)], fill, stroke, 1);
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Ruído determinístico barato para texturas. */
export function hashRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
