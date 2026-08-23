---
id: T-088
title: The dispatch surface is a declared component before it is a directory
feature: F-04
milestone: 4
priority: 1
size: S
status: planned
blocked_by: []
touches: [docs/architecture/components/, lib-parser, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

F-04's first card, per `docs/design/dispatch-technical-plan.md` (D1
ruled by @human 2026-08-19: milestone 4; D2 taken: C-15 with slug
`app-dispatch`; the follower-first order ratified in
`docs/rooms/cockpit-or-mirror.md`).

Every dispatch card after this one wants a fence word. Without one they
all inherit `app-agent` — C-14, the genesis runner — and dispatch would
serialize against every genesis card for the life of the feature, for
no reason but a missing declaration.

T-008-s1 is the reason to be careful and the reason this is legitimate:
C-02/C-03/C-04 have no component files because no doc decides where
their code will live, so any `paths` glob would be invented. **This
pass decided C-15's location** (the plan's D2), so its paths are
decided rather than invented — the same footing C-07 was declared on
before its binary existed. The CLI's layout stays undeclared
(T-008-s1's re-park stands).

THE COST IS THE POINT OF THE CARD: declaring a component moves the
live-registry fixtures — the parser smoke test's exact id array,
`architecture-dogfood.test.ts`, and `map-dogfood-render.test.tsx`.
That omission cost T-024 a rejection and recurred at T-025's merge.
At T-077's checkpoint the moved set was FOUR assertions across THREE
bodies, surfaced by vitest one at a time — derive the full set before
running anything, and expect the hidden-second-assertion shape.

## Acceptance criteria

- THE registry SHALL gain `docs/architecture/components/C-15-dispatch.md`
  in the shape of C-13/C-14: `id`, `name`, `layer: app`, non-empty
  `paths`, `depends_on`, `decisions`, `status: auto`,
  `touch_slugs: [app-dispatch]`.
- THE declared `paths` SHALL name what the plan decided and no more —
  `app/src-tauri/src/dispatch/**` and `app/src/lib/dispatch-store.ts` —
  and the file SHALL state in prose that C-02/C-03/C-04 stay undeclared
  because their layout is undecided.
- **EVERY MOVED FIXTURE SHALL BE RECONCILED IN THIS COMMIT, corrected
  and never widened.** The set SHALL be DERIVED at the branch (the
  registry diff plus a dry regen forecast), not copied from this card —
  the counts in any prior card are stale by construction.
- THE graph SHALL be regenerated per the standing rule and
  `index --check` SHALL exit 0 at the checkpoint; the executor SHALL
  state whether GRAPH REGEN's trigger fires on this diff rather than
  assuming (a component .md alone does not match its suffix list).
- IF the declared `paths` match no file on disk THEN the derivation
  SHALL render C-15 as declared-only rather than reporting a defect,
  and a pin SHALL assert that — the intent layer exists to carry
  components that are not built yet.
- THE DOCS GATE will fire on `docs/architecture/components/` (five
  readers, three suites at the fifth-triage census) — the executor
  SHALL run what it owes and report the exits.

Verification: headless — parser, app and cargo suites plus
`index --check --root ../..`; every reconciled fixture poisoned back to
its old value and shown RED, restorations hash-proved at a commit.
@human: none.
