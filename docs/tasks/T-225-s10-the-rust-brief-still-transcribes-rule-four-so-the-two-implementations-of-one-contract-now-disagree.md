---
id: T-225-s10
title: The Rust brief assembler still TRANSCRIBES lane-protocol rule four, so the repository now holds two implementations of one contract row that disagree by 13,000 bytes
feature: F-06
milestone: 4
size: S
priority: 3
status: parked
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [app-dispatch]
builder:
verifier:
built_by:
verified_by:
review:
---

**ONE CONTRACT ROW, TWO IMPLEMENTATIONS, AND T-225-s2 MOVED ONLY ONE OF
THEM.** `row_prohibitions` in `app/src-tauri/src/dispatch/brief.rs`
assembles row 10 exactly as `deriveProhibitions` in
`tools/e2e/scripts/dispatch-brief.mjs` did before T-225-s2:

    BriefLine::tree(
        "never touch the integration branch",
        numbered_rule(&protocol, 4).unwrap_or_default(),
        LANE_PROTOCOL,
    )

T-225-s2 replaced the JS half with a CITATION — the file, the rule's own
opening capitals, its flattened size at the ref, and a wrap-proof `grep`
— because that transcription was 12,984 bytes of every `--task` brief
against a 65,536-byte line. The Rust half still hands over the whole
rule, so **the app's brief and the command's brief now differ by about
13 KB in the same row**, and a session briefed from the app meets a
contract row a session briefed from the command does not.

**THIS IS T-057's OWN FAILURE SHAPE** (two implementations of one
derivation, kept in step by nobody) and `docs/ARCHITECTURE.md` already
names the pair as a live instance of it for the slug map. Nothing in the
tree compares these two assemblers, which is why the divergence landed
silently and is being filed rather than discovered.

**WHY IT WAS NOT BUILT IN THE LANE.** `app/src-tauri/src/dispatch/**` is
C-15's territory, slug `app-dispatch`; T-225-s2's fence is exactly
`tools/e2e/scripts/brief.mjs`, `tools/e2e/scripts/dispatch-brief.mjs`,
`tools/e2e/tests/brief.spec.ts` and `tools/e2e/tests/brief-flush.spec.ts`,
which reaches neither the Rust file nor any suite that reads it.

**WHAT A FIX WOULD DECIDE.** Whether the Rust half cites in the same
shape (its own `citedRule`), and — the more valuable half — whether a
body ASSERTS that the two assemblers agree row for row, so the next
divergence reds instead of being noticed by hand. The size figure and
the opening are both derivable on either side, so the comparison need
not be a byte pin.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. Two implementations of one contract row now differ by thirteen kilobytes; serialised with T-205-s2 on app-dispatch.

## Parked (2026-09-09, the architect seat)

ADR-021 (2026-09-03) and its addendum (2026-09-08) took the in-app dispatch and every in-app spawn path out of v1: the app spawns nothing and the seat drives from the agent app over the CLI. This card's subject is the Rust/in-app dispatch surface (app-dispatch, C-15). **Returns when** the cockpit returns to a version (docs/VERSIONS.md, v2: "not before v2, and only on evidence a user wants it") or when C-15's slug is next dispatched for any other reason; re-derive its need at that ref before building.
