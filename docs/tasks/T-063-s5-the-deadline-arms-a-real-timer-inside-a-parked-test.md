---
title: T-063's deadline arms an 8-second real timer inside startup-screen.test.tsx's parked narrative
status: suggested
suggested_by: executor claude-opus-5 @T-063
---

A new and deliberate coupling, filed so it is on the record before it
ever fires rather than after.

`app/test/startup-screen.test.tsx` is ONE ordered narrative over one
long-lived React root, and its first act deliberately PARKS the
`docs-changed` subscribe: "the subscription is parked, not settled",
which is the state @human's screenshot was taken in. Describe 1 then
asserts `data-startup="waiting"`, the message
`"waiting for the first docs snapshot…"`, and the retry button reading
`"trying…"` while disabled. Describe 2 refuses the parked promise and
asserts the failure state.

**Before T-063 a parked subscribe could stay parked forever.** Now it
cannot: `runStartup` arms a real `setTimeout(…, STARTUP_DEADLINE_MS)`,
8 000 ms. If wall-clock time between the park and describe 2's
`refuseListen` ever exceeds 8 s, the deadline fires first, and describe
1's three assertions flip — `data-startup` becomes `"failed"`, the
message becomes the timeout copy, and the button becomes `"Try again"`,
enabled. The file would fail with three confusing reds that look like a
copy regression and are actually a clock.

**The margin today is large and was measured**: the whole file's test
time is ~52 ms, so the headroom is roughly 150×. This is a latent
flake, not a live one, and it is filed as such.

**Where it could bite.** A cold CI runner under load, a debugger session
paused mid-file, or a future test inserted between the park and the
refusal that does real work. The Linux CI run has never happened yet
(T-020's standing launch item), and this is one more thing whose first
evidence will arrive there.

**Closers, cheapest first.** (a) Fake timers for the parked stretch —
correct but awkward, because the file drives React with `act` and a real
root. (b) Refuse the parked promise in describe 1's own `afterAll`
instead of at the top of describe 2, shrinking the parked window to one
describe. (c) State the coupling in the file's header comment so a future
editor knows the window is bounded, and leave it. (d) Give the store a
test-only deadline override — rejected on sight: a production seam that
exists for a test is exactly what ADR-017's discipline is against.

(c) plus (b) is probably the whole answer and costs almost nothing.
Nobody should discover this by watching three copy assertions fail on a
CI runner.
