---
id: T-149
title: app-shell is 77% a test umbrella, 20 of 34 planned cards touch it, and two thirds of those tests belong to something other than the shell
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [docs/architecture/components/, app-shell, app-map]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

## The measurement

**`app-shell` is the board's throughput ceiling.** 20 of 34 planned
cards touch it; while one lane holds it, **59% of the board cannot be
dispatched.** That is not a scheduling annoyance — it is why nothing was
dispatchable for most of 2026-08-26 with a single lane live.

The slug expands to four components, and they are not comparable:

    C-05-app                64 files
    C-10-docs-watcher        3
    C-16-shared-primitives   3
    C-11-design-tokens       0   (also carries app-board — the C-11 seam)

**So `app-shell` is C-05, and C-05 is mostly a test directory:**

    C-05 total          64 files
    under app/test/**   49   (77%)
    everything else     15

The shell itself — `App.tsx`, `main.tsx`, `components/shell/**`,
`lib.rs`, `main.rs` and the build plumbing — is **fifteen files**.

## Why routing them to one new slug would NOT fix it

The obvious move is to give `app/test/**` its own slug. **It moves the
queue rather than shortening it**: nearly every card writes an app test,
so they would all serialise on the test slug instead of on the shell.

## What the test names say

Grouped by the subject each filename declares:

| subject | files |
|---|---|
| map / architecture | **18** |
| interview / genesis | **10** |
| shell (genuinely) | 16 |
| docs-watcher | 3 |
| board | 3 |
| agent | 1 |

**Thirty-three of forty-nine belong to something other than the shell.**
A map card and an interview card collide today for no reason except that
both write into one umbrella.

## The evidence that this is a real defect and not tidiness

**`T-137` could not fix the assertions its own merge broke.** Its fence
was `[lib-parser, app-map, tools/e2e]`; the three dogfood assertions its
regen moved live in `app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — **files about the architecture
map, owned by the shell.** The lane was honestly green at its own tip and
the integrator had to reconcile them at the checkpoint.

**A test that cannot be edited by the card that owns its subject is
mis-filed.**

## What to change, and what NOT to

Route each `app/test/**` file to the component it exercises, by editing
component `paths:` in the registry. **No file moves on disk** — this is
the same shape as T-033's extraction, which the dogfood suite already
records as precedent.

**Do NOT split C-05's fifteen real files.** They are a coherent shell and
splitting them buys nothing.

## Three things that will bite

1. **Every rollup assertion moves.** The dogfood suite asserts exact
   per-component file counts and a full relation table. Expect a larger
   reconciliation than `T-141`'s fourteen. **That is the card's real
   cost, and it is why this is an M.**
2. **A misrouted file becomes `ambiguous` (two globs match) or reopens
   the D2 (`unmapped`).** `arch drift` currently reports
   `unmapped=0 ambiguous=0` and it must still say that at the end. Run it
   after every registry edit, not once at the end.
3. **New edges.** A test moving into C-12 may make C-12 depend on
   something it did not declare. The T-141 precedent applies: **measure
   the arrangements rather than arguing them**, and prefer the owner that
   adds no edge.

## The measurement that says whether it worked

Before: **20 of 34 planned cards touch `app-shell`.** Re-derive that
number after. Per `T-142`, confirm the count can move before trusting it
to have moved — the same query on the pre-change tree must still say 20.

## Implementation notes

Executor `claude-opus-5`, lane `task/T-149-lane` at
`/Users/ujju/Projects/nputer-T-149`, base `23ee41b`, implementation
commit `bf09a57`. Every figure below re-derived at this lane's own ref.

### What was done

The catch-all `app/test/**` under C-05 is gone. Each of the **49**
indexed files under `app/test/` is claimed by an exact path in the
`paths:` of the component whose code it exercises. **No file moved on
disk** and **C-05's fifteen real files were not split.**

    C-05  64 -> 31    C-08  10 -> 12    C-09  3 -> 6    C-10  3 -> 7
    C-12  18 -> 34    C-13   8 -> 15    C-14  8 -> 9

16 + 2 + 3 + 4 + 16 + 7 + 1 = 49, and 33 of them changed owner.

`ls app/test/` returns **51** entries; the card's 49 is the INDEXED
count and it is right — one entry is the `fixtures/` directory and one
is `graph-budget-bench.mjs`, and `.mjs` is not in `Lang::for_extension`.

### Judgement call 1 — where each file goes. The keyword sweep was wrong about four of them, and one of those is the interesting one.

Every file was opened, and every file's OUTGOING EDGES were read off
`graph.json` — what a test imports is the fact a filename only hints at.
The card's sweep against what the bodies say:

    subject           card's sweep     measured
    map / architecture      18             16
    interview / genesis     10              7   (+5 that stay with C-05)
    shell                   16             16   (a different sixteen)
    docs-watcher             3              4
    board                    3              5
    agent                    1              1

**`map-shell-dom.test.tsx` is the sharpest miss and it goes the way the
name does not.** Its name says map; its subject is
`components/shell/PaneRail.tsx` — *"the rail renders only when a project
is open, board | map are its only items"* — so it is C-05's, and a sweep
on `map-*` would have routed the pane switcher into the map pane.
**`shell-harness.test.ts` is the same error mirrored**: its name says
shell, and `window.__nputerShellHarness` is installed by
`app/src/lib/watcher-store.ts`, which is C-10's. Both were decided by
opening the file, not by the prefix.

### Judgement call 2 — the two-subject tests, and the rule that decided all thirteen

**A test that mounts `App.tsx` or a `components/shell/**` component
STAYS with C-05.** Not by taste: C-05 declares C-08, C-10, C-12, C-13
and C-14, so routing such a test to the component it otherwise exercises
writes an edge from that component BACK to the shell — a **cycle**,
under @human's *the registry holds no cycles* ruling, in exchange for a
mount point. Thirteen files are held by this rule alone:
`accelerators`, `board-truth`, `crescendo-dom`, `cross-file-rows`,
`genesis-entry`, `genesis-mount`, `genesis-pane-boundary`,
`genesis-switch-truth`, `map-shell-dom`, `project-shell`, `shell-frame`,
`startup-screen`, `watcher-truth`. The other three C-05 files are the
test program's own plumbing (`node-builtins.d.ts`,
`node-builtins-write.d.ts`) and `window-manifest.test.ts`, whose subject
is `tauri.conf.json`.

**`board-truth.test.tsx` is the worked example of "leaving one in the
shell is a legitimate answer".** It imports `Board.tsx` and its title is
*"the board tells the whole truth"*, so C-08 looks right — and C-08 has
no declared dependency on C-05 today, so the move would open a
`C-08 -> C-05` D1 beside a declared `C-05 -> C-08`. It stays.

### Judgement call 3 — how far to go. Everything routable was routed, and here is what "routable" cost.

All 49 were routed rather than only the map group, because the marginal
cost after the first component was one line each and the reconciliation
was the same three bodies either way. **What was NOT taken is a
different thing and it is the card's own success measurement** — see
below and `T-149-s2`.

### THE ARRANGEMENTS, MEASURED (the T-141 precedent, and the card's third bite)

A per-file simulation over `graph.json` scored every candidate owner by
the component edges it would create, run **before the registry was
touched**; `arch` then reproduced its every file count and every
observed count exactly. The chosen routing:

    component edge rows        37 before   37 after     0 new, 0 lost
    observed counts moved      15 of 37 rows
    relations changed           1  (C-05 -> C-09, confirmed 3 -> planned 0)
    arch drift                 findings=4 undeclared=2 unmapped=0
                               ambiguous=0 dangling=0  — byte-identical
                               to the base's own summary line

**ZERO new edges was achievable because every routed test already
imported only components its new owner declares.** The three that looked
like they might not: `detail-presentation` reads C-16's `verdicts.ts`
(C-09 declares C-16), `architecture-store` reads C-10's `docs-model.ts`
(C-12 declares C-10), and the four `interview-*`/`crescendo` files read
C-14's `agent-store.ts` (C-13 declares C-14).

The one relation that moves is residue and is left standing
deliberately — filed as **`T-149-s1`**, with T-012's own precedent for
dropping it and the reason this card did not.

### A NEGATED CATCH-ALL WAS MEASURED AND REJECTED, AND IT WOULD HAVE MOVED THE QUEUE BY ZERO

Keeping `app/test/**` in C-05 and subtracting the routed files with `!`
lines is the cheaper edit, and both matchers support it. **The fence is
a different layer from the matcher.** `normalizeFenceToken` turns
`app/test/**` into the domain `app/test` and does not interpret a
leading `!` at all. Driven through the built parser before any edit:

    compareFences(app-shell, app-map)
      -> overlapping, witness app/test/map-layout.test.ts

A negated umbrella leaves every routed test still reserved by
`app-shell`. **And a filename wildcard is worse**: `app/test/map-*`
normalises to the domain `app/test/map-`, a prefix matching no path, so
two fences that really collide come back **`disjoint`** — `T-111-s3`'s
"no overlap" meaning "I do not know". Only exact literals work. The
whole argument, and the cost (a new `app/test/` file is `unmapped` until
routed), is written into `docs/architecture/components/C-05-app.md`
where the next editor of that list will read it.

### THE MEASUREMENT: THE CARD'S OWN NUMBER DOES NOT MOVE, AND CANNOT MOVE FROM INSIDE THIS FENCE

    base 23ee41b                        planned 34   touching app-shell 20
    lane bf09a57                        planned 34   touching app-shell 20
    base + one planted card             planned 34   touching app-shell 19

Row 3 is `T-142`'s positive control — one card's `touches:` flipped in a
detached scratch worktree, restored with an empty per-path diff and a
matching sha256. **The query works; the answer is 20 because "a planned
card touches `app-shell`" is a census over the STRING in a card's
`touches:`, and no `paths:` edit can move a token a card already typed.**
Twenty cards must be re-fenced for it to move, and `docs/tasks` is in
`UNFENCEABLE_PATHS` — no card may hold it. Routed as **`T-149-s2`**,
which carries the twenty ids and the two cautions.

**WHAT DOES MOVE, and it is the same 59% by the honest route** — derived
through `slugPathIndex` + `expandFence`, the dispatcher's own code:

    app/test files each SLUG reserves     base        lane
      app-shell                          49 of 49    20 of 49
      app-map                             0           16
      app-interview                       0            7
      app-board                           0            5
      app-agent                           0            1

**Twenty-nine of the forty-nine left the `app-shell` fence.** The 20 that
remain are C-05's 16 plus C-10's 4 — C-10 carries `touch_slugs:
[app-shell]` too, so routing a watcher test is a TRUTH repair and not a
throughput one, which is worth knowing before anyone reads C-10's
3 -> 7 as progress on the ceiling.

### Reconciliation — THREE assertions, not "more than T-141's fourteen"

The card and the brief both predicted a larger reconciliation than
T-141's. **It was three failing bodies in one file**, and after the
first was fixed the next appeared, which is the vitest ordering trap
this file's own comments have warned about since T-028. All in
`app/test/architecture-dogfood.test.ts`: the per-component count table
(7 rows), the C-12 file list (+16 entries), the relation table
(15 rows + the tally + both `it` titles) and the package.path seam
(3 lists + one `observedCount`, 14 -> 1).

**`app/test/map-dogfood-render.test.tsx` DID NOT MOVE**, and that is
derived rather than lucky: it asserts rendered node and edge COUNTS, and
this change moves neither — 13 components and 37 edges before and after.
**`lib/parser/test/smoke.test.ts` did not move either**: it pins the
exact component ID array, and no id changed. Both are the CONVENTIONS
three-fixture gotcha answering correctly.

Every figure was derived from `arch` and from `graph.json`, never copied
out of the failure output.

### POISON DRILL — 10 mutants, 10 reds, 10 restorations proved

Run in a **detached scratch worktree** at `bf09a57`
(`/Users/ujju/Projects/nputer-t149-drill`, 39-character root, per
`T-133-s5`), with its own installs; no cargo was compiled there, so the
`CARGO_TARGET_DIR` hazard does not arise. **One side only: the mutant is
always the REGISTRY (the producer); no assertion literal was touched.**
Each mutation was read back with `git diff` before the suite ran.

    M1  C-12 loses map-zoom.test.ts            exit 1   4 of 10 red
    M2  C-08 loses select-board.test.ts        exit 1   5 of 10 red
    M3  C-09 loses select-task-detail.test.ts  exit 1   5 of 10 red
    M4  C-10 loses shell-harness.test.ts       exit 1   4 of 10 red
    M5  C-13 loses interview-model.test.ts     exit 1   4 of 10 red
    M6  C-14 loses agent-store.test.ts         exit 1   4 of 10 red
    M7  C-05 regains the app/test/** catch-all exit 1   8 of 10 red
    M8  C-05 loses shell-frame.test.tsx        exit 1   4 of 10 red
    M9  C-09 loses detail-presentation.test.ts exit 1   4 of 10 red
    M10 C-09's three tests moved back to C-05  exit 1   3 of 10 red

Baseline in the same worktree before any mutant: **10 of 10, exit 0.**
**M7 is the ambiguity control** — it is the only mutant that reds *"no
file-level ambiguity: the umbrella really is non-overlapping"*, which is
what proves the `ambiguous=0` claim is load-bearing rather than
vacuous. **M10 is the relation control** — moving C-09's three tests
back to C-05 is what restores `C-05 -> C-09` to `confirmed` and reds the
`25 / 2 / 10` tally specifically. Restoration proved after every mutant
by an empty per-path `git diff` **and** a sha256 matching
`git show HEAD:<path>`.

### Commands, in the order run, exits read from `$?` unpiped

    lib/parser  npm ci                                    0
    lib/parser  npm run build                             0
    app         npm install                               0
    tools/e2e   npm ci                                    0
    app         npm run build                             0
    app/src-tauri  cargo build -p nputer-index            0
    arch drift --root .            (BASE, pre-edit)       0   findings=4 unmapped=0 ambiguous=0
    arch drift --root .            (after each edit)      0   final: findings=4 unmapped=0 ambiguous=0
    arch --root .                                         0   components=13 files=189 mapped=189 edges=37
    arch cycles --root ../..                              1   cycle C-08 -> C-09 -> C-08 (the DESIGNED state, unmoved)
    app         npm test                                  0   1013/1013 across 47 files
    lib/parser  npx vitest run                            0   314/314 across 15 files
    lib/parser  npx tsc --noEmit                          0
    tools/e2e   npm run typecheck                         0
    app/src-tauri  cargo test                             0   518 passed / 0 failed / 4 ignored over 18 result lines
    tools/e2e   NPUTER_E2E_PORT=15981 npm test            0   206 passed (2.4m)
    tools/e2e   npm run lint:tokens -- --selftest         0
    tools/e2e   npm run lint:tokens                       0   TOKEN 141 / CONTROL 802
    tools/e2e   npm run lint:docs                         0
    app/src-tauri  index --check --root ../..             1   STALE — see T-149-s3, it is exit 1 at the BASE too
    docs-gate.mjs on the merge's own 8 paths              1   7 paths, 4 suites — all four run and all four green

**AND ALL FOUR OWED SUITES WERE RUN A SECOND TIME AFTER THESE NOTES AND
THE THREE `s`-CARDS WERE WRITTEN**, because a `docs/tasks/*.md` write is
itself a code input (the DOCS GATE's whole subject) and the first pass
was measured before them: `cargo test` **518 / 0 / 4, exit 0** over 18
result lines and 18 `running` headers · `npm test` from `app/`
**1013/1013, exit 0** · `npx vitest run` from `lib/parser/`
**314/314, exit 0** · `npm test` from `tools/e2e/` **206 passed, exit
0** on port **15982**, `lsof`-read at zero rows at 2026-08-27 00:46:44
EEST · `lint:docs` **0** · `lint:tokens` **0** at **TOKEN 141 /
CONTROL 805** — 802 before the three new cards were staged, and 805
after, which is the positive control on that figure. `arch drift` **0**,
unmoved.

**AND A THIRD PASS AT THE COMMITTED TIP `6e5ad00`**, which is what every
number in this card is stated at: `cargo test` **518 / 0 / 4, exit 0**
over 18 result lines, with all four watched bodies read BY NAME and `ok`
(`startup_arm_watches_the_initial_root`,
`a_hostile_session_id_in_the_init_line...`,
`agent::kit::tests::snapshot_version_matches_the_live_method_stamps`,
`a_mod_declaration_is_an_edge_in_this_repositorys_own_graph`) ·
`npm test` from `app/` **1013/1013 across 47 files, exit 0** ·
`npx vitest run` from `lib/parser/` **314/314 across 15 files, exit 0** ·
`npm test` from `tools/e2e/` **206 passed, exit 0** on port **15983**
(`lsof` zero rows at 2026-08-27 00:50:53 EEST), header `Running 206
tests using 1 worker` cross-checked against **206** `✓` bodies ·
`arch drift` **0** at `findings=4 undeclared=2 unmapped=0
declared_only=2 ambiguous=0 dangling=0` · `arch` at `components=13
files=189 mapped=189 unmapped=0 edges=37` · `arch cycles` **1**, the
designed `C-08 -> C-09 -> C-08` and nothing new. The merge's diff at
this tip is **12 paths** (merge-tree exit 0, tree `878a93b`): BOOT GATE
matches **0 of 12**, GRAPH REGEN **1 of 12**, DOCS GATE **11 of 12** at
exit 1 naming the same four suites.

**PASSES TWO AND THREE ARE IDENTICAL ACROSS EXACTLY ONE CARD-BODY EDIT,
WHICH IS THE CONTROL THAT MAKES THIS PARAGRAPH SAFE TO WRITE**: adding
prose to a live `docs/tasks/T-*.md` moves no assertion in any of the
four suites, so the commit that carries this paragraph cannot have
invalidated the figures in it. What a `docs/tasks` write CAN move is the
frontmatter half — `lint:docs` is **exit 0** here, and the board counts
moved by the three new `suggested` cards, which nothing in these four
suites pins by value.

Port **15981** was `lsof -nP -iTCP:15981 -sTCP:LISTEN`-read at **zero
rows** at 2026-08-27 00:34:40 EEST on Mac.lan immediately before
binding. 1420 was never probed and never touched.

### Standing gates, derived from the merge's own diff

The range rule's executor form: `TREE=$(git merge-tree --write-tree
92a9181 HEAD)` — **exit 0**, tree `5794f6a` — then
`git diff --name-only 92a9181 "$TREE"` -> **8 paths**. (The forbidden
pre-merge two-dot form returns 9 and three dots returns 8; the two-dot
extra is main's own newer work coming back in reverse, the T-083 trap at
its smallest yet.)

- **GRAPH REGEN — FIRES**, on 1 of the 8 paths
  (`app/test/architecture-dogfood.test.ts`, a `.ts` outside `docs/`).
  **ASKED, NEVER PREDICTED**: `index --check --root ../..` is **exit 1,
  a REAL stale** (both count lines printed, `files +0 -0 ~2`). **It is
  exit 1 at the untouched base too** — proved on a clean detached
  checkout of `23ee41b`, where `map-dogfood-render.test.tsx` drifts
  766 -> 770 in a file this lane never opened. Inherited, filed as
  `T-149-s3`. The regen belongs to the CHECKPOINT and `graph.json` is
  outside this fence, so it was not run and not committed here.
- **BOOT GATE — NOT OWED**, derived: **0 of 8** paths are under
  `app/src-tauri/**`, `app/src/**`, `app/package.json` or
  `app/src-tauri/Cargo.toml`. `app/test/` is none of those. No `tauri
  dev` was spawned and no port was taken for one.
- **DOCS GATE — FIRES**, exit **1** on **7 of 8** paths, naming **four**
  suites: `cargo test from app/src-tauri/`, `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`. **All
  four were run and all four are green** (518/0/4 · 1013/1013 ·
  206/206 · 314/314). Invoked directly from the repository root with the
  one documented spelling, never through `xargs`, exit read unpiped.

### Where the card and the brief were wrong

1. **"Every rollup assertion moves. Expect more than T-141's fourteen."**
   It was **three failing bodies** in one file. The prediction reads the
   NUMBER OF EDITED LITERALS (about 42 here) as the number of failures;
   vitest stops a body at its first failed assertion, so a table of 37
   rows is one failure.
2. **"If you can get most of the drop by moving the 18 map tests
   alone."** There is no drop to get: the count is a census over card
   text (see above and `T-149-s2`). The brief's own instruction — *run
   it on the base tree and confirm it still says 20* — is what
   demonstrates this, and it is the same shape as `T-142`'s subject:
   a query that runs clean and answers a different question than the one
   asked.
3. **The card's group table is off in four places** — 18/10/16/3/3/1
   against a measured 16/7/16/4/5/1. The card names it a keyword sweep,
   so this is the sweep behaving as advertised, not an error; it is
   recorded because two of the four (`map-shell-dom`, `shell-harness`)
   move in the OPPOSITE direction to their names.
4. **The brief's `arch drift` command omits `--root`.** It works from
   the repository root and nowhere else, and CONVENTIONS calls that flag
   load-bearing on exactly this family of commands.
5. **`ls app/test/ | wc -l` is 51, not 49.** Both numbers are right
   about different things; the card's 49 is the indexed count.

### Noticed and NOT done

- The dogfood titles still say *"all 185 files map"* and
  *"26 confirmed, 2 undeclared, 9 planned"* was accurate; the tree has
  been 189 files since T-137. The 185 was already false at the base, so
  it is left standing rather than repaired inside a routing card. Not
  filed separately: it is one stale digit in a title, and the body's own
  ledger carries the correct history.
- The `unmapped` bucket is now the only thing that notices a NEW
  `app/test/` file, and it is a REPORTER (`arch drift` exits 0 without
  `--fail-on`). That is `T-141-s1`'s open subject — the drift census has
  no ratchet where the cycle census has one — so no duplicate was filed.
