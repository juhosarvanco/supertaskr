---
id: T-205-s19
title: "The method-eval corpus has no FLOOR — `loadEvals()` is a directory scan, so deleting an eval file leaves `9 model-free eval(s)` at exit 0 and the suite reports a smaller world as a pass"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-205-s4
blocked_by: []
touches: [tools/method-evals/]
builder:
verifier:
built_by:
verified_by:
review:
---

**AN EXIT CODE IS A SUMMARY, AND A SUMMARY OF NINE THINGS LOOKS EXACTLY
LIKE A SUMMARY OF TEN.** `run.mjs` builds its corpus by scanning
`evals/`. There is no declared floor, no expected id set and no count
pinned anywhere a diff would have to touch deliberately.

**MEASURED, AT `0bf398c`.** Move one eval module out of `evals/` — this
was found by aiming the `T-205-s4` attack set's C2.5 at MF-02 itself:

    node tools/method-evals/run.mjs
    .........  9 model-free eval(s)
    exit 0

Ten became nine and the gate called it a pass. Nothing in the tree
compares the corpus against a list of what is supposed to be in it, so a
deletion, a rename that misses the loader's suffix, or a module that
quietly stops exporting a default is indistinguishable from a clean run.

**WHY IT IS WORTH A CARD AND NOT A SHRUG.** This is
`tools/e2e/scripts/gate-run.mjs`'s own charter — *a red over zero bodies*
and *a comparison over an empty corpus* are two of the six measured
instances that put the blessed runner in the tree — applied to the one
suite that does not go through it. It is also the shape `MF-02` itself
now guards against in miniature: the eval throws when it examines no
citations, and throws AGAIN when it examines no LETTERED citations,
because a widened predicate that matches nothing is a quieter version of
the hole it closed. The suite owes itself the same guarantee it demands
of its members.

**PRE-EXISTING, AND OUTSIDE THE FENCE THAT FOUND IT.** `T-205-s4`
changed no line of `run.mjs`; this is the state at its base ref too. It
is filed rather than fixed for that reason.

## Acceptance criteria

- `run.mjs` SHALL refuse a run whose loaded corpus is smaller than the
  declared floor, and the refusal SHALL be `COULD NOT RUN`, never a pass.
- THE floor SHALL be DERIVED from something a deletion must also touch —
  the declared id set, or a committed manifest — never a bare integer
  typed beside the loader.
- A POSITIVE CONTROL SHALL remove one eval module and require the suite
  to refuse, demonstrated red against the current directory scan before
  it is trusted passing.

## Read beside

`tools/method-evals/run.mjs` (`loadEvals` and `main`),
`tools/method-evals/lib/harness.mjs` (the `COULD NOT RUN` path), and
`tools/e2e/scripts/gate-run.mjs`'s header, which is the charter this
card applies to the one suite outside it.
