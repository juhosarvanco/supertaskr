---
title: Record the component-registry pin inventory — declaring a component moves three fixtures, not two
status: suggested
suggested_by: verifier claude-opus-5 @T-024
---

T-024 is the first branch since T-008 to declare a new component, and
it reconciled two of the three fixtures that pin the live registry,
leaving `lib/parser`'s suite red (the rejection on this task). The
omission was not carelessness — nothing in the repo says how many pins
exist. The knowledge lives in a T-008 commit message ("live-tree smoke
pins the exact registry") and in a `lib/parser` test file that an
`app-interview` executor has no reason to open, behind a task fence
that says "zero diff under `lib/parser/**`".

The three pins, as of today:

- `lib/parser/test/smoke.test.ts` — "parses the dogfood component
  registry (T-008)": exact id array over the repo's live `docs/` tree.
- `app/test/architecture-dogfood.test.ts` — registry ids, declared
  count, findings, the whole relation table, drift/declaredOnly arrays.
- `app/test/map-dogfood-render.test.tsx` — rendered node count and
  edge count.

(`app/test/map-layout.test.ts` mentions C-ids too, but from synthetic
fixtures, not the live registry — it does not move.)

Suggested: write the inventory down where the next executor will meet
it — a `docs/CONVENTIONS.md § Gotchas` line ("declaring a component in
`docs/architecture/components/` moves three live-registry fixtures;
reconcile all three, changed never loosened"), and/or extend the
enumerated reconciliation block at `app/test/architecture-dogfood.test.ts:111`
to name its two siblings. Cheaper still, and complementary: make the
`lib/parser` pin derive its expectation from the directory listing
rather than a hand-written array, so it asserts *consistency with
`ARCHITECTURE.md`* — its actual intent — instead of a frozen count.
That last one is a judgment call for whoever owns C-06; the written
inventory is the minimum.

The same gap will recur in reverse when the graph is regenerated and
C-13's D3 clears (T-024-s2) — that suggestion's reverse-delta list
names two fixtures for the same reason.
