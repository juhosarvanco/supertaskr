---
id: T-224-s1
title: A range that is BOTH out-of-fence and `touches:`-amended is refused for the PATHS alone, so the amendment is met one attempt later — two findings, one refusal, and the seat learns them in series
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-224's lane, 2026-09-08 — disclosed as limit 5(c) in landing-gate.mjs while building the arm that creates it
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

`T-224` put the `touches:`-line arm AFTER the containment arm, and the
reason is good: `landing-gate.spec.ts`'s *"a lane editing its OWN card's
`touches:` does not widen this gate either"* and *"the merge's fence is
read from its FIRST parent"* both drive a range that widens a card AND
writes outside the narrow fence, and their kill power IS the containment
refusal. An amendment refusal placed ahead of them answers those pushes
for a different reason and retires two bodies that measure where the
fence is read from — measured on this lane's own drill, where the mutant
that inverts the arm's order is indistinguishable from a mutant that
deletes those two bodies.

## The cost that leaves

A range carrying both findings is refused naming only the paths. The
seat fixes those, pushes again, and meets a SECOND refusal it was given
no warning of. That is the shape this project already calls out
elsewhere — *"a refusal that does not say what escaped sends the seat
back to guessing"* — one level up: the refusal says what escaped, and
not everything that would.

## What to build

- Both arms REPORT, one arm DECIDES. Compute the amendment finding
  whether or not the containment arm refuses, and where both have
  something to say, print the containment refusal with the amendment
  section appended under it — which is exactly what the MERGE arm
  already does across merges (`refusals` carries an `amendments` block
  when both are non-empty; the LANE arm has no equivalent because it
  answers about one range).
- The two `T-212` bodies SHALL still red under a mutant that reads the
  fence from HEAD — that is the property the ordering protects, and any
  change here is measured against it rather than argued.
- A body SHALL drive a range that is both, and assert BOTH findings are
  named in ONE refusal.
