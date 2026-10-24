---
id: T-356
title: Reconcile exact later attribution holds on one closed native execution
feature: F-03
milestone: 4
priority: 1
size: M
tier: guarded
status: building
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

## Source closure retained for review

At integration ref `82dd072900b2d6ccd5de798eaa3581340bd3bd4a`, the existing transaction tail, atomic publication, native schema, source-preparation authority and sidecar absorption were read. The ordinary a1 workspace audit is clean at the exact candidate; the ordinary a2 audit refuses on source a1’s active holds, confirming the source-first dependency. The incident transcript contains two refused identity probes across two turns and collaboration-only calls, all with terminal results. This supports only that recorded scope, not arbitrary-tool isolation. Original incident records remain unmodified.
