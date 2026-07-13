import { GIB_VELS } from 'sfb-shared';
import { Assets, GIB_KEYS } from './assets';

type Kind = 'puff' | 'fire' | 'spark' | 'ring' | 'confetti' | 'debris';

interface P {
  alive: boolean;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  rot: number;
  vrot: number;
}

interface Gib {
  key: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  ttl: number;
}

const POOL = 1400;
const CONFETTI_HUES = [200, 30, 275, 130, 50, 340];

export class Particles {
  private pool: P[] = Array.from({ length: POOL }, () => ({
    alive: false,
    kind: 'puff',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 4,
    hue: 0,
    rot: 0,
    vrot: 0,
  }));
  gibs: Gib[] = [];
  shake = 0;

  private spawn(kind: Kind, x: number, y: number, vx: number, vy: number, life: number, size: number, hue = 0): void {
    const p = this.pool.find((q) => !q.alive);
    if (!p) return;
    p.alive = true;
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.hue = hue;
    p.rot = Math.random() * Math.PI * 2;
    p.vrot = (Math.random() - 0.5) * 10;
  }

  hitBurst(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 240;
      this.spawn('fire', x, y, Math.cos(a) * s, Math.sin(a) * s - 40, 0.35 + Math.random() * 0.25, 10 + Math.random() * 14);
    }
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawn('puff', x, y, Math.cos(a) * 60, Math.sin(a) * 60 - 30, 0.6, 16 + Math.random() * 10);
    }
  }

  mineBlast(x: number, y: number): void {
    this.spawn('ring', x, y, 0, 0, 0.45, 10);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 120 + Math.random() * 480;
      this.spawn('fire', x, y, Math.cos(a) * s, Math.sin(a) * s - 60, 0.4 + Math.random() * 0.4, 12 + Math.random() * 20);
    }
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI * Math.random();
      const s = 200 + Math.random() * 300;
      this.spawn('debris', x, y, Math.cos(a) * s, Math.sin(a) * s, 0.9 + Math.random() * 0.5, 5 + Math.random() * 7);
    }
    this.shake = Math.min(24, this.shake + 16);
  }

  /**
   * Continuous short-range flamethrower cone, anchored at the butt (x,y = nozzle).
   * Matches the 2014 look: a dense roaring stream, not travelling puffs — high
   * emission rate, fast particles, SHORT lifetimes so the fire dies ~150px out.
   * dir: −1 sprays left, +1 right. intensity 0..1 tapers the stream as ttl runs out.
   */
  flameJet(x: number, y: number, dir: number, intensity = 1): void {
    const n = Math.max(3, Math.round(15 * intensity));
    for (let i = 0; i < n; i++) {
      const along = Math.random(); // 0 at nozzle → 1 at cone tip
      this.spawn(
        'fire',
        x + dir * along * 26,
        y + (Math.random() - 0.5) * (14 + along * 30), // cone widens with distance
        dir * (380 + Math.random() * 320),
        (Math.random() - 0.5) * 80 - 30,
        0.1 + Math.random() * 0.2, // short life = short range
        7 + Math.random() * 13 + along * 6
      );
    }
    // hot core right at the nozzle
    this.spawn('fire', x + dir * 8, y + (Math.random() - 0.5) * 10, dir * 260, -20, 0.09 + Math.random() * 0.06, 16 + Math.random() * 8);
  }

  /** dirX: −1 blows the puff left, +1 right (away from the gnome's facing) */
  exhaust(x: number, y: number, dirX = 0): void {
    this.spawn(
      'puff',
      x,
      y,
      dirX * (50 + Math.random() * 40) + (Math.random() - 0.5) * 40,
      70 + Math.random() * 70,
      0.8,
      14 + Math.random() * 12
    );
  }

  sparkle(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 50 + Math.random() * 150;
      this.spawn('spark', x, y, Math.cos(a) * s, Math.sin(a) * s, 0.4 + Math.random() * 0.2, 3 + Math.random() * 3);
    }
  }

  confettiBurst(x: number, y: number): void {
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const s = 250 + Math.random() * 450;
      this.spawn(
        'confetti',
        x,
        y,
        Math.cos(a) * s,
        Math.sin(a) * s,
        1.6 + Math.random() * 1.2,
        6 + Math.random() * 6,
        CONFETTI_HUES[Math.floor(Math.random() * CONFETTI_HUES.length)]
      );
    }
  }

  deathGibs(x: number, y: number, color: string): void {
    const keys = [...GIB_KEYS, `gib-${color}`];
    keys.forEach((key, i) => {
      const [vx, vy] = GIB_VELS[i] ?? [10, -10];
      this.gibs.push({ key, x, y, vx: vx * 50, vy: vy * 50, t: 0, ttl: 1.8 });
    });
    this.shake = Math.min(24, this.shake + 12);
  }

  clearTransient(): void {
    this.gibs = [];
    for (const p of this.pool) p.alive = false;
    this.shake = 0;
  }

  update(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 40);
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      if (p.kind === 'confetti') {
        p.vy += 700 * dt;
        p.vx *= 1 - 1.5 * dt;
      } else if (p.kind === 'debris') {
        p.vy += 1300 * dt;
      } else if (p.kind === 'fire') {
        p.vy -= 120 * dt; // heat rises
      } else if (p.kind === 'puff') {
        p.vx *= 1 - 0.8 * dt;
      }
    }
    for (const g of [...this.gibs]) {
      g.t += dt;
      // original gibs: straight-line velocity, no gravity, fly offscreen
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.t > g.ttl) this.gibs.splice(this.gibs.indexOf(g), 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D, assets: Assets): void {
    for (const g of this.gibs) {
      assets.drawFrame(ctx, g.key, g.t, g.x, g.y);
    }
    for (const p of this.pool) {
      if (!p.alive) continue;
      const a = Math.max(0, p.life / p.maxLife);
      if (p.kind === 'fire') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(255,240,160,${0.9 * a})`);
        grad.addColorStop(0.45, `rgba(255,120,30,${0.7 * a})`);
        grad.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'puff') {
        const grow = 1 + (1 - a) * 1.6;
        ctx.fillStyle = `rgba(190,185,175,${0.45 * a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,230,90,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'ring') {
        const r = 20 + (1 - a) * 340;
        ctx.strokeStyle = `rgba(255,210,120,${a})`;
        ctx.lineWidth = 10 * a + 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${Math.min(1, a * 2)})`;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = `rgba(110,80,50,${a})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
  }
}
