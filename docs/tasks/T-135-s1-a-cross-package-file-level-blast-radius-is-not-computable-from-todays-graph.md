---
id: T-135-s1
title: A cross-package file-level dependent count is not computable from today's graph — the package.path seam resolves at COMPONENT granularity only, and both available file-level answers are wrong
status: suggested
suggested_by: executor claude-opus-5 @T-135
touches: [crate-index]
---

**Measured at `5547f02` with T-135's `mod` fix applied.**

`arch blast` counts DIRECT file→file `import` edges. An import of an
internal package does not name a file: it names the package node
(`p:@nputer/parser`), and `Package.path` maps that node to a DIRECTORY
(`lib/parser`). Which FILE of that directory the importer actually reaches
needs the package's entry point resolved — `package.json`'s `main`/
`exports`, then the module graph inside the package — and the committed
graph carries none of it.

**Both answers available today are wrong, and by a wide margin:**

    ignore the seam    -> all 25 lib/parser files read their INTERNAL
                          count only; `lib/parser/src/frontmatter.ts`
                          reads 4 when 28 files import the package
    attribute it to all-> every one of the 25 reads ~28, including files
                          nothing outside the package can reach

Derived at this ref: `p:@nputer/parser` carries **28** distinct importing
files, and the 25 files under `lib/parser/` carry internal direct
dependent counts of 0–10.

**WHAT T-135 DID INSTEAD, so this is a gap and not a silent wrong number.**
`arch blast` attributes the seam to NEITHER and prints it beside every
affected file:

    file  lib/parser/src/index.ts  dependents=10  component=C-06  pkg-seam=p:@nputer/parser(importers=28)

so the reader sees the internal count AND the reason it is not the whole
answer. `lib-parser` is a component-granularity answer until this is
built.

**Why it is a card and not a clause.** It needs a package entry-point
resolver in `crate-index`, with its own budget argument (ADR-014) and its
own determinism story, and it changes what `arch` and `arch drift` observe
as well — the same seam feeds their component edges. The `arch blast`
output above is the honest interim and costs nothing if this is never
taken.
