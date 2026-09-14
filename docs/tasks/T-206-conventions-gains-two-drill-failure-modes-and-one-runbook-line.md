---
id: T-206
title: CONVENTIONS gains FIVE drill failure modes 2026-08-31 discovered — including the self-referential corpus, which shape TEN passes every time — plus a role-qualified scratch stem and one CI runbook line
feature: F-06
milestone: 4
priority: 4
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/verification.md]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); all three additions were measured the same night"
builder:
review:
---

Three additions, each with a measured instance. **All are prose in a
document already near its drift line, so each must earn its bytes** — the
lane should expect to pay for them with a correction elsewhere, as
`T-142-s1` did.

## 1. The mutant that reds over ZERO BODIES

`docs/CONVENTIONS.md`'s POISON DRILL section says a mutant must produce
the RED. **It does not say the red must have a denominator.**

Measured: `T-167-s8`'s mutant broke syntax, so the suite exited **1
having run no bodies at all** — and an exit code calls that a kill.
`T-186` hit the same shape twice in its own drill checks. The remedy is
one sentence: **read the COUNTS, and a red with zero bodies is a void
arm, not a kill.**

## 2. The costume vacuity

`T-186`'s phrase, and it is the better name: **a check can fail in a way
that wears the drill's own costume.** Its `diff` compared two *empty*
files and exited 0; its duplicate-id scan ran over an *empty corpus*.
Both look exactly like a passing check.

The remedy is mechanical and already proven: **print the size of what you
are comparing BEFORE you read the verdict**, and run every check once
against a planted positive.

**This is poison shape TEN aimed at the drill's own instruments rather
than at the subject** — the catalogue has the shape; what it lacks is the
instruction to point it inward.

## 3. The runbook line: CI diagnosis reads check-run ANNOTATIONS first

**Measured, and it cost this seat real time.** GitHub Actions stopped
starting — zero steps, no log blob, two commits, five attempts. This seat
checked the workflow file, the jobs API, `--log-failed`, the Actions
permissions and the billing endpoint, concluded *"most likely exhausted
minutes, unconfirmable from here"*, and wrote that into a checkpoint
record.

**The answer was in the check-run annotations the whole time**, in plain
English:

> *"The job was not started because recent account payments have failed
> or your spending limit needs to be increased."*

`gh api repos/<owner>/<repo>/check-runs/<id>/annotations`. **One line in
the runbook: before concluding a CI failure is unconfirmable, read the
check-run annotations.** A zero-step job's reason lives there and nowhere
else.

## Acceptance criteria

- EACH addition SHALL cite its measured instance rather than stating a
  rule abstractly — this project's own evidence is that a rule without an
  instance decays.
- THE byte delta SHALL be reported against the band, and if the addition
  would drift `docs/CONVENTIONS.md`, **the lane SHALL pay for it with a
  correction elsewhere rather than shipping the drift.**
- ANY phrase a reader must find uniquely SHALL match exactly one bullet —
  `T-182` red 11 bodies by quoting a bullet name verbatim, and
  `T-142-s1` hit the same trap from the other side.
- NO addition SHALL restate something already stated elsewhere in the
  document; a second statement is `T-057`'s defect.
- Verification: headless, the CONVENTIONS-reading specs.

## Read beside

`T-202` (which mechanises what item 1 states in prose — this card is the
sentence, that card is the runner), `T-186` and `T-167-s8` (the measured
instances), and `docs/CONVENTIONS.md`'s existing POISON DRILL and shape
catalogue.

## 4. A REMOVAL-ONLY DRILL CANNOT DISTINGUISH AN EXACT MATCHER FROM A CONTAINMENT ONE

Added from `T-198`'s blind verifier, which found it by running a control
the lane had no reason to think it needed.

That lane pinned a live component's `paths:` with an exact `toEqual`, and
drilled it by **removing** an entry. The removal reds — **and it would
red identically under `toContain`.** So the drill proved the assertion
notices a missing path and proved **nothing at all** about whether the
matcher is still exact.

The verifier's control **adds a spurious path**, which only an exact
`toEqual` refuses. It reds. **That is the arm that closes the worst
outcome available in that lane**: silently widening the only exact-array
pin over a live registry into a superset check, where every future
addition would pass unnoticed.

**The general rule**: where an assertion's strength lies in EXACTNESS,
a drill that only takes things away measures the wrong half. **Mutate in
BOTH directions — remove one, and add one** — because the two mutants
fail under different matchers and only the pair identifies which matcher
survived.

This is a sibling of shape SIX rather than a restatement: shape SIX asks
whether a body kills a mutant no sibling kills; this asks whether the
mutants you chose can tell your matcher from a weaker one.

**And the verifier applied shape TEN to its own instrument in the same
pass**, which is the habit this card is trying to install: its waiter
answered on a stale `e2e-exit.txt` left by an earlier run — a marker file
from 10:13 against a 10:16 commit. It caught that before recording
anything, removed the marker, and re-waited. **A stale artefact answering
a fresh question is the costume vacuity with a timestamp on it.**

