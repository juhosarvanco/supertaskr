---
id: T-350-s1
title: Evaluate a frozen private record edit and derive its index bytes without product effects
feature: F-03
milestone: 4
priority: 1
size: M
tier: standard
status: done
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

### Correction self-drills at `3d2e57cb3da9a278f5f8a5097ab456c38b7eb261`

A fresh owned local clone detached at this committed correction had an independent common directory, no alternates and 4849 matching object files verified to use different inodes. Setup completed in parser, app, e2e order. Baseline and restored runs each passed all six bodies, exit 0. Seven actual-site mutations each exited 1 with exactly one selected failed body, at the intended assertion:

| Mutant | Actual changed property | Observed failed assertion |
|---|---|---|
| R1 | Restore aggregate target findings | Partial target repair must be accepted |
| R2 | Restore aggregate target findings | Delete one of three historical duplicate participants must be accepted |
| R3 | Restore aggregate unavailable-context findings | Partial context repair must be accepted |
| R4 | Retain raw typed metadata | Nonempty typed-array freeze throws instead of named rejection |
| R5 | Retain raw plain-object metadata | Caller metadata must remain unfrozen |
| R6 | Collapse full issue identity to kind/id | Same-target/new-source issue swap must be rejected |
| R7 | Disable occurrence subtraction | Worsening reference occurrence must be introduced |

Each planted source diff was retained and read back; after every mutation the source SHA256 matched the original and the explicit HEAD-to-worktree source diff was empty. Final clone HEAD and clean status matched the candidate. Correction evidence is retained in lane-named OS scratch `drill-T-350-s1-correction-4_ukhg2x`; the driver ceased exit 0. Validator restoration SHA256 is `878aec762de7d363556b2a0e974684088246b98cdd663c58735ecb6fb3c4ac61`; unchanged corrected spec SHA256 is `4c1d98a263cc80f0033fc9aefaf2742917265cee8fd2154ce65cf60e52f8f058`. The original records and renderer hashes remain those in the earlier drill block. These are self-qualification, not independent verification.

### Typed causal correction at `b3a0a9636ff0f45cbdd07c751c538ef9a443bcf7`

A further actual exported-entry witness established that deleting the first of three historical duplicate participants changes canonical first-anchor pairs AB/AC into BC. The evaluator incorrectly reported BC and its existing incoming reference as introduced debt. The b3cd required run was therefore stopped through its owned normal lifecycle: parser 469 and app 1171 passed, but e2e remained an interrupted 976-passing observation, with REFUSED `exit=-1`, `bodies=0`, `reason=zero-bodies`; aggregate exit 3. All owned processes, including the orphan worker and web group, actually ceased before repair; SIGTERM completed and the guarded escalation sent no SIGKILL. Neither interrupted e2e run supplies a completed baseline or an exact-candidate GREEN.

The normal anchor-grading ask was answered and acknowledged. The final substantive tree still owes the blessed approved seed-to-final range, not a delta-only composition over the interrupted b3cd result. No waiver, fence expansion, parser API edit or T353 retry was used.

Typed-source inventory distinguished duplicate-id (space/id/first-file pair), aliased-id (space/aligned participant group), dependency-cycle (field/aligned SCC), and ambiguous-mapping (already every actual component/pattern pair). Feature records expose file/id/name/description/line. Canonical diagnostic display remains intact. Comparison uses complete typed participant multisets for established duplicate/alias groups, supported by ONE complete historical group, and actual directed cyclic reference occurrences from reported SCCs. Feature payloads and repeated declarations remain distinct; line is provenance rather than semantic identity. All ordinary canonical issues, including nearMiss hints, assignment readings and ambiguous-mapping patterns, retain their complete identities and multiplicities. No prose is parsed and no grammar is copied.

Reference occurrences are compared independently by exact source/field/ID so reduced target/context debt cannot pay for another dependency occurrence. Target membership and normalized debt support remain explicit. Shared derived display is coalesced per actual canonical issue within each reference occurrence; individual group payload and occurrence facts are retained. Unit-specific reporting selects the actual duplicate/alias/cycle cause rather than an unrelated ordinary target issue. Participant lookup and shared feature context avoid quadratic duplicate-pair and reference/target/diagnostic expansion.

