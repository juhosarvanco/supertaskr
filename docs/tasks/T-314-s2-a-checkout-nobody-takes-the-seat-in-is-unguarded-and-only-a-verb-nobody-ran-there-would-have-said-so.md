---
id: T-314-s2
title: "A checkout nobody takes the seat in is unguarded and only a verb nobody ran there would have said so: the pre-push hook is installed by one arm, the PreToolUse guard never mentions that git runs nothing, and this machine carries several checkouts in exactly that state"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-314, measured at that card's own tip; that card's third criterion installs at the seat and reports there, and the population outside the seat is outside its criteria"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/tests/push-guard.spec.ts, docs/CONVENTIONS.md, docs/conventions/commands.md, docs/conventions/gates-and-the-push.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The pre-push hook is installed by exactly one act: taking the seat. That
is the right place for it — the seat is the one moment a session declares
it is acting in an integration checkout — but it makes the guard's
presence a function of a verb having been RUN, and the report that a
checkout lacks it is printed by that same verb.

A checkout nobody takes the seat in is therefore permanently unguarded,
and nothing anywhere says so. A session pushing from one meets no
refusal, no notice and no line: git runs nothing because
`core.hooksPath` was never pointed anywhere, which is indistinguishable
from a checkout where every arm allowed.

The one thing a Claude seat DOES read at a push is the PreToolUse guard's
own output, and that guard knows the answer for free — it already reads
the checkout root, and the question is one configuration read plus one
stat. It says nothing, because it was written before there was anything
to say.

Measured at this card's base: this machine carried eight checkouts of this
repository, of which one is the integration checkout and the rest are
lanes, benches and two standing clones. The guard-surface sweep in the
dispatch arm already enumerates every one of them from git's own worktree
administration and judges each for stale guards; it does not judge any of
them for an absent hook.

## Acceptance criteria

- WHEN the PreToolUse guard judges a push THE checkout's pre-push hook SHALL be read and an UNGUARDED checkout SHALL be announced at exit zero, never refused, so the one surface a seat reads at a push carries the one fact nothing else reports.
- WHEN that announcement is written THE positive control SHALL be a checkout where the hook IS live, which stays silent, so the line is a measurement rather than a line on every push.
- WHEN the conventions record the guard THE population outside the seat SHALL be named there: which checkouts are guarded is a function of an act somebody performed, and that is a procedure with a reader rather than a property.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/commands.md, docs/conventions/gates-and-the-push.md, docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
