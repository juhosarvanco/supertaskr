---
id: T-045
title: The gates cover the rules they enforce
feature: F-02
milestone: 4
priority: 23
size: M
status: building
blocked_by: []
touches: [tools/e2e/]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-020-s6, T-036-s1, T-038-s2. Triage 2026-08-16: three
findings, one sentence — the enforcement is narrower than the
discipline it enforces, and each gap opens on the occasion the
discipline matters most. The parity spec mirrors CONVENTIONS instead
of parsing it; the least-privilege assertions read one hard-coded
workflow file; the token lint walks one directory. All three live in
tools/e2e and share the mutation-drill discipline T-020 established.
Launch-prep: these gates fire for real at the repo's first push.

Half of T-020-s6 is ALREADY DISCHARGED and this task does not carry
it: its sharpest paragraph said six of the sixteen hard-coded commands
point at a CONVENTIONS section that was still unwritten. The
integrator landed that text — docs/CONVENTIONS.md now carries the
tools/e2e command block, the `npm ci`-in-CI note and the PORT RULE
(verified at triage). What remains is the mirror-vs-parse hole.

## Acceptance criteria
- THE workflow parity spec SHALL DERIVE its expected commands from
  docs/CONVENTIONS.md "Build & test" rather than mirror them in a
  sixteen-entry array: every backticked command the doc lists for
  lib/parser, app, app/src-tauri and tools/e2e SHALL appear as a
  workflow step verbatim, with the TWO documented divergences
  (`npm ci` in CI where local says `npm install`; `npx playwright
  install --with-deps chromium`) expressed as an explicit, commented
  mapping rather than an untracked difference — so criterion 1 of
  T-020 ("command parity with CONVENTIONS") becomes literally true.
  IF parsing the section is judged too clever THEN the array stays
  AND docs/CONVENTIONS.md gains a pointer naming the spec by path;
  that arm is strictly weaker and SHALL be recorded as the arm taken.
- WHEN a command in docs/CONVENTIONS.md is reworded THEN the lane
  SHALL fail — a fixture SHALL prove it, since the whole defect is
  that today the workflow and the spec agree with each other while
  both are wrong.
- THE three least-privilege assertions SHALL run over EVERY file in
  .github/workflows/ (`*.yml` + `*.yaml`), not over the hard-coded
  ci.yml alone: a `permissions:` block present, exactly
  `{contents: read}` unless an explicit per-file exception table
  argues otherwise, and no job or step widening it. The remaining
  parity assertions (CONVENTIONS command verbatim + order, SHA pins,
  apt set, boot step) SHALL stay bound to ci.yml — they are facts
  about that one job, and the split is between "rules every workflow
  obeys" and "facts about the one CI job".
- WHEN a second workflow file is added with no `permissions:` block
  THEN the lane SHALL fail NAMING the file — a fixture SHALL prove
  it. The exception table SHALL carry scope, file and reason per
  entry, so a future release job's `contents: write` is argued in the
  test as well as in the workflow; zero-allowlist is not the honest
  target here, "no unargued grant" is.
- THE token lint's walk SHALL widen to app/test (and tools/e2e's
  fixtures if the same argument holds), keeping lib/parser OUT (no
  UI, ever — ADR-011) and keeping the lint's own script excluded
  DELIBERATELY rather than by file extension. T-038's measured
  122-file differential (`both=0 OLD-only=11 NEW-only=0`) is the
  standing evidence the widening is now safe; the lint SHALL be green
  on the widened corpus at ZERO allowlist. app/test is the one place a
  `text-red-500` can sit unnoticed while the shipped tree stays clean.
- THE `--selftest` sample set SHALL gain a positive/negative pair for
  each newly-covered surface, and `npm test`, `npm run typecheck`,
  `npm run lint:tokens` (+ `--selftest`) SHALL all be green.

Verification: headless — from tools/e2e/, with the mutation drills
recorded in notes the way T-020's seven were (each mutation caught by
exactly the intended assertion, each reverted). @human: none.

## Implementation notes

## Verdicts
