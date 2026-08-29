---
id: T-140-s3
title: A graph skipped for any reason but oversize gets a header and a banner that disagree — the header says it was not delivered while the banner still says the index never ran
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-140
---

**Found while verifying `T-140` at `1792e3a`, by driving the pane's own
states rather than by reading the diff.** `T-140` fixed the state it was
written for — a graph the collector left out for `SkipReason::Oversize`
now says *too large to map* and withdraws a button that could not have
helped. The fix reaches the HEADER for every skip reason and the BANNER
for only one, and in the gap the two disagree about the same project.

## What the two surfaces say

`app/src/architecture/MapView.tsx`, at `1792e3a`:

- `indexHint` answers on ANY skip: `"graph too large to deliver"` when
  the reason is `oversize`, `"graph not delivered"` otherwise.
- The banner branches on `derived.indexNotRun && graphSkip === "oversize"`
  for the new paragraph, and on
  `derived.indexNotRun && graphSkip !== "oversize"` for the old one — so
  every non-`oversize` skip falls through to the pre-`T-140` sentence,
  *"index not run — declared components only, every edge planned"*, with
  the `Run index` button still offered.

**Measured** (verifier's own scratch body, jsdom, in a detached drill
worktree at `1792e3a`; `graphSkip: "unreadable"`, no graph content):

    [data-testid=map-index-hint]  ->  "graph not delivered"
    [data-testid=map-degraded]    ->  contains "index not run"
    [data-testid=map-run-index]   ->  present

Two sentences about one state, six inches apart, and the one a user is
likelier to act on is the false one: the index HAS run and wrote a file
the collector then refused to carry.

## Why this is a finding and not a defect in `T-140`

`T-140`'s criterion 3 is about a project **too large to map**, and that
state is met and pinned. The banner half here is unchanged pre-`T-140`
behaviour — before the diff both surfaces said "index not run", which was
equally false but at least agreed with itself. What the diff introduced is
the DISAGREEMENT, by making one surface honest. That is a net improvement
with a residual, which is a suggestion's shape rather than a rejection's.

## Reachability, so nobody dismisses it as theoretical

`SkipReason` is `oversize | nonUtf8 | tooDeep | fileCap | unreadable`.
For `docs/architecture/graph.json` specifically:

- `unreadable` — an `fs::read` error on the file. A permissions change or
  a mid-write race reaches it.
- `nonUtf8` — a corrupted or hand-mangled graph. The crate only ever
  writes UTF-8, so this means somebody or something else wrote it.
- `fileCap` — `MAX_FILES` is 2 000 and membership is the first 2 000
  eligible paths **in path order**, so a docs tree large enough to clip
  could drop it. Unlikely at this path, not impossible.
- `tooDeep` — unreachable at depth 2.

So two of the five are ordinary operational states, not exotica.

## The shape of the fix

The banner's two conditions should partition the skip space the way the
header already does, rather than partitioning it on the single reason the
card was about. One paragraph per honest answer:

- `oversize` — what ships today: too large to map, no button.
- any OTHER skip reason — say the graph was not delivered and NAME the
  reason (`skipReasonPhrase` in `app/src/lib/docs-model.ts` already
  produces the phrase the chip strip uses), and decide per reason whether
  `Run index` can help. For `unreadable` and `nonUtf8` it plausibly can —
  re-indexing rewrites the file — so the button probably stays, with a
  sentence that is true.
- no skip at all — the pre-existing "index not run" paragraph, which is
  correct only in that case.

**And pin the pair, not either half.** The lesson `T-140`'s own new body
already carries applies here: assert the header string and the banner
sentence in the SAME body for the SAME fixture, so a future edit cannot
make one honest and leave the other behind — which is exactly how this
gap arrived.

## Fence

`app/src/architecture/MapView.tsx` and `app/test/map-view-dom.test.tsx` —
`app-map`, plus `app/src/lib/docs-model.ts` under `app-shell` if the
phrase helper is reused. The same fence `T-140` held, so this is small
and in-reach whenever `app-map` is free.
