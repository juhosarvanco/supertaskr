---
id: T-239-s5
title: CONVENTIONS' borrowed-git-environment recipe suppresses git's config FILES and not its identity AUTO-DETECTION, so it answers green on a host whose hostname carries a dot and reproduces no runner the class it was written for
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: executor claude-opus-5@subagent @T-239-s4, measured at 0f6b37f, 2026-09-08
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`docs/CONVENTIONS.md`'s **RUN THE SUITE ONCE IN A BORROWED GIT
ENVIRONMENT BEFORE YOU BELIEVE IT** bullet publishes one recipe:

    GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null npm test

and claims *"It would have caught both of the CI reds this rule was
written from, in seconds, before either push."* **It does not catch
T-239-s4's**, and the reason is that the two variables suppress git's
config FILES while leaving its identity AUTO-DETECTION on.

MEASURED at `0f6b37f34665` on Mac.lan, 2026-09-08, in a scratch
repository with no configured identity:

| environment | `git commit` | author |
|---|---|---|
| `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null` | exit **0** | `ujju <ujju@Mac.lan>` |
| `HOME=<an empty directory>` | exit **0** | auto-detected |
| a `GIT_CONFIG_GLOBAL` file carrying `[user] useConfigOnly = true` | exit **128** | *"Please tell me who you are"* |

`git var GIT_AUTHOR_IDENT` under the published recipe answers
`ujju <ujju@Mac.lan>`: with no configured identity git composes one from
`getpwuid` and the hostname, and refuses only when it judges the result
bogus. **Whether it so judges is a property of the HOST** — this
machine answers to `Mac.lan`, git reads the dot as a domain and is
satisfied; a runner's hostname carries none and git refuses. So the
recipe reproduces the runner on a host that would have failed anyway
and not on the hosts that need it, which is the T-238-s2 class the
bullet is filed under.

The whole T-239-s4 lane confirms it end to end: `brief.spec.ts` under
the published recipe was **57 passed, exit 0** at the base commit CI had
already reddened, and **1 failed / 56 passed** at that same base under
`user.useConfigOnly=true` — the same body, the same banner, the same
exit 128 as CI run 33672240360.

## What is asked

The bullet SHALL name a borrowed environment that disables git's
identity AUTO-DETECTION rather than only its config files —
`user.useConfigOnly=true` written into a `GIT_CONFIG_GLOBAL` file is
git's own switch for it, and `-c` is not available where the `git` being
borrowed from is one this seat does not spell. It SHALL keep the two
sentences it already has right: **`HOME` is not clobbered** (Playwright
caches browsers under `~/`), and the recipe stays one line a seat will
actually run. The claim about the two earlier CI reds SHALL be
re-measured rather than carried, since it is now known to be false for
at least one red in the same family.

`tools/e2e/tests/brief.spec.ts`'s `noIdentityEnv` is a working
implementation of the replacement and can be cited rather than
re-derived.

## Why it is not in T-239-s4

Out of fence: that lane is `[tools/e2e/tests/brief.spec.ts,
tools/e2e/scripts/dispatch-brief.mjs]` and this is `docs/CONVENTIONS.md`
(method/lane-protocol.md rule 5). Editing that bullet also owes the
DOCS GATE's suite list for `docs/CONVENTIONS.md`, which the cargo suite
reads off disk on every run.
