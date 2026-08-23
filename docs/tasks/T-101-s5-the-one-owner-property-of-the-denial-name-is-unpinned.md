---
id: T-101-s5
title: The one-owner property of the denial tool name is unpinned — a two-owner split survives the whole suite
status: parked
suggested_by: verifier claude-opus-5 @T-101-verify
---

`denialToolName` in `app/src/genesis/interview-model.ts` exists to give
two callers one answer, and its doc comment says why:

> *"Two callers need it and they must not disagree: `denialLine` PRINTS
> it, and `visibleDenials` below decides whether the terminal failure
> block already said it. If those two computed the name differently, a
> refusal could be suppressed under one spelling and displayed under
> another — criterion 7's 'the same refusal' would stop being one
> thing."*

**Nothing in the suite holds that property.** Measured at `a86703d`, one
side only, mutating the KEY while leaving the printer alone:

    -    const name = denialToolName(denial);
    +    const name = denial.toolName;

    app npm test -> 863 / 863 passed, exit 0   (SURVIVOR)

Every other mutant of this pair reds: `denialToolName` returning
`denial.toolName` raw reds the degenerate body (862/863), and so does
dropping only its `.trim()`. What survives is specifically **the split** —
printer normalised, key not.

**Why the suite cannot see it.** The split is only observable for a
`toolName` that needs normalising (`" Bash "`, `"Bash "`) which ALSO
appears in `error.denials`. No fixture has one: the blank-name row is
`"   "`, which normalises to `null` under both spellings and is kept
either way.

**Unobservable in production today, for the same reason the `??` hole
was.** `denial_field` in `runner.rs` trims before it yields a name, and
`denial_names` clones an already-trimmed `tool_name` into
`error.denials`, so both sides of the comparison are pre-trimmed by the
Rust boundary. It is **not** a criterion violation: with one owner the
two spellings are identical by construction, and the code as written has
one owner.

**Why close it anyway.** T-101 closed the printer's half of exactly this
argument on the principle that the saving invariant *"lives in Rust, in
another fence, and nothing on this side recorded the dependency"* — and
then recorded the keying half's dependency only in prose. One fixture
closes it: a denial with `toolName: " Bash "` on a `toolDenied` turn
whose `error.denials` is `["Bash"]`, asserting the row is suppressed.
That reds the split and nothing else.

Low priority. Defence-in-depth on an invariant currently held one layer
down, which is the same bet the neighbouring line already declined to
make.

**PARKED at the seventh triage (2026-08-24).** Unpark at any edit weakening the Rust-side trim (`denial_field` / `denial_names` in runner.rs) that currently makes the two-owner split unobservable. Reproduced by three pairs of hands; not a criterion violation.
