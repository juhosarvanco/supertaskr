---
id: T-236-s7
title: The lookbehind guard in T-236-s1's label reader is unpinned — neutering tail_of_longer_label to false leaves the whole cargo suite green
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs]
suggested_by: verifier claude-opus-5@subagent @T-236-s1
builder:
verifier:
built_by:
verified_by:
review: independent
---

**CLASS PARENT: T-236-s1**, whose fix this is a coverage residual of.
**DISPOSITION HINT: fold into T-236-s5**, which already opens `row_lane`
and this same reader — the two want one lane, and this one is a single
test body rather than a change to shipped behaviour.

**FOUND BY THE VERIFIER'S OWN MUTANT, NOT BY THE LANE.** `T-236-s1` added
`backticked_after_label` carrying the JS reader's lookbehind as
`tail_of_longer_label`: a label immediately preceded by a letter and a
space is the TAIL of a longer label, so a bare `branch` read can never
answer with the integration branch's name. **Mutating that function to
return `false` unconditionally leaves `cargo test -p nputer --lib
--no-fail-fast` GREEN at exit 0 over 270 bodies** at
`8508b88277e72c47bdcba8ae926637d6471878da`. It was the one mutant of five
that survived.

**THE GUARD IS CORRECT — THIS IS COVERAGE, NEVER A DEFECT.** Probed
directly at that ref through a scratch body, it answers exactly as the
JS lookbehind `(?<![A-Za-z]\s)` does:

    backticked_after_label("the integration branch `x`",
                           "integration branch")            => Err(0)
    backticked_after_label("integration branch `main`; branch `task/T-NNN`",
                           "branch")                        => Ok("task/T-NNN")

including that `é` and an em dash do not count as letters in either
implementation. **Nothing in the tree holds any of that.** It survives
because the guard is unreachable from the LIVE document: `docs/
CONVENTIONS.md` spells `integration branch ` exactly once, never
preceded by a letter, and no shipped body reads that bullet under the
bare label `branch`.

**WHY IT IS WORTH A BODY.** The guard is the whole of why the reader is
not a bare `find`, and it is the half of the JS parity that has no
witness. The cheapest fix is one body over a planted bullet asserting
both lines above — the same overlay shape
`an_integration_branch_the_bullet_does_not_spell_exactly_once_is_a_refusal_never_a_default`
already uses, so it costs a fixture and no new machinery. **The mutant
above is the acceptance test**: neuter `tail_of_longer_label` and the
new body must red.
