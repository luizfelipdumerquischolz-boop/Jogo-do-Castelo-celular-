// Conteúdo HTML das telas e painéis. Cada botão leva data-action/data-arg,
// tratados pela App (delegação de eventos).
import { BALANCE, YEAR_SECONDS } from '../sim/data/balance';
import {
  BUILDINGS,
  BUILDING_IDS,
  CATEGORY_NAMES,
  SETTLEMENT_KIND_NAMES,
  VOCATION_NAMES,
  buildCost,
  levelOutput,
  workersAt,
  type BuildingCategory,
  type BuildingId,
  type Vocation,
} from '../sim/data/buildings';
import { FOOD_GROUPS, FOOD_GROUP_NAMES, FOOD_IDS, ITEMS, ITEM_IDS, type ItemId } from '../sim/data/items';
import { BRANCH_NAMES, RESEARCH, type ResearchBranch } from '../sim/data/research';
import { PLAYABLE_UNITS, UNITS, troopCount, type UnitId } from '../sim/data/units';
import { CONTINENT_NAME, heroPortrait } from '../sim/data/names';
import { REGION_NAMES, describeTile, getMap, idx } from '../sim/map';
import {
  canRecruit,
  defenseCost,
  dietEffects,
  districtsUnlocked,
  gateMaxHp,
  groupsCovered,
  housing,
  keepLevel,
  kindAllows,
  maxBuildingLevel,
  productionMultiplier,
  storageCap,
  trainSeconds,
  troopCapacity,
  wallMaxHp,
  type DefenseUpgrade,
} from '../sim/settlement';
import { PERSONALITY_NAMES, settlementKindLabel } from '../sim/create';
import { RELATION_NAMES, TENSION_NAMES, perceivedTension } from '../sim/diplomacy';
import { TRAIT_INFO } from '../sim/heroes';
import { ERA_NAMES } from '../sim/progress';
import { spyQuote, counterIntelCost } from '../sim/spy';
import { settlementLimit } from '../sim/logistics';
import { marketFee } from '../sim/market';
import type { Army, GameState, Hero, Letter, PlacedBuilding, Settlement } from '../sim/types';
import { adults, children, dist, elders, population, relation } from '../sim/util';
import { ART_SPECS, GROUPS, artFileName } from '../art/registry';
import { isProvided } from '../art/loader';
import { esc } from './dom';
import { costChips, dateLabel, fmt, fmtTime, icon, itemIcon, troopChips, troopLine } from './format';

export const RATION_NAMES: Record<string, string> = { none: 'Sem ração', low: 'Pouca', normal: 'Normal', high: 'Farta' };
export const TAX_NAMES = ['Baixo', 'Normal', 'Alto', 'Extorsivo'];
const ZONE_NAMES: Record<string, string> = { center: 'Centro', middle: 'Meio', frontier: 'Fronteira' };
const ORDER_NAMES: Record<string, string> = { idle: 'Parado', move: 'Marchando', attack: 'Atacando', raid: 'Saqueando', return: 'Voltando', defend: 'Defendendo', patrol: 'Patrulhando', escort: 'Escoltando', hunt: 'Caçando bandidos' };

const btn = (label: string, action: string, arg: string | number = '', cls = '', disabled = false, extra = '') =>
  `<button class="btn ${cls}" data-action="${action}" data-arg="${esc(String(arg))}" ${disabled ? 'disabled' : ''} ${extra}>${label}</button>`;

export function nationOf(state: GameState, id: number) {
  return state.nations[id];
}

export function mySettlements(state: GameState): Settlement[] {
  return state.settlements.filter((s) => s.nation === state.playerNation);
}

// Barra superior ----------------------------------------------------------------------------

export function renderTop(state: GameState, city: Settlement | undefined, screen: string): string {
  const p = state.nations[state.playerNation];
  const pop = mySettlements(state).reduce((n, s) => n + population(s), 0);
  const unreadReports = state.reports.filter((r) => !r.read).length;
  const threats = state.armies.filter((a) => a.nation !== state.playerNation && (a.order === 'attack' || a.order === 'raid') && a.targetId != null && state.settlements.some((s) => s.id === a.targetId && s.nation === state.playerNation));
  let res = '';
  if (city && (screen === 'city' || screen === 'map')) {
    const cap = storageCap(state, city);
    const show: ItemId[] = ['wood', 'stone', 'iron', 'weapon', 'bow', 'horse'];
    const food = FOOD_IDS.reduce((n, f) => n + (city.stock[f] ?? 0), 0);
    res = `<div class="resbar" data-testid="resbar">
      <span class="res" title="Comida pronta">${itemIcon('bread', 18)}<b>${fmt(food)}</b></span>
      ${show.map((i) => `<span class="res ${(city.stock[i] ?? 0) >= cap ? 'full' : ''}" title="${ITEMS[i].name}">${itemIcon(i, 18)}<b>${fmt(city.stock[i] ?? 0)}</b></span>`).join('')}
    </div>`;
  }
  return `<div class="topline">
      <span class="kingdom">${esc(state.kingdomName)}${p.emperor ? ' 👑' : ''}</span>
      <span class="res" data-testid="gold">${itemIcon('gold', 18)}<b>${fmt(p.gold)}</b></span>
      <span class="res">${icon('icone-population', 18)}<b>${fmt(pop)}</b></span>
      <span class="date">${icon('icone-time', 16)}${dateLabel(state.time)}</span>
    </div>${res}
    ${threats.length ? `<div class="alert" data-action="goto-army" data-arg="${threats[0].id}">⚔ ${threats.length} exército(s) inimigo(s) vindo atacar!</div>` : ''}
    ${unreadReports ? '' : ''}`;
}

export function renderNav(state: GameState, screen: string): string {
  const unread = state.letters.filter((l) => l.toNation === state.playerNation && l.arrived && !l.read).length;
  const tabs: [string, string, string][] = [
    ['map', 'Reino', 'icone-ui-reino'],
    ['city', 'Cidade', 'icone-ui-cidade'],
    ['armies', 'Exércitos', 'icone-ui-exercitos'],
    ['letters', 'Cartas', 'icone-ui-cartas'],
    ['more', 'Mais', 'icone-ui-mais'],
  ];
  return tabs
    .map(
      ([id, label, ic]) => `<button class="tab ${screen === id ? 'active' : ''}" data-action="screen" data-arg="${id}" data-testid="tab-${id}">
      ${icon(ic, 26)}<span>${label}</span>${id === 'letters' && unread ? `<em class="badge">${unread}</em>` : ''}</button>`,
    )
    .join('');
}

// Cidade ----------------------------------------------------------------------------------------

