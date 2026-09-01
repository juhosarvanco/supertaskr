# Checkpoint: T-216-s1, and the seat the catcher caught (2026-09-01, architect/integrator)

`06ca1c5..cf9d462` — one merge, 26 commits, 15 files, +3,620/−15.

**One card, and it found the seat that dispatched it.** `T-216-s1` built a
catcher for sessions running out of stale checkouts. Its sweep named
`adoring-nash-028cf4 @ 4ec229c` — **this integrator's own project
directory, 355 commits behind, with no push-guard hook registered** —
among six stale of nine, unprompted, without being told the path existed.

**And the window's other half is that main went RED TWICE, both mine,
both after a local battery said all four suites green.**

## Merge

| card | merge | verdict |
|---|---|---|
| T-216-s1 | `c0a221c` | APPROVED at `aff1616` after ONE rejection |

## Gates

    parser  349   app  1131   rust  631/18   e2e  535     all GREEN at cf9d462
    boot:check  exit 0        graph  CURRENT — 1,166,334 bytes, 2495 symbols
    CI          two RED, both repaired; cf9d462 unconfirmed at writing

**HEALTH BANDS** — a reporter, never a gate:

    health-bands: 14 band(s) — 6 inside, 3 drifting, 1 BREACHED, 0 unread, 4 UNKEPT

`suite/e2e-seconds` breached at **372s** against a 312s line, up from 342s;
the suite grew 503 → 535 bodies and all 32 are this card's. STATE (4.78%)
and CONVENTIONS (3.72%) both drift, both worse than at the last record,
both paid for deliberately — this window put two new rules and a new
hazard into those documents.

## THE REJECTION IS THE WINDOW'S BEST FINDING

`CLAUDE_PROJECT_DIR` is exported to **hook commands** and not to **Bash
tool calls**. Verified at this seat, in its own session: `env | grep -c` =
**0**. The first build read that variable and nothing else, so the arming
step a seat *types* took the "nothing declared" branch every time, and the
only path to a STALE verdict ran through a fixture.

**And the spec pinned that branch — using the unset-variable
configuration, which IS production — as correctly catching nothing.** The
suite would have stayed green forever while the arm never fired.

> **A correct catcher that is called and always declines.** The card exists
> to end *"a correct catcher that nothing calls"*; the first fix landed one
> level up its own subject.

### THE LANE REFUSED THE ROUTE ITS DISPATCHER OFFERED, AND WAS RIGHT

Offered an explicit `--session-checkout` flag, it declined: **a flag asks
the party under test to declare the property under test, and a seat
working out of a stale checkout is exactly the seat that does not know it
is.** Instead `sweep()` asks a different question — *which checkouts of
this repository on this machine load stale guards* — off
`git worktree list`, so the session is in the answer BY CONSTRUCTION.

The verifier's summary: *both of mine tried to NAME the session, and
naming is the thing that can be wrong. The sweep doesn't need a name.*

## TWO REDS ON MAIN, BOTH AFTER A GREEN LOCAL BATTERY

**1. A machine-scoped surface, on the one rule names as its example.**

    checkout-currency.spec.ts:968
    Expected: > 1     Received: 1
    "git reports at least this lane and the integration checkout"

The assertion's own message is the diagnosis: it assumed a LANE exists.
This machine holds 7 worktrees; a runner checks out **1**. It was green in
the lane, green at the verifier's bench and green in the integration
checkout **because all three are this machine.** `lane-protocol.md` rule 4
names *"the host's list of worktrees"* verbatim as a machine-scoped
surface, in the same sentence as the port.

Repaired as `>= 1` rather than by constructing a worktree, because the
substantive claim is already proven by construction one body up, and CI
itself proved the arm-time half works on a single-checkout machine — it
passed both earlier assertions before failing on the count.

**2. A test rename without the CAPABILITIES regen** — `T-216-s2`'s exact
prediction, filed by this card's own executor hours earlier, hit by the
integrating seat while fixing red #1. **Third confirmation of that class
in one day.**

## AND MY OWN TRIAGE REDDENED THREE SUITES

    const isMinimal = status === 'suggested' || status === 'parked';
    const requirePlacement = statusKnown && !isMinimal;

