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

### Criteria echo before implementation

- [x] Capture exact selected repository identities/revisions and all required literal bytes/path absence before pure overlay evaluation; return diagnostics, affected index bytes and matching input identity.
- [x] Retain malformed/duplicate historical cards through additive raw capture while preserving strict readers, receipt timing and cold imports without generated parser loading.
- [x] Reuse canonical validation and compare full baseline/candidate issue identities, participants and worsening reference debt; reject newly unusable dependencies and retain incoming context.
- [x] Render the existing ruled index set from the same candidate with explicit product-input origins and captured chapter enumeration; preserve legacy byte output and refusals.
- [x] Demonstrate detached evaluation performs no commands/writes or authority/product actions after materialization, on success and failure.
- [x] Qualify actual exported entries with separate repositories, origin decoys, unsupported entries, historical debt, overlay chapters and removed live roots; run strict-reader/default-renderer public-caller regressions.
- [x] Preserve independent verification, decisive actual-site drills with SHA256 restoration and honest limitations; deliver no persistence, activation or inherited T351/T353 exception.


### Implementation

Added `captureRawCommittedInputs` beneath the unchanged strict capture path, plus eager `captureRecordCandidateInputs` and pure `evaluateRecordCandidate` in the additive validator module. Materialization retains canonical repository receipts, complete path/type/mode inventories and all required model/index bytes; the evaluator owns no lazy reader. Explicit overlays reject unsupported entries, ambiguous operations and unselected origins. Parser findings are compared by full stable identities with occurrence counts, and retained unusable targets or unavailable feature context remain named reference debt. Accepted results contain detached affected index bytes and input identities, with an explicit no-authority limit.

`renderDocsIndexFromSource` and `ruledIndexedDocsFromText` reuse the existing index grammar and ordering. CAPABILITIES is explicitly product-owned; model documents, ruling and chapters remain selected records inputs. The legacy filesystem renderer retains visible filesystem reads for the docs-input census and renders through the same pure entry. No existing strict consumer imports the new parser-dependent module.

Exploratory checks before the committed drill candidate: package setup/build succeeded; initial evaluator qualification 6/6; strict capture, default renderer, planning context, admission and reservation regressions 135/135; after hardening, evaluator and strict records regressions 17/17 and e2e typecheck passed. These are development readings, not the final committed grade. Independent verification, persistence, census separation, app composition and activation remain external duties; no T351/T353 exception or retry was used.

In-fence follow-through: none outside the stated acceptance criteria. Generated census/index/graph artifacts outside this fence are not written by this lane; currency is reported for the integrator.

### Self-drill block at implementation candidate `4bc195009cf8e2808f92d0da9a5d4a761c2db5f6`

An owned independent local clone, detached at the named candidate, was built and baseline-tested. Its Git common directory differs from the source; no alternates exist, and all 4831 matching object files were checked for independent inodes. The initial clone at `150bd3320526749d6fdb22f049abe41afff6e8dd` was unused setup and remains separate. The drill-location ask was answered and acknowledged before relevant work. No shared worktree, source lane, authority or T353 proof was mutated.

Every row below was planted at the actual implementation/data site, read back as a diff, and run against the named body only: each command exited 1 with exactly one failed body. Baseline and restored runs each passed all six bodies, exit 0. All mutations were restored exactly, with the subject's full SHA256 equal before/after and an empty explicit HEAD-to-worktree subject diff. Complete attempted diffs, command logs and per-mutation hashes are retained in the lane-named OS scratch `drill-T-350-s1-final-pii1ml3f`.

| Mutant | Actual changed property | New body |
|---|---|---|
| M1 | Product capability origin changed to records | frozen candidates |
| M2 | Raw capture re-enabled strict eager card rejection | historical debt |
| M3 | Unusable retained target finding disabled | historical debt |
| M4 | Full issue identities collapsed to kind/id | failure identities |
| M5 | Reference occurrence consumption disabled | failure identities |
| M6 | Regular overlay mode guard removed | input modes |
| M7 | Non-tree namespace refusal disabled | input modes |
| M8 | Captured chapter enumeration removed | captured renderer |
| M9 | Malformed input byte identity removed | historical debt |
| M10 | Unavailable reference-space finding disabled | historical debt |
| M11 | Eager content replaced by lazy committed reader | frozen candidates |
| M12 | Write inserted at pure exported evaluation entry | effect boundary |
| M13 | Command inserted at pure exported evaluation entry | effect boundary |

