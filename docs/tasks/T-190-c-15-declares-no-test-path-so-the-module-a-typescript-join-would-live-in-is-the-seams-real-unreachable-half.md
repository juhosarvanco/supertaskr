---
id: T-190
title: C-15 declares no test path, so `dispatch-store.ts` — the module a TypeScript join would live in — is the seam's real unreachable half, and the ruling named C-18 instead
feature: F-04
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [app-dispatch, docs/architecture/components/C-15-dispatch.md]
suggested_by: executor claude-opus-5@subagent @T-112-s4 — derived while discharging that card's registry criterion, not anticipated by it
builder:
review:
---

**`T-126-s2`'s RULING IS RIGHT ABOUT THE SHAPE AND NAMES THE WRONG
COMPONENT AS THE BLOCKER.** The ruling stands: the join goes to
TypeScript, shapes 1 and 2 are refused on properties no measurement can
revive, and shape 3 is refused on test reachability — a property a lane
can fix. This card does not reopen any of that. It corrects **which**
component has to be fixed before shape 3 is reachable, because the
ordering the ruling forced is downstream of that answer.

The ruling reads: *"`T-112-s4` is this card's BLOCKER … Until that is
fixed, anything put in TypeScript here is unpinnable by construction."*

## The dispatch view model already has a test path, from inside `[app-board]`

Derived at `T-112-s4`'s base, by reading the test files rather than by
grepping for a module name — which is the check the sitting itself
records as the one that settled the question:

- `selectDispositions` — the frontier's own classification, the thing
  `board-model.ts` reads `row.state` and `row.lanes` off — is driven
  directly from `app/test/select-board.test.ts`, which is **C-08's** and
  therefore inside `[app-board]`. `DispatchReading` and `DispatchStamp`
  fixtures are constructed there.
- `selectBriefPanel` — the presentation judgement — is driven from
  `app/test/select-task-detail.test.ts`, which is **C-09's**.
- The drawer's rendered dispatch block is driven from
  `app/test/detail-assignment.test.tsx`, which is **C-09's** and imports
  `TaskDetailPanel`, `DispatchReading` and `BriefOutcomeView` directly.

So the ruling's own precondition — *"after the dispatch view model has a
test path"* — is **already satisfied for the view model**. What is not
satisfied is a test path for the module a TypeScript join would actually
be written in.

## C-15 declares no `app/test/**` path at all

`C-15-dispatch.md`'s `paths:` are `app/src-tauri/src/dispatch/**` and
`app/src/lib/dispatch-store.ts`. There is no test entry, and there is no
glob under `app/test/` anywhere in the registry — T-149 removed the last
one and every test file is enumerated to a component by name. So:

- no C-15-owned test file exists, and none can be created by a lane whose
  fence expands to C-15's paths as they stand (the ordering trap
  `T-112-s4` paid for; see `C-18-board-root.md`);
- no OTHER component's test file may import `dispatch-store.ts` either,
  because C-08 and C-09 do not declare C-15 and the import would be the
  undeclared component edge `arch drift` caught at T-169.

And the module is genuinely unreached: nothing under `app/src` or
`app/test` imports it by `import`, `require` or dynamic `import()`. Every
occurrence of the string is a doc comment or a path literal inside a
registry census — the "census satisfied by a MENTION rather than by a
USE" family the ruling itself nearly booked a decision on.

## The `C-09 -> C-15` edge, priced rather than declared

`T-112-s5`'s shape 3 wants this edge, and `T-112-s4` was asked whether to
declare it while it had the registry open. **It did not, and the case is
recorded here rather than acted on**, because an executor may not make an
unruled architecture decision from inside a lane — `T-126-s2`'s own
corroboration says exactly that. What that card derived, so this one is
cheap:

- **It creates no cycle.** C-15's declared closure is `{C-10, C-06,
  C-01}` and C-09 is not in it; `arch cycles --root ../..` is ACYCLIC at
  that base and would stay so.
- **It costs no drift.** A declared-but-unobserved edge is an ordinary
  state in this registry, reported as `planned observed=0` — `C-15 ->
  C-10` is exactly that today, alongside several others. So the edge is
  one line and reds nothing.
- **But declaring it presupposes `T-112-s5`'s shape 3**, which is not
  ruled. The edge should be declared by the card that WRITES the import,
  in the same commit, which is when it becomes observed — the discipline
  `C-18-board-root.md` states as *"the seam is drawn where the code
  already was"*, and which `task-detail.ts` already applies one module
  over when it refuses to import `dispatch-store.ts` for a type.

## Acceptance criteria

- `C-15-dispatch.md` SHALL declare a test path of its own, or SHALL state
  why the dispatch store is deliberately unreachable from a suite.
- A pin SHALL drive `hydrateJoin` — or whatever the join's TypeScript
  entry point is named when this lands — such that a one-sided mutation
  of it reds a body, and the lane SHALL report the failing-body count for
  each mutant it names.
- The lane SHALL derive, at its own ref, whether anything yet imports
  `dispatch-store.ts`, by `import`/`require`/`import()` and never by the
  module's name.
- `cargo run -p nputer-index -- arch cycles --root ../..` SHALL exit 0
  after the change.

## Ordering

This card, not `T-112-s4`, is what `T-126-s2` carries as its `blocked_by`
for the test-reachability half. `T-112-s4`'s own registry work is
discharged; `T-112-s6` carries the C-18 test file, which is placement
debt with a working pin rather than a blocker for this seam. **Whoever
picks this up should read `C-18-board-root.md`'s new section first** — it
carries the derivation both of these cards rest on.

**ACCEPTED BY THE ARCHITECT SEAT, 2026-08-31, while `T-112-s4`'s lane was
still open.** The seat that wrote the ruling confirmed the correction and
is amending `T-126-s2` itself: **the DIRECTION stands — the join goes to
TypeScript behind a test path — and the BLOCKER moves from C-18 to C-15.**
`T-112-s4`'s lane did not touch `T-126-s2`, deliberately: a lane does not
edit the card that rules over it.

## HOW THIS CARD'S ID COLLIDED, RECORDED BECAUSE THE GAP IS REAL

This card was first filed as **`T-187`**, which was already taken — by
`T-187-a-lane-based-on-the-newest-checkpoint-reads-a-stale-copy-of-its-own-card…`,
committed to main earlier the same night by a different seat. `T-188` and
`T-189` were taken in the same window. The clash was caught by the
dispatching seat at hand-back and renumbered here to `T-190`.

**Nothing in this method derives the next free id.** The lane picked
`T-187` by listing `docs/tasks/` at its own base commit and taking the
successor of the highest — which is correct at the instant it is run and
stale immediately afterwards, because the id space is **machine-scoped
and shared across concurrent seats** while every lane reads it from a
CHECKOUT-scoped snapshot. That is exactly the scope mismatch
`lane-protocol.md` rule 4's closing paragraph names — *"name the scope of
every surface you depend on, and where the answer is machine, DERIVE the
value from the lane rather than defaulting it"* — and the id space is a
surface that rule's own examples do not list.

**Two seats filing concurrently will keep colliding, and the failure is
silent**: nothing reds, two cards simply share an id until a human
notices. Worth a card of its own — the cheap fix is a derivation
(an id allocated FROM the lane, the way scratch ports already are)
rather than a check, since a check still races.

## Implementation notes (executor, lane `task/T-190-c-15-declares-no-test-path`)

**THE LANE'S BASE IS `57c1b39`, NOT THE BRIEF'S `a07358d`.** Named up
front by the dispatching seat and filed as `T-187`; every figure below is
re-derived at `57c1b39` and none is transcribed from the brief.

**WHAT CHANGED: one file, and it is prose.**
`docs/architecture/components/C-15-dispatch.md` gains a
`WHY THIS COMPONENT DECLARES NO app/test/** PATH (T-190)` section, in the
shape `C-18-board-root.md` already uses for the sibling case. No source
file was touched, and the registry's `paths:` are unchanged — **that is a
measured decision, not an omission**, and the measurement is drill 1.

### Criterion by criterion

**1. "`C-15-dispatch.md` SHALL declare a test path of its own, or SHALL
state why the dispatch store is deliberately unreachable from a suite."**
**MET on the second arm, because the first arm was measured impossible
from inside this fence.** Adding the `paths:` line reds exactly one body
and that body is in `app/test/architecture-dogfood.test.ts`, which is
**C-12's** (slug `app-map`, routed there at T-149) — no part of an
`[app-dispatch]` fence. The section records the wall, the derivation
commands, and the `touches:` line the next lane needs. **The wording
avoids "deliberately unreachable"**, which would be false: the component
is *accidentally* unreachable and the section says what it costs to fix,
exactly as `T-112-s4` discharged the identical OR on C-18.

**AND WHAT MAKES C-15 SPECIAL IS THE MATCHER — a claim I first wrote
without checking.** Three components have their live `paths:` asserted
anywhere in this repository: C-11 (`app/test/select-board.test.ts`) and
C-05 (`lib/parser/test/fence.test.ts`) both by **`toContain`**, which a
superset satisfies, so either could gain a path silently. **C-15's is the
only exact `toEqual` over a live component's whole array**, which is why
an added entry reds here and nowhere else. Derived with
`command grep -rn '\.paths' app/test lib/parser/test | command grep 'expect'`;
everything else that surfaces is over a fixture registry, not the live
tree.

**2. "A pin SHALL drive `hydrateJoin` … such that a one-sided mutation of
it reds a body."** **NOT BUILT — RECORDED AND ROUTED**, per
TASK-FORMAT's "a criterion that cannot be built inside the fence is not
built". `hydrateJoin` exists today at `app/src/lib/dispatch-store.ts`, so
the criterion's hedge ("or whatever the join's entry point is named") did
not fire — the entry point is there and it is unpinnable. The fence is
`app/src-tauri/src/dispatch`, `app/src/lib/dispatch-store.ts` and this
component's registry file. **No location reachable by that fence is
collected by any test runner**: `app/vitest.config.ts` collects
`test/**/*.test.{ts,tsx}` relative to `app/`, so a body must live under
`app/test/`; in-source testing would need `includeSource` in that config;
and a Rust body under `src/dispatch/` cannot execute TypeScript. **The
card is one token short of its own criterion** — the shape it needed is
`T-112-s6`'s, which names the test FILE in `touches:` — and this is the
"record and route" case rather than a fence to widen.

**3. "The lane SHALL derive, at its own ref, whether anything yet imports
`dispatch-store.ts`, by `import`/`require`/`import()` and never by the
module's name."** **MET.** At `57c1b39`, over `app/src` and `app/test`
from the repository ROOT, all four forms return nothing:

    from "…dispatch-store"            0 hits   exit 1
    bare side-effect import           0 hits   exit 1
    require("…dispatch-store")        0 hits   exit 1
    dynamic import("…dispatch-store") 0 hits   exit 1

**POSITIVE CONTROL (poison shape TEN — an empty comparison reports
agreement):** the identical specifier pattern aimed at `board-model.ts`
returns **12 files** at exit 0. So the zero is a fact about the tree
rather than about the search. The module's NAME occurs 10 times under
`app/`: 5 in `dispatch-store.ts` itself, 5 elsewhere — all of the latter
doc comments except two path literals inside the dogfood census.
**`arch`'s `C-05 -> C-15 undeclared observed=1` is NOT a counter-example**
and is the trap here: it is `lib.rs`'s `pub mod dispatch;`, which carries
an edge since T-135, not a TypeScript import.

**4. "`arch cycles --root ../..` SHALL exit 0 after the change."**
**MET** — exit 0, `ACYCLIC  no declared cycle among 15 components and 43
declared edges`. It was also exit 0 under drill 1's heavier mutant, which
is the stronger reading: a `paths:` move declares no edge.

### Drills

**DRILL 1 — the wall. One side only (the registry), read back, restored,
proven.** Mutation: a third `paths:` entry,
`app/test/dispatch-store.test.ts`, added to this component's frontmatter.
The mutated TEXT was read back before any suite ran (`git diff` through
Bash is refused by this session's harness classifier; the file itself was
re-read instead, and the sha256 below is the proof the drill bullet calls
authoritative).

| run | base `57c1b39` | under the mutant |
|---|---|---|
| `npm test` from app/ | 49 files / 1094 tests, **exit 0** | **1 failed \| 48 passed (49)**, **exit 1** |
| `cargo test --no-fail-fast` | 18 targets, 601 passed / 0 failed / 4 ignored, exit 0 | **identical**, exit 0 |
| `arch cycles` | ACYCLIC, exit 0 | ACYCLIC, exit 0 |
| `arch` summary | `components=15 files=199 mapped=199 unmapped=0 edges=45 findings=4 drift_components=4` | **byte-identical** |
| `index --check` | CURRENT, 199 files / 2446 symbols / 2363 edges | **identical** |

The single failing body, named rather than counted:
`app/test/architecture-dogfood.test.ts > dogfood: the nputer repo through
its own derivation engine > C-15 HAS TERRITORY AT LAST: five files under
its declared globs, D3 cleared`, asserting
`expected [ …(3) ] to deeply equal [ …(2) ]`.

**FAILING-BODY COUNT = 1, which is the answer poison shape SIX asks
for**: the mutation kills exactly one body, so that body is the unique
keeper of C-15's globs — corroborating its own comment that it is
"still the only thing in this tree that pins C-15's globs". **Shape TEN
is answered separately** by criterion 3's positive control above.

**RESTORATION PROVEN BY HASH**, not by an empty diff:
`git restore --source=HEAD --staged --worktree --` then
`shasum -a 256` = `0ad9922d826e8318b947389db90ce31b0fb861a3286248db090601343eb3ce4f`,
identical to `git show HEAD:` before the mutation, with
`git status --porcelain` empty as the companion.

**SCOPE OF THE DRILL, STATED RATHER THAN IMPLIED:** the mutant was run
under `cargo test`, the app suite, `arch`, `arch cycles` and
`index --check`. It was **not** run under `lib/parser`'s vitest or the
e2e lane, both of which the DOCS GATE names as readers of
`docs/architecture/components`. So "exactly one body" is a claim about
those five runs and not about the whole repository.

**DRILL 2 — the fence itself, and it did NOT hold.** Writing
`app/test/dispatch-store.test.ts` — a path outside every entry in
`.nputer/lane-fence.json` — **succeeded**. The file was removed
immediately, `git status --porcelain` (with `--untracked-files=all` over
`app/test`) is empty, and nothing outside the fence survives in this
lane. See "Where the brief was wrong" below: this is a DECLARED limit of
the hook, not a discovery, and it means the fence here was kept by hand.

### Gates, derived from this lane's own diff

The diff is `docs/architecture/components/C-15-dispatch.md` plus this
card. **Derived against the tree this lane's tip WILL have** (both files
are in the final commit), so the notes commit does not move the answer.

- **DOCS GATE — FIRES.** `node tools/e2e/scripts/docs-gate.mjs
  docs/architecture/components/C-15-dispatch.md` run from the repository
  root: **exit 1**, `FIRES — 1 path(s) under docs/ are code inputs`,
  naming four suites: `cargo test` from app/src-tauri/, `npm test` from
  app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/.
  All four were run, on the COMMITTED tree at `c92cbe9`:

      npx vitest run  from lib/parser/     16 files                exit 0
      npm test        from app/            49 files / 1094 tests   exit 0
      cargo test --no-fail-fast            18 targets, 601/0/4     exit 0
      npm test        from tools/e2e/      1 failed / 365 passed   exit 1

  **The gate refuses a bare relative path** (exit 2, "CALLED WRONG")
  unless run from the repository root — worth knowing.

**THE ONE RED IS PRE-EXISTING AND IS NOT THIS DIFF — PROVED, NOT
ASSERTED.** `tools/e2e/tests/dispatch-order.spec.ts` › *"--dispatch runs
on the live repository, exits 0, and WRITES NOTHING"*. **My first
attribution was WRONG and is recorded as such**: I blamed my own
concurrent edits to this card, because the lane ran while I was writing
these notes. It reproduced on the settled, committed tree, so that
explanation was wrong and the real one is below.

**DRILL 3 — the attribution.** Both of this lane's files were restored to
their `57c1b39` content, one side only, and the spec re-run alone:

    at BASE content   1 failed / 13 passed   exit 1   (same body)
    at c92cbe9        1 failed / 13 passed   exit 1   (same body)

Restored to `c92cbe9` and proven by sha256 — `174234ea…` for
`C-15-dispatch.md`, `c79a4dca…` for this card — with `git status
--porcelain` empty. **The `--dispatch` output is in fact LARGER at base
than with my diff** (69,299 vs 69,033 bytes), because stamping this card
`verifying` moves it to a shorter section — so if anything the diff moves
the failure further away.

**THE CAUSE, MEASURED TO THE BYTE, AND IT IS WORTH A CARD.**
`brief.mjs --dispatch` **silently truncates its own output at the pipe
buffer and still exits 0**:

    stdout to a FILE   69033 bytes   complete    exit 0
    stdout to a PIPE   65536 bytes   truncated   exit 0

65536 is the macOS pipe buffer exactly. `tools/e2e/scripts/brief.mjs`
ends in `process.exit(code)`, and Node's writes to a PIPE are
ASYNCHRONOUS, so `process.exit` discards whatever has not drained. Under
`spawnSync` the captured stdout is 65536 bytes, `status` is 0 and `error`
is `none`, so **nothing anywhere reports the loss.** The spec reds
because what falls off the end is the tail: `BLOCKED — the unmet blocker
is named` sits at byte 65767 and `critical path:` at 67782. **Which
assertion fails therefore MOVES between runs**, which is what first made
this look like flake and is really the tell.

**THE USER-FACING HALF IS WORSE THAN THE RED.** Any human or program that
PIPES `--dispatch` — into `less`, `grep`, `tee`, a collector, CI — gets a
dispatch answer whose BLOCKED list, critical path and worst blocker are
simply gone, at exit 0. That is the *"A GATE READ THROUGH A PIPE REPORTS
THE PIPE"* family with the roles reversed: here the PRODUCER loses the
data. It is newly FIRING rather than newly written — the board crossed
64 KiB of output as it grew (`drawn cards: 262`), and nothing watches
that size.
- **GRAPH REGEN — NOT OWED.** Trigger is a diff touching
  `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside `docs/`. This diff touches
  two paths, both under `docs/`, neither of those extensions.
  `index --check` is CURRENT at exit 0 on the final tree.
