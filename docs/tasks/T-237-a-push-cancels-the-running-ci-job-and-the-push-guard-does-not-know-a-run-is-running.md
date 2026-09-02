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

### The poison drills — 17 mutants, 16 killed, one survivor recorded

Every mutation edits the CODE UNDER TEST and never an assertion, and
never a literal the two share. All were run in a DETACHED scratch
worktree at a named commit, the mutated text was READ BACK with
`git diff` before each suite (T-078: a substitution count is not evidence
that the text changed the way it was meant to), and every restoration is
proved by sha256 against that commit — `git restore --source=<commit>
--staged --worktree`, never a bare `git checkout --` (T-092-s4).

Batch one, 15 mutants at `e2572ee`, hook sha256
`22a855d1eb85271c92aacd464f56e7a62a005a4be8f058bfcc33a9410544e104`,
restored to that hash 15 times out of 15. Baseline before the batch:
71 passed, exit 0.

| mutant | the property it removes | kill set |
|---|---|---|
| M1 `ACTIVE_RUN_STATUSES` -> `[]` | no status means a run is running | 6 |
| M2 `NON_VERDICT_CONCLUSIONS` -> `[""]` (DATA mutant) | a cancellation counts as a verdict | 1 |
| M3 the array-shape guard is never taken | an answer that is not an array is accepted | 1 |
| M4 a non-empty test on `conclusion` | a running run is called unreadable | 4 |
| M5 `acknowledgedRunIds` -> `[]` | no push ever acknowledges a run | 1 |
| M6 `classifyGhFailure` -> always `absent` | gh's four inabilities collapse into one | 1 |
| M7 `stepWorkingDirectory` -> `undefined` | a failing step is never placed | 3 |
| M8 `reachesPackage` -> `true` | every push reaches every package | 2 |
| M9 the announcement fires on `success` | a red is never announced | 3 |
| M10 the skip loop's `continue` removed (algorithm site) | the search stops at the newest COMPLETED run | 1 |
| M11 `runStartedAt` -> `createdAt` | the run's own start is ignored | 1 |
| M12 the branch quoted into one word | argv stops being argv | 2 |
| M13 the CI arm moved ahead of the local arms | ordering | 1 |
| M14 `elapsedSince` -> a constant | the clock stops mattering | 1 |
| M15 the gh-failure arm is never taken | an unaskable CI stops being an allow | 3 |

Batch two, at `99349db` (the commit carrying the security fix), hook
sha256 `dcf7adb1557648ad7430e15ca863645d95e13af110ca40c8fd04886da68c2a3e`,
restored to that hash 3 times out of 3:

| mutant | the property it removes | kill set |
|---|---|---|
| M16 the sha shape check accepts anything | a hostile `headSha` reaches `git` | 1 |
| M17 the trailing `--` removed | the revision list is left open | **0 — SURVIVED** |

**THE SURVIVOR IS REPORTED RATHER THAN PAPERED OVER, AND IT IS NOT A
MISSING ASSERTION.** `--` in `git diff --name-only <sha> HEAD --` is
belt-and-braces behind the shape check: once `sha` is proven to match
`/^[0-9a-f]{7,64}$/`, nothing can reach that argument list that the `--`
would have to stop, so no observable behaviour distinguishes its presence
from its absence and no body can. The two honest responses are to delete
it or to keep it and say it is unkilled; **it is kept**, because a second
bound that costs nothing is worth more than a tidy kill rate, and because
if a later card widens the shape check the `--` is the bound still
standing. Killing it would need a shimmed `git` recording its argv, which
is machinery bought for a redundant guard.

**KILL-SET CONTAINMENT.** Every kill set contains the bodies that own the
mutated property, and the wider ones are wider for a reason worth
reading. M1's six include `gh` absent's own control and the ordering body
— removing every active status means no fixture ever refuses, so the
controls that depend on a refusal go with it. M9's three include *the
same push lands once that run is completed*, the positive control:
moving the announcement onto `success` makes a green push speak, which is
exactly what that control exists to notice. M15's three reach an OLDER
body, *no cargo at all allows the push*, because a fixture with no `gh`
on PATH stops being an allow at all.

### The two reds in the e2e lane, attributed — neither is this diff's

