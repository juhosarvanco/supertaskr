---
id: T-114
title: The genesis commit is three statements and the interleaving pin covers two — a dropped ack must leave the CANDIDATE untouched too, which is what the pin's own doc comment already claims
feature: F-03
milestone: 4
priority: 53
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-064-s6 — file removed in this
commit.

T-064's criterion 2 asks that the arm/commit order "cannot regress
silently", and the pin it produced —
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`
in `app/src-tauri/src/docs_watch.rs` — is a good pin: it kills every
reorder of the two statements that carry the emit ordering. **It covers
two of the three statements it calls "the commit", and its own doc
comment claims the third.**

## Measured, and re-read at `6b0cf47`

`apply_genesis_folder`'s commit is THREE statements under one comment
that calls them *"The commit — the only mutation, and the only lock
window"*:

    *state.project.lock()... = Some(canon.clone());
    let seq = state.next_seq();
    state.clear_rejected();

**MEASURED BY T-064's VERIFIER AT `09ce637`**, one hoist at a time, each
above the `WatchCtl::ArmGenesis` send, each read back with `git diff`
before the suite ran, each restored by sha256 against `git show`:

| hoisted | bare `cargo test --no-fail-fast` | red bodies |
|---|---|---|
| all three | exit 101 | 1 — the pin (arm A) |
| `next_seq` alone | exit 101 | 1 — the pin (arm A) |
| the project mutex write alone | exit 101 | 1 — the pin (arm B) |
| the whole block, between the send and the ack | exit 101 | 1 — the pin (arm A) |
| **`clear_rejected()` alone** | **exit 0** | **NONE** |

The pin's arm-B doc comment says a watcher that dies mid-arm *"leaves
the project, the candidate and the latch untouched"* — **three facts.**
The body asserts two: `refused.project_dir().is_none()` and
`refused.begin_pick().is_some()`. It does not assert the candidate, and
the candidate is exactly what `clear_rejected()` clears. All three
statements, the comment's three-fact sentence and the body's two
assertions were re-read in the tree at `6b0cf47` and are unchanged from
what T-064's verifier measured.

## Why it is worth a card rather than a shrug

`last_rejected` is the zero-argument genesis target (ADR-012): the
folder the user chose in the native dialog, kept Rust-side precisely so
the webview cannot name a different one. `genesis_target()` falls back
to `project_dir()` when it is `None`. So in the mutant's world a
transient arm failure — a re-arm timeout or a dropped ack, both of which
return `PickOutcome::Error` and are supposed to mutate nothing —
silently retargets *"Start an interview here"* from the folder the user
picked to whatever project is already open. The next click runs an
interview, and `mkdir docs`, against the wrong folder. **The shipped
code does not do this. Nothing in the tree would tell us if it
started.**

## The body needs a candidate to exist first, which arm B's fixture does not give it

Arm B builds its state with `WatchState::new(None, …)` directly, so
`last_rejected` is `None` and asserting it stays `None` would be
satisfied by a mutant that clears an already-empty slot — a positive
control the body does not have (CONVENTIONS: A NEGATIVE ASSERTION NEEDS
A POSITIVE CONTROL). The candidate has to be MADE, through the real
refused-pick path: a bare tree with no `docs/` is refused by
`apply_picked_folder`, **and being refused for having no `docs/` is what
makes it the zero-argument candidate**. `bare_tree`, `apply_picked_folder`,
`begin_pick`, `apply_genesis_pick` and `genesis_target` all exist in that
file at `6b0cf47` and are the shape the closing body uses.

## Acceptance criteria

- **THE THIRD FACT SHALL BE ASSERTED WHERE THE COMMENT ALREADY CLAIMS
  IT.** Arm B of
  `the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`
  SHALL assert that a failed arm leaves the CANDIDATE untouched, beside
  its existing project and latch assertions. It belongs in arm B rather
  than in a new test — arm B is already "no ack, no commit", and this is
  the third of the three facts that sentence names.
- **THE CANDIDATE SHALL BE BUILT BY THE PRODUCER, NOT WRITTEN TO LOOK
  LIKE ONE.** The body SHALL drive the real refused-pick path so that
  `genesis_target()` returns the chosen folder BEFORE the arm is
  attempted, and SHALL assert that precondition explicitly. A body that
  asserts `Some(canon)` survives without first proving `Some(canon)` was
  there cannot tell "untouched" from "never set".
- **THE `clear_rejected()`-ALONE HOIST SHALL BE RE-RUN AND SHOWN RED.**
  It was **exit 0, zero red bodies** at `09ce637`; after this card it
  SHALL red, and the verdict or notes SHALL name the left/right values
  the failure prints. Re-derive the whole hoist table at the lane's own
  ref rather than quoting the one above.
- **THE OTHER FOUR HOISTS SHALL STILL RED, AND SHALL STILL RED ON THE
  ARM THEY REDDED ON.** A new assertion that turns arm B into the body
  every mutant trips has lost the discrimination the table records; the
  arm each mutant kills is the property, not the count.
- IF the added assertion cannot be made to red by any one-sided producer
  mutation THEN it SHALL be named as a body that cannot fail rather than
  quietly kept (POISON DRILL), and the reason SHALL be written beside
  it.
- **THE DOC COMMENT AND THE BODY SHALL STOP DISAGREEING.** Whichever way
  the card lands, arm B's sentence and arm B's assertions SHALL name the
  same set of facts — three and three, or two and two. A comment that
  claims a fact the body does not assert is the class this repository
  has watched go stale three times in a week.
- **NOTHING OUTSIDE `docs_watch.rs` SHALL MOVE.** The commit's statement
  ORDER is not being changed; only what a failed arm is asserted to have
  left alone. IF the executor concludes the ordering itself should
  change THEN that is a behaviour change and its own card, not a clause
  here.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, total summed from the
`test result:` lines). **POISON DRILL on the new assertion, one side
only**, producer mutated and never the assertion — the
`clear_rejected()` hoist is the mutant this card exists to kill, and all
four surviving hoists SHALL be re-run beside it; each mutated text read
back with `git diff` before the run, restores per-path proved by sha256
against the drill's own commit, drilled in a detached scratch worktree
with its own `CARGO_TARGET_DIR` inside it (POISON DRILL arm (c)). Then
the shape-six check: does any other body already drive this exact call.
The BOOT GATE trigger fires on `app/src-tauri/**` — run the boot check
on a scratch port and record the exit and both `[nputer]` lines. The
DOCS GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none.
