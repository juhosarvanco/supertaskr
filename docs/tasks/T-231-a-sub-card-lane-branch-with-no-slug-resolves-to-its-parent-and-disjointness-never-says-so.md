---
id: T-231
title: A sub-card lane branch with no trailing slug resolves to its PARENT card — the fence write refuses and says so, but the DISJOINTNESS computation silently attributes that lane's fence to the wrong card
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
suggested_by: "the architect/integrator seat, 2026-09-01 — met while dispatching T-216-s1, measured rather than predicted"
blocked_by: []
touches: [tools/e2e/scripts/lane-fence.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/lane-fence.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**MET AT A DISPATCH, NOT REASONED ABOUT.** Cutting `T-216-s1`'s lane, the
obvious branch name `task/T-216-s1` was refused by `--write-fence` with
*"whose card is T-216, and the fence asked for is T-216-s1's."* The
refusal is correct and cost one recut. **The card is not about that
refusal — it is about the same function used somewhere that does not
refuse.**

## The measurement

`laneSpellings` derives its matcher from `docs/CONVENTIONS.md`'s published
spelling `task/T-NNN-<slug>`. Driven at `4551292`:

    regex: /^refs\/heads\/task\/T-(\d+(?:-s\d+)?)-.+$/

    T-216      <- refs/heads/task/T-216-s1
    T-216-s1   <- refs/heads/task/T-216-s1-stale-checkout-catcher
    T-216      <- refs/heads/task/T-216-the-guard
    T-025-s4   <- refs/heads/task/T-025-s4-allowlist

**The sub-card group `(?:-s\d+)?` is OPTIONAL and the slug tail `-.+` is
MANDATORY.** So a sub-card branch carrying no slug has its `-s1` eaten by
the tail, and `laneIdOf` returns the PARENT's id. The spelling that works
and the spelling that silently means something else differ by whether a
human bothered to add a description.

## Why the refusal is not the fix

`laneIdOf` has two call sites in `tools/e2e/scripts/lane-fence.mjs`:

- **`buildLaneFence`** compares `laneId !== id` and THROWS. Caught. Loud.
- **`laneDisjointness`** maps it over every live lane from
  `git worktree list --porcelain` to decide which card owns which fence.
  **There is no id to compare against there — the branch IS the source of
  truth — so a mis-parse cannot be detected and produces no message.**

That second path is what `T-209`'s dispatch guard rests on. A live lane on
`task/T-216-s1` has its fence attributed to `T-216`, and every
disjointness verdict computed against it is answering about a different
card. **Rule 5 says disjointness is computed over expanded path sets
rather than asserted over tokens; this is the set being computed for the
wrong owner**, which the rule does not cover because it never contemplated
the owner being wrong.

## What makes it worth a card rather than a convention note

**The failure is invisible in exactly the direction that matters.** A
dispatcher who mis-names a branch learns about it immediately IF it is
writing a fence, and never learns about it if the lane is merely LIVE
while somebody else dispatches. The two seats are usually different
sessions, so the seat that made the error is not the seat that gets the
wrong answer.

**And it is one character of tolerance away from being safe**: an anchored
sub-card group, or a refusal when a branch's parsed id names a card that
is not on the board while a sub-card of it is.

## Acceptance criteria

- WHERE a lane branch spells a sub-card id with no trailing slug
  (`task/T-NNN-sM`), `laneIdOf` SHALL either return that sub-card id or
  return undefined. It SHALL NOT return the parent's id.
- `laneDisjointness` SHALL be shown to refuse, or to report a named
  finding, when a live lane's branch cannot be resolved to a card on the
  board — a wrong attribution SHALL NOT be reachable silently.
- A body SHALL demonstrate the CURRENT defect before the fix: a live lane
  on a slugless sub-card branch, and disjointness attributing its fence to
  the parent. **A test that only exercises the well-formed spelling is
  degenerate against this card and SHALL be treated as absent.**
- The published spelling in `docs/CONVENTIONS.md` SHALL be reconciled with
  whatever the matcher accepts — the pattern string it prints in its own
  refusal (`task/T-NNN-<slug>`) does not mention sub-cards at all, while
  the regex has handled them since it was written.
- Verification: headless.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Fence widened at the seat to `[tools/e2e, docs/CONVENTIONS.md]`**:
criterion 4 reconciles the published lane spelling and that file was
outside the fence — a card whose criterion and fence disagree is a
defective card (TASK-FORMAT), and this is the repair.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
