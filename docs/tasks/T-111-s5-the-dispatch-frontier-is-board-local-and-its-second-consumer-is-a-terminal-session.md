---
id: T-111-s5
title: What T-111 landed in the board, and exactly what T-137 has to move — the move list, plus the ONE decision T-137's criteria do not settle
status: suggested
suggested_by: executor claude-opus-5 @T-111
touches: [lib-parser, tools/e2e]
---

**THIS CARD IS SUBORDINATE TO `T-137` AND EXISTS ONLY TO FEED IT.** T-137
landed on main at `cf470f5`, while this lane was building, and its first
acceptance criterion is *"IF `T-111` has landed a board-local
implementation by the time this runs THEN this card **moves** it and says
what moved, rather than adding a second."* **This is the "what moved"
half, written by the seat that built it, so T-137 does not have to
reverse-engineer it.**

The architect's mid-lane steer said the same thing in advance and this
lane acted on it: *build the board, but do not put a reusable fact
somewhere only the board can see it.*

## What exists, and where

All of it in `app/src/lib/board-model.ts` (C-08, `app-board`), pinned in
`app/test/select-board.test.ts` (C-05, `app-shell`):

| symbol | what it is |
|---|---|
| `selectDispositions(model, dispatch, topmost?)` | the derivation — six dispositions, each with a reason SENTENCE |
| `DISPOSITIONS`, `Disposition` | the closed six |
| `CardDisposition`, `UnmetBlocker`, `BlockerBinding`, `FenceClash` | the answer's shape |
| `DispatchReading`, `DispatchStamp`, `LaneHold`, `LaneJoinState` | the lane reader's answer, mirrored structurally |
| `InFlightLane`, `DispositionModel` | the model, with `headline` and `ceilingReached` |
| `normaliseTouchToken`, `touchTokensOverlap` | ONE normalisation, containment included, ceiling documented |
| `expandTouch`, `fenceClashes` | disjointness over EXPANDED component paths |
| `CONCURRENCY_CEILING` | `orchestrator.md` step 4's 3–5, asserted against the live doc |
| `topmostUndoneByColumn` | **the one board-shaped thing** — see below |

## What moves cleanly, and what does not

**EVERYTHING EXCEPT `topmostUndoneByColumn` MOVES UNCHANGED.** It was built
that way rather than found to be that way: no React, no DOM, no IO, and
the only import outside the module is the parser's TYPES
(`ComponentRecord`, `ParseIssue`, `ProjectParseResult`, `TaskRecord`,
`TaskStatus`). The lane reader's four states are mirrored STRUCTURALLY
rather than imported from `app/src/lib/dispatch-store.ts`, so nothing
carries a C-15 dependency across.

**`topmostUndoneByColumn` CANNOT MOVE AS IT STANDS.** `orchestrator.md`
step 4 dispatches *"among the topmost undone tasks of each feature
column"*, so the derivation needs a column ORDER — and this repository has
exactly one, `selectBoard`'s T-004 ordering. The frontier takes that order
as a PARAMETER, defaulted to `topmostUndoneByColumn(model)`, so the
coupling is one function and one default rather than a thread through the
body. `the column order is an INPUT, so the derivation is not board-local`
pins it, and drill arm A30 kills exactly that one body and nothing else.

**THE ONE DECISION T-137'S CRITERIA DO NOT SETTLE: where the ORDER lives.**
If the frontier moves and the order does not, a terminal session must
spell its own — which is T-057 one layer down, in the card whose whole
subject is T-057. Three options, and the recommendation is (a):

- **(a) MOVE THE ORDERING TOO.** `selectBoard`'s milestone-1-first,
  priority-asc, id-asc, file-asc rule becomes the parser's, and
  `board-model.ts` becomes a view over a shared order rather than the
  owner of one. It is the only option where the board and the architect
  can never disagree about which card is next. It touches T-004's
  behaviour, so it wants its pins moved with it — `select-board.test.ts`
  already has them.
- **(b) EXPORT THE COMPARATOR ALONE** and let each consumer group by
  column itself. Cheaper, and it leaves the grouping duplicated.
- **(c) LEAVE IT.** The board passes its order; the CLI passes its own.
  Two orders, one fact. **Not recommended, and named so the choice is
  visible.**

## Two more inputs T-137 will want, measured here

1. **The lane list must be filtered on the BRANCH, and this lane is the
   live proof.** At **12:12 EEST on 2026-08-26** the repository had **nine
   worktree entries and three lanes**: main's checkout, `../nputer-app`,
   `../arch-verify`, and **four detached scratch checkouts** — this card's
   drill at `/private/tmp/t111d` and T-134's two at `/private/tmp/t134b`
   and `/private/tmp/t134v`. A path filter would have reported six.
   T-137's criterion is right and the ratio it cites is not historical.
2. **`dispatch-brief.mjs`'s copy and this one differ in a way worth
   diffing before either wins.** T-137 names the duplication; here is the
   delta from this side. That copy's `pathsOverlap` strips a trailing
   `*`/`/` and tests separator-anchored containment — **the same rule this
   card reached independently**, which is the good news. What differs:
   this card's `expandTouch` reports a token's KIND (`slug` vs `path`) and
   the component ids it resolved through, so a `fenced` reason can say
   *"both expand through C-11, so this may be the coarse fence rather than
   a real overlap"*; and `fenceClashes` returns the shared PATHS rather
   than a boolean. **The reason text is the half `T-111`'s title calls
   "and WHY the rest are not", and it needs the provenance, not the
   verdict.** Whichever copy survives should keep that.

