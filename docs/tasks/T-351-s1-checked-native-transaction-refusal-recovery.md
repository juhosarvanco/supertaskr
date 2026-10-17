---
id: T-351-s1
title: Recover exact native transaction refusals through checked per-hold dispositions
feature: F-04
milestone: 4
priority: 1
size: M
tier: standard
status: verifying
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: []
touches: [tools/e2e/scripts/native-codex.mjs, tools/e2e/scripts/native-transaction-recovery.mjs, tools/e2e/tests/native-codex.spec.ts, tools/e2e/tests/native-transaction-recovery.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
---

Provide one supported command to resolve an exact native transaction-refusal hold after independently checked cessation, unchanged authority and complete workspace checks. Preserve unknown callbacks and original fault evidence. This is the repair T-351 requires before its held verification can continue.

## Finding

Read at 85eb7584e517d379f36df55e83a07f70eb93686c. A transaction timeout creates an unscoped version-one sidecar; normal absorption applies its sticky hold to every native record, including a genuinely finalized executor. There is no supported recovery operation. A later hold prevents frozen detached preparation even while the original eligible independent collection remains retained. Present cessation and clean scope do not prove attribution. The ordinary route must refuse unattributed legacy faults; a separately recorded owner's exact policy ruling may discharge that uncertainty for its specific targets after all other checks.

## Acceptance criteria

- WHEN native transaction contention reaches its existing bound THE durable refusal SHALL distinguish failed requester event/attempt/binding context where independently attributable from the observed lock owner. Each raw refusal and unique identity SHALL remain durable until its corresponding ledger absorption is durable; interrupted absorption/replay SHALL not drop or merge distinct faults. Context absent or unverifiable SHALL remain unknown, and unknown faults SHALL retain the existing conservative refusal. No lock theft, callback fabrication or increased-timeout substitute SHALL be introduced in tools/e2e/scripts/native-codex.mjs.
- WHEN the coordinator invokes the supported public recovery entry in tools/e2e/scripts/native-transaction-recovery.mjs THE request SHALL pin exact fault bytes/digest and the complete explicitly selected target set, with expected record content, reservation content/absence and binding identities for each. Pin the versioned public request format with fault identity/raw-content digest, full target attempt/resource/candidate identities, expected record and reservation bytes or absence, exact binding generation and authorization reference/digest in the delivery notes. The operation SHALL independently load the underlying evidence and establish genuinely recorded native cessation, every owned job's cessation, exact candidate/origins and cumulative committed/staged/unstaged/untracked/ignored/type/mode/rename scope using the existing checks. Missing, malformed, changed or foreign authority, live or unknown owners/jobs, unproven cessation and dirty or changed candidates SHALL refuse without changing any target. Targets with an earlier genuine final collection SHALL preserve that exact sealed collection and its original evidence; status alone SHALL not establish finalization.
- WHEN disposition is justified THE operation SHALL revalidate exact expected record, reservation, binding and checked candidate identities inside the existing withNativeTransaction boundary immediately before each visible authority change. It SHALL durably record an immutable request fingerprint and complete target intent before the first target mutation, commit each target's exact disposition evidence and named-hold resolution together, and refuse identifier reuse with different content. It SHALL append one exact fault/check/disposition and resolve only its named hold, preserving fault bytes and unknown outcome, every missing actualPostCallback:false receipt and all other active holds. A retry of the identical successfully recorded request SHALL recognize its own recorded resulting identities and return the existing disposition without repeating or broadening it. An interrupted multi-target disposition SHALL distinguish completed from pending targets, require fresh expected authority for further writes, and remain discoverable/safely resumable or explicitly pending; test interruption at every durable boundary. It SHALL neither release nor reacquire a foreign reservation, rewrite historical finalization nor turn a failed review into successful acceptance.
- IF authoritative attribution is unavailable THE ordinary route SHALL refuse with a named legacy-unattributed outcome. A separately and independently recorded owner authorization, referenced by pinned identity/content rather than caller-supplied text or a boolean, MAY permit an exact legacy fault and exact target set to proceed only after the same independent checks and current grant/pause/seat checks, all revalidated together with the exact fault and binding-qualified targets inside the existing transaction before disposition. It SHALL not be a generic ignore-unknown or clear-holds flag. The present authorized case is fault10b7b26768f0e7e06524cbd0c391ef2e75d55fc8d79705a3870615c039cbe004 for T-351-a6 and T-351-a11 only; its unresolved attribution SHALL remain disclosed. Missing/mismatched authorization or another fault/target SHALL refuse. Earlier a6 collection SHALL remain the source of normal detached preparation after disposition, with current physical validation intact; a11's failed no-work turn and unknown callback SHALL remain recorded.
- WHEN independently verified THE bodies in tools/e2e/tests/native-transaction-recovery.spec.ts and tools/e2e/tests/native-codex.spec.ts SHALL use fixture-owned real repositories, deterministic separate-process contention and the same public recovery entry to prove bounded refusal, durable distinct sidecars, exact checked recovery, earlier collected-source preparation and preserved unknown receipts. Separate negative controls SHALL retain refusal for absent legacy authorization, mismatched fault/target/record/reservation/binding, intervening authority or candidate change, live/unknown jobs or writers, dirty/out-of-fence scope, foreign ownership, missing genuine historical collection and another active hold. Interruption/replay SHALL prove no duplicate or broader disposition. Existing deliberate unknown-fault refusal, single-root ordinary lifecycle, packet-only and detached-verifier cases SHALL remain controls. No platform-refused broad guard-removal campaign SHALL be repeated; record any unavailable coverage explicitly.


## Implementation notes

Drafted and independently reviewed outside the repository in two packet-only sittings. The second review accepted filing after its explicit authorization-reference, durable intent/replay and complete request/physical-recheck clarifications were incorporated here; it did not accept an implementation or disposition. Use the standalone recovery module as public API and CLI, importing existing public run-record and native checks; keep fault context and serialized engine support in native-codex. Do not alter run-record or brief under this fence. Their public preparation route should work after an exact qualified disposition while preserving the original collection. If another file or independent cycle is required, ask before editing.

Owner granted the recovery and T-351 completion on 2026-10-06. The separately preserved authorization identifies one legacy fault and T-351-a6/T-351-a11 only, with unresolved attribution disclosed and all other checks unchanged. This card does not accept T-351, widen another grant, rewrite a historical verdict or enable split roots. It supplies a supported recovery operation; no coordinator hand-edits authority. Existing unknown-fault collection refusal remains a control. Requested implementation/review GPT-6.1 Sol extra-high; observed identity is separate. No extra model demonstration, new lock framework, daemon or repeated platform-refused broad source-drill campaign.

The four owning paths are disjoint from the preserved T-351 candidate fence. Native protected tools must run serially with exact assigned-checkout prefixes. Current/frozen authority and visible effects require expected-identity checks and replay-safe durable evidence.

### T-351-s1-a6 recut criteria echo and implementation

The actual pre-implementation criteria echo was written to the assigned external
scratch before patch application or implementation inspection. Its five checks
are reproduced here without changing any criterion:

- C1: Preserve bounded contention, distinct durable raw refusal identities and
  verified requester context separately from lock ownership; keep unknown
  attribution conservative and lossless through interrupted absorption/replay.
- C2: Pin the exact fault and complete target/authority/binding set through the
  public entry; independently check genuine native/job cessation, candidate
  origins and cumulative physical scope; retain exact earlier genuine collection.
- C3: Persist immutable complete intent before effects, revalidate each target
  inside the existing transaction, resolve only the named hold atomically and
  safely distinguish completed/pending replay while preserving unknown callbacks.
- C4: Refuse ordinary unattributed legacy recovery; admit only separately recorded,
  pinned exact owner authorization after all unchanged checks, retaining the
  specified fault's uncertainty and the earlier failed review.
- C5: Use fixture-owned real repositories and the public entry for contention,
  recovery, prior collection, negative refusals and durable-boundary replay;
  retain ordinary/packet/detached controls and disclose unavailable coverage.

The supplied four-path patch was verified at SHA256
3ae08720f8b0145406a1a1458c68fe7dfa93a2a0a93b53f4b1b0662094ade83e
and applied cleanly to actual base f02c9cae12fc429566618747e626ea2091f1e1d1.
Each source/spec blob and SHA256 is identical to the retained candidate
at d79a3c633c8d95f3de02417143e1bab2422ffdd5. No foreign helper,
original T351 implementation, acceptance criterion or authority was edited.

The implementation supplies exact public recovery, durable raw faults/intent,
per-target transactional dispositions and strict physical UTF-8 validation.
It retains both intentionally shared prior-review regression bodies: foreign
terminal status cannot conceal live/unknown ownership; genuine stopped unbound
cessation can qualify only with complete recorded and physical proof. The
additional all-records inventory retains refusal for live non-native writers.
The prior independent rejection and original-base grade remain RED: at the
prior substantive ref bcee16e76e9cd905a63f5feb674baba27b165e7c,
parser469/app1171 passed; scoped e2e1075 of1078 passed, three unchanged
outside-fence fixture-copy failures. The separate S2 repair is inherited from
this new base; these paths are not imported into this patch.

Historical qualification remains historical. The thirteen property-site
campaign ran at 3c45ec92a3bfcb83c5f137566b70369eb37a5f21, with complete
51-body runs, each demanded property failure, full kill sets and literal restore
proofs retained in its supplied manifest/ledger. Strict-byte controls then
failed three whole bodies on that permissive source and passed after repair.
The compared complete functions/primary bodies stayed byte-identical while
transitive validation changed. That limit remains; neither reuse nor a current
positive is described as a new thirteen-site campaign or a proof waiver.

Current qualification is performed in the exact assigned independent disposable
fixture and graded source. Actual controls/grade/ref/cessation are recorded in
the final external handoff; no future result is asserted here. The genuine
RUN-ASK recut-procedure-T-351-s1-a6 received a normal recorded answer and actual
RUN-ACK before proceeding with own-card protocol and the bounded fixture route.
Only source and accurate notes precede grading; the final verifying status-only
commit uses the executor role's exemption and reruns nothing.

### Public recovery request and authorization formats


`recoverNativeTransaction(root, request, opts?)` is the supported operation; optional synchronous `onBoundary(name,index)` is test instrumentation, with `before-intent`, `intent`, `before-target`, `target`, `progress`. It conveys no authorization bypass. `nativeRecoveryTarget(root,attempt,candidate,mode)` constructs read-only pins; `nativeRecoveryIntentPath(root,id)` locates durable intent. Native `withNativeDurabilityObserver(observer,body)` exposes actual synchronous operation boundaries and restores its previous observer; `syncNativeFileNamespace(file)` repeats real namespace persistence.

CLI: `node tools/e2e/scripts/native-transaction-recovery.mjs --root <authority-root> --request <JSON-file>`. Exit0 returns the existing/exact complete disposition, exit1 reports a named refusal, exit2 rejects CLI spelling. Request/ruling/authority text must be valid UTF-8 before decoded identity comparison.

```json
{
  "version": 1,
  "id": "immutable-request-id",
  "fault": {"id": "<full64hex>", "source": "raw-ledger-v1|recorded-refusal-json-v1", "rawDigest": "<full64hex>", "reference": "<absolute preserved file; required only for recorded-refusal-json-v1>"},
  "targets": [{
    "attempt": "<full attempt>", "resource": "<canonical absolute resource>", "candidate": "<full40hex>",
    "mode": "collected-source|failed-no-work|terminal",
    "record": {"content": "<complete exact UTF-8 bytes as JSON string>", "digest": "<full64hex>"},
    "reservation": null,
    "binding": {"agentId": "<full identity>", "canonicalTaskName": "<exact task>", "childReportedThreadId": "<same identity>", "startTurnId": "<exact callback turn>", "identityProbeToolUseId": "<exact completed probe>", "boundAt": "<binding generation timestamp>", "correlationMethod": "<complete recorded method>"},
    "bindingDigest": "<SHA256 of JSON.stringify(full binding)>",
    "origins": {"authorityRoot": "<canonical root>", "resource": "<canonical resource>", "base": "<full40hex>", "gitDir": "<canonical Git dir>", "commonDir": "<canonical common dir>", "assignmentDigest": "sha256:<full64hex>", "briefDigest": "sha256:<full64hex>"}
  }],
  "authorization": {"id": "<recorded authorization id>", "digest": "<full64hex>"}
}
```

`targets` is explicit, nonempty and unique. `reservation` is exact observed absence (`null`) or `{content,digest}` with complete UTF-8 content; authorization is `null` only where independently attributable raw evidence permits the ordinary route. Binding is the entire public recorded object, including generation time/probe/turn and correlation method, never a field subset. Content digests are bare full SHA256; the two origin digests keep their published `sha256:` prefix. Legacy preserved refusal encoding is exact two-space pretty JSON plus one LF; deleted original sidecar bytes are not claimed as newly read.

Authorization is independently loaded only from `.supertaskr/native-recovery-authorizations/<id>.json`:

```json
{
  "version": 1, "id": "<id>", "authorityRoot": "<canonical root>",
  "authorizedBy": "owner", "recordedBy": "coordinator", "recordedAt": "<actual dated recording>",
  "evidenceReference": {"path": "<separate absolute owner-ruling file>", "digest": "<full64hex>", "quote": "<exact nonempty grant quotation>"},
  "fault": "<the exact request fault object>",
  "targets": [{"attempt": "<attempt>", "resource": "<canonical resource>", "candidate": "<full40hex>", "bindingDigest": "<full64hex>"}],
  "attribution": "legacy-unattributed",
  "disposition": "resolve-exact-native-transaction-refusal"
}
```

The ruling file is separately read and pinned by content/digest/quote. Coordinator recording remains distinct from owner authorship. Exact ordered authorization targets must match; attributable bindings cannot be broadened through legacy authorization. Missing/malformed/changed authority, unknown/live physical ownership, other holds and dirty/cumulative scope refuse. The trust boundary is the existing writable authority home; no cryptographic protection against its whole-home writer is claimed.

`collected-source` retains the exact genuinely independently sealed collection. `failed-no-work` retains a failed turn, unchanged admitted candidate, no successful collection, and every real/unknown callback; it does not require zero callbacks. `terminal` requires genuine recorded finished/failed cessation without inventing a collection. Historical stopped outcome may remain on a genuinely continued/current finished source. Immutable intent stores complete canonical request fingerprint/fault/auth/checks before target effects. Each target atomically receives one exact disposition and only its named hold resolution. Pending targets and exact-after retries revalidate current authority, whole workspace, physical cessation and grant/pause/seat before progress. No reservation release/reacquisition or historical verdict rewrite occurs.


### Current recut qualification before final range grade

At source d6d402fcbd14299728d621457bb5dff6a1c60555, the independent
fixture's six current public byte/foreign-cessation controls passed 6/6, exit0.
Two necessary source-only strict-reader discriminators then ran separately over
the complete 54 native/recovery bodies in that same independent repository.
Removing only recovery evidence's physical UTF-8 round-trip check produced
exit1, 53 passed/1 failed at the malformed fault public-entry assertion.
Removing only native authority's physical UTF-8 round-trip check produced
exit1, 53 passed/1 failed at malformed raw refusal absorption. Complete runner
reports/kill sets and intended source diffs are preserved; no test assertion
was changed. Neither fixture mutation changed the admitted source checkout.

Each mutated fixture file was restored by exact SHA256, mode and atime/mtime;
per-path committed diffs were empty companions to those proofs. The restored
complete native/recovery baseline then passed 54/54, exit0, with no skipped,
unexpected or flaky body. All four fixture/source SHA256 pins remain identical
to the retained implementation. This is bounded current strict-byte qualification,
not a repeat or relabeling of the historic thirteen-site campaign.

All 42 supplied campaign artifacts and 36 strict-byte artifacts matched their
manifest bytes/SHA256. A fresh AST comparison confirmed all thirteen complete
function/primary-body pairs literally identical to supplied preserved snippets;
all nine separately enumerated changed transitive-function hashes match the
retained strict source. Full historical kill sets, demanded primary failures,
restoration hashes and original refs remain disclosed. Source durability still
means observed filesystem calls plus process-crash replay, not arbitrary power
loss. No broad platform-refused guard-removal campaign was repeated, and no S1
proof waiver or new independent acceptance is claimed.

The intentionally shared prior rejected verdict at
563705bf49fdd3b02ca047863f526e446432f464 was read only for this card,
and the two supplied committed regressions remain unchanged. The fresh reviewer
must be told that this retained patch, prior report/verdict/regressions, manifests
and these current controls were executor inputs. No original or fresh private
phase-one attack/ground artifact or unrelated bench was opened.

The complete actual new-base range grade follows this substantive notes commit
and is reported externally by its exact ref and body counts. The old grade stays
RED; a new local result cannot rewrite it, accept the implementation, change
production authority or turn the failed T351 review into successful acceptance.
There was no new implementation repair or in-fence follow-through on this recut;
the retained byte-validation/foreign-cessation classes were qualified as above.

### T-351-s1-a6 repair after independent rejection

The completed independent T-351-s1-a7 review rejected c145b1e155ad0e286b6bf84860ab71e9610176cc. The intentionally supplied rejection/report and literal committed unreadable-foreign regression are repair inputs; no private attack or ground document is an executor input. The previous GREEN range remains its original result and does not establish acceptance. The frozen criteria, base f02c9cae12fc429566618747e626ea2091f1e1d1 and four owning paths are unchanged.

The repair criteria echo, recorded before implementation, is: C1 preserve bounded distinct requester/owner evidence and conservative unknowns; C2 pin complete authority, independently prove physical cessation/scope and preserve exact collection while refusing unknown foreign inventory; C3 preserve immutable intent, transactional rechecks, named-only atomic disposition and exact pending/replay; C4 retain exact separate owner authorization and await the pending policy clarification; C5 add genuine owning-site or discriminating data evidence for missing properties with complete selected kill sets and literal restores.

The earlier external delivery recipe claiming two authorized singleton requests was unsupported. The saved owner authorization identifies the exact fault and paired T-351-a6/T-351-a11 targets. No new singleton ruling is currently recorded. The unchanged pair's dependent OTHER_HOLD refusal and strict subsets' AUTHORIZATION refusal remain controls; no unrelated hold will be cleared. Criterion4's present-case deliverability remains unresolved pending a recorded owner clarification or a separately qualified contract-preserving route. Actual RUN-ASK repair-legacy-route-T-351-s1-a6 is durably recorded while independent in-fence repair continues. No production recovery occurs here.

The literal reviewer regression is retained without copying or modifying the independent rejected verdict. The defect class is permissive physical run-authority inventory being used to exclude a foreign writer. Missing, unreadable, unsupported or malformed ownership metadata must stay conservative before intent or target effects. A narrow strict namespace reader and a class sweep are to be independently qualified, preserving valid foreign cessation. The seventeen previously unqualified source properties remain qualification debt until actual primary evidence is recorded; collateral setup failures and GREEN alone do not pay it. Historical campaigns remain at their measured refs, with transitive validation and power-loss limits intact.

### Current conservative-inventory repair and property evidence

The repair implementation at 0f5d9269283ee52cc6fe48833106e94106530659 replaces recovery's permissive physical run exclusion with a strict ownership inventory. It independently reads namespace type, exact physical UTF-8/JSON, version and lifecycle, writer/resource agreement, supported assignment identity/resource and digest, and owned-job inventory before a target can pass. Unknown inventory refuses before intent or target effects. The literal a7 regression is preserved. The added malformed-metadata/namespace body includes an independently accepted read-only authority control. Valid genuine foreign terminal and stopped/unbound cessation remain accepted. Assignment card identity is not incorrectly conflated with physical namespace; the initial overstrict check and its actual RED result remain evidence.

The literal reviewer regression at e1dec145beaa787fee73b2648c12157bbe3e109d produced exit1, 4/5 passed and the intended malformed-authority failure. The initial strict source at 12b37cd734d87590d3c5d5fdcffc068d2c0e8a77 produced exit1, 5/6 passed and rejected the valid terminal-cessation positive. After the namespace correction, the same six public controls passed 6/6, exit0. The prescribed single permissive-inventory callsite mutant at corrected source produced exit1, four adjacent controls passed and both unreadable/malformed-inventory bodies failed at their actual no-intent/no-target-effect observations (four original corruptions and nine additional classes all escaped). This is property failure, not a missing import or collateral setup error.

The current property map is /private/tmp/supertaskr-T-351-s1-recut-v1/repair-v1/current-property-qualification-map-T-351-s1-a6.json. Six bounded groups preserve complete selected kill sets: assigned inventory (6 selected, 4 pass/2 primary failures); published immutable intent fingerprint data (3 selected, 1 pass/2 primary resume failures); absorption raw digest output (2 selected, 2 primary failures); requester attribution and unknown-refusal output data (3 selected, 3 primary failures); disposition raw-content and legacy-attribution output data (2 selected, 2 primary failures); nine discriminating fixture input arrangements (9 selected, 9 primary public-result failures). All seventeen previously missing body names have current evidence for their specified safety subproperty. The intent-data race body survived and is not counted as a kill; separately making the concurrent request's content identical produced its demanded primary result failure. Input-data controls change actual persisted/request/boundary data with assertions and production guards unchanged. They are not claims that each listed subfield in a composite title has a separately removed guard.

Every executed control ran at the exact corrected four-file pins in the independent fixture, read its literal landing from committed diff, recorded actual argv/cwd/ref/SHA/PID/PGID/exit/ceiling and primary failure, and restored original SHA256, mode and nanosecond clocks with per-path diff0. One preparation stopped before any job because its final byte anchor occurred twice. Its partial diff and failure are retained, literal bytes/mode were restored, and unavailable initial clocks are disclosed; it supplies no qualification. The executed input control was separately captured and restored with complete clock evidence. Historical thirteen-site syscall campaigns remain at their actual historical ref, with exact artifacts and the late changed-transitive-validation limit; no broad refused guard-removal campaign or S1 waiver is claimed. Current output-data and complete restored positive controls establish specific present integration behavior, not arbitrary power-loss durability.

After all executed current mutations were literally restored, the complete native/recovery positive at 0f5d9269283ee52cc6fe48833106e94106530659 passed 56/56, exit0 (30 native and 26 recovery bodies, no skips/unexpected/flaky). Actual PID/PGID32892 ended and was collected. All four tested/source pins matched; independent fixture tracked/index diffs are empty. This result complements the property controls and does not replace the original-base grade or independent review.

RUN-ACK repair-legacy-route-T-351-s1-a6 was genuinely written after reading the answer in the actual admitted ask path /Users/ujju/Projects/supertaskr-evidence/execution/repository-separation-2026-10-05/T-351-s1/recut-v1/ask-T-351-s1.md. The earlier scratch ask copy was not the admitted channel. The latest answer grants no singleton authority and retains the pending direct owner clarification. Criterion4's present exact-pair deliverability remains unmet: paired dependent OTHER_HOLD and strict-subset AUTHORIZATION refusal are preserved. The old external report's singleton production recipe was unsupported and is superseded by this correction. Generic fixture authorizations demonstrate API behavior only. No production recovery, unrelated hold resolution, merge or push occurs. No GREEN result accepts this rejected card.

The final actual original-base owed set, no-body checks and blessed range grade follow this substantive notes commit and are reported by exact tested ref/count/exit in the repair report. Final verifying status is a separate status-only commit; historical results are not rewritten.

### T-351-s1-a6 approved ordered-route follow-through, 2026-10-07

The prior completed repair correctly left C4's dependent exact pair operational
route unmet. Those refs, grades, partial qualification limits and manifests remain
unchanged. The owner subsequently explicitly approved recovering the named fault
on the genuinely collected a6, independently reconciling failed no-work a11, then
recovering only the same fault there if all checks pass. This executor read the
updated normal answer stamped 2026-10-07T11:34:36.507Z and the actual owner evidence,
then wrote renewed genuine RUN-ACK in the admitted ask channel before proceeding.
No production disposition, new singleton policy or criterion change follows.

The existing public v1 request may now carry `sequence: {version:1,index:0|1}`.
Its pinned separately recorded complete owner authorization may carry
`sequence: {version:1,steps:[{requestId,target},{requestId,target}]}`, retaining
its complete `targets` identity pair. Each policy target is the full public
`nativeRecoveryTarget` pin. The first mode is `collected-source`, the second
`failed-no-work`. The first request must match its complete frozen original
policy target. The second request supplies freshly read literal record and
reservation pins after ordinary independent reconciliation, while retaining
exact ordered attempt/resource/candidate/binding/mode/origins identities.
The authorization reference/digest and quoted independent ruling remain required.
Without this explicit policy, complete exact target-set equality remains required.

Before the second step and each visible effect, recovery independently loads
the first step's durable immutable intent, checks its original full target
against the complete pinned policy, reconstructs its only exact resulting record,
and rechecks its current cessation, jobs, reservation, candidate/cumulative scope
and current grant/pause/seat evidence. Missing/changed/incomplete predecessor
intent or outcome refuses. A crash before predecessor progress must be repaired
by replaying that identical original request before sequence advancement.
Recovery clears no intervening independent hold; public ordinary observation
performs the failed review's lifecycle/workspace reconciliation separately.
All records retain unknown outcome/callbacks and the original eligible collection.

Three new property bodies exercise the complete route, current negative and
inside-transaction arrangements, and actual process interruption at all twelve
persistence operations of intent/target/progress for both steps (72 cases).
Their actual committed-ref qualification, literal restore proofs, final positive
and original-base grade are reported in the new separate `sequence-v1` handoff.
The first dirty development run passed three bodies but one schema tightening
was written during that job; its exact launch pins/output are preserved as
mixed-development evidence and are explicitly excluded from qualification.
No later source mutation occurs during an active owned job.

Historical thirteen-site proof and prior current-site controls remain their
actual history and limits. The disposition construction is now a shared pure
helper used by normal replay and predecessor checking; this transitive change
is disclosed and does not retroactively qualify an older body or campaign.
The same four code/spec paths and admitted own-card protocol surface remain the
entire fence. The final status-only verifying commit will rerun nothing after
the substantive candidate's actual original-base range is graded.

The ordered-route code/spec qualification ran at
`a62ae16a1fd7e55c1ccdd088bf66cc249a098267`. Each of three narrow current
property controls selected one body, exited1 and failed its intended public
assertion: unsupported persisted policy blocks the positive route; a genuinely
complete predecessor data arrangement invalidates the incomplete-prior negative;
corrupt new durable intent fingerprint blocks checked sequence advancement.
No expectation was inverted and no broad safety-guard campaign was repeated.
Literal restorations proved SHA256, mode, both nanosecond clocks and per-path
diff0. These controls qualify their stated arrangements, not every individual
subfield of the composite negative body through separate mutants.

The actual restored full native/recovery run selected59 and exited1 with56
passes and three failures, each receiving `spawnSync status:null` on an expected
successful child CLI. Its actual logs and47.3m wall duration remain preserved;
the configured900-second wait ceiling did not report a timeout, and the reason
for that timing/status anomaly is not inferred. A necessary unchanged-source
recheck selected exactly those three bodies and exited0 with3 passes in3.6m.
The complete ordered route and19 negative arrangements passed in the first run;
all72 ordered process-crash persistence cases passed in the recheck. This is not
reported as a full59 GREEN. The substantive original-base grade below the final
handoff will separately record its own actual ref, counts and exit. No assigned
criterion is intentionally omitted; actual production eligibility remains for
the coordinator after fresh independent acceptance and protected delivery.

### T-351-s1-a6 focused physical-file correction, 2026-10-08

The interrupted independent review and candidate797600a14ed19e010c5cd4949534f98adc6e3f75 remain preserved. The explicitly shared finding demonstrated twelve dangling-entry arrangements: reservation, emergency hold and raw-fault directory, present initially or inserted before target publication, through ordinary attributable and independently owner-authorized historical fixture routes. Both legitimate positives reached completion first. All twelve wrongly proceeded and changed their selected target while retaining the dangling entry. The reviewer prepared no qualified repair; its unfinished or refused scripts are not executor inputs.

This correction retains C1's distinct unknown fault/requester evidence, C2's complete independently checked physical authority/cessation/scope and exact prior collection, C3's immutable intent and transactional named-only replay, C4's separate complete pinned owner authorization and ordered policy, and C5's real-repository positive/negative qualification with unavailable coverage disclosed. No criterion, production authority, fence or platform-stop restriction changes. The defect class is physical invalid authority being mistaken for absence or followed as a regular control entry. A newly independent public-entry regression will establish fail-before/pass-after before the required original-base grade. Existing historical RED, changed-transitive qualification limits and earlier exact evidence remain unchanged. Source changes stay in the four paths and own card; the genuinely acknowledged normal evidence-route answer retains the declared external file-handling-v1 scratch and independently owned fixture.

The independent regression-only candidate d2f7727e0d3c19eaf77752da4b1519b48c9159ce retained the exact pre-repair recovery module and failed both focused bodies, exit1. Its twelve reported arrangements all escaped, changed their target, retained their dangling entry and recorded completed[0]. Its adjacent eleven arrangements also recorded linked brief/fault/authorization/ruling and intent escapes, while existing correctly refusing record-recovery/type cases remained explicit controls. A mistaken anchored selector initially selected zero bodies and is preserved as an invalid run, never a pass.

The repair at92f78c27a957e88127185f10224a8ae65ce532d3 replaces follow-symlink existence checks with physical lstat/type checks. Only ENOENT means absence. Regular evidence files and every in-root control-directory component are independently checked; unreadable entries, links and wrong types refuse. Raw-fault/emergency checks run before transaction acquisition and again inside its existing boundary. Initial intent publication rechecks genuine absence; each target/replay/progress effect checks the exact durable intent bytes and type so an intervening entry cannot be overwritten. Current authorization, named holds, cessation/scope, exact sealed collection and unknown outcome checks remain required.

The same two original focused bodies passed2/2 at92f78c27. The final test candidate51e9b38abca96e1445156edb34a97a3b65203e0b adds valid ordinary/authorized replay and invalid intent before-publication/replay arrangements; it passed2/2. To qualify those exact current bodies, the independently owned fixture then received the literal complete pre-repair module from the preserved own export, with assertions and individual guards unedited. Both bodies failed their intended public-entry/property assertions, exit1, with all twelve dangling and thirteen adjacent observations retained. This is one focused functional original-version comparison of the physical-entry property, not the prohibited broad guard-removal campaign. Exact repaired SHA256, mode and both nanosecond clocks were restored, with committed per-path diff0; both restored current bodies passed2/2, exit0. Typecheck passed at the final test candidate. All outputs, complete selected kill sets, actual refs/pins/argv/PID/groups/finite ceilings/exit receipts and restoration are retained in the new external file-handling-v1 evidence.

Current qualification establishes this physical-entry class and its stated publication/replay arrangements. It does not claim one mutant per composite title/subfield or retroactively qualify the historic thirteen-site campaign against the new transitive evidence reader and intent checks. The earlier historical RED, later three-child-status RED and subsequent actual grade remain their original results. No arbitrary power-loss, hostile whole-home writer protection, OS/read isolation or cryptographic grant proof is supplied. No interrupted reviewer script, prepared fix, private attack/ground or refused broad campaign was opened or executed. Unavailable broad campaign coverage remains explicitly disclosed without an S1 waiver. The fresh independent verdict is pending. Required original-base grade is measured after this substantive notes commit; only the final verifying status may follow under the role's status-only exemption.

The first physical repair's actual required range atc4b8ef4506a95733694bf83ed2f59a1966037264 passed parser469/app1171/scoped e2e1087, exit0. Its group92111, dedicated server group92517 and listener15351 actually ceased and were checked before more source work. This GREEN is preserved as intermediate evidence. A further ordinary class check found that same-resource foreign cessation still ignored a dangling sibling emergency entry. New initial/before-target arrangements at5a0fdcb953506d5139e240d8efb4dbd705b81aca selected2 bodies, passed1 and failed1 at the intended foreign-emergency public-result assertion. Both escaped, completed[0], changed the selected target, and retained the foreign record/link. The twelve prior dangling and thirteen prior type/intent arrangements remained passing controls, so this was not a collateral setup failure.

The minimal completion at2e6150af8246292e44f80f0028251f11e81a4368 passes the canonical authority root into foreignCeased and physically checks its emergency sibling before either terminal or stopped cessation can exclude it. Invalid presence or an unabsorbed hold remains unknown foreign authority. The exact current bodies passed together with the existing genuine same-resource terminal and genuine stopped/unbound cessation controls:4/4, exit0, twelve dangling and fifteen adjacent arrangements. Current byte/type/intent checks and owner policy are unchanged. The new regression and source change require a separate final original-base grade; the first grade is not promoted across this change. No arbitrary unchanged repeat or refused campaign is authorized or performed.

A second bounded ordinary file control at05e01b56ea85897366a6572da3998da3ead910f7 retained a valid pending emergency file on a genuine-ended unselected record. The initial arrangement escaped: native transaction acquisition automatically absorbed that sidecar, changed the foreign record, deleted its file, then changed the selected target and completed[0]. The before-target arrangement already refused and remains an explicit control. The same two bodies selected2/passed1/failed1 at their actual intended public property assertion. Repair54ed79973956caefab4ef9f9405a3c5a0694b245 checks every known unselected emergency sibling before acquisition and onAcquired, before ordinary engine absorption. Its exact unchanged bodies and genuine foreign cessation controls passed4/4, exit0, twelve dangling and seventeen adjacent arrangements. Ordinary absorption must finish separately; checked recovery mutates no foreign authority.

Criterion3 also covers completed-progress publication after the fresh target boundary. The preceding checks cannot establish current resulting record, reservation, origins, candidate and policy after that observer boundary. Independent regression-only ref9fa157e398010d3ec0ff1047c6118f7efdf144ff first completed both legitimate ordinary/owner-authorized fixture routes and exact replay, then selected one body and failed its intended progress-property assertion. All eight actual persisted-state arrangements reached the target boundary and wrongly completed[0]: changed resulting record, reservation, brief origins, dirty candidate, pause, changed valid grant, owner reference and fault ledger. Each retained one already published legitimate disposition and unknown callback receipts, so these are direct property failures rather than setup failures.

The minimal repair528aeb33c8ada5ce0b373d608fdc8123d6cf140e loads current fault/authorization/ordered predecessor evidence and reuses the resolved exact target check after the target boundary. It compares candidate and policy against the immutable intent, then checks exact intent bytes immediately before progress publication. A refusal preserves the arranged resulting record and its legitimate already published named disposition, with completed[] pending and unknown outcome/receipts intact. The exact unchanged new body passed together with the two current physical-file bodies, existing interrupted replay, pending-next-target, genuine foreign-terminal and genuine stopped-unbound controls:7/7, exit0. The three focused property bodies cover twelve reported dangling, seventeen adjacent physical/intent and eight progress arrangements,37 total. These narrow public data arrangements qualify their actual current properties and kill sets; they do not rerun the historical thirteen-site campaign or the unavailable refused broad campaign. The earlier intermediate full grade remains at its real ref; the required final original-base range follows this substantive notes commit. No independent acceptance or production recovery is inferred.

### T-351-s1-a14 publication-boundary repair, 2026-10-16

The independent a13 rejection and its committed regression remain unchanged.
Clean re-entry is 44062efc08f6b4b3df5f145577fda83c168a8f10; the original
cumulative contract/range base remains f02c9cae12fc429566618747e626ea2091f1e1d1.
All five criteria and the four-path fence are unchanged. This executor read
the shared verdict/regression and transient witness patch as repair inputs,
without opening private attack or ground files. Requested model/effort is
GPT-6.1 Sol/xhigh; observed serving identity and usage are unknown.

The pre-implementation criteria echo was written in the assigned durable
external evidence directory before source inspection or editing: C1 preserve
bounded distinct raw refusals and independent requester/owner attribution;
C2 pin complete authority and independently check cessation/jobs/cumulative
scope and exact prior collection; C3 persist immutable intent and check exact
current authority at each visible publication, retaining named-only pending
and replay outcomes; C4 retain the separately recorded exact legacy/ordered
owner policy and current fault/binding/grant/pause/seat checks; C5 use public
fixture-owned positive/negative/interruption controls and honest drills.

The defect class is validation separated from visibility by atomic-write
observers and persistence work. The atomic writer accepts a synchronous
pre-publication check after its final before-rename observer, immediately
before rename. Recovery supplies that check at initial intent, target, fresh
progress and replay-progress sites. Each independently reloads fault and owner
authorization, ordered predecessors and pending faults; exact target checks
retain record/reservation/binding/origins/candidate/cessation/jobs/policy and
immutable intent. Initial intent checks the entire target set and absence.
Earlier successful target publication remains discoverable with progress
pending after refusal. Unknown callbacks and genuine collection stay intact.

At the unmodified re-entry source the committed pause regression ran RED,
exit1/one failed body, reproducing all three reported escapes. The first
development repair run passed the unchanged regression, contention body and
new replay body, 3/3. The new body supplies ordinary and separately authorized
legacy replay positives with exact collection/receipt preservation, and 22
actual rename arrangements spanning pause, record, binding, reservation,
candidate, origins, grant, seat, intent, fault and legacy policy evidence.
These diagnostics are dirty-source development readings, not final grades.

#### In-fence follow-through

- In native-codex.spec.ts's transaction-contention body, four added-plus-removed
  lines retain an owned-holder release/await closure and invoke it in finally
  before fixture cleanup. This restores owned-child cleanup when an earlier
  assertion throws; no production path, criterion or suite scope is added.

Property-site qualification, assertion poisons, failure-path cleanup proof,
literal restoration hashes, final gate derivations and the original cumulative
range reading follow this code/notes snapshot and will be retained in the
external report before handoff. Historical RED and incomplete campaigns stay
at their actual refs; this repair supplies no acceptance or proof waiver.
No production recovery, authority edit, merge, push or CI is performed.

#### A14 committed-snapshot qualification

At 2e5c8e83b175afd7d3c7f345ca962e7526732291 the independent fixture
matched all four admitted code/spec SHA256 pins. Its three focused positives
passed3/3 before mutation and again after all literal restorations. Removing
only the atomic writer's final pre-publication callback killed both selected
publication bodies, exit1/2failed, at their actual unchanged-authority
assertions. This includes the new replay body's 22 authority arrangements.
Both new assertion sites were then poisoned separately, each exit1/1failed
at its intended assertion, zero skips. The full selected kill sets and
landings are retained; no broad guard-removal campaign was repeated.

The separately authorized legacy fresh-publication data arrangement passed
1/1 with all three actual before-rename pauses refusing before visibility.
The contention teardown's forced early assertion control exited1/1failed
as intended; independently observed owned holder PID31213 had ceased and
its fixture was removed, with no signal sent. The unchanged positive
contention body passed in both restored focused runs. This is one small
in-fence follow-through, with four changed lines as measured above.

Every executed fixture mutation was restored to its named snapshot by
SHA256, original mode and both nanosecond clocks, with empty explicit
HEAD-to-path diffs as companions. An initial restoration instrument check
failed because its subsequent Git diff reread advanced atime; bytes, mode
and mtime already matched. That failure is retained. Restoring the clocks
after the companion read established all exact proofs before more work.
Native source restored to SHA256
62f529d9e65ed6b579e46eebd572c94fea37f162d317569223b6541072cfd77b;
recovery spec to
03da7d14c09d1acb590fca82c2638bdb67b485680eef659787fa91dbd5fa951b;
native spec to
3aa4bdc2cd18516b649383266c3866f3b08bbca67cd335180f36a3ecdca1de38.

The class sweep enumerates all four recovery atomic writers: each now
supplies publication validation; the unchanged entry source supplies none,
which demonstrates the sweep's nonempty control. This structural sweep
complements the functional property mutant rather than replacing it.
Typecheck, token lint, whole-tree docs lint and graph check passed at the
committed snapshot. The docs diff gate exited1 because it owes parser, app
and e2e; it found no illegal frontmatter. Capability currency exited1:
committed census129651 bytes versus fresh133879. The generated index passed
its docs check. No generated output outside the manifest was changed.

Both original cumulative and re-entry owed sets were independently derived
at that snapshot, each covering five paths, parser/app and21 e2e specs.
The required original-base range grade runs after this substantive notes
commit; its exact final ref/counts/exits and job cessation belong to the
external report. Earlier incomplete qualification, historical RED and
changed-transitive limits remain unchanged. No whole historical assertion
or property matrix, arbitrary power-loss proof, competing-writer guarantee
or qualification waiver is claimed. The card already carries verifying;
no status-only change is needed and no post-grade substantive commit is
planned. The verifier and integrator remain separate seats.


### T-351-s1-a16 complete selected-target repair, 2026-10-17

The actual a15 rejection at42b67b8676ddbe9a4f395ae418b69cba8bdb2360
and regression2861c25bd6c167c58ccb32ae8522f51a3386fb3b are preserved
unchanged. The latter is this writer's clean re-entry; the complete original
contract/range base remains f02c9cae12fc429566618747e626ea2091f1e1d1.
All five criteria, four owning paths, legacy owner policy and ordered route
remain literal. The published native binding and actual fixture-route answer
were read and genuinely acknowledged. Requested model/effort is GPT-6.1
Sol/xhigh; observed serving identity, effort and usage remain unknown.
The shared verdict, committed regression and named transient witness patch
were repair inputs; no private attack/ground artifact or verifier conversation
was opened. All prior rejected, interrupted and unknown readings remain history.

Before implementation inspection, the external criteria echo restated C1's
bounded distinct fault/requester evidence and conservative unknowns; C2's exact
complete pins and independent cessation/jobs/origins/cumulative scope/collection;
C3's immutable intent, named-only atomic disposition and exact selected-set
pending/resulting/replay checks; C4's separately recorded exact legacy/sequence
policy and current authority; and C5's public fixture controls, actual drills
and honest qualification limits.

The defect class is selected target authority falling out of the checked intent
between effects. The common publication callback now validates every selected
target: earlier exact resulting records, the current publication's expected
state, and later original pending authority. Each uses the same independent
record/reservation/binding/origins/candidate/cessation/jobs/policy checks and
compares the complete check with immutable intent. The existing final atomic
callback remains immediately before rename at all four guarded writers. A final
complete-result check also covers successful no-write replay and interventions
after the last progress or namespace observer. Refusal keeps legitimate prior
completion discoverable, without mutating any further target or progress.

The unchanged a15 two-target regression and two new three-target bodies passed
3/3, exit0, on dirty development source based at2861c25b. The new bodies retain
five successful multi-target/fresh/replay controls and50 actual drift cases:
36 completed-or-pending target record/reservation/binding/candidate/origin/
unknown-job arrangements at target, fresh progress and replay-progress rename;
14 final fresh/no-write-replay result arrangements across first/middle/last
records, origins, candidate, reservation and unknown jobs. Unknown-job and
binding arrangements change exact record bytes; they are not separate proofs
of physical liveness or individual internal subguards. Actual source pins,
body counts, per-body durations, bounded process identity and cessation are
retained externally. No skipped, flaky or unexpected body was reported.
Installed package/lock metadata and actual package versions matched before
reuse; parser and app were freshly built before these tests.

The committed-snapshot property controls, four new assertion-site poisons,
literal bytes/mode/nanosecond-clock restores, source-class sweep, final gate
readings and one complete original-base range grade are recorded in the final
external handoff after actual execution. No current full historic property or
assertion matrix, arbitrary power-loss proof, competing-writer guarantee,
qualification waiver, independent acceptance or production recovery is claimed.
The card already reads verifying, so no status-only commit is needed after the
final grade. No merge, push, CI or real authority edit is assigned.


#### A16 committed-snapshot qualification

The permitted isolated clone atb1034d3641b8530c97ccd2f7a03c1f6823854a41
matched457 tracked source/package/configuration inputs,72 fresh parser build
files and all four product/spec SHA256 pins. Dependencies were independently
copied only after actual installed lock/package-version validation; no real
native authority was copied. Frozen focused baseline and final restored runs
both passed3/3, exit0, with no skips, flakes or timeout.

The complete-selected-set property control reduced only the common helper to
current-index checking, leaving the atomic visibility callback intact. All
three selected bodies failed at their actual authority/refusal assertions,
exit1. The final-success property control removed only the last result check;
its one selected body failed with all14 final drift cases escaping, exit1.
The positive controls stayed viable. These are complete selected kill sets,
not whole-owning containment. Each of the four new matcher sites then received
one separate one-sided assertion poison and failed its intended body,
4-for-4 RED, zero skipped. One initial selector preparation counted both later
bodies and stopped before any fixture write or test job; its actual setup
failure is retained and supplies no qualification.

All six executed mutations restored exact SHA256, original mode and both
nanosecond clocks, with explicit HEAD-to-path diff0 as companions. Recovery
restored to13b2a733254b4928324c69d434c51efff5b5f7667732c96e2bfac5c233f7e37b;
recovery spec restored to5b233d5328f0eb7dc0276d9e182974c35a27c9ff1ced4b882ad9c9032472c84f.
All four source/fixture pins matched after the restored positive run; its
fixture tracked diff was empty and port15351 had no OS listener. Every recorded
owned process had ceased. Per-run arguments, cwd/ref/pins, starts/ends/elapsed,
ceilings/exits, actual failure text, restore proofs and full selected outputs
are in the separate completed-target-repair evidence bundle.

The source-class sweep enumerated all four recovery atomic writers with their
publication callbacks. Its known-defective re-entry control reported both
missing complete-set and final-result guards; the repaired snapshot reported
neither missing. Independent AST inventory found exactly two new bodies and
four matcher-call sites, matching the executed assertion poisons. Functional
controls complement this structural sweep. No further in-fence follow-through
or broader historical campaign is claimed. Final static/gate derivations and
the complete original f02 range grade follow this substantive notes commit
and are reported externally at the actual final ref. The already-verifying
card needs no subsequent status-only commit.


### T-351-s1-a18 ordered namespace repair, 2026-10-17

The completed a17 rejection and committed regression at
b683413a00cbc1deb7db75aa9e95a9b39980e897 remain unchanged. This is the
clean repair re-entry; f02c9cae12fc429566618747e626ea2091f1e1d1 remains
the original cumulative contract and grading base. All five criteria and
four owning paths remain literal. The public a17 report and corrected witness
were repair inputs; no private attack, ground or verifier conversation was
opened. Requested GPT-6.1 Sol/xhigh is distinct from unknown observed serving
identity, effort and usage. Native binding preceded every repository read.

The criteria echo was written externally before implementation inspection:
C1 retains bounded distinct fault/requester evidence and conservative unknowns;
C2 retains complete exact pins, genuine cessation/jobs, origins/cumulative scope
and the original collection; C3 retains immutable intent, named-only atomic
resolution and exact coupled/selected authority for publication and replay;
C4 retains the separately recorded exact legacy/sequence owner policy and
current authority; C5 requires public fixture controls and honest actual proof.
The normal owned-fixture answer was read and genuinely acknowledged before use.

The defect class is a final authority checker performing namespace persistence
and invoking another durability observer after checking coupled predecessor
evidence. Predecessor namespace persistence is now a separate operation before
fresh fault/owner snapshots and the observation-free final sequence and complete
selected-target checks. The same final path covers all four atomic writers and
successful fresh/no-write replay completion. Ordinary serialization and actual
persistence calls remain; no timeout, callback, authority policy or hold is
broadened. The final checks' transitive record/workspace/policy/liveness readers
perform no native persistence or durability-observer callbacks; transaction
release checks ownership and removes only its own lock without a new observer.

Two new paired public bodies exercise each consumer boundary, both predecessor
record/intent namespaces, before/after parent and directory flushes, and coupled
fault/owner/policy/predecessor/selected-target evidence changes. Actual committed
snapshot controls, body/assertion inventory, property/data/assertion failures,
literal restores and final counts belong to the external a18 handoff after
execution. No new result, complete historical qualification, independent
acceptance, arbitrary power-loss or competing-writer guarantee is asserted here.
The earlier verdicts, historical RED and incomplete campaigns stay at their
actual refs. No production recovery, grant change, merge, push or CI is assigned.
The already-verifying card needs no later status-only change. The final original
range is graded only after all substantive code and notes are committed.



#### A18 committed-snapshot qualification

At 8a72994645f1c897c5978deb17cfe0a072894637 the new independent clone
matched every tracked input and used fresh locked installs and fresh parser/app
builds. The retained a17 regression and both new bodies passed3/3, exit0,
with zero skips/flakes/timeouts in557.359 seconds. The two new bodies exercise
six viable boundary controls plus48 actual interventions across six consumer
boundaries, two predecessor namespaces and four before/after flush stages;
the dependency body adds one viable grant control and20 persisted-data cases.
All68 interventions refused without a further record or progress effect.
Original collection, terminal outcome and unknown receipts remain checked.

The exact original re-entry recovery module was then substituted only in that
owned clone, with every assertion unchanged. Its literal18-line class landing
produced three intended body failures, exit1, zero skips/harness errors/timeouts,
in504.214 seconds. All48 boundary cases violated their expected no-further-effect
or successful-return requirement; nine dependency cases exposed further effects
(prior intent/binding/jobs/reservation/candidate, fault, authorization, owner
ruling and pending fault). The remaining eleven cases already refused correctly
and remain controls. These actual data arrangements qualify the boundary class;
record-byte pinning of job/binding arrangements does not separately remove or
qualify each internal physical subguard. The selected kill set is these three
bodies, not a whole-owning-set containment claim or a repeated historic campaign.

Each of the four new matcher sites was poisoned separately on one assertion
side and failed at its intended site,4-for-4 RED, zero skips/flakes/timeouts.
The jobs used four newly owned disjoint clones, outputs and ports15352–15355,
with all tracked/configuration/dependency bytes verified and parser/app freshly
built. Their provenance names the actual common3/3 baseline; no separate baseline
run in each copy is invented. Each complete poisoned body also executed its
viable controls. Every sampled descendant identity and recorded process group
ceased. Exact original bytes,0644 mode and both nanosecond clocks were restored,
with explicit HEAD-to-path diff0 companions. Recovery restore SHA256 is
89ae5c0814518bb5f3d16b55006a8ae173b09df7c8cbea7b8c29f22dbc5e8235;
spec restore SHA256 is
94efc697835d94d4a7b31e68171e04427f2c5b312743c7e1f6125ca2b8a05c3c.

The original cumulative AST inventory derives378 changed matcher sites:
370 recovery and8 native, across40 recovery and30 native bodies at that ref.
A synthetic planted matcher changes recovery370 to371. There are exactly two
new bodies and four new matcher sites. The class sweep finds two persistence
calls inside the defective sequence checker, zero in the repaired checker and
one in its planted control. All four recovery atomic writers retain their
publication callback. The final callback performs predecessor persistence first,
then fresh exact fault/owner, pure predecessor and complete selected-target checks.
Manual transitive reading found no native persistence/observer call in those
final readers. This complements actual functional failures; it is no arbitrary
OS/read isolation or concurrent-writer proof.

Full raw outputs, source/configuration/dependency pins, per-operator landings,
restores, actual argument/ref/process/elapsed/ceiling receipts and unrun limits
are retained in ordered-namespace-repair-2026-10-17-v1. Final static/gate results
and the one original f02 cumulative range grade follow this substantive notes
commit and are reported externally by exact final ref. Historical qualification
debt, the remaining full independent matrix and generated integration-only
census currency are not waived. No further in-fence follow-through was added.


### T-351-s1-a20 accepted-work namespace inventory repair, 2026-10-17

The permitted ordinary repair re-enters at
1d3cbbd1238aaa1dac20d150bcc57be29e749a85; the original cumulative
contract/range base remains f02c9cae12fc429566618747e626ea2091f1e1d1.
All five criteria, four source/spec paths, legacy policy and prior verdicts
remain unchanged. Native registration and explicit normal binding preceded
repository reads. Requested GPT-6.1 Sol/xhigh is distinct from unknown observed
serving identity, effort and usage. The complete packet, current card and role,
public coordinator status and preserved literal regression were inputs. No
private attack, ground or verifier conversation was opened.

The external criteria checklist preceded implementation inspection: C1 retain
bounded distinct durable refusal/requester evidence and conservative unknowns;
C2 retain exact complete authority pins, independent cessation/jobs/origins/
cumulative scope and original collection while inventorying every supported
work namespace; C3 retain immutable intent, current transactional checks,
named-only disposition and exact pending/replay; C4 retain the separately
recorded exact legacy/ordered owner policy and current authority; C5 use public
fixture-owned ordinary controls and disclose unavailable independent proof.

The accepted work grammar admits reservations and internal-metadata-like names.
Run records are direct JSON children of their work directory. Reservation
metadata is also direct JSON in runs/reservations, at its resource-basename and
12-hex-digest path; native lock/recovery files and fault/refusal/intent directories
share that metadata namespace. The repair removes whole-directory exclusion
from the strict recovery inventory and native record/listing/temporary cleanup
walks. Strict recovery checks every direct JSON entry, excluding only complete
version-one published reservation metadata with agreeing work/attempt fields
at its independently derived resource path. Native discovery opens supported
reservations-aN.json record names in that shared directory and applies the same
metadata discriminator there; other metadata filenames remain the existing
exclusive-create reservation admission's responsibility. Strict recovery keeps
malformed, linked, wrong-type or unsupported physical authority conservative.
Pre-existing valid records are
read; future identifier rejection is not the repair. No public recovery request
or authorization version, contention bound or four publication callback changes.

The preserved patch matched SHA256
493b3abaf8096182deb84089ed7fdcd4fec5339aba50420aa5890bd2a5727fcc,
passed exact applicability checks and produced the literal preserved spec
snapshot at import. Its unchanged public live-foreign body now passes. Three
additional ordinary bodies cover native reserved-work binding/listing/unknown
refusal absorption, fourteen metadata/record arrangements, and six further
accepted work shapes. Successful metadata-only, historical ended-record and
public genuinely stopped/unbound reserved-native cases remain viable, including
recovery of a genuinely collected reservations-a1 beside stopped reservations-a2.
Unknown jobs, live owners, malformed/type/link entries and metadata lookalikes
refuse before intent/target effects; genuine collections, unknown receipts and
foreign bytes remain exact. The final dirty development focused run selected
four bodies and passed4/4, exit0, no skips/flakes/timeouts,22.719 seconds.
Fresh locked installs and parser/app builds preceded it. An earlier development
typecheck reported two type annotations, corrected before that final run;
final committed static/range results belong to the external handoff.

The ordinary source-class search finds three native and one recovery whole
namespace skips at the actual known-defective re-entry and zero at the repaired
source. This is a read-only comparison, not a new property mutation. The generic
run-record allRecords omission remains outside this fence: the ordinary public
fixture actually reported nativeVisible:true and genericVisible:false for its
bound reservations-a1. The strict recovery inventory does not depend on it.
RUN-ASK adjacent-generic-inventory-T-351-s1-a20 parks a separate generic inventory
and admission/quota-consumer task, waking before a generic sweep is treated as
complete writer authority or the next run-record lifecycle/inventory repair.
The actual normal answer was read and RUN-ACK was written before final grading;
this suggested follow-up remains for coordinator filing under the established
ID convention, without a new task path inside this frozen fence. The generic
omission remains unfixed. No out-of-fence edit or new follow-through was made.

The first actual original-range reading at
d746e077db93e3799638c6c40d5c8e7f44f57233 is retained RED: parser469
and app1171 passed; E2E1099 passed and one of1100 failed, exit1,2507.162
seconds within3600, no timeout. The unchanged run-record exclusive-create
reservation body received an early metadata-read error instead of its expected
RESOURCE_RESERVED finding when a non-record reservation filename was a dangling
link. The compatibility correction limits native discovery to the supported
record filenames in the shared metadata directory. Strict recovery still
physically inspects every JSON entry and retains all current refusal checks.
The unchanged failed body plus the four focused namespace bodies then passed
5/5 on dirty development source, exit0,21.578 seconds, no skips/flakes/timeouts
or sampled survivors. The failed full grade's4523 sampled process identities,
its outer wrapper/group and port15351 were independently checked ceased before
this further source edit. This is a required compatibility correction within
the assigned inventory outcome, not a test weakening or new follow-through.
The changed source and these accurate notes require their own final original
range reading; the earlier RED is not relabeled or erased.

Independent qualification remains UNRUN and not waived: no source mutant,
guard-removal experiment, assertion poison, test-only weakened module view,
corrected a19 witness, full property/data/assertion matrix, independent full
range verdict or acceptance is supplied by this ordinary repair. The a19
platform-ended review and all earlier rejected/RED/partial readings remain
history; normal positives are neither platform clearance nor independent
approval. The MF-09 selftest baseline remains distinct from normal model-free
evals. No arbitrary power-loss, whole-home adversary, OS/read isolation or
competing-writer qualification is claimed. Final ordinary static/docs/graph/
model-free checks and one original-base range grade follow this substantive
code/notes commit and are recorded externally at the actual tested ref. The
already-verifying card needs no post-grade status-only change. No production
recovery, authority edit, merge, push, CI or migration activation is assigned.


## Verdicts


### 2026-10-16 — REJECTED — gpt-6.1-sol@01a145f7-5a42-74e0-b729-25ea18734cc1

Judged candidate `19510990b518b3b42d51400833e125fcf198c4fd` against original base `f02c9cae12fc429566618747e626ea2091f1e1d1`, unchanged standard tier and all five frozen criteria. No acceptance is given. The public recovery route can publish authority after a newly recorded pause: checking before `atomicJson` does not revalidate at its later `renameSync` visibility boundary.

A real fixture-owned repository, unchanged public operation and `withNativeDurabilityObserver` place a real all-scope pause immediately before the selected rename. Both ordinary attributed and independently owner-authorized legacy routes produce the same exact results:

| Publication | Actual result | Authority effect after pause |
| --- | --- | --- |
| Initial intent | `ADMISSION_PAUSED_ALL` | Intent nevertheless becomes visible with `completed: []`. |
| Target record | `ADMISSION_PAUSED_ALL` | Named hold is cleared and one disposition is published; progress remains pending. |
| Completed progress | Success, recorded as `NO_REFUSAL` by the probe | Intent publishes `completed: [0]` while paused. |

The new body `recovery publications recheck a newly recorded pause at the actual rename boundary` asserts an otherwise successful unpaused control, the pause's actual absence and presence, each reached rename, refusal and unchanged authority. It ran RED on the candidate and GREEN on a transient corrected witness that rechecks complete current authority immediately before rename. Its five assertion sites were poisoned individually, 5-for-5 RED with no skips, then restored against the literal snapshot SHA256. The witness is evidence, not a delivered implementation; all transient production-source changes are restored. Exact configurations, arguments, source/body hashes, per-operator receipts and landings are retained in the `measurements-T-351-s1-a13` evidence bundle. The single actual callback-site mutant ran over the recovery spec: its 600-second overall bound interrupted body 31 after 30 completed bodies with no failure entries; the unchanged-source three-body continuation passed two and failed only the new pinning body. The initial partial run has no structured final grade, and its timeout is retained. Restoring the callback again produced one passing body, zero skips. This is the measured spec scope, not a whole-owning-set or full-candidate mutation claim.

| Frozen criterion | Evidence and disposition |
| --- | --- |
| 1 — attributable distinct durable refusals | Full source/test diff read, including requester attribution, actual write/fsync/rename/retirement sites and all code/data controls. Functional proof is partial; the complete property/data/assertion matrix remains unperformed. No criterion acceptance is claimed. |
| 2 — exact independently checked public recovery | Full request/physical inventory/cessation/jobs/origins/cumulative-scope/historical-collection reading and controls inventoried. The six new observations use exact candidate imports and fixture authority only. Remaining complete mutation qualification is unperformed. |
| 3 — exact transactional publication, replay and preservation | REJECTED: all three publication boundaries above change visible authority after the pause. The target case resolves its hold before the eventual refusal; progress can return successful completion. Pinning body RED/GREEN and its actual property-site mutation are separately preserved. |
| 4 — narrow legacy authorization with current policy checks | REJECTED: the independently authorized legacy fixture reproduces the same three publication failures. Authorization does not waive pause; all other legacy/sequence and history obligations remain unchanged and require qualification after repair. |
| 5 — real public controls and discriminating proof | Candidate inventory is 355 changed assertion sites at the judged candidate: 8 in the changed native contention body, 347 in the new recovery spec, including 2 helper sites. Independent AST completeness found no unmatched changed `expect` calls; body hashes and 44 literal array declaration/loop sites are retained. The candidate's complete poison/property matrix is not represented as run. The new correction alone has its complete five-site poison proof. |

**Correction 1 — Revalidate recovery authority at actual publication.** Make exact record/reservation/binding/fault/authorization/candidate/origin and current grant/pause/seat checks immediately before each visible intent, target, fresh-progress and replay-progress rename. The transient witness patch records one demonstrated implementation using a checked publication callback plus the required recovery call sites; its supporting signature and all call-site changes matter. Commit the regression body after this verdict. One correction, one body, one mutant block. The block below is pinned to that corrected witness: it removes only the actual publication callback, and must be transplanted honestly if a different repair mechanism is chosen. It is not a claim that the uncorrected candidate already contains its `old` anchor.

```mutant
correction: correction 1 — Revalidate recovery authority at actual publication
file: tools/e2e/scripts/native-codex.mjs
spec: tools/e2e/tests/native-transaction-recovery.spec.ts
body: recovery publications recheck a newly recorded pause at the actual rename boundary
message: intentUnchanged
--- old
    durabilityBoundary("before-rename", "atomic-json", file, { temp });
    beforePublish?.();
    renameSync(temp, file);
--- new
    durabilityBoundary("before-rename", "atomic-json", file, { temp });
    renameSync(temp, file);
```

Security/interface sweep: no added dependency, secret, model call or shell-evaluated public input; identifiers and evidence are pinned and the existing synchronous transaction remains. The publication-policy race is a blocking correctness/security finding. No claim is made for arbitrary power loss, authority-home adversaries, read isolation or competing writers. All changed product surface maps to the frozen four-path contract; no additional follow-through is approved.

Frame and integrity: fresh normally bound native phase two after sealed precommitments; tools remained available and reading limits were procedural. Full frozen role matched its original-base bytes. All sealed inputs, raw card and preparation/source digests validated privately; raw nested authority/card notes and executor conversations were not displayed or read as review rationale. Earlier selected-role phases and historical review exposures remain disclosed in their sealed records; this sitting does not relabel them blind. Requested model/effort `gpt-6.1-sol/xhigh`; observed model/effort and usage are unknown. Binding/probe scalars are retained in the safe metadata. The one metadata ask was answered and acknowledged.

Attack digests: original `651bcea6c27ba06297a9dabb6c03de510375827445de0e39dcf8459a745f2e18`; re-entry `e356a7a37610734fd06c8ebf9fb9532f388d60b5a47cae05450850541cb9d0b2`; full-role re-entry `d0b2a1da2262638219135ec34c02e77d32c53f62b05d955b80ec642970f208b8`. Ground `eabee89b71f737f17301ee65b5099c26d8a3f7d2882b8cb27204e3b34dba4f07`; owner sequence `34450b3458a03e5bd84f424bde907980e2bbb9a534b77ea75e6e0ac6ece949de`; sequence addendum `25f8f0a8da00d9394e96e4fb7e15f7af89d16efd34397a01606e13896d7025c0`.

The candidate original-range grade derived app/parser and 21 e2e specs. Its actual interrupted reading retains 469 parser passes, 1157 app passes and 14 missing-app-build setup failures, plus 661 completed e2e body lines out of 1088 planned at the judged candidate. The app build omission is the verifier's setup error, not a candidate defect. The grade was deliberately ended on exactly attributable jobs after the concrete blocker; both process groups ceased and the port closed. It is interrupted/ungraded, never GREEN. The app build subsequently succeeded. No complete original-range grade, whole-property matrix, full 355-site poison, qualification exception or acceptance is asserted. The repaired candidate will owe those proofs. Exact final own-write checks, the separately bounded property drill, its timeout/remaining-scope receipts and full job cessation belong to the genuine final report/manifest; none may be inferred from this verdict. No production recovery, merge, push or CI was performed.


### 2026-10-17 — REJECTED — gpt-6.1-sol@01a1464a-e710-7aa1-bfbe-0f97db09d7b2

Candidate: e3c27f53e66fe0f14d9ada1263719c576a89ce84. Original contract/range base: f02c9cae12fc429566618747e626ea2091f1e1d1; source a14 re-entry base: 44062efc08f6b4b3df5f145577fda83c168a8f10. Fresh native a15 detached verifier, canonical task `/root/native_s351_publication_verification_20261016`; normal exact binding preceded repository reads. Requested model/effort gpt-6.1-sol/xhigh; observed serving model, effort and usage unknown. Full frozen role, contract, all three saved attacks and ground preceded the complete original source/test diff; executor notes and conversations were not orientation. The original selected-role frames and later full-role frame remain disclosed. No OS/read isolation is claimed.

attack set: sha256:651bcea6c27ba06297a9dabb6c03de510375827445de0e39dcf8459a745f2e18 (verification-v1/attack-set-original-T-351-s1.md)

attack set: sha256:e356a7a37610734fd06c8ebf9fb9532f388d60b5a47cae05450850541cb9d0b2 (verification-v1/attack-set-reentry-T-351-s1.md)

attack set: sha256:d0b2a1da2262638219135ec34c02e77d32c53f62b05d955b80ec642970f208b8 (repair-reentry-phase1-v1/attack-set-repair-reentry-T-351-s1.md)

Ground: sha256:eabee89b71f737f17301ee65b5099c26d8a3f7d2882b8cb27204e3b34dba4f07. Owner-sequence addendum: sha256:25f8f0a8da00d9394e96e4fb7e15f7af89d16efd34397a01606e13896d7025c0. All eight sealed inputs, three additional raw/seal inputs and nineteen historical sealed members were privately verified; raw authority was not displayed. Preparation authority/digest, manifest digest, exact consumedBy and native binding matched this attempt.

**Blocking correction — completed-target authority before later publication.** In a valid two-target fixture, target zero and its progress are durably recorded. Immediately before target one's actual rename, the observer appends one newline to target zero's exact record bytes. Recovery still publishes target one and records `[0,1]` complete. The same change immediately before target one's fresh progress rename also records `[0,1]`. Expected: refuse and retain `[0]`, with no further target effect. Both otherwise identical unchanged controls succeed. `checkTargetPublication` rechecks only its current index; earlier completed targets' exact resulting record/reservation/binding/candidate/origins/jobs/policy are not coupled to that later publication.

Reproduce from tools/e2e with `SUPERTASKR_E2E_PORT=25351 node node_modules/@playwright/test/cli.js test tests/native-transaction-recovery.spec.ts --grep 'later target publication refuses changed completed-target authority before any further effect' --reporter=list,json` after applying the following committed regression. Candidate RED: one body failed, zero skipped; final run 2026-10-17T07:30:41.837341Z to 07:30:54.659414Z, 12.822 monotonic seconds within a ninety-second bound, no timeout, process group 70904 ceased. Normal corrected witness GREEN: one body passed, zero skipped; both changed cases refuse `NATIVE_RECOVERY_RECORD`, retain `[0]` and preserve the second record at that publication boundary.

The correction revalidates every earlier completed target's exact derived resulting bytes and independent `checkTarget` evidence inside the shared publication callback. The source witness and patch are retained in `publication-verification-2026-10-16-v1/measurements-T-351-s1-a15/corrected-witness-T-351-s1.mjs` and its `.patch`. Product code is restored to the candidate; only the verdict and regression body are committed. The following block anchors exactly once in that explicitly named corrected witness and removes precisely the missing guard. Correction count: one; block count: one. Selected-scope kill set: only the named new body; this is not a whole-owning-set containment claim.

```mutant
correction: completed-target authority before later publication
file: tools/e2e/scripts/native-transaction-recovery.mjs
spec: tools/e2e/tests/native-transaction-recovery.spec.ts
body: later target publication refuses changed completed-target authority before any further effect
message: changed completed target must refuse before publishing another target or its progress
--- old
      const currentFault = publicationFault();
      // Earlier completed targets remain part of the exact multi-target intent.
      // Revalidate their recorded results before publishing another effect.
      for (let priorIndex = 0; priorIndex < i; priorIndex++) {
        const priorTarget = request.targets[priorIndex];
        const priorContent = json(resultingRecord(intent, priorIndex));
        const priorChecked = checkTarget(root, request, { ...priorTarget,
          record: { content: priorContent, digest: digest(priorContent) } }, currentFault, true);
        if (!same(priorChecked, intent.checks[priorIndex])) refuse("WORKSPACE", "completed target authority changed before later publication");
      }
      const checked = checkTarget(root, request, target, currentFault, resolved);
--- new
      const checked = checkTarget(root, request, target, publicationFault(), resolved);
```

Class/sweep: read all four recovery atomic publication call sites (intent, target, fresh progress, replay progress). Intent already checks the complete initial target set; the other three share the current-index-only helper. The body measures earlier completed record-byte drift at the second target and second fresh-progress rename. Coupled earlier reservation/binding/candidate/origin/job changes, replay-progress drift and more than two targets remain unrun. No complete property/data-mutant containment matrix is claimed.

| Criterion | Independent evidence and outcome at the candidate |
| --- | --- |
| 1 — bounded attributable durable refusals | Complete source/test diff read; production bound remains 1500 ms. Full independent contention, raw durability and absorption qualification unrun after the blocker. Not approved. |
| 2 — exact request and independent checks | Real-repository public recovery controls successfully complete before the isolated byte intervention. Full malformed/lifecycle/scope/collection matrix unrun. Not approved. |
| 3 — revalidation, immutable intent and exact disposition/replay | REJECTED by the two actual later-publication interventions and paired viable controls above; candidate broadens completed progress after exact authority changes. |
| 4 — narrow independently recorded legacy policy | Regression uses separate fixture-owned pinned owner evidence and a complete two-target request. Production a6/a11 authorization/recovery not performed; complete legacy/ordered-sequence matrix unrun. Not approved. |
| 5 — discriminating public fixture bodies | One new public-entry body is RED on candidate and GREEN on corrected witness. Four assertion-site poisons each run one named failing body with zero skips/timeouts; exact body bytes/mode/mtime restored after each. Complete candidate qualification unrun. |

At e3c27f5, the independently derived cumulative-diff inventory contains 362 changed matcher-call sites (354 in the new recovery spec; eight in native-codex), using an AST query first proven on a planted assertion. Those candidate poisons, comprehensive property/DATA mutants, owning-set kill-set containment and the complete original-range grade remain unrun because a real blocker was found. The initial anchored grep matched zero bodies; that setup failure is retained and is not a RED reading. The final regression's four assertion sites were each poisoned on one expected side and seen RED on the corrected witness, with actual diffs and named failures retained.

Product restore SHA256: 90d1b3158574b12759ca72064b3234e4f9deb87c597ecf60d4f33769eb957ebc, equal to candidate and saved bytes, mode 0644 and original nanosecond mtime restored. Regression snapshot SHA256: 7091f75c423a628e047f3e5d6a22b0ab48f35a20d7150269ac55a62b86671a2e. Evidence lives in `publication-verification-2026-10-16-v1/measurements-T-351-s1-a15/`, including logs, JSON body counts, receipts, literal landings/restores and candidate inventory. Actual readings span two dates; no continuous overnight active test or cause of that wall-clock gap is inferred.

Security/interface reading found no separate demonstrated blocker before stopping: the new CLI uses fixed argument arrays, pins fault/owner evidence and rejects nonregular authority. This is bounded source inspection, not a completed security/malformed-input campaign. No real authority, historical collection, root hook, grant/pause/holder or reservation was edited. The first regression append used a cwd-resolved relative Path despite the packet's absolute-patch form; its actual diff was wholly inside the explicitly bound checkout, and subsequent product writes used absolute paths. No platform safety refusal occurred in this pass.

The full original-range grade is deliberately unrun on this known-invalid candidate under the packet's stop-on-counterexample instruction. Own verdict/body checks and final exact refs/job closure are reported separately after those commits; a generated capability-census pass is not claimed. No merge, push, CI or production disposition is assigned or performed.


### 2026-10-17 — REJECTED — gpt-6.1-sol@01a14917-54fc-7881-b837-5e7e12216ffc — T-351-s1-a17

Candidate `c0990686b5af792ee4ba1d8f806771ff0987bd28` is rejected: an ordered legacy recovery can publish its later target after its already completed predecessor's exact authority changes. `checkSequence` checks that predecessor, then calls `syncNativeFileNamespace` for its record and intent. The actual directory flush observer can change the predecessor after those checks. The final publication callback then validates only its currently selected step, so the target replacement becomes visible. Recovery notices the changed predecessor only before progress, after resolving the later hold and appending its disposition. This violates criteria 3 and 4; the refused return does not undo that unsupported authority change.

The independent owning body `ordered prior-step namespace flush cannot authorize a later target after predecessor authority changes` uses the real fixture-owned dependent lifecycle and the public recovery entry. Its unchanged control completes successfully. Its changed control appends one newline to the predecessor's exact record bytes at `directory-fsync`, armed only by the later target's `before-rename`. At the candidate it returns `NATIVE_RECOVERY_RECORD` but the later record changed, contains one disposition, and its intent remains `completed: []`; expected is refusal before that later record changes, zero dispositions and pending progress. Run from tools/e2e with bench port25351: `node_modules/.bin/playwright test tests/native-transaction-recovery.spec.ts -g 'ordered prior-step namespace flush cannot authorize' --reporter=json`. RED: one named assertion failure, zero skips and no harness errors. A separately retained corrected witness settles prior-step namespace observation before fresh final fault/authorization/sequence snapshots and makes the final sequence check observation-free. The same body is GREEN there, one passed and zero skips. The witness is a proof input, not an accepted source repair.

| Criterion | Current independent evidence and disposition |
| --- | --- |
| 1 — durable bounded attribution and unknown preservation | Entire original native engine diff and corresponding bodies read. The current assertion inventory includes all eight new native-codex matcher sites. No fresh full contention/absorption/durability mutation campaign was run after the decisive rejection; not qualified by this verdict. |
| 2 — complete exact request and independent eligibility | Entire request/physical-entry/cessation/jobs/origins/scope/collection implementation and all new bodies read. The genuine ordered positive control passed through the public CLI. Complete malformed, scope and data matrix remains unrun independently here; not qualified. |
| 3 — exact transaction, intent, publication, replay | REJECTED by the reproduced predecessor namespace publication gap. Actual later target mutation occurs after changed coupled authority and before the eventual refusal. New body RED at the candidate and GREEN at the named witness. |
| 4 — narrow independent owner sequence | Genuine complete ordered-policy positive passes. The same prior-step counterexample violates current predecessor revalidation in the authorized sequence. No real a6/a11 recovery was invoked. |
| 5 — discriminating executable bodies and retained controls | Existing ordered positive: one passed. New regression: one failed at candidate, one passed at witness; four new assertion sites poisoned separately, four intended failures, zero skips/errors. Full original assertion/property/data/interruption qualification and whole-owning kill-set containment remain unrun after the blocking defect, under the packet's explicit counterexample stop rule. |

Original cumulative range is `f02c9cae12fc429566618747e626ea2091f1e1d1..c0990686b5af792ee4ba1d8f806771ff0987bd28`; the smaller writer re-entry range starts at `2861c25bd6c167c58ccb32ae8522f51a3386fb3b` and was read separately. The original owed derivation exits0 and names parser/app plus 21 E2E specs; re-entry names parser/app plus 13. Neither a smaller diagnostic nor the executor's grade is claimed as independent range acceptance. The original full range grade and the remainder of the large drill matrix are explicitly unrun after this concrete rejection. At the candidate, independent TypeScript AST enumeration derives 362 new recovery matcher sites plus eight new native-codex sites, 370 total, across the original cumulative diff; it does not copy the earlier historical362 figure. The detailed property/control and assertion inventory is retained with this attempt.

All four added-body assertion poisons failed at the named body against the corrected witness, with actual per-operator landings, nonzero execution, zero skips/errors and literal SHA256/mode/nanosecond-clock restoration. The selected defect kill set is this new body; complete whole-owning kill-set containment is unrun and is not inferred from the selected run. Source restoration is SHA256 `13b2a733254b4928324c69d434c51efff5b5f7667732c96e2bfac5c233f7e37b`, exact candidate Git bytes, mode and both clocks, with source diff0. The corrected witness source SHA256 is `0727213166a68ca1d18b405b4f40a6d1759766ae3f383a8e9d5c4b89c44b1df0`; its exact patch is retained. Every test process/group receipt reports zero survivors. Parser and app were built in the required order; E2E types passed with the witness/new body.

One correction, one body and one mutant block. The body is committed immediately after this verdict commit, as role5b requires. The block below anchors exactly once in the explicitly named corrected witness, candidate plus `corrected-witness-T-351-s1.patch`. It restores the defective final publication callback while retaining the witness's optional sequence argument; the same RED/GREEN results distinguish that missing final closure. The block does not purport to anchor a repair already present at the rejected candidate.

```mutant
correction: close prior-step namespace observations before final publication authority
file: tools/e2e/scripts/native-transaction-recovery.mjs
spec: tools/e2e/tests/native-transaction-recovery.spec.ts
body: ordered prior-step namespace flush cannot authorize a later target after predecessor authority changes
message: changed predecessor must refuse before a later target disposition becomes visible
--- old
    const publicationFault = () => {
      // Complete prior-step namespace observation before final authority snapshots.
      const namespaceFault = loadFault(root, request);
      checkSequence(root, request, namespaceFault, authorization(root, request, namespaceFault));
      noPendingFaults();
      const currentFault = loadFault(root, request);
      const currentAuth = authorization(root, request, currentFault);
      if (!same(currentFault, intent.fault) || !same(currentAuth, intent.authorization)) refuse("INTENT", "fault or authorization changed before publication");
      checkSequence(root, request, currentFault, currentAuth, false);
      return currentFault;
    };
--- new
    const publicationFault = () => {
      noPendingFaults();
      const currentFault = loadFault(root, request);
      const currentAuth = authorization(root, request, currentFault);
      if (!same(currentFault, intent.fault) || !same(currentAuth, intent.authorization)) refuse("INTENT", "fault or authorization changed before publication");
      checkSequence(root, request, currentFault, currentAuth);
      return currentFault;
    };
```

The retained original attack SHA256 is `651bcea6c27ba06297a9dabb6c03de510375827445de0e39dcf8459a745f2e18`; earlier re-entry is `e356a7a37610734fd06c8ebf9fb9532f388d60b5a47cae05450850541cb9d0b2`; full-role repair re-entry is `d0b2a1da2262638219135ec34c02e77d32c53f62b05d955b80ec642970f208b8`; ground is `eabee89b71f737f17301ee65b5099c26d8a3f7d2882b8cb27204e3b34dba4f07`; owner-sequence addendum is `25f8f0a8da00d9394e96e4fb7e15f7af89d16efd34397a01606e13896d7025c0`. All sealed byte counts/digests and historical seals were privately checked. Preparation digest `51c86aa6aaf2cc8ab9360f47e04887840d97491ae16aefe8b734d3c45848aed7`, manifest digest `f550dcf42fe4dfaea84e2ba07c4632e32ad7c7bdc353f76f3a2739fc7217bbf9`, source frozen re-entry card, actual source authority and consumedBy all match. Original versus candidate verifier card historical differences were privately checked at their own refs; criteria/touches are byte-identical. Raw cards/authority and executor conversations were not displayed.

Actual frame: fresh regular native detached verifier phase two, after actual a16 completion/collection, receiving three retained precommitments with their original selected/full-role limitations. Tools remained exposed and the reading boundary was procedural. The packet disclosed the completed-target repair and historical count before implementation; no stronger unexposed frame is claimed. Requested model/effort is GPT-6.1 Sol/xhigh; observed serving identity/effort/usage is unknown. First bound repository read was refused by Supertaskr `writer-resource-not-explicit`; no work/job ran, the genuine turn ended failed, normal continuation/exact rebind cleared the hold, and `RUN-ACK question-id` acknowledged the answer. That original refusal and any unknown callbacks remain preserved. No actual OpenAI safety refusal occurred. No additional pack gap was observed; the cited pack has no component slug entry, and architecture interfaces plus verification/command/gate/port rules were opened on demand. Security review covered request path/identity shape, physical authority types/UTF-8, separately loaded owner evidence, fixed argv and dependency/secret surface; the demonstrated publication authorization defect is blocking.

Evidence lives in `completed-target-verification-2026-10-17-v1/measurements-T-351-s1-a17/`, including exact command logs/receipts, snapshots, landings, inventories, restoration and the independent report. Generated capability currency is known stale and remains for integration. Own final-ref gate outcomes and complete job closure are recorded in the independent report; no acceptance, publication, CI, real recovery or migration activation is implied.
