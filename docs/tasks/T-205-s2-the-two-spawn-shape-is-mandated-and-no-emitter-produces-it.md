---
id: T-205-s2
title: The two-spawn shape is now mandated and no emitter produces it — the app's dispatch assembles ONE verifier brief with a marker in it, which 5d names as the fallback
feature: F-06
milestone: 4
size: M
priority: 3
status: parked
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [app-dispatch]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE RULE LANDED WITHOUT ITS CONSTRUCTION.**
`method/roles/orchestrator.md` 5d now requires phase 1 to be its own
spawn holding no file, git or shell tools, and phase 2 to be a second
spawn. **The only emitter in this tree assembles ONE verifier brief and
splits it with a marker** — `app/src-tauri/src/dispatch/brief.rs`, whose
`Brief::marker` is `Some(..)` for `Role::Verifier` and `None` for the
executor, asserted in `lib.rs`'s seam body. 5d names that exact shape as
the FALLBACK a driver falls back to, and requires it to be DISCLOSED as
weaker. So today every brief this product emits is the disclosed weaker
thing, and nothing says so at the point of emission.

**AND THE TOOL GRANT IS THE PROPERTY, WHICH IS WHY THIS IS NOT A PROSE
FIX.** A blind phase 1 run for T-205's own positive control returned
`tool_uses: 0` because it was ASKED not to use tools, not because it
held none — the harness available to that lane had no tool-free agent
type. **An instruction not to look is the honour system T-205 was
written to end**; the emitter is where the grant can actually be
narrowed, and it is out of that card's fence.

## Acceptance criteria

- THE dispatch SHALL emit TWO artifacts for a verification: a phase-1
  brief carrying its contract inline, and a phase-2 brief carrying the
  attack set and the lane.
- THE phase-1 artifact SHALL declare its tool grant as an ALLOWLIST, not
  a denylist — a denylist fails open on every tool added afterwards, and
  it SHALL contain no tool that can spawn, fetch or message another
  agent, since one of those converts a tool-less spawn into a tooled one.
- THE phase-1 artifact SHALL carry NO diff, notes, executor report,
  commit log or post-cut figure, and a body SHALL prove the emitter
  refuses to interpolate one.
- WHERE the driver cannot spawn twice, the emitted brief SHALL SAY SO in
  the artifact itself rather than leaving the reader to infer it.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. The two-spawn shape 5d mandates has no emitter; the app-dispatch fence serialises it behind T-225-s10, which shares it.

## Parked (2026-09-09, the architect seat)

ADR-021 (2026-09-03) and its addendum (2026-09-08) took the in-app dispatch and every in-app spawn path out of v1: the app spawns nothing and the seat drives from the agent app over the CLI. This card's subject is the Rust/in-app dispatch surface (app-dispatch, C-15). **Returns when** the cockpit returns to a version (docs/VERSIONS.md, v2: "not before v2, and only on evidence a user wants it") or when C-15's slug is next dispatched for any other reason; re-derive its need at that ref before building.
