# The /plan interview

Run by the planner (roles/planner.md — driver contract, resume rule,
overwrite rule live there) at project genesis. One question at a time —
never a wall of questions; shallow batch answers are the failure mode.
Challenge weak answers instead of transcribing them: "you said fast —
compared to what, measured how?" An interview is not a form.

## Sequence

1. **Problem & person** — What problem, for whom, in what situation?
   Push until there is one concrete person/scene, not a market.
2. **Success** — What is measurably true when this works? Convert every
   adjective into a number or an observable event.
3. **Non-goals** — What will this deliberately NOT do? Offer tempting
   adjacent features and make the human reject them explicitly.
4. **Constraints** — Deadline, budget, must-use tech, compliance,
   platform. Which are hard vs preferences?
5. **Stack & why** — Proposed stack; challenge any choice made from habit.
   The rationale becomes ADR-001.
6. **Riskiest assumption** — What single belief, if wrong, kills the
   project? How could it be tested cheaply and early?
7. **First slice** — The smallest thing that could ship and teach
   something. Ruthless: milestone 1 should feel too small.

## Output — incremental banking (v0.1.40; supersedes the one-pass rule)

Artifacts are written AS the interview runs, never in one pass at the
end. Each stage banks into its artifacts the moment its answer is
banked (confirmed by the human, or [?]-assumed on a skip); a kill at
any stage leaves every earlier stage on disk (succession rule). This
table is normative — programs transcribe it as written (stage
inference, kit packaging); a change here is a method version bump.

The initialized driver resolves `roles.planner` from canonical committed
PRODUCT settings before starting a planner. An unsupported harness, ambiguous
model or missing explicit selection is unavailable; the account's default
model is never substituted. The supported native adapter passes the exact
normalized model as one value. Its original requested selection, configuration
provenance and resolved executable observation stay with the session, separately
from the model the child actually reports. Resume and later turns resolve the
fixed installed CLI again and compare that original observation; stored paths
never choose a program. A changed planner selection or executable requires a
fresh session. Accepted banks may refresh current PRODUCT/RECORDS revisions and
validated settings without retargeting the original planner. Historical split
sessions missing this provenance refuse resume rather than acquiring today's
selection by inference. Legacy unbound embeddings retain their existing model
behavior. These checks claim neither model availability nor OS confinement.

| Stage | Interview step | Banks into |
|-------|----------------|------------|
| 0 | scaffold (pre-Q1) | initialized separated driver: explicit local initial PRODUCT and RECORDS commits, verified association, committed project settings, PRODUCT adapters/blank kit, RECORDS docs/ templates and empty docs/decisions/ docs/tasks/ docs/rooms/; planner stamps docs/STATE.md (Updated, In progress = next stage). Legacy colocated mode: docs/ tree copied verbatim from docs-templates/ + empty directories + root adapters + .gitignore carrying `.supertaskr/` + git init if absent |
| 1 | Q1 problem & person | docs/NORTH_STAR.md § Vision + § Users |
| 2 | Q2 success | docs/NORTH_STAR.md § Success criteria |
| 3 | Q3 non-goals | docs/NORTH_STAR.md § Non-goals |
| 4 | Q4 constraints | docs/NORTH_STAR.md § Hard constraints |
| 5 | Q5 stack & why | docs/decisions/001-stack.md (+ one ADR per contested choice) |
| 6 | Q6 riskiest assumption | docs/NORTH_STAR.md § Riskiest assumption |
| 7 | Q7 first slice | docs/ROADMAP.md § Backbone (ordered as the USER experiences the product) + § Milestones (milestone 1 goal) |
| 8 | decomposition | docs/tasks/T-*.md (see decomposition.md; every task passes the dispatchability test) + docs/ARCHITECTURE.md first draft + docs/ROADMAP.md § Milestones (task list) + § Parked + docs/STATE.md § Next up |

Banking Q1 also proposes the adapter project name + one-liner. In a
separated workspace the planner writes the fixed machine proposal and
the backend commits the finite PRODUCT adapter update; it does not write
PRODUCT from the planner's RECORDS scope. Legacy colocated mode may fill
the root adapters directly. Neither is a stage-inference input.
Every bank additionally updates docs/STATE.md's In-progress line to
name the NEXT stage — the resume hint; the artifacts stay ground
truth (roles/planner.md, resume rule). docs/CONVENTIONS.md § Build &
test is seeded at stage 5 alongside the stack decision (the exact
commands the stack implies); in separated mode Q5 also proposes canonical
project settings through the same finite backend bank. The driver supplies
the validated current settings and exact input revisions; unconfigured
languages/suites/smoke/health/rename remain explicit until configured, with
no guessed operation fallback. See interview/genesis-product-proposal.md.
Gotchas accrue whenever one is decided.

Then offer the optional cold-start test. A fresh session reads only RECORDS
docs/ and explains the project back. When the person accepts the test,
gaps in its answer are gaps in the docs — fix and repeat until a cold
session passes. The offer does not gate or undo the completed board.
