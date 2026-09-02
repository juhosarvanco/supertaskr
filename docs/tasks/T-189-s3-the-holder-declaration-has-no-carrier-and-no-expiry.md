---
id: T-189-s3
title: The holder declaration T-189 rests on has no carrier and no expiry — the assembler emits no holder line, and a grant issued at dispatch is used after a verdict
status: planned
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e, method/lane-protocol.md]
review: independent
suggested_by: "verifier claude-opus-5 @V-189, 2026-08-31 — measured at 59a6d32 while approving T-189; not a defect in T-189's diff, which only ever narrows permission"
---

`T-189` conditions size-S self-integration on **holding the integration
checkout**, and rules that the holder is *"DECLARED AT DISPATCH AND NEVER
INFERRED"* (`method/lane-protocol.md` rule 4). That is the right
variable. Two things the clause names as its carrier do not yet exist,
and both were measured at `59a6d32`.

## 1. THE CARRIER IS NAMED AND IS NOT THERE

Rule 4 says the declaration travels in the brief's deliverable row: *"The
brief's deliverable row already owes* explicitly whether to merge
*(roles/executor.md), and that answer is the holder and the handoff."*

`deriveDeliverable` in `tools/e2e/scripts/dispatch-brief.mjs:2040` emits
exactly four things: the matching ceremony CELLS, `numberedStep(
executor.md, 6)`, and `numberedStep(lane-protocol.md, 6)`. Derived at
`59a6d32` by reading ROW 11 of `node tools/e2e/scripts/brief.mjs --task
T-189`: **no holder line is emitted, and no card field carries one.**

So the declaration is still the hand-written sentence in a dispatch
prompt — which is the act `T-189` was filed from (*"four briefs said it
from memory and a lane had to report the conflict"*). `T-189` makes that
sentence a TRANSCRIPTION rather than an override, which is the repair it
claimed; it does not make it DERIVED. `roles/orchestrator.md` 5b already
rules the general form: *"A rule that depends on a reader remembering has
a failure mode; a rule that depends on a construction does not."*

**This is materially mitigated and must not be overstated.** Under
`T-189` a FORGOTTEN declaration now fails SAFE — *"a lane that was not
told does not take the seat"* — where before it failed dangerous. The
residual is a missing construction, not a live collision.

## 2. THE GRANT HAS NO EXPIRY, ON THE ONE ROW WHERE IT MATTERS

The declaration is issued at dispatch. On the `S, touching shipped code`
row the merge happens **after a verdict**, hours or days later. Nothing
in rule 4, rule 6 or either ceremony cell gives the grant an expiry, a
revocation, or a re-confirmation point.

The reachable state: a dispatcher legitimately declares holder = lane;
the card goes to a verifier; while the verdict is pending the dispatcher
picks the integration checkout back up for other work; the verdict lands
and the lane merges on a grant that was true when issued and false when
used. Two seats in the checkout — the collision `T-189` exists to
prevent.

There is also a live tension in the text about which tense governs. The
ceremony cell reads *"once the verdict is in AND **while it holds** the
integration checkout"* — a present-tense condition at the moment of
acting. Rule 4 reads *"declared at dispatch and **never inferred**"* — a
past-tense grant. A lane cannot satisfy the first without doing the
second. **The two sentences do not say which governs at merge time**, and
ROW 11 hands the lane the present-tense one.

## Acceptance criteria

- THE holder SHALL have a carrier the assembler can emit — a card field,
  a fence-manifest entry or an equivalent — so ROW 11 states the holder
  rather than leaving it to the prompt.
- WHERE the holder is not derivable THE brief SHALL say so explicitly
  rather than printing a deliverable row that is silent on it.
- THE contract SHALL rule which tense governs at the moment of merge, and
  IF a grant can go stale THEN it SHALL name the re-confirmation point —
  for the verifier row specifically, since that is where the gap between
  declaration and merge is longest.
- THE resolution SHALL NOT reintroduce a lane-side inference of solitude;
  `T-189` refused that on measurement and the refusal stands.

## Fence

`method/lane-protocol.md`, `method/tasks/TASK-FORMAT.md` (if a field is
added — that file owns fields), `tools/e2e/scripts/dispatch-brief.mjs`.
Note `TASK-FORMAT.md` is a `KIT_FILES` entry, so a card touching it is
*touching shipped code* and owes both a verifier and `cargo test`, which
no gate trigger names.

## Read beside

`T-189`'s implementation notes, `method/lane-protocol.md` rule 4's
STANDING-NOT-THE-SEAT clause, `roles/orchestrator.md` 5b, and `T-189-s1`
(which pins the clause; this card supplies the thing to pin).

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Placement fields written at the seat** (F-06, m4, p3, S,
`[tools/e2e, method/lane-protocol.md]`, review independent).
**RULED, so the lane does not have to**: the carrier is the brief's
deliverable row (row 11), which the assembler emits as a HOLDER line —
whether this lane holds the integration checkout, yes or no — and prints
NOT DERIVED where it cannot say; the grant holds from dispatch until the
verdict lands, and the dispatcher re-confirms it in the message that
sends the verdict, so no lane infers solitude at any moment. No new
frontmatter field.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
