---
id: T-220
title: THE MARGIN GUARD COMPARES TWO LIVE READS OF A BOARD THAT MOVES — cutting one verifier worktree mid-run reddened a lane's own gate, and the mover was the seat dispatching that lane's verifier
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: "T-167-s9's executor, which met the red, refused to re-run it, and attributed it from a stable triple-read plus the worktree evidence; confirmed at the architect/integrator seat, whose own dispatch was the cause"
builder:
review: independent
---

**A LANE'S FINAL e2e CAME BACK RED AND THE CAUSE WAS THE SEAT DISPATCHING
ITS VERIFIER.**

    gate-verdict suite=e2e exit=1 bodies=409 ref=07831da verdict=RED
    brief-flush.spec.ts:337 THE MARGIN GUARD
      --task T-133: spawnSync received 49197 bytes
                    where the file destination received 49183

## The mechanism, confirmed at the integrator seat

`THE MARGIN GUARD` reads each live arm **twice** — once through
`spawnSync`, once redirected to a file — and requires the two to agree.
`--task T-133` **renders the lane list**, and the lane list is
`git worktree list`, which is **MACHINE-scoped, not checkout-scoped**.

So any worktree created or removed between the two reads changes the
second one. Measured at this seat while writing this card: `--task T-133`
carries **19 worktree/lane lines**, and the same command now answers
**49,400 bytes** — 203 more than the lane measured — because two further
verifier benches were cut in the interval. Stable across three reads at
every value it has taken.

**THE DELTA WAS 14 BYTES AND THE SECOND VALUE PERSISTED**, which is what
rules out a flush race: a race gives an unstable pair, and this gave a
new stable value. The arm's own disclosure in the failing run says
`49,183 bytes, 16,353 UNDER the derived loss point` — truncation was
never in play.

## `lane-protocol.md` rule 4 NAMED THIS SURFACE AND IT STILL BIT

> *Some surfaces are scoped by the MACHINE instead: a port number, **the
> host's list of worktrees**, anything keyed on a name that is global to
> the machine … the collision probability rises with parallelism and
> nothing warns.*

The rule is written, correct, and was read by the seat that broke it. It
warns about lanes colliding with lanes; **the collision here is a GATE
with the DISPATCHER**, which is the same surface and a party the sentence
does not mention.

## WHAT THE LANE DID, WHICH IS THE PART TO KEEP

It **did not re-run.** A verifier was live at its tip, e2e takes the solo
lock, and rule 4 is explicit that a second runner corrupts a
certification in both directions. So it attributed from evidence
instead — a stable triple-read, the arm's own 16 KiB of margin, and the
worktree that had appeared — and reported the red rather than washing it
out.

**Re-running until green would have "fixed" it and taught nobody
anything.** The body's own comment predicted this exact failure:
*"suspect the board moving between the two runs (a worktree added or
removed) before suspecting the flush."* The prediction was right and the
body still cannot tell the two apart.

## What a fix decides

1. **Whether the two reads can be made simultaneous**, or whether the
   arm must be pinned to a board snapshot taken once and reused for both.
   A snapshot is the honest shape: the guard's subject is FLUSHING, and
   the board is not the subject.
2. **Whether a live-board arm belongs in this body at all.** The
   synthesised arm carries the real proof (`T-197`'s verifier established
   that). The live arms exist to announce an APPROACH — so a disagreement
   between them could DISCLOSE rather than red, and the body would stop
   being a false alarm without losing its warning.
3. **What the body should say when it cannot tell.** A third verdict —
   *the board moved under me* — is distinguishable by re-reading the
   worktree count either side, and is not the same answer as *the flush
   is broken*.

## Acceptance criteria

- THE guard SHALL NOT red because the machine's worktree list changed
  between its two reads, and a body SHALL prove it by **moving the board
  between them** — creating and removing a worktree — and requiring the
  verdict to be unchanged.
- WHERE the guard cannot distinguish a flush defect from a moved board,
  it SHALL say so in a THIRD verdict rather than reporting the flush
  defect it did not observe.
- **A POSITIVE CONTROL SHALL prove the guard still reds on a REAL flush
  defect** — restore `process.exit(code)` and require the failure. A
  guard made immune to false alarms by being made immune to everything is
  the defect this project names most often.
- THE arm's disclosure SHALL keep naming its margin, since that figure is
  what made this attribution possible in one read rather than three.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Read beside

`T-197` (which built this guard, and whose verifier established that the
synthesised arm carries the proof while the live arms announce an
approach), `lane-protocol.md` rule 4 (the machine-scoped surface, named
and still bitten), and `T-209` (which mechanises the OTHER machine-scoped
surface — the same `git worktree list`, read for a different purpose).

## The dispatch defect this card does not fix

**The seat cut a verifier worktree while the lane's own e2e was
running.** With four lanes and four verifiers live, every bench cut
perturbs any concurrent live-board measurement, and nothing warns. That
is a scheduling rule, not a code change, and it wants writing down
wherever `T-211` puts the rest of the fast-path law: **do not cut a bench
into a board a live gate is reading.**

## A THIRD FAILURE MODE: AN ENTRY THAT MUTATES IN PLACE

Found by `T-212`'s verifier during its own phase 1, and it defeats both
remedies this card and its dispatcher proposed.

Its snapshots read **15 entries on both sides** of a read. The set
difference over PATHS was also empty. But the whole-line difference showed
`/Users/ujju/Projects/nputer-V-167s5` **leaving at `7b712c1` and
returning at `d17258e`** — a sibling verifier re-pointing its own worktree
between the guard's two reads.

**So the board can move without its size changing and without its path
set changing.** A count cannot see it. A path-only set difference cannot
see it. Only comparing the two reads as **whole `git worktree list`
lines, commit column included**, can.

This also corrects the dispatching seat's own instruction. I told three
verifiers to *"set-difference rather than count"* after a count proved
insufficient — and the set difference was itself insufficient, on paths
alone. **The third instance in one night of advice that was a strict
subset of the right answer.**

The acceptance criteria above are unchanged in substance: a guard that
cannot distinguish a moved board from a flush defect must say so in a
third verdict. But the DISCRIMINATOR they rest on is now known to need
the commit column, and a fix that snapshots only a count or only a path
set will pass its own tests and miss this case.
