---
id: T-113
title: One refusal, one report — the exitNonZero tail stops repeating the denials the same loop has just announced
feature: F-03
milestone: 4
priority: 57
size: S
status: planned
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** This
> card and `T-102` (planned, `[app-agent]`, priority 58) cannot both be
> right; the collision is stated in the body under THE COLLISION and is
> the reason this card is sequenced first. **T-102's criterion 6 needs
> amending and this drafter did not amend it.** Everything below was
> re-derived at `6b0cf47` (the seventh triage commit; its whole diff is
> `docs/tasks/`, so every source reading also holds at `d41456b`).

Absorbs (seventh triage, 2026-08-24): T-101-s1 — file removed in this
commit.

`T-081`'s criterion 4 reads **"THE SAME DENIAL SHALL NOT BE REPORTED
TWICE."** `T-101`'s criterion 7 makes it a rendering obligation as much
as a runner one. **The runner breaks it, and the narrowing that was
supposed to prevent it selects exactly the set that gets doubled.**

## The mechanism, read at `6b0cf47`

In `run_turn`'s `StreamLine::Result` arm in
`app/src-tauri/src/agent/runner.rs`, ONE partition drives TWO reports
over the SAME vector, about sixty lines apart:

    let unannounced: Vec<&ResultDenial> = denials.iter().filter(…).collect();
    for denial in &unannounced { emitter.denied(req.turn, …) }
    …
    let unreported = denial_names(unannounced.iter().copied());
    if !unreported.is_empty() { ring.push("permission_denials: …") }

Every entry of `unannounced` becomes a live `RunEvent::Denied` **and**
puts its `tool_name` into the stderr ring, which reaches the screen as
`TurnError::ExitNonZero`'s `stderr_tail` and is rendered verbatim by
`failureDetail` inside `FailureBlock`. T-081's own comment on the
`denial_names(unannounced…)` line reads *"a name already delivered as
its own event does not need repeating in the tail"* — right about the
intent, wrong about the set. The narrowing removes the tail note for the
ANNOUNCED denials, which are the ones that do not need it, and keeps it
for the UNANNOUNCED ones, which the loop three statements up has just
announced.

**It is live rather than latent because T-101 built the second surface.**
Before T-101 nothing rendered `GenesisTurn.denials` and the tail was the
only screen, so the redundancy cost nothing. Reproduced by T-101's
verifier against the real store and the real `genesis-turn` channel: one
`result`-only denial produces a live notice *[refused: Bash — the CLI
gave no reason]* and a failure block reading *permission_denials: Bash*,
**two occurrences of the tool name on one turn**.

## The fix is a deletion, and the render side has already declined

Drop the ring note for the `unannounced` set. The live `Denied` events
carry strictly more than the note does — each denial's own
`tool_use_id`, and the entries `denial_names` drops for having no name —
they are emitted from the same vector in the same iteration, and they
reach the same screen. The note is redundant BY CONSTRUCTION for exactly
the set it covers.

`[app-interview]` cannot fix it and `visibleDenials`' doc comment in
`app/src/genesis/interview-model.ts` already says so in the tree, naming
`T-101-s1` and routing the fix here: there is no typed key on the
`exitNonZero` path, matching the tail's text would put a copy of a
`runner.rs` `format!` string in the renderer (T-057), the tail is a
bounded RING so a prefix match un-suppresses at random, and guessing
from the empty `message` is the runner's partition re-implemented as a
proxy.

## THE COLLISION — T-102 pins what this card deletes

`T-102` (planned, `[app-agent]`, priority 58) carries this criterion
**verbatim**:

> - **THE NARROWING SHALL BE PINNED**: the tail names the UNANNOUNCED set
>   only, and the `denial_names(&denials)` revert SHALL be re-run and
>   shown RED. Assert the cumulative `ToolDenied` record separately — the
>   two are different questions and a body that conflates them pins
>   neither.

**That criterion pins the exact runner-side narrowing this card
deletes.** After this card lands there is no `denial_names(unannounced…)`
call to revert and no tail note to narrow, so T-102's criterion 6 is
unbuildable as written — its mutant has no producer. The two cannot both
be right.

