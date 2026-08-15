---
id: T-024
title: Genesis lens — the right pane as pure derivation over materializing docs
feature: F-03
milestone: 3
priority: 2
size: M
status: planned
blocked_by: [T-023]
touches: [app-interview, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review:
---

The split view's right half ("the project, so far") built as a
standalone, driver-agnostic surface: it renders whatever lands in
docs/ — whether written by T-025's spawned planner, or by a human
hand-driving the method in a terminal (the ADR-006 evidence
instrument and the permanent fallback). Pure lens: derivation is pure
TS over the existing watcher state (DocsModelState.effective already
carries every docs/*.md content — C-10 files are OFF-LIMITS; read,
never edit). Design source: the `interview` screen of
docs/design/claudedesign_handoff/"nputer app.dc.html" (right pane,
values extracted from source per the T-006 protocol; the screen is
context-fidelity, not README-measured — nearest token step, deviations
disclosed). Declares component C-13-genesis-pane
(paths app/src/genesis/**, touch slug app-interview) in
docs/architecture/components/ in-branch, per the T-012 §2 precedent.

## Acceptance criteria
- THE app SHALL gain a pure module app/src/genesis/genesis-derive.ts
  mapping parsed docs state to a genesis model: per-artifact status
  {expected (from T-023's banking map), written (present and
  renderable), writing (present, changed within the last few seconds),
  assumption count (occurrences of "[?]")}, an approximate stage (the
  highest banking-map stage whose artifacts exist; approximation
  recorded as designed), north-star card content (title sentence +
  person/success/non-goal chips parsed from NORTH_STAR headings,
  absent-tolerant), and backbone entries (from the parsed ROADMAP
  model, built vs forming) — deterministic, no I/O, unit-tested
  against fixture trees including T-023's dry-run tree (landed here
  as a fixture) at empty / stage-4 / complete.
- WHEN the genesis pane renders THE app SHALL show the design's right
  pane from that model only: "the project, so far" header with live
  "docs/ · N files written" count, north star card with chips,
  backbone grid (dark built cards, dashed forming placeholders),
  artifacts list rows with written ✓ / writing pulse states, an
  assumption badge on artifacts with [?] markers, and the footer
  "next" line from the banking map — tokens-only styling (no
  arbitrary values), both schemes, dark values derived by token
  family and flagged to the screenshot pass.
- WHILE files change on disk (any writer) THE pane SHALL update via
  the existing watcher pipeline with no polling and no new IPC.
- IF a rendered doc is mid-write or malformed THEN the pane SHALL
  degrade per the existing last-good machinery (stale content + the
  established parse-chip family), never a crash or a blank pane; the
  suite SHALL pin a torn-file simulation (partial frontmatter) and
  hostile content in artifact names/headings rendering as React text
  nodes only (no-innerHTML grep gate extended to app/src/genesis/).
- IF prefers-reduced-motion is set THEN the writing pulse SHALL be
  static (existing motion-safe mechanism).

Verification: headless — vitest unit (derivation tables) + jsdom DOM
states + served-bundle probe rendering the dry-run fixture; board and
map suites untouched. @human, listed explicitly: visual judgment of
the pane against the design screen, light + dark screenshots.

## Implementation notes

## Verdicts
