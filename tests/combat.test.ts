import { describe, expect, it } from 'vitest';
import { attackPower, matchup, resolveBattle, takeLoot } from '../src/game';

const army = (spearman: number, archer: number, cavalry: number) => ({ spearman, archer, cavalry });

describe('pedra-papel-tesoura', () => {
  it('lanceiro > cavaleiro > arqueiro > lanceiro', () => {
    expect(matchup('spearman', 'cavalry')).toBeGreaterThan(1);
    expect(matchup('cavalry', 'archer')).toBeGreaterThan(1);
    expect(matchup('archer', 'spearman')).toBeGreaterThan(1);
    expect(matchup('cavalry', 'spearman')).toBeLessThan(1);
    expect(matchup('archer', 'cavalry')).toBeLessThan(1);
    expect(matchup('spearman', 'archer')).toBeLessThan(1);
    expect(matchup('archer', 'archer')).toBe(1);
  });

  it('a mesma tropa rende mais contra o tipo que vence', () => {
    expect(attackPower(army(0, 10, 0), army(10, 0, 0))).toBeGreaterThan(attackPower(army(0, 10, 0), army(0, 0, 10)));
  });

  it('10 lanceiros vencem 10 cavaleiros na defesa', () => {
    const r = resolveBattle(army(0, 0, 10), army(10, 0, 0), 0, 0);
    expect(r.attackerWon).toBe(false);
  });
});

describe('resolução de batalha', () => {
  it('é determinística', () => {
    const a = resolveBattle(army(12, 8, 5), army(10, 6, 2), 0.3, 25);
    const b = resolveBattle(army(12, 8, 5), army(10, 6, 2), 0.3, 25);
    expect(a).toEqual(b);
  });

  it('o perdedor perde tudo e o vencedor perde uma fração', () => {
    const r = resolveBattle(army(30, 20, 10), army(5, 2, 0), 0, 0);
    expect(r.attackerWon).toBe(true);
    expect(r.defenderSurvivors).toEqual(army(0, 0, 0));
    const lost = r.attackerLosses.spearman + r.attackerLosses.archer + r.attackerLosses.cavalry;
    expect(lost).toBeGreaterThan(0);
    expect(lost).toBeLessThan(60);
    // Perdas seguem (poderPerdedor/poderVencedor)^1.5
    const frac = Math.pow(r.defensePower / r.attackPower, 1.5);
    expect(r.attackerLosses.spearman).toBe(Math.ceil(30 * frac - 1e-9));
  });

  it('muralha transforma uma derrota em vitória da defesa', () => {
    const noWall = resolveBattle(army(20, 15, 0), army(8, 8, 0), 0, 0);
    const wall = resolveBattle(army(20, 15, 0), army(8, 8, 0), 1.0, 0);
    expect(noWall.attackerWon).toBe(true);
    expect(wall.attackerWon).toBe(false);
    expect(wall.defensePower).toBeCloseTo(noWall.defensePower * 2, -1);
  });

  it('empate favorece o defensor', () => {
    const r = resolveBattle(army(0, 0, 0), army(0, 0, 0), 0, 0);
    expect(r.attackerWon).toBe(false);
  });

  it('saque respeita a capacidade de carga', () => {
    const loot = takeLoot({ food: 100, wood: 100, stone: 100, gold: 100 }, 200);
    expect(loot).toEqual({ food: 50, wood: 50, stone: 50, gold: 50 });
    expect(takeLoot({ food: 10, wood: 0, stone: 0, gold: 0 }, 999)).toEqual({ food: 10, wood: 0, stone: 0, gold: 0 });
  });
});
