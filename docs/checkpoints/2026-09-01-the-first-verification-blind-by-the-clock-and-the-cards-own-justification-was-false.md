# Checkpoint: T-216, the first pass blind by the clock (2026-09-01, architect/integrator)

`e9f21a6..eecb08e` — one merge, 11 commits, 8 files, +1,919/−18.

**One card, and it is here for the ritual rather than for the code.**
`T-216` is the first card dispatched under the three changes the last
record made to `method/roles/orchestrator.md`: audit the card's assertions
BEFORE the stamp, stamp BEFORE the cut, and cut the verifier's bench WITH
the lane. **All three paid inside ninety-three minutes**, and a fourth
rule was written mid-window by the verifier, against its dispatcher.

**And the sharpest finding is that the card's own justification for its
trade was false.** The lane's work was right; the sentence explaining why
it cost nothing was wrong, and a blind verifier proved it with a table.

## Merge

| card | merge | verdict |
|---|---|---|
| T-216 | `eecb08e` | APPROVED at `c50bbf9` after one REQUIRED prose correction |

Dispatch `9eb3ec8` at 13:19:13 +0300 → merge `eecb08e` at 14:52:27 +0300:
**93 minutes.** Base and bench were cut from the same commit; the bench
was detached at `9eb3ec8` and committed nothing.

**Zero merge conflicts, for the second consecutive card.** Stamped
`building` on the integration branch and committed BEFORE the worktree was
cut. This is `T-226`'s finding holding twice by construction, against the
three-way conflict every one of the three lanes before it took.

## Gates

    parser        349/349   exit 0     app       1131/1131  exit 0
    rust          631 bodies / 18 targets, 0 failed, exit 0
    e2e           503/503   exit 0     all four at ref eecb08e56df6
    boot:check    exit 0 — window "main" created, tree stopped SIGTERM
    CI (linux)    SUCCESS at eecb08e — run 33505255471, 17m23s

**GRAPH, asked LAST** — after this record's final write, verbatim:

    [nputer-index] graph.json is CURRENT - ../../docs/architecture/graph.json
      matches a fresh index (1166334 bytes, 200 files, 2495 symbols, 2388 edges)
    [nputer-index]   budget: 1166334 of 2145959 bytes (54.4%) - 979625 left

**HEALTH BANDS** — a reporter, never a gate — read over this checkpoint's
own captured output, all four suite logs plus the graph and boot logs:

    health-bands: 14 band(s) — 6 inside, 3 drifting, 1 BREACHED, 0 unread, 4 UNKEPT
    exit 3   (designed while any band is unkept)

**Zero unread, against two on the first attempt.** The two readings-
authority bands only close when the ACTUAL merge-tip suite output is
handed over; the temp directories `gate-run` names in its own summary
still held it, so the graph and `lib.rs` bands are read rather than
excused.

Movement in this window, and only one item is this window's doing:

- **`suite/e2e-seconds` BREACHED — 342s against a 312s line**, up from
  330s. The suite grew 492 → 503 bodies; `T-216` added all eleven. Same
  breach as last record, same cause, one card older.
- **`triage/live-suggestions` crossed into drift — 23 against a 20 line.**
  `T-216` routed exactly three cards. **This is the band working**: the
  drift is the arithmetic of filing findings faster than they are
  triaged, which is precisely the thing nobody notices without a band.
- `docs-headroom` on `STATE.md` (7.76%) and `CONVENTIONS.md` (5.23%) both
  drift, and **both are inherited, not caused** — verified rather than
  assumed: `git show` puts both files byte-identical at `e9f21a6` and
  `eecb08e`. No document in the standing set was touched this window.

**AND THE STATE READING ABOVE IS ALREADY STALE BY THIS COMMIT, WHICH IS
SAID HERE RATHER THAN LEFT TO A READER.** The 7.76% is measured at
`eecb08e`, before the regeneration that lands beside this record.
Regenerated STATE is **8,060 bytes — 405 of headroom, 4.70%**: still
drifting, and **worse than it was, deliberately.** This window put a new
hazard into STATE (the two half-spelled gate commands) and paid for most
of it with four MOVES rather than shaves — the 1420 rule to CONVENTIONS'
PORT RULE, which already owns it in full; the CI/local instance to the
09-01 records; the triage riders to this record; the dispatch ritual to
`orchestrator.md` 5b/5c. **What it did not do is chase the healthy band
by cutting sentences**, which is the loop the last record forbade.

