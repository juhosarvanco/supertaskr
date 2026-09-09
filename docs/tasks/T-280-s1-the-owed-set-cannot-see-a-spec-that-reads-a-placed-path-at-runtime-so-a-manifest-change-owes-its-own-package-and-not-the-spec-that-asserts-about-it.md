---
id: T-280-s1
title: "The owed set cannot see a spec that READS a placed path at runtime, so a change to app/package.json owes the app suite and not landing-gate.spec.ts, which asserts about that file's contents"
feature: F-06
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-280, 2026-09-09, at a1bb590 + this lane's diff"
blocked_by: [T-280]
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-280's derivation has three arms and each is sound about the question
it answers. The gap is between two of them.

The IMPORT arm sees a spec that `import`s a file. The DOCS arm sees a
spec that READS a file, at runtime, with `readFileSync` — but only for
paths under `docs/`, because the docs gate's reader map is scoped to
`docs/` by construction. The PACKAGE-ROOT arm places everything else by
prefix. So a first-party path that is (a) inside some package root and
(b) read at runtime by a spec in a DIFFERENT package is placed by the
root arm alone, the placement succeeds, nothing fails closed, and the
spec that really asserts about it is not owed.

Measured at this lane's tip, `deriveOwed` over `["app/package.json"]`:

    suites: ["app"]   e2e: { whole: false, specs: [] }

and `tools/e2e/tests/landing-gate.spec.ts` reads that exact file twice —
once through `npmManifestDeps(readFileSync(path.join(repoRoot,
"app/package.json")))` and once asserting it still contains
`@supertaskr/parser`. A push that changed only that manifest would owe
the app suite and would not run the body that grades it.
`tools/e2e/tests/checkout-currency.spec.ts` reads
`tools/e2e/package.json` the same way; there the e2e leg is owed anyway
by the package root, but WHOLE rather than narrowed, so that instance is
safe by accident rather than by the rule.

THE CLASS IS NARROWER THAN IT LOOKS AND THAT IS WHY IT SURVIVED. A path
under NO package root that no spec imports is already unplaceable and
already fails closed to the whole battery — `.github/workflows/ci.yml`
is the worked example, and `workflow-parity.spec.ts` is protected by
that. The hole is exactly the paths the root arm CAN place, which is
what stops the fail-closed net from catching them.

Two candidate fixes, and the card should choose with evidence rather
than by taste:

- WIDEN THE READER MAP. `docs-scan.mjs` already finds read sites and
  resolves their roots; `docsShaped` is what confines the answer to
  `docs/`. A first-party reader map over every tracked path would place
  these directly, and would compose with the import arm exactly as the
  docs arm already does. Cost: the corpus walk becomes owed for more
  ranges than today, and the site calculus meets spellings it has never
  been asked about.
- FAIL CLOSED ON A RUNTIME READ. Cheaper and blunter: any spec-side
  runtime read of a first-party path outside `docs/` makes the
  end-to-end leg owed WHOLE. It cannot be short, and it gives up most of
  the narrowing for the specs that do it.

Whichever lands owes a body of the shape T-280's own DATA mutant has:
plant a runtime read in a fixture spec and watch the owed set grow.
