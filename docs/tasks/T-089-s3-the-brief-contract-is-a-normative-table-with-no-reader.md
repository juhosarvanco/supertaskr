---
id: T-089-s3
title: The dispatch-brief contract is a normative table that nothing in this repository reads — the same shape as the banking map before T-024
status: suggested
suggested_by: executor claude-opus-5 @T-089
---

T-089 added three normative things to `method/` and **no code reads any
of them.** Said plainly here rather than left for a verifier to notice,
because an uncovered normative table is a finding, not a gap to paper
over.

## What is uncovered, derived rather than assumed

At `4d2f03c`, the only first-party code that reads any `method/` file is:

| method file | its reader | what the reader asserts |
|---|---|---|
| `interview/plan-interview.md` | `kit.rs` (`the_shipped_plan_interview_still_carries_the_normative_banking_map`), `app/test/genesis-derive.test.ts` | the banking map's nine stage rows and the `table is normative` phrase; the TS transcription matches |
| `runtime/sessions-schema.md` | `app/src-tauri/src/agent/sessions.rs` | field-for-field |
| the 14 `KIT_FILES` entries | `kit.rs` (`every_compiled_entry_matches_its_method_file_byte_for_byte`, `the_snapshot_table_covers_every_method_scaffold_file`) | byte parity, and that no scaffold file is missing from the table |
| `docs/CONVENTIONS.md`'s version stamp | `kit.rs` (`snapshot_version_matches_the_live_method_stamps`) | the stamp equals the const |

`method/roles/executor.md`, `method/roles/integrator.md`,
`method/roles/orchestrator.md`, `method/roles/verifier.md`,
`method/roles/planner.md` (beyond byte-parity as a kit payload),
`method/tasks/TASK-FORMAT.md` (same) and the new
`method/lane-protocol.md` have **no assertion about their CONTENT
anywhere.** `grep -rn "executor.md\|integrator.md\|orchestrator.md"` over
`*.rs`, `*.ts`, `*.tsx`, `*.mjs` returns one comment and no assertion.

So, specifically uncovered:

1. **The dispatch-brief table** (13 rows, `roles/executor.md`). A row can
   be deleted and every suite in this repository stays green.
2. **The lane protocol** (7 rules, `lane-protocol.md`). Same.
3. **The dispatch-stamp rule** (`tasks/TASK-FORMAT.md` lifecycle). Same —
   and this one is worse, because the field it governs is in the parser's
   vocabulary, so the tree *looks* covered.

## Why this is the banking map's own shape, one iteration earlier

`plan-interview.md`'s stage table was normative-and-unread until a
program transcribed it, and then it acquired two readers in two cards
(T-024's stage inference, T-025's kit parity) — plus the CONVENTIONS
gotcha that says changing it is a version bump *and code reading it must
be kept in sync*. The brief contract is at the pre-T-024 point: normative
by declaration, held by discipline alone.

## The cheap first reader, and it is already scheduled

F-04's assembler (the card after T-088) transcribes this table. The
moment it does, the parity test writes itself — the same shape
`genesis-derive.test.ts` already uses for the banking map: read
`method/roles/executor.md`, require one row per component the assembler
emits, and require the assembler to emit one per row. That is a
BIDIRECTIONAL check, which is what makes it catch a row the doc gains as
well as one it loses (the property `workflow-parity.spec.ts` has and the
older mirrors did not).

Until then the honest statement is the one in T-089's notes: **the
contract is a written ritual with zero tripwires**, weaker than GRAPH
REGEN was before T-054 (which had one), and it should not be described as
enforced by anything.
