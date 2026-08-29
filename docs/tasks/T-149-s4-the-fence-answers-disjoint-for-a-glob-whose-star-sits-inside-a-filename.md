---
id: T-149-s4
title: The fence answers disjoint for a glob whose star sits inside a filename — `app/test/map-*` normalises to a prefix that matches nothing, while the derivation matcher calls the same file ambiguous
status: parked
suggested_by: verifier claude-opus-5 @T-149-verify
---

**MEASURED AT `d437f5a` AND MODELLED ON A COPY OF THE BASE REGISTRY
`23ee41b`. NOT INTRODUCED BY T-149 — T-149's design is what avoids it,
which is why this is filed rather than folded into the verdict.**

`normalizeFenceToken` (`lib/parser/src/fence.ts`) strips a TRAILING star
run and nothing else:

    "app/test/**"    -> "app/test"
    "app/test/map-*" -> "app/test/map-"

`sharedDomain` in the same file compares by path SEGMENT — `a === b`, or
one starting with the other plus `/`. **`app/test/map-` satisfies neither
against any real path**, so it matches nothing at all, not even
`app/test/map-layout.test.ts`.

## The reproduction, both layers over the same tree

A throwaway copy of the `23ee41b` registry with `app/test/map-*` in
C-05's `paths:` and `app/test/map-layout.test.ts` in C-12's, driven
through the BUILT parser and the Rust reader:

    compareFences(app-shell, app-map)   ->  disjoint      (no witness)
    nputer-index arch drift             ->  ambiguous=1
                                            claim  C-12  app/test/map-layout.test.ts

**The two layers disagree about the same file.** The matcher sees both
components claiming it; the fence reports two lanes may hold it at once.
Directly as a `touches:` token it is the same answer:

    ["app/test/map-*"] vs ["app/test/map-layout.test.ts"]  -> disjoint
    ["app/test/map-*"] vs ["app/test/map-zoom.test.ts"]    -> disjoint

## Why this is the module's own stated defect, arriving through its guard

`expandFence` DOES refuse a star it cannot interpret. A NON-trailing star
run comes back `unresolved` and `unusable`, with this message:

> entry "…" carries a glob this fence does not interpret — only a
> TRAILING star run is understood, and comparing the rest as a literal
> prefix would answer confidently and wrongly

`app/test/map-*` **is** a trailing star run, so it passes the guard — and
then does the thing the guard's own sentence describes. It raises **no
issue** and is **not** marked `unusable`. That is `T-111-s3`'s shape, and
the module's header names it as the defect it exists to remove: *"A fence
that answers 'no overlap' when it means 'I do not know'."*

## Blast radius today: zero, and that is a measurement not an assumption

Swept all **97** `paths:` entries across the thirteen component files at
`d437f5a`: **zero** non-trailing wildcards, zero negations, zero quotes
or escapes, zero `..`. Every live `touches:` token is a slug, a
directory, or an exact file. **Nothing in the tree triggers it now.**
What changed at T-149 is that per-file `paths:` entries are now the
normal shape for `app/test/`, so the tidy-looking middle way
(`app/test/map-*` instead of sixteen literals) is exactly what the next
editor of that list will reach for. T-149 wrote the warning into
`C-05-app.md`; nothing enforces it.

## Three arms, and the third is the cheap one

1. **Refuse it** — treat any `*` that is not a whole trailing segment run
   as `unresolved`/`unusable`, the same disposition the non-trailing case
   already gets. Loud, and consistent with the module's contract.
2. **Interpret it** — make `sharedDomain` understand a literal prefix.
   More capable and more surface; the header argues against it in as many
   words.
3. **Pin it** — a body in `lib/parser/test/fence.test.ts` asserting that
   `app/test/map-*` against `app/test/map-layout.test.ts` is NOT
   `disjoint`. Whichever arm is taken, the pin is what stops it coming
   back, and it reds today.

Fence: `[lib-parser]`.

Amnesty triage 2026-08-29 (triage seat): PARKED — a real fence-correctness defect, reproduced through BOTH layers over one tree, and the answer it gives is the dangerous one: normalizeFenceToken strips only a TRAILING star run, so app/test/map-* becomes app/test/map- which matches nothing at all — compareFences says disjoint with no witness while arch drift calls the same file ambiguous. disjoint is the answer that lets two lanes hold one file, which is the exact failure a fence exists to prevent. It is NOT LIVE TODAY and that is why it is parked rather than promoted: no token on the board has this shape, and T-149's design — exact paths rather than mid-name globs — is what avoids it. RESURFACES: the merge of T-154, whose write-time fence enforcement makes a wrong disjoint verdict enforceable rather than advisory, or the next lib-parser dispatch, or the first mid-name glob written into any touch_slugs: or touches: — whichever comes first.
