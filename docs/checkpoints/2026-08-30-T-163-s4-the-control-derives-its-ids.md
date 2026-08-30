# Checkpoint: T-163-s4 lands — the positive control derives its ids, and the live board can no longer red the suite

Date: 2026-08-30. Seat: integrator. Scope: T-163-s4 merge and close
under its own ceremony row (S, tooling — no verifier; integrator
review performed and recorded on the card); the state of the last
live lane.

## What landed

session-economics.spec.ts now follows one rule, written into its
header: **every invocation whose EXIT is graded takes a DERIVED id
(fence-disjoint from every live lane, computed through the same
fenceOverlaps the command compares with); every in-process read of
the suite's subject card stays T-157** — a read is not a dispatch
question. Three helpers (unfencedIds, recommendation, memoised
control() picking two unfenced cards with different
recommendations). No graded exit loosened — all four stay toBe(0).

The card's headline correction, kept on the card: it was filed
against `--task T-112`, and at dispatch the live red was on
`--task T-157` — three of the four spawns named it, its touches
share tools/e2e, and **the collider was the lane fixing the
defect**. The card's own prescription was unsatisfiable; the fix
covered all four spawns and was measured green ON that lane: 10/10
bodies and e2e 332/332 with two lanes live, against 2 failed/8
passed at the base. Board sweep at 8ebbb08: 246 of 357 cards
fence-disjoint, 246 of 246 exiting 0 — disjointness fully predicts
the exit.

Drill: 3 one-sided mutants (constant advisory block; inverted
unfencedIds; constant RECOMMENDED SEAT line), all killed, the third
killed ONLY by the new strengthened assertion — the strengthening's
proof. Restorations sha256-proved. Gates at the merged tree: e2e
332/332 exit 0 WITH T-025-s4's lane live, typecheck/lint:tokens/
lint:docs 0, parser issues 0, graph CURRENT (tools/e2e is outside
the walk). capabilities:check red attributed to T-153-s8 (identical
figures at base, zero CAPABILITIES bytes moved by this diff).

## The class, closed

This is the end of the live-lane e2e red class as a recurring
integration hazard: T-143-s1 carried it, T-160-s4/T-162-s2/
T-168-s1/T-163-s4 refined it, and today it redded twice more
(T-154-s2's lane, then this card's own) before the fix landed. From
this merge on, a live lane cannot red session-economics by holding a
fence. T-163-s5 (suggested, from this lane): brief.spec.ts's two
[CLEAN, FOUND] sites are the same class discharged by loosening —
next sitting's food.

## Board and in-flight

T-163-s4 done (verified_by: claude-fable-5@integration-seat under
the tooling ceremony row; integrator review on the card). ONE lane
remains: T-025-s4 (verifying, tip f1fc352, blind verifier RUNNING —
the session's last in-flight item before the seat hands over to the
new architect session per @human's instruction). Its verdict, merge
and record close this session's ledger; note for that close: its two
constants move graph headroom 926 → ~410.
