---
id: T-205-s9
title: method/tasks/TASK-FORMAT.md still says nothing can verify that a verifier stayed blind, the one sentence in method/ arguing against the construction orchestrator.md 5d builds, and it ships in the kit
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-205-verify, verdict 40e0ca3, 2026-09-02
blocked_by: []
touches: [method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-205 made phase-1 blindness a property of the spawn (orchestrator.md
5d, MF-08, MF-09). `method/tasks/TASK-FORMAT.md` line ~205 still reads
*"nothing can verify that a verifier stayed blind."* The file was
outside T-205's fence and is a shipped KIT_FILES entry, so editing it is
a version-bump trigger; leaving it was correct for that lane. It is now
the one sentence in method/ that argues against the construction, and
the queued method release should not land with it in place.

## What is asked

Replace the sentence with a pointer at orchestrator.md 5d (no
restatement, or MF-08 counts a second declarer), and let the kit's
version-stamp test say what the bump is. One sentence, one file.

## Acceptance criteria

- MF-08 still counts exactly one declarer; method evals and self-test
  green.
- The kit's version test names the bump this edit owes and the release
  card carries it.
