---
id: T-116
title: Churn is measured once per mount and never ages — the payload already carries the timestamp, the pane renders it nowhere, and a project switch keeps the previous repository's numbers
feature: F-06
milestone: 4
priority: 43
size: S
status: verifying
blocked_by: []
touches: [app-map]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

## ARCHITECT'S FENCE RULING — 2026-08-25, at `765924d`

The drafter asked the architect to choose between widening this fence to
`[app-map, app-shell]` and letting T-034's precedent stand. **The
precedent stands: this card's fence is `[app-map]`, and the pins it owes
land in `app/test/` under map-owned names.** The drafter's measurement
is accepted as correct — `app/vitest.config.ts` has
`include: ["test/**/*.test.{ts,tsx}"]`, there are zero test files under
`app/src`, and C-05's `paths:` claims `app/test/**` with
`touch_slugs: [app-shell]`. What is being ruled is which of the two live
readings governs, not what the tree says.

**The reason is what a fence is FOR.** A fence exists so two concurrent
lanes cannot write the same file. It is a collision-avoidance device,
not a statement about ownership, authorship or taste. A new file named
for the map pane cannot collide with a shell lane's work, so widening
buys no collision that the narrow fence misses.

**And widening is not free, which is the half that makes this a
decision rather than a preference.** `app-shell` is held by a live lane
(T-033) as this is written, so "widen the fence" and "wait for T-033"
are the same instruction. **A rule that makes a card wait on a collision
that cannot happen is not caution; it is a tax paid in serialisation.**
That is the concrete cost, and there is no concrete benefit on the other
side of the scale.

**THE PRECEDENT IS A PRACTICE, NOT AN ACCIDENT.** Three instances are
now on the record: T-034 shipped `app/test/map-tasks-lens-dom.test.tsx`
under `touches: [app-map]`, verified and merged; `T-115`'s note carries
the second; this card is the third. Three occurrences with no reported
collision is evidence about the rule, and the rule the tree has been
following is the narrow one.

**THE RULING IS NARROWED SO IT IS CHECKABLE RATHER THAN A LICENCE.**
The executor may CREATE files under `app/test/` whose names begin `map-`
and whose subject is the map pane. **It SHALL NOT modify any existing
`app/test/**` file that is not already map-owned**, and it SHALL NOT
touch `app/vitest.config.ts`, `app/index.html`, `app/vite.config.ts`, or
anything else in C-05's glob. If the work needs one of those, that is
the routing case the last criterion already covers. **A ruling that
cannot be checked from the diff is not a ruling** — this one can:
every added path under `app/test/` must begin `map-`, and the count of
modified pre-existing `app/test/**` paths must be zero unless the file
is already a map body.

**THE REGISTRY IS WHERE THE ACTUAL DEFECT IS, and it is routed rather
than fixed here.** C-05's glob over-claims: it swallows `app/test/**`
whole, including bodies that exercise C-12. C-14's own file already
records the principle that cuts the other way — that a test belongs to
the component it exercises — so the registry contradicts itself in
writing, one file apart. **The fix is to split `app/test/**` so map
bodies resolve to `app-map`, and this card SHALL NOT make it**:
`docs/architecture/components/` is held by T-033, and a lane that
edits the registry to legalise its own fence has widened its fence by
another route. File it as a suggestion.

**THIS RULING HAS A KNOWN EXPIRY.** T-033 is in flight over the
registry right now. If it lands a change to C-05's or C-12's `paths:`
or `touch_slugs:`, **the ruling above is superseded by whatever the
registry then says**, and the executor SHALL re-read C-05 and C-12 at
its own base ref rather than trusting this paragraph. Say which reading
was in force at the ref you measured.

Absorbs (seventh triage, 2026-08-24): T-013-s5 — file removed in this
commit.

The map's third data source is the only layer of the pane that
REMEMBERS. Every other layer is a pure function of the docs snapshot and
re-derives itself; churn is measured once and then frozen, and it does
not say when.

## Measured at `6b0cf47`

