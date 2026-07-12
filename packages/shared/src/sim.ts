import * as C from './constants';
import { Prng } from './prng';
import { BTN_FART, BTN_JUMP, BTN_LEFT, BTN_PACK, BTN_RIGHT, BTN_SPECIAL, InputBits } from './input';
import { LevelDef, Rect, levelById } from './levels';
import {
  BeanState,
  FartState,
  GnomeColor,
  GnomeState,
  GnomeStats,
  MatchConfig,
  MatchResult,
  SimEvent,
  Snapshot,
} from './types';
import { AiBrain } from './ai';

interface Gnome extends GnomeState {
  speed: number;
  toughness: number;
  special: 'bounce' | 'flame' | 'mine';
  name: string;
  stats: GnomeStats;
  lastHitBy: number; // slot, -1 none
  lastHitTick: number;
  flameLock: boolean; // facing locked while own flame is alive (original quirk)
}

interface HB {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function intersects(a: HB, b: HB): boolean {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function gnomeHB(g: { x: number; y: number }): HB {
  const left = g.x + C.GNOME_HB_DX;
  const top = g.y + C.GNOME_HB_DY;
  return { left, right: left + C.GNOME_HB_W, top, bottom: top + C.GNOME_HB_H };
}

function fartSize(kind: FartState['kind']): { w: number; h: number } {
  switch (kind) {
    case 'cloud':
      return { w: C.CLOUD_W, h: C.CLOUD_H };
    case 'bounce':
      return { w: C.BOUNCEY_W, h: C.BOUNCEY_H };
    case 'mine':
      return { w: C.MINE_W, h: C.MINE_H };
    case 'flame':
      return { w: C.FLAME_HB_W, h: C.FLAME_HB_H };
  }
}

function fartHB(f: FartState): HB {
  if (f.kind === 'flame') {
    // original: Rectangle(xpos + xvel, ypos - 40, 50, 120)
    const left = f.x + f.vx;
    const top = f.y + C.FLAME_HB_DY;
    return { left, right: left + C.FLAME_HB_W, top, bottom: top + C.FLAME_HB_H };
  }
  const { w, h } = fartSize(f.kind);
  return { left: f.x, right: f.x + w, top: f.y, bottom: f.y + h };
}

function beanHB(b: BeanState): HB {
  return { left: b.x, right: b.x + C.BEAN_W, top: b.y, bottom: b.y + C.BEAN_H };
}

function platHB(p: Rect): HB {
  return { left: p.x, right: p.x + p.w, top: p.y, bottom: p.y + p.h };
}

export class Sim {
  readonly config: MatchConfig;
  readonly level: LevelDef;
  readonly prng: Prng;

  tick = 0;
  countdown = C.COUNTDOWN_TICKS;
  over = false;
  result: MatchResult | null = null;

  gnomes: Gnome[] = [];
  farts: FartState[] = [];
  beans: BeanState[] = [];

  private nextId = 1;
  private beanCounter = 0;
  private events: SimEvent[] = [];
  private brains = new Map<number, AiBrain>();
  private numDeaths = 0;

  constructor(config: MatchConfig) {
    this.config = config;
    this.level = levelById(config.levelId);
    this.prng = new Prng(config.seed);

    for (const p of config.players) {
      const slotDef = C.SLOT_DEFAULTS[p.slot];
      const build = C.BUILDS[p.build];
      const g: Gnome = {
        slot: p.slot,
        color: slotDef.color as GnomeColor,
        x: slotDef.x,
        y: C.WORLD_H - 131, // 949 — standing on the floor, original value
        vx: 0,
        vy: 0,
        facing: slotDef.facing as 'L' | 'R',
        onGround: true,
        hp: C.MAX_HP,
        beans: 0,
        lives: C.START_LIVES,
        dead: false,
        packTicks: 0,
        cooldown: 0,
        team: p.team,
        isAI: p.isAI,
        speed: build.speed,
        toughness: build.toughness,
        special: p.special,
        name: p.name,
        stats: {
          shots: 0,
          hits: 0,
          kos: 0,
          deaths: 0,
          selfKos: 0,
          dmgDealt: 0,
          dmgTaken: 0,
          beansCollected: 0,
          specialsUsed: 0,
          dmgTo: [0, 0, 0, 0],
        },
        lastHitBy: -1,
        lastHitTick: -10000,
        flameLock: false,
      };
      this.gnomes.push(g);
      if (p.isAI) this.brains.set(p.slot, new AiBrain());
    }
  }

