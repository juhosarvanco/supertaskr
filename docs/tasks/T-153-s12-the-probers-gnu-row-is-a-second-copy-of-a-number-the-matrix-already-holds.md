---
id: T-153-s12
title: The prober's GNU row restates a number the DOCS GATE matrix already holds, and nothing compares the two copies — corrupt the row on Darwin and every gate stays green
feature: F-01
milestone: 4
priority: 5
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: verifier claude-opus-5@subagent @T-153-s6
builder:
verifier:
built_by:
verified_by:
review:
---

T-153-s6 closed the defect where a GNU cell of the DOCS GATE matrix was
wrong and only Linux could say so: the empty-list cells must now DIVERGE
across dialects, and reverting that cell to its pre-fix value reds on
Darwin. That repair is sound. It also introduced a SECOND statement of
GNU's exit mapping, in a different file, and the two are not compared.

**The two copies.** `docs/CONVENTIONS.md`'s matrix says the piped
spelling under GNU gives 123 for "has a verdict", 123 for "could not
run", and 123 on an empty list — three cells that are all one rule,
"a utility exit of 1 to 125 arrives as 123". `tools/e2e/scripts/
xargs-dialect.mjs` states the same rule again as
`XARGS_DIALECTS.gnu.nonzeroBecomes`. Nothing in the tree relates them.
`range-rule.mjs`'s `docs-gate-recipe-exit-codes` compares the two
sides' dialect NAMES (`key(recipe.dialects) !== key(known)`) and never
their VALUES, and `docs-input-gate.spec.ts`'s table is checked for
divergence rather than against the document's numbers.

**Measured, not argued.** Editing `nonzeroBecomes: 123` to
`nonzeroBecomes: 1` in `XARGS_DIALECTS` and running
`tests/docs-input-gate.spec.ts` and `tests/range-rule.spec.ts` on
Darwin 25.6.0 gives 67 passed, exit 0. On a GNU machine the same edit
makes the probe match no row, so both bodies red as `unknown` — loud,
but only there. That is the shape of the defect T-153-s6 was filed
against, one level up: a value about a platform this machine cannot
observe, with no local reader.

**The remedy is cheap and needs no second platform.** The matrix already
carries, per dialect, what each of the gate's own exit codes becomes
under the pipe. A reader can assert that relation against
`XARGS_DIALECTS` for EVERY dialect the table scores, not only the
detected one: for each dialect `d` and each row whose `$(…)` cell is
nonzero, the piped cell must equal `XARGS_DIALECTS[d].nonzeroBecomes`;
where the `$(…)` cell is 0, the piped cell must be 0. That is derivable
from the document on any machine, it pins the GNU row from Darwin and
the BSD row from Linux, and it reds the moment either copy moves alone.

Worth pairing with `T-153-s11`, which is the same class in prose: one
fact told twice with only part of it pinned.

## Acceptance criteria

- THE reader SHALL compare `XARGS_DIALECTS`'s exit mapping against the
  DOCS GATE matrix's piped cells for EVERY dialect the matrix scores,
  including dialects this machine cannot run.
- WHEN either copy is edited alone THE suite SHALL red on the platform
  running it, whichever platform that is.
- THE check SHALL derive its expectation from the document rather than
  restating the numbers a third time.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
