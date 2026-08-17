---
id: T-051
title: A window the split fits in — raise the default, floor the minimum
feature: F-03
milestone: 3
priority: 7
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier: claude-opus-5
built_by: "claude-opus-5 @fresh"
verified_by: "claude-opus-5 @fresh"
review: same-model
---

Absorbs: T-048-s5. Human-ruled 2026-08-17, after T-027's planning pass
measured the consequence: **the app's flagship screen does not fit in
the window the app opens.**

`app/src-tauri/tauri.conf.json` opens at **800×600** with no `minWidth`
and no `minHeight`. T-027's split — ruled by @human the same evening —
is 640px of planner chat plus a 1px rule beside T-024's lens. At 800
that leaves the lens **159px**, so T-027's plan drops the lens below
Tailwind's `lg` (1024px) rather than render a useless sliver. The
consequence, stated plainly in that plan and escalated here: **at the
size the app actually launches, a user sees chat only** — not the
composition that was just ruled on. A new user never widens the window
before forming an opinion.

T-048-s5 is the other half of the same missing constraint: below about
**250px of window height** the genesis pane's scroll region collapses
to 44px and the last artifact row cannot be reached at all. T-048
bounded the frame; nothing floors it.

Deliberately NOT taken inside T-027: the window governs every screen,
it fires the BOOT GATE, and a flagship screen's width requirement is a
reason to raise the default — not a licence for a feature task to
change global chrome in passing.

## Acceptance criteria
- THE default window SHALL open large enough for T-027's split to
  render both halves — approximately **1280×840**, the exact figures
  recorded in notes with the arithmetic (640 chat + 1 rule + the lens
  at no less than the 639px T-027's plan calls the design's geometry).
- THE window SHALL declare a `minWidth` and `minHeight` that keep every
  screen usable: at minimum, wide enough that the split still renders
  rather than silently dropping the lens, and tall enough that the
  genesis pane's scroll region still engages (T-048-s5 measured the
  floor at ~250px, so the minimum must sit well above it).
- WHEN the window is resized to the declared minimum THE genesis
  screen, the board, the map and the front door SHALL each remain
  usable — measured at that size, not asserted; the T-048 criterion-4
  table is the form.
- THE change SHALL be confined to `app/src-tauri/tauri.conf.json`'s
  window block: no new grant, no capability change, no Rust, no
  frontend edit. `EXPECTED_GRANTS` byte-unchanged and proven so.
- IF T-027 has NOT yet landed THEN the criteria SHALL still hold for
  the screens that exist — this task does not depend on the split, it
  makes room for it.

Verification: headless — the config diff plus measurements at the new
default and at the declared minimum through T-041's shell harness in
the tools/e2e lane. The BOOT GATE fires (a manifest change) and its
result is recorded. @human: whether the new default feels right on
your display, which is the one thing no measurement settles.

## Implementation notes

Executor `claude-opus-5 @fresh`, 2026-08-17, branch `task/T-051-window`
(worktree `../nputer-T-051`), cut from **`e41dd16`**. Three commits.
Port discipline: the human's live app held **1420 throughout** (`lsof`
showed 1 listener at session start, before the boot gate and after
everything — process 81720, `tauri dev` out of `/Users/ujju/Projects/nputer`).
Nothing here bound, contacted or signalled it. Scratch ports **15130**
(lane) and **15131** (boot gate), both bind-probed free first.

### THE ARITHMETIC — and the card's own is off by one

**The parts, re-measured against T-027 as merged rather than taken from
the plan.** The app is **border-box** (Tailwind preflight), and the
chat's 1px rule is `lg:border-r` on the chat column itself
(`InterviewChat.tsx:193`), so the rule sits INSIDE the 640 and

    lens = W − 640      (not W − 641)

Measured in the served bundle at six widths — 1023 → ABSENT, 1024 →
**384**, 1025 → **385**, 1279 → **639**, 1280 → **640**, 1440 → **800**.
STATE.md's six-viewport table reproduces **exactly**: chat 640 at every
width, `@x80` when alone at 800, `@x192` at 1023, `@x0` from 1024 up,
and the split present at **exactly ≥1024**.

