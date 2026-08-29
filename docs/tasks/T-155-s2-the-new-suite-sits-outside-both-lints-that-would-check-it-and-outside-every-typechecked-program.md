---
id: T-155-s2
title: The new suite sits outside the TOKEN lint's corpus and outside every typechecked program
status: suggested
suggested_by: executor claude-opus-5 @T-155
---

`tools/method-evals/` is checked by exactly one of the three things that
check comparable code in this repository, and the gap is a walk boundary
rather than an oversight anybody made.

**TOKEN (P1–P4, P6) DOES NOT SEE IT.** `TOKEN_ROOTS` in
`tools/e2e/scripts/token-scan.mjs` is `["app/src", "app/test",
"tools/e2e"]`, with `MUST_TOKEN_COVER` deliberately a SECOND list holding
the same three so a quiet deletion reds against something that did not
move with it. `tools/method-evals` is in neither, so the suite's `.mjs`
files are outside the corpus that catches a hard-coded colour, an
ungated motion utility or a smart quote. **CONTROL (P5) DOES see it** —
that arm derives from `git ls-files`, so every tracked text file is in it
(verified at this lane's tip: `lint:tokens` exit 0 with the suite
staged). So the gap is precise: raw bytes are guarded, string CONTENT is
not.

**NO TYPECHECKER READS IT EITHER.** `tools/e2e/tsconfig.json` turns
`checkJs` on and includes `scripts/**/*.mjs` as a GLOB — T-061's fix, so
a wrong `@param` on a gate's kill path reds rather than being read as
documentation. Its `include` is scoped to that package, so
`tools/method-evals/**` is annotated with JSDoc that nothing verifies.
The annotations there are load-bearing in the same way T-061 argued:
the eval descriptors are a typed contract between the harness and ten
modules.

**TAKING IT.** Add `tools/method-evals` to `TOKEN_ROOTS` and to
`MUST_TOKEN_COVER` (both, or the second list stops being a requirement),
and either extend `tools/e2e/tsconfig.json`'s `include` or give
`tools/method-evals` a tsconfig of its own. **PREFER EXTENDING THE
EXISTING ONE**: a second tsconfig means a second typescript
devDependency and a second `npm ci`, which would cost the new suite the
zero-install property that lets it answer against a bare checkout — the
one property CI wiring (`T-155-s1`) depends on. Both files are under
`tools/e2e`, which T-155's fence
(`[tools/method-evals, docs/CONVENTIONS.md]`) did not reach.

**CHECK BEFORE ASSUMING IT IS CLEAN.** The suite's fixtures deliberately
contain prose that looks like defects — a planted vacuous assertion, four
recorded transcripts of seats failing. Widening TOKEN's walk to cover
them may surface hits that are fixture CONTENT rather than defects, and
the honest resolution is a walk boundary argued in code, never an
allowlist entry: `token-scan.mjs`'s own header says it keeps ZERO
allowlist and means it.
