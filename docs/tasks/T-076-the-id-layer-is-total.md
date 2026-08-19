---
id: T-076
title: The id layer is total, and every issue names its space
feature: F-02
milestone: 4
priority: 35
size: M
status: verifying
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-053-s2, T-053-s3, T-053-s4 (fourth triage, 2026-08-19). The
suggestion files are removed in the same commit as this card. All three
live in `lib/parser/src/**`, all three are the id layer T-053 just made
reachable by a plausible input, and all three were deliberately left out
of T-053 because its criteria fenced them. T-053's fourth sibling,
T-053-s1, is NOT here: its subject is what the app RENDERS about these
issues, and it went to **T-077**.

A COMPARATOR THAT RETURNS NaN IS NOT A COMPARATOR. `compareComponentIds`
compares the digit halves with a numeric subtraction and returns that
difference whenever it is non-zero. For ids whose digit run exceeds what
a double can hold — roughly 309 digits — both sides are `Infinity`, the
difference is `NaN`, and `NaN !== 0` is TRUE, so the comparator returns
`NaN` before the string fallback is ever reached. `Array.prototype.sort`
is then free to do anything; V8 leaves the pair as-is. So "first match by
component id order wins" — the rule the whole `ambiguous-mapping`
message rests on — silently becomes "first by whatever order the files
arrived in". This is the SAME class of defect T-030's textual slot key
was written to avoid, one function away from it.

**AND IT GOVERNS T-053'S OWN OUTPUT.** The comparator is passed into
`aliasedIdSlots`, which sorts each slot's spellings with it, so past 309
digits the order of the `ids` array on a component-space `aliased-id`
issue — and the order the spellings are named in its message — is
implementation-defined too. NOT a regression: byte-identical to what
T-030 already shipped at that site. But `aliasedIdSlots`'s doc comment
argues the `compare` argument is safe because any numeric-first
comparator "has already degenerated to exactly this" string order, every
numeric part inside a slot being equal by construction. That reasoning
is sound for every id the comparator can weigh and FALSE in exactly this
range — so the comment currently states as a guarantee the one thing
that is not guaranteed.

NOT LIVE TODAY: the longest component id in the tree is `C-14`, and the
identity gate demands two-or-more digits but sets no upper bound, so any
file anyone writes can reach it. This is a totality fix, not an incident
response.

## Acceptance criteria
- `compareComponentIds` SHALL be TOTAL for every input: compare digit
  runs TEXTUALLY (strip leading zeros, then longer-is-greater, then
  lexicographic) — the same primitive `idSlotKey` already uses, so the
  two agree by construction rather than by coincidence. Ordering for
  every id the tree can currently hold SHALL be UNCHANGED, and that
  SHALL be proved rather than asserted: the existing comparator pin
  covers only small ids and SHALL gain cases past the double range in
  both directions plus a sort-stability case.
- `aliasedIdSlots`'s doc comment SHALL stop stating as an existing
  guarantee the property this criterion creates.
- `duplicate-id` SHALL carry the same required `space` field its sibling
  `aliased-id` gained, at ALL FOUR emit sites — component, the task disk
  layer, the task pure layer, and the backbone feature. Today the only
  way to know which space a `duplicate-id` came from is to read its
  prose or guess from the shape of `id`, which is exactly what T-053's
  criterion 5 ruled out for the very same concept: a UI that can filter
  aliases by space still cannot filter duplicates. `duplicate-id` is
  asserted with whole-object `toEqual` in several suites, so those pins
  SHALL move DELIBERATELY and the moves SHALL be listed in the notes.
- THE backbone feature's `duplicate-id` SHALL carry both declaration
  sites in `files` for the same reason the feature alias does — both
  declarations live in the roadmap — and the two messages SHALL end up
  saying the same kind of thing in the same shape.
- `dangling-reference` SHALL gain a NEAR-MISS HINT, not a new kind: when
  a reference's slot key matches a DECLARED id's slot key, the message
  SHALL say so. Reproduced today — a task declaring `T-001` and naming
  `T-01` in its own `blocked_by`, beside a roadmap declaring `F-01` and
  a `feature: F-1`, produces two messages that are TRUE and unhelpful in
  the one case that matters: the author wrote a padding variant of an id
  that exists one line away, and the parser tells them it does not
  exist. Both check sites already hold the declared-id set and the
  helper already exists.
- TWO THINGS SHALL BE RULED BEFORE BUILDING, not during: whether the
  hint is message text or a structured field (a consumer may want to
  offer the fix), and whether the component space's `depends_on` gets
  the same treatment — it has the same shape and the same helper
  available. Changing a `dangling-reference` message moves pins in three
  suites.

