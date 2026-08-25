---
id: T-129-s3
title: Two recursions in nputer-index sit outside the extractors, are bounded by filesystem path depth and nothing else, and one of them is on index()'s own in-app path
status: suggested
suggested_by: executor claude-opus-5 @T-129
---

T-129's criterion 1 scopes to *"every self-recursive function in
`extract/`"* and that scope was honoured exactly: six were found, six
were bounded, and the enumeration is now structural (`graph::DepthSite`
has one variant per bound, so a seventh cannot be added silently).

**This is the residual the enumeration turned up one directory over.**
It is IN T-129's fence and deliberately NOT built, because it is a
different class with a different threat model and folding it in would
have made one card two — `method/roles/executor.md` step 5: suggestions
never expand your scope.

## Derived from `src/**`, not listed

Every self-recursive function in the crate outside `extract/`, with what
its depth is a function of:

| function | file | depth is | on `index()`'s path? |
|---|---|---|---|
| `resolve::PackageIndex::nearest` | `src/resolve/mod.rs` | the directory nesting of the deepest walked file | **YES** |
| `resolve::tsconfig::TsconfigIndex::nearest` | `src/resolve/tsconfig.rs` | the same | **YES** |
| `arch::glob::go` | `src/arch/glob.rs` | pattern segments + path segments | no — `arch` is a CLI reporter |

Both `nearest` functions walk UP the parent chain of a directory string
until they hit the root, memoising on the way. `go` is a memoised glob
matcher whose table is preallocated but whose recursion is not bounded.

## Why this is a NARROWER class than T-129's, stated so the next reader does not over-read it

T-129's defect was driven by a file's **CONTENTS**: one text file, any
size, arbitrary nesting, and the attacker needs nothing but the file. A
20 000-segment `use` path is 200 KB of text.

These three are driven by the **DIRECTORY TREE**, and that is bounded by
the filesystem long before it is bounded by anything in this crate.
`walk_root` calls `path.canonicalize()` on every entry, which fails past
the platform's path limit, and each nesting level costs at least two
bytes of that budget. On this platform that is a few hundred levels, not
tens of thousands.

**Narrow is not closed** — this is the same sentence T-129's card uses
about its own reachability — and the honest statement is that nobody has
measured where these actually break, only that the input to break them
is a hostile *tree* rather than a hostile *file*, and that a hostile tree
is a much louder thing to ask a user to clone.

## What a card here should do

1. **MEASURE FIRST.** Build a deep directory tree at run time (never
   committed) and find the real threshold for each of the three, the way
   T-129's own thresholds were re-derived. If `canonicalize` refuses
   before the recursion does, the finding closes as *bounded by the
   platform* and says so with the number.
2. **IF a threshold exists, take the same shape T-129 took**: bound it,
   record the refusal, add a `DepthSite` variant, pin it with a literal
   on both sides and a positive control beside it. The mechanism is
   already there and costs one enum variant.
3. **DO NOT reach for `arch::glob::go` in the same commit unless the
   measurement says to.** It is not on `index()`'s path, so it cannot
   take the app down — it can only take a CLI reporter down, which is a
   different severity entirely.

Fence `[crate-index]`, free at this filing.
