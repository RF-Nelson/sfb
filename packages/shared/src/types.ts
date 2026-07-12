export type Build = 'normal' | 'fast' | 'slow';
export type Special = 'bounce' | 'flame' | 'mine';
export type GnomeColor = 'blue' | 'orange' | 'purple' | 'green';
export type Facing = 'L' | 'R';
export type GameMode = 'single' | 'ffa' | 'team';
export type FartKind = 'cloud' | 'bounce' | 'mine' | 'flame';

export interface PlayerSetup {
  slot: number; // 0..3
  name: string;
  build: Build;
  special: Special;
  team: number; // ffa/single: slot+1 for humans, AI own teams; team mode: 1|2
  isAI: boolean;
}

export interface MatchConfig {
  mode: GameMode;
  levelId: string;
  players: PlayerSetup[];
  seed: number;
}

export interface GnomeState {
  slot: number;
  color: GnomeColor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  onGround: boolean;
  hp: number;
  beans: number;
  lives: number;
  dead: boolean;
  packTicks: number; // >0 while fart-packing
  cooldown: number; // >0 while in fart animation / can't fire
  team: number;
  isAI: boolean;
}

export interface FartState {
  id: number;
  kind: FartKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: number; // slot
  team: number;
  ttl: number; // ticks remaining (bounce/flame); mine: arm countdown then -1 when armed
  stuck: boolean; // mines
}

export interface BeanState {
  id: number;
  x: number;
  y: number;
}

export interface GnomeStats {
  shots: number;
  hits: number;
  kos: number;
  deaths: number;
  selfKos: number;
  dmgDealt: number;
  dmgTaken: number;
  beansCollected: number;
  specialsUsed: number;
  dmgTo: number[]; // by victim slot
}

export type SimEvent =
  | { t: 'hit'; x: number; y: number; big: boolean; victim: number; attacker: number }
  | { t: 'death'; slot: number; color: GnomeColor; x: number; y: number }
  | { t: 'respawn'; slot: number; x: number; y: number }
  | { t: 'pickup'; slot: number; x: number; y: number }
  | { t: 'shoot'; slot: number; kind: FartKind; x: number; y: number }
  | { t: 'jump'; slot: number }
  | { t: 'pack'; slot: number }
  | { t: 'go' }
  | { t: 'end'; winnerSlots: number[]; winnerTeam: number; text: string };

export interface Snapshot {
  tick: number;
  countdown: number; // ticks until GO (0 = playing)
  over: boolean;
  gnomes: GnomeState[];
  farts: FartState[];
  beans: BeanState[];
  events: SimEvent[];
}

export interface MatchResult {
  winnerSlots: number[];
  winnerTeam: number;
  text: string;
  mode: GameMode;
  stats: Array<GnomeStats & { slot: number; name: string; color: GnomeColor; team: number; isAI: boolean }>;
  durationTicks: number;
}
