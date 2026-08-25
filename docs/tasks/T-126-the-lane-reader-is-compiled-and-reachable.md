---
id: T-126
title: The lane reader is built, verified three times, and compiled into nothing — one module declaration and one zero-argument command stand between F-04 and its own data
feature: F-04
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-126 — code commit 0fa83da
verified_by:
review:
---

Absorbs (ninth triage, 2026-08-25): T-110-s1 — file removed in this
commit.

**MEASURED AT MAIN `e04f5b3`: `git grep -c "mod dispatch" app/src-tauri/src/lib.rs` returns `0`.**
T-110 merged `app/src-tauri/src/dispatch/**` — a lane reader that was
rejected twice, waived once by @human, rebuilt by two fresh executors and
approved on a third verification pass — and **rustc compiles no file that
no module declares.** The whole thing is dead code on main right now.

## Why the fence made this correct, and why it must not stay

T-110's fence was `[app-dispatch]` = C-15. The `mod` line lives in
`app/src-tauri/src/lib.rs`, which is C-05's `app-shell`, and `app-shell`
was held by a live lane at every one of T-110's three dispatches. Its
executors routed this rather than widening — the right call three times
over, and the third verifier ruled the fence argument sound. **The defect
is not the routing; it is that the routing had nowhere to land**, so a
card can be verified to a very high standard and still ship into a void.

**AND IT IS ALREADY MISLEADING SOMEBODY.** `T-111` is in flight as this
is written, deriving a board disposition from the lane set. Its TypeScript
half compiles against `app/src/lib/dispatch-store.ts`, which is real — so
T-111 can be built and pinned and merged **while the data it renders can
never arrive**, because nothing on the Rust side is compiled to produce
it. The board would show a correct-looking empty answer.

## What "not compiled" was measured to mean

T-110's own third pass recorded the sharp version: a planted **type
error** in `lanes.rs` leaves `cargo build` at exit **0**. The suite is
green because the lane's own bodies reach the module through
`app/src-tauri/tests/dispatch_lanes.rs`, a two-line `#[path]` shim that
compiles it as part of a test target. **So the tests prove the code
works and prove nothing about the app containing it.**

## Acceptance criteria

- **`lib.rs` SHALL DECLARE THE MODULE**, so `app/src-tauri/src/dispatch/**`
  is compiled as part of the binary rather than only as part of a test
  target. **A PIN SHALL SHOW THAT IT IS**: a planted type error in
  `dispatch/lanes.rs` SHALL make `cargo build` fail. Today it exits 0,
  which is the whole finding — the assertion that reds must be one that
  is red today.
- **THE READER SHALL BE REACHABLE FROM THE WEBVIEW BY ONE
  ZERO-ARGUMENT `#[tauri::command]`**, registered in `generate_handler!`
  in the same commit. Zero arguments is not a style preference here: it
  is ADR-012's "narrowness lives in the command's own signature", and
  every one of this app's existing commands that takes no caller input
  takes none. **No path, no branch name and no task id crosses the
  boundary inbound.**
- **THE IPC CENSUS SHALL BE DERIVED FROM BOTH ENDS AND INTERSECTED BY
  NAME**, the discipline every command-adding card here has used:
  count line-anchored `#[tauri::command]` attributes, count
  `generate_handler!` entries, sort both name lists and require
  `comm -3` to be EMPTY. State the before and after counts.
- **`acl_pin.rs` SHALL BE A 0-FILE DIFF at its pinned 92-grant hash.**
  An app command is not a webview grant (ADR-012, applied rather than
  reopened) — if the grant set moves, something is wrong with the
  approach rather than with the pin.
- **THE COMMAND SHALL NOT READ THIS REPOSITORY'S OWN `.git` IN ANY
  TEST.** Lanes come and go while a suite runs, so a body asserting
  against the live worktree list is non-deterministic by construction —
  T-110's card says so in as many words and its criteria are the
  precedent. Fixtures in a temp directory.
- IF wiring reveals that the reader's public surface does not fit a
  zero-argument command — for example that it needs the project root the
  shell already holds — THEN say so and route it rather than adding an
  argument to make it fit. **The shell knowing the open project is not
  the webview supplying it.**
- **THE TWO-LINE `#[path]` SHIM SHALL BE ADDRESSED, NOT INHERITED.**
  `app/src-tauri/tests/dispatch_lanes.rs` exists only because the module
  was unreachable; once `lib.rs` declares it, state whether the shim is
  still needed and delete it if it is not. `T-110-s9` records that this
  file is currently the tree's ONLY unmapped file — this repository's
  first D2 finding — so removing it may drain that finding too. Check
  and report either way.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines **and the count derived, not just the exit**), plus
