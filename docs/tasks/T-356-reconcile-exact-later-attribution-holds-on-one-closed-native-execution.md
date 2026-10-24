---
id: T-356
title: Reconcile exact later attribution holds on one closed native execution
feature: F-03
milestone: 4
priority: 1
size: M
tier: guarded
status: verifying
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: []
touches: [tools/e2e/scripts/gate-closed-attribution-recovery.mjs, tools/e2e/tests/closed-attribution-recovery.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
---

# Reconcile exact later attribution holds on a closed execution

Provide a direct recovery operation that disposes explicitly authorized historical attribution holds on one closed execution while preserving its original collection and incident evidence. Its receipt records that historical disposition and grants no fresh admission authority.

Existing exported primitives support a prospective two-new-file route, subject to final import, schema and behavioral closure. Actual source tail was read through its return: bodyError is thrown before releaseError; the reviewed race route therefore returns failure rather than translating a race sentinel into success. Remaining import/schema/effect closure is still owed.

Prepared outside the repository and independently reviewed at `82dd072900b2d6ccd5de798eaa3581340bd3bd4a`, 2026-10-24; both final amendments are incorporated. One bounded implementation/verification cycle; size M. GUARDED derives from the existing guard map’s meaningful `gate-*` prefix. This card grants no operational disposition. The migration repair grant covers source implementation; actual recovery requires separate, exact human authorization.

## Acceptance criteria

- The direct public entry in `tools/e2e/scripts/gate-closed-attribution-recovery.mjs` accepts a request selecting exactly one existing execution and binds its original native identities, candidate, physical scope, collection, complete selected hold keys, incident actor/events, evidence digests, policy inputs and immutable authorization. Accept only the explicitly supported later-attribution hold kinds `ambiguous-agent-attribution` and `unknown-worker` with exact incident bindings. Other hold kinds, emergency conditions and unrelated holds remain outside this disposition operation. The authorization lists exact ordered request identities binding immutable request contents, not reusable names alone; its schema must avoid circular request/authorization digests. The a2 request identifies its exact a1 predecessor. Reject ambiguous subsets, additional targets, unknown fields and mismatches. Validate a distinct attribution-disposition authorization shape using the existing pinned owner-record and quoted-human-grant trust model; neither implementation approval nor the criterion-8 exception supplies recovery authority.

- Before current policy, evidence, owner or fault qualification, an exact syntactic match against a retained immutable request and valid stored receipt returns that historical receipt. Replay performs no disposition or current-state rewrite and does not imply current permission. A changed request fails exact matching. Without a matching receipt, every first-application check applies. Inconsistent stored dispositions or receipt data refuse further application.

- First application validates actual historical closure and current qualification: original bindings and terminal evidence; collection preceding the incident; no inflight work or jobs; released reservations; unchanged qualifying candidate, physical scope, collection and policy; applicable current source authority; and no disqualifying later ownership or unexpected holds. The target’s terminal completion, original qualifying collection and reservation release must precede the earliest selected incident event. First application must establish that the selected holds arise from those later attribution events. Known outstanding incident-actor jobs or unresolved recorded native activity refuse disposition. Require the actual actor transcript/job/effect audit with its observational limits recorded; the audit claims no OS or arbitrary-tool isolation. A refused tool call proves only that refusal. Missing or materially ambiguous evidence refuses disposition. Preserve original collection content, event content and hold identity/details.

- First a2 application verifies the matching a1 predecessor receipt, then derives fresh source authority and completes its own current checks. Refuse a2-first requests, unrelated predecessors and changed qualifying source state. Each target commits independently: a1 may remain successfully dispositioned when a2 refuses. There is no batch rollback or multi-record atomic completion. An old collection or predecessor receipt alone never grants current authority.

- Use the existing cooperative transaction primitive, checking pending raw faults and emergency holds initially and in `onAcquired`. Perform no disposition work in `onAcquired`. If a matching receipt appears only after acquisition, throw an ordinary race refusal and require an explicit subsequent retry to retrieve it. Do not catch a sentinel as successful replay: the wrapper prioritizes `bodyError` over `releaseError`, so that route could conceal release failure. A race error must not imply successful lock release. The full source tail confirms this failure precedence; implementation must qualify the actual public route.

- After normal fault absorption and at the specified last publication boundary, compare relevant records and raw, emergency and retained absorbed-fault inventories, including evidence of consumed raw sidecars. A detected new fault or changed qualifying input refuses selected disposition before publication while preserving and reporting native quarantine housekeeping. Normal absorption may append fail-closed `UNKNOWN` metadata; that is not another authorized disposition. Guarantee the specified checks under the existing cooperative model, not an atomic filesystem snapshot or detection of every outside arrival. Subsequent quarantine remains effective, and ordinary fresh admission remains mandatory.

- Publish one target-record replacement containing the immutable request, receipt and selected hold dispositions together, using the existing atomic primitive and actual `beforePublish` checks. Preserve other holds and evidence; do not change global hold filtering or reconciliation exclusions. A qualification refusal before publication produces no selected disposition. After rename, directory-sync, release or response failures may coexist with an applied record: report committed or uncertain outcomes honestly, never infer non-application from an error, and never roll back. Recover by explicit exact retry against the retained receipt. At the replacement boundary, the record contains the old image or the new image with effect and receipt together.

- Matching direct-public-entry fixtures in `tools/e2e/tests/closed-attribution-recovery.spec.ts` cover ordered a1/a2 success; a2-first, unrelated predecessor and changed source; execution/collection/reservation closing after the incident; request or authorization name reused with changed contents; absent audit or exact grant; wrong bindings, candidate, scope or policy; live work, later ownership and unexpected holds; prepublication input changes; consumed-sidecar and retained-quarantine detection; pre-lock replay preserving later state; receipt appearance after acquisition and subsequent explicit replay; failure before rename; and failures after rename, directory sync, lock release and response loss. Verify honest outcome classification and retained evidence. Include the combined race where a receipt appears after acquisition and lock release also fails: return failure, make no selected disposition, retain the receipt and make no clean-lock claim; later pre-lock exact replay may retrieve it. Use ordinary synthetic protocol fixtures, never the stopped T353 guard-disablement campaign.

## Implementation notes

### Executor criterion echo — 2026-10-24, before implementation

- [x] Bind one exact closed execution, its selected later-attribution incidents and immutable evidence/policy to a separately pinned owner disposition grant; reject unsupported or ambiguous input.
- [x] Return an exact retained historical receipt before current qualification, without rewriting later state; refuse inconsistent or changed retained requests.
- [x] Establish closure, collection and reservation release before the incidents, current candidate/scope/policy/source authority, actor audit and absence of live work, later ownership or unexpected holds.
- [x] Require a2's exact successful a1 predecessor and independently requalify a2 and its current source, retaining each target's independent result.
- [x] Use the real cooperative transaction, reject pending faults initially and on acquisition, and refuse receipt races without converting body errors or release uncertainty into replay success.
- [x] Compare records and raw, emergency and retained absorbed-fault inventories after absorption and at the actual last publication check; retain any quarantine housekeeping.
- [x] Atomically replace one target with request, receipt and selected dispositions together; report prepublication refusal and committed/uncertain postpublication failures honestly, recovering only through explicit exact retry.
- [x] Exercise the direct public entry with ordinary synthetic protocol fixtures across success, authority/closure refusals, races, consumed faults and publication/release/response failures, preserving original evidence.

Implemented the direct CLI and importable `recoverClosedAttribution` operation in the two admitted owners. No core module, global hold filter, reconciliation exclusion or second lifecycle ledger changed. The CLI takes `--root` and `--request`; imported requests may be JSON text or JSON objects. Exact schemas, duplicate-key rejection, physical evidence-file checks and canonical request identity bind the single target, original record, native origins, complete incident selection, audit, policy and distinct pinned owner grant. The authorization digest is excluded only from its own request-identity input, avoiding a circular digest while the immutable authorization bytes remain independently pinned.

`historical` validates retained request/receipt consistency before current qualification and returns only an exact syntactic replay, with no write. First application uses the real `withNativeTransaction` and `atomicJson` primitives. Pending raw/emergency faults are checked before acquisition and in `onAcquired`; the latter performs no disposition. A receipt appearing after acquisition raises an ordinary refusal, preserving body-error precedence and reporting lock release as unverified. Relevant record/raw/emergency/retained-fault inventories are compared after normal absorption and at the actual last `beforePublish` boundary. The target replacement stores immutable request, receipt and selected clearing together. Error readback distinguishes observed committed effects from uncertain publication; explicit exact retry retrieves the retained receipt after response or release failure.

Each target must have its own qualifying collection, terminal execution and reservation release before the earliest incident. a2 additionally requires its exact a1 receipt and fresh source authority/workspace. The actor transcript, execution-end, jobs and effects are pinned actual observations, including the refused `PreToolUse` and selected `SubagentStop` shape. Unknown stop-turn metadata is preserved. A refusal proves that refusal only; recorded evidence supplies no OS, arbitrary-tool or outside-arrival isolation. Disposition grants no admission authority. Both canonical questions were answered and acknowledged: `a2-collection` corrected the false premise that a2 lacked its own collection; `coordinator-source-review-1` corrected the early positive fixture's substituted `PostToolUse`. The latter was coordinator source feedback, not the sealed independent attack set. No historical record was dispositioned and the stopped T353 proof campaign was not retried.

### Criterion evidence at code commit `248790949c34be35e5ab7a5b9c1d3dda34c6b13e`

| Criterion | Public behavior and focused bodies |
|---|---|
| 1 | Exact request/grant/schema validation and successful CLI a1 plus imported a2; bodies 1–2. |
| 2 | Immutable pre-lock replay despite missing current evidence and later faults; corrupt retained receipt/request refusals; body 8. |
| 3 | Own pre-incident completion, collection and release; live target/actor work, later owners, unknown activity, unexpected holds and audit refusals; bodies 2–3 and 5. |
| 4 | Ordered predecessor and fresh source checks, a2-first/unrelated/changed-source refusals with a1 retained independently; bodies 1 and 4. |
| 5 | Initial/acquired pending checks and receipt races, including actual exact-lock release failure returning failure and later explicit replay; bodies 7–8. |
| 6 | Actual before-rename observer changes and a genuinely consumed raw sidecar scoped to the other target, with normal retained quarantine and no selected publication; bodies 6–7. |
| 7 | Old-or-new target image with effect/receipt together, before/after rename and directory-sync errors, release and response loss, committed/uncertain classification and explicit retry; body 9. |
| 8 | Nine ordinary synthetic public-route bodies cover the required success/refusal/race/error controls and preserve original collections, events, details and ordinary outcomes; bodies 1–9. |

The committed helper SHA256 is `ab6b897db6dd152fd73fba71f7ed6ba4ba6ada2259abbd24a94c06ec03c588a9`; the committed spec SHA256 is `2a5a2e0200d3c76f8f6f581114312a26a808dbfac758082672d64bc25d04b70f`. An explicit detached, unmutated baseline at that code commit ran the nine public bodies: exit 0, 9 passed. The qualifying self-drills below began only after that baseline. Earlier development trials and their two fixture corrections are retained separately as exploratory evidence, not qualifying drills. Tools typechecking and graph currency also passed at the same code content; the required original-base range grade follows this notes commit and is reported by its actual graded ref in the executor report.

### Self-drill block — one property mutation per new body

Each row changed implementation only in an owned detached scratch checkout of `248790949c34be35e5ab7a5b9c1d3dda34c6b13e`, ran that row's focused public body, and restored before the next mutation. All nine returned exit 1 with exactly 1 failed body for the indicated property assertion. All nine restores independently matched helper SHA256 `ab6b897db6dd152fd73fba71f7ed6ba4ba6ada2259abbd24a94c06ec03c588a9` and had an empty per-path diff. This is focused body qualification; no whole-suite mutant containment census is claimed. The positive ordered a1/a2 control also failed against the broken implementation in row 1.

| Body | Implementation mutation | Observed failure |
|---|---|---|
| 1 | Leave selected `clearedAt` null. | Successful a2 control receives inconsistent predecessor receipt. |
| 2 | Remove immutable owner-authorization digest comparison. | Reused grant name with changed bytes succeeds instead of refusing. |
| 3 | Remove own-collection-before-incident time check. | Collection-after-incident succeeds instead of refusing. |
| 4 | Remove fresh source workspace comparison. | Changed source succeeds instead of refusing. |
| 5 | Skip actual incident actor job probes. | Live actor PID succeeds instead of refusing. |
| 6 | Omit last actual `beforePublish` qualification. | Changed audit evidence succeeds instead of refusing. |
| 7 | Disable relevant inventory comparisons. | Genuinely absorbed/retained fault on the other target permits selected publication instead of refusing. |
| 8 | Check current pending faults before historical lookup. | Exact historical replay refuses a later raw fault. |
| 9 | Classify observed retained receipt as not applied. | After-rename outcome reports not-applied instead of committed. |

Mutation patches, baseline output, all nine failure logs and qualifying results are retained outside the source checkout for collection. Preparation used existing dependencies; no historical proof fixture or guard-disablement campaign was used.

### In-fence follow-through

None beyond the accepted criteria. No new task or out-of-fence source change was needed. The role's cited task-format path resolves relative to `method/`; that correction was applied before the ceremony. The assignment requests `gpt-6.1-sol@xhigh`; observed provider model identity, effort and usage remain unknown rather than inferred from that request.

Existing `native-codex.mjs` and run-record facilities are read-only dependencies. Qualify import behavior, record-schema compatibility, receipt retention, authority checks, fault inventories and transaction error handling during implementation. Any required core modification needs revised scope and serialized scheduling; it is not silently included.

Retain the primitives’ actual limits. Bounded lock waiting can persist an `UNKNOWN` fault. `onAcquired` exceptions become body errors; exact lock release runs before rethrow. Body errors take precedence over release errors. Absorption precedes the synchronous body, and Promise bodies are rejected. The convenience record writer supplies no compare-and-swap guarantee.

Historical replay and first application are distinct outcomes. A replay receipt makes no statement about current holds, later ownership, current evidence availability or admission permission. An unobserved concurrent sidecar may remain for the next normal gate. Local authorization files provide no protection against a malicious coordinator rewriting files and evidence; no OS or arbitrary-tool isolation is claimed.

T353’s pinned candidate remains unchanged. Criterion 8 remains unfinished under its exact exception, with no retry, rerouting or claim that it was met.

## Verdicts

Implementation: complete at code commit `248790949c34be35e5ab7a5b9c1d3dda34c6b13e`; independent verification remains pending.

Independent verification: pending.

Operational disposition: not authorized or performed by this card.

Original T353 ordinary reviewer verdict: remains the original reviewer’s responsibility. Implementation approval, a recovery receipt and the criterion-8 exception do not manufacture it.

### 2026-10-25 — APPROVED — unknown@01a16f5c-4f6c-78e1-9e78-e6253e6df1d6

Independent local approval of candidate `be229bd8359e0421f1e1cc15f99d0b37b24a87c9`, against original base `9e5477a43255f41c2b8790d3492c0a3acc6a6948`. The direct public operation qualifies the bounded synthetic later-attribution disposition, exact historical replay, cooperative fault checks and honest publication outcomes specified by this card. No original-candidate behavioral failure was established. This verdict supplies no authority for an actual historical disposition or fresh admission. Push, CI and integration are separate outcomes.

The actual fresh phase-two task is `/root/t356_phase2_20261024_be229bd8`, native identity `01a16f5c-4f6c-78e1-9e78-e6253e6df1d6`, public attempt `T-356-a2`, admitted `detached-verifier` profile. The first tool was exactly `/usr/bin/printenv CODEX_THREAD_ID`; tools began only after explicit binding. Requested model/effort: `gpt-6.1-sol/xhigh`; observed model and usage: **unknown**. Phase one was a separate native packet-only spawn, `/root/t356_phase1_20261024`, identity `01a16dc9-5dfc-7690-a8ff-4638423b121c`. I received its saved attack set, the frozen base contract and the neutral ground before reviewing the two code/test owners. Before drafting this verdict I did not open executor reasoning, reports, conversation, raw card notes/history, previous opinions or commit subjects. The reading restriction was procedural, not filesystem isolation. STATE, INDEX, the verifier role and the brief's context pack supplied the standing/governing read. The later incidental hunk-header exposure is disclosed below.

#### Sealed ground and retained measurements

All digests below are SHA256. The original saved files were checked without displaying embedded private card fields.

- `attack-set-T-356.md`: `b21158e788b9fb8a26a6bdc09a8e15ca1c3e379c1cd8e579941ea392666b877c`.
- Original sealed `ground-T-356.md`: `ef4fd7cec870d3620041009631b44a3544d8497b8c1f9c4756a8d51f03d85b5a`.
- Raw card at the original base: `d36980231fb107d15f304fd51f53f7e2cbb0c68f7ec5e07d7460de27e2ef0194`.
- Neutral `preimplementation-base-ground-v1.json`: `e61e550f397e0cad4d1149d39088c8e5ebea78de1c3fe1efbc792d10405c1292`; `supplementary-seal-v1.json`: `a46861e4be99bd1ca49d312e9841488f6d0e81bc0c4c7071c7f0b9e79881da55`.
- My separate, explicitly post-implementation `ground-addendum-T-356.md`: `79d8d4519e2a18adda6840167451c72d69e55682870546905702c643d4c421ca`. The canonical answer/ACK `t356-ground-addendum-01` preserves this unsealed seat addendum without changing the sealed original ground or relabelling its timing.
- `proof-summary.json`: `8ca25a10d40398b5a70dc197bb4d2c035d172e2fb1d69062dd48d1a9b37e5a1f`; `decisive-observation-index.json`: `c1b204d40fc32372369e2be14229ce1407a3ec3f0ecbcca0b4b02eed2df2046c`; preserved original whole-grade token `candidate-gate-verdict-T-356.json`: `a25e7f487fc4c42470b5b67470116d5e7a9d0d51ea2f41ca0e893ce0dd963e68`.

The original base had neither new owner and no measured preimplementation behavioral result. Its recorded preflight was red because the lane base precedes checkpoint `b752c4ef46f468f96a41152da3d8b163fc0db65f`; its absent-body wording is not a claim that the frozen contract omitted the spec. This dispatch limitation remains visible. The later candidate tests below are new observations, not reconstructed preimplementation measurements. The post-implementation seat addendum answers phase one's public-route, runtime, transaction, publication, audit, fault-inventory and outcome asks, including remaining limits.

The packet directory is `/Users/ujju/Projects/supertaskr-evidence/execution/repository-separation-2026-10-05/resume-2026-10-22-v1/T-356-preparation-v1/fresh-phase2-v1`. My admitted local output is `app/src-tauri/target/T-356-proof`; the coordinator retained its bytes separately at `independent-proof-completed-v1` in that packet directory with `RETENTION-MANIFEST-v1.json`. No other consultation's conclusions were supplied to this verdict.

#### Acceptance evidence at the candidate

The body numbers below refer to the original nine tests in `tools/e2e/tests/closed-attribution-recovery.spec.ts`, executed through the exported public operation and, for the ordered positive control, the actual CLI. They are also mapped to their exact titles in `proof-summary.json`.

| Criterion | Deciding evidence |
|---|---|
| 1. Exact target, incident, evidence and distinct immutable authorization | Body 2 independently refuses unknown fields, changed candidate/binding/scope/policy, missing audit/grant, reused grant/request contents and mismatched incidents; it includes a successful direct public control. Body 1 succeeds in order. Source `validate`, `authorization`, `closedAttributionRequestIdentity` and physical-origin/evidence checks bind complete relationships and ordered identities without a digest cycle. M02 dies specifically when reused authorization contents incorrectly succeed after removing only their content-digest check. |
| 2. Historical replay precedes current qualification and does no repair | Body 8 retrieves the exact receipt after audit/grant removal, later raw/emergency faults and later record/hold changes, preserving the later record. Changed request text and corrupt stored receipt/disposition data refuse. Source calls `historical` before `noPending` and transaction acquisition. The receipt explicitly grants no admission authority. |
| 3. Actual closure, earliest incident and current qualification | Body 3 separately changes target completion, own collection and released reservation to after the earliest incident, and omits own collection. Body 2 covers bindings, measured scope, pins and policy; body 5 covers live target/actor work, later ownership, unexpected holds and incomplete/unknown actor audit. M03 admits completion-after only without its ordering comparison; M05 admits the actual live synthetic PID only without its probe. D01's unsupported audit-limit data produces an actual CLI AUDIT refusal while module limits and assertions remain unchanged. Original evidence is preserved by body 1 and publication checks. |
| 4. Exact a1 predecessor and fresh independent a2 authority | Body 4 refuses a2-first, unrelated predecessor, reused authorization binding and changed a1 source; a1 stays applied. Ordered body 1 and the body 4 restored-source control succeed. M04 dies when removing only fresh source collection allows the changed source to succeed. Each target has its own retained receipt and publication; no batch rollback is asserted. |
| 5. Cooperative initial/acquired checks and ordinary receipt race | Body 7 reaches initial/acquired raw-fault checks; M12 dies because the acquired case takes FAULT_CHANGED instead of PENDING_FAULT after removing only `onAcquired` detection. Body 8 reaches both ordinary receipt-after-acquisition and changed-token release-failure races, returns RECEIPT_RACE, retains the appearing receipt and reports lock release unverified. Saved lock images differ: absent for ordinary release, present for failed release; explicit subsequent pre-lock replay succeeds. Actual native wrapper source throws bodyError before releaseError. M08's post-acquisition success translation dies at the race assertion. |
| 6. Consumed raw faults, retained quarantine and last checks | Body 7 actually consumes an injected sidecar, retains native fault/hold housekeeping and refuses selected disposition with quarantineChanged:true. Body 6 separately injects retained, raw and emergency fault evidence and changed qualifying inputs at actual before-rename. M07 removes only the three baseline inventory comparisons and dies in both bodies: consumed rawRemaining:[] with retained:true/hold:true incorrectly succeeds, and retained-fault publication incorrectly succeeds. M06 removes only last qualification and dies because changed audit evidence succeeds at the publication boundary. Inventory comparisons hash content; they do not rely on counts alone. |
| 7. One coupled replacement and honest failure outcomes | Body 1 preserves collections, events, outcome, existing receipts and hold identity/details. Body 9 observes before-rename, rename, before/after directory-sync, release failure, unreadable post-rename state and response loss, then exact retry. Saved outcomes include not-applied, committed and uncertain with no clean-lock inference. M01's public CLI image clears four selected holds with zero disposition receipts; body 3 explicitly observes the missing receipt array. M09 dies on false non-application after a matching receipt, M11 on false committed status with the unchanged old record, and M10 on erased a2 events. Source publishes only one target via `atomicJson` with actual beforePublish checks. |
| 8. Direct synthetic fixtures discriminate the actual properties | All nine original bodies pass on the original candidate, the observation-only capture baseline and final exact restoration. The 84-site assertion drill, twelve source mutants, D01 data control and semantic containment result below demonstrate discrimination. This uses ordinary synthetic native fixtures; no stopped T353 campaign or actual historical operation was attempted. |

#### Whole candidate grade and bounded proof

At exact candidate `be229bd8359e0421f1e1cc15f99d0b37b24a87c9`, actual `CARGO_TARGET_DIR=/Users/ujju/Projects/supertaskr-V-T-356/app/src-tauri/target SUPERTASKR_E2E_PORT=25356 node tools/e2e/scripts/gate-run.mjs --all` completed with all four blessed legs GREEN/exit 0: parser 469 bodies/1 target, app 1171/1, rust 662/18, e2e 1421/1. These are whole-suite figures at the candidate, not scoped proof figures. The long unchanged native-transaction-recovery bodies completed without restart or a new failure. `npm --prefix tools/e2e run typecheck` also exited0.

The original focused candidate run, observation-only capture run and exact-restoration run each executed 9 bodies and passed 9, with no skips or flaky retries. Temporary capture copied only the owned synthetic fixture records/evidence/lock state into the admitted ignored output. It changed no qualification input. Each code mutant began from the exact candidate module, its actual Git diff was read, and its full original nine-body run/record images were retained before restoration. Mutants were never stacked.

The assertion-side drill negated all 84 labelled matcher sites using soft assertions so earlier failures did not prevent reaching later sites. Actual result: all 9 bodies RED, all 84 distinct labels observed, 219 labelled errors, no unlabelled errors. The 84-site and 219-error counts describe different measurements. The module remained original throughout that drill, and the captured spec was then restored exactly.

| Mutant | Deliberately removed/weakened property | Measured failed bodies | Direct semantic credit |
|---|---|---|---|
| M01 | Coupled retained request/receipt with selected disposition | 1,3,4,8,9 | 1,3; actual CLI cleared 4/receipts 0 image |
| M02 | Immutable authorization content digest | 2 | 2: grant-name reuse wrongly succeeds |
| M03 | Target completion before earliest incident | 3 | 3: completion-after wrongly succeeds |
| M04 | Fresh a1 source collection before a2 | 4 | 4: changed source wrongly succeeds |
| M05 | Probe recorded incident-actor jobs | 5 | 5: live actor PID wrongly succeeds |
| M06 | Final beforePublish requalification | 6 | 6: changed evidence wrongly succeeds |
| M07 | Three relevant inventory/baseline comparisons | 6,7 | 6,7: retained/consumed fault wrongly succeeds |
| M08 | Ordinary post-acquisition receipt-race refusal | 8 | 8: wrong SUCCESS for the race |
| M09 | Honest committed classification from observed receipt | 8,9 | 8,9: wrong not-applied |
| M10 | Preserve a2 event evidence | 1 | 1: empty a2 events fail preserved-history assertion |
| M11 | Honest not-applied classification from unchanged old image | 9 | 9: wrong committed before rename |
| M12 | Acquired pending-fault detection | 7 | 7: wrong FAULT_CHANGED route |
| D01 | Valid observation-only audit-limit data; production limits unchanged | 1,2,3,4,6,8,9 | 1: real CLI AUDIT refusal makes positive control RED |

M01's dependent failures 4/8/9 and D01's early unrelated failures 2/3/4/6/8/9 are explicitly excluded from direct semantic credit. Semantic kill sets are B1{M01,M10,D01}, B2{M02}, B3{M01,M03}, B4{M04}, B5{M05}, B6{M06,M07}, B7{M07,M12}, B8{M08,M09}, B9{M09,M11}. No set contains another across 36 unordered pairs; judgment uses containment and intended reached sites, not kill counts. Every code mutant was killed; the distinct data mutant proves the positive arrangement can refuse when its audit data loses the required property. The 121-entry observation index retains decisive actual synthetic images separately from assertion output.

Restoration was verified using exact candidate owner SHA256 values and empty named diffs: module `ab6b897db6dd152fd73fba71f7ed6ba4ba6ada2259abbd24a94c06ec03c588a9`; spec `2a5a2e0200d3c76f8f6f581114312a26a808dbfac758082672d64bc25d04b70f`. The restored original9 then passed at the same candidate. No temporary mutant, observation helper or timeout change is committed.

#### Security, procedural faults and limits

The new request path uses strict schemas, duplicate-key/unknown-field checks, safe identifiers, pinned bytes and physical-origin/storage checks. Spawned Git/lsof use argument arrays and constrained identifiers rather than interpolating request text into a shell. No new dependency or secret was found in the two owners. Authorization remains the specified trusted coordinator owner record plus pinned human quotation; code does not independently infer human intent from arbitrary quotation prose or isolate a dishonest coordinator. Audit observations claim neither OS nor arbitrary-tool isolation. A refused call establishes only that refusal. Source/effect checks and synthetic tests provide no authority to apply this operation to retained real historical records.

Two preparation refusals are preserved rather than counted as implementation failures. I initially read “detached scratch worktree” as requiring a third repository beyond the already exclusive detached verifier bench. A prepared external clone at `/private/tmp/T-356-fresh-verifier-01a16f5c` passed its original9 baseline, but its first patch was stopped before writing by native PreToolUse admission: `writer-resource-not-explicit`, because the external spec was outside my assigned resource. No separate content/safety approval-review rejection was reported. I stopped without retrying that write or changing tools. The coordinator's attempted relocation of the untouched clone into declared ignored output then met an unexpected-nested-repository preparation refusal and was reversed. The external clone remains untouched retained evidence. My earlier “automatic approval review” description was corrected to the actual native admission hold.

The interrupted episode returned genuine incomplete `RUN-DONE failed`, with no repository verdict and no candidate behavioral finding. Public continue and exact same-identity binding later succeeded after clean restoration. The actual role passage requires a detached scratch worktree at a named commit with its own target directory; its purpose is separation from source/integration readers, not a mandatory third repository. The already admitted exclusive detached bench satisfies it. That correction, the original stopped operation and both preparation refusals remain recorded; the later in-bench sequence was separately asked/answered through the canonical arm before any mutation. This is no retry/reroute of the refused external patch and no proof waiver. The brief's initial custom ask path was also a repeated dispatch error: its genuine question was preserved and copied with provenance to canonical `ask-T-356.md`, where subsequent RUN-ASK/ANSWER/RUN-ACK exchanges occurred. No ACK or successful callback was invented.

After the independent proofs and this approval entry were drafted, Git's zero-context diff printed one preceding task-record context line in a hunk header. This incidental exposure occurred after the measurements and approval text were written; no further preexisting text was opened or used. Subsequent own-entry review filters hunk headers. This is a disclosed reading-boundary limit, not a claim of another blind frame.

Bounds remain explicit: no atomic filesystem snapshot, every-outside-arrival guarantee, OS/arbitrary-tool isolation, crash/power-loss durability measurement or separate post-lock-removal release-failure injection was established. Filesystem type is unmeasured. Current measured platform/runtime outputs are retained in the seat addendum. No actual historical disposition, T353 stopped proof, merge or push occurred. No new in-bench automatic restriction or surviving/non-discriminating property arose in the authorized bounded sequence.

Assigned corrections: **0**. Correction bodies: **0**. Parsed correction mutant blocks: **0**; the twelve qualification mutants above are retained proof evidence, not implementation repairs. This verdict changes only this task record and stamps no frontmatter field. It creates a new tip, so the blessed original-base-to-actual-final-tip range grade remains owed after this commit and will be reported with its actual ref/token separately from the whole candidate grade above. At the pre-verdict checkpoint all test/tool sessions had ended, port 25356 had no listener and no owned proof process remained; final cessation will be rechecked after that grade.

## Source closure retained for review

At integration ref `82dd072900b2d6ccd5de798eaa3581340bd3bd4a`, the existing transaction tail, atomic publication, native schema, source-preparation authority and sidecar absorption were read. The ordinary a1 workspace audit is clean at the exact candidate; the ordinary a2 audit refuses on source a1’s active holds, confirming the source-first dependency. The incident transcript contains two refused identity probes across two turns and collaboration-only calls, all with terminal results. This supports only that recorded scope, not arbitrary-tool isolation. Original incident records remain unmodified.
