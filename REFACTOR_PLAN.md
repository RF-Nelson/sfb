# Super Fart Bros. — Rewrite Plan & Feature Parity Spec

Analysis date: 2026-07-12, from commit `54490f7`. Behavior below was verified by reading all of
`lib/` and by running the game in Chrome (menus, gameplay, damage, death pit, post-game screen).

This document is the working spec for the from-scratch rewrite. Section 2 is the parity
contract: the rewrite is done only when everything in it works.

---

## 1. Current architecture (as-is)

- ~3,500 lines of ES5, no build step, script tags in `index.html`, everything on a global
  `SFB` namespace plus mutable globals (`PLAYERS`, `GAMEMODE`, `COMPUTERS`, `window.game`,
  `window.emitter`, `window.flames`, …).
- Prototype-inheritance chain: `GameObject → MovingObject → SpriteGameObject → AnimatedObject
  → Gnome/Fart/Bean/…` via a surrogate-constructor `inherits` helper.
- Fixed 20 ms `setInterval` game loop (input poll → collisions → move → timers → win check),
  plus a separate self-rescheduling `setTimeout(requestAnimationFrame(draw), 20)` render chain.
  Loops are never torn down (see bugs).
- Rendering: one main 1920×1080 canvas letterboxed to the window; three extra full-screen
  canvases created at runtime (`fireworks`, `mine`, `flamethrower`) for particle effects via
  vendored `fireworks.js`. Sprite sheets are PNG strips; frame count encoded in the filename
  (`name@18.png` = 18 columns), parsed by `SpriteSheet`.
- The level's art is baked into `sprites/cloud.gif`, set as CSS `background-image` on
  `#gameArea`. Platform *collision* rectangles are hardcoded in `scene.js` and hand-aligned
  to that art; platform drawing code is commented out. The menu background is `cloudOLD.gif`.
- Menus are jQuery/DOM show-hide sections in `index.html` with inline event wiring.
- Input: `keymaster` for two keyboard players; `navigator.getGamepads()` polled every 20 ms
  into a global for up to 4 pads.
- Flamethrower particle frames are fetched at game start from **25 hardcoded Dropbox URLs**
  (still alive as of today, ~650 ms each, but a single point of failure).
- No audio anywhere. No touch controls. No server component of any kind.

## 2. Feature parity contract

### 2.1 Modes
| Mode | Players | Teams | Win condition |
|---|---|---|---|
| Single Player | 1 human + 1–3 AI | Human = team 1; each AI its own team (AIs also fight each other) | All AI dead → "You Win!"; human dead → "You Lose!" |
| Free For All | 1–4 humans | Everyone own team | `numDeaths === numPlayers − 1` |
| Team Deathmatch | 2–4 humans | Player-chosen, Team 1 or 2 | All living gnomes share a team |

### 2.2 Character builds (chosen per player pre-game)
| Build | Speed | Toughness (damage divisor) |
|---|---|---|
| Normal | 1 | 1 |
| Fast | 2 | 0.5 |
| Slow | 0.5 | 2 |

Player slots (fixed): P1 blue (spawn x100, faces Right), P2 orange (x1640, Left),
P3 purple (x300, Right), P4 green (x1340, Right). All spawn on the ground (y = 949).

### 2.3 Attacks — **all attacks fire backwards, out of the butt**
This is the signature mechanic, not a bug: facing Right fires the projectile left (xvel −8)
and recoils the gnome forward (+2.5 xvel). Preserve exactly.

| Attack | Cost | Strength | Behavior |
|---|---|---|---|
| Standard fart cloud | free | 2 | xvel ∓8 (opposite facing), yvel = gnome.yvel×0.2, destroyed on any hit or leaving bounds, ~18-tick (~360 ms) cooldown shared with specials, +1 shot stat |
| Bounce (special) | 5 beans | 3 | Same launch, bounces off platforms (invert axis velocity), wraps horizontally, 10 s lifetime |
| Mine (special) | 5 beans | 25 | Tossed gently backwards (xvel ∓0.8), falls (yvel 5), sticks to platform tops, arms after 1 s, then explodes on contact with **any** gnome — including the owner and teammates (keep: risk/reward comedy) |
| Flame (special) | 5 beans | 0.2 × remaining-fraction per tick | 1.5 s flamethrower jet behind the gnome; hitbox ~50×120 moving away from facing; damage ticks every 20 ms (up to ~10 HP/s); hits count 0.1 toward stats; no friendly fire |

