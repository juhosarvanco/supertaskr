---
id: T-060-s4
title: The derived guard fails OPEN in a rustdoc doctest — "a test file written next year inherits the refusal" is false for one kind of test
status: suggested
suggested_by: verifier claude-opus-5 @T-060
---

**Latent, not live** — the crate has zero doctests today, measured
(`Doc-tests nputer_lib … running 0 tests`). Filed because the card and
`docs/ARCHITECTURE.md` both make a claim the mechanism does not support,
and because a doctest is the one kind of test nobody would think to
check.

## The claim

`runner.rs`'s header on `real_cli_arms_forbidden`, and
`docs/ARCHITECTURE.md`:

> Nothing has to be set, exported, wrapped or configured, so a test file
> added next year inherits the refusal without knowing this function
> exists.

## The mechanism

    fn running_as_cargo_test_binary() -> bool {
        if cfg!(test) { return true; }
        std::env::current_exe().ok()
            .and_then(|exe| exe.parent().map(|dir| dir.file_name() == Some(OsStr::new("deps"))))
            .unwrap_or(false)
    }

Both arms miss a doctest. `cfg!(test)` is **false** in a doctest (the
doctest links the crate as a dependency, exactly like an integration
test), and rustdoc does **not** run doctest binaries out of `deps/`.

## Measured

A throwaway crate whose only doctest reports its own `current_exe`:

    current_exe = /var/folders/8h/…/T/rustdoctestTieiwm/rust_out
    parent      = Some("rustdoctestTieiwm")
    guard_fires(deps) = false
    cfg_test    = false

So a doctest on `resolve_cli` — the most natural thing in the world to
write for a public function whose whole job is resolution — would run
with the guard OFF, spawn the developer's login shell, read their real
`PATH` and execute their real `claude`. That is T-047-s6's accident,
reachable by writing documentation.

## The rest of the attack surface, which HELD

Everything else I tried, the derivation survived, and two of them
survived *loudly*, which is the good news in this finding:

- **Relative invocation.** `cd target/debug/deps && ./agent_runner-…`
  still resolves to an absolute `…/deps/agent_runner-…` through
  `_NSGetExecutablePath`, so the guard stays on. Measured: test passes.
- **The binary copied OUT of `deps/`.** The tripwire fires rather than
  failing silently:

      thread 'the_no_real_cli_guard_is_on_without_anything_being_set'
        panicked at tests/agent_runner.rs:1835:5:
      an integration test binary must not be able to reach the real CLI

- **And T-060-s1's pre-flight is load-bearing under exactly that
  condition.** Same copied binary, running the guard's own test:

      thread 'the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found'
        panicked at tests/agent_runner.rs:1909:5:
      the guard is already off before this test does anything - refusing to resolve

  `:1909` is the pre-flight. The first `resolve_cli` in that body is at
  `:1926`. The fix works, measured against a genuinely guard-off binary.
- **`current_exe()` failing.** Not reachable on macOS
  (`_NSGetExecutablePath` does not fail for a live process). The
  `unwrap_or(false)` fail-open is defensible for the packaged app it was
  written for, and the doctest hole above is not caused by it — the call
  SUCCEEDS and returns the wrong parent.
- **`CARGO_TARGET_DIR` pointed elsewhere / a renamed target dir.** `deps`
  is still `deps`; the executor's reasoning for checking the leaf and not
  an ancestor named `target` is right.
- **`cargo nextest`.** NOT MEASURED — it is not installed on this
  machine (`cargo-nextest not found`). Its normal local mode runs the
  same binaries in place from `<target>/<profile>/deps/`, so the
  derivation should hold, but `nextest archive` extracts elsewhere and
  nobody has looked.

## The ask

Two lines. Widen the derivation to cover the rustdoc temp dir:

    let name = exe.parent().and_then(|d| d.file_name()).and_then(|n| n.to_str());
    matches!(name, Some("deps")) || name.is_some_and(|n| n.starts_with("rustdoctest"))

…and correct the sentence in `runner.rs` and `docs/ARCHITECTURE.md` to
say which kinds of test inherit the refusal, since after this fix it is
"every test cargo builds" and before it was not.
