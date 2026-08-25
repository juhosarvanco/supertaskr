---
id: T-129
title: Pathological nesting in any indexed source file aborts the process at exit 134 — and the indexer runs inside the app, so it takes the window, the watcher and an in-flight interview with it
feature: F-06
milestone: 4
priority: 6
size: M
status: verifying
blocked_by: []
touches: [crate-index]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs (tenth triage, 2026-08-25): `T-010-s8` — file removed in this
commit. Promoted as the highest-severity item in a 61-suggestion backlog.

**THIS IS NOT A T-010 DEFECT AND THE MEASUREMENT SAYS SO IN BOTH
DIRECTIONS.** It is a pre-existing property of the crate, present since
T-009, measured at T-010's verification against **both** binaries.
T-010's only contribution is to widen the input class from
`.ts/.tsx/.js/.jsx` to `.rs` as well.

## What happens, with the thresholds that make it a threshold rather than a guess

Measured at `cb13957` with `nputer-index index --root .` over a one-file
fixture. Every row **aborts the process with exit 134** (SIGABRT,
`fatal runtime error: stack overflow`) rather than degrading, refusing,
or recording anything:

| input | shape | aborts at | still green at |
|---|---|---|---|
| nested inline `mod` | `('mod a {' * n) + ('}' * n)` | **5 000** | 4 000 |
| nested use groups | `use ('a::{' * n) + 'X' + ('}' * n);` | **3 000** | 2 000 |
| path segments | `use s0::s1::…::sN;` | **20 000** | 12 000 |

**THE SAME CLASS EXISTS ON THE TS SIDE AND PREDATES RUST SUPPORT.** Built
against `d43455b` (main, no Rust) and against `cb13957`, over identical
inputs — `namespace a {` nested 10 000 deep, a 10 000-deep object literal,
a 10 000-deep parenthesised expression, a 50 000-link member chain — **all
four abort at 134 on BOTH binaries, eight runs, no divergence.**

**AND IT IS NOT TREE-SITTER, which is the measurement that localises the
bug.** 10 000 nested braces *inside a function body* — which tree-sitter
parses in full and the extractor deliberately does not descend into — is
**exit 0**. The parse and the tree's drop both survive the depth the
traversal dies on. **The unbounded recursion is ours**:
`extract::rust::Cx::declarations`, `use_tree`, `collect_segments`, and
their TS-side siblings in `extract/ts.rs`.

## Why this is worth more than a CLI exit code

`app/src-tauri/src/index_cmd.rs` runs `nputer_index::index()` **in the
app's own process**, behind the zero-argument `index_repo` command. **A
Rust stack overflow is an `abort()`, not a catchable panic**, so there is
no `catch_unwind` that helps and no error path that runs. It takes the
whole Tauri process: the window, the docs watcher, the agent runner, and
any interview mid-turn. `IndexOutcome::Error`'s own doc comment promises
*"IndexError (or a refused write target), Display'd — **never a panic**"*,
and that sentence is false for this class.

**The reachability is narrow and is stated honestly rather than inflated.**
No human-written source has these shapes; it needs a generated or hostile
file in a project folder the user opened. **That is exactly the trust
boundary `T-013`'s `git` finding turned on** — the opened folder is the
one directory an attacker controls by asking the user to clone a
repository. Narrow is not the same as closed, and an abort is the worst
available failure mode.

## Acceptance criteria

- **EVERY RECURSIVE TRAVERSAL IN THE EXTRACTORS SHALL CARRY A DEPTH
  BOUND**, refused past a constant, **recording the file rather than
  dropping it silently** — the crate's existing "degrade, never fail"
  contract applied one layer deeper, fitting the `ExtractRecord::default()`
  fallback already in `lib.rs`. **THE SET OF TRAVERSALS SHALL BE DERIVED,
  NOT LISTED FROM THIS CARD**: `rust.rs`'s `declarations`, `use_tree` and
  `collect_segments` are the ones already measured, and the TS siblings
  are named only as "siblings". Enumerate every self-recursive function in
  `extract/` and say which ones you bounded and why the rest need none.
- **A PIN SHALL DRIVE EACH BOUNDED TRAVERSAL PAST ITS LIMIT AND REQUIRE A
  RECORDED REFUSAL**, and **each pin SHALL FAIL AGAINST THE PRE-FIX
  TREE** — today they abort at 134, which is the whole finding. Record the
  pre-fix run and its exit for each. An assertion that cannot fail against
  today's tree is a defect (`T-080-s1`).
- **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL, and here it is the
  criterion that stops the fix from being vacuous.** Beside every
  refusal pin, a file at depth `LIMIT - 1` that **still extracts
  everything it should** — otherwise "it was refused" is satisfied by a
  file nothing parsed at all, and the bound would be indistinguishable
  from a parser that gave up.
- **THE THRESHOLDS SHALL BE RE-DERIVED AT THIS CARD'S OWN REF**, not
  copied from the table above. They were measured at `cb13957` against a
  binary built with that toolchain, and a stack limit is a property of the
  build and the platform, not of the source. **IF your thresholds differ
  from the table THEN say so and say by how much** — that difference is
  itself worth knowing, because it tells the next reader how much the
  numbers travel.
- **THE DEPTH CONSTANT SHALL NOT BE PINNED BY A BODY PARAMETRISED BY
  IT.** A test that computes its input depth from the constant it is
  checking cannot pin that constant (`T-110-s5`'s class, and it is the
  defect this project has caught most often). Literals on both sides, or
  an explicit argument for why not.
- **ARM 2 SHALL BE RULED ON, NOT SILENTLY SKIPPED.** Running the walk on a
  spawned thread with an explicit stack size raises the ceiling without
  closing the class. `T-010-s8` says "worth having as well, never
  instead". Decide, and record the decision beside the code — **IF it is
  taken THEN the depth bound is still required**, because a bigger stack
  moves a threshold and a bound removes one.
