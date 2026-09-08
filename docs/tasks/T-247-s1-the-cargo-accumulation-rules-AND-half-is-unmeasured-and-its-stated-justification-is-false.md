---
id: T-247-s1
title: The cargo accumulation rule's AND half is unmeasured, and the example its header cites to justify it is false of this tree
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-247
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-221`** (a body whose property lives in DATA cannot be
graded by code mutants alone). **Disposition hint: worth one body and
two sentences of header; not worth a lane on its own — fold into the
next lane that touches this hook.**

`cargoManifestDeps` folds its per-line verdicts as **AND within one
declaration, OR across declarations**, and both the hook header and the
card's implementation notes justify the AND half with the same example:
that a plain OR over every occurrence would answer registry-bound for
`nputer-index` and so falsely refuse this project's own tree. Derived at
`f6bc5c8`: that is not true of this tree. `app/src-tauri/Cargo.toml`
declares `nputer-index` exactly once — `nputer-index = { path =
"crates/nputer-index" }` under `[dependencies]` — so an OR over its
occurrences is still not-registry-bound and it stays excluded either
way. Reproduced by mutating the inner fold from
`(get(key) ?? true) && bound` to `(get(key) ?? false) || bound` and
running the whole spec: **exit 0, 36 passed, kill set EMPTY**. The
`serde` half of the same body (declared `{ workspace = true }` under
`[dependencies]` and with a real version under
`[workspace.dependencies]`) does measure the OR-across half, and it is
the half that is load-bearing.

Where the AND genuinely decides is the `[dependencies.<name>]` SUB-TABLE
form, whose header line seeds the accumulator registry-bound before its
own lines are read: a sub-table carrying `path` is correctly excluded
only because the seed is ANDed down. No `Cargo.toml` in this tree uses
that form (checked over all five tracked `*Cargo.toml`), so the live-file
body cannot reach it. What is owed is a body over the sub-table form —
`[dependencies.foo]` with a `path` line must not be registry-bound while
`[dependencies.bar]` with only a `version` must be — which the reader
already answers correctly today, and a correction to the two prose
passages so the justification names the case that actually decides it.
The body's own comment currently claims *"Both halves are measured …
against the LIVE manifest"*, and only one of them is.
