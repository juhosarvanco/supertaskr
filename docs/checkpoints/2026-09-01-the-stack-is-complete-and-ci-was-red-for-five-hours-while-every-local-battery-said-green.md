# Checkpoint: T-210, and the five hours of red nobody read (2026-09-01, architect/integrator)

`e5221f4..ed8e576` — one merge, 16 commits, 19 files, +2,846/−24.

**The enforcement stack is COMPLETE.** A write is refused (`T-199`), a
dispatch is refused (`T-209`), a landing is refused (`T-212`), a push is
refused (`T-203`), the fast paths are law (`T-211`), and the physical
layer catches the shell writes a hook provably cannot (`T-210`).

**And the sitting's real finding is not the stack.** It is that
`origin/main` was RED for roughly five hours while four consecutive local
batteries reported all four suites green. Both readings were honest.
Only one of them ran on a machine that is not this one.

## Merge

| card | merge | verdict |
|---|---|---|
| T-210 | `2e0d34d` | APPROVED after one required prose correction |

**Zero merge conflicts — the first clean merge of the sitting.** The
three lanes before it each conflicted on their card's `status:` line.
This one was stamped BEFORE its worktree was cut, which is `T-226`'s
whole finding, confirmed by construction rather than by argument.

## Gates

    parser        349/349        app     1131/1131
    rust          631 bodies / 18 targets, 0 failed
    e2e           492/492        graph   CURRENT — 1,166,334 bytes, 2495 symbols
    boot:check    0              method-eval  0, six evals
    CI (linux)    SUCCESS at ed8e576 — first green since 187ba7d

**The local battery, warm, is ~6 minutes and e2e is 93% of it** —
measured per suite: parser 3s, app 7s, rust 16s, e2e 337s. A "20 minutes"
figure was quoted three times in this window before anyone measured it;
it came from runs taken immediately after merges, when builds were cold.
**A figure repeated is not a figure derived.**

**HEALTH BANDS** — a reporter, never a gate — run with `--readings` over
this checkpoint's own captured output:

    health-bands: 14 band(s) — 7 inside, 1 drifting, 2 BREACHED, 0 unread, 4 UNKEPT
    exit 3   (designed while any band is unkept)

**Both breaches are this sitting's own doing and both are recorded rather
than tidied:**

- **`suite/e2e-seconds` — 330s against a 312s breach line.** The suite
  grew 443 → 492 bodies across the day; `T-210` alone added 13. This is
  the cost of the coverage this record is otherwise pleased about, and it
  is now the band's problem rather than a surprise.
- **`docs-headroom/docs/STATE.md`** — breached at 0.80% headroom, and
  **this seat had been measuring the wrong thing all sitting.** The band
  is a PERCENTAGE — breach below 2%, healthy above 10% — while every cut
  this session aimed at "under the warn line", landing repeatedly at 1 to
  70 bytes and wondering why the band still complained. Moving two method
  rules out (below) took it to **7.7%: out of breach, still drifting.**

**And chasing the last 2.3% by shaving sentences is the exact loop this
record's own new CONVENTIONS rule forbids.** It is left drifting on
purpose. The structural answers are `T-162-s1` (@human's, the
proportional warn line) and `T-146`.

## THE FINDING: A SUITE THAT IS GREEN HERE AND RED THERE IS MEASURING THE MACHINE

Two CI failures, five hours apart, both in `T-203`/`T-210`'s new fixtures,
both invisible locally, **both the same class**:

**1. `init.defaultBranch`.** A fixture called `git init` without naming a
branch. That name is MACHINE config — this box says `main`, the runner
says `master`. So the fixture built a *different repository* on each; the
landing gate resolved a different ref, judged a different range, and
reached a different verdict:

    macOS  local `main` exists  -> range empty -> gate passes -> GREEN
    Linux  local `master`       -> falls to origin/main
                                -> README.md in range, out of fence -> RED

**2. `user.email` / `user.name`.** Two `git merge` calls bypassed their
own fixture's `git()` helper with a raw `spawnSync`, inheriting the
machine's global identity — present here, absent on a runner:
`Committer identity unknown`.

**Both are `T-217`'s class** — a value global to the machine that a test
DEFAULTED instead of specifying — and both are corroborated there rather
than filed as new cards.

### AND THE SECOND ONE IS THE LESSON, NOT THE FIRST

The branch-name defect was diagnosed, the class was NAMED correctly in
writing, and then **the remedy was applied to exactly the one call the
failure pointed at.** Git identity was the same class, in the same suite,
sitting there.

> **A class named and a class swept are different acts, and only the
> second one ends anything.**

Cost: a second red cycle and a second push, four hours apart.

### The construction that closes both

Neither instance needed a better rule — the rule was already written.
What was missing was a cheap way to ASK THE OTHER ENVIRONMENT:

    GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null npm test

Against the fixed suite: **492 passed, exit 0.** Against either defect it
reproduces the CI failure in seconds. It would have caught BOTH before
either push. Now a rule in `docs/CONVENTIONS.md`, because a
machine-scoped surface is not closed by remembering it — **it is closed
by making the other machine cheap to ask.**

**The first version of that rule was itself wrong**, and was caught by
running it: it clobbered `HOME`, which is where Playwright caches its
browsers, and reddened 54 browser bodies — failures that look like
findings and are the instrument. Corrected in the same sitting.

## THE LOOP GOT FASTER WITHOUT LOWERING A BAR

