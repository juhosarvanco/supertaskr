---
id: T-171
title: Genesis has no ending — stage 7 banks, the method's cold-start test has no operational owner, and the screen rests on "planner is thinking…"
feature: F-03
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
suggested_by: "@human's genesis walk (2026-08-30, /Users/ujju/Projects/first-walk) — the milestone-3 walk's principal finding"
touches: [app-interview]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: same-model
---

**WHAT @HUMAN SAW, at the end of a complete and otherwise successful
seven-question walk:** the last bank landed (eight docs files), the
board pane showed the three cards and "milestone 1 ships above" — and
the chat column ended on the planner saying, in its own words, that
the role file requires a cold-start test ("a fresh session that reads
only `docs/` and explains the project back"), that *"I can't be that
session; I have the whole interview in context"* — and then the
footer held **"planner is thinking… · ⌘. to stop"** with a disabled
bank button, indefinitely. @human's report, verbatim: *"I did the
whole walk and after the last question, the image is what it ended
with, and I don't know how to move forward from it."*

**THE PLANNER IS RIGHT AND THE APP HAS NO ANSWER.**
`method/interview/plan-interview.md` ends: *"Then: cold-start test. A
fresh session reads only docs/ and explains the project back. Gaps in
its answer are gaps in the docs — fix and repeat."* The interview
session is disqualified from running it BY CONSTRUCTION (it has the
interview in context — the blindness is the test), and nothing in the
app spawns the fresh session the method names. So the flow's last
stage exists in the method, is honestly refused by the planner, and
is owned by nobody. The stall is not a bug in the planner's turn; it
is a missing seat.

## What the fix has to decide

1. **A terminal state.** After the last bank the interview SHALL
   conclude visibly: the board presented as the product of the walk,
   a "genesis complete" state, and the next actions named (run the
   cold-start test; open the project). "planner is thinking…" SHALL
   never be a resting state — if no turn is in flight, the footer
   must not say one is.
2. **The cold-start test operationalized.** The app spawns a FRESH
   agent session whose reading is restricted to the new project's
   `docs/` and asks for the explain-back; the answer renders beside
   the board; its gaps are the actionable output (fix-and-repeat, per
   the method). This is agent-runner work (`app-agent`), and the
   restriction is the test — a session that read anything else is not
   cold.
3. **Whether the test blocks completion or follows it.** The method
   says "fix and repeat" but a human may reasonably stop at a green
   board. Suggest: completion is at the last bank; the cold-start
   test is offered, not gated — but that is triage's call, not this
   card's.

At the walk itself, the integration seat ran the cold-start test by
hand (a fresh Opus session restricted to first-walk/docs) so the walk
could finish the method's sequence; its result lands on this card
when it returns. The by-hand run is the workaround this card
eliminates.

## THE BY-HAND COLD-START RESULT (2026-08-30, fresh claude-opus-5 session, reading restricted to first-walk/docs/)

**Verdict: "the docs are not whole"** — which is the test WORKING; the
method's fix-and-repeat loop now has real food. Full report:
docs/research/captures/cold-start-first-walk-2026-08-30.md. The gaps
came in three kinds, and each kind teaches genesis something:

1. **One live technical contradiction that will bite a card.** The
   project's ARCHITECTURE still says the tool "hands the process over
   and does not come back" / "nothing runs after the editor starts",
   while its own ADR-002 and T-003 require exiting with the editor's
   status — and ADR-002 PREDICTED the stale wording and then did not
   fix it. A builder reading ARCHITECTURE first fails T-003. The
   planner corrects itself in decisions but does not sweep the
   correction through the older documents — the ask-after-write class,
   in a newborn project.
2. **Dangling references a cold start cannot resolve** — above all
   B-1, the missing method tree, now its own card (T-174). Also: an
   ADR naming a card (T-004) that was never written; a "check" that
   must report S-1 with no name or home.
3. **The baton under-reports itself.** The generated STATE names three
   open `[?]` items; grep finds nine, and the omissions include the
   one assumption NORTH_STAR itself says would invalidate the whole
   project. A transcribed count, stale at birth — the exact shape this
   repo's own CONVENTIONS legislates against.

Also learned: the interview transcript and the bench harness DO
survive, in the new project's `.nputer/` — gitignored and outside
docs/, so the cold reader was right that docs/ alone cannot resolve
them; whether the transcript belongs somewhere docs-visible is a
question for this card's fix (the `[?]` marks all hedge against it).

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-03 p1, NARROWED to the terminal state, and SPLIT

**THIS CARD IS NOW ITEM 1 ONLY: the interview concludes visibly, and
"planner is thinking…" is never a resting state.** Items 2 and 3 left
this card at the sitting:

- **Item 2 (the cold-start test operationalized) is `T-175`**, filed at
  this sitting and promoted F-03 p5. The split is on FENCE and SIZE:
  item 1 is an interview-pane state (`app-interview`) and item 2 is a
  restricted SPAWN (`app-agent`). One card carrying both hands one lane
  the union of two fences for two unrelated contracts.
- **Item 3 is RULED on `T-175`**: completion is at the last bank; the
  cold-start test is offered, never gated. The reasoning is written
  there because that is the card it constrains.

**WHAT THIS CARD KEEPS IS THE BUG @HUMAN HIT**, and it is worth stating
narrowly: after the last bank the footer held *"planner is thinking… ·
⌘. to stop"* with a disabled bank button and no turn in flight. A
footer that claims a turn nobody is running is a lie the screen tells
about its own state, and it is fixable without spawning anything.

**AND THIS CARD DOES NOT GATE MILESTONE 3.** Its milestone is 4
deliberately. Milestone 3's closing word is @human's open item; a
genesis defect found DURING the walk is ordinary F-03 work and the
sitting refuses to convert it into a hold on a decision that is not the
sitting's to make.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.

## IMPLEMENTATION NOTES (executor, claude-opus-5@subagent, lane
`task/T-171-interview-terminal-state` at `/Users/ujju/Projects/nputer-T-171`,
base `629adea`, commits `714c72d` + `bf14a60`)

