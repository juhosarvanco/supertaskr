# 09 — Records

The files are the shared brain: if it is not in the repository, it did
not happen (ADR-002). This chapter is the contract every document is
under: which kind of fact it may hold, who keeps it true, what budget
it lives under, and how it is regenerated. The law is
method/docs-protocol.md (ratified as ADR-019 from
docs/rooms/governing-docs.md); the gate is
tools/e2e/scripts/docs-scan.mjs behind `npm run lint:docs` and
docs-gate.mjs.

## Three kinds of fact, three keepers

Every sentence in a governing document is one of:

- **A RULE** — how to work. Kept by version and by gates. Lives in the
  governing documents as the rule, the why in a sentence or two, the
  authority that enforces it, and the task ids that proved it.
- **A TRUTH** — what is true now. Kept by programs: the document
  carries the derive command, or a generated document with a currency
  check emits it. Never a bare transcribed figure.
- **A RECORD** — what happened, stamped at a ref. Kept by immutability
  in task cards, checkpoint records and decision records. Never enters
  a governing document.

A figure needs a keeper: it appears in a governing document only if a
program re-derives it, a generator with a currency check emits it, or
it is ref-stamped in an immutable record. Governing documents are
replaced; records are appended. The lesson once: a recurring pattern
earns one rule, one provenance citation and one worked example; further
instances are stamped in records only. Every machine ships with the
condition under which it retires, written as an observation rather
than a date.

## The governing documents

| document | question it answers | keeper |
|---|---|---|
| docs/NORTH_STAR.md | the product's purpose, quality bar, never-derived indicators; signed by the human | rarely changes; a contradiction opens a room |
| docs/STATE.md | what is happening right now: live derive commands, next up as hooks, standing hazards, pointers | regenerated from docs/STATE-template.md at every checkpoint; byte-budgeted |
| docs/ROADMAP.md | what the app does per feature and what comes next; the backbone and milestones | one sentence per feature per merge; byte-budgeted |
| docs/ARCHITECTURE.md | which components exist, coloured by status; the slug block as prose | the component registry files are authoritative; byte-budgeted |
| docs/CONVENTIONS.md | how to work here: build and test commands, gates with their triggers, disciplines, gotchas | rules with provenance; byte-budgeted; the parity spec pins CI to its command bullets |
| docs/CAPABILITIES.md | the exact behaviour census | generated from the e2e test names; `capabilities:check` reds when stale |
| docs/VERSIONS.md | which features are v1, v2, v3+, unruled | transcribes the version room's rulings; kept by hand at every sitting |

The root adapter files CLAUDE.md and AGENTS.md are byte-identical thin
adapters naming the read-first set. Each role's contract names the
sections that role reads first and the ones it does not.

## Byte budgets

Budgets are tripwires, not the cut. `DOC_BUDGETS` in
tools/e2e/scripts/docs-scan.mjs declares each governing document's
landed size at its last compaction; the gate values are derived from
it, warn at 1.25 times landed and fail at 1.5 times. When the gate
warns, content moves to a record or a card. The docs-headroom health
bands (chapter 11) watch the distance to the warn line in percent, so
the debt is visible before the gate fires. A CONVENTIONS compaction
that moves the generic seat protocols into method/ so an executor reads
the method plus a brief-sized overlay is on the board (T-254 the context
pack, T-255 the compaction).

## Checkpoint records

`docs/checkpoints/<date>-<slug>.md`, one per integration sitting,
written on docs/checkpoints/TEMPLATE.md before STATE is regenerated,
committed with it. Append-only: written once, never edited. No suite,
gate or generator may depend on this directory's contents; the two e2e
specs that walk docs/ walk these files as app content and nothing more.
The sections and the five metric lines are in chapter 08. The record
keeps the instance; STATE keeps the mechanism.

The health bands' three record-borne readings (gate seconds, cold-start
outcome, drift incidents) reach `npm run health` the one way a record's
contents may reach a program: carried by hand into a `--readings` file
at the checkpoint that wrote them.

## Task cards as records

A card's Implementation notes, Verdicts, corroboration lines,
`Absorbs:` lines, parking notes and discharge notes are records:
dated, stamped, appended, never rewritten. A rejected card moves to
docs/tasks/rejected/ with its reasoning; the task globs are flat, so
nothing under rejected/ is a model input.