## 5. A RESTORE THAT VERIFIES ITS OWN WRITE DESTROYS WORK AND REPORTS SUCCESS

Routed by `T-202`, which met it inside the drill of a card whose subject
is exactly this, and it is the most dangerous mode on this list.

**A poison drill restored with `git checkout -- <path>`, silently
discarded the lane's UNCOMMITTED work, and still reported
`RESTORED=YES`** — because the check compared the file against **the sha
it had just written itself**. The restore verified its own write rather
than the restoration, so the hash matched exactly as designed while the
lane's work was gone.

**Every property this project asks of a restoration was satisfied**: one
side mutated, a read-back performed, a hash compared, a `RESTORED=YES`
printed. **And the outcome was data loss reported as a clean drill.**

The remedies are two and both are cheap:

- **Refuse to drill a DIRTY file.** A mutation whose baseline is
  uncommitted has no trustworthy restore target, because `checkout --`
  restores the INDEX and not the reader's intent. `T-202`'s harness now
  refuses one.
- **Compare against a hash taken BEFORE the mutation and recorded
  elsewhere** — never against one the restoring step produced. A
  self-supplied expectation is not a check.

**This is the third distinct way a drill can lie about itself in one
night** — a red over zero bodies, a comparison over an empty corpus, and
now a restore that grades its own homework. `docs/CONVENTIONS.md`'s
POISON DRILL section states the ritual; what it does not yet say is that
**the ritual's own instruments are in scope for the ritual.**

## AND THIS CARD'S SIBLING NAMED A PATH ITS OWN FENCE FORBADE

Recorded because it is this seat's defect, not a lane's. **`T-202`'s card
specifies `tools/gates/` as the runner's home while its own `touches:`
carries only `tools/e2e` and `docs/CONVENTIONS.md`.** The lane could not
have obeyed both.

It reported rather than guessed, and chose correctly: **all twenty
existing gate scripts already live in `tools/e2e/scripts/`**, so the
card's suggested home was also the less consistent one. **A card that
names a path outside its own fence is defective by `TASK-FORMAT`'s own
rule**, and `T-204`'s first proposed refusal — *the card file must
exist* — should be read as the narrow member of a wider class: **the
preflight can check that every path a card NAMES is inside the fence it
DECLARES.**

## 6. THE SCRATCH STEM MUST CARRY THE ROLE, NOT ONLY THE CARD ID

Disclosed by `T-194`'s blind verifier, which **destroyed the drill
scratch its own executor had left standing for it** and said so.

`docs/CONVENTIONS.md` already rules that a scratch stem is **DERIVED from
the card id and never chosen** — written after a sibling lane clobbered
an unnamespaced script. **That rule is right and it is one qualifier
short**: the executor and the verifier of the same card derive the
*identical* stem, so the second seat to run silently overwrites the
first.

**Nothing was lost this time** — the scratch was clean and detached at an
ancestor commit — and the verifier's own summary is the point: *"that was
luck, not design."*

**The fix is one token**: the stem carries the ROLE as well as the card,
so `T-194`'s executor and `T-194`'s verifier cannot collide. It costs
nothing and it removes a class where the failure is silent destruction of
another seat's evidence.

**And note which direction the danger runs.** A verifier arrives *after*
the executor and is the one holding the freshly-built drill bench it may
need to re-derive from. The seat most likely to destroy the evidence is
the seat least able to notice it is gone.

## 7. THE SELF-REFERENTIAL CORPUS — a spec whose expectation is read from its own subject

**The sharpest of these, found by `T-202`'s blind verifier inside the
artefact built to catch exactly this.** Four of its mutants survived, all
one class: **every corpus that spec checks IS the corpus under test.**

- Delete a name from `REQUIRED_VERDICT_FIELDS` → **31/31 still green**,
  because the body proving *"a missing field is refused"* iterates the
  very list that defines the requirement. **Removing a requirement
  removes its own test.**
- Delete a whole graded suite from the registry → **31/31 still green.**
- Delete the lock's pid-liveness check → **31/31 still green**; the
  *"dead process is reclaimed"* body never constructs a stale lock.

**A spec that derives its expectations from the thing it is testing
reports agreement while measuring nothing** — and it does so while
looking maximally rigorous, because the assertion count is high and every
body genuinely runs.

**THE REMEDY IS NOT MORE BODIES. It is an INDEPENDENT expectation.**
Where a body asserts a requirement, that requirement must be stated
somewhere the implementation does not read — a literal list in the spec,
a fixture, or the governing document. **The expectation and the subject
may not share a source.**

**Why this belongs at the top of the catalogue rather than the bottom**:
shape TEN asks whether the corpus is empty, which is a question about
SIZE. This asks where the corpus came FROM, which is a question about
PROVENANCE — and a self-referential corpus is never empty, so shape TEN
passes it every time.

**It was reproduced inside a card whose own charter is that a summary of
nothing looks like success**, by a verifier attacking a runner built to
refuse exactly that. If it can happen there, the catalogue needs it
written down.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
