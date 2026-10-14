// Arte padrão das construções: desenhos isométricos feitos por código.
// Estágio 1 = madeira e palha, 2 = pedra, 3 = imponente com bandeiras.
import type { BuildingId } from '../sim/data/buildings';
import { TILE_H, TILE_W, box, circle, ellipse, flag, gableRoof, groundPt, groundQuad, hashRand, poly, pyramidRoof, shade, windowOnLeft, windowOnRight, type Ctx, type Pt } from './iso';

export const BUILDING_SIZES: Record<BuildingId, number> = {} as Record<BuildingId, number>;

interface Look {
  wall: string;
  roof: string;
  trim: string;
}

function look(stage: number): Look {
  if (stage === 1) return { wall: '#a7794a', roof: '#c9a050', trim: '#6b4a2a' };
  if (stage === 2) return { wall: '#a9a197', roof: '#a14a35', trim: '#6e665c' };
  return { wall: '#d8cfbf', roof: '#2f5d9a', trim: '#8a7f6e' };
}

/** Base (ponta de baixo do losango) para um sprite de n casas. */
export function spriteBase(n: number, h: number): Pt {
  return { x: (n * TILE_W) / 2, y: h - 2 };
}

function ground(c: Ctx, base: Pt, n: number, color = '#7d9a4a'): void {
  groundQuad(c, base, 0, 0, n, n, color, 'rgba(40,30,10,0.25)');
}

function house(c: Ctx, base: Pt, u: number, v: number, w: number, d: number, h: number, L: Look, roofRise = 26): void {
  const b = groundPt(base, u, v);
  const top = box(c, b, w, d, h, L.wall);
  gableRoof(c, top, roofRise, L.roof);
  windowOnLeft(c, b, d, 0.5, h * 0.45, 7);
  windowOnRight(c, b, w, 0.35, h * 0.45, 7);
}

function tower(c: Ctx, base: Pt, u: number, v: number, s: number, h: number, L: Look, roofColor?: string, banner?: string): Pt {
  const b = groundPt(base, u, v);
  const top = box(c, b, s, s, h, L.wall);
  // ameias
  for (let i = 0; i < 3; i++) {
    const p = groundPt(b, (s * (i + 0.5)) / 3, 0);
    poly(c, [{ x: p.x - 4, y: p.y - h }, { x: p.x + 4, y: p.y - h - 4 }, { x: p.x + 4, y: p.y - h - 12 }, { x: p.x - 4, y: p.y - h - 8 }], shade(L.wall, 0.05));
  }
  if (roofColor) pyramidRoof(c, top, 30 * s, roofColor);
  const apex = { x: (top.L.x + top.R.x) / 2, y: (top.T.y + top.B.y) / 2 - (roofColor ? 30 * s : 0) };
  if (banner) flag(c, apex.x, apex.y, 26, banner);
  return apex;
}

