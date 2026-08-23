---
id: T-013
title: Semantic zoom T1/T2 + overlays
feature: F-06
milestone: 4
priority: 6
size: M
status: verifying
blocked_by: [T-012]
touches: [app-map, app-shell, app-agent]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-013
verified_by: claude-opus-5 @T-013-verify
review: same-model
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
the `Checkpoint:` commit **`2036fb2`**. **Sixteen code
paths plus this card and seven findings — TWENTY-FOUR in all.** Every
figure below is derived at this branch's own tip; nothing is quoted from
a checkpoint.

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

`app/src-tauri/src/churn.rs` (a new file — **792 lines / +792
insertions** at the verdict tip `c7528cc`; F5-corrected from a `+520`
that reproduced under no metric — the F1 fix in the second-verdict
section below grows it to **1118**) is new, and `lib.rs` gains three
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
opposite in as many words, so the segment renders inert with a
smallest-reasonable inert treatment DESIGNED here
(`cursor-not-allowed opacity-45`) and the one fixed sentence for its
reason as its `title`. **NOT reused from the Re-index button, and the
first draft's claim that it was is false (F3-corrected):** Re-index is
the shadcn `Button` primitive at `disabled:pointer-events-none
disabled:opacity-50`, while this is a raw segmented-control `<button>`
that cannot inherit those without becoming a Button and fighting the
control's styling — both utilities are new to the sheet, so nothing in
this pane wore either before. Absent would hide that churn exists;
disabled says it exists and why it cannot answer here.

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
  failed / 3 ignored**, `CARGO_TEST_EXIT=0` (twice — see `T-013-s7` for
  the run in between, which was 336/33 for a reason that was not the
  tree), summed programmatically
  from **fifteen** `test result:` lines (352 → 369: the 17 in
  `churn.rs`). Not `--all-targets` — **and that matters here**: an
  indented block in `parse_churn`'s doc comment is a rustdoc DOCTEST,
  bare `cargo test` ran it, and it failed to compile. Fenced as `text`;
  `--all-targets` would have skipped it and shipped it.
- **E2E: 121/121**, `E2E_EXIT=0`, scratch port **14831**; `npm run
  typecheck` 0.
- **token lint: selftest 0, lint 0** — `lint-tokens: clean (TOKEN 130
  files under app/src, app/test, tools/e2e; CONTROL 605 tracked text
  files)`, at 49 TOKEN + 4 CONTROL samples, 71 walk-policy checks, 8
  evidence-floor checks. TOKEN 123 → 130 (+7 `.ts`/`.tsx`), CONTROL
  590 → 605 (+7 `.ts`/`.tsx`, `churn.rs`, and the seven finding files;
  590 + 7 + 1 + 7 = 605, which is the arithmetic rather than the print) —
  and this is also the repo's only NUL-byte gate, green over the whole
  tree after one reached `map-zoom.ts` during authoring.
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
- **Every added line in the branch's diff scanned** for
  `sk-`/`AKIA`/PEM/bearer/`key|secret|password|token` assignment shapes
  — **0 hits**. (The line count is deliberately not transcribed here: it
  moves with every edit to this card, which is the same right-hand-drift
  the ranges section below is about.)

### Ranges, every dot count stated, at their own refs

Derived with `git merge-tree --write-tree`, whose exit code was read from
`$?` and not swallowed by a command substitution. Main tip **`4d2f03c`**,
merge-base **`2036fb2`** (unchanged — main advanced only in `docs/`).

    git merge-tree --write-tree 4d2f03c HEAD   -> tree 69fe20ce…, exit 0
    git diff --name-only 4d2f03c <TREE>               -> 24   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 4d2f03c...HEAD  (THREE dots) -> 24   cmp against the forecast: exit 0
    git diff --name-only 2036fb2..HEAD   (TWO, branch-only) -> 24
    git diff --name-only 4d2f03c..HEAD   (TWO dots)   -> 66   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..4d2f03c (TWO dots)  -> 42   main's own advance

Main advanced **42** paths from the merge-base, the branch **24**,
`comm -12` over the sorted lists is **EMPTY**, and 42 + 24 = 66 — exactly
the forbidden count, which is the arithmetic that proves the two sets
disjoint.
**RE-DERIVE AT THE VERDICT'S OWN REF rather than quoting these**: it is
the RIGHT-hand endpoint that goes stale, twice recorded on this board
(T-081's checkpoint, then T-084's), and **this section has now been
wrong twice on its own card** — it said 16 while the findings were being
written and 23 while `T-013-s7` was — which is the mechanism, seen from
the inside, rather than a warning copied from somebody else's
checkpoint.

### Gate derivations, off the prescribed list

| gate | paths matching its trigger | owed? |
|---|---|---|
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside `docs/`) | **14** of 24 | FIRES |
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **11** of 24 | FIRES |
| DOCS GATE (a `docs/` path a code suite reads) | **8** of 24 | FIRES |

**DOCS GATE — RUN, on this branch's own prescribed path list, fed as
`$(cat <list>)` and NOT through `xargs`** (BSD `xargs` maps a utility
exit of 1–125 to 123, so the gate's four-code contract survives a pipe
only by accident). Exit **1**, owing **three** suites — `npm test from
app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/` —
the proportional answer CONVENTIONS describes for a flat task card, and
NOT the cargo suite. It reports **11 derived docs readers across 4
suites** and **0 frontmatter issues in the live tree**, so every live
card's `status:` is in the parser's vocabulary. **All three owed suites
were re-run AFTER the doc edits** — app 906/906, parser 263/263, e2e
121/121 — and not only before them.

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

That is **four failing bodies across two files** (three in
`architecture-dogfood.test.ts`, one in `map-dogfood-render.test.tsx`;
F5-corrected from "three bodies" — the bullet list above enumerates four,
and the first of them carries two distinct edits), which is the T-077
shape; vitest surfaces them one at a time, so reconcile from this list
rather than from the first red.

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