**T-113 IS SEQUENCED FIRST.** Both cards hold `[app-agent]`, so they can
never run concurrently; the parallelism guardrail does the enforcing.
Whoever builds T-102 must find criterion 6 **already amended** — to pin
what survives, which is that a denial delivered as its own event is NOT
also in the tail — **or stop and open a room.** A T-102 executor who
reverts `denial_names(unannounced…)` to `denial_names(&denials)` to make
its mutant red is re-introducing the double report under a green suite.
The amendment is the architect's; this card does not edit T-102, and a
lane fenced `[app-agent]` that edited `docs/tasks/T-102-*.md` would be
widening its own fence from inside (executor.md).

What T-102 keeps is unaffected: its cumulative-`ToolDenied` half is a
different question and is asserted separately here too, and its
`Activity`-arm, join-order, mirrored-negatives and byte-bound criteria
touch none of this.

## Acceptance criteria

- **THE RUNNER SHALL REPORT AN UNANNOUNCED DENIAL EXACTLY ONCE**: the
  `permission_denials:` ring note for the `unannounced` set SHALL be
  deleted, and the comment that replaces it SHALL say why the live
  `Denied` events are strictly more than the note was.
- **THE CUMULATIVE RECORD SHALL BE UNTOUCHED AND SHALL BE ASSERTED
  SEPARATELY.** `denial_names(&denials)` feeding `permission_denials`
  for `TurnError::ToolDenied` is a different question from what the tail
  says; a body that conflates the two pins neither. The `ToolDenied`
  variant carries no `stderr_tail` field, which is why its record is not
  what this card is about.
- **A PIN SHALL DRIVE THE FULL SHAPE, NOT THE HALF THAT IS EASY**: a
  `result`-only denial (an entry with no `tool_use_id`, or one the
  in-band channel never announced) on a turn that exits NON-ZERO SHALL
  produce a live `Denied` event AND a `stderr_tail` that does not name
  it. Both halves in one body, because "the tail is empty" and "the
  event fired" are each satisfiable without the other.
- **AND THE PIN NEEDS ITS POSITIVE CONTROL** (CONVENTIONS: A NEGATIVE
  ASSERTION NEEDS A POSITIVE CONTROL). Asserting the tail does NOT name
  the tool is satisfied equally by a tail that names nothing at all, so
  the same body — or its sibling — SHALL show the tail carrying
  something else the runner does put there on that turn. A bare
  "expected absent, got absent" is not this property.
- IF a denial arrives on the in-band channel AND is repeated in the
  cumulative `result` array THEN it SHALL reach the screen once,
  unchanged from today: the partition still exists and still joins on
  `tool_use_id`, and this card narrows what the UNANNOUNCED branch does
  rather than removing the branch.
- IF the deleted note turns out to be the only surface for some denial
  shape THEN that shape SHALL be named in the code and filed, never
  covered by restoring the note — the entries `denial_names` drops for
  having no name are the case to check, and the live emit does not drop
  them.
- **THE FIX SHALL NOT REACH THE RENDER SIDE.** `app/src/genesis/**` is
  `app-interview` and outside this fence; `visibleDenials`' doc comment
  stays as the record of why. IF the comment's routing sentence goes
  stale because this card lands THEN say so and route the one-line
  correction rather than editing across the fence.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from
the `test result:` lines rather than eyeballed). **POISON DRILL on every
new or changed assertion, one side only**, producer mutated and never
the assertion: re-add the ring note for the `unannounced` set and
require the new body RED; delete the live emit loop and require it RED
from the other direction. Each mutated text read back with `git diff`
before its run; restores per-path, proved by sha256 against the drill's
own commit; drill in a detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it (POISON DRILL arm (c)). Then the shape-six
check on each new body — does any other test already drive this exact
call. The BOOT GATE trigger fires on `app/src-tauri/**`: run the boot
check on a scratch port and record the exit and both `[nputer]` lines.
The DOCS GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none.
