// Tela do assentamento: o interior das muralhas, onde as construções são arrastadas.
import { BALANCE } from '../sim/data/balance';
import { BUILDINGS, type BuildingId } from '../sim/data/buildings';
import { FRAME, buildingAt, canPlace, districtsUnlocked, quadrantOf, usableBounds, wallMaxHp } from '../sim/settlement';
import type { GameState, PlacedBuilding, Settlement } from '../sim/types';
import { art } from '../art/loader';
import { buildingSpriteSize, stageForLevel } from '../art/registry';

const TW = 64;
const TH = 32;

export interface Ghost {
  type: BuildingId;
  x: number;
  y: number;
  moving: number | null;
}

export class CityView {
  zoom = 1;
  camX = 0;
  camY = 0;
  state: GameState | null = null;
  settlementId: number | null = null;
  selectedBuilding: number | null = null;
  ghost: Ghost | null = null;
  ghostValid = false;
  ghostReason = '';
  dirty = true;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private draggingGhost = false;

  constructor(
    public canvas: HTMLCanvasElement,
    private onTapBuilding: (b: PlacedBuilding | null, tile: { x: number; y: number }) => void,
    private onGhostChange: () => void,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.bindInput();
  }

  settlement(): Settlement | undefined {
    return this.state?.settlements.find((s) => s.id === this.settlementId);
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
    this.dirty = true;
  }

  private cw(): number {
    return this.canvas.width / this.dpr;
  }
  private ch(): number {
    return this.canvas.height / this.dpr;
  }

  /** Enquadra o terreno inteiro na tela. */
  fit(): void {
    const s = this.settlement();
    if (!s) return;
    const g = s.gridSize + 2;
    const w = g * TW;
    this.zoom = Math.max(0.35, Math.min(1.6, (this.cw() * 0.95) / w));
    const c = FRAME / 2;
    const p = this.iso(c, c);
    this.camX = p.x;
    this.camY = p.y - 20;
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
    return { x: Math.floor((ix / (TW / 2) + iy / (TH / 2)) / 2), y: Math.floor((iy / (TH / 2) - ix / (TW / 2)) / 2) };
  }

  setGhost(g: Ghost | null): void {
    this.ghost = g;
    this.validateGhost();
    this.dirty = true;
    this.onGhostChange();
  }

  /** Posiciona o fantasma pelo ponto da tela (centro do prédio sob o dedo). */
  moveGhostTo(sx: number, sy: number): void {
    if (!this.ghost) return;
    const t = this.toTile(sx, sy);
    const n = BUILDINGS[this.ghost.type].size;
    this.ghost.x = t.x - Math.floor((n - 1) / 2);
    this.ghost.y = t.y - Math.floor((n - 1) / 2);
    this.validateGhost();
    this.dirty = true;
    this.onGhostChange();
  }

  validateGhost(): void {
    const s = this.settlement();
    if (!this.ghost || !s || !this.state) {
      this.ghostValid = false;
      return;
    }
    const r = canPlace(this.state, s, this.ghost.type, this.ghost.x, this.ghost.y, this.ghost.moving ?? -1);
    this.ghostValid = r.ok;
    this.ghostReason = r.ok ? '' : r.reason;
  }

