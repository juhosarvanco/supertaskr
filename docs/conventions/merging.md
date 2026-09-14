# The merge: which range, which regeneration, which reading

The pair of commits a merge's diff means, the graph regeneration it owes, the bands read at the checkpoint, and the subject the checkpoint commit opens with.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- THE RANGE RULE: WHICH TWO COMMITS "THE MERGE'S DIFF" MEANS, AND IT IS
  A DIFFERENT PAIR BEFORE THE MERGE EXISTS (T-083, correcting the single
  notation the two gate bullets below carried from T-046 to `ddcc8bb`).
  GRAPH REGEN and BOOT GATE both fire on "the merge's diff", and both
  are addressed to TWO readers: the INTEGRATOR, who has a merge commit,
  and the EXECUTOR, who does not — BOOT GATE assigns the executor in as
  many words ("THE EXECUTOR RUNS IT TOO, on the same trigger, before
  handing off"). ONE IDEA IN TWO POSITIONS: this rule is about WHICH TWO
  COMMITS YOU COMPARE and never about the notation, and it is the
  RIGHT-HAND endpoint that decides the left one.

  | you are | run this | why |
  |---|---|---|
  | AT the merge (integrator) | `git diff --name-only <main-before-the-merge>..<the merge commit>` | the merge commit already contains both parents, so this IS what the merge added to main |
  | BEFORE the merge (executor) | `TREE=$(git merge-tree --write-tree <main tip> HEAD)` then `git diff --name-only <main tip> "$TREE"` | there is no merge commit to point at, so BUILD the merge's tree and diff main against that — the same question, answered without writing a commit or moving a ref |

  **NEVER `<merge-base>..<the merge commit>`.** The merge-base is the
  branch POINT, so that range also carries everything MAIN did in the
  meantime — work that already passed this gate at its own merge.
  RE-MEASURED at T-027's merge `dc3ef5b`: the boot trigger matches **9**
  paths under the prescribed range and **36** under that one, and the
  extra **27** are T-014's indexer crate, already merged at `bdada11`
  and gated there.
  **AND NEVER `<main>..HEAD` BEFORE THE MERGE**, which is the notation
  this rule used to hand to both readers. `git diff A..B` is `git diff A
  B`: a symmetric comparison of two divergent tips, so MAIN's own newer
  work comes back IN REVERSE, as though this branch had modified it.
  Measured on T-078's lane at main-before `d92dceb` and tip `d219482`:
  two dots return **76** paths, three dots and the merge-tree form
  return **16**, and the merge `fed70a2` itself changed **16**.
  **THE THREE-DOT FORM IS THE FORBIDDEN RANGE, SPELLED SO THAT IT LOOKS
  LIKE A REFINEMENT OF THE PRESCRIBED ONE.** `A...B` is DEFINITIONALLY
  `$(git merge-base A B)..B`. So `main...HEAD` IS `<merge-base>..HEAD`,
  the range banned by name two paragraphs up, and QUOTING THE BAN DOES
  NOT PROTECT YOU: this pipeline's own architect computed
  `d92dceb...d219482` in a dispatch brief while stating the rule
  correctly, and reached the right answer by the forbidden route.
  What makes
  three dots harmless before the merge is not the notation but the
  right-hand endpoint — HEAD is the BRANCH TIP there, merge-base(main,
  tip) is the branch point, and branch-point..tip is exactly the lane's
  own work. At the merge the same spelling COLLAPSES instead:
  `<main-before>` is an ANCESTOR of the merge commit, so
  merge-base(main-before, merge) IS main-before and three dots returns
  the prescribed set unchanged.
  `git merge-base --is-ancestor 99791ea 4683566` exits
  **0**, and at the merge `99791ea..4683566` and `99791ea...4683566`
  both return **12** paths; before it, against the branch tip instead,
  `99791ea..72bc98a` returns **60** and `99791ea...72bc98a` returns
  **12**.
  **The prescribed and the forbidden forms are
  indistinguishable exactly where this rule is addressed, and differ
  only where it used to say nothing** — so the ban has to name the
  PAIR, not the punctuation.
  **WHY `merge-tree` AND NOT THREE DOTS, since both are right before the
  merge.** Three dots answers "what has my branch changed since it was
  cut", which is a PROXY; `merge-tree` answers the gate's own question,
  "what will the merge's diff be", by building the merge's tree. Scored
  over the **31** first-parent merges on main from BOOT GATE's own merge
  `94ee306` through `ddcc8bb`, each pre-merge form against that merge's
  own later `M^1..M` diff. **A SCORE WITHOUT ITS METRIC IS NOT A
  FIGURE** — there are two metrics here and they disagree:

  | pre-merge form | PATH-FOR-PATH (`--name-only`, sorted, `cmp`) | BYTE-FOR-BYTE (whole patch, `cmp`) |
  |---|---|---|
  | `merge-tree --write-tree` | **29** of 31 | **29** of 31, the same 29 |
  | three dots | **30** of 31 | **24** of 31 |
  | pre-merge two dots | **3** of 31 | **3** of 31 |

  **THE ARGUMENT IS THE GAP BETWEEN THE COLUMNS, NOT EITHER COLUMN ON
  ITS OWN.** `merge-tree` scores the same under both metrics because it
  is not forecasting the merge, it IS the merge's tree: when it answers
  at all it answers in the merge's own bytes, and its two misses are the
  same two misses. Three dots is the only form whose two scores move,
  and the SIX merges it drops between them are six where it names
  EXACTLY the right paths and states them against the wrong baseline —
  `91ab46e`, `827511e`, `bdada11`, `64469dd`, `3b0d974` and `f4b38c8`,
  every one a merge where main and the branch had both touched the same
  file.
  The single merge where three dots scores path-for-path and
  `merge-tree` does not is T-014's `bdada11`, where `merge-tree
  --write-tree` exits **1** and prints CONFLICT instead of a tree.
  A scoreboard that counts a refusal as a miss is scoring the
  wrong thing. **READ `merge-tree`'s EXIT CODE** — 0 is a tree, 1 is a
  conflict report, and a command substitution that swallows it hands you
  an EMPTY forecast wearing the costume of a clean gate.
  At T-028's merge `634c405` NEITHER form predicts under EITHER metric,
  because the integrator wrote into the merge commit itself
  (`tools/e2e/tests/window-contract.spec.ts` differs from BOTH parents
  there): no pre-merge forecast can see a file that does not exist on
  either side yet. That is the honest ceiling on the recommended
  command, and it is one merge in thirty-one.
  **RE-DERIVE BOTH COLUMNS RATHER THAN QUOTING THEM**, the way this
  bullet's flip list asks below. For each merge M the truth is `git diff
  M^1 M`; the three forecasts are `git diff M^1 $(git merge-tree
  --write-tree M^1 M^2)`, `git diff M^1...M^2` and `git diff M^1..M^2`;
  `cmp` each against the truth TWICE, once with `--name-only` through
  `sort` for the left column and once on the whole patch for the right.
  Forgiving `index` lines and nothing else is a THIRD metric — it lifts
  three dots to **25** and moves neither other row — and it needs its
  own label for exactly the same reason.
  **THE SENTENCE THAT SAID THIS NEVER CHANGES A GATE'S ANSWER IS FALSE,
  AND WAS FALSE LONG BEFORE ANYONE MEASURED IT.**
  "It has never
  yet changed WHETHER the gate fires — both derivations fired all six
  times." Derived at `ddcc8bb` across those same 31 merges: the
  prescribed range says BOOT GATE is NOT owed **10** times and the naive
  range fires anyway on **8** of them; it says GRAPH REGEN is not owed
  **5** times and the naive range fires anyway on **5 of 5**. THIRTEEN
  FLIPS IN FIFTEEN CHANCES, over TWELVE distinct merges, chronologically
  and BY GATE — BOOT GATE at T-030 `59558de`, T-045 `3b0d974`, T-054
  `f58fc2b`, T-055 `20c45d4`, T-058 `7c6c5aa`, T-076 `79ae34a` (0 paths
  against 5), T-078 `fed70a2` (0 against 6) and T-080 `4683566` (0
  against 4); GRAPH REGEN at T-047 `3f2eb1e`, T-060 `91ab46e`, T-043
  `38886d3`, T-069 `7e3e8b5` (0 against 18) and T-078 `fed70a2` again (0
  against 18), which is the one merge that flips BOTH gates at once.
  Not "rarely": when the two derivations disagree at all, the naive one
  manufactures a gate run MORE OFTEN THAN NOT.
  DERIVE THE LIST, NEVER QUOTE IT — for each merge M,
  compare `git diff --name-only M^1..M` against
  `git diff --name-only $(git merge-base M^1 M^2)..M` and match each
  side against the gate's own trigger.
  **THE SENTENCE WAS NEVER TRUE — NOT FOR ONE COMMIT**, derived at
  T-083's merge `5c60e5a` because this bullet said "false for weeks"
  until someone checked: it was WRITTEN at `98f931e`, 2026-08-17
  05:50, and its earliest counterexample — T-030's merge `59558de` —
  landed at 02:21 the same morning, three and a half hours EARLIER and
  an ancestor of the commit that wrote it (`git merge-base
  --is-ancestor 59558de 98f931e` exits 0).
  AN UNREFED
  DURATION GOES STALE EXACTLY THE WAY AN UNREFED COUNT DOES, and one
  `git log --format=%ci` settles both.
  `cb3aa31` lists T-076's flip under GRAPH REGEN,
  but at `79ae34a` GRAPH is 13 against 13 and it is BOOT GATE that goes
  0 against 5 — the numbers were right and the gate was not (T-083-s1).
  **EVERY ERROR MEASURED HERE IS IN THE OVER-FIRING DIRECTION.**
  Do not read that as a licence — it
  is a property of this repository's history, re-derivable in a second,
  not a guarantee git gives you.
  **AND THE TWO COSTS DESERVE DIFFERENT WEIGHT**, because this rule used
  to be justified only by the smaller one. Presentation: it changes what
  you tell the human the merge touched, and a trigger set 4x too wide is
  a checkpoint that lies. Correctness: it changes WHETHER A GATE RUNS AT
  ALL — the twelve merges above. And the executor's failure is the worse
  of the two, because a lane reported as touching trees it never opened
  is a false red on somebody else's work, which is the one kind of noise
  nobody can dismiss by looking at it.
  **AND A FORECAST IS MEASURED, NEVER EXTRAPOLATED — ITS INVARIANT IS
  THE DELTA** (T-093, seventh triage).
  The technique
  that holds: build the merge tree with the recipe above, wrap it in a
  throwaway `git commit-tree` so no ref moves, check THAT out detached
  with its own `CARGO_TARGET_DIR` (POISON DRILL below says why), and run
  the gate there.
  So state the DELTA as the
  invariant and both ENDPOINTS as ref-bound, because a forecast checked
  by its delta alone would have reported "current" when it was not.
  The measurements this rule was derived from — the re-measured path
  counts at their own refs, the scoreboard over the thirty-one merges,
  and the thirteen flips in fifteen chances — are in
  docs/reference/08-landing.md (T-290), verbatim.

- GRAPH REGEN (T-009-s1's INTERIM rule, RETIRED at T-054 and replaced
  by this bullet — the retirement condition it carried, "when T-014's
  `index --check` becomes the gate", is met in the same commit that
  makes `index --check` a CI step): at any merge whose diff touches
  `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside docs/, regenerate the
  committed graph — `SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p supertaskr-index
  --test self_graph -- --ignored` — and commit docs/architecture/graph.json
  **with the CHECKPOINT**.
  **`*.rs` WAS ADDED 2026-08-25 AND THE GAP IT CLOSES WAS LIVE FOR ONE
  NIGHT** (`T-123-s5`):
  THE STANDING LESSON: the suffix list is a signpost that goes
  stale the day a language is added, and `index --check` is the
  authority — **ASK THE GATE**, which is why the gap cost nothing.
  **"The merge's diff" is the PAIR OF COMMITS THE RANGE RULE above
  names, and it is not the same pair before the merge exists as at it.**
  **THE TRIGGER IS DELIBERATELY WIDER THAN THE WALK, AND THE REGEN IS A
  NO-OP UNLESS AN INDEXED FILE MOVED** (T-054-s1): no suffix rule can
  match the walk — see THE FOUR WALKS above — because `.supertaskrignore`
  excludes docs/, tools/ AND the indexer's own fixture trees, so a diff
  confined to `tools/**` MATCHES this trigger and CANNOT move the graph
  by construction (T-054's branch and T-058's merge are the measured
  examples). DO NOT NARROW THE WORDING TO CHASE THE WALK — a trigger
  that restates `.supertaskrignore` goes stale the day that file changes,
  and over-firing is the SAFE direction. **ASK THE GATE INSTEAD OF
  PREDICTING**: `cargo run -p supertaskr-index -- index --check --root
  ../..` from app/src-tauri answers "did an indexed file move?" in about
  a second, and it is the same command the CI step runs.
  `index --check` is a written CI step and the ENFORCING
  copy since the repo's first push on 2026-08-29 (T-054-s4 closed at
  that push), and **the INTEGRATOR STILL RUNS IT BY HAND at the
  checkpoint and records the verdict there**. WHAT DID NOT RETIRE is
  the regen — `--check` DETECTS a stale graph, it never produces a fresh
  one. WHY THE CHECKPOINT AND NOT THE MERGE: the checkpoint edits
  INDEXED fixture files (app/test/architecture-dogfood.test.ts and
  app/test/map-dogfood-render.test.tsx), so a graph regenerated into the
  merge commit is stale again the moment those are reconciled (T-050:
  `index --check` exit 1 at the merge, 0 at the checkpoint).
  **AND THE PIN RECONCILIATION IS INTEGRATION-SEAT WORK: A LANE NEVER
  UPDATES THE PINS** (T-211). The dogfood fixtures a merge moves — the
  ids, the declared count, the relation table, the rendered node and
  edge totals — are reconciled AT THE CHECKPOINT, by whoever holds the
  integration checkout, never inside the lane whose merge moved them:
  **a lane re-pinning its own counts is asserting a total for a tree
  that does not exist yet**, stale the moment any other lane lands. A
  lane that finds a pin wrong states it in its notes and leaves the file
  alone. **READ THIS AS THE MERGE-MOVED CASE AND NOT AS DECLARING A
  COMPONENT ABOVE**, the one way a LANE legitimately writes those same
  files with its OWN diff; a MERGE REGEN alone moves only the two app
  fixtures. IF the regen cannot run THEN say so LOUDLY in the
  checkpoint, naming the reason — a skipped gate is news, never silence.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/08-landing.md (T-290), verbatim.

