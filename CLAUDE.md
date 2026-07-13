# Super Fart Bros. — project guide for Claude

Smash-Bros-style 4-player browser party game with farting gnomes. This repo contains
**two games**: the untouched 2014 original (root `index.html` + `lib/` + `vendor/`, served
at `/classic`) and the **2026 TypeScript rewrite** (`packages/`), which is the live game at
https://superfartbros.fly.dev. Feature parity with 2014 is a hard requirement — the
contract is `REFACTOR_PLAN.md` §2. Read that before touching gameplay.

## Iron rules

- **All attacks fire BACKWARDS** (out of the butt) and recoil pushes the gnome forward.
  This is the signature mechanic. Any change that makes farts fire forward is a bug.
- **The sim (`packages/shared`) must stay deterministic**: fixed 20 ms tick, no
  `Math.random`/`Date.now` inside sim code — all randomness through the seeded `Prng`.
  The same sim runs locally (client) and authoritatively (server); they must not diverge.
- **Physics constants live in `packages/shared/src/constants.ts`** and mirror the 2014
  code; don't "clean them up" (see REFACTOR_PLAN §2.5). Changes to game feel go through
  the decision log below.
- **Levels**: edge floor rects must overhang the wrap seam by ~100 px (like the original
  garden's floor extending to x=2020) or gnomes die crossing x≈1920. Every level needs
  `aiJumpZones`, and `aiAvoidZones` beside any pit wider than ~400 px (unjumpable).
- **Never touch the 2014 files** (`lib/`, `vendor/`, root `index.html`, `css/`) except for
  serving/packaging (`tools/build-classic.mjs` handles its Linux case-sensitivity fixes).
- **fly.io must run exactly ONE machine** — rooms live in process memory. `fly deploy`
  loves to create a second "for high availability"; if it does, `fly scale count 1 --yes`.
- **Don't rename sprite assets**: `tools/sync-assets.mjs` lowercases them into the client
  (8 originals have case-mismatched references; macOS hides this, Linux 404s).
- Keep the client build target **ES2017** (PS4 WebKit floor) and every menu fully
  **gamepad-navigable** (`data-f` focus system) — console browsers have no mouse.

## Layout & commands

```
packages/shared   sim, levels, AI, protocol (pure TS, no DOM/Node deps)
packages/client   Vite app: renderer, particles, procedural audio, menus, net client
packages/server   Node + ws: static hosting, rooms, authoritative 50 Hz sim
tools/            sync-assets.mjs, build-classic.mjs
```

- `npm run dev` — Vite client only (local play; `/ws` proxies to :8080)
- `npm run dev:server` — full build + real server on :8080 (needed for online play)
- `npm test` — sim parity suite (vitest, `packages/shared/test`)
- `npm run build` — client + server + classic-dist
- `fly deploy --remote-only --yes` — deploy (app `superfartbros`, region ewr, 1 machine)

Netcode: server steps 50 Hz, snapshots every 2nd tick, clients render ~110 ms behind with
interpolation; inputs are level-triggered bitmasks (`shared/src/input.ts`). No client
prediction yet — add only if self-movement feels floaty at real-world RTT.

## Decision log

**2026-07-12 — Rewrite shipped** (analysis → plan → implementation → fly.io deploy in one day)

- Stack: vanilla TS + Canvas 2D monorepo, no game framework, Node+`ws` server,
  authoritative-server netcode with snapshot interpolation. Rationale in REFACTOR_PLAN §4.
- Kept from 2014: all physics constants, backwards-firing attacks, mines hurting their
  owner (and teammates), bean pacing/costs, 3-lives/100 HP, level-1 geometry, crude AI
  personality, horizontal wrap, ±50 px landing slop, invisible-baked level-1 art.
- Deliberate deviations from 2014 (approved defaults): specials require the full 5 beans
  (was: fire at ≥1, meter went negative); Fast-gnome ground speed is a clean ±20 cap
  (was: >20 snapped to 10, causing a sawtooth); **respawns land above a random platform**
  (was: anywhere including over the pit — instant re-death chains on the new wide-pit
  levels); flame no longer extinguishes early via the (buggy) literal "s"-key check;
  pause/replay loop-stacking bugs not ported. FFA/Team crash on fresh load
  (`COMPUTERS` undefined) fixed by design.
- New content: Log Heaven (skylogs) and The Compost Cave (cave) levels, procedural
  painted backgrounds; menus with gamepad focus nav; expanded post-game stats
  (KOs/deaths/self-KOs/damage/beans/specials/accuracy/favorite victim) + podium
  celebration with confetti; online rooms with 4-letter codes + optional server-side
  bots; procedural WebAudio SFX (2014 had zero audio); particle FX replace fireworks.js,
  the Dropbox-hosted flame frames, and `explosion.png`.
- Fixed during verification: world-wrap seam deaths on the new levels (floors now
  overhang the seam), AI lemming-into-600px-pit (aiAvoidZones), Fly HA second machine
  (breaks in-memory rooms — scaled to 1).
- Deployed: app `superfartbros`, region `ewr`, shared-cpu-1x/512 MB, force_https,
  `min_machines_running=1`, health check `/healthz`. superfartbros.com DNS **not yet
  pointed** at fly (open item).
- Unity/Steam evaluated (REFACTOR_PLAN §8): decision = web first; Steam later via
  Electron/Tauri wrapper + Remote Play Together (~+2–4 wk); Unity only if Steam shows
  traction. If Unity ever happens: use the newest LTS ≥6 months old (Unity 6.3 LTS as of
  mid-2026; 6.0 LTS support ends Oct 2026). Commercial blockers recorded in §8.4
  (Branston bean-can trademark, GPL Tremulous flame frames, name parodies Nintendo's
  mark, co-creator ownership with Bryan Millstein).

**2026-07-12 — Mobile controls, lobby fix, custom domain**

- Lobby header no longer overlaps (room code moved out of the `<h1>` into a
  `.room-head` flex row; duplicate `.code-badge` CSS removed).
- **Touch controls added** (`client/src/touch.ts`): multi-touch on-screen buttons
  (◀ ▶ / JUMP / FLY / SPEC / FART + pause), pointer-per-button hit-testing so thumbs can
  slide between buttons; `touch` is a selectable input source everywhere (local setup,
  online lobby) and the default on coarse-pointer devices; portrait orientation shows a
  rotate hint; viewport locked (`user-scalable=no`, `touch-action:none`).
- Bug fix: `NetClient.close()` now suppresses its own onClose callback — leaving a lobby
  then immediately starting a local game no longer kicks you back to the title screen.
- **superfartbros.com now points at the fly app** (Namecheap API via the
  fly-namecheap-site skill): switched the domain from Namecheap *hosting* nameservers to
  BasicDNS, wrote A/AAAA for apex+www → fly, added fly certs for both, and the Node
  server 301-redirects www→apex. **The domain had live email records** (MX →
  jellyfish.systems, SPF TXT, mail A) — these were carried over verbatim so mail keeps
  working; they're pinned in the scratch copy of the DNS script and listed in the DNS
  zone. If Rich ever cancels the old Namecheap hosting package, that mail service dies
  with it (the MX targets are the hosting package's servers).
- Namecheap API creds live in `~/Documents/namecheap-test/.env` (user `rfn`); this
  machine's IP is whitelisted for the Namecheap API. Gotcha discovered: after
  `dns.setDefault` (hosting→BasicDNS), Namecheap's internal state lags — `getHosts`
  errors with "not using proper DNS servers" and `setHosts` writes are accepted but not
  published until the state settles (~30 min here). Fix: poll `getHosts` until OK, then
  re-run `setHosts`.

**2026-07-12 — superfartbros.com is live on fly**

- Both Let's Encrypt certs issued; https://superfartbros.com serves the game (200),
  www 301-redirects to apex, /classic serves the 2014 original, MX/mail records intact,
  and websocket rooms work over the custom domain. The old Namecheap-hosting site is no
  longer reachable at the domain (hosting package itself untouched — mail still lives
  there).

**2026-07-12 — Scale to zero (cost)**

- fly.io now runs `auto_stop_machines = "suspend"` + `min_machines_running = 0`:
  the machine suspends when nobody is connected (websockets count as activity, so it
  never suspends mid-game) and resumes on demand. Measured: resume-from-suspend
  **0.34 s**; full cold boot from "stop" was 6.6–7.6 s, which is why suspend mode won.
  Idle cost ≈ rootfs pennies instead of ~$3–5/mo always-on. Still exactly ONE machine.

**2026-07-12 — iOS full screen: PWA + viewport fix**

- iPhone Safari cannot hide its chrome for websites (no element Fullscreen API there), so
  the app is now an installable **PWA**: `manifest.webmanifest` (`display: fullscreen`,
  landscape), generated icons (gnome-on-grass, 192/512/180 in `client/public/icons/` —
  committed, NOT in the gitignored generated assets dir), apple-mobile-web-app metas with
  black-translucent status bar. Installed via Share → Add to Home Screen it runs with no
  browser UI. The title screen shows that hint automatically on iOS-in-browser.
- Fixed the cropped-page bug from Rich's screenshot: `fit()` now sizes/centers the stage
  from `visualViewport` (+ its resize/scroll events) — iOS `innerHeight` lies while the
  URL bar is visible.
- Desktop/Android/iPad get a ⛶ Fullscreen topbar button (element fullscreen +
  best-effort landscape orientation lock). `.webmanifest` MIME type added to the server.
- No service worker on purpose (online game; avoids cache-invalidation pain). Revisit
  only if offline shell/faster loads become a goal.

## Workflow

**Every decision or notable change gets recorded in this file's decision log, then
committed and pushed to GitHub (origin/master)** — Rich's standing instruction
(2026-07-12). Run `npm test` before committing sim changes; drive the real game
(`npm run dev:server` + browser) before committing gameplay/rendering changes.

## Open items

- Console pass: verify on real Xbox Edge (menus are already gamepad-first, ES2017 build).
- Real-device mobile pass (iPhone/Android Safari/Chrome): touch controls shipped, but
  sizes/feel need a hands-on check.
- Client-side prediction if online self-movement feels laggy at >100 ms RTT.
- Late-join/spectate for online rooms; reconnect grace (currently a drop = idle gnome
  in-match, slot freed in lobby).
