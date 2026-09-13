---
id: T-300-s7
title: "The settings listing's tree-readings body assumes a card merged since the newest checkpoint, so the closing check reds on every push made between a checkpoint and the next merge — the listing is right (an empty window reads UNREAD by design), the body's precondition is a fact about the calendar"
feature: F-04
milestone: 4
size: M
tier: standard
priority: 1
status: verifying
suggested_by: "the Claude seat, the closing check on the range from origin/main to 37dfff4c66bbcd488383a43c0be1ffd5f55eb6b4, 2026-09-12"
blocked_by: []
touches: [tools/e2e/tests/cli.spec.ts, tools/e2e/scripts/settings.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

Absorbs: T-311-s6 (2026-09-13, ruling 5 of 2026-09-13: the checkpoint-anchor pair runs as one lane; the owner's approval of 2026-09-13). The sibling's file is removed in the same commit as this line; its two criteria sit below tagged with their source, and its full text is kept under the absorbed heading.

## The finding

The checkpoint of 2026-09-12 was committed at 37dfff4c and the closing
check ran on the docs-only range behind it (three cards' sections, the
record, STATE). The parser and app legs were GREEN at 389 and 1171; the
e2e leg was RED at exit 1 on one body of `tools/e2e/tests/cli.spec.ts`,
"the listing goes to the PROJECT'S OWN tree for its readings — the
measured column is not a rendering of numbers somebody handed in"
(T-300's verifier correction 1). Its first assertion is a precondition:
`treeReadings(repoRoot).size` must be greater than zero, with the
message "has recorded meters, so at least one loop band prices here —
the arrangement this body needs is present". It received 0. The whole
suite at f608f5fa, one commit earlier, had passed 1022 bodies including
this one.

The cause is not the tree and not the reader. `treeReadings` prices the
loop bands exactly as `npm run health` does: the window is the merges
since the newest `Checkpoint:` commit (`recentCheckpoints(1)`), and
`loopReadings` returns no reading for an empty window — by its own
comment, "an EMPTY window has no worst card, so it reads UNREAD rather
than 0". At 37dfff4c the newest checkpoint is 2026-09-12T13:06:27Z and
the newest record in `docs/checkpoints/meters.jsonl` is T-303-s1's at
12:08:45Z, so the window is empty, the listing correctly shows every
switch against the seat's estimate, and the body's precondition is
false. It was true at f608f5fa only because the previous checkpoint
(2026-09-10) sat behind the T-300 and T-303-s1 merges.

So the body's subject depends on the calendar: it passes whenever a
merge has landed since the newest checkpoint and reds in the gap between
a checkpoint and the next merge — which is precisely when a checkpoint
is pushed. The docs gate lists STATE and the checkpoints as code inputs,
so every checkpoint push owes this spec, and every checkpoint push made
before the next merge will red the closing check the same way. The push
guard then refuses the checkpoint, correctly, on a RED token.

## Why it is a card and not a hand edit

The listing is behaving as designed and the reader is the health
reporter's own; what is wrong is a body that asserts an arrangement the
checkout does not always carry instead of constructing it. This project
routes a body's logic through a lane with its mutants, and the seat's
follow-up on main is reserved for a comment line (T-287's follow-up).
The push of 37dfff4c is held until the next merge appends a record
inside the window, at which point the same closing check goes green with
no change to the tree — a fact this card exists to make visible rather
than rely on.

## Acceptance criteria

- WHEN the body proves that the measured column comes from the tree's own readings THE arrangement SHALL be one the body constructs — a fixture tree carrying a meters file and a `Checkpoint:` commit older than its newest record — so that the priced column is asserted on every run of the suite regardless of when the integration checkout's newest checkpoint landed; the bare control (a project with no readings shows none) SHALL stay.
- WHEN the integration checkout's newest checkpoint is newer than every meters record THE body SHALL still assert something true of that checkout: that `treeReadings` answers an empty map and the listing shows every switch as the seat's estimate naming the window, with no reading borrowed from the fixture; a body that skips in that state SHALL be refused by the verifier.
- WHEN this card lands THE closing check on a docs-only range pushed straight after a checkpoint SHALL be green on this spec, demonstrated once on a real checkpoint commit or on a fixture reproducing 37dfff4c's state, and named in the notes.
- WHEN the dispatch arm has cut the lane THE brief's row 4 base line SHALL name the commit the cut used, with the newest checkpoint stated beside it as the rule's anchor and the reason the later commit qualifies; a body drives the arm on a fixture where the stamp follows the checkpoint and requires row 4's base to equal the cut's hash. (absorbed from T-311-s6)
- WHEN no stamp follows the checkpoint THE two SHALL coincide and the line SHALL say so, pinned by the same body's control. (absorbed from T-311-s6; its condition is superseded by the amendment below)

## Amendment of 2026-09-13 — the cut and the checkpoint (proposed by the Codex orchestrator's review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — the cut and the checkpoint. The absorbed control's condition "no stamp follows the checkpoint" is superseded by "the actual cut commit equals the newest checkpoint". Only in that case shall the line say the two coincide. When the arm writes no new stamp but cuts at a later integration tip, the brief shall name that actual cut and show the checkpoint separately. Every row-4 field or create command that claims to identify this cut shall agree with its recorded hash. The recorded cut shall not be replaced by the lane's later HEAD or a later integration tip when the brief is rendered again. The fixture covers a cut after a new stamp, a cut at the checkpoint, and a no-new-stamp cut at a later eligible tip; advancing the fixture after the cut shall not change the recorded base.

## Amendment of 2026-09-13 — readings-window evidence (proposed by the Codex orchestrator's review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — readings-window evidence. The body constructs both a populated checkpoint window and an empty checkpoint window using valid meter records and explicitly ordered timestamps, and exercises both on every run through the command's own tree read, without an injected readings map. The fixture and notes identify the checkpoint and meter boundary. In the empty case, the listing shall retain its existing seat-estimate and awaiting-band text, with no reading borrowed from another project; "naming the window" requires that fixture evidence, not a new listing format. The bare-project control remains. The populated case asserts the expected reading from the fixture's supplied data. The post-checkpoint closing-check demonstration already required by this card remains.

## Absorbed from T-311-s6 — The dispatch brief's row 4 names the newest checkpoint as the base commit while the arm's own step 4 cut the lane at the dispatch stamp — one brief, two bases, and the executor had to choose by reading the repository (kept whole)

Title as filed: "The dispatch brief's row 4 names the newest checkpoint as the base commit while the arm's own step 4 cut the lane at the dispatch stamp — one brief, two bases, and the executor had to choose by reading the repository"

Filed as: status planned, priority 2, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts], wake None, suggested_by "executor claude-opus-5@subagent @T-311, its correction clause at a98e5a067ca815b984d133ed8b311366899499f4, filed by the seat, 2026-09-12".

### The finding (T-311-s6)

The T-311 brief, rendered by the dispatch arm at 2026-09-12T12:45:40Z, says
in row 4 "base commit: 254cf7b6", derived as the newest `Checkpoint:` commit
on main, and prints a create command substituting that hash. The same arm's
step 4, one arm earlier in the same run, cut the lane worktree at the
integration checkout's HEAD after the dispatch stamp, f608f5fa, and the
dispatch log names that hash as the base. Row 5 of the same brief names
f608f5fa as the lane's tip. So the brief carries two commits called the base,
and the executor resolved it the right way — the repository wins, `git
rev-parse HEAD` in the lane — and reported it in its correction clause.

The base rule permits the cut: a non-merge commit after the checkpoint
qualifies when its own gates are green, and the dispatch stamp is exactly
that. Row 4 simply quotes the rule's anchor as if it were the cut. A brief
whose base line the executor must correct on every dispatch is a line that
teaches executors to distrust the brief.

### T-311-s6's acceptance criteria as filed (absorbed into the criteria above)

- WHEN the dispatch arm has cut the lane THE brief's row 4 base line SHALL name the commit the cut used, with the newest checkpoint stated beside it as the rule's anchor and the reason the later commit qualifies; a body drives the arm on a fixture where the stamp follows the checkpoint and requires row 4's base to equal the cut's hash.
- WHEN no stamp follows the checkpoint THE two SHALL coincide and the line SHALL say so, pinned by the same body's control.

### T-311-s6's Implementation notes (as filed, empty)
<!-- executor appends before finishing -->

### T-311-s6's Verdicts (as filed, empty)

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 2, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.

## Implementation notes
<!-- executor appends before finishing -->

Built by the executor seat, claude-opus-5 subagent, in the lane worktree
on branch task/T-300-s7-the-checkpoint-anchor-readings-window-and-row-4-base,
cut at 63555a5d2290 (the dispatch stamp).

**THE VERIFIER'S PHASE-1 RETURN WAS SHARED WITH ME BY THE SEAT** under
the shared-pitfalls pilot of 2026-09-13 (the owner's ruling, recorded in
docs/rooms/loop-cost-and-speed.md). I read it at 2026-09-13T17:54Z,
before writing a line of the implementation, as the file named
pitfalls-T-300-s7.md in this lane's scratch directory, sha256
54520f495ef3f3836d258b86d999d0fa7d504b22a419d853457636677c038f20. Its
attacks A1.6, A1.8, A2.5, A4.1, A4.3, A4.4, A5.2 and A5.4 are each
answered by a named assertion below; its measurement requests M1 to M14
are the verifier's asks of the seat and were not mine to answer, though
M1, M3, M7 and M11 were taken here because the build needed them.

### The criteria echo

Written per criterion from the card before the code, and transcribed
here afterwards; the reading it records is the one the design was built
against, and the checklist FORM is what is late rather than the reading.

1. The priced column is asserted from an arrangement the body BUILDS, not
   from whatever the calendar leaves in the checkout, and the bare
   control stays.
2. The empty-window state is asserted honestly rather than skipped:
   an empty map, the seat-estimate and awaiting-band text, nothing
   borrowed.
3. The closing check on a docs-only range pushed straight after a
   checkpoint is green on this spec, demonstrated once and named here.
4. Row 4's base names the commit the cut used, with the newest
   checkpoint beside it as the anchor and the reason the later commit
   qualifies, driven through the arm on a fixture.
5. The two are reported as coinciding only where the actual cut EQUALS
   the newest checkpoint, which supersedes the absorbed condition about
   a stamp.

### What the window really is, measured rather than paraphrased

The card's prose says the window is "the merges since the newest
Checkpoint: commit". The mechanism is a comparison of TIMESTAMPS: each
card's record is priced against that card's own dispatch-stamp commit,
and the window keeps the cards whose merge second is at or after the
newest checkpoint commit's second. A fixture built to the prose (a
checkpoint, and a merge commit after it) and one built to the mechanism
are different trees, and the fixtures here are built to the mechanism.
This is stated because a populated case built to the prose could be an
empty window wearing a pass.

### The readings body

One body, the one this card names, rewritten rather than added to. It
now builds four arrangements and exercises every one of them on every
run, each through the command's own tree read with no readings map
handed in:

- A POPULATED window: this repository's schema and template, a meters
  file holding one valid record at 2026-01-02T01:00:00Z for a standard
  card, a dispatch-stamp commit at 2026-01-02T00:45:00Z and a
  `Checkpoint:` commit at 2026-01-02T00:50:00Z. Every commit date is
  written into the fixture rather than taken from the clock. The body
  computes the two expected shares from those numbers and the project's
  own tier budgets (fifteen minutes against seventy-five is 20 percent;
  31,000 tokens against 310,000 is 10 percent) and requires the listing
  to carry exactly those figures in the bands' own units.
- The SAME records with the `Checkpoint:` moved to 2026-01-02T02:00:00Z.
  One date differs and nothing else does, so what the pair measures is
  the window. The reader answers an empty map, the listing carries no
  band figure at all, and every switch that names a loop band stands at
  the seat's estimate in the text the listing printed before this card.
- The populated arrangement with TWICE the tokens, which requires the
  column to double. A body that survived that mutation would be
  asserting that something was printed.
- The BARE control: the same schema and template, no meters file and no
  history. It is a separate arrangement from the empty window on
  purpose, because an empty window and an absent record are two
  different reasons for an empty map and one fixture answering for both
  would be one act arming both sides.

And the integration checkout is still spoken about rather than dropped.
One unconditional assertion holds in both states: every switch's
measured column equals what THIS tree's own reading renders, which a
command reading an injected or cached map fails whatever the calendar
says. Beneath it the state is NAMED, with a failable assertion in each
arm. The listing's format is untouched: naming the window is fixture
evidence here, not new output.

### Row 4's base

Row 4 now names the commit the lane was cut at, derived as the merge
base of the lane's branch against the integration branch, which is the
hash `git worktree add` was handed and does not move when either ref
advances. Beside it, on their own lines, stand the rule's anchor (the
newest `Checkpoint:`) and the reason this base is the one the rule
admits, derived from the history: how far past the anchor the cut sits
and whether it is a merge commit. Where no lane is cut the row says so
and reports the anchor as the anchor. A cut the rule does NOT admit (a
merge commit, a commit behind the checkpoint, a commit off the
first-parent line) is a FINDING naming both commits, not a silent base.
The create command substitutes the same hash, so the field a dispatcher
pastes agrees with the field a reader reads.

The coincidence line is keyed on the cut EQUALING the checkpoint and on
nothing else. The absorbed card's condition (no stamp follows the
checkpoint) is satisfied by an arm that writes no stamp and still cuts
at a later integration tip, and that arrangement is one of the three the
fixture drives.

