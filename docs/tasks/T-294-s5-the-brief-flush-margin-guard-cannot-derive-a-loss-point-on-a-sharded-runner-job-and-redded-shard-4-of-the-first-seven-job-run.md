---
id: T-294-s5
title: "The brief-flush margin guard cannot derive a loss point on a sharded runner job — on the first run of the seven-job workflow e2e shard 4 of 4 redded on `THE MARGIN GUARD: every live arm against a loss point DERIVED in this run, for a NAMED reader` because nothing was lost on that machine, while the same body is green in the single-job lane and locally"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat, 2026-09-10, reading run 34484758803 on the T-294 merge (15243f9e): shard 4 of 4 1 failed / 134 passed in 14.1 min; the failure's own message says the derived loss point equals what was written"
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts, .github/workflows/ci.yml]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Run 34484758803, the first under T-294's job graph, on a code push: `owed` 14 s, `checks` 56 s, `parser` 33 s, `app` 1 min 56 s, `native` 5 min 55 s, e2e shards 1–3 between 5 and 8 minutes green, shard 4 of 4 red after 16 min 29 s with one body failed and 134 passed. The body derives, on the machine it runs on, the byte count at which a one-read reader loses the tail of a pipe, and arms every live command against it; on the shard's runner the reader received everything that was written, so no loss point could be derived and the body refuses rather than guesses — its own message says so. The same body was green on every single-job run before the merge and is green locally. The records-only run that followed (34484967553) was green in 4 minutes because that spec was not owed. The code push's wall clock, 17 minutes, is over the thirteen-minute target because the split is unweighted (T-294-s2's finding): shard 4 carried brief-flush, checkout-currency, docs-input-gate and six more.

## Acceptance criteria

- WHEN the body runs on a machine where the one-read reader loses nothing THE body SHALL classify that machine as one where the threshold is not derivable and either derive it by a second method the spec names or record the machine's answer as the reading — never fail on an absence that is the runner's, and never pass by assuming a number; a body SHALL show the classification on a fixture reader that loses nothing.
- WHEN the e2e lane is sharded THE margin guard's arming SHALL be the same on every shard, and a shard whose reader loses nothing SHALL not red the run for it.
- WHEN this lands THE T-294 merge's run SHALL be re-read by a rerun of the whole battery on main (the nightly or a dispatch), green.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
