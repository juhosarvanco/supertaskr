---
id: T-064
title: The switch tells one story — one reading of the folder, and the tree it carries survives
feature: F-03
milestone: 3
priority: 11
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-042-s2, T-042-s3 (triage 2026-08-17). The suggestion files
are removed in the same commit as this card. Both are
`PickOutcome::Genesis` truthfulness at the same seam, both were filed
by T-042's executor and verifier respectively, and both want a RULING
between named arms rather than a hot-patch. Serialize app-shell.

Also absorbs T-063-s3 (fourth triage, 2026-08-19); its suggestion file
is removed in the same commit as this line. Same shape at a different
seam — the shell claiming more than it knows, closable only by choosing
between named arms. `startupStepPhrase("subscribe")` says *"the watcher
subscription was refused, so no file change can reach the board."* The
first clause is true. **The second is false whenever a refused
RE-subscribe leaves attempt 1's live subscription attached** — a state
`startup-recovery.test.ts` pins GREEN on purpose, because turning a live
watcher into no watcher in the name of retrying is strictly worse than
doing nothing. So the shell holds a subscribe failure while a live
`docs-changed` handler is attached, and tells the user the app cannot
recover on its own when the next file change will bring it up. They
correctly conclude they must retry or reopen; they need not.
Reachability is low but not zero — a refused invoke followed by a
refused listen — which is exactly the sort of state that shows up in a
real bug report and nowhere else.

THE THREE ARMS, none free: **(a)** a `resubscribe` step distinct from
`subscribe`, with copy saying the watcher is still live — most honest,
adds a fourth step to a type that just grew a third; **(b)** derive the
sentence from whether a subscription is HELD rather than from the step,
which the store already knows, roughly six lines, but it puts a second
fact about the subscription into shell state; **(c)** weaken the copy
for all subscribe failures, losing the consequence clause that makes
T-050's wording useful. **(b) is preferred and the ruling SHALL be
recorded before implementation**, alongside the @human copy judgment
T-063 already reserved.

TWO MEASUREMENTS OF ONE FOLDER, TAKEN AT DIFFERENT MOMENTS.
`probe = probe_plan(&canon)` runs BEFORE the rendezvous because its
answer decides whether genesis is offered at all; `snapshot =
build_snapshot(&canon, seq)` runs AFTER the ack and after the commit
because collecting earlier could produce a snapshot older than the
emit baseline. Between them sits a channel round trip with a 10 s
timeout. Write `docs/ROADMAP.md` in that window and the probe says "no
plan, offer genesis" while the snapshot ships a tree WITH a roadmap —
the interview screen over a folder that now has a plan, the exact
state criterion 5 exists to make unreachable, reached by timing rather
than by routing. What is NEW is that both readings ride the same
payload, so they CAN be compared, and nothing compares them.

AND THE TREE THE SWITCH CARRIES CAN BE DROPPED BY ITS OWN WATERMARK.
`resetDocsForProjectSwitch` KEEPS the seq watermark (the T-007
stale-drop invariant) and `applySnapshot` opens with
`if (payload.seq <= prev.seq) return prev`, so an overtaking
`docs-changed` emit for the NEW root leaves `switched` — the EMPTY
model. Measured through the real reducers by T-042's verifier:

    in-order    switch@7 -> fileCount=2 seq=7 phase=genesis
    overtaken   emit@8   -> fileCount=3 seq=8
                then switch@7 -> fileCount=0 seq=8 phase=genesis

"0 files written" over a docs/ that is not empty — the exact T-026-s4
symptom criterion 1 exists to remove, surviving one layer down.
NOT a regression either way: the branch point produced the same empty
model in the same interleaving and additionally regressed the
watermark. Criterion 1 is what makes a fix cheap for the first time —
before it there was nothing to salvage.

## Acceptance criteria
- THE SWITCH SHALL WIN, or the LATER READING SHALL WIN, and the
  choice SHALL be recorded with its reasoning before implementation.
  Preferred arm (b): if `snapshot.seq <= switched.seq` AND
  `switched.projectDir` already equals the switch's `projectDir`, the
  overtaking emit is the FRESHER measurement of the SAME folder —
  keep it instead of resetting to empty. Arm (a) — apply
  unconditionally for the genesis case with
  `max(switched.seq, snapshot.seq)` as the watermark — also keeps the
  stale-drop invariant and is acceptable if argued (T-042-s3).
