---
id: T-297
title: Two bands the loop is held to — cycle time from dispatch to CI green and subagent tokens per card, by size and tier, with the budgets ADR-024 sets (bounded 20 min/80K, standard 75 min/310K, guarded 100 min/450K), fed by the meters the arm appends at every merge and read at every checkpoint
feature: F-06
milestone: 4
size: S
tier: standard
priority: 2
status: verifying
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

### 2026-09-11 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tier **standard**. Tip judged **3294c34901c4ad1fb5ba9e97d32570a7f0cb480b**, base
**c745a6af4812775c527d2c32b4671cfc22df013a**, on a detached bench at
`supertaskr-V-T-297`. Every figure below names the ref it was taken at.

**THE SEAL.** All three sealed inputs verified before anything else was opened:

| input | sha256 |
|---|---|
| the attack set (phase 1, written blind) | `2385ffc630f92a95f1e0a14655d31ade86e9397fb20f8da1cc851776af583399` |
| the ground, taken at the base by the arm's script | `786ffcd696c4449077d81060f01ff18c809c499cd5c57f81c4d9530186b20cdb` |
| the card at `c745a6af` | `55225af7763545921d772c0140bbb4bd9a8a762734c865ebc2581ed3522f1608` |

**THE FRAME I ACTUALLY HAD.** Two spawns, genuinely. Phase 1 wrote the attack set with
`tool calls made: 0` and could not have seen the diff. I am a fresh spawn holding tools; I
read the three sealed files, then `method/roles/verifier.md` at the base, then the card, then
the diff — and the executor's report, the ask file, the notes and the commit messages LAST,
after every finding below was written. The brief's duties section named no executor-derived
specific, so phase 1 was not broken above the line. The ground carries the arm's script output
and no seat addendum, which is correct for this tier; phase 1's M1–M16 are therefore mine, and
I took them at the base ref with `git show c745a6af:<path>` before opening the diff.

