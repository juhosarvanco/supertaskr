---
id: T-078-s6
title: The walk table warns about the E2E lane that parses CONVENTIONS and not about the Rust test that reads it
status: suggested
suggested_by: verifier claude-opus-5 @T-078-verify
---

`docs/CONVENTIONS.md`'s THE FOUR WALKS table closes its "what that means
at a diff" paragraph with:

> THIS FILE is seen by CONTROL only: the parser never reads it, which is
> why an edit here cannot move the parser suite — but see the CI bullet
> under "Build & test", because the E2E lane parses it and an edit there
> can red that lane.

Every clause is TRUE. The problem is the shape: having volunteered ONE
reader outside the four walks, the sentence reads as the complete list
of ways an edit to this file can red something. It is not.

**The omitted one:** `snapshot_version_matches_the_live_method_stamps`
in `app/src-tauri/src/agent/kit.rs` reads the real `docs/CONVENTIONS.md`
off disk on every `cargo test` and asserts it contains
`currently v{METHOD_SNAPSHOT_VERSION}` — `METHOD_SNAPSHOT_VERSION` being
a Rust `const` in the same file. So this file has **two** live couplings
outside the four walks: the E2E lane, which reds on a command bullet,
and the Rust suite, which reds on the method stamp in the first gotcha.
The table names one.

That is one-sidedness in the sense this very card wrote into the poison
drill — a statement that is true about the side it looked at and silent
about the side it did not. It is also the sharper of the two for a
reader following the table's advice, because the E2E coupling is
announced loudly in the CI bullet the table points at, while the Rust
one is announced nowhere: `docs/CONVENTIONS.md`'s own first gotcha reads
as bookkeeping ("version-bumped (currently v0.1.5) and noted here"), not
as an enforced pin.

**The ask, and it is already half-written.** T-078-s3 arm 1 proposes
naming `METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs` in
that first gotcha and saying a method format bump is a three-file commit
including Rust. Do that, and add the second half of the walk table's
sentence — "…and `kit.rs` reads it live for the method stamp" — so the
table's list of non-walk readers is closed rather than open. A symbol
citation, per this card's own new rule, in the bullet that introduced
the rule.

Not a blocker for T-078: the sentence as written is true, and the
`currently v0.1.5` pin is intact and untouched by that branch (zero
added or removed diff lines carry the needle).
