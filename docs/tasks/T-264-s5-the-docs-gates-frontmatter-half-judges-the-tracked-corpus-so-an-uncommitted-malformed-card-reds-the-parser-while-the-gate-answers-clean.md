---
id: T-264-s5
title: The docs gate's frontmatter half judges the TRACKED corpus, so a card written but not yet committed is invisible to it — the gate a lane runs BEFORE it commits answers clean over the one card the parser refuses
feature: F-01
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — reproduced on this lane's own suggestion card, whose title opened with a backtick
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-084`** — the DOCS GATE, whose whole reason for
existing is that `docs/` is a code input and a malformed card reds a
suite three layers from its edit. `docs/CONVENTIONS.md`'s DOCS GATE
bullet records the class by name: *"two card titles opening with a
backtick, both cards silently unparseable"* (`9c64cd8`).

**REPRODUCED, in T-264's lane, on the lane's own card.** A suggestion
card was written with a title opening with a backtick. Over the same
tree, at the same moment:

- `npx vitest run` from lib/parser/ — `smoke — the real docs/ tree parses
  cleanly > finds zero issues in the live tree` FAILS with a
  `yaml-error` naming the file, the line and the column.
- `npm run lint:docs` from tools/e2e/ — **exit 0**, and the line
  *"docs-gate: every live task card's frontmatter parses, with a legal
  status."*

**THE MECHANISM IS THE CORPUS, NOT THE CHECK.** `taskCardIssues` in
`tools/e2e/scripts/docs-scan.mjs` is correct and would have named this
card — its `yaml-error` branch even spells the remedy (*"a title
beginning with a backtick, a dash or a colon must be quoted"*). What it
never sees is the file: it is fed `liveTaskCards()`, which is
`trackedFiles()` filtered, and `trackedFiles()` is `git ls-files`. An
untracked card is not in the corpus. `lib/parser`'s own live-tree walk
reads the WORKING TREE and sees it.

**THE WINDOW IS EXACTLY WHEN THE GATE IS USEFUL.** A lane writes its
suggestion cards, asks the gate what its diff owes, and commits. In that
order the gate is blind to every card the lane just wrote, and the
verdict arrives later as a red in a different package — the "detached
from its edit" failure mode T-084's card is about.

## Acceptance criteria

- WHEN the docs gate runs over a tree carrying an UNTRACKED task card
  THE frontmatter half SHALL judge that card, and a malformed one SHALL
  be named with its file, field and near miss exactly as a tracked one
  is.
- WHEN the gate widens its corpus THE widening SHALL NOT admit files git
  would never carry — a scratch copy under `docs/tasks/` is the case to
  decide explicitly, in the code, with the decision written down.
- WHEN the fix lands A BODY SHALL plant an untracked malformed card and
  require the gate to name it, and the SAME body SHALL show the gate
  clean once the card is repaired — a negative assertion needs a
  positive control.
- IF the two readers are meant to judge different corpora THEN that
  SHALL be stated in `docs-scan.mjs`'s own header rather than left as a
  difference two seats discover by disagreeing, and this card closes as
  a documented decision instead of a code change.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
