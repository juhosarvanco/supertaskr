# State

Updated: 2026-08-26 by the T-132 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN,
AND ONE COMMAND ON MAIN EXITS 1 ON PURPOSE.** This merge is **494 / 973 /
268 / 171 green**. `cargo run -p nputer-index -- arch cycles --root ../..`
is **exit 1** on main and that is the DESIGNED state — the one declared
cycle `C-08 -> C-09 -> C-08` survives because removing it needs paths
T-127's fence could not reach, and the removal is routed with its
measurement (`T-127-s1`). **The ENFORCING copy is `cargo test`, which is
green.** Read T-127's account in that card before you read the gate's
output as breakage.

**WHAT THIS MERGE LANDS IS A RULE THIS FILE HAS DECIDED BY SIX TIMES AND
COULD NEVER CITE.** *Repair what the merge INTRODUCES; file what the
merge merely REVEALS* is now at **`method/roles/integrator.md:40`** —
`git grep` returns a row for the first time. **This checkpoint is the
first that can cite it, the first to apply it, and the first to DECLINE
it with a reason.** Read the next two sections before you use it.

Four other things will meet you before any real defect does: **the app
suite cannot BUILD on a merged main until you rebuild `lib/parser`**,
**`npm run typecheck` from `app/` DOES NOT EXIST**, **three known
intermittents plus a fourth whose rate is now measured at ~1 in 3**, and
**the checkout's test runner and the checkout's EDITOR are shared
surfaces**. **Derive the lane list before you cut anything.**

**WHAT IS NEWLY FREE**: **all of `method/`**. `lane-protocol.md`,
`roles/integrator.md` and `tasks/TASK-FORMAT.md` come back with this
merge, and nothing else held any of it — so **`T-135`** (`planned`,
`[crate-index, method/]`) is fully unblocked, **`T-091-s4`** has its seat,
and **`T-108-s3` + T-108's fence ruling** can be written where they
belong. **HELD: `tools/e2e` by `T-133`, and nothing else.**

## THE FINDING THIS CHECKPOINT EXISTS TO CARRY — THE CONFLICT ARRIVED ON THE CARD FILED ABOUT THE STEP THAT PREVENTS IT

**`roles/orchestrator.md` step 5b exists so that ONE side writes
`status:`. The architect skipped 5b when dispatching this card. The merge
conflicted — on one line, in one file, and the file is this card.** The
prediction is therefore **demonstrated rather than asserted**, and it is
recorded here rather than resolved away because it is the best evidence
the rule has.

**THE MECHANISM, DERIVED FROM TIMESTAMPS RATHER THAN TOLD.** The lane's
base `74feb67` is **2026-08-25 21:46:54** and carries `status: planned`.
The lane's first commit `b1783a6` is **21:56:51**. Main's dispatch stamp
`e7db842` — `planned` → `building` — is **22:42:41**, **fifty-five
minutes and forty-seven seconds AFTER the commit the lane was cut from**
and **forty-five minutes after the lane had already started writing**. A
three-way merge whose base predates the stamp has TWO sides that moved
the line; had 5b been obeyed the base would read `building`, only the
lane would have moved it, and the merge would have been clean. **5b's
order is not ceremony: it is what makes this line single-writer.**

**THE ARITHMETIC IS THE PROOF, AND IT IS THE FIRST TIME IN THIS RECORD
THAT IT COMES OUT THE OTHER WAY.** Every checkpoint before this one
proved the lane's work and main's advance DISJOINT with an empty
`comm -12`. Here:

    lane's own work   74feb67..83a85cc   ->   8 paths
    main's advance    74feb67..4f3de7e   ->  26 paths
    comm -12 of the two                  ->   1 path, NOT empty
    union                                ->  33 = 8 + 26 - 1

and the one shared path is
`docs/tasks/T-132-three-of-four-rulings-were-already-written-and-broken.md`.
**The intersection is not a near miss, it is the card itself.**

**THE RESOLUTION IS `verifying`, AND IT IS DERIVED RATHER THAN
PREFERRED.** `TASK-FORMAT.md`'s own STATUSES bullet already rules the
window: *`building` at the merge's parent, `verifying` at the merge
commit itself, `done` at the checkpoint* — one commit wide. The lane's
stamp is the forward move and `executor.md` step 6's to make. The
resolved file is **byte-identical to the lane tip** (`git diff 83a85cc --
<card>` is empty), and nothing of main's was lost: **main's stamp commit
moved TWO lines, not one** — `status:` and `builder:` — and `builder:
claude-opus-5` merged clean only because the lane had adopted main's
value rather than leaving it empty. **One of the two lines was saved by a
lane's courtesy and not by anything structural.**

**AND THE FORECAST TOLD THE TRUTH IN A SHAPE PREVIOUS CHECKPOINTS HAVE
NOT SEEN.** `git merge-tree --write-tree 4f3de7e 83a85cc` exits **1**
(read from `$?` into a variable BEFORE any substitution) and prints tree
`51c2424` with `CONFLICT (content)`. **That tree is NOT the merge's
tree** — the merge's is `f847509`, and `git diff` between them names
exactly one file and exactly the four conflict-marker lines. The
sentence four checkpoints have written — *"the forecast tree is the
merge's tree, byte for byte"* — **holds only on exit 0**. On exit 1 the
forecast is still exactly right about WHICH PATHS (8 = 8), which is the
only thing the three standing gates consume, and wrong about one file's
CONTENT by four lines. **A conflicting forecast is a usable gate input
and an unusable tree**, and that distinction was never written down.

## THE SIXTH FALSE CLAIM SHIPS, THE CHECKPOINT SAYS SO, AND `T-132`'s OWN CLAIM IS NOW FALSE ON MAIN

**`T-132-s4` IS FILED AND NOT FIXED, AND WHAT IT NAMES IS NOW ON MAIN.**
`git grep -i 'staged\|staging' -- method/` returned **zero rows** at the
merge's parent and returns **two** now, **and neither is a rule**:

- `method/lane-protocol.md:128` — violation **(a)** itself, *"Staging
  into the integration checkout's index while an integrator held it."*