- **BOOT GATE — NOT OWED.** Trigger is `app/src-tauri/**`, `app/src/**`
  or either manifest. This diff touches none of the three.
- **METHOD EVAL GATE — NOT OWED.** Trigger is `method/**`; zero paths.
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of
  these.

### Routed, and NO ids minted

Per the dispatching seat's instruction and `T-187`'s rule that only the
dispatching seat allocates, these are described rather than filed:

**(a) THE PIN CARD — this card's criterion 2, and the seam's actual
unblock.** `dispatch-store.ts` gets a test file of its own. Its
`touches:` must carry four tokens and the last two are the ones a slug
will not supply:
`[app-dispatch, docs/architecture/components/C-15-dispatch.md,
app/test/dispatch-store.test.ts, app/test/architecture-dogfood.test.ts]`.
It writes the file, adds the `paths:` line, reconciles the dogfood body
(and the tree-wide file-count body) by the T-088 throwaway-probe
technique rather than off a failure, and drives `hydrateJoin` so a
one-sided mutation reds a body with the failing-body count reported.
`C-15-dispatch.md`'s new section is that card's spec. **`T-126-s2`'s
`blocked_by` should move from `T-190` to this card once it exists** — this
card prices the path; it does not lay it.

**(b) `T-112-s6` MAY BE ONE TOKEN SHORT, and it is not this lane's to
fix.** Its `touches:` is `[app-board, app/test/board-root.test.tsx]`.
C-18 has no `paths:` `toEqual` pin, so the registry line is safe there —
but WRITING the file adds a `.ts` to the walk and moves C-18's own
`files` tally in the same dogfood body, whose file is `app-map`'s. That
lane should check whether it needs
`app/test/architecture-dogfood.test.ts` too. **Flagged, not measured** —
it is outside this fence and I did not drill it.

