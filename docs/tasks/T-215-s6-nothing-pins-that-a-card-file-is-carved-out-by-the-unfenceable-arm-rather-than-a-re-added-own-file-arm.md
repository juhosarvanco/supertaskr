---
id: T-215-s6
title: "Nothing pins WHICH arm answers a card file — `carveOutFor` returns a carve-out either way, so a re-added own-file arm is invisible to every existing body and to the one `T-219-s5` asked this lane for"
feature: F-06
milestone: 4
priority: 3
size: S
status: done
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "executor claude-opus-5@subagent @T-215-s1"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**THIS IS `T-219-s5`'s FOURTH CRITERION, ROUTED RATHER THAN BUILT, AND
THE REASON IS A BASE AND NOT A FENCE.** `T-215-s1`'s lane was cut at
`838e74b`, which PREDATES `T-219-s3`'s merge at `f6e3924`. In that
worktree `.claude/hooks/lane-fence.mjs` still carries `carveOutFor`'s
own-card first arm, so a body asserting the post-removal answer reds at
that lane's tip. `tools/e2e/tests/lane-fence.spec.ts` is inside the
fence; the BASE is not something a lane may move (`method/lane-protocol.md`
rule 2), and handing off a red lane to buy a green body is the trade
this project does not make.

## What the body has to discriminate on, and why presence proves nothing

`carveOutFor` called for a card file with a manifest that carries
`excluded` returns a
carve-out BOTH WAYS — the verifier of `T-219-s3` measured that the
answer moves from the removed own-file arm to `alwaysWritable` rather
than becoming `undefined`. So a body asserting *"a carve-out is
returned"* is satisfied by a re-added arm and measures nothing. The
discriminator is the RETURNED VALUE:

- through the unfenceable arm: `domain` is `docs/tasks` and `why` is
  *"no card may fence it and every card's protocol writes there"*;
- through a re-added own-file arm: `domain` is the card's own path and
  `why` names it *"…'s own card file, which is outside every fence
  including its own"*.

The existing body *the carve-outs each free a DIFFERENT write, and the
fence still holds around them* pins `decide`'s answer (`not-a-lane`) and
cannot see this: the seat branch consults `carveOutFor` only for a path
some live lane's manifest RESERVES, and a card file is never reserved.
That body is the permanent pin on the VERDICT; this card is the pin on
the ARM.

## Acceptance criteria

- A body in `tools/e2e/tests/lane-fence.spec.ts` SHALL call
  `carveOutFor` DIRECTLY for a card file against a manifest whose
  `excluded` carries that file, and SHALL assert the returned `domain`
  and `why` are the UNFENCEABLE arm's, naming both on a red.
- The body SHALL NOT be satisfied by a carve-out merely being returned,
  and its comment SHALL say why (the paragraph above).
- A positive control SHALL be DEMONSTRATED RED against a re-added
  own-file arm — a planted copy of the hook is enough, and is what
  `T-215-s1` used for its own header control, so no fixture machinery is
  owed that the file does not already have.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 3, at T-215-s1's merge (7264d21)

The architect seat. T-219-s5's fourth ask, routed by T-215-s1 because
its base predated T-219-s3's removal of the arm; main carries the
removal now (f6e3924), so the body can be written against the hook as
it is. Criteria: a body SHALL call `carveOutFor` directly for a card
file with a manifest carrying `excluded` and assert the RETURNED domain
and reason are the `alwaysWritable` arm's (docs/tasks), not an own-file
arm's; a positive control SHALL re-add a byte-identical own-file arm in a
fixture copy of the hook (or drive the hook's function from a scratch
copy) and show the body red by name; kill-set containment against the
existing carve-out bodies SHALL be measured at the tip. Guard-class,
`review: independent`.

## Implementation notes — 2026-09-02 (executor claude-opus-5@subagent)

### What was written, and where

One file, the whole fence: `tools/e2e/tests/lane-fence.spec.ts`. Two
bodies and their readers, placed with the carve-out family and ahead of
`T-215-s1`'s THE THIRD COPY section:

- **`a card file is carved out by the UNFENCEABLE arm, and a carve-out
  coming back is not that`** — arms a fixture with
  `touches: [tools/e2e, <the fixture card>]`, which is the one
  dispatchable shape that puts the card into `excluded` (the writer
  refuses a fence expanding to no path, and refuses every token whose
  domain contains `docs/tasks`), then calls `carveOutFor` DIRECTLY and
  requires the returned pair to be the unfenceable arm's. `decide`
  cannot reach the question: the seat branch consults `carveOutFor` only
  for a path some live lane's manifest RESERVES, and a card file is
  never reserved.
- **`THE POSITIVE CONTROL: the own-file arm re-added byte-identically
  answers instead, and the body above reds naming both halves`** —
  splices `T-219-s3`'s removed arm, byte for byte and FIRST, into a
  scratch COPY of the hook, imports that copy by URL and drives its own
  `carveOutFor` export. The live hook is never written to.
- `UNFENCEABLE_DOMAIN` / `UNFENCEABLE_WHY` are LITERALS, not values read
  back from the hook or the manifest; the manifest is asserted to CARRY
  the domain, which is the arming condition rather than the expected
  value. `OWN_FILE_ARM` is an array of source LINES so the arm's own
  template literal stays text; `occurrences` gives the plant a DELTA so
  the control never asserts the live hook lacks the arm — that is what
  keeps its kill set disjoint from the body it controls.
- Two imports joined the file: `carveOutFor` from the hook, and
  `pathToFileURL` from `node:url`.

Nothing else moved. `.claude/hooks/lane-fence.mjs` is read-only in this
lane and outside this fence; its sha256 is unchanged from the dispatch
stamp (below).

### Why presence proves nothing, restated because it is the whole card

`carveOutFor` called for a card file against a manifest whose `excluded`
names it answers a carve-out BOTH WAYS — through the removed own-file
arm and through `alwaysWritable`. Measured here, at this lane's tip: the
arm re-added byte-identically to the live hook reds ONE body of the 58
in this spec, and it is the new one. Every existing carve-out body,
including *the carve-outs each free a DIFFERENT write, and the fence
still holds around them* — whose own failure message reads "the own-card
carve-out arm became reachable again — see T-219-s3" — stays GREEN under
it, because `decide` never consults `carveOutFor` for a card file. That
body is the pin on the VERDICT; this pair is the pin on the ARM.

### Every command, in order, with the exit read from `$?` unpiped

At the base `81bcd228258c3cdb3cf62f37a6ff9eb2f8cd797e`:

1. `git rev-parse HEAD` (lane) — 0, `81bcd228258c3cdb3cf62f37a6ff9eb2f8cd797e`
2. `npm ci` from `tools/e2e/` — 0
3. `npm ci` from `app/` — 0
4. `npm run build` from `app/` — 0
5. `npm run typecheck` from `tools/e2e/` — 0
6. `NPUTER_E2E_PORT=15215 npx playwright test tests/lane-fence.spec.ts` — 0, **58 passed** (56 at the base)
7. `npm run lint:tokens` from `tools/e2e/` — 0, clean over TOKEN 174 files / CONTROL 1153 tracked text files
8. `git commit` — 0, `4fc67edf0c48350ef4fc51eb67eaf414b6b60319`
9. drill worktree at `4fc67ed` (below) — baseline 0 / **58 passed**, mutant A 1 / **1 failed 57 passed**, mutant B 1 / **1 failed 57 passed**
10. `node tools/e2e/scripts/gate-run.mjs parser` — 0, `bodies=363 verdict=GREEN`
11. `node tools/e2e/scripts/gate-run.mjs app` — 0, `bodies=1141 verdict=GREEN`
12. `node tools/e2e/scripts/gate-run.mjs rust` — 0, `bodies=639 targets=18 verdict=GREEN`
13. `NPUTER_E2E_PORT=15215 node tools/e2e/scripts/gate-run.mjs e2e` — 1, `bodies=579 verdict=RED`, **4 failed / 575 passed** — attributed below
14. `npm run typecheck` from `tools/e2e/` — 0 (after the literals)
15. `NPUTER_E2E_PORT=15215 npx playwright test tests/lane-fence.spec.ts` — 0, **58 passed**
16. `git commit` — 0, `74998a0e1776d0c7728ba945642d13955e1ed0cb`
17. drill worktree at `74998a0` (below) — mutants A, D, C, B and the base bench
18. `git merge-tree --write-tree main HEAD` — 0 (read before the diff), tree `faa7dafcd35e743a4299e6cc9de66c9708c6d537` against main `763548cc61392f4f034b9c0fb334142f926d4c8b`
19. `git diff --name-only main <tree>` — 0, **1 path**: `tools/e2e/tests/lane-fence.spec.ts`

