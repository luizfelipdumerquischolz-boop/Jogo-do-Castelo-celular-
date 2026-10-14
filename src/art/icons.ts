// Ícones planos (sem perspectiva) desenhados por código: recursos, itens e botões.
import { circle, ellipse, poly, shade, type Ctx } from './iso';

type IconPainter = (c: Ctx, s: number) => void;

function bag(c: Ctx, s: number, color: string, mark?: string): void {
  ellipse(c, s * 0.5, s * 0.62, s * 0.32, s * 0.28, color);
  poly(c, [{ x: s * 0.38, y: s * 0.36 }, { x: s * 0.62, y: s * 0.36 }, { x: s * 0.56, y: s * 0.26 }, { x: s * 0.44, y: s * 0.26 }], shade(color, -0.2));
  if (mark) {
    c.fillStyle = mark;
    c.font = `bold ${s * 0.22}px serif`;
    c.textAlign = 'center';
    c.fillText('✦', s * 0.5, s * 0.7);
  }
}

function grain(c: Ctx, s: number, color: string): void {
  c.strokeStyle = shade(color, -0.4);
  c.lineWidth = s * 0.04;
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.9);
    c.quadraticCurveTo(s * (0.5 + i * 0.1), s * 0.5, s * (0.5 + i * 0.18), s * 0.2);
    c.stroke();
    for (let k = 0; k < 4; k++) ellipse(c, s * (0.5 + i * 0.16) + (i * k * s) / 60, s * (0.25 + k * 0.08), s * 0.05, s * 0.035, color);
  }
}

function bottle(c: Ctx, s: number, color: string): void {
  poly(c, [{ x: s * 0.42, y: s * 0.15 }, { x: s * 0.58, y: s * 0.15 }, { x: s * 0.58, y: s * 0.35 }, { x: s * 0.7, y: s * 0.48 }, { x: s * 0.7, y: s * 0.88 }, { x: s * 0.3, y: s * 0.88 }, { x: s * 0.3, y: s * 0.48 }, { x: s * 0.42, y: s * 0.35 }], color);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(s * 0.35, s * 0.5, s * 0.06, s * 0.3);
}

function sword(c: Ctx, s: number, color = '#cfd6dc', x = 0.5, rot = -0.6): void {
  c.save();
  c.translate(s * x, s * 0.55);
  c.rotate(rot);
  poly(c, [{ x: -s * 0.04, y: -s * 0.38 }, { x: s * 0.04, y: -s * 0.38 }, { x: s * 0.04, y: s * 0.18 }, { x: -s * 0.04, y: s * 0.18 }], color);
  poly(c, [{ x: -s * 0.04, y: -s * 0.38 }, { x: 0, y: -s * 0.46 }, { x: s * 0.04, y: -s * 0.38 }], color);
  c.fillStyle = '#c9a14a';
  c.fillRect(-s * 0.14, s * 0.16, s * 0.28, s * 0.05);
  c.fillStyle = '#6b4a2a';
  c.fillRect(-s * 0.03, s * 0.21, s * 0.06, s * 0.14);
  c.restore();
}

function shieldShape(c: Ctx, s: number, color: string): void {
  c.beginPath();
  c.moveTo(s * 0.5, s * 0.12);
  c.lineTo(s * 0.82, s * 0.24);
  c.quadraticCurveTo(s * 0.8, s * 0.7, s * 0.5, s * 0.9);
  c.quadraticCurveTo(s * 0.2, s * 0.7, s * 0.18, s * 0.24);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.strokeStyle = 'rgba(30,20,10,0.6)';
  c.lineWidth = s * 0.03;
  c.stroke();
}

