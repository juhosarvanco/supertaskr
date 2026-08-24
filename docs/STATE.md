# State

Updated: 2026-08-25 by the T-096 integrator (executor-integrator, size S).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: FOUR LANES ARE LIVE
AND EVERY ONE OF THEM HOLDS A FENCE.** This is a handoff, not a quiet
tree. The previous version of this file opened *"there are NO LIVE LANES —
`git worktree list` returns one entry"* and **that sentence was false to
every session dispatched on the night of 2026-08-24**, this one included:
it was written at T-090's checkpoint `1ef2d62`, four commits before the
first dispatch batch, and nothing rewrote it while six lanes were cut
under it. T-096's executor reported it as a live defect in its own
read-first set, and this rewrite is the fix. **A checkpoint that does not
re-derive its own lane list hands the next session a lie in the one file
it is told to read first.**

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is a
scratch worktree and not a lane (the T-089 correction in CONVENTIONS).
Four scratch worktrees belonging to other lanes' verifiers were live
beside these and hold no fence.

| lane | fence (`touches:`) | worktree tip | where it is |
|---|---|---|---|
| **T-123** | `[app-shell, app-agent]` | `02a1b29` | rebuild in flight after a REJECTED verdict — the first fix introduced a second dead end |
| **T-110** | `[app-dispatch]` | `6fea6a1` | under independent verification |
| **T-010** | `[crate-index, docs/architecture/components/]` | `cb13957` | under independent verification — the Rust extraction, which takes the graph to roughly 89% of its size budget |
| **T-031** | `[app-board, app-interview]` | `765362e` | building |

**THE BOARD CANNOT TELL YOU THE THIRD COLUMN AND THIS CHECKPOINT SAYS SO
RATHER THAN PRETENDING OTHERWISE.** All four cards read `status: building`
with an empty `verifier:` — derived from disk here — so "under
independent verification" and "rebuild after a rejection" come from the
DISPATCHER's own report at this integration turn, not from the
repository. That gap is CONVENTIONS' standing point made concrete:
`git worktree list` is the authority on which fences are held, the
board's `status:` is not, and neither of them carries a lane's PHASE.

**T-096's own worktree is removed in the same breath as this commit**, in
the order lane-protocol rule 6 fixes (merge, then checkpoint, then
remove), so `[lib-parser]` is FREE. Every other fence in ARCHITECTURE's
slug table is free too — `tools/e2e`, `.github/`, `docs/CONVENTIONS.md`,
`app-map`, `method/`.

## Just completed

**T-096 — two properties the parser suite stated in prose and could not
check, and both mutants were still alive when this lane opened.** F-02,
milestone 4, size S, `touches: [lib-parser]`, **fence never widened**.
Built and self-integrated by `claude-opus-5 @T-096`; `review:
self-verified`. Main-before **`ee9dacb`**, lane tip **`641c8a7`**, merge
**`e27673d`**, this checkpoint after it. The card was stamped `building`
before the cut and this checkpoint stamps `done`.

**WHAT LANDED IS A SUITE THAT CAN NOW FAIL, NOT A BEHAVIOUR THAT
CHANGED.** `lib/parser/src/**` is a **0-file diff** — the whole merge is
four test files plus one new fixture file — so the parser's `dist/` is
unmoved and the app compiles against exactly what it did before.

**BOTH MUTANTS WERE RE-DERIVED AT THE LANE'S OWN BASE BEFORE ANYTHING WAS
BUILT**, because a card's premise is a figure like any other and this
project has been burned by transcribed ones four times this month. In a
detached worktree at `765362e`: baseline **263 passed (263), exit 0**;
the pre-T-076 comparator inlined at the `ambiguous-mapping` sort site with
`compareComponentIds` left total, **263/263, exit 0 — survives**; the disk
assembly reordered to component-before-roadmap, **263/263, exit 0 —
survives**. The card was right about both.

## ONE — THE DECLARED WINNER IS NOW PINNED THROUGH THE CONSUMER

T-076 fixed `compareComponentIds` and pinned `compareComponentIds`. The
property the fix exists to protect lives one layer out: the winner the
`ambiguous-mapping` message DECLARES — *"first by id, '<id>', wins file
mapping"* — is the smaller id however long the digit run. The sort site is
`compareComponentIds(a.id, b.id) || <file order>`, and **`NaN` is falsy**,
so the moment the comparator cannot weigh two ids the tiebreak swallows
the NaN and the declared winner silently becomes the id in the
first-sorting FILE: deterministic, reproducible, and wrong.

The new body parses two components with 400- and 401-digit ids and
identical `app/src/**` patterns **twice**, with the spellings swapped
between two file names that sort in opposite orders, and asserts the
smaller id wins in the structured `ids` field AND in the message's own
sentence both times. Two fixture choices are load-bearing: the digits are
picked so **string order DISAGREES with id order**, so the body
discriminates a fall-through to the string fallback as well as the file
tiebreak; and the `files` array is asserted in both runs as a **positive
control that the two runs really are different arrangements** — the
winner's FILE moves while the winning ID does not.

**THE CARD'S OWN PROBLEM STATEMENT WAS WRONG IN ONE CLAUSE, AND THE ERROR
WAS LOAD-BEARING.** It said *"T-076's own new pins all assert the
comparator in isolation rather than through the consumer."* False at
`765362e`: T-076 built exactly ONE consumer-side pin — `the slot's OWN ids
array is ordered past the double range too (T-076)` — which is the same
two-arrangement shape this card asked for, on the comparator's OTHER
consumer. The true statement is narrower and sharper: **T-076 pinned one
of the comparator's two consumers through the consumer and left the other
pinned only in isolation.** That changes what this card is — not "T-076
forgot the consumer" but "T-076 found the shape and applied it to one site
of two". The correction is written on the card.

**CRITERION 3 WAS RULED BY MEASUREMENT RATHER THAN BY ARGUMENT.** The
component-space `aliased-id` `ids` array *does* degrade by the same
mechanism at the same threshold — `Number()` fuses both spellings of a
>309-digit slot to `Infinity`, and here there is no `||` to swallow the
NaN, so it reaches `Array.prototype.sort` directly and V8 leaves the pair
in arrival order, which is sorted FILE order. **It needs no new treatment
because it already HAS the treatment**: the same mutant at the
`aliasedIdSlots` call site reds T-076's body, **alone**, at 1 failed / 263
passed, exit 1. A ruling that carries its own mutant is worth four that
carry an argument.

## TWO — THE PARITY FIXTURE STOPS BEING BLIND TO TWO OF ITS THREE LAYERS

`parseProject` (disk) and `parseProjectFromFiles` (pure) are contracted
deep-equal and both declare the same LAYER ORDER, task -> roadmap ->
component. **A PARITY ASSERTION CAN ONLY SEE THE LAYERS IT HAS ISSUES
FROM**, and `broken-project`'s issues were all task-layer — so the order
was outside what `toEqual` could check and a disk-side reorder left the
whole suite green while the two entry points returned different lists on
one fixture.

The fixture now carries one issue from EACH layer: `yaml-error` +
`missing-field` (task, both pre-existing), a `roadmap-error` from a
malformed backbone line, and a `missing-field: paths` from a new
`C-90-missing-paths.md` component. **No second parity body was added, and
that was the point**: a body written to remember an order is a second
place for it to be forgotten, while a fixture that spans the layers makes
the EXISTING assertion hold the whole contract — including for layer
properties nobody has thought of yet.

Three reconciliations came with it, each checked, none loosened:
`loadFixture` loads a components directory when a fixture declares one
(guarded; other fixtures untouched); the parity body passes
`componentsDir` and gains a deliberately **order-INDEPENDENT** fixture
coverage control, so the ORDER stays held by `toEqual` and by nothing
else; and `project.test.ts`'s reader of the same fixture goes
`toHaveLength(2)` -> `4` with the two new layers asserted by field and
file.

## THE DRILL — TEN MUTANTS, ONE SIDE ONLY, ALWAYS THE PRODUCER

Detached scratch worktree **`drill-T-096`** at the lane's own commit
`3d870bb`, plus **`drill-T-096-base`** at `765362e` for the premise
re-derivation. **Both names are card-scoped rather than the shared literal
`drill`** (`T-088-s3` / `T-113-s2`), and the worktree list at this
integration turn shows why that matters: four other scratch worktrees were
live in the same directory. No `CARGO_TARGET_DIR` hazard applies — no Rust
body was drilled. Baseline **264 passed (264), exit 0**. Every mutation
applied by a driver that REFUSES a path outside the drill, REFUSES a test
file without an explicit flag, and requires a substitution count of
exactly **1**; every mutated TEXT read back with `git diff --unified=0`
BEFORE its suite ran.

