import {
  Build,
  GameMode,
  LEVELS,
  LobbyView,
  MatchConfig,
  MatchResult,
  PlayerSetup,
  Special,
  WORLD_H,
  WORLD_W,
  levelById,
} from 'sfb-shared';
import { Assets } from './assets';
import { Sfx } from './audio';
import { GameSession, SlotSources } from './game';
import { Inputs, Source, hasTouch } from './inputs';
import { TouchControls } from './touch';
import { NetClient } from './net';
import { Particles } from './particles';
import { Renderer } from './renderer';
import { FocusNav, el, makeCycler, toast } from './ui';
import { paintLevelThumb } from './levelart';

type Screen = 'title' | 'howto' | 'local' | 'online' | 'lobby' | 'game' | 'post';
type Participant = 'off' | 'ai' | Source;

interface SlotSetup {
  who: Participant;
  build: Build;
  special: Special;
  team: number;
}

const BUILD_LABEL: Record<Build, string> = { normal: 'Balanced', fast: 'Speedy (frail)', slow: 'Tanky (slow)' };
const SPECIAL_LABEL: Record<Special, string> = { bounce: 'Bouncy Fart', flame: 'Flame Fart', mine: 'Fart Mine' };
const WHO_LABEL: Record<string, string> = {
  off: '— Off —',
  ai: 'Gnomebot (AI)',
  kb1: 'Keyboard 1 (WASD)',
  kb2: 'Keyboard 2 (Arrows)',
  touch: 'Touch Screen',
  pad0: 'Gamepad 1',
  pad1: 'Gamepad 2',
  pad2: 'Gamepad 3',
  pad3: 'Gamepad 4',
};
const COLORS = ['blue', 'orange', 'purple', 'green'] as const;

function isStandalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function canElementFullscreen(): boolean {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

function goFullscreen(): void {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (el.requestFullscreen) void el.requestFullscreen();
    else el.webkitRequestFullscreen?.();
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    so.lock?.('landscape').catch(() => undefined);
  } catch {
    /* not supported — button is best-effort */
  }
}

class App {
  ui = document.getElementById('ui')!;
  canvas = document.getElementById('game') as HTMLCanvasElement;
  ctx = this.canvas.getContext('2d')!;
  assets = new Assets();
  sfx = new Sfx();
  inputs = new Inputs();
  particles = new Particles();
  renderer = new Renderer(this.ctx, this.assets, this.particles);
  focus = new FocusNav();
  pauseFocus = new FocusNav();
  touch!: TouchControls;

  screen: Screen = 'title';
  session: GameSession | null = null;
  net: NetClient | null = null;
  lobby: LobbyView | null = null;
  mySlot = -1;
  myConnId = -1;
  myOnlineSources: Record<number, Source> = {};
  myName = localStorage.getItem('sfb-name') ?? '';
  postResult: MatchResult | null = null;
  postOnline = false;

  mode: GameMode = (localStorage.getItem('sfb-mode') as GameMode) || 'ffa';
  levelIdx = Math.max(0, LEVELS.findIndex((l) => l.id === (localStorage.getItem('sfb-level') ?? 'garden')));
  slots: SlotSetup[] = this.defaultSlots();

  private last = performance.now();

  defaultSlots(): SlotSetup[] {
    const saved = localStorage.getItem('sfb-slots');
    if (saved) {
      try {
        const s = JSON.parse(saved) as SlotSetup[];
        if (Array.isArray(s) && s.length === 4) {
          if (!hasTouch()) {
            // a setup saved on a touch device must not resurrect touch on desktop
            s.forEach((slot, i) => {
              if (slot.who === 'touch') slot.who = i === 0 ? 'kb1' : 'off';
            });
          }
          return s;
        }
      } catch {
        /* fall through */
      }
    }
    return [
      { who: hasTouch() ? 'touch' : 'kb1', build: 'normal', special: 'bounce', team: 1 },
      { who: hasTouch() ? 'ai' : 'kb2', build: 'normal', special: 'mine', team: 2 },
      { who: 'off', build: 'normal', special: 'flame', team: 1 },
      { who: 'off', build: 'normal', special: 'bounce', team: 2 },
    ];
  }

