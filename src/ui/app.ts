import { BUILDINGS, type BuildingCategory, type BuildingId, type Vocation } from '../sim/data/buildings';
import type { ItemId } from '../sim/data/items';
import type { UnitId } from '../sim/data/units';
import type { Action } from '../sim/actions';
import type { ProposalType } from '../sim/diplomacy';
import { MAP_SIZE, getMap } from '../sim/map';
import type { Army, GameState, Settlement } from '../sim/types';
import type { Snapshot } from '../client/core';
import type { Engine } from '../client/engine';
import { artUrl } from '../art/loader';
import { CityView } from './cityView';
import { $, esc, morph } from './dom';
import { MapView, type MapHit } from './mapView';
import * as S from './screens';

type Sheet =
  | { type: 'building'; id: number }
  | { type: 'build-menu'; cat: BuildingCategory }
  | { type: 'recruit'; sId: number }
  | { type: 'overview'; sId: number; tab: string }
  | { type: 'form-army'; sId: number }
  | { type: 'settlement'; id: number }
  | { type: 'army'; id: number }
  | { type: 'tile'; x: number; y: number }
  | { type: 'traveler'; id: number }
  | { type: 'ghost' };

type Modal = { type: 'letter'; id: number } | { type: 'newgame'; cancel: boolean } | { type: 'victory' } | { type: 'defeat' } | null;

const LIST_SCREENS = new Set(['armies', 'letters', 'more', 'research', 'diplomacy', 'heroes', 'spies', 'logistics', 'market', 'reports', 'chronicle', 'missions', 'kingdom', 'art', 'help', 'settings']);

export class App {
  snap: Snapshot | null = null;
  screen = 'city';
  cityId: number | null = null;
  sheet: Sheet | null = null;
  modal: Modal = null;
  mapMode: { type: 'army-move' | 'army-patrol'; armyId: number } | null = null;
  map: MapView;
  city: CityView;
  draftArmy: Record<string, number> = {};
  spyOffer = 0;
  logDraft = { from: 0, to: 0, item: 'wood', amount: 60 };
  marketDraft = { item: 'wood', qty: 50, partner: 0 };
  attackArmyId: number | null = null;
  diploFocus: number | null = null;
  openReport: number | null = null;
  speed = 1;
  private lastEventId = 0;
  private toasts: { id: number; text: string; kind: string; until: number }[] = [];
  private victorySeen = false;
  private drag: { type: BuildingId; startX: number; startY: number; active: boolean } | null = null;
  running = false;

  constructor(private engine: Engine) {
    S.setArtUrl(artUrl);
    this.map = new MapView($('#map') as HTMLCanvasElement, (hit) => this.onMapTap(hit));
    this.city = new CityView(
      $('#city') as HTMLCanvasElement,
      (b) => {
        if (b) this.sheet = { type: 'building', id: b.id };
        else if (this.sheet?.type === 'building') this.sheet = null;
        this.renderUI();
      },
      () => this.renderUI(),
    );
    engine.onSnapshot = (s) => this.onSnapshot(s);
    engine.onError = (msg) => {
      console.error(msg);
      this.toast('Erro na simulação: ' + msg.split('\n')[0], 'bad');
    };
    this.bindDom();
    window.addEventListener('resize', () => this.resize());
  }

  get state(): GameState | null {
    return this.snap?.state ?? null;
  }

  currentCity(): Settlement | undefined {
    const st = this.state;
    if (!st) return undefined;
    let s = st.settlements.find((x) => x.id === this.cityId && x.nation === st.playerNation);
    if (!s) {
      s = st.settlements.find((x) => x.id === st.nations[st.playerNation].capitalId) ?? st.settlements.find((x) => x.nation === st.playerNation);
      this.cityId = s?.id ?? null;
    }
    return s;
  }

  // Ciclo de vida -------------------------------------------------------------------------------

  async boot(): Promise<void> {
    const has = await this.engine.boot();
    if (!has) {
      this.modal = { type: 'newgame', cancel: false };
      this.renderUI();
      return;
    }
    this.start();
  }

  start(): void {
    this.running = true;
    if (!document.hidden) this.engine.run(true);
    document.addEventListener('visibilitychange', () => {
      // O tempo só corre com o app visível: escondeu, congela e salva.
      this.engine.run(!document.hidden && this.running);
    });
    window.addEventListener('pagehide', () => this.engine.run(false));
    requestAnimationFrame((t) => this.frame(t));
  }

