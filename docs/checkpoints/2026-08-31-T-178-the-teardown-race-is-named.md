# Checkpoint: T-178 lands — the teardown race is NAMED (git's own detached maintenance), the cause removed rather than the symptom retried, and the lane's own census caught being vacuous

Date: 2026-08-31. Seat: architect/integrator. Scope: T-178 merge and
close under its own ceremony row (no verifier owed; integrator review on
the card); the capabilities census regenerated as routed; the night's
last lane.

## The mechanism, NAMED and derived four ways

The card forbade hardening against an unnamed cause, and the lane did
not. **It is the fixture's own `git commit`, not `git clone`.**

`git commit` ends by calling git's `run_auto_maintenance()`, which spawns
`git maintenance run --auto --quiet --detach`. **`--detach`
DAEMONIZES**: the foreground command reaps the intermediate and returns
while the grandchild goes on running inside the fixture's `.git`.
`refShapes()` commits twice, so it detaches twice.

Four independent measurements, each re-runnable from the card:

1. **`GIT_TRACE`** over the real fixture shows the spawn, twice; the
   positive control — the same commit with `-c maintenance.auto=false` —
   shows **zero**.
2. **`GIT_TRACE2_EVENT` at CI's own default config** shows
   `region_enter maintenance detach` and **two `exit` events from one
   session id**: git's own instrumentation of the daemonize fork. **At
   defaults, not only under amplification.**
3. **WHERE it writes, polled**: `git commit` returned at 73 ms;
   `.git/gc.pid` appeared at +108 ms; `tmp_pack_*` at +207 ms; the pack
   trio at +529 ms; `objects/info/commit-graph` and `objects/info/packs`
   at +596–627 ms. **A background git process outlived the foreground
   commit by ~490 ms, writing into exactly the two directories the two
   CI errors named.**
4. **The defaults-path writer identified by elimination**:
   `$GIT_DIR/objects/maintenance.lock`, held → 0 packs; every other
   candidate held → 1 pack.

**A bonus symptom, same cause**: an amplified run died with
`fatal: hardlink different from source at '…/detached/.git/objects/pack/tmp_pack_…'`
— the clone hardlinking `local/.git/objects/pack/` while the detached
child rewrote it. One mechanism, two faces.

## THE REPRODUCTION IS HONEST, AND THAT IS WHY THE CARD IS SATISFIED

**The ENOTEMPTY symptom did NOT reproduce here** — zero hits across
**200 build-and-teardown cycles** in six arms, including 3× CPU
oversubscription. Both CI sightings are Linux; this host is macOS/APFS,
and the lane says so rather than claiming a fix it could not see work.

What it ruled out by measurement, which is what makes the negative worth
something: not `git clone` spawning maintenance (traced: none); not
`git init`/`git add` (neither calls `run_auto_maintenance`); not gc
*packing* at CI's config (`objects/17` holds 6–7 against a threshold of
27, so gc declines — **the process starts, it just does not pack**); and
not Node's `rmSync` losing to a racing writer in general, since on
node v22 the recursive removal re-reads and re-removes.

**The card's own words were "I could not reproduce it" is NOT the
finding — it has to read what holds a handle and show the mechanism."**
It did.

## What landed, and the two halves are not alternatives

`tools/e2e/tests/git-fixture.ts`:

- **`NO_BACKGROUND_MAINTENANCE`** (`-c maintenance.auto=false`) removes
  the CAUSE — git spawns nothing to race. **`gc.auto=0` is deliberately
  NOT used**: it lets the process start and only declines to pack, which
  is the difference between preventing a race and narrowing it.
- **`removeGitFixture()`** bounds a retry at **750 ms** with its reason
  written beside it, and **a removal that still cannot finish NEVER
  THROWS** — it returns a finding naming the fixture, the tree, the cause
  and *"NOT A FAILURE OF THE BODY IT FOLLOWS"*. That is the card's third
  criterion, and it is the one that would have saved two sessions
  twenty minutes each.

