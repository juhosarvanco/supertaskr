---
id: T-053
title: Zero-padding aliases every id space, not just components — lift the slot check
feature: F-02
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-030-s3 (architect, 2026-08-17), promoted after surviving two
triages as "the correctness-of-record item". The suggestion file is
removed in the same commit as this card.

T-030 shipped `aliased-id`: two different component id strings sharing
one numeric value (`C-05` / `C-005`) are one registry slot spelled
twice, and "first by component id order wins" then resolves by string
comparison — an arbitrary winner nobody declared. **The criterion
scoped it to components, and that is the only id space it checks.**

The same aliasing is legal and unchecked in the two id spaces the board
actually renders. Reproduced on T-030's own branch:

    docs/ROADMAP.md      ## Backbone
                         - F-1:  One — a
                         - F-01: One padded — b
    docs/tasks/T-01-a.md    id: T-01
    docs/tasks/T-001-b.md   id: T-001,  blocked_by: [T-01]

    → tasks: T-001 T-01 · features: F-1 F-01 · zero issues

Nothing rejects the pair: tasks are `^T-\d+(?:-s\d+)?$` (`task.ts:176`),
features are `F-\d+`, `duplicate-id` compares strings exactly and stays
silent, and the filename rule is satisfied because each file encodes
its own declared spelling.

**Why this stopped being hypothetical last night.** The suggestion
closed by calling it "a trap for the next hand-numbered task or an
interview-written backbone, not a live bug" — every id in this tree is
three digits, so nothing collides today. T-027 then shipped the
interview: a planner CLI now writes `docs/ROADMAP.md` and
`docs/tasks/*.md` into a fresh project, and T-028 is building the act
where those task files land live. **An interview-written backbone is
now a real path, and the writer is a language model choosing its own
id spellings.** `F-1` and `F-01` in one generated backbone is not an
exotic input; it is a plausible Tuesday. The trap goes live exactly
when the product starts working.

The harms, in increasing order:

- The board renders TWO columns for what a human reads as one feature,
  and a task naming the other spelling dangles or lands in the wrong
  column.
- `blocked_by: [T-01]` resolves to whichever spelling matches, so a
  dependency silently means something other than its author meant —
  the failure the cycle rule was added to make loud, arriving by a
  different door. **T-034 now renders that same `blocked_by` graph as
  dependency waves, a critical path and a worst blocker**, so a
  silently re-pointing edge is a wrong picture in a pane a human reads
  for planning.

## Acceptance criteria
- THE numeric-slot grouping SHALL exist ONCE as a shared helper, lifted
  out of `parseComponentSet` (`lib/parser/src/component.ts:335–355`)
  rather than copied, and SHALL be applied to component ids, task ids
  and backbone feature ids. The component behaviour SHALL be unchanged
  — T-030's existing pins (`lib/parser/test/component.test.ts:395`,
  `:428`, `:443`, `:470`) SHALL pass untouched, and any edit to them is
  a regression to explain, not a fixture to reconcile.
- THE slot key SHALL strip leading zeros AS TEXT, never through
  `Number()`, preserving T-030's stated reason: two genuinely different
  ids past 2^53 must not collide into a false alias because floating
  point ran out of room. Pin it with ids long enough to prove it.
- WHEN a task id space contains numerically equal ids spelled
  differently THE parser SHALL report one issue for the slot, in
  comparator order, keeping BOTH records. **The `-sN` suffix is part of
  the identity and its digits alias too**: `T-01` / `T-001` alias;
  `T-01-s1` / `T-001-s1` alias; `T-01-s01` / `T-01-s1` alias; and
  `T-01` / `T-01-s1` SHALL NOT alias. All four cases pinned — the
  suffix is the subtlety most likely to be got wrong, and a
  suffix-blind key silently merges a suggestion with its parent task.
- WHEN the roadmap backbone declares numerically equal feature ids
  spelled differently THE parser SHALL report one issue for the slot.
  Both declarations live in ONE file, so a `files` array reading
  `["docs/ROADMAP.md", "docs/ROADMAP.md"]` locates nothing: the issue
  SHALL carry enough to find the two declarations (both id spellings
  named in the message at minimum, a line reference if the roadmap
  parser already tracks one). A diagnostic a human cannot act on is
  not a diagnostic.
- THE issue SHALL say which id space it is about. `aliased-id` today
  hardcodes "component ids" in its message; three spaces need three
  messages, and a consumer SHALL be able to tell them apart without
  parsing prose. Whether that is a new field on the union member or
  three kinds is the builder's call — **record the choice and its
  reason in notes**. There are currently NO consumers of `aliased-id`
  outside `lib/parser/**` and its own tests (verified by `git grep`),
  so this is free to shape now and will not be later.
- THE app SHALL surface the new issues through the existing count and
  list with NO app-side change — assert that by running the app suite
  unmodified, and if any app file needs editing, STOP: that means a
  consumer switches exhaustively on issue kind, which contradicts the
  premise above and wants saying out loud.

Verification: headless — vitest in `lib/parser` over fixtures for all
three id spaces including the four suffix cases and the 2^53 case, plus
a live re-parse of this repo proving **zero new issues on the real tree**
(every id here is three digits, so a green tree is the control; a new
issue on real data means the slot key is too eager).

## Implementation notes

## Verdicts
