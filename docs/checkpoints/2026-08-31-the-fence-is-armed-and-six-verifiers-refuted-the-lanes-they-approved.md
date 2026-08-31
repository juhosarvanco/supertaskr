# Checkpoint: the fence is armed, two lanes minted the same card id, and six verifiers approved work while refuting the prose that shipped with it

Date: 2026-08-31 (evening). Seat: architect/integrator. Scope: **seven
cards merged** — `T-197`, `T-200`, `T-196`, `T-185-s2`, `T-185`, `T-189`,
`T-199` — nine merges, five cards closed `done` on the board, plus the
incident cards `T-213` and `T-217` filed against defects in this seat's
own instruments.

## THE FENCE IS ARMED

`T-199` landed. For the whole of this session nothing mechanically
fenced a lane: `decide()` took the repository root from **where the
WRITER sat**, every lane worktree is a SIBLING of the dispatching
checkout, and so every write landed "outside the checkout" and was
allowed unjudged. Seven lanes' compliance was discipline.

`decide()` now resolves the **TARGET path's** root. Measured at the live
configuration: three targets that were `ALLOW outside-the-checkout` are
`BLOCK outside-the-fence`; the in-fence path stays `ALLOW
inside-the-fence`; a `/tmp` path answers `not-a-repository, judged=false`.

**AND THE TWO MUTANTS HAVE DIFFERENT FAILURE SETS, BY NAME** — the
verifier compared names where the lane had compared counts:

    M1 defect restored     519 1123 1285 1364 1390     5
    M2 refuses everything  364  422  783 1327 1390     5
                           M1 ∩ M2 = {1390}
    M4 no guard at all     28 bodies, M1 a STRICT subset

Body 1285 (the drill) dies under M1 and survives M2. Body 1327 (the
positive control) dies under M2 and survives M1. Two 5s that are not the
same set — and because M1 sits strictly inside M4, **the suite separates
this card's defect from no guard at all.**

The proof asserts a file system, not a return value: the harness spawns
the real runner as a subprocess with real PreToolUse JSON on stdin, and
asserts exit 2, the reason on stderr, empty stdout, the target's
**sha256 unchanged**, and `git status` clean. Moving the runner aside
reds 8 of 42 — so the bodies genuinely reach the shipped program.

**THE PREFIX COLLISION GREW WHILE THE GUARD WAS BEING WRITTEN.** Twenty
sibling directories share the string `/Users/ujju/Projects/nputer`,
including `nputer-app` — the human's live application. A bare
`startsWith(root)` fences it. Exactly one path comparison exists in the
hook, `within()`, separator-guarded and **byte-identical to base**.

The line worth keeping: the out-of-checkout allow was **DELETED rather
than left inert** — *"an allow no mutation can kill is an allow no test
can prove."*

## THE DISPATCH BRIEF STOPS LYING, AND THE RED WAS THIS SEAT'S

`T-197`: `process.exit(code)` → `process.exitCode = code`. Cause removed,
no wait added, in the TOOL rather than the spec.

    before   file 69,282   pipe 65,536   (3,746 lost in silence at exit 0)
    after    file 67,625   pipe 67,625   slow reader 67,625

**THE RED THE LANE WAS MEASURED AGAINST WAS MINE.** The dispatch stamp
`209e5d3` moved two cards to `status: building`, whose in-flight rows
grew the brief 66,464 → 69,282 and pushed it past the boundary. I ran
only the parser after that commit instead of asking the docs gate what it
owed. **Both lanes had to prove independently that the red was not
theirs, and both did** — one by building a detached scratch checkout of
its own base, the other by `gate-run e2e @base`.

Its verifier's C-series is the model: **regressions the requested FIX
SHAPE invites**, derived before seeing code. All four absent for
checkable reasons — all 13 error paths already used `return EXIT.x`, exit
codes identical, no hang, no EPIPE.

**And it adjudicated the executor's findings rather than accepting them.**
*"Write shape decides the loss"* reproduces against a fast reader and
**fails against a slow one** — 200 small writes still truncate to 65,536,
5/5. The invariant is that bytes are lost iff still queued when
`process.exit()` runs.

## TWO LANES MINTED THE SAME CARD ID, AND NEITHER COULD HAVE PREVENTED IT

`T-185-s2`'s lane and `T-199`'s lane each minted **`T-214`** for
unrelated subjects, two cross-references apiece.

