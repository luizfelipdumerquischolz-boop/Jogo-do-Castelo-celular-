import { describe, expect, test } from 'vitest';
import {
  BASE_SEA,
  BUILDINGS,
  MAP_SIZE,
  applyAction,
  canPlace,
  createGame,
  findSpot,
  getMap,
  landShare,
  population,
  season,
  serialize,
  deserialize,
  tick,
  year,
  type GameState,
  type Settlement,
} from '../src/sim';
import type { BuildingId } from '../src/sim/data/buildings';

function capital(st: GameState): Settlement {
  const n = st.nations[st.playerNation];
  return st.settlements.find((s) => s.id === n.capitalId)!;
}

/** Coloca uma construção no primeiro lugar livre e espera a obra terminar. */
function build(st: GameState, s: Settlement, type: BuildingId): number {
  s.stock.wood = (s.stock.wood ?? 0) + 500;
  s.stock.stone = (s.stock.stone ?? 0) + 500;
  st.nations[s.nation].gold += 500;
  const spot = findSpot(st, s, type);
  expect(spot, `lugar para ${type}`).not.toBeNull();
  const r = applyAction(st, { type: 'place', settlement: s.id, building: type, x: spot!.x, y: spot!.y });
  expect(r.ok, r.ok ? '' : (r as { reason: string }).reason).toBe(true);
  const b = s.buildings.find((x) => x.type === type && x.x === spot!.x && x.y === spot!.y)!;
  for (let i = 0; i < 600 && b.build; i++) tick(st, 1);
  expect(b.build).toBeNull();
  return b.id;
}

describe('mundo', () => {
  test('o mesmo número gera o mesmo jogo', () => {
    const a = createGame(7);
    const b = createGame(7);
    expect(serialize(a)).toBe(serialize(b));
  });

  test('Continente X: 256×256 cercado de mar, com 5 reinos', () => {
    const st = createGame(3);
    const m = getMap();
    expect(MAP_SIZE).toBe(256);
    const majors = st.nations.filter((n) => n.kind === 'player' || n.kind === 'rival');
    expect(majors.length).toBe(5);
    for (const n of majors) expect(st.settlements.some((s) => s.id === n.capitalId)).toBe(true);
    // Toda a borda é água.
    for (let i = 0; i < MAP_SIZE; i++) {
      for (const j of [i, (MAP_SIZE - 1) * MAP_SIZE + i, i * MAP_SIZE, i * MAP_SIZE + MAP_SIZE - 1]) expect(m.base[j]).toBe(BASE_SEA);
    }
  });

  test('o tempo só anda quando a simulação roda (app aberto)', () => {
    const st = createGame(1);
    const t0 = st.time;
    const before = serialize(st);
    expect(serialize(st)).toBe(before);
    tick(st, 30);
    expect(st.time).toBeCloseTo(t0 + 30, 5);
  });

  test('estações de 5 minutos e ano de 20 minutos', () => {
    expect(season(0)).toBe(0);
    expect(season(300)).toBe(1);
    expect(season(900)).toBe(3);
    expect(year(0)).toBe(1);
    expect(year(1200)).toBe(2);
  });
});

describe('cidade e economia', () => {
  test('não deixa construir em cima de outra construção', () => {
    const st = createGame(5);
    const s = capital(st);
    const keep = s.buildings[0];
    expect(canPlace(st, s, 'wheat_farm', keep.x, keep.y).ok).toBe(false);
  });

  test('construir gasta recursos e a obra termina com o tempo', () => {
    const st = createGame(5);
    const s = capital(st);
    const wood = s.stock.wood ?? 0;
    const spot = findSpot(st, s, 'wheat_farm')!;
    const r = applyAction(st, { type: 'place', settlement: s.id, building: 'wheat_farm', x: spot.x, y: spot.y });
    expect(r.ok).toBe(true);
    expect(s.stock.wood).toBeLessThan(wood);
    const b = s.buildings[s.buildings.length - 1];
    expect(b.build).not.toBeNull();
    tick(st, BUILDINGS.wheat_farm.buildTime + 30);
    expect(b.build).toBeNull();
    expect(b.level).toBe(1);
  });

  test('sem ferro não há armas: o ferreiro depende do insumo', () => {
    const st = createGame(11);
    const s = capital(st);
    build(st, s, 'blacksmith');
    s.stock.iron = 0;
    const w0 = s.stock.weapon ?? 0;
    tick(st, 60);
    expect(s.stock.weapon ?? 0).toBeLessThanOrEqual(w0);
    s.stock.iron = 200;
    s.stock.wood = (s.stock.wood ?? 0) + 200;
    tick(st, 120);
    expect(s.stock.weapon ?? 0).toBeGreaterThan(w0);
  });

  test('construções precisam de trabalhadores', () => {
    const st = createGame(13);
    const s = capital(st);
    tick(st, 5);
    const working = s.buildings.reduce((n, b) => n + b.workers, 0);
    expect(working).toBeGreaterThan(0);
    expect(working).toBeLessThanOrEqual(population(s));
  });

  test('o povo come e a comida acaba sem produção', () => {
    const st = createGame(17);
    const s = capital(st);
    const food0 = (s.stock.bread ?? 0) + (s.stock.vegetables ?? 0) + (s.stock.porridge ?? 0) + (s.stock.eggs ?? 0);
    s.buildings = s.buildings.filter((b) => !BUILDINGS[b.type].recipes.some((r) => ['bread', 'vegetables', 'porridge', 'eggs'].some((f) => (r.output as Record<string, number>)[f])));
    tick(st, 60);
    const food1 = (s.stock.bread ?? 0) + (s.stock.vegetables ?? 0) + (s.stock.porridge ?? 0) + (s.stock.eggs ?? 0);
    expect(food1).toBeLessThan(food0);
  });

  test('recrutar gasta armas e pessoas', () => {
    const st = createGame(19);
    const s = capital(st);
    build(st, s, 'barracks');
    s.stock.weapon = 20;
    const pop0 = population(s);
    const r = applyAction(st, { type: 'recruit', settlement: s.id, unit: 'spearman', count: 2 });
    expect(r.ok, r.ok ? '' : (r as { reason: string }).reason).toBe(true);
    expect(s.stock.weapon).toBeLessThan(20);
    expect(population(s)).toBeLessThan(pop0);
  });
});