`npm test` from app/ if any payload shape moves. **POISON DRILL on every
new or changed assertion**, one side only, producer mutated and never the
assertion, mutated text read back with `git diff` before its run,
restores proved per-path by sha256, in a detached scratch worktree with
its own `CARGO_TARGET_DIR` inside it, **named for this lane and placed
OUTSIDE the repository** (`T-052-s2`). The BOOT GATE fires on
`app/src-tauri/**` — run it and record the exit and both `[nputer]`
lines; **it is the gate that matters most here**, because the failure
this card fixes is precisely one that every suite passes and only a real
build catches. GRAPH REGEN fires on `*.rs` since `e1f3023`; ask
`index --check` rather than predicting. @human: none.

## Implementation notes (executor, 2026-08-25)

Branch `task/T-126-lane-reader-compiled`, cut from `41900d6`. Code commit
**`0fa83da`**. Three files: `app/src-tauri/src/lib.rs`,
`app/test/crescendo-dom.test.tsx`, and the deletion of
`app/src-tauri/tests/dispatch_lanes.rs`.

### THE FINDING REPRODUCES, AND IT REPRODUCES IN BOTH DIRECTIONS

The card rests on one measurement and it holds exactly. Same mutation,
same byte, same drill worktree, one commit apart — `TASK_ID_MAX_DIGITS`
in `dispatch/lanes.rs` changed from `6` to `"six"`, read back with
`git diff` before every run:

| tree | command | exit | what it said |
|---|---|---|---|
| base `41900d6` | `cargo build` | **0** | `Finished dev profile`, zero errors |
| base `41900d6` | `cargo check --test dispatch_lanes` | **101** | `error[E0308]`, `could not compile nputer (test "dispatch_lanes")` |
| tip `0fa83da` | `cargo build` | **101** | `error[E0308]`, `could not compile nputer (lib)` |

**The third row is the criterion and the word that matters in it is
`(lib)`.** Before this commit the only thing that could see a type error
in `dispatch/lanes.rs` was a TEST TARGET; now it is the library the
binary links. Restored per path by sha256
`52df6541c7dbae1ec92e9fb53959a0cedd4611838059ea80d5da9776079744cc`,
matching `git show HEAD:app/src-tauri/src/dispatch/lanes.rs` exactly.

### THE IPC CENSUS, BOTH ENDS, INTERSECTED BY NAME

| | line-anchored `#[tauri::command]` | `generate_handler!` entries | `comm -3` |
|---|---|---|---|
| before (`41900d6`) | **14** | **14** | **EMPTY (0 lines)** |
| after (`0fa83da`) | **15** | **15** | **EMPTY (0 lines)** |

Every attribute in the tree is in `lib.rs` (derived, not assumed: the
`grep -rn --include='*.rs'` over `app/src-tauri/src` returns that one
file at both refs). The one added name is `dispatch_lanes`. It is
deliberately NOT in `frontendCommands()` — the criterion asks the reader
to be REACHABLE, and no criterion asks the shell to call it yet.

`acl_pin.rs` is a **0-file diff**: `git diff --name-only 41900d6 --
app/src-tauri/src/acl_pin.rs app/src-tauri/capabilities
app/src-tauri/tauri.conf.json` returns **0** paths, and the working file's
sha256 is
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` —
byte-identical to the base blob and the same `8d24cbad…` five checkpoints
have quoted. `EXPECTED_GRANTS` holds **92** entries, counted from the
constant rather than transcribed, and all seven `acl_pin::` bodies read
by NAME as `ok`. An app command is not a webview grant.

### THE `#[path]` SHIM — DELETED, AND `T-110-s9` WAS ALREADY DRAINED

**The card and the dispatch brief are both wrong about this one, and
saying so is the useful part.** They say the shim is *"currently the
tree's ONLY unmapped file — this repository's first D2 finding — so
removing it may drain that finding too."* It is not, and it does not.
**T-033 already drained it**, by claiming the path in C-15's own
`paths:` with the comment `# T-033 settlement, see below` and a
disclosed paragraph arguing it from T-010's precedent (routed as
`T-033-s8`). Measured against the committed graph at this base:
`arch --root ../..` reports `unmapped=0`, `findings=3`, and the only
undeclared edge is `C-10 -> C-14`. `T-110-s9`'s EDIT TWO was discharged
by somebody else; its **EDIT ONE is still live and still unfixed** — the
component file still says the TS half joins, which stopped being true at
T-110's rebuild.

