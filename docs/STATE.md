# State

Updated: 2026-08-23 by claude-opus-5 @T-013-integrate (T-013 merged and
checkpointed).

## Just completed

**T-013 — semantic zoom T1/T2, a churn overlay, and the app's SECOND
SUBPROCESS SURFACE.** F-06, milestone 4, size M, `touches: [app-map,
app-shell, app-agent]` — widened TWICE mid-lane and both widenings ruled
correct by the verifier. Built by `claude-opus-5 @T-013` then rebuilt by
a SECOND executor after rejection; verified by `claude-opus-5
@T-013-verify` across TWO passes; `review: same-model`. **REJECTED on
the first verdict — on a DEMONSTRATED code-execution hole, not a
style point — rebuilt, APPROVED on the second.** Both verdicts are on
the card. Approved tip **`650fdbe`**, merge **`6834287`**; the card was
`verifying` and this checkpoint stamps **`done`**.

**WHAT LANDED.** The map pane ZOOMS: expanding a component turns the
node into a container of its own files grouped by directory, with
intra-component edges drawn as orthogonal bows and the stub edges to
collapsed neighbours re-attached to the container's border. It grows
DOWN inside its own column — `assignYs` now STACKS a column instead of
multiplying a constant slot — so unexpanded siblings do not move, and
with nothing expanded the stack reduces to T-012's formula
byte-identically. T2 is in the panel: a selected file lists its symbols
and their resolved edges, heuristic edges excluded, no canvas symbols in
v1. Over `FILE_BUDGET` (48) the container groups deeper and past
`GROUP_BUDGET` (24) it paginates and names what it left out — a defined
degraded state with both arms reachable, because the roll-up FLOORS at
one segment and without that floor pagination is unreachable code. And
the overlay control gains a fourth member: **churn**, a 3px bar of each
component's share of the last 30 days of git history, hottest one step
darker, a TIE naming none, declared-only showing `—`, never amber, and
the drift ring surviving underneath it.

**THE CHURN NUMBER IS THE NEWS, because of where it comes from.**
`app/src-tauri/src/churn.rs` (**1158** lines) shells out to `git` behind
a new zero-argument Tauri command `repo_churn`. **The map's sources are
now three and only the third is not a file** — INTENT (the registry),
REALITY (the committed graph) and HISTORY (git, read live) — which is
why the churn segment renders DISABLED with its reason rather than
vanishing on a folder that is not a git repository.

**TWENTY-SIX PATHS — 9 `app/src`, 3 `app/src-tauri`, 6 `app/test`, 8
`docs/tasks`.** 15 added / 11 modified, 6652 insertions, 71 deletions.
No manifest, no lockfile, no capability file, no `tokens.css`.

## THE SECURITY STORY IS THE CARD, and the first build shipped the hole

`run_git` was `Command::new("git")` + `current_dir(root)` with an
INHERITED `PATH`. The child `chdir`s into the opened project and only
THEN resolves a bare name, so a relative or empty `PATH` element
resolves `<project>/git`. **The verifier planted a fake `git` in a
would-be opened project and the app EXECUTED it** — measured inside
`churn_at`, with a shell script and again with a `cc`-compiled binary,
under `PATH` prefixes `:`, `.`, `./` and `:.`. It is strictly worse than
the case T-060 fixed: there a relative element resolved against the
app's own CWD, here `current_dir(root)` aims it at the one directory
whose contents an attacker controls by asking the user to clone a
repository.

**The fix does not write a second gate, and that is the whole design.**
`agent/runner.rs`'s `validate_resolved_binary(path, adapter)` becomes a
thin wrapper over a new **`validate_resolved_program(path, name)`**, so
the ratified resolved-path standard has **ONE implementation and TWO
callers** — the `claude` door and the `git` door — and `login_shell()`
is made `pub` and shared. `resolve_git` runs `$SHELL -l -c "command -v
git"` in the APP's own cwd, never the project, puts every candidate
through the shared gate, and falls back to a gated `PATH` lookup over an
absolute-only, traversal-free list; a `git` that resolves to nothing
trusted is a typed `Disabled { GitUnavailable }`, never a bare-name
spawn. `run_git` then spawns the ABSOLUTE program and **SETS the child's
`PATH`** itself.

