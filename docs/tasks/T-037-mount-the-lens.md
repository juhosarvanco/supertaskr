---
id: T-037
title: Mount the lens — wire T-024's genesis pane into T-026's screen slot
feature: F-03
milestone: 3
priority: 5
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

The first slice's join, which fell between two parallel branches and
belonged to neither. T-024 built the lens (C-13, `app/src/genesis/**`)
against a base that predated T-026's screen; T-026 built the screen
against a base that predated the lens, leaving a marked placeholder
slot (`data-testid="genesis-pane-slot"`) rendering one honest line.
Both are on main now, both are tested, and nothing imports the pane —
verified at T-026's merge three ways: no src-side import, no
C-05→C-13 file edge in the regenerated graph, and the built bundle
missing the pane's own strings while the screen's are present. So the
slice's promise — hand-driven genesis rendered live — is undelivered,
and T-024's @human visual pass plus both deferred served-bundle
probes (T-024-s1, T-026-s7) have no route to the pane. S-tier:
executor + tests, orchestrator merges (T-016/T-036 precedent). The
change is one import and one element; the CARE is in not breaking
either half's fence, and in the props contract T-026 deliberately
designed for exactly this (`{ projectDir, docs: DocsModelState }` —
the type T-024's derivation already consumes).

## Acceptance criteria
- THE genesis screen SHALL render T-024's `GenesisPane` in the marked
  slot, receiving the same watched `DocsModelState` the placeholder
  line reads today, so the pane updates through the existing watcher
  with no new IPC and no polling (both halves' contracts unchanged).
- THE built bundle SHALL contain the pane — the exact inverse of the
  measurement taken at T-026's merge: the pane's own strings
  ("the project, so far", `genesis-artifact`) present in
  `app/dist/assets/*.js`, asserted by a served-bundle-free grep of
  the build output so the claim is mechanical rather than visual.
- THE existing suites SHALL pass unchanged — T-024's derivation and
  DOM tests, T-026's shell-routing and genesis-entry tests — and the
  screen's other states (front door, "No plan in <folder>", board,
  map) SHALL be untouched, pinned by the tests that already cover
  them.
- WHEN the genesis screen renders with docs present THE pane's own
  content SHALL appear (north-star card, backbone grid, artifact
  rows) rather than the placeholder line, asserted at DOM level
  against a fixture tree; WHEN docs/ is empty THE pane's empty state
  SHALL render without crash or blank.
- IF the pane throws for any input THEN the genesis screen SHALL NOT
  take the app down — an error boundary or an equivalent guard keeps
  the shell alive, pinned by a test that forces a throw (the pane is
  now on the shell's critical path; T-024's degradation criteria
  covered malformed DOCS, not a broken component).

Verification: headless — vitest DOM against fixture trees, the
built-bundle grep, and the full app + cargo suites at main's counts.
@human, now UNBLOCKED by this task and listed for the session it
enables: the pane's visual judgment against the design screen, light
and dark.

## Implementation notes

## Verdicts
