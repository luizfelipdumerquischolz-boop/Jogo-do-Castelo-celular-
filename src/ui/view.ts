import {
  BUILDINGS,
  BUILDING_IDS,
  MAP_SIZE,
  MAX_LEVEL,
  PLAYER_ID,
  PLAYER_PROTECTION_SECONDS,
  RESOURCE_IDS,
  RESOURCE_NAMES,
  UNITS,
  UNIT_IDS,
  WALL_BONUS_BY_LEVEL,
  PRODUCTION_BY_LEVEL,
  STORAGE_BY_LEVEL,
  PROTECTED_BY_LEVEL,
  TROOP_CAP_BY_LEVEL,
  armySize,
  attackPower,
  buildingCost,
  buildingTime,
  canTrain,
  canUpgrade,
  estimateDefense,
  getPlayer,
  homeArmy,
  isAttackable,
  marchTime,
  maxAffordable,
  productionRates,
  storageCapacity,
  strengthScore,
  troopCapacity,
  troopsAway,
  troopsCommitted,
  unitCost,
  unitTrainTime,
  type Army,
  type BattleReport,
  type Fortress,
  type GameState,
  type Resources,
} from '../game';
import { SWORDS, buildingIcon, fortressIcon, resourceIcon, unitIcon } from './icons';

export type Tab = 'castle' | 'army' | 'map' | 'reports';

