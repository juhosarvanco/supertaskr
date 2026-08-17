---
id: T-051-s6
title: T-028 will red T-051's window spec — the full streak tree renders the board half, not the lens
status: suggested
suggested_by: verifier claude-opus-5 @T-051
---

A merge hazard between two branches that were built concurrently on
**overlapping `touches`**, which TASK-FORMAT's parallelism guardrail
says never happens: T-051 declares `touches: [app-shell]`, T-028
declares `touches: [app-interview, app-shell]`, and both were cut from
`e41dd16`.

T-028 puts a switch in the slot T-051's new spec measures. On
`task/T-028-crescendo`, `GenesisScreen.tsx` gains

    const half = showsBoard(docs) ? "board" : "lens";
    …
    {half === "board" ? <BoardCrescendo … /> : <GenesisPane docs={docs} />}

inside `genesis-pane-slot`. T-028's own fixture comment states the
consequence for the fixture T-051 uses: *the full streak tree is a
finished plan, so it no longer renders the lens at all* — which is why
T-028 added `streakMidInterview` (the same tree minus `docs/tasks/`) and
moved `interview.spec.ts`'s lens specs onto it.

`tools/e2e/tests/window-contract.spec.ts` was not on T-028's branch, so
it was not reconciled. Its `genesis()` helper applies the FULL
`streakFixture(11, GENESIS_DIR)`, and two assertions then name a testid
that `BoardCrescendo` does not render:

    :206  expect(await reach(page, '[data-testid="genesis-artifact"]')).toBe("40/40")
    :318  expect(await reach(page, '[data-testid="genesis-artifact"]'), "genesis: last row").toBe("40/40")

`BoardCrescendo` renders `genesis-board`, `genesis-board-count`,
`genesis-complete`, `genesis-open-board`, `genesis-card-rain` — no
`genesis-artifact`. `reach` returns `"absent"` when the selector matches
nothing, so both cases red on a string mismatch rather than on anything
about the window.

Whichever branch merges second owns the reconcile. The shape is already
decided by T-028's precedent — point `window-contract.spec.ts`'s
`genesis()` at `streakMidInterview` so its subject stays the LENS, which
is what raised the window in the first place. The `reach` assertion is
the only thing that has to move; the frame, breakpoint and width
assertions are renderer-independent.

Worth saying separately: the two cards should not have been dispatched
in parallel. The guardrail exists for exactly this, and the cost here is
one reconcile rather than a wrong merge only because the collision is in
a test's fixture and not in the shipped screen.
