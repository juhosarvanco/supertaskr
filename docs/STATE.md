# State

Updated: 2026-08-25 by the T-086 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: FOUR LANES ARE LIVE,
NOTHING IS APPROVED AND WAITING, AND THE HUMAN'S WINDOW IS PINNED TO A
CHECKOUT MAIN CANNOT REACH.** Nothing on main is broken — this merge was
**455 / 958 / 264 / 146 green, first time, no re-runs**. But **two known
intermittents will meet you before any real defect does**, and one of them
was RE-CLASSIFIED at this merge by measurement rather than by argument.
Read the next three sections before you debug anything.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the SIXTH checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded float
it captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND AND THIS MERGE CAUGHT IT WITH
THE DIGITS**, which is what turns a warning into an identification.
T-086's lane hit it on the FIRST E2E run in its fresh worktree:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match `.5427` against a whole number and you are looking at this and not
at your own change.** It was green on the very next run in that same
worktree, and it did NOT fire at this merge (146/146 first time), because
main is not a fresh checkout. **DO NOT "FIX" IT BY RE-RUNNING UNTIL
GREEN.** The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. T-052's lane removed this
finding's own "needs a fresh checkout to prove" prerequisite by
reproducing the red ON DEMAND in a healed worktree, so whoever takes the
fix can verify it anywhere.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS OUT OF IT

**PRESERVED ACROSS FOUR CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN — and this
checkpoint is the first that can report the cliff GONE from this
checkout.**

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

### THE CLOCK TEST STILL SEPARATES GREEN FROM RED, AND MAIN NOW SITS IN THE GREEN BAND

