---
title: An aliased slot raises the board's issue count and names itself nowhere
status: suggested
suggested_by: executor claude-opus-5 @T-053
---

T-053's criterion 6 assumes the app surfaces new issues "through the
existing count and list". Measured through the app's OWN
`app/src/lib/docs-model.ts` (`applySnapshot` over T-053's fixture, run
with vite-node, no app file touched): the count is right and the list is
empty.

    model.issues.length (the COUNT App.tsx:602 renders):  2
    failures.length     (the LIST  App.tsx:615 renders):  0

The details strip (`data-testid="parse-error-details"`,
`app/src/App.tsx:610–620`) iterates `failures`, and `failingIssues`
(`docs-model.ts:190–202`) only marks a file failed when a record was
WITHHELD (task/component identity gate) or the roadmap produced zero
features. An `aliased-id` is neither: every record parses, so the file
is healthy and only the SET is wrong. The human sees the counter tick
from `0 issues` to `2 issues` with nothing anywhere on screen saying
what they are — the board's least actionable state, because a count
that cannot be expanded reads as a bug in the app rather than a fact
about the docs.

This is PRE-EXISTING and wider than T-053: every cross-file issue kind
has always been count-only — T-030's component `aliased-id`,
`ambiguous-mapping`, `dependency-cycle`, and every `dangling-reference`
from `validateProject`. T-053 only makes it reachable by a plausible
input (an interview-written backbone), which is why it is worth filing
now rather than when someone hits it.

Not fixed here deliberately: T-053's fence is `lib/parser/**` and its
criterion 6 says to STOP rather than edit an app file. The shape is an
app decision anyway — whether the strip grows a second list for
model-level issues, whether they get their own chip, and whether a
cross-file issue should be clickable to the files it names (the issue
already carries `files`, and now `space`, so the data is there).

Cheapest honest version: render `model.issues` that are not already
represented in `failures` as their own rows in the same strip, keyed by
kind + ids. One component, no new store state.
