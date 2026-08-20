---
id: T-074-s5
title: T-027's plan section still teaches W-641, and calls it measured — the same self-contradiction T-074 fixed in T-063
status: suggested
suggested_by: executor claude-opus-5 @T-074
---

T-074's preamble names ONE self-contradicting card — *"T-063's verdict
section records the 870-character correction; its implementation notes
two hundred lines earlier still say 887"* — and makes it criterion 4.
**There is a second, and it is the origin of the very comment criterion 1
corrects.**

`docs/tasks/T-027-interview-split-view.md` says all three of these:

- **Plan section**: *"Degradation, **measured rather than guessed**. …
  640 chat + 1px rule leaves the lens W−641: at 1440 → 799 (the design's
  own number), at 1280 → 639, at 1024 → 383, at 800 → 159."*
- **Implementation notes**: *"THE LENS GETS W−640, NOT W−641. The plan
  computed 799 at 1440 by adding the 1px rule to the 640. The app's box
  model is border-box, so the rule is INSIDE the 640 … 800 at 1440, 640
  at 1280, 384 at 1024."*
- **Verdict**: *"The lens is W−640 — 384 / 640 / 800 — which confirms the
  notes' correction of the plan's W−641."*

Two corrections and the wrong original, in one file, with the wrong one
first and labelled **measured**. It was not measured; it was computed,
and computed wrongly. That label is what makes this worse than T-063's
case rather than merely equal to it: a reader who stops at the plan
section has been told the number came from the app.

**IT IS THE SOURCE, NOT A COPY.** The falsified arithmetic reached
`GenesisScreen.tsx`'s comment from here (T-074 corrected the comment),
and `tools/e2e/tests/interview.spec.ts` and
`tools/e2e/tests/window-contract.spec.ts` both quote "W-641" explicitly
as the thing that was wrong (correctly — those two are fine). So after
T-074 the ONLY live site still teaching the wrong number is the plan
section of the card that invented it.

**WHY IT WAS NOT FIXED HERE.** T-074's criterion 1 names
`GenesisScreen.tsx`'s comment and the DESIGN attribution, and stops
there; criterion 4 names T-063 by id. Editing a third card's body is
outside the criteria, and the executor role says a suggestion never
expands scope. The path is free — `docs/tasks/T-027-interview-split-
view.md` is in neither live sibling's diff (T-072's ten paths and
T-084's zero, checked) — so this is scope, not a fence.

**THE FIX IS THE ONE T-074 ALREADY PERFORMED TWICE**: correct in place
with the date and the derivation, keep the qualitative claims, and add
the design half T-027 never had — the design of record does not say 799
either. Measured at `e83ee1d` over the
`data-screen-label="Interview"` artboard of
`docs/design/claudedesign_handoff/nputer app.dc.html`: chat rect 640 /
client 639, right half **798**, because the artboard is a 1440px
border-box frame with 1px window chrome; the same ratio in the app's
chrome-less viewport gives **800**. 799 is neither, and is what you get
by subtracting the 1px rule twice.