**The first four attempts at that landing were the forbidden loop** —
8,781 then 8,474 then 8,421 then 8,254, each one a shave that came to
rest a few bytes from the line. The pattern is diagnostic: **landing
within tens of bytes of a band means shaving, and shaving means the
content that should have MOVED is still there.**

### THE TWO GATE SPELLINGS STATE CARRIES ARE BOTH INCOMPLETE

Both owed gates failed on the first attempt, sixty seconds apart, and
**neither failure was the thing STATE warns about:**

- **`npm run boot:check` exited 254** — `ENOENT ... package.json`. The
  script lives in `tools/e2e/`, the same place as `npm run capabilities`.
  **STATE names the command and not its cwd**, which is half a spelling.
- **`npm run health -- --readings` exited 2** — but the `--` was present
  and the flag arrived intact. The real message: *"--readings needs a
  file."* STATE says the `--` is load-bearing *"or npm eats the flag
  (exit 2)"*, so the exit code it predicts is right for the wrong reason,
  and a reader who trusts it debugs the wrong half.

**An exit code that is right for the wrong reason is worse than no note
at all**, because it terminates the search. This is `T-217`'s class one
level up: not a value defaulted from the machine, but a COMMAND recorded
without the part that makes it run. Regenerated STATE carries both cwds
and the file argument.

## THE FINDING: BLINDNESS BECAME A PROPERTY OF THE CLOCK, AND IT SHOWS

`orchestrator.md` 5c says a bench cut at dispatch makes the verifier's
blindness structural rather than disciplined. This is the first card run
that way, and the claim is checkable rather than merely asserted:

**Eight artefacts, seven of them stamped before the tip existed** — an
attack set, a ground truth, and five re-stamps, each hashed at write time
and byte-identical when re-verified beside the verdict. There was no diff
to decline to read. The verifier says so in its own words rather than
leaving a later reader to guess which of the two shapes it had.

**And the difference is visible in what it did with a surprise.** The
provenance extension — hook LOADING as distinct from hook ROOTING — was
NOT in the original attack set. Under the old shape that would have been
judged after the fact. Here it arrived mid-lane and the verifier spent
three re-stamps pre-committing to it before the work existed. Its own
line: *that is better than judging it afterwards, and is not the same as
having anticipated it.* **A seat distinguishing those two is the whole
product of the change.**

### THE VERIFIER WROTE A RULE AGAINST ITS DISPATCHER, MID-WINDOW

At `bab20e4`, `orchestrator.md` gained a clause 5c did not have: **a
contract amended after dispatch reaches the verifier BEFORE the work
does**, by path and by ref, never as the dispatcher's paraphrase.

It exists because this seat relayed *what an amendment said* into a set
whose entire value is that it is primary. The verifier caught it,
**declared the provenance in its own addendum rather than letting it
pass**, and argued the correction from 5c's own reasoning — an amendment
read alongside the diff arrives already paired with an implementation of
it, which is the pairing the whole step exists to prevent.

**That is the strongest thing in this record.** A rule derived by the
seat the rule protects, against the seat that wrote the rule.

### AND THE AUDIT PAID ON ITS FIRST RUN, BEFORE ANY LANE EXISTED

`de696b6` — 5b's card audit caught `T-216`'s card citing **line 449** for
code that `T-203` had already moved to 669–670. Cost: one edit before the
stamp. Under the old order it would have been an executor's first
confusion, or a verifier's.

**A line number is a figure and goes stale like one.** The card now
anchors on text.

## THE CARD'S OWN JUSTIFICATION WAS FALSE, AND THE COST IS REAL

`T-216` argued its trade in one sentence: *"It costs nothing real: the
misjudged verdict was never about the pushed tree, so retiring it loses
no measurement."*

**The universal claim is false, and the verifier measured it base vs tip**
on one fixture whose graph is STALE and whose token is FRESH:

    git push                        base: block graph-stale   tip: block graph-stale
    git --git-dir=<W>/.git push     base: block graph-stale   tip: ALLOW  (unresolved)
    GIT_DIR=<W>/.git git push       base: block graph-stale   tip: ALLOW
    cd "$PWD" && git push           base: block graph-stale   tip: ALLOW
    cd - && git push                base: block graph-stale   tip: ALLOW
    cd <W> ; git push               base: block graph-stale   tip: ALLOW

A push spelled unresolvably can still act on the WRITER'S OWN checkout —
where the retired verdict was about the pushed tree, was CORRECT, and is
now an announced non-verdict. The last row is the realistic one: a seat
that `cd`s to its own repository with `;` instead of `&&`.

