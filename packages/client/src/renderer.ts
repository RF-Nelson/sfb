import {
  FartState,
  GnomeState,
  LevelDef,
  MatchResult,
  Snapshot,
  WORLD_H,
  WORLD_W,
} from 'sfb-shared';
import { Assets } from './assets';
import { Particles } from './particles';
import { paintLevel } from './levelart';

interface Animator {
  key: string;
  t: number;
}

const LIVES_POS: Array<[number, number]> = [
  [40, 1060],
  [550, 1060],
  [1115, 1060],
  [1625, 1060],
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, r = 15): void {
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

export class Renderer {
  private bg: HTMLCanvasElement | null = null;
  private bgLevelId = '';
  private gnomeAnims = new Map<number, Animator>();
  private fartAnims = new Map<number, Animator>();
  private hintUntil = performance.now() + 12000;
  podium: { result: MatchResult; started: number } | null = null;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private assets: Assets,
    private particles: Particles
  ) {}

  setLevel(level: LevelDef): void {
    if (this.bgLevelId !== level.id) {
      this.bg = paintLevel(level, this.assets);
      this.bgLevelId = level.id;
    }
    this.hintUntil = performance.now() + 12000;
    this.podium = null;
  }

  private anim(map: Map<number, Animator>, id: number, key: string, dt: number): Animator {
    let a = map.get(id);
    if (!a || a.key !== key) {
      a = { key, t: 0 };
      map.set(id, a);
    } else {
      a.t += dt;
    }
    return a;
  }

  private gnomeAnimKey(g: GnomeState, flaming: boolean): string {
    const dir = g.facing === 'L' ? 'L' : 'R';
    // while the flame burns, stay bent over — the non-looping fart anim clamps on
    // its final (bent) frame for as long as this key is held
    if (flaming || g.cooldown > 0) return `${g.color}-fart-${dir}`;
    if (!g.onGround) {
      if (g.packTicks > 0) return `${g.color}-fartpack-${dir}`;
      return g.vy < 0 ? `${g.color}-jumpup-${dir}` : `${g.color}-jumpdown-${dir}`;
    }
    if (Math.abs(g.vx) < 0.8) return `${g.color}-idle-${dir}`;
    return `${g.color}-run-${dir}`;
  }

  draw(snap: Snapshot, level: LevelDef, dt: number, names: string[], showTeams: boolean): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);

    if (this.particles.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.particles.shake, (Math.random() - 0.5) * this.particles.shake);
    }

    if (this.bg) ctx.drawImage(this.bg, 0, 0);

    // beans
    for (const b of snap.beans) {
      const a = this.anim(this.fartAnims, 1_000_000 + b.id, 'beans', dt);
      this.assets.drawFrame(ctx, 'beans', a.t, b.x, b.y);
    }

    // farts
    for (const f of snap.farts) {
      if (f.kind === 'flame') {
        // 2014 behavior: the VISUAL stream stays anchored to the gnome's butt and
        // roars continuously (the damage zone drifting behind is a parity quirk)
        const owner = snap.gnomes.find((g) => g.slot === f.owner);
        const intensity = Math.max(0.25, f.ttl / 75);
        if (owner && !owner.dead) {
          const back = owner.facing === 'L' ? 1 : -1;
          this.particles.flameJet(owner.x + 52 + back * 40, owner.y + 5, back, intensity);
        } else {
          this.particles.flameJet(f.x, f.y + 5, f.vx > 0 ? -1 : 1, intensity);
        }
        continue;
      }
      const key = f.kind === 'cloud' ? 'cloud' : f.kind === 'bounce' ? 'bouncey' : 'mine';
      const a = this.anim(this.fartAnims, f.id, key, dt);
      // center each sprite on butt height: frames are 65 (cloud), 97 (bouncey), 57 (mine) tall
      const dy = f.kind === 'mine' ? -35 : f.kind === 'bounce' ? -45 : -30;
      this.assets.drawFrame(ctx, key, a.t, f.x, f.y + dy);
      if (f.kind === 'mine' && f.ttl <= 0 && Math.floor(performance.now() / 300) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,60,60,0.9)';
        ctx.beginPath();
        ctx.arc(f.x + 34, f.y - 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // gnomes
    const flamingSlots = new Set(snap.farts.filter((f) => f.kind === 'flame').map((f) => f.owner));
    for (const g of snap.gnomes) {
      if (g.dead) continue;
      const key = this.gnomeAnimKey(g, flamingSlots.has(g.slot));
      const a = this.anim(this.gnomeAnims, g.slot, key, dt);
      const dy = key.includes('jumpdown') ? -136 : -130;
      this.assets.drawFrame(ctx, key, a.t, g.x, g.y + dy);

      if (g.packTicks > 0 && Math.floor(a.t * 20) % 3 === 0) {
        // exhaust comes out of the BUTT: behind the gnome (opposite facing), hip height
        const back = g.facing === 'L' ? 1 : -1;
        this.particles.exhaust(g.x + 52 + back * 36, g.y + 6, back);
      }

      // meters (original layout)
      roundRect(ctx, g.x - 25, g.y - 160, 130, 50, 'rgba(255,255,255,0.95)');
      roundRect(ctx, g.x - 20, g.y - 155, 120, 40, 'lightcoral');
      if (g.hp > 0) roundRect(ctx, g.x - 20, g.y - 155, 120 * (g.hp / 100), 40, 'red');
      roundRect(ctx, g.x - 25, g.y - 215, 130, 50, 'rgba(255,255,255,0.95)');
      roundRect(ctx, g.x - 20, g.y - 210, 120, 40, '#181818');
      if (g.beans > 0) roundRect(ctx, g.x - 20, g.y - 210, 120 * (g.beans / 100), 40, '#8a5a2b');
      ctx.font = '24px "Delius Unicase", "Comic Sans MS", cursive';
      ctx.fillStyle = 'white';
      ctx.fillText('HEALTH', g.x - 9, g.y - 125);
      ctx.fillText('BEANS', g.x, g.y - 181);
      if (showTeams) {
        ctx.font = 'bold 28px "Delius Unicase", Verdana';
        ctx.fillStyle = g.team === 1 ? '#ffd23e' : '#54e0ff';
        ctx.fillText(`TEAM ${g.team}`, g.x - 5, g.y - 238);
      }
    }

    this.particles.update(dt);
    this.particles.draw(ctx, this.assets);

    // HUD
    ctx.font = '34px "Delius Unicase", "Comic Sans MS", cursive';
    for (const g of snap.gnomes) {
      const [lx, ly] = LIVES_POS[g.slot];
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, lx - 14, ly - 36, 300, 48, 'rgba(0,0,0,0.45)', 12);
      ctx.fillStyle = g.dead ? '#999' : 'white';
      const hearts = '❤'.repeat(Math.max(0, g.lives));
      ctx.fillText(`${names[g.slot] ?? 'P' + (g.slot + 1)}  ${g.dead ? 'KO' : hearts}`, lx, ly);
    }

    if (performance.now() < this.hintUntil && snap.countdown === 0) {
      ctx.font = '30px "Delius Unicase", "Comic Sans MS", cursive';
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.textAlign = 'center';
      ctx.fillText('Collect beans to power your fart pack & special attack', WORLD_W / 2, 46);
      ctx.textAlign = 'left';
    }

    // countdown
    if (snap.countdown > 0) {
      const n = Math.ceil(snap.countdown / 50);
      ctx.textAlign = 'center';
      ctx.font = 'bold 220px "Delius Unicase", "Comic Sans MS", cursive';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 10;
      ctx.strokeText(String(n), WORLD_W / 2, 470);
      ctx.fillText(String(n), WORLD_W / 2, 470);
      ctx.textAlign = 'left';
    } else if (snap.tick < 200 && !this.podium) {
      const age = snap.tick; // ticks since GO
      if (age < 40) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 160px "Delius Unicase", "Comic Sans MS", cursive';
        ctx.fillStyle = `rgba(255,220,60,${1 - age / 40})`;
        ctx.strokeStyle = `rgba(0,0,0,${0.6 * (1 - age / 40)})`;
        ctx.lineWidth = 8;
        ctx.strokeText('FART!', WORLD_W / 2, 470);
        ctx.fillText('FART!', WORLD_W / 2, 470);
        ctx.textAlign = 'left';
      }
    }

    ctx.restore();
  }

  /** Winner celebration scene rendered behind the stats panel. */
  drawPodium(dt: number): void {
    const ctx = this.ctx;
    const pod = this.podium;
    if (!pod) return;
    const t = (performance.now() - pod.started) / 1000;
    ctx.save();
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    if (this.bg) {
      ctx.drawImage(this.bg, 0, 0);
      ctx.fillStyle = 'rgba(10,8,30,0.55)';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }

    // spotlight
    const spot = ctx.createRadialGradient(WORLD_W / 2, 560, 60, WORLD_W / 2, 560, 620);
    spot.addColorStop(0, 'rgba(255,240,190,0.35)');
    spot.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // podium
    roundRect(ctx, WORLD_W / 2 - 220, 760, 440, 200, '#c9a227', 14);
    roundRect(ctx, WORLD_W / 2 - 180, 780, 360, 160, '#e6c14c', 14);
    ctx.fillStyle = 'rgba(60,40,0,0.85)';
    ctx.font = 'bold 90px "Delius Unicase", "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('#1', WORLD_W / 2, 890);

    const winners = pod.result.stats.filter((s) => pod.result.winnerSlots.includes(s.slot));
    const winner = winners[0];
    if (winner) {
      // winner does victory fart-pack bobbing above the podium
      const bob = Math.sin(t * 2.2) * 60;
      const x = WORLD_W / 2 - 52;
      const y = 620 + bob;
      const facing = Math.sin(t * 1.1) > 0 ? 'R' : 'L';
      this.assets.drawFrame(ctx, `${winner.color}-fartpack-${facing}`, 0, x, y - 130);
      const back = facing === 'L' ? 1 : -1;
      this.particles.exhaust(x + 52 + back * 36, y + 6, back);
      // crown
      ctx.font = '90px serif';
      ctx.fillText('\u{1F451}', x + 52, y - 190);
    }
    if (Math.random() < 0.06) {
      this.particles.confettiBurst(200 + Math.random() * (WORLD_W - 400), 220);
    }
    this.particles.update(dt);
    this.particles.draw(ctx, this.assets);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}
