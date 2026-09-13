---
id: T-314-s6
title: "Two of T-314's `--take-seat` bodies spawn the verb straight from the test process, so on the runner — where no harness is an ancestor — the seat verb answers COULD NOT RUN and main is red on CI at 8d26c8c5 while both bodies are green under a local harness"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 1
status: verifying
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
pitfalls-T-314-s6.md in this lane's scratch directory, sha256
04651425242c93a243fce43dc36c598c96eca680f35ac214083ad42542ee91f9. Its
attacks are
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

### The closing check

Run ONCE, as the RANGE's owed set rather than the scoped form, because
the notes above put docs/tasks in the range and the docs gate fires on
it: `gate-run.mjs --range fec37e5f3838..d9f68902` over 6 moved paths
owes app, e2e and parser, the e2e leg narrowed to 13 spec files. All
three GREEN at d9f68902 — parser exit 0 over 413 bodies, app exit 0 over
1171 bodies, e2e exit 0 over 713 bodies in 6.2m.

**AND IT WAS RUN IN THE RUNNER'S OWN SHAPE.** The whole battery was
started from a shell reparented to the reaper, so no harness was an
ancestor of any test process in it — the exact condition that reddened
main. Nothing in the owed set depends on this machine's ancestry: 713 of
713.

The RESULT for the spec this card's third criterion names, rather than
its membership in a set: tools/e2e/tests/push-guard.spec.ts ran 123
bodies, all green, and the three that drive a seat verb are positions
651, 652 and 653 of that leg's listing — the two this card names among
them. The body added here is position 604. In the same leg
tools/e2e/tests/card-preflight.spec.ts ran 58 bodies, all green,
including the five that have used this stand-in since T-238.

What the sharing costs, for the attack set's A2.6: the only path that
grew is `seatVerb`, which now spawns a stand-in as well as the verb, 7
times in the whole suite. Measured under a local harness, the three seat
bodies together go from 1.87s at fec37e5f3838 to 2.10s at b7274d54, and
the added body costs 48ms at d9f68902. Every other body's path is
unchanged: the preflight spec's binders pass the same two constants the
module constants always were. The whole spec is 109.7s of body time at
d9f68902, against 30.9s for the preflight spec.

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
- ONE BODY ADDED beyond the letter of the criteria, at the stand-in's own
  property, because the failure this card repairs is invisible to a
  local suite and the body makes it visible there. It is why
  `capabilities:check` is stale for the merge to regenerate.
- tools/e2e/tests/push-guard.spec.ts's own copy of the symlink recipe was
  collapsed into the shared module rather than left beside it: the card
  says shared rather than copied, and that file had a copy of its own.
  Its SCRIPT half is left, and filed as T-314-s7.

## Verdicts

Promoted 2026-09-13 (the architect seat's step-2 triage, under the owner's ruling of 2026-09-13 to run the regular ceremony without token or time limits, the lane order delegated to the seat the same day): to planned at priority 1 — main is red on the runner at 8d26c8c5 on the two bodies this card names, and the remedy is the helper the preflight spec already has; dispatched next after T-300-s7 merges, under the standing authorization of 2026-09-12.

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Phase 2 of the STANDARD tier, one pass at the lane tip be9d6a25 on the
bench worktree, the diff read before the executor's notes. The two
corrections below are both accuracy corrections to the implementation
notes and neither touches code; the diff itself I would take unchanged.

#### The sealed inputs, by their digests

- the attack set, written at the base without the diff —
  sha256 04651425242c93a243fce43dc36c598c96eca680f35ac214083ad42542ee91f9
- the ground, taken at the base by a script —
  sha256 9a1a9c8a2539c18b4f7df8c7b6d7065385b37f21375b53c25f1478e662123c5d
- the card at fec37e5f, the contract both phases were written against —
  sha256 db22435476f5525cbcce574ec0899433e17e7fab9a299958fd564beb422dc201

All three matched the saved files at the start of this pass.

#### A row per acceptance criterion

