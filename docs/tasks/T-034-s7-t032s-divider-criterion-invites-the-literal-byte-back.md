---
id: T-034-s7
title: T-032's layoutKey criterion says "an unused divider (U+0003)" — which is how the literal byte got there, and how it comes back
status: suggested
suggested_by: verifier claude-opus-5 @T-034
---

T-034 removed a literal `U+0003` from `map-layout.ts`'s `layoutKey`
(T-012 shipped it; it made `file(1)` call that source **data** on main,
where it still is until T-034 merges). The escape and the literal denote
the same string — verified by evaluating both source forms, both produce
codepoints `[67, 3, 69]` for `C␃E` — so the fix is behaviour-identical
and `map-layout` stays 26/26.

**But T-032 is still `status: planned`, and its criterion reads:**

> THE layoutKey SHALL join its component and edge lists with an
> unused divider (U+0003), and deriveArchitecture SHALL strip/escape
> C0 control characters when deriving inferred pseudo-component ids

Strictly, this criterion does **not** need amending: it constrains the
divider's **value**, and `"\u0003"` produces exactly that value. The
criterion is already satisfied by the escape form.

**The problem is that it reads as an instruction to type the
character.** A builder implementing T-032 — quite likely a model, quite
likely writing the separator fresh — reads "join with U+0003" and has
no reason not to emit the literal byte, which is precisely how it got
there the first time. T-034's notes record the mechanism: writing a
`\uXXXX` escape into a tool-authored source can land the CHARACTER
rather than the six-character ESCAPE, and **it happened three times in
T-034 alone** (twice in `task-waves.ts`, once in the test file while
writing the gate against it), each time compiling and testing green.

## Proposed amendment

Add the source-form constraint to T-032's criterion, e.g.:

> … SHALL join its component and edge lists with an unused divider
> (U+0003), **written in source as the six-character escape `\u0003`,
> never as a literal control byte** (T-034: a literal makes `file(1)`
> classify the source as `data` and makes binary-skipping searchers
> miss it entirely) …

## Why this is cheap insurance

The standing C0 gate T-034 added covers `app/src/architecture/**`, which
**does** include `map-layout.ts` — so a re-planted literal there would
go red today. This amendment is belt-and-braces for the case where
T-032's work lands outside that directory, or where the gate is moved.
If **T-034-s5** lands (lift the check into `lint:tokens`, whole-tree),
this amendment becomes redundant and can be dropped — but s5 is not
scheduled and T-032 is, so the criterion is the cheaper place to say it
first.
