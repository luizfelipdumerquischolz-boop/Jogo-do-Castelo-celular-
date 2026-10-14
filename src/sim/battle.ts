// Batalhas resolvidas segundo a segundo, por flancos, com cerco, muralhas e feridos.
// Tudo é determinístico: o mesmo estado sempre dá o mesmo resultado.
import { BALANCE } from './data/balance';
import { stockAdd, stockGet, type ItemId, type Stock } from './data/items';
import { UNITS, addTroops, matchup, troopCount, type Troops, type UnitId } from './data/units';
import { armySize, arrivalHooks, carryCapacity, fightingSize, garrisonArmy, nearestOwnSettlement, orderReturn, removeArmy } from './army';
import { addBuilding, banditGarrison } from './create';
import { armyById, heroById, markTerritoryDirty, settlementById } from './runtime';
import { dietEffects, garrisonOf, gridSizeFor, protectedShare, wallMaxHp, gateMaxHp } from './settlement';
import type { Army, Battle, BattleReport, GameState, Settlement } from './types';
import { MAX_REPORTS, addAdults, adults, isNight, isPlayer, killPeople, newId, population, pushEvent, relation, takeAdults } from './util';
import { BUILDINGS } from './data/buildings';

type Side = 'att' | 'def';
const FLANKS = [0, 1, 2] as const;

/** Partilha de cada classe em cada flanco (esquerdo, centro, direito) por formação. */
const FORMATION_SHARE: Record<string, Record<string, [number, number, number]>> = {
  balanced: { infantry: [0.25, 0.5, 0.25], ranged: [0.2, 0.6, 0.2], cavalry: [0.5, 0, 0.5] },
  strongFlanks: { infantry: [0.35, 0.3, 0.35], ranged: [0.3, 0.4, 0.3], cavalry: [0.5, 0, 0.5] },
  strongCenter: { infantry: [0.15, 0.7, 0.15], ranged: [0.1, 0.8, 0.1], cavalry: [0.25, 0.5, 0.25] },
};

export function sideArmies(state: GameState, b: Battle, side: Side): Army[] {
  return (side === 'att' ? b.attackers : b.defenders).map((id) => armyById(state, id)).filter((a): a is Army => !!a);
}

function sideTroops(armies: Army[]): Troops {
  const t: Troops = {};
  for (const a of armies) addTroops(t, a.troops);
  return t;
}

export function battleStrength(t: Troops): number {
  let s = 0;
  for (const k in t) {
    const u = UNITS[k as UnitId];
    if (u.cls === 'siege') continue;
    s += (t[k as UnitId] ?? 0) * (u.attack + u.defense) / 2;
  }
  return s;
}

function commanderMods(state: GameState, armies: Army[]): { att: number; def: number; siege: number; protect: number } {
  const m = { att: 1, def: 1, siege: 1, protect: 1 };
  for (const a of armies) {
    const h = heroById(state, a.commanderId);
    if (!h) continue;
    const lvl = 1 + h.level * 0.02;
    m.att = Math.max(m.att, lvl * (h.traits.includes('ousado') ? 1.1 : 1) * (h.traits.includes('general') ? 1.05 : 1));
    m.def = Math.max(m.def, lvl * (h.traits.includes('cauteloso') ? 1.1 : 1) * (h.traits.includes('general') ? 1.05 : 1));
    if (h.traits.includes('bom em cerco')) m.siege = 1.5;
    if (h.traits.includes('protetor')) m.protect = 0.85;
  }
  return m;
}

function sideMods(state: GameState, armies: Army[]): { power: number; toughness: number } {
  if (!armies.length) return { power: 1, toughness: 1 };
  const nation = state.nations[armies[0].nation];
  let p = 1;
  if (nation.research.done.includes('mil1')) p *= 1.1;
  if (nation.research.done.includes('mil3')) p *= 1.1;
  let xp = 0;
  let morale = 0;
  let n = 0;
  for (const a of armies) {
    const sz = armySize(a);
    xp += a.xp * sz;
    morale += a.morale * sz;
    n += sz;
  }
  if (n > 0) {
    xp /= n;
    morale /= n;
  }
  p *= 1 + 0.2 * xp;
  p *= 0.6 + 0.4 * (morale / 100);
  const home = settlementById(state, armies[0].homeId);
  if (home && home.kind !== 'camp' && home.kind !== 'tribal') p *= dietEffects(home).strength;
  if (nation.kind === 'horde' && state.nations.some((x) => x.emperor)) p *= 1.25;
  return { power: p, toughness: 1 + 0.15 * xp };
}

