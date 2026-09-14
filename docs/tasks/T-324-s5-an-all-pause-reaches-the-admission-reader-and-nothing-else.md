---
id: T-324-s5
title: "An `all` pause reaches the admission reader and nothing else: the merge verb, the wait and every other arm the loop runs never read the pause record, so the phases the criterion says stop at their declared safe boundary stop only where an admission happens to be made"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-324, measured at phase 2 of that lane: readPause has exactly one caller, grantState, and grantState has three, all of them admission boundaries"
blocked_by: [T-324]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-324's fourth criterion says that under scope `all` every further phase
stops at its declared safe boundary — a running executor at its stamp, a
running verifier at its verdict, a staged merge finished or aborted as
the record says. What T-324 built is a refusal at the four admission
boundaries: the lane cut, a child start, a re-entry and a replacement
writer. Everything else in the loop is untouched by a pause.

The reading that makes this correct is that a phase which never asks for
an admission was already running, and a pause is not an immediate stop —
the card says so itself and routes an immediate stop elsewhere. The
reading that makes it a gap is the merge: a staged merge is a phase the
criterion names by hand, it has two legal outcomes decided by the
record, and the verb that performs it asks for no admission at all, so
neither outcome is decided by the pause. `readPause` has exactly one
caller and `grantState` has three, all of them admission boundaries.

Nothing here is broken today; what is missing is the reach. An owner who
records `scope: all` and then watches a merge land has had a control
answer a narrower question than the sentence it was written from.

## Acceptance criteria

- WHEN a pause of scope `all` is recorded THE verbs that perform a phase without asking for an admission SHALL read it and SHALL stop at the boundary their own record declares, naming the pause, its scope and who recorded it.
- WHEN a staged merge meets an `all` pause THE verb SHALL finish it or abort it as the record says, and both outcomes SHALL be driven by a body over two records rather than one, since a record-decided branch cannot be tested from one side.
- WHEN a phase is already past its safe boundary THE pause SHALL leave it alone, because an immediate stop is a separate request through the applicable stopping mechanism and never a reading of this record.
- WHEN the reach lands THE conventions SHALL say which verbs read the pause in one place, so that a later reader can tell a phase the pause governs from one it does not.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/dispatch-and-scratch.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
