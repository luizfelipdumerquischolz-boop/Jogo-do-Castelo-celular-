import { ADVANTAGE, DISADVANTAGE, UNITS, UNIT_IDS, emptyArmy } from './config';
import type { Army, UnitId } from './types';

/** Multiplicador de uma unidade `a` lutando contra `b` (pedra-papel-tesoura). */
export function matchup(a: UnitId, b: UnitId): number {
  if (UNITS[a].strongAgainst === b) return ADVANTAGE;
  if (UNITS[b].strongAgainst === a) return DISADVANTAGE;
  return 1;
}

export function armySize(army: Army): number {
  return UNIT_IDS.reduce((s, u) => s + army[u], 0);
}

/** Fração de cada tipo no exército; se vazio, considera uma mistura neutra. */
function shares(army: Army): Record<UnitId, number> {
  const total = armySize(army);
  const out = { spearman: 0, archer: 0, cavalry: 0 } as Record<UnitId, number>;
  for (const u of UNIT_IDS) out[u] = total > 0 ? army[u] / total : 1 / UNIT_IDS.length;
  return out;
}

/** Poder de ataque de `army` contra a composição de `against`. */
export function attackPower(army: Army, against: Army): number {
  const s = shares(against);
  let p = 0;
  for (const u of UNIT_IDS) {
    if (army[u] <= 0) continue;
    let m = 0;
    for (const d of UNIT_IDS) m += s[d] * matchup(u, d);
    p += army[u] * UNITS[u].attack * m;
  }
  return p;
}

/** Poder de defesa de `army` (+ milícia) contra a composição de `against`, já com a muralha. */
export function defensePower(army: Army, against: Army, wallBonus: number, baseDefense: number): number {
  const s = shares(against);
  let p = baseDefense;
  for (const u of UNIT_IDS) {
    if (army[u] <= 0) continue;
    let m = 0;
    for (const a of UNIT_IDS) m += s[a] * matchup(u, a);
    p += army[u] * UNITS[u].defense * m;
  }
  return p * (1 + wallBonus);
}

export interface BattleOutcome {
  attackerWon: boolean;
  attackPower: number;
  defensePower: number;
  attackerLosses: Army;
  defenderLosses: Army;
  attackerSurvivors: Army;
  defenderSurvivors: Army;
}

function applyLossFraction(army: Army, fraction: number): { losses: Army; survivors: Army } {
  const losses = emptyArmy();
  const survivors = emptyArmy();
  for (const u of UNIT_IDS) {
    const lost = Math.max(0, Math.min(army[u], Math.ceil(army[u] * fraction - 1e-9)));
    losses[u] = lost;
    survivors[u] = army[u] - lost;
  }
  return { losses, survivors };
}

/**
 * Combate determinístico.
 * O lado com maior poder vence. O perdedor perde todas as tropas; o vencedor perde
 * uma fração (poderPerdedor / poderVencedor)^1.5. Empate favorece o defensor.
 */
export function resolveBattle(
  attacker: Army,
  defender: Army,
  wallBonus: number,
  baseDefense: number,
): BattleOutcome {
  const atk = attackPower(attacker, defender);
  const def = defensePower(defender, attacker, wallBonus, baseDefense);
  const attackerWon = atk > def;
  const winnerPower = Math.max(atk, def);
  const loserPower = Math.min(atk, def);
  const ratio = winnerPower > 0 ? loserPower / winnerPower : 1;
  const winnerLoss = Math.min(1, Math.pow(ratio, 1.5));

  const a = applyLossFraction(attacker, attackerWon ? winnerLoss : 1);
  const d = applyLossFraction(defender, attackerWon ? 1 : winnerLoss);
  return {
    attackerWon,
    attackPower: Math.round(atk),
    defensePower: Math.round(def),
    attackerLosses: a.losses,
    defenderLosses: d.losses,
    attackerSurvivors: a.survivors,
    defenderSurvivors: d.survivors,
  };
}

export function carryCapacity(army: Army): number {
  return UNIT_IDS.reduce((s, u) => s + army[u] * UNITS[u].carry, 0);
}
