// Diplomacia: tensão pela distância das fronteiras, guerra, trégua, aliança,
// comércio, tributo e vassalagem. Propostas viajam por mensageiro.
import { BALANCE, YEAR_SECONDS } from './data/balance';
import { settlementById } from './runtime';
import { sendLetter } from './logistics';
import type { ActionResult } from './settlement';
import type { GameState, Letter, Nation, Personality, Relation, TensionState } from './types';
import { isPlayer, pushEvent, relation } from './util';
import { nationStrength } from './spy';

const fail = (reason: string): ActionResult => ({ ok: false, reason });

export const PERSONALITY_DISTANCE: Record<Personality, number> = {
  conqueror: 0.7,
  merchant: 1.35,
  builder: 1.1,
  treacherous: 0.9,
  cautious: 1.2,
};

export const TENSION_NAMES: Record<TensionState, string> = {
  pacific: 'Pacífico',
  watchful: 'Atento',
  tense: 'Tenso',
  hostile: 'Hostil',
};

export const RELATION_NAMES: Record<string, string> = {
  peace: 'Paz',
  war: 'Guerra',
  truce: 'Trégua',
  alliance: 'Aliança',
};

/** Reinos que contam na diplomacia (jogador, rivais e tribos). */
export function diplomaticNations(state: GameState): Nation[] {
  return state.nations.filter((n) => n.alive && (n.kind === 'player' || n.kind === 'rival' || n.kind === 'tribe'));
}

function tensionFromDistance(d: number): TensionState {
  const t = BALANCE.tension;
  if (d > t.pacific) return 'pacific';
  if (d > t.watchful) return 'watchful';
  if (d > t.tense) return 'tense';
  return 'hostile';
}

/** Como `me` enxerga `other`: distância ajustada por personalidade, rancor e reputação. */
export function perceivedTension(state: GameState, me: number, other: number): TensionState {
  const r = relation(state, me, other);
  const n = state.nations[me];
  let d = r.borderDistance;
  if (n.personality) d *= PERSONALITY_DISTANCE[n.personality];
  if (n.kind === 'tribe') d *= 1.4 - 0.1 * n.tribeLevel;
  d -= (r.grudge[me] ?? 0) * 0.3;
  d += Math.min(0, state.nations[other].reputation) * 0.3;
  return tensionFromDistance(d);
}

/** Recalcula a distância entre as fronteiras de todos os pares. */
export function updateTensions(state: GameState): void {
  const nations = diplomaticNations(state);
  const bySet = new Map<number, { x: number; y: number; r: number }[]>();
  for (const s of state.settlements) {
    if (s.kind === 'camp' || s.ruinedFor > 0) continue;
    const n = state.nations[s.nation];
    if (!n.alive) continue;
    const rad = s.kind === 'tribal' ? 3 + n.tribeLevel : BALANCE.claimRadius[s.kind] ?? 5;
    if (!bySet.has(s.nation)) bySet.set(s.nation, []);
    bySet.get(s.nation)!.push({ x: s.x, y: s.y, r: rad });
  }
  for (let i = 0; i < nations.length; i++) {
    for (let j = i + 1; j < nations.length; j++) {
      const a = nations[i];
      const b = nations[j];
      if (a.kind === 'tribe' && b.kind === 'tribe') continue;
      const sa = bySet.get(a.id) ?? [];
      const sb = bySet.get(b.id) ?? [];
      let best = 999;
      for (const p of sa) for (const q of sb) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y) - p.r - q.r);
      const r = relation(state, a.id, b.id);
      r.borderDistance = Math.max(0, best);
      r.tensionState = tensionFromDistance(r.borderDistance);
      r.tension = Math.max(0, Math.min(100, 100 - r.borderDistance));
    }
  }
}

export function declareWar(state: GameState, a: number, b: number, silent = false): void {
  if (a === b) return;
  const na = state.nations[a];
  const nb = state.nations[b];
  if (nb.kind === 'bandit' || nb.kind === 'horde' || na.kind === 'bandit' || na.kind === 'horde') return;
  const r = relation(state, a, b);
  if (r.state === 'war') return;
  const broke = r.state === 'alliance' || (r.state === 'truce' && state.time < r.truceUntil);
  r.state = 'war';
  r.trade = false;
  r.tribute = null;
  if (nb.vassalOf === a) nb.vassalOf = null;
  if (na.vassalOf === b) na.vassalOf = null;
  if (broke) {
    na.reputation -= 15;
    if (isPlayer(state, b)) pushEvent(state, `${na.name} traiu o acordo e declarou guerra!`, 'bad');
  }
  if (silent) return;
  if (isPlayer(state, b) && nb.kind === 'player') {
    sendLetter(state, { fromNation: a, toNation: b, sender: na.ruler, subject: `${na.name} declara guerra`, body: `${na.ruler} de ${na.name} declara guerra ao seu reino.` });
  }
  if (isPlayer(state, a)) pushEvent(state, `Você declarou guerra a ${nb.name}.`, 'bad');
}

