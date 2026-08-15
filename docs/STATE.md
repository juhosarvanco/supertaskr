# State

Updated: 2026-08-16 by integrator (T-023 merge), claude-fable-5 @fresh

## Just completed
T-023 (genesis kit, M, method lane) done and merged — APPROVED
first-pass, same-model review. Method is now v0.1.5:
method/roles/planner.md is NEW (stage-0-scaffold-first numbered flow;
the driver contract fixed in one section — kickoff enumeration of the
kit files, plain-text turns, the literal "pushing back:" prefix as an
inert rendering hint whose absence has no effect, skip → best
assumption banked marked [?], transcript-is-NOT-record with the
succession rule restated; an explicit resume rule — next stage = first
banking-map row whose artifacts are missing/template-empty, STATE's
In-progress line as cross-check hint, ARTIFACTS WIN; and a
never-overwrite guard — real content the planner didn't bank itself →
stop and ask the human, adoption stays archaeology's job);
method/interview/plan-interview.md amended one-pass → incremental
banking with the 9-row program-transcribable banking table (stages
0–8 → artifacts; it IS T-024's stage-inference spec and T-025's kit
spec, changing it is a method version bump); docs-templates are now
verbatim-copy scaffoldable — example rows folded into comments, a
stage-0 tree parses 0 issues AND 0 features, and the verifier proved
both directions (base templates re-produce exactly the 2 phantom
`<feature name>` records). Dry-run evidence: the toy-project tree
(streak, a CLI habit tracker) was reconstructed BLIND by the verifier
from the notes alone and parsed 0 issues through the branch parser
(the executor's surviving scratch tree corroborated — identical
model, commit b18a33c, `.nputer/` ignored); the resume rule was
exercised once (stage-4 kill → disk-only pass stated "next stage: 5"
and continued); the written dispatchability walk of produced T-002
passed with zero unresolved executor questions. Recorded honestly:
the orchestrator's dispatch brief misstated the parser baseline
(153/153; truth at branch point 3c468fd was 132/132) — the executor's
deviation note handled it correctly and the verifier confirmed 132
fresh. Security sweep clean: diff confined to method/** +
docs/CONVENTIONS.md + docs/tasks/T-023-* exactly, no adapter changes,
no bypass flags anywhere; the kit's imperative surface is file copies
+ docs writes + git init/add/commit with two human gates (board
approval, overwrite stop-and-ask). Merge was zero-conflict at
merge-base 3c468fd, file overlap with main's advance (T-018 +
checkpoint + T-021 dispatch + T-019 + checkpoint) provably EMPTY —
main had not touched docs/CONVENTIONS.md. Suites on merged main, all
forecast-UNCHANGED as a method-only merge predicts: lib/parser
159/159 + tsc clean + build; app build + 398/398; bare cargo 121
passed + 2 ignored. No new ADR (three-prong: the kit implements
ADR-017's approved architecture; the driver contract and banking map
are durably recorded in the method files themselves — they ARE the
record). ROADMAP untouched (mid-milestone progress lives here, T-017
precedent). This merge OPENS milestone 3's first slice: T-024 is
unblocked.

STANDING INTEGRATOR PRACTICE (T-009-s1, kept until T-014's `--check`
lands): considered and correctly NOT triggered this merge — the
merged diff contains zero TS/JS/Rust source (verified: nothing under
app/src, app/src-tauri, lib/parser src/test — method/** + docs/**
only), so graph.json was deliberately not regenerated and both
dogfood fixtures stand.

## In progress / broken right now
OVERNIGHT AUTONOMOUS RUN (human granted 2026-08-16 night, awake for
the grant card): T-021 (shell IPC hardening, M, app-shell) BUILDING
in ../nputer-t021, dispatched at main@7e28f30. T-024 (genesis lens,
M, app-interview) BUILDING in ../nputer-t024 — first slice, dispatched
this commit; harvests the T-023 dry-run scratch tree as its fixture
(T-023-s2). T-020 (CI real-input lane, L, .github/ + tools/e2e/)
BUILDING in ../nputer-t020 — HOLD lifted by the human, T-018-s3
folded at dispatch. Read-only drafts in flight: T-025 planning pass;
the full suggestion-backlog triage (APPLY granted — see item 3).
Nothing broken.

## Next up (1–4)
1. @human, consolidated: the at-a-glance amber judgment (T-012
   criterion 5's human half — drift stroke vs building/verifying
   fills, BOTH schemes, incl. composed building+drift; the dogfood
   hero renders it live) · the launch-shot re-judgment (T-006's
   pending screenshot predates the rail — light + dark now include
   it) · the standing real-input checklist (picker flows,
   blocker-link click, real-key Esc/Enter/Space) · a Linux run ·
   NEW: the T-023 dry-run conversational quality judgment — did the
   two "pushing back:" challenges actually challenge, does the skip
   handling read honest; the founder was builder-scripted in-session
   (stated limitation), true cold-context evidence arrives with
   T-026/T-029.
2. MILESTONE 3 (T-023…T-029, ADR-017), first slice T-023+T-024+T-026
   — hand-driven genesis rendered live: T-023 is DONE (merged, this
   checkpoint); T-024 is BUILDING; T-026 (genesis entry, M,
   app-shell) is unblocked but the app-shell lane is held by T-021.
   T-025/T-027 are L (planning passes at dispatch).
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night, via question
   card while awake): app-shell lane queue is now T-021 → T-026 →
   T-025 (agent runner, L; planning pass drafting tonight, architect
   reviews/applies before dispatch) → T-022. T-020: HOLD lifted —
   fold T-018-s3 + dispatch granted (done, this commit's sibling).
   Milestone 3 runs through T-029 as blockers clear: T-027 planning
   pass + dispatch when T-024+T-025+T-026 all merge; T-028/T-029
   behind T-027. Triage: APPLY granted tonight — but tasks NEWLY
   created by triage do NOT dispatch without the human. Unchanged
   method rule: a second REJECTED on any task parks that lane for
   the human. @human judgments are never self-answered.
4. Next architect triage, the full suggestion backlog: T-008-s1/s2/s3,
   T-009-s1 (ratify as standing rule or keep interim until T-014),
   T-009-s2, T-009-s3, T-011-s1 (**RESOLVED** by T-012's option-a
   amendment — mark it so), T-011-s2/s3/s4/s5/s6, T-012-s1/s2/s3/s4,
   T-017-s1/s2/s3, T-018-s1 (Windows replace identity), T-018-s2
   (dir-level skips sweep buried records), T-018-s3 (ABSORBED into
   T-020 at its dispatch — file removed, triage encoding),
   T-018-s4 (empty-docs front-door staleness), T-019-s1 (card-level
   soft-issue surfacing), T-019-s2 (filename convention rule),
   T-019-s3 (blocked_by self-references and cycles), and new
   T-023-s1 (parseRoadmap is HTML-comment-blind — verifier-confirmed
   real by probe; lib-parser lane) and T-023-s2 (dry-run fixture
   fidelity — T-024's fixture should be harvested from the executor's
   still-alive session scratch tree, which is SESSION-LIVED and
   disappears when the orchestrator session ends; the verifier's
   notes-reconstruction is the proven fallback). Milestone-4 queue
   re-enters after F-03: T-010, T-013, T-014, T-015 + hardening
   T-020 (HOLD, item 3), T-021/T-022 (item 3).

## Open questions
None.
