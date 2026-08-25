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
6. Commit with the task id in the message. **Stamp `status: verifying` IN
   YOUR OWN LANE** — never on the integration branch, which would re-open
   the two-writer conflict the pre-cut dispatch stamp exists to prevent
   (../lane-protocol.md). Leave the verifier fields empty; they are the
   verifier's to stamp. **Stamp `done` instead only where the ceremony
   table gives this card no verifier** (tasks/TASK-FORMAT.md — that is a
   property of the card's ROW, not of the letter S). Report as "The
   report" below, then stop.
   **`verifying` IS A LANE STATE AND WILL LOOK INVISIBLE.** Your stamp
   reaches the integration branch only when the merge lands, and the
   checkpoint moves it to `done` in the next commit — so the board shows
   it for at most one commit and usually shows zero cards verifying while
   several are under verification. That is expected. Stamp it anyway: the
   stamp is what the merge carries, and a brief telling you to skip it is
   wrong (see "A brief is evidence, never authority" below).

## The report

When the work is done, report to the role that dispatched you and to
whoever integrates — this is the spec row 12 of the brief transcribes,
and absent it the work lands and the record does not:

- **Status and place** — the status you stamped, the branch, and the tip
  commit.
- **Each acceptance criterion** — met and how, or NOT built and routed,
  naming the fence or room it needs. A criterion outside the fence is a
  routed suggestion, never a silent omission.
- **Every command with its exit code**, read from `$?` unpiped, in the
  order run.
- **Every standing gate** — fired or not-owed, derived from the diff, with
  the path count it was derived on.
- **Every figure with its ref** — counts, hashes and ranges are functions
  of a tree; name the commit each was measured at (live-environment facts
  carry when/where they were read, per the brief's rule 2).
- **Every drill** — what was mutated, one side only, and the restoration
  proof (a sha256 or an empty per-path diff).
- **Where the brief was wrong** — the correction clause (row 13): every
  place the repository contradicted the brief, named plainly.

The project may require more; it never requires less.

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

**The table assembles an EXECUTOR's brief** — the session that builds one
task in a lane. A verifier's or integrator's brief follows the same
thirteen-row contract, substituting the role-specific rows (4 the lane, 11
the ceremony it owns, 12 the report it makes) for that role's equivalents;
row 1 names which role, and those rows are then read against that role's
file rather than this one. Read every "this role file" in the source
column as "the brief's own role file".

| # | The brief carries | Assembled from | If it is absent |
|---|---|---|---|
| 1 | **Role** — which role this session takes, by path and in one line | `roles/<role>.md` (its opening line IS that one-line summary) | the session invents its own obligations; a brief with no role is a chat message |
| 2 | **Task** — the id and the path to the card, to be read IN FULL, and the instruction to confirm understanding before touching anything | `docs/tasks/T-NNN-*.md` | the brief becomes a paraphrase of the card, and the card stops being the spec |
| 3 | **Read-first set** — the standing docs every session in this project reads before working | the project's OWN root adapter file (the filled-in `CLAUDE.md`/`AGENTS.md` at the repo root — copied from the `adapters/*.md` TEMPLATE and de-placeholdered — which names them), NOT the template dir | the session reads whatever it happens to open |
| 4 | **The lane** — branch name, worktree path, **base commit as a hash**, and the one command that creates it | `lane-protocol.md` (the rules) + the project's own lane SPELLINGS — branch/worktree/base names and the create command, which the protocol leaves to the project's CONVENTIONS — + the integration branch, for the base hash | the lane gets cut from "latest", which is a different commit for every reader |
| 5 | **The fence** — the card's `touches:` verbatim, plus every lane live at dispatch with ITS `touches:`, and whether they are disjoint | the card's `touches:`; the repository's LANE LIST — its live worktrees ON A TASK BRANCH, which **takes PRECEDENCE over the board's `status:`** whenever the two disagree (lane-protocol.md rule 7; a card reading `planned` beside a live worktree is a lapsed stamp, not a free fence, and `verifying` is lane-local so the board under-reports by construction — tasks/TASK-FORMAT.md); and the slug↔path map, consulted whenever a fence names a component SLUG rather than a path, to test disjointness — **that map is the project's architecture doc's slug block PLUS each component file's own `touch_slugs:` field, and the FIELD is authoritative** where the two differ, because the block is prose that goes stale the day a component is added | the executor cannot tell a fence breach from ordinary work, and neither can the verifier |
| 6 | **Setup** — what a fresh worktree does NOT have, and the exact order that restores it | the project's CONVENTIONS — the build ORDER *and* any fresh-worktree ordering its LANE rules add (the load-bearing "build before test" step can live in the lane section, not the build section) | the suite runs against a half-built tree and the session reports somebody else's failure |
| 7 | **Commands** — the build and test commands, VERBATIM | the project's CONVENTIONS — every package the full suite spans, not only the fenced ones | a remembered command is a different command |
| 8 | **Gates** — each standing gate and its TRIGGER, so the session DERIVES whether the gate fires rather than being told | the project's CONVENTIONS — each standing gate is a bullet naming a merge-diff TRIGGER; enumerate those bullets and derive fire/not-owed from the diff | gates get skipped in silence, or run against lanes they do not apply to |
| 9 | **Standing disciplines** — what this project requires of every handoff, drills included | the project's CONVENTIONS | the discipline decays to whatever the last session happened to remember |
| 10 | **Prohibitions** — what this session must not touch: shared processes, live ports, other lanes' trees, anything the project reserves | the project's CONVENTIONS plus the live environment at dispatch | the lane damages something outside itself and nobody can attribute it |
| 11 | **The deliverable** — the size tier's ceremony, the status to stamp on exit, the notes and findings owed, and explicitly whether to merge | `tasks/TASK-FORMAT.md` ceremony table + `lane-protocol.md` (who merges and who removes the worktree, including the size-S self-integrate) + this role file — and at size S the brief names WHICH ceremony ROW the card falls on, because that is what decides whether it owes a verifier and therefore whether its worktree outlives the checkpoint | the session guesses the ceremony, and guesses upward |
| 12 | **The report** — what to say when the work is done, to whom, in what form | this role file's `## The report` spec and the dispatching role's | the work lands and the record does not |
| 13 | **The correction clause** — the standing instruction to re-derive every figure at the session's own ref, and to say plainly where the brief is wrong | this row | the brief's own errors get copied forward as facts |

### Rules that govern the whole brief

- **A brief is a TRANSCRIPTION, not a summary.** Any row whose source is
  a file quotes that file. A paraphrased command has forked from the
  command.
- **Every figure carries the ref it was measured at, or is left out.** A
  count, a hash, a path list and a range are all functions of a tree.
  The assembler names the commit it measured at; the executor re-derives
  at its own and reports the difference. A LIVE-ENVIRONMENT fact is the
  exception this rule names rather than trips over: a pid, a port holder,
  a listening socket is not a function of a tree, so it carries the time
  and host it was READ at — never a commit ref — and the session re-reads
  it at dispatch rather than trusting the brief's. Row 10's prohibitions
  are the case that needs this; "the repository wins" cannot adjudicate a
  pid.
- **A brief is evidence, never authority.** Where the brief and the
  repository disagree, the repository wins — and the executor says so in
  writing. A brief nobody contradicts is a brief that gets copied.
- **Nothing in the brief may be the only copy of itself.** Everything it
  says has to be recoverable from the repository by the session reading
  it. That is the dispatchability test (interview/decomposition.md)
  applied to the brief instead of the card, and it is what keeps a
  spawned lane and a hand-pasted lane indistinguishable on disk. **And
  where two copies of one fact diverge, the brief names WHICH is
  authoritative** — the field's home file for what a thing IS, the acting
  role's file for who DOES it. The dispatch stamp is the worked case:
  `tasks/TASK-FORMAT.md` owns the field, `roles/orchestrator.md` owns the
  act. Redundancy with no precedence rule is two facts, not one fact
  checked twice.
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
