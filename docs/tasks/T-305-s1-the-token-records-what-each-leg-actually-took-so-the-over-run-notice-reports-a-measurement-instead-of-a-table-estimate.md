---
id: T-305-s1
title: "The token records what each leg actually TOOK, so the over-run notice reports a measurement instead of a table estimate — the runner times what it spawns and the entry carries it, which is the only reading of a run that was not derived from a document"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-305, 2026-09-11, measured while building the over-run notice at 3e791c58f6db8bb798057ebc126c2a222eb74022"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, .claude/hooks/push-guard.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-305 tells a seat that its push graded more legs than its range owed,
and prices what that cost. It cannot price it from a measurement, because
there is none to read: a suite entry in the verdict token records the
moment it was written and never how long its suite took. The whole of
that arm's arithmetic therefore comes off two figures in
docs/CONVENTIONS.md — the browser leg at ten of the battery's eleven
minutes, and the other three legs at seconds each — divided and split.
Every sentence the notice prints says about, and says why.

The figures are the document's and they are cited, so this is not a
guess. It is still a table, and it has the properties of a table: the
per-spec figure is the whole leg divided by the spec files there were
when it was stamped, so it drifts as the suite grows; the residual sixty
seconds is split three ways because nothing says which of the three is
slower; a machine slower or faster than the one those readings came from
reads its own minutes as the document's; and a leg that got faster stays
priced at what it used to cost until somebody re-measures the document.

## The shape that would work

The runner already wraps every spawn. Time it there, put the duration on
the verdict beside the tree and the dirt it already carries, and let the
token writer keep it on the entry the way it keeps the ref. The reading
is then the runner's own, taken on the machine that ran it, and it
travels with the thing it describes.

That closes three things at once, and each is worth stating:

- the over-run notice prices what the seat actually paid, on the seat's
  own machine, instead of what a document says a leg costs somewhere;
- the narrowed-leg figure stops needing a divisor stamped by hand, since
  a narrowed run reports its own seconds;
- the health band for the browser leg's wall time gets a second reader
  that is not a human copying a summary line out of a run.

## What to be careful about

A duration is a live fact, not a function of a tree, so it carries the
machine it was read on. Two runs of one leg on two machines are not
comparable and the entry should not pretend they are.

The token is the push guard's evidence, and a new field on it is a new
thing an old token does not carry. The reader must treat an entry with no
duration the way it already treats an entry with no scope: absent means
unknown, never zero, and the notice falls back to the table it has today
rather than reporting a run that took no time.

## Acceptance criteria

- WHEN the runner grades a leg THE verdict SHALL carry the wall time that
  leg took, and the token entry SHALL keep it, with the machine it was
  read on.
- WHEN the push guard prices an over-run for a token whose entries carry
  durations THE notice SHALL report the measured minutes and SHALL name
  them as measured rather than as a table figure.
- WHEN an entry carries no duration THE notice SHALL fall back to the
  cost table and SHALL say which of the two it used.
