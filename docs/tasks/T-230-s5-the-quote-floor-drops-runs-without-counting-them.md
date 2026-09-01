---
id: T-230-s5
title: The unmarked-quote floor drops short runs without counting them, while the class's own text says the unmarked ones are COUNTED and LISTED
status: suggested
feature: F-06
milestone: 4
priority: 4
size: S
blocked_by: []
touches: [tools/e2e]
review: independent
suggested_by: "verifier claude-opus-5@subagent @V-230, 2026-09-02 — found attacking T-230's second acceptance criterion at 90dfe53"
---

`unmarkedQuotes` drops any quoted run shorter than `MIN_QUOTE_CHARS`.
The floor is argued in the constant's own doc comment, measured over the
live board, and pinned by a spec body — none of that is in question.

**What is missing is one number.** A run below the floor leaves no trace:
it is not in either unmarked count, it has no floor count of its own, and
the class's `cannot` text says the unmarked ones *"are COUNTED and LISTED
rather than passed over"*, which is true of everything above the floor
and of nothing below it. That is a small distance between what the report
claims about itself and what it does, in the one arm whose whole subject
is the difference between checked and merely not-refused.

A `below the quote floor: N` line beside the two existing counts closes
it, and the same line makes the threshold's effect visible at every ref
rather than only in the constant.
