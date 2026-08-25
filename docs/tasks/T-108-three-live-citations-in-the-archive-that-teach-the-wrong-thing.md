---
id: T-108
title: Three live citations in the archive teach the wrong thing — a falsified number labelled "measured", a figure that should be deleted rather than corrected, and a pin name no function carries
feature: F-01
milestone: 4
priority: 64
size: S
status: done
blocked_by: []
touches: [docs/tasks/T-027-interview-split-view.md, docs/tasks/T-025-agent-runner.md, docs/tasks/T-081-denial-reaches-the-screen.md]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-108 — code commit baba41b
verified_by:
review: self-verified
---

## ARCHITECT'S FENCE RULING — 2026-08-25, at `765924d`

**THIS CARD'S FENCE WAS `[docs/tasks/]` AND HAS BEEN NARROWED TO THE
THREE FILES IT ACTUALLY WRITES**, before dispatch, by the architect:

    docs/tasks/T-027-interview-split-view.md
    docs/tasks/T-025-agent-runner.md
    docs/tasks/T-081-denial-reaches-the-screen.md

All three are `status: done`. No live lane writes them.

**THE OLD FENCE WAS NOT MERELY WIDE — IT WAS UNSHIPPABLE, AND THE REASON
IS THE LANE PROTOCOL ITSELF.** `docs/tasks/` is where every dispatch
stamps `status: building` and where every integrator stamps `status:
done` and the `built_by` / `verified_by` / `review` fields. A lane
holding `docs/tasks/` as a directory therefore collides with **every
other lane's opening and closing move**, including its own integrator's.
Held strictly, it serialises the entire board behind one small
docs-correction card; held loosely, the fence is being ignored, which is
worse than not having one. **A fence that the project's own protocol
must violate to make progress is not a fence.**

**THE GENERAL RULE THIS EARNS, which is worth more than the card:**
a fence names the paths a lane WRITES, at the narrowest granularity that
still covers them — and **a bare `docs/tasks/` directory fence is never
correct**, for the reason above. Where a card edits a knowable, listed
set of cards, it fences those cards by path. Where a card genuinely
rewrites the whole archive, that is an L card whose plan pass has to
argue for stopping the board, not an S card that takes the directory by
default. **This belongs in the method rather than in this card**, and is
routed to `T-104`, the rulings vehicle, rather than written into
`docs/CONVENTIONS.md` from inside a lane.

**A CARD'S OWN FILE IS NEVER PART OF ITS FENCE, and this card is where
that became visible.** The dispatch stamp (`status: building`, `builder`)
and the integrator's closing stamp (`status: done`, `built_by`,
`verified_by`, `review`) are **protocol writes, not lane writes**: they
are made by the architect and the integrator, on a file no other lane
has any reason to touch, and they happen to every card whatever its
fence says. So the fence above deliberately omits
`docs/tasks/T-108-three-live-citations-*.md` even though this lane's
first commit writes it — the omission is correct, and listing it would
be the error. **This is the second reason a `docs/tasks/` directory
fence is wrong**: it makes every card's own protocol stamp look like a
fence violation, so the check has to be disabled to be usable, and a
check nobody can leave on is not a check.

**WHAT THE EXECUTOR MAY NOT DO** follows from that distinction rather
than from a list. It SHALL NOT write any `docs/tasks/` path outside the
three named above, and **suggestion files are the case to watch**: a
finding on this lane does not become `docs/tasks/T-108-sN-*.md` while
the lane runs. Findings go in the lane's report; the integrator files
them. The executor's own frontmatter is already stamped and SHALL be
left alone.

Absorbs: T-074-s5, T-043-s2, T-081-s8 (sixth triage, 2026-08-20). All
three files removed in this commit.