| # | criterion | verdict | the command, body or reading that decided it |
|---|---|---|---|
| 1a | the verb spawned under a harness-shaped ancestor, the helper SHARED rather than copied | MET | `gate-run.mjs --owed-set` at the tip answers that tools/e2e/tests/fake-harness.ts is owned by **2 spec file(s) over the static import graph**, naming both specs. Sharing is not nominal: mutant M2, at the module's single naming site, reds **3 bodies in tools/e2e/tests/card-preflight.spec.ts and 2 in tools/e2e/tests/push-guard.spec.ts** under the runner's ancestry — one mutant, two files, so both specs CONSUME the module |
| 1b | so the body passes on the runner as well as under a local harness | MET, measured rather than argued | I reproduced the runner's ancestry locally — a shell reparented to the reaper, where `sessionIdentity` answers not-ok — and ran the seat bodies there. At the tip: **4 passed** (the two named, the third seat body, the added control). With `seatVerb` reverted to the base's direct spawn in that same tree: **2 failed**, the two the card names, `Expected: 1` `Received: 3`. The same mutant under this seat's own harness: **2 passed**. Two-sided, and the red side is the CI red reproduced |
| 1c | the two named bodies green on CI at the merge, read from the run rather than assumed | CARRIED TO THE MERGE, correctly | The run does not exist while the lane is open. Phase 1 pre-committed that a local battery is NON-EVIDENCE here and that the honest verdict is unmet-and-unmeetable-yet; the executor reached the same reading independently and declined to substitute a local green. Discharged at the merge, under "What the merge owes" below |
| 2a | the bodies that already use the helper unchanged in what they assert | MET | The diff of tools/e2e/tests/card-preflight.spec.ts touches an import, a comment block and three function bodies — no hunk falls inside a `test(`. Body count there is **59 at the base and 59 at the tip**, so nothing was deleted or retitled |
| 2b | pinned by their own existing controls | MET, and the pin was ARMED rather than assumed | Phase 1 flagged that this clause delegates to controls whose strength is unverified (its C6). I drilled it: a mutant at the verb's own identity gate in tools/e2e/scripts/brief.mjs reds all three preflight seat bodies. The pin holds after the sharing |
| 2c | no body gains a skip or a runner-only branch | MET | No `skip`, `fixme`, `only`, `test.slow`, retry or timeout change anywhere in the diff. Every environment read in the new module reviewed BY HAND, not by keyword: three, and none is a predicate — `process.execPath` twice (the binary to link, the binary to spawn) and one unconditional `process.env` spread. The stand-in is installed by the identical path on every machine. Playwright's `retries: 0` and `workers: 1` are untouched, so phase 1's A2.4 has nothing to hide behind |
| 3a | the closing check's owed set for the range includes the push-guard spec | MET as a RESULT, not as set membership | Phase 1 called the membership half degenerate and asked for the result instead. I re-ran the owed set of the range myself at be9d6a25: parser exit 0 / 413 bodies / GREEN, app exit 0 / 1171 bodies / GREEN, e2e exit 0 / **713 bodies over 13 spec files** / GREEN, tools/e2e/tests/push-guard.spec.ts among them |
| 3b | the merge's CI run read and named in the notes | CARRIED TO THE MERGE | Same structure as 1c. The notes name what the integrator must record: the run id, the sha it ran on, and the conclusion of the shard carrying the push-guard spec |

#### What I measured that the lane could not, and what it confirms

The property this card repairs is invisible to a local suite, so I built
the runner's condition instead of trusting either side's word for it: a
process whose parent exits is reparented to the reaper, and the identity
walk then ends there with no harness anywhere. Three readings, at the
tip:

- an ordinary foreground node process — identity OK, the ancestor being
  this seat's own harness two levels up;
- the same script reparented — identity NOT OK, the walk ending at the
  reaper, which is the runner's answer verbatim;
- the same script reparented and started through the stand-in symlink —
  identity OK, and the pid it answers with is the stand-in's OWN.

That third reading is the whole mechanism, and it holds where no harness
exists. The runner's own record agrees independently: in CI run
34772159066 at 8d26c8c5, shard 2 of 4 is `failure` and shards 1, 3 and 4
are `success` — and shard 3 is the one carrying the preflight spec,
whose seat bodies have run under THIS stand-in since T-238. I read that
run through the API rather than taking the citation's word for it; the
sha and all four shard conclusions match what the notes claim.

Main is STILL red at the newest run on the integration branch,
34779927372 at e528a5d5 — `e2e shard 2 of 4`, step `e2e lane`, a job
that ran three and a half minutes with steps rather than failing in
seconds. So the card's premise had not moved out from under it at the
base, and this lane is the repair rather than a fix for something
already gone.

#### The mutants