  private bindInput(): void {
    const pts = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinch = 0;
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
        this.draggingGhost = false;
      }
      // Arrastar começando em cima do fantasma move o fantasma em vez do mapa.
      if (this.ghost && pts.size === 1) {
        const r = c.getBoundingClientRect();
        const t = this.toTile(e.clientX - r.left, e.clientY - r.top);
        const n = BUILDINGS[this.ghost.type].size;
        this.draggingGhost = t.x >= this.ghost.x - 1 && t.x < this.ghost.x + n + 1 && t.y >= this.ghost.y - 1 && t.y < this.ghost.y + n + 1;
      }
    });
    c.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) this.zoom = Math.max(0.3, Math.min(2.5, this.zoom * (d / pinch)));
        pinch = d;
      } else if (this.draggingGhost && this.ghost) {
        const r = c.getBoundingClientRect();
        this.moveGhostTo(e.clientX - r.left, e.clientY - r.top);
      } else {
        this.camX -= dx / this.zoom;
        this.camY -= dy / this.zoom;
      }
      this.dirty = true;
    });
    const up = (e: PointerEvent) => {
      const had = pts.has(e.pointerId);
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = 0;
      if (!had || pts.size > 0) return;
      const r = c.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      if (this.draggingGhost) {
        this.draggingGhost = false;
        return;
      }
      if (moved < 10) {
        if (this.ghost) {
          this.moveGhostTo(sx, sy);
          return;
        }
        const s = this.settlement();
        const t = this.toTile(sx, sy);
        const b = s ? buildingAt(s, t.x, t.y) : undefined;
        this.selectedBuilding = b ? b.id : null;
        this.dirty = true;
        this.onTapBuilding(b ?? null, t);
      }
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', (e) => pts.delete(e.pointerId));
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom = Math.max(0.3, Math.min(2.5, this.zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
        this.dirty = true;
      },
      { passive: false },
    );
  }

  draw(now: number): void {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, this.ch());
    g.addColorStop(0, '#5f7f3a');
    g.addColorStop(1, '#4a6a2e');
    c.fillStyle = g;
    c.fillRect(0, 0, this.cw(), this.ch());
    const s = this.settlement();
    const st = this.state;
    if (!s || !st) return;
    const tw = TW * this.zoom;
    const th = TH * this.zoom;
    const sc = tw / 128;
    const bnd = usableBounds(s);
    const unlocked = districtsUnlocked(s);
    const core0 = (FRAME - BALANCE.capitalCore) / 2;

    // Chão de fora (decoração) e de dentro.
    for (let y = bnd.y0 - 3; y < bnd.y1 + 3; y++) {
      for (let x = bnd.x0 - 3; x < bnd.x1 + 3; x++) {
        const p = this.toScreen(x, y);
        const inside = x >= bnd.x0 && x < bnd.x1 && y >= bnd.y0 && y < bnd.y1;
        let key = 'chao-grama';
        if (inside) {
          if (s.kind === 'capital') {
            const q = quadrantOf(x, y);
            if (q >= 0 && q < unlocked && s.districts[q]?.vocation) key = 'chao-bairro';
            else if (x >= core0 + 3 && x < core0 + 9 && y >= core0 + 3 && y < core0 + 9) key = 'chao-pavimento';
          } else if (Math.abs(x - 11.5) < 2.5 && Math.abs(y - 11.5) < 2.5) key = 'chao-pavimento';
        }
        const img = art(key);
        c.globalAlpha = inside ? 1 : 0.55;
        c.drawImage(img, p.x - tw / 2, p.y, tw, th);
        c.globalAlpha = 1;
      }
    }
    // Rótulos dos bairros.
    if (s.kind === 'capital') {
      const centers = [
        [bnd.x0 + 2, bnd.y0 + 2],
        [bnd.x1 - 3, bnd.y0 + 2],
        [bnd.x0 + 2, bnd.y1 - 3],
        [bnd.x1 - 3, bnd.y1 - 3],
      ];
      for (let q = 0; q < 4; q++) {
        if (q >= unlocked) continue;
        const d = s.districts[q];
        const p = this.toScreen(centers[q][0], centers[q][1]);
        c.font = 'bold 11px Georgia, serif';
        c.textAlign = 'center';
        c.fillStyle = 'rgba(30,20,10,0.6)';
        const label = d?.vocation ? `Bairro ${vocLabel(d.vocation)} · nv ${d.level}` : 'Bairro livre';
        const w = c.measureText(label).width + 8;
        c.fillRect(p.x - w / 2, p.y - 6, w, 15);
        c.fillStyle = '#f3e7c9';
        c.fillText(label, p.x, p.y + 5);
      }
    }

    // Muralha, construções e fantasma, em ordem de profundidade.
    type Item = { depth: number; draw: () => void };
    const items: Item[] = [];
    const d = s.defenses;
    if (d.wallLevel > 0) {
      const stage = stageForLevel(d.wallLevel);
      const damaged = d.wallHp < wallMaxHp(st, d.wallLevel, s.nation) * 0.5;
      const dmg = damaged ? '-danificada' : '';
      const push = (x: number, y: number, piece: string) => {
        items.push({
          depth: x + y,
          draw: () => {
            const p = this.toScreen(x, y);
            const img = art(`muralha-${piece}-${stage}${dmg}`);
            const h = (img.height as number) * sc;
            c.drawImage(img, p.x - tw / 2, p.y + th - h, tw, h);
          },
        });
      };
      const gateX = Math.floor((bnd.x0 + bnd.x1) / 2);
      for (let x = bnd.x0; x < bnd.x1; x++) {
        push(x, bnd.y0 - 1, 'reta-a');
        push(x, bnd.y1, x === gateX && d.gateLevel > 0 ? 'portao' : 'reta-a');
      }
      for (let y = bnd.y0; y < bnd.y1; y++) {
        push(bnd.x0 - 1, y, 'reta-b');
        push(bnd.x1, y, 'reta-b');
      }
      for (const [x, y] of [[bnd.x0 - 1, bnd.y0 - 1], [bnd.x1, bnd.y0 - 1], [bnd.x0 - 1, bnd.y1], [bnd.x1, bnd.y1]]) push(x, y, d.towers > 0 ? 'torre' : 'canto');
      if (d.moat) {
        for (let x = bnd.x0 - 2; x <= bnd.x1 + 1; x++) {
          for (const y of [bnd.y0 - 2, bnd.y1 + 1]) {
            const p = this.toScreen(x, y);
            c.drawImage(art('muralha-fosso'), p.x - tw / 2, p.y, tw, th);
          }
        }
      }
    }
    for (const b of s.buildings) {
      const n = BUILDINGS[b.type].size;
      items.push({ depth: b.x + b.y + 2 * n - 1, draw: () => this.drawBuilding(c, b, now) });
    }
    if (this.ghost) {
      const gh = this.ghost;
      const n = BUILDINGS[gh.type].size;
      items.push({
        depth: gh.x + gh.y + 2 * n + 0.5,
        draw: () => {
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const p = this.toScreen(gh.x + x, gh.y + y);
            diamond(c, p.x, p.y, tw, th, this.ghostValid ? 'rgba(80,200,90,0.45)' : 'rgba(220,60,50,0.5)');
          }
          c.globalAlpha = 0.75;
          this.drawSprite(c, gh.type, 1, gh.x, gh.y);
          c.globalAlpha = 1;
        },
      });
    }
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) it.draw();
    this.dirty = false;
  }

  private drawSprite(c: CanvasRenderingContext2D, type: BuildingId, level: number, x: number, y: number): void {
    const n = BUILDINGS[type].size;
    const base = this.toScreen(x + n, y + n);
    const { w, h } = buildingSpriteSize(type);
    const sc = (TW * this.zoom) / 128;
    const img = art(`construcao-${type}-${stageForLevel(Math.max(1, level))}`);
    c.drawImage(img, base.x - (w * sc) / 2, base.y - h * sc + 2 * sc, w * sc, h * sc);
  }

  private drawBuilding(c: CanvasRenderingContext2D, b: PlacedBuilding, now: number): void {
    const n = BUILDINGS[b.type].size;
    const sc = (TW * this.zoom) / 128;
    if (b.level === 0 && b.build) {
      const base = this.toScreen(b.x + n, b.y + n);
      const img = art(`andaime-${n}`);
      const h = (img.height as number) * sc;
      const w = (img.width as number) * sc;
      c.drawImage(img, base.x - w / 2, base.y - h + 2 * sc, w, h);
    } else {
      this.drawSprite(c, b.type, b.level, b.x, b.y);
      if (b.build) {
        // Melhoria em andamento: andaime por cima, meio transparente.
        const base = this.toScreen(b.x + n, b.y + n);
        const img = art(`andaime-${n}`);
        c.globalAlpha = 0.55;
        c.drawImage(img, base.x - ((img.width as number) * sc) / 2, base.y - (img.height as number) * sc + 2 * sc, (img.width as number) * sc, (img.height as number) * sc);
        c.globalAlpha = 1;
      }
    }
    const top = this.toScreen(b.x + n / 2, b.y + n / 2);
    // Barra de obra.
    if (b.build) {
      const pct = 1 - b.build.remaining / b.build.total;
      const w = 46;
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.fillRect(top.x - w / 2, top.y - 8, w, 7);
      c.fillStyle = '#f2c94c';
      c.fillRect(top.x - w / 2 + 1, top.y - 7, (w - 2) * pct, 5);
    }
    // Parada por falta de insumo ou de gente.
    if (!b.build && b.level > 0 && BUILDINGS[b.type].workers > 0 && b.efficiency < 0.2 && BUILDINGS[b.type].recipes.length) {
      const blink = Math.sin(now / 300) > 0;
      if (blink) {
        c.fillStyle = '#e05555';
        c.beginPath();
        c.arc(top.x, top.y - 16, 7, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#fff';
        c.font = 'bold 11px sans-serif';
        c.textAlign = 'center';
        c.fillText('!', top.x, top.y - 12);
      }
    }
    if (this.selectedBuilding === b.id) {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const p = this.toScreen(b.x + x, b.y + y);
        diamondStroke(c, p.x, p.y, TW * this.zoom, TH * this.zoom, '#f2c94c');
      }
    }
  }
}

function vocLabel(v: string): string {
  return ({ agricultural: 'agrícola', mining: 'mineiro', industrial: 'industrial', commercial: 'comercial', cultural: 'cultural', military: 'militar', fortress: 'fortaleza' } as Record<string, string>)[v] ?? v;
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

function diamondStroke(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string): void {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w / 2, y + h / 2);
  c.lineTo(x, y + h);
  c.lineTo(x - w / 2, y + h / 2);
  c.closePath();
  c.strokeStyle = stroke;
  c.lineWidth = 2;
  c.stroke();
}