Measured live at this lane: the brief handed to this seat says
`base commit: d19fe25b` and the cut was `63555a5d`. Re-rendered in this
worktree after the change, row 4 says `63555a5d` while row 5's tip had
already moved to `d4c1ef68` under it.

### Criterion 3, demonstrated

The lane checkout was put into 37dfff4c's state and the spec was graded
there. Reproduced by a scratch docs-only commit whose subject opens with
`Checkpoint:` (it touched this card only, and was reset away afterwards;
its hash was fc9fc3ba). At that commit the newest `Checkpoint:` was
2026-09-13T18:15:57Z and the newest meters record 2026-09-13T16:58:12Z,
so the checkpoint was newer than every record and the reader answered an
empty map, which is the arrangement the card's finding describes.

- What such a range owes, derived and not assumed: the owed set for the
  range HEAD~1..HEAD at that commit is the parser, app and e2e legs,
  with tools/e2e/tests/cli.spec.ts named in the e2e set. The same answer
  comes back for a real docs-only range already on the branch
  (7b897ccf..d2c3a44f).
- The graded reading, through the blessed gate runner:
  `gate-run.mjs e2e --owning tools/e2e/tests/cli.spec.ts` at
  fc9fc3ba, exit 0, 60 bodies, verdict SCOPED-GREEN.
