# supertaskr

A product idea becomes a thoroughly planned roadmap broken into exact,
dispatchable tasks, then governed multi-model execution of it — with the
project folder as the complete, successor-proof record. The better
builder models get, the more the bottleneck is knowing what to build.
The interview is the product; the pipeline is the proof.

That paragraph is [docs/NORTH_STAR.md](docs/NORTH_STAR.md)'s own vision,
quoted rather than re-worded. The claim that matters is one sentence:
**this repository is its own proof.** supertaskr is built by the method
supertaskr ships, so every claim made for the method has a file in this
folder that substantiates it or contradicts it.

## What this file is

A signpost. Every claim below links to the record that holds it or names
the command that derives it, and where this file and the record disagree
the record wins. Nothing here is the only copy of itself, which is also
the rule the method applies to its own dispatch briefs.

The files beside it — `CLAUDE.md` and `AGENTS.md` — are adapters for
agent sessions rather than documentation for people. They point a
session at the read-first set and the standing rules for using it.
This file is the human's door; those are the agents'.

The vocabulary here is local. The table below maps the terms this page
leans on hardest to their standard names, each row citing the file that
owns the rule; for a word the table does not carry, that owning file is
where it is defined.

## Where the work stands

The app renders this repository's own plan and architecture map live off
files, and the method runs the project daily: lanes, fences, verdicts,
checkpoints. What has never happened is stated in the plan rather than
omitted from it — no planner turn has ever run against a real model, so
every stream the genesis screen has shown is a fixture, and one real
timed end-to-end run is the whole remaining gate on that milestone. See
Milestone 3 in [docs/ROADMAP.md](docs/ROADMAP.md), which says so in its
own words.

## The record tour

Each entry below is the evidence for a claim that would otherwise be an
assertion. Read them in any order.

- [docs/tasks/T-083-the-range-rule-is-backwards-before-the-merge.md](docs/tasks/T-083-the-range-rule-is-backwards-before-the-merge.md)
  — a finished task card carrying the verdict that **rejected** it:
  one figure on it did not survive the derivation the card itself
  prescribes. The rejection, the verifier's independent re-derivation,
  a second session's fix and the re-verification that approved it are
  all appended to the card, beneath the acceptance criteria the work
  was judged against.
- [docs/checkpoints/2026-08-27-T-092.md](docs/checkpoints/2026-08-27-T-092.md)
  — one integration, written down once and never edited: the merge's own
  commit range, each standing gate fired or ruled not-owed, the suites
  with their exit codes, and how much of a document's byte budget the
  card spent.
- [docs/rooms/governing-docs.md](docs/rooms/governing-docs.md)
  — the room where "what may a governing document contain, and who keeps
  each sentence true?" was argued, amended by a review, and ruled. It is
  the charter behind ADR-019 and the reason the governing documents are
  the size they are.
- [docs/CAPABILITIES.md](docs/CAPABILITIES.md)
  — what the app does, one sentence per behaviour, generated from the
  end-to-end test names. A sentence there is false the moment its test
  reds, and nobody has to keep it true by hand; behaviours the generator
  cannot expand are named rather than dropped.
- [docs/decisions/](docs/decisions/)
  — every architectural decision as a dated record naming its status
  and where it was decided: a room, a task's verification, or a human
  directive — and, where one revises another, what it amends. ADR-018
  is absent on purpose; the reservation and who owes it are both
  written down.

## The house terms, in the standard vocabulary

Coined only where nothing standard exists; where something standard
does, the standard name is the one that binds.

| here | the standard name | what it is, and where the rule lives |
|---|---|---|
| **card** | the work item, kept in-repo as the spec | one task in `docs/tasks/`: frontmatter, acceptance criteria in EARS form, then the executor's notes and the verdicts appended beneath them — [method/tasks/TASK-FORMAT.md](method/tasks/TASK-FORMAT.md) |
| **lane** | branch isolation | one task, one branch, one git worktree, one session; the integration branch is none of them — [method/lane-protocol.md](method/lane-protocol.md) |
| **fence** | computed write-set disjointness | the path set a lane may write. Concurrent lanes must not overlap, and overlap is computed over the EXPANDED path sets — comparing the component names instead reports two lanes disjoint whenever their names differ — [method/lane-protocol.md](method/lane-protocol.md) rule 5 |
| **seat** | a role, adversarially separated by what it may read | a verifier is handed only the card and the diff, never the builder's reasoning, and is adversarial by design. The independence that pays is that blindness rather than model or session diversity: a card's `review:` field records which hand held the pen, and `self-verified` is the value that names the guarantee as missing — [method/roles/verifier.md](method/roles/verifier.md), [method/tasks/TASK-FORMAT.md](method/tasks/TASK-FORMAT.md) |
| **room** | a design discussion in a file, closer to an RFC than a thread | opened with a question, argued in writing, and closed by a `## Resolution` stating the decision and what it changed; where the room was a debate, that resolution is the draft of its decision record — [method/rooms/ROOM-FORMAT.md](method/rooms/ROOM-FORMAT.md) |
| **poison drill** | mutation testing, run as a hand discipline | mutate a new or changed assertion so that it ought to fail — one side only, never a literal the code and the test share — run its suite and require the red; then restore, and prove the restoration with a hash rather than with a clean `git status` — [docs/CONVENTIONS.md](docs/CONVENTIONS.md) |
| **checkpoint record** | the integration log entry | append-only, one per merge, in `docs/checkpoints/` — and no gate, suite or generator is permitted to depend on the directory's contents — [ADR-019](docs/decisions/019-governing-docs-rules-truths-records.md) |

The habits underneath the vocabulary matter more than the words, and
neither of these is a coinage. **Derive it, never quote it**: a number
is transcribed into prose only where a program re-derives it, a
generator with a currency check emits it, or an immutable record stamps
it with the commit it was measured at; otherwise the derive command is
written where the number would have gone. That rule binds a front page
hardest of all, which is why this one measures nothing and quotes no
measurement. And **one home per fact**: a fact is written where its
question lives and cited everywhere else, because two copies of one fact
are two chances to disagree.

## Where the rules live

- [docs/NORTH_STAR.md](docs/NORTH_STAR.md) — the vision, the first user,
  the success criteria, and the bar the work is held to.
- [docs/STATE.md](docs/STATE.md) — what is happening right now.
  Regenerated whole at every checkpoint, under a byte budget.
- [docs/ROADMAP.md](docs/ROADMAP.md) — what the app does per feature, and
  what comes next.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — which components exist
  and the interface rules between them.
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — how to work here,
  including every build and test command.
- [docs/CAPABILITIES.md](docs/CAPABILITIES.md) — the behaviour census,
  generated and currency-checked.
- [method/](method/) — the convention itself: product-agnostic, usable by
  hand with any model that can read files, and the thing this repository
  is the first user of. Start at [method/README.md](method/README.md).

Build and test commands are deliberately not repeated in this file. They
live in `docs/CONVENTIONS.md` under "Build & test", where a test in the
end-to-end lane derives the CI workflow from that section and fails when
the two drift — so a command copied here would be a second copy with
nothing keeping it true.
