---
id: T-209
title: Rule 5 has mandated expanded-set lane disjointness since it was bought with a defect, and NOTHING COMPUTES IT — the architect seat asserted it from memory three times in one conversation and was wrong three times
feature: F-06
milestone: 4
priority: 1
size: M
status: done
blocked_by: []
touches: [tools/e2e]
suggested_by: "the architect/integrator seat's own three same-day failures, re-aimed at the right unit by peer session nputer-10 after @human asked whether `touches:` can decide parallel safety at all"
builder: claude-opus-5@subagent
review: independent
---

**THE LAW EXISTS AND IS COMPLETE.** `method/lane-protocol.md` **rule 5**,
in the doc's own capitals — cited by ORDINAL and by the quoted words,
never by line, for the reason this card's verifier gave: *a line number
IS a figure, a coordinate in a mutable object that fails silently, still
pointing at a real line, just the wrong rule.* This card first cited
`:182`, which was TRUE when filed and which `T-189`'s merge falsified by
inserting 68 lines:

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
- **A SECOND CONTROL SHALL prove a DIRECTORY token versus a FILE beneath
  it is REFUSED** — `.claude` against `.claude/hooks/lane-fence.mjs`, a
  path that EXISTS rather than a placeholder. This is the case naive
  string intersection gets wrong, and the reason `within` is reused
  rather than rewritten.

  *This criterion first named a hypothetical `x.mjs`, and the dispatch
  preflight refused the fence write for it as a STALE PATH — correctly:
  a criterion cannot tell a placeholder from a claim, and this card's
  whole subject is a check that must not be talked out of a refusal.
  Recorded rather than quietly swapped.*
- A card with an absent or empty `touches:` SHALL be treated as the
  universal set and collide with everything.
- THE implementation SHALL be single, with the dispatch call site built
  here and the push and merge call sites named for `T-212` — three
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

