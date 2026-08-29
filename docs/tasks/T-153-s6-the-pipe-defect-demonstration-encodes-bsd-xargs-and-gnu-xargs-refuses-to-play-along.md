---
id: T-153-s6
title: The pipe-defect demonstration encodes BSD xargs — GNU xargs runs the gate on empty input, the gate refuses the empty list, and two Linux bodies red proving the hazard is platform-dependent
feature: F-01
milestone: 4
priority: 4
size: S
status: verifying
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

Built at base `c9e6a3d` in `/Users/ujju/Projects/nputer-T-153-s6` on
branch `task/T-153-s6-xargs-dialect`. THE DIALECT IS PROBED, NOT
NORMALISED — the criterion's first option — and the divergence is pinned
on both sides so that collapsing it reds.

**`tools/e2e/scripts/xargs-dialect.mjs` (new).** Two observables, run
through `/bin/sh`: does an EMPTY input invoke the utility (read off a
marker the utility prints, so "did it run" is observed and not inferred),
and what does a utility exit of 7 arrive as. `XARGS_DIALECTS` holds the
two measured rows — bsd `{runsUtilityOnEmptyInput: false, nonzeroBecomes:
1}`, gnu `{true, 123}` — and the probe returns whichever row matches
BOTH, or `unknown`. Never `process.platform`: the question is what the
`xargs` on this PATH does, which a mac with findutils installed answers
differently from its platform name. The module resolves no path under
`docs/`, so it does not move the DOCS GATE's reader census (still 22
readers across 4 suites at `3639d01`).

**`range-rule.mjs`.** `parseDocsGateRecipe` used to take column 3 as "the
`$(…)` cell" and column 5 as "the piped cell" and call both BSD, so the
GNU half of a table that already had one was parsed and thrown away. The
columns are now read from the HEADER — each cell names a FORM and a
DIALECT — and `docs-gate-recipe-exit-codes` compares the DETECTED
dialect's column. Added, all one-sided against the document: the doc's
dialect set must equal the prober's; the empty-list cells must DIVERGE
across dialects; the `$(…)` columns must AGREE; and the probe is
cross-checked against whether the real gate spoke on the empty list. The
old "printed and piped agree on a REAL range" control was BSD's alone —
it is the assertion that redded on Linux — and is replaced by the
per-dialect comparison plus the surviving empty-list discrimination
control.

**`docs-input-gate.spec.ts:906`.** The piped arm writes both dialects'
expectations side by side (`bsd {0, gate did not run}`, `gnu {123, gate
RAN and refused}`), asserts they disagree on the code AND on whether the
gate ran, asserts the table names exactly the prober's dialects, and reds
on `unknown` rather than defaulting.

**`docs/CONVENTIONS.md`.** Two false sentences, both in the BSD
direction. (1) The matrix's GNU piped cell for "2 called wrong" said
`**123**, or **0**` — the `0` was BSD's behaviour assumed universal. GNU
RUNS the gate on an empty list, the gate's own refusal exits 2, and GNU
maps it to 123; the cell now reads `**123**, and **123** on an empty
list`. (2) The bullet promised the GNU column would close "at the repo's
first push, when the ubuntu runner executes the `npm run lint:docs`
step" — that step is `node scripts/docs-gate.mjs --census` and has no
`xargs` in it at all, so nothing there could ever have closed it. What
closed it is the e2e lane. The hazard is now stated as platform-scoped
and NOT the same hazard on both: BSD hides a failed range, GNU destroys
the codes' identity. `docs-gate.mjs`'s header — the second copy of that
story — gained the same one-sentence correction.

### CI, per body, not by colour

| cycle | run | head | the two bodies | other reds |
|---|---|---|---|---|
| 1 | 33271000696 | `3639d01` (PR merge ref `28a5a34`) | BOTH GREEN | 29, and they are `T-153-s9`'s set line for line |
| 2 | 33272004368 | `24f96cd` (PR merge ref `4c76707`) | BOTH GREEN | 29, the same set, re-enumerated |

Cycle 2 carries the notes commit; a THIRD run fires on the push that
adds this row and carries nothing but this card's own text — it is left
for whoever integrates, and the verdict above does not wait on it.

