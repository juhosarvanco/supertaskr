---
id: T-129
title: Pathological nesting in any indexed source file aborts the process at exit 134 — and the indexer runs inside the app, so it takes the window, the watcher and an in-flight interview with it
feature: F-06
milestone: 4
priority: 6
size: M
status: building
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
