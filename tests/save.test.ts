import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  deleteSave,
  deserialize,
  loadGame,
  playerCastle,
  saveGame,
  serialize,
  tick,
  upgradeBuilding,
} from '../src/game';

describe('salvar e carregar', () => {
  it('salva no IndexedDB e recupera o mesmo estado', async () => {
    const db = new IDBFactory();
    const s = createInitialState(7);
    upgradeBuilding(s, 'farm');
    tick(s, 1234);
    await saveGame(s, db);
    const loaded = await loadGame(db);
    expect(loaded).toEqual(JSON.parse(serialize(s)));
    expect(serialize(loaded!)).toBe(serialize(s));
  });

  it('retorna null sem save e apaga o save', async () => {
    const db = new IDBFactory();
    expect(await loadGame(db)).toBeNull();
    await saveGame(createInitialState(), db);
    await deleteSave(db);
    expect(await loadGame(db)).toBeNull();
  });

  it('o jogo carregado continua idêntico ao original', async () => {
    const db = new IDBFactory();
    const a = createInitialState(3);
    tick(a, 900);
    await saveGame(a, db);
    const b = (await loadGame(db))!;
    tick(a, 900);
    tick(b, 900);
    expect(serialize(b)).toBe(serialize(a));
  });

  it('com o app fechado o tempo congela: nada é produzido entre salvar e abrir', async () => {
    const db = new IDBFactory();
    const s = createInitialState();
    tick(s, 60);
    await saveGame(s, db);
    const resources = { ...playerCastle(s).resources };
    // Simula o aparelho passando horas com o jogo fechado: o estado não guarda hora real.
    await new Promise((r) => setTimeout(r, 20));
    const loaded = (await loadGame(db))!;
    expect(loaded.time).toBe(60);
    expect(playerCastle(loaded).resources).toEqual(resources);
  });

  it('rejeita dados corrompidos', () => {
    expect(() => deserialize('{"foo":1}')).toThrow();
    expect(() => deserialize(JSON.stringify({ ...createInitialState(), version: 999 }))).toThrow();
  });
});
