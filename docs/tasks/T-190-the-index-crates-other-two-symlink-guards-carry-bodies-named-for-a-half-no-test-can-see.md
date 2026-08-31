---
id: T-190
title: The index crate's other two symlink guards carry bodies NAMED for a shadowed half, and lifting that half leaves the whole crate suite green — measured, and it corrects a sentence in T-140-s9's landed sweep
feature: F-06
milestone: 4
priority: 5
size: S
status: suggested
blocked_by: []
touches: [crate-index]
suggested_by: executor claude-opus-5@subagent @T-186
builder:
review:
---

**FOUND BY `T-186`'S CLASS SWEEP, AND MEASURED RATHER THAN INFERRED.**
`T-186` corrected `walk_root`'s four shadowed checks. Its sweep for the
same class inside the same fence found two more shipped sites, and both
are the class rather than merely the shape.

## The two sites

Both fold the halves into ONE expression over `symlink_metadata`, so the
`is_symlink()` half is inert for the reason `T-140-s9` established: under
lstat a link is neither file nor dir, so the right-hand operand refuses it
anyway.

1. `arch/registry.rs::read_registry` —
   `if meta.file_type().is_symlink() || !meta.is_dir()`
2. `resolve/mod.rs::read_contained` —
   `if meta.file_type().is_symlink() || !meta.is_file()`

## What makes them the class rather than the shape

**Each has a body NAMED for the half that cannot be detected**:
`a_registry_directory_that_is_a_symlink_is_refused_not_followed`
(`tests/arch.rs`) and `symlinked_tsconfig_is_never_read`
(`resolve/tsconfig.rs`). That is the difference between "two halves that
happen to shadow" and "a suite reporting coverage it does not have".

**MEASURED at `e71198f`**, one arm each, one side only, in a detached
scratch worktree with its own `CARGO_TARGET_DIR`, each restored and proven
by sha256: lifting the `is_symlink()` half at either site leaves
`cargo test -p nputer-index` at **exit 0 with nothing red**.

## AND IT CORRECTS A LANDED SENTENCE

`T-140-s9`'s sweep classified both sites as *"same shape, no false
coverage"*, on the stated ground that *"no body is named for the half"*.
**That clause is false at this ref for both sites.** The shadowing half of
that classification was right; the coverage half was not. This card exists
because `T-140-s9`'s own verifier found the identical failure one function
away — a sweep that stopped short inside its own fence — and the remedy it
assigned was to name the sites, not to leave them.

## What a lane would do (proposed, not ruled)

The `T-186` shape, applied twice: name each half at its site for what it
independently contributes, and — before assuming the sibling's verdict —
**MEASURE whether the surviving half is separately pinnable here.**
`T-186` is the worked warning: its sibling one crate over proved a
`!meta.is_file()` half undetectable, and in the index walk the same half
turned out to have a fixture, because that walk filters on a NAME rather
than a resolved path. `read_registry`'s surviving half is `!meta.is_dir()`
and `read_contained`'s is `!meta.is_file()`; whether either has a fixture
is an open question this card must answer by running it.

**Delete nothing.** `T-140-s9`'s ruling stands: a provably
behaviour-neutral line on an ADR-010 boundary buys zero discrimination by
leaving and costs a visible containment statement. The evidence is what
changes.

## Acceptance criteria

- EACH of the two sites SHALL be named at its site for what each half
  independently contributes.
- WHERE a surviving half is separately detectable, a body SHALL pin it
  ALONE; where it is not, the card SHALL record that with the attempts
  shown.
- The two bodies named for a shadowed half SHALL say, at their site, what
  they actually pin.
- EVERY body added or changed SHALL be poisoned one side only, read back
  with `git -C <dir> diff`, restored, and the restoration proven by hash.
- NO layer SHALL be deleted merely for being shadowed.
- Verification: headless, `cargo test`.

## Read beside

`T-186` (the same finding, corrected, with the dedup trap and the
count-1 mutant recorded at their site) and `T-140-s9` (the ruling, and the
sweep sentence this card corrects).
