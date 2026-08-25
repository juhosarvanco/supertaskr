---
id: T-116
title: Churn is measured once per mount and never ages — the payload already carries the timestamp, the pane renders it nowhere, and a project switch keeps the previous repository's numbers
feature: F-06
milestone: 4
priority: 43
size: S
status: building
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
