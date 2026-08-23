---
id: T-089-s10
title: closed_by is an undocumented frontmatter key that now has two shapes and no rule for which applies — and it leaves discharged findings rendering as open ghosts
status: suggested
suggested_by: verifier claude-opus-5 @T-089-verify
---

`T-089`'s second pass discharged two verifier findings by adding
`closed_by:` to their frontmatter and leaving `status: suggested`. The
VALUE shape is right and this card does not dispute it: a commit hash
written into a file the same commit contains is stale by construction
(T-077's `702dcee` lesson), so naming the resolving TASK plus branch and
date is the correct answer when the fix lands in the same tree.

What is missing is the rule around it.

## One — the key is not in the format

`method/tasks/TASK-FORMAT.md`'s frontmatter block lists fifteen keys.
`closed_by` is not among them. The parser is unaffected — `task.ts`
preserves unknown keys deliberately ("unknown keys: preserved, never
silently deleted") and the suite is 263/263 — so the tree and the format
doc disagree silently, which is the one way a format defect survives.

## Two — the tree already holds a SECOND shape

    docs/tasks/rejected/T-081-s7:  closed_by: 3b4326d (main, 2026-08-19 23:22) — independently, before this file was written
    docs/tasks/T-089-s7:           closed_by: T-089 re-execution (task/T-089-brief-contract, 2026-08-23) — arm 1 taken; …

Both are defensible: a HASH when the closing work is on another branch
and already merged, a TASK when it lands in the same commit. **Nothing
says so.** That is the hazard the same commit's own rule 4 companion
describes — two copies of a convention with no precedence — reached from
the convention side instead of the fact side.

## Three — the board renders discharged work as open

`status:` stays `suggested`, and the dashboard renders suggestions as
ghosts at the bottom of their feature column (TASK-FORMAT, task creation).
So two findings that are closed will render as open until an architect
triages them. TASK-FORMAT already rules this event a different way —
"the planned task ABSORBS the suggestion — it lists the absorbed ids in
its body … and the suggestion file is removed in the same commit" — so
there are now two conventions for one thing, and the older one is the
documented one.

Note the absorption rule may not FIT here: these were filed by the
verifier during the card's own verification, and removing them mid-verdict
would destroy the record the verdict cites. That is an argument for
documenting `closed_by:` as the case absorption does not cover, not for
leaving it undocumented.

## What to do — one bullet in TASK-FORMAT

Add `closed_by` to the frontmatter block and one lifecycle bullet saying:

1. **Which shape when** — a commit hash if the closing commit is outside
   the tree that carries this file; the resolving task id (plus branch
   and date) if it is inside, because a self-referential hash is stale by
   construction.
2. **What `status:` becomes** — and if it stays `suggested`, say that the
   board is expected to ghost it until triage, so the next reader does
   not treat the ghost as a bug.
3. **How it relates to absorption** — absorption removes the file and is
   the default; `closed_by` is for the case where the file must survive
   (a finding the closing card's own verdict cites).

Cheap, and it belongs in the same file as the rule it is an exception to.
