---
title: The genesis north-star title is the pane's one unbounded text surface
status: suggested
suggested_by: verifier claude-opus-5 @T-024
---

Every other text surface in `GenesisPane.tsx` is bounded. Chips clip to
44 characters on a word boundary (`genesis-derive.ts` `CHIP_CLIP`),
artifact rows carry `truncate`, backbone card names carry `truncate`.
The north-star title does not:

    // GenesisPane.tsx:209
    <span className="text-2xl font-semibold tracking-heading text-foreground">
      {model.northStar.title}
    </span>

and `northStar.title = firstSentence(vision)` is unclipped by design —
`firstSentence` returns the whole collapsed blob when no `.!?` is found.

Reproduced during verification with an independent fixture: a
`## Vision` section holding a 10,000-character unbroken run renders as
a single 10,000-character text node inside that span. **No criterion is
broken** — it does not crash and the pane is not blank, so criterion 4
holds, and the scroll container's `overflow-y-auto` makes `overflow-x`
compute to `auto`, so the run is contained inside the genesis column
rather than blowing out the split view. It is a legibility wart, not a
break.

The reason to fix it anyway is precedent. T-017 established this repo's
answer for pathological titles on the board — `break-words` + `min-w-0`,
no `truncate`/`line-clamp`, so the full glyph run stays visible and
wrapped — and its verifier pinned that in-suite against 10k-char, 1063-
char URL and 1950-char CJK fixtures. The genesis title is the same
problem with a different component and a different answer (none). A
mid-write `NORTH_STAR.md` — the exact state this pane exists to render —
is a realistic way to hit it: the sentence terminator arrives after the
prose.

Suggested: apply the T-017 treatment (`break-words` plus `min-w-0` on
the title's flex ancestor) rather than inventing a third policy, and
pin it the way the board suite pins its own. Small, and it keeps one
overflow answer across the app. Whether the title should additionally
clip like the chips do is a design call, not a correctness one — the
design's hero line is one sentence, and clipping a hero reads worse
than wrapping it.
