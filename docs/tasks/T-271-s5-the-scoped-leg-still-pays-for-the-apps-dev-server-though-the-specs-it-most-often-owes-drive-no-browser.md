---
id: T-271-s5
title: "The scoped leg still starts the app's vite dev server for specs that drive no browser — measured at roughly 1.6 of 14 seconds on a warm worktree, which is small, un-instrumented, and the only fixed cost left once the leg is narrow"
feature: F-06
milestone: 4
size: S
priority: 30
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-271, 2026-09-09, at 2069d22"
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
the dev bundle with trusted input, T-020) and unused by the specs a
scoped run most often owes: `gate-run`, `push-guard`, `lane-fence`,
`docs-input-gate`, `range-rule`, `brief` and their neighbours declare
themselves "no browser" in their own headers and touch no page.

**AND THE MEASUREMENT IS SMALLER THAN THE HUNCH, WHICH IS WHY IT IS
WRITTEN DOWN.** T-271's own demonstration run, at 2069d22 on a warm
worktree, over one owning spec: 14s of wall, 13.4s inside the reporter's
own window, 12.4s summed across the 56 bodies. Everything that is not a
body — the dev server, node's start, the import-graph derivation — is
roughly 1.6s, about 11 per cent. The first guess when this was filed was
"the larger half of a narrow run", and it was wrong; a cold worktree, or
a vite that has to pre-bundle, is the case nobody here measured.

So this is a card about an UNMEASURED and UNNEEDED fixed cost rather
than about a large one, and its first deliverable is the reading: what
does the server cost on a cold worktree, and on the runner?

Disposition hint: the shapes, cheapest first. A second Playwright
PROJECT with no `webServer` and a testMatch over the no-browser specs
splits the lane by declaration rather than by flag, and the census would
say which project a body sits in. A `webServer` made conditional on an
environment variable is one line and is the shape this repository has
already been bitten by (T-142-s1: a gate with two invocations grows a
mode whose exit means something else), so it wants an argument rather
than a patch. Whichever lands owes a body that the no-browser subset
really runs no server, because a saving nobody measures comes back.
