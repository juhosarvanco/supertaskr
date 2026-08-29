---
id: T-127-s8
title: The docs-gate census cannot see a reader that reaches docs/ through a helper it does not know, so the fence T-127-s6 DERIVED from that census was one reader short — and the fixture count CONVENTIONS quotes is wrong in the same direction
status: suggested
suggested_by: executor claude-opus-5 @T-127-s6
---

**The census resolves a reader's docs paths from literal sites and from
a hard-coded list of helper CALLS. `conventionsText()` is on that list;
`components()` and `architectureText()` are not** — so
`tools/e2e/tests/brief.spec.ts` is listed as a reader of
`docs/CONVENTIONS.md` and of nothing else, while its body at :439 reads
BOTH `docs/architecture/components` (through `components()`) and
`docs/ARCHITECTURE.md` (through `architectureText()`), both defined in
`tools/e2e/scripts/dispatch-brief.mjs`.

## Measured at `fc45724`

`node tools/e2e/scripts/docs-gate.mjs --census`, the
`docs/architecture/components` readers, verbatim:

    app/src-tauri/crates/nputer-index/tests/arch.rs   (site)
    app/test/architecture-dogfood.test.ts             (site)
    app/test/map-dogfood-render.test.tsx              (site)
    app/test/select-board.test.ts                     (site)
    lib/parser/test/fence.test.ts                     (call parseProject())
    lib/parser/test/rejected-exclusion.test.ts        (call parseProject(), site)
    lib/parser/test/smoke.test.ts                     (call parseProject())

Seven. `brief.spec.ts` is the eighth and is absent. Its own row reads
`docs/CONVENTIONS.md  (call conventionsText())` — the helper the census
DOES know, in the same file as the two it does not.

## Why this cost something rather than being tidy-up

`T-127-s6`'s fence — `[docs/architecture/components/, app-map,
crate-index]` — was DERIVED from exactly that census table, which is the
right method and is why the card carries the table in its body. The
derivation was complete over the census and incomplete over the tree, so
the lane could reach all three enforcing copies it knew about and not the
fourth. That fourth is `T-127-s7`.

**This is `T-127-s4`'s finding and `T-127-s6`'s standing hazard arriving
from a THIRD direction.** T-127-s4: a `touch_slugs:` edit is invisible to
every suite. T-127-s6: a `touches:` line is a claim about where files
live and nothing re-derives it when a later card moves them. This one: a
CENSUS is a claim about which files read a document, and it is only as
wide as its helper list.

## Two more things measured on the way, both worth their own line

1. **The registry readers in `tools/e2e` read `git ls-files`, not the
   working tree** (`trackedFiles` in `dispatch-brief.mjs`). A registry
   change that is edited but not yet `git add`ed is INVISIBLE to
   `brief.spec.ts`, so the whole e2e suite can pass green over a tree
   whose registry has two new components in it. Measured on T-127-s6's
   lane: `npm test` from `tools/e2e/` was **281 passed, exit 0** with
   `C-17` and `C-18` written and untracked. That is also why
   `T-127-s1`'s drill — which never committed, by the POISON DRILL's own
   restore-vs-revert rule — could not have found this.
2. **CONVENTIONS' DECLARING A COMPONENT gotcha is now wrong about the
   count as well as the membership.** It says THREE live-registry
   fixtures; `T-127-s1` finding 5 corrected the membership (the two app
   fixtures plus the Rust `KNOWN_DECLARED_CYCLES` allowlist, with the
   parser pin holding because T-033 made its id array derived). At
   `f0ff62d` the true set is FOUR: those three plus `brief.spec.ts`'s
   slug-map comparison against `docs/ARCHITECTURE.md`. The bullet is
   `docs/CONVENTIONS.md` and is outside every fence in this family;
   `T-127-s5` was rejected for exactly the shape of a card that edits it
   in passing, so it needs its own.

## Fence

The census lives in `tools/e2e/scripts/docs-scan.mjs` and
`tools/e2e/scripts/docs-gate.mjs`, so the fence is `[tools/e2e]` — which
COLLIDES with `T-153-s5`/`T-153-s6` and must be sequenced behind them.
The CONVENTIONS half is a different fence again and is why item 2 above
is stated rather than taken.
