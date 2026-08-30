---
id: T-112-s2
title: Two rows of the brief contract are still open at this ref — row 9 is row 8's untwinned twin and row 11 tells a size-S executor to checkpoint while no source it names defines one
feature: F-01
milestone: 4
priority: 30
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [method/roles/executor.md, docs/CONVENTIONS.md, method/interview/plan-interview.md, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-112 REQUIRED THESE SURFACED RATHER THAN PAPERED OVER, AND THIS IS
WHERE THEY LAND.** The card names three residuals against `T-089-s9`
and instructs the assembler to *"file it against `T-089-s9` rather than
inventing a value"*. **`T-089-s9` NO LONGER EXISTS**: `T-104` absorbed
it at the seventh triage (2026-08-24) and removed the file — the
`Absorbs` line on `docs/tasks/T-104-*.md` names it. So the residuals had
no holder, and this card is that holder.

Re-derived at T-112's own ref rather than taken from the card:

**ROW 9 IS ROW 8'S UNTWINNED TWIN — STILL OPEN.** Row 8's source column
names its ENUMERATION: *"each standing gate is a bullet naming a
merge-diff TRIGGER; enumerate those bullets and derive fire/not-owed
from the diff"*. Row 9's is the bare *"the project's CONVENTIONS"*, with
no mechanism at all. Every implementation therefore BORROWS row 8's
clause — a top-level bullet opening with an upper-case run — and the
borrow has a measured symptom: a named bullet whose name runs through a
lower-case word is CUT at that word. `docs/CONVENTIONS.md`'s
merge-into-main bullet comes back as `THE MERGE INTO MAIN IS`, losing
`@human'S GATE, BY DESIGN AND NOT BY ACCIDENT`.

**TWO INDEPENDENT READERS CUT THE SAME NAME AT THE SAME WORD**, which is
what makes this the CONTRACT's defect rather than one implementation's:
`tools/e2e/scripts/dispatch-brief.mjs` prints that truncation in its own
row 9, and `app/src-tauri/src/dispatch/brief.rs` reproduces it. The
Rust side ASSERTS the truncation rather than repairing it
(`row_nines_borrowed_mechanism_truncates_a_name_and_the_symptom_is_asserted`),
because repairing it means inventing a rule row 9 does not state.

**ROW 11 TELLS A SIZE-S EXECUTOR TO CHECKPOINT AND NAMES NO DEFINITION —
STILL OPEN.** Row 11's source column names three files:
`tasks/TASK-FORMAT.md`'s ceremony table, `lane-protocol.md`, and the
role file. All three USE the word and none defines it — TASK-FORMAT's
size-S row says *"it merges, checkpoints and removes its own worktree
(lane-protocol.md rules 4, 6)"* and routes to two rules that are not
definitions. The definition lives in `method/docs-protocol.md` and
`method/roles/integrator.md`, neither of which row 11 names. So an
executor assembling row 11 faithfully learns it owes a checkpoint and
not what one is.

**AND THE THIRD RESIDUAL IS CLOSED — SAID SO A READER DOES NOT GO
LOOKING.** The card names *"row 5's slug↔path map is named but not
located"*. Row 5 now locates it: *"that map is the project's
architecture doc's slug block PLUS each component file's own
`touch_slugs:` field, and the FIELD is authoritative"*. Nothing is filed
for it, and `row_fives_residual_is_closed_at_this_ref_and_the_document_says_so`
keeps that claim honest — it reds if the locating clause ever leaves the
column.

## The fence this needs, decided here rather than left to the lane

`docs/CONVENTIONS.md`'s first gotcha rules that a change to *"what a
card, a room, a brief or a role may SAY: a field, a status, a normative
table, a contract row"* is a METHOD VERSION BUMP, and both edits above
are contract rows. **A bump is a three-file commit and the third file is
Rust**, so `touches:` carries the CONVENTIONS stamp, the
plan-interview.md stamp and `app-agent` for
`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs` — a fence
that cannot reach all three cannot take this card. The bump also owes
`node tools/method-evals/run.mjs --bump` in its commit message
(METHOD EVAL GATE), and `method/roles/executor.md` is a `KIT_FILES`
question to re-derive at the lane's own ref.

## Acceptance criteria

- ROW 9's source column SHALL name its own enumeration, or SHALL state
  that it takes row 8's, so that two readers of the row cannot disagree
  about what a named discipline is.
- ROW 11's source column SHALL name whichever file DEFINES a checkpoint,
  or the size-S ceremony row SHALL stop using the word.
- THE method version SHALL be bumped across its three files in ONE
  commit, and the eval block SHALL be recorded in that commit's message.
