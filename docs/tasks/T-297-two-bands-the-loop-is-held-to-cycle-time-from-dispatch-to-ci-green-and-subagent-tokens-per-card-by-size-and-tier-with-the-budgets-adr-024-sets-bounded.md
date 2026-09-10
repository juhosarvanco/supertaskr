---
id: T-297
title: Two bands the loop is held to — cycle time from dispatch to CI green and subagent tokens per card, by size and tier, with the budgets ADR-024 sets (bounded 20 min/80K, standard 75 min/310K, guarded 100 min/450K), fed by the meters the arm appends at every merge and read at every checkpoint
feature: F-06
milestone: 4
size: S
tier: standard
priority: 2
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-295]
touches: [tools/e2e/scripts/health-bands.mjs, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts, docs/CONVENTIONS.md, docs/checkpoints/TEMPLATE.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Nothing measures the loop's cost; the health bands watch file sizes and triage counts. The `## Meters` blocks exist in every report and verdict and are read by nobody.

## Acceptance criteria

- WHEN the arm merges THE meters SHALL be appended to the bands' readings with the card, the size, the tier, the dispatch and CI-green times and the subagent tokens per seat; WHEN `npm run health` runs THE two bands SHALL read inside / drifting / breached against the budgets per tier.
- WHEN a checkpoint is written THE two bands SHALL be quoted with their derive command, and a breach SHALL be a finding about the process, never a gate on a lane.
- WHEN the rejection rate per tier is read beside CI reds THE band SHALL flag a tier whose rejections fell to zero while CI reds rose — the soft-verifier reading — seen on a planted history.

## Implementation notes

**THE CAPTURE WAS T-295'S AND THE PARSE IS THIS CARD'S**, and the shape
of the file decided the shape of the work. `readingsLines` in
`tools/e2e/scripts/merge.mjs` appends one JSON line per seat per merge
carrying card, size, tier, seat, source, the bench tip and the seat's
own `## Meters` block WHOLE, unparsed, on the argument that a capture
which loses nothing is the only one a later parser can be written
against. So the readings are a TREE authority — `docs/checkpoints/meters.jsonl`
is a tracked file — and everything the two bands need is computed in
`readingsFromTree` in `tools/e2e/scripts/health-bands.mjs`. No new flag,
no change to the runner, and `readingsFromOutput` still yields exactly
the three readings-authority bands it did before.

**THE FENCE WAS WIDENED BEFORE ANY CODE WAS WRITTEN.** A band reaches
`npm run health` only through `allBands()`, which is declared in
`tools/e2e/scripts/health-bands.config.mjs`, so the armed fence could
have built the parse and could not have made the command report it. The
ask went out under fast path A at the start of the lane and the seat
granted it at `37bb48a0`, the card's `touches:` line and nothing else;
this lane brought its own copy of that line to byte-identity with the
one on main rather than composing one. Three entries were APPENDED to
`STANDING_BANDS` and no existing entry's lines, healthy direction or
measured block was touched: that file's second rule is that TRIAGE
tunes it and the session that trips a band never does, and adding a band
that never existed is not tuning one.

**WHAT EACH READING IS, AND WHY IT IS THAT.** `loop/cycle-budget-used`
prices each card in the checkpoint's window between two COMMITS — its
own `T-NNN: dispatch stamp` and the merge that appended its reading —
and does NOT sum the seats' wall-clock sentences, because an executor's
hours and a verifier's minutes overlap their spawns and their detached
suites and a sum of them is a number with no referent.
`loop/token-budget-used` DOES sum, because two seats spend two budgets
against one card, and it reads each seat's figure as the number the word
`tokens` is attached to: all four blocks on record state the reading and
the window it was taken against in the same sentence, and the window is
always the larger number, so a parse that took the largest or the last
would read 15,000,000 for two of them. Both bands report the WORST card
in the window as a SHARE of that card's own tier budget, because one
band has to hold three tiers whose budgets differ five-fold. The window
is the checkpoint's, the same one `triage/net-arrivals-per-window` uses,
because the readings file is append-only and a band that cannot recover
from one bad August lane is a band that gets filtered.

**THE HONEST GAPS, EACH DISCLOSED IN THE PLACE IT BITES.** The cycle
reading is a FLOOR: the tree ends at the merge and CI green is minutes
later in an API, so the derivation says the word on every line it prints
and `T-297-s1` asks the capture to close it. A card in the window that
cannot be priced whole takes its band UNREAD rather than green — an
unknown tier, a missing dispatch stamp, or a seat that stated no tokens,
which yields a lower bound, and a lower bound rendered as a share of a
budget reads exactly like a measurement while being able to sit on
either side of the line. That fires today: T-296's executor block states
no token figure, so `loop/token-budget-used` is UNREAD at this ref while
`loop/cycle-budget-used` reads 160.27% and DRIFTS.

**THE THIRD READING, AND WHY IT IS A BAND RATHER THAN A PARAGRAPH.**
Criterion 3 asks for a flag and this reporter has exactly one shape for
a reading compared to a limit, so `loop/soft-verifier` is a band: it
counts the tiers whose rejections fell to zero while their CI reds rose,
on the CONJUNCTION only, since either half alone is good news half the
time. It is WIRED and not yet fed, which is deliberately different from
the four bands declared with no keeper at all: the comparison exists, the
suite drives it on a planted history, and it reads UNREAD only because
no capture stamps a verdict outcome or a CI-red count. `T-297-s4` is
that capture, and it is the same debt `north-star/rejection-rate-by-size`
has carried since T-156.

**THE RULED NUMBERS SIT BESIDE THE PARSE, NOT IN THE CONFIG.**
`TIER_BUDGETS` is ADR-024 decision 1's six numbers, and it is exported
from `health-bands.mjs` rather than added to the file this project
invites triage to edit, so that what triage may tune is the two bands'
drift and breach lines and what it may not is the owner's ruling. A body
pins the table to the ADR's own sentence, which is the section-AUTHORITIES
discipline pointed at a ruling instead of at a tool.

**THE RECORDS CLAUSE, MET HEAD ON.** ADR-019 says no suite, gate or
generator may DEPEND on the contents of `docs/checkpoints/`, and
`docs/checkpoints/TEMPLATE.md` says in as many words that the clause does
not bend for a reporter. Both sentences were left standing and clauses
were added around them in the two documents this card fences: the
reporter is none of those three, the readings file is written by the
merge verb and by no hand, and the hazard the clause exists against is a
program that reds when a human writes a paragraph another way, which
cannot happen to a file no human writes. The addendum that would say
this inside ADR-019 is the owner's and is filed as `T-297-s3`; no lane
should write it.

**MEASURED AT THIS LANE'S TIP.** `npm run health` from tools/e2e/ reports
17 bands, exit 3 — the designed answer, four bands still declared with no
keeper. `loop/cycle-budget-used` DRIFTING at 160.27% of the guarded
budget over the one card in this window; `loop/token-budget-used` and
`loop/soft-verifier` UNREAD, each naming what it wanted. The three doc
budgets and `triage/live-suggestions` were already breached at the base
and this lane did not touch them, though `docs/CONVENTIONS.md` grew by
about 2.7KB, which is inside its fail line and past its warn line, where
it already was.

## Verdicts
