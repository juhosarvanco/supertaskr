---
id: T-205-s6
title: "A tree home for the sealed attack set after the verdict — docs/benches/<card-id>/ committed by the integrator at the checkpoint that lands the verdict, so a verdict's digest citation resolves from the tree and MF-10 can exit 0"
feature: F-06
milestone: 4
size: S
priority: 66
status: planned
suggested_by: "T-205-s1's executor, ask-T-205-s1.md ASK 1 (2026-09-09), refused as a lane write by the architect seat and ruled a card; the card's own design question 2"
blocked_by: [T-205-s1]
touches: [method/roles/orchestrator.md, method/roles/integrator.md, docs/CONVENTIONS.md, docs/reference/07-verification.md, docs/reference/08-landing.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why

Every real digest citation on the board today (T-205-s1's count: 13) names a
BARE filename — `attack-set-T-249.md`, `attack-V-T-239.md` — that resolves
only inside the dispatching session's scratchpad. So the checker T-205-s1
builds can VERIFY nothing from the tree alone: it exits 3 UNAVAILABLE on every
real citation and says where the method expects the file. That is honest, and
it is a refusal to guess, not a verification. A home in the tree turns exit 3
into exit 0.

The home is not a lane's to create. method/roles/orchestrator.md 5c says THE
ATTACK SET NEVER REACHES THE EXECUTOR, and T-205's card says plainly that
"after the verdict is a different question than before it, which this card
has to answer rather than assume." T-205-s1's executor parked the question
(ask-T-205-s1.md, ASK 1); the architect seat refused the grant and filed this.

## The seat's recommendation (for @human to confirm before dispatch)

- `docs/benches/<card-id>/` holding the three sealed files under fixed names:
  `attack-set.md`, `ground.md` (the ground truths taken at the base ref) and
  `stamps.txt` (the sha256 lines the verdict cites).
- Written by the INTEGRATOR, in the checkpoint commit that lands the verdict —
  never before the verdict (5c holds until then), never by the lane, never by
  the verifier (whose commit is on the bench and carries the verdict only).
- A digest citation resolves against the tree home by convention: the
  checker's `--scratch` roots gain `docs/benches/<card-id>`; by T-205-s1's
  design that is one more root and no code change.
- `docs/benches/` is a record directory: never rewritten, exempt from the
  prose budgets the governing documents carry, listed with the record floors
  the integrator counts at a rename (t265's RECORD_FLOORS class).

The alternative, `.supertaskr/benches/`, is refused in the recommendation:
`.supertaskr/` holds machine state (the lane manifest, the gate token) that
is re-minted, and a sealed set is a record.

## Acceptance criteria

1. WHEN a verdict lands at a checkpoint, THE integrator commits the three
   sealed files under `docs/benches/<card-id>/` in the checkpoint commit, and
   `sha256sum -c` over `stamps.txt` in a fresh clone passes — the digests the
   verdict cites are the digests of the tree's files.
2. WHEN T-205-s1's checker is run against a verdict whose sealed set is in
   the tree, with no `--scratch` and no `SUPERTASKR_ATTACK_SET_DIR`, THE
   checker exits 0 (verified) — no code change beyond the root by convention;
   if a code change proves necessary, the card says so and routes it.
3. WHEN the executor's brief is assembled for a lane whose card cites a
   sealed set, THE brief carries nothing from `docs/benches/` for that card:
   5c holds for the lane's own set. A test in the brief's suite plants a
   `docs/benches/<card-id>/attack-set.md` and asserts the brief excludes it.
4. WHEN CONVENTIONS' bench bullet, orchestrator 5c, integrator's checkpoint
   list and reference chapters 07 and 08 are read, THE home is named once
   each with the same path shape, and the docs gate's root-anchor ledger
   tracks `docs/benches/` (it exists in the tree, with a README naming the
   rule, before the first set lands).
5. Nothing in `docs/benches/` is rewritten after it lands; the record rule
   is stated where the directory is introduced.

## Implementation notes

The first sets to land are the ones already sealed in the architect's
scratchpad for T-264, T-265, T-224, T-219-s6, T-153-s3 and T-205-s1 (their
stamps files carry the digests their verdicts cite); back-filling them is the
integrator's, at the checkpoint after this card lands, one commit, named.
