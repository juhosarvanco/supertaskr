---
id: T-167-s5
title: The headroom alarm names the room LEFT, which is a standing number every lane sees the same — not what the reader's own working tree just spent, which is the number that would make them act
feature: F-06
milestone: 4
priority: 5
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167-s2
blocked_by: []
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

**CLASS PARENT: `T-167-s2` (this is its follow-up, filed by its own
lane). DISPOSITION HINT: promote behind whatever moves the budget next —
it is a two-line change to one function, and it is worth more AFTER
`T-140-s1` lands than before, because until then the alarm is standing
rather than moving.**

`T-167-s2` made `index --check` shout below `check::WARN_HEADROOM_BYTES`
of room. What it shouts is the room LEFT — a property of the tree, not
of the reader's diff. Derived in that lane at
`3b6098ebea80f198911b176a865594c7d0726378`: the block says
`6865 bytes left`, and it will say very nearly that to every lane that
runs the gate until the payload shape moves. **A number that is the same
for everybody is read once and then becomes wallpaper**, which is the
habituation `T-167-s2`'s own doc comment warns about one level down
("a block that printed on every run would be a banner").

The number that would not go stale on the reader is THEIR OWN SPEND, and
`CheckReport` already carries both halves: `committed_bytes` is the room
the tree had when the graph was last regenerated and `fresh_bytes` is
what this working tree would write. Their difference at that same ref
was **530 bytes** — the cost of that lane's single edited file, and
exactly the sentence a lane needs to see: *this working tree spends 530
of the 6,865.* On a CURRENT graph the two are equal and the clause
should simply not print, which is also the state where it would say
nothing useful.

Cheap, and inside one fence: `check::headroom_alarm` in
`app/src-tauri/crates/nputer-index/src/check.rs`, one conditional clause,
no new symbol, no change to `budget_line` or `floor_line` (whose format
strings are pinned from `tools/e2e` by symbol — see
`health-bands.spec.ts` — and must stay put). The positive control has a
shape already: the same tree at two budgets is `T-167-s2`'s control, and
this one wants the same tree at two COMMITTED graphs.

## Acceptance criteria

- WHERE a fresh index differs in size from the committed graph AND the
  alarm is armed, THE block SHALL name the difference as this working
  tree's own spend, beside the room left.
- WHERE the committed graph is current, THE block SHALL NOT print a
  zero-byte spend — a clause that says "0" every time is the wallpaper
  this card is against.
- THE change SHALL carry a positive control: one tree, two committed
  graphs, the printed spend differing by exactly the difference between
  them (`A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`).
- THE change SHALL NOT move `budget_line` or `floor_line`, and SHALL NOT
  change the exit code — `T-167-s2`'s notes carry the reason for both.

## Implementation notes

## Verdicts
