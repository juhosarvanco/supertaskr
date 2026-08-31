---
id: T-186
title: The index walk carries the identical four shadowed checks one crate over, calls them "belt-and-suspenders" in the same false words, and its one symlink body points OUTSIDE so containment alone produces the green
feature: F-06
milestone: 4
priority: 5
size: S
status: planned
blocked_by: []
touches: [crate-index]
suggested_by: "architect/integrator seat, ROUTED BY T-140-s9's merge (2026-08-31) and re-measured at this seat before filing rather than transcribed from the route"
builder:
review:
---

**ROUTED OUT OF `T-140-s9`, AND RE-MEASURED BEFORE FILING.** That lane
corrected `app/src-tauri/src/docs_watch.rs` and routed its sibling
sight-unseen. This seat opened `walk.rs` and confirmed every element
rather than carrying the claim across; what follows is read off the file,
not off the route.

## The same four checks, in the same order, with the same shadowing

`walk_root` in `app/src-tauri/crates/nputer-index/src/walk.rs`:

    let Ok(meta) = std::fs::symlink_metadata(path) else { continue };
    if meta.file_type().is_symlink() || !meta.is_file() { continue; }
    …
    let Ok(canon) = path.canonicalize() else { continue };
    if !canon.starts_with(canon_root) { continue; }

and `relative_posix`'s `strip_prefix(base).ok()?` twelve lines above.

**`!meta.is_file()` already absorbs a lifted `is_symlink`**, for the
reason `T-140-s9` established one crate over: `meta` comes from
`symlink_metadata`, under which a link is neither file nor dir. So the
`is_symlink` half of that disjunction is **inert** — exactly the
one-predicate-written-twice shape, arriving a second time.

`starts_with` and `relative_posix`'s `strip_prefix` are likewise **one
predicate mutually shadowing**, not two independent layers.

## AND THE COMMENT MAKES THE SAME FALSE CLAIM, IN THE SAME WORDS

    // Belt-and-suspenders beyond follow_links(false): our own
    // symlink_metadata check — a symlink (file or dir) is skipped
    // outright.

`T-140-s9` ruled that this exact claim — one line described as *"belt to
the symlink-skip's suspenders"* — **was itself the defect**, because it
tells the next reader that two independent layers exist where one
predicate is doing all the work. The claim is wrong here for the same
reason and should be corrected the same way: **name each layer at its
site for what it actually is.**

## The body that cannot see any of it, measured

`symlinks_are_never_followed_file_or_dir` (`walk.rs:213`) builds its
links pointing at a **second, outside** `TempTree`:

    let outside = TempTree::new("walk-symlink-outside");
    symlink(outside.root().join("secret.ts"), t.root().join("link.ts"))
    symlink(outside.root(), t.root().join("linkdir"))

Every entry it creates canonicalizes **out of the root**, so
`canon.starts_with(canon_root)` drops all of them on its own. **The
containment check alone produces this body's green**, and the
`is_symlink` half it is named for is never exercised.

This is the identical instrument defect `T-140-s9` met: a symlink body
whose link points outside is a containment test wearing a symlink test's
name.

## WHAT THIS CARD MUST NOT ASSUME, and it is the whole risk

`T-140-s9` spent two attempts proving its docs-root guard was
**undetectable by construction** — an outside link is rescued by
containment, an inside link is dropped by the collector's own path
prefix. **Do not assume the same verdict here.** This crate is different
in one way that may matter: `walk_root` filters on **extension and
language** after the symlink check, so an inside-pointing link to an
allowlisted file may reach a different set of predicates than
`docs_watch`'s did.

**Measure it; do not reason from the sibling.** If a body CAN be written
that reds on a lifted `is_symlink` and passes with it, write it. If it
cannot, `docs/CONVENTIONS.md` rules the case directly — *"IF a body
cannot be poisoned … THEN say so and name it, because a body that cannot
red is the finding"* — and the outcome is a named body carrying its
failed attempts at its site, exactly as `T-140-s9` landed.

## Acceptance criteria

- EACH of the four checks SHALL be named at its site for what it
  independently contributes, and any that contributes nothing unique
  SHALL say so rather than being described as a further layer.
- THE "belt-and-suspenders" comment SHALL be corrected or removed; it
  asserts an independence that does not exist.
- A body SHALL exercise the symlink refusal with a link that
  containment CANNOT rescue, or the card SHALL record — with the
  attempts shown — that no such body exists and why.
- EVERY body added or changed SHALL be poisoned by a one-side-only
  mutant read back with `git -C <dir> diff`, restored, and the
  restoration proven by hash.
- NO layer SHALL be deleted merely for being shadowed: `T-140-s9` ruled
  that deleting a shadowed line on an ADR-010 boundary buys zero
  discrimination and costs a visible containment statement. **The
  evidence is what changes, not the refusal.**
- Verification: headless, `cargo test`.

## Read beside

`T-140-s9` (the same finding, corrected, with both failed poison
attempts recorded at their site — read it FIRST, it will save this lane a
day), and `app/src-tauri/src/docs_watch.rs` as it stands after that merge.
