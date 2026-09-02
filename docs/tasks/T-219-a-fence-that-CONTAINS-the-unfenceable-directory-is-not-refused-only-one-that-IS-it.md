---
id: T-219
title: A fence that CONTAINS the unfenceable directory is not refused — only one that IS it, so a bare `docs` token holds `docs/tasks` and rule 5's mechanical refusal is half-built
feature: F-06
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [lib-parser, tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "T-209's executor, which needed the exact semantics of `alwaysWritable` to decide how it participates in a lane-vs-lane intersection and found the refusal is token-shaped where the rule is path-shaped"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Built in `/Users/ujju/Projects/nputer-T-219` on
`task/T-219-containment-is-unfenceable`, cut at the dispatch stamp
`d272558331a826ae6a82a4ff91d6d82ea6f6fe1c`. Fence `lib-parser`
(`lib/parser`), physically enforced; `docs/tasks/` always writable.
**Not merged, not checkpointed, worktree left standing** — the ceremony
row is *S, touching shipped code* (`lib-parser` is a registry slug, so
`docs/CONVENTIONS.md`'s SHIPPED PARTITION puts this card's diff inside
shipped bytes), so a verifier is owed before any integration, and this
lane was told in as many words that it does not merge.

### What was written, and where

Four files, all inside `lib/parser`:

- **`lib/parser/src/fence.ts`** — `unfenceableWithin`, a new module-local
  function beside `sharedDomain`: the `UNFENCEABLE_PATHS` entry a token
  domain HOLDS, or `undefined`. It is one expression over `sharedDomain`
  and not a second prefix rule (`T-057`): `sharedDomain` returns the
  NARROWER of two domains when they meet, so asking whether that
  narrower one IS the entry asks exactly *"does this token hold it?"* —
  true when the token equals the entry, true when it contains it, and
  **false when the token sits INSIDE it**, which is the narrowing rule 5
  asks for by name (*"Name the individual files instead"*). The old
  check, `UNFENCEABLE_PATHS.includes(normalized)`, is gone.
  - The PATH branch calls it where the old check stood — before the
    `knownPaths` oracle, so a real directory cannot resolve past the
    rule.
  - The SLUG branch calls it too, and that half is not in the card's
    prose. The old check sat AFTER the slug branch's `continue`, so a
    slug whose component `paths:` reached an unfenceable directory
    walked past the rule entirely. The criterion says *a token whose
    domain CONTAINS an entry*, and a slug token's domain is the set it
    expands to. Zero live instances — censused, below — so it is
    structural rather than an incident.
  - The refusal message names the token, the domain it expands to and
    the unfenceable path it swallowed, and says IS or CONTAINS
    accordingly; the slug form additionally names the components it
    expanded through.
- **`lib/parser/src/fence.ts`, second change (T-227, absorbed)** — an
  empty `touches:` now yields an `invalid-field` issue naming the card,
  and `compareFences` refuses to call a token-less fence `disjoint`.
  **The refusal is an ISSUE and deliberately NOT an `unusable` entry**:
  that list is documented as RAW TOKENS, there is no token here to name,
  and a sentinel in it would make every consumer that prints those as
  unresolved TOKENS print a sentence with none behind it — measured:
  `tools/e2e/scripts/lane-fence.mjs` prints exactly that, and
  `tools/e2e/tests/lane-fence.spec.ts:1736` (*a card with an EMPTY
  `touches:` is refused rather than dispatched with the widest licence*)
  asserts on the OTHER refusal's wording. That body is GREEN at this tip
  and stays green because of this choice.
- **`lib/parser/src/lanes.ts`** — the `unfenceable` reason gains a third
  clause. A card declaring no `touches:` owns no token to be unresolved
  and its own card IS in the checkout, so neither existing clause could
  speak for it and the sentence arrived with an empty middle
  (*"…ruled out: . A fence that cannot be COMPUTED…"*).
- **`lib/parser/test/fence.test.ts`** — a new `T-219 — CONTAINMENT IS
  HOLDING` block of ten bodies, plus four repairs to existing bodies
  whose fixtures spelled a fence this card retires (all four listed in
  "Bodies that MOVED" below).
- **`lib/parser/test/lanes.test.ts`** — one new body for the third
  clause, and one existing fixture given real `touches:` (see below).

### Measured at my base, `d272558331a826ae6a82a4ff91d6d82ea6f6fe1c`

Through the built parser's own `expandFence` over the live tree:

- **457 cards parsed, 359 carrying a `touches:` entry.**
- **Exactly ONE live card carries a token whose domain CONTAINS an
  unfenceable path: `T-054` (`status: done`), token `docs`.** That is
  the card's own "Measured" section reproduced at my base — it was
  measured at `d8e180b` and it still holds. **Zero live tokens EQUAL
  `docs/tasks`**, which is why the exact-match check had never refused
  anything.
- **21 live tokens across 5 cards sit INSIDE `docs/tasks`** (`T-108`,
  `T-108-s2`, `T-159-s1`, `T-160-s4` and this card's own neighbours) —
  the hand-narrowing the module's own refusal message prescribes. A
  containment test run in BOTH directions refuses every one of them, so
  the one-way test is load-bearing rather than a nicety; mutant **M3**
  below is that mutant and seven bodies kill it.
- **98 live cards carry an EMPTY `touches:`** — 96 `parked`, 2 `done`.
  None of them reaches `readDispatchOrder`'s fence term today (both
  `done` ones read `underway`), which is why T-227 filed itself as
  latent.
- **No live registry slug expands to a domain holding an unfenceable
  path** (`slugPathIndex` over `docs/architecture/components/`), which
  is what makes the slug half structural.

**The live-board census is GREEN and the one refused card is RECORDED
rather than repaired.** `T-054` is `done`: its lane was removed long
ago, and a fence is a claim on ground held by a LIVE lane. Narrowing a
closed card's `touches:` would rewrite the record of what that lane
actually held, which is the one thing the card is evidence of — so the
census body now reads *ONE live card holds the directory the parser
refuses, it is `done`, and it holds no lane* and asserts
`['T-054 docs [done]']`. `docs/tasks` is always writable and the repair
was available; it was declined for that reason and this paragraph is the
record of the choice.

### Each acceptance criterion

1. **`expandFence` SHALL reject a token whose domain CONTAINS an
   `UNFENCEABLE_PATHS` entry, not only one that equals it, and SHALL say
   which unfenceable path the token swallowed.** MET, for both token
   kinds. Bodies: *REFUSES a token whose domain CONTAINS the entry, in
   every spelling, and NAMES what it swallowed* (five spellings — bare,
   trailing slash, `./…/**`, doubled slash, untrimmed), *and refuses it
   BEFORE the oracle is consulted*, *still refuses a token that IS the
   entry, and says so WITHOUT claiming containment*, and *REFUSES A SLUG
   whose component paths swallow the entry, and names the component*.
2. **The containment test SHALL be `sharedDomain`, which already exists
   in that file — a second prefix rule beside it is `T-057`.** MET.
   `unfenceableWithin` contains no `/` and no `startsWith`; it calls
   `sharedDomain` and compares the answer. The `index --check` edge diff
   is the mechanical witness:
   `+ s:lib/parser/src/fence.ts#unfenceableWithin -> s:lib/parser/src/fence.ts#sharedDomain (call) confidence=resolved`.
3. **A body SHALL prove `touches: [docs]` is refused and `touches:
   [docs/ROADMAP.md]` is not.** MET — the first in the REFUSES body, the
   second in *does NOT reach a token that merely sits NEAR the entry*,
   which also carries the two separator cases (`docs/task`, a STRING
   prefix that is not a path prefix, and `docs/tasks-archive`).
4. **A POSITIVE CONTROL SHALL prove `docs/architecture/components/` is
   still fenceable.** MET, and **demonstrated failing**: its arming lives
   in DATA, so a code mutant cannot show it failing where the subject's
   arrangement is absent. Mutant **M12** adds that directory to
   `UNFENCEABLE_PATHS` and the control reds. Disclosed: its kill set is
   equal to the pre-existing body *does not refuse a sibling directory
   fence*, so by `roles/verifier.md` step 2b's containment test the two
   are restatements of one another; the new one adds an assertion the
   old one lacks (that live cards hold the directory, so the control is
   about this repository's vocabulary and not a fixture).
5. **T-227's absorbed instance — IF a card's `touches:` is empty THEN
   `expandFence` SHALL refuse it, naming the card, and the dispatch
   guard SHALL never report it disjoint.** MET. Two bodies, and the
   second carries T-227's own control: the same probe is shown answering
   `overlapping` and `disjoint` before it is asked about the undeclared
   fence, in both argument orders, so `unusable` is a verdict rather
   than the only word the probe knows.
6. **Verification: headless.** Every body is `vitest`; nothing opens a
   window.

### Bodies that MOVED, and why each had to

The card retires a fence spelling, so five existing bodies whose
FIXTURES used it moved. Each kept its property; none was loosened.

- `expandFence — … > resolves the bare words a repository oracle can
  settle, and only those` — `docs` was the body's second oracle example
  and is now refused two branches earlier. `method` still carries the
  oracle demonstration and `ci` still carries `T-111-s3`'s ruling; the
  expectation moved from `unusable: ['ci']` to `['docs', 'ci']` and
  `docs` from `path` to `rejected`.
- `a card's own file is never in its own fence > carves the own file out
  of a directory token it sits inside` — every domain containing a
  card's own file also contains `docs/tasks`, so the containing case is
  now spelled over `docs/rooms` with an `ownFile` inside it. `docs/rooms`
  rather than `docs/architecture` deliberately, so this body's kill set
  stays disjoint from criterion 4's control.
- `… > IS WHY THE DIRECTORY REFUSAL CANNOT BE LEFT TO THE COMPARISON` —
  its whole argument is that a fence-versus-fence comparison cannot see
  a lane holding `docs`. `expandFence` no longer produces that fence, so
  the holder is now built BY HAND, exactly as this file's MODEL ONE and
  MODEL TWO build the other two "before" states, and the body then shows
  the same token refused at parse time.
- `the live board … > and no live card holds the directory the parser
  refuses` → `ONE live card holds …`, per the census ruling above, plus
  a NEW sibling body censusing the other direction (no live card is
  refused for a card file it names inside the directory).
- `lanes.test.ts > ADAPTATION IS BY CONSTRUCTION … > a fixture that
  gains a card changes the output with nothing else edited` — its
  fixture cards declared no `touches:`, so under the T-227 half they
  land in `unfenceable` for a reason with nothing to do with caching.
  Each now declares its own disjoint fence.

### Commands, in order, each exit read from `$?` unpiped

| # | from | command | exit |
|---|---|---|---|
| 1 | `lib/parser/` | `npx tsc --noEmit` | 0 |
| 2 | `lib/parser/` | `npx vitest run` (first pass, before the lanes fixture was repaired) | 1 — 1 failed / 358 passed |
| 3 | `lib/parser/` | `npx tsc --noEmit` | 0 |
| 4 | `lib/parser/` | `npx vitest run` | 0 — 360 passed |
| 5 | `lib/parser/` | `npm run build` | 0 |
| 6 | lane root | `git worktree add --detach /private/tmp/nd-T-219 <tip>` | 0 |
| 7 | `/private/tmp/nd-T-219/lib/parser` | `npm ci` | 0 |
| 8 | drill tree | the 15 mutant runs (table below) | 1 each, 0 at every baseline |
| 9 | `lib/parser/` | `npx tsc --noEmit` (after the slug half) | 0 |
| 10 | `lib/parser/` | `npx vitest run` | 0 — 362 passed |
| 11 | `lib/parser/` | `npm run build` | 0 |
| 12 | `app/` | `npm ci` | 0 |
| 13 | `app/` | `npm run build` | 0 |
| 14 | `tools/e2e/` | `npm ci` | 0 |
| 15 | lane root | `lsof -nP -iTCP:1420 -sTCP:LISTEN` | 1 — nothing listening (read 2026-09-02 on Mac.lan) |
| 16 | lane root | `lsof -nP -iTCP:15219 -sTCP:LISTEN` | 1 — free before the lane bound it |
| 17 | lane root | `node tools/e2e/scripts/gate-run.mjs parser` | 0 — `bodies=360 verdict=GREEN` |
| 18 | lane root | `node tools/e2e/scripts/gate-run.mjs app` | 0 — `bodies=1131 verdict=GREEN` |
| 19 | lane root | `node tools/e2e/scripts/gate-run.mjs rust` | 0 — `bodies=634 targets=18 verdict=GREEN` |
| 20 | lane root | `NPUTER_E2E_PORT=15219 node tools/e2e/scripts/gate-run.mjs e2e` | 1 — `bodies=554 verdict=RED`, **2 failed / 552 passed** |
| 21 | lane root | `git merge-tree --write-tree main HEAD` then `git diff --name-only main <tree>` | 0, then 0 |
| 22 | `app/src-tauri/` | `cargo run -q -p nputer-index -- index --check --root ../..` | 1 — STALE, and REAL (see gates) |

**The battery was measured at `47b86867cd1fcce05c565542cf3a5ed4fd6ddb82`,
the code commit, and the counts above are that ref's.** The commit
carrying these notes moves only `docs/tasks/*.md`, which is the DOCS
GATE's trigger and no other gate's; the re-run that answers for it is
recorded under "Standing gates" below.

### The two e2e reds, named and attributed

`tools/e2e/tests/lane-fence.spec.ts:987` (*the three carve-outs each
free a DIFFERENT write, and the fence still holds around them*) and
`:1711` (*`excluded` PARTICIPATES — a card's own file is not a collision
with the lane that holds its directory*). **Both are MINE and neither is
inherited**: each dies inside `buildLaneFence`'s `fence.unusable.length
> 0` refusal quoting this diff's own new sentence —

    entry "docs" fences 'docs', which CONTAINS 'docs/tasks' … (T-108, T-219)

— which did not exist at the base, so no measurement at the base is
needed to attribute them. Both fixtures arm a lane whose card declares
`touches: [… docs]`: the very fence this card exists to refuse. They pin
real properties, all of which stay reachable once the fixture names its
pieces instead of swallowing the directory.

`tools/e2e/tests/lane-fence.spec.ts:1736` (*a card with an EMPTY
`touches:` is refused rather than dispatched with the widest licence*)
is GREEN, and that is a design choice rather than luck: it asserts on
`buildLaneFence`'s *expands to no path at all* wording, which is reached
only while the empty-`touches:` refusal stays out of `Fence.unusable`.

### The drills — 15 mutants, one side only, at `47b86867cd1fcce05c565542cf3a5ed4fd6ddb82`

Run in a DETACHED worktree at `/private/tmp/nd-T-219`, cut from this
lane's own commit, with its own `npm ci`. Every mutation was read back
with `git diff --unified=0` before its suite ran; every restoration is
`git restore --source=<tip> --staged --worktree` proved by `sha256`
against `git show <tip>:<path>`, with an empty per-path diff as the
companion and never as the alternative. **Baseline before and between:
362 passed, exit 0. Every mutant died.**

| # | mutation (one side, the code or the data under test) | bodies killed |
|---|---|---|
| M1 | `sharedDomain(domain, path) === path` → `domain === path` (**the original defect, restored**) | 6 |
| M2 | → `path.startsWith(domain)` (the separator dropped) | 1 |
| M3 | → `sharedDomain(domain, path) !== undefined` (both directions) | 7 |
| M4 | DATA: `UNFENCEABLE_PATHS` gains `docs/architecture` | 2 |
| M5 | the empty-`touches:` guard's condition falsified | 1 |
| M6 | `compareFences`'s token-less guard falsified | 2 |
| M7 | `lanes.ts`'s third clause falsified | 1 |
| M8 | the oracle consulted BEFORE the refusal | 2 |
| M9 | the own-file carve-out for a CONTAINING token removed | 1 |
| M10 | DATA: `UNFENCEABLE_PATHS` emptied | 11 |
| M11 | the two refusal messages swapped (IS claims containment) | 2 |
| M12 | DATA: `UNFENCEABLE_PATHS` gains `docs/architecture/components` | 4 |
| M13 | the SLUG branch's containment check falsified | 1 |
| M14 | DATA, in the REGISTRY: `C-06` declares `docs` as its territory | 8 |
| M15 | the EQUALITY case dropped, containment kept | 3 |

sha256 of the restored files, against `git show <tip>:<path>`:
`lib/parser/src/fence.ts`
`f5a5e065a6626665b5aaa38845b41571872a948366011f8a69abadf7c4e2616b`;
`lib/parser/src/lanes.ts`
`f9f95eea94fdc5826ad549382613995d9a3dfb50fa486d06094af65f6b13cc03`;
`docs/architecture/components/C-06-lib-parser.md`
`7306d35293492a2a473b8314f2af31d22a95b2305b84256763a263f7116e4150`.
Every per-path `git diff` after restore: **0 bytes**.

**KILL-SET CONTAINMENT, NOT THE COUNT.** The pairs worth stating,
because each was constructed to separate:

- *REFUSES … CONTAINS* `{M1, M10, M11}` and *refuses BEFORE the oracle*
  `{M1, M8, M10}` — M8 exists solely to separate them; without it their
  kill sets were EQUAL and one was a restatement.
- *REFUSES … CONTAINS* `{M1, M10, M11}` and *still refuses a token that
  IS the entry* `{M10, M11, M15}` — M15 exists solely to separate them.
- *carves the own file out of a directory token it sits inside* `{M9}`
  and criterion 4's control `{M12}` — the fixture directory was changed
  to `docs/rooms` so that neither dies to the other's mutant.
- *REFUSES A SLUG* `{M1, M10, M13}` and *NO live registry slug swallows
  it* `{M14}` — the second is a CENSUS whose property lives in the
  registry, so only a DATA mutant there can kill it; M14 is it.
- *does NOT reach a token that merely sits NEAR* `{M2, M10}` — M2 is
  unique to it, and it is the body that stops the refusal widening.

**Two disclosures rather than claims.** (a) *the fixtures are this
repository's own data…* is a shape-TEN companion, not an independent
pin: its kill set `{M10}` is contained in several others' by
construction, which is what a "the expected side is non-empty" body IS.
(b) criterion 4's control has the same kill set as the pre-existing
sibling-directory body, stated above.

### The sweep of the class — every other exact-match check in `fence.ts`

The class: **a comparison between two PATH domains written as string
equality or membership, in a module whose rule is containment.** Swept
`lib/parser/src/fence.ts` end to end at this tip; five more sites, and
each is answered rather than left:

1. `UNFENCEABLE_PATHS.includes(normalized)` — **the defect. FIXED**, in
   both the path branch and the slug branch.
2. `slugs.get(normalized)` — a NAME lookup, not a path one. A slug has
   no hierarchy, so equality is the right relation. Not a defect.
3. `known.has(normalized)` (the `knownPaths` oracle) — equality on a
   path, and CORRECT here: the oracle is consulted only for a BARE word,
   which carries no separator for containment to work on. The prefix
   expansion lives on the oracle's own side —
   `tools/e2e/scripts/dispatch-order.mjs` supplies *every tracked path
   AND every directory prefix of one*. Not a defect; recorded because it
   is the site a reader will suspect next.
4. `path === file` and `file.startsWith(`${path}/`)` (the own-file
   carve-out) — the carve-out reaches an EXACT file and no further, and
   `compareFences`' own doc DECLARES that as a ceiling rather than
   leaving it to be found. Not a defect, and unchanged.
   **One consequence of this card is worth recording against it**: for a
   REAL card, whose `file` is under `docs/tasks/`, the CONTAINING branch
   of that carve-out is now unreachable — every domain containing the
   card's own file also contains `docs/tasks` and is refused first. It
   stays reachable through the `ownFile` option, which is what the
   repaired body now exercises, and it would come back for real cards
   the day `UNFENCEABLE_PATHS` changes. Not dead code; narrowed
   reachability, disclosed.
5. `excluded.has(shared)` in `compareFences` — the same declared
   ceiling, seen from the comparison side. Unchanged.
6. `held.paths.includes(normalized)` / `excluded.includes(file)` —
   de-duplication, where equality is the intended relation.

**The sweep also found one live defect of the same CLASS in a different
function, and it is routed rather than built**: `normalizeFenceToken`
drops a leading `./` RUN but not a bare `.`, so `touches: [.]` resolves
as `kind: 'path'` with the domain `.` — a domain no repository-relative
path can ever match, which is T-227's two-halves-disagree shape in a
third spelling. `..` behaves the same. Measured at this tip; **no live
card carries either spelling.** Filed as **`T-219-s2`** — in fence, but a
third refusal is a criteria change an executor may not make.

### Routed

- **`T-219-s1`** (`touches: [tools/e2e/tests/lane-fence.spec.ts]`) — the
  two e2e bodies above, with the exact fixture spellings that keep every
  property they pin. **T-219's merge reds the e2e lane until it lands**,
  so the two belong in one landing rather than in one commit.
- **`T-219-s2`** (`touches: [lib-parser]`) — the bare `.`/`..` root
  spellings found by the sweep.

### Standing gates, derived on the merge forecast

Derived with the RANGE RULE's pre-merge form —
`TREE=$(git merge-tree --write-tree main HEAD)`, `$?` read FIRST, then
`git diff --name-only main "$TREE"` — never `main..HEAD` and never three
dots. `main` resolved to `7203db88f9afff9082db358849e6b49fc99dd42b` at
derivation time.

<!-- GATE-DERIVATION -->

### Fence pass, 2026-09-02 — the widening arrived and steps 2-6 were performed here

**The grant was read, not relied on.** The dispatching seat amended
`touches:` on the integration branch at **`52eea31fc6ae55ec33a45171aef7d5b40b3e3c62`**,
re-expanded this lane's manifest against that commit, and wrote the same
line plus the `## FENCE WIDENED` section into this lane's copy of the card
by an uncommitted Bash write. **Both halves were verified by this lane's own
read before anything was built** (`roles/executor.md`: never proceed on a
reply): the card's line and the manifest's `touchesLine` compare
`IDENTICAL: true` byte for byte, and the section is byte-identical to
`52eea31`'s copy. That uncommitted write is committed here, by the seat
that owns the file it lands in.

**FAST PATH A'S POSITIVE CONTROL PAIR, MEASURED IN THIS LANE RATHER THAN
QUOTED**, because only the two together separate a refusal from an absence:

| write attempted | before the lane's copy carried the line | after |
|---|---|---|
| `lib/parser/src/fence.ts` (already held) | REFUSED — stale stamp | allowed |
| this card, under always-writable `docs/tasks` | REFUSED — stale stamp | allowed |
| `tools/e2e/tests/lane-fence.spec.ts` (newly granted) | — | allowed |
| `tools/e2e/tests/landing-gate.spec.ts` (never granted) | — | REFUSED, naming fence, path and route |

The first two are the half-performed widening's own measurement
reproduced: the guard refused the paths this lane ALREADY held, and it
refused the card too — so **routing could not be written during the
window**, which is why the earlier report ended in a hand-off rather than
in notes. Nothing was written by any refused probe; `git status` was clean
after both and `fence.ts`'s sha256 was unchanged.

**One correction to my own routed card, found by building it.** `T-219-s1`
prescribed the two fixture spellings and was right in shape, but it had not
seen that a carve-out is consulted only for a path a live lane RESERVES.
That cost two iterations, both recorded above under Absorbs, and it turned
up the finding now filed as `T-219-s3`: this card makes `carveOutFor`'s
own-card arm unreachable for every possible manifest — the exact condition
that arm's own header was ordered first to avoid.

### Fix pass, 2026-09-02 — V-T-219's rejection, and the half of my own criterion I argued myself out of

**The finding, in the verifier's words:** *"`readDispatchOrder` still
reports an undeclared fence `disjoint`, and does it exactly when it
matters … The first half is met. The second is met **only while at least
one lane is live**."* And: *"`rule()` reaches `compareFences` only through
`holds`, and `holds` is empty when the lane list is. **Dispatch happens
when lanes are free**, so the zero-lane state is the canonical dispatch
moment, not an exotic one."* REJECTED at `1bfe8f1`, on this card's own
absorbed T-227 criterion — *the dispatch guard SHALL never report it
disjoint* — and the sentence it still produced is verbatim the one
`lanes.test.ts`'s own comment names as closed.

**I OWE THIS ONE PLAINLY: I SAW IT WHILE BUILDING AND TALKED MYSELF OUT
OF IT.** The build reasoned that *"the dispatch guard"* meant
`compareFences` and `lane-fence.mjs`'s arm, concluded the criterion was
satisfied there, and moved on — having already noticed that `holds` is
empty when no lane is live. That is the shape the ceremony table gives a
guard-class card a verifier FOR: the author of a cage deciding which
question the cage was asked. The verifier's reproduction is three lines
and I could have run it.

**Reproduced at `1bfe8f1` before touching anything**, and the pair is
what makes it a finding rather than a claim: `NO LANES → startable, "it
reserves nothing, disjoint from every live lane"`; `ONE LANE →
unfenceable`.

**THE REMEDY IS THE VERIFIER'S TERM AT A DIFFERENT SITE, AND THE
DIFFERENCE IS DEFENDED RATHER THAN SMUGGLED.** The verdict names a
`fence.tokens.length === 0` branch placed BEFORE the `holds.length === 0`
branch. I added the term TO that guard instead — `holds.length === 0 &&
fence.tokens.length > 0` — because an early return answers correctly and
DROPS the clauses the `unfenceable` branch accumulates when lanes are
also live: measured, the one-lane reason still carries its `cardMissing`
clause beside the undeclared one, which an early return would have lost.
One exit, one copy of the sentence (T-057). **It also forced a guard that
was not there**: `[].every(...)` is TRUE, so once that line stopped
returning for every empty `holds`, `ownLaneOnly` would have indexed
`holds[0]` — `undefined` — and thrown out of a module whose contract is
that it never throws. `ownLaneOnly` is now guarded on the count, and a
mutant proves it.

**SCOPE, MEASURED BEFORE IT WAS CHOSEN.** A wider remedy —
`fence.unusable.length > 0` beside the token count — is the same class
and is defensible on this module's own closing sentence (*a fence that
cannot be COMPUTED is not a fence that is free*). Measured over the live
board with no lanes: the verifier's term moves **0** cards; the wider one
would additionally move **`T-164-s1` (`planned`, unusable `["bin"]`)**
from `startable` to `unfenceable`. That is a different criterion and
another card's dispatchability, so it is NOT taken here and is filed as
**`T-219-s4`**. The verdict said the rest was tested and holds; a fix
pass that quietly re-opened it would be spending a verdict nobody gave.

**THE FIXTURE HELPER MOVED, AND THREE BODIES SAY WHY.** Completing the
refusal reddened three existing bodies about ORDERING and `underway`
whose fixture cards happened to declare no fence. `card()` in
`lanes.test.ts` now gives each fixture its own `fixture/<id>` domain
unless the caller passes `touches: []` explicitly — so the two bodies
that genuinely need an undeclared fence DECLARE that they do, in one
visible token, instead of relying on the absence of an argument.

### Where the brief was wrong

- **Row 4's base commit is wrong, and the brief says it may be** (T-233's
  known defect). It names
  `4a9c68cc9c13426593e464440fddc8c851e2dea7` as the base and
  `d272558331a826ae6a82a4ff91d6d82ea6f6fe1c` as the integration tip;
  this worktree's HEAD at the cut was **`d272558331a826…`**, the
  dispatch stamp itself, which is what the lane was actually cut from.
  The dispatching message said so and the repository confirms it.
