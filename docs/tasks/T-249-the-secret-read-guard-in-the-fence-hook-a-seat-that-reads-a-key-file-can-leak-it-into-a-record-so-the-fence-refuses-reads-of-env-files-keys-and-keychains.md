---
id: T-249
title: The secret read guard in the fence hook — a seat that reads a key file can leak it into a record, so the fence refuses reads of env files, private keys and keychains, not only writes outside the card
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's secret read guard (T-245); nputer's fence is write-only"
blocked_by: []
touches: [.claude/hooks/lane-fence-hook.mjs, .claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

The fence is a property at the write (T-154): a hook refuses a write
outside the card's paths. Reads are free. A seat that reads `.env`, a
`*.pem`, `~/.ssh/*` or a keychain export can carry the value into a
card body, a verdict or a record — and records are append-only. GSD
Core ships a read guard for exactly this (hooks/gsd-secret-read-guard.js).

## Acceptance criteria

- WHEN a seat under a fence attempts to READ a path matching the
  secret set (env files, private keys, ssh and cloud credential
  directories, keychain exports — the set is ONE list in the hook with
  a positive control per entry, derived from the tree's own ignore
  files where it can be) THE hook SHALL refuse the read and name the
  entry that matched.
- WHEN the read is of a file the card's fence explicitly names THE hook
  SHALL still refuse — a fence widens writes, never secrets; the seat
  that needs a secret's SHAPE reads a redacted sample the human
  provides.
- IF the hook cannot classify the path THEN it SHALL allow and log —
  this guard fails open on classification, because a read guard that
  blocks the tree's own sources is a lane killer (the hook's own
  refusal must be inspectable: the log line names the path and the
  reason).
- The lane-fence spec SHALL gain the read arm with a planted positive
  and a planted negative; the drill SHALL show the guard red on a
  planted `.env` read and byte-exact restoration after.
- CONVENTIONS' fence sentence SHALL gain the read clause in the same
  merge (docs gate run).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