**So criterion 1's floor is 1279, not 1280.** The criterion asks for
"640 chat + 1 rule + the lens at no less than 639". The rule is already
inside the 640, so adding it again double-counts:

    card:      640 + 1 + 639 = 1280
    measured:  640     + 639 = 1279      ← the true floor
    at 1280:   640     + 640             ← what ships

**1280 is still the right number, and now for a reason the arithmetic
supports rather than by accident**: it clears the measured floor by one
pixel, and it is the **unique width at which the two halves are equal** —
640 of chat, 640 of lens. That is checkable, which "a round number" is
not. Pinned at `window-contract.spec.ts:172`, which asserts the halves
ABUT (a gap would mean the rule had moved back out of the 640 and the
whole derivation with it).

**A fourth corroboration the plan got wrong in the same place.** T-027's
plan called 799 at 1440 "the design's own number". The design source
says **800**: `docs/design/claudedesign_handoff/nputer app.dc.html:15`
sets `* { box-sizing: border-box }`, `:509` gives the chat column
`width:640px … border-right:1px solid #ededed`, and `:565` gives the
right half `flex:1` inside a `:500` frame of `width:1440px` — so the
design's right half is 1440 − 640 = **800**, exactly what the app
renders. The verifier corrected the APP's number at T-027; the DESIGN's
attribution was never corrected and the source comment still carries it
(filed as **T-051-s1**).

**THE HEIGHT: THE ARITHMETIC YIELDS 867, NOT 840 — said out loud.**
The card gives no arithmetic for the height, so here is one, from the
same authority the width comes from:

    design's interview canvas   800   (`nputer app.dc.html:508`, min-height:800px)
    + the app's own header       67   (measured, constant at every width)
    ──────────────────────────────
      window inner height       867

The design draws the interview in a 1440-wide window frame whose title
bar is OS chrome — which a Tauri window puts OUTSIDE the inner size
(`WindowConfig.width/height` → `inner_size`, tauri-utils 2.9.3
`config.rs:1957-1960`). Our app spends 67px inside the webview on the
header the design draws in that title bar. Measured directly: at
**1280×867 the split is exactly 800px tall**; at **1280×840 it is 773** —
**27px short of the design's canvas.**

**840 ships anyway, and the reason is the display, not the design.**
867 inner + a macOS title bar (~28px) needs ~895px against the ~875px a
1440×900 panel leaves under the menu bar — it would not fit the very
display the design is drawn at. 840 + ~28 = ~868 does. That title-bar
figure is the one number here I did **not** measure (it is OS chrome and
this pipeline has no screen control), so it is an estimate, and the
choice between 840 and 867 is exactly the "@human: whether the new
default feels right on your display" the card reserves. Filed as
**T-051-s3** so it survives into triage rather than living in a note.

### THE MINIMUM — 1024 × 700, both numbers derived

- **minWidth 1024** is the breakpoint itself, measured rather than read
  off Tailwind's `lg`: `window-contract.spec.ts:211` walks real widths
  downward until `genesis-pane-slot` stops being visible, finds **1024**,
  and asserts the manifest's `minWidth` is at or above it — then asserts
  the lens really is gone at 1023. Below it the flagship screen silently
  drops half of itself, which criterion 2 forbids.
- **minHeight 700** clears the tallest natural content of any screen that
  claims to fit the window at ≥1024 wide. Measured by shrinking the
  viewport until each screen stops fitting:

      genesis      302     front door   475
      map          ≤600    no-plan card 663   ← the binding constraint

  663 is **T-048-s4's overflow** (the no-plan card is 663 tall at 1024,
  1280 and 1440 alike — it does not vary with width; the exact threshold
  is 663: page 663/662 at one pixel less, 663/663 at 663). So a floor of
  700 puts that known, already-filed defect **outside the window's legal
  range** with 37px to spare, without pretending to fix it. It is also
  **2.8× T-048-s5's 250px collapse floor** and 2.3× the genesis screen's
  own 302px frame floor. Pinned at `window-contract.spec.ts:249`, which
  re-measures all four natural heights every run and reds if any screen
  grows past the declared floor.