The gate derivations, the docs gate, `index --check` and the four-suite
battery re-run at this card's own tip are in the handoff report, because
this commit IS the tip and a gate answered one commit early is a gate
nobody re-derived.

### The four-suite battery, and the red that is not this lane's

`gate-run e2e` came back RED with **4 failed / 575 passed** at
`4fc67ed`. The four, by NAME:

- `card-preflight.spec.ts` — *a discrepancy answers ONE and a preflight
  that could not run answers THREE*
- `checkout-currency.spec.ts` — *THE WIRING'S POSITIVE CONTROL: the same
  arming step says CURRENT for a current checkout, and adds no finding*
- `checkout-currency.spec.ts` — *THE SWEEP AT ARM TIME: the arming step
  RUNS it, and names every checkout git reports*
- `lane-lock.spec.ts` — *the DISPATCH STEP arms it — `brief.mjs
  --write-fence` is the one event, and a widening is the same event
  again*

MEASURED AT THE BASE RATHER THAN ARGUED: the same three spec files run
in a detached bench at `81bcd228258c3cdb3cf62f37a6ff9eb2f8cd797e` — this
lane's base, carrying no diff of mine at all — red the SAME FOUR bodies
and pass 78. This is the `guard-surface-behind` class docs/STATE.md
names: a lane cut before a guard merges reds four bodies on its own
guard surface. None of the four is in this fence, none reads the file
this lane changed, and this lane's own spec is 58-for-58 in both places.

### The drills — one side only, read back, restored by hash

The live hook is read-only in this lane and outside this fence, so every
mutation of it happened in a DETACHED scratch worktree cut from this
lane's own commit, at `<scratchpad>/drill-T-215-s6`, removed afterwards.
The scratch stem is the lane id, per the SCRATCH RULE.

At `4fc67ed` (the first build commit):

- **baseline** — the spec, unmutated, in the drill: 0, 58 passed.
- **MUTANT A, the arm re-added** — `T-219-s3`'s arm spliced FIRST into
  `carveOutFor`, byte-identical (`cmp` against the text extracted from
  `f6aca05^`: exit 0, 230 bytes each side, both sides
  `8281a7fc2a7fb77cf9b9fcbd6507ac1d41b73af77af1910bc33c7cbe64085c80`).
  Read back with `git diff` before running. Result: **1 failed / 57
  passed**, the failure being the new body, naming both halves —
  *the domain is `docs/tasks/T-901-…` and the unfenceable arm's is
  `docs/tasks`* and *the reason is "it is T-901's own card file, …"*.
- **MUTANT B, the control plants nothing** — `${OWN_FILE_ARM}` in the
  control's plant replaced by `${""}`, one side only. Result: **1 failed
  / 57 passed**, the failure being the CONTROL, at its own anti-vacuity
  line: *the arm did not land in the copy, so this control proves
  nothing*, expected 1 received 0. The control is therefore shown
  CAPABLE OF FAILING against an arrangement lacking the property.

Re-run at the tip `74998a0`, with two finer mutants added:

- **MUTANT A** (arm re-added) — **1 failed / 57 passed**, the new body.
- **MUTANT D** (the domain half alone) — the `alwaysWritable` arm made to
  return `{ domain: rel, … }`, the reason untouched: **1 failed / 57
  passed**, the new body. The DOMAIN half is this body's alone.
- **MUTANT C** (the reason half alone) — the `alwaysWritable` arm's `why`
  replaced: **2 failed / 56 passed** — the new body AND *the carve-outs
  each free a DIFFERENT write*, which already asserts that sentence by
  `toContain` for another card through `decide`. Recorded rather than
  hidden: the REASON half is shared coverage, the DOMAIN half and the
  ARM identity are not, and A and D each have a kill set of exactly one
  body.
- **MUTANT B** (the control plants nothing) — **1 failed / 57 passed**,
  the control. Its kill set and the subject's are disjoint, which is
  what the DELTA assertion buys.

RESTORATION, by `git restore --source=<the drill's own commit> --staged
--worktree` and proved by sha256 after every mutant:

- `.claude/hooks/lane-fence.mjs` —
  `5e309398e9f236cdd3e4a90e700164e9735cefe158f05426097dce2d1e065d24`,
  equal to `git show 74998a0:.claude/hooks/lane-fence.mjs | shasum -a
  256`, and equal to the file in this lane, which was never written to.
- `tools/e2e/tests/lane-fence.spec.ts` —
  `ea9077c9479190af5aaf95ca666efcde96cea756d1daac9fa80b8e27580795e9`,
  equal to `git show 74998a0:…` and to this lane's own file.
- The drill worktree was then removed (`git worktree remove --force`)
  and pruned; `git worktree list` no longer names it.

### For the verifier

- The census `docs/CAPABILITIES.md` is STALE by two sentences — this
  lane adds two test names and `docs/CAPABILITIES.md` is read-only to it
  (T-210, T-201). **The regeneration is the INTEGRATOR'S, in the merge
  commit**: `npm run capabilities` from `tools/e2e/`.
- The bench that measured this lane's base is gone with the drill; it is
  reproducible in one command from the hashes above.
- Nothing was routed as `status: suggested`: every acceptance criterion
  fitted inside `tools/e2e/tests/lane-fence.spec.ts`.

### Where the brief was wrong

1. **The card's path.** The dispatch message named
   `…-rather-than-an-own-file-arm.md`; the file on disk is
   `…-rather-than-a-re-added-own-file-arm.md`, which is also what the
   assembled brief's row 2 carries. The repository wins.
2. **"tools/e2e npm ci already done in this lane".** It was not, and
   neither was `app/`: this worktree had `node_modules` only under
   `lib/parser/` (its `dist/` was present). Both installs and the app
   build were run here, in the fresh-clone ORDER.
3. **The brief's row 4 base commit** reads
   `6cc38909ab24c9c5c06b4e23a0fa11424662a038`; this worktree's HEAD at
   dispatch was `81bcd228258c3cdb3cf62f37a6ff9eb2f8cd797e`, which is
   what every figure above is measured against. T-233's known defect,
   and the dispatch message says so.
4. **Row 10's live environment had already moved when this lane
   started**, which is what row 10's own rule predicts: `main` was
   `81bcd22` at assembly and `763548c` when the forecast was derived,
   and the worktrees for `T-229-s6`, `T-238` and `drill-T-237-s3` that
   the brief lists are gone. Live facts, re-read rather than trusted.
5. **`docs/tasks/T-219-s5-*.md` does not exist** at this base — it was
   absorbed into `T-215-s1` — so it is cited here as an id and never as
   a file.

## VERDICT

**APPROVED** — claude-opus-5@subagent (verifier), 2026-09-02, judged at
tip `2875f99b3c2c91f088eefe9fa3e66deceb8ca7c6` against base
`81bcd228258c3cdb3cf62f37a6ff9eb2f8cd797e`. Every figure below carries the
ref it was measured at, and all of them were taken in the verifier bench
`/Users/ujju/Projects/nputer-V-T-215-s6` on ports 25215/26215.

### The blindness was CLOCK-SHAPED, and it is stamped

This seat was cut alongside the lane (orchestrator 5c). Phase 1 was sealed at
**2026-09-02T06:53:33Z**, before the branch existed as anything but a name:

    36f52d9ce9e78464b3805e68a91834816dfbefd5682f0e2304271d730f54eef6  attack-V-T-215-s6.md
    81ec4db0ae31e8d1174f27e264f8f0c2083f3095bbad41611470d9b1a014ab20  ground-V-T-215-s6.md
    a6baa453c3813a9d0db83376c4bb6d83b5e2fca4e9bcf939d3a78a86e9925704  stamps-V-T-215-s6.txt

