---
id: T-051-s1
title: The split's own comment still teaches W−641, and credits the design with a 799 it does not draw
status: suggested
suggested_by: executor claude-opus-5 @T-051
---

`app/src/components/shell/GenesisScreen.tsx:82-85` is the comment a
reader meets when they open the flagship screen, and it states the
arithmetic that T-027's verifier falsified:

    640px of chat plus the 1px rule leaves the lens W-641:
    at 1440 -> 799 (the design's own number), at 1280 -> 639, at
    1024 -> 383, at 800 -> 159.

Every one of those four numbers is one pixel low. The app is
**border-box**, so the 1px rule sits INSIDE the chat's 640 and the lens
gets **W−640** — 800 / 640 / 384 / 160. T-027's verifier measured this,
recorded it in that card's notes and in STATE.md ("The lens is W−640,
not W−641"), and re-measured it at six viewports; T-051 reproduced it
again at 1023/1024/1025/1279/1280/1440. The SOURCE comment was never
updated, so the falsified version is still the one a next reader learns,
and it is the version they will reason from when they next touch the
split. `interview.spec.ts:243-246` already carries the correction — the
two now contradict each other across the fence.

**And the design attribution is wrong too, which nobody has caught.**
The comment credits 799 to the design ("the design's own number"). The
design source says **800**: `docs/design/claudedesign_handoff/nputer
app.dc.html:15` sets `* { box-sizing: border-box }`, `:509` gives the
chat column `width:640px … border-right:1px solid #ededed`, and `:565`
gives the right half `flex:1` inside a `:500` frame of `width:1440px`.
So 1440 − 640 = 800, and the app has been reproducing the design exactly
all along. The plan's W−641 was not a deviation from the design; it was
the same border-box slip made one level further back, and the correction
at T-027 stopped short of the design and left "(the design's own
number)" standing.

T-051 could not fix it: its criterion 4 fences the change to
`tauri.conf.json`'s window block, "no frontend edit". This is a
comment-only change — four numbers and one parenthetical — plus the
matching line in T-027's plan body if that is worth keeping true.