function flankTroops(t: Troops, formation: string): Troops[] {
  const shares = FORMATION_SHARE[formation] ?? FORMATION_SHARE.balanced;
  const out: Troops[] = [{}, {}, {}];
  for (const k in t) {
    const u = k as UnitId;
    const cls = UNITS[u].cls;
    if (cls === 'siege') continue;
    const n = t[u] ?? 0;
    const sh = shares[cls];
    for (const f of FLANKS) if (sh[f] > 0) out[f][u] = n * sh[f];
  }
  return out;
}

function avgMatchup(u: UnitId, against: Troops): number {
  let tot = 0;
  let m = 0;
  for (const k in against) {
    const n = against[k as UnitId] ?? 0;
    tot += n;
    m += n * matchup(u, k as UnitId);
  }
  return tot > 0 ? m / tot : 1;
}

function flankPower(attackers: Troops, defenders: Troops, mult: number, stakes: boolean): number {
  let p = 0;
  for (const k in attackers) {
    const u = k as UnitId;
    let a = (attackers[u] ?? 0) * UNITS[u].attack * avgMatchup(u, defenders);
    if (stakes && UNITS[u].cls === 'cavalry') a *= 0.7;
    p += a;
  }
  return p * mult;
}

export function startBattle(state: GameState, attackers: Army[], defenders: Army[], settlementId: number | null, x: number, y: number): Battle {
  const attT = sideTroops(attackers);
  const defT = sideTroops(defenders);
  const b: Battle = {
    id: newId(state),
    x,
    y,
    attackers: attackers.map((a) => a.id),
    defenders: defenders.map((a) => a.id),
    attackerNation: attackers[0].nation,
    defenderNation: defenders.length ? defenders[0].nation : -1,
    settlementId,
    elapsed: 0,
    startAttack: battleStrength(attT),
    startDefense: battleStrength(defT),
    night: isNight(state.time),
    attackerLosses: {},
    defenderLosses: {},
    climbed: 0,
    damage: {},
  };
  for (const a of [...attackers, ...defenders]) {
    a.battleId = b.id;
    a.path = [];
  }
  state.battles.push(b);
  return b;
}

export function startSiege(state: GameState, a: Army, s: Settlement): void {
  // Junta-se a um cerco já em andamento.
  const existing = state.battles.find((b) => b.settlementId === s.id);
  if (existing) {
    if (existing.attackerNation === a.nation) {
      existing.attackers.push(a.id);
      a.battleId = existing.id;
      return;
    }
  }
  const g = garrisonOf(state, s);
  const defenders: Army[] = g ? [g] : [];
  for (const o of state.armies) {
    if (o !== g && o.nation === s.nation && o.stationedAt == null && o.battleId == null && Math.hypot(o.x - s.x, o.y - s.y) < 1.5) defenders.push(o);
  }
  if (g) {
    g.morale = Math.max(30, s.morale);
    // Milícia: parte dos adultos pega em armas.
    if (s.kind !== 'camp' && state.nations[s.nation].kind !== 'bandit') {
      const n = takeAdults(s, Math.floor(adults(s) * 0.15));
      if (n > 0) addTroops(g.troops, { militia: n });
    }
  }
  // Armadilhas matam parte da primeira onda.
  if (s.defenses.pits) {
    for (const k in a.troops) {
      const u = k as UnitId;
      if (UNITS[u].cls === 'siege') continue;
      const d = Math.floor((a.troops[u] ?? 0) * 0.05);
      if (d > 0) addTroops(a.troops, { [u]: d }, -1);
    }
  }
  const b = startBattle(state, [a], defenders, s.id, s.x, s.y);
  const key = `sieges_${state.nations[a.nation].kind}_vs_${state.nations[s.nation].kind}`;
  state.stats[key] = (state.stats[key] ?? 0) + 1;
  if (s.kind === 'capital') state.stats.capitalSieges = (state.stats.capitalSieges ?? 0) + 1;
  const owner = state.nations[s.nation];
  if (isPlayer(state, s.nation)) {
    attackNoticeHook(state, s, `${state.nations[a.nation].name} ataca ${s.name} com cerca de ${fightingSize(a)} soldados!`);
  } else if (isPlayer(state, a.nation)) {
    pushEvent(state, `Suas tropas chegaram a ${s.name} (${owner.name}). O ataque começou.`, 'info', s.x, s.y);
  }
  void b;
}

