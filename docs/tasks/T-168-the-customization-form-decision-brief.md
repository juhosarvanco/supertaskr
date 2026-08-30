---
id: T-168
title: The customization-form decision brief — the industry benchmarked, the config-system and in-app-setup forms analyzed from the ground up, and the choice routed to @human before any UI exists
feature: F-04
milestone: 4
priority: 1
size: M
status: building
blocked_by: []
touches: [docs/research, docs/rooms]
suggested_by: "@human ruling (2026-08-30, loop-customization sitting): before any UI visual design work, decide the FORM of the customization UX — config system or in-app setup area — well designed and thought from ground up"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT THE LOOP-CUSTOMIZATION SITTING (2026-08-30), planned at
filing on @human's ruling, and it GATES every UI card in this
feature.** @human's condition is binding and verbatim in
docs/rooms/loop-customization.md: the whole way of customization is
designed from the ground up, form first, mockups only after the form
is ruled.

## Acceptance criteria

- THE lane SHALL produce an industry benchmark sweep as
  `docs/research/customization-ux-benchmark.md`: how the best
  developer tools actually ship customization — the config-file
  school (dotfiles, `.claude/`-style directories, eslint/prettier
  lineage), the in-app settings school, the hybrid school
  (settings UI that reads and writes the files), and the
  policy-distribution schemes enterprises use (managed settings,
  marketplaces, protected directories). Each entry: what it does
  well, where it breaks, and what it teaches nputer. Sources cited;
  claims about a tool verified against its docs, not memory.
- THE lane SHALL open `docs/rooms/customization-form.md` carrying THE
  DECISION BRIEF: the candidate forms stated fairly (config system /
  in-app setup area / designed hybrid), each analyzed from the ground
  up against (a) the benchmark's lessons, (b) nputer's layering stack
  (the loop-customization room), (c) the three audiences named by
  @human — developers, organizations, enterprises — and (d) nputer's
  own invariants (files-first, auditability, the fence system, D3's
  narrow ruling on app writes). ONE recommendation with its reasoning,
  and the open questions each form would create. The brief ends with
  the decision QUESTIONS for @human, stated so they can be answered
  in one word each.
- THE brief SHALL NOT contain mockups, visual design, or UI layout —
  the ruling forbids them before the form is chosen; naming the
  SURFACES each form implies (what screens or files would exist) is
  in scope, drawing them is not.
- Verification: headless — the docs exist, cite their sources, and
  lint:docs is green. The CLOSER is @human reading the brief; this
  card is done when the brief is routed, not when the form is ruled.

## Fence note at filing

`touches: [docs/research, docs/rooms]` — pure docs, disjoint from
everything queued. The lane has web access for the benchmark; every
external claim carries its source.