  /** Advance one 20ms tick. `inputs[slot]` = bitmask for human slots (AI ignores it). */
  step(inputs: InputBits[]): SimEvent[] {
    this.events = [];
    if (this.over) return this.events;

    this.tick++;

    if (this.countdown > 0) {
      this.countdown--;
      if (this.countdown === 0) this.events.push({ t: 'go' });
      return this.events;
    }

    // Refresh flame facing-lock before inputs (original: can't turn while flaming)
    for (const g of this.gnomes) {
      g.flameLock = this.farts.some((f) => f.kind === 'flame' && f.owner === g.slot);
    }

    // 1. Inputs (original bindKeyHandlers ran before step)
    for (const g of this.gnomes) {
      if (g.dead) continue;
      const bits = g.isAI ? this.brains.get(g.slot)!.think(this, g) : (inputs[g.slot] ?? 0);
      this.applyInput(g, bits);
    }

    // 2. Original step() order: fart hits → gnome/terrain → fart/terrain → beans → move
    this.checkFartCollisions();
    this.checkGnomeStaticCollisions();
    this.checkFartStaticCollisions();
    this.checkBeanCollisions();
    this.moveGnomes();
    this.moveFarts();

    // 3. Timers
    for (const g of this.gnomes) {
      if (g.packTicks > 0) g.packTicks--;
      if (g.cooldown > 0) g.cooldown--;
    }
    this.tickFartTimers();

    // 4. Spawns
    this.spawnBeans();

    // 5. Win check
    this.checkOver();
    return this.events;
  }

  // ---------------------------------------------------------------- inputs

  private applyInput(g: Gnome, bits: InputBits): void {
    if (bits & BTN_LEFT) this.run(g, 'L');
    if (bits & BTN_RIGHT) this.run(g, 'R');
    if (bits & BTN_JUMP) this.jump(g);
    if (bits & BTN_PACK) this.firePack(g);
    if (bits & BTN_FART) this.fireFart(g);
    if (bits & BTN_SPECIAL) this.fireSpecial(g);
  }

  private run(g: Gnome, dir: 'L' | 'R'): void {
    if (!g.flameLock) g.facing = dir;
    const sign = dir === 'L' ? -1 : 1;
    if (g.onGround) {
      g.vx += sign * g.speed;
      if (g.vx > C.GROUND_SPEED_CAP) g.vx = C.GROUND_SPEED_CAP;
      if (g.vx < -C.GROUND_SPEED_CAP) g.vx = -C.GROUND_SPEED_CAP;
    } else if (g.packTicks > 0) {
      g.vx = sign * C.PACK_RUN_VEL;
    } else {
      g.vx = sign * C.AIR_RUN_VEL;
    }
  }

  private jump(g: Gnome): void {
    if (g.onGround) {
      g.vy = C.JUMP_VEL;
      this.events.push({ t: 'jump', slot: g.slot });
    }
  }

  private firePack(g: Gnome): void {
    if (g.beans >= C.PACK_COST && g.packTicks === 0) {
      g.packTicks = C.PACK_TICKS;
      g.vy = C.PACK_BOOST_VY;
      g.beans -= C.PACK_COST;
      this.events.push({ t: 'pack', slot: g.slot });
    }
  }

  /** Standard fart — fires BACKWARDS, recoil pushes the gnome FORWARD. */
  private fireFart(g: Gnome): void {
    if (g.cooldown > 0) return;
    g.cooldown = C.FART_COOLDOWN_TICKS;
    const back = g.facing === 'L' ? 1 : -1; // projectile goes opposite to facing
    g.vx += -back * C.FART_RECOIL;
    g.stats.shots++;
    this.farts.push({
      id: this.nextId++,
      kind: 'cloud',
      x: g.x,
      y: g.y,
      vx: back * C.FART_SPEED,
      vy: g.vy * C.FART_VY_FACTOR,
      owner: g.slot,
      team: g.team,
      ttl: -1,
      stuck: false,
    });
    this.events.push({ t: 'shoot', slot: g.slot, kind: 'cloud', x: g.x, y: g.y });
  }

