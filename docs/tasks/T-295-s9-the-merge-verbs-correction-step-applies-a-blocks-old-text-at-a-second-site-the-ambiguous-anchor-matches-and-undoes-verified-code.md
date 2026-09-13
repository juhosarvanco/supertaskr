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

## Standing procedure until this card lands (the owner's instruction of 2026-09-13, for both harnesses)

After the merge verb stops, and before the seat drills or commits, the seat compares every file a mutant block names against the verified bench tip: `git diff <bench tip> HEAD -- <file>` for each such file MUST be empty, because the bench tip is the verified content. A non-empty diff means the correction step applied a block at a site other than the block's own (this card's finding); the seat restores the file from the bench tip (`git show <bench tip>:<file>`), re-runs the spec the block names, drills by hand at the site the verdict names, and records the restoration in the merge message. A block whose anchor matches more than one site is not handed to the verb's drill at all.

## Amendment of 2026-09-13 — the valid states of a block, and the comparison's subject (the Codex orchestrator's lean-delivery plan review of 2026-09-13; the seat's own correction)

This section supersedes the first criterion's rule "refuse when either count is not exactly one" and the standing procedure's `git diff <bench tip> HEAD` spelling; everything else stands.

- WHEN the correction step reads a mutant block THE step SHALL count, in the block's file as it will be committed, the sites the `old` text matches and the sites the `new` text matches, and SHALL act on exactly these states: `old` once and `new` absent — the correction is already applied, nothing is written; `old` absent and `new` once — the block is applied at that one site; any other combination (either text at two or more sites, both present, both absent) — REFUSED by name before any write, the file left in its pre-operation state, the two counts printed on the step's line. The safety claim rests on the counts the step measures, never on the block's sentence that its anchor is unique. Bodies cover all four states and the idempotent re-run.
- WHEN the seat applies the standing procedure THE comparison against the verified bench tip is over the content that will be committed — the staged merge and the working file (`git diff <bench tip> -- <file>` from the integration checkout, not `HEAD`, which does not describe a staged merge) — and a non-empty diff is INVESTIGATED before any restore: an authorized integration change (a correction the seat applied by hand, a keeper's redaction) is accounted for, not overwritten to produce an empty diff; only a change the step made outside the block's own site is restored from the bench tip.

## Amendment of 2026-09-13, the later one — a refused block leaves its file in its PRE-OPERATION state, and the standing comparison reads the index and the working tree separately (the Codex orchestrator's reconciliation review of 2026-09-13; the seat's own correction)

This section supersedes criterion 2 and the comparison spelling of the earlier amendment of 2026-09-13; everything else stands.

- WHEN a block is refused (any state other than the two the earlier amendment names as actionable) THE step SHALL perform no write to the block's file, and the file SHALL be byte-identical to its state immediately before the step ran — pinned by a body that hashes the file before the refused step and after it and requires the two hashes equal, with the control that an applied block moves the hash. The reference is the pre-operation state, not the bench tip: at a merge the file may legitimately differ from the bench tip by an authorized integration change (a correction the seat applied by hand, a keeper's redaction), and a refusal that restored the bench tip's bytes would erase it. Whether the file matches the verified content is the seat's separate investigation under the standing procedure, never the step's write.
- WHEN the seat applies the standing procedure THE comparison against the verified bench tip SHALL read the index and the working tree separately — `git diff --cached <bench tip> -- <file>` for the content staged to be committed, then `git diff -- <file>` for what the working tree adds to it — because a single `git diff <bench tip> -- <file>` reads only the working tree and answers empty while a wrong line sits staged and ready to commit. Both readings are investigated: a difference that is an authorized integration change is accounted for in the merge message; a difference the step made outside the block's own site is restored from the bench tip at that site only; the whole file is never restored merely to make a reading empty. The acceptance evidence covers a staged-only corruption (a wrong staged line under a restored working file) and a legitimate integration difference that survives the procedure unchanged.

## Implementation notes

## Verdicts
