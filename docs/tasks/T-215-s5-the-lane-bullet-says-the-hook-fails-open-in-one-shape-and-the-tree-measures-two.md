---
id: T-215-s5
title: The lane bullet says the hook FAILS OPEN "in exactly one shape" and this repository's own spec measures a SECOND — ARM B needs ONE fault where the published shape needs two, so the paragraph T-215 just corrected still publishes a guard narrower than it is
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: "verifier claude-opus-5@subagent @T-215"
builder:
verifier:
review: independent
---

**`T-215` CORRECTED THE LIMITS AND LEFT THE SENTENCE UNDERNEATH THEM
UNTOUCHED**, because it was carried verbatim from the base and no
criterion pointed at it. `docs/CONVENTIONS.md`'s lane bullet, at the foot
of the limits paragraph:

> And the hook FAILS OPEN in exactly one shape, the harness's own
> contract: a command hook whose script cannot be LOCATED never starts,
> which takes `CLAUDE_PROJECT_DIR` unset AND a shell cwd outside any
> checkout carrying the hook, both wrong at once.

**"BOTH WRONG AT ONCE" IS THE CLAIM, AND THIS REPOSITORY ALREADY
MEASURES A SHAPE THAT NEEDS ONE FAULT.**
`tools/e2e/tests/checkout-currency.spec.ts:387` says so in its own name:

> ARM B: a registration that looks fully configured but whose hook FILE
> is absent FAILS OPEN — node starts, exits 1, and 1 is not 2

In that body the registration is the tip's own `.claude/settings.json`,
`CLAUDE_PROJECT_DIR` resolves CORRECTLY, and only
`.claude/hooks/<name>-hook.mjs` is missing. `checkout-currency.mjs`'s
header states the measurement in as many words — *"ONE fault, not two:
`exit = 1`, `cannot find module` on stderr"* — and draws the consequence
this document does not: **a checkout in arm B passes an inspection of its
registration while refusing nothing.**

## Why it is the same class as `T-215` itself

`T-215`'s opening line is *"A DOCUMENT THAT PUBLISHES A GUARD'S LIMITS IS
PART OF THE GUARD"*, and its title paragraph is *"a guard believed wider
than it is is worse than no guard"*. This is the same failure in the
other direction: a guard published as failing open **more narrowly** than
it does, so a reader who checks the two published conditions and finds
them satisfied concludes the hook is armed when it may not be. **It sat
inside the very paragraph `T-215` rewrote and survived an audit of all
eight numbered limits**, which is the argument for a card rather than a
habit.

## What a fix decides

1. **Whether the count is two or more.** ARM A (no matcher registered at
   all) is a THIRD state in `checkout-currency.mjs`'s own enumeration and
   is arguably not "fails open" but "never invoked". Decide whether the
   sentence enumerates or stops claiming a count — *"in exactly one
   shape"* is the load-bearing half, and dropping the count costs
   nothing the paragraph needs.
2. **Whether the STALE shape belongs beside it.** A checkout behind main
   on `.claude/` runs an OLDER judgement rather than none, which is not
   fail-open and should not be filed as one — but it is the state
   `T-216-s1` built a catcher for, and the paragraph now names that
   catcher one sentence earlier.
3. **Whether this belongs in the paragraph at all or under the arm that
   measures it.** `checkout-currency.mjs` is the authority; a second copy
   is the T-057 sin the limits paragraph already avoids for limit 6 by
   pointing rather than restating.

## Acceptance criteria

- `docs/CONVENTIONS.md`'s lane bullet SHALL NOT claim a fail-open shape
  count that `tools/e2e/scripts/checkout-currency.mjs`'s arm enumeration
  contradicts.
- The published text SHALL be true for ARM B — a complete registration,
  a correctly resolving `CLAUDE_PROJECT_DIR`, and an absent hook file.
- CONSIDER pointing at the arm that measures it rather than restating
  it, the treatment limit 6 already gets one sentence earlier.
- Verification: headless.

## Measured

At `49f2e8cc1b360b1799fd0018849a63cd8580ae27`, on the bench
`../nputer-V-T-215`, while verifying `T-215`. The spec body and the
script header are both at that ref; nothing was run to establish this
beyond reading the two files, and the body itself is green — it asserts
the fail-open, it does not forbid it.