Restoration SHA256: `records.mjs` = `c6076c10310728507edf04a8f5a2d030542a663121c08a1dc9267bfeb1812aba`; `docs-scan.mjs` = `d8d40fce8ce3ea865986e62dcc30be5ba3072d3df2923b389c3aa9413801068e`; `records-validation.mjs` = `c1b85d6b8b54e74d55a8ef715e15c8311ac84bab45cd17846f9f41a589deacce`. The spec stayed at `d5fab36e6d68bda8d829b8d43150e3b2918f7034d1d19aea072c90260abfcfe9`. M12/M13 show the command/write controls fail against an implementation that actually violates purity, with all effects confined to fixtures. These are T350s1 self-drills; independent verification is still owed.

### Required reading and limits before the final grade

The range from seed `520d30663dd0c76d90d923da087d1494267d36a0` derives app, parser and e2e with 30 spec files, no unplaceable path and no Rust leg. The first substantive notes commit carried the same implementation/spec bytes as the drill candidate. Its interrupted grade and subsequent bounded correction are recorded below. The corrected committed candidate must complete the blessed range runner; actual graded ref, counts and exits are reported at handoff. The last status-only verifying commit is exempt and will re-run nothing.

Standing gate derivation over the five changed paths: docs gate FIRES for the task notes (exit 1 meaning suites owed, not a failed suite); graph regeneration is integrator-owned because the new spec is TypeScript; boot and method eval triggers do not fire. Docs gate reports no unlinked root or package-relative site and valid live-card frontmatter. Currency check at the drill candidate exits 1 because CAPABILITIES is stale: 139631 committed bytes versus 140407 freshly derived bytes. It was not regenerated inside this fence. Index rendering remains covered by the existing default-renderer regressions. The integrator must regenerate the generated census/graph outputs at the merged tree.

Brief corrections: the generated template's Claude default is not the actual gpt-6.1-sol/xhigh assignment; the keeper graded nothing when new-file ownership was unplaceable, so standard tier is the independently derived classification, not a keeper pass. The standing read is STATE then INDEX, and only the role's ceremony-table addition is read from TASK-FORMAT. Every subsequent shell explicitly entered the armed source resource. The source worktree started without installs/builds and the documented setup order was performed. No other owner or additional approval was manufactured.

### Bounded correction after actual counterexamples

The required grade at `d9edee7281d45826c32bf97ba400eb6ef66d19e7` was interrupted after actual exported-entry counterexamples established two defects. Parser completed 469 passing bodies and app completed 1171. E2e had a partial 975 passing reading but no completed summary: the graded result was REFUSED (`exit=-1`, `bodies=0`, `reason=zero-bodies`), and the aggregate runner exited 3. This is partial evidence, never a GREEN or a waiver. Every owned runner, test worker and web-server process actually ceased before source repair; the final cessation observation records no remaining process and no SIGKILL sent. The original grade and counterexample evidence remain retained rather than overwritten.

Derived reference findings previously aggregated independent canonical target/context issues into one identity. Repairing one of two target issues, removing one of three duplicate participants with an existing incoming reference, or repairing one of two unavailable-context issues then looked like a new aggregate. Derived findings now preserve one complete canonical issue per target/context finding. Full canonical participant identities and occurrence subtraction remain intact. The new positive controls permit those partial repairs; negative controls reject same-count issue swaps, a fourth duplicate participant, a replacement participant and a new reference to a historically unusable duplicate target.

Rejected overlay metadata previously retained caller objects and could throw while freezing a nonempty typed array or freeze a caller's plain object. Supplied metadata is now copied under guarded processing before the result is frozen; unsupported byte metadata retains its exact digest. Actual exported-entry controls return named rejection for the typed array and leave nested plain objects mutable. A same-roots/revisions old-versus-corrected comparison confirms exact valid-input identity, digest and output bytes are unchanged. This correction does not broaden the contract into arbitrary JavaScript execution defense.

Correction development qualification: e2e typecheck exits 0 and all six evaluator bodies pass; owned side-by-side fixture controls pass. These are targeted readings before the new committed grade. The original 13 actual-site self-drills remain evidence at their named earlier candidate; changed-property correction drills and exact restoration are recorded separately before the new grade. No source outside the existing fence, setup repeat, authority edit or T353 retry was needed.

## Verdicts

<!-- Fresh independent verifier appends here; no verdict exists. -->