Verification: headless parser Vitest. Poison discipline applies, and per
T-078's clause the mutation SHALL be one-sided — several of these
messages are shared literals between producer and assertion, which is
exactly the shape that stays green under a global substitution.

## Implementation notes

2026-08-19, executor claude-opus-5 @fresh, worktree
/Users/ujju/Projects/nputer-T-076, branch task/T-076-id-layer from
`e4a5ae7`. Fence: `lib/parser/**` plus this card and its suggestion
files.

### Understanding, before anything was touched

This card closes three holes the T-053 lift left in the id layer, all
inside `lib/parser/src/**`. First, `compareComponentIds` is not a
comparator: past roughly 309 digits `Number(na) - Number(nb)` is
`Infinity - Infinity` = `NaN`, `NaN !== 0` is true, so it RETURNS `NaN`
before the string fallback runs — and it is the comparator "first match
by component id order wins" rests on, and the one T-053 passes into
`aliasedIdSlots`, so both the `ambiguous-mapping` winner and the `ids`
array of a component-space `aliased-id` are decided by something other
than id order in that range. It becomes a textual digit-run comparison
sharing `idSlotKey`'s leading-zero strip, so the comparator and the slot
key agree by construction; `aliasedIdSlots`'s doc must stop claiming a
guarantee it does not have, and must not then claim this card's new one
as pre-existing. Second, `duplicate-id` spans three id spaces with no
structural discriminator while its sibling `aliased-id` gained one at
T-053, so it gets a required `space` at all four emit sites, with the
backbone message reshaped to the alias message's shape; several suites
pin it with whole-object `toEqual`, so those move deliberately and are
listed. Third, a `dangling-reference` whose id differs from a DECLARED
id only in zero padding says only "nothing declares it", which is true
and sends a human hunting something that does not exist — so it gains a
near-miss HINT, never a new kind. The controls are the live-tree smoke
test staying at zero issues, the app suite passing UNMODIFIED, and a
one-sided poison drill over every new or changed test body.

### The two rulings, made and recorded BEFORE building

Criterion 6 requires both to be ruled before, not during. This section
was committed on its own, ahead of the first source byte, so the order
is checkable in `git log` rather than asserted here.

**RULING 1 — the hint is a STRUCTURED FIELD *and* message text:
`nearMiss?: string[]` on the `dangling-reference` member, present only
when non-empty, holding every DECLARED id sharing the reference's slot
key, in model order.**

1. Criterion 5 already mandates the prose ("the message SHALL say so"),
   so the open question is only whether a field is added ALONGSIDE. It
   is.
2. **A prose-only hint contradicts this card's own criterion 3.** T-053
   criterion 5 ruled that a consumer must tell id spaces apart "without
   parsing prose", and criterion 3 here removes the last prose-only
   discriminator in this union. Shipping a new prose-only signal in the
   same commit would put back exactly what is being taken out.
3. **The consumer criterion 6 names needs the ID, not a sentence.**
   "A consumer may want to offer the fix" is a quick-fix affordance; it
   cannot be built on a regex over an English clause that this card is
   also free to reword.
4. **Free to shape now, not later** — re-derived rather than
   transcribed from T-053: `git grep dangling-reference` over the whole
   repo returns hits only inside `lib/parser/**` and TWO app TEST files
   (`app/test/select-board.test.ts:507`,
   `app/test/select-task-detail.test.ts:309-310`), both
   `objectContaining`. No app SOURCE file reads the kind at all.
5. **An ARRAY, not a string, because the declared space can itself be
   aliased.** `T-01` and `T-001` both declared, `T-0001` referenced:
   naming one of two candidates would be a guess dressed as a fix. Model
   order is the determinism every other multi-id member of this union
   already uses.
6. **Optional rather than always-present-and-usually-empty.** Absence
   can only mean "no declared id shares this slot" — it is not the
   learned-default shape T-053 rejected for `space`, where absence would
   have had to be read as "component". An always-present `[]` would also
   move every existing whole-object pin for zero information.

**RULING 2 — component `depends_on` GETS the same hint. All THREE
`dangling-reference` emit sites, one shared helper.**

1. The card is titled "the id layer is TOTAL", and its whole complaint
   about `duplicate-id` is that a rule was applied in one space and not
   its siblings. Closing that asymmetry while opening a new one in the
   same commit is self-defeating.
2. The component space is where aliasing was FIRST found (T-030) and is
   the only space with a live registry today; `C-05`/`C-005` is the
   worked example in every doc comment in the module.
3. The site needs no new state: `parseComponentSet` already holds `byId`
   at the dangling loop, exactly as the card observes of `validate.ts`.
4. The cost is one shared helper against two of three sites behaving
   differently for no stated reason.

