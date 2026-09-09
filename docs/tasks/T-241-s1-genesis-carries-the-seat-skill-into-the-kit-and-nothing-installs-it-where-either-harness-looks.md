---
id: T-241-s1
title: Genesis carries the seat skill into the kit and nothing installs it where either harness looks — the materialized copy lands at a path both discoverers were measured NOT to read
feature: F-04
milestone: 4
size: S
priority: 12
status: suggested
suggested_by: executor claude-opus-5@subagent @T-241
blocked_by: []
touches: [app/src-tauri/src/agent/kit.rs, method/skills]
builder:
verifier:
built_by:
verified_by:
review: same-model
---

T-241 landed the seat skill in `KIT_FILES`, so a genesis now materializes
the whole pack into `<project>/.supertaskr/genesis/kit/skills/supertaskr-seat/`
beside the rest of the method snapshot. **That directory is not a
discovery location for either harness, and both halves of that were
measured rather than assumed.**

- **Claude**: `app/src-tauri/src/agent/skills.rs`'s `SKILLS_REL_DIR` is
  `.claude/skills`, and `discover` reads that path and only that path.
- **Codex**: `<project>/skills/<name>/SKILL.md` was probed for T-246 and
  is **not** discovered; the three that are — measured again at T-241
  against `codex debug prompt-input` with a negative control — are
  `<project>/.codex/skills/`, `<project>/.agents/skills/` and
  `$CODEX_HOME/skills/`.

So a project scaffolded by a genesis HAS the architect's operating
instructions on disk and no harness offers them. The skill's own install
table says how to fix it by hand, which is the right fallback and the
wrong default: the whole reason the pack rides the kit (ADR-021) is that
a project which got the method without it got the method without its
operating instructions.

## What this card is NOT

**It is not "make genesis write into `.claude/skills`" by assumption.**
That directory is the OPENED PROJECT's, and `skills.rs`'s own header
states, twice and in capitals, that the surface is a READ surface and
that nothing in the module writes, moves or deletes anything under it
(the card's dated PREFLIGHT RULING of 2026-08-30). Whether the genesis
stage may write one pack into it is a DECISION, not an implementation
detail — so this card's first act is to get that ruled, and its fence is
sized for the outcome rather than for the guess.

## Acceptance criteria

- WHEN a genesis materializes the kit THE system SHALL either install the
  seat pack where the opened project's harness discovers it, or state in
  the kickoff that the pack is carried-but-not-installed and name the one
  command that installs it — never leave the reader to find out by the
  skill not firing.
- IF the chosen answer writes under `.claude/skills` THEN the ruling that
  makes that surface read-only SHALL be revisited on the record first,
  and the write SHALL be scoped to this one pack directory.
- THE choice SHALL be measured, not asserted: a scaffolded temp project
  followed by the same discovery probe both harnesses were measured with
  at T-241, with a negative control.
