---
id: T-134
title: A fence names paths and a slug is shorthand — zero real collisions occurred all night while one word serialised most of the board
feature: F-06
milestone: 4
priority: 5
size: M
status: verifying
blocked_by: []
touches: [lib-parser, method/lane-protocol.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human adopted this on 2026-08-25** as item 4 of `T-131`'s five process
changes.

## The measurement

**Zero real fence collisions occurred during the session that ran six
lanes concurrently.** Every block was a *naming* collision:

- 21 of 36 planned cards named `app-shell`; nine named nothing else.
- `T-126` — priority 5, needing one `mod` line in `lib.rs` — waited hours
  behind a registry lane that never opened that file.
- Two fences were narrowed by hand mid-session (`T-108`'s bare
  `docs/tasks/` directory, and `T-116`'s app-test question). **Both
  narrowings were correct and neither produced a collision.**
- `T-116` and `T-033` held the same slug simultaneously with **disjoint
  file sets** and never touched each other.

**A slug is the only expressible unit today, so a card that knows its
three files must claim its whole component.** The fence stops being
collision-avoidance and becomes a lock on a name.

## What this is NOT

**It is not "remove the fence."** The fence is what kept six concurrent
lanes from writing each other's files, and `T-126`'s verifier ruled this
session that a card's own criteria may not override it. **Path granularity
makes the fence sharper, not weaker** — a lane that names three files is
easier to check than one that names a component, not harder.

**And a slug must remain expressible.** A card that genuinely rewrites a
component should say so in one word. The change is that a slug becomes
*shorthand for a path set* rather than the only vocabulary.

## Acceptance criteria

- **`touches:` SHALL ACCEPT PATHS AND SLUGS IN THE SAME LIST**, and
  disjointness SHALL be computed over the EXPANDED path sets rather than
  over the tokens. **`T-111-s1` already recorded the token-comparison
  defect from the other side** — two lanes were declared disjoint because
  their slug strings differed while one component carried both slugs.
- **THE EXPANSION SHALL READ EACH COMPONENT FILE'S `touch_slugs:`**, which
  `method/roles/executor.md` already rules authoritative over the prose
  block in the architecture document, *"because the block is prose that
  goes stale the day a component is added."* **Do not build a second map.**
- **A PIN SHALL DRIVE THE CASE THAT MOTIVATED THIS**: two cards whose
  slugs collide but whose paths do not, required disjoint; and two whose
  paths collide, required overlapping. **Both SHALL fail against the
  pre-fix tree** — the second one probably passes today, so say which does
  and which does not rather than claiming both are new.
- **A CARD'S OWN FILE IS NEVER IN ITS OWN FENCE** and the expansion SHALL
  encode that rather than leaving it to each reader. Ruled during
  `T-108`'s dispatch and confirmed by two lanes since; **`T-108-s3`
  records that `executor.md` step 5 is currently unperformable for any
  path-fenced card**, and this card SHALL either resolve that or route it
  explicitly.
- **THE VOCABULARY DEFECT SHALL BE FIXED IN THE SAME PASS OR ROUTED.**
  `T-111-s3` measured that `touches:` carries three kinds of token —
  slugs, paths, and directory prefixes — with `method` beside `method/`
  and `tools/e2e` beside `tools/e2e/`. **A parser that accepts both
  spellings silently is how a fence check returns the wrong answer.**
- **A BARE DIRECTORY FENCE OVER `docs/tasks/` SHALL BE REJECTED BY THE
  PARSER, not by convention.** That directory is where every dispatch and
  every integrator stamps frontmatter, so a lane holding it collides with
  every other lane's opening and closing move. Ruled at `T-108`'s
  dispatch; **this card makes it mechanical.**
- **NO EXISTING CARD'S FENCE SHALL CHANGE MEANING SILENTLY.** IF the
  expansion alters what any live or planned card holds THEN enumerate the
  affected cards by id and say what moved. **A fence that changes under a
  running lane is `T-111-s1`'s failure from the registry side.**

Verification: headless — `npx vitest run` from `lib/parser/`, exit read
**unpiped from `$?`**, count derived; plus `npm test` from `app/` if any
shape the board reads moves. **POISON DRILL on every new assertion**, one
side only, producer mutated and never the assertion, read back with
`git diff` before its run, restores proved per-path by sha256 in a
detached scratch worktree **OUTSIDE the repository**. **Uniqueness of kill
SHALL be measured against the whole suite rather than asserted.** The DOCS
GATE fires on `method/` paths a code suite reads and on this card — run it
**directly, never through `xargs`**. Ask GRAPH REGEN rather than
predicting and **ask again after any write**. @human: none — the ruling is
already made; this is its mechanism.

## Implementation notes

**THESE NOTES ARE ON THE CARD BECAUSE THIS CARD RULED THAT THEY MAY BE**,
and that is the resolution of `T-108-s3` rather than a lapse against it —
see "The ruling" below. Written by the executor in the lane, at
`task/T-134-path-fences`, base `15a963d`.

**CONFIRMATION OF UNDERSTANDING, as it was written before anything was
touched.** T-134 makes a fence name PATHS and demotes a component slug to
shorthand for a path set, so that disjointness is computed over the
EXPANDED sets rather than over the tokens; the expansion reads each
component file's own `touch_slugs:` field, which `roles/executor.md` row 5
already rules authoritative, and builds no second map; the vocabulary is
normalised to one spelling with a declared ceiling, an unresolvable token
is refused rather than silently treated as disjoint from everything, a
bare `docs/tasks/` fence is rejected mechanically, and a card's own file
is carved out of its own fence by the expansion rather than by each
reader; two pins drive it, and every card whose fence changes meaning is
enumerated by id. The fence is `[lib-parser, method/lane-protocol.md]`,
so the mechanism lands in `lib/parser/` and the rule lands in
`method/lane-protocol.md`, and anything needing another file is routed
rather than built.

### What shipped — five paths

- **`lib/parser/src/fence.ts`** (new) — the whole mechanism.
  `normalizeFenceToken` (one spelling, ceiling declared), `slugPathIndex`
  (the map, READ from `touch_slugs:`), `expandFence` (four token kinds,
  own-file carve-out, `invalid-field` issues on `touches`) and
  `compareFences` (a THREE-valued verdict).
- **`lib/parser/test/fence.test.ts`** (new) — 22 bodies, the live board
  as the fixture wherever it can be.
- **`lib/parser/src/index.ts`**, **`lib/parser/src/pure.ts`** — additive
  re-exports; the browser-safe barrel takes it too, because `fence.ts`
  imports nothing but `./types.js`.
- **`method/lane-protocol.md`** — rule 5 gains the fence's own
  definition, the one-spelling rule, the unfenceable-directory rule and
  the own-file clause.

### The ruling on `T-108-s3` — RESOLVED, and exactly as far as this fence reaches

`executor.md` step 5 orders the executor to append notes to its own task
file; T-108's fence ruling says a card's own file is never part of its
fence; so step 5 was unperformable for every path-fenced card, and two
lanes split on it in one night.

**RESOLVED IN `method/lane-protocol.md` RULE 5, WHICH IS THE FILE THAT
OWNS THE FENCE**, and resolved without editing `roles/executor.md` at all
— which matters, because that file is outside this fence. The clause
rules that a card's own file is outside EVERY fence including its own,
that the fence therefore does not govern writes to it, and that a lane
writing to its own card is not a fence breach. Step 5 becomes performable
under a path-granular fence instead of forbidden by one.

**AND IT IS DELIBERATELY NARROWER THAN THE FINDING'S THREE QUESTIONS.**
`T-108-s3` asks (1) is the own card file a protocol write or a lane
write, (2) if notes belong in the report what carries them into the
archive, (3) does the answer differ by size tier. **Only (1) is a fence
question and only (1) is answered here** — as "the fence has no opinion,
because the file is outside it". (2) dissolves: the notes go on the card,
so no integrator transcribes anything and T-057 is not engaged. (3) is
answered by construction — the fence clause is tier-blind. **The second
conflict on step 5, the one `executor.md`'s own closing bullet records
(the verifier reads the file this role writes into), is NOT touched and
is NOT resolved**: it is about what the verifier may read, not about
where a lane may write.

### Criteria

1. **Paths and slugs in one list, disjointness over the EXPANDED sets** —
   MET. `expandFence` classifies every token; `compareFences` never
   compares tokens. Pinned live on `T-112 [app-dispatch, app-board]`
   against `T-114 [app-shell]`: no shared token, and both reserve C-11.
2. **The expansion reads `touch_slugs:`, no second map** — MET in this
   package, and **the criterion is at risk from outside it** — see the
   routed finding R1. `slugPathIndex` takes parsed `ComponentRecord`s and
   joins two of their own fields; it embeds no table and has no fallback.
   The pin derives the whole map from the registry rather than asserting
   it, so it cannot pass against a drifted copy.
3. **The two pins, and WHICH IS NEW** — MET, and **the card's own guess
   is refuted**. See "The two pins" below.
4. **A card's own file is never in its own fence, encoded** — MET, and
   ruled (above). Measured: **no live card fences its own file**, so the
   carve-out repairs nothing today and is a guard.
5. **The vocabulary defect** — FIXED for the trailing-slash and
   containment halves, REFUSED for the third kind of token, and the
   ceiling is declared rather than left to be discovered.
6. **A bare `docs/tasks/` fence rejected by the parser** — MET, in every
   spelling. **No live card holds it** (T-108's was narrowed by hand),
   so this too is a guard rather than a repair.
7. **No fence changes meaning silently** — MET by enumeration below.

### The two pins — measured against BEFORE, and the card guessed backwards

The card says *"Both SHALL fail against the pre-fix tree — the second one
probably passes today"*. **Measured, it is the FIRST that passes today
and the second that fails**, and the reason is the card's own cited
finding.

- **PIN ONE (slugs collide, paths do not, required DISJOINT) is a
  CONTROL** against the comparison this project actually performs —
  token string equality. Two cards naming `app/src/main.tsx` and
  `app/src/App.tsx` share no token, so today's rule already answers
  DISJOINT. It is genuinely new against the other model of before —
  SLUG GRANULARITY, where those two cards could only have written
  `app-shell` and would have collided — and **both models are in the
  suite**, so the claim is measured rather than argued.
- **PIN TWO (paths collide, required OVERLAPPING) is GENUINELY NEW, in
  two live instances.** `T-112` × `T-114` share no token and both
  reserve C-11's `app/src/styles` and `app/src/assets`; `T-128
  [method/, docs/CONVENTIONS.md]` × `T-134 [lib-parser,
  method/lane-protocol.md]` share no token and one CONTAINS the other.
  Token equality answers DISJOINT for both, and is wrong both times.

**PIN ONE HAS NO LIVE INSTANCE AND CANNOT HAVE ONE**: zero of this
board's `touches:` entries names a code path, so its two paths are lifted
from C-05's own `paths:` block. That is stated in the body rather than
hidden by a synthetic fixture.

### Criterion 7 — every card whose fence changes meaning, by id

Derived at `15a963d` over the **36** cards in an open status
(`planned`/`building`/`verifying`/`merging`), comparing token equality
against the expansion for all **630** pairs. **25 pairs flip, all in one
direction — `disjoint` → `overlapping`. None flips the other way. 25
distinct cards are involved, in TWO shapes.**

**SHAPE A — `app-shell` × `app-board` at C-11, 19 pairs, 20 cards.**
Every pair has `T-112` on one side, the only open card holding
`app-board` without also holding `app-shell`. Witnesses are always
`app/src/assets` and `app/src/styles`.

    T-112 x { T-015 T-022 T-032 T-035 T-044 T-059 T-065 T-068 T-071
              T-075 T-087 T-094 T-099 T-100 T-106 T-114 T-115 T-117
              T-125 }

This is `T-111-s1` reproduced mechanically on the live board, five
months of dispatches after it was filed. **Nothing is breached and that
is again the whole danger** — it is a FENCE overlap, and it was wrong at
every dispatch that compared those tokens.

**SHAPE B — a directory fence containing a file fence, 6 pairs, 5
cards, AND TWO OF THEM ARE LIVE.**

    T-105 x T-134   method/  contains  method/lane-protocol.md
    T-128 x T-134   method/  contains  method/lane-protocol.md
    T-131 x T-134   method/  contains  method/lane-protocol.md
    T-105 x T-135   method/  contains  method/tasks/TASK-FORMAT.md
    T-128 x T-135   method/  contains  method/tasks/TASK-FORMAT.md
    T-131 x T-135   method/  contains  method/tasks/TASK-FORMAT.md

**`T-134` IS THIS LANE AND `T-135` IS OPEN.** `T-105`, `T-128` and
`T-131` are `planned` and a dispatcher comparing tokens would call all
three disjoint from this lane today. **They are not.** Dispatching any of
them while this lane is live puts two writers on
`method/lane-protocol.md`.

**THE TWO LIVE LANES ARE DISJOINT**, derived and not assumed: `T-111
[app-board, app-shell]` against `T-134 [lib-parser,
method/lane-protocol.md]` is `{verdict: disjoint, witnesses: [],
unusable: []}`, and that is a pinned body rather than a sentence here.

**AND THREE TOKENS ON ONE DONE CARD RESOLVE TO NOTHING.** `T-054`
(`done`) carries `docs`, `method` and `ci`. With the repository's own
top-level entries supplied as an oracle, `docs` and `method` resolve and
**`ci` still names nothing** — the only token on the whole live board
that no oracle can settle, which is `T-111-s3`'s "`ci` wants a ruling,
not code" made mechanical. Every other token on every other card
resolves.

### Poison drills — 8 arms, one side each, producer mutated and never an assertion

Detached scratch worktree **outside the repository** at `/private/tmp/t134d`
(18 characters, well under `T-133-s5`'s 116-character floor), cut at
`9dfb5a0`. Every mutation read back with `git diff` BEFORE its run. Every
restore proved by `sha256` against `git show HEAD:<path>` — **8 of 8
identical at `dc680c3b…`** — and `git status` carried exactly one `??`
row throughout, the `node_modules` symlink this drill created and nothing
tracked.

**POSITIVE CONTROL FIRST**: unmutated, the drill worktree runs
**290 passed / 290, exit 0**. Every arm below leaves 284–289 bodies
PASSING, so no arm is a compile failure wearing a kill's costume.

| # | mutation (producer only) | exit | killed of 290 |
|---|---|---|---|
| 1 | `normalizeFenceToken`'s trailing-slash strip never fires | 1 | 6 |
| 2 | `slugPathIndex` keeps only the FIRST component per slug | 1 | 3 |
| 3 | `sharedDomain`'s two containment arms never fire | 1 | **1** |
| 4 | `UNFENCEABLE_PATHS` emptied | 1 | 2 |
| 5 | the own-file carve-out disabled | 1 | 2 |
| 6 | `unusable` collapsed into `disjoint` | 1 | 2 |
| 7 | `GLOB_CHARS` never matches | 1 | **1** |
| 8 | the trailing-slash-is-evidence rule disabled | 1 | 4 |

Arms 3 and 7 kill exactly one body in 290; that is **measured**, not
asserted, and it is the whole suite rather than the one file.

**THE NEGATIVE ASSERTIONS CARRY THEIR POSITIVE CONTROL IN THE SAME
SUITE.** The live-board census asserts that no card fences its own file
and no card holds `docs/tasks` — two claims that pass vacuously if the
detector is broken. The fixture bodies immediately above them prove the
same detector DOES fire on a card that does, and arms 4 and 5 kill both
halves.

**ONE THING CANNOT BE POISONED AND IT IS NAMED RATHER THAN LEFT OUT.**
The `method/lane-protocol.md` edit is read by NO suite in this
repository: that file is not among the fourteen `method/` files compiled
into `agent/kit.rs`, so `snapshot_version_matches_the_live_method_stamps`
and `every_compiled_entry_matches_its_method_file_byte_for_byte` cannot
see it, and no TypeScript suite reads it either. **A `method/` rule
change is unpinnable here** — the `T-127-s4` class, one directory over.

### Figures, each at its own ref

At `15a963d` (base) / `9dfb5a0` (this lane's work commit):

- **`npx vitest run` from `lib/parser/`: 290 passed / 290, exit 0**, in
  13 files, up **22** from the 268 measured on the base tree before any
  edit. `npx tsc --noEmit`: **exit 0**.
- **GRAPH REGEN FIRES** (`*.ts` outside `docs/`; 4 of the 5 paths) and
  was **ASKED, TWICE**, never predicted. `index --check --root ../..`:
  **STALE, exit 1**.

      committed:   955710 bytes · 181 files · 2038 symbols · 1943 edges
      fresh index: 970961 bytes · 183 files · 2064 symbols · 1986 edges
      files +2 -0 ~2   |   edges +43 -0

  The two added files are this card's; the two modified are the two
  barrels. **No foreign staleness rode along.**
- **THE BYTE BUDGET IS THE FIGURE AN INTEGRATOR NEEDS AND NOTHING
  REPORTS IT.** 970 961 of `max_graph_bytes` 1 000 000 is **97.10%,
  29 039 bytes of headroom**, spending **15 251** — **larger than
  T-135 Half A's 11 120, which its own checkpoint called "by far the
  largest single spend in this series"**. Two new indexed files and 43
  edges cost more than 27 new edges did.
- **THE FIXTURE RECONCILIATION THIS MERGE WILL OWE, forecast by running
  it rather than by predicting it.** The graph was regenerated in this
  lane, `arch` was read against it, and `graph.json` was then RESTORED —
  `sha256 b742efbe…` before and after, `git status` empty. **It is NOT
  committed here**, per the sequence this project prescribes.
  - `arch` summary goes `components=13 files=181 mapped=181 unmapped=0
    edges=37 findings=4 drift_components=4` → **`files=183 mapped=183`
    and every other figure UNCHANGED**. No component relation moves:
    every new edge is C-06-internal or a package edge.
  - **C-06 goes 25 → 27 files and is the ONLY component whose count
    moves.**
  - `app/test/architecture-dogfood.test.ts` — the `181` in
    `expect(derived.fileComponent.size)` and in its test TITLE.
  - `app/test/map-dogfood-render.test.tsx` — `"committed graph · 181
    files"`.
  - `lib/parser/test/smoke.test.ts` does NOT move: the registry is
    untouched, so the parser pin holds.
- **BOOT GATE: NOT OWED.** No path in the five is under
  `app/src-tauri/**`, `app/src/**` or a manifest.
- **`arch cycles --root ../..`: exit 1**, read unpiped, `cycle C-08 ->
  C-09 -> C-08`, `components=13 declared_edges=35` — the designed state,
  untouched by this card, which changes no registry file.
- **RANGE**: `git merge-tree --write-tree 15a963d HEAD` → **exit 0**
  (read from `$?` BEFORE the substitution), tree `d2fd45e`. `git diff
  --name-only 15a963d d2fd45e` → **5 paths** before this card write, 6
  with it. Main was `15a963d` when the range was derived and `15a963d`
  when it was re-derived after this write.

### Routed — everything this fence could not reach

- **R1. THERE ARE TWO IMPLEMENTATIONS OF THIS EXPANSION ON MAIN RIGHT
  NOW, AND THE OTHER ONE LANDED HOURS AGO.**
  `tools/e2e/scripts/dispatch-brief.mjs` (T-133) already carries
  `slugMapFromFields`, `expandFenceEntry`, `pathsOverlap` and
  `fenceOverlaps` — the same join off the same authoritative field. This
  card's criterion 2 says "do not build a second map", and the map is
  not duplicated (that module reads `touch_slugs:` too), but **the
  FUNCTION is**, which is T-057's rule about a fact with two
  implementations rather than about a table. **The divergences are
  real and all in one direction**: that copy treats `ci` as a path and
  therefore as disjoint from everything, does not reject `docs/tasks/`,
  and has no own-file carve-out. **AND THE MIGRATION IS NOT A CHORE** —
  `tools/e2e/package.json` declares that package "imports neither app
  nor parser", an ADR-011-family choice, so pointing it at
  `@nputer/parser` is a decision with a record behind it. Fence
  `[tools/e2e]`, plus whoever owns that choice.
- **R2. THE METHOD VERSION BUMP THIS EDIT OWES IS OUTSIDE THIS FENCE.**
  A `method/` change is version-bumped, and the bump is a three-file
  commit whose third file is Rust: this file's stamp is in
  `docs/CONVENTIONS.md`, the second in
  `method/interview/plan-interview.md`, the third
  `METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`. **This
  fence reaches none of the three**, and moving one alone reds
  `snapshot_version_matches_the_live_method_stamps` by name. Not
  bumped, on the precedent CONVENTIONS states in as many words: a fence
  may change `method/` and cannot bump it. Fence `[method/,
  docs/CONVENTIONS.md, app-agent]`.
- **R3. THE ISSUES ARE NOT WIRED INTO `validateProject` AND THAT IS
  DELIBERATE.** They are `invalid-field` on `touches` — an existing kind,
  chosen so this can be wired later without a new union member rippling
  through every consumer. Wiring it today would put three issues on the
  live tree from `T-054` and red `lib/parser/test/smoke.test.ts`, which
  asserts the live tree yields zero. That is fixable (spell `T-054`'s
  three tokens) but `docs/tasks/T-054-*.md` is outside this fence. Fence
  `[lib-parser, docs/tasks/T-054-retire-the-interim-graph-rule.md]`.
- **R4. `ci` NEEDS THE RULING `T-111-s3` ASKED FOR**, and it is now the
  ONLY unresolvable token on the board even with a repository oracle.
  One `done` card. Fence `[docs/tasks/T-054-…]`.
- **R5. SHAPE A ABOVE IS TWENTY CARDS' WORTH OF HONEST OVERLAP AND
  SOMEBODY HAS TO DECIDE IT.** Either C-11 gets its own fence word — the
  option `T-127-s2` already argues, and `T-111-s1`'s arm 2 — or the
  board accepts that `app-board` and `app-shell` never dispatch
  concurrently. This card only makes it visible. Fence
  `[docs/architecture/components/]`.
- **R6. `method/lane-protocol.md` IS READ BY NO SUITE**, so this card's
  protocol half ships unpinned. Same class as `T-127-s4`'s
  `touch_slugs:` observation, one directory over.

### Where the card and the dispatch brief were wrong

- **The card's guess about the pins is backwards.** *"the second one
  probably passes today"*: the second is the one that FAILS today, in two
  live instances, and the first is the control. The card's own cited
  finding (`T-111-s1`) is an instance of the second, which is what makes
  the guess checkable.
- **The card says the DOCS GATE "fires on `method/` paths a code suite
  reads".** The gate's trigger is a path under **`docs/`**;
  `method/` is not `docs/`, and that gap is `T-132-s2`'s. The gate fires
  on this diff because of THIS CARD's own file, not because of
  `method/lane-protocol.md`.
- **The brief's `216 touches: entries` is 230 at this ref**, across 142
  cards and 26 distinct raw tokens. The brief's conclusion from it — that
  no `touches:` entry names a code path, so the ceremony rule is a
  constant function — **re-derives as TRUE**: 139 slug tokens, 88 path
  tokens, and not one path token inside a component's `paths:`.
- **The brief's "`T-111` holds `[app-board]`" (via `T-111-s1`) is stale.**
  The live card reads `touches: [app-board, app-shell]`, so the recorded
  T-033 × T-111 instance no longer discriminates and the pins are built
  on `T-112` × `T-114` instead. A figure's qualifier — "measured at
  `e04f5b3`" — is exactly what a précis drops.
- **The brief did not mention `dispatch-brief.mjs` at all**, and it is
  the single most important thing in the tree for this card (R1). It
  warned about the prose-block map and not about the module that had
  already built the expansion.

### Addendum — the gates, the three owed suites, and one defect only a lint could see

**THE TOKEN LINT FOUND A DEFECT THAT 290 GREEN BODIES COULD NOT.**
`compareFences` built its witness-dedup key by joining three strings with
what were meant to be spaces and were written as two literal **U+0000**
bytes. The key WORKED — a NUL is a perfectly good separator — so the
parser suite was 290/290 with it in place, `tsc --noEmit` was 0, and
nothing in `lib/parser` could ever have caught it. **`tools/e2e`'s P5
control-character rule reds on it**, and it arrived as three failing
bodies in `token-scan.spec.ts` counting **9 planted control bytes against
an expected 7** — the gate's own runtime-built control corpus finding two
uninvited passengers. Fixed at `31d8212` with `JSON.stringify`, which
removes the separator question rather than answering it. **The lesson is
the gate's, not the bug's**: a defect that changes no behaviour is
invisible to every behavioural suite by construction, and the only thing
that sees it is a gate that reads the TEXT.

**THE DOCS GATE FIRES, exit 1**, run from the repository root on the
RANGE RULE's own six paths and never through `xargs`. It fires on **1**
of the 6 — `docs/tasks/T-134-…md`, this card — and **NOT** on
`method/lane-protocol.md`, because the gate's trigger is `docs/` and
`method/` is not `docs/` (`T-132-s2`). It named THREE suites and
**15 derived docs readers across 4 suites, up from 14**: the fifteenth is
this card's own `lib/parser/test/fence.test.ts`, which the gate detects
by its `parseProject()` call. **0 frontmatter issues; census 131 sites in
22 files; 6 root-anchored files all argued, 0 unlinked.**

**ALL THREE OWED SUITES RUN AND GREEN**, exits from `$?` on unpiped
commands, counts read as well as exits:

- `npx vitest run` from `lib/parser/` — **290 / 290, exit 0**, 13 files.
- `npm test` from `app/` — **973 / 973, exit 0**, 47 files, TWICE (before
  and after the NUL fix), after `npm run build` from `lib/parser/` then
  from `app/`, both exit 0.
- `npm test` from `tools/e2e/` — **194 / 194, exit 0, 3.1m** on explicit
  port **15781**, `lsof` read at ZERO rows at 11:51:28 EEST before and
  11:54:33 EEST after. Header `Running 194 tests using 1 worker`
  cross-checked against 194 `✓` bodies and a highest body number of 194.
  The first run of this suite is the one that found the NUL: **3 failed /
  191 passed**, all three in `token-scan.spec.ts`.
- Also: `npm run lint:tokens` **exit 0, clean, TOKEN 138 / CONTROL 776**
  (derive the control figure at your own ref — `git ls-files` reads
  **794** here); `npm run lint:docs` **exit 0**; `npx tsc --noEmit` from
  `lib/parser/` and from `tools/e2e/` both **exit 0**; and `npm run
  typecheck` from `app/` **exit 1, `Missing script: "typecheck"`**,
  re-derived rather than quoted.

**`cargo test` IS NOT OWED AND THAT IS DERIVED RATHER THAN SKIPPED.** No
`.rs` path is in the diff, and `method/lane-protocol.md` is **not** one of
the fourteen `method/` files compiled into `agent/kit.rs` — the parity
test walks only `docs-templates`, `adapters` and `tasks`, and the two
Rust mentions of this file (`dispatch/join.rs:57`, `dispatch/lanes.rs:40`)
are **doc comments, not `include_str!`**. So the `method/` half of
`T-132-s2`'s gap costs nothing here; it would have cost everything if
this card's fence had been `method/tasks/TASK-FORMAT.md`.

**THE IDENTICAL-FIGURES TRAP FIRED IN THIS LANE, AND IT WAS MEASURED
RATHER THAN ANTICIPATED.** GRAPH REGEN was asked TWICE, before and after
the NUL fix, and reported **byte-identical headline figures both times**:
`970961 bytes · 183 files · 2064 symbols · 1986 edges`. It is not the
same file. Regenerated against each tree in turn and hashed:

    pre-fix  tree -> graph sha256 09151e14…  970961 bytes
    post-fix tree -> graph sha256 ee554cea…  970961 bytes

`fence.ts` grew by nine source bytes and the graph's own length never
moved, because the entry stores a fixed-width content hash and an
unchanged `loc`. **A byte comparison would have confirmed "unchanged" and
been wrong about the content.** Both regenerations were then discarded:
`docs/architecture/graph.json` is back at its committed `b742efbe…` and
`git status` is empty — **this lane commits no graph.**

**THE OTHER LIVE LANE MOVED UNDER THIS ONE AND THE DISJOINTNESS STILL
HOLDS ON ACTUAL PATHS.** `T-111` was at `15a963d` when this lane opened
and is at `80032ec` now, with its own drill checkout `/private/tmp/t111d`
beside it (detached, not a lane). Its diff is
`app/src/lib/board-model.ts` and `app/test/select-board.test.ts`; this
lane's six paths contain neither. **The intersection is empty as a
comparison of two named sets and not by the emptiness of one of them.**

**FINAL RANGE**: `git merge-tree --write-tree 15a963d HEAD` → **exit 0**
(read before the substitution), tree `895a2e24`, **6 paths**. Main was
`15a963d` at every one of the three times it was read. Lane tip
`31d8212`; work commits `9dfb5a0`, `c98313c`, `31d8212`.

## Verification — APPROVED

Adversarial verification by a seat that did not build this, at lane tip
`8d93149`. **BOUNDED READ**: the card was read at base `15a963d` (located
by `grep -rl "^id: T-134$" docs/tasks/`, never a filename glob) and the
attack set was derived from its criteria and **written down at
2026-08-26T09:05:33Z, before the diff or the notes commit was opened**.

**RANGE, by the range rule.** My named ref is `verify-T134-mainbase` =
`cf470f576ff4bb2536f047eb512a7b21c9d96bba` — main as I read it, which is
TWO COMMITS AHEAD of this lane's base (`T-136`/`T-137` landed at
`cf470f5`). `git merge-tree --write-tree verify-T134-mainbase
verify-T134-tip` → **exit 0, read from `$?` BEFORE the substitution**,
tree `a0ed6d178dd2a6ebc8e0b24bb97c29fbb02c5a23`, **6 paths**. Clean merge.

### The flip census — RE-DERIVED TWICE, INDEPENDENTLY, AND IT HOLDS

Once with a from-scratch implementation written against the card's prose
and NOT importing `fence.ts`, and once through the real `parseProject` +
real `fence.ts`. **Both give the same answer, and it is the card's**:
36 open cards, 630 pairs, **25 flips, 25 distinct cards, every one
`disjoint` → `overlapping`, NONE the other way** — pair-for-pair and
witness-for-witness identical to the enumeration, Shape A 19 pairs on
`app/src/assets` + `app/src/styles`, Shape B 6 pairs on
`method/lane-protocol.md` and `method/tasks/TASK-FORMAT.md`.

**THE DANGEROUS DIRECTION IS EMPTY, AND I DID NOT TAKE THAT ON TRUST.**
My first census reported **4 flips the other way** — the direction that
would mean the expansion LOOSENS a fence. **That was my own defect, not
the lane's**: `paths:` carries a trailing `#` comment on C-05, C-07,
C-12 and C-16, my block-list header regex demanded end-of-line, and those
four components parsed with ZERO paths. Fixed, and the reverse count went
to 0 and stayed there under both implementations. Recorded because a
verifier's own tooling is the last thing that gets a positive control.

**RE-RUN AT CURRENT MAIN `cf470f5`: 38 cards, 703 pairs, THE SAME 25
FLIPS, still 0 reverse.** `T-136` and `T-137` add none. Criterion 7's
enumeration survives the merge; only its *pair count* is stale.

**THE NEAR-MISS IS REAL AND LIVE.** `T-131 × T-134` → **overlapping**,
witness `method/lane-protocol.md`, derived not asserted. So are
`T-105 × T-134` and `T-128 × T-134`. `T-111 × T-134` → **disjoint**.

### The pins

**PIN TWO's two live instances confirmed**: `T-112 [app-dispatch,
app-board] × T-114 [app-shell]` → overlapping on `app/src/assets` and
`app/src/styles`, no shared token; `T-128 × T-134` → overlapping by
containment, no shared token. **PIN ONE has no live instance and cannot
have one — MEASURED**: zero `touches:` path tokens fall inside any
SLUG-CARRYING component. The card's backwards guess is correctly
self-refuted.

### Attacks that found nothing (reported because they found nothing)

29/29 targeted probes pass. Containment both ways; **the prefix-string
trap is not an overlap** (`method/lane` vs `method/lane-protocol.md` →
disjoint); a file fence does not swallow an unrelated directory;
`docs/tasks` refused in 7 spellings including `docs\tasks` and
`docs//tasks//`, with positive controls that `method/`,
`docs/architecture/components/` and a NAMED file under `docs/tasks` are
still accepted; unresolved and rejected tokens yield `unusable`, never a
silent `disjoint`; `method` vs `method/` never disagree.

**THE PARSE-TIME-REFUSAL ARGUMENT WAS ATTACKED AND HOLDS.** Simulating a
fenceable `docs/tasks` (via `docs/notes/`): the holder reserves the
directory, the neighbour's own card file is carved out of the
neighbour's own fence, so the comparison is **disjoint** — the collision
is structurally invisible. **Counter-probe**: when the other side
EXPLICITLY names a file there, the witness appears. So the mechanism is
not merely broken, and the refusal genuinely must happen at parse time.

**Criterion 2 pinned positively**: mutating C-11's `touch_slugs:` reds 2
bodies, and `app-shell`/`app-board` appear in `fence.ts` **only in doc
comments**. There is no table.

### Drills — the lane's 8 arms reproduce EXACTLY, and 5 of mine do not

Control **290/290, exit 0**. Producer mutated, never an assertion; each
mutation read back with `git diff` BEFORE its run; every restore proved
by sha256 against `git show HEAD:` at `28c022e6…`; `git status` carried
only the `node_modules` symlink throughout.

| arm | claimed | measured |
|---|---|---|
| 1 trailing-slash strip | 6 | **6** |
| 2 first component only | 3 | **3** |
| 3 containment arms | 1 | **1** |
| 4 `UNFENCEABLE_PATHS` emptied | 2 | **2** |
| 5 carve-out disabled | 2 | **2** |
| 6 `unusable` collapsed | 2 | **2** |
| 7 `GLOB_CHARS` | 1 | **1** |
| 8 trailing-slash-is-evidence | 4 | **4** |

**FIVE ARMS OF MY OWN SURVIVE THE WHOLE 290-BODY SUITE**, so these
behaviours are UNPINNED: (9) the own-file suppression *in
`compareFences`* — `if (excluded.has(shared)) continue;` can be deleted
green; (10) `sharedDomain`'s repository-root arms; (11) the witness
SORT, which the interface documents; (12) the witness DEDUP; and
(13) **the dedup key reverted to a space join stays 290/290 green** —
which positively demonstrates this card's own lesson: the NUL site was,
and REMAINS, invisible to every behavioural body. Its only guard is a
text gate.

**THE NUL, INDEPENDENTLY REPRODUCED.** Exactly 2 × U+0000 at byte offsets
**18812** and **18824** pre-fix, 0 at tip across all six paths.
Replanting it reds `lint:tokens` at **P5, those same two offsets, exit
1**, while the parser suite stays **290/290 exit 0** — the gate's unique
reach verified rather than believed. Repo-wide sibling hunt: **no sibling
introduced by this lane** (the U+202E/U+202C and U+FEFF hits are
pre-existing deliberate fixtures outside this diff).

### Suites and gates — every exit read unpiped from `$?`

- `npx vitest run` from `lib/parser/` — **290/290, exit 0**, 13 files,
  `fence.test.ts` 22 bodies.
- `npm test` from `app/` — **973/973, exit 0**, 47 files, after
  `lib/parser` build then `app` build, both exit 0. `npm run typecheck`
  from `app/` — **exit 1, `Missing script: "typecheck"`**, re-derived.
- `npm test` from `tools/e2e/` — **194/194, exit 0, 2.4m**, explicit port
  **15913**, re-probed free immediately before binding at 09:23:54Z and
  released after; header, `✓` count and highest body number all 194.
  (Port **15885** was held by another live lane during my run, and port
  1420 by **pid 46532**, read rather than remembered.)
- `lint:tokens` **exit 0, TOKEN 138 / CONTROL 776**; `git ls-files`
  **794** at my ref. `lint:docs` **exit 0**. `tsc --noEmit` exit 0 in
  `lib/parser` and `tools/e2e`.
- **DOCS GATE: FIRES, exit 1**, run DIRECTLY on my range's six paths,
  never through `xargs`. **1 of 6** — this card — and **NOT**
  `method/lane-protocol.md`. 15 derived readers across 4 suites, census
  131 sites in 22 files, 0 frontmatter issues, 6 root-anchored argued.
- `arch cycles` **exit 1 by design**, read unpiped: `C-08 -> C-09 ->
  C-08`, `components=13 declared_edges=35`.

### For the integrator

**GRAPH REGEN ASKED, NOT PREDICTED, WITH A POSITIVE CONTROL FIRST**:
`--check` on clean main says **CURRENT, exit 0** (`955710 · 181 · 2038 ·
1943`), so the tool agrees with main's committed graph. Against this
lane: **STALE, exit 1** → `970961 · 183 · 2064 · 1986`, `files +2 -0 ~2`,
`edges +43 -0`, no foreign staleness. **97.10% of `max_graph_bytes`
1 000 000, 29 039 headroom, spending 15 251** — larger than T-135 Half
A's 11 120.

**THE IDENTICAL-FIGURES TRAP REPRODUCED INDEPENDENTLY**: regenerating
against each tree gives pre-fix `09151e14…` and post-fix `ee554cea…`,
**both exactly 970 961 bytes**. A byte comparison would have said
"unchanged" and been wrong. Both graphs discarded; `graph.json` back at
`b742efbe…` in every worktree, and **it is correctly NOT committed here**.

`arch` goes `components=13 files=181 mapped=181 unmapped=0 edges=37
findings=4 drift_components=4` → **`files=183 mapped=183`, every other
figure unchanged**; **C-06 25 → 27 is the only component that moves.**
Fixtures owed, confirmed present: `expect(derived.fileComponent.size)
.toBe(181)` **and the test TITLE** at `architecture-dogfood.test.ts`, and
`"committed graph · 181 files"` at `map-dogfood-render.test.tsx`.
`smoke.test.ts` carries no file count and does NOT move.

### Rulings asked for

**R1 — ROUTING RATHER THAN UNIFYING WAS RIGHT, AND MORE STRONGLY THAN THE
CARD ARGUES.** `tools/e2e` is outside this card's fence, so unifying
would have breached the very rule this card ships. **And `T-136` is LIVE
(`status: building`) holding `touches: [tools/e2e]`** — unifying here
would have put two writers on `dispatch-brief.mjs`, which is this card's
own subject matter. `T-137` (planned) already holds `[lib-parser,
tools/e2e]`, which is exactly the fence the migration needs. The
manifest declaration is real and verbatim ("Third standalone package
(ADR-011 family); imports neither app nor parser"), and `brief.spec.ts`
already pins `fenceOverlaps` on the same containment case, so the
migration is a real decision with coverage behind it, not a chore.

**THE PARSE-TIME-REFUSAL ARGUMENT IS SOUND** — attacked above, with a
counter-probe, and it survived.

### Where this card and the dispatch brief are still wrong

- **R6 IS WRONG, AND SO WAS THE BRIEF.** `method/lane-protocol.md` is NOT
  "read by NO suite": `tools/e2e/scripts/dispatch-brief.mjs:152` calls
  `readDoc("method/lane-protocol.md")` via `laneProtocolText()`, and
  `tools/e2e` exercises it. **The conclusion survives for a different and
  sharper reason**: the brief consumes only numbered steps **2, 3, 4 and
  6**, this card's edit is entirely inside **step 5**, and steps 2/3/4/6
  are byte-identical across the merge (819 / 1107 / 5927 / 960). So there
  IS a STRUCTURAL guard — `numberedStep` THROWS on a missing step — and
  no CONTENT guard on rule 5. The protocol half ships unpinned as to what
  it says, pinned as to its shape.
- **"The divergences are real and all in one direction" (R1) is FALSE as
  a statement about verdicts.** Measured against the parser on 15
  constructed cases: the missing own-file carve-out makes that copy
  STRICTER (false overlap), while `ci` and `docs/tasks` make it LOOSER
  (false disjoint). They go both ways.
- **R1 UNDERCOUNTS THE DIVERGENCES.** Beyond the three named, that copy's
  `pathsOverlap` does not collapse repeated slashes, does not strip a
  leading `./`, strips only ONE trailing slash, and does not convert
  backslashes — so `docs//tasks2/`, `./method/`, `method//` and
  `method\lane-protocol.md` each come back **disjoint where the parser
  says overlapping**, all four in the DANGEROUS direction. It also has no
  glob ceiling: `app/src/**/*.ts` is compared as a literal prefix, which
  is the "answer confidently and wrongly" case `fence.ts` refuses.
- **AND THE MEASUREMENT THE CARD DOES NOT MAKE IS THE REASSURING ONE**:
  on the live board the two implementations **agree exactly** — 305
  overlapping pairs each over 703 pairs, **0 disagreements**. The
  duplication is a latent hazard today, not an active wrong answer.
- **"not one path token inside a component's `paths:` block" is
  literally wrong** — **21** path tokens sit inside C-01's `method/**`.
  The conclusion survives because C-01 carries NO slug (`touch_slugs:
  []`), so no pin-one instance is constructible. The true statement is
  "inside a SLUG-CARRYING component's `paths:` block".
- **"139 slug tokens, 88 path tokens" silently mixes two models.** 88 is
  the NO-ORACLE figure (3 unresolved); WITH the repository oracle the
  same board reads 139 / 90 / 1, and the card's own `ci` discussion uses
  the oracle. Both reconcile to 230. The brief's `216` is 230, as the
  card says.

### What this approval does NOT cover

- **THE UNION-EXCLUSION HOLE.** `compareFences` unions BOTH fences'
  `excluded`, so if card B explicitly fences card A's own file while A is
  live, the shared domain is suppressed and the verdict is **disjoint**
  though both would write it. `fence.ts` discloses this ("another lane
  cannot be told it collides there") and live exposure is **zero** — no
  card fences another card's file. **But R3 and R4 both propose fences of
  exactly that shape** (`[…, docs/tasks/T-054-…md]`), which would create
  the first instance, and my arm 9 shows the suppression is unpinned. The
  existing body "does not suppress a collision on somebody ELSE's card
  file" uses a THIRD card's file and does not reach this case.
- **AC6 is met in the fence module, not in `validateProject`.** A card
  spelling `docs/tasks/` is refused only when someone expands its fence;
  the normal parse path stays silent (R3, routed deliberately, with a
  stated reason).
- The unpinned behaviours in arms 9–13 above.

**VERDICT: APPROVED.** All seven criteria are met, the central empirical
claim survives two independent re-derivations including its direction
property, both pins and both live pin-two instances check out, the eight
drill arms reproduce exactly, and every owed suite and gate is green with
its exit read unpiped. Verifier frontmatter fields deliberately left
unstamped.