**Three citations in `docs/tasks/` are live, wrong, and teach a reader
something false. Each one has already been copied forward at least
once, and one of them is the SOURCE of a comment another card had to
correct.** They are one card because the fix is the same act — correct
in place, dated, with the derivation — and because the general rules
they earn are three faces of one discipline: **a figure or a name in the
archive is read as a measurement, so it has to be one.**

## ONE — T-027's plan section still teaches W−641, and calls it measured

`docs/tasks/T-027-interview-split-view.md` says all three of these,
verified live at `4d2f03c`:

- **Plan section**: *"Degradation, **measured rather than guessed**. …
  640 chat + 1px rule leaves the lens W−641: at 1440 → 799 (the design's
  own number), at 1280 → 639, at 1024 → 383, at 800 → 159."*
- **Implementation notes**: *"THE LENS GETS W−640, NOT W−641. The plan
  computed 799 at 1440 by adding the 1px rule to the 640. The app's box
  model is border-box, so the rule is INSIDE the 640 … 800 at 1440, 640
  at 1280, 384 at 1024."*
- **Verdict**: *"The lens is W−640 — 384 / 640 / 800 — which confirms
  the notes' correction of the plan's W−641."*

**Two corrections and the wrong original, in one file, with the wrong
one first and labelled MEASURED.** It was not measured; it was computed,
and computed wrongly. **That label is what makes this worse than the
sibling case T-074 already fixed**: a reader who stops at the plan
section has been told the number came from the app.

**IT IS THE SOURCE, NOT A COPY.** The falsified arithmetic reached
`GenesisScreen.tsx`'s comment from here — T-074 corrected the comment —
and the two lane specs that quote "W-641" quote it correctly, as the
thing that was wrong. **After T-074 the only live site still teaching
the wrong number is the plan section of the card that invented it.**

**And the fix adds the half T-027 never had.** The design of record does
not say 799 either: measured at `e83ee1d` over the
`data-screen-label="Interview"` artboard of
`docs/design/claudedesign_handoff/nputer app.dc.html` (file present at
`4d2f03c`), the chat rect is 640 / client 639 and the right half is
**798**, because the artboard is a 1440px border-box frame with 1px
window chrome; the same ratio in the app's chrome-less viewport gives
**800**. **799 is neither — it is what you get by subtracting the 1px
rule twice.**

## TWO — a plan figure that should be DELETED rather than corrected

`docs/tasks/T-025-agent-runner.md` §3 reads *"(14 files, ~60 KB — the
count CORRECTED BY T-043 from the plan's '13' … The byte figure is a
separate, still-wrong number and is left alone here: see T-043-s2)"*.
**Measured at `4d2f03c` over exactly the fourteen `include_str!`
sources: 14 files, 23,890 bytes (23.3 KiB)** — against "~60 KB", off by
a factor of about 2.5, in the opposite direction from the file count
that was already corrected.

