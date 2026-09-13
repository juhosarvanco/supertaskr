---
id: T-314-s3
title: "A tag push is refused by name with no way to qualify it, so the first release tag meets a guard that has no rule for it and the only spelling that works is the bypass this project just recorded as a procedural limitation"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-314, measured at that card's own tip through a real tag push; that card's first criterion asks for an unsupported shape to be refused BY NAME and does not ask for a rule for one"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The pre-push guard has one rule and it is about branches. A proposed
update whose remote ref is outside `refs/heads/` is refused as an
unsupported shape, which is the right direction for a guard — the
alternative was allowing a shape it was never given a rule for — and it
is measured by a body that pushes a real tag and watches it not arrive.

The consequence is that this repository cannot push a tag at all while
the hook is installed. Today that costs nothing: nothing in the record
pushes tags and no milestone has cut a release. The first one will, and
the only spelling that works then is `--no-verify` — the exact bypass
this card's own conventions bullet records as closed BY PROCEDURE.
Teaching a seat to reach for the bypass to do an ordinary thing is how a
procedural closure stops being one.

A tag has a range question that a branch does not: a lightweight tag
names a commit already on a branch, an annotated tag names an object of
its own, and neither has a meaningful old object on the remote. So the
rule is not obvious and that is why this is a card rather than a line in
the one it came from. The cheapest honest rule is probably that a tag
pointing at a commit the remote already holds on the integration branch
is qualified by whatever qualified that commit, and everything else is
still refused.

## Acceptance criteria

- WHEN a tag update is proposed THE guard SHALL have a stated rule for it rather than a refusal by absence, and the rule SHALL be derived from the object the tag names rather than from the tag's own name.
- WHEN a tag names a commit the remote does not already carry THE push SHALL still be refused, with a reason that names what would have qualified it, so the new rule narrows the refusal rather than retiring it.
- WHEN that rule lands THE bodies SHALL cover a lightweight tag and an annotated one, in both directions, through a real push against a real remote.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
