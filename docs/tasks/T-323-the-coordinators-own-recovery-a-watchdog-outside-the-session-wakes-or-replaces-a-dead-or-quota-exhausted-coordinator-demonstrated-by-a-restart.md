---
id: T-323
title: "The coordinator's own recovery: a watchdog outside the coordinator's session notices a dead or quota-exhausted coordinator from a stale heartbeat, reconciles the run records, and starts a replacement through the harness's own command with a brief derived from the records — demonstrated by killing a coordinator fixture on this machine and watching the replacement take the seat and resume"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-14, from the Codex orchestrator's review of T-319 and T-322 relayed by the owner: a surviving ledger does not guarantee a surviving worker; filing authorizes no development"
blocked_by: []
touches: [tools/e2e/scripts/watchdog.mjs, tools/e2e/tests/watchdog.spec.ts, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/commands.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The coordinator of this loop is a harness session on the owner's machine. It dies with the laptop's sleep, with a harness crash, or with its own quota; on 2026-09-13 the owner ruled that the work must not stop for their absence, and T-322 gives the coordinator the rules to keep going — but a coordinator that is gone cannot execute its own waiting instructions. What survives it today: the run record (T-311) for every child run, the seat claim (T-238, the holder file the seat verbs write), the checkpoints and the cards on main, and the seat's ledger — which is a text file in the session's own scratch directory, a path that carries the session id, so a replacement session does not even find it. ADR-025 says either harness's seat can resume from the session contract; nothing performs the resumption. The harness has a print-mode command an outside process can run, and the host has a scheduler; the arm has a state verb and, with T-322, a return brief, which is the brief a replacement needs. The missing capability is a process OUTSIDE the coordinator's session that notices the coordinator is gone and starts the next one — and the proof is a restart that happened, not a rule that says one would.

## Acceptance criteria

- WHEN the coordinator stamps its ledger THE coordinator SHALL also write a heartbeat under the runtime directory naming its session identity (the holder's), the instant, the lane and phase it is in, and, after a quota refusal, the reset instant it is waiting for; pinned by a body over the seat verbs.
- WHEN the heartbeat is older than the interval the conventions state THE watchdog — a process outside the coordinator's session, started by the host's scheduler entry the conventions spell — SHALL reconcile the run records (every live child run's ownership and state), release the dead holder's seat claim only when no live holder answers, and start a replacement coordinator through the harness's own command with a brief derived from the records (the return brief where T-322 has landed, else the newest checkpoint and the board's state), pinned by a body that plants a stale heartbeat and a fixture run record and requires the launch command with the derived brief and the released claim, with the control that a fresh heartbeat launches nothing.
- WHEN the last heartbeat carries a reset instant THE watchdog SHALL start the replacement at that instant rather than at the staleness interval, and where it carries none SHALL retry with a growing delay, pinned by bodies for each.
- WHEN the replacement starts THE replacement SHALL take the seat (T-238) before any dispatch and SHALL continue from the records rather than from any memory of the dead session — the live lanes derived, the open asks read, the approval mode and recovery policy read from their record (T-319) — pinned by a body over a fixture runtime directory.
- WHEN the demonstration runs THE notes SHALL record a real restart on this machine: a coordinator fixture killed, the watchdog's detection instant, the replacement's launch and its first heartbeat, each with its ref; a description of how it would work is not the demonstration.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/commands.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes

## Verdicts