- THE CONTROL, where the fix is absent: the base-ref version of the spec
  file was checked out over the fixed one at that same commit and the
  same body was run. It failed with its own precondition message,
  "Expected: greater than 0, Received: 0" — the card's finding
  reproduced live, at the same ref where the fixed body is green. The
  spec file was restored and the restoration proved by sha256
  (a1d8b3e4cd4de119e4d360f4f3495dcc81f730f8d6404e1477806c09d9fcafe5
  before and after).

Worth recording beside it: at the lane's own tip the reader answers TWO
bands, because the T-314 merge appended a record after the checkpoint
d19fe25b. The calendar had already flipped this body back to green with
no change to the tree, which is exactly why the card says a constructed
fixture is owed rather than a re-run.

### In-fence follow-through

- `ritualFixture` in tools/e2e/tests/brief.spec.ts gained two options, a
  card text and a commit date, both defaulted so every existing caller
  is unchanged. The card text is the only way to arrange a dispatch that
  writes no stamp commit, because the pre-stamped card has to be inside
  the `Checkpoint:` commit itself.
- Row 4's reason line does NOT quote the cut commit's subject, though an
  earlier draft did. A subject is a message rather than a fact about the
  history, and the end-to-end ritual body compares two dispatches of one
  card whose stamp messages deliberately differ; a brief value that
  moved with it made that body red. The refusal still quotes the subject,
  because a refusal has to say what it saw.