The board is deliberately excluded from that floor: it is a scrolling
page BY DESIGN (T-048 kept `min-h-screen` on `main` for every screen but
genesis), so its content height says nothing about a minimum.

### THE MEASUREMENT TABLE — T-048's criterion-4 form

Rig: the real dev bundle on scratch port 15130, headless Chromium,
T-041's `__nputerShellHarness` + `__nputerDocsHarness`, T-024's `streak`
fixture on genesis and **this repo's own docs/ tree on the board** (52
cards, the tallest real board available — T-048's own instrument).
`page` = `document.scrollHeight`/viewport · `main` = the shell's `main`
· `card` = the empty-state card's document-relative top + height ·
`reach` = the last artifact row's clipped-visible height after
`scrollIntoView`, against every overflow ancestor.

| screen | 800×600 (the OLD window) | 1024×700 (the new MINIMUM) | 1280×840 (the new DEFAULT) |
|---|---|---|---|
| genesis | page 600/600, main 600, **lens ABSENT**, log 342/342, reach 0/0 | page 700/700, main 700, **lens 384**, lens-region 970/580, log 442/442, **reach 40/40** | page 840/840, main 840, **lens 640**, lens-region 886/720, log 582/582, **reach 40/40** |
| front door | page 600/600, main 600, card 67+533 | page 700/700, main 700, card 67+633 | page 840/840, main 840, card 67+773 |
| no-plan card | page **663/600**, main 663, card 67+596 | page 700/700, main 700, card 67+633 | page 840/840, main 840, card 67+773 |
| board (repo tree) | page 7010/600, main 7010, rail 7010, 52 cards, last **91/91** | page 7010/700, main 7010, rail 7010, 52 cards, last **91/91** | page 7010/840, main 7010, rail 7010, 52 cards, last **91/91** |
| map | page **726/600**, main 726, rail 726, canvas 446/446 | page 700/700, main 700, rail 700, canvas 454/454 | page 840/840, main 840, rail 840, canvas 594/594 |

**Read the first column against the other two.** At the window the app
used to open, the flagship screen showed **no lens at all**, the no-plan
card overflowed by 63px and the map overflowed by 126px. At both new
sizes every screen's page equals its viewport, both halves of the split
render, the last artifact row is fully reachable inside the lens's own
scroll region, and the map canvas clips nothing
(`scrollHeight == clientHeight`, so T-048-s2's failure mode is not
armed). The board still scrolls — that is its design — and its last card
is reachable in full at every size.

**T-048-s4 and T-048-s2 are the two pre-existing rows here and neither
is re-filed**: the 663/600 and 726/600 cells are both in the OLD column
only, and both are out of range once the floor is declared.

### CRITERION → EVIDENCE

1. **Default renders both halves.** `tauri.conf.json:16-17` (1280×840);
   `window-contract.spec.ts:172` — lens visible, chat 640, halves abut,
   lens = W−640 = 640 ≥ 639, page == viewport, reach 40/40. Arithmetic
   above; the card's `+1` corrected.
2. **minWidth / minHeight declared and justified.**
   `tauri.conf.json:18-19`; `window-contract.spec.ts:211` (breakpoint
   measured in the browser vs the manifest) and `:249` (four natural
   heights vs the manifest); `app/test/window-manifest.test.ts:159`
   (the breakpoint read out of the BUILT stylesheet vs the manifest).
3. **Every screen usable at the minimum, measured.**
   `window-contract.spec.ts:308` — one parameterized body run at BOTH
   the declared minimum and the declared default, over genesis, front
   door, no-plan card, board and map. Table above.
