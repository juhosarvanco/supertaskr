---
id: T-244
title: npx nputer — the dispatch view, the fence writer, the preflight, the gates, the push guard, the arm and the indexer packaged as the CLI (C-02), so a skill, a CI runner and a hand all call one command
feature: F-01
milestone: 4
size: L
priority: 1
status: planned
suggested_by: "@human ruling (2026-09-03, ADR-021): nputer is a skill, a CLI and a mirror — and ARCHITECTURE lists C-02 as planned because nothing packages the scripts"
blocked_by: []
touches: [tools/e2e/scripts, tools/e2e/package.json, tools/e2e/tests, README.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-008 made the CLI the plumbing and the power/CI path; ADR-021 makes
it the thing the seat skill (T-241) and the interview skill (T-242)
call. Everything it needs exists: brief.mjs's dispatch view, fence
writer and seat lock, the preflight, docs-gate and gate-run, the push
guard, T-239's arm, and nputer-index's `arch`/`drift`/`cycles`/`blast`.
What does not exist is one command a user installs. ARCHITECTURE's
table says so in one word: C-02 planned. **Size L: dispatch needs
@human's approval by the standing rule.**

## Acceptance criteria

- WHEN `npx nputer <verb>` runs in a project THE system SHALL dispatch
  to the existing script for that verb with its arguments unchanged —
  no logic moves, no script is rewritten; the package is a front, and
  a test SHALL prove each verb reaches its script by name.
- WHEN a verb is one the skill (T-241/T-242) calls THE package SHALL
  expose it; the verb set is DERIVED from the skills' own command lines
  and CONVENTIONS' command bullet, never restated here.
- WHEN the package is installed in a project that genesis created THE
  method's relative paths SHALL resolve from the project root, and
  the docs-input-gate SHALL see the package as a derived reader of
  docs/ (T-231's account).
- IF a verb needs a build (the indexer, lib/parser) THEN the package
  SHALL say so on first run with the one command that builds it,
  never fail silently.
- **Folded 2026-09-08 (version sitting):** THE installer SHALL target
  Claude Code and Codex in v1 (the two forms T-241/T-242/T-246 carry)
  and SHALL be built so a third harness is one adapter entry, never a
  rewrite — more harnesses are v2 (the multi-harness installer the
  skills frameworks ship, VERSIONS.md UNRULED → v2).
- The npm name SHALL be verified free at the ref the card is built
  (rooms/naming.md recorded it free on 2026-08-14; re-derive, never
  quote) — and IF the product is renamed under docs/rooms/naming.md
  THEN this card SHALL follow the name, which is one more reason it
  waits for that word.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