### The drills

Nine mutants, each planted at the site its property lives, each shown
RED, each restored and the restoration proved by sha256 (before and
after equal on every one).

| id | site | mutant | killed by |
|---|---|---|---|
| D1 | the spec's fixture | the populated window's checkpoint moved past the record | the readings body |
| D2 | the spec's fixture | the empty window's checkpoint moved behind the record | the readings body |
| D3 | the readings reader | an empty window answers a 0 reading instead of UNREAD | the readings body |
| D4 | the readings reader | a module-scope memo, so the second project gets the first's map | the readings body |
| D5 | the listing | the command renders an empty map instead of going to the tree | the readings body |
| D6 | row 4 | the base derived from the newest checkpoint again, the defect restored | the row-4 body |
| D7 | the base verdict | coincidence keyed on the cut being the integration TIP | the pure-half body |
| D8 | the cut read | the cut read as the integration ref's head rather than the merge base | the row-4 body |
| D9 | the base verdict | the coincidence reason replaced by the generic one | the row-4 body |

D9 SURVIVED the pure-half body and was killed by the body that drives
the arm, which is recorded rather than smoothed over: the pure half
owns the condition and the arm's body owns the sentence.

### Figures, each with its ref

- Base: 63555a5d2290. Code tip before the cards and these notes:
  21c1e9c5.
- End-to-end bodies: 1077 at the base, 1079 at 21c1e9c5. brief.spec.ts
  128 to 130; cli.spec.ts 60 to 60, because the readings body was
  rewritten rather than added to.
- The graph at 21c1e9c5: `index --check` reports CURRENT, 203 files,
  2593 symbols, 2488 edges, exit 0. GRAPH REGEN fires by its trigger and
  has nothing to regenerate here; the integrator re-derives at the merge.
- The behaviour census at 21c1e9c5: STALE, 99770 bytes committed against
  100017 fresh, because two test names were added. The regeneration is
  the merge's, and docs/CAPABILITIES.md is outside this lane's fence.
- The graded run of the suites this fence owes is at the tip this commit
  makes, run once after it, and its figures are in the executor's report
  and in the merge's meters record.

### Suggested cards

- T-300-s10: the commit a lane was cut at is now answered by two
  derivations, and the merge-base one holds only while a lane never
  merges the integration branch into itself, which nothing enforces.
- T-300-s11: the readings reader catches every failure, so a corrupt
  meters file and a project with no records are one answer on the
  listing.

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 1, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.

### 2026-09-13 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

One pass at the STANDARD tier, taken on the bench worktree `supertaskr-V-T-300-s7`
detached at the lane tip `751d741ae84f9c9f7bf6d465ef76e028abf6c8ba`, against the base
`63555a5d229056cc49fd699fbb64347823fb94ec`. Every figure below names the ref it was
measured at.

attack set: sha256:54520f495ef3f3836d258b86d999d0fa7d504b22a419d853457636677c038f20 (attack-set-T-300-s7.md)
ground: sha256:10100c883a094f102f15d0aa5a11c803d7537cdb433d2afac2166710c08af724 (ground-T-300-s7.md)
card at the base: sha256:7fd4ec04c4c20c07d744120dafffb6fa6372b5000c8dd2689af0db7fb9148fd6

All three digests were re-computed on this bench before the diff was opened and each
matched the sealed copy.

#### The frame I actually had

Two spawns, genuine. Phase 1 was its own tool-less spawn; the attack set was written and
hashed against the card at the base, and this spawn opened the diff before the notes and
the notes before the executor's step-5 report. The brief names the tier, so there is no
tier fault.

**One executor-derived fact reached me above the line, and the dispatcher put it there on
purpose**: the brief's step-7 paragraph names T-314-s5 as a card filed by this lane's
executor, so that I would attribute a push-guard intermittent by name rather than to this
diff. It told me one card id and nothing about the work, and it never reached phase 1,
whose return names no such thing. I record it because a later reader cannot otherwise tell
a clean frame from one with a single disclosed hole.

**THE SHARED-PITFALLS PILOT.** The executor was handed phase 1's return as its pitfalls
file at 2026-09-13T17:54Z, before it wrote a line of the implementation, and its notes
disclose that with the same sha256 I cite above. So I graded every attack the sealed set
names as evidence of a BODY rather than of a property, read the bodies, and probed past the
set. What that probe found is the first assigned correction, and the pilot line at the end
of this verdict states the figure the pilot's table wants.