`loadChurn()` runs from one mount effect in
`app/src/architecture/MapView.tsx` — `useEffect(() => { void loadChurn(); }, [])`,
empty dependency array — **and nothing else calls it**. Under Tauri a
remount re-measures; while the pane stays mounted the answer is frozen.

**The payload's age is carried all the way to the frontend and then
rendered nowhere.** `measuredAtMs` is a field of the `measured` variant
of `ChurnState`, parsed at the untrusted-shape boundary in
`app/src/architecture/churn-source.ts` and folded into the store. Swept
across `app/src`, `app/test` and `tools/e2e` at `6b0cf47`, the only
occurrences outside `churn-source.ts` are **three test fixtures** —
`app/test/map-churn.test.ts` twice and `app/test/map-t1-t2-dom.test.tsx`
once. No production reader.

Two consequences, one of them a truthfulness defect the rest of this
pane does not have:

1. **A commit made while the map is open does not move the bars.** The
   docs watcher cannot help — churn is a function of `.git`, which the
   watcher does not walk (CONVENTIONS, THE FOUR WALKS) — so there is no
   live path and no manual one either. The graph next door has
   `Re-index` **and** an `indexed … ago` hint; churn has neither.
2. **A PROJECT SWITCH KEEPS THE PREVIOUS PROJECT'S CHURN.** `MapView` is
   not remounted by a switch and contains no reference to `projectDir`
   at all (zero occurrences at `6b0cf47`), so the module-level store in
   `churn-source.ts` still holds the old repository's entries,
   attributed against the new repository's components. **Numbers from
   one repository, painted onto another's nodes, with nothing on screen
   saying so.**

## The cheap arm is the honest one, and its two halves are next door

`relativeTime(thenMs, nowMs)` and `indexHint(...)` are both exported
from `MapView.tsx` itself, and `indexHint`'s rendered output already
reads `indexed <relative> · <n> files`. The age render is that function
applied to a timestamp the store already holds.

The re-measure needs a project-switch signal, and one exists without
crossing the fence: `app/src/lib/watcher-store.ts` exports the
module-level `subscribeShell` / `getShellState` pair whose state carries
`projectDir`, so `churn-source.ts` can READ it by import. **A new prop
on `MapView` would cross the fence** — its only production caller is
`app/src/App.tsx`, which is C-05 and `app-shell`.

**THE FULL ARM IS NOT THIS CARD.** A `Re-measure` affordance beside the
overlay segment is a header-layout decision, and `T-022` (planned,
`touches: [app-shell]`) already owns overlay and viewport state for this
pane. This card renders what the payload carries and re-measures when
the project changes; it adds no button.

## Acceptance criteria

- **THE AGE THE PAYLOAD ALREADY CARRIES SHALL BE RENDERED**, beside the
  churn footer, derived from `measuredAtMs` through the same
  `relativeTime` the index hint uses. One spelling of "how old is this
  number", not a second (T-057).
- **CHURN SHALL RE-MEASURE WHEN THE OPENED PROJECT CHANGES.** After a
  switch the store SHALL NOT serve the previous repository's entries —
  not for one paint. IF the new measurement has not arrived yet THEN the
  state SHALL read as `loading`, never as the old repository's numbers
  under a new name.
- **A PIN SHALL DRIVE THE STALE-ATTRIBUTION CASE DIRECTLY**: fold a
  measured payload for project A, switch to project B, and require that
  what the pane attributes is not A's entries. **The pin SHALL fail
  today** — a criterion that cannot fail against the pre-fix tree is a
  defect (T-080-s1), so the executor SHALL record the pre-fix run of
  this body and its failure message.
- **THE AGE PIN SHALL ASSERT THE RENDERED TEXT, NOT THE FIELD.**
  `measuredAtMs` reaching the store is already true and asserting it
  again pins nothing; the property this card adds is that a reader can
  SEE it. Assert against a fixed `nowMs` so the body is not a clock
  race.
- IF `measuredAtMs` is `0` — the value the boundary substitutes for a
  shape it cannot read — THEN the pane SHALL render no age rather than
  an age computed from the epoch. A wrong timestamp is worse than none,
  and this is the branch the fixtures make cheap to drive.