The full lane at this lane's tip: **561 passed / 2 failed**, both in
`tools/e2e/tests/session-economics.spec.ts`. The same lane run in this
worktree earlier the same sitting, before these two lanes existed on the
machine, was **563 passed / 0 failed, exit 0**.

Both failures carry one message:

    T-236-s5 holds a worktree on refs/heads/task/T-236-s5-row-four-reads-by-label
    and no live card declares that id

**THIS IS RULE 4's OWN NAMED COLLISION, NOT A DEFECT.** The check joins a
MACHINE-scoped list (`git worktree list`) to a CHECKOUT-scoped one (the
cards in the tree it is pointed at) — the shape `method/lane-protocol.md`
rule 4 records as reddening *"in every older lane the moment a newer lane
was cut"*, and docs/STATE.md names with two prior instances (T-143-s1,
T-187). Measured here rather than assumed:

* `docs/tasks/…T-236-s5….md` is ABSENT at this lane's base `977697b`,
  ABSENT at its tip, and PRESENT on `main` — added by `69a8477`, a
  dispatch commit that landed after this lane was cut.
* So the card set this check reads is IDENTICAL at this lane's base and
  at its tip for the id it complains about: the two bodies red the same
  way over a tree carrying none of this card's work.
* This diff's merge forecast touches `.claude/hooks/push-guard.mjs`,
  `tools/e2e/tests/push-guard.spec.ts` and six `docs/tasks/T-237*` files
  and nothing else — nothing `session-economics.spec.ts` reads.
* RE-RUN ALONE, as docs/STATE.md requires before attributing: **2 failed
  / 8 passed** in 3.3s, so it is the environment and not a
  timing correlate of a full run.

The remedy is outside this fence and is the integrator's by construction:
the merge tree carries `main`'s cards, T-236-s5 included, so the join has
both halves again. **A lane cannot fix this and must not try** — the card
it would have to add belongs to another lane.

## VERDICT

**APPROVED** — 2026-09-02, verifier `claude-opus-5@subagent`, judged at
`d0f04dce9cdb9b3b25c07686bc8975e6e275e419` over `99349db` and `e2572ee`,
base `977697b`. Bench `/Users/ujju/Projects/nputer-V-T-237`, installed in
CONVENTIONS' fresh-clone ORDER, `NPUTER_E2E_PORT=25237`. **Every figure
below was re-derived in that bench at `d0f04dc`; none is relayed.**

### The blindness was CLOCK-SHAPED, and the brief kept its own line

