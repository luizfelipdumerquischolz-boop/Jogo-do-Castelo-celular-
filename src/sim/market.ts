// Mercado: troca de recursos com taxa, venda e compra por ouro, e caravanas.
import { ITEMS, stockAdd, stockGet, type ItemId, type Stock } from './data/items';
import { findPath } from './path';
import { rt, settlementById } from './runtime';
import { newTraveler } from './logistics';
import { storageCap, type ActionResult } from './settlement';
import type { GameState, Settlement, Traveler } from './types';
import { isHostile, isPlayer, pushEvent } from './util';
import { BALANCE } from './data/balance';

const fail = (reason: string): ActionResult => ({ ok: false, reason });

function hasMarket(s: Settlement): number {
  return s.buildings.filter((b) => b.type === 'market' && b.level > 0).reduce((m, b) => Math.max(m, b.level), 0);
}

export function marketFee(state: GameState, s: Settlement): number {
  let fee = 0.3 - 0.03 * hasMarket(s);
  if (state.nations[s.nation].research.done.includes('eco3')) fee -= 0.08;
  return Math.max(0.08, fee);
}

/** Vende itens por ouro. */
export function sell(state: GameState, sId: number, item: ItemId, qty: number): ActionResult {
  const s = settlementById(state, sId);
  if (!s || !hasMarket(s)) return fail('Precisa de um Mercado');
  const n = Math.floor(qty);
  if (n <= 0 || stockGet(s.stock, item) < n) return fail('Quantidade insuficiente');
  stockAdd(s.stock, item, -n);
  state.nations[s.nation].gold += n * ITEMS[item].value * (1 - marketFee(state, s));
  return { ok: true };
}

/** Compra itens com ouro. */
export function buy(state: GameState, sId: number, item: ItemId, qty: number): ActionResult {
  const s = settlementById(state, sId);
  if (!s || !hasMarket(s)) return fail('Precisa de um Mercado');
  const n = Math.floor(qty);
  const price = n * ITEMS[item].value * (1 + marketFee(state, s));
  const nation = state.nations[s.nation];
  if (n <= 0) return fail('Quantidade inválida');
  if (nation.gold < price) return fail('Falta ouro');
  if (stockGet(s.stock, item) + n > storageCap(state, s)) return fail('Armazém cheio');
  nation.gold -= price;
  stockAdd(s.stock, item, n);
  return { ok: true };
}

export function priceOf(state: GameState, s: Settlement, item: ItemId, buying: boolean): number {
  return ITEMS[item].value * (buying ? 1 + marketFee(state, s) : 1 - marketFee(state, s));
}

/** Caravana: leva mercadoria a um mercado estrangeiro e volta com ouro (25% de lucro). */
export function sendCaravan(state: GameState, fromId: number, toId: number, cargo: Stock): ActionResult {
  const a = settlementById(state, fromId);
  const b = settlementById(state, toId);
  if (!a || !b) return fail('Destino inválido');
  if (!hasMarket(a)) return fail('Precisa de um Mercado na origem');
  if (b.nation === a.nation) return fail('Escolha um mercado estrangeiro');
  if (!hasMarket(b)) return fail('O destino não tem mercado');
  if (isHostile(state, a.nation, b.nation)) return fail('Em guerra com esse reino');
  let total = 0;
  for (const k in cargo) {
    const n = Math.floor(cargo[k as ItemId] ?? 0);
    if (n > stockGet(a.stock, k as ItemId)) return fail('Mercadoria insuficiente');
    total += n;
  }
  if (total <= 0) return fail('Nada para vender');
  const path = findPath(a.x, a.y, b.x, b.y, rt(state).ctx, 60000);
  if (!path) return fail('Sem caminho');
  for (const k in cargo) stockAdd(a.stock, k as ItemId, -Math.floor(cargo[k as ItemId] ?? 0));
  newTraveler(state, { kind: 'caravan', nation: a.nation, x: a.x, y: a.y, speed: BALANCE.wagonSpeed, path, fromId, toId, cargo: { ...cargo } });
  return { ok: true };
}

/** Caravana chegou ao mercado estrangeiro: vende e volta com o ouro. */
export function caravanAtMarket(state: GameState, t: Traveler): boolean {
  if (t.returning) {
    state.nations[t.nation].gold += t.gold;
    if (isPlayer(state, t.nation)) pushEvent(state, `A caravana voltou com ${Math.round(t.gold)} de ouro.`, 'good', t.x, t.y);
    return true;
  }
  let value = 0;
  for (const k in t.cargo) value += (t.cargo[k as ItemId] ?? 0) * ITEMS[k as ItemId].value;
  t.gold = value * 1.25;
  const buyer = settlementById(state, t.toId);
  if (buyer) for (const k in t.cargo) stockAdd(buyer.stock, k as ItemId, t.cargo[k as ItemId] ?? 0);
  t.cargo = {};
  const home = settlementById(state, t.fromId);
  const path = home ? findPath(Math.round(t.x), Math.round(t.y), home.x, home.y, rt(state).ctx, 60000) : null;
  if (!path) {
    state.nations[t.nation].gold += t.gold;
    return true;
  }
  t.returning = true;
  t.path = path;
  t.pathIdx = 0;
  return false;
}