A separate actual b3cd-equivalent exported-entry witness confirmed that a rejected null overlay falsely called two baseline findings resolved without evaluating a candidate. Resolved reporting now requires completed candidate diagnostics. A later rendering refusal still retains genuine evaluated findings; it does not erase them or accept output.

At the named correction source, e2e typecheck exits 0 and the ten evaluator bodies pass (11.1 seconds). Their retained 48 exported semantic cases comprise 25 positives and 23 negatives, all matching: first/middle/last record removals, retained incoming references, alias and SCC shrink, feature line shifts/reordering, identical declaration multiplicity, replacement/fourth participants, new references, shrinking-debt plus extra reference occurrences, ordinary issue swaps, and mixed ordinary/group cause reporting. Earlier typed/plain metadata controls pass; an old-versus-corrected same-root/revision foundation edit confirms unchanged valid identity, digest and nonempty output bytes. These are focused readings before the required final grade, not a replacement for it. Preliminary packet-only reviews informed the repair; fresh independent phase two remains owed.

### Typed-cause self-drills at `b3a0a9636ff0f45cbdd07c751c538ef9a443bcf7`

The owned independent local clone `drill-T-350-s1-semantic-cdi5o80a` was detached at this commit. Common directories differ, no alternates exist, and 4864 matching object files have independent inodes. Its own parser/app/e2e setup completed in order, all exits 0. Baseline and restored runs each passed all ten bodies, exit 0. Every following actual-site mutation was diffed/read back, ran only its named body, exited 1 with exactly one failed body, and was restored exactly before the next mutation:

| Mutant | Actual property removed | Observed failing control |
|---|---|---|
| S1 | Duplicate/alias causal normalization | First task duplicate participant removal |
| S2 | Duplicate/alias causal normalization | Historical task alias shrink |
| S3 | Feature causal normalization | Feature declaration payload swap |
| S4 | SCC cyclic-reference causes | First SCC participant removal with retained references |
| S5 | Record participant file identity | Same-count replacement participant |
| S6 | Feature declaration payload identity | Same-count feature payload swap |
| S7 | Treat feature line as semantic identity | First feature declaration removal |
| S8 | Consume matched occurrence counts | Shrinking duplicate group plus extra reference occurrence |
| S9 | Candidate-completion resolution guard | Invalid overlay must resolve no unevaluated debt |
| S10 | Mark diagnostics complete only after rendering | Late rendering refusal must retain evaluated repairs |
| S11 | Unit-specific reference cause selection | Mixed ordinary/group debt must name duplicate cause |
| S12 | Complete ordinary issue identity | Same-target/new-source issue swap |

Each mutation's full SHA256 restored to `a76cc86e84cdbd91e47227251c9267280b527d1d24da07bec58d6efb3bb6b615`, with an empty explicit HEAD-to-worktree subject diff. The spec remained `67ac1d5cdf530e5a1a13680e6376f5f05465297c474a447714e0acc14e246d4d`. Final clone HEAD and clean status matched the named candidate; the driver ceased exit 0. Original records/renderer hashes remain those in the first drill block. Complete actual diffs, logs and restoration hashes remain retained in the lane-named clone scratch; the earlier 13 plus 7 drills remain evidence at their own named candidates. No independent approval is claimed from these self-drills.


### First-rejection repair criteria echo

The same original attempt adopted the exact descendant verifier body/verdict tip `c32a7b0549cb276f8328da8ef4c972ff24e1e9df` by verified clean fast-forward. The REJECTED verdict remains unchanged. Its two BOM compatibility findings are the bounded repair; the frozen contract, original seed and six source/spec owners are unchanged.

- [x] Preserve exact captured BOM bytes in candidate text while retaining eager frozen identities, path absence and detached evaluation.
- [x] Preserve strict raw/board/context/admission decoding behavior and cold-import boundaries; change only the additive evaluator's retained text.
- [x] Preserve canonical diagnostics, semantic historical-debt comparison and fatal invalid-UTF8 refusal.
- [x] Preserve the legacy renderer's BOM refusal for both captured and overlay documents through the two exact decoding corrections.
- [x] Preserve the evaluator's no-command/no-write/no-authority behavior.
- [x] Reuse committed VC1/VC2 and qualify all twelve evaluator bodies plus legacy renderer controls before the required range grade.
- [x] At a committed fixed candidate, separately remove each correction in a new owned independent local clone, require the named semantic RED, prove exact SHA256 restoration, and retain fresh independent verification as owed.



