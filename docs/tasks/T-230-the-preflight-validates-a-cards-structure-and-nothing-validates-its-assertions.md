---
id: T-230
title: THE PREFLIGHT VALIDATES A CARD'S STRUCTURE AND NOTHING VALIDATES ITS ASSERTIONS — three of four cards dispatched in one sitting carried a false claim about the repository, and every preflight ran GREEN
feature: F-06
milestone: 4
priority: 2
size: M
status: building
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/fixtures]
suggested_by: "the architect/integrator seat, 2026-09-01 — measured across the sitting's four dispatches, and routed after @human asked whether verification's first phase belongs before dispatch"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

**A GREEN PREFLIGHT SAYS THE CARD'S DERIVABLE CLAIMS HOLD. IT SAYS
NOTHING ABOUT THE CARD'S SENTENCES.**

`brief.mjs --preflight` checks what it can DERIVE: the card file exists,
the fence expands through the registry, the blockers are met, the
frontmatter parses. All of that is structure.

It cannot check a sentence asserting something about the world. Measured
across the four cards dispatched on 2026-09-01 — **three carried a false
assertion, and all four preflights were GREEN**:

| card | the assertion | the measurement |
|---|---|---|
| `T-211` | `T-209`'s intersection is reachable as `--intersect` | `brief.mjs` freezes its flag list; no such flag. An unknown flag exits 2. |
| `T-203` | *"`docs/CONVENTIONS.md` ALREADY SAYS IT: an edit script's success is a GATE"* | zero occurrences at base and at tip |
| `T-210` | the design "EACCES-fails the checkpoint sync" | at git 2.50.1 it does not — git unlinks and recreates, and the file returns at umask default |

## THE COST IS PAID TWICE, OR PAID LATE

- `T-211`'s three false claims were found by its EXECUTOR mid-build **and
  independently by its VERIFIER in phase 1.** Two seats, the same
  discoveries, both billed.
- `T-203`'s false quote was **inherited by the executor without
  noticing** and caught only at verdict — where the remedy is a routed
  card rather than a corrected contract.
- `T-210`'s wrong prediction was found by measurement DURING the build,
  after the design had already been shaped around it.

**None of these is a hard defect in the work.** They are defects in the
CONTRACT, discovered by seats paid to build against it and judge it.

## What a fix decides

1. **Which assertions are mechanically checkable.** A quoted claim about
   a tracked file is (`does docs/CONVENTIONS.md contain this string?`). A
   claim about a flag is (`is it in the frozen list?`). A claim about a
   platform's behaviour is **not**, and the honest answer for that class
   is to route it to the verifier's phase-1 ground truth
   (`roles/verifier.md`) rather than pretend a scanner can settle it.
2. **Whether a false assertion REFUSES or DISCLOSES.** A card is prose
   and prose is allowed to be wrong in ways a fence is not — but *"this
   document already says X"* is checkable, and a preflight that finds it
   false and stays silent is the silence this project keeps converting
   into refusals.
3. **How a card MARKS an assertion it wants checked.** The cheap shape is
   a quoted string plus the file it claims to be in; the expensive shape
   is parsing prose. Prefer the cheap one and say what it does not reach.

## Acceptance criteria

- WHERE a card quotes a string and names a tracked file as its source,
  the preflight SHALL verify the string occurs in that file, and SHALL
  report every claim it could not evaluate rather than passing silently
  over it.
- THE report SHALL distinguish CHECKED-AND-HELD from NOT-CHECKABLE. A
  count that merges them is the census defect this project has already
  paid for twice (`T-142`, `T-142-s1`).
- **A POSITIVE CONTROL SHALL prove the check still PASSES a card whose
  quoted claim is true**, and a body SHALL fail if the checker is made to
  report everything unverifiable — a validator that flags every card is
  indistinguishable from one that works.
- **THE THREE INSTANCES ABOVE SHALL BE FIXTURES.** Each is a real,
  dated, reproducible false assertion, and a checker that cannot catch
  the cases that motivated it has not been measured.
- THE drill SHALL include a card whose quoted claim is true but whose
  NAMED FILE is wrong — the near-miss that a substring search over the
  whole tree would pass and a file-scoped one would catch.
- Verification: headless.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.

## Read beside

`method/roles/orchestrator.md` step 5b — which now REQUIRES this audit by
hand, and is the interim answer until this card mechanises it.
`roles/verifier.md`'s phase-1 ground truth, which owns the class this
card cannot reach. `T-229` (a control that cannot fail — the same shape
one layer down: a check nobody proved capable of refusing). `T-146`
(a rule that lives only in records).

## Why the by-hand rule landed first

`orchestrator.md` 5b was amended the same day to require this audit at
the dispatching seat, before the stamp. **That is a habit, and this
project's own measurement is that a rule depending on a reader
remembering has a failure mode while a construction does not** — the
sentence is in 5b itself, four paragraphs up from the new one. This card
is the construction. Until it lands, the habit is what there is, and it
should be read as an admission rather than a solution.

## DISPATCH, 2026-09-02 — the stamp, and what the audit found

**Fence narrowed at dispatch to three paths**: the preflight module
(`tools/e2e/scripts/card-preflight.mjs`, which owns the `--preflight`
arm the brief wrapper dispatches to), its spec, and `tools/e2e/fixtures`
for the three instance fixtures the criteria demand. `brief.mjs` itself
is OUTSIDE the fence tonight: if the wrapper must change, record the
exact edit and route it. Three sibling lanes run concurrently
(T-216-s4, T-223, T-236); none touches these paths.

**Audit (orchestrator 5b)**: `brief.mjs` freezes its flag list
(`const FLAGS = Object.freeze([...])`, an unknown flag exits 2) at
2489853, as the T-211 instance says. CORRECTED AT 4018a7b: the T-203
quote is PRESENT in docs/CONVENTIONS.md in different casing — line 190
opens the bullet "AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP", so
`grep -c` of the card's casing reads 0 and `grep -ic` reads 1. The first
version of this note asserted absence with a grep this seat never ran;
the instance is a CASE-POLICY question and the lane was told so.
The T-210 platform claim is the verifier's phase-1 ground truth.

**Holder**: this lane does NOT hold the integration checkout and does
not merge; it stamps `verifying`, reports ready-to-merge with branch and
tip, and leaves its worktree standing. review: independent, on the card
since filing — the subject is a guard.
