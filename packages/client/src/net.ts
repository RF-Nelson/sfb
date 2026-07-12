import { C2S, LobbyView, MatchConfig, MatchResult, S2C, Snapshot, TICK_MS } from 'sfb-shared';

const INTERP_DELAY_MS = 110;

export interface NetCallbacks {
  onWelcome(code: string, slot: number): void;
  onLobby(lobby: LobbyView): void;
  onStarting(config: MatchConfig, yourSlot: number): void;
  onEnd(result: MatchResult): void;
  onError(msg: string): void;
  onClose(): void;
  onPong(rttMs: number): void;
}

export class NetClient {
  private ws: WebSocket | null = null;
  private snaps: Snapshot[] = [];
  private clockOffset: number | null = null; // recvTime - tick*TICK_MS (min-tracked)
  yourSlot = -1;
  rtt = 0;

  constructor(private cb: NetCallbacks) {}

  connect(): Promise<void> {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/ws`;
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => {
        resolve();
        setInterval(() => this.send({ t: 'ping', ts: performance.now() }), 2000);
      };
      ws.onerror = () => reject(new Error('connection failed'));
      ws.onclose = () => this.cb.onClose();
      ws.onmessage = (ev) => this.onMessage(String(ev.data));
    });
  }

  private onMessage(raw: string): void {
    let msg: S2C;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    switch (msg.t) {
      case 'welcome':
        this.yourSlot = msg.slot;
        this.cb.onWelcome(msg.code, msg.slot);
        break;
      case 'lobby':
        this.cb.onLobby(msg.lobby);
        break;
      case 'starting':
        this.snaps = [];
        this.clockOffset = null;
        this.yourSlot = msg.yourSlot;
        this.cb.onStarting(msg.config, msg.yourSlot);
        break;
      case 'snap': {
        const snap = msg.snap;
        const now = performance.now();
        const offset = now - snap.tick * TICK_MS;
        this.clockOffset = this.clockOffset === null ? offset : Math.min(this.clockOffset + 0.5, offset);
        this.snaps.push(snap);
        if (this.snaps.length > 40) this.snaps.shift();
        break;
      }
      case 'end':
        this.cb.onEnd(msg.result);
        break;
      case 'error':
        this.cb.onError(msg.msg);
        break;
      case 'pong':
        this.rtt = Math.round(performance.now() - msg.ts);
        this.cb.onPong(this.rtt);
        break;
    }
  }

  send(msg: C2S): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    if (this.ws) {
      // intentional close: don't fire the disconnect handler
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.close();
    }
    this.ws = null;
  }

  /** newest snapshot (for events / HUD truth) */
  latest(): Snapshot | null {
    return this.snaps[this.snaps.length - 1] ?? null;
  }

  /** interpolated view of the world at (now - delay) */
  interpolated(): Snapshot | null {
    if (this.snaps.length === 0) return null;
    if (this.snaps.length === 1 || this.clockOffset === null) return this.snaps[this.snaps.length - 1];
    const renderTime = performance.now() - this.clockOffset - INTERP_DELAY_MS;
    const renderTick = renderTime / TICK_MS;
    let a = this.snaps[0];
    let b = this.snaps[this.snaps.length - 1];
    for (let i = 0; i < this.snaps.length - 1; i++) {
      if (this.snaps[i].tick <= renderTick && this.snaps[i + 1].tick >= renderTick) {
        a = this.snaps[i];
        b = this.snaps[i + 1];
        break;
      }
    }
    if (renderTick >= b.tick) return b;
    if (renderTick <= a.tick || a === b) return a;
    const f = (renderTick - a.tick) / (b.tick - a.tick);
    const lerp = (x: number, y: number) => {
      // handle horizontal wrap (1920-wide world)
      if (Math.abs(y - x) > 960) {
        if (y > x) x += 1920;
        else y += 1920;
      }
      const v = x + (y - x) * f;
      return v > 1920 ? v - 1920 : v;
    };
    const gnomes = b.gnomes.map((gb) => {
      const ga = a.gnomes.find((g) => g.slot === gb.slot) ?? gb;
      return { ...gb, x: lerp(ga.x, gb.x), y: ga.y + (gb.y - ga.y) * f };
    });
    const farts = b.farts.map((fb) => {
      const fa = a.farts.find((g) => g.id === fb.id);
      return fa ? { ...fb, x: lerp(fa.x, fb.x), y: fa.y + (fb.y - fa.y) * f } : fb;
    });
    return { ...b, gnomes, farts, events: [] };
  }

  /** drain events from snaps received since last call */
  private consumedTick = -1;
  drainEvents(): Snapshot['events'] {
    const out: Snapshot['events'] = [];
    for (const s of this.snaps) {
      if (s.tick > this.consumedTick) {
        out.push(...s.events);
        this.consumedTick = s.tick;
      }
    }
    return out;
  }
}