Built as TRIAGE NARROWED IT — item 1 only. Nothing spawns, no runner,
no `BANKING_MAP` cell moved (that file is a 0-byte diff), and the "the
test is offered, never gated" ruling is obeyed rather than revisited.

### WHAT THE FOOTER'S LIVE STATE WAS ACTUALLY DERIVED FROM (derived at
`629adea`, the card's question one)

`InterviewChat.tsx`'s hint slot read ONE boolean, `interviewBusy`, which
was `ui.busy || isTurnInFlight(genesis)` — expanding to
`ui.busy || state.sending || state.phase === "running"`. **Three flags,
not one of which is a fact about a turn**, and each can outlive the turn
it describes:

- `state.phase` returns to `idle` only on a `completed`/`failed` EVENT
  (`reduceGenesisEvent`), so an event that never arrives, or arrives at a
  seq the store has already passed, leaves it armed forever;
- `applyGenesisStatus` re-arms it (`sending: status.phase === "running"`)
  from the mount-time status pull **with no seq guard at all**;
- `reduceGenesisOutcome` arms it on any `started`/`accepted`, also with no
  seq guard;
- `ui.busy` is released in a `finally`, so it survives only a command that
  never answers.

**IT COULD NOT DISTINGUISH "a turn is running" FROM "the last turn ended
and nothing follows", AND THAT GAP IS THE DEFECT** — stated as the card
asked. Worse, the same boolean was the ONLY source for three different
things: the footer hint, every `disabled` on the screen, and
`completionOf`'s `inFlight` argument (`BoardCrescendo.tsx:64`). So one
stranded flag produced all three of @human's symptoms at once — the
thinking line, the dead button, and a completion panel that could not
render because `completionOf` answered `blocker: "turnInFlight"`.

**THE EVIDENCE WAS ON THE SAME SCREEN AND UNCONSULTED.** `PlannerTurn`
already draws its streaming dot from the runner's own per-turn
`status === "running"` (`interview-turns.tsx`), and `rehydrate` already
states the principle in as many words — *"a rehydrated planner turn is
`completed`, never `running`… giving it a live status would put a pulse
dot on a turn nothing is generating"*. The footer simply did not ask.

### WHAT "THE LAST BANK" MEANS TO THE CODE (the card's question two)

Two different things, and only one of them is the completion signal:

- `BANKING_MAP` (`genesis-derive.ts`) is the 9-row stage table, stages
  0–8 with 8 = decomposition. It feeds `approxStage`/`stageStep`, i.e.
  the stage strip and the lens's readout. **READ ONLY — untouched**; the
  verbatim assertion in `genesis-derive.test.ts` is green and that file
  is a 0-byte diff.
- **Completion is NOT read off that table.** `completionOf`
  (`crescendo.ts`, T-028) derives it from typed state plus file evidence:
  at least one turn, nothing in flight, the HIGHEST-numbered turn settled
  as `completed`, and a PARSEABLE board on disk (`parsedTasks > 0`, not
  files on disk). ADR-017/T-028 forbid a model-emitted marker, and
  `crescendo.ts`'s own header records that "T-023's completion signal"
  the card cited does not exist in the method.

### COMPLETION HAS ONE DERIVATION AND STILL DOES (the card's question three)

