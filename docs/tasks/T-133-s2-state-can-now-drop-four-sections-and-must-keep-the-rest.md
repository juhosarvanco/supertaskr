---
id: T-133-s2
title: STATE can now drop four sections to the command and must keep the rest — the list, measured rather than argued
status: suggested
suggested_by: executor claude-opus-5 @T-133
---

**ROUTED, NOT TAKEN.** T-133's fence is `touches: [tools/e2e]`;
`docs/STATE.md` is outside it. Arm two's COMMAND is built and green. Arm
two's EDIT to STATE is this card, and it belongs to whoever writes the
next checkpoint.

## The measurement, taken at `5036958` against that edition of STATE

`node tools/e2e/scripts/brief.mjs --state` answers, with a stamp on every
figure:

| STATE section | the command answers it | why |
|---|---|---|
| `## THE LANE LIST, DERIVED FROM ...` — the two-row table | **yes, entirely** | worktrees on a task branch, each lane's `touches:` read off its own card, and the board status beside it |
| the free/held fence ledger at the end of that section | **yes** | every slug in the map plus every path fence any live lane holds, joined to the lane that holds it |
| `## The board, derived from disk at this checkpoint` | **yes** | per-status counts, the flat-file total and `rejected/`, all from `git ls-files` and frontmatter |
| the slug block in `docs/ARCHITECTURE.md` that STATE leans on | **yes** | from each component's `touch_slugs:` FIELD, with the prose block compared and a divergence reported |

Everything else in that edition is **NOT derivable and must survive**,
and the reason is not squeamishness — it is that no command produces it:

- the mtime finding and its one-operation-at-a-time table, the "read an
  old red" signature, the cache cliff and its clock band, and the
  hostile-session-id intermittent. **A named intermittent is a judgement
  about a body's history**, not a query.
- `## Next up`, `## Everything this integrator's brief got wrong`,
  `## Provenance`, `## What ACTUALLY reached the human's running app`,
  and every ruling. **A checkpoint that replaced judgement with a table
  would be worse than one that repeats a count** — the card says so and
  the measurement agrees.
- the RANGE RULE ratios and the suite ledger. Derivable in principle,
  from a range this command deliberately does not compute: a second
  opinion about which two commits the merge's diff means is the failure
  the RANGE RULE exists to prevent, so this command has no range in it.

## The shape of the edit

Replace the two-row table and the board census with **the command's own
spelling** and a one-line statement of what the command answers — the
shape `docs/CONVENTIONS.md`'s DOCS GATE bullet already uses for its
census (*"Run `node tools/e2e/scripts/docs-gate.mjs --census`… it cannot
be stale because it is not written down"*). **Do not replace the
narrative that surrounds them.** The previous edition's own warning is
the argument for the first half and against the second: it said `T-130`
was "the only lane left", which was true when written and false forty
minutes later.

**AND THE VOLATILITY IS WORSE THAN THAT EDITION RECORDED.** Measured in
this lane, in a single session and without the lane doing anything to
cause it: `nputer-T-132-verify` was present at dispatch and gone an hour
later, `nputer-T-127-verify` appeared in between, and `T-132`'s branch
tip advanced twice. **Three movements in the worktree list while ONE card
was built.** A typed lane list is a snapshot of a fact that moves faster
than the file, and this is the third independent measurement saying so.

Fence: `[docs/STATE.md]`.

closed_by: the ADR-019 phase-3 commit that regenerates docs/STATE.md
from docs/STATE-template.md (find it with `git log --diff-filter=A --
docs/STATE-template.md`). This card asked STATE to drop the sections
`brief.mjs --state` can answer and keep the rest; the phase-3 cutover
did exactly that — the lane list, fence ledger, board census and slug
map are now derive-commands pointing at that command, while the
narrative, the standing hazards and the owed @human looks survive
(hazards in the compacted STATE, narrative in
docs/checkpoints/2026-08-27-backfill-STATE.md verbatim). Executed
directly at @human's direction per docs/rooms/governing-docs.md's
override; budget gate landed in the same commit at warn 8474 / fail
10169 over a landed 6779 bytes, poison-drilled with unpiped exits
(clean 0, poisoned 1, restored 0).
