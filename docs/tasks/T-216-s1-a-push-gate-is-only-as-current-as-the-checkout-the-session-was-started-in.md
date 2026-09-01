---
id: T-216-s1
title: A push gate is only as current as the checkout the SESSION was started in — an absent hook cannot announce itself, so the catcher has to live where the guard is not
feature: F-06
milestone: 4
priority: 1
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-216
blocked_by: []
touches: [.claude, tools/e2e, .github]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**FOUND ON T-216'S CARD, NOT BUILT THERE — and the split is that card's
own argued ruling.** T-216 fixes which TREE the push guard judges. This is
the other half of "the guard is a function of the wrong checkout": which
COPY of it ran, and whether one ran at all.

**Class parent: none — T-216 is the SIBLING it split from, not its
parent.** Disposition hint: promote, and dispatch it to a seat that can
touch the dispatch ritual or CI, because the fence above is almost
certainly wrong for the real remedy.

## The measured instance is on T-216's card

At the integration seat on 2026-09-01, hours after `T-203` landed the push
gate: the dispatching session's project directory was a git worktree at
`4ec229c`, hundreds of commits behind, whose `.claude/settings.json`
registers only the lane-fence hook and which carries no
`push-guard-hook.mjs` at all. **The guard never ran, across an entire
sitting of pushes.** Driven by hand it was correct in both checkouts;
nothing invoked it. What saved the tree was the habit of running
`gate-run --all` by eye — the exact substitute the guard exists to
replace.

## Why T-216 could not build this, argued rather than asserted

The candidate remedy offered on that card — *the guard announces its own
provenance* — **cannot reach its own motivating instance**, and T-216's
blind verifier reached the same conclusion independently from the
contract:

- A **stale** guard RUNS, so it can announce.
- An **absent** guard runs NOTHING, and ABSENT is the half that was
  measured.

Any announcement added to `push-guard.mjs` is emitted only by checkouts
that already carry it — exactly the checkouts that do not need it. Shipped
inside T-216 it would have been a keeper structurally incapable of failing
on the instance it was written for, which is `NORTH_STAR`'s known-vacuous
keeper and the class `T-229` exists to name.

**So the catcher must run where the guard is not**: at arm/dispatch time
(the seat that cuts a session comparing that session's project checkout
against the integration branch), in CI, or in the settings registration
itself. That is a different mechanism from a `PreToolUse` decision module,
which is why this is a card and not a paragraph in T-216's diff.

## The trap any implementation inherits

**An ancestry test is answerable from a stale WORKTREE only because a
worktree SHARES REFS.** From the session worktree at `4ec229c`, `main`
resolves to whatever the integration branch currently points at — a commit
its own HEAD does not contain. **In a stale CLONE the same query consults a
stale `main` and answers wrongly**, which is the guard asking the stale
thing whether it is stale. State that limit or inherit it silently.

*(The card was filed naming a specific value for that resolution. It has
moved twice since and is not restated here: **a ref is a figure and goes
stale like one**, which is the same correction T-216 itself took for a
line number.)*

### AND ANCESTRY IS NOT MERELY LIMITED — IT IS THE WRONG QUESTION

Added by the dispatch audit, 2026-09-01, measured at `06ca1c5`:

    git merge-base --is-ancestor 4ec229c 06ca1c5   -> YES, ancestor
    git rev-list --count 4ec229c..06ca1c5          -> 344

*(Both rows said `main` when written and the count read 344. `main` has
moved repeatedly since — re-derive with
`git rev-list --count 4ec229c..main`. **Third instance of one defect on
one card** — the criterion, the amendment's demonstration table, and this
audit block, each written by the seat that had just corrected the
previous one. Pinned to the sha the line already named.)*

*(**And a FOURTH, of a different kind.** This parenthetical originally
ended "moved five times since, to 348." That was true when measured at
`87b134d~1` and false at `87b134d`, the commit that shipped it — **the
delta being exactly the commit carrying the sentence.** Pinning cannot
repair it, because pinning is a commit. The rule the first three taught,
"a figure carries its ref", does not reach this case; the stronger form
now lives in `docs/CONVENTIONS.md` beside A LINE NUMBER IS A FIGURE. The
repair above asserts no value, so there is nothing left to falsify.)*

