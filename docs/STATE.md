# State

Updated: 2026-08-25 by the T-120 integrator (self-integrated, size S).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: FOUR LANES ARE LIVE
AND THE HUMAN'S WINDOW IS NOT READING THIS CHECKOUT.** Two lanes are in
verification, two are building, and every standing gate was derived and
run at this merge. Nothing on main is broken. **But before you debug a
red in a fresh worktree, read the next section — one known defect will
fire in YOUR new lane, exactly once, and then hide.**

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** T-120's first `npm test` from tools/e2e in its new lane
worktree was **145 passed / 1 failed, exit 1**. The identical second run,
same commit, same worktree, **no edit in between, was 146/146 exit 0.**

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too —
           a content-exact restore that moves the clock reds an mtime guard
    Expected: 1787642946965.186
    Received: 1787642946965

**THE MECHANISM, MEASURED RATHER THAN GUESSED.** The body captures
`statSync(target)`, restores with `utimesSync(target, clock.atime,
clock.mtime)`, then asserts `statSync(target).mtimeMs === clock.mtimeMs`.
**`Stats.mtime` is a `Date`, and a `Date` holds whole milliseconds** — so
the restore writes back a ROUNDED timestamp while the assertion compares
the unrounded float it captured. Probed on this filesystem: **50 of 50
fresh writes produce a sub-millisecond mtime**, so the assertion is not
occasionally unlucky, it is nearly always false on a file whose mtime
came from an ordinary write or checkout.

**AND THE FAILURE REPAIRS THE CONDITION THAT CAUSED IT.** The
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run captures a whole-millisecond clock, the
rounding is a no-op, and it passes. **Red once, green forever, in that
checkout.**

Measured across three checkouts at identical content:

| checkout | `shell.ts` mtimeMs | reds? |
|---|---|---|
| main | `1786940753485` | no — already whole-ms |
| the T-120 lane, AFTER its one red | `1787642946965` | no — healed by the red |
| `drill-T-120`, which never ran the body | `1787643644520.721` | **YES** |

**MAIN IS GREEN ONLY BECAUSE SOMETHING ALREADY RAN THE BODY HERE**, and
this merge confirmed it live: `token-scan.spec.ts:201` PASSED in main at
this integration, the same body that had redded in the lane an hour
earlier. Whether it reds is decided entirely by one timestamp's
fractional part.

**SO IT FIRES IN EXACTLY THE PLACES THIS PROJECT CREATES MOST OFTEN: a
fresh lane worktree, and a fresh POISON DRILL worktree.** Every executor
meets it once, cannot reproduce it, and has no way to tell it from a
flake — while this file at `3f9bef2` recorded *"four consecutive green
runs after the move"*, which is precisely what one red followed by three
greens looks like from the inside. **DO NOT "FIX" IT BY RE-RUNNING UNTIL
GREEN.** The fix is one token, measured:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

`utimesSync` carries the fraction into the `timespec`; the probe
confirms an exact round trip. **Keep the strict `toBe`** — weakening it
to whole milliseconds deletes the property `T-079-s3` exists to defend.
**To reproduce, the obvious way does not work**: cut a FRESH detached
worktree, install, and run the spec ONCE.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not
a lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN
AND THIS IS THE SIXTH MEASUREMENT SAYING SO**: between this integrator's
dispatch read and its merge read, T-110 moved `b91732b` → `929e76a`,
T-052 `c4cfe52` → `05f195c` → `966b8dd`, and T-124 `c4cfe52` →
`e896865`, while two scratch worktrees were destroyed and two others
created. **A live lane's tip is a live-environment fact, not a function
of a tree.** What is stable is WHICH lane holds WHICH fence. For a tip,
run `git worktree list`.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-110** | `[app-dispatch]` | **third and final verification pass**, under @human's waiver — **a third rejection PARKS the card** |
| **T-124** | `[app-agent]` | **under verification**; its finding is that the adapter deliberately did NOT move |
| **T-052** | `[method/, docs/CONVENTIONS.md]` | building |
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |

**ALL FOUR CARDS READ `status: building` ON DISK, DERIVED HERE, AND TWO
OF THEM ARE WRONG ABOUT THEIR OWN PHASE.** T-110 and T-124 are in
verification and the board cannot say so — `verifying` is **0** across
all 199 files. **BELIEVE THE WORKTREE AND THE ROOM, NOT THE STAMP.**

