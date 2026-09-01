---
id: T-211
title: FAST PATHS A AND B — live fence widening and the checkpoint sync, written into the method only after the guards that make them safe exist
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
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

## Implementation notes (executor, 2026-09-01)

Base `9d56b47402c8b5c55b36f35e8da1d6f2a7f418de`; branch
`task/T-211-lane`. Every figure below carries the ref or the
time-and-host it was taken at.

### What landed, by file

- **`method/lane-protocol.md`** — a new section, *The two fast paths —
  when a fence has to move while a lane is live*, placed after *Why the
  branch carries the dispatch stamp and the lane does not* and before
  *The revert play*. A SECTION and not an eighth rule: rules 1–7 are
  per-lane invariants, these are plays, and rule 5 is already the
  longest thing in the file. It carries both paths with the base
  protocol named as the fallback of each, the manifest-as-grant rule,
  the two-writes finding, all-or-nothing with the `ours` refusal and its
  reason, the merge-tree exit typing, and the tripwire with its own
  holes published.
- **`method/roles/executor.md`** — step 3 gains the ask protocol: park
  the edit, keep building, proceed only on the lane's own read-back,
  route when in-fence work runs out, and write neither half of your own
  grant.
- **`method/tasks/TASK-FORMAT.md`** — the widening clause (*A CRITERION
  MAY NOT ORDER WORK OUTSIDE ITS OWN CARD'S `touches:`*) gains the
  mid-flight arm, plus the sentence that a card being outside every
  fence is not a licence to move this one field from inside the lane.
  Names no paths and no commands, which that file requires of itself
  twice.
- **`method/roles/integrator.md`** — step 3 gains the behavioural
  refusal, placed immediately after the authority ordering it extends.
- **`docs/CONVENTIONS.md`** — the pin-reconciliation sentence inside
  GRAPH REGEN's *WHY THE CHECKPOINT AND NOT THE MERGE* clause, which is
  where that bullet already names the two dogfood fixtures a checkpoint
  reconciles, with an explicit boundary against DECLARING A COMPONENT
  above it.

### Three things the card says that the repository does not — all measured

1. **`T-209`'s `--intersect` is not a flag.** `brief.mjs`'s frozen
   `FLAGS` list at this base carries `--task --role --root --state
   --dispatch --card --audit --preflight --write-fence --full --help`
   and no `--intersect`. The intersection is `laneDisjointness` in
   `tools/e2e/scripts/lane-fence.mjs`, called as the LAST guard inside
   `buildLaneFence` — so `--write-fence` refuses to write a manifest at
   all when the fence overlaps a live lane. **The criterion "NO tooling
   is owed" therefore HOLDS**: nothing is missing, the card's spelling
   is wrong. The law is written to the real mechanism — the widening IS
   the re-expansion, and the intersection is a step nobody can skip
   rather than one somebody performs.
2. **"on a ref the lane cannot move" is retracted by the guard that
   sentence cites.** `.claude/hooks/landing-gate.mjs`'s own header says
   it asserted exactly that and that it is false: `git branch -f`
   carries the checked-out-elsewhere guard, `git update-ref
   refs/heads/main <sha>` does not and was accepted, reproduced twice.
   `T-223` owns the fix. The law here therefore says the landing check
   reads the fence from the integration branch — where a legitimate
   widening lands — and claims no absolute about reachability.
3. **The merge-tree exit typing in the card is wrong in the costly
   direction.** Measured at git 2.50.1 (Apple Git-155) on a throwaway
   repository: a clean forecast exits 0 with a tree oid on stdout; a
   real conflict exits **1** with the tree oid THEN the conflict lines;
   **a ref that does not exist also exits 1**, with an EMPTY stdout and
   the complaint on stderr; an unknown option exits 129. So "1 is
   CONFLICT, above 1 is UNKNOWN" would route an instrument failure into
   the tripwire — the exact harm the card names, arriving through the
   code the card declares safe. The law uses the OUTPUT with the code:
   the forecast ran if and only if it produced a tree. That is
   docs/STATE.md's own standing reading rule applied to one more
   instrument, not a second rule. **Routed as `T-211-s1`** for the
   RANGE RULE's copy of the same spelling, which is untouched here and
   outside this card's criteria.

### The drill — the two-acts finding, and it is sharper than the ask

`.claude/hooks/lane-fence.mjs`'s `decide` reads the card with
`readFileSync(path.join(root, manifest.card))` where `root =
findCheckoutRoot(path.dirname(abs))` — the checkout the WRITE LANDS IN,
which for a lane's own write is the lane worktree — and compares that
line against `manifest.touchesLine`, which `buildLaneFence` stamped from
the INTEGRATION checkout's copy. Two readers, two places.

Driven rather than reasoned: a synthetic lane checkout in this session's
scratchpad (`.git` file → gitdir with `HEAD` on a `task/T-…-lane` ref, a
manifest stamped from the WIDE line, a card carrying the NARROW one),
`decide` called directly.

| state | target | verdict |
|---|---|---|
| act one only | the newly granted path | **block** `stale-stamp` |
| act one only | a path the lane ALREADY held | **block** `stale-stamp` |
| both acts | the newly granted path | allow `inside-the-fence` |
| both acts | a path the lane already held | allow `inside-the-fence` |
| both acts | a never-granted path | **block** `outside-the-fence` |
| both acts | the card's own file | allow `always-writable` |

**The second row is the finding.** A widening delivered to one reader
out of two does not fail to grant — it stops the lane dead on paths it
was already building in. Rows five and six are the positive control: the
fence still refuses what it was never widened to, and the card's own
directory stays writable throughout, so row one is a refusal rather than
an absence.

No test body was added or changed by this diff, so the POISON DRILL is
**not owed**; the drill above is the card's own verification and its
restoration is trivial (nothing in the repository was mutated — the
whole drill lives in the scratchpad).

### For the verifier

- The integrator sentence was written only after reading that whole
  section. It **extends**: the section's own *ASK WHO MAY WRITE THE FIX
  BEFORE YOU ASK WHEN IT BECAME FALSE* already subordinates the parent
  test to authority and already rules that *a defect you may not write
  the fix for is FILED whatever its vintage*; every repair it names is
  mechanical (a figure, a fixture, a count, a citation); and step 2
  calls the post-merge suite the integrator's *"problem to catch"*.
  Nothing there says who repairs a BEHAVIOURAL break. No contradiction
  was found, so nothing was routed under that criterion.
- **This card's `status:` line will conflict at the merge, and it is
  nobody's mistake.** The base `9d56b47` carries `planned`, the
  integration branch carried `building` at `a014b81a` (the dispatch
  stamp landed after this lane was cut), and this lane now carries
  `verifying`. That is the latent two-writer case
  `tasks/TASK-FORMAT.md`'s dispatch-stamp bullet describes; the
  resolution is `verifying`, which is what the merge is supposed to
  carry.