  private onSnapshot(s: Snapshot): void {
    const first = !this.snap;
    this.snap = s;
    this.map.setSnapshot(s);
    this.city.state = s.state;
    if (first) {
      const cap = this.currentCity();
      if (cap) {
        this.map.centerOn(cap.x, cap.y);
        this.city.settlementId = cap.id;
        this.resize();
        this.city.fit();
      }
      this.lastEventId = s.state.events.length ? s.state.events[s.state.events.length - 1].id : 0;
    }
    this.city.settlementId = this.currentCity()?.id ?? null;
    this.city.validateGhost();
    this.city.dirty = true;
    for (const e of s.state.events) {
      if (e.id > this.lastEventId) {
        if (e.kind !== 'info') this.toast(e.text, e.kind);
        this.lastEventId = e.id;
      }
    }
    if (s.state.victory.achieved && !this.victorySeen) {
      this.victorySeen = true;
      if (!first) this.modal = { type: 'victory' };
    }
    if (s.state.defeated && this.modal?.type !== 'newgame') this.modal = { type: 'defeat' };
    this.renderUI();
  }

  private frame(t: number): void {
    const st = this.state;
    // Canvas que estava escondido ganha o tamanho certo quando aparece.
    for (const v of [this.map, this.city]) {
      const r = v.canvas.getBoundingClientRect();
      if (r.width > 0 && Math.abs(v.canvas.width - Math.round(r.width * Math.min(2, devicePixelRatio || 1))) > 2) {
        v.resize();
        if (v === this.city) this.city.fit();
      }
    }
    if (st) {
      if (this.screen === 'map') {
        const animating = st.battles.length > 0 || st.armies.some((a) => a.stationedAt == null && a.pathIdx < a.path.length) || st.travelers.length > 0;
        if (this.map.dirty || animating) this.map.draw(t);
      } else if (this.screen === 'city') {
        const s = this.currentCity();
        const animating = !!s && s.buildings.some((b) => b.build || b.efficiency < 0.2);
        if (this.city.dirty || animating) this.city.draw(t);
      }
    }
    requestAnimationFrame((tt) => this.frame(tt));
  }

  resize(): void {
    this.map.resize();
    this.city.resize();
  }

  toast(text: string, kind = 'info'): void {
    this.toasts.push({ id: Math.random(), text, kind, until: performance.now() + 4000 });
    if (this.toasts.length > 3) this.toasts.shift();
    this.renderToasts();
    setTimeout(() => this.renderToasts(), 4100);
  }

  private renderToasts(): void {
    const now = performance.now();
    this.toasts = this.toasts.filter((t) => t.until > now);
    morph($('#toasts'), this.toasts.map((t) => `<div class="toast ${t.kind}" data-key="${t.id}">${esc(t.text)}</div>`).join(''));
  }

  async act(a: Action, okMsg?: string): Promise<boolean> {
    const r = await this.engine.act(a);
    if (!r.ok) this.toast(r.reason ?? 'Não foi possível', 'bad');
    else if (okMsg) this.toast(okMsg, 'good');
    return r.ok;
  }

  // Renderização HTML -------------------------------------------------------------------------

  renderUI(): void {
    const st = this.state;
    document.body.dataset.screen = this.screen;
    if (!st) {
      morph($('#modal'), this.modal?.type === 'newgame' ? S.renderNewGame(false) : '');
      $('#modal').classList.toggle('open', !!this.modal);
      return;
    }
    const city = this.currentCity();
    morph($('#top'), S.renderTop(st, city, this.screen));
    morph($('#nav'), S.renderNav(st, this.screen));
    // Barra da cidade
    morph($('#citybar'), this.screen === 'city' && city ? S.renderCityBar(st, city) : '');
    // Telas de lista
    morph($('#screen'), LIST_SCREENS.has(this.screen) ? this.renderListScreen(st) : '');
    // Painel de baixo
    morph($('#sheet'), this.renderSheet(st));
    $('#sheet').classList.toggle('open', !!this.sheet && this.sheetVisible());
    // Botões flutuantes do mapa
    morph(
      $('#mapbar'),
      this.screen === 'map'
        ? `<button class="fab" data-action="zoom" data-arg="1.3">＋</button><button class="fab" data-action="zoom" data-arg="0.77">－</button><button class="fab" data-action="center-capital" title="Capital">⌂</button>${this.mapMode ? `<div class="mode-hint">Toque no destino · <button class="btn small neutral" data-action="cancel-mode">Cancelar</button></div>` : ''}`
        : '',
    );
    // Janela modal
    let modal = '';
    if (this.modal?.type === 'letter') {
      const id = this.modal.id;
      const l = st.letters.find((x) => x.id === id);
      modal = l ? S.renderLetterModal(l) : '';
    } else if (this.modal?.type === 'newgame') modal = S.renderNewGame(this.modal.cancel);
    else if (this.modal?.type === 'victory') modal = S.renderVictory(st);
    else if (this.modal?.type === 'defeat') modal = S.renderDefeat();
    morph($('#modal'), modal);
    $('#modal').classList.toggle('open', !!modal);
  }

