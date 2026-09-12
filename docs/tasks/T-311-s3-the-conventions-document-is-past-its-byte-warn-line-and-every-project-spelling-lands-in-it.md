---
id: T-311-s3
title: "The CONVENTIONS document is past its byte WARN line and every new project spelling lands in it, so the tripwire fires on lanes that are obeying the rule that sends them there"
feature: F-05
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-311, 2026-09-12"
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/scripts/docs-scan.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The docs gate warns on every run: the conventions document is over the
warn line its own compaction landing derived, and under the fail line.
The warning was there before this lane and this lane added to it, because
the method text is product-agnostic by rule and every spelling it leaves
to a project lands in exactly this document.

That makes the tripwire fire on lanes that are obeying the rule. A lane
that adds a project spelling is doing what the method tells it to do, and
the gate's answer to it is a warning about a document the lane may not
restructure.

## Why it is worth a card rather than a shrug

The rule the budget carries is that when it warns, content MOVES — to a
record or to a card — and a hazard is never deleted to fit. Moving
content out of this document is a restructuring that touches the file
every other card cites, so it is a card with a fence of its own rather
than something a passing lane does on the way to somewhere else.

There is a live plan for the split already, and it is blocked on a fence
question about reserving a directory that does not exist yet. Whether
this is that card, a re-landing of the budget against a measured new
size, or a rule that spellings live beside the tool that reads them, is
the decision this card asks for.

## What it must not become

A re-landing that moves the line to wherever the document happens to be
today, with no content moved and no argument, would retire the tripwire
while leaving the growth. The budget is a tripwire against relapse, and a
line raised to match the relapse measures nothing.