**The recommendation is deletion, not correction, and the asymmetry is
the argument.** The COUNT is stable and load-bearing: adding a template
moves it, the parity walk asserts the table matches the directory, and a
wrong count sends a reader looking for a fifteenth file. **The byte
total is neither** — it is `include_str!` of fourteen live `method/`
documents that every method version bump rewrites, so it was already
stale by the next commit and will be stale again by the next reader. **A
number that no test can hold and that drifts by construction is worse in
a plan than no number.** If a size claim is wanted, the honest form is a
bound with a reason (*"the kickoff prompt carries tens of KB, not
hundreds"*) rather than a figure that reads like a measurement.

## THREE — a criterion cites a pin that does not exist, and the obvious check confirms it

T-081's seventh criterion requires *"THE existing
`an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
pin SHALL stay green"*. **No Rust function has that name.** At
`4d2f03c` the string appears in exactly three files, all prose
(`T-025-agent-runner.md`, T-081's card, and the finding), and `git grep
-n "fn an_in_band_auth_failure" -- '*.rs'` returns exactly one
definition:
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
in `app/src-tauri/tests/agent_runner.rs`, which is green. **The
criterion's SUBSTANCE is satisfied and its CITATION is unverifiable as
written.** The bad name predates T-081 — T-025's notes coined it and
T-081's planner copied it forward, while T-029's and T-069's notes cite
the CORRECT name four times between them, so the two spellings have
coexisted for several cards.

**AND THE MECHANICAL ROUTE DOES NOT FAIL — IT LIES.** Measured at
`5b14603`: `cargo test --test agent_runner <the phantom name>` prints
`test result: ok. 0 passed; 0 failed; 0 ignored; 73 filtered out` and
exits **0**. **A phantom pin name run as a filter reports SUCCESS** —
the same non-answer class as an empty exit code, and the reason this is
not cosmetic: the obvious way to check a cited pin actively confirms it.

**The rule this earns needs its own pathspec, which the finding learned
on itself.** The first draft said `git grep -- .`; that is self-defeating
and was measured so — writing the finding put the phantom string into
`docs/`, so the unrestricted search now reports a definition that does
not exist. **Restricted to `-- '*.rs'` it exits 1, correctly.**

## Acceptance criteria

- **T-027's PLAN SECTION SHALL BE CORRECTED IN PLACE, dated, with the
  derivation**, keeping its qualitative claims and removing the
  "measured" label from a computed number. THE DESIGN HALF SHALL BE
  ADDED — 798 in the artboard's border-box frame, 800 in the app's
  chrome-less viewport, and 799 is neither.
- **T-025 §3's BYTE FIGURE SHALL BE DELETED, not corrected**, and the
  reason SHALL be recorded in one clause: a number no test can hold and
  that every method bump moves is worse than none. IF a size claim
  survives THEN it is a bound with a reason, never digits.
- **T-025 §3's FILE COUNT SHALL BE LEFT AS IT IS** — 14, corrected, and
  load-bearing because the parity walk asserts the table matches the
  directory. The asymmetry between the two numbers is the point of this
  criterion and SHALL be stated where they sit.
- **BOTH LIVE CITATIONS OF THE PHANTOM PIN SHALL BE CORRECTED** —
  T-025's notes and T-081's criterion 7 — to the name the suite actually
  carries, and the corrected name SHALL be verified by a definition
  search restricted to `-- '*.rs'` before it is written.
- **THE RULE SHALL BE WRITTEN WHERE CRITERIA ARE WRITTEN**: a criterion
  that names a test names it by a string `git grep -- '*.rs'` finds as a
  DEFINITION. THE PATHSPEC IS PART OF THE RULE — the unrestricted form
  matches this very card's prose and reports a definition that does not
  exist.
- **THE FILTER TRAP SHALL BE NAMED BESIDE IT**: `cargo test --test <t>
  <name>` exits 0 on a name that matches nothing, so "the pin passes"
  and "the pin is not there" are the same output. Read the counts, not
  the code.
- **NO CORRECTION HERE SHALL DELETE HISTORY.** Every fix is in place with
  its date and derivation, on the precedent T-074 set twice — a card's
  own record of having been wrong is the thing that makes the archive
  trustworthy.
- **EVERY FIGURE THIS CARD WRITES SHALL CARRY THE REF IT WAS MEASURED
  AT**, and the kit byte total SHALL be re-derived at the card's own ref
  rather than copied from here — it is the exact class of number this
  card is about.

Verification: headless — the DOCS GATE fires on every `docs/tasks/`
path this card edits (a flat card owes three commands); run what it owes
and record which and their exits, including the parser suite, whose
smoke body parses the live tree. `cargo test` is NOT owed by these edits
and SHALL NOT be claimed as evidence — but the corrected pin name SHALL
be run once, by its real name, with the passed/filtered counts quoted
rather than the exit code. **This card adds no test body; that is stated
here rather than left silent**, per the drill's clause about bodies that
cannot be poisoned. @human: none.

## Integration — 2026-08-25, third hand `claude-opus-5`

Main-before **`5de8cb1`**, lane tip **`baba41b`** (derived with
`git rev-parse`, not taken from the brief), merge **`188262e`**,
checkpoint after it. **This card has no verifier and that is correct** —
size S with a docs-only diff keeps self-integration; its executor stopped
and reported only because integration is a serial resource. So the
integrator was the sole second pair of eyes and **read the diff rather
than the executor's report**. The lane's own text below and above is
preserved byte-untouched except for the two repairs named under
JUDGEMENT CALLS; everything in this section is the integrator's.

**THIS MERGE CLOSES A FENCE DIVERGENCE, AND THAT IS ITS QUIETEST
IMPORTANT EFFECT.** The narrowing above was written on the LANE branch
rather than on main, so for the whole life of this lane **main's copy of
this card still advertised `touches: [docs/tasks/]`** — the whole
directory. **Two separate lanes derived fence disjointness from main's
copy and got the wrong answer; one reported T-108 as holding every card
on the board.** The merge lands the narrowing and the two copies now
agree. **This is a live instance of `T-128`'s fourth finding** —
silent corruption of shared state, here by a stamp written on the wrong
side of a fence rather than by a raw ref move — and it is cited as one.
The ruling that earns the general rule is this card's own first section:
**a bare `docs/tasks/` fence is never correct**, because that directory
is where every dispatch and every integrator stamps frontmatter, so a
lane holding it collides with every other lane's opening and closing
move. Routed to `T-104`, unchanged.

### THE RANGE — every dot count at its own ref, proved as SETS

    TREE=$(git merge-tree --write-tree 5de8cb1 baba41b)  -> 537ed24d…, exit 0 (read from $? FIRST)
    git diff --name-only 5de8cb1 <TREE>       ->   4   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 5de8cb1..188262e     ->   4   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only 5de8cb1...baba41b    ->   4   (branch-only, three dots)
    git diff --name-only 765924d..5de8cb1     ->  79   main's advance under this lane
    git diff --name-only 5de8cb1..baba41b     ->  83   TWO DOTS, FORBIDDEN

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 79 PATHS — 20.75x — WHICH IS
THE WIDEST RATIO THIS PROJECT HAS RECORDED**, past T-116's 15.80x set
four hours earlier, and it is pure left-endpoint drift. Proved as SETS
and not only as counts: `comm -12` over the two sorted lists is
**EMPTY**, the union is **byte-identical** to the forbidden two-dot set
under `diff`, and 79 + 4 = 83. **A four-path docs lane the naive range
would report as having rewritten eighty-three files.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`537ed24dba1735042855b9ad1f85fc6c84f0e5b6` before the merge and
`git rev-parse HEAD^{tree}` returns the same after. Parents are
`5de8cb1` and `baba41b` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**FENCE DISJOINTNESS WAS PROVED AGAINST EVERY LIVE LANE AS SETS**, with
the lane list derived from `git worktree list | grep '[task/'` — FIVE
lanes, against THIRTEEN worktree entries, EIGHT of them detached
non-lanes and five of those at lane-shaped paths. For each of `T-104`,
`T-126`, `T-129` and `T-130`, `comm -12` of this merge's four paths
against that branch's own `merge-base..tip` diff is **EMPTY**. Declared
fences agree: none of `method/`, `docs/CONVENTIONS.md`, `app-agent`,
`app-shell`, `crate-index` or `tools/e2e` reaches `docs/tasks/`.

### MAIN MOVED ONCE UNDER THIS INTEGRATION — AND IT WAS DISCLOSED

After the merge `188262e` and during this checkpoint, the architect
committed **`723cfec`** — one new card, `docs/tasks/T-131-…md`, 273
insertions, nothing else, written with `git commit -- <path>` against an
empty index — and **said so unprompted**, naming what it did and did not
touch. **Every earlier instance of main moving under an integrator this
week was found by the integrator's own pre-write check.** The range above
is between two fixed commits and is unaffected; the pre-write check was
clean at the merge, with two `??` rows and `??` alone is not a ceremony.

**THE SUITES ARE NOT ONE CARD STALE, AND THAT IS DERIVED.** The T-131
file's mtime is **19:15** and its committed blob sha256 is
**byte-identical to the working file**, while every suite ran between
**19:17 and 19:22** — so all four suites parsed that card off disk before
it was tracked. Only its git status changed, and the walks that matter
read the tree, not the index. **The one figure it moved is named as the
architect's**: `lint:tokens` CONTROL is `git ls-files`-derived and went
**721 → 722**.

### THE GATES — asked, never predicted

| gate | trigger | on these 4 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — NOT OWED** | asked anyway, **exit 0 CURRENT**, three times |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | derived from this merge's own path set |
| DOCS GATE | a `docs/` path a code suite reads | **4 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **GRAPH REGEN — NOT OWED AND ASKED THREE TIMES ANYWAY.** All four
  paths are `docs/tasks/*.md`, and `.nputerignore` excludes `docs/`, so
  the graph cannot move. `index --check` was exit **0, CURRENT** at main
  `5de8cb1` BEFORE the merge, exit **0, CURRENT** after it, and exit
  **0, CURRENT** again after this checkpoint's doc writes — **933 486
  bytes · 179 files · 1987 symbols · 1903 edges at all three**, unmoved.
  **The third ask is the one that is not ceremony**: two integrations
  tonight met a second staleness whose headline figures were IDENTICAL on
  both sides, so a byte-count confirmation cannot substitute for asking.
  Here the gate was asked and it answered CURRENT; **no regen was
  performed and none was owed**, which is stated rather than left silent.
- **BOOT GATE — NOT OWED, DERIVED.** Zero of four paths are under
  `app/src-tauri/**` or `app/src/**` and neither manifest moves. No
  scratch port was taken for it.
- **DOCS GATE — exit 1, FIRES on 4 of 4, THREE suites**: `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **`cargo test from app/src-tauri/` is NOT owed and that is DERIVED** —
  this diff carries no `docs/architecture/components/` file and does not
  touch `docs/CONVENTIONS.md`; it was run anyway on integrator step 2,
  and the card's own Verification line already forbids claiming it as
  evidence for these edits. Invoked DIRECTLY from the repo root with the
  RANGE RULE's own path list, **never through `xargs`**, and
  `merge-tree`'s exit was read into a variable BEFORE the substitution.
  **13 derived readers across 4 suites**, census **130 sites in 22
  files**, **0 frontmatter issues**; `npm run lint:docs` (the whole-tree
  half, CI's step) exit **0**.

### THE SUITES — every count derived, every exit off an unpiped `$?`

`${PIPESTATUS[0]}` is EMPTY in zsh, so each exit came from its own `$?`
on an unpiped command redirected to a file, and **the COUNT was read as
well as the exit**.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **4.46s** — inside T-124's
  green band, and read first, before any assertion. **Unchanged from
  main's 460**: this merge contains zero `.rs` files.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from `lib/parser/`, run FIRST regardless.
- **app: `npm run build` exit 0** · **`npm test` 972/972 across 47 files,
  exit 0**. Unchanged from main's 972, which is the honest reading for a
  merge that adds no test body and no indexed file.
- **E2E: 171/171, exit 0**, on scratch port **15347** — `lsof`-read first
  (zero rows), bind-probed free on `127.0.0.1`, `0.0.0.0`, `::1` and
  `::`, and **RE-PROBED immediately before binding on both runs**,
  because a probe reserves nothing and an integrator tonight lost a port
  between its probe and its use. **TWO RUNS AND BOTH ARE DECLARED**: run
  1 post-merge at **2.0m**, run 2 post-doc-writes at **1.9m**, both
  171/171 exit 0, mtime body green in both.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0**,
  **`npm run lint:tokens --selftest` exit 0** and **`npm run lint:tokens`
  exit 0** at **TOKEN 135 / CONTROL 722, measured at the merge**.
  **CONTROL moved 721 → 722 and it is NOT this merge's** — see MAIN MOVED
  below — and it moves again at the checkpoint, because CONTROL's corpus
  is `git ls-files` and this checkpoint commits four new suggestion
  files.
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred
  from a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`. The `token-scan` mtime body passed.
- **THE THREE OWED SUITES RAN AGAIN AFTER THIS CHECKPOINT'S DOC WRITES**
  (T-081-s9), because every file this checkpoint writes is a code input:
  **app 972/972 exit 0, parser 268/268 exit 0, e2e 171/171 exit 0.**

### THE CARD'S OWN FIGURES, RE-DERIVED AT THE MERGE

- **THE KIT BYTE TOTAL IS 25 418 AT `188262e`** over exactly the fourteen
  `include_str!` sources enumerated from `KIT_FILES` — **identical to the
  executor's figure at `43f995a`**, because `method/` has not moved on
  main since. The predicted divergence did not occur, and the reason is
  worth stating: **`T-104`'s branch bumps `METHOD_SNAPSHOT_VERSION` to
  `"0.1.6"` and is UNMERGED**, so main still reads `"0.1.5"`.
- **THE DRIFT THE EXECUTOR MEASURED REPRODUCES EXACTLY**: 23 890 bytes at
  `4d2f03c` against 25 418 here, and **all +1 528 of it is
  `method/tasks/TASK-FORMAT.md` alone** (5 397 → 6 925), every other
  kit source byte-identical across the range. **`METHOD_SNAPSHOT_VERSION`
  reads `"0.1.5"` at BOTH ends**, so the figure drifted with no version
  bump to blame — **which is a stronger argument for "delete the figure
  rather than correct it" than the card's own**, and it is in the shipped
  text.
- **"EXACTLY 14 `include_str!` CALLS" NEEDS THE WORD *CALLS*, AND THE
  SAME TRAP SITS ON THE OTHER NUMBER.** `grep -c 'include_str!'` answers
  **17** (three are doc comments, lines 10, 21 and 391) and
  `grep -c 'rel:'` answers **15** (line 45 is the struct field
  declaration `pub rel: &'static str,`). Enumerated, both are **14** and
  they agree one-for-one. **The card's own advice — enumerate, do not
  grep a count — holds for the field it did not mention.**
- **THE FILTER TRAP REPRODUCES AND ITS DIGITS HAVE ALREADY MOVED**, which
  is the card's thesis measured on the card: at `188262e` the phantom
  prints `0 passed … 81 filtered out` and the real name `1 passed … 80
  filtered out`, **both exit 0**, against 77/76 at `43f995a`. The trap is
  the invariant; the counts are a function of a tree, and the card
  correctly stamped its ref on them.
- **THE PATHSPEC RULE AND ITS THIRD TRAP.** From the repository ROOT:
  `git grep -n "fn an_in_band_auth_failure" -- '*.rs'` is exit **0**, one
  definition; the phantom under the same pathspec is exit **1**;
  unrestricted `-- .` the phantom is exit **0** on six hits in three
  files. **Run from `app/src-tauri/` instead, the unrestricted form comes
  back exit 1** — CONVENTIONS' own subdirectory-scoping gotcha, walked
  into live by this integrator while checking this card's rule. **The
  rule needs a third clause: the ROOT is part of it too.** Filed as
  **`T-108-s4`**.
- **The design file is byte-identical at `188262e` to T-074's measurement
  ref `e83ee1d`**, sha256 `07d8b43d…` — re-derived, not taken on report,
  so the 798/800 measurement carries.

### JUDGEMENT CALLS

**1. THE DRAFTER'S NOTE IS REMOVED, AND ITS SURVIVAL IS A MEASURED
FINDING.** The note said *"remove before landing"*; the executor could
not take it (the card's own file is outside the three-path fence, by the
architect's ruling above), so it fell to the integrator. **Removed.** But
the interesting half is that this is not an isolated miss: at `188262e`,
`git grep -l "remove before landing" docs/tasks/T-*.md` finds **sixteen
cards, THREE of them `status: done`** — `T-091`, `T-102` and `T-120` all
landed carrying a note instructing its own removal. **An instruction that
three of the last landed cards ignored is not a discipline, it is a
hope**, and it is mechanically checkable in a gate that already reads
every live card's frontmatter. Filed as **`T-108-s2`**.

**2. THE FOURTH STALE CITATION IS FILED, NOT FOLDED — and the line is
principled rather than economical.** T-081's verifier notes (§ *CRITERION
7 CITES A PIN THAT DOES NOT EXIST*) still say the phantom string *"occurs
in exactly three files, all prose"* and enumerate them, and **one of the
three, `T-081-s8`, no longer exists** — the sixth triage absorbed it into
this card. At `188262e` the census is three files again but a DIFFERENT
three, and the same block undercounts its own card at *"twice"* where
there are four. The executor correctly left it: it is outside the
criteria, and this card's own criterion forbids deleting history. **The
rule the integrator applied: repair what the merge INTRODUCES, file what
the merge merely REVEALS.** That block is archival — a record of a
measurement at T-081's own tip that went stale under a later triage —
and correcting it properly means a dated in-place correction with its own
derivation, which is a card's work and not a checkpoint's. Filed as
**`T-108-s1`**.

**3. `executor.md` STEP 5 VERSUS THE FENCE RULING IS ROUTED TO `T-104`,
AND IT IS THE SECOND CONFLICT ON THE SAME STEP.** Step 5 requires
appending implementation notes to the task file; this card's fence ruling
forbids writing any `docs/tasks/` path outside the three named, and the
card's own file is deliberately not among them. The executor followed the
ruling and put everything in its report — **correctly**, and the report
is why this integration could check the work at all. `executor.md`
already records ONE conflict about this step (the verifier is given
*"ONLY the task file … never the executor's reasoning"* while step 5
writes that reasoning into it). **This is a second, and it is worse,
because it is GENERAL rather than incidental**: a card's own file is
never part of its own fence, so step 5 is unperformable for **every** card
fenced at path granularity — which is exactly the fence style this card's
ruling asks the project to adopt. **The two lanes tonight split on it**:
T-116's executor appended notes to its card, this one did not, which is
the signature of an unruled conflict rather than of a mistake. Fence
`[method/]`, held by `T-104`, the rulings vehicle. Filed as
**`T-108-s3`**.

**4. THE STALE LINE NUMBER THIS MERGE WOULD HAVE INTRODUCED IS
REPAIRED** — the one judgement call the brief did not anticipate, and the
sharpest thing this pass found. The lane wrote
`app/src-tauri/tests/agent_runner.rs:1347` into T-081's criterion 7 and
T-025's §6 notes. **It was correct when written** and **`a9ed33d`, Merge
T-102, moved the definition to 1409 thirty-one minutes later** — ten
minutes after this lane's own tip. So the card written to remove stale
citations shipped a fresh one that went stale before its own merge, in a
half-hour window, **against the CONVENTIONS gotcha its own adjacent
clause quotes**, and against its own sentence that no line number is
written into that pointer. Both digits are **deleted rather than
refreshed**, in the CHECKPOINT commit and not in the merge, with the
derivation on T-081's criterion 7. **The usual objection does not bind
here**: an integrator does not edit a production diff a verifier
approved, but there is no verifier and no verdict on this card, and the
alternative was to let main newly acquire the exact defect the card
exists to remove. T-081's ARCHIVAL `:1347` citations, written by its own
verifier at its own tip, are left byte-untouched — they are history, and
this card's last criterion forbids deleting it.