**Consequence of ruling 1 that is deliberate, not incidental**: the
near-miss index is keyed by a slot key derived from untrusted file
content, so it is a `Map` and never an object literal (ADR-009), and a
`blocked_by: [__proto__]` must not acquire a near miss through inherited
state. Pinned rather than argued.

### The card's claims, reproduced FIRST

Every one reproduced, three with a correction to the citation.

**The NaN comparator, at the branch point.** `Number('9'.repeat(309))`
is the first `Infinity` (a leading 1 needs 310 digits), and against the
branch-point body `compareComponentIds('C-'+'9'.repeat(400), 'C-'+'9'.repeat(401))`
returns `NaN`. Sorting `[b, a]` and `[a, b]` gives two different arrays,
which is the defect stated exactly: not a wrong answer, NO answer.

**It governs T-053's own output — and the card UNDERSTATES the reach.**
`aliasedIdSlots` is a bare `sort(compare)`, so a component `aliased-id`
past 309 digits reported its `ids` in ARRIVAL order: the same two ids in
two file namings produced `[402, 403]` and `[403, 402]` character
lengths. But `ambiguous-mapping` degrades DIFFERENTLY, and neither the
card nor the dispatch says so: `component.ts:374` sorts with
`compareComponentIds(a.id, b.id) || (file compare)`, and `NaN` is FALSY,
so the `||` silently swallowed it and the winner was decided by FILE
PATH. Reproduced: two components with genuinely different 400/401-digit
ids declared `ids[0]` — the id the message names as winning file mapping
— to be whichever file sorted first. So the rule broke in two places by
two different mechanisms, one non-deterministic and one deterministically
wrong, and only the first was on the card.

**`duplicate-id` has no space discriminator.** Reproduced at all four
sites. **Citation correction: the dispatch's `roadmap.ts:48` does not
resolve** — line 48 is the `description` split, and the emit is
`roadmap.ts:51-56` with `kind` on `:52`. The other three
(`component.ts:313`, `project.ts:80`, `files.ts:143`) resolve exactly.

**The roadmap's feature `duplicate-id` already carried
`files: [file, file]`** at the branch point (`roadmap.ts:54`). The
dispatch presents it as missing; criterion 4's live half is the second
clause, the message SHAPE, and that is what moved.

**`dangling-reference` near miss.** Reproduced through the built parser
at the branch point, both halves: `blocked_by: [T-01]` in a file
declaring `T-001` said only "no task in the model declares it", and
`feature: F-1` against a backbone declaring `F-01` said only "the
roadmap backbone does not declare it".

**`validate.ts:123` and `:134` resolve exactly** as the two
`dangling-reference` emit sites.

### Criteria → evidence

**C1 — `compareComponentIds` is TOTAL, and the ordering the tree can
hold is PROVED unchanged rather than asserted.** `id-slot.ts:84` is
`compareDigitRuns` (canonicalize, then longer-is-greater, then
lexicographic) over `id-slot.ts:60` `canonicalDigits`, which is the
strip `idSlotKey` uses — one function, so the comparator and the slot
key cannot disagree about what the digits of an id are.
`component.ts:81` calls it, inside `compareComponentIds`. "Unchanged" is a MEASURED relation, not a
table: `component.test.ts:343` reproduces the branch-point body verbatim
as `numericSubtraction` and compares SIGNS over all **484 pairs** of a
22-id set (the pin asserts the 484 so the sweep cannot become vacuously
empty), then re-sorts the live registry under both. Past the range, in
both directions: `component.test.ts:372` (same-length 401-digit pair
both ways, plus 400-vs-401 digits) and `id-slot.test.ts:149`.
Sort stability: `component.test.ts:396` sorts one list and its reverse
to the same array and asserts the OLD body does not, plus
`id-slot.test.ts:162`.

**C1's one behaviour change that is not "unchanged", stated rather than
buried.** Between 2^53 and Infinity the old body was WRONG, not merely
imprecise: `Number` rounds 17 nines and 1e17 to the same double, the
difference was 0, and the STRING fallback then put the 17-digit id after
the 18-digit one it is smaller than. The new body reverses that pair.
Pinned as a deliberate correction at `component.test.ts:410` and
`id-slot.test.ts:139`, asserting BOTH bodies so the direction of the
change is in the pin.

**C2 — the doc comment stops claiming the guarantee, and does not then
claim the new one as pre-existing.** `id-slot.ts:180-195`, inside `aliasedIdSlots`'s doc block
(`id-slot.ts:164-196`). It now says
the fall-through is a property of the comparator PASSED, names what was
false and in which range, says T-076 made the one comparator this
package passes total, and says a caller passing its own `Number()`-based
comparator would put the NaN back and nothing here can stop it. The
property itself is pinned at `component.test.ts:422`.

