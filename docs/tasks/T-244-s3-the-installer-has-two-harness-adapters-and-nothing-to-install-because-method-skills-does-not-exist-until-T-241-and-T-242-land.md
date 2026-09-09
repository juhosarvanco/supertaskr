---
id: T-244-s3
title: "`supertaskr install` carries its two harness adapters and has nothing to install: `method/skills/` does not exist until T-241 and T-242 land, so the verb's only reachable answer today is its own CANNOT RUN"
feature: F-01
milestone: 4
size: S
priority: 7
status: suggested
suggested_by: "executor claude-opus-5@subagent, in T-244's lane, 2026-09-09 — T-244's folded installer criterion is built and its source directory is empty by construction"
blocked_by: []
touches: [tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

T-244's folded criterion is that the installer *"SHALL target Claude Code
and Codex in v1 and SHALL be built so a third harness is one adapter
entry, never a rewrite"*. That is built and measured: `HARNESSES` in
`tools/e2e/scripts/cli.mjs` holds the two entries, `installPlan` reads
them without branching on an id, and `tools/e2e/tests/cli.spec.ts` proves
the third-harness property by extending the table with a fabricated
adapter and running the same function.

What is NOT provable today is the install itself. The source directory it
copies from is `method/skills/<name>/SKILL.md`, which is T-241's own
first criterion and does not exist yet — `shippedSkills` returns the
empty list, and `supertaskr install` answers CANNOT RUN (3) naming the
absent directory. That is the honest answer and it is the only one
reachable, so the copy path has no body behind it.

## What is owed once T-241 or T-242 lands

One body per harness, against a real `method/skills/<name>/SKILL.md`:
`supertaskr install --harness claude` puts the file at
`.claude/skills/<name>/SKILL.md`, `--harness codex` at
`.codex/prompts/<name>.md`, both byte-identical to the source, with the
positive control that a project whose `method/skills/` is empty still
refuses. The destination shapes are T-241's and T-246's to confirm —
T-246 measured Codex's form and is the authority for the second row, and
if its measurement moves, the adapter entry moves with it.
