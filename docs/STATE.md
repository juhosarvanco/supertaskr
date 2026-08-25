# State

Updated: 2026-08-25 by the T-107 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: SIX LANES ARE LIVE
— NOT FOUR — NOTHING IS APPROVED AND WAITING, AND AN APPROVED CARD JUST
SHIPPED WITH ONE ACCEPTANCE CRITERION UNMET ON PURPOSE.** Nothing on main
is broken — this merge was **455 / 958 / 264 / 146 green, first time, no
re-runs, nothing discarded**. But **two known intermittents will meet you
before any real defect does**, and the lane list this checkpoint inherited
was already wrong when it was written. Read the next three sections
before you debug anything, and the lane section before you cut anything.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the SEVENTH checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded float
it captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND THREE PASSES HAVE NOW
CAUGHT IT WITH THE DIGITS**, which is what turns a warning into an
identification. T-086's lane, T-107's lane and T-107's verifier each hit
it on their FIRST E2E run in a fresh worktree, each with a different
timestamp and the identical shape:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** It did NOT fire at this merge — 146/146
first time, ONE run, nothing to declare — because main is not a fresh
checkout. **DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN**, and if you do
run twice, DECLARE BOTH RUNS: T-107's lane and its verifier each declared
theirs. The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. T-052's lane removed this
finding's own "needs a fresh checkout to prove" prerequisite by
reproducing the red ON DEMAND in a healed worktree, so whoever takes the
fix can verify it anywhere.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS FIVE CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory.** T-110's experiments named the cause: same TREE, two
checkouts, and then same CHECKOUT, two target dirs —

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds. **A tally that mixes checkouts is not a flake rate** — the
historical numbers moved with WHERE each session happened to run.

### THE CLOCK TEST STILL SEPARATES GREEN FROM RED, AND MAIN IS STILL IN THE GREEN BAND