`method/lane-protocol.md` **rule 5** first — it is the law this mechanises
and it is already complete, including the six-for-six measurement.
`T-199` (the write-time fence), `T-212` (which takes the push and merge
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

---

## Implementation notes (executor, 2026-09-01)

Built at base `d8e180b`, lane `task/T-209-lane`. Two files changed for
the build (`tools/e2e/scripts/lane-fence.mjs`,
`tools/e2e/tests/lane-fence.spec.ts`), one fixture repaired
(`tools/e2e/tests/card-preflight.spec.ts`).

### What was built

`laneDisjointness()` and `disjointnessRefusal()` in
`tools/e2e/scripts/lane-fence.mjs`, called from `buildLaneFence` as the
LAST guard — after every check about the card itself, so a broken card is
reported as broken rather than as colliding. It throws
`LaneFenceFinding`, so `brief.mjs` arm five already answers **1** and the
dispatch is refused with every collision named.

**Nothing was re-derived.** The enumeration is `parseWorktreePorcelain`
over `git worktree list --porcelain`; each live lane's fence is the
hook's `readManifest`; the comparison is the parser's `compareFences`.
`laneDisjointness` is pure of git and the clock — it takes the porcelain
as text, the seam `dispatchContext` already publishes.

### Three decisions the card did not make, made here

1. **`alwaysWritable` does NOT subtract.** The card's hole 3 says all
   three manifest lists participate; taken literally as a subtraction it
   is WRONG, and rule 5 says why: the unfenceable directory is a
   collision "between a fence and a PROTOCOL WRITE", and a
   fence-versus-fence comparison "has no term for one. It cannot discover
   this, ever, so it must not be asked to." `docs/tasks` is never a
   shared DOMAIN (`expandFence` rejects the token), so the only domains a
   subtraction could remove are EXACT CARD FILES two lanes both fenced —
   a real collision over real work. Dropping those is a guard that
   permits. `alwaysWritable` participates instead as a **precondition**:
   it is `UNFENCEABLE_PATHS` frozen at the ref its manifest was stamped
   at, so two manifests carrying different ones were judged under
   different constitutions and the comparison is `unusable`. Pinned by a
   body. `excluded` participates as `compareFences` already implements
   it (union, exact-match), whose documented ceiling this call site
   inherits rather than papers over.
2. **`within` was NOT used, and that obeys the card rather than departing
   from it.** `within(rel, domain)` answers one direction; a
   fence-versus-fence comparison needs both, plus the NARROWER domain to
   name in the refusal. Calling `within` twice and picking a winner is
   re-deriving `sharedDomain` — the second copy the card forbids in its
   next breath. `within` stays right for `T-212`'s push gate, which asks
   the one-directional question about a diff's paths.
3. **`liveLanes()` was NOT reused**, though it enumerates the same lanes.
   It SKIPS a lane whose manifest cannot be read (its limit 4, correct at
   the write, where letting a stale entry lock the integration seat out
   would be worse). At DISPATCH that skip is this card's own defect, so
   the enumeration is done here and unreadable lanes are REPORTED. The
   divergence is pinned by a body that asserts `liveLanes` drops the lane
   this check refuses on.

### The third case, and the brief's premise for it

The brief asked me to rule "a declared token that resolves to nothing",
citing `T-164-s1`'s `touches: [bin]` as a zero-path fence. **That does
not reproduce at `d8e180b`.** `knownPathOracle` is built from
`git ls-files`, not from the `.nputerignore` walk — `.nputerignore`
governs `nputer-index`'s graph and nothing here — and `bin/app-dev.mjs`
is tracked, so `bin` resolves `kind: "path"`, `paths: ["bin"]`. **There
is no zero-path fence on this board.** The case is still ruled, twice
over: on the NEW card's side `buildLaneFence` already refuses an unusable
token and a fence expanding to no path (both pre-existing, both above the
intersection); on the LIVE lane's side a zero-path manifest cannot be
written by this module, so one on disk is a hand-edit or a pre-guard
artefact and is answered `unusable`. Neither side is ever answered
`disjoint`, which is the only answer rule 5 forbids.

### One behaviour change beyond the card, declared

A live task-branch worktree with **no readable manifest now refuses the
next dispatch** (`CANNOT COMPARE`). This is rule 5's three verdicts, and
it is not merely defensive: such a lane is already broken, because the
armed hook refuses EVERY write in a lane branch that holds no manifest.
This check is the first thing in the project that reports it. It surfaced
one pre-existing fixture in `card-preflight.spec.ts` that cut a "live
lane" and never armed it; the fixture was made faithful (it now arms it)
rather than the rule weakened. A worktree whose DIRECTORY is gone is
skipped, agreeing with the ruling already made at the write.

### For the verifier

- The positive control is the first body and it is refuse-then-allow in
  ONE body, against the same armed lane, so an allow cannot be a
  mechanism that failed to arm.
- Three poison drills, one side each, all restored to a byte-identical
  file (sha256 `790c21fa…`): (1) never report an overlap → 5 bodies red;
  (2) enumerate only the first worktree entry → 8 red; (3) skip
  unreadable manifests the way `liveLanes` does → exactly 1 red, the body
  that pins the divergence.
- The `alwaysWritable` decision is the one most worth attacking: it
  contradicts the card's literal wording and rests on rule 5's own
  sentence. If the verifier reads that sentence the other way, the fix is
  a filter over `report.collisions[].witnesses`, not a re-architecture.

### Routed, not taken

- **`T-219`** filed: `expandFence` refuses a token that IS an
  unfenceable path but not one that CONTAINS it, so `touches: [docs]`
  holds `docs/tasks`. Measured: 1 of 312 live cards (`T-054`). In
  `lib/parser`, outside this fence. Decision 1 above is only safe while
  that hole is open in the other direction, so the two should be read
  together.
- **`T-218`** gained a second measured instance: `capabilities:check`
  exits 1 on this lane and `docs/CAPABILITIES.md` is outside its fence
  (`BLOCK judged=true outside-the-fence`, against an `ALLOW
  inside-the-fence` control). NOT regenerated here. **The integrator owes
  `npm run capabilities` in the merge commit**, which is where every
  regeneration in `git log -- docs/CAPABILITIES.md` has actually landed.
- The push and merge call sites are `T-212`'s, as the card directs.
  `laneDisjointness` is exported for them; `T-212`'s step 3 asks the
  one-directional question, for which `within` is the right primitive.

### Where the brief was wrong

1. The `[bin]`/zero-path premise does not reproduce (above).
2. The brief named **two** other live lanes. There were **three**:
   `T-195` was dispatched at 20:32:39, nine minutes after this lane's own
   manifest (20:23:40), so the brief's lane list was already stale when
   it was read. Derived live, this lane's fence is `disjoint` from all
   three. **This card's thesis, demonstrated on the brief that
   commissioned it.**
