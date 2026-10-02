---
id: T-315-s3
title: "Native preparation supports a nonwriter phase one and a frozen detached verifier bench"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: building
blocked_by: [T-315-s1]
touches: [tools/e2e/scripts/native-codex.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/lane-fence.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/native-codex.spec.ts, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/lane-fence.spec.ts, tools/e2e/tests/brief.spec.ts, docs/CAPABILITIES.md, docs/INDEX.md]
builder: gpt-6.1-sol@fresh
verifier: gpt-6.1-sol@fresh
built_by:
verified_by:
review: independent
---

The native bridge currently admits only repository writers and cannot prepare a detached verifier bench through its fence command. This card repairs those two measured preparation gaps so approved T-315-s2 can use the full native delivery method.

## Acceptance criteria

- **Nonwriter packet admission.** WHEN the coordinator starts a native supplied-packet-only phase-one participant through the shared run arm, the arm SHALL record it as a nonwriter with resource none and no writer reservation. It SHALL retain the frozen brief digest, requested model/effort, native launch intent, lifecycle, questions and owned jobs. Registration SHALL use the existing exact identity probe and explicit coordinator binding against the matching callback identity; missing, malformed, duplicate or ambiguous identity SHALL refuse by name. The identity probe is a registration step, after which the participant SHALL work only from the supplied packet and return its attack set or evidence requests through native output. Incidental cwd and task labels SHALL confer no writer authority.
- **Nonwriter lifecycle and boundary.** Native observe, answer delivery, stop, collection and re-entry SHALL handle the nonwriter profile without a repository scan, reported commit or writer reservation. Questions and acknowledgements SHALL remain durable through the shared record, using coordinator-persisted native output where the participant cannot write an ask file. Stop and interrupt callbacks alone SHALL establish neither completion nor job cessation; uncertain execution, live jobs, unmatched callbacks and unresolved attribution holds SHALL prevent eligible collection or replacement. After registration, delivered Bash and apply_patch events SHALL refuse for the nonwriter profile. The record and launch output SHALL disclose the actual registered callback/tool coverage and its procedural packet restriction, without claiming filesystem/read isolation or arbitrary-tool enforcement.
- **Frozen detached verifier authority.** WHEN the coordinator prepares a native phase-two writer, a supported arm command SHALL derive its authority from the frozen executor admission and card, binding the executor attempt, original base, exact candidate commit, card digest, admitted expanded scope and canonical bench resource. Before authority is issued, the executor candidate and owned-job cessation SHALL have passed independent collection checks. The bench SHALL be detached at that candidate and clean under the declared ignored-output policy. Preparation and admission SHALL refuse unreadable or mismatched source authority, wrong task/resource/ref, changed candidate before admission, dirty state, or scope that differs from the frozen admitted authority. Ordinary task-branch fence construction SHALL retain its existing branch and collision rules; a detached bench SHALL not be represented as a task branch.
- **Consumed preparation and visible launch.** Native writer admission and final collection SHALL consume and validate the prepared authority, including refusal of worker-edited authority. Collection SHALL retain the fixed candidate binding, require a reported descendant tip and independently check the required range and workspace state. Launch output SHALL identify the profile, task, resource or none, candidate where applicable, requested model/effort and covered callback/tool types. Writer launch output SHALL print the explicit resource prefix and package working-directory forms; nonwriter launch output SHALL print the registration exception and subsequent packet-only restriction. No project hook definition or trust database change is authorized.
- **Focused prerequisite qualification.** The guarded implementation cycle SHALL include discriminating source controls for both profiles, their lifecycle and the preserved writer checks, with separate-process controls where transaction or attribution behavior depends on process separation. On the frozen candidate source actually loaded by the existing project hook, real desktop controls SHALL demonstrate nonwriter registration and collection without a writer reservation, and supported detached-writer admission, callbacks and independent final collection. Each refusal control SHALL have a valid positive control. The bootstrap SHALL disclose its existing writer-resource route. Acceptance SHALL identify the exact source exercised; subsequent source changes SHALL rerun affected controls. Ordinary required gates, accepted verification, push and named CI SHALL precede closure. This qualification SHALL not claim T-315-s2’s complete delivery.