  private sheetVisible(): boolean {
    if (!this.sheet) return false;
    const mapSheets = ['settlement', 'army', 'tile', 'traveler'];
    if (this.screen === 'map') return mapSheets.includes(this.sheet.type) || ['form-army', 'recruit', 'overview'].includes(this.sheet.type);
    if (this.screen === 'city') return !mapSheets.includes(this.sheet.type) || this.sheet.type === 'settlement';
    return ['form-army', 'recruit', 'overview', 'settlement'].includes(this.sheet.type);
  }

  private renderListScreen(st: GameState): string {
    switch (this.screen) {
      case 'armies':
        return S.renderArmies(st);
      case 'letters':
        return S.renderLetters(st);
      case 'more':
        return S.renderMore(st);
      case 'research':
        return S.renderResearch(st);
      case 'diplomacy':
        return S.renderDiplomacy(st, this.diploFocus);
      case 'heroes':
        return S.renderHeroes(st);
      case 'spies':
        return S.renderSpies(st);
      case 'logistics': {
        const mine = S.mySettlements(st);
        if (!mine.some((s) => s.id === this.logDraft.from)) this.logDraft.from = mine[0]?.id ?? 0;
        if (!mine.some((s) => s.id === this.logDraft.to)) this.logDraft.to = mine[1]?.id ?? mine[0]?.id ?? 0;
        return S.renderLogistics(st, this.logDraft);
      }
      case 'market':
        return S.renderMarket(st, this.currentCity(), this.marketDraft);
      case 'reports':
        return S.renderReports(st, this.openReport);
      case 'chronicle':
        return S.renderChronicle(st);
      case 'missions':
        return S.renderMissions(st);
      case 'kingdom':
        return S.renderKingdom(st, this.landShare());
      case 'art':
        return S.renderArtList();
      case 'help':
        return S.renderHelp();
      case 'settings':
        return S.renderSettings(st, this.speed);
    }
    return '';
  }

  private landShare(): number {
    if (!this.snap) return 0;
    const st = this.snap.state;
    const own = new Set([st.playerNation, ...st.nations.filter((n) => n.vassalOf === st.playerNation).map((n) => n.id)]);
    let n = 0;
    for (let i = 0; i < this.map.owner.length; i++) if (own.has(this.map.owner[i])) n++;
    return n / getMap().landCount;
  }

  private renderSheet(st: GameState): string {
    const sh = this.sheet;
    if (!sh) return '';
    const s = (id: number) => st.settlements.find((x) => x.id === id);
    switch (sh.type) {
      case 'building': {
        const city = this.currentCity();
        const b = city?.buildings.find((x) => x.id === sh.id);
        return city && b ? S.renderBuildingSheet(st, city, b) : '';
      }
      case 'build-menu': {
        const city = this.currentCity();
        return city ? S.renderBuildMenu(st, city, sh.cat) : '';
      }
      case 'ghost':
        return this.city.ghost ? S.renderGhostBar(this.city.ghostValid, this.city.ghostReason, this.city.ghost.moving != null) : '';
      case 'recruit': {
        const x = s(sh.sId);
        return x ? S.renderRecruit(st, x) : '';
      }
      case 'overview': {
        const x = s(sh.sId);
        return x ? S.renderOverview(st, x, sh.tab) : '';
      }
      case 'form-army': {
        const x = s(sh.sId);
        return x ? S.renderFormArmy(st, x, this.draftArmy) : '';
      }
      case 'settlement': {
        const x = s(sh.id);
        return x ? S.renderSettlementSheet(st, x, this.myFieldArmies(), this.spyOffer) : '';
      }
      case 'army': {
        const a = st.armies.find((x) => x.id === sh.id);
        return a ? S.renderArmySheet(st, a, this.mapMode?.armyId === a.id ? this.mapMode.type : '') : '';
      }
      case 'tile': {
        const sel = this.mapMode ? st.armies.find((a) => a.id === this.mapMode!.armyId) : undefined;
        const i = sh.y * MAP_SIZE + sh.x;
        return S.renderTileSheet(st, sh.x, sh.y, !!this.snap?.explored[i], this.map.owner[i] ?? -1, sel);
      }
      case 'traveler': {
        const t = st.travelers.find((x) => x.id === sh.id);
        if (!t) return '';
        const names: Record<string, string> = { wagon: 'Carroça', caravan: 'Caravana', messenger: 'Mensageiro', colonists: 'Colonos', spy: 'Espião', ship: 'Navio da horda' };
        return `<div class="sheet-head"><h3>${names[t.kind]}</h3><button class="btn icon-btn" data-action="close-sheet">✕</button></div><p>${esc(st.nations[t.nation].name)}${t.kind === 'ship' ? ` · onda ${t.wave}` : ''}</p>`;
      }
    }
    return '';
  }

