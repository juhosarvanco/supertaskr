---
id: T-041-s1
title: The genesis column is unbounded, so the PAGE scrolls and the pane's own scroll region never engages
status: suggested
suggested_by: executor claude-opus-5 @T-041
---

The open @human question from T-026/T-037 — "the shell's column is
`min-h-screen`, not `h-screen`, so at very short window heights the page
may grow before the pane's own scroll region engages" — is no longer a
suspicion. T-041's served-bundle probe MEASURED it, and it engages at an
ordinary window size, not only a short one.

Measured in the lane's Chromium at its 1280×720 geometry, with T-024's
complete `streak` tree loaded through the genesis screen
(tools/e2e/tests/genesis-screen.spec.ts):

    viewport (documentElement.clientHeight)   720
    document.documentElement.scrollHeight    1110   <- the PAGE scrolls
    <main> computed min-height               720px  (min-h-screen)
    <main> computed height                  1110px  (it grew)
    genesis-pane-slot height                  851
    genesis-pane height                       849
    pane's overflow-y-auto region:
      scrollHeight                            796
      clientHeight                            796   <- never engages

So with nine artifact rows the composition scrolls the whole window —
header, interview heading and all — instead of scrolling the pane while
the frame stays put. The mechanism T-037 built is correct and present
(`overflow-y: auto`, `min-h-0 flex-1` the whole way down); it simply
never gets asked, because nothing above it is bounded. `App.tsx:278` is
`className="flex min-h-screen"` and `:291` is `flex min-h-screen min-w-0
flex-1 flex-col`.

Three notes on scope, so this is triaged rather than hot-patched:

1. **It belongs to T-027's composition.** T-027 builds the LEFT half of
   this split view and will have to decide whether the interview screen
   is a bounded app frame (conversation and pane each scrolling inside
   it) or a growing page. Changing `min-h-screen` to `h-screen` on the
   two divs is the whole mechanical fix, but it is a decision about
   every screen the shell has, not only this one — the board's column
   uses the same class and grows on purpose today.
2. **The board is not obviously wrong to grow.** A long board scrolling
   the page is normal; a chat pane scrolling the page is not. Whichever
   way it goes, both should be stated once rather than inherited from
   whichever class was typed first.
3. **The probe already pins today's answer**, deliberately, with a
   comment naming this file: bounding the column reds two assertions in
   `the pane is laid out and painted by the real sheet, inside the slot`
   (`pageScroll > viewport` and `scrollHeight === clientHeight`), and
   the reconciliation is to flip both — page no longer scrolls, pane's
   region does. It is a tripwire on the current truth, not an
   endorsement of it.

The @human screenshot item can now be read as "confirm the measured
behaviour is unwanted" rather than "check whether it happens".