T-124 found the lib suite's own `test result:` time sorts its runs
perfectly — every green under 9.5s, every red over 14.6s, **a gap of more
than five seconds with nothing in it** — and T-052 reproduced it. Main's
target directory was reclaimed two checkpoints ago and the prediction
keeps holding: `du -sh app/src-tauri/target` reads **2.9 GB** here (2.4 GB
one checkpoint ago — it grows with every cargo run, including this
merge's), and this merge's `cargo test` ran the lib suite in **3.99s**,
with the watcher body `ok`. **Twelve runs across four integrations and not
one lands between 9.5s and 14.6s.** Read the lib suite's own time first;
it tells you which regime you are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit, and `target/debug/nputer` in this checkout is no
longer the running binary — @human's app moved to its own checkout. What
remains is that a lane may be building against this repository, and there
are SIX of them right now: `lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`, LIVE ON A CLEAN CACHE

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs:2926`, T-039's, last touched by
T-124) had been declared settled at better than 400-to-1 on 15 clean-cache
runs that saw it zero times. **T-086's lane refuted that within the hour**:
it redded **1 in 4** full `cargo test` runs in a FRESH lane worktree —
with the `docs_watch` body GREEN and the lib suite at **3.97s**, inside
the healthy band — so the cache cliff cannot be what crossed its deadline.
Run alone the body is **5 green in 5** (0.18–0.45s). The lane's diff was
markdown with **zero `.rs` paths**, so it cannot have moved it.

**THE SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 19**;
seeing zero in fifteen at that rate has probability **0.44**. The card
carries the whole account — this section is the pointer, not a second
copy. **Live, load-sensitive, ~1-in-19 on a clean cache, and it is
`T-086-s1`'s subject.** It did NOT fire at this merge (read by NAME, `ok`,
rather than inferred from a green exit), which is one more data point and
not a reprieve.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE TENTH MEASUREMENT SAYING SO.** A live lane's tip is a
live-environment fact, not a function of a tree; what is stable is WHICH
lane holds WHICH fence. For a tip, run `git worktree list`.

| lane | fence (`touches:`) | board says |
|---|---|---|
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |
| **T-091** | `[tools/e2e]` | building |
| **T-102** | `[app-agent]` | building |
| **T-108** | `[docs/tasks/T-027-…, T-025-…, T-081-…]` — THREE CARDS | **planned on main** |
| **T-116** | `[app-map]` | **planned on main** |

**FIVE LANES AFTER THIS CHECKPOINT CLOSES T-107's, AND THE DISPATCH BRIEF
FOR THIS MERGE SAID THREE.** It named T-033, T-102 and T-091 and was right
about those; **T-108 and T-116 were dispatched WHILE THIS INTEGRATION WAS
RUNNING** — their dispatch commits are timestamped **15:20:43** and
**15:23:16**, and this merge landed at 15:20. Nothing is wrong with the
brief's author: a lane list is a live-environment fact and it went stale
between writing and reading, for the TENTH consecutive record.
**DERIVE IT; NEVER READ IT OFF A BRIEF OR OFF THIS TABLE.**

**THE BOARD-TRUTH WINDOW IS WIDER THAN `verifying` AND THIS CHECKPOINT CAN
SHOW IT AT `building` TOO.** T-108's and T-116's cards read
`status: planned` ON MAIN while both lanes are cut, stamped
`status: building` on their own branches, and working. Six earlier
checkpoints recorded the same window at `verifying`; the mechanism is
identical and the field is different, which is evidence that disposition 2
below (read phase from the lane set) is the one that generalises. **Three
independent witnesses now: the worktree list, the branch-side stamp, and
the card on main — and the card on main is the one that is wrong.**

**A FENCE OF `[docs/tasks/]` IS UNSHIPPABLE, AND THE T-108 DISPATCH RULED
IT SO IN A SENTENCE EVERY INTEGRATOR SHOULD READ.** That directory is
where every dispatch stamps `building` and every integrator stamps
`done`, so a lane holding it collides with every other lane's opening and
closing move **including its own integrator's** — held strictly it
serialises the whole board behind one small card, held loosely it is being
ignored. **A fence the project's own protocol must violate to make
progress is not a fence.** It was narrowed to the three DONE cards T-108
actually writes, with the distinction that made the narrowing coherent:
**a card's own file is never part of its fence.** This checkpoint wrote
`docs/tasks/T-107-*.md` and six suggestion files without colliding with
anything, which is that narrowing working the day it was made.

**FIVE DETACHED NON-LANE ENTRIES EXIST RIGHT NOW AND ONLY ONE IS
PERMANENT.** Derive the membership; do not quote it.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **`c4cfe52` is an ANCESTOR
  of this merge** (`git merge-base --is-ancestor c4cfe52 b505fca` exits
  **0**) and main is now **56 commits ahead of it**, which is the accurate
  reason nothing merged here reaches that window — *not* a trigger that
  failed to fire. Nothing reaches it until @human runs
  `git -C ../nputer-app checkout --detach main`.
- **Detached `drill-*` and `*-verify` entries** — the scratch worktrees
  belonging to whichever passes are running. **FOUR were present at this
  checkpoint** (`drill-T-033-verify`, `drill-T-091-verify`,
  `drill-T-102-verify`, `nputer-T-033-verify`), so three verification
  passes are live. They come and go at other sessions' keystrokes; the
  class is stable, the list is not. **T-107's own verifier removed its
  drill when it finished** (T-052-verify's precedent) and left the LANE
  worktree for the integrator, which is the shape to copy.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Every lane entry is a
`../nputer-T-NNN` sibling, which is the spelling CONVENTIONS gives.
**EVERY FENCE IS FREE EXCEPT THE FIVE ABOVE**: `app-interview` was
released by this checkpoint. Free too: `app-board`, `app-dispatch`,
`crate-index`, `docs/CONVENTIONS.md`, `method/`, `.github/`.

## Just completed

**T-107 — the unsupported-version notice gets a next step, and the ruling
that says which notices get one.** F-03, milestone 4, size S,
`touches: [app-interview]`, **fence never widened**. Main-before
**`765924d`**, lane tip **`6a61c6b`**, merge **`b505fca`**, this
checkpoint after it. `builder: claude-opus-5`,
`built_by: claude-opus-5 @T-107`, `verifier: claude-opus-5`,
`verified_by: claude-opus-5 @T-107-verify — APPROVED`,
`review: same-model`.

**WHAT LANDED.** A `claude` too old to drive used to render one correct,
typed sentence and offer nothing to do about it — *"the agent CLI reports
X, which is older than this app can drive"* — because the two families of
"this went wrong" have different renderers and **only one of them could
ever carry an action**: a `TurnError` goes through `failureAction` to
`FailureBlock` and gets `hint`/`command`/`retry`/`fallback`, while
`StartOutcome`/`SendOutcome` go to `OutcomeNotice`, which had **no action
slot at all**. `unsupportedVersion` now has its own card in the notice —
the typed version in mono, the refusal in words, the project path, and the
hand-driven route — and `noticeRoutesToHandDriven` in
`interview-model.ts` owns which outcomes get that route, for all
**THIRTEEN** kinds across both unions, with a `default` that assigns to
`never` so a fourteenth arm is a **build error** until somebody rules on
it. **No second `hint`/`command` pair was added**: what the notice family
gained is a BOOLEAN over the affordance both renderers already shared, and
`FailureAction` is byte-untouched. An absorbed one-liner rode along —
`visibleDenials`' doc comment stopped describing a defect T-113 closed and
stopped routing to a file the seventh triage removed.

### **CRITERION 5 IS NOT MET ON THE TREE, AND IT SHIPS DISCLOSED RATHER THAN HIDDEN**

**THIS IS THE FACT THIS SECTION EXISTS TO CARRY, AND SUMMARISING IT AWAY
WOULD BE THE FAILURE.** The card required a body driving the
`unsupportedVersion` outcome. **There is none on main.** The verifier
proved by POSITIVE CONTROL that one is unbuildable inside this card's
fence, rather than accepting the lane's claim off a config:

| arm | what was run | result |
|---|---|---|
| **A** | a deliberately RED body colocated in `app/src/genesis/`, under the SHIPPED collector | **exit 0, 958/958 — INVISIBLE** |
| **B** | the identical body under a collector that CAN see the glob | **exit 1, 1 failed** |

**A↔B IS THE WHOLE FINDING: THE GREEN WAS INVISIBILITY, NOT VACUITY.**
C-13 declares ONE path glob, `app/src/genesis/**`, and it is source-only;
`app/test/**` and `app/vitest.config.ts` are both C-05 `app-shell`, held
by T-033 — a LIVE lane. `vitest.config.ts` reads
`include: ["test/**/*.test.{ts,tsx}"]`, so a colocated body is not
collected by `npm test` while still being compiled into the program bare
`tsc` gates on: **worse than no pin.** Routed as **`T-107-s4`**, filed
ready to paste.

**THE BEHAVIOUR IS VERIFIED EVEN THOUGH NOTHING ON THE TREE HOLDS IT**,
and that distinction is the whole of what a compensating control is. The
verifier pasted the routed body into `app/test/interview-chat-dom.test.tsx`
in its own drill and drove it itself: **46/46 in file, 959/959 suite,
build exit 0**, then **1 failed / 45 under two independent poisons** (the
ruling's `unsupportedVersion` arm flipped, and `{handDriven}` deleted from
the renderer). What IS pinned on main is the MECHANISM, by its SIBLING
arm — flipping `cliNotFound` reds **seven** existing bodies across two
files. What is NOT pinned is the new arm's own answer: **deleting this
card's entire behaviour from either side leaves the tree fully green.**
This is T-101's precedent applied — a fence deliberately NOT widened and a
disclosed defect that ships — and breaking a live lane's fence would have
been the worse offence.

### **CRITERION 3's PROHIBITION IS MET AND ITS OBLIGATION IS ROUTED — NOT SATISFIED**

The card demanded the minimum version be *"named FROM THE ADAPTER, not
transcribed"*. **That is unsatisfiable in ANY fence at this commit**, and
it was derived rather than argued: `pub struct AgentAdapter` derives
`Clone, Copy, Debug` and **no `Serialize`**, so `CLAUDE_V1.min_major`
cannot cross IPC on any `#[tauri::command]` return;
`unsupportedVersion` carries `found` and nothing else;
`GenesisStatusPayload` carries `cliVersion` and no floor. **The only way
to name it is to transcribe it, which is the one act the criterion itself
calls the defect.** So the shipped screen creates **ZERO** implementations
of that number and cannot disagree with the adapter — the failure mode is
not avoided but made structurally impossible — while the user information
is lost and routed as **`T-107-s1`**.

**THE LANE OVERCLAIMED HERE AND THE VERIFIER CORRECTED THE RECORD.** The
doc comment above `noticeRoutesToHandDriven` heads that paragraph *"THAT
IS CRITERION 3 SATISFIED RATHER THAN DODGED"*, where the honest word is
**the lane's own word for criterion 5 — ROUTED**. Two identical acts,
two different adjectives, in one file. Nothing downstream reads either
one, so it was recorded rather than rejected over; the source comment is
left as filed for whoever takes `T-107-s1`, and ARCHITECTURE and the card
both carry the corrected word. **Do not let the next summary re-import the
generous adjective.**

### **THE CARD CONTRADICTS ITSELF, AND THE CARD IS WHAT IS WRONG**

Two of its instructions are jointly unsatisfiable, and neither is the
builder's fault:

1. **Criterion 3 forbids hard-coding "2"** while the card's own suggested
   shape-2 wording hard-codes it — *"nputer needs claude 2 or newer"*.
   Both cannot hold. Criterion 3 won, because the transcription is the
   half with a named failure mode attached (T-057), so the shipped
   sentence names no number.
2. **The verification line asks for a poison drill "on the new body"**
   while the card's own fence makes a new body impossible. The executor
   could not have obeyed both; it did the reachable thing — wrote the
   body, ran it green, poisoned it twice in a throwaway worktree, filed it
   — and the verifier re-ran that drill from outside.

**A CARD THAT CANNOT BE SATISFIED IS A DEFECT IN THE CARD**, which is the
POISON DRILL bullet's own T-057 lesson (*a card can specify a defect into
existence and a faithful executor will build it*) arriving in acceptance
criteria instead of in a test.

