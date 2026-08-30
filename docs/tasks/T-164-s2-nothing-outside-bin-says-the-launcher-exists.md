---
id: T-164-s2
title: Nothing outside bin/ says the launcher exists — a command written to replace a personal note is discoverable only by the seat that wrote it
feature: F-02
milestone: 4
priority: 21
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md, README.md]
suggested_by: executor claude-opus-5@subagent @T-164
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-164, ROUTED RATHER THAN FIXED: both files are
outside that lane's fence** (`touches: [bin]`; `docs/CONVENTIONS.md` is
additionally held by `T-163-s3`'s live lane at filing time). T-164 exists
so a three-step ritual stops living in a personal note — but
`bin/app-dev.mjs` is named in no command list, no front door and no
gotcha, so the note it replaces is still the only thing that says the
command exists, and the next session to open the app will find the
ritual before it finds the script. Two places want one sentence each:
CONVENTIONS' **Build & test** section, whose bullets are the command
census a session reads first, and the README's human front door (T-158).
**AND THE CONVENTIONS HALF CARRIES A MECHANISM THAT REDS THE LANE THAT
FORGETS IT** — `deriveExpectedSteps` in
`tools/e2e/tests/workflow-parity.spec.ts` reads exactly the
`run from <dir>/:` bullets of that section and reds by name on a command
it cannot map to a CI step. This launcher is LOCAL ONLY by construction
(it starts the human's app; the pipeline never drives the app), so the
bullet must land with its `LOCAL_ONLY` entry in the SAME commit, which
is the two-package edit the `npm run health` bullet above it already
warns about. That is why this is a card and not a line smuggled into a
doc: the fix is one sentence and two packages.
