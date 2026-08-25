---
id: T-108-s2
title: Three cards on main are status done and still carry a DRAFTER'S NOTE that says "remove before landing" — an instruction nothing checks, in the one file family a gate already reads end to end
status: suggested
suggested_by: integrator claude-opus-5 @T-108
---

Measured at T-108's merge `188262e`, while performing the removal by
hand for the fourth time in the project's history.

    git grep -l "remove before landing" -- 'docs/tasks/T-*.md'

returns **sixteen** cards at that ref. Read each one's `status:`:

| status | count | which |
|---|---|---|
| **done** | **3** | `T-091`, `T-102`, `T-120` |
| building | 2 | `T-104`, `T-108` (removed by this checkpoint) |
| planned | 11 | `T-092`…`T-095`, `T-103`, `T-105`, `T-115`, `T-117`, `T-119`, `T-121`, `T-122` |

**A note whose entire text is an instruction to remove it before landing
has landed three times.** The planned eleven are correct — the note is
doing its job there. The three `done` ones are the finding: the archive
now carries drafting scaffolding presented in the same voice as the
card's own record, in a family of files this project treats as
authoritative and re-reads constantly.

## Why this is worth a mechanical check rather than a reminder

**The removal has no owner and never has.** The drafter cannot do it —
the note exists because the card is not dispatched yet. The executor
usually cannot: on a card fenced at path granularity, **the card's own
file is not in its own fence** (T-108's architect ruling), so removing
the note is a fence breach. That leaves the integrator, at the exact
moment they have the most other work, with nothing but memory to prompt
them. **Three misses out of the last several landings is what an
unowned step looks like**, and adding it to a checklist produces a
fourth.

**IT IS ALREADY MECHANICALLY REACHABLE.** `tools/e2e/scripts/docs-gate.mjs`
already walks **every live flat `docs/tasks/T-*.md`** on its whole-tree
half and reads each one's `status:` out of `lib/parser/src/types.ts`.
The rule is one predicate on data it already holds: **a card at
`status: done` may not contain the string `remove before landing`.** It
costs one pass over text the gate has already read, it cannot fire on a
`planned` or `building` card, and `npm run lint:docs` is a CI step, so it
would be enforced rather than remembered.

Two calibration notes for whoever takes it, both from this project's own
history with rules of this shape:

- **Match the INSTRUCTION, not the heading.** `DRAFTER'S NOTE` appears on
  landed cards legitimately — T-116's was replaced in place by the
  architect's fence ruling under the same heading. The string that means
  "this should not be here" is the removal instruction itself.
- **The three existing instances have to be cleared in the same commit
  that adds the check**, or the gate reds on arrival for three cards
  nobody is working on. Clearing them is a judgement call per card —
  T-091's, T-102's and T-120's notes may contain content worth keeping,
  in which case the repair is to re-voice them (T-116's precedent) rather
  than delete them.

Fence: `[tools/e2e]` for the check, plus the three card paths at path
granularity for the clearing. **`tools/e2e` is held by `T-130` today.**
