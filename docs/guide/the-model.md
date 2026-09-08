# The Model

## One sentence

Your agent app runs the conversation; nputer runs the discipline.

## Where the work happens

nputer does not host the chat. You talk to The Architect inside the
agent app you already use — Claude Code or Codex — and nputer is what
that seat holds:

- **a skill** the app loads **(v1, on the board)**, which gives the seat the loop: read the
  record, pick the next card, cut a lane, spawn a builder and a blind
  verifier, fold the verdict, merge, push;
- **a command line**, `npx nputer` **(v1, on the board; today the same
  commands run as scripts in the repository)**, that the skill calls and that you can
  call by hand — the dispatch view, the fence, the preflight, the gates,
  the push guard, the architecture indexer;
- **a mirror app** you open beside the chat: the story map, the lanes,
  the architecture map, the health bands. It renders what is on disk and
  never believes what a model said.

The interview that starts a project is one interview in two lenses: the
mirror app's split view today, and a skill in the agent app **(v1, on
the board)**. Both write the same files.

## What is on disk

Everything. The plan, the board, the fences, the verdicts, the decisions,
the records — plain Markdown in your repository, in git. No database, no
server, no account, no telemetry. If nputer vanished tomorrow, your
project would still be readable, drivable by hand, and true.

```
docs/
  NORTH_STAR.md      why the project exists, who it serves, what it refuses
  ROADMAP.md         the features and what comes next
  ARCHITECTURE.md    the components, with the code's real graph laid over
  CONVENTIONS.md     how to work here
  STATE.md           what is happening right now
  CAPABILITIES.md    every behaviour that has a test, as a sentence
  tasks/             one card per task: criteria, fence, verdicts
  decisions/         one file per decision, with its reasons
  rooms/             open questions and their resolutions
  checkpoints/       the append-only record of every merge
method/              the convention itself, shipped into every project
```

## The seats

Five roles, each a fresh session with a written contract. Any agent
that can read files can hold any seat.

| seat | job | what it may not do |
|---|---|---|
| **The Architect** (planner, orchestrator, integrator) | plans the board, dispatches lanes, folds verdicts, merges, keeps the record true | write inside a lane it dispatched |
| **Builder** (executor) | builds one card inside one fence, in its own worktree | touch a file outside its fence; see the verifier's attack plan |
| **Verifier** | attacks the card from the specification alone, then judges the diff | read the builder's reasoning before writing its attack plan |
| **You** | answer the interview, decide the decisions, rule the open questions, approve the large cards | nothing is merged without your rules being applied; nothing needs your click to run |

The verifier is a different model from the builder where the card asks
for it, and its verdict is binding: a REJECTED verdict stops the merge.
That combination — a different model, denied the builder's reasoning,
returning a binding verdict, as a file in your repo — is the property
nputer is built around.

## What you own

- **The decisions.** The interview banks your answers. Each card will
  carry the decisions the planner could not settle from them, and you
  choose, before the lane runs or in a batch afterwards, at your option
  **(v1, on the board)**.
- **The rulings.** Open questions live in rooms and close with a
  resolution in your words, quoted verbatim.
- **The scope.** A large card does not run without your approval.
- **The keys.** nputer never proxies tokens or holds API keys. It spawns
  the agent CLIs you already pay for.

## What nputer owns

- **The fence.** Every card declares what it touches; a hook refuses a
  write outside it at the moment of the write.
- **The gates.** Preflight before a lane is cut, the docs gate on every
  change to the record, the landing gate before a merge, the push guard
  before anything leaves your machine, and the full test battery last.
- **The record.** Every merge lands with its checkpoint; every figure in
  a record carries the command that derived it; the documents that
  govern the project have byte budgets so they cannot rot into essays.
- **Its own health.** Bands over the method's own metrics — gate
  latency, rejection rates, cold-start passes, documentation headroom —
  each with a named keeper, reported as unkept rather than trusted when
  nobody keeps it.
