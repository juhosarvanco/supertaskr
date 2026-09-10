---
id: T-295
title: The arm merges — `brief.mjs --merge <id>` runs the ritual from the verdict (the lane branch to the bench tip, the merge, the corrections from the MUTANT BLOCKs, the re-drill scoped to the fix diff, the census and graph regenerations, the bump when method text moved, the message) with the cheap keepers as steps with exits, stopping before the commit on any refusal; the seat rules, never edits
feature: F-04
milestone: 4
size: L
priority: 1
status: planned
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/rename-scan.mjs, tools/e2e/scripts/gate-run.mjs, .claude/hooks/landing-gate.mjs, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/cli.spec.ts, method/roles/integrator.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Seven merges on 2026-09-09 each took the seat 15 to 21 minutes of hand steps, and two of the day's three reds were the seat's hand edits: a paraphrase of a spec-pinned sentence and a comment spelling the pre-rename identifier. Superpowers forbids controller-side fixes for the same reason. T-281-s10 asked for the fence half (the verdict's spec outside the fence, widened on main before the merge); this card is the whole verb. Absorbs T-281-s10's criteria.

## Acceptance criteria

- WHEN `brief.mjs --merge <id>` runs on a card with an approved verdict THE verb SHALL perform the ritual's steps in order — widen the fence on main for any verdict body outside it (T-281-s10), move the lane branch to the bench tip, merge without committing, take the lane's copy of ITS card on a card conflict, resolve a same-file end-of-file append by keeping both and restoring the closing, stamp done, regenerate the census when a spec name moved and the graph when a source under the walk moved, run the docs gate — and STOP before the commit with every step's exit printed.
- WHEN the verdict carries MUTANT BLOCKs THE verb SHALL apply each correction's `new` text, re-drill every block through runMutantDrill with the fix diff as its scope (a mutant that reds more than its own body is a refusal naming the bodies), and regenerate after the corrections, never before.
- WHEN method text moved THE verb SHALL bump the three stamp files, run the pin test, the half-bump drill and the eval gate, and refuse on any red; WHEN it did not move THE stamp SHALL be untouched.
- WHEN any changed line under method/ or docs/ matches a sentence a spec pins verbatim, WHEN the diff carries a forbidden spelling (the rename keeper's list, a personal name, an email, a home path, a secret shape), WHEN an XS card's diff exceeds the XS bound, or WHEN the card's preflight exits non-zero THE verb SHALL refuse before the commit naming the line — each seen refusing on a planted instance.
- WHEN the verb finishes THE message SHALL be written from the verdict's own sentences and counts (never composed by hand), the lane's and verifier's `## Meters` blocks SHALL be appended to the bands' readings, and the seat's return SHALL be one line per step; a body SHALL show the verb refusing to commit on a count that moved (2d6d354's class).
- IF the merge conflicts inside one file that both sides changed THEN the verb SHALL stop and name it as a fence finding, never resolve it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
