// Arte padrão de soldados, terreno, objetos do mapa, efeitos e ilustrações.
import type { UnitId } from '../sim/data/units';
import { TILE_H, TILE_W, box, circle, ellipse, flag, gableRoof, groundPt, groundQuad, hashRand, poly, pyramidRoof, shade, type Ctx, type Pt } from './iso';

// Soldados --------------------------------------------------------------------

interface UnitLook {
  body: string;
  helmet: string;
  weapon: 'spear' | 'bow' | 'sword' | 'crossbow' | 'axe' | 'none' | 'ram' | 'catapult' | 'ladder' | 'tower';
  mount?: string;
  shield?: string;
  skin?: string;
  big?: boolean;
}

const UNIT_LOOK: Record<UnitId, UnitLook> = {
  spearman: { body: '#3f6fa8', helmet: '#8d939c', weapon: 'spear', shield: '#c0392b' },
  archer: { body: '#4e8a45', helmet: '#3d7a3a', weapon: 'bow' },
  knight: { body: '#a83232', helmet: '#8d939c', weapon: 'spear', mount: '#7a5230' },
  shieldman: { body: '#6a6aa8', helmet: '#9aa0a6', weapon: 'sword', shield: '#a8743f' },
  crossbowman: { body: '#7a6a3a', helmet: '#8d939c', weapon: 'crossbow' },
  scout: { body: '#8a7a4a', helmet: '#6b4a2a', weapon: 'none', mount: '#9a7a50' },
  horseArcher: { body: '#5a8a5a', helmet: '#6b4a2a', weapon: 'bow', mount: '#6b4a2a' },
  heavyKnight: { body: '#c8d0d8', helmet: '#c8d0d8', weapon: 'sword', mount: '#3b3b3b', shield: '#2f5d9a' },
  ram: { body: '#6b4a2a', helmet: '#6b4a2a', weapon: 'ram' },
  catapult: { body: '#7a4a22', helmet: '#7a4a22', weapon: 'catapult' },
  ladder: { body: '#8a5a2b', helmet: '#8a5a2b', weapon: 'ladder' },
  siegeTower: { body: '#7a4a22', helmet: '#7a4a22', weapon: 'tower' },
  axeman: { body: '#8a5a3a', helmet: '#5a3a1e', weapon: 'axe', skin: '#c89a6a' },
  hunter: { body: '#6a7a3a', helmet: '#5a4a2a', weapon: 'bow', skin: '#c89a6a' },
  tribalRider: { body: '#9a6a3a', helmet: '#5a3a1e', weapon: 'axe', mount: '#8a6a4a', skin: '#c89a6a' },
  brigand: { body: '#4a4a4a', helmet: '#2b2b2b', weapon: 'sword' },
  northman: { body: '#4a5560', helmet: '#9aa0a6', weapon: 'axe', shield: '#2c3e50' },
  steppeRider: { body: '#a87a3a', helmet: '#6b4a2a', weapon: 'bow', mount: '#c8a070' },
  mercenary: { body: '#5d6d7e', helmet: '#8d939c', weapon: 'sword', shield: '#7f8c8d' },
  warlord: { body: '#2c3e50', helmet: '#d4af37', weapon: 'axe', shield: '#8e1b1b', big: true },
  militia: { body: '#8a7a6a', helmet: '#6b4a2a', weapon: 'spear' },
};

function drawSiege(c: Ctx, s: number, kind: UnitLook['weapon']): void {
  const k = s / 64;
  if (kind === 'ram') {
    box(c, { x: s * 0.45, y: s * 0.85 }, 0.35 * k * 1.6, 0.2 * k * 1.6, 18 * k, '#6b4a2a');
    ellipse(c, s * 0.75, s * 0.62, 8 * k, 6 * k, '#5a5a5a');
  } else if (kind === 'catapult') {
    box(c, { x: s * 0.45, y: s * 0.88 }, 0.3 * k * 1.6, 0.25 * k * 1.6, 8 * k, '#7a4a22');
    c.strokeStyle = '#5a3a1e';
    c.lineWidth = 3 * k;
    c.beginPath();
    c.moveTo(s * 0.45, s * 0.7);
    c.lineTo(s * 0.75, s * 0.2);
    c.stroke();
    circle(c, s * 0.77, s * 0.18, 4 * k, '#8d939c');
  } else if (kind === 'ladder') {
    c.strokeStyle = '#8a5a2b';
    c.lineWidth = 3 * k;
    c.beginPath();
    c.moveTo(s * 0.35, s * 0.92);
    c.lineTo(s * 0.5, s * 0.08);
    c.moveTo(s * 0.55, s * 0.92);
    c.lineTo(s * 0.7, s * 0.08);
    for (let i = 1; i < 8; i++) {
      c.moveTo(s * (0.35 + i * 0.019), s * (0.92 - i * 0.105));
      c.lineTo(s * (0.55 + i * 0.019), s * (0.92 - i * 0.105));
    }
    c.stroke();
  } else {
    const top = box(c, { x: s * 0.5, y: s * 0.95 }, 0.3 * k * 1.6, 0.3 * k * 1.6, 44 * k, '#7a4a22');
    pyramidRoof(c, top, 10 * k, '#a8743f');
  }
}

