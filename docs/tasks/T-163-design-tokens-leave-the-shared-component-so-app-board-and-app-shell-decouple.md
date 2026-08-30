---
id: T-163
title: Design tokens leave the shared component — app-board and app-shell expand disjoint, and T-112's collision surface drops from nineteen cards to one
feature: F-04
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [docs/architecture, app/test]
suggested_by: "@human ruling (2026-08-30, rulings sitting): split C-11 first, over dispatching T-112 as-is"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT @HUMAN'S RULING (2026-08-30), planned at filing.** The
architecture ruling is made; this card executes it.

## The measurement (T-112's planning prep, 2026-08-30, at 558d660)

The slug map shares C-11 between `app-board` (C-08, C-09, C-11, C-17,
C-18) and `app-shell` (C-05, C-10, C-11, C-16) — derive it fresh:
`brief.mjs --state`, THE SLUG MAP section. Because both slugs expand
through C-11, every app-shell card's fence overlaps every app-board
card's: nineteen planned cards flip with T-112 through that one
component, against ONE direct sharer (T-031-s1). The ledger prints the
consequence on every run: "app-board and app-shell both expand through
C-11 — these rows are not independent."

## Acceptance criteria

- THE design-tokens component (C-11) SHALL stop appearing in BOTH
  `app-board`'s and `app-shell`'s expansions. The seat chooses the
  spelling — its own never-fenced slug, or no slug at all — and states
  in one sentence at the definition site why a tokens change still has
  a legal route into a lane (a bare-path fence remains legal).
- WHEN the split lands, `brief.mjs --state`'s not-independent row for
  this pair SHALL disappear — DERIVED, not deleted: the sentence and
  its spec pin (brief.spec.ts, "the slugs that are not independent are
  DERIVED") both compute from the component files, and the pin SHALL
  stay green through the change without a tools/e2e edit. IF the pin
  reds, the fence is wrong, not the pin — stop and say so.
- THE architecture dogfood pins (app/test/architecture-dogfood.test.ts,
  app/test/map-dogfood-render.test.tsx) SHALL be re-derived where they
  count slugs or read `touch_slugs`; `depends_on` edges do not change
  and their pins SHALL NOT be touched.
- WHEN the split lands THE lane SHALL re-derive T-112's flip pairs and
  stamp the correction on T-112's card, dated — its PLANNING PREP note
  becomes stale at HEAD the moment this merges, and leaving it is the
  exact claim class T-160's preflight exists to refuse.
- THE graph SHALL be asked, never predicted, after every write
  (`cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/), and the DOCS GATE runs what it owes on this diff.

## Why S and why now

The change is a few `touch_slugs:` edits plus derived pins re-run; the
value is every future board/shell dispatch, not just T-112 — the two
biggest UI seats stop holding each other's fences through a stylesheet.
