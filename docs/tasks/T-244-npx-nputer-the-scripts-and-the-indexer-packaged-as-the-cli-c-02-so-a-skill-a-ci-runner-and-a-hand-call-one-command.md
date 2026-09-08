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
touches: [tools/e2e/, README.md, docs/CONVENTIONS.md]
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

- WHEN `npx supertaskr <verb>` runs in a project THE system SHALL dispatch
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
- WHEN the package is built THE tree SHALL carry tools/e2e/bin/ (the
  bin entry), tools/e2e/scripts/cli.mjs, tools/e2e/scripts/undo.mjs,
  tools/e2e/scripts/merge.mjs and tools/e2e/tests/cli.spec.ts — the
  card's creation targets, absent at dispatch and inside its fence
  (amended 2026-09-09 by the architect seat: the preflight reads a
  creation target off the criteria, not the notes).
- IF a verb needs a build (the indexer, the parser package) THEN the package
  SHALL say so on first run with the one command that builds it,
  never fail silently.
- **Folded 2026-09-08 (second version sitting, @human: "fold safe undo
  into T-244"):** THE package SHALL expose an `undo <card>` verb that
  reverts the card's merge commit (`git revert -m 1`) after listing every
  later merge that touched the same fence and refusing when one exists
  unless `--force` names it — the records make the revert derivable; the
  verb makes it one command (GSD Core's safe undo, T-245's second pass).
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

## Folded 2026-09-09 from docs/rooms/loop-efficiency.md (items 18 and 27)

The `merge` verb is the integrator's ritual as one command, and the seat's
scratch script merge-lane.sh is its prototype (read it: precondition,
branch moved to the verdict commit, merge --no-ff --no-commit, the done
stamp by the card's `id:` line, census regen when a spec name moved, the
graph regen with the dogfood pins re-derived, the docs gate). Two rules
the room measured belong in it as criteria:

- WHEN a merge brings in sources under app/ or lib/ THE verb SHALL
  reinstall and rebuild in CONVENTIONS' order BEFORE any suite runs
  (the integrator ran the battery on a stale bundle at T-018-s5; the
  dogfood pins redded at T-264's merge until `npm ci` ran in all three
  packages) — derived from the merge's paths, never remembered.
- WHEN a merge moves docs/architecture/graph.json THE verb SHALL run
  the app's dogfood bodies before the commit and re-derive the pins
  with the dated line the house pattern uses (main was red on the app
  suite for forty minutes at T-112-s6's merge).

## Dispatch note (2026-09-09, the architect seat, at @human's night approval for L cards that need no decision of theirs)

The name is ruled (ADR-022: `supertaskr`; npm free at the 2026-09-08
sweep in rooms/naming.md — re-derive at your ref), so the last
criterion's condition is met and the package is `supertaskr`. THE FENCE
IS PATH-GRANULAR ON PURPOSE: the card says the package is a FRONT and
no script is rewritten, so the fence names the files a front creates
(a bin entry, cli.mjs, the `undo` and `merge` verbs as new scripts — the
seat's merge-lane.sh in the scratchpad is the merge verb's prototype,
read it — the package files, one spec, README and CONVENTIONS' CLI
bullet) and NOT tools/e2e/scripts/ or tools/e2e/tests/ whole, so sibling
lanes on brief.mjs, docs-gate.mjs and the other specs can run beside it.
If a verb genuinely needs an existing script changed, that is an ASK
through the ask file, never a widening from inside. Publishing to npm is
@human's (T-266); the card proves `npx supertaskr` against a local
`npm pack` tarball or `npm link`, never a publish.