**This brief carries no CONTEXT PACK** — its postscript is ground rules and paths, and
names no `docs/CONVENTIONS.md` bullet, no component entry and no method file beyond the
role. This role's step 0 calls that a dispatch fault and answers it by reading the document
end to end. I read it whole, 2407 lines, and say so here as that step requires. Phase 1
pre-committed to this disclosure, sight unseen, in its own return. Four of its bullets paid
for the reading inside this pass: the PIN THE DEFAULT BRANCH rule, which the new fixture
obeys and cites; DISPATCH FROM THE LAST CHECKPOINT, whose own caveat — that a later
non-merge commit is safe on the graph count and trusted for its own green gates, "by
PRACTICE, verified, NOT by property" — is the sentence row 4's new reason line has to be
faithful to, and is; the POISON DRILL's restore-and-prove-by-sha256 clause, which every
mutant below obeys; and the cheap keeper that forbids this machine's home directory in an
added line, which is why every path in this verdict is spelled from the repository root.

#### A row per acceptance criterion

Five criteria and two amendments, one row each.

| # | Criterion | Verdict | The evidence that decided it |
|---|---|---|---|
| C1 | The priced column is asserted from an arrangement the BODY constructs — a meters file and a `Checkpoint:` older than its newest record — on every run; the bare control stays | MET | `windowProject` in `tools/e2e/tests/cli.spec.ts` builds a real git tree (`git init -q -b main`, the default-branch rule), writes `docs/checkpoints/meters.jsonl` with ONE valid record at `2026-01-02T01:00:00Z`, and commits the card's `dispatch stamp` at `00:45:00Z` and a `Checkpoint:` at `00:50:00Z` with `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` WRITTEN, never clocked. The body derives the two expected shares from the fixture's own numbers against `TIER_BUDGETS` — 15 min against the standard tier's 75 is 20 %, 31,000 against 310,000 is 10 % — and requires the listing to carry exactly those strings. The bare control is a SEPARATE `settingsProject()` with no meters and no history, and it is ARMED: drill V6 below kills it ALONE. |
| C1a | …and the arrangement is built to the READER's mechanism rather than to the card's prose | MET, and this was the attack I expected to pay | The card narrates the window as "the merges since the newest `Checkpoint:`". Read at the tip, the mechanism is a TIMESTAMP comparison: `loopReadings` keeps `cards.filter((c) => c.mergedSec >= sinceSec)`, `mergedSec` is the maximum `atSec` of the card's own records, and `sinceSec` is `recentCheckpoints(1, root)[0].sec`. The fixture carries NO merge commit at all and turns on exactly that comparison, which is the mechanism and not the prose; the executor's notes state the difference before the diff does. A fixture built to the prose would have been an empty window wearing a pass. |
| C2 | In the empty-window state the body still asserts something TRUE of the integration checkout — an empty map, every switch at the seat's estimate naming the window, nothing borrowed — and never skips | MET, with the letter-gap I pre-committed to recording | Two constructed fixtures differing in ONE date carry both windows on every run: `treeReadings(empty).size` is asserted 0, the listing is asserted to contain no `measured: loop/` at all, and every band-naming switch is asserted at `measured: the seat's estimate — <cost> (awaiting <bands>)`. The live checkout is still spoken about: one UNCONDITIONAL loop asserts every row of `settingsRows({ ...loaded, readings: treeReadings(repoRoot), units })` appears in the command's own output, which is what pins the command's readings to THIS tree's read; then a named-state arm with a failable assertion on each side. No `skip`, no `fixme`, no assertion-free branch. The LETTER-GAP, recorded as phase 1 pre-committed: "that `treeReadings` answers an empty map" is the branch CONDITION in the live half rather than an assertion there — it is asserted on the constructed fixture instead. I do not reject for it (the pre-commitment was explicit), and the unconditional loop covers "every switch as the seat's estimate" in both states. |
| C2a | "Naming the window" is fixture evidence, and the listing's existing seat-estimate and awaiting-band text is retained | MET, structurally | `tools/e2e/scripts/settings.mjs` and `tools/e2e/scripts/health-bands.mjs` are BYTE-IDENTICAL at the base and at the tip — blob `31cc96026f28f0a45c46c99d1589154e38677214` and `a60183ef1168d50a12a01b1dfb7e1a70ca06c0df` at both refs. The listing's format could not have changed, and the highest-value attack in the sealed set — greening everything by making an empty window read 0 instead of UNREAD — is ruled out by the diff's own shape rather than by an assertion. |
| C3 | The closing check on a docs-only range pushed straight after a checkpoint is green on this spec, demonstrated once and named in the notes | MET, and re-demonstrated at MY OWN ref | The executor demonstrates it at `fc9fc3ba` and names the range, the command, the exit, the count and the control in the notes — the five fields I said I would grade by hand. I did not take its word. On this bench I planted an empty `Checkpoint:` commit dated after the newest meters record, making `treeReadings(repoRoot)` answer 0 bands — 37dfff4c's state, reproduced at `3cf369af6f8f980e19044b0d362ac2c998157e09`. There the FIXED spec is `SCOPED-GREEN, exit 0, 60 bodies`; the BASE-ref spec checked out over it at the same commit is `SCOPED-RED, exit 1, 60 bodies`, failing on its own precondition, `Expected: > 0, Received: 0`. Restored and proved by sha256 `a1d8b3e4cd4de119e4d360f4f3495dcc81f730f8d6404e1477806c09d9fcafe5` before and after, and the bench reset to the lane tip. The card's finding and its repair, side by side at one ref, measured by this seat. |
| C4 | Row 4's base names the commit the CUT used, with the checkpoint beside it as the anchor and the reason the later commit qualifies; a body drives the ARM on a fixture where the stamp follows the checkpoint | MET | `laneCutCommit` derives the cut as `git merge-base <lane branch> <integration ref>`; `baseVerdict` puts that in the base field, the newest `Checkpoint:` on its own line labelled the rule's anchor, and a reason DERIVED from the history — the distance past the anchor and whether the commit is a merge — never a constant. The `create:` command substitutes the same hash, which is the field a dispatcher pastes. The e2e body drives the real CLI's `--dispatch-lane` against three `ritualFixture` trees and reads the cut from the ARM's OWN dispatch ledger (`base hash:`) rather than re-deriving it, asserts the arrangement is what it claims to be BEFORE the subject, and compares FULL 40-hex hashes with no prefix slack. A cut the base rule does not admit — a merge commit, a commit behind the checkpoint, one off the first-parent line — is a FINDING naming both commits rather than a silent base. |
| C5 (as amended) | The line says the two COINCIDE only where the actual cut EQUALS the newest checkpoint | MET, and the supersession is pinned directly | This is the criterion-level failure phase 1 expected, and it is not present. `baseVerdict`'s condition is `cut === checkpoint` and nothing else. The pure body drives the exact shape the SUPERSEDED condition would have got wrong: a cut at the integration TIP, where no stamp was written and the two still do not coincide, asserted `false`. The e2e body's `laterTip` arrangement drives the same shape end to end through the arm — a pre-stamped card, so no stamp commit is made, and one later NON-MERGE commit on the integration branch — and requires the base line to carry neither the anchor's hash nor the word COINCIDE. |
| AM1 | Every row-4 field and the create command agree with the recorded cut; the recorded cut survives a re-render; three fixture cases; advancing the fixture after the cut does not change the base | MET for the integration-tip half; UNPINNED for the lane's-own-HEAD half — **correction 1** | The re-render arm appends two commits to the integration branch in each of the three arrangements and requires row 4's base to hold while row 5's tip MOVES — the asymmetry that separates "recorded the cut" from "froze the output", which the sealed set named and the executor built. Three arrangements, each carrying an assertion the other two would fail. What no body drives is the amendment's OTHER named half, "the lane's later HEAD": no arrangement ever commits on the lane branch, so a derivation reading `git rev-parse <lane branch>` instead of the merge base answers correctly in all three. Drill V5 below plants exactly that and SURVIVES the whole of `brief.spec.ts`. The implementation is RIGHT — the merge base does not move when the lane commits — and the amendment's sentence has no keeper under it. Correction 1 supplies one. |
| AM2 | Both windows constructed from valid records with explicitly ordered timestamps, both exercised every run through the command's own tree read, no injected readings map; the empty case keeps the existing text; the populated case asserts the expected reading from the fixture's supplied data | MET | Both windows are constructed and both run unconditionally; `listingOf` passes `--root` and NOTHING else, so the only path from fixture bytes to the asserted column is the command's own tree read — no stub, no map, no env var, and `settingsMain`'s signature is untouched. The timestamps are five written constants, not clock readings, and the two fixtures differ in exactly one of them. The populated case asserts the VALUES, and a third arrangement with twice the tokens requires the column to double: drill V3 below kills that arm with a data mutant. The empty case's expected text is the listing's own, unchanged by construction (C2a). |

#### The drills — four of my own, planted past the sealed set

Each was read back from `git diff` before its run, restored, and the restoration proved by
sha256. The executor's own nine are in the notes; these are mine, and three of the four are
aimed where the shared set did not point.

**V5 — THE SURVIVOR, and this pass's finding.** In `tools/e2e/scripts/dispatch-brief.mjs`,
`laneCutCommit`'s `git merge-base <branch> <integrationRef>` replaced by
`git rev-parse <branch>` — the cut read as the lane branch's own HEAD. The whole of
`brief.spec.ts` stayed GREEN, `exit 0, 183 bodies` at `751d741a`, the row-4 body and the
pure-half body among them. The reason is structural, not an oversight in the assertions:
every fixture advances the INTEGRATION branch between renders and none of them ever commits
on the LANE, and a lane that has committed is not an exotic state — it is every lane, from
its first commit onward, and it is the state a brief is re-rendered in. The amendment of
2026-09-13 names both halves in one sentence; the sealed attack set named the integration
half (A4.1, A5.4, CTRL-B) and not this one, and the diff's coverage tracks the set. That is
correction 1, and it is also the pilot's own signature.

**V2 — the reader's window removed (the X1 attack, at the site it lives).** In
`tools/e2e/scripts/health-bands.mjs`, `loopReadings`'s window filter replaced by
`const window = [...cards];`, so an empty checkpoint window prices everything. RED, and by
the assertion's own sentence: *"the only difference from the populated fixture is the
`Checkpoint:` date … so an answer here is the window not being applied at all"*,
`Expected: 0, Received: 2`. The empty-window arm is genuinely armed against the one change
that would have greened this card's original body without building anything.

**V3 — a DATA mutant, where the property lives.** In the fixture itself,
`const tokens = opts.tokens ?? WINDOW_TOKENS` replaced by `const tokens = WINDOW_TOKENS`,
so the fixture ignores the numbers it is asked for and the "doubled" arrangement becomes
the populated one. RED: *"twice the tokens in the record is twice the share in the column"*,
`Expected: 20, Received: 10`. The priced column is a DERIVATION of the fixture's supplied
data and not a shape, which is the sealed set's A1.6 and the amendment's own last sentence.

**V6 — the bare control, evaluated where its arrangement is absent.** Phase 1 pre-committed
to checking that "the bare control SHALL stay" had not been graded satisfied by a body
merely continuing to exist. In `tools/e2e/scripts/settings.mjs`, `treeReadings`'s
no-records early return made to answer ONE band instead of none — a project that has
recorded nothing, priced anyway. RED: *"a tree with no recorded meter prices no band"*,
`Expected: 0, Received: 1`, and the empty-window arm does not notice, because that fixture
HAS a record and never reaches the mutated line.

**Containment.** V2 kills the empty-window arm and not the bare control; V6 kills the bare
control and not the empty-window arm; V3 kills the value arm and neither of those; V5 kills
only the body correction 1 adds. No kill set here contains another, so an empty window and
an absent record really are two arrangements rather than one act arming both sides — the
defect step 2b says this method produces most, checked and absent. Correction 1's body and
the existing row-4 body likewise: V5 kills mine alone, and the executor's own D9 (the
coincidence reason replaced by a generic one, recorded in the notes as having SURVIVED the
pure half) kills the existing one and not mine.

**And the criterion that could not have caught an unarmed control.** C1's "the bare control
SHALL stay" is degenerate as written — it is satisfied by a body continuing to exist, and
nothing in its letter asks whether the body can still fail. It is armed here, by V6; the
criterion is not what established that.

#### The suites, at the tip I was sent

`gate-run.mjs e2e --range 63555a5d2290..751d741a` at `751d741ae84f9c9f7bf6d465ef76e028abf6c8ba`
— the owed set of this range, derived by the runner over 7 changed paths as app, e2e and
parser, the end-to-end leg scoped to 19 owning spec files:

- parser **GREEN, exit 0, 413 bodies**
- app **GREEN, exit 0, 1171 bodies**
- e2e **GREEN, exit 0, 867 bodies**

**And a red I caused myself, recorded rather than quietly dropped.** My FIRST run of that
same set, at the same ref, came back e2e **RED at exit 1 over 867 bodies** on two
`--take-seat` bodies of `tools/e2e/tests/push-guard.spec.ts`, each reporting *"no ancestor
of pid … names this harness"* and an exit 3 where 0 and 1 were expected. The cause is my
own invocation: I launched that run detached through a bare `sh`, which removes the harness
from the process ancestry the seat verbs walk, so the arm correctly answered that a session
that cannot name itself cannot take a seat. Re-run in the foreground as a child of the
harness, `gate-run.mjs e2e --owning tools/e2e/tests/push-guard.spec.ts` is
`SCOPED-GREEN, exit 0, 122 bodies` at the same ref, and the whole ranged set re-run in the
foreground is the green above. **Nothing about the diff was measured by the first run.** The
standing lesson is a measurement one and belongs to this seat: a graded run of this suite
must be a child of the harness, because two of its bodies read the process ancestry.

The intermittent the brief names by card, T-314-s5's minute-boundary comparison in the same
spec, did not fire in either run.

#### Security sweep — mandatory at this tier

**No new dependency**: no manifest is in the range at all. **No secret, key or credential
shape**, and no home directory or account name in any added line — checked over the whole
code diff. **The one new subprocess** is `laneCutCommit`'s `git -C <root> merge-base <branch>
<integrationRef>`, spawned with an argv ARRAY and no shell, on a read-only git verb whose
two arguments come from git's own worktree porcelain and from `resolveIntegrationRef`
rather than from a user string; there is no interpolation anywhere on that path. One
observation, not a finding: the two revisions are passed without a `--` separator, so a ref
whose name began with a dash would be read as an option — unreachable here, since git
refuses to create such a branch and the lane list filters on the published `task/T-NNN-`
spelling. **Fixture construction** is `execFileSync` with argv arrays throughout; the only
interpolated value is an `mkdtemp` path passed as its own argument. **The fixture git
identity is `fixture@example.invalid`**, which the suite already carries at the base in nine
spec files — the T-295-s4 class is satisfied and the merge's forbidden-spelling keeper has
nothing to catch. The fixtures inherit the machine's global git config rather than isolating
with `GIT_CONFIG_GLOBAL`, and set `user.name`/`user.email` locally: that is the existing
convention at the base in every comparable fixture, so it is neither a new exposure nor this
card's to change. **Records parsing** is untouched — `parseMeterRecords` is not in the diff
— and the malformed-input state the sealed set asked about (a truncated final line) takes
every loop band dark through the reader's own `problems` path, which the executor filed
rather than papered over (T-300-s11).

#### Fence and surface

The diff touches `tools/e2e/scripts/dispatch-brief.mjs`, `tools/e2e/tests/brief.spec.ts` and
`tools/e2e/tests/cli.spec.ts` — three of the card's four `touches:` entries — plus the
card's own file and three filed cards under `docs/tasks/`, which every manifest carries as
always-writable. `tools/e2e/scripts/settings.mjs`, the fourth entry, is untouched, which is
the right answer and not an omission. The notes declare two `In-fence follow-through`
entries and both survive the three limits: `ritualFixture` gains two options, each
defaulted so no existing caller moves, and the reason line deliberately does NOT quote the
cut commit's subject, which is argued from the end-to-end ritual body that compares two
dispatches of one card. No change in the diff is outside that list. The three filed cards
(T-300-s10, T-300-s11, T-314-s5) each carry `## Implementation notes` and `## Verdicts` from
birth, name no path their own fence does not carry, and contain no provenance arrow and no
absolute path.