Phase 1 reached this seat with the lane rather than after it. There was
no branch, no tip, no diff and no notes in existence when the attack set
was written — so this is orchestrator 5c's preferred shape and not a
discipline I kept (verifier.md: *"say in your verdict which of the two you
had"*).

Stamped before the phase-2 message arrived, `2026-09-02T01:09:41Z`:

    sha256 4bcd19182b4ca35904a9732b72168146cfdc9e01f2b8d60170d5000bd376ac58  attack-V-T-237.md
    sha256 1fcd7728d11f504839f6169bde84523ea721543a7d3ce361388ebd9fa8238028  ground-V-T-237.md

**The phase-2 brief did carry executor-derived specifics** — mutant
counts, suite figures, the survivor. It arrived AFTER those hashes, which
is the shape the role asks for and the reason the separation is auditable
rather than asserted. Everything it named I re-measured; where it was
right I say so below, and the figures are mine.

### The ground truth held, and the implementation met it independently

Six platform facts were measured at the base ref before any code existed,
and each is one the obvious implementation gets wrong. All six are
handled, and `push-guard.mjs`'s new header reaches several of them in the
same words — convergence, not copying, since neither party could read the
other:

| pre-committed fact | measured at base | at `d0f04dc` |
|---|---|---|
| `conclusion` is `""`, not `null`, on a running run | live run 33577276465 | `RUN_LIST_REQUIRED_FIELDS` means present-and-a-string; a `null` refuses `ci-unreadable`, `""` is read |
| `updatedAt` is not a clock (`updatedAt` 3s old on a 7m02s run) | 33577276465 at `01:02:13Z` | `updatedAt` is not even requested; `runStartedAt` is `startedAt` then `createdAt` |
| `cancelled` outnumbers `failure` 21:11 of 60 | `gh run list --limit 60` | `newestVerdictRun` skips them and COUNTS the skips |
| absent `gh` under `spawnSync` is `status:null`/`ENOENT`, never 127 | probe A/B/C | `classifyGhFailure` reads `spawnError === "ENOENT"`; no shell exists to produce 127 |
| exit 1 is overloaded across the guard's OWN bug, 401, 404, offline | probe E/F/G2/H/K | the `unrecognised` arm quotes gh's stderr VERBATIM and says *"THAT EXIT CODE MAY BE THIS GUARD'S OWN MISTAKE"* with the exact command |
| real `gh` in a fixture with a bare `origin` exits 1 — so a "reachable" control armed by the real binary is DEGENERATE | probe I | every fixture carries a `gh` shim; the absent half writes NO shim AND narrows PATH, and the spec's own header records the same measurement |

**My pre-commitment #1 was that criterion 3's discrimination would be
degenerate.** It is not. `fixturePath` narrows PATH to the fixture's `bin`
plus a `gitonly` directory *and* the absent fixture writes no shim — the
comment records that the first draft had only the second half and that a
probe found the shim's exit 99 being read as *"a `gh` that answered"*.
That is the T-229 defect caught by the lane on itself, which is the only
thing that has ever caught it.

### What I ran

    lib/parser   npx vitest run              349 passed / 16 files
    app          npm test                   1131 passed / 50 files
    tools/e2e    push-guard.spec.ts           71 passed  (1.2m)
    tools/e2e    npm test                    561 passed, 2 failed (9.0m)
    app/src-tauri  index --check             exit 0 — CURRENT
    tools/e2e    capabilities:check          exit 1 — STALE, 45968 → 47134 bytes

`capabilities:check` STALE is OWED and correct: the lane added fifteen
test names and its fence leaves `docs/CAPABILITIES.md` read-only, so the
regeneration is the integrator's in the merge commit (CONVENTIONS, the
`npm run capabilities` bullet). The lane reported it rather than reaching
for it.

### The two reds are NOT this diff, and I did not take that on trust

`session-economics.spec.ts:179` and `:365` fail because a live worktree on
`refs/heads/task/T-236-s5-…` exists on this machine while T-236-s5's card
is absent from this tree. **I checked out the card's own base `977697b` in
this bench and ran the same file: 2 failed / 8 passed, the same two
bodies.** They fail with none of this diff present. The card is on
`origin/main` and absent from both `977697b` and `d0f04dc` — a lane cut
after this lane's base, which is STATE's named ref skew, and it clears at
the merge.

### The attack set, run

Everything below was driven through the real `push-guard-hook.mjs` over
fixtures this seat built, independently of the suite:

* **The two calls are scoped separately.** A live run plus an older
  `failure`: refuses `ci-run-in-flight` AND announces the red with its
  skipped-count and failing step. With `gh run view` answering 404, the
  refusal survives intact and only the step sentence degrades — the
  downgrade-a-refusal-into-an-announcement shape does not occur.
* **The acknowledgement is not an override flag.** `""`, `0`, `false`,
  `90011` and `'9001'` all still refuse; only the run's own id (trimmed)
  acknowledges. With `NPUTER_CANCEL_CI=9001` set and a STALE graph, the
  push is still refused `graph-stale` and the cancellation is still
  announced — the hatch retires one refusal and nothing else.
* **The parse refuses on shape and never guesses.** `conclusion: null`,
  an object where an array was asked for, non-JSON, a missing
  `databaseId` — each refuses with its own sentence naming the field.
  `[]` allows silently; an empty `conclusion` is read.
* **A hostile branch name arrives as ONE argv element.** Driven with
  `task/T-9;touch$(pwd)/PWNED;` plus a backtick, `&` and `|` through the
  real runner: the shim recorded it unexpanded as a single argument and
  no `PWNED` was created anywhere.
* **The reach sentence discriminates both ways** in one fixture: a
  failing `e2e lane` reads *"DOES change anything under it — you are
  pushing a fix"*, a failing `parser suite` reads *"does NOT … — main is
  red under work that is not this"*. A `headSha` the checkout does not
  have is declared UNKNOWN rather than guessed.
* **The cost claim holds.** A push refused for a missing token spends
  **zero** `gh` invocations; a command that is not a push spends zero.
* **T-216's rooting reached the new arm intact.** `git -C <root> push`
  and `cd <root> && git push` driven from `/tmp` both ask about the
  JUDGED root's branch, not the writer's.

