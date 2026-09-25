# Checkpoint: T-315-s1 native repair (2026-09-25, Codex architect)

## Merge

At 214c45068b858fb71e00894f3a353dc3e182d1fe, the CI portability repair is integrated and published. Its first parent is 989b776b5f4b6eaf8c35620659be263ded982d96 and approved bench parent is 14126cec4e01737e4c87b0b625650ec96ac78ff4. The staged tree was compared in full with the approved bench before commit and matched exactly. The merge arm staged successfully, then refused its lifecycle stamp because the card was already done. The coordinator preserved that status and completed the existing keeper, regeneration, count and message steps manually; no invented building transition was used.

The original candidate 3f3b76679b90590022b6b831a7fb22f0528a8dfd fixed the Linux-only shell assumption. Independent verification rejected its missing-executable cleanup behavior; correction 626656b67a753ebbb8fc58fd543796c49146b607 added completion-aware first-output handling. A fresh verifier approved the corrected tree and demonstrated an inverse mutant failing, restored by exact hash. These are repair checks, not a claim that the whole native delivery contract is complete.

## Gates

Publication range 989b776b5f4b6eaf8c35620659be263ded982d96..214c45068b858fb71e00894f3a353dc3e182d1fe passed its local owed set. CI run 36121446107 completed success on that exact head; the formerly failing yielded-operation body passed on Linux. The applicable CI native leg was skipped by selection, not inferred green.

Checkpoint boot check passed on scratch port 25316 and its process tree was stopped. Full checkpoint suites, graph, docs and health results are appended below after capture. Evidence lives in the native-first execution packet's ci-portability-repair directory; no verifier-only material is copied here.

## Suites

Publication gate at the merge: parser 454, app 1171, e2e 787 passed; Rust was not owed by that range. The checkpoint separately owes all four suites. Final captured checkpoint results follow below.

## Board

At 214c45068b858fb71e00894f3a353dc3e182d1fe, `brief.mjs --state` reports 867 flat cards: 321 done, 159 parked, 164 planned, 222 suggested and 1 building. This checkpoint changes no card status or grant. T-312 remains parked and preserved under the owner's native-first direction. T-315-s2 is not yet demonstrated.

## Environment

On 2026-09-25 the product hook configuration, trusted by the owner after restart, received real callbacks from the native executor and independent verifiers. Attempts T-315-s1-a10, a11 and a12 ended and were collected, preserving failed history. The prepared executor worktree is not a running worker. Its attempt to prepare a new lane directly from the merge commit was refused; it must advance to this checkpoint before admission. The detached verifier bench remains preserved. No additional hook trust change is requested.

## What the brief got wrong

Concurrent read-only tool calls in a10 exposed lost callback updates: atomic file replacement did not serialize read/modify/write. Until the required repair is verified, native worker tools and their actual processes are strictly serial, and the coordinator does not mutate the same run record during an operation. Missing callbacks are preserved as unknown, not synthesized.

The verifier's resource-prefix instruction overrode package working-directory intent and produced a root test-results file. Monitoring correctly held it. The file and failed attempt were preserved before removing only that generated artifact and continuing with an explicit package cd. One tool-layer-refused cleanup command had a Pre without Post; independent job/workspace reconciliation preserved that fact rather than manufacturing a completion receipt.

Detached bench admission currently used an explicit coordinator-prepared manifest derived through the existing parser and checked against the exact approved fence. This is a disclosed bridge, not shipped general bench support. Read-only native participant routing remains a source-inspection question for T-315-s2; it is not claimed as a measured failure. Phase-one blindness remains procedural under the owner's accepted model.

## Metrics (ADR-020)

- Rework cycles: this repair window had one rejected candidate and one fresh corrected approval, evidenced by the card verdicts at 214c45068b858fb71e00894f3a353dc3e182d1fe; this is not a lifetime total for the card.
- Tokens: not derivable here per seat and summed; complete native session usage meters were not available to the integrating seat at this checkpoint on 2026-09-25.
- Gate runtime: not derivable here as a complete per-gate total; the checkpoint did not capture a common wall timer over every keeper and regeneration. Suite runner durations are preserved separately and are not presented as that total.
- Cold start: not a fresh model/session switch; continuation after an owner restart on 2026-09-25. First-try cold-start success is not measured. STATE was stale about the queue and checkpoint; this replacement records current mechanisms and the native limitations.
- Drift incidents: 0 identified contradictions with NORTH_STAR or ARCHITECTURE in this repair window; the callback race and cwd refusal are implementation/procedure defects recorded above, not a claim of an exhaustive architecture audit.

## Dispositions

Continue the authorized T-315-s1 callback-transaction repair, then T-315-s2's complete native delivery. Preserve native desktop workers, fresh independent verification and the existing grant scope. Keep cross-harness demonstrations deferred and T-312 evidence intact. No parallel-worker qualification, OS isolation guarantee or invented tool-removal guarantee is claimed.

## Captured checkpoint results — 2026-09-25

The full gate at 214c45068b858fb71e00894f3a353dc3e182d1fe exited 1: parser 454 passed, app 1171 passed, Rust 662 passed, e2e 1270 passed and 1 failed (12.4 minutes). The failure was `THE VERIFIER'S BRIEF ASSEMBLES` in brief.spec.ts: the live T-315-s1 worktree prepared prematurely for the next repair conflicted with the test's T-205-s5 fence. This was an environment-dependent assertion, not an ignored failure. The clean, unstarted worktree's fence and lock were preserved, its branch retained, and the worktree removed. At unchanged product HEAD, the exact failing body then passed (1 body, exit 0, 1.7 seconds). The first full run remains RED in the record; the targeted control is not relabelled as a full green run. The checkpoint's closing range must pass before publication.

Graph check exited 0 and reported:

```text
[supertaskr-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index (1230259 bytes, 203 files, 2631 symbols, 2505 edges)
[supertaskr-index]   budget:      1230259 of 2145959 bytes (57.3%) - 915700 left
[supertaskr-index]   floor:       241204 of 2145959 bytes (11.2%) - 1188 bytes/file truncation can never reclaim, so at this tree's density the budget stops degrading gracefully at about 1806 files
```

The same graph check is asked again after this record and STATE are written; its final result is preserved with this checkpoint's evidence.

`npm run health -- --readings <captured checkpoint output>` from tools/e2e/ exited 3, its designed incomplete-report outcome, with this exact census:

```text
health-bands: 28 band(s) — 14 inside, 1 drifting, 6 BREACHED, 3 unread, 4 UNKEPT
```

Cycle band: `loop/cycle-budget-used` UNREAD: the reporter did not read a priceable checkpoint-window reading. Token band: `loop/token-budget-used` UNREAD for the same invocation. Neither is claimed inside its budget. Captured readings include this run's actual Rust and e2e output plus the integration graph output. No historical log was substituted for a missing reading.
