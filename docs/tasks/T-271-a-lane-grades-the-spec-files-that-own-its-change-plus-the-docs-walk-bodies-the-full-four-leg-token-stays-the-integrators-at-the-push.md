---
id: T-271
title: "A lane grades the spec files that own its change plus the docs-walk bodies; the full four-leg token stays the integrator's at the push — a fix in one hook runs its own spec in a minute, not the ten-minute browser leg"
feature: F-06
milestone: 4
size: S
priority: 29
status: planned
suggested_by: "@human, 2026-09-09: \"We need to make changes like these faster and more token efficient\" → \"file the first two\"; measured on T-224's fix passes (each seat ran the full battery: ~11 min, the e2e leg ~10 of them, for a change in one hook and one spec)"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Every seat runs the whole four-leg battery, and the browser leg is ten
minutes of it, for changes whose owning spec runs in seconds. The docs
gate already derives which suites a diff owes; what is missing is a
graded reading NARROWER than a leg for lane seats, while the push keeps
its whole-battery token. The integrator's full run on merged main
before the push is what catches a cross-spec interaction, which is
that run's job and always was.

## Acceptance criteria

- WHEN a lane seat (executor or verifier) runs `gate-run.mjs e2e
  --owning <changed paths…>` THE runner SHALL derive the spec files that
  own those paths (the spec whose name or imports match the changed
  hook/script, plus the docs-walk bodies when a docs path moved) and
  grade ONLY those, with the same refusals (zero bodies, parts ≠
  baseline, a pipe, the wrong cwd) and a verdict line that names the
  subset and its body count — never the leg's name alone.
- WHEN the subset verdict is written THE token SHALL NOT be minted from
  it: a lane's subset run writes a `scoped` verdict the push guard
  refuses as a token, so a push still owes the integrator's full
  battery on the pushed tree.
- WHEN the owning-spec derivation cannot name a spec for a changed path
  THE runner SHALL refuse the scoped run (exit 2, naming the path) and
  say the full leg is owed — never grade nothing.
- WHEN CONVENTIONS' DOCS GATE and BLESSED RUNNER bullets are read THE
  spelling SHALL say which seats run the scoped form and that the
  integrator runs the full battery last; the executor's and verifier's
  briefs (row 7) SHALL carry the scoped spelling.
- A body SHALL show the scoped run red on a planted defect in the
  owning spec's subject and green on the pristine hook; a second body
  SHALL show the push guard refusing a `scoped` verdict as the token.
