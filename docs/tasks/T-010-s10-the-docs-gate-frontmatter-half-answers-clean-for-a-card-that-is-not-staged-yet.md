---
id: T-010-s10
title: The docs gate's frontmatter half reads git ls-files, so a card written but not yet staged gets a confident false clean
status: suggested
suggested_by: verifier claude-opus-5 @T-010-verify
---

**Not a T-010 defect** — a `tools/e2e` finding, made while verifying
T-010 because it happened to me and cost a green reading I had already
believed. Filed with its positive control, because a claim of the form
*"the gate did not catch X"* is worth nothing without one.

## What happened

Writing two suggestion files during T-010's verification, one carried
`title: The cargo: package qualifier closes …` — a YAML plain scalar
containing `": "`, which is not a legal plain scalar. Run directly on
that file, from the repo root, the gate said:

    docs-gate: 12 derived docs readers across 4 suites; 0 frontmatter issue(s) in the live tree
    docs-gate: every live task card's frontmatter parses, with a legal status.

`lib/parser`'s own smoke test then failed on the same tree —
`yaml-error … Nested mappings are not allowed in compact mappings at
line 2, column 8` — taking `npx vitest run` to **262/263** and
`npm test` from `app/` to **939/940**
(`architecture-dogfood.test.ts > both input layers parse clean`). Three
layers from the cause, by somebody who was not looking: the exact failure
shape the DOCS GATE bullet cites `9c64cd8` and `fede266` for.

## The mechanism, and the positive control that proves it is the mechanism

`docs-scan.mjs`'s `liveTaskCards()` is

    trackedFiles(root).filter(isTaskCardPath)

so the frontmatter half judges the **tracked** tree. An unstaged card is
not merely unchecked — it is invisible, and the gate reports the absence
of a problem it never looked for.

**POSITIVE CONTROL, same file, same gate, same command, one `git add`
apart:**

| state of the file | gate output |
|---|---|
| untracked | `0 frontmatter issue(s)` · *"every live task card's frontmatter parses"* |
| `git add`ed | `1 frontmatter issue(s)` · `1 task card(s) the parser will refuse:` naming it |

So the check works. What is wrong is its SCOPE against the sentence it
prints, and the direction of the error is the bad one — toward
*"everything is fine"*, the same direction T-090 removed `xargs` for.

## Why the wording is the load-bearing half

The gate is run BY HAND, by an executor before hand-off and by an
integrator before a merge, and the natural moment to run it is right
after writing the cards and before committing them. At that moment the
sentence *"every live task card's frontmatter parses"* is a statement
about a tree that does not include the cards the operator just wrote,
while reading as a statement about the tree they are looking at.

## The fix, cheapest first

1. **Say what was judged.** Print the card COUNT beside the verdict —
   *"every live task card's frontmatter parses (N tracked cards)"* — and
   have the whole-tree summary name `git ls-files` as its source. A
   census that names its own corpus cannot mislead about it; this is the
   same move T-090 made for the reader census.
2. **Notice the unstaged ones rather than skipping them.** Any
   `isTaskCardPath` argument handed to the gate that is NOT tracked is
   worth a line of its own — either checked, or reported as
   *"not tracked, not judged"*. The gate already normalises and reports
   argument spellings it rewrites, which is the same idea.
3. Whichever is built wants a body that pins BOTH rows of the table
   above, in one test. Only one of them is a fix; running only the
   tracked row cannot tell a fix from the behaviour that is already
   there.

Note the deliberate non-goal: `T-101-s3`'s *"a path that is not tracked
is exit 2"* was **explicitly not built** at T-090, because a merge's
diff names paths the working tree does not have. This finding is about
the WHOLE-TREE half's own corpus and its printed sentence, not about the
diff half's argument handling — the two must not be conflated, or fixing
this one will re-open the case T-090 closed on purpose.