**The motivating checkout PASSES an ancestry test.** Being an ancestor of
the tip is not a defect a stale checkout has — it is the definition of
one. A catcher built on *"is this HEAD reachable from the integration
tip?"* would have answered **fine** for the exact session whose pushes went
ungated all sitting, and would have been another keeper incapable of
failing on its own motivating instance — the second time that trap has
been laid on this card's subject.

**Whatever the mechanism asks, it cannot be reachability alone.**
DISTANCE, or the registration itself, or the hook file's presence — the
card does not prescribe which, but it now forbids the one that measurably
does not work.

## What a first cut might ask

Not prescribed — the mechanism is the card's to choose:

- Does the checkout a session's `.claude/settings.json` was loaded from
  register every hook the integration branch registers?
- How FAR is that checkout's HEAD from the integration tip, asked
  somewhere the answer cannot come from the stale side? (Not *is it
  reachable* — the audit above measures that question answering "fine"
  for the motivating instance.)
- Where the answer is no, is it LOUD — at arm time, before the sitting,
  rather than at the push it failed to guard?

## Amendment, 2026-09-01, after dispatch — two corrections to the criteria below

**A FIGURE WENT STALE INSIDE THE CRITERION ADDED TO FORBID STALE FIGURES.**
The reachability criterion was written naming a literal distance:

    git rev-list --count 4ec229c..06ca1c5  -> 344   (fixed sha: stable)

**The typed number was already wrong against a moving symbol**, and it is
now DERIVED in the criterion rather than stated. **A figure in an
acceptance criterion is a figure like any other: it carries its ref or it
goes.** This is T-216's own line-number correction, re-earned one card
later by the seat that wrote it.

**AND THE TABLE THAT DEMONSTRATED IT CONTAINED A ROW WITH NO REF, WHICH
DECAYED WHILE THIS CARD WAS BEING WRITTEN.** The original table carried a
`4ec229c..main` row. It read 346 when written, 347 when the verifier
re-stamped it, and 348 an hour later — because `main` moves with every
commit this dispatch itself makes. The rows anchored to a fixed sha never
moved. **The row is deleted rather than re-pinned**: it measured nothing
the stable rows do not, and a demonstration of "carry your ref" that has
to be re-pinned to stay true is making the opposite point.

**A CATCHER NOTHING INVOKES SATISFIED EVERY CRITERION.** A blind phase-1
attack set, written before any implementation existed, found that criteria
1, 2 and 4 all pass against a correct catcher that is never called. The
card had no criterion requiring it to be WIRED; there is now one.

Also corrected: the reachability bullet is the **fourth** criterion. Both
dispatch briefs called it the fifth, counting past `Verification:
headless`.

**AND A MEASURED FACT THE CARD DID NOT HAVE — "REGISTERED" IS NOT A PROXY
FOR "RUNS".** This is a NOTE and deliberately not a sixth criterion; the
card is size S and has already grown once. Judge the built catcher against
it anyway.

There are TWO ways a checkout can fail to consult the guard, and from
outside they are indistinguishable:

    A. no Bash matcher registered at all      -> nothing is invoked
    B. matcher registered, hook FILE absent   -> node starts, exits 1

Measured at the integration seat, `CLAUDE_PROJECT_DIR` resolving correctly
and only the `.mjs` missing — **one fault, not two**:

    exit = 1  ("cannot find module")

**THE PORTABLE HALF IS THE EXIT CODE: 1 IS NOT 2, SO THE HARNESS DOES NOT
BLOCK.** That is what the argument rests on and it is independent of path,
platform and node version. The stderr byte count is NOT portable and is
deliberately not quoted here as a bare number — it is
`701 + len(path)` on node v22.22.0, exact at four path lengths and
re-derived independently at three. Two seats measured 881 and 761 and both
were right, at paths of 180 and 60 characters. **A byte count carries its
path the way a figure carries its ref.**

**Arm B fails open while looking fully configured.** A catcher that reads
`.claude/settings.json` and finds the registration present would pass a
checkout in arm B. The measured motivating instance is arm A; **arm B is
the one that survives an inspection of the registration.**

*(Letters are local to this note. The verification's own ground truth
labels these arms differently — this note's arm B is that document's arm
C. **Map by description, never by letter.**)*

