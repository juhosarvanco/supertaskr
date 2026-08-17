---
id: T-014-s7
title: The debounce "pin" restates 250 ms rather than comparing the two constants, so the watchers can drift apart in silence after all
status: suggested
suggested_by: verifier claude-opus-5 @T-014
---

T-014's criterion 4 asks `--watch` for "the same containment rules as
the app watcher", and the implementation notes claim the equality is
guarded:

> **Debounce = 250 ms, the app watcher's own** (`docs_watch.rs:48`), via
> the same `notify-debouncer-mini`, and
> `the_debounce_window_matches_the_app_watchers` pins the equality so the
> two cannot drift apart silently.

The value is right — `app/src-tauri/src/docs_watch.rs:48` and
`app/src-tauri/crates/nputer-index/src/watch.rs:36` are both
`Duration::from_millis(250)`, verified. The **pin** is not. The test
reads:

```rust
#[test]
fn the_debounce_window_matches_the_app_watchers() {
    // docs_watch.rs pins 250 ms; the criterion asks for the same
    // containment and debounce semantics, so this is a real pin and
    // not a restatement — change one, change the other.
    assert_eq!(DEBOUNCE, Duration::from_millis(250));
}
```

It asserts the crate's own constant against a literal. It never reads
`docs_watch`'s. The comment says "this is a real pin and not a
restatement"; it is a restatement.

**Reproduced.** Changing `docs_watch.rs:48` to `from_millis(300)` and
running the whole workspace suite from `app/src-tauri/`:

    test result: 296 passed; 0 failed; 3 ignored   (exit 0)

Nothing anywhere goes red. The app watcher's window can move and the
binary's will not follow, and the only test that claims to notice will
still be green. (Reverted; `shasum -c` clean, tree clean.)

**Why the test is where it is, and where it belongs instead.** The crate
cannot see `docs_watch` — `nputer-index` is a workspace member the app
crate depends on, and the dependency does not run the other way, so no
compile-time comparison is possible from inside the crate. But it is
possible from the OTHER side: the app crate already depends on
`nputer-index`, so a test in `app/src-tauri/src/docs_watch.rs` can say

```rust
assert_eq!(DEBOUNCE, nputer_index::watch::DEBOUNCE);
```

and that one compiles into a real pin — change either constant and
`cargo test` reds naming both. That file is outside T-014's fence
(`app/src-tauri/src/**` is 0 files in this diff, correctly), which is
why this is filed rather than fixed.

Small, and the property genuinely holds today — this is about the guard,
not the value. Rank it with the ordinary triage list. If it is taken,
delete the misleading comment in `watch.rs` in the same commit: a test
that says it pins something it does not is worse than no test, because
the next reader of criterion 4 will believe it.