- **THE SINGLE-FLIGHT AND NON-TAURI BEHAVIOURS SHALL BE UNCHANGED**: a
  second `loadChurn` while one is out still returns the same promise,
  and the browser bundle still refuses to OVERWRITE a state something
  else has folded. Both are asserted today; a re-measure trigger must
  not become a second way to stampede `repo_churn`.
- **NO `Re-measure` AFFORDANCE LANDS IN THIS CARD**, and no header
  layout moves. `T-022` owns that decision; this card SHALL name it so
  the next reader knows the omission is deliberate rather than
  forgotten.
- IF the pins this card owes cannot be written inside `[app-map]` —
  every app test file lives under `app/test/**`, which C-05's glob
  claims — THEN the executor SHALL say so in writing and route the fence
  question, never widen the fence from inside the lane (executor.md).
  **Naming which reading it acted on is the deliverable either way.**

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated (`$?`, unpiped). Note THE E2E LANE'S HONEST
SCOPE: `repo_churn` is IPC, so no browser-driven body can prove a real
measurement reached the pane; these pins drive the store and the render.
**POISON DRILL on every new assertion, one side only**, producer mutated
and never the assertion: delete the age render, delete the
project-change trigger, force `measuredAtMs` to a live value on the
zero-branch — each read back with `git diff` before its run, each
required RED, restores proved per-path by sha256 at the drill's own
commit. **The app suite needs `npm run build` before it can be drilled**
— a fresh worktree has no `app/dist` (see `T-117`). Then the shape-six
check per new body. GRAPH REGEN's trigger fires on `*.tsx/*.ts` outside
docs/ — ask `cargo run -p nputer-index -- index --check --root ../..`
from app/src-tauri rather than predicting. The DOCS GATE fires on this
card; ask `node tools/e2e/scripts/docs-gate.mjs <changed path>...`
directly, never through `xargs`. **@human: one look at whether the age
line reads as information rather than clutter** — it sits under an
overlay a user opens to compare bars, not to read timestamps.

## Implementation notes — executor `claude-opus-5`, lane `task/T-116-churn-age`

Base `5e6eb71` (the dispatch commit that wrote the ruling above; its
parent is `765924d`). Every figure below carries the ref it was measured
at. **Main moved three times while this lane built** — `b505fca` ->
`48ed848` -> `a9ed33d` — so the pre-merge range is stated at the tip it
was computed against and nothing else.

### WHICH REGISTRY READING WAS IN FORCE, asked because the ruling declared an expiry

