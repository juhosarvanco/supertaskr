---
id: T-314-s6
title: "Two of T-314's `--take-seat` bodies spawn the verb straight from the test process, so on the runner — where no harness is an ancestor — the seat verb answers COULD NOT RUN and main is red on CI at 8d26c8c5 while both bodies are green under a local harness"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 1
status: building
suggested_by: "the architect seat, reading CI run 34772159066 on 2026-09-13"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/fake-harness.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

CI run 34772159066 on main at 8d26c8c5 (2026-09-13): e2e shard 2 of 4 red, two bodies in tools/e2e/tests/push-guard.spec.ts — "`--take-seat` installs the guard and announces it, and BOTH seat verbs report a checkout without the hook as UNGUARDED" and "`--take-seat` records NO seat when the guard cannot be installed, and leaves the configuration and the index alone" — each with `Expected: 0` (or `1`) `Received: 3`. The verb's own stderr in the log: a session that cannot name itself cannot create or retire a claim on its own behalf. `sessionIdentity` (tools/e2e/scripts/checkout-currency.mjs) walks the process table upward looking for a harness-shaped ancestor (the Claude or Codex program); the runner's tree is node under the test runner under the job, so the walk finds none, the verb answers COULD NOT RUN (exit 3), and the bodies' assertions on exit 0 or 1 fail. Locally every test process has the seat's own harness as an ancestor, which is why the lane, the bench and the seat's closing check were green at 122 bodies. The older seat bodies in tools/e2e/tests/card-preflight.spec.ts already know this: they run `--take-seat` through `underHarness` / `fakeHarness`, a node process named like the harness, so the walk finds an ancestor on any machine. The two new bodies use a plain `seatVerb` helper that spawns the verb directly. T-239-s4's class (the runner has no identity the local machine has), one body over.

## Acceptance criteria

- WHEN a push-guard body runs `--take-seat` or `--release-seat` THE verb SHALL be spawned under a harness-shaped ancestor the way card-preflight.spec.ts's seat bodies already do (the fake-harness helper shared rather than copied, T-057), so the body passes on the runner as well as under a local harness; the two named bodies SHALL be green on CI at the merge, read from the run rather than assumed from a local battery.
- WHEN the helper is shared THE bodies that already use it SHALL be unchanged in what they assert, pinned by their own existing controls; no body SHALL gain a skip or a runner-only branch.
- WHEN this card lands THE closing check's owed set for the range SHALL include the push-guard spec and the merge's CI run SHALL be read and named in the notes.

## Amendment of 2026-09-13 — the helper's home (the seat's step-2 triage before promotion)

`fakeHarness`, `harnessScript` and `underHarness` are local functions of the preflight spec and read the spec's own CLI path and no-session checkout from module constants. Sharing them rather than copying them means a helper module both specs import, so the fence gains that module as a new-file reservation, tools/e2e/tests/fake-harness.ts; the two helper modules that exist beside the specs are the app's page helpers and the shell harness, neither a home for a process-table stand-in. The helper takes the CLI path and the no-session checkout as parameters, and the preflight spec's bodies keep their assertions unchanged, as the criteria already require.

## Implementation notes

Built by the executor seat, claude-opus-5 subagent, in the lane worktree
on branch task/T-314-s6-the-take-seat-bodies-under-a-fake-harness, cut
at fec37e5f3838 (the dispatch stamp). The implementation is one commit,
b7274d54, and every figure below carries the ref it was measured at.

**THE VERIFIER'S PHASE-1 RETURN WAS SHARED WITH ME BY THE SEAT** under
the shared-pitfalls pilot of 2026-09-13 (the owner's ruling, recorded in
docs/rooms/loop-cost-and-speed.md). I read it at 2026-09-13T20:20:54Z,
after the diff was written and before the drills, as the file named
pitfalls-T-314-s6.md in this lane's scratch directory. Its attacks are
answered by name below; its measurement requests M1 to M10 are the
verifier's asks of the seat at the base and were not mine to answer,
though M5, M6, M8 and M9 are answered here because the build needed
them.

### What was wrong, reproduced on this machine rather than inferred

The seat verbs derive the acting session by walking the process table
upward for a harness-shaped ancestor (`sessionIdentity` in
tools/e2e/scripts/checkout-currency.mjs). A local test process always
has one; a runner never does, and the walk ends at the reaper. So a
body that spawns the verb straight from the test process measures the
machine it ran on.

That is reproducible here, and it was reproduced before a line was
changed: run the suite from a shell REPARENTED TO THE REAPER — the
runner's own ancestry — and at fec37e5f3838 the three seat bodies of
tools/e2e/tests/push-guard.spec.ts answer 2 failed, 1 passed, with
`Expected: 0` / `Received: 3` and `Expected: 1` / `Received: 3`, the two
failures being exactly the two bodies this card names. Under this
seat's own harness the same three answer 3 passed at the same ref. The
third body survives both, and the reason is in the arm: the
not-integration branch is taken BEFORE the identity is consulted, which
is also why the preflight spec's own lane body needs no stand-in.

### What was built

