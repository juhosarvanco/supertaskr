---
id: T-153-s6
title: The pipe-defect demonstration encodes BSD xargs — GNU xargs runs the gate on empty input, the gate refuses the empty list, and two Linux bodies red proving the hazard is platform-dependent
feature: F-01
milestone: 4
priority: 4
size: S
status: building
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: integrator nputer-4e @T-153-s2 checkpoint, CI run 33260414204
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-29, integrator)** on the CI-green
standing authorization: with T-153-s5 this is the whole remaining
distance between main and its first green run.

## The evidence — CI run 33260414204 (the SECOND full Linux e2e run)

`fetch-depth: 0` cleared the shallow-clone class (range-rule's
parent-walk parameter went green). Two bodies stayed red on ONE
sentence:

- `docs-input-gate.spec.ts:906` — "THE EMPTY-LIST TRAP, re-proved
  against the new spelling, with a PLANTED POSITIVE": red at the
  `piped.code ... toBe(0)` assertion ("THE DEFECT: the pipe reports a
  clean gate for a failed range").
- `range-rule.spec.ts:91` — the `docs-gate-recipe-exit-codes`
  parameter of the same recipe family (a DIFFERENT parameter of :91
  than run 1's, which `fetch-depth` fixed).

## The mechanism, derived from the spec's own lines

The demonstration (docs-input-gate.spec.ts:964–971) runs:

    git diff --name-only no-such-rev-90 HEAD 2>/dev/null | xargs <gate>

and asserts exit 0 AND no `docs-gate:` output — "it reports it by
never running the gate at all". That is **BSD xargs**: empty stdin,
utility not run. **GNU xargs runs the utility once on empty input**
(BSD behaves like GNU's `--no-run-if-empty` by default; GNU needs the
flag). So on Linux the gate RUNS with an empty enumeration, refuses it
with a non-zero exit — its own empty-list trap, the very thing the
test's title celebrates — and both assertions red.

The finding is better than a broken test: **the documented hazard is
platform-dependent.** On macOS the pipe really does report a clean
gate for a failed range. On Linux the gate's empty-list refusal
catches exactly the failure the pipe hides. The demonstration proved
more than its author knew, on the first platform that disagreed.

## Acceptance criteria

- THE two bodies SHALL assert per-platform behaviour derived at run
  time (detect the xargs dialect, or normalize with an explicit flag
  and then ALSO pin the un-normalized divergence as the two-sided
  proof) — never a single expectation that encodes one dialect.
- THE CONVENTIONS text that states the pipe hazard SHALL say the
  hazard is platform-scoped if it currently states it absolutely —
  read the RANGE RULE / DOCS GATE recipe paragraphs and amend only
  what is false; this half is why `docs/CONVENTIONS.md` is in the
  fence.
- THE fix SHALL be proven where it reds: full-suite CI green on
  Linux (with `T-153-s5` landed or in the same run), cap 3 cycles.
- WHEN dispatching: BOTH fences are held at filing (tools/e2e by
  T-156's lane, docs/CONVENTIONS.md by T-155's) — dispatch after both
  land; the lane list is the authority.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
