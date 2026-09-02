---
id: T-205-s7
title: brief.spec.ts:479 reads the live worktree list TWICE and joins the two answers, so a sibling seat's `git worktree add` landing between them reds a body on a tree nobody touched
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s8, class sweep at ca64d7c, 2026-09-02
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The second survivor of `T-205-s8`'s class sweep.

    tools/e2e/tests/brief.spec.ts:479
      "the LIVE worktree list is parsed, and every derived lane is on a task branch"

Line 480 spends one `git worktree list --porcelain` on `entries`; line
483 spends a **second** one on `lanes`. Line 487 then joins them:

    expect(entries.some((e) => e.path === lane.path && e.branch === lane.branch)).toBe(true);

**THE TWO READS ARE NOT THE SAME FACT.** A sibling seat's `git worktree
add` landing between them puts a lane in the second answer that is
absent from the first, and the `some(...)` is false — a red on a tree
nobody touched, attributed to whichever diff was under test. The window
is small and the failure is a phantom intermittent, which is the worse
half: `docs/CONVENTIONS.md`'s own gate-runner bullet already names that
class. (The direction is one-way: a worktree REMOVED between the reads
is harmless.)

The cheap fix is one read spent twice; the fuller one is the fixture
`T-205-s8` built next door. Either satisfies the property, which is
about the parser and not about this machine.

## The fence overlaps a live lane today

`T-239` holds `tools/e2e/tests/brief.spec.ts` as of 2026-09-02
(`task/T-239-dispatch-ritual-one-arm`). This card cannot be armed until
that lane lands or its fence narrows — lane-protocol rule five. It is
filed now because the finding was measured now, not because it can start
now.

## Acceptance criteria

- THE body SHALL derive `entries` and `lanes` from ONE reading of the
  worktree list, so the join is a claim about the parser rather than
  about two moments.
- WHERE a second reading is genuinely wanted, the body SHALL say which
  read each side came from and SHALL NOT assert an equality across them.
- A POSITIVE CONTROL SHALL show the join still fires — a porcelain whose
  derived lane is absent from the parsed entries reds the body.

## Read beside

`tools/e2e/tests/session-economics.spec.ts` at the `T-205-s8` tip,
`T-205-s6` (the sibling survivor, in `dispatch-order.spec.ts`), and
`docs/CONVENTIONS.md`'s SCRATCH RULE / PORT RULE family.
