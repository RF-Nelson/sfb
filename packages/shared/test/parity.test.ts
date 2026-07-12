import { describe, expect, it } from 'vitest';
import {
  BTN_FART,
  BTN_JUMP,
  BTN_PACK,
  BTN_RIGHT,
  BTN_SPECIAL,
  COUNTDOWN_TICKS,
  MatchConfig,
  PlayerSetup,
  Sim,
} from '../src/index';

function player(slot: number, overrides: Partial<PlayerSetup> = {}): PlayerSetup {
  return {
    slot,
    name: `P${slot + 1}`,
    build: 'normal',
    special: 'bounce',
    team: slot + 1,
    isAI: false,
    ...overrides,
  };
}

function makeSim(players: PlayerSetup[], mode: MatchConfig['mode'] = 'ffa', seed = 1234): Sim {
  const sim = new Sim({ mode, levelId: 'garden', players, seed });
  // burn the countdown so tests exercise live gameplay
  for (let i = 0; i < COUNTDOWN_TICKS; i++) sim.step([]);
  return sim;
}

const IDLE: number[] = [0, 0, 0, 0];

describe('spawn parity', () => {
  it('gnomes spawn standing on the floor at original coordinates', () => {
    const sim = makeSim([player(0), player(1)]);
    sim.step(IDLE);
    expect(sim.gnomes[0].x).toBeCloseTo(100);
    expect(sim.gnomes[0].y).toBeCloseTo(949); // floorTop(1000) - 51
    expect(sim.gnomes[0].onGround).toBe(true);
    expect(sim.gnomes[1].facing).toBe('L');
    expect(sim.gnomes[0].lives).toBe(3);
    expect(sim.gnomes[0].hp).toBe(100);
  });
});

describe('backwards-firing farts (signature mechanic)', () => {
  it('facing Right fires the cloud LEFT and recoils the gnome forward (+x)', () => {
    const sim = makeSim([player(0), player(1)]);
    const before = sim.gnomes[0].vx;
    sim.step([BTN_FART, 0]);
    expect(sim.farts).toHaveLength(1);
    expect(sim.farts[0].vx).toBe(-8); // projectile goes backwards
    expect(sim.gnomes[0].vx).toBeGreaterThan(before); // recoil pushes forward
    expect(sim.gnomes[0].stats.shots).toBe(1);
  });

  it('cooldown blocks refire for 18 ticks', () => {
    const sim = makeSim([player(0), player(1)]);
    for (let i = 0; i < 10; i++) sim.step([BTN_FART, 0]);
    expect(sim.gnomes[0].stats.shots).toBe(1);
    for (let i = 0; i < 9; i++) sim.step([BTN_FART, 0]);
    expect(sim.gnomes[0].stats.shots).toBe(2);
  });
});

describe('specials', () => {
  it('special requires 5 beans and costs 5', () => {
    const sim = makeSim([player(0), player(1)]);
    sim.gnomes[0].beans = 4;
    sim.step([BTN_SPECIAL, 0]);
    expect(sim.farts).toHaveLength(0);
    sim.gnomes[0].beans = 5;
    sim.step([BTN_SPECIAL, 0]);
    expect(sim.farts).toHaveLength(1);
    expect(sim.gnomes[0].beans).toBe(0);
    expect(sim.farts[0].kind).toBe('bounce');
  });

  it('mine arms after 50 ticks and hurts its own thrower (self-KO chaos preserved)', () => {
    const sim = makeSim([player(0, { special: 'mine' }), player(1)]);
    const g = sim.gnomes[0];
    g.beans = 100;
    sim.step([BTN_SPECIAL, 0]);
    const mine = sim.farts.find((f) => f.kind === 'mine')!;
    expect(mine).toBeTruthy();
    // let it land and arm; owner stands still on it
    for (let i = 0; i < 60; i++) sim.step(IDLE);
    expect(g.hp).toBeLessThan(100); // 25/1 toughness
    expect(sim.farts.find((f) => f.kind === 'mine')).toBeUndefined(); // exploded
  });

  it('flame ignores teammates and ticks damage on enemies', () => {
    const sim = makeSim(
      [player(0, { special: 'flame', team: 1 }), player(1, { team: 1 }), player(2, { team: 2 })],
      'team'
    );
    const flamer = sim.gnomes[0];
    flamer.beans = 100;
    // park the enemy right behind the flamer (facing R fires left)
    sim.gnomes[2].x = flamer.x - 60;
    sim.gnomes[2].y = flamer.y;
    sim.gnomes[1].x = flamer.x - 60; // teammate in the same spot
    sim.gnomes[1].y = flamer.y;
    sim.step([BTN_SPECIAL, 0, 0]);
    for (let i = 0; i < 10; i++) sim.step(IDLE);
    expect(sim.gnomes[2].hp).toBeLessThan(100);
    expect(sim.gnomes[1].hp).toBe(100);
  });
});