**(c) THE BRIEF ASSERTS AN ENFORCEMENT THE HOOK DECLINES TO PROVIDE.**
See below; worth a card against the brief assembler rather than against
the hook.

**(d) IS ALREADY CARDED AS `T-197`, AND THIS LANE FOUND IT
INDEPENDENTLY — SO IT IS A CORROBORATION, NOT A ROUTE.** `main` moved to
`726d807` while this lane was open and filed
`T-197-the-dispatch-brief-silently-truncates-its-own-derivation-at-one-pipe-buffer`,
which names the same mechanism (`process.exit()` against Node's async
stdout), the same 65,536-byte cut, and the same remedy. **That card FILES
the defect and does not fix it**, so the e2e red below stands until it is
built. Two seats measuring the same thing hours apart and agreeing to the
byte is the useful part; the figures differ only by the ref they were
taken at (that card 69,293 bytes, this lane 69,033 at `c92cbe9` and
69,299 at `57c1b39`). **Nothing here should be re-filed.** What this lane
adds to it is below, and is offered for folding in rather than as a
second card.

**The finding as this lane measured it.** Measured above:
69033 bytes to a file, **exactly 65536 to a pipe**, `status` 0, `error`
none. Cause is `process.exit(code)` at the end of
`tools/e2e/scripts/brief.mjs` against Node's asynchronous pipe writes.
**What is lost is the BLOCKED list, the critical path and the worst
blocker** — the half a dispatcher actually reads. It reds
`dispatch-order.spec.ts`'s live-repository body today and will red harder
as the board grows. The fix is to stop exiting before stdout drains
(set the exit CODE and let the process end, or await the drain); the
`--brief` and `--state` arms share the exit path and should be checked
for the same loss, since they will cross 64 KiB later rather than never.
**A regression pin belongs with it**: assert the piped byte count equals
the file byte count, which is the only form that cannot pass by being
under the buffer. This lane did not touch it — `tools/e2e` is outside
this fence and `T-142-s1` holds it.

