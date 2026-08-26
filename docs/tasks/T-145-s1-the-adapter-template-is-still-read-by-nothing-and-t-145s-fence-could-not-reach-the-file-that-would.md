---
id: T-145-s1
title: The adapter template is read by nothing, T-145's fence could not reach the file that would, and the omission it just fixed was measured passing a full green cargo suite
status: suggested
suggested_by: executor claude-opus-5 @T-145
touches: [app-agent]
---

**T-145 landed the fix and could NOT land the pin its own card asked
for.** The card says, in as many words, *"it must not land unpinned
either"* — and then fences the lane to `method/adapters/`, which is two
markdown files. Every place a pin could live is outside it:

- `app/src-tauri/src/agent/kit.rs` (`app-agent`) — the natural home. It
  already walks `method/adapters/` for the snapshot-parity test and
  already reads files off disk through `repo_root()`.
- `tools/e2e/tests/*.spec.ts` — the other candidate, and `T-137` held
  `tools/e2e` live for the whole of T-145's lane.
- A new file inside `method/adapters/` **is not an escape**: the fence
  would allow the path, but
  `the_snapshot_table_covers_every_method_scaffold_file` in `kit.rs`
  walks that directory and reds `cargo test` for any file not in
  `KIT_FILES`. The fence permits the write; the suite forbids it.

## What was measured, not reasoned

At `9a80c8a`, in a detached scratch worktree outside the repository,
`docs/ROADMAP.md` was removed from the template's read-first sentence —
the exact pre-T-145 defect, restored on purpose:

    cargo test  (app/src-tauri)   exit 0   18 green test-result lines, 0 failures

**A full green cargo suite over the tree carrying the defect.** Nothing
else in the repository reads a template's CONTENT either: `kit.rs`
`include_str!`s both files and asserts only that the compiled bytes equal
the same file on disk, which is true for any content whatsoever.

## The property to assert

Two, both DERIVED — no document list and no tally written down anywhere,
which is what keeps this from going stale the way the sentence it guards
did:

1. **For each `method/adapters/*.md`: the set of `docs/<X>.md` paths the
   template names equals the set of `docs/<X>.md` files
   `method/README.md`'s repo-layout block scaffolds.** Catches OMISSION
   (a scaffolded document the template never names — T-145's defect) and
   INVENTION (a document the method does not create, which ships as a
   dead path into every project copied from the template).
2. **Every file in `method/adapters/` is byte-identical from line 2 on.**
   Line 1 is the opening HTML comment, which legitimately differs.
   `T-144`'s own commit `1dbdc63` routes exactly this half here: *"if the
   templates are ever worth comparing, it is content-below-the-comment,
   and that is T-145's ground"*.

**Arm 1 is deliberately whole-file rather than read-first-sentence.** The
card asked only that the SENTENCE name the scaffolded set; whole-file is
strictly stronger for the shipping case, because a document named nowhere
in the adapter is invisible to the project that receives it, and a
document named that the method never creates is a broken path on day one.
It also lets `docs/NORTH_STAR.md` be routed by the template's own
conflict clause instead of forced into the read-first sentence.

## The stronger property, and why it must NOT be taken first

*"Assert the read-first SET is what the ROLE FILES expect"* (`T-144`
arm 2) is the property anyone actually cares about. **It reds today, on a
file no fence here can touch**: `method/roles/executor.md` step 1 names
`docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md` and omits
ROADMAP, while `method/roles/orchestrator.md` step 1 names all four. That
disagreement is `T-138-s4`'s ground. A guard that reds on arrival gets
weakened or deleted rather than fixed — the same reasoning `T-144` used
to scope its own arm 1 — so this arm is **sequenced after `T-138-s4`,
not merged into this card**.

## Positive control, already run (T-142)

The assertion was written as a scratch script and exercised outside the
repository before being proposed, so whoever takes this card inherits a
property already proven to fail:

    both templates fixed          -> exit 0
    ROADMAP dropped, ONE side     -> exit 1, arms 1 AND 2 both name it
    ROADMAP dropped, BOTH sides   -> exit 1, arm 2 SILENT, arm 1 alone
    restored                      -> exit 0, sha256 identical to before

The both-sides case is the one that matters: it proves arm 1 is not
piggybacking on arm 2, and it is the exact shape the defect had.

## Fence note

`app-agent` was disjoint from every lane live on 2026-08-26 (`T-137`,
`T-141`, and the laneless `T-135`). **That is a fact about that night and
not about the night this is dispatched** — re-derive with `brief.mjs
--task` after the card is committed, never from these tokens.