**C3 — `duplicate-id` carries `space` at all four sites.**
`component.ts:340`, `project.ts:81`, `files.ts:144`, `roadmap.ts:62`;
the type is `types.ts:238` with its reason. Read structurally off ONE
mixed three-space model at `files.test.ts:192` — the criterion's own
consumer story, `['task','feature','component']` with the matching ids
so the spaces cannot be read off three copies of one issue.

**The four pins that moved, deliberately, each dated and reasoned in
place** (the criterion asks for the list):

| pin | what moved |
|---|---|
| `component.test.ts:449` | `space: 'component'` added to a whole-object `toEqual` |
| `project.test.ts:89` | `space: 'task'` added to a whole-object `toEqual` |
| `roadmap.test.ts:267` | `space: 'feature'`, AND the matcher TIGHTENED from `objectContaining` to whole-object `toEqual`, AND the message assertion went from one substring to both declarations named individually |
| `files.test.ts:48` | `space: 'task'` added to a `toMatchObject` — a TIGHTENING, not a reconciliation: this pin was green before and after, and would have stayed green with the field missing at that one site |

Nothing else in any pre-existing body moved. `files.test.ts:48` is the
one worth reading twice — it is the fourth emit site and the only one
whose pin could not have caught its own regression, which is mutant (g)
below.

**C4 — the backbone `duplicate-id` and the backbone `aliased-id` now say
the same kind of thing in the same shape.** `roadmap.ts:65` names each
declaration as `'<id>' (line N)`, which is the alias message's shape at
`roadmap.ts:137`; `files` was already `[file, file]`. The consequence
clause is the board's MEASURED behaviour, not a plausible sentence —
`selectBoard` keys columns on the exact string and skips a repeat
(`app/src/lib/board-model.ts:248-249`), so the first declaration's
column survives and the second's name and description are discarded.
Pinned at `roadmap.test.ts:267`, which also asserts the OLD shape is
gone rather than merely unasserted.

**C5 — the near-miss hint, three sites, no new kind.** `validate.ts:143`
(blocked_by), `:156` (feature), `component.ts:396` (depends_on), over
`id-slot.ts:140` `slotNearMisses` and `id-slot.ts:157` `nearMissClause`.
The card's own reproduction is the pin at `validate.test.ts:874`, which
asserts the whole issue object including the exact message and that the
kind LIST is still `['dangling-reference']` — a hint, never a kind.
Feature side `validate.test.ts:899`; component side
`component.test.ts:502`. Absence when there is no near miss:
`validate.test.ts:917` and `component.test.ts:477`, both asserting
`not.toHaveProperty('nearMiss')` rather than an empty array. The `-sN`
suffix is part of the slot, so a hint never crosses it —
`validate.test.ts:932`, where a padded BASE and a padded SUFFIX each get
one and a different suggestion number gets none although both
neighbours are declared one file away. Plural when the declared space is
itself aliased: `validate.test.ts:959` and `component.test.ts:525`, with
`validate.test.ts:959` also asserting the `aliased-id` is still reported
alongside — the hint explains a symptom, it never replaces the root
cause. ADR-009: `validate.test.ts:980` and `id-slot.test.ts:179`.

**C6 — the two rulings are the section above, committed at `a931bfb`,
which is the commit BEFORE the first source byte** (`62bec51`). The
order is checkable in `git log`, not asserted here.

### Obligation — the drill, all three limbs

**Poison sweep: 34 bodies, 34 red, 0 collateral.** The 34 were derived
MECHANICALLY, not by hand: every `it()` block in the six touched files
was extracted by matching its opener's indent to its closing `});` in
both `e4a5ae7` and HEAD, and the bodies whose TEXT differs are the set.
That is exact where walking `-U0` hunk headers is not — the hunk walk
returned 39, five of them pre-existing bodies adjacent to an appended
`describe`. Result: **263 total, 229 passed, 34 failed, 34/34 citing
`T-076 POISON`, zero collateral assertion failures.** 229 is the
pre-poison baseline restated, which is the collateral check said twice.
Restoration proved by **sha256 against `git show HEAD:<path>`** for all
six files, never by a clean `git status`; `git grep "T-076 POISON"`
returns nothing.

**But a poison sweep only proves a body RUNS, so 16 one-sided
discriminating mutants were run against `lib/parser/src/**`. Zero
survivors.** Every mutation is producer-side only — none touches a
literal the producer and an assertion share — and each was verified by
reading the resulting DIFF TEXT rather than a substitution count, which
is the limb a symmetric mutation passed through this week. Each was
restored and re-hashed; a final sweep confirmed every file under
`lib/parser/src` back at its pre-drill sha256.