export function startField(state: GameState, a: Army, enemy: Army): void {
  const attackers = [a];
  const defenders = [enemy];
  for (const o of state.armies) {
    if (o === a || o === enemy || o.stationedAt != null || o.battleId != null) continue;
    if (Math.hypot(o.x - a.x, o.y - a.y) > 1.5) continue;
    if (o.nation === a.nation) attackers.push(o);
    else if (o.nation === enemy.nation) defenders.push(o);
  }
  startBattle(state, attackers, defenders, null, (a.x + enemy.x) / 2, (a.y + enemy.y) / 2);
  if (isPlayer(state, a.nation) || isPlayer(state, enemy.nation)) {
    pushEvent(state, `Batalha em campo aberto: ${state.nations[a.nation].name} contra ${state.nations[enemy.nation].name}.`, 'info', a.x, a.y);
  }
}

export let attackNoticeHook = (state: GameState, s: Settlement, text: string): void => {
  pushEvent(state, text, 'bad', s.x, s.y);
};
export function setAttackNoticeHook(fn: typeof attackNoticeHook): void {
  attackNoticeHook = fn;
}

function applyLosses(_state: GameState, b: Battle, side: Side, armies: Army[], unitLosses: Record<string, number>, protect: number): number {
  let total = 0;
  const totals = sideTroops(armies);
  for (const k in unitLosses) {
    const u = k as UnitId;
    const key = `${side}:${u}`;
    const acc = (b.damage[key] ?? 0) + unitLosses[u] * protect;
    let whole = Math.floor(acc);
    b.damage[key] = acc - whole;
    const have = totals[u] ?? 0;
    whole = Math.min(whole, Math.floor(have));
    if (whole <= 0) continue;
    // Divide entre os exércitos proporcionalmente.
    let left = whole;
    for (const a of armies) {
      if (left <= 0) break;
      const n = a.troops[u] ?? 0;
      if (n <= 0) continue;
      const take = Math.min(n, Math.max(1, Math.round((whole * n) / have)), left);
      addTroops(a.troops, { [u]: take }, -1);
      left -= take;
    }
    const lost = whole - left;
    addTroops(side === 'att' ? b.attackerLosses : b.defenderLosses, { [u]: lost });
    total += lost;
  }
  return total;
}

function siegeWork(_state: GameState, _b: Battle, s: Settlement, att: Army[], dt: number, siegeMult: number): void {
  const d = s.defenses;
  const t = sideTroops(att);
  const rams = t.ram ?? 0;
  const cats = t.catapult ?? 0;
  if (rams > 0 && !d.moat) d.gateHp = Math.max(0, d.gateHp - rams * (UNITS.ram.siegeDamage?.gate ?? 0) * siegeMult * dt);
  if (cats > 0) {
    d.wallHp = Math.max(0, d.wallHp - cats * (UNITS.catapult.siegeDamage?.wall ?? 0) * siegeMult * dt);
    d.gateHp = Math.max(0, d.gateHp - cats * (UNITS.catapult.siegeDamage?.gate ?? 0) * siegeMult * dt);
  }
}

