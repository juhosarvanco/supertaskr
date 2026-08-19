---
id: T-051-s3
title: The new default window is 27px short of the design's own interview canvas — 867 reproduces it, 840 ships
status: parked
suggested_by: executor claude-opus-5 @T-051
---

T-051 shipped `1280×840` because that is what its card names. The
card supplies arithmetic for the WIDTH only; the height has none, so
T-051 derived one from the same authority the width comes from — the
design bundle — and it lands 27px higher:

    design's interview canvas   800   (`nputer app.dc.html:508`, min-height:800px)
    + the app's own header       67   (measured, constant at every width)
    ──────────────────────────────
      window inner height       867

Measured directly: at **1280×867 the split is exactly 800px tall** — the
design's canvas, reproduced. At **1280×840 it is 773**. The design draws
the interview in a window frame whose title bar is OS chrome, which a
Tauri window puts outside the inner size, and our app spends 67px inside
the webview on the header the design draws in that title bar.

**840 was shipped anyway, and the reason is the display rather than the
design.** 867 inner plus a macOS title bar (~28px) wants ~895px of
screen, against the ~875px a 1440×900 panel leaves under the menu bar —
it would not fit the very display the design is drawn at. 840 + ~28 ≈ 868
does. **That title-bar figure is the one number in T-051 that was not
measured**: it is OS chrome, and this pipeline has no screen control, so
it is an estimate from general knowledge rather than an observation.

So this is a genuine open judgment, not a defect: **@human, on your own
display, does the interview want its full 800px canvas?** If yes the
change is one number in `app/src-tauri/tauri.conf.json`'s window block
(`height: 840` → `867`) and a re-run of the boot gate; T-051's lane spec
re-measures at whatever the manifest declares and needs no edit. If the
window then does not fit your panel, that is the answer and this file
closes as rejected with the measurement recorded.

Worth resolving in the same pass as T-051's other @human item, which is
the same question asked the other way: whether the **1024×700 floor**
is too big to tuck the app into a corner of the screen.

---

**PARKED 2026-08-19 (fourth triage) — @human, HELD, NOT RANKED FOR
DISPATCH.** This changes what the human sees when they open the app, so
it follows the T-052 precedent: anything that changes how the human
works is held for them.

The measurement stands and is not in question: the design's interview
canvas is 800 plus the app's own 67px header equals **867 inner**, and
at 1280x867 the split is exactly 800 tall against 773 at the shipped
840. **The one number that was never measured is the OS title bar** —
this pipeline has no screen control, so ~28px is general knowledge
rather than an observation, and it is the number that decides whether
867 fits a 1440x900 panel at all.

**UNPARK WHEN** @human answers on their own display: does the interview
want its full 800px canvas? If yes the change is one number in the
manifest's window block and a boot-gate re-run; the lane re-measures
whatever the manifest declares and needs no edit. If the window then
does not fit the panel, that is the answer and this file closes as
rejected with the measurement recorded.

Answer it together with **T-062-s1**, which is the same question from
the other side (the genesis screen wants 1082 against a 700 floor), and
with T-051's own reserved @human item on whether the 1024x700 floor is
too big to tuck the app into a corner of the screen. **T-075** asserts
the invariant the current floor rests on and names moving the floor as
the alternative arm that belongs to @human, not to a card.
