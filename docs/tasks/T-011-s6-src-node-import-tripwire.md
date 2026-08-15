---
title: "Tripwire test — no node: imports under app/src/**"
status: suggested
suggested_by: verifier claude-fable-5 @T-011
---

T-011's app/test/node-builtins.d.ts (decision 13: no @types/node)
declares readFileSync/readdirSync/join/resolve/fileURLToPath for the
dogfood test. Because app/tsconfig.json includes both src and test,
those five names now TYPECHECK from app/src/** too — before T-011 any
node: import in src failed tsc loudly (TS2307); now exactly these five
would pass tsc, and `vite build` only warns while the webview breaks
at runtime. The executor's tradeoff is the least-erosion option
(@types/node would open the whole node surface) and is documented;
this suggestion restores the full loudness for the five names:

A tiny vitest that walks app/src/** and asserts no import specifier
matches /^node:/ (and none of the bare builtin names) — the same
lib-parser smoke-test discipline, S-sized, zero dependencies. It turns
the webview-purity rule from convention into a pinned test, which is
also T-003's pure-entry discipline applied to the app tree.