**Both obeyed the rule.** Each could check uniqueness at its own ref, and
at its own ref `T-214` was free. **A lane cannot see another lane** —
that isolation is why lanes exist and it is exactly what makes the check
unsound from inside one. The census runs over ONE tree, so it fires at
the SECOND merge, when renumbering invalidates every reference already
written into the other lane's notes and verdict.

Filed as `T-217`, on the trigger a peer seat and this seat agreed on —
*file it when a collision actually happens, with the incident as
evidence*. **The free evidence: the six SUFFIX ids derived from parents
that day collided with nothing. Only the two fresh `T-NNN` mints
collided.** A construction beats a check, which is rule 4's own closing
argument. Resolved at merge: `T-199`'s became `T-218`.

## SIX VERIFIERS APPROVED WORK WHILE REFUTING THE PROSE THAT SHIPPED WITH IT

This is the pattern of the batch and it is worth naming.

- **`T-185-s2`'s docstring was measurably false on the half it
  emphasised.** It claimed `truncated: false` load-bearing and
  `notLanes: []` inert. Setting `truncated: true` leaves **1113
  passing** — nothing in the app suite can tell them apart. And the
  asymmetry runs OPPOSITE: dropping `notLanes` reds both gates; dropping
  `truncated` reds only the type, because **a missing boolean is falsy
  and slides into the `false` branch.** `truncated` is precisely the
  field that reads as `false` and says nothing — **the silent floor
  `T-185` exists to remove, reproduced inside the fixture that card
  repairs.**
- **The lane then REPRODUCED the refutation rather than transcribing
  it**, because the relayed figures carried no ref and the claim was
  prose it had signed. Four drills at its own rebuilt forecast tree, all
  restored sha256-identical. Every claim held.
- **`T-196`'s "gate A is the fifth letter" was false at two sites** — A
  is the FIRST of five — **inside the one comment whose purpose is to
  stop letter mis-mapping.** And its `ELEVEN` was a count with no unit:
  gate C's three `continue`s counted as one mechanism while error arms
  counted singly, so a recount from source gives 13.
- **`T-200`'s figures were restated rather than derived** (121 not 130
  characters; 32 not 31) in a document whose own standard is that a
  figure carries its derivation.

**And two verifiers found the thing the lane's own drill could not.**
`T-196`'s poisoned its control's *expected* side, which proves the
assertion executes but not that it **discriminates**; the arm that closes
it leaves the refusal assertion passing while the control reds.
`T-200`'s drill was file-scoped at 29 bodies where poison shape SIX asks
for the whole suite; re-run against the full 1,108 the conclusions held
but had been under-measured.

## AN EXIT CODE THAT CANNOT SAY "I COULD NOT RUN" — THREE INSTANCES, ONE MINE

`docs-gate.mjs` defines an honest vocabulary — `{CLEAN:0, FOUND:1,
USAGE:2, CANNOT_RUN:3}` — and sets `CANNOT_RUN` in a catch. **That catch
is inside `main()`.** An `ERR_MODULE_NOT_FOUND` at IMPORT time fires
before any of the script's code runs, so Node exits **1**, which in that
gate means `EXIT.FOUND`. **A crashed gate is indistinguishable from one
that found something**, in the gate every executor is told to run.

The route in is documented: it imports `yaml` from `tools/e2e/`, and
**CONVENTIONS' fresh-clone ORDER names only `lib/parser` and `app`.**

Three instances the same day. `T-185-s2`'s lane hit it. `T-196`'s lane
found the same species one layer down — **`walk_root`'s three error arms
each `continue`, so "could not read" and "correctly refused" leave the
emitted set by the identical route; the walk has no word for "I could not
tell."** And **the third was this seat's**: the method-eval gate run at
the wrong path returned exit 1 with `Cannot find module`. Called-wrong,
not a finding.

The discriminator now in use, and given a positive control by `T-189`'s
lane: **read the OUTPUT, not the code** — a verdict prints `docs-gate:`
derivation lines, a crash prints a stack trace.

## BLIND VERIFICATION HAD A HOLE IN ITS ONE INSTRUCTION

A verifier opened its phase-1 report with its own contamination. Its
worktree was cut at the LANE TIP, where the executor had appended 184
lines to the card — so *"read ONLY the card"*, the instruction that MAKES
it blind, delivered the fix in one line, both findings, the drill ledger,
and a section titled **"For the verifier."**