/** Boneco de um soldado. `s` = lado do quadrado. */
export function drawUnit(c: Ctx, id: UnitId, s: number, portrait = false): void {
  const L = UNIT_LOOK[id];
  if (['ram', 'catapult', 'ladder', 'tower'].includes(L.weapon)) {
    if (portrait) {
      const g = c.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, '#d9c393');
      g.addColorStop(1, '#a88a5a');
      c.fillStyle = g;
      c.fillRect(0, 0, s, s);
    }
    drawSiege(c, s, L.weapon);
    return;
  }
  const k = (s / 64) * (L.big ? 1.15 : 1);
  if (portrait) {
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#d9c393');
    g.addColorStop(1, '#a88a5a');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
    ellipse(c, s * 0.5, s * 0.95, s * 0.4, s * 0.06, 'rgba(0,0,0,0.25)');
  } else ellipse(c, s * 0.5, s * 0.92, s * 0.28, s * 0.06, 'rgba(0,0,0,0.3)');
  const cx = s * 0.5;
  let footY = s * 0.9;
  if (L.mount) {
    // cavalo
    ellipse(c, cx, s * 0.66, 18 * k, 9 * k, L.mount);
    poly(c, [{ x: cx + 12 * k, y: s * 0.62 }, { x: cx + 24 * k, y: s * 0.42 }, { x: cx + 29 * k, y: s * 0.47 }, { x: cx + 18 * k, y: s * 0.68 }], L.mount);
    c.fillStyle = shade(L.mount, -0.3);
    for (const dx of [-13, -6, 6, 13]) c.fillRect(cx + dx * k, s * 0.7, 3 * k, 14 * k);
    footY = s * 0.62;
  }
  const skin = L.skin ?? '#e0b48a';
  // corpo
  poly(c, [{ x: cx - 9 * k, y: footY }, { x: cx - 7 * k, y: footY - 22 * k }, { x: cx + 7 * k, y: footY - 22 * k }, { x: cx + 9 * k, y: footY }], L.body);
  if (!L.mount) {
    c.fillStyle = shade(L.body, -0.4);
    c.fillRect(cx - 6 * k, footY, 4 * k, 6 * k);
    c.fillRect(cx + 2 * k, footY, 4 * k, 6 * k);
  }
  // cabeça e elmo
  circle(c, cx, footY - 28 * k, 6 * k, skin);
  poly(c, [{ x: cx - 7 * k, y: footY - 29 * k }, { x: cx + 7 * k, y: footY - 29 * k }, { x: cx + 5 * k, y: footY - 37 * k }, { x: cx - 5 * k, y: footY - 37 * k }], L.helmet);
  if (L.big) poly(c, [{ x: cx - 7 * k, y: footY - 37 * k }, { x: cx - 10 * k, y: footY - 46 * k }, { x: cx - 3 * k, y: footY - 37 * k }], '#e8e2d0');
  // arma
  c.lineWidth = 2.5 * k;
  c.strokeStyle = '#7a5230';
  if (L.weapon === 'spear') {
    c.beginPath();
    c.moveTo(cx + 11 * k, footY + 2 * k);
    c.lineTo(cx + 14 * k, footY - 46 * k);
    c.stroke();
    poly(c, [{ x: cx + 12 * k, y: footY - 46 * k }, { x: cx + 14 * k, y: footY - 54 * k }, { x: cx + 17 * k, y: footY - 46 * k }], '#cfd6dc');
  } else if (L.weapon === 'bow') {
    c.beginPath();
    c.arc(cx + 9 * k, footY - 20 * k, 14 * k, -1.2, 1.2);
    c.stroke();
  } else if (L.weapon === 'sword') {
    c.strokeStyle = '#cfd6dc';
    c.lineWidth = 3 * k;
    c.beginPath();
    c.moveTo(cx + 10 * k, footY - 10 * k);
    c.lineTo(cx + 18 * k, footY - 32 * k);
    c.stroke();
  } else if (L.weapon === 'crossbow') {
    c.beginPath();
    c.moveTo(cx + 4 * k, footY - 16 * k);
    c.lineTo(cx + 20 * k, footY - 18 * k);
    c.stroke();
    c.strokeStyle = '#6f757e';
    c.beginPath();
    c.arc(cx + 18 * k, footY - 18 * k, 8 * k, -2, 2);
    c.stroke();
  } else if (L.weapon === 'axe') {
    c.beginPath();
    c.moveTo(cx + 10 * k, footY);
    c.lineTo(cx + 15 * k, footY - 34 * k);
    c.stroke();
    poly(c, [{ x: cx + 14 * k, y: footY - 34 * k }, { x: cx + 24 * k, y: footY - 38 * k }, { x: cx + 22 * k, y: footY - 26 * k }], '#9aa0a6');
  }
  if (L.shield) {
    ellipse(c, cx - 9 * k, footY - 12 * k, 6 * k, 9 * k, L.shield);
  }
}

