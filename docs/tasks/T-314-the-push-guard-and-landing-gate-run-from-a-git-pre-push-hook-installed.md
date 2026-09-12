---
id: T-314
title: "The push guard and landing gate run from a git pre-push hook installed by the arm in every integration checkout, in either harness, judging each proposed update by its remote old object and local new object with the evidence read from the pushed candidate — the token keyed to the pushed tree as an additional binding, the range-derived owed set and the unchanged-tree check preserved — with deliberate bypass recorded as an accepted procedural limitation"
feature: F-04
milestone: 4
size: S
priority: 1
status: planned
suggested_by: "ADR-025 decision 3, approved by the owner on 2026-09-12 with the v1 limitation accepted the same day; card 5a of its plan"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/scripts/brief.mjs, tools/e2e/tests/push-guard.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

### What was measured

The push guard and landing gate are registered only as a Claude PreToolUse hook on the Bash tool; under Codex nothing runs, and under Claude the guard judges the command a session typed and derives its range from the checkout's upstream and HEAD: a push spelled with a leading `cd` once passed unjudged. No git-level hook exists and `core.hooksPath` is unset. A git pre-push hook receives each proposed update on standard input as local ref, local object, remote ref and remote object, and can be skipped with `--no-verify`.

### Acceptance criteria

- WHEN a push is attempted from an integration checkout THE pre-push hook SHALL read each proposed update from its standard input and judge the range from the update's remote old object to its local new object with the token, the owed set and the unchanged-tree check read from the candidate being pushed, refusing an unqualified update with the guard's own reason; bodies SHALL cover a pushed commit that differs from HEAD, a remote old object that differs from the local tracking ref, several proposed updates of which one is unqualified (the whole push refused), and an unsupported update shape refused by name.
- WHEN the guard judges a pushed commit THE token SHALL be required to match the pushed commit's tree in addition to, never instead of, the range-derived owed set and the check that the tree stayed unchanged during grading; a body SHALL show a token minted for a different tree refused, and a token minted for the pushed tree with a stale owed set refused.
- WHEN the seat takes a checkout with `--take-seat` THE arm SHALL install the hook, the file `pre-push` in the tracked hooks directory the fence names, by setting `core.hooksPath` to that directory only when it is unset or already ours, SHALL refuse by name and change nothing when a different hooks path is configured, SHALL change no configuration when the seat acquisition fails, and SHALL announce the result; the seat verbs SHALL report a checkout without the hook as unguarded.
- WHEN the Claude PreToolUse guard runs THE existing behaviour SHALL be unchanged, as a second net.
- WHEN this card lands THE conventions SHALL record, at the push bullet, that a deliberate bypass (`--no-verify`, a push from a checkout without the hook) is closed by procedure in v1 as the owner accepted on 2026-09-12, that the runner's owed set on the pushed range remains the public check, and that a protected receiving gate and credential isolation are separate proposals (T-310).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
