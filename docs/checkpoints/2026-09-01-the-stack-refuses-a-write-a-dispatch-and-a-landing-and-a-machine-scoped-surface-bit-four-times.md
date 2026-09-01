# Checkpoint: T-209 · T-208 · T-167-s9 · T-195 · T-127-s7 · T-167-s5 · T-212 · T-175 (2026-09-01, architect/integrator)

The second record of one continuous sitting. The first —
`2026-08-31-the-fence-is-armed-and-six-verifiers-refuted-the-lanes-they-approved.md`
— closed at `c63427c` with seven cards. This one covers the eight that
followed, `c63427c..b5da0ee`.

**What the window bought, in one sentence:** an out-of-fence *write* was
already refused when it opened, and by the end an out-of-fence
**dispatch** and an out-of-fence **landing** are refused too — three of
the four gates the enforcement stack names, built and verified in one
night, each one proved against real history rather than against a
fixture.

## Merge

Twelve merge commits, `c63427c..b5da0ee`, 49 files, +10,400/−430.

| card | merge | what landed |
|---|---|---|
| T-209 | `4cb2313` | dispatch guard: lane disjointness is COMPUTED, and an allow can no longer be a mechanism that failed to arm |
| T-208 | `b35b9fd` (+ `637a447` verdict) | `canonicalize` pinned, the escape proved with BYTES rather than a type |
| T-167-s9 | `89caa8b` (+ `5686bce` verdict, two riders) | transcript field set documented and pinned; the page's prose measured UNHELD rather than assumed held |
| T-195 | `13b0966` | the unasserted half pinned — after a rejection that found a table row claiming it already was |
| T-127-s7 | `fcdae0c` | the paragraph names derivations instead of carrying a count that would have been wrong a third time |
| T-167-s5 | `7a8a404` | the headroom alarm names what this tree SPENT; the count-of-one rule gains a refinement from a lane that refused to game it |
| T-212 | `8422407` (+ `ed77d32` verdict) | landing gate: nothing out-of-fence LANDS at either moment it could, run against **40 real merges** before it was believed |
| T-175 | `ad96c7d` (+ `7728540` verdict, addendum) | the cold-start spawn is a CONTRACT of the spawn — **and the card does not close** |

Disjointness was computed over EXPANDED PATH SETS at every dispatch in
this window, which is the first window where that sentence is true of a
tool and not of a seat's memory.

## Gates

All read unpiped, each redirected to its own file with `$?` captured
immediately, from a guarded script (`cd <abs> || exit N`).

    parser build       0
    parser             0     344/344
    app build          0
    app                0     1131/1131
    cargo              0     627 passed / 0 failed   (SUMMED across binaries)
    graph  index --check  0  CURRENT — 1,166,334 bytes, 200 files, 2495 symbols, 2388 edges
    e2e                0     443/443  (282.0s)
    docs census        0
    boot:check         0     window "main" created, tree stopped clean
    method-eval        0

**GRAPH, asked LAST** — re-asked after this record's write and after the
STATE replacement, and its verdict pasted below in the Dispositions
section rather than predicted here.

**HEALTH BANDS**, a reporter and never a gate, run with `--readings` over
this checkpoint's own captured cargo / graph / e2e output:

    health-bands: 14 band(s) — 8 inside, 1 drifting, 1 BREACHED, 0 unread, 4 UNKEPT
    exit 3

Exit 3 is the designed answer while any band is unkept. The census is
the part that moved, and two entries in it are news:

- **BREACHED — `docs-headroom/docs/STATE.md`.** 8,388 bytes against a
  warn line of 8,465: **77 bytes of headroom, 0.91% of the line.** This
  is the condition STATE's own contract exists for, and the remedy is
  the one the contract names — content MOVES to this record, and a
  hazard is never deleted to fit. Executed below.
- **drifting — `suite/e2e-seconds`.** 282s, above the 234s drift line,
  under the 312s breach line. Read off Playwright's own summary
  (`443 passed (4.7m)`), not off a wall clock around the command.

### The boot gate exited 1 and had not run

Worth stamping because it is the FOURTH instance of a class STATE
already names three of, and the second of them at this seat:

    Error: Cannot find module '.../tools/e2e/scripts/boot-gate.mjs'

I invented that filename. The gate is `npm run boot:check` →
`scripts/tauri-boot-check.mjs`. STATE's line — *"AN EXIT 1 MAY MEAN THE
GATE COULD NOT RUN … READ THE OUTPUT: a verdict prints gate lines, a
crash prints a stack trace"* — is what caught it, working exactly as
written, on the seat that wrote it. A stack trace is not a verdict, and
the correct gate then ran clean.

The transferable half is narrower than "check your paths": **I derived
every other figure in this window and typed this one.** `find` and the
`package.json` scripts block both answer it in one command.

## Suites

Every run above is declared with its count and its exit, including the
ones that agree. Two bodies are load-bearing by name in this window:

- **`brief-flush.spec.ts:337 THE MARGIN GUARD`** — redded a lane's final
  e2e because the machine's worktree list changed between its two reads.
  The lane did NOT re-run it. Filed as **T-220**.
- **`architecture-dogfood.test.ts:2309`** — the `["C-12","C-10","confirmed",6]`
  pin moved to 7 at T-200's merge, because an `import type` became a
  value import and the edge became real. A pin that moves for a reason
  is the pin working.

## Board

426 cards at this ref: **done 193 · parked 123 · planned 90 ·
suggested 20.** Seven closed `done` in this window's commits.

**Ten cards were FILED in this window**, every one of them from a
measurement rather than from an idea:

`T-167-s10`, `T-167-s11`, `T-167-s12`, `T-167-s13`, `T-175-s1`,
`T-219`, `T-220`, `T-221`, `T-223`, `T-224`.

Three deserve their reason recorded here:

- **T-220** — the margin guard versus a moving board. Filed by the lane
  that MET the red, refused to re-run it, and attributed it from a
  stable triple-read plus the worktree evidence. Confirmed at the seat
  **whose own dispatch was the cause**.
- **T-221** — `sharedDomain`'s separator is unpinned. Drop the `/` and
  nothing in the repository reds; `tools/e2e` would then contain
  `tools/e2e-helpers`. It had one consumer when a verifier raised it and
  has **three** now, so a silent regression there re-creates rule 5's own
  six-for-six measurement **using the tool built to end it**.
- **T-213** — I cut a verifier's worktree at the LANE TIP, where the card
  carried 184 lines of executor notes including a section addressed to
  the verifier. Blindness broken by the seat that owns it.

## Environment

Stamped with the clock, 2026-09-01, re-derived never:

- **All lane and bench worktrees removed.** Eight taken down at this
  checkpoint, including the two T-175's verifier left standing on
  purpose (`nputer-V-175` and `V-175-scratch/bench`) with an explicit
  handover: *removing one mid-flight is the T-220 red from the other
  direction.* Seven entries remain, none of them a task branch.
- **Port 1420** read only with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
  throughout — never bind-probed, never connected. The boot gate's own
  spawn took it and released it.
- No leftover Playwright or tauri processes; scratch port 15175
  released by its verifier.

## What the brief got wrong

The standing section, and this window earned it four times over.

**1. "Disjoint at file level, not just at `touches:`" — asserted, and
false.** `push-guard.mjs:68` imports five symbols from `lane-fence.mjs`.
T-199 and T-203 were never disjoint. I said it, then measured it, then
serialised them.

**2. The base ref was wrong in three of four briefs.** I wrote where I
was standing rather than where each lane was cut. **That is T-199's own
defect, performed by hand, by the seat briefing the card that fixes it.**

**3. My T-209 acceptance criterion 3 would have built a guard that
PERMITS.** `alwaysWritable` is a constant across manifests, so an
additive participation rule refuses every dispatch and a subtractive one
silently removes real overlaps. The lane found it; the criterion was
mine.

**4. My scratch intersector had the live lane list HARDCODED** — the
derive-don't-type defect, inside the tool built to enforce deriving.

And the sharpest one, because it repeated:

**MY ADVICE WAS A STRICT SUBSET OF THE RIGHT ANSWER THREE TIMES IN ONE
NIGHT.** *"A mutant's landing is decided by `git diff`"* — true, and
`--numstat` cannot see a one-for-one swap. *"Derive your own port"* —
correct, while I was naming the lane's port in the same sentence.
*"Set-difference rather than count"* — correct against a count, and
still insufficient, because a worktree entry MUTATES IN PLACE: T-212's
verifier read 15 entries and an empty path-set difference across a read
where `nputer-V-167s5` left at `7b712c1` and returned at `d17258e`.
**Only whole `git worktree list` lines, commit column included, can see
it.** Each time the correction came from the agent I had advised.

## THE FINDING OF THE WINDOW: ONE SURFACE BIT FOUR TIMES

`lane-protocol.md` rule 4 names it — *"surfaces scoped by the MACHINE
instead: a port number, the host's list of worktrees … the collision
probability rises with parallelism and nothing warns."* It is written,
it is correct, and it was read by every seat that then walked into it:

1. **`git worktree list`** in the margin guard — a GATE colliding with
   the DISPATCHER, which is the same surface and a party the rule's
   sentence does not mention (T-220).
2. **The e2e port**, where a default is a machine-scoped name and
   `E2E_PORT` binds nothing.
3. **A shared scratch filename** between two concurrent benches.
4. **`pgrep -f playwright`** — T-175's verifier's own waiters hung
   forever, because they were matching *sibling lanes'* Playwright
   processes and could never exit while any other lane ran e2e.