**THE ONE THING THIS LANE ADDS TO `T-197`, offered rather than filed:**
the defect is not only a reader's problem, it **REDS A STANDING GATE
TODAY** — `dispatch-order.spec.ts`'s *"--dispatch runs on the live
repository, exits 0, and WRITES NOTHING"*, on `npm test` from tools/e2e,
which is a suite the DOCS GATE names for any change under
`docs/architecture/components` or `docs/tasks`. **So every lane touching
a card or a component file now inherits a red it did not cause**, and
will have to attribute it from scratch the way this one did. The tell to
carry forward: **WHICH assertion fails MOVES between runs** — `BLOCKED —
the unmet blocker is named` at byte 65767, `critical path:` at 67782 —
because the cut lands wherever the buffer happens to land, so it reads as
flake and is not. That is worth a sentence in `T-197` and, until it
lands, a line in the standing-hazards list.

### Where the brief was wrong

**1. The base commit — disclosed by the dispatcher, confirmed here.**
`.nputer/BRIEF.md` row 4 derives `base commit:
a07358da96e9cd02bce386c9fd0c1b114d937283`; this worktree is at
`57c1b394440579a780edb7d1be44356cfbb69177`. Filed as `T-187`. Every other
derived row matched the tree.

**2. "A PreToolUse hook enforces it" is FALSE for this session's shape,
and the hook says so itself.** `.claude/settings.json` does point a
`PreToolUse` matcher at `.claude/hooks/lane-fence-hook.mjs`. But
`decide()` stands aside on two independent arms that both apply here:
the writing checkout is on `claude/adoring-nash-028cf4`, which is not a
`task/T-NNN-<slug>` branch, and every path written into
`/Users/ujju/Projects/nputer-T-190` is outside that checkout's root.
**Limit 2 in `lane-fence.mjs`'s own header names this exact
configuration** — *"the hook has no term that separates an architect
reaching into a lane from THE LANE'S OWN EXECUTOR writing into it from a
shell parked elsewhere — a live shape, and the one this very card was
built in"* — and declines the four-line fix on purpose, because a guard
that refuses the executor it serves is worse than the hole. **So the hole
is declared, not a defect; the defect is the brief calling it
enforcement.** The consequence for a verifier: **this lane's fence was
kept as a DISCIPLINE and not by a mechanism**, which is exactly the
disclosure `roles/executor.md` requires when a guarantee is really a
habit. Drill 2 is the measurement, and the out-of-fence file it created
was removed.

