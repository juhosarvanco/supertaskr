---
id: T-241-s4
title: The seat skill's review vocabulary is a hardcoded copy — degrading TASK-FORMAT's own line leaves the pack green, so a fourth value would arrive silently
feature: F-04
milestone: 4
size: S
priority: 15
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2) @T-241
blocked_by: []
touches: [method/skills, tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review: same-model
---

T-241's criterion 6 asks the quick path to use *"TASK-FORMAT's own values"*.
`method/skills/supertaskr-seat/SKILL.md` spells `same-model` and
`self-verified` and adds **"do not invent a fourth"**, and
`the_shipped_seat_skill_still_carries_its_three_load_bearing_clauses` pins
all three strings. The values are correct today.

**Measured at `9f56d19`, two-sided, by T-241's phase-2 verifier.**

- Change the PACK's value (`same-model` → `fast`): the clauses body reds.
- Change the ANCHOR — remove `self-verified` from
  `method/tasks/TASK-FORMAT.md`'s own `review:` vocabulary line: the pack's
  bodies stay **green**. `node tools/method-evals/run.mjs` does red, exit 1,
  but for a different arm — *"the review modes disagree: TASK-FORMAT has
  nothing extra, lib/parser/src/types.ts's REVIEW_MODES has [self-verified]
  the method does not"* (MF-05, comparing the method against the parser).

So the host tree cannot drift silently between TASK-FORMAT and `types.ts`,
and **the pack is tied to neither**. A fourth value added legitimately would
leave `SKILL.md`'s *"do not invent a fourth"* stale, and nothing in the tree
would say so.

## What to do

Either read the vocabulary out of `method/tasks/TASK-FORMAT.md` at run time
(the split `golden-check.mjs` already keeps with its golden: the file owns
the SET, the program owns the comparison), or add the pack to MF-05's
comparison as a third corpus. The second is cheaper and puts the answer
where the other two vocabularies already meet.

Run the positive control where the arming is absent: degrade TASK-FORMAT's
line on a COPY and require the new body to catch it, and record the
demonstration rather than asserting it.
