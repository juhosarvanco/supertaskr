---
id: T-208
title: "`path.canonicalize()` is `read_contained`'s FOURTH refusal, it is UNPINNED, and unlike the shadowed halves it is PINNABLE — lift it and a `..` traversal returns the contents of a file outside the root"
feature: F-06
milestone: 4
priority: 5
size: S
status: building
blocked_by: []
touches: [crate-index]
suggested_by: verifier claude-opus-5@subagent @T-194, re-measured by T-194's executor before filing; id allocated by the integrator
builder: claude-opus-5@subagent
review: independent
---

**FOUND BY `T-194`'S BLIND VERIFIER, RE-MEASURED BY `T-194`'S EXECUTOR AT
`87929c2` BEFORE FILING, AND MEASURED RATHER THAN INFERRED BOTH TIMES.**
`T-194` named `read_contained`'s refusals A, B and D at their site under a
heading that read as the complete set. **It omitted `canonicalize()`,
which is load-bearing and which nothing pins.** That omission is now
corrected at the site (`T-194`, comment-only); **the missing body is this
card**, routed rather than built, on the precedent `T-186` set when it
routed `.follow_links(true)` as `T-196` instead of widening its own fence.

## The refusal, and what it independently contributes

`app/src-tauri/crates/nputer-index/src/resolve/mod.rs::read_contained`:

    let meta = std::fs::symlink_metadata(&path).ok()?;
    if meta.file_type().is_symlink() || !meta.is_file() {   // A, B
        return None;
    }
    let canon = path.canonicalize().ok()?;                  // C — this one
    if !canon.starts_with(root) {                           // D
        return None;
    }
    std::fs::read_to_string(&canon).ok()

**What C contributes is not its `.ok()?` arm but the RESOLUTION it performs
before D reads the result.** `Path::starts_with` compares COMPONENTS, so
`<root>/inside/../../elsewhere/loot.json` textually starts with `<root>`
and satisfies D on its own. Only `canonicalize` collapses the `..`.
**Without C, D is a string-prefix test wearing a containment test's name**,
and any `..` a caller puts in `dir` walks straight out of the root.

## Measured twice, at two benches, with the same numbers

Crate scope, `cargo test -p nputer-index --no-fail-fast`, **12 targets**
every arm. Verifier's bench at `26cba92`; executor's re-measurement at
`87929c2` in a role-qualified scratch with its own `CARGO_TARGET_DIR`.

| arm | result |
|---|---|
| baseline | exit 0, **256 passed / 0 failed** |
| `canonicalize().ok()?` → `path.to_path_buf()`, no probe | exit 0, **256/0 — NOTHING RED** |
| the probe below, on SHIPPED code | exit 0, **257/0** — it passes |
| the probe below + that lift | exit 101, **256/1 — the probe ALONE** |

The failing assertion is the whole finding:

    assertion `left == right` failed: a .. traversal must not escape the root
      left: Some("{\"loot\":1}")
     right: None

**`read_contained` returned the contents of a file outside the root.**

## Why this is a DIFFERENT finding from `T-194`'s "cannot red"

`T-194` established that `read_contained`'s `!meta.is_file()` half is
shadowed downstream and **no body can pin it** — that is a cannot-red
finding and it was landed as such. **C is the opposite case and must not
be read as the same one**: it is unpinned *today* and a body that pins it
exists and has been run. That is a coverage hole with a fixture, exactly
the distinction `T-186`'s verifier drew for `.follow_links(true)`.

## The probe, run in `T-194`'s drill and deliberately not landed there

Aim it at a SECOND `TempTree` so the lifted arm terminates in a FIXTURE
(`docs/CONVENTIONS.md`, LIFTING A SAFETY GUARD TO DISCRIMINATE) — the
sibling temp tree is reachable as `../<its basename>` because `TempTree`
places every tree under one parent:

    let t = TempTree::new("...");
    let outside = TempTree::new("...-outside");
    let root = t.root().canonicalize().expect("canon");
    outside.write("loot.json", "{\"loot\":1}");
    let outside_root = outside.root().canonicalize().expect("canon");
    // POSITIVE CONTROL: the loot IS readable when the root contains it,
    // so the None below cannot be there-was-nothing-there.
    assert_eq!(
        read_contained(&outside_root, "", "loot.json").as_deref(),
        Some("{\"loot\":1}"),
    );
    let rel = format!("../{}", outside_root.file_name().unwrap().to_str().unwrap());
    assert_eq!(read_contained(&root, &rel, "loot.json"), None);

The verifier's own spelling of the same fixture uses an in-root climb,
`read_contained(&root, "inside/../../probe-outside", "loot.json")`; either
form reds on the lift. **The sibling-`TempTree` form is preferred because
it cleans itself up and never writes into the shared temp dir directly.**

## Acceptance criteria

- A body SHALL pin `canonicalize()` ALONE: it SHALL pass on shipped code
  and red when that call is replaced by a non-resolving equivalent, with
  the failing count read as **ONE** at crate scope under `--no-fail-fast`.
- THE BODY SHALL carry a POSITIVE CONTROL proving the fixture would
  otherwise have been read, so a `None` cannot be satisfied by
  there-was-nothing-there.
- THE LIFTED ARM SHALL be proven to terminate in a FIXTURE rather than in
  repository content, and the proof SHALL be shown rather than asserted.
- The site comment's refusal COUNT SHALL still match the code after this
  card lands — `T-194` put the count in the heading precisely so an
  omission is visible, and a card that adds a body must not leave it stale.
- NO predicate SHALL be deleted or weakened: this card ADDS evidence.
- Verification: headless, `cargo test`.

## Read beside

`T-194` (the site, the four-refusal accounting, and the drill this probe
was first run in), `T-196` (the same unpinned-but-pinnable shape, routed
the same way), and `T-186` (the precedent that a lane routes rather than
widens its own fence).