## Implementation notes

This card repairs measured prerequisites of approved T-315-s2. Before dispatch, its final reviewed bytes are filed and bound through derived admission from T-315-s2 using frozen failure evidence, not a widened grant. The admission retains existing authorization and ordinary guarded verification. No general consultation feature, arbitrary-tool policing, parallel writers or separate qualification framework is included.

At product f63b58d5, shared native run start with resource none refuses NATIVE_WRITER_REQUIRED; existing fence construction refuses a detached accepted bench. Frozen reproduction and source hashes are retained in the execution evidence packet. The independent pre-dispatch reviewer confirmed both premises and reviewed the admission-to-collection contract at the matching accepted source tree. Nonwriter lifecycle and collection are in scope; merely removing the admission rejection is insufficient.

Size M is the bounded native preparation cycle over one fence, with nonwriter and detached writer as its two profiles. Complete method delivery stays in T-315-s2 and starts only after this prerequisite is available. Requested workers and controls are GPT-6.1 Sol extra-high under the owner's current instruction; observed identity stays unknown when unavailable. No hook definition or trust edit is authorized. Real controls use the exact candidate source actually loaded by the existing project hook and follow source review; the existing writer-resource bootstrap is disclosed, never passed off as the nonwriter profile.

### Executor criteria echo

- [x] Admit supplied-packet phase one with resource none, frozen launch facts and exact callback/probe binding, without a writer reservation.
- [x] Carry the nonwriter through durable questions, answers, observe, stop, collection and re-entry; refuse delivered shell/patch use after registration and retain uncertain/live/attribution holds.
- [x] Prepare a clean detached bench at the independently collected executor candidate using the frozen executor attempt, original base/card/scope and canonical resource.
- [x] Consume and revalidate preparation at writer admission and collection, retaining candidate binding and independent descendant/range/workspace checks; print each profile's actual boundary.
- [ ] Prove both profiles and preserved writer checks with discriminating source and separate-process controls; leave reviewed staging, actual desktop qualification, push and named CI to the coordinator before closure.

### Executor implementation

Initial source implementation and the first self-drills are frozen at `86ea689cad5cb7c7f2dec8aa86110af9662af4a5`. Native resource-none admission carries a supplied-packet-only permission, no ask path and no writer reservation. Questions, answer delivery and acknowledgements remain in the shared record through native output; re-entry records a required native re-delivery without claiming a delivery receipt. The exact completed identity probe is still required, including refusal of duplicate or malformed output. Registered shell and patch callbacks refuse after packet registration. Stop callbacks establish no cessation, and the independent final gate retains uncertain execution, live jobs and attribution holds.

The existing collection arm supports `--run collect --attempt <executor> --assignment <incoming detached-verifier assignment>`. The validated assignment supplies the bench resource and candidate; an optional reported `--ref` must match. Work, role, profile, executor source, resource/cwd and ignored-output policy mismatches refuse before collection or preparation writes. It independently checks the executor candidate and owned jobs, freezes the original admission, original-base card digest and expanded manifest scope, verifies the clean detached bench, and persists its authority and full manifest digest in the executor record. Detached-verifier admission consumes that coordinator preparation. Callback and final checks re-read it, preserve the candidate, require an exact reported descendant tip, and separately inspect original-base-to-candidate plus candidate-to-verifier changes and workspace layers. Candidate card edits never re-expand admitted scope. Published writer admissions recover their original manifest bytes only under their previously frozen digest and read their card from the original base.

Launch output identifies profile, task, resource or none, candidate, requested model/effort and the exact registered callback/tool coverage. It supplies the writer resource prefix and package-directory form or the packet registration exception and subsequent restriction. The existing writer-resource bootstrap is disclosed. Coverage remains the registered callbacks and Bash/apply_patch; packet restriction is procedural, with no arbitrary-tool or filesystem/read isolation claim.

### Self-drill block

At the named source commit above, the baseline selected 10 controls: the 8 new bodies and 2 preserved writer identity/final-collection controls. All 10 passed before mutation. Each mutant below ran that same set; every intended body reded and both preserved writer controls stayed green. All observed failures remained among the new profile controls. Every source restoration matched both the committed SHA256 and the per-path commit diff. The source-mutated disposable fixture was removed after its commands completed and its test port ceased listening; its known dependency links were fixture outputs, not source changes. Detailed mutations, kill sets and proof logs are retained as `self-drill-results-T-315-s3.json` and the per-mutant logs in the lane scratch.