| # | mutation (producer only) | suite | failing BODIES |
|---|---|---|---|
| D1 | pre-T-076 comparator inlined at the `ambiguous-mapping` sort site | 1 failed / 263, exit 1 | **1** — the new body |
| D2 | disk assembly: component issues before roadmap issues | 1 failed / 263, exit 1 | **1** — the parity body |
| D3 | sort site: the `compareComponentIds(...) \|\|` term DELETED | 1 failed / 263, exit 1 | **1** — the new body |
| D4 | sort site: comparator NEGATED | 5 failed / 259, exit 1 | 5 |
| D5 | pre-T-076 comparator passed to `aliasedIdSlots` | 1 failed / 263, exit 1 | **1** — T-076's aliased-id body |
| D8 | component parser stops emitting `missing-field` for `paths` | 3 failed / 261, exit 1 | 3 |
| D9 | `ambiguous-mapping`'s `files` array reversed | 2 failed / 262, exit 1 | 2 |
| D10 | roadmap parser stops emitting the malformed-bullet error | 4 failed / 260, exit 1 | 4 |
| D13 | BOTH assemblers reordered the SAME way (parity preserved) | 1 failed / 263, exit 1 | **1** — T-076's pure-side pin |
| D14 | pure assembly: component issues before roadmap issues | 2 failed / 262, exit 1 | 2 |

**D3 IS THE MUTANT THE CARD'S LAST CRITERION ASKED FOR, AND IT IS THE ONE
WORTH COPYING.** It was derived from criterion 1's TEXT with
`component.test.ts` and `files.test.ts` never opened — written to a scratch
file before either was read — and it is not the mutant the card supplied.
T-076 ran 16 one-sided mutants with zero survivors and reported that
honestly; the two that survived were of the same class, because the 16
were derived from the pins that EXISTED rather than from the criteria that
were WRITTEN. **A mutant derived from a criterion can kill a pin that does
not exist yet. A mutant derived from a pin never can.**

**T-092's SHAPE-SIX CHECK, per new or changed body, all ONE**: D1 and D3
each red the new `ambiguous-mapping` body and nothing else; D2 reds the
widened parity body and nothing else. Non-duplication is proved in both
directions — D1/D3 red the new body and not T-076's, D5 reds T-076's and
not the new one.

**D13 ANSWERS THE OBVIOUS OBJECTION BY MEASUREMENT.** A parity assertion
cannot see a reorder applied to BOTH sides, so the fixture widening would
be worth little if that case were uncovered. It is not: T-076's pure-side
pin catches it, alone. The three cases are covered by two bodies between
them — disk-only by the parity body, pure-only by both, symmetric by the
pure-side pin.

**RESTORATION PROVED THREE WAYS** after every mutant and at the end of the
drill: an empty tracked `git diff`, `sha256` of all five touched files
against the drill's own commit `3d870bb` (all MATCH), and a clean re-run
at **264/264, exit 0**. Both drill worktrees removed and pruned; the
symlinked `node_modules` UNLINKED rather than deleted, target verified
present afterwards.

## A JUSTIFICATION WAS WRITTEN, THEN REFUTED BY ITS OWN COUNTERFACTUAL

The comment on `project.test.ts`'s reconciled `missing-field` lookup first
claimed the bare `find` *"would have redded this body under a disk-side
reorder"*. **Measured, that is false.** The counterfactual — the OLD bare
lookup restored with the disk mutation applied, deliberately TWO-SIDED and
therefore NOT counted as a drill — leaves `project.test.ts` GREEN, because
the TASK layer still comes first under that transposition and the bare
`find` still lands on `size`. The full 2x2, every cell measured at
`3d870bb`:

| disk mutation | named lookup (as landed) | bare lookup (as it was) |
|---|---|---|
| component before roadmap | 1 body (parity) | 1 body (parity) |
| component before TASK | 1 body (parity) | **2 bodies** (parity + `project.test.ts`) |

So the naming IS load-bearing, for a transposition one step away from the
one the comment named. The file now states the measured reason and says
the first was refuted. **A reason that sounds right is not a
measurement** — which is this card's own subject, arriving one layer down
inside the card's own work.

