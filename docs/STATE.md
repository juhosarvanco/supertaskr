# State

Updated: 2026-08-16 by integrator (T-021 merge), claude-opus-5 @fresh

## Just completed
T-021 (shell IPC hardening, M, app-shell) done and merged — APPROVED
first-pass, same-model review. Built AND verified by claude-fable-5
@fresh sessions; that history is true and stays stamped (only the
integration changed models tonight — see the handoff note below).

The zero-webview-surface proof is now a PINNED CARGO TEST
(app/src-tauri/src/acl_pin.rs, five tests): the 92 grants
`core:default` resolves to on this tree are enumerated, re-resolved on
every `cargo test` from the SHIPPED gen/schemas through tauri's own
resolver — never a stale fixture — and any movement fails printing a
`+`/`-` grant diff plus the full re-pin list. That is the alarm F-04
needs before the grant set first moves. The verifier reproduced it in
BOTH directions (adding `dialog:allow-open` to capabilities/ fired
four independent tests, the diff naming the grant; shrinking to
`core:event:default` printed the 88 removal lines), tried two evasion
routes — a SECOND capability file, and a `remote` key on default.json
— and found each caught four ways, and upgraded the Wry-monomorphism
argument from argument to EVIDENCE by probing unregistered app
commands: they die at handler lookup, never at the ACL, while remote
origins deny the same names before lookup ever happens.

pick_project_folder is single-flight: an RAII `PickInFlight` guard
claimed BEFORE the native dialog opens, a typed `busy` outcome
(`{"kind":"busy"}`) for the refused caller, and `apply_picked_folder`
CONSUMING the guard so no unguarded pipeline can compile. All eight
exit paths plus the panic path were probed for latch release.

The validate→arm mutex is narrowed to the COMMIT alone, with the
TOCTOU question re-derived CLOSED rather than assumed: the mutex never
guarded filesystem mutation (external writers take no process lock,
and the watcher thread provably cannot take this one); the T-003 rule
family still stands at three intact layers (pick-time gate, the
thread's OWN arm-time `has_plain_docs_dir`, read-time symlink refusal
plus per-file canonical containment); T-018's arm-time identity
re-derivation is untouched; and restoring the broad lock KILLS the new
parked-rearm test — mutation-proven, not argued.

cargo 121 → 129 (+3 docs_watch concurrency, +5 acl_pin). T-007
residuals (1), (2) and (4) implemented as named; (3) — the unsanitized
picked-path println — faithfully SKIPPED, because the T-007 verifier
classed it harmless (the local user's own choice, same class as
T-001's project-folder line) and named no action.

ZERO diff to capabilities/, tauri.conf.json and Cargo.lock: the grant
set did not move, which is the whole point of the task.

Merge (done by the predecessor session): zero conflicts at merge-base
7e28f30, file overlap with main's advance provably EMPTY. Suites on
merged main, all re-derived here first-hand: lib/parser 159/159 +
`npx tsc --noEmit` clean; app `npm run build` exit 0 + `npm test`
398/398; src-tauri bare `cargo test` **129 passed + 2 ignored**, THREE
consecutive runs with identical counts, and `cargo build` exit 0. The
docs tree re-parsed through lib/parser/dist: 42 tasks + 9 components +
6 features, 0 issues.

Integrator judgment calls, recorded. Frontmatter: the builder skipped
the intermediate `verifying` stamp (the verifier flagged it for
exactly this reconciliation and left it alone, per the T-011/T-018
house pattern that verifier commits never move status) — reconciled
`building` → `done` here, parser-validated before and after.
CONVENTIONS: the capability-grant gotcha no longer says a pin is
"proposed" — it names acl_pin.rs, and says a deliberate grant is added
by re-pinning EXPECTED_GRANTS in the same commit with the sweep, never
by deleting or muting the test. ARCHITECTURE: NO change — hardening
inside C-05's existing charter, no component or interface moved, and
its "012 keeps native OS surfaces Rust-side (webview grant set stays
empty)" line is now pinned rather than merely restated (checked line
by line; nothing there is made false). NO new ADR (three-prong: no new
cross-component constraint — the task IMPLEMENTS T-007's residuals and
pins ADR-012's existing posture; it contradicts no ADR; and the call
is already durably recorded in the task file's notes + verdict, with
the operational half now in CONVENTIONS). ROADMAP untouched: T-021 is
a pulled-forward milestone-4 task and the backbone tracks neither it
nor mid-milestone progress (T-017/T-023 precedent).

