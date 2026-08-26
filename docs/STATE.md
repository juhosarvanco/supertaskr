# State

Updated: 2026-08-26 by the T-138 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP. NOTHING IS BROKEN.
ONE COMMAND ON MAIN EXITS 1 ON PURPOSE. ONE CARD IS `status: building`
WITH NO LANE, AND THAT IS ALSO ON PURPOSE. TWO LANES ARE LIVE AFTER THIS
CHECKPOINT — `T-137` and `T-141`** — derived from `git worktree list
--porcelain` filtered on `refs/heads/task/`, never from this paragraph.
**`T-141` held a second worktree on its own branch for about
twenty-six minutes during this integration and no longer does**; the
section below keeps the mechanism and stamps the instance. This merge is **518 /
1013 / 290 / 194 green**. `cargo run -p nputer-index -- arch cycles
--root ../..` is **exit 1** on main and that is the DESIGNED state — the
declared cycle `C-08 -> C-09 -> C-08` survives because removing it needs
paths T-127's fence could not reach (`T-127-s1`). **The ENFORCING copy is
`cargo test`, which is green.** `arch drift` reports **five findings with
`unmapped=1`**; that D2 is `T-139`'s and **`T-141` is the live lane
closing it** — not this merge's and not repaired here.

## **THE BRIEF PREDICTED THIS MERGE'S SUITE WOULD RED AND IT WAS GREEN, AND THE REASON IS THE MOST USEFUL THING THIS CHECKPOINT LEARNED**

The integrator's brief said, in capitals, **EXPECT `193/194`** — a live
defect in `tools/e2e/tests/brief.spec.ts:706` that T-138's verifier hit,
proved against the base tree, and correctly refused to attribute.
**Measured on main at `2a922ce` BEFORE the merge, explicit port 15991:
194/194, exit 0, and that body GREEN. Measured again after the merge on
port 15992: 194/194, exit 0, green.**

**THE DIAGNOSIS IS RIGHT AND THE BLAST RADIUS WAS OVERSTATED BY EXACTLY
ONE CHECKOUT.** The body reads `git worktree list` — **machine-wide** —
and asserts the assembled brief names each lane's card, which it resolves
from **the local checkout's card index — per-checkout**. That is
`T-132-s6`'s shape one file over (*ports are machine-wide while rule 4
partitions by CHECKOUT*), and it is real: the moment a newer lane is
dispatched, **every older live lane's e2e suite reds**, in a way no lane
can fix from inside its own fence.

**BUT THE INTEGRATION CHECKOUT IS THE ONE CHECKOUT THAT CAN NEVER RED FOR
IT**, and the reason is structural rather than lucky: `status: building`
is written on the integration branch **before** the branch is cut
(`lane-protocol.md`, *Why the branch carries the dispatch stamp*), so
main is by construction the one tree where every dispatched card already
exists. `T-141`'s card is on main at `2a922ce`; it is absent at T-138's
lane base `00e133a` and at its tip `956919c`, which is exactly why the
verifier saw a red the integrator cannot reproduce. **A defect whose
trigger is "a checkout that lacks a card" cannot fire in the checkout
that defines the card set.** `T-138-s3` holds `[tools/e2e]` and is the
seat for the repair.

**AND THIS IS WHY A PREDICTED SUITE RESULT IS NOT A MEASUREMENT.** The
brief also asked whether a merge is safe while a standing pin reds for a
structural reason. **The question never arose here** — but the answer, if
it had, is that a pin whose red is proved identical at the merge's parent
is FILED, not blocked on, and the merge proceeds: `integrator.md` rule 3
is the same rule either way, and the parent test is the whole of it.

## **THE ARCHITECT CORRECTED THE LANE AND THE LANE WAS RIGHT — RE-DERIVED HERE, NOT TAKEN FROM THE VERDICT**

