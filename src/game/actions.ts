import { armySize } from './combat';
import { UNIT_IDS } from './config';
import { type ActionResult, startTraining, startUpgrade } from './economy';
import { PLAYER_ID, getFortress, getPlayer, playerCastle } from './state';
import type { Army, BuildingId, GameState, UnitId } from './types';
import { isAttackable, launchMarch, troopsAway } from './world';

/** Ações do jogador. Todas validam e retornam um ActionResult em vez de lançar erro. */

export function upgradeBuilding(state: GameState, id: BuildingId): ActionResult {
  return startUpgrade(playerCastle(state), id);
}

export function trainUnits(state: GameState, unit: UnitId, count: number): ActionResult {
  return startTraining(playerCastle(state), unit, Math.floor(count), troopsAway(state, PLAYER_ID));
}

export function sendAttack(state: GameState, targetId: string, troops: Army): ActionResult {
  if (targetId === PLAYER_ID) return { ok: false, reason: 'Alvo inválido' };
  const target = state.fortresses.find((f) => f.id === targetId);
  if (!target) return { ok: false, reason: 'Alvo inválido' };
  if (!isAttackable(target)) return { ok: false, reason: 'Este lugar está em ruínas' };
  const player = getPlayer(state);
  const home = player.castle!.troops;
  const army = { spearman: 0, archer: 0, cavalry: 0 };
  for (const u of UNIT_IDS) army[u] = Math.max(0, Math.floor(troops[u] ?? 0));
  if (armySize(army) <= 0) return { ok: false, reason: 'Escolha ao menos uma tropa' };
  if (UNIT_IDS.some((u) => army[u] > home[u])) return { ok: false, reason: 'Tropas insuficientes' };
  launchMarch(state, player, getFortress(state, targetId), army);
  return { ok: true };
}

export function markReportsRead(state: GameState): void {
  for (const r of state.reports) r.read = true;
}
