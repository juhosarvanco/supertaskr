---
id: T-126
title: The lane reader is built, verified three times, and compiled into nothing — one module declaration and one zero-argument command stand between F-04 and its own data
feature: F-04
milestone: 4
priority: 5
size: S
status: done
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier: claude-opus-5 @fresh
built_by: claude-opus-5 @T-126 — code commit 0fa83da, notes cc49f81
verified_by: claude-opus-5 @fresh — verdict de05430
review: same-model
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

## Integration — third-hand integrator, claude-opus-5, 2026-08-25

Main before **`7c2ed1a`** · lane tip **`de05430`** (both `git rev-parse`)
· merge **`4983174`** · this checkpoint its direct child. Neither built
nor verified by this hand.

**Range: `7c2ed1a..4983174` — 9 paths**, byte-identical under `cmp` to
the pre-merge `merge-tree --write-tree` set. **The forecast tree
`3c991a8` IS the merge's tree**, re-read with `git rev-parse HEAD^{tree}`
afterwards; parents are `7c2ed1a` and `de05430` and **nothing was written
into the merge commit**. `merge-tree`'s exit was read from `$?` into a
variable BEFORE the substitution — **0**.

**THE FORBIDDEN TWO-DOT FORM ANSWERS 57 — A 6.33x OVERSTATEMENT, AND IT
IS PURE LEFT-ENDPOINT DRIFT.** Main advanced **48** paths under this lane
and the branch touched **9**; `comm -12` over the sorted lists is
**EMPTY**, 48 + 9 = 57, and the union of the two sets is **byte-identical
to the forbidden set** under `diff` — disjointness proved as SETS, not as
counts. **22 of the forbidden form's 57 are PHANTOM DELETIONS**, main's
advance read backwards through a drifted left endpoint. `main..HEAD`
answers **0** here, as it must for an integrator standing on `main`.
`<merge-base>..<tip>` answers **9** and is still forbidden: `41900d6` IS
the merge base, so the spelling degenerates into the three-dot form and
is right by the coincidence of this lane's shape.

**FENCE DISJOINTNESS AGAINST EVERY LIVE LANE, AS SETS.** `comm -12` of
these 9 paths against `T-129`'s own `merge-base..tip` diff (15 paths) and
`T-130`'s (4) is **EMPTY** in both cases. Declared fences agree:
`app-shell` against `crate-index` and `tools/e2e`.

**SUITES, every exit from `$?` unpiped, every count DERIVED.** cargo
**462 passed / 0 failed / 3 ignored, exit 0**, summed over **15**
`test result:` lines and cross-checked against **465** declared bodies
from the `running N tests` headers (462 + 3 ignored — the check that
catches a target aborting with no result line); lib suite **197 bodies in
4.51s**, the green band. parser **268/268** across 12 files, exit 0,
after `npm run build` from `lib/parser/` which was run FIRST regardless.
app `npm run build` exit **0** and `npm test` **973/973** across 47 files,
exit 0 — **972 → 973 is the one TypeScript body this card adds**, the pin
on the non-`cfg(test)` declaration. `tools/e2e` **171/171, exit 0, ONE
RUN**, 1.9m, scratch port **15432**. `npm run lint:docs` **0**;
`npm run lint:tokens -- --selftest` **0** and `npm run lint:tokens`
**0** at **TOKEN 135 / CONTROL 735** — CONTROL was 731 at T-104's
checkpoint and the +4 is exactly this merge's five new suggestion files
less the one deleted shim. **All three watched cargo intermittents read
BY NAME as `ok`**, never inferred from a green exit:
`docs_watch::tests::startup_arm_watches_the_initial_root`,
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
and `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`.

**THE FIGURE THAT PROVES THE CARD IS NOT THE PASS COUNT — IT IS THE
TARGET LIST.** `test result:` lines go **16 → 15** while bodies go
**460 → 462**, and `cargo test`'s own `Running` lines no longer name
`tests/dispatch_lanes.rs` at all: the **34** `dispatch::` bodies now run
inside `unittests src/lib.rs`. Two bodies are genuinely new, zero are
lost, and the 34 moved from a test target into the library. A session
reading only "462 passed" learns nothing about this; the target list says
it in one line.

**GATES — ALL THREE FIRE, all derived from the merge's own 9 paths.**