## The sweep was not empty, and found two the card never named

Class: an `rmSync` teardown over a git-built directory; the
mechanism-carrying subset commits. Searches shown capable of failing
first. **`card-preflight.spec.ts` and `lane-fence.spec.ts` carry the same
shape and neither is named on the card** — both fixed.
`docs-input-gate.spec.ts` is in class without the trigger and was
protected anyway for uniformity. Outside the fence,
`app/src-tauri/src/churn.rs` has the shape but discards its teardown
error (`let _ = fs::remove_dir_all`), so it cannot red a body —
recorded, judged not worth a card.

## THE DRILL CAUGHT THE LANE'S OWN CENSUS BEING VACUOUS

Six mutants; **D5 SURVIVED**. The lane's new census — the body that
turns the sweep into a standing check — asserted the fixture module's
NAME, and an unused `import` line satisfied it. **A vacuous assertion in
the very body written to stop the class from regrowing**, caught only
because the mutant was run rather than the assertion trusted. Repaired
in its own commit (`d5dc33c`): the pins are now the spread and the call.
Restoration sha256-proved on all six.

## Gates

- `index --check` — **CURRENT**, 1,141,994 of 2,145,959 (53.2%),
  1,003,965 left. GRAPH REGEN fires by the letter (six `.ts` outside
  docs/) and is a measured no-op: `tools/e2e` is outside the walk.
- `cargo test` — **256 passed, exit 0**, lib suite 7.90s
- `npx vitest run` from lib/parser — **344 passed, exit 0**
- `npm test` from app/ — **1077 passed, exit 0**
- `npm test` from tools/e2e — **339 passed, exit 0** (+4, this lane's)
- `typecheck` / `lint:tokens` / `lint:docs` — **0 / 0 / 0**
- **`capabilities:check` — 0 CURRENT (27,138 bytes)**, regenerated at
  this checkpoint as the lane routed: four new test names went in, the
  census is a CI step since `T-153-s8`, and it would have redded CI
  otherwise. **The keeper landed and immediately did its job.**
- **HEALTH — 10 inside, 0 drifting, 0 BREACHED, 0 unread, 4 UNKEPT**,
  exit 3 by design.
- **BOOT GATE — not owed** (0 paths under `app/src/**`,
  `app/src-tauri/**` or a manifest). **METHOD EVAL — not owed.**

## Ceremony, and a brief defect worth carrying

Every path is `tools/e2e`, which reaches no `KIT_FILES` entry and no
shipped slug, so TASK-FORMAT's row is *S, diff outside shipped code*: **no
verifier owed**, and the executor flagged that its `verifying` stamp came
from the dispatch rather than the table. Closed `done` with this review
in a verdict's place.

**A DEFECT IN THIS SEAT'S OWN DISPATCH SUMMARY, reported by the lane:**
it said `npm ci` from tools/e2e was enough to run the suite. It is not —
`assertLanePreconditions` refuses a worktree without `app/node_modules`,
because the e2e webServer runs the app's vite. **The brief's own ROW 6
carried the full ADR-011 order and the dispatch summary contradicted
it**, which is the same class as quoting a report above a blind line: a
summary written from memory beside a derivation written from the tree.

## Board

`T-178` done. **EIGHT LANES LANDED overnight** — `T-140-s4`,
`T-112-s3`, `T-177`, `T-172`, `T-153-s8`, `T-112-s1`, `T-171`, `T-178` —
plus one standing triage sitting. **No task branches remain.**

## Owed after this record

- The queue is in `2026-08-31-T-171-the-interview-gets-an-ending.md`'s
  own board section; `T-126-s2`'s ruling is the item that unblocks the
  most.
- **@human, untouched overnight as asked**: the FORM question (reopened),
  the steering split, the three permission questions, and thirty seconds
  of an eye on the interview's new ending at a narrow width.
