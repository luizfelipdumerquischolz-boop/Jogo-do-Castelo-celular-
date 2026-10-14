/// <reference lib="webworker" />
// Web Worker da simulação: o mundo inteiro roda aqui, longe da tela, para a interface nunca travar.
import { Core, type ToCore } from './core';

const scope = self as unknown as DedicatedWorkerGlobalScope;
const core = new Core((m, transfer) => scope.postMessage(m, transfer ?? []), typeof indexedDB !== 'undefined' ? indexedDB : null);
scope.onmessage = (e: MessageEvent<ToCore>) => {
  void core.handle(e.data);
};