The shim is **not needed** and is deleted. With `lib.rs` declaring the
module, `#[path]` would compile `dispatch/**` a SECOND time and run its
34 bodies twice; the file's own header says the commit taking `T-110-s1`
removes it. What removing it actually does is leave C-15's `paths:`
naming a file that no longer exists — `T-126-s3`.

### THE COMMAND, AND THE ONE THING THAT DID NOT FIT

`dispatch_lanes` is zero-argument in ADR-012's sense: the project root
comes from `WatchState` (the `repo_churn` / `index_repo` pattern) and
`tauri::State` is an extractor Tauri fills in, not caller input. The
webview's whole call is `invoke("dispatch_lanes")`.

`LaneScan` answers five ways about a FOLDER and every one presumes there
is one, so the wrapper `DispatchLanesOutcome` names the sixth fact — no
project is open — rather than smuggling it in as another empty list. It
is declared in `lib.rs` because `dispatch/**` is C-15's path.

**Criterion 6 fired once, and it fired on the JOIN rather than on the
reader.** `join::join_lanes(scan, board)` needs the board's stamps, and
the board is parsed in TypeScript — so a joining command would have to
take them as an argument, which is exactly what the criterion forbids.
Routed as `T-126-s2` rather than fitted. The READER needed nothing: the
project root the shell already holds is not the webview supplying it.

### POISON DRILL — FOUR ASSERTIONS, FOUR REDS, EVERY KILL MEASURED UNIQUE

All in `/Users/ujju/Projects/drill-T-126`, a DETACHED worktree outside
the repository with its own `CARGO_TARGET_DIR` at `.drilltarget/`
(`T-052-s2`). One side only, the PRODUCER mutated and never the
assertion, every mutation read back with `git diff` BEFORE its run.

**Uniqueness is measured rather than asserted**, per the warning T-116's
verifier earned tonight: each row below reports the whole suite's
pass/fail split, not the exit.

| # | assertion | producer mutation | result |
|---|---|---|---|
| 1 | `no_open_project_is_its_own_outcome_and_never_a_folder_refusal` (NEW) | `None` arm returns `Answered { NotAGitRepository }` | lib suite **196 passed / 1 failed** — this body alone; its sibling `ok` |
| 2 | `the_command_seam_returns_the_lane_git_wrote_down_under_the_open_project` (NEW) | `read_lanes(root)` becomes `read_lanes(&root.join("nowhere"))` | lib suite **196 passed / 1 failed** — this body alone; body 1 `ok` |
| 3a | `the lane reader is declared in the BINARY crate…` (NEW) | `pub mod dispatch;` loses its `pub` | app suite **962 passed / 1 failed** — this body alone |
| 3b | the same body | `#[cfg(test)]` inserted above the declaration | app suite **962 passed / 1 failed** — this body alone |
| 4 | `Rust exposes exactly fifteen commands…` (CHANGED) | `dispatch_lanes,` removed from `generate_handler!` | app suite **962 passed / 1 failed** — this body alone; body 3 `ok` |

Drills 1 and 2 discriminate the two Rust bodies FROM EACH OTHER, which
is the point of designing two mutations rather than one. Drills 3 and 4
discriminate the declaration pin from the census. The lib target is the
whole population that could observe drills 1–2, derived rather than
assumed: `dispatch_lanes_at` is a private fn of the lib crate, so no
integration target and no sibling crate can reach it. The app suite is
the whole population for 3–4, and the derivation is that
`crescendo-dom.test.tsx` and `startup-recovery.test.ts` are the only app
bodies that read `src-tauri/src/lib.rs` at all.

**SHAPE SIX, asked rather than assumed.** Does any other body already
drive these calls? For 1 and 2: no — `dispatch_lanes_at` is new and has
no other caller in the tree, and the two mutations above prove neither
body is a duplicate of the other. For 3: no body in the repository read
`lib.rs`'s module declarations before this one; the census one test up
reads only the `generate_handler!` list, and drill 4 proves it. For 4:
it is a changed assertion whose own mutation reds it alone.

**AND THE TWO TS BODIES CLOSE A LOOP NEITHER CLOSES ALONE, measured.**
Under drill 3b's `#[cfg(test)] pub mod dispatch;`, `cargo build` exits
**101** with `error[E0433]: cannot find module or crate dispatch` —
because the command references it from non-test code. So the `cfg(test)`
regression is only reachable if the COMMAND is deleted too, and that is
what the census body catches. Declaration pin catches the cfg; census
catches the removal; neither alone covers the pair.

### THE GRAPH CANNOT SEE THIS DEPENDENCY, AND THAT IS THE SHARPEST THING HERE

