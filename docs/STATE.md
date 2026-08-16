# State

Updated: 2026-08-16 by integrator (T-048 merge), claude-opus-5 @fresh

## Just completed
T-048 (the frame holds — the genesis page stops growing and the pane
starts scrolling, S, app-shell, F-03) done and merged — built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. It absorbs T-041-s1 and
T-041-s3. The human reported this one themselves, mid-review, because
the screen was unusable at the size the app actually opens.

**WHAT SHIPPED: TWO CLASS CHANGES, NOT THE THREE THE TASK FILE ITSELF
PRESCRIBED.**

    app/src/App.tsx
      const boundedFrame = screen.screen === "genesis";
      <div className={cn("flex min-w-0 flex-1 flex-col",
                         boundedFrame ? "h-screen" : "min-h-screen")}>

    app/src/components/shell/GenesisScreen.tsx
      className="flex min-h-0 flex-1 flex-col gap-6 px-10 py-9"

The mechanism, because it is the part worth keeping: the genesis pane
owns an `overflow-y-auto` region, and **a scroll region can only engage
inside a bounded box**. `min-h-screen` sets a floor, never a ceiling, so
the shell column grew with its content and the PAGE took the scroll.
Bounding the column at `h-screen` is half of it; the other half is
`min-h-0` on the genesis section, because a flex item's automatic
minimum size is its CONTENT size — without it the section refuses to
shrink below its 1105px inside a 600px column and `overflow: visible`
spills the whole thing onto the page anyway. **Neither half is
sufficient and both were reverted separately to prove it.**

**THE TASK FILE'S OWN PRESCRIBED THREE-EDIT FIX WAS WRONG, AND BOTH THE
BUILDER AND THE VERIFIER PROVED IT BY BUILDING IT.** Criterion 3 named
"the three class edits the verifier proved sufficient (two
`min-h-screen` → `h-screen`, `min-h-0` on the genesis screen's column)
**or a demonstrably better equivalent**". The third edit — `h-screen` on
`main` — bounds the whole shell, and `main` is the row the board's pane
rail lives in. Measured on the served bundle, twice, independently:

- **board**: the rail is a stretch-height sibling of the column, so it
  drops **2202 → 720** at 1280x720 and **2202 → 600** at 800x600 —
  while the page still runs to **2202**. The sidebar strip and its
  right border stop at the fold on a document that keeps going.
- **map at 800x600**: the canvas is `min-h-0 flex-1 overflow-hidden`
  (MapView.tsx), so it shrinks and **CLIPS** — `overflow-y: hidden`,
  no scrollbar anywhere, graph unreachable. It would have failed
  criterion 4.
- **and it buys nothing**: the three-edit version's genesis numbers are
  **identical to what shipped** at all three viewports. The second
  `min-h-screen → h-screen` costs two screens and gains zero pixels.

So criterion 3 and criterion 4 were in conflict, the builder resolved it
with measurements and said so, and the verifier reproduced the whole
falsification before ruling. **Where the wrong answer entered the record
matters and is written down here so it is not repeated: the three-edit
prescription came from T-041's VERIFIER (s1's note 1, "the whole
mechanical fix"), and the ARCHITECT inherited it into T-048's criterion
3 as a prescription rather than as a hypothesis.** A verifier's remedy
is evidence about a bug, not a design that has been built; copying one
into an acceptance criterion converts an untested suggestion into a
requirement. Criterion 3's escape hatch ("a demonstrably better
equivalent") is the only reason this task could ship the right fix, and
it earned its keep on its first outing.

**THE MEASUREMENTS — the verifier's own, from its own rig (scratch port
14526, never 1420), not the builder's table re-read.** Every recorded
figure reproduced to the pixel.