  private fireSpecial(g: Gnome): void {
    if (g.cooldown > 0) return;
    if (g.beans < C.SPECIAL_COST) return;
    g.beans -= C.SPECIAL_COST;
    g.cooldown = C.FART_COOLDOWN_TICKS;
    g.stats.shots++;
    g.stats.specialsUsed++;
    const back = g.facing === 'L' ? 1 : -1;
    g.vx += -back * C.FART_RECOIL;

    if (g.special === 'bounce') {
      this.farts.push({
        id: this.nextId++,
        kind: 'bounce',
        x: g.x,
        y: g.y,
        vx: back * C.FART_SPEED,
        vy: g.vy * C.FART_VY_FACTOR,
        owner: g.slot,
        team: g.team,
        ttl: C.BOUNCE_TTL_TICKS,
        stuck: false,
      });
    } else if (g.special === 'mine') {
      this.farts.push({
        id: this.nextId++,
        kind: 'mine',
        x: g.x,
        y: g.y,
        vx: back * C.MINE_VX,
        vy: C.MINE_VY,
        owner: g.slot,
        team: g.team,
        ttl: C.MINE_ARM_TICKS,
        stuck: false,
      });
    } else {
      // flame: spawns offset toward the butt, hitbox drifts backwards for 1.5 s
      const x = g.facing === 'L' ? g.x + C.FLAME_SPAWN_AHEAD : g.x + C.FLAME_SPAWN_BEHIND;
      this.farts.push({
        id: this.nextId++,
        kind: 'flame',
        x,
        y: g.y,
        vx: g.facing === 'L' ? -C.FLAME_DRIFT : C.FLAME_DRIFT, // original sign convention; move() does x -= vx
        vy: g.vy * C.FLAME_VY_FACTOR,
        owner: g.slot,
        team: g.team,
        ttl: C.FLAME_TTL_TICKS,
        stuck: false,
      });
      g.flameLock = true;
    }
    this.events.push({ t: 'shoot', slot: g.slot, kind: g.special, x: g.x, y: g.y });
  }

  // ------------------------------------------------------------ collisions

  private checkFartCollisions(): void {
    for (const g of this.gnomes) {
      if (g.dead) continue;
      const hb = gnomeHB(g);
      for (const f of [...this.farts]) {
        if (!intersects(hb, fartHB(f))) continue;
        if (f.kind === 'mine') {
          if (f.ttl > 0) continue; // not armed yet
          this.damage(g, C.MINE_STR, f.owner, true);
          this.removeFart(f);
        } else if (f.kind === 'flame') {
          if (f.team === g.team) continue;
          this.damage(g, C.FLAME_STR * (f.ttl / C.FLAME_TTL_TICKS), f.owner, false, true);
        } else {
          if (f.team === g.team) continue;
          this.damage(g, f.kind === 'bounce' ? C.BOUNCE_STR : C.FART_STR, f.owner, false);
          this.removeFart(f);
        }
      }
    }
  }