Placement fields are required only ABOVE the minimal statuses. A stamp
touching nothing but `status:` made four other fields mandatory.

**I had already checked this and got it wrong**: asked *"do all cards carry
`size`?"*, saw 119 that do not, concluded optional, and explicitly decided
not to flag the lane's card. **The right question was "is `size` required
for the status I am ABOUT TO WRITE?"** — validating against the current
tree rather than the tree the write creates.

**The docs gate then confirmed the wrong answer**, over the exact tree the
parser called red: *"0 frontmatter issue(s) … every live task card's
frontmatter parses."* Filed as `T-235`.

## THE FIGURE CLASS: FIVE INSTANCES ON ONE CARD, EACH BY THE SEAT THAT HAD
JUST CORRECTED THE LAST

the criterion typed `344` · the table written to correct it · the audit
block preceding both · **a count measured at `~1` and shipped at the
commit, the delta being exactly the commit carrying the sentence** · a
bare `main` inside the table demonstrating that a census IS pinnable.

**Instance 4 forced the CONVENTIONS rule** — three surviving forms: both
endpoints pinned, the derive command with no answer beside it, or
omission. **Instance 5 forced its generative half**, derived by the
verifier and the most reusable sentence of the day:

> **`main` is the natural way to write "and it is still true NOW", and
> "now" is the one thing a committed document cannot hold.**

## THE VERIFIER CORRECTED THE INTEGRATING SEAT FOUR TIMES, ALL RIGHT

criterion numbering · the stale demonstration table · an over-general
pinnability claim · a bare `main` in the pinnability table. **Two of the
four were figures in documents written to warn about figures in
documents.** It also amended its own verdict after being told it need not,
because *a correction of record that lives only in a channel is how a
false sentence survives in a document* — and re-ran its bench figures
rather than accept them after another seat's script ran there, because
agreement at the same ref is precisely the case rule 4 calls invisible.

## Board

**441 cards: done 200 · parked 123 · planned 94 · suggested 27.** No lanes,
no benches. Filed this window: `T-231`, `T-232`, `T-233`, `T-234`, `T-235`,
plus the lane's `T-216-s4` (promoted) and `T-216-s5` (closed at the merge).

## Environment

**The dispatching seat ran this entire window from
`.claude/worktrees/adoring-nash-028cf4` at `4ec229c`, 355 commits behind,
registering only `Edit|Write|NotebookEdit` and carrying no
`push-guard-hook.mjs`.** Every push it described as gated was ungated. It
compensated by running the battery by hand — the exact substitute the
guard exists to replace.

## Metrics (ADR-020)

**Rework cycles:** 1 — one REJECTED verdict, repaired in one pass.
**Tokens:** executor ~648K across two passes, verifier ~320K. Captured
from the notifications as they arrived, which is the only place they exist.
**Gate runtime:** the closing battery ~6m10s warm (parser 1.5s, app 6.5s,
rust 14.4s, e2e 372s), run six times this window. `machinery/gate-seconds`'
only reading: **370s**.
**Cold start:** this window opened after a compaction and did **NOT** pass
first try — `boot:check` from the wrong cwd, `health --readings` without
its file. Both were STATE's own half-spellings; both fixed at `06ca1c5`.
**Drift incidents:** **0.**

## Next

**`T-216-s4` before anything else** — three of four suites are red inside
ANY lane fence, so **no lane can currently measure its own battery** and
the integrator does it by hand. It is the card that makes the others
measurable. Then `T-235`, `T-233`, `T-231`, `T-234`, `T-232`, and the
landing-gate trio `T-222`/`T-223`/`T-224`.

**Fourteen cards are filed and unstarted**, and
`triage/live-suggestions` is drifting at 27 for exactly that reason.

## @human's desk

Unchanged and nobody else's: the **FORM** (reopened), the **STEERING
SPLIT** (`T-180` parked), `T-025-s4`'s three permission questions,
`T-162-s1`'s byte floor, `T-131`, and @human's eye on the interview's
ending at a narrow width.

**New, and worth one look:** this seat's own pushes were never gated all
day (Environment, above). It changes nothing in the tree — the battery ran
by hand every time — but the local push gate's catch record was never a
fair test of it.