export const UNIT_ART_IDS = Object.keys(UNIT_LOOK) as UnitId[];

// Terreno -----------------------------------------------------------------------

const TERRAIN_COLORS: Record<string, [string, string]> = {
  mar: ['#2c5d8f', '#3a6fa3'],
  grama: ['#7aa04a', '#6f9643'],
  terra: ['#a08a5a', '#957f52'],
  areia: ['#dcc890', '#d2bd84'],
  neve: ['#eef2f6', '#dfe6ee'],
};

export function drawTerrainTile(c: Ctx, kind: string, w: number, h: number, seed = 1): void {
  const base = { x: w / 2, y: h };
  const r = hashRand(seed * 97 + kind.length * 13);
  const top = (col: string) => {
    poly(c, [{ x: w / 2, y: h - TILE_H }, { x: w, y: h - TILE_H / 2 }, { x: w / 2, y: h }, { x: 0, y: h - TILE_H / 2 }], col, '');
  };
  const pal = TERRAIN_COLORS[kind];
  if (pal) {
    top(pal[0]);
    for (let i = 0; i < 18; i++) {
      const u = r();
      const v = r();
      const p = groundPt(base, u, v);
      ellipse(c, p.x, p.y, 3 + r() * 5, 1.5 + r() * 2, pal[1]);
    }
    if (kind === 'mar') for (let i = 0; i < 4; i++) {
      const p = groundPt(base, r(), r());
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(p.x, p.y, 6, 3.6, 5.8);
      c.stroke();
    }
    return;
  }
  switch (kind) {
    case 'colina':
      top('#7aa04a');
      ellipse(c, w / 2, h - TILE_H / 2 + 6, 46, 20, '#6f9643');
      ellipse(c, w / 2 - 6, h - TILE_H / 2, 34, 15, '#86ac56');
      break;
    case 'montanha': {
      top('#8a8a7a');
      poly(c, [{ x: w * 0.12, y: h - TILE_H / 2 + 4 }, { x: w * 0.45, y: h - TILE_H - 70 }, { x: w * 0.88, y: h - TILE_H / 2 + 4 }, { x: w / 2, y: h - 6 }], '#7f7a72');
      poly(c, [{ x: w * 0.45, y: h - TILE_H - 70 }, { x: w * 0.88, y: h - TILE_H / 2 + 4 }, { x: w / 2, y: h - 6 }], '#5f5a52');
      poly(c, [{ x: w * 0.36, y: h - TILE_H - 44 }, { x: w * 0.45, y: h - TILE_H - 70 }, { x: w * 0.55, y: h - TILE_H - 46 }], '#f2f4f6');
      break;
    }
    case 'rio':
    case 'vau':
      top('#7aa04a');
      groundQuad(c, base, 0, 0.3, 1, 0.7, kind === 'vau' ? '#7fb3dd' : '#3f7fbf', '');
      if (kind === 'vau') for (let i = 0; i < 4; i++) ellipse(c, groundPt(base, 0.15 + i * 0.23, 0.5).x, groundPt(base, 0.15 + i * 0.23, 0.5).y, 5, 3, '#9aa0a6');
      break;
    case 'floresta':
    case 'bosque': {
      top(kind === 'floresta' ? '#4f7a35' : '#6f9643');
      const n = kind === 'floresta' ? 5 : 3;
      const pts = Array.from({ length: n }, () => groundPt(base, 0.2 + r() * 0.6, 0.2 + r() * 0.6)).sort((a, b) => a.y - b.y);
      for (const p of pts) {
        c.fillStyle = '#5a3a1e';
        c.fillRect(p.x - 2, p.y - 12, 4, 12);
        poly(c, [{ x: p.x - 14, y: p.y - 10 }, { x: p.x, y: p.y - 46 }, { x: p.x + 14, y: p.y - 10 }], kind === 'floresta' ? '#2f5a26' : '#3f7a30');
        poly(c, [{ x: p.x - 11, y: p.y - 24 }, { x: p.x, y: p.y - 54 }, { x: p.x + 11, y: p.y - 24 }], kind === 'floresta' ? '#386b2c' : '#4c8a38');
      }
      break;
    }
    case 'pantano':
      top('#6a7a50');
      for (let i = 0; i < 5; i++) {
        const p = groundPt(base, r(), r());
        ellipse(c, p.x, p.y, 10, 4, '#4a6a6a');
        c.strokeStyle = '#5a7a3a';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(p.x + 6, p.y);
        c.lineTo(p.x + 8, p.y - 12);
        c.stroke();
      }
      break;
    case 'estrada':
      top('#7aa04a');
      groundQuad(c, base, 0.3, 0, 0.7, 1, '#b8a070', '');
      groundQuad(c, base, 0, 0.3, 1, 0.7, '#b8a070', '');
      break;
    case 'ponte':
      top('#3f7fbf');
      groundQuad(c, base, 0.25, 0, 0.75, 1, '#8a5a2b', 'rgba(0,0,0,0.4)');
      break;
    case 'costa':
      top('#dcc890');
      groundQuad(c, base, 0, 0.6, 1, 1, '#3a6fa3', '');
      break;
  }
}