- **Row 5's lane list was already stale when I read it.** It names five
  live lanes (`T-018-s2 T-219 T-230-s3 T-236-s5 T-237`); by the time
  this lane finished, `T-237` had merged (`44a95c3`) and `main` had
  moved to `7203db8`. A lane list is a live-environment fact and the
  brief's own rule 2 says to re-read it, which is what the gate
  derivation above does.
- **The advisory line's third signal is wrong about this card.** It
  reads *"the card carries no acceptance criteria, so there is nothing
  to build against"*. The card's **What to build** section is four SHALL
  clauses plus a named positive control, and the CORROBORATION adds a
  fifth; they are simply not under a heading spelled *Acceptance
  criteria*. The signal measured the heading, not the card.
- **The dispatching message's shape was right and its scope was one
  refusal short.** It asked for the containment refusal with
  `sharedDomain` semantics and T-227's instance covered, and both are
  built. What it did not name is the SLUG branch, where the same check
  was equally absent; that is built too, because the criterion is about
  a token's DOMAIN and a slug has domains.
- Nothing else in the brief was contradicted by the repository.

### For the verifier

- The subject is `unfenceableWithin` in `lib/parser/src/fence.ts` and
  its two call sites, `compareFences`' token-less guard, and `rule`'s
  third clause in `lib/parser/src/lanes.ts`.