That verifier drew the line the rule was missing, and it is the sentence
this record exists to carry:

> **I reached for a CHECK when the CONSTRUCTION was available.**

A check asks the machine a question whose answer includes every other
tenant. A construction — a port derived from the card id, a completion
marker owned by the job, a worktree list snapshotted once — cannot see
another tenant at all. Every one of the four is a check where a
construction was available, and the fix in each case is not a better
check.

## TWO METHOD RULES CHANGED, BOTH BY MEASUREMENT

**Poison drill shape SIX has a discriminator.** Two lanes acted
oppositely on the same night — one collapsed two assertion bodies, one
refused — and both were right. T-175's verifier settled it by mutating
both declarations to a single parser-hostile value: the comparison
passed, the split failed, so the comparison's kill set is strictly
CONTAINED in the split's.

> **Kill-set containment, not the count.** Neither set contains the
> other → both bodies are load-bearing. One contains the other → the
> contained body is a restatement. **A count of one is a property of a
> well-chosen mutant, not an invariant every mutant must satisfy.**

**The three-proof rule is sharpened where it was weakest.** I had
synthesised this window's harness findings as *the bytes moved, the
suite ran, something died.* The verifier's own first mutant satisfied
all three literally and measured nothing — the site it mutated was not
load-bearing for the property it aimed at:

> Something died **AT THE SITE THE PROPERTY LIVES**. The failure mode is
> **aiming**, not accounting.

