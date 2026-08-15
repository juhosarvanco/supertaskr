---
id: T-026
title: Shell genesis entry — Start an interview, docs-less folders, front door affordances
feature: F-03
milestone: 3
priority: 3
size: M
status: planned
blocked_by: [T-018]
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

blocked_by T-018 is technical: opening a docs-less folder relies on
its root sentinel (docs/ appears → watcher re-arms) so the agent's
first `mkdir docs` lights the pipeline. Design source: the `open a
folder` screen ("Start an interview" beside "Open a folder…", ⌘N ·
⌘O; the "No plan in <folder>" card with "Start an interview here" —
the Adopt button is deliberately ABSENT in v1, fenced to
archaeology). Serialize with T-025 on app-shell at dispatch.
Absorbs: T-018-s4 (triage 2026-08-16) — the docs-appeared staleness
fix lands here: same screen, same sentinel, same cargo flow.

## Acceptance criteria
- THE front door SHALL render the design's two-button affordance
  ("Open a folder…", "Start an interview", ⌘O/⌘N) and the existing
  no-docs rejection state SHALL become the design's "No plan in
  <folder>" card offering "Start an interview here" — checklist of
  looked-for paths preserved, Adopt absent.
- WHEN a folder without docs/ is picked for genesis THE shell SHALL
  open it as a genesis project via a zero-argument picker command
  variant (ADR-012 pattern; validation: existing directory, not a
  symlink target swap — T-003 rule family) with the watcher armed on
  the root sentinel, and a new screen state `genesis` SHALL render
  full-bleed (no rail — the rail remains board|map for open
  projects; T-027 fills the screen, this task mounts a placeholder
  that already hosts T-024's lens when docs exist).
- WHEN docs/ later appears under the genesis project THE existing
  pipeline SHALL light up with no re-pick (T-018's sentinel,
  exercised end-to-end in a cargo test from this task's flow).
- WHEN docs/ appears EMPTY under the open project THE watcher SHALL
  emit exactly once on the (unarmed → armed) transition even though
  the tree equals the empty baseline, so the front door replaces the
  stale "no docs/ found" claim with the empty board (the invitation
  rendered live); the suppression invariant holds for every other
  batch (T-018-s4).
- IF the picked folder already contains a plan (docs/ROADMAP.md or
  any docs/tasks/*.md) THEN genesis SHALL NOT be offered for it —
  the flow routes to opening it as a normal project (no overwrite
  path exists in the app by construction).
- IF the picker is cancelled or validation fails THEN the previously
  open project SHALL be untouched (PickOutcome discipline), pinned
  in tests.

Verification: headless — cargo picker/sentinel-flow tests, vitest
shell-routing tests, served-bundle probe of the two front-door
states; T-007/T-022-adjacent behaviors untouched (T-022 is milestone
4 — recents rows unchanged here). @human: front-door visual judgment,
light + dark.

## Implementation notes

## Verdicts
