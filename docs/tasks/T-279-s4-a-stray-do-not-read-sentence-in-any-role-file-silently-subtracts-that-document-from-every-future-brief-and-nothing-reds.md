---
id: T-279-s4
title: "A stray `do NOT read <a docs path>` sentence anywhere in a role file silently subtracts that document from every future brief, and neither the method eval gate nor brief.spec reds — the reader is deliberately whole-file, so any sentence in any section arms it"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-279, 2026-09-09, drilled at 7b9f2ee"
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/dispatch-brief.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

PRE-EXISTING, and named here because a bench drilled it rather than
because T-279 caused it: T-279's own diff leaves the sets unmoved, which
is what makes the hole visible as a hole rather than as a regression.

`readSubtractions` in `tools/e2e/scripts/dispatch-brief.mjs` scans a role
file WHOLE — deliberately, and its own comment says why — for the first
`docs/*.md` path on any line carrying `do NOT read `. Row 3 of every
brief then removes that document from the read-first set the session is
handed. `readAdditions` does the mirror for `ADDITION TO THAT SET IS `
plus a backticked path.

Two one-side data mutants on `method/roles/executor.md`, each read back
from `git diff --numstat` and each restored with a sha256 proof against
`1721c90042fc7fb96fc9ca008cd6dc91b1d8da928d050162ba60e177f8be59df`:

| # | inserted sentence | method eval gate | `brief.spec.ts` |
|---|---|---|---|
| M6 | `**You do NOT read docs/STATE.md while the suites run.**` | exit 0 | exit 0, **66 passed** |
| M7 | `**A SECOND ADDITION TO THAT SET IS ` + a backticked `docs/VERSIONS.md` | exit 0 | exit 0, **66 passed** |

CONTROL: the same spec at the unmutated tip, exit 0, 66 passed. The
command was `SUPERTASKR_E2E_PORT=25279 npx playwright test brief.spec.ts`
from `tools/e2e/` on the bench.

**WHY NOTHING REDS, WHICH IS THE INTERESTING PART.** The two bodies that
read this grammar — *"ROW 3 APPLIES the role file's reading step"* and
*"the subtraction and the addition FOLLOW the role file"* — are written
to FOLLOW the document rather than pin a document, which is exactly right
and is what stops the tool being a constant wearing a function's clothes.
The consequence is that they cannot tell an INTENDED subtraction from an
accidental one: with M6 in place, the brief cheerfully reports *"the role
file SUBTRACTS: docs/STATE.md"* and both bodies pass. An executor's brief
would then omit `docs/STATE.md` — the document `roles/verifier.md` calls
the one that "matters most to you" — and no gate anywhere would say so.

## Acceptance criteria

- WHEN a role file's subtraction set changes THE suite SHALL red, naming
  the document that entered or left it, WITHOUT pinning a document name
  in the body — the existing follow-the-document bodies stay as they are
  and the new one is a separate, deliberate ledger.
- WHEN the ledger and a role file disagree THE failure message SHALL name
  which role file and which document, so an accidental sentence is
  distinguishable from a ruled change.
- WHEN a subtraction is changed ON PURPOSE THE remedy SHALL be one edit
  to the ledger in the same commit, and the suite SHALL then be green.
- WHEN the ledger itself is emptied or the role file states no
  subtraction at all THE suite SHALL red rather than pass vacuously —
  the positive control the existing bodies already demand of themselves.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
