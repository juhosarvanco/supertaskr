---
id: T-046-s2
title: Turn on checkJs for tools/e2e's .mjs scripts
status: suggested
suggested_by: executor claude-opus-5 @T-046
---

T-046 added `"allowJs": true` to `tools/e2e/tsconfig.json` so the lane
spec can import `scripts/boot-port.mjs`, which is plain JS carrying JSDoc
types (the scripts must run under bare `node` in CI, so they cannot be
TypeScript). `checkJs` was deliberately left OFF.

The consequence: tsc now READS those JSDoc annotations to type the
spec's imports, but never CHECKS the script against them. A wrong
`@param {number}` on `bootConfigJson` would silently mistype the spec's
expectations rather than fail `npm run typecheck`. The annotations are
load-bearing and unverified.

Turning `checkJs` on is one line, but it newly type-checks two
long-standing scripts that were written without tsc ever looking at them:

- `scripts/tauri-boot-check.mjs` — `process.kill(-child.pid, signal)`
  where `child.pid` is `number | undefined` under strict; the `recent`
  array and `seen` set are inferred from empty literals; `chunk` in the
  stream handlers is implicitly `any`.
- `scripts/lint-tokens.mjs` — not audited for this, but written under
  the same conditions.

Each will want a few `@type` annotations or a narrow guard. All of them
are honest improvements — `child.pid` really can be undefined if the
spawn failed — but they are edits to a merge gate's kill path, which is
exactly the code that should not be touched as a side effect of a
tsconfig flag.

Do it as its own small task: flip `checkJs`, add `scripts/**/*.mjs` to
`include`, fix what it finds, and re-run the T-046 exit-path drills
(exit 0 / 1 / 2 / 3) afterwards, since the kill path is what changes.