| Mutant / property | Observed reading at the named source commit | Restored source SHA256 |
|---|---|---|
| 1 — packet-permission | exit 1; 2 red, 8 green | `84cd975e12363bffb518ef8ef864e637901733e9695b55aa0477b7afc843993a` |
| 2 — packet-denial | exit 1; 1 red, 9 green | `4fd002ffe0f9dd4adb038d7857b15da3466cac7ec83b814bc4af33ab407098a4` |
| 3 — owned-port | exit 1; 2 red, 8 green | `84cd975e12363bffb518ef8ef864e637901733e9695b55aa0477b7afc843993a` |
| 4 — frozen-scope | exit 1; 4 red, 6 green | `4fd002ffe0f9dd4adb038d7857b15da3466cac7ec83b814bc4af33ab407098a4` |
| 5 — consumed-authority | exit 1; 1 red, 9 green | `4fd002ffe0f9dd4adb038d7857b15da3466cac7ec83b814bc4af33ab407098a4` |
| 6 — original-final-range | exit 1; 2 red, 8 green | `4fd002ffe0f9dd4adb038d7857b15da3466cac7ec83b814bc4af33ab407098a4` |
| 7 — launch-exception | exit 1; 1 red, 9 green | `1485698d5a971d99605b38f4cf97bdaff516eed8c24e9f3d208a06b3e4c158dd` |
| 8 — published-fence-digest | exit 1; 1 red, 9 green | `4fd002ffe0f9dd4adb038d7857b15da3466cac7ec83b814bc4af33ab407098a4` |

The inverse controls explicitly distinguish malformed identity from exact registration, live jobs from established cessation, changed preparation from its valid original, and the original candidate range from a clean candidate-to-verifier range. Callback registration, denial and detached completion controls cross separate processes. Existing writer reservation, resource-prefix, callback transaction, ignored-output and exact-final-ref checks remain in the native suite.

### Qualification and corrections

The focused source controls and self-drills qualify the implementation mechanism. Independently reviewed staging, actual desktop controls on the candidate source loaded by the existing hook, accepted bench verification, publication and named CI remain the coordinator's pending work. This delivery does not qualify T-315-s2's complete method delivery or cross-harness work. Requested executor model/effort is GPT-6.1 Sol extra-high; observed model and usage remain unknown.

The public capabilities wrapper regenerated the fenced census/index, then refused its out-of-fence interview-skill write with EACCES. The coordinator clarified the existing standalone census generator and read-only skill check in the durable ask file; those completed without a skill change or fence expansion. The declared scratch drill fixture was explicitly authorized and its answer acknowledged. There is no unresolved lane ask. Graded lane readings follow this notes commit and are retained in the execution report, rather than being claimed here before they run.

The first graded reading at `4662b3de7da00c1c0503172f5014cbf5627809ac` passed parser (454 bodies) and app (1,171 bodies). End-to-end executed 1,283 bodies: 1,278 passed and 5 failed. One failure exposed an unannounced new modifier in the CLI flag inventory. The coordinator directed the existing assignment dial above, retaining the frozen authority and original inventory assertions; its public positive/refusal controls and the original inventory body passed together (2 bodies). The live T-315-s3 worktree also collided with the T-205-s5 verifier-brief fixture on dispatch-brief.mjs, and three unchanged seat fixtures failed their duplicate copy of readonly CONVENTIONS.md. A disposable copy control reproduced first-copy success, second-copy EACCES, and successful second copy after making only its own destination writable; protected source mode remained 0444. Those four environmental failures remain RED and require integration checks after lane teardown or accepted merge. No grant, hook, trust, source-permission or unfenced test change was made. The durable interface answer is acknowledged; no lane ask remains unresolved. Affected source controls are re-drilled against the corrected implementation commit, with results retained in this lane's scratch before its final graded reading.

## Verdicts
<!-- Fresh independent verifier appends. -->