4. **Confined to the window block; `EXPECTED_GRANTS` byte-unchanged.**
   `git diff --stat e41dd16..HEAD` is **three files**: the manifest (4+/2−,
   all inside `app.windows[0]`) and two new test files. Proven empty:
   `app/src-tauri/src/**` 0 files · `capabilities/**` 0 · `gen/**` 0 ·
   `Cargo.toml`/`Cargo.lock` 0 · **`app/src/**` 0** · `app/package.json`
   0 · `lib/**` 0 · `method/**` 0 · `docs/architecture/graph.json` 0.
   `EXPECTED_GRANTS` extracted from both trees: **6135 bytes, 92 grant
   lines, sha256 `721174b12a00b382cad6e9edb853ae1723f4dd1351e3bfa4380020a0d2e7f0c7`**
   on BOTH, `cmp` clean; the whole `acl_pin.rs` is sha256
   `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` on
   both. The 6135 matches T-025's recorded figure. `acl_pin`'s runtime
   resolver re-pins the 92-grant set green inside the 299 cargo tests.
   The frontend is unmoved to the byte: the rebuilt bundle is
   **`index-GxM6iwW9.js` (483.43 kB)** and **`index-DSR1ACex.css`
   (43,300 B)** — the same hashes STATE.md records for main.
5. **T-027 HAS landed**, so the criteria were held against the real
   split rather than the screens that would have existed without it.

### WHAT DID NOT REPRODUCE — three numbers, and one is criterion 2's own

1. **T-048-s5's 44px floor does not reproduce post-T-027, at its own
   1280 width.** s5 measured the pane's scroll region collapsing to a
   hard **44px** below ~250px of viewport, with the last artifact row
   unreachable (**1/40** at 1280×250, **0/40** at 1280×200). Re-measured
   on this tree at the same width:

       1280x200 | page 302/200 | pane region 886/80  | last row 40/40
       1280x225 | page 302/225 | pane region 886/105 | last row 40/40
       1280x250 | page 302/250 | pane region 886/130 | last row 40/40
       1280x300 | page 302/300 | pane region 886/180 | last row 40/40
       1280x360 | page 360/360 | pane region 886/240 | last row 40/40

   The region shrinks **linearly** (viewport − 120) with no floor, and
   the row is fully reachable at every height including the two s5
   recorded as failing. T-027 restructured the screen — the pane is now a
   flex child of `genesis-split` inside `genesis-pane-slot` — and the
   floor s5 measured belonged to the pre-split full-width composition.
   What DOES survive is s5's second finding, moved: the page stops
   fitting below **~302px** (302 vs 300/250/225/200), where s5 put it at
   ~225. **Criterion 2's substance holds and the minimum clears
   everything by 2.8×; only the cited evidence has moved.**
2. **The card's width arithmetic double-counts the rule** (above).
   1279, not 1280.
3. **The design's right half is 800, not the 799 T-027's plan called
   "the design's own number"** (above). Same border-box error, one level
   further back than the verifier chased it. Filed as **T-051-s1**
   because the falsified arithmetic is still in the shipped source
   comment at `GenesisScreen.tsx:82-85`.

And one measurement of T-027's that I could not reproduce and did not
chase to ground: its verifier's **lens-region** figures (673/648 at
1024×768, 657/600 at 1280×720, 780/780 at 1440×900). Same fixture, same
selector, fonts confirmed `loaded`, `document.fonts.ready` awaited: I get
**970/648, 886/600, 858/780**. The clientHeights agree to the pixel; the
CONTENT heights do not. **T-027-s5 rests on the 780/780 cell** (its
claim is "zero pixels of margin"), and under my measurement there are 78.
Filed as **T-051-s2** rather than guessed at.

### POISONING — 10 bodies, 11 cases red, plus 7 mutation drills

**Every new test body poisoned** with `expect("PROBE").toBe("EXECUTED")`
as its first statement, run, restored, `shasum -a 256` verified:

- `app/test/window-manifest.test.ts` — **6** `it()` bodies → **6 failed**,
  each on the PROBE line;
- `tools/e2e/tests/window-contract.spec.ts` — **4** `test()` bodies (5
  cases, one body parameterized over both sizes) → **5 failed**, all on
  the PROBE line. Re-run after the board-fixture fix: 4 bodies, 5 red
  again, restored sha256-identical.

The whole drill was **re-run at the end from a `t051-`-namespaced copy of
the poison script, re-read immediately before running it** — the session's
scratchpad is shared by every lane and a sibling had a same-named script
substituted mid-run. Both scripts here were verified byte-for-byte mine
(`t051-mutate.sh` hardcodes this worktree's path twice, so it could never
have driven another lane), and the re-run reproduced **6 + 5 red**, with
both files restored sha256-identical and both suites green again.