## Decision records

docs/decisions/NNN-<slug>.md, numbered, dated, append-only, with the
measured reason. Later work cites them; re-arguing a ratified decision
requires a new room. Twenty-two to date, from ADR-001 — whose title is
QUOTED here because records keep the pre-rename name, "Build nputer with
nputer" — through ADR-019 (the three tiers), ADR-020 (determinism at the
moment of action), ADR-021 (the architect sits in the agent app;
Supertaskr is a skill, a CLI and a mirror) and ADR-022 (the product and
the method are named Supertaskr), with an addendum where a ruling is
sharpened rather than replaced.

## Rooms

docs/rooms/<slug>.md: a discussion file for a question measurement
cannot settle, with a status line (open, resolved, re-ruled), the
options argued in writing, @-routing to whoever must rule (`@human`,
`@planner`), and the human's words recorded verbatim at each sitting.
A resolved room becomes a decision record or a ruling appended to the
room; an executor blocked by ambiguity opens a consultation room and
waits. Twelve rooms to date, among them governing-docs (ADR-019's
source), cockpit-or-mirror (ADR-021's), version-planning (every version
ruling), naming (open), loop-efficiency and team-enablement.

## The generated census

docs/CAPABILITIES.md is generated by `npm run capabilities` from
tools/e2e/ out of the test names in tools/e2e/tests/*.spec.ts, one
sentence per test, grouped by topic (the spec file's name). It is
regenerated in the same commit as whatever moved a test name, by the
integrator at the merge; `npm run capabilities:check` byte-compares and
reds on a stale census, and CI runs the check. Its last section names
what was not extracted rather than dropping it. Before concluding that a
feature is missing, check it first: a sentence in it is false the
moment its test reds, and nobody keeps it true by hand.

## The architecture graph

docs/architecture/graph.json is committed (ADR-014), derived by the Rust
indexer supertaskr-index (C-07, ADR-015) over the TypeScript and Rust
sources, and checked for currency by `index --check`. The component
registry docs/architecture/components/C-NN-*.md declares each
component's paths, dependencies, decisions, status and touch slugs; the
map compares intent (declared edges) against reality (observed edges)
and reports drift, cycles, blast radius, churn and the graph's byte
budget (ADR-013). A new file under no component's globs lands in the
unmapped bucket until someone routes it: opt-in, never inferred.

## Where the trust went

Trust is relocated, not eliminated, to named and recorded points: the
seats (that a verifier stayed blind, that an executor re-derived), the
provenance marks (a stamp is a claim by the hand that wrote it), and
the human gates. Writing the list down is the point: a reader can ask
how each is protected, and a machine that takes over a trusted point is
a promotion that shortens the list.

## From the conventions — the forensics behind the rules (T-290)

The rules themselves live in the chapters under docs/conventions/,
which docs/CONVENTIONS.md indexes. What follows is the history, the
measurements and the argument each of those rules was cut from, moved
here VERBATIM at T-290 under ADR-023 — the records rule forbids a
rewrite, so not a byte of it is re-worded, re-ordered inside an entry,
or summarised. Each entry names the bullet it came out of.

### A LINE NUMBER IS A FIGURE

Two citations were falsified by merges in a single night, both true
  when written.

### AND A DISTANCE TO A MOVING TIP CANNOT BE STATED AT ALL IN A DOCUMENT

**AND HERE IS WHY THE
  PEOPLE WRITING THIS RULE DOWN KEEP BREAKING IT**: `main` is the
  natural way to write "and it is still true NOW", and "now" is the one
  thing a committed document cannot hold — five instances landed on one
  card in one sitting, twice inside a table built to demonstrate the
  rule.

### A CITATION NAMES A SYMBOL, NOT A LINE

T-093's card carries the measurements, at `bc2d82a`.

Re-running from the ROOT fixes this one, which is what makes
  the other two worse — they give the SAME answer from anywhere, over a
  file somebody has just edited.

One literal NUL makes a file
  BINARY to every binary-skipping searcher while it still compiles,
  renders and passes its suites: the real `/usr/bin/grep` prints
  `Binary file … matches` at exit 0, while the shell-function `grep`
  this harness installs answers EXIT 1 WITH NO OUTPUT over the same
  bytes — the code a genuinely absent string gives.

THE GATE IS NOT THE GAP; the advice was.
