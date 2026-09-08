---
id: T-263
title: The e2e duration band is breached by construction — its limits were set at 279 bodies (156 s) and the suite now runs 684 bodies in 596 s, so the two suite bands are re-derived from the body count, as a per-body rate or a limit that moves with the census
feature: F-06
milestone: 4
size: S
priority: 26
status: planned
suggested_by: "the architect seat, 2026-09-08, from the wave checkpoint's health census (suite/e2e-seconds BREACHED at a714e99: 596 s against a 312 s breach line)"
blocked_by: []
touches: [tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

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