function tickBattle(state: GameState, b: Battle, dt: number): void {
  const att = sideArmies(state, b, 'att');
  const def = sideArmies(state, b, 'def');
  b.elapsed += dt;
  const attT = sideTroops(att);
  const defT = sideTroops(def);
  const attFight = troopCount(attT, false);
  const defFight = troopCount(defT, false);
  const s = b.settlementId != null ? settlementById(state, b.settlementId) : undefined;

  if (attFight <= 0 || (defFight <= 0 && (!s || true))) {
    endBattle(state, b, attFight > 0 ? 'att' : 'def');
    return;
  }

  const aMods = sideMods(state, att);
  const dMods = sideMods(state, def);
  const aCmd = commanderMods(state, att);
  const dCmd = commanderMods(state, def);
  let aPower = aMods.power * aCmd.att;
  let dPower = dMods.power * dCmd.def;
  if (b.night && b.elapsed < 30) {
    const watch = s ? s.buildings.some((x) => x.type === 'watchtower' && x.level > 0) : false;
    if (!watch) aPower *= 1 + BALANCE.nightAttackBonus;
  }

  // Muralhas.
  let wallMult = [1, 1, 1];
  let towerMult = 1;
  let bypass = 0;
  if (s) {
    const d = s.defenses;
    if (d.moat) aPower *= 0.9;
    siegeWork(state, b, s, att, dt, aCmd.siege);
    const ladders = attT.ladder ?? 0;
    const towersS = d.moat ? 0 : (attT.siegeTower ?? 0);
    const climbCap = ladders * BALANCE.ladderCarry + towersS * BALANCE.towerCarry;
    const inf = troopCount(attT, false);
    bypass = inf > 0 ? Math.min(1, climbCap / inf) : 0;
    const ladderShare = climbCap > 0 ? (ladders * BALANCE.ladderCarry) / climbCap : 0;
    if (bypass > 0) aPower *= 1 - (1 - BALANCE.ladderPenalty) * bypass * ladderShare;
    const wb = BALANCE.wallBonus[d.wallLevel] ?? 0;
    const wallUp = d.wallHp > 0 ? 1 : 0;
    const gateUp = d.gateHp > 0 ? 1 : 0;
    wallMult = [1 + wb * wallUp * (1 - bypass), 1 + wb * gateUp * (1 - bypass), 1 + wb * wallUp * (1 - bypass)];
    if (d.towers > 0 && wallUp) towerMult = 1 + BALANCE.towerBonus * Math.min(1, d.towers / Math.max(1, d.wallLevel * 2));
  }

  const aFlanks = flankTroops(attT, att[0]?.formation ?? 'balanced');
  const dFlanks = flankTroops(defT, def[0]?.formation ?? 'balanced');
  const nonEmpty = (fl: Troops[]) => FLANKS.filter((f) => troopCount(fl[f]) > 0);
  const aNon = nonEmpty(aFlanks);
  const dNon = nonEmpty(dFlanks);
  const targetFor = (f: number, other: number[]) => (other.includes(f) ? f : other.includes(1) ? 1 : other[0]);

  const dmgToDef: number[] = [0, 0, 0];
  const dmgToAtt: number[] = [0, 0, 0];
  for (const f of aNon) {
    const tf = targetFor(f, dNon);
    if (tf === undefined) continue;
    dmgToDef[tf] += flankPower(aFlanks[f], dFlanks[tf], aPower, !!s?.defenses.stakes);
  }
  for (const f of dNon) {
    const tf = targetFor(f, aNon);
    if (tf === undefined) continue;
    let p = flankPower(dFlanks[f], aFlanks[tf], dPower, false);
    // Arqueiros e besteiros nas torres.
    if (towerMult > 1) {
      let ranged = 0;
      let all = 0;
      for (const k in dFlanks[f]) {
        const n = dFlanks[f][k as UnitId] ?? 0;
        all += n;
        if (UNITS[k as UnitId].cls === 'ranged') ranged += n;
      }
      if (all > 0) p *= 1 + (towerMult - 1) * (ranged / all);
    }
    dmgToAtt[tf] += p;
  }
  // Óleo fervente no portão.
  if (s?.defenses.oil && s.defenses.gateHp > 0 && b.elapsed < 40) dmgToAtt[1] += 40;

  const unitLossesFor = (flanks: Troops[], dmg: number[], mods: { toughness: number }, wm: number[]) => {
    const losses: Record<string, number> = {};
    for (const f of FLANKS) {
      const D = dmg[f] * BALANCE.battleRate * dt;
      if (D <= 0) continue;
      const comp = flanks[f];
      let W = 0;
      for (const k in comp) W += (comp[k as UnitId] ?? 0) * UNITS[k as UnitId].hp;
      if (W <= 0) continue;
      for (const k in comp) {
        const u = UNITS[k as UnitId];
        const n = comp[k as UnitId] ?? 0;
        const share = (n * u.hp) / W;
        const effHp = u.hp * (1 + u.defense / 25) * mods.toughness * wm[f];
        losses[k] = (losses[k] ?? 0) + (D * share * 30) / effHp;
      }
    }
    return losses;
  };
  const defLosses = unitLossesFor(dFlanks, dmgToDef, { toughness: dMods.toughness * dCmd.def }, wallMult);
  const attLosses = unitLossesFor(aFlanks, dmgToAtt, { toughness: aMods.toughness * aCmd.def }, [1, 1, 1]);
  const lostD = applyLosses(state, b, 'def', def, defLosses, dCmd.protect);
  const lostA = applyLosses(state, b, 'att', att, attLosses, aCmd.protect);

  // Moral.
  const moraleHit = (armies: Army[], lost: number, total: number) => {
    if (total <= 0) return;
    for (const a of armies) a.morale = Math.max(0, a.morale - (lost / total) * 120 + dt * 0.1);
  };
  moraleHit(att, lostA, attFight);
  moraleHit(def, lostD, defFight);

  const avgMorale = (armies: Army[]) => {
    let m = 0;
    let n = 0;
    for (const a of armies) {
      const sz = fightingSize(a);
      m += a.morale * sz;
      n += sz;
    }
    return n > 0 ? m / n : 0;
  };
  const attNow = battleStrength(sideTroops(att));
  const defNow = battleStrength(sideTroops(def));
  const cautious = att.some((a) => heroById(state, a.commanderId)?.traits.includes('cauteloso'));
  const routA = BALANCE.routThreshold * (cautious ? 1.6 : 1);
  if (attNow <= 0 || attNow < b.startAttack * routA || avgMorale(att) < 12) endBattle(state, b, 'def');
  else if (defNow <= 0 || (!s && (defNow < b.startDefense * BALANCE.routThreshold || avgMorale(def) < 12))) endBattle(state, b, 'att');
  else if (s && avgMorale(def) < 8) endBattle(state, b, 'att');
  else if (b.elapsed > 600) endBattle(state, b, 'def');
}