- HEALTH BANDS AT THE CHECKPOINT (T-156, ADR-020 decision 3; this bullet
  is the half that card's `[tools/e2e]` fence could not write, taken as
  `T-156-s1`) — **A REPORTER, NOT A FIFTH STANDING GATE, AND THE
  DISTINCTION IS THE POINT**: no tier acts on its answer, it declares no
  merge-diff trigger, and it is enumerated with `index --watch`, `arch`
  and the orphan drill rather than with the four gates above.
  RUN IT — from tools/e2e/, at every checkpoint:

      npm run health
      npm run health -- --readings <the checkpoint's captured output>

  **THE `--` IS LOAD-BEARING AND ITS ABSENCE IS LOUD** (the same npm
  behaviour the PORT RULE bullet measures): without it npm eats the flag
  and hands the script the bare path, which it refuses — *"this command
  takes flags, never paths"* — at exit 2. Four codes again: 0 clean, 1 a
  band is BREACHED, 2 called wrong, 3 the run could not read what it
  needed, and **3 takes precedence over 1** because a run that could not
  read three of its bands is not a claim about the tree however loud
  the breach it did read. The AUTHORITY is the frozen `EXIT` object in
  tools/e2e/scripts/health-bands.mjs, and the LIMITS are data in
  tools/e2e/scripts/health-bands.config.mjs, tuned by TRIAGE and never
  by the session that trips them — that file's header is the argument.
  **EXIT 3 IS THE DESIGNED ANSWER TODAY, NOT A BREAKAGE**: four bands are
  declared with no keeper and are named on every run, docs/STATE.md says
  so, and the two failures this bullet exists to prevent are reading
  that 3 as clean and "fixing" it.
  WHAT THE CHECKPOINT OWES, AND THE RECORD TEMPLATE CARRIES THE SHAPE
  (docs/checkpoints/TEMPLATE.md, Gates and Metrics): the CENSUS LINE and
  the EXIT, read unpiped, plus the readings that turn the three
  readings-authority bands from UNREAD into a reading — the output of
  `cargo test` and `index --check` from app/src-tauri/ and `npm test`
  from tools/e2e/, captured with a redirect and read from `$?` (a bare
  `| tee` hands you tee's status). The record's own `Gate runtime:`
  total is `machinery/gate-seconds`'s only reading, and its `Cold
  start:` and `Drift incidents:` lines are the two docs/NORTH_STAR.md
  indicators' only markers — **owed by the SESSION every time rather
  than by whoever noticed a problem**, because a denominator that
  collects successes only is worse than no band.
  **THE GRAPH BAND'S READING IS THE INTEGRATOR'S AND A LANE CANNOT HOLD
  IT HONESTLY**: `index --check` is `graph/budget-headroom-bytes`'s
  authority, and a worktree that has built anything with cargo has its
  own target directory inside the graph walk (`T-153-s3`, `T-111-s10`),
  so a lane's number is about the lane. Take it from the checkout the
  merge is integrated in, or record the band as not read and say which.
  **AND NOTHING MAY SCAN THE RECORDS FOR ANY OF THIS** (ADR-019's Records
  clause): the marker reaches the command hand-carried into `--readings`
  at the checkpoint that wrote it, never as a walk of docs/checkpoints/.
  **AND SINCE T-297 THE LOOP ITSELF IS TWO OF THE BANDS** (ADR-024
  decision 1, whose budgets they hold: 20 min/80K bounded, 75 min/310K
  standard, 100 min/450K guarded). `loop/cycle-budget-used` prices every
  card merged in this checkpoint's window from its own `T-NNN: dispatch
  stamp` commit to the merge that appended its reading;
  `loop/token-budget-used` sums the seats' own token figures out of
  their `## Meters` blocks. Both report the WORST card in the window as
  a SHARE of that card's own tier budget — one line has to hold three
  tiers whose budgets differ five-fold — and both go UNREAD rather than
  green when a card in the window cannot be priced whole: an unknown
  tier, a missing dispatch stamp, or a seat that stated no tokens, which
  is not a smaller number but a lower bound wearing a measurement's
  clothes. The cycle reading is a FLOOR and its derivation says so on
  every line it prints: the tree ends at the merge and CI green is
  minutes later in an API. The third reading is ADR-024's own —
  `loop/soft-verifier` flags a tier whose rejections fell to zero while
  its CI reds ROSE, on the conjunction only, and is wired, driven by the
  suite on a planted history, and UNREAD until a capture stamps a
  verdict outcome and a CI-red count on a reading.
  **A BREACH ON EITHER BAND IS A FINDING ABOUT THE PROCESS AND NEVER A
  GATE ON A LANE** — the disposition every tier of this reporter already
  has, restated because these two read a LANE'S OWN numbers and are the
  first ones anybody would try to enforce. The lane that overran is
  evidence, not the defect; the remedy is a card, and a tier repriced
  by triage rather than by the session it caught.
  **THE READINGS FILE IS THE ONE FILE UNDER docs/checkpoints/ THAT A
  PROGRAM READS, AND THE SENTENCE ABOVE IS NOT AMENDED** (ADR-024
  decision 3, captured by T-295): `docs/checkpoints/meters.jsonl` is
  written by the MERGE VERB, one JSON line per seat per merge, and never
  by a hand — while ADR-019's Records clause binds a suite, a gate or a
  generator, and the sentence above binds the hand-written MARKER LINES
  in a record, which still reach the command through `--readings` and
  are still walked by nothing. This reporter is none of those three and
  the loop bands parse no record's prose.
  WHAT THE CHECKPOINT OWES FOR THESE TWO: both readings QUOTED with the
  command that derived them — `npm run health`, from tools/e2e/ — in
  docs/checkpoints/TEMPLATE.md's Metrics section, which carries the two
  lines and the reason they are quotes rather than markers.
  THE CI DISPOSITION (`T-156-s1`): **LOCAL ONLY**, the disposition
  `index --watch`, `arch` and `npm run boot:orphan-drill` already have —
  it exits 3 at every ref while any band is unkept, so a step would red
  every push for no actionable signal (the AUDIT GATE POLICY's argument
  against `--deny warnings`); the readings that make it informative are
  the OUTPUTS of steps the job already runs; and a scheduled reporter
  would re-run the whole pipeline on a trigger workflow-parity does not
  pin ci.yml to. **Revisit this when the exit code can move** —
  `T-156-s4`'s subject — and not before.
  IT IS NOT IN "Build & test" ABOVE, DELIBERATELY, AND THE REASON IS
  MECHANICAL — the one the METHOD EVAL GATE bullet states, and the trap
  T-090 walked into while adding `npm run lint:docs`:
  `deriveExpectedSteps` in tools/e2e/tests/workflow-parity.spec.ts makes
  every command in those four bullets either a CI step or an argued
  `LOCAL_ONLY` entry, so adding `npm run health` to the tools/e2e
  command bullet alone reds that spec by name (`T-156-s1`). The doc half
  and the spec half are ONE commit across two packages, routed as
  **`T-156-s5`**; until it lands, this is the only place the command is
  written down.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/11-health.md (T-290), verbatim.

- THE CHECKPOINT COMMIT'S SUBJECT OPENS WITH `Checkpoint:` (T-182) — the
  commit that adds a record under `docs/checkpoints/` carries a subject
  beginning with that literal. **IT IS NOT A STYLE RULE: TWO RULES PARSE
  THE MARKER, AND BOTH DEGRADE IN SILENCE WITHOUT IT.** Consumer one is
  the DISPATCH bullet above, which picks a lane's base by it (its naming
  phrase is spelled around rather than quoted, because `rawBullet` in
  tools/e2e/scripts/dispatch-brief.mjs demands ONE bullet carry it).
  Consumer two is the triage band's window — `newestCheckpoint` in
  tools/e2e/scripts/health-bands.mjs, anchoring
  `triage/net-arrivals-per-window`. To both, an absent marker is
  indistinguishable from a night with no checkpoint: the window does
  not advance, the base names an older commit, and both keep reporting
  success — at `bd8a8e8` most record-adding commits carried no such
  subject (`git log --first-parent --diff-filter=A <range> --
  docs/checkpoints/` derives the count). **IT IS A CONVENTION HERE ONLY
  BECAUSE THE TRIGGER IS OUT OF FENCE**: the event to assert on is the
  COMMIT THAT ADDS A RECORD, already `T-167-s8`'s second trigger, so the
  guard joins there — **ROUTED to `T-167-s8`** with two facts:
  `--grep=^Checkpoint:` matches ANY line of a message, so a SUBJECT
  guard is strictly narrower than the band's own reader; and
  `newestCheckpoint` had no spec at `bd8a8e8`.
