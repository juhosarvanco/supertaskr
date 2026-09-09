---
id: T-238-s5
title: "CONVENTIONS' app setup command cannot be run inside a lane — `npm install` from app/ rewrites a lockfile the lane-lock layer holds read-only, so a fresh lane worktree takes EACCES at exit 243 and the fresh-worktree bullet sends every executor into it"
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-238-s1
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**MEASURED IN A LANE ON 2026-09-09, ON THE FIRST SETUP STEP.** The
Build & test section spells app setup as `npm install` from `app/`, and
the LANE PROTOCOL's fresh-worktree sub-bullet sends every executor
through it — *a fresh worktree has nothing installed and nothing built*.
Inside a lane that command cannot succeed unless the card's fence happens
to include `app/`: `npm install` writes `app/package-lock.json`, the
physical half of the lane fence leaves every out-of-fence tracked file
read-only, and npm ends at

    npm error code EACCES
    npm error syscall open
    npm error path <lane>/app/package-lock.json

with exit **243**. `npm ci` installs the same tree, writes no lockfile,
and is the spelling CI already runs for this package — the ONE deliberate
local/CI divergence the workflow-parity bullet lists.

**IT IS NOT A BROKEN GUARD.** The read-only bit is doing exactly its job:
a lane fenced to `tools/e2e` has no business rewriting the app's
lockfile. What is wrong is that the document tells the lane to try, and
the failure arrives as a permissions error that reads like a broken
machine rather than like a fence.

## Acceptance criteria

- THE fresh-worktree guidance SHALL name the spelling a LANE can run, and
  SHALL say why the setup spelling differs there — a lockfile write is a
  write outside most fences.
- WHERE the change moves a command bullet in the Build & test section, the
  fence SHALL reach `tools/e2e/tests/workflow-parity.spec.ts` as well:
  that spec derives its expectations from those bullets and reds by name
  on a command the doc gains or loses. Triage owns that widening — a lane
  cannot decide it from inside its own fence.
- Verification: headless.
