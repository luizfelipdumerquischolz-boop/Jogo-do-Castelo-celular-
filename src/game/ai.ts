import { armySize, attackPower, defensePower } from './combat';
import {
  BUILDING_IDS,
  INVADER_BASE_WAVE,
  INVADER_WAVE_GROWTH,
  INVADER_WAVE_INTERVAL,
  LORD_ATTACK_COOLDOWN,
  LORD_THINK_INTERVAL,
  PLAYER_RAID_GAP,
  MAX_LEVEL,
  RESOURCE_IDS,
  UNITS,
  UNIT_IDS,
  emptyArmy,
  emptyResources,
} from './config';
import {
  buildingCost,
  canTrain,
  canUpgrade,
  maxAffordable,
  startTraining,
  startUpgrade,
  storageCapacity,
  troopCapacity,
  troopsCommitted,
} from './economy';
import { PLAYER_ID, getFortress, getPlayer, lords } from './state';
import type { Army, BuildingId, Fortress, GameState, LordPersonality, UnitId } from './types';
import { baseDefenseOf, homeArmy, isAttackable, launchMarch, marchTime, pushEvent, troopsAway, wallBonusOf } from './world';

/** Senhores não atacam o jogador nos primeiros 15 minutos (proteção de novato). */
export const PLAYER_PROTECTION_SECONDS = 900;
/** Bandidos são alvos fáceis: os senhores só os atacam com folga. */
export const ATTACK_MARGIN_CAMP = 1.5;
/** Senhores aceitam correr mais risco contra rivais do que contra o jogador. */
export const RIVAL_MARGIN_DISCOUNT = 0.3;

const DEFAULT_PERSONALITY: LordPersonality = { title: '', guard: 0.3, margin: 1.25, buildBias: {}, trainBatch: 4 };

function personality(f: Fortress): LordPersonality {
  return f.personality ?? DEFAULT_PERSONALITY;
}

/** Peso de prioridade: quanto menor, mais cedo o senhor sobe esse edifício. */
const BUILD_WEIGHT: Record<BuildingId, number> = {
  farm: 0,
  sawmill: 0,
  quarry: 0.3,
  barracks: 0.6,
  storehouse: 0.8,
  wall: 1.1,
};

export function lordLevel(f: Fortress): number {
  if (!f.castle) return f.level;
  const total = BUILDING_IDS.reduce((s, b) => s + f.castle!.buildings[b], 0);
  return 1 + Math.floor(total / 4);
}

/** Pontuação de força usada no mapa: poder militar + desenvolvimento. */
export function strengthScore(f: Fortress): number {
  const army = homeArmy(f);
  const military = UNIT_IDS.reduce((s, u) => s + army[u] * (UNITS[u].attack + UNITS[u].defense) / 2, 0);
  const dev = f.castle ? BUILDING_IDS.reduce((s, b) => s + f.castle!.buildings[b], 0) * 10 : 0;
  return Math.round(military + dev);
}

function chooseBuilding(f: Fortress): BuildingId | null {
  const c = f.castle!;
  const bias = personality(f).buildBias;
  const score = (b: BuildingId) => c.buildings[b] + BUILD_WEIGHT[b] + (bias[b] ?? 0);
  const candidates = BUILDING_IDS.filter((b) => c.buildings[b] < MAX_LEVEL).sort((a, b) => score(a) - score(b));
  const pick = candidates[0];
  if (!pick) return null;
  const cost = buildingCost(pick, c.buildings[pick] + 1);
  const cap = storageCapacity(c);
  if (RESOURCE_IDS.some((r) => cost[r] > cap) && c.buildings.storehouse < MAX_LEVEL) return 'storehouse';
  return pick;
}

function lordBuild(f: Fortress): void {
  const c = f.castle!;
  if (c.buildQueue) return;
  const pick = chooseBuilding(f);
  if (!pick) return;
  if (canUpgrade(c, pick).ok) {
    startUpgrade(c, pick);
  }
}

/** Escolhe a unidade que mais falta para manter uma mistura equilibrada. */
function chooseUnit(f: Fortress): UnitId {
  const c = f.castle!;
  const army = c.troops;
  const desired: Record<UnitId, number> = { spearman: 0.45, archer: 0.35, cavalry: 0.2 };
  const available = UNIT_IDS.filter((u) => c.buildings.barracks >= UNITS[u].barracksLevel);
  const total = armySize(army) + 1;
  let best = available[0];
  let bestGap = -Infinity;
  for (const u of available) {
    const gap = desired[u] - army[u] / total;
    if (gap > bestGap) {
      bestGap = gap;
      best = u;
    }
  }
  return best;
}

function lordTrain(state: GameState, f: Fortress): void {
  const c = f.castle!;
  if (c.buildings.barracks < 1 || c.trainQueue.length > 0) return;
  // Guarda recursos para a próxima construção e treina com o excedente.
  const next = chooseBuilding(f);
  const reserve = next ? buildingCost(next, c.buildings[next] + 1) : emptyResources();
  const unit = chooseUnit(f);
  const spare = {
    ...c,
    resources: {
      food: Math.max(0, c.resources.food - reserve.food),
      wood: Math.max(0, c.resources.wood - reserve.wood),
      stone: Math.max(0, c.resources.stone - reserve.stone),
      gold: Math.max(0, c.resources.gold - reserve.gold),
    },
  };
  const away = troopsAway(state, f.id);
  const room = troopCapacity(c) - troopsCommitted(c, away);
  const n = Math.min(personality(f).trainBatch, room, maxAffordable(spare, unit));
  if (n > 0 && canTrain(c, unit, n, away).ok) startTraining(c, unit, n, away);
}

