---
id: T-203
title: A GREEN-TOKEN PRE-PUSH GATE — commits stay fast and pushes become unlyable, because three commits landed tonight after a gate that had already failed
feature: F-06
milestone: 4
priority: 1
size: M
status: planned
blocked_by: [T-202]
touches: [.claude, tools/e2e]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); the instances are this seat's own, measured the same night"
builder:
review: independent
---

**`docs/CONVENTIONS.md` ALREADY SAYS IT**: *"an edit script's success is a
GATE, not a step — never chain a commit after one."* **This seat broke
that three times in one night**, twice with `&&` and once in a guarded
chain, each time reading the exit **after** the commit had already run.
The rule was written down, read, and quoted by the seat that broke it.

## What it cost, and none of it was theoretical

- A commit landed on a **`census exit=1`** — STATE stale against a newer
  record, twice.
- A commit landed on a **parser red** — a card stamped out of `suggested`
  without its four required fields.
- **`blocked_by: [T-190]` naming a card that did not exist reached CI and
  redded it**, because the gate that would have named the failing body
  was never asked.

`T-167-s8` established the shape that works: **a guard that refuses a
PUSH**, keyed on a command's own exit, with no escape hatch — and its
blind verifier then proved the guard fires against a real bare remote.
This card extends that shape from one gate to all of them.

## What to build

**`T-202`'s runner writes a VERDICT TOKEN**: the tree hash it ran
against, plus a per-suite exit code and body count.

**Pre-push refuses when the token is MISSING, STALE (its tree hash is not
HEAD's) or RED.** And it **unconditionally runs the cheap checks** that
cost seconds and caught real defects tonight:

- the **parser parse-check on changed cards** — this is the exact check
  that would have refused `blocked_by: [T-190]` and the missing-fields
  stamp, both of which reached a push;
- **record-newer-than-STATE** — `docs-protocol.md` rule 4, which fired
  twice tonight *after* the commit.

**Commits stay fast; pushes become unlyable.** That division is the
design: the cost of a full battery is paid once per push rather than once
per commit, and the token is what makes "I ran the gates" a fact rather
than a claim.

## What a fix decides

1. **Where the token lives.** It must not be committable — a token in the
   tree can be stale-but-matching after an amend. A runtime path like
   `.nputer/` (already gitignored by a file the tool writes) is the
   obvious candidate; argue it.
2. **What "stale" means against an amend or a rebase.** The tree hash is
   the honest key; say what happens when a commit is amended after a
   green run.
3. **Whether the cheap checks can ever be skipped.** `T-167-s8` shipped
   its guard with **no escape hatch** and argued why. Follow that unless
   there is a measured reason not to.

## Acceptance criteria

- A push SHALL be REFUSED when the verdict token is missing, when its
  tree hash does not match `HEAD`, or when any suite it records is red.
- THE cheap checks SHALL run on every push regardless of the token, and a
  body SHALL prove each one refuses its own measured instance —
  **an unresolvable `blocked_by`, and a record newer than STATE**.
- **A POSITIVE CONTROL SHALL prove a clean push is ALLOWED**; a guard
  that refuses everything is indistinguishable from one that works, which
  is `T-199`'s lesson and this project's most expensive one.
- THE guard SHALL be proved to FIRE end to end — a stale token, a real
  push attempt, and the remote ref asserted UNCHANGED — following
  `T-167-s8`'s three-arm shape rather than asserting a decision function's
  return value.
- **This card is GUARD-CLASS**: `review: independent` is owed and SHALL
  be set at dispatch. The one time this seat missed that, the verifier it
  should have had found three mutants that would have refused every push
  in the repository.
- Verification: headless.

## Read beside

`T-202` (which produces the token — this card is blocked on it),
`T-167-s8` (the guard whose shape this extends, landed and verified), and
`docs/CONVENTIONS.md`'s edit-script-is-a-gate bullet, which this card
makes mechanical.

## `review: independent` SET AT FILING, not left for a dispatch to remember

**A pre-push gate — its job is to REFUSE a push.**

`method/tasks/TASK-FORMAT.md` requires this field **set at dispatch** for
a guard-class card. This seat has now missed that three times running —
including on the card immediately after a verifier assigned *"flagged so
the next dispatch sets it"* as a correction.

**So it is set here, at filing, where the judgement is already being
made.** `T-204`'s refusal 3 will make it mechanical; until that lands,
setting it early is the only thing between the rule and a fourth miss.
