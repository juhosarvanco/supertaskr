---
id: T-240
title: The `git worktree list` a session reads is a defaulted machine-scoped surface and docs/CONVENTIONS.md names no rule for it — the SCRATCH RULE, the PORT RULE and the E2E PORT rule are the same class with three spellings and this is the fourth
feature: F-06
milestone: 4
size: S
priority: 4
status: planned
suggested_by: executor claude-opus-5@subagent @T-205-s8, 2026-09-02
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`docs/CONVENTIONS.md` already carries three rules that exist for one
reason — **a defaulted machine-scoped surface is a collision waiting for
a second seat**: the SCRATCH RULE, the PORT RULE and the E2E PORT rule.
`docs/STATE.md` names them as one family in as many words ("E2E PORT AND
SCRATCH FILENAMES ARE CONVENTIONS' RULES, beside the PORT RULE — one
family, derived per lane, never defaulted").

`git worktree list` is the same class and has **no rule**. It belongs to
the machine, no ref controls it, and this project runs concurrent lanes
by design — so anything that reads it and asserts on the answer reds for
whoever measures last, and the red is attributed to their diff.

**MEASURED, and it has already been paid for.** At `c08f260` the e2e
suite was 619 bodies GREEN at 2026-09-02T10:39:44Z; at the SAME ref
about four and a half hours later it read 2 failed / 617 passed with
nothing committed in between. The whole difference was a peer seat's
`task/T-216-s8` worktree, cut before its card reached the board. Four
verifier benches paid a red e2e leg for it in one sitting, each at a base
older than a sibling lane, and each red arrived attributed to the diff
under test. `T-205-s8` fixed the two bodies; `T-205-s6` and `T-205-s7`
carry the two survivors of its sweep. None of them stops the next reader
of that surface from defaulting it.

## Acceptance criteria

- THE conventions document SHALL carry the worktree list beside the
  SCRATCH RULE / PORT RULE / E2E PORT family, naming it as the same class
  and saying what a reader of it owes: derive the list per run from a
  surface the ref controls, or disclose rather than assert.
- THE rule SHALL name the measurement it rests on, so a reader meets the
  reason and not only the sentence — `docs/CONVENTIONS.md`'s own
  standing shape.
- THE rule SHALL NOT ask any suite to weaken `brief.mjs`'s refusal of a
  lane whose fence cannot be read: that guard is `T-209`'s and is
  correct.

## Read beside

`docs/CONVENTIONS.md`'s SCRATCH RULE, PORT RULE and E2E PORT bullets;
`T-205-s8` (the measurement and the first fix), `T-205-s6`, `T-205-s7`,
and `T-209`.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-205-s8 merge (e68c36e)

The architect seat. The worktree list is the fourth machine-scoped
surface (with the scratch rule, the port rule and the e2e port); three
lanes measured it today (T-205-s8, T-202-s1's margin guard, T-239's
skew). One sentence in CONVENTIONS' lane bullet naming it beside the
other three; rides the next CONVENTIONS lane (T-216-s6 or T-228-s2,
behind T-239).