  /** Original utils.js gnome↔platform logic, ported branch-for-branch. */
  private checkGnomeStaticCollisions(): void {
    for (const g of this.gnomes) {
      if (g.dead) continue;
      g.onGround = false;
      for (const p of this.level.platforms) {
        if (g.onGround) continue; // original guard: later platforms skipped once grounded
        const mo = gnomeHB(g);
        const so = platHB(p);
        // top (landing)
        if (
          mo.bottom >= so.top &&
          mo.bottom <= so.bottom &&
          mo.right <= so.right + C.LAND_SLOP_X &&
          mo.left >= so.left - C.LAND_SLOP_X
        ) {
          if (g.vy >= 0) {
            g.vy = 0;
            g.y = so.top - C.GNOME_LAND_OFFSET;
            g.onGround = true;
          }
          continue;
        }
        // side push-out
        if (mo.right < so.right && mo.right > so.left - 10) {
          if ((mo.top > so.top && mo.top < so.bottom) || (mo.bottom - 6 > so.top && mo.bottom < so.bottom)) {
            if (g.facing === 'R' && g.vx > 1) g.vx = -1;
            else g.vx = -2;
          }
        } else if (mo.left < so.right + 10 && mo.left > so.left) {
          if ((mo.top >= so.top && mo.bottom <= so.bottom) || (mo.bottom - 6 > so.top && mo.bottom < so.bottom)) {
            if (g.facing === 'L' && g.vx < -1) g.vx = 1;
            else g.vx = 2;
          }
        }
        // head bump
        if (
          mo.top <= so.bottom - 1 &&
          mo.top >= so.top + 1 &&
          mo.left <= so.right &&
          mo.right >= so.left
        ) {
          g.vy = C.HEAD_BUMP_VY;
        }
      }
    }
  }

  private checkFartStaticCollisions(): void {
    for (const f of this.farts) {
      if (f.kind !== 'bounce' && f.kind !== 'mine') continue;
      if (f.stuck) continue;
      for (const p of this.level.platforms) {
        const mo = fartHB(f);
        const so = platHB(p);
        const inTopBand =
          mo.bottom >= so.top &&
          mo.bottom <= so.bottom &&
          mo.right <= so.right + C.FART_LAND_SLOP_X &&
          mo.left >= so.left - C.FART_LAND_SLOP_X;
        if (inTopBand && f.vy >= 0) {
          if (f.kind === 'mine') {
            f.vy = 0;
            f.vx = 0;
            f.y = so.top - C.MINE_STICK_OFFSET;
            f.stuck = true;
          } else {
            f.y = so.top - C.BOUNCE_GROUND_OFFSET;
            f.vy = -f.vy;
          }
          break;
        }
        if (f.kind === 'bounce') {
          const underside =
            mo.top <= so.bottom - 1 &&
            mo.top >= so.top + 1 &&
            mo.right <= so.right + C.LAND_SLOP_X &&
            mo.left >= so.left - C.LAND_SLOP_X;
          if (underside) {
            f.vy = -f.vy;
            break;
          }
          const side =
            ((mo.right >= so.left && mo.right <= so.right) || (mo.left <= so.right && mo.left >= so.left)) &&
            mo.top >= so.top &&
            mo.bottom <= so.bottom;
          if (side) {
            f.vx = -f.vx;
            break;
          }
        }
      }
    }
  }

  private checkBeanCollisions(): void {
    for (const g of this.gnomes) {
      if (g.dead) continue;
      const hb = gnomeHB(g);
      for (const b of [...this.beans]) {
        if (intersects(hb, beanHB(b))) {
          g.beans = Math.min(C.BEAN_METER_MAX, g.beans + C.BEAN_VALUE);
          g.stats.beansCollected++;
          this.beans.splice(this.beans.indexOf(b), 1);
          this.events.push({ t: 'pickup', slot: g.slot, x: b.x, y: b.y });
        }
      }
    }
  }

  // -------------------------------------------------------------- movement

  private moveGnomes(): void {
    for (const g of this.gnomes) {
      if (g.dead) continue;
      if (g.onGround) {
        if (g.vx !== 0) {
          if (Math.abs(g.vx) < C.STOP_EPSILON) g.vx = 0;
          g.vx *= C.GROUND_FRICTION;
        }
      }
      const packing = g.packTicks > 0;
      if (packing && !g.onGround) {
        g.vy += C.PACK_GRAVITY;
        g.vx *= C.PACK_DRAG;
      } else if (!g.onGround) {
        g.vy += C.GRAVITY;
        g.vx *= C.AIR_DRAG;
      }
      g.x += g.vx;
      g.y += g.vy;

      // wrap (original Game.wrap)
      if (g.x < 0) g.x = C.WORLD_W + g.x;
      else if (g.x > C.WORLD_W) g.x = g.x - C.WORLD_W;
      if (g.y < C.CEILING_Y) g.y = C.CEILING_Y;

      if (g.y > C.KILL_Y) this.loseLife(g, 'fall');
    }
  }

