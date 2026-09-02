---
id: T-237
title: A PUSH CANCELS THE RUNNING CI JOB and the push guard does not know a run is running — the batching rule is a habit, and the last completed verdict is read by nobody at the moment it matters
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
suggested_by: "the architect seat, 2026-09-02 — item 10 of docs/rooms/loop-efficiency.md; the instance is the evening of 2026-09-01, when four runs were superseded by rapid pushes and main sat red for five hours while local batteries said green"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**TWO RULES ARE HABITS AND ONE GUARD COULD HOLD BOTH.** docs/CONVENTIONS.md
says *"A PUSH CANCELS THE RUNNING CI JOB … BATCH THE PUSH"* and, one bullet
later, *"AND THEN READ IT — `gh run list` after a batch"*. Both are kept by
memory. The push guard already refuses a push whose four-suite token is
not green against the pushed tree (T-203) and whose graph is stale
(T-216); it knows nothing about the run that is ALREADY RUNNING on the
remote for the previous push, nor about the verdict of the last one that
completed.

## The two facts a push should meet, and what each buys

1. **A run for this branch is IN PROGRESS.** Pushing now cancels it, and
   the tree it was measuring never gets a verdict — which is how a red
   main is discovered two pushes late. The guard SHALL refuse, naming the
   run id and its elapsed time, unless the pusher passes an explicit
   `--cancel-ci` acknowledgement through the environment; the refusal's
   remedy is *wait for the run, then push*.
2. **The last COMPLETED run for this branch is FAILURE.** Pushing over a
   red is the ordinary way a red gets fixed, so this is NOT a refusal.
   The guard SHALL announce the run id, the failing step's name and
   whether the tree being pushed touches any path under that step's
   package — so a seat pushing a fix sees that it is pushing a fix, and a
   seat pushing something else sees that main is red under it.

## Limits, stated where the guard is documented

`gh` may be absent, offline or unauthenticated. Then the guard SHALL
announce that CI could not be asked and ALLOW — the T-203 token still
holds the local claim, and a guard that refuses every offline push is
a guard somebody turns off. The announcement is the disclosure, and a
positive control SHALL show it fires only when `gh` genuinely fails.

## Acceptance criteria

- WHEN a push to the integration branch is attempted while the newest
  CI run for that branch is `in_progress` or `queued` THE guard SHALL
  refuse, naming the run id and the remedy, and a positive control SHALL
  show the same push ALLOWED once that run is `completed`.
- WHERE the newest completed run is `failure` THE guard SHALL announce
  the run id, the failing step and whether the pushed tree reaches that
  step's package, and SHALL NOT refuse on that ground alone.
- IF `gh` is absent, offline or refuses THEN THE guard SHALL announce
  that CI was not asked and allow; a body SHALL prove the announcement
  is a discrimination by running once with `gh` reachable and once with
  it shadowed.
- THE two facts SHALL be read with argv arrays and no shell, from
  `gh run list --json` and `gh run view --json`, and the parsing SHALL
  refuse rather than guess on an unexpected shape.
