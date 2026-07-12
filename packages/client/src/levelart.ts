import { LevelDef, Rect, WORLD_H, WORLD_W } from 'sfb-shared';
import type { Assets } from './assets';

// Deterministic little RNG so the painted backgrounds are stable frame to frame
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function paintWoodLog(ctx: CanvasRenderingContext2D, r: Rect, rnd: () => number): void {
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, '#9a6a38');
  grad.addColorStop(0.25, '#7d5028');
  grad.addColorStop(1, '#5d3a1c');
  ctx.fillStyle = grad;
  const radius = Math.min(24, r.h / 2);
  ctx.beginPath();
  ctx.moveTo(r.x + radius, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, radius);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, radius);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, radius);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, radius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(50,28,10,0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < r.w / 60; i++) {
    const y = r.y + 8 + rnd() * (r.h - 16);
    const x0 = r.x + 10 + rnd() * (r.w - 80);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.bezierCurveTo(x0 + 20, y - 4, x0 + 40, y + 4, x0 + 60, y);
    ctx.stroke();
  }
}

function paintEarth(ctx: CanvasRenderingContext2D, r: Rect, rnd: () => number, mossy = false): void {
  const soil = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  soil.addColorStop(0, mossy ? '#4a4f45' : '#59422c');
  soil.addColorStop(1, mossy ? '#33362f' : '#3a2a1a');
  ctx.fillStyle = soil;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = mossy ? 'rgba(30,32,28,0.6)' : 'rgba(40,28,16,0.6)';
  for (let i = 0; i < (r.w * r.h) / 2600; i++) {
    ctx.beginPath();
    ctx.arc(r.x + rnd() * r.w, r.y + 14 + rnd() * Math.max(1, r.h - 18), 2 + rnd() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // grass / moss fringe
  const fringe = mossy ? '#7da05a' : '#5cae3a';
  ctx.fillStyle = fringe;
  ctx.fillRect(r.x, r.y, r.w, 12);
  for (let x = r.x; x < r.x + r.w; x += 7) {
    const h = 8 + rnd() * 12;
    ctx.beginPath();
    ctx.moveTo(x, r.y + 6);
    ctx.lineTo(x + 3, r.y - h);
    ctx.lineTo(x + 6, r.y + 6);
    ctx.fill();
  }
}

function paintCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number): void {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (const [dx, dy, r] of [
    [0, 0, 46],
    [38, -14, 34],
    [-40, -8, 30],
    [70, 4, 26],
    [-72, 6, 22],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintLevel(level: LevelDef, assets: Assets): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W;
  cv.height = WORLD_H;
  const ctx = cv.getContext('2d')!;
  const rnd = seeded(level.id.length * 7919 + 17);

  if (level.art === 'garden') {
    // the 2014 painted background already contains the platform art
    ctx.drawImage(assets.images.get('bg-garden')!, 0, 0, WORLD_W, WORLD_H);
    return cv;
  }

  if (level.art === 'skylogs') {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    sky.addColorStop(0, '#2d3f73');
    sky.addColorStop(0.45, '#6f74b8');
    sky.addColorStop(0.8, '#e8a06c');
    sky.addColorStop(1, '#f6c98f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // sun
    const sun = ctx.createRadialGradient(1560, 260, 10, 1560, 260, 190);
    sun.addColorStop(0, 'rgba(255,236,170,0.95)');
    sun.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(1300, 20, 520, 520);
    for (let i = 0; i < 9; i++) paintCloud(ctx, rnd() * WORLD_W, 80 + rnd() * 380, 0.7 + rnd(), 0.5 + rnd() * 0.3);
    // distant hills
    ctx.fillStyle = 'rgba(46,60,54,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, 1010);
    for (let x = 0; x <= WORLD_W; x += 60) ctx.lineTo(x, 930 + Math.sin(x / 170) * 46 + rnd() * 14);
    ctx.lineTo(WORLD_W, WORLD_H);
    ctx.lineTo(0, WORLD_H);
    ctx.fill();
    for (const [i, p] of level.platforms.entries()) {
      if (p.y >= 1000) paintEarth(ctx, p, rnd);
      else paintWoodLog(ctx, p, rnd);
      void i;
    }
    return cv;
  }

  // cave
  const rock = ctx.createRadialGradient(WORLD_W / 2, 420, 120, WORLD_W / 2, 620, 1400);
  rock.addColorStop(0, '#4c4553');
  rock.addColorStop(0.6, '#332e3a');
  rock.addColorStop(1, '#191622');
  ctx.fillStyle = rock;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // stalactites
  ctx.fillStyle = '#241f2d';
  for (let x = 30; x < WORLD_W; x += 90 + rnd() * 80) {
    const h = 70 + rnd() * 170;
    const w = 34 + rnd() * 40;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w / 2, h);
    ctx.fill();
  }
  // glowing mushrooms
  for (let i = 0; i < 26; i++) {
    const x = rnd() * WORLD_W;
    const y = 500 + rnd() * 480;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 26);
    glow.addColorStop(0, 'rgba(140,255,190,0.8)');
    glow.addColorStop(1, 'rgba(140,255,190,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const p of level.platforms) paintEarth(ctx, p, rnd, true);
  return cv;
}

export function paintLevelThumb(level: LevelDef, assets: Assets, w = 320, h = 180): HTMLCanvasElement {
  const full = paintLevel(level, assets);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  ctx.drawImage(full, 0, 0, w, h);
  if (level.art === 'garden') return cv; // platforms baked into art
  return cv;
}
