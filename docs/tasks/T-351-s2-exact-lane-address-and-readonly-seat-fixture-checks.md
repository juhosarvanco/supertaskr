---
id: T-351-s2
title: Keep lane-address and seat-fixture checks exact at readonly convention inputs
feature: F-04
milestone: 4
priority: 1
size: S
tier: standard
status: building
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: []
touches: [tools/e2e/tests/dispatch-order.spec.ts, tools/e2e/tests/push-guard.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
built_by:
verified_by:
review: independent
---

Repair the test helpers that falsely fail the native-recovery range when one live lane address is a prefix of another and the conventions source is read-only. Retain the actual product output, source permissions and existing acceptance assertions. This is one fixture/oracle qualification cycle over the two owning specs, not a production guard change.

## Finding

Read at 16c9b0a6d3ecdcc8c1ea1fed3fc29621e6b77376. The linesWith helper in tools/e2e/tests/dispatch-order.spec.ts counts substring matches; the T-351 worktree address is a literal prefix of the T-351-s1 worktree address, so the real-board once-per-lane body counts two rows for the parent. The seatFixture helper in tools/e2e/tests/push-guard.spec.ts copies the conventions index in both its flat documents pass and its canonical conventions-files pass. With the live source read-only, that second copy refuses before the seat command runs. The failed source range is retained in the T-351-s1 handoff; it is not graded green by this card. A narrowly qualified single-copy remedy is already preserved in T-351 candidate a9a651257ab01906481eec5548a7c7c172318d9e, but it has not landed.

## Acceptance criteria

- WHEN tools/e2e/tests/dispatch-order.spec.ts evaluates the once-per-lane address requirement THE oracle SHALL count the requested literal complete address, distinguish parent and sibling addresses sharing a prefix, preserve all existing once-or-absent assertions, and correctly detect an actual repeated address. Controlled cases SHALL include prefix-related worktree and branch addresses and literal punctuation that could be mistaken for a regular expression. The dispatch formatter and provenance output SHALL remain unchanged.
- WHEN tools/e2e/tests/push-guard.spec.ts builds its fixture from read-only conventions THE fixture SHALL copy the canonical index and chapter set once per destination while retaining every other required document. The existing whole seat-verbs bodies SHALL reach their real CLI and retain their guard-installed and UNGUARDED assertions. Source conventions and fixture destination modes SHALL not be relaxed or overwritten to make the copy succeed.
- WHEN independently qualified THE bodies in both owning specs SHALL include positive and negative controls that expose the original helpers and pass the repaired helpers through real rendering or fixture-owned repositories and public seat commands. Record the actual complete-body failures, passing controls, exact source identity and literal source/data property-site discrimination with restoration; setup success or changed expectations alone SHALL not substitute for the required properties. No production dispatch, guard, authority, callback or permission code SHALL change.

## Implementation notes

Associated repair under the owner's remaining migration grant. Drafted outside the repository for independent pre-dispatch review. Its own native executor and fresh detached verifier require normal admission. The frozen T-351-s1 fence stays unchanged. Preserve the held T-351 source and original failed ranges; no legacy fault or foreign reservation may be cleared to start this repair. Generated documents and final merged-tree qualification are integration work. Requested implementation and review are GPT-6.1 Sol extra-high.

The independent packet review accepted filing conditional on actual preserved-source continuity and normal native admission. Qualify the original failures through complete real address-rendering and seat-verbs bodies in fixture-owned repositories, not synthetic helper loops alone. A fresh verifier assigning corrections must commit its property bodies on its own bench after the verdict and provide one literal mutant block per correction under the standing role, with named-body discrimination, exact restoration and normal integration drills. Existing committed body references alone do not satisfy that rule.

## Verdicts
