---
id: T-088-s2
title: The dogfood test TITLES carry counts nothing pins, and three went stale in one commit
status: parked
suggested_by: executor claude-opus-5 @T-088
---

> **PARKED at the eighth triage, 2026-08-25, WITH A TRIGGER THAT FIRES
> OFTEN.** Real, small, and genuinely un-pinnable by construction: an
> `it()` title is a string literal in an argument position, so no mutant
> reds it and no drill can find it — which is exactly why it is parked
> rather than rejected. **UNPARK WITH THE NEXT CARD THAT MOVES A DOGFOOD
> FIXTURE**, which is any card declaring a component or adding a file the
> indexer walks; that lane is already reconciling the assertions beside
> these titles and is the cheapest possible moment to fix them. It is NOT
> promoted now because a card whose whole content is "correct four
> strings" would cost a full lane ceremony for a change any passing lane
> makes for free. T-010's Rust extraction, in verification as this was
> written, moves the file counts again and is the likely first trigger.

Declaring C-15 at T-088 moved eight assertions across six bodies. It
also falsified **four `it()` TITLES**, none of which any assertion
checks:

- `"the live registry is the eleven known components"` → twelve
- `"THE FINDINGS: ten undeclared dependencies, three declared-only
  components, no unclaimed territory"` → four declared-only
- `"the full relation table: 13 confirmed, 10 undeclared, 9 planned"`
  → 10 planned
- `"draws the full 32-edge relation table"` (map-dogfood) → 33

All four were corrected by hand in that commit **because the executor
happened to read them**, not because anything failed. Poison-drill every
assertion in those bodies and the titles stay wrong at exit 0: a title
is a string literal in an argument position, so no mutant can red it and
no drill can find it. This is `SHAPE FIVE` — *"a printed count is not a
pin"* — one rung further out than the catalogued instance, because a
title is not even printed by the code under test.

**Why it matters more here than the wording suggests.** These titles are
the first thing a failure report shows and the first thing the next
executor reads when deriving its own moved set. A body announcing
*"eleven known components"* while asserting twelve tells a reader
deriving a delta the exact opposite of the truth — and this fixture's
whole maintenance contract is that the NEXT lane derives its moved set
from the fixture BEFORE running anything. A stale title is a green,
authoritative, wrong input to that derivation.

**Two honest arms, and the first is cheap.**

(a) **Stop putting derivable counts in titles.** Rewrite the four to
name the PROPERTY (*"the live registry is exactly the declared set"*,
*"the full relation table, row for row"*) and let the arrays carry the
numbers, which is where a drill can reach them. Pure rename, zero risk,
and it removes the class rather than the instances.

(b) **Pin them.** A body that reads its own `expect.getState().
currentTestName`, parses the digits out and checks them against the
derived values would red on a stale title — but it couples every count
to a regex over prose and buys a new way to fail for a cosmetic defect.

**Recommend (a).** Fence `[app-shell, lib-parser]` — the four titles sit
in `app/test/architecture-dogfood.test.ts`,
`app/test/map-dogfood-render.test.tsx`, and the same habit should be
checked in `lib/parser/test/smoke.test.ts` (whose own title is
property-shaped already and is the model to copy). It moves no assertion
and no fixture value, so it owes only the suites those files live in.
