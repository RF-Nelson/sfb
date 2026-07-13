import type { WebSocket } from 'ws';
import {
  Build,
  C2S,
  GameMode,
  LobbyView,
  MatchConfig,
  PlayerSetup,
  S2C,
  Sim,
  SimEvent,
  Special,
  TICK_MS,
} from 'sfb-shared';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const MAX_PLAYERS = 4;
const MAX_LOCAL_PER_CONN = 2; // couch co-op online: up to 2 players share a connection
const ROOM_IDLE_MS = 15 * 60 * 1000;

interface PlayerEntry {
  slot: number;
  name: string;
  build: Build;
  special: Special;
  team: number;
  ready: boolean;
}

export interface Conn {
  id: number;
  ws: WebSocket;
  connected: boolean;
  players: PlayerEntry[];
  latestBits: Map<number, number>; // by slot
}

export class Room {
  code: string;
  mode: GameMode = 'ffa';
  levelId = 'garden';
  aiCount = 0;
  conns: Conn[] = [];
  sim: Sim | null = null;
  private nextConnId = 1;
  private loop: ReturnType<typeof setInterval> | null = null;
  private eventBuffer: SimEvent[] = [];
  private lastActivity = Date.now();

  constructor(code: string, private onEmpty: (room: Room) => void) {
    this.code = code;
  }

  get host(): Conn | undefined {
    return this.conns.find((c) => c.connected);
  }

  touch(): void {
    this.lastActivity = Date.now();
  }

  isIdle(): boolean {
    return Date.now() - this.lastActivity > ROOM_IDLE_MS;
  }

  private freeSlot(): number {
    const used = new Set(this.conns.flatMap((c) => c.players.map((p) => p.slot)));
    for (let s = 0; s < MAX_PLAYERS; s++) if (!used.has(s)) return s;
    return -1;
  }

  private allPlayers(): Array<{ conn: Conn; p: PlayerEntry }> {
    return this.conns
      .filter((c) => c.connected)
      .flatMap((conn) => conn.players.map((p) => ({ conn, p })))
      .sort((a, b) => a.p.slot - b.p.slot);
  }

  private unreadyAll(): void {
    for (const { p } of this.allPlayers()) p.ready = false;
  }

  addConn(ws: WebSocket, name: string): Conn | null {
    if (this.sim) return null; // no late joins mid-match (v1)
    const slot = this.freeSlot();
    if (slot < 0) return null;
    const conn: Conn = {
      id: this.nextConnId++,
      ws,
      connected: true,
      players: [this.makePlayer(slot, name)],
      latestBits: new Map(),
    };
    this.conns.push(conn);
    this.touch();
    return conn;
  }

  private makePlayer(slot: number, name: string): PlayerEntry {
    return {
      slot,
      name: (name || '').slice(0, 12) || `Player ${slot + 1}`,
      build: 'normal',
      special: 'bounce',
      team: (slot % 2) + 1,
      ready: false,
    };
  }

  removeConn(conn: Conn): void {
    conn.connected = false;
    conn.latestBits.clear();
    if (!this.sim) {
      this.conns = this.conns.filter((c) => c !== conn);
    }
    if (this.conns.every((c) => !c.connected)) {
      this.stopLoop();
      this.onEmpty(this);
      return;
    }
    if (!this.sim) {
      this.unreadyAll();
      this.broadcastLobby();
    }
  }

  handle(conn: Conn, msg: C2S): void {
    this.touch();
    switch (msg.t) {
      case 'add-local': {
        if (this.sim) return;
        if (conn.players.length >= MAX_LOCAL_PER_CONN) return;
        const slot = this.freeSlot();
        if (slot < 0) return this.send(conn, { t: 'error', msg: 'Room is full' });
        conn.players.push(this.makePlayer(slot, msg.name));
        this.unreadyAll();
        this.broadcastLobby();
        break;
      }
      case 'remove-local': {
        if (this.sim) return;
        if (conn.players.length <= 1) return; // the connection always keeps one player
        const i = conn.players.findIndex((p) => p.slot === msg.slot);
        if (i > 0) {
          conn.players.splice(i, 1);
          this.unreadyAll();
          this.broadcastLobby();
        }
        break;
      }
      case 'loadout': {
        if (this.sim) return;
        const p =
          msg.slot === undefined
            ? conn.players[0]
            : conn.players.find((q) => q.slot === msg.slot);
        if (!p) return;
        if (msg.build) p.build = msg.build;
        if (msg.special) p.special = msg.special;
        if (msg.team === 1 || msg.team === 2) p.team = msg.team;
        p.ready = false;
        this.broadcastLobby();
        break;
      }
      case 'config':
        if (this.sim || conn !== this.host) return;
        if (msg.mode === 'ffa' || msg.mode === 'team') this.mode = msg.mode;
        if (typeof msg.levelId === 'string') this.levelId = msg.levelId;
        if (typeof msg.aiCount === 'number') this.aiCount = Math.max(0, Math.min(3, Math.floor(msg.aiCount)));
        this.unreadyAll();
        this.broadcastLobby();
        break;
      case 'ready':
        if (this.sim) return;
        for (const p of conn.players) p.ready = msg.ready;
        this.broadcastLobby();
        break;
      case 'start':
        this.tryStart(conn);
        break;
      case 'input': {
        const slot = msg.slot ?? conn.players[0]?.slot;
        if (slot !== undefined && conn.players.some((p) => p.slot === slot)) {
          conn.latestBits.set(slot, msg.bits | 0);
        }
        break;
      }
      case 'ping':
        this.send(conn, { t: 'pong', ts: msg.ts });
        break;
    }
  }

