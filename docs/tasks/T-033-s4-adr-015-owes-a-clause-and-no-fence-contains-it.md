---
id: T-033-s4
title: ADR-015 still owes its half of T-033's clause, and docs/decisions/ sits in no component's paths and no card's fence
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

T-033's criterion 5: *"THE ADR-015 / C-07 WORDING SHALL BE RECONCILED per
decision (3), in the same change as the registry edits — one clause in
each document."* The C-07 clause is written on this branch. The ADR-015
clause is not, for two reasons that are worth separating.

## 1. THE ARM WAS NEVER CHOSEN

Decision (3) offers (a) the crate formally owns the reality-side join
while TypeScript owns the intent⨝tasks half, (b) `arch` moves to the Node
CLI when C-02 exists, (c) keep both and pin their agreement — which is
T-059. The pick was to be recorded in the card before dispatch and was
not (`T-033-s1`). An executor choosing it would be writing an ADR clause
by inference, and the choice has a consequence the card spells out:
**T-059 is `blocked_by: [T-033]` and dissolves entirely under (b)**, so
the ruling decides whether a planned milestone-4 card exists.

What the C-07 edit on this branch does and does not do, stated so nobody
reads it as the ruling: it deletes a sentence that was **false**, not one
that was contested. *"Emitting graph.json is its entire job (parsing and
derivation live in TypeScript)"* stopped being true on 2026-08-17 when
T-014 shipped `arch` and `arch drift` — a reality-side join in Rust —
and ADR-015's own dated addendum from that same day already says so
(*"ADR-015 stands — derivation is TypeScript, and the binary's join is a
reader"*). Correcting a factually false signpost is the T-010 precedent;
deciding who OWNS the join is not, and is left open in the file by name.

## 2. NO FENCE IN THIS PROJECT CONTAINS `docs/decisions/`

This is the part worth writing down beyond T-033. `docs/decisions/` is
claimed by **no component's `paths:`** — C-01 is `method/**`, and nothing
else reaches under `docs/` except the architecture registry — so no
`touch_slugs:` entry, and therefore no task fence, can name it. T-033's
own fence spells `docs/architecture/components/` as a literal path, which
is the only way a card has ever reached a `docs/` subtree, and it does
not cover `docs/decisions/`.

**And the practice matches.** Every commit in this repository's history
that has ever touched `docs/decisions/` is a CHECKPOINT, a PROMOTION or
the milestone-0 baseline — `d77a33e` (T-014 checkpoint, which is where
ADR-015's addendum was actually written), `2f978cc`, `98bd575`, `0aa320c`,
`c1cec7b`, `85b5b73`, `a6959d0`, `ef50d74`, `8bde5b8`, `1e757b6`. **No
executor lane has ever edited an ADR from inside a worktree.** That is
consistent with ADR-004 and with the map's own maintenance contract
(*"the integrator regenerates, the ARCHITECT rules"*), and it means
criterion 5's "in the same change" is asking a lane for something the
lane cannot hold.

## SUGGESTED

Either (a) rule decision (3) and write the ADR clause at the next
checkpoint or promotion, where every previous ADR edit has been written —
in which case this needs no card, only the ruling; or (b) if ADR clauses
are meant to be reachable from a lane, give `docs/decisions/` a fence
word the way `docs/CONVENTIONS.md` and `method/` already have one, and
say so in ARCHITECTURE's slug paragraph. Doing neither leaves a standing
criterion shape — "amend the ADR in the same change" — that no fence can
satisfy, and the next card to carry it will hit this again.
