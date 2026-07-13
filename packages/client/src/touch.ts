import { BTN_FART, BTN_JUMP, BTN_LEFT, BTN_PACK, BTN_RIGHT, BTN_SPECIAL } from 'sfb-shared';
import { hasTouch, type Inputs } from './inputs';

const BITS: Record<string, number> = {
  left: BTN_LEFT,
  right: BTN_RIGHT,
  jump: BTN_JUMP,
  pack: BTN_PACK,
  fart: BTN_FART,
  special: BTN_SPECIAL,
};

/**
 * On-screen controls for phones/tablets. Multi-touch: each active pointer is
 * hit-tested every move, so sliding a thumb between buttons re-targets and
 * sliding off releases — no stuck inputs.
 */
export class TouchControls {
  private el: HTMLElement;
  private active = new Map<number, string | null>();

  constructor(stage: HTMLElement, private inputs: Inputs) {
    this.el = document.createElement('div');
    this.el.id = 'touch-controls';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="tbtn" data-tb="left">◀</div>
      <div class="tbtn" data-tb="right">▶</div>
      <div class="tbtn" data-tb="jump">⬆<small>JUMP</small></div>
      <div class="tbtn" data-tb="pack">🚀<small>FLY</small></div>
      <div class="tbtn" data-tb="special">✨<small>SPEC</small></div>
      <div class="tbtn big" data-tb="fart">💨<small>FART</small></div>
      <div class="tbtn small" data-tb="pause">⏸</div>`;
    stage.appendChild(this.el);

    this.el.querySelectorAll<HTMLElement>('[data-tb]').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const key = btn.getAttribute('data-tb')!;
        if (key === 'pause') {
          this.inputs.pauseRequested = true;
          return;
        }
        this.active.set(e.pointerId, key);
        this.recompute();
      });
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.active.has(e.pointerId)) return;
      this.active.set(e.pointerId, this.hit(e.clientX, e.clientY));
      this.recompute();
    });
    const release = (e: PointerEvent) => {
      if (this.active.delete(e.pointerId)) this.recompute();
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', () => {
      this.active.clear();
      this.recompute();
    });
  }

  private hit(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y);
    const key = el instanceof Element ? el.closest('[data-tb]')?.getAttribute('data-tb') : null;
    return key && key !== 'pause' ? key : null;
  }

  private recompute(): void {
    let bits = 0;
    for (const key of this.active.values()) {
      if (key) bits |= BITS[key] ?? 0;
    }
    this.inputs.touchBits = bits;
    for (const btn of Array.from(this.el.querySelectorAll<HTMLElement>('[data-tb]'))) {
      const k = btn.getAttribute('data-tb');
      btn.classList.toggle('held', k !== 'pause' && [...this.active.values()].includes(k));
    }
  }

  show(on: boolean, withPause: boolean): void {
    if (!hasTouch()) on = false; // never on desktop, no matter what a saved setup says
    this.el.classList.toggle('hidden', !on);
    this.el.querySelector('[data-tb="pause"]')?.classList.toggle('hidden', !withPause);
    if (!on) {
      this.active.clear();
      this.inputs.touchBits = 0;
    }
  }
}
