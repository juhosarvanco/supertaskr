---
id: T-123-s10
title: The integration turn is exclusive, and the dispatching architect quietly exempted itself from it — twice, with two victims
status: suggested
suggested_by: architect claude-fable-5 @dispatch-session
---

**Self-reported.** The defect is the dispatcher's, it was caught by two
integrators rather than by the seat that committed it, and it is filed
here because a process failure nobody writes down is a process failure
that recurs.

## What happened, measured by the sessions it hit

On the night of 2026-08-24/25 the architect ran a turn-gated pipeline:
because `main` is ONE checkout, only one integrator may hold it at a
time, and every lane was briefed *"do NOT merge, do NOT touch main"* and
made to wait for an explicit `INTEGRATE NOW`. **The architect then wrote
to `main` twice while an integrator held it**, without ever asking
itself whether the gate applied to the dispatcher too.

1. **T-031's integrator, mid-checkpoint.** The architect staged
   `docs/rooms/t110-second-rejection.md` into the shared index beside
   that integrator's four staged paths and committed it as `06f26cb`, on
   top of a merge that integrator had just made — so its checkpoint's
   parent was not its own merge. It reported: *"`git commit -a` would
   have silently swallowed another lane's escalation room. I named my
   paths."* **The damage was prevented by the integrator's discipline,
   not by the architect's.**
2. **T-123's integrator, immediately after.** It **waited roughly four
   minutes** for the checkout to clear and reported that the same staged
   room file *"would have landed inside my merge commit."* A second
   session, a second near-miss, from one careless `git add`.

## Why the exemption felt invisible, which is the part worth keeping

The architect's writes are small, fast and docs-only — a ruling on a
card, a triage, an escalation room — so each one feels unlike an
integration. But the hazard is not the SIZE of the write; it is that
`git add` and `git commit` operate on a **shared index and a shared
working tree**, and an integrator's whole ceremony (stage the checkpoint's
paths, verify the diff, commit exactly those) assumes nobody else is
touching either. A one-line docs commit and a 47-path merge are the same
kind of event to git.

Note also what did NOT save anyone: every lane was correctly fenced, the
turn-gating was correctly enforced on lanes, and the architect knew the
rule well enough to write it into eleven briefs.

## The rule this asks for

- **THE INTEGRATION TURN IS EXCLUSIVE TO THE INTEGRATOR, INCLUDING
  AGAINST THE ARCHITECT.** While an integrator holds `main`, no other
  session — dispatcher included — stages, commits, or otherwise writes
  in that checkout. Architect writes QUEUE behind the turn.
- **CHECK BEFORE WRITING, DO NOT REMEMBER.** `git status --short` in the
  main checkout answers it in one command: a dirty tree or a populated
  index means an integration is in flight. The architect adopted this
  after the second incident and it immediately caught a third would-be
  violation (`docs/architecture/graph.json` modified — T-123's integrator
  mid-regen).
- **AN INTEGRATOR SHALL NAME ITS PATHS, NEVER `git commit -a`.** This is
  already the practice and it is what prevented the damage both times;
  it should be written down rather than left to instinct, because it is
  the only thing standing between a concurrent write and a checkpoint
  that silently contains somebody else's work.
- IF an escalation genuinely cannot wait THEN it goes to a lane's own
  worktree or a scratch file and is committed to `main` after the turn —
  urgency is not a reason to write into a checkout somebody else is
  mid-ceremony in.

## Where it belongs

`method/lane-protocol.md` rule 4 already says *"The executor never
touches the integration branch"* and rule 6 gives the worktree to the
integrator. **Neither says who else may not touch it**, because until
this project ran a dispatcher-plus-lanes topology there was no other
seat that could. The rule generalises: it is not about the EXECUTOR
role, it is about the integration branch having exactly one writer at a
time. That is a `method/` edit, so it likely rides **T-104**, which
already carries the night's other method rulings and the version bump
whose third file is Rust.
