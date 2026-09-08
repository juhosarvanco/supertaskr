# The Supertaskr reference

The in-depth, technical description of the whole system: every stage of
the loop, every artifact, every guard, in the terms the code and the
method use. It is written for a reader who wants to know exactly how
Supertaskr works before adopting it, or who runs it and wants the mechanism
behind a rule. The short human-reader version is docs/guide/; the
sentence-level behaviour census is docs/CAPABILITIES.md; the ruling on
what ships when is docs/VERSIONS.md.

## How to read this reference

- **Present tense means built and gated.** A sentence in the present
  tense describes machinery that exists in this repository today, and
  names the file that holds it so you can read the mechanism rather
  than a page about it.
- **"(planned: T-NNN)" means ruled and on the board, not landed.** The
  card id is the link; the board's status is the truth, and
  `node tools/e2e/scripts/brief.mjs --card T-NNN` from the repo root
  derives it.
- **A card id in parentheses after a mechanism names the card that
  built it.** The card's body carries the evidence, the measurements
  and the verdict; this reference carries the mechanism.
- **Nothing here is authoritative over the source it describes.**
  Where a chapter and method/, docs/CONVENTIONS.md or a script's own
  header disagree, the source wins and this chapter is the bug. File it
  as a suggestion card.

## The chapters

| # | chapter | what it covers |
|---|---|---|
| 01 | [The Loop](01-the-loop.md) | the whole cycle, stage by stage, with each stage's actor, mechanism and the failure it prevents |
| 02 | [Cards](02-cards.md) | the task file: frontmatter, body, statuses, ids, sources, triage, lifecycle |
| 03 | [Criteria](03-criteria.md) | EARS notation, the rules a criterion must obey, and the EARS-for-the-AI-era additions: decision list, oracle class, commission list, escalation |
| 04 | [Fences](04-fences.md) | how a fence is declared, expanded, compared, armed, enforced at the write and at the landing, and widened |
| 05 | [Dispatch](05-dispatch.md) | the dispatch derivation, the thirteen-row brief, the preflight, the seat lock, the one-command arm |
| 06 | [Seats](06-seats.md) | the five roles, their contracts, the report, run hygiene, ceremony by size and by blast radius |
| 07 | [Verification](07-verification.md) | the two-spawn blind bench, the attack set, ground truths, the poison drill, verdicts, rejections |
| 08 | [Landing](08-landing.md) | the merge forecast, the merge, assigned corrections, the battery, regenerations, the checkpoint, the revert play |
| 09 | [Records](09-records.md) | the governing documents, the three tiers, byte budgets, checkpoint records, rooms, decisions, the generated census |
| 10 | [Gates](10-gates.md) | every guard and gate: what it reads, what it refuses, its exit contract, its disclosed limits |
| 11 | [Health](11-health.md) | the health bands, the suggestion metabolism, seat economics, the method evals |
| 12 | [Genesis](12-genesis.md) | the interview, incremental banking, decomposition, the kit, the cold-start test, skill packs |
| 13 | [Surfaces](13-surfaces.md) | the mirror app, the CLI, the seat skill and the interview skill, the two agent apps |
| 14 | [Versions](14-versions.md) | every ruled feature by version, in depth, with the card that carries it |

## The vocabulary in one screen

- **The method** — the versioned convention in method/ (v0.1.9): role
  contracts, the lane protocol, the task format, the docs protocol, the
  interview, templates and adapter files. A project copies it in.
- **The Loop** — one card's journey: born, triaged, dispatched, built in
  a lane, verified on a bench, merged, checkpointed, checked by CI, its
  findings filed as new cards.
- **A card** — one markdown file in docs/tasks/ with machine-read
  frontmatter and EARS acceptance criteria. All work is a card.
- **A seat** — one session holding one role for one card, then ending.
  Five roles: planner, orchestrator (the architect), executor, verifier,
  integrator.
- **A lane** — one task, one branch, one sibling worktree, one session.
- **A fence** — the card's `touches:` expanded to the path set the lane
  may write, enforced by a hook at the write and by a gate at the push.
- **A bench** — the verifier's own detached worktree, cut when the lane
  is cut, holding no manifest.
- **A gate** — a program with the house exit contract: 0 clean, 1 found
  something, 2 called wrong, 3 could not check. Exit 3 is never clean.
- **A record** — an append-only file stamped at a ref: a checkpoint
  record, a verdict, a decision record. Never edited.
- **The governing docs** — STATE, ROADMAP, ARCHITECTURE, CONVENTIONS,
  CAPABILITIES, NORTH_STAR: what every session loads, byte-budgeted.
- **The mirror** — the desktop app that renders the files; it writes
  nothing but single-field stamps and spawns nothing (ADR-021).