### First-rejection correction qualification

Applied only the two exact corrections assigned by the retained verdict: candidate materialization obtains text from the already validated retained bytes with `bytes.toString("utf8")`; overlay decoding retains fatal UTF8 validation and sets `ignoreBOM: true`. The strict committed reader's helper and the filesystem renderer are unchanged. The evaluator SHA256 is `324a59095b3720cd8648c23871732a352814307094339e9e49cee9e4f9de033e`, equal to the independent proof comparison point; equality is not a substitute for this lane's qualification. The unchanged VC1/VC2 spec SHA256 is `ef4b7115e0c7efbfb4521b2e381072772ce8d28fa9d08bdbd6c7b987bf29e1b7`.

The failure class is normalization of retained bytes at additive UTF8 decoding seams. A bounded sweep inspected the two evaluator seams, the existing strict UTF8 helper and the filesystem renderer. Its exact old-site searches each find one hit in the adopted production reference and zero after correction; the two fixed sites each occur once. The unchanged strict helper deliberately retains its old behavior. No other decoding, validation, rendering or authority semantics were changed.

Normal ignored parser and app builds exited 0 before qualification. Against the adopted c32 production bytes, with only repair-planning notes dirty, the twelve-body evaluator run exited 1: the original ten passed and only VC1/VC2 failed their named acceptance assertions. After correction, typecheck exited 0 and all twelve bodies passed in 9.4 seconds. The legacy-renderer invocation accidentally passed its grep option to npm, expanding the selection to all 74 docs-input bodies. Actual Playwright exit was 0, all 74 passed in 1.4 minutes, including both intended renderer controls. The wrapper's expected-two-body assertion then exited 1; this is a retained selection/count error, not a product failure or a required-range grade. No repeat was run.

The original rejected verdict and all prior readings remain unchanged. This committed correction still owes its own separate correction-removal self-drills, original seed-to-final required range and fresh independent verification. The approved seed remains `520d30663dd0c76d90d923da087d1494267d36a0`; the old GREEN does not qualify this repaired tree.



### First-rejection correction self-drills at `2a158ccf2ff6b3039f9a0bb9d253840fe4b29af2`

A new owned disposable local clone, `drill-T-350-s1-bom-repair-zwe7vdt7`, was detached at this committed fix. Its Git common directory is separate, it has no alternates, and all 4900 matching object files have independent inodes. The six subject bytes match that reference. Clone-local parser/app/e2e installs and ordered parser/app builds all exited 0; no prior clone or existing checkout was changed.

The baseline and final restored evaluator runs each passed all twelve bodies, exit 0. The two exact actual-site correction removals were planted separately; each actual source diff was retained and read before the full twelve-body invocation. The direct Playwright CLI preserved the intended selection:

| Removal | Actual production site | Observed result |
|---|---|---|
| VC1 | Remove retained-byte text preservation at capture materialization only | Exit 1; only VC1 fails its named captured-BOM acceptance assertion, with 11 other bodies passing |
| VC2 | Remove overlay decoder ignoreBOM option only | Exit 1; only VC2 fails its named overlay-BOM acceptance assertion, with 11 other bodies passing |

After each removal, explicit restoration from the named reference produced evaluator SHA256 `324a59095b3720cd8648c23871732a352814307094339e9e49cee9e4f9de033e` and an empty reference-to-worktree subject diff. The unchanged spec remained `ef4b7115e0c7efbfb4521b2e381072772ce8d28fa9d08bdbd6c7b987bf29e1b7`. All six subject hashes, clone HEAD and clean status matched at completion. Full logs, actual mutant diffs, command exits and restoration receipts remain in that lane-named scratch. Every owned setup/test job actually ceased; the recorded process check found none and lane port 15350 was free. These are this lane's self-drills, not independent approval.