| mutant | red |
|---|---|
| (a) `compareDigitRuns` → the old `Number()` subtraction | 8 |
| (b) drops the longer-is-greater rule | 9 |
| (c) drops the leading-zero strip | 8 |
| (d) `compareComponentIds` reverts to `Number()` at the call site | 5 |
| (e) `space` dropped at the COMPONENT duplicate site | 2 |
| (f) `space` dropped at the DISK task site | 1 |
| (g) `space` dropped at the PURE task site | 2 |
| (h) `space` dropped at the BACKBONE site | 2 |
| (i) `nearMiss` FIELD dropped, clause kept (validate, both sites) | 5 |
| (j) `nearMiss` FIELD dropped, clause kept (component) | 2 |
| (k) message CLAUSE dropped, FIELD kept (validate, both sites) | 3 |
| (l) `slotNearMisses` stops excluding the reference itself | 1 |
| (m) `nearMissClause` always singular | 3 |
| (n) backbone duplicate message reverts to the old shape | 1 |
| (o) `idSlotIndex` built on an object literal (ADR-009) | 2 |
| (p) `slotNearMisses` looks the slot up through a plain object | 3 |

(i) and (k) are the pair that matters for ruling 1: dropping the FIELD
while keeping the sentence, and dropping the sentence while keeping the
field, red DIFFERENT tests. The hint is pinned as two things because it
IS two things. (a) is the one mutant the 484-pair agreement sweep
correctly does NOT red — it makes the new body identical to the old, and
an agreement test that reddened there would be asserting disagreement.

**Shape six, declared rather than hidden.** `files.test.ts:192` (the
mixed three-space model) reds under (e), (g) and (h) — and under each of
those, a single-site pin already reds. I could construct no mutant it
uniquely kills, because every site's own pin asserts its own literal. It
is kept deliberately as the STATEMENT of criterion 3's consumer property
plus the only assertion anywhere that the three spaces coexist in one
model in layer order, and it is named here as shape six rather than
counted as a killer.

### Suites — my own actuals, exit codes read UNPIPED

    lib/parser (from lib/parser/):
      npm ci            0 vulnerabilities, 55 packages
      npx tsc --noEmit  exit 0
      npm run build     exit 0
      npx vitest run    263/263 (12 files), exit 0   [234 baseline + 29]
    app (from app/):
      npm install       clean
      npx tsc --noEmit  exit 0
      npm run build     exit 0, 265 modules transformed
                        (index-DjYVlJel.js 501.37 kB, index-CwYF5FQb.css 43.95 kB)
      npx vitest run    825/825 (42 files), exit 0 — UNMODIFIED

**The app suite is the criterion, and it passed with ZERO app bytes
edited** — `git status` clean outside `lib/parser/**` and
`docs/tasks/T-076*`. That was not a foregone conclusion:
`compareComponentIds` is EXPORTED and the app imports it at
`app/src/architecture/map-layout.ts:1` and
`app/src/lib/architecture/derive.ts:19`, so a comparator change reaches
the map's layout and the derivation's edge order. It moves nothing
because every id in that space is two digits and C1's agreement sweep
covers the whole range a double can weigh.

`cargo test` and the E2E lane were NOT run, stated rather than skipped:
the diff is `lib/parser/**` plus `docs/tasks/**`, `app/src-tauri/**` is
a 0-file diff, and nothing under `tools/e2e` imports the parser
(ADR-011 family). Neither can move, and neither was claimed.

**BOOT GATE — computed, and it does NOT fire.** The trigger is
`app/src/**`, `app/src-tauri/**`, `app/package.json` or
`app/src-tauri/Cargo.toml` over `e4a5ae7..HEAD`.
`git diff --name-only` over exactly that set returns **zero paths**, so
`boot:check` was not run, no window was opened and there is no
`BOOT_EXIT` to record.

