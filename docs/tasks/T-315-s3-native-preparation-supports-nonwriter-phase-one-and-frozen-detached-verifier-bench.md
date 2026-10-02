---
id: T-315-s3
title: "Native preparation supports a nonwriter phase one and a frozen detached verifier bench"
feature: F-04
milestone: 4
size: M
priority: 1
status: planned
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

## Verdicts
<!-- Fresh independent verifier appends. -->