The ordinary first-rejection repair continues the original attempt and original seed. The final substantive code and notes still owe the actual `520d30663dd0c76d90d923da087d1494267d36a0`-to-repaired-tip blessed range, derived after this commit; no earlier GREEN or expected RED is reused as that grade. Generated census/index/graph updates remain outside this fence and integrator-owned. No persistence, migration activation, authority/grant change or T353 proof was attempted.

Current brief corrections: the continued worktree already had its installed dependencies, unlike the original fresh-cut live facts; its normal ignored parser and app prerequisites were nevertheless rebuilt successfully. The generated historical model/default and live facts remain historical, not a new assignment. One oversized combined brief read was explicitly re-read in bounded chunks. The first repair-ask extraction also displayed prior protocol questions/answers and verifier procedural metadata; this was disclosed to the coordinator, and no phase-one attack artifact/content was opened. The rejected verdict is preserved byte-for-byte. Fresh independent phase two remains owed after this lane's repaired grade.


## Verdicts

<!-- Fresh independent verifier appends here; no verdict exists. -->

### 2026-10-24 — REJECTED — requested-gpt-6.1-sol@01a16cb2-94d7-7c02-898b-51b20527f1d4

Judged candidate `ffea1d8dd78dedabde6cccc7f92759ef84259bad` against original base `520d30663dd0c76d90d923da087d1494267d36a0`, standard tier. Reject criterion 4: both new byte-to-text seams erase a leading UTF-8 BOM and accept a document the existing filesystem renderer refuses. Two assigned corrections, two committed regression bodies, and two mutant blocks below; implementation remains unchanged on this verifier bench.

**Frame and custody.** Fresh registered phase two, attempt `T-350-s1-a2`, native identity `01a16cb2-94d7-7c02-898b-51b20527f1d4`, detached-verifier profile, explicitly bound to the supplied candidate resource. Requested model/effort: GPT-6.1 Sol/xhigh; provider-observed model and usage: unknown. The saved phase-one attack describes its actual coordinator-selected frozen packet and procedural tool boundary, rather than complete generated-role delivery or mechanical tool removal. This seat read the sealed contract/attacks and source diff before candidate executor notes; no candidate executor notes, reports, conversation or commit subjects were displayed.

There were procedural faults, retained rather than erased. The first resource-prefix spelling was refused before any brief content executed; checked continuation and exact same-identity rebind preceded resumed tools. The supplement named a noncanonical ask path; the coordinator corrected it, and this seat appended/acknowledged only its own new question/answer in the actual protocol file. During preparation checking, tool output `7b9ce9` accidentally serialized nested preparation authority: the frozen original-base card, empty Implementation notes/Verdicts placeholders, and admission/fence metadata were displayed after source orientation had begun. That breached the display restriction; it exposed no candidate executor reasoning. The coordinator retained and reviewed the actual output. This is not a claim of an untouched packet boundary.

A second correction to the procedural account: this seat initially called yielded command sessions callback-closed. The coordinator later observed proof session 6727's actual Bash entry still INFLIGHT. Yield did not establish native callback cessation. After actual final result collection, the coordinator's public-state read reported `native.inflight=[]`, `activeHolds=[]`, `ownedJobs=[]`, and actual PostCallback at `2026-10-24T08:54:38.802Z`. No completion callback was manufactured. The earlier callback-idle claims and root inspection windows are retained as such; process completion and native callback completion are separate observations.

**Seals checked privately against saved bytes.** Attack SHA256 `5fe767764142328adf2b9007353b75877ff7188624a801affdcc5aa0d217f7fb`; ground SHA256 `ae400125aa44a91d1f18b41c7b2172099ba238bcb10f77d68cd346e974788404`; raw original-base card SHA256 `50f89e6bae3b0f199213c592a90647828345128f3fbadb06fca24371e791e20f`. Task/base/candidate, prepared profile/resource and the six frozen source/spec owners matched the supplied preparation. Raw base card bytes were hashed without displaying its private fields during that integrity operation; the later accidental display is disclosed above.