## THE CANONICAL COPY LANDED WHILE THIS CARD WAS BEING VERIFIED, AND THE DELTA IS MEASURED HERE RATHER THAN LEFT FOR T-137 TO REDISCOVER

**`T-134` MERGED AT `520e93e`**, landing `lib/parser/src/fence.ts` —
`normalizeFenceToken`, `slugPathIndex`, `expandFence`, `compareFences`,
`sharedDomain`, `UNFENCEABLE_PATHS`. It is EXPORTED from the parser's
index, and `@nputer/parser` is already an app dependency, so importing it
into `board-model.ts` is a READ inside `[app-board, app-shell]` and never
a fence widening. **The question was therefore live for T-111's fix pass,
it was decided against importing, and the decision is a MEASUREMENT rather
than a preference.**

Both implementations were run over this repository's live board at
`6a6bc87` merged with the lane — 27 distinct raw `touches:` tokens over
304 cards, and the full pairwise matrix over the 147 cards that carry a
fence:

| measurement | result |
|---|---|
| normalisation: `normaliseTouchToken` vs `normalizeFenceToken` over all 27 live tokens | **0 disagreements** |
| token KIND: `expandTouch` vs `expandFence` over all 27 | **3 disagreements** — `ci`, `docs`, `method`, all on `T-054` |
| pairwise fence verdicts, 10 731 pairs | 3 255 both overlapping · 7 363 both disjoint · **113 disagree** |
| every one of the 113 | a pair against `T-054`, shape `T134=unusable unusable:docs,method,ci` |
| the narrower shared domain on `docs` × `docs/CONVENTIONS.md` | **both answer `docs/CONVENTIONS.md`** — the rules AGREE |
| clash provenance | T-111 `viaComponents: [C-05,C-08,C-09,C-10,C-11,C-16]` · T-134 `FenceWitness {left,right,path}` — **no component ids at all** |

**FOUR THINGS FOLLOW, AND THE FIRST IS THE ONE THAT DECIDES IT.**

1. **`compareFences` HAS A THIRD VERDICT AND THE BOARD HAS SIX
   DISPOSITIONS.** `unusable` is deliberate — its own doc forbids folding
   it into `disjoint` — and T-111's criterion 1 closes the disposition
   vocabulary at six with no per-card "I cannot tell". Consuming the
   merged module faithfully needs a SEVENTH value. **That is a criteria
   change, not a repair**, and an executor may not make it from inside a
   lane.
2. **THE BOARD HAS NO FILESYSTEM TO SUPPLY `knownPaths`.** `expandFence`'s
   own doc says the oracle is *"the ONLY way this module can tell a bare
   directory token from a word that names nothing"*, and
   `selectDispositions` is a pure function of the parsed model. With the
   oracle supplied, the `docs` × `docs/CONVENTIONS.md` pair comes back
   `overlapping` and agrees exactly; without it, `T-054`'s whole fence is
   `unusable`. **The 113 are an oracle gap, not a rule disagreement** —
   which is a better answer than either card had, and it is T-137's to
   close because only a caller with a repository can.
3. **IMPORTING WOULD DELETE THIS CARD'S OWN HEADLINE.** `FenceWitness`
   carries no component ids, so the `fenced` reason could no longer say
   *"both expand through C-11, so this may be the COARSE fence rather than
   a real overlap"* — the clause the card's section (b) demands, and the
   one whose absence (arm A20b, surviving at exit 0) was part of what
   rejected the first pass. **The provenance is the deliverable; the
   verdict is not.**
4. **THE SPELLING SPLIT IS A NAME, NOT A BEHAVIOUR.** `normaliseTouchToken`
   and `normalizeFenceToken` disagree on **none** of the 27 live tokens,
   so T-137 can take the parser's spelling for free on today's
   vocabulary. They are not equal in general —
   `normaliseTouchToken('**')` is `'**'` and `normalizeFenceToken('**')`
   is `''` — so the swap wants its own pin rather than an assumption.

**AND THE DIVERGENCE IS DORMANT TODAY, WHICH IS WHY MERGING T-111 BREAKS
NOTHING WHILE STILL OWING T-137 A MOVE.** `T-054` is the only card in the
vocabulary carrying a bare word, and it is `done` — a `done` card is never
in flight and never a candidate, so none of the 113 pairs can reach a live
dispatch. **It goes live the day anyone drafts a card with a bare-word
`touches:` entry**, and the vocabulary shows that is a shape authors
reach for. `UNFENCEABLE_PATHS` is likewise dormant: no live token
normalises to `docs/tasks` (the three `docs/tasks/…` tokens on the board
are individual FILES, which T-134 permits).

**SO: T-137 UNIFIES, T-111 DOES NOT IMPORT, AND THE COST OF WAITING IS
NAMED.** Merging this card puts a fourth spelling of the fence rule in the
tree for as long as T-137 takes. That is a real T-057 debt and it is
recorded here rather than argued away — but the alternative available to a
lane today is a board that answers *"I cannot tell"* about a card it can
currently answer for, bought by a criteria change the lane may not make.
