# Decomposition — from backbone to exact tasks

Runs immediately after the /plan interview (or after archaeology), same
planner session. This is the bridge from "F-01: workspace core" to
dispatchable task files — the step where vague plans usually die.

**The dispatchability test — the definition of an exact task:** a fresh
session with NO other context can read the task file + docs/ and build the
right thing without asking a single question. Every task must pass it.

## Procedure

1. **Walk the backbone left to right.** For each feature in milestone 1,
   list every piece of work it implies — including the unglamorous ones
   (migrations, config, error paths, empty states). Name what you are
   deliberately leaving out; put it in ROADMAP.md Parked.
2. **Slice into tasks.** Each task: one coherent change, one branch, one
   session. Too big if it needs more than one worktree or touches more
   than ~2 components. Too small if the checkpoint costs more than the
   work — fold it into a neighbor.
3. **Write acceptance criteria in EARS notation** — the de facto
   standard for criteria unambiguous to humans and models. Five
   patterns cover almost everything:
   - Ubiquitous:        THE system SHALL <behavior>
   - Event-driven:      WHEN <trigger> THE system SHALL <behavior>
   - State-driven:      WHILE <state> THE system SHALL <behavior>
   - Unwanted behavior: IF <failure/abuse> THEN THE system SHALL <response>
   - Optional feature:  WHERE <feature enabled> THE system SHALL <behavior>
   Every criterion maps ~1:1 onto a test case — write it so the verifier
   can enforce it mechanically with the CONVENTIONS.md test commands.
   An EARS line phrases the requirement; the TEST is what enforces it —
   a criterion with no enforceable check is not done being written.
   Ban words: fast, clean, robust, proper, good — convert each to a
   number or an observable event, or delete it. Always include at least
   one unwanted-behavior (IF/THEN) line: the edge cases live there.

   **A CRITERION CAN SPECIFY A CHECK THAT CANNOT FAIL, AND IT READS
   EXACTLY LIKE A REAL ONE.** The shape to recognise: **a criterion that
   names a relation between a POLICY and a VIEW DERIVED FROM THAT POLICY
   has specified a tautology.** Worked form — a coverage floor written
   over "the tracked set MINUS the exclusions": adding a suffix to the
   exclusion set removes it from the expectation at the same instant it
   removes it from the corpus, so **the deletion deletes its own
   failure** and the floor can never bite. Both sides move together
   because they are the same source read twice.
   **THE TEST IS TO TRY TO RED IT.** Before the criterion ships, name the
   input that makes it FAIL. If you cannot name one, you have written a
   restatement, not a requirement — delete it or re-anchor one side to
   something the policy does not derive (a literal, a frozen fixture, an
   independently-measured expectation).
   **GATHER THE EVIDENCE BY MUTATING THE PROPOSED CHECK, NOT THE THING IT
   CHECKS.** This is how the shape survives review: mutating the POLICY
   makes the criterion look alive, because the policy really does move the
   world. Only mutating the CHECK reveals that the check moved with it.
   **AND TWO CRITERIA ON ONE CARD CAN CONTRADICT EACH OTHER.** Read the
   set against ITSELF, not only against the tree — one criterion
   preferring the tautological form while a second requires the floor to
   bite for the same input is a card that cannot be satisfied at all, and
   the executor discovers it only after building. Contradiction between
   criteria is what turns this from a style note into a defect, so the
   self-review in step 8 checks the criteria against one another.
4. **Size honestly** (S/M/L per TASK-FORMAT.md) — size sets ceremony,
   so under-sizing skips verification and over-sizing wastes tokens.
5. **Declare the blast radius.** Fill `touches:` with the components
   and key paths the task is expected to modify. The orchestrator uses
   this to never run overlapping tasks in parallel — worktrees isolate
   directories, but nothing else warns when two branches edit the same
   file. Shared hotspots (routes, config, registries) deserve their own
   serialized tasks.
6. **Map dependencies.** blocked_by only for true technical blockers —
   preference orderings go in priority, not blocked_by. Check: at least
   one task per feature must be unblocked on day one, or milestone 1
   deadlocks at the start.
7. **Set priorities** = vertical position on the story map: 1 is the top
   card, the feature's next task. Essential before nice.
8. **Self-review against the test.** Re-read every task file as if you
   were the fresh executor. Any question you would need to ask = a gap;
   fix the file, not the moment of dispatch.
9. **Present the board to the human** — features, tasks, sizes, the
   milestone slice — and revise before anything is dispatched. This
   review IS the moment scope gets cut; make the human reject cards,
   not concepts.

## Output

- docs/tasks/T-*.md for all of milestone 1 (later milestones stay as
  backbone lines — decomposing them now is speculation; they get their
  own decomposition pass at their /plan review)
- ROADMAP.md Parked seeded with everything consciously deferred
- STATE.md "Next up" = the top unblocked cards, matching the board
