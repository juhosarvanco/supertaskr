---
id: T-236-s3
title: tools/method-evals copies docs/CONVENTIONS.md live into its fixture root and assembles a brief against it, and the DOCS GATE's reader census cannot see that reader because the suite is in no package it scans
feature: F-01
milestone: 4
size: S
priority: 3
status: parked
suggested_by: executor claude-fable-5-1@subagent @T-236
blocked_by: []
touches: [tools/e2e, tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**A READER OUTSIDE THE FOUR SUITES, FOUND BY GREPPING FOR THE FILE'S
NAME.** `LIVE_DOCS` in tools/method-evals/lib/fixture-root.mjs copies
docs/CONVENTIONS.md (with ARCHITECTURE, ROADMAP, STATE and NORTH_STAR)
into every eval's fixture root, and MF-01 assembles a brief against
that copy through the same `laneSpellings`/`rawBullet` readers the e2e
specs pin; MF-06 declares `docs/CONVENTIONS.md` in its `reads:` and
RC-01/02/04 in fixtures/review-claims.mjs derive from its git history
and size. So a CONVENTIONS edit that moved a naming phrase would red
`node tools/method-evals/run.mjs` — and `node
tools/e2e/scripts/docs-gate.mjs --census` at T-236's base `3170247`
lists 28 readers across the FOUR suites (app, lib/parser, tools/e2e,
cargo) and names none of them, because tools/method-evals is not a
suite the derivation walks and is not one of the four commands the
DOCS GATE bullet legends. T-236 ran the evals by hand as a courtesy
(exit 0, 6 model-free evals at `e89d67f`) precisely because nothing
would have told it to. This is T-086's class — the closed reader list
is open — one package over, and the honest fix is the same shape as
the METHOD EVAL GATE's own trigger paragraph: either the census walks
tools/method-evals as a fifth suite with its own command (`node
tools/method-evals/run.mjs` from the repo root), or the DOCS GATE
bullet states in words that the method evals read the governing
documents and are owed on a CONVENTIONS diff. Whichever lands, the
`--census` count moves and docs-input-gate.spec.ts's floor body is the
positive control.

## PARKED, 2026-09-02

The fifth-suite question is T-155-s1's (the one place a command becomes
a CI step refuses a fifth package), and this card's second arm edits
docs/CONVENTIONS.md outside its fence. RESURFACES when T-155-s1 is
dispatched — that lane takes arm 1 or refuses it in writing — or the
first time a CONVENTIONS diff lands without the method evals having run,
whichever comes first.
