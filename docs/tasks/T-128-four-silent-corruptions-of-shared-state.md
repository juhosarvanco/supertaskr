---
id: T-128
title: Three silent corruptions of shared state in one session — a shared index, a shared branch ref, and a shared scratch directory — and the lane protocol names only the first
feature: F-01
milestone: 4
priority: 8
size: S
status: planned
blocked_by: []
touches: [method/, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/merging.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**Filed by the architect from live operation on 2026-08-25, during the
session that first ran six lanes concurrently.** Every instance below was
observed, not imagined, and two of the three were caught by the agent
they happened to rather than by any rule.

## The class

**An agent wrote to a resource a DIFFERENT agent depended on, the write
succeeded, and the corruption was silent.** Not one of the three produced
an error at the moment it happened. Each was found later — twice by luck,
once by a harness flag — and in every case the failure mode was the same:
**a plausible-looking wrong answer, not a crash.**

The lane protocol has a fence for source files and nothing for anything
else. **A fence over `touches:` protects the tree and leaves every other
shared surface undefended.**

## INSTANCE ONE — the shared index (already recorded as `T-123-s10`)

The architect staged a file into `/Users/ujju/Projects/nputer`'s index
while an integrator held main. The integrator's `git status` came back
carrying somebody else's staged path and it **waited about four minutes**
deciding whether the tree was safe to write.

Already has a rule and a practice: check `git diff --cached --name-only`
and `git diff --name-only` are both empty before any write to main, and
`??` lines alone are not a ceremony (`T-120-s1`).

**AND THE MECHANISM MATTERS, BECAUSE IT NARROWS THE RULE FROM "NEVER"
TO SOMETHING WORKABLE.** Git takes `.git/index.lock` for the duration of
an index write and **fails rather than interleaves** — two concurrent
`git add`s produce an error, not a corrupt index (git 2.50.1). So the
harm in instance one was never corruption; it was that **staged state was
LEFT BEHIND** for another agent to find and have to interpret. Four
minutes were spent on a question, not on a repair.

**That distinction gives the rule its real shape: the danger is DURATION,
not concurrency.** A writer that stages and commits as one uninterrupted
motion leaves a window of milliseconds and nothing behind. A writer that
stages, then thinks, then commits leaves a trap whose lifetime is however
long it thinks. **`git add` followed later by `git commit` is the
hazardous pattern; `git add && git commit` is not** — and the rule should
say so, because "do not write while an integrator holds main" reads as an
indefinite prohibition and is what pushed the architect into instance
four.

**AND THERE IS A SHARPER HAZARD UNDERNEATH, WHICH THE INDEX CHECK DOES
NOT COVER.** `git commit` commits **everything currently staged**, not
only what you staged. So an agent that checks the index, stages its file,
runs a three-minute suite, and then commits will **sweep another agent's
staged work into its own commit** if that agent staged during the suite.
The check-then-write pattern cannot close this, because the check happens
before the window.

**The construction that does close it is `git commit -- <path>`**, the
pathspec form, which commits the named paths from the working tree and
**ignores the index for everything else**. It is safe regardless of what
any other agent has staged, and it needs no check at all. **A rule that
depends on a check has a race; a rule that depends on a construction does
not** — and this card prefers the construction wherever one exists, the
same reason the scratch answer is namespacing rather than care.

## INSTANCE TWO — a shared branch ref, and TWO INDEPENDENT VERIFIERS DID IT

**This is the instance that is not an agent error.** Two verifiers, on
two unrelated lanes, with no contact between them, reached for the same
wrong mechanism within an hour of each other:

- `task/T-102-auth-discriminator` was repointed with raw `git update-ref`
  from a detached worktree, **twice**.
- `task/T-033-zero-drift-registry` was moved the same way, from a
  different detached verification worktree.

**When two independent hands invent the same workaround, the workaround
is not the defect — the missing instruction is.** `method/roles/verifier.md`
tells a verifier to commit a verdict on the lane's branch and does not say
*from where*. A verifier working in its own detached scratch checkout has
a commit in hand and a branch that should point at it, and `update-ref`
is the obvious move. Nothing warns it that the ref is shared.

**Damage, measured rather than assumed, in both cases:** ancestry checked
first — `935a78d` is an ancestor of `d12efac`, and `935693f` of
`c259f87` — so **nothing of either lane's work was lost.** One commit
(`c0ff888`) was discarded and replaced; it was the verifier's own first
verdict commit and it survives in the reflog. But **both lane worktrees'
indexes went one commit stale**, each reporting a *staged delete of a file
that had just been created* plus a modify of the card. Repaired with
`git reset --hard` after confirming, in each, that nothing was unstaged
and nothing untracked.

**AND THE SECOND ONE NAMED THE REAL HAZARD, WHICH IS WORSE THAN A
CONFUSING STATUS**: in that state, **a stray `git add -A` in the lane
worktree would have committed the deletion of the verdict.** A verdict is
the one artifact the project cannot reconstruct — it is a judgement, not a
derivation — and it was one careless command from being erased by a
mechanism that had already been flagged as dangerous for a different
reason (it stages three gitlinks).

**The rule this earns:** a verifier commits its verdict IN the lane's
worktree, or in its own checkout of that branch — **never by repointing a
shared ref from elsewhere.** A ref is shared state; every other holder's
index goes stale the instant it moves, and none of them is told.

## INSTANCE THREE — a shared scratch directory, and the worst of the three

Every agent this session was pointed at one scratch directory. A
verification pass wrote `prescribed.txt` there. **Another live session
wrote its own `prescribed.txt` to the same path mid-pass. The first pass
read the file back and got a DIFFERENT LANE'S PATH LIST.**

It re-derived into per-lane-named files and its figures came out
unchanged. **A pass that had not re-checked would have reported another
lane's diff as its own, and every number would have looked plausible** —
a well-formed path count for the wrong branch, fed into a range-rule
verdict.

**This is the worst of the three because it is the only one that produces
a WRONG ANSWER rather than an obstruction.** A held index blocks you. A
stale ref shows you a confusing status. A colliding scratch file hands you
a clean, complete, confidently wrong measurement.

**The architect caused this one** by giving every dispatched agent the
same scratch path, and it is recorded here rather than fixed quietly
because the pattern will recur the moment concurrency rises again.

## INSTANCE FOUR — the board itself, and this one is the deepest

**Found by T-108's own executor, against the architect who dispatched
it.** `method/lane-protocol.md` fixes the order: the `status: building`
stamp is written on the INTEGRATION BRANCH *before* the branch is cut,
and "the lane never writes that line at all" — whose stated purpose is to
stop the stamp becoming two edits to one line.

The architect inverted that order for T-108 and T-116, putting both
dispatch stamps on the lane branches, **because an integrator was holding
main and instance one's rule forbids writing to a held index.**

**The consequence is that the board on main LIES.** Main's copy of T-108
still read `status: planned` and `touches: [docs/tasks/]` while the lane
was building under a fence the architect had already narrowed to three
files. **Anyone computing fence disjointness from main would have seen
T-108 holding the entire `docs/tasks/` directory** — which is exactly the
unshippable state the narrowing ruling exists to remove. The ruling was
real, correct, and invisible where it mattered.

**THE POINT IS NOT THE INVERSION. IT IS THAT TWO SHARED-STATE RULES
LOOKED LIKE THEY COLLIDED, AND ONE WAS PICKED SILENTLY.** "Do not write
to a held index" and "stamp on the integration branch before cutting"
appear jointly unsatisfiable while an integrator holds main, and the
architect resolved the apparent conflict by improvisation without saying
so.

**AND THE COLLISION WAS NOT EVEN REAL — WHICH MAKES IT WORSE, NOT
BETTER.** Instance one's rule is about **leaving staged state behind**,
not about touching the index at all: git serialises index writes under
`index.lock` and fails rather than interleaving. **An atomic
`git add && git commit` of two frontmatter lines would have satisfied
both rules.** The architect read "do not write while main is held" as an
indefinite prohibition, took the workaround, and put a stale fence on the
board for the duration of two lanes.

**A rule stated more broadly than its reason gets over-applied, and the
over-application does the damage the rule was written to prevent.** That
is the finding here, and it generalises past this instance: instance one's
rule was written from a symptom (four minutes lost) rather than from its
mechanism (staged state with no author), so it could not tell anyone
which writes were safe.

An integrator independently observed the other half of the same fact from
the outside: two cards read `planned` on main while stamped `building` on
their own branches — **the first field observation of the board-truth
window at `building`** rather than at `verifying`, which is where T-104's
ruling nine measured it.

## What the four have in common, and why one rule is better than four

**Concurrency safety in this project is currently a property of the fence
and nothing else.** The fence covers `touches:`. It does not cover the
integration checkout's index, the ref namespace, scratch space, or the
board's own truth — so **all four were corrupted in the first session
that ran enough lanes for it to matter**, and none of the four announced
itself.

**The generalisation: every shared surface a lane can write needs either
a fence, a naming discipline that makes collision impossible, or a
pre-write check that detects a holder.** Four surfaces, four answers —
the ref gets a prohibition, scratch gets namespacing, the index already
has its check, and the board needs a stated precedence when its rules
collide. **What must not survive is the assumption that "one task, one
branch, one worktree" is sufficient isolation.** It is not, and it never
claimed to be; it was only ever sufficient for the tree, and the tree was
the only thing anybody was watching.

**The honest summary of the session that produced this card**: six lanes
ran concurrently for the first time, every one of them produced correct
work, and the only four defects were in the machinery *around* the lanes
rather than inside any of them. **Scaling the parallelism did not degrade
the work; it exposed the parts of the protocol that were never
concurrent.**

## Acceptance criteria

- **THE FOUR SURFACES SHALL BE NAMED IN THE LANE PROTOCOL** alongside
  the tree, with the rule each one gets. A protocol that isolates the
  tree and says nothing about the index, the ref namespace, scratch space
  or the board is claiming an isolation it does not provide.
- **THE HELD-INDEX RULE SHALL BE RESTATED FROM ITS MECHANISM RATHER THAN
  ITS SYMPTOM.** It forbids **leaving staged state behind**, not touching
  the index: git serialises under `index.lock` and fails rather than
  interleaving. **An atomic `git add && git commit` is safe; a `git add`
  followed later by a `git commit` is the hazard**, and the rule SHALL
  name the difference. Until it does, it reads as an indefinite
  prohibition and produces instance four.
- **THE DISPATCH-STAMP ORDER SHALL BE RECONCILED WITH IT EXPLICITLY**, so
  the next dispatcher does not re-derive the same wrong answer. State
  what a dispatcher does while main is held. **IF the answer is ever
  "stamp on the lane branch" THEN the disclosure SHALL be mandatory and
  SHALL say where the true fence is** — the cost is that anyone computing
  disjointness from main reads a stale one, and that cost must be paid
  out loud.
- **THE VERIFIER'S ROLE SHALL SAY WHERE A VERDICT IS COMMITTED FROM, not
  only that it is committed.** Two independent verifiers invented
  `update-ref` within an hour because the role names the destination and
  omits the origin. **A rule that two careful readers independently
  violate the same way is an underspecified rule, not two careless
  readers**, and the fix is to add the missing half rather than to add a
  warning.
- **SCRATCH SPACE SHALL BE NAMESPACED BY LANE, AND THE RULE SHALL BE
  STATED AS A CONSTRUCTION RATHER THAN A CAUTION.** "Be careful with
  filenames" is not a rule; "every scratch path contains the lane id" is.
  IF a generic name is unavoidable THEN the reader SHALL re-derive rather
  than trust anything read back from it.
- **A VERIFIER SHALL NOT MOVE A SHARED REF IT DOES NOT OWN**, and the
  permitted route SHALL be written: commit in the lane's worktree, or in
  the verifier's own checkout of that branch. **`git update-ref`,
  force-push and history rewriting on a lane branch SHALL be named as
  prohibited**, so the next verifier does not have to derive it.
- **THE RULE SHALL SAY WHAT TO DO AFTER A VIOLATION, NOT ONLY THAT IT IS
  ONE.** All three instances were recoverable and the recovery differed
  each time. Record: verify ancestry before concluding anything was lost;
  repair a stale worktree index only after confirming nothing is unstaged
  or untracked; re-derive rather than re-read after a scratch collision.
  **A prohibition with no recovery procedure gets violated anyway and
  then handled by improvisation.**
- **THE ASYMMETRY SHALL BE STATED WHERE THE RULES SIT**: an obstruction
  costs minutes and announces itself; a silently wrong measurement costs
  a verdict and does not. **The scratch rule matters more than the other
  two despite looking like housekeeping**, and a reader who ranks them by
  how serious they sound will rank them backwards.
- **NO INSTANCE SHALL BE ANONYMISED.** Each of the three names who did
  it, including the architect twice. This project's archive is
  trustworthy because it records its own errors with attribution; a
  process card that describes failures in the passive voice teaches less
  than one that says who.
- IF the lane protocol's existing rules already cover any of this THEN
  say so and cite them rather than writing a second spelling (T-057
  applies to prose as much as to code).

Verification: headless. **This card adds no test body, and that is stated
here rather than left silent** (the drill's clause about bodies that
cannot be poisoned). The DOCS GATE fires on `docs/CONVENTIONS.md` and on
this card's own path — run `node tools/e2e/scripts/docs-gate.mjs <path>...`
**directly, never through `xargs`**, and record which commands it owed and
each exit. `docs/CONVENTIONS.md` is read by five suites at the last
measurement, so the gate will owe several; run them and state counts and
exits from `$?` unpiped. GRAPH REGEN does not fire on a method/docs diff —
**ask rather than predict**. @human: none.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/merging.md, docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
