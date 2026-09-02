---
id: T-223-s5
title: A mutant's COUNT was read as its mechanism twice in one card — both drills reported the expected number and neither failed where its author thought
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-223-s3
blocked_by: []
touches: [method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-221`** (where the property lives in data, the mutant
is a data mutant) — this is the grading half of the same rule.

`method/roles/verifier.md` step 2b already says **"READ THE MUTATION'S
OWN REPORT — a pattern that silently fails to match reports
*survived*"**. That covers a mutant that never landed. It does not cover
the two cases measured under `T-223-s3`, both of which LANDED, both of
which produced exactly the count their author predicted, and neither of
which failed where the author thought:

| the drill | reported | what actually happened |
|---|---|---|
| move `main` to the lane tip (one line) | *24 passed, SURVIVES* | it did NOT survive — 1 failed / 23 passed, red at the body's own `update-ref` self-check two lines below, never reaching the assertions the drill was about |
| rewrite the moved-to card NARROW | *1 failed / 23 passed, so the body binds to the fence* | the rewrite wrote the SAME BYTES `main` already carried, so `git commit` refused an empty commit and the body died in its own setup — the gate never ran |

Both numbers were right. Both mechanisms were wrong, in opposite
directions: one under-reported a kill, one over-reported a
discrimination. **The count is the one thing a mutation report cannot
be graded on**, and the existing sentence reads as though the failure
mode were only the mutation that did not apply.

Two sub-rules fall out, and neither is written anywhere in `method/`:

1. **ATTRIBUTE A MUTANT'S RED BY THE ASSERTION THAT FIRED, NEVER BY THE
   COUNT.** A kill set of one is evidence of containment and evidence of
   nothing else; the assertion's own message says which property died.
   `docs/STATE.md`'s hazard list already carries the base-red form of
   this ("attribute a red by NAME at the base, never by count") and
   `docs/rooms/loop-efficiency.md` carries the instance — the drill form
   has no home.
2. **A DATA MUTANT MOVES THE MUTATION'S OWN SELF-CHECK WITH THE DATA.**
   A body that asserts its own fixture step did what was asked
   (`expect(rev-parse main).toBe(wide)` right after `update-ref … wide`)
   is bookkeeping, not an oracle for the property under test — leaving
   it behind stops the mutant at the setup and grades the wrong line. The
   rule that already exists, *mutate one side only, never a literal the
   two SHARE*, points the other way here and is what makes this worth
   writing down: the self-check and the data DO share a literal, and
   moving both is still a one-sided mutation because neither is an
   assertion about the subject.

**FENCE.** `method/roles/verifier.md` step 2b alone — the sentences
above are additions to a paragraph that already exists there.
`docs/CONVENTIONS.md`'s POISON DRILL bullet defers the generic judging
rules to that file in as many words, so it needs no edit and this card
does not fence it. A `method/**` diff fires the METHOD EVAL GATE.

**WHY IT IS ROUTED AND NOT BUILT.** `T-223-s3`'s fence is
`tools/e2e/tests/landing-gate.spec.ts` alone. The finding is recorded in
that card's own build notes with both measurements; this card is the
rule.
