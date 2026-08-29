---
id: T-154
title: The fence becomes a property at the moment of the write — a hook derives the card from the lane's own branch and blocks what the fence forbids
feature: F-04
milestone: 4
priority: 30
size: M
status: planned
blocked_by: []
touches: [.claude/, tools/e2e, method/lane-protocol.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

ADR-020 decision 1. Three logged incidents would have been blocked
mechanically: `db4c903` (an architect edit inside T-138's held fence),
T-126's breach (verdict `de05430` ruled the fence should have held and
approved only by necessity), and the architect session's 2026-08-29
report ("I edited a file a live lane held"). Lane-protocol rule 5 is a
discipline today; this card makes it a property — the ADR-019
promote-if-it-slips trajectory applied one layer earlier, to the
moment of the write.

## The mechanism

A PreToolUse hook on Edit/Write (checked into the repo's
`.claude/settings.json`, so every lane worktree inherits it):

1. Derive the seat from the checkout: a branch matching
   `task/T-NNN-*` names the card; the main checkout and detached
   scratch worktrees match nothing and the hook ALLOWS (integrator,
   architect and drill contexts are not lanes).
2. Read the card's `touches:` and expand it through the ONE fence
   implementation — `fence.ts` via `@nputer/parser` — never a second
   copy of the rule (T-057, T-134).
3. A write inside the expanded fence, or to the unfenceable
   `docs/tasks/`: ALLOW. Outside: BLOCK, printing the fence, the
   offending path, and the route (file a suggestion; or the card's
   fence is wrong — triage's call, never the hook's).
4. Fail CLOSED in a lane the hook cannot judge (unparseable card,
   unbuilt parser dist), with the reason printed — a guard that
   cannot judge is not a guard that waves through.

## Acceptance criteria

- WHEN a session in a lane worktree writes a file its expanded fence
  does not contain THE hook SHALL block the write, naming the fence,
  the path, and the route.
- WHEN the same write occurs in the main checkout or a detached
  worktree THE hook SHALL allow it (a positive control — refusal must
  be distinguishable from absence, CONVENTIONS' own rule).
- IF the hook cannot derive or expand the fence in a lane THEN it
  SHALL block with the reason, never allow silently.
- WHEN the hook lands THE lane-protocol rule-5 text SHALL say the
  property exists and name its honest limit: Bash-mediated writes
  remain protocol-covered in v1 (disclosed, not hidden), and the
  method text change rides its own version bump.

## Org-scale note (ADR-020 decision 6)

This is the PROJECT tier of a two-tier design. The managed tier —
org-controlled, non-overridable hooks — is a named slot, not built
here; the hook's config shape should not preclude a second source.

## Loop-protection follow-ups (same layer, route if not taken here)

Block `docs/architecture/graph.json` writes outside a checkpoint
context; block test-file edits in a lane whose card is a fix task
(the playbook's protect-the-feedback-loop play; needs a card-type
marker first).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
