---
id: T-325
title: A scheduled run cancels the push run for the same sha — the workflow's concurrency group is keyed on the sha with cancel-in-progress, so the nightly schedule firing on a freshly pushed tip cancels that push's run and the push's own verdict is never recorded
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-14, from the CI watch on the push of 37d89ff7"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

At 37d89ff7 (the T-290 dispatch stamp, pushed 2026-09-14T12:56Z) the push's run 34846242787 (event push, created 12:56:49Z) was CANCELLED at 12:58:52Z, with checks, owed, app and parser already green and native and the four e2e shards cancelled mid-flight; a run 34846396233 (event schedule, created 12:58:24Z) for the SAME sha started in its place and ran the whole workflow. The cause is the workflow's own concurrency rule at .github/workflows/ci.yml, `group: ci-${{ github.workflow }}-${{ github.sha }}` with `cancel-in-progress: true`: a scheduled run and a push run for one sha share the group, and the later one cancels the earlier. The seat's CI watch reads "the run for the sha" and saw the cancelled one; the tree's verdict for that push lives only in the scheduled run, which the watch does not look for, and the push record in the meters and the ledger says cancelled where the sha was green. Attributed TRANSIENT by the seat under T-322's rule: the cancellation is the runner's own scheduling, not a body.

## Acceptance criteria

- WHEN a scheduled run and a push run would share a sha THE concurrency group SHALL keep them apart (the event in the group's key, or the schedule excluded from cancellation), so a push's run is never cancelled by the schedule and the schedule's run is never cancelled by a push; pinned by a body in tools/e2e/tests/workflow-parity.spec.ts that reads the workflow's concurrency block and reds where the group key omits the event while cancel-in-progress is set.
- WHEN a run for a sha is cancelled and another run for the same sha concluded THE seat's CI watch SHALL report the concluded run's verdict as the sha's, naming both runs, never a cancelled run alone; a wording obligation on the watch script the seat keeps in its scratch, recorded here for the return brief's push evidence (T-322) which reads the runner's runs by head sha.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