  persistSetup(): void {
    localStorage.setItem('sfb-slots', JSON.stringify(this.slots));
    localStorage.setItem('sfb-mode', this.mode);
    localStorage.setItem('sfb-level', LEVELS[this.levelIdx].id);
  }

  async boot(): Promise<void> {
    this.fit();
    window.addEventListener('resize', () => this.fit());
    window.visualViewport?.addEventListener('resize', () => this.fit());
    window.visualViewport?.addEventListener('scroll', () => this.fit());
    this.ui.innerHTML = `<div class="screen"><div class="panel"><h1>Loading…</h1><p id="load-pct" style="text-align:center">0%</p></div></div>`;
    await this.assets.load((done, total) => {
      const p = document.getElementById('load-pct');
      if (p) p.textContent = `${Math.round((done / total) * 100)}%`;
    });
    document.body.addEventListener('pointerdown', () => this.sfx.unlock(), { once: true });
    document.body.addEventListener('keydown', () => this.sfx.unlock(), { once: true });
    this.buildPauseOverlay();
    this.touch = new TouchControls(document.getElementById('stage')!, this.inputs);
    this.showTitle();
    requestAnimationFrame(() => this.loop());
  }

  fit(): void {
    const stage = document.getElementById('stage')!;
    const ratio = WORLD_W / WORLD_H;
    // visualViewport is the truth on iOS — innerHeight lies while the URL bar animates
    const vv = window.visualViewport;
    const availW = vv ? vv.width : window.innerWidth;
    const availH = vv ? vv.height : window.innerHeight;
    const offX = vv ? vv.offsetLeft : 0;
    const offY = vv ? vv.offsetTop : 0;
    let w = availW;
    let h = availH;
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
    Object.assign(stage.style, {
      width: `${w}px`,
      height: `${h}px`,
      left: `${offX + (availW - w) / 2}px`,
      top: `${offY + (availH - h) / 2}px`,
    });
  }

  loop(): void {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;

    const navs = this.inputs.pollNav();
    if (this.screen === 'game' && this.session) {
      if (this.session.paused) {
        for (const n of navs) this.pauseFocus.handle(n);
      }
      this.session.frame(dt);
      if (this.session.ended && this.screen === 'game') {
        // session flipped to podium mode; post panel is raised by onEnd
      }
    } else if (this.screen === 'post' && this.session) {
      this.session.frame(dt);
      for (const n of navs) this.focus.handle(n);
    } else {
      for (const n of navs) this.focus.handle(n);
    }
    this.inputs.consumePause(); // don't let stale pause presses leak between screens
  }

  // ---------------------------------------------------------------- helpers

  private setScreen(scr: Screen, html: string | null, transparent = false): void {
    this.screen = scr;
    this.ui.classList.toggle('transparent', transparent);
    if (html !== null) {
      this.ui.innerHTML = html;
    } else {
      this.ui.innerHTML = '';
    }
    if (!transparent) {
      this.focus.attach(this.ui);
      this.focus.onMove = () => this.sfx.uiMove();
    }
  }

  private topbar(): string {
    const fs = !isStandalone() && !isIOS() && canElementFullscreen()
      ? `<button data-f id="fs-btn">⛶ Fullscreen</button>`
      : '';
    return `<div class="topbar">${fs}<button data-f id="mute-btn">${this.sfx.muted ? '🔇 Muted' : '🔊 Sound'}</button></div>`;
  }

  private wireTopbar(): void {
    document.getElementById('mute-btn')?.addEventListener('click', (e) => {
      const muted = this.sfx.toggleMute();
      (e.currentTarget as HTMLElement).textContent = muted ? '🔇 Muted' : '🔊 Sound';
    });
    document.getElementById('fs-btn')?.addEventListener('click', () => goFullscreen());
  }

  private endSession(): void {
    this.session = null;
    this.renderer.podium = null;
    this.touch?.show(false, false);
  }

  private leaveOnline(): void {
    this.net?.close();
    this.net = null;
    this.lobby = null;
    this.mySlot = -1;
    this.myConnId = -1;
    this.myOnlineSources = {};
  }

  // ------------------------------------------------------------------ title

