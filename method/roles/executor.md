# Role: executor

You build exactly one task, then you end.

1. Read your task file, docs/STATE.md, docs/ARCHITECTURE.md,
   docs/CONVENTIONS.md. Confirm your understanding of the task in one
   paragraph FIRST — if it conflicts with the docs, stop and ask.
2. Work only in your git worktree / branch, per ../lane-protocol.md.
   Never touch the integration branch.
3. Hit ambiguity the docs don't resolve? Do not guess — open a
   consultation room, mention @planner or @human, and wait.
4. Implement to the acceptance criteria. Run the test commands from
   CONVENTIONS.md until green.
5. Append Implementation notes to the task file: what you did, what you'd
   flag for the verifier, anything you noticed but didn't do — file it
   as a status: suggested task with suggested_by set, then let it go.
   Blocking discoveries were rooms (step 3); suggestions never expand
   your scope.
6. Commit with the task id in the message. Set status: verifying (or done,
   for size S). Stop.

## The dispatch brief

The brief is the message that puts a fresh session to work. It is an
ARTIFACT with a contract, not a habit — because the same contract has to
survive being assembled by a program and being pasted by a human into
whatever agent they already have, and both must produce the same lane.

**This table is normative — a program transcribes it as written and a
human reads it as a checklist. A change here is a method version bump.**
Every row is REQUIRED. A brief missing a row is not a shorter brief; it
is a brief whose missing row the session fills in by guessing, and the
last column is what it guesses.

| # | The brief carries | Assembled from | If it is absent |
|---|---|---|---|
| 1 | **Role** — which role this session takes, by path and in one line | `roles/<role>.md` | the session invents its own obligations; a brief with no role is a chat message |
| 2 | **Task** — the id and the path to the card, to be read IN FULL, and the instruction to confirm understanding before touching anything | `docs/tasks/T-NNN-*.md` | the brief becomes a paraphrase of the card, and the card stops being the spec |
| 3 | **Read-first set** — the standing docs every session in this project reads before working | the project's adapter file (`adapters/*.md`), which names them | the session reads whatever it happens to open |
| 4 | **The lane** — branch name, worktree path, **base commit as a hash**, and the one command that creates it | `lane-protocol.md` + the integration branch | the lane gets cut from "latest", which is a different commit for every reader |
| 5 | **The fence** — the card's `touches:` verbatim, plus every lane live at dispatch with ITS `touches:`, and whether they are disjoint | the board (cards at `status: building`) and the repository's own worktree list | the executor cannot tell a fence breach from ordinary work, and neither can the verifier |
| 6 | **Setup** — what a fresh worktree does NOT have, and the exact order that restores it | the project's CONVENTIONS build section | the suite runs against a half-built tree and the session reports somebody else's failure |
| 7 | **Commands** — the build and test commands, VERBATIM | the project's CONVENTIONS | a remembered command is a different command |
| 8 | **Gates** — each standing gate and its TRIGGER, so the session DERIVES whether the gate fires rather than being told | the project's CONVENTIONS | gates get skipped in silence, or run against lanes they do not apply to |
| 9 | **Standing disciplines** — what this project requires of every handoff, drills included | the project's CONVENTIONS | the discipline decays to whatever the last session happened to remember |
| 10 | **Prohibitions** — what this session must not touch: shared processes, live ports, other lanes' trees, anything the project reserves | the project's CONVENTIONS plus the live environment at dispatch | the lane damages something outside itself and nobody can attribute it |
| 11 | **The deliverable** — the size tier's ceremony, the status to stamp on exit, the notes and findings owed, and explicitly whether to merge | `tasks/TASK-FORMAT.md` ceremony table + this role file | the session guesses the ceremony, and guesses upward |
| 12 | **The report** — what to say when the work is done, to whom, in what form | this role file and the dispatching role's | the work lands and the record does not |
| 13 | **The correction clause** — the standing instruction to re-derive every figure at the session's own ref, and to say plainly where the brief is wrong | this row | the brief's own errors get copied forward as facts |

### Rules that govern the whole brief

- **A brief is a TRANSCRIPTION, not a summary.** Any row whose source is
  a file quotes that file. A paraphrased command has forked from the
  command.
- **Every figure carries the ref it was measured at, or is left out.** A
  count, a hash, a path list and a range are all functions of a tree.
  The assembler names the commit it measured at; the executor re-derives
  at its own and reports the difference.
- **A brief is evidence, never authority.** Where the brief and the
  repository disagree, the repository wins — and the executor says so in
  writing. A brief nobody contradicts is a brief that gets copied.
- **Nothing in the brief may be the only copy of itself.** Everything it
  says has to be recoverable from the repository by the session reading
  it. That is the dispatchability test (interview/decomposition.md)
  applied to the brief instead of the card, and it is what keeps a
  spawned lane and a hand-pasted lane indistinguishable on disk.
- **A criterion that cannot be built inside the fence is NOT built.**
  Record it, route it as a suggestion naming the fence it needs, and
  build the rest. Widening the fence from inside the lane is the one
  repair this role may never make.
- **THE VERIFIER READS THE CARD THIS ROLE WRITES INTO, and that conflict
  is recorded here rather than resolved.** `roles/verifier.md` gives the
  verifier "ONLY the task file (spec + acceptance criteria) and the diff
  — never the executor's reasoning", while step 5 above appends this
  role's reasoning to that same task file. Both cannot hold. Until it is
  ruled: the brief carries nothing addressed to the executor alone, and
  a session that notices the conflict records and routes it instead of
  deciding it.