**The ruling's reading, and it is unchanged — verified at THREE refs
rather than assumed at one.** At this lane's base `5e6eb71`, C-05's
`paths:` carries `app/test/**` with `touch_slugs: [app-shell]`, and
C-12's `paths:` is `app/src/architecture/**` + `app/src/lib/
architecture/**` with `touch_slugs: [app-map]`. Identical on `main`
at `a9ed33d`. **T-033 IS NOT MERGED** — `git merge-base --is-ancestor
task/T-033-zero-drift-registry main` exits **1** — so the expiry has not
fired on main.

**AND IT DOES NOT FIRE WHEN T-033 LANDS EITHER, which is worth stating
because the ruling anticipated the opposite.** Read at T-033's own tip
`c259f87`: it extracts **C-16 Shared primitives** out of C-05
(`app/src/components/ui/**`, `lib/utils.ts`, `lib/verdicts.ts`) and
rewrites `depends_on` across nine files — but **C-05 still claims
`app/test/**` and C-16's `touch_slugs:` is still `[app-shell]`**, so the
one clause that governs this card is untouched. C-12 keeps both globs and
`[app-map]`, losing only `C-05` from `depends_on`. **The T-034 precedent
therefore stands under both readings**, and `app/test/map-churn-age
.test.tsx` is legitimate either way.

### The fence, and a collision that was avoided rather than survived

`touches: [app-map]` was **never widened**. Three paths written:
`app/src/architecture/MapView.tsx`, `app/src/architecture/
churn-source.ts` (both C-12), and the new `app/test/map-churn-age
.test.tsx` (added, `map-` prefixed, subject is the map pane) — plus this
card and `T-116-s1`. **Zero pre-existing `app/test/**` files modified**,
which is the ruling's own checkable form and it checks.

**`app-map` WAS NOT FREE, and the dispatch brief said it was.** T-033's
card declares `touches: [docs/architecture/components/, lib-parser,
app-map, app-shell]` — this card's own fence word. Measured with the
prescribed pre-merge form (`git merge-tree --write-tree main
task/T-033-zero-drift-registry`, then `git diff --name-only main $TREE`),
T-033 owns **eight** paths inside `[app-map]`: `MapNode.tsx`,
`MapPanel.tsx`, `map-visuals.ts`, `derive.ts`, `architecture-derive
.test.ts`, `architecture-dogfood.test.ts`, `map-dogfood-render.test.tsx`,
`map-visuals.test.ts`. **None of the three files this card writes is
among them**, so the two lanes are disjoint AT FILE LEVEL and this is a
recorded near-miss rather than a breach. It is also why `T-116-s1` is
filed instead of fixed.

### What was built, criterion by criterion

**1 · THE AGE IS RENDERED.** `MapView.tsx` renders `measured
<relativeTime>` in a `map-churn-age` span beside `map-churn-footer`,
inside the `overlay === "churn"` fragment. It calls `relativeTime` — the
index hint's own exported function, in the same file — so there is one
spelling of the question and not a second. **THE PANE ALREADY HAD A
SECOND ONE AND THIS CARD PUT THEM SIDE BY SIDE**: `map-visuals.ts`'s
`churnAge` renders `last 0m ago` in the panel where the footer now says
`measured just now`. Out of reach (T-033 owns both files) and filed as
`T-116-s1` with the two intervals at which they disagree.

**2 · CHURN RE-MEASURES ON A PROJECT CHANGE.** `churn-source.ts`
subscribes to `subscribeShell` at module scope and compares
`getShellState().docs.projectDir` against the folder its answer is about.
**THE CARD'S FENCE ARGUMENT FOR THE IMPORT WAS VERIFIED RATHER THAN
TRUSTED, AND IT IS SOUND FOR A REASON THE CARD DID NOT GIVE.**
`watcher-store.ts` is **C-10's** (`docs/architecture/components/
C-10-docs-watcher.md` lists it), not C-05's — so it is not in `[app-map]`
at all. **That is not a fence question**: a fence is a WRITE
partition (the ruling above: "A fence exists so two concurrent lanes
cannot write the same file"), this lane only READS the module, and
`C-12 -> C-10` is already a DECLARED dependency in C-12's `depends_on`.
A new `MapView` prop would have been different in kind — it would have
required writing `app/src/App.tsx`, which is C-05's.

**MODULE SCOPE RATHER THAN A MOUNT EFFECT, and the difference is
measured.** The property owed is about the STORE, so a switch while the
map is closed must still invalidate. Poison **P8** arms the trigger from
`MapView`'s mount effect instead: the canvas body stays GREEN and the
unmounted body REDS, which is the mutant that proves the two bodies are
not duplicates.

**THE TRIGGER IS LAZY, AND THAT IS A CORRECTION THE SUITE FORCED.** The
first build re-measured on every project change unconditionally, and
`app/test/crescendo-dom.test.tsx` caught it: `repo_churn` joined that
suite's IPC command census on a genesis-to-board crescendo **that never
mounts the map**. That is both a behaviour change beyond this card (a
`git` subprocess on every project open, for a pane nobody opened) and a
fence collision, since `crescendo-dom.test.tsx` is not a map body. Fixed
at the source instead: the trigger returns early while the store holds no
answer and none is in flight. Full suite went 967 with one failure to
**968/968**.

**A RACE THE CARD DOES NOT MENTION, CLOSED.** `.then` cannot be
cancelled, so a `repo_churn` still out for repository A would have folded
onto B — A's entries under B's name, the exact defect, reached by timing
instead of by staleness. A `generation` counter (the shape
`watcher-store.ts` calls `startupToken`) discards an answer whose
generation has moved and lets **only the current flight** release the
single-flight latch. Poisons **P4** and **P7** red on the two halves.

**3 · THE ZERO BRANCH RENDERS NO AGE.** Guarded by `measuredAtMs > 0`,
with the positive control built from the same producer and differing in
one field. Recorded rather than smoothed over: `parseChurnPayload` maps
BOTH "field absent" and "field present but unreadable" onto `0`, and Rust
may legitimately send `0`, so the sentinel is overloaded — this card
renders nothing for all three, which is what the criterion asks.

**4 · NO `Re-measure` AFFORDANCE AND NO HEADER LAYOUT MOVE. THE OMISSION
IS DELIBERATE.** `T-022` (`status: planned`, `touches: [app-shell]`) owns
overlay and viewport state for this pane. Nothing was added to the
overlay control, the header, or the legend row's layout; the whole render
delta is one `<span>` appended inside the existing `overlay === "churn"`
fragment.

### The pre-fix RED — recorded, not asserted

Written FIRST and run against a tree with **zero production change**
(`git diff --stat -- app/src/` empty, verified before the run):
**7 failed / 3 passed, exit 1.** Messages, verbatim:

    expected 'measured' not to be 'measured'                    (canvas still shows A)
    the FIRST thing a subscriber sees after a switch: expected undefined to be 'loading'
    and a second one for B, without being asked twice: expected 1 to be 2
    A's answer must not become B's state: expected 'measured' not to be 'measured'
    expected null to be 'measured 5m ago'
    expected null to be 'measured just now'
    expected null to be 'measured 3h ago'

**THE THREE THAT PASSED PRE-FIX ARE THE `SHALL BE UNCHANGED` CLASS** —
single-flight, the browser non-overwrite, and "no git for a pane never
opened". A pin that a behaviour is UNCHANGED must be green on both sides;
that is not the `T-080-s1` defect, which is about a criterion that cannot
fail. All three are nonetheless poisoned (P10, P11, P15, P16) so none is
vacuous.

**A CORRECTION TO THIS CARD.** The criterion says of single-flight and
the browser refusal "**Both are asserted today**". At `5e6eb71` the
browser half was (indirectly, through two `map-t1-t2-dom.test.tsx` DOM
bodies) and **single-flight was not asserted anywhere**: `loadChurn` had
**zero occurrences in any test body** in the repository — the only
`app/test` hit was a COMMENT. It is asserted now, in this card's own
file, and poison **P10** proves it.

### Poison drill — 17 poisons, producer side only, all RED

Detached scratch worktree **outside the repository** at
`/Users/ujju/Projects/drill-T-116`, at this lane's own commit, built
first (`npm run build`) because six app test files read `app/dist`. Every
mutation edits a PRODUCER (`app/src/architecture/**`); the driver
**aborts rather than runs** if the anchor is not unique, if `git diff` is
empty, or if the diff reaches the assertion file — so a mutation that
never landed cannot be scored, and a two-sided mutation cannot either.
Each diff was read back before its run.

| # | mutation (producer) | RED |
|---|---|---|
| P1 | delete the age render | 3 bodies |
| P2 | delete the project-change trigger | 4 bodies |
| P3a | boundary substitutes `Date.now()` for the zero branch | zero-branch |
| P3b | render guard relaxed to `>= 0` | zero-branch |
| P4 | generation guard removed — a stale flight folds | stale-flight |
| P5 | lazy guard removed — git runs for a pane never opened | lazy |
| P6 | trigger forgets to drop the previous answer | 2 bodies |
| P7 | abandoned flight releases its successor's latch | stale-flight |
| P8 | arm the trigger from the pane's mount effect | unmounted, +2 |
| P9 | a SECOND spelling of relative time (the T-057 mutant) | just-now |
| P10 | single-flight removed | single-flight |
| P11 | browser branch OVERWRITES a folded state | 5 bodies |
| P12 | lazy guard inverted (fires only mid-flight) | asks-git-again |
| P13 | invalidates but never re-measures | 2 bodies |
| P14 | age computed from the WRONG timestamp | 5m-ago |
| P15 | browser guard removed — a served bundle spawns | non-overwrite |
| P16 | single-flight returns a different promise | single-flight |

**Restoration proved per path by sha256 at the drill's own commit**, after
every round, plus `git status --porcelain` empty:

    churn-source.ts   daae5fb1d767a40a5875620ecc841eca8b1e290d00a2cde1086e84ad06663aa8
    MapView.tsx       2c408c04a04b094f3ca4615eb81951866dc14f4b74632bd26909fdef084f6200
    map-churn-age…    472e148025b9eccb43abcf387005a3eac2563c6edc6c84446baf449a395bf0ef

**SHAPE SIX, ASKED PER BODY AND ANSWERED BY MEASUREMENT.** After the
first round FOUR bodies still killed no mutant some other body did not
also kill — which is shape six however green the file is. Rounds 2–4
exist only to settle that, and each named mutant discriminates exactly as
predicted: **P8** (unmounted body reds, canvas body green), **P13**
(asks-git-again reds, canvas and unmounted green), **P14** (`5m ago` reds,
`just now` green), **P17** (both age bodies red, zero-branch green),
**P16** (single-flight reds alone), **P15** (non-overwrite reds alone).
**All ten bodies now kill at least one mutant no other body kills.**
Shape five does not apply: no body iterates a sample set or prints a
count in place of asserting one, and three bodies pin `repo_churn`
invocation counts as cardinality.

### Suites and gates — every exit read from `$?` UNPIPED

- **`npm run build` from `app/` — exit 0.**
- **`npm test` from `app/` — 968 passed / 968, 47 files, exit 0.**
  Baseline on this tree before the change was **958/958 across 46**; the
  delta is this card's ten bodies in one new file.
- **`npx vitest run` from `lib/parser/` — 264 passed / 264, 12 files,
  exit 0.**
- **`npm test` from `tools/e2e/` — TWO RUNS, BOTH DECLARED**, because
  STATE says re-running until green proves nothing. Run 1, scratch port
  **15282**: **145 passed / 1 failed, exit 1**. Run 2, scratch port
  **15283**: **146 passed / 146, exit 0**.
  **THE FAILURE IS `T-120-s3`, IDENTIFIED BY ITS DIGITS AND NOT BY ITS
  NAME** — `tools/e2e/tests/token-scan.spec.ts:201`, `Expected:
  1787660349816.1926` / `Received: 1787660349816`: a fractional
  millisecond against a whole one, on the FIRST E2E run in a fresh
  worktree, green on the next in that same worktree. That is the
  documented signature exactly. **This lane's diff contains no
  `tools/e2e` path**, so it cannot have moved it.
- **GRAPH REGEN — FIRES** (`.ts`/`.tsx` outside `docs/`, 3 of 4 paths).
  **ASKED, NOT PREDICTED**: `cargo run -p nputer-index -- index --check
  --root ../..` from `app/src-tauri` is **exit 1, STALE**, and it is the
  REAL red and not the `--root` false red — the second line prints both
  sets of counts and a `+`/`~` file diff, which is the discriminator
  CONVENTIONS names. committed **920 597 bytes · 178 files · 1959 symbols
  · 1878 edges**; fresh **928 866 · 179 · 1978 · 1895**. Files `+1 ~2`,
  edges `+17`. **NOT REGENERATED HERE**: `docs/architecture/graph.json` is
  outside this fence and the regen is committed with the CHECKPOINT.
- **BOOT GATE — FIRES** (`app/src/**`). `NPUTER_BOOT_PORT=15281 npm run
  boot:check` from `tools/e2e/` is **exit 0**, both lines:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-116` and
  `[nputer] window "main" created`.
- **DOCS GATE — FIRES**, run DIRECTLY from the repo root with the range's
  own path list, never through `xargs`: **exit 1** (= has a verdict; the
  stderr carries a real report, not a missing-`yaml` error). 1 of 4 paths
  under `docs/`, **THREE commands owed** — `npm test from app/`, `npm test
  from tools/e2e/`, `npx vitest run from lib/parser/` — **all three run,
  and their counts are above.** 12 derived readers across 4 suites,
  census 130 sites in 22 files, **0 frontmatter issues**.

### THE PRE-MERGE RANGE

    TREE=$(git merge-tree --write-tree <main tip> HEAD)   # exit 0, a tree
    git diff --name-only <main tip> "$TREE"               -> 4 paths (code+card)

Never `main..HEAD` and never three dots. The four are `MapView.tsx`,
`churn-source.ts`, `map-churn-age.test.tsx` and this card; `T-116-s1` and
these notes make **6** at the tip. Stated against the main tip it was
computed at, because main moved three times under this lane.

### WHAT THE INTEGRATOR OWES AND THIS LANE COULD NOT DO — MEASURED, NOT FORECAST

**The checkpoint's regen moves FOUR assertions across two files, and the
exact values were derived** by regenerating in the detached drill
worktree and running both dogfood bodies there (then reverting it —
that worktree ended clean):

- `app/test/architecture-dogfood.test.ts` · `derive.fileComponent.size`
  **178 -> 179**
- `app/test/architecture-dogfood.test.ts` · findings — the D1 `C-05 ->
  C-06` evidence list gains ONE entry, in sorted position:
  `{ from: "app/test/map-churn-age.test.tsx", package: "p:@nputer/parser",
  to: "lib/parser" }`
- `app/test/architecture-dogfood.test.ts` · the relation table — THREE
  observedCounts and nothing else: `C-05 -> C-10` **38 -> 39**,
  `C-05 -> C-12` **32 -> 34**, `C-12 -> C-10` **1 -> 2**. **No relation
  flips and no row is added or removed** — the table stays 35 rows,
  14 confirmed / 12 undeclared / 9 planned.
- `app/test/map-dogfood-render.test.tsx` · the header hint
  `committed graph · 178 files` -> `179 files`

**BOTH FILES ARE OUTSIDE WHAT THIS LANE MAY WRITE** — neither for fence
reasons alone (`map-dogfood-render.test.tsx` IS a map body and the ruling
would permit it) but because **both are in T-033's eight-path set** and
T-033 is APPROVED and merges first. Reconciling them here would be a
write onto an approved diff. This is the `DECLARING A COMPONENT moves
THREE live-registry fixtures` gotcha in its two-fixture form, and the
parser pin is NOT owed: no component file changed.

**THE GRAPH'S HEADROOM MOVED AND NOTHING REPORTS IT** (STATE's standing
item 7). At **928 866 bytes** the committed ceiling `max_graph_bytes`
1 000 000 is **92.89%** used with **71 134 bytes** of headroom, against
92.06% / 79 403 at the last checkpoint. This card spends **8 269 bytes**
of it, most of that one new test file.

### Live-environment facts, read rather than trusted

Port **1420** read ONLY with `lsof -nP -iTCP:1420 -sTCP:LISTEN`: holder
`node` pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, unchanged
before and after — never bound, never connected. Scratch ports **15281**,
**15282**, **15283** each read with `lsof` first (zero rows) and free
again after. No `pkill`, no `cargo clean`, no install in
`/Users/ujju/Projects/nputer` or `/Users/ujju/Projects/nputer-app`, no
sibling lane's worktree entered.

### What I am least confident about

**The lazy guard is a judgement, not a criterion.** The card says churn
"SHALL RE-MEASURE WHEN THE OPENED PROJECT CHANGES" without qualification,
and this build declines to re-measure while the map has never been
opened. The argument is that there is then no previous answer to be stale
— which is the defect the criterion names — and that spawning `git` on
every project open for an unopened pane is a cost the card does not buy;
`crescendo-dom.test.tsx` agreed by going red. **A reader who thinks the
criterion means "always" should read this as a deliberate narrowing, not
an oversight**, and body 5 plus poisons P5 and P12 make the choice
visible rather than implicit.
