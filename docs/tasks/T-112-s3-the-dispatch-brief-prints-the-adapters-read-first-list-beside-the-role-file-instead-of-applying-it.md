---
id: T-112-s3
title: dispatch-brief.mjs prints BOTH adapters' read-first lists beside the role file instead of APPLYING its reading step, so every brief it has ever emitted told an executor to read the one document its role file subtracts
feature: F-04
milestone: 4
priority: 20
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY BEING THE SECOND READER OF THE TABLE, WHICH IS THE WHOLE
REASON T-112 EXISTS.** That card says so: *"This card's assembler is the
second reader of that table, and it will find whatever the hand-walk
missed."* This is one of them, and it is in the FIRST reader.

Row 3's source column does not merely name the adapter. It says the role
file's *"reading step is APPLIED to that list rather than printed beside
it — **the adapter is addressed to every seat and the role file to one,
so where they differ the ROLE FILE WINS**"*. The table's rules section
then names the exact failure this prevents: *"a brief that is internally
inconsistent while every row is individually faithful to its source"*,
and gives this row as the worked example — *"row 3 transcribes an
adapter list addressed to every seat, and the role file four rows
earlier subtracts from it."*

**`tools/e2e/scripts/dispatch-brief.mjs` PRINTS IT BESIDE.** Run
`node scripts/brief.mjs --task T-112` from `tools/e2e/` at any ref and
row 3 comes back as two lines — `AGENTS.md names:` and `CLAUDE.md
names:` — each carrying `docs/ROADMAP.md`, which
`method/roles/executor.md` step 1 subtracts in as many words
(*"You do NOT read docs/ROADMAP.md, and that is a deliberate
subtraction rather than an oversight"*), and neither carrying the role
file's own ADDITION (`tasks/TASK-FORMAT.md`'s ceremony table), whose
absence that step says *"cost the same dispatch error twice"*.

So an executor obeying its brief's row 3 reads a document its role file
forbids and misses the one it requires — and both halves are quoted
correctly from their sources, which is exactly why a transcription rule
alone cannot catch it.

**THE FIX IS DERIVED, NOT LISTED, AND ONE EXISTS TO COPY.**
`app/src-tauri/src/dispatch/brief.rs`'s `row_read_first` reads both
halves out of the role file's own sentences (`read_subtractions`,
`read_additions`) and emits the APPLIED list beside the adapter's
original, so the difference is visible rather than silent. A role file
stating no subtraction leaves the adapter's list unchanged, which is the
positive control that keeps the derivation from being a constant.

## Acceptance criteria

- ROW 3 SHALL emit the read-first set with the brief's own role file's
  reading step APPLIED, and the subtraction and addition SHALL be
  DERIVED from that role file rather than listed in the tool.
- THE brief SHALL still show what the adapter itself named, so a reader
  can see WHICH document the role file removed and which it added.
- A body SHALL prove the derivation is not vacuous: a role file with no
  subtraction clause leaves the adapter's list unchanged.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-04 p20, as filed

Re-derived at `b60b06d`: `deriveReadFirst` in
`tools/e2e/scripts/dispatch-brief.mjs` still emits one `value(...)` row
per root adapter (`${rel} names: ${docs.join(" ")}`) and applies no
subtraction from the role file — the card's claim holds unchanged, and
`method/roles/executor.md:9` still carries the subtraction it ignores.

**AND THIS ONE IS DISPATCHABLE TODAY.** Its fence is `[tools/e2e]`,
which `.nputerignore` excludes from the graph walk, so it cannot move
the 410-byte headroom. With the code queue held behind `T-140-s4`, this
card and `T-163-s5` are the two F-04/F-06 promotions a lane can take
right now.