- `method/tasks/TASK-FORMAT.md:255` — *"a separate rule — do not leave
  staged state in a checkout somebody else is holding"*, with `:257`
  leaning on it again (*"The two rules were never jointly
  unsatisfiable"* asserts that two exist; one does).

**Staging was never in rule 4's list in ANY spelling** — not before the
seat was generalised, not while it was, not after it was scoped back —
so **violation (a) is prohibited by nothing**, and the card's
*"One clause; it is `T-123-s10`'s entire ask"* (line 139) is **false**.
`T-123-s10` was filed FOR the staging incident and absorbed here; its
file is deleted and its ask is unmet.

**BOTH HALVES ARE NOW ON MAIN, 1 170 LINES APART IN ONE FILE**: the false
claim at line 139 and the verifier's refutation of it at line 1309. **A
reader who stops in section one meets the claim and not the correction.**
Recorded here in permanent form for the same reason T-127's checkpoint
recorded its own: this file is a snapshot and will be rewritten at the
next merge, so the card carries the correction too (verifier's section)
and the `## Integration` section names it a third time.

**AND THE DANGLING CITATION SHIPS INTO OTHER PEOPLE'S PROJECTS. MEASURED
FROM CARGO'S OWN FINGERPRINT, NOT FROM READING `kit.rs`.** The debug
dep-info names **exactly fourteen `method/` files**, and the boundary
runs THROUGH `method/`:

    grep -o 'method/[a-zA-Z0-9/._-]*' app/src-tauri/target/debug/*.d | sort -u

- **IN (compiled):** `tasks/TASK-FORMAT.md`, `tasks/T-000-template.md`,
  `roles/planner.md`, `interview/plan-interview.md`,
  `interview/decomposition.md`, `runtime/nputer.yaml`,
  `adapters/{CLAUDE,AGENTS}.md`, and the six `docs-templates/`.
- **OUT:** `lane-protocol.md` and `roles/integrator.md`.

**So of this merge's three fenced files, exactly ONE is a cargo code
input and two are not.** `method/` is a code input at **FILE**
granularity, this merge straddles the boundary, and the file carrying the
dangling reference is on the compiled side. In a project that is not this
one the reader has no incident, no board and no verdict to reconstruct
the missing rule from — only a sentence saying a rule exists that their
`method/` does not contain.

## THE RULING — FILE, DO NOT REPAIR — AND THE GAP IT FOUND IN THE RULE THIS MERGE LANDS

**Ruling thirteen would appear to order the repair, and it is declined,
with three reasons and one finding.**

1. **THE DISPOSITION IS ALREADY TAKEN, BY A SEAT THAT HAD THE STANDING.**
   The verifier considered blocking and chose to file: *"Not the fix's
   defect, which is why it is a finding and not a second rejection."*
   Disposition belongs to TRIAGE (T-083), and the clause landing here
   names that rule as its own companion — *"Repairing a revealed defect
   is not generosity — it is a disposition taken without triage."*
2. **THE REPAIR IS A LANE WRITE AND THIS INTEGRATOR HOLDS NO LANE.**
   T-108's fence ruling exempts a card's own file from its fence **for
   PROTOCOL WRITES** — `status`, `builder`, `built_by`, `verified_by`,
   `review` — and T-127's integrator applied it one merge ago: a closing
   stamp is a protocol write, rewriting technical analysis is a lane
   write. Here the files are not even the card: they are two of the three
   in `T-132`'s own `touches:`. `T-132-s4`'s preferred fix is to **WRITE
   A NEW RULE** into `lane-protocol.md`; the alternative is to **STRIKE
   ANOTHER HAND'S SENTENCES** in `TASK-FORMAT.md`. Neither is a protocol
   write.
3. **THE BLAST RADIUS ARGUES THE SAME WAY, HARDER.** `TASK-FORMAT.md` is
   compiled into the binary and materialises into other projects' kits
   (measured above). `T-132-s4` itself asks for the positive control this
   project demands of any new rule — *state it so that the ordinary case,
   an atomic stamp-and-commit under a running integrator, still passes*.
   **An integrator cannot supply that control at a checkpoint**, and a
   rule invented without one travels further than this repository.

**THE FINDING: RULING THIRTEEN'S TEST IS TWO-VALUED AND THIS CASE IS A
THIRD VALUE.** The clause says *"Ask whether the thing was true one
commit ago. Yes: repair it. No: file it. That is the whole rule, and it
is answerable with one command rather than with taste."* For
`TASK-FORMAT.md:255` the honest answer is **NEITHER** — one commit ago
the sentence did not exist. Read the TEST and you file; read the
HEADLINE (*"a citation that THIS merge made false"*) and you repair.
**The rule's headline and its one-command test disagree on a citation the
merge INTRODUCES false, and this merge is the first to put such a case in
front of it — because it is the merge that lands it.**

**THIS IS THE SECOND CONSECUTIVE CHECKPOINT TO DECLINE THE REPAIR HALF ON
THE SAME GROUND**, which makes it a pattern rather than an incident.
T-127's checkpoint routed two latent gate defects *"in code this merge
INTRODUCES, so ruling thirteen would have them repaired"* because *"an
integrator writing new Rust with new bodies at a checkpoint is a lane
write by another name."* **The rule sorts defects by WHEN they became
false and never by WHO may write the fix**, and the second axis is what
both checkpoints actually decided on. **NO SUGGESTION COVERS THIS GAP**
and filing one is a triage's call and not an integrator's (T-083), so it
is recorded rather than filed — **this checkpoint creates no tracked
file at all.**

## THE SUPPORTING CLAUSE OVERSTATES, AND THE COUNTEREXAMPLE IS THIRTY-SIX LINES BELOW IT

`method/lane-protocol.md` rule 4's discriminator is sound and was
attacked as such: it partitions **PROHIBITIONS** rather than seats or
acts, asks whether a prohibition names a **COLLISION** or an
**AUTHORITY**, and returns "bind the complement of the holder" only where
contention is the reason. **It does not over-reach.** Its supporting
sentence does: *"A commit does not contend; it is atomic."*

**True of a COMPLETED commit, false of the STAGING step** — and the
counterexample is violation **(a)** in the same rule, where an integrator
*"spent about four minutes deciding whether the tree was safe to write"*
because an index it shared was dirty. **Atomicity is an OBLIGATION ON THE
WRITER, not a property of git**: a permitted write is stage-and-commit in
one motion, leaving nothing staged behind. **The collision/authority test
needs no change; this sentence does.** Recorded and not repaired, on the
ruling above.

## THE MTIME INTERMITTENT IS NEAR ONE IN THREE, AND A GREEN WAS NEVER EVIDENCE OF THE FIX

**READ THIS BESIDE THE THREE CARGO INTERMITTENTS BELOW — IT IS THE
FOURTH, IT IS IN `tools/e2e`, AND ITS RATE WAS MIS-STATED IN BOTH
DIRECTIONS BEFORE THE VERIFIER MEASURED IT.**

`T-120-s3`'s fractional-millisecond mtime signature
(`token-scan.spec.ts:201`, `Expected …492.7957` against
`Received …493`) was fixed on main at **`cea839e`** (T-130). The whole
`T-132` thread ran on code that **cannot carry that fix**:
`git merge-base --is-ancestor cea839e 83a85cc` exits **1**, and the
unfixed `utimesSync(target, clock.atime, clock.mtime)` is still at
`token-scan.spec.ts:226` on the lane tip.

**THE CORRECTED TALLY, EACH ROW READ FROM THE COMMIT OR NOTES THAT
DECLARED IT** (`83a85cc`): original lane **2 runs, 1 red**; the
verifier's first pass **3 runs, 1 red**; the fix lane **2 runs, 0 red**;
the re-check **2 runs, 1 red**. **NINE RUNS ON CODE THAT CANNOT CONTAIN
THE FIX — THREE RED, SIX GREEN. NEAR ONE IN THREE.**

**SO THE DEFECT WAS NEVER "RED ONCE, THEN GREEN FOREVER", AND A GREEN WAS
NEVER EVIDENCE OF THE FIX.** The lane's notes reached the same conclusion
from the other side: *"the three-way diagnostic separates reds; it cannot
read a red's absence."* **THIS MERGE'S OWN e2e RUN IS THE FIRST IN THE
THREAD ON FIXED CODE** — `merge-base --is-ancestor cea839e 1d3838b`
exits **0** — so its 171/171 proves that nothing else broke and nothing
about `cea839e`. **A red before `cea839e` is not news; a red at or after
it is.**

## THE PROCESS FINDING THE VERIFIER FILED AGAINST ITSELF, TWICE

**IT IS WORTH MORE THAN THE CARD AND IT IS THIS CARD'S OWN SUBJECT,
COMMITTED BY ITS VERIFIER, IN THE VERDICT THAT APPROVED IT.** `aabbb3c`
declared **five suite figures before running them**, carried from an
earlier pass at a different tree. Measured afterwards: **four were true
and e2e was FALSE** — run 1 was 170 passed / 1 failed at exit 1, run 2
was 171/171. It **disclosed rather than re-running until the numbers
matched**, and declared run 2 *"because it agreed, not as a
replacement."*

**THEN IT REPEATED THE ERROR INSIDE THE CORRECTION**, taking "three runs"
from a dispatch message instead of from `9b3b923`, which says two — in
the paragraph documenting exactly that habit, and caught only by opening
the commit to cite it. **Third instance in one thread, in the seat that
had just named the first two.**

**THE LESSON IS STATED AS THE VERIFIER STATED IT, BECAUSE IT IS BETTER
THAN A PARAPHRASE**: *"The failure mode is not that the guess is usually
wrong — it is that nothing distinguishes a guessed row from a derived one
after the fact."* Four of five were right, **which is why the habit
survives**.

## `T-132-s2` MEASURED AT THIS MERGE — THE GATE HAS THE READER IN HAND AND THE TRIGGER CANNOT REACH IT

**ASKED, NOT PREDICTED, IN BOTH SHAPES.**

| path list given to `docs-gate.mjs` | exit | verdict |
|---|---|---|
| the three `method/` files alone | **0** | *"3 changed path(s) given, none under docs/ — this gate is not owed"* |
| the merge's own **8** (RANGE RULE's list) | **1** | FIRES on **5**, naming **three** suites |

**That is `T-132-s2` reproduced a FOURTH time** (the lane saw it at the
build, the verdict and the notes). **AND IT IS WORSE THAN "NOT OWED":**
two lines above its own verdict the gate PRINTS
`reader app/src-tauri/src/agent/kit.rs [cargo test from app/src-tauri/]`
— the very file that `include_str!`s `TASK-FORMAT.md`. **The census has
the reader; the trigger keys on `docs/` and `method/` is not `docs/`.**

**`cargo test` WAS OWED HERE AND NO GATE SAID SO.** It was run, and it is
green, so the gap cost nothing at this merge — **but nothing in the tree
would have told an integrator to run it.** The three suites the gate
named were `npm test` from `app/`, `npm test` from `tools/e2e/` and
`npx vitest run` from `lib/parser/`; the fourth came from a derivation by
hand.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS SIXTEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as
a flake for weeks. It is not one. **It reds when the cargo target
directory is large and ~never when it is small, and the single variable
is the size of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s;
main's own 8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test
binary. **A tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under
9.5s, every red over 14.6s, **a gap of more than five seconds with
nothing in it**. `du -sh app/src-tauri/target` reads **3.7 GB** here (3.6
at T-127's — this merge recompiles the app crate, because
`TASK-FORMAT.md` is `include_str!`'d), and the lib suite is **5.10s**
against T-127's 5.47s. **TWENTY-FOUR runs across fifteen integrations and
not one lands between 9.5s and 14.6s.** Read the lib suite's own time
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
suite inside the healthy band — so the cache cliff cannot be what crossed
its deadline. Run alone: **5 green in 5**. **THE SETTLEMENT WAS RETRACTED
IN PLACE at `086bf1c`** with the rule it produced: *a re-measurement can
only settle a finding whose MECHANISM the intervention addresses.* Pooled
clean-cache evidence is **1 red in 20**. It did NOT fire at this merge —
read by NAME, `ok` — which is one more data point and not a reprieve.
`T-086-s1` and `T-102-s3`; fence `[app-agent]`, **FREE**.

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** `lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT.
The app resolves `@nputer/parser` through a symlink, so it compiles
against PRE-merge types and fails with e.g. `TS2339` while `vitest`
transpiles without typechecking and the dogfood fixtures red in a way
that looks exactly like an un-reconciled fixture. **One command clears
it**: `npm run build` from `lib/parser/`. **THE TRIGGER IS NOT A FRESH
TREE, IT IS A MERGE THAT CHANGES THE PARSER'S TYPES** — CONVENTIONS files
the parser-before-app ORDER under *fresh clone*, so a fully-installed main
checkout reads as exempt and is not. **This merge's parser diff is EMPTY**
— its eight paths are five markdown cards and three `method/` files — so
the trap did not fire; the build was run first anyway, in that order, and
every exit was 0. **Do not read a green build as evidence the trap is
gone.** In a FRESH WORKTREE the earlier link fires too: `npm run build`
from `app/` exits **2** with `Cannot find module '@nputer/parser/pure'`
until `lib/parser` is both INSTALLED and BUILT.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Re-derived at this checkpoint rather than trusted**, straight out of
`app/package.json`: the scripts are exactly `dev`, `build`, `preview`,
`test`, `tauri`. `npm run typecheck` from `app/` exits **1** with
`Missing script`, which a hurried reader takes for a compile failure.
**The app's typecheck is the TWO `tsc` calls inside `npm run build`** —
`tsc && tsc -p tsconfig.test.json && vite build` — and the second is
load-bearing: without it nothing in the repository typechecks the app's
test files (T-073). `lib/parser` and `tools/e2e` DO have a `typecheck`
script; `app/` is the exception, and that asymmetry is the whole trap.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not
a lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN
AND THIS IS THE TWENTY-FIRST MEASUREMENT SAYING SO.** The one command
that answers it:
`git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`.

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-133** | `[tools/e2e]` | **building** |

**T-132's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so **ONE** lane holds
a fence after it — down from two. **DERIVE THE MEMBERSHIP BY FILTERING ON
THE BRANCH; DO NOT QUOTE THIS TABLE.**

**THE NON-LANE LIST MOVED UNDER THIS INTEGRATION AND THE LANE LIST DID
NOT — THIRD CONSECUTIVE CONFIRMATION.** T-127's checkpoint recorded a
`T-133` poison-drill checkout at `…/scratchpad/T-133/drill-T-133`,
detached at `9ddca48`. It is **GONE**, and a `…/scratchpad/T-133-verify/wt`
checkout, detached at `64d1483`, appeared in its place — so `T-133` moved
into verification while this merge ran. **What did NOT move is the LANE
membership**, identical at every reading across this whole integration.
**THIS EDITION CARRIES NO ROW COUNT FOR THE WHOLE LIST**, on T-130's
policy.

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT DID NOT MOVE UNDER THIS
  INTEGRATION**: `212543c` at the start and `212543c` at the end, so it
  is now **six merges and six checkpoints** behind main, and updating it
  is @human's one command to run when they choose.
- **`/Users/ujju/Projects/arch-verify`, detached — NOT THIS
  INTEGRATOR'S.** It read **`5036958`** throughout, which is behind this
  merge's own main-before. On no `task/` branch and named after no card,
  so **not a lane**; read with `git -C … rev-parse` and nothing else, and
  left alone.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free: **all of
`method/`**, `crate-index`, `docs/architecture/components/`,
`docs/CONVENTIONS.md`, `app-agent`, `app-map`, `app-board`, `app-shell`,
`app-dispatch`, `app-interview`, `lib-parser`, `.github/`, and every
`docs/tasks/` card path. **HELD: `tools/e2e` by `T-133`, and nothing
else.**

## Just completed

**T-132 — rule 4 binds the complement of one seat, and ruling THIRTEEN
becomes citable.** F-01, milestone 4, **size S**, `touches:
[method/lane-protocol.md, method/roles/integrator.md,
method/tasks/TASK-FORMAT.md]`. Main-before **`4f3de7e`**, lane tip
**`83a85cc`** (derived with `git rev-parse`), merge **`1d3838b`**, this
checkpoint its direct child. `builder: claude-opus-5`,
`verifier: claude-opus-5 @T-132-verify`, `built_by: claude-opus-5 @T-132
— code b1783a6, 0c6a0a3; notes 56821e7, 9b3b923`,
`verified_by: claude-opus-5 @T-132-verify — REJECTED 9314d3e, re-check
APPROVED 2026-08-25 — verdict commit aabbb3c, self-correction 83a85cc`,
**`review: same-model`**.

### **WHAT SHIPPED, IN THREE FILES**

- **`lane-protocol.md` rule 4 changes its SUBJECT and splits its LIST.**
  The headline is now *"NO SEAT BUT THE INTEGRATOR'S INSTALLS OR RUNS A
  SUITE IN THE INTEGRATION BRANCH'S CHECKOUT"*, and the **four write
  prohibitions stay the LANE's**. The discriminator is the whole of it:
  **does a prohibition name a COLLISION or an AUTHORITY?** An install and
  a suite run CONTEND — for the tree, the runner, the dependencies — so
  they bind the complement of the seat that owns the checkout. A commit's
  permission is settled per seat in that seat's own file. **The test run
  is the addition and it is the worse half**: an install is destructive
  and anticipated; a test run only READS, looks harmless, and **CERTIFIES**
  — a second runner corrupts an integrator's verdict in both directions
  at once, and **nothing in the tree records that it was there.**
- **`roles/integrator.md` gains RULING THIRTEEN** — *repair what the
  merge introduces, file what it merely reveals* — with its parent test,
  its companion (`TASK-FORMAT.md`'s "THERE IS NO FOURTH MOVE") and its
  origin. **See the ruling section above for the gap this checkpoint
  found in it on its first day.**
- **`TASK-FORMAT.md` binds the CARD AUTHOR**: *a criterion may not order
  work outside its own card's `touches:`*. The reader's half was already
  unconditional in `executor.md`, so **the entire burden of refusal sat
  on the lane** — the card said do it, the fence said do not. **A card
  whose criterion and whose fence disagree is a DEFECTIVE CARD**, and the
  remedy is to widen the fence before dispatch or write the criterion as
  a ROUTE. A criterion-shaped exception is refused, because *every*
  out-of-fence edit is made because some criterion seemed to want it.

### **THE REJECTION WAS ONE CLAUSE, AND THE NINE OTHER ATTACKS FOUND NOTHING BOTH TIMES**

`9314d3e` rejected the first landing because rule 4 carried all six
prohibitions across, which **contradicted the file's own SEPARATE THE
WRITE FROM THE VERIFICATION clause and forbade `orchestrator.md` 5b
outright** — the card records that the architect stamped two cards late
believing a rule forbade writing to main (*"It did not"*), and the first
landing would have made that false belief textually true. **The fix
returns the four writes to the lane and cites 5b BY NAME as what
generalising them would break.** Everything else survived adversarial
reading twice: all four "already written" claims re-derived independently,
the architect-zero-at-base result, the `method/` card-citation zero, the
card-author clause, the `integrator.md` rule-1 citation, the STATE
diagnostic's presence at base, the correctly-not-owed poison drill, and
the fence holding exactly.

### **FOUR RECORD CORRECTIONS LANDED WITH THE FIX AND ONE IMPROVED ON THE VERDICT**

*"Eight `method/` files"* is **fourteen**; *"four cargo bodies read
`method/` off disk"* is **two** (the other two read the compiled
`KIT_FILES` table); the card was **never stamped `status: building`** —
5b skipped outright, on the card about 5b, a fifth false claim the lane's
own six-item list missed; and *"the final four paths"* was **seven** by
the commit that wrote it. **`T-132-s2` improved on the verifier's own
statement**: the per-path boundary makes the gate gap **WORSE**, because
the compiled fourteen and the rest look identical from outside — so the
seat that must derive `cargo test` by hand must first derive WHICH paths
are in the table.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 4f3de7e 83a85cc -> tree 51c2424…, exit 1 CONFLICT (read from $? FIRST)
    git diff --name-only 4f3de7e <TREE>                         ->   8   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 4f3de7e..1d3838b  (THE MERGE'S DIFF)   ->   8   the only one that means anything
    git diff --name-only 4f3de7e...1d3838b (three dots AT the merge) ->  8   collapses, as it must
    git diff --name-only 74feb67..4f3de7e  (main's advance)     ->  26
    git diff --name-only 4f3de7e..83a85cc  (TWO dots, FORBIDDEN)->  33
    git diff --name-only 74feb67..83a85cc  (merge-base..tip, FORBIDDEN) ->  8
    git diff --name-only main..HEAD        (FORBIDDEN)          ->   0   ← read this row twice

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 25 PATHS — 4.125x — AND IT IS
THE FIRST TIME IN THIS SERIES THAT IT IS *NOT* PURE LEFT-ENDPOINT
DRIFT.** Main advanced **26** under this lane, the branch **8**, and
`comm -12` over the sorted lists is **ONE ROW, NOT EMPTY** — the card
itself. The union is **33**, byte-identical to the forbidden two-dot set
under `cmp`, and **8 + 26 − 1 = 33**: the arithmetic that proves they are
NOT disjoint, checked as SETS and not only as counts. Ratios so far:
T-110 **7.0x**, T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086
**2.67x**, T-107 **2.25x**, T-102 **3.75x**, T-033 **1.94x**, T-091
**8.78x**, T-116 **15.80x**, T-108 **20.75x**, T-104 **3.54x**, T-126
**6.33x**, T-129 **7.53x**, T-130 **18.00x**, T-127 **1.50x**, T-132
**4.125x**. **The ratio is weather; the left endpoint is the signal** —
and this merge adds the second half of that sentence: **the ratio is not
even always pure drift.**

**`<merge-base>..<tip>` GAVE THE RIGHT PATHS AGAIN — AND THIS IS THE
FIRST MERGE IN THE RECORD WHERE THE TWO METRICS SEPARATE FOR IT.**
`74feb67..83a85cc` returns **8** paths, byte-identical to the prescribed
set under `cmp --name-only`. **On the WHOLE PATCH it is wrong**: 100 439
bytes against the prescribed 100 392, differing from char 17 396, and the
difference is exactly the card's frontmatter hunk — it reports
`-status: planned` where the merge removed `status: building`, and it
manufactures a `-builder:` / `+builder: claude-opus-5` change **the merge
did not make**. **Right files, wrong coordinates** — the failure
CONVENTIONS' 31-merge backtest attributes to THREE DOTS, arriving here in
the merge-base form, live, at a merge. **That is now FOUR merges running
where this form was accidentally right on paths, and the first where the
record can show it wrong on bytes.** The argument for banning the PAIR
rather than trusting the outcome, made four times and now measured.

**AND THREE DOTS AT THE MERGE COLLAPSES EXACTLY, ON BOTH METRICS**:
`4f3de7e...1d3838b` is byte-identical to `4f3de7e..1d3838b` under `cmp`
on the whole patch, because `4f3de7e` is an ancestor of the merge.

**AND THE OTHER FORBIDDEN FORM DOES NOT OVERSTATE AT ALL — IT ANSWERS
ZERO.** `git diff --name-only main..HEAD` returns **0 paths** at an
integrator's own checkout, because the integrator IS on `main` and
`main == HEAD` the moment the merge lands. **A session that reached for
that spelling would read an 8-path merge as an empty one**, and the DOCS
GATE — the one standing gate that fires here — would have been skipped
silently with a clean-looking derivation. **The forbidden forms do not
share a failure direction**: one inflates, one ANNIHILATES, and only the
second is invisible.

**THE FORECAST TREE IS *NOT* THE MERGE'S TREE HERE, AND THAT IS THE
CONFLICT SAYING SO.** `merge-tree --write-tree` exits **1** and returns
`51c2424`; the merge's tree is `f847509`; `git diff` between them names
ONE file and FOUR lines, all conflict markers. **The path list is
identical (8 = 8), which is all the gates consume.** Parents are
`4f3de7e` and `83a85cc` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT** beyond the one-line resolution, and the resolved file is
byte-identical to the lane tip.

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST THE OTHER LIVE LANE.**
`comm -12` of this merge's eight paths against `T-133`'s
`merge-base..tip` diff (**8** paths — five `docs/tasks/` cards and three
`tools/e2e` files) is **EMPTY**.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR** — `4f3de7e` when the range
was derived and `4f3de7e` in the same command as the merge, read beside
the two diff checks. `git diff --cached --name-only` and `git diff
--name-only` were both EMPTY there, with one `??` row; **`??` alone is
not a ceremony.**

## THREE standing gates — only ONE fires, all derived from the merge's own 8 paths

| gate | trigger | on these 8 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — NOT OWED** | **ASKED ANYWAY, TWICE**: exit 0 CURRENT both times |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | not run, and the derivation is stated |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES** | exit **1**, **THREE** suites named, all green |

- **GRAPH REGEN — NOT OWED BY THE TRIGGER AND ASKED ANYWAY, WHICH IS
  WHAT THE BULLET SAYS TO DO.** `index --check --root ../..` exits **0**,
  CURRENT, at **944 590 bytes · 180 files · 2018 symbols · 1911 edges** —
  every figure identical to what T-127's checkpoint committed, which is
  the right answer: **this merge's eight paths are five `.md` cards under
  `docs/` and three `method/` files, and `.nputerignore` excludes `docs/`
  while `method/` was never in the walk.** Asked a **second** time after
  every doc write in this checkpoint, exit 0 CURRENT again. **The graph
  was NOT regenerated and NOT committed, because nothing indexed moved.**
- **AND THE SECOND ASK CAUGHT A TRAP CONVENTIONS DOES NOT CARRY, IN THE
  BULLET NEXT DOOR TO THE ONE THAT DOES.** The `--root IS LOAD-BEARING`
  paragraph documents the WRONG-`--root` false red: exit **1**, headline
  STALE, second line `committed: MISSING`. **The wrong-CWD case is a
  different animal and it never reaches the gate at all**: run from the
  repo root instead of `app/src-tauri/`, the same command exits **101**
  with `error: could not find Cargo.toml in /Users/ujju/Projects/nputer
  or any parent directory` — **cargo's exit, not the gate's**, and 101 is
  outside the 0/1/2/3 contract this project gives every gate. A hurried
  reader takes a non-zero for a verdict. Caught here because the exit was
  read and the OUTPUT was read; re-run from the right directory it is
  exit 0 CURRENT.
- **THE IDENTICAL-FIGURES TRAP DID NOT FIRE, AND THE DISCRIMINATOR HELD
  FOR THE FIFTH TIME.** T-127's checkpoint named it: the trap fires when
  the CHECKPOINT WRITES A FIXTURE, **not** when the headline figures
  agree. This checkpoint writes `STATE.md`, `ROADMAP.md` and one card —
  no fixture, no indexed file — so the second ask agrees for a REASON and
  not by luck. **The figures being identical on both sides is exactly the
  reading that trap punishes, so it was confirmed BY THE GATE and never
  by a byte count.**
- **BOOT GATE — NOT OWED, DERIVED RATHER THAN SKIPPED.** Zero of eight
  paths are under `app/src-tauri/**`, `app/src/**`, `app/package.json` or
  `app/src-tauri/Cargo.toml`. A skipped gate is news, so it is named here
  with its derivation rather than passed over in silence.
- **DOCS GATE — exit 1, FIRES on 5 of 8, THREE suites**: `npm test` from
  `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from
  `lib/parser/`. Invoked DIRECTLY from the repo root with the RANGE
  RULE's own path list, **never through `xargs`**, exit read from `$?` on
  an unpiped command. **13 derived docs readers across 4 suites**, census
  **131 sites in 22 files**, **0 frontmatter issues**, **6 root-anchored
  files all argued, 0 unlinked**. **`cargo test` IS THE FOURTH SUITE AND
  THE GATE DID NOT NAME IT** — see the `T-132-s2` section above.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 494 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **197 bodies in 5.10s**.
  **AND THE COUNT WAS CROSS-CHECKED AGAINST THE DECLARED BODIES**: the
  `running N tests` headers sum to **497** = 494 + 3 ignored. **DO THE
  HEADER CHECK EVERY TIME** — T-129's M15 is the worked reason: a SIGABRT
  in one target prints **no `test result:` line at all**, so the summary
  reads unremarkably while whole bodies vanish. **494 is unchanged from
  T-127 and that is the right answer**: this merge adds no test body. It
  is owed all the same, because `TASK-FORMAT.md` is a code input.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from `lib/parser/`, which was run FIRST regardless.
- **app: `npm run build` exit 0** · **`npm test` 973/973 across 47 files,
  exit 0**.
- **E2E: 171/171, exit 0, 2.0m, on scratch port 15920** — `lsof` read
  ZERO rows at **23:55:49** before the bind and ZERO again at **23:58:10**
  after; and again after the doc writes, **171/171 exit 0 on port
  15921**, zero rows at **00:09:10** and **00:11:09**. **THESE ARE THE
  FIRST TWO RUNS IN THIS THREAD ON CODE THAT CAN CARRY `cea839e`**; see
  the mtime section for why that matters and for the nine-run tally it
  corrects.
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME**, not
  inferred from a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY AT THIS MERGE**:
  `arch cycles --root ../..` exit **1** read from `$?` **UNPIPED**,
  `cycle C-08 -> C-09 -> C-08`, `components=13 declared_edges=35`, the
  whole **529-byte** report on **stderr** with stdout **EMPTY**.
  **`arch cycles > out.txt` on a red yields an EMPTY FILE**, and reading
  its exit through `| head` yields **head's 0** — worth knowing before
  you pipe it.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens -- --selftest`
  exit 0** (65 TOKEN + 4 CONTROL samples, 87 walk-policy checks, 9
  evidence-floor checks), **`npm run lint:tokens` exit 0**, at **TOKEN
  135 / CONTROL 758**. **`npm run typecheck` from `tools/e2e` exit 0.**
  **DERIVE THE CONTROL FIGURE AT YOUR OWN REF; IT IS NOT A CONSTANT** —
  754 at T-127's checkpoint and **758** here, because this merge adds
  **four** new tracked text files, all suggestion cards. `git ls-files`
  reads **776**.
- **RUN LEDGER — every run declared, including the ones that agree.**
  cargo **once** (494/0/3); parser build **once** then the suite
  **twice** (268/268 post-merge, 268/268 after the doc writes); app build
  **once** then `npm test` **twice** (973/973 both times); `tools/e2e`
  **THREE times in main** (171/171 on port 15920 post-merge, 171/171 on
  port 15921 after the doc writes, 171/171 on port 15922 after the last
  STATE edit — **and the third was derived rather than assumed**: the
  DOCS GATE asked about `docs/STATE.md` ALONE names `npm test` from
  `tools/e2e/` and nothing else, so the parser and app suites were
  correctly NOT re-run); DOCS GATE **four times** — exit 0 on the
  `method/` subset, exit 1 on the merge's 8, exit 1 on the checkpoint's
  own 3 (same three suites), exit 1 on `docs/STATE.md` alone (one suite);
  `index --check` **three invocations, TWO asks** — the middle one was
  the wrong-CWD mis-invocation above, declared here because a run that
  never reached the gate must not be counted as one. **The final
  `tools/e2e` run that this file's own write owes is declared in this
  checkpoint's COMMIT MESSAGE** — a commit message is not a code input,
  so recording a run there owes nothing further and the regress
  terminates on the first pass instead of converging. **What may never be
  done is stopping because the loop is tiresome, or writing a run's
  result before running it** — which is precisely the habit this card's
  own verifier filed against itself, twice.
- **`range-rule.spec.ts` PRINTED ITS DISCLOSURE AGAINST THIS MERGE COMMIT
  BY NAME** — *"`/Users/ujju/Projects/nputer @ 1d3838b` — GRAPH REGEN's
  published flip figures are stated at `ddcc8bb` and ARE RIGHT THERE, and
  its trigger has since gained `.rs`: 5 of 5 at that ref, 1 of 1 under
  the trigger on disk"* — `T-091-s3`'s exact subject, observed rather
  than theoretical, for the **sixth** consecutive merge.

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-132` was removed with `git worktree
remove`, after the merge and after the checkpoint (lane-protocol rule 6),
and `git worktree prune` was run behind it. **Rule 6's
preserve-until-the-verdict clause BINDS AN S CARD THAT TOOK A VERIFIER,
and it bound here** — read the ceremony table's row, not the tier letter.
This is a size-S card with a real adversarial verdict, a rejection and a
re-check, so the worktree survived until the verdict existed; it did, at
`aabbb3c`, with the verifier's own self-correction at `83a85cc` on top.

## The board, derived from disk at this checkpoint

**286 flat task files — 97 done / 36 planned / 41 parked / 111 suggested /
0 verifying / 1 building; 26 in `rejected/`.**
97 + 36 + 41 + 111 + 0 + 1 = 286. T-132's stamp moves done from 96 to 97
and clears the single `verifying`; the one `building` is `T-133`, a live
lane. The merge brought **four** suggestions, so the file count is up four
from T-127's 282. **This checkpoint files NONE**, and creates no tracked
file at all.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND ELEVEN AND WANTS AN ELEVENTH
TRIAGE.** `T-132-s1`…`s4` came in with the merge and none is triaged,
because disposition belongs to a triage pass and not to an integrator
(T-083's ruling), so they stay `status: suggested` exactly as filed.

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's own text, the verdict and
  the verifier's self-correction are preserved byte-untouched** — this
  checkpoint made NO in-place repairs to any of them, including to the
  false *"`T-123-s10`'s entire ask"* sentence at line 139. **That is the
  ruling above, applied to this card's own text**, and the correction is
  written into the `## Integration` section instead, where it is
  permanent and attributed.
- **ROADMAP — TICKED on the census and the byte-budget line, NOT on
  progress.** T-132 carries `feature: F-01` as **inherited backlog, not
  F-04 slice content** (T-129's, T-130's and T-127's precedent), so
  F-04's "4 of 7" line does not move — **fourth consecutive merge**. The
  milestone-4 census was **re-derived on disk rather than carried**:
  **96** cards carry `milestone: 4` — F-01 9, F-02 43, F-03 12, F-04 7,
  F-06 25 — every figure identical to T-127's, because T-132 was already
  counted and this merge's four new files are suggestions, which carry no
  milestone.
- **ARCHITECTURE — NOT TOUCHED, and that is a DERIVATION rather than a
  skip.** Rule 3 says update it *if any interface moved*. C-01 is
  `method/` and its row reads *"The convention: templates, formats,
  roles, interviews — built (v0.1.6)"*. **No format moved**: no field, no
  status, no stage, no template — three rule bodies changed and the
  version stamp did not. `snapshot_version_matches_the_live_method_stamps`
  is `ok`, which is the enforced proof that the stamp, the
  `plan-interview.md` stamp and `METHOD_SNAPSHOT_VERSION` still agree at
  **0.1.6**. **AND THE FENCE COULD NOT HAVE BUMPED IT EVEN IF A BUMP WERE
  OWED** — a bump is a three-file commit whose third file is
  `app/src-tauri/src/agent/kit.rs`, outside `[method/lane-protocol.md,
  method/roles/integrator.md, method/tasks/TASK-FORMAT.md]`. So "no bump
  owed" and "no bump possible" coincide here, and only the first is a
  judgement. The byte-budget entry does not move either: the graph is
  unchanged at **944 590 bytes — 94.46%, 55 410 bytes of headroom**, and
  **this is the first merge in that series to spend NOTHING**, because no
  indexed file moved at all.
- **CONVENTIONS — NOT TOUCHED.** It was outside this card's fence, and
  the seven edits queued at its seat are unchanged — see "Next up" item 2.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The one decision inside this card — *a
  prohibition binds the complement of a seat when it names a COLLISION,
  and per-seat when it names an AUTHORITY* — is a rule of the method, and
  it is recorded in `method/lane-protocol.md` where the rule lives, not
  as an architecture decision about this product.
- **`graph.json` NOT REGENERATED and NOT COMMITTED**, because the gate
  was asked twice and said CURRENT both times, and no path in this merge
  is in any walk that feeds it. **Said out loud rather than left silent:
  a skipped regen is news.**

## Provenance — SELF-DECLARED, never read off a trailer

T-132 is **built by `claude-opus-5`** — twice, the second time by a FRESH
executor after the rejection, as `TASK-FORMAT.md` requires — **verified
by a second `claude-opus-5` session**, and **integrated by a THIRD
`claude-opus-5` session** that neither wrote nor reviewed the lane's
commits before opening them. **`review: same-model` is the honest
label.** **The `Co-Authored-By` trailer on this lane's commits is a
harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened it.

**97 done cards — 72 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 72 + 19 + 5 + 1 = 97. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented from T-127's figures** — the two
agree, which is the only way to know they do.

## What ACTUALLY reached the human's running app

**NOTHING, AND THE CHANNEL IS CLOSED TWICE OVER.** **ZERO of this merge's
eight paths are under `app/src-tauri/**` or `app/src/**`**, so neither of
the app's two trigger sets is touched by the diff at all. The channel is
closed a second time by the CHECKOUT: the vite serving 1420 has
`/Users/ujju/Projects/nputer-app/app` as its cwd — @human's own checkout,
six merges behind — and `app/node_modules/@nputer/parser` is a
**RELATIVE** symlink, so it resolves inside that checkout with its own
`lib/parser/dist`. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE ANSWER
TO THE DEPENDENCY QUESTION** (integrator.md rule 2), and this integration
DID rebuild `lib/parser/dist` and DID recompile Rust into
`app/src-tauri/target/` — the latter because `TASK-FORMAT.md` is
`include_str!`'d, which is a dependency channel this merge's diff does
name. **Both land in directories the running app does not read.**

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **23:49:32** (before any
command that writes) and again after the merge, the suites and every
gate. **Every reading identical.** The **anchored** process match —
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'` — reports
pid **53350**, started **2026-08-25 19:43:47**, the same pid and start
time T-104's, T-126's, T-129's, T-130's and T-127's checkpoints recorded,
so **@human has not restarted their app in six integrations**. A pid and
a start time are live-environment facts, not functions of a tree, and
both are already stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were checked and all six were present, so **no fresh dependency
install was owed and no `npm ci` was run.** **The repair is still item 9
below, unwritten after FOURTEEN consecutive merges performed it by hand.**

**No process from this integration survives.** Scratch port **15920**
(e2e) was `lsof`-read free before the bind and read back at zero rows
afterwards, with the times recorded above; **a probe reserves nothing, so
the runner's own bind is what proves the port was free.** **ONE UNTRACKED
FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS INTEGRATION'S.** The
zero-byte `z` (dated 2026-08-23) is still there for the **twenty-sixth**
checkpoint running — not this integrator's, not this merge's, not staged,
**left alone**, and named here because `integrator.md` rule 4 asks for
exactly that. **No `pkill`. No `npm ci`. No `cargo clean`. No `git
update-ref`, no force-push, no history rewriting.** Be precise rather
than claiming more than is true: this integration's `cargo test` run and
its three `nputer-index` invocations all WROTE to main's
`app/src-tauri/target/`, which reads **3.7 GB**, as any cargo run must.
**NO sibling worktree was entered or modified** — `../nputer-T-132`,
`../nputer-T-133`, `../nputer-app` and `../arch-verify` were read with
`git -C … rev-parse` and `lsof` only, and `../nputer-T-132` was removed
only after this checkpoint. No path was staged by wildcard; **`git add
-A` was never used**, and every write used `git commit -- <paths>` so it
could not sweep another hand's index.

## In progress / broken right now

**NOTHING IS BROKEN, AND THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED.**
**ONE** lane holds a fence — **T-133** (`building`, `[tools/e2e]`). Read
`git worktree list` and the branch tip rather than any table here.

**ALL OF `method/` IS RELEASED.**

## Next up

1. **`T-135` IS THE CARD THIS MERGE MOST DIRECTLY UNBLOCKS, AND IT MUST
   READ THE T-127 CHECKPOINT'S FIRST SECTION BEFORE IT IS PLANNED.**
   `planned`, fence `[crate-index, method/]` — **both now FREE**. It
   would key ceremony to the observed graph, and that graph **cannot see
   a Rust `mod`/path-expression dependency**: a `crate::b::pong()` pair
   is a genuine mutual compile-time dependency that emits ZERO edges and
   is ACYCLIC to both `arch drift` and `arch cycles`. A ceremony tier
   derived from observed edges is derived from a graph blind to a whole
   class of Rust dependency.
2. **`docs/CONVENTIONS.md` IS FREE AND SEVEN EDITS ARE QUEUED AT ITS
   SEAT, ACROSS THREE BULLETS** — `T-104-s5` carries the argument.
   **THE COMMAND LIST — one edit, `T-127-s5`**: `arch cycles` ships
   undocumented, with its four exit codes and its registry-only scope
   ready to paste. **THE RANGE RULE BULLET — two edits, to `T-093`**
   (`[docs/CONVENTIONS.md]`, `planned`): `T-091-s3`'s
   trigger-beside-the-ref clause and the `bdada11` sharpening, **both
   observed live again at this merge**. **AND THIS MERGE ADDS A THIRD
   CANDIDATE TO THAT BULLET**: `<merge-base>..<tip>` was right on paths
   and **wrong on bytes** here, which is the first live measurement of
   the two-metric gap for that form. **THE POISON DRILL BULLET — four
   edits, to `T-092`** (`[docs/CONVENTIONS.md, app-agent]`, `planned`):
   `T-079-s3` items 2–3, `T-130-s1`, T-129's binary-level generalisation,
   and the `.vtarget` lesson — a scratch `CARGO_TARGET_DIR` must be NAMED
   to match an ignore rule, because the protection is the name and not
   the location. **FOUR OF THE SEVEN ARE ONE GAP SEEN FOUR WAYS**: the
   bullet rules how a restoration is PROVED and never says what restoring
   MEANS. **Take them together or the bullet gets patched four times and
   still does not say it.**
3. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE, AND ITS SEAT IS NOW FREE.** `git grep -n
   "merge-tree" method/` still returns **zero rows**, re-checked at this
   ref, for the fifth checkpoint running. **`method/` is released, so
   this is now takeable** — and this merge hands it the exit-1 case it
   was missing: the forecast's tree is the merge's tree ONLY on exit 0,
   and on exit 1 the path list still holds while the tree does not.
4. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
   EXIST.** Filed by the verifier, ruled FILE-not-repair by this
   checkpoint with reasons, and **its fix is now unfenced**: both halves
   are inside `method/`, which came free with this merge. Prefer its
   option (1) — write the rule in rule 4 beside the two prohibitions that
   name a collision — because option (2) alone leaves violation (a)
   unprohibited and leaves `T-123-s10` undischarged. **The positive
   control it asks for is the load-bearing part**: state the rule so an
   atomic stamp-and-commit under a running integrator still passes.
5. **THE GAP IN RULING THIRTEEN THIS CHECKPOINT FOUND, WHICH HAS NO
   OWNER.** The clause sorts by WHEN a defect became false and never by
   WHO may write the fix, and its one-command test has no answer for a
   claim the merge introduces already false. **Two consecutive
   checkpoints have declined its repair half on the second axis.** It
   belongs beside item 4, in the same file, and filing it is a triage's
   call.
6. **`T-126-s3` — FOUR WRITTEN STATEMENTS ABOUT C-15 ARE FALSE ON MAIN**
   and have been for three checkpoints. The registry `paths:` entry names
   a deleted file, the module header says `lib.rs` does not declare the
   module and that no command registers it, and `T-110-s9`'s EDIT ONE is
   still live. **Nothing reds.** Fence `[app-dispatch,
   docs/architecture/components/]`, both FREE. Item 1 fires T-024's
   three-fixture rule; item 3 IS `T-110-s9`, so **one lane should take
   all of it.**
7. **`T-127-s1` — THE SURVIVING CYCLE, WITH ITS MEASUREMENT AND ITS
   PARTITION ALREADY WRITTEN.** The fix needs `app-shell` (the
   `app/test/**` fixtures) and `lib-parser` if a component ID moves.
   **Both FREE.** It ships with the measured cost (6 of 973), the
   recommended four-node partition and the reason a smaller one is wrong.
8. **`T-127-s2` — THE DOCS WATCHER IS THE FENCE WORD WORTH CUTTING.** A
   word for C-10 frees 2 of 8 fences outright and makes 2 more honest.
   **`T-127-s4` is its warning label**: a `touch_slugs:` edit is
   invisible to every suite in this repository — measured 973/973 green
   under one — so **declaring a component is loud and re-drawing a fence
   is silent**, and the silent one changes who may write to a file.
9. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — FOURTEENTH
   CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
   DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one
   step — `lsof -p <pid>` for the holder's cwd, compared against the
   checkout you are installing into.** Fence `[docs/CONVENTIONS.md]`,
   **FREE**.
10. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64 — a false
    sentence, never a false verdict; (b) the live positive control is
    brittle to a shared closing hop. Fence `[crate-index]`, **FREE**.
11. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, **HELD by
    `T-133`**.
12. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
    unperformable under a path-granular fence, and the ruling its
    conflict rests on is not in `method/`. **The two are one card, and
    `method/` is now entirely free**, so nothing blocks it.
13. **`T-125` IS FULLY UNBLOCKED** (`[app-agent, app-shell,
    docs/architecture/components/]`). **`T-107-s4`** needs `app/test/**`,
    free; read it beside **`T-110-s9`**.
14. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — `T-134`'s subject arriving early. Both FREE.
15. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body, `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence. **AND NOW A FOURTH INTERMITTENT WANTS A
    HOME**: `T-120-s3`'s mtime signature is measured at **3 red in 9** on
    unfixed code — see its section above. Fence `[tools/e2e]`, HELD.
16. **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never
    a panic" and was false for this class; `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, FREE). **`T-129-s2`**, **`T-129-s3`**,
    **`T-129-s5`** are `crate-index`, all FREE, and should be read beside
    item 10 — same file's neighbourhood.
17. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**, because `extract::ts::Cx::scan` descends every
    named child of the whole tree. Measured: **exit 0 as `.rs`, exit 134
    as `.ts`**, and TS `namespace` chains abort at **2 000** against
    Rust's tightest **3 000**, so **TypeScript is the MORE exposed
    language**. **If you are about to cite T-129's card for the negative
    result, cite this paragraph beside it.**
18. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals;
    the C-09 → C-08 direction has THREE closing edges and the card names
    two; the "TWO cycles" claim went stale rather than miscounting. The
    corrections live in that card's own lane text, verdict and
    `## Integration` section. Filed, not repaired, on the same ruling
    this merge makes citable.
19. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO
    UNPINNED GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`,
    free. **`T-104-s4`** — four defects in T-104's own criteria.
    **`T-108-s1`** — the fourth stale citation. **`T-108-s4`** — the
    pathspec rule needs a ROOT clause. **`T-126-s5`**, **`T-126-s6`**.
20. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND ELEVEN AND WANTS AN
    ELEVENTH TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5`, `T-126-s1`…`s7`, `T-129-s1`…`s5`,
    `T-130-s1`…`s2`, `T-127-s1`…`s5` and now `T-132-s1`…`s4` are
    untriaged. **`T-130-s1`'s OWN ROUTING LINE IS STILL STALE** — it says
    `docs/CONVENTIONS.md` is *"held by T-104"*; `T-104` is `done` and the
    seat is `T-092`. Recorded rather than edited, on the same ruling as
    everything else here.
21. **THE BOARD-TRUTH RULING** — EIGHTEENTH ask. **A PATTERN COUNT IN THE
    FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column still
    closes at the first push, and `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This was the **SEVENTH** brief in the deliberately-thin
format, and the first to declare **FOUR** limits up front — *it does not
protect an ARGUMENT*, *atmosphere figures slip through and the figure AND
its qualifier are suspect*, *it does not stop me being stale*, and **new
at this trial**, *a summarised finding loses the findings inside it*. The
fourth limit came with a remedy the brief applied to itself: it replaced
its own précis of the verifier's work with **a pointer to three commits
in reading order**. **That worked, and it is the finding of this trial** —
every substantive figure in this checkpoint's first four sections came
out of `aabbb3c`, `83a85cc` and `9b3b923`, and none of them could have
survived a summary. Sorted into the four categories the brief asked for.

1. **TWO ATMOSPHERE DURATIONS, BOTH INFLATED, BOTH SETTLED BY ONE
   COMMAND.** *"A new gate landed on main AN HOUR AGO"* — `ad3ac8a` is
   **23:17:51** and this integration's first command ran at **23:49:32**,
   so **thirty-two minutes**. *"An integrator got that exactly right AN
   HOUR AGO"* — T-127's checkpoint `4f3de7e` is **23:42:46**, so **seven
   minutes**. Neither figure is load-bearing and both are wrong in the
   same direction, which is the tell. This is CONVENTIONS' own **AN
   UNREFED DURATION GOES STALE EXACTLY THE WAY AN UNREFED COUNT DOES**,
   arriving in a brief instead of in a doc — and `git log -1
   --format=%ci` settles it, which is the same command that bullet names.
2. **ONE IMPRECISION ABOUT THE TIP, IN THE SENTENCE TELLING ME TO DERIVE
   IT.** *"The tip is a VERDICT commit, not the lane's last work
   commit."* The tip `83a85cc` is the verifier's **self-correction**,
   which sits one commit ABOVE the verdict `aabbb3c` — and the brief's own
   reading list distinguishes them correctly two paragraphs earlier. A
   hand that took the sentence at face value and merged `aabbb3c` would
   have dropped the 65-line correction carrying the nine-run mtime tally
   — **the single most useful measurement in the whole thread**. The
   instruction to derive is what makes the imprecision harmless, and that
   is the third consecutive trial where the brief's most useful sentence
   was about its own unreliability.
3. **EVERY PREDICTION FIRED, AND ONE FIRED HARDER THAN PREDICTED.** *"The
   merge-tree forecast will conflict, on one line, and that is
   expected"*: exit 1, one file, one hunk, one line, base `planned` /
   main `building` / lane `verifying`, resolution `verifying` — exact.
   **What the brief did not predict, and what is the better evidence, is
   the ARITHMETIC**: this is the first merge in the record where the
   lane's work and main's advance are NOT disjoint, `comm -12` returns
   exactly the card, and 8 + 26 − 1 = 33. *"`cargo test` is owed"*:
   correct, and now proved from cargo's own dep-info rather than from
   reading `kit.rs` — and the same measurement shows two of the three
   fenced files are NOT compiled in. *"The method snapshot version should
   stay 0.1.6 — derive that"*: derived, and `snapshot_version_matches…`
   is `ok`. *"The DOCS GATE does not fire on `method/`-only paths"*:
   measured, exit 0, *"none under docs/"*. *"`arch cycles` exits 1 by
   design — read it unpiped"*: exit 1, 529 bytes on stderr, stdout empty.
   *"`npm run typecheck` from `app/` does not exist"*: re-derived, exit 1,
   scripts are exactly the five named. *"Derive counts against the
   `running N tests` headers"*: 497 = 494 + 3. *"Ask GRAPH REGEN twice and
   never confirm by byte count"*: asked twice, CURRENT twice — **and the
   trap did NOT fire, for the reason T-127's checkpoint identified**:
   this checkpoint writes no fixture. The brief stated the trap as a
   count (*"fired at four checkpoints"*) where the discriminator is a
   property, and the property is what held.
4. **THE ARGUMENTS WERE ALL SOUND AND THE SHARPEST ONE WAS QUOTED RATHER
   THAN PARAPHRASED.** *"Do not let the conflict be silently resolved
   away — it is the best evidence the rule has"*: correct, and it is the
   first section of this file. *"Treat the figure AND its qualifier as
   suspect"*: applied, and it is what caught both durations. *"Rewriting
   technical analysis is a LANE write, and an integrator holds no lane"*:
   **the load-bearing argument of this checkpoint**, and the brief was
   right to quote T-127's ruling instead of restating it — a paraphrase
   would have lost the PROTOCOL-writes clause, which is the half that
   decides. **The one argument the brief made that this checkpoint had to
   DECIDE rather than accept was whether `T-132-s4` is repaired or
   filed**, and the brief was right not to answer it: it set out the
   card's false claim, the shipped blast radius, and the precedent, and
   asked for a ruling. That is exactly the shape a decision should arrive
   in.
5. **WHAT THE THIN FORMAT COST ON ITS SEVENTH TRIAL: THREE ERRORS, ALL
   CHEAP, ALL IN THE CATEGORIES IT NAMED IN ADVANCE.** Two inflated
   durations and one imprecise sentence about the tip. **NONE WAS IN AN
   ARGUMENT**, which is the sixth consecutive trial where the arguments
   held. **THE FOURTH LIMIT'S REMEDY — replace a summary with a
   POINTER — is the one to keep.** It cost the brief three lines and
   bought this checkpoint the nine-run tally, the atomicity
   counterexample, the fourteen-file boundary and the false "entire ask"
   claim, none of which survives compression. **The remedy generalises:
   where a brief would summarise another hand's finding, name the commit
   instead.**
