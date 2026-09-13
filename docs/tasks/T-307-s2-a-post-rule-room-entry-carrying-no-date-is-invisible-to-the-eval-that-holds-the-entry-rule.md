---
id: T-307-s2
title: "A room entry written after the rule but carrying no date is invisible to MF-11 — the date cascade cannot place it, so the eval skips the one entry an evading seat would write"
feature: F-01
milestone: 4
size: S
priority: 3
status: parked
wake: T-284
suggested_by: "executor claude-opus-5@subagent @T-307, measured at a00acf00bf6000d646c96218986032b599c2159c, 2026-09-10"
blocked_by: []
touches: [tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs, method/rooms/ROOM-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `a00acf00bf6000d646c96218986032b599c2159c`

MF-11 is scoped by DATE, because the rule it holds looks forward and the
rooms behind it are records. An entry's date comes from a cascade — the
date in its own heading, else the newest date in its body, else the
room's `opened:` field, else none — and an entry with NO date is out of
scope by construction.

That hole is disclosed in the eval's own header, and it is the hole
worth closing: the rule requires an entry to carry the ruling's date, so
an undated post-rule entry is already a defect, and it is the exact
entry a seat would write if it were routing around the eval rather than
around the rule. Measured at this ref, 115 entries across 16 rooms parse,
and the cascade places every one of them; the class is empty today.

## The shape that would work, and the one that would not

WOULD NOT: inheriting the file's newest date. A still-active room gains
one dated entry and every old undated section in it becomes in-scope,
so the check reds on records — the outcome the rule forbids.

MIGHT: ask git rather than the text. `git log --diff-filter=A` cannot
answer per-section, but `git blame` over the heading line dates the
entry by when it was written rather than by what it says, which is the
question the scope actually asks. That trades the suite's one strong
property — it reads a corpus, so its positive control is exact — for a
subprocess per room, and the eval already shells out once for the
identity set. Whether the trade is worth it is the card's first
decision, not an assumption it inherits.

ALSO WORTH WEIGHING: an entry with no date could simply be a finding of
its own. That is the rule's own words already ("paraphrases the ruling
and DATES it"), it needs no git, and it makes the hole visible instead
of closing it silently. The cost is that it reds on an undated section
of a room OPENED after the floor even where nothing was quoted, so the
scope needs the same care.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; an undated room entry is invisible to the eval, which is the one entry an evading seat would write.