**THE FENCE HOLDS.** `git diff --name-only c745a6af..3294c349` moves ten paths and every one
is inside the grant: `health-bands.mjs`, `health-bands.config.mjs` (joined the fence on main at
`37bb48a0` by fast path A, the lane's ask 1), `health-bands.spec.ts`, `docs/CONVENTIONS.md`,
`docs/checkpoints/TEMPLATE.md`, and five cards under `docs/tasks/`. Nothing else.
`docs/checkpoints/meters.jsonl` is untouched — the record is not rewritten, as ADR-019 requires.
No `package.json` or lockfile moved, so there is no new dependency to sweep.

**THE OWED SET, at my tip judged**, `gate-run.mjs --range c745a6af..3294c349`:
parser **389** / app **1171** / rust **655** / e2e **714** (16 spec files), every leg
`verdict=GREEN exit=0`, gate exit **0**. The e2e count of 714 excludes the three bodies I
committed afterwards, which is how I know that leg graded the lane's tip and not my bench.

#### A row per criterion

| # | criterion | verdict | the evidence that decided it |
|---|---|---|---|
| **AC1a** | the meters are appended at merge with the card, size, tier, **dispatch and CI-green times**, and per-seat tokens | **MET IN PART — the gap is real, declared and routed** | The append is T-295's and works: `meters.jsonl` at `c745a6af` carries four readings keyed `at/card/size/tier/seat/source/merge/meters`. This card owns the PARSE. card, size, tier ✓. Per-seat tokens ✓ and genuinely DERIVED — data mutant **D2** (fixture prose `200,000` → `250,000`) reds the owning body, 1 failed / 35 passed. Dispatch ✓ but recovered from the card's own `dispatch stamp` commit, not from a field. **CI-green is absent from the tree** and substituted by merge time, declared a FLOOR on every printed line and filed as T-297-s1. Defect found here: **correction 1**. |
| **AC1b** | `npm run health` reads inside / drifting / breached **against the budgets per tier** | **MET, with correction 1** | Run verbatim at `3294c349` in a shared clone: `drifting — loop/cycle-budget-used: 160.27 % of the tier's budget has risen above the 100 drift line, not yet the 200 breach line`, with its derivation. Per-tier is a real LOOKUP, not a label: the unpriced-tier body carries a positive control (`bounded` prices at 12.5%, `standard` would read 3.2%). Three states pinned via `evaluateBand`. Boundaries measured: exactly 100 → inside, exactly 200 → drifting, so the lines are exclusive and agree with the config's own word "crossing". **The budgets are not a drifting second copy**: data mutant **D1** on ADR-024's own sentence (`20 min` → `25 min`) reds the transcription body. |
| **AC2a** | a checkpoint quotes the two bands **with their derive command** | **MET IN DATA, WAS UNKEPT — correction 3** | `TEMPLATE.md` carries `` `Cycle band:` `` and `` `Token band:` `` with `npm run health`, from tools/e2e/. I ran that command verbatim and it printed exactly the shape the template describes, so the quoted command is real and not prose (A2a.2 answered). But at `3294c349` **nothing in the tree kept those two lines** — `Cycle band` and `Token band` each appeared in exactly one file, the template, read by no body, gate or generator. A criterion whose whole delivery is an unkept paragraph is satisfied by good intentions. Corrected, with a DATA mutant (**M3**). |
| **AC2b** | a breach is a finding about the process, **never a gate on a lane** | **MET — measured, not asserted — but unkept; filed as T-297-s8** | Phase 1 pre-committed that this would ship as prose with no executable body and that it would grade the absence a defect. **The first half is confirmed: there is no such body.** I ran the control myself rather than assert it. On a shared clone at the tip I planted a readings file breaching a card on both bands, gave it a dispatch stamp, and ran the battery: card preflight **exit 0**, push checks **exit 0**, docs gate **exit 1** — the SAME standing root-anchor answer and CONVENTIONS budget WARN the base gives, byte-for-byte in kind. The reporter printed the reading and exited 3, which is the exit it already had before the plant. So the disposition HOLDS and is loud rather than quiet. I am departing from phase 1's pre-commitment deliberately and say so: the property is inherited standing behaviour (`npm run health` is consumed by no gate at the base, M15), so making this lane own a keeper for a project-wide disposition would be over-reach. It is filed as a suggestion instead of assigned as a correction. |
| **AC3** | the soft-verifier reading — rejections to zero **while** CI reds rose — **seen on a planted history** | **MET** | Phase 1 pre-committed that the control would be unable to fail. **Refuted.** Both owed negatives are present — rejections to zero with CI flat, and CI reds rising while rejections stay non-zero — plus the never-rejected tier. The conjunction is pinned on BOTH halves separately: mutants **D3** (`rejections === 0` → `>= 0`) and **D4** (the reds-rose term → `true`) each red the body alone, 1 failed / 35 passed each. Per tier, not pooled. No rate, so no `NaN` for a thin tier. The band is wired and honestly declared UNREAD until a capture feeds it, which is what T-297-s4 routes. |

#### The three corrections

Each is a body committed on this bench in the spec the property lives in, run **RED** against
the implementation lacking the property (2 failed / 34 passed of 36) and **GREEN** against the
one carrying it (36 passed, exit 0), then drilled RED-ALONE by a mutant (1 failed / 35 passed
each), every landing read from `git diff` and every restore proved by sha256.

**1. A cycle that ended before it began is not a measurement.** `dispatchStampSec` takes the
NEWEST dispatch stamp, and this project re-dispatches cards it rejected; the reading appended
by the first merge stays in an append-only file forever. The subtraction then goes negative,
and a negative share is below every drift line there is. Measured at `3294c349` on a planted
tree: `npm run health` printed `T-999 (size S, bounded) -49.23 min = -246.17%` inside a live
derivation, with `unreadable` empty; alone in the window that same card reads **inside** at
`-80%`. So the one card nobody can price is the one card the band can never report — a budget
escape that is silent and permanent for that card. It is now un-priceable, which is a state
this file already has a discipline for: the band goes UNREAD and names the card.

**2. A line the reader could not understand takes the loop bands dark.** `parseMeterRecords`
is careful to make a bad line a PROBLEM rather than a skip, and its own comment says why —
"a reader that silently drops the lines it does not like reports a healthy loop out of the
subset that happened to parse". That is precisely what happened to the problems it returned:
`readingsFromTree` destructured `records` and left them on the floor, and `cardMeters` and
`tierWindows` do the same with their own `unreadable` and `unusable`. The discipline existed
and reached nothing. Measured at `3294c349`: a file whose expensive card is the corrupt line
reports the cheap survivor as the worst in the window and calls it a reading. The truncated
input now takes every loop band UNREAD, the answer an unknown tier and a silent seat already
get. (The `unreadable` half of this is the lane's own T-297-s2 and is left to it.)

**3. The checkpoint template's two quoted lines get a keeper.** AC2a's whole delivery was two
lines of prose that nothing read. The pin is on the quoted labels and the band ids, because a
band id is what actually drifts when a band is renamed, and this project's standing hazard is
a second copy of a list drifting from the first.

```mutant
correction: a cycle that ended before it began is not a measurement
file: tools/e2e/scripts/health-bands.mjs
spec: tools/e2e/tests/health-bands.spec.ts
body: A CYCLE THAT ENDED BEFORE IT BEGAN IS NOT A MEASUREMENT — a re-dispatched card takes the band dark
message: expect(received).toBeNull()
--- old
    if (minutes !== null && minutes < 0) {
--- new
    if (minutes !== null && minutes < -1e9) {
```

```mutant
correction: a line the reader could not understand takes the loop bands dark
file: tools/e2e/scripts/health-bands.mjs
spec: tools/e2e/tests/health-bands.spec.ts
body: A LINE THE READER COULD NOT UNDERSTAND TAKES THE LOOP BANDS DARK — the problems reach the reading
message: expect(received).toBe(expected)
--- old
  if (problems.length > 0) return out;
--- new
  if (problems.length > 999) return out;
```

```mutant
correction: the checkpoint template's two quoted lines get a keeper
file: docs/checkpoints/TEMPLATE.md
spec: tools/e2e/tests/health-bands.spec.ts
body: THE CHECKPOINT TEMPLATE QUOTES BOTH LOOP BANDS BY ID, WITH THE COMMAND THAT DERIVES THEM
message: expect(received).toContain(expected)
--- old
- `Cycle band:` — the `loop/cycle-budget-used` line `npm run health`
--- new
- `Cycle reading:` — the `loop/cycle-budget-used` line `npm run health`
```

**A fourth correction carries no block, because it pins no property — it is a wording fix**, and
this verdict says so rather than leaving a shortfall for the merge to puzzle over.
`loop/cycle-budget-used`'s `measured.reason` ends "the first reading of this band is a breach".
It is not. The two figures the reason quotes are exact — I re-derived both: T-295 stamped at
`46c33c07`, merged 156.30 min later, 208.40% of the standard 75; T-296 stamped at `9dc05597`,
merged 160.27 min later, 160.27% of the guarded 100. But the conclusion drawn from them ignores
the window the band itself declares one field above. T-295's reading was appended at
`1789059993`, BEFORE the newest `Checkpoint:` commit `254cf7b` at `1789062143`, so at
`c745a6af` — the ref the reason names in its own `at:` — the window holds T-296 alone and the
band reads **drifting at 160.27%**, which is what the command prints. The reason now says that.

#### Security sweep (mandatory, and clean)

No dependency was added — no `package.json` or lockfile in the range. No secret, key or token
value in the diff. **Injection: the new input path is inert.** I ran hostile prose and a
hostile card id through it (`$(id)`, backticks, a quote-and-semicolon, `<script>`): the values
round-trip through `JSON.stringify`/`JSON.parse` as data, reach only a console derivation, and
no shell is involved — `git` is called through `execFileSync` with an argument vector. One real
but low-severity observation, filed as **T-297-s6** rather than raised here: a card value out of
the readings file is interpolated into `git log --grep`, which is a REGULAR EXPRESSION, so a
metacharacter would price a card against another card's dispatch stamp. It is argv-safe and the
ids a merge writes are parser-constrained, so it is a data-integrity exposure and not an
execution one; I confirmed fixed-string matching is a working remedy before proposing it.
**Data in the record**: the readings carry card ids, sizes, tiers, timestamps and the seats' own
prose — no session identifier, no transcript path, no person. X4 clean.

#### What I checked that is not a criterion

The `size: XS` mistake at `cfac885c` is **correctly handled**: the parser refuses XS, the battery
caught it in three packages at once, and `114df398` corrected T-297-s3 to `size: S`. No XS
remains at the tip. — The bodies are **hermetic**: every new body plants its records and injects
its dispatch times, and the only live reads are the ADR (a deliberate DATA pin) and `--list`, so
none of them changes its answer as the project merges more cards. — `docs/CONVENTIONS.md` is
150,537 bytes at the tip against a 146,878 warn and a 176,253 fail; the WARN is the base's
(147,841) and the lane's addition does not approach fail. — The method stamp does not move; no
method text is in the fence. — Adjacent features: the base's 24 bodies all still pass, and the
existing bands keep their output and their exit contract.

Phase 1's remaining pre-commitments resolve as: the three-state classification IS exercised for
one band only (confirmed), which I do not grade a defect because tier→share and share→state are
pinned separately and that decomposes the nine cells honestly; and "by size" in the title is
descriptive, because ADR-024 apportions budgets per TIER and size is only an input that selects
the tier (M4) — size is nonetheless recorded and printed on every derivation line.

**Findings that are not failures** are filed as T-297-s5 (the token parse would read a budget
written with the word `tokens`), T-297-s6 (the `--grep` regex above), T-297-s7 (the cycle band
reports a FLOOR and says so while the token band refuses a lower bound outright — the same
situation answered two opposite ways in one file, and the token band consequently cannot fire
at all while any one seat in the window is silent, which is today's state), and T-297-s8 (the
non-gating disposition has no keeper).

## Meters

- wall clock: 21:38Z to 22:06Z, about 40 minutes end to end, read off the session's own
  timestamps. By phase, with the long runs detached and overlapped: the seal, the role file and
  the M1–M16 measurements at the base 12 min; the fence and the diff 8 min; the shared-clone
  controls and the runtime attacks 10 min, overlapping the range; the three bodies, the seven
  mutants and the RED/GREEN drills 12 min; the verdict, the four cards and step 7 8 min. The
  range form ran 21 min detached from 21:41Z, inside the reading.
- context consumed: about 235,000 tokens of the 15,000,000 budget at dispatch.
- model: claude-opus-5@subagent, effort set at session start and never switched.
- suites run: the RANGE FORM through `gate-run.mjs` at `c745a6af..3294c349` (parser 389 / app
  1171 / rust 655 / e2e 714, every leg exit 0 and GREEN, gate exit 0); `health-bands.spec.ts`
  alone by name eleven times — once RED (2 failed / 34 passed), once GREEN (36 passed), and once
  per mutant across seven mutants; `npm run health` five times across two shared clones;
  `card-preflight.mjs`, `docs-gate.mjs` and `push-checks.mjs` at both refs for the AC2b control.
- bodies graded: 33 of the lane's own in `health-bands.spec.ts` (24 at the base, 9 new), plus
  the 3 this bench committed.
- mutants drilled: 7 — three carrying my corrections and four discharging phase 1's demands
  (the ADR budget, the fixture's meters prose, and AC3's conjunction separated into its two
  halves). Every one RED ALONE at 1 failed / 35 passed, every landing read from `git diff`
  rather than a mutator's report, every restore proved by sha256.
- fixtures: two `git clone --shared` under the scratch directory, one at the base and one at
  the tip, sharing the bench's `node_modules` (no dependency moved in the range). The planted
  breach and the planted dispatch stamp were written only there. Nothing was written in the
  integration checkout, in the lane, or in T-298's lane or bench; no worktree added or removed;
  no push.
