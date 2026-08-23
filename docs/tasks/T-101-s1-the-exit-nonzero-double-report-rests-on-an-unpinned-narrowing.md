---
id: T-101-s1
title: The same-refusal-not-twice guarantee is structural only for toolDenied; the exitNonZero path inherits an unpinned narrowing
status: suggested
suggested_by: executor claude-opus-4.8 @T-101
---

T-101's last criterion — *the same refusal SHALL NOT read as two
different events* — is enforced by `PlannerTurn` for exactly one failure
kind. The live `DenialNotice` is suppressed when
`planner.error?.kind === "toolDenied"`, because the terminal
`FailureBlock` for that kind lists the SAME denials (`error.denials`) as
the turn's cause of death. That suppression is pinned (T-101's
`a turn that DIES of a refusal states it ONCE` body; mutants M6/M7).

**The `exitNonZero` path is not suppressed, and it is correct that it is
not — but only because of a runner-side line no test holds.** A turn that
carried live (announced) `Denied` events and then exits non-zero renders
BOTH the live notice AND `FailureBlock`, whose `failureDetail` is the
`stderrTail`. Since T-069 that tail carries the `result` line's denial
NAMES, and T-081's decision two narrowed it to the UNANNOUNCED subset —
so an announced denial appears in the live notice ONLY, and a
result-only denial in the tail ONLY. Disjoint, no double-report.

That narrowing is `T-081-s10`'s subject and `T-081-s10` records it as a
live SURVIVOR: reverting `denial_names(unannounced)` back to
`denial_names(&denials)` passes the whole cargo suite. If it were ever
reverted, an announced refusal would show BOTH as a live notice row AND
inside the `exitNonZero` detail blob — the very "same refusal twice" this
criterion forbids, on the `exitNonZero` path instead of `toolDenied`.

**Not fixed here, and not fixable in `[app-interview]`.** Re-implementing
the narrowing render-side would be a second owner of a runner rule
(T-057 — two implementations, two chances to disagree), which is exactly
what T-081's decision one forbids. The right close is runner-side
(`app-agent`): pin T-081-s10's narrowing so the `exitNonZero` path's
non-double-report is a measured property rather than an unpinned one.
Until then the guarantee is honest for `toolDenied` and inherited for
`exitNonZero`.

Low priority: the reachable shape is a recovered-from denial on a turn
that later dies of something unrelated, and the worst case is one tool
name shown twice on an already-failing turn.
