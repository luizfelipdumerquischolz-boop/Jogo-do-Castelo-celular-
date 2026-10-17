import { describe, expect, test } from 'vitest';
import { BUILDINGS, createGame, tick, type GameState, type Settlement } from '../src/sim';
import { CityLife, MAX_CITIZENS } from '../src/ui/cityLife';

function capital(st: GameState): Settlement {
  return st.settlements.find((s) => s.id === st.nations[st.playerNation].capitalId)!;
}

/** Distância do ponto até o retângulo ocupado por alguma construção. */
function distToBuilding(s: Settlement, x: number, y: number): number {
  let best = Infinity;
  for (const b of s.buildings) {
    const n = BUILDINGS[b.type].size;
    const dx = Math.max(b.x - x, 0, x - (b.x + n));
    const dy = Math.max(b.y - y, 0, y - (b.y + n));
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

describe('vida na cidade', () => {
  test('no máximo 30 moradores, e ninguém aparece ou some fora de uma construção', () => {
    const st = createGame(5);
    const s = capital(st);
    s.ages = s.ages.map((v) => v * 4); // população grande: testa o limite de 30
    const life = new CityLife();
    const boxes = new Map();
    let now = 1000;
    let prev = new Map<number, boolean>();
    let lastPos = new Map<number, { x: number; y: number }>();
    let maxSeen = 0;
    let appeared = 0;
    let vanished = 0;
    for (let f = 0; f < 6000; f++) {
      now += 33;
      if (f % 30 === 0) tick(st, 1);
      life.update(st, s, now, boxes, 400, 800);
      const agents = life.debugAgents() as { id?: number; inside: number | null; x: number; y: number }[];
      expect(agents.length).toBeLessThanOrEqual(MAX_CITIZENS);
      const cur = new Map<number, boolean>();
      agents.forEach((a, i) => {
        const key = (a as { id: number }).id ?? i;
        const visible = a.inside == null;
        cur.set(key, visible);
        const was = prev.get(key);
        if (visible && was === false) {
          appeared++;
          expect(distToBuilding(s, a.x, a.y), 'apareceu fora de uma construção').toBeLessThan(0.06);
        }
      });
      for (const [key, was] of prev) {
        if (was && cur.get(key) === false) {
          vanished++;
          const p = lastPos.get(key)!;
          expect(distToBuilding(s, p.x, p.y), 'sumiu fora de uma construção').toBeLessThan(0.1);
        }
        if (was && !cur.has(key)) throw new Error('morador sumiu no meio da rua');
      }
      prev = cur;
      lastPos = new Map(agents.map((a, i) => [(a as { id: number }).id ?? i, { x: a.x, y: a.y }]));
      maxSeen = Math.max(maxSeen, agents.length);
    }
    expect(maxSeen).toBe(MAX_CITIZENS);
    expect(appeared).toBeGreaterThan(10);
    expect(vanished).toBeGreaterThan(5);
  });
});