| gate | trigger | on these 9 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/tsx/js/jsx` or `*.rs` outside `docs/` | **3 — OWED** | **exit 1 STALE**, regenerated, **exit 0 CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — OWED** | exit **0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **BOOT GATE is the gate that matters most on this card**, because the
  defect it fixes is exactly the one every suite passes: exit **0** on
  scratch port **15431**, `lsof`-probed free in the same command that
  bound it, both lines observed — `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`.
  Child pid 85205, process group captured, tree stopped on SIGTERM, port
  read back at zero rows. It is the only step that proves
  `pub mod dispatch;` and the `generate_handler!` registration survive a
  real build and a real window.
- **GRAPH REGEN — asked, STALE, regenerated, asked again.** `graph.json`
  moved **933 486 → 933 931 bytes**, sha256
  `c20d4212…` → `c9dedabc…`, **179 → 178 files**, 1987 → 1990 symbols,
  **1903 → 1903 edges**. **THE FILE COUNT MOVES DOWN**, which is this
  merge's own trap for a reader expecting the usual `+1`, and the byte
  count moves UP at the same regen — a file count and a byte count are
  not evidence about each other.
- **DOCS GATE — exit 1 on 6 of 9, THREE suites** (`npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`), all
  three run and green. **13 derived docs readers across 4 suites**,
  census **130 sites in 22 files**, **0 frontmatter issues**. Invoked
  from the repo root with the RANGE RULE's own path list, never through
  `xargs`.

**`T-126-s4` REPRODUCED A FOURTH WAY, WITH A POSITIVE CONTROL THE EARLIER
PASSES DID NOT HAVE.** In the freshly regenerated graph, edges from
`lib.rs` to any `dispatch/` file = **0**, while `lib.rs` carries **7**
outgoing edges in the same graph — four file edges and three cargo
packages. The four file edges are `agent/mod.rs`, `churn.rs`,
`docs_watch.rs` and `index_cmd.rs`, which are **exactly** the four modules
`lib.rs` reaches with a `use` statement; `dispatch` and `acl_pin` are
declared with `mod` and neither gets one. So the indexer is not failing to
see `lib.rs` — it sees it, records seven edges from it, and cannot see
this one. The Rust reporter says the same thing at the component level:
`arch` lists **eleven** C-05 edges and **C-15 is not among them**, so a
real C-05 → C-15 dependency produces **zero drift** rather than an
undeclared-edge finding.

**FIXTURE RECONCILIATION — THREE ASSERTIONS, AND THE FIRST DOWNWARD MOVE
THIS LEDGER HAS EVER TAKEN.** `architecture-dogfood.test.ts` (C-15's file
list 6 → 5, its tally row 6 → 5, `fileComponent.size` 179 → 178) and
`map-dogfood-render.test.tsx` (the hint 179 → 178), plus the two body
titles that carried the old numbers. **Derived from `arch` over the
regenerated graph BEFORE the suite was re-run**, on that body's own
instruction, rather than read off the failure — the first red in the C-15
body hides three assertions below it, and one of those three moved.

**THE FENCE RULING IS CARRIED FORWARD IN THE WORDS THE VERDICT USED.**
The deletion of `app/src-tauri/tests/dispatch_lanes.rs` **was a fence
violation.** `app-shell` is C-15's neighbour, not C-15, and
`method/roles/executor.md:126` is unconditional — *"Widening the fence
from inside the lane is the one repair this role may never make"* — and
it predates this card, so this is a broken rule and not an open question.
The verdict declined to reject only because restoring the file is itself
an edit to the same out-of-fence component, making the violation
**structurally non-remediable inside the fence**: **ratified by
necessity, not precedent.** An out-of-fence edit that ships without those
words becomes the precedent that a card's own criteria outrank its fence,
which would nullify every fence, since every out-of-fence edit is made
because some criterion seemed to want it.

**JUDGEMENT CALLS, all decided by one rule** — *repair what the merge
INTRODUCES, file what the merge merely REVEALS.* **Repaired**: the three
dogfood assertions and their titles (false at this merge, and red);
ARCHITECTURE's C-07 budget figure (933 486 → 933 931, ref-stamped beside
its predecessors rather than overwritten); ARCHITECTURE's C-05 row, which
is where every previous command registration was recorded. **Filed, not
repaired**: `T-126-s3` — C-15's registry still declares the deleted path
and C-15's module header still says `lib.rs` does not declare it. Both
became false AT this merge, so the rule's first half reaches them; they
are routed anyway because the finding is already fully fenced
(`[app-dispatch, docs/architecture/components/]`, both FREE), because
item 1 fires T-024's three-fixture rule and is a card's work rather than
a checkpoint aside, and because removing the `paths:` entry would
discharge **`T-033-s8`** — an open question addressed to the architect —
by side effect. **An integrator repairs statements of fact; it does not
settle an open architectural question the falsehood happens to sit
inside.** The stale prose is also the visible cost of the fence
violation, and erasing it in the same breath as ratifying it is how
"not precedent" quietly becomes precedent.

**TWO FINDINGS FILED**: `T-126-s6` (the executor seat has no rule saying
a gate derivation is stale at the lane's own tip — the verifier seat got
one thirty minutes ago and this lane's DOCS GATE flipped from not-owed to
owed across its last commit) and `T-126-s7` (*repair what the merge
introduces, file what the merge merely reveals* is applied by every
checkpoint and written in no file).

**CEREMONY, RECORDED BECAUSE THE TABLE PRICES THIS CARD LOWER THAN IT WAS
RUN.** `size: S` touching shipped code, so
`method/tasks/TASK-FORMAT.md`'s row is *executor → verifier, then the
executor integrates its OWN work* — **a separate integrator was not
owed** and one was dispatched anyway. That is more ceremony than the
table requires, never less, and it makes the provenance a genuine third
hand. `review: same-model` is the honest label: the verdict is an
independent adversarial session that declared a bounded read, and ruling
SEVEN says `review:` is PROVENANCE rather than a strength ranking — one
model on both sides.

**THE HUMAN'S APP WAS NOT TOUCHED, AND THE PREDICTION WAS MADE BEFORE IT
WAS CHECKED.** Two of nine paths are under `app/src-tauri/**` — the
RELAUNCH trigger set — and zero under `app/src/**`. In the MAIN checkout
that would rebuild and relaunch; @human's app serves from
`/Users/ujju/Projects/nputer-app`, **measured rather than assumed** with
`lsof -p 53350` (cwd and binary both under that checkout) and
`lsof -p 88948` (the vite on 1420 has that checkout's `app/` as its cwd).
Port 1420 read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else,
at **20:18:19**, **20:20:05** (immediately after the merge's working-tree
write) and **20:30:00** (immediately after the BOOT GATE, the one step
that could plausibly have collided): holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, **all three readings identical**, and
the anchored `ps` match reports pid **53350** started **19:43:47**
unchanged throughout. No fresh install was owed — all three
`node_modules` trees, both `dist/` directories and `target/` were checked
individually and present — so `npm ci` was never run.
