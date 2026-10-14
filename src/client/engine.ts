// Ponte entre a interface e a simulação (Web Worker, ou na própria página se o worker falhar).
import type { Action } from '../sim/actions';
import { Core, type FromCore, type Snapshot, type ToCore } from './core';

type Result = { ok: boolean; reason?: string; armyId?: number; missionId?: number };

export class Engine {
  private worker: Worker | null = null;
  private local: Core | null = null;
  private nextId = 1;
  private pending = new Map<number, (r: Result) => void>();
  private bootResolve: ((has: boolean) => void) | null = null;
  onSnapshot: (s: Snapshot) => void = () => {};
  onError: (msg: string) => void = () => {};
  mode: 'worker' | 'local' = 'worker';

  constructor(preferWorker = true) {
    if (preferWorker && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e: MessageEvent<FromCore>) => this.receive(e.data);
        this.worker.onerror = (e) => {
          console.warn('Worker falhou, usando simulação na página', e);
          this.fallback();
        };
        return;
      } catch (err) {
        console.warn('Sem Web Worker', err);
      }
    }
    this.fallback();
  }

  private fallback(): void {
    if (this.local) return;
    this.worker?.terminate();
    this.worker = null;
    this.mode = 'local';
    this.local = new Core((m) => this.receive(m), typeof indexedDB !== 'undefined' ? indexedDB : null);
  }

  private send(m: ToCore): void {
    if (this.worker) this.worker.postMessage(m);
    else void this.local!.handle(m);
  }

  private receive(m: FromCore): void {
    switch (m.type) {
      case 'booted':
        this.bootResolve?.(m.hasGame);
        this.bootResolve = null;
        break;
      case 'snap':
        this.onSnapshot(m.snap);
        break;
      case 'result': {
        const cb = this.pending.get(m.id);
        this.pending.delete(m.id);
        cb?.(m.result);
        break;
      }
      case 'error':
        this.onError(m.message);
        break;
    }
  }

  boot(newGame?: { seed: number; kingdom: string; capital: string }): Promise<boolean> {
    return new Promise((resolve) => {
      this.bootResolve = resolve;
      this.send({ type: 'boot', newGame });
    });
  }

  run(on: boolean): void {
    this.send({ type: 'run', running: on });
  }

  speed(x: number): void {
    this.send({ type: 'speed', speed: x });
  }

  save(): void {
    this.send({ type: 'save' });
  }

  act(action: Action): Promise<Result> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.send({ type: 'action', id, action });
    });
  }
}
