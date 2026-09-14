---
id: T-242-s1
title: "A method bump stales the generated interview skill, and the merge verb's bump step does not regenerate it — the artifact carries the version stamp verbatim, so the commit that moves the stamp leaves the tree red behind it"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-242, measured in that lane while building the generator"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, tools/e2e/scripts/interview-skill.mjs, tools/e2e/package.json]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-242 delivers `method/skills/supertaskr-interview/SKILL.md` as a
generated artifact that embeds `method/interview/plan-interview.md`
byte for byte. That method file is one of the three the method stamp
lives in, and `--bump` rewrites its version parenthetical. So every
bump makes the committed artifact stale against a fresh generation,
and the commit that performs the bump is the commit that leaves it
stale.

T-242 bought most of the remedy inside its own fence. The
regeneration is chained into `npm run capabilities`, which the merge
verb already runs when a spec name moved, and the currency half is
chained into `npm run capabilities:check`, which CI runs as a step —
so a stale artifact reds on the runner rather than sitting unseen.
What is still open is the case the chain does not reach: a merge whose
diff moves method text and no spec name, where `bumpSteps` writes the
three stamp files and nothing regenerates the artifact. The merge then
stops, or lands, with a tree whose own `capabilities:check` reds on the
next push.

The generator's refusal message already names the cause in as many
words, so whoever meets it is not puzzled. That is a good error
message standing in for a missing step.

## Acceptance criteria

- WHEN a merge's plan carries a method stamp bump THE plan SHALL carry
  a regeneration of the generated interview skill after the bump step
  and before the counts, so the committed artifact and the stamp move
  in one commit.
- IF the regeneration is planned but the artifact does not move THEN
  the step SHALL still be a no-op rather than a refusal, because a bump
  that touched no embedded source changes nothing.
- WHEN the plan is derived for a merge that moves no method text THE
  regeneration step SHALL be absent, pinned by a body that reads the
  planned step ids.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