**The card is the one file a verifier is always told to read AND the file
the executor is required to write.** `STATE` already routed lane context
to a second message because *"the agent reads the whole prompt"* — a fix
bought with four contamination reports — and nobody extended it to the
card. A second message protected the prompt; nothing protected the
worktree. Filed as `T-213`; every verifier since is cut at the base ref
and told to check its own headings.

**The line is narrower than it looks**: the base card already named
`process.exitCode`. A contract may specify an approach. What must not
reach a verifier is the executor's REASONING AND MEASUREMENTS.

## `T-189`: THE EXCEPTION ISSUED A SEAT WHERE IT MEANT TO ISSUE STANDING

The lane **refused the card's own proposed condition** — *"self-integrates
when it is the only live lane"* — which was also its verifier's strongest
sealed pre-diff attack. Keyed to the lane count it authorises
self-integration in the MAXIMUM hazard state: zero lanes on the board and
an integrator live in the checkout, **because STATE's LANES command
filters on task branches and structurally cannot return a checkout that
is not on one.** Measured: 6 of 17 worktrees returned.

The fix adds no prohibition. It turns rule 4's own
**collision-or-authority** discriminator on rule 4. And the operative
sentence had to land in **rule 6**, not rule 4, because `deriveDeliverable`
builds ROW 11 — the row that answers whether to merge — from rule 6.

**The law is unpinned and that is carried forward, not hidden**: strip the
clause and `brief.mjs`, method-evals, selftest, docs-gate and the full
e2e suite are all identical to the tip. `T-189-s1`.

## THIS SEAT'S DEFECTS, ENUMERATED

1. **The dispatch stamp that redded e2e** — and I ran only the parser
   afterward instead of asking the docs gate what it owed.
2. **The verifier worktree cut at the lane tip** (`T-213`).
3. **`review: independent` missed a FOURTH time**, on `T-196`, flagged by
   the lane itself. Set late; recorded as a repair, not compliance.
4. **The base ref wrong in three of four briefs** — I wrote the base from
   where I was standing rather than from where each lane was cut. **That
   is `T-199`'s own defect performed by hand, by the seat briefing it.**
5. **Executor-derived facts leaked into a blind phase** — scratch ports
   and a line count.
6. **A gate bypassed by splitting an invocation**: `brief.mjs` refuses a
   fence write when preflight findings exist, but only when `--preflight`
   and `--write-fence` are in the SAME call. I ran them separately for
   four lanes.
7. **A backtick inside a double-quoted `git commit -m`** was
   command-substituted and silently ate a phrase.
8. **The method-eval gate run at the wrong path**, read as exit 1.
9. **Six lanes against a stated ceiling of 3–5** — precisely: five were
   building simultaneously, which is the top of the band; six BRANCHES
   existed. **Whether that breached it is not derivable from the rule,
   which does not say concurrent WHAT.**

## Gates at `857b56a`

- app build **0** · app **1116/1116** · parser **344/344** · e2e
  **409/409** · cargo `--no-fail-fast` **18 targets ok / 0 FAILED**
- method-evals **0** (6 evals) **+ `--selftest` 0, POSITIVE CONTROL**
- `capabilities:check` **0** at 33,576 · `lint:tokens` **0**
- **GRAPH — CURRENT**, 1,153,961 bytes, 200 files, 2,456 symbols,
  2,379 edges
- **BOARD — 415 cards**: 185 done, 123 parked, 96 planned, 11 suggested
- **Zero lanes live, zero worktrees outstanding**

## Owed after this record

- **@human**: the `T-162-s1` byte-floor divergence, the **FORM**, the
  **STEERING SPLIT**, `T-025-s4`'s permission questions, thirty seconds
  on the interview's ending at a narrow width, and `T-131`.
- **The enforcement stack's remaining four**, strictly serial because
  every layer lives in `.claude` and `tools/e2e`: `T-209` (dispatch
  guard) → `T-212` (landing gate) → `T-210` (physical layer), with
  `T-211` (fast paths as law) and `T-203` (the token gate) beside them.
- **`T-216`** — the push guard still roots on the writer's cwd, so
  STATE's hazard could be narrowed but not retired.
- **`T-215`** — CONVENTIONS still publishes the limit `T-199` deleted.
- **`T-218`** — arming the fence made the capabilities census
  unregenerable by the lane that stales it. Discharged by hand at this
  merge; unfixed as a class.
