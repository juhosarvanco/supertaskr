---
id: T-237-s7
title: The push guard cannot tell "I could not place that step" from "that step declares no `working-directory`", so an unplaceable step is announced as running at the repository root where every push reaches it
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-237-s3
blocked_by: [T-238]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE GUARD'S OWN DOCSTRING PROMISES AN ADMISSION THAT ITS CALLER THROWS
AWAY.** `stepWorkingDirectory` says of a step it cannot read: *"Anything
else returns `undefined`, which the caller SAYS rather than guesses
past."* The caller does not say it. `reachSentence` reads:

    const dir = stepWorkingDirectory(workflow, step.name);
    const pkg = dir === undefined || dir === "" ? undefined : dir.replace(/\/+$/, "");
    ...
    if (pkg === undefined) {
      return `    ${CI_WORKFLOW_REL_PATH} gives that step no \`working-directory\`, so it runs at the ` +
             `repository root and EVERY push reaches it (…)`;
    }

so **two different facts arrive as one value and leave as one sentence**:
a step that genuinely declares no `working-directory` (checkout, the apt
step, the two caches — six of ci.yml's twenty-six steps at `2474476`) and
a step the scanner could not place. The second is announced as the first.

**THAT IS A CONFIDENT FALSEHOOD RATHER THAN A LOST SENTENCE, WHICH IS THE
WORSE OF THE TWO FAILURES THIS ARM CAN HAVE.** `reachSentence`'s own
docstring already draws the distinction it then fails to make — *"Where
either declines the sentence SAYS which one did — a guard that answered
'no' because it could not look would be telling the seat something false
about its own tree"*. Here it answers **yes**: *EVERY push reaches it*.
The seat reads "your push touches the package that is red" about a step
whose package the guard never found.

**HOW IT WAS FOUND, AND THE CARD IT CORRECTS.** T-237-s3's card predicted
that an unplaceable step would degrade the announcement to *"that step's
package is unknown here"*. It does not: that string is returned only from
the `catch` around `readFileSync`, so it means **an unreadable ci.yml**,
never an unreadable step. Measured by the dispatching seat's bench at
`47c8845`, driving the exported `ciVerdict` with a shimmed `gh` against
the real workflow: a renamed step yields the root sentence, byte-identical
to a genuinely root-running step's. T-237-s3 pins that COLLAPSE at the
guard's own input — `stepWorkingDirectory` returns the same `undefined`
for both, so no downstream sentence can separate them — because the
repair is on the other side of its fence.

## Acceptance criteria

- THE guard SHALL distinguish a step it could not place from a step that
  declares no `working-directory`, and SHALL say which one it is looking
  at rather than announcing a reach verdict for the first.
- WHERE the step could not be placed THE announcement SHALL NOT claim
  every push reaches it: an unplaceable step's reach is UNKNOWN, which is
  the shape `pathsSince`'s own decline already has in this function.
- THE distinction SHALL be carried in the value `reachSentence` reads,
  not inferred by re-scanning — `stepWorkingDirectory` returning
  `undefined` for both is the defect, so the two cases separate at that
  function or at a sibling of it.
- A BODY in push-guard.spec.ts SHALL show the two announcements differing
  for the two inputs, and SHALL be shown red against a mutant that
  re-collapses them.
- Verification: headless.

## Why it is routed and not built

`.claude/hooks/push-guard.mjs` and `tools/e2e/tests/push-guard.spec.ts`
are outside T-237-s3's fence (`tools/e2e/tests/workflow-parity.spec.ts`,
physically enforced) and T-238 holds the guard live. Widening a fence
from inside a lane is the one repair an executor may never make
(method/roles/executor.md), so this is filed and let go.