export const ITEM_ICONS: Record<string, IconPainter> = {
  wood: (c, s) => {
    for (let i = 0; i < 3; i++) {
      ellipse(c, s * 0.5, s * (0.4 + i * 0.16), s * 0.34, s * 0.08, '#9a6235');
      ellipse(c, s * 0.18, s * (0.4 + i * 0.16), s * 0.07, s * 0.08, '#e3b77e');
    }
  },
  stone: (c, s) => {
    poly(c, [{ x: s * 0.15, y: s * 0.8 }, { x: s * 0.25, y: s * 0.45 }, { x: s * 0.5, y: s * 0.32 }, { x: s * 0.78, y: s * 0.42 }, { x: s * 0.88, y: s * 0.8 }], '#9aa0a6');
    poly(c, [{ x: s * 0.25, y: s * 0.45 }, { x: s * 0.5, y: s * 0.32 }, { x: s * 0.6, y: s * 0.55 }], '#c4c9cf');
  },
  iron: (c, s) => {
    for (let i = 0; i < 3; i++) poly(c, [{ x: s * (0.2 + i * 0.05), y: s * (0.75 - i * 0.16) }, { x: s * (0.75 + i * 0.05), y: s * (0.75 - i * 0.16) }, { x: s * (0.68 + i * 0.05), y: s * (0.62 - i * 0.16) }, { x: s * (0.27 + i * 0.05), y: s * (0.62 - i * 0.16) }], i % 2 ? '#6f7880' : '#5c646b');
  },
  diamond: (c, s) => {
    poly(c, [{ x: s * 0.5, y: s * 0.85 }, { x: s * 0.15, y: s * 0.4 }, { x: s * 0.3, y: s * 0.2 }, { x: s * 0.7, y: s * 0.2 }, { x: s * 0.85, y: s * 0.4 }], '#9ee7f5');
    poly(c, [{ x: s * 0.3, y: s * 0.2 }, { x: s * 0.5, y: s * 0.4 }, { x: s * 0.7, y: s * 0.2 }], '#d6f7fd');
  },
  wheat: (c, s) => grain(c, s, '#e2c25a'),
  oats: (c, s) => grain(c, s, '#cdd27a'),
  barley: (c, s) => grain(c, s, '#c8a24a'),
  grapes: (c, s) => {
    for (let r = 0; r < 4; r++) for (let k = 0; k <= 3 - r; k++) circle(c, s * (0.32 + k * 0.12 + r * 0.06), s * (0.35 + r * 0.12), s * 0.07, '#6b2f6b', 'rgba(0,0,0,0.3)');
    poly(c, [{ x: s * 0.5, y: s * 0.28 }, { x: s * 0.65, y: s * 0.12 }, { x: s * 0.72, y: s * 0.2 }], '#5a8a3a');
  },
  cattle: (c, s) => {
    ellipse(c, s * 0.45, s * 0.58, s * 0.3, s * 0.18, '#f2efe8');
    ellipse(c, s * 0.38, s * 0.55, s * 0.1, s * 0.07, '#3b2a1a');
    circle(c, s * 0.78, s * 0.45, s * 0.11, '#f2efe8', 'rgba(0,0,0,0.3)');
    c.fillStyle = '#3b2a1a';
    for (const x of [0.25, 0.35, 0.55, 0.65]) c.fillRect(s * x, s * 0.7, s * 0.04, s * 0.16);
  },
  milk: (c, s) => bottle(c, s, '#f6f3ea'),
  wool: (c, s) => {
    for (let i = 0; i < 6; i++) circle(c, s * (0.3 + (i % 3) * 0.2), s * (0.45 + Math.floor(i / 3) * 0.18), s * 0.14, '#f6f3ea', 'rgba(0,0,0,0.15)');
  },
  wax: (c, s) => {
    c.fillStyle = '#efe0a0';
    c.fillRect(s * 0.4, s * 0.35, s * 0.2, s * 0.5);
    ellipse(c, s * 0.5, s * 0.28, s * 0.05, s * 0.09, '#f2a33a');
  },
  flour: (c, s) => bag(c, s, '#efe6d0'),
  charcoal: (c, s) => {
    for (let i = 0; i < 5; i++) circle(c, s * (0.3 + (i % 3) * 0.2), s * (0.5 + Math.floor(i / 3) * 0.18), s * 0.13, '#2b2b2b');
  },
  steel: (c, s) => {
    poly(c, [{ x: s * 0.15, y: s * 0.7 }, { x: s * 0.8, y: s * 0.7 }, { x: s * 0.7, y: s * 0.5 }, { x: s * 0.25, y: s * 0.5 }], '#b9c4ce');
    poly(c, [{ x: s * 0.25, y: s * 0.5 }, { x: s * 0.7, y: s * 0.5 }, { x: s * 0.62, y: s * 0.4 }, { x: s * 0.33, y: s * 0.4 }], '#dfe6ec');
  },
  leather: (c, s) => poly(c, [{ x: s * 0.2, y: s * 0.25 }, { x: s * 0.8, y: s * 0.2 }, { x: s * 0.85, y: s * 0.75 }, { x: s * 0.5, y: s * 0.85 }, { x: s * 0.15, y: s * 0.75 }], '#a8743f'),
  cloth: (c, s) => {
    poly(c, [{ x: s * 0.15, y: s * 0.3 }, { x: s * 0.85, y: s * 0.3 }, { x: s * 0.85, y: s * 0.8 }, { x: s * 0.15, y: s * 0.8 }], '#7a3b8f');
    c.strokeStyle = '#a65fb8';
    c.lineWidth = s * 0.02;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(s * 0.15, s * (0.4 + i * 0.1));
      c.lineTo(s * 0.85, s * (0.4 + i * 0.1));
      c.stroke();
    }
  },
  jewels: (c, s) => {
    circle(c, s * 0.5, s * 0.55, s * 0.28, 'rgba(0,0,0,0)', '#d4af37');
    c.lineWidth = s * 0.06;
    poly(c, [{ x: s * 0.5, y: s * 0.18 }, { x: s * 0.62, y: s * 0.3 }, { x: s * 0.5, y: s * 0.42 }, { x: s * 0.38, y: s * 0.3 }], '#c0392b');
  },
  bread: (c, s) => {
    ellipse(c, s * 0.5, s * 0.58, s * 0.36, s * 0.22, '#c98a3a');
    for (let i = 0; i < 3; i++) ellipse(c, s * (0.35 + i * 0.15), s * 0.52, s * 0.05, s * 0.1, '#e6b46a');
  },
  porridge: (c, s) => {
    ellipse(c, s * 0.5, s * 0.6, s * 0.36, s * 0.2, '#7a4a22');
    ellipse(c, s * 0.5, s * 0.52, s * 0.3, s * 0.1, '#efe0b0');
  },
  meat: (c, s) => {
    ellipse(c, s * 0.45, s * 0.55, s * 0.3, s * 0.22, '#b5473a');
    ellipse(c, s * 0.45, s * 0.55, s * 0.18, s * 0.12, '#d96a5a');
    c.fillStyle = '#f2efe8';
    c.fillRect(s * 0.68, s * 0.45, s * 0.2, s * 0.06);
  },
  fish: (c, s) => {
    ellipse(c, s * 0.45, s * 0.55, s * 0.3, s * 0.14, '#7aa6c9');
    poly(c, [{ x: s * 0.72, y: s * 0.55 }, { x: s * 0.9, y: s * 0.4 }, { x: s * 0.9, y: s * 0.7 }], '#5a86a9');
    circle(c, s * 0.25, s * 0.52, s * 0.025, '#1d130a');
  },
  eggs: (c, s) => {
    ellipse(c, s * 0.38, s * 0.6, s * 0.15, s * 0.2, '#f6f0e0');
    ellipse(c, s * 0.62, s * 0.62, s * 0.15, s * 0.2, '#efe2c8');
  },
  cheese: (c, s) => {
    poly(c, [{ x: s * 0.15, y: s * 0.7 }, { x: s * 0.85, y: s * 0.7 }, { x: s * 0.85, y: s * 0.45 }, { x: s * 0.3, y: s * 0.3 }], '#f2d36b');
    circle(c, s * 0.5, s * 0.55, s * 0.05, '#d9b44a');
    circle(c, s * 0.7, s * 0.6, s * 0.04, '#d9b44a');
  },
  vegetables: (c, s) => {
    poly(c, [{ x: s * 0.3, y: s * 0.35 }, { x: s * 0.45, y: s * 0.35 }, { x: s * 0.38, y: s * 0.88 }], '#e07a3a');
    c.fillStyle = '#5aa04a';
    c.fillRect(s * 0.34, s * 0.2, s * 0.08, s * 0.15);
    circle(c, s * 0.65, s * 0.62, s * 0.18, '#5aa04a', 'rgba(0,0,0,0.25)');
  },
  fruit: (c, s) => {
    circle(c, s * 0.4, s * 0.58, s * 0.2, '#d6452f', 'rgba(0,0,0,0.25)');
    circle(c, s * 0.65, s * 0.62, s * 0.16, '#e0a02f', 'rgba(0,0,0,0.25)');
    ellipse(c, s * 0.48, s * 0.32, s * 0.08, s * 0.04, '#5a8a3a');
  },
  beer: (c, s) => {
    poly(c, [{ x: s * 0.28, y: s * 0.3 }, { x: s * 0.66, y: s * 0.3 }, { x: s * 0.64, y: s * 0.86 }, { x: s * 0.3, y: s * 0.86 }], '#d9a050');
    ellipse(c, s * 0.47, s * 0.3, s * 0.21, s * 0.08, '#fff8e0');
    c.strokeStyle = '#8a5a2b';
    c.lineWidth = s * 0.05;
    c.beginPath();
    c.arc(s * 0.68, s * 0.55, s * 0.12, -1.2, 1.2);
    c.stroke();
  },
  wine: (c, s) => bottle(c, s, '#6b1f3b'),
  honey: (c, s) => {
    poly(c, [{ x: s * 0.28, y: s * 0.35 }, { x: s * 0.72, y: s * 0.35 }, { x: s * 0.78, y: s * 0.85 }, { x: s * 0.22, y: s * 0.85 }], '#e0b24a');
    c.fillStyle = '#7a5230';
    c.fillRect(s * 0.25, s * 0.28, s * 0.5, s * 0.08);
  },
  weapon: (c, s) => {
    sword(c, s, '#cfd6dc', 0.42, -0.5);
    c.strokeStyle = '#7a5230';
    c.lineWidth = s * 0.04;
    c.beginPath();
    c.moveTo(s * 0.75, s * 0.9);
    c.lineTo(s * 0.62, s * 0.12);
    c.stroke();
    poly(c, [{ x: s * 0.6, y: s * 0.08 }, { x: s * 0.66, y: s * 0.2 }, { x: s * 0.58, y: s * 0.2 }], '#cfd6dc');
  },
  armor: (c, s) => {
    poly(c, [{ x: s * 0.3, y: s * 0.2 }, { x: s * 0.7, y: s * 0.2 }, { x: s * 0.85, y: s * 0.35 }, { x: s * 0.72, y: s * 0.45 }, { x: s * 0.7, y: s * 0.85 }, { x: s * 0.3, y: s * 0.85 }, { x: s * 0.28, y: s * 0.45 }, { x: s * 0.15, y: s * 0.35 }], '#9aa0a6');
    c.strokeStyle = '#6f757e';
    c.lineWidth = s * 0.02;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(s * 0.3, s * (0.45 + i * 0.1));
      c.lineTo(s * 0.7, s * (0.45 + i * 0.1));
      c.stroke();
    }
  },
  shield: (c, s) => {
    shieldShape(c, s, '#a8743f');
    c.fillStyle = '#c0392b';
    c.fillRect(s * 0.46, s * 0.2, s * 0.08, s * 0.6);
  },
  crossbow: (c, s) => {
    c.strokeStyle = '#7a5230';
    c.lineWidth = s * 0.06;
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.9);
    c.lineTo(s * 0.5, s * 0.25);
    c.stroke();
    c.strokeStyle = '#6f757e';
    c.beginPath();
    c.arc(s * 0.5, s * 0.55, s * 0.32, -2.6, -0.54);
    c.stroke();
  },
  steelWeapon: (c, s) => sword(c, s, '#e8f0f6', 0.5, -0.6),
  steelArmor: (c, s) => {
    ITEM_ICONS.armor(c, s);
    c.fillStyle = 'rgba(220,235,245,0.55)';
    c.fillRect(s * 0.3, s * 0.2, s * 0.4, s * 0.65);
  },
  bow: (c, s) => {
    c.strokeStyle = '#7a5230';
    c.lineWidth = s * 0.06;
    c.beginPath();
    c.arc(s * 0.3, s * 0.5, s * 0.4, -1.1, 1.1);
    c.stroke();
    c.strokeStyle = '#e8e2d0';
    c.lineWidth = s * 0.015;
    c.beginPath();
    c.moveTo(s * 0.48, s * 0.14);
    c.lineTo(s * 0.48, s * 0.86);
    c.stroke();
  },
  horse: (c, s) => {
    ellipse(c, s * 0.45, s * 0.55, s * 0.28, s * 0.15, '#7a5230');
    poly(c, [{ x: s * 0.65, y: s * 0.5 }, { x: s * 0.82, y: s * 0.2 }, { x: s * 0.9, y: s * 0.28 }, { x: s * 0.75, y: s * 0.55 }], '#7a5230');
    c.fillStyle = '#5a3a1e';
    for (const x of [0.25, 0.35, 0.55, 0.65]) c.fillRect(s * x, s * 0.65, s * 0.04, s * 0.22);
  },
  banner: (c, s) => {
    c.fillStyle = '#5a3a1e';
    c.fillRect(s * 0.25, s * 0.1, s * 0.05, s * 0.8);
    poly(c, [{ x: s * 0.3, y: s * 0.12 }, { x: s * 0.8, y: s * 0.12 }, { x: s * 0.8, y: s * 0.55 }, { x: s * 0.55, y: s * 0.45 }, { x: s * 0.3, y: s * 0.55 }], '#c0392b');
  },
  gold: (c, s) => {
    for (let i = 0; i < 4; i++) ellipse(c, s * 0.5, s * (0.78 - i * 0.12), s * 0.3, s * 0.1, i % 2 ? '#f2c94c' : '#d4a72c');
  },
};