export const TERRAIN_KINDS = ['mar', 'grama', 'terra', 'areia', 'neve', 'colina', 'montanha', 'rio', 'vau', 'floresta', 'bosque', 'pantano', 'estrada', 'ponte', 'costa'];

// Depósitos -----------------------------------------------------------------------

export function drawDeposit(c: Ctx, type: string, s: number, depleted: boolean): void {
  const k = s / 128;
  const cx = s / 2;
  const cy = s * 0.7;
  ellipse(c, cx, cy + 6 * k, 40 * k, 14 * k, 'rgba(0,0,0,0.2)');
  const dim = (col: string) => (depleted ? shade(col, -0.5) : col);
  if (type === 'iron' || type === 'stone' || type === 'gold' || type === 'diamond') {
    poly(c, [{ x: cx - 34 * k, y: cy }, { x: cx - 20 * k, y: cy - 30 * k }, { x: cx + 6 * k, y: cy - 38 * k }, { x: cx + 32 * k, y: cy - 16 * k }, { x: cx + 30 * k, y: cy + 4 * k }], dim('#8d939c'));
    const fleck = { iron: '#8a4a3a', stone: '#c4c9cf', gold: '#f2c94c', diamond: '#9ee7f5' }[type];
    if (!depleted) for (let i = 0; i < 5; i++) circle(c, cx + (-20 + i * 10) * k, cy - (10 + (i % 2) * 12) * k, 4 * k, fleck);
  } else if (type === 'fertile') {
    for (let i = 0; i < 4; i++) ellipse(c, cx + (-24 + i * 16) * k, cy - 6 * k, 6 * k, 12 * k, dim('#e2c25a'));
    ellipse(c, cx, cy, 36 * k, 10 * k, dim('#6b4a2a'));
  } else if (type === 'fish') {
    ellipse(c, cx, cy - 10 * k, 22 * k, 10 * k, dim('#7aa6c9'));
    poly(c, [{ x: cx + 20 * k, y: cy - 10 * k }, { x: cx + 34 * k, y: cy - 20 * k }, { x: cx + 34 * k, y: cy }], dim('#5a86a9'));
  }
  if (depleted) {
    c.strokeStyle = 'rgba(80,20,20,0.7)';
    c.lineWidth = 4 * k;
    c.beginPath();
    c.moveTo(cx - 20 * k, cy - 34 * k);
    c.lineTo(cx + 20 * k, cy + 2 * k);
    c.stroke();
  }
}

// Objetos do mapa ---------------------------------------------------------------------