  showTitle(): void {
    this.endSession();
    this.leaveOnline();
    this.setScreen(
      'title',
      `
      <div class="screen">
        ${this.topbar()}
        <img class="logo" src="/assets/img/logo.png" alt="Super Fart Bros." />
        <div class="menu-list">
          <button data-f data-f-default id="btn-local">Local Game</button>
          <button data-f id="btn-online">Online Game</button>
          <button data-f id="btn-howto">How To Play</button>
          <button data-f id="btn-classic" class="secondary">Classic (2014)</button>
        </div>
        <p class="hint hint-chip">Up to 4 players · gamepads, keyboards & gnomebots welcome</p>
        ${
          isIOS() && !isStandalone() && matchMedia('(hover: none)').matches
            ? '<p class="hint hint-chip">📱 True full screen: <b>Share&nbsp;→&nbsp;Add&nbsp;to&nbsp;Home&nbsp;Screen</b>, then launch SFB from the icon</p>'
            : ''
        }
      </div>`
    );
    this.wireTopbar();
    document.getElementById('btn-local')!.addEventListener('click', () => this.showLocalSetup());
    document.getElementById('btn-online')!.addEventListener('click', () => this.showOnline());
    document.getElementById('btn-howto')!.addEventListener('click', () => this.showHowTo());
    document.getElementById('btn-classic')!.addEventListener('click', () => {
      location.href = '/classic/';
    });
  }

  // ------------------------------------------------------------------ howto

  showHowTo(): void {
    this.setScreen(
      'howto',
      `
      <div class="screen">
        <div class="panel">
          <h1>How To Play</h1>
          <p style="text-align:center">Fart at the other gnomes until they run out of lives. Farts fire <b>backwards</b> — the recoil is your friend. Beans power your <b>fart pack</b> (hold to fly) and your <b>special attack</b>.</p>
          <div class="row" style="align-items:flex-start">
            <table class="controls-table"><tr><th colspan="2">Keyboard 1</th></tr>
              <tr><td>Move</td><td>A / D</td></tr><tr><td>Jump</td><td>W</td></tr>
              <tr><td>Fart pack</td><td>S</td></tr><tr><td>Fart</td><td>Q</td></tr>
              <tr><td>Special</td><td>E</td></tr></table>
            <table class="controls-table"><tr><th colspan="2">Keyboard 2</th></tr>
              <tr><td>Move</td><td>◀ / ▶</td></tr><tr><td>Jump</td><td>▲</td></tr>
              <tr><td>Fart pack</td><td>▼</td></tr><tr><td>Fart</td><td>Alt or ,</td></tr>
              <tr><td>Special</td><td>Shift or .</td></tr></table>
            <table class="controls-table"><tr><th colspan="2">Gamepad</th></tr>
              <tr><td>Move</td><td>Left stick / D-pad</td></tr><tr><td>Jump</td><td>RT</td></tr>
              <tr><td>Fart pack</td><td>LT</td></tr><tr><td>Fart</td><td>A</td></tr>
              <tr><td>Special</td><td>B</td></tr><tr><td>Pause</td><td>Start</td></tr></table>
          </div>
          <p class="hint">Mines arm after 1s and blow up <i>anyone</i> — including you. Bouncy farts ricochet for 10 seconds. Flames roast whatever stands behind you.</p>
          <p class="hint">Created by Rich Nelson &amp; Bryan Millstein · reborn 2026 · <a href="/classic/">play the 2014 original</a></p>
          <div class="row"><button data-f data-f-default data-back id="btn-back">Back</button></div>
        </div>
      </div>`
    );
    document.getElementById('btn-back')!.addEventListener('click', () => this.showTitle());
  }

  // ------------------------------------------------------------ local setup