**And the thing under test mutated, which is the sharper drill.** The
manifest is what these tests are about, so it is what was broken:

| mutation | what went red |
|---|---|
| `minWidth: 1023` | lane breakpoint test (`the lens starts rendering at 1024px`), lane minimum-table (lens `toBeVisible` fails at 1023), vitest breakpoint test. **3** |
| `minHeight: 600` | lane natural-height test (no-plan card 663 > 600) and lane minimum-table (page 663/600). vitest stays green — correctly, it makes no height claim. **2** |
| `width/height` → `800`/`600` | lane default-window test (lens absent), lane default-table, vitest "cannot open below its own floor" and vitest "the default leaves the lens 639". **4** |
| `minWidth` → `min-width` (the kebab typo that would fail `deny_unknown_fields` at launch) | vitest key-set, whole-sizes, floor and breakpoint tests. **4** |
| `minWidth` deleted | vitest **4**; the lane refuses to collect at all, with its own named message — "window block has no numeric `minWidth` … a window with no floor can be dragged into the sizes T-048-s5 measured as unusable". It does not skip. |
| `minWidth: 1024.5` | vitest "declares four whole, positive logical sizes" only. **1** |
| **frontend**: `lg:flex lg:flex-col` → `xl:` on the slot, rebuilt | vitest breakpoint test, on "the built sheet has no `.lg\:flex{display:flex}` rule — the lens's gate moved". Restored: `GenesisScreen.tsx` sha256 `b2e72ae776a988df7305906f52d371d291cf8c0f5156dbdb19d7f9cca3c2c2ec` before and after, and the rebuilt bundle back to `index-GxM6iwW9.js`. |

The board row was caught being weak DURING this and fixed rather than
disclosed: it drove the lane's own `boardFixture`, which fits inside the
window at both sizes, so "the last card is fully reachable" was passing
without anything scrolling. It now drives the repo's own docs/ tree with
a guard that the fixture really is taller than the window — pointing the
walk at `docs/decisions/` instead reds both cases on that guard.

### SUITES (macOS 15 / Darwin 25.6, node 22.22.0; ADR-011 order)

| suite | result | derived from main |
|---|---|---|
| lib/parser `npm ci` + `npm run build` + `npx tsc --noEmit` + `npx vitest run` | **197/197 (10 files)**, tsc clean, build clean | 197 unmoved — a 0-byte parser diff |
| app `npx tsc --noEmit` | **clean, exit 0** | |
| app `npm run build` | **exit 0**, `index-GxM6iwW9.js` 483.43 kB, `index-DSR1ACex.css` 43.30 kB | byte-identical to main's — the frontend diff is zero |
| app `npx vitest run` | **724/724 (39 files)** | main's 718/38 + my 6 tests / 1 file = **724/39**, landed exactly |
| app/src-tauri bare `cargo test` | **299 passed + 3 ignored, 0 failed**, exit 0, **zero compiler warnings**, summed across **15 test binaries** (108/0/0/32+1/123/0/7/13/3/7/0+1/2+1/4/0/0) — **not read off a `tail`** | main's 299 + my zero Rust = 299 |
| tools/e2e `npm run typecheck` | **clean, exit 0** | caught a real `noUncheckedIndexedAccess` error in my spec; fixed |
| tools/e2e `NPUTER_E2E_PORT=15130 npm test` | **65 passed**, exit 0, headless, one worker, retries 0, **no skips, no retries, no flakes** | main's 60 + my 5 = **65** |
| `npm run lint:tokens` | `clean (109 files scanned under app/src, app/test, tools/e2e)`, exit 0, **zero allowlist** | 107 + my 2 new files = **109** |
| `npm run lint:tokens -- --selftest` | **49 samples green, 14 walk-policy checks green** | |

### THE BOOT GATE — fired, ran, green

