---
id: T-230-s4
title: A marker's SOURCE reaches the report line unescaped, so a card can print text that mimics the report's own provenance separator
status: suggested
feature: F-06
milestone: 4
priority: 4
size: S
blocked_by: []
touches: [tools/e2e]
review: independent
suggested_by: "verifier claude-opus-5@subagent @V-230, 2026-09-02 — found in the security sweep at 90dfe53"
---

In `card-preflight.mjs`'s quotes arm the FINDING message runs the marker's
source through `JSON.stringify`, and the report RECORD beside it does not:
the `NOT CHECKABLE` record interpolates the state and the source raw.

The source is whatever a card wrote between the marker's parentheses.
Measured at `90dfe53`, a marker naming a source that contains the report's
own provenance separator parses to exactly that source and is printed
mid-line, so a reader — or a grep over a captured report — sees text in
the tool's own voice that the tool did not derive.

**This is cosmetic and it is not an injection.** The tracked-set gate
means such a source is never opened; a quoted run cannot carry a newline,
so no second line can be forged; and the real provenance still follows on
the same line. What it costs is the report's own integrity as evidence,
which this project quotes into checkpoints and verdicts.

`JSON.stringify` on the source in that record, the way the finding
message already does it, is the whole fix.
