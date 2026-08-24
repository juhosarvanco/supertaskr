---
id: T-110-s9
title: C-15's component file still says the TypeScript half joins, and after T-110's rebuild the join is Rust
status: suggested
suggested_by: executor claude-opus-5 @T-110-rebuild
---

`docs/architecture/components/C-15-dispatch.md` describes the component
as *"the Rust half READS those files and runs no subprocess, and the TS
half mirrors the typed lane list and joins it against the board."*

**The second clause stopped being true in T-110's rebuild, and the
reason is a fence rather than a preference.** T-110's first pass put
`classify`, `joinLanes`, `IN_FLIGHT_STATUSES` and `describeRefusal` in
`app/src/lib/dispatch-store.ts` and was REJECTED, because acceptance
criterion 4 requires *"a pin SHALL drive each"* of the four states and no
suite in this repository can reach that file: `app/vitest.config.ts`
collects `test/**` only, and both that config and `app/test/**` are
C-05's `app-shell`. Four one-side-only producer mutants survived
`npm run build` and `npm test` at exit 0. The join moved to
`app/src-tauri/src/dispatch/join.rs` — C-15's own path, inside the fence,
inside `cargo test` — and the TS half was reduced to the mirrored types
plus `hydrateJoin`, which builds the `Map` ADR-009 requires and decides
nothing.

**WHAT THE PARAGRAPH SHOULD SAY**, so a reader is not sent to the wrong
file: the Rust half reads the lanes AND joins them against the board, and
the TS half mirrors the typed answer and hydrates it into the `Map`s
ADR-009 requires. The rest of the file is unaffected — the two `paths:`
entries, the D2 provenance, the follower-first ruling, the ADR-009 and
ADR-012 claims and the zero-webview-grant claim all still hold exactly.

**Nothing else in the tree carries the stale split**, checked rather than
assumed: `docs/ARCHITECTURE.md` does not describe C-15's internal
division, and `docs/design/dispatch-technical-plan.md`'s D2 rules only
that C-15 is declared with those two paths — it never rules which half
does the joining, which is why the move was an executor's to make.

Fence: `[docs/architecture/components/]` — T-010's slug, HELD by a live
lane at T-110's rebuild, which is why this is routed instead of fixed.
It is prose only: the file's frontmatter, `paths:`, `depends_on:`,
`decisions:` and `touch_slugs:` do not move, so it changes no fixture in
`lib/parser/test/smoke.test.ts`, `app/test/architecture-dogfood.test.ts`
or `app/test/map-dogfood-render.test.tsx` — but the DOCS GATE fires on
it and owes those suites a run anyway.
