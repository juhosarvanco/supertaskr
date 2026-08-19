---
id: T-078-s3
title: A card fenced to [docs/CONVENTIONS.md, method/] cannot change method/ — the version bump lands in a Rust constant
status: suggested
suggested_by: executor claude-opus-5 @T-078
---

T-078 declares `touches: [docs/CONVENTIONS.md, method/]` and was
dispatched "documentation only, no code". **Those two are not
compatible for any method/ FORMAT change**, and the coupling is not
written in either file.

`docs/CONVENTIONS.md`'s first gotcha says "Changes to method/ formats
are version-bumped (currently v0.1.5) and noted here". That string is a
live pin: `snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` reads the real
`docs/CONVENTIONS.md` off disk on every `cargo test` and asserts it
contains `currently v{METHOD_SNAPSHOT_VERSION}`, alongside the same
check against `method/interview/plan-interview.md`'s Output heading.
`METHOD_SNAPSHOT_VERSION` is a Rust `const` (`kit.rs`), and
`acl_pin.rs` asserts the IPC status payload's `methodVersion` equals it.
So a method bump is a THREE-file commit — `method/…`, the CONVENTIONS
stamp, and a Rust constant — and the third file is outside any
docs-only fence.

This is the right design: the kit ships compiled-in copies of the method
files, so a version that lies about what shipped would be worse than no
version. The finding is that **nothing says so where the person about to
edit `method/` is looking.** The gotcha reads as a bookkeeping
convention ("version-bumped and noted here"), not as "and this is
enforced from Rust, so your docs-only card cannot do it".

T-078 handled it by writing every criterion into `docs/CONVENTIONS.md`
and touching no `method/` file at all — which is what its criteria
literally ask for anyway, each naming this file or a bullet in it. But
the card was dispatchable with a fence it could not fully use, and the
next card that plans a `method/` edit under a docs-only fence will find
out by reddening the Rust suite.

Two arms, either or both:

1. **One clause in the gotcha**: name `METHOD_SNAPSHOT_VERSION` in
   `app/src-tauri/src/agent/kit.rs` and say a method format bump is a
   three-file commit including Rust. Costs a sentence, and it is a
   symbol citation rather than a line, per this card's own new rule.
2. **A triage note**: a card whose ask includes `method/` formats needs
   `app-agent`-adjacent fence room, or it needs the bump split out. That
   is an architect call, not an executor's.
