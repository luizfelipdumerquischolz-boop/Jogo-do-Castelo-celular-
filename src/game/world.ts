import { carryCapacity, armySize, resolveBattle } from './combat';
import {
  BANDIT_REBUILD_SECONDS,
  CASTLE_BASE_DEFENSE,
  INVADER_CAMP_REBUILD_SECONDS,
  MARCH_SECONDS_PER_TILE,
  MAX_EVENTS,
  MAX_REPORTS,
  RESOURCE_IDS,
  UNIT_IDS,
  WALL_BONUS_BY_LEVEL,
  emptyArmy,
  emptyResources,
} from './config';
import { addResources, protectedFraction } from './economy';
import { PLAYER_ID, banditGarrison, banditLoot, getFortress, invaderCampGarrison, invaderCampLoot } from './state';
import type { Army, BattleReport, Fortress, GameEvent, GameState, March, Resources } from './types';

export function pushEvent(state: GameState, text: string, kind: GameEvent['kind'] = 'info'): void {
  state.events.push({ id: state.nextId++, time: state.time, text, kind });
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
}

export function distance(a: Fortress, b: Fortress): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function marchTime(a: Fortress, b: Fortress): number {
  return Math.max(MARCH_SECONDS_PER_TILE, Math.round(distance(a, b) * MARCH_SECONDS_PER_TILE));
}

/** Tropas que estão em casa e podem lutar/defender. */
export function homeArmy(f: Fortress): Army {
  return f.castle ? f.castle.troops : f.troops;
}

export function wallBonusOf(f: Fortress): number {
  if (f.castle) return WALL_BONUS_BY_LEVEL[f.castle.buildings.wall];
  if (f.faction === 'bandit') return 0.1 * f.level;
  if (f.faction === 'invader') return 0.3;
  return 0;
}

export function baseDefenseOf(f: Fortress): number {
  if (f.castle) return CASTLE_BASE_DEFENSE;
  if (f.rebuildIn > 0) return 0;
  if (f.faction === 'bandit') return 5 * f.level;
  return 20;
}

export function isAttackable(f: Fortress): boolean {
  return f.faction !== 'player' && f.rebuildIn <= 0;
}

/** Envia um exército de `from` até `target`. As tropas saem de casa imediatamente. */
export function launchMarch(state: GameState, from: Fortress, target: Fortress, troops: Army): March {
  const home = homeArmy(from);
  for (const u of UNIT_IDS) {
    if (troops[u] > home[u]) throw new Error('Tropas insuficientes');
  }
  for (const u of UNIT_IDS) home[u] -= troops[u];
  const t = marchTime(from, target);
  const march: March = {
    id: state.nextId++,
    kind: 'attack',
    ownerId: from.id,
    fromId: from.id,
    targetId: target.id,
    troops: { ...troops },
    loot: emptyResources(),
    remaining: t,
    total: t,
  };
  state.marches.push(march);
  from.stats.attacksLaunched++;
  if (target.id === PLAYER_ID) from.stats.attacksOnPlayer++;
  return march;
}

/** Quantas tropas de `ownerId` estão fora de casa, em marcha. */
export function troopsAway(state: GameState, ownerId: string): number {
  return state.marches
    .filter((m) => m.ownerId === ownerId && !m.waveNumber)
    .reduce((s, m) => s + armySize(m.troops), 0);
}

/** Recursos que podem ser saqueados de uma fortaleza. */
function lootable(f: Fortress): Resources {
  const out = emptyResources();
  if (f.castle) {
    const keep = protectedFraction(f.castle);
    for (const r of RESOURCE_IDS) out[r] = Math.max(0, Math.floor(f.castle.resources[r] * (1 - keep)));
  } else {
    for (const r of RESOURCE_IDS) out[r] = Math.floor(f.loot[r]);
  }
  return out;
}

/** Divide a capacidade de carga proporcionalmente entre os recursos disponíveis. */
export function takeLoot(available: Resources, capacity: number): Resources {
  const total = RESOURCE_IDS.reduce((s, r) => s + available[r], 0);
  const taken = emptyResources();
  if (total <= 0 || capacity <= 0) return taken;
  const ratio = Math.min(1, capacity / total);
  for (const r of RESOURCE_IDS) taken[r] = Math.floor(available[r] * ratio);
  return taken;
}

function attackerName(state: GameState, march: March): string {
  if (march.waveNumber) return `Horda Invasora (onda ${march.waveNumber})`;
  return getFortress(state, march.ownerId).name;
}

