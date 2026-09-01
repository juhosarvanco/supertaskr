# Checkpoint: T-221 · T-211 · T-203 (2026-09-01, architect/integrator)

The third record of one continuous sitting. `9d56b47..5a0224e` — three
lanes, three blind verifications, **two rejections**, 29 commits, 38
files, +4,716/−116.

**What the window bought:** the enforcement stack is closed at every gate
but one. A **write** is refused (T-199), a **dispatch** is refused
(T-209), a **landing** is refused (T-212), and now a **push** is refused
(T-203) — with the two fast paths written into law (T-211) only after the
guards that make them safe existed. `T-210`'s physical layer is the
remainder.

## Merge

| card | merge | verdict |
|---|---|---|
| T-221 | `63dd4c5` | APPROVED first pass |
| T-211 | `736aba6` | REJECTED, rebuilt, APPROVED |
| T-203 | `b752ddd` | REJECTED, rebuilt, APPROVED |

Every lane was dispatched against a fence **T-209 computed**, not one
this seat asserted — the first window where that sentence is true of a
tool at every dispatch.

## Gates

Read unpiped, redirected, `$?` captured immediately.

    parser        349/349      (344 at the window's start)
    app          1131/1131
    cargo         631 bodies / 18 targets, 0 failed
    e2e           479/479      (443 at the window's start)
    graph         CURRENT — 1,166,334 bytes, 200 files, 2495 symbols, 2388 edges
    method-eval   0, six evals
    docs gate     verdict, budgets hold, every card's frontmatter parses

The final battery ran through `gate-run --all` at `5a0224e` and minted
the token that then judged this record's own push. **The gate installed
in this window gated the push that shipped it.**

**BOOT GATE** — `npm run boot:check` exit 0, window created, tree stopped
clean. (The gate is `boot:check`; `boot-gate.mjs` does not exist, and
this seat invented that filename earlier in the sitting.)

**HEALTH BANDS**, a reporter and never a gate, run with `--readings` over
this checkpoint's own captured cargo / graph / e2e output:

    health-bands: 14 band(s) — 7 inside, 3 drifting, 0 BREACHED, 0 unread, 4 UNKEPT
    exit 3   (the designed answer while any band is unkept)

**The breach is cleared and the census is the news.** Last record: 1
BREACHED, 1 drifting. Now zero breached — but **three drifting, and two
of them are this window's own doing**:

- `docs/STATE.md` 6.15% of its warn line — out of breach, into drift.
- `docs/CONVENTIONS.md` 7.44% — **it was not drifting before.** Re-homing
  the rules there is what moved it.
- `suite/e2e-seconds` at **306s** against a 312s breach line, up from
  282s. The 36 new bodies cost that.

**So the re-homing was right and it was not free.** A mechanism's home is
a governing document, and CONVENTIONS was the only one with room — but
"room" was 13.8 KB and this window spent a third of it. The next seat to
apply this rule should know it is spending a budget, not discovering a
free one, and `T-162-s1` (@human's, on the proportional warn line) is the
card that governs whether that budget is the right shape at all.

## THE FINDING OF THE WINDOW: THREE CONTROLS DEGENERATED TO THEIR SUBJECTS

Each was found by a different agent, at a different layer, and none by
the body it was supposed to protect.

**1. `T-203`'s gitignore control, and it is the cleanest.** The card
requires the token be non-committable; a body asserted it with
`git check-ignore`, using a tracked path as its control. On a fresh clone:

    check-ignore token    -> 1   (the body expects 0)
    check-ignore control  -> 1

**The assertion and its own control returned the same value** — the exact
condition a control exists to rule out. `.nputer/.gitignore` is written
by the FENCE writer at DISPATCH time, so non-committability was a
property of *having been dispatched as a lane* — and the integration
checkout, where pushes happen, is never armed as one. **No mutant the
lane could plant would have reached it**: the body is green in an armed
worktree by construction.

**2. `T-221`'s fixture guard, in the opposite direction.** Its kill set
was contained in another body's under every code mutant, which reads as a
restatement. The verifier planted a **DATA mutant** — changing the
`touches:` of the card the fixture derives from — and it killed exactly
one body, making the set uncontained.

> Where a body exists to prove a fixture is DERIVED rather than typed,
> the mutant that tests it is a mutation of the DATA, and a code-only
> drill will always mis-grade it as redundant.

**3. `T-211`'s positive control, claimed for a state never measured.**
The law said the card's own file stayed writable *throughout* a
half-performed widening. Driven against `decide()`, in that state
everything blocks — including the card, including a fresh suggestion
file. And both passages prescribe ROUTING as the remedy, which is a write
under the refused directory. **The law told the reader to perform a
remedy that is unperformable in exactly the window it describes.**

**The common shape:** a control is only a control where the arming
differs. All three were green because the thing that made them pass was
the same thing that made their subject pass.

## Suites

`gate-run.spec.ts:624` is load-bearing by name and caught the seat that
merged it. It pins `docs/CONVENTIONS.md` to name the runner in EXACTLY
one place — `occurrences(...) === 1`, not `toContain` — and its comment
says why: *"ADDING a competing second spelling survived, which is what
proves a matcher is containment."*

That body did double duty. `T-203` could not edit CONVENTIONS (outside
its fence), so **the spec enforces the integrator's owed edit**: before
the bullet was written the token was named zero times. Then it caught the
bullet for introducing a second spelling of the string it pins —
`VERDICT_TOKEN` is the bare substring, not the filename, and the T-202
bullet already carried one. **Strengthened for this failure mode, then
met by it, four minutes after being merged.**

## Board

429 cards: **done 196 · parked 123 · planned 93 · suggested 19.** No
lanes, no benches, nothing outstanding.

**Filed this window:** `T-225`, `T-226`, `T-227`, `T-228`, plus the
lane's own `T-211-s1`. **Corroborated rather than duplicated:** `T-217`
(the defaulted e2e port), `T-146` (a rule that lives only in records),
`T-211-s1` (the tree-oid spelling).

**The triage sitting owed since the last record is part-done, and the
reason it is only part-done is on the board.** Seven sound cards, every
blocker landed; four promoted, three HELD — and the three were chosen by
ARITHMETIC, not judgement. Promoting all seven costs 4,515 bytes and
leaves 290 of the 64 KiB dispatch buffer. Each held card carries a dated
paragraph saying its disposition is PROMOTE and naming the reason it is
not applied, because **a card held by a byte ceiling looks identical on
the board to one triage declined.** Filed as `T-225`.

## Environment

Stamped 2026-09-01, re-derived never. All lane and bench worktrees
removed; seven entries remain, none a task branch. Port 1420 read only
with `lsof -nP -iTCP:1420 -sTCP:LISTEN` throughout. Each lane ran on a
port DERIVED from its card id (15203/15211/15221) after a correction
mid-flight — see below.

## What the brief got wrong

The standing section, and this window's entries are all the dispatcher's.

**1. "NOTHING GATES THE PUSH YET" — false, and propagated into FOUR
carriers.** `.claude/settings.json` registers a push guard on
PreToolUse/Bash; the guard's own header reads *"The ONLY refusal is a
check that ran and answered 1."* A push was already gated on a stale
graph and a blocked landing, failing open elsewhere BY DESIGN. This seat
asserted the false half in `docs/STATE.md`, in the previous checkpoint
record, in `T-211`'s dispatch brief, and in `T-211`'s **verifier
prompt**.

**Caught by a blind verifier in its PHASE 1, before it had seen any
diff.** The blind phase caught a defect in the DISPATCHER rather than in
the lane it was cut to judge. That is not what the blind phase is for and
is the strongest argument for it yet recorded here.

**2. The port default, corrected mid-flight.** Three lanes were told to
derive a port from their card id — correct and insufficient, because the
e2e harness DEFAULTS 14520 for every checkout and ignores the
derivation. The brief named the machine-scoped class in its own words and
then handed three lanes a default that violates it. **The brief checked
that the lanes knew the rule and never checked that the tooling obeyed
it.** Corroborated onto `T-217`.

**3. THE INVENTED PATH, THREE TIMES.** `boot-gate.mjs` (does not exist;
the gate is `npm run boot:check`), the method-eval cwd, and
`.claude/hooks/gate-run.mjs` (it lives at `tools/e2e/scripts/`). **The
third shipped INTO A VERIFIER'S BRIEF**, so an agent spent part of its
blind phase correcting its own instructions — in a session whose entire
subject is deriving rather than asserting.

**4. The ritual inversion I recorded as harmless.** I cut three
worktrees before stamping their cards, reasoned correctly that rule 7
gave the guard the lane list anyway, and wrote *"a dispatcher who only
notices the inversions that cost something will keep making the ones that
do not."* It cost a three-way merge conflict in **all three lanes** —
base `planned`, main `building`, lane `verifying` — confirmed four times.
Filed as `T-226`, and the correction came from the first lane to report.

**5. An over-correction, which is still a wrong figure.** I relayed a
CAPABILITIES byte count without its ref, was correctly told a ref-less
figure is unusable, and then over-corrected by calling the VALUE wrong.
All three figures were right at three different refs. **A correction that
overshoots is a defect in the same log.** The same thing happened to my
own `T-146` corroboration, corrected in the section below.

## Metrics (ADR-020)

**Rework cycles:** 2 of 3 cards rejected once each (`T-211`, `T-203`);
`T-221` approved first pass. Every rejection was repaired in one round.

**Tokens:** per-lane meters read from their own notifications —
executors 349,929 / 289,287 / 202,393 and verifiers 249,779 / 267,432 /
131,968 across `T-203` / `T-211` / `T-221`, summing to **1,490,788** for
six agents, plus an integrating seat whose meter spans this window and
the previous record and cannot be attributed to either. **This is the
line the last record said was unrecoverable**; it is recoverable now
because the notifications were read as they arrived, which was that
record's own routed remedy applied.

**Gate runtime:** the closing battery through `gate-run --all` ≈**22
min** wall clock (e2e ≈5 min of it, cargo the next largest), run twice —
once red, once green — plus a targeted spec re-run ≈4 s. `machinery/gate-seconds`'
only reading, which is why it is written here.

**Cold start:** not applicable — one continuous session, no switch. The
honest note is that a compaction is a weaker test than a cold start and
this window contained none.

**Drift incidents:** **1.** Dated 2026-09-01 — `T-203`'s card opens by
asserting `docs/CONVENTIONS.md` already says a rule it has never said
(zero occurrences at base and tip). The rule is real, earned at
`18d8166`, and lived only in append-only records. Caught by that card's
blind verifier; carried to `T-146` as a corroboration, and closed here by
WRITING the bullet.

## Dispositions

- **Three cards `done`**; four filed; three corroborated rather than
  duplicated, per TASK-FORMAT's rule that a second instance belongs on
  the card that owns the class.
- **`docs/CONVENTIONS.md` gained five rules that existed only in
  records** — the token gate, the edit-script gate, the `grep` shim, the
  CI-cancel rule, and (already present) the RANGE RULE and
  scratch-worktree construction. `docs/STATE.md` now points at
  CONVENTIONS for them rather than at a record.

  **That applies `T-146`'s finding rather than restating it**: a
  MECHANISM belongs in a governing document, a record takes the INSTANCE,
  and STATE is byte-capped so it cannot house a stable rule. CONVENTIONS
  had 13.8 KB of headroom the whole time, while STATE was shaved seven
  times in one night.

- **A self-accusation corrected.** This seat wrote that moving five
  tooling rules out of STATE into a record had buried them. `T-203`'s
  verifier was asked to test that rather than accept it, and supplied the
  discriminator: **a move that leaves no pointer converts a rule into an
  archive entry.** That move left an itemised one. The edit-script rule —
  which never had a governing-document line at all — is the real
  instance.

### The next dispatch

**`T-210` alone.** It collided with both live lanes all night on
`tools/e2e` and `method/lane-protocol.md`; with the board empty it is
startable, and it is the enforcement stack's last card. **Then `T-216`**
(the push guard roots on the writer's cwd), then the landing-gate trio
`T-222`/`T-223`/`T-224` promoted in this window's triage.

`T-225` gates the rest of that triage: three sound cards carry a recorded
PROMOTE that the dispatch buffer cannot hold.

## @human's desk, untouched by any seat

**And one item is now urgent enough to name first.** `T-203` changes how
every push in this repository behaves: the full four-suite battery is
owed, run LAST, and **a checkout without cargo cannot push at all.** That
is the card's deliberate design, disclosed at every refusal, and its
verifier graded it defensible — but it is `push-guard.mjs`'s own
*"expensive enough that it gets turned off"* case arriving in practice,
and it changes @human's workflow rather than a lane's. **One `git revert`
of `b752ddd` restores the old posture.**

Unchanged and still nobody else's: the **FORM** (reopened), the
**STEERING SPLIT** (`T-180` parked on it), `T-025-s4`'s three permission
questions, `T-162-s1`'s byte floor, `T-131`, and @human's eye on the
interview's ending at a narrow width — jsdom applies no breakpoints, so
no suite here can answer it.
