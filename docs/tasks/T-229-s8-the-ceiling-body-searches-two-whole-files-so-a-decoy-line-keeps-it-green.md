---
id: T-229-s8
title: The ceiling body searches two whole method files with no uniqueness floor, so one decoy line keeps it green with the home rewritten
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-229-s4
blocked_by: []
touches: [app/test/select-board.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-229-s4`**, whose verdict measured this. That card
aimed `app/test/select-board.test.ts`'s ceiling body at the value's
declared HOME as well as at orchestrator.md's citation, and it succeeds:
moving the number in either file reds the body by name. What it does not
do — and did not inherit the ability to do — is pin the SENTENCE.

`CONVENTIONS`' POISON DRILL catalogue, **shape EIGHT**: *an assertion
that SEARCHES a corpus has no uniqueness floor, so one duplicate anywhere
keeps it green with its own subject deleted.* The body runs
`/Ceiling:\s*(\d+)\s*[–—-]\s*(\d+)\s*concurrent/.exec()` over the whole
text of each file and takes the FIRST match.

**MEASURED at `339b8d31a615edfda1e9b8d02d3677ca4d403889`** on an
independent bench, one side only, restored and sha256-proved: with a
decoy line `Ceiling: 3–5 concurrent` planted ABOVE
`method/tasks/TASK-FORMAT.md`'s line 701 AND the real home line rewritten
to `4–5`, `npm test` from `app/` exits **0**, 50 files / 1131 bodies
passed. The home moved and nothing noticed.

**THE HOLE IS INHERITED, NOT INTRODUCED.** The body T-229-s4 replaced had
exactly the same shape against `method/roles/orchestrator.md`; that card
doubled the number of files read, and with it the number of unanchored
reads. Nothing is red today and nothing is wrong with what shipped — this
is the remaining half of the same argument the ceiling's home makes about
itself: *the copy nothing reads is the copy that drifts.*

**THE REMEDY IS THE CATALOGUE'S OWN, AND THE ANCHOR ALREADY EXISTS.**
Shape EIGHT's mechanical remedy is *narrow the haystack to the line or
section pinned, with an ANCHOR that is not the needle, and assert the
ANCHOR's own uniqueness.* `method/tasks/TASK-FORMAT.md`'s home line
carries one: the phrase `THIS LINE IS THE VALUE'S HOME`, whose occurrence
count in that file is **1** at the ref above (derive it at your own ref
rather than trusting this sentence). `method/roles/orchestrator.md`'s
citation has no equivalent phrase; the honest anchor there is its own
step-4 sentence, or the file's declaration that the line IS a citation.
Whether both halves are worth the same treatment is the design question
this card carries — an anchor that is itself unpinned buys less than it
looks.

**THE DRILL THIS CARD OWES** is the one that measured it: plant a decoy
above the pinned line, move the pinned line, and require the RED. A
version of this body that passes that is the deliverable; a version that
merely reads the anchor is not, because the anchor's uniqueness is the
half that does the work.

**WHY IT IS A SUGGESTION AND NOT A REJECTION**, recorded so the next
reader does not re-argue it: T-229-s4's criterion is that the body reds
when either file moves away from `CONCURRENCY_CEILING`, and it does. A
decoy planted elsewhere in the file is a different threat model, and the
shipped body is strictly better than the one it replaced.