- The three refusals a mutant should try to widen or narrow are: the
  DIRECTION (a file inside `docs/tasks` must stay fenceable — 21 live
  tokens depend on it), the SEPARATOR (`docs/task` must not swallow
  `docs/tasks`), and the ORDER (the refusal must precede the
  `knownPaths` oracle).
- The e2e lane is RED by two named bodies at this tip and the cause is
  this diff. That is disclosed, routed as `T-219-s1`, and is the one
  thing about this lane that a green report would have hidden.

## FENCE WIDENED, 2026-09-02 — fast path A, by the dispatching seat

Amended on the integration branch while the lane was live: the blind
verifier measured at the base that a correct containment refusal reds two
bodies in tools/e2e/tests/lane-fence.spec.ts (:987 and :1711), whose lane
fixtures fence the bare `docs` this card exists to refuse. Rule 5 forbids
widening from inside the lane; the seat widened it here, re-expanded the
manifest against this commit, and sent the executor this line by path.
The two fixtures are repaired inside the lane rather than routed.

## Absorbs: T-219-s1 (2026-09-02, at the fence widening)

`T-219-s1` was this lane's routed finding while the fence was
`[lib-parser]`: a correct containment refusal reds two bodies in
`tools/e2e/tests/lane-fence.spec.ts` whose lane fixtures fence the bare
`docs` this card exists to refuse, and rule 5 forbids widening from
inside the lane. The dispatching seat widened the fence by fast path A
(the section above), so the repair was performed here instead of routed,
and the suggestion file is removed in this commit per
`method/tasks/TASK-FORMAT.md`'s promotion encoding.