This card **reuses `completionOf` and adds no second answer**. What it
adds is `completionSafely` — the same call inside a `try`, the exact
sibling of `showsBoard`, because the CHAT renders outside T-037's error
boundary exactly as `stageOf` does, and a torn tree that throws on
`docs.effective` would otherwise take the conversation down with it. Its
degradation is `blocker: "unreadable"`, kept distinguishable from
`noBoard` because "there is no plan" and "we cannot see whether there is
a plan" are different situations.

### WHAT WAS BUILT

1. **`flightOf(turns, latched, awaiting, claimed)`** (`crescendo.ts`) —
   pure, no clock, no store read. The runner's per-turn `status` is read
   FIRST; the flags are claims a turn is allowed to contradict. Six named
   readings — `running` / `latched` / `unlanded` / `claimed` (in flight)
   and `stranded` / `idle` (not). `stranded` is precisely the state that
   used to render as "planner is thinking…" for ever, and naming it is
   what makes it assertable as a positive claim rather than an absence
   (the `CompletionBlocker` precedent).
2. **`InterviewUiState.awaiting`** (`interview-source.ts`) — the turn
   number of the last start/send a command ACCEPTED, taken from the
   outcome's own typed field. It is what lets a claim about a turn that
   has since settled be refused **without** flickering the footer to
   "⏎ send" for a frame after every answer: the runner spawns each turn
   on a THREAD, so `started` genuinely races the command's return.
3. **THE SPLIT, which is the fix's real content**: `interviewBusy` is now
   the FACT (is a turn in flight — feeds the hint, the completion, the
   ending, and `BoardCrescendo` unchanged), and **`interviewLocked` is the
   MACHINERY** (the OLD disjunction verbatim, feeding every `disabled` and
   the focus-return effect). The controls must agree with the guard that
   will actually answer a send — `sendGenesisTurn`'s own `isTurnInFlight`
   — because **a control enabled against a store that is going to refuse
   is the same lie with the arrow reversed**. The first draft of this
   build enabled the box on a stranded claim and reached for a
   `{kind: "busy"}` notice to cover it; that notice's own sentence is
   *"a turn is already running"*, which in the stranded case is the very
   lie this card exists to delete, in a smaller box. Recorded because the
   wrong version was written before the right one.
4. **`inputHint(inFlight, complete)`** (`interview-model.ts`) — three
   states where an inline ternary on one flag had two, so the third (the
   ending) was unreachable by construction.
5. **`ClosingBlock`** (`interview-turns.tsx`) — the ending, **in the chat
   column**, which is where @human was reading and, below `lg`, the only
   half rendered at all. It says genesis is done, names the method's
   cold-start test as an OFFER that is not required, states that this
   conversation is disqualified from being the cold session because it
   has the interview in context (the blindness IS the test), and **offers
   no affordance to run it** — spawning is `T-175` behind an `app-agent`
   fence. Its closing sentence follows `canAnswer` (`!locked`), so it
   never invites an answer nothing would take.

`BoardCrescendo.tsx` is a **0-byte diff** and its panel — "interview
complete / The board is ready. / Open the board" — starts rendering again
purely because its `inFlight` argument stopped lying. That was deliberate:
`app/test/crescendo-dom.test.tsx` and `tools/e2e/tests/crescendo.spec.ts`
pin that panel to exactly one button and forbid dispatch vocabulary, and
**both are outside this fence**, so the ending was put where it could be
proved in-fence instead.

### THE SWEEP (a fix names its class)

**CLASS: a rendered claim about a live process derived from a flag that
can outlive the fact, while per-fact evidence exists and is unconsulted.**

