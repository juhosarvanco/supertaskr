---
id: T-315
title: "Record the completed native Codex-only delivery after its implementation and workflow cards land"
feature: F-04
milestone: 4
size: M
priority: 1
status: parked
wake: T-315-s2
blocked_by: [T-303-s1, T-311, T-314, T-315-s1, T-315-s2]
touches: []
---

## Acceptance criteria

- WHEN T-315-s1 and T-315-s2 have landed THE coordinator SHALL record their canonical reservations, native participant identities, frozen bases and candidates, fresh independent verifier evidence, and required checks. The CLI adapter's evidence SHALL NOT qualify native execution.
- WHEN the native delivery is published THE acceptance record SHALL name T-315-s2's actual integrated and pushed commit and the CI conclusion for that exact commit, the method release, reported model and usage or unknown, and the required regeneration evidence. A pre-merge verdict SHALL NOT claim a future push or CI result.
- WHEN the sitting closes THE coordinator SHALL record reconciled native attempts and owned jobs, seat release and the durable handoff, distinguishing every demonstrated capability from its limitation. Missing evidence SHALL leave this parent incomplete. This record's own later commit SHALL NOT be substituted for the delivery commit whose CI it cites.

## Implementation notes

Native-first reconciliation of 2026-09-24, under the owner's authorization to finalize contracts and deliver the native route. T-315-s1 implements lifecycle integration and automatic scope checks. T-315-s2 delivers the native role and workflow instructions through that mechanism, including the method release. This parent is an acceptance-only record, not another implementation lane. Its wake triggers evidence review, never automatic dispatch.

The previous contract is preserved at cfc18176bb4a4bda27f1d389ffd9cc117a6d5f4e and in the native-first evidence packet. Its seat, lifecycle, verification, complete delivery, method and handoff obligations move to the named children and these criteria; no completed delivery is asserted here. T-312 remains parked with its candidates and verdicts intact. Cross-harness acceptance in T-316 remains deferred.

## Verdicts
<!-- Acceptance evidence is appended only after the actual delivery. -->