STANDING INTEGRATOR PRACTICE (T-009-s1, RATIFIED at the 2026-08-16
triage as the CONVENTIONS interim regen rule; retires when T-014's
`nputer index --check` becomes the gate) — SEVENTH exercise, and the
first under the ratified wording: TRIGGERED, because the merge touched
`app/src/lib/watcher-store.ts`, a *.ts outside docs/. Regenerated, and
the delta is exactly ONE file. watcher-store.ts: hash + loc 375 → 382,
and 26 symbol ranges shift (+1 for everything below the new union
member, +7 for everything below the new switch case); ZERO symbols
added or removed. Everything else is byte-identical: file count STAYS
78, stats symbols 449 and edges 790 unchanged, 17 packages and the
single unresolved import unchanged, languages still `["ts"]` — and
zero `.rs` files indexed, VERIFIED rather than assumed (Rust
extraction is still T-010's, so acl_pin.rs is invisible to the map).
No asserted value in either dogfood fixture moved, so
app/test/architecture-dogfood.test.ts and
app/test/map-dogfood-render.test.tsx stand BYTE-UNCHANGED — the
78-file hero hint included; the ceaa949 fixture-edits-before-the-
final-regen ordering had nothing to order this time, which is itself
the finding, and both fixtures pass against the regenerated graph
untouched. Determinism: regenerated twice, byte-identical, sha256
a983156341274cf81fafce94a0a5bdb73c6f34b02b56603349340e110bb94dd9;
the plain (non-golden) ignored self-check passes; the app suite re-run
against the regenerated graph is still 398/398.

MODEL HANDOFF — the first cross-model handoff in this project's
history, recorded for the succession experiment (NORTH_STAR criterion
4: cold start on an architect model/session switch). Tonight's
claude-fable-5 sessions hit their usage limit mid-flight. This T-021
integration was resumed from committed state by a fresh claude-opus-5
session, and the T-024 and T-020 builds were relaunched on
claude-opus-5 in their worktrees the same way. Plainly: the resume
needed nothing beyond the repo record. The merge commit plus a clean
working tree said what had landed; docs/STATE.md, CONVENTIONS' regen
rule, and the merged task file (spec + implementation notes + verdict)
named every remaining step and every forecast number — cargo 129+2,
the file-count-78 expectation, the fixture pins. The one wrong number
came from the handoff brief rather than the repo (it predicted ~58
tasks in the docs parse; the tree holds 42, all parsing clean), and
the repo record was the corrective. That is the arrangement working as
designed: the folder is the record, a dead session costs no knowledge,
and a different model picked it up without asking anyone anything.

## In progress / broken right now
OVERNIGHT AUTONOMOUS RUN (human granted 2026-08-16 night, awake for
the grant card): T-024 (genesis lens, M, app-interview) BUILDING in
../nputer-t024 — milestone 3's first slice; harvests the T-023 dry-run
scratch tree as its fixture (T-023-s2). T-020 (CI real-input lane, L,
.github/ + tools/e2e/) BUILDING in ../nputer-t020 — HOLD lifted by the
human, T-018-s3 folded at dispatch. BOTH were relaunched tonight on
claude-opus-5 after their claude-fable-5 sessions ran out of credits
(see the handoff note above), each resuming from committed worktree
state. The t021 worktree is removed; its branch `t021-ipc-hardening`
is kept. Nothing broken.

## Next up (1–4)
1. @human, consolidated: the at-a-glance amber judgment (T-012
   criterion 5's human half — drift stroke vs building/verifying
   fills, BOTH schemes, incl. composed building+drift; the dogfood
   hero renders it live) · the launch-shot re-judgment (T-006's
   pending screenshot predates the rail — light + dark now include
   it) · the standing real-input checklist (picker flows,
   blocker-link click, real-key Esc/Enter/Space) · a Linux run ·
   the T-023 dry-run conversational quality judgment — did the
   two "pushing back:" challenges actually challenge, does the skip
   handling read honest; the founder was builder-scripted in-session
   (stated limitation), true cold-context evidence arrives with
   T-026/T-029.
2. MILESTONE 3 (T-023…T-029, ADR-017), first slice T-023+T-024+T-026
   — hand-driven genesis rendered live: T-023 DONE, T-024 BUILDING,
   and T-026 (genesis entry, M, app-shell) now DISPATCHES — the
   app-shell lane is FREE, T-021 having merged. Human-ruled queue for
   that lane: T-026 → T-025 → T-022. T-026's file already carries the
   T-018-s4 fold (docs-appeared staleness, added as a criterion
   before its dispatch). T-025 (agent runner, L) is now blocked ONLY
   by T-026 — T-021 and T-023 are both done — and its planning pass
   is already applied. T-027 is L (planning pass at dispatch).
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night, via question
   card while awake): the app-shell lane queue was T-021 → T-026 →
   T-025 (agent runner, L; planning pass APPLIED to its file
   2026-08-16 night — blocked_by now [T-021, T-023, T-026]) → T-022;
   T-021 is DONE, so T-026 is next in that lane. T-020: HOLD lifted —
   fold T-018-s3 + dispatch granted (both done). Milestone 3 runs
   through T-029 as blockers clear: T-027 planning pass + dispatch
   when T-024+T-025+T-026 all merge; T-028/T-029 behind T-027.
   Triage: APPLY granted — but tasks NEWLY created by triage do NOT
   dispatch without the human. Unchanged method rule: a second
   REJECTED on any task parks that lane for the human. @human
   judgments are never self-answered.
