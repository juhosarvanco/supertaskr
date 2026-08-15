# State

Updated: 2026-08-16 by integrator (T-018 merge), claude-fable-5 @fresh

## Just completed
T-018 (watcher never silently lies or dies, M, app-shell) done and
merged, APPROVED first-pass (same-model) — with the verifier's
evidence CORRECTION on the record, because the record carries the
correction, not the original claim: the notes' "replaced-wholesale
times out pre-T-018" was falsified on macOS (FSEvents watches paths,
so pre-T-018 main already survives a docs/ swap — six of six grafted
runs); the macOS-provable regression is DOCSLESS-STARTUP (docs/
created after a docsless start is dead pre-T-018, six of six), which
is exactly T-003-s1's case 1. The stale-handle replace death stays
real by mechanism on inotify (watches follow inodes) and the reconcile
demonstrably fires here — its regression proof pins on the Linux lane
as T-018-s3. What shipped, all verifier-reproduced (13 sentinel
probes live+seam, a hostile five-class skip tree, DOM-level clip
honesty at 4000 skips, suites three consecutive runs): the STAT-based
root sentinel (armed non-recursive on the project root; (dev,ino)
identity; appears / replaced / vanishes all re-arm or disarm honestly,
including the same-folder re-pick that used to keep a stale handle);
skip surfacing (CollectOutcome → snapshot `skipped`/`skippedTotal`/
`truncated`, five reasons, report capped at 200 path-sorted entries
while skippedTotal stays the honest count; a skipped record renders
last-good — never a phantom deletion; symlinks stay silent BY DECISION
as ADR-010 refusals, ruled sound); the deterministic two-phase file
cap (first 2000 readable paths in path order — T-003-s2's recorded
nondeterminism closed) with the quiet `docs truncated · showing first
N files` note; and additive-only telemetry pinned by cargo tests
(dead sentinel / vanished root leave the watch exactly pre-T-018;
whole-outcome equality including skips is the suppression baseline).
Absorbs T-003-s1 (residual), T-003-s3 (settled), T-003-s2's reporting
half. Zero IPC/ACL/CSP/dependency diff. Merge was zero-conflict at
merge-base ff09f33 (main's advance was docs-only: T-020 plan, F-03
promotion, T-023 dispatch); suites on merged main were the forecast
exactly: lib/parser 132/132 + tsc + build; app build + 392/392
(375 + 17 new); bare cargo 121 + 2 ignored. Suggestions T-018-s1
(builder) and T-018-s2/s3/s4 (verifier) are on the board.

STANDING INTEGRATOR PRACTICE (T-009-s1, fifth exercise, keep until
T-014's `--check` lands): regenerated the committed graph.json —
75→76 files, 425→441 symbols, 749→770 edges (+21 edges, 0 removed;
280,703 bytes), regenerate-twice byte-identical (sha256 da078dd9…),
ignored self-check green, full app suite green after reconciliation.
Both dogfood fixtures moved again, every delta enumerated in dated
addenda: derivation dogfood — mapping C-05 30→31 (watcher-truth
joins the app/test umbrella), D2 STAYS EMPTY, findings byte-unchanged
(no new families — the new suite imports no parser), relation table
same 23 rows and same 12 confirmed / 4 undeclared / 7 planned tally
with only C-05→C-10 growing 8→10 (the truth suite consumes
docs-model, and App.tsx now imports skipReasonPhrase directly — the
first src-side C-05→C-10 edge, still the declared direction); map
hero hint 75→76. The ceaa949 ordering lesson held its fifth test:
fixture edits BEFORE the final regen.

## In progress / broken right now
T-023 (genesis kit, M, method lane) building in its worktree —
milestone 3 is open. T-019 (parser/model hygiene, M, lib-parser +
app-board) fix pass building in its worktree. Nothing broken.

## Next up (1–4)
1. @human, consolidated: the at-a-glance amber judgment (T-012
   criterion 5's human half — drift stroke vs building/verifying
   fills, BOTH schemes, incl. composed building+drift; the dogfood
   hero renders it live) · the launch-shot re-judgment (T-006's
   pending screenshot predates the rail — light + dark now include
   it) · the standing real-input checklist (picker flows,
   blocker-link click, real-key Esc/Enter/Space) · a Linux run.
2. MILESTONE 3 (T-023…T-029, ADR-017), first slice T-023+T-024+T-026
   — hand-driven genesis rendered live: T-023 building; **T-026
   (genesis entry, M, app-shell) is now UNBLOCKED by this merge** —
   the first slice's third card; T-025/T-027 are L (planning passes
   at dispatch).
3. THE FREED APP-SHELL LANE: T-021 (shell IPC hardening, M) is now
   dispatchable — the F-03 plan recommends it lands before T-025;
   T-022 (front-door persistence) queues behind it.
4. Next architect triage, the full suggestion backlog: T-008-s1/s2/s3,
   T-009-s1 (ratify as standing rule or keep interim until T-014),
   T-009-s2, T-009-s3, T-011-s1 (**RESOLVED** by T-012's option-a
   amendment — mark it so), T-011-s2/s3/s4/s5/s6, T-012-s1/s2/s3/s4,
   T-017-s1/s2/s3, and new T-018-s1 (Windows replace identity),
   T-018-s2 (dir-level skips sweep buried records), T-018-s3 (pin the
   replace regression on the Linux lane — feeds T-020), T-018-s4
   (empty-docs front-door staleness). Milestone-4 queue re-enters
   after F-03: T-010, T-013, T-014, T-015 + hardening T-019 (fix in
   flight), T-020 (planned, L), T-021/T-022 (item 3).

## Open questions
None.
