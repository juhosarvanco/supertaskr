---
id: T-160
title: Dispatch preflights the card itself — every derivable claim re-derived at HEAD before a seat is paid for, because the card is the last input the pipeline still trusts on its author's word
feature: F-04
milestone: 4
priority: 3
size: M
status: building
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: "@human (2026-08-29): is there a step when a task is started that makes sure the task is doing work we want it to do — that the task and its description is up to date and makes sense?"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT @HUMAN'S DIRECT REQUEST (2026-08-29), planned at filing.**

The dispatch derivation checks that a card is STARTABLE — it exists,
its status is legal, its blockers read satisfied against live
statuses, its fence is disjoint, the base's gates are green. The
executor's step 1 checks the card MAKES SENSE — but after dispatch,
inside the lane, at lane prices. Between the two, nothing re-derives
what the card CLAIMS against the tree it is about to be built on.
"Derive at your own ref, never quote" is a gated property for the
governing documents and a prose rule for cards.

## Three measured instances from one day (2026-08-29)

- `T-127-s1` dispatched with a fence true at its writing and stale at
  dispatch — T-149 had moved both dogfood fixtures to `app-map`. The
  lane's honest stop cost ~164k tokens; a path-existence and
  fence-coverage re-derivation would have caught it pre-dispatch.
- `T-153-s2`'s card named argv as the channel; the code's own
  comments said a model never reaches argv (`validate_model`'s
  header). Found mid-build.
- `T-092-s2` was promoted on a headroom figure an intervening merge
  had mooted — caught at MERGE by hand re-derivation, two seats late.

And two instances of the check WORKING when performed by hand: the
amnesty integrator re-derived the 280-byte claim before folding, and
the T-153-s5 dispatcher read the fence manifest back before
launching — which is how the suffixed-id truncation (T-143 instances
4/5) was caught before it misfenced a third lane. The lineage:
`T-142` (an unmeasured claim acquires dispatch authority by being
handed to a seat), `T-143` (the dispatch answer lies), and the
class sentence both carry — a figure derived at one ref is not a
fact at another.

## The shape

A preflight arm beside `--write-fence` in the dispatch ritual, with
the same disposition: REFUSE with the discrepancy named, never
proceed past one silently.

## Acceptance criteria

- THE dispatcher SHALL be able to run a card preflight (an arm of
  brief.mjs or a sibling script — the seat decides, T-057 forbids a
  second copy of any derivation brief.mjs already owns) that
  re-derives, at HEAD, every claim of the card's that IS derivable:
  (a) every repository path the card names exists, or is explicitly
  a creation target; (b) the `touches:` fence, expanded through the
  live slug map, covers the paths the criteria name — the T-127-s1
  shape, fixtures counted; (c) every figure the card states WITH its
  derive command is re-run and compared; (d) each `blocked_by:` entry
  against live statuses, and any stated blocking REASON checked where
  it is derivable; (e) any ref the card stamps (`@ <hash>`) still
  resolves.
- WHEN any re-derivation disagrees THE preflight SHALL refuse the
  dispatch, printing the claim, the card's value, the fresh value and
  the derivation — the `--write-fence` refusal shape — and dispatch
  SHALL NOT proceed until the card is corrected or the discrepancy is
  ruled acceptable ON THE CARD, dated.
- THE preflight SHALL NOT judge desirability. Whether the work is
  still WANTED stays a seat's call; the tool surfaces stale facts,
  and its own output SHALL say exactly which claim classes it checked
  and which it cannot (the honest-omission rule, the capabilities
  generator's precedent).
- GUARD RULES: a planted stale path, a planted stale figure, and a
  planted uncovered criterion path must each RED the preflight
  (positive controls), and a current card must PASS (the clean twin)
  — pinned in a spec, mutants disposed per the POISON DRILL bullet.
- THE dispatch ritual in docs/CONVENTIONS.md SHALL gain the step
  (derive brief -> PREFLIGHT -> write fence -> stamp -> cut) — ONE
  sentence, minding that the dispatch bullet's opener rows are
  machine-parsed (`rawBullet` THROWS; workflow-parity pins the
  run-from set — the T-155-s1 lesson: state a limitation in place
  rather than tripping the parity pins).

## Fence note at filing

`touches: [tools/e2e]` is HELD by T-153-s5's live lane, and T-153-s6
is queued for the same seat on the CI-green path — dispatch this
card AFTER both land; the lane list is the authority, and the
CI-green sequence outranks priority 3 by @human's standing runbook.

PREFLIGHT RULING (2026-08-30): the note's "HELD by T-153-s5" is CARRIED
rather than corrected. That lane landed before this card was dispatched,
so the sentence above is false at HEAD — which is exactly the claim class
this card exists to surface, and the tool it builds refuses its own card
on it. It is not rewritten because the note is the founding evidence: the
condition it states was satisfied before dispatch, and destroying the only
copy of what the card was filed against to make a gate green is the shape
docs/CONVENTIONS.md refuses under "an unexplained file found here is
RECORDED and LEFT". This is the mechanism's own first worked example.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Fence corrected at dispatch (2026-08-30, integrator): criterion five lands in docs/CONVENTIONS.md, which the filed fence did not cover — the exact claim class this card exists to preflight, caught by hand at its own dispatch. Widened to [tools/e2e, docs/CONVENTIONS.md]; manifest rewritten and read back.