There was no diff, no note and no handoff to decline; the dispatch brief's
duties section named no executor-derived specific. One disclosure: a
`git worktree list` run for bench hygiene printed the lane's tip sha. A sha
carries no content and nothing was resolved, logged or diffed from it, but the
leak is recorded rather than tidied away. The phase-2 message carried the
executor's own figures; every one of them below was re-measured here, and one
of them is corrected.

### The card's premise, measured at the BASE before the diff existed

The attack set's own control was owed a demonstration (verifier.md 2b), so
`M1` — T-219-s3's arm re-added **byte-identical and first** — was run at
`81bcd22` against every spec in the tree that reads this hook (`lane-fence`,
`card-preflight`, `lane-lock`, `landing-gate`, `push-guard`):

**`201 passed`. Zero failures.**

So the gap this card names is real and was measured, not argued: before this
diff, a byte-identical re-add of the removed arm was invisible to all 201
bodies pointed at that hook — *including* `the carve-outs each free a
DIFFERENT write`, whose own message reads "the own-card carve-out arm became
reachable again — see T-219-s3" and which never fires, because `decide` never
consults `carveOutFor` for a card file. **M1's kill set at the base was
EMPTY.**

### The three criteria, each attacked

**1. A direct `carveOutFor` call asserting BOTH halves, naming both on a red
— MET.** The body derives its manifest through `arm(fx)` → `buildLaneFence`
rather than typing one, over `touches: [tools/e2e, <fixture card>]` — which I
measured independently at the base to be the *only* dispatchable shape that
yields a non-empty `excluded` (the writer refuses a fence expanding to no path,
and refuses every token whose domain contains `docs/tasks`; the root token `.`
does not reserve a card file because `within(card, ".")` is false). So the
manifest is one the parser can actually produce, which was the sharpest way
this body could have been degenerate and is not.

`UNFENCEABLE_DOMAIN` / `UNFENCEABLE_WHY` are literals, not values read back
from the hook or the manifest — the T-230-s8 shape is absent, and this is
proven rather than read: mutating the hook's reason half (`M2`) and its domain
half (`M3`) each kills this body alone. Under `M1` the red names both halves,
actual and expected:

    the domain is `docs/tasks/T-901-…md` and the unfenceable arm's is `docs/tasks`
    the reason is "it is T-901's own card file, …" and the unfenceable arm's is
      "no card may fence it and every card's protocol writes there"

**2. Not satisfied by presence, and the comment says why — MET.** The section
comment states the both-ways property outright, and the body's assertion is on
`ownCardCarveComplaints`, not on the carve-out's existence. `toBeDefined()` is
present but is an anti-vacuity guard sitting *above* the discriminating
assertion, not in place of it — `M1` proves it: a carve-out still comes back
and the body still reds.

**3. A positive control DEMONSTRATED red against a re-added arm — MET, and
the arm is genuinely byte-identical.** Verified independently of the
executor's `cmp`: `OWN_FILE_ARM` reconstructed from the spec and compared
against the text at `f6e3924^` (the merge's first parent, which I recovered in
phase 1 before any diff existed) is **230 bytes, sha256
`8281a7fc2a7fb77cf9b9fcbd6507ac1d41b73af77af1910bc33c7cbe64085c80`, identical
on both sides**, from line 830 of the pre-removal source where it stood FIRST.
The executor cited `f6aca05^`; those two blobs are themselves byte-identical
(`21e0465492…`), so the two provenances agree.

