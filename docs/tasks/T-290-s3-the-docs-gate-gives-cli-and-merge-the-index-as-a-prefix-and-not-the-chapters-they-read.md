---
id: T-290-s3
title: "The docs gate gives cli.mjs and merge.mjs the index as a prefix and not the chapters, because its reader derivation follows one call hop and their call hands it a root it cannot evaluate"
feature: F-01
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-290, derived from the gate's own reader map at the lane's tip and reported in its notes"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

After T-290 this project's conventions are an index and eleven chapters,
and the docs gate's reader map names both prefixes for the eleven specs
that read them — a change to the index OR to a chapter owes those
suites. Two readers carry only the index:

    tools/e2e/scripts/cli.mjs      docs/CONVENTIONS.md
    tools/e2e/scripts/merge.mjs    docs/CONVENTIONS.md

Both genuinely read the chapters: each derives its commands through
`conventionsText`, which splices them. The derivation cannot see it
because it follows ONE call hop and attributes a callee's docs prefixes
through the ARGUMENT it is handed — and both call it with a root that is
a `projectRoot ?? <default>` expression rather than a literal the scan
can evaluate. Each file's own literal `docs/CONVENTIONS.md` site is what
gives it the prefix it has.

**NO ANSWER MOVES TODAY, AND THAT IS WHY THIS IS A SUGGESTION RATHER
THAN A DEFECT REPORT.** Both files sit in the tools/e2e suite, which the
same chapter change already owes through eleven specs, so the gate's
verdict is identical either way. What is wrong is the ACCOUNT: the map
says these two do not read the chapters, and they do. The gate's own
ledger exists for exactly this class of honesty, and the residual it
records is argued file by file.

## Acceptance criteria

- WHEN the reader map is derived THE two files SHALL either carry the chapter prefix they really read, or SHALL be argued by name in the acknowledgement ledger with the reason the derivation cannot link them and the statement that no answer moves.
- WHEN a file is added that reads the chapters through the same shape THE account SHALL follow from the derivation or from the ledger rather than from a memory, and the spec SHALL assert the derived set and the ledger agree exactly, as it already does for the root anchors.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
