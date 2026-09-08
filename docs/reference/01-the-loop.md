# 01 — The Loop

The development cycle, stage by stage. Each stage names who acts, what
machinery enforces the step, and the failure the step exists to
prevent. The stages are numbered the way the checkpoint records and the
role files refer to them; the cycle closes on itself because every
stage's findings enter stage 1 as suggestion cards.

## The invariants that cut across every stage

1. **Derive, never quote.** A figure or a state is read from its
   authority at your own commit, or carries the command and the ref
   that produced it. A number without provenance is not a fact
   (method/docs-protocol.md law 2; the brief assembler refuses to emit
   an unstamped figure, tools/e2e/scripts/dispatch-brief.mjs).
2. **One card, one lane, one seat-arc.** A session builds one card and
   ends. No session accumulates unrecorded context the project depends
   on (method/roles/executor.md; method/README.md, the succession
   guarantee).
3. **Fences are computed, then enforced by machinery.** Parallelism is
   granted by provable disjointness of expanded write-sets, and a hook
   blocks writes outside them (chapter 04).
4. **A guard must be shown to fire.** Every protective test is proven
   by mutation: break the producer, watch the test red, restore with a
   byte-level proof. A test that cannot fail counts as zero (chapter
   07, the poison drill).
5. **Stops are deliverables.** A seat that meets a contradiction
   records it and stops. A workaround is a defect; an honest stop is
   paid work (method/roles/executor.md steps 1 and 3).
6. **Records are append-only; living docs are budgeted.** History
   accumulates in per-integration records; the documents every session
   reads are regenerated under byte budgets a gate enforces (chapter
   09).
7. **Exit codes are a contract.** 0 checked and clean, 1 checked and
   found something, 2 called wrong, 3 could not check. Exits are read
   unpiped, and 3 is never reported as clean (chapter 10).
8. **Honest omission.** Every tool states what it cannot check. Silent
   partial coverage reads as full coverage, which is the worst defect a
   gate can have (every gate header in tools/e2e/scripts/ and
   .claude/hooks/ carries a limits section).
9. **Ceremony scales with blast radius.** A docs-only diff can skip a
   seat with the reason recorded; shipped code and guards get the full
   pipeline (method/tasks/TASK-FORMAT.md, ceremony by size).
10. **The cold-start test.** A fresh session with no memory must be
    able to resume from the files alone. Sessions genuinely end, so
    this is tested by design (method/README.md).

## Stage 0 — Genesis: a project enters the method

Actor: the planner seat with the human, once per project. Chapter 12
holds the detail.

- The method ships as a versioned kit (method/); a project copies it in
  and a test pins the version stamp, so a method upgrade is a visible
  diff.
- A seven-question interview banks NORTH_STAR, the stack decision, the
  roadmap backbone and the first cards, artifact by artifact as each
  answer is confirmed, never in one pass at the end.
- A decomposition pass turns milestone 1 into dispatchable cards; open
  questions become rooms, not silent assumptions.
- The root adapter file (CLAUDE.md and AGENTS.md, kept byte-identical)
  names the read-first set every session loads: STATE, ROADMAP,
  ARCHITECTURE, CONVENTIONS, CAPABILITIES, NORTH_STAR.
- The governing documents run on the three-tier contract of ADR-019:
  rules, truths, records. CAPABILITIES is generated from the e2e test
  names and a currency gate reds when it drifts.

Prevents: a session's ignorance being a process defect nobody can see.
What a session must know is itself a versioned artifact.

## Stage 1 — A card is born

Actor: anyone. Chapter 02 holds the detail.

- All work enters as a card: one file in docs/tasks/, id `T-NNN`, or
  `T-NNN-sN` for a finding filed from a lane.
- Three legal sources: a planning pass, a lane's finding (status
  `suggested`), a direct human request. Nothing else mints work.
- The frontmatter is the machine-read contract; the body is the why
  with dated evidence, then acceptance criteria in EARS form, then the
  sections the pipeline appends to.
- A suggestion must stand alone: whoever triages it later has no access
  to the session that wrote it. Nothing at `suggested` is built
  directly.

