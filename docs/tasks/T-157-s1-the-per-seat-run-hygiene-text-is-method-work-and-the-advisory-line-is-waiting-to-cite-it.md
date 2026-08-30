---
id: T-157-s1
title: The per-seat run-hygiene text is method work the lane could not reach — and the brief's advisory line is already written to cite it the day it lands
feature: F-01
milestone: 4
priority: 36
size: S
status: suggested
blocked_by: []
touches: [method/]
suggested_by: executor claude-opus-5@subagent @T-157
builder:
verifier:
built_by:
verified_by:
review:
---

## What T-157 could not build

T-157's "What lands where" names three deliverables and its fence
reaches two. The first — **per-seat run hygiene** in the method text —
is `method/**`, which `touches: [docs/checkpoints/, tools/e2e]` does
not cover. The card says it "rides `T-159`'s bump" and that is where it
belongs; this card exists so the rider is a board item rather than a
parenthesis. **Nothing was reached for and nothing was written.**

The text, as T-157 states it: model and effort set at session start and
never switched mid-lane (the cache is the economics); STANDING seats —
orchestrator, integrator — compact between dispatches; noisy jobs (log
grinds, suite output triage) run in subagents that return only their
answer; commands carry quiet flags where the count survives, and
reading the COUNT as well as the exit remains the law.

## The half that is already built, and the seam it left

`brief.mjs` prints an advisory recommended-seat line under the contract
rows. T-157's third criterion makes the method text the authority over
that line, so the line **looks for it on every run**:
`hygieneSection()` in `tools/e2e/scripts/session-economics.mjs` scans
the role file for a `##`/`###` heading whose text contains "hygiene",
quotes it above its own verdict where it finds one, and prints "no
run-hygiene section in method/roles/<role>.md at this ref" where it
does not. Today every brief prints the second sentence.

**So the seam is a HEADING WORD, and this card should know that before
it writes one.** A section headed anything without the word "hygiene"
lands silently and the brief goes on reporting its absence. The
locator is a word rather than a whole heading precisely so the text
could be written freely — but it is not free of that one word.

## Two riders worth deciding in the same pass

1. **Does the advisory line want to become a contract ROW?** It is
   printed outside the fourteen-row table on purpose: the row set is
   read from `method/roles/<role>.md` and `dispatch-brief.mjs` reports
   a deriver whose row the table does not carry as a finding. Making
   it a row is a method version bump, which is what this bump is.
2. **The verifier's brief takes the same line.** Row 12 substitutes
   per role; nothing in the derivation is executor-specific, and the
   role file it reads is `ctx.role`'s.

## Acceptance criteria

- WHEN the run-hygiene text is written into a role file THE heading
  SHALL carry the word the brief's locator matches, or the locator
  SHALL be changed in the same pass and its spec body with it.
- WHEN the text lands THE brief's advisory line SHALL quote it rather
  than reporting its absence, shown by running
  `node tools/e2e/scripts/brief.mjs --task <any card>` and reading the
  line, not by reasoning about it.
- IF the bump decides the advisory line should be a contract row THEN
  the row SHALL gain a deriver in the same commit, because a row with
  no deriver is a reported finding on every dispatch from that moment.
