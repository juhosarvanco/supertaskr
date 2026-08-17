---
title: The interview's answer box loses focus after every send, so answering twice in a row needs the mouse
status: suggested
suggested_by: executor claude-opus-5 @T-027
---

MEASURED, not suspected. `tools/e2e/tests/interview.spec.ts` asserts it
directly:

    await expect(page.getByTestId("interview-input")).not.toBeFocused();

after a real ⏎ send, and the spec has to `.click()` the box again before
it can type the next answer.

**The mechanism.** `sendAnswer` (`app/src/genesis/interview-source.ts`)
sets its single-flight latch SYNCHRONOUSLY — it has to, because that is
the only thing that bounds an ⏎ burst — so React renders at least one
frame in which the textarea carries `disabled`. Disabling a focused
element blurs it, per the HTML spec, and nothing gives the focus back
when the attribute comes off. The turn that follows re-enables the box
but leaves the caret nowhere.

**Why it matters more here than on an ordinary form.** This screen is a
conversation of seven questions. The user's whole interaction loop is
*read the question, type, press ⏎* — and every single iteration of that
loop currently requires reaching for the mouse in between. It is also
worst for the users the interview is FOR: a keyboard-driven solo builder
running an agent CLI.

**Costed fixes, cheapest first.**

1. **Refocus after the flight lands** — an effect on the busy flag's
   falling edge that calls `box.current?.focus()`. Three lines. The risk
   worth naming: it steals focus if the user deliberately tabbed away
   mid-turn, so it should refocus only if the box had focus when the
   send began (`document.activeElement === box.current` recorded at
   submit time). Still small.
2. **Do not disable the box at all; disable only the button** and keep
   the ⏎ handler's re-check as the guard. Honest — the latch, not the
   attribute, was always the real guard (the burst test proves it) — and
   it lets the user type their next answer while the planner is still
   thinking, which is arguably better than making them wait. Changes
   what "in flight" LOOKS like, so it wants a look from @human.
3. **A `readOnly` box instead of a `disabled` one** while in flight.
   `readOnly` does not blur. Keeps the visual disabled treatment only if
   the class list is adjusted to match, which is the fiddly part.

**Not urgent, and not a criterion failure**: criterion 4 asks the input
to "disable while a turn is in flight", which it does. This is the
consequence of doing that literally.

Home: T-027's own lane (`app/src/genesis/`), or T-029 if it is folded
into the wider interview-polish pass.