The control plants into a **scratch copy** (`scratchRoot()`'s `mkdtemp`),
imports it by URL and drives *its own* export — the live hook is never
written. The arming genuinely differs, which is the whole of what makes it a
control: under `M1`, where the LIVE hook carries the arm, the control stays
GREEN, because it asserts the plant's *delta* rather than the live hook's
innocence. That is the `T-203` defect — one arrangement deciding both sides —
deliberately excluded.

### Kill-set containment: MEASURED, and neither contains the other

Seven mutants, each landing read from `git diff` rather than from the
mutator's report, run against the full spec at `2875f99`:

| mutant | kills |
|---|---|
| `M1` arm re-added byte-identical, FIRST (hook) | **the new body ALONE** (57 passed) |
| `M2` unfenceable arm's `why` (hook) | the new body alone |
| `M3` unfenceable arm's `domain` (hook) | the new body alone |
| `M7` `INTEGRATION_SEAT_PATHS` arm deleted (hook) | **`the carve-outs each free a DIFFERENT write` ALONE** |
| `M4` **DATA**: fixture stops naming its own card | the new body, **at its anti-vacuity line** |
| `M5` the shared reader drops its domain half | **the control alone** |
| `M6` the control plants nothing | **the control alone**, at its own anti-vacuity line |

`M1`/`M2`/`M3` kill the new body and leave the existing carve-out body alive;
`M7` kills the existing body and leaves the new one alive. **Neither kill set
contains the other — both are load-bearing.** No kill count of one was
demanded of any mutant; the containment reading is what decided it.

`M4` is the data mutant verifier.md 2b requires where the property lives in
data, and it is the one that matters most here: with `excluded: []` the two
implementations are **indistinguishable** (measured at the base — both return
`docs/tasks`), so a fixture that stopped carrying the card would disarm the
body and its control together in one stroke. It cannot happen silently: the
body reds at *"the card's own file was not carved out at dispatch, so no
own-file arm could answer"*. `M5` answers the remaining question about the
control — it is bound to the subject's own reader, so weakening that reader
reds the control by name rather than passing beside it.

### Fence, security, adjacent surfaces

Two files changed, both inside what this lane may write: the spec it reserves,
and its own card (carved out at dispatch). `.claude/hooks/lane-fence.mjs` is
**byte-identical to the base** (`git diff --quiet` clean;
`5e30939…`) — the body was written against the hook as it stands, not around
it. No dependency added; the only new imports are `carveOutFor` and
`node:url`'s `pathToFileURL`. Security sweep: the planted module is built from
the repository's own hook text plus a literal array, written under an
unpredictable `mkdtemp` root and removed by the file's `afterAll`; no `eval`,
no `new Function`, no `vm`, no shell, no network, no new input path, no secret.
No scratch directory from this spec survives a run.

At `2875f99`: `lane-fence.spec.ts` **58 passed** (56 at the base, so the two
bodies are real and not a harness pass over an unchanged count);
`npm run typecheck` exit 0; `lint:tokens` clean; `index --check` **CURRENT**.

`capabilities:check` is **STALE at `2875f99`, 48363 → 48582 bytes**, and that
is CORRECT rather than a defect: the delta is exactly the two new test names
and the census count 577 → 579, nothing else, and `docs/CAPABILITIES.md` is
read-only to a lane (T-210) with the regeneration owed by the integrator in
the merge commit. The lane did not commit it.

### One attribution figure CORRECTED

The dispatching seat relayed **four** `guard-surface-behind` reds. I measure
**two**, and I attribute them by NAME rather than by count, as docs/STATE.md
requires — `tests/checkout-currency.spec.ts:852` *THE WIRING'S POSITIVE
CONTROL…* and `:953` *THE SWEEP AT ARM TIME…*, the same two bodies, failing
identically at **both** `81bcd22` and `2875f99` (30 passed / 2 failed at each).
They sweep the machine's live worktree set, so the count moves with the disk
rather than with the tree; the attribution away from this diff holds either
way. The relayed figure is not this lane's error, but it is a claim and it was
wrong, so it is corrected here rather than repeated.

### Not a failure, and not blocking — routed to the architect, no card cut

`expandFence` accepts the repository-root token `.`, whose domain contains
`docs/tasks`. Nothing is reachable through it today — the hook's `within`
answers false for a card file against `.`, so such a lane still reserves no
card — but `carveOutFor`'s header argues that T-219 "refuses every such
token", and `.` is a counterexample to that sentence rather than to the
behaviour. Measured at `81bcd22`; inert; named so the next reader of that
paragraph is not surprised by it. It is outside this fence and this card, and
this seat cut no card for it.