| viewport | page scrollHeight, before → after | pane region before → after |
|---|---|---|
| 800x600 (the app's OWN window) | **1172 → 600** | 858/858 (never scrolls) → 858/**286** (scrolls) |
| 1024x768 | **1141 → 768** | 827/827 → 827/**454** |
| 1280x720 | **1110 → 720** | 796/796 → 796/**406** |

Empty genesis (nothing written yet) moves too: 800x600 page **971 →
600**. Extended past the three the criterion names — **1920x1080,
1440x900 and 640x480 all hold, and the last artifact is reachable at
every one.** Other screens re-measured field by field at both viewports
— front door, no-plan card, board, map — **every field identical before
→ after**, plus two probes that agree (`minTop` stayed 0 everywhere; the
`overflow:hidden`-with-taller-content list stayed the same eleven
pre-existing map-node buttons, and the canvas joins it ONLY under the
rejected variant). Zero regressions.

**THE TRUSTED-WHEEL PROOF, which is the one that shows a human could
actually use it.** Before the wheel the last artifact row sits at top
954 / bottom 994 against a 720 viewport — **intersection ratio 0**,
`toBeInViewport()` would fail. After a real `page.mouse.wheel` over the
pane: `scrollTop` **390**, which is the region's FULL range (796 − 406),
the row at 564–604, **ratio 1.0**, `window.scrollY` still **0**. The
page's own listener reports `isTrusted: true`, so it is real browser
input and not a synthetic dispatch.

**THE TRIPWIRE DISCIPLINE, and this is the half worth institutionalizing.**
T-041's lane spec had **PINNED THE BROKEN NUMBERS ON PURPOSE** —
`pageScroll` `toBeGreaterThan(viewport)`, region `scrollHeight`
`toBe(clientHeight)` — as a deliberate tripwire against the day someone
fixed it silently. T-048 **rewrote it rather than letting it keep
passing**: the assertions flipped to pin the fix, `columnMinHeight` (read
off `main`, now meaningless) became `columnHeight` read off the column
that actually carries the bound, and the comment no longer names an open
question — it says T-041 pinned the wrong answer deliberately, that
T-048 fixed it, and that bounding the column ALONE leaves 1110/720 and
796/796, so the next reader learns the MECHANISM instead of inheriting
the remedy that was falsified. **Three revert drills, each run
separately, each red with a legible message:**

| revert | result |
|---|---|
| both halves (back to merge-base) | lane 2 failed — "the genesis column is bounded to the window (T-048)" Expected 720 Received **1110**; at 800x600 Expected 600 Received **1172**. App suite 2 failed |
| **`h-screen` kept, `min-h-0` reverted** (the falsified fix) | lane 2 failed — **"the frame HOLDS: the page never grows past the viewport (T-048)"** and "the page does not grow past the window at 800x600" — **while the COLUMN assertions still PASS.** That is the falsification in one line, and the lane re-derives the falsified fix's own numbers unaided |
| `min-h-0` kept, `h-screen` reverted | lane 2 failed — both column assertions |

It fails on the CLASS, not on a class name: it reads the page's own
`scrollHeight`, so anything that makes the screen grow again reds it.
A new `app/test/shell-frame.test.tsx` (4 tests) pins what the lane
cannot cheaply see — the SCOPING (genesis bounded, board/map/front door
not, `main` always `min-h-screen` so the rail keeps stretching) and the
`min-h-0` CHAIN walked link by link from the pane's scroll region up to
the bounded column.

**A CORRECTION THAT MUST BE CARRIED, because the architect relayed the
wrong version of it to the human.** **T-048-s3** claims the front door's
"No plan in &lt;folder&gt;" card puts **"Start an interview here" BELOW
THE FOLD** at 800x600. **Its measurement is right and its conclusion is
WRONG.** The 663-vs-600 overflow reproduces exactly — but the verifier
measured the button at **top 524 / bottom 556**, the footnote ending at
**590**, both clear of a 600px fold, and **no element's text starts at
or below y=600**. What overflows is the section's `py-12` plus about
15px of the card's painted bottom edge: **a cosmetic fit blemish, not a
hidden call to action.** s3's own `115+500` card figure already implied
this; the prose overshot. Filed as **T-048-s4** — the verifier declined
to edit s3 because it sits outside its fence, which is correct — and it
should be scheduled **WITH the front-door visual pass, not ahead of
it**. **Read s4 before s3.**

**THE OTHER FINDINGS.**
- **T-048-s2 — the map canvas clips rather than scrolls, and it is the
  sharpest of the three.** The canvas is `overflow-hidden` with no
  scroll region beneath it. It is harmless **today only because nothing
  bounds it** — and the instant anything does (a bounded shell, a
  future split view, a smaller window rule) it silently loses graph
  **with every suite green**. That last clause is the whole reason it
  matters: there is no test that would tell you.
- **T-048-s1 — the shell now has TWO scroll models.** Bounded genesis
  beside a board that runs to 2202 with its header scrolling away at
  800x600, while the interview's no longer does. Correctly described,
  and genuinely T-027's composition call rather than something smaller:
  unifying it needs a **sticky rail AND a board scroll region AND s2's
  canvas fix** before the conditional could collapse.
- **T-048-s5 — the bound has a FLOOR, and no minimum window declares
  it.** Below roughly 250px of window height the pane's region stops at
  44px and the last row cannot be brought into view; below ~225px the
  page grows again. Far outside any plausible window, but it is a real
  trade a bounded frame makes, and `tauri.conf.json` sets **no
  `minHeight`**. Low urgency, one-line remedy.

**THE CONDITIONAL WAS PROVED, NOT ARGUED.** `boundedFrame =
screen.screen === "genesis"` and the `<GenesisScreen>` render guard are
the **same expression off the same `screen` object in the same render**,
so they cannot desync — and nine reachable shell states were driven
through the harness to confirm it (browser, noProject, noDocs, genesis
empty, genesis + streak, genesis + rejected pick, genesis + error pick,
back to genesis, docs landing under a different dir while genesis). In
every one `genesisRendered === bounded`. The forward-looking gap is real
and recorded: the DEFAULT is `min-h-screen`, so a NEW screen with an
in-flow scroll region would reproduce T-048 silently and neither suite
would catch it — but criterion 4 *requires* the scoping, and T-048-s1
already holds exactly that decision.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm test` **159/159 (10 files)**, `npx tsc
  --noEmit` clean, `npm run build` clean.
- app `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**252 modules**), `npm test` **495/495 (29 files)** — +4 over T-047's
  491, exactly the four new `shell-frame.test.tsx` tests. **The bundle
  moved for the first time since T-041, and moved in the right half**:
  `index-DV-d_LjB.js` **442.12 kB** (was 442.07) and
  `index-RXeeD2qB.css` **41.30 kB** (was `index-BheOMAjN.css` 41.24) —
  a layout fix should show up mostly as CSS, and it does. The JS delta
  is the `cn()` import and the conditional.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero warnings**, summed across **11 test binaries**
  (105 / 0 / 0 / 32+1 / 68 / 3 / 7 / 0+1 / 2+1 / 0 / 0) — **NOT piped
  through `tail`** (the standing trap). Unmoved from T-047, as a
  frontend-only branch must be. **Note for readers of the branch's own
  notes: it measured 208+3, which was CORRECT for its base** — its
  merge-base predates T-047's +9. 217 is the merged-main number.
- tools/e2e `npm ci` + `npx playwright test` **34/34 in 7.2s**,
  headless, one worker, retries 0, no skips — **+1 over T-047's 33**,
  the new three-viewport sweep. `npm run typecheck` clean ·
  `npm run lint:tokens` **clean, 37 files** · `--selftest` **43 samples
  green**.

**THE BOOT GATE FIRED — the THIRD merge it governs, and the second on
its `app/src/**` limb.** Run on scratch port **14521**, never 1420:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {…}` in /Users/ujju/Projects/nputer/app
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` startup lines, ONE run.** The exit code was
captured **from `$?` on an unpiped command** redirecting to a file — not
from `$PIPESTATUS`, which zsh does not define and which cost the T-041
integrator its first run. After it: `lsof -nP -iTCP:14521` **empty**
(the scratch port released), 14520 empty, `pgrep -fl tauri-boot-check`
empty, `pgrep -fl fake_agent` empty. The full `ps` sweep compared by
**pid SET, not by eye**: the only pids that appeared were Spotlight
`mdworker_shared` workers and this session's own shell, and the only
ones that vanished were the baseline command's own pipeline. **Zero
boot-check pids survived.**

**1420 was never bound, contacted or signalled.** The human's vite still
holds `[::1]:1420` on **the same pid 90127, the same fd 28u, the same
device 0xc074e387883bd776** as at T-041's and T-047's merges.

**THE SHARED-WORKING-TREE SIDE EFFECT, and this merge shows its OTHER
face.** T-047's checkpoint recorded that a merge writing `.rs` files
makes the human's live `tauri dev` REBUILD and RESTART the app they are
reviewing (pid 1753 → 8392). **This merge wrote no `.rs` at all**, and
the app process is **still pid 8392, started 18:46:05, parented to the
same unchanged `tauri dev` (89953, up since 13:21:58)** — confirmed
present in the pre-boot baseline. What it wrote instead was two files
under `app/src/`, which the human's vite watches: so the change reached
their window by **HMR rather than a process restart**. The practical
consequence is the same in kind and gentler in degree — **the screen
the human is mid-review on changed under them without a signal from
this session** — except that this time the change is the fix they were
waiting for. Recorded as a second data point on the open question
below, not settled here.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **EIGHTEENTH** exercise, and it FIRED and MOVED the graph.
- **Trigger present**: the diff carries `*.tsx` outside docs/. The plain
  ignored self-check was **RED before the regen** (exit 101), which is
  the rule earning its place rather than being assumed.
- **Delta, enumerated from the raw graph rather than read off a
  summary**: files **89 → 90** (adds `app/test/shell-frame.test.tsx`;
  **nothing removed**), content-changed **hash/loc only** on
  `app/src/App.tsx` and `app/src/components/shell/GenesisScreen.tsx` —
  **no symbol added or removed in either, which is exactly what a
  layout fix should look like on the map**. Stats symbols **602 → 616**,
  edges **1003 → 1013**.
- **FOUR assertions moved, not the three that were forecast — AND THE
  MISS IS THE SAME STRUCTURAL ONE T-041 RECORDED IN THIS VERY FILE.**
  The branch forecast three (the dogfood file count `toBe(89)`→90, the
  relation row `["C-05","C-10","confirmed",20]`→**21**, and
  `map-dogfood-render.test.tsx` `89 files`→`90`) and all three are
  right. The fourth is **`["C-05", 39]` → `40`** in the counts table,
  which sits in the **same `it()` body** as the file count, so vitest
  stops at the first failing expect and never reaches it. T-041 hit this
  exact trap, wrote the lesson into `architecture-dogfood.test.ts`, and
  T-048's verifier repeated it anyway. **It is now twice-proven and
  stated as a rule in the fixture file itself: a regen that adds a file
  under a component's glob ALWAYS moves that component's counts-table
  row, and a forecast read off a failure list can never see it — derive
  it from the added-file list, not from the red.**
- **`lib/parser/test/smoke.test.ts` did NOT move**, verified rather than
  assumed: `git diff -- lib/parser/` is **zero files** and the suite
  re-ran **159/159 with `smoke.test.ts` green**. T-048 declares no
  component and changes no registry file, so the T-024 three-fixtures
  rule does not fire in its registry form — the right way round.
- **Order per ceaa949, ELEVENTH hold, and it demonstrated itself.**
  Fixture edits went in BEFORE the final regen; a regen taken before
  them produced **different bytes**, which is the lesson reproducing
  live rather than being recited. Then regenerated **twice** for
  byte-identity: sha256
  `3ae0e268436118bc230cb8b32b503145aa65cc393ef90b1cd410fb545c1900e4`,
  **373,714 bytes**, identical both runs (`cmp` clean). Then the
  **plain (non-golden) ignored self-check** with `NPUTER_UPDATE_GOLDEN`
  confirmed UNSET: `self_graph_is_current ... ok`. Then the app suite
  re-run after the fixture edits: **495/495**.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen control,
no screenshots, no OS input injection, nothing read off the screen. The
boot run opened and closed its own window, which is the @human ruling of
2026-08-16 that T-046 rests on and this merge does not extend.

**THE MERGE WAS CLEAN AND THE INTERSECTION WAS PROVED EMPTY, not
assumed.** Merge commit **`0f55cc6`**, merge-base **`e78bfdc`**, ten
files. The branch has an unusual history — it was cut from an ORPHANED
commit (an architect index error), then **merged main FORWARD** at
`a3a5ccb` (`--no-ff`, never rebased), which is why its merge-base is
`e78bfdc` and not something newer; that was re-derived here, not taken
on faith. Both changed-file sets were enumerated and `comm -12` is
**EMPTY (0 files)**: T-048 carries two source files, one new app test,
one lane spec, its card and five suggestions; main since the base
carries T-047's four `.rs` files, three docs and eight task files, plus
the T-049 dispatch. `git merge-tree --write-tree` was run first and
produced a single tree hash with **zero conflict markers**. Neither
../nputer-t048 nor ../nputer-t049 was entered.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: NOT edited, and checked rather than assumed.** A
  layout fix adds no capability and moves no interface: no new IPC, no
  new grant, no new component, no new territory, no boundary crossing
  that the document does not already describe. The one line that could
  plausibly have gone stale is C-05's "**the full-bleed `genesis`
  screen**" — checked at the source, not by memory: the rail still
  gates on `screen.screen === "board"` alone (App.tsx:323), so genesis
  is still full-bleed and the word still means what it meant. Nothing
  in the file mentions scrolling, viewport height or the frame, so
  nothing in it was made false. **The honest tension**: the shell now
  genuinely has two scroll models, which is a real fact about C-05 —
  but it is a composition detail that crosses no boundary, T-048-s1
  holds the decision, and T-027 will settle it. Writing it into
  ARCHITECTURE now would record a state nobody has chosen to keep.
- **ROADMAP: NOT edited.** The T-041/T-047 test applied: milestone 3's
  Progress line enumerates **what a user can do**, and T-048 adds no
  user capability — the same screens, the same commands, the same wire
  shapes. Everything that line describes materializing in the pane
  still materializes; what changed is that the PANE takes the scroll
  instead of the page. T-048 is also **not named in milestone 3's task
  list** (T-023…T-029) and was never held out there, so the T-039
  disanalogy holds exactly as T-041 recorded it. The honest remainder
  (T-027, T-028, T-029, plus one observed real turn) is untouched.
  Milestone 3 still NOT claimed.
- **CONVENTIONS: NOT edited.** The BOOT GATE bullet was exercised a
  third time, second on the `app/src/**` limb, and needed nothing. One
  bullet was worth re-reading against this diff and is fine: "UI work
  adds tokens to app/src/styles/tokens.css, never Tailwind defaults or
  arbitrary values" governs token-bearing utilities, and `h-screen` /
  `min-h-0` are layout utilities carrying no token — the mechanical
  arbiter of that rule, `lint:tokens`, ran **clean over 37 files**.
  Zero new tokens, zero arbitrary values, zero new dependencies.
- **NO NEW ADR (three-prong), and it is the easy call this time.**
  (a) An ADR charters a DECISION between live alternatives, and there is
  none here: **a frame that does not hold is a bug at any width**, and
  nobody proposed keeping it. The adjacent question that IS chartering
  material — should the whole shell be bounded with every screen owning
  its own scroll region, or should genesis stay the exception — is
  **exactly what T-048-s1 holds and what T-027 will decide**, and it is
  waiting on a human verdict that has not been given. Chartering it now
  would freeze a two-model reality nobody chose. (b) **Prong two,
  verified as an EMPTY SET rather than by eye**: `git diff --name-only
  aab62f0..HEAD` restricted to `method/`, `capabilities/`,
  `lib/parser/`, `app/src-tauri/`, `tauri.conf.json`, `acl_pin.rs`,
  `lib.rs`, `index_cmd.rs`, `docs_watch.rs` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json` returns
  **nothing**. So ADR-012 held (no native surface moved, zero grants
  touched, `acl_pin.rs` zero-diff, the 92-grant set unmoved and still
  green under `cargo test`), ADR-011 held (zero new crates, zero new
  npm deps, no lockfile line), ADR-003 held (no model call anywhere),
  ADR-017 held (no write path changed — the app is still a lens), and
  ADR-014/015 held (the graph was regenerated because the rule fired,
  proved deterministic across two runs, and proved current by the
  indexer's own plain self-check). **No new IPC variant**: the six wire
  enums are unchanged and this branch touches no Rust at all. (c) Prong
  three: the durable calls live in the task file's criteria→evidence
  map, its measurement tables, and the verifier's independent ones.

## In progress / broken right now
**ONE TASK IS `building`.**
- **T-049** (a way in from anywhere — the ⌘O/⌘N accelerators and a
  header route to genesis, app-shell), worktree ../nputer-t049,
  dispatched at `aab62f0`. Found by @human trying the shortcuts.
- **FLAG FOR T-049'S INTEGRATOR — CHECK THIS, DO NOT ASSUME IT.**
  **T-049 also edits `App.tsx`, and so did this merge.** T-048's three
  hunks are the `cn` import (line 8), the `boundedFrame` block with its
  comment (lines 274–311), and **the shell column's className line
  (line 324)**. T-049 was fenced off layout classes and owns the
  `EmptyState` keydown listener (**lines 145–154** post-merge) and the
  header's button region (**the `data-panel-exempt` div at 339, with
  the `open-folder` Button at 353–362**). Those are disjoint — the
  nearest pair is T-048's :324 against T-049's :353, **29 lines
  clear**, well outside git's three-line merge context — but note the
  one thing that looks closer than it is: T-048's changed line :324 is
  **immediately adjacent to `<header>` at :325**, so a T-049 hunk that
  reached upward into the header's opening tag rather than into its
  button div WOULD collide. Enumerate both hunk sets and run
  `git merge-tree` before merging, exactly as this merge did. T-049's
  worktree sits at pre-merge `aab62f0`, where every line above is 35
  lower. **No behavioural interaction is expected**: `boundedFrame` is
  recomputed per render off `screen.screen`, so a new header route INTO
  genesis simply arrives bounded, which is the intended behaviour.

**Do not enter ../nputer-t049.**

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t048 worktree is removed and its branch KEPT — **29 task branches
merged now**, `t001-app-shell` through `t048-frame-holds` (counted with
`git branch --merged main`; t048 shows with a `+` because its worktree
was still registered at count time), plus the one live branch. Main tree
clean; all four suites green; the token lint green; the committed graph
current and proved so by the plain self-check rather than by assumption.
The parser re-parses the whole live tree at **0 issues**: **76 tasks**,
tally **30 done / 18 planned / 9 parked / 18 suggested / 1 building**
(T-049), 6 features, 11 components. (Tasks rise by six — T-048's five
suggestion files plus the T-049 card — not a board that grew work.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. The sharpest open set is still app-agent's, untouched by
this merge: **T-047-s5** (two doors, one standard, only one guarded —
~5 lines), **T-047-s6** (nothing structurally stops a test resolving
the real CLI — the one that has already fired), **T-047-s4** (`$SHELL`
picks the program, and a comment in the code is now false), and
**T-047-s1** (the cache that saves zero spawns). Beside them the
process-hygiene pair stands: **T-046-s1** (the unsignalled process
group, on the human's own port) and **T-041-s4** (the one env-var path
that would package a DEV harness).

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020). At
the repo's first push (`git remote -v` is still empty), confirm in
order: the ubuntu apt/webkit2gtk set installs; the three `uses:` SHA
pins resolve; playwright-on-Linux runs the lane — **now 34 tests**,
whose most platform-sensitive are the ones measuring REAL CSS in
Chromium-on-Linux (**if anything goes red there, look at the font and
colour assertions in `front-door.spec.ts` and `genesis-screen.spec.ts`
first**). **T-048 sharpens that warning specifically**: the new
three-viewport sweep asserts EXACT pixel equality between
`document.scrollHeight` and the viewport at 800x600, 1024x768 and
1280x720, so a Linux scrollbar-gutter or default-font difference would
show up there before anywhere else — and it should be read as a real
platform difference to file, not as a regression, unless the pane's
region also stops scrolling. Then: `cargo audit` behaves as it does
locally; and **the xvfb `tauri dev` boot prints both `[nputer]` startup
lines** — the FIRST exercise of the boot check on Linux, and the only
place T-046's override's Linux behaviour will ever be observed (CI
deliberately sets no `NPUTER_BOOT_PORT`, so the override path stays
Linux-unverified by design). AND (T-018-s3 fold) the THREE T-018
SENTINEL LIVE TESTS inside the ubuntu `cargo test` step —
replaced-wholesale and deleted-recreated docs/. They discriminate only
where inotify watches INODES; macOS FSEvents watches paths and was
accidentally resilient, which is why T-018's replace-half evidence is
mechanism-only today. Green there CLOSES that gap; red there is a real
reconcile gap macOS could never surface, and gets filed immediately.
This run also closes T-001/T-003's Linux halves, and carries T-026-s1
(the plan probe's exact-case match) and T-021-s1 (the ACL pin is
macOS-derived). The ubuntu `cargo test` step also runs the
`agent_runner` integration tests — **32 + 1 ignored** — which spawn
real child processes and send real signals; T-047's newest plant files,
refuse paths and assert on executable bits, so a Linux permissions or
`/bin/sh` difference would show up there first. Watch it, and watch for
the unnamed `agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN, and this merge is the
   one you were waiting on.** The app is RUNNING on 1420 as this
   checkpoint lands, **on the same pid 8392 as before** — this merge
   wrote no Rust, so nothing restarted; the two changed frontend files
   reached the window by **HMR**, so **the genesis screen may have
   re-laid-out under you mid-look**. **The route to the pane**: "Start
   an interview" on a docs-less folder, or "Start an interview here" on
   a folder the app just refused.
   - **NEW AND FIRST — the frame at 800x600, T-048's own @human item.**
     The pane now scrolls inside a fixed header and heading, and **the
     artifact list gets 286px of the 858px it wants** at the size the
     app actually opens. The measurement says the frame holds;
     **whether it holds ENOUGH list to be useful is an eye judgment
     only you can make** — and if it does not, the question it turns
     into is whether the interview heading block wants to be smaller,
     which is a design call, not a bug.
   - **THE COMPOSITION QUESTION, still the ONLY framing item left and
     still T-027's.** T-024 drew the pane as the **RIGHT HALF of a
     split view**; until T-027 it sits **full-width inside T-026's card
     frame**. Does its `bg-sidebar` ground read right framed by a
     `bg-card` bordered box, and does the **five-across backbone grid**
     hold at full width when it was drawn for a half-width pane?
     **This is the question T-027's planning pass waits on** (item 2).
     **T-048 changed nothing about the width** — a frame that does not
     hold was a bug at any width — so this question arrives at your eye
     exactly as it was posed, only now on a screen that fits.
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote. **Read T-048-s4 before T-048-s3** — s3 says the "Start
     an interview here" button falls below the fold at 800x600 and
     **that conclusion is wrong**; the button and the footnote both
     measure clear of the fold, and what spills is padding and 15px of
     painted card edge. It is a fit blemish to fold into this pass, not
     a hidden action to chase.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; true cold-context
     evidence still arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable
     from a browser harness and tauri-driver has no macOS. What remains
     is exactly the native half: "Start an interview" → native dialog →
     a docs-less folder lands on the genesis screen; ⌘N and ⌘O on the
     front door; "Start an interview here" on a folder the app just
     refused; a folder that already has a plan → the board, not
     genesis. (T-049 is building the accelerator half of this now.)
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/`
     (one .jsonl, 17,128 bytes, zero-token synthetic records). Outside
     the repo and deliberately not deleted. **Delete it or keep it —
     the call is yours.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. Two questions ride on it: does the kickoff land
     a real planner in stage 0, and is the six-pattern Bash allowlist
     sufficient for a real stage-0 scaffold (which is what T-025-s4
     needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action.** The next triage has
     **three** process/spawn-hygiene items to rank against each other:
     T-046-s1, T-047-s6 (the only one that has already fired), and
     T-047-s5 (~5 lines). **T-048 adds a fourth kind of call**: s2 (the
     map canvas clips — silent graph loss the day anything bounds it)
     versus s1 (two scroll models, which is T-027's) versus s5 (the
     floor, one line). **s2 is the one that can bite without warning.**
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047, ADR-017). **T-041's
   served-bundle gate is DOWN**, and **T-048 has removed the second
   thing standing between the human and a verdict**: the screen the
   composition question is asked about now fits the window it is asked
   in. **What still holds the milestone is the human, in this order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged. **T-027 also inherits T-047-s3** (a read boundary on
   `model` at the first site that renders it) **and T-048-s1** (the two
   scroll models, which only a composition decision can collapse).
   (b) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is hardened at four boundaries, but no
   agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict. **app-agent is
   FREE** — T-047 merged — which unblocks **T-043**'s "serialize behind
   T-039 on app-agent" condition outright; **app-shell is OCCUPIED by
   T-049.** Triage: APPLY granted — but tasks NEWLY created by triage
   (T-041…T-049) do NOT dispatch without the human; T-041, T-046,
   T-047, T-048 and T-049 each got that nod explicitly. Unchanged
   method rules: a second REJECTED on any task parks that lane for the
   human; @human judgments are never self-answered.
4. SUGGESTION BACKLOG — **27 open files: 9 parked + 18 suggested.**
   **T-048 contributes five**, and they do not all rank together.
   **Untriaged (18)**: the five T-048 cards — **s2** (the map canvas
   clips instead of scrolling; the sharpest, because it is harmless
   only until something bounds it and then loses graph with every suite
   green), **s4** (the s3 CORRECTION — read it BEFORE s3; schedule with
   the front-door visual pass), **s1** (two scroll models; genuinely
   T-027's composition call, needs a sticky rail AND a board scroll
   region AND s2), **s3** (the no-plan card overflows at 800x600 —
   measurement right, conclusion superseded by s4), **s5** (the bounded
   frame's floor; no `minHeight` in `tauri.conf.json`; one-line
   remedy) — plus the six T-047 cards (**s5** the probed path skips the
   gate, **s6** nothing structurally stops a test resolving the real
   CLI, **s4** `$SHELL` picks the program, **s1** retire the cache,
   **s2** the flag table is a version snapshot, **s3** the model has no
   read boundary, home T-027) — plus **T-041-s2** (the wire shape is
   pinned in Rust and mirrored by hand in TS with nothing comparing
   them), **T-041-s4** (`NODE_ENV`, not `--mode`, flips the DEV gate),
   **T-046-s1** (the unsignalled process group), **T-046-s4** (the
   overlay's blind spot), **T-046-s2** (`checkJs` — its worked example
   is wrong and the correction is IN the file), **T-046-s3** (nothing
   gates the packaged build — read with s4 and T-041-s4: all three are
   "a gate proves the configuration it was handed, not the one that
   ships"), and **T-039-s3** (give the session-id refusal its own typed
   outcome; home is T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run), T-025-s2 (@human, one
   command on an authenticated machine), T-025-s4 (gated by s2),
   T-025-s3 (nputer.yaml is F-04 era; its count fix rides T-043),
   T-038-s1 (no responsive call site yet — **note T-048 is the first
   task to measure the app at six viewport sizes, so s1's "no
   responsive call site" is now a slightly weaker claim than it was**).
   Five triage-born tasks stand ready and un-dispatched: T-042 (genesis
   switch truthfulness), **T-043** (kill path — its serialization
   condition is SATISFIED and app-agent is free; T-047-s4 nominates it
   as a home), T-044 (shell pins cover their surface), T-045 (the gates
   cover the rules).
   Milestone-4 queue after F-03: T-010, T-013, T-014, T-015, T-030…
   T-035, T-044, T-045, plus T-022.

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged. T-009-s1's sibling rule names its retirement (T-014's
  `nputer index --check`); BOOT GATE names none in CONVENTIONS, and
  `.github/workflows/ci.yml` already invokes the boot check on ubuntu
  while dormant. Does it retire at the repo's first push, or only when a
  macOS gate exists too? Left for a triage. **THREE exercises in now**
  (`app/src/**` at T-041 and here, `app/src-tauri/**` at T-047), and it
  has needed no amendment any time.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Unchanged: there are TWO gates with the shape trigger →
  command → record, one of which binds the executor, and
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green". Ask ONCE when a THIRD lands, or when the
  executor rule proves noisy. A method version bump, not an ADR.
- **Does the shared main working tree need a rule?** Carried forward
  and **now with a third data point**. The first was the git INDEX
  (T-046's merge lost its house shape to a shared index; the fix that
  works is social — "the pen is yours" — plus `git diff --cached
  --stat` before every commit, done twice here). The second was the
  WORKING TREE via Rust: an app-agent merge REBUILDS and RESTARTS the
  app the human is reviewing. The third, today: an app-shell merge
  reaches the same window by **HMR** — no restart, same pid, but the
  screen under review changes without a signal. **Both faces of it are
  now recorded and neither is written down anywhere but here.**
  Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: three C-14-local rules exist and a charter was argued against,
  because T-047-s5 proves the cached and probed doors hold DIFFERENT
  standards today. **The moment to write it is when s5 lands** — that is
  when there is a single rule to charter — which is a nearer, sharper
  trigger than "a second component spawns agents at F-04".
- **NEW: does a verifier's remedy belong in an acceptance criterion?**
  T-048 is the case that raises it. T-041's verifier filed a fix in
  s1's note 1; the architect promoted it into T-048's criterion 3 as a
  prescription; **it was wrong, and the task nearly required its own
  bug.** Only the "or a demonstrably better equivalent" escape hatch
  saved it. Two candidate rules, both cheap: a criterion that names a
  specific remedy SHALL carry that hatch (T-048's did, by luck or by
  habit — nobody recorded which), or a remedy inherited from a
  suggestion SHALL be written as a hypothesis to test rather than a
  shape to build. The architect's call (ADR-004), and worth taking
  while the example is fresh.
