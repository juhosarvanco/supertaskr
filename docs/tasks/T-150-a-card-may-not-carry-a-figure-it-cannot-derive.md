---
id: T-150
title: Briefs derive every figure and refuse to emit one without provenance — cards do not, and two of three cards on 2026-08-26 were rejected on a number their author typed from memory
feature: F-06
milestone: 4
priority: 1
size: M
status: building
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

## The measurement

The night of 2026-08-26 spent roughly **2.34M subagent tokens** moving
three cards. **Two were rejected. Both on a figure the author typed from
memory into a card or a brief.**

- **`T-141`** — its first sentence said "this repository's **second**
  D2". It is the third. The whole narrative rested on the count, and one
  paragraph named the count as its own warrant. Rejected.
- **`T-137`** — its dispatch brief carried an inverted premise about a
  positive control ("a control reding under nine arms" for "one arm
  reding nine bodies"), plus a stale blast-radius figure.

Each rejection bought a full rework **and** a full re-verification:
**~1.2M tokens, half the night's spend, on two wrong numbers.**

## The asymmetry that makes this fixable

**`T-133` already solved this for briefs.** `dispatch-brief.mjs` builds
output as RECORDS, not strings; **a `value` record without provenance
THROWS at render**, and a `note` record may not contain a digit at all.
The only way a figure leaves that tool is attached to its ref or its
reading time.

**Cards were never brought under that rule.** They are hand-written
markdown, and every count, byte figure, percentage and commit-age in
them is typed. A verifier then spends 200k tokens disproving one.

> The project already decided that **the derived answer must be cheaper
> than the remembered one**. It built the tool for the dispatching seat
> and stopped there.

## The shape of a fix, not the fix

1. **A lint that flags a bare figure in a card body** and requires an
   adjacent provenance marker — a ref, a command, or an explicit
   `MEASURED AT` stamp. Cheapest. **But see the caution: this is the arm
   most likely to be gamed by adding a marker without re-deriving.**
2. **A `--card` mode on the existing brief tool**, so an author asks for
   the figures instead of recalling them: board counts, fence contention,
   file counts, byte sizes, ranges. **The infrastructure exists and this
   is arm 1 of `T-133` pointed one seat over.**
3. **Require the figure-bearing sentence to name its command**, the way
   `STATE.md`'s derivable sections now do. Prose, and `T-131` argues
   prose does not bind.

**Arm 2 has the precedent and the machinery.** Arm 1 without arm 2 tells
authors they are wrong without making it cheaper to be right, which is
the failure mode `T-133`'s own header names.

## What this card must NOT become

**Not a ban on figures.** This project's cards are good precisely because
they carry measurements. The target is the UNDERIVED figure, not the
figure.

**Not a rule that only applies to new cards.** The two rejections came
from a card's opening sentence and a brief's body — both authored by the
dispatching seat, in a hurry, from memory. A guard the author can skip
when rushed is a guard for the case that never fails.

## One caution for whoever takes it

Per `T-142`, **prove the check can fail.** Plant a wrong figure in a
scratch card, watch it RED, correct it, watch it GREEN. A lint over
markdown that silently matches nothing is this project's most-repeated
defect — **five instances on 2026-08-26 alone**, three of them by the
architect, one while auditing that very habit.
