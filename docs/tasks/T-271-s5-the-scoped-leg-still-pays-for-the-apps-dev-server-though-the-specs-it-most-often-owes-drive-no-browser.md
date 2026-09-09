---
id: T-271-s5
title: "The scoped leg still starts the app's vite dev server, though the specs it most often owes drive no browser at all — the fixed cost is now the larger half of a narrow run"
feature: F-06
milestone: 4
size: S
priority: 30
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3"
blocked_by: [T-271]
touches: [tools/e2e/playwright.config.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`tools/e2e/playwright.config.ts` declares `webServer` unconditionally,
so every invocation of the lane — including T-271's scoped form over a
single spec — builds and starts the app's dev server on
SUPERTASKR_E2E_PORT and waits for it to answer before the first body
runs. That is right for the lane's founding purpose (Playwright drives
the dev bundle with trusted input, T-020) and wasted for the specs a
scoped run most often owes: `gate-run`, `push-guard`, `lane-fence`,
`docs-input-gate`, `range-rule`, `brief` and their neighbours declare
themselves "no browser" in their own headers and touch no page.

While the whole leg took ten minutes the fixed cost was noise. After
T-271 it is a visible share of a run measured in seconds, which is the
only reason this is worth a card at all — the figure this lane measured
is on T-271's own notes.

Disposition hint: the shapes, cheapest first. A second Playwright
PROJECT with no `webServer` and a testMatch over the no-browser specs
splits the lane by declaration rather than by flag, and the census would
say which project a body sits in. A `webServer` made conditional on an
environment variable is one line and is the shape this repository has
already been bitten by (T-142-s1: a gate with two invocations grows a
mode whose exit means something else), so it wants an argument rather
than a patch. Whichever lands owes a body that the no-browser subset
really runs no server, because a saving nobody measures comes back.
