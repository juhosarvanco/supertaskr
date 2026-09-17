# Checkpoint: the grant leaves the shipped template — T-344, T-332, T-335 and T-295-s8 merged; a dispatch grant revision stops costing a publication; the docs-input gate goes 9.35x; method 0.1.35

Written by the architect seat overnight on 2026-09-17, working the
dispatch order the owner ruled the evening before. Four merges, two
pushes, all four verdicts APPROVED WITH ASSIGNED CORRECTIONS.

## What happened, in order

1. **T-344 merged at `be9726f1`.** The active dispatch grant leaves
   `method/runtime/supertaskr.yaml` for one authoritative untracked store
   in the designated integration checkout. Twelve paths, one conflict,
   resolved to the lane's side whole.
2. **The method stamp reached v0.1.35** on test 1, SHIPPED BYTES: the
   runtime template is in `KIT_FILES` and this card empties its block.
   Three stamps moved together; the pin test read 21/0 on the bumped tree
   and the HALF-BUMP drill reds it by name.
3. **The grant was migrated, then revised.** Revision 4 carried verbatim
   out of the template at `fa029bd7`; revision 5 recorded an hour later
   for a fence widening. **Revision 5 ran no suite, made no commit, pushed
   nothing and started no CI run** — the first grant revision on this
   board that cost nothing.
4. **T-332's fence took a sixth path** in a ONE-FILE commit, where every
   previous widening here moved two.
5. **T-335 was promoted out of `suggested`** — the preflight refuses a
   `suggested` card by name, exactly as that card's own filing provenance
   predicted — and dispatched.
6. **T-295-s8 dispatched** into the opening T-344's merge created.
7. **T-332, T-335 and T-295-s8 merged** at `49bf7d16`, `48f04ba4` and
   `8bf18a29`, then one battery over the whole range and one push.

## Measured

- T-344's merged tree: parser 454 · app 1171 · rust 662/18 · e2e 1233
  passed, 0 failed, 22.7m. CI green in 36m 58s.
- The three-merge range at `8bf18a29`: parser 454 · app 1171 · e2e **1153
  passed, 0 failed, 11.3m**, zero failure marks. The whole battery ran in
  11m 31s.
- **T-332: the docs-input gate spec 760.72 s to 81.35 s — 9.35x**, the
  verifier's own figure, n=3, taken with a shim installed from outside the
  spec. Gate launches reaching the tree 23 to 3; corpus walks per launch
  14 to 7. No cache and no memo: the repeats were structural.
- **T-335:** a range moving a parser source alone went from 0 specs to 2,
  of a 42-spec census — a proper subset, not a leg.
- **T-295-s8:** 592 pairings of real leg claims against producible
  observed scopes gave 436 unknown, 156 different, **0 same**.
- Census 117410 -> 120697 across the four merges. The graph is CURRENT and
  never moved after T-344: `graph.json` carries zero `tools/e2e`.
- Method evals: model-free exit 0 over 13; the model-in-loop set did not
  run, so the bump is not gated on it.
- Pushes: 8 s, 9 s, 8 s. CI: 26m 25s, 36m 58s, and the third still running
  at this record.

## Hazards recorded this day

- **`gate-run` keys its verdict token to HEAD's tree at run time.** A
  battery on a STAGED merge attests to the PRE-merge tree and the push
  guard refuses it, correctly. Budget two batteries at a merge.
- **A fresh worktree has no `app/dist/assets`** and fourteen app bodies
  REFUSE rather than skip, with titles that read like staleness.
- **Absorbing a fence widening into a lane's card is the SEAT's write.** A
  lane that can move its own `touches:` line can grant itself any fence.
  T-332's executor declined twice, the second time against an explicit
  instruction of mine, and was right both times.
- **A mutant block is a record other people act on.** T-335's first blocks
  were unfenced, named the SPEC where every mutant plants in the SCRIPT,
  and carried an empty `new` anchor; the verb's refusal stopped a mutant
  being planted in a file it was never meant to touch.
- **The counts gate refused this very batch on the defect T-295-s8
  removes** — a verdict's whole-leg 714 against a one-spec drill's 51 —
  because the verb loads its own code at start. The merged tree's own step
  answers THE SCOPES DIFFER on the identical inputs.
- **The dispatch brief states a size for `docs/CONVENTIONS.md` that is not
  that file's size** (160099 against 13662) and derives a percentage from
  it. Found by a lane, confirmed by the seat, routed.

## Decisions awaiting the owner

All four are written up in `supertaskr-evidence/plans/`, and each now
costs a sentence rather than a publication cycle:

1. **T-311 and T-314 are `suggested` and block five of the eight remaining
   grant cards** — the whole T-312 chain and T-244-s1.
2. **T-320's demonstration needs one yes** — authorizing the express card
   T-345 into the order. Four of five eligibility criteria are MET today.
3. **T-204's disposition** — refusal 3 does not exist at all (138 live
   cards carry a guard-class fence without `review: independent`, and two
   preflight green); what remains is one unproven scan-breadth property.
4. **The `supertaskr-app` worktree** — 870 commits behind, clean, nothing
   unpublished, 3.2 GB of rebuildable artifacts. Prepared, not removed.

## Next up

T-205-s5 is the only unblocked grant card left, and it collides with T-204
on `dispatch-brief.mjs` and `brief.spec.ts`, so those two run in sequence
and never beside each other. Everything else waits on the four decisions
above.

## Two of tonight's hazards were already written in the standing read

Worth more than the hazards themselves. Both mistakes that cost me time
are already in `docs/STATE.md`, in the section that exists to save the
hour, and I hit them anyway:

- *"a COMMIT or a staged merge during the run UNKEYS the token"* — I ran
  a full battery on a staged merge and the push guard refused it. Thirty
  minutes.
- *"a widening is the seat's, both halves"* — I told T-332's executor to
  absorb a fence widening into its own card. It declined on the
  precedent, twice, and was right.

So this is not a case for adding two bullets to STATE. It is a case about
READING it. The standing read is two documents and it already held both
answers; what failed was my consulting it at the moment each applied
rather than after.

## STATE.md is over its warn line and owes a compaction

`docs/STATE.md` is **8807 bytes against its 8465-byte warn line** (fail at
10158; `lint:docs` exits 0 and reports budgets holding). The contract says
that when the band warns, content MOVES to the record or a card and a
hazard is never deleted to fit. I checked every section for an INSTANCE
that could move and found almost none: "Live right now" is derive commands
throughout, and every standing hazard is a mechanism rather than a thing
that happened. What this file needs is a deliberate compaction pass
against `docs/STATE-template.md`, not a hurried trim at the end of a long
session, so I have left it correct and over the line and said so here.
Filed for the next card batch.

## A note on the meters

`meters.jsonl` gains nine records for this batch, and they are **assembled
by the integrator rather than written by the seats**: no report or verdict
in this batch carried a `## Meters` block. Each record says so in its own
first line. T-297 is blocked on this capture, so an honest assembly seemed
better than four merges of silence — but it is not the thing the block
was meant to be.