  showLocalSetup(): void {
    this.endSession();
    this.setScreen(
      'local',
      `
      <div class="screen">
        ${this.topbar()}
        <div class="panel" id="setup-panel">
          <h1>Local Game</h1>
          <div class="row" id="mode-row"><span>Mode:</span></div>
          <div class="row" id="level-row" style="margin-top:.5em"><span>Level:</span></div>
          <div class="row"><canvas class="level-preview" id="level-thumb" width="320" height="180"></canvas></div>
          <div class="setup-grid" id="slot-rows"></div>
          <p class="error" id="setup-err"></p>
          <div class="row">
            <button data-f id="btn-start" data-f-default>Start Game</button>
            <button data-f data-back id="btn-back" class="secondary">Back</button>
          </div>
        </div>
      </div>`
    );
    this.wireTopbar();

    const modeRow = document.getElementById('mode-row')!;
    modeRow.appendChild(
      makeCycler<GameMode>({
        values: ['single', 'ffa', 'team'],
        value: this.mode,
        label: (m) => (m === 'single' ? 'Single Player' : m === 'ffa' ? 'Free For All' : 'Team Deathmatch'),
        onChange: (m) => {
          this.mode = m;
          this.applyModeConstraints();
          this.renderSlotRows();
          this.focus.refresh();
        },
      })
    );

    const levelRow = document.getElementById('level-row')!;
    levelRow.appendChild(
      makeCycler<number>({
        values: LEVELS.map((_, i) => i),
        value: this.levelIdx,
        label: (i) => `${LEVELS[i].name}`,
        onChange: (i) => {
          this.levelIdx = i;
          this.drawThumb();
        },
      })
    );

    this.applyModeConstraints();
    this.renderSlotRows();
    this.drawThumb();
    this.focus.refresh();

    document.getElementById('btn-start')!.addEventListener('click', () => this.startLocal());
    document.getElementById('btn-back')!.addEventListener('click', () => this.showTitle());
  }

  private drawThumb(): void {
    const cv = document.getElementById('level-thumb') as HTMLCanvasElement | null;
    if (!cv) return;
    const thumb = paintLevelThumb(LEVELS[this.levelIdx], this.assets);
    cv.getContext('2d')!.drawImage(thumb, 0, 0);
    const tag = LEVELS[this.levelIdx].tagline;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 150, 320, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '13px "Delius Unicase", cursive';
    ctx.textAlign = 'center';
    ctx.fillText(tag, 160, 170);
  }

  private applyModeConstraints(): void {
    if (this.mode === 'single') {
      let humanSeen = false;
      this.slots.forEach((s) => {
        const isHuman = s.who !== 'off' && s.who !== 'ai';
        if (isHuman) {
          if (humanSeen) s.who = 'ai';
          humanSeen = true;
        }
      });
      if (!humanSeen) this.slots[0].who = 'kb1';
      if (!this.slots.some((s) => s.who === 'ai')) this.slots[1].who = 'ai';
    }
  }

  private renderSlotRows(): void {
    const wrap = document.getElementById('slot-rows')!;
    wrap.innerHTML = '';
    const whoOptions: Participant[] = [
      'off',
      'ai',
      'kb1',
      'kb2',
      ...(hasTouch() ? (['touch'] as Participant[]) : []),
      'pad0',
      'pad1',
      'pad2',
      'pad3',
    ];
    this.slots.forEach((s, i) => {
      const row = el(
        `<div class="player-row ${s.who === 'off' ? 'inactive' : ''}">
           <span><span class="chip ${COLORS[i]}"></span>P${i + 1}</span>
         </div>`
      );
      row.appendChild(
        makeCycler<Participant>({
          values: whoOptions,
          value: s.who,
          label: (w) => WHO_LABEL[w],
          onChange: (w) => {
            s.who = w;
            if (this.mode === 'single') this.applyModeConstraints();
            this.renderSlotRows();
            this.focus.refresh();
          },
        })
      );
      row.appendChild(
        makeCycler<Build>({ values: ['normal', 'fast', 'slow'], value: s.build, label: (b) => BUILD_LABEL[b], onChange: (b) => (s.build = b) })
      );
      row.appendChild(
        makeCycler<Special>({ values: ['bounce', 'flame', 'mine'], value: s.special, label: (sp) => SPECIAL_LABEL[sp], onChange: (sp) => (s.special = sp) })
      );
      if (this.mode === 'team') {
        row.appendChild(
          makeCycler<number>({ values: [1, 2], value: s.team, label: (t) => `Team ${t}`, onChange: (t) => (s.team = t) })
        );
      }
      wrap.appendChild(row);
    });
  }