**What the repair actually was**, since the routed card's guess at it was
right in shape and short in one place:

- **`:987` — *the carve-outs each free a DIFFERENT write, and the fence
  still holds around them*.** Its fixture now names its pieces:
  `[tools/e2e, <its own card>, <another card>, docs/STATE.md,
  docs/checkpoints, docs/ROADMAP.md]`. Naming ANOTHER card by name is
  what still arms the unfenceable-directory carve-out — that is the
  spelling rule 5 prescribes in the same breath as the refusal, and the
  routed card had not spotted that the carve-out needs the path to be
  RESERVED by a live lane at all.
- **THE HALF THE ROUTED CARD MISSED, found by building it**: the
  own-card carve-out is now unreachable for every possible manifest, so
  that write is allowed as `not-a-lane` instead. The body asserts the new
  code with the reason on the assertion. The arm lives in
  `.claude/hooks/lane-fence.mjs`, outside even the widened fence, so it
  is filed as **`T-219-s3`** — guard-class, and its landing will red this
  body by name on purpose.
- **`:1729` — *`excluded` PARTICIPATES*.** Its sibling lane now fences
  `[docs/rooms, <its own card>]`, which exercises the carve-out's
  exact-file arm — the one `expandFence` implements — rather than
  reaching the card by containment. Renamed from *…the lane that holds
  its directory* to *…the lane that carved it out*, because after this
  card no lane holds that directory.
