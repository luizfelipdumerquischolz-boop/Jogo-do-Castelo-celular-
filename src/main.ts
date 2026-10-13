import './ui/style.css';
import {
  UNIT_IDS,
  createInitialState,
  deleteSave,
  emptyArmy,
  loadGame,
  markReportsRead,
  playerCastle,
  saveGame,
  sendAttack,
  tick,
  trainUnits,
  upgradeBuilding,
  type BuildingId,
  type GameState,
  type UnitId,
} from './game';
import { morph } from './ui/morph';
import { renderArmy, renderCastle, renderHeader, renderMap, renderNav, renderReports, renderToasts, type Tab, type UiState } from './ui/view';

/** Maior avanço aceito entre dois quadros. Pausas maiores (app em segundo plano) são descartadas. */
const MAX_FRAME_SECONDS = 1;
const AUTOSAVE_MS = 5000;
const RENDER_MS = 200;

const ui: UiState = { tab: 'castle', selected: null, draft: emptyArmy(), openReport: null, toasts: [], confirmReset: false };
let state: GameState;
let lastEventSeen = 0;
let lastFrame = 0;
let lastRender = 0;
let dirty = true;
let running = false;

const $ = (sel: string) => document.querySelector(sel)!;

function toast(text: string, kind = 'info'): void {
  ui.toasts.push({ id: Math.random(), text, kind, until: performance.now() + 3500 });
  if (ui.toasts.length > 3) ui.toasts.shift();
  dirty = true;
}

function render(): void {
  const now = performance.now();
  ui.toasts = ui.toasts.filter((t) => t.until > now);
  let news = false;
  for (const e of state.events) {
    if (e.id > lastEventSeen) {
      // Avisos na tela só para o que afeta o jogador; o resto fica na crônica.
      if (e.kind !== 'info') toast(e.text, e.kind);
      lastEventSeen = e.id;
      news = true;
    }
  }
  // Algo aconteceu (construção pronta, tropa treinada, batalha): salva na hora.
  if (news) save();
  if (ui.tab === 'reports') markReportsRead(state);
  morph($('#header'), renderHeader(state));
  morph($('#nav'), renderNav(ui, state));
  const view =
    ui.tab === 'castle'
      ? renderCastle(state)
      : ui.tab === 'army'
        ? renderArmy(state)
        : ui.tab === 'map'
          ? renderMap(state, ui)
          : renderReports(state, ui);
  morph($('#main'), view);
  morph($('#toasts'), renderToasts(ui));
  lastRender = now;
  dirty = false;
}

function save(): void {
  if (state) saveGame(state).catch((err) => console.warn('Falha ao salvar', err));
}

function frame(now: number): void {
  if (!running) return;
  const dt = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (dt > 0) tick(state, dt);
  if (dirty || now - lastRender >= RENDER_MS) render();
  requestAnimationFrame(frame);
}

function start(): void {
  if (running) return;
  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function stop(): void {
  running = false;
  save();
}

function clampDraft(): void {
  const home = playerCastle(state).troops;
  for (const u of UNIT_IDS) ui.draft[u] = Math.max(0, Math.min(home[u], ui.draft[u]));
}

function handle(action: string, arg: string): void {
  switch (action) {
    case 'tab':
      ui.tab = arg as Tab;
      ui.confirmReset = false;
      window.scrollTo(0, 0);
      break;
    case 'upgrade': {
      const r = upgradeBuilding(state, arg as BuildingId);
      if (!r.ok) toast(r.reason, 'bad');
      save();
      break;
    }
    case 'train': {
      const [u, n] = arg.split(':');
      const r = trainUnits(state, u as UnitId, Number(n));
      if (!r.ok) toast(r.reason, 'bad');
      save();
      break;
    }
    case 'select':
      ui.selected = ui.selected === arg ? null : arg;
      ui.draft = emptyArmy();
      break;
    case 'close':
      ui.selected = null;
      break;
    case 'draft': {
      const [u, d] = arg.split(':');
      ui.draft[u as UnitId] += Number(d);
      clampDraft();
      break;
    }
    case 'draft-all':
      ui.draft = { ...playerCastle(state).troops };
      break;
    case 'draft-clear':
      ui.draft = emptyArmy();
      break;
    case 'send': {
      if (!ui.selected) break;
      const r = sendAttack(state, ui.selected, ui.draft);
      if (r.ok) {
        toast('Suas tropas marcharam!', 'good');
        ui.draft = emptyArmy();
        ui.selected = null;
      } else toast(r.reason, 'bad');
      save();
      break;
    }
    case 'report':
      ui.openReport = ui.openReport === Number(arg) ? null : Number(arg);
      break;
    case 'reset':
      ui.confirmReset = true;
      break;
    case 'reset-no':
      ui.confirmReset = false;
      break;
    case 'reset-yes':
      ui.confirmReset = false;
      state = createInitialState(Date.now() % 100000);
      lastEventSeen = 0;
      ui.tab = 'castle';
      deleteSave().finally(save);
      break;
  }
  render();
}

async function boot(): Promise<void> {
  try {
    state = (await loadGame()) ?? createInitialState();
  } catch (err) {
    console.warn('Save ilegível, começando um novo jogo', err);
    state = createInitialState();
  }
  lastEventSeen = state.events.length ? state.events[state.events.length - 1].id : 0;

  document.body.addEventListener('click', (ev) => {
    const el = (ev.target as Element).closest<HTMLElement>('[data-action]');
    if (!el || (el as HTMLButtonElement).disabled) return;
    handle(el.dataset.action!, el.dataset.arg ?? '');
  });

  // O tempo só corre com o app visível: ao esconder, congela e salva; ao voltar, segue de onde parou.
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('pagehide', stop);
  setInterval(() => running && save(), AUTOSAVE_MS);

  document.body.classList.add('ready');
  render();
  if (!document.hidden) start();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker não registrado', err));
  });
}

boot();
