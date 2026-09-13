---
id: T-263
title: The e2e duration band is breached by construction — its limits were set at 279 bodies (156 s) and the suite now runs 684 bodies in 596 s, so the two suite bands are re-derived from the body count, as a per-body rate or a limit that moves with the census
feature: F-06
milestone: 4
size: M
priority: 26
status: planned
suggested_by: "the architect seat, 2026-09-08, from the wave checkpoint's health census (suite/e2e-seconds BREACHED at a714e99: 596 s against a 312 s breach line)"
blocked_by: []
touches: [tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts, tools/e2e/playwright.config.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-271-s5 (2026-09-13, the pile-2 sitting, the owner's approval of 2026-09-13). The sibling's file is removed in the same commit as this line; its two obligations sit in the criteria below tagged with their source, and its full text is kept under the absorbed heading.

The health census at the wave checkpoint reads `suite/e2e-seconds`
BREACHED: 596 s against a breach line of 312 s. The band's own
`measured.at` says where the lines came from — b060f90 on the T-156
lane, 279 bodies in 156 s — and the suite at a714e99 runs 684 bodies.
A band whose limits were set at 41 % of today's body count breaches on
growth alone, and a band that reads BREACHED at every checkpoint is a
band nobody reads, which is the failure docs-protocol law 8 names.

## Why this card exists

Two readings of the same fact. Either the suite is slower per body
than when the band was set (a real excursion the band exists to catch)
or it is simply larger (not an excursion at all). The band as declared
cannot tell them apart, so the breach is unactionable. Re-derive the
band so that it can: a per-body rate (seconds per body, with drift and
breach lines derived from the run that lands this card), or a limit
that scales with the body count read from the runner's own baseline
line, which gate-run already prints. The same reasoning holds for
`suite/lib-seconds` (set at the same ref), whose reading is inside
today only because cargo's count moved less.

## Acceptance criteria

- WHEN `npm run health -- --readings <file>` reads the e2e capture THE
  band SHALL derive its reading from the run's body count and duration
  together (a rate, or a count-scaled limit), and the config SHALL
  record the run that set the new lines with its ref, host, port, body
  count and duration.
- WHEN the suite grows by bodies at the same per-body cost THE band
  SHALL stay inside; WHEN the per-body cost rises past the drift line
  THE band SHALL read drifting — two fixture readings pin both.
- IF the capture carries no baseline line (no `Running N tests`) THEN
  the band SHALL read UNREAD, never inside.
- The lib band SHALL take the same shape in the same lane, and the
  checkpoint record's health census SHALL show both bands inside or
  honestly drifting at the merge, with the census line stamped.
- BEFORE the per-body rate is derived THE fixed, non-body cost of the scoped leg SHALL be measured on a cold worktree and on the runner, not only on the warm worktree T-271's demonstration run used (at 2069d22: 14 s of wall, 12.4 s summed across 56 bodies, so roughly 1.6 s of everything that is not a body — the dev server, node's start and the import-graph derivation together, never the server alone), the readings recorded on this card with their refs; and the rate SHALL either exclude the fixed component or state that it is included, without reporting an excluded component as an eliminated cost. These measurements are this card's own work inside its lane, not the seat's pre-dispatch read. (absorbed from T-271-s5)
- WHEN the specs that drive no browser are separated from the browser-driving ones THE selected no-browser specs SHALL run without the application server being launched, the browser specs SHALL still receive their server, and the two selections SHALL omit no spec and duplicate none — a body proves the no-server run by observing that no server was started, not by the config's shape. The mechanism is chosen inside the lane on the readings above, within the granted fence (the scope-amendment route if a file outside it is needed): in the installed runner `webServer` is a configuration-level option, not a per-project one, so a second Playwright project alone does not remove the server; a server made conditional on an environment variable is the shape T-142-s1 was bitten by and is not taken without an argument written on this card. (absorbed from T-271-s5)

## Absorbed from T-271-s5 — The scoped leg still starts the app's vite dev server for specs that drive no browser — measured at roughly 1.6 of 14 seconds on a warm worktree, which is small, un-instrumented, and the only fixed cost left once the leg is narrow (kept whole)

Title as filed: "The scoped leg still starts the app's vite dev server for specs that drive no browser — measured at roughly 1.6 of 14 seconds on a warm worktree, which is small, un-instrumented, and the only fixed cost left once the leg is narrow"

Filed as: status suggested, priority 30, size S, touches [tools/e2e/playwright.config.ts], suggested_by "executor claude-opus-5@subagent @T-271, 2026-09-09, at 2069d22".

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

## Implementation notes

## Verdicts
