---
id: T-030-s3
title: Zero-padding aliases task and feature ids too — only component ids are checked
status: suggested
suggested_by: executor claude-opus-5 @T-030
---

T-030 added `aliased-id`: two DIFFERENT component id strings sharing one
numeric value (`C-05` / `C-005`) are one registry slot spelled twice, so
"first by component id order wins" is decided by string comparison — an
arbitrary winner nobody declared. The criterion scoped it to the
component set, and that is where it landed.

The same aliasing is legal, unchecked and more dangerous in the two id
spaces the board actually renders. Probed on this branch's parser:

    docs/ROADMAP.md      ## Backbone
                         - F-1:  One — a
                         - F-01: One padded — b
    docs/tasks/T-01-a.md    id: T-01
    docs/tasks/T-001-b.md   id: T-001,  blocked_by: [T-01]

    → tasks: T-001 T-01 · features: F-1 F-01 · zero issues
      (the only issue reported is the deliberate self-cycle in the probe)

Both id families accept unpadded digits by format — tasks are
`^T-\d+(-s\d+)?$` (T-019), features are `F-\d+` — so nothing rejects the
pair, `duplicate-id` compares strings exactly and stays silent, and the
filename rule is satisfied because each file encodes exactly its own
declared spelling. Consequences, in increasing order of harm:

- The board renders TWO columns for what a human reads as one feature,
  and a task naming the other spelling dangles or lands in the wrong
  column.
- `blocked_by: [T-01]` resolves to exactly one of the two tasks — the
  one that spelled it that way — so a dependency silently means
  something other than what its author meant. This is the failure the
  cycle rule was added to make loud, arriving by a different door.
- Nothing in the tree collides today (F-01…F-06, T-001…T-050, every id
  three digits or `-sN`), so this is a trap for the next hand-numbered
  task or an interview-written backbone, not a live bug.

Cheap shape: lift T-030's slot grouping (leading zeros stripped as TEXT,
one issue per slot, index-aligned ids/files) out of parseComponentSet
into a helper, and run it over task ids in validateProject and over
backbone feature ids in parseRoadmap. Same kind, same message shape,
three call sites instead of one. The alternative — pinning a canonical
width in TASK-FORMAT.md and rejecting unpadded ids — is a format change
with a migration, and T-030's triage already showed how those go.
