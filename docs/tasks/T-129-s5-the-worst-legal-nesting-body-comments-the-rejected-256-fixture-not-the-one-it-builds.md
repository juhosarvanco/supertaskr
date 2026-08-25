---
id: T-129-s5
title: tests/depth.rs's worst-legal-nesting body describes a fixture twice the size of the one it builds — the comment is the REJECTED MAX_DEPTH = 256 variant, and the input it names is refused
status: suggested
suggested_by: verifier claude-opus-5 @T-129
---

**NOT A FAILURE AND NOT FOLDED INTO THE VERDICT** (`method/roles/verifier.md`
rule 6). No criterion of T-129 fails, no body is wrong, and the margin the
comment carries is CORRECT — I re-measured it. What is wrong is the prose
beside it, and it is wrong in the one class T-129's own card names as
*"this project's third-most-common defect class"*.

## The mismatch

`app/src-tauri/crates/nputer-index/tests/depth.rs`, in
`the_worst_legal_nesting_completes_on_a_small_explicit_stack`:

| the comment says | the code builds | line |
|---|---|---|
| "`declarations` (**256** inline modules)" | `for i in 0..128` | ~263 / 283 |
| "`use_tree` (**128** groups)" | `for i in 0..64` | ~264 / 273 |
| "`collect_segments` (**257** segments)" | `(0..129)` | ~264 / 271 |
| "anchored through all **256** inline modules" | 128 | ~322 |

Every number is exactly DOUBLE the literal beneath it. That is the
signature of the rejected candidate: for `MAX_DEPTH = 256` the ceiling
fixture IS 256 mods / 128 groups / 257 segments, because a `mod` costs one
depth unit per source level, a use group costs TWO, and an n-segment path
costs n-1. The body was evidently written for 256, halved when 256 was
measured and rejected, and the comment did not follow.

## It is not a typo — the input the comment names would FAIL this body

Measured at `edbc28f`, debug binary, one file per root, exit from `$?`
unpiped:

    128 mods / 64 groups / 129 segments  ->  depth_refused: None          <- what the code builds
    256 mods / 128 groups / 257 segments ->  depth_refused: rust-mod-nesting

The body asserts `assert_eq!(worst.depth_refused, None, …)`. So the fixture
the comment describes is one the body would REJECT. A reader who trusts the
comment — the likely reader being whoever next moves `MAX_DEPTH` — sizes the
replacement fixture wrong in the direction that makes it refuse.

## The lane's own notes are RIGHT, which is what makes this cheap

The Implementation notes say 128 / 64 / 129 in both places they mention the
input (§9's pre-fix table row, §12's "its input is three literals
(128 / 64 / 129)"). Only the test file's comment disagrees, so there is no
question about which number is intended.

## What is NOT wrong, stated so the fix does not over-reach

The stack figure in the same comment is CORRECT for the code's input.
Re-derived independently by bisecting an explicit thread stack against the
fixture the code actually builds:

    2048 KiB -> 0 · 1024 -> 0 · 768 -> 0 · 640 -> 0 · 512 -> 134 · 384 -> 134

so the worst legal input needs **512–640 KiB** debug, ~3.2x under 2 MiB,
exactly as documented. The rejected 256 variant needs **896–1024 KiB**
(1280 -> 0, 1024 -> 0, 896 -> 134), ~2.0x, also exactly as documented. Both
margins hold; only the prose describing the fixture is stale.

## Arm

One arm, four numbers, inside C-07 (`app/src-tauri/crates/nputer-index/**`):
change 256 -> 128, 128 -> 64, 257 -> 129 in the comment block, and 256 -> 128
in the closing "anchored through all …" sentence. No code moves, no
assertion moves, and the suite is unchanged by it.

Fence `[crate-index]` (C-07). Rides any `crate-index` card cheaply.
