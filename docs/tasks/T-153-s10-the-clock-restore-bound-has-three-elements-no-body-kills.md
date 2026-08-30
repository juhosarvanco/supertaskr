---
id: T-153-s10
title: The clock-restore bound has three elements no body kills — the two-ULP term, the `Math.abs` and a helper with no non-empty floor — so a widened bound, a one-sided guard and an empty target list would all stay green
feature: F-01
milestone: 4
priority: 5
size: S
status: parked
blocked_by: []
touches: [tools/e2e]
suggested_by: verifier claude-opus-5@subagent @T-153-s5
builder:
verifier:
built_by:
verified_by:
review:
---

`T-153-s5` replaced an exact `mtimeMs` equality with a COMPUTED bound —
`CLOCK_QUANTUM_NS` plus two ULPs of the captured reading, `ulpOf`
deliberately computed rather than typed because it doubles at the next
binade. The bound is correct and it was verified term by term. **Nothing
in the suite pins it.** This card is about the guard's own
guard-integrity, not about the bound's value, and none of it blocked the
verdict.

## The measurement — drill at `2eaa8f0`, `/private/tmp/nvt153s5`

Detached scratch worktree, one stem, mutations read back, every
restoration sha256-proved. Each assertion-side mutant was preceded by a
`touch` of all eight plant targets, for the reason `T-153-s7` carries.

| mutant | observed | what it means |
|---|---|---|
| the two-ULP term dropped, tolerance left at the bare 1000 ns quantum | GREEN, 10 passed, deltas -240..+172 | no body on the measuring platform kills it |
| `Math.abs(row.deltaNs)` replaced by `row.deltaNs` | GREEN, 10 passed, deltas -200..+79 | no body kills it: the guard becomes one-sided and stays green |

Neither is vacuous in the field. The two-ULP term IS killed by the Linux
runner — three of the twenty-four stamped CI samples exceed the bare
quantum (-1016, -1016, -1005), so a tolerance of exactly 1000 would have
redded CI. The `Math.abs` IS killed by a code-side mutant: restoring two
microseconds EARLY reds both bodies, `2 failed / 279 passed of 281`.
**Both are load-bearing and both are unpinned by anything a developer
runs before pushing**, which is the gap: on this platform the whole
apparatus could be replaced by `expect(delta).toBeLessThanOrEqual(1e9)`
and every local suite would stay green.

A third, cheaper one: `expectClocksRestored` iterates `captured` and
asserts nothing when it is empty — **SHAPE TEN**, an empty comparison
reporting agreement, with the catalogue's own one-line remedy. Both
callers are pinned TODAY by their bodies (`toHaveLength(7)` and
`(0 TOKEN, 7 CONTROL)` in one, a one-element literal in the other), so
this is a latent hazard in a helper that now exists to be reused rather
than a live defect.

## What would close it

The tolerance and `ulpOf` are PURE FUNCTIONS of a number — no filesystem,
no plant, no restore — so the missing pins cost one fast body and no
suite time:

- `ulpOf` DOUBLES at the binade: `ulpOf(2**41) === 2 * ulpOf(2**41 - 1)`,
  which is the claim its own comment makes and the reason it is not a
  literal. Verified by hand against a bit-manipulated `nextafter` at
  today's `mtimeMs`, today's seconds, `2**40`, `2**41 - 1`, `2**41`,
  `2**41 + 1`, `2**30` and `2**31 - 1` — exact agreement at all eight.
- the tolerance is a FUNCTION OF THE EPOCH, not a constant: 1489 ns at a
  2026 timestamp and 1977 ns at a post-2039 one.
- the guard is TWO-SIDED — the assertion's subject is a magnitude.
- `expectClocksRestored` refuses an empty target list.

Derive the numbers at your own ref rather than transcribing these; the
first two move with the calendar and that is the property being pinned.

## Why it is a card and not a correction

Poison shapes FIVE and SEVEN, both of them: an assertion set with no
floor, and a mutant no body kills because the mutant set was derived from
the pins. `T-153-s5`'s executor derived its mutants from the DEFECT — a
restore that moves the clock — and every one of those reds. The elements
above are aimed at the BOUND, which no criterion named, so a faithful
executor had no reason to reach for them. Cite the ordinals from
`docs/CONVENTIONS.md`; do not mint new ones.

## Take it with the family

`T-153-s7` owns the POISON DRILL sentence about the fixed point,
`T-153-s8` the stale census. This one is the only member of the three
that lands in `tools/e2e` rather than in a governing document, so it can
ride whichever `tools/e2e` lane comes next rather than asking for one.

Standing triage 2026-08-30 (architect seat): PARKED as a RIDER, on the card's own instruction: "it can ride whichever `tools/e2e` lane comes next rather than asking for one." Re-derived at this ref and all three elements HOLD — `token-scan.spec.ts` still has `ulpOf` at `:80`, the tolerance at `:95-96`, `Math.abs(row.deltaNs)` at `:140`, and `expectClocksRestored` at `:117` iterating `captured` with no length guard; `grep -rn 'ulp|tolerance|binade|nextafter' tools/e2e/tests/*.spec.ts` returns only the definition sites and a log string, so nothing pins the doubling, the epoch-dependence, the two-sidedness or a non-empty target list. A widened bound, a one-sided guard and an empty target list would all stay green.
Not promoted, because it is one small assertion-integrity edit in a file another card will already have open, and giving it its own lane spends a session on three expectations. Not absorbed into `T-153-s11` or `T-153-s16` either: it shares their fence but not their file, their subject or their fixture, and folding it in would let a sweep lane weaken it by accident — which is the very failure it describes.
RESURFACES: the next `tools/e2e` dispatch whose fence reaches `tools/e2e/tests/token-scan.spec.ts` — most likely `T-156-s3`, which is promoted at this sitting and opens exactly that file. Whoever cuts it attaches this card's three expectations as riders and says so on the card. IF two such lanes pass without taking it THEN it is under-served as a rider and promotes on its own.
