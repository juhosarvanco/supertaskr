---
id: T-230-s2
title: The documented setup command `npm install` from app/ CANNOT run inside an armed lane — it rewrites app/package-lock.json, which the physical fence layer holds read-only, so every lane's fresh-worktree setup fails at step four with an EACCES that reads like a broken machine
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-230
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-216-s4`** — *the physical fence layer reds THREE of
the four suites inside every lane*. Same layer, same mechanism (a write
to a tracked file outside the fence), **different subject**: that card is
about four SUITE BODIES and its fence is the four test files, so it
cannot reach this. This is the SETUP, one step before any suite runs.
Filed as a sibling rather than appended to that card because T-216-s4 was
a live lane at the moment this was found, and appending to a card another
seat holds is the two-writer conflict the dispatch stamp exists to
prevent.

**MEASURED, in lane T-230's own worktree on 2026-09-01:**

    npm error code EACCES
    npm error syscall open
    npm error path /Users/ujju/Projects/nputer-T-230/app/package-lock.json

`npm install` rewrites the lockfile even when it changes nothing. The
physical layer makes every tracked file outside the lane's fence
read-only, and `app/package-lock.json` is outside every lane fence that
is not an `app/` lane — so **the fresh-clone ORDER as docs/CONVENTIONS.md
spells it is unrunnable inside an armed lane**, in the ordinary case
rather than an edge one.

**THE REMEDY IS ALREADY IN THE DOCUMENT AND IS NOT NAMED AS ONE.**
`npm ci` writes no tracked file, and it is already ci.yml's spelling for
this package — one of the TWO deliberate divergences the CI bullet
enumerates: *lockfile-exact installs in CI, everywhere*. So the fix is a
sentence in the lane's fresh-worktree sub-bullet saying that a lane runs
`npm ci` for app/ and why, not a new command and not a change to the
local spelling for an unfenced checkout.

**WHY IT IS WORTH A CARD RATHER THAN A HABIT.** The failure arrives as a
permissions error naming a file the lane never meant to touch, three
packages into a setup, and it looks like a broken machine rather than a
guard working. This lane spent a cycle on it. Every future lane on a
non-`app/` fence meets it at exactly the same step.

**Disposition hint: promote, and ride it on the next card that opens
docs/CONVENTIONS.md** — it is one sub-bullet. Check first whether
`T-216-s4`'s own repair has already widened what the physical layer
leaves writable, in which case this becomes a corroboration on that card
instead.
