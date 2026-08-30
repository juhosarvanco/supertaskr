---
id: T-143-s4
title: The in-flight row assertion reads a fixed 600-character window that a long card filename overflows — green wherever the card has a lane, red only on CI, found by the first push after a long-named dispatch
status: suggested
suggested_by: integrator nputer-4e @T-025-s5 merge, CI run on 8e6b18b (2026-08-30)
touches: [tools/e2e]
---

`tests/dispatch-order.spec.ts:308` ("A CARD IN FLIGHT WITH A DECLARED
FENCE APPEARS IN THE REPORT") walks every in-flight card and asserts
the lane-or-no-lane sentence within `after.slice(0, 600)` of the
card's row. Every report line carries its provenance stamp, and the
stamp carries the card's FULL PATH — so the window a row gets is a
function of its filename length. `T-025-s5`'s 119-character path,
stamped twice before the sentence, pushed it past 600 and redded CI
run #376 (commit 8e6b18b) — while every local run of the same suite
was green, because locally the card HAD a lane and took the shorter
"HAS a lane above" arm. The no-lane arm only ever executes where no
worktrees exist, which is CI and nowhere else this project runs.

The class: a spec window measured in characters over lines whose
length is data-dependent. The fix is to derive the window from
STRUCTURE — the card's own block, sliced at the next row that starts a
different card id — not to widen the constant (620 fails on the next
filename). The sentence itself prints unconditionally at
`scripts/dispatch-order.mjs` (the `holds no fence` / `HAS a lane
above` pair), so the report is honest; only the spec's ruler is wrong.

Fence note at filing: `touches: [tools/e2e]` is HELD by T-162's live
lane — dispatch after it lands; the lane list is the authority. The
interim exposure is one spec body, red only on CI, only while a
long-named card sits at `status: building` with no lane.
