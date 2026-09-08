---
id: T-276
title: tools/method-evals is under NO typecheck although every sibling package is, and it carries two real JSDoc errors today — the gate that judges the method text is the one package nothing type-checks
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s1, 2026-09-09
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: none found. DISPOSITION HINT: **promote at size S, but
read the tension first** — the fix must not cost the suite its
zero-dependency property, which is load-bearing.

## The finding

`tools/e2e/tsconfig.json` runs with `allowJs` + `checkJs` over
`scripts/**/*.mjs`, so every `.mjs` gate in that package is checked
against its own JSDoc — `T-061`'s card says why: *"a wrong `@param`
silently mistyped the spec's expectations, and the annotations on a
merge gate's kill path were load-bearing and unverified."*
`tools/method-evals` is written in exactly that style, is exactly that
kind of gate, and its `include` list reaches none of it.

Measured at `4de3675` by pointing `tools/e2e`'s own `tsc` at
`tools/method-evals/**/*.mjs` with the same compiler options:

    tools/method-evals/evals/mf-05-vocabularies.mjs(60,10): error TS2532: Object is possibly 'undefined'.
    tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs(203,17): error TS7006: Parameter 'rel' implicitly has an 'any' type.

Both are pre-existing and neither is a runtime defect today; that is the
point — nothing would have told anyone.

## The tension the card must not resolve carelessly

`tools/method-evals/run.mjs`'s header says the suite is zero-dependency
**deliberately**, so it runs against a bare checkout with no
`node_modules` anywhere — the same property that lets the token lint be
CI's first step. A typecheck needs `typescript` and `@types/node`. So the
check must be a step that BORROWS `tools/e2e`'s installed toolchain (a
config with an explicit `typeRoots`, which is how the measurement above
was taken) rather than anything the suite itself imports. The suite must
stay runnable with nothing installed.
