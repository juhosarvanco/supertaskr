---
id: T-300-s7
title: "The settings listing's tree-readings body assumes a card merged since the newest checkpoint, so the closing check reds on every push made between a checkpoint and the next merge — the listing is right (an empty window reads UNREAD by design), the body's precondition is a fact about the calendar"
feature: F-04
milestone: 4
size: M
tier: standard
priority: 1
status: building
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

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 1, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.