- **ADDED: *a card fencing a domain that CONTAINS `docs/tasks` is
  refused at the arm, naming what it swallowed*.** Without it the only
  trace of the ruling at this call site would be the ABSENCE of the two
  `docs` fixtures, and an absence pins nothing.
- **`:1802` — *a card with an EMPTY `touches:`…*** was green throughout
  and its comment now says why: it reads `lane-fence.mjs`'s *expands to
  no path at all*, which stays reachable only because this card's
  empty-`touches:` refusal is an ISSUE and not a `Fence.unusable` entry.

**TWO TEST NAMES MOVED AND ONE WAS ADDED, SO `docs/CAPABILITIES.md` IS
STALE AT THIS TIP.** The census is generated from these spec names and
is outside the fence; regeneration (`npm run capabilities` from
tools/e2e/) is the integrator's, in the merge commit, per
`docs/CONVENTIONS.md`. `npm run capabilities:check` reds until then, by
design.
## VERDICT — 2026-09-02, claude-opus-5@subagent (verifier seat, `review: independent`)

**REJECTED at `1bfe8f1dff930d764b62d692196cd0c885119c43`**, on ONE
reproducible failure against this card's own absorbed criterion. Every
other criterion is MET, several beyond what was asked, and the finding
is two lines at a site this lane already edited.

