---
id: T-271-s4
title: "The docs census cannot see a file that reaches docs/ only through docs-scan.mjs's OWN exported readers, because the scanner excludes itself by name and the call arm stops at that boundary"
feature: F-06
milestone: 4
size: S
priority: 30
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

T-271 made `tools/e2e/scripts/gate-run.mjs` call
`docsReaders(root)` and `docsGate(...)` — it now genuinely reaches
docs/ on every scoped run over a docs path. **The census did not move by
one byte**: `docs-gate.mjs --census` is byte-identical before and after
that import landed, and gate-run.mjs stays classified `unclassified` in
the root-anchor account rather than `derived`. Diffed in the lane, both
directions.

The cause is structural rather than a miss in the scan: `docs-scan.mjs`
puts itself in `DOCS_EXCLUDED_FILES`, correctly — its own SITE_SAMPLES
and PLANTED_READERS are string text no comment strip can reach — and the
CALL arm resolves a callee by opening the callee's file. A hop INTO the
excluded file therefore terminates, so the class "reaches docs/ only
through docs-scan's own exports" is invisible to both the reader set and
to `unlinkedFiles()`, which is the tripwire that is supposed to report
what the scan could not link.

**It changes no answer today** and that is why this is a suggestion
rather than a defect: gate-run.mjs sits in tools/e2e, which
`suitesOwedForAllOfDocs` already reports as universally owed, so the
missing edge cannot make a gate answer short. What is wrong is the
ACCOUNT — that census publishes a bounded residual, and this class is
outside the bound without being named in it.

Disposition hint: the honest cheap fix is a named exception in the
scanner's own "WHAT IT CANNOT SEE" section plus a line in the census
listing importers of `docs-scan.mjs` that are not themselves readers, in
the shape ROOT_ANCHOR_LEDGER already uses. Making the call arm hop into
the excluded file is the expensive option and reopens the sample-text
false positives that exclusion exists for.
