---
id: T-033-s10
title: The registry still holds ONE declared cycle after T-033 — C-08 and C-09 declare each other, and it predates the no-cycles rule by nine days
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

@human ruled on 2026-08-25 that **this registry holds no cycles**, and
T-033 was built to that rule: it adds none, it declines to declare
`C-10 -> C-14` (routed to `T-125`), and it dropped `C-12 -> C-05` partly
because keeping it would have left `C-05 <-> C-12` standing.

**One cycle survives and it is nobody's new mistake.** Derived at
`ad5a0df`, before this card changed anything:

    C-08 depends_on: [C-06, C-09, C-11]
    C-09 depends_on: [C-06, C-08, C-11]

Both directions are **declared AND observed** — `C-08 -> C-09` confirmed
with 6 file edges, `C-09 -> C-08` confirmed with 3 — so it is a real
two-way dependency in the source, not a drawing artifact. It has been
there since T-012's §2 amendments (2026-08-15), nine days before the rule
that now forbids it.

## WHY T-033 DID NOT FIX IT

The card's own ruling is explicit that the fix for a REAL cycle is an
extraction and that the extraction is a separate card: *"T-033 SHALL
declare no cycle and SHALL NOT perform the extraction"*, with `C-10 ->
C-14` handed to `T-125` for exactly that reason. This pair is the same
shape and deserves the same treatment. Doing it here would also have been
out of fence: it needs `app/src/components/board/**` and
`app/src/lib/board-model.ts`, which are `app-board`, held live by T-111
when this lane ran.

## WHAT IT ACTUALLY IS, so a fixer starts from facts

- `C-08 -> C-09`: the board opens cards into the detail panel — `Board
  .tsx` and its siblings reach `TaskDetailPanel.tsx`, `panel-dismissal.ts`
  and `task-detail.ts`.
- `C-09 -> C-08`: the panel reaches back into `board-model.ts` for the
  model it renders (`task-detail.ts` imports from it — the same import
  `verdicts.ts` was split out of at T-017 to avoid a THIRD cycle).

That last detail is the useful one: **T-017 already performed this
extraction once, partially.** It moved the verdict classifier out of
`board-model.ts` into its own module *"to keep the dependency graph
acyclic"* and stopped there. The remaining coupling is the task-detail
model itself, and the sanctioned remedies are the two @human's rule
names — invert the dependency, or extract a third component both sides
depend on. C-16 exists now and is a natural home for shared pure model
code, which makes this cheaper than it was yesterday.

**Suggested:** a `T-125`-shaped card fenced `[app-board, docs/architecture
/components/]`. Not urgent — nothing is broken — but the rule is only
worth what its exceptions cost, and an unlisted exception is worth less
than a listed one.
