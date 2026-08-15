# State

Updated: 2026-08-15 by integrator (T-017 merge — the board tells the
whole truth), claude-fable-5 @fresh

## Just completed
T-017 (board whole-truth filler, M, app-board + app-shell) done and
merged, APPROVED first-pass (same-model). The board tells the whole
truth — six absorbed riders: pathological titles wrap instead of
bleeding (break-words on all four title spans, compiled-bundle rule
verified), parked tasks open in the detail panel via cardRef (parked
row expands in place into card-trigger entries), Implementation notes
render as a collapsed-by-default mono disclosure, header controls
carry data-panel-exempt so the theme toggle no longer costs an open
panel (parked toggle too — ratified judgment call), the card face
shows `rejected ×N` derived in selectBoard from the shared classifier
(new app/src/lib/verdicts.ts, so count and tint cannot disagree), and
verdict tinting is first-match-wins on the header paragraph. The
verifier RULED ×N renders at N ≥ 1: zero is the only absence
carve-out, and ×1 distinguishes recorded rejection from
rejection-unrecorded (one-line change if @human reads the mockup as
×2-only). Merge was zero-conflict (main's only advance was the
docs-only T-012 planning commit). Post-merge suite green in ADR-011
order: lib/parser 132/132 + tsc + build, app npm ci + build + 121/121
(was 94), bare cargo test 100 passed + 2 ignored (src-tauri
untouched).

STANDING INTEGRATOR PRACTICE (T-009-s1, second exercise, keep until
T-014's `--check` lands): any merge touching *.ts/tsx/js/jsx outside
docs/ makes the committed graph.json stale — regenerate with
`NPUTER_UPDATE_GOLDEN=1 cargo test --release -p nputer-index --test
self_graph -- --ignored`, confirm byte-determinism, commit with the
checkpoint. Done here: refreshed 49→51 files (verdicts.ts +
board-truth.test.tsx picked up), 211→230 symbols, 384→407 edges,
149,880 bytes, regenerate-twice byte-identical, ignored self-check
green. FLAG for T-011's integrator: this regen shifts the dogfood
derivation findings that T-011's not-yet-merged fixture pins —
reconciling that fixture against the refreshed graph belongs to
T-011's integration, not to anyone else.

## In progress / broken right now
T-011 (derivation engine, M, app-map) in verification in its own
worktree. Nothing broken.

## Next up (1–3)
1. T-011 merge (verification underway) — its integrator reconciles
   the dogfood fixture against this checkpoint's graph refresh and
   brings T-011-s1/s2/s3 with the branch.
2. T-012 (map view, L, fully planned at c8ba301, architect-approved):
   T-017's merge just cleared the app-shell touches guardrail (the
   App.tsx collision), so its dispatch now gates on T-011's merge
   plus the explicit @human word required for size L.
3. Suggestion queue for next triage: T-008-s1 (C-02/03/04 intent
   globs — architect), T-008-s2 (umbrella cn edges — architect
   decision), T-008-s3 (numeric-alias id warning), T-009-s1 (ratify
   as standing rule or keep interim until T-014), T-009-s2
   (URL-scheme specifier gate), T-009-s3 (cargo-audit lane → T-020's
   CI), + new T-017-s1 (remaining unbroken-text surfaces), T-017-s2
   (verdict-block overflow parity), T-017-s3 (verdict-splitter
   column-0 anchor); T-011-s1/s2/s3 arrive with its merge. @human
   outstanding items unchanged: the launch-screenshot judgment
   (T-006 criterion 2, both schemes) and the consolidated real-input
   checklist (picker flows, blocker-link click, real-key
   Esc/Enter/Space, Linux run).

## Open questions
None.
