import { BTN_FART, BTN_JUMP, BTN_LEFT, BTN_PACK, BTN_RIGHT, BTN_SPECIAL } from 'sfb-shared';

export type Source = 'kb1' | 'kb2' | 'pad0' | 'pad1' | 'pad2' | 'pad3';

export interface MenuNav {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
  confirm?: boolean;
  back?: boolean;
  start?: boolean;
}

const KB1: Record<string, number> = {
  KeyA: BTN_LEFT,
  KeyD: BTN_RIGHT,
  KeyW: BTN_JUMP,
  KeyS: BTN_PACK,
  KeyQ: BTN_FART,
  KeyE: BTN_SPECIAL,
};
const KB2: Record<string, number> = {
  ArrowLeft: BTN_LEFT,
  ArrowRight: BTN_RIGHT,
  ArrowUp: BTN_JUMP,
  ArrowDown: BTN_PACK,
  AltLeft: BTN_FART,
  AltRight: BTN_FART,
  Comma: BTN_FART,
  ShiftLeft: BTN_SPECIAL,
  ShiftRight: BTN_SPECIAL,
  Period: BTN_SPECIAL,
};

export class Inputs {
  private kb1Bits = 0;
  private kb2Bits = 0;
  private down = new Set<string>();
  pauseRequested = false;

  // menu navigation edge-events (keyboard + all pads)
  private navQueue: MenuNav[] = [];
  private padPrev: Array<{ buttons: boolean[]; axes: number[] }> = [];
  private padRepeat: Array<{ dir: string; next: number } | null> = [null, null, null, null];

  constructor() {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.kb1Bits = 0;
      this.kb2Bits = 0;
    });
  }

  private onKey(e: KeyboardEvent, isDown: boolean): void {
    const code = e.code;
    const inGameKey = code in KB1 || code in KB2 || code === 'Escape' || code === 'Space' || code === 'Enter';
    if (inGameKey && !(e.target instanceof HTMLInputElement)) e.preventDefault();
    if (isDown && !e.repeat) {
      if (code === 'Escape' || code === 'Space') this.pauseRequested = true;
      const nav: MenuNav = {};
      if (code === 'ArrowUp' || code === 'KeyW') nav.up = true;
      if (code === 'ArrowDown' || code === 'KeyS') nav.down = true;
      if (code === 'ArrowLeft' || code === 'KeyA') nav.left = true;
      if (code === 'ArrowRight' || code === 'KeyD') nav.right = true;
      if (code === 'Enter' || code === 'Space') nav.confirm = true;
      if (code === 'Escape' || code === 'Backspace') nav.back = true;
      if (Object.keys(nav).length) this.navQueue.push(nav);
    }
    if (isDown) this.down.add(code);
    else this.down.delete(code);
    this.kb1Bits = Object.entries(KB1).reduce((b, [k, v]) => (this.down.has(k) ? b | v : b), 0);
    this.kb2Bits = Object.entries(KB2).reduce((b, [k, v]) => (this.down.has(k) ? b | v : b), 0);
  }

  private pads(): (Gamepad | null)[] {
    return navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  }

  /** parity mapping: A fart, B special, LT pack, RT jump (or stick down), stick X move, Start pause */
  bitsFor(source: Source): number {
    if (source === 'kb1') return this.kb1Bits;
    if (source === 'kb2') return this.kb2Bits;
    const idx = Number(source.slice(3));
    const p = this.pads()[idx];
    if (!p) return 0;
    let bits = 0;
    const btn = (i: number) => !!p.buttons[i]?.pressed;
    const ax = (i: number) => p.axes[i] ?? 0;
    if (ax(0) < -0.5 || btn(14)) bits |= BTN_LEFT;
    if (ax(0) > 0.5 || btn(15)) bits |= BTN_RIGHT;
    if (btn(7) || ax(1) > 0.8) bits |= BTN_JUMP;
    if (btn(6)) bits |= BTN_PACK;
    if (btn(0)) bits |= BTN_FART;
    if (btn(1)) bits |= BTN_SPECIAL;
    return bits;
  }

  connectedPads(): number[] {
    return this.pads()
      .map((p, i) => (p ? i : -1))
      .filter((i) => i >= 0);
  }

  /** poll gamepads for menu-navigation edges; call once per frame */
  pollNav(): MenuNav[] {
    const now = performance.now();
    this.pads().forEach((p, i) => {
      if (!p) return;
      const prev = this.padPrev[i] ?? { buttons: [], axes: [] };
      const cur = { buttons: p.buttons.map((b) => b.pressed), axes: [...p.axes] };
      const edge = (bi: number) => cur.buttons[bi] && !prev.buttons[bi];
      const nav: MenuNav = {};
      const dirState =
        cur.buttons[12] || (cur.axes[1] ?? 0) < -0.6
          ? 'up'
          : cur.buttons[13] || (cur.axes[1] ?? 0) > 0.6
            ? 'down'
            : cur.buttons[14] || (cur.axes[0] ?? 0) < -0.6
              ? 'left'
              : cur.buttons[15] || (cur.axes[0] ?? 0) > 0.6
                ? 'right'
                : null;
      const rep = this.padRepeat[i];
      if (dirState) {
        if (!rep || rep.dir !== dirState) {
          (nav as Record<string, boolean>)[dirState] = true;
          this.padRepeat[i] = { dir: dirState, next: now + 380 };
        } else if (now >= rep.next) {
          (nav as Record<string, boolean>)[dirState] = true;
          rep.next = now + 140;
        }
      } else {
        this.padRepeat[i] = null;
      }
      if (edge(0)) nav.confirm = true;
      if (edge(1)) nav.back = true;
      if (edge(9)) {
        nav.start = true;
        this.pauseRequested = true;
      }
      if (Object.keys(nav).length) this.navQueue.push(nav);
      this.padPrev[i] = cur;
    });
    const q = this.navQueue;
    this.navQueue = [];
    return q;
  }

  consumePause(): boolean {
    const p = this.pauseRequested;
    this.pauseRequested = false;
    return p;
  }
}