Standard/Bounce/Flame skip teammates (and self); Mines hit everyone.
Special usable with meter ≥ 1 but costs 5 (meter can go negative) — **fix in rewrite: require ≥ 5.**

### 2.4 Beans & fart pack
- Bean pickup: +20 bean meter, cap 100. Beans spawn at random non-terrain positions
  (y ∈ 0–900), float in place, animated can sprite.
- Spawn pacing (per 20 ms tick, counter +20 until threshold): ≤2 players → every ~2.5 s cap 11;
  3 players → ~2.3 s cap 14; 4 players → ~2.0 s cap 16.
- Fart pack (jetpack): costs 5 beans, gives 1000 ms of flight: initial yvel = −5, gravity 0.1
  (vs normal 1.0), horizontal drag ×0.98, air control fixed ±3, smoke-puff exhaust trail
  (one puff per ~10 frames, drifting randomly, ~1.5 s TTL).
- (A separate spawnable FartPack *pickup item* exists in code but spawning is disabled and its
  collide handler calls a method that doesn't exist — dead feature, drop it.)

### 2.5 Movement physics (20 ms tick — parity-critical constants)
| Constant | Value |
|---|---|
| Gravity | +1 px/tick² (0.1 while fart-packing) |
| Jump impulse | −25 (only when on ground) |
| Ground friction | ×0.92/tick, snap to 0 below \|0.15\| |
| Air drag | ×0.92/tick |
| Ground accel | +speed/tick; quirk: if result > 20 it snaps to 10 (Fast gnomes sawtooth 10→20→10 — replace with a clean cap ≈ 20, note the change) |
| Air control (no pack) | xvel set to ±10 |
| Air control (packing) | xvel set to ±3 |
| Ceiling | y clamped ≥ 50 |
| Kill plane | y > 1020 → lose a life |
| Horizontal wrap | walk off left edge → reappear right (gnomes and Bounce farts wrap; other projectiles despawn out of bounds) |

### 2.6 Health, lives, death
- 100 HP; damage = strength ÷ toughness; hit spawns explosion particle burst at gnome center.
- HP ≤ 0 or kill plane → lose 1 of 3 lives → respawn at uniformly random (x, y) with full HP
  (can respawn mid-air/over the pit — keep, it's funny).
- Last life → gnome explodes into flying gibs: 7 body-part sprites (legs, boots, hat, hand,
  head) + tumbling color-matched torso, plus both explosion particle effects; corpse removed
  from play; death counted for win check.

### 2.7 Level 1 — "Garden" (art baked into cloud.gif, 1920×1080)
| Piece | Rect (x, y, w, h) |
|---|---|
| Ground left | (0, 1000, 860, 80) |
| Ground right | (1060, 1000, ~960, 80) |
| Death gap | x ∈ (860, 1060) at floor level |
| Floating log | (200, 760, 400, 50) |
| Grass block | (1450, 760, 400, 500) |

### 2.8 HUD & screens
- Floating per-gnome meters: HEALTH (red on lightcoral, white border) and BEANS (brown on
  black) pills above the head; "TEAM n" label in team mode.
- "Player n Lives: x" text at fixed bottom positions; instruction line at top
  ("Collect Beans To Power Your Jet Pack & Special Attack" / "Press Space/Start to pause.").
- Menu flow: title (Single/FFA/Team/About) → count select (players or computers) →
  per-player config (build, special, team in team mode) with ready-up gating → Start.
- Pause (Space / pad Start): overlay listing all control schemes, game hidden while paused.
- Post-game: winner headline ("Player n Wins!" / "Team n Wins!" / "You Win/Lose!"),
  per-player Shots / Hits (floored) / Accuracy (2 dp; NaN when 0 shots — fix), Replay and
  Main Menu (currently a full page reload) buttons.

### 2.9 Controls
| Action | KB P1 | KB P2 | Gamepad (each) |
|---|---|---|---|
| Move | A / D | ← / → | Left stick X (±0.5) |
| Jump | W | ↑ | RT (button 7) or stick-down (axes[1] > 0.8) |
| Fart pack | S | ↓ | LT (button 6) |
| Standard fart | Q | Option/Alt | A (button 0) |
| Special | E | Shift | B (button 1) |
| Pause | Space | Space | Start (button 9) |

### 2.10 AI ("crude by design")
Random walk with direction flips every 0–50 ticks; fires a standard fart when its step
counter hits 24; jumps at positions hardcoded to Level 1's gap and block; random build +
special at creation; never uses specials or the fart pack. Rewrite: same personality, but
driven by per-level nav hints (jump zones from level data, not magic numbers).

## 3. Bugs found (verified) — fix in rewrite, don't port

1. **Free-For-All and Team Deathmatch crash on fresh page load in current master** —
   `COMPUTERS` is only defined by the single-player menu path; `Game.addComputers()` throws
   `ReferenceError` and the game never starts. (Verified live; the deployed site likely
   predates commit `290286e`.)
2. Pause key is re-bound via `key("space", …)` every 20 ms tick → hundreds of stacked
   handlers; each press toggles pause once per handler (net effect is parity-of-count
   roulette).
3. Replay stacks a new `setInterval` sim loop and a second rAF draw chain on the old ones —
   never cleared; render also keeps looping after game over.
4. Sprite-load gating is broken two ways: `SpriteSheet` increments `SFB.Game._spritesStillLoading`
   (class prop) while the check reads the instance prop (always 0), and the retry is
   `setTimeout(startGame(), 100)` (invokes immediately).
5. Flame extinguish-early check reads the literal `"s"` key for every player.
6. `Game.winner()` returns from a `forEach` callback (always undefined) — dead path.
7. Accuracy shows `NaN` for 0 shots; special fires with 1 bean but charges 5 (meter goes
   negative).
8. Pressing P2 keys in a 1-player FFA throws (gnomes[1] undefined) and kills that tick.
9. **Case-sensitive asset 404s on Linux hosting**: `bluefartleft@6`, `bluefartright@6`,
   `bluejumpdownleft@5`, `bluejumpdownright@5`, `bluejumpupleft@12`, `bluejumpupright@12`,
   `greenjumpUpleft@12`, `cloudold.gif` (menu background) are referenced with different case
   than the files on disk. Works on macOS, breaks in a fly.io container. Normalize every
   asset filename to lowercase-kebab in the rewrite.
10. Flamethrower frames load from 25 Dropbox URLs — external, slow, un-versioned. Bring all
    assets into the repo (or regenerate with the new particle system).
11. Google Font loaded over `http://` — blocked as mixed content once hosted on HTTPS
    (fly.io); HUD/menu font silently falls back. Self-host the font.
12. Type confusion by design: exhaust puffs live in `game.beans`, death gibs in `game.farts`,
    with stubbed hitboxes. Replace with a proper entity/particle split.

## 4. Target architecture

**Stack: TypeScript (strict) everywhere · npm-workspaces monorepo · Vite client · Node 22 +
`ws` server · no game framework.** The sim is tiny and its feel lives in exact constants
(§2.5); a framework's physics would fight parity, and the sim must also run headless on the
server. Vanilla Canvas 2D handled this game fine ten years ago and still does.

```
packages/
  shared/   # THE game: deterministic sim, no DOM/Node deps
    sim/    # fixed 20ms tick: physics, combat, beans, AI, win logic
    levels/ # level defs as data: rects, spawns, bean zones, death zones,
            # AI jump hints, background art id
    proto/  # message types: inputs, snapshots, lobby events
  client/   # Vite app: renderer, input, menus, particles, net client
  server/   # Node: static hosting + WebSocket rooms running shared/sim
```

Key decisions:
- **Deterministic sim**: integer tick counter, all randomness through a seeded PRNG
  (mulberry32), inputs are per-player button bitmasks per tick. Same code drives local play,
  the authoritative server, AI, and future replays/rollback.
- **Netcode**: authoritative server at 50 Hz sim / 20 Hz snapshots; clients stream inputs and
  render remote state through a ~100–120 ms interpolation buffer. Full-state JSON snapshots
  first (state is < 2 KB); binary encoding only if measurements demand it. Add local-player
  prediction + reconciliation as a follow-up if self-movement feels floaty. Rollback/GGPO is
  deliberately out of scope — wrong cost/benefit for a 4-player party game.
- **Transport abstraction**: `LocalTransport` (in-process, zero latency) vs
  `SocketTransport` — local/offline play never touches the network and keeps working with the
  server down.
- **Rooms**: 4–5 letter join codes; host picks mode + level; each room = one sim instance;
  AI fill available server-side for free (sim owns the AI).
- **Renderer**: single canvas, internal 1920×1080, letterboxed (same as today); layered draw
  order in code; pooled in-house particle system replacing fireworks.js + the three extra
  DOM canvases + Dropbox flames.
- **Menus**: DOM-based with a roving-focus controller so **every screen is fully navigable by
  gamepad** (D-pad/stick + A/B) — required for consoles, nicer for couch play everywhere.
- **Build target ES2017** for PS4's older WebKit; Xbox Edge is evergreen Chromium.
- **Tests**: vitest on the sim — the §2.5 constants table, cooldowns, damage math, bean
  pacing, win conditions, and a bots-vs-bots headless soak test.
- Keep the current game reachable at `/classic` (copy as-is) for side-by-side regression
  checks during the rewrite.

## 5. New features

1. **Two new levels** — levels become data + a background painting. Proposed: a vertical
   multi-platform map with side kill-gaps, and a cavern map with a low ceiling and central
   pillar (final layouts to taste). Level select screen after mode select; each level defines
   spawn points, bean zones, and AI hints.
2. **Better menus** — title → mode → (online: host/join code) → level select → character
   cards (build/special/team/color with live gnome preview) → ready-up → countdown.
   Gamepad-first navigation, remembers last loadout (localStorage), proper in-game pause
   (no more broken space handler), quit-to-menu without page reload.
3. **Better post-game stats** — per player: KOs, deaths, self-KOs (pit falls), damage dealt/
   taken, beans collected, specials used, shots/hits/accuracy (0-safe), favorite victim;
   podium ranking for FFA, team totals for team mode.
4. **Winner celebration** — podium scene: winning gnome sprite doing fart-pack loops with
   full exhaust trail, confetti + firework particles, crown, name banner; losers' gibs rain
   gently in the background. Then the stats board with Replay / Change Setup / Main Menu.
5. **Internet multiplayer** — as architected in §4 (rooms, codes, spectate-on-late-join
   optional later).
6. **fly.io hosting** — one Fly app: multi-stage Dockerfile (build client → Node serves
   `dist/` + `/ws`), `fly.toml` with `force_https`, health endpoint, single region to start
   (rooms are in-memory; multi-region needs `fly-replay` room affinity later). Custom domain
   + certs for superfartbros.com. (If the domain is on Namecheap, DNS setup can be fully
   automated.)
7. **Better special-effect graphics** — new pooled particle FX: soft-alpha fart clouds with
   puff-out, flame jet with heat shimmer, mine shockwave ring + debris, bean pickup sparkle,
   exhaust trail, hit flash, screen shake on mine hits and KOs. Existing gnome sprite sheets
   are kept — they're the game's charm. **Recommended addition: sound effects** (farts, boing,
   explosion, fanfare) — the game currently has zero audio, which is a crime for this IP;
   cheap to add behind a mute toggle.
8. **Console browsers** — honest targets: **Xbox One/Series Edge (Chromium): fully
   supported** — Gamepad API + WebSockets work; needs gamepad menu nav (§4), 10-foot font
   sizes, ~5% TV-safe margins, and handling Edge's controller-as-mouse emulation. **PS4:
   best-effort** via its WebKit browser (ES2017 build target, conservative perf budget).
   **PS5 has no user-accessible browser** — it cannot be an official target; document the
   messages-app workaround only as a curiosity.

## 6. Phased roadmap

| Phase | Deliverable | Acceptance |
|---|---|---|
| 0 | Monorepo scaffold; assets migrated (lowercase names, Dropbox frames localized, font self-hosted); `/classic` preserved | `npm run dev` serves both new shell and classic game |
| 1 | `shared/sim` with full §2 behavior + vitest parity suite | Bots-vs-bots headless match completes; constants tests green |
| 2 | Client renderer + input + local play, Level 1 | Side-by-side feel check vs `/classic`; 2-KB + 4-pad couch play; 60 fps |
| 3 | New menu system + pause + post-game stats & celebration | All screens gamepad-navigable; every §2.8 flow replaced |
| 4 | Server, rooms, online play; fly.io deploy + domain | Two browsers on different networks complete a match; redeploy-safe |
| 5 | Two new levels + FX overhaul (+ audio if approved) | Level select works local & online; FX replace fireworks.js everywhere |
| 6 | Console pass | Playable on Xbox Edge end-to-end via gamepad only; PS4 smoke-tested |

## 7. Open decisions (defaults chosen, flag to change)

- Vanilla TS + Canvas over Phaser/PixiJS — **default: vanilla** (parity + headless server sim).
- Mines hurt owner/teammates — **default: keep** (signature chaos).
- Fast-gnome speed sawtooth (§2.5) — **default: replace with clean cap**.
- Add audio — **default: yes**, behind mute.
- PS5 — **default: out of scope** (no browser); Xbox primary console target.
- Steam strategy — see §8; **default: web rewrite first, Steam via wrapper as market test,
  Unity only if it sells**.

## 8. Unity + Steam path evaluation

Question evaluated: effort to build SFB in Unity and sell it as a proper game on Steam,
versus (and combined with) the web rewrite above.

### 8.1 What transfers to Unity, what doesn't

- **Transfers**: the §2 parity contract (deliberately engine-agnostic), all sprite sheets
  (PNG strips slice cleanly in Unity's Sprite Editor; frame counts already known from the
  `@N` filenames), the level background paintings, level geometry data, and the game design
  itself.
- **Does not transfer**: every line of code. Unity is C#; this is a full second
  implementation regardless of how the web rewrite goes.
- **Asset resolution caveat**: gnome frames are 104×191 px — correct for the 1080p canvas,
  low for a commercial title at 1440p+. The README says the gnomes were modeled/rigged/
  animated in 3ds Max; if the `.max` sources still exist, frames can be re-rendered at 2–4×
  (or the rigs used as real 3D in Unity). If the sources are lost, the current sheets cap the
  visual quality bar — plan around upscaling + heavy FX/juice instead.

### 8.2 How the game maps onto Unity

| Area | Approach | Relative difficulty vs web plan |
|---|---|---|
| Sim / physics parity | Kinematic controller in `FixedUpdate` — Unity's default fixed step is 0.02 s = exactly this game's 50 Hz tick. Do NOT use Rigidbody2D dynamics; port §2.5 constants verbatim | Same |
| Animation | Slice existing sheets; simple sprite-swap animator | Same |
| Particles / FX / juice | Shuriken particle system, Cinemachine impulse for shake | **Easier** — this is where Unity shines |
| Menus + gamepad nav | UGUI/UI Toolkit + EventSystem (navigation built in) | **Easier** |
| 4-pad + 2-keyboard local play | Input System `PlayerInputManager`, control schemes | **Easier** |
| Audio | Built in | Easier |
| Online multiplayer | See 8.3 — Steam changes the calculus | Different, not cheaper |
| Web presence | Unity WebGL export exists but is heavy (15–30 MB+), and **kills the console-browser feature** (PS4 WebKit can't run it; Xbox Edge is marginal). superfartbros.com as an instant-load game effectively requires the web build | **Much worse** |
| Iteration speed | Editor domain reloads vs Vite HMR | Worse |

License note: Unity Personal is free below $200 k revenue/funding; the 2023 runtime fee was
cancelled (Sept 2024) and the splash screen is optional on Unity 6. Use Unity 6 LTS, 2D
URP.

### 8.3 What Steam actually adds (the commonly underestimated half)

- **Steam Direct**: $100/app (recouped after $1 k gross), tax/banking onboarding, store page
  (capsule art in ~6 sizes, screenshots, trailer), release-review lead time.
- **Expected features**: achievements, Steam Input glyphs, cloud saves (trivial here), rich
  presence; **Steam Deck verification** — this game is a natural Deck fit and should treat
  Deck as a first-class target (gamepad-only nav, readable 10-foot text — same requirements
  §4 already imposes for Xbox).
- **Networking upside**: Steamworks lobbies + Steam Datagram Relay give NAT-traversing P2P
  with friend invites and **zero server hosting costs** (vs fly.io). Via Facepunch.Steamworks
  / Steamworks.NET + a FishNet/Mirror Steam transport.
- **The v1 shortcut — Remote Play Together**: a local-multiplayer-only Steam build gets
  online co-op for free (host streams; friends join with invite links, even without owning
  the game). Many indie party games ship v1 this way and add real netcode only if sales
  justify it. This removes the single biggest engineering line item from Steam v1.

### 8.4 Commercial blockers found in the current assets (apply to ANY paid release)

1. **The bean pickups are photographs of Branston Baked Beans cans** — real trademarked
   packaging (Mizkan brand). Fine as a free web gag; a lawsuit magnet in a paid product.
   Must be replaced with original bean art.
2. **Flamethrower frames were converted from Tremulous game assets** (per the comment in
   `fireBall.js`) — GPL/CC-licensed content, incompatible with a closed commercial release
   as-is. Replaced anyway by the new FX system, but do not carry them into a paid build.
3. `explosion.png` and fonts: provenance unknown — audit before shipping paid.
4. **Naming**: "Super Fart Bros." parodies Nintendo's registered SUPER SMASH BROS. mark.
   Parody defenses exist but Steam takedown requests don't care; consider a distinct primary
   title with the parody as flavor text. (Flag for a proper opinion, not legal advice.)
5. **Co-authorship**: the About page credits Rich Nelson *and* Bryan Millstein. Selling it
   requires agreeing ownership/revenue split first.

### 8.5 Effort (solo, focused full-time-equivalent weeks, ±50%; "experienced" = already
fluent in that stack)

| Path | Scope | Experienced | Learning Unity from scratch |
|---|---|---|---|
| A. Web rewrite (§4–6, all original goals) | parity + new features + websockets + fly.io + console browsers | ~7–10 wk | n/a |
| B. A + Steam via desktop wrapper | Electron/Tauri wrap of the web build + steamworks.js (achievements, RPT, overlay) + store assets + Deck pass + asset replacement (8.4) | **+2–4 wk on top of A** | n/a |
| C. Unity Steam v1, no custom netcode | parity, menus, stats, 3 levels, FX, audio, Steamworks, Remote Play Together, Deck | ~6–9 wk | ~10–15 wk |
| C+. Unity with real online play | + FishNet/NGO + Steam transport, lobbies, invites, interpolation | ~9–14 wk | ~13–20 wk |

Path B and C are not additive with A's netcode phase: B reuses it outright; C replaces it
with Steam services. HTML5-tech games ship on Steam routinely (CrossCode, early Vampire
Survivors), so B is not a second-class release for a 2D canvas party game — but it will
never become a native console-store build.

### 8.6 Recommendation

The decision is really "which goal is primary":

- **If superfartbros.com + console browsers + online play (the original feature list) still
  matter → build the web rewrite (A), then ship Steam v1 as the wrapped build (B).** One
  codebase covers every stated goal, Steam revenue potential gets market-tested for +2–4 wk
  of effort, and Remote Play Together covers online for Steam friends from day one.
- **Invest in Unity (C) when/if one of these is true**: the Steam release shows real
  traction and deserves native console-store ports (Switch/Xbox/PS — which web tech can
  never reach); or the web goals are dropped and Steam is the sole target; or learning Unity
  is itself part of the point.
- The §4 architecture is the hedge: the deterministic sim is pure logic with no DOM
  dependencies, so a later TS→C# port of the game rules is mechanical translation against
  the same §2 spec and test list — building A first does not waste the Unity option.
- (If engine work does happen and the choice reopens: Godot 4/C# is the lighter-weight
  alternative many 2D indies pick now, but its web export is also too heavy for console
  browsers — it changes nothing strategic here.)
