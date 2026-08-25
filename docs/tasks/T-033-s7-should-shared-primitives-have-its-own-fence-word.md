---
id: T-033-s7
title: C-16 borrows app-shell as its fence word, deliberately — whether shared primitives deserve their own is a real question and not this card's
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

C-16 shared primitives ships with `touch_slugs: [app-shell]`. That is a
CHOICE and it is the conservative one, argued in the component's own
prose: `app/src/components/ui/**`, `app/src/lib/utils.ts` and
`app/src/lib/verdicts.ts` were C-05's before T-033, so `app-shell` is
exactly the set of cards that could edit them yesterday. Giving C-16 a new
slug would have **moved a fence as a side effect of a registry tidy-up**,
and a fence that moves without a dispatch is the failure the slug table
exists to prevent (ARCHITECTURE's own paragraph on this).

**But the question it defers is real.** These three files are consumed by
four components — C-05, C-08, C-09, C-12 and C-13 all now declare
`depends_on: C-16` — and every card that wants to change a shared
primitive must take `app-shell`, which also carries C-05 (the whole shell,
`app/test/**`, three `.rs` files) and C-10 (the docs watcher). That is a
wide fence to hold in order to add a variant to `button.tsx`.

**The evidence that it matters is already in this repository**: `app-shell`
has been the contended fence all month. T-010's criterion 5 went unbuilt
because T-123 held it; T-033's own phase 1 routed two criteria for the
same reason; `T-088-s4`'s fix waited on it. Adding a fourth component to
the busiest slug is a cost worth naming even when the alternative is
worse.

**Options, for the architect (this is registry territory, ADR-004):**

- (a) **Leave it.** One fence fewer to reason about, and the primitives
  are small and change rarely. The status quo, and what shipped.
- (b) **`app-ui`, a new slug.** Cheap in code (one field), and it costs a
  line in ARCHITECTURE's slug paragraph plus the derived table beneath it.
  It would make "change a button" a narrow fence for the first time.
  Note the consequence to check first: any card whose `touches:` reads
  `[app-shell]` today and expects to edit `ui/**` would silently stop
  covering it — a fence NARROWING is as much a dispatch change as a
  widening.
- (c) **Fold it into `app-board`** — wrong, and named only to rule it out:
  C-13 (genesis) and C-05 (the rail) are consumers too, so the board slug
  would under-describe it exactly the way `app-shell` did.

Related and independent: `T-033-s5` (every app TEST lives under
`app-shell`, so `app-map`, `app-board`, `app-interview` and `app-agent`
are all source-only fences). If both are addressed together the slug map
is worth deriving once rather than twice — which is `T-104`/`T-111`'s
subject.
