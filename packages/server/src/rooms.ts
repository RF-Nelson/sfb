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
const ROOM_IDLE_MS = 15 * 60 * 1000;

interface Client {
  ws: WebSocket;
  slot: number;
  name: string;
  build: Build;
  special: Special;
  team: number;
  ready: boolean;
  latestBits: number;
  connected: boolean;
}

export class Room {
  code: string;
  mode: GameMode = 'ffa';
  levelId = 'garden';
  aiCount = 0;
  clients: Client[] = [];
  sim: Sim | null = null;
  private loop: ReturnType<typeof setInterval> | null = null;
  private eventBuffer: SimEvent[] = [];
  private lastActivity = Date.now();

  constructor(code: string, private onEmpty: (room: Room) => void) {
    this.code = code;
  }

  get host(): Client | undefined {
    return this.clients.find((c) => c.connected);
  }

  touch(): void {
    this.lastActivity = Date.now();
  }

  isIdle(): boolean {
    return Date.now() - this.lastActivity > ROOM_IDLE_MS;
  }

  addClient(ws: WebSocket, name: string): Client | null {
    if (this.sim) return null; // no late joins mid-match (v1)
    const used = new Set(this.clients.map((c) => c.slot));
    let slot = -1;
    for (let s = 0; s < MAX_PLAYERS; s++) {
      if (!used.has(s)) {
        slot = s;
        break;
      }
    }
    if (slot < 0) return null;
    const client: Client = {
      ws,
      slot,
      name: name.slice(0, 12) || `Player ${slot + 1}`,
      build: 'normal',
      special: 'bounce',
      team: (slot % 2) + 1,
      ready: false,
      latestBits: 0,
      connected: true,
    };
    this.clients.push(client);
    this.clients.sort((a, b) => a.slot - b.slot);
    this.touch();
    return client;
  }

  removeClient(client: Client): void {
    client.connected = false;
    client.latestBits = 0;
    if (!this.sim) {
      this.clients = this.clients.filter((c) => c !== client);
    }
    if (this.clients.every((c) => !c.connected)) {
      this.stopLoop();
      this.onEmpty(this);
      return;
    }
    this.broadcastLobbyIfIdle();
  }

  handle(client: Client, msg: C2S): void {
    this.touch();
    switch (msg.t) {
      case 'loadout':
        if (this.sim) return;
        if (msg.build) client.build = msg.build;
        if (msg.special) client.special = msg.special;
        if (msg.team === 1 || msg.team === 2) client.team = msg.team;
        client.ready = false;
        this.broadcastLobby();
        break;
      case 'config':
        if (this.sim || client !== this.host) return;
        if (msg.mode === 'ffa' || msg.mode === 'team') this.mode = msg.mode;
        if (typeof msg.levelId === 'string') this.levelId = msg.levelId;
        if (typeof msg.aiCount === 'number') this.aiCount = Math.max(0, Math.min(3, Math.floor(msg.aiCount)));
        for (const c of this.clients) c.ready = false;
        this.broadcastLobby();
        break;
      case 'ready':
        if (this.sim) return;
        client.ready = msg.ready;
        this.broadcastLobby();
        break;
      case 'start':
        this.tryStart(client);
        break;
      case 'input':
        client.latestBits = msg.bits | 0;
        break;
      case 'ping':
        this.send(client, { t: 'pong', ts: msg.ts });
        break;
    }
  }

  private tryStart(client: Client): void {
    if (this.sim || client !== this.host) return;
    const humans = this.clients.filter((c) => c.connected);
    if (humans.length < 1) return;
    if (!humans.every((c) => c.ready)) return;
    const totalAI = Math.min(this.aiCount, MAX_PLAYERS - humans.length);
    if (humans.length + totalAI < 2) return;

    const players: PlayerSetup[] = humans.map((c) => ({
      slot: c.slot,
      name: c.name,
      build: c.build,
      special: c.special,
      team: this.mode === 'team' ? c.team : c.slot + 1,
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
    for (const c of this.clients) {
      if (c.connected) this.send(c, { t: 'starting', config, yourSlot: c.slot });
    }
    this.loop = setInterval(() => this.tickOnce(), TICK_MS);
  }

  private tickOnce(): void {
    const sim = this.sim;
    if (!sim) return;
    const inputs: number[] = [0, 0, 0, 0];
    for (const c of this.clients) inputs[c.slot] = c.connected ? c.latestBits : 0;
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
      for (const c of this.clients) c.ready = false;
      this.clients = this.clients.filter((c) => c.connected);
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
      players: this.clients
        .filter((c) => c.connected)
        .map((c) => ({
          slot: c.slot,
          name: c.name,
          build: c.build,
          special: c.special,
          team: c.team,
          ready: c.ready,
          host: c === host,
          connected: c.connected,
        })),
    };
  }

  broadcastLobby(): void {
    this.broadcast({ t: 'lobby', lobby: this.lobbyView() });
  }

  private broadcastLobbyIfIdle(): void {
    if (!this.sim) this.broadcastLobby();
  }

  send(client: Client, msg: S2C): void {
    if (client.ws.readyState === client.ws.OPEN) client.ws.send(JSON.stringify(msg));
  }

  broadcast(msg: S2C): void {
    const raw = JSON.stringify(msg);
    for (const c of this.clients) {
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