  private myFieldArmies(): Army[] {
    const st = this.state;
    if (!st) return [];
    const list = st.armies.filter((a) => a.nation === st.playerNation && a.stationedAt == null && a.battleId == null);
    if (this.attackArmyId == null || !list.some((a) => a.id === this.attackArmyId)) this.attackArmyId = list[0]?.id ?? null;
    return [...list].sort((a, b) => (a.id === this.attackArmyId ? -1 : b.id === this.attackArmyId ? 1 : 0));
  }

  // Entrada --------------------------------------------------------------------------------------

  private bindDom(): void {
    document.body.addEventListener('click', (e) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-action]');
      if (!el || (el as HTMLButtonElement).disabled) return;
      void this.handle(el.dataset.action!, el.dataset.arg ?? '');
    });
    document.body.addEventListener('change', (e) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement;
      const what = el.dataset.change;
      if (what) void this.handleChange(what, el.value, el.dataset.arg ?? '');
    });
    // Arrastar uma construção da lista direto para o terreno.
    document.body.addEventListener('pointerdown', (e) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-drag]');
      if (!el) return;
      this.drag = { type: el.dataset.drag as BuildingId, startX: e.clientX, startY: e.clientY, active: false };
    });
    document.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      if (!this.drag.active && Math.hypot(e.clientX - this.drag.startX, e.clientY - this.drag.startY) > 14) {
        this.drag.active = true;
        this.startGhost(this.drag.type, null);
      }
      if (this.drag.active) {
        const r = this.city.canvas.getBoundingClientRect();
        this.city.moveGhostTo(e.clientX - r.left, e.clientY - r.top - 30);
      }
    });
    document.addEventListener('pointerup', () => {
      if (this.drag?.active) this.renderUI();
      this.drag = null;
    });
  }

  private startGhost(type: BuildingId, moving: number | null, at?: { x: number; y: number }): void {
    const s = this.currentCity();
    if (!s) return;
    const n = BUILDINGS[type].size;
    const c = Math.floor(12 - n / 2);
    this.city.setGhost({ type, x: at?.x ?? c, y: at?.y ?? c, moving });
    this.sheet = { type: 'ghost' };
    this.renderUI();
  }

  private onMapTap(hit: MapHit): void {
    const st = this.state;
    if (!st) return;
    this.map.selected = hit;
    this.map.highlightTile = hit.kind === 'tile' ? { x: hit.x, y: hit.y } : null;
    if (this.mapMode && (hit.kind === 'tile' || hit.kind === 'settlement')) {
      const mode = this.mapMode;
      let x: number;
      let y: number;
      if (hit.kind === 'tile') {
        x = hit.x;
        y = hit.y;
      } else {
        const s = st.settlements.find((v) => v.id === hit.id)!;
        if (s.nation !== st.playerNation && mode.type === 'army-move') {
          // Tocar num lugar inimigo com exército selecionado abre as opções de ataque.
          this.attackArmyId = mode.armyId;
          this.mapMode = null;
          this.sheet = { type: 'settlement', id: s.id };
          this.renderUI();
          return;
        }
        x = s.x;
        y = s.y;
      }
      this.mapMode = null;
      void this.act(mode.type === 'army-move' ? { type: 'army-move', army: mode.armyId, x, y } : { type: 'army-patrol', army: mode.armyId, x, y }, 'Ordem enviada.');
      this.sheet = { type: 'army', id: mode.armyId };
      this.map.selected = { kind: 'army', id: mode.armyId };
      this.renderUI();
      return;
    }
    if (hit.kind === 'settlement') this.sheet = { type: 'settlement', id: hit.id };
    else if (hit.kind === 'army') {
      this.sheet = { type: 'army', id: hit.id };
      const a = st.armies.find((v) => v.id === hit.id);
      if (a?.nation === st.playerNation) this.attackArmyId = a.id;
    } else if (hit.kind === 'traveler') this.sheet = { type: 'traveler', id: hit.id };
    else this.sheet = { type: 'tile', x: hit.x, y: hit.y };
    this.map.dirty = true;
    this.renderUI();
  }

  async handleChange(what: string, value: string, arg: string): Promise<void> {
    switch (what) {
      case 'city-select':
        this.cityId = Number(value);
        this.city.settlementId = this.cityId;
        this.city.selectedBuilding = null;
        this.sheet = null;
        this.city.fit();
        break;
      case 'district-voc':
        if (value && this.cityId != null) await this.act({ type: 'district', settlement: this.cityId, quadrant: Number(arg), vocation: value as Vocation });
        break;
      case 'vocation':
        if (value && this.sheet?.type === 'overview') await this.act({ type: 'vocation', settlement: this.sheet.sId, vocation: value as Vocation }, 'Vocação definida.');
        break;
      case 'attack-army':
        this.attackArmyId = Number(value);
        break;
      case 'log-from':
        this.logDraft.from = Number(value);
        break;
      case 'log-to':
        this.logDraft.to = Number(value);
        break;
      case 'log-item':
        this.logDraft.item = value;
        break;
      case 'log-amount':
        this.logDraft.amount = Math.max(10, Math.min(360, Number(value) || 10));
        break;
      case 'mk-item':
        this.marketDraft.item = value;
        break;
      case 'mk-qty':
        this.marketDraft.qty = Math.max(1, Number(value) || 1);
        break;
      case 'mk-partner':
        this.marketDraft.partner = Number(value);
        break;
    }
    this.renderUI();
  }

  async handle(action: string, arg: string): Promise<void> {
    const st = this.state;
    const parts = arg.split(':');
    const num = Number(arg);
    switch (action) {
      case 'screen':
        this.screen = arg;
        if (arg !== 'map') this.mapMode = null;
        if (arg === 'reports') void this.engine.act({ type: 'read-reports' });
        if (this.sheet && !this.sheetVisible()) this.sheet = null;
        if (arg === 'city') {
          this.resize();
          this.city.dirty = true;
        }
        if (arg === 'map') {
          this.resize();
          this.map.dirty = true;
        }
        window.scrollTo(0, 0);
        break;
      case 'close-sheet':
        if (this.sheet?.type === 'ghost') this.city.setGhost(null);
        this.sheet = null;
        this.city.selectedBuilding = null;
        this.map.selected = null;
        this.map.highlightTile = null;
        this.mapMode = null;
        this.map.dirty = this.city.dirty = true;
        break;
      case 'close-modal':
        this.modal = null;
        break;
      case 'open-build':
        this.sheet = { type: 'build-menu', cat: 'food' };
        break;
      case 'build-cat':
        this.sheet = { type: 'build-menu', cat: arg as BuildingCategory };
        break;
      case 'pick-building':
        if (!this.drag?.active) this.startGhost(arg as BuildingId, null);
        return;
      case 'ghost-cancel':
        this.city.setGhost(null);
        this.sheet = null;
        break;
      case 'ghost-confirm': {
        const g = this.city.ghost;
        const s = this.currentCity();
        if (!g || !s) break;
        const ok = g.moving != null ? await this.act({ type: 'move-building', settlement: s.id, building: g.moving, x: g.x, y: g.y }) : await this.act({ type: 'place', settlement: s.id, building: g.type, x: g.x, y: g.y }, `${BUILDINGS[g.type].name}: obra iniciada.`);
        if (ok) {
          this.city.setGhost(null);
          this.sheet = null;
        }
        break;
      }
      case 'upgrade':
        if (this.cityId != null) await this.act({ type: 'upgrade', settlement: this.cityId, building: num }, 'Melhoria iniciada.');
        break;
      case 'move-building': {
        const b = this.currentCity()?.buildings.find((x) => x.id === num);
        if (b) this.startGhost(b.type, b.id, { x: b.x, y: b.y });
        return;
      }
      case 'demolish':
        if (this.cityId != null && confirm('Demolir esta construção? Volta 30% do material.')) {
          if (await this.act({ type: 'demolish', settlement: this.cityId, building: num })) this.sheet = null;
        }
        break;
      case 'recipe':
        if (this.cityId != null) await this.act({ type: 'recipe', settlement: this.cityId, building: Number(parts[0]), recipe: parts[1], weight: Number(parts[2]) });
        break;
      case 'open-recruit':
        this.sheet = { type: 'recruit', sId: num || this.cityId! };
        break;
      case 'recruit': {
        const sId = this.sheet?.type === 'recruit' ? this.sheet.sId : this.cityId!;
        await this.act({ type: 'recruit', settlement: sId, unit: parts[0] as UnitId, count: Number(parts[1]) });
        break;
      }
      case 'open-overview':
        this.sheet = { type: 'overview', sId: num || this.cityId!, tab: 'povo' };
        break;
      case 'overview-tab':
        if (this.sheet?.type === 'overview') this.sheet = { ...this.sheet, tab: arg };
        break;
      case 'prio-up':
      case 'prio-down': {
        const s = this.sheet?.type === 'overview' ? st?.settlements.find((x) => x.id === (this.sheet as { sId: number }).sId) : undefined;
        if (!s) break;
        const pr = [...s.priorities];
        const j = action === 'prio-up' ? num - 1 : num + 1;
        [pr[num], pr[j]] = [pr[j], pr[num]];
        await this.act({ type: 'priorities', settlement: s.id, priorities: pr });
        break;
      }
      case 'ration':
        if (this.sheet?.type === 'overview') await this.act({ type: 'ration', settlement: this.sheet.sId, ration: arg as never });
        break;
      case 'tax':
        if (this.sheet?.type === 'overview') await this.act({ type: 'tax', settlement: this.sheet.sId, tax: num });
        break;
      case 'invest':
        if (this.sheet?.type === 'overview') await this.act({ type: 'invest', settlement: this.sheet.sId, quadrant: num }, 'Investimento feito.');
        break;
      case 'defense':
        if (this.sheet?.type === 'overview') await this.act({ type: 'defense', settlement: this.sheet.sId, what: arg as never }, 'Feito.');
        break;
      case 'open-form-army':
        this.draftArmy = {};
        this.sheet = { type: 'form-army', sId: num };
        break;
      case 'draft': {
        const s = this.sheet?.type === 'form-army' ? st?.settlements.find((x) => x.id === (this.sheet as { sId: number }).sId) : undefined;
        const g = s ? st?.armies.find((a) => a.id === s.garrisonId) : undefined;
        const have = Math.floor(g?.troops[parts[0] as UnitId] ?? 0);
        this.draftArmy[parts[0]] = Math.max(0, Math.min(have, (this.draftArmy[parts[0]] ?? 0) + Number(parts[1])));
        break;
      }
      case 'draft-all': {
        const s = this.sheet?.type === 'form-army' ? st?.settlements.find((x) => x.id === (this.sheet as { sId: number }).sId) : undefined;
        const g = s ? st?.armies.find((a) => a.id === s.garrisonId) : undefined;
        this.draftArmy = {};
        if (g) for (const k in g.troops) if (k !== 'militia') this.draftArmy[k] = Math.floor(g.troops[k as UnitId] ?? 0);
        break;
      }
      case 'draft-clear':
        this.draftArmy = {};
        break;
      case 'form-army': {
        const r = await this.engine.act({ type: 'form-army', settlement: num, troops: this.draftArmy });
        if (!r.ok) this.toast(r.reason ?? 'Falhou', 'bad');
        else {
          this.toast('Exército formado. Toque no mapa para dar ordens.', 'good');
          this.draftArmy = {};
          this.attackArmyId = r.armyId ?? null;
          this.screen = 'map';
          this.resize();
          if (r.armyId != null) {
            this.sheet = { type: 'army', id: r.armyId };
            this.map.selected = { kind: 'army', id: r.armyId };
            const s = st?.settlements.find((x) => x.id === num);
            if (s) this.map.centerOn(s.x, s.y);
          }
        }
        break;
      }
      case 'open-city':
        this.cityId = num;
        this.city.settlementId = num;
        this.screen = 'city';
        this.sheet = null;
        this.resize();
        this.city.fit();
        break;
      case 'goto-army': {
        const a = st?.armies.find((x) => x.id === num);
        if (a) {
          this.screen = 'map';
          this.resize();
          this.map.centerOn(Math.round(a.x), Math.round(a.y));
          this.map.selected = { kind: 'army', id: a.id };
          this.sheet = { type: 'army', id: a.id };
        }
        break;
      }
      case 'goto-tile':
        this.screen = 'map';
        this.resize();
        this.map.centerOn(Number(parts[0]), Number(parts[1]));
        break;
      case 'center-capital': {
        const c = st?.settlements.find((x) => x.id === st.nations[st.playerNation].capitalId);
        if (c) this.map.centerOn(c.x, c.y);
        break;
      }
      case 'zoom':
        this.map.setZoom(this.map.zoom * num);
        break;
      case 'cancel-mode':
        this.mapMode = null;
        break;
      case 'army-pick-move':
        this.mapMode = { type: 'army-move', armyId: num };
        this.toast('Toque no destino no mapa.', 'info');
        break;
      case 'army-pick-patrol':
        this.mapMode = { type: 'army-patrol', armyId: num };
        this.toast('Toque no ponto de patrulha.', 'info');
        break;
      case 'army-move-here':
        this.mapMode = null;
        await this.act({ type: 'army-move', army: Number(parts[0]), x: Number(parts[1]), y: Number(parts[2]) }, 'Marchando.');
        break;
      case 'army-return':
        await this.act({ type: 'army-return', army: num }, 'Voltando para casa.');
        break;
      case 'army-defend': {
        const a = st?.armies.find((x) => x.id === num);
        if (a) await this.act({ type: 'army-defend', army: num, x: Math.round(a.x), y: Math.round(a.y) }, 'Defendendo a região.');
        break;
      }
      case 'army-hunt':
        await this.act({ type: 'army-hunt', army: num }, 'Caçando bandidos.');
        break;
      case 'army-escort':
        await this.act({ type: 'army-escort', army: num }, 'Escoltando carroças.');
        break;
      case 'army-formation':
        await this.act({ type: 'army-formation', army: Number(parts[0]), formation: parts[1] as never });
        break;
      case 'army-autonomy': {
        const a = st?.armies.find((x) => x.id === num);
        if (a?.autonomous) await this.act({ type: 'army-direct', army: num }, 'Você assumiu o comando.');
        else if (a?.commanderId != null) await this.act({ type: 'commander', hero: a.commanderId, army: num }, 'O comandante decide.');
        break;
      }
      case 'assign-commander':
        await this.act({ type: 'commander', hero: Number(parts[0]), army: Number(parts[1]) }, 'Comandante nomeado.');
        break;
      case 'attack': {
        if (this.attackArmyId == null) {
          this.toast('Escolha um exército.', 'bad');
          break;
        }
        const ok = await this.act({ type: 'army-attack', army: this.attackArmyId, target: Number(parts[0]), mode: parts[1] as 'attack' | 'raid' }, 'O exército marcha para o ataque!');
        if (ok) {
          this.sheet = { type: 'army', id: this.attackArmyId };
          this.map.selected = { kind: 'army', id: this.attackArmyId };
        }
        break;
      }
      case 'spy-offer':
        this.spyOffer = Math.max(5, (this.spyOffer || this.currentQuote()) + num);
        break;
      case 'spy': {
        const tav = st ? S.mySettlements(st).find((x) => x.buildings.some((b) => b.type === 'tavern' && b.level > 0)) : undefined;
        if (!tav) break;
        const offer = this.spyOffer || this.currentQuote();
        const ok = await this.act({ type: 'spy', from: tav.id, target: num, offer }, 'O espião partiu. O relatório chega por carta.');
        if (ok) this.spyOffer = 0;
        break;
      }
      case 'colonize':
        if (await this.act({ type: 'colonize', settlement: Number(parts[0]), x: Number(parts[1]), y: Number(parts[2]), kind: parts[3] as never }, 'Os colonos partiram!')) this.sheet = null;
        break;
      case 'colonize-help':
        this.screen = 'map';
        this.resize();
        this.sheet = null;
        this.toast('Toque numa casa livre do mapa para fundar um assentamento.', 'info');
        break;
      case 'open-letter':
        this.modal = { type: 'letter', id: num };
        void this.engine.act({ type: 'read-letter', letter: num });
        break;
      case 'letter-action':
        await this.act({ type: 'letter-action', letter: Number(parts[0]), index: Number(parts[1]) }, 'Feito.');
        this.modal = null;
        break;
      case 'open-report':
        this.openReport = this.openReport === num ? null : num;
        break;
      case 'research':
        await this.act({ type: 'research', id: arg }, 'Pesquisa iniciada.');
        break;
      case 'open-diplo':
        this.diploFocus = num;
        this.screen = 'diplomacy';
        this.sheet = null;
        break;
      case 'propose':
        await this.act({ type: 'propose', to: Number(parts[0]), proposal: parts[1] as ProposalType, gold: Number(parts[2]) || 0 }, parts[1] === 'war' ? 'Guerra declarada.' : 'Proposta enviada por mensageiro.');
        break;
      case 'ransom-pay':
        await this.act({ type: 'ransom-pay', prisoner: num }, 'Resgate pago.');
        break;
      case 'ransom-ask':
        await this.act({ type: 'ransom-ask', prisoner: num }, 'Pedido de resgate enviado.');
        break;
      case 'release':
        await this.act({ type: 'release-prisoner', prisoner: num }, 'Prisioneiro libertado.');
        break;
      case 'hire-hero':
        await this.act({ type: 'hire-hero', hero: num }, 'Herói contratado.');
        break;
      case 'assign-consul':
        await this.act({ type: 'consul', hero: Number(parts[0]), settlement: Number(parts[1]) }, 'Cônsul nomeado.');
        break;
      case 'dismiss-hero':
        await this.act({ type: 'dismiss-hero', hero: num });
        break;
      case 'counter-intel':
        await this.act({ type: 'counter-intel', level: num }, 'Contraespionagem ajustada.');
        break;
      case 'wagon':
        await this.act({ type: 'wagon', from: this.logDraft.from, to: this.logDraft.to, cargo: { [this.logDraft.item]: this.logDraft.amount } }, 'Carroça a caminho.');
        break;
      case 'route-create':
        await this.act({ type: 'route-create', from: this.logDraft.from, to: this.logDraft.to, item: this.logDraft.item as ItemId, amount: this.logDraft.amount }, 'Rota criada.');
        break;
      case 'route-toggle':
        await this.act({ type: 'route-toggle', route: Number(parts[0]), active: parts[1] === '1' });
        break;
      case 'route-delete':
        await this.act({ type: 'route-delete', route: num });
        break;
      case 'road':
        await this.act({ type: 'road', from: this.logDraft.from, to: this.logDraft.to }, 'Estrada construída.');
        break;
      case 'open-market':
        this.screen = 'market';
        this.sheet = null;
        break;
      case 'sell':
        await this.act({ type: 'sell', settlement: num, item: this.marketDraft.item as ItemId, qty: this.marketDraft.qty }, 'Vendido.');
        break;
      case 'buy':
        await this.act({ type: 'buy', settlement: num, item: this.marketDraft.item as ItemId, qty: this.marketDraft.qty }, 'Comprado.');
        break;
      case 'caravan':
        await this.act({ type: 'caravan', from: num, to: this.marketDraft.partner, cargo: { [this.marketDraft.item]: this.marketDraft.qty } }, 'Caravana a caminho.');
        break;
      case 'speed':
        this.speed = num;
        this.engine.speed(num);
        break;
      case 'new-game':
        this.modal = { type: 'newgame', cancel: !!st && !st.defeated };
        break;
      case 'start-game': {
        const kingdom = ($('#ng-kingdom') as HTMLInputElement)?.value.trim() || 'Reino de Valmor';
        const capital = ($('#ng-capital') as HTMLInputElement)?.value.trim() || 'Valmor';
        this.modal = null;
        this.snap = null;
        this.sheet = null;
        this.cityId = null;
        this.victorySeen = false;
        this.screen = 'city';
        this.engine.run(false);
        await this.engine.boot({ seed: Math.floor(Math.random() * 1e9), kingdom, capital });
        if (!this.running) this.start();
        else this.engine.run(!document.hidden);
        break;
      }
    }
    this.map.dirty = true;
    this.city.dirty = true;
    this.renderUI();
  }

  private currentQuote(): number {
    const st = this.state;
    if (!st || this.sheet?.type !== 'settlement') return 30;
    const tav = S.mySettlements(st).find((x) => x.buildings.some((b) => b.type === 'tavern' && b.level > 0));
    if (!tav) return 30;
    const t = st.settlements.find((x) => x.id === (this.sheet as { id: number }).id);
    if (!t) return 30;
    return Math.round(25 + Math.hypot(t.x - tav.x, t.y - tav.y) * 0.4);
  }
}