`docs/CONVENTIONS.md` currently asserts this shape needs two faults at
once and that the process never starts. Both are false, and that document
defect is routed as **T-232** rather than folded in here.

## Acceptance criteria

- A body SHALL demonstrate the measured instance: a checkout registering
  no `Bash` matcher, a push made from it, and the fact that no guard was
  consulted established mechanically rather than by absence of output.
- The catcher SHALL be shown to fire from OUTSIDE the stale checkout —
  a control that only works when the stale checkout cooperates is the
  defect restated.
- WHERE an ancestry query is used, the stale-clone limit SHALL be stated
  in the artifact, not only in this card.
- The catcher SHALL NOT rest on reachability alone. A check that passes
  for a HEAD which is an ancestor of the integration tip SHALL be shown
  to REFUSE the motivating instance, whose HEAD is an ancestor of the
  tip and hundreds of commits behind it. **The distance SHALL be DERIVED
  at the ref under test and never typed**, because a distance measured
  against a moving symbol is stale before it is read. A test asserting
  only "an unreachable HEAD is caught" is degenerate against this card
  and SHALL be treated as absent.
- The catcher SHALL be WIRED, not merely present. A body SHALL establish
  that the ordinary act it guards — cutting a session, opening a sitting,
  running CI — actually INVOKES it, and SHALL fail if the catcher is
  removed from that path while its own file remains. A correct catcher
  that nothing calls satisfies every criterion above and is the exact
  defect this card exists to end.
- Verification: headless.

## Implementation notes

*(executor, 2026-09-01. **The heading is BARE on purpose.** The parser
matches this section on the exact key `implementation notes`, so a
parenthetical in the HEADING makes `splitSections` drop everything under
it and `app/src/lib/task-detail.ts` renders nothing — measured by the
verifier as `implementationNotes: DROPPED`. A `##` heading on a card is a
code input; the date goes in the body. The parenthetical form is live on
many cards and that class is filed separately, not here.)*

Built at `task/T-216-s1-stale-checkout-catcher`. Card read at `87b134d`
(the third amendment); the lane's copy of this file was brought forward
to that text before the stamp, so the merge carries the amendments rather
than reverting them.

### The mechanism, and the three arms