- THE INTERLEAVING SHALL BE PINNED BY NAME whichever arm is taken —
  `arm_genesis` arms the watch BEFORE `apply_genesis_folder` commits,
  which is why an emit can overtake the invoke reply — so it cannot
  regress silently.
- THE PROBE AND THE SNAPSHOT SHALL NOT BE ABLE TO CONTRADICT EACH
  OTHER ON SCREEN. Preferred arm (a): re-derive `has_plan` from the
  snapshot (which already contains every docs file path) and route to
  `Picked` instead when the two disagree — one predicate, two inputs,
  the LATER reading wins, which is the truthfulness posture the rest
  of this seam takes (T-042-s2).
- IF instead the probe is kept as a decision record THEN it SHALL say
  so in its own type or doc comment ("what the folder looked like
  when genesis was decided"), and the frozen-lie window SHALL be
  named in notes rather than left implicit (T-042-s2 arm b).
- THE LIVE-CONSUMER QUESTION SHALL BE ANSWERED BEFORE THE FIELD IS
  KEPT: nothing on the genesis SCREEN renders `probe` —
  `reducePickOutcome` stores `genesisDir` and the docs model and lets
  `resolvedProbe` go null. If it has no consumer, dropping it is arm
  (c) and is cheaper than defending it (T-042-s2).
- THE RACE SHALL BE DRIVEN, not argued: a test that writes
  `docs/ROADMAP.md` between probe and snapshot and asserts the app
  does not land on the interview screen over a planned folder.
- RELATED AND NOT ABSORBED: T-026-s1 (the probe's exact-case match)
  is the other place the probe and the filesystem disagree; it stays
  parked pending the Linux lane and SHALL be re-read by whoever
  builds this. If arm (a) re-derives `has_plan` from the snapshot,
  the casing question moves with it — one predicate, one place to
  decide the rule.

Verification: headless — cargo tests through the watcher plus vitest
against the real reducers for both interleavings. @human: none.

## Implementation notes

## Verdicts

### THE RULINGS, RECORDED BEFORE IMPLEMENTATION

Built by `claude-opus-5 @T-064` in worktree `nputer-T-064` off `2036fb2`
(main's tip, a `Checkpoint:` commit — the DISPATCH FROM THE LAST
CHECKPOINT rule). This section is its own commit and it is the FIRST
commit on the branch, because three of the criteria say the choice is to
be recorded before the code and a section appended afterwards cannot
prove it was.

**RULING 1 (criterion 1) — ARM (b), THE LATER READING WINS, and the
guard is a NAMED, EXPORTED PREDICATE.** When the overtaking emit and the
switch describe the SAME folder and the switch's reading is not newer,
the emit is a strictly better measurement of that folder taken at a
strictly later moment, and throwing it away to render an empty model is
the T-026-s4 symptom the whole card exists to remove. Arm (a)
(`max(switched.seq, snapshot.seq)`) keeps the watermark too but still
DISCARDS the emit's files, so it fixes the watermark and leaves
`fileCount=0` — it answers the smaller half of the finding. Arm (b) is
preferred BY THE CARD and is also the only one that leaves the model
correct.

**ONE CORRECTION TO THE CRITERION'S OWN SPELLING, said plainly because
this repository asks its executors to trust the tree over the brief.**
The criterion reads "if `snapshot.seq <= switched.seq` AND
`switched.projectDir` already equals the switch's `projectDir`".
`switched` is `resetDocsForProjectSwitch(prev.docs)`, which is
`{ ...emptyState(), seq: prev.seq }` — so `switched.projectDir` is the
EMPTY STRING, always, and the second conjunct as literally written can
never be true. The conjunct that carries the intended meaning is over
`prev.docs.projectDir`, the model as it stood BEFORE the reset, which is
where the overtaking emit landed. `switched.seq` IS `prev.docs.seq` by
construction, so the first conjunct is unaffected. Implemented over
`prev.docs` in both halves, and the predicate is named
`genesisSwitchIsOvertaken(prev.docs, outcome)` so the two conjuncts have
one home.

**AND THE READING SEQ IS `outcome.snapshot?.seq ?? outcome.seq`, which
covers a branch the criterion does not mention.** The criterion is
written for the snapshot-bearing switch, but the snapshot-LESS branch
(`{ ...switched, seq: outcome.seq }`) has the same defect AND a second
one the criterion does not name: it ASSIGNS the switch's seq, so an
overtaking emit at a HIGHER seq is followed by a watermark going
BACKWARDS — exactly the regression the card attributes to the branch
point ("additionally regressed the watermark") and which T-042 removed
from the snapshot branch only. One guard covers both branches because
Rust stamps the carried snapshot with the switch's own seq, so the two
readings are the same number whenever both exist.

**RULING 2 (criterion 3) — ARM (a), re-derive from the snapshot, and it
is ONE PREDICATE with TWO CONSTRUCTORS rather than one predicate spelled
twice.** `PlanProbe::has_plan()` stays exactly as it is and stays the
only place that says what a plan IS. What is new is a second way to
BUILD a `PlanProbe`: `PlanProbe::from_docs_snapshot(&snapshot, git)`,
which reads the same three docs-side facts off the snapshot's own file
list instead of off a stat sweep. `apply_genesis_folder` then asks the
one predicate twice — once before the rendezvous, once after the
collect — and routes to `PickOutcome::Picked` when the later reading
says there is a plan. Routing there is sound with NO extra work because
the two paths have already converged: a genesis arm over a folder that
has a plain `docs/` IS `rearm`, the same call `open_as_project` makes,
so at the moment of the re-read the project is committed, the recursive
docs watch is armed, the sentinel is armed, the seq is taken and the
rejected candidate is cleared — the state is byte-for-byte what the
ordinary open produces, and `Picked { snapshot }` is the outcome that
describes it.

**THE RE-READ CAN ONLY EVER VETO, and that is a property worth naming
rather than a limitation to apologise for.** It runs only in the branch
where the stat probe already said "no plan", so it can turn genesis OFF
and never ON. The opposite disagreement (probe says plan, snapshot says
none) is unreachable as a screen defect: that folder was routed to
`open_as_project` before anything was armed, and a board over a folder
whose plan was deleted mid-pick is the board, not the interview.

**RULING 3 (criterion 5) — ARM (c): `probe` LEAVES `PickOutcome::Genesis`.**
The live-consumer question is ANSWERED, by measurement rather than by
reading: `git grep` over `app/src` finds ZERO reads of the genesis
outcome's `probe` — `reducePickOutcome`'s genesis case sets
`resolvedProbe: null` and stores `genesisDir` plus the docs model, and
`GenesisScreen`/`GenesisPane` render the `DocsModelState` and the
project dir. The only readers anywhere are TEST literals and the wire
pin. `PlanProbe` is untouched and keeps BOTH its live consumers — the
front door's "No plan in <folder>" checklist rides `NoDocs.probe` and
`ProjectStatus::NoDocs.probe`, and nothing here narrows those. Ruling 2
is what makes this cheap rather than merely tidy: after it, the folder
is read TWICE inside Rust and exactly ONE reading crosses the boundary,
which is what the card's title asks for. Criterion 4 is therefore the
road not taken and its obligations do not attach; the frozen-lie window
is named in the notes below anyway, because it still exists INSIDE the
Rust and the next reader deserves its bounds.

**RULING 4 (T-063-s3) — ARM (b), and the fact lands in `ShellState`
rather than on `StartupFailure`.** The sentence is derived from whether
a `docs-changed` subscription is HELD, which the store knows in
`unlistenDocs`. Arm (a) (a fourth `StartupStep`) makes the wire wider for
a copy fix and gives the log a fourth step name that means "the same
refusal, different survivor"; arm (c) throws away the consequence clause
that is the whole value of T-050's wording in the common case. WHERE the
fact goes was decided by the TREE and not by taste: putting it on
`StartupFailure` reds `tools/e2e/tests/startup-recovery.spec.ts:52`,
which asserts `toEqual({ step, message, attempt })` on that exact object
— and `tools/e2e` is a SIBLING LANE'S FENCE this week (T-061). The
card's own wording for arm (b) says "a second fact about the
subscription into SHELL STATE", so the fence-clean placement is also the
literal one. `ShellState.watcherLive` is written by the same `setShell`
that records the failure, from `unlistenDocs !== null`, and is read by
exactly one thing. THE FIRST CLAUSE OF THE COPY IS UNCHANGED IN BOTH
ARMS ("the watcher subscription was refused"), which the card says is
true and which the E2E lane asserts by substring today; only the
consequence clause forks.

**RESERVED FOR @human, not decided here** (T-064's own Verification line
says "@human: none", and T-063's notes put this on the morning list): the
WORDING of the forked clause. The code decides WHICH sentence, the human
decides what it says.
