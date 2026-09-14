---
id: T-242-s2
title: "A bare install writes the interview entry into the Codex prompt directory, where this delivery is explicitly unverified — the entry's own text says so and the installer places it anyway"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-242, measured in that lane against the shipped installer"
blocked_by: []
touches: [tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/interview-skill.spec.ts, method/skills]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`supertaskr install` with no `--harness` installs every shipped skill
into every harness in the table, which today is Claude Code and Codex.
The owner's ruling of 2026-09-14 scopes the interview delivery to
Claude Code and requires Codex to be described as deferred and
unverified rather than implied proven. The generated entry says exactly
that in its own harness-coverage section, and T-242's suite pins the
sentence. What nothing stops is the placement: a bare install still
copies the same file to the Codex prompt path, where the delivery was
never measured.

The honest reading is that this is not a defect in the installer. The
table's whole design is that a harness is one entry and nothing
branches on a harness id, which is the property T-244's own body
measures by installing a fabricated harness through an extended table.
A per-skill coverage declaration is the missing concept, not a branch:
a skill should be able to say which harnesses it was measured for, and
the installer should read that declaration the way it reads the table.

A user meeting this is not misled — the file they end up with says it
is unverified for that harness — but they get a prompt entry nobody
claimed works, and the refusal to claim it is buried where only a
reader of the file sees it.

## Acceptance criteria

- WHEN a skill declares the harnesses it was measured for THE install
  plan SHALL carry that skill only for those harnesses, with no branch
  anywhere reading a harness id.
- WHEN a skill declares nothing THE install plan SHALL carry it for
  every harness, so the shipped behaviour of every existing pack is
  unchanged.
- IF an explicit `--harness` names a harness a skill does not declare
  THEN the command SHALL say which skill and which harness and install
  nothing for that pair, rather than installing an entry that was never
  measured.
- WHEN the plan is derived THE declaration SHALL be read out of the
  skill's own file rather than a table in the installer, pinned by a
  body over a fabricated pack.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
