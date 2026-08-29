---
id: T-092-s2
title: The CONVENTIONS seat has 280 bytes of warn headroom at this base, so the budget is now the scheduler for every card queued behind it
feature: F-01
milestone: 4
priority: 7
size: S
status: rejected
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5 @T-092
builder:
verifier:
built_by:
verified_by:
review:
---

**DISCHARGED AT THE AMNESTY MERGE, NOT DECLINED (2026-08-29,
integrator, cc5389b).** This card's own "What would close it" names
three routes and says the choice belongs to whoever owns ADR-019.
Route two — an addendum raising the line with a measured reason — was
taken at the T-154 checkpoint, AFTER this triage's base (47979ee) and
BEFORE its merge: ADR-019 Addendum 3 (commit 0d82a60) re-landed
docs/CONVENTIONS.md at 110,342 bytes, ruled all growth rule text, and
re-derived warn 137,928 / fail 165,513 into DOC_BUDGETS in the same
commit. Re-derived at the merge ref: **headroom is 27,586 bytes, not
280** — the promotion below was correct at its base and closed by work
it could not see. The two cards this blocked (T-111-s10, T-147) are
unblocked with this citation on their bodies. What survives is the
CLASS — headroom that moved 12,323 -> 919 -> 280 -> 27,586 across four
refs wants a standing band, not a fresh card per excursion — routed to
T-156 as a dated rider.

**PROMOTED at the amnesty triage, 2026-08-29, with the figure
RE-DERIVED — and it has got worse, not better, since it was filed.**

    wc -c docs/CONVENTIONS.md                    107,687
    DOC_BUDGETS warn (tools/e2e/scripts/docs-gate.mjs)  107,967
    headroom                                         280 bytes

The card measured 919 bytes at T-092's tip. ADR-019's phase-5 compaction
cut the file from 99,212 to 86,373 and the budget lines were re-derived
from that landing; the file has since grown back past the compaction's
own target and now sits **280 bytes** under the WARN line. Derive it
again at your own ref rather than quoting this: the gate is the
authority and it is the thing that will announce it.

**THIS IS NOW A BLOCKER, NOT AN OBSERVATION.** `T-111-s10` is planned
against this seat and carries SIX earned sentences for one bullet — the
walked target directory, what restoring a fixture MEANS, the Date-versus-
seconds measurement, the self-healing property, the demoted empty-diff
proof, and two poison-shape corrections. It cannot land under this
headroom, and it is `blocked_by: [T-092-s2]` for that reason. `T-104-s5`
(parked) catalogues the rest of the queue at the same seat and warns that
its own list is a transcribed census.

**AND THE FINDING BEHIND IT STILL STANDS**: one card consumed 93% of the
headroom that was supposed to serve every card at that seat, and the
additions were MECHANISM, which ADR-019's own rule forbids deleting to
fit — *a hazard is never deleted to fit*. The instance measurements
already moved out to the cards that own them; that lever is spent.

## Acceptance criteria

- THE lane SHALL re-derive `wc -c docs/CONVENTIONS.md` against
  `DOC_BUDGETS` at its own ref and report both, before and after.
- THE lane SHALL take ARM 1 — a second compaction pass on ADR-019's own
  terms: per-merge instance detail accumulated since the first pass
  moves to `docs/checkpoints/` and to the cards that own it, and the
  `landed` figure is re-measured so `warn`/`fail` re-derive from it.
  NO HAZARD SHALL BE DELETED TO FIT; a hazard that cannot be compressed
  is moved with its mechanism intact.
- IF compaction cannot reach a headroom that admits the queued edits
  THEN the lane SHALL STOP and route ARM 2 — an ADR-019 addendum raising
  the line with a measured reason — to the architect, rather than
  raising a budget from inside a lane. Raising a budget line is not a
  thing a lane widens its own fence to do.
- THE lane SHALL NOT take ARM 3 (rule that the warn line is doing its
  job and each card compacts before it adds) silently. It is a
  legitimate outcome and it is a RULING: if it is taken, it is written
  down, and the queued cards are told.
- WHEN the pass lands THE queue at this seat SHALL be re-derived, not
  read off `T-104-s5` — that card says so about itself.

## The record, kept verbatim

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

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