The manifest moved, so it fired, and this task is the first to touch the
window block: a malformed one is a launch failure, not a no-op. Scratch
port **15131** (bind-probed free; 1420 held by the human's app and
avoided). Verbatim:

    [boot-check] port 15131 free — spawning `npm run tauri dev -- --config {"build":{"devUrl":"http://localhost:15131","beforeDevCommand":"npm run dev -- --port 15131 --strictPort"}}` in /Users/ujju/Projects/nputer-T-051/app
    [boot-check] NPUTER_BOOT_PORT=15131 — threading --config {"build":{"devUrl":"http://localhost:15131","beforeDevCommand":"npm run dev -- --port 15131 --strictPort"}}
    [boot-check] overall timeout 1200000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-T-051
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0 taken from `$?` unpiped, both `[nputer]` lines present** — the
window with the new size really is created by the real runtime, which is
the one thing no unit test can answer. Afterwards: `lsof` on 15131 empty,
on 15130 empty, on 1420 **still exactly the human's one listener**;
`pgrep` finds no `tauri-boot-check` and no process out of this worktree.

Schema check done BEFORE the edit rather than discovered by the gate:
`min_width`/`min_height` exist on `WindowConfig` with
`#[serde(rename_all = "camelCase", deny_unknown_fields)]`
(tauri-utils **2.9.3**, the locked version, `config.rs:1900-1966`) and
map to `min_inner_size` → `with_min_inner_size(LogicalSize)`
(tauri-runtime-wry 2.11.4 `lib.rs:908-970`), so all four numbers are the
**inner** (webview) size in logical px — the same coordinate space every
measurement above is in.

### FILED

- **T-051-s1** — the shipped source comment still carries the falsified
  W−641 arithmetic, and attributes 799 to a design that says 800.
- **T-051-s2** — T-027's lens-region figures do not reproduce, and
  T-027-s5's premise rests on one of them.
- **T-051-s3** — the default is 27px short of the design's own 800px
  interview canvas; 1280×867 reproduces it exactly. @human's display
  decides.
- **T-051-s4** — T-048-s5 is absorbed here but only its remedy 1 is
  taken; remedies 2 and 3 (a scroll region under `genesis-pane-slot`,
  and a lane assertion on reachability at a small viewport) are not,
  and its measured floor no longer reproduces.

### @HUMAN — the one thing no measurement settles