4. Suggestion-backlog triage APPLIED (2026-08-16, architect; proposal
   drafted read-only by claude-fable-5 @fresh): 27 open suggestions
   dispositioned, none skipped. Six new milestone-4 tasks — T-030
   (parser strictness; absorbs T-008-s3, T-011-s4 warn-half,
   T-019-s2, T-019-s3, T-023-s1 — land before T-027, lib-parser lane
   free now), T-031 (board completeness; absorbs T-017-s1/s2/s3,
   T-019-s1 — launch-screenshot surface), T-032 (map-slice
   hardening; absorbs T-009-s2, T-011-s4 doc-half, T-011-s5,
   T-011-s6, T-012-s2/s3/s4), T-033 (zero-drift registry pass;
   absorbs T-008-s2, T-011-s2 — the plan-§10 launch gate's registry
   half), T-034 (map tasks lens; promotes T-012-s1), T-035
   (skip-sweep prefix exemption; promotes T-018-s2). Folds: T-009-s1
   ratified as the CONVENTIONS interim regen rule with retirement
   folded into T-014; T-018-s4 into T-026 (criterion added before
   its dispatch); T-023-s2 into T-024 (Absorbs line + file removal
   at its merge — the worktree owns the task file until then).
   Parked in place: T-008-s1 (awaits F-04/F-05 layout decisions),
   T-018-s1 (awaits a Windows lane); T-003-s2 stays parked as
   already encoded. Resolved to rejected/: T-011-s1 (T-012 option a
   shipped it), T-011-s3 (T-016 stamped self-verified — C-06's
   rollup carries a mark again). Stale entries cleared: T-009-s3 and
   T-018-s3 were already absorbed into T-020 (files removed at its
   planning/dispatch). NEW tasks do not dispatch without the human
   (item 3's grant). Milestone-4 queue after F-03: T-010, T-013,
   T-014, T-015, T-030…T-035, + T-020 in flight and T-022.
   FOR THE NEXT TRIAGE (three new, filed by T-021): T-021-s1 — the
   ACL pin's EXPECTED_GRANTS is macOS-derived, so exercise it on the
   Linux lane (feeds T-020's first CI run) and decide per-platform
   pins vs a normalized projection; T-021-s2 — genericize the
   AppHandle-taking commands over `R: Runtime` so the pin can
   register the FULL real handler set on MockRuntime; T-021-s3 — pin
   the panic-path latch release as a permanent test (today it is
   structural via Drop, and a refactor to manual latch stores would
   lose it silently). T-020 is mid-build, so s1 folds at a LATER
   triage, not now.

## Open questions
None.
