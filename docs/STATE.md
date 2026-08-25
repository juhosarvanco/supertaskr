# State

Updated: 2026-08-25 by the T-052 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: ONE LANE IS LIVE
(T-033, building), NOTHING IS APPROVED AND WAITING, THE HUMAN'S WINDOW IS
PINNED TO A CHECKOUT MAIN CANNOT REACH, AND `cargo test` REDS ABOUT HALF
THE TIME IN THIS CHECKOUT FOR A REASON THAT IS NOT A BUG IN ANY TEST.**
Nothing on main is broken. **But FOUR known intermittents will meet you
before any real defect does — one of them filed for the first time at this
checkpoint — so read the next four sections before you debug anything.**

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the FIFTH checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded
float it captured. **And the failure repairs the condition that caused
it**: the `utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**IT DID NOT FIRE AT THIS MERGE EITHER — E2E was 146/146 first time.**
Main is not a fresh checkout, so this is the prediction holding rather
than the defect being gone. It fires in exactly the places this project
creates most often: a fresh lane worktree and a fresh poison-drill
worktree. **DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN.** The fix is one
token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend.

**T-052's lane added the one thing that unblocks the fix**: it reproduced
the red ON DEMAND in an already-healed worktree by setting the fixture's
mtime to a fractional millisecond (three greens, then a named red), which
removes `T-120-s3`'s own "needs a fresh checkout to prove" prerequisite.
Whoever takes the fix can now verify it anywhere.

## `T-088-s4` IS NOT A FLAKE. IT IS AN 8.7 GB `target/` DIRECTORY, AND THAT IS MEASURED

**PRESERVED FROM T-110's CHECKPOINT, WHICH DID THE EXPERIMENTS, WITH EACH
LATER INTEGRATION'S TALLY ADDED AT THE END.** The account below is the
most useful thing in this file for a session that runs `cargo test` in
main.

**`docs_watch::tests::startup_arm_watches_the_initial_root` has been
carried as a flake with a "3 red in 12" tally since T-088. It is not one.
It reds most of the time in THIS checkout and ~0% everywhere else, and
the single variable is the size of the cargo target directory.**

**STEP 1 — is it the merge?** `cargo test --lib` alone never builds or
runs T-110's new `dispatch_lanes` binary, and it reds by itself. `lib.rs`
declares `agent`, `docs_watch`, `churn`, `index_cmd`, `acl_pin` and
**not** `dispatch`. Suggestive, not decisive.

**STEP 2 — same TREE, two checkouts** (interleaved, so load is
controlled; the throwaway has its own small target dir):

| checkout of `1223543` | red | test time |
|---|---|---|
| clean worktree, own target dir | **0 / 5** | 3.85–3.93s |
| main's own checkout | **4 / 5** | 8.85–15.14s |

**STEP 3 — same CHECKOUT, two target dirs.** This is the one that
names the cause. Identical source, identical checkout, identical load —
only `CARGO_TARGET_DIR` differs:

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds.

**WHY THE HISTORICAL TALLY WAS ERRATIC, EXPLAINED RATHER THAN
APOLOGISED FOR.** A lane worktree and a poison drill both start with a
small target dir and see green; main's checkout has been accumulating
since the project began and sees red. The tally moved with WHERE each
session happened to run, which is why it looked like a coin flip. **A
tally that mixes checkouts is not a flake rate.**

### THE CLOCK TEST NOW SEPARATES GREEN FROM RED ACROSS TWO INTEGRATIONS RUNNING

T-124's checkpoint found that the lib suite's own `test result:` time
sorts its five runs perfectly — every green under 9.5s, every red over
14.6s, **a gap of more than five seconds with nothing in it**. That was
derived from ordinary suite output rather than from an experiment, which
is what makes it cheap to repeat. **THIS INTEGRATION REPEATED IT AND THE
BANDS HELD:**

| integration | run | lib `test result:` | lib time |
|---|---|---|---|
| T-124 | 1 | ok. **160** passed | **9.48s** |
| T-124 | 2 | FAILED. 159 passed; **1 failed** | 14.73s |
| T-124 | 3 | FAILED. 159 passed; **1 failed** | 14.87s |
| T-124 | 4 | FAILED. 159 passed; **1 failed** | 14.65s |
| T-124 | 5 | ok. **160** passed | **8.94s** |
| **T-052** | **1** | FAILED. 159 passed; **1 failed** | **16.85s** |
| **T-052** | **2** | ok. **160** passed | **8.79s** |
| **T-052** | **3** | ok. **160** passed | **9.09s** |

**Eight runs across two integrations, and not one lands between 9.5s and
14.6s.** This checkpoint's red is the slowest yet recorded (16.85s) and
its greens sit exactly in the green band. **The deadline is what is being
crossed; the merge is not what crosses it** — this merge contains zero
Rust paths, so it could not have moved a Rust test at all.

**THIS INTEGRATION'S TALLY: 1 RED IN 3.** Declared rather than smoothed:
the FIRST full run was the red one, and nothing was discarded on the way
to a number.

**DO NOT `cargo clean` MAIN'S TARGET DIRECTORY TO "FIX" THIS RIGHT NOW**
without checking `lsof` first: a lane is building against this
repository, and reclaiming 8.7 GB is a system-state change no architect
has ruled on. **The one reason that USED to head this warning is now
gone** — `target/debug/nputer` in THIS checkout is no longer the running
binary, because @human's app moved to its own checkout (see below). The
remaining reasons stand. This wants a card, not a reflex — see "Next up".

## A THIRD INTERMITTENT, FILED HERE FOR THE FIRST TIME — `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`

**IT IS NEW TO THE RECORD, IT IS NOT ON ANY BRIEF'S LIST, AND THE NEXT
SESSION TO MEET IT WILL OTHERWISE ATTRIBUTE IT TO ITS OWN MERGE.** That is
the whole reason it is written down at this length.

`app/src-tauri/tests/agent_runner.rs:2926` — introduced by **T-039**, last
touched by **T-124** at `82eb2ed`. It failed in the FIRST full `cargo
test` of this integration:

    assertion failed: matches!(agent::send_turn(&h.watch, &h.agent, "answer".into()),
        SendOutcome::NoSession)

**IT IS NOT THIS MERGE'S, AND THAT IS DERIVED RATHER THAN ASSERTED**: the
merge's diff is **9 paths, zero of them `.rs`**, and `agent_runner.rs` is
not among them (`git diff --name-only aff1c36..eea466a | grep -c
agent_runner` is **0**). A markdown-only merge cannot move a Rust
assertion.

**IT IS LOAD-SENSITIVE, NOT DETERMINISTIC — MEASURED BOTH WAYS.** Run
alone it is **5 green in 5** (0.26–0.41s each). Under the full parallel
suite it is **1 red in 3**. And it redded in the SAME run as the watcher
body above and in neither of the two runs where the watcher body was
green, which points at the same underlying condition — this checkout is
slow under load and two bodies in it have deadlines. **That is a
hypothesis with two data points, not a diagnosis**, and it wants the same
controlled experiment T-110 ran for `T-088-s4` rather than another
sighting.

**No suggestion file was filed for it**, on T-110's and T-124's shared
precedent: filing one here would move the board counts this checkpoint
derives. It belongs to the architect, and this section is the handoff.

## A FOURTH INTERMITTENT — `T-124-s3` — AND IT DID NOT FIRE HERE, 3 FOR 3

**`a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`
in `app/src-tauri/tests/agent_runner.rs` (T-113's, added at `55f9b1b`)
failed its POSITIVE CONTROL with an empty `stderr_tail` in 1 of 4 runs
during T-124's verification.** It was proved not to be T-124's, and
T-124's own integration then saw it zero times in five.

**It read `ok` in all THREE full runs here, including the run that was red
on two other bodies.** An intermittent that does not fire has told you
nothing except how often it does not fire. Its own filing saw it once in
four; T-124's checkpoint saw it zero in five; this one zero in three. The
pooled count is **1 in 12**.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not
a lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN
AND THIS IS THE EIGHTH MEASUREMENT SAYING SO.** A live lane's tip is a
live-environment fact, not a function of a tree; what is stable is WHICH
lane holds WHICH fence. For a tip, run `git worktree list`. **No scratch
worktree is named here either** — the CLASS is recorded, the membership
is the command.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |

**ONE LANE. NOTHING IS APPROVED AND WAITING** — T-052 was the last
approved card in its batch and this checkpoint closes it.

**EXACTLY ONE WORKTREE THAT IS NOT A LANE — RE-READ AFTER THE REMOVAL,
WHICH IS THE POINT.** The ritual's order is merge, checkpoint, remove, so
a checkpoint written before the removal describes a tree that no longer
exists by the time anyone reads it. **Two consecutive checkpoints recorded
their own worktree count going stale in exactly that gap; this one
re-derived `git worktree list` AFTER removing its lane and corrected this
section rather than becoming the third.** Three entries remain: this
checkout, T-033's lane, and:

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25, which this merge is the card for. It
  holds no fence, is named after no card, and must not be removed after a
  merge. See the running-app section below.
**And one CLASS with no members at this moment** — detached
`drill-T-NNN-*` entries, the scratch worktrees belonging to whichever
passes are running. DO NOT QUOTE A LIST FROM HERE; the class is what is
stable, the membership is the command. **This integration created none**
— the card was already verified and needed no drill of its own, and the
verifier removed its own `drill-T-052-verify` when it finished.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH ANY MORE.**
`tools/nputer-T-052` was the last of the three the dispatcher cut INSIDE
the repository on 2026-08-25, and this checkpoint removed it. **The count
went three, two, one, zero across four consecutive checkpoints, and every
one of those four dispatch briefs stated the count that was true when it
was written and false by the time the checkpoint landed** (T-110 said
three, T-124 said two, this one said one plus `z`). **Three checkpoints
running have now recorded the same staleness. Derive it from `git worktree
list` at your own moment; a worktree count is a live-environment fact.**

**EVERY FENCE IS FREE EXCEPT T-033's.** `method/` and
`docs/CONVENTIONS.md` were released by this checkpoint. Free too:
`app-agent`, `app-dispatch`, `app-board`, `app-interview`, `crate-index`,
`tools/e2e`, `.github/`.

## Just completed

**T-052 — the checkout you merge into may be in use, and the card's own
fatal rung is refuted by measurement.** F-02, milestone 4, size M,
`touches: [method/, docs/CONVENTIONS.md]`, **fence never widened**.
Main-before **`aff1c36`**, lane tip **`7434f93`**, merge **`eea466a`**,
this checkpoint after it. `built_by: claude-opus-5 @T-052`; one
verification pass, `review: same-model`.

**THE HEADLINE IS A DOWNGRADE, AND IT IS THE BEST THING IN THE CARD.**
The card catalogued nine instances of the pipeline disturbing or killing
@human's running app, escalating from cosmetic to fatal. **The lane
REFUTED ITS OWN RUNG 8** — the "fatal, mechanism B" entry, on the board
since 2026-08-16, which blamed a fresh `npm ci` for removing
`node_modules` under the running vite and killing the app. **It does not
kill it.** With the guard removed, the floor
(`app/node_modules/vite/package.json`) was absent for **eleven
consecutive samples** while the server answered **200 throughout, same
pid, same start time**.

**AND THE VERIFIER REPRODUCED IT HARDER RATHER THAN TAKING IT ON
REPORT** — which is what makes the refutation stick. It held the deletion
window open **4094 ms** with an atomic rename, and while `node_modules`
did not exist at all the server served **44 of 44 cold source modules
never fetched before** (1.5 MB), **8 of 8 optimized-dep URLs discovered
DURING the window**, the index, `/@vite/client` and an HMR-shaped `?t=`
re-request — with a **404 negative control** on a dep URL missing its
`?v=` proving the server was DISCRIMINATING rather than blindly
answering. A vite serves what it has already transformed, and measurably
what it has NOT yet transformed, out of memory.

**SO THE RULE SURVIVES ON THE WINDOW OF EXPOSURE, NOT ON A KILL, AND THE
GUARD IS STILL RIGHT.** A nine-day-old "fatal" entry was downgraded by
measurement while the rule it justified stayed in force, on better
footing than it had before. Three hedges carry the honesty and all three
are in the shipped text: instance 8's cause stays **UNDETERMINED**
between this and "the human quit"; what IS destroyed is
`node_modules/.vite`, vite's optimize cache, **deleted and not
recreated**, so a surviving process serves from memory over a tree that
no longer matches it; and `tauri dev` is MORE than vite — the tauri CLI
lives in `node_modules` and a cargo rebuild runs beside it — so the real
exposure is wider than what anyone measured. **Neither the lane nor the
verifier tested `tauri dev`, because it opens a window, and both say so.**

**WHAT LANDED.** `method/roles/integrator.md` gains a section, "The
checkout you merge into may be in use", with four numbered rules, reached
from step 2 and step 3. **The existing steps 1–4 are NOT renumbered** —
T-089's table cites them by number — and that was verified from both
blobs rather than from the claim. Every nputer mechanism is in
`docs/CONVENTIONS.md` instead: the app's two trigger sets and BOOT GATE's
third, the anchored-`awk` pitfall, the `npm ci` correction, the
`lib/parser/dist` symlink channel, the scratch-file rule, and @human's
ruling with its quoted criteria. **The method text is product-agnostic,
measured**: a grep of the added `method/` lines for `nputer|tauri|vite|
npm|cargo|1420|node_modules|Users/ujju|rust|react` returns **zero rows**.

**NO METHOD VERSION BUMP WAS TAKEN, AND THAT IS THE RULING RATHER THAN AN
OMISSION.** CONVENTIONS' trigger is a **FORMAT** change; this diff adds no
table, field, status, template or vocabulary term. **Neither edited file
ships in `KIT_FILES`**, and the directory walk that forces new files into
that table covers `docs-templates`, `adapters` and `tasks` — not `roles/`
and not the top-level `lane-protocol.md`. The verifier checked the one
thing that could have cut the other way: CONVENTIONS says in terms that
*"T-089's OWN CHANGE TO method/ IS THEREFORE OWED A BUMP TO v0.1.6"* and
T-089 edited **the same file** — but T-089's merge also carried
`method/tasks/TASK-FORMAT.md`, which IS in `KIT_FILES` and IS a format
file, so its debt is fully explained by that path and implies nothing
here. **The residual was ROUTED, not decided**: by T-104's own criterion
(clarification versus new normative sentence) this rule IS new, the two
tests disagree, and a lane may not settle a method ruling. T-104 owns the
owed v0.1.6 payment and is the seat that can answer it. **ARCHITECTURE's
C-01 row still reads `built (v0.1.5)` and is therefore still true.**

## THE FIRST-READER CHECK NOBODY ELSE COULD RUN — AND THE SECTION HAS ONE SOFT SPOT

**A PREVIOUS INTEGRATOR READ THIS SECTION OFF THE BRANCH AND HONOURED IT
BEFORE IT LANDED; THIS ONE IS THE FIRST TO MERGE IT, AND THEREFORE THE
FIRST WHOSE OWN CONDUCT IT GOVERNS AS TRACKED TEXT.** Implemented from
the text alone and run for real. **Three of the four rules were usable
exactly as written. Rule 1's nputer MECHANISM has a gap, and @human's own
adopted fix is what opened it.**

**RULE 2 WAS USABLE AND ANSWERED A REAL QUESTION.** *"A merge can change
what the running product serves without touching one file the product
owns"* — so the question is which build outputs the running app reads.
Answered from the build order, not the diff, and **without entering
@human's tree**: `app/node_modules/@nputer/parser` is a **relative**
symlink, `../../../lib/parser`, so it resolves inside whichever checkout
it lives in. Rebuilding THIS checkout's `lib/parser/dist` therefore
cannot reach an app serving from another one. **That derivation took one
`ls -l` and it is the rule working**, on a docs-only diff that would
otherwise have claimed exemption.

**RULES 3 AND 4 WERE USABLE.** Rule 3's demand to read process identity
before and after, to state when, and to anchor the process match is what
this checkpoint's running-app section below does. Rule 4 is why the `z`
file is recorded and left alone rather than deleted.

**RULE 1 IS WHERE IT READS BETTER THAN IT WORKS, AND THE GAP IS ONE
LINE.** The GENERIC sentence in `integrator.md` is right: *"A FRESH
DEPENDENCY INSTALL SHALL NOT RUN IN A CHECKOUT SERVING A LIVE PRODUCT."*
The operative condition is **the checkout**. But CONVENTIONS' DETECT AND
REFUSE paragraph compresses the procedure to *"read the holder with
`lsof -nP -iTCP:<port> -sTCP:LISTEN` … On a hit, name the step you are
skipping … On no hit, PROCEED"* — **which tests the PORT and never the
checkout.** Implemented literally and run at this merge:

| arm | port 1420 | a port nothing holds |
|---|---|---|
| **A — the literal text**: any holder means refuse | **REFUSE** | proceed |
| **B — rule 1's own sentence**: is the holder serving from THIS checkout? | **PROCEED** | proceed |

**THE TWO ARMS DISAGREE ON THE LIVE CASE, AND ARM A IS THE WRONG ONE.**
The holder of 1420 is pid **88948**, and `lsof -p 88948` puts its cwd at
`/Users/ujju/Projects/nputer-app/app` — **another checkout entirely**. An
install in main would not touch the dependency tree that process reads.
Arm A refuses anyway, and because @human's app is now permanently up on
1420, **arm A refuses forever in main**. That is precisely the failure
rule 1's own last sentence names: *"A check that CANNOT tell a live
product from an absent one is not a check."* It just arrives from the
other direction — a check that always refuses is as useless as one that
never does, and the verifier's positive control could not catch it
because its drill ran in a worktree where the holder and the checkout
were necessarily the same.

**THE IRONY IS LOAD-BEARING RATHER THAN DECORATIVE: @HUMAN'S ADOPTED FIX
IS WHAT BROKE THE DETECTOR.** Before the second checkout, port-holder and
checkout-in-use were the same fact. After it, they are two, and only one
of them is the one rule 1 governs. **The repair is one step, not a
redesign** — after reading the holder, read `lsof -p <pid>` for its cwd
and compare it against the checkout you are about to install into, which
is the same `lsof -p` this checkpoint already uses to identify the app.
**No suggestion file was filed** (it would move the board counts this
checkpoint derives, T-110's and T-124's precedent); this section is the
handoff and it is item 2 under "Next up".

**WHAT THAT MEANT IN PRACTICE HERE: NOTHING WAS OWED.** All three
`node_modules` trees were present in this checkout, so the full suite
opened with no fresh install and rule 1's trigger — *"IF that suite opens
with a fresh dependency install"* — never fired. **No `npm ci` was run at
any point in this integration.**

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree aff1c36 7434f93 -> tree 4748a8b6…, exit 0 (read from $? FIRST)
    git diff --name-only aff1c36 <TREE>                        ->   9   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only aff1c36..eea466a  (THE MERGE'S DIFF)  ->   9   the only one that means anything
    git diff --name-only c4cfe52..7434f93  (branch-only, TWO)  ->   9
    git diff --name-only aff1c36...7434f93 (THREE dots)        ->   9   AGREES — FOURTH MERGE RUNNING
    git diff --name-only aff1c36..7434f93  (TWO dots, FORBIDDEN)   ->  48
    git diff --name-only c4cfe52..eea466a  (merge-base, FORBIDDEN) ->  48
    git diff --name-only c4cfe52..aff1c36  (main's advance)        ->  39

**THE FORBIDDEN TWO-DOT FORMS OVERSTATE BY 39 PATHS — 5.3x — AND BOTH ARE
PURE LEFT-ENDPOINT DRIFT.** Main advanced **39** under this lane, the
branch **9**, `comm -12` over the sorted lists is **EMPTY**, and
39 + 9 = 48 — the arithmetic that proves the sets disjoint. Ratios so
far: T-110 **7.0x**, T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**. The
ratio is weather; **the left endpoint is the signal.**

**THE THREE-DOT FORM RETURNED THE RIGHT ANSWER FOR THE FOURTH MERGE
RUNNING, AND T-124's WARNING IS NOW MORE URGENT RATHER THAN LESS.**
`A...B` is DEFINITIONALLY `$(git merge-base A B)..B`, so
`aff1c36...7434f93` IS the branch-only range — **9, exactly right**,
because this branch is purely additive and main's advance is disjoint
from it. T-124's checkpoint said the quiet part: **a forbidden form that
keeps giving the right answer is more dangerous than one that gives a
wrong one**, because it agrees *only while the two path sets stay
disjoint* and teaches a false lesson every time it works. **This
integration adds a fourth agreement and deliberately does not treat it as
a habit.** The set identity was checked, not just the count — `diff` over
the two sorted lists is empty — and that is the check that would have
caught a disagreement had one existed. **The day a lane and main touch the
same file, this form silently drops main's side of that path with no
signal that anything happened.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`4748a8b679f94070c2222081025114ee1cd85fac` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`aff1c36` and `7434f93` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**THE TWO TOOLS WANT OPPOSITE THINGS, AND THIS INTEGRATION USED EACH
WHERE IT BELONGS.** `git merge-tree` reads **COMMITS** — it cannot see an
index, so staging a file before measuring buys nothing. The DOCS GATE
reads **TRACKED files** — so doc files must be `git add`ed before it can
see them (`T-010-s10`). At the merge all nine paths were already
committed by the merge itself, so the gate saw them without staging; this
checkpoint's own doc writes were `git add`ed by explicit path before
their gate run.

## THREE standing gates — DERIVED from the merge's own 9 paths

| gate | trigger | on these 9 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — NOT OWED** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **7 — FIRES**, four suites |

The nine are `docs/CONVENTIONS.md`, five `T-052-s*` suggestion files, the
card, `method/lane-protocol.md` and `method/roles/integrator.md`. **A grep
for `\.(ts|tsx|js|jsx|mjs|rs)$` over the whole nine returns 0** — this
merge is markdown only.

- **GRAPH REGEN — NOT OWED, AND ASKED ANYWAY** as its own bullet demands.
  `cargo run -p nputer-index -- index --check --root ../..` is **exit 0,
  CURRENT** at **920 597 bytes / 178 files / 1959 symbols / 1878 edges**,
  unmoved from T-124's regen. **This is the answer the gate gave, not a
  prediction it was spared** — and it is why no regen is committed here.
  Asking cost about a second; reasoning from the suffix list would have
  reached the same answer with none of the authority.
- **BOOT GATE — NOT OWED, 0 of 9.** No `app/src-tauri/**`, no
  `app/src/**`, neither manifest. `npm run boot:check` was NOT run, and
  that is derived rather than skipped.
- **DOCS GATE — exit 1**, invoked DIRECTLY from the repo root with the
  merged paths as ROOT-RELATIVE arguments, **never through `xargs`**.
  **7 of 9 under `docs/`, FOUR suites owed** — `cargo test from
  app/src-tauri/`, `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — all four run and green, at the
  merge and again after this checkpoint's doc writes. **THE DISPATCH
  BRIEF SAID "6 of 8" AND IT WAS RIGHT AT THE VERIFIER'S REF AND WRONG AT
  MINE**: the verdict commit `7434f93` added `T-052-s5`, so the diff is 9
  paths and 7 of them are docs. **Re-derive; never quote a gate count
  from a brief** — this is the second checkpoint running to record the
  identical off-by-the-verdict-commit staleness.
  **`cargo test` IS owed on this diff and that is the interesting one**:
  `app/src-tauri/src/agent/kit.rs` reads `docs/CONVENTIONS.md` off disk,
  so a markdown-only merge pulls the Rust suite in. The gate reports **12
  derived readers across 4 suites**, a census of **130** docs-shaped sites
  in 22 files, and **0 frontmatter issues** — every live card's
  frontmatter parses with a legal status, which is this card's `done`
  stamp checked rather than assumed.

## THE PARITY DERIVATION — THE THING MOST LIKELY TO BREAK QUIETLY, AND IT DID NOT MOVE

`tools/e2e/tests/workflow-parity.spec.ts` derives CI's expectations from
CONVENTIONS' "Build & test" section, and **a U+00B7 MIDDLE DOT inside a
parenthetical silently truncates the exposed command list.** This merge
adds **190 lines to that file**, so the derivation was re-implemented from
its documented rules (`buildAndTestSection`, `commandBullets`,
`structuralProblems`) and run over four texts:

| ref | file lines | "Build & test" lines | bullets | exposed commands | structural problems | U+00B7 section / file |
|---|---|---|---|---|---|---|
| `c4cfe52` (base) | 1219 | 260 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| `aff1c36` (main before) | 1219 | 260 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| `7434f93` (lane tip) | **1409** | 260 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| **the merge, from disk** | **1409** | **260** | **4/5/5/7** | **21** | **0** | **20 / 23** |

**190 LINES WERE ADDED AND THE SECTION DID NOT MOVE BY ONE LINE, ONE
COMMAND OR ONE MIDDLE DOT**, and the 21 commands are identical by NAME on
every row, not merely by count. **The added lines contain ZERO U+00B7**
(`git diff … | grep '^+' | grep -c '·'` is **0**), so the truncation trap
cannot fire from them; the new prose sits in `## Gotchas`, which the
derivation cannot reach because `buildAndTestSection` splits on `^## `
first. Confirmed live: the spec is green inside the 146/146 E2E run.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command captured on the very next token — **and the
COUNT was read as well as the exit**, because an exit alone cannot tell a
green suite from a suite that did not run.

- **cargo: 455 passed / 0 failed / 3 ignored, exit 0**, summed over
  **SIXTEEN** `test result:` lines. Unchanged from T-124's 455 — this
  merge adds no test body and no test target, so 16 lines before and 16
  after. Read at the merge and again after this checkpoint's doc writes.
  **THE HONEST TALLY: three full runs in main's checkout, TWO green and
  ONE red — the FIRST one — carrying TWO failing bodies**, the
  `docs_watch` cliff and the newly filed `a_hostile_session_id…`. Both
  sections above. **Every re-run is declared; none was a silent re-run to
  reach green.**
- **parser: 264/264 across 12 files, exit 0.**
- **app: `npm run build` exit 0, `npm test` 958/958 across 46 files, exit 0.**
- **E2E: 146/146, exit 0**, on scratch port **15210** at the merge and
  **15212** after the doc writes.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0** run the
  way CI runs it, **`npm run lint:tokens` exit 0** at **TOKEN 132 /
  CONTROL 688**. **CONTROL is 688 here against the lane's 660 and the
  verifier's 661** — the corpus is `git ls-files`, so it grows with every
  tracked file main gains, and this merge adds six of its own. **Derive it
  at your own ref; it is not a constant.**
- **Every suite ran AT the merge and again AFTER this checkpoint's doc
  writes** (T-081-s9).

**AND THE "RE-RUN AFTER THE DOC WRITES" RULE HAS A REGRESS, WHICH IS
SETTLED BY DERIVATION RATHER THAN BY ANOTHER RE-RUN.** Editing STATE
after the suites pass appears to invalidate them, and editing it to say
so invalidates them again. **NO SUITE IN THIS REPOSITORY READS
`docs/STATE.md`'s CONTENT** — the two `docs`-wide readers
(`shell-frame.spec.ts:65`, `window-contract.spec.ts:98`) `walk()` the tree
and consume the FILE LIST, and every by-name occurrence of
`docs/STATE.md` in `app/test/**` and `tools/e2e/**` is a synthetic genesis
FIXTURE path, never the real file. So a content-only edit to STATE cannot
move any suite's answer, while ADDING OR REMOVING a file under `docs/`
can. **The rule bites on the file set, not on the prose.**

## NO REGEN AND NO FIXTURE RECONCILIATION WERE OWED

**Both derived, neither assumed.** `index --check` is CURRENT at the
merge, so nothing was regenerated into this checkpoint — the graph stays
at **920 597 bytes / 178 files / 1959 symbols / 1878 edges**, T-124's
numbers, because this merge contains no indexed file.

**PRESERVED FROM T-124's CHECKPOINT BECAUSE IT IS THE MORE USEFUL HALF:
NOT ONE FIXTURE IN THIS REPOSITORY PINS A SYMBOL OR EDGE COUNT** —
grepped for, not remembered. The live-registry dogfood fixtures move when
a component gains or loses indexed FILES, and nothing else. **The
consequence is worth stating plainly: a regen that moves symbols without
moving files cannot red any fixture in this repository.** The fixture set
gates the FILE→COMPONENT map and nothing else about the graph, and a
reader who assumes "the dogfood would have caught it" about a
symbol-level regression is wrong.

**THE SIZE AGAINST THE CEILING IS UNCHANGED: 920 597 of `max_graph_bytes`
1 000 000 = 92.06%, with 79 403 bytes of headroom.** Still the highest
this repository has ever been, and **NOTHING REPORTS IT** — no gate, no
test, no line of output. A lane cut now owes its regen forecast against
**1959 symbols / 1878 edges at 920 597 bytes / 178 files**.

## THE BOARD-TRUTH QUESTION — T-124 PREDICTED THIS WOULD REPRODUCE, AND IT DID, EXACTLY

Four checkpoints have recorded that **`verifying` reads 0 on the board
while lanes are genuinely in verification**, because an executor stamps
`verifying` in its LANE and that stamp only reaches main at the merge.
T-124's checkpoint watched the window open and close for the first time,
and closed by predicting that **the next integrator could reproduce the
table exactly**. **It reproduced, on a different card, with a different
fence, at a different commit:**

| ref | T-052's `status:` |
|---|---|
| main before the merge, `aff1c36` | `building` |
| **the merge commit, `eea466a`** | **`verifying`** |
| this checkpoint | `done` |

**THE `verifying` STAMP WAS OBSERVABLE ON MAIN FOR EXACTLY ONE COMMIT,
AND THE SAME INTEGRATOR WHO OPENED THAT WINDOW CLOSED IT.** The field is
not "unused" and it is not "one merge behind" — **it is one COMMIT wide,
and the ritual guarantees nobody is looking during it**, because the merge
and the checkpoint are the same person's consecutive actions. **Two
independent reproductions make this a PROPERTY OF THE RITUAL rather than
an observation about one card**, which is exactly what a ruling needs and
what four asks have not produced.

The three dispositions are unchanged and none is free:

1. **The stamp moves on the integration branch at handoff**, the way
   T-089 has the architect stamp `building` before the cut. Costs a write
   to main per handoff.
2. **The field goes**, and phase is read from the lane set — which T-110
   now makes possible and T-111 would render.
3. **It stays and is documented as lane-local.**

**Disposition 3 is the status quo and this table is the argument against
describing it as "knowingly one merge behind"** — that phrasing implies a
window a reader could observe, and there is none. **FIFTH ASK. It wants a
ruling rather than a sixth observation, and the mechanism is now
demonstrated twice rather than argued.**

## What ACTUALLY reached the human's running app — AND THIS CARD IS ABOUT NOT BECOMING ITS OWN ELEVENTH INSTANCE

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, **identical before
and after this integration.** The app binary is pid **89201**, started
**2026-08-25 10:54:33**, unchanged throughout, read with the **anchored**
match `ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**The anchored and unanchored forms AGREED here, and that is not evidence
the hazard is absent** — they agree whenever no index run is in flight,
which is exactly the quiet reading CONVENTIONS warns against trusting.

**NOTHING FROM THIS MERGE REACHED THE APP'S CODE, AND THE REASON IS
STRUCTURAL RATHER THAN A TRIGGER THAT DID NOT FIRE.** The window serves
from `/Users/ujju/Projects/nputer-app`, **detached at `c4cfe52`**, which
is an **ancestor** of this merge — re-verified with
`git merge-base --is-ancestor c4cfe52 eea466a` at **exit 0**, and main is
now **31 commits ahead of it**. So main is strictly ahead and nothing
committed to main reaches that window **until @human runs
`git -C ../nputer-app checkout --detach main`**, whatever any trigger
does. **A session that answers "did my change reach the app?" by checking
`app/src/**` triggers gets the right answer for the wrong reason today,
and a wrong answer the moment @human switches back.**

**THE PINNING PROPERTY AND THE THROUGHPUT PROPERTY BOTH HELD, MEASURED
AGAIN HERE.** The app did not move when main did. And this checkout's
`app/src-tauri/target/` was written by three full `cargo test` runs and a
graph gate while the app built nothing and waited on nothing — three
checkouts, three target directories, cargo's exclusive lock uncontended.
**@human's tree was never entered at any point**; every fact about it in
this section came from `lsof` against a pid or from `git` against the
shared object store.

**WHAT DID REACH @HUMAN, AND IT IS THE FOUNDING DEMO WORKING RATHER THAN
A DISTURBANCE.** The app RUNS from the pinned checkout but OPENS
`/Users/ujju/Projects/nputer` as its project, so this merge's board
changes — a card moving to `done`, five new suggestion files — land in
the watched folder live. **That is the demo, not an incident**: code and
watched folder are independent, which is the property @human's ruling was
chosen to preserve. **Rule 3 asks which change reached the app and which
did not, and the honest answer here is "the board did, the binary could
not".**

**No process from this integration survives.** Scratch ports **15210**
(e2e at the merge), **15211** (the guard's negative control) and **15212**
(the post-checkpoint e2e re-run) were each `lsof`-read FIRST (zero rows),
then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in that
order and never the reverse, and all were free again after. **No `pkill`
at any point.** **No `npm ci` at any point.** The sibling lane worktree
`/Users/ujju/Projects/nputer-T-033` was not entered. **The untracked
zero-byte file `z`** still sits in the main checkout — not this
integrator's, not staged, **left alone for the thirteenth checkpoint
running**, which is rule 4 of the new section being obeyed rather than
merely quoted. **Main's 8.7 GB target directory was left exactly as
found.**

## The board, derived from disk at this checkpoint

**221 flat task files — 84 done / 39 planned / 41 parked / 56 suggested /
0 verifying / 1 building; 26 in `rejected/`.**
84 + 39 + 41 + 56 + 0 + 1 = 221. T-052's stamp moves done from 83 to 84
and verifying from 1 to 0; its five suggestion files took `suggested` from
51 to 56 and the flat total from 216 to 221.

**THE SUGGESTION BACKLOG IS FIFTY-SIX AND THE LAST TRIAGE WAS THE
SEVENTH.** It has grown by **twenty-two across the last three merges**
(T-110's thirteen, T-124's four, T-052's five). It grew by seventeen over
the previous two. **The backlog is outrunning the triage.**

## Documents ticked

- **ROADMAP — NOT TOUCHED, and that was derived rather than assumed.**
  Grepped for a sentence this merge could falsify: no ROADMAP entry names
  T-052, the shared checkout, the running app, or a fresh install. F-02's
  entry is about the app shell and board, which this merge does not
  touch. **A method-and-docs card that changes no product behaviour ticks
  no progress line.**
- **ARCHITECTURE — NOT TOUCHED, and this was checked at the one clause
  that could have moved.** Row **C-01 `method/` reads `built (v0.1.5)`**,
  and the card's own ruling is that **no version bump is owed**, so that
  row is still true. No interface moved — the diff has zero Rust and zero
  TypeScript, no `#[tauri::command]`, no event, no dependency, no
  manifest.
- **CONVENTIONS was touched BY THE MERGE and not by this checkpoint.**
  190 lines, all inside T-052's fence.
- **The card** is stamped `done`, with `built_by: claude-opus-5 @T-052`,
  `verified_by: claude-opus-5 @T-052-verify — APPROVED, 2026-08-25` and
  `review: same-model` — **SELF-DECLARED, never read off a commit
  trailer**, and written with em dashes because a colon-space in a YAML
  plain scalar opens a nested mapping and has broken a card three times.
  The lane's notes and the verdict are preserved byte-untouched, **the two
  stale digits the verdict's §10 corrects included** — they are
  corrections to the record, nothing downstream reads either, and
  rewriting a verdict's subject after the fact is worse than leaving the
  correction beside it.
- **The lane's and the verifier's five suggestion files stay as filed**
  (`T-052-s1` … `T-052-s5`).

## Provenance — SELF-DECLARED, never read off a trailer

T-052 is **built by `claude-opus-5` and verified by an independent
`claude-opus-5` session** which did not write the build it judged, and
which read the spec BOUNDED (from the base ref `c4cfe52`, forming and
running its attack before opening the lane's own notes) under the ruling
on T-121 arm 2. **The `Co-Authored-By` trailer on this lane's commits is a
harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened the proof with a counterexample inside one session.

**84 done cards — 62 `same-model`, 16 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 62 + 16 + 5 + 1 = 84. T-052 moves `same-model` from 61
to 62.

## In progress / broken right now

**NOTHING IS BROKEN.** One lane is live: **T-033, building**. `method/`
and `docs/CONVENTIONS.md` were released by this checkpoint and **nothing
is approved and awaiting an integrator** — the batch is empty. `git
branch` still lists every lane this repo has ever run, which is the
intended asymmetry: the BRANCH is kept and only the WORKTREE is removed.

## Next up

1. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST AMONG THE UNBUILT**,
   and it is one token of code. FIFTH checkpoint running at the top of
   this list. Fence `[tools/e2e]`, free. **T-052's lane removed its
   fresh-checkout prerequisite**, so it can now be verified anywhere.
2. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP, AND THE SECTION IT
   LIVES IN JUST LANDED.** CONVENTIONS' DETECT AND REFUSE paragraph tests
   the PORT; `integrator.md` rule 1 governs the CHECKOUT; since @human's
   app moved to its own checkout those are two different facts and the
   literal procedure now refuses forever in main. Measured at this merge
   — see the first-reader section above. Fence
   `[docs/CONVENTIONS.md]`, free. **This is the newest finding in the file
   and the cheapest fix on this list.**
3. **THE NEW INTERMITTENT `a_hostile_session_id_in_the_init_line…` WANTS
   THE `T-088-s4` TREATMENT**, not another sighting: 5/5 green alone,
   1/3 red under the full suite, redding in the same run as the watcher
   body. Two deadline-bearing bodies failing together in a slow checkout
   is a hypothesis worth one controlled experiment.
4. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND.** Two planner
   instructions, quoted ready to paste, for **T-104**'s owed v0.1.6
   method bump. **T-052 ROUTED A SECOND ITEM TO THE SAME SEAT**: whether a
   new normative sentence in a role file is a bump when CONVENTIONS' own
   trigger is a FORMAT change. The debt is per-VERSION, not per-change, so
   one three-file commit discharges T-089's, T-124's and T-052's
   residual together. T-104 is `status: planned` with the three-way fence
   the bump needs.
5. **`T-110-s1` — THE LANE READER IS BUILT AND NOT WIRED.** `lib.rs`
   declares no `pub mod dispatch;`, so the shipped binary does not carry
   the module and `cargo build` is not a gate on it. **The commit that
   takes it DELETES the test shim**, which also drains the D2 bucket.
   Fence `app-shell`, **held by T-033**.
6. **THE BOARD-TRUTH RULING on `verifying`** — FIFTH ask, and now
   reproduced twice by two integrators on two cards. It is a property of
   the ritual, not an anecdote.
7. **THE GRAPH IS AT 92.06% OF ITS CEILING** with 79 403 bytes of
   headroom, and **nothing reports that number**. It has moved 89.59% →
   91.84% → 92.06% across the last three merges that moved it; this one
   did not move it.
8. **`T-088-s4` WANTS RE-FILING AND THEN A ONE-LINE CARD.** The
   measurements are at the top of this file and this integration added an
   eighth and ninth data point to the clock table. Two dispositions:
   **(a)** reclaim the 8.7 GB target dir — **and the objection that
   `target/debug/nputer` is a running binary has now EXPIRED**, since the
   app runs from its own checkout, so `lsof` first and then this is
   merely a big deletion; **(b)** give the body a deadline proportional
   to what it is waiting for, which fixes the symptom in every checkout
   and is the smaller change.
9. **`T-052-s1` — THE FRESH-INSTALL REFUSAL COULD BE A GATE** rather than
   a ritual each session performs from prose. Read it together with item
   2, which is the defect the prose form just exhibited.
10. **`T-052-s2` — THE THREE INSIDE-THE-REPO LANE WORKTREES ARE ALL GONE
    NOW**, so the card is about the MECHANISM (a relative worktree path
    resolved against an unverified cwd) rather than about a live mess.
    `lane-protocol.md` rule 3 carries the clarification as of this merge.
    **Its present-tense "three lanes sit inside the repository" is stale
    and the verdict already says so.**
11. **`T-052-s5` — `integrator.md` NOW HOLDS TWO 1–4 LISTS**, disambiguated
    by vocabulary (*steps* versus *rules*) that is nowhere written down.
    Five citations in the tree cite by number and all five still resolve.
12. **`T-110-s9`** — either a component claims `app/src-tauri/tests/**` or
    `T-110-s1` lands and the question dissolves. Fence
    `docs/architecture/components/`, held by T-033.
13. **`T-120-s1`** — the pre-write exclusivity check still cannot
    discriminate; this integration used the replacement it derives
    (`git diff --cached --name-only` plus `git diff --name-only`, both
    empty), which is what made this turn provably exclusive rather than
    judged. `??` lines alone are not a ceremony, and there were two.
14. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
15. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