**GRAPH REGEN — the trigger FIRES and the graph was deliberately NOT
regenerated** (integrator's ritual, per dispatch and T-009-s1). Twelve
`.ts` files outside `docs/` moved. Expected delta, so the integrator can
check rather than discover: NO new file nodes — this card adds no file,
which means C-06's dogfood file COUNT does not move and T-024's
three-fixture rule does not fire; four new exported symbols in
`id-slot.ts` (`compareDigitRuns`, `idSlotIndex`, `slotNearMisses`,
`nearMissClause`) plus one unexported (`canonicalDigits`); new call
edges from `component.ts` and `validate.ts` into `id-slot.ts` (the
IMPORT edges already existed since T-053); and shifted `range` values on
symbols below every edit in seven source files.

### The live tree — zero issues, three trees

    this worktree, before the s-files   tasks 100 · features 6 ·
                                        components 11 · ISSUES 0
    this worktree, FINAL tree           tasks 103 · features 6 ·
                                        components 11 · ISSUES 0
    /Users/ujju/Projects/nputer (main)  tasks 106 · features 6 ·
                                        components 11 · ISSUES 0

Read-only on main; nothing was written there. The 100 files match the
fourth triage exactly — **51 done / 29 planned / 20 parked / 0
suggested** — and the final tree is 103 because this card files three
suggestions. The smoke test re-proves the zero on every run.

What COULD have fired, checked rather than assumed. The near-miss hint
is the only new issue-SHAPE that can appear on a tree that previously
had none, and it cannot: it only decorates an issue that already exists,
and this tree has zero `dangling-reference`s. `duplicate-id`'s `space`
adds a field to an issue that must already exist. The comparator change
cannot create an issue at all. So the zero is entailed rather than
lucky — and it was measured anyway, at every step, including after each
of the three suggestion files landed.

### Flagged for the verifier

- **Attack the four moved pins first**, and `files.test.ts:48` hardest:
  it is the only one whose movement was a tightening rather than a
  forced reconciliation, so it is the one that could have been skipped.
- **The `ambiguous-mapping` half of the NaN defect is mine, not the
  card's.** `component.ts:374`'s `||` masks NaN into file order. I fixed
  it by fixing the comparator and pinned the comparator, but there is no
  pin that says "the ambiguous-mapping WINNER is id order past 309
  digits". Worth deciding whether one belongs.
- **`nearMiss` is optional and index-aligned with nothing.** If a
  consumer ever wants the FILE each near miss is declared in, that is a
  second array and a second contract; I deliberately did not add it,
  because `slotNearMisses` would then need the file map at all three
  sites and the type would gain an alignment rule nobody asked for.
- **`aliasedIdSlots`'s `compare` parameter now has exactly one caller
  passing exactly one value**, and its doc has to warn that a different
  caller could reintroduce the NaN. The parameter is a hazard with no
  user; removing it was out of criteria and is a real option.
- The 484-pair sweep covers `C-\d{2,}` conforming ids plus five
  non-conforming ones. It does not cover ids with MULTIPLE digit runs,
  because `compareComponentIds`'s pattern cannot match one. `idSlotKey`
  does, and is pinned for it.

### Suggestions filed

- **T-076-s1** — the Rust mirror of `compareComponentIds`
  (`registry.rs:75-90`) parses to `u64` and gives up above 20 digits, so
  it and the parser have disagreed above 15 digits since T-008. T-076
  changed the SHAPE of that divergence rather than creating or closing
  it. Outside the fence.
- **T-076-s2** — the board REPAIRS `duplicate-id` (one column, first
  wins) and does not repair `aliased-id` (two columns, cards split into
  the wrong real column), with no `idSlotKey` anywhere under
  `app/src/`. Measured, and now stated in a parser message.
- **T-076-s3** — `dangling-reference` is the last kind spanning three id
  spaces without a `space` field. Deliberately not done here: no
  criterion named it, and it would have moved a fourth pin set.

## Verdicts

### 2026-08-19 — verification in progress (claude-opus-5 @fresh, same-model)

Independent verification of tip `f531311` against base `e4a5ae7`, range
derived rather than taken: `git merge-base HEAD main` = `e4a5ae7`, four
commits, **17 paths** (4 docs + 7 `lib/parser/src` + 6 `lib/parser/test`),
`+1310/-37`. Working tree clean. `/Users/ujju/Projects/nputer` was read
only through `git show`/`git grep` on this worktree's object store; nothing
was written there and no sibling worktree was touched.

**BOTH NaN mechanisms reproduced at the branch point, first-hand.** The
branch-point `lib/parser/src` was compiled into a scratch tree (tsc exit 0)
and driven directly:

    BRANCH POINT compareComponentIds(400x9, 401x9) = NaN
      sort([a,b]) lengths = [402,403]
      sort([b,a]) lengths = [403,402]
      SAME ANSWER?  false
    Number('9'.repeat(309)) = Infinity | Number('9'.repeat(308)) finite? true

Mechanism two — the executor's own find, absent from the card — reproduced
through the real parser, two components with 400- and 401-digit ids and
overlapping `paths`, varying only which FILE holds which id:

    CASE A (small id in C-aaa.md): winner_digits 400, winner_file C-aaa.md
    CASE B (small id in C-zzz.md): winner_digits 401, winner_file C-aaa.md
    WINNER is the same ID in both orderings? false
    deterministic? CASE B repeated 5x -> 401 401 401 401 401

The declared `ambiguous-mapping` winner is the id in the first-sorting FILE,
five runs out of five: `component.ts:374`'s `compareComponentIds(...) || (file
compare)` swallows the falsy `NaN`. Deterministic and wrong, where the sort's
failure is non-deterministic. Sibling half also reproduced: the same aliased
slot reported `ids` as `[405,402]` or `[402,405]` purely by arrival order.

**The fix closes both.** Same drills against HEAD's build:

    HEAD compareComponentIds(400,401) = -1 | reverse = 1 | isNaN either? false
    MECH2 winner digits A=400 B=400 | same id? true | winner files C-aaa.md, C-zzz.md
    MECH1 aliased ids order X=[405,402] Y=[405,402] | SAME? true

**C1 — TOTAL, and "unchanged" proved rather than asserted (APPROVED).**
`compareDigitRuns` returned a finite integer for every hostile input tried:
`''`, `'0'`, `'000'` vs `'0'`, `'0'x500 + '5'` vs `'5'`, 400/401 nines,
`1e400` vs 400 nines, and non-digit text. Order axioms over 606 values:
**0 reflexivity, 0 antisymmetry, 0 transitivity violations over 200,000
triples**. Exactness against BigInt truth over **300,000 random pairs of
1–46 digits with random zero-padding: 0 mismatches**.

Ordering-unchanged is stronger than the card's 484: an **exhaustive** sweep
of every 2- and 3-digit `C-` id (1,100 ids, **1,210,000 ordered pairs**)
gave **0 sign disagreements** between the branch-point and HEAD comparators,
and 400,000 random pairs at 2–15 digits mixed with seven non-conforming ids
(`C-5`, `C-`, `C-x9`, `''`, `c-07`, `'C-07 '`, `X-99`) gave 0. The one
declared change reproduced with its direction intact:
`compareComponentIds('C-'+'9'x17, 'C-1'+'0'x17)` is `1` at the branch point
and `-1` at HEAD, and `Number()` fuses the two — the old answer was wrong,
not imprecise.

**Suites, first-hand, exits from `$?`, never piped.** `lib/parser` built
(`BUILD_EXIT=0`) then `npx vitest run` -> **263/263, 12 files,
PARSER_VITEST_EXIT=0**. The baseline was re-derived rather than trusted: the
branch-point `src` + `test` trees were materialised under a scratch repo root
and run -> **234/234, 12 files, exit 0**, so `+29` is measured. `app/`
`npm run build` exit 0 (`index-DjYVlJel.js 501.37 kB`,
`index-CwYF5FQb.css 43.95 kB`) then `npx vitest run` -> **825/825, 42 files,
APP_VITEST_EXIT=0**, with **zero app bytes in the diff**.

**Card claims that did not reproduce — both CONFIRMED.** At `e4a5ae7`,
`roadmap.ts:48` is `const description = split ? ...`, the description split;
the emit is `:51-56` with `kind: 'duplicate-id'` on `:52`, and `files: [file,
file]` was already on `:54`. The other three dispatch citations
(`component.ts:313`, `project.ts:80`, `files.ts:143`) all land on
`kind: 'duplicate-id'` exactly.

**C6 ordering CONFIRMED in `git log`.** `a931bfb` (11:44:22) touches
`docs/tasks/T-076-the-id-layer-is-total.md` and nothing else — 92 lines,
zero non-docs paths, both RULINGs present — and `62bec51` (11:50:42) is the
first source byte. The discipline is real and checkable.

**Emit-site totality re-derived from the repo root.** `git grep -n "kind:
'duplicate-id'"` returns exactly four source sites (`component.ts:339`,
`files.ts:143`, `project.ts:80`, `roadmap.ts:61`), all four now carrying
`space` on the next line, and `git grep -n "kind: 'dangling-reference'"`
returns exactly three (`component.ts:396`, `validate.ts:143`, `:156`), all
three carrying the hint. No app or Rust source emits either kind.

