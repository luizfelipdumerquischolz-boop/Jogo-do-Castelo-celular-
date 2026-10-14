import { SEASON_NAMES } from '../sim/data/balance';
import { ITEMS, type ItemId, type Stock } from '../sim/data/items';
import { UNITS, type Troops, type UnitId } from '../sim/data/units';
import { season, year } from '../sim/util';
import { artUrl } from '../art/loader';
import { esc } from './dom';

export function fmt(n: number): string {
  const v = Math.floor(n);
  if (Math.abs(v) >= 100000) return `${Math.round(v / 1000)}k`;
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(1).replace('.', ',')}k`;
  return String(v);
}

export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(r).padStart(2, '0')}s`;
  return `${r}s`;
}

export function dateLabel(time: number): string {
  return `Ano ${year(time)}, ${SEASON_NAMES[season(time)]}`;
}

export function icon(key: string, size = 20, cls = ''): string {
  return `<img class="ic ${cls}" src="${artUrl(key)}" width="${size}" height="${size}" alt="" draggable="false">`;
}

export function itemIcon(id: ItemId | 'gold', size = 18): string {
  return icon(`icone-${id}`, size);
}

export function costChips(cost: Stock, gold: number, have: Stock, treasury: number): string {
  const parts: string[] = [];
  for (const k in cost) {
    const id = k as ItemId;
    const need = cost[id] ?? 0;
    if (need <= 0) continue;
    const short = (have[id] ?? 0) < need;
    parts.push(`<span class="chip ${short ? 'short' : ''}" title="${esc(ITEMS[id].name)}">${itemIcon(id, 16)}${fmt(need)}</span>`);
  }
  if (gold > 0) parts.push(`<span class="chip ${treasury < gold ? 'short' : ''}" title="Ouro">${itemIcon('gold', 16)}${fmt(gold)}</span>`);
  return parts.join('');
}

export function troopLine(t: Troops, empty = 'nenhuma'): string {
  const parts = Object.entries(t)
    .filter(([, n]) => (n ?? 0) >= 1)
    .map(([u, n]) => `${Math.floor(n!)} ${Math.floor(n!) === 1 ? UNITS[u as UnitId].name : UNITS[u as UnitId].plural}`);
  return parts.length ? parts.join(', ') : empty;
}

export function troopChips(t: Troops): string {
  return Object.entries(t)
    .filter(([, n]) => (n ?? 0) >= 1)
    .map(([u, n]) => `<span class="chip" title="${esc(UNITS[u as UnitId].plural)}">${icon(`boneco-${u}`, 22)}${Math.floor(n!)}</span>`)
    .join('');
}

export function pct(v: number): string {
  return `${Math.round(v)}%`;
}
