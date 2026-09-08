---
id: T-239-s4
title: The arm's step-1 commit runs with no git identity on the CI runner, so the file-for-file body reds on CI where twenty-eight local batteries were green — main is red on CI at 9646618
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: the architect seat, from CI run 33672240360's own log, 2026-09-02
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/dispatch-brief.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding, verbatim from the runner

CI run 33672240360 on 9646618 (the push that landed T-239) failed one
body: brief.spec.ts:3230 *THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND
STEPS LEAVE, file for file*. The arm's dispatch reported *"the dispatch
stopped at step 1 (stamp) — … It ran: git -C /tmp/t239-ritual-…/one/nputer
commit … *** Please tell me who you are."* The runner has no global git
identity; every seat's machine does, which is why the body was green in
the lane, on the bench, and in every battery since. The T-238-s2 class
(room item 20): a property of the host that CI alone measures.

## What is asked

The fixture the two T-239 bodies build SHALL configure a git identity in
the fixture repositories it creates (user.name and user.email in the
repository's own config, as git-fixture.ts's helper does), OR the arm's
step-1 commit SHALL pass an explicit identity for a repository whose
config has none and say so in its plan; the card decides which after
measuring which of the two the hand ritual's own commit in the body uses.
The body SHALL then be run with HOME pointed at an empty directory (no
global config) as its positive control, so the runner's condition is
reproduced locally before the fix and green after it.

## Acceptance criteria

- With HOME set to an empty directory, both T-239 bodies are red at the
  base and green at the tip.
- The arm's dispatch on a real checkout with an identity is unchanged
  (the plan text and the stamp commit's author).
- Existing brief.spec.ts bodies green; kill sets disjoint.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, main RED on CI

The architect seat. The user's standing instruction is no new dispatch,
so this waits at the head of the queue; main is red on CI until it
lands. Nothing else in the run failed (651 of 652 bodies green).
