---
id: T-013
title: Semantic zoom T1/T2 + overlays
feature: F-06
milestone: 4
priority: 6
size: M
status: verifying
blocked_by: [T-012]
touches: [app-map, app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-013
verified_by:
review:
---

## Acceptance criteria
- WHEN a component is expanded THE node SHALL become a container
  showing its files grouped by directory with intra-component edges
  and stub edges to collapsed neighbors, without moving unexpanded
  siblings more than necessary (the T1 rule of T-012's seven-rule
  layout: the container grows down within its own column and pushes
  only that column; siblings do not move).
- WHEN a file is selected THE panel SHALL list its symbols and their
  resolved edges (T2 in-panel; no canvas symbols in v1).
- THE churn overlay SHALL join the overlay control T-012 ships
  (status · provenance · drift), rendered per the design's
  map-behavior screen (3px bottom bar, width = share of the busiest
  component, raw count at the mark slot, hottest one step darker,
  declared-only shows —, never amber), with the legend following;
  churn derives from shelling out to git (ADR-013/§0.0-6) and IF the
  project is not a git repo THEN the churn overlay SHALL be disabled,
  not broken.
- IF an expanded component's files exceed the render budget THEN the
  container SHALL paginate or group deeper (defined degraded state),
  never freeze the canvas.

## Implementation notes

Built by `claude-opus-5 @T-013` on `task/T-013-semantic-zoom`, cut from
the `Checkpoint:` commit **`2036fb2`**. **Sixteen code paths plus this
card and six findings.** Every figure below is derived at this branch's
own tip; nothing is quoted from a checkpoint.

### The fence is wrong, and the card widened it rather than hide the diff

**`touches:` reads `[app-map, app-shell]` in this branch and was
dispatched `[app-map]`.** The third criterion needs a `git` subprocess;
the webview cannot spawn one (no `@types/node`, ADR-017/T-073), so it
needs a Tauri command, and registering one edits
`app/src-tauri/src/lib.rs` — **C-05's declared path, slug `app-shell`**.
There is no in-fence route: riding `index_repo` instead needs
`watcher-store.ts` (C-10, also `app-shell`) for the TS mirror. `T-012`,
the card this one is `blocked_by`, added exactly one command and
declared `[app-map, app-shell]` for it. **`T-013-s1` carries the whole
costing, including the part that matters to a dispatcher**: T-013 was
dispatched as disjoint from the live `T-064` (`[app-shell]`) and is not.
Measured across both branches, the overlap is a SLUG overlap and not a
FILE overlap — zero shared paths, T-064 in `docs_watch.rs`/`App.tsx`/
`watcher-store.ts` and this lane in `lib.rs` — so the merge is clean
today **by luck rather than by fence**.

### The git surface, which is the security half of this card

`app/src-tauri/src/churn.rs` (+520) is new, and `lib.rs` gains three
lines: `pub mod churn;`, the `repo_churn` command, one handler entry.
**The IPC census moves 13 → 14 at both ends** and that is the only
census that moves. It is **ADR-012 APPLIED, not reopened** — zero
arguments, typed outcome, and **no new grant**, because app commands are
un-gated by the ACL, which is the whole point of that decision. The
precedent for adding commands without an ADR is T-029's four
(9 → 13); the reasoning is recorded on `repo_churn` itself so a reader
meets it where the command is.

Four properties hold **by construction** and each is pinned by a test in
`churn.rs`:

1. **Every argv element is a compile-time literal**, carried by the type
   (`&'static str`). `no_project_path_ever_reaches_argv` asserts `-C` is
   absent and no element is a path: the project root reaches git as the
   child's **working directory** and nowhere else.
   `every_argv_element_is_a_compile_time_literal_and_none_of_them_is_a_shell`
   sweeps for shell metacharacters and **carries its own positive
   control** (a hostile string the same predicate must flag), because a
   negative assertion without one cannot tell refusal from absence.
2. **Never a shell.** `Command::new("git")` with an argv array; no
   `sh -c` anywhere, no string concatenated into a command line.
3. **Nothing git says reaches the webview.** `ChurnOutcome` has no
   message field — the disabled arm is a CLOSED five-word enum, so
   "an error string on the canvas" is **unreachable rather than
   filtered**, and `nothing_git_says_can_reach_the_serialized_outcome`
   asserts the serialized JSON carries neither `message` nor `fatal`.
   Detail goes to the app's **stderr** through `sanitize_for_log`, which
   is T-063's stream choice reused.
4. **A non-repo degrades.** Five typed reasons, one fixed UI sentence
   each: `noProject`, `gitUnavailable`, `notAGitRepo`, `noHistory`,
   `gitFailed` (plus the two only the TS side can give — `notTauri`,
   `unreadable`).

Three more decisions worth a verifier's eye. **`--relative` is
containment, not tidiness**: a project folder opened INSIDE a larger
repository is told only about paths under itself, prefix stripped
(`a_folder_inside_a_repository_is_told_only_about_itself`).
**`-c core.fsmonitor=`** is on the command line because a repository can
point that config at a program git will RUN, and reading a stranger's
repo must not run their code. **Nine `GIT_*` variables are removed from
the child's environment** — the ones that move git's idea of WHICH
repository it is reading, or hand it a program to execute. The
environment is otherwise inherited, deliberately: `env_clear` would
strip `PATH` and git could not resolve its own helpers, so this is the
narrowest clearing that still works, and it is a smaller claim than
C-14's `env_clear` + allowlist.

**THE PROBE DISCRIMINATES FOUR CASES WITH ONE INVOCATION**, measured on
git 2.50.1 rather than remembered: `git rev-parse --is-inside-work-tree
HEAD` prints `true`/`false` first and only then fails on a repo with no
commits, so exit code plus the first stdout line separates work-tree +
history (0/`true`), work-tree with no commits (128/`true`), bare
(0/`false`) and not-a-repo (128/empty). A freshly `git init`ed genesis
folder is the ordinary case and gets `noHistory`, not `notAGitRepo`.

### The output parser, and the byte that had to be measured

`parse_churn` is pure over bytes, so it is drilled without a git.
`git log -z` does **not** quote paths, so a filename containing a
newline arrives raw — and the blank line git puts between a commit
header and its diff survives as a **single `\n` glued to the front of
that commit's first path entry**, and only when the commit has paths at
all. That byte is structural and is stripped from **exactly one entry
per commit**. A blanket strip would LAUNDER `"\nevil.txt"` into
`"evil.txt"`; stripping only the structural byte leaves the newline in
place for `is_safe_repo_relative` to refuse. Both halves are planted in
`a_path_with_a_newline_is_refused_and_counted_never_laundered`, and
`M14` is the mutant that turns the exact strip into a blanket one.

Every refusal is **counted** into `rejected` and surfaced in the legend
— control bytes, an absolute or escaping path, invalid UTF-8, a
timestamp that is not a number. A commit whose marker will not parse
still COUNTS as a commit (it happened); only its recency is unknown, and
that is reported rather than invented.

### T1 — the container, and why it is one node wide

`layoutMap` gains a third parameter: `expanded`, an id → container-height
map. `assignYs` STACKS each column instead of multiplying a constant
slot, so an expanded node's extra height lands entirely on the rows
below it **in its own column**. Two properties are structural rather
than careful: a node's y depends only on the rows ABOVE it in its own
column, and with `expanded` empty the stack reduces to
`SLOT_TOP + row * SLOT_H` — T-012's formula, byte-identical.

Measured in the DOM on a fixture with four rows in one column and one in
another: expanding C-02 (152 px, extra 86) leaves `C-01` at `0px|40px`
and `C-04` at `216px|40px` **byte-identical as strings**, moves `C-03`
340 → 426 and `C-05` 490 → 576, and collapsing restores the whole
position map to `toEqual` the original. The gutter under the container is
the same `SLOT_H - NODE_H` = 84 a collapsed node gets, asserted directly.

**THE CONTAINER IS `NODE_W` WIDE AND THE BUNDLE DREW IT THREE COLUMNS
WIDE.** The criterion (T-012's amendment (a), which rewrote this
criterion) says "within its own column"; the bundle's T1 card says
"grows down AND RIGHT" and draws 420 px beside 132 px nodes — ~611 px at
this map's real 192 px node, nearly three of the 216 px pitch. Growing
right by that much moves the siblings the criterion forbids. Width
stays, height moves, the file grid is one column instead of two, names
truncate with a `title`, and the panel keeps the complete list.
**`T-013-s6` asks for the ruling**; this is a recorded deviation, not a
silent one.

**Intra-component edges** are drawn as orthogonal bows in a 12 px left
gutter, aimed at row centres the model computes (`expansion.rows`) —
computed, never measured, because jsdom has no layout and the canvas
must not depend on one. **Stub edges to collapsed neighbours** are the
existing component-level edges: `routeEdge` now reads `src.h`/`dst.h`, so
they attach to the container's border, which is the design's own
sentence. The edge count is unchanged by an expansion, asserted.

**The render budget is a DEFINED state with both arms reachable.** Over
`FILE_BUDGET` (48 rows) the container **groups deeper** — rolls the
directory grouping up one level at a time until the group count fits —
and past `GROUP_BUDGET` (24) it **paginates**, naming what it left out.
The roll-up **floors at one segment**, and that floor is load-bearing:
depth 0 puts every path under `(root)`, so an unfloored loop always
terminates at exactly one group and pagination becomes **unreachable
code**. A defined state that can never happen is not a defined state;
`M5` is the mutant that removes the floor.

### T2 — symbols and resolved edges, in the panel

`MapFilePanel` reuses the T-005 drawer primitive verbatim
(`attachPanelDismissal`, focus-in/restore, 480 px). Rows: visibility in
the left gutter, name, `kind · N refs` on the right; then the file's
resolved edges, imports first, each with the component it resolves to;
then unresolved specifiers. **`heuristic` edges are excluded** (plan §11:
the UI never draws them) — and `refs` counts incoming resolved edges
across the whole graph. Reachable from a container row and from the
component panel's file list, both `data-card-trigger` so the press
re-targets instead of dismissing. **No canvas symbols**, asserted by
looking for a symbol name in the canvas and requiring its absence.

### Churn on the face

`MAP_OVERLAYS` becomes four. The bar is 3 px (`h-0.75`) on the node's
bottom edge inside its `overflow-hidden` box, width = the component's
share of the busiest, floored at 4 % so a sliver is not invisible; the
raw figure sits at the mark slot; the **single** hottest is one step
darker (`bg-secondary-foreground` over `bg-muted-foreground`) and a TIE
names none, because a peak that is not there must not be drawn.
Declared-only shows `—` and no bar; a component that exists and has not
moved reads `0`, which is not the same thing. **Never amber**, asserted
across every state.

**THE DRIFT RING SURVIVES THE CHURN OVERLAY and the bundle's churn
screen draws none.** T-012's ratified amendment (b) makes drift core
rendering in every mode, and a drifting component that looks clean
because you are reading churn is the one thing this pane must not do.
What DOES yield is the SLOT — the criterion's "raw count at the mark
slot" is that slot, so the drift chip steps aside exactly as the mock
draws it. Recorded deviation, pinned by `M12`.

**Disabled, not absent.** T-012 left the segment out because a disabled
one had no designed treatment; this card's criterion asks for the
opposite in as many words, so the segment renders inert with the
`disabled` treatment the pane's own Re-index button already uses and the
one fixed sentence for its reason as its `title`. Absent would hide that
churn exists; disabled says it exists and why it cannot answer here.

**The join is two-step and the ORDER is the modelling decision.** An
indexed path is attributed by `fileComponent` — the derivation's own
§4.1 answer, so churn can never disagree with the file list the same
panel shows, and the synthetic `unmapped` bucket gets its churn for
free. Every other path falls back to `claimsPath` over the declared
globs, because `fileComponent` maps only what the indexer walked (never
Rust, never markdown — THE FOUR WALKS), and a map that reported a Rust
crate as permanently cold would be lying about the busiest component in
this repository. A non-indexed path that no glob matches stays
**unattributed and is reported in the legend**, never folded into the
`unmapped` bucket — widening that bucket would make it the busiest node
on any repository with a docs tree.

**The number is FILE EDITS and every surface says so** — `T-013-s4`
carries why the exact per-component commit count is not derivable from
this payload, and what it would cost. The pane-level commit count in the
legend IS exact.

### For the verifier

- **`T-013-s2` is about the census that guards this card's own
  boundary**, and it was measured twice in one hour: a bare `invoke`
  is invisible to `frontendCommands()`, and the comment written to
  explain that fact was itself read as a call site and reported a
  command named `name`. One end of that body strips comments; the other
  does not.
- **A literal NUL byte reached `map-zoom.ts` during authoring and
  blinded every `grep` on it** — the T-034-s5 mechanism, live, caught by
  reading bytes rather than by any gate. `lint:tokens` P5 is green over
  the whole tree and the branch's own sixteen paths were independently
  read as bytes: **0 carry a NUL**.
- **BOOT GATE was OWED and RUN** (this diff touches `app/src/**` and
  `app/src-tauri/**`), exit 0, both `[nputer]` lines, scratch port
  **14832** bind-probed free on all four stacks. Port 1420 was read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else, before and after:
  holder `node` pid **82549**, one socket, `TCP [::1]:1420 (LISTEN)`,
  identical at both ends.
- **GRAPH REGEN is OWED and is the integrator's** — see the forecast
  below. No regenerated graph is committed.
- **T-087's surface is untouched**: this branch adds **zero** `fs` calls
  and zero node-builtin imports under `app/src` (grepped over the added
  lines). The only new process surfaces are the two in `churn.rs`, both
  argv arrays with no shell — one production (`run_git`), one test
  fixture (`TempRepo::git`).

### Suites, every exit code read from `$?` unpiped

- **parser: 263/263**, `PARSER_EXIT=0`; `npx tsc --noEmit` 0;
  `npm run build` 0 — run FIRST, because the app build dies at TS2307
  without `lib/parser/dist`.
- **app: 906/906 across 46 files**, `APP_TEST_EXIT=0` (840 → 906: +17
  `map-zoom`, +21 `map-churn`, +28 `map-t1-t2-dom`). `npm run build` 0,
  **269 modules** (was 265), `index-C86RloYb.css` **45.06 kB** and
  `index-WORLmrLf.js` **523.98 kB**. Both TypeScript programs typecheck:
  `tsc --noEmit` 0 and `tsc -p tsconfig.test.json --noEmit` 0.
- **bare Rust workspace, `cargo test --no-fail-fast`: 369 passed / 0
  failed / 3 ignored**, `CARGO_TEST_EXIT=0`, summed programmatically
  from **fifteen** `test result:` lines (352 → 369: the 17 in
  `churn.rs`). Not `--all-targets` — **and that matters here**: an
  indented block in `parse_churn`'s doc comment is a rustdoc DOCTEST,
  bare `cargo test` ran it, and it failed to compile. Fenced as `text`;
  `--all-targets` would have skipped it and shipped it.
- **E2E: 121/121**, `E2E_EXIT=0`, scratch port **14831**; `npm run
  typecheck` 0.
- **token lint: selftest 0, lint 0** — `lint-tokens: clean (TOKEN 130
  files under app/src, app/test, tools/e2e; CONTROL 598 tracked text
  files)`, at 49 TOKEN + 4 CONTROL samples, 71 walk-policy checks, 8
  evidence-floor checks. TOKEN 123 → 130 (+7 `.ts`/`.tsx`), CONTROL
  590 → 598 (+7 and `churn.rs`).
- **`cargo audit -n`** exit 0: 472 locked crates, **0 vulnerabilities /
  17 allowed warnings**, unmoved — which a 0-file `Cargo.lock` diff
  requires and this branch has.
- **BOOT GATE** exit 0. **`index --check`** exit 1, the real red shape.

### Security sweep, every figure re-derived at this tip

- **No lockfile, no `Cargo.toml`, no `package.json`, no
  `tauri.conf.json`, no capability file** in the diff — `git diff
  --name-only 2036fb2..HEAD` over all of them returns **0 paths**. No
  dependency added: `churn.rs` uses `std::process` and the `serde` and
  `serde_json` already in the manifest.
- **`app/src-tauri/src/acl_pin.rs` is a 0-file diff**, sha256
  **`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`**.
  `EXPECTED_GRANTS`: declaration line 54, closing `];` line 147, entries
  55–146 = **92**, zero comment or blank, counted four ways over the
  symbol-anchored body (92 quote-bearing lines, 92 quoted strings, 92
  UNIQUE quoted strings, 92 by the strict entry shape). **Name the
  symbol and stop.**
- **`ENV_ALLOWLIST` in `agent/runner.rs`: 16 entries**, declaration at
  line 1000 — a 0-file diff on this branch.
- **Exactly THREE `#[ignore]` attributes**, anchored on
  `^[[:space:]]*#\[ignore` with pathspec `'*.rs'` from the repo root, all
  three carrying `= "reason"` — unmoved.
- **IPC is FOURTEEN at both ends**: 14 anchored `#[tauri::command]` and
  14 `generate_handler!` entries, intersected and equal. **Both census
  traps re-measured and BOTH GOT WORSE, which is worth saying**: the
  unanchored literal reads **15 across the tree** (the fifteenth is a doc
  comment in `agent/mod.rs`), and a naive comma-split of the handler
  block now reads **17**, not the 15 the last checkpoint recorded —
  this card's own comment inside the macro adds two more commas. Strip
  comments, then count; the stripped split reads 14.
- **4337 added lines scanned** for `sk-`/`AKIA`/PEM/bearer/
  `key|secret|password|token` assignment shapes — **0 hits**.

### Ranges, every dot count stated, at their own refs

Derived with `git merge-tree --write-tree`, whose exit code was read from
`$?` and not swallowed by a command substitution. Main tip **`4d2f03c`**,
merge-base **`2036fb2`** (unchanged — main advanced only in `docs/`).

    git merge-tree --write-tree 4d2f03c HEAD   -> tree 6764f736…, exit 0
    git diff --name-only 4d2f03c <TREE>        -> 16   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 4d2f03c...HEAD  (THREE dots) -> 16   cmp against the forecast: exit 0
    git diff --name-only 2036fb2..HEAD   (TWO, branch-only) -> 16
    git diff --name-only 4d2f03c..HEAD   (TWO dots)   -> 58   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..4d2f03c (TWO dots)  -> 42   main's own advance

Main advanced **42** paths from the merge-base, the branch **16**,
`comm -12` over the sorted lists is **EMPTY**, and 42 + 16 = 58 — exactly
the forbidden count, which is the arithmetic that proves the two sets
disjoint. **The figures above were measured at `237af84`; the tip this
card is handed off at is later, and the RIGHT-hand endpoint is what goes
stale** (T-081's lesson, twice recorded) — re-derive at the verdict's own
ref rather than quoting these.

### Gate derivations

| gate | owed? | derivation |
|---|---|---|
| GRAPH REGEN | **FIRES** | 14 of the 16 paths are `*.ts/*.tsx` outside `docs/` |
| BOOT GATE | **FIRES** | 2 under `app/src-tauri/**`, 9 under `app/src/**` |
| DOCS GATE | **FIRES** | the card and six findings are flat `docs/tasks/T-*.md` |

### GRAPH REGEN — the forecast, MEASURED and then restored

`index --check --root ../..` from `app/src-tauri` exits **1** with the
real red shape (both count lines and a `~` diff):
**585305 → 639904 bytes, 119 → 126 files, 1018 → 1111 symbols,
1539 → 1687 edges**, `files +7 -0 ~7`.

**THE THREE-FIXTURE RULE FIRES, and the reconciliation was measured
rather than forecast.** The graph was regenerated in this worktree, the
two dogfood suites were run against it, and the graph was then restored
**per-path** by byte copy from `git show HEAD:…` (T-072-s1 — never
`git checkout --`), proved by an empty per-path `git diff` and sha256
back to **`b5d1cf2c7beb99d3b0b4974b3b21b87a95163c62bfb011ad5ec7974ade56f038`**.
**Nothing regenerated is committed.** What the integrator will owe:

- `app/test/architecture-dogfood.test.ts`, body *"all 119 files map"*:
  `fileComponent.size` **119 → 126**, and the per-component array
  **`C-05` 56 → 59** (the three new `app/test/**` bodies) and **`C-12`
  14 → 18** (the four new files under `app/src/architecture/**` and
  `app/src/lib/architecture/**`). Derived with the registry's own globs
  and **validated by a positive control** — the same matcher reproduces
  the pinned array exactly against the COMMITTED graph.
- `app/test/architecture-dogfood.test.ts`, body *"THE FINDINGS"*: the
  `C-05 → C-06` D1 gains three `fileEdges` (the new test bodies import
  `@nputer/parser`).
- `app/test/architecture-dogfood.test.ts`, body *"the full relation
  table"*: three `observedCount` values move — **10 → 13, 22 → 32,
  6 → 7**.
- `app/test/map-dogfood-render.test.tsx`, body *"the header hint"*:
  `committed graph · 119 files` → `126 files`.
- **THE PARSER PIN HOLDS**: no component file moves, so
  `lib/parser/test/smoke.test.ts`'s id array is untouched.
- **`map-dogfood-render`'s 32 / 10 HOLD**, and that is derived rather
  than hoped: a row is created only by a component PAIR that had none,
  and every new edge lands on an existing pair (C-12→C-12, C-05→C-12,
  C-12→C-05 via `lib/utils.ts`, C-05→C-06). Both were confirmed green
  against the regenerated graph before it was restored.

That is **four assertions across three bodies in two files**, which is
the T-077 shape; vitest surfaces them one at a time, so reconcile from
this list rather than from the first red.

### The poison drill — 22 mutants, all one-sided, all producer-side

Correspondence established before anything was mutated: the drill ran in
a **detached scratch worktree at a named commit** (`237af84`, then
`7fbad85`), so the drilled artifact is the branch's artifact by
construction and this worktree stayed clean throughout. Every mutation
moved a PRODUCER — a layout function, a budget, a parser, a visual
table, a containment rule, an argv flag — and never an assertion or a
literal the two share. Every mutated TEXT was **read back with `git
diff` before the suite ran**, and every restore was a byte copy from the
drill commit proved twice (empty per-path diff **and** sha256 back).
**22 planted, 22 red** — after the one survivor below was closed.

| # | producer mutated | suite | exit | red |
|---|---|---|---|---|
| M1 | row heights become GLOBAL across columns (the grid mistake) | app | 1 | 1 |
| M2 | the expanded slot stops growing — the container overlaps below | app | 1 | 3 |
| M3 | the between-group gap leaves the height arithmetic | app | 1 | 4 |
| M4 | the render budget never fires | app | 1 | 4 |
| M5 | the roll-up floor removed — pagination unreachable | app | 1 | 1 |
| M6 | the intra-edge filter drops one end | app | 1 | 1 |
| M7 | T2 counts HEURISTIC edges | app | 1 | 1 |
| M8 | churn loses the declared-glob fallback | app | 1 | 2 |
| M9 | a TIE names a hottest anyway | app | 1 | 1 |
| M10 | the payload accepts a count that is not a whole number | app | 1 | 1 |
| M11 | churn ink turns AMBER | app | 1 | 2 |
| M12 | the drift ring dropped in the churn overlay | app | 1 | 1 |
| M13 | the churn segment enabled while git cannot answer | app | 1 | 3 |
| M14 | RUST: the structural newline becomes a BLANKET strip | cargo | 101 | 1 |
| M15 | RUST: containment stops refusing control bytes | cargo | 101 | 3 |
| M16 | RUST: an unparseable timestamp is silently zero | cargo | 101 | 1 |
| M17 | RUST: the work-tree probe stops discriminating | cargo | 101 | 1 |
| M18 | RUST: `--relative` leaves the log argv | cargo | 101 | 2 |
| M19 | the fourteenth command leaves the handler list | app | 1 | 1 |
| M20 | centring goes back to half a COLLAPSED node | app | 1 | 1 |
| M21 | the panel stops saying WHY churn is off | app | 1 | 1 |
| M22 | churn leaves the overlay vocabulary | app | 1 | 8 |

**M1 IS THE MUTANT THE BRIEF ASKED FOR, and it is the natural mistake
rather than a strawman**: computing each ROW's height as the max across
columns is how a grid layout would be written, it reduces to T-012's
layout exactly when nothing is expanded, and it passes the "grows down"
body. It is killed by *"EXPANDING A DIFFERENT COLUMN LEAVES THIS ONE
ALONE"* — the pin that expands C-04 in column 1 and requires column 0
byte-identical. Without that body the sibling-column rule has no
assertion at all: the obvious test (expand and check the other column)
survives it, because the fixture's other column has no row below the
expanded one.

**M7 SURVIVED THE FIRST RUN, AND IT WAS MY OWN VACUOUS ASSERTION.**
Making `isResolved` return `true` unconditionally left `map-zoom` and
`map-t1-t2-dom` **green at 45 of 45**. The body
*"counts only RESOLVED references — a heuristic edge is not evidence"*
asserted `refs === 0`, and the heuristic edge in the fixture named
`s:src/b/three.ts#x` on a file the fixture declared with `symbols: []`
— so `parseGraph`'s referential-integrity check DROPPED the edge and
there was no heuristic to count. Refusal was indistinguishable from
absence, which is the exact shape CONVENTIONS' *"a negative assertion
needs a positive control"* names. Closed in `7fbad85`: the symbol is
declared, and the body now proves the heuristic edge **reached the
graph** before asserting it is not counted. M7 then reds 1 of 45.

### What reached the human's running app

**Nothing.** All work is in `../nputer-T-013`; the main checkout was
never written to, and `git status` there was clean at both ends. Port
1420 was read with `lsof` only — holder `node` pid 82549, one socket,
`TCP [::1]:1420 (LISTEN)`, identical before and after. The boot check
opened and closed its own window on **14832**. The two scratch worktrees
this card created (a baseline build at `2036fb2` for the stylesheet
diff, and the drill worktree) are removed, their symlinked
`node_modules`/`dist`/`target` unlinked rather than deleted, and both
targets verified intact afterwards. No `pkill` at any point; the
`nputer-T-060` `fake_agent` orphans are untouched. **Every scratch file
this session wrote is prefixed `T013-`.**

**THE STYLESHEET HASH MOVED, AND IT WAS MEANT TO.** `index-CwYF5FQb.css`
(43.95 kB) → `index-C86RloYb.css` (45.06 kB). The baseline was rebuilt in
a detached worktree at `2036fb2` — reproducing `CwYF5FQb` byte for byte
— and the two emitted selector sets diffed: **20 added, 0 removed**, and
every one of the twenty is a utility this card deliberately wrote
(`bg-map-group`, `bg-secondary-foreground`, `opacity-45`,
`cursor-not-allowed`, `odd:bg-sidebar`, `rounded-xl`, `w-5.5`, `w-8`,
`px-1.25`, `bottom-1.5`, `right-2`, `underline`, `decoration-hairline`,
`gap-x-1.5`, `gap-y-0.75`, `bg-background/60`, `hover:bg-background`,
`border-map-node-border-selected`, `bottom-0`). **No accidental
utility was minted**, which is the check the Tailwind content-scan
gotcha asks for. **Zero new tokens**: every ink resolves to a
`tokens.css` property that already existed.

### Findings

`T-013-s1` (the fence a git subprocess cannot fit in — **read this
first**) · `T-013-s2` (the IPC census reads comments and misses untyped
invokes) · `T-013-s3` (the churn subprocess has no wall-clock bound;
weigh with `T-043-s3`) · `T-013-s4` (the figure is file edits, not
commits) · `T-013-s5` (churn is measured once per mount and shows no
age) · `T-013-s6` (the container's width, and the two sentences that
disagree about it).

## Verdicts
