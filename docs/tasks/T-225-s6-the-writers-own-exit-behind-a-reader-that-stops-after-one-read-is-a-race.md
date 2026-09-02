---
id: T-225-s6
title: The writer's own exit behind a reader that stops after ONE read is a RACE, and the one fact a caller would reach for — "it exited 0, so nothing was cut" — is the unreliable one
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-225-s1
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-197`** (the brief reaches a pipe whole), whose bodies
all drive readers that DRAIN. The reader that stops early is the one
shape none of them covers, and it is the shape a human uses: `| head`,
`| dd`, a pager closed on the first screen.

**MEASURED AT `482be56`**, on `Mac.lan`, node v22.22.0.
`brief.mjs --dispatch --full` piped into `dd bs=65536 count=1` leaves the
WRITER at exit **0** in six hand runs and on the dispatching seat's own
bench — and at exit **1** on the first loaded run of `T-225-s1`'s new
OVER-arm body, which is what caught it. Whether the `EPIPE` from the
closed pipe reaches node before the process ends is timing, not a
property.

**WHY IT IS WORTH A CARD.** The READER's side is stable and is what
`T-225-s1`'s disclosure now claims: at most one buffer, no error, the cut
invisible. The WRITER's side is what a script would test — *"the command
exited 0, so I got everything"* — and it is exactly the half that flips
under load. Nothing in the tree records this today, and `T-225-s1` had to
delete the claim from both its sentence and its assertion after measuring
it.

**WHAT A FIX WOULD DECIDE.** Whether `brief-flush.spec.ts` gains a fourth
reader shape — one that stops after a fixed read — asserting the stable
half (the reader takes at most one buffer, no error on its side) and
DISCLOSING the writer's exit across samples rather than pinning it; or
whether the recorded sentence is enough, the way `THE E2E LANE'S HONEST
SCOPE` records rather than codes. Either way the fence is
`tools/e2e/tests/brief-flush.spec.ts`, which `T-225-s1`'s fence did not
reach.