| # | where it sits | ancestry | what died |
|---|---|---|---|
| M1 | `seatVerb` reverted to the base's direct spawn | reparented | the 2 named bodies. **Under a local harness the same mutant is GREEN** — which is the defect's whole shape, stated as a measurement |
| M2 | the shared module's single naming site | reparented | 5 bodies across BOTH specs (3 preflight, 2 push-guard) |
| M2 | the same mutant | local harness | ONLY the added control body. Every other body stays green — the added body is the only thing in the tree that sees this |
| C3 | the verb's OWN identity gate in tools/e2e/scripts/brief.mjs, inverted so it answers COULD NOT RUN with the ancestor INTACT | local harness | both named bodies. They still pin the exact exit codes; they did not relax to "not 2" or start accepting 3 |
| C4a | the guard is installed but its line is not announced | local harness | body one only |
| C4b | a holder record IS written over a refused install | local harness | body two only |
| D1 | DATA: the no-session checkout replaced by the repository root | local harness | nothing. An unpinned parameter — see the note below |
| D2 | DATA: `maxBuffer` squeezed to 512 bytes | local harness | body one. The new parameter is load-bearing and exercised |

Every mutant was reverted with `git checkout --` and the bench confirmed
clean after each; tools/e2e/scripts/brief.mjs is outside this fence and
is byte-identical to the tip.

D1 is worth stating plainly rather than burying: the `projectDir` the
new `seatVerb` passes is not pinned by any body — point it at the
repository root instead and all three seat bodies stay green. The
executor found the same thing, ran it as a probe rather than a mutant,
and disclosed it. I checked the argument it rests on against the arm
itself: the stale-checkout catcher is armed by `--preflight`,
`--write-fence`, `--dispatch-lane` and `--merge` and by nothing else, so
the seat arm genuinely does not consult it. The parameter buys
determinism and disarms no guard. Accepted as an argued, unpinned
choice.

#### The attack set, answered

Every entry was probed at the tip; the sharing pilot means an attack the
executor answered by name is evidence of a body and not of a property,
so each was re-asked of the tree rather than of the notes.

- **A1.1 and S5 — fix the walk, not the spawn.** Dispositive and clean:
  the diff moves six paths, three of them the card and the two cards the
  lane filed, three of them the fenced test files. tools/e2e/scripts/checkout-currency.mjs
  is untouched. Phase 1's C1 — that the verb STILL answers exit 3 with
  no harness ancestor — is proved by M1 under the reparented tree, which
  reaches the verb by a path that does not route through the helper at
  all.
- **A1.2, A1.3, C2 — copied or nominally shared.** Closed by M2 reddening
  both specs and by the owed set's 2-spec ownership. The preflight
  spec's three local names are one-line binders over the module; no
  shadowing, no type-only import.
- **A1.4, A1.12, C5 — only the two named bodies converted.** Enumerated
  over the SPAWN HELPER rather than over the flag spelling, as phase 1
  required: tools/e2e/scripts/brief.mjs is named at exactly one site in
  the push-guard spec, inside `seatVerb`, and every seat-verb call site
  in that file goes through it — five `--take-seat` and one
  `--release-seat`, so A1.12's second verb is covered by the same
  mechanism. The remaining seat-verb sites in the test tree are the
  preflight spec's nine under the stand-in, the currency spec's, which
  stub the process table on PATH, and a handful where the identity is
  never derived because the not-integration branch is taken first. A
  keeper that would enforce this mechanically is filed as T-314-s8.
- **A1.5 — harness-shaped by coincidence.** The attack that produced the
  card, and the one a local green cannot answer. Answered three ways: my
  reparented reading, the added control body asking the claim of the
  PRODUCTION derivation from inside the stand-in, and shard 3's record
  on the runner itself.
- **A1.6, A2.3, A2.5 — green by not running, or by relocation.** Body
  counts 123 at the base and 124 at the tip for the push-guard spec, 59
  and 59 for the preflight spec: exactly one body added, none removed,
  none retitled. Both titles the card quotes are present verbatim, once
  each, and both ran in my own graded e2e leg.
- **A1.7 and C3 — green by asserting less.** Closed by the C3 mutant,
  which sits at the verb's exit path with the ancestor intact — the site
  phase 1 named, and NOT the helper-side site phase 1 warned would prove
  the other property. See assigned correction 1.
- **A1.8 and C4 — the guard property lost in the conversion.** Closed by
  C4a and C4b, each of which reds only its own body. The conversion
  hollowed nothing.