**Does 1280×840 feel right on your display?** Everything above is inner
(webview) pixels; what a window costs on screen adds the OS title bar,
which this pipeline cannot see. The two candidates are **840** (ships;
fits a 1440×900 panel under the menu bar) and **867** (reproduces the
design's interview canvas exactly, and probably does not fit that panel).
And the floor: **1024×700** cannot be dragged smaller — check that it is
not annoying on your machine, because it is the number that decides
whether the app can be tucked into a corner of the screen.

## Verdicts

2026-08-17 — claude-opus-5 @fresh (verifier, same-model as builder): **APPROVED**

Everything measured first-hand on `task/T-051-window` at f60b3e8, base
`e41dd16`. Scratch ports **15188** (lane) and **15189** (boot gate), both
bind-probed free. **1420 was never bound, contacted or signalled** — a
read-only `lsof` before, between and after shows exactly the human's one
listener (node pid 81894, `[::1]:1420`). No screen control; no model
calls. Worktree left clean, `git status --porcelain` empty at every
checkpoint.

### Criterion by criterion, and how

| # | criterion | verdict | how I checked it |
|---|---|---|---|
| 1 | default renders both halves | **holds** | Own probe, dev bundle, headless Chromium: at 1280×840 chat **640**, lens **640**, halves **abut** (slot.x − chat.right = 0), page **840/840**, reach **40/40**. Breakpoint walk reproduces: lens ABSENT 1022/1023, **384** at 1024, **385** at 1025, **640** at 1280, **800** at 1440 — so `lens = W − 640` and the floor is **1279**, exactly as the notes correct the card. 1280 is the unique equal-halves width. |
| 2 | minWidth / minHeight declared and justified | **holds, guard weaker than claimed** | 1024 is the measured breakpoint, not a read-off constant (`lg` walk above). Natural heights re-derived: genesis **302**, front door **475**, no-plan card **663** (threshold exact: 663/662 at 662, 663/663 at 663), map **692** on the repo tree. 700 clears all four. But `:249` measures the map through the LANE fixture (**320**, one node) — the test's own failure message prints `{"genesis":302,"front door":475,"no-plan card":663,"map":320}`. Real headroom is **8px**, not the card's "37px to spare"; `map ≤600` is not a measurement of the map the table renders. **T-051-s5.** |
| 3 | every screen usable at the minimum, measured | **holds — table reproduced cell for cell** | All five screens at 800×600, 1024×700, 1280×840. Every published cell reproduces exactly, including `lens-region 970/580` and `886/720`, `log 342/442/582`, `card 67+533/633/773`, and the map's `canvas 446/446 · 454/454 · 594/594`. Both overflow cells are OLD-column only and both pre-filed — the no-plan card 663/600 is **T-048-s4**, and the map 726/600 is recorded in **T-048's own criterion-4 table** and in **T-048-s2**. Neither re-filed: correct. One divergence, benign: the board row is **7494/7010** because `repoBoard` walks this repo's `docs/`, which grew by the four suggestion cards the executor filed after measuring. |
| 4 | confined to the window block, grants byte-unchanged | **holds** | `git diff --stat e41dd16..HEAD` run, not read: manifest **4+/2−**, all four keys inside `app.windows[0]`, **no other key introduced**. Path counts all **0**: `app/src-tauri/src`, `capabilities`, `gen`, `Cargo.toml`, `Cargo.lock`, `app/src`, `app/package.json`, `lib`, `method`, `docs/architecture/graph.json`, and **every one of the four lockfiles**. `EXPECTED_GRANTS` extracted from base and HEAD: **6135 bytes, 92 grant lines, sha256 `721174b12a00b382cad6e9edb853ae1723f4dd1351e3bfa4380020a0d2e7f0c7`** on both, `cmp` exit 0; whole `acl_pin.rs` sha256 `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` and git blob `53aa795b` identical across **base, main and HEAD**. Rebuilt bundle byte-identical: `index-GxM6iwW9.js` (483426 B) and `index-DSR1ACex.css` (**43304 B**). |
| 5 | criteria held against T-027 as landed | **holds** | T-027 merged at `dc3ef5b`; the split is real in every measurement above. |

### Suites, re-run first-hand, exit codes unpiped

lib/parser **197/197 (10 files)** + `tsc` clean · app `tsc` **exit 0** ·
app `npm run build` **exit 0**, hashes above · app `npx vitest run`
**724/724 (39 files)** · `cargo test` **299 passed + 3 ignored, 0
failed**, exit 0, **zero warnings**, **15 test binaries** counted from
`test result:` lines · tools/e2e `typecheck` **exit 0** · tools/e2e
`NPUTER_E2E_PORT=15188 npm test` **65 passed, exit 0**, no skips, no
retries, no flakes · `lint:tokens` **clean (109 files), exit 0** ·
`--selftest` **49 samples + 14 walk-policy checks green**.

**BOOT GATE re-fired on a DIFFERENT scratch port (15189): `BOOT_EXIT=0`,
both `[nputer]` lines present**, tree stopped on SIGTERM, 15189 and 15188
empty afterwards, 1420 still exactly one listener, no stray process out
of this worktree. The schema claim is verified at the source AND
empirically: `min_width`/`min_height` are logical px on `WindowConfig`
(tauri-utils 2.9.3 `config.rs:1961-1965`) and reach
`with_min_inner_size(TaoLogicalSize)` (tauri-runtime-wry 2.11.4
`lib.rs:1015-1018`) — **inner, not outer**, so every measurement is in
the right coordinate space.

### Anti-vacuity: re-derived, not read

**Poison drill.** 6 vitest `it()` bodies → **6 failed**, each on its
PROBE line (48, 58, 69, 122, …); 4 lane `test()` bodies → **5 cases
failed**, all on the PROBE line (173, 215, 254, 312×2). Both files
restored **sha256-identical** (`7148c949…`, `365cff8a…`).

**Mutation drills against the thing under test — all seven reproduce.**
`minWidth:1023` → **3** (vitest breakpoint + lane breakpoint + lane
minimum-table) · `minHeight:600` → **2**, vitest correctly green ·
`800×600` → **4** · kebab `min-width` → vitest **4** *and* the lane
refuses to collect · `minWidth` deleted → vitest **4**, lane refuses to
collect with its named message, does not skip · `minWidth:1024.5` →
vitest **1** (the lane also reds 3 on Playwright's float rejection, which
the card's table omits) · frontend `lg:`→`xl:` + rebuild → the vitest
breakpoint test reds on *"the built sheet has no `.lg\:flex{display:flex}`
rule — the lens's gate moved"*, and `GenesisScreen.tsx` restored to
sha256 `b2e72ae7…` with the bundle back to `index-GxM6iwW9.js`.
Manifest restored to sha256 `52eb5e69…` after every case, checked each
time.

### Security sweep — clean

No dependency moved (all four lockfiles 0 files changed). No `innerHTML`,
no `dangerouslySetInnerHTML`, no `eval`, no `new Function`. No
`child_process`, no shell string (the only `exec(` is `RegExp.exec`). No
bypass-permissions flag. No key, token or secret. Grant set byte-identical
above. The manifest edit introduces no key other than `minWidth` and
`minHeight`. tools/e2e still imports neither app nor parser.

### The 229px discrepancy — RESOLVED, and it changes what T-065 should say

The lens region's content height is a function of the fixture's **artifact
row count** and the lens's width; the project dir is irrelevant. Measured
in the frame test's exact scenario, both dirs, both fixtures:

    streakFixture      (9 files, 9 rows): 970/648 · 886/600 · 858/780  margin 78 → PASS
    streakMidInterview (6 files, 7 rows): 876/648 · 792/600 · 780/780  margin  0 → FAIL

`/e2e/streak` (11 chars) and `/e2e/genesis` (12) measure **identically at
every cell**, so T-027-s5's stated lever is falsified — but its
CONCLUSION is vindicated: dropping `docs/tasks/` lands exactly on the
**780/780** T-028 reports going red. T-051's 858/780 reproduces exactly
and is right for the tree the committed spec drives. Filed as
**T-051-s8**, which also corrects T-051-s2's framing.

### The 1024 boundary — attacked, and it holds

Root-font override is **dead**: media-query `rem` uses the initial value,
measured (`html{font-size:32px}` makes an element's `64rem` 2048px while
`(min-width: 64rem)` still matches at 1024). Fractional viewports
quantize up. DPR is irrelevant — the numbers are logical inner px,
verified at the source. The one residual I could not test headlessly (a
layout-consuming scrollbar; `innerWidth − clientWidth` stayed 0 under
every technique I tried) is **not armed**: no `lg:`-gated screen produces
a document scrollbar at the floor. Filed as **T-051-s9** with the
invariant named.

### Blemishes recorded, none blocking

- `git diff --stat e41dd16..HEAD` is **8 files** today (3 code + 5 docs),
  not the "three files" criterion 4 quotes — true when written, before
  the notes commit; it does not reproduce as printed.
- `index-DSR1ACex.css` is **43,304 B**, not the "43,300 B" criterion 4
  states; STATE.md itself records 43,304.
- The board's reach check compares `card.split("/")[0]` to `[1]`, so a
  hypothetical `0/0` would pass. Guarded in practice by the height and
  rail assertions; not filed.
- The vitest breakpoint probe finds the FIRST `.lg\:flex{display:flex}`
  in the concatenated sheet, so a gate moved DOWN while another component
  still emits `lg:flex` would read the wrong media query. The lane
  measures the real breakpoint in a browser, which covers it.

### Filed

**T-051-s5** the minHeight guard measures a one-node map; real headroom
is 8px · **T-051-s6** T-028 will red this spec — the full streak tree
renders the board half · **T-051-s7** `min-width`/`min-height` are
accepted serde aliases, so the kebab launch-failure claim is false in the
notes and in the shipped comment · **T-051-s8** the lens-region lever is
row count, not path length · **T-051-s9** the floor sits exactly on the
breakpoint, on an invariant nothing asserts.

Nothing found touches the shipped change. The manifest is four correct
numbers, each derived and each measured; the fence holds to the byte; the
guards fail when the thing they guard moves. **APPROVED.**
