---
id: T-268
title: "A lane's ASK has no live channel to the dispatcher, so an executor that meets an out-of-fence need routes and reverts instead of parking — the brief names an ask file under the lane's scratch stem, the arm's ledger prints it, and the dispatching seat watches it while the lane runs"
feature: F-04
milestone: 4
size: S
priority: 13
status: planned
suggested_by: "the architect seat, 2026-09-08, from T-264's lane: the executor met .nputerignore outside its fence, reverted the crate directory move and routed T-264-s1 (measured: 51 fixture files admitted to the graph) instead of parking the edit and asking; the dispatcher learned of it from @human relaying the agent's message, granted fast path A within minutes, and had no way to tell the running lane"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/executor.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Fast path A (method/lane-protocol.md) says the executor names the
exact paths it needs, parks that edit, keeps building, and the grant
arrives as two files on disk. It does not say WHERE the ask is
written so that a dispatcher sees it while the lane is still running.
In this harness a subagent has no message channel to its dispatcher
and its report arrives only when it ends; the card in the lane is
uncommitted and invisible to the seat unless the seat goes looking.
So the ask, in practice, is a routed suggestion card read after the
lane has already given up the work — which is what T-264's executor
did, correctly under the letter of executor.md step 3, and expensively.

## Why this card exists

The whole value of the fast path is that the lane never blocks and
never reverts: the grant is cheap for the seat (one amended line, one
re-expansion) and the revert is expensive for the lane (T-264 undid a
crate directory move and will need a fix pass to redo it). The missing
half is a place the ask is written that the dispatcher polls without
being told. The scratch stem already exists per lane
(`<scratch>/brief-<card>.txt`, CONVENTIONS' SCRATCH RULE), so the ask
file is one more name under it.

## Acceptance criteria

- WHEN the arm dispatches a lane THE brief's fence row (row 5) SHALL
  name the ask file `<scratch>/ask-<card id>.md` and the sentence that
  goes in it (the exact paths, why, and what is parked), and the arm's
  printed ledger SHALL show the path so the seat can watch it.
- WHEN an executor meets an out-of-fence need THE role file's step 3
  SHALL say to write the ask there FIRST, park the edit, and keep
  building — and only route (file a suggestion) when in-fence work runs
  out with no grant on disk.
- WHEN the dispatching seat runs a lane THE seat's own protocol
  (CONVENTIONS' dispatch bullet) SHALL say it watches the ask file (a
  file watcher or a poll between events) and answers by fast path A,
  never by a reply into the lane.
- IF an ask names a path that overlaps a live lane THEN the seat's
  refusal is written back into the same file, so the lane reads a no
  as easily as a yes.
- WHEN the dispatching seat starts the ask watcher THE watcher SHALL end
  on its own at the FIRST of: the lane's card stamped `verifying` or
  `done` in the lane's own checkout (the executor has reported and can
  ask no more), the lane worktree removed, or an ask arriving (which
  wakes the seat and is answered; a fresh watcher is started for the
  next ask only while the card still reads `building`). A watcher that
  outlives its executor is the retirement condition docs-protocol law 8
  demands, written here because two did on 2026-09-08 (@human: the
  watchers were still running while only a verifier was).
- WHEN the seat answers an ask with a grant THE grant SHALL be ONE arm
  (`brief.mjs --grant <card> <path>…`): amend `touches:` on the
  integration branch and commit, re-expand the lane's manifest (refusing
  an overlap by construction), deliver the identical line into the
  lane's copy of the card, and write the answer into the ask file — the
  seat's half of fast path A typed by hand today (loop-efficiency room
  item 16, folded here 2026-09-09).
- WHEN a grant widens a fence THE answer SHALL name the control the
  widening invalidates: a property that is a function of the fence's
  arrangement is proved only under a clone fenced like the lanes that
  owe the gate, and the executor SHALL measure it there (room item 19,
  folded here 2026-09-09).
- A brief.spec body SHALL pin that the brief names the ask path and
  that a lane-cut without it is a finding.
