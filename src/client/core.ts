// Núcleo do motor: dono do estado do jogo, roda o tick e responde às ações.
// O mesmo código roda dentro do Web Worker (normal) ou na página (reserva).
import { applyAction, type Action } from '../sim/actions';
import { createGame } from '../sim/create';
import { updateTensions } from '../sim/diplomacy';
import { rt, updateTerritory } from '../sim/runtime';
import { deserialize, loadRaw, saveRaw, serialize } from '../sim/save';
import { tick } from '../sim/tick';
import type { GameState } from '../sim/types';

export interface Snapshot {
  state: GameState;
  explored: Uint8Array;
  visible: Uint8Array;
  owner: Int16Array | null;
  ownerVersion: number;
}

export type ToCore =
  | { type: 'boot'; newGame?: { seed: number; kingdom: string; capital: string }; resetSave?: boolean }
  | { type: 'run'; running: boolean }
  | { type: 'action'; id: number; action: Action }
  | { type: 'speed'; speed: number }
  | { type: 'save' };

export type FromCore =
  | { type: 'booted'; hasGame: boolean }
  | { type: 'snap'; snap: Snapshot }
  | { type: 'result'; id: number; result: { ok: boolean; reason?: string; armyId?: number; missionId?: number } }
  | { type: 'saved' }
  | { type: 'error'; message: string };

const MAX_FRAME = 1;
const SNAP_MS = 250;
const SAVE_MS = 8000;

export class Core {
  state: GameState | null = null;
  private running = false;
  private last = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastSnap = 0;
  private lastSave = 0;
  private ownerSig = '';
  private ownerVersion = 0;
  private speed = 1;
  private dirty = true;

  constructor(private post: (m: FromCore, transfer?: Transferable[]) => void, private db: IDBFactory | null) {}

  async handle(m: ToCore): Promise<void> {
    try {
      switch (m.type) {
        case 'boot': {
          if (m.newGame) {
            this.state = createGame(m.newGame.seed, m.newGame.kingdom, m.newGame.capital);
            updateTensions(this.state);
            await this.save();
          } else if (this.db) {
            const raw = await loadRaw(this.db).catch(() => null);
            if (raw) {
              try {
                this.state = deserialize(raw);
              } catch {
                this.state = null;
              }
            }
          }
          this.post({ type: 'booted', hasGame: !!this.state });
          if (this.state) this.snapshot(true);
          break;
        }
        case 'run':
          this.setRunning(m.running);
          break;
        case 'speed':
          this.speed = Math.max(1, Math.min(8, m.speed));
          break;
        case 'action': {
          if (!this.state) return;
          const result = applyAction(this.state, m.action);
          this.post({ type: 'result', id: m.id, result });
          this.dirty = true;
          this.snapshot(true);
          // Toda ordem do jogador é salva logo (o celular pode fechar o app a qualquer momento).
          if (result.ok) this.lastSave = Math.min(this.lastSave, performance.now() - SAVE_MS + 500);
          break;
        }
        case 'save':
          await this.save();
          this.post({ type: 'saved' });
          break;
      }
    } catch (err) {
      this.post({ type: 'error', message: String((err as Error)?.stack ?? err) });
    }
  }

  private setRunning(on: boolean): void {
    if (on === this.running) return;
    this.running = on;
    if (on) {
      this.last = performance.now();
      this.timer = setInterval(() => this.frame(), 100);
    } else {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      void this.save();
    }
  }

  private frame(): void {
    if (!this.state || !this.running) return;
    const now = performance.now();
    // Pausas grandes (aparelho dormindo) são descartadas: o tempo só corre com o app aberto.
    const dt = Math.min(MAX_FRAME, Math.max(0, (now - this.last) / 1000)) * this.speed;
    this.last = now;
    if (dt > 0) tick(this.state, dt);
    this.dirty = true;
    if (now - this.lastSnap >= SNAP_MS) this.snapshot(false);
    if (now - this.lastSave >= SAVE_MS) void this.save();
  }

  snapshot(force: boolean): void {
    if (!this.state || (!force && !this.dirty)) return;
    this.lastSnap = performance.now();
    this.dirty = false;
    const r = rt(this.state);
    updateTerritory(this.state);
    const sig = this.state.settlements.map((s) => `${s.id}:${s.nation}:${s.kind}:${s.ruinedFor > 0 ? 1 : 0}`).join('|');
    let owner: Int16Array | null = null;
    if (sig !== this.ownerSig) {
      this.ownerSig = sig;
      this.ownerVersion++;
      owner = r.owner.slice();
    }
    const explored = r.explored.slice();
    const visible = r.visible.slice();
    const snap: Snapshot = { state: this.state, explored, visible, owner, ownerVersion: this.ownerVersion };
    const transfer: Transferable[] = [explored.buffer, visible.buffer];
    if (owner) transfer.push(owner.buffer);
    this.post({ type: 'snap', snap }, transfer);
  }

  async save(): Promise<void> {
    if (!this.state || !this.db) return;
    this.lastSave = performance.now();
    await saveRaw(serialize(this.state), this.db).catch(() => undefined);
  }
}
