# ADR-004: Single-writer task creation; everyone else suggests

Date: 2026-08-14 · Status: accepted · Decided in: planning chat (human directive)

## Context
Tasks emerge mid-build from sessions and from the human; unrestricted
task creation degrades board coherence (duplicate IDs, uneven criteria,
contradictory priorities).

## Options considered
Any session creates tasks vs architect-only creation with a
status:suggested channel for everyone else.

## Decision
Only the architect writes status:planned. Executors/verifiers file
suggestions and return to their task; human features get a
mini-interview; architect triages (promote through full decomposition
rules / park / reject with reasoning).

## Consequences
A card on the board always means the same thing; emergence without
entropy. Cost: architect triage is a standing duty.