  private validateLocal(): { config: MatchConfig; sources: SlotSources } | string {
    const active = this.slots.map((s, i) => ({ ...s, slot: i })).filter((s) => s.who !== 'off');
    if (active.length < 2) return 'Need at least 2 gnomes.';
    const humans = active.filter((s) => s.who !== 'ai');
    if (humans.length < 1) return 'Need at least 1 human. The bots refuse to entertain each other.';
    const used = new Set<string>();
    for (const h of humans) {
      if (used.has(h.who)) return `${WHO_LABEL[h.who]} is assigned twice.`;
      used.add(h.who);
    }
    if (this.mode === 'single' && humans.length !== 1) return 'Single Player means one human vs the bots.';
    if (this.mode === 'team') {
      const teams = new Set(active.map((s) => s.team));
      if (teams.size < 2) return 'Both teams need at least one gnome.';
    }
    let botN = 0;
    const players: PlayerSetup[] = active.map((s) => ({
      slot: s.slot,
      name: s.who === 'ai' ? `Gnomebot ${++botN}` : `Player ${s.slot + 1}`,
      build: s.build,
      special: s.special,
      team: this.mode === 'team' ? s.team : s.slot + 1,
      isAI: s.who === 'ai',
    }));
    const sources: SlotSources = [null, null, null, null];
    for (const h of humans) sources[h.slot] = h.who as Source;
    return {
      config: {
        mode: this.mode,
        levelId: LEVELS[this.levelIdx].id,
        players,
        seed: (Math.random() * 0xffffffff) >>> 0,
      },
      sources,
    };
  }

  private startLocal(): void {
    const v = this.validateLocal();
    if (typeof v === 'string') {
      document.getElementById('setup-err')!.textContent = v;
      return;
    }
    this.persistSetup();
    this.startSession(v.config, v.sources, null);
  }

  private startSession(config: MatchConfig, sources: SlotSources, online: NetClient | null): void {
    this.setScreen('game', null, true);
    this.touch.show(sources.some((s) => s === 'touch'), !online);
    this.session = new GameSession(this.inputs, this.sfx, this.particles, this.renderer, {
      config,
      sources,
      online,
      onEnd: (result) => this.showPost(result, !!online),
      onQuit: () => {
        if (online) this.leaveOnline();
        this.showTitle();
      },
    });
  }

  // ---------------------------------------------------------------- online

  showOnline(err = ''): void {
    this.endSession();
    this.leaveOnline();
    this.setScreen(
      'online',
      `
      <div class="screen">
        ${this.topbar()}
        <div class="panel">
          <h1>Online Game</h1>
          <div class="row"><span>Your name:</span> <input type="text" id="name-input" maxlength="12" value="${this.myName.replace(/"/g, '')}" placeholder="GNOME" /></div>
          <h2 style="text-align:center">Host</h2>
          <div class="row"><button data-f data-f-default id="btn-host">Host a Room</button></div>
          <h2 style="text-align:center">Join</h2>
          <div class="row"><input type="text" id="code-input" maxlength="4" placeholder="CODE" /><button data-f id="btn-join">Join Room</button></div>
          <p class="error">${err}</p>
          <div class="row"><button data-f data-back id="btn-back" class="secondary">Back</button></div>
        </div>
      </div>`
    );
    this.wireTopbar();
    const nameInput = document.getElementById('name-input') as HTMLInputElement;
    const codeInput = document.getElementById('code-input') as HTMLInputElement;
    const getName = () => {
      this.myName = nameInput.value.trim() || 'Gnome';
      localStorage.setItem('sfb-name', this.myName);
      return this.myName;
    };
    document.getElementById('btn-host')!.addEventListener('click', async () => {
      const name = getName();
      try {
        await this.connectNet();
        this.net!.send({ t: 'create', name });
      } catch {
        this.showOnline('Could not reach the server.');
      }
    });
    document.getElementById('btn-join')!.addEventListener('click', async () => {
      const name = getName();
      const code = codeInput.value.trim().toUpperCase();
      if (code.length !== 4) return this.showOnline('Room codes are 4 letters.');
      try {
        await this.connectNet();
        this.net!.send({ t: 'join', code, name });
      } catch {
        this.showOnline('Could not reach the server.');
      }
    });
    document.getElementById('btn-back')!.addEventListener('click', () => this.showTitle());
  }

