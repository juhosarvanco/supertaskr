---
id: T-159-s3
title: The adapter TEMPLATE now says a role file's reading step wins over its list, and this repository's own two adapters do not — the kit is ahead of the project it was written in
feature: F-01
milestone: 4
priority: 14
size: S
status: planned
blocked_by: []
touches: [CLAUDE.md, AGENTS.md]
suggested_by: executor claude-opus-5@subagent @T-159
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30. Kept SEPARATE from T-159-s4 despite the shared subject, because its fence is disjoint and its work is one paragraph.**

Re-derived at this ref:
`grep -c 'role file wins' CLAUDE.md AGENTS.md method/adapters/CLAUDE.md method/adapters/AGENTS.md`
-> `0, 0, 1, 1`. The kit's adapter TEMPLATE carries
*"This list is addressed to EVERY seat, and your own role file may add to
it or subtract from it — where the two differ, the role file wins."*
This repository's own two root adapters carry a different paragraph in
that slot and have never had the sentence.

**THE CONSEQUENCE IS LIVE, NOT COSMETIC**, and it is the same defect
T-159-s4 arm B attacks from the code side: `CLAUDE.md`'s read-first set
names `docs/ROADMAP.md`, and `method/roles/executor.md:9` subtracts it by
name — so an executor reading this repository's adapter cold is told to
read a document its own role file forbids, with nothing on the page
saying which wins. The kit is ahead of the project it was written in.

**BOTH ROOT ADAPTERS MOVE TOGETHER AND MUST STAY cmp-IDENTICAL** in the
region they share — this project's standing hazard for these two files.
Acceptance names the command: after the edit, `npm test` from
`tools/e2e/` SHALL stay green (the adapter-agreement body reads both),
and the paragraph SHALL be the template's, not a paraphrase.

**CLASS PARENT: `T-155-s4`** (the executor is told to read a document
its own role file subtracts by name). T-159 took that card's method
half; this is the half its own fence could not reach.

**DISPOSITION HINT: promote as a size-S docs card, or hand it to the
next lane that already holds either root file — it is one paragraph
copied verbatim out of `method/adapters/CLAUDE.md`.**

## What moved and what did not

At v0.1.8 both adapter TEMPLATES under `method/adapters/` gained one
paragraph after their read-first list:

> **This list is addressed to EVERY seat, and your own role file may
> add to it or subtract from it — where the two differ, the role file
> wins.**

This repository's own `CLAUDE.md` and `AGENTS.md` are
**de-placeholdered copies of those templates, not links to them**, so
they did not move. Derive it: `command grep -c 'role file wins'
CLAUDE.md AGENTS.md method/adapters/CLAUDE.md
method/adapters/AGENTS.md` at any ref after T-159's merge.

## Why it matters here more than in a fresh project

Row 3 of the brief contract reads the **root adapter**, not the
template — `method/roles/executor.md` says so and
`tools/e2e/scripts/brief.mjs` obeys it. So every brief this repository
assembles keeps printing an unqualified list that names
`docs/ROADMAP.md` to an executor and a verifier whose role files
subtract it, while the sentence that resolves the contradiction sits in
a template nothing here reads. **The kit is the thing this project
ships and the root adapter is the thing this project runs on, and this
is the one place they can disagree without any test noticing.**

## Two cautions for whoever takes it

- **Copy, do not paraphrase.** The two root files are twins of each
  other below their first line exactly as the templates are, and a
  hand-written variant in one of them creates a second divergence to
  chase.
- **This is the PROSE arm and it is the weaker one.** The mechanical
  arm — `brief.mjs` applying the role file's subtraction when it
  assembles row 3, so the printed list is already correct — is
  `T-159-s4` and is the only version that cannot go stale. Taking this
  one does not discharge that one.