**THE DRILL'S OWN COST, MEASURED, because the standing advice creates
it.** The drill worktree symlinked the lane's `app/src-tauri/target` to
avoid a cold build. Several Rust bodies resolve this repository from
`env!("CARGO_MANIFEST_DIR")`, which is baked in at COMPILE time and which
cargo does not track as an input — so the binaries the drill compiled,
carrying the DRILL's path, were reused by the lane afterwards. With the
drill worktree deleted, bare `cargo test` went **336 passed / 33 failed
/ 3 ignored, exit 101**, every failure naming a directory that no longer
exists. `cargo clean -p nputer -p nputer-index` (12 704 files, 3.0 GiB)
and a rebuild returned it to **369 / 0 / 3, exit 0**. Nothing was ever
wrong with the tree. Filed as **`T-013-s7`** with three arms, because
"drill in a detached scratch worktree" is standing advice and this is
its first recorded cost — and because the pollution can also run the
OTHER way, making a mutant look dead against a stale binary.

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
— and the two emitted selector sets diffed: **19 DISTINCT selectors added
/ 20 rule OCCURRENCES** (`.bg-background/60` emits twice), **0 removed**
on both metrics (F5-corrected — the bare "20 added" stated neither
metric, and the parenthetical below lists exactly the nineteen), and
every one of them is a utility this card deliberately wrote
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
disagree about it) · **`T-013-s7`** (a drill worktree that shares the
cargo target directory leaves the parent RED — measured here at 336/33,
and it is a hazard the POISON DRILL bullet's own advice creates).

### Second executor pass — F1–F5 of the rejection below, resolved

A FRESH executor took this over at the verdict tip `c7528cc`; nothing in
the original build was rebuilt. Every figure here is derived at MY
handoff, and where the original notes were wrong the correction is in
place with its ref (F5) rather than a rewrite.

**F1 (BLOCKING) — the opened project can no longer supply the `git` that
runs.** The hole was `run_git`'s `Command::new("git")` + `current_dir
(root)` with an inherited PATH: the child `chdir`ed into the project and
only THEN resolved a bare name, so a relative/empty PATH element resolved
`<project>/git`. Closed by matching T-060's ratified standard at this
door too, reusing it rather than reimplementing it (T-057):

- **`git` is RESOLVED to a trusted absolute path before any spawn.**
  `resolve_git` runs the SHARED name-checked login shell (`runner::
  login_shell`, made `pub`) as `$SHELL -l -c "command -v git && echo
  NPUTER_GIT_PATH=$PATH"` — in the app's own cwd, never the project — and
  puts every candidate through the SHARED shape gate, which is now
  `runner::validate_resolved_program(path, "git")`: T-060's
  `validate_resolved_binary` refactored to take the program NAME, so the
  gate has ONE implementation and two callers (the adapter wrapper for
  `claude`, this for `git`). A login-shell answer that is relative is
  refused and the search falls to a gated PATH lookup (`which_git` over
  `sanitized_dirs`); a `git` that resolves to nothing trusted is a typed
  `Disabled { GitUnavailable }`, never a bare-name spawn.
- **The child's PATH is SET by the app, not inherited.** `run_git` spawns
  `Command::new(<absolute git>)` and `env("PATH", …)` from a sanitized,
  ABSOLUTE-ONLY search list, so neither `current_dir(root)` nor a relative
  element can aim git's own helper resolution at the project.
- **Why the driver is mirrored, not unified** (the brief's "say why"):
  the security-critical STANDARD — the shape gate — and the shell
  selection are reused from `runner.rs` unchanged; only the ~20-line probe
  driver is churn-local, because the runner's `login_shell_probe`/
  `which_in` are private and hard-keyed to the `claude` adapter and
  generalising them would refactor the exact functions T-060's security
  rests on for no gain here. **The fence widened to `[app-map, app-shell,
  app-agent]`** because reusing the gate edits `agent/runner.rs`
  (source-only). Measured collision-free with every live lane and with
  merged main: `git diff --name-only 2036fb2..71f49cf -- runner.rs
  adapter.rs lib.rs` is EMPTY, and the only live `app-agent` lane, T-070,
  touches `agent/mod.rs`, `agent/sessions.rs` and `tests/agent_runner.rs`
  — zero file overlap with my `runner.rs`, the shared-slug/zero-file case
  the fences allow (same shape as T-013 ∩ T-064 on `app-shell`).

**The env hardening is now twelve, per-var.** `GIT_ENV_REMOVED` gains the
config-injection triple the verifier named: `GIT_CONFIG_GLOBAL` /
`GIT_CONFIG_SYSTEM` (repoint the global/system config files, which can set
`core.fsmonitor` or an alias — the verifier measured `GIT_CONFIG_GLOBAL`
taking effect) and `GIT_CONFIG_COUNT` (gates the numbered
`GIT_CONFIG_KEY_n`/`VALUE_n` inline-config family — git reads none of it
without the count, so one key neutralises the whole triple and there is no
per-`n` list to maintain). **The `-c core.fsmonitor=` pair now rides
`PROBE_ARGV` too**, not the log argv only: not exploitable through
`rev-parse --is-inside-work-tree HEAD` on git 2.50.1 (the verdict's
finding, reproduced), but carrying it on one of two invocations is an
asymmetry a reader must reason about, and the pair is one compile-time
literal — defence in depth is cheaper than the footnote.

**The exploit, re-run — every variant refused, texts read back.** Via a
throwaway `churn_at` probe (the verifier's own method: a real one-commit
repo, an executable `git` planted inside it, PATH poisoned), removed
afterward with `churn.rs` sha unchanged. A shell-script fake AND a
compiled-binary (`cc`) fake, under `PATH` prefixes `:`, `.`, `./` and
`:.` — in EVERY case the marker (`PWNED`) was ABSENT and `churn_at`
returned `Measured { commits: 1, rejected: 0, paths: [a.ts] }` from the
trusted git. The shipped, thread-safe pins that make it discriminating
(the `which_in` idiom — an explicit search path, no process-env mutation):
`the_git_gate_holds_the_same_standard_the_cli_resolver_does`,
`a_git_reachable_only_by_a_relative_path_element_never_resolves` (plants a
`git` UNDER the test cwd so the absolute spelling resolves as a positive
control and only the relative SHAPE is refused), and
`run_git_spawns_the_resolved_program_and_sets_the_childs_path` (a
stand-in echoing `$0` and `$PATH` proves the absolute program ran and the
child's PATH was SET, not inherited).

**F2 (BLOCKING) — the column-0-only layout mutant now reds.** New pin in
`map-layout.test.ts`, "an expanded container pushes its OWN column's
sibling — in a NON-ZERO column too": the slot-arithmetic fixture already
has C-02 and C-03 both in column 1 (rows 0/1); expanding C-02 must push
C-03 down by exactly the extra height. The mutant (apply the height only
when `column === 0`) reds it — "expected 190 to be 280" — and reds ONLY
it; the pre-existing "EXPANDING A DIFFERENT COLUMN" body survives, which
is precisely the gap the verdict found.

**F3 — the disabled treatment is recorded as designed, not reused.** Both
the site (`MapView.tsx`) and the card above now say the churn segment's
`cursor-not-allowed opacity-45` is the smallest-reasonable inert treatment
DESIGNED here — a raw segmented-control `<button>` cannot inherit the
shadcn `Button`'s `disabled:pointer-events-none disabled:opacity-50`
without becoming a Button and fighting the control's styling. The false
reuse claim is gone.

**F4 — the window divergence, now recorded in the card (this is that
record).** `docs/design/map-technical-plan.md` §4.6 draws `git log
--since=90d`; the design bundle that supersedes it draws **30 days**, and
the panel section T-012 shipped is already labelled `churn · 30d`. **30
wins.** The label renders `churn · ${windowDays}d` from the payload, so
`CHURN_WINDOW_DAYS`, `ARG_SINCE` and the heading cannot drift. This closes
`CHURN_WINDOW_DAYS`'s doc comment, which pointed at a record that did not
exist until this paragraph.

**F5 — the three figures, corrected in place above**: `churn.rs` is a
new file of **792 lines / +792 insertions** at `c7528cc` (not `+520`; the
F1 fix grows it to 1118); the CSS diff is **19 distinct selectors / 20
rule occurrences** (`.bg-background/60` twice), not a bare "20"; the regen
forecast is **four failing bodies** (three in `architecture-dogfood`, one
in `map-dogfood-render`), not three.

**New tests / drill.** Rust 369 → **373** (`the_git_gate…`,
`a_git_reachable_only…`, `run_git_spawns…`, and
`the_config_injection_family_is_removed_from_the_child_env`; plus the
existing `the_log_argv…` extended to assert the fsmonitor pair on BOTH
argvs). App 906 → **907** (the F2 layout pin). **Poison drill — 6
one-sided producer mutants, each read back before running, each RED, each
restored with a sha256 proof**: F2 `assignYs` column-0-only (reds only the
new pin, 190≠280; `map-layout.ts` back to `9bfc57ef…`); `run_git` drops
`env("PATH", …)` (reds `run_git_spawns…`); `which_git`'s gate → the
pre-T-060 `is_executable_file` (reds `a_git_reachable…` with
`Some("target/…/git") != None` — the vulnerability itself); the shared
gate drops its name check (reds `the_git_gate…`; `runner.rs` back to
`22d3bb17…`); `GIT_ENV_REMOVED` drops `GIT_CONFIG_GLOBAL` (reds the
env-removal pin); `PROBE_ARGV` drops the fsmonitor pair (reds
`the_log_argv…`). `churn.rs` back to `44db08e9…` after each. Drilled
in-place in the lane: the T-013-s7 hazard is a CROSS-worktree
manifest-path mismatch (a drill worktree at a different path baking its
own `CARGO_MANIFEST_DIR` into the shared target); in-place drilling has
one manifest path throughout, so the hazard is absent by construction, and
the full suite is green after restoration (373/0/3).

**Suites, gates, exits — every code read from `$?` unpiped, at my
handoff.** parser **263/263** (`tsc --noEmit` 0, build 0); app
**907/907**, `npm run build` 0 with BOTH TS programs typechecking, and the
built `index-C86RloYb.css` (45.06 kB) / `index-WORLmrLf.js` (523.98 kB)
are UNCHANGED — F3 minted no utility, F1/F2 add no frontend runtime; bare
`cargo test --no-fail-fast` **373 / 0 / 3, exit 0** over 15 `test result:`
lines (the T-061-s4 flake did not fire); e2e **121/121** (typecheck 0);
token lint selftest **0** / lint **0**, `TOKEN 130 / CONTROL 605` — the
repo's NUL gate, green, and my five changed files carry **0 NUL bytes**
(read as bytes; the `grep -qU $'\x00'` false positive STATE.md names was
avoided). **`index --check` exit 1 by design** (119 → 126 files, 1018 →
1111 symbols, 1539 → 1687 edges): my F2 edit adds `map-layout.test.ts` to
the `~` set, so it is now `+7 -0 ~8` and 639904 → **639906** bytes, with
symbols/edges unchanged — the integrator's three-fixture reconciliation is
otherwise as the original notes forecast, and no `graph.json` is
committed. **BOOT GATE exit 0** (both `[nputer]` lines; scratch port
**14840** bind-probed free on all four stacks, cleared after). **DOCS GATE
exit 1**, owing `npm test` from app/, `npm test` from tools/e2e/ and `npx
vitest run` from lib/parser/ (11 readers, 0 frontmatter issues — the
widened frontmatter parses), all three re-run green AFTER the doc edits.

**Security pins unmoved.** `acl_pin.rs` 0-file diff, sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`, 92
grants — **F1 adds no webview grant**. IPC census **14 at both ends**
(`lib.rs` is a 0-file diff — no new command). **Three `#[ignore]`**. No
lockfile, `Cargo.toml`, `package.json`, `tauri.conf.json`, capability file
or `tokens.css` in the diff; no dependency added (`churn` uses
`std::process` and the `serde`/`serde_json` already present).

**Ranges, at the handoff ref.** Main advanced to **`71f49cf`** (T-064
MERGED since the verdict — see the brief note below); merge-base
**`2036fb2`**, unmoved.

    git merge-tree --write-tree 71f49cf HEAD          -> tree 58bc6dfb…, exit 0
    git diff --name-only 71f49cf <TREE>               -> 26   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 71f49cf...HEAD  (THREE dots) -> 26   collapses onto the prescribed form before the merge
    git diff --name-only 2036fb2..HEAD   (branch-only)-> 26
    git diff --name-only 71f49cf..HEAD   (TWO dots)   -> 176  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..71f49cf (main adv)  -> 150

Main advanced **150** paths from the merge-base (T-064's merge plus main's
own triage), the branch **26** (the verdict's 24, plus `runner.rs` for the
F1 gate reuse and `map-layout.test.ts` for the F2 pin), `comm -12` over the
sorted lists is **EMPTY**, and 150 + 26 = 176 — exactly the forbidden
count, the arithmetic that proves the two sets disjoint. Gate table off the
prescribed list: **GRAPH REGEN 15 of 26 · BOOT GATE 12 of 26 · DOCS GATE 8
of 26** — all three FIRE and all three were run above (the F2 test is the
15th GRAPH path, `runner.rs` the 12th BOOT path).

**What reached the human's running app: nothing.** All work in
`../nputer-T-013` and `/tmp` scratch (T013-prefixed); no `npm ci`/`install`
in the main checkout; no `pkill`. Port 1420 was read with `lsof -nP
-iTCP:1420 -sTCP:LISTEN` and nothing else, before and after: holder `node`
pid **82549**, one socket, `TCP [::1]:1420 (LISTEN)`, identical at both
ends. No bind, connect or signal to 1420 on any interface; scratch 14840
verified clear afterward. The lane's OWN `target/` was relinked by cargo,
which cannot reach the human's loaded app process in the MAIN checkout's
target.

**What in the dispatch brief is wrong / stale.** (1) The brief says
"**T-064 is integrating right now and … touches app/src + lib.rs; expect
lib.rs to have moved**." At handoff T-064 has MERGED (main `71f49cf`) and
its merged diff does **not** touch `lib.rs` — it touched
`docs_watch.rs`/`App.tsx`/`watcher-store.ts` (`git diff --name-only
2036fb2..71f49cf -- app/src-tauri/src/lib.rs` is EMPTY), so my `lib.rs`
`repo_churn` registration does not collide with it. (2) The brief names
"**app pid 85379**"; the mandated `lsof -nP -iTCP:1420` only ever shows
the LISTENER (`node` 82549), so pid 85379 is unobservable by that command
alone — consistent with STATE.md's own caveat, noted rather than
contradicted. Everything else in the brief held: the exploit reproduced
and is now refused, F2's mutant survived 906 and now reds, the gate is
"could be twelve" and is, `acl_pin` is a 0-diff at the pinned sha, and
`index --check`/BOOT/DOCS all fired as predicted.

## Verdicts

### 2026-08-23 — REJECTED (claude-opus-5 @T-013-verify, review: same-model)

**One security finding and one coverage finding, both reproduced; the
rest of the card holds up under attack and most of it holds up
unusually well.** The security half of this card is where it asked to
be judged, and the argv, the environment, the output parser and the
closed reason vocabulary all survive the sweep. What does not survive
is the sentence above them: `churn.rs` says it is *"the app's SECOND
SUBPROCESS and it is TREATED LIKE THE FIRST"*, and on the one property
the first subprocess exists to hold — **which binary runs** — it is
not. Measured inside `churn_at` itself: a `git` shipped by the OPENED
PROJECT executes. Everything else below is either green or a
documentation correction.

#### Suites re-derived at my own refs, every exit code from `$?` unpiped

| suite | result | exit |
|---|---|---|
| lib/parser `npm run build` / `npx vitest run` / `npx tsc --noEmit` | **263/263 over 12 files** | 0 / 0 / 0 |
| app `npm run build` | 269 modules, `index-C86RloYb.css` 45.06 kB | 0 |
| app `npm test` | **906/906 over 46 files** | 0 |
| bare `cargo test --no-fail-fast` | **369 passed / 0 failed / 3 ignored**, summed over **15** `test result:` lines | 0 |
| tools/e2e `npm test` | **121/121** | 0 |
| tools/e2e `npm run typecheck` | clean | 0 |
| `npm run lint:tokens -- --selftest` then `npm run lint:tokens` | `TOKEN 130 / CONTROL 605` | 0 / 0 |
| `index --check --root ../..` | STALE, the real red shape | 1 |
| `docs-gate.mjs` on the prescribed list | 3 suites owed, 11 readers, 0 frontmatter issues | 1 |
| BOOT GATE, `NPUTER_BOOT_PORT=14833` | booted, both `[nputer]` lines | 0 |

Every executor figure reproduces. Port 1420 was read with
`lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else, before and after
the boot check: `node` pid **82549**, one socket, `TCP [::1]:1420
(LISTEN)`, byte-identical at both ends.

#### Ranges, at MY ref, because the right-hand endpoint moved twice during this review

Main was `4d2f03c` on the card, `f306ee9` when I opened it and
**`ea7ea0a`** when I measured. Merge-base **`2036fb2`**, unmoved.

    git merge-tree --write-tree ea7ea0a a2173f8 -> tree 3fc2ba4a…, exit 0
    git diff --name-only ea7ea0a <TREE>               -> 24   THE PRESCRIBED FORM
    git diff --name-only ea7ea0a...a2173f8 (THREE)    -> 24
    git diff --name-only 2036fb2..a2173f8  (branch)   -> 24
    git diff --name-only ea7ea0a..a2173f8  (TWO)      -> 154  THE FORBIDDEN FORM
    git diff --name-only 2036fb2..ea7ea0a  (main)     -> 130

`comm -12` over the two sorted lists is **EMPTY** and 130 + 24 = 154 —
the same disjointness argument the card makes, re-derived against a
main that has advanced 88 paths further. Gate table off the prescribed
list: **GRAPH REGEN 14 of 24 · BOOT GATE 11 of 24 · DOCS GATE 8 of 24**,
all three exactly as recorded.

---

### F1 — BLOCKING, security. The opened project can supply the `git` that runs

**Measured inside `churn_at`, not argued.** A temporary probe planted in
`churn.rs` (`verifier_probe_relative_path_element`, removed and the file
restored to sha256
`08af662213ee9f0a6dc716a2aa4204a9c67692f763f067caa6d66290578f5914`)
builds a real one-commit repository, drops an executable named `git`
inside it, prepends an empty element to `PATH`, and calls `churn_at` on
that directory:

    cargo test -p nputer --lib churn::tests::verifier_probe_relative_path_element -- --exact --test-threads=1
    VERIFIER PROBE: fake-git-from-the-project ran = true; outcome =
      Measured { window_days: 30, commits: 0, paths: [], truncated: false,
                 rejected: 2, measured_at_ms: … }

The project's own binary executed, and the app then rendered a churn
overlay built partly from its output. Reproduced first on a standalone
program replicating `run_git`'s exact construction, with a shell script
and again with a compiled binary, and with `.` in place of the empty
element: `PATH=":/usr/bin:/bin"` and `PATH=".:/usr/bin:/bin"` both fire.
The mechanism is `current_dir` plus a bare program name — the child
`chdir`s into the project and only then resolves `git`, so a relative
`PATH` element resolves **inside the repository being read**.

**Why this is REJECTED-level and not a note.** It contradicts three
claims that this diff itself makes, and one ruling this repository has
already ratified:

- `churn.rs` header: *"THIS IS THE APP'S SECOND SUBPROCESS AND IT IS
  TREATED LIKE THE FIRST (C-14's runner, ADR-003)."*
- `LOG_ARGV`'s own comment: *"Reading a stranger's repo must not run
  their code."*
- The card: *"the narrowest clearing that still works"* — the clearing
  keeps `PATH` precisely so git can find its helpers, and `PATH` is the
  vector.
- `agent/runner.rs`, `validate_resolved_binary`: **"THE RESOLVED-PATH
  GATE — one standard, applied at every door"** (T-060, absorbing
  T-047-s5). `which_in`'s own comment says it exists *"so a relative
  search-path element produces NO candidate rather than a relative
  binary that `Command::new` would hand to the OS."* The first
  subprocess spawns `Command::new(&cli.path)` — absolute,
  traversal-free, name-checked — and sets the child's `PATH`
  explicitly. The second spawns `Command::new("git")` and inherits
  `PATH` raw. That is two doors holding one standard between them,
  which is the exact sentence T-060 was written to retire.

**And it is strictly worse than the case T-060 fixed.** There, a
relative element resolved against *the app's own CWD* — "whatever the OS
handed the process". Here `current_dir(root)` aims it at the folder the
user just opened, which is the one directory in the whole system whose
contents an attacker controls by asking the user to clone a repository.

**What closes it** (any one, cheapest first): resolve `git` through the
existing gate before spawning and refuse when it cannot be resolved to
an absolute, traversal-free path named `git`; or set the child's `PATH`
explicitly the way `apply_child_env` does; or, at minimum, refuse to
spawn at all when `std::env::split_paths(PATH)` yields a relative
element. Whichever is chosen, the pin belongs beside
`the_log_argv_keeps_the_four_flags_the_containment_argument_rests_on`,
and it needs the positive control CONVENTIONS asks for — plant the fake
`git`, prove the ABSOLUTE spelling still resolves, and only then assert
the relative one does not (the shape `runner.rs` already uses).

#### The rest of the containment sweep — attacked and HELD

- **`core.fsmonitor` from a hostile `.git/config`.** Fixture built and a
  positive control proved it: `git status` in that repository RUNS the
  program (`PWNED_FSMONITOR` created), and `-c core.fsmonitor=`
  neutralises it. Neither `PROBE_ARGV` nor `LOG_ARGV` triggers fsmonitor
  at all, with or without the clear, on git 2.50.1 — so the clear is
  defence in depth rather than the load-bearing thing the comment
  implies, and its absence from `PROBE_ARGV` is not exploitable through
  `rev-parse --is-inside-work-tree HEAD`. **Recorded because the
  asymmetry is real and undocumented**: the pair is on the log argv only.
- **`GIT_CONFIG_*` in the parent environment.** `GIT_ENV_REMOVED` omits
  `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM` and the
  `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_n`/`GIT_CONFIG_VALUE_n` triple,
  which inject configuration at the same rank as `-c`. Measured:
  `GIT_CONFIG_GLOBAL` pointed at a file setting `core.fsmonitor` DOES
  take effect (positive control fires on `git status`), and neither of
  this file's two invocations can be made to run it. Not exploitable
  today; the list is nine long and could be twelve.
- **Aliases, pagers, external diff, hooks, textconv.** An alias cannot
  shadow a builtin; stdout is a pipe so no pager runs; `git log` does not
  honour `diff.external`/textconv without `--ext-diff`, which is absent;
  `log` and `rev-parse` run no hooks. Nothing else in a repository's
  config reaches an exec through these two argvs.
- **`--relative` containment.** Built a repository with `topsecret.txt`
  and `sib/` above an `inner/` project folder and ran the exact
  `LOG_ARGV` from `inner/`: output is `i.txt` and nothing else. The
  criterion's containment holds, and the wire shape the card measured
  reproduces byte for byte (`\x01<ct>\0`, then a single `\n` glued to the
  first path of the commit).
- **A hostile byte on git's stderr.** Unreachable **by type**, not by
  filter: `ChurnOutcome::Disabled` carries a fieldless `ChurnDisabled`,
  the `Measured` arm carries only numbers and containment-checked path
  strings, and the TS mirror reads exactly `kind` and `reason`, folding
  anything outside a five-word set to `unreadable`. `churnDisabledSentence`
  is a total switch over seven literals. I traced every consumer of
  `ChurnState`: **no churn path string reaches the DOM** — `attributeChurn`
  uses paths as Map keys only, and `MapPanel`/`map-visuals` render counts.
  The claim holds; note that it is a cross-language property no test pins.
- **`acl_pin.rs`**: **0-line diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  **92** entries between the declaration and its `];`. `Cargo.lock`,
  `Cargo.toml`, `package.json`, `tauri.conf.json`, the capability files
  and `tokens.css` are **0 paths** in the diff — no dependency, no grant,
  no new token.
- **IPC census 13 → 14, CORRECTED and not widened.** Both bodies use
  exhaustive `toEqual` over sorted arrays; the frontend list gains
  `repo_churn` (10 → 11 named, plus the three that go through a variable)
  and the Rust list gains it (13 → 14). A fifteenth command fails both by
  name. **`T-013-s2` reproduces exactly**: over the census regex,
  `invoke<unknown>("name")` inside a COMMENT yields a phantom command
  `name`, and `invoke("evil_cmd")` without a type argument yields nothing.
  The Rust end strips `//` before splitting; the frontend end does not.
  The silent direction is the untyped call, and the loud direction is the
  comment — so the census can HIDE a frontend call site but cannot
  quietly gain one. Suggestion-grade, correctly filed, and the mismatch
  between the two ends is the one-line shape of the fix.
- **No control byte in any of the 24 paths** (scanned as raw bytes for
  `\x00-\x08\x0b\x0c\x0e-\x1f`), which is the P5 hazard the card names.

---

### F2 — BLOCKING. The sibling-push rule is pinned in column 0 and nowhere else

**My own mutant, and it survives the whole suite.** In `assignYs`, apply
the expansion height only in column 0:

    -    for (const ids of byColumn.values()) {
    +    for (const [column, ids] of byColumn.entries()) {
    -        y += (heights.get(id) ?? NODE_H) + (SLOT_H - NODE_H);
    +        y += (column === 0 ? (heights.get(id) ?? NODE_H) : NODE_H) + (SLOT_H - NODE_H);

    npm test from app/  ->  906/906, 46 files, exit 0

Under that mutant a container in any column but the first **overlaps the
node below it** — the same defect `M2` catches in column 0 — and nothing
reds. The cause is the fixture: `zoomFixture`'s second column holds
exactly ONE node, so *"pushes only that column"* is exercised in one
column only. The card's notes see half of this ("the fixture's other
column has no row below the expanded one") and use it to argue for the
sibling-column body; the complementary hole is one step further on and is
not closed.

This is not a hypothetical. The criterion at stake is criterion 1's own
sentence, and the card nominates this pin as the thing that kills the
natural mistake. **The fix is one node and one assertion**: give column 1
a second component below the expandable one, and assert it moves by
exactly the extra height when its own column's node expands.

**M1 re-run and confirmed.** Row heights made GLOBAL across columns
(per-row max) reds **exactly 1 of 906**, and it is
*"EXPANDING A DIFFERENT COLUMN LEAVES THIS ONE ALONE — the mutant's other
side"*. The card's account of M1 is accurate. **A second mutant of mine,
`h: expanded.get(c.id) ?? NODE_H` → `h: NODE_H`, reds 3** — so the box
height that edge routing and the canvas extent read is genuinely pinned.
Both mutants were read back with `git diff` before the suite ran, planted
in a detached scratch worktree at `a2173f8`, and restored by byte copy
from that commit with an empty `git status` and sha256 back to
`9bfc57ef834a07988d533d048df93d0fa58e69ac476b885d7ea774e406f078d8`.

---

### F3 — non-blocking. The disabled treatment is not the one the card says it reuses

Both the code comment in `MapView.tsx` and the card justify shipping a
disabled segment as *"wearing the disabled treatment the pane's Re-index
button already uses"*. It is not. Re-index is the `Button` primitive at
`disabled:pointer-events-none disabled:opacity-50`; the churn segment is
`cursor-not-allowed opacity-45`. **Both of those utilities are NEW to the
shipped stylesheet on this branch** — they are two of the added selectors
in the CSS diff below, so nothing in this pane wore them before. The
treatment was designed here, which is a legitimate smallest-reasonable
choice, but it must be recorded as one: the reuse claim is the entire
argument that the state is not undesigned, and it is the argument
T-012's amendment asked for.

---

### F4 — non-blocking. `CHURN_WINDOW_DAYS` cites a record that does not exist

The constant's doc comment reads *"The plan's §4.6 draft said 90 days;
the design bundle that supersedes it draws 30 … 30 wins, and the
divergence is recorded in the card."* The divergence is real —
`docs/design/map-technical-plan.md` §4.6 spells `git log --since=90d` —
and **the card records nothing**: `grep -in "day\|90"` over
`T-013-semantic-zoom-overlays.md` returns no line about the window. A
sentence in shipped source pointing at a record that was never written
is the shape CONVENTIONS calls out twice (the succession rule, and
"a rule goes unwritten while everyone believes it exists"). One
paragraph in the notes closes it.

**The label and the code do agree**, which is the other half of the
question and is better than T-012's: `churnLabel` renders
`churn · ${state.windowDays}d` from the payload rather than a literal, so
`CHURN_WINDOW_DAYS`, `ARG_SINCE` and the panel heading cannot drift, and
a disabled read shows a bare `churn` instead of a stale `30d`.
`the_window_literals_agree_with_the_window_constant_and_with_themselves`
pins both the derived and the literal spelling, which is T-063's rule
obeyed rather than cited.

---

### F5 — non-blocking. Three figures in the notes do not reproduce

The notes open with *"Every figure below is derived at this branch's own
tip"*. Three are not.

1. **`app/src-tauri/src/churn.rs` (+520)** — the file is **792** lines at
   the tip and **787** at `d52521e`, its first commit. No commit on this
   lane and no metric I could construct yields 520 (non-blank 737,
   non-blank-non-comment 563, production half 413).
2. **"20 added, 0 removed" selectors** — both true, under different
   metrics, and neither is stated. Re-derived myself in a detached
   worktree at `2036fb2` (which reproduces `index-CwYF5FQb.css` at 43.95
   kB byte for byte): **19 DISTINCT selectors added, 20 rule OCCURRENCES
   added** — `.bg-background\/60` emits twice — and **0 removed** on both
   metrics. The card's own parenthetical lists exactly the 19. This is the
   "a score without its metric is not a figure" rule, applied to the
   card's own headline number.
3. **"four assertions across three bodies in two files"** — measured by
   regenerating the graph and running both dogfood suites: **four failing
   BODIES**, three in `architecture-dogfood.test.ts` and one in
   `map-dogfood-render.test.tsx`, and the first of them carries two
   distinct edits. The card's own bullet list enumerates four bodies; only
   the summary sentence says three.

**The substance behind all three is sound**, which is why this is not
blocking: no accidental utility was minted (I traced all 19 added
selectors to a shipped file under `app/src`, none test-only), and the
regen forecast is exact.

---

### GRAPH REGEN — the forecast, re-derived independently

`index --check --root ../..` exits **1** with `585305 → 639904 bytes,
119 → 126 files, 1018 → 1111 symbols, 1539 → 1687 edges`, `files +7 -0
~7` — the card's shape exactly. I then regenerated into a detached
worktree at `a2173f8` (never into the lane) and ran the two dogfood
suites against the fresh graph. Confirmed, value for value:

- `fileComponent.size` **119 → 126**; the per-component array **`C-05`
  56 → 59** and **`C-12` 14 → 18** (obtained by advancing the size
  assertion in the scratch tree only);
- the `C-05 → C-06` D1 gains **three** `fileEdges` — `map-churn.test.ts`,
  `map-t1-t2-dom.test.tsx`, `map-zoom.test.ts`, each importing
  `@nputer/parser`;
- the relation table's `observedCount` **10 → 13, 22 → 32, 6 → 7**;
- `map-dogfood-render`'s header hint **119 → 126 files**, and its node and
  edge counts **HOLD** — that file reds one body and one only;
- **the parser pin holds**: `lib/parser/test/smoke.test.ts` is untouched.

Restored by byte copy from the drill commit: `git status --porcelain`
empty and sha256 back to
`b5d1cf2c7beb99d3b0b4974b3b21b87a95163c62bfb011ad5ec7974ade56f038`.
Nothing regenerated is committed on this branch.

---

### The budget floor, at the boundary and one past it

Derived with a scratch body against `expansionFor`, then deleted:

| fixture | mode | groups | hidden | depth | height |
|---|---|---|---|---|---|
| 48 files, one directory (**at** `FILE_BUDGET`) | `files` | 1 | 0 | 1 | 1166 |
| 49 files, one directory (**one past**) | `grouped` | 1 | 0 | 1 | 90 |
| 72 files, 24 top dirs (**at** `GROUP_BUDGET`) | `grouped` | 24 | 0 | 1 | 711 |
| 75 files, 25 top dirs (**one past**) | `paginated` | 24 | **1** | 1 | 711 |
| 49 bare filenames (**depth 0**) | `grouped` | 1 | 0 | 0 | 90 |
| no files at all | `files` | 0 | 0 | 0 | 68 |

**Both degraded states are DEFINED on both sides of both boundaries**,
each naming itself in a `note`, and the depth-0 case — which the floor
argument turns on — lands in `grouped` under `(root)` rather than in
unreachable code. The floor reasoning is correct: without it the loop
always terminates at one group and `paginated` could never be produced.
`M5` reproduces the card's account.

One shape worth recording rather than fixing: **48 files in 48 distinct
directories is `files` mode at 2153 px**, because the budget counts FILE
ROWS while the height is rows *plus* directory labels. Inside the
criterion (nothing exceeds the budget) and not a freeze, but it is the
worst case at budget and it is 14× the fixture the DOM body measures.

### M7's fix — the positive control cannot rot

The replacement body reads the heuristic edge out of the parsed graph
and asserts `toHaveLength(1)` **before** asserting `refs === 0`. Delete
the `x` symbol declaration from the fixture and `parseGraph`'s
referential-integrity check drops the edge, so the control fails first
and by name. That is a control that pins the fixture shape rather than
one that quietly evaporates with it — the T-077-s5 shape, closed. The
`NO CANVAS SYMBOLS IN V1` body has the same structure: it requires the
symbol name to be ABSENT from the canvas and PRESENT in the panel, so
absence cannot be satisfied by the fixture simply not having one.

---

### Ruling 1 — the fence widening was RIGHT, and stopping would have been wrong

`touches:` was dispatched `[app-map]` and reads `[app-map, app-shell]`
in this branch. I rule the widening correct, on the direction of error.

`method/tasks/TASK-FORMAT.md` makes `touches:` the ORCHESTRATOR's
serialization input — *"Tasks with overlapping `touches:` never run
concurrently."* A fence that is too WIDE can only ever cause more
serialization; a fence that is too NARROW is the one that misleads the
next dispatch. The executor moved the record in the safe direction and
made it true about its own diff, which is the only thing an executor can
do about a fence it does not own.

The alternative was worse in every branch. There is no in-fence route,
and this is proved rather than asserted: the webview ships no
`@types/node` by decision (ADR-017 / T-073), so a subprocess needs a
Tauri command, and registering one edits `lib.rs` — C-05, `app-shell`.
The only other route, riding `index_repo`, needs `watcher-store.ts`,
which is also `app-shell` **and is the file the live T-064 lane is
actually editing**. So stopping would have blocked a criterion that
cannot be built inside its fence, and building under the narrow fence
would have shipped a `touches:` line the diff contradicts — consumed by
the board and by the map's own status rollup, so the lie renders twice.

The precedent settles the value, not just the direction: **T-012 — the
card this one is `blocked_by` — declared exactly `[app-map, app-shell]`
for exactly one Tauri command.** The widening restores a known-correct
value rather than inventing one, and `T-013-s1` costs both routes, names
the collision it avoided, and addresses the ask to the PLANNER, which is
the role that owns fences. That is the whole obligation discharged.

**The residual, named because nothing else names it**: the widening
changed the dispatch's premise while T-064 was in flight, and a finding
on a card is read at triage, not in flight. This method has no
in-flight channel for "my fence just grew"; `docs/rooms/` is the nearest
thing. Not this card's defect, and worth one line somewhere.

#### What the INTEGRATOR must re-check, now that two live lanes hold `app-shell`

Measured at `ea7ea0a` against every live lane — **T-061 `ed0c622`
(0 paths), T-064 `cdaf5b7` (17), T-070 `1e0b940` (11), T-089 `b416efb`
(14)** — the file overlap with T-013's 24 paths is **EMPTY in all four**,
and none of them touches `lib.rs`, `crescendo-dom.test.tsx` or
`acl_pin.rs` (T-064's `crescendo.test.ts` is a different file). Still:

1. **Re-derive the overlap at the merge**, not from this verdict — the
   right-hand endpoint is what goes stale, and it moved twice while I was
   reviewing.
2. **`lib.rs` is the collision surface, and the census is a COUNT.**
   Whoever merges second must re-derive **both ends** of the IPC census,
   not re-run the test: `generate_handler!` is a textual conflict magnet
   and "exactly fourteen" is a number two lanes can move. **Correct the
   pins, never widen them** — both bodies are exhaustive `toEqual` and
   must stay that way.
3. **`acl_pin.rs` must still be a 0-file diff at 92 grants** at the
   merge; any lane that adds a webview grant invalidates this card's
   "zero new grants" claim as well as its own.
4. **The regen forecast above is stated against `2036fb2`'s graph.** If
   another lane merges indexed files first, re-derive the three-fixture
   reconciliation rather than applying these numbers.
5. **All three gates re-derived at the merge's own PAIR**, and DOCS GATE
   fed the same list — it computes no range of its own by design.

### Ruling 2 — disabled, not absent: the CARD governs, and there is no deviation to forgive

The executor recorded this as a deviation from a ratified ruling. It is
not one, and the record should say so.

Both texts come from **the same ratified amendment** — T-012's plan
§1(b), one paragraph, one pen, one commit. It writes *"the segment is
absent, not disabled, **until T-013**"* and, four lines later, writes
T-013's criterion: *"IF the project is not a git repo THEN the churn
overlay SHALL be disabled, not broken."* The trailing clause **is** the
scope boundary. The architect ruled absent for T-012 and disabled for
T-013, and the executor obeyed both. Shipping ABSENT here would have
violated T-013's criterion, and it would have violated it in the worse
direction: a segment that appears and disappears with the project hides
that churn exists and moves the header's own layout.

So: **acceptable, and not a deviation.** What survives the ruling is the
narrower objection T-012's sentence actually raised — that a disabled
segment has no *designed* treatment — and that objection is answered by
reuse or not at all. It is not answered by reuse (**F3**), so it needs a
recorded smallest-reasonable choice instead. That is a one-sentence
correction, not a rebuild.

---

### Three observations, filed as neither findings nor blockers

- **`repo_churn` has no server-side single-flight.** The frontend
  single-flights; the command does not, so N invokes spawn N children,
  each unbounded in wall clock (`T-013-s3` has the timeout half). The
  webview is first-party, so this is a robustness note, not a hole —
  but the two halves belong in one finding.
- **`is_safe_repo_relative` refuses Unicode `Cc` and not `Cf`**, so a
  path carrying `U+202E` RIGHT-TO-LEFT OVERRIDE is accepted. Harmless
  today precisely because no churn path renders; it stops being harmless
  the day one does, and the doc comment that says none does is the only
  thing holding it.
- **The `-c core.fsmonitor=` pair is on `LOG_ARGV` only.** Not
  exploitable through `PROBE_ARGV` on git 2.50.1, and I could not make it
  fire on either argv. Worth one clause in the comment so the next
  reader does not conclude both invocations carry it.

### What reached the human's running app

**Nothing.** All work was in `../nputer-T-013` and two detached scratch
worktrees at named commits (`2036fb2` for the stylesheet baseline,
`a2173f8` for the mutants and the regen), each with its own copied
`node_modules` rather than a shared or symlinked one, heeding
`T-013-s7`; the mutant runs used the drill worktree's own tree
throughout and the only in-lane edit was the F1 probe, restored by byte
copy with a clean `git status` and a matching sha256. No `npm ci` or
`npm install` in the main checkout. No `pkill`. Port 1420 was read with
`lsof` only and is unchanged, and the ONE socket it names is `node` pid
82549 — a listener is all that command can see, so it is not evidence
about the app process beside it. `git status` in the main checkout
carries exactly one untracked entry, an empty file `z` with mtime
2026-08-23 17:34, an hour before this review opened; it is not mine and
I left it alone.

### Verdict

**REJECTED** on **F1** and **F2**. Neither is a rebuild: F1 is a
resolve-then-spawn plus a pinned positive control, F2 is one fixture
node and one assertion. F3, F4 and F5 are corrections to the record and
should ride the same commit. Everything else on this card — the argv
surface, the environment clearing, the wire-format measurement, the
laundering refusal, the closed reason vocabulary, the containment of an
opened subfolder, the two census ends, the budget's two arms, M7's
repaired control, the regen forecast and the range arithmetic — I
attacked and could not break.