**THREE WORKTREES THAT ARE NOT LANES, AND ONE OF THEM MATTERS A LOT:**

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one now serving port 1420.** See the
  running-app section below; this is the most consequential line in this
  file after `T-120-s3`.
- **Detached `drill-T-NNN-*` entries — scratch worktrees belonging to
  whichever passes are running.** DO NOT QUOTE THE LIST FROM HERE. It
  went stale INSIDE THIS CHECKPOINT: at the merge read it was
  `drill-T-110-verify3` and `drill-T-124-verify`; twenty minutes later,
  after the lane worktree was removed, it was `drill-T-052-verify` and
  `drill-T-124-verify`, with T-110 moved `929e76a` → `69cc6c9`. **That
  is the rule this file states one paragraph up, catching its own
  author** — a scratch worktree is a live-environment fact with a
  lifetime measured in minutes, so the CLASS is recorded here and the
  membership is `git worktree list`.

**AND THREE LANE WORKTREES SIT AT NON-STANDARD PATHS**, under
`tools/nputer-T-052`, `tools/nputer-T-120` and `tools/nputer-T-124` —
**INSIDE the repository**, where `method/lane-protocol.md` rule 3 asks
for a sibling directory. The dispatcher cut them with a relative path,
owns the error, and relocation is pending. **The visible consequence is
in `git status --short`, and it broke a standing check — see
`T-120-s1`.**

**`[tools/e2e]` IS FREE** as of this checkpoint, in the order lane
protocol rule 6 fixes (merge, then checkpoint, then remove). Free too:
`app-shell`, `app-board`, `app-interview`, `crate-index`, `.github/`.

## Just completed

**T-120 — the universal's regression pin reads both scripts and any
spelling.** F-06, milestone 4, size S, `touches: [tools/e2e]`, **fence
never widened**. Built and self-integrated by `claude-opus-5 @T-120`;
`review: self-verified` (size S takes no verifier — TASK-FORMAT's
ceremony table; and its fence is TOOLING, which is the correct side of
@human's 2026-08-25 ruling that S cards touching SHIPPED CODE get a
verifier). Main-before **`ce8b8e7`**, lane tip **`2f0404d`**, merge
**`e5a8f6a`**, this checkpoint after it.

**ONE FILE OF CODE CHANGED**, `tools/e2e/tests/docs-input-gate.spec.ts`.
The pin swept `docs-scan.mjs` alone with
`/only (?:kind of )?file that CAN read/` while its comment claimed the
retraction was the ONLY place the universal survives. Three shapes walked
past it at a green suite: the sentence **wrapped** across a comment line
break, the sentence in **lowercase**, and the sentence stated in
**`docs-gate.mjs`**, which the pin never opened.

- **`GAP = "[\s*]+"` between every word, plus the `i` flag.** It matches
  runs of whitespace and comment-continuation `*` and nothing else, so it
  cannot leap a word, a `/` or a quote: on this tree it matches
  **exactly** what the narrow pin matched, one hit at offset 92213, and
  nothing more. **Widening cost no precision, measured rather than
  hoped.**
- **The sweep reads BOTH scripts, with a rule of its own for each.** The
  window (retraction offset, positive-claim offset) is defined in
  `docs-scan.mjs` and nowhere else, so **outside the retraction file ANY
  occurrence is a hit.**
- **THE POSITIVE CONTROL SURVIVED THE WIDENING, AND THAT WAS THE REAL
  RISK.** The retraction QUOTES the sentence, and that quotation is the
  only thing keeping the sweep from being vacuous. A matcher widened
  until it stopped matching the quotation would have deleted its own
  control. Mutant E deletes the quotation and reds on that exact
  assertion.
- **A NEW BODY COVERS THE CONCLUSION, NOT ONLY THE PREMISE.** Every
  `exact set of places` in either script must carry `ROOT-ANCHORED` or
  `THIS CLASS` within 80 characters. **Measured before it was written:
  two occurrences, both already scoped (at +8 and +4), zero in
  `docs-gate.mjs` — ZERO unscoped hits, so there was no noise to trade
  against and the arm was built rather than argued away.**