function resolveArrival(state: GameState, march: March): void {
  const target = getFortress(state, march.targetId);
  const defenderArmy = { ...homeArmy(target) };
  const wall = wallBonusOf(target);
  const outcome = resolveBattle(march.troops, defenderArmy, wall, baseDefenseOf(target));

  // Atualiza a guarnição do defensor.
  const home = homeArmy(target);
  for (const u of UNIT_IDS) home[u] = outcome.defenderSurvivors[u];

  let loot = emptyResources();
  if (outcome.attackerWon) {
    loot = takeLoot(lootable(target), carryCapacity(outcome.attackerSurvivors));
    if (target.castle) {
      for (const r of RESOURCE_IDS) target.castle.resources[r] -= loot[r];
    } else {
      for (const r of RESOURCE_IDS) target.loot[r] -= loot[r];
    }
    if (target.faction === 'bandit') {
      target.rebuildIn = BANDIT_REBUILD_SECONDS;
      target.troops = emptyArmy();
      target.loot = emptyResources();
    }
    if (target.faction === 'invader') {
      // Derrotar um acampamento invasor atrasa a próxima onda e o deixa vazio por um tempo.
      state.invaders.nextWaveIn += 180;
      target.rebuildIn = INVADER_CAMP_REBUILD_SECONDS;
      target.troops = emptyArmy();
      target.loot = emptyResources();
    }
  }

  const owner = march.waveNumber ? null : getFortress(state, march.ownerId);
  if (owner) {
    if (outcome.attackerWon) owner.stats.wins++;
    else owner.stats.losses++;
  }

  const name = attackerName(state, march);
  const involvesPlayer = march.ownerId === PLAYER_ID || target.id === PLAYER_ID;
  if (involvesPlayer) {
    const report: BattleReport = {
      id: state.nextId++,
      time: state.time,
      attackerId: march.ownerId,
      attackerName: name,
      defenderId: target.id,
      defenderName: target.name,
      attackerArmy: { ...march.troops },
      defenderArmy,
      attackerLosses: outcome.attackerLosses,
      defenderLosses: outcome.defenderLosses,
      attackPower: outcome.attackPower,
      defensePower: outcome.defensePower,
      wallBonus: wall,
      attackerWon: outcome.attackerWon,
      loot,
      waveNumber: march.waveNumber,
      read: false,
    };
    state.reports.unshift(report);
    if (state.reports.length > MAX_REPORTS) state.reports.length = MAX_REPORTS;
    const playerWon = (march.ownerId === PLAYER_ID) === outcome.attackerWon;
    const text =
      march.ownerId === PLAYER_ID
        ? `${playerWon ? 'Vitória' : 'Derrota'} no ataque a ${target.name}.`
        : `${name} atacou seu castelo: ${playerWon ? 'defesa vitoriosa!' : 'suas defesas caíram.'}`;
    pushEvent(state, text, playerWon ? 'good' : 'bad');
  } else if (target.faction === 'lord' && owner) {
    pushEvent(state, `${owner.name} atacou ${target.name} e ${outcome.attackerWon ? 'venceu' : 'foi repelido'}.`);
  }

  // Sobreviventes voltam para casa com o saque (ondas invasoras se dispersam).
  if (owner && armySize(outcome.attackerSurvivors) > 0) {
    state.marches.push({
      id: state.nextId++,
      kind: 'return',
      ownerId: owner.id,
      fromId: target.id,
      targetId: owner.id,
      troops: outcome.attackerSurvivors,
      loot,
      remaining: march.total,
      total: march.total,
    });
  }
}

function resolveReturn(state: GameState, march: March): void {
  const owner = getFortress(state, march.ownerId);
  const home = homeArmy(owner);
  for (const u of UNIT_IDS) home[u] += march.troops[u];
  if (owner.castle) addResources(owner.castle, march.loot);
  if (owner.id === PLAYER_ID) {
    const total = RESOURCE_IDS.reduce((s, r) => s + march.loot[r], 0);
    pushEvent(state, `Suas tropas voltaram${total > 0 ? ` com ${total} recursos de saque` : ''}.`, 'good');
  }
}

export function tickMarches(state: GameState, dt: number): void {
  const arrived: March[] = [];
  for (const m of state.marches) {
    m.remaining -= dt;
    if (m.remaining <= 1e-9) arrived.push(m);
  }
  if (arrived.length === 0) return;
  state.marches = state.marches.filter((m) => !arrived.includes(m));
  for (const m of arrived) {
    if (m.kind === 'attack') resolveArrival(state, m);
    else resolveReturn(state, m);
  }
}

/** Bandidos e acampamentos invasores se reerguem algum tempo depois de destruídos. */
export function tickCamps(state: GameState, dt: number): void {
  for (const f of state.fortresses) {
    if (f.faction === 'bandit' && f.rebuildIn > 0) {
      f.rebuildIn = Math.max(0, f.rebuildIn - dt);
      if (f.rebuildIn === 0) {
        f.troops = banditGarrison(f.level);
        f.loot = banditLoot(f.level);
        pushEvent(state, `${f.name} foi reconstruído pelos bandidos.`);
      }
    } else if (f.faction === 'bandit') {
      // Saque se acumula devagar enquanto o acampamento está de pé.
      const max = banditLoot(f.level);
      for (const r of RESOURCE_IDS) f.loot[r] = Math.min(max[r] * 1.5, f.loot[r] + (max[r] / 600) * dt);
    } else if (f.faction === 'invader' && f.rebuildIn > 0) {
      f.rebuildIn = Math.max(0, f.rebuildIn - dt);
      if (f.rebuildIn === 0) {
        f.troops = invaderCampGarrison();
        f.loot = invaderCampLoot();
        pushEvent(state, `${f.name} voltou a ser ocupado pela horda.`, 'bad');
      }
    }
  }
}