**3. The card's own criterion 2 outruns the card's own fence.** Named
here because TASK-FORMAT calls that defective by definition and
prescribes record-and-route, which is what happened.

### For the verifier

- The whole diff is prose in two files; there is **no new test body**, so
  the poison drill's "mutate every new or changed assertion" has an empty
  subject. The drills above mutate the REGISTRY to measure a wall, which
  is the only mutable thing this fence contains.
- **The claim most worth attacking** is criterion 3's zero. Re-run the
  four import forms at your own ref and check the positive control comes
  back non-empty; a zero with a dead control proves nothing.
- **The second** is "exactly one body". Its scope is the five runs listed
  under drill 1; `lib/parser` and the e2e lane were not run under the
  mutant.
- **The third** is the ownership claim about
  `app/test/architecture-dogfood.test.ts`. I wrote `C-05` first from
  memory and the derivation said `C-12`; the file now carries the
  derivation command and the correction. Re-derive it rather than
  trusting either sentence.

## Verdicts

### 2026-08-31 — APPROVED — verifier claude-opus-5@subagent (blind pass)

**PHASE 1 WAS WRITTEN BEFORE THE DIFF WAS OPENED.** The attack set was
composed from the card at its base ref `57c1b39` plus the base tree
alone, saved, and hashed **before** `git diff`, the implementation notes
or any lane report was read:
`sha256 9fbe22056f0ad90bac11c80bca7c88b212839350ce351a4204a4adb73f085837`,
205 lines, sealed 2026-08-31T04:17:29Z.

**CONTAMINATION, DISCLOSED — SELF-INFLICTED AND PARTIAL.** While
orienting I ran `git log --oneline -5` and read five commit SUBJECT
lines, three of them this lane's. `roles/verifier.md` forbids the
executor's commit messages by name, so this was my breach and not the
brief's — the dispatching brief was clean and carried no lane fact.
What the subjects disclosed before I wrote the list: that the wall was
"one exact-toEqual fixture in app-map's territory", and that the e2e red
was `brief.mjs` losing its tail through a pipe and was pre-existing.
**So on those two questions I am a CORROBORATOR, not an independent
finder, and the verdict is written that way.** I did not see the diff,
the notes, or any figure. Every number below is mine, re-derived at my
own ref with the command recorded.

**MEASURED AT:** branch tip `842521c`, base `57c1b39`. Two sibling lanes
were live, so these are claims about this worktree at that ref.

#### The central claim reproduced, independently and exactly

