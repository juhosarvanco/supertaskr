---
id: T-219
title: A fence that CONTAINS the unfenceable directory is not refused — only one that IS it, so a bare `docs` token holds `docs/tasks` and rule 5's mechanical refusal is half-built
feature: F-06
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [lib-parser, tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "T-209's executor, which needed the exact semantics of `alwaysWritable` to decide how it participates in a lane-vs-lane intersection and found the refusal is token-shaped where the rule is path-shaped"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

`method/lane-protocol.md` rule 5:

> **A DIRECTORY THE PROTOCOL ITSELF WRITES TO ON EVERY CARD IS NOT
> FENCEABLE BY ANY CARD.** … **This has to be refused MECHANICALLY,
> where the fence is read.**

It is refused mechanically for ONE spelling. `lib/parser/src/fence.ts:353`:

    if (UNFENCEABLE_PATHS.includes(normalized)) { … rejected … }

`includes` is EXACT-MATCH on the normalised token. Every other rule in
that module is prefix-aware — `sharedDomain` exists precisely because
*"containment IS overlap"* — and this one is not. So:

- `touches: [docs/tasks]` is REFUSED. Correct.
- `touches: [docs]` is ACCEPTED and expands to `paths: ["docs"]`, which
  CONTAINS `docs/tasks`. The lane then holds, by containment, the one
  directory the rule says no card may hold.

## Measured

At `d8e180b`, over the live board (312 cards carrying a `touches:`):
**1 card's expanded fence swallows an unfenceable path** — `T-054`
(`status: done`), `touches: [docs, method, tools/e2e, ci]`, whose
`docs` domain contains `docs/tasks`. `T-111`'s verifier noted this pair
in passing (`T-111`, F7) while ruling on a since-removed duplicate
implementation; it was never filed as its own defect.

The count is low because the vocabulary drifted away from bare `docs`,
not because anything refuses it — which is the shape of a guard that has
not yet been asked.

## Why it matters beyond tidiness

`T-209` builds the lane-vs-lane intersection, and had to decide how a
manifest's `alwaysWritable` participates. It concluded — and rule 5 says
so directly — that a fence-versus-fence comparison **has no term for a
protocol write** and "cannot discover this, ever, so it must not be asked
to". That conclusion is only safe while the EXPANSION refuses a fence
that swallows the directory. Today it does not, so the two halves of
rule 5 are each relying on the other to catch this case.

## What to build

- `expandFence` SHALL reject a token whose domain CONTAINS an
  `UNFENCEABLE_PATHS` entry, not only one that equals it, and SHALL say
  which unfenceable path the token swallowed.
- The containment test SHALL be `sharedDomain`, which already exists in
  that file — a second prefix rule beside it is `T-057`.
- A body SHALL prove `touches: [docs]` is refused and `touches:
  [docs/ROADMAP.md]` is not, so the rejection is not widened into every
  fence that merely sits near the directory.
- **A POSITIVE CONTROL SHALL prove `docs/architecture/components/` is
  still fenceable** — six cards hold it, and `UNFENCEABLE_PATHS`'s own
  doc says the list "is deliberately not a rule about directories".
- Verification: headless.

## Read beside

`method/lane-protocol.md` rule 5, `lib/parser/src/fence.ts` (`sharedDomain`,
`UNFENCEABLE_PATHS`), `T-134` (which built the module), `T-111` F7 (where
the pair was first seen), `T-209` (which needed the answer).

## TRIAGE, 2026-09-01 — DISPOSITION IS **PROMOTE**, AND IT IS NOT APPLIED

Triaged at the architect seat this date. The finding is real, its
evidence reproduces, and its blocker has landed. **The disposition is
PROMOTE and the stamp still reads `suggested`** — held for one reason
that is not about this card:

**THE DISPATCH BRIEF HAS NO ROOM.** `brief.mjs --dispatch` emits 60,731
bytes against a 65,536-byte spawn buffer at `a014b81`. Promoting the
seven correct suggestions in this cluster costs **4,515 bytes** and
leaves **290** — inside the boundary that silently truncates, and the
same boundary that reddened a lane's own gate earlier in this window.
Four went through; this one is the arithmetic's remainder, not triage's.

**READ THIS AS A TOOL LIMIT, NEVER AS A VERDICT ON THE FINDING.** A card
held back by a byte ceiling looks identical on the board to one triage
declined, and that is the thing this paragraph exists to prevent. Filed
as `T-225`; when it lands, promote this card without re-triaging it.

## CORROBORATION, 2026-09-02 — T-227, absorbed here as a second instance of `expandFence`'s silence

T-227 (now under docs/tasks/rejected/, its evidence kept there) measured
at d6fd4ad, with positive controls on both halves: `compareFences`
iterates `a.tokens × b.tokens`, so a card with an EMPTY `touches:`
produces zero witnesses and reads DISJOINT FROM EVERYTHING to T-209's
dispatch guard, while the write hook refuses every path — the two halves
disagree in the safe direction, and `expandFence` reports no issue and no
`unusable` entry either way. Latent because every dispatchable card
declares a fence, and one promotion of a minimal suggestion away from
live. When this card is promoted its criteria SHALL include: IF a card's
`touches:` is empty THEN `expandFence` SHALL refuse it, naming the card,
and the dispatch guard SHALL never report it disjoint. Same mechanism,
same file, one refusal short.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.

## FENCE WIDENED, 2026-09-02 — fast path A, by the dispatching seat

Amended on the integration branch while the lane was live: the blind
verifier measured at the base that a correct containment refusal reds two
bodies in tools/e2e/tests/lane-fence.spec.ts (:987 and :1711), whose lane
fixtures fence the bare `docs` this card exists to refuse. Rule 5 forbids
widening from inside the lane; the seat widened it here, re-expanded the
manifest against this commit, and sent the executor this line by path.
The two fixtures are repaired inside the lane rather than routed.
