---
id: T-300-s3
title: "The runtime template's comment saying this project departs at no switch is prose the settings edit leaves standing, so the first departure anyone writes makes the file contradict itself"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300, measured at the lane tip, 2026-09-11"
blocked_by: []
touches: [method/runtime/supertaskr.yaml, tools/e2e/scripts/settings.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The `switches:` block of the runtime template's `process:` section
carries four comment lines arguing that the block is empty ON PURPOSE —
that this project departs from its profile at no switch today, and that
the emptiness is written out rather than left out so a reader can see
the question was asked.

`settings set` keeps every comment in that section, deliberately: the
section is method text a human wrote, and an edit that rewrote a human's
prose to match a machine's idea of the file would be the class of write
this project refuses everywhere else. The consequence is that the moment
anyone records a departure, the block says it has none and then lists
one, and the reader has to decide which half to believe.

## What a fix looks like

Two candidates, and the choice is the owner's:

- Rephrase the comment so it cannot go stale — say what the block IS
  (the departures, and only the departures) rather than what this
  project currently has in it, and let the entries speak for the count.
  This is the cheaper half and it costs nothing at runtime.
- Or have the command SAY, on the write that turns an empty block into
  a non-empty one, that the block's own comment is now a sentence about
  a state that has changed — a line of output, never an edit.

The two are not exclusive and the comment is the load-bearing one: a
rephrased comment is true for every project that copies this template,
and a printed reminder is true only for whoever reads the terminal.

## Why it was not done in T-300

The template is method text and outside that card's fence; the edit also
needs the owner's voice, since the comment argues a position rather than
stating a fact.

## Acceptance criteria

- WHEN the `switches:` block holds a departure THE section's own comment
  SHALL NOT assert that the project departs at no switch.
- WHEN the comment is rewritten THE sentence SHALL describe what the
  block is for, so it stays true whatever the block holds.