| Criterion | Finding and deciding evidence |
|---|---|
| 1 — frozen identities, explicit overlay, detached evaluation | The original candidate's ten-body records-validation spec passed. Its frozen-root body exercises exact role revisions, divergent origins, live changes/removal, byte detachment and repeated identity. Actual-site wrong-origin, live-read and shared-output-buffer mutants killed the corresponding checks. BOM decoding remains the separate failure under criterion 4. |
| 2 — historical raw debt and unchanged strict consumers | Raw historical malformed bytes and duplicate participants survive the additive capture. Existing strict capture still rejects by name. The original-base owed e2e range passed 1,321 bodies, including records, records-context, qualified-admission, qualified-reservation and brief callers, and the cold-import controls. Forcing raw capture back through strict parsing killed the historical-debt checks. |
| 3 — canonical failure identity, incoming references, worsening debt | The actual exported evaluator's malformed/duplicate, deletion, source/target issue swap, occurrence, typed duplicate/alias/SCC and feature-participant matrices passed on the candidate. Dropping canonical diagnostics, replacing comparison with broad kind/id keys, and blanket baseline-debt refusal each caused semantic failures. These are measured fixtures and kill sets, not a claim that every diagnostic shape was exhaustively explored. |
| 4 — exact compatible index derivation and refusal behavior | **FAIL.** A BOM-prefixed `docs/ARCHITECTURE.md` produces the legacy `has no top-level heading` refusal. Both a committed capture and an overlay instead return `accepted: true`; the overlay returns generated index bytes. VC1 and VC2 below are independently RED on the actual candidate and GREEN with the respective decoding corrections. Existing plain-byte renderer compatibility, chapter add/delete, order and atomic-refusal tests passed; reversing the actual chapter rendering order killed its ordering assertion. |
| 5 — no product effects or authority | The success/failure effect body passed with command, selected sync/promises filesystem and ref/index/HEAD observations. An actual evaluator-site invocation of the owned clone's capabilities checker killed that body with `EFFECT spawnSync`. Its observation starts after materialization; it is not an OS-wide syscall trace or a proof of every native/delayed channel. No evaluator persistence, dispatch, journal, grant or activation authority is claimed. |
| 6 — actual entries, owned separate roots, caller regressions | The original ten-body qualification uses actual exported capture/evaluate/render entries and separate owned product/records fixtures, including conflicting same-named inputs and sibling prefixes. Named invalid modes/types/context, debt, reference, chapter and removed-root cases passed, as did all 1,321 original-base e2e bodies. The added BOM cases expose missing byte-compatibility coverage and fail the candidate. |
| 7 — independent proof, restoration and honest limits | Seals/frame and breaches are stated above. Eleven actual-site semantic mutants were killed: ten full ten-body runs and a selected one-body prohibited-census run. Baseline/restored candidate runs were GREEN over ten. The final correction proof is separately pinned to disposable local reference `629e5862b35f4717d6d1b0e51319ba67ce0f6ac9`, described below. No T-351/T-353 proof retry or waiver was used; private save/backup, product census separation, app composition and activation remain external duties. |

**Graded boundaries and setup evidence.** At the candidate, the blessed command was `SUPERTASKR_E2E_PORT=25350 node tools/e2e/scripts/gate-run.mjs e2e --range 520d30663dd0c76d90d923da087d1494267d36a0..ffea1d8dd78dedabde6cccc7f92759ef84259bad`. The actual derivation owed parser, app and e2e over thirty specs, not Rust. Parser: GREEN, 469 bodies. E2e: GREEN, 1,321 bodies. App: RED, 1,171 executed, fourteen failures, each explicitly absent ignored `app/dist/assets`; this verifier omitted the build prerequisite, so that app result is unqualified setup evidence, not a candidate defect. E2e output ended at `2026-10-24T08:32:57.355Z` and the token was written at `08:32:57.406Z`; cessation of the recorded process tree was observed at `08:47:01 UTC`, not asserted at the earlier write instant. The normal ignored app build subsequently exited zero. Checks owed by this verdict/body work are separately derived from the candidate to the owned final tip and reported at completion; the unbuilt app RED is not reused as qualification. No graded-final-evidence exemption is invoked for changed executable test bodies.

**Proof custody and restoration.** The disposable clone has its own Git common directory, no alternates, copied non-hardlinked objects and clone-local dependencies. An initial zero-body dependency-link refusal was retained and never counted as qualification. Proof logs, actual diffs, body source and result metadata are retained under its `target/proof-T-350-s1/`. At named fixed proof reference `629e5862b35f4717d6d1b0e51319ba67ce0f6ac9`, baseline and restored runs were GREEN over twelve bodies. Each block's actual `git diff` was read; planting it executed the full twelve-body spec and redded its named body alone. After each restoration the production file matched the named reference with SHA256 `324a59095b3720cd8648c23871732a352814307094339e9e49cee9e4f9de033e`. The clone was then reset to the original candidate; all six saved subject hashes matched and its original ten-body qualification passed again. In particular, restored candidate evaluator SHA256 is `a76cc86e84cdbd91e47227251c9267280b527d1d24da07bec58d6efb3bb6b615`.

**Class, sweep and security.** The failure class is normalization of exact retained bytes at an additive decoding seam. The sweep covered `records-validation.mjs` retention and overlay decoding, the existing `records.mjs` UTF-8 helper, and `docs-scan.mjs` filesystem rendering. The new capture inherits the helper's BOM stripping; its fix must use the retained validated bytes without altering strict-consumer behavior. Overlay decoding needs the matching preservation. Path/role/mode checks, Git argument boundaries, parser reuse, import closure, dependencies and the source diff were inspected; no new endpoint, dependency, secret or additional security finding was identified. Capability generation is STALE at the candidate (committed 139631 bytes versus generated 140930); the owning integrator must regenerate after source/test corrections. Direct graph currency was not measured here, and no graph regeneration or migration completion is claimed.

#### Correction 1 — Preserve captured document bytes at candidate materialization

Body: `T-350-s1 VC1 — captured document bytes retain the legacy BOM refusal`. A valid fixture first renders normally; after committing BOM-prefixed architecture bytes the unchanged legacy renderer refuses, while the candidate currently accepts. Preserve the BOM when obtaining candidate text from the already validated retained bytes. The candidate RED, minimal-fix GREEN, named-reference mutant-alone RED and exact restoration are retained.

```mutant
correction: Preserve captured document bytes at candidate materialization
file: tools/e2e/scripts/records-validation.mjs
spec: tools/e2e/tests/records-validation.spec.ts
body: T-350-s1 VC1 — captured document bytes retain the legacy BOM refusal
message: captured BOM document must retain legacy renderer refusal
--- old
    inputs.set(key(role, relativePath), { ...selected, content: selected.bytes.toString("utf8"), type: "blob", bytes: selected.bytes });
--- new
    inputs.set(key(role, relativePath), { ...selected, type: "blob", bytes: selected.bytes });
```

#### Correction 2 — Preserve overlay document bytes while validating UTF-8

Body: `T-350-s1 VC2 — overlay document bytes retain the legacy BOM refusal`. A frozen valid fixture and the same BOM document distinguish the legacy refusal from the overlay's current accepted generated output. Preserve the BOM while retaining fatal UTF-8 validation. The candidate RED, minimal-fix GREEN, named-reference mutant-alone RED and exact restoration are retained.

```mutant
correction: Preserve overlay document bytes while validating UTF-8
file: tools/e2e/scripts/records-validation.mjs
spec: tools/e2e/tests/records-validation.spec.ts
body: T-350-s1 VC2 — overlay document bytes retain the legacy BOM refusal
message: overlay BOM document must retain legacy renderer refusal
--- old
        try { content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
--- new
        try { content = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
```


### 2026-10-24 — APPROVED — gpt-6.1-sol@01a16d97-1a82-7b11-a877-5643acb9ec2a

Fresh independent phase two, native attempt T-350-s1-a3, canonical task `/root/t350s1_repair_phase2_20261024`. Reviewed candidate `f90da37baa392aed192edd08c3b977c73f8cc725` against original base `520d30663dd0c76d90d923da087d1494267d36a0`. Requested model/effort: gpt-6.1-sol/xhigh; provider-observed model and usage: unknown. The exact native identity probe was publicly bound before repository tools. This is a distinct session from packet-only phase one, with the prepared detached-verifier profile and a procedural reading boundary, not OS/read isolation.

I read the complete native brief, verifier role, STATE, INDEX, context pack and sealed inputs. Implementation and tests preceded executor reasoning, prior verdicts and task-card history diffs. My independent questions concerned retained input materialization, typed debt comparison, renderer refusal compatibility and real-site effect discrimination. A later preparation filename inventory exposed old proof labels, and the scratch checkout printed its candidate subject after orientation; neither supplied a prior verdict or executor rationale. The only implementation-note declaration consulted was the in-fence follow-through declaration: none outside the acceptance criteria. Candidate regression bodies were reviewed as implementation tests, without claiming independent discovery of their original defect.

The sealed SHA-256 values were independently verified, including raw base-card bytes without displaying private fields:

- attack set: `5fe767764142328adf2b9007353b75877ff7188624a801affdcc5aa0d217f7fb`
- ground: `ae400125aa44a91d1f18b41c7b2172099ba238bcb10f77d68cd346e974788404`
- raw card at the original base: `50f89e6bae3b0f199213c592a90647828345128f3fbadb06fca24371e791e20f`

All figures below name candidate `f90da37baa392aed192edd08c3b977c73f8cc725`. After preparing ignored parser/app assets, the actual owed-set derivation selected parser, app and end-to-end over 30 spec files. The required command was `SUPERTASKR_E2E_PORT=25350 node tools/e2e/scripts/gate-run.mjs e2e --range 520d30663dd0c76d90d923da087d1494267d36a0..f90da37baa392aed192edd08c3b977c73f8cc725`: exit 0; parser 469 bodies, app 1171 bodies, end-to-end 1323 bodies; every leg GREEN. Complete runner output is retained, not inferred from its exit. Typecheck and token lint also passed. The initial pre-build missing-parser owed-set fallback was preparation debt; no blanket Rust leg was substituted for the settled range.

| Acceptance criterion | Deciding evidence |
|---|---|
| Frozen exact identities, regular-file overlay and one path/absence model | `captureRecordCandidateInputs` eagerly retains bytes and metadata; `evaluateRecordCandidate` owns no reader. The frozen-candidate body exercised selected revisions, different origins, detached buffers and removal of both live roots. Actual-site lazy recapture made that qualification RED. The standalone actual-export control also proved supported mode 100755 changes the input identity relative to 100644. |
| Historical malformed/duplicate debt and unchanged strict consumers | The raw-history body retained malformed bytes and canonical debt while valid edits and repair passed. Dropping malformed inputs at the actual capture site made the independent retention assertion RED. The required range passed `records`, `records-context`, qualified-admission/reservation and brief regressions, including cold-import/loading and strict caller behavior. The additive generated-parser import is confined to the new evaluator entry. |
| Complete failure identity, worsening debt and incoming context | The failure-identity, typed duplicate, alias/cycle, feature-payload and unevaluated-overlay bodies passed. Broad kind/id keys made issue/source replacement and shrinking-cycle occurrence controls RED. Removing feature payload or component file identity made its respective semantic body RED alone. Suppressing canonical dangling-reference reports accepted a referenced deletion and made the independent incoming-reference assertion RED. |
| Same-candidate deterministic private index, selected product origin and legacy compatibility | The renderer/chapter body passed exact legacy-byte comparison, addition/deletion, ordering and atomic refusals. Wrong product origin and reversed chapter order failed at their production sites. VC1 and VC2 each failed alone when the actual captured-byte or overlay BOM preservation was removed; restored code preserved both legacy refusals. `INDEXED_DOCS` and its captured ruling remain checked. |
| No product effects or authority creation | The candidate effect body observed accepted and rejected evaluations after materialization, with command/read/write traps and unchanged HEAD/refs/index/status. A supplemental owned-fixture observer also covered parsing and rendering refusals, a 25 ms observation interval, an actual no-change census-control command, an actual file write and an actual ref change. Planting a census command or write at the evaluator made that observer RED alone. Source/import review found no invocation of authority, save, dispatch or publication machinery in evaluation. |
| Actual exported entries and required public-caller scopes | Owned separate-repository fixtures exercised the exported capture/evaluation/rendering entries and every named case in the frozen contract. SHA-1 qualification passed; the restored SHA-256 qualification passed all 12 candidate bodies plus the supplemental observer. The original-base range above passed all actual derived public-caller scopes, rather than treating source inventory as qualification. |
| Independent decisive proof, exact restoration and bounded conclusions | Fifteen actual-site degradations were demonstrated: 13 scoped suite mutants and two standalone actual-export mutants. Each produced its intended semantic RED, with baseline/restored GREEN controls and inspected source diffs. All 12 candidate bodies and the supplemental observer were reached by the scoped mutant set. Exact source/spec restoration was verified against the named candidate; scope limits and retained external duties are stated below. |

