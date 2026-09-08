---
id: T-267
title: "The docs harness wait is a fixed fifteen seconds, so six shell-frame bodies red on a loaded CI runner while the harness is still loading the docs tree — derive the wait from the harness's own readiness, or state the budget and its reason"
feature: F-06
milestone: 4
size: S
priority: 27
status: planned
suggested_by: "the architect seat, 2026-09-08, from CI run 34242106460 on f9ec5eb (linux, e2e lane): 6 failed / 678 passed, every failure `window.__nputerDocsHarness never appeared` from tools/e2e/tests/helpers.ts:27; battery46 on the same tree was green locally in 612 s"
blocked_by: []
touches: [tools/e2e/tests/helpers.ts, tools/e2e/tests/shell-harness.ts, tools/e2e/tests/shell-frame.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

CI run 34242106460 (2026-09-08, f9ec5eb) redded the e2e lane with six
bodies, all of one shape: the three `shell-frame.spec.ts:232` bodies
("the frame holds on every screen at …", three viewports) and their
siblings never saw `window.__nputerDocsHarness` inside the fixed
15,000 ms wait in helpers.ts's `openApp`, and the suite otherwise
passed (678). The same tree was green locally the same hour. The
harness is dev-only and loads the whole docs tree before it announces
itself; docs/ grew by about 140 KB this week (the reference, the guide,
the records), and a loaded runner crosses a fixed budget a fast Mac
does not. A wait that is a constant is a claim about one machine.

## Why this card exists

STATE's standing hazard says a local green is not a runner green and
that the run log is read, attributed by name, and carded — this is the
card. The re-run of the failed job classifies the instance (intermittent
or deterministic); either way the wait is the mechanism: it should be
derived from the harness's own readiness signal, or, if a budget is
kept, the budget should be stated with the measurement that set it and
the message should say how long it waited and what the page had loaded
when it gave up, so the next reader attributes in a minute rather than
an hour.

## Acceptance criteria

- WHEN `openApp` waits for the docs harness THE wait SHALL either poll
  a readiness signal the harness itself exposes (the docs count it has
  loaded, or a `ready` flag set after the tree is read) with a budget
  derived from the tree's size, or keep a constant that CONVENTIONS
  states with the run that measured it and the runner class it holds
  on.
- IF the wait expires THEN the error SHALL name how long it waited,
  what the page's URL and title were, and whether the harness object
  existed at all (a prod build) versus was still loading (a slow tree)
  — two causes that today share one sentence.
- WHEN the e2e lane runs on CI THE six bodies SHALL pass on three
  consecutive runs at the landed budget, cited by run id on the card.
- A body SHALL red when the wait is shortened below the harness's
  measured load time on the fixture tree (the drill's mutant), and
  pass at the landed budget.

## Classification (2026-09-08)

The failed job was re-run once (`gh run rerun 34242106460 --failed`): **completed success, linux=success**. Same tree, same runner class, six reds then zero — an INTERMITTENT of the timing class, not a deterministic red. Main is green on CI at f9ec5eb. The card stands: a wait that passes on the second try is a wait whose budget was never derived.
