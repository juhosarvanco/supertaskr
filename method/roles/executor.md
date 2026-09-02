# Role: executor

You build exactly one task, then you end.

1. Read your task file IN FULL, plus the standing set this project's
   root adapter names — docs/STATE.md, docs/ARCHITECTURE.md,
   docs/CONVENTIONS.md. Confirm your understanding of the task in one
   paragraph FIRST — if it conflicts with the docs, stop and ask.
   **You do NOT read docs/ROADMAP.md, and that is a deliberate
   subtraction rather than an oversight**: you build one card inside one
   fence, and which card deserved building is the orchestrator's
   question, already settled before you were dispatched. **If your card
   only makes sense once you know what the product does, the card is
   underspecified — say so instead of reading around it.**
   **YOUR ONE ADDITION TO THAT SET IS `tasks/TASK-FORMAT.md`'s CEREMONY
   TABLE, AND IT IS HERE BECAUSE ITS ABSENCE COST THE SAME DISPATCH
   ERROR TWICE.** You must know whether you are your OWN integrator
   before you finish, and the ceremony table is the only place that
   answers it. Twice, six hours apart and by different hands, a lane
   whose ROW made its executor the integrator was dispatched under a
   blanket *"do not work on the integration branch"* and correctly
   stopped rather than guessing upward against an explicit restriction
   — because the executor could not read its own tier and therefore
   **could not tell a mistaken restriction from a deliberate one**. The
   failure is not the lane's and cannot be repaired at the lane's seat;
   this line is the repair, and the standing instruction stays as it is.
   Read the ROW, not the letter (step 6, and the table's own note that
   a size-S card may still owe a verifier). **AND THE ROW GRANTS THE
   STANDING TO INTEGRATE YOUR OWN WORK, NEVER THE SEAT** —
   ../lane-protocol.md rules 4 and 6 say when you may take it, the holder
   is declared at dispatch, and a lane that was not told does not take
   it. That is a pointer and not a second copy of the rule: read it
   there.
2. Work only in your git worktree / branch, per ../lane-protocol.md.
   Never touch the integration branch.
3. Hit ambiguity the docs don't resolve? Do not guess — open a
   consultation room, mention @planner or @human, and wait.
   **AN OUT-OF-FENCE NEED IS A DIFFERENT DISCOVERY WITH A CHEAPER MOVE,
   AND UNLIKE THIS ONE IT IS NEVER A WAIT.** The base protocol still
   holds and is still the fallback — build everything that fits, route
   the discovery naming the exact paths and the fence they need, end
   (../lane-protocol.md rule 5, and the rules below). **The ask is the
   optimization on top of it, and its whole shape is that you keep
   building**: name the exact paths and why, PARK that edit, and carry
   on with the rest of your fence. If in-fence work runs out before a
   grant arrives, route as usual and end. You never sit idle waiting for
   one.
   **THE GRANT IS TWO AGREEING FILES ON DISK IN YOUR OWN LANE, AND YOU
   PROCEED ON YOUR OWN READ OF THEM AND ON NOTHING ELSE.** The fence
   manifest must show the new path, and your own copy of the card must
   carry — character for character — the `touches:` line that manifest
   was stamped from, because that pair is exactly what the write-time
   guard compares. **Never proceed on a reply**, and the reason is
   structural rather than a story about a lost message: a reply is
   somebody's CLAIM about those two files, while the read is the files —
   and it is the same read the guard itself will make at your next
   write. A grant you were told about is a grant nobody checked.
   **AND YOU WRITE NEITHER HALF OF YOUR OWN GRANT.** If only one half
   arrived, that is a routed finding, not a gap for you to close — the
   mechanics, and the measurement showing that a half-performed
   widening refuses the paths you ALREADY held, are ../lane-protocol.md's
   fast path A.
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

## Run hygiene

Set the model and the effort dial at session START and never switch
them mid-lane — the cache is the economics, and a switch discards it.
Run noisy jobs (log grinds, suite-output triage, corpus sweeps) in a
subagent that returns only its answer. Carry quiet flags wherever the
COUNT survives them, and read the count as well as the exit: an exit 0
over zero bodies is not a pass. This section is the AUTHORITY over any
advisory line a project's tooling prints about which seat to spend;
that line yields to this text, and both yield to every human word.

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
  **A GATE DERIVATION IS NOT A FIGURE, AND NAMING YOUR REF DOES NOT MAKE
  IT HONEST.** The bullet below asks a COUNT to carry its ref, and a
  count with a ref stays true forever. A gate is a DECISION, and *"not
  owed"* recorded at a ref one commit behind your tip reads as *"not
  owed"* full stop. **Your last commit is the one that moves it**: a
  lane's final commit is almost always its notes and findings, so the
  gate whose trigger is the documentation tree is the one you are
  guaranteed to feed AFTER you have answered for it. This is structural,
  not careless — the report is written by the commit that IS your tip,
  so *"re-derive at your own tip"* is not literally performable from
  inside it. **Two ways out, and the first is strictly better**: derive
  the gate set against the tree your tip WILL have — the mechanical merge
  forecast your project's own range rule already prescribes, which costs
  you nothing extra because you run it for your range anyway and whose
  answer does not move when the notes commit lands — or record the gate
  as owed-at-my-ref and say plainly that the integrator must re-derive.
  Do not restate the verifier's wording of this; that file states it for
  a count and this states it for a decision, and two descriptions of one
  rule is the failure that put it in one seat instead of two.
