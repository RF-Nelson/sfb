import type { MenuNav } from './inputs';

/** Roving-focus controller so every menu is playable with a gamepad (Xbox requirement). */
export class FocusNav {
  private items: HTMLElement[] = [];
  private idx = 0;
  private container: HTMLElement | null = null;
  onMove: (() => void) | null = null;

  attach(container: HTMLElement): void {
    this.container = container;
    this.items = Array.from(container.querySelectorAll<HTMLElement>('[data-f]'));
    this.idx = Math.max(0, this.items.findIndex((el) => el.hasAttribute('data-f-default')));
    this.apply();
  }

  private apply(): void {
    this.items.forEach((el, i) => el.classList.toggle('focused', i === this.idx));
    const el = this.items[this.idx];
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'nearest' });
    }
  }

  refresh(): void {
    if (this.container) {
      const active = this.items[this.idx];
      this.items = Array.from(this.container.querySelectorAll<HTMLElement>('[data-f]'));
      const found = this.items.indexOf(active);
      this.idx = found >= 0 ? found : Math.min(this.idx, Math.max(0, this.items.length - 1));
      this.apply();
    }
  }

  current(): HTMLElement | null {
    return this.items[this.idx] ?? null;
  }

  handle(nav: MenuNav): void {
    if (!this.items.length) return;
    const el = this.current();
    if (nav.up) {
      this.idx = (this.idx - 1 + this.items.length) % this.items.length;
      this.apply();
      this.onMove?.();
    } else if (nav.down) {
      this.idx = (this.idx + 1) % this.items.length;
      this.apply();
      this.onMove?.();
    } else if (nav.left || nav.right) {
      if (el?.classList.contains('cycler')) {
        el.dispatchEvent(new CustomEvent('cycle', { detail: nav.left ? -1 : 1 }));
        this.onMove?.();
      } else {
        this.idx = nav.left ? (this.idx - 1 + this.items.length) % this.items.length : (this.idx + 1) % this.items.length;
        this.apply();
        this.onMove?.();
      }
    } else if (nav.confirm) {
      if (el?.classList.contains('cycler')) el.dispatchEvent(new CustomEvent('cycle', { detail: 1 }));
      else el?.click();
    } else if (nav.back) {
      this.container?.querySelector<HTMLElement>('[data-back]')?.click();
    }
  }
}

/** A left/right value cycler that is keyboard-, mouse-, and gamepad-operable. */
export function makeCycler<T>(opts: {
  values: T[];
  value: T;
  label: (v: T) => string;
  onChange: (v: T) => void;
}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'cycler';
  el.tabIndex = -1;
  el.setAttribute('data-f', '');
  let i = Math.max(0, opts.values.indexOf(opts.value));
  const render = () => {
    el.innerHTML = `<span class="arrow">◀</span><span class="val">${opts.label(opts.values[i])}</span><span class="arrow">▶</span>`;
  };
  const bump = (dir: number) => {
    i = (i + dir + opts.values.length) % opts.values.length;
    render();
    opts.onChange(opts.values[i]);
  };
  el.addEventListener('cycle', ((e: CustomEvent) => bump(e.detail as number)) as EventListener);
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    bump((e as MouseEvent).clientX < rect.left + rect.width / 2 ? -1 : 1);
  });
  render();
  return el;
}

export function toast(msg: string, ms = 2600): void {
  document.getElementById('toast')?.remove();
  const el = document.createElement('div');
  el.id = 'toast';
  el.textContent = msg;
  document.getElementById('stage')?.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  }, ms);
}

export function el(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}
