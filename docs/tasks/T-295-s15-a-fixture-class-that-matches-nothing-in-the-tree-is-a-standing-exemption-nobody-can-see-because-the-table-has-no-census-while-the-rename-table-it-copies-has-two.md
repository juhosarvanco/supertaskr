---
id: T-295-s15
title: "A fixture class that matches nothing in the tree is a standing exemption nobody can see, because the table has no census while the rename table it copies has two — a dead exemption is a hole with a comment on it"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-295-s4, 2026-09-14, comparing the new table against the rename table it was modelled on"
blocked_by: [T-295-s4]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-295-s4 took `rename-scan.mjs`'s `KEPT_CLASSES` as its model and took
the table without the two readings that keep it honest: that file walks
its corpus through `scanLegacy` and reports what no class covers through
`unclassifiedLegacy`, so a class is visibly live and a survivor is
visibly unclassified. `FIXTURE_CLASSES` has neither. Nothing lists the
entries, nothing says which sites still carry the value an entry names,
and nothing reds when an entry matches nothing at all.

A dead entry is not cosmetic. It is a standing permission to plant that
value at those sites, kept alive by a comment saying why it was needed
once. The keeper judges only the lines a merge ADDS, so a dead entry
costs nothing until the day a diff adds the value again — and on that
day the exemption applies with no living reason behind it.

The reading is cheap because the corpus is known: the sites an entry
names are paths and directories in this tree, and the value is a
pattern. Whether a stale entry should RED a gate or only be reported is
the card's question, and the rename table's own answer is the obvious
place to start.

## Acceptance criteria

- WHEN the entries of the fixture table are asked about the tree THE
  program SHALL answer, per entry, whether any tracked file under the
  sites it names still carries a value its pattern matches, in
  tools/e2e/scripts/merge.mjs.
- WHEN an entry matches nothing in the tree THE reading SHALL name it as
  a DEAD exemption and say what removing it would cost, pinned by a body
  in tools/e2e/tests/merge.spec.ts over a table carrying one live and
  one dead entry, with the control where both are live.
- WHERE the reading is wired to a gate THE card SHALL state which gate
  and why that exit, because an entry going dead is news about a table
  rather than a defect in a merge.

## Implementation notes

## Verdicts