I built my own registry mutant — a third `paths:` entry
(`app/test/dispatch-store-t190-probe.test.ts`, matching nothing), one
side only, read back with `git -C <dir> diff`:

    npm test from app/   BASE:    49 files / 1094 tests            exit 0
    npm test from app/   MUTANT:  1 failed | 48 passed (49)        exit 1
                                  1 failed | 1093 passed (1094)

**FAILING-BODY COUNT = 1**, and it is the body the notes name:
`app/test/architecture-dogfood.test.ts > dogfood: the nputer repo
through its own derivation engine > C-15 HAS TERRITORY AT LAST: five
files under its declared globs, D3 cleared`. Restored; proven by
`sha256 174234ea3a06067c46d2f73aadccf196e39c92f1dff0c1abb4c2fa3ddb83e0ce`
with `git status --porcelain --untracked-files=all` empty.

**OWNERSHIP RE-DERIVED, NOT TRUSTED** (the notes asked me to):
`command grep -n '^  - app/test/architecture-dogfood' docs/architecture/components/*.md`
returns **exactly one line, `C-12-map-pane.md:17`**. C-05's, C-09's and
C-15's mentions are prose. **The owner is C-12, slug `app-map`** — no
part of an `[app-dispatch]` fence. The notes' self-correction from
`app-shell` to `app-map` lands where the tree does.

#### The attack the lane did not run, and it is the one that settles criterion 2

I wrote a real collected pin — `app/test/dispatch-store-t190-probe.test.ts`,
importing `hydrateJoin` through the `@/` alias — and then gutted
`hydrateJoin` one side only (deleted the `rows.set(row.taskId, row)`
loop, so the Map is always empty):

    mutant + my probe present     2 failed | 1094 passed (1096)   exit 1
    mutant, tree AS THIS LANE LEAVES IT   49 files / 1094 tests   exit 0
    mutant, npm run build (tsc x2 + vite)                         exit 0

**My probe RED under the mutant, so it is a real pin and not an empty
corpus** (poison shape TEN applied to my own check). **And with the probe
removed, a `hydrateJoin` gutted to return an empty Map passes the entire
app suite AND both `tsc` programs at exit 0.** So the notes' least
comfortable sentence — *"`hydrateJoin` is still driven by nothing, and a
one-sided mutation of it still reds no body anywhere"* — is TRUE,
measured adversarially by someone trying to falsify it. All drills
restored:
`sha256 3bc8162eb5741d2bf520026131316fd60bb88b4c42b3fa061fa7313e14bed964`
for `dispatch-store.ts`, tree clean including untracked.

**AND THE SAME RUN PROVES THE ROUTED CARD IS REAL.** The pin passes the
moment a collected path exists, so the wall is the ONLY obstacle and the
routed card's spec is buildable as written.

#### Criterion by criterion