### **THE @HUMAN LOOK IS OWED AND THIS PASS COULD NOT DISCHARGE IT**

The card says `@human: yes, one look`. **NOT DISCHARGED.** No screen
control was used and none should be — the question is not whether the
facts are right (they are typed, and every one is verified) but whether
the screen reads as **HELP** rather than as a **WALL**. Open the
`interview-cli-outdated` card in `app/src/genesis/InterviewChat.tsx`,
reached by starting an interview with a CLI whose `--version` reports a
major below `CLAUDE_V1.min_major`. **Four questions, the fourth new from
the verification pass:**

1. Does *"It cannot see how you installed it, though, so it will not print
   an update command that might be the wrong one for your machine — that
   one is yours"* read as **respect** or as an **excuse**?
2. Is **"Show me the prompt"** the right label for someone who came to fix
   their CLI rather than to abandon it? The testid was deliberately left
   unchanged because the affordance did not change — **the LABEL is still
   open.**
3. **Should the notice name the minimum version at all?** `T-107-s1` is
   what would make that possible; this build's position is that "update to
   the current release" is more useful than a number. This is the product
   half of the criterion-3 ruling and it is @human's to settle.
4. *"updating yours to its current release is the fix"* is an assertion
   the app cannot verify either. It is not a COMMAND, so it clears
   criterion 2 — but it is the same class of claim one notch softer. **Is
   that the right place to draw the line?**

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 765924d 6a61c6b -> tree e6ab4a4b…, exit 0 (read from $? FIRST)
    git diff --name-only 765924d <TREE>                        ->   8   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 765924d..b505fca  (THE MERGE'S DIFF)  ->   8   the only one that means anything
    git diff --name-only c4c15c8..6a61c6b  (branch-only, TWO)  ->   8
    git diff --name-only c4c15c8..765924d  (main's advance)    ->  10
    git diff --name-only 765924d..6a61c6b  (TWO dots, FORBIDDEN)   ->  18

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 10 PATHS — 2.25x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **10** under this lane, the
branch **8**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 10 + 8 = 18 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. Ratios so far: T-110 **7.0x**,
T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107
**2.25x**. The ratio is weather; **the left endpoint is the signal.**

**THE DISPATCH BRIEF FOR THIS MERGE CARRIED THREE WRONG RANGE FIGURES AND
THE MECHANISM IS WORTH MORE THAN THE CORRECTION.** It said the pre-merge
form is **7**, main's advance **4**, and the forbidden form **11**
(1.57x). At this ref they are **8**, **10** and **18**. Both errors have
one cause: those are the VERIFIER's figures, correct at `29c0f4f` and at
`765924d` *before its own `T-107-s5` was filed*, relayed into the brief
**without their ref**. The brief even disagreed with itself — its range
paragraph says seven while its DOCS-GATE paragraph says *"6 of 8 after it
filed `T-107-s5`"*. **A COUNT COPIED OUT OF AN EARLIER PASS IS A COUNT
ABOUT A DIFFERENT TREE**: this repository's own standing rule, happening
to the brief that quotes it. The brief was right to say *"if your own
numbers differ, say so"* — they did, and this is the saying so.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`e6ab4a4b99c6e109f7bcd355d3460b89ced6e90b` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`765924d` and `6a61c6b` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

## THREE standing gates — ALL THREE FIRE, DERIVED from the merge's own 8 paths

| gate | trigger | on these 8 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **2 — FIRES** | exit **1, STALE** → regen → **0, CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** | exit **0** |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES** | exit **1**, three suites owed, all green |

The 8 are two `app/src/genesis/` files and six under `docs/tasks/` — this
card and its five suggestions. **ALL THREE FIRING AT ONCE IS UNCOMMON AND
THE FIGURE IS DERIVED RATHER THAN GUESSED**: over the last eight
first-parent merges, all three fire on exactly three of them — this one,
T-124's `b1d51dc` and T-110's `1223543` — and the three merges in between
(T-086, T-111's lane, T-052) were docs-only, so this is the first
all-three since T-124. Re-derive it rather than quoting it: for each merge
`M`, match `git diff --name-only M^1..M` against each gate's own trigger.
**Note what the same derivation shows in passing** — GRAPH REGEN and BOOT
GATE fired on identical path counts at every merge in that window except
T-120's and T-079's, where a `.ts` file under `tools/` matched GRAPH and
not BOOT. The two triggers are NOT the same set and a session that derives
one from the other will be right until it is suddenly wrong.

- **GRAPH REGEN — a REAL stale, not the `--root` false red**, read off the
  SECOND line as this project's own trap requires: it printed both counts
  and a `~` file diff rather than `committed: MISSING`. Committed
  **920 597 bytes · 178 files · 1959 symbols · 1878 edges** → fresh
  **921 608 · 178 · 1960 · 1881**: **+1 symbol**
  (`noticeRoutesToHandDriven`), edges **+5 −2**, files **+0 −0 ~2**.
  Regenerated and committed **with this checkpoint, not the merge**;
  `index --check` is **exit 0, CURRENT** afterwards. Every figure the
  verifier reported reproduces exactly.
- **NO FIXTURE RECONCILIATION WAS OWED, DERIVED RATHER THAN ASSUMED.**
  The regen moves symbols and edges but **not FILES** (178, `+0 −0 ~2`)
  and declares no component, so CONVENTIONS' *"a MERGE REGEN alone moves
  only the two app fixtures"* had nothing to move. Checked by running
  them after the regen: app **958/958**, parser **264/264**, both exit 0.
- **BOOT GATE — exit 0**, `NPUTER_BOOT_PORT=15281 npm run boot:check` from
  tools/e2e, both `[nputer]` lines observed: `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`.
  Captured process group **72312**, stopped by SIGTERM, no orphan.
- **DOCS GATE — exit 1**, invoked DIRECTLY from the repo root with the
  merged paths as ROOT-RELATIVE `$(…)` arguments, **never through
  `xargs`**, fed the RANGE RULE's own path list. **6 of 8 under `docs/`,
  THREE suites owed** — `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — all three run and green. **`cargo
  test from app/src-tauri/` is NOT owed and that is DERIVED**, not
  skipped: this diff carries no `docs/CONVENTIONS.md`, no
  `docs/architecture/components` and no `docs/research/` capture, which
  are the three things its readers resolve. It was run anyway and is
  green. The gate reports **12 derived readers across 4 suites**, a census
  of **130** docs-shaped sites in 22 files, and **0 frontmatter issues** —
  which is this card's `done` stamp and the five new suggestion files
  checked rather than assumed.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command captured on the very next token — **and the COUNT
was read as well as the exit**, because an exit alone cannot tell a green
suite from a suite that did not run.

- **cargo: 455 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines and DERIVED rather than read off the
  exit, lib suite **3.99s**. **GREEN FIRST TIME — no re-run, nothing
  discarded.** Unchanged from T-086's 455; this merge adds no test body
  and no test target, which is the honest reading of an unchanged count
  and not a green to be proud of.
- **parser: 264/264 across 12 files, exit 0.**
- **app: `npm run build` exit 0** · **`npm test` 958/958 across 46 files,
  exit 0** — identical to main's reference, which is jointly with the
  criterion-5 gap the measurement that says **no new body was added**.
- **E2E: 146/146, exit 0**, on scratch port **15280**, **ONE run** — there
  was no second run to declare.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0** run the
  way CI runs it, and **`npm run lint:tokens` exit 0** at **TOKEN 132 /
  CONTROL 694**. **CONTROL is 694 here against 689 at T-086's checkpoint
  and 685 in T-107's lane** — the corpus is `git ls-files`, so it grows
  with every tracked file main gains, and this merge's six new markdown
  files account for the move. **Derive it at your own ref; it is not a
  constant.**
- **EVERY SUITE RAN AT THE MERGE, AND THE THREE THE CHECKPOINT ITSELF
  OWES RAN AGAIN AFTER ITS DOC WRITES** (T-081-s9) — asked of the gate
  rather than predicted: `docs-gate.mjs` on the checkpoint's own five
  paths is **exit 1, FIRES on 5**, owing `npm test from app/`,
  `npm test from tools/e2e/` and `npx vitest run from lib/parser/`. All
  three re-run green — **958/958, 146/146** (scratch port **15282**, one
  run) and **264/264** — with **0 frontmatter issues**, which is this
  card's `done` stamp checked rather than assumed.

**THE "RE-RUN AFTER THE DOC WRITES" RULE BITES ON THE FILE SET, NOT ON THE
PROSE, and this merge is on the biting side of it.** **NO SUITE IN THIS
REPOSITORY READS `docs/STATE.md`'s CONTENT** — the two `docs`-wide readers
(`shell-frame.spec.ts`, `window-contract.spec.ts`) `walk()` the tree and
consume the FILE LIST, and every by-name occurrence of `docs/STATE.md` in
`app/test/**` and `tools/e2e/**` is a synthetic genesis FIXTURE path. So a
content-only edit to STATE cannot move any suite's answer — but this merge
ADDS FIVE FILES under `docs/`, which can, which is why the docs gate was
run on the merged set rather than on the branch's.

## NO SECOND REGEN WAS OWED

**Derived, not assumed.** `index --check` is **exit 0, CURRENT** after the
single regen, because the two files the checkpoint edits that ARE indexed
— the dogfood fixtures — did not have to move at all (no component
declared, no file count change). T-123's two-regen case does not
reproduce here and the reason is stated rather than guessed.

**PRESERVED BECAUSE IT IS THE MORE USEFUL HALF: NOT ONE FIXTURE IN THIS
REPOSITORY PINS A SYMBOL OR EDGE COUNT** — grepped for, not remembered.
The live-registry dogfood fixtures move when a component gains or loses
indexed FILES, and nothing else. **A regen that moves symbols without
moving files cannot red any fixture here**, and a reader who assumes "the
dogfood would have caught it" about a symbol-level regression is wrong.
This merge is exactly that shape: +1 symbol, +5/−2 edges, 178 files
unmoved, every fixture green without being touched.

**THE SIZE AGAINST THE CEILING IS THE HIGHEST IT HAS EVER BEEN: 921 608 of
`max_graph_bytes` 1 000 000 = 92.16%, with 78 392 bytes of headroom** —
up from 92.06% and 79 403 bytes one checkpoint ago. **NOTHING REPORTS IT**
— no gate, no test, no line of output. A lane cut now owes its regen
forecast against **1960 symbols / 1881 edges at 921 608 bytes / 178
files**.

## The board, derived from disk at this checkpoint

**227 flat task files — 86 done / 36 planned / 41 parked / 61 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
86 + 36 + 41 + 61 + 0 + 3 = 227. T-107's stamp moves done from 85 to 86
and building from 4 to 3; its five suggestion files took `suggested` from
56 to 61 and the flat total from 222 to 227.

**THE `building` COUNT OF THREE IS THE BOARD'S NUMBER AND NOT THE LANE
LIST'S** — five lanes hold fences right now, and two of them
(T-108, T-116) read `planned` on main. Read the lane section above.

**THE SUGGESTION BACKLOG IS SIXTY-ONE AND THE LAST TRIAGE WAS THE NINTH.**
This merge added **FIVE**, the largest contribution in six merges, and the
backlog is now outrunning the triage badly. **`T-107-s5` should be read
beside `T-123-s9`** — it is a 1 MiB read cap with no display cap behind
it, and the two are about the same joint. **THEY ARE NOT TRIAGED HERE:**
disposition belongs to a triage pass, not to an integrator (T-083's
ruling — discharging a finding is not the integrator's call to record as
done), so all five stay `status: suggested` exactly as filed.

## Documents ticked

- **ROADMAP — ticked.** T-107 gets a paragraph in milestone 3's progress
  section, immediately after T-101's, because it closes the last dead end
  in the family those paragraphs are about — the expired login and the
  missing CLI. It records the refusal to guess an update command as the
  product content, the enumeration from the union type, the two siblings
  filed rather than built, and that criterion 5 ships unmet and routed.
- **ARCHITECTURE — updated at C-13's entry, and NOT at the components
  table.** The table's rows stop at C-07 and C-05 already reads
  `building`; no row's status moved, which was checked rather than
  assumed. The C-13 paragraph records the two-renderer split, why the fix
  is a BOOLEAN and not a second `hint`/`command` pair, the `never`-guarded
  ruling, the refusal recorded at the renderer, criterion 3's prohibition
  met with its obligation ROUTED, the unbuildable pin with its A↔B
  control, and the graph movement — **+1 symbol / +5 −2 edges, every
  endpoint inside C-13 and C-05, so no component relation moves and the
  registry still stops at C-14.**
- **NO NEW ADR, and that is derived rather than skipped.** The one
  non-obvious decision — refuse to print an install command the app
  cannot verify, and offer the hand-driven route instead — is a
  COMPONENT-level product ruling, and it is already recorded in three
  places a reader will actually meet: inside the JSX of the notice, beside
  `noticeRoutesToHandDriven`, and in ARCHITECTURE. That is the precedent
  T-101's suppression-keying ruling took. Nothing here supersedes or
  amends ADR-001–017.
- **CONVENTIONS — NOT TOUCHED**, by the merge or by this checkpoint. No
  sentence in it is falsified by T-107; the DOCS GATE's proportionality
  examples were re-derived by asking the gate at this ref and a flat
  `docs/tasks/T-*.md` still owes THREE.
- **The card** is stamped `done`, with `verifier: claude-opus-5`,
  `built_by: claude-opus-5 @T-107 — code commit 458237a`,
  `verified_by: claude-opus-5 @T-107-verify — APPROVED, 2026-08-25 —
  verdict commit 78ee1c3`, and `review: same-model` — written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It also carries an
  `## Integration` section. The lane's implementation notes and the
  verifier's verdict are preserved byte-untouched.
- **`T-107-s1`…`T-107-s5` stay as filed** (`status: suggested`).

## Provenance — SELF-DECLARED, never read off a trailer

T-107 is **built by `claude-opus-5` and verified by `claude-opus-5`**, and
integrated by a third hand that did neither. **`review: same-model` IS NOT
A WEAKER VERDICT HERE, and T-104's ruling SEVEN is why**: the independence
that pays is INFORMATIONAL, not model diversity — the model string is
provenance and the BLINDNESS is the guarantee. This pass earned that
literally: **the spec was read at the base ref `c4c15c8` and every attack
was designed and executed before the lane's notes were opened** — all
three poison mutants, the exhaustiveness probe (an arm added to each union
until `tsc` errored), the fence positive control and the security sweep.
The notes were opened afterwards only to check the EVIDENCE half, and
every figure was re-derived rather than quoted. **The `Co-Authored-By`
trailer on this lane's commits is a harness constant and is NOT evidence
of a model** — T-085 proved it and T-101 sharpened the proof with a
counterexample inside one session.

**86 done cards — 63 `same-model`, 17 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 63 + 17 + 5 + 1 = 86. T-107 moves `same-model` from 62 to
63, and it is the **first card to invoke @human's 2026-08-25 rule that a
size-S card touching SHIPPED CODE gets a verifier** — the rule earned its
keep on its first use, since the pass is what turned an unpinned criterion
from a report into a measurement.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, read at **15:19:08**
BEFORE the merge and again after it; the app binary is pid **89201**,
started **2026-08-25 10:54:33**, unchanged throughout, read with the
**anchored** match `ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**A pid, a port holder and a start time are live-environment facts, so
these are stated with the time they were read and are already stale for
you.**

**RULE 1's TRIGGER NEVER FIRED, WHICH IS BETTER THAN A REFUSAL AND IS
STATED AS THE DERIVATION IT IS**: all three `node_modules` trees, both
`dist/` directories and `target/` were already present in this checkout,
so no fresh dependency install was owed at any point. **No `npm ci` was
run.** Had one been owed, the CHECKOUT test is the one that decides —
`lsof -p 88948` puts the holder at `/Users/ujju/Projects/nputer-app/app`,
a different checkout — which is `integrator.md` rule 1 applied rather than
CONVENTIONS' DETECT AND REFUSE paragraph quoted; those two are still
different facts and the repair is still item 2 below, unwritten after
THREE consecutive merges performed it by hand.

**NOTHING FROM THIS MERGE REACHED THE APP'S CODE, AND THE REASON IS
STRUCTURAL RATHER THAN A TRIGGER THAT DID NOT FIRE.** The window serves
from `/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`, an
**ancestor** of this merge — re-verified at exit **0**, main now **56
commits ahead**. **This matters more at this merge than at the last five**,
because this diff really does touch `app/src/**`: on the ordinary setup
that is vite HMR into a live window, and the only reason it is not is the
second checkout. A session that answers "did my change reach the app?" by
checking `app/src/**` triggers would get the WRONG answer here.

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout but OPENS `/Users/ujju/Projects/nputer` as its
project, so this merge's board changes — a card moving to `done`, five new
suggestion files — land in the watched folder live. Code and watched
folder are independent, which is the property @human's ruling preserves.

**No process from this integration survives.** Scratch ports **15280**
(e2e at the merge), **15281** (boot gate) and **15282** (the e2e re-run
after the doc writes) were each `lsof`-read FIRST (zero rows),
then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in that
order and never the reverse, with a probe this session **wrote itself**
rather than trusting one by name out of the shared scratch directory —
T-107's lane recorded finding its own helper there REPLACED mid-session by
a script it did not write, so the class is real. Both were free again
afterwards. **No `pkill`. No `npm ci`. No `cargo clean`** — and be precise
rather than claiming more than is true: this integration's `cargo test`,
the graph gate, the regen and the boot check all WROTE to main's
`app/src-tauri/target/`, which grew 2.7 GB → **2.9 GB**, as any cargo run
must. What was not done is a reclaim or a clean, and nothing contended for
it — @human's app builds in its own checkout, so cargo's exclusive lock
was uncontended. No sibling worktree was entered. **The untracked
zero-byte file `z`** still sits in the main checkout — not this
integrator's, not this merge's, not staged, **left alone for the fifteenth
checkpoint running**. No path was staged by wildcard; `git add -A` was
never used, and it would have staged three gitlinks.

## In progress / broken right now

**NOTHING IS BROKEN.** Five lanes are live — **T-033**, **T-091**,
**T-102**, **T-108** and **T-116** — with three verification passes
running (T-033, T-091, T-102 each have a `drill-*-verify` worktree).
**`app-interview` was released by this checkpoint** and **nothing is
approved and awaiting an integrator** — the batch is empty. `git branch`
still lists every lane this repo has ever run, which is the intended
asymmetry: the BRANCH is kept and only the WORKTREE is removed.

**T-033 IS THE ONE TO WATCH: ITS LANDING UNBLOCKS THREE CARDS.** T-125,
T-126 and T-111 are all `status: planned` and all wait on it — T-033 holds
`docs/architecture/components/`, `lib-parser`, `app-map` and `app-shell`
between them, which is every fence those three need. It is also the lane
holding the fence `T-107-s4` needs (`app/test/**` is C-05 `app-shell`), so
T-107's missing pin cannot be written until T-033 lands either.

## Next up

1. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST AMONG THE UNBUILT**,
   and it is one token of code. SEVENTH checkpoint running at the top of
   this list. Fence `[tools/e2e]`, **held by T-091** — so it waits, or it
   rides T-091's lane if that card's builder wants it. THREE passes have
   now caught it with the fractional millisecond.
2. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN.** The body exists,
   ready to paste, measured green then red twice by two independent
   passes. It needs `app/test/**`, which is C-05 `app-shell`, **held by
   T-033**. Until it lands, deleting T-107's whole behaviour leaves the
   tree green. Read it beside **`T-110-s9`**, which is the neighbouring
   collision it names.
3. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP, AND THIS IS THE
   THIRD CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT
   WRITING IT DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the
   PORT; `integrator.md` rule 1 governs the CHECKOUT; since @human's app
   moved to its own checkout those are two different facts and the literal
   procedure refuses forever in main. **The repair is one step —
   `lsof -p <pid>` for the holder's cwd, compared against the checkout you
   are installing into.** Fence `[docs/CONVENTIONS.md]`, **free**.
   Cheapest fix on this list.
4. **`T-086-s1` — THE HOSTILE-SESSION-ID BODY IS LIVE AT ~1-IN-19 ON A
   CLEAN CACHE** and wants the `T-088-s4` treatment aimed at the right
   variable now that the target dir is excluded. Read it with the
   retraction on `T-088-s4`, whose standing rule is the transferable part:
   **a re-measurement can only settle a finding whose MECHANISM the
   intervention addresses.** Fence `[app-agent]`, **held by T-102**.
5. **`T-107-s1` — THE ADAPTER'S FLOOR REACHES THE FRONTEND THROUGH
   NOTHING**, and it is the plumbing half of the criterion-3 ruling above.
   `AgentAdapter` derives no `Serialize`, so this is a real IPC question
   and not a one-liner. **It is also @human question 3**, so read the two
   together: if @human rules the notice should NOT name the floor, this
   finding closes without being built.
6. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND.** Two planner
   instructions, quoted ready to paste, for **T-104**'s owed v0.1.6 method
   bump. T-052 routed a second item to the same seat: whether a new
   normative sentence in a role file is a bump when CONVENTIONS' own
   trigger is a FORMAT change. The debt is per-VERSION, not per-change, so
   one three-file commit discharges T-089's, T-124's and T-052's residual
   together. T-104 is `status: planned` with the three-way fence the bump
   needs, and it also carries the standing ruling on S-card verification —
   **whose first invocation was T-107 and which paid off immediately.**
7. **THE BOARD-TRUTH RULING** — SEVENTH ask, and this checkpoint is the
   first to observe the window at **`building`** as well as at
   `verifying`: T-108 and T-116 read `planned` on main while both lanes
   are cut and stamped `building` on their own branches. Three
   dispositions, none free: stamp on the integration branch at handoff;
   drop the field and read phase from the lane set; or keep it and
   document it as lane-local. **The second now has evidence from two
   different fields, which is the argument that it generalises.** It wants
   a ruling, not an eighth observation.
8. **`T-110-s1` — THE LANE READER IS BUILT AND NOT WIRED.** `lib.rs`
   declares no `pub mod dispatch;`, so the shipped binary does not carry
   the module and `cargo build` is not a gate on it. **The commit that
   takes it DELETES the test shim**, which also drains the D2 bucket.
   Fence `app-shell`, **held by T-033**. T-126 was promoted at the ninth
   triage for this.
9. **THE GRAPH IS AT 92.16% OF ITS CEILING** with 78 392 bytes of
   headroom — it went UP at this merge — and **nothing reports that
   number**.
10. **THE SUGGESTION BACKLOG IS SIXTY-ONE AND WANTS A TENTH TRIAGE.** This
    merge alone added five. **`T-107-s5` and `T-123-s9` should be read
    together** — one read cap, no display cap, same joint.
11. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint**. That is a fence-arithmetic defect the dispatcher relies
    on, and **T-107-s4 is its fifth instance from a third direction** —
    `[app-interview]` cannot hold a pin either. Read `T-111-s1` and
    `T-111-s2` before cutting the next overlapping pair.
12. **`T-052-s1` — THE FRESH-INSTALL REFUSAL COULD BE A GATE** rather than
    a ritual each session performs from prose. Read it together with item
    3, which is the defect the prose form keeps exhibiting.
13. **`T-120-s1`** — the pre-write exclusivity check still cannot
    discriminate; this integration used the replacement it derives
    (`git diff --cached --name-only` plus `git diff --name-only`, both
    empty), which is what made this turn provably exclusive rather than
    judged. `??` lines alone are not a ceremony, and there was exactly one
    (`z`).
14. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged). T-086 answered the
    neighbouring question and deliberately did not answer this one: the
    reader sentence took the stop-enumerating option, and the walk table's
    TOKEN row still enumerates `P1–P4` plus `P6` with nothing deriving it.
15. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