function makeReport(state: GameState, b: Battle, winner: Side, outcome: string, loot: Stock, lootGold: number, attStart: Troops, defStart: Troops): void {
  const s = b.settlementId != null ? settlementById(state, b.settlementId) : undefined;
  const r: BattleReport = {
    id: newId(state),
    time: state.time,
    x: b.x,
    y: b.y,
    attackerNation: b.attackerNation,
    defenderNation: b.defenderNation,
    attackerName: state.nations[b.attackerNation]?.name ?? '?',
    defenderName: b.defenderNation >= 0 ? state.nations[b.defenderNation]?.name ?? '?' : '?',
    placeName: s ? s.name : 'campo aberto',
    attackerTroops: attStart,
    defenderTroops: defStart,
    attackerLosses: { ...b.attackerLosses },
    defenderLosses: { ...b.defenderLosses },
    winner: winner === 'att' ? 'attacker' : 'defender',
    outcome,
    loot,
    lootGold,
    read: false,
  };
  state.reports.unshift(r);
  if (state.reports.length > MAX_REPORTS) state.reports.length = MAX_REPORTS;
}

function giveWounded(state: GameState, armies: Army[], losses: Troops): void {
  const home = armies.map((a) => settlementById(state, a.homeId)).find((s) => s && s.kind !== 'camp' && s.kind !== 'tribal');
  if (!home) return;
  const inf = home.buildings.filter((x) => x.type === 'infirmary' && x.level > 0).reduce((m, x) => Math.max(m, x.level), 0);
  if (inf <= 0) return;
  const frac = BALANCE.woundedBase + BALANCE.woundedPerLevel * inf;
  const w: Troops = {};
  for (const k in losses) {
    const u = k as UnitId;
    if (UNITS[u].cls === 'siege' || !UNITS[u].playable) continue;
    const n = Math.floor((losses[u] ?? 0) * frac);
    if (n > 0) w[u] = n;
  }
  if (troopCount(w) > 0) home.wounded.push({ troops: w, until: state.time + BALANCE.woundedRecovery });
}

function heroXp(state: GameState, armies: Army[], amount: number): void {
  for (const a of armies) {
    const h = heroById(state, a.commanderId);
    if (!h) continue;
    h.xp += amount;
    while (h.xp >= 100 * h.level) {
      h.xp -= 100 * h.level;
      h.level++;
      if (isPlayer(state, h.nation)) pushEvent(state, `${h.name} subiu para o nível ${h.level}.`, 'good');
    }
    a.xp = Math.min(1, a.xp + 0.05);
  }
}

function takeLoot(s: Settlement, capacity: number, protectedFrac: number): Stock {
  const loot: Stock = {};
  const items = Object.keys(s.stock) as ItemId[];
  let available = 0;
  for (const i of items) available += stockGet(s.stock, i) * (1 - protectedFrac);
  if (available <= 0 || capacity <= 0) return loot;
  const ratio = Math.min(1, capacity / available);
  for (const i of items) {
    const n = Math.floor(stockGet(s.stock, i) * (1 - protectedFrac) * ratio);
    if (n > 0) {
      loot[i] = n;
      stockAdd(s.stock, i, -n);
    }
  }
  return loot;
}

function endBattle(state: GameState, b: Battle, winner: Side): void {
  state.battles = state.battles.filter((x) => x !== b);
  const att = sideArmies(state, b, 'att');
  const def = sideArmies(state, b, 'def');
  for (const a of [...att, ...def]) a.battleId = null;
  const attStart: Troops = {};
  addTroops(attStart, sideTroops(att));
  addTroops(attStart, b.attackerLosses);
  const defStart: Troops = {};
  addTroops(defStart, sideTroops(def));
  addTroops(defStart, b.defenderLosses);

  giveWounded(state, att, b.attackerLosses);
  giveWounded(state, def, b.defenderLosses);
  heroXp(state, winner === 'att' ? att : def, 40);
  heroXp(state, winner === 'att' ? def : att, 15);

  // Rancor contra o agressor.
  if (b.defenderNation >= 0) {
    const r = relation(state, b.attackerNation, b.defenderNation);
    r.grudge[b.defenderNation] = Math.min(100, (r.grudge[b.defenderNation] ?? 0) + 30);
  }

  const s = b.settlementId != null ? settlementById(state, b.settlementId) : undefined;
  // Milicianos que sobreviveram voltam a ser cidadãos.
  if (s) {
    const g = garrisonOf(state, s);
    const mil = g?.troops.militia ?? 0;
    if (g && mil > 0) {
      delete g.troops.militia;
      addAdults(s, mil);
    }
  }
  let outcome = '';
  let loot: Stock = {};
  let lootGold = 0;
  if (winner === 'att' && s) {
    const res = captureOrSack(state, s, att);
    outcome = res.outcome;
    loot = res.loot;
    lootGold = res.gold;
  } else if (winner === 'att') {
    outcome = 'O inimigo recuou.';
    for (const a of def) if (a.stationedAt == null) orderReturn(state, a.id);
    for (const a of att) if (a.order === 'attack' || a.order === 'raid') resumeAfterField(state, a);
  } else {
    outcome = s ? `${s.name} resistiu ao ataque.` : 'O ataque foi repelido.';
    for (const a of att) {
      if (a.wave > 0) {
        removeArmy(state, a);
        continue;
      }
      orderReturn(state, a.id);
    }
    for (const a of def) if (a.stationedAt == null && (a.order === 'attack' || a.order === 'raid')) resumeAfterField(state, a);
  }

  const involvesPlayer = isPlayer(state, b.attackerNation) || isPlayer(state, b.defenderNation) || (s != null && isPlayer(state, s.nation));
  if (involvesPlayer) {
    makeReport(state, b, winner, outcome, loot, lootGold, attStart, defStart);
    const playerWon = (winner === 'att') === isPlayer(state, b.attackerNation);
    pushEvent(state, `${playerWon ? 'Vitória' : 'Derrota'}: ${outcome}`, playerWon ? 'good' : 'bad', b.x, b.y);
  }
  for (const a of [...att, ...def]) {
    if (a.stationedAt == null && armySize(a) <= 0) removeArmy(state, a);
  }
}

function resumeAfterField(state: GameState, a: Army): void {
  if (a.targetId == null) return;
  const t = settlementById(state, a.targetId);
  if (!t) return;
  a.path = [];
  // Retoma a marcha até o alvo.
  const m = a.order;
  orderAttackHook(state, a.id, t.id, m === 'raid' ? 'raid' : 'attack');
}

export let orderAttackHook = (_s: GameState, _a: number, _t: number, _m: 'attack' | 'raid'): void => {};
export function setOrderAttackHook(fn: typeof orderAttackHook): void {
  orderAttackHook = fn;
}

