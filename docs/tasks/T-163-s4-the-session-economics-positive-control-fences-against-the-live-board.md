---
id: T-163-s4
title: session-economics.spec.ts's positive control spawns `brief.mjs --task T-112` and asserts exit 0 — so any live card sharing a fence entry with T-112 reds the e2e suite, and one has since `bf274ed`
feature: F-06
milestone: 4
priority: 1
size: S
status: verifying
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-163-s3
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-163-s3'S LANE AT `0f41aef`, ROUTED RATHER THAN FIXED:
`tools/e2e` is outside that lane's fence** (`touches:
[docs/CONVENTIONS.md]`). Recorded here per the lane rule rather than
reached for.

## The measurement

`NPUTER_E2E_PORT=41633 npm test` from tools/e2e/ at `0f41aef` —
**1 failed / 319 passed, exit 1**, and the one red is

    tests/session-economics.spec.ts:73
    "the recommended seat is a function of the CARD, and an environment
     full of model dials does not move it"

failing at line 113, `expect(other.status, other.stderr ?? "").toBe(0)`,
Received `1`. The subprocess it grades is
`node scripts/dispatch-brief.mjs --task T-112`, and its stderr is

    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-169 app-board against T-112 app-board
      — the same entry (lane-protocol rule five).

## The cause, and it is not the spec's subject

Derived at `0f41aef`:

    T-112  status: planned   touches: [app-dispatch, app-board]
    T-169  status: building  touches: [lib-parser, app-board]

`git log --oneline -- docs/tasks/T-169-*.md` puts the `building` stamp
at **`bf274ed`**, *"Dispatch stamps: T-163-s3, T-169, T-164 building —
the third wave"* — which is the commit every lane of that wave was cut
from. **The brief is behaving correctly**: T-169 holds `app-board` and
`--task T-112` is a dispatch question, so refusing is the answer. The
defect is that a POSITIVE CONTROL was spelled as a live card id.

**PRE-EXISTING, PROVEN, NOT CAUSED BY THE T-163-s3 DIFF.** Positive
control run in that lane: `git checkout bf274ed -- docs/CONVENTIONS.md`
then `node tools/e2e/scripts/brief.mjs --task T-112` → **exit 1**;
restore the lane's own file and re-run → **exit 1**. Same code, same
cause, both refs. A docs/CONVENTIONS.md edit cannot move fence
disjointness, which is computed from cards' `touches:` and the
component registry.

## Why the body wants a control at all — do not just delete it

The comment above the failing line says so in as many words: it is the
POSITIVE CONTROL for the comparison two assertions earlier, proving the
advisory block is *not a constant*, so that "identical under a loud
environment" is a claim about the environment rather than about a string
that could never differ. **That property is worth keeping.** Only its
INSTANCE is board-dependent — the same shape as the T-163 discharge on
`lib/parser/test/fence.test.ts` and `app/test/select-board.test.ts`,
whose model was: keep the live half asserting the ruled fact, move the
MECHANISM onto a synthetic fixture that still carries the shape.

## Acceptance criteria

- THE spec SHALL NOT grade its positive control on a card id whose
  fence the live board can collide — a second card's `touches:` is not
  this suite's input, and today's red is the proof.
- THE control SHALL still prove the advisory block is not a constant:
  two inputs, one command, two different blocks, with the difference
  asserted.
- WHERE a live card is still the right input, THE spec SHALL derive one
  whose fence is disjoint at the ref it runs at, rather than naming one.
- THE fix SHALL NOT loosen the assertion to tolerate a non-zero exit —
  an exit code accepted as "either" is the assertion deleted.
- Verification: headless. `npm test` from tools/e2e/ exits 0 with the
  body still red when the advisory block is stubbed to a constant.

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p1**, at `@ 51fa31c0964c`, with the day's second
instance measured at this seat rather than quoted from the filing. The
priority is the evidence: this is the only card on the board whose
defect is RED AT THE MOMENT OF ITS OWN PROMOTION.

**THE THIRD INSTANCE, MEASURED HERE.** The board moved under this
sitting — four lanes were dispatched while it sat — and the body redded
again immediately, on a different card than the one it was filed
against:

    cd tools/e2e && node scripts/brief.mjs --task T-112   # exit 1
    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-143-s3 app-board against T-112 app-board
      — the same entry (lane-protocol rule five).

Filed against `T-169` holding `app-board` at `bf274ed`; red again here
against `T-143-s3` holding `app-board` at `51fa31c`. **Two different
lanes, one control, same red** — which is the card's own claim promoted
from "any live card sharing a fence entry" to a measured pair. The
brief is behaving correctly both times; the spec is not.

**CORRECTION 1 — THE CARD NAMES THE WRONG SCRIPT IN ITS BODY, and a
lane following it would measure a green.** The measurement block above
says the subprocess is `node scripts/dispatch-brief.mjs --task T-112`.
It is not. `tools/e2e/tests/session-economics.spec.ts:54` reads

    const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

and line 109 spawns `[CLI, "--task", "T-112"]`. `dispatch-brief.mjs` is
the MODULE — its own header says *"the runnable half is `brief.mjs`
beside this file; this module holds the derivation and executes
nothing"* — so `node scripts/dispatch-brief.mjs --task T-112` exits **0**
with no output at this base, measured. The card's TITLE had it right
(`brief.mjs`) and its body did not; the body is corrected rather than
ruled, because a reproduction command that exits 0 on a live defect is
the one error that costs a lane its whole first hour.

**CORRECTION 2 — THE `bf274ed` STAMP IS KEPT AND IS NO LONGER THE LIVE
CAUSE.** `T-169` is `done` at this base, so the filing-time collider is
gone and the card's "and one has since `bf274ed`" is history rather than
a current reading. It stays on the card because a retraction that erases
what it retracts leaves nobody able to check it; the live cause at this
ref is named above.

**THE FENCE IS AS FILED AND THE COLLISION IS NAMED.** `touches:
[tools/e2e]` is correct and unchanged. At this base `T-154-s2` is a LIVE
LANE holding `.claude, tools/e2e, docs/CONVENTIONS.md`, so this card's
preflight reports a fence collision against it — a DISPATCH-TIMING fact,
not a defect in this card, ruled here so no dispatcher re-derives it.
Two other cards promoted at this sitting also fence `tools/e2e`
(`T-167-s8`, `T-167-s6`) and one more reaches it (`T-164-s2`): the four
serialize against each other, and this one is p1 of the four.

**PREFLIGHT AT PROMOTION, AND WHY IT IS NOT GREEN.**
`node scripts/brief.mjs --task T-163-s4 --preflight` from tools/e2e at
`@ 51fa31c0964c` exits **1** with exactly ONE finding, and it is the
live-lane hold above: *"the parser rules this card: fenced — T-154-s2
(refs/heads/task/T-154-s2-laneless-guard) holds tools/e2e"*. Every other
claim class ran clean: paths missing **0**, criteria naming paths the
fence does not reserve **0**, unrunnable figures **0**, `blocked_by`
nothing, ref stamps **1 of 1 resolving**, fence expanding to 59 tracked
files. **THIS IS NOT DISCHARGEABLE BY A CARD LINE AND SHOULD NOT BE** —
a `PREFLIGHT RULING` binds a finding about the CARD, and a live lane is
a fact about the clock; the tool says so in as many words when one is
tried against it ("discharges nothing at this ref"). The card is
correct and unstartable, and it becomes startable the moment that lane
lands, with nothing to re-edit.

## Implementation notes
<!-- executor appends before finishing -->

### Confirmation of understanding — executor, lane `T-163-s4` at base `8ebbb08`

I am building one card inside `touches: [tools/e2e]`: `tests/session-economics.spec.ts`
grades subprocess exits of `scripts/brief.mjs --task <live card id>`, and
`brief.mjs --task` is a DISPATCH question, so it answers exit 1 whenever the named
card's fence collides with any live lane's — which makes a board fact, belonging to
no input this suite owns, decide whether this suite is green. My job is to keep the
property the bodies buy (the advisory block is not a constant; nothing about the
SESSION reaches the recommendation) while removing the board from the grading path:
the control's card id must be DERIVED as disjoint at the ref it runs at rather than
typed in, no assertion may be loosened to tolerate a non-zero exit, and I check every
body in the file that shells the brief rather than only `:73`. My own lane is the test
bed — it holds `tools/e2e`, so the red must be reproducible before my fix and absent
after it WITH this lane still live. I re-derive every figure at my own ref and say
plainly where the card and the repository disagree; the repository wins. Size S,
`touches: [tools/e2e]` — tooling, not shipped code — so I stamp `verifying` in-lane
and leave the verifier fields empty as dispatched, and I do not merge, push, or touch
the integration checkout.

### What landed — executor, lane tip `a18a6f8` (base `8ebbb08`)

One file changed in shipped scope: `tools/e2e/tests/session-economics.spec.ts`
(+137/-6). No script, no assertion loosened, no `test("…")` name moved.

**THE RULE THE FILE NOW KEEPS**, written into it above the helpers: *every
invocation whose EXIT is graded takes a DERIVED id; every in-process
reading of the suite's own subject card stays `T-157`.* A read of a card
is not a dispatch question, so the five in-process `context({ taskId:
"T-157" })` calls are untouched — the live half still asserts the ruled
fact, which is the T-163 model this card's own body prescribes.

Three helpers, all in the spec file (nothing was added to
`session-economics.mjs`, whose "no `process.env`" pin at line 118 is a
claim about that module):

- `unfencedIds(ctx)` — the card ids whose fence is disjoint from every
  live lane's, computed through the **same `fenceOverlaps`** the command
  compares with, so the prediction cannot drift from the rule. It
  deliberately does not work around two live lanes that overlap *each
  other*, nor a lane whose card the checkout cannot read: each is a
  finding on every `--task` run whatever id is asked for, so no choice
  avoids one, and each is rule five actually broken.
- `recommendation(block)` — which `SEAT_PHRASE` a rendered block names.
- `control()` — memoised; takes the first unfenced id as `baseId` and the
  first later one drawing a DIFFERENT recommendation as `otherId`.

### Each criterion

1. **Not graded on a collidable id** — MET. The four spawns that graded an
   exit now take `baseId`/`otherId`. Nothing in the file types a card id
   into a spawn.
2. **The control still proves the block is not a constant** — MET, and
   strengthened. Two inputs, one command, two blocks, difference asserted
   (unchanged line), **plus** a new assertion that the difference lands on
   the RECOMMENDATION and not only on the card path the block echoes back
   — which two distinct ids differ in for free, so that half of "not a
   constant" was previously bought at no cost. Mutant M3 below kills the
   new line while the old one survives, which is the measurement of what
   it buys.
3. **Derived, not named** — MET. `unfencedIds` runs at the ref the suite
   runs at, off `context()`'s own lane list and card index.
4. **No exit tolerance** — MET. Both graded exits are still
   `expect(status, stderr).toBe(0)`; no `[CLEAN, FOUND]` form was
   introduced. Mutant M2 proves they still red on a 1.
5. **Headless verification** — MET, both halves. See the figures below.

### Figures, each with its command and ref

Live-environment facts read 2026-08-30 on this host; lanes at every run:
`T-025-s4` (app-agent) and `T-163-s4` (tools/e2e), read with
`git worktree list --porcelain`. The `claude/…` worktree is not on a
`task/` branch and is not a lane.

- **THE RED, at `8ebbb08` with this lane live** —
  `NPUTER_E2E_PORT=41797 npx playwright test tests/session-economics.spec.ts`
  from tools/e2e: **2 failed / 8 passed, exit 1**. Both reds at
  `expect(…status).toBe(0)`, both on `--task T-157`, stderr *"fences are
  not disjoint: T-163-s4 tools/e2e against T-157 tools/e2e — the same
  entry"*. Bodies: `:73` (line 113) and `:247` (line 261).
- **THE GREEN, at `a18a6f8` with the same lane live** — same command:
  **10 passed, exit 0**. Whole suite,
  `NPUTER_E2E_PORT=41797 npm test`: **332 passed, exit 0 (3.6m)**.
- **The board at `8ebbb08`**: 357 live cards; **246 fence-disjoint from
  every live lane, 111 not**; all **246 of 246** answer `brief.mjs --task`
  exit 0, so fence disjointness fully predicted the exit at that ref
  (swept with `fenceOverlaps` + one spawn each).
- **The recommendation split over those 246**: 201 *"the STRONGEST seat
  available to this operator"*, 45 *"a STANDARD seat is sufficient"* — so
  the pair `control()` needs is not scarce. Today it picks `T-001` and
  `T-016`; it names neither.
- `node tools/e2e/scripts/brief.mjs --task T-112` at `8ebbb08` → **exit
  0** (see CORRECTION below). `--task T-157` → **exit 1**.
  `--task T-163-s4` → **exit 0**.

### Drill ledger — three mutants, one side each, all killed

Run from a **detached scratch worktree** at `/tmp/n163` (short root) at
the lane tip `a18a6f8`, `NPUTER_E2E_PORT=41798`, baseline **10 passed,
exit 0**. Untracked build artifacts were symlinked in; no tracked file of
any other tree was touched. `CARGO_TARGET_DIR` was outside the walk for
the one cargo run below. Worktree removed after.

| # | Side mutated | The mutation | Result |
|---|---|---|---|
| M1 | code under test — `scripts/session-economics.mjs` | `seatRecs` returns a fixed two-record block (the card's own criterion-5 stub: the advisory block made a CONSTANT) | **RED, exit 1, 5 failed / 5 passed.** `:179` fails with the intended sentence: *"all 246 cards the live board leaves unfenced draw the same recommendation (\"a STANDARD seat is sufficient\") — nothing here could tell a derivation from a constant"* |
| M2 | the new derivation — `unfencedIds` in the spec | `if (clear)` → `if (!clear)`: the helper returns the CLASHING ids | **RED, exit 1, 2 failed / 8 passed.** Both graded bodies fail `toBe(0)` with *"fences are not disjoint: T-163-s4 tools/e2e against T-010-s10 tools/e2e"* — the card's own class, reproduced on purpose, and the proof the exit assertion was not loosened |
| M3 | code under test — `scripts/brief.mjs` | the printed advisory has its `RECOMMENDED SEAT:` line replaced by a constant; every other line still varies by card | **RED, exit 1, 1 failed / 9 passed** — and the failure is the NEW assertion alone. The pre-existing `expect(advisory(other)).not.toBe(advisory(clean))` **SURVIVED** it, because the echoed card path still differs. This is why criterion 2 was met by strengthening rather than by transcribing |

Restoration, both sides named, per the T-092-s4 rule
(`git restore --source=HEAD --staged --worktree -- <path>`), sha256 of the
worktree file against `git show HEAD:<path>`, and an empty diff in the
index as well as the worktree:

    session-economics.mjs   66d542f493d1326b782bfcc8b6406308913ae87d2aee6094a06f3f13b691ea8b   diff 0 / cached 0
    session-economics.spec.ts d250224ec8cf39c4914eb6d91b8a29959beb6c4177ef9304217bf3726e9c49c3 diff 0 / cached 0
    brief.mjs               2b53d87a78c4d8122d751aa485ff59d8e01cc89340a820607b945f163d8f153d   diff 0 / cached 0

Post-drill re-run in the scratch worktree: **10 passed, exit 0**.

### Gates, derived from the merge-forecast diff (2 paths: the spec, and docs/tasks)

Enumerated from `brief.mjs --task T-163-s4` ROW 8 rather than from memory.

- **GRAPH REGEN — FIRES** (`.ts` outside docs/). **ASKED, not predicted**:
  `CARGO_TARGET_DIR=/tmp/n163tgt cargo run -q -p nputer-index -- index
  --check --root ../..` from app/src-tauri at `a18a6f8` → **exit 0,
  `graph.json is CURRENT`** (1,039,074 bytes, 199 files, 2,065 symbols,
  2,334 edges; 926 bytes of headroom). Nothing to regenerate — the
  `.nputerignore` exclusion of `tools/` is why, and this is the third
  worked example of the shape CONVENTIONS already names twice.
- **BOOT GATE — NOT OWED.** No `app/src-tauri/**`, `app/src/**` or
  manifest path in the diff.
- **DOCS GATE — FIRES** (`docs/tasks/**` is read by `cardIndex` and by the
  gate itself). `npm run lint:docs` → **exit 0**. The DIFF half stays the
  integrator's hand run.
- **METHOD EVAL GATE — NOT OWED.** No `method/**` path.
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of these.

Command exits, `$?` unpiped, in order run: `npm ci` + `npm run build`
(lib/parser) 0, 0 · `npm ci` (tools/e2e) 0 · `npm install` + `npm run
build` (app) 0, 0 · playwright session-economics BEFORE **1** · `npm run
typecheck` 0 · playwright session-economics AFTER 0 · `npm test` 0 ·
`npm run lint:tokens` 0 · `npm run lint:docs` 0 ·
`npm run capabilities:check` **1** (see below) · drill M1/M2/M3 1/1/1 ·
`index --check` 0.

### Where the repository contradicted the card

1. **CORRECTION 1 IS RIGHT AND ITS MEASUREMENT BLOCK IS NOW STALE.** The
   script is `brief.mjs` — confirmed at `:54`. But the card's whole
   measurement is `--task T-112 → exit 1`, and **at `8ebbb08` `--task
   T-112` exits 0**: both colliders the card names (`T-169` at `bf274ed`,
   `T-143-s3` at `51fa31c`) are landed, and no live lane holds
   `app-board`. A lane that had reproduced only the card's named instance
   would have found nothing.
2. **THE LIVE RED WAS ON `T-157`, AND THE CARD NEVER MENTIONS IT.** Three
   of the four brief spawns in the file name `T-157`, whose `touches:` is
   `[docs/checkpoints/, tools/e2e]`. **This card's own fence is
   `[tools/e2e]`.** So the collision was with the lane fixing the defect,
   and criterion 5 (`npm test` exits 0) was **unsatisfiable by the card's
   own prescription** — repairing only the `T-112` half at `:113` leaves
   `:74`, `:85` and `:260` red in this very lane. The card is right about
   the class and wrong about its extent; the fix covers all four.
3. **THE PROMOTION'S PREFLIGHT FINDING IS DISCHARGED BY THE CLOCK.** The
   card records `--preflight` exit 1 against a live `T-154-s2` holding
   `tools/e2e`. That lane is gone: at `8ebbb08`
   `brief.mjs --task T-163-s4` exits **0**.
4. **THE DISPATCH BRIEF ADDED A DOCUMENT THE ROLE FILE SUBTRACTS.** The
   brief's read-first row named `docs/ROADMAP.md`;
   `method/roles/executor.md` step 1 subtracts it in as many words
   (*"a deliberate subtraction rather than an oversight"*). Per the brief
   contract's own rule — a brief may not contradict the role file it
   cites, and where it does the role file wins — ROADMAP was not read,
   and this is the disclosure that rule requires. `method/tasks/
   TASK-FORMAT.md`'s ceremony table was read instead, as that step adds.
5. **THE CEREMONY ROW AND THE DISPATCH INSTRUCTION DISAGREE, AND THE ROW
   IS NOT WHAT WAS OBEYED.** `touches: [tools/e2e]` is tooling, which
   CONVENTIONS' rule of thumb (the project states no explicit partition)
   puts on **"S, diff outside shipped code" — no verifier, executor is its
   own integrator**. The dispatch said `verifying`, empty verifier fields,
   do not merge. This lane stamped **`verifying` and did not merge**: that
   is the conservative reading, since a `done` card left unmerged is worse
   than a `verifying` one, and executor.md's own step 1 says a lane in
   exactly this position stops rather than guessing upward against an
   explicit restriction. **The row says no verifier is owed** — whoever
   picks this up should read it as ready to integrate, not as awaiting a
   verdict.

### Attributed, not absorbed

`npm run capabilities:check` exits **1**: *"STALE — committed 25528 bytes,
a fresh generation is 26427 bytes"*. **Pre-existing and provably not
this diff's** — the identical pair of figures comes back from a detached
worktree at the base `8ebbb08` with this diff absent, and the fresh
generation is the same 26427 bytes on both sides, so this change moves
`docs/CAPABILITIES.md` by zero bytes. `git diff` confirms no `test("…")`
line was added or removed. `docs/CAPABILITIES.md` is outside this fence,
so `npm run capabilities` was **not** run; this is T-153-s8's red, still
open on main.

### Routed rather than fixed

`T-163-s5` (filed, `status: suggested`): `tools/e2e/tests/brief.spec.ts`
`:734` and `:750` spawn `brief.mjs --task T-133` against the LIVE checkout
and accept `[EXIT.CLEAN, EXIT.FOUND]` — the same board-dependence this
card is about, discharged there by loosening the exit instead of deriving
the id. Inside this fence but outside this card's criteria, and criterion
4 forbids this lane's own fix from tolerating a non-zero exit while saying
nothing about bodies that already do. The three other `[CLEAN, FOUND]`
sites (`:1019`, `:1049`, `:1069`) pass `--root <fixture>`, where no live
lane reaches them — a different class, argued on the new card and left
alone.

## Verdicts