export interface UiState {
  tab: Tab;
  selected: string | null;
  draft: Army;
  openReport: number | null;
  toasts: { id: number; text: string; kind: string; until: number }[];
  confirmReset: boolean;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function fmt(n: number): string {
  const v = Math.floor(n);
  if (v >= 10000) return `${(v / 1000).toFixed(1).replace('.', ',')}k`;
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

const FACTION_LABEL: Record<Fortress['faction'], string> = {
  player: 'Seu castelo',
  lord: 'Senhor rival',
  bandit: 'Bandidos',
  invader: 'Invasores',
};

function costChips(cost: Resources, have: Resources): string {
  return RESOURCE_IDS.filter((r) => cost[r] > 0)
    .map(
      (r) =>
        `<span class="chip ${have[r] < cost[r] ? 'chip-short' : ''}" title="${RESOURCE_NAMES[r]}">${resourceIcon(r, 14)}${fmt(cost[r])}</span>`,
    )
    .join('');
}

function armyLine(army: Army, empty = 'nenhuma'): string {
  const parts = UNIT_IDS.filter((u) => army[u] > 0).map((u) => `${army[u]} ${army[u] === 1 ? UNITS[u].name : UNITS[u].plural}`);
  return parts.length ? parts.join(', ') : empty;
}

function progress(remaining: number, total: number, label: string, testid = ''): string {
  const pct = total > 0 ? Math.min(100, Math.max(0, (1 - remaining / total) * 100)) : 100;
  return `<div class="progress" ${testid ? `data-testid="${testid}"` : ''}>
    <div class="progress-bar" style="width:${pct.toFixed(1)}%"></div>
    <span>${esc(label)} · ${fmtTime(remaining)}</span></div>`;
}

export function renderHeader(s: GameState): string {
  const c = getPlayer(s).castle!;
  const rates = productionRates(c);
  const cap = storageCapacity(c);
  const res = RESOURCE_IDS.map(
    (r) => `<div class="res" data-testid="res-${r}" title="${RESOURCE_NAMES[r]}">
      ${resourceIcon(r, 20)}<div><b>${fmt(c.resources[r])}</b><small>+${rates[r].toFixed(1).replace('.', ',')}/s</small></div>
      ${c.resources[r] >= cap ? '<i class="full" title="Armazém cheio"></i>' : ''}</div>`,
  ).join('');
  const incoming = s.marches.filter((m) => m.kind === 'attack' && m.targetId === PLAYER_ID);
  const threat = incoming.length
    ? `<div class="alert" data-key="threat">${SWORDS} Ataque chegando em ${fmtTime(Math.min(...incoming.map((m) => m.remaining)))}!</div>`
    : '';
  return `<div class="resbar">${res}</div>
    <div class="subbar"><span>Armazém: ${fmt(cap)}</span><span>Próxima horda: ${fmtTime(s.invaders.nextWaveIn)}</span></div>
    ${threat}`;
}

export function renderNav(ui: UiState, s: GameState): string {
  const unread = s.reports.filter((r) => !r.read).length;
  const tabs: [Tab, string, string][] = [
    ['castle', 'Castelo', buildingIcon('barracks', 24)],
    ['army', 'Tropas', unitIcon('spearman', 24)],
    ['map', 'Mapa', fortressIcon('lord', 24)],
    ['reports', 'Relatórios', SWORDS],
  ];
  return tabs
    .map(
      ([id, label, icon]) => `<button class="tab ${ui.tab === id ? 'active' : ''}" data-action="tab" data-arg="${id}" data-testid="tab-${id}">
        ${icon}<span>${label}</span>${id === 'reports' && unread ? `<em class="badge">${unread}</em>` : ''}</button>`,
    )
    .join('');
}

function buildingEffect(id: string, level: number): string {
  switch (id) {
    case 'farm':
    case 'sawmill':
    case 'quarry': {
      const r = id === 'farm' ? 'comida' : id === 'sawmill' ? 'madeira' : 'pedra';
      return `+${PRODUCTION_BY_LEVEL[level].toString().replace('.', ',')} ${r}/s`;
    }
    case 'barracks':
      return `limite ${TROOP_CAP_BY_LEVEL[level]} tropas`;
    case 'wall':
      return `+${Math.round(WALL_BONUS_BY_LEVEL[level] * 100)}% defesa`;
    case 'storehouse':
      return `${fmt(STORAGE_BY_LEVEL[level])} por recurso, ${Math.round(PROTECTED_BY_LEVEL[level] * 100)}% protegido`;
  }
  return '';
}

export function renderCastle(s: GameState): string {
  const c = getPlayer(s).castle!;
  const cards = BUILDING_IDS.map((id) => {
    const def = BUILDINGS[id];
    const level = c.buildings[id];
    const busy = c.buildQueue?.building === id;
    let action: string;
    if (busy) {
      action = progress(c.buildQueue!.remaining, c.buildQueue!.total, `Nível ${c.buildQueue!.toLevel}`, `progress-${id}`);
    } else if (level >= MAX_LEVEL) {
      action = `<div class="maxed">Nível máximo</div>`;
    } else {
      const cost = buildingCost(id, level + 1);
      const check = canUpgrade(c, id);
      action = `<div class="cost">${costChips(cost, c.resources)}<span class="chip">⏱ ${fmtTime(buildingTime(id, level + 1))}</span></div>
        <button class="btn" data-action="upgrade" data-arg="${id}" data-testid="upgrade-${id}" ${check.ok ? '' : 'disabled'}>
          ${level === 0 ? 'Construir' : `Melhorar p/ nível ${level + 1}`}</button>
        ${check.ok ? '' : `<small class="why">${esc(check.reason)}</small>`}`;
    }
    const now = level > 0 ? buildingEffect(id, level) : 'Ainda não construído';
    const next = level < MAX_LEVEL ? ` → ${buildingEffect(id, level + 1)}` : '';
    return `<article class="card ${level === 0 ? 'unbuilt' : ''}" data-key="b-${id}">
      <div class="card-icon">${buildingIcon(id)}</div>
      <div class="card-body">
        <h3>${def.name} <span class="lvl" data-testid="level-${id}">Nv ${level}/${MAX_LEVEL}</span></h3>
        <p>${def.description}</p>
        <p class="effect">${now}${next}</p>
        ${action}
      </div></article>`;
  }).join('');
  return `<section class="view"><h2>${esc(getPlayer(s).name)}</h2>
    <p class="hint">Um construtor trabalha de cada vez. O jogo só avança com o app aberto.</p>${cards}</section>`;
}

export function renderArmy(s: GameState): string {
  const c = getPlayer(s).castle!;
  const away = troopsAway(s, PLAYER_ID);
  const committed = troopsCommitted(c, away);
  const cap = troopCapacity(c);
  const cards = UNIT_IDS.map((u) => {
    const def = UNITS[u];
    const locked = c.buildings.barracks < def.barracksLevel;
    const max = Math.max(0, Math.min(maxAffordable(c, u), cap - committed));
    const btn = (n: number, label: string) => {
      const ok = n > 0 && canTrain(c, u, n, away).ok;
      return `<button class="btn small" data-action="train" data-arg="${u}:${n}" data-testid="train-${u}-${label}" ${ok ? '' : 'disabled'}>${label === 'max' ? `Máx (${n})` : `+${n}`}</button>`;
    };
    const vs = UNITS[def.strongAgainst].plural.toLowerCase();
    return `<article class="card ${locked ? 'unbuilt' : ''}" data-key="u-${u}">
      <div class="card-icon">${unitIcon(u)}</div>
      <div class="card-body">
        <h3>${def.name} <span class="lvl" data-testid="troops-${u}">${c.troops[u]}</span></h3>
        <p>${def.description}</p>
        <p class="effect">⚔ ${def.attack} · 🛡 ${def.defense} · carga ${def.carry} · forte contra ${vs}</p>
        <div class="cost">${costChips(unitCost(u), c.resources)}<span class="chip">⏱ ${fmtTime(unitTrainTime(u, c.buildings.barracks))}</span></div>
        ${locked ? `<small class="why">Requer Quartel nível ${def.barracksLevel}</small>` : `<div class="row">${btn(1, '1')}${btn(5, '5')}${btn(max, 'max')}</div>`}
      </div></article>`;
  }).join('');
  const queue = c.trainQueue.length
    ? c.trainQueue
        .map((j, i) =>
          i === 0
            ? progress(j.remaining, j.perUnit, `${j.count}× ${UNITS[j.unit].name}`, 'train-progress')
            : `<div class="queued">${j.count}× ${UNITS[j.unit].name} na fila</div>`,
        )
        .join('')
    : '<p class="hint">Nenhum treino em andamento.</p>';
  return `<section class="view"><h2>Tropas</h2>
    <p class="hint">Em casa: ${armyLine(c.troops)} · Em marcha: ${away} · Limite: ${committed}/${cap}${c.buildings.barracks === 0 ? ' (construa o Quartel)' : ''}</p>
    <div class="queue">${queue}</div>${cards}</section>`;
}

function marchList(s: GameState): string {
  const mine = s.marches.filter((m) => m.ownerId === PLAYER_ID || m.targetId === PLAYER_ID);
  if (!mine.length) return '';
  const name = (id: string) => s.fortresses.find((f) => f.id === id)?.name ?? id;
  return `<div class="marches"><h3>Exércitos em movimento</h3>${mine
    .map((m) => {
      const label =
        m.ownerId === PLAYER_ID
          ? m.kind === 'attack'
            ? `Atacando ${name(m.targetId)}`
            : `Voltando de ${name(m.fromId)}`
          : m.waveNumber
            ? `Horda (onda ${m.waveNumber}) vindo até você`
            : `${name(m.ownerId)} vindo até você`;
      return `<div data-key="m-${m.id}" class="${m.ownerId === PLAYER_ID ? '' : 'enemy'}">${progress(m.remaining, m.total, label)}</div>`;
    })
    .join('')}</div>`;
}

function fortressPanel(s: GameState, ui: UiState): string {
  const f = s.fortresses.find((x) => x.id === ui.selected);
  if (!f) return '';
  const player = getPlayer(s);
  const home = player.castle!.troops;
  const header = `<div class="sheet-head">${fortressIcon(f.faction, 40, f.rebuildIn > 0)}
    <div><h3>${esc(f.name)}</h3><small>${FACTION_LABEL[f.faction]}${f.personality ? `, ${f.personality.title}` : ''} · Nível ${f.level} · Força ${strengthScore(f)}</small></div>
    <button class="close" data-action="close" aria-label="Fechar">✕</button></div>`;
  if (f.id === PLAYER_ID) {
    return `<div class="sheet" data-testid="sheet">${header}<p>Defensores: ${armyLine(home)}. Muralha +${Math.round(
      WALL_BONUS_BY_LEVEL[player.castle!.buildings.wall] * 100,
    )}%.</p></div>`;
  }
  const garrison = homeArmy(f);
  let info = `<p>Guarnição: ${armyLine(garrison)}.</p>`;
  if (f.faction === 'bandit') {
    info += f.rebuildIn > 0
      ? `<p>Acampamento em ruínas. Os bandidos voltam em ${fmtTime(f.rebuildIn)}.</p>`
      : `<p>Saque estimado: ${RESOURCE_IDS.map((r) => `${resourceIcon(r, 12)}${fmt(f.loot[r])}`).join(' ')}</p>`;
  } else if (f.faction === 'invader' && f.rebuildIn > 0) {
    info += `<p>Acampamento vazio. A horda volta em ${fmtTime(f.rebuildIn)}.</p>`;
  } else if (f.faction === 'lord') {
    info += `<p>Muralha nível ${f.castle!.buildings.wall}. Ataques ao seu castelo: ${f.stats.attacksOnPlayer}.</p>`;
  }
  if (!isAttackable(f)) return `<div class="sheet" data-testid="sheet">${header}${info}</div>`;

  const steppers = UNIT_IDS.map(
    (u) => `<div class="stepper" data-key="st-${u}">${unitIcon(u, 28)}
      <button class="btn small" data-action="draft" data-arg="${u}:-5">−5</button>
      <button class="btn small" data-action="draft" data-arg="${u}:-1">−</button>
      <b data-testid="draft-${u}">${ui.draft[u]}<small>/${home[u]}</small></b>
      <button class="btn small" data-action="draft" data-arg="${u}:1">+</button>
      <button class="btn small" data-action="draft" data-arg="${u}:5">+5</button></div>`,
  ).join('');
  const n = armySize(ui.draft);
  let forecast = '';
  if (n > 0) {
    const ratio = attackPower(ui.draft, garrison) / Math.max(1, estimateDefense(f, ui.draft));
    forecast =
      ratio > 1.3
        ? '<p class="good">Batedores: vitória provável.</p>'
        : ratio > 1
          ? '<p class="warn">Batedores: vitória apertada, com muitas perdas.</p>'
          : '<p class="bad">Batedores: derrota provável.</p>';
  }
  return `<div class="sheet" data-testid="sheet">${header}${info}
    <h4>Enviar ataque · marcha de ${fmtTime(marchTime(player, f))}</h4>${steppers}
    <div class="row"><button class="btn small" data-action="draft-all">Todas</button><button class="btn small" data-action="draft-clear">Limpar</button></div>
    ${forecast}
    <button class="btn attack" data-action="send" data-testid="send-attack" ${n > 0 ? '' : 'disabled'}>${SWORDS} Atacar com ${n} tropas</button></div>`;
}

export function renderMap(s: GameState, ui: UiState): string {
  const byPos = new Map(s.fortresses.map((f) => [`${f.x},${f.y}`, f]));
  const targeted = new Set(s.marches.filter((m) => m.ownerId === PLAYER_ID && m.kind === 'attack').map((m) => m.targetId));
  let cells = '';
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const f = byPos.get(`${x},${y}`);
      const terrain = (x * 7 + y * 13) % 11 === 0 ? 'tree' : (x * 5 + y * 3) % 17 === 0 ? 'hill' : '';
      if (!f) {
        cells += `<div class="cell ${terrain}"></div>`;
        continue;
      }
      cells += `<button class="cell fort ${f.faction} ${ui.selected === f.id ? 'sel' : ''} ${targeted.has(f.id) ? 'targeted' : ''}"
        data-action="select" data-arg="${f.id}" data-testid="fort-${f.id}" aria-label="${esc(f.name)}">
        ${fortressIcon(f.faction, 30, f.rebuildIn > 0)}<span class="flv">${f.level}</span></button>`;
    }
  }
  const legend = `<div class="legend"><span class="player">Você</span><span class="lord">Senhores</span><span class="bandit">Bandidos</span><span class="invader">Invasores</span></div>`;
  const protection =
    s.time < PLAYER_PROTECTION_SECONDS
      ? `<p class="hint">Proteção de novato: os senhores não atacam você por mais ${fmtTime(PLAYER_PROTECTION_SECONDS - s.time)}.</p>`
      : '';
  return `<section class="view"><h2>Mapa do reino</h2>${protection}${legend}
    <div class="grid" style="--n:${MAP_SIZE}">${cells}</div>${marchList(s)}${fortressPanel(s, ui)}</section>`;
}

function reportCard(r: BattleReport, open: boolean): string {
  const playerAttacked = r.attackerId === PLAYER_ID;
  const won = playerAttacked === r.attackerWon;
  const title = playerAttacked ? `Ataque a ${esc(r.defenderName)}` : `Defesa contra ${esc(r.attackerName)}`;
  const lootTotal = RESOURCE_IDS.reduce((n, k) => n + r.loot[k], 0);
  const details = open
    ? `<div class="details">
      <p><b>Atacante:</b> ${esc(r.attackerName)}<br>Tropas: ${armyLine(r.attackerArmy)}<br>Perdas: ${armyLine(r.attackerLosses)}</p>
      <p><b>Defensor:</b> ${esc(r.defenderName)}<br>Tropas: ${armyLine(r.defenderArmy)}<br>Perdas: ${armyLine(r.defenderLosses)}</p>
      <p>Poder de ataque <b>${r.attackPower}</b> × poder de defesa <b>${r.defensePower}</b> (muralha +${Math.round(r.wallBonus * 100)}%)</p>
      <p>${lootTotal > 0 ? `Saque: ${RESOURCE_IDS.map((k) => `${resourceIcon(k, 12)}${fmt(r.loot[k])}`).join(' ')}` : 'Nenhum recurso saqueado.'}</p></div>`
    : '';
  return `<article class="report ${won ? 'won' : 'lost'} ${r.read ? '' : 'unread'}" data-key="r-${r.id}" data-action="report" data-arg="${r.id}">
    <div class="report-head"><b>${won ? 'Vitória' : 'Derrota'}</b> · ${title}<small>${fmtTime(r.time)} de jogo</small></div>${details}</article>`;
}

