---
id: T-282-s1
title: "The triage cluster view is derived, bodied and unreachable — `brief.mjs --dispatch --full` never calls it, so the section T-282 criterion 1 specifies renders nowhere"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-282, 2026-09-09, at 3a69385"
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

T-282's fence is `dispatch-brief.mjs`, `brief.spec.ts`,
`health-bands.config.mjs` and `health-bands.spec.ts`. Its criterion 1
names the RENDER SITE: *"WHEN `brief.mjs --dispatch --full` renders its
triage section"*. Derived at `3a69385`: that view is built by
`dispatchReport` in `tools/e2e/scripts/dispatch-order.mjs`, called from
`brief.mjs`'s `wantsDispatch` arm — neither file is in the fence, and no
triage-of-suggestions section exists in either. A `status: suggested`
card reaches `dispatchReport` only inside `underway`, which that report
filters to `IN_FLIGHT`, so suggestions are rendered nowhere today.

So the lane built the derivation and its bodies in the fence it had:
`triageClusters`, `triageBoard`, `classKin`, `classStem`,
`sharedGround`, `fencePaths` and `triageClusterRecs` in
`dispatch-brief.mjs`, with six bodies in `brief.spec.ts`. The function
takes only `{root, ref, at, host, full}`, which BOTH context shapes in
this repository already carry, so the wiring is one line at either site.
The lane asked the seat for the fence and none was granted before it
finished; it is filed rather than left as a silent gap.

The remedy, in `brief.mjs`'s `if (wantsDispatch)` arm, where `ctx` and
`full` are both already in scope:

    if (full) say(render(triageClusterRecs(ctx)));

plus `triageClusterRecs` in the existing import list from
`./dispatch-brief.mjs`. The alternative site is a spread at the end of
`dispatchReport` in `dispatch-order.mjs`; one line either way, and the
existing bodies cover the derivation, so what the lane owes is a body
asserting the section REACHES the rendered answer.

Class parent: T-282. Disposition hint: promote at any lane already
holding `tools/e2e/scripts/brief.mjs`. Measured cost of the section at
`3a69385`: 17,592 bytes against a `--dispatch --full` answer of 116,905
— the command's own margin block already discloses both.
