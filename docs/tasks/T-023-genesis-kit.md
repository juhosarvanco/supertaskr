---
id: T-023
title: Genesis kit — planner role, incremental banking, driver contract
feature: F-03
milestone: 3
priority: 1
size: M
status: building
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

The method gap F-03 exposes: nputer.yaml names `planner: claude` but
method/roles/ has no planner.md, and method/interview/plan-interview.md
says docs are written "one pass, after the interview ends" — which
contradicts both the design's live-materializing right pane AND the
succession principle (a stage-4 kill should leave stages 1–4 on disk).
This task makes the interview drivable by anything — a human in a
terminal today, the app's spawned session in T-025 — through one
written contract. Method version bumps to v0.1.5 (noted in
docs/CONVENTIONS.md per the standing gotcha). Product-agnostic: nothing
nputer-app-specific enters method/.

## Acceptance criteria
- THE method SHALL gain method/roles/planner.md in the established role
  format (cf. roles/orchestrator.md): run the interview per
  interview/plan-interview.md one question at a time; challenge weak
  answers; after each BANKED answer immediately write/update the
  affected docs/ artifacts (incremental banking) using
  method/docs-templates/; after Q7 run interview/decomposition.md to
  task files; scaffold the convention into the project (docs/ tree,
  adapter files, .gitignore carrying .nputer/, git init if absent);
  end with the cold-start test and the succession rule.
- THE role file SHALL fix the driver contract in one section: the
  kickoff = this role file plus the interview docs and templates
  (embedded or readable at a stated path); turns are plain text; a
  challenge turn opens with the literal prefix "pushing back:" (a
  rendering hint whose absence has no effect); a skipped answer is
  banked as an assumption marked [?] in the produced doc (archaeology
  convention reused); the transcript is NOT project record — the docs
  are (succession rule restated).
- THE plan-interview.md output section SHALL be amended from one-pass
  to incremental banking (each stage names the artifacts it banks
  into: Q1–Q2 → NORTH_STAR vision/users/success; Q3 → non-goals;
  Q4 → constraints; Q5 → decisions/001-stack.md; Q6 → riskiest
  assumption; Q7 + decomposition → ROADMAP + docs/tasks/), and THE
  banking map SHALL appear as a table a program can transcribe — it is
  T-024's stage-inference spec and T-025's kit spec.
- WHEN a hand-driven dry run of the kit is performed on a toy idea
  (builder runs any agent CLI in a terminal using ONLY the kit as
  instructions) THE produced docs/ tree SHALL parse with zero issues
  through lib/parser's suite commands run against it locally, and at
  least one produced task SHALL pass a written dispatchability
  spot-check; the transcript and the produced tree are attached to
  implementation notes as evidence (the tree lands as a test fixture
  in T-024, not here — lib/parser is deliberately untouched).
- IF the interview is killed at any stage THEN the docs banked so far
  SHALL be sufficient for a fresh session given only the kit and the
  folder to state which stage is next and continue — stated as an
  explicit resume rule in planner.md, exercised once in the dry run.
- IF a produced artifact would overwrite a file that already exists
  with real content THEN planner.md SHALL direct the planner to stop
  and ask the human rather than overwrite (greenfield kit; adopting
  existing content is archaeology's job, out of scope).

Verification: headless — file/section presence and cross-reference
checks, lib/parser suite green against the dry-run tree (run from
lib/parser with the tree as input, no parser code changes), version
bump present in CONVENTIONS. The dry-run transcript quality judgment
(did challenges actually challenge) is @human, listed explicitly.

## Implementation notes

## Verdicts
