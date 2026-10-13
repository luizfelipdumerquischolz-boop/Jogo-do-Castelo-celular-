import { describe, expect, it } from 'vitest';
import { BUILDING_IDS, PLAYER_ID, createInitialState, lords, serialize, tick } from '../src/game';

describe('simulação de 2 horas', () => {
  it('roda 2h de jogo sem erros, com senhores evoluindo e atacando o jogador', () => {
    const s = createInitialState(2024);
    const startLevels = new Map(lords(s).map((l) => [l.id, l.level]));
    const startBuildings = new Map(lords(s).map((l) => [l.id, BUILDING_IDS.reduce((n, b) => n + l.castle!.buildings[b], 0)]));

    // Passos de 0,25 s imitam os quadros da interface.
    for (let i = 0; i < 2 * 60 * 60 * 4; i++) tick(s, 0.25);

    expect(s.time).toBeCloseTo(7200, 6);
    for (const f of s.fortresses) {
      if (!f.castle) continue;
      for (const v of Object.values(f.castle.resources)) expect(Number.isFinite(v) && v >= 0).toBe(true);
      for (const v of Object.values(f.castle.troops)) expect(Number.isInteger(v) && v >= 0).toBe(true);
    }
    expect(() => JSON.parse(serialize(s))).not.toThrow();

    const evolved = lords(s).filter(
      (l) =>
        l.level > startLevels.get(l.id)! &&
        BUILDING_IDS.reduce((n, b) => n + l.castle!.buildings[b], 0) > startBuildings.get(l.id)!,
    );
    const raiders = evolved.filter((l) => s.reports.some((r) => r.attackerId === l.id && r.defenderId === PLAYER_ID));
    const attacksOnPlayer = lords(s).reduce((n, l) => n + l.stats.attacksOnPlayer, 0);

    console.log(
      lords(s)
        .map((l) => `${l.name}: nível ${startLevels.get(l.id)} → ${l.level}, ataques ao jogador ${l.stats.attacksOnPlayer}, outros ataques ${l.stats.attacksLaunched - l.stats.attacksOnPlayer}`)
        .join('\n') + `\nOndas de invasores: ${s.invaders.wave}`,
    );

    expect(evolved.length).toBeGreaterThanOrEqual(1);
    expect(raiders.length).toBeGreaterThanOrEqual(1);
    expect(attacksOnPlayer).toBeGreaterThan(0);
    expect(s.invaders.wave).toBeGreaterThan(5);
  });

  it('tick é independente da taxa de quadros (passos de até 1 s)', () => {
    const a = createInitialState(9);
    const b = createInitialState(9);
    tick(a, 300);
    for (let i = 0; i < 300; i++) tick(b, 1);
    expect(serialize(a)).toBe(serialize(b));
  });
});
