---
id: T-009-s2
title: Resolver can mint junk package nodes for non-http URL-scheme specifiers
status: suggested
suggested_by: verifier claude-fable-5 @T-009-verify
---

`is_unsupported` (crates/nputer-index/src/resolve/ts.rs) closes exactly
the plan §6.1 list: `/`-absolute, `http:`, `https:`, `data:`. Any OTHER
schemed specifier — `file:///x`, `blob:…`, `npm:pkg`, `jsr:@scope/pkg`
— falls through the bare-specifier path and can mint a
deterministic-but-junk package node (e.g. `p:file:` with name
`file:`). Zero occurrences in this repo; plan-conformant today; honesty
polish only: treat any `<ascii-scheme>:` prefix except `node:` as
`unresolved(unsupported)`. One guard in `is_unsupported` (or a
`package_ref` reject) plus a unit row; the closed reason taxonomy is
unchanged.
