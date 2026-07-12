// Parity constants — sourced from REFACTOR_PLAN.md §2.5 and the original lib/.
// Do not "fix" values here without updating the plan; the feel of the game lives in them.

export const WORLD_W = 1920;
export const WORLD_H = 1080;
export const TICK_MS = 20; // 50 Hz, same as the 2014 game loop
export const TICKS_PER_SEC = 1000 / TICK_MS;

// Gnome physics (original gnome.js)
export const GRAVITY = 1;
export const PACK_GRAVITY = 0.1;
export const JUMP_VEL = -25;
export const GROUND_FRICTION = 0.92;
export const AIR_DRAG = 0.92;
export const PACK_DRAG = 0.98;
export const STOP_EPSILON = 0.15;
export const GROUND_SPEED_CAP = 20; // replaces the original >20→10 sawtooth (approved change)
export const AIR_RUN_VEL = 10; // xvel is SET to ±10 mid-air
export const PACK_RUN_VEL = 3; // xvel is SET to ±3 while fart-packing
export const CEILING_Y = 50; // y clamped to >= 50
export const KILL_Y = 1020; // fall below → lose a life
export const IDLE_ANIM_EPSILON = 0.8; // |vx| below this renders idle

// Gnome hitbox: original hitBox() = (x+15, y-115, 104-27, 191-20).
// x/y keep the original sprite-anchor semantics (standing on top T ⇒ y = T - 51).
export const GNOME_HB_DX = 15;
export const GNOME_HB_DY = -115;
export const GNOME_HB_W = 77;
export const GNOME_HB_H = 171;
export const GNOME_LAND_OFFSET = 51; // y = platformTop - 51 when landing
export const GNOME_W = 104;
export const GNOME_H = 191;

// Landing/side-collision slop from the original utils.js
export const LAND_SLOP_X = 50; // platforms are 50px "wider" for landing purposes
export const FART_LAND_SLOP_X = 34;
export const HEAD_BUMP_VY = 5;

// Health / lives / meters
export const MAX_HP = 100;
export const START_LIVES = 3;
export const BEAN_VALUE = 20;
export const BEAN_METER_MAX = 100;
export const SPECIAL_COST = 5; // now also the minimum (original checked >=1, approved fix)
export const PACK_COST = 5;
export const PACK_TICKS = 50; // 1000 ms of thrust
export const PACK_BOOST_VY = -5;

// Attacks — REMEMBER: all attacks fire BACKWARDS (out of the butt) with forward recoil.
export const FART_COOLDOWN_TICKS = 18; // ~360 ms
export const FART_RECOIL = 2.5;
export const FART_SPEED = 8;
export const FART_VY_FACTOR = 0.2;
export const FART_STR = 2;

export const BOUNCE_STR = 3;
export const BOUNCE_TTL_TICKS = 500; // 10 s

export const MINE_STR = 25;
export const MINE_VX = 0.8; // gentle backwards toss (original ±8 × 0.1)
export const MINE_VY = 5;
export const MINE_ARM_TICKS = 50; // 1 s
export const MINE_STICK_OFFSET = 11; // y = platformTop - 1 - radius(10)
export const BOUNCE_GROUND_OFFSET = 30; // y = platformTop - 20 - radius(10)

export const FLAME_TTL_TICKS = 75; // 1.5 s
export const FLAME_STR = 0.2; // per contact tick, scaled by remaining fraction
export const FLAME_DRIFT = 4; // hitbox drifts backwards 4 px/tick
export const FLAME_SPAWN_AHEAD = 80; // original: facing Left → x+80, else x-10
export const FLAME_SPAWN_BEHIND = -10;
export const FLAME_HB_W = 50;
export const FLAME_HB_H = 120;
export const FLAME_HB_DY = -40;
export const FLAME_VY_FACTOR = 0.1;

// Projectile hitbox sizes = original sprite frame sizes (measured from the sheets)
export const CLOUD_W = 105;
export const CLOUD_H = 65;
export const BOUNCEY_W = 132;
export const BOUNCEY_H = 97;
export const MINE_W = 68;
export const MINE_H = 57;
export const BEAN_W = 60;
export const BEAN_H = 87;

// Bean spawn pacing (original game.js addBeans) — counter += 20/tick
export const BEAN_COUNTER_STEP = 20;
export function beanPacing(numPlayers: number): { rate: number; cap: number } {
  if (numPlayers <= 2) return { rate: 2500, cap: 11 };
  if (numPlayers === 3) return { rate: 2300, cap: 14 };
  return { rate: 2000, cap: 16 };
}
export const BEAN_SPAWN_MAX_Y = 900;

// Builds
export const BUILDS = {
  normal: { speed: 1, toughness: 1 },
  fast: { speed: 2, toughness: 0.5 },
  slow: { speed: 0.5, toughness: 2 },
} as const;

// Player slots (original playerStartingSettings). y = 949 = floorTop(1000) - 51.
export const SLOT_DEFAULTS = [
  { x: 100, color: 'blue', facing: 'R' },
  { x: 1640, color: 'orange', facing: 'L' },
  { x: 300, color: 'purple', facing: 'R' },
  { x: 1340, color: 'green', facing: 'R' },
] as const;

export const COUNTDOWN_TICKS = 150; // 3-2-1 before inputs enable
export const KO_CREDIT_TICKS = 150; // knocked into pit within 3s of a hit → attacker's KO

// Original death-gib velocities (death.js), part order:
// leg, leg2, boot, boot2, hat, hand, head, torso
export const GIB_VELS: ReadonlyArray<readonly [number, number]> = [
  [-24, -9],
  [-16, 9],
  [-15, 15],
  [-20, 15],
  [8, -16],
  [13, 2],
  [-12, -2],
  [20, -10],
];
