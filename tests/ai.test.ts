import { describe, expect, it } from 'vitest';
import {
  BANDIT_REBUILD_SECONDS,
  BUILDING_IDS,
  PLAYER_ID,
  PLAYER_PROTECTION_SECONDS,
  createInitialState,
  getFortress,
  invaderWaveArmy,
  lordThink,
  lords,
  playerCastle,
  sendAttack,
  tick,
  type Fortress,
  type GameState,
} from '../src/game';

const levels = (f: Fortress) => BUILDING_IDS.reduce((s, b) => s + f.castle!.buildings[b], 0);
const size = (a: { spearman: number; archer: number; cavalry: number }) => a.spearman + a.archer + a.cavalry;

describe('mapa e facções', () => {
  it('tem o jogador e pelo menos 8 fortalezas inimigas nas 3 facções', () => {
    const s = createInitialState();
    const enemies = s.fortresses.filter((f) => f.id !== PLAYER_ID);
    expect(enemies.length).toBeGreaterThanOrEqual(8);
    expect(new Set(enemies.map((f) => f.faction))).toEqual(new Set(['bandit', 'lord', 'invader']));
    const spots = new Set(s.fortresses.map((f) => `${f.x},${f.y}`));
    expect(spots.size).toBe(s.fortresses.length);
  });
});

describe('senhores rivais', () => {
  it('constroem e treinam como o jogador', () => {
    const s = createInitialState();
    const lord = lords(s)[0];
    const startLevels = levels(lord);
    const startTroops = size(lord.castle!.troops);
    tick(s, 600);
    expect(levels(lord)).toBeGreaterThan(startLevels);
    expect(size(lord.castle!.troops) + s.marches.filter((m) => m.ownerId === lord.id).length).toBeGreaterThan(startTroops);
    expect(lord.level).toBeGreaterThan(1);
  });

  it('atacam o jogador quando ficam mais fortes, nunca durante a proteção inicial', () => {
    const s = createInitialState();
    const lord = lords(s)[0];
    lord.castle!.troops = { spearman: 40, archer: 30, cavalry: 10 };
    lordThink(s, lord);
    expect(s.marches.some((m) => m.targetId === PLAYER_ID)).toBe(false);

    s.time = PLAYER_PROTECTION_SECONDS;
    lord.attackCooldown = 0;
    lordThink(s, lord);
    const march = s.marches.find((m) => m.ownerId === lord.id && m.targetId === PLAYER_ID);
    expect(march).toBeDefined();
    tick(s, march!.total);
    const report = s.reports.find((r) => r.attackerId === lord.id);
    expect(report?.defenderId).toBe(PLAYER_ID);
    expect(report?.attackerWon).toBe(true);
  });

  it('não atacam um jogador bem defendido', () => {
    const s = createInitialState();
    s.time = PLAYER_PROTECTION_SECONDS;
    const c = playerCastle(s);
    c.buildings.wall = 5;
    c.troops = { spearman: 60, archer: 40, cavalry: 10 };
    const lord = lords(s)[0];
    lord.castle!.troops = { spearman: 20, archer: 10, cavalry: 5 };
    lordThink(s, lord);
    expect(s.marches.some((m) => m.targetId === PLAYER_ID)).toBe(false);
  });

  it('atacam uns aos outros', () => {
    const s = createInitialState();
    tick(s, 3600);
    const lordIds = new Set(lords(s).map((l) => l.id));
    const fights = s.events.filter((e) => /atacou (Lorde|Dama|Barão)/.test(e.text));
    const total = lords(s).reduce((n, l) => n + l.stats.attacksLaunched - l.stats.attacksOnPlayer, 0);
    expect(lordIds.size).toBe(3);
    expect(total).toBeGreaterThan(0);
    expect(fights.length).toBeGreaterThan(0);
  });
});

describe('bandidos', () => {
  function raid(s: GameState, id: string) {
    const c = playerCastle(s);
    c.troops = { spearman: 30, archer: 30, cavalry: 0 };
    expect(sendAttack(s, id, c.troops).ok).toBe(true);
  }

  it('podem ser saqueados e se reconstroem com o tempo', () => {
    const s = createInitialState();
    const camp = getFortress(s, 'bandit-ratos');
    const before = { ...playerCastle(s).resources };
    raid(s, camp.id);
    const m = s.marches[0];
    tick(s, m.total);
    expect(s.reports[0].attackerWon).toBe(true);
    expect(camp.rebuildIn).toBe(BANDIT_REBUILD_SECONDS);
    expect(size(camp.troops)).toBe(0);
    expect(sendAttack(s, camp.id, { spearman: 1, archer: 0, cavalry: 0 }).ok).toBe(false);
    tick(s, m.total); // tropas voltam com o saque
    expect(playerCastle(s).resources.gold).toBeGreaterThan(before.gold + s.reports[0].loot.gold - 1);
    expect(s.reports[0].loot.gold).toBeGreaterThan(0);
    tick(s, BANDIT_REBUILD_SECONDS);
    expect(camp.rebuildIn).toBe(0);
    expect(size(camp.troops)).toBeGreaterThan(0);
  });
});

describe('invasores', () => {
  it('cada onda é mais forte que a anterior', () => {
    for (let w = 2; w <= 12; w++) expect(size(invaderWaveArmy(w))).toBeGreaterThan(size(invaderWaveArmy(w - 1)));
  });

  it('chegam periodicamente ao castelo do jogador', () => {
    const s = createInitialState();
    tick(s, 2400);
    const waves = s.reports.filter((r) => r.waveNumber).map((r) => r.waveNumber!);
    expect(waves.length).toBeGreaterThanOrEqual(3);
    expect(waves).toEqual([...waves].sort((a, b) => b - a)); // mais recentes primeiro
    const first = s.reports.find((r) => r.waveNumber === 1)!;
    const third = s.reports.find((r) => r.waveNumber === 3)!;
    expect(size(third.attackerArmy)).toBeGreaterThan(size(first.attackerArmy));
  });
});
