# State

Updated: 2026-08-16 by integrator (T-019 merge), claude-fable-5 @fresh

## Just completed
T-019 (parser/model hygiene, M, lib-parser + app-board) done and
merged — an honest arc, same-model review: first pass REJECTED (the
one hole in the flagged judgment call: a PRESENT, well-formed,
zero-bullet `## Backbone` parsed to features: [] with NO issue, and
the zero-feature skip then silenced every featured task's dangling
reference — end-to-end, since docs-model codifies "empty backbone,
no issues" as a valid state); fresh-executor fix pass (910eb9b):
validateProject gains `options.roadmapReported`, strict `=== true`,
distilled by BOTH assemblers from the roadmap layer's OWN issue
sublist — spoof-proof by construction (a task-file or component
io-error cannot fake "the roadmap reported" and re-create the
silence); parseRoadmap byte-identical, standalone default stays
loud; re-verified APPROVED (f6d1d3a): 8 hostile probes held
(unreadable task file beside a clean empty backbone, component-layer
issues beside same, unreadable/empty-string/missing roadmap keeping
the skip, partial-backbone flag inert, truthy-junk and
__proto__-smuggled flags rejected), the distillation source-verified
in both assemblers, failing→passing RE-DERIVED on old src — exactly
3 red / 16 green, restored 19/19. What shipped in full: validateProject
cross-references from both entries (dangling blocked_by → task,
feature → backbone, id ↔ filename mismatch as new additive
`id-mismatch` kind — collect-don't-throw, records still render), the
task-id format family rule (^T-\d+(-s\d+)?$), the feature-id rule
pinned, and the suggestion preamble preserved in the model and
rendered in the ghost detail panel (hostile content stays inert
text). Absorbs T-002-s1/s2/s3. Merge was zero-conflict at merge-base
ff09f33 (file overlap provably empty — main's advance was T-018 +
its checkpoint + the T-021 dispatch); suites on merged main:
lib/parser 159/159 + tsc + build; app build + 398/398 (main's 392 +
the branch's 6); bare cargo 121 + 2 ignored. Suggestions T-019-s1
(card-level soft-issue surfacing, executor), T-019-s2 (filename
convention rule, executor), T-019-s3 (blocked_by cycles, verifier)
are on the board.

STANDING INTEGRATOR PRACTICE (T-009-s1, sixth exercise, keep until
T-014's `--check` lands): regenerated the committed graph.json —
76→78 files (validate.ts AND validate.test.ts join C-06; the branch
forecast one file, the indexer's lib/parser/test/** coverage makes
it two), 441→449 symbols, 770→790 edges (+20, 0 removed),
regenerate-twice byte-identical (sha256 862acc57…), ignored
self-check green, full app suite green after reconciliation. Both
dogfood fixtures moved, every delta enumerated in dated addenda:
derivation dogfood — mapping C-06 19→21, D2 STAYS EMPTY, findings
byte-unchanged (every new edge is C-06-internal or package-bound;
verified by re-derivation, not assumed), relation table same 23 rows,
same 12/4/7 tally, every observedCount unchanged; map hero hint
76→78. The ceaa949 ordering lesson held its sixth test: fixture
edits BEFORE the final regen.

## In progress / broken right now
T-023 (genesis kit, M, method lane) VERIFYING — executor finished on
branch t023-genesis-kit (9e71bbb + 5875f30), adversarial verifier
running in its worktree. T-021 (shell IPC hardening, M, app-shell)
BUILDING in its worktree, dispatched at main@7e28f30. Nothing broken.

## Next up (1–4)
1. @human, consolidated: the at-a-glance amber judgment (T-012
   criterion 5's human half — drift stroke vs building/verifying
   fills, BOTH schemes, incl. composed building+drift; the dogfood
   hero renders it live) · the launch-shot re-judgment (T-006's
   pending screenshot predates the rail — light + dark now include
   it) · the standing real-input checklist (picker flows,
   blocker-link click, real-key Esc/Enter/Space) · a Linux run.
2. MILESTONE 3 (T-023…T-029, ADR-017), first slice T-023+T-024+T-026
   — hand-driven genesis rendered live: T-023 is VERIFYING; T-024
   unblocks only at T-023's MERGE (still pending); T-026 (genesis
   entry, M, app-shell) is unblocked but the app-shell lane is held
   by T-021. T-025/T-027 are L (planning passes at dispatch).
3. APP-SHELL LANE QUEUE (human-decided 2026-08-16): after T-021
   merges, T-026 takes the lane NEXT; T-022 (front-door persistence,
   milestone 4) queues BEHIND T-026 — supersedes the earlier
   T-021→T-022 standing order. T-020 (CI real-input lane):
   human-decided HOLD — not dispatched now; the next architect
   triage folds T-018-s3 (the Linux replace-regression pin) into it
   before build.
4. Next architect triage, the full suggestion backlog: T-008-s1/s2/s3,
   T-009-s1 (ratify as standing rule or keep interim until T-014),
   T-009-s2, T-009-s3, T-011-s1 (**RESOLVED** by T-012's option-a
   amendment — mark it so), T-011-s2/s3/s4/s5/s6, T-012-s1/s2/s3/s4,
   T-017-s1/s2/s3, T-018-s1 (Windows replace identity), T-018-s2
   (dir-level skips sweep buried records), T-018-s3 (pin the replace
   regression on the Linux lane — folds into T-020 per item 3),
   T-018-s4 (empty-docs front-door staleness), and new T-019-s1
   (card-level soft-issue surfacing), T-019-s2 (filename convention
   rule), T-019-s3 (blocked_by self-references and cycles).
   Milestone-4 queue re-enters after F-03: T-010, T-013, T-014,
   T-015 + hardening T-020 (HOLD, item 3), T-021/T-022 (item 3).

## Open questions
None.