`index --check` from `app/src-tauri` exits **1, a REAL stale** — read off
the SECOND line as this project's own trap requires, because it prints
both counts and a file diff rather than `committed: MISSING`:

    committed:   925217 bytes · 178 files · 1968 symbols · 1886 edges
    fresh index: 925662 bytes · 177 files · 1971 symbols · 1886 edges
    files  +0  -1  ~2
    | - app/src-tauri/tests/dispatch_lanes.rs
    | ~ app/src-tauri/src/lib.rs  (content, loc 761 -> 947, symbols 26 -> 30)
    | ~ app/test/crescendo-dom.test.tsx  (content, loc 686 -> 726)

**EDGES ARE UNMOVED AT 1886**, and that is not a relief — it is a
finding. `lib.rs` now genuinely depends on C-15: it declares the module
and calls `dispatch::lanes::read_lanes`. C-05's `depends_on` does not
list C-15. **No drift finding appears anyway**, because the indexer's
Rust edge extraction records `use` imports and nothing else — a `mod`
declaration plus a fully-qualified path expression produces no edge at
all. Measured two ways rather than inferred: the fresh index gains zero
edges, and a full regen in the throwaway drill leaves the set of
dispatch-mentioning edges **byte-identical at 29** with `arch` still
reporting `C-10 -> C-14` as the only undeclared one. A real dependency
the map is structurally unable to observe is `T-126-s4`.

The regen is the CHECKPOINT's by written rule, so no regenerated graph is
committed here.

**One more thing the drill measured, and it is `T-110-s4` live.** The
regen inside the drill worktree indexed **194** files against the lane's
177, and all 17 extras are `.drilltarget/debug/build/*/out/*.rs|js` —
cargo build-script output. `.nputerignore` excludes `target/` by name, so
the drill target dir that `T-052-s2` requires to sit INSIDE the drill
worktree is walked by the graph. Harmless here (throwaway tree, nothing
committed) and worth knowing before somebody regenerates in one.

### SUITES AND GATES, every exit read unpiped from its own `$?`

Order per CONVENTIONS, and the parser was built FIRST because a merged
main cannot build the app until it is: `npm ci` + `npm run build` from
`lib/parser` (exit 0, 0), then `npm install` + `npm run build` from
`app/` (exit 0, 0).

- **cargo, bare `cargo test --no-fail-fast` from `app/src-tauri`:
  462 passed / 0 failed / 3 ignored, exit 0**, SUMMED over **15**
  `test result:` lines, count DERIVED. Base at `41900d6` re-measured in
  the drill: **460 / 0 / 3 over 16 lines**. The arithmetic closes
  exactly: the `dispatch_lanes` test target is gone (16 → 15 lines), its
  **34** bodies moved into the lib target (161 → 197), and the two new
  bodies are the whole of 460 → 462.
- **THE CLOCK TEST: the lib suite ran in 3.98s (base 4.30s) — the GREEN
  band**, under 9.5s against a red band over 14.6s. Target dir was fresh
  in both trees. **Both known intermittents were read BY NAME, not
  inferred from a green exit**: `startup_arm_watches_the_initial_root`
  `ok`, `a_hostile_session_id_in_the_init_line…` `ok`. ONE run each; no
  second run to declare.
- **app: `npm run build` exit 0** (both `tsc` programs plus vite) ·
  **`npm test` 963/963 across 46 files, exit 0**. Main reads 962; the one
  new body is the whole difference.
- **BOOT GATE — FIRES on 2 of the 3 paths, exit 0.**
  `NPUTER_BOOT_PORT=15126 npm run boot:check` from `tools/e2e`, and both
  lines observed: `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-126` and `[nputer] window "main"
  created`. **This is the gate that matters here** — it is the only one
  that runs the binary this card exists to put the module inside.
- **GRAPH REGEN — FIRES on 3 of 3** (two `.rs` and one `.tsx` outside
  docs/); asked rather than predicted, exit 1 STALE, figures above.
- **DOCS GATE** — derived from the range and reported below.

### THE RANGE, at the ref it was measured at