- **THE COMMENT NARROWED TO WHAT IS ENFORCED.** It now says the only
  place *this wording* survives, in either script — and it NAMES the
  benign differently-worded retraction at `docs-scan.mjs:128` that the
  sweep deliberately does not reach, asserted present-and-outside-the-
  window so "seen and kept" cannot rot into "missed".

**NO ARM OF THE GATE'S BEHAVIOUR MOVED.**
`git diff --name-only c4cfe52..2f0404d -- tools/e2e/scripts/` is **0
paths**; `docs-scan.mjs` and `docs-gate.mjs` are byte-identical, proved
by sha256 after every one of nine drill mutations.

## THE CARD'S OWN FIGURES, RE-DERIVED — AND ONE DID NOT REPRODUCE

| figure | card said | measured | at |
|---|---|---|---|
| top-level tests in the spec | 36 | **36** | `6b0cf47` |
| the same | — | **41** | `c4cfe52`, the lane's base |
| the same, after this card | — | **42** | `2f0404d` |
| the universal, case-insensitive, in `scripts/` + `tests/` | exactly once | **exactly once** | `c4cfe52` |
| the conclusion "restated three times" | three | **TWO** | `6b0cf47` AND `c4cfe52` |

**`exact set of places` occurs TWICE, at BOTH refs, both in
`docs-scan.mjs`, zero in `docs-gate.mjs`.** The arm was built against the
hit list it measured rather than against the card's count — which is what
the criterion asked for in the branch where the executor disagrees.

## Ranges, every dot count stated, at their own refs

