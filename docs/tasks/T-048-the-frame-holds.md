---
id: T-048
title: The frame holds — the genesis page stops growing and the pane starts scrolling
feature: F-03
milestone: 3
priority: 6
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

Absorbs: T-041-s1, T-041-s3. Human-approved 2026-08-16 during the
visual review session, because the screen is unusable at the size the
app actually opens.

**Measured by T-041's probe and re-derived by its verifier**, at the
real bundle with T-024's `streak` fixture:

| viewport | page scrollHeight | overflow |
|---|---|---|
| 800×600 (the app's OWN configured window) | 1172 | **572** |
| 1024×768 | 1141 | 373 |
| 1280×720 | 1110 | 390 |
| 1920×1080 | 1110 | 30 |

It stops overflowing only at a **1110px** viewport height, and the
pane's own `overflow-y-auto` region measures **796/796** — it never
scrolls, at any size. So the page grows instead of the pane, and at
800×600 you scroll the header and the interview heading off-screen to
reach the artifact list.

**The fix filed with s1 was WRONG and the verifier falsified it by
doing it.** s1's note 1 said flipping the two `min-h-screen` to
`h-screen` "is the whole mechanical fix"; with that edit alone both
columns bind to 720px and **the page still scrolls 1110 vs 720**, the
pane region still 796/796 — `overflow: visible` still spills. The
missing link is **`min-h-0` on `GenesisScreen.tsx:37`**. With all
three edits the verifier measured page 720/720 and pane region
796/406: the frame holds and the pane scrolls.

NOT the composition question. Whether the pane belongs full-width or
as the right half of a split view is T-027's call and is untouched
here — a frame that does not hold is a bug at any width.

## Acceptance criteria
- THE genesis screen's page SHALL NOT grow beyond the viewport at any
  window size: `document.scrollHeight` equals the viewport height at
  800×600, 1024×768 and 1280×720 with the `streak` fixture rendered.
- THE pane's own scroll region SHALL engage instead — its
  `scrollHeight` exceeding its `clientHeight` when the content is
  taller than the frame, so the artifact list scrolls inside a fixed
  header/footer rather than pushing the page.
- THE fix SHALL be the three class edits the verifier proved
  sufficient (two `min-h-screen` → `h-screen`, `min-h-0` on the
  genesis screen's column) or a demonstrably better equivalent — if
  a different shape is chosen, the notes SHALL show the same
  measurements at the same three viewports.
- THE other screens SHALL be unaffected: board, map, front door and
  the "No plan in <folder>" card keep their current layout, pinned by
  the existing suites and by a measurement at one viewport each.
- THE T-041 lane spec that currently PINS the overflow as a tripwire
  SHALL be updated to assert the fixed behaviour, with its comment
  rewritten to name this task rather than the open question — the
  tripwire did its job and must not silently keep passing on the old
  numbers.

Verification: headless — the tools/e2e lane at the three viewports
with real CSS, plus the app suite. @human: the composition judgment
(full-width vs right half) remains open for T-027 and is NOT settled
here; look at the screen again once this lands.

## Implementation notes

Executor claude-opus-5 @fresh, 2026-08-16, branch `t048-frame-holds`
(worktree ../nputer-t048). Dispatched at main@0378cb9; the worktree was
cut from `cf5a650`, which the orchestrator later found to be an ORPHAN
(a sibling of main's `37cb0ed`, same parent, two lines of STATE.md
apart). Corrected mid-task as instructed: **main was merged FORWARD**
(`git merge --no-ff main`, never a rebase) at `a3a5ccb`, taking T-046
and T-041. The one conflict was `docs/STATE.md` — both sides had
rewritten it — resolved by taking **main's side whole**, verified with
`git diff main HEAD -- docs/STATE.md` = **0 bytes**. Every number below
was re-measured after that merge.

Baselines re-derived on the merged tree, not inherited: lib/parser
**159/159**, app **491/491 (28 files)** after `npm run build`, cargo
**208 passed + 3 ignored** over 11 binaries, tools/e2e **33**,
`lint:tokens` clean.

### What shipped — TWO classes, not three, and the third is the reason

    app/src/App.tsx
      const boundedFrame = screen.screen === "genesis";
      <div className={cn("flex min-w-0 flex-1 flex-col",
                         boundedFrame ? "h-screen" : "min-h-screen")}>

    app/src/components/shell/GenesisScreen.tsx
      className="flex min-h-0 flex-1 flex-col gap-6 px-10 py-9"

Criterion 3 offers "the three class edits the verifier proved sufficient
or a demonstrably better equivalent". The three-edit version was built,
measured, and **rejected on criterion 4 evidence**: `min-h-screen` →
`h-screen` on `main` bounds the whole shell, and `main` is the row the
pane rail lives in. Measured (every figure below is from the served
bundle):

- **board**: the rail is a stretch-height sibling of the column, so it
  drops from **2202px → 720px** at 1280x720 and **2202 → 600** at
  800x600. The page still scrolls to 2202; the sidebar strip and its
  right border now stop at the fold.
- **map at 800x600**: the canvas is `min-h-0 flex-1 overflow-hidden`
  (MapView.tsx:490), so it shrinks and **clips**: `div.map-canvas-grid
  446/320`, `overflow-y: hidden`, **126px of graph unreachable with no
  scrollbar anywhere**. Page 726 → 600. Filed as T-048-s2.
- **the "No plan" card at 800x600**: `main` 663 → 600 (the section keeps
  its content height and spills). No visual consequence — `main` paints
  nothing — but it is movement where criterion 4 asked for none.

The genesis half of `main` needs no edit at all: with the column at
`h-screen`, `main` is `min-h-screen` with a 100vh child, so it resolves
to exactly 100vh. **Verified rather than argued** — a variant with BOTH
conditional was built and measured, and every number at all three
viewports is identical to what shipped. So the second edit buys nothing
on genesis and costs two screens elsewhere; it is not in the diff.

`cn()` is the codebase's existing conditional-class idiom
(`@/lib/utils`, as PaneRail uses it). Zero new tokens, zero arbitrary
values, no new dependency, no new IPC.

### 1. The measurement table, before and after

Rig: the REAL dev bundle on a scratch port (14523, never 1420), headless
Chromium, driven through **T-041's own `__nputerShellHarness` +
`__nputerDocsHarness`** — no IPC faked, no source patched. T-024's
`streak` fixture (9 files) applied under a genesis project.

Cross-check worth recording: before the forward merge the harness did
not exist at the branch point, so the first pass drove the same screens
through a fake `window.__TAURI_INTERNALS__` (the boundary
`genesis-entry.test.tsx` mocks, in a real browser). After the merge the
rig was re-pointed at the sanctioned harness and **every number came out
byte-identical**. Two independent routes to the same screen agree.

**BEFORE** — the recorded numbers reproduce exactly (1172 / 1141 / 1110,
and 796/796 at the lane's geometry):

| viewport | page scrollHeight / viewport | overflow | pane region scrollHeight/clientHeight | column |
|---|---|---|---|---|
| 800x600 | **1172 / 600** | 572 | **858 / 858** — never scrolls | 1172 |
| 1024x768 | **1141 / 768** | 373 | **827 / 827** — never scrolls | 1141 |
| 1280x720 | **1110 / 720** | 390 | **796 / 796** — never scrolls | 1110 |

(The task table's "796/796" is the 1280x720 figure; the region is
858/858 and 827/827 at the two smaller widths — taller content, because
it wraps. It never scrolls at any of them, which is the claim.)

**AFTER**:

| viewport | page scrollHeight / viewport | overflow | pane region scrollHeight/clientHeight | column |
|---|---|---|---|---|
| 800x600 | **600 / 600** | 0 | **858 / 286** — scrolls | 600 |
| 1024x768 | **768 / 768** | 0 | **827 / 454** — scrolls | 768 |
| 1280x720 | **720 / 720** | 0 | **796 / 406** — scrolls | 720 |

720/720 and 796/406 at 1280x720 are exactly what T-041's verifier
measured for the three-edit version, so the two shapes are equivalent on
the screen the criterion is about. The empty genesis screen (nothing
written yet) moves too: 800x600 page **971 → 600**, region 657/657 →
657/286.

### 2. The falsified fix, re-derived by doing it

Only the two `min-h-screen` → `h-screen` edits, no `min-h-0`:

| viewport | page / viewport | main | column | pane region |
|---|---|---|---|---|
| 800x600 | **1172 / 600** | 600 | 600 | **858 / 858** |
| 1024x768 | **1141 / 768** | 768 | 768 | **827 / 827** |
| 1280x720 | **1110 / 720** | 720 | 720 | **796 / 796** |

Both columns bind — `main` and the column are exactly the viewport, and
their computed `min-height` drops to 0px — **and every page number is
unchanged from BEFORE, to the pixel**, with the pane's region still
frozen. `overflow: visible` spills, because the genesis section's
automatic minimum size is its content (1105px) and nothing lets it
shrink. T-041-s3 is exactly right and s1's "the whole mechanical fix" is
exactly wrong. `min-h-0` alone (column unbounded) is equally
insufficient — the section can shrink but nothing asks it to; both
halves were reverted separately against the new coverage and both go
red (below).

### 3. Other screens unaffected — measured, not assumed

Every field, before → after, at 1280x720 and at 800x600 (the app's own
window). `page` = document scrollHeight / viewport; `rail` = the pane
rail's rendered height; `card` = the empty-state card's document-relative
top + height.

| screen | before | after |
|---|---|---|
| front door 1280x720 | page 720/720, main 720, card 238+312 | **identical** |
| no-plan card 1280x720 | page 720/720, main 720, card 144+500 | **identical** |
| board 1280x720 | page 2202/720, main 2202, **rail 2202** | **identical** |
| map 1280x720 | page 720/720, main 720, rail 720 | **identical** |
| front door 800x600 | page 600/600, main 600, card 178+312 | **identical** |
| no-plan card 800x600 | page 663/600, main 663, card 115+500 | **identical** |
| board 800x600 | page 2202/600, main 2202, **rail 2202** | **identical** |
| map 800x600 | page 726/600, main 726, rail 726 | **identical** |

The board fixture is the repo's OWN docs/ tree (every task file, ROADMAP
and component) — the tallest real board available, which is what makes
the rail figure worth measuring. Two probes ran alongside, both unchanged
before → after: `minTop` (anything above the scroll origin is
unreachable) stayed 0 everywhere, and the `overflow:hidden`-with-taller-
content list stayed the same eleven pre-existing map-node buttons (the
canvas joins that list ONLY under the rejected three-edit version).

Two honest findings from this sweep, both pre-existing and both filed
rather than fixed: the no-plan card already overflows at 800x600
(663 vs 600 — **T-048-s3**), and the map canvas clips rather than
scrolls whenever anything bounds it (**T-048-s2**).

### 4. Coverage that would catch a regression, proved by reverting

**`tools/e2e/tests/genesis-screen.spec.ts`** — the measurement, where
layout is real. This is also criterion 5 (below). Two blocks:

- the existing "laid out and painted by the real sheet" test now asserts
  the FIXED behaviour at the lane's 1280x720 — page scrollHeight ==
  viewport, the pane's region scrollHeight > clientHeight, and the
  COLUMN's height == viewport (the old assertion read
  `[data-testid="docs-model"]`, which is `main`, one level up);
- a new test sweeps **800x600, 1024x768 and 1280x720** — the same three
  the task names — asserting all four facts at each, then proves the
  same claim as BEHAVIOUR with this lane's trusted input: a real
  `page.mouse.wheel` over the pane moves the pane's `scrollTop`, leaves
  `window.scrollY` at 0, and brings the last artifact row into view.

It fails on the CLASS, not on a class name: it reads the page's own
scrollHeight, so anything that makes the screen grow again reds it.

**`app/test/shell-frame.test.tsx`** (new, 4 tests) — what the lane
cannot cheaply see. jsdom has no layout, so it pins the two facts that
would otherwise be unprotected: **the scoping** (genesis bounded, board
/ map / front door not, `main` always `min-h-screen` so the rail keeps
stretching — nothing in the lane asserts the rail's height, so without
this the conditional could be flattened and every suite would stay
green), and **the chain** — a walk UP from the pane's `overflow-y-auto`
region to the bounded column asserting every link carries `min-h-0`,
including the two links inside T-024's pane that this task does not own.
Real App, real store, real routing, IPC mocked (the T-026 precedent).

Reverts with the coverage in place, each run separately:

| revert | result |
|---|---|
| both halves (back to main) | lane **2 failed** — "the genesis column is bounded to the window (T-048)" and "the column is bounded at 800x600"; app suite 2 failed |
| `h-screen` kept, `min-h-0` reverted (the falsified fix) | lane **2 failed** — "the frame HOLDS: the page never grows past the viewport (T-048)" and "the page does not grow past the window at 800x600". The column assertion PASSES, which is the falsification in one line |
| `min-h-0` kept, `h-screen` reverted | lane **2 failed** — the column assertions |

### 5. The T-041 tripwire — the real edit, not a drafted hunk

The dispatch expected T-041 to be unmerged and asked for the replacement
text as a drafted-for-integrator hunk. The forward merge landed T-041
first, so `tools/e2e/tests/genesis-screen.spec.ts` is in this tree and
the edit is **done here**. What changed:

- the assertions flipped from pinning the break to pinning the fix —
  `pageScroll` `toBeGreaterThan(viewport)` → `toBe(viewport)`, and
  `scrollHeight` `toBe(clientHeight)` → `toBeGreaterThan(clientHeight)`;
- `columnMinHeight` (read off `main`, and now meaningless — `main` keeps
  `min-h-screen` deliberately) → `columnHeight`, read off the column
  that actually carries the bound, asserted equal to the viewport;
- the comment no longer names the open question. It says T-041 pinned
  the wrong answer as a deliberate tripwire, that T-048 fixed it, and
  that bounding the column ALONE leaves 1110/720 and 796/796 — so the
  next reader learns the mechanism instead of inheriting the remedy that
  was falsified. The three `T-041-s1` mentions in that block are gone
  with the assertions they annotated; the s1/s3 FILES were already
  deleted on main when T-041 merged (absorbed here) and were not
  recreated.

The tripwire's own failure modes were exercised: with the fix reverted
it goes red at both viewport sizes (table above), and with the fix in
place all 4 tests in the file pass. It cannot silently keep passing on
the old numbers — the old numbers now fail it.

### 6. Every new test executes

Not counted, run. `expect("PROBE").toBe("EXECUTED")` injected as the
first statement of each new/edited body, then reverted and `cmp`-checked
byte-exact:

- `app/test/shell-frame.test.tsx` — all **4** it() bodies → **4 failed
  (4)**, each on the PROBE line;
- `tools/e2e/tests/genesis-screen.spec.ts` — both touched test bodies
  (the edited "laid out and painted" and the new three-viewport sweep) →
  **2 failed, 2 passed**, the two failures on the PROBE line.

### 7. Suites (macOS 15/Darwin 25.6, node 22.22.0; ADR-011 order)

| suite | baseline (merged tree) | with T-048 |
|---|---|---|
| lib/parser `npm test` | 159/159 | **159/159 (10 files)**, `tsc --noEmit` clean, build clean |
| app `npm test` (after `npm run build`) | 491/491 (28 files) | **495/495 (29 files)** — +4, all mine |
| app `npx tsc --noEmit` | clean | **clean** |
| app `npm run build` | exit 0 | **exit 0**, `index-DV-d_LjB.js` 442.12 kB (baseline `index-vTAlOtQD.js` 442.07 kB) |
| app/src-tauri bare `cargo test` | 208 + 3 ignored | **208 passed + 3 ignored, 0 failed** over 11 binaries |
| tools/e2e `npx playwright test` | 33 | **34/34 in 8.5s**, one worker, no skips |
| tools/e2e `npm run typecheck` | clean | **clean** |
| tools/e2e `npm run lint:tokens` | clean | **clean, 37 files** |

The cargo total was summed from the eleven `test result:` lines, not
read off a `tail` (the standing trap). The app suite's four
bundle-reading tests (`shell-harness.test.ts`, `genesis-mount.test.tsx`)
fail against a missing `dist/` — that is why the count is quoted "after
`npm run build`", and it cost one confused run here before the cause was
found. `genesis-mount.test.tsx`'s staleness guard is sharper still: a
`git stash` / `stash pop` cycle re-touches the sources, so the build must
be the LAST thing before the suite. Both were hit and both are the guard
working.

**Boot check NOT run** (CONVENTIONS BOOT GATE, landed by T-046 and now
in this tree after the merge). The dispatch forbids it explicitly, and
this diff would otherwise trigger it (`app/src/**`). Said out loud
rather than passed over in silence, which is what that bullet requires:
**the gate did not run on this branch, by instruction, and the merge
that lands it should run it.**

### 8. Fence

`git diff --stat` against the merge commit is **six files**: the two
source files, the two test files (one new), and three suggestion files
— nothing else. Zero diff under `app/src/lib/watcher-store.ts`,
`tools/e2e/scripts/**`, `app/src-tauri/**`, `lib/parser/**`, `method/**`,
`docs/CONVENTIONS.md`, `app/src/genesis/**` (the criterion never forced
it — T-024's pane already had its whole `min-h-0` chain, which is why
this is two classes), and every lockfile. Neither ../nputer-t041,
../nputer-t046 nor ../nputer-t047 was entered; T-041's branch content was
read via `git show` from the main checkout before the merge made it
moot. No port but 14520 (the lane) and 14523 (the scratch rig) was bound
or contacted — **1420 was never touched**. No screenshots, no screen
control, no model calls, no new dependencies.

### 9. For the integrator: the graph regen delta, measured

The T-009-s1 rule fires (this diff touches `*.tsx` outside docs/). I
regenerated in-branch to MEASURE, then restored `docs/architecture/
graph.json` to the committed bytes — sha256
`05ebc2c772ffa3aaabc23aefa0feae60f2c4652ab9e64ac1c64de0044f5e478a`,
re-verified after restore, `git status docs/` clean. The ignored
`self_graph_is_current` is RED on-branch, exactly as forecast.

- files **89 → 90**: adds `app/test/shell-frame.test.tsx`; nothing
  removed. Content-changed (hash/loc only): `app/src/App.tsx`,
  `app/src/components/shell/GenesisScreen.tsx`.
- stats: symbols **602 → 616**, edges **1003 → 1013**.
- **THREE assertions move**, and they must be edited in the same commit
  as the regen: `app/test/architecture-dogfood.test.ts:469`
  `toBe(89)` → `90` (with its test title at :468 and the header block's
  stats line ~:357), the relation row `["C-05","C-10","confirmed",20]`
  → **21** at :636, and `app/test/map-dogfood-render.test.tsx:201`
  `committed graph · 89 files` → `90 files`. Every other row, finding,
  drift flag and count is byte-unchanged — the new file is claimed by
  C-05 (`app/test/**`) and imports `@/lib/docs-model`, so it adds one
  observation to an edge that already exists. No new component, so
  `lib/parser/test/smoke.test.ts` does NOT move (registry pin, not a
  graph pin — T-024's lesson, read the right way round).

### 10. Flags for the verifier

- **The deviation from criterion 3 is the whole judgment call.** If you
  disagree, the three-edit version is two `git checkout`s away and the
  evidence against it is the criterion-4 table above; reproduce the rail
  (2202 → 720) and the map canvas (446/320, hidden) before ruling.
- **`main` keeps `min-h-screen` on the genesis screen** and resolves to
  100vh anyway. That is measured, not assumed, and a both-conditional
  variant was measured to be identical. If you think the frame should
  SAY it is bounded rather than resolve to it, that is a readability
  argument, not a measurement one.
- **The chain test asserts a fixed path** (`div.flex` → `genesis-pane` →
  `genesis-pane-slot` → `genesis-screen`). If T-027 restructures the
  screen it will go red and should be re-derived, not deleted — the
  loop above it is the real assertion; the equality is there so a new
  link cannot appear unlooked-at.
- **Not covered:** the app suite pins classes and the lane pins layout,
  but nothing pins the RAIL's height, so criterion 4's board evidence is
  a one-off measurement plus `shell-frame.test.tsx`'s class-level proxy.
  A lane spec measuring the rail against the document height would close
  it; it belongs with T-048-s1, which is where the decision lives.
- **T-048-s3 is the finding I would look at first**: the front door's
  no-plan card already overflows the app's own window (663 vs 600). It
  is out of this task's fence and it is the same shape one screen over.

### 11. @human (listed, never performed here — headless throughout)

1. **The frame at 800x600.** The pane now scrolls inside a fixed header
   and heading: the artifact list has 286px of the 858px it wants at
   that size. Is that enough of a list to be useful, or does the
   interview heading block want to be smaller? The measurement says the
   frame holds; whether it holds ENOUGH is an eye judgment.
2. **The composition question is untouched and still T-027's** —
   full-width pane vs right half. A frame that does not hold was a bug
   at any width; this changes nothing about the width.
3. **T-048-s1**: the shell now has two scroll models (bounded genesis,
   growing board/map/front door). Worth a look at the board's header
   scrolling away at 800x600 while the interview's does not.

## Verdicts

2026-08-16 — claude-opus-5 @fresh, verifier — same-model review (the
builder was claude-opus-5 too; recorded so this is not read as an
independent-model check): **APPROVED**, with two suggestions filed (s4,
s5), one of them a **CORRECTION to this branch's own T-048-s3**. Every
number below is mine, re-derived from the branch against the real dev
bundle on a scratch port (14526; 14520 for the lane, **1420 never
bound or contacted** — it stayed the human's live app throughout).
Merge-base confirmed **`e78bfdc`**, HEAD `517ecde`, **8 files**.

**Rig.** The REAL dev bundle, headless Chromium driven through T-041's
`__nputerShellHarness` + `__nputerDocsHarness`, T-024's `streak`
fixture (9 files) under a genesis project. Written from scratch rather
than run from the branch's lane, so the measurement is independent of
the coverage it is checking.

**C1 + C2 — THE MEASUREMENT TABLE, BOTH HALVES, MINE.** BEFORE
(merge-base sources checked back in, same rig):

| viewport | page / vp | column | pane region |
|---|---|---|---|
| 800x600 | **1172 / 600** | 1172 | **858 / 858** — never scrolls |
| 1024x768 | **1141 / 768** | 1141 | **827 / 827** — never scrolls |
| 1280x720 | **1110 / 720** | 1110 | **796 / 796** — never scrolls |

AFTER:

| viewport | page / vp | column | pane region |
|---|---|---|---|
| 800x600 | **600 / 600** | 600 | **858 / 286** — scrolls |
| 1024x768 | **768 / 768** | 768 | **827 / 454** — scrolls |
| 1280x720 | **720 / 720** | 720 | **796 / 406** — scrolls |

Every recorded figure reproduces to the pixel, including the notes'
empty-genesis line (800x600 page **971 → 600**, region 657/657 →
657/286). Extended past the three the criterion names: 1920x1080
1080/1080 (796/766), 1440x900 900/900 (796/586), 640x480 480/480
(886/166) — all hold, and the last artifact is fully reachable at every
one. The floor is measured and filed as **s5** (below ~250px of window
height the pane's region stops at 44px and the last row cannot be
brought into view; below ~225px the page grows again). Far outside the
criterion and outside any plausible window, but it is a real trade a
bounded frame makes and `tauri.conf.json` declares no `minHeight`.

**C3 — THE DEVIATION IS CORRECT, AND THE TASK FILE'S OWN PRESCRIPTION
WAS WRONG. Both grounds re-derived by building the three-edit version
and measuring it.**

- **board**: the rail is a stretch-height sibling of the column, so it
  goes **2202 → 720** at 1280x720 and **2202 → 600** at 800x600, while
  the page still scrolls to **2202**. The sidebar strip and its border
  stop at the fold on a document that keeps going. Reproduced.
- **map at 800x600**: `div.map-canvas-grid` joins the
  `overflow:hidden`-with-taller-content list **only** under the
  three-edit version — **446/392, `overflow-y: hidden`**, no scrollbar
  anywhere. (The notes say 446/320 and 126px lost; my board fixture is
  this branch's own docs/ tree and measures a shorter map page, so I
  lose 54px instead of 126. Same mechanism, same arithmetic —
  unreachable == the page overflow the bound removes — different
  fixture height. Not a discrepancy in the claim.)
- **the no-plan card at 800x600**: `main` **663 → 600**, movement where
  criterion 4 asked for none. Reproduced.
- **and it buys nothing**: the three-edit version's genesis numbers are
  **identical to what shipped** at all three viewports (600/600
  858/286, 768/768 827/454, 720/720 796/406). So the second
  `min-h-screen → h-screen` costs two screens and gains zero pixels.

The criterion offered "a demonstrably better equivalent" and this is
one. **Criterion 3's own prescription, inherited from T-041-s1, would
have failed criterion 4** — the two are in conflict and the builder
resolved it the right way, with measurements, and said so.

**C4 — RE-MEASURED, NOT TAKEN ON TRUST.** Every screen, every field,
before → after, at BOTH viewports the dispatch names:

| screen | 1280x720 | 800x600 |
|---|---|---|
| front door | page 720/720, main 720, card 67+653 | page 600/600, main 600, card 67+533 |
| no-plan card | page 720/720, main 720, card 67+653 | page 663/600, main 663, card 67+596 |
| board (this repo's own docs/, 122 files) | page 2202/720, main 2202, **rail 2202** | page 2202/600, main 2202, **rail 2202** |
| map | page 720/720, main 720, rail 720, canvas 546/546 | page 654/600, main 654, rail 654, canvas 446/446 |

**Every field identical before → after, at both sizes.** Two extra
probes agree: `minTop` stayed 0 everywhere (nothing above the scroll
origin), and the `overflow:hidden`-with-taller-content list stayed the
same eleven pre-existing map-node buttons — the canvas joins it only
under the rejected variant. Zero regressions.

**C5 — THE TRIPWIRE FLIPPED, AND IT CATCHES. Three revert drills, each
run separately, each red with a legible message:**

| revert | lane result |
|---|---|
| both halves (back to merge-base) | **2 failed** — "the genesis column is bounded to the window (T-048)" Expected 720 Received **1110**; "the column is bounded to the window at 800x600" Expected 600 Received **1172**. App suite **2 failed** — "the interview's column is bounded", "genesis-screen must be able to shrink below its content" |
| `h-screen` kept, `min-h-0` reverted (the falsified fix) | **2 failed** — "the frame HOLDS: the page never grows past the viewport (T-048)" Expected 720 Received **1110**; "the page does not grow past the window at 800x600" Expected 600 Received **1172**. The column assertions **PASS** — the falsification in one line, and the lane re-derives the falsified fix's numbers on its own |
| `min-h-0` kept, `h-screen` reverted | **2 failed** — both column assertions |

The comment names T-048 eight times, `T-041-s1` is gone from the block
(0 occurrences), the single `T-041-s3` mention is explanatory, and
T-041's s1/s3 FILES are absent on branch and on main alike — absorbed,
not recreated. The one residue: line 197 still opens "the open @human
question from T-026/T-037", which now reads as a topic heading rather
than a live question since the next sentence says T-041 pinned the
wrong answer and T-048 fixed it. Criterion met; the phrasing is worth a
word if anyone touches the block again.

**THE TRUSTED WHEEL — it proves reachability, not a delta.** Before the
wheel the last artifact sits at top 954 / bottom 994 against a 720
viewport, intersection ratio **0** — `toBeInViewport()` would fail.
After `page.mouse.wheel(0, 2000)`: `scrollTop` **390**, which is the
region's full range (796 − 406), the row at 564–604, ratio **1.0**,
`window.scrollY` **0**. The page's own listener reports
`isTrusted: true`, so it is real browser input, not synthetic dispatch.

**THE CONDITIONAL — principled today, incidental tomorrow; ruled
acceptable.** `boundedFrame = screen.screen === "genesis"` and the
`<GenesisScreen>` render guard are the **same expression off the same
`screen` object in the same render**, so they cannot desync. Proved
rather than argued: nine reachable shell states driven through the
harness — browser, noProject, noDocs, genesis empty, genesis + streak,
**genesis phase + a rejected pick**, genesis phase + an error pick,
back to genesis, and docs landing under a different dir while genesis —
and in every one `genesisRendered === bounded` and `bounded !== floor`.
No state renders genesis unbounded or bounds a screen that is not it.
It is also coextensive with the real rule: the genesis pane's
`overflow-y-auto` is the shell's ONLY in-flow scroll region (the board
detail panel and the map panel are `fixed inset-y-0`, already
viewport-bounded). The forward-looking gap is real — the default is
`min-h-screen`, so a NEW screen with an in-flow scroll region
reproduces T-048 silently and nothing in either suite would catch it —
but criterion 4 *requires* the scoping, T-027 restructures this screen
and will red the chain test on its way through, and **T-048-s1 already
holds exactly this decision** with the rail and the board in scope. Not
worth a second file; not worth blocking.

**COVERAGE EXECUTES.** `expect("PROBE").toBe("EXECUTED")` injected as
the first statement of each new/edited body: `shell-frame.test.tsx` all
**4** it() bodies → **4 failed (4)**, each on the PROBE line;
`genesis-screen.spec.ts` both touched bodies → **2 failed, 2 passed**,
both failures on the PROBE line. Reverted and `cmp`-verified byte-exact
against pre-probe copies; sha256 of all four touched files unchanged.

**SUITES (macOS 15/Darwin 25.6, node v22.22.0, ADR-011 order, this
worktree).** lib/parser `npm test` **159 passed (10 files)**. app
`npx tsc --noEmit` **clean**, `npm run build` **exit 0** —
`index-DV-d_LjB.js` **442.12 kB**, matching the notes — `npm test`
**495 passed (29 files)**. src-tauri bare `cargo test` **208 passed + 3
ignored** over 11 binaries, summed from the eleven `test result:` lines
(100 / 0 / 0 / 28+1 / 68 / 3 / 7 / 0+1 / 2+1 / 0 / 0), **not** read off
a tail. tools/e2e `npx playwright test` **34 passed (8.5s)**, one
worker, retries 0, no skips; `npm run typecheck` clean; `lint:tokens`
**clean, 37 files**. Cargo is **208, not T-047's 217, and that is
correct for this base** — the branch's merge-base predates T-047; it is
noted, not counted as a miss. **Boot check NOT run**, by instruction —
the builder correctly did not run it either and said so; the merge that
lands this must.

**FENCE — proved, not asserted.** `git diff --name-only e78bfdc..HEAD`
is **8 files** and nothing else. Zero changed under
`app/src/lib/watcher-store.ts`, `tools/e2e/scripts/**`,
`app/src-tauri/**`, `lib/**`, `method/**`, `docs/CONVENTIONS.md`,
`app/src/genesis/**`, `docs/architecture/graph.json`, `docs/STATE.md`,
`docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, and every lockfile (0).
**Nothing T-049 owns is touched**: T-048's three App.tsx hunks are
`@@ -7,0 +8`, `@@ -275,0 +277,32` and `@@ -291 +324`, while T-049 owns
the `EmptyState` keydown listener (:142-153) and the header's button
region (:356) — no shared line, and the nearest edit is 32 lines clear
of the button block, well outside merge context. `../nputer-t049` was
never entered; T-049's task file was read via `git show main:`.

**GRAPH FORECAST — regenerated myself, confirmed, restored byte-exact.**
`self_graph_is_current` RED on-branch as forecast. After
`NPUTER_UPDATE_GOLDEN=1`: files **89 → 90** (adds
`app/test/shell-frame.test.tsx`, nothing removed), content-changed
hash/loc only on `App.tsx` and `GenesisScreen.tsx`, stats symbols
**602 → 616**, edges **1003 → 1013** — every figure as forecast. Three
assertions move and no more: `architecture-dogfood.test.ts` file count
89 → **90**, its relation row `["C-05","C-10","confirmed",20]` → **21**
(vitest's own diff, and the table stays 28 rows either side — one
count, no rows added or lost), and `map-dogfood-render.test.tsx`
`committed graph · 89 files` → **90 files**. `lib/parser` stayed
**159/159 with `smoke.test.ts` green**, so the registry pin does NOT
move, exactly as forecast. `docs/architecture/graph.json` restored and
re-verified at sha256 `05ebc2c772ffa3aaabc23aefa0feae60f2c4652ab9e64ac1c64de0044f5e478a`, `git status` clean.

**THE THREE SUGGESTIONS.** **s1** — reproduced: bounded genesis
(600/600) beside a board that runs to 2202 with its header scrolling
away at 800x600. Two scroll models, correctly described, and it is
genuinely T-027's composition call, not something smaller: unifying
needs a sticky rail AND a board scroll region AND s2's canvas fix
before the conditional can collapse. **s2** — reproduced and it is the
sharpest of the three: the canvas is `overflow-hidden` with no scroll
region under it, harmless only because nothing bounds it today, and it
enters the clipped list the instant anything does, with every suite
green. Worth closing on its own terms. **s3 — the measurement holds and
the CONCLUSION DOES NOT**, filed as **s4**: 663/600 reproduces exactly,
but "Start an interview here" measures top 524 / bottom 556 and the
footnote ends at 590, both clear of a 600px fold; **no element's text
starts at or below y=600**. What overflows is the section's `py-12` and
15px of the card's painted bottom edge. It is a cosmetic fit blemish on
the first screen, not a hidden primary action — schedule it with the
front-door visual pass, not ahead of it. s3's own `115+500` card figure
already implied this; the prose overshot.

**Verdict: APPROVED.** All five criteria met. The deviation from
criterion 3 is not a shortcut — it is the branch measuring its own
task file's prescription and finding it wrong, and it is right. The
coverage reds on the class rather than on a class name, the tripwire
was flipped and drilled three ways, and the fence is clean. `status`
left `building` for the integrator. **@human, when you look at the
screen again**: the frame holds at 800x600 and the artifact list has
286px of the 858px it wants — whether that is enough list is the eye
judgment the notes ask for, and the composition question (full-width
pane vs right half) is still T-027's. Read **s4 before s3**.
