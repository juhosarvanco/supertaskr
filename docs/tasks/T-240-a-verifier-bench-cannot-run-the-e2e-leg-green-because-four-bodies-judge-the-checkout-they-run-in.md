---
id: T-240
title: A VERIFIER BENCH CANNOT RUN THE E2E LEG GREEN — four bodies judge the checkout they run in, and a bench detached at a lane's base is "stale" to that judge by construction, so the seat that owes step 7 the hardest is the one seat that cannot discharge it
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-018-s2
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review: independent
---

`method/roles/verifier.md` step 7 requires a verifier to run the gates
its OWN commits could move, at the tip it created — *"a role that writes
to the tree owes the tree's gates, even when what it wrote was prose"* —
and appending a verdict to a card puts that verifier squarely in the
docs gate's `npm test from tools/e2e/` column. **The e2e leg cannot go
green from a verifier bench, at any ref, for any diff.** Measured at
`4e85b4d`/`3f7b43b` and again at `69a8477` from
`/Users/ujju/Projects/nputer-V-T-018-s2` on 2026-09-02: **the same four
bodies fail at both refs**, 544 passed / 4 failed at the verdict's tip
and 73 passed / 4 failed over the three spec files at the lane's base —
**the base being a ref where neither the diff under review nor the
verdict existed**, which is what attributes the red to the bench rather
than to anything under judgement.

    tests/checkout-currency.spec.ts:852  THE WIRING'S POSITIVE CONTROL: the same arming step says CURRENT for a current checkout, and adds no finding
    tests/checkout-currency.spec.ts:953  THE SWEEP AT ARM TIME: the arming step RUNS it, and names every checkout git reports
    tests/card-preflight.spec.ts:684     a discrepancy answers ONE and a preflight that could not run answers THREE
    tests/lane-lock.spec.ts:899          the DISPATCH STEP arms it - `brief.mjs --write-fence` is the one event, and a widening is the same event again

**ONE CAUSE UNDER ALL FOUR**, and each of them embeds it rather than
asserting it: `checkout-currency.mjs` judges the checkout the command
runs in, and it answered

    verdict: stale
    STALE [guard-surface-behind] the judged checkout ... does NOT contain
    99349db - the newest main commit touching .claude. It is 28 commit(s)
    behind main.

**A VERIFIER BENCH IS DETACHED AT THE LANE'S BASE ON PURPOSE**
(`roles/orchestrator.md` 5c cuts it there so phase 1 is blind), so it is
behind `main` by construction and gets more so with every commit that
touches `.claude`. The bench is not misconfigured; being behind is the
whole point of it. **This is `T-216-s4`'s shape one layer over** — that
card fixed four bodies that reddened because of WHERE they ran (inside a
fenced lane); these four redden because of WHAT REF the checkout sits
at, and the machine-scoped/checkout-scoped seam `method/lane-protocol.md`
rule 4 names is the same seam.

**WHAT IS NOT CLAIMED HERE.** The guard is not wrong: a session started
in a checkout 28 commits behind main really is loading older hooks, and
`T-216-s1` built the catcher precisely so that fact reaches somebody.
The defect is that its POSITIVE CONTROL body asserts the answer for the
checkout it happens to be running in, so the body's verdict is a
function of the runner's vantage rather than of the code. Candidate
shapes, none of them costed here: run these four against a fixture
checkout the body BUILDS (the shape
`checkout-currency.spec.ts:591`'s own positive control already uses, and
which passes from this bench), or let the vantage be injected the way
`--integration-ref` already can be.

**UNTIL THEN, A VERIFIER'S STEP-7 REPORT SHOULD SAY WHICH LEG IT COULD
NOT DISCHARGE AND WHY**, with the base-ref control beside it, rather
than reporting four reds as if they were the diff's — which is the
failure `method/roles/verifier.md` step 0 calls this seat's most common.
