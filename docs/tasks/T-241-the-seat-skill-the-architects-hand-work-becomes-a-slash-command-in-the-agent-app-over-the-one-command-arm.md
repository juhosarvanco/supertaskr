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
- **Folded 2026-09-08 (version sitting, @human: quick path to v1):** WHEN
  the user asks for a small change THE skill SHALL offer the QUICK PATH
  — one line files a size-S card with `review: same-model` or
  `review: self-verified` (TASK-FORMAT's own values), runs the lighter
  gates, and lands with a verdict; IF the card is guard-class THEN the
  quick path SHALL refuse and name the rule that requires
  `review: independent`. Success criterion 1 holds: a card and a
  verdict for every merge, never a merge without.
- **Folded 2026-09-08:** THE skill SHALL trigger on INTENT as well as on
  the slash command (Superpowers' shape) — when the conversation shows
  a card being built or a lane being cut, the skill offers itself.
- **Folded 2026-09-08:** WHEN the verifier seat is not the assigned
  model (T-169's mismatch) THE skill SHALL say so in one sentence at
  the verdict — "verified by the builder's own model family, not an
  outside one" — gstack's honest fallback line in nputer's words.
- The method eval gate SHALL run (`node tools/method-evals/run.mjs`
  and `--selftest`) since method/ moves, and CAPABILITIES SHALL be
  regenerated if a spec name moves.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
