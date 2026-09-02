---
id: T-225-s17
title: The triage view cannot be SPLIT per dropped set from `dispatch-order.mjs` alone — the verbosity dial that reaches it is one boolean in `brief.mjs`, and that is the shape the card itself preferred
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-225-s12
blocked_by: [T-239]
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-order.mjs, tools/e2e/tests/dispatch-order.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-225-s12 NAMED THREE SHAPES A FIX COULD TAKE AND PREFERRED THE
THIRD** — *"whether the arm is SPLIT so a reader asks for one dropped set
at a time... it is the one that does not have to choose what to leave
out."* That shape was NOT buildable from T-225-s12's fence, and the
reason is one line of plumbing rather than a disagreement.

`brief.mjs` parses `--full` into a BOOLEAN and hands it to
`dispatchContext({ root, full })`; `dispatchReport` sees nothing else.
So a reader cannot ask for the FENCED set alone, or for BLOCKED alone,
without a new flag or a flag that takes a set name — and both live in
`brief.mjs`'s frozen `FLAGS` literal and its argument loop, which
`T-225-s12`'s fence did not hold and which `T-239` held live at the time.

**WHAT THIS WOULD DECIDE.** Whether the dial is a second flag
(`--dispatch --fenced`), an argument (`--full <set>`), or a repetition of
`--full`; and whether the default view's counted line should name the
exact invocation that restores the set it counted, which it currently
cannot because no such invocation exists.

**WHAT IT IS WORTH, MEASURED.** At `cde65b5` with five lanes live and
fifty-five cards fenced out, `--dispatch --full` was 99,943 bytes after
T-225-s12's own fix and the FENCED section was 48,617 of them. A reader
asking for one set at a time pays for the set it asked for, which is what
takes the arm under one pipe buffer without deciding what to leave out.

**IT IS BLOCKED ON T-239 BY FENCE, NOT BY LOGIC** — `brief.mjs` and
`dispatch-brief.mjs` are that lane's ground.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s12 merge

The architect seat. The split the card itself preferred; needs brief.mjs's flag parsing, which T-239 holds and lands soon.