`command grep -rn "interviewBusy\|interviewFlight\|isTurnInFlight" app/src/`
and `command grep -rn "thinking\|is running\|running\"" app/src/genesis/`
(this shell's `grep` is a shim; `command grep` per CONVENTIONS). Both
searches were shown capable of failing — they return the live sites, and
the second returns the very line this card changed.

- **Two rendered-claim sites exist, and both are now fed by one
  derivation**: the chat footer (fixed here) and `BoardCrescendo`'s
  completion panel (fixed by the same change, no edit).
- `agent-store.ts`'s three `isTurnInFlight` call sites are GUARDS, not
  rendered claims. A guard that errs toward refusing costs an action, not
  a lie — not this class, and out of fence.
- `interview-turns.tsx`'s per-turn streaming line already reads the
  evidence. **No sibling defect**; it is what the footer was aligned to.
- `GenesisPane`'s `writing` status is a TIME WINDOW with a one-shot
  re-derivation timer (`nextTransitionMs`), so it closes itself. Not the
  class.
- **Sweep result: zero further instances**, recorded because an unrecorded
  sweep and an unrun one are indistinguishable.

### POISON DRILL — 23 mutants, 23 REDs, 23 restorations proved by sha256

Committed FIRST (`714c72d`, then `bf14a60` for the drill's own findings);
every mutation was applied to the CODE UNDER TEST ONLY, never to a literal
an assertion shares; each mutation was **read back with `git diff`** (the
added line is in the ledger, not a substitution count); the WHOLE app suite
was run under each; restoration was `git restore --source=<commit> --staged
--worktree -- <path>` with **both sides named**, proved by
`sha256(worktree) == sha256(git show <commit>:<path>)`, never by an empty
`git diff`.

**DRILL ARTIFACT, NAMED**: two pre-existing bodies compare `app/dist`'s
mtime to source mtime ("is not stale: the build is at least as new as …").
Mutating a source file without rebuilding reds them mechanically, so they
are excluded from every kill count below and named here rather than
counted as evidence.

Round one — 15 mutants, one per clause added, all exit 1:

| # | mutation | non-artifact kills |
|---|---|---|
| M1 | `flightOf` reads `running` off the TAIL only | 1 |
| M2 | the stranded claim is BELIEVED (pre-fix behaviour) | 2 |
| M3 | the latch clause inverted | 11 |
| M4 | the unlanded clause inverted | 8 |
| M5 | `turns.length === 0` → `=== 1` | 2 |
| M6 | `completionSafely` CELEBRATES an unreadable tree | 1 |
| M7 | `completionSafely` hardcodes `inFlight: true` | 5 |
| M8 | `inputHint`'s complete branch inverted | 4 |
| M9 | `inputHint` checks completion BEFORE flight | 1 |
| M10 | the cold-start test becomes a REQUIREMENT | 1 |
| M11 | the ending renders unconditionally | 2 |
| M12 | the invitation ignores `canAnswer` | 1 |
| M13 | the controls go back to reading the FACT (the conflation) | 1 |
| M14 | the accepted turn number is never recorded | 1 |
| M15 | the store's claim is never passed to `flightOf` | 1 |

Round two — **SHAPE SIX's question asked properly** ("name a mutation this
body kills, run the WHOLE suite, require the failing-body count to be
ONE"). Six further mutants, each aimed at one body that round one had not
isolated; **every one answered exactly 1**:

- R1 the latch's LABEL moves → `the latch covers the command's own round trip`
- R2 the empty-list claim is checked before `awaiting` → `an ACCEPTED turn with no event yet`
- R3 a null `awaiting` lets the claim stand → `THE STRANDED CLAIM IS REFUSED` (pure)
- R4 `turns.length < 0` → `an empty turn list contradicts nothing`
- R5 a `cancelled` turn reads as running → `a settled tail … is idle, not stranded`
- R7 the ending stops saying what ⏎ does → `SAYS THE INTERVIEW IS COMPLETE`

**TWO BODIES HAVE NO UNIQUE MUTANT AND ARE KEPT ANYWAY, on the rule that
requires them** — A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL:
`completionSafely > agrees with completionOf on a readable tree` (the
guard has to be shown passing a real reading through before its
degradation means anything) and the DOM `THE POSITIVE CONTROL: a turn that
really is running still says so` (without it, "the footer does not say
thinking" is satisfied by a screen that never says it). The unique-mutant
search for both was RUN and came back empty; that is recorded rather than
hidden.

**THE DRILL FOUND TWO OF ITS OWN, and both landed (`bf14a60`):**

- **SHAPE SEVEN — a mutant no body killed.** Gating the ending on `!busy`
  instead of on `completionSafely(...)` survived the entire suite:
  **nothing pinned that the ending requires a PARSEABLE BOARD**, which is
  T-028's "an empty board is never celebrated" and NORTH_STAR's
  planning-theater tripwire. `NO BOARD, NO ENDING` closes it; re-drilled
  as S7 → exit 1, kill count **1**.
- **SHAPE SIX — a body killing no unique mutant.** The `inputHint(false,
  false)` equality died under M8 together with the pre-existing
  `carries the design's placeholder verbatim, and the send hint`, which
  asserts the same string through the real component in the same state,
  and no mutant kills only it. **Removed**, with the measurement recorded
  in its place (the `questionFooter` precedent one file over).

### GATES — every command with its exit

- `npm ci` + `npm run build` from `lib/parser/`: **exit 0** (fresh worktree,
  parser before app, per the fresh-clone ORDER).
- `npm install` from `app/`: **exit 0**.
- `npm run build` from `app/`: **exit 0** — this is the typecheck; there is
  no `npm run typecheck` in `app/`.
- `npm test` from `app/`: **exit 0**, **1074 passed / 1074**, 49 files.
  Baseline at `629adea` measured in this lane: **1059 / 1059**. Net +15
  bodies (+16 added, −1 removed as the shape-SIX duplicate).
- **BOOT GATE — OWED and RUN.** Fires: the diff touches `app/src/**`.
  Port DERIVED from the card id (`14000 + 171 = 14171`), never defaulted;
  `lsof -nP -iTCP:14171 -sTCP:LISTEN` immediately before binding returned
  **zero rows (exit 1)**. `NPUTER_BOOT_PORT=14171 npm run boot:check` from
  `tools/e2e/`: **exit 0**, both startup lines detected —
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-171` and
  `[nputer] window "main" created`.
- **PORT RULE**: `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else —
  **zero rows**; @human's app was not running. Never bind-probed, never
  connected.
- **GRAPH REGEN — fires (`*.ts`/`*.tsx` outside `docs/`), and the graph was
  ASKED, not regenerated.** `cargo run -p nputer-index -- index --check
  --root ../..` from `app/src-tauri/`: **exit 1 — `graph.json is STALE`**,
  which is the expected and correct answer for an un-regenerated TS diff
  and is the integrator's to clear at the merge. What it reports:
  `files +0 -0 ~8` (exactly this lane's eight files), `edges +27 -9`, no
  new files, no component moved, no cycle. Budget at the fresh index:
  **1,139,673 of 2,145,959 bytes (53.1%) — 1,006,286 left**; floor
  230,459 (10.7%). `docs/architecture/graph.json` is OUTSIDE this fence and
  is **untouched and uncommitted** (`git status` clean).
- **DOCS GATE — NOT OWED**: the diff touches no path under `docs/` that a
  code suite reads. The only `docs/` file in it is this card, and the card
  parses (frontmatter unchanged in shape).
- **METHOD EVAL GATE — NOT OWED**: `method/**` is a 0-byte diff.
- Suite chains were run from GUARDED SCRIPT FILES (`cd <abs> || exit N`)
  and every gate exit above was read UNPIPED.

### FENCE

Eight files, every one inside `app-interview`: five under
`app/src/genesis/`, three of the seven fenced `app/test` files, plus this
card. Nothing outside was written; `app/src/lib/agent-store.ts`,
`app/src-tauri/**`, `app/test/crescendo-dom.test.tsx` and `tools/e2e/**`
were READ only. The fence was never widened.

### ROUTED — THREE FINDINGS OUTSIDE THIS FENCE (`app-agent` / C-14,
`app/src/lib/agent-store.ts`), for triage to card

Ids are deliberately not assigned here: two other lanes are live and id
assignment is triage's.

1. **⌘. CANNOT CLEAR THE STATE ITS OWN LABEL ADVERTISES.**
   `cancelGenesis` resets `sending`/`phase` **only** when the outcome is
   `{kind: "cancelled"}`. When Rust has no live turn it answers
   `{kind: "idle"}` and **nothing is reset** — so on @human's screen the
   escape the footer was advertising did nothing at all. This card makes
   it moot for the footer; the store is still stuck.
2. **`reduceGenesisOutcome` ARMS FLIGHT WITH NO SEQ GUARD.** Any
   `started`/`accepted` sets `sending: true, phase: "running"`
   unconditionally, so an outcome that resolves AFTER its turn's own
   events strands the store permanently. **Measured, not theorised**: the
   first draft of this card's DOM fixture was accidentally stranded by
   exactly this path, which is how it was found. `applyGenesisStatus` has
   the same hole from the status pull.
3. **A COMMAND THAT NEVER ANSWERS LEAVES THE UI LATCH TRUE FOR EVER.**
   `flightOf` deliberately keeps believing `latched`, because nothing on
   this side can know a pending `invoke` is dead — that is a runner
   liveness question. Stated on `flightOf` in as many words rather than
   guessed at.

### WHAT THE WALK'S OWN FILES SAY (evidence, read at
`/Users/ujju/Projects/first-walk`, 2026-08-31)

`.nputer/genesis/transcript.jsonl` holds **ten complete turns**, the last
a planner half — and the runner appends a planner line only when the turn
produced text. `.nputer/sessions.json` reads `turns: 10, status: "idle"`.
`docs/tasks/` holds four cards. **So the last turn had LANDED and the
session was idle while the screen said a turn was running** — which is the
state this card deletes. The 11th exchange the card quotes has no
transcript line of either half, and the user half is appended BEFORE the
spawn, so no 11th turn was ever accepted; that points at finding 3 above
and is why it is routed rather than guessed at.

### WHERE THE BRIEF WAS WRONG

- **ROW 4's worktree path is wrong**, as the dispatch said:
  `/Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-171` is INSIDE
  the repository and violates lane-protocol rule three. The real lane is
  the sibling `/Users/ujju/Projects/nputer-T-171` (filed as T-179).
- **ROW 4's base is wrong too, and harmlessly**: it names
  `4e08d293b0fcd14ce437840dc93cf9cff80d4635` (the newest checkpoint at
  assembly). The lane was actually cut at **`629adea`**, the dispatch stamp
  itself, which is a non-merge commit later than that checkpoint with green
  gates — the case the CONVENTIONS dispatch bullet explicitly blesses.
- **ROW 10's live facts were re-read** rather than trusted: port 1420 still
  holds nothing, on Mac.lan at the time of this run.
- Everything else in the brief matched the repository at `629adea`,
  including ROW 3's read-first set, which listed exactly what was read.

status → `verifying`; `built_by: claude-opus-5@subagent`. Verifier fields
left empty. The worktree stays until the verdict.

**ONE FURTHER NOTE FOR THE VERIFIER, so a red is not mistaken for a
defect.** `genesis-mount.test.tsx`'s *"is not stale: the build is at least
as new as the mount and the lens"* compares `app/dist`'s mtime to the
genesis sources. Any drill, any `git restore`, any checkout that moves a
source file's mtime after the last build reds it — it fired once in this
lane immediately after the drill's final restore, and `npm run build`
followed by `npm test` returned **1074/1074, exit 0**. **Build before you
test in this lane**; the message names the build, not the tree.

## Verdicts

2026-08-31 — `claude-opus-5@subagent` (blind verifier, same-model as
builder; lane `task/T-171-interview-terminal-state`, reviewed at
`9a25ebd`, base `629adea`):
**APPROVED WITH ASSIGNED CORRECTIONS** — one correction, on a sentence,
found by a poison mutant that no body kills.

### Phase 1 was kept, and the disclosure the role requires

The attack set was written to
`…/scratchpad/T-171-V-attack-set.md` **before** the diff, the three
commits or the implementation notes were opened — **26 attacks** plus a
ten-mutant set derived from the card's clauses with the test files
closed. The card was verified byte-identical between `629adea` and main
`e263585` first, so the card read was the card at its base ref.
**CONTAMINATION, DISCLOSED (roles/verifier.md ll. 36–48):** the dispatch
brief named three executor-derived specifics above the line — the
executor's boot port `14171`, "the executor reports a large mutant
count" (no number), and "its three commits". None seeded an attack; the
brief did separate the two phases explicitly, so the structural failure
the role warns about did not occur. Recorded rather than pretended
otherwise.

### What survived contact: 1 of 26

**The central question is genuinely answered, and not with a fourth
flag.** Derived at base: the footer read one boolean,
`interviewBusy = ui.busy || state.sending || state.phase === "running"`,
and the same boolean fed every `disabled` AND `completionOf`'s
`inFlight`. The lane does not add a term to that disjunction — it
**inverts the authority**: `flightOf` reads the runner's own per-turn
`status` FIRST and treats the three flags as claims a settled turn is
allowed to refuse (`stranded`). Then it **splits the question in two**:
`interviewBusy` is the FACT (hint, completion, ending) and
`interviewLocked` is the MACHINERY (every `disabled`, the focus-return
effect) — because a control enabled against a store that will refuse the
send is the same lie with the arrow reversed. That split is the fix's
real content and it is correct.

**The diagnosis was verified independently, not accepted.** Read at
`/Users/ujju/Projects/first-walk`: `.nputer/sessions.json` says
`turns: 10, status: "idle"`; `.nputer/genesis/transcript.jsonl` holds 20
lines, a user AND a planner half for every turn 1–10, and no eleventh of
either half; `docs/tasks/` holds four cards. **The last turn had landed
and the session was idle while the screen claimed a turn was running** —
so the strand was in the flags, not in a turn stuck at `status:
"running"`, and `stranded` is the right reading for the state @human
actually hit. This was attack A1 and it was the one most likely to sink
the lane; it does not.

Also attacked and clean: **the ending renders in the CHAT column**
(`interview-turns.tsx#ClosingBlock`, called from `InterviewChat` inside
the transcript region) — the chat carries no `hidden` class and takes
the frame below `lg`, where `genesis-pane-slot` is `hidden … lg:flex`
and the board half is not rendered at all, so the ending is where
@human was reading (C14/C15). **Completion gained no second source of
truth** — `completionSafely` is `completionOf` in a `try`, the exact
sibling of `showsBoard`, and nothing new reads turn text, `activity`
labels or a model-emitted marker (B9/B10, T-028/ADR-017 intact). **No
affordance it cannot honour** — `ClosingBlock` contains zero `button`
elements, pinned; the cold-start test is named as an offer that "does
not require it", per the ruling on `T-175` (D18/E23). **The second
renderer of the same sentence** (`interview-turns.tsx:241`,
`running = planner.status === "running"`) was correctly left alone: it
was already fed by the runner's measurement, which is the very evidence
this card elevates (A3). **`unlanded` cannot strand**: `run_turn` emits
`failed` before its two early returns and `started` otherwise, so every
accepted turn lands (A-series probe, verified in `agent/runner.rs`).
**Reversibility** holds — the ending stands down on the next send.

### THE CORRECTION (one, specific, in-fence)

**`app/src/genesis/interview-turns.tsx:460` — the ending says
*"The board beside this is the product of the walk"*, and below `lg`
there is no board beside it.** `GenesisScreen` renders the pane slot
`hidden … lg:flex`; `tools/e2e/tests/interview.spec.ts` asserts exactly
that at 1023 and at 800 (`slot` hidden, chat visible). The block's own
doc comment claims the narrow window as its reason for existing — *"it
is the only one a narrow window ever gets"* — so in the one case the
block was written for, its first clause names something not on screen.
At the app's configured window (1280×840) the sentence is true, which is
why this is a correction and not a rejection.

**It is a SHAPE SEVEN sighting, measured.** Mutating that clause
(`"The board beside this is the product of the walk;"` → `"Zzz nothing
at all;"`) ran the whole app suite and killed **zero** bodies —
`exit=1` from the build-mtime artifact alone. The neighbouring pin
asserts `cold-start test`, `docs/`, `does not require it` and
`cannot be that session`; it never mentions the board. The mutant aims
at a clause the pins do not name, which is the shape's definition.

**PERFORM:** reword that clause so it does not assert a board is beside
the reader — e.g. lead with the record (`docs/` in your own repository,
the cards under `docs/tasks/`) and let the board be named as a place
rather than a neighbour — **and add one assertion** to
`app/test/interview-chat-dom.test.tsx`'s *"the ending NAMES the
cold-start test…"* body (or a sibling) that pins whatever the new clause
claims, so the mutant above stops surviving. Re-run
`npm run build` then `npm test` from `app/` (build first: the staleness
body names the build, not the tree).

### Gates, every one run by this seat and read UNPIPED

Measured at `9a25ebd`; the figures below are re-derived at this seat's
own tip in the amendment under them.

- `npm ci` + `npm run build` + `npx vitest run` + `npx tsc --noEmit`
  from `lib/parser/`: **0 / 0 / 0 / 0** — 344 passed (344), 16 files.
- `npm install` + `npm run build` + `npm test` from `app/`:
  **0 / 0 / 0** — **1074 passed (1074)**, 49 files.
- **BASELINE MEASURED, NOT ACCEPTED**: the same suite at `629adea` in
  this seat's own bench — **1059 passed (1059)**, exit 0. Net **+15**
  bodies, and base is green, so no pre-existing red is attributed here.
- **BOOT GATE (fires, `app/src/**`)** — port **15171**, derived from the
  card id and deliberately NOT the executor's 14171.
  `lsof -nP -iTCP:15171 -sTCP:LISTEN` immediately before binding: **zero
  rows (exit 1)**. `NPUTER_BOOT_PORT=15171 npm run boot:check` from
  `tools/e2e/`: **exit 0**, both lines —
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-171` and
  `[nputer] window "main" created`.
- **PORT RULE**: `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else —
  **zero rows (exit 1)**; @human's app was not running. Never
  bind-probed, never connected.
- **GRAPH — ASKED, NOT REGENERATED.**
  `cargo run -p nputer-index -- index --check --root ../..` from
  `app/src-tauri/`: **exit 1, `graph.json is STALE`**, and a REAL stale,
  not the `committed: MISSING` false red — committed 1,134,163 bytes ·
  199 files · 2,418 symbols · 2,330 edges against a fresh 1,139,673 ·
  199 · 2,425 · 2,348; `files +0 -0 ~8`, naming exactly this lane's
  eight files; `edges +27 -9`; no new file, no component moved. Budget
  **1,139,673 of 2,145,959 (53.1%) — 1,006,286 left**.
  `docs/architecture/graph.json` is untouched and uncommitted; it is
  outside this fence and is the integrator's to clear.

### The mutant ledger — this seat's own, in its own bench

Bench: `/private/tmp/nd-T-171v`, **cut fresh and detached at `9a25ebd`**
by this seat, short root, own `CARGO_TARGET_DIR`. **The executor's bench
was NOT reused** — no bench of the executor's was touched, read or
inherited, so these numbers are independent of theirs. Mutants were
applied ONE SIDE ONLY (source; the test files were never mutated), each
read back with `git diff --stat` before running, and **every restoration
proved by sha256 against the committed blob** (`restored=True`, 14/14).
The pre-existing build-mtime bodies (*"is not stale: the build is at
least as new as…"*) red mechanically under any source mutation and are
excluded from every count below.

| # | mutation (derived from the CARD, tests closed) | bodies |
|---|---|---|
| V1 | the stranded claim is BELIEVED again — pre-fix behaviour | 2 |
| V2 | turn evidence never read (`running` loop deleted) | 3 |
| V3 | completion ignores in-flight (reversibility gone) | 3 |
| V4 | an empty board is celebrated (planning theater) | 6 |
| V5 | **the ending deleted from the CHAT column** | 3 |
| V6 | the cold-start test becomes a REQUIREMENT | 1 |
| V7 | a failed/cancelled tail is celebrated as an ending | 2 |
| V8 | `inputHint` back to two states — the ending unreachable | 2 |
| V9 | `unreadable` collapses into `noBoard` | 1 |
| V10 | the invitation ignores `canAnswer` | 1 |
| V11 | the `unlanded` clause neutralised | 2 |
| V12 | `data-flight` hardcoded — are the DOM values load-bearing | 3 |
| V14 | the ending's `next` testid renamed | 1 |
| **V13** | **the ending's "board beside this" clause rewritten** | **0 — SURVIVOR** |

13 killed, **one survivor, and it is the correction above**. V5's three
reds are what make C14 a pin rather than a coincidence: the ending is
genuinely required in the half @human was reading.

### Security sweep (mandatory, roles/verifier.md step 3)

Clean. **No dependency additions** — `package.json`, the lockfiles and
`Cargo.*` are 0-byte diffs. No new input path, no new IPC: the diff adds
no `invoke(`, no `spawn`, no `Command`, no Tauri command; the only
`genesis_*` strings are test-harness fixtures. No raw-markup sink
(`dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function` all absent).
No secrets or keys. No authz surface is touched.

### Binding exclusions, and the routed items verified independently

- **`BANKING_MAP` is a 0-byte diff** — `app/src/genesis/genesis-derive.ts`
  is not in the diff at all, and neither is `method/`. The nine-row table
  is unmoved; `T-173`'s bump is not encroached (E21).
- **Nothing spawns** (E22), and **`app/src-tauri/**` is a 0-byte diff** —
  `T-175`'s fence is untouched.
- **Completion is not gated on the cold-start test**; the block says
  "does not require it", pinned, and mutating it to a requirement reds
  (V6).
- **FENCE (E24), checked against `.nputer/lane-fence.json` rather than
  against the claim**: the manifest carries `app/src/genesis` and seven
  named `app/test` files, `alwaysWritable: ["docs/tasks"]`. All nine
  changed paths fall inside it. The fence was never widened.
- **THE ROUTED ITEMS ARE GENUINELY OUT-OF-FENCE — verified, not taken on
  the excuse.** All three live in `app/src/lib/agent-store.ts`
  (`cancelGenesis` resetting nothing on `{kind:"idle"}`;
  `reduceGenesisOutcome`/`applyGenesisStatus` arming flight with no seq
  guard) or in the Rust runner (a command that never answers). The
  manifest carries neither path, so the fence genuinely does not reach
  them. **Finding 2 is the load-bearing one** and it is the mechanism the
  lane's own DOM fixture reproduces through the shipped store; it should
  be carded, because this card makes the SCREEN honest while leaving the
  STORE permanently stranded, and the next reader of that store will meet
  it again.

### What this seat could NOT verify, and why

- **That the stranded claim on @human's machine arrived by
  `applyGenesisStatus` specifically.** The walk's files prove the turn
  landed and the session was idle; which of the two unguarded arming
  paths fired is not recoverable from disk, and the lane says so itself
  rather than guessing. It does not change the verdict: the screen is
  fixed against the class, not against one path.
- **The rendered appearance at any width.** Verification here is
  headless; jsdom applies no breakpoint, so the below-`lg` claim above is
  derived from the class list plus the e2e spec's own 1023/800
  assertions, not from a rendered pixel. A human eye still owes this
  screen a look.
- **`tools/e2e`'s own suite was not run** — it is outside this fence and
  no e2e spec changed; `npm ci` there succeeded (exit 0) and was used
  only for the boot gate.

### Gates re-run at THIS seat's own tip (roles/verifier.md step 7)

Appending a verdict is a commit, and prose is a code input. Re-derived
after this verdict landed, at the commit this seat created — the figures
in the ledger and gate lists above are stated at `9a25ebd` and the ones
below at this tip:
