import { describe, expect, it } from 'vitest';
import {
  BUILDING_IDS,
  MAX_LEVEL,
  PRODUCTION_BY_LEVEL,
  BASE_PRODUCTION,
  buildingCost,
  buildingTime,
  canUpgrade,
  createInitialState,
  newCastle,
  playerCastle,
  productionRates,
  storageCapacity,
  tick,
  tickCastle,
  trainUnits,
  troopCapacity,
  upgradeBuilding,
} from '../src/game';

const total = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

describe('produção de recursos', () => {
  it('produz continuamente a taxa base sem edifícios', () => {
    const c = newCastle();
    tickCastle(c, 10);
    expect(c.resources.food).toBeCloseTo(BASE_PRODUCTION.food * 10);
    expect(c.resources.wood).toBeCloseTo(BASE_PRODUCTION.wood * 10);
    expect(c.resources.stone).toBeCloseTo(BASE_PRODUCTION.stone * 10);
    expect(c.resources.gold).toBeCloseTo(BASE_PRODUCTION.gold * 10);
  });

  it('fazenda, serraria e pedreira aumentam a produção por nível', () => {
    const c = newCastle();
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      c.buildings.farm = lvl;
      c.buildings.sawmill = lvl;
      c.buildings.quarry = lvl;
      const r = productionRates(c);
      expect(r.food).toBeCloseTo(BASE_PRODUCTION.food + PRODUCTION_BY_LEVEL[lvl]);
      expect(r.wood).toBeCloseTo(BASE_PRODUCTION.wood + PRODUCTION_BY_LEVEL[lvl]);
      expect(r.stone).toBeCloseTo(BASE_PRODUCTION.stone + PRODUCTION_BY_LEVEL[lvl]);
      if (lvl > 1) expect(PRODUCTION_BY_LEVEL[lvl]).toBeGreaterThan(PRODUCTION_BY_LEVEL[lvl - 1]);
    }
  });

  it('ouro cresce com o desenvolvimento do castelo', () => {
    const c = newCastle();
    const before = productionRates(c).gold;
    c.buildings.wall = 3;
    expect(productionRates(c).gold).toBeGreaterThan(before);
  });

  it('respeita o limite do armazém', () => {
    const c = newCastle();
    tickCastle(c, 100000);
    expect(c.resources.food).toBe(storageCapacity(c));
    c.buildings.storehouse = 2;
    expect(storageCapacity(c)).toBeGreaterThan(c.resources.food);
  });

  it('o tick do jogo produz recursos para o jogador', () => {
    const s = createInitialState();
    const before = { ...playerCastle(s).resources };
    tick(s, 30);
    const after = playerCastle(s).resources;
    expect(after.food).toBeCloseTo(before.food + BASE_PRODUCTION.food * 30, 5);
    expect(s.time).toBe(30);
  });
});

describe('custos de construção', () => {
  it('as 6 construções têm 5 níveis com custo e tempo crescentes', () => {
    expect(BUILDING_IDS).toHaveLength(6);
    for (const b of BUILDING_IDS) {
      for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
        expect(total(buildingCost(b, lvl))).toBeGreaterThan(total(buildingCost(b, lvl - 1)));
        expect(buildingTime(b, lvl)).toBeGreaterThan(buildingTime(b, lvl - 1));
      }
    }
  });

  it('valores conhecidos da fazenda', () => {
    expect(buildingCost('farm', 1)).toEqual({ food: 0, wood: 30, stone: 10, gold: 0 });
    expect(buildingCost('farm', 2)).toEqual({ food: 0, wood: 57, stone: 19, gold: 0 });
    expect(buildingTime('farm', 1)).toBe(5);
    expect(buildingTime('farm', 2)).toBe(13);
  });

  it('construir cobra o custo e termina após o tempo', () => {
    const s = createInitialState();
    const c = playerCastle(s);
    const before = { ...c.resources };
    expect(upgradeBuilding(s, 'farm').ok).toBe(true);
    expect(c.resources.wood).toBe(before.wood - 30);
    expect(c.resources.stone).toBe(before.stone - 10);
    expect(c.buildQueue?.building).toBe('farm');
    tick(s, 4);
    expect(c.buildings.farm).toBe(0);
    tick(s, 1);
    expect(c.buildings.farm).toBe(1);
    expect(c.buildQueue).toBeNull();
  });

  it('só uma construção por vez e nunca acima do nível 5', () => {
    const s = createInitialState();
    const c = playerCastle(s);
    expect(upgradeBuilding(s, 'farm').ok).toBe(true);
    expect(upgradeBuilding(s, 'sawmill')).toEqual({ ok: false, reason: 'Construtores ocupados' });
    c.buildQueue = null;
    c.buildings.farm = MAX_LEVEL;
    expect(canUpgrade(c, 'farm')).toEqual({ ok: false, reason: 'Nível máximo' });
  });

  it('recusa quando faltam recursos', () => {
    const s = createInitialState();
    playerCastle(s).resources.stone = 0;
    expect(upgradeBuilding(s, 'wall')).toEqual({ ok: false, reason: 'Recursos insuficientes' });
  });
});

describe('treino de tropas', () => {
  it('exige quartel e o nível certo para cada tropa', () => {
    const s = createInitialState();
    const c = playerCastle(s);
    expect(trainUnits(s, 'spearman', 1).ok).toBe(false);
    c.buildings.barracks = 1;
    expect(trainUnits(s, 'archer', 1).ok).toBe(false);
    expect(trainUnits(s, 'spearman', 2).ok).toBe(true);
    tick(s, 8);
    expect(c.troops.spearman).toBe(2);
  });

  it('respeita o limite de tropas do quartel', () => {
    const s = createInitialState();
    const c = playerCastle(s);
    c.buildings.barracks = 1;
    c.resources = { food: 5000, wood: 5000, stone: 5000, gold: 5000 };
    expect(trainUnits(s, 'spearman', troopCapacity(c) + 1).ok).toBe(false);
    expect(trainUnits(s, 'spearman', troopCapacity(c)).ok).toBe(true);
  });
});
