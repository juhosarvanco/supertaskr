---
id: T-137-s7
title: `tools/e2e` reaches into `lib/parser/dist` by relative path because it declares no dependency on the parser, and the manifest that forbids it is the same file that would fix it
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [tools/e2e]
---

**`tools/e2e/scripts/dispatch-order.mjs` (T-137) loads
`lib/parser/dist/index.js` by relative path** rather than importing
`@nputer/parser`, because `tools/e2e/package.json` declares no such
dependency and its own description says the package *"imports neither app
nor parser"* (the ADR-011 family).

**THE PRECEDENT IS ALREADY THERE AND IT IS WHY THIS WAS NOT ESCALATED.**
`tools/e2e/preflight.ts` already ASSERTS `lib/parser/dist/pure.js` into
existence and refuses the whole lane without it, and
`tools/e2e/tests/docs-input-gate.spec.ts` already READS
`lib/parser/src/types.ts` as text. So the package already depends on the
parser's tree; it just does not say so in the one place a tool would look.

**THREE OPTIONS, AND THE THIRD IS THE ONE THIS CARD RECOMMENDS.**

1. **Declare `"@nputer/parser": "file:../../lib/parser"`.** Honest, but it
   changes the package's stated architecture and the fresh-clone ORDER in
   `docs/CONVENTIONS.md`, which is a different fence.
2. **Leave it.** The refusal is loud (exit 3, naming the ADR-011 order),
   and a pin drives it. This is what shipped.
3. **Move the repo-wide TOOLS out of the E2E package.** `docs-scan.mjs`,
   `token-scan.mjs`, `range-rule.mjs`, `dispatch-brief.mjs`, `brief.mjs`
   and now `dispatch-order.mjs` are not E2E tests — they live in
   `tools/e2e/scripts/` because that is where the first one landed. The
   ADR-011 argument for a standalone E2E package (do not link the app's
   internals; exercise the built product) **does not apply to a tool that
   reads the repository**, and the collision between the two is what
   forced option 2. This is the card worth writing.