  private moveFarts(): void {
    for (const f of [...this.farts]) {
      if (f.kind === 'flame') {
        f.x -= f.vx; // original: drifts away from the gnome's facing
        continue;
      }
      f.x += f.vx;
      f.y += f.vy;
      if (f.kind === 'bounce') {
        // wrappable both axes, like the original game.wrap
        if (f.x < 0) f.x = C.WORLD_W + f.x;
        else if (f.x > C.WORLD_W) f.x = f.x - C.WORLD_W;
        if (f.y < 0) f.y = C.WORLD_H + f.y;
        else if (f.y > C.WORLD_H) f.y = f.y - C.WORLD_H;
      } else if (f.x < 0 || f.y < 0 || f.x > C.WORLD_W || f.y > C.WORLD_H) {
        this.removeFart(f);
      }
    }
  }

  private tickFartTimers(): void {
    for (const f of [...this.farts]) {
      if (f.kind === 'bounce' || f.kind === 'flame') {
        f.ttl--;
        if (f.ttl <= 0) this.removeFart(f);
      } else if (f.kind === 'mine' && f.ttl > 0) {
        f.ttl--; // reaches 0 = armed; mine persists until touched
      }
    }
  }

  // ------------------------------------------------------------ damage/lives

  private damage(victim: Gnome, strength: number, attackerSlot: number, big: boolean, quiet = false): void {
    const attacker = this.gnomes[attackerSlot] ?? null;
    const dmg = strength / victim.toughness;
    victim.hp -= dmg;
    victim.stats.dmgTaken += dmg;
    if (attacker) {
      attacker.stats.dmgDealt += dmg;
      attacker.stats.dmgTo[victim.slot] += dmg;
      attacker.stats.hits += quiet ? 0.1 : 1; // flame counted 0.1/tick in the original
    }
    victim.lastHitBy = attackerSlot;
    victim.lastHitTick = this.tick;
    if (!quiet) {
      const hb = gnomeHB(victim);
      this.events.push({
        t: 'hit',
        x: (hb.left + hb.right) / 2,
        y: (hb.top + hb.bottom) / 2,
        big,
        victim: victim.slot,
        attacker: attackerSlot,
      });
    }
    if (victim.hp <= 0) this.loseLife(victim, 'ko');
  }

  private loseLife(g: Gnome, cause: 'ko' | 'fall'): void {
    g.lives--;
    g.stats.deaths++;

    // KO attribution: recent damager gets credit, otherwise it's on you
    const recent = this.tick - g.lastHitTick <= C.KO_CREDIT_TICKS ? g.lastHitBy : -1;
    const credit = cause === 'ko' ? g.lastHitBy : recent;
    if (credit >= 0 && credit !== g.slot) this.gnomes[credit].stats.kos++;
    else g.stats.selfKos++;

    if (g.lives < 1) {
      g.dead = true;
      g.hp = 0;
      this.numDeaths++;
      this.events.push({ t: 'death', slot: g.slot, color: g.color, x: g.x, y: g.y });
      g.x = -1000;
      g.y = -1000;
      g.vx = 0;
      g.vy = 0;
    } else {
      // Respawn above a random platform. (Deviation from 2014's anywhere-including-
      // over-the-pit respawn: on the new wide-pit levels that caused instant re-deaths.)
      const plats = this.level.platforms;
      const p = plats[this.prng.int(plats.length)];
      const margin = 40;
      const span = Math.max(1, p.w - C.GNOME_W - margin * 2);
      g.x = p.x + margin + span * this.prng.next();
      g.y = Math.max(C.CEILING_Y, p.y - C.GNOME_LAND_OFFSET - 220 - 200 * this.prng.next());
      g.vx = 0;
      g.vy = 0;
      g.hp = C.MAX_HP;
      g.lastHitBy = -1;
      g.lastHitTick = -10000;
      this.events.push({ t: 'respawn', slot: g.slot, x: g.x, y: g.y });
    }
  }