  private defaultOnlineSource(nth: number): Source {
    if (nth === 0) return hasTouch() ? 'touch' : 'kb1';
    const pads = this.inputs.connectedPads();
    return pads.length > 0 ? (`pad${pads[0]}` as Source) : 'kb2';
  }

  private connectNet(): Promise<void> {
    if (this.net) return Promise.resolve();
    this.net = new NetClient({
      onWelcome: (_code, _slot, connId) => {
        this.myConnId = connId;
      },
      onLobby: (lobby) => {
        this.lobby = lobby;
        this.mySlot = this.net?.yourSlot ?? this.mySlot;
        if (this.screen === 'lobby' || this.screen === 'online') this.showLobby();
      },
      onStarting: (config, yourSlots) => {
        const sources: SlotSources = [null, null, null, null];
        yourSlots.forEach((slot, i) => {
          sources[slot] = this.myOnlineSources[slot] ?? this.defaultOnlineSource(i);
        });
        this.startSession(config, sources, this.net);
      },
      onEnd: (result) => {
        this.session?.finishFromNet(result);
      },
      onError: (msg) => {
        if (this.screen === 'online') this.showOnline(msg);
        else toast(msg);
      },
      onClose: () => {
        if (this.screen === 'lobby' || this.screen === 'game' || this.screen === 'post') {
          toast('Disconnected from server');
          this.net = null;
          this.showTitle();
        }
      },
      onPong: () => {
        const b = document.getElementById('rtt-badge');
        if (b && this.net) b.textContent = `${this.net.rtt} ms`;
      },
    });
    return this.net.connect();
  }