#### The pilot line

**A shared pitfall caused concrete code and test changes in this lane — yes, and here are
the ones I can name from the bodies rather than from the disclosure.** Three are structural
and would not plausibly exist without the sealed set: the THIRD fixture arrangement with
twice the tokens and the `tokens` option on `windowProject` that serves it (A1.6 — the
populated case already asserted computed shares, so this arrangement is strictly
additional); the `hashIn` helper requiring a FULL 40-hex with no prefix comparison, and the
assertion that the anchor's hash does not also sit in the base field (A4.4, A4.3); and the
re-render arm's row-5-must-have-MOVED assertion, which exists only to separate a recorded
cut from a frozen brief (A5.4 / CTRL-B, named in the body's own comment). Two more are
sharpened rather than caused: the fixture built to the reader's MECHANISM rather than the
card's prose (A1.8), which the notes argue in the attack's own terms; and the empty window
kept as a SEPARATE arrangement from the bare control (A2.5).

**And the cost is visible in the same place.** The one gap this pass found sits exactly
where the shared set stopped short of the card's own sentence: the amendment names "the
lane's later HEAD" and "a later integration tip" together, the set named only the second,
and only the second has a body. An executor that has read the attacks builds to the attacks;
a set is not a specification, and this lane is the measured instance of the difference.

#### The verdict

**APPROVED WITH ASSIGNED CORRECTIONS.** Every criterion and both amendments are met. The
card's central claim is repaired at its cause: the body no longer asserts an arrangement the
calendar supplies, it BUILDS both windows and exercises both on every run, and it does so
through the command's own tree read with nothing handed in. The reader the card affirms is
untouched — byte-identical at both refs — so the cheapest way to green this card was not
taken and could not have been. Row 4 names the commit the cut used, states the anchor beside
it, derives its reason from the history, and keys the coincidence line on `cut === checkpoint`
and nothing else, which is the amendment and not the superseded condition. Correction 1 adds
the keeper the amendment's other half never got; correction 2 is a wording repair and carries
no block.

#### Assigned corrections

**Correction 1 — the recorded cut must survive the LANE's own HEAD moving, and a body must
say so.** Committed on this bench as
*"ROW 4's BASE SURVIVES THE LANE'S OWN HEAD MOVING — the cut is what the lane was cut AT,
not where it has got to"* in `tools/e2e/tests/brief.spec.ts`. It dispatches a fourth
`ritualFixture`, reads the cut from the arm's own `base hash:` ledger line, renders, COMMITS
ON THE LANE WORKTREE at a written date, and requires row 4's base to be the cut still and not
to carry the lane's new head — and drives the exported `laneCutCommit` directly on the same
arrangement, which also makes an import the diff left unused load-bearing. Both readings
taken on this bench: **RED** against an implementation lacking the property (V5 planted),
failing on *"the cut derivation itself is unmoved by the lane's own commit"*; **GREEN**
against the implementation as it stands, `1 passed`. Restored and proved by sha256
`1bd73f7ff2030095001d55798166529feab35ce5e5d011315e2b4275a88a2361` for
`tools/e2e/scripts/dispatch-brief.mjs`, before and after. The body's spec and the block's
file are both inside the card's own fence, so no widening is owed at the merge.

```mutant
correction: the recorded cut must survive the lane's own HEAD moving
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: ROW 4's BASE SURVIVES THE LANE'S OWN HEAD MOVING — the cut is what the lane was cut AT, not where it has got to
message: the cut derivation itself is unmoved by the lane's own commit
--- old
  const probe = spawnSync("git", ["-C", root, "merge-base", branch, integrationRef], {
--- new
  const probe = spawnSync("git", ["-C", root, "rev-parse", branch], {
```

**Correction 2 — `baseVerdict`'s no-cut sentence claims more than its condition.**
CARRIES NO MUTANT BLOCK: it is a wording repair with no property to pin, and it is recorded
here so the block count's shortfall against the correction count is explained rather than
read as a body nobody wrote. The `cut === null` branch prints *"NO LANE IS CUT for this card
here"*, but `null` is also what `laneCutCommit` answers when a lane IS cut and the merge base
could not be computed — a spawn error, a non-zero exit, an answer that is not 40 hex. In
every state this arm actually produces the two coincide, which is why this is a correction
and not a rejection; the sentence is still a claim the row cannot support from the value it
branched on. Say what is true of the value: that this checkout reports no cut for this card.
The integrator applies this as prose at the merge.

#### A finding filed rather than folded in

The corner above has a second half worth a card of its own and it is NOT part of correction
2: when a lane is cut and the derivation cannot answer, row 4 silently falls back to the
anchor and labels it the anchor, which is C4's WHEN with a false answer under it. Nothing the
arm produces reaches that state, so it is an improvement rather than a failure, and this seat
proposes rather than performs. It is filed as `T-300-s12` beside this verdict.
