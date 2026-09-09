---
id: T-235
title: The docs gate reports "0 frontmatter issue(s), every live task card's frontmatter parses" over a tree where the parser's own smoke test finds missing REQUIRED fields — and a promotion is what creates them
feature: F-06
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the architect/integrator seat, 2026-09-01 — met by reddening main's own merge commit, with the docs gate green over the same tree minutes earlier"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts, lib/parser/src/task.ts]
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

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Fence widened at the seat to `[tools/e2e, lib/parser]`** so criterion
3's shared path — the parser's own validation — is reachable.

**SECOND MEASURED INSTANCE, 2026-09-02, at this seat.** Stamping three
suggestions `rejected` in place made four placement fields mandatory.
`docs-gate.mjs` over that tree printed *"every live task card's
frontmatter parses, with a legal status"* while lib/parser's smoke test
(`npx vitest run test/smoke.test.ts`) exited 1 with 12 `missing-field`
issues on exactly those three files; after `git mv` into rejected/ it
exited 0. Same two readers, same order, same false green first.

THIRD MEASURED INSTANCE, 2026-09-02 (T-216-s4's lane, reported by its executor): two findings filed as `T-216-s4-s1` and `T-216-s4-s2` took `npx vitest run` from lib/parser and `npm test` from app/ RED on a commit whose whole diff was markdown, because the parser accepts ONE suffix level; `docs-gate.mjs` over the same tree answered *"every live task card's frontmatter parses, with a legal status"*. A third rule the gate does not read — the id's shape — and the same false green first. The fix on the card SHALL cover id shape beside the placement fields, or say it does not.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
