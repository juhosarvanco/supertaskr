---
id: T-020
title: CI + real-input E2E lane (Linux run, trusted-input tests, token lint)
feature: F-02
milestone: 4
priority: 11
size: L
status: planned
blocked_by: []
touches: [.github/, tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-001-s2, T-001-s3, T-005-s4. Triage 2026-08-15: one lane,
shared infrastructure — separately each would rebuild half the other.
Size L: planning pass required before dispatch (tooling choice
Playwright vs CDP, lane placement). Best landed before T-012's
interaction-heavy verification; also automates most of the @human
real-input checklist for the future.

## Acceptance criteria
- THE repo SHALL gain a GitHub Actions ubuntu job: webkit2gtk deps,
  npm ci + parser/app builds + all three suites + an xvfb tauri boot
  asserting the startup lines — closing the Linux halves of
  T-001/T-003 criteria with a machine check.
- THE repo SHALL gain a self-contained tools/e2e package (own
  package.json, ADR-011 family) driving the dev bundle +
  __nputerDocsHarness with REAL input: the T-005 blocker-link
  re-target under a trusted click, real-key Escape/Enter/Space on the
  panel — the rejection class synthetic tests provably cannot catch.
- THE CI SHALL include the token-lint step: greppable arbitrary-value
  and non-token-utility guard over app/src (the Tailwind v4 escape
  hatch documented in CONVENTIONS).
- IF the E2E lane cannot run under a scheme (e.g. webkit quirk) THEN
  the lane SHALL fail loudly with the reason — never silently skip.

## Implementation notes

## Verdicts
