---
id: T-112-s10
title: "`useAssembledBrief` has TWO staleness guards and neither is a guard: the in-flight `live` flag is held by no body in the whole app suite, and nothing checks that the answer is about the card it was asked for"
feature: F-04
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-112-s5, drills A-M4 and A-D5 at cbc24d4, 2026-09-09"
blocked_by: []
touches: [app/src/components/board/TaskDetailPanel.tsx, app/test/detail-assignment.test.tsx]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `cbc24d456370830360f4bd7ea3167d401ff1834a`

`T-112-s5` landed `useAssembledBrief` in
`app/src/components/board/TaskDetailPanel.tsx`. It carries **two**
mechanisms against one card's brief rendering under another card's
heading, and the poison drill separates them: one of them does the whole
job, the other is held by nothing, and a third question is not asked at
all.

**The one that works** is the answer's key. `setAnswer` stores
`{ taskId: askFor, outcome }`, and the hook returns `undefined` unless
`answer.taskId === askFor`. Mutant **A-M4b** deletes that comparison and
is killed by *"a re-targeted drawer never shows the PREVIOUS card's
brief"*. Mutant **A-M7** (the effect's dependency array narrowed to
`[]`) is killed by the same body. Both properties are pinned.

**The one nothing holds** is the effect cleanup's `live` flag. Mutant
**A-M4** — delete `if (!live) return;` from the resolution arm, one
line, one side —

    -        if (!live) return;
             setAnswer({

**survives the ENTIRE app suite**: `1168 passed | 2 failed (1170)`, the
same two dogfood pins that are red at the lane tip for an unrelated
reason. It survives because the answer key already decides every
OBSERVABLE outcome: a resolution that arrives for a card the drawer has
left is discarded at render time whether or not the write happened. The
flag's only remaining job is suppressing a state write on an unmounted
component, which React 18 does not complain about.

**So it is a bound nothing can poison, which is the class this very
feature's `T-112-s1` verdict named** (`app/src-tauri/src/lib.rs`, the
comment above `dispatch_brief_at`: *"A bound that nothing can poison is
a bound nothing keeps"*). Either pin it — a body that unmounts the drawer
mid-flight and asserts no write follows — or record in the code that it
is redundant with the key, so a later seat deleting it knows which it is
deleting.

## And the question that is never asked

The hook keys on the **request**. It never asks whether the **answer** is
about the card it requested. Mutant **A-D5** — the recording `invoke`
answers every request with `briefFor("T-999", …)` while the drawer has
`T-960` open, one side, in the fixture only —

    -    const calls = installTauri(async (taskId) =>
    -      ({ kind: "answered", outcome: briefFor(taskId, "…") }));
    +    const calls = installTauri(async () =>
    +      ({ kind: "answered", outcome: briefFor("T-999", "…") }));

**also survives the entire app suite.** The copyable block's
`data-task-id` is `panel.taskId`, derived from the MODEL, so the drawer
renders another card's brief text under the open card's id and every
assertion still passes.

**This is not reachable today and that is the reason to write it down
rather than to fix it in a hurry.** The assembler is in-process, the
request carries the id, and `brief_for_card` answers about the id it was
given. But the block's whole purpose is to be pasted into a fresh
session, and *"the worst possible failure for a block whose whole purpose
is to be pasted somewhere"* is this component's own phrasing for exactly
this. The wire already carries the card's id in
`BriefOutcomeView.assembled.brief.taskId`; comparing it to `askFor`
before accepting the answer is one condition, and a body asserting the
mismatch is refused is the drill that would hold it.

## Not a defect of `T-112-s5`

Neither is a criterion of that card's RULED section, and the observable
behaviour is correct at the tip. This is filed as the improvement it is,
never as a block.
