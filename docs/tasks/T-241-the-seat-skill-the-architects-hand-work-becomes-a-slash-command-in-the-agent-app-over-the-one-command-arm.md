---
id: T-241
title: The seat skill — the architect's hand work becomes a slash command in the agent app, over T-239's one-command arm, and a skill-driven turn leaves files a hand-driven one cannot be told from
feature: F-04
milestone: 4
size: M
priority: 1
status: planned
suggested_by: "@human ruling (2026-09-03, ADR-021, rooms/cockpit-or-mirror.md RE-RULED): the architect sits in the user's agent app; nputer is a skill, a CLI and a mirror"
blocked_by: []
touches: [method/adapters, method/roles]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-021 (2026-09-03): the architect conversation lives in Claude Code
or Codex, and what nputer ships for that chair is the seat's HAND WORK
as a skill — the cold-start read, the dispatch view, cut a lane, spawn
the builder and the blind verifier, fold the verdict, merge, push —
with T-239's one-command arm underneath so the same seat can be held
from a Codex prompt file through a shell command. The property the
skill must keep is the 2026-08-20 ruling's: the repo cannot tell a
skill-driven turn from a hand-driven one.

## Acceptance criteria

- WHEN the skill file ships in the kit (`method/skills/<name>/SKILL.md`,
  the playbook's own format T-167 already discovers) THE system SHALL
  carry it into a new project at genesis beside the rest of method/,
  and the lane creating that directory SHALL widen this fence at
  dispatch by the seat (fast path A), never by the lane.
- WHEN a Claude Code session invokes the skill THE system SHALL walk
  the orchestrator's ritual in ITS order (derive `brief.mjs --dispatch`
  before the stamp; stamp; cut; arm; then the next), calling the SAME
  commands the hand work calls and inventing none — every command the
  skill names SHALL be one CONVENTIONS' command bullet already names.
- WHEN a turn under the skill lands a stamp, a fence, a lane or a
  verdict THE files on disk SHALL be byte-identical in shape to the
  hand-driven ritual's (a golden derived from one hand-driven lane
  at a pinned ref, compared field by field, not by prose).
- WHEN the agent is Codex THE skill's prompt-file form SHALL be
  measured on this machine before it is claimed (the cross-harness
  plan's rule); IF unmeasured THEN the card's report SHALL say so and
  ship the Claude form alone, and the Codex form SHALL be a sibling
  card.
- IF the skill would spawn anything the arm does not THEN THE skill
  SHALL refuse and name the arm — no second spawn path.
- The method eval gate SHALL run (`node tools/method-evals/run.mjs`
  and `--selftest`) since method/ moves, and CAPABILITIES SHALL be
  regenerated if a spec name moves.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
