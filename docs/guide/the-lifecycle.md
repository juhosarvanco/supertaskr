# The Lifecycle

The software development lifecycle in the industry's own words, and
what Supertaskr does at each phase. Where Supertaskr does something
different on purpose, this page says so rather than stretching a term
to fit. Present tense means built and gated in this repository today;
**(v1, on the board)** means ruled and not yet landed. Each section
points at the reference chapter that holds the mechanism, and the
mechanism's file is named there.

The short version: Supertaskr runs the whole lifecycle for one person
and their AI coding agent, inside one git repository, with every
decision, build, check and reason written to disk. The phases below
are not stages a team hands work between; they are stages one loop
passes through, card by card, and the loop closes on itself because
every finding becomes a new card.

## Key phases of the lifecycle

### Requirements analysis

*The industry:* defining user needs, core problems and project goals
through collaborative user stories.

*Supertaskr:* **the interview is the product.** A project begins with
seven questions asked one at a time — the problem and the person, what
success measurably means, the non-goals, the constraints, the stack
and why, the riskiest assumption, the first slice — and each answer is
banked to disk the moment it is confirmed, never in one pass at the
end (method/interview/plan-interview.md; reference chapter 12). Weak
answers are challenged, not transcribed: "you said fast — compared to
what, measured how?" The interview ends with the five governing
documents (the north star, the roadmap, the architecture, the
conventions, the state) and a board.

The unit of a requirement is a **card**: one markdown file in
docs/tasks/ with machine-read frontmatter and acceptance criteria in
EARS form — WHEN, THE system SHALL — written so a test can hold each
one (chapters 02 and 03). A card is the house's user story, with two
differences from the industry's: it names the files it may touch, and
its criteria are checked by a preflight before anyone builds it. Open
questions live in rooms (docs/rooms/), decisions in decision records
(docs/decisions/); a product decision is the human's and no seat takes
one on their behalf.

### System design

*The industry:* cloud-native architecture blueprints, modular
microservices instead of monolithic blocks.

*Supertaskr:* **one repository, explicit component boundaries, and a
map that is regenerated from the code.** docs/ARCHITECTURE.md carries
the component map (C-01 through C-18: the parser, the app shell, the
board, the interview, the indexer, and the rest), and
docs/architecture/graph.json is the dependency graph the Rust indexer
derives from the sources and commits as a file — a stale graph is
refused at the push (ADR-014, ADR-015; chapter 08). Design is written
down before building as decision records, and the roadmap's feature
entries say what each area does.

Modularity here is not services. The product is a desktop app (Tauri:
a Rust side and a TypeScript front), a Rust workspace with the index
crate, a TypeScript parser library and a suite of tools — one tree,
built and tested together. What keeps work modular is the **fence**: a
card's `touches:` line expands to the exact set of paths its lane may
write, and everything outside that set is read-only for that lane
(chapter 04). Blast radius is measured per card, and the ceremony a
card gets — how many seats, how deep the verification — follows its
size and its reach (chapter 06). There is no cloud blueprint, because
there is no cloud: see *Cloud-native design* below.

### Implementation

*The industry:* clean code under version control, with AI-assisted
code completion.

*Supertaskr:* **an AI agent writes the code, in a lane, under a
fence.** Every card is built in its own lane: a sibling git worktree
on a branch named for the card, cut by one command — the dispatch arm —
that stamps the card, cuts the worktree, runs the preflight, writes the
fence, cuts the verifier's bench, assembles the brief and proves the
port is free, refusing at the first step that fails (chapter 05). The
builder is a seat: one session holding the executor role for one card,
then ending (chapter 06). Its instructions are a program-assembled
brief — the card, the fence, the ports, the conventions quoted by
heading — rather than a chat. The fence hook refuses a write outside
the fence at the moment of the write; a widening is the architect's,
never the lane's.

Git is the only record. A lane commits on its branch with messages
that say what moved and why; nothing is ever rewritten. AI assistance
is not completion inside an editor: the agent writes all of the code,
runs the suites, drills its own tests and writes its report, and the
human reads verdicts and rules on decisions.

### Testing, shifted left

*The industry:* automated unit and integration tests early in the
coding phase, so bugs are caught at once.

*Supertaskr:* **the tests are the specification, and a test that
cannot fail is a defect.** Acceptance criteria are written to be held
by tests, and the behaviour census docs/CAPABILITIES.md is generated
from the end-to-end test names — a sentence there is false the moment
its test fails. Before a card is dispatched, its preflight checks the
criteria's paths, figures and refs against the tree (chapter 05).
While a card is built, every new test body is **drilled**: a mutant is
planted on the producer side and the body must go red alone, then the
site is restored and proved by hash; a positive control is shown
failing against an implementation that lacks the property before it
is trusted (chapter 07). Four suites gate every merge — the parser, the
app, the Rust workspace and the end-to-end suite — run through one
blessed runner that reads the count beside the exit.

Then the work is attacked by someone who could not see it being made.
The verifier is two spawns: the first writes an attack set from the
card alone, with no tools, and it is hashed before the work is opened;
the second runs those attacks against the lane's tip, plants its own
mutants, runs a mandatory security sweep, and writes a verdict onto
the card — approved, approved with assigned corrections, or rejected
with reproducible commands (chapter 07). Prose is a code input here:
the docs gate reads cards and governing documents the way the suites
read source, and refuses a card whose frontmatter does not parse.

