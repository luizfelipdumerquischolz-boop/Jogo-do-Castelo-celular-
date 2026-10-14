// Liga os módulos entre si sem criar dependências circulares na carga.
import { setDeclareWarHook } from './army';
import { setAttackNoticeHook, setOrderAttackHook } from './battle';
import { orderAttack } from './army';
import { declareWar, onProposalArrived } from './diplomacy';
import { setCaravanHook, setInterceptHook, setLetterArrivedHook, setShipArrivedHook, setSpyArrivedHook, settlementNotice } from './logistics';
import { caravanAtMarket } from './market';
import { setNoticeHook } from './settlement';
import { spyArrived } from './spy';
import { shipArrived } from './ai';
import { isPlayer } from './util';

setNoticeHook((state, s, key, text, bad) => settlementNotice(state, s, key, text, bad));
setAttackNoticeHook((state, s, text) => settlementNotice(state, s, 'attack', text, true));
setDeclareWarHook((state, a, b) => declareWar(state, a, b));
setOrderAttackHook((state, a, t, m) => {
  orderAttack(state, a, t, m);
});
setSpyArrivedHook(spyArrived);
setShipArrivedHook(shipArrived);
setCaravanHook(caravanAtMarket);
setLetterArrivedHook((state, l) => {
  if (l.proposal) onProposalArrived(state, l);
});
setInterceptHook((state, t, captor) => {
  if (t.kind !== 'messenger' || t.letterId == null) return;
  const l = state.letters.find((x) => x.id === t.letterId);
  if (!l) return;
  // Quem interceptou lê a carta.
  if (isPlayer(state, captor)) {
    state.letters.push({ ...l, id: state.nextId++, toNation: captor, intercepted: true, arrived: true, read: false, actions: [], proposal: null, time: state.time });
  } else {
    const k = state.nations[captor].knowledge;
    k[l.fromNation] = { strength: (k[l.fromNation]?.strength ?? 0) * 0.8 + 50, time: state.time };
  }
  state.letters = state.letters.filter((x) => x !== l);
});