/** O atacante venceu um cerco: conquista ou saque. */
function captureOrSack(state: GameState, s: Settlement, att: Army[]): { outcome: string; loot: Stock; gold: number } {
  const lead = att[0];
  const attackerNation = state.nations[lead.nation];
  const prevNation = state.nations[s.nation];
  const survivors: Troops = {};
  for (const a of att) addTroops(survivors, a.troops);
  const capacity = carryCapacity(survivors);

  // Acampamento de bandidos: destruído e saqueado.
  if (s.kind === 'camp') {
    const loot = takeLoot(s, capacity, 0);
    distributeLoot(att, loot, 0);
    s.ruinedFor = BALANCE.banditRebuild;
    const g = garrisonOf(state, s);
    if (g) g.troops = {};
    if (isPlayer(state, lead.nation)) state.stats.banditCampsDestroyed = (state.stats.banditCampsDestroyed ?? 0) + 1;
    for (const a of att) orderReturn(state, a.id);
    markTerritoryDirty(state);
    return { outcome: `${s.name} foi destruído.`, loot, gold: 0 };
  }

  const conquer = att.some((a) => a.order === 'attack') && (attackerNation.kind === 'player' || attackerNation.kind === 'rival');
  if (s.kind === 'tribal') {
    state.stats.tribalFalls = (state.stats.tribalFalls ?? 0) + 1;
    if (prevNation.tribeLevel >= 3) state.stats.fortressFalls = (state.stats.fortressFalls ?? 0) + 1;
  }

  if (!conquer) {
    const prot = s.kind === 'tribal' ? 0 : protectedShare(s);
    const loot = takeLoot(s, capacity, prot);
    let gold = 0;
    if (prevNation.kind === 'player' || prevNation.kind === 'rival') {
      gold = Math.min(prevNation.gold * 0.1, capacity * 0.2);
      prevNation.gold -= gold;
    }
    distributeLoot(att, loot, gold);
    const killed = killPeople(s, Math.round(population(s) * (attackerNation.kind === 'horde' ? 0.1 : 0.04)));
    if (attackerNation.kind === 'horde') {
      // A horda queima construções: uma perde um nível.
      const target = s.buildings.find((x) => x.level > 1 && !BUILDINGS[x.type].unique);
      if (target) target.level--;
    }
    if (s.kind === 'tribal') {
      prevNation.tribeCalm = 0;
      if (prevNation.tribeLevel > 1 && attackerNation.kind !== 'tribe') prevNation.tribeLevel--;
    }
    for (const a of att) {
      if (a.wave > 0) {
        hordeAfterRaid(state, a);
        continue;
      }
      orderReturn(state, a.id);
    }
    if (isPlayer(state, lead.nation) && s.kind === 'tribal') state.stats.tribesBeaten = (state.stats.tribesBeaten ?? 0) + 1;
    return { outcome: `${s.name} foi saqueado${killed ? ` e ${killed} moradores morreram` : ''}.`, loot, gold };
  }

  // Conquista.
  const oldName = prevNation.name;
  const wasCapital = s.kind === 'capital';
  const g = garrisonOf(state, s);
  if (s.consulId != null) {
    const h = heroById(state, s.consulId);
    if (h) {
      h.captiveOf = lead.nation;
      h.assignedTo = null;
      h.role = 'none';
      state.prisoners.push({ id: newId(state), holder: lead.nation, owner: h.nation, heroId: h.id, troops: {}, ransom: 150 + h.level * 80, name: h.name });
    }
    s.consulId = null;
  }
  if (s.kind === 'tribal') {
    s.kind = 'village';
    s.buildings = [];
    addBuilding(state, s, 'governor_hall', 11, 11, 1);
    addBuilding(state, s, 'house', 9, 11, 1);
    addBuilding(state, s, 'house', 9, 12, 1);
    s.ages = s.ages.map((v) => Math.round(v * 0.7));
    s.vocation = null;
    if (prevNation.tribeLevel >= 3) {
      stockAdd(s.stock, 'jewels', 2);
      pushEvent(state, `O chefe tribal de ${s.name} deixou joias e um item de herói.`, 'good', s.x, s.y);
      const hero = state.heroes.find((h) => h.nation === lead.nation && h.captiveOf == null);
      if (hero) hero.equipment.push('Amuleto do chefe tribal');
    }
    if (isPlayer(state, lead.nation)) state.stats.tribesBeaten = (state.stats.tribesBeaten ?? 0) + 1;
  } else {
    killPeople(s, Math.round(population(s) * 0.1));
  }
  if (wasCapital) {
    s.kind = 'city';
    const keep = s.buildings.find((x) => x.type === 'keep');
    if (keep) {
      keep.type = 'governor_hall';
      keep.level = Math.min(5, keep.level);
    }
  }
  s.nation = lead.nation;
  s.loyalty = 25;
  s.trainQueue = [];
  s.siegeQueue = [];
  s.revolt = false;
  s.gridSize = gridSizeFor(s);
  s.defenses.wallHp = Math.min(s.defenses.wallHp, wallMaxHp(state, s.defenses.wallLevel, s.nation));
  s.defenses.gateHp = Math.min(s.defenses.gateHp, gateMaxHp(s.defenses.gateLevel));
  if (g) {
    g.nation = lead.nation;
    g.troops = {};
    g.homeId = s.id;
  }
  for (const a of att) {
    a.homeId = s.id;
    garrisonArmy(state, a, s);
  }
  markTerritoryDirty(state);
  if (wasCapital || prevNation.capitalId === s.id) pickNewCapital(state, prevNation.id);
  checkNationAlive(state, prevNation.id);
  return { outcome: `${s.name} foi conquistado de ${oldName}.`, loot: {}, gold: 0 };
}

