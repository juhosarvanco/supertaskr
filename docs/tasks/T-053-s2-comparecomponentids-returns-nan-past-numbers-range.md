---
title: compareComponentIds returns NaN for ids past Number's range, so sort order is undefined
status: suggested
suggested_by: executor claude-opus-5 @T-053
---

`compareComponentIds` (`lib/parser/src/component.ts:51–59`) compares the
digit halves with `Number(na) - Number(nb)` and returns that difference
whenever it is non-zero. For ids whose digit run exceeds what a double
can hold — roughly 309 digits — both sides are `Infinity`, the
difference is `NaN`, and `NaN !== 0` is TRUE, so the comparator returns
`NaN`. Reproduced:

    compareComponentIds('C-111…' (400 ones), 'C-222…' (400 twos)) = NaN
    [b, a].sort(compareComponentIds)  ->  input order, not id order

A comparator that returns NaN is not a comparator: `Array.prototype.sort`
is free to do anything with it, and in V8 it leaves the pair as-is. So
"first match by component id order wins" — the rule the whole
`ambiguous-mapping` message rests on — silently becomes "first by
whatever order the files happened to arrive in" for such ids.

This is the SAME class of defect T-030's textual slot key was written to
avoid (floating point losing information about long ids), one function
away from it, and T-053 has just pinned the slot key against exactly
these inputs. The comparator was left alone on purpose: T-053's
criterion 1 requires component ordering behaviour to be UNCHANGED, so
fixing it inside that task would have been the builder quietly widening
a fenced criterion.

Not live today: the longest component id in the tree is `C-14`, and the
identity gate demands `C-\d{2,}` but sets no upper bound, so any file
anyone writes can reach it. Fix is small and self-contained — compare
digit runs textually (strip leading zeros, then longer-is-greater, then
lexicographic), which is the same primitive `idSlotKey` already uses and
would make the comparator total for every input. Wants its own pins:
the existing `compareComponentIds` pin (`component.test.ts:310`) only
covers small ids.
