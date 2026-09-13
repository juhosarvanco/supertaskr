---
id: T-311-s9
title: "The card preflight re-enters criteria scope at every heading of that name, so a verdict's own per-criterion table is judged as the card's acceptance criteria and its path tokens can refuse a dispatch"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-311-s5, measured in the lane while making the advisory reader share this rule and reported in its notes, 2026-09-13"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

The preflight scopes a card's lines so that its refusing arms read the
acceptance criteria and not the body, which is what keeps it from
refusing a dispatch over an illustrative path. The scope is entered at
every heading whose name matches, not only at the card's own criteria
section, and a verdict that tables its findings under a heading of that
name therefore hands the arms a second criteria section written by the
verifier after the fact.

## The finding

Measured over `docs/tasks/` at 71b52a01125d with the preflight's own
reader: seven cards carry more than one heading the criteria rule
matches, and on every one of them the lines under the second heading are
scoped `criteria`. T-093 is the widest case, where 77 lines are scoped
criteria and 46 of them sit under the card's own section; the rest are a
verifier's per-criterion table, appended under the Verdicts heading, in
which each item is the criterion quoted back with a verdict beside it.
The other six are T-112-s3, T-248-s1, T-248-s2, T-248-s5, T-249-s1 and
T-264-s6.

Two things follow, and the second is the one that costs. A path token
written inside that table is judged by the arm that refuses on a
criterion naming a path the fence does not carry, so a verifier quoting
a path in a finding can refuse a later dispatch of the card it was
verifying. And the table is prose about a pass that is over, so
whatever the arms conclude from it is a claim about the wrong tree.

The repair is a scope that opens once. The card's criteria section is
the FIRST heading the rule matches, which is what every other reader of
a card already takes, so the preflight can stop re-entering and say in
its own comment why the second heading is somebody else's section. The
alternative — refusing a card that carries two — is worse: the table is
a good habit and the cards carrying it are done.

## Acceptance criteria

- WHEN a card carries more than one heading the criteria rule matches THE preflight SHALL scope only the section under the first as criteria, and a body over a planted card with a verdict's table below its own criteria SHALL show a path token in that table read as body rather than as a criterion.
- WHEN the change lands THE count of cards whose lines the preflight scopes as criteria SHALL be measured at the lane's own ref before and after and reported on the card, so the narrowing is a figure rather than a claim.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