/** Ícone de um assentamento no mapa. A cor da bandeira é pintada por cima, na hora. */
export function drawMapSettlement(c: Ctx, kind: string, s: number, banner = '#cccccc'): void {
  const k = s / 128;
  const base = { x: s / 2, y: s * 0.86 };
  const g = (u: number, v: number) => ({ x: base.x + (u - v) * 26 * k, y: base.y - (u + v) * 13 * k });
  ellipse(c, base.x, base.y - 14 * k, 50 * k, 18 * k, 'rgba(0,0,0,0.2)');
  const L = { wall: '#b5ab9a', roof: '#a14a35' };
  if (kind === 'camp' || kind === 'camp-ruin') {
    const ruin = kind === 'camp-ruin';
    for (const [u, v] of [[0.2, 0.2], [1, 0.4], [0.5, 1]]) {
      const p = g(u, v);
      poly(c, [{ x: p.x - 18 * k, y: p.y }, { x: p.x, y: p.y - (ruin ? 10 : 34) * k }, { x: p.x + 18 * k, y: p.y }], ruin ? '#5a4a3a' : '#8a6a3a');
    }
    if (!ruin) ellipse(c, base.x, base.y - 18 * k, 6 * k, 8 * k, '#e67e22');
    return;
  }
  if (kind.startsWith('tribe')) {
    const lvl = Number(kind.slice(5)) || 1;
    if (lvl >= 2) {
      c.strokeStyle = lvl >= 3 ? '#8d939c' : '#6b4a2a';
      c.lineWidth = 5 * k;
      c.beginPath();
      const pts = [g(-0.1, -0.1), g(1.6, -0.1), g(1.6, 1.6), g(-0.1, 1.6)];
      pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y - 8 * k) : c.moveTo(p.x, p.y - 8 * k)));
      c.closePath();
      c.stroke();
    }
    for (const [u, v] of [[0.3, 0.3], [1.0, 0.4], [0.5, 1.1], [1.1, 1.1]].slice(0, 1 + lvl)) {
      const p = g(u, v);
      ellipse(c, p.x, p.y - 8 * k, 16 * k, 8 * k, '#7a5a3a');
      poly(c, [{ x: p.x - 16 * k, y: p.y - 8 * k }, { x: p.x, y: p.y - 34 * k }, { x: p.x + 16 * k, y: p.y - 8 * k }], '#a07a4a');
    }
    if (lvl >= 3) {
      const t = box(c, g(0.6, 0.6), 0.25, 0.25, 50 * k, '#8d939c');
      pyramidRoof(c, t, 14 * k, '#5a3a1e');
    }
    flag(c, base.x + 30 * k, base.y - 30 * k, 30 * k, banner);
    return;
  }
  const scale = { capital: 1.25, city: 1.05, castle: 1, village: 0.8, outpost: 0.6 }[kind] ?? 1;
  const kk = k * scale;
  // muralha
  if (kind !== 'village' && kind !== 'outpost') {
    const top = box(c, { x: base.x, y: base.y - 2 * k }, 1.2 * kk * 0.42, 1.2 * kk * 0.42, 16 * kk, '#9a948a');
    void top;
  }
  const houses = kind === 'outpost' ? 1 : kind === 'village' ? 3 : 4;
  for (let i = 0; i < houses; i++) {
    const p = g(0.25 + (i % 2) * 0.7, 0.25 + Math.floor(i / 2) * 0.7);
    const t = box(c, p, 0.16 * kk, 0.14 * kk, 16 * kk, kind === 'village' ? '#a7794a' : L.wall);
    gableRoof(c, t, 8 * kk, L.roof, 1);
  }
  if (kind === 'capital' || kind === 'city' || kind === 'castle') {
    const t = box(c, g(0.55, 0.55), 0.18 * kk, 0.18 * kk, (kind === 'capital' ? 64 : 48) * kk, '#c8beae');
    pyramidRoof(c, t, 16 * kk, '#2f5d9a');
    flag(c, (t.L.x + t.R.x) / 2, (t.T.y + t.B.y) / 2 - 16 * kk, 30 * kk, banner);
  } else {
    flag(c, base.x + 20 * k, base.y - 20 * k, 26 * k, banner);
  }
}

export function drawTraveler(c: Ctx, kind: string, s: number, color = '#2f6fb3'): void {
  const k = s / 64;
  ellipse(c, s / 2, s * 0.85, s * 0.3, s * 0.07, 'rgba(0,0,0,0.3)');
  if (kind === 'ship') {
    poly(c, [{ x: s * 0.1, y: s * 0.6 }, { x: s * 0.9, y: s * 0.6 }, { x: s * 0.75, y: s * 0.8 }, { x: s * 0.25, y: s * 0.8 }], '#5a3a1e');
    c.fillStyle = '#3b2a1a';
    c.fillRect(s * 0.48, s * 0.08, 3 * k, s * 0.52);
    poly(c, [{ x: s * 0.52, y: s * 0.1 }, { x: s * 0.85, y: s * 0.45 }, { x: s * 0.52, y: s * 0.52 }], '#8e1b1b');
    return;
  }
  if (kind === 'wagon' || kind === 'caravan') {
    box(c, { x: s * 0.45, y: s * 0.75 }, 0.18 * k, 0.12 * k, 12 * k, '#8a5a2b');
    circle(c, s * 0.3, s * 0.78, 6 * k, '#3b2a1a');
    circle(c, s * 0.62, s * 0.8, 6 * k, '#3b2a1a');
    if (kind === 'caravan') ellipse(c, s * 0.45, s * 0.42, 14 * k, 8 * k, '#efe6d0');
    ellipse(c, s * 0.82, s * 0.62, 7 * k, 5 * k, '#7a5230');
    return;
  }
  if (kind === 'messenger') {
    ellipse(c, s * 0.5, s * 0.65, 14 * k, 7 * k, '#7a5230');
    circle(c, s * 0.5, s * 0.42, 5 * k, '#e0b48a');
    poly(c, [{ x: s * 0.42, y: s * 0.62 }, { x: s * 0.44, y: s * 0.46 }, { x: s * 0.56, y: s * 0.46 }, { x: s * 0.58, y: s * 0.62 }], color);
    poly(c, [{ x: s * 0.6, y: s * 0.48 }, { x: s * 0.72, y: s * 0.48 }, { x: s * 0.72, y: s * 0.56 }, { x: s * 0.6, y: s * 0.56 }], '#efe6d0');
    return;
  }
  if (kind === 'colonists') {
    for (let i = 0; i < 3; i++) {
      circle(c, s * (0.3 + i * 0.2), s * 0.45, 4 * k, '#e0b48a');
      poly(c, [{ x: s * (0.25 + i * 0.2), y: s * 0.8 }, { x: s * (0.27 + i * 0.2), y: s * 0.52 }, { x: s * (0.33 + i * 0.2), y: s * 0.52 }, { x: s * (0.35 + i * 0.2), y: s * 0.8 }], i === 1 ? color : '#8a7a5a');
    }
    return;
  }
  // espião
  circle(c, s * 0.5, s * 0.4, 6 * k, '#e0b48a');
  poly(c, [{ x: s * 0.36, y: s * 0.82 }, { x: s * 0.4, y: s * 0.38 }, { x: s * 0.6, y: s * 0.38 }, { x: s * 0.64, y: s * 0.82 }], '#2b2b2b');
}

