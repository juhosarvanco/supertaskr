---
id: T-315
title: "The loop runs Codex-only — a Codex session takes the seat with the identity T-303-s1 landed and the push check T-314 installed, dispatches through the arm, runs its children through the Codex CLI adapter T-312 demonstrated (natively spawned children only if their launch is demonstrated to the same boundary), benches and merges through the verbs, and lands one owner-chosen card with every instrument that card owes and no Claude session in the loop"
feature: F-04
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "ADR-025 decisions 4 and 8, approved by the owner on 2026-09-12; card 5 of its plan; the owner's goal that the loop runs with Codex only; the Codex orchestrator's review of 2026-09-12: a CLI demonstration does not qualify a native spawn"
blocked_by: [T-303-s1, T-311, T-312, T-314]
touches: [method/adapters/AGENTS.md, method/skills/supertaskr-seat/SKILL.md, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/adapter-codex.mjs, tools/e2e/tests/adapter-codex.spec.ts, docs/CONVENTIONS.md, docs/conventions/commands.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/gates-and-the-push.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

### What was measured

The arm is Node scripts and runs under any shell; the seat verbs recognise a Codex session once T-303-s1 lands; the push check runs from a git hook once T-314 lands; a Codex child launched by `codex exec` under a named configuration is fenced by T-312's demonstration. A Codex seat's natively spawned children are a different launch mechanism whose permissions, working directory and isolation T-312 says nothing about. The whole loop with no Claude session anywhere has never been run, and the seat's own launch boundary has not been stated for a Codex seat.

## Acceptance criteria

- WHEN a Codex session takes the seat THE seat verbs SHALL recognise it, the hook SHALL be installed, the seat SHALL run `--dispatch --full`, `--dispatch-lane`, `--bench` and `--merge` unchanged, every child it starts SHALL have a run record, and the seat's own launch boundary (network, credentials, filesystem) SHALL be written in its first record of the sitting.
- WHEN the Codex seat starts a child THE default path SHALL be the Codex CLI adapter under T-312's configuration demonstrated for that role, including a separately confined bench for a Codex verifier writer. A natively spawned child SHALL be eligible to write only if this card demonstrates that launch to the same role-specific boundary with the same commands and outputs. A native read-only participant SHALL be eligible only if its actual launch satisfies that assignment's required write restrictions, read access and independence profile; inability to qualify it as a writer SHALL NOT qualify it as read-only or tool-less. An unmet capability SHALL be refused by name, with no silent substitution. Bodies SHALL cover refusal of an unqualified native writer and refusal of a nominally read-only participant whose required boundary is not established.
- WHEN the acceptance sitting runs THE card it lands SHALL be chosen by the owner and named in this card's notes before dispatch, with its own authorization, and the sitting SHALL exercise every instrument that card owes (its owed suites, its regenerations, a method bump if it touches method text); a card whose instruments do not cover a method change SHALL not be taken as proof for method changes.
- WHEN the sitting ends THE seat SHALL release the seat with the verb and leave a handoff in the packet form, no Claude session SHALL have written to the repository during the sitting, and the records SHALL name the models and usage actually reported.
- WHEN this card lands THE adapters' AGENTS.md and the seat skill SHALL say how a Codex session holds the seat, and the method version SHALL bump with its release note and evaluation block.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/commands.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/gates-and-the-push.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
