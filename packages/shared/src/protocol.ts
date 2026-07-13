import type { Build, GameMode, MatchConfig, MatchResult, Snapshot, Special } from './types';

export interface LobbyPlayer {
  slot: number;
  name: string;
  build: Build;
  special: Special;
  team: number;
  ready: boolean;
  host: boolean;
  connected: boolean;
  /** connection that owns this player — one connection may own several (couch co-op online) */
  connId: number;
}

export interface LobbyView {
  code: string;
  mode: GameMode;
  levelId: string;
  aiCount: number;
  players: LobbyPlayer[];
}

export type C2S =
  | { t: 'create'; name: string }
  | { t: 'join'; code: string; name: string }
  | { t: 'add-local'; name: string } // second couch player on this connection
  | { t: 'remove-local'; slot: number }
  | { t: 'loadout'; slot?: number; build?: Build; special?: Special; team?: number }
  | { t: 'config'; mode?: GameMode; levelId?: string; aiCount?: number }
  | { t: 'ready'; ready: boolean } // applies to every player on this connection
  | { t: 'start' }
  | { t: 'input'; tick: number; bits: number; slot?: number }
  | { t: 'ping'; ts: number };

export type S2C =
  | { t: 'welcome'; code: string; slot: number; connId: number }
  | { t: 'lobby'; lobby: LobbyView }
  | { t: 'starting'; config: MatchConfig; yourSlots: number[] }
  | { t: 'snap'; snap: Snapshot }
  | { t: 'end'; result: MatchResult }
  | { t: 'back-to-lobby' }
  | { t: 'error'; msg: string }
  | { t: 'pong'; ts: number };
