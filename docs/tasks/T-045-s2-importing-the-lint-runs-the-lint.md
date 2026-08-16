---
id: T-045-s2
title: Importing lint-tokens.mjs runs the whole lint, and can exit the importer
status: suggested
suggested_by: executor claude-opus-5 @T-045
---

`tools/e2e/scripts/lint-tokens.mjs` ends with

    if (process.argv.includes("--selftest")) selftest();
    else lintTree();

at module scope. Its header invites importing it — "`maskSource` and
`scanSource` are exported so a throwaway harness can re-derive the
evidence (T-038 diffed old-vs-new hits over all 122 .ts/.tsx in the repo
that way)" — and T-045 used the same route to measure the widened corpus.

The cost, observed in both tasks: every such harness silently runs the
FULL tree lint on import (its "lint-tokens: clean (90 files scanned …)"
line appears in the middle of the harness's own output), and on a tree
with a violation the import would `process.exit(1)` before the harness
ran a single line of its own. An evidence-gathering script that dies with
exit 1 for a reason unrelated to what it was measuring is a bad half hour.

The obvious fix — an `import.meta.url === process.argv[1]` guard — is the
one T-046 argued AGAINST for `tauri-boot-check.mjs`, and for a good
reason that transplants here: a path mismatch (symlinked checkout,
wrapper script) turns the gate into a silent exit 0, and this lint is
CI's first step. T-046's own remedy is the shape to copy: move the
testable half into a side-effect-free module the entry point imports.
Here that would be `scripts/token-scan.mjs` exporting `maskSource`,
`scanSource`, the patterns, the walk policy and `corpus()`, with
`lint-tokens.mjs` keeping its unconditional `lintTree()` / `selftest()`
call.

Small, but it is worth doing before the next task needs a differential:
two tasks in a row have now worked around it.
