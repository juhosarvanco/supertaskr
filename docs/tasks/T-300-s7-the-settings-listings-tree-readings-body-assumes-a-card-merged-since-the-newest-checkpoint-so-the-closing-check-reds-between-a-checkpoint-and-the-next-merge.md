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