tools/e2e/tests/fake-harness.ts holds the stand-in: the symlink to this
node named the way the real harness is, the script a stand-in runs, and
the wait for it. The CLI path and the no-session checkout arrive as
parameters, which is what the amendment of 2026-09-13 asked for and
what made sharing possible at all — they were module constants of
tools/e2e/tests/card-preflight.spec.ts, so the only other way to reuse
them was to copy them, and a recipe in two places is two chances to
disagree (T-057).

- tools/e2e/tests/card-preflight.spec.ts keeps its three local names as
  one-line binders over the module, so EVERY call site in that file is
  the call it always was. No body there is touched.
- tools/e2e/tests/push-guard.spec.ts had its OWN copy of the symlink
  recipe (`harnessLink`, written for T-238's holder bodies); that copy
  is now the shared one, with this file's scratch bookkeeping left
  around it. `seatVerb` — the one helper all seven `--take-seat` and
  `--release-seat` invocations in that file go through — runs the verb
  under the stand-in, and gains this file's own no-session checkout.
- ONE BODY IS ADDED, and it is the answer to the attack set's A1.5. The
  whole repair rests on the claim that a process started through the
  link is what the derivation calls the nearest harness ancestor — and
  NOTHING LOCAL REDS WHEN THAT STOPS BEING TRUE, because the real
  harness two levels up answers instead and the red arrives only on the
  runner, one level up in the same shape. The new body asks the claim
  of the production derivation from INSIDE the stand-in: the walk
  includes the process it starts from, so an accepted link answers with
  the stand-in's own pid and a rejected one climbs past it.

### The criteria, each against the measurement that discharges it

1. Every push-guard invocation of either seat verb is spawned under the
   stand-in, the helper SHARED rather than copied. The sharing is not a
   claim: `gate-run.mjs --owed-set --range fec37e5f3838..b7274d54`
   reports tools/e2e/tests/fake-harness.ts as owned by 2 spec files over
   the static import graph, and the owed e2e specs are exactly
   tools/e2e/tests/card-preflight.spec.ts and
   tools/e2e/tests/push-guard.spec.ts. Under the runner's own ancestry
   the three seat bodies go from 2 failed, 1 passed at fec37e5f3838 to 3
   passed at b7274d54; under a local harness they are 3 passed at both.
   THE SECOND HALF OF THIS CRITERION IS THE MERGE'S AND NOT THIS LANE'S:
   a lane cannot read the run its own merge will produce. What this lane
   can say is that the mechanism is the one the runner already accepts —
   see the next paragraph.
2. No body that already used the helper is changed: the diff of
   tools/e2e/tests/card-preflight.spec.ts touches an import, a comment
   and three function bodies, and not one line inside a `test(`. No
   skip, no `fixme`, no `only`, no retry change, and no environment
   predicate anywhere in the diff or in the new module — the module
   reads `process.execPath` (the binary to link) and inherits
   `process.env` (as the base already did), sets `CLAUDE_PROJECT_DIR`
   unconditionally, and branches on nothing. The stand-in is installed
   on every machine by the same path, which is the honest reading of
   "no runner-only branch": a helper that installed a stand-in only when
   it found none would be a runner-only branch with no body to put it
   in.
3. The owed set for fec37e5f3838..b7274d54 is the e2e suite narrowed to
   those two specs, so the push-guard spec is in it; the RESULT rather
   than the membership is recorded under "The closing check" below. The
   merge's CI run is the merge's to read: it does not exist while this
   lane is open, and a run id invented here would be a fabrication. The
   integrator reads it after the push and names the run id, the sha it
   ran on, and the conclusion of the shard that carries
   tools/e2e/tests/push-guard.spec.ts.

### Why the stand-in is harness-shaped on a RUNNER, not just here

The attack set's A1.5 is the one attack a local green cannot answer, so
it is answered from the runner's own record. In CI run 34772159066 at
8d26c8c5 — the very run this card was cut from — the four e2e shards
answer: shard 2 of 4 failure, shards 1, 3 and 4 success. Shard 2 carries
tools/e2e/tests/push-guard.spec.ts and ends 2 failed, 333 passed in
2.2m. Shard 3 carries tools/e2e/tests/card-preflight.spec.ts, and its
five seat bodies — the ones that have run under THIS stand-in since
T-238 — are all green there, at positions 66 to 71 of that shard's
listing. So on the machine where the plain spawn fails, the stand-in
already succeeds, and the repair moves the two bodies onto a mechanism
that runner has been accepting all along.

That run also answers the attack set's M6: the shard logs list every
body by title and result, so the merge's run can be read per body and
not only per shard.

### The drills

Every mutant was planted, measured, restored, and the restoration
proved by sha256 against a capture taken before the first plant. All
four watched files — tools/e2e/tests/fake-harness.ts,
tools/e2e/tests/push-guard.spec.ts,
tools/e2e/tests/card-preflight.spec.ts and
tools/e2e/scripts/brief.mjs — hash identical after the last restore;
tools/e2e/scripts/brief.mjs is in the set precisely BECAUSE it is
outside this fence and must be seen not to have moved.

- MUTANT A, at the one site that names the stand-in (the link's
  basename): under the runner's own ancestry it kills 5 bodies across
  BOTH spec files — 3 in tools/e2e/tests/card-preflight.spec.ts and the
  2 this card names in tools/e2e/tests/push-guard.spec.ts — and leaves
  the not-integration body green. One mutant, two files: the sharing is
  one mechanism and not two wearing one module's name (the attack set's
  C2, and A1.3).