## Ranges, every dot count stated, at their own refs

Main-before **`ee9dacb`** (the eighth-triage commit, **verified as the tip
at the moment of merge** rather than inherited from a brief — main moved
FOUR times under this lane: `765362e` -> `d43455b` -> `c6ef751` ->
`e884802` -> `ee9dacb`), lane tip **`641c8a7`**, merge-base **`765362e`**
(the dispatch-stamp commit, the lane's own base).

    git merge-tree --write-tree ee9dacb 641c8a7 -> tree 1f90c6f4…, exit 0 (read from $? FIRST)
    git diff --name-only ee9dacb <TREE>                         -> 7   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only ee9dacb...641c8a7   (THREE dots)       -> 7
    git diff --name-only 765362e..641c8a7    (TWO, branch-only) -> 7
    git diff --name-only ee9dacb..641c8a7    (TWO dots)         -> 23  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 765362e..ee9dacb    (main's advance)   -> 16
    git diff --name-only ee9dacb..e27673d    (THE MERGE'S DIFF) -> 7   the only one that means anything

**THE FORBIDDEN COUNT IS 23 AND IT IS PURE LEFT-ENDPOINT DRIFT**: main
advanced **16** paths from the cut, the branch **7**, `comm -12` over the
sorted lists is **EMPTY**, and 16 + 7 = 23 — the arithmetic that proves
the two sets disjoint. The same lane forecast **10** against the same 7
one main tip earlier; the whole swing is main's, which is the mechanism
this rule exists to name.

**THE FORECAST WAS EXACT.** The merge's own `HEAD^{tree}` IS
`1f90c6f4b8bcf20d05b3ae47765a30d26f54d54c`, byte-identical to the
`merge-tree` forecast, and the merge's diff is the same 7 paths. Parents
are `ee9dacb` and `641c8a7` and nothing else. **NOTHING WAS WRITTEN INTO
THE MERGE COMMIT**; every integrator edit is in this checkpoint.

## THREE standing gates — DERIVED from the merge's own seven paths

| gate | trigger | on these 7 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **3 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **2 — FIRES**, three suites |

- **GRAPH REGEN — FIRES, AND FOR ONCE IT IS GENUINELY OWED.** This is the
  counter-example to the T-054/T-058/T-090 worked examples, which every
  recent checkpoint has recorded going the other way: there the trigger
  was wider than the walk and `index --check` said CURRENT. Not here.
  `.nputerignore` excludes `docs/`, `tools/` and the indexer's own fixture
  trees, and **`lib/parser/**` is none of those** — 25 of the graph's 126
  files live under it, 12 of them test files. Asked rather than predicted:
  `index --check` exited **1, STALE** at the merge. The delta was
  FORECAST before the regen and the forecast held exactly — committed
  `648863 bytes · 126 files · 1126 symbols · 1712 edges` -> fresh
  **`648886 bytes · 126 files · 1126 symbols · 1712 edges`**: **+23 bytes,
  `files +0 -0 ~3`, `edges +1 -1`**, the one edge being
  `lib/parser/test/files.test.ts -> node:fs` gaining `existsSync` in its
  import symbol list. **Symbol, edge and file COUNTS do not move at all**,
  which is what a change confined to test bodies looks like. Regenerated
  with `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
  self_graph -- --ignored` (exit **0**) and committed HERE, with the
  checkpoint, per the rule. `index --check` afterwards: **exit 0**,
  *"graph.json is CURRENT"* at 648886 bytes.
  **AND MAIN'S OWN 16-PATH ADVANCE CONTRIBUTED NOTHING TO IT** — derived,
  not assumed: all 16 are `docs/tasks/*.md`, which the walk excludes, so
  the delta is this lane's alone. A lane's own re-derivation also caught a
  stale figure inside the lane: the same check at `3d870bb` reported
  `project.test.ts loc 121 -> 146` where the merge reports **156**,
  because the lane's second commit edited that file again. **A graph
  forecast is a function of a tree like everything else.**
- **BOOT GATE — NOT OWED, 0 of 7.** This fence cannot produce
  `app/src-tauri/**`, `app/src/**` or either manifest, and the count is
  stated rather than the conclusion asserted.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the paths as ARGUMENTS,
  ROOT-RELATIVE, and never through `xargs`. **2 of 7 paths under docs/,
  THREE suites owed** — `npm test from app/`, `npm test from tools/e2e/`
  and `npx vitest run from lib/parser/`, which is the "a flat
  `docs/tasks/T-*.md` owes THREE" case the gate's own bullet describes.
  The run reports **12 derived readers across 4 suites**, **0 frontmatter
  issues**, a census of **123 docs-shaped sites in 22 files, 12 of them in
  10 files resolving into this repo's docs/**, **25 files holding the
  repository root** (11 derived, 0 unlinked, 14 with no linkable site),
  **1 package-relative site, derived**, and the root-anchor ledger at 6
  entries. All three suites were run at the merge AND again after this
  checkpoint's own doc writes.

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command, captured on the very next token.

- **parser: 264/264 across 12 files**, exit **0**; `npx tsc --noEmit` exit
  **0**. The figure moves 263 -> 264 because this merge adds exactly ONE
  body — the parity work adds none, it widens a fixture.
- **app: 940/940 across 46 files**, exit **0**, after `npm run build` exit
  **0**. **THE BUNDLE IS BYTE-IDENTICAL TO MAIN'S** —
  `index-C86RloYb.css` / 45.06 kB and `index-DEkJr3K8.js` / 526.42 kB,
  both unmoved, which a merge adding no bundle input requires.
- **E2E: 143/143**, exit **0**, scratch port **15005**; `npm run
  typecheck` **0**. No spec file added or changed by this merge.
- **token lint: selftest 0, lint 0** — clean at **TOKEN 131 / CONTROL
  605**. Both counts are PRINTED and pinned by nothing; derive them at
  your own ref rather than quoting these.
- **`npm run lint:docs` exit 0**, run the way CI will run it.
- **cargo** is NOT owed by this merge and the reason is stated rather than
  the conclusion asserted: the gate names three suites and cargo is not
  among them, because `kit.rs` reads `docs/CONVENTIONS.md` and `arch.rs`
  reads the component registry, neither of which this merge touches. The
  `self_graph` regen above ran under cargo and exited 0.

## Documents: two ticked, one CHECKED and needing nothing

- **ARCHITECTURE's C-06 row** carries one new clause, and it is explicit
  that **nothing in the T-076 entry was falsified** — this is an addition
  to a lineage, not a correction. What it records is the distinction the
  card is about: *"both are closed"* was true of the BEHAVIOUR and half
  true of the PINS, and the row now says which half, plus the class to
  carry forward.
- **The card** is stamped `done`, `built_by: claude-opus-5 @T-096`,
  `review: self-verified`, and its drafter's note is removed as it asked.
- **ROADMAP IS NOT TICKED, AND THAT IS DERIVED RATHER THAN ASSUMED.**
  `grep` for `T-096` returns zero hits; its two parser sentences are about
  T-066's scroll containment and T-055's inert spans, neither a claim this
  merge falsifies. T-076, T-053, T-030 and T-019 each earned no ROADMAP
  narrative for the same reason, and this one changes no shipped
  behaviour at all.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after, in the lane and at the merge — no bind, no
connect, no signal, on any interface. Holder `node` pid **82549**, one
socket `TCP [::1]:1420 (LISTEN)`, identical throughout.

1. **NOTHING REACHED THE RUNNING WINDOW, which is the correct outcome for
   a merge that changes only test files.** The merge contains no Rust, no
   `app/src/**` and no manifest, so neither `tauri dev`'s restart trigger
   nor vite's HMR path is touched.
2. **The integrator's `cargo` runs share `target/` with the human's live
   dev app** (T-113's observation, confirmed again here): the graph gate
   and the regen both built into the shared directory while the app was
   running, and the app was unaffected.
3. **The map pane DOES see a new graph this time**, unlike the last four
   checkpoints — `docs/architecture/graph.json` is in this commit. The
   movement is +23 bytes and one import-symbol list; no node, ring,
   relation or symbol-panel content changes, because no symbol, edge or
   file count moved.

**No process from this integration survives.** Scratch ports **15004**
(lane) and **15005** (merge) were each read with `lsof` FIRST (zero rows)
and then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::`
before use, in that order and never the reverse, and both were free again
after. **No `pkill` at any point.** No `npm ci` or `npm install` was run
in the main checkout — all three packages were already installed there.
**The untracked zero-byte file `z`** still sits there — not this
integrator's, not staged, left alone for the sixth checkpoint running.

## The board, derived from disk at this checkpoint

**166 flat task files — 76 done / 43 planned / 42 parked / 1 suggested /
0 verifying / 4 building; 26 in `rejected/`.** 76 + 43 + 42 + 1 + 0 + 4 =
166. T-096's stamp moves done from 75 to 76 and building from 5 to 4.

**THE EIGHTH TRIAGE LANDED AT `ee9dacb`, IMMEDIATELY BEFORE THIS MERGE**:
8 findings promoted into 4 targets, 2 parked with armed triggers, and the
**suggestion backlog taken to ZERO**. That is why `suggested` reads 1 and
not 0 here — **`T-096-s1` is the first suggestion of the new cycle**, and
whoever triages next is looking at a backlog with exactly one entry in it.

## Provenance — SELF-DECLARED, never read off a trailer

T-096 is **built by `claude-opus-5` and self-verified by the same
session**; `built_by: claude-opus-5 @T-096`, `review: self-verified`.
**The `Co-Authored-By` trailer on this lane's commits is a harness
constant and is NOT evidence of a model** — T-085 proved it and T-101 made
the proof sharper with a counterexample inside one session. Nothing here
reads a model off a commit signature.

**76 done cards — 56 `same-model`, 14 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 56 + 14 + 5 + 1 = 76. T-096 moves `self-verified` from 13
to 14.

At this checkpoint main contains T-096's merge `e27673d` plus this commit.
Parser, app, E2E, token lint and its selftest, the docs gate and the
graph-currency gate are all green; **all three standing gates were
DERIVED, two FIRED and were RUN, and the third's not-owed count is
stated.** Nothing is broken.

## In progress / broken right now

**FOUR LANES ARE LIVE — see the table at the top of this file, which is
derived from `git worktree list` and is the thing to re-derive rather than
to quote.** `[lib-parser]` was released by this checkpoint. `git branch`
still lists every lane this repo has ever run, which is the intended
asymmetry: the BRANCH is kept and only the WORKTREE is removed.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1126 SYMBOLS / 1712
EDGES** at **648886 bytes / 126 files**, and should **forecast the DELTA
and re-derive the endpoints** — the absolutes are about to move a long
way, because T-010's Rust extraction is in flight and takes the graph to
roughly 89% of its size budget.

## Next up

1. **`T-096-s1` is the whole suggestion backlog and it is one line of test
   title.** A third body in the parser suite —
   `component issues surface in the project model after task and roadmap
   issues` — TITLES the pure layer's order and carries ONE issue, so it
   cannot check it (mutant D14 reds two bodies and neither is that one).
   The fix is the TITLE, not the fixture: widening it would build exactly
   the second order-remembering body T-096 refused. Fence `[lib-parser]`,
   free as of this commit.
2. **THE CLASS IS WORTH MORE THAN THE THREE INSTANCES.** T-096 found the
   same shape three times in one suite — a pin on the mechanism standing
   in for a pin on the property, with a TITLE that reads like the
   property. Both surviving mutants got past T-076's honest 16-mutant
   sweep for one reason: **the sweep was derived from the pins that
   existed**. The cheap standing remedy is the one this card exercised —
   derive at least one mutant from a CRITERION with the test file closed —
   and it belongs in CONVENTIONS' POISON DRILL bullet beside SHAPE FIVE
   and SHAPE SIX rather than only in this checkpoint. Nobody owns that
   edit yet; `[docs/CONVENTIONS.md]` is free.
3. **The four live lanes land next** and three of them are bigger than
   this one: T-123's rebuild (a rejected verdict whose fix introduced a
   second dead end), T-110 and T-010 under independent verification.
   **T-010 is the one to sequence carefully** — it moves the graph by
   roughly an order of magnitude more than anything this month, and every
   lane merging after it inherits new regen endpoints.
4. **`T-088-s3` / `T-113-s2` gained a fifth data point tonight.** This
   lane's two drill worktrees were card-scoped (`drill-T-096`,
   `drill-T-096-base`) and shared a scratchpad directory with **four**
   other lanes' scratch worktrees without colliding. Card-scoping the
   drill path is a fix direction with five worked instances behind it now.
5. **The GNU `xargs` column still closes at the first push**, and
   `git remote` still returns zero remotes.
6. **There is no outstanding @human item.**