  private tryStart(conn: Conn): void {
    if (this.sim || conn !== this.host) return;
    const entries = this.allPlayers();
    if (entries.length < 1) return;
    if (!entries.every(({ p }) => p.ready)) return;
    const totalAI = Math.min(this.aiCount, MAX_PLAYERS - entries.length);
    if (entries.length + totalAI < 2) return;

    const players: PlayerSetup[] = entries.map(({ p }) => ({
      slot: p.slot,
      name: p.name,
      build: p.build,
      special: p.special,
      team: this.mode === 'team' ? p.team : p.slot + 1,
      isAI: false,
    }));
    const used = new Set(players.map((p) => p.slot));
    let added = 0;
    for (let s = 0; s < MAX_PLAYERS && added < totalAI; s++) {
      if (used.has(s)) continue;
      players.push({
        slot: s,
        name: `Gnomebot ${s + 1}`,
        build: (['normal', 'fast', 'slow'] as const)[Math.floor(Math.random() * 3)],
        special: (['bounce', 'flame', 'mine'] as const)[Math.floor(Math.random() * 3)],
        team: this.mode === 'team' ? (s % 2) + 1 : s + 1,
        isAI: true,
      });
      added++;
    }
    players.sort((a, b) => a.slot - b.slot);

    const config: MatchConfig = {
      mode: this.mode,
      levelId: this.levelId,
      players,
      seed: (Math.random() * 0xffffffff) >>> 0,
    };
    this.sim = new Sim(config);
    this.eventBuffer = [];
    for (const c of this.conns) {
      if (c.connected) {
        this.send(c, { t: 'starting', config, yourSlots: c.players.map((p) => p.slot) });
      }
    }
    this.loop = setInterval(() => this.tickOnce(), TICK_MS);
  }

  private tickOnce(): void {
    const sim = this.sim;
    if (!sim) return;
    const inputs: number[] = [0, 0, 0, 0];
    for (const conn of this.conns) {
      if (!conn.connected) continue;
      for (const [slot, bits] of conn.latestBits) inputs[slot] = bits;
    }
    const events = sim.step(inputs);
    this.eventBuffer.push(...events);

    if (sim.tick % 2 === 0 || sim.over) {
      const snap = sim.snapshot(this.eventBuffer);
      this.eventBuffer = [];
      this.broadcast({ t: 'snap', snap });
    }

    if (sim.over && sim.result) {
      const result = sim.result;
      this.stopLoop();
      this.sim = null;
      this.conns = this.conns.filter((c) => c.connected);
      this.unreadyAll();
      for (const c of this.conns) c.latestBits.clear();
      this.broadcast({ t: 'end', result });
      this.broadcastLobby();
    }
  }

  private stopLoop(): void {
    if (this.loop) clearInterval(this.loop);
    this.loop = null;
  }

  lobbyView(): LobbyView {
    const host = this.host;
    return {
      code: this.code,
      mode: this.mode,
      levelId: this.levelId,
      aiCount: this.aiCount,
      players: this.allPlayers().map(({ conn, p }) => ({
        slot: p.slot,
        name: p.name,
        build: p.build,
        special: p.special,
        team: p.team,
        ready: p.ready,
        host: conn === host && p.slot === conn.players[0]?.slot,
        connected: conn.connected,
        connId: conn.id,
      })),
    };
  }

  broadcastLobby(): void {
    this.broadcast({ t: 'lobby', lobby: this.lobbyView() });
  }

  send(conn: Conn, msg: S2C): void {
    if (conn.ws.readyState === conn.ws.OPEN) conn.ws.send(JSON.stringify(msg));
  }

  broadcast(msg: S2C): void {
    const raw = JSON.stringify(msg);
    for (const c of this.conns) {
      if (c.connected && c.ws.readyState === c.ws.OPEN) c.ws.send(raw);
    }
  }

  destroy(): void {
    this.stopLoop();
  }
}

export class RoomManager {
  rooms = new Map<string, Room>();

  constructor() {
    setInterval(() => {
      for (const room of [...this.rooms.values()]) {
        if (room.isIdle()) {
          room.destroy();
          this.rooms.delete(room.code);
        }
      }
    }, 60_000).unref?.();
  }

  create(): Room {
    let code = '';
    do {
      code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    const room = new Room(code, (r) => {
      r.destroy();
      this.rooms.delete(r.code);
    });
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }
}