describe('damage & builds', () => {
  it('toughness divides damage: fast build takes 2x from a standard fart', () => {
    const sim = makeSim([player(0), player(1, { build: 'fast' })]);
    const victim = sim.gnomes[1];
    victim.x = 400;
    victim.y = 949;
    // plant a hostile cloud directly on the victim
    sim.farts.push({
      id: 999,
      kind: 'cloud',
      x: victim.x,
      y: victim.y - 60,
      vx: 0,
      vy: 0,
      owner: 0,
      team: 1,
      ttl: -1,
      stuck: false,
    });
    sim.step(IDLE);
    expect(victim.hp).toBeCloseTo(100 - 2 / 0.5); // str 2 / toughness 0.5 = 4
    expect(sim.gnomes[0].stats.hits).toBe(1);
  });
});

describe('movement & physics', () => {
  it('jump only from ground with impulse -25; gravity +1/tick', () => {
    const sim = makeSim([player(0), player(1)]);
    sim.step([BTN_JUMP, 0]);
    const g = sim.gnomes[0];
    expect(g.vy).toBe(-25 + 1); // impulse then one tick of gravity applied in-air
    const vyAfterJump = g.vy;
    sim.step([BTN_JUMP, 0]); // mid-air jump must be ignored
    expect(g.vy).toBe(vyAfterJump + 1);
  });

  it('fart pack needs 5 beans, boosts upward, lasts 50 ticks', () => {
    const sim = makeSim([player(0), player(1)]);
    const g = sim.gnomes[0];
    sim.step([BTN_PACK, 0]);
    expect(g.packTicks).toBe(0); // no beans
    g.beans = 5;
    sim.step([BTN_PACK, 0]);
    expect(g.beans).toBe(0);
    expect(g.packTicks).toBeGreaterThan(45);
    expect(g.vy).toBeLessThan(0);
  });

  it('falling into the pit costs a life and respawns at full HP', () => {
    const sim = makeSim([player(0), player(1)]);
    const g = sim.gnomes[0];
    g.x = 960; // over the center gap
    g.y = 1015;
    g.vy = 10;
    g.onGround = false;
    sim.step(IDLE);
    expect(g.lives).toBe(2);
    expect(g.hp).toBe(100);
    expect(g.stats.selfKos).toBe(1);
  });

  it('landing slop: hitbox up to 50px past a platform edge still counts as ground', () => {
    const sim = makeSim([player(0), player(1)]);
    const g = sim.gnomes[0];
    // log platform: x 200..600, top 760. hitbox = (x+15 .. x+92); slop allows hb.right ≤ 650.
    g.x = 557; // hb.right = 649 → 49px overhang, still ground
    g.y = 760 - 51;
    g.vy = 0;
    sim.step(IDLE);
    expect(g.onGround).toBe(true);

    const sim2 = makeSim([player(0), player(1)]);
    const g2 = sim2.gnomes[0];
    g2.x = 600; // hb.right = 692 → 92px overhang, past the slop → airborne
    g2.y = 760 - 51;
    g2.vy = 0;
    sim2.step(IDLE);
    expect(g2.onGround).toBe(false);
  });
});

describe('beans', () => {
  it('spawn pacing: 2 players → first bean once counter passes 2500 (126 ticks)', () => {
    const sim = makeSim([player(0), player(1)]);
    for (let i = 0; i < 125; i++) sim.step(IDLE);
    expect(sim.beans.length).toBe(0);
    for (let i = 0; i < 5; i++) sim.step(IDLE);
    expect(sim.beans.length).toBe(1);
  });

  it('pickup grants +20 capped at 100', () => {
    const sim = makeSim([player(0), player(1)]);
    const g = sim.gnomes[0];
    g.beans = 90;
    sim.beans.push({ id: 1, x: g.x, y: g.y - 60 });
    sim.step(IDLE);
    expect(g.beans).toBe(100);
    expect(g.stats.beansCollected).toBe(1);
  });
});

