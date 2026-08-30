---
id: T-147-s1
title: The ceremony ROW is now mechanically derivable and row 11 of every brief still says it will not guess — the partition T-147 landed is read by no program
feature: F-01
milestone: 4
status: parked
suggested_by: executor claude-opus-5@subagent @T-147
touches: [tools/e2e, docs/CONVENTIONS.md]
---

**Class parent: `T-135`** (ceremony scales with blast radius, size L,
`status: building`) — that card replaces the S/M/L partition with a
graph-derived one, and this finding is the SAME question answered one
rung lower with what already exists today. Triage should decide whether
this is worth landing before T-135 or is absorbed by it.

**Disposition hint: promote small, or absorb into T-135 —** the work is
one derivation in an existing program, and it is the difference between
a rule that is stated and a rule that is applied.

## The finding, derived at `aa8348da9b44` and re-derived after T-147's edit

`method/roles/executor.md` row 11 asks the brief to name WHICH ceremony
row a size-S card falls on, because that is what decides whether the card
owes a verifier. `tools/e2e/scripts/dispatch-brief.mjs` prints both S
rows and then this note:

    # more than one row matches this tier — WHICH row is a reading of
    # the diff, not of the letter, and this tool will not guess it

That note was CORRECT while the partition was unstated: the only
available answer was `method/tasks/TASK-FORMAT.md`'s rule of thumb, which
is prose a program cannot apply. **T-147 removed that excuse.** The
partition is now a two-clause mechanical test over `touches:` — a
registry slug, or a bare `method/` path that reaches a `KIT_FILES` entry
— and every input it needs is already loaded in the same program: row 5
expands `touches:` through the live slug map, and `KIT_FILES` is a
`git grep` away.

**So the fact that decides the ceremony is derivable and is still
delivered as a question.** Row 11's whole reason for existing (the brief
contract: *"the session guesses the ceremony, and guesses upward"*) is
paid for by a note explaining why the tool will not answer it.

## What it would take

Expand the card's `touches:` through the slug map the brief already
builds; if any entry is a slug, or is a `method/` path reaching a
`KIT_FILES` entry, name the *"S, touching shipped code"* row; otherwise
the other one. Cite `docs/CONVENTIONS.md`'s partition bullet as the
source, the way every other row cites its own, and keep the refusal
shape for the case the bullet cannot be found — a derivation that
silently defaults is worse than the note.

## The caution that belongs with it

The partition bullet is PROSE in a document, and a program that parses it
gains a second copy of a rule (this file's own standing lesson). Prefer
parsing the two derivation COMMANDS the bullet carries over
re-implementing its sentences, and red loudly by name if the bullet is
renamed — `rawBullet`'s existing throw-on-absence shape is the precedent.

**PARKED at standing triage sitting #2 (2026-08-30, architect) — behind `T-135`, which is the second arm of this card's own disposition hint.** The finding holds: the partition is a two-clause mechanical test, every input it needs is already loaded in the same program, and the brief still delivers as a question the fact that decides the ceremony. What triage will not do is build a deriver for a partition `T-135` is under way to REPLACE. That card (`status: building`, @human-adopted) swaps the S/M/L basis for a graph-derived one; a deriver written against today's clauses would be a second copy of a rule about to move, which is this card's own closing caution turned on itself.

**RESURFACES when `T-135` reaches `status: done`** — derive with `grep '^status:' docs/tasks/T-135-*.md`, one command, checkable by whoever integrates that card. The seat that unparks re-derives the partition's clauses AT ITS OWN REF rather than trusting the two named here, because the whole point of the wait is that they are expected to have changed.

**And if `T-135` lands without touching row 11's note**, that is the signal this card was right to be separate: unpark it immediately and take it small, since by then the partition is settled and the derivation is the one-pass change this card describes.
