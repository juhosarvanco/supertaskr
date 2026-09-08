# 06 — Seats

A seat is one session holding one role for one card, then ending. Five
roles, each with a contract in method/roles/. The contracts share a
shape: a numbered list of steps, a run-hygiene section, the report the
seat owes, and the reasons, attributed to the incidents that wrote
them. This chapter is the mechanism of each; the files hold the
evidence.

## The planner

Runs project genesis: one interview, banked to disk as it happens,
ending in a decomposed, dispatchable milestone 1 (chapter 12). Driven by
a human in a terminal or by a program headless; the contract is
identical. It scaffolds first (stage 0), asks one question at a time and
challenges weak answers with the literal prefix "pushing back:", banks
each confirmed answer into the artifacts its stage names, runs
decomposition, runs the cold-start test, commits, and applies the
succession rule before ending. A skipped answer is banked as the
planner's best assumption marked `[?]`, never a hole. It never
overwrites real content it did not scaffold; adopting an existing
project is archaeology's job, parked.

## The orchestrator (the architect)

Coordinates and never touches code; holds no unique state; disposable
at any moment. Reads the standing set plus ROADMAP (because it chooses
the work) and docs/tasks/ whole (because the board is its input). Its
duties: triage at the stamp; mini-interview a human's new feature;
decompose a milestone lacking cards; pick the dispatch order (highest
priority, unblocked, fence disjoint from every building card, ceiling
of three to five concurrent lanes); propose an L dispatch to the human
and never dispatch one without approval; stamp, cut, arm, bench and
brief (chapter 05); read verdicts and open a room on a second
rejection; keep ROADMAP current; open a room when reality contradicts
NORTH_STAR rather than resolving it alone; apply the succession rule
before ending. As a standing seat it compacts between dispatches and
runs noisy jobs in a subagent that returns only its answer.

In this repository the architect seat also integrates, so the
orchestrator and integrator contracts are held by one session; the
seat lock (chapter 05) makes that one holder explicit.

## The executor

Builds exactly one card, then ends. Reads the card in full plus STATE,
ARCHITECTURE and CONVENTIONS; does not read ROADMAP, deliberately,
because which card deserved building was settled before dispatch; adds
the ceremony table because it must know whether it is its own
integrator. Confirms understanding in one paragraph first, and stops on
a contradiction. Works only in its lane; never touches the integration
branch. On ambiguity the docs do not resolve it opens a consultation
room and waits; on an out-of-fence need it parks that edit, keeps
building, and routes if no grant arrives. Implements to the criteria,
runs the commands until green, appends implementation notes, files
discoveries as suggestions, stamps `verifying` in its own lane (or
`done` only where its ceremony row gives it no verifier), commits with
explicit paths and the card id, reports, stops.

**The report** (method/roles/executor.md): status and place (the stamp,
the branch, the tip); each criterion met and how or NOT built and
routed; every command with its exit code read unpiped, in order; every
standing gate fired or not-owed, derived from the diff with the path
count, and derived against the tree the tip will have because the last
commit is the notes; every figure with its ref; every drill, one side
mutated, with the sha256 restoration proof and the positive control
shown failing; where the brief was wrong.

## The verifier

Adversarial by design. Receives only the card at its base ref and the
diff, never the executor's reasoning; does not read ROADMAP. Chapter 07
holds the two-spawn construction and the drill rules. Its steps: the
standing set with STATE first (the named intermittents live there);
the full suites; every criterion attacked literally, then malformed
inputs, boundaries, concurrency, the implied unhappy paths; the drill
judged by kill-set containment; the security sweep (injection points,
authorisation on new paths, secrets in the diff, unsafe defaults,
dependency additions), whose findings are REJECTED-level; the diff
against ARCHITECTURE's interfaces and CONVENTIONS' gotchas; the verdict
appended, dated and stamped; improvement ideas filed as suggestions,
never folded into the verdict; and step 7, re-running whatever gate its
own commits could move, because a verdict and a filed finding are
commits that create a tip nobody has tested.

## The integrator

Merges one approved task and leaves the docs true. Reads the standing
set plus ROADMAP (because it ticks it) and lane-protocol.md (because it
finishes what a worktree started), and reads the card and the verdict.
Chapter 08 holds the merge, the battery, the checkpoint and the rules
for the checkout it merges into. Two rules of its own worth naming
here: **repair what the merge introduces, file what the merge merely
reveals** (the test is the parent: was it true one commit ago?), and
**ask who may write the fix before asking when it became false**: a
behavioural defect the merge introduces is refused and filed, never
patched at this seat, because writing code is a lane write and this
seat holds no fence and no verifier.

## Shared obligations

- **The succession rule.** Anything decided, noticed or intended that
  is not yet in a file goes into one before the seat ends. If it exists
  only in the conversation, it does not exist.
- **Run hygiene.** Set the model and the effort dial at session start
  and never switch mid-arc; the cache is the economics. Run noisy jobs
  in a subagent that returns only its answer. Carry quiet flags where
  the count survives them, and read the count as well as the exit: an
  exit 0 over zero bodies is not a pass. This section is the authority
  over any advisory seat line the tooling prints, and both yield to
  every human word.
- **Seat spellings.** `model@session-kind`: `claude-opus-5@subagent`,
  `codex@fresh`, `codex@S3`. What was meant is `builder:`; what ran is
  `built_by:`.
- **Stops are deliverables.** A recorded refusal quoting the criterion
  that cannot be met is finished work.

## Ceremony by size

| size | pipeline |
|---|---|
| S, diff outside shipped code | executor + tests; the executor is its own integrator while it holds the integration checkout, and hands the merge to the holder when it does not |
| S, touching shipped code | executor → verifier, then the executor integrates its own work once the verdict is in and while it holds the checkout |
| M | executor → verifier → integrator |
| L | planning pass or room → executor → verifier → integrator; the human approves the dispatch |

The boundary between the two S rows is read off `touches:`: docs,
method and tooling self-integrate; anything a user could run does not.
A card that cannot be placed is an M. The default path must feel
lighter than not using the system.

## Ceremony by blast radius (advisory, ADR-018)

A second axis, direct dependents of what the card touches, derived from
the committed graph (`arch blast <path|slug>`):

| rung | direct dependents | the pipeline it would buy |
|---|---|---|
| 0 | none | executor + tests, self-integrated |
| 1 | 1 to 7 | executor → verifier, self-integrated |
| 2 | 8 or more | executor → verifier → integrator |

`size: L` keeps exactly one rung of its own: a planning pass first,
whatever the dependents. Three coverage classes: known non-code takes
the rule of thumb, genuinely unmeasured takes the higher ceremony, and
measured takes the rungs. A build-target root is never rung 0. Until
the flip condition measures true (the middle rung non-empty over the
live board with every root marked in the derivation's output), the size
table governs every dispatch and the rung is printed on the brief and
recorded on the card as a datum.

## Parallelism

Tasks with overlapping fences never run concurrently. The ceiling is
three to five concurrent lanes, and method/tasks/TASK-FORMAT.md is that
value's home: past it, verification rather than generation becomes the
bottleneck. When in doubt, run turn-based; parallel is an optimisation.
