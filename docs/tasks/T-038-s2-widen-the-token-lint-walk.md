---
id: T-038-s2
title: The token lint can now safely walk past app/src — the reason it could not (regex literals, labeled tuples) is gone
status: suggested
suggested_by: executor claude-opus-5 @T-038
---

T-020-s5 recorded the blocker in one line: a regex literal containing
`-[` is a P1 hit, and *"lib/parser/src/frontmatter.ts:35 is exactly
this shape and is only safe because the scan is scoped to app/src. Any
future widening of the walk … trips it."* T-038 removed that
constraint. Measured, not inferred — a scratch differential at T-038's
build ran main's line scan and the new masked scan over **every
.ts/.tsx in the repo, 122 files** (the lint itself walks 36):

    files=122  both=0  OLD-only=11  NEW-only=0

Eleven false positives on the wider corpus under main's script, **zero**
hits of any kind under T-038's. Two of them are the regex literals
(genesis-derive.ts:231, frontmatter.ts:35); the other nine are a class
that had never been catalogued — TypeScript **labeled tuples**, which
P2 reads as an arbitrary property:

    app/test/architecture-derive.test.ts:57   specs: [id: string, spec: ComponentSpec][],
    app/test/architecture-glob.test.ts:14     const cases: [pattern: string, text: string, expected: boolean][] = [
    app/test/board-truth.test.tsx:47          type Field = [key: string, value: string | number];
    lib/parser/test/validate.test.ts:21       type Field = [key: string, value: string];
    …9 in all, across 6 files

**What widening would buy.** app/test renders real components
(board-truth.test.tsx, map-view-dom.test.tsx and friends assert on
rendered DOM), so class strings live there too — and they are the one
place a `text-red-500` could sit unnoticed while the shipped tree stays
clean. Today those files are unscanned. tools/e2e's fixtures are a
smaller version of the same argument.

**What it costs, and the open questions.**

- The walk is one `target` constant plus the `.ts/.tsx` filter; the
  cost is trivial. The *decision* is not: what is in scope is a
  statement about where the tokens-only rule applies.
- lib/parser has no UI and never will (ADR-011) — scanning it buys
  nothing and only widens the collision surface. Probably out.
- app/test is the real candidate; tools/e2e second.
- The lint's own script would then be scanning source that contains its
  own sample strings — tools/e2e/scripts/lint-tokens.mjs is `.mjs`, so
  the current filter already excludes it, but a widened walk should
  keep excluding it deliberately rather than by extension.

Not urgent: nothing is broken and the shipped tree is the tree that
matters. Worth doing the next time someone touches this lint, with the
122-file differential above as the standing evidence that it is now
safe.
