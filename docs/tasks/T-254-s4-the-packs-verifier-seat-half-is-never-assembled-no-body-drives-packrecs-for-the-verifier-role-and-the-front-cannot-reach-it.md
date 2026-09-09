---
id: T-254-s4
title: "The pack's verifier-seat half is never assembled: no body drives packRecs for role=verifier, and the front cannot reach that role at all, so half of \"the method files the seat's role names\" ships unexercised"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "T-254's verifier (phase 2), 2026-09-09, from a mutant that survived: a filter correct for the executor and wrong for the verifier passed all five new bodies"
blocked_by: [T-254]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
---

## What was noticed

T-254's criterion 1 asks the pack to carry *"the method files the seat's
ROLE names"*, and `packRecs` implements exactly that — it resolves
`methodNamed(ctx.roleMd, roleRel, ctx.root)` off whichever role file the
seat holds. Measured at `5dca625`, the two roles genuinely differ:

    executor  5 files, 129,027 bytes   interview/decomposition.md, lane-protocol.md,
                                       roles/orchestrator.md, roles/verifier.md,
                                       tasks/TASK-FORMAT.md
    verifier  3 files,  83,358 bytes   roles/executor.md, roles/orchestrator.md,
                                       tasks/TASK-FORMAT.md

**But nothing exercises the second row.** All five of T-254's new bodies
build their context with `context({ taskId })`, which defaults to the
executor, and the fifth body reads the two role files directly through
`roleText` rather than through an assembled pack. So the per-role half of
the criterion rests on reading the code.

The mutant that showed it, planted at the producer and read back from
`git diff`:

    const method = methodNamed(ctx.roleMd, roleRel, ctx.root)
      .filter((m) => m.rel !== "method/roles/executor.md");

That is a no-op for an executor seat — `executor.md` is self-excluded from
its own pack anyway — and silently drops `roles/executor.md` from a
verifier's pack, which is the one method file a verifier most needs. **All
five bodies passed.** A blunter mutant (hardcoding the executor's role
file for both roles) IS caught, but only incidentally: it reds the
empty-pack body because that body's fixture root has no
`method/roles/executor.md` to read, which is a missing file rather than
the property.

## And the front cannot reach the role either

`node tools/e2e/scripts/brief.mjs --task T-251 --role verifier --root .`
exits **3** — `dispatch-brief: found 0 tables headed # / The brief
carries / …` — because `method/roles/verifier.md` carries no contract
table. **This is pre-existing and not T-254's doing**: the same command
exits 3 at the base `6dabfca` too, and it is recorded here only so the
next seat does not mistake it for a regression this card introduced. It
does mean the verifier's pack cannot be inspected end to end today, which
is why the gap above went unnoticed.

## What would close it

A body that assembles the pack for `role: "verifier"` and asserts its
method-file lines are exactly what `methodNamed` reads off
`method/roles/verifier.md` — the same both-directions shape the executor
arm already has (`expect(named).toBe(method.length)`), which is what makes
the executor half mutation-tight. Whether the front should also serve a
verifier brief is a larger question and belongs to whoever owns the
contract table, not to this card.
