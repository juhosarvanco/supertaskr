---
id: T-229-s11
title: A push-guard positive control reds only inside the whole e2e run and passes alone, so the suite carries an intermittent that every lane in the window will misattribute
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229-s8
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Found by `T-229-s8`'s battery, and filed because the next seat to run
the four-suite battery will meet this red and has to decide what it is.**
Nothing in `T-229-s8`'s fence touches the push guard.

`tools/e2e/tests/push-guard.spec.ts:2718` — *"a lane holds no seat, so a
holder record in one refuses nothing"* — fails its own POSITIVE CONTROL
half inside the full `gate-run e2e` and passes every other way:

    Error: the same record on the integration branch is not ignored
      2751 | control.verdict === "block" || (control.notices ?? []).join("").includes("SEAT"),

## What was measured, and where

| run | ref | context | result |
|---|---|---|---|
| full `gate-run e2e` | `4d972d03e2a2644a4a56c792ddb3449e79d4c76e` | whole suite | **RED** — 1 failed / 601 passed, this body |
| full `gate-run e2e`, again | `4d972d03e2a2644a4a56c792ddb3449e79d4c76e` | whole suite | **RED** — same single body |
| the body alone (`-g`) | `4d972d0` | one body | **GREEN** 1/1 |
| the whole spec FILE alone | `4d972d0` | 76 bodies | **GREEN** 76/76 |
| full `gate-run e2e` | `1e344d62fbc3f7db83e367b1e8592578459407cb` | whole suite, quiet machine | **GREEN** 602/602, exit 0 |
| full `gate-run e2e` | `1e344d6`, detached control worktree | whole suite, six other playwright processes live on the host | **RED** — the same single body |

**THE LAST TWO ROWS ARE THE FINDING.** One commit, one suite, two
opposite verdicts — so the red is not a function of the tree, and the
control at `1e344d6` also predates both cards the later ref adds. Every
tree-shaped explanation is excluded by construction; what is left is the
run's own conditions.

## Why it matters more than an intermittent usually would

The body is a POSITIVE CONTROL for a guard's refusal path
(`method/lane-protocol.md` rule 4's holder, `T-238`). A control that
flips under load is the one kind of red a seat is most likely to wave
through — *"push-guard, that's the other lane's, re-run it"* — and the
same shrug covers a real regression in the refusal it guards. This is
`docs/CONVENTIONS.md`'s *A TIMING CORRELATE IS NOT A CAUSE* met from the
other side: the correlate here is real, and it is the SUITE's, not the
tree's.

## Acceptance criteria

1. Name the interaction. The body passes alone and inside its own file,
   so what differs is state some EARLIER file in the run leaves behind,
   or a host-scoped surface the guard reads (`method/lane-protocol.md`
   rule 4: *name the scope of every surface you depend on — machine or
   checkout*). The card is closed by naming it, not by re-running.
2. The repair is isolation, never a retry: the body derives what it
   depends on rather than inheriting it, and reds for its own reason
   under a whole-suite run with the host busy.
3. The positive control is the reproduction above — the full suite run
   concurrently with other lanes' suites — and it SHALL red before the
   fix and pass after, at one ref.

## Note on the fence

`tools/e2e/tests/push-guard.spec.ts` is `T-237-s2`'s live fence at the
time of filing, so this card is routed rather than built and its fence
must be re-derived at dispatch (`method/lane-protocol.md` rule 7).
