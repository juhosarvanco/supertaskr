---
id: T-075
title: The floor is guarded by the screen that actually binds it
feature: F-02
milestone: 4
priority: 34
size: M
status: planned
blocked_by: []
touches: [tools/e2e, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-051-s4, T-051-s5, T-051-s7, T-051-s9 (fourth triage,
2026-08-19). The suggestion files are removed in the same commit as this
card.

TWO TESTS IN ONE FILE RENDER TWO DIFFERENT MAPS, AND ONLY THE SHORTER IS
GUARDED. The minHeight test builds its natural-height table by reaching
the map through the lane's own board fixture, which produces a ONE-NODE
map whose natural height is **320px** — the test's own failure message
says so out loud. The criterion-3 table further down reaches the map
through this repo's own `docs/` tree, which produces an ELEVEN-NODE map
measuring **692px** at 1024 wide. So the declared floor of **700 clears
the map the sibling test actually renders by 8px**, not by the margin
the card's derivation implies, and `map <= 600` in T-051's notes is not
a measurement of it. Nothing is broken today. What is missing is the
guard: map height is node-count driven and node count grows with
`docs/ARCHITECTURE.md`, so the first component that pushes it past 700
puts a screen's own overflow back inside the window's legal range **and
the lane stays green**, because the only test watching the floor is
looking at a map 372px shorter. This is the same weakness T-051 caught
and fixed for the BOARD row mid-build, left unfixed one row down.

AND THE FLOOR SITS EXACTLY ON THE BREAKPOINT. `minWidth: 1024` is not
above the split's breakpoint, it IS the breakpoint: the pane slot is
hidden at 1022 and 1023 and visible at 1024 and 1025, and at exactly
1024 the lens is 384px. Zero pixels of margin, by construction, and
T-051 argues correctly that this is the cheapest honest floor. Three
attacks failed and are recorded so nobody re-derives them: a non-default
root font size cannot move it (media-query `rem` resolves against the
INITIAL font size, measured — with a 32px root a `64rem` element becomes
2048px while the query still matches at a 1024 viewport); Chromium
quantizes fractional viewports (1023.5, 1023.9 and 1023.99 all report
1024 with the query matching); and the manifest numbers are logical
pixels all the way down to `with_min_inner_size`. **The one residual is
not armed today**: on a platform whose document scrollbar consumes
layout width, a screen with a vertical document scrollbar at a 1024
window would evaluate the query against roughly 1009 and drop the lens
AT the declared minimum. It is unreachable because no breakpoint-gated
screen produces a document scrollbar at the floor — but nothing asserts
that, and the map is already within 8px.

## Acceptance criteria
- THE minHeight measurement SHALL be driven from the SAME tree its
  sibling renders, with the same out-loud guard the board row already
  carries ("this fixture really is the tall one"), OR the floor SHALL be
  asserted against the tallest measurement of ANY screen the criterion-3
  table renders — so the two tests cannot describe different apps.
  Either way the real number SHALL be recorded: **the map is 692 at 1024
  today**, and that is the figure a future floor has to clear.
- THE INVARIANT THE FLOOR RESTS ON SHALL BE ASSERTED: at the declared
  minimum, every screen that renders the genesis pane slot keeps
  `documentElement.scrollHeight <= clientHeight`. That is the property
  that actually keeps 1024 safe, and it is one line beside the existing
  frame checks. Moving the floor off the boundary (1040 buys a classic
  scrollbar's width) is the ALTERNATIVE arm and is an @human call, not
  this card's — see the parked T-051-s3 and T-062-s1, which are the same
  question from two other directions.
- NOTHING WATCHES BELOW THE FLOOR. T-048-s5's remedy 3 SHALL land — a
  lane assertion at one viewport under the declared minimum that reads
  the last artifact row's clipped-visible height and fails if a row can
  never be brought fully into view — or SHALL be declined in writing.
- T-048-s5's REMEDY 2 (give the pane slot a scroll region rather than
  `overflow: hidden`) SHALL BE CHECKED AGAINST T-062'S ONE SCROLL MODEL
  BEFORE BEING CARRIED. It may already be discharged; this card SHALL
  determine which and record the answer rather than assuming either way.
- THE MANIFEST PIN'S STATED REASON SHALL BE CORRECTED.
  `window-manifest.test.ts`'s header says a misspelled or kebab-cased
  key is a hard config parse failure and the app does not launch. **For
  these two keys it is false**: the locked tauri-utils carries explicit
  `min-width` and `min-height` aliases, and `deny_unknown_fields` does
  not reject an alias. Measured against the locked version six ways —
  camelCase OK, kebab-case OK, snake_case ERR, lowercase ERR, a
  misspelling ERR, and a fractional value OK at runtime. So a kebab
  rename launches normally with the floor intact. **This makes the
  key-set assertion MORE valuable, not less** — it is now the only thing
  standing between a kebab rename and a silent divergence between what
  the manifest says and what every test reads, and that argument SHALL
  replace the false one. Genuine typos DO abort, so the file's premise
  survives for the case it was really built for.
- THE SAME FILE'S rem RATIONALE SHALL BE CORRECTED: the assertion that
  the shipped sheet leaves the root font size alone is harmless and
  SHALL stay, but its stated reason ("rem, so the root font size
  decides") is not how media queries work, per the measurement above.
- T-051'S OWN JUSTIFICATION SHALL BE MADE TRUE. Its criterion 2 cites
  T-048-s5's 44px collapse below ~250px of viewport as the reason for
  the floor. Re-measured post-T-027 that floor does not exist: the
  region shrinks LINEARLY with the viewport and the last row stays fully
  reachable at 200, 225, 250, 300 and 360 — including the two heights s5
  recorded as failing, because T-027 restructured the screen and the
  44px floor belonged to the pre-split full-width composition. What
  survives is s5's SECOND finding, moved: the genesis page stops fitting
  below **~302px**, where s5 put it at ~225. The floor is right either
  way (700 clears 302 by 2.3x), but a next reader who goes looking for
  the 44px collapse will not find it.

Verification: headless E2E on a scratch port, plus app Vitest for the
manifest pin. **Never bind, connect to or signal port 1420.**

## Implementation notes

## Verdicts