// Efeitos e ilustrações -------------------------------------------------------------------

export function drawEffect(c: Ctx, kind: string, s: number): void {
  const k = s / 64;
  if (kind === 'fogo') {
    for (let i = 0; i < 3; i++) poly(c, [{ x: s * (0.3 + i * 0.15), y: s * 0.85 }, { x: s * (0.38 + i * 0.12), y: s * (0.3 + i * 0.1) }, { x: s * (0.5 + i * 0.1), y: s * 0.85 }], ['#e0702a', '#f2c94c', '#e0442a'][i], '');
  } else if (kind === 'fumaca') {
    for (let i = 0; i < 4; i++) ellipse(c, s * (0.4 + i * 0.06), s * (0.8 - i * 0.18), 10 * k - i, 8 * k - i, `rgba(180,180,180,${0.6 - i * 0.12})`);
  } else if (kind === 'poeira') {
    for (let i = 0; i < 5; i++) ellipse(c, s * (0.2 + i * 0.15), s * 0.8, 8 * k, 5 * k, 'rgba(190,160,110,0.5)');
  } else if (kind === 'flecha') {
    c.strokeStyle = '#5a3a1e';
    c.lineWidth = 2 * k;
    c.beginPath();
    c.moveTo(s * 0.15, s * 0.85);
    c.lineTo(s * 0.85, s * 0.15);
    c.stroke();
    poly(c, [{ x: s * 0.85, y: s * 0.15 }, { x: s * 0.72, y: s * 0.2 }, { x: s * 0.8, y: s * 0.28 }], '#9aa0a6');
  } else if (kind === 'impacto') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      poly(c, [{ x: s / 2, y: s / 2 }, { x: s / 2 + Math.cos(a) * 28 * k, y: s / 2 + Math.sin(a) * 28 * k }, { x: s / 2 + Math.cos(a + 0.3) * 14 * k, y: s / 2 + Math.sin(a + 0.3) * 14 * k }], '#f2c94c', '');
    }
  } else if (kind === 'neve') {
    const r = hashRand(3);
    for (let i = 0; i < 14; i++) circle(c, r() * s, r() * s, 1.5 * k, '#ffffff');
  } else if (kind === 'chuva') {
    const r = hashRand(4);
    c.strokeStyle = 'rgba(160,190,230,0.8)';
    c.lineWidth = 1.5 * k;
    for (let i = 0; i < 14; i++) {
      const x = r() * s;
      const y = r() * s;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 3 * k, y + 8 * k);
      c.stroke();
    }
  } else if (kind === 'batalha') {
    c.strokeStyle = '#e8e2d0';
    c.lineWidth = 4 * k;
    c.beginPath();
    c.moveTo(s * 0.2, s * 0.2);
    c.lineTo(s * 0.8, s * 0.8);
    c.moveTo(s * 0.8, s * 0.2);
    c.lineTo(s * 0.2, s * 0.8);
    c.stroke();
  }
}

export const EFFECT_KINDS = ['fogo', 'fumaca', 'poeira', 'flecha', 'impacto', 'neve', 'chuva', 'batalha'];

