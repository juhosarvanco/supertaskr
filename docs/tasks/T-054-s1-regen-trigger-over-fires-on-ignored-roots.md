---
id: T-054-s1
title: The GRAPH REGEN trigger says "outside docs/" but the indexer ignores tools/ too
status: suggested
suggested_by: executor claude-opus-5 @T-054
---

`docs/CONVENTIONS.md`'s GRAPH REGEN rule fires "at any merge whose diff
touches `*.ts/*.tsx/*.js/*.jsx` **outside docs/**". The indexer's walk is
narrower than that: `.nputerignore` excludes `docs/`, `tools/` AND
`app/src-tauri/crates/nputer-index/tests/fixtures/`, so a diff confined to
`tools/**` matches the trigger and cannot move the graph by construction.

DEMONSTRATED ON T-054'S OWN BRANCH, which is the cheapest possible worked
example: its diff is three files, one of them
`tools/e2e/tests/workflow-parity.spec.ts` — a `.ts` file outside `docs/`,
so the trigger fires — and `nputer-index index --check --root ../..`
reports the graph CURRENT at 532485 bytes / 114 files / 916 symbols /
1408 edges, unchanged. The wording was inherited verbatim from the interim
T-009-s1 rule and carried forward by T-054 rather than introduced by it.

The error direction is SAFE — over-triggering costs a no-op regen, and
`--check` now proves the no-op in CI, whereas under-triggering would ship
a stale graph. That is why this is a suggestion and not a defect. But it
is a rule that tells integrators to do something the repo can prove is
unnecessary, and STATE already carries the general form as an open
question: the graph's walk (`.nputerignore`) and the token lint's walk
(`app/src`, `app/test`, `tools/e2e`) disagree about the same files, and
**the repo now has three answers to "which walk sees this file" and no
document states them side by side** (T-028's checkpoint). The 2026-08-17
merge is the live case: five new `.ts/.tsx` files, the graph took four
and the lint took five.

Two candidate closers, both small:

1. Reword the trigger to name the ignored roots — "outside the
   `.nputerignore`d roots (today `docs/`, `tools/` and the indexer's own
   fixture trees)" — and cross-reference `.nputerignore` as the authority
   so the rule cannot drift from the file that decides it.
2. Better, because it cannot go stale: keep the wide trigger and say the
   regen is a NO-OP unless an INDEXED file moved, with
   `nputer-index index --check --root ../..` as the way to find out in one
   second. That inverts the rule from "predict whether to regen" to "ask
   the gate", which is the shape T-054 just made available.

Neighbouring, and probably the same edit: the "which walk sees this file"
open question wants one short table — the graph's walk, the token lint's
walk, and the parser's live-docs walk — in `docs/CONVENTIONS.md`. Nothing
today states them together, and every integrator re-derives them.