**THE REFACTOR IS BEHAVIOUR-PRESERVING BY TEXT, NOT BY SAMPLE, AND I
RE-DERIVED IT HERE.** Extracting both gate bodies — the old one from
`11c82a1`, the new one from the merge — and normalising the two renamed
tokens (`adapter.binary` → `expected_name`), `diff` returns **no output
over 35 lines each, exit 0**. There is no input that passes the new gate
and fails the old one; that is a proof over all inputs. The name check
is still `path.file_name().and_then(to_str) != Some(name)` — exact
equality on the final component, never a suffix. The whole `runner.rs`
diff is **+21 / −3**: the wrapper, the renamed signature and its doc
comment, two token swaps, and `pub` on `login_shell` plus its doc
comment. **No pre-existing call site was rewritten.**

And the refactor **improved** coverage rather than weakening it. The
feared regression — the exact name check degraded to `ends_with` — reds
**one** body in the whole workspace, and it is the body this fix ADDED
(`the_git_gate_holds_the_same_standard_the_cli_resolver_does`). T-060's
own suites do not catch it. The second caller's test is now the only
thing pinning the gate's name check for EITHER door, which is a
dependency worth knowing about and is filed.

## Security sweep — every figure re-derived at the merged tree

- **`acl_pin.rs` is a 0-file diff at sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`**,
  the pinned value, unmoved. `EXPECTED_GRANTS`: array declaration line
  54, closing `];` line 147, entries 55–146 = **92**, zero blank or
  comment inside, 92 quote-bearing lines / 92 quoted strings / 92 UNIQUE
  quoted strings. **A new command is not a new grant** — ADR-012
  applied, not reopened.
- **Both argvs, element by element.** `PROBE_ARGV` is six literals
  (`--no-optional-locks`, `-c`, `core.fsmonitor=`, `rev-parse`,
  `--is-inside-work-tree`, `HEAD`); `LOG_ARGV` is twelve
  (`--no-optional-locks`, `-c`, `core.fsmonitor=`, `log`,
  `--since=30.days.ago`, `--no-merges`, `--no-renames`,
  `--max-count=5000`, `-z`, `--name-only`, `--relative`,
  `--format=%x01%ct`). **Every element is `&'static str` by type**, so
  "compile-time literal" is carried by the signature
  (`argv: &[&'static str]`) and not by a convention. **`-c
  core.fsmonitor=` is on BOTH** — the first verdict's asymmetry is
  closed. **`-C` is on NEITHER**, and no argv element is a path: the
  project root reaches git as the child's WORKING DIRECTORY and nowhere
  else.
- **`stdin(Stdio::null())`**, stdout/stderr piped, no shell — no `sh
  -c`, no string concatenated into a command line. **The two PRODUCTION
  process surfaces in `churn.rs` are exactly `Command::new(&git.program)`
  and `Command::new(login_shell())`**; the one literal
  `Command::new("git")` left in the file is the `TempRepo::git` fixture
  inside `#[cfg(test)]` at line 1029.
- **`GIT_ENV_REMOVED` is TWELVE**, per-variable: the six that move git's
  idea of which repository it is reading, `GIT_CEILING_DIRECTORIES`,
  `GIT_EXTERNAL_DIFF`, `GIT_PAGER`, and the config-injection triple
  `GIT_CONFIG_GLOBAL` / `GIT_CONFIG_SYSTEM` / `GIT_CONFIG_COUNT`.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, line-anchored from the repo
  root: `perf.rs:53`, `self_graph.rs:58`, `agent_runner.rs:3767`, all
  three carrying `= "reason"`. The naive grep returns **90**.
- **0 manifests, lockfiles, capability files, `.entitlements` or
  `tokens.css`** in the merge's diff — no dependency added; `churn.rs`
  uses `std::process` and the `serde`/`serde_json` already present.
  `cargo audit -n` exit **0**, 472 crates, **0 vulnerabilities / 17
  allowed warnings**, unmoved, which a 0-file `Cargo.lock` diff requires.
- **0 secret-shaped hits** over the merge's **6652** added lines
  (`sk-`/`AKIA`/PEM/bearer/assignment shapes).
- **0 NUL bytes across all 26 paths**, from a CANARY-VALIDATED byte
  probe (`wc -c` minus `tr -d '\000' | wc -c`): the positive canary
  `a\0b` reports 1 and the clean control reports 0. **And the naive
  probe was caught lying in the SAME run** — `LC_ALL=C grep -qP '\x00'`
  exits **1 on the positive canary**, failing to detect a real NUL. It
  is a false GREEN here, exactly as the previous checkpoint warned, and
  now demonstrated against a control rather than quoted.

## IPC 13 → 14, derived from BOTH ENDS — and both census traps moved

`repo_churn` is the fourteenth command, and `lib.rs` gains exactly three
lines: `pub mod churn;`, the command, one handler entry.

| end | derivation | count |
|---|---|---|
| attributes | `git grep -nE "^[[:space:]]*#\[tauri::command\]" -- '*.rs'` | **14** |
| handler | `generate_handler![…]` with `//` stripped per line, split on commas | **14** |

