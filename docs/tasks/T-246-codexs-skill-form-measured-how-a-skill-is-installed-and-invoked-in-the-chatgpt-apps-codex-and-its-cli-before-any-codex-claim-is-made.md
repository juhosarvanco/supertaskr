---
id: T-246
title: Codex's skill form, measured — how a skill or prompt file is installed and invoked in the ChatGPT app's Codex and its CLI, captured verbatim on this machine before any Codex claim is made
feature: F-04
milestone: 4
size: S
priority: 1
status: building
suggested_by: "@human (2026-09-08): \"lets keep the focus on driving from the native apps\" — ADR-021 Addendum 1; the cross-harness plan's rule that a Codex claim is a hypothesis until captured"
blocked_by: []
touches: [docs/research/captures, docs/design/cross-harness-plan.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-021 makes the native agent apps the driver, and Addendum 1 makes
that the focus. On the Claude side the skill mechanism is measured
(this repository's own `.claude/` hooks and the T-167 discovery of
`.claude/skills/<name>/SKILL.md`). On the Codex side the record holds
only `codex --help`, `exec --help` and `exec resume --help` captures
from 2026-08-20 (docs/research/captures/); nothing about how a skill,
a slash command or a prompt file is installed and invoked in the
ChatGPT desktop app's Codex or in the CLI that ships inside it.
T-241 and T-242 cannot claim a Codex form until this exists.

## Acceptance criteria

- WHEN the card is built THE record SHALL gain captures, verbatim and
  dated, of: the Codex CLI's version; every command or file
  convention by which a reusable prompt or skill is registered (the
  binary's own `--help` output and the directories it reads, measured
  by running it, not by reading published docs); how such a prompt is
  invoked from the ChatGPT desktop app's Codex surface; and whether
  the app and the CLI read the same location.
- WHEN a published claim and a measurement disagree THE capture SHALL
  win and the disagreement SHALL be written down, the cross-harness
  plan's §5 way.
- WHEN the measurement is done THE cross-harness plan SHALL gain a
  §5 addendum stating the Codex skill form in one paragraph, and
  T-241/T-242 SHALL be able to cite it by section.
- IF no reusable-prompt mechanism exists on this machine's Codex
  version THEN the addendum SHALL say so and name the fallback (a
  pasted brief), and the cards SHALL ship the Claude form alone.
- **Added 2026-09-08 from the GSD Core read:** WHEN the Codex form is
  measured THE capture SHALL also record whether the ChatGPT app's
  Codex and the CLI accept an MCP server, and how — GSD ships a
  `gsd-mcp-server` over its command and state interface points, and one
  MCP surface onto `npx nputer`'s verbs and the parsed board may be the
  vendor-neutral driver ADR-021 Addendum 1 wants; T-241 and T-244 weigh
  it against per-vendor skills once this capture exists.
- Nothing under method/ or app/ moves; the docs gate SHALL be run.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
