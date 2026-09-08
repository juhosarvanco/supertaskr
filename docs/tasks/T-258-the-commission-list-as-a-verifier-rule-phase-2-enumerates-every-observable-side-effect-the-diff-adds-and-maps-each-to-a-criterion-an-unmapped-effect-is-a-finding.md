---
id: T-258
title: The commission list as a verifier rule — phase 2 enumerates every observable side effect the diff adds (I/O, network, log, persist, emit, schedule, dependency) and maps each to a criterion on the card; an unmapped effect is a finding, REJECTED-level on a guard-class card
feature: F-01
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "@human ruling (2026-09-08, the EARS-for-the-AI-era reading: \"as proposed\") — omission has a twin, commission: a model adds retries, fallbacks, validation and logging nobody asked for, and nothing in nputer enumerates what a lane ADDED"
blocked_by: []
touches: [method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

The verifier hunts omission: every criterion attacked, every drill
judged. The fence bounds paths. Nothing enumerates what a lane added
that no criterion asked for — a log line carrying an email, a retry, a
fallback, a network call, a scheduled job, a dependency. The EARS
reading's worked example is exactly that shape, and the reviewer never
had to find it because a list did. This card makes the list a verifier
duty; the static enumerator in the landing gate is a later tool (v2).

## Acceptance criteria

- WHEN phase 2 judges a lane THE verifier SHALL write, in the verdict,
  a COMMISSION LIST: every observable side effect the diff ADDS — a
  file written, a network call, a log line, a persisted value, an
  emitted event, a scheduled job, a dependency, an environment read —
  each mapped to the criterion on the card that asked for it, or marked
  UNMAPPED.
- WHEN an effect is UNMAPPED THE verdict SHALL carry it as a finding:
  REJECTED-level on a guard-class card or where the effect touches
  secrets, persisted data or the network; a `status: suggested` card
  otherwise — never silently absorbed.
- WHEN the list is empty THE verdict SHALL say "commission list: none"
  on its own line, so an absent list and an empty list read differently.
- The role file SHALL state the list's shape once, in its own step, and
  the method eval gate SHALL run with the bump's eval block; the
  checkpoint template SHALL NOT be touched by this card (the record
  reads the verdict).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
