---
id: T-279-s2
title: "A lane decides BY HAND whether its last commit moved only the `status:` line, and T-279's exemption is what makes that judgement expensive to get wrong — give the blessed runner an arm that answers it"
feature: F-04
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-279, 2026-09-09, at f88b289"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-279 exempts one commit from a lane's owed suites: the last one, when it
moves nothing but the card's own `status:` line to `verifying`. Its
fifth criterion is the safety valve — a lane that cannot tell runs them
again — and that criterion exists because the question is currently
answered by a human reading `git show --stat` and deciding. The decision
is cheap when it is right and buys an ungraded commit when it is wrong,
and nothing in the tree records which way it went.

The question is decidable by a program: take the tip's diff against its
parent, and answer whether it touches exactly one file, that file is the
lane's own card, and the only changed line pair is a `status:` line whose
new value is `verifying`. Three answers, never two — EXEMPT, NOT EXEMPT,
and CANNOT TELL (a dirty tree, a merge commit, no parent) — with CANNOT
TELL meaning the suites are owed, which is the criterion's own default.

The blessed gate-runner is the natural home because it is the one
spelling a lane already calls to run a graded suite, so the answer
arrives at the moment it is acted on rather than in a document. The arm
reports; it does not refuse. A runner that declined to run a suite
because it believed the tip was exempt would be a gate that can talk
itself out of firing, which is the class `gate-run.mjs` was built
against.

## Acceptance criteria

- WHEN the arm is asked at a lane tip THE answer SHALL be one of EXEMPT,
  NOT EXEMPT or CANNOT TELL, naming the file set it read and the ref.
- WHEN the tip's diff touches any path other than the lane's own card, or
  any line other than a `status:` line, THE answer SHALL be NOT EXEMPT
  and SHALL name the path or the line that decided it.
- IF the tip has no single parent, or the working tree is dirty, THEN the
  answer SHALL be CANNOT TELL and the report SHALL say the suites are
  owed.
- WHEN the arm answers EXEMPT THE runner SHALL still run any suite it is
  asked to run, and the answer SHALL be reported beside the verdict line
  rather than replacing it.

## Implementation notes

## Verdicts
