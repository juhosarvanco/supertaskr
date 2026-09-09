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

## Output — incremental banking (v0.1.16; supersedes the one-pass rule)

Artifacts are written AS the interview runs, never in one pass at the
end. Each stage banks into its artifacts the moment its answer is
banked (confirmed by the human, or [?]-assumed on a skip); a kill at
any stage leaves every earlier stage on disk (succession rule). This
table is normative — programs transcribe it as written (stage
inference, kit packaging); a change here is a method version bump.

| Stage | Interview step | Banks into |
|-------|----------------|------------|
| 0 | scaffold (pre-Q1) | docs/ tree copied verbatim from docs-templates/ + empty docs/decisions/ docs/tasks/ docs/rooms/ + adapter files at project root + .gitignore carrying `.supertaskr/` + git init if absent + docs/STATE.md stamped (Updated, In progress = next stage) |
| 1 | Q1 problem & person | docs/NORTH_STAR.md § Vision + § Users |
| 2 | Q2 success | docs/NORTH_STAR.md § Success criteria |
| 3 | Q3 non-goals | docs/NORTH_STAR.md § Non-goals |
| 4 | Q4 constraints | docs/NORTH_STAR.md § Hard constraints |
| 5 | Q5 stack & why | docs/decisions/001-stack.md (+ one ADR per contested choice) |
| 6 | Q6 riskiest assumption | docs/NORTH_STAR.md § Riskiest assumption |
| 7 | Q7 first slice | docs/ROADMAP.md § Backbone (ordered as the USER experiences the product) + § Milestones (milestone 1 goal) |
| 8 | decomposition | docs/tasks/T-*.md (see decomposition.md; every task passes the dispatchability test) + docs/ARCHITECTURE.md first draft + docs/ROADMAP.md § Milestones (task list) + § Parked + docs/STATE.md § Next up |

Banking Q1 also fills the adapter files' project name + one-liner at
the project root (outside docs/, so not a stage-inference input).
Every bank additionally updates docs/STATE.md's In-progress line to
name the NEXT stage — the resume hint; the artifacts stay ground
truth (roles/planner.md, resume rule). docs/CONVENTIONS.md § Build &
test is seeded at stage 5 alongside the stack decision (the exact
commands the stack implies); gotchas accrue whenever one is decided.

Then: cold-start test. A fresh session reads only docs/ and explains the
project back. Gaps in its answer are gaps in the docs — fix and repeat.