function field(c: Ctx, base: Pt, u0: number, v0: number, u1: number, v1: number, color: string, rows = 6): void {
  groundQuad(c, base, u0, v0, u1, v1, shade(color, -0.25), 'rgba(60,40,10,0.4)');
  for (let i = 0; i < rows; i++) {
    const t = (i + 0.5) / rows;
    const a = groundPt(base, u0 + (u1 - u0) * t, v0);
    const b = groundPt(base, u0 + (u1 - u0) * t, v1);
    c.strokeStyle = color;
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
}

function tree(c: Ctx, p: Pt, s = 1, color = '#3f6b2a'): void {
  c.fillStyle = '#5a3a1e';
  c.fillRect(p.x - 2 * s, p.y - 14 * s, 4 * s, 14 * s);
  circle(c, p.x, p.y - 20 * s, 11 * s, color, 'rgba(0,0,0,0.3)');
  circle(c, p.x - 4 * s, p.y - 24 * s, 6 * s, shade(color, 0.15));
}

function smoke(c: Ctx, p: Pt): void {
  for (let i = 0; i < 3; i++) ellipse(c, p.x + i * 5, p.y - i * 10, 7 - i, 5 - i, `rgba(200,200,200,${0.5 - i * 0.12})`);
}

function crates(c: Ctx, base: Pt, u: number, v: number, color = '#8a5a2b'): void {
  box(c, groundPt(base, u, v), 0.18, 0.18, 12, color);
  box(c, groundPt(base, u + 0.22, v), 0.15, 0.15, 10, shade(color, 0.1));
}

function barrel(c: Ctx, p: Pt): void {
  ellipse(c, p.x, p.y - 8, 6, 9, '#7a4a22');
  ellipse(c, p.x, p.y - 15, 6, 2.5, '#9a6a3a');
}

function stoneBlocks(c: Ctx, base: Pt, u: number, v: number): void {
  box(c, groundPt(base, u, v), 0.2, 0.2, 10, '#9aa0a6');
  box(c, groundPt(base, u + 0.25, v + 0.05), 0.18, 0.16, 8, '#b5bbc3');
  box(c, groundPt(base, u + 0.1, v + 0.25), 0.16, 0.16, 9, '#8d939c');
}

function water(c: Ctx, base: Pt, u0: number, v0: number, u1: number, v1: number): void {
  groundQuad(c, base, u0, v0, u1, v1, '#4a8cc9', 'rgba(20,60,110,0.6)');
}

type Painter = (c: Ctx, base: Pt, stage: number, L: Look, r: () => number) => void;

const PAINTERS: Record<BuildingId, Painter> = {
  keep: (c, base, st, L) => {
    ground(c, base, 3, '#8e8a6c');
    groundQuad(c, base, 0.2, 0.2, 2.8, 2.8, shade(L.trim, 0.2));
    // muralhinha interna
    const b = groundPt(base, 0.35, 0.35);
    box(c, b, 2.3, 2.3, 22 + st * 4, L.wall);
    tower(c, base, 0.25, 0.25, 0.55, 60 + st * 12, L, st >= 2 ? L.roof : undefined, st === 3 ? '#c0392b' : undefined);
    tower(c, base, 2.2, 0.25, 0.55, 60 + st * 12, L, st >= 2 ? L.roof : undefined);
    tower(c, base, 0.25, 2.2, 0.55, 60 + st * 12, L, st >= 2 ? L.roof : undefined);
    const keepTop = box(c, groundPt(base, 0.95, 0.95), 1.1, 1.1, 80 + st * 22, shade(L.wall, 0.06));
    for (let i = 0; i < 4; i++) {
      windowOnLeft(c, groundPt(base, 0.95, 0.95), 1.1, 0.5, 20 + i * 18, 8);
      windowOnRight(c, groundPt(base, 0.95, 0.95), 1.1, 0.5, 20 + i * 18, 8);
    }
    if (st >= 2) pyramidRoof(c, keepTop, 40, L.roof);
    flag(c, (keepTop.L.x + keepTop.R.x) / 2, (keepTop.T.y + keepTop.B.y) / 2 - (st >= 2 ? 40 : 0), 34, '#f2c94c');
    tower(c, base, 2.2, 2.2, 0.55, 60 + st * 12, L, st >= 2 ? L.roof : undefined, st === 3 ? '#c0392b' : undefined);
  },
  governor_hall: (c, base, st, L) => {
    ground(c, base, 2, '#8e8a6c');
    house(c, base, 0.25, 0.3, 1.5, 1.2, 40 + st * 8, L, 34);
    tower(c, base, 1.3, 1.25, 0.45, 70 + st * 10, L, L.roof, '#f2c94c');
  },
  house: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.15, 0.15, 0.7, 0.6, 26 + st * 6, L, 22);
    if (st >= 2) box(c, groundPt(base, 0.62, 0.22), 0.1, 0.1, 50, '#6e665c');
  },
  wheat_farm: (c, base, st, L) => {
    ground(c, base, 2, '#8a9a45');
    field(c, base, 0.1, 0.9, 1.9, 1.9, '#e2c25a', 8);
    field(c, base, 0.9, 0.1, 1.9, 0.85, '#d9b44a', 5);
    house(c, base, 0.12, 0.12, 0.7, 0.65, 30 + st * 4, L, 24);
  },
  oat_farm: (c, base, st, L) => {
    ground(c, base, 2, '#8a9a45');
    field(c, base, 0.1, 0.9, 1.9, 1.9, '#cdd27a', 8);
    field(c, base, 0.9, 0.1, 1.9, 0.85, '#bfc66a', 5);
    house(c, base, 0.12, 0.12, 0.7, 0.65, 28 + st * 4, L, 22);
  },
  barley_farm: (c, base, st, L) => {
    ground(c, base, 2, '#8a9a45');
    field(c, base, 0.1, 0.9, 1.9, 1.9, '#c8a24a', 8);
    field(c, base, 0.9, 0.1, 1.9, 0.85, '#b89040', 5);
    house(c, base, 0.12, 0.12, 0.7, 0.65, 28 + st * 4, L, 22);
  },
  vegetable_garden: (c, base, st) => {
    ground(c, base, 1, '#7b5a3a');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) circle(c, groundPt(base, 0.2 + i * 0.3, 0.2 + j * 0.3).x, groundPt(base, 0.2 + i * 0.3, 0.2 + j * 0.3).y - 5, 6, (i + j) % 2 ? '#5aa04a' : '#e07a3a');
    if (st >= 2) groundQuad(c, base, 0, 0, 1, 0.08, '#6b4a2a');
  },
  orchard: (c, base, st) => {
    ground(c, base, 2, '#6f9a45');
    const r = hashRand(7);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const p = groundPt(base, 0.3 + i * 0.65, 0.3 + j * 0.65);
      tree(c, p, 1 + st * 0.1, '#4c8a34');
      circle(c, p.x + (r() - 0.5) * 10, p.y - 22, 3, '#d6452f');
      circle(c, p.x + (r() - 0.5) * 10, p.y - 18, 3, '#e0a02f');
    }
  },
  vineyard: (c, base, st) => {
    ground(c, base, 2, '#8a8a4a');
    for (let i = 0; i < 5; i++) {
      const a = groundPt(base, 0.2 + i * 0.4, 0.15);
      const b = groundPt(base, 0.2 + i * 0.4, 1.85);
      c.strokeStyle = '#5a3a1e';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(a.x, a.y - 10);
      c.lineTo(b.x, b.y - 10);
      c.stroke();
      for (let k = 0; k < 6; k++) circle(c, a.x + ((b.x - a.x) * k) / 5, a.y - 12 + ((b.y - a.y) * k) / 5, 5, k % 2 ? '#5a8a3a' : '#6b2f6b');
    }
    void st;
  },
  pasture: (c, base, st) => {
    ground(c, base, 2, '#86b04a');
    const fence = [groundPt(base, 0.05, 0.05), groundPt(base, 1.95, 0.05), groundPt(base, 1.95, 1.95), groundPt(base, 0.05, 1.95)];
    c.strokeStyle = '#6b4a2a';
    c.lineWidth = 3;
    c.beginPath();
    fence.forEach((p, i) => (i ? c.lineTo(p.x, p.y - 8) : c.moveTo(p.x, p.y - 8)));
    c.closePath();
    c.stroke();
    for (const [u, v] of [[0.6, 0.8], [1.2, 1.3], [1.4, 0.5]]) {
      const p = groundPt(base, u, v);
      ellipse(c, p.x, p.y - 10, 14, 8, '#f2efe8');
      circle(c, p.x + 12, p.y - 14, 5, '#3b2a1a');
      ellipse(c, p.x - 3, p.y - 11, 4, 3, '#3b2a1a');
    }
    if (st >= 2) house(c, base, 0.1, 1.4, 0.5, 0.5, 20, look(st), 16);
  },
  sheep_pasture: (c, base) => {
    ground(c, base, 2, '#86b04a');
    for (const [u, v] of [[0.5, 0.6], [1.1, 1.2], [1.5, 0.6], [0.7, 1.5]]) {
      const p = groundPt(base, u, v);
      ellipse(c, p.x, p.y - 9, 12, 8, '#f6f3ea');
      circle(c, p.x + 10, p.y - 11, 4, '#2b2b2b');
    }
  },
  henhouse: (c, base, st, L) => {
    ground(c, base, 1, '#9a8a4a');
    house(c, base, 0.2, 0.2, 0.55, 0.45, 18 + st * 3, L, 14);
    for (const [u, v] of [[0.75, 0.3], [0.6, 0.8], [0.85, 0.7]]) {
      const p = groundPt(base, u, v);
      ellipse(c, p.x, p.y - 5, 5, 4, '#f2efe8');
      circle(c, p.x + 4, p.y - 8, 2, '#d63a2a');
    }
  },
  fisher: (c, base, st, L) => {
    ground(c, base, 1, '#c8b47a');
    water(c, base, 0.55, 0, 1, 1);
    house(c, base, 0.1, 0.15, 0.45, 0.6, 20 + st * 4, L, 16);
    const p = groundPt(base, 0.8, 0.5);
    ellipse(c, p.x, p.y - 3, 14, 5, '#7a4a22');
  },
  apiary: (c, base) => {
    ground(c, base, 1, '#86b04a');
    for (const [u, v] of [[0.3, 0.3], [0.7, 0.4], [0.45, 0.75]]) {
      const p = groundPt(base, u, v);
      ellipse(c, p.x, p.y - 10, 8, 11, '#e0b24a');
      ellipse(c, p.x, p.y - 14, 8, 2, '#a8822a');
      ellipse(c, p.x, p.y - 8, 8, 2, '#a8822a');
    }
  },
  mill: (c, base, st, L) => {
    ground(c, base, 2);
    const b = groundPt(base, 0.6, 0.6);
    const top = box(c, b, 0.8, 0.8, 70 + st * 10, L.wall);
    pyramidRoof(c, top, 30, L.roof);
    const hub = { x: (top.L.x + top.R.x) / 2 - 18, y: top.B.y + 10 };
    c.strokeStyle = '#4a3420';
    c.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4;
      c.beginPath();
      c.moveTo(hub.x, hub.y);
      c.lineTo(hub.x + Math.cos(a) * 48, hub.y + Math.sin(a) * 48);
      c.stroke();
      poly(c, [{ x: hub.x + Math.cos(a) * 14, y: hub.y + Math.sin(a) * 14 }, { x: hub.x + Math.cos(a) * 48, y: hub.y + Math.sin(a) * 48 }, { x: hub.x + Math.cos(a + 0.35) * 46, y: hub.y + Math.sin(a + 0.35) * 46 }], '#e8dcc0');
    }
    circle(c, hub.x, hub.y, 5, '#3b2a1a');
    crates(c, base, 1.5, 0.2, '#d9c08a');
  },
  bakery: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.15, 0.15, 0.7, 0.6, 26 + st * 4, L, 20);
    smoke(c, groundPt(base, 0.6, 0.3));
    const p = groundPt(base, 0.85, 0.75);
    ellipse(c, p.x, p.y - 5, 8, 5, '#d9a050');
  },
  kitchen: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.2, 0.15, 0.6, 0.6, 24 + st * 4, L, 18);
    const p = groundPt(base, 0.8, 0.8);
    ellipse(c, p.x, p.y - 8, 10, 7, '#3b3b3b');
    smoke(c, { x: p.x, y: p.y - 14 });
  },
  butcher: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.15, 0.15, 0.7, 0.6, 26 + st * 4, L, 18);
    const p = groundPt(base, 0.85, 0.4);
    ellipse(c, p.x, p.y - 18, 4, 8, '#b5473a');
  },
  dairy: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.15, 0.15, 0.7, 0.6, 26 + st * 4, L, 18);
    const p = groundPt(base, 0.85, 0.8);
    ellipse(c, p.x, p.y - 6, 9, 6, '#f2d36b');
  },
  brewery: (c, base, st, L) => {
    ground(c, base, 2);
    house(c, base, 0.2, 0.2, 1.3, 1.0, 36 + st * 6, L, 26);
    for (let i = 0; i < 3; i++) barrel(c, groundPt(base, 1.6, 0.4 + i * 0.4));
  },
  winepress: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.15, 0.2, 0.6, 0.55, 24 + st * 4, L, 18);
    barrel(c, groundPt(base, 0.85, 0.6));
    barrel(c, groundPt(base, 0.85, 0.85));
  },
  sawmill: (c, base, st, L) => {
    ground(c, base, 2, '#86904a');
    house(c, base, 0.2, 0.25, 1.2, 0.9, 30 + st * 6, L, 20);
    for (let i = 0; i < 3; i++) {
      const p = groundPt(base, 1.5, 0.3 + i * 0.22);
      ellipse(c, p.x, p.y - 6, 22, 6, '#9a6235');
      ellipse(c, p.x - 18, p.y - 6, 5, 6, '#e3b77e');
    }
    const w = groundPt(base, 0.6, 1.4);
    circle(c, w.x, w.y - 22, 20, 'rgba(0,0,0,0)', '#5f6b75');
    c.strokeStyle = '#5f6b75';
    c.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(w.x - 20 * Math.cos((i * Math.PI) / 4), w.y - 22 - 20 * Math.sin((i * Math.PI) / 4));
      c.lineTo(w.x + 20 * Math.cos((i * Math.PI) / 4), w.y - 22 + 20 * Math.sin((i * Math.PI) / 4));
      c.stroke();
    }
  },
  quarry: (c, base, st) => {
    ground(c, base, 2, '#9a9a8a');
    const b = groundPt(base, 0.2, 0.2);
    box(c, b, 1.2, 1.2, 46, '#8d939c', { top: '#b5bbc3' });
    groundQuad(c, base, 0.3, 0.3, 1.0, 1.0, '#6f757e');
    stoneBlocks(c, base, 1.45, 0.4);
    stoneBlocks(c, base, 1.1, 1.5);
    if (st >= 2) box(c, groundPt(base, 1.6, 1.5), 0.1, 0.1, 50, '#6b4a2a');
  },
  iron_mine: (c, base, st, L) => {
    ground(c, base, 2, '#8a8070');
    const b = groundPt(base, 0.1, 0.4);
    const top = box(c, b, 1.1, 1.3, 50, '#7a7266', { top: '#8f8678' });
    void top;
    const door = groundPt(base, 0.65, 0.4);
    poly(c, [{ x: door.x - 12, y: door.y - 2 }, { x: door.x + 12, y: door.y - 14 }, { x: door.x + 12, y: door.y - 40 }, { x: door.x - 12, y: door.y - 28 }], '#1d130a');
    c.strokeStyle = '#6b4a2a';
    c.lineWidth = 3;
    const r1 = groundPt(base, 0.7, 0.3);
    const r2 = groundPt(base, 1.9, 0.3);
    c.beginPath();
    c.moveTo(r1.x, r1.y);
    c.lineTo(r2.x, r2.y);
    c.stroke();
    box(c, groundPt(base, 1.4, 0.15), 0.3, 0.25, 14, '#5f5f5f');
    ellipse(c, groundPt(base, 1.55, 0.25).x, groundPt(base, 1.55, 0.25).y - 16, 9, 4, '#6b4a4a');
    void L;
    void st;
  },
  gold_mine: (c, base, st) => {
    PAINTERS.iron_mine(c, base, st, look(st), () => 0.5);
    ellipse(c, groundPt(base, 1.55, 0.25).x, groundPt(base, 1.55, 0.25).y - 16, 9, 4, '#f2c94c');
  },
  diamond_mine: (c, base, st) => {
    PAINTERS.iron_mine(c, base, st, look(st), () => 0.5);
    const p = groundPt(base, 1.55, 0.25);
    poly(c, [{ x: p.x, y: p.y - 24 }, { x: p.x + 7, y: p.y - 16 }, { x: p.x, y: p.y - 8 }, { x: p.x - 7, y: p.y - 16 }], '#9ee7f5');
  },
  charcoal_kiln: (c, base) => {
    ground(c, base, 1, '#6a5a4a');
    const p = groundPt(base, 0.5, 0.5);
    ellipse(c, p.x, p.y - 14, 26, 18, '#4a3a2a');
    ellipse(c, p.x, p.y - 26, 14, 8, '#3a2a1a');
    smoke(c, { x: p.x, y: p.y - 32 });
  },
  foundry: (c, base, st, L) => {
    ground(c, base, 2, '#7a6a5a');
    house(c, base, 0.2, 0.2, 1.3, 1.1, 40 + st * 6, L, 22);
    const ch = groundPt(base, 1.3, 1.1);
    box(c, ch, 0.22, 0.22, 90, '#6a5a50');
    smoke(c, { x: ch.x, y: ch.y - 98 });
    ellipse(c, groundPt(base, 1.6, 0.4).x, groundPt(base, 1.6, 0.4).y - 6, 12, 6, '#e0702a');
  },
  tannery: (c, base, st, L) => {
    ground(c, base, 1, '#8a7a5a');
    house(c, base, 0.15, 0.2, 0.55, 0.6, 22 + st * 4, L, 16);
    const p = groundPt(base, 0.85, 0.5);
    poly(c, [{ x: p.x - 8, y: p.y - 30 }, { x: p.x + 8, y: p.y - 34 }, { x: p.x + 8, y: p.y - 12 }, { x: p.x - 8, y: p.y - 8 }], '#a8743f');
  },
  weaver: (c, base, st, L) => {
    ground(c, base, 2);
    house(c, base, 0.2, 0.2, 1.4, 1.1, 34 + st * 6, L, 24);
    flag(c, groundPt(base, 1.75, 1.6).x, groundPt(base, 1.75, 1.6).y, 34, '#7a3b8f');
  },
  jeweler: (c, base, st, L) => {
    ground(c, base, 1, '#9a8f7a');
    house(c, base, 0.15, 0.15, 0.7, 0.6, 30 + st * 5, { ...L, roof: '#7a3b8f' }, 22);
    const p = groundPt(base, 0.85, 0.8);
    poly(c, [{ x: p.x, y: p.y - 18 }, { x: p.x + 6, y: p.y - 11 }, { x: p.x, y: p.y - 4 }, { x: p.x - 6, y: p.y - 11 }], '#9ee7f5');
  },
  storehouse: (c, base, st, L) => {
    ground(c, base, 2, '#8e8a6c');
    house(c, base, 0.2, 0.2, 1.5, 1.2, 40 + st * 6, { ...L, wall: st === 1 ? '#8a5a2b' : L.wall }, 28);
    crates(c, base, 1.6, 0.3);
    barrel(c, groundPt(base, 1.75, 1.0));
    barrel(c, groundPt(base, 1.55, 1.2));
  },
  blacksmith: (c, base, st, L) => {
    ground(c, base, 2, '#7a7060');
    house(c, base, 0.2, 0.6, 1.2, 1.1, 34 + st * 6, L, 22);
    const ch = groundPt(base, 0.4, 1.4);
    box(c, ch, 0.2, 0.2, 70, '#6e665c');
    smoke(c, { x: ch.x, y: ch.y - 78 });
    const an = groundPt(base, 1.5, 0.3);
    box(c, an, 0.18, 0.1, 10, '#3b3b3b');
    ellipse(c, groundPt(base, 1.0, 0.25).x, groundPt(base, 1.0, 0.25).y - 6, 10, 5, '#e0702a');
  },
  fletcher: (c, base, st, L) => {
    ground(c, base, 1);
    house(c, base, 0.15, 0.2, 0.6, 0.6, 24 + st * 4, L, 18);
    const p = groundPt(base, 0.85, 0.5);
    c.strokeStyle = '#7a5230';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(p.x, p.y - 22, 14, -1.2, 1.2);
    c.stroke();
  },
  stable: (c, base, st, L) => {
    ground(c, base, 2, '#9a8a5a');
    house(c, base, 0.15, 0.2, 1.7, 0.8, 30 + st * 5, L, 20);
    for (const [u, v] of [[0.6, 1.4], [1.3, 1.5]]) {
      const p = groundPt(base, u, v);
      ellipse(c, p.x, p.y - 12, 14, 7, '#7a5230');
      ellipse(c, p.x + 13, p.y - 18, 5, 7, '#7a5230');
      c.fillStyle = '#5a3a1e';
      c.fillRect(p.x - 10, p.y - 8, 3, 9);
      c.fillRect(p.x + 7, p.y - 8, 3, 9);
    }
  },
  barracks: (c, base, st, L) => {
    ground(c, base, 2, '#9a8f6a');
    house(c, base, 0.2, 0.2, 1.5, 0.9, 34 + st * 6, L, 22);
    flag(c, groundPt(base, 1.6, 1.5).x, groundPt(base, 1.6, 1.5).y, 44, '#b33a3a');
    for (let i = 0; i < 3; i++) {
      const p = groundPt(base, 0.6 + i * 0.35, 1.5);
      c.strokeStyle = '#cfd6dc';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + 4, p.y - 30);
      c.stroke();
    }
  },
  training_ground: (c, base, st) => {
    ground(c, base, 2, '#b8a47a');
    for (const [u, v] of [[0.5, 0.5], [1.4, 0.6], [0.8, 1.4]]) {
      const p = groundPt(base, u, v);
      c.fillStyle = '#6b4a2a';
      c.fillRect(p.x - 2, p.y - 30, 4, 30);
      ellipse(c, p.x, p.y - 30, 9, 9, '#e8d6a0');
      circle(c, p.x, p.y - 30, 4, '#c0392b');
    }
    void st;
  },
  siege_workshop: (c, base, st, L) => {
    ground(c, base, 3, '#8a7a5a');
    house(c, base, 0.2, 0.3, 1.8, 1.4, 44 + st * 6, L, 30);
    // catapulta
    const p = groundPt(base, 2.3, 1.6);
    box(c, p, 0.5, 0.35, 10, '#7a4a22');
    c.strokeStyle = '#5a3a1e';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(p.x, p.y - 12);
    c.lineTo(p.x + 26, p.y - 52);
    c.stroke();
    // aríete
    const q = groundPt(base, 2.4, 0.5);
    box(c, q, 0.4, 0.25, 18, '#6b4a2a');
  },
  infirmary: (c, base, st, L) => {
    ground(c, base, 2);
    house(c, base, 0.2, 0.2, 1.4, 1.0, 34 + st * 6, { ...L, wall: '#e8e0cf' }, 24);
    const p = groundPt(base, 1.0, 0.25);
    c.fillStyle = '#c0392b';
    c.fillRect(p.x - 3, p.y - 34, 6, 18);
    c.fillRect(p.x - 9, p.y - 28, 18, 6);
  },
  watchtower: (c, base, st, L) => {
    ground(c, base, 1);
    const b = groundPt(base, 0.3, 0.3);
    const legH = 60 + st * 12;
    for (const [u, v] of [[0, 0], [0.4, 0], [0, 0.4], [0.4, 0.4]]) {
      const p = groundPt(b, u, v);
      c.fillStyle = '#6b4a2a';
      c.fillRect(p.x - 2, p.y - legH, 4, legH);
    }
    const plat = { x: b.x, y: b.y - legH };
    const top = box(c, plat, 0.4, 0.4, 16, L.wall);
    pyramidRoof(c, top, 18, L.roof);
  },
  dungeon: (c, base, st, L) => {
    ground(c, base, 2, '#6a6a5a');
    const top = box(c, groundPt(base, 0.2, 0.2), 1.6, 1.6, 30 + st * 6, '#6e665c');
    void top;
    for (let i = 0; i < 4; i++) {
      const p = groundPt(base, 0.4 + i * 0.35, 0.2);
      c.fillStyle = '#1d130a';
      c.fillRect(p.x - 4, p.y - 22, 8, 12);
    }
    void L;
  },
  market: (c, base, st) => {
    ground(c, base, 2, '#c8b47a');
    const colors = ['#c0392b', '#2f6fb3', '#d68910', '#16a085'];
    for (let i = 0; i < 4; i++) {
      const u = 0.3 + (i % 2) * 0.9;
      const v = 0.3 + Math.floor(i / 2) * 0.9;
      const b = groundPt(base, u, v);
      box(c, b, 0.5, 0.5, 14, '#8a5a2b');
      const top = { B: { x: b.x, y: b.y - 34 }, R: { x: b.x + 32, y: b.y - 50 }, L: { x: b.x - 32, y: b.y - 50 }, T: { x: b.x, y: b.y - 66 } };
      gableRoof(c, top, 8, colors[i], 6);
    }
    void st;
  },
  tavern: (c, base, st, L) => {
    ground(c, base, 2);
    house(c, base, 0.2, 0.2, 1.4, 1.1, 40 + st * 6, L, 26);
    const p = groundPt(base, 1.65, 0.6);
    c.fillStyle = '#6b4a2a';
    c.fillRect(p.x - 1, p.y - 40, 3, 40);
    ellipse(c, p.x + 9, p.y - 34, 9, 7, '#d9a050');
    barrel(c, groundPt(base, 1.7, 1.2));
  },
  chapel: (c, base, st, L) => {
    ground(c, base, 2, '#8e9a6a');
    house(c, base, 0.3, 0.2, 1.2, 0.8, 44 + st * 8, { ...L, wall: st === 1 ? '#c8b89a' : L.wall }, 34);
    const t = tower(c, base, 0.25, 1.1, 0.5, 90 + st * 12, { ...L, wall: st === 1 ? '#c8b89a' : L.wall }, L.roof);
    c.fillStyle = '#f2c94c';
    c.fillRect(t.x - 1.5, t.y - 18, 3, 18);
    c.fillRect(t.x - 7, t.y - 13, 14, 3);
  },
  library: (c, base, st, L) => {
    ground(c, base, 2, '#8e8a6c');
    house(c, base, 0.2, 0.2, 1.5, 1.2, 48 + st * 8, { ...L, roof: '#2f5d9a' }, 30);
    for (let i = 0; i < 3; i++) {
      const p = groundPt(base, 0.35 + i * 0.4, 0.2);
      c.fillStyle = '#e8dcc0';
      c.fillRect(p.x - 2, p.y - 46, 5, 40);
    }
  },
  well: (c, base, st) => {
    ground(c, base, 1, '#8e9a6a');
    const p = groundPt(base, 0.5, 0.5);
    ellipse(c, p.x, p.y - 8, 18, 9, '#9aa0a6');
    ellipse(c, p.x, p.y - 12, 13, 6, '#2c4a6a');
    c.fillStyle = '#6b4a2a';
    c.fillRect(p.x - 16, p.y - 40, 3, 30);
    c.fillRect(p.x + 13, p.y - 40, 3, 30);
    poly(c, [{ x: p.x - 22, y: p.y - 38 }, { x: p.x, y: p.y - 52 }, { x: p.x + 22, y: p.y - 38 }], st >= 2 ? '#a14a35' : '#c9a050');
  },
  port: (c, base, st, L) => {
    ground(c, base, 3, '#c8b47a');
    water(c, base, 1.6, 0, 3, 3);
    for (let i = 0; i < 3; i++) groundQuad(c, base, 1.4, 0.3 + i * 0.9, 2.6, 0.55 + i * 0.9, '#8a5a2b', 'rgba(0,0,0,0.3)');
    house(c, base, 0.2, 0.3, 1.0, 1.0, 34 + st * 6, L, 22);
    // barco
    const p = groundPt(base, 2.4, 1.6);
    ellipse(c, p.x, p.y - 6, 30, 9, '#6b4a2a');
    c.fillStyle = '#5a3a1e';
    c.fillRect(p.x - 1, p.y - 60, 3, 54);
    poly(c, [{ x: p.x + 2, y: p.y - 58 }, { x: p.x + 26, y: p.y - 22 }, { x: p.x + 2, y: p.y - 18 }], '#efe6d0');
  },
  statue: (c, base, st) => {
    ground(c, base, 1, '#9aa07a');
    const p = groundPt(base, 0.5, 0.5);
    box(c, groundPt(base, 0.3, 0.3), 0.4, 0.4, 14, '#9aa0a6');
    ellipse(c, p.x, p.y - 34, 7, 14, st >= 3 ? '#d4af37' : '#b5bbc3');
    circle(c, p.x, p.y - 52, 6, st >= 3 ? '#d4af37' : '#b5bbc3');
  },
  garden: (c, base, st) => {
    ground(c, base, 1, '#6faa4a');
    const p = groundPt(base, 0.5, 0.5);
    ellipse(c, p.x, p.y - 4, 16, 8, '#5a9a3a');
    for (let i = 0; i < 6; i++) circle(c, p.x + Math.cos(i) * 12, p.y - 6 + Math.sin(i) * 5, 3, ['#e05a7a', '#f2c94c', '#ffffff'][i % 3]);
    if (st >= 2) ellipse(c, p.x, p.y - 8, 6, 3, '#4a8cc9');
    tree(c, groundPt(base, 0.2, 0.8), 0.7, '#4c8a34');
  },
};

