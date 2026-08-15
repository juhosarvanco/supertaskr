# State

Updated: 2026-08-15 by integrator (T-009 merge — the indexer exists),
claude-fable-5 @fresh

## Just completed
T-009 (indexer crate, L — own planning pass) done and merged,
APPROVED first-pass (same-model). The indexer exists:
app/src-tauri/crates/nputer-index (workspace member; bare `cargo test`
runs both crates) walks/hashes/extracts TS-JS and emits committed,
byte-deterministic docs/architecture/graph.json — release perf 40 ms
cold / 3 ms incremental vs the 500/50 budgets; determinism holds under
hostile-env probes (fake HOME/XDG global excludes change nothing);
zero tauri anywhere in the crate; supply-chain review passed at the
exact `=` pins with all 16 new Cargo.lock checksums verified against
crates.io. Post-merge suite green in ADR-011 order: lib/parser 132/132
+ tsc + build, app build + 94/94, bare cargo test 100 passed +
2 ignored (app 20 + index 80). CONVENTIONS merge conflict resolved
both-edits-stand (cargo-test line + v0.1.4 pointer coexist).

STANDING INTEGRATOR PRACTICE (T-009-s1, first exercised at this
merge, keep until T-014's `--check` lands): any merge touching
*.ts/tsx/js/jsx outside docs/ makes the committed graph.json stale —
regenerate with `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index
--test self_graph -- --ignored`, confirm byte-determinism, commit with
the checkpoint. Done here: the branch-built graph predated main's
T-008/T-016 parser additions; refreshed 46→49 files (component.ts +
component.test.ts + rejected-exclusion.test.ts picked up), 211
symbols, 384 edges, 140,785 bytes, regenerate-twice byte-identical,
ignored self-check green.

## In progress / broken right now
Nothing building; nothing broken.

## Next up (1–3)
1. NOW DISPATCHABLE IN PARALLEL: T-011 (derivation engine, M,
   app-map — both blockers T-008 + T-009 merged) and T-017 (board
   whole-truth filler, M, app-board + app-shell — the app-shell lane
   is freed by T-009's merge; slugs disjoint from T-011's app-map).
2. After T-011: T-012 (map view) closes the milestone-2 slice.
3. Suggestion queue for next triage: T-008-s1 (C-02/03/04 intent
   globs — architect), T-008-s2 (umbrella cn edges — architect
   decision), T-008-s3 (numeric-alias id warning), T-009-s1 (ratify
   as standing rule or keep interim until T-014), T-009-s2
   (URL-scheme specifier gate), T-009-s3 (cargo-audit lane → T-020's
   CI). @human outstanding items unchanged: the launch-screenshot
   judgment (T-006 criterion 2, both schemes) and the consolidated
   real-input checklist (picker flows, blocker-link click, real-key
   Esc/Enter/Space, Linux run).

## Open questions
None.
