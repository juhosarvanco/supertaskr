---
id: T-101-s1
title: The exitNonZero path double-reports every result-only refusal — the runner emits it live AND names it in the tail
status: suggested
suggested_by: verifier claude-opus-5 @T-101-verify
---

**THIS FILE PREVIOUSLY STATED THE MECHANISM BACKWARDS AND IS REWRITTEN,
not amended.** It was filed by T-101's first executor claiming the two
surfaces are DISJOINT — that T-081's narrowing means *"an announced
denial appears in the live notice ONLY, and a result-only denial in the
tail ONLY"* — and that a double report would need that narrowing to be
REVERTED. The opposite is true, and it was true when the sentence was
written. The correction, the reproduction and the fix below are T-101's
verifier's (`claude-opus-5 @T-101-verify`); T-101's second executor
transcribed them here and re-derived the runner reading at `0e6889b`.

## The mechanism

In `run_turn`'s `StreamLine::Result` arm in
`app/src-tauri/src/agent/runner.rs`, ONE partition drives TWO reports
over the SAME vector, about forty lines apart:

    let unannounced: Vec<&ResultDenial> = denials.iter().filter(…).collect();
    for denial in &unannounced { emitter.denied(req.turn, …) }
    …
    let unreported = denial_names(unannounced.iter().copied());
    if !unreported.is_empty() { ring.push("permission_denials: …") }

Every entry of `unannounced` becomes a live `RunEvent::Denied` **and**
puts its `tool_name` into the stderr ring. **The narrowing selects the
DOUBLE-REPORTED set, not the safe one.** T-081's own comment on the
`denial_names(unannounced…)` line reads *"a name already delivered as its
own event does not need repeating in the tail"* — exactly right about the
intent and exactly wrong about the set, because the set it is applied to
is the one the loop three statements up has JUST delivered as its own
event. The narrowing removes the tail note for the ANNOUNCED denials,
which are the ones the tail does not need; it keeps it for the
UNANNOUNCED ones, which have just been announced.

The ring reaches the screen as `TurnError::ExitNonZero`'s `stderr_tail`,
which `failureDetail` renders verbatim inside `FailureBlock`.

## Why it is live NOW rather than latent

Before T-101 nothing rendered `GenesisTurn.denials`, so the tail was the
only surface and the redundancy cost nothing. **T-101 builds the second
surface**, and the two are now both on screen. Reproduced by T-101's
verifier against the real store and the real `genesis-turn` channel
(probe P7):

    emit: denied{toolName:"Bash", toolUseId:"toolu_resultonly", message:""}
          failed{exitNonZero, code:1, stderrTail:"permission_denials: Bash"}

    live notice:    [refused: Bash — the CLI gave no reason]
    failure block:  [the planner exited with code 1  permission_denials: Bash …]
    "Bash" occurrences on the turn: 2

One refusal, two events on screen — which is what T-081's criterion 4
(*the same denial shall not be reported twice*) forbids, and what
T-101's criterion 7 makes a rendering obligation.

## The fix is runner-side, and it is a deletion

Drop the ring note for the `unannounced` set. The justification T-069
gave that note — *"a declined DIAGNOSIS was also relaying nothing"* — was
a statement about a tree in which nothing rendered `denials`. That tree
no longer exists. The live `Denied` events carry strictly more than the
note does (each denial's own `tool_use_id`, and the entries the note
drops because `denial_names` has no name to take), they are emitted from
the same vector in the same iteration, and they reach the same screen.
The note is redundant BY CONSTRUCTION for exactly the set it covers.

Fence: **`app-agent`** (`app/src-tauri/src/agent/**`). Four lines plus
the comment explaining them, and the same commit should PIN the property
— a `result`-only denial on a turn that exits non-zero must produce a
live `Denied` and NOT a `permission_denials:` note. `T-081-s10` records
the neighbouring narrowing as an unpinned survivor; this pin closes that
too.

## Why `[app-interview]` cannot fix it, stated so it is not tried again

T-101's rebuild made the `toolDenied` suppression per-denial and keyed it
on `error.denials` — a TYPED field naming exactly what `FailureBlock`
restated. **No such key exists on the `exitNonZero` path**, and the three
substitutes are each worse than the defect:

1. **Matching the tail's text** would put a copy of a `runner.rs`
   `format!` string in `interview-model.ts` — T-057's rule exactly (a
   rule with two implementations is two chances to disagree), and the
   thing `FailureBlock`'s own header forbids in as many words
   (*"NOTHING HERE PARSES THE ERROR TEXT"*).
2. **It could not be made correct even if it were allowed.** The tail is
   a bounded RING (`MAX_STDERR_RING`), so a chatty CLI can evict the
   note's first half and a renderer keying on the prefix un-suppresses at
   random; and the whole tail is `sanitize_for_log`ged before it is
   rendered.
3. **Guessing from the denial's own shape** — a result-only denial is
   emitted with an empty `message` — is a second implementation of the
   runner's partition wearing a proxy's costume, and it is wrong the
   moment an in-band `permission_denied` line arrives without a message.

So the render side declines, and `visibleDenials`' own doc comment in
`app/src/genesis/interview-model.ts` NAMES this gap rather than leaving
it to be rediscovered.

## Severity

Reachable on any turn whose `result` line lists a denial the in-band
channel did not announce — the older CLI path, an entry with no
`tool_use_id`, or a denial past the runner's live cap — and which then
exits non-zero. The cost is one tool name shown twice on an already
failing turn: no data is lost and nothing is misreported, which is why
this is a suggestion against the runner and not a blocker on it. It IS a
blocker on the claim that the same refusal is stated once, and T-101's
card now says so instead of claiming the two surfaces are disjoint.