export const STAT_ICONS: Record<string, IconPainter> = {
  population: (c, s) => {
    circle(c, s * 0.35, s * 0.35, s * 0.12, '#e0b48a');
    ellipse(c, s * 0.35, s * 0.72, s * 0.18, s * 0.2, '#3f6fa8');
    circle(c, s * 0.65, s * 0.38, s * 0.11, '#e0b48a');
    ellipse(c, s * 0.65, s * 0.74, s * 0.16, s * 0.18, '#4e8a45');
  },
  happiness: (c, s) => {
    circle(c, s * 0.5, s * 0.5, s * 0.38, '#f2c94c', 'rgba(0,0,0,0.3)');
    circle(c, s * 0.38, s * 0.42, s * 0.04, '#3b2a1a');
    circle(c, s * 0.62, s * 0.42, s * 0.04, '#3b2a1a');
    c.strokeStyle = '#3b2a1a';
    c.lineWidth = s * 0.04;
    c.beginPath();
    c.arc(s * 0.5, s * 0.52, s * 0.18, 0.3, Math.PI - 0.3);
    c.stroke();
  },
  health: (c, s) => {
    c.fillStyle = '#c0392b';
    c.fillRect(s * 0.4, s * 0.15, s * 0.2, s * 0.7);
    c.fillRect(s * 0.15, s * 0.4, s * 0.7, s * 0.2);
  },
  morale: (c, s) => {
    c.fillStyle = '#5a3a1e';
    c.fillRect(s * 0.3, s * 0.1, s * 0.05, s * 0.8);
    poly(c, [{ x: s * 0.35, y: s * 0.12 }, { x: s * 0.8, y: s * 0.22 }, { x: s * 0.35, y: s * 0.4 }], '#2f6fb3');
  },
  loyalty: (c, s) => shieldShape(c, s, '#2f6fb3'),
  culture: (c, s) => {
    poly(c, [{ x: s * 0.2, y: s * 0.85 }, { x: s * 0.2, y: s * 0.35 }, { x: s * 0.5, y: s * 0.15 }, { x: s * 0.8, y: s * 0.35 }, { x: s * 0.8, y: s * 0.85 }], '#e8dcc0');
    for (let i = 0; i < 3; i++) {
      c.fillStyle = '#b5a88a';
      c.fillRect(s * (0.28 + i * 0.18), s * 0.42, s * 0.07, s * 0.4);
    }
  },
  research: (c, s) => {
    poly(c, [{ x: s * 0.15, y: s * 0.3 }, { x: s * 0.5, y: s * 0.38 }, { x: s * 0.5, y: s * 0.85 }, { x: s * 0.15, y: s * 0.77 }], '#e8dcc0');
    poly(c, [{ x: s * 0.85, y: s * 0.3 }, { x: s * 0.5, y: s * 0.38 }, { x: s * 0.5, y: s * 0.85 }, { x: s * 0.85, y: s * 0.77 }], '#d8cbaa');
  },
  time: (c, s) => {
    circle(c, s * 0.5, s * 0.5, s * 0.38, '#efe6d0', 'rgba(0,0,0,0.4)');
    c.strokeStyle = '#3b2a1a';
    c.lineWidth = s * 0.05;
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.5);
    c.lineTo(s * 0.5, s * 0.25);
    c.moveTo(s * 0.5, s * 0.5);
    c.lineTo(s * 0.68, s * 0.58);
    c.stroke();
  },
};

