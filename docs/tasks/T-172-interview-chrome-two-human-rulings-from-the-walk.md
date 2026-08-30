---
id: T-172
title: Interview chrome, two @human rulings from the walk — the "one question at a time · N of 7" line goes, and "Bank answer" is just "Answer"
feature: F-03
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
suggested_by: "@human's genesis walk (2026-08-30) — both rulings verbatim in the walk debrief"
touches: [app-interview]
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

Two rulings from @human's milestone-3 genesis walk, both about the
interview screen's chrome, neither needing a room — @human ruled them
in the debrief and the card exists so the rulings land as code:

1. **The status line under planner messages goes.** @human, verbatim:
   *"this is unnecessary -> one question at a time · 6 of 7"*. The
   stage is already carried by the header ("stage 7 of 7 ·
   decomposition") and the progress segments; the per-message
   repetition is chrome restating chrome.
2. **The bank button says "Answer".** @human, verbatim: *"'Bank
   answer' button should be just answer."* "Bank" is the method's
   internal verb for the write-to-disk step; the person answering a
   question is answering a question. The banked→files confirmation
   line already tells the write story after the fact, where it is
   news.

Acceptance: the line is absent from every planner message; the button
reads "Answer" (the banked→ confirmation stays); the e2e interview
spec's affected bodies updated WITH the rename asserted, so a revert
reds.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-03 p2, with one correction to its acceptance

Both strings located at `b60b06d`, so the lane starts from the sites
rather than from a search: the button is
`app/src/genesis/InterviewChat.tsx:540` (`Bank answer`, with a second
occurrence in a comment at `:231` that is prose about focus and must not
be swept blindly), and the status line is built in
`app/src/genesis/interview-model.ts:386-387`
(`one question at a time · N of M`).

**THE CORRECTION: THE E2E LANE ASSERTS NEITHER STRING TODAY, so there
are no "affected bodies" to update.**
`command grep -rn "one question at a time" tools/e2e/tests/` returns
nothing, and `tools/e2e/tests/interview.spec.ts` reaches the bank step
through `getByTestId("interview-banked")` rather than through the
button's text. So the card's *"e2e interview spec's affected bodies
updated WITH the rename asserted, so a revert reds"* is satisfied only
by ADDING an assertion — the acceptance is a new pin, not an edit to an
existing one, and a lane that reads it the other way will report the
sweep complete with nothing pinning either ruling.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.

## IMPLEMENTATION (2026-08-31, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-172` on
`task/T-172-interview-chrome`, base `fbeac77`, work commit **`207b915`**.
Every figure below is re-derived at one of those two refs, or carries the
clock and host it was read at.

### What was built

**Ruling 1 — the per-message status line is gone.** `questionFooter` is
deleted from `app/src/genesis/interview-model.ts` (a comment holds its
place and the ruling's words, so the next reader of `stageReadout`'s
sibling comment is not left guessing), and the
`interview-question-footer` span is gone from BOTH treatments that drew
it — `CurrentQuestion` and `ChallengeTurn` in
`app/src/genesis/interview-turns.tsx`. The stage is untouched where the
ruling says it already lives: `stageReadout` and the seven-segment
`StageStrip`, both in the header.

**Ruling 2 — the button reads `Answer`.** `app/src/genesis/InterviewChat.tsx`.
The banked→files confirmation is untouched; its existing pin (*"a file
landing after the turn chips against it, showing the PATH"*) already
reds on a revert, so no new assertion was owed for that half and none
was written.

**THE SECOND `Bank answer` WAS READ, NOT SWEPT.** The occurrence in the
focus comment is prose naming the control a reader can see — it explains
why a button click and an `⏎` send are indistinguishable after the box
blurs. Left as-is it would have been a citation of a label that no longer
exists, so it moved with the label and says in one clause that it did.
The test body named *"a send from the BANK BUTTON…"* was deliberately
NOT renamed: it names the testid `interview-bank`, which did not move.

### THE CONSEQUENCE THE BUILD GATE FOUND — the better half of the diff

`PlannerTurn` took `approxStage` for ONE reason: to feed the footer.
Dropping the line drops the prop (`noUnusedParameters` is on, so this
was not optional), and `React.memo` therefore no longer sees the stage —
**a docs-stage change now invokes no planner turn at all.**
`app/test/interview-resume-dom.test.tsx`'s memo-economy row tightens
from `[0,0,0,0,0,0,1]` to seven zeros. The live-delta arm directly above
it drives the same counter to `[0,0,0,0,0,0,1]`, which is what keeps the
all-zero row from being an empty comparison (POISON DRILL shape TEN).

**THE SWEEP, NAMED AND RUN.** Class: *JSX call sites passing
`approxStage` to `PlannerTurn`.* `command grep -rn "approxStage="` over
`app/ tools/ lib/` found **4** at `fbeac77` — one in `InterviewChat.tsx`
and three in `interview-resume-dom.test.tsx` (the last three found by
the build gate, not by me, which is why the sweep is recorded rather
than claimed). The same search now returns **0, exit 1**; the zero is a
measured zero because the identical search returned 4 before the fix.
Every other `approxStage` in the tree is the derivation's own field
(`stageOf`, `stageReadout`, `stageStrip`, `genesis-derive`,
`GenesisPane`) and is untouched.

### Gates — every command with its exit, read unpiped

| command | run from | exit |
|---|---|---|
| `npm ci` | `lib/parser/` | 0 |
| `npm run build` | `lib/parser/` | 0 |
| `npm install` | `app/` | 0 |
| `npm run build` (BASELINE, at `fbeac77`) | `app/` | 0 |
| `npm test` (BASELINE, at `fbeac77`) | `app/` | 0 — 49 files / 1060 tests |
| `npm run build` (first attempt) | `app/` | **2** — TS2322 ×3, the `approxStage` call sites |
| `npm run build` (after the sweep) | `app/` | 0 |
| `npm test` (first attempt) | `app/` | **1** — 1 failed / 1059, the memo row |
| `npm run build` (FINAL, at `207b915`) | `app/` | 0 |
| `npm test` (FINAL, at `207b915`) | `app/` | 0 — 49 files / 1060 tests |

Both reds are recorded rather than hidden: each was a real consequence
of the ruling that the gate found and I had not, and each is the reason
a line of this diff exists.

**The suite count is unchanged at 1060 and that is a coincidence worth
stating** — one body left (`questionFooter` counts to seven, gone with
its producer) and one arrived (the button label). An exit 0 over a
count that did not move is not by itself evidence that anything new ran;
the drill below is.

### Standing gates — DERIVED from this diff, not taken on trust

- **BOOT GATE — FIRES** (diff touches `app/src/**`), and CONVENTIONS
  assigns it to the executor too, before handing off (T-046 criterion 6).
  **RUN: `NPUTER_BOOT_PORT=14172 npm run boot:check` from `tools/e2e/`
  — exit 0**, both startup lines seen:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-172` and
  `[nputer] window "main" created`. The port is DERIVED from this card's
  id (T-172 → 14172), never defaulted — three other lanes were live and
  a port is MACHINE-scoped. `lsof -nP -iTCP:14172 -sTCP:LISTEN`
  returned zero rows immediately before the run; `lsof -nP -iTCP:1420
  -sTCP:LISTEN` returned zero rows (read 2026-08-31 on Mac.lan) and was
  the only command pointed at 1420.
- **GRAPH REGEN — FIRES** (diff touches `*.ts`/`*.tsx` outside `docs/`).
  The regen belongs to the CHECKPOINT and `docs/architecture/graph.json`
  is outside this fence, so it was ASKED rather than run:
  `cargo run -p nputer-index -- index --check --root ../..` from
  `app/src-tauri/` answers **exit 1 STALE**, and the second line proves
  it is a REAL stale rather than the `--root` false red (it prints both
  count sets and a file diff, where a false red says `committed:
  MISSING`). **The movement, at `207b915`:**
  - `files +0 -0 ~7` — content only, so **the checkpoint owes NO fixture
    reconciliation**
  - symbols `2067 → 2066` (`questionFooter` gone), edges `+2 −3` (the
    `PlannerTurn → questionFooter` call edge, and the symbol dropping
    out of two import edges)
  - bytes **`1039590 → 1039086`, −504**, so budget headroom goes
    **410 → 914** bytes against the 1,040,000 budget.
  **THIS LANE GIVES THE HOLD BACK MORE THAN IT SPENDS.** STATE holds the
  code queue at 410 bytes until `T-140-s4` merges; this diff is
  net-NEGATIVE on the graph and widens that margin by 504 bytes rather
  than eating into it. Stated for the integrator to check, not to act on.
- **DOCS GATE — FIRES** (this diff adds `docs/tasks/T-172-s1-*.md` and
  edits this card, and `docs/tasks/*.md` is read by code suites). The
  DIFF half is the integrator's hand run under the RANGE RULE's own
  pair; what an executor can answer is the whole-tree half and the
  suites that read the path, and all three were run **after** the card
  writes rather than before them:
  - `npm run lint:docs` from `tools/e2e/` — **exit 0**, reporting *"every
    live task card's frontmatter parses, with a legal status"* and
    *"governing-document budgets hold — 4 gated, 0 awaiting"*. That
    sentence is the one that covers both writes: this card's new
    `status: verifying` and `T-172-s1`'s `status: suggested`.
  - `npx vitest run` from `lib/parser/` — **exit 0**, 16 files / 336
    tests. This is the suite whose smoke test parses the repo's LIVE
    `docs/` tree and requires zero issues, so it is the body that would
    have caught a malformed new card.
  - `npm test` from `app/` — **exit 0**, 49 files / 1060 tests, re-run
    after the card writes for the same reason.
  Both historical instances this gate exists for — `9c64cd8` and
  `fede266` — were a card's FRONTMATTER reddening a code suite three
  layers away, which is exactly what these three answer.
- **METHOD EVAL GATE — NOT OWED**: nothing under `method/**` is touched.

### THE POISON DRILL — the ledger

**Drilled in a detached scratch worktree, at a commit, at a stem DERIVED
from the lane**: `/private/tmp/nd-T-172`, detached at `207b915`, cut and
installed before any mutation and clean at every boundary. CONVENTIONS
says in as many words that drilling in place is not the remedy; the
worktree is the lane's own id at a short root so no sibling lane can
collide with it, and the driver's guard checks THIS drill (path + commit
+ clean tree) rather than a shared prefix. **Every mutation is
ONE-SIDED and lands on the SOURCE, never on an assertion** — no mutant
here can move both sides of a comparison at once.

Twelve new-or-changed assertions, twelve shown capable of failing:

| # | assertion | file | mutant | result |
|---|---|---|---|---|
| 1a | `interview-question-footer` count is 0 | chat-dom | **M1** footer span back in `CurrentQuestion` | RED, and **alone** (1 body) when not rebuilt |
| 1b | 2 planner messages rendered *(control)* | chat-dom | **M4** `interview-planner-turn` testid renamed | RED — `expected [] to have a length of 2` |
| 1c | 1 current question rendered *(control)* | chat-dom | **M5** `interview-turn-current` testid renamed | RED |
| 1d | the phrase is in no planner message | chat-dom | **M9** phrase re-added with NO testid | RED, **exactly 1 body** |
| 2e | the pushing-back block rendered *(control)* | chat-dom | **M7** `interview-turn-challenge` testid renamed | RED |
| 2f | the challenge body carries its text *(control)* | chat-dom | **M6** `<ChallengeTurn body={""} />` | RED |
| 2g | the challenge's footer node is null | chat-dom | **M2** footer span back in `ChallengeTurn` | RED, **exactly 1 body** |
| 2h | the phrase is not in the challenge block | chat-dom | **M10** phrase re-added to the challenge, no testid | RED, **exactly 1 body** |
| 3i | the button's label `=== "Answer"` | chat-dom | **M3** label back to `Bank answer` | RED, and **alone** (1 body) when not rebuilt |
| 4j | the footer's `· ` spelling is not in the bundle | harness | **M1 + rebuild** | RED — `expected true to be false` |
| 4k | `Bank answer` is not in the bundle | harness | **M3 + rebuild** | RED — `expected true to be false` |
| 5m | a docs-stage change invokes no planner turn | resume-dom | **M8** `approxStage` prop threaded back | RED, **exactly 1 body** |

**SHAPE SIX, ASKED AND ANSWERED RATHER THAN WAVED AT.** The rule is not
*"is this a duplicate?"* but *name a mutant this body kills, run the
WHOLE suite, require the failing-body count to be ONE.* Six of the
twelve are answered that way outright (1a, 1d, 2g, 2h, 3i, 5m each red
exactly one body). 1a and 3i needed the extra run that proves it: M1 and
M3 were re-run WITHOUT the rebuild, so the bundle stayed clean and the
harness body could not cover for the DOM body — each then redded alone.
Conversely M9/M2/M10 red the DOM bodies while the bundle bodies stay
green, so the two layers are not copies of each other in either
direction.

**A MUTATION FAILED AND IT IS RECORDED, NOT QUIETLY RE-CUT.** M6's first
regex reported a substitution and produced the WRONG TEXT — it ate the
`className` and left the file unparseable, so the run was 15 files
failing at *"Transform failed"* over 863 tests, which is a broken tree
rather than a killed mutant. This is exactly the case CONVENTIONS names
(*the count was right and the TEXT was wrong*), it was caught by reading
the diff back before believing the result, and M6 was re-cut against the
call site instead. The re-cut kills 2f and its own neighbour and nothing
else.

**RESTORATION, PROVED BY HASH ON ALL 13 RUNS.** Every mutant is restored
with **both sides named** — `git restore --source=207b915 --staged
--worktree -- <path>` — and proved by `git show 207b915:<path> | shasum
-a 256` against the working file, never by an empty `git diff`. The two
blobs:

    app/src/genesis/interview-turns.tsx
      0c02ca14bcdc83caada077b4e25e32c4d476465a0a2d898755a4678e576a689d
    app/src/genesis/InterviewChat.tsx
      4fca13f1dcf4134440c7ed454a51d3e680e2d761696937a076ed60bddce5d280

Every run matched. Both worktrees are clean at `207b915` afterwards, and
all seven files this lane touched hash-match their committed blobs in
the lane itself — the drill never ran in the lane, so nothing here was
ever mutated.

### What was ROUTED rather than built, and why

**The card's acceptance asks for an e2e pin this fence cannot write.**
Re-derived at `fbeac77` rather than inherited from the triage note:
`command grep -rn "one question at a time" tools/e2e/tests/` and the
same for `Bank answer` and `interview-question-footer` all return
nothing, and `interview.spec.ts` reaches the bank step through
`getByTestId("interview-banked")` — its only `getByRole("button", …)`
calls name *"Toggle theme"*. So there are no affected bodies: the
criterion is a NEW assertion, in `tools/e2e`, which `app-interview` does
not reach. **Routed as `T-172-s1`**, naming the fence it needs
(`touches: [tools/e2e]`), the two assertions it should carry, the
narrowed needle and why the narrowing is load-bearing, the two mutants
that already kill them, and a disposition hint. The fence was not
widened.

### The residual, stated rather than left to be found

- **This lane's pins are jsdom and bundle-grep; no browser has seen
  either ruling.** That is THE E2E LANE'S HONEST SCOPE read the other
  way round, and it is precisely what `T-172-s1` exists to close.
- **`docs/design/claudedesign_handoff/nputer app.dc.html` still draws
  both retired strings** (`Bank answer`, `one question at a time · 4 of
  7`) and `docs/tasks/T-027-interview-split-view.md` §3 still specifies
  the footer. Both are outside this fence, and both are RECORDS of what
  the design said rather than claims about what the app does — a
  handoff mockup and a shipped card are supposed to preserve the state
  they were written in. Named here so the next reader does not file them
  as a miss.

## Verdicts

### 2026-08-31 — claude-opus-5@subagent — **APPROVED**

Blind pass. **Phase 1 was kept and is auditable**: the attack set was
written to
`…/scratchpad/T-172-attack-set.md` — **34 attacks and 6 mutants** —
before the lane's diff, its commits or the IMPLEMENTATION section above
were opened. It was built from this card **at its base ref `fbeac77`**
(so the notes could not exist in the copy I read), `docs/CONVENTIONS.md`,
`method/roles/verifier.md`, `docs/STATE.md` at `fbeac77`, and my own
reading of `app/src/genesis/**` at `fbeac77`. The brief that dispatched
me named no executor-derived specifics — no mutant numbers, no path
counts, no suite figures — so nothing above the line was broken.

**34 attacks fired. 0 found a defect.** Two observations are recorded at
the end; neither is a correction and neither blocks the merge.

**The dispatcher's note was verified, not trusted.** At `fbeac77`,
`git grep` over `tools/e2e` for `one question at a time`, `Bank answer`
and `interview-question-footer` returns nothing, and
`interview.spec.ts` reaches the bank step through
`getByTestId("interview-banked")`. So the acceptance's e2e clause was
indeed a NEW assertion outside the fence. **It was routed, not dropped**
— `T-172-s1`, `touches: [tools/e2e]`, whose frontmatter shape matches
the house pattern for a suggested card exactly (compare `T-179`, same
five fields, same bare-path `touches:`), and which names the two
assertions, the narrowed needle, the reason the narrowing is
load-bearing, and the two mutants that already kill them. `tools/e2e` is
a 0-byte diff. **The fence was not widened.**

**Both treatments lost the line.** `ChallengeTurn` and `CurrentQuestion`
each drew `interview-question-footer` independently at the base; both
lost it, both lost the now-dead `footer` prop, and `questionFooter` is
gone from the model. My **M2** (footer restored to `ChallengeTurn`
ALONE — the path a one-path fix forgets) reds, so the second path is
genuinely pinned rather than merely happening to be clean.

**The header did NOT lose the stage.** `stageReadout`, `stageStrip`,
`INTERVIEW_STAGES` and the `interview-stage-readout` /
`interview-stage-segment` renders are byte-identical to `fbeac77`. The
changed DOM body declines to re-assert the stage and defers to *"the
stage strip renders seven segments and follows the DERIVED stage"*; **I
checked that deferral rather than accepting it** — my **M5** (break
`stageReadout`) and **M6** (break `stageStrip`) both red that very body.
The claim is true, not a hand-wave, and the deferral is correctly shape
SIX rather than a gap.

**The second occurrence was read, not swept.** The focus comment now
says `an "Answer" button click` — grammatical, and it carries one clause
recording that the label read `Bank answer` until T-172, so it is
neither a citation of nothing nor a silent rewrite. **And the collateral
prose survived**: `InterviewChat.tsx`'s not-started paragraph (*"The
planner asks one question at a time…"*) is untouched, as are the
placeholder, the `⏎ send` hint, the Rust planner prompts in `kit.rs`,
and the design/handoff records. A blind sweep would have taken at least
the first of those.

**The second-order damage was found, and the pin was RE-DERIVED rather
than LOOSENED.** `approxStage` fed only the retired footer, so dropping
it takes it out of `memo`'s comparison and a docs-stage change now
invokes no planner turn at all. `interview-resume-dom.test.tsx`'s
memo-economy row moves `[0,0,0,0,0,0,1] → [0,0,0,0,0,0,0]`, which is
**stricter**, carries its story, and reds on a revert. **The zero is not
vacuous and I confirmed the control is real**: the arm immediately above
it, in the SAME body against the SAME `plannerRenderCounts` fixture
cleared between arms, drives that counter to `[0,0,0,0,0,0,1]` on a live
delta — so the fixture is proven able to record an invocation before an
all-zero row is written down.

**Vacuity swept, and the sharpest attack landed on the harness.**
`interview-harness.test.ts` greps a ~470 KB bundle, and the chat's own
not-started sentence ships the bare phrase — so a naive flip of that
control to `false` would red even on a correct fix. The needle was
instead narrowed to the count's own prefix (`one question at a time · `)
while the bare-phrase control is KEPT at `true`, which is what makes the
`false` a claim about the footer's spelling rather than about a bundle
that lost the module. **Measured, not read**: under M1 + rebuild the
narrowed needle reds with *"expected true to be false"* while the bare
control stays green. That is the right answer to shape EIGHT.

### Gates — every one run by me, exits read UNPIPED

| command | run from | exit |
|---|---|---|
| `npm ci` | `lib/parser/` | **0** |
| `npm run build` | `lib/parser/` | **0** |
| `npm install` | `app/` | **0** |
| `npm run build` | `app/` | **0** |
| `npm test` | `app/` | **0** — 49 files / 1060 tests |
| `npm ci` | `tools/e2e/` | **0** |
| `NPUTER_BOOT_PORT=17200 npm run boot:check` | `tools/e2e/` | **0** |
| `npm run lint:docs` | `tools/e2e/` | **0** (lane tip) |
| `npx playwright test tests/interview.spec.ts` | `tools/e2e/` | **0** — 6/6 in real Chromium |
| `index --check --root ../..` | `app/src-tauri/` | **1 — STALE, correctly** |

**AND THE INTERVIEW WAS WALKED IN A REAL BROWSER, which the card did not
ask for.** `tools/e2e` is a 0-byte diff, so no e2e body could have been
edited to fit — but `interview.spec.ts` DOES drive
`interview-turn-current` and `interview-turn-challenge`, the two
containers whose child span this diff removes, and a `toHaveText` there
would have broken silently under jsdom-only verification. It reads
`toContainText`, so shortening the container is safe by construction;
**I ran it anyway rather than reasoning about it** — 6/6, exit 0, on
`NPUTER_E2E_PORT=17201` (derived, lsof-read to zero rows first; 14520
was held by another lane's node at pid 42017 and was left alone). This
proves NO ADJACENT BREAKAGE in a browser. It does **not** pin either
ruling — that is exactly and only what `T-172-s1` is for, and the
distinction is the point.

**BOOT GATE — FIRES and PASSES.** Port **17200**, derived from this
card's id (172 → 17200) and deliberately NOT the executor's 14172, so
the run is independent. `lsof -nP -iTCP:17200 -sTCP:LISTEN` returned
zero rows immediately before binding. Both `[nputer]` lines observed:
`[nputer] project folder: /Users/ujju/Projects/nputer-T-172` and
`[nputer] window "main" created`. **1420 was read with
`lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else** — zero rows.

**GRAPH REGEN — FIRES. ASKED, NEVER REGENERATED**, since
`docs/architecture/graph.json` is outside this fence. Exit **1 STALE**,
and it is a REAL stale rather than the `--root` false red — the second
line prints both count sets and a `~` file diff, where a false red would
say `committed: MISSING`. What it says, at `776fad5`: `files +0 -0 ~7`
(content only, so **no fixture reconciliation is owed**), symbols
`2067 → 2066`, edges `+2 −3`, and bytes **`1039590 → 1039086`, −504**.
**I independently confirm the lane's most consequential side effect: the
regen SHRINKS the graph, taking headroom from 410 to 914 bytes against
the 1,040,000 budget.** This diff gives the hold back more than it
spends. The regen and the commit are the integrator's step.

### My mutant ledger — 6 derived blind from the two rulings, 6 killed, **0 survivors**

Drilled in **my own** detached worktree `/private/tmp/nd-T-172v` at
`776fad5`, one stem for every artefact. **I did NOT reuse the executor's
`/private/tmp/nd-T-172`** — it sits at `207b915`, and reusing a drill
bench the builder prepared would weaken exactly the independence this
seat exists for. Mine was cut, installed and baselined green (49 / 1060)
before any mutation. Every mutation is **one-sided and on SOURCE**, read
back with `git diff` before running, and every restoration proved by
`shasum -a 256` against `git show 776fad5:<path>`.

| # | mutant | one-sided change | result |
|---|---|---|---|
| **M1** | footer span back in `CurrentQuestion` ONLY | `interview-turns.tsx` | RED, **exactly 1 body** (no rebuild); **2 bodies** with rebuild — DOM + the narrowed bundle needle |
| **M2** | footer span back in `ChallengeTurn` ONLY | `interview-turns.tsx` | RED — the challenge body; **2 bodies** with rebuild |
| **M3** | button label back to `Bank answer` | `InterviewChat.tsx` | RED, **exactly 1 body** (clean bundle, no rebuild); **2 bodies** with rebuild |
| **M4** | button label → a THIRD string, `Submit` | `InterviewChat.tsx` | RED, **exactly 1 body** — `expected 'Submit' to be 'Answer'` |
| **M5** | `stageReadout` counts `at + 1` | `interview-model.ts` | RED — **2 bodies**, incl. the one the changed DOM body defers to |
| **M6** | `stageStrip` emits six segments | `interview-model.ts` | RED — **5 bodies** |

**M4 is mine and is not on the executor's ledger.** It answers a
question `Bank answer`-only mutants cannot: the label pin is an
EQUALITY, so it names `Answer` rather than merely *not* the retired
string. It reds alone.

**Shape SIX asked and answered on my own set**: M1, M3 and M4 each red
**exactly one** body, so each of those assertions kills a mutant no
other body kills. M1/M3 without a rebuild is what isolates the DOM layer
from the bundle layer; with a rebuild both layers red, so the two layers
cover each other rather than duplicating.

**Restoration, proved on every run.** Final state of the drill worktree:
`git status --porcelain` empty and all three source blobs hash-matched —
`interview-turns.tsx` `0c02ca14…a689d`, `InterviewChat.tsx`
`4fca13f1…ce5d280`, `interview-model.ts` `2828d054…85f720`. The first
two independently reproduce the hashes the IMPLEMENTATION section
quotes. Drill baseline green again after the last restore: 49 / 1060,
exit 0. **Nothing was ever mutated in the lane itself.**

### Scope, fence and security

**Nine files, every one inside the fence.** Read from the lane's own
`.nputer/lane-fence.json`, `app-interview` expands to `app/src/genesis`
plus seven named `app/test` files, with `docs/tasks` always writable.
The diff touches three of the former, four of the latter and two cards.
**No file outside it** — `docs/architecture/graph.json`,
`docs/STATE.md`, `docs/CAPABILITIES.md`, `tools/e2e` and `app/src-tauri`
are all 0-byte diffs. Nothing the card did not ask for.

**Security sweep — clean.** No new input path, no new endpoint, no
dependency added (`package.json` / lockfiles are 0-byte diffs), no
secrets or keys in the diff, and no raw-HTML sink anywhere under
`app/src/genesis/` (`dangerouslySetInnerHTML`, `innerHTML`, `eval`,
`new Function` all absent), so the standing grep in
`genesis-pane-dom.test.tsx` keeps its fence. This diff only DELETES
render output and renames one label.

### Two observations — NOT corrections, and neither blocks the merge

1. **`has("Bank answer") === false` now depends on comment stripping.**
   That string survives twice in `InterviewChat.tsx` comments (the focus
   note and the ruling note), and that file is bundled — the pin passes
   only because the production build drops comments. Verified empirically
   rather than assumed: the baseline is green with both comments present,
   so stripping is real today. **The failure mode is a FALSE RED**, which
   is loud and diagnosable, and the comments are worth more than the
   fragility; recorded so a future reader who flips a `legalComments`
   setting knows where the red came from. No action owed.
2. **No browser PINS either ruling** — jsdom and bundle-grep only. The
   executor states this residual itself and it is correct as stated; I
   narrowed it by one notch by walking `interview.spec.ts` in real
   Chromium (6/6, above), which rules out adjacent breakage but asserts
   nothing about the retired line or the new label. `T-172-s1` is the
   card that closes the remaining half. Recorded so its disposition is
   not quietly forgotten once this merges.

**Left for the integrator:** regenerate `docs/architecture/graph.json`
(the −504 bytes above), and run the DOCS GATE's diff half under the
range rule. **`status` stays `verifying`; `verified_by` stamped.** My own
drill worktree `/private/tmp/nd-T-172v` is left in place, clean and
detached at `776fad5` — I removed no worktree, merged nothing and pushed
nothing.