**BLINDNESS: CLOCK-SHAPED.** The bench
(`/Users/ujju/Projects/nputer-V-T-219`) was cut at this card's base
alongside the lane, and phase 1 was sealed before the branch carried a
commit: `attack-V-T-219.md`
sha256 `77f43864fd4153b0c8e3140debba78bcd4210a0ce2018adf2abcde6941a7cc97`,
`ground-V-T-219.md`
sha256 `5681cc842ca6a9aa383ad49fd0b1b35d1b623a313400f42aef079a55f724d5b1`,
sealed 2026-09-02T03:08:15Z. Disclosed there and repeated here: a
`git worktree list` at this seat's first call printed the lane's row at
the base SHA — a tip at one instant, no content. **I did not read the
Implementation notes above**; I read section HEADINGS to check the card's
shape, the diff, and the code comments inside it, which are the artifact.

### THE FINDING — `readDispatchOrder` still reports an undeclared fence `disjoint`, and does it exactly when it matters

The absorbed T-227 criterion reads: *"IF a card's `touches:` is empty
THEN `expandFence` SHALL refuse it, naming the card, and the dispatch
guard SHALL never report it disjoint."* The first half is met. The
second is met **only while at least one lane is live**.

Reproduced in this bench at `1bfe8f1`, `lib/parser/dist`:

```js
const ROADMAP = { path:'docs/ROADMAP.md', content:'# Roadmap\n\n## F-01 One\n' };
const card = { path:'docs/tasks/T-001-a.md', content:
  '---\nid: T-001\ntitle: A\nstatus: planned\nmilestone: 4\npriority: 1\n' +
  'blocked_by: []\ntouches: []\n---\n\nBody.\n' };
readDispatchOrder(parseProjectFromFiles([ROADMAP, card]), []).all
```

**Actual, at this tip:**

```
T-001  state=startable  T-001 has no unmet blocker and it reserves nothing,
                        disjoint from every live lane.
```

That is, verbatim, the sentence `lanes.test.ts`'s own new comment names
as the defect this card closed — *"such a card came back `startable`,
wearing the sentence 'it reserves nothing, disjoint from every live
lane'"*. With one lane handed in, the same board answers `unfenceable`
with the new clause, correctly. So the refusal is armed when the card is
held anyway and disarmed when it is not.

**WHY THIS IS NOT A CORNER.** `rule()` reaches `compareFences` only
through `holds`, and `holds` is empty when the lane list is. **Dispatch
happens when lanes are free**, so the zero-lane state is the canonical
dispatch moment, not an exotic one. `brief.mjs --dispatch` is what STATE
sends every seat to for *what can START*, it is `readDispatchOrder`, and
I found no other empty-`touches:` guard between it and `--write-fence`
(`grep` over `tools/e2e/scripts/dispatch-order.mjs` and `brief.mjs`).
The write side still refuses at the arm — which is exactly the
"two halves disagree in the safe direction, by luck rather than by rule"
that T-227 was filed about. Latency is unchanged in kind: 0 `planned`
cards carry an empty `touches:` at this tip, and 98 cards do (96
`parked`, 2 `done`), so one triage promotion is still all it takes.

**THE REMEDY IS IN FENCE AND IS SMALL.** `rule()` already receives
`fence`. A `fence.tokens.length === 0` branch placed BEFORE the
`holds.length === 0` branch in `lib/parser/src/lanes.ts` closes it, and
the clause text already written for the hold path can be reused. A body
pinning the zero-lane case belongs beside the `T-219/T-227` body in
`lanes.test.ts`, whose fixture hands in `[lane('T-002')]` and therefore
cannot see this.

### WHAT IS MET, measured rather than accepted

- **The predicate is the one correct spelling.** `unfenceableWithin` is
  `sharedDomain(domain, path) === path` over the LIST — one-directional,
  routed through the module's single containment primitive, no second
  prefix rule (T-057 held). Probed at the tip: `docs`, `docs/`,
  `./docs/**`, `docs//`, `docs/tasks`, `docs/tasks/` → `rejected`;
  `docs/task`, `docs/tas`, `docs/tasks-archive`, `docs/tasksX`,
  `docs/tasks/T-1.md`, `docs/tasks/rejected`, `docs/ROADMAP.md`,
  `docs/architecture/components/`, `docs/rooms` → `path`, reserving
  themselves. Both separator-less directions and the both-ways reading
  are excluded by measurement, not by reading.
- **The refusal names what it swallowed** — `entry "docs" fences 'docs',
  which CONTAINS 'docs/tasks'` — and a token that IS the entry does not
  claim containment.
- **The slug arm is closed**, which the card did not ask for and the
  cascade needed: the refusal sits after the slug branch's `continue`,
  so a component whose `paths:` reached the directory walked past the
  rule. Synthetic registry, with the control that a narrow slug still
  resolves, plus a live-registry census proving 0 instances.