describe('win conditions', () => {
  it('FFA ends when one remains', () => {
    const sim = makeSim([player(0), player(1)]);
    const loser = sim.gnomes[1];
    loser.lives = 1;
    loser.x = 960;
    loser.y = 1015;
    loser.vy = 10;
    loser.onGround = false;
    sim.step(IDLE);
    expect(sim.over).toBe(true);
    expect(sim.result?.text).toContain('P1 Wins');
    expect(sim.result?.winnerSlots).toEqual([0]);
  });

  it('team mode ends when survivors share a team', () => {
    const sim = makeSim(
      [player(0, { team: 1 }), player(1, { team: 1 }), player(2, { team: 2 })],
      'team'
    );
    const enemy = sim.gnomes[2];
    enemy.lives = 1;
    enemy.hp = 1;
    sim.farts.push({ id: 1, kind: 'cloud', x: enemy.x, y: enemy.y - 60, vx: 0, vy: 0, owner: 0, team: 1, ttl: -1, stuck: false });
    sim.step(IDLE);
    expect(sim.over).toBe(true);
    expect(sim.result?.winnerTeam).toBe(1);
  });

  it('single player: humans win when every AI is dead', () => {
    const sim = makeSim(
      [player(0), player(1, { isAI: true, team: 2 }), player(2, { isAI: true, team: 3 })],
      'single'
    );
    for (const ai of [sim.gnomes[1], sim.gnomes[2]]) {
      ai.lives = 1;
      ai.hp = 1;
      sim.farts.push({ id: ai.slot * 100, kind: 'cloud', x: ai.x, y: ai.y - 60, vx: 0, vy: 0, owner: 0, team: 1, ttl: -1, stuck: false });
    }
    for (let i = 0; i < 3; i++) sim.step(IDLE);
    expect(sim.over).toBe(true);
    expect(sim.result?.text).toBe('You Win!');
  });
});

describe('determinism', () => {
  it('same seed + same inputs ⇒ identical state', () => {
    const cfg: MatchConfig = {
      mode: 'ffa',
      levelId: 'garden',
      players: [player(0), player(1, { isAI: true })],
      seed: 42,
    };
    const a = new Sim(cfg);
    const b = new Sim(cfg);
    const script = (i: number) => [(i % 7 === 0 ? BTN_FART : 0) | (i % 3 === 0 ? BTN_RIGHT : 0) | (i % 11 === 0 ? BTN_JUMP : 0), 0];
    for (let i = 0; i < 2000; i++) {
      a.step(script(i));
      b.step(script(i));
    }
    expect(JSON.stringify(a.snapshot([]))).toBe(JSON.stringify(b.snapshot([])));
  });
});

describe('level integrity', () => {
  it('no self-KOs in the pitless cave: wrap seams and respawns are safe', () => {
    const sim = new Sim({
      mode: 'ffa',
      levelId: 'cave',
      players: [player(0, { isAI: true }), player(1, { isAI: true, build: 'slow' })],
      seed: 99,
    });
    for (let i = 0; i < 15000 && !sim.over; i++) sim.step(IDLE);
    for (const g of sim.gnomes) expect(g.stats.selfKos).toBe(0);
  });

  it('wrap seam is walkable: a gnome running right across x=1920 stays grounded', () => {
    const sim = makeSim([player(0), player(1)], 'ffa');
    const g = sim.gnomes[0];
    g.x = 1700;
    for (let i = 0; i < 60; i++) {
      sim.step([BTN_RIGHT, 0]);
      expect(g.lives).toBe(3);
    }
    expect(g.x).toBeLessThan(700); // wrapped around, still left of the garden pit
    expect(g.onGround).toBe(true);
  });
});

describe('bot soak', () => {
  it('4 AIs brawl for 20k ticks on every level without NaNs or crashes', () => {
    for (const levelId of ['garden', 'skylogs', 'cave']) {
      const sim = new Sim({
        mode: 'ffa',
        levelId,
        players: [0, 1, 2, 3].map((s) => player(s, { isAI: true })),
        seed: 7,
      });
      let dmg = 0;
      for (let i = 0; i < 20000 && !sim.over; i++) {
        sim.step(IDLE);
        for (const g of sim.gnomes) {
          expect(Number.isFinite(g.x)).toBe(true);
          expect(Number.isFinite(g.y)).toBe(true);
        }
      }
      dmg = sim.gnomes.reduce((s, g) => s + g.stats.dmgTaken, 0);
      expect(dmg).toBeGreaterThan(0); // the brawl actually happened
    }
  });
});
