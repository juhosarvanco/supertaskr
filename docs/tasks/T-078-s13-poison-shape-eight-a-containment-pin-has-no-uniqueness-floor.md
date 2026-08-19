---
id: T-078-s13
title: POISON SHAPE EIGHT — a containment assertion over a whole file has no uniqueness floor, so a second copy of the needle silently un-pins the original, and the copy is written by documentation about the pin
status: suggested
suggested_by: verifier claude-opus-5 @T-078-reverify
---

Seven poison shapes are catalogued. This is an eighth, measured on
T-078's own branch, and the branch came within one editorial decision of
shipping it.

**The mechanism.** `app/src-tauri/src/agent/kit.rs:448-453` pins the
method stamp in `docs/CONVENTIONS.md`:

    let conventions = fs::read_to_string(repo_root().join("docs/CONVENTIONS.md"))
    assert!(conventions.contains(&format!("currently v{METHOD_SNAPSHOT_VERSION}")), ...)

`String::contains` is satisfied by ANY occurrence anywhere in the
haystack. The haystack is a whole file that anybody may add to. So the
assertion pins *that the string exists somewhere in the file*, while
every reader — and the const's own doc comment, "so a method bump that
forgets this const is red" — takes it to pin *the sentence in gotcha
one*.

**Measured, with the assert's predicate modelled exactly** (`grep -F -q
'currently v0.1.5'`, which is what `contains` does), each drill asserting
its substitution count and reading the mutated text back, each restored
byte-exact against `git show HEAD:docs/CONVENTIONS.md` (sha256
`965b6219...`, `git diff --quiet` exit 0):

| drill | occurrences | predicate | meaning |
|---|---|---|---|
| baseline | 1 | 0 (passes) | the pin holds |
| A: rewrite gotcha one to cite the symbol | 0 | **1 (fails)** | the pin discriminates |
| B: plant a second copy, THEN apply A | 1 | **0 (passes)** | the pin is GREEN with its subject deleted |

Drill B is the shape. The pinned sentence is gone, the const is
unchanged, `cargo test` stays green, and nothing anywhere notices —
because the number of occurrences is asserted nowhere.

**Why it is distinct from the seven.** Shapes one to four are "the
matcher moved, the value stayed"; here nothing moved. Shape five is an
assertion SET with no cardinality floor — deleting an assertion deletes
its own failure; here the assertion set is untouched and the HAYSTACK
gained a member. Shape six is a body that reds under a value poison while
killing no unique mutant; this body DOES kill a unique mutant, right up
until a duplicate appears somewhere it never looks. Shape seven is about
the mutant set being derived from the pins rather than the criteria.

**SHAPE EIGHT: an assertion that searches a corpus for a needle has no
UNIQUENESS floor, so any second copy of the needle un-pins the original —
and the likeliest author of that copy is documentation ABOUT the pin.**

That last clause is why this is not hypothetical. T-078-s6 asked the walk
table to name this coupling, and the obvious way to name it is to quote
the stamp. The executor declined to duplicate the literal and cited
maintainability — "a future method bump stays a one-place edit". The
sharper consequence it did not name is drill B: the second copy would
have made gotcha one's sentence deletable with the suite green. **The
call was right and the reason given was the weaker of the two.**

**The remedy is mechanical, which puts this beside shape five rather
than shape six.** Either assert the COUNT (`conventions.matches(&needle).count() == 1`)
or narrow the haystack to the line or section that is actually pinned.
Both turn drill B red.

**Where else to look.** Any `contains` / `toContain` / `includes` over a
whole file or a whole tree has this shape. `git grep -nE
'contains\(|toContain\(|\.includes\(' -- app/src-tauri tools/e2e lib` is
the sweep; the ones over a WHOLE-file string are the candidates, and the
ones whose needle also appears in prose about themselves are the live
ones.
