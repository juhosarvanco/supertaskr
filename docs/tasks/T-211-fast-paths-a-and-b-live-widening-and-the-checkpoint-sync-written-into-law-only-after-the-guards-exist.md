---
id: T-211
title: FAST PATHS A AND B — live fence widening and the checkpoint sync, written into the method only after the guards that make them safe exist
feature: F-06
milestone: 4
priority: 2
size: M
status: building
blocked_by: [T-209, T-212]
touches: [method/lane-protocol.md, method/roles/executor.md, method/roles/integrator.md, method/tasks/TASK-FORMAT.md, docs/CONVENTIONS.md]
suggested_by: "@human's two questions on the fence design (2026-08-31): what a lane does when it discovers an out-of-fence need mid-flight, and whether waiting on another lane can ever be sound; mechanics by peer session nputer-10; accepted by the architect seat"
builder:
review: independent
---

**THE BASE PROTOCOL IS ALREADY LAW AND STAYS THE FALLBACK OF BOTH
PATHS**: an executor that discovers an out-of-fence need builds
everything in-fence, routes the discovery naming the exact paths and the
fence it needs, and exits (`roles/executor.md`, `lane-protocol.md`
rule 5). The two fast paths below are optimizations layered on that
law — **no lane ever blocks idle, anywhere in this design.**

## Fast path A — live widening, when nothing overlaps

The executor asks, naming exact paths and why; **PARKS that edit and
KEEPS BUILDING**. The architect runs `T-209`'s `--intersect`; if the
paths are clear of every live lane, it amends `touches:` on the card
**ON MAIN, committed there — where `T-212`'s gate reads it, on a ref
the lane cannot move** — and re-runs `--write-fence`: the same
mechanical act as dispatch, never a different one. **THE GRANT IS THE MANIFEST ON DISK**: the executor
proceeds only when its own read-back of `.nputer/lane-fence.json` shows
the new path, never on a reply — the cross-session channel has
demonstrably dropped a message that reported delivered; a file read
cannot. No grant by the time in-fence work runs out → route as usual.

## Fast path B — the checkpoint sync, when the blocker lands in time

After the overlapping lane merges, checkpoints, and its worktree is
removed — so the intersection now passes — the architect **DRY-RUNS the
sync with `git merge-tree --write-tree`**, already this project's
range-rule instrument, `$?` read first. **THE EXIT IS TYPED: 0 is
clean, 1 is CONFLICT, and above 1 is neither — it is UNKNOWN, the
instrument itself failed. UNKNOWN ROUTES rather than proceeds, and
MUST NOT fire the tripwire**: a conflict here is evidence of a breached
invariant, so a miscast instrument failure would send a seat hunting a
fence violation that never happened — worse than a missed conflict.
Clean, as the guards make it → widen the fence → the lane merges **THE
CHECKPOINT COMMIT** (subject opens `Checkpoint:`, `T-182` — the sync
target is derived, not remembered) into its branch.

**ALL-OR-NOTHING.** Never a partial file pick: a mixed base makes the
lane's green a claim about a tree that will never exist, and the only
files worth picking are the ones the lane depends on — exactly where
the risk lives, so the safe subset is the worthless subset. **And never
a conflict resolved as `ours`**: a merge commit is a CLAIM of
reconciliation, so `--ours` silently reverts the landed lane's work at
final merge — an exit 0 for a reconciliation nobody performed. After a
clean sync, the lane's diff and every gate derivation recompute against
the new merge-base — which is also what keeps `T-212` from charging the
lane with main's paths.

**THE TRIPWIRE.** With `T-199`, `T-209` and `T-212` enforced, disjoint
enforced write-sets cannot textually conflict — so a conflicted dry-run
is not bad luck, it is EVIDENCE an invariant was breached somewhere.
Route and investigate; never resolve locally, which buries the
evidence.

## The two riders — written law this design owes elsewhere

**Post-sync division of labor** (`roles/integrator.md`): breakage after
a clean sync is the LANE's work by construction — adapt in-fence; a fix
needing out-of-fence paths re-enters fast path A, which now passes; a
red the lane did not cause is attributed against the clean checkpoint
commit and ROUTED. The integrator's existing law (`integrator.md`
95–135) already orders AUTHORITY before the parent test, and its repair
examples — a figure, a fixture, a count, a citation — are ALL
MECHANICAL. The rider makes the code half explicit: **a BEHAVIORAL
defect the merge introduces is a lane write the integrator does not
hold — the merge is REFUSED and the finding filed, never patched at a
seat with no lane, no fence, and no verifier.**

**Pin reconciliation** (`docs/CONVENTIONS.md`): one sentence into the
integration ritual — **dogfood-pin reconciliation is integration-seat
work; a lane never updates the pins** — the rule both seats have been
applying from memory across every merge that moved a count.

## Why `blocked_by: [T-209, T-212]`

A fast path written into the method while nothing computes the
intersection is a memory-checked widening — the exact decayed
instrument this whole cluster replaces — and law that lands before its
enforcement is a false document (`T-209`'s narrowing argument, same
shape). The law lands when the guards it cites exist.

## Acceptance criteria

- `method/lane-protocol.md` SHALL carry both fast paths: each with its
  fallback named, the manifest-as-grant rule, the all-or-nothing rule
  with the `--ours` refusal and its reason, the merge-tree exit typing
  (0 clean / 1 conflict / above 1 UNKNOWN — and UNKNOWN routes, never
  proceeds, never fires the tripwire),
  and the tripwire semantics.
- `method/roles/executor.md` SHALL carry the ask protocol: park the
  edit, keep building, proceed only on manifest read-back, route when
  in-fence work runs out.
- `method/tasks/TASK-FORMAT.md`'s widening clause ("widen the fence
  BEFORE dispatch") SHALL gain the mid-flight arm: a LIVE lane's fence
  is widened only through a card amendment COMMITTED ON MAIN plus
  `--write-fence`, with `T-209`'s intersection passing — the same
  mechanical act as dispatch, never a chat grant, and on the ref
  `T-212`'s gate reads.
- `method/roles/integrator.md` SHALL gain the behavioral-refusal
  sentence, placed against the authority ordering, ONLY IF the
  executor's own reading of the whole section confirms it extends
  rather than contradicts — **a contradiction is ROUTED, not resolved
  in-lane.**
- `docs/CONVENTIONS.md` SHALL carry the pin-reconciliation sentence in
  the integration ritual.
- NO tooling is owed: `--write-fence`, `--intersect` (`T-209`) and
  `merge-tree` are built by this card's blockers or already standing
  practice. If the executor finds otherwise, that is a ROUTED finding,
  not scope.
- THE docs gate SHALL be asked with the lane's changed paths as
  separate literal arguments, and every suite it names SHALL be green
  at the lane's tip.
- `review: independent`, set at filing — this card writes law every
  future seat obeys; a misstatement propagates to every project the
  method creates (`T-145`).
- Verification: headless.

## Read beside

`T-209` (the intersection the widening runs), `T-212` (the landing gate
whose merge-base rule the sync depends on), `T-210` (the physical layer
that must drop around the sync — its event 3), `lane-protocol.md:182`
(rule 5, the law the base protocol already states), `T-182` (the
checkpoint-subject rule that makes the sync target derivable), `T-207`
(why a resolution must be a mechanism), and the six-for-six measurement
inside rule 5 — the reason neither fast path ever decides anything on
tokens.
