---
id: T-136
title: A planned card naming a blocker that is already done fails the gate — the data stops drifting, because prose about clearing it did not bind the seat that wrote the prose
feature: F-02
milestone: 4
priority: 4
size: S
status: building
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human's requirement, 2026-08-26**: `blocked_by` should be accurate
**everywhere**, and **especially for the architect session**, so dispatch
decisions always rest on a precise view of priority and execution order.

**This card is the cheapest layer of that: stop the stored data from
drifting.** `T-137` is the derivation layer; `T-111` is the board.

## The measurement

`blocked_by:` is written when a card is drafted and **nothing ever clears
it when the blocker lands.** Measured at `f9350b1`: **46 stale entries
repo-wide**, four of them on PLANNED cards where they suppressed dispatch
— including **`T-065`, the card this project's own app displays as
`WORST BLOCKER`**, which @human had asked about directly.

**The decay is one-directional.** Nothing ever adds a false blocker; time
only removes true ones. So the field drifts monotonically toward
over-blocking — **the failure that costs throughput rather than
correctness, and therefore the one nobody notices.**

## Why a gate and not a rule

**The architect hit this FIVE times in one session** — `T-127`, `T-135`,
`T-134`, `T-111`, `T-131` — clearing each by hand at dispatch **without
noticing it was a pattern**, and filed the finding partway through and
then hit it twice more. **A rule would have been read by the person who
had just written it and would not have changed the next dispatch.**

That is `T-131`'s item 3 as @human adopted it: **a convention that could
be a gate should be a gate.** This is the cheapest available instance.

## Acceptance criteria

- **A CARD WHOSE `status:` IS `planned` OR `parked` AND WHOSE `blocked_by`
  NAMES AN ID THAT IS `done` SHALL FAIL**, naming the card, the blocker,
  and the blocker's status. **A `done` card carrying a stale blocker SHALL
  NOT fail** — that is history and there are dozens of them.
- **THE PIN SHALL FAIL AGAINST A TREE THAT CONTAINS THE DEFECT**, and
  since the four live instances were cleared by hand at `15a963d`, **the
  fixture supplies its own** (`T-080-s1`: a check that cannot fail today
  is not a check). **State whether the live tree is clean at your ref** —
  it should be, and if it is not, that is news.
- **A POSITIVE CONTROL SHALL PROVE THE ORDINARY CASE PASSES**: a planned
  card blocked by an open card must not fail. A gate that reddens on every
  blocker is worse than none.
- **THE THREE STATES SHALL NOT BE FOLDED.** Blocked by an **open** card;
  blocked by a card that **does not exist**; and `parked`. A dangling
  blocker is a defect in the card rather than a reason to wait — **but
  `T-111`'s criteria currently rule the opposite way for the board, and
  that disagreement SHALL be resolved here or routed, not defaulted.**
- **THE CHECK SHALL MATCH A CARD BY `^id:`, NEVER BY FILENAME GLOB.**
  `T-111-*.md` matches its own suggestion files; that cost the architect a
  wrong read while dispatching this very subject.
- **IT SHALL NOT CLEAR THE FIELD.** The declaration — *this work needs
  that work first* — is a human's statement and is not derivable. **Only
  whether it still BINDS is derivable.** This card reports; it does not
  edit cards.

Verification: headless — `npm test` from `tools/e2e/`, exit read
**unpiped from `$?`**, count derived (Playwright **does** print
`Running N tests`; cross-check it against the body count). **POISON DRILL
on every new assertion**, one side only, producer mutated and never the
assertion, read back with `git diff` before its run, restores proved
per-path by sha256, detached worktree **OUTSIDE the repository at a SHORT
path**. **A drill has lied three times this session and every one was an
exit read through a pipe** — positively control every guard. **Uniqueness
of kill SHALL be measured against the whole suite.** DOCS GATE fires on
this card; run it directly, never through `xargs`, and note **exit 3 is
GATE COULD NOT RUN**. **Ports are machine-wide while lane-protocol rule 4
partitions by CHECKOUT (`T-132-s6`)** — explicit port, re-probed
immediately before binding. @human: none.
