import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import type { C2S } from 'sfb-shared';
import { Room, RoomManager } from './rooms';
import { handleStatic } from './static';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = process.env.CLIENT_DIR ?? resolve(moduleDir, '../../client/dist');
const CLASSIC_DIR = process.env.CLASSIC_DIR ?? resolve(moduleDir, '../../../classic-dist');
const PORT = Number(process.env.PORT ?? 8080);

const manager = new RoomManager();

const http = createServer((req, res) => handleStatic(req, res, CLIENT_DIR, CLASSIC_DIR));
const wss = new WebSocketServer({ server: http, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let room: Room | null = null;
  let conn: ReturnType<Room['addConn']> = null;

  const send = (msg: unknown) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };

  ws.on('message', (raw) => {
    let msg: C2S;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!msg || typeof msg.t !== 'string') return;

    if (msg.t === 'create') {
      if (room) return;
      room = manager.create();
      conn = room.addConn(ws, msg.name ?? '');
      if (!conn) return send({ t: 'error', msg: 'Could not create room' });
      send({ t: 'welcome', code: room.code, slot: conn.players[0].slot, connId: conn.id });
      room.broadcastLobby();
      return;
    }
    if (msg.t === 'join') {
      if (room) return;
      const found = manager.get(msg.code ?? '');
      if (!found) return send({ t: 'error', msg: 'Room not found' });
      conn = found.addConn(ws, msg.name ?? '');
      if (!conn) return send({ t: 'error', msg: 'Room is full or already playing' });
      room = found;
      send({ t: 'welcome', code: room.code, slot: conn.players[0].slot, connId: conn.id });
      room.broadcastLobby();
      return;
    }
    if (room && conn) room.handle(conn, msg);
  });

  ws.on('close', () => {
    if (room && conn) room.removeConn(conn);
    room = null;
    conn = null;
  });
});

http.listen(PORT, () => {
  console.log(`SFB server on :${PORT}`);
  console.log(`  client: ${CLIENT_DIR}`);
  console.log(`  classic: ${CLASSIC_DIR}`);
});