`tools/e2e/scripts/checkout-currency.mjs` — a decision module plus a CLI,
side-effect-free on import (`process.argv[1]` guard, `process.exitCode`
never `process.exit`, per `brief-flush.spec.ts`'s standing sweep).

It judges a TARGET checkout from a VANTAGE that is not it. **Both
defaults are the whole construction**: the vantage is the checkout the
module's own file lives in (`import.meta.url`, never `process.cwd()`),
and the target is `CLAUDE_PROJECT_DIR` — the checkout whose settings the
harness loaded. In the measured instance those were two different
checkouts.

    registration-missing   an (event, matcher, script) main registers and
                           the target does not                    [arm A]
    hook-absent            a script main registers that is not on the
                           target's DISK                          [arm B]
    guard-surface-behind   the newest main commit touching `.claude` is
                           NOT contained in the target's HEAD

The third arm is the one that is **not reachability**. The trap is
`is-ancestor <targetHead> <tip>`, which answers YES for every stale
checkout because that is what stale MEANS. This asks the opposite
containment over a different commit, and a raw commit COUNT is
deliberately not a refusal basis — it would red every live lane and teach
the project to ignore the tool. The distance is reported as a figure.

Three verdicts, never two: `current` / `stale` / `unknown`, exiting
0 / 1 / 3. A question that could not be asked is `unanswered` and never
rounded down.

### Where it is wired (criterion 5)

`brief.mjs`'s `--preflight` and `--write-fence` arms — the dispatch
ritual's two arming steps — run it BEFORE the card is looked up, so a
dispatch that fails for any other reason has still been told. A `stale`
verdict joins `findings` and the dispatch answers 1. **An UNDECLARED
`CLAUDE_PROJECT_DIR` is UNANSWERED and charges nobody**: an earlier draft
fell back to the command's working directory and reported a scratch
FIXTURE as a stale session checkout, redding
`card-preflight.spec.ts:705`. That regression is the reason the arm now
refuses to guess a target.

### The live measurement, this machine, 2026-09-01, vantage `<lane>`

    /Users/ujju/Projects/nputer           CURRENT   0 behind
    /Users/ujju/Projects/V-216-s1         CURRENT   1 behind
    /Users/ujju/Projects/nputer-app       STALE   438 behind, arms A+B
    /private/tmp/nd-T-140-s4              STALE   414 behind, arms A+B
    /Users/ujju/Projects/arch-verify      STALE   907 behind, no settings

Two of those are the motivating instance's exact shape — a `Bash` matcher
absent and no `push-guard-hook.mjs` — in live checkouts on this machine,
not in a fixture. `V-216-s1` is the live positive control: behind the tip
and CURRENT, which a commit count would have refused.

### `.github` was in the fence and is deliberately unused

CI cannot see this defect. Its checkout is the PUSHED REF, while the
staleness is a property of the LOCAL checkout a session was started in;
on `push: main` the comparison is vacuous, and running the catcher from
CI would run the pushed ref's own (possibly stale) copy. Adding a step
would also have needed either a `docs/CONVENTIONS.md` command (outside
the fence) or a dishonest entry in `workflow-parity.spec.ts`'s
`INFRASTRUCTURE_STEPS`. Recorded rather than silently omitted.

### For the verifier

- The vantage/target split is the property. Swapping `vantage` for
  `target` in the registration arm is invisible to a fixture built from
  a stale WORKTREE, because a worktree shares refs — a poison drill found
  exactly that hole. `THE REFERENCE COMES FROM THE VANTAGE…` uses a stale
  CLONE, which is the only fixture that separates the two reads.
- `GUARD_SURFACE` is `.claude` and deliberately not the transitive
  closure of what a hook spawns; the limit is stated in the module.
- `STALE_CLONE_LIMIT` is printed on EVERY run, whatever the verdict.
- The suite's two remaining reds and the rust suite's two are NOT this
  card's: they are `T-216-s4`, filed here.

### After rejection 1 — the arm could not reach a verdict where it runs

**The verdict was right and the defect was mine.** The arm read
`CLAUDE_PROJECT_DIR` and nothing else. That variable is exported to HOOK
commands and NOT to Bash tool calls, so the arming step a seat actually
TYPES took the "nothing declared" branch every time; the only path to a
STALE verdict was reachable from a fixture. **And the body at
`checkout-currency.spec.ts:829` pinned that branch as correct using the
unset-variable configuration, which IS production — the suite certified
the gap instead of catching it.** That is this card's own subject
committed one level up, and it is why the rejection was a rejection and
not a filed suggestion.

**Two halves, and only the second one is un-defeatable.**

**1. `sessionCheckout()` — the target is DERIVED, in a stated order.**
`CLAUDE_PROJECT_DIR` where the harness exports it; otherwise the
WORKTREE ROOT containing the command's working directory, and only when
that root carries `REPOSITORY_PROBE_REL_PATH` — the same file
`push-guard.mjs` asks the same question with, with a body asserting the
two constants are equal so the copy is checked rather than trusted.
**Never raw `cwd`**, which the verdict explicitly did not want and which
would invent a target. The render names the SOURCE, so a reader can tell
an authoritative answer from an inferred one. Measured in production's
own environment — variable unset, cwd = the motivating worktree:

    exit 1 · verdict stale · 4ec229c · 352 behind · arms A + B

**2. `sweep()` — the half that needs nothing declared.** Every way of
naming *the session's own checkout* can be wrong: a variable the shell
does not carry, a working directory the seat moved, a flag nobody
passed. The sweep asks a different question — **which checkouts of this
repository, on this machine, load stale guards?** — off `git worktree
list --porcelain` read in the vantage, which `method/lane-protocol.md`
rule 7 already makes the authority on what exists. The session's
checkout is in that answer BY CONSTRUCTION, because a session is started
in a checkout of this repository. Measured live, needing nothing
declared and no checkout's cooperation:

    SWEEP: 6 of 9 checkout(s) load STALE guards
      CURRENT  /Users/ujju/Projects/nputer
      CURRENT  /Users/ujju/Projects/nputer-T-216-s1
      CURRENT  /Users/ujju/Projects/V-216-s1
      STALE    …/.claude/worktrees/adoring-nash-028cf4 @ 4ec229c   <- the card's own instance
      STALE    /Users/ujju/Projects/nputer-app, /private/tmp/nd-T-140-s4,
               /Users/ujju/Projects/arch-verify, …/mystifying-maxwell-c6045b,
               /Users/ujju/Projects/V-s2-A

Three CURRENT beside six STALE is the sweep's own positive control: it
discriminates rather than refusing everything.

**WHY NOT THE EXPLICIT FLAG, which was the safer of the two routes
offered.** It is the same failure wearing new clothes, for two reasons.
The mechanical one: the ritual that would pass it is spelled in
`docs/CONVENTIONS.md`, outside this fence — so this lane could ship the
flag and not the passing, which the verdict itself calls decorative. The
structural one is worse: **a flag asks the party under test to declare
the property under test**, and a seat working out of a stale checkout is
precisely the seat that does not know it is. *A construction beats a
check* is this project's own rule, and here it points at the sweep.

**WHAT REFUSES AND WHAT REPORTS, argued rather than assumed.** A stale
RESOLVED TARGET is a finding and the dispatch answers 1. The SWEEP
reports. Making every stale checkout on the machine a refusal would red
every dispatch forever — `arch-verify` is permanently 900+ commits
behind and nobody is going to move it — and a gate that is always red is
the gate this project learns to ignore. That is the same argument the
guard-surface arm already makes against a raw commit count.

**A COLLISION THIS LANE CAUSED WHILE MEASURING THE FIX, RECORDED HERE
BECAUSE IT IS THIS SEAT'S.** The scratchpad is shared with every other
live seat. This lane and the verifier's bench both wrote a battery runner
called `battery.sh`; the verifier's landed second, and this lane then ran
it — against the verifier's checkout, at a ref that was not this tip,
appending four exit lines to the verifier's own ledger and overwriting
its suite logs. Two legs ran there; **the other two were REFUSED by
`gate-run`'s solo lock**, which is the machinery working (T-088-s4). The
figures below were re-measured afterwards under a lane-derived name. The
class is `method/lane-protocol.md` rule 4's machine-scoped surface, the
missing half is a SPELLING, and it is filed as `T-216-s5`.

**The residual, stated rather than left to be found.** `sessionCheckout`
source 2 still has the verdict's named hole: a seat typing the arming
step in some OTHER checkout gets a target verdict about that one. The
sweep is what covers it — that seat still sees its stale worktree named
— but the FINDING (and therefore the exit code) follows the target, not
the sweep. Closing that would mean refusing on the sweep, which the
paragraph above refuses on its own evidence.

## Verdicts

### APPROVED — 2026-09-01 — claude-opus-5@subagent — re-verification, measured at `aff1616`

Scope as agreed after the rejection: the target-resolution path, a body asserting a
stale checkout IS caught with `CLAUDE_PROJECT_DIR` unset, and whatever the fix
disturbs. Criteria 1–4 were met at `202d31d` and are not re-litigated here. The
executor's report and reasoning were again not read.

**THE BLOCKING DEFECT IS FIXED, and the proof is the motivating instance itself.**
`sessionCheckout()` now takes `CLAUDE_PROJECT_DIR` where the harness exports it and
otherwise derives the WORKTREE ROOT containing the command's working directory,
gated on a probe that the root is a checkout of this repository. Run in production's
own shape — variable unset, cwd inside the stale checkout, which is what a session
has:

    (cd <the 4ec229c worktree> && env -u CLAUDE_PROJECT_DIR \
       node tools/e2e/scripts/brief.mjs --task T-216-s1 --preflight)

    exit 1
    verdict: stale
    judged:  /Users/…/.claude/worktrees/adoring-nash-028cf4
             <- derived: the worktree root containing this command's working
                directory, never the directory itself
    the checkout this session was started in is STALE [registration-missing] …
    the checkout this session was started in is STALE [hook-absent] …
    the checkout this session was started in is STALE [guard-surface-behind] …

Three findings reaching the summary a dispatcher reads, and the dispatch answers 1.
At `202d31d` the identical invocation printed `UNANSWERED` and charged nobody.

**AND THE SWEEP ANSWERS THE HARDER VERSION OF THE QUESTION.** The dispatching seat
asked whether the fix would name its own session checkout *without being told the
path exists*. Run from a checkout that is NOT the stale one, with nothing declared:

    stale: /Users/…/.claude/worktrees/adoring-nash-028cf4 @ 4ec229c
           — registration-missing, hook-absent, guard-surface-behind

Named unprompted, off `git worktree list --porcelain`, needing no variable, no flag
and no working directory. That is the half that cannot be defeated by mis-naming the
session, and it is a better answer than either route this verdict proposed.

**THE BODY I ASKED FOR EXISTS AND IS LOAD-BEARING.** `PRODUCTION'S OWN ENVIRONMENT:
with CLAUDE_PROJECT_DIR UNSET, a stale session checkout IS caught at arm time` runs
with the variable deleted and cwd as the only signal. A mutant killing ONLY the cwd
derivation — `git(cwd, ["rev-parse","--show-toplevel"])` replaced by a failure, the
declared branch and the sweep left intact, landing read from `git diff` — kills
exactly three bodies (865, 953, 984) and leaves 29 passing. Disjoint from the
wiring mutant's kill set at `202d31d` (779/804/816), so neither body is a
restatement of the other.

**Four suites GREEN at `aff1616`**, my own runner: parser **349**, app **1131**,
rust **631/18**, e2e **535**. The e2e delta reconciles exactly — 529 + 7 added
bodies − 1 removed (the old "never guesses a target" body, correctly retired
because the arm now derives).

**Security: clean, and it matters more than last pass** because `sweep()` now
touches every checkout on the machine. The catcher performs **zero writes** —
no `writeFileSync`, `mkdirSync`, `rmSync` or `appendFileSync` anywhere in it — and
carries no `shell: true`, no `exec`, no network, no new dependency, no secrets. The
porcelain parser prefix-matches and resolves paths rather than splitting on
whitespace.

### Residual, disclosed and NOT blocking

Where a seat runs the arming step from a checkout that is not its session's project
directory, the resolved target is that other checkout, and the session's own stale
checkout appears in the SWEEP — which reports rather than refuses, so the dispatch
exits 0. Measured: this machine currently has **6** checkouts the sweep calls stale,
so refusing on a sweep row would red essentially every dispatch, and the code argues
exactly that. It is the same reasoning that keeps the guard-surface arm from being a
commit count, and it is right. The residual is narrow — a session's shell cwd is its
project directory unless someone deliberately moves it — and it is now LOUD in every
case rather than silent in the ordinary one, which is what this card asked for.

Observation, not a finding: the sweep adds ~1.2 s to an arming step across 9
worktrees. Fine for a once-per-dispatch command; recorded because `T-154-s2` measured
the fence walk's cost for the opposite reason and someone will compare them.

### A disclosure about this verdict's own measurements

A second runner executed suites in this bench during the previous pass — both seats
wrote a battery script at the same defaulted name in a shared scratchpad, and the
lane ran what it believed was its own. The token it left stamps all four legs at
`395c867`, which IS this seat's verdict tip, and its parser/app/e2e figures match
what this verdict reported. **Agreement is exactly the case lane-protocol rule 4
calls invisible**, so the gate line was re-measured under a script unique to this
seat rather than accepted: parser **349**, app **1131**, e2e **529** at `395c867`,
unchanged. What did record the intrusion was this bench's own solo lock, which
REFUSED rust and named the holding pid — `T-088-s4`'s machinery working as designed.
The prior verdict below stands unamended.

### REJECTED — 2026-09-01 — claude-opus-5@subagent — measured at `202d31d`, bench `/Users/ujju/Projects/V-216-s1`

**The blindness on this pass was a fact about the CLOCK, not a discipline I
kept.** This bench was cut alongside the lane from the same base commit
(orchestrator 5c), so there was no diff to decline to read. The attack set was
sealed at `sha256 3347c3ac30d2acf1e6e92bf02dc3fd3cc6187f51d9d2824473a9604b6a7c65c9`
before the ground truth beside it was measured and before any implementation
existed; it has not been modified since. Frontmatter is untouched — `verifying`
is a lane state and not this seat's to move.

**FOUR SUITES GREEN AT `202d31d`**, measured at this bench after a fresh install
and an `app/` build: parser **349**, app **1131**, rust **631/18**, e2e **529**
(base 503; +26 is this spec's own body count exactly). *The first battery's reds
were MINE and are recorded so nobody re-derives them: an uninstalled bench —
`Cannot find package 'yaml'`, `vitest: command not found`, and 14 app bodies
asserting a `app/dist` that had never been built. None reached the diff.*

**Criteria 1–4: MET, and three of them exceeded.**

- **1** is answered the way the card demands and the way a blind attack set
  demanded before it existed: `consult()` selects and SPAWNS, a marker file the
  hook itself writes proves the simulator can observe a consultation, and the
  measured instance's empty selection is then read off *the same function*. The
  push is real — a bare fixture remote's ref is compared against `fx.staleHead`,
  so "the push happened" is observed and not inferred from exit 0.
- **2** holds: judged from a vantage the target does not control, target carries
  no copy of the catcher and is not written to. Verified live — this bench judged
  the actual motivating worktree and returned STALE with three findings.
- **3** is not merely stated, it is DEMONSTRATED: one content, two vantages, two
  verdicts. The limit's remedy (`--integration-ref origin/main` after a fetch)
  matches an independent phase-1 measurement that a fetch repairs `origin/main`
  and NOT local `main` — the subtlety is right.
- **4** runs the naive reachability check, observes it answer "fine", and watches
  the catcher refuse the same checkout in the same fixture; `behind-but-current`
  is its non-contained positive control and would die against a `count > 0`
  implementation. Distance is derived at the ref under test, never typed.

**Security: clean.** `spawnSync` with argv arrays throughout, no `shell: true`,
no network, no writes to the judged checkout, no new dependency (the one
`package.json` line is a script), no secrets.

---

### Criterion 5 is the rejection: the LETTER is enforced, the PURPOSE is not

The wiring is real and mechanically pinned. A mutant that removes only the
invocation — `} else if (wantsPreflight || fenceWorktree !== "")` → `} else if
(false)`, `checkout-currency.mjs` untouched, landing read from `git diff` — kills
exactly three bodies (779, 804, 816) and leaves the other 23 passing. Disjoint
kill sets. Criterion 5's own words are satisfied.

**But the arm cannot reach a verdict in production.** `brief.mjs` resolves the
checkout to judge from `CLAUDE_PROJECT_DIR` alone, and refuses to judge without
it. That variable is exported to HOOK commands and NOT to Bash tool calls —
measured, with a positive control in the same session:

    hook command       CLAUDE_PROJECT_DIR = <the project dir>    (control: it exists)
    Bash tool call     CLAUDE_PROJECT_DIR = <UNSET>              (env | grep -c => 0)

So the ordinary act — a seat typing the arming step at its own shell — takes the
UNANSWERED branch every time. Reproduced at this bench, both halves of the same
command:

    # production: a Bash tool call has no CLAUDE_PROJECT_DIR
    env -u CLAUDE_PROJECT_DIR node tools/e2e/scripts/brief.mjs --task T-999 --preflight
      expected (this card): the stale session checkout is caught, LOUDLY, at arm time
      actual:               "UNANSWERED: no session checkout was declared" — judged
                            nothing; zero occurrences of "is STALE" on stdout or stderr

    # the same command, with the variable the FIXTURE supplies
    CLAUDE_PROJECT_DIR=<the motivating worktree> node tools/e2e/scripts/brief.mjs \
        --task T-999 --preflight
      actual:               verdict: stale, three findings

Same command, same stale checkout; the only difference is a variable production
never sets. **The path that produces STALE at arm time is reachable only from a
fixture.** On the next dispatch out of a stale checkout — this card's own
motivating instance — the seat is told nothing and the sitting proceeds.

**And the suite certifies the gap rather than catching it.** The body at
`checkout-currency.spec.ts:829` pins UNANSWERED-and-charge-nobody as correct
using the unset-variable fixture, which IS production. It will stay green
forever while the arm never fires. That is why this is a rejection and not a
filed suggestion: the card exists to end "a correct catcher that nothing calls",
and what shipped is a correct catcher that is called and always declines. For the
motivating instance the outcome is identical — nobody is told.

**The executor's reasoning is not in evidence here and was not read** (role file:
the diff and the card, nothing else). The refusal to fall back to `process.cwd()`
is argued in the code itself and the argument is sound: a bare `cwd` would invent
a target and report a verdict about a checkout no session was started in.
**Nothing below asks for that fallback.**

### The signal IS available, and the fix is small

Measured from a real session's shell, cwd being its own project directory:

    git rev-parse --show-toplevel  ->  /Users/…/.claude/worktrees/adoring-nash-028cf4
    that checkout's HEAD           ->  4ec229c        (the motivating instance itself)

Two routes, and **a control I propose is mine to check, so here is what is wrong
with mine:**

1. **Explicit, and the safer one** — `brief.mjs` takes `--session-checkout <path>`
   and the arming ritual passes it. Cannot judge the wrong tree. Costs a ritual
   change, and an unpassed flag degrades to today's UNANSWERED, so it needs the
   ritual updated in the same breath or it is decorative.
2. **Derived** — resolve the WORKTREE ROOT containing cwd (not raw cwd), and
   judge it only when it carries `.claude/settings.json`. **Its failure mode is
   real**: a seat running the arming step from some other checkout gets a verdict
   about that one. That is a narrower version of the same hazard the code already
   refuses, and I am not claiming it is clean — it is the trade to argue, not the
   answer to adopt.

Either way the body that would make it stick is one this suite does not have:
**an arm-time test whose environment is production's — `CLAUDE_PROJECT_DIR`
unset — asserting that a stale session checkout IS caught.** Today that
configuration is asserted to catch nothing.

### A second, smaller defect in the diff — the notes are invisible to the board

This card's notes heading is `## Implementation notes (executor, 2026-09-01)`.
The parser matches that section on the exact key `implementation notes`, so the
parenthetical matches nothing, and `splitSections` drops the content under an
unknown `##` heading entirely. `app/src/lib/task-detail.ts` reads
`sections.implementationNotes`, so **the notes will not render in the detail
pane.** No suite reds — the docs gate checks frontmatter, not section names — so
this one is silent:

    normalise("Implementation notes (executor, 2026-09-01)")
      -> "implementation notes (executor, 2026-09-01)"   != "implementation notes"

**CORRECTION, and it makes the item BIGGER rather than smaller — this verdict
first said "every other card spells the heading bare", and that was wrong.** It
was read off a `grep | uniq -c | head -8` whose groups were keyed on LINE NUMBER
and truncated at eight rows; every surviving row happened to be a bare spelling.
A universal claim taken from a truncated sample.

**THE CENSUS IS T-234'S AND IS NOT RESTATED HERE** — a second copy of a list
drifts from the first, and this project has watched that happen. Measured at
`c5c2b47`: **441 live cards, 50 notes dropped, 20 verdicts dropped, 12 in both,
union 58.** I re-derived all five and they hold.

**So this lane did NOT introduce the defect — it followed established
practice**, and the item is a board-wide class with a census rather than a
rejection item against this diff. It is recorded here for the mechanism, not
charged to this lane.

**A residual those five figures do not carry, offered to T-234.** The strict
count asks "is the content unreachable", and 9 further cards sit between yes and
no — 3 notes, 6 verdicts — carrying a decorated heading *beside* a bare one. Their
content is PARTLY visible, and that is arguably the worse failure: `T-123` has
`## Verdicts` at 462 and `## Verdicts (continued) — THE SECOND PASS` at 1225, so a
reader gets a verdicts section, no empty space, and **no signal at all that a
second pass exists and is missing.** Total invisibility at least shows a gap.

**And the VERDICT half is the worse half.** `verdicts` is the only key the parser
knows, so every decorated singular spelling is dropped — `verdict: approved`,
`verdict — approved at c50bbf9, 2026-09-01`, `verdict (2026-08-30, blind factless
verifier …)` and some twenty more. **Verdicts that no longer render are a heavier
loss than notes that do not**, on a board that is the interface. (This verdict
uses the bare `## Verdicts` and parses — checked, not assumed.)

Still the THIRD instance of one class on this card: an amendment note glued into
the criteria under a `###`, an amendment section invisible under an unknown `##`,
and now the notes. **A `##` heading on a card is a code input.**

### Not blocking, filed as observations only

- `checkout-currency.spec.ts:337` asserts the fixture has no Bash matcher with
  `not.toContain('"Bash"')`; a matcher spelled `"Bash|Write"` would slip that
  string check. It guards a fixture the same file writes, so nothing rests on it
  today.
- The three-verdict design (current / stale / unknown) and the refusal to turn an
  inability into a verdict are the right shape and should survive the fix.