**`comm -3` over the two sorted NAME lists is EMPTY** — the ends agree
name-for-name, not merely in cardinality. The standing pins were
CORRECTED EXACTLY and never widened: `crescendo-dom.test.tsx`'s *"Rust
exposes exactly fourteen commands"* (13 → 14) and *"the frontend reaches
exactly the eleven commands it is allowed"* (10 → 11 named, plus the
three that go through one variable call site), both exhaustive `toEqual`
over sorted arrays, both green.

**BOTH TRAPS FIRED DIFFERENTLY THAN FORECAST, WHICH IS THE ARGUMENT FOR
DERIVING THEM.**

1. The dispatch brief said the unanchored `tauri::command` literal would
   read **14** repo-wide — the true count — and so agree by coincidence.
   **At this merged tree it reads 15**: 14 real attributes plus the one
   doc comment at `agent/mod.rs:24`. The brief described the PRE-merge
   arithmetic (13 real + 1 doc = 14). Post-merge the naive figure
   over-reads by exactly one. Same trap, opposite tell.
2. The brief said a naive comma-split of `generate_handler!` reads
   **15**; the card's second pass said **17**. **Neither reproduces**:
   commas-in-block + 1 gives **17** and non-blank comma segments give
   **21**. The naive figure depends entirely on the splitting recipe,
   which is exactly why the recipe has to be stated with the number.
   Strip comments FIRST, then count, and the answer is 14 by both ends.

## THE REGEN WAS THE BIG ONE, ITS FORECAST WAS STALE, AND IT RAN TWICE

**Re-derived at MY base, and the compounding trap is now measured rather
than warned about.** The branch forecast `119 → 126 files, 1018 → 1111
symbols, 1539 → 1687 edges` against a base two regens old. At the merge:

    committed:   588891 bytes · 119 files · 1023 symbols · 1550 edges
    fresh index: 643492 bytes · 126 files · 1116 symbols · 1698 edges
    files  +7  -0  ~8                                   -> index --check exit 1

**The FILE delta survived and the symbol/edge ABSOLUTES did not** —
exactly the split the previous checkpoint predicted. What is worth
recording is that the DELTAS are identical (+93 symbols, +148 edges) and
only the endpoints moved, so a reader checking the forecast by its
deltas would have concluded it was current.

**THE SECOND REGEN WAS NOT OPTIONAL AND ITS RED SHAPE IS SUBTLE.** After
regen 1 and the fixture edits, `index --check` exits **1** with

    committed:   643492 bytes · 126 files · 1116 symbols · 1698 edges
    fresh index: 643492 bytes · 126 files · 1116 symbols · 1698 edges
    files  +0  -0  ~2

— **both count lines present and IDENTICAL**, the whole signal in the
`~2`. The two fixture files I had just edited are indexed, so their
content hashes moved while nothing countable did. A reader who checks
the numbers and stops concludes CURRENT. Regen 2 moved the graph
`cdac6e6e…` → `c04d12bb…` and `index --check` exits **0**. It exits
**0** again after all the doc edits — `docs/` is `.nputerignore`d — so
two regens were needed and a third was not. T-064's lesson, and it is
the reason integrator.md splits the merge from the checkpoint.

## The moved fixtures — FIVE assertions across THREE bodies, not four

The forecast said "four failing bodies across two files", and it was
right about the BODIES and short by one about the ASSERTIONS. Corrected
ONE AT A TIME, each re-run before the next, each value DERIVED and never
read off the failure output — with a **POSITIVE CONTROL** throughout:
the same matcher, run against the graph committed at `11c82a1`,
reproduces every pinned value exactly.

| # | body | assertion | move |
|---|---|---|---|
| 1 | `architecture-dogfood` *"all N files map"* | `fileComponent.size` | 119 → **126** |
| 2 | same body | per-component tally | `C-05` 56 → **59**, `C-12` 14 → **18** |
| 3 | same body | **C-12's FILE LIST** | 14 → **18** entries |
| 4 | `architecture-dogfood` *"THE FINDINGS"* | `C-05→C-06` D1 `fileEdges` | +3 |
| 5 | `architecture-dogfood` *"the full relation table"* | three `observedCount` | see below |
| 6 | `map-dogfood-render` *"the header hint"* | `committed graph · N files` | 119 → **126** |

**#3 IS THE ONE THE FORECAST MISSED, and the file itself predicted the
class**: C-12's file list is a THIRD assertion in body 1, hidden behind
the tally, which is itself hidden behind the size check. Vitest
surfaced them strictly in that order — three sequential red runs on one
body. T-077's lesson one level deeper than T-077 stated it.

