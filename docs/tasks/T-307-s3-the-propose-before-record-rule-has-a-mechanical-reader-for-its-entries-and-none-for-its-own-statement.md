---
id: T-307-s3
title: "The propose-before-record rule has a mechanical reader for the entries it governs and none for its own three statements — delete the sentence from ROOM-FORMAT.md and every gate stays green"
feature: F-01
milestone: 4
size: S
priority: 3
status: parked
wake: T-284
suggested_by: "executor claude-opus-5@subagent @T-307, measured at a00acf00bf6000d646c96218986032b599c2159c, 2026-09-10"
blocked_by: []
touches: [tools/method-evals/, method/rooms/ROOM-FORMAT.md, method/roles/orchestrator.md, method/docs-templates/decisions/000-template.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `a00acf00bf6000d646c96218986032b599c2159c`

T-307 states the rule once in each of three files and holds the ENTRIES
with MF-11. Nothing holds the STATEMENTS. Delete the entry bullet from
`method/rooms/ROOM-FORMAT.md`, or the comment from the decision
template, and the model-free set stays green: MF-03 reads a role file's
first two lines, MF-04 reads its path references, MF-02 reads its
ordinals, and none of them reads a rule's presence.

This is the METHOD EVAL GATE bullet's own complaint one level in — a
byte pin and a tested effect are different claims. The decision template
IS byte-pinned, by `app/src-tauri/src/agent/kit.rs`'s
`every_compiled_entry_matches_its_method_file_byte_for_byte`, and that
pin is satisfied by whatever the file says today: it compares the
compiled copy to the file on disk, so both halves move in one edit and
nothing notices which words left.

## Why it was not done in T-307

The card asked for ONE eval and named its contract: an eval that fails
on a room entry carrying a quoted message or a personal name. A second,
different claim inside the same eval muddies a contract the harness
prints beside every failure, and the suite's own design is one contract
per eval.

## The shape that would work

An anchored presence check, in the shape `app/test/select-board.test.ts`
already uses for the concurrency ceiling: narrow each file to the ONE
block carrying its own unique anchor phrase, then require the rule's
needle exactly once INSIDE that block. The uniqueness floor is what
makes a decoy red and the block floor is what stops a decoy in the same
block being read instead. The three anchors exist today, one per file.

The trap: pinning the rule's whole sentence. A method sentence is
re-wrapped and re-worded constantly, and a check that reds on a re-flow
teaches the next editor to delete the check.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; the propose-before-record rule has a reader for what it governs and none for its own three statements.
