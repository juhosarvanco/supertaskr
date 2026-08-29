---
id: T-137-s5
title: The board CAN import `fence.ts` now — one of T-111's three reasons is discharged, and the remaining two are both criteria changes, so they need one card that makes both
status: parked
suggested_by: executor claude-opus-5 @T-137
touches: [app-board]
---

**`T-137` RULED ON THE MIGRATION AND THE RULING IS: NOT YET, AND HERE IS
THE CARD THAT DOES IT.** `T-111` declined to import `lib/parser/src/fence.ts`
into `app/src/lib/board-model.ts` for three measured reasons. Re-measured
at `T-137`'s ref, **one of the three is no longer true.**

**DISCHARGED — `FenceWitness` carrying no component ids.** T-111 ruled
that importing would delete the clause *"both expand through C-11, so this
may be the COARSE fence rather than a real overlap"*. It does not have to:
a witness names its two RAW tokens, and a token knows the components it
resolved through. `T-137` ships `witnessComponents(a, b, witness)` in
`lib/parser/src/lanes.ts` and uses it in the terminal's `fenced` reason,
which carries the same clause the board does. **The provenance was never
missing; it was one join away.**

**STILL TRUE, AND BOTH ARE CRITERIA CHANGES.**

1. **`compareFences` has a third verdict.** `unusable` is deliberate and
   its own doc forbids folding it into `disjoint`. `T-111`'s criterion 1
   closes the disposition vocabulary at SIX. `T-137` shows the seventh
   value works and what to call it: `unfenceable`, with the offending
   TOKENS in its reason.
2. **The board has no filesystem to supply `knownPaths`.** `T-137` closes
   this for a terminal by building the oracle from `git ls-files` plus
   every directory PREFIX. A board would need the oracle as a PARAMETER,
   filled by whoever loads the model.

**THE SENTENCE TO ACT ON:** *import `fence.ts` into `board-model.ts` only
in the same card that opens the disposition vocabulary to a seventh value
AND gives `selectDispositions` a `knownPaths` parameter its caller can
fill.* Either alone leaves the board answering worse than it does today.

**THE FRESH MEASUREMENT, at `T-137`'s ref, through the merged module:**

    raw touches: tokens on the board                     27
    unresolvable WITHOUT an oracle                        3   ci, docs, method
    unresolvable WITH    an oracle                        1   ci
    carriers of all three                       T-054 ONLY, and T-054 is `done`

    ALL 151 fence-carrying cards, 11 325 pairs
      no oracle    overlapping 3458  disjoint 7751  unusable 116
      with oracle  overlapping 3492  disjoint 7751  unusable  82

    OPEN 38 fence-carrying cards, 703 pairs
      both ways    overlapping  322  disjoint  381  unusable   0

**TWO PROPERTIES WORTH CARRYING FORWARD.** (a) Over the set a dispatch can
actually REACH, `unusable` is **zero** either way — so the divergence
cannot reach a live dispatch today, exactly as `T-111-s5` argued, and the
number that governs is 0 and not 116. (b) **The oracle can only ADD
overlaps and never remove one**: `disjoint` is 7 751 both ways,
identically, and all 34 pairs it resolves move `unusable -> overlapping`.
**Supplying it cannot turn a real collision into a green light**, which is
the safety argument the board's version of this change needs.

Amnesty triage 2026-08-29 (triage seat): PARKED — one of T-111's three reasons is discharged and this card re-measured it: a witness names its two RAW tokens and a token knows the components it resolved through, so witnessComponents supplies the provenance importing was thought to delete. The remaining two are both CRITERIA changes, which is why this is a sentence to act on rather than an edit: import fence.ts into board-model.ts ONLY in the same card that opens the disposition vocabulary to a seventh value (unfenceable) AND gives selectDispositions a knownPaths parameter its caller can fill. Either alone leaves the board answering worse than it does today. Its two safety properties are the reason this is safe when it happens: over the set a dispatch can REACH, unusable is ZERO either way, and the oracle can only ADD overlaps — disjoint is 7 751 both ways, identically. RESURFACES: the next app-board dispatch that also opens the disposition vocabulary — T-112. It SHALL NOT be taken as a bare import.
