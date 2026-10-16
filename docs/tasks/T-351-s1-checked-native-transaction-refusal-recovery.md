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
