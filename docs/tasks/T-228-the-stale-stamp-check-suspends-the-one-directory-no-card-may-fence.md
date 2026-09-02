---
id: T-228
title: THE STALE-STAMP CHECK SUSPENDS THE ONE DIRECTORY NO CARD MAY FENCE — during a half-performed widening a lane cannot write its notes, its findings, or its own exit stamp, and the check that costs this never prevented the abuse it looks like it prevents
feature: F-06
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [.claude]
suggested_by: "T-211's executor and its blind verifier, independently and then jointly, 2026-09-01 — the executor met it while repairing a false positive control, the verifier reproduced it at a separate bench, and the counter-argument was tested and failed"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**A LANE STUCK IN THE WIDENING WINDOW CANNOT FILE THE FINDING THAT
EXPLAINS WHY IT IS STUCK.**

`decide()` in `.claude/hooks/lane-fence.mjs` runs its stale-stamp
comparison — card `touches:` against the manifest's stamp — **before**
the `alwaysWritable` loop. So while a fence widening is half performed
(main amended and the manifest re-expanded, the lane's own card not yet
updated), there is no allow path at all.

Measured by driving `decide()` directly, twice, at two benches:

    S1 (window OPEN)     already-held BLOCK   newly-granted BLOCK
                         never-granted BLOCK  the card BLOCK
                         a fresh suggestion file BLOCK     — all stale-stamp

    S2 (window CLOSED)   already-held ALLOW   newly-granted ALLOW
                         never-granted BLOCK  the card ALLOW
                         a fresh suggestion file ALLOW

**S2 is what makes S1 a refusal rather than an absence.** The same
targets, the same function, one field changed.

## Why the cost is exactly the wrong cost

`docs/tasks` is `UNFENCEABLE_PATHS` — the directory the protocol itself
writes to on every card, which rule 5 says no card may hold. A write
there **can never be a fence breach by construction.**

What the window suspends is therefore: a lane's implementation notes, any
suggestion card it would file, and its own `status:` stamp. **The
protocol's own bookkeeping is the only thing this refusal reaches.**

And the visible symptom is circular: a lane that hits the window reaches
for the remedy the method prescribes — route it, file a suggestion — and
is refused again, with no sentence anywhere telling it the refusal is
expected. `T-211` has since written that disclosure into the law, which
is the right repair for the LAW and leaves this defect untouched.

## THE COUNTER-ARGUMENT, TESTED AND FAILED

The obvious defence is that a stale stamp means the guard cannot know
which side moved, and one unreachable state is a lane that has widened
ITSELF — so refusing everything is the safe answer.

**It does not survive inspection.** To widen itself at the write, a lane
must forge `manifest.paths`. The manifest sits outside every fence and a
shell-mediated write reaches it regardless (limit 1). **A lane forging
the manifest forges `touchesLine` to match its card in the same edit, and
the stamp check passes.**

So the stamp check never prevented self-widening. It detects a
HALF-PERFORMED DISPATCH and nothing else. What actually stops
self-widening is the landing gate reading the card as committed on the
integration branch.

**A check that cannot prevent the abuse it resembles is suspending the
one directory the protocol guarantees.**

## THE OBVIOUS FIX IS WRONG, AND THAT IS WHY THIS CARD EXISTS

Moving the stale-stamp check to the END would let a half-delivered grant
silently work — the new paths would come back `inside-the-fence` — which
**quietly deletes the two-writes property `T-211` has just written into
law.** A fix that reads as obviously correct would undo a rule landed the
same night.

The order that keeps every property:

    alwaysWritable  →  stale-stamp  →  paths

The unfenceable directory is restored during the window; the stale
manifest's `paths` stay untrusted; every containment property is
unchanged.

## Acceptance criteria

- WHILE a lane's card and manifest disagree, a write to
  `UNFENCEABLE_PATHS` SHALL be ALLOWED, and a body SHALL prove it by
  driving `decide()` in that state against the card, a fresh file in that
  directory, and a path the fence never granted.
- THE half-performed grant SHALL STILL BE REFUSED on the newly granted
  path — **this is the property the obvious fix destroys**, and a body
  SHALL fail if the stale-stamp check is moved to the end.
- **A POSITIVE CONTROL SHALL prove the ordinary refusal still refuses**:
  an out-of-fence path with a CURRENT stamp. A decision function made
  permissive in one state must be shown unchanged in every other.
- THE drill SHALL mutate the ORDER, not only the predicates — the defect
  is a sequence, so a mutant that edits a comparison and leaves the
  sequence alone measures nothing about this card.
- Verification: headless.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.

## Read beside

`T-211` (which met this while repairing a false positive control, wrote
the disclosure into the law, and correctly refused to fix the guard from
outside its fence), `method/lane-protocol.md` rule 5 (the unfenceable
directory, by ordinal), `T-212` (the landing gate — the guard that
actually prevents self-widening), and `T-227` (the other place an empty
or disagreeing fence produces a verdict nobody intended).

## Attribution, because an unattributed finding reads as advice

The executor met it, reproduced it, and **declined to fix it** — `.claude`
was a live lane's fence — routing it instead with its reasoning stated.
Its own note records the irony: *this lane can only route because its
manifest and card happen to agree.* The verifier then reproduced it at a
separate bench, tested the counter-argument above until it failed, and
supplied the three-stage order. Neither seat could write the fix; both
were right not to.

## A COUPLING T-210 CREATES, NAMED BEFORE IT BITES — 2026-09-01

`T-210`'s lane wrote a body that probes `decide()` inside exactly this
card's window, and wrote it carefully: it uses the **newly-granted path
rather than the card**, so it asserts the refusal this card's second
criterion PRESERVES BY NAME. Its verifier audited that forward-
compatibility and it holds — this card can land without reding it.

**One residual.** That body also asserts `.code === "stale-stamp"`. So an
implementation of this card that RENAMES the code — even while keeping
the behaviour identical — reds a body in `tools/e2e`, which is outside
this card's own fence.

Named here rather than discovered at that lane's gate: **keep the code
string `stale-stamp`, or plan the two-act change** the fast-path law now
describes. Nobody has to guess.