### Deployment, continuous integration and delivery

*The industry:* pipelines that push every update straight to
production, safely.

*Supertaskr:* **delivery is a judged push to the integration branch,
and the pipeline runs in the repository before it runs in the cloud.**
An approved lane is merged by the integrator with its corrections
performed and drilled, the census and the graph regenerated in the
same commit, and the four-suite battery run last on the exact tree
about to be pushed (chapter 08). The push itself goes through a guard:
the battery's verdict token is keyed to the tree the suites started
on, a token for another tree or a run that spanned a commit is
refused, a merge whose lane branch is gone is reported unjudged, and a
CI run still in flight refuses the push (chapter 10). CI is one
GitHub Actions job whose steps are pinned to the local runner by a
parity test, so what the runner does and what the seat did are the
same words; a red on the runner is attributed by name and filed as a
card, never argued with.

There is no production to push to in the industry's sense. The
deliverables are a desktop app and a versioned method kit: a release
is a method version bump, a three-file commit whose pin test refuses a
half-bump, and the kit is copied whole into a new project at genesis
(chapters 12 and 14).

### Maintenance

*The industry:* live monitoring, security patching, frequent
improvements.

*Supertaskr:* **the method watches itself, and every finding becomes
work.** Each sitting ends in a checkpoint: an append-only record of
what merged, what the gates said, what the brief got wrong and the
metrics, with the state file replaced from its template in the same
commit so a cold session can resume from disk (ADR-019; chapter 09).
Health is a set of declared bands — suite seconds, the suggestion
backlog and its age, the governing documents' byte headroom, seat
economics — read at every checkpoint, and a breach lands on the board
as a card rather than in a dashboard (chapter 11). The boot gate
starts the app and reads its own startup lines.

Security is part of verification, not a phase after it: the verifier's
sweep is mandatory and its findings are rejection-level; the fence
hook, the push guard and a read guard refuse at the write, the push and
the read; the docs gate carries an injection scan that names a hit and
treats the text as data. Improvements arrive as suggested cards filed
by lanes, verifiers and the seat, triaged by priority and dispatched in
order; the cadence is the loop's own, and a checkpoint is due when the
triage band drifts.

## Core modern methodologies

### Agile and sprints

*The industry:* one-to-two-week cycles, adapting to changing user
feedback.

*Supertaskr:* **no sprints; the unit of planning is the card and the
unit of time is the sitting.** Cards carry a size (S, M, L) and a
priority, and the next card is derived from the board and the live
lanes by a command — never kept in a hand-written list, which is how
two dead lanes were once named and two live ones missed (chapter 05).
A sitting runs from one checkpoint to the next and may dispatch many
cards in parallel lanes; the human's feedback enters as rulings in
rooms, as decisions, and as answers to a lane's ask. Milestone 1 is
deliberately too small: the interview's last question is the smallest
slice that could ship and teach something. What agile measures with
velocity, Supertaskr measures per checkpoint under ADR-020: rework
cycles, tokens per seat, gate runtime, cold-start cost and drift
incidents.

### DevOps and DevSecOps

*The industry:* development, operations and security as one team, so
software ships fast without losing safety or compliance.

*Supertaskr:* **one person, five seats, and gates instead of a team.**
The roles — planner, orchestrator (the architect), executor, verifier,
integrator — are contracts in method/roles/, each a numbered list of
steps with its report and its reasons (chapter 06); a human holds the
architect's seat from inside their own agent app, holding Supertaskr as
a skill **(v1, on the board)**, and the other seats are spawned
sessions. Operations is the gates: every guard shares one exit contract
(0 clean, 1 found something, 2 called wrong, 3 could not check) and
exit 3 is never reported as clean (chapter 10). Security is built into
the same loop — the verifier's sweep, the fence, the push guard, the
injection scan — and compliance is the record: an append-only trail of
verdicts, decisions and checkpoints, stamped at refs, that a successor
can audit without asking anyone.

### Cloud-native design

*The industry:* containers and elastic cloud platforms for easy
scaling.

*Supertaskr:* **local-first by design.** The project folder is the
whole system of record and the desktop app is a mirror that renders
what is on disk and never believes what a model said (ADR-021; chapter
13). The only cloud in the loop is the CI runner, and the repository
treats it as a foreign machine: no git identity, no login, a disk that
filled and is now read and floored before the end-to-end lane. There
are no containers; the portable unit is the method kit, versioned and
copied into a project at genesis. Scaling is parallel lanes on one
machine — sibling worktrees, one port per card, a solo lock per
checkout for the suites that cannot share — and the health bands
measure where that machine's edge is. Elastic platforms are not ruled
out later; they are not what the first user has, and the first user is
who this is built for (docs/NORTH_STAR.md).

## Where to go next

- The whole cycle, stage by stage: [reference chapter 01](../reference/01-the-loop.md).
- The exact behaviour list, generated from the tests: [docs/CAPABILITIES.md](../CAPABILITIES.md).
- What ships in which version: [docs/VERSIONS.md](../VERSIONS.md).
