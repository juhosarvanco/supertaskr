---
id: T-038-s1
title: Arbitrary breakpoints (`min-[600px]:`) are now invisible to the token lint — if breakpoints should be tokens, that needs its own rule
status: suggested
suggested_by: executor claude-opus-5 @T-038
---

T-020-s5 flagged this when it proposed the variant predicate: excluding
the whole variant family *"costs the ability to catch `min-[600px]:` —
which is a breakpoint value in variant clothing, so the exclusion
should be argued rather than assumed."* T-038 argued it and shipped the
exclusion. This file is the residue that the argument does NOT cover.

**What was argued, and holds.** `min-[600px]:flex` compiles to
`@media (width >= 600px) { .flex }` — a media-query wrapper around a
real, mapped utility. Nothing is silently dead, which is the harm the
tokens-only rule exists to prevent ("unmapped utilities are
deliberately dead", CONVENTIONS). It is a variant by Tailwind's grammar
and by its output, T-038's criterion names `min-[…]:` in the family
that shall not be reported, and the alternative — reporting it under P1
— would also report `data-[state=open]:`, which is the exact
`shadcn add` failure T-038 was dispatched to prevent.

**What is left over.** A hard-coded breakpoint escapes
`@theme --breakpoint-*` the way a hard-coded colour escapes
`--color-*`. Today that is theoretical: app/src carries **zero**
arbitrary breakpoint variants (checked at T-038's build — the only
arbitrary variants in the tree are the three vendored `[&_svg…]` in
ui/button.tsx). The moment the first responsive pane lands, `min-[…]`
and `max-[…]` become the cheap way to write it, and nothing in the repo
will notice.

**Why it is not P1's job.** P1 is about a VALUE bypassing the token
scale in a declaration. A breakpoint is a boundary in a media query.
Folding them together is what produced the collision T-038 had to
unpick; a separate, argued pattern is the honest shape:

- a candidate rule, roughly: `\b(min|max|@min|@max)-\[` in a class
  string is a violation *even though it is a variant*, with the fix
  being `@theme { --breakpoint-pane: 600px }` + `min-pane:`;
- it needs its own positive/negative sample pair in `--selftest`,
  and a decision on whether the container-query forms (`@min-[…]`,
  `@max-[…]`) are in scope;
- it should be decided WITH the first real responsive requirement,
  not before one — a rule with no call site is a rule nobody can
  evaluate.

Cheap to park; it costs one pattern and two samples whenever the design
work that needs breakpoints actually arrives.
