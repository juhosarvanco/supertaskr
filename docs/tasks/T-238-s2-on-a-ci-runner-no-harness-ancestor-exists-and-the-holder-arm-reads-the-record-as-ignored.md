---
id: T-238-s2
title: On a CI runner no harness ancestor exists, so the holder arm's identity answers nothing and the spec body that expects the integration branch's record to be READ reds — main went red on the push that merged T-238
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: "the architect seat, 2026-09-02 — CI run 33602096600 on 763548c, e2e lane, push-guard.spec.ts:2718 'a lane holds no seat, so a holder record in one refuses nothing': Error: the same record on the integration branch is not ignored"
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE FIRST RED MAIN OF THE SITTING, AND IT IS T-238'S ENVIRONMENT
ASSUMPTION.** T-238 derives the seat's identity from the nearest harness
ancestor (`claude`) of the calling process and answers nothing when none
matches — measured stable on this machine across six spellings. A GitHub
runner has no such ancestor: the hook runs under `node ← bash ← Runner`,
the derivation answers nothing, and the arm that should read a holder
record on the integration branch reads nothing instead. The spec body
at :2718 arms a record on the integration-branch fixture and expects it
READ there while a lane ignores it; on the runner both sides ignore it,
and the body reds by its own message. Locally green 20-for-20 in the
lane, the bench and the integration checkout — every one of those has
the ancestor.

## What to build

- WHEN the identity cannot be derived (no harness ancestor) THE holder
  arm SHALL announce that the seat cannot be checked here and ALLOW —
  the disclosed fail-open shape the CI arm already uses for an
  unreachable `gh` — and the declared-limits header SHALL name the
  runner as the case.
- THE spec SHALL arm the identity through the fixture (an injected
  derivation or an environment the hook reads first), never through the
  runner's real process tree, so the bodies discriminate on every
  machine; a positive control SHALL show the undivable case announce and
  allow, and the derivable case refuse a live other holder.
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**
