---
id: T-083-s2
title: Nothing in the tree can check a single claim in the range rule — CONVENTIONS' Gotchas half is unpinned prose
status: suggested
suggested_by: executor claude-opus-5 @T-083
---

Stated plainly because T-083's own poison drill could not find a red to
show for the thing the card is actually about.

**Exactly two files open `docs/CONVENTIONS.md` from disk**, verified at
`ddcc8bb` by grepping every `.rs`, `.ts`, `.tsx` and `.mjs` for a real
read rather than a mention (twenty files name the path; eighteen name it
in a comment):

- `tools/e2e/tests/workflow-parity.spec.ts` — `buildAndTestSection`
  splits the file on `^## ` and keeps only the chunk starting
  `Build & test`. **Everything under `## Gotchas` is invisible to it.**
- `snapshot_version_matches_the_live_method_stamps` in
  `app/src-tauri/src/agent/kit.rs` — asserts one substring,
  `currently v<METHOD_SNAPSHOT_VERSION>`, from the FIRST gotcha.

Plus the CONTROL walk in `tools/e2e/scripts/token-scan.mjs`, which reads
the bytes and cares only that none of them is a control character. The
FOUR WALKS bullet's own claim that the outside-the-walks reader list
"IS CLOSED AT TWO" reproduces exactly.

So every measured figure T-083 wrote into the RANGE RULE — the 9 and 36
at `dc3ef5b`, the 76/16/16 at `d92dceb`, the 12-versus-60 collapse at
`4683566`, the 31 merges, the 8-of-10 and 5-of-5 flip counts, the twelve
commit hashes — **is poisonable to any value at all with every reader
still green**. Measured on T-083's branch, two rounds. FIVE FIGURES
POISONED AT ONCE — 9 to 7, 36 to 12, 31 to 41, 10 to 2, 8 to 1, which
also breaks the arithmetic the surrounding prose states — and
`workflow-parity` 14/14 exit 0, `cargo test` exit 0, `lint:tokens` clean
exit 0, parser 263/263 exit 0. Then the sharper one: **the whole
correction deleted and the falsified sentence reinstated verbatim**, 32
lines replaced by the two it was written to retire, and the same five
runs green again at exit 0. Nothing in this repository can tell the
corrected file from the uncorrected one. A prose claim that no reader
covers is not a gap in the drill; it is the drill's answer.

**This is not an argument for a fixture that greps for `**9**`.** A test
pinning the digits of a doc goes stale in the direction that matters
least and reds on rewording. The shape worth considering is the one
`workflow-parity.spec.ts` already proves out for the other half of the
file: DERIVE the claim rather than pin it. Every figure in this bullet
is a `git` derivation over commits that are immutable once merged, so a
body could recompute the flip list from `main` and assert the doc names
the same commits — the doc stops being a transcription and becomes a
projection, which is what T-045 did to the CI command list. That is a
size-M card of its own and deliberately not attempted here.

Until then the honest statement is the one this finding exists to make:
**the range rule is the most-consulted paragraph in the file and it is
the least defended.**
