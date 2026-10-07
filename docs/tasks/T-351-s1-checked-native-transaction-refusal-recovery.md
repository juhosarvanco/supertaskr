---
id: T-351-s1
title: Recover exact native transaction refusals through checked per-hold dispositions
feature: F-04
milestone: 4
priority: 1
size: M
tier: standard
status: building
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

## Verdicts

