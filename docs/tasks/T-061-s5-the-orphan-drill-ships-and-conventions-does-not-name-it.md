---
id: T-061-s5
title: The orphan drill ships with a four-code contract that CONVENTIONS does not name, so nobody meets it — and documenting it makes it a CI step verbatim
status: suggested
suggested_by: executor claude-opus-5 @T-061
---

T-061 shipped `tools/e2e/scripts/orphan-drill.mjs` and the npm script
`boot:orphan-drill`, because its second criterion required the orphan
drill to be **a shipped procedure, not a one-off**. It is now a script
in the tree with a documented header and a four-code contract in the
family the other three gates use (0 clean, 1 the leak, 2 called wrong,
3 the drill could not run).

**docs/CONVENTIONS.md does not mention it.** T-061's fence is
`[tools/e2e]`; T-046's was `[tools/e2e/, docs/CONVENTIONS.md]`, which is
how the BOOT GATE bullet came to exist in the first place. So the drill
is shipped and unmet: the two places a reader would look — the tools/e2e
commands bullet under "Build & test", and the BOOT GATE bullet — both
list `npm run boot:check` and stop.

**A shipped procedure nobody is told to run is a one-off with a longer
half-life.** That is the failure the criterion was written against.

## The thing that makes this a decision rather than a chore

`tools/e2e/tests/workflow-parity.spec.ts` DERIVES CI's steps from those
command bullets: *every command they list is a workflow step VERBATIM*.
Adding `npm run boot:orphan-drill` to a per-package bullet therefore
asserts that `.github/workflows/ci.yml` runs it. The parity derivation
is silent in exactly one direction — a command the DOC gains that the
spec does not yet claim — so the lane would NOT red, and the divergence
would be invisible. Whoever writes the bullet has to decide, in the same
edit, whether the drill is a CI step.

Arguments both ways, so the next person does not re-derive them:

- **For.** It is headless in the sense that matters (nothing is clicked
  or read off the screen), and CI already wraps `boot:check` in
  `xvfb-run -a`, so the display problem is solved. It is the only thing
  that proves the child-exit cleanup, and the cleanup guards the
  human's 1420.
- **Against.** It opens a window and builds the app, so it roughly
  doubles the boot step's cost; it deliberately SIGKILLs a process
  mid-boot, which on a shared runner is a different risk profile from a
  developer's laptop; and it is a REGRESSION drill rather than a
  release gate — the property it pins is pinned once, by construction,
  and cannot drift without someone editing
  `tauri-boot-check.mjs`'s exit path.
- **A third option.** Document it in the tools/e2e bullet as a LOCAL
  ONLY command, the way `index --watch` and `arch` already are — the
  precedent exists and the parity spec already honours it. That gets the
  drill met without buying a CI step, and it is the arm I would take.

## Also unrecorded, and cheaper

The boot check gained a **new reason for exit 3** at T-061: a committed
`tauri.conf.json` the scratch-port overlay cannot be DERIVED from is
refused before anything is probed or spawned, because the only value to
fall back to is the committed port and on this repository that is 1420.
CONVENTIONS' legend for that code reads *"3 the override was refused"*
in two places. It is still true and it is no longer complete. One clause.