**FINDING — the notes under-count the moved pins by one.** The set of
pre-existing `it()` bodies whose TEXT changed was derived mechanically
(indent-matched block extraction at both revisions, set difference on body
text) and is **five**, not four: the four in the card's table plus
`component.test.ts` base `:349` -> HEAD `:477` (`dangling depends_on:
structured issue naming file, field and the dangling id`). The notes state
"Nothing else in any pre-existing body moved" — that sentence is false. The
move itself is clean and additive-only (`expect(result.issues[0]).not
.toHaveProperty('nearMiss')` plus a message `not.toContain('zero padding')`,
nothing removed or loosened), and the pin IS cited elsewhere in the notes
under C5, so this is an accuracy defect in the prose rather than in the work.

**The poison sweep re-derived, not accepted.** The 34 were derived
independently by the same mechanical rule (indent-matched `it()` block
extraction at both revisions, set difference on body TEXT) and land on the
same number, per file: component 10 · files 2 · id-slot 13 · project 1 ·
roadmap 1 · validate 7 = **34**. All 34 were poisoned in one run with a
relation-breaking expectation injected before each body's closing brace:

    POISON_VITEST_EXIT=1
     Test Files  6 failed | 6 passed (12)
          Tests  34 failed | 229 passed (263)
    failures citing T-076 POISON: 170 lines / 34 FAIL blocks
    assertion failures NOT citing the poison: (none)