Prevents: a mid-task idea quietly becoming mid-task scope. No seat can
build what it filed.

## Stage 2 — Triage: the suggestion queue is metabolised

Actor: the architect seat.

- Before ruling, re-derive the card's claims at the current commit: run
  its stated derivations, check the files it names, test its blocking
  reasons against live statuses.
- Exactly one of three moves: promote (absorb into the card that owns
  the seat, with a dated `Absorbs:` line, or mint a new `planned`
  card), park (a dated reason plus a resurfacing condition), reject
  (move to docs/tasks/rejected/ with the reasoning; work that landed by
  another route is marked discharged, not declined).
- Priority is a unique integer per feature and milestone column,
  collision-checked across live statuses. New ids are derived from the
  maximum over the whole tree including rejected/.
- Triage happens at the stamp, while the context is hot: a done card's
  suggestion train is disposed of within one dispatch cycle
  (method/roles/orchestrator.md step 2). The triage bands in chapter 11
  watch the queue's age and volume.

Prevents: an illegible backlog. Absorption collapses a class into one
card; the disposition hint carries the filer's world to the triage seat.

## Stage 3 — Planning and rulings

Actor: the architect with the human.

- The queue is derived, never maintained: priorities live on the cards,
  and "what is startable now" is one command
  (`brief.mjs --dispatch --full`).
- A question that measurement cannot settle becomes a room in
  docs/rooms/, with @-routing to whoever must rule. A settled question
  becomes a numbered decision record in docs/decisions/.
- Named calls are the human's alone: L-sized dispatches, budget values,
  scope changes, anything a decision record marks so.
- A review from outside the pipeline arrives as claims; each claim is
  re-derived before it is folded, and a refuted claim is recorded as
  refuted (method/roles/orchestrator.md, folding in a review; the MF-06
  eval keeps the corpus of settled claims).

Prevents: a coordinator's enthusiasm standing in for the permission
system's consent.

## Stage 4 — Dispatch: a card gets a lane

Actor: the architect as dispatcher. Chapter 05 holds the detail.

- The dispatch view proves the card startable: legal status, every
  blocker satisfied against live statuses, fence disjoint from every
  live lane through the slug map.
- The card preflight re-derives every derivable claim the card makes
  and refuses the dispatch when one no longer holds; the dispatcher
  audits the card's non-derivable assertions by hand.
- The stamp `status: building` is committed on the integration branch
  before the lane is cut, so the lane inherits it and never writes that
  line.
- The lane is a sibling worktree on `task/T-NNN-<slug>`, cut from a
  green base stated as a hash, never from a merge commit.
- The fence manifest is written into the lane and read back; the
  verifier's bench is cut at the same moment; the brief is assembled by
  the program from the sources each row names.
- Since T-239 all eight steps are one arm:
  `brief.mjs --dispatch-lane T-NNN --slug <slug>`.

Prevents: a brief typed from memory giving a stale belief the authority
of an instruction, and two lanes editing one file.

## Stage 5 — Build: the executor's arc

Actor: the executor seat, one card, then it ends. Chapter 06.

- Read the role contract, then the read-first set minus the role's
  subtractions (an executor does not read ROADMAP). Read the card in
  full and confirm understanding in one paragraph before touching
  anything; on contradiction, stop and record it.
- Build exactly the one card inside the fence. Reading anywhere is
  free; writing is fenced by the hook at every write.
- Every protective change passes the poison drill in a detached scratch
  worktree: mutate the producer, never the assertion, watch the test
  red, restore with a sha256 proof.
- The suites owed are derived by the docs gate from the diff, not
  chosen. The diff range is the lane's own pair, never a two-dot diff
  against the moving integration branch (tools/e2e/scripts/range-rule.mjs).
- Out-of-fence or out-of-scope discoveries are filed as suggestions or
  recorded as a written refusal quoting the criterion. Never a
  workaround, never a self-widened fence.
- Append implementation notes, stamp `verifying` in the lane, commit
  with explicit paths, report in the contract's shape, end.

Prevents: context death losing anything load-bearing. Everything the
project depends on is in a file before the seat ends.