A related disagreement resolved the same way: two agents got different
kill counts from "the same" mutant, and the difference was the mutation
SITE, not the tree — the derivation reds 2 (it feeds both the `is_dir`
guard and the child's cwd), the use reds 1.

## THE BLIND-PHASE LEAKS, AND WHY THE FOURTH ONE ENDED THEM

Four leaks into blind verification phases in this sitting: lane ports,
card line counts, tip lengths, shipped-code knowledge. The root cause
only became visible on the fourth:

**I was naming the lane's port so the verifier would pick a different
one — but the construction (card id + verifier offset) already solves
that, without telling the verifier anything.** The leak was not a
trade-off badly struck. **It bought nothing.** It is the same finding as
the section above, arriving from the other side: I reached for a check
(tell them what is taken) where a construction (derive a port that
cannot be taken) was available.

The protocol that holds: the attack set is written and hashed from the
CONTRACT before the diff is opened, and **lane context goes in a SECOND
message** — a "blind line" inside one message is not blindness, because
the agent reads the whole prompt.

## T-175 CLOSED `done` WITH ITS PURPOSE UNMET AND NAMED

Stamped in the merge commit and on the card, because a `done` stamp must
not hide it:

> **A PERSON FINISHING AN INTERVIEW STILL CANNOT RUN THE COLD-START
> TEST.**

Everything the lane's fence could reach is built, pinned and verified;
criteria 1 and 3 remain half, with the render and the command
registration routed to `T-175-s1`. The scope is discharged and the
purpose is not, and those are two different sentences that a single
status field cannot say at once.

## Tooling traps — MOVED HERE FROM STATE, NOT DELETED

STATE breached its byte band at this checkpoint (77 bytes of headroom,
0.91% of the warn line), and its contract's remedy is that content MOVES
here. These five are stable, long-lived and were costing STATE ~500
bytes it needs for live hazards. STATE keeps a pointer to this heading.

- **This shell's `grep` is a shim** carrying `-I` and rejecting
  `--include`. Use `command grep`. Sweep NULs with `perl -0777`.
- **An edit script's success is a GATE, not a step** (`18d8166`): never
  chain a commit after a scripted edit — read the diff back first.
  Broken twice in 24 hours, once by the seat that had just written the
  rule down.
- **Scratch worktrees: SHORT root, detached, own `CARGO_TARGET_DIR` at
  `<scratch>/target`, stem DERIVED from the card id** (T-133-s5). The
  parent directory is shared between sessions, and a VERIFIER cuts its
  own because a bench carries artefacts. This is the CONSTRUCTION half
  of the machine-scoped-surface rule above: a derived stem cannot
  collide, so nothing needs to check whether it has.
- **The RANGE RULE decides which two commits "the merge's diff" means**
  (CONVENTIONS) — the integrator's pair and the executor's differ, and
  a review that reads the wrong pair reviews the wrong change.
- **A PUSH CANCELS THE RUNNING CI JOB** — four superseded overnight by
  one seat's rapid pushes. Commit stamps freely; batch the PUSH.

## Metrics (ADR-020)

Five stamped lines. Silence is not one of the answers.

**Rework cycles:** 3 across 8 cards — T-195 (rejected once, on a
verifier finding that a table row already claimed the assertion),
T-167-s9 (one correction round plus two riders), T-212 (one correction
round). Five cards went dispatch → APPROVED with no fix pass.

**Tokens:** *partially derivable here.* T-175's verifier is metered at
**331,085** with 112 tool uses over 83 minutes, read off its own task
notification. The other seven lanes' and verifiers' meters were not
readable from this seat — their notifications are consumed and the
sessions are closed — and the integrating seat's own meter spans this
window plus the previous record's, so it cannot be attributed to either.
Read 2026-09-01 at the checkpoint. **This line is a documentation bug
against the dispatch ritual: a meter reading must be captured at the
moment the lane reports, or it is unrecoverable.** Routed below.

**Gate runtime:** the gate set above, wall-clocked as one guarded script
run at this checkpoint: **≈11 min** for parser build + parser + app
build + app + cargo + graph + e2e + docs census + method-eval, with e2e
at **282.0s** of it (Playwright's own figure) and cargo the next
largest. Boot gate a separate **≈1 min** including the failed invocation
that could not run. Sum ≈**12 min** — `machinery/gate-seconds`' only
reading, which is why it is written here and not left to a scanner.

**Cold start:** this session was a **context compaction**, not a model
or session switch, and it is the honest answer that a compaction is a
WEAKER test than a cold start — I retained the working set and only lost
the transcript. It passed on the retained summary. **Two gaps had to be
asked of the tree rather than recalled**, and each is a documentation
bug by this section's own rule: (1) the boot gate's real path, invented
rather than derived, above; (2) `sharedDomain`'s three call sites, which
I had to re-read to state correctly. Both are now written where the next
reader meets them.

**Drift incidents:** **1.** Dated 2026-08-31 — the verifier worktree cut
at the LANE TIP, which broke blind verification by handing the verifier
184 lines of executor notes including a section addressed to it. Caught
by the integrating seat mid-window, filed as **T-213**, and every
verifier cut since has been taken at the BASE REF. Contradicts
`method/roles/verifier.md`'s blindness clause, not NORTH_STAR.

## Dispositions

- **Eight cards stamped `done`** (T-209, T-208, T-167-s9, T-195,
  T-127-s7, T-167-s5, T-212, T-175 — the last with its purpose named
  unmet).
- **Ten cards filed**, listed under Board above.
- **T-214's id collision resolved** — two lanes minted it independently;
  renumbered to **T-218**, with **T-217** filed on the trigger.
- **Rule 5 applied by name** at every dispatch in this window, over
  expanded path sets, and computed by `T-209`'s guard rather than
  asserted.
- **Fast path A performed by hand** for T-195's mid-flight widening, and
  it turned out to be **TWO integration acts, not one**: the hook reads
  the card's `touches:` from the LANE worktree, so the amendment has to
  reach the lane branch as well as main. Written down because the fast
  path's text describes one act.
- **`review: independent` missed a fourth time** (T-196), flagged by the
  lane itself and set late. Recorded as a repair, not as compliance.
- **The dispatch ritual is SERIAL and this window proved why**: I cut
  four worktrees and then fenced them, and T-209's guard refused all
  four — *"an unread fence is not 'disjoint from everything'"*. Cut one,
  arm it, read the manifest back, then cut the next.
- **STATE replaced from `docs/STATE-template.md` in this same commit**
  (ADR-019 rule 4), with the breach above discharged by MOVING content
  here rather than deleting it: the machine-scoped-surface class, the
  four instances, the leak analysis and the two method rules all live in
  this record now, and STATE keeps the MECHANISM with a pointer.

### The next dispatch, and why

The enforcement stack stands at three gates of four: a **write** is
refused (T-199), a **dispatch** is refused (T-209), a **landing** is
refused (T-212). Remaining, in order, and this is the queue:

1. **T-203** — the green-token push gate. Ready. Closes the hole STATE
   names in as many words: *a gate read before a commit does not catch
   what the commit creates.*
2. **T-211** — the fast paths as law. Unblocked by T-212. Fence-disjoint
   from T-203, so these two are the only pair in the chain that may run
   concurrently.
3. **T-210** — the physical `chmod` layer. Unblocked by T-212, collides
   with both above on `.claude`, so it serialises last.

Then **T-221** before any further card touches `sharedDomain`, because
three gates now rest on one unpinned character.

**A meter-capture line is owed to the dispatch ritual** — see `Tokens:`
above. Whoever writes it should note that the reading must be taken when
the lane reports, because the notification is the only place it exists.

## @human's desk, untouched by any seat

No card is cut from these and none was: the **FORM** (reopened), the
**STEERING SPLIT** (T-180 parked on it), **T-025-s4's three permission
questions**, **T-162-s1's byte-floor divergence**, **T-131**, and
**thirty seconds of @human's eye on the interview's ending at a narrow
width** — jsdom applies no breakpoints, so no suite in this repository
can answer it.