The scoped proof results were: lazy recapture 2 failing bodies; dropped diagnostics 7; broad failure keys 3; wrong origin 2; reversed chapter order 1; removed mode validation 2; captured BOM stripping 1; overlay BOM stripping 1; false resolved-debt reporting 1; actual census invocation 1; actual write 1; omitted feature payload 1; omitted component file identity 1. Each run executed the 12-body candidate spec, or that spec plus the supplemental observer where named. The two standalone controls independently demonstrated missing historical debt and an incorrectly accepted referenced-ID deletion. Their baseline and restored exits were 0 and their mutant exits were 1. These are site/property proofs, not a claim that every assertion was poisoned separately or that mutant counts establish irreducibility.

Restored SHA-256: `records-validation.mjs` = `324a59095b3720cd8648c23871732a352814307094339e9e49cee9e4f9de033e`; `docs-scan.mjs` = `d8d40fce8ce3ea865986e62dcc30be5ba3072d3df2923b389c3aa9413801068e`; `records.mjs` = `c6076c10310728507edf04a8f5a2d030542a663121c08a1dc9267bfeb1812aba`; candidate spec = `ef4b7115e0c7efbfb4521b2e381072772ce8d28fa9d08bdbd6c7b987bf29e1b7`. Working diffs were empty after restoration. The independent clone had its own Git common directory, copied objects without hardlinks/alternates, and retained drivers/diffs/logs under its ignored target directories. The supplemental body was restored out of the candidate spec after qualification.

Security sweep: reviewed the new input paths, mode/type checks, origin selection, imports and effect boundary; no security finding. There are no new dependencies or endpoints. API interposition and state snapshots are the measured observation channels; they do not claim kernel-wide tracing, native-addon coverage or an unbounded asynchronous observation window. The actual evaluator is synchronous. The saved phase-one ground remains the scripted base measurement, without retroactively presenting candidate measurements as base evidence.

Dispatch fault resolved: the brief named a custom ask filename that differed from the public attempt's canonical `ask-T-350-s1.md`. The coordinator forwarded the actual question with attribution through the normal arm; I read its ANSWER and wrote `RUN-ACK T-350-s1-fresh-verifier-drill-01` before using the authorized local proof clone. No other pack gap was observed. Setup disclosures: an initial parser build lacked installed dependencies; these were prepared before grading. An earlier range invocation omitted the assigned port variable, was stopped with actual exit 130 and verified cessation, and supplies no end-to-end grade. Its partial output is retained. The successful range above used port 25350. An initial supplemental child-source quoting error was corrected before its baseline/proof results and is not counted as mutant evidence.

At the reviewed candidate, `docs/INDEX.md` is CURRENT. `capabilities:check` is STALE (committed 139631 bytes; fresh 141075 bytes); regeneration remains the integrator's owning step. Census/index/graph regeneration at the merged tree remains outside this source fence. No implementation correction is assigned: 0 corrections, 0 correction bodies and 0 correction mutant blocks. The verifier exit is this appended record only; its own gates are run before collection, with their results retained separately at the resulting ref.

This approves the pure candidate evaluator. Private save/backup, persistence and current-authority rechecks, ordinary product-census separation, app composition and migration activation remain the external contracts' duties. This pass supplies no T-351/T-353 waiver and retries no automatically restricted proof. Publication and exact-tip CI remain separate readings for the coordinator/integrator.