## Stage 6 — Verification: an independent attack

Actor: the verifier, two spawns. Chapter 07.

- Phase 1 is its own spawn with no file, git or shell tools. It
  receives the card at its base ref, the verifier contract and named
  base-ref sections pasted inline, and returns the attack set and the
  ground truths it wants measured. The dispatcher saves and hashes the
  return, takes the measurements at the base ref, and hashes those.
- Phase 2 is a second spawn on the bench with the digests. It re-runs
  every owed suite itself, drills its own mutants including at least
  one the executor did not run, classifies every red against the fence
  before attributing it, runs the security sweep, and appends a
  dated, provenance-stamped verdict citing the digests.
- Verdicts: APPROVED, APPROVED WITH ASSIGNED CORRECTIONS (each named;
  the integrator performs them), REJECTED with the falsifying evidence.
  A verdict citing a digest that does not match the saved file is
  refused (the MF-09 eval demonstrates the refusal).

Prevents: a verifier inheriting the builder's blind spots. Blindness is
a property of the spawn, not a discipline a seat keeps.

## Stage 7 — Integration: the merge

Actor: the integrator (in practice the architect seat). Chapter 08.

- Forecast the merge with `git merge-tree --write-tree`, then merge
  `--no-ff`, then compare the tree you got against the forecast.
- Perform the verdict's assigned corrections at this seat, to lane
  standards.
- Run the full battery on merged main through the blessed runner
  (`gate-run.mjs parser|app|rust|e2e`), which mints the token the push
  guard reads.
- Regenerate what the merge staled, in order: the architecture graph if
  an indexed source moved, the census if a spec name moved.
- Stamp the card `done` with both hands recorded, then read the
  committed blob back.

Prevents: two green lanes breaking together, and a stamp that sat
unstaged while the commit carried the old line.

## Stage 8 — Checkpoint: the record is written

Actor: the integrator. Chapter 09.

- Write the checkpoint record first, to docs/checkpoints/, on the
  committed template: parents and ranges, the verdict and corrections,
  every gate's answer, every suite's count and exit, environment facts,
  what the brief got wrong, dispositions, and the five metric lines.
- Regenerate STATE from docs/STATE-template.md: the merge's story goes
  to the record; STATE keeps the live mechanism under its byte budget.
- ROADMAP gains at most one sentence per feature per merge.
- A gate reds if a record is committed newer than STATE
  (staleStateRecords in tools/e2e/scripts/docs-scan.mjs).
- Ask the graph checker last, after the record's final write.
- Remove the lane's worktree; keep the branch as history.

Prevents: the one step a tired integrator skips. The skip cannot be
committed silently.

## Stage 9 — CI: a second machine checks everything

Actor: GitHub Actions and the integrator.

- Pushing main runs the whole battery from a bare checkout on
  ubuntu-24.04: installs, builds, every suite, every gate, boot under a
  virtual display. The workflow is pinned to CONVENTIONS' own command
  bullets by the workflow-parity spec, so a command changed in one
  place and not the other reds.
- The push guard reads CI before allowing a push, and refuses a push
  whose four-suite token is not green against the tree being pushed.
- A platform-only red becomes a card citing the run id and the failing
  bodies; never a panic patch on main.

Prevents: local green being read as a fact about the software. Several
real defects have only ever reproduced on the second machine.

## Stage 10 — The method watches itself

Actor: standing machinery and triage. Chapter 11.

- Health bands: fourteen declared control bands as data, each with an
  authority, a drift line and a breach line, reported by
  `npm run health` from tools/e2e/ and stamped in every checkpoint.
- Method evals: a canned task set for the process itself in
  tools/method-evals/, from brief assembly at a fixture ref to a
  verifier rejecting a planted defect.
- Seat economics: every record stamps tokens per seat, gate runtimes,
  rework cycles.
- Everything measured accumulates in the records and becomes the
  evidence for the next process change, which itself lands as a card
  through this same loop.

Prevents: a method that only accretes. Every machine ships with the
condition under which it retires (method/docs-protocol.md law 8).
