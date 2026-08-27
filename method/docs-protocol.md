# Docs protocol

The governing documents carry what a session must LOAD; the records
carry what HAPPENED. This file is the generic contract; each project's
ratifying decision record names its own budgets, template locations
and gate. (First ratified as nputer's ADR-019, from the room
docs/rooms/governing-docs.md, where the measurements live.)

1. **Three kinds of fact, three keepers.** Every sentence in a
   governing document (the state, roadmap, architecture and
   conventions files, however the project names them) is a RULE, a
   TRUTH or a RECORD. RULES — how to work — are kept by version and
   gates, and live in the governing documents as the rule, the why (a
   sentence or two), the authority that enforces it, and the task ids
   that proved it. TRUTHS — what is true now — are kept by programs: a
   governing document carries the derive command, or a GENERATED
   document with a currency check, never a bare transcribed figure.
   RECORDS — what happened, stamped at a ref — are kept by
   immutability, in task cards, checkpoint records and decision
   records, and never enter the governing documents.
2. **A figure needs a keeper.** A number appears in a governing
   document only if a program re-derives it, a generator with a
   currency check emits it, or it is ref-stamped in an immutable
   record. Otherwise write the command that derives it, never the
   number.
3. **Governing documents are replaced; records are appended.** A stale
   sentence in a governing document is REPLACED by the current one
   plus a citation to the card or record that holds the history — the
   old text stays reachable in version control at the ref the
   replacing commit names. Correction-in-place with full history
   preserved is the rule for RECORDS, where it is absolute: a record
   is written once and never edited.
4. **The state document is regenerated, not accreted.** At every
   checkpoint the integrator FIRST writes one append-only checkpoint
   record (docs/checkpoints/, on the project's committed template) —
   the merge's ranges, gates, suites, board deltas, environment facts
   and what the brief got wrong — and then REGENERATES the state
   document from the project's template, under a byte budget a gate
   enforces. The record keeps the INSTANCE; the state document keeps
   the MECHANISM. No suite, gate or generator may ever DEPEND on the
   checkpoint records.
5. **The lesson once.** A recurring pattern earns one rule, one
   provenance citation and one worked example in a governing document;
   further instances are stamped in checkpoint records only.
6. **Budgets are tripwires, not the cut.** The project declares byte
   TARGETS for its governing documents; gate values are DERIVED at
   each document's compaction landing (warn ≈ landed × 1.25, fail ≈
   landed × 1.5) and recorded in the ratifying decision record with
   the measurement. When the gate warns, content moves to a record or
   a card — a hazard is never deleted to fit.
7. **Each role's file names the sections that role reads first**, so
   the reading cost is paid where it earns its keep.
