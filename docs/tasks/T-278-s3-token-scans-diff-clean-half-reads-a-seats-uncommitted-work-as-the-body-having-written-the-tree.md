---
id: T-278-s3
title: "token-scan's seven-roots body reds with `every target stays diff-clean in the live tree` when the SEAT has uncommitted work in one of its targets, which reads exactly like the body having written the repository"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23"
blocked_by: []
touches: [tools/e2e/tests/token-scan.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

Measured in this lane: a `gate-run e2e` over an UNCOMMITTED edit to
`.github/workflows/ci.yml` reds `one runtime-built control byte reds all
seven first-party roots at exact byte offsets` at
`token-scan.spec.ts:171` with *"and every target stays diff-clean in the
live tree"*, expected 0, received 1. The body wrote nothing: the
`git diff --quiet` half of `expectUntouched` (T-216-s4) cannot tell a
seat's own working-tree change from a body that wrote the repository,
and its message asserts the second. The per-file sha256 half already
passed, which is the discriminator: hashes equal to `before` plus a
dirty diff is a DIRTY TREE, and hashes unequal is a body that wrote.
Saying so costs one branch and one sentence, and turns a five-minute
misattribution — the executor's, here — into a line that names the file
and says "commit it, then run the lane".

Class parent: T-216-s4, which built `expectUntouched` and drilled it.
Disposition hint: promote at any lane that already holds
tools/e2e/tests/token-scan.spec.ts; it is one branch, and its own drill
is a dirty tree.