- **The reverse direction is protected, live.** 21 tokens across 5 cards
  (T-108, T-108-s2, T-159-s1, T-160-s4) name files inside `docs/tasks`;
  all resolve `path` at this tip, and a new census body asserts it with
  a non-empty guard.
- **T-054 is recorded, not repaired**, and status does not filter the
  census: `['T-054 docs [done]']`.
- **`compareFences` changes its ANSWER, not just its issue list** —
  `unusable` in both argument orders, with `overlapping`/`disjoint`
  controls beside it. The `Fence.unusable` list is deliberately left
  empty (raw tokens only), which is also what keeps `lane-fence.spec.ts`'s
  empty-`touches:` body reading `expands to no path at all`; I measured
  in phase 1 that that body's colour turns on exactly this wording.
- **No body was deleted.** fence.test.ts 27→40, lanes.test.ts 16→17,
  lane-fence.spec.ts 53→54; the two names that disappear are RENAMES
  whose properties are preserved and strengthened, and the own-file
  carve-out was re-fixtured onto `docs/rooms/` with its kill set
  deliberately kept disjoint from the sibling-directory control's.
- **Purity and interfaces hold**: no throw, no filesystem, one type-only
  import, `UNFENCEABLE_PATHS` still `readonly` + `Object.freeze`d — which
  `lane-fence.spec.ts:1729`'s constitution check depends on.
- **Fence conduct is correct** (lane-protocol rule 5). The diff touches
  `lib/parser/**`, `tools/e2e/tests/lane-fence.spec.ts`, this card and
  two routed findings — all inside the widened `touches:` or the
  unfenceable directory. The two e2e reds I pre-measured in phase 1 were
  the subject of a fast-path-A widening rather than a breach, and
  `.claude/hooks/lane-fence.mjs` was ROUTED as `T-219-s3` rather than
  touched.

### DRILLS I RAN MYSELF (verifier.md 2b)

Eight code mutants and three data mutants, applied in this bench,
landing read from `git diff --numstat`, reverted after each. **All
killed.** `bothways` 7, `nosep` 8, `equality` 6, `oneway` 12,
`slugskip` 1, `noissue` 1, `nocompare` 2, `noclause` 1 (of 362).

**KILL-SET CONTAINMENT, settled by a ninth mutant rather than argued.**
An asymmetric `compareFences` guard (`a.tokens.length === 0` only) kills
the `fence.test.ts` T-227 verdict body and NOT the `lanes.test.ts` body,
while `noclause` kills the lanes body and not the fence one. Neither
kill set contains the other; both are load-bearing.

**THE POSITIVE CONTROL WAS SEEN FAILING, twice, in the arrangement's
absence.** In phase 1, before this diff existed, a `widened` mutant
(same first path segment) red the sibling-directory control. At this
tip, the DATA mutant that adds `docs/architecture/components` to
`UNFENCEABLE_PATHS` reds it and the new T-219 control alike (4 bodies).
The list emptied reds 11; the list replaced with `['method/rooms']` reds
7, including the named-inside control — so the block is DERIVED from the
data and not typed against it, which no code mutant could have shown.

### THE SIX E2E REDS ARE NOT THIS DIFF'S, AND I MEASURED THAT RATHER THAN RELAYING IT

`npx playwright test` at this tip, `NPUTER_E2E_PORT=25219`: **549
passed / 6 failed** (555 bodies; the base carried 554). The six:
`card-preflight.spec.ts:684`, `checkout-currency.spec.ts:852` and `:953`,
`lane-lock.spec.ts:899`, `session-economics.spec.ts:179` and `:365`.

**CONTROL: the identical six fail at the BASE `d272558`, in this same
bench, now** — where the diff does not exist. The same bench ran
**554/554 green at that same base** earlier today. What changed is the
MACHINE, not the tree: main advanced past the base and now carries
`99349db`, the newest main commit touching `.claude`, so
`checkout-currency` judges any checkout at or below the base
`guard-surface-behind`, 35 commits back; and new worktrees
(`nputer-T-018-s5`, `nputer-V-T-018-s5`, `nputer-T-215`,
`nputer-V-T-215`) appeared in the machine-wide sweep. That is
`method/lane-protocol.md` rule 4's own MACHINE-scoped-surface hazard,
and none of the six is attributable to this card.

### GATE STATE AT `1bfe8f1`, each with its command

| gate | result |
|---|---|
| `npx vitest run` (lib/parser) | **362 passed / 362**, 16 files |
| `npx tsc --noEmit` (lib/parser) | 0 |
| `npm run build` (lib/parser, app) | 0 |
| `npm test` (app) | **1131 passed / 1131**, 50 files |
| `npx playwright test` (tools/e2e) | 549 / 6 — all six reproduce at the base |
| `lint:tokens` · `lint:docs` · `typecheck` (tools/e2e) | 0 · 0 · 0 |
| `docs-gate.mjs <the 8 changed paths>` | 0 — frontmatter parses, legal statuses, budgets hold |
| `capabilities:check` | **1, STALE** — two test names moved and one added; regeneration is the integrator's at the merge (CONVENTIONS) |
| `index --check` (app/src-tauri) | **1, STALE** — a real stale (counts printed, not `MISSING`); regeneration is the integrator's with the checkpoint |

Neither STALE is attributable to this lane; both were pre-committed as
non-attributable in my sealed phase-1 set before I saw a line of the diff.

### SECURITY SWEEP (verifier.md 3)

No new input path, no endpoint, no query, no secret, no dependency. The
realistic hazard in this change is a WIDENED refusal — a guard that
refuses lanes which never touch reintroduces rule 5's own measured
failure — and the near-miss probes above close it in both directions.
The one direction that could have gone wrong quietly, refusing the
`docs/tasks/T-*.md` narrowing the rule itself prescribes, is pinned by
two controls, one of them over live board data. Nothing found.

### ROUTED FINDINGS, checked because prose is a code input here

`T-219-s2` and `T-219-s3` both parse: legal `status: suggested`,
one-level suffix ids, no reserved indicator opening either title,
`touches:` declared. `docs-gate.mjs` reads them clean.

### TO CLOSE

Fix the finding, add the zero-lane body beside the existing
`T-219/T-227` one, and this is an APPROVE. Nothing else in the diff is
in question, and this verdict's figures are all measured at
`1bfe8f1dff930d764b62d692196cd0c885119c43` except the base control,
measured at `d272558331a826ae6a82a4ff91d6d82ea6f6fe1c`.