**#5 IS THE ONE THAT WOULD HAVE CORRUPTED TWO ROWS.** The failure diff
prints `10, 22, 6 → 13, 32, 7` positionally, and the third row is **`C-12
→ C-05` 6 → 7 — NOT `C-05 → C-14`, which also reads 6** and sits earlier
in the table. Derived by keying on `(from, to, relation)` against both
graphs: `C-05→C-06` 10 → 13, `C-05→C-12` 22 → 32, `C-12→C-05` 6 → 7.
**The relation table stays at 32 ROWS** and `map-dogfood-render`'s node
and edge counts HOLD — every new edge lands on a pair that already had
a row — and **the parser pin holds**: no component file moved, so
`lib/parser/test/smoke.test.ts` is untouched. Two of the three-fixture
rule's files moved; the third correctly did not.

## Ranges, every dot count stated, at their own refs

Main-before **`11c82a1`** (T-089's checkpoint, verified as the tip at
start), approved tip **`650fdbe`**, merge-base **`2036fb2`** (T-084's
checkpoint — the lane's own base, unmoved across two verdicts).

    git merge-tree --write-tree 11c82a1 650fdbe -> tree 931ba307…, exit 0 (read from $?)
    git diff --name-only 11c82a1 <TREE>                      -> 26   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 11c82a1...650fdbe   (THREE dots)    -> 26
    git diff --name-only 2036fb2..650fdbe    (TWO, branch-only) -> 26
    git diff --name-only 11c82a1..650fdbe    (TWO dots)      -> 210  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 2036fb2..11c82a1    (main's advance) -> 184
    git diff --name-only 11c82a1..6834287    (TWO dots)      -> 26   THE MERGE'S DIFF, the only one that means anything

`git merge-base --is-ancestor 11c82a1 6834287` exits **0**, so at the
merge two dots and three dots COLLAPSE (both 26). **THE FORBIDDEN COUNT
IS 210 AND IT IS LEFT-ENDPOINT DRIFT**: main advanced **184** paths from
the cut, the branch **26**, `comm -12` over the sorted lists is
**EMPTY**, and 184 + 26 = 210 — the arithmetic that proves the two sets
disjoint. The staged merge tree was byte-identical to the forecast
(`git write-tree` == `931ba307…`, the staged path list `diff`-identical
to the 26) and the merge's `HEAD^{tree}` IS that tree, with parents
`11c82a1` and `650fdbe` and nothing else. **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT**; every integrator edit is in this checkpoint.

## THREE standing gates — ALL THREE FIRE, first time in five checkpoints

Derived from the merge's own 26 paths. `grep -n "at any merge whose
diff" docs/CONVENTIONS.md` returns exactly **3** (lines 592, 717, 746),
the mechanical enumeration the brief contract prescribes.

| gate | trigger | on these 26 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **15 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **12 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **8 — FIRES**, three suites |

All three match the lane's own second-pass table exactly (15 · 12 · 8 of
26), re-derived here rather than inherited.

- **GRAPH REGEN — run twice**, above. `index --check` exit **1** at the
  merge, **0** after regen 2, **0** again after every doc edit.
- **BOOT GATE — exit 0**, both `[nputer]` lines, from `tools/e2e` on
  scratch port **14902**, bind-probed free on `127.0.0.1`, `0.0.0.0`,
  `::1` and `::` immediately before use and free again after.
- **DOCS GATE — exit 1 twice**, invoked DIRECTLY with the paths as
  ARGUMENTS and never through `xargs`. At the MERGE, on the range rule's
  own eight `docs/` paths: **three** suites owed — app, tools/e2e,
  lib/parser — and NOT cargo, because `docs/CONVENTIONS.md` is not in
  the merge's diff. At the CHECKPOINT, on this commit's own nine `docs/`
  paths: **FOUR** suites, cargo joining precisely because this
  checkpoint edits `docs/CONVENTIONS.md` and `agent/kit.rs` reads it.
  Both runs report **11 derived readers across 4 suites**, **0
  frontmatter issues**, a census of **118 docs-shaped sites in 22 files,
  11 root-anchored in 9 files**, and *every live task card's frontmatter
  parses, with a legal status* — the machine check on the three findings
  materialized here. All four owed suites were re-run AFTER the doc
  edits (T-081-s9).

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command.

- **parser: 263/263 across 12 files**, exit **0**; `npm run build` **0**
  FIRST (fresh-clone order); `npx tsc --noEmit` **0**. Re-run after the
  doc edits: 263/263, **0**.
- **app: 924/924 across 46 files**, exit **0** — and the arithmetic
  closes from both sides: main was 857 over 43, the lane took its own
  base 840 → 907 (+67), and 857 + 67 = **924** with 43 + 3 new files =
  46. **Two lanes that each passed alone did not break together.**
- **`npm run build` 0, 269 modules.** **The CSS hash is UNMOVED at
  `index-C86RloYb.css` / 45.06 kB** — byte-identical to the lane tip,
  which is the Tailwind content-scan check the gotcha asks for, and it
  says no accidental utility was minted by combining the two sides.
  **The JS hash MOVED and had to**: `index-WORLmrLf.js` (523.98 kB, the
  lane) and `index-DsNHI2Jr.js` (503.61 kB, main) both become
  **`index-Dn5vl5H1.js` 524.84 kB**, because main advanced FOUR bundle
  inputs since the cut — `App.tsx`, `InterviewChat.tsx`, `agent-store.ts`,
  `watcher-store.ts` — and neither parent's bundle contains the other's.
  A merged bundle equal to either parent would have been the surprise.
  Both TS programs typecheck.
- **bare Rust `cargo test --no-fail-fast`: 382 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines. 361 (main) + 21 (the lane's churn bodies) = 382. **The
  T-061-s4 kill-path flake did NOT fire on EITHER full run — honest
  tally 2 of 2 green, no re-run performed and none needed.**
- **CONVENTIONS' four live readers, all green.** The two kit tests were
  run BY NAME across all targets with the WHOLE output read, because a
  zero-match filter still exits 0:
  `snapshot_version_matches_the_live_method_stamps` and
  `every_compiled_entry_matches_its_method_file_byte_for_byte` — each
  **1 passed**, **13** result lines, **0** occurrences of `FAILED`, exit
  **0**. This checkpoint edits `docs/CONVENTIONS.md`, so both were owed.
  The other two readers, `workflow-parity` and `docs-input-gate`, ran
  inside the e2e suite — and the CONVENTIONS edit is in **Gotchas**, not
  **Build & test**, so no command bullet moved and workflow-parity's
  derivation is untouched.
- **E2E: 129/129**, exit **0**, scratch port **14901** at the merge and
  **14903** on the post-checkpoint re-run (each bind-probed free on all
  four stacks; a fresh port per run, since lanes collided on the default
  14520 yesterday); `npm run typecheck` **0** both times. Adds no spec,
  so equals main.
- **token lint: selftest 0, lint 0** — `clean (TOKEN 131 …; CONTROL 608
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8
  evidence-floor.
- **`cargo audit -n`** exit **0**, unmoved.

## CONTROL and TOKEN close from both directions

**TOKEN 124 (`11c82a1`) + 7 = 131 (merge)**, and the lint printed 131:
the merge adds exactly seven `.ts`/`.tsx` FILES under `app/src` or
`app/test` (`MapContainer.tsx`, `churn-source.ts`, `map-zoom.ts`,
`lib/architecture/churn.ts`, `map-churn.test.ts`,
`map-t1-t2-dom.test.tsx`, `map-zoom.test.ts`). Unchanged at the
checkpoint — this commit adds no `.ts`/`.tsx`/`.mjs` file under those
three roots.

**CONTROL 593 (`11c82a1`) + 15 = 608 (merge)**, and the lint printed
608: those same seven, plus `churn.rs`, plus the seven merged findings
`T-013-s1`…`s7`. This checkpoint adds three tracked docs
(`T-013-s8`/`s9`/`s10`), so **CONTROL is 611 at the checkpoint**.

## The poison drill — three mutants at the MERGED commit, arm (c)

Detached scratch worktree at **`6834287`** with `CARGO_TARGET_DIR` set
**INSIDE it** (`.drilltarget`, 1.4 GiB) — `T-013-s7` arm (c), which this
checkpoint also writes into CONVENTIONS. **Correspondence by hash before
any mutation**, and all three independently reproduce the values the
card quotes: `churn.rs` `44db08e9eb45f9fbf06ef7010b2c14df08565b32c0828839263dbb9d49bafbf5`,
`agent/runner.rs` `22d3bb1756b79ecc23a8ee0d096544a33bafc4d2d8dcea228e80b32ebc25d9aa`,
`map-layout.ts` `9bfc57ef834a07988d533d048df93d0fa58e69ac476b885d7ea774e406f078d8`.

Baselines: `cargo test -p nputer --lib` → **148 / 0, exit 0**; full app
suite → **924/924, exit 0** — after `npm run build`, which the drill
needed and which is recorded below.

| # | producer mutated (one side only) | suite | exit | red |
|---|---|---|---|---|
| M1 | `which_git`'s gate → the pre-T-060 `is_executable_file` | cargo | **101** | **1** — `a_git_reachable_only_by_a_relative_path_element_never_resolves`, `left: Some("target/…/git")` against `right: None` |
| M2 | `run_git` drops `env("PATH", …)` | cargo | **101** | **1** — `run_git_spawns_the_resolved_program_and_sets_the_childs_path` |
| M3 | `assignYs` applies the expansion height only when `column === 0` | app | **1** | **1 of 924** — *"T1: an expanded container pushes its OWN column's sibling — in a NON-ZERO column too"*, `expected 190 to be 280` |

**M1 IS THE VULNERABILITY ITSELF and it reds by name** — the single body
that fails is the one asserting a relative PATH element yields no
candidate, and under the mutant it yields one. **M3 is the mutant that
survived 906/906 in the first verdict**; it now reds exactly one body,
the pin the rebuild added, and the pre-existing *"EXPANDING A DIFFERENT
COLUMN"* body still survives it — which is precisely the gap that pin
fills. Every mutation was read back with `git diff` before its suite ran.
Each restored by byte copy from `git show 6834287:<path>`, proved by an
empty per-path `git diff` AND sha256 back to the recorded value, with
both suites re-run GREEN at the restored state (**148/0** and
**924/924**).

**ARM (c) IS NOW MEASURED, NOT RECOMMENDED.** The MAIN checkout's
`target/` mtime was **identical before and after** three mutants and
four suite runs — no pollution, and no `cargo clean` to pay. Two things
the finding did not name went into CONVENTIONS with it: the verifier's
ruling that "drill in place" is CORRECT but NARROW (true of the
instance, not the class — the mechanism is a compile-time constant cargo
does not track, and in-place drilling substitutes a dirty working tree),
and that **a fresh worktree also has no `app/dist`**, so the app suite
cannot be drilled until it is built — **14 failures across SIX files**
on the unbuilt drill, where CONVENTIONS' LANE PROTOCOL bullet still says
FIVE. T-013's own `map-t1-t2-dom.test.tsx` is the sixth. The drill also
reproduced the merged tree's bundle byte-for-byte
(`index-C86RloYb.css` / `index-Dn5vl5H1.js`), an independent
confirmation of the build. Symlinked `node_modules`/`dist` were
UNLINKED rather than deleted, `.drilltarget` and `app/dist` removed, the
worktree removed and pruned, and the main checkout's installs verified
intact.

## The verdict's residuals — three arrived as CARD TEXT and are FILES now

The APPROVED verdict raised three non-blocking findings, **F7, F8 and
F9, and none of them existed as a file.** The T-061 hazard repeated in
full. Materialized here, crediting the verifier:

- **`T-013-s8`** (F7) — the shared gate checks SHAPE and never IDENTITY,
  so `$SHELL` pointing at a fake `zsh` inside the project still
  executes: the ONE variant of fourteen that ran. Pre-existing,
  byte-unchanged by this card, reachable only from the parent
  environment; what T-013 changes is FREQUENCY. The remedy is
  **caller-side** — refuse a resolved program that `starts_with(root)`,
  one line — and must NOT touch the shared gate, or the two doors
  diverge, which is the thing the refactor exists to prevent.
- **`T-013-s9`** (F8) — the env list is right at twelve and can never be
  complete: `HOME` reaches the same configuration surface and cannot be
  removed from a git child. Two sentences in `GIT_ENV_REMOVED`'s doc
  comment so length stops reading as coverage.
- **`T-013-s10`** (F9) — two stale figures, both re-derived here.
  `churn.rs` property **2** still reads ``Command::new("git")`` while
  property **0** says the resolved absolute program is used, so a reader
  grepping for the bare-name spawn finds a sentence saying it is still
  there. And "grows it to 1118" is **1158** (`wc -l` 1158; `git diff
  --numstat c7528cc 650fdbe` is +382 −16; 792 + 382 − 16 = 1158) — and
  it appears **three** times, not the two the verdict says.

`T-013-s7` is DISCHARGED by this checkpoint (CONVENTIONS now carries arm
(c)), recorded in its own body and left at `status: suggested`, because
discharging a finding is not the integrator's call to record as
promoted, parked or rejected.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THEIR APP RELAUNCHED, AND THE TRIGGER IS PINNED TO THE SECOND.**
   Pid **22955** (started 21:04:25) is gone; pid **93529** started
   **22:47:50**, under the SAME supervisor chain (`npm run tauri dev`
   82342 → `tauri dev` 82364 → the binary). The merge commit is stamped
   **22:48:20** — so the relaunch happened **thirty seconds BEFORE the
   commit**, at the `git merge --no-ff --no-commit` WORKING-TREE WRITE,
   which is T-064's integrator's finding reproduced (they measured ten
   seconds). **BOOT GATE derived 12 of 26 and the window moved**: the
   gate's trigger set predicts the human's window in the POSITIVE
   direction, the previous checkpoint having confirmed it in the
   negative. The app has been stable at 93529 through the entire
   checkpoint, which touches no `app/src/**` or `app/src-tauri/**`.
2. **The map pane sees a NEW graph, and that is the point of the card.**
   `docs/architecture/graph.json` moves 588891 → **643492** bytes, 119 →
   126 files, 1023 → 1116 symbols, 1550 → 1698 edges. No component,
   relation-table ROW or drift ring moved; three `observedCount` values
   and one D1's file-edge list did.
3. **`app/dist` was rewritten** by the pre-suite `npm run build`, to a
   NEW JS hash (`index-Dn5vl5H1.js`) and an UNCHANGED CSS hash — vite
   dev does not serve from `dist`.

**No process from this integration survives.** Four scratch ports were
used, each bind-probed free on all four stacks immediately before use
and free again after: **14901** (e2e at the merge), **14902** (BOOT
GATE), **14903** (e2e re-run after the checkpoint edits) and **14904**
(the e2e re-run after this file's own last write — `docs/STATE.md` is a
docs code input owing exactly ONE suite, which the gate confirms and
T-081-s9 requires, so the run that validates the sentence you are
reading is 129/129 at exit 0). None is the default 14520. **No `pkill` at any
point.** No `npm ci` / `npm install` was run in the main checkout. The
T-013 worktree is removed and the branch kept; the drill worktree is
removed and pruned. The two `nputer-T-060` `fake_agent` orphans
(`52504`/`52505`, ppid 1) are unchanged and left alone (T-043-s1). **The
untracked zero-byte file `z`** still sits in the main checkout — not
mine, not staged, left alone for the second checkpoint running.

**The shared capture fixture was checked BEFORE the merge**, as the
brief asked: `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
is byte-identical to `HEAD` (sha256 `273a3d33…`, empty `git diff`). Nine
cards read it; a sibling lane had left it mutated on disk when the
network dropped, and it is restored.

## The board, derived from disk at this checkpoint

**178 flat task files, 69 done / 39 planned / 28 parked / 42 suggested /
0 verifying**; 69 + 39 + 28 + 42 = 178. Twenty-two files sit in
`docs/tasks/rejected/`, counted separately. The deltas from `11c82a1`
are T-013 verifying → done, the seven merged `T-013-s1…s7`, and the
three materialized here. Every flat card's `status:` is in the parser's
vocabulary (the docs gate confirms it whole-tree).

**THREE LIVE LANES AND ZERO CARDS AT `status: building`** — the lapse the
merged TASK-FORMAT bullet rules on, still live on this board. The
authority on what is being built is `git worktree list`
(lane-protocol rule 7).

## Provenance and health

T-013 is **built by `claude-opus-5` (two executors) and verified by
`claude-opus-5` (two passes)**, `review: same-model`, **rejected then
approved**. **69 done cards — 54 `same-model`, 9 `self-verified`, 5
`independent`, 1 EMPTY (T-056)**; 54 + 9 + 5 + 1 = 69. T-013 moves
`same-model` from 53 to 54.

At this checkpoint main contains T-013's merge `6834287` plus this
checkpoint. Parser, app, Rust, E2E, token lint and its selftest, `cargo
audit`, the graph-currentness gate and the docs gate are all green;
**all three standing gates DERIVED, and for the first time in five
checkpoints all three FIRED and all three were run.** Nothing is broken.
**Known residuals of the delivered artifact are filed, not hidden**:
`T-013-s1` (a git subprocess cannot be fenced to `app-map` — the
dispatch error, addressed to the planner), `T-013-s2` (the frontend IPC
census reads comments and misses untyped invokes; one end strips
comments and the other does not), `T-013-s3` (no wall-clock bound on the
churn subprocess and no server-side single-flight), `T-013-s4` (the
figure is file edits, not commits), `T-013-s5` (churn is measured once
per mount and never ages), `T-013-s6` (the container's width — the
criterion says one column and the design bundle draws three),
`T-013-s7` (discharged here), and the three materialized above.

## In progress / broken right now

**THREE SIBLING LANES ARE LIVE and all three are DISJOINT from this
merge** — `comm -12` over each lane's branch-only path list against this
merge's twenty-six returns **0**. **Tips are READINGS, not facts**: all
three moved during this integration, and all three went from zero
commits to real ones.

| lane | branch | tip (read at this checkpoint) | branch paths | base | overlap |
|---|---|---|---|---|---|
| **T-085** | `task/T-085-package-relative-docs` | `a3f2d89` | 5 | `a15b78e` | **0** |
| **T-097** | `task/T-097-aliased-column` | `7e051e1` | 7 | `a15b78e` | **0** |
| **T-101** | `task/T-101-denial-visible` | `0e9c045` | 5 | `a15b78e` | **0** |

**ALL THREE ARE CUT AT `a15b78e`, WHICH IS NOW TWO CHECKPOINTS BEHIND**
— T-089's `11c82a1` and this one. Their `touches:` are `[tools/e2e]`,
`[app-board]` and `[app-interview]`, all disjoint from T-013's fence, so
the disjointness is real and not luck. But **whoever integrates them
must re-derive the regen forecast against THIS checkpoint's graph** —
1116 symbols / 1698 edges, up from 1023 / 1550, moved by the merge this
checkpoint records. A forecast computed against 1023/1550 or 1018/1539
is stale; **the regens COMPOUND, and T-013 is the third card in a row to
pay for it.**

`task/T-013-semantic-zoom` is kept as a branch and its worktree is
removed.

## What in the dispatch brief was wrong or stale

Recorded because the brief asked, and because two of these would have
produced a wrong number if trusted.

1. **"the unanchored `tauri::command` literal reads 14 repo-wide … so it
   will now agree with the true count by coincidence."** It reads
   **15** at the merged tree. The coincidence was a property of the
   PRE-merge count (13 real + 1 doc); after the merge the naive figure
   over-reads by one. The warning was right and its arithmetic was
   half a merge old.
2. **"a naive comma-split of `generate_handler!` reads 15."** It reads
   **17** or **21** depending on the recipe, and the card's own second
   pass said 17. A naive count is not one number.
3. **"ARCHITECTURE … C-13/C-15's relations."** **There is no C-15** —
   the registry holds eleven components, C-01 and C-05…C-14. The
   relations that moved are `C-05→C-06`, `C-05→C-12` and `C-12→C-05`,
   and **C-13 did not move at all**.
4. **"the column-0-only `assignYs` … reds 1 of 907."** Correct in shape,
   stale in denominator: **1 of 924** at the merged tree.
5. **"a third `#[ignore]`… the naive grep returns 11."** The naive grep
   now returns **90** — the card's own text carries the word many times.
   The anchored count is still 3.
6. The brief's other warnings all held: the regen forecast was stale
   exactly as predicted, `acl_pin.rs` had not moved, both NUL greps lie,
   the DOCS GATE must be called directly, the human's app relaunched at
   the working-tree write, and the T-061-s4 flake did not fire.

## Next up

1. **`T-013-s1` is the sharpest and it is addressed to the PLANNER, not
   to a coder.** T-013 was dispatched `[app-map]` for a criterion that
   cannot be built inside that fence — a subprocess needs a Tauri
   command, registering one edits `lib.rs` (`app-shell`), and reusing
   the ratified resolved-path gate edits `agent/runner.rs`
   (`app-agent`). The fence was widened TWICE from inside the lane,
   which lane-protocol rule 5 forbids, and BOTH widenings were ruled
   correct because the alternative was worse in every branch. **The
   method has no in-flight channel for "my fence just grew"** — a
   finding on a card is read at triage, not while three other lanes are
   live. `docs/rooms/` is the nearest thing and nobody opened one.
2. **`T-013-s8`'s one-line hardening is cheap and the reasoning is the
   valuable part**: refuse a resolved program under the project root,
   caller-side only. Do not put it in the shared gate.
3. **`T-089-s1` still has a deadline-shaped cost.** The method version
   is owed a bump to v0.1.6 and CONVENTIONS still carries the two
   sentences admitting the debt. It is a THREE-FILE commit plus an
   unpinned fourth hand-edit, it needs a fence including `app-agent` —
   **and `app-agent` is free again as of this merge**, since T-013 was
   the lane holding it. Do not split it: the two asserts are ORDERED.
4. **`T-089-s9`, `s10` and `s11`** are unchanged and still one pass in
   `method/roles/executor.md`.
5. **Triage the FORTY-TWO suggestions.** T-013 deposited ten of them —
   seven from the lane and three materialized here — which is the
   largest single deposit this board has taken.
6. **The lane list beat the board for the second checkpoint running.**
   Three live worktrees, zero cards at `status: building`. The merged
   `orchestrator.md` 5b owns the stamp and the order; it has not been
   exercised yet.