- **A1.9 — the install-failure precondition faked by the stand-in.** It
  is not: the precondition is a git config written into the fixture, and
  body two asserts the failure explicitly by the code's own sentence in
  stderr, independently of the helper.
- **A1.10, A2.4, C9 — parallelism and retries.** `workers: 1`,
  `retries: 0`, both untouched. Every stand-in directory and the
  no-session checkout come from `mkdtemp`, so there is no fixed path for
  concurrent bodies to race on.
- **A1.11 — the stand-in outlives the body.** It cannot: every run is a
  synchronous spawn that is waited on, and the scratch directories are
  torn down in this spec's own `afterAll`.
- **A2.1, A2.6, C6 — the same assertions in a weaker world.** Closed by
  C6, above. The preflight spec's binders pass that spec's own two
  module constants, so the world behind its assertions is the world it
  always had. The e2e leg's 713 bodies carry no timeout.
- **A2.2 and C8 — a runner-only branch by another name.** Closed by the
  hand review of every environment read in the new module.
- **A3.1 — membership is not execution.** Closed by my own graded run.
- **A3.2, A3.3, A3.4, C7 — a run id with no reading behind it.** The one
  run the notes cite was checked against the API: the sha, the four
  shard conclusions and the failing job's duration all match. It is the
  RED run rather than the merge's, and the notes say so.

#### The security sweep

- **S1 — injection through the stand-in's spawn.** No shell anywhere:
  arguments are arrays, and every caller-supplied string reaching the
  generated script goes through `JSON.stringify`. The two numeric
  parameters are typed as numbers and stringified. Clean.
- **S2 — a test double of an identity control.** The stand-in is
  confined to the test tree and reachable from nothing the verb ships,
  and the real check still refuses an unnamed session — M1 under the
  reparented tree is exactly that proof. It is worth recording that the
  derivation's acceptance rests on a program basename, so the stand-in
  works by genuinely BEING what the derivation accepts rather than by
  bypassing it; that is a pre-existing property of the derivation, which
  the module's own header argues, and not something this card
  introduces.
- **S3 — predictable temp paths.** Every one is a `mkdtemp`.
- **S4 — the environment in the spawn.** The child inherits the
  environment exactly as the base already did, and nothing dumps it into
  test output; failures print the child's own stdout and stderr.
- **S5** — see A1.1. No hunk outside the fence.

#### Where phase 1's ten measurement requests were answered

The scripted ground answers **M1 in part** (the fenced blobs, and the
body names of both specs at the base) and **M9** (the helper's home is
absent at the base, confirmed rather than assumed). The rest are my own
reading at the tip and are named as such: **M2** and **M3** by reading
the derivation and the base's three helper bodies; **M4** by reading the
preflight spec's nine seat invocations and then ARMING them with C6;
**M5** and **M7** from the playwright configuration, which the diff does
not touch; **M6** from run 34772159066 through the API; **M8** by the
enumeration above; **M10** from the integration branch's run list. M1's
timing half was not in the ground and I took the e2e leg's own figures
instead. Nothing was refused and nothing was assumed.

#### The assigned corrections

**Correction 1 — the drill the notes call C3 sits at the helper, not at
the verb. Wording; it carries no mutant block.** Under "The drills", the
MUTANT B bullet ends "which is the attack set's A1.7 and C3". Mutant B
mutates the status the STAND-IN reports, and the attack set names that
exact substitution as the form which proves the OTHER property: its A1.7
says the mutant must sit at the verb's exit path with the ancestor
intact, and that a mutant applied to the fake harness instead is the
control failing. Mutant B is a real and useful drill and the property it
claims does hold — I drilled the verb-side form myself and both named
bodies died — but the record should not say a helper-side mutant
discharged C3. The bullet should say what mutant B sits at, and that the
verb-side form was drilled at phase 2.

**Correction 2 — the seat-verb invocation count is six, not seven.
Wording; it carries no mutant block.** The figure appears TWICE and both
sites need it, which is why it is named rather than anchored: under
"What was built", "the one helper all seven `--take-seat` and
`--release-seat` invocations in that file go through", and under "The
enumeration, by hand and recorded here", "all 7 in
tools/e2e/tests/push-guard.spec.ts, through `seatVerb`". There are six
call sites at b7274d54 and six at be9d6a25 — five `--take-seat` and one
`--release-seat`. A count of `seatVerb(` answers seven because it also
matches the declaration line. The enumeration's conclusion is unchanged
and correct; only the figure is wrong, and a figure in this project
carries its ref.

