---
id: T-178
title: The refShapes fixture teardown reds a passing body on ENOTEMPTY — rmSync races something still writing inside the cloned fixture's .git/objects, and the assertion it interrupts had already passed
feature: F-06
milestone: 4
priority: 23
size: S
status: building
blocked_by: []
touches: [tools/e2e]
suggested_by: standing triage sitting #4 (2026-08-30) — CI run 33327281402, diagnosed at this seat
builder: claude-opus-5@subagent
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
will spend the same twenty minutes deciding whether main is broken. It is
also not alone: `T-161` is a CI-only intermittent of a different
mechanism (a stderr drain race in the app crate) live on this
repository at the same time, and **that PAIR — enumerated, not
counted** — is the fact that argues for writing both down rather than
re-running until green — the POISON DRILL bullet's own
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

## CORROBORATION (2026-08-30) — the SECOND sighting, and this one redded MAIN

CI run **33333142954**, main at `2489b0f` — a **docs-only** commit
(docs/ROADMAP.md, docs/rooms/governing-docs.md, one card). Step `e2e
lane`, one failure of 332, the same body:

    ✘ 42 [chromium] › tests/brief.spec.ts:1000:1 › the WHOLE brief
      assembles on a pull_request-shaped checkout, and names the ref it
      actually spent (2.0s)
    Error: ENOTEMPTY: directory not empty, rmdir
      '/tmp/t153s9-refshape-QDWTIx/local/.git'

**WHAT THE SECOND SIGHTING ADDS, beyond confirming the class is real:**

1. **IT REDS MAIN, NOT ONLY A PUSH.** The first sighting (run
   33327281402) landed on an intermediate commit. This one is main's own
   tip, on a diff that touches no code at all — so the failure is
   provably independent of what was merged, and it is now the second
   uncarded-until-today intermittent able to red a green tree (`T-161`
   is the first).
2. **THE PATH DEPTH MOVED AND THE MECHANISM DID NOT.** First sighting
   removed `…/local/.git/objects`; this one `…/local/.git`. Same
   fixture stem (`t153s9-refshape-`), same clone, same `rmSync(fx.dir,
   {recursive: true, force: true})`. **Cite the mechanism, not the
   path** — a card that pinned `objects` would already read as fixed.
3. **THE COST IS CONFIRMED AS THE ONE THE CARD PREDICTED**: the `e2e
   lane` step failed, so `xvfb tauri boot` behind it never ran. One
   fixture teardown hides a gate.

Second measurement fired immediately at this record (`gh run rerun
33333142954 --failed`), the same protocol `T-161`'s card uses; its
result stands in the checkpoint that cites this card.

**PRIORITY ARGUMENT FOR THE NEXT SITTING, recorded rather than acted on
here:** two reds in one evening, both on other people's work, is the
threshold this project usually treats as promotion-worthy. It is already
`planned` and fenced `[tools/e2e]`; what it wants is to be NEXT in that
package rather than to be re-argued. It contends with `T-112-s3`, which
holds `tools/e2e` right now.

**THE SECOND MEASUREMENT CAME BACK GREEN.** Run 33333142954 **attempt
2** — the same failed job re-run on the SAME commit `2489b0f`, no code
changed — completed **success**. So the failure is INTERMITTENT and not
reproducible on demand, which is what separates this from a defect a
lane can walk up to and fix.

**AND THAT IS THE WARNING, NOT THE ALL-CLEAR** (the POISON DRILL
bullet's own sentence, one layer up): re-running until green is a
defect's healing mechanism, not evidence about it. Two reds and one
green re-run mean the race is real and rare, not that it is closed. A
lane taking this card SHALL NOT treat "I could not reproduce it" as the
finding — it has to read what holds a handle inside the fixture's `.git`
at teardown and show the mechanism.
