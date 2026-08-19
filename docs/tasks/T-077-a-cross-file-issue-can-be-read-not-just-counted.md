---
id: T-077
title: A cross-file issue can be read, not just counted
feature: F-02
milestone: 4
priority: 36
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-053-s1 (fourth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card. Filed against `lib-parser`'s
output but fixed in the app: T-053's fence was the parser and its
criterion 6 said to STOP rather than edit an app file, and the shape is
an app decision anyway.

THE COUNT IS RIGHT AND THE LIST IS EMPTY. Measured through the app's own
`applySnapshot` over T-053's fixture, run with vite-node and no app file
touched: `model.issues.length` — the number `App.tsx` renders in the
status line — is **2**, while `failures.length` — the list the parse
error details strip iterates — is **0**. `failingIssues` in
`docs-model.ts` only marks a file failed when a record was WITHHELD by
the identity gate or the roadmap produced zero features. An `aliased-id`
is neither: every record parses, so the file is healthy and only the SET
is wrong. The human sees the counter tick from `0 issues` to `2 issues`
with nothing anywhere on screen saying what they are — **the board's
least actionable state**, because a count that cannot be expanded reads
as a bug in the app rather than a fact about the docs.

PRE-EXISTING AND WIDER THAN T-053. Every cross-file issue kind has
always been count-only: the component `aliased-id`, `ambiguous-mapping`,
`dependency-cycle`, and every `dangling-reference` from project
validation. T-053 only made it reachable by a plausible input — an
interview-written backbone, where a language model spells the same
number two ways — which is why it is worth filing now rather than when
somebody hits it.

## Acceptance criteria
- `model.issues` that are NOT already represented in `failures` SHALL
  render as their own rows in the same details strip, keyed by kind plus
  ids, so the count and the list can never disagree about how many
  problems the docs have. One component, no new store state.
- EACH ROW SHALL NAME THE FILES AND THE SPACE. The issue already carries
  `files`, and since T-053 the alias carries `space`; **T-076 extends
  `space` to `duplicate-id`**, so this card SHALL read the field where
  it exists and degrade cleanly where it does not, rather than
  hard-coding either shape.
- WHETHER a cross-file issue row is CLICKABLE to the files it names
  SHALL be ruled, not assumed. The data is there; the interaction is a
  product call and SHALL be recorded either way.
- A PIN SHALL MAKE THE FAILURE MODE IMPOSSIBLE TO REINTRODUCE: a
  snapshot whose ONLY problem is cross-file SHALL produce a NON-EMPTY
  expandable strip, so a count that cannot be expanded reds. A pin that
  only asserts the count would pass today with the hole open.
- THE STRIP'S EXISTING BEHAVIOUR FOR WITHHELD RECORDS AND ROADMAP
  FAILURES SHALL BE UNCHANGED, and the containment discipline the strip
  already has SHALL extend to the new rows — a cross-file message names
  ids that came off disk, so it is file-derived text like everything
  else in that strip.

Verification: headless app Vitest at DOM level, driving the real
reducers with a fixture carrying only cross-file issues.

## Implementation notes

## Verdicts