- MUTANT A AGAIN, under a LOCAL harness, against the new body: red,
  `Expected: 34713` (the stand-in's own pid) against `Received: 73562`
  (this session's real harness, further up). This is the body's whole
  purpose — the same mutant that is invisible locally in every other
  body reds here.
- MUTANT B, the status the stand-in reports: the two named bodies and
  the third answer `Received: 3` against `Expected: 0` and `Expected: 1`
  and all three red. The bodies still assert the exact exit codes the
  card records, which is the attack set's A1.7 and C3.
- MUTANT C, the pid the stand-in reports (the spawned command's instead
  of the harness's): the preflight body that asserts the session IS the
  harness reds, and the push-guard body that does not read that field
  stays green. Containment, and the proof that the preflight bodies
  CONSUME the shared module rather than merely importing it (the attack
  set's A1.2 boundary variant).
- A PROBE rather than a mutant, for the attack set's A2.1: this file's
  new no-session checkout is not load-bearing for these bodies'
  verdicts. Pointed at this lane's own checkout instead, the three seat
  bodies are still 3 passed. It buys determinism — the seat arm does not
  arm the stale-checkout catcher, so what changes is only that the verb
  stops seeing wherever the suite happened to be started from.

### The enumeration, by hand and recorded here

The attack set's A1.4 and A1.12 ask whether every seat-verb invocation
now composes an ancestor, not only the two named bodies. At b7274d54,
over tools/e2e/tests/, every invocation of either verb reaches the verb
in one of three ways: through the stand-in (all 7 in
tools/e2e/tests/push-guard.spec.ts, through `seatVerb`; all 9 in
tools/e2e/tests/card-preflight.spec.ts, through `underHarness` or
`harnessScript`); through a STUBBED process table, which
tools/e2e/tests/checkout-currency.spec.ts builds on the PATH for its
Codex-identity body; or at a site where the identity is never derived —
the lane and called-wrong bodies, each of which argues that in its own
comment. THE CLASS is a body that asks a question of the process table
without composing an answer to it; THE SWEEP is the one just described,
and it is a reading rather than a keeper. A body that would keep it
mechanically is filed as T-314-s8.

### What this lane leaves for the merge

- THE CENSUS IS STALE AND THAT IS THE MERGE'S REGEN, not a defect: one
  body was added, so `capabilities:check` answers STALE at b7274d54
  (committed 100133 bytes against a fresh generation of 100241). This
  fence carries neither docs/CAPABILITIES.md nor docs/INDEX.md, and the
  regen has landed in the merge commit on every recent card that added
  a body (T-300-s7's, at e528a5d5).
- GRAPH REGEN FIRES at this merge — the diff touches `.ts` outside
  docs/ — and the graph itself has nothing to move: `index --check` is
  CURRENT at b7274d54 (1216090 bytes, 203 files, 2593 symbols, 2488
  edges, exit 0), and tools/e2e is not among those files, the graph
  indexing app/src, app/src-tauri, app/test and lib/parser only.
- BOOT GATE is NOT OWED: nothing under app/src-tauri/, app/src/ or
  either manifest is in the diff.
- METHOD EVAL GATE is NOT OWED: no path under method/ is in the diff,
  and no line matching the citation grammar was added under docs/tasks/.
- DOCS GATE: the three code paths owe nothing (`docs-gate.mjs` over them
  answers "none under docs/ — this gate is not owed"); the card edits
  that carry these notes are what puts docs/tasks in the range, and the
  gate's verdict over the full path list is recorded under the closing
  check.

### Where the brief was wrong

Nowhere that changed a decision. Two corrections of detail: the
amendment says the two helper modules beside the specs are the app's
page helpers and the shell harness, and at fec37e5f3838 there are three
— tools/e2e/tests/helpers.ts, tools/e2e/tests/shell-harness.ts and
tools/e2e/tests/git-fixture.ts, the last of which is the nearest
precedent for what this card adds and is a better argument for the new
module than the one the amendment makes. And the brief's framing that
the preflight spec's helpers are what push-guard.spec.ts lacks is half
the picture: that file had its own copy of the symlink half already, so
the card's "shared rather than copied" had two copies to collapse and
not one to promote.

### In-fence follow-through

- The `seatVerb` helper gained a no-session checkout of this file's own
  rather than inheriting whatever the suite was started under. Same
  shape as the preflight spec's, argued at the site.

## Verdicts

Promoted 2026-09-13 (the architect seat's step-2 triage, under the owner's ruling of 2026-09-13 to run the regular ceremony without token or time limits, the lane order delegated to the seat the same day): to planned at priority 1 — main is red on the runner at 8d26c8c5 on the two bodies this card names, and the remedy is the helper the preflight spec already has; dispatched next after T-300-s7 merges, under the standing authorization of 2026-09-12.
