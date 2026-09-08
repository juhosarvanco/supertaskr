---
id: T-261
title: Tool surfaces per role — the blind bench's phase 1 is spawned as an agent type that holds no file, git or shell tool, so its blindness becomes a property of the spawn in this harness rather than an instruction it keeps
feature: F-04
milestone: 4
size: S
priority: 9
status: planned
suggested_by: "the architect seat, 2026-09-08, from the GSD Core agent reference (github.com/open-gsd/gsd-core docs/AGENTS.md at 0ebc3cf (read 2026-09-08)): every agent declares its tools and its disallowed tools, checkers get no Write or Edit"
blocked_by: []
touches: [.claude/agents, method/roles/orchestrator.md, method/roles/verifier.md, method/roles/executor.md, docs/CONVENTIONS.md, tools/e2e/tests/agent-definitions.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Every verdict this project has stamped since the two-spawn bench landed
carries the same disclosure: *phase 1's no-tool property was kept by
instruction, because this harness cannot deny tools to a subagent.*
That is true of a general-purpose spawn and false of a DEFINED agent
type: Claude Code reads each agent's model, effort and `tools:` list
from its definition under `.claude/agents/*.md`, and a definition with
no file, git or shell tool cannot read the diff whatever its prompt
says. This card turns the disclosure into a construction, measures that
the harness honours it before claiming it, and writes the tool surface
of every role into the role file it belongs to.

## Why this card exists

`method/roles/orchestrator.md` 5d: *"PHASE 1 IS ITS OWN SPAWN, AND IT
HAS NO FILE, GIT OR SHELL TOOLS … Blindness stops being a promise a seat
keeps and becomes a property of the spawn, which is the whole of what
this step buys."* On this project the property has been a promise:
five phase-1 spawns on 2026-09-08 each reported zero tool calls, and each
verdict said the count was self-reported. GSD Core's agent reference
declares a tool surface per role as the primary control (*"for a
first-party agent the static tools: list is the only control that
exists"*), disallows Write and Edit on every checker, and gives browser
tools to exactly one agent. nputer's roles subtract DOCUMENTS (an
executor does not read ROADMAP) and never TOOLS. The gap is the
verifier's guarantee, so this is guard-class: `review: independent`.

## Acceptance criteria

- WHEN the card is built THE first thing measured, before any
  definition is trusted, SHALL be the harness's behaviour for a defined
  agent type with an EMPTY `tools:` list and for one with a list that
  omits Read, Bash, Grep, Glob, Write and Edit: the capture (the
  definition, the spawn, the tool call attempted, what the harness
  answered) SHALL be committed under docs/research/captures/ the way
  T-246 captured Codex, and the card SHALL state which of the two
  shapes gives phase 1 no reach. IF neither shape denies the tool THEN
  the card SHALL record that and stop: the disclosure stands and this
  card is discharged, not built around.
- WHEN phase 1 of the bench is spawned THE spawn SHALL name the
  phase-1 agent type, and the type's definition SHALL list no tool that
  can read a file, run a command or query git; the verdict's frame
  line SHALL then say "phase 1: tools denied by definition" instead of
  "kept by instruction", and orchestrator.md 5d's fallback sentence
  SHALL point at the definition.
- WHEN a role file is read THE role SHALL state its tool surface in
  one line (executor: Read, Write, Edit, Bash, Grep, Glob; verifier
  phase 1: none; verifier phase 2: Read, Bash, Grep, Glob and the write
  tools it needs to append the verdict and file findings; planner and
  orchestrator: unchanged, they are not spawned agents here), and a
  body in tools/e2e/tests SHALL red when a definition's `tools:` and
  its role file's line disagree — one fact checked twice, never two.
- WHEN CONVENTIONS' bench bullet names the phase-1 spawn THE spelling
  SHALL name the agent type, so a dispatcher cannot spawn phase 1
  general-purpose by habit.
- IF Codex has an equivalent (an agent definition with a tool list)
  THEN the card SHALL capture it beside the Claude half; IF it has none
  THEN the card SHALL say so and the two-harness stance in T-244 SHALL
  carry the difference — never a claim about Codex without a capture.
- The drill: a phase-1 agent of the built type SHALL be asked, in its
  prompt, to read the lane's diff; the refusal is the positive control,
  and the same prompt to a general-purpose spawn reading the diff is
  the demonstration that the control can fail.
