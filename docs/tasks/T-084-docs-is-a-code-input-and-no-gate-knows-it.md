---
id: T-084
title: A docs-only change fires neither standing gate and can still red a suite — `docs/` is a code input and the triggers exclude it by construction
feature: F-06
milestone: 4
priority: 42
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**Both standing gate triggers exclude `docs/` deliberately, and both
are right to. The gap is that nothing else covers it, so a class of
change exists that is gated by nothing and can break a suite.**

- **GRAPH REGEN** fires on `.ts/.tsx/.js/.jsx` **outside `docs/`**.
- **BOOT GATE** fires on `app/src/**`, `app/src-tauri/**` or either
  manifest.

A commit touching only `docs/tasks/*.md` matches neither. The integrator
correctly reports "docs-only, neither fires" and moves on. **But
`docs/` IS an input to the app suite**, measured:
`app/test/architecture-dogfood.test.ts:1020` does
`readdirSync(join(ROOT, "docs/tasks"))` and reads **every** card off the
real tree; `map-dogfood-render.test.tsx` does the same. These are
dogfood tests by design — the app is proved against the repository it
lives in — so this is not a mistake to undo.

## Two observed instances, neither predicted by the card that hit it

1. **2026-08-18 — a title beginning with a backtick.** A YAML reserved
   indicator made two cards unparseable. Nothing errored: the board
   simply got shorter, and it surfaced three layers away as
   `Expected "60" / Received "62"` in four scroll-containment bodies.
2. **2026-08-19 — `status: closed`.** T-081's verifier filed
   `T-081-s7` with a status outside the parser's eight-name vocabulary
   (`suggested | planned | building | verifying | rejected | merging |
   done | parked`) — the only such value in the tree. `npm test` went
   **830/831, exit 1** on a commit whose entire diff was one markdown
   file. It was discovered by the NEXT executor, not by the verifier
   who wrote it, because a verdict measures the suites at the commit
   under review and then commits without re-measuring (`T-081-s9`).

**Both were found by accident, three layers from the cause, by someone
who was not looking for them.** That is the argument for this card: the
failure mode is not that the suite goes red, it is that the red arrives
detached from the edit and gets attributed to whatever lane is nearest.

## Acceptance criteria

- THE gate trigger set SHALL gain a rule covering the case, and the
  rule SHALL be derived from **what the suites actually read**, not
  from a suffix list. A trigger that says "any `docs/**`" over-fires on
  every checkpoint and will be ignored within a week; a trigger that
  names `docs/tasks/**` and `docs/architecture/**` is narrow and
  derivable. **The card SHALL state which it chose and why**, and SHALL
  enumerate the real-tree readers rather than assuming the two named
  here are all of them.
- **THE ENUMERATION SHALL BE MECHANICAL, NOT A LIST IN PROSE.** A
  hand-written list of dogfood readers is the defect T-058 and T-080
  spent two cards on. Derive the set from the tree — a reader is any
  body that resolves a path under `docs/` against the repository root
  rather than a fixture directory — and pin the derivation so a new
  dogfood reader added later is covered without anyone remembering.
- IF the rule fires THEN the remedy SHALL be stated as a command, not
  as "run the suites" — the integrator needs to know *which* suite
  answers this, and the answer today is `npm test` from `app/`, not the
  parser suite and not e2e.
- **A CARD WITH AN ILLEGAL `status:` SHALL FAIL LOUDLY AND NAME THE
  FILE.** Today it surfaces as a count mismatch in a dogfood body,
  which names neither the card nor the field. The parser already emits
  typed issues with near-miss hints for `blocked_by`; the same
  treatment SHALL apply to `status:`, and a pin SHALL drive a card with
  `status: closed` specifically, since that is the value that occurred.
- **THE PARSER'S VOCABULARY QUESTION SHALL BE ANSWERED, NOT DODGED.**
  `closed` was written by a verifier who wanted to record that a
  finding had been resolved elsewhere. The archive's existing moves are
  `Absorbs:` plus removal, `status: parked` with a trigger, or `git mv`
  to `rejected/`. Either `closed` is a real ninth status with a defined
  meaning, or the method SHALL say which existing move covers "resolved
  by other work" — and T-083's integrator has already ruled that
  disposition belongs to triage, which is evidence for the second arm.
  Do not add a status merely to make one file parse.
- IF a docs-only commit would red a suite THEN the trigger SHALL catch
  it **before** the merge, and a pin SHALL prove this by planting a
  card with an illegal status and requiring the trigger to fire on a
  diff containing no code file at all.
- THE existing `.nputerignore` behaviour SHALL be left alone and the
  card SHALL state why: the indexer ignoring `docs/` is correct and
  unrelated — `index --check` is not the gate that missed this.

Verification: headless — `npm test` from app/ with a planted illegal
card, `npx vitest run` from lib/parser for the typed issue and its
message, and the trigger derivation run against a synthetic docs-only
diff. Every new assertion poisoned and shown RED before restoration,
restorations proved by hash. **The mechanical enumeration SHALL be
poisoned by adding a dogfood reader and showing the derivation grows.**
@human: whether the new trigger's wording reads as narrow enough to be
obeyed.

## Implementation notes

## Verdicts
