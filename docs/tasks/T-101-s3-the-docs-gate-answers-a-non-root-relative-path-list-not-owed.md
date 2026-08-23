---
id: T-101-s3
title: The docs gate answers a non-empty but non-root-relative path list "not owed" at exit 0
status: suggested
suggested_by: verifier claude-opus-5 @T-101-verify
---

`tools/e2e/scripts/docs-gate.mjs` decides whether a path is a code input
by matching it against `docs/`. Paths that name the same files by a
different spelling do not match, and the gate reports the run as clean
rather than as a run it could not interpret. Measured on this card's own
two paths, from `tools/e2e/`:

    node scripts/docs-gate.mjs ../../docs/tasks/T-101-*.md
    -> "docs-gate: 2 changed path(s) given, none under docs/ — this
        gate is not owed."   exit 0

    (from the repo root, same two files, root-relative)
    node tools/e2e/scripts/docs-gate.mjs docs/tasks/T-101-*.md
    -> "docs-gate: FIRES — 2 path(s) under docs/ are code inputs."  exit 1

Both invocations name the identical files. One says the gate is not
owed; the other owes three suites.

**This is `T-084-s6`'s shape, one level over.** That finding closed the
EMPTY path list — BSD `xargs` runs the utility once on empty input, so a
failed range command reached the gate as zero paths and was answered
"not owed", *"silence wearing a clean gate's costume"*. The remedy made
an empty list exit 2. A non-empty list of paths the gate cannot resolve
still gets the exit-0 answer, and it is a likelier operator error than
the empty one: the CONVENTIONS bullet says to run the gate from the repo
root, but the two neighbouring commands in the same workflow
(`npm run lint:tokens`, `npm run boot:check`) are both run FROM
`tools/e2e/`, so reaching for a `../../` path there is the natural
mistake. I made it myself on my first invocation of this verification
and only caught it because the output named a count I could compare.

**Suggested fix, in the gate's own idiom.** Resolve each given path
against the repository root before matching, so both spellings answer
the same. If a path resolves outside the repository, or names a file
that is not tracked, that is exit 2 (`called wrong`) — the code the gate
already reserves for exactly this — never exit 0. The distinction the
gate must preserve is "I looked and nothing is owed" versus "I could not
tell what you asked about", and today those share a code.

Worth pairing with the enforcing copy: `tools/e2e/tests/docs-input-gate.spec.ts`
already runs inside the lane, so a body driving a `../../`-spelled path
and requiring a non-zero exit would hold the fix.

**BELONGS WITH `T-090`, and should be absorbed rather than triaged
alone** (added by T-101's second executor at the rebuild). T-090 — *"The
DOCS GATE is a hand-run ritual, the invocation CONVENTIONS prints
destroys its four-code contract, and two sentences about it are false"*,
`status: planned`, `touches: [tools/e2e, .github/, docs/CONVENTIONS.md]`
— already owns exactly this surface: the gate's four-code contract, the
one spelling shared between the CONVENTIONS bullet and `docs-gate.mjs`'s
own header comment, and the CI step that will run it. This finding is the
THIRD leak of the same contract — `T-084-s6` closed the empty list, T-090
owns the `xargs` collapse, and this is a non-empty list the gate cannot
resolve — and all three are one distinction: *"I looked and nothing is
owed"* versus *"I could not tell what you asked about"*. Fixing it inside
T-090 costs one predicate and one lane body; fixing it separately means a
second lane opening the same file for the same reason. Its fence is a
SUBSET of T-090's, so absorption needs no widening.
