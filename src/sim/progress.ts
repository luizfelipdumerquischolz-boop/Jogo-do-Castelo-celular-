// Eras, pesquisa, eventos aleatórios, vitória e o segredo dos 100%.
import { BALANCE, YEAR_SECONDS } from './data/balance';
import { BUILDINGS } from './data/buildings';
import { stockAdd, stockGet } from './data/items';
import { CONTINENT_NAME, OTHER_CONTINENT_NAME } from './data/names';
import { RESEARCH, RESEARCH_BY_ID } from './data/research';
import { getMap } from './map';
import { rt, settlementById, updateTerritory } from './runtime';
import { sendLetter } from './logistics';
import { rand } from './rng';
import { notice, type ActionResult } from './settlement';
import type { GameState } from './types';
import { isPlayer, pushEvent, relation } from './util';

export const ERA_NAMES = ['', 'Era da Fundação', 'Era da Expansão', 'Era do Contato', 'Era da Guerra'];

export function startResearch(state: GameState, nation: number, id: string): ActionResult {
  const n = state.nations[nation];
  const r = RESEARCH_BY_ID[id];
  if (!r) return { ok: false, reason: 'Pesquisa inválida' };
  if (n.research.done.includes(id)) return { ok: false, reason: 'Já pesquisada' };
  if (r.requires && !n.research.done.includes(r.requires)) return { ok: false, reason: 'Falta a pesquisa anterior' };
  if (n.research.current && n.research.current !== id && n.research.progress > 0) n.research.progress *= 0.5;
  n.research.current = id;
  return { ok: true };
}

function finishResearch(state: GameState): void {
  for (const n of state.nations) {
    const id = n.research.current;
    if (!id) continue;
    const r = RESEARCH_BY_ID[id];
    if (n.research.progress >= r.cost) {
      n.research.done.push(id);
      n.research.current = null;
      n.research.progress = 0;
      if (isPlayer(state, n.id)) pushEvent(state, `Pesquisa concluída: ${r.name}.`, 'good');
    }
  }
}

export function availableResearch(state: GameState, nation: number) {
  const n = state.nations[nation];
  return RESEARCH.filter((r) => !n.research.done.includes(r.id) && (!r.requires || n.research.done.includes(r.requires)));
}

function checkEras(state: GameState): void {
  const tribalFalls = (state.stats.tribalFalls ?? 0) > 0;
  if (state.era === 1 && (tribalFalls || state.time > YEAR_SECONDS * 4)) setEra(state, 2);
  if (state.era === 2) {
    for (const k in state.relations) {
      const r = state.relations[k];
      const a = state.nations[r.a];
      const b = state.nations[r.b];
      const kingdoms = (a.kind === 'player' || a.kind === 'rival') && (b.kind === 'player' || b.kind === 'rival');
      if (kingdoms && r.borderDistance < 4) {
        setEra(state, 3);
        break;
      }
    }
  }
  if (state.era === 3 && ((state.stats.capitalSieges ?? 0) > 0 || (state.stats.fortressFalls ?? 0) > 0)) setEra(state, 4);
}

function setEra(state: GameState, era: number): void {
  state.era = era;
  pushEvent(state, `Começa a ${ERA_NAMES[era]}.`, 'info');
  if (era === 2) state.hordes.nextIn = Math.min(state.hordes.nextIn, BALANCE.hordeFirstWave);
}

/** Fatia das terras do continente que o jogador controla (vassalos contam). */
export function landShare(state: GameState, nation: number): number {
  updateTerritory(state);
  const r = rt(state);
  let owned = r.landOwned.get(nation) ?? 0;
  for (const n of state.nations) if (n.vassalOf === nation) owned += r.landOwned.get(n.id) ?? 0;
  return owned / getMap().landCount;
}

/** Terra ocupada por qualquer reino ou tribo (para o "100% do mapa"). */
export function claimedShare(state: GameState): number {
  updateTerritory(state);
  let total = 0;
  for (const v of rt(state).landOwned.values()) total += v;
  return total / getMap().landCount;
}

export function rivalsSubdued(state: GameState, nation: number): boolean {
  return state.nations.filter((n) => n.kind === 'rival').every((n) => !n.alive || n.vassalOf === nation);
}