- **ARM 3 IS OUT OF FENCE AND SHALL BE ROUTED, NOT REACHED FOR.**
  `app/src-tauri/src/index_cmd.rs` is C-05 (`app-shell`), which a live
  lane holds. Its `"never a panic"` comment is false for this class and
  **SHALL be corrected by a routed card rather than by widening this
  fence** — file it and name it. **Do not leave the false guarantee
  undisclosed just because it is unreachable from here**: a comment that
  promises what the code does not is this project's third-most-common
  defect class, and this is a live instance with a known correction.
- **THE CRATE'S PUBLIC CONTRACT SHALL STILL HOLD**: `index --check` and
  the emitted `graph.json` SHALL be byte-identical for every input that
  does not exceed a bound. **Prove it rather than assert it** — regenerate
  and compare, and state the bytes/files/symbols/edges before and after.

Verification: headless — bare `cargo test` from `app/src-tauri`
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines **and the count derived, not just the exit**). **The
abort is exit 134 and an abort is not a test failure** — a harness that
reads only pass/fail counts will report a crashed child as nothing at all,
so **read the exit code of the binary directly, unpiped, for every
threshold run** (`cmd | head` gives head's 0). **POISON DRILL on every new
assertion**, one side only, producer mutated and never the assertion —
raise a depth bound past its fixture and require the RED — mutated text
read back with `git diff` before its run, restores proved per-path by
sha256, in a detached scratch worktree with its own `CARGO_TARGET_DIR`
inside it, named for this lane and placed OUTSIDE the repository
(`T-052-s2`). Then the shape-six check per new body. **GRAPH REGEN fires
on `*.rs` since `e1f3023`** — ask `cargo run -p nputer-index -- index
--check --root ../..` rather than predicting. The BOOT GATE does NOT fire
on `crates/**` — derive that rather than assuming it, and say which way it
came out. **Fixtures with 20 000 path segments do not belong in the
repository** — generate them into a temp directory at run time and say so.
@human: none.

## Implementation notes (executor, claude-opus-5 @T-129)

Built in `/Users/ujju/Projects/nputer-T-129` on `task/T-129-nesting-abort`,
cut from `ae16fbe`. Every figure below was measured at `ae16fbe` on this
machine unless it names another ref. **Main moved twice while this lane
ran** — `ae16fbe` → `1ed6ae9` (Checkpoint: T-102) → `54076fe` (Checkpoint:
T-033) → `fbae94a` (T-104 dispatch) — so the lane list and the graph gate
both read differently now than at dispatch, and both are stated with when
they were read.

### 1. THE DIAGNOSIS REPRODUCES, AND SO DOES THE NEGATIVE RESULT

Every Rust row of the card's table reproduces **exactly** at this ref,
against the shipped binary, exit read from `$?` on an unpiped command
(output to a FILE, never a pipe):

| input | card said | measured at `ae16fbe` |
|---|---|---|
| nested inline `mod` | aborts 5 000, green 4 000 | **aborts 5 000 (exit 134), green 4 000** |
| nested use groups | aborts 3 000, green 2 000 | **aborts 3 000 (exit 134), green 2 000** |
| path segments | aborts 20 000, green 12 000 | **aborts 20 000 (exit 134), green 12 000** |

`fatal runtime error: stack overflow, aborting`, `thread 'main' has
overflowed its stack`. **Three rows measured at `cb13957` and reproduced
unchanged at `ae16fbe` on rustc 1.95.0 / Darwin 25.6.0 arm64, `ulimit -s`
8176 KiB** — so these numbers travel further than this project's usual
caution would predict.

**THE NEGATIVE RESULT HOLDS AND IT LOCALISES THE BUG.** 10 000 nested
braces inside a `.rs` function body — parsed in full by tree-sitter,
deliberately not descended by `declarations` — is **exit 0**, and so is
50 000. The parse and the tree's drop both survive the depth the
traversal dies on. **The unbounded recursion was ours.**

### 2. WHERE THE CARD IS WRONG — the negative result is LANGUAGE-SPECIFIC

The card states the negative result without a language: *"10 000 nested
braces inside a function body — which tree-sitter parses in full and the
extractor deliberately does not descend into — is exit 0."* **That is
true of `.rs` and FALSE of `.ts`.** `extract::ts::Cx::scan` descends
EVERY named child of the whole tree, function bodies included — it is the
candidate scan, and candidates are exactly the things inside function
bodies. Measured: `function f() {{{ … }}}` nested 10 000 deep in a `.ts`
file is **exit 134**, green at 4 000.

Nothing in the diagnosis changes — the recursion is still ours either
way — but a reader who takes "the extractor does not descend into
function bodies" as a property of the crate will look for the TS bug in
the wrong place. It is a property of the RUST extractor's design and of
nothing else.

### 3. THE TS THRESHOLDS ARE TIGHTER THAN THE CARD'S, BY UP TO 5x

The card measured four TS shapes at one depth each (10 000 / 10 000 /
10 000 / 50 000) and reported "all four abort". Bisected here, the real
thresholds are much lower, and one of them is the lowest in the whole
table:

| shape | card | measured at `ae16fbe` | ratio |
|---|---|---|---|
| `namespace nK {` × n | aborts at 10 000 | **aborts 2 000, green 1 000** | 5x tighter |
| nested object literal | aborts at 10 000 | **aborts 4 000, green 2 000** | 2.5x |
| parenthesised expression | aborts at 10 000 | **aborts 10 000, green 4 000** | — |
| member chain | aborts at 50 000 | **aborts 10 000** | 5x tighter |
| nested destructuring (NOT in the card) | — | **aborts 4 000, green 2 000** | new |
| braces in a `.ts` function body (NOT in the card) | — | **aborts 10 000, green 4 000** | new |

**The nested-`namespace` row makes TS the more exposed language, not the
less**: 2 000 is below every Rust threshold. The card's framing ("the
same class exists on the TS side") understates it.

### 4. THE SET OF TRAVERSALS, DERIVED

Enumerated by scanning every `fn` in `src/extract/**` for a call to
itself, then reading each cycle by hand. **Six self-recursive traversals,
in two mutual-recursion cycles and four plain ones. All six are bounded.**

| # | traversal | cycle | depth is | smallest driver that reaches its bound | pre-fix abort |
|---|---|---|---|---|---|
| 1 | `rust::Cx::declarations` | mutual with `mod_item` | inline `mod` nesting | `mod m0 { … }` × 129 | 5 000 |
| 2 | `rust::Cx::use_tree` | self | `use a::{b::{…}}` group nesting | 65 nested groups | 3 000 |
| 3 | `rust::Cx::collect_segments` | self | `a::b::c::…` segment count | a 130-segment path | 20 000 |
| 4 | `ts::Cx::module_statement` | mutual with `export_statement` | `declare`-chained ambient declarations | `declare` × 129 | 10 000 |
| 5 | `ts::Cx::pattern_names` | self | destructuring nesting | 65 nested pattern pairs | 4 000 |
| 6 | `ts::Cx::scan` | self | **the file's whole AST depth** | a 62-deep object value | 2 000 (nested `namespace`) |

**NOT self-recursive, checked rather than assumed**: `text`, `flat_text`,
`string_text`, `path_attribute`, `named_item`, `impl_name`,
`is_exported`, `push_symbol`, `use_declaration`, `path_segments`,
`anchor`, `extern_crate` (Rust); `string_text`, `named_declaration`,
`push_symbol`, `import_statement`, `is_type_ref_position`,
`push_candidate`, `enclosing_symbol`, `single_string_arg` (TS). One
deserves naming because it LOOKS recursive and is not:
**`ts::Cx::require_bindings` walks UP the parent chain in a `loop`** — it
is iterative, uses one frame, and needs no bound.

**`module_statement` nearly escaped the enumeration** and is worth
recording: a first reading says the grammar bounds it at depth ~3, since
it does not descend into `internal_module` bodies and `declare` cannot be
repeated. That reading is wrong — **`ambient_declaration` is itself one
of tree-sitter-typescript's `declaration` alternatives**, so
`declare declare … const x` nests without limit, and it aborts at 10 000.
Found by MEASURING candidate shapes rather than by reading the grammar.

**`export_statement` shares `module_statement`'s counter rather than
keeping its own**, because they are one cycle; two half-ladders would let
an alternating chain reach twice the bound.

**THE ENUMERATION IS NOW STRUCTURAL, not documentary.** `graph::DepthSite`
has exactly one variant per bounded traversal and every refusal names
one, so a seventh traversal cannot be bounded without adding a variant,
and `tests/depth.rs` asserts the SET of six against six drivers.

### 5. WHAT WAS BUILT

- **`src/extract/mod.rs`** — `MAX_DEPTH: usize = 128`, with the whole
  derivation beside it, and `ExtractRecord.depth_refused:
  Option<DepthSite>` (`#[serde(default, skip_serializing_if)]`, the
  `mods` pattern, so a cache written before T-129 still deserializes).
- **`src/graph.rs`** — `pub enum DepthSite` (six unit variants,
  kebab-case, with `as_str()`); `FileEntry.depth_refused:
  Option<DepthSite>`; `Stats.depth_limited: Option<usize>`. Both optional
  and both omitted when absent, so **`schema` stays 1 and the committed
  bytes do not move**.
- **`src/extract/rust.rs`**, **`src/extract/ts.rs`** — a `depth` argument
  on each of the six, a guard at ENTRY (`if depth > MAX_DEPTH { refuse;
  return }`), and `Cx::refuse` where FIRST refusal wins.
- **`src/lib.rs`** — carries `depth_refused` onto the `FileEntry` and
  DERIVES `stats.depth_limited` from the file entries the way
  `stats.symbols` is derived from the symbol arrays. `DepthSite` is
  re-exported.
- **`tests/depth.rs`** — new integration target, three bodies.
- `src/{emit,diff,arch/mod}.rs` — **`#[cfg(test)]` fixture builders only**,
  two new fields each. **No production constructor of `FileEntry` or
  `Stats` outside `lib.rs` exists**, which is how narrow this change is.

**REFUSE, DO NOT DROP.** A refused file stays in `files[]` with
everything its traversals reached above the bound; only the sub-tree past
the bound is missing. A 129-deep module file keeps its file-level symbol
and all 129 `mod` records and loses the innermost `use`; a 63-deep object
value keeps its exported declaration and loses the call candidate under
it. That is the crate's "degrade, never fail" contract one layer down,
and both halves are asserted.

### 6. THE NUMBER, DERIVED FROM BOTH SIDES

**`MAX_DEPTH = 128` is where two measured margins meet.**

**FROM BELOW — 3.5x.** The deepest traversal any file in this repository
reaches is **36**, `app/src/architecture/MapView.tsx`'s candidate scan.
Derived by bisecting the constant against a copy of the live tree and
counting flagged files: 33→2 files, 34→2, **35→1** (`MapView.tsx` alone),
**36→0**. Second deepest is
`app/src/components/board/TaskDetailPanel.tsx` at 35. Nothing else in 254
walked source files is within 90 of the bound.

**FROM ABOVE — 3.2x.** These traversals NEST: `declarations` does not
unwind before `use_declaration`, which does not unwind before `use_tree`,
which does not unwind before `collect_segments`. So the worst legal stack
is three ceilings at once — and, crucially, **it is a CONSTANT rather
than a function of the input, which is the whole of what the bound
buys**. Measured by bisecting an explicit thread stack against a file
that maxes all three at once:

| profile | worst legal input needs | against 2 MiB (`std::thread`) | against 8 MiB (main) |
|---|---|---|---|
| debug | **512–640 KiB** | ~3.2x | ~12.8x |
| release | **128–192 KiB** | ~10x | ~40x |

**256 WAS MEASURED AND REJECTED.** It gives 7.1x from below but needs
**896–1024 KiB** in debug — only ~2x on a 2 MiB thread. The two failures
are not symmetric: refusing a legitimate file DEGRADES and is recorded,
overflowing ABORTS the app, so the margin belongs on the unrecoverable
side. 128 is the value at which both margins are ~3.5x.

**With the bound in place, every shape in section 1 and section 3 exits 0
at 50 000** — ten to twenty-five times the depth that aborted before —
read unpiped, 27 runs, no exceptions.

### 7. ARM 2 — RULED ON, NOT TAKEN

**Running the walk on a spawned thread with an explicit stack size is
NOT taken.** The ruling is recorded beside the code (the `MAX_DEPTH` doc
comment) as the card asks, and here is the whole of it:

1. **It moves a threshold where a bound removes one** — the card's own
   sentence, and it is decisive rather than rhetorical: with a bound, the
   worst legal stack is a constant; with a bigger stack it stays a
   function of the input.
2. **It would make the crate's answer depend on a machine property.**
   ADR-014 is "same tree, byte-identical output on any machine". A stack
   size is not a property of the tree.
3. **It would ship untestable code.** To exercise the bigger stack you
   must exceed the bound — and after the bound exists nothing can. The
   arm's own code path would be unreachable and any test of it vacuous,
   which is the defect class this project catalogues most.
4. **It widens the crate's threading contract for every caller** (the
   app's `index_repo`, the CLI, the watcher) to buy a residual the
   enumeration and the pins already cover.

**WHAT SURVIVES FROM ARM 2 IS ITS QUESTION, and it is kept as a pin
rather than as a paragraph.** `the_worst_legal_nesting_completes_on_a_
small_explicit_stack` asks it from the other end: give the walk the
SMALLEST stack any plausible caller hands it (2 MiB, a plain
`std::thread`, spelled as a literal) and require the deepest legal input
to finish. That is the property arm 2 was reaching for, held by a body
instead of by a bigger buffer.

### 8. THE PINS — every literal on both sides, a positive control beside every refusal

**Nine new bodies.** Six unit (per-traversal attribution, in the module
that owns the traversal) and three integration (the whole pipeline).

**NO BODY MENTIONS `MAX_DEPTH`.** Every depth is a literal, on both sides
of every boundary, and the integration file cannot even see the constant
(`pub(crate)`). This is `T-110-s5`'s class handled structurally: move the
constant and these bodies red by name; a `MAX_DEPTH + 1` body would
follow it in silence. **`inline_mod_nesting_extracts_at_128_and_refuses_
at_129` pins the constant EXACTLY** — for that shape depth == n, so
"128 clean, 129 refused" is literal-against-literal with no constant in
sight.

| body | clean at | refuses at | the positive control asserts |
|---|---|---|---|
| `inline_mod_nesting_extracts_at_128_and_refuses_at_129` | 128 | 129 | the innermost `use`, anchored `self::m0::…::m127::marker::Deep` |
| `use_group_nesting_extracts_at_64_and_refuses_at_65` | 64 | 65 | the flattened specifier, `a0::…::a63::Deep`, 65 segments |
| `path_segments_extract_at_129_and_refuse_at_130` | 129 | 130 | all 129 segments in order; the refusal keeps exactly 128, dropping the LEADING two |
| `ambient_declare_chains_extract_at_124_and_the_module_walk_refuses_at_129` | 124 | 129 | `deepConst` reached and typed `const` |
| `nested_binding_patterns_extract_at_62_and_the_pattern_walk_refuses_at_65` | 62 | 65 | `deepBinding` is a module-scope symbol |
| `the_candidate_scan_extracts_at_61_and_refuses_at_62` | 61 | 62 (loses the call at 63) | the innermost CALL CANDIDATE, which exists only because the scan reached it |

**THE POSITIVE CONTROL IS THE CRITERION THAT STOPS THIS BEING VACUOUS
AND IT IS NOT A SHRUG.** Each one asserts a fact that only exists if the
walk reached the BOTTOM — an anchored specifier, a flattened path, a
typed symbol, a call candidate — rather than "no refusal was recorded",
which a file nothing parsed would satisfy equally.

**THE THREE TS WALKS INTERLEAVE AND THE BODIES SAY SO.** `scan` counts
every AST level while `module_statement` and `pattern_names` count only
their own construct's levels, so `scan` reaches its ceiling first — but
the module walk RUNS first and first refusal wins, so each walk still
answers for its own shape once that shape is deep enough. The middle band
(125–128 declares, 63–64 pattern pairs) records `ts-candidate-scan`, and
that is asserted rather than left to be discovered. It is also why the
declare/pattern positive controls sit at 124 and 62 rather than one below
their own site's boundary: those are the last depths at which NOTHING
refuses, which is what a positive control needs.

**INTEGRATION** (`tests/depth.rs`), the three that fail against the
pre-fix tree AS EXIT 134:

- `a_pathological_file_is_indexed_and_recorded_rather_than_aborting_the_process`
  — the card's own worst row (20 000 segments) beside an ordinary file:
  `index()` returns, the hostile file is IN `files[]` naming
  `rust-path-segments`, `stats.depth_limited == Some(1)`, and the
  neighbour is byte-for-byte unaffected.
- `every_bounded_traversal_is_reachable_from_a_real_file_and_names_itself`
  — six drivers, one per `DepthSite`, plus a seventh ordinary file.
  **A COVERAGE FLOOR, not a tally** (CONVENTIONS' shape five): the
  assertion is over the SET, so deleting a bound, or deleting the file
  that drives one, changes the set.
- `the_worst_legal_nesting_completes_on_a_small_explicit_stack` — arm 7
  above.

### 9. EVERY PIN FAILS AGAINST THE PRE-FIX TREE, AND IT FAILS AS AN ABORT

**AN ABORT IS NOT A TEST FAILURE**, so this is stated as exit codes off
unpiped commands rather than as counts. Against the base binary built
from `ae16fbe` in an isolated target directory:

| body's own input, one file at a time, through the pre-fix binary | pre-fix exit | post-fix exit / site |
|---|---|---|
| 20 000-segment path (`a_pathological_file…`) | **134** | 0 / `rust-path-segments` |
| `mods.rs` — 6 000 inline modules | **134** | 0 / `rust-mod-nesting` |
| `groups.rs` — 4 000 nested use groups | **134** | 0 / `rust-use-tree` |
| `path.rs` — 20 000 segments | **134** | 0 / `rust-path-segments` |
| `declares.ts` — 12 000 chained `declare`s | **134** | 0 / `ts-module-statements` |
| `pattern.ts` — 5 000 nested pattern pairs | **134** | 0 / `ts-binding-pattern` |
| `value.ts` — a 5 000-deep object value | **134** | 0 / `ts-candidate-scan` |
| the worst legal nesting (128 mods + 64 groups + 129 segments) | 0 | 0 / no refusal |

**THE SITE DRIVERS WERE DELIBERATELY RAISED PAST THE PRE-FIX ABORT
THRESHOLDS RATHER THAN LEFT JUST PAST THE NEW BOUND.** The first draft
used 300/200/300/300/200/200 — enough to attribute each site, and far
below the old thresholds, so against the pre-fix tree those bodies would
have failed only as compile errors about fields that did not exist yet.
That is a failure, but it is not THE failure, and criterion 2 says
*"today they abort at 134, which is the whole finding"*. At
6 000 / 4 000 / 20 000 / 12 000 / 5 000 / 5 000 each driver aborts the
pre-fix binary on its own AND attributes to the same site post-fix, so
the body fails against the pre-fix tree the way the defect actually
presents. Costs 0.13s.

**ONE BODY CANNOT ABORT PRE-FIX AND SAYS SO BY CONSTRUCTION.**
`the_worst_legal_nesting_completes_on_a_small_explicit_stack` drives the
deepest input that is LEGAL under the new bound; nothing legal was ever
deep enough to overflow the old tree. Against the pre-fix tree it fails
as a compile error, and that is the honest ceiling on this criterion for
that one body.

**AND THE HARNESS TRAP IS REAL, CAUGHT HERE ONCE.** A `cargo test … |
tail` in this session returned `EXIT=0` while the child had aborted at
SIGABRT — `tail`'s exit, exactly the failure the card warns about. Note
also that **`cargo test` MASKS an abort as its own 101**: the crashed
child shows as `signal: 6, SIGABRT` in cargo's message while `$?` reads
**101**, not 134. The 134 is visible only on the binary itself, which is
why every threshold run here drove `target/debug/nputer-index` directly.

### 10. THE PUBLIC CONTRACT — PROVEN, and the baseline had to be rebuilt first

**The committed `graph.json` was ALREADY STALE at `ae16fbe`, before this
lane touched anything** — `a9ed33d` (Merge T-102) landed three `.rs`
files after the last checkpoint's regen, so `index --check` at the base
reports STALE naming `agent/runner.rs`, `bin/fake_agent.rs` and
`tests/agent_runner.rs`, none of which this lane opened. Filed as
**`T-129-s4`**. It means the committed file is not a valid baseline, so
byte-identity was proven **binary against binary over identical trees**
instead:

| corpus | old binary (`ae16fbe`) | new binary | `cmp` |
|---|---|---|---|
| a pristine `ae16fbe` tree | 923 899 bytes · 178 files · 1967 symbols · 1881 edges · sha256 `42dba7c5…` | **identical, same sha256** | **exit 0** |
| this lane's own tree | 929 129 bytes · 179 files · 1981 symbols · 1885 edges | **identical** | **exit 0** |

**Byte-identical on both corpora, `depth_limited` absent from both** —
254 walked source files, 179 indexed, not one within 90 of the bound. The
`schema` stays 1 because both new fields are optional and omitted.

**GRAPH REGEN forecast for the integrator**, asked of the gate rather
than predicted: committed **921 608 · 178 · 1960 · 1881** → this lane's
tree **929 129 · 179 · 1981 · 1885** = **+1 file** (`tests/depth.rs`),
**+21 symbols**, **+4 edges**, **+7 521 bytes**. Against
`max_graph_bytes` 1 000 000 that is **92.91%**, up from 92.16%, with
**70 871 bytes of headroom** — the highest this repository has recorded,
and still nothing reports it. **Roughly a third of the +21 is T-102's
merge and not this lane's** (its three files moved 1960→1967 on their
own); the lane's own share is +14 symbols.

**NO REGENERATED GRAPH IS COMMITTED ON THIS BRANCH, and that is derived
rather than skipped**: `docs/architecture/graph.json` is not inside
C-07's declared `paths:` (`app/src-tauri/crates/nputer-index/**`), so it
is outside this card's fence, and CONVENTIONS puts the regen on the
integrator **at the checkpoint** — where it must be, since the checkpoint
edits indexed fixture files.

### 11. FIXTURES

**Nothing pathological is committed.** Every fixture in section 8 is
built as a `String` at run time; the integration bodies write theirs into
a `TempTree` under the system temp dir which removes itself on drop. The
largest is 20 000 path segments (~200 KB) and it exists for the duration
of one test.

### 12. WHAT WAS DELIBERATELY NOT BUILT

- **Arm 3** (`index_cmd.rs`'s false `"never a panic"`) — out of fence,
  C-05 `app-shell`. **Routed as `T-129-s1`** with the replacement comment
  ready to paste.
- **No reporting surface for the refusal** — the graph records it and
  nothing reads it. That is exactly the status `stats.skipped` has had
  since T-009, and inventing a one-off path for the new field while the
  old one stays silent would have been the worse call. **Routed as
  `T-129-s2`** with three arms.
- **The two recursions in `resolve/` and one in `arch/glob.rs`** — in
  fence, outside the card's scope, and a genuinely different class (their
  depth is a function of the DIRECTORY TREE, which the platform's path
  limit bounds long before this crate does). **Routed as `T-129-s3`**,
  measurement-first.
- **No CLI output change**, so `tests/cli.rs` is untouched.

### 13. THE POISON DRILL — 15 mutations, and THREE OF THEM CHANGED THE CODE

Run in `/Users/ujju/Projects/drill-T-129`, a **detached** worktree
**outside the repository**, named for this lane, with its own
`CARGO_TARGET_DIR` at `<drill>/.drilltarget` (`T-013-s7` arm (c), so the
parent's cache was never touched and no `CARGO_MANIFEST_DIR` binary
leaked either way). **Every mutation is PRODUCER-side; not one assertion
and not one shared literal was touched.** Every mutation was **read back
with `git diff` BEFORE its run**. Every restore was proved per path by
**sha256 against `git show HEAD:<path>`**, never by assertion. Drill
baseline at `980b903`: **193 passed / 0 failed / 2 ignored, exit 0**.
The worktree was removed when the drill finished (T-052-verify's
precedent) and `git worktree list` no longer carries it.

**THE DRILL IS THE REASON THREE OF THIS LANE'S FOUR COMMITS EXIST.** It
did not confirm the pins; it broke them, three times, and each break is
worth more than the fix it produced.

**(a) `c5aa0b8` — A FIXTURE THAT MADE ITS OWN COUNT INSENSITIVE.** M5
mutated `lib.rs`'s summary from `filter(|f| f.depth_refused.is_some())`
to `filter(is_none)` — a producer counting the exact wrong half. It
redded **four golden bodies** and
`every_bounded_traversal_…` and `the_worst_legal_nesting_…`, and
**`a_pathological_file_…` stayed GREEN while asserting
`stats.depth_limited == Some(1)`**. Its tree held ONE refused file and
ONE clean one, so `is_some()` and `is_none()` both count 1 and the
assertion cannot tell them apart. **A cardinality that happens to be
symmetric is a value poison passing for the wrong reason.** A second
ordinary file makes it 1 refused against 2 clean, the body now asserts
both, and the re-run of M5 at `c5aa0b8` reds **all three** integration
bodies.

**(b) `2a6a261` — TWO BOUNDARIES PINNED ONLY TO WITHIN TWO DEPTH UNITS.**
M11 (`pattern_names`' guard `> MAX_DEPTH` → `> MAX_DEPTH + 1`) and M12
(the same on `use_tree`) each killed **NOTHING — exit 0, the whole suite
green**. The cause is granularity: a nested use group costs TWO
`use_tree` frames per source level (`scoped_use_list` + `use_list`) and a
nested object pair costs TWO `pattern_names` frames
(`object_pattern` + `pair_pattern`), so no fixture in either body can
change its answer when the bound moves by one. **Both bodies were pinning
their boundary to within two, and the name on each said "at 65".** Fixed
by adding a granularity-ONE arm to each, each with its own positive
control — bare nested use lists (`use {{{Deep}}}`, one frame per level,
128 clean / 129 refused) and nested array patterns
(`const [[[deepBinding]]] = arr`, one frame per level, 125 clean / 129
the depth at which the pattern walk takes the file back from the scan).
Re-run at `2a6a261`, **M11 and M12 each red exactly one body**.

**(c) `fe0f45f` — THE LAST SURVIVING MUTANT.** M14 replaced a refused
record with `ExtractRecord::default()` while KEEPING the flag — "drop"
instead of "degrade", the exact behaviour criterion 1 forbids. It
survived the whole suite. The six extractor bodies DO assert that what
is above the bound survives, but they call the extractor directly and
**cannot see a caller that blanks the record**; the pipeline bodies
asserted the flag, the count and the file's presence, and none of them
asserted its CONTENT. The hostile file now carries
`pub fn keptAboveTheBound() {}` above its 20 000-segment `use`, and the
body asserts that symbol survives. M14 re-run: **reds that body alone.**

**THE KILL MATRIX. Uniqueness below is MEASURED, never inferred** — each
row's "kills alone" was read off that run's own `failures:` list, and the
two rows that do not claim it say so.

| # | mutation (producer side only) | exit | bodies redded |
|---|---|---|---|
| M1 | `MAX_DEPTH` 128 → **1024** | 101 | the **six** boundary bodies |
| M2 | `MAX_DEPTH` 128 → **32** | 101 | the six **+ `the_worst_legal_nesting_…`** |
| M3 | TS `refuse` first-wins → last-wins | 101 | the two TS site bodies + the coverage floor |
| M4 | `use_tree` names `RustModNesting` | 101 | `use_trees_…` + the coverage floor |
| M5 | `depth_limited` counts `is_none` | 101 | 4 goldens + 2 (see (a)); after `c5aa0b8`, **3 of 3** integration bodies |
| M6 | `depth_refused` never reaches `FileEntry` | 101 | `a_pathological_file_…` + the coverage floor |
| M7 | `declarations` guard off-by-one | 101 | **`inline_mod_nesting_…` ALONE** |
| M8 | `collect_segments` guard off-by-one | 101 | **`path_segments_…` ALONE** |
| M9 | `scan`'s guard loses its `return` | 101 | **`the_candidate_scan_…` ALONE** |
| M10 | `module_statement` guard off-by-one | 101 | **`ambient_declare_chains_…` ALONE** |
| M11 | `pattern_names` guard off-by-one | **0 → 101** | **NOTHING**, then **`binding_patterns_…` ALONE** after (b) |
| M12 | `use_tree` guard off-by-one | **0 → 101** | **NOTHING**, then **`use_trees_…` ALONE** after (b) |
| M13 | `module_statement` guard active only in a depth WINDOW | **0** | **NOTHING — and the mutation is the finding**, see below |
| M14 | a refused file DROPPED rather than degraded | **0 → 101** | **NOTHING**, then **`a_pathological_file_…` ALONE** after (c) |
| M15 | `use_tree`'s bound **DELETED** | 101 | one unit body **+ the `depth` binary ABORTS at SIGABRT** |

**M13 IS RECORDED BECAUSE IT FAILED AS A MUTATION, NOT AS A PIN.** It
narrowed the guard to `depth > MAX_DEPTH && depth < 200`, intending a
bound that works near the boundary and not far past it — so that the
coverage floor (whose drivers sit at 6 000–20 000) would be the only body
to notice. It killed nothing, and the reason is structural rather than a
gap in the suite: **a recursion increments one frame at a time, so it
passes THROUGH any depth window on the way down and refuses inside it.**
No "deep regime only" mutant of a depth guard exists. Stated because the
next reader will have the same idea.

**M15 IS THE STRONGEST RESULT AND IT IS THE ONE THE CARD IS ABOUT.**
Deleting `use_tree`'s bound outright leaves the lib test binary at
**151 passed / 1 failed** — one boundary body, an ordinary red — while
the `depth` binary **aborts**:

    thread 'every_bounded_traversal_is_reachable_from_a_real_file_and_names_itself'
      has overflowed its stack
    fatal runtime error: stack overflow, aborting
    process didn't exit successfully: …/deps/depth-e1f4c7aa9db80883
      (signal: 6, SIGABRT: process abort signal)

**The abort NAMES the body**, and it is the only body whose inputs are
deep enough to produce one. **`cargo test` reports that as its own 101,
not as 134** — the binary's own exit is where the 134 lives — which is
this card's harness trap arriving inside the drill.

**THE SHAPE-SIX ANSWER, PER BODY, AND TWO OF NINE ARE HONEST NEGATIVES:**

| body | unique kill | measured? |
|---|---|---|
| `inline_mod_nesting_…` | M7 | **yes, alone** |
| `use_trees_…` | M12 (after (b)) | **yes, alone** |
| `path_segments_…` | M8 | **yes, alone** |
| `ambient_declare_chains_…` | M10 | **yes, alone** |
| `binding_patterns_…` | M11 (after (b)) | **yes, alone** |
| `the_candidate_scan_…` | M9 | **yes, alone** |
| `a_pathological_file_…` | M14 (after (c)) | **yes, alone** |
| `every_bounded_traversal_…` | M15, as an ABORT naming it | **yes** — no mutant reds it alone as an assertion (M3/M4/M5/M6 all red it in company); its unique contribution is being the only body deep enough to abort when a bound is deleted |
| `the_worst_legal_nesting_…` | **NONE FOUND** | it reds under M2 and M5, always in company. **Stated as a negative rather than claimed** |

**`the_worst_legal_nesting_…` HAS NO UNIQUE PRODUCER MUTANT AND THAT IS
SAID PLAINLY.** What it guards is a fact about the constant AND the
platform — "the deepest legal input fits in the smallest stack a caller
hands us" — and no edit to the source can simulate a smaller stack. Its
input is three literals (128 / 64 / 129), so raising `MAX_DEPTH` leaves
it green; what stops that being a hole is that
`inline_mod_nesting_extracts_at_128_and_refuses_at_129` pins the constant
to **exactly 128** with literals on both sides, so the constant cannot
move without a red. The two bodies hold the property jointly and neither
holds it alone. CONVENTIONS says shape six *"has no mechanical remedy —
the drill has to ASK"*; this is the asking, and the answer is a
limitation rather than a clean bill.

### 14. SUITES AND GATES — every exit read unpiped, every count derived

**`cargo test --no-fail-fast` from `app/src-tauri`: 469 passed / 0 failed
/ 3 ignored, exit 0**, SUMMED over **17** `test result:` lines and
derived rather than read off the exit. Lib suite (`nputer_lib`)
**5.05s** — the **GREEN** band (`T-088-s4`: green under 9.5s, red over
14.6s, nothing between), `app/src-tauri/target` at 3.3 GB. **Both known
intermittents read BY NAME and both `ok`**:
`docs_watch::tests::startup_arm_watches_the_initial_root` and
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`.

**THE COUNT'S ARITHMETIC CLOSES AND STATE'S 455 IS NOT THIS LANE'S
BASELINE.** STATE's reference is 455 over 16 lines at the T-107
checkpoint `05dd4d9`. Between it and this lane's base sits
`a9ed33d` (Merge T-102), which adds **5** `#[test]` bodies — so the base
at `ae16fbe` is **460 over 16**. This lane adds **9** bodies (6 unit + 3
integration) and **one test target**: 460 + 9 = **469**, 16 + 1 = **17**.
The three later commits add ASSERTIONS to existing bodies, not bodies, so
the count does not move again.

**ALL THREE STANDING GATES FIRE, each derived from the prescribed
14-path range rather than assumed.**

| gate | trigger | on these 14 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/tsx/js/jsx` or `*.rs` outside `docs/` | **9 — FIRES** | **exit 1, a REAL stale** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **9 — FIRES** | **exit 0** |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES** | **exit 1**, three suites owed, all green |

**THE BOOT GATE FIRES, AND THE DISPATCH BRIEF GUESSED OTHERWISE.** The
brief said *"The BOOT GATE does not obviously fire on `crates/**` —
derive that rather than assuming, and say which way it came out."* It
came out **FIRES**, on two independent readings. Literally: the trigger
is the path prefix `app/src-tauri/**` and
`app/src-tauri/crates/nputer-index/src/lib.rs` is under it. Meaningfully:
`nputer_lib` depends on `nputer_index` (that is what `index_cmd.rs`
imports), so this crate is a build input to the app binary and a
regression here really can stop the app booting — which is the property
T-040 created this gate for. Run as
`NPUTER_BOOT_PORT=15290 npm run boot:check` from tools/e2e, **exit 0**,
both `[nputer]` lines observed —
`[nputer] project folder: /Users/ujju/Projects/nputer-T-129` and
`[nputer] window "main" created` — process tree stopped by SIGTERM, no
orphan (15290 back to zero `lsof` rows).

**GRAPH REGEN — asked, not predicted**, and read off the SECOND line as
this project's own trap requires: it printed both counts and a
`+`/`~` file diff rather than `committed: MISSING`, so it is a real stale
and not the `--root` false red. **Committed 921 608 · 178 · 1960 · 1881
→ fresh 929 129 · 179 · 1981 · 1885**: `files +1 -0 ~11`, `edges +7 -3`.
**THREE OF THOSE ELEVEN ARE NOT THIS LANE'S** — `agent/runner.rs`,
`bin/fake_agent.rs` and `tests/agent_runner.rs` were already stale at the
base (`T-129-s4`), and they account for **+7** of the +21 symbols. This
lane's own share is **+1 file, +14 symbols, +4 edges, +7 521 bytes**, and
every new edge endpoint is inside C-07, so no component relation moves.
Against `max_graph_bytes` 1 000 000 that is **92.91%** with **70 871
bytes of headroom** — the highest recorded, and still nothing reports it.
**No regenerated graph is committed here**: `docs/architecture/graph.json`
is not in C-07's declared `paths:`, and the regen belongs to the
integrator at the checkpoint.

**DOCS GATE — exit 1, FIRES on 5**, invoked DIRECTLY from the repo root
with the RANGE RULE's own `$(…)` path list, **never through `xargs`**,
stderr read FIRST (no missing-`yaml` trace — `npm ci` in tools/e2e ran in
THIS worktree only). Three suites owed and all three green:

- **`npx vitest run` from lib/parser — 264/264 across 12 files, exit 0**
- **`npm test` from app/ — 958/958 across 46 files, exit 0**
- **`npm test` from tools/e2e — TWO RUNS, BOTH DECLARED**

`cargo test from app/src-tauri/` is **NOT owed and that is derived**: the
diff carries no `docs/CONVENTIONS.md`, no `docs/architecture/components`
and no `docs/research/` capture, which are the three things its readers
resolve. It was run anyway and is green. The gate reports **12 derived
readers across 4 suites**, a census of **130** docs-shaped sites in 22
files, and **0 frontmatter issues** — *"every live task card's
frontmatter parses, with a legal status"*, which is this card's
`status: verifying` and the four new suggestion files checked rather than
assumed.

**`T-120-s3` FIRED ON THE FIRST E2E RUN AND THIS IS THE FOURTH PASS TO
CATCH IT WITH THE DIGITS.** Run 1: **exit 1, 145 passed / 1 failed**, on
`tools/e2e/tests/token-scan.spec.ts` —

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787663676918.452
    Received: 1787663676918

A fractional tail against a whole number, which STATE says *"is this and
not your own change"*. This is a fresh worktree and it was its first E2E
run, exactly the condition. **Run 2, nothing changed on disk, same
scratch port 14530: exit 0, 146/146** — red once, green forever after, in
this checkout. **BOTH RUNS DECLARED, and the second was not a fix.**
The total is **146**, not main's post-T-091 **171**, because T-091 merged
after this lane's base.

**PORTS AND THE HUMAN'S APP.** Scratch ports **14530** (e2e) and
**15290** (boot) were each `lsof`-read FIRST (zero rows), then
bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in that
order, with a probe **this lane wrote itself** rather than one taken by
name out of the shared scratch directory; both were free again
afterwards. **1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
nothing else** — no bind, no connect, on any interface. Holder `node`
pid **88948**, cwd `/Users/ujju/Projects/nputer-app/app` — **a different
checkout**, which is what made the three `npm ci`/`npm install` runs in
this worktree safe, and which is CONVENTIONS' item-3 repair (test the
CHECKOUT, not the port) applied rather than quoted. The app binary is pid
**89201**, started **2026-08-25 10:54:33**, unchanged before and after,
read with the ANCHORED `awk '$NF=="target/debug/nputer"'`. No `pkill`, no
`cargo clean`, no process from this lane survives. **These are
live-environment facts and carry the time they were read.**

**THE RANGE, at its own ref and re-derived twice because main moved
twice under this lane.** `merge-tree`'s exit was read BEFORE the
substitution both times, and both times it was **0** — a tree, not a
conflict report.

| main tip | prescribed pre-merge | forbidden two-dot | main's advance | branch | intersection |
|---|---|---|---|---|---|
| `a649766` | **14** | 66 (4.71x) | 52 | 14 | **EMPTY** |
| `eea61e0` | **14** | 74 (5.29x) | 60 | 14 | **EMPTY** |

14 + 52 = 66 and 14 + 60 = 74: the arithmetic closes at both refs, the
two sets are disjoint under `comm -12`, and **the entire swing is
left-endpoint drift** — this lane's own 14 paths never move.