export function drawIllustration(c: Ctx, kind: string, w: number, h: number): void {
  const g = c.createLinearGradient(0, 0, 0, h);
  const sky: Record<string, [string, string]> = {
    vitoria: ['#f6d77a', '#d98b3a'],
    derrota: ['#5a5a6a', '#2b2b35'],
    titulo: ['#8fb8de', '#e8d6a0'],
    imperador: ['#7a3b8f', '#d4af37'],
    'carta-secreta': ['#1d2b45', '#3b5a8a'],
  };
  const [a, b] = sky[kind] ?? ['#d9c393', '#a88a5a'];
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // colinas
  poly(c, [{ x: 0, y: h * 0.75 }, { x: w * 0.3, y: h * 0.6 }, { x: w * 0.6, y: h * 0.72 }, { x: w, y: h * 0.58 }, { x: w, y: h }, { x: 0, y: h }], kind === 'derrota' ? '#3a3a3a' : '#5a7a3a', '');
  const cx = w / 2;
  const base = h * 0.78;
  const castle = kind !== 'carta-secreta';
  if (castle) {
    const col = kind === 'derrota' ? '#5a5650' : '#c8beae';
    poly(c, [{ x: cx - 90, y: base }, { x: cx - 90, y: base - 70 }, { x: cx + 90, y: base - 70 }, { x: cx + 90, y: base }], col);
    for (const dx of [-90, 70]) poly(c, [{ x: cx + dx, y: base }, { x: cx + dx, y: base - 110 }, { x: cx + dx + 20, y: base - 110 }, { x: cx + dx + 20, y: base }], shade(col, -0.1));
    poly(c, [{ x: cx - 25, y: base - 70 }, { x: cx - 25, y: base - 150 }, { x: cx + 25, y: base - 150 }, { x: cx + 25, y: base - 70 }], shade(col, 0.05));
    poly(c, [{ x: cx - 30, y: base - 150 }, { x: cx, y: base - 190 }, { x: cx + 30, y: base - 150 }], kind === 'imperador' ? '#7a3b8f' : '#2f5d9a');
    flag(c, cx, base - 190, 30, kind === 'derrota' ? '#2b2b2b' : '#f2c94c');
    if (kind === 'derrota') for (let i = 0; i < 3; i++) ellipse(c, cx - 60 + i * 50, base - 120 - i * 10, 22, 14, 'rgba(60,60,60,0.6)');
    if (kind === 'imperador' || kind === 'vitoria') {
      poly(c, [{ x: cx - 40, y: h * 0.2 }, { x: cx - 30, y: h * 0.08 }, { x: cx - 12, y: h * 0.16 }, { x: cx, y: h * 0.04 }, { x: cx + 12, y: h * 0.16 }, { x: cx + 30, y: h * 0.08 }, { x: cx + 40, y: h * 0.2 }], '#d4af37');
    }
  } else {
    // navio no mar ao luar
    circle(c, w * 0.8, h * 0.2, 26, '#f2f2e8');
    poly(c, [{ x: 0, y: h * 0.7 }, { x: w, y: h * 0.7 }, { x: w, y: h }, { x: 0, y: h }], '#122036', '');
    poly(c, [{ x: cx - 60, y: h * 0.68 }, { x: cx + 60, y: h * 0.68 }, { x: cx + 45, y: h * 0.78 }, { x: cx - 45, y: h * 0.78 }], '#3b2a1a');
    c.fillStyle = '#2b1d10';
    c.fillRect(cx - 2, h * 0.3, 4, h * 0.38);
    poly(c, [{ x: cx + 2, y: h * 0.32 }, { x: cx + 50, y: h * 0.6 }, { x: cx + 2, y: h * 0.64 }], '#e8e2d0');
  }
  void TILE_W;
}

export const ILLUSTRATION_KINDS = ['titulo', 'vitoria', 'derrota', 'imperador', 'carta-secreta'];

export function drawHeroPortrait(c: Ctx, n: number, s: number): void {
  const r = hashRand(n * 7 + 3);
  const g = c.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, '#d9c393');
  g.addColorStop(1, '#8a6a4a');
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
  const k = s / 256;
  const robe = ['#7a3b8f', '#2f5d9a', '#3d7a3a', '#8e1b1b', '#6b4a2a', '#2c3e50'][n % 6];
  poly(c, [{ x: s * 0.18, y: s }, { x: s * 0.28, y: s * 0.62 }, { x: s * 0.72, y: s * 0.62 }, { x: s * 0.82, y: s }], robe);
  circle(c, s * 0.5, s * 0.42, 52 * k, ['#e0b48a', '#c89a6a', '#a8784a', '#f0c8a0'][n % 4]);
  const hair = ['#3b2a1a', '#7a5230', '#d9b44a', '#9a9a9a', '#1d130a'][Math.floor(r() * 5)];
  ellipse(c, s * 0.5, s * 0.3, 54 * k, 26 * k, hair);
  circle(c, s * 0.43, s * 0.43, 5 * k, '#1d130a');
  circle(c, s * 0.57, s * 0.43, 5 * k, '#1d130a');
  if (n % 2 === 0) ellipse(c, s * 0.5, s * 0.55, 30 * k, 18 * k, hair);
  if (n % 3 === 0) poly(c, [{ x: s * 0.36, y: s * 0.24 }, { x: s * 0.4, y: s * 0.12 }, { x: s * 0.5, y: s * 0.2 }, { x: s * 0.6, y: s * 0.12 }, { x: s * 0.64, y: s * 0.24 }], '#d4af37');
}