**MAIN ADVANCED ONE FIRST-PARENT COMMIT / 1 PATH UNDER THIS LANE** —
`c4cfe52` → `ce8b8e7`, T-110's room resolution.

    git merge-tree --write-tree ce8b8e7 2f0404d -> tree c32d093a…, exit 0 (read from $? FIRST)
    git diff --name-only ce8b8e7 <TREE>                        ->  5   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only ce8b8e7..e5a8f6a   (THE MERGE'S DIFF) ->  5   the only one that means anything
    git diff --name-only ce8b8e7...2f0404d  (THREE dots, pre-merge)  ->  5
    git diff --name-only c4cfe52..2f0404d   (TWO, branch-only)       ->  5
    git diff --name-only ce8b8e7..2f0404d   (TWO dots, FORBIDDEN)    ->  6
    git diff --name-only c4cfe52..ce8b8e7   (main's advance)         ->  1

**THE FORBIDDEN FORM OVERSTATES BY ONE PATH — 1.2x, THE SMALLEST GAP
THIS PROJECT HAS MEASURED**, and it is still pure left-endpoint drift:
main advanced **1** path, the branch **5**, `comm -12` over the sorted
lists is **EMPTY**, and 1 + 5 = 6 — the arithmetic that proves the sets
disjoint. **THE SMALL GAP IS THE INTERESTING PART.** T-079 measured
8.6x on the same forbidden form. The overstatement is a function of how
far main moved under the lane, not of anything the lane did, so a lane
held open for ten minutes and one held open for six hours produce
wildly different numbers from the SAME mistake. **A ratio is not the
signal; the left endpoint is.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`c32d093ab16da3b2adfd755da0cf672120760da5` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`ce8b8e7` and `2f0404d` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**THE TWO TOOLS WANT OPPOSITE THINGS, AND THIS INTEGRATION USED EACH
WHERE IT BELONGS.** `git merge-tree` reads COMMITS, so the lane had to
be committed before it could be forecast; the DOCS GATE reads TRACKED
files through the index, so new doc files had to be `git add`ed before
it could see them (`T-010-s10`'s hole, worked around rather than walked
into). A session that remembers only one of the two rules gets a clean
answer from the wrong half of its own change.

## THREE standing gates — DERIVED from the merge's own 5 paths

| gate | trigger | on these 5 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **1 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **4 — FIRES**, three suites |

- **GRAPH REGEN — FIRES on ONE path** (`tools/e2e/tests/docs-input-gate.spec.ts`)
  and the gate was **ASKED rather than predicted**, which is what that
  bullet's own standing lesson demands. `index --check --root ../..` is
  **exit 0, CURRENT** at **895 891 bytes · 172 files · 1889 symbols ·
  1849 edges** — unmoved from T-079's checkpoint. **NO REGEN WAS OWED AND
  NONE WAS RUN.** `tools/` is `.nputerignore`d, so a diff confined there
  cannot move the graph by construction — but that is the answer the gate
  gave, not a prediction it was spared. **The exit was re-read UNPIPED**:
  the first invocation was piped through `tail`, whose status is not the
  gate's, and a piped exit is not evidence about the process before it.
- **BOOT GATE — NOT OWED, 0 of 5.** This fence cannot produce
  `app/src-tauri/**`, `app/src/**` or a manifest; derived at the merge
  rather than inherited from the brief.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the merged paths as
  ARGUMENTS, ROOT-RELATIVE, never through `xargs`. **4 of 5 under
  `docs/`, THREE suites owed** — `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **`cargo test from app/src-tauri/` is NOT owed, by this merge OR by
  this checkpoint** — its readers are `docs/CONVENTIONS.md`,
  `docs/architecture/components` and a research capture, and this
  integration writes NONE of them (CONVENTIONS is T-052's fence tonight
  and was left alone). That is the derivation flipping the OTHER way from
  T-079's, where a CONVENTIONS edit pulled a Rust suite into a docs-only
  checkpoint. The gate reports 12 derived readers across 4 suites, a
  census of 129 sites in 22 files, and **0 frontmatter issues**.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command, captured on the very next token — **and the
COUNT was read as well as the exit**, because an exit alone cannot tell
a green suite from a suite that did not run.

- **app: 958/958 across 46 files**, exit **0**, after `npm run build`
  exit **0**. The bundle was REBUILT rather than trusted: `git merge`
  bumps mtimes the way `git checkout` does.
- **parser: 264/264 across 12 files**, exit **0**.
- **E2E: 146/146**, exit **0**, on scratch port **15152** — 145 plus this
  card's one new body. `npm run typecheck` **0**.
- **token lint: selftest 0, lint 0** — clean at **TOKEN 131 / CONTROL
  660**. The selftest reports 65 TOKEN + 4 CONTROL samples, 87
  walk-policy checks, 9 evidence-floor checks. **CONTROL went 657 → 660
  on this lane's own three suggestion files**; both corpus counts are
  printed and pinned by nothing, so derive them at your own ref.
- **`npm run lint:docs` exit 0**, run the way CI will run it.
- **Every suite ran AT the merge and again AFTER this checkpoint's doc
  writes.** Both passes are the numbers above.

**THE SHIPPED BUNDLE DID NOT MOVE, AND THAT IS MEASURED RATHER THAN
ARGUED.** `index-CNznNhXD.js` / `index-D41xl3Gz.css` are **527 994 /
45 180** bytes — byte-identical filenames and sizes to T-079's
checkpoint. `tools/e2e/**` is not bundled and `docs/` is not a Tailwind
source, so a rebuild reproduced the same hashes exactly.

## The poison drill, carried into the record

Detached scratch worktree **`drill-T-120`** at `0c4fba4`; driver
`drill-T-120.sh` and helper `drill-T-120-mutate.mjs`, **both named
per-lane along with the worktree** (T-088-s3: naming only the worktree is
not enough). **ONE SIDE ONLY** — every mutation edits a PRODUCER,
`docs-scan.mjs` or `docs-gate.mjs`, never the spec's assertion and never
a literal the two share. Each mutation read back with `git diff -U1`
BEFORE its run. Baseline unmutated: **42 passed, exit 0.**

**NINE MUTANTS, NINE REDS, ZERO SURVIVALS.**

| # | mutation | before this card | after |
|---|---|---|---|
| A | the rejected lines, outside the window | 35/1 exit 1 | **41/1 exit 1** |
| B | **the same claim WRAPPED across a line break** | **36/36 exit 0** | **41/1 exit 1** |
| C | **the same claim in lowercase** | **36/36 exit 0** | **41/1 exit 1** |
| D | **the same claim in `docs-gate.mjs`** | **36/36 exit 0** | **41/1 exit 1** |
| E | the retraction's QUOTATION deleted (control) | 35/1 exit 1 | **41/1 exit 1** |
| F | `ROOT-ANCHORED` removed from restatement 1 | — | **41/1 exit 1** |
| G | `THIS CLASS` removed from restatement 2 | — | **41/1 exit 1** |
| H | the benign differently-worded retraction reworded | — | **41/1 exit 1** |
| I | BOTH restatements reworded (the arm's control) | — | **41/1 exit 1** |

**EVERY RUN FAILED EXACTLY ONE BODY AND THE MESSAGE NAMED THE SITE** — an
offset for A–C, a file and offset for D, the control's own sentence for E
and I, a `file:line` for F and G. **RESTORATION PROVED PER PATH BY SHA256
AT THE DRILL'S OWN COMMIT: 18 of 18 OK, 0 mismatches.** The worktree was
verified clean and removed before this checkpoint.

Two findings worth carrying forward:

1. **A WIDENED MATCHER CAN DELETE ITS OWN CONTROL, AND ONLY A MUTANT
   SHOWS IT.** Mutants E and I are positive controls for the two arms —
   each removes the thing that makes its sweep non-vacuous, and each reds
   on its own sentence rather than on a neighbour's. A negative assertion
   with no live positive is indistinguishable from a green.
2. **SHAPE SIX ANSWERED WITH A SWEEP, NOT A GLANCE.** No other body
   asserts this. Two bodies read `docs-gate.mjs`'s source and neither
   looks at the universal; a sweep for the same DEFECT shape elsewhere —
   case-sensitive contiguous matchers over one file's prose — found only
   assertions on a program's printed OUTPUT, which is a contract rather
   than a comment. **The new body duplicates nothing.**

## Documents ticked — NONE, and that is DERIVED rather than assumed

- **ROADMAP and ARCHITECTURE need NOTHING.** `git grep` over both for
  `T-120`, `docs-input-gate` and `regression pin` returns **zero** hits.
  ARCHITECTURE mentions `docs-scan` exactly once, in a sentence about the
  DOCS GATE's implementation and its tree-derived reader set — **this
  merge changes neither**, only a regression pin in the spec beside them.
- **CONVENTIONS was NOT touched, deliberately.** It is T-052's fence
  tonight. `T-120-s1` proposes a correction to the pre-write exclusivity
  check that lives there, and it is ROUTED rather than applied — the one
  repair a lane may never make from the inside.
- **The card** is stamped `done`, `built_by: claude-opus-5 @T-120`,
  `review: self-verified`, with an `## Implementation notes` section
  carrying the criterion-by-criterion account, the nine-mutant drill
  table and the re-derived figures. `verified_by:` stays EMPTY: size S
  takes no verifier.
- **The lane's three suggestion files stay as filed.**

## What ACTUALLY reached the human's running app — NOTHING, AND FOR A NEW REASON

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface.

**THE WINDOW IS NOT SERVING FROM THIS CHECKOUT ANY MORE.** The holder is
`node` pid **88948**, started **2026-08-25 10:54:32**, and `ps` says it
is:

    node /Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite

**@human switched to the `nputer-app` worktree during this batch**, which
is detached at **`c4cfe52`** — the dispatch commit. That is why the
holder moved from pid 82549, which several earlier checkpoints recorded:
**a pid quoted anywhere is stale, and this is the second confirmation
tonight.**

**THE CONSEQUENCE IS BIGGER THAN THIS MERGE.** *Nothing* committed to
main after `c4cfe52` reaches the running window — not T-110's room
resolution at `ce8b8e7`, not this merge, and not the next three either.
Previous checkpoints could say "this merge did not reach the window
because neither restart trigger fired"; **that reasoning no longer
applies, because the window is not reading main at all.** A session that
asks "did my change reach the app?" by checking `app/src/**` triggers
will now get the right answer for the wrong reason, and will get a wrong
answer the moment @human switches back.

`target/debug/nputer` is pid **89201**, started **10:54:33** — one second
after the vite process, from the same switch. The graph gate built into
main's own `target/` twice during this integration and did not disturb
it.

**No process from this integration survives.** Scratch ports **15150**,
**15151** (lane and drill) and **15152** (this integration) were each
read with `lsof` FIRST (zero rows) and then bind-confirmed free on
`127.0.0.1`, `0.0.0.0`, `::1` and `::` before use, in that order and
never the reverse, and all were free again after. **No `pkill` at any
point.** **The untracked zero-byte file `z`** still sits there — not this
integrator's, not staged, left alone for the tenth checkpoint running.

## The board, derived from disk at this checkpoint

**199 flat task files — 81 done / 39 planned / 41 parked / 34 suggested /
0 verifying / 4 building; 26 in `rejected/`.**
81 + 39 + 41 + 34 + 0 + 4 = 199. T-120's stamp moves done from 80 to 81
and building from 5 to 4; its three suggestion files are the 197th, 198th
and 199th, written on the lane and counted after they landed.

**`verifying` IS ZERO AND TWO LANES ARE IN VERIFICATION.** The field is
not tracking the phase, which is the same lapse the lane table above
names from the other side. Worth a ruling rather than a third
observation.

**THE SUGGESTION BACKLOG IS THIRTY-FOUR AND THE LAST TRIAGE WAS THE
SEVENTH.** T-120 contributed three, and all three are about the METHOD
rather than about this card's code.

## Provenance — SELF-DECLARED, never read off a trailer

T-120 is **built and integrated by one `claude-opus-5` session**;
`built_by: claude-opus-5 @T-120`, `verified_by:` empty, `review:
self-verified`. **The `Co-Authored-By` trailer on this lane's commits is
a harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened the proof with a counterexample inside one session.
Nothing here reads a model off a commit signature.

**81 done cards — 59 `same-model`, 16 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 59 + 16 + 5 + 1 = 81. T-120 moves `self-verified` from
15 to 16.

## In progress / broken right now

**NOTHING IS BROKEN.** Four lanes are live: two in verification (T-110's
third and final pass, T-124's), two building (T-052, T-033).
`[tools/e2e]` was released by this checkpoint. `git branch` still lists
every lane this repo has ever run, which is the intended asymmetry: the
BRANCH is kept and only the WORKTREE is removed.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1889 SYMBOLS / 1849
EDGES at 895 891 bytes / 172 files**, and should **forecast the DELTA and
re-derive the endpoints**. The graph sits at **89.59% of
`max_graph_bytes`** (1 000 000) with **104 109** bytes of headroom, and
**nothing reports that number** — no gate, no test, no line of output.

## Next up

1. **`T-120-s3` IS THE ONE TO DISPATCH FIRST**, and it is one token of
   code. It is at the top of this file because it will otherwise cost
   each of the next several sessions an hour and teach one of them to
   re-run until green. Fence `[tools/e2e]`, **free as of this
   checkpoint**.
2. **`T-120-s1` — THE PRE-WRITE EXCLUSIVITY CHECK CANNOT DISCRIMINATE.**
   T-123-s10's rule says *"a dirty tree or populated index means another
   integrator is mid-ceremony and you wait."* At `ce8b8e7`
   `git status --short` in main showed **four `??` lines and not one was
   an integrator** — three misplaced lane worktrees and `z`. Under the
   rule as written every integrator tonight waits forever. **This
   integration used the replacement the finding derives** —
   `git diff --cached --name-only` plus `git diff --name-only`, both
   empty — which is what made the turn provably exclusive rather than
   judged. **And the staging hazard is not the one it was named as:**
   `git add -A --dry-run` stages **three GITLINKS** with a loud
   `warning: adding embedded git repository` each, because git does not
   recurse into a nested repository — not "thousands of files". Smaller
   in size, worse in kind: a broken submodule reference in a commit.
   Fence: `docs/CONVENTIONS.md` or `method/`.
3. **`T-120-s2` — 92 headless e2e bodies across 5 spec files still cost a
   scratch worktree three npm installs (330M), a parser build and a vite
   boot**, because `assertLanePreconditions` throws at config load. Every
   POISON DRILL on that spec family pays it, per lane. Fence
   `[tools/e2e]`.
4. **THE THREE MISPLACED LANE WORKTREES SHOULD BE RELOCATED** once T-052,
   T-120 and T-124 finish — T-120's is removed by this checkpoint, so two
   remain. `lane-protocol.md` rule 3 asks for a sibling directory, and
   the cost of the deviation is item 2 above.
5. **`verifying` IS AN UNUSED FIELD ON A BOARD WITH TWO LANES IN
   VERIFICATION.** Either the stamp moves when a lane enters
   verification, or the field goes. Two checkpoints have now noted it.
6. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
   (carried from T-079's checkpoint, undischarged).
7. **The GNU `xargs` column still closes at the first push**, and
   `git remote` still returns zero remotes.
8. **Outstanding: @human holds T-110's waiver** (a third rejection parks
   the card) **and @architect holds nothing new** — T-033's three rulings
   were delivered at `bb26a93` and overturned at `5e6fc8c`.