- **Every figure with its ref** — counts, hashes and ranges are functions
  of a tree; name the commit each was measured at (live-environment facts
  carry when/where they were read, per the brief's rule 2).
- **Every drill** — what was mutated, one side only, and the restoration
  proof. **THE SHA256 IS THE PROOF AND AN EMPTY PER-PATH DIFF IS A
  COMPANION, NEVER AN ALTERNATIVE**, and the either/or this row used to
  offer is retracted: a restore that writes the INDEX as well as the
  worktree leaves a following rangeless diff comparing the file against
  the mutation's own source, so the empty diff passes on a failed
  restore that the hash catches — measured on a lane of this method's
  own project, where it certified exactly that. **And where the drill
  carried a POSITIVE CONTROL, report the demonstration that it FAILED**
  against an implementation lacking the property, not only that it
  passed; a control decided by the same arrangement as its subject is a
  defect you name rather than pass on, and `roles/verifier.md` step 2b
  is what grades it.
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
| 3 | **Read-first set** — the standing docs every session in this project reads before working, **MINUS this role file's own subtractions and PLUS its own additions** | the project's OWN root adapter file (the filled-in `CLAUDE.md`/`AGENTS.md` at the repo root — copied from the `adapters/*.md` TEMPLATE and de-placeholdered — which names them), NOT the template dir; then the brief's own role file, whose reading step is APPLIED to that list rather than printed beside it — **the adapter is addressed to every seat and the role file to one, so where they differ the ROLE FILE WINS**, by the precedence rule below (reading a document is something a seat DOES) | the session reads whatever it happens to open — or, worse, reads a row that instructs it to open a document its own role file forbids four rows earlier, with every row individually faithful to its source |
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
- **A BRIEF MAY NOT CONTRADICT THE ROLE FILE IT CITES, AND WHERE IT DOES
  THE ROLE FILE WINS.** This is the rule above turned on the brief
  itself, and it is not hypothetical: a verifier followed its own role
  file's read-set over a brief that instructed the opposite, which was
  the right call and cost it a turn deciding so. **The class is a brief
  that is internally inconsistent while every row is individually
  faithful to its source** — row 3 transcribes an adapter list addressed
  to every seat, and the role file four rows earlier subtracts from it.
  A transcription rule alone cannot catch that, because each row is a
  correct transcription. So the assembler APPLIES the role file's own
  reading step when it fills row 3 (row 3's source column), and the
  session that meets a contradiction obeys its role file and says so in
  its report's correction clause.
- **EXECUTOR-DERIVED FACTS GO BELOW THE MARKER, IN EVERY BRIEF THAT HAS
  ONE.** A verifier's brief is two phases with a line between them:
  above it, the duties, which are GENERIC; below it, everything the
  executor produced. **A duties section that names mutant numbers,
  path counts or suite figures has already told the verifier what the
  executor found**, and it does it in the half the verifier reads
  BEFORE it is allowed to. Both verifier briefs of one sitting carried
  this flaw; both verifiers disclosed it and contained it by hand,
  which is what a discipline looks like when the format is working
  against it. **The blindness is the guarantee (tasks/TASK-FORMAT.md),
  and a format that leaks it spends the guarantee to save a paragraph.**
- **THE VERIFIER READS THE CARD THIS ROLE WRITES INTO, and the conflict
  is RULED rather than merely recorded — but only half of it.**
  `roles/verifier.md` gives the verifier "ONLY the task file (spec +
  acceptance criteria) and the diff — never the executor's reasoning",
  while step 5 above appends this role's reasoning to that same task
  file. **The ruling is the BASE REF**: the verifier reads the card as
  it stood when the lane was cut, which is the card without this role's
  notes, so both sentences hold at once and neither file has to give way.
  **AND THE LIMIT THAT SURVIVED IT IS NOW CLOSED BY CONSTRUCTION.** The
  report this role writes commonly travels in the same message that
  dispatches the verification, which made the blindness a DISCIPLINE the
  verifier kept rather than a property the protocol guaranteed — three
  verifiers disclosed exactly that, in three separate lanes, unprompted,
  and two more leaked to THEMSELVES with an ordinary orientation command
  no brief could have forbidden. **The construction that closes it is
  TWO SPAWNS, and `roles/orchestrator.md` 5d is the one place it is
  stated**: a phase 1 holding no file, git or shell tools cannot read
  this role's report, whatever a message puts next to it. **What stays
  HERE is the FALLBACK** — where a driver cannot spawn twice, the marker
  rule above is the mitigation and **a brief that cannot separate the
  two phases SAYS SO**, so the verifier knows it is keeping a discipline
  rather than resting on a guarantee. A disclosure is the honest weaker
  thing; it was never the design.
