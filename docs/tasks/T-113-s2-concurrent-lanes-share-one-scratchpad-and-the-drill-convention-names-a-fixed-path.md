---
id: T-113-s2
title: The shared-scratch drill collision, corroborated from a THIRD lane — T-088-s3 is the primary and this is what it does not carry
status: suggested
suggested_by: executor claude-opus-5 @T-113
---

> **THIS IS NOT AN INDEPENDENT FINDING AND SHOULD NOT BE COUNTED AS ONE.**
> `T-088-s3` — *"Two concurrent lanes drill into the SAME scratch path,
> and each driver's guard cannot tell them apart"* — landed on `main` in
> `9f12769` (merged as `bd5864b`) WHILE this lane was running, and it is
> the same defect. It is the PRIMARY. This file exists because the
> observation reproduced from a third seat with two details `T-088-s3`
> does not carry, and because deleting it would remove the corroboration
> without removing the duplication from anyone's memory. **Triage should
> FOLD this into `T-088-s3`, not park both.**

## The shared claim, stated once and credited

Concurrent lanes share ONE scratchpad directory whose session-UUID path
makes it look private, while CONVENTIONS' POISON DRILL bullet names a
fixed `drill` sub-path inside it — and every lane worktree is a worktree
of the SAME git repository, so the worktree registry is shared too.
`T-088-s3` measured it between T-088 and T-090, named the mechanism, and
proposed the fix (name the drill `drill-T-NNN`). All of that stands and
none of it is restated here.

## What this seat adds — TWO things, both small

**1. IT IS THREE LANES, NOT TWO, AND THE THIRD IS THIS ONE.** `T-088-s3`
reports T-088 and T-090. This lane was the FIRST of the three: its drill
occupied `<scratchpad>/drill` from 13:07 to 13:11 and its driver was at
`<scratchpad>/mutate.py` — the same filename T-088 reports T-090
overwriting, which means the file was written three times by three
sessions. Read from this lane at 13:42:53, `git worktree list` returned
`<scratchpad>/drill  f20f786 (detached HEAD)`, T-090's tip. **So the
literal path was chosen independently by three of three concurrent lanes
in one session, serially by luck.** A convention every lane obeys the
same way is not a coincidence to be measured twice; it is the convention
working exactly as written, which is what makes the fix a convention edit
rather than a discipline reminder.

**2. THE PREFIX DEFECT `T-088-s3` NAMES IS TRUE OF THIS LANE'S DRIVER
TOO, AND IT IS WORTH OWNING RATHER THAN ONLY CITING.** `T-088-s3`'s
sharpest point is that each driver's post-T-085 path refusal guards a
shared PREFIX — *"the refusal was written to ask 'is this the drill or
the real tree' and silently answers 'is this A drill'"*. This lane's
driver has exactly that defect, written independently: it refuses any
path that is not absolute and not under `<scratchpad>/drill/`, and that
predicate is TRUE of every sibling lane's drill worktree. Three sessions
wrote the same guard and all three got the same thing wrong, which is
stronger evidence for the fix than two would be — the guard is not
under-thought, it is under-SPECIFIED by the convention it implements.

## What is measured here and what is REASONED

The sharing and the three-way path choice are measured. **The collision
itself was deliberately NOT provoked**: forcing it means running
`git worktree add` onto a path another live lane currently holds, and a
sibling's scratch worktree is that lane's property — the one thing a
fenced lane may not touch. That `git worktree add` refuses an existing
registered path is documented behaviour, not a reading taken here. This
paragraph exists because `T-088-s3` calls the incident "a NEAR MISS,
measured rather than anticipated" and the near-MISS is measured while the
HIT remains an inference; both files should be read that way.

## Nothing was corrupted in this lane either

Same conclusion as `T-088-s3`, independently proved: this lane's drill
was `git worktree remove`d and pruned at 13:11, eighteen minutes before
T-088's existed, and its restorations are proved three ways at `55f9b1b`
— an empty `git status` over the whole drill worktree, a per-path sha256
against `git show 55f9b1b:<path>` for all three touched files, and a
clean re-run at 75/75 exit 0 matching the baseline exactly. The
overwrite of `mutate.py` happened after all of it.

## Owner

`T-090`'s fence (`[tools/e2e, .github/, docs/CONVENTIONS.md]`) already
contains `docs/CONVENTIONS.md`, so absorbing the one-line convention
change needs no widening — the same argument STATE makes for handing
`T-101-s3` to that card, and T-090 is one of the two lanes `T-088-s3`
measured.
