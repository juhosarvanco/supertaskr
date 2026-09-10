---
id: T-307-s1
title: "The METHOD EVAL GATE fires on a method/** diff, but the eval that holds the room-entry rule reads docs/rooms/ — a room entry lands in a docs-only commit and the eval that would refuse it never runs"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-307, measured at a00acf00bf6000d646c96218986032b599c2159c, 2026-09-10"
blocked_by: []
touches: [docs/CONVENTIONS.md, .github/workflows/ci.yml, tools/e2e/scripts/ci-owed.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `a00acf00bf6000d646c96218986032b599c2159c`

T-307 added MF-11 to the method eval corpus: it reads every room entry
dated on or after the rule's floor and refuses one that quotes the
owner's message or names a person. Its SUBJECT is `docs/rooms/**`. The
gate that runs it fires on something else.

- docs/CONVENTIONS.md's METHOD EVAL GATE bullet: the trigger is a merge
  whose diff touches `method/**`, or one that adds a line matching the
  citation grammar under `docs/tasks/`.
- `.github/workflows/ci.yml` at this ref runs no method-eval step at
  all — derived by grepping the workflow for the runner's one spelling,
  which returns nothing — so the gate is a hand run at a merge.
- `tools/e2e/scripts/ci-owed.mjs` names four suites, and none of them is
  the method eval set.

So the ordinary way a room entry arrives — a seat appends to a room and
commits under `docs/`, with nothing under `method/` in the diff — is
exactly the case in which nothing runs MF-11. The eval is real, its
positive control is real, and the entry it exists to refuse can reach
main without it ever being asked.

## Why it was not fixed in T-307

Every one of the three files above is outside that card's fence, and
docs/CONVENTIONS.md was held by a live lane beside it (T-295). T-307's
own criterion 4 already routes its one CONVENTIONS line to the
integrator at the merge; widening a standing gate's trigger is a
different write and wants its own card.

## The shape that would work

Widen the METHOD EVAL GATE's trigger to name the eval corpus's declared
`reads`, rather than one directory: every model-free eval already
declares the paths it depends on, so the trigger can be derived from the
corpus instead of restated beside it — the same move the DOCS GATE makes
when it derives its readers rather than listing them. A CI step is the
cheaper half and buys the whole tree rather than the merge: the runner
needs no install (the suite reads no `node_modules`), so it can sit
beside the token lint as an early step.

The trap to avoid: adding `docs/rooms/**` to the trigger by hand. That
is a second list of what the evals read, and the next eval added to the
corpus will not be in it.
