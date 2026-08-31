---
id: T-189-s4
title: The kit ships the self-integration CONDITION without the half that says how to answer it — a scaffolded project reads "while it holds the integration checkout" and has no rule telling it not to infer solitude
status: suggested
suggested_by: "verifier claude-opus-5 @V-189, 2026-08-31 — measured at 59a6d32 while approving T-189; the dangling citation predates that card, which strictly improved the shipped bytes"
---

`T-189` put the operative condition into both size-S cells of
`method/tasks/TASK-FORMAT.md`'s ceremony table, which is the right file:
derived at `59a6d32` with `git grep -h 'rel: "'
app/src-tauri/src/agent/kit.rs`, that file is one of the **14**
`KIT_FILES` entries, so the bytes are materialized verbatim into every
project this system creates.

**`method/lane-protocol.md` is not one of the 14.** `docs/CONVENTIONS.md`
says so in as many words, in its NOT SHIPPED clause: *"the `method/`
files the kit leaves behind, `lane-protocol.md` and `roles/integrator.md`
among them"*. Neither is `method/roles/executor.md`; among the role files
the kit ships only `roles/planner.md`.

## WHAT A SCAFFOLDED PROJECT ACTUALLY RECEIVES

The shipped cell now reads: *"it merges, checkpoints and removes its own
worktree WHILE IT HOLDS THE INTEGRATION CHECKOUT, and hands all three to
the holder when it does not (lane-protocol.md rules 4, 6)"*.

A new project gets that sentence and a pointer into a file it does not
have. Everything that makes the condition answerable lives on the far
side of the pointer:

- that the holder is **declared at dispatch and never inferred**;
- that **a lane that was not told does not take the seat** — the
  fail-safe default, which is the whole safety property;
- that **being the only live lane is not the condition**, and why
  solitude fails in the expensive direction.

So the reader most likely to need the rule gets the condition without its
decision procedure, and the obvious way to answer *"do I hold it?"* from
the cell alone is to look around and see whether anyone else is working —
**which is precisely the solitude proxy `T-189` measured and refused.**
The failure direction is the expensive one.

## WHY THIS IS FILED AS A SUGGESTION AND NOT AGAINST `T-189`

The dangling citation is older than this card: the cells read
*"(lane-protocol.md rules 4, 6)"* before `T-189` touched them. And
`T-189` strictly IMPROVED the shipped bytes — the previous cell told a
scaffolded project's S executor to merge, checkpoint and remove its
worktree with no condition at all. A reader of the new cell at least
knows a condition exists and that there is a holder to hand to. This card
is the next step, not a defect in that one.

`T-145` is the standing precedent for why it matters: a repair to the
adapter every new project inherits, which took no verifier under the
fallback and whose drill measured `cargo test` GREEN with the defect
restored.

## Acceptance criteria

- A PROJECT scaffolded from the kit SHALL be able to answer "may this S
  lane self-integrate?" from the files it received, without resolving a
  citation into a file the kit does not ship.
- THE remedy SHALL NOT be a fourth statement of the rule (`T-057`): the
  choice is between shipping the file that holds it and moving the
  decision procedure into a file already shipped, and the card SHALL
  argue which.
- WHERE a shipped file cites an unshipped one, THE citation SHALL be
  identified as such — this is one instance and a sweep SHALL derive the
  rest rather than assuming it is the only one.
- THE derivation SHALL be run at the card's own ref, not transcribed from
  the 14-entry count in this card.

## Fence

`app/src-tauri/src/agent/kit.rs` (if the shipped set changes),
`method/tasks/TASK-FORMAT.md`, `method/lane-protocol.md`. Touching either
`kit.rs` or `TASK-FORMAT.md` is *touching shipped code*: verifier owed,
and `cargo test` owed with no gate trigger naming it.

## Read beside

`docs/CONVENTIONS.md`'s SHIPPED PARTITION bullet, `T-147` (which drew the
partition), `T-145` (the incident it exists to prevent), and `T-189`'s
implementation notes.