  showLobby(): void {
    const lobby = this.lobby;
    if (!lobby || !this.net) return this.showOnline();
    this.endSession();
    const myPlayers = lobby.players.filter((p) => p.connId === this.myConnId);
    const iAmHost = myPlayers.some((p) => p.host);
    const meReady = myPlayers.length > 0 && myPlayers.every((p) => p.ready);
    const allReady = lobby.players.length > 0 && lobby.players.every((p) => p.ready);
    const total = lobby.players.length + Math.min(lobby.aiCount, 4 - lobby.players.length);
    const canAddLocal = myPlayers.length === 1 && lobby.players.length < 4;

    this.setScreen(
      'lobby',
      `
      <div class="screen">
        ${this.topbar()}
        <div class="panel">
          <div class="room-head"><h1>Room</h1><span class="code-badge">${lobby.code}</span></div>
          <p class="hint">Friends join at <b>${location.host}</b> → Online → this code · <span id="rtt-badge"></span></p>
          <div class="row" id="cfg-row"></div>
          <div class="lobby-players" id="lobby-players"></div>
          <div id="my-rows"></div>
          <div class="row">
            <button data-f data-f-default id="btn-ready">${meReady ? 'Unready' : 'Ready Up!'}</button>
            ${canAddLocal ? '<button data-f id="btn-add-local" class="secondary">+ Add couch player</button>' : ''}
            ${iAmHost ? `<button data-f id="btn-go" ${allReady && total >= 2 ? '' : 'disabled'}>Start Game</button>` : ''}
            <button data-f data-back id="btn-leave" class="danger">Leave</button>
          </div>
          ${iAmHost ? '' : '<p class="hint">The host picks mode, level and bots.</p>'}
        </div>
      </div>`
    );
    this.wireTopbar();

    const cfgRow = document.getElementById('cfg-row')!;
    if (iAmHost) {
      cfgRow.appendChild(
        makeCycler<GameMode>({
          values: ['ffa', 'team'],
          value: lobby.mode,
          label: (m) => (m === 'ffa' ? 'Free For All' : 'Team Deathmatch'),
          onChange: (m) => this.net!.send({ t: 'config', mode: m }),
        })
      );
      cfgRow.appendChild(
        makeCycler<string>({
          values: LEVELS.map((l) => l.id),
          value: lobby.levelId,
          label: (id) => levelById(id).name,
          onChange: (id) => this.net!.send({ t: 'config', levelId: id }),
        })
      );
      cfgRow.appendChild(
        makeCycler<number>({
          values: [0, 1, 2, 3],
          value: lobby.aiCount,
          label: (n) => `${n} bot${n === 1 ? '' : 's'}`,
          onChange: (n) => this.net!.send({ t: 'config', aiCount: n }),
        })
      );
    } else {
      cfgRow.innerHTML = `<span class="hint">${lobby.mode === 'ffa' ? 'Free For All' : 'Team Deathmatch'} · ${levelById(lobby.levelId).name} · ${lobby.aiCount} bots</span>`;
    }

    const list = document.getElementById('lobby-players')!;
    for (const p of lobby.players) {
      list.appendChild(
        el(`<div class="lobby-player">
          <span class="chip ${COLORS[p.slot]}"></span>
          <span class="name">${p.name}${p.host ? ' ★' : ''}${p.connId === this.myConnId ? ' (you)' : ''}</span>
          <span>${BUILD_LABEL[p.build]}</span><span>${SPECIAL_LABEL[p.special]}</span>
          ${lobby.mode === 'team' ? `<span>Team ${p.team}</span>` : ''}
          <span class="ready-dot">${p.ready ? '✔ ready' : '…'}</span>
        </div>`)
      );
    }

    // one loadout+controls row per LOCAL player on this connection (couch co-op online)
    const myRows = document.getElementById('my-rows')!;
    const padIds = this.inputs.connectedPads();
    const sourceChoices: Source[] = [
      ...(hasTouch() ? (['touch'] as Source[]) : []),
      'kb1',
      'kb2',
      ...padIds.map((i) => `pad${i}` as Source),
    ];
    myPlayers.forEach((p, nth) => {
      const row = el(
        `<div class="row my-player-row"><span><span class="chip ${COLORS[p.slot]}"></span>${p.name}</span></div>`
      );
      row.appendChild(
        makeCycler<Build>({
          values: ['normal', 'fast', 'slow'],
          value: p.build,
          label: (b) => BUILD_LABEL[b],
          onChange: (b) => this.net!.send({ t: 'loadout', slot: p.slot, build: b }),
        })
      );
      row.appendChild(
        makeCycler<Special>({
          values: ['bounce', 'flame', 'mine'],
          value: p.special,
          label: (s) => SPECIAL_LABEL[s],
          onChange: (s) => this.net!.send({ t: 'loadout', slot: p.slot, special: s }),
        })
      );
      if (lobby.mode === 'team') {
        row.appendChild(
          makeCycler<number>({
            values: [1, 2],
            value: p.team,
            label: (t) => `Team ${t}`,
            onChange: (t) => this.net!.send({ t: 'loadout', slot: p.slot, team: t }),
          })
        );
      }
      const current = this.myOnlineSources[p.slot] ?? this.defaultOnlineSource(nth);
      this.myOnlineSources[p.slot] = sourceChoices.includes(current) ? current : sourceChoices[0];
      row.appendChild(
        makeCycler<Source>({
          values: sourceChoices,
          value: this.myOnlineSources[p.slot],
          label: (s) => `Controls: ${WHO_LABEL[s]}`,
          onChange: (s) => (this.myOnlineSources[p.slot] = s),
        })
      );
      if (nth > 0) {
        const rm = el(`<button data-f class="danger">✕</button>`);
        rm.addEventListener('click', () => this.net!.send({ t: 'remove-local', slot: p.slot }));
        row.appendChild(rm);
      }
      myRows.appendChild(row);
    });
    this.focus.refresh();

    document.getElementById('btn-add-local')?.addEventListener('click', () => {
      this.net!.send({ t: 'add-local', name: `${this.myName || 'Gnome'} 2` });
    });
    document.getElementById('btn-ready')!.addEventListener('click', () => this.net!.send({ t: 'ready', ready: !meReady }));
    document.getElementById('btn-go')?.addEventListener('click', () => this.net!.send({ t: 'start' }));
    document.getElementById('btn-leave')!.addEventListener('click', () => {
      this.leaveOnline();
      this.showTitle();
    });
  }

  // ------------------------------------------------------------------ post

