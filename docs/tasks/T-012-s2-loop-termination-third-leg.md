---
title: Pin the loop-termination third leg — touch, re-index, exactly one more emit
status: suggested
suggested_by: verifier claude-fable-5 @T-012
---

The pinned loop-termination integration test
(`index_cmd::tests::reindex_emits_once_then_never_again`) proves the
brake's negative space: index once → one emit, index an unchanged tree →
provable silence. It stops one leg short of the full story: after the
silent window, a REAL source change plus re-index must produce **exactly
one more** snapshot (carrying the changed graph) and then silence again
— the positive re-arm that distinguishes "the brake works" from "the
pipeline went dead".

The T-012 verifier ran this exact variant live (temporary probe,
reverted with the verdict): write a second export into `src/a.ts`,
`run_index` → `Indexed{changed:true}`, one emit whose
`docs/architecture/graph.json` content differs from the first and
contains the new symbol, then a 6×DEBOUNCE silent window. It passed
first try; the test is ~35 lines inside the existing module, reusing
`live_state` + `apply_picked_folder` rendezvous, and adds one more
debounce-window wait (~1.5s) to the suite.

Promotion would append the leg to the existing test (or add a sibling)
in `app/src-tauri/src/index_cmd.rs`. Cheap, closes the loop-termination
story end to end, and becomes the regression net for any future change
to write_graph's read-compare-skip or the collector's content-equality
suppression.