function checkVictory(state: GameState): void {
  const p = state.playerNation;
  const player = state.nations[p];
  if (!state.victory.achieved && rivalsSubdued(state, p) && landShare(state, p) >= BALANCE.victoryLandShare) {
    state.victory.achieved = true;
    state.victory.at = state.time;
    player.emperor = true;
    pushEvent(state, `Você uniu o ${CONTINENT_NAME} e recebeu o título de Imperador!`, 'good');
    sendLetter(state, {
      fromNation: p,
      toNation: p,
      sender: 'Os povos do continente',
      subject: 'Vida longa ao Imperador!',
      body: `Todas as nações se curvam a você. O ${CONTINENT_NAME} é um só império.\n\nO jogo continua, mas as hordas do mar agora virão bem mais fortes.`,
    });
  }
  if (state.victory.achieved && !state.victory.secret) {
    const r = rt(state);
    const mine = landShare(state, p);
    const all = r.landOwned.size > 0 && mine >= 0.995;
    if (all) {
      state.victory.secret = true;
      sendLetter(state, {
        fromNation: p,
        toNation: p,
        sender: `Um mensageiro do ${OTHER_CONTINENT_NAME}`,
        subject: 'Mensagem secreta de além-mar',
        body: `Senhor Imperador,\n\nOs impérios do ${OTHER_CONTINENT_NAME} acompanham seus feitos. Vossa Majestade está convidado a participar do próximo encontro dos impérios continentais.\n\nAguarde nossos navios.`,
      });
    }
  }
}

// Eventos aleatórios -------------------------------------------------------------------

function randomEvents(state: GameState): void {
  for (const s of state.settlements) {
    if (s.kind === 'camp' || s.kind === 'tribal' || s.ruinedFor > 0) continue;
    if (rand(state) > 0.04) continue;
    const roll = rand(state);
    const wells = s.buildings.filter((b) => b.type === 'well' && b.level > 0).length;
    if (roll < 0.25) {
      if (rand(state) < 0.5 / (1 + wells)) {
        const lost = Math.floor(stockGet(s.stock, 'wood') * 0.2);
        stockAdd(s.stock, 'wood', -lost);
        const b = s.buildings.find((x) => x.build && !BUILDINGS[x.type].unique);
        if (b?.build) b.build.remaining = Math.min(b.build.total, b.build.remaining + b.build.total * 0.3);
        notice(state, s, 'fire', `Incêndio em ${s.name}! Perdemos ${lost} de madeira.`);
      }
    } else if (roll < 0.45) {
      const items = ['wheat', 'flour', 'oats', 'barley'] as const;
      let lost = 0;
      for (const i of items) {
        const l = Math.floor(stockGet(s.stock, i) * 0.25);
        stockAdd(s.stock, i, -l);
        lost += l;
      }
      if (lost > 10) notice(state, s, 'rats', `Ratos no celeiro de ${s.name}: ${lost} de grãos perdidos.`);
    } else if (roll < 0.65) {
      s.modifiers.bumperUntil = state.time + BALANCE.seasonSeconds;
      notice(state, s, 'bumper', `Colheita farta em ${s.name}! As lavouras rendem 50% a mais nesta estação.`, false);
    } else if (roll < 0.8) {
      s.modifiers.blightUntil = state.time + BALANCE.seasonSeconds;
      notice(state, s, 'blight', `Praga nas plantações de ${s.name}: colheita pela metade nesta estação.`);
    } else if (isPlayer(state, s.nation) && s.kind === 'capital') {
      // Mercador viajante oferece um negócio.
      const offers = [
        { item: 'iron', qty: 60, gold: 70 },
        { item: 'horse', qty: 5, gold: 60 },
        { item: 'wine', qty: 40, gold: 90 },
        { item: 'steel', qty: 20, gold: 80 },
        { item: 'fruit', qty: 80, gold: 50 },
      ];
      const o = offers[Math.floor(rand(state) * offers.length)];
      sendLetter(state, {
        fromNation: s.nation,
        toNation: s.nation,
        sender: 'Mercador viajante',
        subject: `Mercador oferece ${o.qty} de ${o.item === 'iron' ? 'ferro' : o.item === 'horse' ? 'cavalos' : o.item === 'wine' ? 'vinho' : o.item === 'steel' ? 'aço' : 'frutas'}`,
        body: `Um mercador chegou a ${s.name} e oferece a mercadoria por ${o.gold} de ouro.`,
        actions: [{ label: `Comprar por ${o.gold} de ouro`, action: 'merchant', arg: `${o.item}:${o.qty}:${o.gold}` }],
      });
    }
  }
}

export function buyFromMerchant(state: GameState, letterId: number): ActionResult {
  const l = state.letters.find((x) => x.id === letterId);
  const act = l?.actions.find((a) => a.action === 'merchant');
  if (!l || !act) return { ok: false, reason: 'Oferta expirada' };
  const [item, qty, gold] = String(act.arg).split(':');
  const n = state.nations[state.playerNation];
  if (n.gold < Number(gold)) return { ok: false, reason: 'Falta ouro' };
  const cap = settlementById(state, n.capitalId);
  if (!cap) return { ok: false, reason: 'Sem capital' };
  n.gold -= Number(gold);
  stockAdd(cap.stock, item as never, Number(qty));
  l.actions = [];
  return { ok: true };
}

export function tickProgress(state: GameState, dt: number): void {
  if (state.time % 5 < dt) finishResearch(state);
  if (state.time % 10 < dt) {
    checkEras(state);
    checkVictory(state);
  }
  if (state.time % 60 < dt) randomEvents(state);
  void relation;
}
