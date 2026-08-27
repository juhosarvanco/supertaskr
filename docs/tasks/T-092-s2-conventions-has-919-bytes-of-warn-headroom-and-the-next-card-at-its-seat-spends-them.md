---
id: T-092-s2
title: CONVENTIONS has 919 bytes of warn headroom left and the next card at its seat spends them, so ADR-019's budget is now the scheduler for that seat
status: suggested
suggested_by: executor claude-opus-5 @T-092
---

**ROUTED, NOT TAKEN.** Raising a budget line is an ADR-019 addendum with
a measured reason, and re-compacting `docs/CONVENTIONS.md` is a card of
its own — neither is a thing a lane widens its own fence to do.

## The measurement, at this lane's own refs

| ref | `docs/CONVENTIONS.md` bytes | warn headroom |
|---|---|---|
| `5887cd4` (T-092's base) | 95,644 | 12,323 |
| `dc3c5af` (T-092's tip) | 107,048 | **919** |

Derive rather than quoting: `wc -c docs/CONVENTIONS.md`, against the
`warn` value in `DOC_BUDGETS` in `tools/e2e/scripts/docs-gate.mjs`, which
is the authority. The gate is CLEAN at this tip — a WARN prints on stderr
and does not count toward `breaches`, so only the `fail` line changes an
exit code — and that is exactly why this is worth filing rather than
leaving for the gate to announce.

## Why it is a finding and not just arithmetic

**One card consumed 93% of the headroom that was supposed to serve every
card at that seat.** T-092 was a taxonomy pass with eight required
additions, each of them a mechanism ADR-019's own rule forbids deleting
to fit (*"a hazard is never deleted to fit"*). Two compression passes
moved every instance measurement out of the document and into the cards
that own them, which is the rule working; the residue is mechanism, and
mechanism is what the document is for.

The board carries **27 live cards whose `touches:` names
`docs/CONVENTIONS.md`** (derived at `5887cd4` with
`brief.mjs --card T-092`; seven planned, seven suggested). The next one
to land anything substantial at that seat will WARN, and the one after it
will be choosing between its own criteria and a budget.

## What would close it

Any one of these, and the choice belongs to whoever owns ADR-019:

- **A second compaction pass on CONVENTIONS**, on ADR-019's own terms —
  the per-merge instance detail that has accumulated since the first pass
  moves to `docs/checkpoints/` and to cards, and the `landed` figure is
  re-measured so `warn`/`fail` re-derive from it.
- **An addendum raising the line with a measured reason**, which ADR-019
  already names as the legitimate route.
- Or a ruling that the warn line is doing its job and the next card at
  this seat is expected to compact before it adds — the option that
  changes nothing and records the decision, which is the shape this
  project has taken before.