T-124 found the lib suite's own `test result:` time sorts its runs
perfectly — every green under 9.5s, every red over 14.6s, **a gap of more
than five seconds with nothing in it** — and T-052 reproduced it. **MAIN'S
TARGET DIRECTORY WAS RECLAIMED between that checkpoint and this one and
the prediction held**: `du -sh app/src-tauri/target` reads **2.4 GB** here
against the 8.7 GB the account was written about, and this merge's
`cargo test` ran the lib suite in **3.94s** — not merely in the green band
but down in the ISOLATED-target-dir band, with the watcher body `ok`.
**Eleven runs across three integrations and not one lands between 9.5s and
14.6s.** Read the lib suite's own time first; it tells you which regime
you are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit, and the objection that once headed this warning
is gone (`target/debug/nputer` in this checkout is no longer the running
binary — @human's app moved to its own checkout). What remains is that a
lane may be building against this repository: `lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`, NOW KNOWN LIVE ON A CLEAN CACHE

**THIS IS THE ONE ITEM ON THIS PAGE THAT CHANGED CLASS AT THIS MERGE, AND
IT CHANGED BY A LANE'S OBSERVATION BEATING AN INTEGRATOR'S ARITHMETIC.**

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
`T-086-s1`'s subject.** It did NOT fire at this merge, which is one more
data point and not a reprieve.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE NINTH MEASUREMENT SAYING SO.** A live lane's tip is a
live-environment fact, not a function of a tree; what is stable is WHICH
lane holds WHICH fence. For a tip, run `git worktree list`. **No scratch
worktree is named here either** — the CLASS is recorded, the membership is
the command.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |
| **T-091** | `[tools/e2e]` | building |
| **T-102** | `[app-agent]` | building |
| **T-107** | `[app-interview]` | **board says building; a verify pass is live — see below** |

**FOUR LANES. NOTHING IS APPROVED AND WAITING** — T-086 was the batch's
last card and this checkpoint closes it.

**THE BOARD-TRUTH WINDOW WAS OBSERVED FROM A THIRD DIRECTION HERE, AND
THAT IS NEW.** T-107's card on main reads `status: building` while a
verification pass is genuinely running on it. Four earlier checkpoints
recorded `verifying` reading 0 on the board because an executor stamps it
in its LANE; this is the first time the checkpoint could point at a
**detached `drill-*` worktree named after a lane's VERIFY pass** as an
independent witness that the board is behind. Three sources — the
dispatcher's message, the card, the worktree list — and **the card is the
one that is wrong**. That strengthens disposition 2 below (read phase from
the lane set) with evidence rather than with another ask.

**TWO CLASSES OF NON-LANE WORKTREE EXIST RIGHT NOW AND ONLY ONE IS
PERMANENT.** Derive the membership; do not quote it.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **`c4cfe52` is an ANCESTOR
  of this merge** (`git merge-base --is-ancestor c4cfe52 63099f1` exits
  **0**) and main is now **47 commits ahead of it**, which is the accurate
  reason nothing merged here reaches that window — *not* a trigger that
  failed to fire. Nothing reaches it until @human runs
  `git -C ../nputer-app checkout --detach main`.
- **Detached `drill-*` entries** — the scratch worktrees belonging to
  whichever passes are running. **TWO were present at this checkpoint**,
  one of them a verify pass (above). They come and go at other sessions'
  keystrokes; the class is stable, the list is not.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Every lane entry is a
`../nputer-T-NNN` sibling, which is the spelling CONVENTIONS gives.
**EVERY FENCE IS FREE EXCEPT THE FOUR ABOVE**: `docs/CONVENTIONS.md` and
`method/` were released by this checkpoint. Free too: `app-board`,
`app-dispatch`, `crate-index`, `.github/`.

## Just completed

**T-086 — a transcribed reader count is deleted rather than corrected, and
the card's own title is the finding happening to the card that files it.**
F-06, milestone 4, size S, `touches: [docs/CONVENTIONS.md]`, **fence never
widened**. Main-before **`086bf1c`**, lane tip **`6e4f211`**, merge
**`63099f1`**, this checkpoint after it. `built_by: claude-opus-5 @T-086`;
size-S self-integration, `review: self-verified`.

**WHAT LANDED.** `docs/CONVENTIONS.md`'s FOUR WALKS bullet said *"BUT TWO
LIVE READERS SIT OUTSIDE ALL FOUR WALKS, AND THIS LIST IS CLOSED AT
TWO"*. That sentence is gone. In its place: the same WARNING — an edit to
this file can red a suite no walk row can see — plus **the command that
answers it**, `node tools/e2e/scripts/docs-gate.mjs --census`, and the
gate on your own diff for the suites you owe. The two mechanisms most
likely to bite are kept **as SHAPES and explicitly not as the list**: a
command-bullet edit reds `workflow-parity.spec.ts`, and the method stamp
reds `snapshot_version_matches_the_live_method_stamps` in `kit.rs`. Those
`kit.rs` sentences are load-bearing for gotcha one's three-file-bump
ruling and for `T-078-s3`, which is why they survived a deletion card.

**THE HEADLINE IS THE CARD'S OWN TITLE BEING WRONG, AND THAT IS THIS
FILE'S RULE PROVING ITSELF AGAINST THE CARD THAT FILES IT.** The title
says the reader list *"is four and counting"*. **The gate says FIVE** —
`kit.rs`, `docs-input-gate.spec.ts`, `shell-frame.spec.ts`,
`window-contract.spec.ts`, `workflow-parity.spec.ts` — re-derived at this
merge. Three read the file's CONTENT; two `walk()` all of `docs/`. The
card's number went stale between filing and building, which is exactly
the failure it exists to fix. **So the shipped text prints no number at
all**, and that is the answer rather than a smaller number.

**WHY DELETION AND NOT A THIRD CORRECTION, in the words of the people who
built it.** T-078's executor filed the exact failure under WHAT I AM LEAST
CONFIDENT ABOUT — *"if a third live reader of this file appears …
'CLOSED AT TWO' [makes] it worse than the open version it replaced"* — and
`T-078-s6`'s ask had **requested the closed form in as many words**
(*"so the table's list of non-walk readers is closed rather than open"*).
A card can specify a defect into existence and a faithful editor will
build it: the POISON DRILL bullet's own T-057 lesson, arriving in a
document instead of in a test. And **the reader that broke the sentence
was added by the card that built the census** —
`docs-input-gate.spec.ts`, T-084 — so it went stale as a direct
consequence of the machinery that could have kept it true.

**TWO CORRECTIONS RODE ALONG, BOTH MEASURED, BOTH INSIDE THE ONE-FILE
FENCE.** (1) The same bullet claimed the TOKEN row went stale *"ONE DAY
LATER"* and closed *"TWO SIGNPOSTS IN TWO DAYS"*. `git log -1
--format=%ci` puts `d64c673` at **02:10:07** and `91398f9` at **03:49:24
the same morning** — **ninety-nine minutes, one day**. It is the identical
error the RANGE RULE bullet already records about its own *"false for
weeks"*, and this file's own rule names it: an unrefed DURATION goes stale
exactly the way an unrefed count does. (2) The DOCS GATE bullet's three
proportionality figures — rooms owes ONE command, `docs/CONVENTIONS.md`
owes TWO, a flat task card owes THREE — were **swept and re-derived by
asking the gate, and all three are TRUE**. They stay, because they count
the gate's ANSWER rather than readers and the wide-trigger/narrow-answer
argument collapses without them; what they gained is the ref they were
measured at and a sentence saying they are the answer's SHAPE and not its
census. **The class was checked; not every instance was false.**

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 086bf1c 6e4f211 -> tree 5c8b8f43…, exit 0 (read from $? FIRST)
    git diff --name-only 086bf1c <TREE>                        ->   3   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 086bf1c..63099f1  (THE MERGE'S DIFF)  ->   3   the only one that means anything
    git diff --name-only c4c15c8..6e4f211  (branch-only, TWO)  ->   3
    git diff --name-only 086bf1c...6e4f211 (THREE dots)        ->   3   AGREES — FIFTH MERGE RUNNING
    git diff --name-only 086bf1c..6e4f211  (TWO dots, FORBIDDEN)   ->   8
    git diff --name-only c4c15c8..63099f1  (merge-base, FORBIDDEN) ->   8
    git diff --name-only c4c15c8..086bf1c  (main's advance)        ->   5

**THE FORBIDDEN TWO-DOT FORMS OVERSTATE BY 5 PATHS — 2.67x — AND BOTH ARE
PURE LEFT-ENDPOINT DRIFT.** Main advanced **5** under this lane, the
branch **3**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 5 + 3 = 8 — the arithmetic that proves them disjoint, checked
as SETS and not only as counts. Ratios so far: T-110 **7.0x**, T-120
**1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**. The ratio is
weather; **the left endpoint is the signal.**

**THE THREE-DOT FORM RETURNED THE RIGHT ANSWER FOR THE FIFTH MERGE
RUNNING, AND THE WARNING GETS MORE URGENT WITH EVERY AGREEMENT, NOT
LESS.** `A...B` is DEFINITIONALLY `$(git merge-base A B)..B`, so
`086bf1c...6e4f211` IS the branch-only range — 3, exactly right — because
this branch is purely additive and main's advance is disjoint from it.
**A forbidden form that keeps giving the right answer is more dangerous
than one that gives a wrong one**, because it agrees *only while the two
path sets stay disjoint* and teaches a false lesson every time it works.
**This integration checked SET IDENTITY with `diff` over sorted lists in
both directions rather than comparing counts** — prescribed vs three-dot
is `diff` exit 0, prescribed vs branch-only is `diff` exit 0 — and that
is the check that would have caught a disagreement had one existed. **The
day a lane and main touch the same file, this form silently drops main's
side of that path with no signal that anything happened.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`5c8b8f438727c1c1c69c11d3726c7d8c89a045ec` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`086bf1c` and `6e4f211` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

## THREE standing gates — DERIVED from the merge's own 3 paths

| gate | trigger | on these 3 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — NOT OWED** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **3 — FIRES**, four suites |

The three are `docs/CONVENTIONS.md`, the card, and `T-086-s1`. **A grep
for `\.(ts|tsx|js|jsx|mjs|rs)$` over the whole three returns 0** — this
merge is markdown only.

- **GRAPH REGEN — NOT OWED on 0 of 3, AND ASKED ANYWAY** as its own bullet
  demands. `cargo run -p nputer-index -- index --check --root ../..` is
  **exit 0, CURRENT** at **920 597 bytes / 178 files / 1959 symbols / 1878
  edges**, unmoved. **This is the answer the gate gave, not a prediction
  it was spared** — and it is why no regen is committed here.
- **BOOT GATE — NOT OWED, 0 of 3.** No `app/src-tauri/**`, no
  `app/src/**`, neither manifest. `npm run boot:check` was NOT run, and
  that is derived rather than skipped.
- **DOCS GATE — exit 1**, invoked DIRECTLY from the repo root with the
  merged paths as ROOT-RELATIVE `$(…)` arguments, **never through
  `xargs`**. **3 of 3 under `docs/`, FOUR suites owed** — `cargo test from
  app/src-tauri/`, `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — all four run and green, at the merge
  and again after this checkpoint's doc writes. **`cargo test` is owed on
  a markdown-only merge and that is the point of this gate**:
  `app/src-tauri/src/agent/kit.rs` reads `docs/CONVENTIONS.md` off disk.
  The gate reports **12 derived readers across 4 suites**, a census of
  **130** docs-shaped sites in 22 files, and **0 frontmatter issues** —
  which is this card's `done` stamp and `T-086-s1`'s frontmatter checked
  rather than assumed.

## THE PARITY DERIVATION — THE THING MOST LIKELY TO BREAK QUIETLY, RE-DERIVED AT THE MERGE ITSELF

`tools/e2e/tests/workflow-parity.spec.ts` derives CI's expectations from
CONVENTIONS' "Build & test" section, and **a U+00B7 MIDDLE DOT inside a
parenthetical silently truncates the exposed command list.** This merge
adds **44 lines to that file**, so the derivation was re-implemented from
its documented rules (`buildAndTestSection`, `commandBullets`,
`structuralProblems`) and run on both sides of the merge:

| ref | file lines | "Build & test" lines | bullets | exposed commands | structural problems | U+00B7 section / file |
|---|---|---|---|---|---|---|
| `086bf1c` (main before), from the blob | 1408 | 259 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| **the merge, from disk** | **1452** | **259** | **4/5/5/7** | **21** | **0** | **20 / 23** |

**FORTY-FOUR LINES WERE ADDED AND THE SECTION DID NOT MOVE BY ONE LINE,
ONE COMMAND OR ONE MIDDLE DOT**, and the 21 commands are identical by
NAME on both rows, not merely by count. **The added lines contain ZERO
U+00B7** (`git diff 086bf1c..63099f1 -- docs/CONVENTIONS.md | grep '^+' |
grep -c '·'` is **0**), so the truncation trap cannot fire from them; the
new prose sits in `## Gotchas` and in the DOCS GATE bullet, neither of
which the derivation can reach because `buildAndTestSection` splits on
`^## ` first. Confirmed live: the spec is **17 bodies green** inside the
146/146 E2E run. The `currently v0.1.5` stamp `cargo test` reads off disk
is present and untouched.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command captured on the very next token — **and the COUNT
was read as well as the exit**, because an exit alone cannot tell a green
suite from a suite that did not run.

- **cargo: 455 passed / 0 failed / 3 ignored, exit 0**, summed over
  **SIXTEEN** `test result:` lines, lib suite **3.94s**. **GREEN FIRST
  TIME — no re-run, nothing discarded.** Unchanged from T-052's 455; this
  merge adds no test body and no test target.
- **parser: 264/264 across 12 files, exit 0.**
- **app: `npm test` 958/958 across 46 files, exit 0.**
- **E2E: 146/146, exit 0**, on scratch port **15253** at the merge and
  **15254** after the doc writes.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0** run the
  way CI runs it, **`npm run lint:tokens -- --selftest` exit 0** (65 TOKEN
  + 4 CONTROL samples, 87 walk-policy checks, 9 evidence-floor checks) and
  **`npm run lint:tokens` exit 0** at **TOKEN 132 / CONTROL 689**.
  **CONTROL is 689 here against T-086's lane at 685 and T-052's checkpoint
  at 688** — the corpus is `git ls-files`, so it grows with every tracked
  file main gains. **Derive it at your own ref; it is not a constant.**
- **THE FIVE DERIVED READERS OF `docs/CONVENTIONS.md` RAN GREEN BY NAME**,
  which is the one check this particular merge owed above all others:
  `snapshot_version_matches_the_live_method_stamps` reads `ok`;
  `workflow-parity.spec.ts` 17, `docs-input-gate.spec.ts` 42,
  `shell-frame.spec.ts` 6 and `window-contract.spec.ts` 5, **with no
  non-passing body among the five files**.
- **Every suite ran AT the merge and again AFTER this checkpoint's doc
  writes** (T-081-s9).

**AND THE "RE-RUN AFTER THE DOC WRITES" RULE HAS A REGRESS, SETTLED BY
DERIVATION RATHER THAN BY ANOTHER RE-RUN.** **NO SUITE IN THIS REPOSITORY
READS `docs/STATE.md`'s CONTENT** — the two `docs`-wide readers
(`shell-frame.spec.ts`, `window-contract.spec.ts`) `walk()` the tree and
consume the FILE LIST, and every by-name occurrence of `docs/STATE.md` in
`app/test/**` and `tools/e2e/**` is a synthetic genesis FIXTURE path,
never the real file. So a content-only edit to STATE cannot move any
suite's answer, while ADDING OR REMOVING a file under `docs/` can. **The
rule bites on the file set, not on the prose.**

## NO REGEN AND NO FIXTURE RECONCILIATION WERE OWED

**Both derived, neither assumed.** `index --check` is CURRENT at the
merge, so nothing was regenerated — the graph stays at **920 597 bytes /
178 files / 1959 symbols / 1878 edges**, because this merge contains no
indexed file.

**PRESERVED BECAUSE IT IS THE MORE USEFUL HALF: NOT ONE FIXTURE IN THIS
REPOSITORY PINS A SYMBOL OR EDGE COUNT** — grepped for, not remembered.
The live-registry dogfood fixtures move when a component gains or loses
indexed FILES, and nothing else. **A regen that moves symbols without
moving files cannot red any fixture here**, and a reader who assumes "the
dogfood would have caught it" about a symbol-level regression is wrong.

**THE SIZE AGAINST THE CEILING IS UNCHANGED: 920 597 of `max_graph_bytes`
1 000 000 = 92.06%, with 79 403 bytes of headroom.** Still the highest
this repository has ever been, and **NOTHING REPORTS IT** — no gate, no
test, no line of output. A lane cut now owes its regen forecast against
**1959 symbols / 1878 edges at 920 597 bytes / 178 files**.

## The board, derived from disk at this checkpoint

**222 flat task files — 85 done / 36 planned / 41 parked / 56 suggested /
0 verifying / 4 building; 26 in `rejected/`.**
85 + 36 + 41 + 56 + 0 + 4 = 222. T-086's stamp moves done from 84 to 85
and building from 5 to 4; its one suggestion file took `suggested` from
55 to 56 and the flat total from 221 to 222.

**THE SUGGESTION BACKLOG IS FIFTY-SIX AND THE LAST TRIAGE WAS THE NINTH.**
This merge added ONE, which is the smallest contribution in five merges —
a one-file docs card that files one finding is what a lane looks like when
it stays inside its fence. **The backlog is still outrunning the triage.**

## Documents ticked

- **ROADMAP — NOT TOUCHED, and that was derived rather than assumed.**
  Grepped for a sentence this merge could falsify. The one hit that could
  have moved is the milestone-4 paragraph citing *the "DERIVE THE COUNT AT
  YOUR OWN REF" hazard docs/CONVENTIONS.md names* — that hazard is still
  named, in the `AND THE COUNTS ARE PRINTED, NEVER PINNED` paragraph this
  merge did not touch, so the citation still resolves. No ROADMAP entry
  names T-086, the walk table, or the reader census.
- **ARCHITECTURE — NOT TOUCHED, and this was checked at the two clauses
  that could have moved.** Row **C-01 `method/` reads `built (v0.1.5)`**
  and no `method/` path is in this diff, so no bump is owed and that row
  is still true. The layout section already applies the ruling this card
  applies — *"THE NUMBER OF THEM IS DELIBERATELY NOT WRITTEN HERE: it is
  `node tools/e2e/scripts/docs-gate.mjs --census`"* — so the merge agrees
  with it rather than falsifying it. **ONE RESIDUAL IS RECORDED RATHER
  THAN EDITED**: that sentence calls T-085's ELEVEN→twelve *"the second
  time a transcribed reader count in this tree went green and wrong"*, and
  the CLOSED AT TWO count was a third instance of the same class that
  predates it. The ordinal was imprecise before this merge and this merge
  does not make it false, so an integrator ticking documents leaves it —
  it is a card's call, not a checkpoint's.
- **CONVENTIONS was touched BY THE MERGE and not by this checkpoint.**
  44 lines, all inside T-086's fence.
- **The card** is stamped `done`, with `built_by: claude-opus-5 @T-086`
  and `review: self-verified` — **SELF-DECLARED, never read off a commit
  trailer**, and written with em dashes because a colon-space in a YAML
  plain scalar opens a nested mapping and has broken a card three times.
  `verifier:` and `verified_by:` stay empty, which is the shape every
  self-verified card in this repository uses. The lane's implementation
  notes are preserved byte-untouched.
- **`T-086-s1` stays as filed** (`status: suggested`).

## Provenance — SELF-DECLARED, never read off a trailer

T-086 is **built and self-integrated by `claude-opus-5`** under the
standing ruling that size-S cards touching docs, method or tooling keep
self-integration while S cards touching SHIPPED CODE get a verifier. Its
fence is one markdown file, so self-integration is correct. **The
`Co-Authored-By` trailer on this lane's commits is a harness constant and
is NOT evidence of a model** — T-085 proved it and T-101 sharpened the
proof with a counterexample inside one session.

**85 done cards — 62 `same-model`, 17 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 62 + 17 + 5 + 1 = 85. T-086 moves `self-verified` from 16
to 17.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, **identical before
and after this integration.** The app binary is pid **89201**, started
**2026-08-25 10:54:33**, unchanged throughout, read with the **anchored**
match `ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.

**RULE 1's DETECTOR WAS IMPLEMENTED THE WAY `integrator.md` MEANS IT
RATHER THAN THE WAY CONVENTIONS' DETECT AND REFUSE PARAGRAPH SPELLS IT**,
which is the defect T-052's checkpoint measured and item 2 below still
carries. The literal text tests the PORT and refuses forever in main now
that @human's app is permanently up. This integration read the holder's
CWD — `lsof -p 88948` puts it at **`/Users/ujju/Projects/nputer-app/app`**,
another checkout — and proceeded, which is rule 1's own sentence (*"A
FRESH DEPENDENCY INSTALL SHALL NOT RUN IN A CHECKOUT SERVING A LIVE
PRODUCT"*) applied to the CHECKOUT. **In the event nothing was owed
anyway**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present in this checkout, so rule 1's trigger
never fired. **No `npm ci` was run at any point in this integration.**

**NOTHING FROM THIS MERGE REACHED THE APP'S CODE, AND THE REASON IS
STRUCTURAL RATHER THAN A TRIGGER THAT DID NOT FIRE.** The window serves
from `/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`, an
**ancestor** of this merge — re-verified at exit **0**, main now **47
commits ahead**. A session that answers "did my change reach the app?" by
checking `app/src/**` triggers gets the right answer for the wrong reason
today, and a wrong answer the moment @human switches back.

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout but OPENS `/Users/ujju/Projects/nputer` as its
project, so this merge's board changes — a card moving to `done`, one new
suggestion file — land in the watched folder live. Code and watched folder
are independent, which is the property @human's ruling preserves.

**No process from this integration survives.** Scratch ports **15253**
(e2e at the merge) and **15254** (the post-checkpoint re-run) were each
`lsof`-read FIRST (zero rows), then bind-confirmed free on `127.0.0.1`,
`0.0.0.0`, `::1` and `::` in that order and never the reverse, and both
were free again after. **No `pkill`. No `npm ci`. No `cargo clean`** — and
be precise about the target directory rather than claiming more than is
true: this integration's two full `cargo test` runs and the graph gate
WROTE to main's 2.4 GB `app/src-tauri/target/`, as any cargo run must.
What was not done is a reclaim or a clean, and nothing contended for it
— @human's app builds in its own checkout, so cargo's exclusive lock was
uncontended throughout. No sibling worktree was entered. **The untracked
zero-byte file `z`** still sits in the main checkout — not this
integrator's, not staged, **left alone for the fourteenth checkpoint
running**.

## In progress / broken right now

**NOTHING IS BROKEN.** Four lanes are live — **T-033**, **T-091**,
**T-102** and **T-107** (the last with a verify pass running against a
board that still reads `building`). `docs/CONVENTIONS.md` and `method/`
were released by this checkpoint and **nothing is approved and awaiting an
integrator** — the batch is empty. `git branch` still lists every lane
this repo has ever run, which is the intended asymmetry: the BRANCH is
kept and only the WORKTREE is removed.

## Next up

1. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST AMONG THE UNBUILT**,
   and it is one token of code. SIXTH checkpoint running at the top of
   this list. Fence `[tools/e2e]`, **held by T-091** — so it waits, or it
   rides T-091's lane if that card's builder wants it. The fractional
   millisecond in the head section is now the identification, not just the
   diagnosis.
2. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP, AND THIS
   INTEGRATION IMPLEMENTED THE FIX BY HAND RATHER THAN WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT; since @human's app moved
   to its own checkout those are two different facts and the literal
   procedure refuses forever in main. **The repair is one step —
   `lsof -p <pid>` for the holder's cwd, compared against the checkout you
   are installing into — and it has now been performed at two consecutive
   merges without ever being added to the doc.** Fence
   `[docs/CONVENTIONS.md]`, **free as of this checkpoint**. Cheapest fix
   on this list.
3. **`T-086-s1` — THE HOSTILE-SESSION-ID BODY IS LIVE AT ~1-IN-19 ON A
   CLEAN CACHE** and wants the `T-088-s4` treatment aimed at the right
   variable now that the target dir is excluded. Read it with the
   retraction on `T-088-s4`, whose standing rule is the transferable part:
   **a re-measurement can only settle a finding whose MECHANISM the
   intervention addresses.** Fence `[app-agent]`, **held by T-102**.
4. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND.** Two planner
   instructions, quoted ready to paste, for **T-104**'s owed v0.1.6 method
   bump. T-052 routed a second item to the same seat: whether a new
   normative sentence in a role file is a bump when CONVENTIONS' own
   trigger is a FORMAT change. The debt is per-VERSION, not per-change, so
   one three-file commit discharges T-089's, T-124's and T-052's residual
   together. T-104 is `status: planned` with the three-way fence the bump
   needs, and it also carries the standing ruling on S-card verification.
5. **`T-110-s1` — THE LANE READER IS BUILT AND NOT WIRED.** `lib.rs`
   declares no `pub mod dispatch;`, so the shipped binary does not carry
   the module and `cargo build` is not a gate on it. **The commit that
   takes it DELETES the test shim**, which also drains the D2 bucket.
   Fence `app-shell`, **held by T-033**. T-126 was promoted at the ninth
   triage for this.
6. **THE BOARD-TRUTH RULING on `verifying`** — SIXTH ask, and this
   checkpoint adds a third kind of witness: a detached `drill-*` worktree
   named after a lane's verify pass, standing beside a card that still
   reads `building`. Three dispositions, none free: stamp on the
   integration branch at handoff; drop the field and read phase from the
   lane set; or keep it and document it as lane-local. **It wants a
   ruling, not a seventh observation.**
7. **THE GRAPH IS AT 92.06% OF ITS CEILING** with 79 403 bytes of
   headroom, and **nothing reports that number**.
8. **`T-111` RETURNED TO `planned` NOT BUILT** and its three findings are
   fresh: `[app-board]` cannot hold a pin, and **C-11 is claimed by both
   `app-board` and `app-shell`, so those two fences were never disjoint**.
   That is a fence-arithmetic defect the dispatcher relies on; read
   `T-111-s1` before cutting the next overlapping pair.
9. **`T-052-s1` — THE FRESH-INSTALL REFUSAL COULD BE A GATE** rather than
   a ritual each session performs from prose. Read it together with item
   2, which is the defect the prose form keeps exhibiting.
10. **`T-110-s9`** — either a component claims `app/src-tauri/tests/**` or
    `T-110-s1` lands and the question dissolves. Fence
    `docs/architecture/components/`, held by T-033.
11. **`T-120-s1`** — the pre-write exclusivity check still cannot
    discriminate; this integration used the replacement it derives
    (`git diff --cached --name-only` plus `git diff --name-only`, both
    empty), which is what made this turn provably exclusive rather than
    judged. `??` lines alone are not a ceremony, and there was exactly one
    (`z`).
12. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged). **T-086 answered the
    neighbouring question and deliberately did not answer this one**: the
    reader sentence took the stop-enumerating option, and the walk table's
    TOKEN row still enumerates `P1–P4` plus `P6` with nothing deriving it.
13. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