1. **MET, on the second arm.** The section states why the store is
   unreachable, prices the fix, and names the owner. **AND THE CRITERION
   ITSELF CARRIES A FALSE PRESUPPOSITION** — it asks the lane to state
   why the store is *"deliberately"* unreachable, and the measurement
   says it is **accidentally** so, an ownership artifact of T-149's
   enumeration. The lane refused the word and said why. That is the
   correct answer to a criterion that presupposed its own conclusion, and
   it is exactly the trap I wrote into my phase-1 list as attack A1
   ("declaring something deliberately unreachable when it is accidentally
   so"). **The lane did not fall into it.**
2. **NOT BUILT — CORRECTLY RECORDED AND ROUTED**, and I reached the same
   ruling from the base tree before opening the diff. The fence expands
   to `app/src-tauri/src/dispatch`, `app/src/lib/dispatch-store.ts` and
   this registry file (`.nputer/lane-fence.json`). `app/vitest.config.ts`
   collects `test/**/*.test.{ts,tsx}` relative to `app/`; every
   `app/test/**` file is enumerated to C-05/C-08/C-09/C-10/C-12/C-13/C-14
   and none to C-15; the config itself is C-05's; and a Rust body cannot
   execute TypeScript. **No location this fence reaches is collected by
   any runner.** `method/tasks/TASK-FORMAT.md` calls a card whose
   criterion and fence disagree **defective by definition** and prescribes
   record-and-route. **The defect is the CARD's, not the lane's**, and the
   lane discharged it the way the method says to.
3. **MET, and independently reproduced.** At `57c1b39`, over `app/src`
   and `app/test`, a specifier regex covering `from "…"`, `require(` and
   dynamic `import(` returns **0 files** for `dispatch-store`.
   **POSITIVE CONTROL: the identical regex returns 12 files for
   `board-model` and 12 for `task-detail`** — so the zero is a fact about
   the tree and not about the search. Every occurrence of the name is a
   doc comment or a path literal inside a census. I confirm the trap the
   section flags: `arch`'s `C-05 -> C-15` edge is `lib.rs`'s
   `pub mod dispatch;`, not a TypeScript import.
4. **MET.** `cargo run -p nputer-index -- arch cycles --root ../..` from
   `app/src-tauri/`, exit **0** captured before any pipe, ACYCLIC.

#### What I attacked and FAILED to break

Recorded because a verdict that lists only its hits is not a measurement.

- **The empty-glob loophole.** A lane could satisfy criterion 1's first
  arm literally by declaring a `paths:` line for a file that does not
  exist — a declaration with no test, invisible to every gate but one.
  **Not taken:** the frontmatter is byte-unchanged; the diff is prose.
- **Fence compliance, read by hand** because the hook stands aside in
  this session's shape (`lane-fence.mjs`'s declared limit 2, writes
  landing outside the dispatching checkout's root). The diff is **two
  files**: `docs/architecture/components/C-15-dispatch.md` (fence entry 3)
  and this card (`alwaysWritable: ["docs/tasks"]`). **Nothing outside the
  manifest, and nothing under `app/test/**` or `app/vitest.config.ts`.**
  The lane's own drill 2 disclosed that the fence was kept by discipline
  rather than by mechanism; that disclosure is owed and was made.
- **An unruled architecture decision.** The card forbids declaring
  `C-09 -> C-15` from inside a lane. `depends_on: [C-10]` is unchanged.
- **Minted ids.** Zero files added; `T-185`, `T-195`, `T-112-s6`,
  `T-126-s2` and `T-187` all exist, and `T-197` exists on `main` at
  `726d807` though not in this lane's tree — consistent with a lane cut
  before it was filed. The routing describes and allocates nothing.
- **`T-126-s2` untouched**, as the card requires.
- **The "only exact `toEqual`" claim.** I re-ran the derivation. C-11 is
  pinned by `toContain` (`select-board.test.ts:991`) and C-05 by
  `toContain` (`lib/parser/test/fence.test.ts:334-335`); the other
  `toEqual`s in `select-board.test.ts` are over touch-token EXPANSIONS,
  not a component's `paths:` array. **C-15's is the only exact `toEqual`
  over a live component's whole array.** The claim stands.

#### The e2e red is NOT this lane's, corroborated to the byte

    node scripts/brief.mjs --dispatch > file    69033 bytes   exit 0
    node scripts/brief.mjs --dispatch | cat     65536 bytes   exit 0

65,536 is the pipe buffer exactly, and both exit 0. The mechanism is
already carded as **`T-197`** on `main`; this lane corroborated rather
than re-filed, which is what `TASK-FORMAT`'s search-before-filing rule
asks for. **Not charged to this diff.** The half this lane adds — that
the defect reds a standing gate every docs lane now inherits, and that
WHICH assertion fails moves between runs so it reads as flake — is worth
folding into `T-197`.

#### Non-blocking observations (NOT failures, and they block nothing)

1. `C-15-dispatch.md` says everything else the matcher-grep surfaces is
   "over a fixture registry, not the live tree". Two of them are over
   touch-token expansions of the **live** registry rather than a fixture.
   The conclusion is unaffected — an expansion is not a component's
   `paths:` array — but the sentence is looser than the derivation under
   it.
2. The section forecasts that a lane which also WRITES the file moves
   `c15?.files`, the `fileComponent` tally and the tree-wide file-count
   body. **I measured that pre-regen it does not**: with the file written
   AND declared, the suite reported `1 failed | 49 passed (50)` — still
   the single dogfood body. Those tallies move only after the GRAPH
   REGEN, which the section says elsewhere but not adjacently. A next
   lane reading the forecast may expect reds that do not appear until it
   regenerates.

Both are one-sentence clarifications inside another lane's deliverable;
described here rather than performed, and no card id is minted for them.

#### Gates this verdict's own commit owes

Appending a verdict is a WRITE, so it is re-run at the tip I created and
not at the commit I was sent — see the gate results committed with this
entry.

**VERDICT: APPROVED.** Every criterion is met or correctly
recorded-and-routed; the fence held; the central empirical claim
reproduces exactly under an independent drill; the import census's
positive control passes; the one red is pre-existing and correctly
attributed. **The strongest thing I can say about this lane is that its
own least comfortable sentence survived a deliberate attempt to falsify
it**, and that the two questions it flagged for me to re-derive were the
two it had gotten wrong first and corrected — which is the disclosure
working as intended.