## RE-VERDICT — 2026-09-02, claude-opus-5@subagent (verifier seat, `review: independent`)

**APPROVED at `518da9dfe5cb3d1ae390d4d0c53ce1a29f7d3edf`.** The finding
above is closed, measured on MY OWN fixture rather than on the body the
lane wrote for it, and the fix moved nothing else.

### THE FINDING IS CLOSED — my own three-line fixture, both ways

The same script that produced the rejection, unchanged, at this tip:

| board | before (`1bfe8f1`) | now (`518da9d`) |
|---|---|---|
| `touches: []`, **zero lanes** | `startable` — *"it reserves nothing, disjoint from every live lane"* | **`unfenceable`** — *"T-001 declares no `touches:` at all… nothing can be ruled disjoint from it"* |
| `touches: []`, one lane live | `unfenceable` | `unfenceable`, unchanged |
| `touches: [app/src/main.tsx]`, zero lanes — **the control** | `startable` | `startable`, *"disjoint from every live lane"*, unchanged |

The forbidden sentence is gone from the case that produced it and still
present where it is true. **The refusal did not widen**: the declared
fence is still startable on the same zero-lane board, which is the
direction a careless fix breaks and which would look just as green.

### THE REMEDY DIFFERS FROM THE ONE I NAMED, AND THE DEVIATION IS RIGHT — verified, not accepted

I proposed an early `fence.tokens.length === 0` return. The lane added
the term to the existing guard instead
(`holds.length === 0 && fence.tokens.length > 0`) and falls through, on
the argument that an early return drops the clauses the `unfenceable`
branch accumulates. **Measured at this tip** on a board carrying an
undeclared card AND a lane whose card is not in the checkout, the single
reason carries BOTH causes:

> *…T-001 declares no `touches:` at all, so it has no fence to compare —
> an undeclared fence is not an empty one…; **this checkout has NO CARD
> for T-999** (refs/heads/task/T-999-lane at /w/T-999), so that fence
> could not be expanded at all…*

My remedy would have returned before that clause list is built. **The
lane's shape is better than the one I named**, and one copy of the
sentence survives (T-057) rather than two.

**AND IT EXPOSED A REAL THROW.** `[].every(...)` is `true`, so once the
guard above stopped returning for every empty `holds`, `ownLaneOnly`
would have indexed `holds[0]` — `undefined` — in a module whose header
promises *"Nothing here throws"*. I re-derived both mutants myself,
landing read from `git diff --numstat`, reverted after each:

- **M16**, the old guard restored → the new body reds on *"an undeclared
  fence got a green light at the dispatch moment"*. 1 of 363.
- **M17**, the count guard removed → the same body reds with
  `TypeError: Cannot read properties of undefined (reading 'lane')`.
  The guard is load-bearing, not defensive.

### THE FIXTURE CHANGE MASKS NOTHING — checked, because a test-helper default is where a mask would live

`card()` in `lanes.test.ts` now defaults each fixture to its own
`fixture/<id>` domain, with `touches: []` as an explicit opt-in to the
undeclared case. I reverted that default to `[]` and re-ran: **exactly
three bodies red**, and all three are about `underway` and dispatch
ORDER — nothing about fences. So the default repairs fixtures that
declared no fence by accident and hides no fence behaviour. The two
bodies that need the undeclared case pass `touches: []` in one visible
token, which is the right way round.

### THE WIDER REMEDY'S COST IS REAL, so routing it rather than taking it was correct

The executor filed `T-219-s4` instead of widening the term to
`fence.unusable.length > 0`. **Measured over the live board at this tip,
both ways:** oracle-less, that widening moves exactly one live card —
`T-164-s1` (`status: planned`, `touches: [bin]`, unresolved because no
component claims `bin/`) — from `startable` to `unfenceable`; **with**
the dispatch oracle supplied it moves nothing. A live `planned` card is
not collateral a fix takes on the way past. Routed correctly, and
`T-219-s4` parses clean.

### NO ADJACENT BREAKAGE — the live board answers identically

`readDispatchOrder` over this repository's own board, zero lanes, with
and without the oracle: **114 startable, 0 unfenceable, 0 fenced** — the
same 114 as at `1bfe8f1`. `parseProject` issues 0. Rejected tokens still
`['T-054 docs [done]']`. `lanes.ts` gained no `throw`, no filesystem
read and no import.

### GATE STATE AT `518da9d`, each with its command

| gate | result |
|---|---|
| `npx vitest run` (lib/parser) | **363 passed / 363**, 16 files (+1 body) |
| `npx tsc --noEmit` (lib/parser) | 0 |
| `npm run build` (lib/parser, app) | 0 |
| `npm test` (app) | **1131 passed / 1131** |
| `npx playwright test` (tools/e2e) | **549 / 6** — the SAME six, and I proved at the previous pass that all six reproduce at the base `d272558` in this bench, which ran 554/554 green there earlier the same day. Machine-scoped, not this card's |
| `lint:tokens` · `lint:docs` · `typecheck` | 0 · 0 · 0 |
| `docs-gate.mjs <the 4 changed paths>` | 0 — frontmatter parses, legal statuses, budgets hold |
| `capabilities:check` | 1, STALE — carried over from the previous pass's test renames; the integrator's at the merge |
| `index --check` | 1, STALE — a real stale (counts printed, not `MISSING`); the integrator's with the checkpoint |

Neither STALE is attributable to this lane; both were pre-committed as
non-attributable in my sealed phase-1 set.

### CLOSING

Everything the previous verdict approved still holds — the predicate,
the slug arm, the reverse direction over live data, the message, the two
fixture repairs, the routing, the fence conduct. The one finding is
closed, closed better than I specified, and the fix carried its own
second-order hazard out with it. `status: verifying` is the lane's to
move; the merge conflict on this card is the integrator's, resolved with
the lane's copy plus these two verdict sections.

Figures measured at `518da9dfe5cb3d1ae390d4d0c53ce1a29f7d3edf`, except
the e2e base control at `d272558331a826ae6a82a4ff91d6d82ea6f6fe1c`.

## RECOVERY of absorbed texts (the seat's note, 2026-09-02)

The Absorbs sections above were written by a script that cut each absorbed body at 1,400 characters, so their acceptance criteria may end mid-sentence. The whole text of each absorbed card is in history:

- T-219-s1: no deleting commit found; the text above is what exists.

A lane building this card reads those before it builds.
