---
id: T-051-s9
title: The window's floor sits exactly ON the split's breakpoint — it survives every attack I could mount, on one invariant nothing asserts
status: suggested
suggested_by: verifier claude-opus-5 @T-051
---

`minWidth: 1024` is not above the breakpoint, it **is** the breakpoint.
Measured: `genesis-pane-slot` is hidden at 1022 and 1023 and visible at
1024 and 1025, and at exactly 1024 the lens is 384px. Zero pixels of
margin, by construction — T-051 argues, correctly, that this is the
cheapest honest floor. This card records the attacks that failed and the
one residual, so the next session does not have to re-derive them.

**What was attacked, headless, and did not break it:**

1. **A non-default root font size.** Dead, and for a reason worth
   writing down: media-query `rem` resolves against the INITIAL font
   size, not the root's computed one. Measured — with
   `html{font-size:32px}` applied, an element sized `64rem` becomes
   **2048px** while `matchMedia("(min-width: 64rem)")` stays **true** at
   a 1024px viewport. 14px, 17px and 18px roots all keep the lens
   rendering. A stylesheet cannot move this breakpoint.
   (Side effect: `window-manifest.test.ts:150`'s assertion is harmless
   but its stated rationale — "rem, so the root font size decides" — is
   not how media queries work.)
2. **A fractional viewport.** Chromium quantized every fractional width
   given to it: 1023.5, 1023.9 and 1023.99 all reported `innerWidth`
   1024 with the query matching. A fractional device scale factor would
   have to round the logical width below 1023.5 to bite.
3. **Device pixel ratio.** The four manifest numbers are inner/webview
   LOGICAL px — verified at the source: `WindowConfig.min_width` is
   documented "in logical pixels" (tauri-utils 2.9.3 `config.rs:1961`)
   and tauri-runtime-wry 2.11.4 `lib.rs:1015-1018` passes it to
   `with_min_inner_size(TaoLogicalSize::new(…))`, with `width`/`height`
   going to `with_inner_size` at `:1008-1011`. Every measurement in
   T-051 is in that same space. On macOS the scale factor is 1.0 or 2.0
   and the mapping is exact.

**The one residual, and it is not armed today.** On a platform whose
document scrollbar consumes layout width (classic scrollbars: Windows,
most Linux), a screen with a vertical document scrollbar at a 1024
window would evaluate the query against roughly 1009 and drop the lens
AT the declared minimum. I could not reproduce a layout-consuming
scrollbar in headless Chromium on macOS — `::-webkit-scrollbar` styling
and `scrollbar-width:auto` both left `innerWidth - clientWidth` at **0**
— so this is stated as a bound, not a measurement.

It is not reachable today because **no `lg:`-gated screen produces a
document scrollbar at the floor**. At 1024×700, measured: genesis
700/700 (natural 302), front door 700/700 (natural 475), no-plan card
700/700 (natural 663), map 700/700 (natural 692). Only the board scrolls
the document, and the board has no lens. The invariant the floor rests
on is therefore: *every screen that gates on `lg:` fits inside
minHeight*. Nothing asserts it, and T-051-s5 shows one of those natural
heights is already within 8px of the floor.

**Ways to close it, cheapest first:**

1. Assert the invariant: at the declared minimum, every screen that
   renders `genesis-pane-slot` has `documentElement.scrollHeight <=
   clientHeight`. One line beside the existing frame checks, and it is
   the property that actually keeps 1024 safe.
2. Or move the floor off the boundary — 1040 buys a classic scrollbar's
   width and costs nothing anyone will notice.
3. @human's call either way: the floor is the number that decides
   whether the app can be tucked into a corner of the screen, which is
   the same question T-051 already reserved for the display.
