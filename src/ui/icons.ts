// Arte original em SVG desenhada para este jogo (formas simples, sem recursos externos).
import type { BuildingId, Faction, ResourceId, UnitId } from '../game';

const svg = (body: string, size = 40) =>
  `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;

const RESOURCE_ART: Record<ResourceId, string> = {
  food: `<path d="M20 6c-2 6-2 10 0 14 2-4 2-8 0-14z" fill="#e7b443"/>
    <path d="M20 14c-5 2-7 6-6 10 4-1 6-5 6-10zM20 14c5 2 7 6 6 10-4-1-6-5-6-10z" fill="#d79a2b"/>
    <rect x="19" y="20" width="2" height="15" rx="1" fill="#8a6a2a"/>`,
  wood: `<rect x="6" y="20" width="28" height="9" rx="4.5" fill="#9a6235"/>
    <rect x="6" y="11" width="28" height="9" rx="4.5" fill="#b0743f"/>
    <circle cx="9" cy="15.5" r="3.5" fill="#e3b77e"/><circle cx="9" cy="24.5" r="3.5" fill="#d9a865"/>
    <circle cx="9" cy="15.5" r="1.4" fill="#9a6235"/><circle cx="9" cy="24.5" r="1.4" fill="#7d4b25"/>`,
  stone: `<path d="M5 30l5-12 9-4 9 3 7 13z" fill="#8d939c"/>
    <path d="M10 18l9-4 9 3-6 6z" fill="#b5bbc3"/><path d="M22 23l6-6 7 13z" fill="#6f757e"/>`,
  gold: `<ellipse cx="20" cy="27" rx="12" ry="5" fill="#b8860b"/>
    <ellipse cx="20" cy="24" rx="12" ry="5" fill="#f2c94c"/>
    <ellipse cx="20" cy="17" rx="9" ry="4" fill="#b8860b"/><ellipse cx="20" cy="14" rx="9" ry="4" fill="#ffd966"/>`,
};

export function resourceIcon(r: ResourceId, size = 18): string {
  return svg(RESOURCE_ART[r], size);
}

const BUILDING_ART: Record<BuildingId, string> = {
  farm: `<rect x="3" y="26" width="34" height="10" rx="2" fill="#c9a14a"/>
    <path d="M6 26v-3M10 26v-4M14 26v-3M26 26v-4M30 26v-3M34 26v-4" stroke="#8a6a2a" stroke-width="1.5"/>
    <path d="M8 24V14l8-7 8 7v10z" fill="#b5523b"/><path d="M6 15l10-9 10 9" stroke="#6d2c1f" stroke-width="2.5" fill="none"/>
    <rect x="13" y="17" width="6" height="7" fill="#5a3a22"/>
    <circle cx="31" cy="12" r="4" fill="#f2d16b"/>`,
  sawmill: `<rect x="4" y="18" width="20" height="16" fill="#8b5a2b"/><path d="M2 19l12-10 12 10z" fill="#5e3a1b"/>
    <circle cx="30" cy="24" r="8" fill="none" stroke="#5f6b75" stroke-width="3"/>
    <path d="M30 16v16M22 24h16M24.5 18.5l11 11M35.5 18.5l-11 11" stroke="#5f6b75" stroke-width="2"/>
    <rect x="9" y="25" width="6" height="9" fill="#3d2410"/>`,
  quarry: `<path d="M2 36l8-20 8 6 6-12 14 26z" fill="#8d939c"/>
    <path d="M18 22l6-12 14 26H26z" fill="#6f757e"/>
    <path d="M8 36l4-8h8l4 8z" fill="#b5bbc3"/>
    <path d="M27 6l8 8M35 6l-8 8" stroke="#5a3a22" stroke-width="2.5" stroke-linecap="round"/>`,
  barracks: `<rect x="5" y="16" width="30" height="20" fill="#7b6f5c"/>
    <path d="M5 16h4v-4h4v4h4v-4h6v4h4v-4h4v4h4" fill="#7b6f5c"/>
    <rect x="16" y="24" width="8" height="12" rx="4" fill="#3b2f22"/>
    <path d="M20 4v10" stroke="#3b2f22" stroke-width="1.5"/><path d="M20 4h9l-3 3 3 3h-9z" fill="#b33a3a"/>`,
  wall: `<path d="M2 36V18h5v-5h5v5h5v-5h6v5h5v-5h5v5h5v18z" fill="#9aa0a6"/>
    <path d="M2 24h36M2 30h36M10 18v6M20 24v6M30 18v6M14 30v6M26 30v6" stroke="#6f757e" stroke-width="1.2"/>`,
  storehouse: `<path d="M3 18l17-12 17 12z" fill="#7d4b25"/><rect x="6" y="18" width="28" height="18" fill="#a8743f"/>
    <path d="M6 24h28M6 30h28" stroke="#7d4b25" stroke-width="1"/>
    <rect x="15" y="24" width="10" height="12" fill="#5a3a22"/>
    <ellipse cx="11" cy="33" rx="3" ry="3" fill="#d9a865"/><ellipse cx="29" cy="33" rx="3" ry="3" fill="#d9a865"/>`,
};

export function buildingIcon(b: BuildingId, size = 44): string {
  return svg(BUILDING_ART[b], size);
}

const UNIT_ART: Record<UnitId, string> = {
  spearman: `<path d="M27 3l3 6-2 1z" fill="#cfd6dc"/><path d="M28 8L18 36" stroke="#7a5230" stroke-width="2"/>
    <circle cx="16" cy="12" r="5" fill="#e0b48a"/><path d="M11 11a5 5 0 0110 0z" fill="#8d939c"/>
    <path d="M10 18h12l2 14H8z" fill="#3f6fa8"/><path d="M8 20l-3 4 4 8 5-2z" fill="#c0392b" stroke="#7a1f16"/>`,
  archer: `<path d="M28 6q10 14 0 28" stroke="#7a5230" stroke-width="2.5" fill="none"/>
    <path d="M28 6v28" stroke="#ddd" stroke-width="0.8"/><path d="M12 20h18" stroke="#5a3a22" stroke-width="1.5"/>
    <path d="M30 20l-3-2v4z" fill="#8d939c"/>
    <circle cx="15" cy="11" r="5" fill="#e0b48a"/><path d="M9 11l6-7 6 7z" fill="#3d7a3a"/>
    <path d="M9 17h12l1 17H8z" fill="#4e8a45"/>`,
  cavalry: `<path d="M6 26q4-10 16-10h6l6-6 2 4-3 4v8l-4 2-2 8h-3l1-7H14l-2 7H9l1-8z" fill="#7a5230"/>
    <circle cx="20" cy="10" r="4" fill="#e0b48a"/><path d="M16 10a4 4 0 018 0z" fill="#8d939c"/>
    <path d="M16 14h8l1 7h-10z" fill="#a83232"/><path d="M26 3v14" stroke="#cfd6dc" stroke-width="1.5"/>`,
};

export function unitIcon(u: UnitId, size = 44): string {
  return svg(UNIT_ART[u], size);
}

const FORT_ART: Record<Faction, string> = {
  player: `<path d="M6 36V16h5v-4h4v4h3V8h4v8h3v-4h4v4h5v20z" fill="#2f5d9a"/>
    <rect x="17" y="26" width="6" height="10" rx="3" fill="#1b2f4d"/>
    <path d="M20 2v6" stroke="#1b2f4d" stroke-width="1.2"/><path d="M20 2h7l-2 2 2 2h-7z" fill="#f2c94c"/>`,
  lord: `<path d="M6 36V16h5v-4h4v4h3V8h4v8h3v-4h4v4h5v20z" fill="#7a3b8f"/>
    <rect x="17" y="26" width="6" height="10" rx="3" fill="#3b1c45"/>
    <path d="M20 2v6" stroke="#3b1c45" stroke-width="1.2"/><path d="M20 2h7l-2 2 2 2h-7z" fill="#c0392b"/>`,
  bandit: `<path d="M4 34L14 14l10 20z" fill="#8a6a3a"/><path d="M18 34l9-16 9 16z" fill="#6e5530"/>
    <path d="M14 14v20M27 18v16" stroke="#3d2a12" stroke-width="1"/>
    <path d="M12 36h16" stroke="#5a3a22" stroke-width="2"/><path d="M19 30q1-6 2 0" fill="#e67e22"/>`,
  invader: `<path d="M4 36l4-18 6 6 6-16 6 16 6-6 4 18z" fill="#4a5560"/>
    <path d="M14 36l6-14 6 14z" fill="#2c343b"/>
    <path d="M20 8v-6" stroke="#2c343b" stroke-width="1.2"/><path d="M20 2l-6 2 6 2z" fill="#5dade2"/>`,
};

export function fortressIcon(f: Faction, size = 30, ruined = false): string {
  const body = ruined
    ? `<g opacity="0.45">${FORT_ART[f]}</g><path d="M8 32l24-24M8 8l24 24" stroke="#5a3a22" stroke-width="2"/>`
    : FORT_ART[f];
  return svg(body, size);
}

export const SWORDS = svg(
  `<path d="M6 6l20 20M34 6L14 26" stroke="#e8e2d0" stroke-width="3" stroke-linecap="round"/>
   <path d="M22 30l8-8M10 22l8 8" stroke="#c9a14a" stroke-width="3" stroke-linecap="round"/>`,
  20,
);
