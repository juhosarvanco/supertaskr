---
id: T-282-s5
title: "A suggestion duplicating a card that is IN VERIFICATION is never flagged — `TRIAGE_STATUSES` names suggested, planned and building, and `verifying` is a live board status that is none of them"
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "verifier claude-opus-5@subagent @T-282 phase 2, 2026-09-09, measured at bf22ede on the bench"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`TRIAGE_STATUSES` is `["suggested", "planned", "building"]`, and
`triageClusters` compares every suggestion against the cards that are
`planned` or `building`. **The live board carries six statuses**, derived
at `bf22ede` off the parser's own vocabulary through the card index:
`building, done, parked, planned, suggested, verifying`. A card at
`verifying` is in flight — it has a lane, a fence and an executor's work
behind it — and it is invisible to the duplicate flag.

T-282's card is itself the worked example: at the moment this was
measured, T-282 was `verifying`, so a suggestion cloning its fence and
its class parent would have been reported as sharing ground with nobody.
The window is not small — a card sits at `verifying` from the executor's
last commit until the merge, which is exactly the window in which a
triage seat is most likely to file the same defect again, because the
work is done and not yet on main.

**THIS IS NOT A DEFECT AGAINST T-282's CRITERION**, which says *"a planned
or building card"* in as many words and was implemented exactly. It is
the criterion that is narrower than its own purpose, and the body
`THE STATUSES THIS VIEW RULES ON ARE THE PARSER'S OWN WORDS` already
pins the set against the parser rather than against a retyped list — so
the change is one entry plus the body that says why `done`, `parked` and
`rejected` stay out while `verifying` comes in.

Class parent: T-282. Disposition hint: promote with T-282-s1 or any
later dispatch-brief lane; it is one array entry and one assertion.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 3 — the triage statuses omit `verifying`, so a suggestion duplicating a card in verification is never flagged: this sitting's own instrument. Not dispatched by this sitting.
