---
id: T-264
title: The identifier rename, nputer → supertaskr, in ONE lane — the runtime directory, the config, the ignore file, the env prefix, the packages, the bundle id, the crates, the CI workflow and the hooks, with the fixtures and pins that name them; records untouched
feature: F-01
milestone: 4
size: L
priority: 4
status: planned
suggested_by: "@human's ruling of 2026-09-08 (ADR-022, docs/rooms/naming.md); measured at the form sitting of 2026-09-03"
blocked_by: []
touches: [app, lib, tools, .claude, .github, README.md, CLAUDE.md, AGENTS.md, Cargo.toml, Cargo.lock, package.json, docs/CONVENTIONS.md, docs/ARCHITECTURE.md, docs/architecture]
builder:
verifier:
built_by:
verified_by:
review: independent
---

ADR-022 names the product Supertaskr and fixes the identifier
spellings. This card lands every identifier a program reads in one
lane, because the identifiers cross the areas the form sitting measured
(app 119 files, lib 11, tools 54, .claude 4, .github 1 at 0b7cecd; a
hook reads `.nputer/lane-fence.json` that brief.mjs writes that the app
reads), and a tree renamed by area is broken between the lanes. Size L:
@human approves the dispatch. No other lane runs beside it, by the
fence.

## Why this card exists

The rename is cheapest now: before T-244 packages `npx nputer`, before
any outside user holds a `.nputer/` directory, before the skills
(T-241, T-242) carry the old name into two vendors' skill directories.
The form sitting measured 318 card files and 2,529 lines carrying the
word in docs/tasks alone — those are RECORDS and stay (ADR-022 decision
3); this card moves what programs read and what CONVENTIONS spells.

## Acceptance criteria

- WHEN the lane lands THE runtime directory SHALL be `.supertaskr/`,
  the config `supertaskr.yaml`, the ignore file `.supertaskrignore`, the
  env prefix `SUPERTASKR_*` (every `NPUTER_*` variable renamed, the
  e2e port and boot port included), the packages `supertaskr`,
  `@supertaskr/parser`, `@supertaskr/e2e`, the app's product name and
  bundle identifier `dev.supertaskr.app`, the crates `supertaskr`,
  `supertaskr_lib`, `supertaskr-index`, and the CI workflow's names —
  each derived from ADR-022's list, and `git grep -i nputer` over app/,
  lib/, tools/, .claude/, .github/ and the root files SHALL return
  ONLY the lines this card's own notes enumerate as deliberate (a
  record quoted in a comment, a migration note).
- WHEN a fresh clone is built in CONVENTIONS' order THE four suites
  SHALL be green through the blessed runner, the graph SHALL read
  CURRENT after its regeneration (crate names move indexed symbols; the
  six dogfood pins move with them), and `npm run capabilities` SHALL
  regenerate a census whose sentences carry the new name where a test
  name did.
- WHEN a lane, a bench or the human's app checkout exists with an old
  `.nputer/` directory THE tooling SHALL refuse with a message naming
  the rename (never read the old directory silently), and the
  dispatch arm SHALL write the new one.
- IF a record under docs/checkpoints/, docs/decisions/ (before 022),
  docs/tasks/ bodies or docs/rooms/ histories carries "nputer" THEN it
  SHALL be left as it is — a body pins that these paths did not change
  in the lane's diff.
- WHEN CONVENTIONS spells a command or a path THE spelling SHALL be the
  new one, and the workflow-parity spec SHALL hold CI to it.
- The lane SHALL be cut from a checkpoint commit with no other lane
  live, and its verifier SHALL run the dispatch arm end to end on a
  scratch repository under the new names as its positive control.
