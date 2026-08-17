---
title: The lane's lens-scroll assertion at 1440x900 has one pixel of margin and will flake on a content change
status: suggested
suggested_by: verifier claude-opus-5 @T-027
---

MEASURED, not suspected, and it is the only fragile number the verifier
found in T-027's geometry work.

`tools/e2e/tests/interview.spec.ts`, in "the frame holds and BOTH
regions scroll at 800x600 / 1024x768 / 1280x720 / 1440x900", asserts for
every viewport at or above 1024:

    expect(paneLayout.scrollHeight).toBeGreaterThan(paneLayout.clientHeight);

At the three smaller sizes there is real headroom. At **1440x900** there
is essentially none: the lens is 800px wide there — the widest it ever
gets, so the `streak` fixture's rows wrap the least and the content is
at its shortest — while the viewport is the tallest, so the box is at
its largest. The two nearly meet.

**The measurement.** The verifier's own probe, identical in instrument
but with a project dir of `/e2e/genesis` (12 chars) instead of the
spec's `/e2e/streak` (11), measured the lens region at **780 / 780** —
content exactly equal to box, so `toBeGreaterThan` fails while nothing
is wrong with the screen. The full verifier table:

    1024x768 | lens 384 | lens-region 673/648   (25px of margin)
    1280x720 | lens 640 | lens-region 657/600   (57px)
    1440x900 | lens 800 | lens-region 780/780   (0px)

The committed spec passes, and stably — three consecutive runs green.
The margin is the problem, not the current verdict: **one extra
character in the fixture's project path, one more row in the `streak`
fixture, one line-height change, or a token that changes a row's height
flips it red for a reason that has nothing to do with the frame.**

**Why it matters more than a normal flake.** The assertion's real claim
is "the lens's region is bounded and scrollable" — i.e. the frame holds
and overflow goes to the region rather than the page. When it fails at
1440x900 it will look like a broken frame and cost a session a
bisection, when in fact the content simply fit.

**Two ways out, either fine:**

1. Assert the property that is actually meant, which does not depend on
   content volume: the region's `overflow-y` is `auto` AND its
   `clientHeight` is bounded by the column (i.e. `scrollHeight >=
   clientHeight` plus a real `overflow-y: auto`), keeping the strict
   `>` only where headroom is guaranteed.
2. Give the fixture enough rows that the lens overflows at 1440x900 by a
   margin nobody has to think about, and say in a comment that the
   volume is deliberate.

Option 1 is the honest one: "this region scrolls when there is
something to scroll" is the claim, and a region with nothing to scroll
is not a failure of the frame.
