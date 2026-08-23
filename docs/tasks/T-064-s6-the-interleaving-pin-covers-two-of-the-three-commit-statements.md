---
id: T-064-s6
title: The interleaving pin covers two of the three statements it calls "the commit" — hoisting clear_rejected above the arm is a silent green, and the body's own doc comment claims otherwise
status: suggested
suggested_by: verifier claude-opus-5 @T-064-verify
---

T-064 criterion 2 asks that the arm/commit order "cannot regress
silently". The pin is
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`
in `app/src-tauri/src/docs_watch.rs`, and it is a good pin: it kills
every reorder of the two statements that carry the emit ordering.

`apply_genesis_folder`'s commit is THREE statements under one comment
that calls them "The commit — the only mutation, and the only lock
window":

    *state.project.lock()... = Some(canon.clone());
    let seq = state.next_seq();
    state.clear_rejected();

**MEASURED AT `09ce637`, one hoist at a time, each above the
`WatchCtl::ArmGenesis` send, each read back with `git diff` before the
suite ran, each restored by sha256 against `git show`:**

| hoisted | bare `cargo test --no-fail-fast` | red bodies |
|---|---|---|
| all three | exit 101 | 1 — the pin (arm A) |
| `next_seq` alone | exit 101 | 1 — the pin (arm A) |
| the project mutex write alone | exit 101 | 1 — the pin (arm B) |
| the whole block, between the send and the ack | exit 101 | 1 — the pin (arm A) |
| **`clear_rejected()` alone** | **exit 0** | **NONE** |

The pin's own doc comment says arm B catches "a watcher that dies
mid-arm leaves the project, **the candidate** and the latch untouched".
The body asserts the project (`project_dir().is_none()`) and the latch
(`begin_pick().is_some()`). It does not assert the candidate, and the
candidate is what `clear_rejected()` clears.

**WHY IT IS WORTH A CARD RATHER THAN A SHRUG.** `last_rejected` is the
zero-argument genesis target (ADR-012): the folder the user chose in the
native dialog, kept Rust-side precisely so the webview cannot name a
different one. `genesis_target()` falls back to `project_dir()` when it
is None. So in the mutant's world a transient arm failure — a re-arm
timeout or a dropped ack, both of which return `Error` and are supposed
to mutate nothing — silently retargets "Start an interview here" from
the folder the user picked to whatever project is already open. The next
click runs an interview, and `mkdir docs`, against the wrong folder.
The shipped code does not do this. Nothing would tell us if it started.

**THE BODY THAT CLOSES IT** was written and measured during
verification: green on `09ce637`, red under the `clear_rejected` hoist
with `left: None`, `right: Some(<the folder the user chose>)`. It needs
the candidate to exist first, which the direct `WatchState::new`
fixture does not give it, so it drives the real refused-pick path:

    let bare = bare_tree("...");                       // no docs/
    let canon = bare.root().canonicalize().expect("canon");
    // a watcher that drops every ArmGenesis ack, as arm B already builds
    let state = WatchState::new(None, Arc::new(AtomicU64::new(0)), ctl_tx);
    // 1. the user's dialog choice is refused for having no docs/ —
    //    which is what MAKES it the zero-argument candidate
    apply_picked_folder(&state, bare.root(), state.begin_pick().unwrap());
    assert_eq!(state.genesis_target(), Some(canon.clone()));
    // 2. the arm fails
    apply_genesis_pick(&state, bare.root());           // -> PickOutcome::Error
    // 3. THE CLAIM THE DOC COMMENT ALREADY MAKES
    assert_eq!(state.genesis_target(), Some(canon),
        "no ack, no commit - the CANDIDATE is untouched too");

Sized S. It belongs in arm B of the existing pin rather than in a new
test — arm B is already "no ack, no commit", and this is the third of
the three facts that sentence names.
