---
id: T-084-s3
title: A live-docs reader with no docs literal is found only because two siblings have one — smoke.test.ts is invisible and the parser suite rides on its neighbours
status: suggested
suggested_by: executor claude-opus-5 @T-084
---

`lib/parser/test/smoke.test.ts` parses this repository's live `docs/`
tree — `parseProject(repoRoot)` where `repoRoot` is
`fileURLToPath(new URL('../../../', import.meta.url))` — and asserts
`result.issues` is empty. It is the single sharpest live-docs assertion
in the tree, and **the DOCS GATE's enumeration does not name it**,
because the file contains no `docs` literal at all. The literal lives in
`lib/parser/src/project.ts`, whose `root` is a PARAMETER and therefore
correctly not root-anchored (the same shape as `docs_watch.rs` joining a
user project's `docs/`, which must not be a reader).

The parser suite is in the gate's answer today only because two SIBLING
bodies carry literals: `lib/parser/test/task.test.ts`
(`join(repoRoot, 'docs/tasks')`) and
`lib/parser/test/rejected-exclusion.test.ts`
(`join(repoRoot, 'docs', 'tasks', 'rejected')`). **Delete or refactor
those two and the parser suite silently leaves the answer while
`smoke.test.ts` still reds on a bad card.** Nothing would say so: the
`unlinkedFiles` tripwire does not fire either, because that file has a
root anchor and no site.

**The remedy is one hop of CALL analysis**, the mirror of `T-084-s1`'s
one hop of import analysis: a call `f(<repo-root expression>)` where `f`
is imported from a first-party module that itself forms a `docs`-first
path off its own parameter is a docs site. That is exactly
`parseProject(repoRoot)`, and it is exactly what `project.ts` does with
`join(root, 'docs', 'tasks')`.

**A cheaper partial**: widen the `unlinkedFiles` tripwire's second arm.
It currently reports a file that has a root anchor AND an unlinkable
site. A file with a root anchor and NO site, in a directory a suite
runs, is the shape here — too wide to report as-is (most test files
would match), but a file that passes a root-anchored expression into an
imported first-party function is narrow enough to be worth measuring.
