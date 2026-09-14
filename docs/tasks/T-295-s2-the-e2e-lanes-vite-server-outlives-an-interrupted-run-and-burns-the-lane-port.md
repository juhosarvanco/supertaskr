---
id: T-295-s2
title: "The e2e lane's vite server outlives an interrupted or refused playwright run and keeps LISTENING, so the next run on the same lane port dies at the preflight — three ports were burned in one sitting and nothing in the tree sweeps them"
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "the T-295 executor, 2026-09-10: after two interrupted drill runs, ports 15295 and 15990 were both held by leftover node servers and the lane's own preflight refused with EADDRINUSE; the sitting finished on a third port"
blocked_by: []
touches: [tools/e2e/preflight.ts, tools/e2e/scripts/orphan-drill.mjs, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The lane's playwright config starts a vite server on
`SUPERTASKR_E2E_PORT` with `reuseExistingServer: false`. When a run is
interrupted — or when a step that spawns playwright is itself killed —
that server survives the run that started it and goes on listening. The
next run on the same port meets the preflight's own bind probe and
refuses with EADDRINUSE, correctly and unhelpfully: the holder is this
project's own orphan and the message reads like a machine conflict.

Measured in one sitting on T-295: port 15295 held by a leftover node
process after the first spec run, port 15990 held after a nine-minute
drill run, and the work finished on 17295. The PORT RULE assigns a lane
exactly one port, so the third one was off-convention and had to be
reported as a deviation. `boot:orphan-drill` exists for the BOOT gate's
tauri process; nothing covers the e2e vite.

## Acceptance criteria

- WHEN the lane preflight finds its port held THE refusal SHALL say
  whether the holder is one of this project's own orphaned servers,
  naming its pid and how long it has been listening, rather than only
  that the port is busy.
- WHEN an orphan of this project's own making is found THE seat SHALL be
  given the one command that retires it, and the drill that proves the
  detection SHALL plant one.
- WHEN a playwright run ends by any route THE server it started SHALL be
  gone, or the departure SHALL be measured and the gap named.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 3 — the lane's dev server outlives an interrupted run and keeps listening; three ports were burned in one sitting and nothing reclaims them. Not dispatched by this sitting.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/dispatch-and-scratch.md, docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
