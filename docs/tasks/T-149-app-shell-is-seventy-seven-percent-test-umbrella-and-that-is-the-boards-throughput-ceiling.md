---
id: T-149
title: app-shell is 77% a test umbrella, 20 of 34 planned cards touch it, and two thirds of those tests belong to something other than the shell
feature: F-06
milestone: 4
priority: 1
size: M
status: done
blocked_by: []
touches: [docs/architecture/components/, app-shell, app-map]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5
verified_by: claude-opus-5
review: same-model
---

Absorbs: T-033-s5 (Amnesty triage 2026-08-29 (triage seat)) — arm (b) — split app/test/** in C-05's paths: so test files follow the component they exercise — is exactly what this card built, and it is no longer true that every app test lives under app-shell: detail-presentation.test.ts is C-09's, map-view-dom.test.tsx is C-12's, genesis-pane-dom.test.tsx is C-13's. Arms (a) and (c) are moot with (b) taken.

Absorbs: T-031-s4 (Amnesty triage 2026-08-29 (triage seat)) — this card retired the rule the finding is about. C-05's paths: no longer carries the app/test/** catch-all — sixteen shell-exercising files are named one by one and the other thirty-three went to the components they exercise, so the registry no longer claims a directory thirteen lanes were editing without the slug.

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

## Verification — **APPROVED**

Verifier `claude-opus-5` @ session `1240c3f2`, 2026-08-27 01:25 EEST.
Target `task/T-149-lane` tip **`d437f5a`**; base **`23ee41b`** (which IS
`git merge-base d85d946 d437f5a`, checked); main **`d85d946`**.
`git merge-tree --write-tree d85d946 d437f5a` is **exit 0**, tree
`40f6150`, and the merge's diff is **12 paths**.

**THE BOUNDED READ WAS HONOURED AND HERE IS THE ARTEFACT.** The attack
set was written to
`…/scratchpad/T-149-attack-set.md` at **2026-08-27 01:01:25 EEST**
(`2026-08-26T22:01:25Z`), BEFORE `git diff`, before the implementation
notes and before any commit on this branch. Read to that point: the
verification brief, `method/roles/verifier.md`, this card **at
`23ee41b`** via `git show`, and `STATE`/`CONVENTIONS`/`ARCHITECTURE`.
**`docs/ROADMAP.md` was not read**, per the role file. The file records
two predictions made before looking; **P1 was right and is reported
below** (the card's subject table does not sum to its own total).

**ENVIRONMENT.** Two DETACHED scratch worktrees OUTSIDE the repository,
one at `d437f5a` and one at `23ee41b`, both cut at **101-character**
roots (`T-133-s5`'s bracket is 116–128, so both sit below it), each with
its own `CARGO_TARGET_DIR` at `<worktree>/target` — **no lane's warm
target was written and no lane's worktree was entered**. Both are removed
at the end of this verdict. No `pkill`, no `git update-ref`, no
force-push, no history rewriting; every commit named its paths. 1420 was
never probed, never bound, never connected.

### The routing was re-derived from scratch, not checked against the lane's table

I wrote my own registry parser and glob matcher over `graph.json` and the
component frontmatter and rebuilt the ownership map and the component
edge table without the lane's TS engine or the Rust reader. **It
reproduces `arch` exactly** at both refs — every file count, every
relation, every observed count, `unmapped=0`, `ambiguous=0`. That
agreement is the licence for everything below.

    at 23ee41b   C-05 64   C-08 10   C-09 3   C-10 3   C-12 18   C-13 8   C-14 8
    at d437f5a   C-05 31   C-08 12   C-09 6   C-10 7   C-12 34   C-13 15  C-14 9

**49 indexed files under `app/test/`, all C-05's at the base; at the tip
16 / 2 / 3 / 4 / 16 / 7 / 1 = 49, every one matched by exactly one glob.**
Then the SUBJECT of each file was derived from its own outgoing edges in
`graph.json` rather than from its name. **Every routed file's new owner
declares every component that file reaches.** The two inversions the
brief named are both confirmed by import, not by prefix:
`map-shell-dom.test.tsx` imports `App.tsx` **and
`components/shell/PaneRail.tsx`** and is correctly C-05's;
`shell-harness.test.ts` reaches **C-10 and nothing else** and is
correctly C-10's.

### "37 rows before, 37 after — zero new, zero lost" — REPRODUCED, and the counts checked too

    grep '^edge ' | awk '{print $2,$3,$4}' | sort   at both refs -> diff EMPTY
    row count            37 -> 37
    relation tally       26/2/9  ->  25/2/10
    rows whose relation or count moved                          15

**A surviving row is not a surviving edge, so the fifteen were compared
value by value** — and all fifteen match the literals in the reconciled
dogfood table exactly. `arch drift` at the two refs is **byte-identical
apart from the root path**: `findings=4 undeclared=2 unmapped=0
declared_only=2 ambiguous=0 dangling=0`. `arch cycles` is exit **1**
with `C-08 -> C-09 -> C-08`, `components=13 declared_edges=35`,
**identical at both refs** — the designed state, unmoved.

### The thirteen "by rule not taste" — the RULE was tested, not its application

Three ways, none of them taking the lane's word:

1. **Membership.** Exactly **thirteen** `app/test` files carry a direct
   import edge to `App.tsx` or `components/shell/**`, and they are
   exactly the thirteen the notes name.
2. **The rule is real.** Re-routing each of the thirteen to its natural
   owner, one at a time, over `graph.json`: **all thirteen produce a NEW
   component row pointing back at C-05, and all thirteen close a cycle**
   against an already-declared `C-05 -> X`. Run again with the
   name-natural target instead of the import-dominant one
   (`genesis-* -> C-13`, `map-shell-dom -> C-12`, `board-truth -> C-08`):
   same result, thirteen for thirteen.
3. **The inverse, which is the attack that matters.** Swept every
   `app/test` file for an import of `App.tsx` or `components/shell/**`
   and checked its owner: **no file that mounts the shell was routed
   away. The rule is applied without exception.**

The other three C-05 entries are correctly *not* held by that rule and
the notes say so: two `.d.ts` files with no edges at all, and
`window-manifest.test.ts`, which reaches **no component** — I confirmed
it is routable anywhere with no new row, so it stays with C-05 on
subject (`tauri.conf.json`) rather than on the cycle rule.

### The negated catch-all and the wildcard — both CONFIRMED, and the wildcard is worse than the card says

**Negation.** Modelled the alternative on a copy of the base registry —
`app/test/**` kept in C-05 with `'!app/test/map-layout.test.ts'` added,
the file claimed positively by C-12 — and drove the built parser:

    compareFences(app-shell, app-map)
      -> overlapping, witness app/test/map-layout.test.ts

**Reproduced verbatim.** `normalizeFenceToken` strips only a trailing
star run (`/(?:\/)?\*+$/`), so the negation survives in the slug's path
set as an inert literal while the `app/test` directory domain stands.
The lane's conclusion — a negated umbrella moves the queue by zero — is
correct.

**Wildcard: TRUE, and it is a live false green.** `app/test/map-*`
normalises to `app/test/map-`, and `sharedDomain` compares by path
SEGMENT, so it matches nothing — not even `app/test/map-layout.test.ts`.
Modelled it in the registry and measured both layers over the same tree:

    fence   compareFences(app-shell, app-map)  ->  disjoint   (no witness)
    matcher arch drift                         ->  ambiguous=1

**The two layers disagree about the same file**, and the fence reports
`disjoint` with **no issue and not `unusable`** — while a NON-trailing
star run *is* refused, with a message that describes this exact failure
(*"comparing the rest as a literal prefix would answer confidently and
wrongly"*). The guard rejects the shape that cannot slip through and
passes the shape that can. **This is bigger than this card, it is
pre-existing, and this card's design is what avoids it** — swept all
**97** `paths:` entries at the tip: zero non-trailing wildcards, zero
negations, zero quotes or escapes, zero `..`. Filed as **`T-149-s4`**;
it is not this diff's defect and is not grounds to reject it.

### `C-05 -> C-09` left standing — RULED, and the reasoning is corrected

**Leaving it is right, and the card's own stated reason is the weaker
half of the argument.** Two corrections to the record first, both
measured:

- **By `integrator.md` rule 3's parent test the residue is this card's
  own**, not inherited: at `23ee41b` the row is `confirmed observed=3`
  and a legitimate declaration; it becomes residue *because of this
  change*. "The charter is `paths:`" does not by itself answer that, and
  the card's fence **does** reach `docs/architecture/components/C-05-app.md`.
- **`T-149-s1`'s title says "T-012's own precedent says drop it", and
  that precedent's decisive half is absent here.** C-12's own file
  records the T-033 drop: the row was residue **and** keeping it "would
  have left `C-05 <-> C-12` standing under @human's *the registry holds
  no cycles* rule". `C-09` does not declare `C-05`, so **nothing forces
  the drop here**. What transfers is the weaker sentence — *"dropping it
  costs nothing and asserts something true"*.

It still stands, for the reason the lane reached and under-argued:
`depends_on` is a claim about **intent**, and intent is not derivable
from `graph.json`. A routing card that silently edits a declaration is
bundling a judgement with a reconciliation, and the governing authority
for `depends_on` is @human's no-cycles ruling rather than an observed
count. The disclosure is exemplary — the filed card carries the cost
(37 rows -> 36, `25/2/10` -> `25/2/9`, `declared_deps` 11 -> 10, no drift
finding moves) **and the discriminating test that stops the next reader
dropping `C-05 -> C-11` and `C-05 -> C-01` with it** (both `non_code:
true`, so nothing there can ever be observed). Every one of those
figures I re-derived and every one is right. **The one real cost is that
the map pane draws `planned` as INTENT** — C-12's own file says so — so
until `s1` is taken the shipped map shows one arrow that is residue.

### The card's success measurement — CORRECTLY SCOPED, and the architect wrote it wrong

    query: a planned card whose `touches:` contains the string `app-shell`
      23ee41b  planned 34   touching 20
      d437f5a  planned 34   touching 20
      d85d946  planned 34   touching 20
      23ee41b + one planted `touches:` flip (T-022 -> [app-board])   19

**The T-142 control fires**, so the query is capable of a different
answer and the 20 is a fact about the cards. `docs/tasks` is in
`UNFENCEABLE_PATHS` (`lib/parser/src/fence.ts`, a frozen list of one), so
**no card may hold those twenty files — not this card, and not any
re-fencing of it.** The measurement was unsatisfiable from inside any
fence at the moment it was written. **The card is correctly scoped with a
follow-up, not under-delivered**, and `T-149-s2` carries the twenty ids —
which I re-derived and which match the card's list exactly.

**AND THE HONEST READING OF WHAT DID AND DID NOT MOVE.** Driven through
`slugPathIndex` + `expandFence` at both refs:

    app/test files each SLUG reserves     23ee41b     d437f5a
      app-shell                          49 of 49    20 of 49
      app-map                             0          16
      app-interview                       0           7
      app-board                           0           5
      app-agent                           0           1

**Twenty-nine of forty-nine left the `app-shell` fence** — a map card can
now be fenced `[app-map]` and still reserve the sixteen test files it
writes, which it could not do at the base. But the count of PLANNED cards
that overlap a live `[app-shell]` lane is **21 at both refs** (the 20
plus `T-112` through the C-11 seam), because those cards still type the
token. **This card buys a capability today and a board movement only
after `T-149-s2`.** That is worth saying plainly and the lane says it.

### POISON DRILL — 7 mutants, 7 reds, restoration proved twice over

Run in the detached scratch worktree at `d437f5a` with its own
`CARGO_TARGET_DIR`, no cargo compiled during the drill, **one side only —
every mutant is the REGISTRY (the producer); no assertion literal was
touched**, and every mutation was read back with `git diff` before the
suite ran. Baseline in the same worktree: **101/101, exit 0** over
`architecture-dogfood` + `map-dogfood-render` + `select-board`.

    M1  C-12 loses architecture-dogfood.test.ts        exit 1   6 red
    M2  C-05 regains the `app/test/**` catch-all       exit 1   9 red   <- ambiguity control
    M3  C-10 loses watcher-store.test.ts               exit 1   6 red
    M4  C-13 loses interview-resume-dom.test.tsx       exit 1   6 red
    M5  map-shell-dom.test.tsx MOVED C-05 -> C-12      exit 1   6 red   <- routing control
    M6  C-08 loses select-board.test.ts                exit 1   7 red   <- package-seam control
    M7  C-09's three tests moved BACK to C-05          exit 1   3 red   <- relation control

**M5 is the one worth reading.** Routing the file its NAME argues for
takes the independent derivation to **`EDGE ROWS 38`** with a new
`C-12 -> C-05 undeclared observed=2`. The 37-row property is not
decoration — it is exactly what that one routing decision buys. **M7**
restores `C-05 -> C-09 confirmed observed=3`, which is what proves that
row's move is caused by those three files and nothing else. Restoration
proved after every mutant by an empty `git diff` over
`docs/architecture/components`, and once more at the end by **sha256
against `git show HEAD:<path>` on all seven registry files — seven OK,
zero mismatches**, with `git status` clean.

### One probe the lane did not run: the disclosed cost is LOUDER than the registry says

The C-05 note says a new `app/test/` file lands in the D2 bucket, "the
map correctly reporting unclaimed territory". Measured, by planting one:

- **Before a regen** the dogfood suite is **10/10, exit 0** — the file is
  not in the committed graph, so nothing sees it. `index --check` catches
  it at once: STALE, `files +1 -0 ~2`, naming it.
- **After the regen** the suite is **exit 1, 3 bodies red** —
  `['C-05','C-10','unmapped']` against `['C-05','C-10']`, and
  `D2:unmapped` appears in the findings table.

So the cost arrives as a **red `npm test` from `app/` at the CHECKPOINT**,
not as a silent drift line — GRAPH REGEN fires on the new `.ts`, the
checkpoint regenerates, and the suite names it. That is a better
guarantee than the note claims, and the probe was restored (sha256 match
on `graph.json`, `git status` clean).

### Gates — every exit read from `$?` UNPIPED, and the COUNT read as well as the exit

**At the commit under review, `d437f5a`,** in the scratch worktree
(fresh `npm ci` in `lib/parser` and `tools/e2e`, `npm install` in `app/`,
parser build BEFORE app build, cold `CARGO_TARGET_DIR`):

- **cargo test — 518 passed / 0 failed / 4 ignored, exit 0**, summed over
  **18** `test result:` lines; **18** `running N tests` headers sum to
  **522 = 518 + 4**, which reconciles exactly. All four watched bodies
  read BY NAME and `ok`: `startup_arm_watches_the_initial_root`,
  `a_hostile_session_id_in_the_init_line…`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`,
  `a_mod_declaration_is_an_edge_in_this_repositorys_own_graph`;
  `self_graph_is_current` read as `ignored`. **The cache cliff is not in
  play** — the lib suite is **4.04s** against `T-088-s4`'s 9.5s floor,
  target dir 2.6 GB.
- **app — `npm run build` exit 0, `npm test` 1013/1013 across 47 files,
  exit 0.**
- **parser — `npm run build` exit 0, `npx vitest run` 314/314 across 15
  files, exit 0, `npx tsc --noEmit` exit 0.**
- **tools/e2e — 206 passed, exit 0**, on port **15987**, `lsof -nP
  -iTCP:15987 -sTCP:LISTEN` read at **zero rows** at 2026-08-27 01:19:35
  EEST immediately before binding; header `Running 206 tests using 1
  worker` cross-checked against **206** `✓` bodies. `npm run typecheck`
  exit 0. **The only `brief.spec` disclosure names `T-150 tools/e2e
  against T-133 tools/e2e` and is not this lane's**; `T-149` and `T-150`
  compare **`disjoint`** at both refs, and T-149's fence still reserves
  the one `app/test` file it edits.
- **`npm run lint:docs` exit 0** · **`npm run lint:tokens` exit 0** at
  **TOKEN 141 / CONTROL 805**, `-- --selftest` exit 0.
- **`index --check --root` — exit 1 at `d437f5a`, exit 1 at the untouched
  base `23ee41b`, exit 0 on main `d85d946`.** It is a REAL stale by
  CONVENTIONS' own discriminator (both count lines printed, a `~` file
  diff), not the `--root` false red. **`T-149-s3` reproduces verbatim,
  including `map-dogfood-render.test.tsx` drifting 766 -> 770 in a file
  this lane never opened.** The regen belongs to the checkpoint and
  `graph.json` is outside this fence.
- **FORWARD CHECK the notes do not make:** I regenerated the graph at the
  tip to see what the checkpoint will get. **1 020 023 bytes, 189 files,
  2152 symbols, 2111 edges — byte-identical to the committed graph**, and
  `arch drift` still `findings=4 unmapped=0 ambiguous=0` with 37 rows
  over it. The regen the merge owes is safe and costs no budget (98.1%,
  19 977 left). Restored afterwards.
- **The merge's own gates, derived from the 12 paths:** BOOT GATE **0 of
  12** (nothing under `app/src-tauri/**`, `app/src/**` or either
  manifest — `app/test/` is none of those). GRAPH REGEN **1 of 12**.
  DOCS GATE **exit 1 on 11 of 12**, naming **four** suites — `cargo test
  from app/src-tauri/`, `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — **all four run above, all four
  green.** Invoked from the repository root with the one documented
  spelling, never through `xargs`.

### Security sweep — mandatory, and clean

No new dependency, no manifest or lockfile in the diff, no new endpoint,
no new input path, no secret or key, no unsafe default. The one input
surface this card touches is the registry's `paths:` vocabulary, and it
was swept for the shape that matters here: **`registry.rs` strips quotes
without processing YAML escapes where `@nputer/parser` processes them
(`T-014-s6`), so an escaped or quoted glob makes both engines exit 0 and
disagree about ownership.** All **97** `paths:` entries at the tip:
**zero** escapes, quotes, negations, non-trailing wildcards or `..`.

**AND THE COMMENT BLOCKS CARRY THEIR OWN POSITIVE CONTROL, which is worth
recording because it could have gone the other way.** The lane added
**39** `#` comment lines INSIDE `paths:` blocks, and the C-05 block's
text contains the literal string ``app/test/**`` twice. **An engine that
read comments as list items would have re-created the catch-all and made
every routed file ambiguous.** Both engines report the list items only —
TS `ComponentRecord.paths` = 33/10/6/7/18/8/5 against the raw list-item
counts 33/10/6/7/18/8/5, `0` parse issues, and the Rust reader's file
counts match my independent matcher on all thirteen components. No
divergence.

### Adjacent breakage — checked, and one thing is left standing

`map-dogfood-render.test.tsx` and `lib/parser/test/smoke.test.ts` did not
need to move, and that is derived rather than lucky: the rendered node
and edge counts are **13 components and 37 edges at both refs**, and no
component id changed. The CONVENTIONS three-fixture gotcha (`T-024-s5`)
answers correctly. No file moved on disk — `git diff --name-status -M`
over the range has no `R` row. **C-05's fifteen real files are intact and
unsplit**: `App.tsx`, `main.tsx`, all three `components/shell/**`,
`lib.rs`, `main.rs`, `build.rs`, `acl_pin.rs`, `churn.rs`,
`index_cmd.rs`, `graph_budget_bench.rs`, `vite-env.d.ts`,
`vite.config.ts`, `vitest.config.ts`.

What is left standing is **prose that this card falsified**: a sentence
this diff retires in the dogfood comment survives in
`docs/architecture/components/C-14-agent-runner.md` (*"the same rule that
puts `app/test/**` under C-05"*), in `app/test/select-board.test.ts`
(*"`app/test/**` IS C-05's `app-shell`"*), and twice in
`docs/ARCHITECTURE.md`. Filed as **`T-149-s5`**; the first two are inside
reachable fences, the third is not. Nothing reds for any of them.

### Every place a figure disagreed with my own measurement

**IN THE CARD.**

1. **The subject table does not sum to its own total, and this is the
   prediction I wrote down before opening the diff.** `18 + 10 + 16 + 3 +
   3 + 1 = 51`, against the card's own **49** under `app/test/**` two
   sections up; non-shell by that table is **35**, against the card's own
   sentence *"Thirty-three of forty-nine"*. **The sentence is right (33
   of 49, measured) and the table it sits under is not.** The lane
   corrects the table's four row counts and does not notice that it never
   summed. Measured: **16 / 7 / 16 / 4 / 5 / 1 = 49**.
2. *"Expect a larger reconciliation than `T-141`'s fourteen."* It was
   **three failing bodies in one file**. The lane's diagnosis is right —
   a 37-row table is one failure, not 37.
3. The success measurement expected 20 to move. It cannot, from any
   fence. Ruled above.

**IN THE NOTES.** I re-derived every figure in them and **found no wrong
number.** All seven file counts, `16+2+3+4+16+7+1=49`, 33 changed owner,
`ls app/test/` = 51 with two non-indexed entries, 37/37 rows, 15 moved
counts, the `25/2/10` tally, `findings=4 unmapped=0 ambiguous=0
dangling=0`, thirteen held by the mount rule, the five-slug reservation
table, the negated-fence witness line, `TOKEN 141 / CONTROL 805`, DOCS
GATE 11 of 12 naming four suites, merge-tree exit 0 at 12 paths, BOOT
GATE 0, GRAPH REGEN 1, and all four suite counts — every one reproduces
at `d437f5a`. Three imprecisions, none of them a wrong value:

4. **`T-149-s1` says "MEASURED AT `bf09a57`, THIS LANE'S TIP".**
   `bf09a57` is the implementation commit; the tip is `d437f5a`, two
   commits later. The figure is still true — I re-derived it at the tip —
   but the sentence names the wrong ref for what it calls the tip. This
   is the verifier role's own FIGURE CASE arriving one seat early.
5. **The C-05 registry note says a negated entry leaves "inert junk
   domains".** True of `slugPathIndex` (I measured the slug's path set
   growing by one inert literal) — but the same spelling in a card's
   `touches:` is flagged `unresolved` with an `invalid-field` issue and
   marked `unusable`. Right conclusion, mechanism stated one layer
   shallow.
6. **The C-05 note understates its own disclosed cost** — see the probe
   above. It reads as report-only; it is a red `npm test` at the
   checkpoint.

**IN THE BRIEF.** Every claim confirmed: the 33-file routing, the sweep
wrong in four places, both name/subject inversions, the 37/37 property,
the `C-05 -> C-09` move with all three edges being test edges, the
wildcard false green ("*if true that is a bigger finding than this
card*" — it is true), `index --check` exit 1 at the base and fixed on
main at `d85d946`. One refinement: the routing judgement covers **49**
files, not 33 — the 16 that stay are decisions too, and `M5` shows one of
them is load-bearing on the headline property.

**AND ONE THING `T-149-s3` NO LONGER ASKS FOR.** Its remedy is already
applied: main regenerated `graph.json` at `d85d946` (`loc` 2249 -> 2266
and 766 -> 770, **stats and byte count unchanged at 1 020 023 — exactly
the trap STATE names**), and `index --check` is exit 0 there. Its FIRST
check is discharged; its **second** — *did the checkpoint that last
touched those two bodies skip its regen, or run it before the
reconciliation* — is not, and is the half worth keeping. Triage should
close the first half rather than dispatch the card whole.

### Findings filed (not blocking, per role step 6)

- **`T-149-s4`** — `fence.ts` answers `disjoint` for a token whose star
  run sits inside a filename, with no issue and no `unusable`, while the
  derivation matcher reports `ambiguous=1` over the same registry.
  Reproduced both ways. `[lib-parser]`.
- **`T-149-s5`** — three surviving present-tense statements that
  `app/test/**` is C-05's, plus the dogfood title still saying *"all 185
  files"* where the tree has been 189 since T-137.
  `[docs/architecture/components/, app-board, app-map, docs/ARCHITECTURE.md]`.

### Re-run at MY OWN tip, because a verdict is prose and prose is a code input

This verdict and the two findings are commits under `docs/tasks/`, which
the DOCS GATE names as a code input to four suites, so they are re-run at
the tip THIS verdict creates rather than at the commit I was sent, and
the figures are appended below in a second commit. **The regress
terminates there and the reason is measured, not assumed**: that second
commit adds only prose to a live `docs/tasks/T-*.md`, and the only half
of a `docs/tasks` write that can move any of those four suites is the
FRONTMATTER — which `lint:docs` answers in one second and which is re-run
at that tip too.

**VERDICT: APPROVED.** The charter — route each of the 49 indexed
`app/test/` files to the component it exercises by editing `paths:`, move
nothing on disk, split none of C-05's fifteen — is delivered completely
and correctly, at `unmapped=0 ambiguous=0`, with the 37-row property
holding and every gate green. The two judgement calls I was asked to rule
on both stand: the residue is right to leave (for a reason the card
states weakly and I have corrected in place), and the success measurement
is correctly scoped with a follow-up rather than under-delivered.

### The gates AT THE TIP THIS VERDICT CREATED — `4b985be`

**A verdict is measured at a commit that no longer exists, so these are
the numbers at MY OWN tip and not at the one I was sent.** Same detached
scratch worktree, moved to `4b985be`, `git status` clean; the sibling
verifier's Playwright run was polled to completion before a single
command took CPU, so nothing here shares a machine with a suite it could
have timed out.

- **cargo test — 518 / 0 / 4, exit 0**, 18 `test result:` lines, 18
  `running` headers summing to **522**, all four watched bodies read by
  name and `ok`.
- **app — `npm run build` 0, `npm test` 1013/1013 across 47 files, exit 0.**
- **parser — `npm run build` 0, 314/314 across 15 files, exit 0, `tsc
  --noEmit` 0.**
- **tools/e2e — 206 passed, exit 0**, port **15988**, `lsof` **zero rows**
  at 2026-08-27 01:32:37 EEST, header `Running 206 tests using 1 worker`
  cross-checked against **206** `✓` bodies. `npm run typecheck` 0.
  The one `brief` disclosure is still `T-150 tools/e2e against T-133
  tools/e2e` and is still not this lane's.
- **`lint:docs` 0** — *"every live task card's frontmatter parses, with a
  legal status"*, which is the only half of a `docs/tasks` write that can
  reach those four suites, and the reason the regress stops here.
- **`lint:tokens` 0 at TOKEN 141 / CONTROL 807.** **CONTROL moved 805 ->
  807 and that is this block's positive control**: two tracked files
  arrived — `T-149-s4` and `T-149-s5` — so the figure is answering about
  the tree this verdict actually made, not the one it was handed. A
  CONTROL count that had NOT moved would have meant the lint was reading
  a tree without my commit in it.

**Nothing in this verdict's own commits moved an assertion** — the four
suites return the same counts at `4b985be` as at `d437f5a`, which is what
makes the APPROVED above safe to have written before they ran.

**AND ONE FIGURE IN THIS VERIFICATION'S OWN COMMIT MESSAGE IS WRONG,
CORRECTED HERE RATHER THAN AMENDED AWAY.** `d86eb5d`'s message says the
pre-commit parse ran *"over 320 cards"*. It was **318** — measured, at
that tree, immediately before the commit: 316 at `d437f5a` plus the two
cards this verdict filed. The issue count it quotes (**0**) and the
`lint:docs` exit (**0**) are both right. Recorded because this verdict
spends a section on other people's figures and the same rule binds it:
**a commit message is not a code input, so nothing will ever red for
this — which is exactly why it has to be written down instead of fixed
by rewriting the commit that carries it.**

### MAIN MOVED UNDER THIS VERIFICATION, AND THE FORECAST WAS RE-DERIVED RATHER THAN INHERITED

`main` read **`d85d946`** when this verification started and **`1ab0587`**
when it finished — `T-150`'s merge landed in between, ten paths
(`tools/e2e/scripts/brief.mjs`, `card-figures.mjs`,
`card-figures.spec.ts` and seven `T-150*` cards). **Re-derived against
the new main at 2026-08-27 01:40 EEST:** `git merge-tree --write-tree
1ab0587 bc299ad` is **exit 0**, tree `236249f`, and the merge's diff is
still **14 paths** — the same 12 the lane produced plus this verdict's
two findings. **`comm`-free proof by inspection: T-150's ten paths and
T-149's fourteen share none.** No conflict, no re-fence, nothing to
re-rule.

**AND THE ONE FIGURE IN THIS VERDICT THAT A MOVING MAIN COULD HAVE
FALSIFIED WAS RE-MEASURED**, because the `T-149-s3` ruling above rests on
it. `index --check --root .` on main **at `1ab0587`** is **exit 0,
CURRENT** — 1 020 023 bytes, 189 files, 2152 symbols, 2111 edges, read
from `$?` on an unpiped command in a second invocation because
`${PIPESTATUS[0]}` is EMPTY in zsh. Run with main's own prebuilt
`nputer-index` (built 2026-08-26 18:55, later than the indexer crate's
last source commit `b4fa434` 17:18), **read-only — no `cargo`, so
nothing was written to main's `target/`.** So `T-149-s3`'s first half is
discharged at today's main as well as at `d85d946`, and the ruling
stands. Recorded because a sibling card filed tonight asserts the
opposite for its own ref; **whichever ref that one was measured at, this
one is `1ab0587` and it is exit 0.**

**One untracked `z` and one modified `T-150` card sit in the main
checkout. Neither is this verification's**, both were left alone, and
nothing in this verification wrote to `/Users/ujju/Projects/nputer`,
`/Users/ujju/Projects/nputer-app`, `/Users/ujju/Projects/arch-verify` or
`/Users/ujju/Projects/nputer-T-150`. Both scratch worktrees are removed
and `git worktree prune` has run.