export function makePeace(state: GameState, a: number, b: number, truceMinutes = 15): void {
  const r = relation(state, a, b);
  r.state = 'truce';
  r.truceUntil = state.time + truceMinutes * 60;
}

export type ProposalType = 'peace' | 'alliance' | 'trade' | 'tribute-offer' | 'tribute-demand' | 'vassal' | 'ransom' | 'war';

/** O jogador (ou a IA) envia uma proposta; a resposta chega por carta. */
export function propose(state: GameState, from: number, to: number, type: ProposalType, gold = 0): ActionResult {
  const nf = state.nations[from];
  const nt = state.nations[to];
  if (!nt || !nt.alive || from === to) return fail('Destinatário inválido');
  if (type === 'war') {
    declareWar(state, from, to);
    return { ok: true };
  }
  if (type === 'tribute-offer' && nf.gold < gold) return fail('Falta ouro');
  const cap = settlementById(state, nf.capitalId);
  const names: Record<ProposalType, string> = {
    peace: 'Proposta de paz',
    alliance: 'Proposta de aliança',
    trade: 'Proposta de comércio',
    'tribute-offer': `Oferta de tributo (${gold} de ouro por ano)`,
    'tribute-demand': `Exigência de tributo (${gold} de ouro por ano)`,
    vassal: 'Proposta de vassalagem',
    ransom: `Pedido de resgate (${gold} de ouro)`,
    war: 'Guerra',
  };
  sendLetter(state, {
    fromNation: from,
    toNation: to,
    sender: nf.ruler === 'Você' ? nf.name : `${nf.ruler}, ${nf.name}`,
    subject: names[type],
    body: `${names[type]} de ${nf.name}.`,
    fromX: cap?.x,
    fromY: cap?.y,
    proposal: { type, from, to, gold },
    actions: isPlayer(state, to)
      ? [
          { label: 'Aceitar', action: 'accept' },
          { label: 'Recusar', action: 'refuse' },
        ]
      : [],
  });
  return { ok: true };
}

/** A IA decide se aceita uma proposta. */
export function aiAccepts(state: GameState, l: Letter): boolean {
  const p = l.proposal!;
  const me = state.nations[p.to];
  const other = state.nations[p.from];
  const r = relation(state, p.from, p.to);
  const mine = nationStrength(state, me.id);
  const theirs = nationStrength(state, other.id);
  const ratio = theirs / Math.max(1, mine);
  const pers = me.personality;
  const t = perceivedTension(state, me.id, other.id);
  const grudge = r.grudge[me.id] ?? 0;
  switch (p.type) {
    case 'peace':
      return r.state === 'war' && (ratio > 1.2 || (pers === 'merchant' && grudge < 60) || (pers === 'cautious' && ratio > 0.8) || grudge < 20);
    case 'alliance':
      return r.state !== 'war' && t !== 'hostile' && grudge < 20 && (pers === 'merchant' || pers === 'builder' || pers === 'treacherous' || ratio > 1.5) && other.reputation > -20;
    case 'trade':
      return r.state !== 'war' && grudge < 40 && pers !== 'conqueror' && me.kind !== 'tribe';
    case 'tribute-offer':
      return r.state === 'war' ? (p.gold ?? 0) > 60 && ratio < 1.5 && pers !== 'conqueror' : true;
    case 'tribute-demand':
      return ratio > 2 && pers !== 'conqueror';
    case 'vassal':
      if (me.kind === 'tribe') return ratio > 1.6 || (p.gold ?? 0) >= me.tribeLevel * 150;
      return ratio > 4 || (me.capitalId == null && ratio > 1);
    case 'ransom':
      return state.nations[p.to].gold >= (p.gold ?? 0);
  }
  return false;
}

/** Aplica uma proposta aceita. */
export function applyProposal(state: GameState, l: Letter): void {
  const p = l.proposal!;
  const r: Relation = relation(state, p.from, p.to);
  const from = state.nations[p.from];
  const to = state.nations[p.to];
  switch (p.type) {
    case 'peace':
      makePeace(state, p.from, p.to);
      break;
    case 'alliance':
      r.state = 'alliance';
      break;
    case 'trade':
      r.trade = true;
      break;
    case 'tribute-offer':
      r.tribute = { from: p.from, gold: p.gold ?? 0 };
      if (r.state === 'war') makePeace(state, p.from, p.to);
      break;
    case 'tribute-demand':
      r.tribute = { from: p.to, gold: p.gold ?? 0 };
      if (r.state === 'war') makePeace(state, p.from, p.to);
      break;
    case 'vassal':
      to.vassalOf = p.from;
      r.state = 'peace';
      r.tribute = { from: p.to, gold: to.kind === 'tribe' ? 30 * to.tribeLevel : 120 };
      if (to.kind === 'tribe' && (p.gold ?? 0) > 0) {
        from.gold -= p.gold ?? 0;
        to.gold += p.gold ?? 0;
      }
      if (isPlayer(state, p.from) && to.kind === 'tribe') state.stats.tribesBeaten = (state.stats.tribesBeaten ?? 0) + 1;
      break;
    case 'vassal-join':
      from.vassalOf = p.to;
      r.state = 'peace';
      r.tribute = { from: p.from, gold: 30 * from.tribeLevel };
      if (isPlayer(state, p.to)) state.stats.tribesBeaten = (state.stats.tribesBeaten ?? 0) + 1;
      break;
    case 'ransom': {
      const pr = state.prisoners.find((x) => x.holder === p.from && x.owner === p.to);
      if (pr) {
        to.gold -= p.gold ?? 0;
        from.gold += p.gold ?? 0;
        freePrisoner(state, pr.id);
      }
      break;
    }
  }
}