**Cross-checkout the claim holds. Same-checkout-unresolvable it does
not.** This is a defect in the card's REASONING, not in the code: failing
open on the guard's own inability is the file's doctrine, criterion 3 asks
for exactly an observable decline, and the refusal names its remedy
loudly. Nothing here blocked the merge.

**And the lane then re-derived the correction rather than transcribing
it.** Sent five spellings, it landed **seven** — and deliberately excluded
`cd -`, because `cd -` goes wherever `OLDPWD` points and the line never
names it. Nothing distinguishes *unreadable and it stayed* from
*unreadable and it left*; that is what unreadability means. **A lane that
re-measures a correction it was handed is the behaviour the correction
was for.**

## Suites

**The two e2e reds are now pinned from three directions, and they belong
to the arming rather than to any diff.** The lane showed them failing at
BASE inside its armed worktree; the verifier tested the converse on an
UNARMED checkout of the lane's own tip content and got `lane-lock` in
full plus `token-scan` 10/10 exit 0; and this integration checkout, also
unarmed, closed at **503/503**.

Two directions pin a variable. Three retire the question.

*(The verifier's first attempt at that converse produced 18 failures and
was INVALID — a missing `lib/parser` build. It read the output rather than
the exit code and rebuilt before drawing anything from it, which is
STATE's own hazard obeyed by a seat that had just read it.)*

**The poison drill was reproduced independently, not accepted.** Four
mutants, every landing read from a real `diff` against the pristine file,
kill sets taken from Playwright's JSON reporter: M1 rooting **7**, M2 the
`&&` chain rule **2**, M3 the declaration **4**, M4 the `-C` reading
**3** — identical to the lane's counts, arrived at separately. Containment
was verified PAIRWISE rather than asserted: M2 ⊄ M1, M2 ⊄ M4, M4 ⊄ M1,
M3 ⊄ M1. Each mutant died at the site its property lives.

**And criterion 2's positive control was discharged the hard way.** The
verifier's first control swap failed to IMPORT and ran ZERO bodies — an
exit 1 that means *could not run* and proves nothing. Re-done as an
API-preserving mutant, the control dies under M1. **That is `T-229`'s
class caught by the seat that proposed the control**, which is
`verifier.md`'s *"a control you propose is yours to check"* holding on its
first outing after being written.

## Board

**437 cards: done 198 · parked 123 · planned 93 · suggested 23**, derived
at `eecb08e`. No lanes, no benches, nothing outstanding.

Filed this window, all three by the lane or the verifier:

- **`T-216-s1`** — a push gate is only as current as the checkout the
  session was started in. **It cannot be fixed by the artefact it is
  about**, which is the whole of its difficulty.
- **`T-216-s2`** — a CAPABILITIES regen must land in the same commit as a
  test name, and no fenced lane can do that.
- **`T-216-s3`** — **the whitespace is the entire difference**:

      ( cd /tmp && git push )    SEEN, declines with a reason
      (cd /tmp && git push)      NOT SEEN AS A PUSH AT ALL

  The spelled-out form is handled; the form people actually type
  vanishes. That makes it a **misleading declaration** rather than an
  honest gap, which is why it is a card and not a footnote.

## Environment

Stamped at 2026-09-01 ~14:55 +0300, re-derived never:

- **Seven worktrees, one on `main` at `eecb08e`, ZERO on `task/`.**
  Five detached on purpose (`nputer-app` at `d5c4b65`, `arch-verify`,
  `V-s2-A`, `nd-T-140-s4`) plus two session checkouts.
- **THIS SESSION'S CHECKOUT IS `4ec229c` AND THE TIP IS `eecb08e`.** The
  integrator seat has been operating from
  `.claude/worktrees/adoring-nash-028cf4`, hundreds of commits behind, with
  no `push-guard-hook.mjs` in it and no Bash matcher registered. **Every
  push this seat described as gated all sitting was ungated.** That is
  `T-216-s1` stated as a live fact rather than as a card, and it is why
  `T-216-s1` is the first card of the next wave.

## What the brief got wrong

- **The card's justification sentence**, above — the one thing the whole
  card rested on, and the only REQUIRED correction in the verdict.
- **Two gate spellings in STATE**, both incomplete, both failing within a
  minute of each other, in a checkpoint whose subject is deriving rather
  than remembering. **The invented-path count is not three; it is three
  plus two under-specified commands**, and the second class is worse
  because it fails with a plausible-looking exit.
- **An amendment relayed as a summary** instead of by path and ref —
  caught by the verifier, now `orchestrator.md` law.
- **A `SHALL` count stated wrong, then MIS-DIAGNOSED TWICE.** This seat
  said the machinery miscounts; the verifier said something else; both
  were wrong. The measurement at `b41a5fa` found the inflator was the
  plural `SHALLs` inside this seat's own paragraph. **Two confident
  diagnoses and one measurement, and only the measurement was right.**

## Metrics (ADR-020)

**Rework cycles:** **1** — one verdict on the card, APPROVED at `c50bbf9`
with a required prose correction, repaired in one round. No rejection.

**Tokens:** **NOT CAPTURED, and that is a reading rather than a blank.**
A lane's meter exists ONLY in its notification as it arrives, and this
seat did not capture `T-216`'s executor or verifier totals at the moment
they reported. Unrecoverable now. Every prior record in this series has
the figure; this one does not, and the gap is the record.

**Gate runtime:** the closing battery at `eecb08e` — parser **1.46s**,
app **6.50s**, rust **14.37s** summed over 18 test binaries, e2e
**342s**. **Total ≈ 364s (6m04s)**, owed by `T-203`'s push gate on the
merge commit. Plus `boot:check` (one full tauri dev boot and teardown)
and the graph `index --check`, each owed by ADR-019 at every checkpoint.
`machinery/gate-seconds`' only reading this window: **364s.**

**Cold start:** **this window began after a context compaction, not a
model switch, and it did NOT pass first try.** The resumed seat had the
folder and reconstructed the state correctly, then **failed both owed
gates on their first invocation** — `boot:check` from the wrong cwd,
`health --readings` without its file. Both gaps are STATE's, both are
documentation bugs, and both are named in "Gates" above and fixed in the
regenerated STATE. **Recording a cold start that went badly is the only
reason the band is worth anything.**

**Drift incidents:** **0.** Method law changed once this window
(`orchestrator.md` at `bab20e4`) and it went through the ordinary route —
derived by a verifier, argued from the existing text, written at the
integration seat with no lanes live, four suites green afterwards. The
previous record's drift incident was the same file edited directly under
different conditions; this one is not that.

## Next

**`T-216-s1` is the first card of the next wave**, because it is the one
whose absence makes every other push gate advisory. Then the landing-gate
trio `T-222`/`T-223`/`T-224`, promoted two records ago and still unstarted.

**Thirteen cards are filed and none is started.** `T-229` and `T-230`
remain the two that pay for themselves — one prevents a rejection class,
the other prevents a dispatch class — and `T-229` just took a third
confirmation inside this very window.

**`triage/live-suggestions` is drifting for an honest reason**, and the
answer is triage rather than a band tweak.

**THE TRIAGE RIDERS, MOVED HERE FROM STATE BECAUSE THEY ARE A LIST THAT
GREW.** STATE now carries the mechanism (`T-225`, the byte ceiling) and
points here for the items. None of them is on `T-225`'s card — checked
rather than assumed, which is why they are written out rather than
pointed at:

- `T-112-s2`, `T-154-s3`, `T-159-s6` — carried dispositions awaiting a
  queue that can hold them.
- `T-154-s4`'s sentence — a one-line correction owed to that card.
- `T-173` and `T-176` — both owe a priority bump.
- **D5 is RULED but NOT ENFORCED** — no `--model` flag exists to enforce
  it with.

Three cards (`T-215`, `T-218`, `T-219`) still carry a recorded PROMOTE
that cannot be applied while the queue is at its ceiling. **They were
chosen by arithmetic, not by merit**, which is `T-225`'s whole finding.

## @human's desk

**Nothing new is asked here.** `T-203`'s cost is measured and accepted:
every push owes the four-suite battery, **364s warm this window**, and a
cargo-less checkout cannot push at all. One `git revert` of `b752ddd`
restores the old posture.

**One thing worth knowing rather than deciding:** this session's own
pushes have never been gated, because the seat runs from a stale worktree
(Environment, above). It changes nothing about the tree; it means the
local gate's catch record — one real defect — was never a fair test of it.

Unchanged and nobody else's: the **FORM** (reopened), the **STEERING
SPLIT** (`T-180` parked), `T-025-s4`'s three permission questions,
`T-162-s1`'s byte floor, `T-131`, and @human's eye on the interview's
ending at a narrow width.