Each cycle's disclosure line, printed by the runner:
`xargs at /usr/bin/xargs: empty input RUNS the utility; a utility exit of
7 arrives as 123 — the gnu row; the matrix's gnu column is the one
compared`. That line IS the GNU measurement the bullet now cites. The 29
were enumerated and compared against `T-153-s9`'s card: `brief.spec.ts`
at :255, :291, :313, :630, :656, :679, :706; `card-figures.spec.ts` at
:121…:438 (twenty-one); `dispatch-order.spec.ts` at :200. Nothing outside
that set redded, and s9's own card predicted the remaining two would be
this card's.

### Local, at `24f96cd` on Darwin 25.6.0

`npm test` from tools/e2e/ 281 passed exit 0 (twice: at `3639d01` and at
this tree, `NPUTER_E2E_PORT=14733`, lsof zero rows before binding);
`npm run typecheck` exit 0; `npm run lint:tokens` exit 0; `npm run
lint:docs` exit 0 (CONVENTIONS 117399 bytes against a warn of 137928);
`cargo test` from app/src-tauri/ exit 0, 522 passed, 4 ignored — owed
because the DOCS GATE fires on this diff and names `cargo test from
app/src-tauri/` and `npm test from tools/e2e/` for `docs/CONVENTIONS.md`.

### Drills — one side only, restoration proved

| mutant | side | observed |
|---|---|---|
| the matrix's GNU empty-list cell reverted to the pre-fix `**0**` | document | RED on **BSD**: "the DOCS GATE matrix now gives the SAME empty-list code for every dialect (0, 0)". The mutant that shipped is now caught on the platform that cannot observe it |
| a third dialect on PATH (runs on empty like GNU, maps nonzero to 99 like neither) | environment | RED in BOTH bodies, naming the observations and refusing to pick a branch |
| the spec's `gnu` expectation collapsed to `code: 0` | spec | RED on BSD at the two-sided pin ("the codes differ"), before any measurement is taken |
| a GNU-dialect `xargs` shim ahead of PATH, no repo file touched | environment | GREEN, 67/67, taking the gnu branch and comparing the gnu column |

Restoration: `docs/CONVENTIONS.md` back to
`feb9ffef829e5ce5922011ad3b993152eb6dfaef5ae4259dfe25ec34c7dcb4eb`,
`docs-input-gate.spec.ts` back to
`f0aca063a03aafaa5606511ed2b382ee7bc3a6a763b648364805f46c642b9692` —
both sha256, both matched. The two shims live in the session scratchpad
and were never in the tree; the GNU one is an EMULATION, so it proves the
CODE PATH and not the dialect — the dialect is proved by CI, which ran a
real GNU `xargs`.

### For the verifier

- The two-sided pin has three parts and they are separable: the
  document's diverging cells, the spec's diverging expectation rows, and
  `unknown` being a failure. Killing any one alone should red — the
  drills above kill the first and third; the second is the `code: 0`
  mutant.
- `probeXargs` memoises per process. A drill that swaps PATH must start a
  new process (playwright workers are fresh, so this is invisible in
  practice).
- The GNU cell now reads "**123**, and **123** on an empty list". The
  parser's `onEmptyList` matches the second occurrence; if that sentence
  is reworded, re-read `first()` and `onEmptyList()` together.

### Noticed, not done — routed

`T-153-s11` (suggested): the platform story is told twice — the DOCS GATE
bullet and `docs-gate.mjs`'s header — and T-057's parity body compares
only the two recipe LINES, so the paragraphs around them can drift. This
lane corrected both by hand in one commit; had it edited one, every gate
would have stayed green with the copies disagreeing.

### Where the brief was wrong

Nothing in it contradicted the repository. Two corrections to my own
first readings rather than to the brief: `timeout docker info` returned
127 because macOS has no `timeout`, not because Docker is absent — the
CLI is installed (29.2.1) with no daemon listening, and the bullet's
container-runtime parenthetical is amended to say exactly that; and the
base is stated as `46dd8f8` in the brief's ROW 4 while the lane was cut
at `c9e6a3d`, main's dispatch commit atop it, which is what the
dispatcher's coordinates say and what `git merge-base` confirms.

## Verdicts
