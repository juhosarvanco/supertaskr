---
id: T-209
title: Rule 5 has mandated expanded-set lane disjointness since it was bought with a defect, and NOTHING COMPUTES IT — the architect seat asserted it from memory three times in one conversation and was wrong three times
feature: F-06
milestone: 4
priority: 1
size: M
status: planned
blocked_by: [T-199]
touches: [tools/e2e]
suggested_by: "the architect/integrator seat's own three same-day failures, re-aimed at the right unit by peer session nputer-10 after @human asked whether `touches:` can decide parallel safety at all"
builder:
review: independent
---

**THE LAW EXISTS AND IS COMPLETE.** `method/lane-protocol.md:182`, rule
5, in the doc's own capitals:

> **A FENCE NAMES PATHS. A COMPONENT NAME IS SHORTHAND FOR THE PATH SET
> IT STANDS FOR, AND DISJOINTNESS IS COMPUTED OVER THE EXPANDED SETS —
> NEVER OVER THE TOKENS.**

Nothing computes it. Every concurrent dispatch this project has made was
a seat comparing token strings in its head.

## The three failures that filed this card, all one day, all one seat

1. **T-199 + T-203 declared parallel-safe** on "different files,
   `lane-fence.mjs` vs `push-guard.mjs`." `.claude/hooks/push-guard.mjs:68`
   imports **five symbols** from `lane-fence.mjs`, including
   `findCheckoutRoot` — which is T-199's own fix neighbourhood.
2. **A batch proposed** without the check being run at all.
3. **"All three token-disjoint, this time by the rule rather than around
   it"** — written in the same breath as not applying the rule. `T-199`
   and `T-197` share `tools/e2e`.

All three would have been caught by a set intersection. The seat did not
skip it because it was unavailable. **It skipped it because it lived in
memory** — `T-167-s8`'s mechanical-versus-memory-held finding, and
`T-207`'s *"a resolution is a guard somebody forgets."* `T-207` was filed
about this pattern eleven hours before instance 1.

## AND THE TOKEN FALLBACK IS REFUTED BY A MEASUREMENT ALREADY IN THE DOC

The seat's proposed interim — *"keep token overlap as the conservative
rule until something better lands"* — is the exact failure rule 5 names,
and rule 5 carries the measurement:

> a vocabulary of names ALONE is worse than coarse — it is a lock on a
> name … **Measured on the session that ran six lanes concurrently: every
> block was a naming collision and not one real collision occurred.**

**Six for six spurious.** Tokens over-refuse (one component under two
names serialises lanes that never touch) *and* under-refuse (two names
standing for one file set report DISJOINT). Neither direction is safe, so
neither direction may be decided on tokens.

## THE UNIT IS LIVE LANES, NOT "THE BATCH"

The seat's first design intersected *the batch at dispatch*. Peer session
`nputer-10` refused it on a load-bearing ground: **the batch exists only
in the dispatcher's head.** Staggered dispatches — which is how the whole
of 2026-08-31 ran — never form one, so a batch check has the defect it
was built to fix, one level up.

**The unit that exists ON DISK is the set of live lanes**, each already
carrying its expanded fence. Every part needed is already built and none
of it is read across lanes:

- `.claude/hooks/lane-fence.mjs:179` — `MANIFEST_REL_PATH =
  ".nputer/lane-fence.json"`, whose `Manifest` carries `paths`,
  `excluded`, `alwaysWritable`. **The expanded set is already on disk.**
- `within(rel, domain)` at `:458` — `rel === domain ||
  rel.startsWith(domain + "/")`. **Prefix-aware containment, already
  exported.**
- `expandFence` — `@nputer/parser`'s, called at
  `tools/e2e/scripts/lane-fence.mjs:152` to write that manifest.

## What to build

**A `--intersect` derivation with ONE implementation and THREE call
sites** — dispatch, push, merge — because three copies of a containment
rule are three chances to compute it differently (`T-057`).

`--write-fence` SHALL enumerate live lanes from `git worktree list
--porcelain` — **derived from disk, not from a plan the seat typed** —
expand the new card's `touches:`, intersect prefix-aware against every
live manifest's `paths`, and REFUSE on overlap naming both lanes and the
overlapping paths.

## The three holes a naive intersection leaves

1. **Compare EXPANDED PATHS, prefix-aware, reusing `within`.** String
   equality reports `.claude` and `.claude/hooks` disjoint. Import it;
   do not re-derive it.
2. **A card with NO `touches:` is the UNIVERSAL SET.** Otherwise deleting
   the declaration is the bypass, and the least careful card gets the
   widest licence.
3. **`alwaysWritable` and `excluded` participate.** A manifest carries
   three lists; an intersection over one of them is an accounting headed
   *complete* that omits two — `T-194`'s defect exactly.

## Acceptance criteria

- `--write-fence` SHALL REFUSE when the new card's expanded fence
  intersects any live lane's manifest `paths`, and the refusal SHALL name
  the other lane and the overlapping paths — a refusal that does not say
  what collided sends the seat back to guessing, which is this card.
- THE live-lane set SHALL be DERIVED from `git worktree list --porcelain`
  at decision time. A list passed in, remembered, or typed is the defect.
- **A POSITIVE CONTROL SHALL prove a genuinely disjoint pair is
  ALLOWED.** A guard that refuses every dispatch is indistinguishable
  from one that works — `T-199`'s lesson.
- **A SECOND CONTROL SHALL prove `.claude` versus `.claude/hooks/x.mjs`
  is REFUSED** — the case naive string intersection gets wrong, and the
  reason `within` is reused rather than rewritten.
- A card with an absent or empty `touches:` SHALL be treated as the
  universal set and collide with everything.
- THE implementation SHALL be single, with the dispatch call site built
  here and the push and merge call sites named for `T-203` — three
  copies is `T-057`.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Why `blocked_by: [T-199]`

Not a preference — a correctness order. This guard refuses a **dispatch**
into an overlapping fence. Until `T-199` lands, nothing refuses a
**write** outside one, so a lane that is correctly dispatched can still
wander into another lane's territory and this guard will never see it.
The guard is the front door of a building with no walls until `T-199`
lands. Encoded as `blocked_by` rather than remembered, for the reason
this card exists.

## Read beside

`method/lane-protocol.md:182` **first** — it is the law this mechanises
and it is already complete, including the six-for-six measurement.
`T-199` (the write-time fence), `T-203` (which takes the push and merge
call sites), `T-167-s8` (mechanical versus memory-held), `T-207` (the
decay pattern), `T-057` (one rule, one implementation).

## The finding worth carrying past this card

**A governing document ruled this and a seat re-derived it from scratch,
badly, over a whole conversation.** `CLAUDE.md` warns about exactly that
— *"an architect session once spent a working day rebuilding a belief
about `blocked_by` that ROADMAP's own F-06 entry would have corrected in
a sentence."* It happened again, on the doc that governs the very thing
being reasoned about. **`T-207`'s evidence should gain this: the failure
was not only memory-held versus mechanical, it was not reading the
governing doc that already ruled it.**