export function renderReports(s: GameState, ui: UiState): string {
  const reports = s.reports.length
    ? s.reports.map((r) => reportCard(r, ui.openReport === r.id)).join('')
    : '<p class="hint">Nenhuma batalha ainda.</p>';
  const chronicle = [...s.events]
    .reverse()
    .slice(0, 25)
    .map((e) => `<li class="${e.kind}" data-key="e-${e.id}"><small>${fmtTime(e.time)}</small> ${esc(e.text)}</li>`)
    .join('');
  const reset = ui.confirmReset
    ? `<div class="row"><button class="btn danger" data-action="reset-yes">Apagar e recomeçar</button><button class="btn" data-action="reset-no">Cancelar</button></div>`
    : `<button class="btn ghost" data-action="reset">Novo jogo…</button>`;
  return `<section class="view"><h2>Relatórios de batalha</h2>${reports}
    <h2>Crônica do reino</h2><ul class="chronicle">${chronicle || '<li>Tudo calmo por enquanto.</li>'}</ul>
    <p class="hint">Tempo de jogo: ${fmtTime(s.time)} · salvo automaticamente neste aparelho.</p>${reset}</section>`;
}

export function renderToasts(ui: UiState): string {
  return ui.toasts.map((t) => `<div class="toast ${t.kind}" data-key="t-${t.id}">${esc(t.text)}</div>`).join('');
}
