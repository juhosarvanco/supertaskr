---
id: T-078-s2
title: STATE attributes CONTROL 529 to the wrong commit — it is the merge's count, eight files earlier
status: rejected
suggested_by: executor claude-opus-5 @T-078
---

`docs/STATE.md`'s fourth-triage section says **"CONTROL is 529, TOKEN is
118 at `9b15f7d`"**, and T-078's card transcribes it ("a CONTROL corpus
of 529 files against TOKEN's 118 at `9b15f7d`"). **Measured: at
`9b15f7d` CONTROL is 521.** 529 is the count at T-058's merge
`7c6c5aa` — which STATE's own table one section above states correctly.
The eight-file gap is exactly the eight discharged suggestion files that
`9b15f7d` removed, and STATE says so itself two paragraphs earlier
("42 after the eight resolutions were committed at `9b15f7d`").

Derived, not transcribed. The instrument re-implements the shipped
policy — tracked paths minus `SKIP_DIRS` minus
`CONTROL_BINARY_EXTENSIONS`, classified with the same `extname`
semantics — and is calibrated at two refs where the answer is known
independently: it returns **496** at `e4a5ae7`, which is what the
shipped `npm run lint:tokens` prints there, and **529** at `7c6c5aa`,
which is STATE's own table. Across the triage:

| ref | CONTROL | what it is |
|---|---|---|
| `7c6c5aa` | 529 | T-058's merge — the figure in circulation |
| `9b15f7d` | 521 | the eight resolutions; STATE's claimed 529 |
| `cb36c29` | 498 | 35 findings become twelve cards |
| `e4a5ae7` | **496** | the ref every current lane is cut from |

Nothing is broken by this: no test pins either count, which is why the
tree could move under the figure without contradicting anything, and is
also precisely what T-080 is about. The cost is that **529 is now
quoted in three places and is wrong in two of them**, and the next
integrator deriving a delta against it will be 33 files out.

T-078 added a walk-table clause saying counts are printed and never
pinned, and stating both current figures — so the doc no longer teaches
the wrong number. The remaining ask is STATE's own line, which an
integrator owns: either correct the ref, or move the figure to the merge
it belongs to.