function distributeLoot(att: Army[], loot: Stock, gold: number): void {
  const lead = att[0];
  if (!lead) return;
  for (const k in loot) stockAdd(lead.loot, k as ItemId, loot[k as ItemId] ?? 0);
  lead.lootGold += gold;
}

function hordeAfterRaid(state: GameState, a: Army): void {
  // A horda procura o próximo alvo próximo ou embarca e some.
  a.wave = a.wave;
  const next = state.settlements
    .filter((s) => s.ruinedFor <= 0 && s.kind !== 'camp' && state.nations[s.nation].kind !== 'horde' && Math.hypot(s.x - a.x, s.y - a.y) < 18 && s.id !== a.targetId)
    .sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
  if (next && a.lootGold < 2) {
    a.lootGold = 2;
    orderAttackHook(state, a.id, next.id, 'raid');
  } else removeArmy(state, a);
}

export function pickNewCapital(state: GameState, nationId: number): void {
  const n = state.nations[nationId];
  const mine = state.settlements.filter((s) => s.nation === nationId && s.kind !== 'camp' && s.kind !== 'tribal');
  if (n.kind === 'tribe') {
    const t = state.settlements.find((s) => s.nation === nationId);
    n.capitalId = t ? t.id : null;
    return;
  }
  if (!mine.length) {
    n.capitalId = null;
    return;
  }
  if (mine.some((s) => s.kind === 'capital')) {
    n.capitalId = mine.find((s) => s.kind === 'capital')!.id;
    return;
  }
  const best = mine.sort((a, b) => population(b) - population(a))[0];
  best.kind = 'capital';
  if (best.districts.length < 4) best.districts = [0, 1, 2, 3].map(() => ({ vocation: null, level: 0 }));
  best.vocation = null;
  best.gridSize = gridSizeFor(best);
  n.capitalId = best.id;
  if (isPlayer(state, nationId)) pushEvent(state, `${best.name} é a nova capital do reino.`, 'bad', best.x, best.y);
}

export function checkNationAlive(state: GameState, nationId: number): void {
  const n = state.nations[nationId];
  const any = state.settlements.some((s) => s.nation === nationId);
  if (any) return;
  if (!n.alive) return;
  n.alive = false;
  if (n.kind === 'player') {
    state.defeated = true;
    pushEvent(state, 'Seu reino caiu. Não resta nenhum assentamento.', 'bad');
  } else if (n.kind === 'rival' || n.kind === 'tribe') {
    pushEvent(state, `${n.name} deixou de existir.`, 'info');
  }
  for (const a of state.armies.filter((x) => x.nation === nationId && x.stationedAt == null)) removeArmy(state, a);
}

export function tickBattles(state: GameState, dt: number): void {
  for (const b of [...state.battles]) tickBattle(state, b, dt);
}

arrivalHooks.siege = startSiege;
arrivalHooks.field = startField;

/** Bandidos destruídos se reerguem. */
export function tickCamps(state: GameState, dt: number): void {
  for (const s of state.settlements) {
    if (s.ruinedFor <= 0) continue;
    s.ruinedFor -= dt;
    if (s.ruinedFor <= 0) {
      s.ruinedFor = 0;
      const g = garrisonOf(state, s);
      if (g) g.troops = banditGarrison(s.loyalty);
      s.stock = { wood: 60, stone: 30, bread: 40, iron: 5 };
      markTerritoryDirty(state);
    }
  }
}

export { nearestOwnSettlement };
