// Procedural sound effects — the 2014 game had zero audio, which was a crime.
// Everything is synthesized (no asset files, no licensing questions).
type Ctx = AudioContext;

export class Sfx {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  muted = localStorage.getItem('sfb-muted') === '1';

  private ensure(): Ctx | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
    } catch {
      return null;
    }
    return this.ctx;
  }

  /** call from a user gesture to unlock audio */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('sfb-muted', this.muted ? '1' : '0');
    return this.muted;
  }

  private out(): GainNode | null {
    if (this.muted) return null;
    if (!this.ensure()) return null;
    return this.master;
  }

  private noiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // brown-ish noise reads more... organic
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buf;
  }

  fart(big = false): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const dur = big ? 0.45 : 0.22;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(dur + 0.1);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(big ? 90 : 140 + Math.random() * 80, t);
    bp.frequency.exponentialRampToValueAtTime(big ? 60 : 90, t + dur);
    bp.Q.value = 4;
    const wob = ctx.createOscillator();
    wob.frequency.value = big ? 22 : 30 + Math.random() * 12;
    const wobGain = ctx.createGain();
    wobGain.gain.value = 60;
    wob.connect(wobGain).connect(bp.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(big ? 1.0 : 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp).connect(g).connect(out);
    wob.start(t);
    wob.stop(t + dur);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  flame(): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(1.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 1.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    src.connect(lp).connect(g).connect(out);
    src.start(t);
    src.stop(t + 1.55);
  }

  boing(): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.07);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.2);
  }

  explosion(big = false): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const dur = big ? 0.7 : 0.3;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(big ? 1200 : 900, t);
    lp.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(big ? 1.0 : 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(lp).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur + 0.05);
    if (big) {
      const sub = ctx.createOscillator();
      sub.frequency.setValueAtTime(60, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.6, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      sub.connect(sg).connect(out);
      sub.start(t);
      sub.stop(t + 0.55);
    }
  }

  blip(): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(880, t);
    o.frequency.setValueAtTime(1318, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.13);
  }

  uiMove(): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.07);
  }

  count(go = false): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = go ? 880 : 440;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (go ? 0.4 : 0.15));
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + (go ? 0.45 : 0.2));
  }

  fanfare(): void {
    const out = this.out();
    if (!out) return;
    const ctx = this.ctx!;
    const t0 = ctx.currentTime;
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((f, i) => {
      const t = t0 + i * 0.13;
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.25);
    });
  }
}