export function renderCityBar(state: GameState, s: Settlement): string {
  const mine = mySettlements(state);
  const opts = mine.map((x) => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${esc(x.name)} (${SETTLEMENT_KIND_NAMES[x.kind as keyof typeof SETTLEMENT_KIND_NAMES] ?? x.kind})</option>`).join('');
  const building = s.buildings.filter((b) => b.build).length;
  return `<div class="citybar">
    <select data-change="city-select" data-testid="city-select">${opts}</select>
    ${btn(`${icon('icone-ui-construir', 20)} Construir`, 'open-build', '', 'primary', false, 'data-testid="open-build"')}
    ${btn(`${icon('icone-population', 18)} Painel`, 'open-overview', '', '', false, 'data-testid="open-overview"')}
  </div>
  ${building ? `<div class="mini-status">${building} obra(s) em andamento · limite ${BALANCE.maxConstructions[s.kind] ?? 1}</div>` : ''}`;
}

function allowedBuildings(_state: GameState, s: Settlement): BuildingId[] {
  return BUILDING_IDS.filter((id) => kindAllows(s, id) && !(BUILDINGS[id].unique && s.buildings.some((b) => b.type === id)));
}

export function renderBuildMenu(state: GameState, s: Settlement, cat: BuildingCategory): string {
  const nation = state.nations[s.nation];
  const cats: BuildingCategory[] = ['food', 'materials', 'industry', 'military', 'civic', 'admin'];
  const list = allowedBuildings(state, s).filter((id) => BUILDINGS[id].category === cat);
  const items = list
    .map((id) => {
      const def = BUILDINGS[id];
      const { items, gold } = buildCost(id, 1);
      const needsDistrict = s.kind === 'capital' && !def.kinds.includes('capital') && !def.kinds.includes('city');
      return `<div class="build-item" data-key="bi-${id}">
        <button class="build-pick" data-action="pick-building" data-arg="${id}" data-drag="${id}" data-testid="pick-${id}">
          <img src="${buildingThumb(id)}" alt="" draggable="false">
        </button>
        <div class="build-info">
          <b>${def.name}</b> <small>${def.size}×${def.size} · ${def.workers} trab.</small>
          <p>${esc(def.description)}${needsDistrict ? ` <em>(precisa de bairro ${def.districts?.map((v) => VOCATION_NAMES[v].toLowerCase()).join(' ou ')})</em>` : ''}${def.requiresDeposit ? ' <em>(perto de depósito)</em>' : ''}</p>
          <div class="cost">${costChips(items, gold, s.stock, nation.gold)}<span class="chip">⏱ ${fmtTime(def.buildTime)}</span></div>
        </div></div>`;
    })
    .join('');
  return `<div class="sheet-head"><h3>Construir em ${esc(s.name)}</h3>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>
    <p class="hint">Toque numa construção (ou arraste-a) e depois posicione no terreno.</p>
    <div class="cat-tabs">${cats.map((c) => btn(CATEGORY_NAMES[c], 'build-cat', c, c === cat ? 'active' : '')).join('')}</div>
    <div class="build-list">${items || '<p class="hint">Nada disponível nesta categoria aqui.</p>'}</div>`;
}

const thumbs = new Map<string, string>();
export function buildingThumb(id: BuildingId): string {
  let u = thumbs.get(id);
  if (!u) {
    u = artUrlFor(`construcao-${id}-1`);
    thumbs.set(id, u);
  }
  return u;
}
let artUrlFor: (key: string) => string = () => '';
export function setArtUrl(fn: (key: string) => string): void {
  artUrlFor = fn;
}

export function renderGhostBar(valid: boolean, reason: string, moving: boolean): string {
  return `<div class="ghostbar" data-testid="ghostbar">
    <span class="${valid ? 'good' : 'bad'}">${valid ? 'Arraste para ajustar e confirme.' : esc(reason || 'Escolha um lugar livre')}</span>
    <div class="row">${btn(moving ? 'Mover para cá' : 'Construir aqui', 'ghost-confirm', '', 'primary', !valid, 'data-testid="ghost-confirm"')}${btn('Cancelar', 'ghost-cancel', '', 'neutral')}</div>
  </div>`;
}

export function renderBuildingSheet(state: GameState, s: Settlement, b: PlacedBuilding): string {
  const def = BUILDINGS[b.type];
  const nation = state.nations[s.nation];
  const lvl = b.level;
  let body = `<p class="hint">${esc(def.description)}</p>`;
  if (b.build) {
    const pct = 1 - b.build.remaining / b.build.total;
    body += `<div class="progress"><div style="width:${(pct * 100).toFixed(0)}%"></div><span>Obra para nível ${b.build.toLevel} · ${fmtTime(b.build.remaining)}</span></div>`;
  }
  if (lvl > 0) {
    const need = workersAt(b.type, lvl);
    if (need > 0) body += `<p>${icon('icone-population', 16)} Trabalhadores: <b>${b.workers}/${need}</b> · eficiência ${Math.round(b.efficiency * 100)}%${b.stalled > 30 ? ' · <span class="bad">parada por falta de insumo</span>' : ''}</p>`;
    if (def.recipes.length) {
      const mult = productionMultiplier(state, s, b) * levelOutput(1);
      const rows = def.recipes
        .map((r) => {
          const ins = Object.entries(r.input).map(([k, v]) => `${itemIcon(k as ItemId, 14)}${fmt((v ?? 0) * mult)}`).join(' ');
          const outs = Object.entries(r.output).map(([k, v]) => `${itemIcon(k as ItemId, 14)}${(v ?? 0) * mult < 10 ? ((v ?? 0) * mult).toFixed(1) : fmt((v ?? 0) * mult)}`).join(' ') + (r.gold ? ` ${itemIcon('gold', 14)}${(r.gold * mult).toFixed(1)}` : '');
          const w = b.recipeWeights[r.id] ?? (def.recipes.length > 1 ? (r === def.recipes[0] ? 1 : 0) : 1);
          const ctrl = def.recipes.length > 1 ? `<span class="stepper">${btn('−', 'recipe', `${b.id}:${r.id}:${w - 1}`, 'small')}<b>${w}</b>${btn('+', 'recipe', `${b.id}:${r.id}:${w + 1}`, 'small')}</span>` : '';
          return `<div class="recipe"><span>${esc(r.name)}:</span> ${ins ? `${ins} →` : ''} ${outs || '—'} <small>/min</small> ${ctrl}</div>`;
        })
        .join('');
      body += `<div class="recipes">${rows}${def.recipes.length > 1 ? '<p class="hint">Ajuste quanto do trabalho vai para cada produto.</p>' : ''}</div>`;
    }
    if (def.housing) body += `<p>Moradia: ${def.housing * lvl} pessoas</p>`;
    if (def.storage) body += `<p>Armazém: +${def.storage * lvl} por recurso</p>`;
  }
  const max = maxBuildingLevel(s, b.type);
  let actions = '';
  if (!b.build && lvl < def.maxLevel) {
    const { items, gold } = buildCost(b.type, lvl + 1);
    const blocked = lvl >= max;
    actions += `<div class="cost">${costChips(items, gold, s.stock, nation.gold)}</div>
      ${btn(`${icon('icone-ui-melhorar', 18)} Melhorar para nível ${lvl + 1}`, 'upgrade', b.id, 'primary', false, 'data-testid="upgrade-building"')}
      ${blocked ? `<small class="bad">${b.type === 'keep' || b.type === 'governor_hall' ? '' : s.kind === 'capital' ? 'Suba a Torre de Menagem primeiro.' : 'Suba o Salão do governador primeiro.'}</small>` : ''}`;
  } else if (lvl >= def.maxLevel) actions += `<p class="good">Nível máximo.</p>`;
  if (!def.unique) actions += `<div class="row">${btn(`${icon('icone-ui-mover', 18)} Mover`, 'move-building', b.id, 'neutral')}${btn(`${icon('icone-ui-demolir', 18)} Demolir`, 'demolish', b.id, 'danger')}</div>`;
  // Atalhos por tipo.
  if (b.type === 'barracks' || b.type === 'siege_workshop') actions += btn(`${icon('icone-ui-recrutar', 18)} Recrutar`, 'open-recruit', s.id, 'primary', false, 'data-testid="open-recruit"');
  if (b.type === 'tavern') actions += `<div class="row">${btn('Heróis', 'screen', 'heroes')}${btn('Espionagem', 'screen', 'spies')}</div>`;
  if (b.type === 'market') actions += btn('Mercado', 'open-market', s.id);
  if (b.type === 'library') actions += btn('Pesquisa', 'screen', 'research');
  if (b.type === 'keep' || b.type === 'governor_hall') actions += btn('Painel do assentamento', 'open-overview', s.id);
  return `<div class="sheet-head"><img class="thumb" src="${buildingThumb(b.type)}" alt=""><div><h3>${def.name}</h3><small>Nível ${lvl}/${def.maxLevel} · ${def.size}×${def.size}</small></div>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>
    ${body}<div class="actions">${actions}</div>`;
}

export function renderRecruit(state: GameState, s: Settlement): string {
  const nation = state.nations[s.nation];
  const g = state.armies.find((a) => a.id === s.garrisonId);
  const inTrain = s.trainQueue.reduce((n, j) => n + j.count, 0);
  const cards = [...PLAYABLE_UNITS]
    .map((u) => {
      const def = UNITS[u];
      const check1 = canRecruit(state, s, u, 1);
      const check5 = canRecruit(state, s, u, 5);
      const locked = !check1.ok && (check1.reason.startsWith('Precisa') || check1.reason === 'Unidade indisponível');
      const strong = def.strong.filter((x) => UNITS[x].playable).map((x) => UNITS[x].plural.toLowerCase()).join(', ');
      return `<div class="unit-card ${locked ? 'locked' : ''}" data-key="u-${u}">
        <span class="pframe"><img src="${artUrlFor(`retrato-${u}`)}" alt="" class="portrait"></span>
        <div class="unit-info"><b>${def.name}</b> <span class="count" data-testid="garrison-${u}">${Math.floor(g?.troops[u] ?? 0)}</span>
          <small>⚔ ${def.attack} · 🛡 ${def.defense} · ❤ ${def.hp}${strong ? ` · forte contra ${strong}` : ''}</small>
          <div class="cost">${costChips(def.cost, def.gold, s.stock, nation.gold)}${def.people ? `<span class="chip">${icon('icone-population', 14)}${def.people}</span>` : ''}<span class="chip">⏱ ${fmtTime(trainSeconds(state, s, u))}</span></div>
          ${locked ? `<small class="bad">${esc(check1.reason)}</small>` : `<div class="row">${btn('+1', 'recruit', `${u}:1`, 'small', !check1.ok, `data-testid="recruit-${u}-1"`)}${btn('+5', 'recruit', `${u}:5`, 'small', !check5.ok)}${!check1.ok ? `<small class="bad">${esc(check1.reason)}</small>` : ''}</div>`}
        </div></div>`;
    })
    .join('');
  const queue = [...s.trainQueue, ...s.siegeQueue]
    .map((j, i) => `<div class="queued">${i === 0 ? '▶' : '·'} ${j.count}× ${UNITS[j.unit].name} (${fmtTime(j.remaining)})</div>`)
    .join('');
  return `<div class="sheet-head"><h3>Recrutar em ${esc(s.name)}</h3>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>
    <p class="hint">Soldados saem da população adulta (${adults(s)} adultos). Limite: ${troopCount(g?.troops ?? {}, false) + inTrain}/${troopCapacity(s)}.</p>
    <div class="queue">${queue || '<p class="hint">Nenhum treino em andamento.</p>'}</div>${cards}`;
}

export function renderOverview(state: GameState, s: Settlement, tab: string): string {
  const pop = population(s);
  const nation = state.nations[s.nation];
  const fx = dietEffects(s);
  const tabs = ['povo', 'comida', 'defesa', 'gestao'];
  const tabNames: Record<string, string> = { povo: 'Povo', comida: 'Comida', defesa: 'Defesa', gestao: 'Gestão' };
  let body = '';
  if (tab === 'povo') {
    body = `<div class="stats">
      <div>${icon('icone-population', 22)} População <b data-testid="population">${pop}</b>/${housing(s)}</div>
      <div>Crianças ${children(s)} · Adultos ${adults(s)} · Idosos ${elders(s)}</div>
      <div>${icon('icone-happiness', 22)} Felicidade <b>${Math.round(s.happiness)}</b></div>
      <div>${icon('icone-health', 22)} Saúde <b>${Math.round(s.health * 100)}%</b>${s.outbreak > 0 ? ` · <span class="bad">surto: ${s.sick} doentes</span>` : ''}</div>
      <div>${icon('icone-morale', 22)} Moral <b>${Math.round(s.morale)}</b></div>
      ${s.kind !== 'capital' ? `<div>${icon('icone-loyalty', 22)} Lealdade <b>${Math.round(s.loyalty)}</b>${s.revolt ? ' <span class="bad">REVOLTA</span>' : ''}</div>` : ''}
      <div>${icon('icone-culture', 22)} Cultura <b>${Math.round(s.culture)}</b></div>
      <div>Zona: <b>${ZONE_NAMES[s.zone]}</b> (${s.foreignDistance >= 999 ? 'nenhum vizinho estrangeiro conhecido' : `fronteira estrangeira a ${Math.round(s.foreignDistance)} casas`})</div>
      <div>Impostos: ${itemIcon('gold', 16)} ${s.taxIncome.toFixed(1)}/min</div>
    </div>
    <h4>Prioridade dos trabalhadores</h4>
    <p class="hint">Os adultos livres vão primeiro para a categoria do topo.</p>
    ${s.priorities.map((p, i) => `<div class="prio"><span>${i + 1}. ${CATEGORY_NAMES[p]}</span>${btn('▲', 'prio-up', i, 'small', i === 0)}${btn('▼', 'prio-down', i, 'small', i === s.priorities.length - 1)}</div>`).join('')}`;
  } else if (tab === 'comida') {
    const groups = FOOD_GROUPS.map((g) => `<div class="bar-row"><span>${FOOD_GROUP_NAMES[g]}</span><div class="bar"><div style="width:${Math.round(s.diet[g] * 100)}%"></div></div><b>${Math.round(s.diet[g] * 100)}%</b></div>`).join('');
    const foods = FOOD_IDS.filter((f) => (s.stock[f] ?? 0) >= 1).map((f) => `<span class="chip">${itemIcon(f, 16)}${fmt(s.stock[f] ?? 0)}</span>`).join('');
    body = `<p>Grupos na dieta: <b>${groupsCovered(s)}/4</b> · bônus de força ${Math.round((fx.strength - 1) * 100)}%</p>${groups}
      ${fx.label.length ? `<ul class="warn-list">${fx.label.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '<p class="good">Dieta sem problemas.</p>'}
      <p>Fome: ${Math.round(s.hunger * 100)}% · consumo ${(pop * BALANCE.foodPerPerson * (BALANCE.rationFactor[s.ration] ?? 1)).toFixed(1)} porções/min</p>
      <div class="cost">${foods || '<span class="bad">Sem comida pronta!</span>'}</div>
      <h4>Ração</h4><div class="row">${(['none', 'low', 'normal', 'high'] as const).map((r) => btn(RATION_NAMES[r], 'ration', r, s.ration === r ? 'active' : '')).join('')}</div>
      <p class="hint">Variedade dá força, saúde e moral. Só pão causa desnutrição; só carne, obesidade; sem legumes e frutas, doenças.</p>`;
  } else if (tab === 'defesa') {
    const d = s.defenses;
    const row = (what: DefenseUpgrade, label: string) => {
      const c = defenseCost(s, what);
      if (!c) return '';
      return `<div class="def-row"><span>${label}</span><div class="cost">${costChips(c.items, c.gold, s.stock, nation.gold)}</div>${btn('Fazer', 'defense', what, 'small')}</div>`;
    };
    const g = state.armies.find((a) => a.id === s.garrisonId);
    body = `<p>Muralha nível <b>${d.wallLevel}</b> (vida ${Math.round(d.wallHp)}/${wallMaxHp(state, d.wallLevel, s.nation)}) · Portão nível <b>${d.gateLevel}</b> (vida ${Math.round(d.gateHp)}/${gateMaxHp(d.gateLevel)}) · Torres ${d.towers}</p>
      <p>${d.moat ? '✔ Fosso ' : ''}${d.oil ? '✔ Óleo fervente ' : ''}${d.stakes ? '✔ Estacas ' : ''}${d.pits ? '✔ Armadilhas' : ''}</p>
      ${row('wall', `Muralha nível ${d.wallLevel + 1}`)}${row('gate', `Portão nível ${d.gateLevel + 1}`)}${row('tower', 'Torre na muralha')}${row('moat', 'Fosso')}${row('oil', 'Óleo fervente')}${row('stakes', 'Estacas')}${row('pits', 'Armadilhas de buraco')}
      ${btn('Reparar muralha (pedra)', 'defense', 'repair', 'neutral')}
      <h4>Guarnição</h4><div class="cost">${troopChips(g?.troops ?? {}) || '<span class="hint">vazia</span>'}</div>
      <div class="row">${btn(`${icon('icone-ui-recrutar', 18)} Recrutar`, 'open-recruit', s.id, 'primary')}${btn(`${icon('icone-ui-exercitos', 18)} Formar exército`, 'open-form-army', s.id)}</div>
      ${s.wounded.length ? `<p>Feridos se recuperando: ${s.wounded.map((w) => troopLine(w.troops)).join('; ')}</p>` : ''}`;
  } else {
    const consul = state.heroes.find((h) => h.id === s.consulId);
    let voc = '';
    if (s.kind === 'capital') {
      const n = districtsUnlocked(s);
      const quad = ['Noroeste', 'Nordeste', 'Sudoeste', 'Sudeste'];
      voc = `<h4>Bairros (${n}/4 liberados pela Torre)</h4>${[0, 1, 2, 3]
        .map((q) => {
          if (q >= n) return `<div class="district locked">Bairro ${quad[q]}: liberado na Torre nível ${BALANCE.districtKeepLevels[q]}</div>`;
          const d = s.districts[q];
          const inv = d.vocation && d.level < 5 ? `Investir (nível ${d.level + 1}): ${itemIcon('gold', 14)}${BALANCE.districtInvest.gold * (d.level + 1)} ${itemIcon('wood', 14)}${BALANCE.districtInvest.wood * (d.level + 1)} ${itemIcon('stone', 14)}${BALANCE.districtInvest.stone * (d.level + 1)}` : '';
          return `<div class="district"><b>Bairro ${quad[q]}</b>: ${d.vocation ? `${VOCATION_NAMES[d.vocation]} nível ${d.level} (+${Math.round(BALANCE.districtBonus[d.level] * 100)}%)` : 'sem vocação'}
            <select data-change="district-voc" data-arg="${q}"><option value="">Escolher vocação…</option>${(Object.keys(VOCATION_NAMES) as Vocation[]).map((v) => `<option value="${v}" ${d.vocation === v ? 'selected' : ''}>${VOCATION_NAMES[v]}</option>`).join('')}</select>
            ${inv ? `<div class="row"><small>${inv}</small>${btn('Investir', 'invest', q, 'small')}</div>` : ''}</div>`;
        })
        .join('')}`;
    } else if (s.kind !== 'outpost') {
      voc = `<h4>Vocação</h4><p>${s.vocation ? VOCATION_NAMES[s.vocation] : 'Nenhuma'}${s.vocationSwitch ? ` → ${VOCATION_NAMES[s.vocationSwitch.to]} em ${fmtTime(s.vocationSwitch.remaining)}` : ''}</p>
        <select data-change="vocation"><option value="">Trocar vocação…</option>${(Object.keys(VOCATION_NAMES) as Vocation[]).map((v) => `<option value="${v}">${VOCATION_NAMES[v]}</option>`).join('')}</select>
        <p class="hint">Bônus de até +40% nas construções da vocação; trocar leva uma estação.</p>`;
    }
    body = `<h4>Impostos</h4><div class="row">${TAX_NAMES.map((t, i) => btn(t, 'tax', i, s.tax === i ? 'active' : '')).join('')}</div>
      <p class="hint">Imposto alto dá ouro e tira felicidade (e lealdade).</p>${voc}
      ${s.kind !== 'capital' ? `<h4>Cônsul</h4><p>${consul ? `${esc(consul.name)} (${consul.traits.join(', ')})` : 'Sem cônsul — as cartas vêm do escrivão.'}</p>${btn('Escolher cônsul', 'screen', 'heroes', 'small')}` : ''}
      <h4>Logística</h4><div class="row">${btn(`${icon('icone-ui-rotas', 18)} Rotas e carroças`, 'screen', 'logistics')}${btn(`${icon('icone-ui-colonos', 18)} Enviar colonos`, 'colonize-help', s.id)}</div>`;
  }
  void nation;
  return `<div class="sheet-head"><h3>${esc(s.name)}</h3><small>${settlementKindLabel(s.kind, 1)} · ${s.kind === 'capital' ? `Torre nível ${keepLevel(s)}` : `Salão nível ${keepLevel(s)}`}</small>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>
    <div class="cat-tabs">${tabs.map((t) => btn(tabNames[t], 'overview-tab', t, t === tab ? 'active' : '')).join('')}</div>${body}`;
}

export function renderFormArmy(state: GameState, s: Settlement, draft: Record<string, number>): string {
  const g = state.armies.find((a) => a.id === s.garrisonId);
  const units = Object.keys(g?.troops ?? {}).filter((u) => u !== 'militia' && (g!.troops[u as UnitId] ?? 0) >= 1) as UnitId[];
  const rows = units
    .map((u) => {
      const have = Math.floor(g!.troops[u] ?? 0);
      const v = Math.min(have, draft[u] ?? 0);
      return `<div class="stepper-row">${icon(`boneco-${u}`, 28)}<span>${UNITS[u].name}</span>
        ${btn('−5', 'draft', `${u}:-5`, 'small')}${btn('−', 'draft', `${u}:-1`, 'small')}<b data-testid="draft-${u}">${v}<small>/${have}</small></b>${btn('+', 'draft', `${u}:1`, 'small')}${btn('+5', 'draft', `${u}:5`, 'small')}</div>`;
    })
    .join('');
  const total = Object.values(draft).reduce((a, b) => a + b, 0);
  return `<div class="sheet-head"><h3>Formar exército em ${esc(s.name)}</h3>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>
    ${rows || '<p class="hint">Guarnição vazia. Recrute soldados primeiro.</p>'}
    <div class="row">${btn('Todas', 'draft-all', '', 'small')}${btn('Limpar', 'draft-clear', '', 'small')}</div>
    ${btn(`${icon('icone-ui-exercitos', 18)} Formar com ${total} tropas`, 'form-army', s.id, 'primary', total <= 0, 'data-testid="form-army"')}
    <p class="hint">O exército leva comida para alguns minutos e come do armazém quando estiver no seu território.</p>`;
}

// Mapa: painéis ----------------------------------------------------------------------------

export function renderSettlementSheet(state: GameState, s: Settlement, myArmies: Army[], spyOffer: number): string {
  const n = state.nations[s.nation];
  const mine = s.nation === state.playerNation;
  const kind = settlementKindLabel(s.kind, n.tribeLevel);
  const g = state.armies.find((a) => a.id === s.garrisonId);
  let body = '';
  if (mine) {
    body = `<p>${icon('icone-population', 16)} ${population(s)} habitantes · zona ${ZONE_NAMES[s.zone]}${s.kind !== 'capital' ? ` · lealdade ${Math.round(s.loyalty)}` : ''}</p>
      <div class="cost">${troopChips(g?.troops ?? {}) || '<span class="hint">sem guarnição</span>'}</div>
      <div class="row">${btn(`${icon('icone-ui-cidade', 18)} Abrir`, 'open-city', s.id, 'primary', false, 'data-testid="open-city"')}${btn(`${icon('icone-ui-exercitos', 18)} Formar exército`, 'open-form-army', s.id)}${btn(`${icon('icone-ui-colonos', 18)} Colonos`, 'colonize-help', s.id)}</div>`;
  } else {
    const rel = n.kind === 'bandit' || n.kind === 'horde' ? null : relation(state, state.playerNation, s.nation);
    const tension = rel ? perceivedTension(state, s.nation, state.playerNation) : null;
    const reports = state.letters.filter((l) => l.toNation === state.playerNation && l.subject.includes(s.name) && l.subject.startsWith('Relatório'));
    const lastSpy = reports[reports.length - 1];
    const ruined = s.ruinedFor > 0;
    const visibleGarrison = s.kind === 'camp' || s.kind === 'tribal' ? `<p class="hint">Batedores estimam: ${troopLine(g?.troops ?? {})}</p>` : '';
    const armyOpts = myArmies.length
      ? `<select data-change="attack-army" data-testid="attack-army">${myArmies.map((a) => `<option value="${a.id}">${esc(a.name)} (${Math.floor(troopCount(a.troops))})</option>`).join('')}</select>`
      : '<p class="hint">Forme um exército primeiro (aba Exércitos ou na sua cidade).</p>';
    const tav = mySettlements(state).find((x) => x.buildings.some((b) => b.type === 'tavern' && b.level > 0));
    const quote = tav ? spyQuote(state, tav.id, s.id) : 0;
    body = `<p>${esc(n.name)}${n.personality ? ` · ${PERSONALITY_NAMES[n.personality]}` : ''}${rel ? ` · ${RELATION_NAMES[rel.state]} · ${TENSION_NAMES[tension!]}` : ''}</p>
      ${ruined ? `<p class="bad">Em ruínas. ${s.kind === 'camp' ? `Os bandidos voltam em ${fmtTime(s.ruinedFor)}.` : ''}</p>` : ''}
      <p>Muralha nível ${s.defenses.wallLevel}${s.kind !== 'camp' ? ` · ${icon('icone-population', 14)} ~${Math.round(population(s) / 10) * 10}` : ''}</p>
      ${visibleGarrison}
      ${lastSpy ? `<details><summary>Último relatório de espião</summary><pre>${esc(lastSpy.body)}</pre></details>` : ''}
      ${!ruined ? `<h4>Atacar</h4>${armyOpts}
      ${myArmies.length ? `<div class="row">${s.kind === 'camp' ? '' : btn(`${icon('icone-ui-atacar', 18)} Conquistar`, 'attack', `${s.id}:attack`, 'danger', false, 'data-testid="attack-conquer"')}${btn(`${icon('icone-ui-saquear', 18)} ${s.kind === 'camp' ? 'Atacar' : 'Saquear'}`, 'attack', `${s.id}:raid`, 'danger', false, 'data-testid="attack-raid"')}</div>` : ''}` : ''}
      ${n.kind !== 'bandit' && n.kind !== 'horde' && !ruined ? `<h4>Espionar</h4>${tav ? `<p class="hint">O espião pede ${quote} de ouro. Ofereça mais para ele ser mais confiável, ou pechinche.</p>
        <div class="stepper-row">${btn('−10', 'spy-offer', -10, 'small')}<b>${spyOffer || quote}</b>${btn('+10', 'spy-offer', 10, 'small')}${btn(`${icon('icone-ui-espionar', 18)} Contratar`, 'spy', s.id, 'primary')}</div>` : '<p class="hint">Construa uma Taverna para contratar espiões.</p>'}` : ''}
      ${rel ? `<div class="row">${btn(`${icon('icone-ui-diplomacia', 18)} Diplomacia`, 'open-diplo', s.nation)}</div>` : ''}`;
  }
  return `<div class="sheet-head"><img class="thumb" src="${artUrlFor(`mapa-${s.kind === 'camp' ? (s.ruinedFor > 0 ? 'camp-ruin' : 'camp') : s.kind === 'tribal' ? `tribe${n.tribeLevel}` : s.kind}`)}" alt=""><div><h3>${esc(s.name)}</h3><small>${kind}</small></div>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>${body}`;
}

export function renderArmySheet(state: GameState, a: Army, mode: string): string {
  const n = state.nations[a.nation];
  const mine = a.nation === state.playerNation;
  const cmd = state.heroes.find((h) => h.id === a.commanderId);
  const target = state.settlements.find((s) => s.id === a.targetId);
  let body = `<div class="cost">${troopChips(a.troops)}</div>
    <p>${ORDER_NAMES[a.order] ?? a.order}${target ? ` → ${esc(target.name)}` : ''}${a.battleId != null ? ' · <b class="bad">EM BATALHA</b>' : ''}</p>`;
  if (mine) {
    body += `<p>${icon('icone-morale', 16)} Moral ${Math.round(a.morale)} · ${itemIcon('bread', 16)} comida ${fmt(a.food)}${a.starving > 0 ? ' · <span class="bad">passando fome</span>' : ''} · experiência ${Math.round(a.xp * 100)}%</p>
      <p>Comandante: ${cmd ? `<b>${esc(cmd.name)}</b> (${cmd.traits.join(', ')}) — ${a.autonomous ? 'decide sozinho' : 'comando direto'}` : 'nenhum (comando direto)'}</p>
      ${mode === 'army-move' ? '<p class="good">Toque no mapa para escolher o destino.</p>' : ''}
      <div class="grid-actions">
        ${btn(`${icon('icone-ui-mover', 18)} Mover`, 'army-pick-move', a.id, mode === 'army-move' ? 'active' : '', false, 'data-testid="army-move"')}
        ${btn(`${icon('icone-ui-voltar', 18)} Voltar`, 'army-return', a.id)}
        ${btn(`${icon('icone-ui-defender', 18)} Defender aqui`, 'army-defend', a.id)}
        ${btn('Patrulhar até…', 'army-pick-patrol', a.id)}
        ${btn('Caçar bandidos', 'army-hunt', a.id)}
        ${btn('Escoltar carroças', 'army-escort', a.id)}
      </div>
      <h4>Formação</h4><div class="row">${(['balanced', 'strongFlanks', 'strongCenter'] as const).map((f) => btn({ balanced: 'Equilibrada', strongFlanks: 'Flancos fortes', strongCenter: 'Centro forte' }[f], 'army-formation', `${a.id}:${f}`, a.formation === f ? 'active' : '')).join('')}</div>
      <h4>Comandante</h4><div class="row">${state.heroes
        .filter((h) => h.nation === state.playerNation && h.captiveOf == null && h.role !== 'consul')
        .map((h) => btn(esc(h.name), 'assign-commander', `${h.id}:${a.id}`, h.id === a.commanderId ? 'active' : 'small'))
        .join('') || '<span class="hint">Contrate heróis na Taverna.</span>'}${a.commanderId != null ? btn(a.autonomous ? 'Assumir comando direto' : 'Deixar o comandante decidir', 'army-autonomy', a.id, 'small') : ''}</div>`;
  } else {
    body += `<p>${esc(n.name)}${a.wave ? ` · onda ${a.wave} da horda` : ''}</p>`;
  }
  return `<div class="sheet-head"><div><h3>${esc(a.name)}</h3><small>${esc(n.name)}</small></div>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>${body}`;
}

export function renderTileSheet(state: GameState, x: number, y: number, explored: boolean, owner: number, selectedArmy: Army | undefined): string {
  const m = getMap();
  const i = idx(x, y);
  if (x < 0 || y < 0 || x >= 256 || y >= 256) return '';
  if (!explored) return `<div class="sheet-head"><h3>Terra desconhecida</h3>${btn('✕', 'close-sheet', '', 'icon-btn')}</div><p class="hint">Mande um batedor ou exército para explorar.</p>`;
  const dep = state.deposits.find((d) => d.x === x && d.y === y);
  const own = owner >= 0 ? state.nations[owner]?.name : 'Ninguém';
  const near = mySettlements(state)
    .filter((s) => s.kind !== 'outpost')
    .sort((a, b) => dist(a.x, a.y, x, y) - dist(b.x, b.y, x, y))[0];
  return `<div class="sheet-head"><div><h3>${esc(describeTile(m, i))}</h3><small>(${x}, ${y}) · ${REGION_NAMES[m.region[i]]} · território: ${esc(own)}</small></div>${btn('✕', 'close-sheet', '', 'icon-btn')}</div>
    ${dep ? `<p>${icon(`deposito-${dep.type}`, 22)} Depósito: ${dep.type === 'fertile' ? 'solo fértil' : dep.type === 'fish' ? 'pesca' : `${dep.type} (${Math.round(dep.amount)} restantes)`}</p>` : ''}
    ${selectedArmy ? btn(`Mover ${esc(selectedArmy.name)} para cá`, 'army-move-here', `${selectedArmy.id}:${x}:${y}`, 'primary') : ''}
    ${near ? `<h4>Fundar aqui (colonos de ${esc(near.name)})</h4><div class="row">
      ${btn(`${icon('icone-ui-fundar', 18)} Aldeia`, 'colonize', `${near.id}:${x}:${y}:village`, 'primary', false, 'data-testid="found-village"')}
      ${btn('Castelo', 'colonize', `${near.id}:${x}:${y}:castle`)}${btn('Entreposto', 'colonize', `${near.id}:${x}:${y}:outpost`)}</div>
      <p class="hint">Aldeia: ${BALANCE.colonistsVillage} colonos, ${BALANCE.foundCost.village.wood} madeira, ${BALANCE.foundCost.village.stone} pedra, ${BALANCE.foundCost.village.gold} ouro. Limite de assentamentos: ${mySettlements(state).length}/${settlementLimit(state, state.playerNation)}.</p>` : ''}`;
}

// Telas de lista ------------------------------------------------------------------------------

export function renderArmies(state: GameState): string {
  const field = state.armies.filter((a) => a.nation === state.playerNation && a.stationedAt == null);
  const garrisons = mySettlements(state);
  return `<section class="screen"><h2>Exércitos em campo</h2>
    ${field.map((a) => `<div class="card" data-key="a-${a.id}"><b>${esc(a.name)}</b> <small>${ORDER_NAMES[a.order] ?? ''}${a.battleId != null ? ' · EM BATALHA' : ''}</small><div class="cost">${troopChips(a.troops)}</div>${btn('Ver no mapa', 'goto-army', a.id, 'small')}</div>`).join('') || '<p class="hint">Nenhum exército em campo.</p>'}
    <h2>Guarnições</h2>
    ${garrisons
      .map((s) => {
        const g = state.armies.find((a) => a.id === s.garrisonId);
        return `<div class="card" data-key="g-${s.id}"><b>${esc(s.name)}</b><div class="cost">${troopChips(g?.troops ?? {}) || '<span class="hint">vazia</span>'}</div>
        <div class="row">${btn('Formar exército', 'open-form-army', s.id, 'small', false, `data-testid="form-from-${s.id}"`)}${btn('Recrutar', 'open-recruit', s.id, 'small')}</div></div>`;
      })
      .join('')}</section>`;
}

export function renderLetters(state: GameState): string {
  const list = state.letters.filter((l) => l.toNation === state.playerNation && l.arrived).slice().reverse();
  const traveling = state.travelers.filter((t) => t.kind === 'messenger' && state.letters.some((l) => l.id === t.letterId && l.toNation === state.playerNation)).length;
  return `<section class="screen"><h2>Cartas</h2>
    ${traveling ? `<p class="hint">${traveling} mensageiro(s) a caminho.</p>` : ''}
    ${list
      .map(
        (l) => `<div class="letter ${l.read ? '' : 'unread'} ${l.intercepted ? 'intercepted' : ''}" data-key="l-${l.id}" data-action="open-letter" data-arg="${l.id}">
      ${l.read ? '' : icon('ui-selo', 22)}<div><b>${esc(l.subject)}</b><small>${esc(l.sender)} · ${dateLabel(l.time)}${l.intercepted ? ' · interceptada' : ''}${l.actions.length ? ' · pede resposta' : ''}</small></div></div>`,
      )
      .join('') || '<p class="hint">Nenhuma carta.</p>'}</section>`;
}

export function renderLetterModal(l: Letter): string {
  return `<div class="letter-paper"><h3>${esc(l.subject)}</h3><small>De: ${esc(l.sender)} · ${dateLabel(l.time)}${l.intercepted ? ' · carta interceptada de outro reino' : ''}</small>
    <div class="letter-body">${esc(l.body).replace(/\n/g, '<br>')}</div>
    <div class="row">${l.actions.map((a, i) => btn(esc(a.label), 'letter-action', `${l.id}:${i}`, 'primary')).join('')}${btn('Fechar', 'close-modal', '', 'neutral')}</div></div>`;
}

export function renderMore(state: GameState): string {
  const items: [string, string, string][] = [
    ['research', 'Pesquisa', 'icone-ui-pesquisa'],
    ['diplomacy', 'Diplomacia', 'icone-ui-diplomacia'],
    ['heroes', 'Heróis e Taverna', 'icone-ui-herois'],
    ['spies', 'Espionagem', 'icone-ui-espionar'],
    ['logistics', 'Rotas e estradas', 'icone-ui-rotas'],
    ['market', 'Mercado', 'icone-ui-mercado'],
    ['reports', 'Relatórios de batalha', 'icone-ui-relatorios'],
    ['chronicle', 'Crônica do reino', 'icone-ui-cronica'],
    ['missions', 'Missões', 'icone-ui-missoes'],
    ['kingdom', 'Visão do reino', 'icone-ui-reino'],
    ['art', 'Lista de artes', 'icone-ui-artes'],
    ['help', 'Como jogar', 'icone-ui-ajuda'],
    ['settings', 'Opções e novo jogo', 'icone-ui-novo'],
  ];
  const unreadReports = state.reports.filter((r) => !r.read).length;
  return `<section class="screen"><h2>Mais</h2><div class="menu-grid">${items
    .map(([id, label, ic]) => `<button class="menu-item" data-action="screen" data-arg="${id}" data-testid="more-${id}">${icon(ic, 34)}<span>${label}</span>${id === 'reports' && unreadReports ? `<em class="badge">${unreadReports}</em>` : ''}</button>`)
    .join('')}</div></section>`;
}

export function renderResearch(state: GameState): string {
  const n = state.nations[state.playerNation];
  const cur = n.research.current ? RESEARCH.find((r) => r.id === n.research.current) : null;
  const libs = mySettlements(state).some((s) => s.buildings.some((b) => b.type === 'library' && b.level > 0));
  const branches = Object.keys(BRANCH_NAMES) as ResearchBranch[];
  return `<section class="screen"><h2>Pesquisa</h2>
    ${!libs ? '<p class="bad">Construa uma Biblioteca: os pontos de pesquisa vêm dos estudiosos que trabalham nela.</p>' : ''}
    ${cur ? `<div class="progress"><div style="width:${Math.min(100, (n.research.progress / cur.cost) * 100).toFixed(0)}%"></div><span>${esc(cur.name)}: ${Math.floor(n.research.progress)}/${cur.cost}</span></div>` : '<p class="hint">Nenhuma pesquisa em andamento.</p>'}
    ${branches
      .map(
        (br) => `<h3>${BRANCH_NAMES[br]}</h3>${RESEARCH.filter((r) => r.branch === br)
          .map((r) => {
            const done = n.research.done.includes(r.id);
            const avail = !done && (!r.requires || n.research.done.includes(r.requires));
            return `<div class="card research ${done ? 'done' : avail ? '' : 'locked'}" data-key="r-${r.id}"><b>${esc(r.name)}</b> <small>${r.cost} pontos</small><p>${esc(r.description)}</p>${done ? '<span class="good">✔ Concluída</span>' : avail ? btn(n.research.current === r.id ? 'Pesquisando…' : 'Pesquisar', 'research', r.id, 'small', n.research.current === r.id) : '<small class="hint">Requer a anterior</small>'}</div>`;
          })
          .join('')}`,
      )
      .join('')}</section>`;
}

export function renderDiplomacy(state: GameState, focus: number | null): string {
  const p = state.playerNation;
  const others = state.nations.filter((n) => n.alive && (n.kind === 'rival' || n.kind === 'tribe') && n.id !== p);
  const seen = (n: (typeof others)[number]) => state.settlements.some((s) => s.nation === n.id) && (n.kind === 'rival' || state.settlements.some((s) => s.nation === n.id && dist(s.x, s.y, state.settlements.find((x) => x.id === state.nations[p].capitalId)?.x ?? 0, state.settlements.find((x) => x.id === state.nations[p].capitalId)?.y ?? 0) < 70));
  const list = others.filter(seen).sort((a, b) => (a.id === focus ? -1 : b.id === focus ? 1 : relation(state, p, a.id).borderDistance - relation(state, p, b.id).borderDistance));
  return `<section class="screen"><h2>Diplomacia</h2><p class="hint">${ERA_NAMES[state.era]}. Propostas viajam por mensageiro; a resposta chega por carta.</p>
    ${list
      .map((n) => {
        const r = relation(state, p, n.id);
        const t = perceivedTension(state, n.id, p);
        const tribute = r.tribute ? `Tributo: ${r.tribute.from === p ? 'você paga' : 'você recebe'} ${r.tribute.gold}/ano` : '';
        const props: [string, string][] = r.state === 'war' ? [['peace', 'Propor paz'], ['tribute-offer', 'Oferecer tributo (100)']] : [['alliance', 'Aliança'], ['trade', 'Comércio'], ['tribute-demand', 'Exigir tributo (80)'], ['war', 'Declarar guerra']];
        if (n.kind === 'tribe' && n.vassalOf !== p) props.push(['vassal', `Vassalagem (${n.tribeLevel * 150} de ouro)`]);
        if (n.kind === 'rival' && n.vassalOf !== p) props.push(['vassal', 'Exigir vassalagem']);
        return `<div class="card ${n.id === focus ? 'focus' : ''}" data-key="d-${n.id}"><b style="color:${n.color}">${esc(n.name)}</b> <small>${esc(n.ruler)}${n.personality ? ` · ${PERSONALITY_NAMES[n.personality]}` : ''}${n.kind === 'tribe' ? ` · nível ${n.tribeLevel}` : ''}</small>
          <p>${RELATION_NAMES[r.state]} · ${TENSION_NAMES[t]} · fronteira a ${Math.round(r.borderDistance)} casas${r.trade ? ' · comércio' : ''}${n.vassalOf === p ? ' · <b class="good">seu vassalo</b>' : ''} ${tribute}${(r.grudge[n.id] ?? 0) > 10 ? ' · guarda rancor' : ''}</p>
          <div class="row">${props.map(([k, label]) => btn(label, 'propose', `${n.id}:${k}:${k === 'tribute-offer' ? 100 : k === 'tribute-demand' ? 80 : k === 'vassal' && n.kind === 'tribe' ? n.tribeLevel * 150 : 0}`, k === 'war' ? 'small danger' : 'small')).join('')}</div></div>`;
      })
      .join('') || '<p class="hint">Você ainda não conhece outros povos. Explore o mapa.</p>'}
    <h3>Prisioneiros</h3>${state.prisoners.filter((x) => x.holder === p || x.owner === p).map((x) => `<div class="card">${esc(x.name)} — ${x.holder === p ? `seu prisioneiro (dono: ${esc(state.nations[x.owner].name)}) ${btn('Pedir resgate', 'ransom-ask', x.id, 'small')}${btn('Libertar', 'release', x.id, 'small')}` : `preso por ${esc(state.nations[x.holder].name)} ${btn(`Pagar resgate (${x.ransom})`, 'ransom-pay', x.id, 'small')}`}</div>`).join('') || '<p class="hint">Nenhum.</p>'}</section>`;
}

export function renderHeroes(state: GameState): string {
  const p = state.playerNation;
  const mine = state.heroes.filter((h) => h.nation === p);
  const pool = state.heroes.filter((h) => h.nation === -1);
  const card = (h: Hero, hire: boolean) => `<div class="card hero" data-key="h-${h.id}"><span class="pframe"><img class="portrait" src="${artUrlFor(`heroi-${heroPortrait(h.name, h.id)}`)}" alt=""></span><div>
    <b>${esc(h.name)}</b> <small>nível ${h.level}${h.captiveOf != null ? ' · CAPTURADO' : ''}${h.role !== 'none' ? ` · ${h.role === 'commander' ? 'comandante' : 'cônsul'}` : ''}</small>
    <p>${h.traits.map((t) => `<span class="trait" title="${esc(TRAIT_INFO[t] ?? '')}">${esc(t)}</span>`).join(' ')}</p>
    <small>${h.traits.map((t) => esc(TRAIT_INFO[t] ?? '')).join(' ')}</small>
    ${hire ? `<div class="row"><span class="chip">${itemIcon('gold', 14)}${h.hirePrice}</span><small>salário ${h.wage}/ano</small>${btn('Contratar', 'hire-hero', h.id, 'small primary')}</div>` : `<div class="row">${mySettlements(state).filter((s) => s.kind !== 'capital').map((s) => btn(`Cônsul de ${esc(s.name)}`, 'assign-consul', `${h.id}:${s.id}`, s.consulId === h.id ? 'small active' : 'small')).join('')}${btn('Dispensar', 'dismiss-hero', h.id, 'small neutral')}</div>`}
    </div></div>`;
  return `<section class="screen"><h2>Seus heróis</h2>${mine.map((h) => card(h, false)).join('') || '<p class="hint">Nenhum herói ainda.</p>'}
    <h2>Na taverna</h2>${state.settlements.some((s) => s.nation === p && s.buildings.some((b) => b.type === 'tavern' && b.level > 0)) ? '' : '<p class="bad">Construa uma Taverna para contratar.</p>'}
    ${pool.map((h) => card(h, true)).join('')}
    <p class="hint">Para nomear um comandante, abra o exército no mapa.</p></section>`;
}

export function renderSpies(state: GameState): string {
  const p = state.playerNation;
  const n = state.nations[p];
  const missions = state.spyMissions.filter((m) => m.nation === p);
  const ci = ['Nenhuma', 'Silêncio (moradores calados)', 'Desinformação (falsear relatórios)'];
  return `<section class="screen"><h2>Espionagem</h2>
    <p class="hint">Espiões são contratados na Taverna, por missão. Para espionar um lugar, toque nele no mapa. Eles podem mentir: pague bem e mantenha o povo feliz.</p>
    ${missions.map((m) => `<div class="card">Missão em ${esc(state.settlements.find((s) => s.id === m.targetId)?.name ?? '?')} — ${{ traveling: 'a caminho', returning: 'voltando', done: 'concluída (veja as cartas)', captured: 'capturado' }[m.state]} · pago ${m.price}</div>`).join('') || '<p class="hint">Nenhuma missão.</p>'}
    <h3>Contraespionagem</h3><p class="hint">Pague para seus moradores e espiões não vazarem informação aos inimigos. Com moral baixa custa mais e falha mais.</p>
    <div class="row">${ci.map((label, i) => btn(label, 'counter-intel', i, n.counterIntel === i ? 'active' : 'small')).join('')}</div>
    <p>Custo atual: ${itemIcon('gold', 14)} ${counterIntelCost(state, p).toFixed(1)}/min</p></section>`;
}

export function renderLogistics(state: GameState, draft: { from: number; to: number; item: string; amount: number }): string {
  const mine = mySettlements(state);
  const opts = (sel: number) => mine.map((s) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  const items = ITEM_IDS.map((i) => `<option value="${i}" ${i === draft.item ? 'selected' : ''}>${ITEMS[i].name}</option>`).join('');
  const routes = state.routes.filter((r) => r.nation === state.playerNation);
  const name = (id: number) => esc(state.settlements.find((s) => s.id === id)?.name ?? '?');
  const wagons = state.travelers.filter((t) => t.nation === state.playerNation && (t.kind === 'wagon' || t.kind === 'caravan' || t.kind === 'colonists'));
  return `<section class="screen"><h2>Rotas e estradas</h2>
    ${mine.length < 2 ? '<p class="hint">Com dois ou mais assentamentos você pode mandar carroças entre eles.</p>' : ''}
    <div class="card"><b>Nova rota / carroça</b>
      <div class="form-row">De <select data-change="log-from">${opts(draft.from)}</select> para <select data-change="log-to">${opts(draft.to)}</select></div>
      <div class="form-row"><select data-change="log-item">${items}</select> quantidade <input type="number" min="10" max="360" value="${draft.amount}" data-change="log-amount" data-keep="1"></div>
      <div class="row">${btn('Enviar carroça agora', 'wagon', '', 'small primary')}${btn('Criar rota fixa', 'route-create', '', 'small')}${btn('Construir estrada', 'road', '', 'small')}</div>
      <p class="hint">Estrada custa ${BALANCE.roadCostStone} de pedra por casa e deixa carroças e exércitos mais rápidos. Torres de vigia protegem as carroças de emboscadas.</p></div>
    <h3>Rotas fixas</h3>${routes.map((r) => `<div class="card">${name(r.fromId)} → ${name(r.toId)}: ${r.amount} de ${ITEMS[r.item as ItemId]?.name ?? r.item} ${r.busy ? '(carroça na estrada)' : ''} ${btn(r.active ? 'Pausar' : 'Retomar', 'route-toggle', `${r.id}:${r.active ? 0 : 1}`, 'small')}${btn('Apagar', 'route-delete', r.id, 'small neutral')}</div>`).join('') || '<p class="hint">Nenhuma.</p>'}
    <h3>Na estrada agora</h3>${wagons.map((t) => `<div class="card">${{ wagon: 'Carroça', caravan: 'Caravana', colonists: 'Colonos' }[t.kind as string] ?? t.kind} ${t.returning ? '(voltando)' : ''}</div>`).join('') || '<p class="hint">Nada.</p>'}</section>`;
}

export function renderMarket(state: GameState, s: Settlement | undefined, draft: { item: string; qty: number; partner: number }): string {
  if (!s || !s.buildings.some((b) => b.type === 'market' && b.level > 0)) {
    const withMarket = mySettlements(state).find((x) => x.buildings.some((b) => b.type === 'market' && b.level > 0));
    if (!withMarket) return `<section class="screen"><h2>Mercado</h2><p class="bad">Construa um Mercado na capital ou numa cidade.</p></section>`;
    s = withMarket;
  }
  const fee = marketFee(state, s);
  const items = ITEM_IDS.map((i) => `<option value="${i}" ${i === draft.item ? 'selected' : ''}>${ITEMS[i].name} (vale ${ITEMS[i].value})</option>`).join('');
  const partners = state.settlements.filter((x) => x.nation !== state.playerNation && x.buildings.some((b) => b.type === 'market' && b.level > 0) && relation(state, state.playerNation, x.nation).state !== 'war');
  return `<section class="screen"><h2>Mercado de ${esc(s.name)}</h2><p>Taxa: ${Math.round(fee * 100)}%</p>
    <div class="card"><div class="form-row"><select data-change="mk-item">${items}</select> qtd <input type="number" min="1" value="${draft.qty}" data-change="mk-qty" data-keep="1"></div>
    <p>Você tem ${fmt(s.stock[draft.item as ItemId] ?? 0)}.</p>
    <div class="row">${btn('Vender', 'sell', s.id, 'small primary')}${btn('Comprar', 'buy', s.id, 'small')}</div></div>
    <h3>Caravanas</h3><p class="hint">Leve mercadoria a um mercado estrangeiro e volte com 25% de lucro. Podem ser saqueadas no caminho.</p>
    ${partners.length ? `<div class="form-row"><select data-change="mk-partner">${partners.map((x) => `<option value="${x.id}" ${x.id === draft.partner ? 'selected' : ''}>${esc(x.name)} (${esc(state.nations[x.nation].name)})</option>`).join('')}</select>${btn('Enviar caravana', 'caravan', s.id, 'small')}</div>` : '<p class="hint">Nenhum mercado estrangeiro conhecido em paz com você.</p>'}</section>`;
}

export function renderReports(state: GameState, open: number | null): string {
  return `<section class="screen"><h2>Relatórios de batalha</h2>${state.reports
    .map((r) => {
      const playerAtt = r.attackerNation === state.playerNation;
      const won = (r.winner === 'attacker') === playerAtt;
      const lootTotal = Object.values(r.loot).reduce((a, b) => a + (b ?? 0), 0);
      return `<div class="report ${won ? 'won' : 'lost'} ${r.read ? '' : 'unread'}" data-key="rep-${r.id}" data-action="open-report" data-arg="${r.id}">
        <b>${won ? 'Vitória' : 'Derrota'}</b> · ${esc(r.placeName)} <small>${dateLabel(r.time)}</small>
        ${open === r.id ? `<div class="details"><p><b>Atacante:</b> ${esc(r.attackerName)}<br>${troopLine(r.attackerTroops)}<br>Perdas: ${troopLine(r.attackerLosses)}</p><p><b>Defensor:</b> ${esc(r.defenderName)}<br>${troopLine(r.defenderTroops)}<br>Perdas: ${troopLine(r.defenderLosses)}</p><p>${esc(r.outcome)}</p>${lootTotal || r.lootGold ? `<p>Saque: ${Object.entries(r.loot).map(([k, v]) => `${itemIcon(k as ItemId, 14)}${fmt(v ?? 0)}`).join(' ')} ${r.lootGold ? `${itemIcon('gold', 14)}${fmt(r.lootGold)}` : ''}</p>` : ''}</div>` : ''}</div>`;
    })
    .join('') || '<p class="hint">Nenhuma batalha ainda.</p>'}</section>`;
}

export function renderChronicle(state: GameState): string {
  return `<section class="screen"><h2>Crônica do reino</h2><ul class="chronicle">${[...state.events]
    .reverse()
    .map((e) => `<li class="${e.kind}" data-key="e-${e.id}" ${e.x != null ? `data-action="goto-tile" data-arg="${e.x}:${e.y}"` : ''}><small>${dateLabel(e.time)}</small> ${esc(e.text)}</li>`)
    .join('')}</ul></section>`;
}

export function renderMissions(state: GameState): string {
  return `<section class="screen"><h2>Missões</h2>${state.missions
    .map((m) => `<div class="card ${m.done ? 'done' : ''}">${m.done ? '✔' : '☐'} ${esc(m.text)} <small>${m.reward.gold ? `${m.reward.gold} de ouro` : ''}${m.reward.items ? Object.entries(m.reward.items).map(([k, v]) => ` ${v} ${ITEMS[k as ItemId].name.toLowerCase()}`).join(',') : ''}</small></div>`)
    .join('')}</section>`;
}

export function renderKingdom(state: GameState, landShare: number): string {
  const p = state.nations[state.playerNation];
  const mine = mySettlements(state);
  const rivals = state.nations.filter((n) => n.kind === 'rival');
  return `<section class="screen"><h2>${esc(state.kingdomName)}</h2>
    <p>${ERA_NAMES[state.era]} · ${dateLabel(state.time)} · tempo jogado ${fmtTime(state.time)}</p>
    <p>Terras do ${CONTINENT_NAME}: <b>${(landShare * 100).toFixed(1)}%</b> (vitória com 75% e todos os rivais conquistados ou vassalos)</p>
    ${state.victory.achieved ? `<p class="good">👑 Imperador desde ${dateLabel(state.victory.at)}.</p>` : ''}
    <h3>Assentamentos (${mine.length}/${settlementLimit(state, state.playerNation)})</h3>
    ${mine.map((s) => `<div class="card" data-key="k-${s.id}"><b>${esc(s.name)}</b> <small>${settlementKindLabel(s.kind, 1)} · ${ZONE_NAMES[s.zone]}${s.vocation ? ` · ${VOCATION_NAMES[s.vocation]}` : ''}</small><p>${icon('icone-population', 14)} ${population(s)} · ${icon('icone-happiness', 14)} ${Math.round(s.happiness)} · ${icon('icone-health', 14)} ${Math.round(s.health * 100)}%${s.kind !== 'capital' ? ` · ${icon('icone-loyalty', 14)} ${Math.round(s.loyalty)}` : ''}</p>${btn('Abrir', 'open-city', s.id, 'small')}${btn('No mapa', 'goto-tile', `${s.x}:${s.y}`, 'small')}</div>`).join('')}
    <h3>Rivais</h3>${rivals.map((n) => `<div class="card"><b style="color:${n.color}">${esc(n.name)}</b> <small>${n.alive ? (n.vassalOf === p.id ? 'vassalo' : 'independente') : 'destruído'}</small></div>`).join('')}
    <p>Pesquisas concluídas: ${p.research.done.length}/${RESEARCH.length} · Reputação ${Math.round(p.reputation)}</p></section>`;
}

export function renderArtList(): string {
  const total = ART_SPECS.length;
  const given = ART_SPECS.filter((s) => isProvided(s.key)).length;
  return `<section class="screen"><h2>Lista de artes</h2>
    <p>${given}/${total} imagens fornecidas. As demais usam o desenho padrão do jogo. Coloque os arquivos PNG em <code>public/arte/</code> com o nome indicado.</p>
    ${GROUPS.map((g) => {
      const list = ART_SPECS.filter((s) => s.group === g.id);
      return `<details><summary><b>${esc(g.title)}</b> (${list.length})</summary><p class="hint">${esc(g.intro)}</p>${list
        .map((s) => `<div class="art-row" data-key="art-${s.key}"><img src="${artUrlFor(s.key)}" alt="" loading="lazy"><div><b>${esc(s.name)}</b><small><code>${artFileName(s.key)}</code> · ${s.w}×${s.h}px ${isProvided(s.key) ? '· ✔ fornecida' : ''}</small><p>${esc(s.description)}</p></div></div>`)
        .join('')}</details>`;
    }).join('')}</section>`;
}

export function renderHelp(): string {
  return `<section class="screen help"><h2>Como jogar</h2>
    <p><b>O objetivo</b> é formar o império do ${CONTINENT_NAME}: conquistar ou tornar vassalas as 4 nações rivais e controlar 75% das terras.</p>
    <h3>Tempo</h3><p>O jogo só anda com o app aberto. Cada estação dura 5 minutos e o ano, 20. O outono traz a colheita; no inverno as lavouras quase param.</p>
    <h3>Cidade</h3><p>Toque em <b>Construir</b>, escolha uma construção e arraste-a para um lugar livre. Toda construção precisa de trabalhadores: os adultos do assentamento. Defina a prioridade no Painel.</p>
    <h3>Cadeias</h3><p>Trigo → moinho → farinha → padaria → pão. Ferro + madeira → ferreiro → armas. Aveia → estábulo → cavalos. Sem a construção, não há o produto.</p>
    <h3>Comida</h3><p>Energia (pão, mingau), proteína (carne, peixe, ovos, queijo), vitaminas (legumes, frutas) e prazer (cerveja, vinho, mel). Variedade dá força, saúde e moral.</p>
    <h3>Exército</h3><p>Recrute no Quartel (soldados saem da população). Forme um exército, toque nele no mapa e escolha o destino ou um alvo. Lanceiro vence cavaleiro, cavaleiro vence arqueiro, arqueiro vence lanceiro.</p>
    <h3>Expansão</h3><p>Toque numa casa livre do mapa para enviar colonos e fundar aldeias, castelos ou entrepostos. Cada lugar ganha uma vocação. A zona (centro, meio, fronteira) muda o que ele faz bem.</p>
    <h3>Inimigos</h3><p>Bandidos saqueiam; tribos crescem se ninguém as enfrenta; senhores rivais ficam mais agressivos quanto mais perto estão das fronteiras; hordas chegam de navio pelo litoral.</p>
    <h3>Cartas</h3><p>Os cônsules mandam cartas por mensageiro. Cartas podem ser interceptadas — e o inimigo lê o que está escrito.</p></section>`;
}

export function renderSettings(state: GameState, speed: number): string {
  return `<section class="screen"><h2>Opções</h2>
    <h3>Velocidade do tempo</h3><p class="hint">Para quem quer acelerar. O normal é 1×.</p>
    <div class="row">${[1, 2, 4].map((x) => btn(`${x}×`, 'speed', x, speed === x ? 'active' : '')).join('')}</div>
    <h3>Novo jogo</h3><p class="hint">Apaga o reino atual (${esc(state.kingdomName)}) e começa outro.</p>${btn('Começar novo jogo…', 'new-game', '', 'danger')}</section>`;
}

export function renderNewGame(canCancel: boolean): string {
  return `<div class="newgame"><img src="${artUrlFor('ilustracao-titulo')}" alt="" class="banner">
    <h2>Coroa de Pedra</h2><p>Funde seu reino no ${CONTINENT_NAME}.</p>
    <label>Nome do reino <input id="ng-kingdom" value="Reino de Valmor" maxlength="30" data-keep="1"></label>
    <label>Nome da capital <input id="ng-capital" value="Valmor" maxlength="20" data-keep="1"></label>
    <div class="row">${btn('Começar', 'start-game', '', 'primary', false, 'data-testid="start-game"')}${canCancel ? btn('Cancelar', 'close-modal', '', 'neutral') : ''}</div></div>`;
}

export function renderVictory(state: GameState): string {
  return `<div class="newgame"><img src="${artUrlFor('ilustracao-imperador')}" alt="" class="banner"><h2>Vida longa ao Imperador!</h2>
    <p>${esc(state.kingdomName)} uniu o ${CONTINENT_NAME}. O jogo continua, mas as hordas do mar virão bem mais fortes.</p>${btn('Continuar', 'close-modal', '', 'primary')}</div>`;
}

export function renderDefeat(): string {
  return `<div class="newgame"><img src="${artUrlFor('ilustracao-derrota')}" alt="" class="banner"><h2>O reino caiu</h2><p>Não resta nenhum assentamento.</p>${btn('Novo jogo', 'new-game', '', 'primary')}</div>`;
}

export { YEAR_SECONDS };
