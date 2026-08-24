---
id: T-010-s8
title: Pathological nesting in any indexed source file overflows the stack and ABORTS the process, and index_repo hosts the indexer in-process
status: suggested
suggested_by: verifier claude-opus-5 @T-010-verify
---

**This is NOT a T-010 defect and the measurement says so in both
directions.** It is a pre-existing property of the crate, present since
T-009, measured at T-010's verification against BOTH binaries. T-010's
only contribution is to widen the input class it applies to, from
`.ts/.tsx/.js/.jsx` to `.rs` as well. It is filed here because T-010's
verification is where it was first measured, not because T-010 caused it.

## What happens

Every one of these aborts the process with **exit 134** (SIGABRT,
`fatal runtime error: stack overflow`) rather than degrading, refusing,
or recording anything. Measured at lane tip `cb13957` with
`nputer-index index --root .` over a one-file fixture:

| input | shape | exit |
|---|---|---|
| 5 000 nested inline `mod a { … }` | `('mod a {' * n) + ('}' * n)` | **134** |
| 3 000 nested use groups | `use ('a::{' * n) + 'X' + ('}' * n);` | **134** |
| 20 000 `::` path segments | `use s0::s1::…::sN;` | **134** |

…and the same shapes one step smaller are green, which is what makes the
above a threshold rather than a guess: nested `mod` is exit 0 at **4 000**,
nested groups exit 0 at **2 000**, path segments exit 0 at **12 000**.

**THE SAME CLASS EXISTS ON THE TS SIDE AND PREDATES THIS TASK.** Built
against `d43455b` (main, no Rust support) and against `cb13957`, over
identical inputs — `namespace a {` nested 10 000 deep, a 10 000-deep
object literal, a 10 000-deep parenthesised expression, and a 50 000-link
member chain — **all four abort at 134 on BOTH binaries**, eight runs,
no divergence. So the crash is the crate's, not the Rust extractor's.

**IT IS NOT TREE-SITTER.** 10 000 nested braces inside a function body —
which tree-sitter parses in full and the extractor deliberately does not
descend into — is **exit 0**. The parse and the tree's drop both survive
the depth the traversal dies on, so the unbounded recursion is ours:
`extract::rust::Cx::declarations`, `use_tree`, `collect_segments`, and
their TS-side siblings.

## Why it is worth more than a CLI exit code

`app/src-tauri/src/index_cmd.rs` runs `nputer_index::index()` **in the
app's own process**, behind the zero-argument `index_repo` command. A
Rust stack overflow is an `abort()`, not a catchable panic, so it takes
the whole Tauri process with it — the window, the watcher, the agent
runner, an in-flight interview. `IndexOutcome::Error`'s own doc comment
says *"IndexError (or a refused write target), Display'd — **never a
panic**"*, and that sentence is false for this class.

The reachability is real but narrow, and it is worth stating honestly:
no human-written source has this shape. It needs a generated or hostile
file, in a project folder the user opened. That is the same trust
boundary `T-013`'s `git` finding turned on — the opened folder is the one
directory an attacker controls by asking the user to clone a repository —
which is why this is filed rather than shrugged at.

## The fix directions, cheapest first

1. **A depth counter on each recursive traversal**, refused past a
   constant, recording the file in `unresolved[]` (or a new stats field)
   and continuing — the crate's existing "degrade, never fail" contract
   applied one layer deeper. This is the smallest change and it fits the
   `ExtractRecord::default()` fallback already in `lib.rs`.
2. **Run the walk on a spawned thread with an explicit stack size**, which
   raises the ceiling without closing the class — worth having as well,
   never instead.
3. Correct `IndexOutcome::Error`'s "never a panic" comment either way, so
   the doc stops asserting a guarantee the code does not make.

Arm 1 wants a positive control beside it: a file at depth `LIMIT - 1`
that still extracts everything, so "it was refused" cannot be satisfied
by a file nothing parsed at all.