  showPost(result: MatchResult, online: boolean): void {
    this.postResult = result;
    this.postOnline = online;
    const acc = (s: { hits: number; shots: number }) => (s.shots > 0 ? `${Math.round((s.hits / s.shots) * 100)}%` : '—');
    const nemesis = (s: MatchResult['stats'][number]) => {
      let best = -1;
      let dmg = 0;
      s.dmgTo.forEach((d, i) => {
        if (d > dmg) {
          dmg = d;
          best = i;
        }
      });
      const victim = result.stats.find((q) => q.slot === best);
      return victim && dmg > 0 ? victim.name : '—';
    };
    const ranked = [...result.stats].sort(
      (a, b) => Number(result.winnerSlots.includes(b.slot)) - Number(result.winnerSlots.includes(a.slot)) || b.kos - a.kos
    );

    const cards = ranked
      .map((s) => {
        const win = result.winnerSlots.includes(s.slot);
        return `<div class="stat-card ${win ? 'winner' : ''}">
          <h2><span class="chip ${s.color}"></span>${s.name}${win ? ' 🏆' : ''}</h2>
          <table>
            <tr><td>KOs</td><td>${s.kos}</td></tr>
            <tr><td>Deaths</td><td>${s.deaths}</td></tr>
            <tr><td>Self-KOs</td><td>${s.selfKos}</td></tr>
            <tr><td>Damage dealt</td><td>${Math.round(s.dmgDealt)}</td></tr>
            <tr><td>Damage taken</td><td>${Math.round(s.dmgTaken)}</td></tr>
            <tr><td>Beans eaten</td><td>${s.beansCollected}</td></tr>
            <tr><td>Specials</td><td>${s.specialsUsed}</td></tr>
            <tr><td>Shots / Hits</td><td>${s.shots} / ${Math.floor(s.hits)}</td></tr>
            <tr><td>Accuracy</td><td>${acc(s)}</td></tr>
            <tr><td>Favorite victim</td><td>${nemesis(s)}</td></tr>
          </table>
        </div>`;
      })
      .join('');

    this.setScreen(
      'post',
      `
      <div class="screen dim">
        <div class="winner-banner">${result.text}</div>
        <div class="stats-grid">${cards}</div>
        <div class="row">
          ${
            online
              ? `<button data-f data-f-default id="btn-lobby">Back to Lobby</button>`
              : `<button data-f data-f-default id="btn-rematch">Rematch</button>
                 <button data-f id="btn-setup" class="secondary">Change Setup</button>`
          }
          <button data-f id="btn-title" class="secondary">Main Menu</button>
        </div>
      </div>`
    );

    document.getElementById('btn-rematch')?.addEventListener('click', () => {
      const cfg = this.session?.opts.config;
      const sources = this.session?.opts.sources;
      if (!cfg || !sources) return this.showLocalSetup();
      this.startSession({ ...cfg, seed: (Math.random() * 0xffffffff) >>> 0 }, sources, null);
    });
    document.getElementById('btn-setup')?.addEventListener('click', () => this.showLocalSetup());
    document.getElementById('btn-lobby')?.addEventListener('click', () => {
      this.endSession();
      this.showLobby();
    });
    document.getElementById('btn-title')?.addEventListener('click', () => this.showTitle());
  }

  // ----------------------------------------------------------------- pause

  private buildPauseOverlay(): void {
    const overlay = el(`
      <div id="pause-overlay" class="hidden">
        <div class="screen dim" style="position:absolute;inset:0">
          <div class="panel">
            <h1>Paused</h1>
            <div class="menu-list">
              <button data-f data-f-default id="pause-resume">Resume</button>
              <button data-f id="pause-quit" class="danger">Quit to Menu</button>
            </div>
            <p class="hint">Esc / Space / Start to resume</p>
          </div>
        </div>
      </div>`);
    document.getElementById('stage')!.appendChild(overlay);
    overlay.querySelector('#pause-resume')!.addEventListener('click', () => this.session?.togglePause());
    overlay.querySelector('#pause-quit')!.addEventListener('click', () => this.session?.quitToMenu());
    const obs = new MutationObserver(() => {
      if (!overlay.classList.contains('hidden')) this.pauseFocus.attach(overlay as HTMLElement);
    });
    obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }
}

const app = new App();
void app.boot();
// dev/testing hook
(window as unknown as { __sfb: App }).__sfb = app;
