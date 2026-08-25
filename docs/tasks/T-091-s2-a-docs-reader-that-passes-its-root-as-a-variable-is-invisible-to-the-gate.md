---
id: T-091-s2
title: A docs reader that passes the repository root as a variable is invisible to the DOCS GATE, and only the zero-argument spelling is seen
status: suggested
suggested_by: executor claude-opus-5 @T-091
---

**MEASURED AT `d2bba71`, TWO RUNS OF THE SAME GATE OVER THE SAME TREE,
DIFFERING IN ONE CALL SPELLING.** T-091 added
`tools/e2e/tests/range-rule.spec.ts`, which reads `docs/CONVENTIONS.md`
and reds when that file changes — a docs reader by any reading of the
DOCS GATE's own definition. The gate could not see it:

| the spec's call | `npm run lint:docs` reader census |
|---|---|
| `conventionsText(ROOT)`, root held in a `const` | **12** readers — the spec is absent |
| `conventionsText()` | **13** readers — `tools/e2e/tests/range-rule.spec.ts [npm test from tools/e2e/] docs/CONVENTIONS.md (call conventionsText())` |

Nothing else changed. Both spellings read the same file from the same
root; the file was `git add`ed for both runs (`T-010-s10`); the census
line is quoted verbatim from the second.

**THE DERIVATION IS THE WHOLE POINT OF THIS GATE AND THIS IS A HOLE IN
IT.** The bullet says *"THE READER SET IS DERIVED FROM THE TREE, NEVER
LISTED — that is the whole mechanism, and a hand list is the defect T-058
and T-080 each spent a card on."* The CALL SITE arm is described as *"a
call that HANDS the repository root to a first-party function which spends
it on a docs path"* — and a root handed as `repoRoot` written out at the
call site is recognised while the identical root handed as a `const` bound
to it is not. **That is a rule about SPELLING wearing a rule about
BEHAVIOUR's clothes**, which is the same failure the site rule's first
half exists to prevent from the other direction.

**WHAT IT COSTS TODAY IS SMALL AND WHAT IT COSTS NEXT IS NOT.** The suite
`npm test from tools/e2e/` is already owed for `docs/CONVENTIONS.md`
through three other readers, so the gate's ANSWER did not move — only its
census. **The next reader written the natural way will be invisible in a
suite that is not otherwise owed, and then the answer does move.** Two of
the three incidents this gate exists for surfaced three layers from their
cause; an unlisted reader is that failure with the gate's own blessing.

**THE WORKAROUND IS SHIPPED AND IT IS THE WRONG KIND OF FIX.**
`range-rule.spec.ts` now calls `conventionsText()` with no argument on the
default path and passes the root only under the drill override, with a
comment saying why. **That is a shape nobody will know to copy**, and a
convention held by one comment in one file is the hand list this gate
refused, moved into the callers.

**DISPOSITION.** Widen the CALL SITE arm to follow a root through a
single local binding — the `const X = repoRoot` / `const X = env ?? repoRoot`
shapes — or state in `docs-scan.mjs`'s own header that only the literal
spelling is derived, so the limit is READ rather than discovered. Fence
`tools/e2e`. **Whichever is taken, it needs a planted reader in the
scan's own selftest**: this defect is invisible to every existing body
because every existing reader happens to be spelled the recognised way.
