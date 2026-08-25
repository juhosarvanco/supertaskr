---
id: T-033-s5
title: app-map is a source-only fence — every app test lives under app-shell, so four slugs can change code they cannot test
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

Derived at `25a9e2c` while ruling T-033's fence, and general enough to
outlive that card.

**Every test the app package runs lives in `app/test/**`** — 49 entries,
and `find app/src -name "*.test.*"` returns nothing. `app/vitest.config
.ts` says so in one line: `include: ["test/**/*.test.{ts,tsx}"]`.
**`app/test/**` is claimed by C-05**, whose `touch_slugs:` is
`[app-shell]`.

The consequence is mechanical. Read each component's `touch_slugs:` (the
authority ARCHITECTURE names over its own signpost prose) and every slug
whose component owns TypeScript under `app/src/**` owns source with no
test of its own:

| slug | component | source it owns | where its tests live |
|---|---|---|---|
| `app-map` | C-12 | `app/src/architecture/**`, `app/src/lib/architecture/**` | `app/test/` — `app-shell` |
| `app-board` | C-08, C-09, C-11 | board, panel, tokens | `app/test/` — `app-shell` |
| `app-interview` | C-13 | `app/src/genesis/**` | `app/test/` — `app-shell` |
| `app-agent` | C-14 | `app/src/lib/agent-store.ts` (+ Rust, which has its own in-crate tests) | `app/test/` — `app-shell` |

So a card fenced `[app-map]` — T-033's own third fence word — can change
the derivation engine and the map renderer and **cannot add, change or
even reconcile a single assertion about them**. The Rust side does not
have this problem: `app/src-tauri/src/**` bodies carry `#[cfg(test)]`
inline, so `crate-index`, `app-shell` and `app-agent` all reach their own
Rust tests.

**This has been paid for at least twice already and read as something
else each time.** T-010's criterion 5 was verified with its second clause
NOT MET because the two dogfood fixtures sat in a held `app-shell`
(`T-010-s2`). T-033's criterion 2 arm (a) asks for parser, derivation and
renderer changes *"each a small additive change with tests"* — three
in-fence edits and one out-of-fence obligation. In both cases the lane
looked like a fence COLLISION when the real shape is that one slug owns
every app test in the repository.

**Suggested — options, not a pick, since this is registry territory:**

- (a) **Record it and stop being surprised**: a CONVENTIONS gotcha line
  beside the three-fixture one, saying `app-shell` owns every app test
  and that any `app/src/**` fence is source-only. Cheapest, changes
  nothing, and makes it a dispatch-time input instead of a build-time
  discovery.
- (b) **Split `app/test/**` in C-05's `paths:`** so test files follow the
  component they exercise (`app/test/map-*.test.*` → C-12, and so on).
  That is the same rule T-010 applied to Rust when it gave C-14
  `tests/agent_runner.rs` — *"a component's test double and its suite
  belong to the component they exercise"* — applied to the TS side, where
  it was never applied. It would drain D1:C-05→C-06 and D1:C-05→C-09
  outright and thin C-05→C-13 and C-05→C-14 to their source edges, so it
  is not independent of T-033's decision (1) and should be ruled with it
  (see `T-033-s2`).
- (c) **Move the tests beside the source** (`app/src/**/__tests__`), which
  fixes it by construction and is a large, mechanical, high-churn change
  that would move the graph substantially. Named for completeness; not
  recommended while the graph sits at 89% of its budget (`T-010-s3`).

Arm (b) is the interesting one, because it makes the fence and the drift
picture agree instead of trading one against the other.
