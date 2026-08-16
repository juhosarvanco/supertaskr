---
id: T-036
title: CI token least privilege — declare the permissions block before the first push
feature: F-02
milestone: 4
priority: 20
size: S
status: building
blocked_by: []
touches: [.github/, tools/e2e/]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-020-s4. Architect ruling 2026-08-16: least privilege, taken
now while the workflow is DORMANT — after the first push the same edit
happens against a live credential. ci.yml pins everything else about
its supply chain (ubuntu-24.04 not -latest, every `uses:` by 40-hex
SHA, `npm ci`, exact-pinned Cargo deps under the audit) and then
leaves the one credential it carries undeclared: with no
`permissions:` key, GITHUB_TOKEN inherits the repository's default
workflow-permission setting — a checkbox in a web UI, not a fact in
this repo. That is exactly the class of machine-local invisible input
T-009 §3 exterminated from the graph. The job checks out, installs,
builds, runs three suites, lints, audits, runs the E2E lane and boots
under xvfb; it writes nothing back, opens no PR, uploads nothing.
S-tier: executor + tests, no separate verifier (ADR-004 tiering); the
parity spec is the regression net.

## Acceptance criteria
- THE workflow SHALL declare `permissions: contents: read` at the
  top level (workflow scope, under `name:`), so the token's scope is
  a repo fact rather than an account setting — the ADR-012 discipline
  applied to CI credentials: the minimum is the default and every
  addition is argued in place.
- THE workflow-parity spec (tools/e2e/tests/workflow-parity.spec.ts)
  SHALL pin it beside the existing runner/timeout assertions: the
  block exists, is exactly `contents: read`, and no job or step
  declares a wider scope — failing loudly if a future edit widens it.
- WHEN a future step genuinely needs more THEN the grant SHALL be
  added at that job's scope with the reason recorded beside it, never
  by widening the workflow default (stated as a comment in ci.yml so
  the next editor reads the rule at the point of temptation).
- THE change SHALL move nothing else: no step, action SHA, command,
  or ordering may differ, and the parity spec's existing assertions
  SHALL pass unchanged.

Verification: headless — `npx playwright test` in tools/e2e (the
parity spec runs without a browser), plus a mutation drill: widen the
block transiently, require the new assertion to fail naming the
widening, revert. The workflow itself stays honestly unverified until
the repo's first push (T-020 §1 tier 3).

## Implementation notes

## Verdicts
