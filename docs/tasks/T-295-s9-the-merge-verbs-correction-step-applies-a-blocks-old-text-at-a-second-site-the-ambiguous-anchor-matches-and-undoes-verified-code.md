---
id: T-295-s9
title: "The merge verb's correction step applies a mutant block's old text at a SECOND site the ambiguous anchor matches, undoing verified code on main — the role file says an anchor matches exactly once, and the step trusts that instead of checking it"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat at the T-314 merge, 2026-09-13"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

At the T-314 merge (17fd283b, 2026-09-13) the verifier's third correction block anchored on the three lines `if (!executable(site.hookFile)) {` / `return {` / `guarded: false,` (old) against `if (!present(site.hookFile)) {` / `return {` / `guarded: false,` (new). In `.claude/hooks/hook-install.mjs` at the bench tip 88ca5166 the `old` text occurs at two sites and the `new` text at one — the presence check that legitimately precedes the executable check in `hookStatus`. The verb's `correction:3` step reported exit 0, "the tree already carries the block's old text"; the merged tree on main then differed from the verified bench tip by ONE line: the presence check at that other site had become an executable check. The check that shadowed the not-executable branch made the correction's own body ("a hook git cannot EXECUTE is UNGUARDED…") red on the closing check at 647c74c6 while it was green on the bench at 88ca5166. The seat restored the file to the bench tip's bytes by hand and re-ran the spec green.

The role file's step 5b says each anchor matches its file EXACTLY ONCE and a block whose anchor matches twice names no site; the correction step trusts that rather than measuring it, and where the block's `new` text happens to match live code the step rewrites verified code into the mutant's opposite.

## Acceptance criteria

- WHEN the correction step reads a mutant block THE step SHALL count the sites the `old` text matches AND the sites the `new` text matches in the block's file at the merged tree, and SHALL refuse the block by name when either count is not exactly one — never applying `old` over a `new` match that is not the block's own site; a body plants a block whose `new` text matches a legitimate line elsewhere in a fixture file and requires the refusal, with the control that a block matching exactly once is still applied.
- WHEN a block is refused for an ambiguous anchor THE merged tree SHALL be left byte-identical to the bench tip for that file, pinned by a body that compares the file against the bench tip after the refusal.
- WHEN the verb's plan is printed THE correction step's line SHALL state both counts it measured, so a seat reading one line per step sees the anchor's ambiguity before the drill.

## Implementation notes

## Verdicts
