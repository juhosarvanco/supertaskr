---
id: T-242-s4
title: "The seat fixture copies the conventions index twice, so every lane whose fence excludes it reds three push-guard bodies — invisible in CI and in the integration checkout, where the file is writable"
feature: F-04
milestone: 4
size: XS
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-242, met while running that lane's owed set and reproduced in isolation; pre-existing since T-290 and outside that lane's fence"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`seatFixture` in `tools/e2e/tests/push-guard.spec.ts` builds its scratch
repository in two passes. It copies every `docs/*.md` in a flat walk,
and then copies the set `conventionsFiles(repoRoot)` returns so the
chapters travel with the index. Since T-290 that set RETURNS the index
itself alongside its eleven chapters, so `docs/CONVENTIONS.md` is copied
to the same destination twice.

`copyFileSync` gives the destination the mode of its source. Inside a
lane worktree the fence makes every out-of-fence file read-only, so the
index is `-r--r--r--` there, the destination is created `0444`, and the
repeat copy fails:

    EACCES: permission denied, copyfile
    '<repo>/docs/CONVENTIONS.md' -> '<tmp>/T-314-seat-takes-.../docs/CONVENTIONS.md'

Three bodies red on it: the two `--take-seat` bodies and the one about a
seat acquisition failing for a reason of its own.

Reproduced in isolation at that lane's tip, one read-only source and one
writable, each copied twice to a fresh destination: the read-only one is
EACCES on the repeat and the writable one is fine. So the defect is the
repeat copy, and the file mode is only what makes it visible.

It cannot be seen where anyone usually looks. On the runner and in the
integration checkout the index is writable, the repeat copy simply
overwrites, and the fixture is whole. It reds in a lane, which is where
nobody re-runs the guard suite unless the lane's own diff owes it — and a
lane that does owe it reads the red as its own.

## Acceptance criteria

- WHEN the seat fixture builds its scratch repository THE index SHALL be
  copied to its destination once, whatever both passes name.
- WHEN a source file the fixture copies is read-only THE fixture SHALL
  still build, so a lane worktree and the integration checkout produce
  the same fixture.
- IF a pass would write a destination an earlier pass already wrote THEN
  a body SHALL red naming that destination, so the repeat cannot come
  back the next time either list grows.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