**229 = 263 − 34, the pre-poison baseline, and zero collateral.** Restored
with `git checkout` and proved by sha256 against `git show HEAD:<path>` —
all six MATCH (`139f0d90…`, `fb8a150a…`, `79c44f59…`, `9dd7132d…`,
`037951b3…`, `51278b4b…`); `file --mime` reads `charset=utf-8` on all six.
(One nit: the notes claim `git grep "T-076 POISON"` returns nothing — it
returns two hits, both in this card's own prose.)

**The (i)/(k) pair spot-checked first-hand, and the notes over-state it.**
Both mutants applied one-sided to `lib/parser/src/validate.ts` only, each
verified by reading the resulting DIFF TEXT:

    (i) FIELD dropped, clause kept   -> 5 failed | 258 passed
    (k) clause dropped, FIELD kept   -> 3 failed | 260 passed

The counts are exactly as claimed. The characterisation is not: (k)'s three
are a **proper subset** of (i)'s five, so the two do not red "DIFFERENT
tests" — dropping the field reds two bodies (`fires identically through the
disk layer`, `the -sN suffix is part of the slot`) that dropping the sentence
does not, and nothing reds for the sentence alone. Ruling 1's substance
survives: each half is independently detectable, which is what "pinned as two
things" has to mean. The symmetry is what does not.

**SEVENTH SHAPE FOUND, and it is a live coverage hole rather than a
taxonomy note.** Mutant **(q)**: inline the pre-T-076 comparator at the
`ambiguous-mapping` sort site (`component.ts:412`) ONLY, leaving
`compareComponentIds` total. One-sided, no shared literal, and it breaks the
exact relation criterion 1 exists to protect.

    MUT_Q_EXIT=0
     Test Files  12 passed (12)
          Tests  263 passed (263)

**It survives the entire suite.** And it is not equivalent — built and
driven, it restores the defect verbatim:

    MUTANT (q) winner digits: A=400  B=401  | same id? false
    MUTANT (q) winner file:  A=C-aaa.md  B=C-aaa.md
    DEFECT RESTORED? true
    comparator itself still total? compareComponentIds = -1

So the shape is: **"zero survivors" measured against a mutant set derived
from the pins rather than from the criteria.** Sixteen mutants, all of them
aimed at something a pin already names; the one input class the card's own
"Flagged for the verifier" admits is unpinned was never mutated, and it
survives. This is the dual of shape six — shape six is a body that kills no
unique mutant, shape seven is a mutant no body kills — and it is worth more,
because a redundant body costs nothing and this costs the criterion.

**RULING ON `files.test.ts:192` — the body STAYS, and the executor's
shape-six classification is WRONG.** Mutant **(u)**: swap the assembly order
in `parseProjectFromFiles` (`files.ts:182`) from
`issues.push(...roadmap.issues, ...componentSet.issues)` to
`(...componentSet.issues, ...roadmap.issues)`.

    MUT_U_EXIT=1
     Test Files  1 failed | 11 passed (12)
          Tests  1 failed | 262 passed (263)
    FAIL  test/files.test.ts > duplicate-id says WHICH id space, in one mixed
          model (T-076) > reads .space off every duplicate without touching a message

**It is the only test in 263 that reds.** The body's `['task','feature',
'component']` assertion is the sole guard on the layer order `files.ts:181`
declares in a source comment ("task -> roadmap -> component order, mirroring
the disk layer"). The executor searched for a killer among `space` mutants
and found none, which is true and beside the point: the body's second
assertion pins a different relation entirely. It is not shape six. It earns
its place on the ordinary ground — it uniquely kills a mutant — and the
notes should say so instead of apologising for it.

**Other hunts, all killed, no further survivors.** (r) `slotNearMisses`
sorts instead of preserving model order -> 1 red (`names every spelling when
the declared space is itself aliased`) — model order IS pinned. (s)
`idSlotIndex` drops the set dedupe -> 2 red. (t) the WRONG `space` value
(`'component'` -> `'task'`) rather than a dropped one -> 2 red. Every mutant
restored; `shasum -a 256 lib/parser/src/*.ts` is byte-identical to the
pre-drill capture, `git status` clean, and `lib/parser` rebuilt afterwards.
