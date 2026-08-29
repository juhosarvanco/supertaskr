---
id: T-129-s1
title: IndexOutcome::Error's doc comment promises "never a panic" and that is false for the stack-overflow class — T-129 removed the cause and cannot reach the sentence
status: parked
suggested_by: executor claude-opus-5 @T-129
---

Absorbs: T-129-s5 (Amnesty triage 2026-08-29 (triage seat)) — the same class from the same lane's other side — T-129's prose outran its code — and both are ready-to-paste text with no assertion moving. Here the depth.rs comment describes the REJECTED MAX_DEPTH = 256 fixture (256 mods / 128 groups / 257 segments), every number exactly double the literal beneath it, and the input it names is one the body would REFUSE. Its fence is crate-index where this card's is app-shell, which is why one card wants both.

**THIS IS T-129's ARM 3, ROUTED RATHER THAN REACHED FOR, and it is filed
with the exact one-line correction.** T-129's fence is
`touches: [crate-index]` = C-07 = `app/src-tauri/crates/nputer-index/**`.
The sentence lives in `app/src-tauri/src/index_cmd.rs`, which is C-05
`app-shell` — held by T-033 at this card's dispatch. A fence is not
widened from inside the lane it fences.

## The sentence

`app/src-tauri/src/index_cmd.rs`, on the `IndexOutcome::Error` variant:

```rust
    /// IndexError (or a refused write target), Display'd — never a panic.
    Error { message: String },
```

**"never a panic" was false for one class and is now merely INCOMPLETE.**
Before T-129, a source file with pathological nesting made
`nputer_index::index()` overflow its stack — and a Rust stack overflow is
an `abort()`, not a catchable panic, so no `catch_unwind` helped and no
error path ran. `run_index` never returned at all; the whole Tauri
process went down, taking the window, the docs watcher, the agent runner
and any interview mid-turn. Measured at `ae16fbe` against the shipped
binary, exit **134** on every row (`fatal runtime error: stack
overflow`):

| input | shape | aborts at | still green at |
|---|---|---|---|
| nested inline `mod` | `('mod a {' × n) + ('}' × n)` | 5 000 | 4 000 |
| nested use groups | `use ('a::{' × n) + 'X' + ('}' × n);` | 3 000 | 2 000 |
| path segments | `use s0::s1:: … ::sN;` | 20 000 | 12 000 |
| nested `namespace` (TS) | `('namespace nK {' × n) + ('}' × n)` | **2 000** | 1 000 |
| nested object literal (TS) | `('{a:' × n) + '1' + ('}' × n)` | **4 000** | 2 000 |
| nested destructuring (TS) | `('{a:' × n) + 'z' + ('}' × n)` | **4 000** | 2 000 |
| parenthesised expression (TS) | `('(' × n) + '1' + (')' × n)` | 10 000 | 4 000 |
| member chain (TS) | `o` + `('.x' × n)` | 10 000 | — |

## Why the sentence still wants correcting after T-129

T-129 bounds every self-recursive traversal in `extract/`, so **the
class it names is closed**: the deepest legal traversal is a constant,
and the worst legal input now completes inside a 2 MiB thread stack.
That removes the CAUSE. It does not make the SENTENCE true, for two
reasons, and both are why this is worth a card rather than a shrug:

1. **The sentence is a guarantee about a whole variant, defended by
   nothing.** No test on this tree asserts that `run_index` cannot
   abort — nor could one, since an abort is not a test failure and would
   take the test binary with it. A comment that promises what nothing
   holds is this project's third-most-common defect class.
2. **Two recursions remain inside the crate that T-129 deliberately did
   NOT bound** (see `T-129-s3`), and one of them is on `index()`'s own
   path. Their depth is bounded by filesystem path depth rather than by
   file content, which is a different and much narrower class — but
   "never a panic" does not distinguish classes.

## The correction, ready to paste

```rust
    /// `IndexError` (or a refused write target), Display'd. The indexer
    /// degrades rather than failing — an unparseable, unreadable or
    /// too-deeply-nested file is recorded and skipped, never raised —
    /// so this variant carries a REFUSED RUN (a bad root, a write it
    /// would not perform), never a file's own contents. It is not a
    /// promise that the call cannot abort: `index()` runs in THIS
    /// process, and a Rust stack overflow is an `abort()` no error path
    /// survives. T-129 bounded every recursive traversal in the
    /// extractors so that no file's contents can reach one; that is the
    /// property this variant rests on, and it lives in C-07 rather than
    /// here.
    Error { message: String },
```

## Fence

`[app-shell]` (C-05). One doc comment, no behaviour, no IPC, no grant. It
rides any `app-shell` card cheaply — and the two things it says are worth
saying beside each other: what the variant DOES carry, and where the
no-abort property actually lives.

Amnesty triage 2026-08-29 (triage seat): PARKED — both halves are ready-to-paste prose with no behaviour, no IPC and no grant, and both are live at this base. The sentence is a guarantee about a whole variant defended by nothing — no test on this tree asserts that run_index cannot abort, nor could one, since an abort is not a test failure and would take the test binary with it. T-129 removed the CAUSE and could not reach the SENTENCE, which is the shape this card exists to record. RESURFACES: the next app-shell dispatch for the index_cmd.rs doc comment, paired with crate-index for the depth.rs comment absorbed here; both ride any such card cheaply and neither moves an assertion.
