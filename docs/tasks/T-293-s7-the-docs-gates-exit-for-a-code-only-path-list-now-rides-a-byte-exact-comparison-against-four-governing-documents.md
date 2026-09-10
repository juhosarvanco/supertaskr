---
id: T-293-s7
title: "The docs gate's exit for a CODE-ONLY path list now rides a byte-exact comparison against four governing documents, and five pre-existing exit-code bodies red together when it moves — one of them was seen red once at T-293's tip and could not be attributed"
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-293 (phase 2), measured at 6d904bf72ca0dc57cd674c419c898b7f3f8f293c"
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts, docs/STATE.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-293 added a fourth whole-tree contributor to the docs gate's `found`
counter: `docs/INDEX.md` compared BYTE FOR BYTE against a render derived
from four governing documents. It runs on every invocation, including one
whose path list holds no docs path at all, which is deliberate and argued
where it is written — the index goes stale from a document the diff need
not have touched.

**MEASURED KILL SET.** With the module's comparison inverted (a CODE
mutant, one side, restored and the restore proved by sha256), the docs
gate reported a stale index on every run and SIX bodies of
`tests/docs-input-gate.spec.ts` redded together — the one that owns the
property, and five that own the gate's EXIT CODES and know nothing about
the index:

    the hand-run gate's exit codes hold, and an EMPTY path list is 2 and not 0
    THE EXIT MATRIX — all four codes survive the invocation the doc prints
    THE EMPTY-LIST TRAP, re-proved against the new spelling, with a PLANTED POSITIVE
    THE CENSUS SAYS WHICH QUESTION ITS EXIT ANSWERS, and says it LAST
    THE SCAN IS ADVISORY — all four exit codes are unmoved, AND the scan is proven to have RUN
    the committed docs/INDEX.md is CURRENT, and a PLANTED STALE LINE is what reds

The coupling itself is the gate's own architecture and predates this card
— the budget, frontmatter and stale-record halves are whole-tree too. What
is new is the SENSITIVITY: those three fire on a crossed threshold, a
malformed card or a git ordering, while this one fires on any byte moving
in four large documents that are edited often.

**AND THE OBSERVATION THAT GOES WITH IT.** Running the whole e2e leg at
T-293's tip, `the hand-run gate's exit codes hold, and an EMPTY path list
is 2 and not 0` failed once, on exactly the assertion this coupling
controls — a code-only path list answered 1 where the body expects 0. It
did not reproduce: the spec alone is 60 of 60 green, a second whole-leg
run is 852 of 852 green, and a sampler running that exact invocation
against the live tree continuously through the second run never once saw a
non-zero exit. No spec in the corpus writes into the live `docs/` tree or
checks out the live worktree, so the trigger is UNATTRIBUTED. It is
recorded here so the next seat attributes it instead of rediscovering it.

## Acceptance criteria

- WHEN the docs gate answers a path list with no docs path in it THE
  answer SHALL be decided by that list, or the whole-tree findings SHALL
  reach the reader without moving that exit — and whichever is chosen, the
  body that pins the code-only exit SHALL say which.
- WHEN a whole-tree finding does move a code-only exit THE gate's output
  SHALL make the reason unmissable to a caller that reads only the code.
- THE intermittent above SHALL be attributed by name or recorded among
  `docs/STATE.md`'s named intermittents, so a future red is charged to it
  rather than to a diff.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
