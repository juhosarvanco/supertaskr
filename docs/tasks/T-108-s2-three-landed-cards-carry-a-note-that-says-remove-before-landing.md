---
id: T-108-s2
title: A note whose entire text is an instruction to remove it before landing has now landed on six cards, and the gate that already reads every card's status could refuse it
feature: F-01
milestone: 4
priority: 10
size: S
status: planned
blocked_by: []
touches: [tools/e2e, docs/tasks/T-102-the-discriminator-declines-the-evidence-that-cannot-be-forged.md, docs/tasks/T-104-the-method-snapshot-card-five-rulings-that-live-outside-method.md, docs/tasks/T-120-the-regression-pin-reads-both-scripts-and-any-spelling.md]
suggested_by: integrator claude-opus-5 @T-108
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29, with the census re-derived
rather than quoted — and it has moved in the direction that argues for
the card.** At filing, three `done` cards carried the note. At this base
the string `remove before landing` appears in six `done` cards, and
reading each occurrence separates them into the two groups the check
must tell apart:

- **three carry a LIVE DRAFTER'S NOTE** near the top of the card —
  `T-102` (line 18), `T-104` (line 36), `T-120` (line 18);
- **three merely WRITE ABOUT one** — `T-091`, `T-092` and `T-108` quote
  the phrase inside findings and verdicts, and `T-092`'s occurrence is
  the sentence recording that its own note was removed.

**That split IS the design constraint**, and it is why this is a card and
not a one-line grep: a gate matching the string alone reds on three cards
whose only offence is describing the defect. The card's own calibration
note says the same thing from the other side — match the INSTRUCTION, not
the heading, because `DRAFTER'S NOTE` also appears on landed cards
legitimately (T-116's was re-voiced in place under the same heading).

**The removal has no owner and never has.** The drafter cannot do it —
the note exists because the card is not dispatched. The executor usually
cannot: on a card fenced at path granularity, the card's own file is not
in its own fence (T-108's architect ruling). That leaves the integrator,
at the moment they have the most other work, with nothing but memory.
**Six misses is what an unowned step looks like**, and adding it to a
checklist produces a seventh.

## Acceptance criteria

- WHEN the DOCS GATE walks the live task cards THE gate SHALL refuse a
  card at `status: done` that carries a drafter's note instructing its
  own removal, naming the file. It already walks every flat
  `docs/tasks/T-*.md` and already reads each `status:` from the parser's
  own vocabulary, so this is one predicate over data it holds.
- THE predicate SHALL NOT fire on a card that only writes ABOUT such a
  note. The lane SHALL demonstrate this with a planted pair — one card
  carrying a note, one quoting the phrase in prose — and both rows SHALL
  be pinned in one body. Running only the positive row cannot tell a
  check from a string search.
- THE predicate SHALL NOT fire on `planned` or `building` cards, where
  the note is doing its job.
- WHEN the check lands THE three live instances SHALL be cleared in the
  SAME commit, or the gate reds on arrival for cards nobody is working
  on. Clearing is a judgement per card: a note may carry content worth
  keeping, in which case the repair is to re-voice it (T-116's
  precedent), never to delete it.
- THE census in this card's own body SHALL be re-derived at the lane's
  ref rather than transcribed — it has already moved once between filing
  and triage.

## The record, kept verbatim

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

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
