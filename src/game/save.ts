import { SAVE_VERSION } from './state';
import type { GameState } from './types';

const DB_NAME = 'coroa-de-pedra';
const STORE = 'saves';
const KEY = 'main';

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(data: string): GameState {
  const parsed = JSON.parse(data) as GameState;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.fortresses) || typeof parsed.time !== 'number') {
    throw new Error('Save inválido');
  }
  if (parsed.version !== SAVE_VERSION) throw new Error(`Versão de save incompatível: ${parsed.version}`);
  return parsed;
}

function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(factory: IDBFactory, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb(factory).then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

/** Salva o estado no IndexedDB do aparelho. */
export function saveGame(state: GameState, factory: IDBFactory = indexedDB): Promise<void> {
  const data = serialize(state);
  return run(factory, 'readwrite', (s) => s.put(data, KEY)).then(() => undefined);
}

/** Carrega o save, ou null se ainda não existe. */
export async function loadGame(factory: IDBFactory = indexedDB): Promise<GameState | null> {
  const data = await run<unknown>(factory, 'readonly', (s) => s.get(KEY));
  if (typeof data !== 'string') return null;
  return deserialize(data);
}

export function deleteSave(factory: IDBFactory = indexedDB): Promise<void> {
  return run(factory, 'readwrite', (s) => s.delete(KEY)).then(() => undefined);
}