export function drawWallPiece(c: Ctx, piece: string, s: number, stage: number, damaged: boolean, ih = s): void {
  // Ponta de baixo do losango da casa encosta no pé da imagem.
  // Eixo u (↗) = direção y do terreno; eixo v (↖) = direção x do terreno.
  const base = { x: s / 2, y: ih - 1 };
  const col = stage === 1 ? '#8a6a45' : stage === 2 ? '#9a948a' : '#c8beae';
  const h = 30 + stage * 10;
  const b0 = base;
  if (piece === 'reta-a' || piece === 'reta-b') {
    // reta-a corre ao longo de x (tela ↘), reta-b ao longo de y (tela ↙).
    const t = piece === 'reta-a' ? box(c, groundPt(b0, 0.35, 0), 0.3, 1, h, col) : box(c, groundPt(b0, 0, 0.35), 1, 0.3, h, col);
    battlements(c, t, piece === 'reta-a');
  } else if (piece === 'canto' || piece === 'torre') {
    const t = box(c, groundPt(b0, 0.15, 0.15), 0.7, 0.7, h + (piece === 'torre' ? 30 : 10), shade(col, 0.05));
    if (piece === 'torre') pyramidRoof(c, t, 24, stage === 1 ? '#c9a050' : '#a14a35');
  } else if (piece === 'portao') {
    box(c, groundPt(b0, 0.35, 0), 0.3, 1, h + 14, col);
    const a = groundPt(b0, 0.35, 0.36);
    const b = groundPt(b0, 0.35, 0.64);
    poly(c, [a, b, { x: b.x, y: b.y - 34 }, { x: a.x, y: a.y - 34 }], '#5a3a1e');
  } else if (piece === 'fosso') {
    groundQuad(c, b0, 0, 0, 1, 1, '#3f7fbf', 'rgba(0,0,0,0.3)');
  }
  if (damaged && piece !== 'fosso') {
    c.strokeStyle = 'rgba(20,10,5,0.8)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(base.x - 10, base.y - h);
    c.lineTo(base.x, base.y - h * 0.6);
    c.lineTo(base.x - 6, base.y - h * 0.3);
    c.stroke();
    ellipse(c, base.x + 16, base.y - 6, 10, 5, '#7a7266');
  }
}

/** Ameias no topo de um trecho reto. */
function battlements(c: Ctx, t: { B: Pt; R: Pt; L: Pt; T: Pt }, alongV: boolean): void {
  const from = t.B;
  const to = alongV ? t.L : t.R;
  for (let i = 0; i < 4; i++) {
    const f = (i + 0.25) / 4;
    const x = from.x + (to.x - from.x) * f;
    const y = from.y + (to.y - from.y) * f;
    poly(c, [{ x: x - 4, y }, { x: x + 4, y }, { x: x + 4, y: y - 7 }, { x: x - 4, y: y - 7 }], 'rgba(0,0,0,0.18)', '', 0);
  }
}

export const WALL_PIECES = ['reta-a', 'reta-b', 'canto', 'torre', 'portao', 'fosso'];

export function drawGroundTile(c: Ctx, kind: string, w: number, h: number): void {
  const colors: Record<string, [string, string]> = {
    grama: ['#7d9a4a', '#73914a'],
    terra: ['#a8916a', '#9a845e'],
    pavimento: ['#b8b0a0', '#a8a090'],
    bairro: ['#c9b98a', '#bba97a'],
  };
  const [a, b] = colors[kind] ?? colors.grama;
  poly(c, [{ x: w / 2, y: h - TILE_H }, { x: w, y: h - TILE_H / 2 }, { x: w / 2, y: h }, { x: 0, y: h - TILE_H / 2 }], a, 'rgba(40,30,10,0.25)', 1);
  const r = hashRand(kind.length);
  for (let i = 0; i < 10; i++) {
    const p = groundPt({ x: w / 2, y: h }, r(), r());
    ellipse(c, p.x, p.y, 4 + r() * 4, 2, b);
  }
  if (kind === 'pavimento') {
    c.strokeStyle = 'rgba(80,70,60,0.35)';
    for (let i = 1; i < 4; i++) {
      const p1 = groundPt({ x: w / 2, y: h }, i / 4, 0);
      const p2 = groundPt({ x: w / 2, y: h }, i / 4, 1);
      c.beginPath();
      c.moveTo(p1.x, p1.y);
      c.lineTo(p2.x, p2.y);
      c.stroke();
    }
  }
}

export function drawDecoration(c: Ctx, kind: string, s: number): void {
  const base = { x: s / 2, y: s * 0.9 };
  if (kind === 'arvore') {
    c.fillStyle = '#5a3a1e';
    c.fillRect(base.x - 4, base.y - 34, 8, 34);
    circle(c, base.x, base.y - 50, 26, '#3f6b2a', 'rgba(0,0,0,0.3)');
    circle(c, base.x - 10, base.y - 60, 14, '#4c8a34');
  } else if (kind === 'arbusto') {
    ellipse(c, base.x, base.y - 12, 26, 16, '#4c8a34');
    ellipse(c, base.x - 8, base.y - 18, 12, 9, '#5aa04a');
  } else {
    poly(c, [{ x: base.x - 26, y: base.y }, { x: base.x - 14, y: base.y - 24 }, { x: base.x + 10, y: base.y - 28 }, { x: base.x + 26, y: base.y }], '#8d939c');
    poly(c, [{ x: base.x - 14, y: base.y - 24 }, { x: base.x + 10, y: base.y - 28 }, { x: base.x, y: base.y - 12 }], '#b5bbc3');
  }
}
