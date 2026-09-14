---
id: T-320-s9
title: "The express arm's dry-run printed the composed card unstamped, and no battery before the merge could see it: the holder gate refuses the arm in any checkout that is not the integration one before it composes, so the margin guard measured a refusal on every lane and bench and the red appeared on the integration checkout at the merge"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the closing check of the T-320 merge"
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts, tools/e2e/scripts/brief.mjs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

T-320 added the express arm's dry-run to the margin guard's live arms in
its flush spec, and the arm printed the composed card verbatim after its
stamped ledger: a page of frontmatter and body with no provenance stamp,
which the guard reads as a cut mid-line. The lane's battery and both
verifier batteries were green on that body, because the arm is held to
the dispatch's holder gate and that gate refuses any checkout that is not
the integration one before the composing step runs: on a lane worktree
and on a detached bench the arm answers a stamped refusal and nothing
else, and the guard passed the refusal's stamps as the arm's. The
integration checkout at the merge was the only place the card lines had
ever been printed, and the merge's closing check red there. The print
was corrected at the merge (every card line goes out as a stamped value)
and the closing check re-run.

The gap is the class, not the line: whatever the express arm prints only
after the holder gate is invisible to every battery the loop runs before
a merge, and a guard that names the arm measures a refusal rather than
the arm.

## What would settle it

A fixture the margin guard, and any body that drives the express arm
past the holder gate, can use in a scratch checkout: an integration
checkout by the gate's own reading, on the integration branch with no
holder record, so a lane or bench battery reaches the composing step and
measures the same output the integration checkout prints. The body that
drives the arm as a live arm should assert, by name, that the answer it
measured was the composed card and not the refusal.

## Acceptance criteria

- WHEN the margin guard drives the express arm in a scratch checkout THE arm SHALL reach the composing step, and the guard SHALL measure the composed card rather than the holder gate's refusal.
- WHEN a live arm's measured answer is a refusal THE guard SHALL say so by name rather than pass the arm on the refusal's stamps.

## Implementation notes

## Verdicts
