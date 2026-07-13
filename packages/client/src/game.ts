import {
  MatchConfig,
  MatchResult,
  Sim,
  SimEvent,
  Snapshot,
  TICK_MS,
  levelById,
} from 'sfb-shared';
import { Sfx } from './audio';
import { Inputs, Source } from './inputs';
import { NetClient } from './net';
import { Particles } from './particles';
import { Renderer } from './renderer';

export type SlotSources = Array<Source | null>; // by slot; null = AI or remote player

interface SessionOpts {
  config: MatchConfig;
  sources: SlotSources;
  online: NetClient | null; // null = local sim
  onEnd(result: MatchResult): void;
  onQuit(): void;
}

/** One match. Driven by the app's master rAF loop via frame(). */
export class GameSession {
  private sim: Sim | null = null;
  private acc = 0;
  paused = false;
  ended = false;
  private names: string[] = [];
  private lastCount = -1;

  constructor(
    private inputs: Inputs,
    private sfx: Sfx,
    private particles: Particles,
    private renderer: Renderer,
    readonly opts: SessionOpts
  ) {
    this.renderer.setLevel(levelById(opts.config.levelId));
    this.particles.clearTransient();
    for (const p of opts.config.players) this.names[p.slot] = p.name;
    if (!opts.online) this.sim = new Sim(opts.config);
  }

  togglePause(): void {
    if (this.opts.online || this.ended) return; // no pausing the internet
    this.paused = !this.paused;
    document.getElementById('pause-overlay')?.classList.toggle('hidden', !this.paused);
  }

  quitToMenu(): void {
    document.getElementById('pause-overlay')?.classList.add('hidden');
    this.opts.onQuit();
  }

  private handleEvents(events: SimEvent[]): void {
    for (const ev of events) {
      switch (ev.t) {
        case 'shoot':
          if (ev.kind === 'flame') this.sfx.flame();
          else this.sfx.fart(ev.kind !== 'cloud');
          break;
        case 'jump':
          this.sfx.boing();
          break;
        case 'pack':
          this.sfx.fart(true);
          break;
        case 'hit':
          if (ev.big) {
            this.particles.mineBlast(ev.x, ev.y);
            this.sfx.explosion(true);
          } else {
            this.particles.hitBurst(ev.x, ev.y);
            this.sfx.explosion(false);
          }
          break;
        case 'pickup':
          this.particles.sparkle(ev.x + 30, ev.y + 40);
          this.sfx.blip();
          break;
        case 'death':
          this.particles.deathGibs(ev.x, ev.y, ev.color);
          this.particles.mineBlast(ev.x + 40, ev.y + 40);
          this.sfx.explosion(true);
          break;
        case 'go':
          this.sfx.count(true);
          break;
        case 'end':
          break;
      }
    }
  }

  private finish(result: MatchResult): void {
    if (this.ended) return;
    this.ended = true;
    this.sfx.fanfare();
    this.renderer.podium = { result, started: performance.now() };
    this.opts.onEnd(result);
  }

  finishFromNet(result: MatchResult): void {
    this.finish(result);
  }

  frame(dt: number): void {
    if (this.inputs.consumePause() && !this.ended) this.togglePause();

    if (this.ended) {
      this.renderer.drawPodium(dt);
      return;
    }

    if (this.opts.online) {
      const latest = this.opts.online.latest();
      if (latest && !latest.over) {
        // one input message per local player — couch co-op shares this connection
        for (let slot = 0; slot < 4; slot++) {
          const src = this.opts.sources[slot];
          if (src) {
            this.opts.online.send({ t: 'input', tick: latest.tick, bits: this.inputs.bitsFor(src), slot });
          }
        }
      }
      this.handleEvents(this.opts.online.drainEvents());
      const snap = this.opts.online.interpolated();
      if (snap) {
        this.countdownBeeps(snap);
        this.renderer.draw(snap, levelById(this.opts.config.levelId), dt, this.names, this.opts.config.mode === 'team');
      }
      return;
    }

    const sim = this.sim!;
    if (!this.paused) {
      this.acc += dt * 1000;
      let steps = 0;
      while (this.acc >= TICK_MS && steps < 6) {
        const inputs: number[] = [0, 0, 0, 0];
        for (let slot = 0; slot < 4; slot++) {
          const src = this.opts.sources[slot];
          if (src) inputs[slot] = this.inputs.bitsFor(src);
        }
        this.handleEvents(sim.step(inputs));
        this.acc -= TICK_MS;
        steps++;
      }
      if (steps === 6) this.acc = 0;
    }

    const snap = sim.snapshot([]);
    this.countdownBeeps(snap);
    this.renderer.draw(snap, sim.level, this.paused ? 0 : dt, this.names, this.opts.config.mode === 'team');

    if (sim.over && sim.result) this.finish(sim.result);
  }

  private countdownBeeps(snap: Snapshot): void {
    const n = snap.countdown > 0 ? Math.ceil(snap.countdown / 50) : 0;
    if (n !== this.lastCount) {
      if (n > 0) this.sfx.count(false);
      this.lastCount = n;
    }
  }
}
