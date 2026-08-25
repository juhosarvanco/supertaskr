---
id: T-091-s3
title: The RANGE RULE's flip figures carry their ref and not their trigger, and GRAPH REGEN's trigger has moved under them
status: suggested
suggested_by: executor claude-opus-5 @T-091
---

**THE FIGURES ARE RIGHT AND THAT IS WHY THIS IS A DISCLOSURE RATHER THAN
A DEFECT.** The RANGE RULE bullet states *"Derived at `ddcc8bb` across
those same 31 merges: the prescribed range says BOOT GATE is NOT owed
**10** times and the naive range fires anyway on **8** of them; it says
GRAPH REGEN is not owed **5** times and the naive range fires anyway on
**5 of 5**. THIRTEEN FLIPS IN FIFTEEN CHANCES, over TWELVE distinct
merges."* Re-derived at `d2bba71` under the trigger as it stood AT
`ddcc8bb`, every one of those reproduces exactly, and so does each of the
twelve hashes and each parenthetical beside them.

**GRAPH REGEN'S TRIGGER GAINED `*.rs` ON 2026-08-25** (`T-123-s5`,
architect, at main `8776326`) — after `ddcc8bb`, and the flip paragraph
has not been re-derived since. Under the trigger ON DISK the same 31
merges give:

| gate | trigger at `ddcc8bb` | trigger on disk | flips at `ddcc8bb` | flips on disk |
|---|---|---|---|---|
| BOOT GATE | unchanged | unchanged | **8** of 10 | **8** of 10 |
| GRAPH REGEN | `.ts .tsx .js .jsx` | `.ts .tsx .js .jsx .rs` | **5** of 5 | **1** of 1 |

So the headline moves too: **THIRTEEN in FIFTEEN over TWELVE becomes NINE
in ELEVEN over EIGHT**, and the named GRAPH list collapses from five
merges to one — only `fed70a2` survives, because `3f2eb1e`, `91ab46e`,
`38886d3` and `7e3e8b5` each carry Rust paths in their own prescribed
diff and are therefore OWED under the widened trigger rather than flipped
by it (4, 3, 5 and 3 paths respectively, derived at `d2bba71`).

**NOTHING IS FALSE. WHAT IS MISSING IS ONE CLAUSE.** A count is a
function of its GATE TRIGGER exactly the way a path count is a function
of its RANGE SPELLING — and this bullet already teaches the second lesson
at length. Its own `31`-versus-`30` case is the model: *"a figure and the
command that produces it are ONE claim."* The flip figures carry the ref
that makes them honest and not the trigger that would make them readable,
so the next re-deriver who obeys the bullet's own **DERIVE THE LIST,
NEVER QUOTE IT** and matches against the gate's CURRENT trigger will get
9/11/8 and reasonably conclude the paragraph is stale.

**T-091's READER DELIBERATELY DOES NOT RED ON THIS.** It checks the
figures against the trigger at the ref the paragraph names — because
re-deriving them against the disk trigger instead would RED ON A TRUE
NUMBER, which is the hazard this card exists to prevent. It asserts the
relationship instead (a widened trigger can only lower a not-owed count
and shrink a flip set, both checked) and DISCLOSES the divergence in the
run's own output, so the fact is loud and the suite is honest.

**DISPOSITION — one sentence, not a re-derivation.** Beside
*"Derived at `ddcc8bb`"*, name the trigger those figures were matched
against, and note that GRAPH REGEN's has since gained `*.rs`. Optionally
add the disk-trigger row above. Fence `docs/CONVENTIONS.md`. **Do not
replace the `ddcc8bb` figures with the disk ones** — the paragraph's
argument is about a mechanism (a lane fenced to one tree, cut from a
checkpoint whose main advanced in another) and the older, larger sample
is the better evidence for it; what it needs is the label, not new
numbers.

**AND THE SAME QUESTION IS OPEN FOR EVERY OTHER GATE COUNT IN THE TREE.**
Every checkpoint that records "GRAPH REGEN — NOT OWED, 0 of N" recorded
it under whatever trigger was current that night, and none of them says
which. This suggestion is about one paragraph; the shape is general.
