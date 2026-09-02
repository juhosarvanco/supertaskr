---
id: T-215-s2
title: "`lane-fence.mjs`'s header calls `no-path-to-judge` \"limit 5\" in its decline list while its own limits block and its code both say limit 8 — a guard publishing a wrong limit number is T-215's class one file over"
feature: F-06
milestone: 4
priority: 3
size: S
status: building
blocked_by: [T-219-s3]
touches: [.claude/hooks/lane-fence.mjs]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**A DOCUMENT THAT PUBLISHES A GUARD'S LIMITS IS PART OF THE GUARD** —
`T-215`'s opening line, turned on the guard's own header. Read at
`42520e3` in the `T-215` lane, `.claude/hooks/lane-fence.mjs` names one
limit by two different numbers.

## The two spellings, verbatim

The AN UNJUDGED WRITE SAYS SO block, header line 143:

> the four codes that DECLINE to judge — `not-a-repository` (limit 2),
> `not-judged-detached` (limit 3), `not-judged-lane-list` (limit 4) and
> `no-path-to-judge` (**limit 5**) — set it FALSE.

The HONEST LIMITS block numbers **5** as *"IT IS ADVICE TO A COOPERATING
HARNESS"* and **8** as *"A REQUEST WITH NO READABLE PATH HAS NO TARGET TO
ROOT FROM"*. The code agrees with 8 in two independent places:
`noTargetVerdict`'s doc-comment (*"the one question the WRITER's cwd still
answers (limit 8)"*) and the decline's own runtime message, which ends
`"(limit 8 in this file's header)"`.

So the header says 5, the header says 8, and the string a session
actually SEES on stderr says 8. Limit 5 is not a declining limit at all —
it is the advice-to-a-cooperating-harness limit, which returns no verdict.

## Why it is a card and not a typo

**IT IS THE SAME DEFECT CLASS AS `T-215` ITSELF**, one file over: a limit
number is the handle a reader uses to look the limit up, and a wrong one
sends the reader to a limit about `.claude/settings.json` when they were
chasing a request with no path. Most likely provenance is a renumbering:
limits 6, 7 and 8 were added after the decline list was written, and the
list kept the number the no-path limit held when it was fifth.

**AND IT IS OUTSIDE `T-215`'s FENCE.** `T-215` is fenced to
`docs/CONVENTIONS.md` exactly; the hook is not in it. Routed rather than
fixed, per `method/lane-protocol.md` rule 5.

**T-215-s1 WOULD CATCH THE NEXT ONE.** If that card lands, the count
comparison it proposes reads the numbered limits block, so a decline list
naming a number the block does not answer for becomes checkable rather
than noticed by hand.

## Acceptance criteria

- `.claude/hooks/lane-fence.mjs`'s AN UNJUDGED WRITE SAYS SO block SHALL
  name `no-path-to-judge`'s limit with the number its own HONEST LIMITS
  block and its runtime message already carry.
- No verdict, code or message SHALL change; this is the header only, and
  the existing bodies in `tools/e2e/tests/lane-fence.spec.ts` SHALL stay
  green unchanged.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, behind T-219-s3

The architect seat, at T-215's merge (c8f69aa). One number in the hook's
header; T-219-s3 holds the hook now and rewrites the same header, so this
rides after it rather than beside it.
