---
id: T-282-s6
title: "Card-derived text reaches the rendered dispatch answer with no control-character filter, so a `touches:` token carrying an ANSI escape is written straight to the reader's terminal — pre-existing at three sites, and the triage section would be a fourth"
feature: F-06
milestone: 4
size: S
priority: 12
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-282 phase 2, 2026-09-09, measured at bf22ede on the bench"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

Driven at `bf22ede`: a card whose `touches:` token carries a U+001B
escape has that escape rendered VERBATIM into the dispatch answer. Nothing
in `dispatch-brief.mjs` filters or escapes a control character — a grep
for an escape literal, `stripAnsi` or any sanitiser over the whole file
returns nothing, at the base as at the tip.

**IT IS PRE-EXISTING AND NOT T-282's**, which is why this is a card and
not a verdict finding. The base already interpolates the field
unfiltered at three sites in `deriveFence` and `stateReport` — the
`${lane.taskId} touches: ${entries.join(", ")}` shape — and the answer is
read in a terminal. T-282's triage section joins the same field into
`— all reserve …` rows, so it inherits the surface rather than opening
it, and it renders nowhere today anyway (T-282-s1).

The rest of the hostile set came back CLEAN and is recorded here so
nobody re-runs it: `expandFenceEntry` does no filesystem work at all, so
`../../../etc/passwd`, `/etc/passwd`, `**`, `{a,b}/**/*` and
`~/.ssh/id_rsa` are echoed back as tokens and never read; a
100,000-character field and a 10,000-id kinship line each return in about
4 ms, so there is no expansion blow-up and no ReDoS; and no card-derived
string reaches a shell.

The cheap shape is a single escape at the rendering boundary — `value()`
and `note()` are the two funnels every row passes through — plus a body
planting one escape in a fixture card and asserting the rendered answer
carries no C0 byte. Note the project already owns the definition of that
byte set: `scanControlSource` in `tools/e2e/scripts/token-scan.mjs` is
the authority and must not be transcribed.

Class parent: T-282. Disposition hint: promote with any dispatch-brief
lane; it is one funnel and one body, and it is worth doing before the
triage section starts rendering card text a filer chose.
