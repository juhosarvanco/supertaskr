---
id: T-271
title: "The EXECUTOR grades the spec files that own its change (owning = everything that reads the changed file, derived over imports) plus the docs-walk bodies while it iterates; the verifier's one run and the integrator's run before the push stay the full four legs"
feature: F-06
milestone: 4
size: S
priority: 29
status: building
suggested_by: "@human, 2026-09-09: \"We need to make changes like these faster and more token efficient\" → \"file the first two\"; measured on T-224's fix passes (each seat ran the full battery: ~11 min, the e2e leg ~10 of them, for a change in one hook and one spec)"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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

- WHEN an EXECUTOR runs `gate-run.mjs e2e --owning <changed paths…>`
  THE runner SHALL derive the spec files that own those paths — every
  spec that reads the changed file, directly or through imports
  (derived from the same static import graph the map is built from,
  never from the spec's name alone), plus the docs-walk bodies when a
  docs path moved — and grade ONLY those, with the same refusals (zero bodies, parts ≠
  baseline, a pipe, the wrong cwd) and a verdict line that names the
  subset and its body count — never the leg's name alone.
- WHEN a VERIFIER runs the owed suites THE runner SHALL NOT accept the
  scoped form: the verifier's one run (T-262: once, at its own tip) is
  the full four legs, so the whole battery still runs before every
  verdict; and the integrator's run on merged main before the push is
  the full four legs (the token). AMENDED 2026-09-09 at @human's
  question ("Is it sure that this doesn't make bugs more likely?"):
  as first filed the scoped form applied to both lane seats, which
  would have moved a cross-spec red — the class T-264's executor found
  four of by running everything — from the lane to merged main, where
  the answer is the revert play. Scoping the executor's iterations
  keeps the time saved where suites run most often and loses no run
  that stands before a verdict or a push.
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