- THE spec SHALL drive the wired hook through the command
  `.claude/settings.json` registers, not a path the spec typed (the
  push-guard spec's own existing shape).
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

T-203 (the token gate this extends), T-216 (the rooting), the CONVENTIONS
bullets *A PUSH CANCELS THE RUNNING CI JOB* and *AND THEN READ IT*, the
09-01 records (the five red hours), and docs/rooms/loop-efficiency.md
item 10.

## DISPATCH, 2026-09-02 — the stamp, and what the audit found

**Audit (orchestrator 5b)**: `.claude/hooks/push-guard.mjs` at 37ac590
contains no `gh` call and no notion of a run's state — the claim holds.
The instance is measured: four runs superseded on 2026-09-01, and this
sitting held two pushes by hand to let runs finish. Fence as filed: the
hook and its spec; two lanes are live (T-225, T-229) and neither holds
either file. **Holder**: this lane does NOT hold the integration
checkout and does not merge; it stamps `verifying`, reports
ready-to-merge with branch and tip, and leaves its worktree standing.
Size S, guard-class, review independent: executor, then verifier.

## Implementation notes

**WHAT LANDED.** `.claude/hooks/push-guard.mjs` gains a FOURTH arm — the
first in this file that asks a machine which is not this one — and
`tools/e2e/tests/push-guard.spec.ts` gains 15 bodies that drive it
through the command `.claude/settings.json` registers. The arm sits
AFTER every local arm and BEFORE the graph check: a push already refused
for a dangling `blocked_by` or an unmeasured tree spends no network round
trip, and a body measures that ordering rather than asserting it in a
comment. Its announcements are NOTICES rather than returns, so a red CI
reaches the seat even when the graph arm then refuses — the two facts are
about different machines.

    IN FLIGHT              -> REFUSE  `ci-run-in-flight`
    A VERDICT OF `failure` -> ANNOUNCE, never refuse
    `gh` UNASKABLE         -> ANNOUNCE and ALLOW, in four distinct words
    AN UNREADABLE ANSWER   -> REFUSE  `ci-unreadable`

**FOUR FACTS ABOUT `gh` THAT THE OBVIOUS CODE GETS WRONG**, each measured
against this repository's real remote on 2026-09-02 and each pinned by a
body, because every one of them produces a guard that looks right and is
silently useless:

1. **A running run's `conclusion` is the EMPTY STRING**, not `null` and
   not absent. A shape check demanding a NON-EMPTY string would reject
   every live run — and under this arm's refuse-on-unreadable rule that
   converts the offline ALLOW into a hard block on exactly the state the
   arm exists to catch. `required` therefore means present-and-a-string.
2. **`updatedAt` is not a clock.** Run 33577276465 read `updatedAt`
   00:55:14 while still genuinely running at 01:02:13Z. The elapsed time
   comes from `startedAt`, falling back to `createdAt`; `updatedAt` is
   not even asked for, and a body pins its absence from the field list.
3. **`.github/workflows/ci.yml` sets `cancel-in-progress: true`**, so
   `cancelled` outnumbers `failure` about two to one over the last sixty
   runs. THE NEWEST COMPLETED RUN IS USUALLY A RUN THAT REACHED NOTHING.
   An arm reading `runs.find(completed)` would have been silent through
   this card's own instance — the five red hours of 2026-09-01 sat behind
   a stack of superseded cancellations. `newestVerdictRun` skips them and
   reports HOW MANY it skipped, because that count is the batching rule's
   own footprint.
4. **`gh`'s exit 1 is overloaded** across a misspelled `--json` field, an
   HTTP 401, a 404, no GitHub remote and a dead network — so *"non-zero
   means CI could not be asked"* relabels this guard's own bugs as being
   offline. `classifyGhFailure` names `absent` (ENOENT with a null
   status — never 127, which needs a shell), `unauthenticated` (exit 4)
   and `no-github-remote` (`gh`'s own phrase), and DISCLOSES everything
   else as unrecognised, saying out loud that the cause may be this
   guard's own arguments and printing the exact command it sent. All four
   still ALLOW.

These four were handed to this lane mid-build by the dispatching seat as
measured tree facts. Two of them (1 and 3) contradicted code that was
already written and green, which is worth recording: the arm's first
draft read the newest COMPLETED run, and its first draft's field-type
loop would have been one keystroke from rejecting every live run.

**THE ACKNOWLEDGEMENT IS NOT AN OVERRIDE FLAG.** This file refuses those
twice over and both refusals stand. `NPUTER_CANCEL_CI=<run id>` — an
environment prefix on the push's own segment, before the word `git`, or
this hook's own environment — is a claim about ONE RUN, checked against
the id the remote just handed back. A value left in a shell cannot
outlive the run it was for, because the next run has a different id. It
retires the REFUSAL only: a seat that cancels knowingly still hears what
the last completed run said.

**THE PACKAGE MAP IS DERIVED, NEVER TYPED.** `gh`'s
`jobs[].steps[].name` is the workflow's own `name:` verbatim, and the
workflow puts each step's package in its `working-directory:`. So the arm
READS `.github/workflows/ci.yml` from the checkout being pushed. A body
pins four of this repository's real steps through that scanner
(`e2e lane` → tools/e2e, `app suite` → app, `parser build` → lib/parser,
the cargo suite → app/src-tauri) and asserts each directory exists. The
reach question is answered against the FAILED RUN'S OWN `headSha`, which
is what makes it answerable with no guess about upstreams or tracking
refs — and a sha this checkout does not have is declared unknown rather
than answered.

**FOR THE VERIFIER, THE THINGS I WOULD ATTACK FIRST.**

- *The fail-closed exception.* `ci-unreadable` is the one refusal in this
  arm that is not about a running run. It is deliberate and argued, and
  it is also the arm's biggest blast radius: a `gh` upgrade that changes
  a field's TYPE refuses every push until somebody edits this file. The
  bound is that only three fields are load-bearing
  (`status`, `conclusion`, `databaseId`) and everything else degrades to
  a missing phrase. Ask whether those three are the right three.
- *The `success`-with-skipped-runs silence.* When the last verdict is
  green but cancellations sit in front of it, the arm says nothing. That
  is this file's "an ordinary allow is silent" rule applied, and it
  throws away a real signal (you superseded N runs). I argued it both
  ways and chose silence; it is the judgement call in this diff I am
  least certain of.
- *The whitespace scanner's cost, now higher again.* `gitInvocations`
  treats any segment carrying `git` then `push` as a push, so `echo git
  push` now also costs a network round trip. The scanner is a landed
  guard's and out of this card's fence, but the cost moved.
- *`ACTIVE_RUN_STATUSES` is a named list rather than `!== "completed"`.*
  A future GitHub status meaning "running" that is not on the list goes
  unrefused. I chose that direction because the negated test over-refuses
  and over-refusal is what gets guards disabled — but it is a choice, and
  the announcement for an unrecognised status is the mitigation.

**WHAT THE SECURITY SWEEP FOUND.** No shell anywhere in the arm's path;
all five `spawnSync` sites in the file take a literal program name and an
argv array, and `shell:` appears nowhere. `gh` is resolved off PATH BY
NAME, never out of the judged tree. No secret is placed in argv — `gh`
holds its own credential and this file never reads, names or forwards
one (the environment is inherited so that `gh`'s existing auth keeps
working, and three variables are pinned to keep it non-interactive:
`GH_PAGER`, `GH_PROMPT_DISABLED`, `NO_COLOR`). **The sweep found one real
hole and it is fixed in this diff**: `headSha` is the single value the arm
takes off the wire and hands to a second binary, and an argv array does
NOT stop `git`'s own parser reading a leading `-` as an option — a
`headSha` of `--output=<path>` would have been a flag. `pathsSince` now
shape-checks it (`/^[0-9a-f]{7,64}$/`) and appends `--`, a body drives the
hostile value through the wired hook and asserts the file was never
written, and a positive control shows a genuine sha still answers. The
residual, named rather than dismissed: `gh` reads the checkout's own
remotes to decide which GitHub repository to contact, so a checkout the
seat pointed this guard at chooses the host — the same rooting surface
`runCheck` already documents, with the same answer (a seat that can write
`cd <x> && git push` can run `gh` in `<x>` directly).

**THE CLASS AND THE SWEEP.** Class: *a value taken from outside the
calling file and handed to another program as a positional argument that
program may read as an OPTION* — and the argv array is not what prevents
it, since no shell is involved either way. Sweep, run at this lane's tip
and read by hand:

    git grep -nE 'spawnSync\("(git|cargo|gh)"' -- .claude tools/e2e/scripts

Twelve sites, exit 0. **The zero was not the answer and the sweep was
shown able to find something** — the same query relaxed to `spawnSync\(`
returns 5 in `push-guard.mjs` alone. Ten of the twelve pass only values
their own file constructed. **Two are genuine siblings and both are
OUTSIDE this card's fence**, so they are routed as T-237-s5 rather than
edited: `tools/e2e/scripts/card-preflight.mjs`'s `refResolves` reaches
`git rev-parse --verify --quiet ${hash}^{commit}` with a `hash` that
came out of a CARD's frontmatter, and `dispatch-brief.mjs`'s
`resolveIntegrationRef` has the same spelling with an internally-built
`rev`. **Their severity is lower and the card says so**: `git rev-parse`
publishes no write-capable option, so a dash-leading value there buys a
wrong boolean rather than a file written somewhere nobody chose.

**WHAT I DID NOT DO, AND WHY.** Five findings are filed as
`status: suggested` rather than built: T-237-s1 (the two CONVENTIONS
bullets are now enforced and neither says so — out of fence),
T-237-s2 (`timed_out` and `startup_failure` reach no announcement),
T-237-s3 (workflow-parity owes a keeper over the step→package map the
guard now depends on — out of fence), T-237-s4 (the timeout is a round
number nobody measured, and the two `gh` calls are serial), and
T-237-s5 (the two siblings the security sweep found, both out of fence).

**THE CENSUS IS STALE AND IS REPORTED, NOT REGENERATED.**
`npm run capabilities:check` exits 1 — committed 45968 bytes, a fresh
generation 47134 — because this lane adds test names. Since T-210 a
lane's fence leaves docs/CAPABILITIES.md read-only and the regeneration
is the INTEGRATOR's, in the merge commit, before the checkpoint
(docs/CONVENTIONS.md, the capabilities bullet; T-201).