function expeditionArmy(f: Fortress): Army {
  const home = homeArmy(f);
  const out = emptyArmy();
  const guard = personality(f).guard;
  for (const u of UNIT_IDS) out[u] = Math.floor(home[u] * (1 - guard));
  return out;
}

/** O senhor tem informação exata da defesa do alvo (a IA "espiona" perfeitamente). */
export function estimateDefense(target: Fortress, against: Army): number {
  return defensePower(homeArmy(target), against, wallBonusOf(target), baseDefenseOf(target));
}

function lordAttack(state: GameState, f: Fortress): void {
  if (f.attackCooldown > 0) return;
  const army = expeditionArmy(f);
  if (armySize(army) < 3) return;
  const power = (target: Fortress) => attackPower(army, homeArmy(target));
  const ratio = (target: Fortress) => power(target) / Math.max(1, estimateDefense(target, army));

  const margin = personality(f).margin;
  let target: Fortress | null = null;
  const player = getPlayer(state);
  if (state.time >= PLAYER_PROTECTION_SECONDS && state.raidCooldown <= 0 && ratio(player) >= margin) {
    target = player;
  } else {
    // Rivais: ataca o senhor mais vulnerável (maior vantagem), não só o mais próximo.
    const rivals = lords(state)
      .filter((l) => l.id !== f.id && ratio(l) >= margin - RIVAL_MARGIN_DISCOUNT)
      .sort((a, b) => ratio(b) - ratio(a));
    const camps = state.fortresses.filter(
      (x) => x.faction === 'bandit' && isAttackable(x) && ratio(x) >= ATTACK_MARGIN_CAMP,
    );
    const byDistance = (a: Fortress, b: Fortress) => marchTime(f, a) - marchTime(f, b);
    target = rivals[0] ?? camps.sort(byDistance)[0] ?? null;
  }
  if (!target) return;

  launchFromLord(state, f, target, army);
}

function launchFromLord(state: GameState, f: Fortress, target: Fortress, army: Army): void {
  const march = launchMarch(state, f, target, army);
  f.attackCooldown = LORD_ATTACK_COOLDOWN;
  if (target.id === PLAYER_ID) {
    // Depois de atacar o jogador, o senhor descansa mais e dá vez aos outros.
    f.attackCooldown = LORD_ATTACK_COOLDOWN * 2;
    state.raidCooldown = PLAYER_RAID_GAP;
    pushEvent(state, `${f.name} marcha contra o seu castelo! Chegada em ${march.total}s.`, 'bad');
  }
}

/** Uma "rodada de pensamento" de um senhor rival: construir, treinar e talvez atacar. */
export function lordThink(state: GameState, f: Fortress): void {
  lordBuild(f);
  lordTrain(state, f);
  lordAttack(state, f);
}

export function tickLord(state: GameState, f: Fortress, dt: number): void {
  const before = f.level;
  f.level = lordLevel(f);
  if (f.level > before) {
    pushEvent(state, `${f.name} fortaleceu seus domínios e agora é nível ${f.level}.`);
  }
  f.attackCooldown = Math.max(0, f.attackCooldown - dt);
  f.thinkIn -= dt;
  if (f.thinkIn <= 0) {
    f.thinkIn += LORD_THINK_INTERVAL;
    lordThink(state, f);
  }
}

export function invaderWaveArmy(wave: number): Army {
  const factor = Math.pow(INVADER_WAVE_GROWTH, wave - 1);
  const out = emptyArmy();
  for (const u of UNIT_IDS) out[u] = Math.round(INVADER_BASE_WAVE[u] * factor);
  return out;
}

export function tickInvaders(state: GameState, dt: number): void {
  state.raidCooldown = Math.max(0, state.raidCooldown - dt);
  state.invaders.nextWaveIn -= dt;
  if (state.invaders.nextWaveIn > 0) return;
  state.invaders.wave += 1;
  state.invaders.nextWaveIn += INVADER_WAVE_INTERVAL;
  const wave = state.invaders.wave;
  const camps = state.fortresses.filter((f) => f.faction === 'invader');
  const occupied = camps.filter((c) => c.rebuildIn <= 0);
  const source = (occupied.length ? occupied : camps)[(wave - 1) % (occupied.length || camps.length)];
  const player = getFortress(state, PLAYER_ID);
  const t = marchTime(source, player);
  state.marches.push({
    id: state.nextId++,
    kind: 'attack',
    ownerId: source.id,
    fromId: source.id,
    targetId: PLAYER_ID,
    troops: invaderWaveArmy(wave),
    loot: emptyResources(),
    remaining: t,
    total: t,
    waveNumber: wave,
  });
  pushEvent(state, `Onda ${wave} da horda invasora partiu de ${source.name}! Chegada em ${t}s.`, 'bad');
}