describe('exércitos e diplomacia', () => {
  test('formar exército e marchar pelo mapa', () => {
    const st = createGame(23);
    const s = capital(st);
    const r = applyAction(st, { type: 'form-army', settlement: s.id, troops: { spearman: 4 } });
    expect(r.ok).toBe(true);
    const a = st.armies.find((x) => x.id === r.armyId)!;
    const mv = applyAction(st, { type: 'army-move', army: a.id, x: s.x + 6, y: s.y });
    expect(mv.ok).toBe(true);
    tick(st, 20);
    expect(Math.hypot(a.x - s.x, a.y - s.y)).toBeGreaterThan(0.5);
  });

  test('propostas viajam por mensageiro e a resposta chega por carta', () => {
    const st = createGame(29);
    const rival = st.nations.find((n) => n.kind === 'rival')!;
    const letters0 = st.letters.length;
    const r = applyAction(st, { type: 'propose', to: rival.id, proposal: 'trade' });
    expect(r.ok, r.ok ? '' : (r as { reason: string }).reason).toBe(true);
    expect(st.travelers.some((t) => t.kind === 'messenger')).toBe(true);
    for (let i = 0; i < 900 && !st.letters.some((l, k) => k >= letters0 && l.toNation === st.playerNation && l.arrived); i++) tick(st, 1);
    expect(st.letters.some((l, k) => k >= letters0 && l.toNation === st.playerNation && l.arrived)).toBe(true);
  });

  test('batalhas acontecem no mapa e um exército forte toma uma aldeia tribal', () => {
    const st = createGame(47);
    const s = capital(st);
    const tribe = st.settlements
      .filter((x) => x.kind === 'tribal')
      .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
    const g = st.armies.find((a) => a.id === s.garrisonId)!;
    g.troops = { spearman: 200, archer: 80, knight: 60 } as typeof g.troops;
    s.stock.bread = 2000;
    const r = applyAction(st, { type: 'form-army', settlement: s.id, troops: { spearman: 200, archer: 80, knight: 60 } });
    expect(r.ok, r.ok ? '' : (r as { reason: string }).reason).toBe(true);
    const at = applyAction(st, { type: 'army-attack', army: r.armyId!, target: tribe.id, mode: 'attack' });
    expect(at.ok, at.ok ? '' : (at as { reason: string }).reason).toBe(true);
    const reports0 = st.reports.length;
    for (let i = 0; i < 3600 && tribe.nation !== st.playerNation; i++) tick(st, 1);
    expect(st.reports.length).toBeGreaterThan(reports0);
    expect(tribe.nation).toBe(st.playerNation);
  }, 60_000);

  test('espião só sai de uma Taverna', () => {
    const st = createGame(31);
    const s = capital(st);
    const target = st.settlements.find((x) => x.nation !== st.playerNation && x.kind === 'capital')!;
    const r = applyAction(st, { type: 'spy', from: s.id, target: target.id, offer: 100 });
    expect(r.ok).toBe(false);
  });
});

describe('salvar', () => {
  test('salvar e carregar mantém o jogo igual', () => {
    const st = createGame(37);
    tick(st, 120);
    const txt = serialize(st);
    const back = deserialize(txt);
    expect(serialize(back)).toBe(txt);
    tick(st, 30);
    tick(back, 30);
    expect(serialize(back)).toBe(serialize(st));
  });

  test('IndexedDB guarda e devolve o jogo', async () => {
    const { indexedDB } = await import('fake-indexeddb');
    const { saveGame, loadGame, deleteSave } = await import('../src/sim/save');
    const st = createGame(41);
    tick(st, 10);
    await saveGame(st, indexedDB);
    const back = await loadGame(indexedDB);
    expect(back).not.toBeNull();
    expect(serialize(back!)).toBe(serialize(st));
    await deleteSave(indexedDB);
    expect(await loadGame(indexedDB)).toBeNull();
  });
});

describe('simulação longa', () => {
  test('duas horas de jogo sem números quebrados e com o mundo vivo', () => {
    const st = createGame(43);
    for (let m = 0; m < 120; m++) tick(st, 60);
    for (const s of st.settlements) {
      expect(Number.isFinite(population(s))).toBe(true);
      expect(population(s)).toBeGreaterThanOrEqual(0);
      for (const v of Object.values(s.stock)) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(-1e-6);
      }
    }
    for (const n of st.nations) expect(Number.isFinite(n.gold)).toBe(true);
    const rivals = st.nations.filter((n) => n.kind === 'rival' && n.alive);
    const grew = rivals.some((n) => st.settlements.filter((s) => s.nation === n.id).length > 1 || st.settlements.find((s) => s.id === n.capitalId)!.buildings.length > 12);
    expect(grew).toBe(true);
    expect(landShare(st, st.playerNation)).toBeGreaterThan(0);
  }, 120_000);
});
