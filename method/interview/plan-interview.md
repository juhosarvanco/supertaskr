# The /plan interview

Run by the planner at project genesis. One question at a time — never a
wall of questions; shallow batch answers are the failure mode. Challenge
weak answers instead of transcribing them: "you said fast — compared to
what, measured how?" An interview is not a form.

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

## Output (one pass, after the interview ends)

- docs/NORTH_STAR.md, ROADMAP.md (backbone ordered as the USER experiences
  the product), ARCHITECTURE.md first draft, STATE.md, CONVENTIONS.md seed
- decisions/001-stack.md (+ one ADR per contested choice)
- docs/tasks/ for milestone 1 via the decomposition stage — see decomposition.md; every task must pass its dispatchability test
- Adapter files from adapters/ so any agent can enter the project

Then: cold-start test. A fresh session reads only docs/ and explains the
project back. Gaps in its answer are gaps in the docs — fix and repeat.
