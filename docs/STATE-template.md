# State — template (ADR-019)

This file is the shape docs/STATE.md is REGENERATED into at every
checkpoint, AFTER the checkpoint record is written to
docs/checkpoints/. Replace every <angle-bracket> slot; delete nothing
structural. The contract (docs/rooms/governing-docs.md, ADR-019):
STATE holds what is live, what to run, the standing hazards and
pointers — the checkpoint's narrative goes to the record, where the
INSTANCE is stamped and this file keeps only the MECHANISM. A figure
appears here only with its derive command or a ref+date stamp. The
byte budget is enforced by `npm run lint:docs` (docs-scan.mjs's
DOC_BUDGETS); when it warns, move content to the record or a card —
never delete a hazard to fit.

---

# State

Updated: <date> by the <T-NNN> integrator — checkpoint record:
docs/checkpoints/<date>-<T-NNN>.md.

**<Status headline: NOTHING IS BROKEN unless something is, plus every
designed non-zero exit a session will meet, each with its reason and
its enforcing copy.>**

## The contract this file is under

<One short paragraph: replaced each checkpoint from this template;
narrative lives in the record; derive at your own ref. Cite ADR-019.>

## Live right now — derive, never quote

- LANES: <the two derive commands, and the reading stamped with ref
  and clock.>
- THE HUMAN'S APP: <the one permitted read for port 1420, and the
  standing checkout facts.>
- BOARD CENSUS: <derive command; stamp any reading you state.>
- GRAPH: <index --check, asked never predicted.>

## Next up — hooks only; statuses are the board's

<KEEP THIS HEADING NAMED "Next up": brief.spec.ts pins it as its proof
that STATE's own headings are relayed beside the derived facts.>

<Numbered one-liners: card id + the hook a dispatcher needs. Statuses
and fences are DERIVED at dispatch with brief.mjs --task, never read
from this list.>

## Standing hazards — the section that saves the hour

<One bullet per live trap or intermittent: the mechanism, the reading
that tells you which case you are in, and the card id. An instance
that fired this integration is stamped in the checkpoint record, not
narrated here.>

## The records

<Pointers: docs/checkpoints/ (and the current record), the governing
room + ADR, and where the pre-compaction history lives.>
