---
id: T-239-s2
title: The dispatch arm derives every scratch file NAME from the card and DEFAULTS the directory they go in — CONVENTIONS publishes the name and says the directory is shared, and never says which directory
feature: F-06
milestone: 4
size: S
priority: 4
status: planned
suggested_by: executor claude-opus-5@subagent @T-239
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY HAVING TO CHOOSE ONE.** `docs/CONVENTIONS.md`'s SCRATCH RULE
publishes `<purpose>-<card id>.<ext>` and says *"The scratchpad is ONE
directory shared by every seat a session spawns"*. It never says WHICH
directory, so `--dispatch-lane` takes `--scratch <dir>` and falls back to
the platform temp directory when it is not given.

**The fallback is safe TODAY and only because the other half of the rule
holds**: the file NAME carries the card id, so two lanes writing into one
directory cannot collide. That is exactly the argument the SCRATCH RULE
makes, which is why this is a suggestion and not a defect — but a
defaulted directory is still a machine-scoped surface with an undeclared
value (`method/lane-protocol.md` rule 4), and the brief a dispatcher then
hands an executor names a path nobody published.

## Acceptance criteria

- THE SCRATCH RULE bullet SHALL publish the scratch DIRECTORY the way it
  already publishes the file name, or state that the directory is the
  session's and therefore always passed.
- THE dispatch arm SHALL read that spelling rather than defaulting, in
  the same commit that publishes it.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-239 merge (0f3e7ae)

The architect seat. The scratch directory is a machine-scoped default where only the file name is published; the fourth member of the rule family, beside T-240. No dispatch follows today by the user's instruction.
