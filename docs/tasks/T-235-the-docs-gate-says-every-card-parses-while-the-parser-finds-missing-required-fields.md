---
id: T-235
title: The docs gate reports "0 frontmatter issue(s), every live task card's frontmatter parses" over a tree where the parser's own smoke test finds missing REQUIRED fields — and a promotion is what creates them
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect/integrator seat, 2026-09-01 — met by reddening main's own merge commit, with the docs gate green over the same tree minutes earlier"
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**TWO READERS OF THE SAME FRONTMATTER DISAGREED, AND THE ONE THAT RUNS
FIRST SAID EVERYTHING WAS FINE.** Measured on one tree, minutes apart:

    docs-gate.mjs   "0 frontmatter issue(s) in the live tree"
                    "every live task card's frontmatter parses,
                     with a legal status."

    lib/parser smoke test — SAME TREE
                    2 issues, kind: missing-field, field: size

The docs gate is the cheap gate a seat runs before committing. The parser
smoke test is in a suite. **So the false green arrives first**, and the
red arrives inside a battery on a merge commit.

## The trigger is a PROMOTION, which is why nobody meets this early

`lib/parser/src/task.ts`:

    const isMinimal = status === 'suggested' || status === 'parked';
    const requirePlacement = statusKnown && !isMinimal;

`feature`, `milestone`, `priority` and `size` are required **only above
the minimal statuses.** So a card can be filed, reviewed and live for
weeks without `size`, and **acquire an error the moment a triage stamp
promotes it** — without that stamp touching any field but `status`.

Live census at the time of the incident: 119 sizeless cards, of which
111 `parked` and 8 `suggested`. **Every one of them is one status stamp
away from reddening the tree**, and the gate a triaging seat would run
says nothing.

## The seat's own error, recorded because it is the instructive half

Asked *"do all cards carry `size`?"*, got 119 that do not, and concluded
the field was optional. **The right question was "is `size` required for
the status I am ABOUT TO WRITE?"** — validating against the CURRENT tree
rather than the tree the write creates. The docs gate then confirmed the
wrong answer, which is the whole reason this is a card rather than a
lesson.

## Acceptance criteria

- `docs-gate.mjs`'s frontmatter check SHALL report the same issue set the
  parser's own task validation reports for a given tree, or SHALL state
  in its own output which classes it does NOT cover. **A gate that says
  "every live task card's frontmatter parses" SHALL NOT be able to say it
  over a tree where the parser disagrees.**
- A body SHALL demonstrate the disagreement before the fix: one card at a
  non-minimal status with a placement field absent, the docs gate green,
  the parser reporting `missing-field`. **A body that only checks a card
  the two readers already agree on is degenerate against this card and
  SHALL be treated as absent.**
- WHERE the two readers are reconciled by sharing one implementation, the
  shared path SHALL be the parser's, not a second copy of its rules —
  `T-057`'s one-implementation argument applies directly.
- The promotion hazard SHALL be surfaced where a triaging seat meets it:
  a stamp raising a card out of `suggested`/`parked` SHALL be refused, or
  warned, when the placement fields the new status requires are absent.
- Verification: headless.
