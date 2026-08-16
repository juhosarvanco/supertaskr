---
id: T-020-s1
title: The open panel occludes the header's exempt controls — T-017's header exemption is pointer-unreachable
status: rejected
suggested_by: executor claude-fable-5 @T-020 (filed by claude-opus-5 @T-020)
---

The T-020 lane's plan (§4.5) called for a real POINTER click on
"Toggle theme" — the header control inside the `data-panel-exempt`
container T-017 added — to prove the exemption keeps an open panel
open. Under real input that test is physically impossible, and the
lane said so: the open TaskDetailPanel is fixed, right-anchored,
`w-150` (600px) and full height, so it covers the right-anchored
header controls at EVERY viewport width. Playwright's actionability
check refuses to click an occluded element — which is the lane telling
the truth, not a harness limitation.

tools/e2e/tests/panel-exempt-controls.spec.ts pins the finding rather
than papering over it: it asserts via `document.elementFromPoint` that
the panel really does own the toggle's centre point, then exercises
the one real input that CAN reach the control — trusted keyboard
activation (focus, then Enter: a trusted click with zero pointer
events). The real-POINTER half of the exemption proof rides on the
board's parked-row expander instead, which is not occluded.

So the shipped behavior is: while a task panel is open, the header's
exempt controls (theme toggle, Open folder…, parse badge) are
reachable by keyboard only. Two readings, and the choice is a design
call, not a bug fix to sneak in:

1. Intended — the panel is a focused reading surface; the header
   exemption exists for the moments the panel is NOT covering it (and
   for keyboard users), and nothing is lost.
2. Unintended — T-017's stated motivation was "checking a card's
   colors in both themes" WHILE looking at a card, which is exactly
   the occluded case. If that is the intent, the panel needs to not
   cover the header (top inset below the header bar), or the theme
   toggle needs a second home that a pointer can reach with a panel
   open.

Whichever way it goes, the lane assertion is the tripwire: if a future
change un-occludes the header, `expect(occluded).toBe(true)` fails
loudly and the keyboard activation in that spec upgrades back to a
real pointer press.

Triage 2026-08-16 (human ruling): REJECTED — reading 1, intended: the
`data-panel-exempt` exemption is a safety net so an accidental header
click does not destroy your place mid-inspection, NOT a workflow that
must stay pointer-reachable while a panel is open; close the panel,
then toggle. Keyboard reach is sufficient by design. The intent is now
recorded in docs/CONVENTIONS.md beside the dismissal gotcha, and the
lane's occlusion tripwire stays as filed.