**Main moved TWICE while this lane was open** — `ca5fb96` → `a649766` →
**`540ae0f`** — so the ref is named rather than implied.

    git merge-tree --write-tree 540ae0f HEAD  -> exit 0 (read FIRST), tree 1d9b6ba
    git diff --name-only 540ae0f 1d9b6ba      ->  3   THE PRESCRIBED FORM
    git diff --name-only 540ae0f..HEAD  (TWO dots, FORBIDDEN) -> 18
    git diff --name-only 540ae0f...HEAD (THREE dots)          ->  3
    git diff --name-only 41900d6..540ae0f (main's own advance) -> 15

The forbidden two-dot form overstates by **6.0x**, and it is pure
left-endpoint drift: `comm -12` over the sorted lists is **EMPTY**, the
union is **18** paths, and 15 + 3 = 18 — checked as SETS and not only as
counts.

### WHERE THE BRIEF AND THE CARD ARE WRONG

1. **`T-110-s9` is not drainable by this lane, because T-033 already
   drained it.** Both the card and the brief say the shim is the tree's
   only unmapped file. It has not been since T-033 claimed it in C-15's
   `paths:`; `arch` reports `unmapped=0` at this base. What survives of
   that finding is EDIT ONE (stale prose), which this lane cannot reach.
2. **The brief's lane list was wrong, as three consecutive briefs before
   it were.** Derived from `git worktree list` at `41900d6`: six lanes —
   T-091 `[tools/e2e]`, T-104 `[method/, docs/CONVENTIONS.md, app-agent]`,
   T-108 `[docs/tasks/]`, T-116 `[app-map]`, T-129 `[crate-index]` and
   this one. STATE's table lists four and omits T-104 and T-126. T-116's
   `-verify` tree is gone and T-116 now holds a real branch.
3. **The card mandates an edit no fence contains.** Criterion 7 requires
   the shim be deleted; the shim is C-15's `app-dispatch`, and this
   card's `touches:` is `[app-shell]` alone. Made on the card's own
   authority and disclosed here — `app-dispatch` is held by no live lane
   — which is `T-033-s4`'s exact shape. `T-126-s5` carries it.
4. **`T-108` holds `[docs/tasks/]`, which is every card on the board**,
   including this one — so no lane that stamps its own card is disjoint
   from it. Also `T-126-s5`.
5. The brief's e2e reference (146/146) was superseded mid-lane by T-091's
   merge; this lane owes no e2e run and did not make one, so it states
   no figure for it.

## Verification (adversarial verifier, claude-opus-5, 2026-08-25)

**APPROVED.** Every criterion independently reproduced in my own detached
worktree `/Users/ujju/Projects/verify-T-126` (tip `cc49f81`) with its own
`CARGO_TARGET_DIR` inside it, plus a base worktree at `41900d6`. BOUNDED
READ honoured: the card was read at `41900d6` and the attack set written
down at **18:17 EEST**, before the lane's diff, notes, tests or status
were opened.

### The load-bearing table — all three rows reproduce, and more sharply

| tree | command | claimed | MEASURED |
|---|---|---|---|
| `41900d6` | `cargo build` | 0 | **0**, `Finished dev profile`, **zero** E0308 anywhere in the log |
| `41900d6` | `cargo check --test dispatch_lanes` | 101 | **101**, `could not compile nputer (test "dispatch_lanes")` |
| `cc49f81` | `cargo build` | 101 `(lib)` | **101**, `could not compile nputer (lib)`, zero `(test`/`(bin` in any failing line |

Exits read unpiped from `$?`; the mutation read back with `git diff`
before every run; `lanes.rs` restored to sha256 `52df6541c7dbae1e…` after
each. **The mechanism is visible in the error path itself and the lane
undersells it**: at base rustc names the file `tests/../src/dispatch/lanes.rs`
— reached only through the shim's `#[path]` — and at tip it names
`src/dispatch/lanes.rs` directly. That contrast is independent proof of
the claim, not just its exit code.

**The subtree, not one file (my mutant, stronger than the pin).** A type
error planted in `dispatch/join.rs` rather than `lanes.rs` also exits
**101 `(lib)`**. So `dispatch/**` is compiled, not merely the one file
the pin names — the criterion is met in full rather than in letter.

### My own mutants, beyond the lane's

| # | mutation | result |
|---|---|---|
| M-A | type error in `join.rs` (not `lanes.rs`) | **101 `(lib)`** — whole subtree compiled |
| M-B | `#[cfg(test)]` on the declaration, command kept | **101, E0433** — the lane's bonus claim, confirmed |
| M-D | `pub` dropped, no type error | **0**, with **17** dead-code warnings — the lane's "a warning per item", measured |
| M-D2 | `pub` dropped **plus** planted type error | **101 `(lib)`** — the pin does **not** depend on `pub` |
| M-E | command fn deleted, handler entry kept | **101**, `cannot find macro __cmd__dispatch_lanes` — a dangling registration cannot ship |
| x7 | declaration deleted outright | app suite **962/1**, the pin fires via `toHaveLength(1)` |
| x8 | `#[cfg(test)] pub mod dispatch;` on **one line** (regex-evasion attempt) | app suite **962/1** — the pin **cannot** be evaded that way |

All restores proved per path by sha256; both worktrees end clean.

### Poison-drill uniqueness — re-measured BY NAME, T-116's lesson applied

Every row re-run against the **whole** population and the failing bodies
read by name, not counted:

| drill | failing bodies (by name) | split |
|---|---|---|
| None-arm swap | `no_open_project_is_its_own_outcome_and_never_a_folder_refusal` — **1** | 196/1 |
| wrong-root swap | `the_command_seam_returns_the_lane_git_wrote_down_under_the_open_project` — **1** | 196/1 |
| `pub` lost | the declaration pin — **1** | 962/1 |
| `#[cfg(test)]` inserted | the declaration pin — **1** | 962/1 |
| handler entry removed | `Rust exposes exactly fifteen commands…` — **1** | 962/1 |

**Uniqueness holds and the evidence holds with it** — exactly one FAILED
body each, across all 15 cargo targets and all 46 app files. T-116's
failure mode (true claim, false evidence) does **not** recur here. The
wrong-root mutation is genuinely discriminating rather than lucky: it
sends the reader to a sibling that is also not a git repository, so the
other body's control still passes.

### The other claims

- **IPC census, derived by me at both refs**: attributes **14 → 15**,
  `generate_handler!` entries **14 → 15**, `comm -3` **EMPTY at both
  refs**, one added name `dispatch_lanes`. The attribute appears in
  `lib.rs` and nowhere else at either ref (derived over all of
  `app/src-tauri`, not assumed).
- **Zero-argument, asked the harder way.** The signature takes only
  `tauri::State`. I traced the root: it is set **only** by
  `resolve_project_dir()` at launch (cwd/exe `.git` walk-up) or by
  `apply_picked_folder` from the **native OS dialog**. No command accepts
  a path, and `WatchState` exposes no setter reachable from the webview.
  **So no caller-supplied datum reaches the reader even by two hops** —
  ADR-012 satisfied in spirit, not only in signature.
- **`acl_pin.rs`**: sha256 `8d24cbad706d9e6f…` **identical** at both
  refs; 0 paths from `git diff --name-only` over pin + `capabilities/` +
  `tauri.conf.json`; `EXPECTED_GRANTS` **92** re-derived from the
  constant at both refs; `capabilities/` byte-identical. The grant set
  did not move, so the approach is right.
- **No test reads this repository's `.git`.** `fixtures.rs` builds every
  byte under `std::env::temp_dir()` keyed by pid + nanos + an atomic
  counter. The only `.git` strings in the new bodies are a comment and an
  assertion message. No `CARGO_MANIFEST_DIR`, no `current_dir`.
- **Suite arithmetic, checked as SETS rather than counts** (a count that
  closes by coincidence is not evidence). From `cargo test -- --list` at
  both refs: bodies new at tip = **exactly 2**, both the lane's; bodies
  lost = **ZERO**. Targets 16 → 15, lib 161 → 197 = 161 + 34 moved + 2
  new. The 34 genuinely moved — same names, different target. Arithmetic
  is a set identity here, not an accident.

### `T-126-s4` — verified three independent ways, and it holds

1. `index --check` at tip: exit **1**, a REAL stale (second line prints
   both counts, not `committed: MISSING`) —
   `925217 · 178 · 1968 · 1886` → `925662 · 177 · 1971 · 1886`. Files go
   **down** because the shim is gone; **edges do not move**.
2. Fresh regen (measured, not committed): the dispatch-mentioning edge
   set is **byte-identical at 29**.
3. **The decisive one, which the lane did not run**: in the freshly
   regenerated graph, edges **from `lib.rs` to any dispatch file = 0** —
   while `lib.rs` declares the module and calls
   `dispatch::lanes::read_lanes`.
4. Mechanism, read from source rather than inferred: `mod_item` pushes a
   **symbol** and never a `RawImport`; only `use_declaration` and
   `extern_crate` create imports; and `extract/rust.rs`'s own header says
   **"Rust emits no `call`/`type_ref` edges at all"**. So a `mod` plus a
   path expression is invisible **by construction**.

The finding is real and it bears on `T-033`'s zero-drift claim: the map
reports no undeclared edge partly because it cannot see this class at
all. `C-15 -> C-10` already reads `planned observed=0` for the same
reason.

### Suites and gates, at my refs, every exit unpiped

- **cargo `--no-fail-fast` from `app/src-tauri`: 462 / 0 / 3, exit 0**,
  summed over **15** `test result:` lines, count derived. Lib suite
  **4.31s** (base 4.30s) — **green band** (<9.5s). Both named
  intermittents `ok` **by name**:
  `docs_watch::tests::startup_arm_watches_the_initial_root` and
  `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`.
- `lib/parser`: `npm ci` 0, build 0, **`npm test` 268/268 exit 0**.
- app: `npm install` 0, **`npm run build` 0**, **`npm test` 963/963 over
  46 files, exit 0**.
- **BOOT GATE: exit 0**, both lines — `[nputer] project folder:
  /Users/ujju/Projects/verify-T-126` and `[nputer] window "main"
  created`, on scratch port **15226**. 1420 was `lsof`-checked only and
  left alone (node pid 88948). **This is the gate that matters here and
  it passes**: the real binary boots with the module linked in.
- **GRAPH REGEN: exit 1, a real stale**, figures above. Nothing
  regenerated was committed.
- **DOCS GATE: exit 1**, run directly from the repo root in the one
  spelling, never through `xargs` — **6 paths under `docs/`, 3 suites
  owed, 0 frontmatter issues**, every live card parsing with a legal
  status.
- `lint:tokens` `--selftest` 0 then 0: **TOKEN 132 / CONTROL 716**,
  derived at `cc49f81` and quoted as a measurement, never as a constant.
- **e2e, BOTH RUNS DECLARED** (146 total because this base predates
  T-091's merge): run 1 **145 passed / 1 failed, exit 1** —
  `token-scan.spec.ts:201`, and it carries `T-120-s3`'s exact
  fractional-millisecond signature, `Expected 1787671099250.8604` against
  `Received 1787671099251`; run 2 **146 / 146, exit 0**. Unrelated to
  anything this card touches.

### The range, at MY ref — and main moved under me mid-verification

Main was `eea61e0` when I started and **`5de8cb1`** when I finished; I
name the later. `git merge-tree --write-tree 5de8cb1 HEAD` exit read
**before** the substitution = 0, tree `531b3c9`:

    git diff --name-only 5de8cb1 531b3c9   ->  9   PRESCRIBED
    git diff --name-only 5de8cb1..HEAD     -> 32   forbidden two-dot (3.56x)
    git diff --name-only 41900d6..5de8cb1  -> 23   main's own advance

`comm -12` over prescribed and main's advance is **EMPTY**; the union is
**32** and is **identical** to the forbidden list as a set. The prescribed
set is stable at 9 across both main refs.

**Every prescribed path mapped to its component**: `lib.rs` → C-05
(in fence); `app/test/crescendo-dom.test.tsx` → C-05 via `app/test/**`
(in fence — C-14's `paths:` does **not** claim it, only its prose
mentions it); the six `docs/tasks/T-126*` files → the lane's own card and
findings; and `tests/dispatch_lanes.rs` → **C-15**, the one out-of-fence
path. **There is no second, undisclosed out-of-fence edit.**

## THE FENCE RULING

**The fence should have held; the criterion should have yielded. The
lane's choice was wrong, and it is nonetheless approved — because the
remedy is itself out of fence.**

`method/roles/executor.md` is unconditional: *"A criterion that cannot be
built inside the fence is NOT built. Record it, route it as a suggestion
naming the fence it needs, and build the rest. Widening the fence from
inside the lane is the one repair this role may never make."* A card's own
criterion is **not** sufficient authority. If it were, the rule would have
no cases left to govern — every out-of-fence edit an executor makes is
made because some criterion appeared to want it, so a criterion-shaped
exception nullifies the rule entirely. `T-033-s4`, which this lane itself
cites, already ruled the class in as many words: *"a dispatch defect, not
an executor's licence."* The lane quotes the precedent that condemns the
act and then performs it.

*"`app-dispatch` was held by no live lane"* is a fact about **collision
risk**, not about **authority**. A fence also states what a lane's
verification covers, and this lane's own `T-126-s3` is the proof that the
distinction bit: **four written statements about C-15 became false in that
commit, "none of them reachable from `[app-shell]`."** The edit had
C-15-side consequences the lane could not close — exactly what the fence
exists to keep inside one accounting.

The asymmetry inside the lane settles it. The lane **routed** the
`dispatch/mod.rs` prose correction (C-15, no criterion ordering it) and
**performed** the shim deletion (C-15, a criterion ordering it). Both are
`app-dispatch` writes. The only difference is whether the card asked — and
under `executor.md` that difference carries no authority.

**What should have happened**: criterion 7's first half — *"state whether
the shim is still needed"* — is fully satisfiable inside `[app-shell]`,
because stating costs nothing outside the fence. The lane should have
stated it, routed the deletion naming `[app-dispatch]`, and shipped. The
disclosed cost — `dispatch/**` compiled twice and 34 bodies run twice
until the routed suggestion lands — is real, but it is precisely the
tolerable, temporary, disclosed cost the routing rule exists to impose,
and it is far smaller than the cost T-110 paid three times by routing.

**Why this is a ruling and not a rejection.** Restoring
`app/src-tauri/tests/dispatch_lanes.rs` is itself an edit to C-15. I
cannot demand, as a condition of approval, the very act I have just ruled
this role may not perform. **The violation is structurally non-remediable
inside the fence** — so by this project's own standard, and by the same
standard this lane correctly applied to the shim, it is a disclosure and a
routing rather than a rejection. `T-126-s5` already carries it in the
right shape, correctly generalizes the class, and correctly names the
repair as a dispatch-time check. Treat the deletion as **ratified by
necessity, not as precedent**; the repair is `T-126-s5`'s one word,
`touches: [app-shell, app-dispatch]`, applied at dispatch.

## WHAT THIS LANE, THE CARD AND MY BRIEF GOT WRONG

**Corrections the lane made to the brief — both confirmed.**
1. `T-110-s9` **was already drained by T-033**. `arch` at `41900d6`
   reports `unmapped=0`, `findings=3`, only undeclared edge `C-10 -> C-14`,
   and C-15's `paths:` carries the shim under `# T-033 settlement`. The
   card's and the brief's "removing it may drain that finding" is wrong;
   what survives is `T-110-s9` EDIT ONE, stale prose, untouched.
2. A target dir inside a drill worktree **is** walked: fresh index in
   `drill-T-126` reports **194 files against 177**.

**But the stated MECHANISM for (2) is wrong, in the lane's notes and in
my brief alike.** `.nputerignore` does **not** exclude `target/` — it
lists only `docs/`, the index fixtures directory, and `tools/`. `target/`
is excluded by the **root `.gitignore`**, and `walk.rs` hard-skips only
`.git` and `node_modules`. `.drilltarget` and `.vtarget` escape because
they do not match the literal `target/`. A reader told to look in
`.nputerignore` will not find it there.

**And the damage is larger than the file count both the lane and the brief
quote.** The drill regen does not merely miscount files: it moves
**symbols 1968 → 1981, edges 1886 → 1889**, invents a package node
`p:cargo:serde_core`, and rewrites the graph header's language set
`[rust, ts] -> [js, rust, ts]`. A regen committed from inside such a
worktree injects cargo build-script output into the architecture map as
real nodes and edges.

**Two figures in this lane's own notes describe `0fa83da`, not the tip.**
The range was measured with HEAD at the code commit, so its "3
prescribed" omits the six `docs/tasks/T-126*` files that commit `cc49f81`
adds; at the tip it is **9**. Consequently the **DOCS GATE, promised as
"derived from the range and reported below", is never reported** — at
`0fa83da` it was owed nothing, and at the tip it fires exit 1 on 6 paths
owing three suites. **I ran all three and they are green**: app 963/963,
`lib/parser` 268/268, and `tools/e2e` 146/146 on run 2 (145/1 on run 1,
the unrelated `T-120-s3` flake). Nothing was hidden by the omission,
which is why this corrects rather than rejects. The lane's "this lane owes
no e2e run" is true of its code commit and false of its tip.

**This is a structural trap rather than sloppiness, and it deserves a
routing**: a lane's range and DOCS GATE can only be derived at its tip,
but the notes commit *is* the tip and is also where the figures must be
written — so any lane that measures before writing its notes records a
range for a tree one commit behind. The method does not currently address
this ordering.

**My brief's own errors, for the record.** It attributed "9 prescribed /
29 forbidden at `eea61e0`" to the lane; the lane measured 3 / 18 at
`540ae0f`, and 9 / 29 is what a verifier at `eea61e0` measures. It
reported "BOOT GATE fires (2 of 9)"; it is 2 of 3. It presented e2e
figures and `lint:tokens` counts as the lane's, though the lane declined
e2e and never ran the token lint — the figures happen to be correct at my
ref, which is how such errors survive. It was right, against the deleted
shim's own stale header, that the path is C-15's.

**A latent fragility, noted not charged.** The declaration pin matches
`/^(.*)\n(pub )?mod dispatch;$/gm`; a future comment line ending in
`mod dispatch;` would make `toHaveLength(1)` fail. It does not today —
`lib.rs` line 45 is the only match — and my one-line evasion attempt (x8)
was caught.

**Not stamped by me**, per the brief: `verifier:`, `verified_by:` and
`review:` remain the integrator's, and `status:` is untouched at
`verifying`.
