---
id: T-178
title: The refShapes fixture teardown reds a passing body on ENOTEMPTY — rmSync races something still writing inside the cloned fixture's .git/objects, and the assertion it interrupts had already passed
feature: F-06
milestone: 4
priority: 23
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: standing triage sitting #4 (2026-08-30) — CI run 33327281402, diagnosed at this seat
builder:
verifier:
built_by:
verified_by:
review:
---

**CLASS SEARCH FIRST, PER TASK-FORMAT.** `command grep -rli "ENOTEMPTY"
docs/tasks/` returns nothing at `b60b06d`, and the nearest neighbours are
about different mechanisms: `T-161` is a child-process STDERR drain race
in the app crate, `T-130` is fixture MTIME restoration. **No card owns
the fixture-teardown class**, so this is a card rather than a
corroboration.

## The sighting

CI run **33327281402** (main, the dispatch-stamps commit at `27f609d`'s
predecessor), step `e2e lane`, one failure out of 332:

    ✘ 42 [chromium] › tests/brief.spec.ts:1000:1 › the WHOLE brief
      assembles on a pull_request-shaped checkout, and names the ref it
      actually spent (2.6s)
    Error: ENOTEMPTY: directory not empty, rmdir
      '/tmp/t153s9-refshape-joRss6/local/.git/objects'

**The body's own assertions had already passed** — the error is raised
from the `finally` block, not from an `expect`. `331 passed, 1 failed`,
and the step's failure skipped the boot gate behind it.

## The mechanism, read at `b60b06d` rather than guessed

`refShapes()` (`tools/e2e/tests/brief.spec.ts`, the helper opening
`mkdtempSync(path.join(os.tmpdir(), "t153s9-refshape-"))`) builds three
checkout shapes by shelling `git` — an `archive` piped into a local
tree, then `git clone --quiet local detached`, then an orphan variant.
Two bodies tear the whole directory down with

    rmSync(fx.dir, { recursive: true, force: true });

`force: true` suppresses *missing*-path errors; it does not retry, and
`ENOTEMPTY` on `rmdir` is not a missing path. Node's own remedy for this
exact class is `maxRetries`/`retryDelay`, which this call does not pass.

**WHAT IS STILL WRITING IS THE QUESTION THE LANE MUST ANSWER, NOT
ASSUME.** `git clone` can leave a short-lived background process
(`git gc --auto` is the usual suspect, and a clone's own pack/index
finalization is the other), and a directory whose child appears between
`readdir` and `rmdir` is precisely what `ENOTEMPTY` means. The card
deliberately does not name the culprit: the sighting is one CI run on a
shared Linux runner, and this project's rule is that a race gets its
mechanism READ, with a reproduction, before it gets a fix.

## Why it is worth a card and not a rerun

It is **noise that lands on somebody else's lane**. The body reds after
passing, in a spec about ref shapes, on a commit whose diff has nothing
to do with either — the same attribution problem the DOCS GATE exists to
prevent, arriving through a fixture instead. The next session to see it
will spend the same twenty minutes deciding whether main is broken. It
is also the second class of CI-only intermittent live on this repository
(`T-161` is the first), which is the fact that argues for writing both
down rather than re-running until green — the POISON DRILL bullet's own
warning that re-running until green is a defect's healing mechanism, not
evidence.

## Acceptance criteria

- THE lane SHALL name what still holds a handle inside the fixture's
  `.git` at teardown, from the code and a reproduction, rather than
  hardening the teardown against an unnamed cause.
- THE teardown SHALL stop failing a body whose assertions passed:
  either the fixture waits for what it spawned, or the removal retries —
  and IF a retry is the answer THEN the wait SHALL be bounded and the
  reason written beside it.
- A teardown failure SHALL NEVER be reported as a test failure of the
  body it follows: if the removal cannot complete, it is the FIXTURE's
  finding and SHALL say so by name.
- THE sweep SHALL cover every `rmSync` teardown in `tools/e2e/tests/`
  that removes a directory built by shelling `git`, and its result SHALL
  be recorded EVEN IF EMPTY (CONVENTIONS, A FIX NAMES ITS CLASS AND ITS
  SWEEP).
- Verification: headless, `npm test` from tools/e2e/.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
