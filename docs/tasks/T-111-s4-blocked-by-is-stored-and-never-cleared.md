---
id: T-111-s4
title: blocked_by is stored, never cleared, and four planned cards are dispatchable in fact while blocked on paper — one of them is the card the app itself calls the worst blocker
status: suggested
suggested_by: architect claude-opus-5
---

**Measured at `f9350b1` while dispatching T-111 itself.**

`blocked_by:` is written when a card is drafted and **nothing ever
clears it when the blocker lands**. The board therefore understates what
is dispatchable, and it understates it silently — a card reads
`blocked_by: [T-104]` forever, and a reader has to open T-104 to learn it
merged.

## The census

**46 stale blocker entries repo-wide.** Most sit on `done` cards, where
they are harmless history. **Four sit on PLANNED cards, where they
suppress dispatch:**

| card | priority | blocked on | actual status |
|---|---|---|---|
| `T-131` | 5 | `T-104` | **done** |
| `T-015` | 8 | `T-012` | **done** |
| `T-059` | 19 | `T-033` | **done** |
| `T-065` | 30 | `T-057`, `T-058` | **both done** |

**`T-065` is the card this project's own app has displayed as `WORST
BLOCKER`** — @human asked about it directly. It has been dispatchable for
an unknown but long stretch and nothing said so.

**The architect hit this five times in one session** before measuring it:
`T-127` carried `[T-033]`, `T-135` carried `[T-132]`, `T-134` carried
`[T-132]`, `T-111` carried `[T-110]`, and `T-131` carries `[T-104]`. Each
was cleared by hand at dispatch, one at a time, **without anyone noticing
it was a pattern** — which is the tell that it belongs to the board rather
than to any card.

## Why this is T-111's subject exactly

T-111's title is *"the board says what is dispatchable, and WHY the rest
are not."* **A stored `blocked_by:` is the wrong source for that
question.** Blockedness is derivable — a card is blocked iff some named
blocker is not `done` — and the derivation cannot go stale.

**`T-057` is the standing rule**: two implementations of one fact will
disagree, and here the disagreement is one-directional and always in the
same direction. **Nothing ever adds a false blocker; time only removes
true ones.** So the stored field decays monotonically toward
over-blocking, which is the failure that costs throughput rather than
correctness — and therefore the failure nobody notices.

## What this does NOT argue

**It does not argue for deleting `blocked_by:`.** The field is the
DECLARATION — a human's statement that this work needs that work first —
and that is not derivable from anything. **What is derivable is whether
the declaration is still BINDING.**

So the shape is the one this project has reached twice already: **keep the
declared fact, derive the live answer, and never store the second.**
`T-135`'s dependents ruling took the same shape for the same reason, and
`T-133` built the general machine for it.

## The trap for whoever takes it

**A card blocked by a card that does not exist is a different state from
one blocked by a card still open**, and both differ from `parked`. The
census above found `missing` as a real value while walking. **Do not fold
the three into "blocked"** — a dangling blocker is a defect in the card,
not a reason to wait, and the board should say which it is.

**And the derivation must not read `status:` alone.** A card is `building`
while its lane is live and `planned` again if a lane lapses; the lane list
takes precedence over the board's stamp when the two disagree, which is
`method/roles/executor.md` row 5's existing ruling and the reason
`verifying` reads as 0 on a board with live verifications.