Four method changes, each from a measurement in this window, made at
@human's direction after asking whether verification's first phase
belongs before dispatch.

**`orchestrator.md` 5c — CUT THE VERIFIER'S BENCH WHEN YOU CUT THE
LANE.** A blind phase 1 consumes nothing the executor produces: it needs
the card and the base ref, both of which exist at dispatch. Measured
across four lanes, phase 1 took **7.5, 7.3, 9.9 and 10.8 minutes, every
minute of it AFTER the executor had finished** — about 35 minutes of
serial waiting against runs of 15 to 105 minutes it could have overlapped
entirely.

**It is stronger early, not merely cheaper.** Blindness stops depending
on a seat declining to look and becomes a property of the clock: at
dispatch there is no diff to read. And what does NOT move: the attack set
never reaches the executor — **early is a SCHEDULING change, never a
SHARING one**, because an executor holding the attack set builds to a
checklist and *did it survive* becomes trivially yes.

**`orchestrator.md` 5b — AUDIT THE CARD'S ASSERTIONS BEFORE THE STAMP.**
**Three of four cards dispatched in one sitting carried a false claim and
every preflight ran GREEN.** One named a flag no binary accepts; one
asserted a governing document says something it never has; one predicted
a failure mode the platform does not have. Two were then found TWICE —
executor and verifier both — and the third was inherited without
noticing. `T-230` files the construction; until it lands 5b is an
admission.

**`verifier.md`** — phase 1 may arrive before the work exists, and the
seat says which it had. Plus **stamp a GROUND TRUTH beside the attack
set** where a card asserts anything about a platform (the first verifier
to do so found its card's central prediction false), and **a control you
propose is yours to check.**

**`CONVENTIONS`** — never type a path you can derive; fit a byte-banded
document in ONE write; read CI after batching; pin the fixture's branch;
borrow the environment before believing a green.

**`verifier.md` step 2b — the poison-drill rules got a home.**
Kill-set CONTAINMENT rather than the count, the third proof being
*something died at the site the property lives*, landings read from
`git diff` never a mutator's report, and **a DATA mutant where the
property is data**. Every one of those was settled by measurement in this
sitting and **none of them existed in `method/` at all** — they lived in
`docs/STATE.md` and in records, which is `T-146`'s pattern exactly. STATE
now points at the step.

## Suites

`gate-run.spec.ts:624` is load-bearing by name and **caught the same seat
twice.** It pins `docs/CONVENTIONS.md` to name the blessed runner in
exactly one place. It caught the token-gate bullet hours ago; then it
caught the *"never type a path you can derive"* bullet — **for typing the
path.** The bullet now names its own pin, so the next writer meets the
constraint where the temptation is.

## Board

429 cards: **done 197 · parked 123 · planned 94 · suggested 20.** No
lanes, no benches, nothing outstanding. Filed this window: `T-229`,
`T-230`, and the lane's own `T-210-s1`.

## What the brief got wrong

- **"20 minutes per push"**, stated three times before measuring. It is
  ~6 minutes warm, and e2e is 93% of it.
- **A class named and not swept** — the whole of the second CI red.
- **A rule shipped with the defect it warned about**, twice: the
  borrowed-environment recipe that reddened 54 bodies, and the
  derive-your-paths bullet that typed a path.

**Three times in one sitting a check was written and then found
incapable of the thing it claimed.** That is `T-229`'s finding applied to
the integrating seat rather than to a lane, and it is why `T-229` exists.

## Metrics (ADR-020)

**Rework cycles:** 1 — `T-210` rejected once on a prose correction,
repaired in one round.

**Tokens:** `T-210` executor 415,493 + 505,795; verifier 143,298 +
212,579 + 232,740. **1,509,905** for the lane, read from its own
notifications as they arrived.

**Gate runtime:** the closing battery ~6 min warm (parser 3s, app 7s,
rust 16s, e2e 337s), run four times across this window plus two targeted
spec runs. `machinery/gate-seconds`' only reading.

**Cold start:** not applicable — one continuous session.

**Drift incidents:** **1.** Dated 2026-09-01 — method law
(`orchestrator.md`, `verifier.md`) edited DIRECTLY at the integration
seat, where `T-211` took the same files through a lane and an independent
verifier hours earlier. @human directed it, no lanes were live, and the
method-eval gate plus four suites are the check. **Recorded as an
override rather than allowed to pass as normal**, per TASK-FORMAT.

## Next

`T-216` is the obvious next card, and it would be **the first run of the
new ritual**: audit the card's assertions, stamp, then cut the lane and
the verifier's bench together. Then the landing-gate trio
`T-222`/`T-223`/`T-224`, promoted in this sitting's triage.

**Ten cards are filed and none is started.** `T-229` and `T-230` are the
two that pay for themselves — one prevents a rejection class, the other
prevents a dispatch class.

## @human's desk

**`T-203`'s cost is now measured and the decision is informed.** Every
push owes the four-suite battery — **~6 minutes warm, not 20** — and a
cargo-less checkout cannot push at all. @human has accepted that for now.
The local gate has so far caught **one** real defect (the `gate-run.mjs`
double-spelling); CI caught **two** that the local gate structurally
could not see. One `git revert` of `b752ddd` restores the old posture.

Unchanged and nobody else's: the **FORM** (reopened), the **STEERING
SPLIT** (`T-180` parked on it), `T-025-s4`'s three permission questions,
`T-162-s1`'s byte floor, `T-131`, and @human's eye on the interview's
ending at a narrow width.
