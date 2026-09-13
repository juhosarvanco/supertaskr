---
id: T-295-s7
title: "The re-drill's narrow scope runs the owning spec whole against the integration checkout while the merge is STAGED, so every body that dispatches against that checkout reds COULD NOT RUN and the drill reports REDS MORE THAN ITSELF for a mutant that killed only its own body"
feature: F-04
milestone: 4
size: S
priority: 2
status: parked
wake: T-284
suggested_by: "the seat (2026-09-10): at the T-296 merge, the first through the verb, both assigned corrections' bodies redded under their mutants and three unrelated bodies of brief.spec.ts redded COULD NOT RUN beside them; the same three passed at the bench tip and failed on the merged tree without any mutant — the difference was .git/MERGE_HEAD"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

`brief.mjs --merge T-296` ran twenty-four steps green and stopped at `drill:1` with "the mutant REDS MORE THAN ITSELF", naming the assigned body and three others: the arm-versus-hand-steps body, the dry-run body and the bench-arm body of brief.spec.ts. Run again on the merged tree with no mutant planted, the same three redded with `brief: COULD NOT RUN` (exit 3) from the arm they drive; run at the bench tip, where no merge is staged, the same three passed. The drill's scope is the owning spec whole, run in the integration checkout with the merge staged — and a body that performs a real dispatch against that checkout meets a tree mid-merge. The refusal was therefore about the drill's own conditions, not about the mutant's containment, and the seat ruled it through by hand.

## Acceptance criteria

- WHEN the re-drill runs a body that drives the arm against the checkout THE drill SHALL run it where no merge is staged — a `git clone --shared` of the staged tree under the scratch stem, or the bench — or SHALL exclude from "reds more than itself" any body whose failure is the arm's own COULD NOT RUN over the staged merge, naming it as an environmental red rather than a kill.
- WHEN a body reds under the mutant AND reds without it THE drill SHALL say so by name before calling the mutant uncontained; a body in merge.spec.ts SHALL show a staged-merge fixture where an unrelated body's COULD NOT RUN does not turn a contained mutant into a refusal.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; the narrow re-drill runs the owning spec against a staged checkout, so every dispatching body reds could-not-run.