The brief claimed **165** `test(` call sites against the lane's **170**.
Measured at this merge in `tools/e2e/tests/`:

    ^test(                165
    ^[[:space:]]*test(    170     <- the lane's, and the right one
    of those, test("      163
    template literals       7
    spec files             23

**THE FIVE-LINE GAP IS EXACTLY THE FIVE INDENTED TEMPLATE-LITERAL SITES,
AND THEY ARE THE ONLY SITES THAT DECIDE THE QUESTION** —
`keyboard-activation:34`, `panel-real-keys:40`, `range-rule:91`,
`shell-frame:232`, `window-contract:442`, each directly inside a `for`
loop. The two template literals at column 0 (`boot-check-guard:242` and
`:259`) interpolate a constant into one test each. **A pattern anchored
at column 0 drops precisely the loop bodies**, so the simpler pattern
does not merely undercount — it hides the whole phenomenon.

## **AND `194` IS DERIVABLE FROM SOURCE, WHICH MATERIALLY CHEAPENS `T-138-s1`**

The card rules that *"a generator that reads the SOURCE tops out at 163
and is silently missing 31; one that reads the RUN gets all 194 and costs
a full suite pass per regeneration"*, and calls that the choice `T-138-s1`
has to make. **T-138's verifier derived all 194 from the source with no
run at all. Re-derived here, independently, by opening each loop:**

| source | count |
|---|---|
| `test("…")` literal sentences | 163 |
| `boot-check-guard.spec.ts:242`, `:259` — one test each | 2 |
| `keyboard-activation.spec.ts:34` over `["Enter","Space"]` | 2 |
| `panel-real-keys.spec.ts:40` over `["Enter","Space"]` | 2 |
| `range-rule.spec.ts:91` over `CHECK_IDS` | **20** |
| `shell-frame.spec.ts:232` over `VIEWPORTS` | 3 |
| `window-contract.spec.ts:442` over `[MINIMUM, DEFAULT]` | 2 |
| **total** | **194** |

`CHECK_IDS.length` was read by importing the module (**20**), `VIEWPORTS`
by reading its literal (**3**). **SO "GENERATED FROM SOURCE MISSES 31" IS
FALSE.** Source reaches 194 if the generator resolves five array
constants that live in the same 23 files it is already reading. The real
choice `T-138-s1` faces is not *source versus run*; it is **whether the
generator resolves a literal array, and what it prints when it cannot** —
which is a much smaller card than the one that was routed. **The
generator still owes the honest-omission shape either way**: what it
could not extract must be NAMED, because a generated document that
quietly omits is worse than prose that visibly goes stale.

## **THE TWO DEFECTS IN THE CARD'S OWN TEXT ARE FILED, NOT REPAIRED, AND THE RULE IS NAMED**

The verdict asked for both to be **fixed at checkpoint**. **They are
FILED**, as `T-138-s5`, and the rule that decides it is
`integrator.md` rule 3: *"ask whether the thing was true one commit ago.
Yes: repair it. No: file it. That is the whole rule, and it is answerable
with one command rather than with taste."*

- **`grep -c ROADMAP CLAUDE.md` returns 3, and the card's line 46 says 0.**
  At the merge's parent `2a922ce`: **3**. At the lane's base `00e133a`:
  **3**. At `6a6bc87^`: **0**. Already false at the parent → FILE.
- **The verification clause names `app/test/interview-chat-dom.test.tsx`
  as a reader of `CLAUDE.md`, claiming it was "derived, not assumed".**
  It is neither. Already false at the parent → FILE.

**THE TIMING IS SHARPER THAN EITHER THE BRIEF OR THE VERDICT SAID, AND IT
IS THE CARD'S OWN SUBJECT HAPPENING TO THE CARD.** Derived with `git
log -S` over the card's own file: it was **WRITTEN at `b3eaefe`
12:56:24**, when `grep -c ROADMAP CLAUDE.md` really did return 0 — **the
claim was TRUE**. `6a6bc87` moved both root adapters at **13:12:47**.
Dispatch was `00e133a` at **18:53:11**. **Sixteen minutes true, five
hours and forty-one minutes false before a lane was cut on it.** The card
exists to record that `ROADMAP.md` carried the sentence that would have
saved a working day and went unread *because prose is something somebody
has to keep true*; its own central table went stale inside sixteen
minutes. **That is a reason to leave it standing with a ref beside it,
not to erase it.**

**AND THE VERDICT'S OWN CORRECTION IS UNDERSTATED.** It corrects the
reader to `select-board.test.ts:1119`. That body reads
**`method/roles/orchestrator.md`** — a different file that happened to
sit in the same fence. Swept over `app/test`, `lib/parser/test` and
`tools/e2e/tests` with `command grep -rn`: the string `CLAUDE.md` appears
on **exactly one line in the whole test tree**, and it is
`"$KIT"/adapters/CLAUDE.md` inside a `REFUSED_COMPOUND` fixture at
`interview-chat-dom.test.tsx:720`. **NOTHING IN THIS REPOSITORY READS THE
REPOSITORY-ROOT `CLAUDE.md`.** `npm test` from `app/` was genuinely owed —
by the DOCS GATE's answer about the card's own file under `docs/tasks/` —
so a wrong derivation reached a right conclusion, which is the harder
defect to catch because nothing reds.

## **A SECOND WRITER REACHED INTO THIS LANE'S FENCE AND THE MERGE IS CLEAN BY ACCIDENT**

**`db4c903` — the architect's — edits `method/roles/orchestrator.md`,
which is inside `T-138`'s live `touches:`, while the lane held it.** It
is @human's own ruling (*"keep the reading list the same for now, just
add roadmap to orchestrator"*) and it is outside this merge's range. **No
damage, and the reason is not the rule working.** The lane had already
REVERTED its own edit to that file when the narrowing landed; had the
reverted step 2c stayed, this merge would have arrived at a hand-resolved
conflict in a file two writers held. `git merge-tree --write-tree` is
exit 0 and the forecast tree `c7c4619` **is** the merge's tree byte for
byte — **and it is exit 0 because one writer had withdrawn, not because
`lane-protocol.md` rule 5 stopped anybody.** Recorded, not routed: the
remedy is a dispatching-seat discipline and @human is already reasoning
about that seat.

## **`T-141`'s LANE HELD TWO WORKTREES ON ONE BRANCH FOR ABOUT TWENTY-SIX MINUTES, THE e2e SUITE DISCLOSED IT, AND IT WAS GONE BEFORE THIS FILE WAS COMMITTED**

**READ THE CLOCK ON EVERY LINE OF THIS SECTION. IT IS ALREADY HISTORY AND
IT IS KEPT BECAUSE THE MECHANISM IS THE FINDING, NOT THE INSTANCE.**

Derived from `git worktree list --porcelain` at **20:30:37** and again at
**20:49 EEST**: `refs/heads/task/T-141-lane` was checked out at
**`/Users/ujju/Projects/nputer-T-141` AND at a second path under
`/private/tmp/`**. Derived a third time at **20:54:42**: the second entry
is **GONE**, removed by its own owner, and `T-141`'s lane tip has moved
`5c74f3d -> f8d9efd` in the same window. `lane-protocol.md` rule 1 is
*"one task, one branch, one worktree"*, and rule 3 wants a scratch
checkout **detached** — `T-137`'s three scratch worktrees are detached and
are therefore correct; this one was on the branch.

**THE SUITE SAW IT.** `brief.spec.ts:706`'s disclosure line went from one
finding at the pre-merge baseline to **three** after it:

    fences are not disjoint: T-137 tools/e2e against T-133 tools/e2e — the same entry
    fences are not disjoint: T-141 docs/architecture/components/ against T-141 docs/architecture/components/ — the same entry
    fences are not disjoint: T-141 app-shell against T-141 app-shell — the same entry

**A card comparing its fence against ITSELF is the signature of one
branch appearing twice in the lane list.** It is a DISCLOSURE and not a
failure — the suite is 194/194 either side of it — **and it is not this
merge's**: it appeared between the baseline run at 20:22 and the merged
run at 20:28, and it was gone by 20:54. **Not this integrator's,
untouched, and named here because the next reader will otherwise take the
T-141-versus-T-141 rows for a bug in the fence module.** The
`T-137 × T-133` row is the standing one and is unchanged.

**AND THIS IS THE THIRD CONSECUTIVE CHECKPOINT TO PROVE THAT A FACT ABOUT
SOMEBODY ELSE'S WORKING TREE IS STALE THE MOMENT IT IS WRITTEN DOWN.**
T-139's checkpoint watched `arch-verify` change three times in ninety
minutes and declined to name a path that rotated inside ten. **This one
wrote a section, ran a suite, committed, and found the subject gone
twenty-four minutes later.** The remedy is not to re-derive faster; it is
to keep the MECHANISM and stamp the INSTANCE with its clock — which is
what this section now does, and why it was not simply deleted. **The
evidence is the disclosure line itself, quoted verbatim above**: no
command run today can reproduce it, and that is precisely the property
that makes a live-environment fact worth stamping rather than
re-deriving.

## THE LANE LIST, DERIVED AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane. **THERE IS NO TIP COLUMN AND THIS IS THE TWENTY-SEVENTH
MEASUREMENT SAYING SO.** Two commands answer it:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'
    node tools/e2e/scripts/brief.mjs --state

**AFTER THIS CHECKPOINT THERE ARE TWO LANES, `T-137` AND `T-141`, ACROSS
THREE WORKTREE ENTRIES. DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH;
DO NOT QUOTE THIS PARAGRAPH.**

- **`/Users/ujju/Projects/nputer-T-138` — REMOVED by this checkpoint**
  (rule 6, after the merge and after the checkpoint). `git worktree
  prune` ran behind it. **The branch is kept.**
- **`/Users/ujju/Projects/nputer-T-137`** on `task/T-137-lane`, cut at
  `00e133a`, holding `[lib-parser, app-map, tools/e2e]`. **NOT this
  integrator's and untouched.**
- **`/Users/ujju/Projects/nputer-T-141`** on `task/T-141-lane`, holding
  `[docs/architecture/components/, app-shell]`. **NOT this integrator's
  and untouched.** It **briefly held a SECOND worktree on the same
  branch** — read at 20:30:37 and 20:49, gone by 20:54:42; see the
  section above. **Its tip moved `5c74f3d -> f8d9efd` under this
  checkpoint**, which is what a live lane looks like.
- **THREE DETACHED SCRATCH CHECKOUTS OF `T-137`'s** under `/private/tmp/`
  (a base at `00e133a`, a main at `2a922ce`, a target at the lane tip).
  On no `task/` branch, so **not lanes**, correctly detached per rule 3.
  Not this integrator's, untouched. **Their paths measure 117, 117 and
  119 characters, which is INSIDE the 116–128 bracket `T-133-s5`
  measured** — at 116 that finding read 252 px against a 250 px floor, two
  pixels of margin. `T-141`'s second worktree is 119 too. Not re-measured
  here and not this integrator's to move; named because `T-133-s5` has
  never before had a live instance to point at.
- `/Users/ujju/Projects/nputer-app`, **detached at `6dc5757`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **IT DID NOT MOVE UNDER
  THIS INTEGRATION** and is now **9 commits behind main, 2 of them merge
  commits** (`git rev-list --first-parent --count 6dc5757..HEAD` and
  `--merges --count`). **A LAG IS A FUNCTION OF TWO REFS AND NEITHER IS
  REMEMBERED.**
- **`/Users/ujju/Projects/arch-verify`, detached at `ae92f67` — NOT THIS
  INTEGRATOR'S.** On no `task/` branch and named after no card, so **not
  a lane**. Read with `git -C … rev-parse` and nothing else, and left
  alone. **ITS REF MOVED AGAIN SINCE THE PREVIOUS CHECKPOINT**
  (`cb16289` → `ae92f67`). **Read it, never resume from it: a fact about
  somebody else's working tree is stale the moment it is written down.**

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 2a922ce 9818f03 -> tree c7c4619, exit 0 (read from $? FIRST)
    git diff --name-only 2a922ce..6036260   (THE MERGE'S DIFF)            ->   5   the only one that means anything
    git diff --name-only 2a922ce...6036260  (three dots AT the merge)     ->   5   collapses, as it must
    git diff --name-only 00e133a..9818f03   (merge-base..tip, FORBIDDEN)  ->   5   agrees HERE and that is luck
    git diff --name-only 2a922ce..9818f03   (two dots BEFORE the merge)   ->  58   <- the T-083 trap, at its largest yet
    git diff --name-only main..HEAD         (FORBIDDEN)                   ->   0   <- read this row twice

**THE FORECAST TREE IS THE MERGE'S TREE, ON EXIT 0** — `c7c4619` both
times, byte for byte. No conflict, no resolution; parents are `2a922ce`
and `9818f03` and nothing else.

**THE T-083 TRAP IS LIVE AND THIS IS THE LARGEST MAGNITUDE ON RECORD.**
The pre-merge two-dot form returns **58** here, against T-139's 18,
T-111's 47, T-134's 12, T-135's 28 and T-133's 39. Main advanced **53**
paths since this lane's base at `00e133a` and 5 + 53 = 58 exactly. **A
five-path docs-only lane reads as having rewritten the indexer crate, the
graph, ARCHITECTURE, ROADMAP, STATE and fifty task files.** That is the
same lie the rule exists to prevent, at more than eleven times the size
of the truth.

**AND THE FORBIDDEN merge-base FORM AGREES AT 5, WHICH IS LUCK AND NOT
LICENCE**: `00e133a` happens to be an ancestor of `9818f03`. **That is
the FOURTH consecutive merge where it agrees** — the dangerous datum,
because a form that agrees four times teaches the wrong lesson four
times. The `T-093` seat's edit list gains a fifth entry for it.

**DISJOINTNESS PROVED AS TWO NAMED SETS.** The merge's 5 sorted paths
against main's 53-path advance (`00e133a..2a922ce`): `comm -12` is
**EMPTY**, and `diff` over the prescribed and three-dot lists is **exit
0** — identical sets, not merely equal counts. **The two live lanes touch
none of the merge's 5 paths**; both were derived from `git worktree list
--porcelain`, not assumed.

**BOTH DIFF CHECKS WERE EMPTY IMMEDIATELY BEFORE THE MERGE**, read beside
`git rev-parse main` in the same command. One `??` row; **`??` alone is
not a ceremony.** **MAIN DID NOT MOVE UNDER THIS INTEGRATION** — a first
in several checkpoints, and it is a measurement, not a habit: `main` read
`2a922ce` at the range derivation and `2a922ce` at the merge.

## THREE standing gates — ONE FIRES, all derived from the merge's own 5 paths

| gate | trigger | on these 5 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — DOES NOT FIRE** | **ASKED ANYWAY, TWICE: CURRENT both times** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — DOES NOT FIRE** | not run, and not owed |
| DOCS GATE | a `docs/` path a code suite reads | **5 of 5**, then **4 of 4** | exit **1** both times, **THREE** suites |

- **GRAPH REGEN — NOT OWED AND ASKED ANYWAY, WHICH IS THE POINT.** `index
  --check --root ../..` from `app/src-tauri/` is **exit 0, CURRENT**:
  **997 202 bytes · 185 files · 2124 symbols · 2039 edges**, budget
  **997 202 of 1 040 000 (95.9%), 42 798 left**. Asked a second time
  after every doc write in this checkpoint: **CURRENT again.** This merge
  and this checkpoint write only markdown under `docs/`, and the indexer
  walks code extensions, so the graph cannot move — **but the standing
  instruction is ASK, NEVER PREDICT, and the trap has fired with bytes,
  files, symbols AND edges all matching across three distinct graphs at
  997 202.** A byte count is not a content check; neither is the whole
  summary line.
- **BOOT GATE — NOT RUN, and that is a derivation rather than an
  omission**: zero of the merge's five paths and zero of the checkpoint's
  four are under `app/src-tauri/**`, `app/src/**`, `app/package.json` or
  `app/src-tauri/Cargo.toml`. No `tauri dev` was spawned, so no port was
  taken for it.
- **DOCS GATE — exit 1 twice, THREE suites both times.** On the merge's
  own 5 paths it fires on **5** and derives **18 readers across 4
  suites**, naming `npm test from app/`, `npm test from tools/e2e/` and
  `npx vitest run from lib/parser/` to run. **`cargo test from
  app/src-tauri/` appears in the reader list and NOT in the run list**,
  which is the gate answering correctly: its cargo readers are
  `docs/architecture/components`, `docs/CONVENTIONS.md`,
  `docs/architecture/graph.json` and one capture file, and none of this
  merge's paths is one. Census **137 docs-shaped sites in 25 files**, **0
  frontmatter issues**, **6 root-anchored all argued, 0 unlinked**, 2
  package-relative sites both resolving into `docs/`. Invoked DIRECTLY
  from the repository root, never through `xargs`, exit read from `$?`
  unpiped. **`npm run lint:docs` — the gate's NAMED form — is exit 0.**

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 518 passed / 0 failed / 4 ignored, exit 0**, SUMMED over
  **EIGHTEEN** `test result:` lines; **18 `running N tests` headers sum to
  522 = 518 + 4 ignored**, which reconciles exactly. **Identical to main's
  own figure at `00e133a`+T-139**, as it must be — this merge changes no
  Rust and `cargo test` was not owed by the DOCS GATE. Run anyway, per
  `integrator.md` rule 2. The lib suite is **5.75s**, inside the healthy
  band.
- **app: `npm run build` exit 0 · `npm test` 1013/1013 across 47 files,
  exit 0.** Re-run after the checkpoint's own doc writes; see the
  typecheck note below for why `npm run build` has to be the LAST command
  and not an earlier one.
- **parser: 290/290 across 13 files, exit 0**, after `npm run build` from
  `lib/parser/`, which was run FIRST regardless. `npx tsc --noEmit` exit 0.
  **Unchanged** — this merge touches no parser file.
- **E2E: 194/194, exit 0, FIVE TIMES** — on main at `2a922ce` BEFORE the
  merge (port **15991**, 2.1m), at the merge (port **15992**, 2.2m), on
  the checkpoint's own tree (port **15993**, 2.5m), after the
  `method/`-freedom correction (port **15994**, 2.2m), and after this
  file's last write (port **15995**). `lsof` read **zero rows**
  immediately before each bind, at **20:22:25**, **20:28:10**,
  **20:44:47**, **20:50:52** and the fifth reading in this checkpoint's
  commit message. Header `Running 194 tests using 1 worker` cross-checked
  against **194** `✓` bodies and 0 failures on every run. **THE PRE-MERGE BASELINE IS THE MEASUREMENT THAT MATTERS HERE**,
  because it is what turns "the brief predicted a red" into a fact about
  which checkout reds.
- **ALL FOUR WATCHED CARGO BODIES WERE READ BY NAME**, not inferred from a
  green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id_in_the_init_line…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`, and T-135's live pin
  `a_mod_declaration_is_an_edge_in_this_repositorys_own_graph` `ok`.
  **`self_graph_is_current` is `#[ignore]`d and read as such** —
  `index --check` is the only signal for the committed graph.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY**: `arch cycles
  --root ../..` exit **1** read from `$?` **UNPIPED**, `cycle C-08 ->
  C-09 -> C-08`, `components=13 declared_edges=35`, report on **stderr**
  at **645 bytes** with stdout **0 bytes**. **`arch cycles > out.txt` on
  a red yields an EMPTY FILE.** Untouched by this merge, which changes no
  registry file.
- **`arch drift` exit 0**: findings=**5**, undeclared=2, unmapped=**1**,
  declared_only=2 — `D1:C-05->C-15`, `D1:C-10->C-14`, `D2:unmapped`
  (`app/src-tauri/tests/graph_budget_bench.rs`), `D3:C-01`, `D3:C-11`.
  **The D2 is T-139's, `T-141` is the live lane closing it, and it is not
  touched here.** `arch` reports `files=185 mapped=184 unmapped=1
  edges=39 findings=5 drift_components=5`.
- **`npm run lint:docs` exit 0** and **`npm run lint:tokens` exit 0** at
  **TOKEN 139 / CONTROL 769** — **AND BOTH LIVE IN
  `tools/e2e/package.json`**. Run from the repository root they exit
  **254** with `npm error enoent`, because **there is no root
  `package.json` at all**, and that reads exactly like a failing lint.
  **DERIVE THE CONTROL FIGURE AT YOUR OWN REF, AND NOTE THAT IT MOVED
  UNDER THIS CHECKPOINT'S OWN COMMIT**: `git ls-files` read **787**
  before the commit and 787 − 18 NUL-bearing = **769** — but `T-138-s5`
  was still UNTRACKED at that moment. **Predicted 770 for the committed
  tree and measured 770 after the commit**, which is the positive control
  on the whole derivation. It read 775 at the verifier's ref
  and 764 at the previous checkpoint's. **A count derived from
  `git ls-files` in a dirty tree is a count of the tree you had, not the
  tree you are about to commit**, and that is the whole trap.
- **NUL SWEEP, WITH ITS POSITIVE CONTROL FIRED.** Exactly **18** tracked
  files carry a NUL and **all 18 are icons and fonts** (14 `.png`, 1
  `.icns`, 1 `.ico`, 2 `.woff2`); **ZERO are source-shaped**, and the
  merge's own 5 paths are clean. Run with `perl -0777 …
  index($_,"\0")`, because **a shell cannot pass a NUL to `grep`** and
  this session's `grep` is a `ugrep` shim carrying `-I`, which skips
  binary files — so a sweep over a NUL-bearing file returns "no matches"
  with no error (`T-111-s9`). Use `command grep` when it matters; every
  sweep here did.
- **`npm run typecheck` from `tools/e2e` exit 0 and from `lib/parser` exit
  0; from `app/` it DOES NOT EXIST.** Unchanged and re-stated because its
  absence reads exactly like a type error — see below.
- **THE SUITES THIS FILE'S OWN LAST WRITE OWES ARE DECLARED IN THIS
  CHECKPOINT'S COMMIT MESSAGE**, which is where the regress terminates — a
  commit message is not a code input.
- **RUN LEDGER — every run declared, including the ones that agree.**
  parser build **three times**, parser suite **four times**, `tsc
  --noEmit` **once**; app build **five times**, `npm test` **four
  times**; cargo **once**; `tools/e2e` **FIVE times**, 194/194 all five,
  on explicit ports **15991** (2.1m, pre-merge baseline), **15992**
  (2.2m, at the merge), **15993** (2.5m, at the checkpoint), **15994**
  (2.2m, after the `method/` correction) and **15995** (after the last
  write); boot check **NOT RUN and not owed**;
  DOCS GATE **twice** (the merge's 5, the checkpoint's 4) plus
  `--census` through `lint:docs` **three times**; `index --check` **TWO
  asks**, **zero writes**, both from
  `app/src-tauri/`; `arch` **once**, `arch drift` **once**, `arch
  cycles` **once**; the flip census and the fence release **once each**
  through the merged `fence.ts`; the 163/170/194 arithmetic re-derived
  **once**, by opening every loop rather than by trusting the verdict.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS TWENTY-TWO CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s; main's own
8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test binary. **A
tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under 9.5s,
every red over 14.6s, **a gap of more than five seconds with nothing in
it**. `du -sh app/src-tauri/target` reads **4.1 GB** here and the lib
suite is **5.75s**. **THIRTY-THREE runs across twenty-one integrations
and not one lands between 9.5s and 14.6s.** Read the lib suite's own time
first; it tells you which regime you are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. Lanes may be building against this repository:
`lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
was declared settled at better than 400-to-1 on 15 clean-cache runs.
**T-086's lane refuted that within the hour**: 1 red in 4 full `cargo
test` runs in a FRESH lane worktree, with `docs_watch` GREEN and the lib
suite inside the healthy band. Run alone: **5 green in 5**. **THE
SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 22**.
It did NOT fire in this merge's cargo run — read by NAME, `ok`.
`T-086-s1` and `T-102-s3`; fence `[app-agent]`, **FREE**.

## THE MTIME INTERMITTENT — FIFTEEN CONSECUTIVE GREENS ON FIXED CODE, AND `T-111-s9` IS WHY THAT SENTENCE IS NOT ENOUGH

**`T-120-s3`'s CARD IS GONE FROM THE BOARD — folded away by `1d66a50` —
AND THE FINDING IS NOT.** It is preserved here and inside `T-111-s9`'s
body, which cites it. `T-120-s3`'s fractional-millisecond mtime signature
(`token-scan.spec.ts`, `Expected …492.7957` against `Received …493`) was
fixed on main at **`cea839e`** (T-130). The nine-run tally on code that
**cannot** carry that fix was **3 red in 9 — near one in three**. **A red
before `cea839e` is not news; a red at or after it is.** This merge ran
e2e five times, 194/194 every time, and it fired in none — **fifteen
consecutive clean runs on fixed code.**

**AND `T-111-s9` IS THE REASON A GREEN TALLY HERE IS WORTH LESS THAN IT
LOOKS.** The body this prediction names (`token-scan.spec.ts:227`) can red
for a completely different reason — any unrelated control character
anywhere in the tracked corpus — **with a title that says nothing about
it and a remedy ("run it again") that is the same for both.** **Read the
assertion, not the body's name.**

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** `lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT. The
app resolves `@nputer/parser` through a symlink, so it compiles against
PRE-merge types and fails with e.g. `TS2339` while `vitest` transpiles
without typechecking. **One command clears it**: `npm run build` from
`lib/parser/`. **THE TRIGGER IS NOT A FRESH TREE, IT IS A MERGE THAT
CHANGES THE PARSER'S TYPES** — CONVENTIONS files the parser-before-app
ORDER under *fresh clone*, so a fully-installed main checkout reads as
exempt and is not. **THIS MERGE DOES NOT FIRE IT — `lib/parser/**` is a
0-file diff — and the build was run first anyway, in that order, and every
exit was 0.**

**AND THE SEPARATE UNBUILT-APP CLASS IS THE ONE THAT ARRIVES LOOKING LIKE
A DEFECT**: on an unbuilt tree `npm test` from `app/` returns failures
about an absent `app/dist/assets` rather than about the tree. **Both
CONVENTIONS bullets that state it carry a stale denominator, and the file
NAMES ITS OWN CONTRADICTION**: `:856` says *"12 of 840 across five
files"*, `:1328` says *"14 failures across 6 files … 924/924"*, `:1327`
says *"SIX files since T-013 … where the LANE PROTOCOL bullet below still
says five"*, and the suite is now **1013**. **It was exactly as false at
this merge's parent**, so ruling thirteen returns **FILE**, and the seat
is `T-092`/`T-093`.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

`npm run typecheck` from `app/` exits **1** with `Missing script`. **The
app's typecheck is the TWO `tsc` calls inside `npm run build`** — `tsc &&
tsc -p tsconfig.test.json && vite build` — and the second is load-bearing:
without it nothing in the repository typechecks the app's test files
(T-073). `lib/parser` and `tools/e2e` DO have a `typecheck` script; `app/`
is the exception, and that asymmetry is the whole trap.

## THE LANE PORT IS MACHINE-WIDE AND RULE 4 PARTITIONS BY CHECKOUT

**`T-132-s6`, unchanged — and this checkpoint found its SHAPE in a second
place, which is the news.** `resolveLanePort()`'s default **14520** is a
CONSTANT shared by every checkout on the machine, so rule 4's
checkout-granular partition does not reach it. **The remedy in practice:
pass an explicit port and re-probe immediately before binding.** This
integration used **15991**, **15992**, **15993**, **15994** and
**15995**, each `lsof`-read at zero rows immediately before binding, with
the clock on every reading. **No
collision, and a probe reserves nothing — the runner's own bind is what
proves the port was free.** `resolveLanePort()` THROWS on 1420 by
construction, and `NPUTER_BOOT_PORT=1420` REFUSES at exit 3 before
anything is probed or spawned.

**AND `brief.spec.ts:706` IS THE SAME SHAPE ONE FILE OVER** — a
machine-wide worktree list joined to a per-checkout card index. `T-132-s6`
has been read for several checkpoints as a fact about PORTS; it is a fact
about **any check that joins machine-wide state to checkout-local state**,
and the port was only the first instance anyone measured. `T-138-s3`
carries the second.

## `T-133-s5` — CUT YOUR SCRATCH SHORT

A UI spec (`shell-frame.spec.ts:263`) reds in a drill worktree cut at a
**128-character** root and is green at 33, because the shell renders the
project path and the chrome wraps. **The threshold is bracketed between
116 and 128 characters** — at 116 it measures 252 px against a 250 px
floor at 800×600, TWO PIXELS of margin. **Cut drill and scratch worktrees
at SHORT roots.** This integrator cut none. **FOUR live scratch
checkouts sit at 117–119 characters today — inside the bracket** — and are
named, not re-measured, in the lane list.

## The board, derived from disk at this checkpoint

**287 flat task files — 102 done / 34 planned / 51 parked / 97 suggested
/ 0 verifying / 3 building; 28 in `rejected/`.**
102 + 34 + 51 + 97 + 0 + 3 = 287. **`done` MOVES to 102 and T-138 is the
only card this merge stamps.** `verifying` goes 1 → **0**. The three
`building` are `T-135` (no lane, open on purpose), `T-137` and `T-141`
(both live lanes).

**ONLY TWO OF THE FOUR BOARD MOVEMENTS ARE THIS MERGE'S.** 281 → **287**:
main added `T-141`'s card at `2a922ce` (outside this merge's range), this
merge adds **four** (`T-138-s1` … `s4`), and this checkpoint adds **one**
(`T-138-s5`). 281 + 1 + 4 + 1 = 287. `suggested` 92 → **97**; `parked`
holds at **51**; `planned` holds at **34**; `rejected/` holds at **28**
and this merge sends nothing there. **Derive it at your own ref and stamp
the reading.**

**THE FENCE RELEASE, DERIVED THROUGH THE MERGED `fence.ts` AND NOT
ASSUMED.** `T-138`'s fence `[CLAUDE.md, method/roles/orchestrator.md,
method/roles/executor.md]` expands to exactly those three paths —
`excluded []`, `unusable []`, `issues 0`. It overlaps **three** open
cards and **all three are FREED**, because no live lane holds them:

    T-105   T-128   T-131

**THIS IS A SMALL RELEASE AND THAT IS WORTH SAYING** — T-139's was
seventeen. A fence of three files releases three cards; a fence of two
components released seventeen. **And "freed" answers one question only**:
all three are still `overlapping` with `T-135` on
`method/tasks/TASK-FORMAT.md`, and `T-135` is `building` with no lane.

**AND THIS INTEGRATOR GOT THAT WRONG ONCE, IN THIS FILE, AND CAUGHT IT BY
ASKING `fence.ts` INSTEAD OF REASONING.** The first draft of *Next up*
items 15 and 17 said *"`method/` is FREE today"*, on the reasoning that
T-138's stamp released the two role files and no live lane names
`method/`. **Measured: `method/` is `overlapping` with `T-135` and the
two role files are `disjoint` from every `building` card.** Containment
is overlap (`lane-protocol.md` rule 5), so the directory and the files
inside it are different fences with different answers. **This checkpoint's
commit was AMENDED once to carry the correction**, before anything was
built on top of it — the same disposition T-139's checkpoint took with a
merge message that named the wrong parent. **The lesson is the one the
rule already states and this file just proved again: ask the module, and
never compare tokens.**

**THE FLIP CENSUS, RE-DERIVED HERE THROUGH THE MERGED `fence.ts`** — open
set = `status` in {planned, building, verifying} carrying a non-empty
`touches:`:

    before the stamp   38 cards   703 pairs   27 flips   0 reverse   0 unusable
    after  the stamp   37 cards   666 pairs   24 flips   0 reverse   0 unusable

**`T-138` SAT IN EXACTLY THREE FLIP PAIRS** — `T-105 × T-138`,
`T-128 × T-138`, `T-131 × T-138`, every one on the witnesses
`method/roles/executor.md` and `method/roles/orchestrator.md` — **and all
three leave with the stamp. Derive the PAIRS, never the count.** Of the
24 that remain, **21** are `T-112` pairs on `app/src/assets` and
`app/src/styles` (up from 20, because `T-141` carries `app-shell`), and
the other **three** are `method/` containment: `T-105`, `T-128` and
`T-131` against `T-135` on `method/tasks/TASK-FORMAT.md`.

**THE DANGLING-BLOCKER PIN, RE-DERIVED THROUGH THE PARSER AT THIS MERGE:**

    blocked_by entries        52
    blocker is `done`         50
    blocker still open         2     T-067 and T-068, both on T-065
    blocker names NO card      0     <- the pin
    planned, ALL landed        6     T-015, T-059, T-065, T-112, T-131, T-140

**ZERO DANGLING.** **NOTHING ON THE BOARD IS `blocked_by: [T-138]`**, so
this stamp moves the blocker graph not at all — it moves the FENCE graph,
and those are two different questions. The parser's field is
**`blockedBy`**, not `blocked_by`: a census written against the
frontmatter spelling returns **0 entries** and looks like a clean pin.
**That trap cost this integrator one wrong reading and is written down so
it costs the next one none.**

## Provenance — SELF-DECLARED, never read off a trailer

**102 done cards — 77 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 77 + 19 + 5 + 1 = 102. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented**, and this merge adds the 77th
`same-model`. **`same-model` is not a weaker verdict than `independent`**
(TASK-FORMAT's own paragraph); it records WHICH HAND HELD THE PEN, and the
one value naming a MISSING guarantee is `self-verified`.

**AND THE OBVIOUS DERIVATION OVERCOUNTS BY ONE.** `grep -h "^review:"`
across every done card returns **102 rows for 101 cards** at the previous
ref, because `T-004-story-map-board.md:358` carries a BODY line beginning
`review:")`. **Read the FRONTMATTER block, not the file** — an `awk`
guard on the first `---` fence gives the right census and a whole-file
grep does not.

## Documents ticked

- **STATE — rewritten, as a snapshot.** `T-133-s2`'s edit (dropping the
  four sections `brief.mjs --state` can answer) was **NOT performed**:
  `docs/STATE.md` is free, but that edit is a card of its own and taking
  it inside a checkpoint would bundle a routed change with a merge.
- **The card** is stamped **`done`** with `verifier:`, `built_by:`,
  `verified_by:` and `review: same-model` filled, and gains an
  `## Integration` section. **The lane's notes, the four s-notes and the
  verdict are preserved byte-untouched** — including the two stale
  sentences, which are FILED as `T-138-s5` and deliberately not edited.
- **ROADMAP — TICKED, AND THE F-04 PROGRESS LINE DOES NOT MOVE**: it holds
  at **5 of 8** for the second consecutive merge, for the oldest reason in
  that ledger — T-138 is **F-01**, inherited backlog rather than F-04
  slice content. **This is the TENTH ask and the EIGHTH time that exact
  reason applies.** The milestone-4 census moves **99 → 100** (F-06 26 →
  **27**) and **the mover is `T-141`'s own card file**, created on main at
  `2a922ce`, outside this merge's range; **`T-138` does not move it**,
  because it is F-01 `milestone: 4` and was already inside the count.
  **The F-01 backbone bullet gains the read-first set as a measured
  object** — the three spellings, the 319× adapter-to-set ratio, and the
  163/170/194 arithmetic with the correction that 194 IS derivable from
  source.
- **ARCHITECTURE — NOT TOUCHED, and that is derived rather than skipped.**
  Rule 3's trigger is *"if any interface moved"*. This merge's five paths
  are markdown under `docs/tasks/`, which no component's `paths:` claims;
  no interface, no component row, no declared edge and no `paths:` entry
  moves. **The C-01 row's `built (v0.1.6)` stamp is correct and unmoved**:
  this diff touches nothing under `method/`, so
  `METHOD_SNAPSHOT_VERSION` stays at `0.1.6` and
  `snapshot_version_matches_the_live_method_stamps` is `ok`.
- **CONVENTIONS — NOT TOUCHED.** Its two stale unbuilt-app denominators
  are FILED and not repaired, and `arch blast` still joins `arch cycles`
  in the queue at `T-127-s5`.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The one decision this card takes — **`CLAUDE.md`
  stays unowned; its governance is its fence, not a component row** — is
  written where it belongs, in the card's own notes, with the measurement
  that makes it a decision rather than a default (**85% of the tracked
  tree is in no component**). **ADR-018 IS STILL OWED AND IS STILL T-135
  HALF B's.**
- **`graph.json` NOT REGENERATED and NOT COMMITTED — asked twice, CURRENT
  both times.** This is the first checkpoint in several where that is the
  right answer, and it is the right answer because the diff is markdown
  all the way down.

## What ACTUALLY reached the human's running app

**NOTHING THROUGH THE DEPENDENCY CHANNEL, AND THE CHECKOUT CLOSES IT
AGAIN.** All five of this merge's paths and all four of this checkpoint's
are under `docs/`. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE ANSWER
TO THE DEPENDENCY QUESTION** (integrator.md rule 2), so it was answered
from the build order instead: **this integration DID rebuild
`lib/parser/dist` and DID write `app/dist` (three times), and both land
in `/Users/ujju/Projects/nputer`.** The vite serving 1420 has
`/Users/ujju/Projects/nputer-app/app` as its cwd — **@human's own
checkout** — and `app/node_modules/@nputer/parser` there is a **RELATIVE**
symlink (`../../../lib/parser`), so each resolves inside its own checkout
with its own `lib/parser/dist`. **The running product reads none of what
this integration wrote.**

**WHAT I CANNOT CLOSE, STATED RATHER THAN ASSUMED AWAY.** The app hosts a
docs WATCHER, and which project folder @human has open in it is not a
fact of any tree — it is a runtime choice. **If that folder is
`/Users/ujju/Projects/nputer`, this checkpoint's five new and rewritten
task/doc files reached the running board through the watcher**, and the
board pane would re-render with T-138 moved to `done` and five new cards.
**The map pane would NOT re-render for the graph**, because no graph was
written. That is an INTERRUPTION channel (a re-render), never a breakage
one, and no integrator can read which folder is open without touching the
app.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **19746**, `TCP
[::1]:1420 (LISTEN)`, read at **20:21:45 EEST** (before any command that
writes) and again after the suites, the gates and the doc writes; **the
second reading is in this checkpoint's commit message.** The anchored
process read — `ps -o pid,lstart,command -p 19746` — reports `node
/Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`, started **Wed
Aug 26 17:44:45 2026**, and `lsof -a -p 19746 -d cwd` reports cwd
`/Users/ujju/Projects/nputer-app/app`. **THIS IS THE SAME PID THE
PREVIOUS CHECKPOINT RECORDED**, which is the first time in three
checkpoints that has been true — and it is still a live-environment fact
rather than a function of a tree, so it is **already stale for you**.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: `app/node_modules`, `lib/parser/node_modules`,
`tools/e2e/node_modules`, both `dist/` directories and `target/` were all
present, so **no fresh dependency install was owed and no `npm ci` was
run**. **AND THE ONE-STEP REPAIR ITEM 15 KEEPS ASKING FOR WAS PERFORMED
BY HAND FOR THE TWENTIETH CONSECUTIVE INTEGRATION**: `lsof -a -p <holder
pid> -d cwd` puts 1420's holder in a DIFFERENT checkout, so even an owed
install could not have reached it. **There is no root `node_modules` and
there is no root `package.json`.**

**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **thirty-second** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting. No `git add -A` — every write used `git commit -- <paths>` with
the paths listed explicitly.** This integration's **one** `cargo test` run
and its **five** `nputer-index` invocations — two `index --check`, one
`arch`, one `arch drift`, one `arch cycles` — all WROTE to main's
`app/src-tauri/target/`, which reads **4.1 GB**, as any cargo run must.
**No sibling worktree was modified except T-138's own, and only by
removing it**; every other was read with `git worktree list --porcelain`,
`git -C … rev-parse` and `lsof` only. **All scratch work for this
integration lives outside the repository, and no worktree was cut at
all.**

## In progress / broken right now

**`T-145` IS MERGED. THE MERGE BLOCK WAS REAL AND @human CLEARED IT BY
RUNNING THE MERGE THEMSELVES.**

`git merge` into main was refused by the permission classifier — it
denied `T-145`'s executor, then denied the architect at the same command,
while ordinary commits to main kept landing all evening. **No workaround
was attempted and none should be**; `commit-tree`/`update-ref` would
bypass the intent and `update-ref` is prohibited here. The executor's own
sentence for why it stopped is the one to keep: **a coordinator's
authorization is not the permission system's consent.**

**Merge `6a96f51`**, parents `ecdc942` and `ad24361` only, `--no-ff`.
Range `ecdc942..6a96f51` = **6 paths**: `method/adapters/CLAUDE.md`,
`method/adapters/AGENTS.md`, and four `T-145*` cards. Nothing outside the
fence. Both templates verified identical below line 1; the read-first
sentence now names `docs/ROADMAP.md`.

**Suites in the integration checkout at the merge**, exits read unpiped:
parser **290/290** + `tsc` 0 · app build 0 + **1013/1013** · e2e
**194/194** (port 14979, `lsof`-probed free; Playwright, so its summary
line is `194 passed`, NOT a vitest `Tests` line — a grep for `Tests`
returns nothing and looks like a clean run, `T-142`'s exact shape) ·
cargo **518/0/4** over 18 result lines · `lint:docs` 0 · `lint:tokens` 0
(TOKEN 139 / CONTROL 779) · e2e typecheck 0.

**GRAPH REGEN asked, never predicted: CURRENT**, `997202 of 1040000
bytes (95.9%)`, 185 files, 2124 symbols, 2039 edges — not owed, 0 of 6
paths. **Cargo WAS owed** even though the range holds no `.rs`, because
`agent::kit::tests::every_compiled_entry_matches_its_method_file_byte_for_byte`
compares kit entries against their method files byte for byte; it passed.

**`T-150` IS MERGED AND A CARD CAN NOW ASK FOR ITS FIGURES.** Merge
`1ab0587`, 10 paths. `brief.mjs --card <T-NNN>` derives the six figure
classes this board actually carries and then RE-RUNS every provenance a
card already claims; `--audit <path>` reaches a brief file. Board figures
in this checkpoint were derived with it, not typed.

**THE LINT WAS REFUTED BY THE CORPUS, AND THE REFUTATION REPRODUCED.**
**75,785** digit runs across card prose — exact at the base — against
**63** census claims in 31 of 313 cards. **The largest figure class
carries no digit at all**: word cardinals, independently measured at
about **16.5k** against **9,060** for the largest digit class. T-141's
rejected figure is the word "second". **And T-141's sentence is followed
immediately by a command and a ref, so an adjacency lint PASSES it** —
the marker was present, honest, and did not bind. That is the card's own
caution occurring naturally in the example it was built from.

**THE MISS IS DECLARED AND CONFIRMED NOT LARGER.** `--card T-137`
returns nothing at all: an inverted premise is not a figure. The fix
prevents that failure rather than detecting it.

**MAIN'S GRAPH WAS STALE AND BOTH LANES CAUGHT IT INDEPENDENTLY.** The
`T-137` checkpoint regenerated the graph and THEN edited two dogfood
files to reconcile counts — 17 and 4 lines of provenance comment — and
never re-asked. **Every published figure matched on both sides** (1020023
bytes, 189 files, 2152 symbols, 2111 edges) while the tree was stale.
Repaired at `d85d946`. **"Re-ask after every write" is the architect's
own sentence, broken at the one seat whose job is leaving the docs true.**

**THE GRAPH BUDGET IS AT 98.1%** — 1020023 of 1040000, **19977 bytes
left**. `T-140` is the card and it is no longer theoretical.

**`T-149` IS MERGED. `app/test/**` IS NO LONGER THE SHELL'S CATCH-ALL.**
Merge `921d121`, 14 paths. Each of the 49 indexed test files is claimed by
an exact path in the component whose code it exercises — **subject
derived from IMPORT EDGES, not filenames**, which is why the card's
keyword sweep was wrong in four places and two files invert their own
names.

    C-05 64->31   C-08 10->12   C-09 3->6   C-10 3->7
    C-12 18->34   C-13 8->15    C-14 8->9

**37 edge rows before, 37 after, row-set diff EMPTY**, and `arch drift`
still `findings=4 unmapped=0 ambiguous=0`. The verifier rebuilt the
registry parser, glob matcher and edge derivation from scratch and
confirmed they reproduce `arch` at both refs before trusting anything.

**A PRE-EXISTING FALSE GREEN FELL OUT OF IT — `T-149-s4`.** A glob whose
star sits inside a filename (`app/test/map-*`) normalises to a domain
matching no path, so **two genuinely colliding fences answer `disjoint`**,
with no issue raised and not even `unusable`, while `arch drift` calls the
same file `ambiguous`. **Zero live triggers today**: all 97 registry
`paths:` entries are clean. It is the same reason the negated catch-all
was rejected — `normalizeFenceToken` does not interpret a leading `!`.

**THE BOARD HAS NOT MOVED YET AND THE CARD SAYS SO.** *"20 of 34 planned
cards touch app-shell"* is a census over a STRING in `touches:`; no
registry edit moves a token an author already typed, and `docs/tasks` is
in `UNFENCEABLE_PATHS` so no card may hold those files. The verifier
ruled the card **correctly scoped rather than under-delivered**. What
moved: `app-shell` reserves **20 of 49** app/test files where it reserved
49. **The throughput gain waits on `T-149-s2`**, which carries the twenty
ids.

**CUTTING A NEW LANE REDS EVERY OLDER LIVE LANE, AND THE ARCHITECT DID
IT TONIGHT.** `tools/e2e/tests/brief.spec.ts:706` on main iterates the
LIVE LANE LIST and asserts each lane's card is present *in the checkout
under test*. Cutting `T-145`'s lane at 22:14 therefore turned `T-141`'s
verification red at **193/194** — its tree predates that card and always
will. **This is `T-137-s9`'s class and the fix is sitting unmerged in
`T-137`'s lane**, which partitions resolvable from unresolvable lanes.
Until that merges: expect one inherited red per older lane, **verify it
is this one before diagnosing anything**, and prefer not to cut a new
lane while a verification is in flight.


**NOTHING IS BROKEN. THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED. THE ONE
`building` CARD WITHOUT A LANE IS OPEN ON PURPOSE. THE D2 IS THE MAP
REPORTING A REAL GAP AND `T-141` IS THE LANE CLOSING IT.**

**TWO LANES HOLD FENCES**: `T-137` holds `[lib-parser, app-map,
tools/e2e]` and `T-141` holds `[docs/architecture/components/,
app-shell]`. Read `git worktree list --porcelain` — or run `brief.mjs
--state`, which stamps the reading with a clock — rather than any table
here.

**BUT DO NOT READ THAT COMMAND'S `FREE` COLUMN AS A DISPATCH VERDICT.**
It is keyed by SLUG, and **two slugs can name the same component**:
`C-11` declares `touch_slugs: [app-shell, app-board]`, so with
`app-shell` held the ledger prints **`app-board: FREE`** and the two
fences intersect at C-11. This is not hypothetical — on the night of
2026-08-26 it was the *only* candidate left on the board (`T-112`,
`blocked_by: [T-111]` with T-111 `done`, `touches: [app-dispatch,
app-board]`, both columns reading FREE) and it overlaps the live
`T-141`. **The remedy is not a new tool — it is the step that was
skipped**: `brief.mjs --task T-112` reports `T-141 and T-112: OVERLAP —
both reserve app/src/assets/**` with the witness paths named. **The
VERDICT half is sound; the FREE column is a cheap display that got
consulted instead of it.** Run `--task` before every dispatch, and read
`--state` only for the lane list. `T-143` collects this with two sibling
mechanisms that DO corrupt the answer, and `T-142` is the general
shape. **`T-135` is `status: building` with no lane and Half B
unwritten**, waiting on @human's look at its §6 and §7, an
architect-widened fence including `docs/decisions/`, and the TS half of
§7's floor rule. **It must not be re-dispatched whole: Half A is on main
and its criteria 1–3 are discharged.**

## Next up

1. **`T-105`, `T-128` OR `T-131` — EXACTLY ONE OF THE THREE, AND THIS
   STAMP IS WHAT UNBLOCKS THE ITEM.** All three were held by `T-138` and
   are FREE of it now. **They still overlap each other and `T-135` on
   `method/tasks/TASK-FORMAT.md`**, so one at a time, and not beside a
   live `T-135` Half B. Derived through `fence.ts` at this checkpoint,
   never from a token comparison.

   **OR NARROW THE FENCE INSTEAD OF WAITING — `T-145` did exactly that
   on 2026-08-26 and dispatched past this block.** The containment is
   `method/` ⊇ `method/tasks/TASK-FORMAT.md`; a card fenced to the
   SUBTREE its fix actually needs — `method/adapters/`, `method/roles/`,
   `method/lane-protocol.md` — is disjoint from T-135 and free tonight.
   **A re-fence is triage's call and must be verified with `brief.mjs
   --task` AFTER the card is committed, never reasoned about in tokens.**
   `T-128` looks like the best candidate, its remedy being a rule about
   shared surfaces and `lane-protocol.md` already housing that kind of
   rule — but that is inferred from its body, **NOT confirmed against the
   fix**, and a lane whose fence turns out to be one file short is worse
   than a lane that waited.
2. **`T-138-s1` IS CHEAPER THAN ITS CARD SAYS AND SHOULD BE RE-SCOPED
   BEFORE IT IS DISPATCHED.** Its central choice — *source misses 31, or
   the run costs a suite pass* — **is false**: 194 is derivable from
   source by resolving five literal arrays in the same 23 files, and it
   was derived twice (by T-138's verifier, and independently here).
   **What survives is the honest-omission requirement**: whatever the
   generator cannot resolve must be NAMED in the document. Fence
   `[tools/e2e, docs/CAPABILITIES.md, CLAUDE.md, AGENTS.md]`. **Both root
   adapters must move together** — `deriveReadFirst` files a FOUND
   finding and `brief.mjs` exits 1 when the twins disagree — and
   `AGENTS.md` is one of `token-scan.spec.ts:106`'s seven planted roots
   while `CLAUDE.md` is not.
3. **`T-138-s5` — TWO CLAIMS IN T-138's OWN TOP HALF NO LONGER SURVIVE
   THE INVITATION THAT OPENS IT.** `grep -c ROADMAP CLAUDE.md` returns 3
   where the card says 0; the verification clause names a reader that
   reads nothing. **Both are one-line fixes and both were deliberately
   NOT taken here**, per the parent test. The card's own file is outside
   every fence by construction, so this needs no fence — it needs a seat
   with standing to amend a landed card.
4. **`T-138-s3` — ROW 3 OF EVERY BRIEF IS WRONG IN BOTH DIRECTIONS, AND
   IT NOW ALSO OWNS `brief.spec.ts:706`.** `deriveReadFirst` extracts
   only `docs/*.md`, so it over-reports `docs/NORTH_STAR.md` (a ROUTING
   pointer) and drops the `tools/e2e/tests/` product pointer entirely.
   `[tools/e2e]`, **held by `T-137` today.** The `:706` defect — a
   machine-wide worktree list joined to a per-checkout card index — was
   handed to `T-137` as a diagnosis and belongs in the same repair.
5. **`T-138-s2` — EVERY GENESIS INHERITS THE DEFECT THAT COST THIS
   PROJECT A WORKING DAY.** `method/adapters/{CLAUDE,AGENTS}.md:8` still
   name the old three, and `planner.md` step 1 copies both to every new
   project's root. **A THREE-FILE COMMIT AND THE THIRD FILE IS RUST**
   (`docs/CONVENTIONS.md`, `method/interview/plan-interview.md`,
   `kit.rs:35` `0.1.6 → 0.1.7`), and
   `snapshot_version_matches_the_live_method_stamps`'s two asserts are
   ORDERED, so a const-only bump reds on the plan-interview arm and never
   reaches the CONVENTIONS arm. **`cargo test` IS owed by that card.**
6. **`T-138-s4` — THE EXECUTOR'S SUBSET IS BYTE-IDENTICAL TO THE
   SUPERSEDED SHARED LIST.** One sentence either way in
   `method/roles/executor.md` step 1. **It claims no novelty** — `db4c903`
   already reaches the conclusion — and exists so the byte-identity
   evidence is not re-derived a third time. `[method/roles/executor.md]`,
   **FREE.**
7. **THE D2 IS `T-141`'s AND IT IS LIVE.** `app/src-tauri/tests/graph_budget_bench.rs`
   draws `unmapped -> C-07` and `unmapped -> C-10`. **Nothing reds for it
   today** and no integrator should repair it.
8. **@human's LOOK IS STILL OWED ON T-139's TWO NUMBERS.** The direction
   and the ceiling are proven, the VALUE is not, **any number in
   (989 181, 1 048 576) is equally defensible**, and it buys **about
   three ordinary merges**. Present it with the corrected reason for the
   8 576-byte gap: the two limits are the SAME measurement, byte for
   byte, so the gap is only there to give the strict `<` something to
   catch.
9. **`T-140` IS UNBLOCKED AND FENCED BY `T-137`.** The graph's floor is
   802 bytes per file and the map stops working at about a thousand
   files. `[crate-index, app-map, app-shell]`, `milestone: 5`, size L. It
   also owns the verifier's floor-conjunct finding: nothing pins that
   `apply_budget`'s floor stays under the cap.
10. **`T-139-s2`** — the snapshot crosses IPC as JS SOURCE that is
    evaluated; `[app-shell]`, **wants a room before a lane**.
    **`T-139-s3`** — `MAX_FILES` × `MAX_FILE_BYTES` = 2 GiB unchecked and
    86.3% of the real snapshot is markdown nowhere near the per-file cap;
    `[app-shell]`. **`T-139-s4`** — the DOCS GATE attributes a reader to
    the suite that owns its DIRECTORY; `[tools/e2e]`, T-137's today.
    **`T-139-s1`** — `[app-shell, app-map]`, and `app-map` is T-137's.
11. **`T-112` IS THE OBVIOUS NEXT F-04 CARD AND IT IS FREE.** F-04,
    `planned`, the milestone-4 slice's own remainder. **BUT IT IS THE
    BOARD'S MOST COLLIDING CARD**: 21 of the 24 live flips are `T-112`
    pairs, on `app/src/assets` and `app/src/styles`, invisible to a token
    comparison. **Sequence it deliberately, and derive the pairs.**
12. **`docs/CONVENTIONS.md` IS FREE AND THIRTEEN EDITS ARE QUEUED AT ITS
    SEAT.** `T-104-s5` carries the argument. **THE COMMAND LIST — two
    edits**: `T-127-s5` (`arch cycles` and `arch blast`) survives, and
    `T-133-s1` (`brief.mjs`) was folded away by `1d66a50` while
    `T-127-s5`'s own body still cites it. **THE RANGE RULE BULLET — FIVE
    edits, to `T-093`**, including this merge's two: the forbidden
    merge-base form agreed at 5 here, **the fourth consecutive merge it
    has agreed at**, and the pre-merge two-dot trap returned **58** for a
    five-path lane — **the largest magnitude this bullet has ever
    recorded**. **THE POISON DRILL BULLET — five edits, to `T-092`.**
    **AND THE TWO STALE UNBUILT-APP DENOMINATORS** (840 at `:856`, 924 at
    `:1328`, against 1013 on disk).
13. **`T-135-s3`'s GENERAL FINDING IS DISCHARGED BY ACCIDENT AND SHOULD BE
    CLOSED DELIBERATELY.** The DOCS GATE now derives
    `docs/architecture/graph.json`, so the hand-add is gone — but it is
    gone because of a false attribution (`T-139-s4`), and a repair to s4
    could take it away again. **Write the sentence anyway.**
14. **`T-111-s9` — `token-scan.spec.ts` ASSERTS WHOLE-CORPUS TOTALS FROM
    BODIES THAT PLANT ONE VIOLATION.** `[tools/e2e]`, T-137's today, and
    still the most dangerous open finding here because one of the three
    bodies it reds is character-perfect camouflage for `T-120-s3`.
    Repair (c) — *name the residual in the failure message* — is the
    cheapest thing in this list.
15. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
    AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
    returns **zero rows**, re-checked at this ref with `command grep`,
    for the eleventh checkpoint running. **THE TWO ROLE FILES ARE FREE
    AND `method/` ITSELF IS NOT — derived, and the distinction is this
    project's own rule about fences.** `T-138`'s stamp released
    `method/roles/orchestrator.md` and `method/roles/executor.md`, and
    both are `disjoint` from every `building` card. **A fence spelled
    `method/` is `overlapping` with `T-135`** on
    `method/tasks/TASK-FORMAT.md`, because containment is overlap
    (`lane-protocol.md` rule 5) — so a card that wants only a role file
    should NAME the role file and not the directory, or it serialises
    behind a card with no lane. This merge adds a seventh clean
    merge-tree case: forecast tree `c7c4619` at `2a922ce` IS the merge's
    tree.
16. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — TWENTIETH
    CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
    DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
    `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
    — `lsof -a -p <pid> -d cwd`.** Fence `[docs/CONVENTIONS.md]`, **FREE**.
17. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
    EXIST.** Unchanged; option (1) — write it in `lane-protocol.md` rule 4
    — is preferred, and it wants `method/lane-protocol.md`, which is
    inside the `method/` directory `T-135` holds through
    `method/tasks/TASK-FORMAT.md` — **so name the file, not the
    directory.** **`T-133-s3`** — one sentence in `orchestrator.md` step
    5b naming `brief.mjs` — is at the same seat, was declined by T-138's
    lane for a reason its role file states in as many words, and
    **`method/roles/orchestrator.md` is now `disjoint` from every
    `building` card**, derived through `fence.ts` at this checkpoint.
18. **`T-111-s5` IS THE MOVE LIST AND `T-137` IS THE VEHICLE — AND IT IS
    LIVE NOW.** Three implementations of the fence rule are to be retired
    into one. **The board-local copy must not simply be deleted**: it
    carries provenance (`viaComponents`) that `FenceWitness` does not.
    **`T-111-s7`** (`task-waves.ts`'s second derivation of whether a
    blocker binds) is `[app-map]` and therefore also T-137's.
19. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64; (b) the live
    positive control is brittle to a shared closing hop. `[crate-index]`,
    **FREE**.
20. **`T-129-s2`, `T-129-s3`, `T-129-s5` are `crate-index`, FREE.**
    **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never a
    panic" and was false for this class — is `app-shell`, **held by
    `T-141` today**. **`T-127-s1`, the surviving cycle**, needs
    `app-shell` and `lib-parser`; both are held today (T-141 and T-137).
21. **`T-126-s3` — FIVE WRITTEN STATEMENTS ABOUT C-15 ARE STILL FALSE ON
    MAIN**, and `arch drift` still reports `D1:C-05->C-15` as the FIRST of
    two D1s where item 4 calls it the *"fifth D1"*. **Nothing reds.** It
    was exactly as false at this merge's parent, so ruling thirteen
    returns FILE.
22. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-22.** `[app-agent]`, **FREE**. **`T-102-s4`** — the `Activity`
    label reaches the webview through no bound at all — same fence. **AND
    THE MTIME INTERMITTENT** (`T-120-s3`, fifteen consecutive greens on
    fixed code) is `[tools/e2e]`, held by `T-137` today.
23. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, T-137's.
24. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** Measured: **exit 0 as `.rs`, exit 134 as `.ts`**, and TS
    `namespace` chains abort at **2 000** against Rust's tightest **3 000**,
    so **TypeScript is the MORE exposed language.**
25. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals;
    the C-09 → C-08 direction has THREE closing edges and the card names
    two.
26. **`T-133-s5` — A LONG PROJECT PATH STEALS THE BOARD'S STANDING
    REGION**, threshold bracketed 116–128 characters, two-pixel margin at
    800×600. The fix is in `app/src` (`app-shell`) — **held by `T-141`
    today.** **FOUR live scratch checkouts measure 117–119 characters
    today, inside that bracket** — the first time this finding has had
    live instances to point at.
27. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, T-137's.
    **`T-104-s4`**, **`T-108-s1`**, **`T-108-s4`**, **`T-126-s5`**,
    **`T-126-s6`**.
28. **THE BOARD-TRUTH RULING** — TWENTY-FOURTH ask. **A PATTERN COUNT IN
    THE FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column
    still closes at the first push, and `git remote` still returns zero
    remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief in this thread has contained at
least one error, and saying so is the most valuable thing a checkpoint
returns.** This brief's central instruction was again a reading list —
`git show 9818f03`, then the lane's notes commits and `T-138-s1`…`s4`,
because *a summarised finding loses the findings inside it* — **and that
instruction is again the reason this checkpoint has anything worth
reading in it.** Sorted into the four categories it asked for.

1. **FACTS — ONE IS WRONG AND IT IS THE BRIEF'S OWN HEADLINE.**
   *"A LIVE DEFECT WILL RED YOUR SUITE AND IT IS NOT THIS LANE'S. …
   EXPECT `193/194`."* **Measured on main BEFORE the merge: 194/194, exit
   0, that body green. Measured again at the merge: 194/194.** The
   underlying defect is real and correctly diagnosed; **what is wrong is
   the claim about WHICH checkouts it reaches**, and the reason is
   structural — the dispatch stamp lands on the integration branch before
   any lane is cut, so main is the one tree that always has every card.
   **The brief also told me to say whether a merge is safe while a
   standing pin reds. It never redded, so the honest answer is that the
   question did not arise** — and the rule that would have answered it is
   `integrator.md` rule 3, the same parent test used everywhere else.
   Everything else in the brief confirmed: the tip is the VERDICT commit;
   the five-path revert; the `db4c903` two-writer case clean only by the
   revert; `arch` reporting a live D2 that is T-141's; `lint:*` in
   `tools/e2e/package.json`; `npm run typecheck` from `app/` absent;
   `arch cycles` exit 1 with stdout empty; the `grep` shim's `-I`; ports
   machine-wide; the untracked `z`.
2. **PREDICTIONS — THE ONE THAT MATTERED WAS RIGHT AND COST NOTHING.**
   *"Ask GRAPH REGEN, never predict it, and ask AGAIN after any write."*
   The gate did NOT fire on either path set and the graph was CURRENT
   both times — **so the instruction bought no correction here, and it is
   still right**: the trap it guards against has fired with bytes, files,
   symbols AND edges all matching, and the cost of asking is one command.
   **A rule that earns nothing on an easy merge has not been falsified by
   it.**
3. **ARGUMENTS — THE CENTRAL ONE IS RIGHT AND ITS CONCLUSION IS THE
   OPPOSITE OF THE ONE IT DREW.** *"This card changed no code and no
   reading list. Its deliverable is a record and four routings, so the
   claims ARE the product — a wrong figure here is a false archive entry
   later cards build on."* **Exactly right, and it is the argument for
   FILING the two defects rather than repairing them.** An integrator
   silently rewriting a landed record's top half is precisely how an
   archive entry becomes unverifiable: the sentence changes, the ref it
   was true at disappears, and nobody can tell that the card's own
   central table went stale sixteen minutes after it was written — **which
   is the single most interesting fact this checkpoint found.** The brief
   said "repair or file, and say which rule you applied"; the rule is the
   parent test, and it says FILE.
4. **STALENESS — ONE IN THE BRIEF AND ONE THIS FILE INFLICTED ON
   ITSELF.** The brief said *"two other lanes are live (`T-137` building,
   `T-141` verifying) — derive them rather than taking my list."*
   **Derived: two branches, and for part of this integration THREE
   worktree entries** — `T-141` held `task/T-141-lane` at two paths,
   which no brief could have carried because the second one appeared
   mid-integration, between a baseline suite run at **20:22** and a
   merged run at **20:28**. **The instruction to derive is what caught
   it, for the second brief running.** `T-141`'s status on disk is
   `building`, not `verifying`; the brief's word is a fact about a
   session and the card's word is a fact about the tree, and they are
   allowed to differ. **AND THEN THIS FILE WENT STALE ABOUT ITS OWN
   FINDING**: the second worktree was gone by **20:54:42**, twenty-four
   minutes after the section describing it was written and six minutes
   after it was first committed. **The checkpoint was amended to stamp
   the instance rather than to delete it**, because the mechanism — an
   e2e disclosure line catching a rule-1 violation by comparing a fence
   against itself — is the part worth keeping.
