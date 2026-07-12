import type { GnomeColor } from 'sfb-shared';

export interface Sheet {
  img: HTMLImageElement;
  frames: number;
  frameW: number;
  frameH: number;
  frameTime: number; // seconds per frame
  loop: boolean;
}

// frame counts come from the original @N filenames; frame times from gnome.js loadAnimations
const GNOME_ANIMS: Array<[string, string, number, number, boolean]> = [
  // [animKey, fileSuffix, frames, frameTime, loop]
  ['idle', 'stand', 1, 1, false],
  ['run', 'run', 18, 0.035, true],
  ['fart', 'fart', 5, 0.025, false], // blue overridden to 6 below
  ['jumpup', 'jumpup', 12, 0.025, false],
  ['jumpdown', 'jumpdown', 5, 0.06, false],
  ['fartpack', 'fartpack', 1, 1, false],
];

const SIMPLE_SHEETS: Array<[string, string, number, number, boolean]> = [
  ['beans', 'beans@16.png', 16, 0.08, true],
  ['cloud', 'cloud@11.png', 11, 0.05, true],
  ['bouncey', 'bounceyfart@42.png', 42, 0.05, true],
  ['mine', 'mine@16.png', 16, 0.05, true],
  ['smoke', 'smokesprites@6.png', 6, 0.3, false],
  ['gib-leg', 'leg@3.png', 3, 0.036, true],
  ['gib-leg2', 'leg2@3.png', 3, 0.036, true],
  ['gib-boot', 'boot@3.png', 3, 0.036, true],
  ['gib-boot2', 'boot2@3.png', 3, 0.036, true],
  ['gib-hat', 'hat@3.png', 3, 0.036, true],
  ['gib-hand', 'hand@3.png', 3, 0.036, true],
  ['gib-head', 'head@3.png', 3, 0.036, true],
  ['gib-blue', 'blue@3.png', 3, 0.036, true],
  ['gib-orange', 'orange@3.png', 3, 0.036, true],
  ['gib-purple', 'purple@3.png', 3, 0.036, true],
  ['gib-green', 'green@3.png', 3, 0.036, true],
];

export const GIB_KEYS = ['gib-leg', 'gib-leg2', 'gib-boot', 'gib-boot2', 'gib-hat', 'gib-hand', 'gib-head'];

export class Assets {
  sheets = new Map<string, Sheet>();
  images = new Map<string, HTMLImageElement>();

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`failed to load ${url}`));
      img.src = url;
    });
  }

  async load(onProgress?: (done: number, total: number) => void): Promise<void> {
    const jobs: Array<{ key: string; url: string; frames: number; ft: number; loop: boolean }> = [];

    const colors: GnomeColor[] = ['blue', 'orange', 'purple', 'green'];
    const framesFor = (color: string, anim: string, def: number) =>
      color === 'blue' && anim === 'fart' ? 6 : def;

    for (const color of colors) {
      for (const [anim, suffix, frames, ft, loop] of GNOME_ANIMS) {
        for (const dir of ['left', 'right']) {
          const n = framesFor(color, anim, frames);
          const file =
            anim === 'idle' || anim === 'fartpack'
              ? `${color}${suffix === 'stand' ? 'stand' : 'fartpack'}${dir}.png`
              : `${color}${suffix}${dir}@${n}.png`;
          jobs.push({ key: `${color}-${anim}-${dir === 'left' ? 'L' : 'R'}`, url: `/assets/sprites/${file}`, frames: n, ft, loop });
        }
      }
    }
    for (const [key, file, frames, ft, loop] of SIMPLE_SHEETS) {
      jobs.push({ key, url: `/assets/sprites/${file}`, frames, ft, loop });
    }

    const imageJobs: Array<[string, string]> = [
      ['bg-garden', '/assets/sprites/cloud.gif'],
      ['bg-menu', '/assets/sprites/cloudold.gif'],
      ['logo', '/assets/img/logo.png'],
    ];

    const total = jobs.length + imageJobs.length;
    let done = 0;
    const bump = () => onProgress?.(++done, total);

    await Promise.all([
      ...jobs.map(async (j) => {
        const img = await this.loadImage(j.url);
        this.sheets.set(j.key, {
          img,
          frames: j.frames,
          frameW: img.width / j.frames,
          frameH: img.height,
          frameTime: j.ft,
          loop: j.loop,
        });
        bump();
      }),
      ...imageJobs.map(async ([key, url]) => {
        this.images.set(key, await this.loadImage(url));
        bump();
      }),
    ]);
  }

  sheet(key: string): Sheet {
    const s = this.sheets.get(key);
    if (!s) throw new Error(`missing sheet ${key}`);
    return s;
  }

  drawFrame(ctx: CanvasRenderingContext2D, key: string, timeSec: number, x: number, y: number): void {
    const s = this.sheet(key);
    let idx = Math.floor(timeSec / s.frameTime);
    idx = s.loop ? idx % s.frames : Math.min(idx, s.frames - 1);
    ctx.drawImage(s.img, idx * s.frameW, 0, s.frameW, s.frameH, x, y, s.frameW, s.frameH);
  }
}