#### What the merge owes

- **THE CENSUS REGEN, before the merge commit.** One body was added, so
  `capabilities:check` answers STALE at this tip. This fence carries
  neither the census file nor the index, so the lane could not have
  fixed it; the precedent the notes cite is real — the T-300-s7 merge at
  e528a5d5 carries the census change in the merge commit itself. The
  integrator runs the regen as the last write before the merge commit.
- **THE MERGE'S CI RUN, for criteria 1c and 3b.** Both are discharged
  only there. The run's shard logs list every body by title, so the
  integrator records the run id, the sha it ran on, the conclusion of
  the shard carrying tools/e2e/tests/push-guard.spec.ts, and the results
  of the two bodies the card names BY TITLE — a shard roll-up is not
  enough, because sharding can move which shard they land in.
- **THE GRAPH REGEN FIRES** and has nothing to move: the graph indexes
  the app and the parser, and this diff is entirely under tools/e2e and
  docs/tasks.

#### The shared-pitfalls pilot

Phase 1's return was shared with the executor by the seat and read at
20:20:54Z, after the diff was written and before the drills; the
disclosure is on the card with the file's digest, and that digest is the
attack set's own, so the sharing is verifiable rather than asserted.

**Did a shared pitfall cause a concrete code or test change? YES, one:
the added body.** The notes name A1.5 as its reason, and A1.5 is the
entry arguing that a stand-in can agree with the walk by coincidence and
that a local green is by construction not evidence. That body exists
because the pitfalls file was read, it is the only body added, and it is
the only thing in the tree that reds locally when the stand-in stops
being harness-shaped — which I confirmed by drilling M2 under a local
harness, where every other body in both specs stays green. Nothing else
in the diff traces to the sharing: the helper's promotion and the
parameterisation are the card's own amendment.

The cost the pilot has to weigh against that: the executor had seen
every attack, so its answers-by-name are evidence of bodies rather than
of properties, and phase 2 had to re-ask each one of the tree. Two of
the notes' evidence claims did not survive that re-asking — both
corrections above are of exactly that kind, and one of them is an attack
the notes answer by NAME while the drill sits at the site the attack
itself rules out. That is the pilot's characteristic failure mode, it is
cheap to catch, and it is worth recording in the table beside the
benefit.

#### Postscript — the step-7 readings, at MY OWN tip

Every figure below was measured at f144a99e, the verdict commit, and not
at the tip I was sent: a reading taken at be9d6a25 is stale the moment
the verdict is appended, and the range the merge will judge is the one
that ends here.

- **The owed set of fec37e5f..f144a99e**, six paths moved, owing app,
  e2e and parser with the e2e leg narrowed to 13 spec files. All three
  GREEN at f144a99e: parser exit 0 over **413 bodies**, app exit 0 over
  **1171 bodies**, e2e exit 0 over **713 bodies**, the leg's own summary
  line reading `713 passed (6.2m)`. Run in the FOREGROUND, so this
  machine's ancestry is the one the seat verbs saw; the runner's shape
  was measured separately and is reported above.
- In that leg's own listing, the added body is `50ms` and the two bodies
  the card names are `1.0s` and `689ms`, all three green.
- **`capabilities:check` exit 1 — STALE**, committed 100133 bytes
  against a fresh generation of 100241. This is the added body and
  nothing else, it is disclosed on this card, and this fence carries
  neither the census nor the index, so the lane could not have closed
  it. It is the merge's regen and it is named again under "What the
  merge owes".
- **`index --check` exit 0 — CURRENT** at f144a99e: 1216090 bytes, 203
  files, 2593 symbols, 2488 edges; the budget line reads 1216090 of
  2145959 bytes (56.7%), 929869 left, with the floor at 240298 bytes
  (11.2%).
- **T-314-s5's known flake did not fire** in either of my graded runs —
  the push-guard body that reds when two hook runs straddle a minute
  boundary. Had it, it would have been attributed to that card and not
  to this diff.
- **The corrections assigned above are both wording and neither carries
  a mutant block**, so no correction body follows this postscript. The
  bench is clean at f144a99e, and tools/e2e/scripts/brief.mjs — the file
  I mutated four times and which is outside this fence — is
  byte-identical to the tip I was sent.