export function freePrisoner(state: GameState, prisonerId: number): void {
  const pr = state.prisoners.find((x) => x.id === prisonerId);
  if (!pr) return;
  if (pr.heroId != null) {
    const h = state.heroes.find((x) => x.id === pr.heroId);
    if (h) h.captiveOf = null;
  }
  state.prisoners = state.prisoners.filter((x) => x !== pr);
}

/** O jogador paga para libertar um herói capturado. */
export function payRansom(state: GameState, prisonerId: number): ActionResult {
  const pr = state.prisoners.find((x) => x.id === prisonerId);
  if (!pr || pr.owner !== state.playerNation) return fail('Prisioneiro inválido');
  const n = state.nations[state.playerNation];
  if (n.gold < pr.ransom) return fail('Falta ouro');
  n.gold -= pr.ransom;
  state.nations[pr.holder].gold += pr.ransom;
  freePrisoner(state, pr.id);
  return { ok: true };
}

/** Responde a uma proposta recebida pelo jogador. */
export function answerProposal(state: GameState, letterId: number, accept: boolean): ActionResult {
  const l = state.letters.find((x) => x.id === letterId);
  if (!l || !l.proposal) return fail('Carta inválida');
  const p = l.proposal;
  l.actions = [];
  if (accept) {
    if (p.type === 'tribute-demand' || p.type === 'ransom') {
      // O jogador paga.
    }
    applyProposal(state, l);
    pushEvent(state, `Você aceitou: ${l.subject}.`, 'good');
  } else {
    const r = relation(state, p.from, p.to);
    r.grudge[p.from] = Math.min(100, (r.grudge[p.from] ?? 0) + 5);
    pushEvent(state, `Você recusou: ${l.subject}.`, 'info');
  }
  const from = state.nations[p.from];
  if (from.kind !== 'player') sendLetter(state, { fromNation: p.to, toNation: p.from, sender: state.nations[p.to].name, subject: accept ? 'Proposta aceita' : 'Proposta recusada', body: '' });
  return { ok: true };
}

/** Uma proposta chegou ao destino. A IA responde na hora (a resposta viaja de volta). */
export function onProposalArrived(state: GameState, l: Letter): void {
  if (!l.proposal) return;
  const p = l.proposal;
  const to = state.nations[p.to];
  if (to.kind === 'player') return;
  const ok = aiAccepts(state, l);
  if (ok) applyProposal(state, l);
  const cap = settlementById(state, to.capitalId);
  sendLetter(state, {
    fromNation: p.to,
    toNation: p.from,
    sender: `${to.ruler}, ${to.name}`,
    subject: ok ? `${to.name} aceitou: ${l.subject}` : `${to.name} recusou: ${l.subject}`,
    body: ok ? 'Que assim seja.' : 'Não temos interesse.',
    fromX: cap?.x,
    fromY: cap?.y,
  });
}

/** Tributos anuais, rancor que esfria e fim das tréguas. */
export function tickDiplomacy(state: GameState, dt: number): void {
  for (const key in state.relations) {
    const r = state.relations[key];
    for (const k in r.grudge) r.grudge[k] = Math.max(0, r.grudge[k] - dt / 60);
    if (r.state === 'truce' && state.time >= r.truceUntil) r.state = 'peace';
    if (r.tribute) {
      const payer = state.nations[r.tribute.from];
      const receiver = state.nations[r.tribute.from === r.a ? r.b : r.a];
      const amount = (r.tribute.gold * dt) / YEAR_SECONDS;
      if (payer.gold >= amount) {
        payer.gold -= amount;
        receiver.gold += amount;
      } else if (payer.kind !== 'player' && state.time % 60 < dt) {
        // Não pagou: rancor do credor.
        r.grudge[receiver.id] = Math.min(100, (r.grudge[receiver.id] ?? 0) + 10);
      }
    }
  }
  // Reputação volta devagar ao normal.
  for (const n of state.nations) if (n.reputation < 0) n.reputation = Math.min(0, n.reputation + dt / 300);
}

export function tradeBonus(state: GameState, nation: number): number {
  let b = 1;
  for (const key in state.relations) {
    const r = state.relations[key];
    if (r.trade && (r.a === nation || r.b === nation)) b += 0.1;
  }
  return Math.min(1.4, b);
}