export function drawBuilding(c: Ctx, id: BuildingId, size: number, stage: number, w: number, h: number): void {
  const base = { x: (size * TILE_W) / 2, y: h - 2 };
  void w;
  PAINTERS[id](c, base, stage, look(stage), hashRand(id.length * 31 + stage));
}

/** Andaime de obra genérico para 1×1, 2×2 ou 3×3. */
export function drawScaffold(c: Ctx, size: number, h: number): void {
  const base = { x: (size * TILE_W) / 2, y: h - 2 };
  groundQuad(c, base, 0, 0, size, size, '#b89a6a', 'rgba(40,30,10,0.3)');
  const H = 40 + size * 18;
  c.strokeStyle = '#8a5a2b';
  c.lineWidth = 3;
  for (let i = 0; i <= size; i++) {
    for (const [u, v] of [[i, 0.1], [0.1, i]]) {
      const p = groundPt(base, Math.min(size - 0.1, u), Math.min(size - 0.1, v));
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x, p.y - H);
      c.stroke();
    }
  }
  for (let k = 1; k <= 3; k++) {
    const y = (H * k) / 3;
    const a = groundPt(base, 0.1, 0.1);
    const b = groundPt(base, size - 0.1, 0.1);
    const d = groundPt(base, 0.1, size - 0.1);
    c.beginPath();
    c.moveTo(b.x, b.y - y);
    c.lineTo(a.x, a.y - y);
    c.lineTo(d.x, d.y - y);
    c.stroke();
  }
  stoneBlocks(c, base, size * 0.6, size * 0.15);
  void TILE_H;
}
