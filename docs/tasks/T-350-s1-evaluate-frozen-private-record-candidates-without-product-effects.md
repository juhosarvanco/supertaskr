---
id: T-350-s1
title: Evaluate a frozen private record edit and derive its index bytes without product effects
feature: F-03
milestone: 4
priority: 1
size: M
tier: standard
status: building
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: [T-350]
touches: [tools/e2e/scripts/records.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/records-validation.mjs, tools/e2e/tests/records.spec.ts, tools/e2e/tests/docs-input-gate.spec.ts, tools/e2e/tests/records-validation.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
---

Prepared and independently reviewed as a bounded migration consumer at `7779cdbcee4c2162e3e14598312ff77c49b341ae`, 2026-10-24. One candidate-validation test cycle; size M. The legacy native executor route can build this source-disjoint slice while T-353 remains held. Dispatch still derives its actual keeper, tier, live ownership and grant. No T-353 exception or activation is granted by this card.

## Outcome and boundaries

Provide the pure candidate-evaluation part of the reviewed private validation/derivation contract. This slice can be independently useful before qualified mixed native execution: it evaluates proposed bytes, not workers or authority. It does not activate the private home, save a record, remove the existing ordinary census/index coupling, migrate app consumers, or declare the full consumer complete. Qualified local save owns private-index persistence; the product-independence consumer owns ordinary product census separation. Both retained duties remain required before activation.

## Finding and source reading

The delivered committed reader eagerly parses all cards before returning generic frozen-tree reads, so it cannot serve as the raw baseline for reporting unrelated historical malformed cards. Keep the strict reader contract, cold-import behavior, receipts and all existing admission consumers unchanged while factoring/reusing its canonical committed-byte capture. The pure parser already accepts in-memory files and provides canonical structural/reference/alias/cycle/assignment diagnostics; do not copy that grammar. The existing deterministic index renderer instead reads live filesystem bytes at one root, including a product-owned capability document, and therefore needs a candidate-byte source seam, including path enumeration/absence, not an all-records-root substitution.

Source-based prospective owners are the six literal paths in touches. Existing strict reader imports in admission, reservation, planning context and the brief are read-only dependency audit inputs; this card does not alter their contracts or widen into T353's native/brief/recovery scope. If preserving them actually requires another write, ask before changing it. The exact legacy T353 fence is disjoint from these source/spec paths. Its pending candidate and proof-exception pin remain unchanged and separate from this slice’s actual seed/candidate. Preserve the strict consumers this slice can affect; later combined-tree evidence inherits no earlier exact-candidate approval. Final behavior/import closure and live reservation checks remain owed.

## Acceptance criteria

- WHEN the pure candidate operation receives exact captured product and records identities/revisions, required literal baseline inputs and an explicit add/edit/delete overlay with regular-file bytes, types and modes, THEN it evaluates a detached frozen candidate and returns named diagnostics, deterministic affected private-index bytes and an identity of those same inputs. Evaluation uses neither a later HEAD/index/worktree nor implicit cwd, same-named nonselected root or absent-role fallback. Materialize required bytes before evaluation; a lazy reader that consults Git/filesystem during the supposedly pure phase does not satisfy this outcome. Existence and chapter enumeration use the same captured path/absence model.
- WHEN raw committed inputs contain malformed or duplicate historical cards, THEN the new evaluation path retains them and reports canonical baseline/candidate diagnostics rather than failing in the old strict-board parser or silently omitting them. Reuse the existing repository identity, object-format, association, regular-file and detached-byte machinery. Existing strict committed-board/task/context/admission consumers keep their original rejection timing, receipt semantics, import-time no-command/no-write behavior and explicit cold-loader behavior; the additive evaluator does not introduce a generated-parser dependency into their import path.
- WHEN proposed records introduce malformed data, duplicates, ambiguous identity, newly broken recognized references or a new dependency on an unusable historical target, THEN the result identifies the actual source/field/target and does not return an accepted output set. Compare canonical baseline/candidate failure identities including all affected participants and worsening debt, not totals or a broad code/id key: repairing one old issue cannot hide another new issue. Required context includes incoming references affected by deletion or identity changes. Unchanged unrelated debt remains named baseline debt rather than a blanket refusal of an otherwise valid edit; unavailable baseline/context is an explicit failure, never an empty issue set. Structural validity is not approval of intent, implementation or lifecycle evidence.
- WHEN the proposed edit affects the private generated index, THEN generation uses that same candidate plus explicitly classified selected product inputs and returns exact bytes without writing them. Preserve the current document/chapter ordering, missing/malformed-input refusals and deterministic rendering; the existing legacy filesystem renderer remains byte-compatible for equal inputs. Divergent same-named product and records documents, overlay chapter addition/deletion and a changed live tree must not select another origin or produce half-derived output. The existing ruled indexed set is not silently changed to avoid a product-owned input.
- AFTER committed inputs have been materialized, WHEN pure evaluation completes or fails, THEN records/product source, files, index, refs and HEAD remain unchanged, and it invokes no product census, suite, build, push, CI, dispatch, publication or grant consumption. The result is detached data and grants no write/dispatch authority. It creates no commit, save journal, execution lane or owner-authored manifest. Later persistence must recheck actual current authority/context; a successful pure result does not authorize changed bytes.
- WHEN the actual exported capture/evaluation/rendering entries are qualified over owned separate-repository fixtures, THEN cover valid card/foundation edits; unchanged malformed debt and repair; new malformed/duplicate data; referenced-ID deletion, issue-swapping, a new duplicate participant under an already duplicated ID and worsening existing reference debt; role-decoy and sibling-prefix roots; unsupported type/mode handling; chapter addition/deletion; and mutation/removal of live roots after frozen materialization. Observe real command/write/ref boundaries during the operation with discriminating product-effect controls. Also run the existing strict-capture and default-renderer regressions, including their actual public callers' required scopes. Broad source inventory/search alone is not qualification, and any additional required file is raised before writing it.
- Verification: preserve the existing independent role and decisive actual-site proof requirements, including exact restoration and honest proof limits, for the real new properties. This slice inherits no T351/T353 waiver and retries none of the automatically restricted T353 work. A successful read-only evaluator is not private save/backup, complete census separation, app composition or migration activation; retain those duties on the existing external contracts until their own qualified delivery.

## Implementation notes

<!-- Executor appends here. -->

## Verdicts

<!-- Fresh independent verifier appends here; no verdict exists. -->
