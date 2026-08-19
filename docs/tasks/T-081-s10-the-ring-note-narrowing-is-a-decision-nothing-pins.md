---
id: T-081-s10
title: The ring note's narrowing to unannounced denials is a stated decision that no body can fail
status: suggested
suggested_by: verifier claude-opus-5 @T-081-verify2
---

T-081's implementation notes state a design decision under **TWO — the
`result` line's unannounced denials are EMITTED, not only relayed into
the ring**:

> The ring note is narrowed to the same unannounced subset, because a
> name already delivered as its own event does not need repeating in a
> tail.

The narrowing is implemented — `denial_names(unannounced.iter().copied())`
rather than `denial_names(&denials)` — and it is the right call.
**Nothing in the suite would notice if it were reverted.**

## Measured

Producer-side mutation, one-sided, text read back with `git diff -U1`
before the suite ran, restoration proved by sha256 against
`git show HEAD:<path>` and an empty `git diff`:

    -   let unreported = denial_names(unannounced.iter().copied());
    +   let unreported = denial_names(&denials);

Bare `cargo test` at `5b14603`: **352 passed / 0 failed / 3 ignored,
exit 0.** Zero bodies red. The mutation reverts the decision exactly and
the suite agrees with both versions.

## Why no fixture reaches it

The ring note only becomes user-visible through `stderr_tail`, which
rides `TurnError::ExitNonZero`. So the difference needs all three of:

1. at least one denial announced in band (otherwise
   `unannounced == denials` and the two forms coincide);
2. the `result` line listing it (always — the array is cumulative);
3. the turn classified `ExitNonZero` rather than `ToolDenied`, since
   `ToolDenied` carries no `stderr_tail` field at all.

Condition 3 requires `is_error: false` with a non-zero process exit —
which is precisely `denied-then-end-turn`'s shape, the T-029-s7 fixture.
But that fixture carries **no in-band line**, so it fails condition 1;
and every fixture that satisfies condition 1 exits **0**, so the tail
never surfaces. The two halves of the reachable case live in different
fixtures.

**This is not exotic.** 2.1.226 announces every denial in band, so on the
CURRENT CLI a `denied-then-end-turn` turn would always carry in-band
lines — the fixture models an older build. Against the CLI the card was
written for, the narrowing is exactly the path a recovered denial on a
turn that exits non-zero would take, and a reverted narrowing would show
the user the same refusal twice: once as its own `Denied` event, once
more inside the diagnostic tail.

## Not blocking, and why

The card does not mandate the narrowing. Criterion 4 says *"THE SAME
DENIAL SHALL NOT BE REPORTED TWICE"*, and both `Denied` events are
correctly joined — the ring note is a diagnostic blob on an
already-failing turn, not a second denial report. The narrowing is a
refinement the executor chose and stated, which is the right way to make
it reviewable; the gap is only that a stated decision has no body that
dies when it is undone.

## Suggested close

Give `denied-then-end-turn` an in-band line for its single denial, or
add a sibling scenario that has one, and assert the tail names the
unannounced set only. That makes the reverted narrowing red, and it also
brings the older-CLI fixture into line with what 2.1.226 actually emits.
Worth pairing with `T-069-s3`'s territory, which owns the tail's
multi-denial behaviour.
