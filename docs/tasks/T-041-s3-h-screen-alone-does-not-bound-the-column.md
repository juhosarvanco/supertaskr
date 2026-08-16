---
id: T-041-s3
title: h-screen alone does not bound the column — the missing link is min-h-0 on the GenesisScreen section
status: suggested
suggested_by: verifier claude-opus-5 @T-041
---

T-041-s1 measured the right problem and recorded the wrong remedy. Its
note 1 says:

> Changing `min-h-screen` to `h-screen` on the two divs is the whole
> mechanical fix

That is **measurably false**, and it matters because s1 hands the
sentence to T-027 as the composition's starting point. I made exactly
that edit and measured the result in the served bundle.

**The drill.** `app/src/App.tsx:278` `flex min-h-screen` → `flex
h-screen`, and `:291` `flex min-h-screen min-w-0 flex-1 flex-col` →
`flex h-screen min-w-0 flex-1 flex-col`. Nothing else. Lane geometry
1280×720, T-024's complete `streak` tree through the genesis screen:

    mainClass                 "flex h-screen"      (the edit is live)
    main computed height       720px               (it IS bounded)
    main computed min-height   0px
    inner column height        720px               (bounded too)
    viewport                   720
    documentElement.scrollHeight 1110  <- the PAGE STILL SCROLLS
    pane's overflow-y-auto     796/796  <- STILL never engages

Both columns are bounded to the viewport and the page overflows by the
same 390px it did before. Bounding a box whose `overflow` is `visible`
does not stop its content from spilling out of it and contributing to
the document's scroll height; it only stops the box from growing.

**The missing link, isolated.** Between the bounded column and the slot
sits `app/src/components/shell/GenesisScreen.tsx:37`:

    className="flex flex-1 flex-col gap-6 px-10 py-9"

A flex item's default is `min-height: auto`, so that section refuses to
shrink below its content no matter how bounded its parent is. The slot
below it already does this correctly (`:64` carries `flex min-h-0 flex-1
flex-col overflow-hidden`, with T-037's comment explaining why). Adding
`min-h-0` to the section — one class, on top of the two `h-screen`
flips — flips both halves at once:

    documentElement.scrollHeight  720   <- the page no longer scrolls
    pane's overflow-y-auto        796/406  <- the pane's region engages

So the mechanical fix is **three class edits, not two**, and the third
is the one that actually does the work: the two `h-screen` flips alone
change nothing a user would see.

**Why file this rather than fix it.** The scope ruling in s1 stands —
this is T-027's composition call, and `min-h-screen` on the shell column
is shared with the board, which grows on purpose today. What changes is
the instruction T-027 inherits. Following s1's note 1 literally would
produce a change that reds
`tools/e2e/tests/genesis-screen.spec.ts`'s tripwire at its FIRST
assertion (`columnMinHeight` becomes `0px`, not the viewport) while
leaving the page scrolling exactly as before — the worst outcome, where
the tripwire looks reconciled and the behaviour is unchanged.

**Reconciling the tripwire, correctly.** With all three edits, the
three-line block at `genesis-screen.spec.ts:219-228` becomes: keep
`overflowY === "auto"`; `columnMinHeight` is no longer the right
question (the column is `height`-bounded, so assert on height or drop
the line); `pageScroll` must EQUAL `viewport`; and `scrollHeight` must be
GREATER THAN `clientHeight`. Both inequalities flip, which is what s1
note 3 promised — it just needs the third edit to be true.