### Poison drill — my own mutants, landings read from `git diff`

Three data-adjacent mutants at sites my stamped attack set named, each
reverted after:

| mutant | landing | killed |
|---|---|---|
| drop `"queued"` from `ACTIVE_RUN_STATUSES` | one line removed | the acknowledgement body; the unrecognised-status body |
| `runStartedAt` returns `run.createdAt` unconditionally | one-for-one swap | the elapsed body, alone |
| drop `"cancelled"` from `NON_VERDICT_CONCLUSIONS` | one-for-one swap | the cancellations body, alone |

**No kill set contains another**, and each died at the site its property
lives — the aiming test, not the accounting one. The lane's disclosed
survivor (the trailing `--` on `git diff`) is honest: `pathsSince`
shape-checks the sha against `/^[0-9a-f]{7,64}$/` BEFORE the spawn, so no
value reaching that argv can begin with `-` and the `--` cannot change an
answer. A survivor whose unreachability is proved by another line is a
survivor worth keeping.

### Security sweep — no findings

Five `spawnSync` sites (`cargo`, node + `push-checks.mjs`, `gh`,
`git diff`, `git status`), every one an argv array. **No `shell:`, no
`sh -c`, no template-literal command anywhere in the file.** `gh` is
resolved off PATH by name — the same policy `cargo` and `git` already
have here, and the header widens the threat model by exactly one binary
in writing, naming the residual (a checkout supplies the remotes that
decide which host is contacted) rather than dismissing it. No credential
is read, named or forwarded; the env handed to `gh` sets only `GH_PAGER`,
`GH_PROMPT_DISABLED` and `NO_COLOR`. No dependency was added — the
imports are still node builtins plus the three sibling hooks, so the
ninety-second-old lane worktree still runs it. The sweep's own finding
(`headSha` reaching `git diff` as a bare revision where a leading `-`
would be an option) was found by the lane, fixed with the shape check,
and driven hostilely; its two out-of-fence siblings are filed as
`T-237-s5`, which is the right place for them.

### Fence and criteria

The diff touches `.claude/hooks/push-guard.mjs`,
`tools/e2e/tests/push-guard.spec.ts` and `docs/tasks/` only — inside the
fence, with no new module smuggled outside it. Criterion 5 is met by
`runWiredHook`, which reads the `Bash` matcher's command out of
`.claude/settings.json` and runs it, rather than by the typed-path
`runHook` that sits beside it.

### One finding, filed and not folded in

`T-237-s6`: the CI arm derives its branch from HEAD, so a refspec push
onto `main` from a lane checkout is asked about the lane's branch and
allowed in silence — measured here with a control, both halves through
the real runner. It fails OPEN, which is the pre-guard state this file's
own `gitInvocations` header already prices beside its alias and `eval`
holes; the spelling appears nowhere in `docs/` or `method/`; and the
dominant path is covered and proven. So it is a follow-up card and, per
verifier.md 6, it does not qualify this verdict. What is genuinely
missing is the DISCLOSURE, in a file whose method is declared limits —
the *WHICH BRANCH* section argues the choice well and does not name its
residual.

Two smaller notes, neither blocking and neither filed: the header still
says *"This file began as one guard and now carries three"* while it now
carries four, and a runner-generated step (`Set up job`, absent from
`ci.yml` entirely) is described as a step `ci.yml` gives no
`working-directory` — true about `ci.yml`, and an inference about a step
that is not in it.

### The gates this verdict's own commit could move

Re-run at MY tip, not at the commit I was sent (verifier.md 7). The docs
gate, asked with the two literal paths this verdict writes, FIRED and
named three suites owed — it also answered *"every live task card's
frontmatter parses, with a legal status"*, which is the half that would
have caught a malformed verdict card. Paid at this commit:

    lib/parser   npx vitest run                         349 passed
    app          npm test                              1131 passed
    tools/e2e    card-preflight + brief + card-figures
                 + docs-input-gate                      137 passed
    tools/e2e    landing-gate + push-checks
                 + shell-frame + window-contract          46 passed
    tools/e2e    push-guard.spec.ts                       71 passed

All green, and the parser and app figures are unchanged from `d0f04dc` —
this verdict's prose moved nothing it is read by.