  private removeFart(f: FartState): void {
    const i = this.farts.indexOf(f);
    if (i >= 0) this.farts.splice(i, 1);
    if (f.kind === 'mine') {
      this.events.push({ t: 'hit', x: f.x + C.MINE_W / 2, y: f.y + C.MINE_H / 2, big: true, victim: -1, attacker: f.owner });
    }
  }

  // ---------------------------------------------------------------- spawns

  private spawnBeans(): void {
    const humanCount = this.config.players.filter((p) => !p.isAI).length;
    const paceBy = this.config.mode === 'single' ? this.config.players.length : humanCount;
    const { rate, cap } = C.beanPacing(Math.max(2, Math.min(4, paceBy)));
    this.beanCounter += C.BEAN_COUNTER_STEP;
    if (this.beanCounter > rate && this.beans.length < cap) {
      const pos = this.randomBeanPos();
      if (pos) {
        this.beans.push({ id: this.nextId++, x: pos[0], y: pos[1] });
        this.beanCounter = 0;
      }
    }
  }

  private randomBeanPos(): [number, number] | null {
    for (let attempt = 0; attempt < 25; attempt++) {
      const x = Math.ceil(C.WORLD_W * this.prng.next());
      const y = Math.ceil(C.BEAN_SPAWN_MAX_Y * this.prng.next());
      const hb: HB = { left: x, right: x + C.BEAN_W, top: y, bottom: y + C.BEAN_H };
      const collides = this.level.platforms.some((p) => intersects(hb, platHB(p)));
      if (!collides) return [x, y];
    }
    return null;
  }

  // ------------------------------------------------------------------ end

  private checkOver(): void {
    if (this.over) return;
    const mode = this.config.mode;
    const players = this.gnomes;
    const living = players.filter((g) => !g.dead);

    let done = false;
    if (mode === 'single') {
      const human = players.find((g) => !g.isAI)!;
      const aiCount = players.filter((g) => g.isAI).length;
      const deadAI = players.filter((g) => g.isAI && g.dead).length;
      if (human.dead || deadAI === aiCount) done = true;
    } else if (this.numDeaths >= players.length - 1) {
      done = true;
    } else if (mode === 'team') {
      const teams = new Set(living.map((g) => g.team));
      if (teams.size <= 1) done = true;
    }
    if (!done) return;

    this.over = true;
    const winners = living.map((g) => g.slot);
    const winnerTeam = living[0]?.team ?? -1;
    let text: string;
    if (mode === 'single') {
      const human = players.find((g) => !g.isAI)!;
      text = human.dead ? 'You Lose!' : 'You Win!';
    } else if (mode === 'team') {
      text = `Team ${winnerTeam} Wins!`;
    } else {
      text = living.length ? `${living[0].name} Wins!` : 'Draw!';
    }
    this.result = {
      winnerSlots: winners,
      winnerTeam,
      text,
      mode,
      durationTicks: this.tick,
      stats: players.map((g) => ({
        ...g.stats,
        slot: g.slot,
        name: g.name,
        color: g.color,
        team: g.team,
        isAI: g.isAI,
      })),
    };
    this.events.push({ t: 'end', winnerSlots: winners, winnerTeam, text });
  }

  // ------------------------------------------------------------- snapshots

  snapshot(events: SimEvent[]): Snapshot {
    return {
      tick: this.tick,
      countdown: this.countdown,
      over: this.over,
      gnomes: this.gnomes.map((g) => ({
        slot: g.slot,
        color: g.color,
        x: g.x,
        y: g.y,
        vx: g.vx,
        vy: g.vy,
        facing: g.facing,
        onGround: g.onGround,
        hp: g.hp,
        beans: g.beans,
        lives: g.lives,
        dead: g.dead,
        packTicks: g.packTicks,
        cooldown: g.cooldown,
        team: g.team,
        isAI: g.isAI,
      })),
      farts: this.farts.map((f) => ({ ...f })),
      beans: this.beans.map((b) => ({ ...b })),
      events,
    };
  }
}