/** Ícones dos botões e abas da interface. */
export const UI_ICONS: Record<string, IconPainter> = {
  reino: (c, s) => {
    poly(c, [{ x: s * 0.1, y: s * 0.75 }, { x: s * 0.35, y: s * 0.3 }, { x: s * 0.55, y: s * 0.6 }, { x: s * 0.7, y: s * 0.4 }, { x: s * 0.9, y: s * 0.75 }], '#7d9a4a');
    poly(c, [{ x: s * 0.1, y: s * 0.75 }, { x: s * 0.9, y: s * 0.75 }, { x: s * 0.9, y: s * 0.88 }, { x: s * 0.1, y: s * 0.88 }], '#4a8cc9');
  },
  cidade: (c, s) => {
    poly(c, [{ x: s * 0.15, y: s * 0.88 }, { x: s * 0.15, y: s * 0.45 }, { x: s * 0.3, y: s * 0.45 }, { x: s * 0.3, y: s * 0.3 }, { x: s * 0.45, y: s * 0.3 }, { x: s * 0.45, y: s * 0.15 }, { x: s * 0.55, y: s * 0.15 }, { x: s * 0.55, y: s * 0.3 }, { x: s * 0.7, y: s * 0.3 }, { x: s * 0.7, y: s * 0.45 }, { x: s * 0.85, y: s * 0.45 }, { x: s * 0.85, y: s * 0.88 }], '#a9a197');
    poly(c, [{ x: s * 0.42, y: s * 0.88 }, { x: s * 0.42, y: s * 0.65 }, { x: s * 0.58, y: s * 0.65 }, { x: s * 0.58, y: s * 0.88 }], '#3b2a1a');
  },
  exercitos: (c, s) => {
    sword(c, s, '#e8e2d0', 0.4, -0.6);
    sword(c, s, '#e8e2d0', 0.6, 0.6);
  },
  cartas: (c, s) => {
    poly(c, [{ x: s * 0.12, y: s * 0.25 }, { x: s * 0.88, y: s * 0.25 }, { x: s * 0.88, y: s * 0.78 }, { x: s * 0.12, y: s * 0.78 }], '#efe6d0');
    poly(c, [{ x: s * 0.12, y: s * 0.25 }, { x: s * 0.5, y: s * 0.55 }, { x: s * 0.88, y: s * 0.25 }], '#d8cbaa');
    circle(c, s * 0.5, s * 0.55, s * 0.08, '#b33a3a');
  },
  mais: (c, s) => {
    for (let i = 0; i < 3; i++) circle(c, s * (0.25 + i * 0.25), s * 0.5, s * 0.08, '#efe6d0');
  },
  construir: (c, s) => {
    c.save();
    c.translate(s * 0.5, s * 0.5);
    c.rotate(-0.7);
    c.fillStyle = '#7a5230';
    c.fillRect(-s * 0.04, -s * 0.1, s * 0.08, s * 0.5);
    c.fillStyle = '#9aa0a6';
    c.fillRect(-s * 0.2, -s * 0.25, s * 0.4, s * 0.16);
    c.restore();
  },
  melhorar: (c, s) => poly(c, [{ x: s * 0.5, y: s * 0.12 }, { x: s * 0.85, y: s * 0.5 }, { x: s * 0.62, y: s * 0.5 }, { x: s * 0.62, y: s * 0.88 }, { x: s * 0.38, y: s * 0.88 }, { x: s * 0.38, y: s * 0.5 }, { x: s * 0.15, y: s * 0.5 }], '#6fbf5f'),
  mover: (c, s) => {
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) poly(c, [{ x: s * (0.5 + dx * 0.38), y: s * (0.5 + dy * 0.38) }, { x: s * (0.5 + dx * 0.2 - dy * 0.12), y: s * (0.5 + dy * 0.2 + dx * 0.12) }, { x: s * (0.5 + dx * 0.2 + dy * 0.12), y: s * (0.5 + dy * 0.2 - dx * 0.12) }], '#efe6d0');
    circle(c, s * 0.5, s * 0.5, s * 0.08, '#efe6d0');
  },
  demolir: (c, s) => {
    c.strokeStyle = '#e05555';
    c.lineWidth = s * 0.1;
    c.beginPath();
    c.moveTo(s * 0.25, s * 0.25);
    c.lineTo(s * 0.75, s * 0.75);
    c.moveTo(s * 0.75, s * 0.25);
    c.lineTo(s * 0.25, s * 0.75);
    c.stroke();
  },
  atacar: (c, s) => {
    sword(c, s, '#e8e2d0', 0.4, -0.6);
    sword(c, s, '#e8e2d0', 0.6, 0.6);
  },
  saquear: (c, s) => bag(c, s, '#a8743f', '#f2c94c'),
  espionar: (c, s) => {
    ellipse(c, s * 0.5, s * 0.5, s * 0.38, s * 0.2, '#efe6d0');
    circle(c, s * 0.5, s * 0.5, s * 0.13, '#2f6fb3');
    circle(c, s * 0.5, s * 0.5, s * 0.06, '#1d130a');
  },
  defender: (c, s) => shieldShape(c, s, '#2f6fb3'),
  voltar: (c, s) => poly(c, [{ x: s * 0.15, y: s * 0.5 }, { x: s * 0.5, y: s * 0.18 }, { x: s * 0.5, y: s * 0.38 }, { x: s * 0.85, y: s * 0.38 }, { x: s * 0.85, y: s * 0.62 }, { x: s * 0.5, y: s * 0.62 }, { x: s * 0.5, y: s * 0.82 }], '#efe6d0'),
  fechar: (c, s) => UI_ICONS.demolir(c, s),
  pesquisa: (c, s) => STAT_ICONS.research(c, s),
  diplomacia: (c, s) => {
    ellipse(c, s * 0.35, s * 0.5, s * 0.22, s * 0.12, '#e0b48a');
    ellipse(c, s * 0.65, s * 0.5, s * 0.22, s * 0.12, '#c99a6a');
  },
  taverna: (c, s) => ITEM_ICONS.beer(c, s),
  herois: (c, s) => {
    circle(c, s * 0.5, s * 0.35, s * 0.15, '#e0b48a');
    poly(c, [{ x: s * 0.25, y: s * 0.88 }, { x: s * 0.3, y: s * 0.55 }, { x: s * 0.7, y: s * 0.55 }, { x: s * 0.75, y: s * 0.88 }], '#7a3b8f');
    poly(c, [{ x: s * 0.36, y: s * 0.22 }, { x: s * 0.42, y: s * 0.1 }, { x: s * 0.5, y: s * 0.18 }, { x: s * 0.58, y: s * 0.1 }, { x: s * 0.64, y: s * 0.22 }], '#f2c94c');
  },
  missoes: (c, s) => {
    poly(c, [{ x: s * 0.2, y: s * 0.12 }, { x: s * 0.8, y: s * 0.12 }, { x: s * 0.8, y: s * 0.88 }, { x: s * 0.2, y: s * 0.88 }], '#efe6d0');
    c.strokeStyle = '#3d7a3a';
    c.lineWidth = s * 0.06;
    c.beginPath();
    c.moveTo(s * 0.3, s * 0.5);
    c.lineTo(s * 0.45, s * 0.65);
    c.lineTo(s * 0.7, s * 0.35);
    c.stroke();
  },
  mercado: (c, s) => ITEM_ICONS.gold(c, s),
  rotas: (c, s) => {
    ellipse(c, s * 0.45, s * 0.55, s * 0.3, s * 0.12, '#8a5a2b');
    circle(c, s * 0.28, s * 0.7, s * 0.1, '#5a3a1e');
    circle(c, s * 0.65, s * 0.7, s * 0.1, '#5a3a1e');
  },
  colonos: (c, s) => STAT_ICONS.population(c, s),
  relatorios: (c, s) => UI_ICONS.missoes(c, s),
  cronica: (c, s) => STAT_ICONS.research(c, s),
  artes: (c, s) => {
    ellipse(c, s * 0.5, s * 0.55, s * 0.38, s * 0.3, '#e8dcc0');
    for (const [x, y, col] of [[0.35, 0.45, '#c0392b'], [0.5, 0.38, '#2f6fb3'], [0.65, 0.45, '#f2c94c'], [0.6, 0.65, '#3d7a3a']] as const) circle(c, s * x, s * y, s * 0.06, col);
  },
  ajuda: (c, s) => {
    circle(c, s * 0.5, s * 0.5, s * 0.38, '#2f6fb3');
    c.fillStyle = '#fff';
    c.font = `bold ${s * 0.5}px serif`;
    c.textAlign = 'center';
    c.fillText('?', s * 0.5, s * 0.67);
  },
  novo: (c, s) => UI_ICONS.voltar(c, s),
  zoom: (c, s) => {
    circle(c, s * 0.42, s * 0.42, s * 0.25, 'rgba(0,0,0,0)', '#efe6d0');
    c.lineWidth = s * 0.08;
    c.strokeStyle = '#efe6d0';
    c.beginPath();
    c.moveTo(s * 0.6, s * 0.6);
    c.lineTo(s * 0.85, s * 0.85);
    c.stroke();
  },
  fundar: (c, s) => {
    c.fillStyle = '#5a3a1e';
    c.fillRect(s * 0.3, s * 0.15, s * 0.05, s * 0.75);
    poly(c, [{ x: s * 0.35, y: s * 0.17 }, { x: s * 0.8, y: s * 0.3 }, { x: s * 0.35, y: s * 0.45 }], '#2f6fb3');
  },
  recrutar: (c, s) => {
    circle(c, s * 0.5, s * 0.3, s * 0.13, '#e0b48a');
    poly(c, [{ x: s * 0.3, y: s * 0.88 }, { x: s * 0.33, y: s * 0.48 }, { x: s * 0.67, y: s * 0.48 }, { x: s * 0.7, y: s * 0.88 }], '#3f6fa8');
    c.strokeStyle = '#7a5230';
    c.lineWidth = s * 0.04;
    c.beginPath();
    c.moveTo(s * 0.8, s * 0.9);
    c.lineTo(s * 0.8, s * 0.12);
    c.stroke();
  },
};
