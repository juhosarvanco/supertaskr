---
id: T-295-s4
title: "The forbidden-spelling keeper has no exemption for a committed test fixture, so a diff that adds one — a credential-shaped token or an example address in a spec's own planted instance — refuses the merge with no way through; the keeper refused T-295's own merge on the verifier's bench"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: building
suggested_by: "the T-295 verifier (phase 2), 2026-09-10, running the verb against its own card on a shared clone: it stopped at keeper:forbidden-spelling because merge.spec.ts's own keeper body plants an AWS-shaped token and an example address, and both are lines the diff adds"
blocked_by: [T-295]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The verb was run against its own card on a `git clone --shared` under
the scratch directory, with the integration branch at the dispatch base
and the lane branch at the bench tip. It reached the second keeper and
stopped:

    merge T-295: stopped at keeper:forbidden-spelling (exit 1)

with two findings, both against the spec file that tests the keeper —
one line matching the AWS access key id shape and one carrying an
example address. Both are the keeper body's own PLANTED INSTANCES,
which criterion 4 required it to have.

The keeper is doing what its criterion says, so this is not a defect in
it. What it lacks is the concept the rename class already has: that
class rides `rename-scan.mjs`'s own classifier, so a spelling that file
KEEPS is kept here, which is what makes a keeper survive its second day.
The secret, address, home and name classes have no such notion, and a
merge that trips one has no way through but to edit the fixture.

In practice nothing is blocked today, because a merge of this card is
performed by the integration checkout's own script, which predates this
arm. The next card to commit a fixture of that shape is the one that
pays.

## Acceptance criteria

- WHEN a line the merge adds matches a forbidden spelling AND the line
  is a planted instance inside a spec that tests the keeper THE keeper
  SHALL have a stated way to keep it, on the rename class's own model —
  a classifier rather than a path list.
- WHEN no such classification applies THE keeper SHALL refuse as it does
  today, and a body SHALL show it refusing on a planted instance that
  is not a fixture.
- WHEN the way through is exercised THE step SHALL say so out loud, as
  `--blocks-absent` does for an absent block — a kept spelling is news,
  never silence.

## Amendment of 2026-09-13 — bounded fixture classification (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — bounded fixture classification. At this review's base the integration checkout runs the merge arm, and no corresponding fixture classification exists for the secret, address, home or name checks. The new classifier permits only explicitly synthetic keeper-test inputs under a stated recognition rule; a spec filename, a fixture comment or placement in a test directory alone does not qualify a value. The exception is per matched value and class, so keeping one synthetic instance does not suppress another unclassified forbidden value on the same line or in the same fixture block. Bodies cover an allowed synthetic keeper fixture, the corresponding value outside that fixture context, an unrecognized near-match and a mixed allowed-and-forbidden case. The last three retain the applicable refusal, and each allowed exception is announced. The classifier does not claim to prove an arbitrary credential-shaped value harmless merely because it appears in a test.

## Implementation notes

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 1 — the forbidden-spelling keeper has no fixture exemption and STATE names it as the thing stopping the merge arm on planted fixtures today. Not dispatched by this sitting.
