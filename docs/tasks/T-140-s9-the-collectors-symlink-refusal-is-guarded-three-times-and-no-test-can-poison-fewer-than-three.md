---
id: T-140-s9
title: The collector's symlink refusal is guarded three times and neither symlink test can be poisoned by lifting fewer than three — both bodies survive the removal of the guard they are named after
feature: F-06
milestone: 4
priority: 18
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-140-s4
blocked_by: []
touches: [app/src-tauri/src/docs_watch.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY A POISON DRILL THAT WOULD NOT RED**, in `T-140-s4`'s detached
drill worktree at `656511f`, `CARGO_TARGET_DIR=<scratch>/target`.

`collect_docs_tree`'s walk refuses a symlink THREE times, and the three
are independent:

1. `if meta.file_type().is_symlink() { continue; }` — the named guard,
   carrying the comment *"never follow links out of the tree"*.
2. `if !canon.starts_with(&canon_project) { continue; }` — the
   "belt to the symlink-skip's suspenders" canonical prefix check, whose
   own comment says it is the second layer.
3. `relative_posix(&canon, &canon_project)` returning `None` — which is
   `path.strip_prefix(base).ok()?`, i.e. **the same containment
   predicate as (2), expressed a second time**, one line further down,
   in a helper whose stated job is formatting.

**THE MEASUREMENT.** Two bodies name this property:
`docs_watch::tests::symlinks_are_never_followed` and
`symlinked_docs_file_in_a_subdirectory_is_never_followed` (T-140-s4
re-aimed the latter from `.json` to `.md`).

- Lift guard **1** alone (`&& false`): `cargo test -p nputer` is
  **251 passed / 0 failed**. Both bodies GREEN.
- Lift guards **1 and 2**: **251 passed / 0 failed**. Both bodies still
  GREEN — killed by (3).
- Poison the expected value of the second body instead (one side only):
  **1 failed**, that body by name. So the bodies are NOT vacuous; they
  run, and their values matter.

**WHY THIS IS WORTH A CARD AND NOT A SHRUG.** Defence in depth is good
and nothing here is broken. What is wrong is the EVIDENCE: two tests are
named for a guard that neither can detect the loss of, so the suite
reports coverage of layer 1 that it does not have. Delete the
`is_symlink` branch tomorrow and every gate in this repository stays
green — on a path that ADR-010 treats as a security boundary, where the
`.md`/`.json` distinction was the only thing the drill did change.

**AND THE DUPLICATION IN (2)/(3) IS THE CHEAPER HALF OF THE FINDING.**
`starts_with` followed by `strip_prefix` is one predicate written twice
in adjacent statements. That is not depth, it is a copy: the two cannot
disagree, so the second buys nothing and hides the fact that (1) is
unprotected by any test.

**WHAT A LANE WOULD DO** (proposed, not ruled): give each layer a body
that can only be killed by that layer — the shape is a unit test on the
predicate rather than on the walk — or, if the layers are deliberately
redundant, say so at the site and record that the walk-level bodies test
CONTAINMENT and not symlink-following, which is a true sentence and a
different name than the ones they carry.

**NOT CAUSED BY `T-140-s4`.** The same three layers, and the same
un-poisonable pair, exist at `5073db6` before that card. It re-aimed one
of the two bodies and drilled it, which is how the property was seen.
