# Features

What Supertaskr does today, by area. Plain sentences; the exact,
test-backed list is [docs/CAPABILITIES.md](../CAPABILITIES.md), and
which features are v1, v2 or later is [docs/VERSIONS.md](../VERSIONS.md).

## The interview

- Seven questions turn an idea into the five governing documents and a
  first board, in one sitting.
- Every answer is banked to disk as you give it; the board materialises
  beside the conversation as the files land.
- Skill packs your organisation already keeps — brand, security,
  compliance, UX — load into the interview and are stamped into the
  record.
- The interview runs in the mirror app's split view, and as a skill in
  your agent app **(v1, on the board)**; both write the same files.
- Customisation is more interview, not a settings screen: the interview
  asks whether your organisation has skill packs to load, banks the
  answer, and files one auditable card per pack **(v1, on the board)**.

## The board

- A story map rendered live from files: features, cards, statuses,
  blockers, with nothing typed by hand.
- Each card says what it touches and what must be true when it is done;
  the decisions the planner could not settle alone join it **(v1, on the
  board)**.
- The dispatch view says which cards can start now and, for every other
  card, why not — in reasons you can argue with.

## Dispatch

- One command performs the whole dispatch ritual in order and stops:
  stamp, cut, preflight, fence, bench, brief, port.
- The brief is a written contract assembled by a program from the card
  and the governing documents, so a seat never works from a paraphrase.
- The preflight re-derives every claim a card makes about the tree
  before a seat is paid for; a stale claim refuses the dispatch.
- Model assignment is binding: the card names the builder and the
  verifier, and a mismatch between what was assigned and what ran is
  flagged on the board.

## The fence

- Every card declares its paths. A hook refuses a write outside them at
  the moment of the write.
- Fences are proved disjoint per pair before two lanes run at once, so
  parallel lanes cannot collide.
- The fence also refuses reads of secret files — env files, private
  keys, credential directories — whatever the card names **(v1, in
  verification today)**.

## Verification

- The verifier writes its attack plan from the specification alone,
  before the build exists, in a session that cannot see the builder's
  work. The plan is sealed with a hash the verdict must cite.
- The verdict is binding. REJECTED stops the merge.
- The verifier is blind by construction: a different session, denied
  the builder's reasoning, judging the diff against a sealed attack plan.
- Before a merge lands, the exact merge object is built and gated as
  the merge it will be, not as the branch it came from.
- Every guard ships with its killed mutant: the defect it exists to
  catch is planted, seen to fail, and restored byte for byte with a hash
  proof. A test that never demonstrated it can fail is not a test.
- The verifier lists every side effect the diff added that no criterion
  asked for **(v1, on the board)**.

## The gates and the record

- The landing gate refuses a merge whose diff leaves the fence; a
  dependency that does not resolve on its registry **(v1, in
  verification today)** and a debt marker with no card **(v1, on the
  board)** are its next two limits.
- The docs gate names, for every change to the record, which suites are
  owed.
- The push guard reads CI before a push and refuses a push into a
  running run.
- Every merge lands with its checkpoint record; every figure carries the
  command that derived it; the governing documents have byte budgets.
- The state document is regenerated from a template at every checkpoint
  so a cold session can inherit the project.

## The architecture map

- The declared components are laid over the code's real graph: intent
  against reality, with drift as a first-class finding.
- Cycles, blast radius and churn are derived from the graph on demand.
- The graph itself has a measured byte budget and prints its headroom.

## Health

- Fourteen bands over the method's own metrics: gate latency, suite
  wall time, rejection rates, cold-start passes, drift incidents,
  documentation headroom, arrivals per triage window.
- A band with no keeper is reported as unkept, never trusted.
- A breach lands on the board as work.

## Seat economics

- Every merge record stamps what the work cost: tokens per seat, tool
  uses, minutes, rework cycles, and the wall clock of every gate it
  owed.
- Model assignment per seat is recorded as what ran, not what was
  meant, so cost and quality can be read per model and per task size.

## The method itself

- The convention ships into every project the interview creates: roles,
  protocols, formats, gates.
- The method is versioned and eval-gated: a change to a role file owes
  its eval block before it lands.
- Findings never rot: every suggestion is promoted, parked with a wake
  condition, or discharged on record.
