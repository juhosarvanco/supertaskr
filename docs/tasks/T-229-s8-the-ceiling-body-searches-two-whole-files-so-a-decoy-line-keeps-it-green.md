---
id: T-229-s8
title: The ceiling body searches two whole method files with no uniqueness floor, so one decoy line keeps it green with the home rewritten
feature: F-06
milestone: 4
size: S
priority: 4
status: done
suggested_by: verifier claude-opus-5@subagent @T-229-s4
blocked_by: []
touches: [app/test/select-board.test.ts, method/lane-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**Class parent: `T-229-s4`**, whose verdict measured this. That card
aimed `app/test/select-board.test.ts`'s ceiling body at the value's
declared HOME as well as at orchestrator.md's citation, and it succeeds:
moving the number in either file reds the body by name. What it does not
do — and did not inherit the ability to do — is pin the SENTENCE.

`CONVENTIONS`' POISON DRILL catalogue, **shape EIGHT**: *an assertion
that SEARCHES a corpus has no uniqueness floor, so one duplicate anywhere
keeps it green with its own subject deleted.* The body runs
`/Ceiling:\s*(\d+)\s*[–—-]\s*(\d+)\s*concurrent/.exec()` over the whole
text of each file and takes the FIRST match.

**MEASURED at `339b8d31a615edfda1e9b8d02d3677ca4d403889`** on an
independent bench, one side only, restored and sha256-proved: with a
decoy line `Ceiling: 3–5 concurrent` planted ABOVE
`method/tasks/TASK-FORMAT.md`'s line 701 AND the real home line rewritten
to `4–5`, `npm test` from `app/` exits **0**, 50 files / 1131 bodies
passed. The home moved and nothing noticed.

**THE HOLE IS INHERITED, NOT INTRODUCED.** The body T-229-s4 replaced had
exactly the same shape against `method/roles/orchestrator.md`; that card
doubled the number of files read, and with it the number of unanchored
reads. Nothing is red today and nothing is wrong with what shipped — this
is the remaining half of the same argument the ceiling's home makes about
itself: *the copy nothing reads is the copy that drifts.*

**THE REMEDY IS THE CATALOGUE'S OWN, AND THE ANCHOR ALREADY EXISTS.**
Shape EIGHT's mechanical remedy is *narrow the haystack to the line or
section pinned, with an ANCHOR that is not the needle, and assert the
ANCHOR's own uniqueness.* `method/tasks/TASK-FORMAT.md`'s home line
carries one: the phrase `THIS LINE IS THE VALUE'S HOME`, whose occurrence
count in that file is **1** at the ref above (derive it at your own ref
rather than trusting this sentence). `method/roles/orchestrator.md`'s
citation has no equivalent phrase; the honest anchor there is its own
step-4 sentence, or the file's declaration that the line IS a citation.
Whether both halves are worth the same treatment is the design question
this card carries — an anchor that is itself unpinned buys less than it
looks.

**THE DRILL THIS CARD OWES** is the one that measured it: plant a decoy
above the pinned line, move the pinned line, and require the RED. A
version of this body that passes that is the deliverable; a version that
merely reads the anchor is not, because the anchor's uniqueness is the
half that does the work.

**WHY IT IS A SUGGESTION AND NOT A REJECTION**, recorded so the next
reader does not re-argue it: T-229-s4's criterion is that the body reds
when either file moves away from `CONCURRENCY_CEILING`, and it does. A
decoy planted elsewhere in the file is a different threat model, and the
shipped body is strictly better than the one it replaced.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at T-229-s4's merge (89c7e2b)

The architect seat. Shape eight, inherited from the body T-229-s4
replaced: both reads search whole files with no uniqueness floor, so a
decoy line keeps the body green with the home rewritten. Criteria: each
read SHALL anchor to its file's unique sentence (TASK-FORMAT already
carries one) and SHALL red when the anchor matches more than once; the
absorbed prose copies below ride the same lane.

## Absorbs: T-229-s7 (2026-09-02)

lane-protocol rule 4's prose spells the ceiling twice more ("3–5
concurrent lanes", "up to five executors") and no checker reads either.
The lane SHALL either make both derive from the home by citation or
give them a reader, and SHALL keep rule 4's extraction through both
assemblers byte-stable except for the edit.

## Implementation notes, 2026-09-02 — executor claude-opus-5@subagent

Lane `task/T-229-s8-ceiling-body-unique-anchor`, worktree
`/Users/ujju/Projects/nputer-T-229-s8`, cut at the dispatch stamp
`24bfec8e10b3b13699e137befc11c729b13fd986`. Source commit
`1e344d62fbc3f7db83e367b1e8592578459407cb`. Every figure below carries
the ref it was measured at; live facts carry the time and host.

### What the body does now

Each of the two reads is narrowed to the ONE markdown BLOCK carrying its
file's unique sentence, and the needle is required exactly once inside
that block. Three helpers sit above the describe: `foldWhitespace`,
`foldedBlocks` (a column-zero line plus its indented continuation lines,
a blank line ending the block — the fold `numberedStep` and
`numbered_rule` already use), and `theOneBlockCarrying`, which asserts
the anchor's own uniqueness before it returns anything.

**THE NARROWING IS BY BLOCK RATHER THAN BY LINE**, which is the one
design choice worth defending. `the_one_line_carrying`
(`app/src-tauri/src/agent/kit.rs`) is the repository's existing spelling
of this remedy and it was the first candidate. It cannot serve the
orchestrator side: that file's honest anchor spans a hard wrap, so a
line-scoped helper would have to anchor on a fragment. Folding by block
lets both anchors be whole sentences and makes a re-wrap of either file a
non-event.

### The anchors, and their uniqueness measured at `1e344d6`

| file | anchor | occurrences (whitespace-folded, whole file) |
|---|---|---|
| `method/tasks/TASK-FORMAT.md` | `THIS LINE IS THE VALUE'S HOME` | **1** |
| `method/roles/orchestrator.md` | `THAT BOUND'S HOME IS tasks/TASK-FORMAT.md's Parallelism guardrails AND THIS LINE IS A CITATION OF IT` | **1** |

The same two counts were **1** at the base `24bfec8` before any edit.
The needle `Ceiling: N–N concurrent` occurs **1** time in each WHOLE file
today at `1e344d6` — which is exactly why the old body passed, and why
the floor rather than the count is what buys anything.

**THE CARD'S PREMISE ABOUT ORCHESTRATOR.MD IS PARTLY FALSE AND THE
REPOSITORY WINS.** The card says its citation *"has no equivalent
phrase"*. It has two, `THAT BOUND'S HOME IS` and
`AND THIS LINE IS A CITATION OF IT`, each occurring **1** time in that
file at `24bfec8` and at `1e344d6`. The real asymmetry is placement, not
absence: TASK-FORMAT's anchor sits ON the line that carries the number,
orchestrator's on the two lines BELOW it. That is what decided the block
fold. The anchor used is the full sentence spanning both.

### The absorbed T-229-s7 half

Rule 4's two prose copies (`3–5 concurrent lanes`, `up to five
executors`) now DERIVE from the home by citation and spell no number at
all: `re.findall` for any ceiling number in `method/lane-protocol.md`
returns **[]** at `1e344d6`. The citation is the prefixed, non-ordinal
form (`tasks/TASK-FORMAT.md's Parallelism guardrails`) — prefixed because
MF-04 skips a bare method-root name that is not on its allowlist, and
non-ordinal because TASK-FORMAT carries no numbered rules for MF-02 to
resolve against.

Rule 4's extraction, measured through BOTH assemblers rather than one:

| assembler | before (`24bfec8`) | after (`1e344d6`) | differing region |
|---|---|---|---|
| `numberedStep` (`tools/e2e/scripts/dispatch-brief.mjs`) | 12,932 chars / 12,984 bytes | 13,152 chars / 13,206 bytes | ONE contiguous span; 8,850-char prefix and 3,981-char suffix identical |
| `numbered_rule` (`app/src-tauri/src/dispatch/brief.rs`) | 12,929 chars / 12,981 bytes | 13,149 chars / 13,203 bytes | ONE contiguous span; 8,847-char prefix and 3,981-char suffix identical |

Both differing spans are the edited sentence and nothing else, and
`js[3:] == rust` holds before AND after (the JS extraction keeps the
`4. ` prefix the Rust one strips). **MEASURING BOTH IS NOT CEREMONY.**
The two stop conditions differ — JS breaks on `^\d+[a-z]?\. ` or `^## `,
Rust on the FIRST non-indented non-empty line — so one column-zero line
inside rule 4 would collapse the Rust extraction while the JS one grew
normally, and a JS-only check would call that clean. Every line of the
edit is indented; the Rust extraction growing by the same 220 characters
is the evidence, not the intent. The Rust side was measured by lifting
`numbered_rule`'s own source out of `brief.rs` by script (lines
1890–1912 at `1e344d6`, snippet sha256
`d846b6ee935de7860e512277fb10bb27f8faa27c88b963e549366e21ca6bb160`) and
compiling it standalone with `rustc -O`; `brief.rs` itself was never
touched, and the real file's tests ran green in the battery below.

The paragraph was re-wrapped from the edited sentence to the end of its
own bold clause (`...never how many may sit in it.**`) so no ragged
mid-sentence line was left behind; the re-wrap moves no word and shows in
the extraction as nothing at all, which the identical 3,981-char suffix
above is the proof of.

### Drills — every mutant one side only, restored with sha256 proof

Two detached drill worktrees cut from this lane's own commits
(`nputer-D8-old` at `24bfec8`, the body BEFORE this card;
`nputer-D8-new` at `1e344d6`, the body AFTER), each running the WHOLE app
suite, each removed afterwards. Clean baseline on both: **1141 passed,
exit 0**. (The six `the build is newer than...` bodies that fail in any
fresh worktree are the documented unbuilt-worktree hazard; they were
cleared by refreshing `app/dist` mtimes before every drill, so every
count below is against a 0-failure baseline.)

| # | mutant | file | body under test | suite exit | failing bodies |
|---|---|---|---|---|---|
| A1 | home rewritten to `4–5`, no decoy | TASK-FORMAT | **old** | 1 | **1** — the ceiling body, by name |
| A2 | decoy above the home + home rewritten | TASK-FORMAT | **old** | **0** | **0** (50 files / 1141) |
| A3 | second anchor planted | TASK-FORMAT | **old** | **0** | **0** |
| A4 | decoy + citation rewritten | orchestrator | **old** | **0** | **0** |
| A5 | second anchor planted | orchestrator | **old** | **0** | **0** |
| A6 | anchor phrase deleted | TASK-FORMAT | **old** | **0** | **0** |
| B1 | decoy above the home + home rewritten | TASK-FORMAT | **new** | 1 | **1** |
| B2 | second anchor planted | TASK-FORMAT | **new** | 1 | **1** |
| B3 | decoy + citation rewritten | orchestrator | **new** | 1 | **1** |
| B4 | second anchor planted | orchestrator | **new** | 1 | **1** |
| B5 | anchor phrase deleted | TASK-FORMAT | **new** | 1 | **1** |

**A1 IS WHAT MAKES A2 WORTH READING.** A green under a mutant proves
nothing unless the same tree reds under a different one, so A1 moves the
home with no decoy and the old body reds by name — the drill's data is
demonstrably the data the body reads. A2 then reproduces this card's own
premise exactly: old body GREEN, 1141 bodies, with the home moved.

Every positive control is DEMONSTRATED FAILING against an implementation
lacking the property, which is the pairing this asks for: the decoy
mutant (A2 green / B1 red), the second-anchor mutant (A3 green / B2 red),
the same two on the citation side (A4/B3, A5/B4), and the missing-anchor
mutant (A6 green / B5 red). Kill-set containment is **1** on every red.

Failure messages, quoted from the runs: *"method/tasks/TASK-FORMAT.md
ceiling min: expected 4 to be 3"* (B1 — it read the home inside the
block, not the decoy above it); *"...must carry the anchor \"THIS LINE IS
THE VALUE'S HOME\" exactly ONCE, and carries it 2 times"* (B2);
*"method/roles/orchestrator.md's anchored block states \"Ceiling: N–N
concurrent\" 2 times, not once"* (B3 — that decoy landed INSIDE step 4's
block, which is the second floor's whole purpose); *"...carries it 0
times"* (B5).

Restoration, `shasum -a 256`, clean hash identical before and after every
mutation (each also read back with `git diff` while mutated):

- `method/tasks/TASK-FORMAT.md` clean `260b6bb146424d4d7b3e6e58f48e60544ed09022bc39b4b853fe1a86d30ce64f`;
  mutated `51af2ba585ee1824a7dfaccbf086932f02cb5767938a98a0d783984272a2d7ef` (A1),
  `861cfbe35fdbccf6658fe58726fade340b8a5124ebdaa9118c483dd485d2e753` (A2/B1),
  `31d5a977066a9057a311d6ad5b6384a8e0b1b91544e7ca548e2f068b7e34718b` (A3/B2),
  `ee8713d91eef51e7ad3b97858468e0ca46d7165fc46ce84bebf16f1a37fad897` (A6/B5).
- `method/roles/orchestrator.md` clean `030e03438fdc70c82b27c0d3a439fd2d5faeb4502d9bdf70d37540d53cad61ae`;
  mutated `96ab499d4ad43816a798dc5188ab5b4eba50e7b31084a4125c786f38baaa7794` (A4/B3),
  `1003a1220b99d14aee76ea8090b19777e59741ac257aa2fac0f022f1071bd611` (A5/B4).
- Both files carry their clean hash in this lane at `1e344d6`; neither is
  in this fence and neither was ever written here.

### The sweep — one sibling found, measured, routed

The class is shape EIGHT, so the sweep asked which other bodies regex a
WHOLE repository file and take the first match.
`app/test/genesis-derive.test.ts` reads `plan-interview.md` whole but
pins a CARDINALITY (`toHaveLength(9)`) and every cell, so a planted row
reds it — not an instance. One instance was found and is **routed, not
built**, because it is outside this fence: `T-229-s10`
(`app/test/crescendo-dom.test.tsx`), measured on a third drill worktree
at `1e344d6` — a decoy `"include"` inside a `/* */` comment plus the real
include list widened to `["src", "test"]` leaves the whole app suite at
**1141 passed, exit 0** against a clean 1141 baseline. **The kill set is
empty**, and the body's own comment claims the assertion *"cannot be
satisfied by a comment"*. Restored, `9e477270eabafa11aeead39cc72767af9daa5e1d87b916a90d18e678ce1e9b91`
clean / `eb17d38070311cefa9275e4069b41e785b0161fc735c92db9307ab6e3f871c8d`
mutated / clean hash again after.

### Commands, in order, exit read from `$?` unpiped

| # | command | cwd | exit |
|---|---|---|---|
| 1 | `npm ci` | `app/` | 0 |
| 2 | `npm run build` | `app/` | 0 |
| 3 | `npm ci` | `tools/e2e/` | 0 |
| 4 | `npm test` (BEFORE, at `24bfec8`) | `app/` | 0 — 50 files / **1141** |
| 5 | `npx vitest run test/select-board.test.ts -t "matches the LIVE method"` | `app/` | 0 — 1 body |
| 6 | `node -e` → `numberedStep(lane-protocol, 4)`, before and after | lane root | 0, 0 |
| 7 | `rustc -O` on the lifted `numbered_rule`, then both runs | scratch | 0, 0, 0 |
| 8 | `npm run build` (`tsc` + `tsc -p tsconfig.test.json` + `vite build`) | `app/` | 0 |
| 9 | `npm test` (AFTER) | `app/` | 0 — 50 files / **1141** |
| 10 | `node tools/method-evals/run.mjs` | lane root | 0 — 7 model-free |
| 11 | `node tools/method-evals/run.mjs --selftest` | lane root | 0 — 7, POSITIVE CONTROL |
| 12 | `git commit` (source) | lane root | 0 → `1e344d6` |
| 13 | `git worktree add --detach` ×3, `git worktree remove --force` ×3 | lane root | 0 each |
| 14 | 11 drills + 1 sweep drill, whole app suite each | drill worktrees | as tabled |
| 15 | `node tools/e2e/scripts/gate-run.mjs parser` | lane root | 0 — **363** bodies, GREEN |
| 16 | `node tools/e2e/scripts/gate-run.mjs app` | lane root | 0 — **1141** bodies, GREEN |
| 17 | `node tools/e2e/scripts/gate-run.mjs rust` | lane root | 0 — **639** bodies / 18 targets, GREEN |
| 18 | `node tools/e2e/scripts/gate-run.mjs e2e` | lane root | 0 — **602** bodies, GREEN |
| 19 | `cargo run -q -p nputer-index -- index --check --root ../..` | `app/src-tauri/` | **1** — STALE, see gates |
| 20 | `git merge-tree --write-tree main HEAD` | lane root | 0 |
| 21 | `node tools/e2e/scripts/docs-gate.mjs <3 literal paths>` | lane root | **1** — FIRES |

All four gate-run verdicts were taken at `1e344d6` with
`NPUTER_E2E_PORT=15229` derived from the lane, never defaulted; port 1420
was read once (`lsof -nP -iTCP:1420 -sTCP:LISTEN`) and never touched.

### Gates, derived on the MERGE FORECAST

`git merge-tree --write-tree main HEAD` exits **0** (no conflict); the
forecast diff is this lane's two fenced paths plus the two cards this
commit writes.

- **GRAPH REGEN — FIRES.** The diff carries `app/test/select-board.test.ts`
  (`*.ts`, outside `docs/`). Asked rather than predicted:
  `index --check` exits **1**, STALE, naming `+3` symbols and `+3` edges,
  all three the new helpers' call edges inside this one file
  (2504 → 2507 symbols, 2395 → 2398 edges at `1e344d6`).
  **Regeneration is the integrator's**, in the merge commit.
- **DOCS GATE — FIRES**, on the card paths under `docs/` this commit
  writes. `docs-gate.mjs` names the three suites owed: `npm test` from
  `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from
  `lib/parser/` — all three run GREEN in the battery above and again at
  the tip.
- **METHOD EVAL GATE — FIRES** (`method/lane-protocol.md`). Both arms run
  from the lane root: `run.mjs` exit **0** over 7 model-free evals,
  `--selftest` exit **0** over the same 7 with the positive control.
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**` or
  `app/src/**`, and neither manifest; `app/test/` is not `app/src/`.
- **AUDIT GATE / THE BLESSED GATE** declare no merge-diff trigger and are
  not in this set.
- The CAPABILITIES census is not owed: it is generated from
  `tools/e2e/tests/` spec names, which this fence does not touch, and
  both test names in this file are byte-identical to their pre-card
  spelling on purpose.

### Where the brief was wrong

1. **Row 4's base commit.** The brief gives
   `5d3d516d495c879514bc0362f919ab4bd75c0069`; this worktree's HEAD at
   dispatch was `24bfec8e10b3b13699e137befc11c729b13fd986`, the commit
   that stamped this card `status: building`. The worktree wins, as the
   brief itself warned (T-233's defect). Everything here is measured
   against `24bfec8`.
2. **The card's claim that orchestrator.md's citation has no equivalent
   phrase** is partly false — it carries two unique phrases, on the line
   below the number rather than on it. Recorded above with counts.
3. **The brief's "boot gate not owed ... derive it anyway"** is correct
   and was derived, not assumed.
4. Nothing else in the brief was contradicted by the repository. The
   fence held: `TASK-FORMAT.md`, `orchestrator.md`, `board-model.ts` and
   `brief.rs` were read here and mutated only in detached drill
   worktrees, one side at a time, each restored with an equal sha256.

### Addendum, same day — the e2e battery at the tip, and its attribution

The battery above was taken at `1e344d6`, the source commit, and all four
suites were GREEN there (`e2e` 602/602, exit 0). Re-run at the notes
commit `4d972d0`: `parser` **363** GREEN, `app` **1141** GREEN, `rust`
**639** over 18 targets GREEN, and `e2e` **RED** — 1 failed / 601 passed,
twice, always the same single body:
`tools/e2e/tests/push-guard.spec.ts:2718` *"a lane holds no seat, so a
holder record in one refuses nothing"*, failing its positive-control half
*"the same record on the integration branch is not ignored"*.

**ATTRIBUTED, BY NAME AND BY MEASUREMENT, AND IT IS NOT THIS LANE'S.**
The body passes ALONE (1/1) and inside its own whole file (76/76) at
`4d972d0`. The decisive measurement is a control: the full suite re-run
at `1e344d6` — the commit that had already run it GREEN, and which does
not contain either card this lane files — **reds on the same single
body** when the host is busy (six other playwright processes live, read
2026-09-02 on Mac.lan while three lanes ran e2e suites). One commit, one
suite, two opposite verdicts: the red is not a function of the tree.
Nothing in this fence touches the push guard, its spec, or `.nputer/`.
Filed as `T-229-s11` with the full table, because the next seat to run
the battery in this window will meet it.

**AND THE E2E VERDICT THIS LANE OFFERS IS THEREFORE THE ONE AT
`1e344d6`** — 602 bodies, exit 0, GREEN, the whole source change in the
tree. What `4d972d0` adds is two markdown cards under `docs/tasks/`,
which the failing body does not read, and the control proves it does not
need them to fail.

## VERDICT, 2026-09-02 — APPROVED — verifier claude-opus-5@subagent

Judged at lane tip `8876eb5b98c063c86c5949c980a176d8e071652d`, base
`24bfec8e10b3b13699e137befc11c729b13fd986`, on an independent bench
(`/Users/ujju/Projects/nputer-V-T-229-s8`, detached, ports
`NPUTER_E2E_PORT=25229` / `NPUTER_BOOT_PORT=26229`, 1420 read never
touched). **Every figure below was measured by this seat**; the ones
taken before the diff existed carry the base ref, the ones taken after
carry the tip.

### The blindness was CLOCK-SHAPED, and it is stamped

Phase 1 reached this seat before the lane's work existed: there was no
diff to decline to read. The attack set and the ground truth were written
from the card at its base ref and **sealed at `2026-09-02T08:10:36Z`**,
before the tip was named to me:

```
attack-V-T-229-s8.md   ce3f162e62e5a1bc43eec796252de88ab0cfa89ced8ade532daa683b5ce88fcb
ground-V-T-229-s8.md   207262168afaf0952b4b30b516804008eb2d2508667b5145a530f7ea06e3b7ba
stamps-V-T-229-s8.txt  d4fe9d27cd60a1eeb68cdcfd4735064b0918a03bb119b5d1b96ef18e1ffb40de
```

All three re-verified byte-identical at verdict time. **DISCLOSED**: the
phase-2 dispatch carried the executor's own figures (extraction lengths,
drill counts, suite totals). That arrived AFTER the seal, which is where
it belongs — but it means nothing below is accepted on those figures. Each
was re-derived here, and where the executor and I measured the same thing
we agree to the character; that agreement is corroboration, not the
source.

### O1 — each read anchors to its file's unique sentence · MET

The two files the body reads are **byte-identical to base at the tip**
(`260b6bb1…` TASK-FORMAT, `030e0343…` orchestrator), so the whole change
in behaviour is in the test. Anchor occurrences, whitespace-folded, in
their own file, measured at both refs: `THIS LINE IS THE VALUE'S HOME`
**1**, `THAT BOUND'S HOME IS tasks/TASK-FORMAT.md's Parallelism
guardrails AND THIS LINE IS A CITATION OF IT` **1**.

**The scope of the floor is one file, and that is the right scope.** My
sealed attack A2 predicted the failure of a wider one and measured why:
`THIS LINE IS THE VALUE'S HOME` occurs in **four** tracked files at the
base — this card, `T-229-s4`, the test file and TASK-FORMAT — so a
repo-wide uniqueness assertion would have been FALSE on arrival, with the
commissioning card as one of the duplicates. The shipped floor counts
inside one file and is unaffected.

**The block fold is the honest answer to the asymmetry the card set as
its design question.** orchestrator's anchor spans a hard wrap, so a
line-scoped helper (`the_one_line_carrying`, kit.rs) could only have
anchored on a fragment. Folding by block makes a re-wrap of either file a
non-event. I pre-committed in the sealed set that a lane treating both
sides identically *without noticing the asymmetry* had not read the card;
this lane noticed it, named it, and chose the fold for that reason.

### O2 — reds on more-than-one and on none · MET, DRILLED, CONTAINMENT 1

Twelve DATA mutants, each applied ONE SIDE ONLY to the method file the
body READS (never the assertion — the property lives in data, so a code
mutant would mis-grade it by construction), each landing read back from
`git diff`, each restored with `git restore --source=<tip>
--staged --worktree` and a sha256 equal to the tip's. Whole app suite
every time; baseline at the tip **50 files / 1141 passed**.

| # | data mutant | file | result | failing bodies |
|---|---|---|---|---|
| D1 | **the card's own mutant** — decoy above the home + home → `4–5` | TASK-FORMAT | **RED**, *"ceiling min: expected 4 to be 3"* | **1** |
| D2 | decoy above the home, home UNCHANGED | TASK-FORMAT | GREEN (1141) | 0 |
| D3 | home → `4–5`, no decoy | TASK-FORMAT | **RED** | **1** |
| D4 | decoy in its own block + citation → `4–5` | orchestrator | **RED** | **1** |
| D5 | decoy in its own block, citation UNCHANGED | orchestrator | GREEN (1141) | 0 |
| D6 | citation → `4–5`, no decoy | orchestrator | **RED** | **1** |
| D7 | second anchor copy, DIFFERENT block | TASK-FORMAT | **RED**, *"carries it 2 times"* | **1** |
| D8 | second anchor copy, SAME block | TASK-FORMAT | **RED**, *"carries it 2 times"* | **1** |
| D9 | blank line splitting the anchor's span | orchestrator | **RED**, *"in 0 whole blocks"* | **1** |
| D10 | decoy INSIDE the anchored block + home → `4–5` | TASK-FORMAT | **RED**, *"states … 2 times, not once"* | **1** |
| D11 | anchor phrase deleted from the home line | TASK-FORMAT | **RED**, *"carries it 0 times"* | **1** |
| D12 | decoy INSIDE the anchored block, home UNCHANGED | TASK-FORMAT | **RED**, *"states … 2 times, not once"* | **1** |

**D1 IS THE CARD.** At the base I measured that same mutant GREEN —
50 files / **1141 passed**, exit 0, the home moved and nothing noticed
(sealed ground §4.2, taken before the diff existed). At the tip it is
**1 failed / 1140 passed**, the ceiling body by name. **The other side was
holed too and the card did not say so**: I measured the orchestrator
analogue GREEN at the base (sealed ground §4.3) and it is D4 RED at the
tip. Both halves are closed, not one.

**KILL-SET CONTAINMENT, NEVER THE COUNT.** Each of the three new floors
has a mutant that kills it and nothing else, so no kill set contains
another:
- anchor-occurrence floor — **D8**: a same-block duplicate leaves the
  block floor at 1 and the needle floor unreached;
- one-block floor — **D9**: the anchor still folds to one occurrence in
  the file, but no single block holds it;
- needle-once-in-block floor — **D12**: occurrences 1, blocks 1, and only
  the in-block count moves;
- and the min/max compare keeps its own — **D3/D6**, where all three
  floors stay green and only the value has moved.

**The discrimination D2 and D5 buy is the part a weaker fix would have
lost.** A floor asserted on the NEEDLE instead of the anchor (sealed
attack A3) would red identically whether the home moved or somebody
merely wrote the number twice elsewhere. This body reds on D1 and stays
green on D2, so its red still means *the value moved* — and where a
duplicate genuinely lands inside the pinned block, D12's message names
the duplicate rather than claiming the value moved.

### O3 — rule 4's prose copies, and byte-stability through BOTH assemblers · MET

The citation route was taken and the numbers are gone, not merely
checked: at the tip `method/lane-protocol.md` contains
`ceiling of 3–5 concurrent lanes` **0**, `up to five executors` **0**,
`3–5 concurrent` **0**, and **0** matches of the body's own `CEILING`
regex (all were 1, 1, 1, 0 at base). A duplicate removed outranks a
duplicate checked, and it means no THIRD unanchored read was introduced —
the failure my sealed attack A4 was written for.

**Extraction, re-derived here through both real assemblers:**

| assembler | base | tip | delta |
|---|---|---|---|
| `numberedStep` (`dispatch-brief.mjs:400`) | 12,932 | 13,152 | +220 |
| `numbered_rule` (`brief.rs:1890`, lifted verbatim, `rustc -O`) | 12,929 | 13,149 | +220 |

**ONE contiguous span**: common prefix 8,850 chars, common suffix 3,981
chars, a 101-char region replaced by a 321-char one, everything outside
it byte-identical. Rules 2, 3 and 6 are sha256-**identical** at both refs
(`b707d0f9…`, `c8f88eb9…`, `65b834ea…`). Rule 4's head and tail 60 chars
unchanged. Ordinal set identical (14 ordinals, 4 `## ` headings, each
shifted exactly +4 lines); the diff adds no `^\d+[a-z]?\. ` line and no
`^## ` line.

**AND IT AVOIDED THE TRAP I MEASURED BEFORE THE DIFF EXISTED.** The two
assemblers stop differently — JS on an ordinal or heading, Rust on the
first non-indented non-empty line. Sealed ground §3 records that ONE
column-zero line inside rule 4 collapses the Rust extraction
**12,929 → 8,842** while JS grows normally to 12,980, so a JS-only check
would call that clean. Every added line here is indented, and the Rust
side growing by the identical +220 is the evidence.

**The brief's byte margin did not degrade**: 52,344 of 65,536 bytes
(79.9 %, 13,192 left) at the base → **51,680 of 65,536 (78.9 %, 13,856
left)** at the tip, `brief.mjs --task T-229-s8 --role executor`.

**The citation is SEEN, not merely shaped right.** Sealed attack A8
demanded proof that MF-04 examines the new pointer rather than skipping
it. Dangling it here (`tasks/TASK-FORMAT-NOPE.md`, restored by sha256)
reds **MF-04 by name** — *"method/lane-protocol.md points at
method/tasks/TASK-FORMAT-NOPE.md, which is not in the method tree"*. At
the base I had measured the two ways this could have gone silently wrong:
a BARE `TASK-FORMAT-NOPE.md` exits **0, SILENT** (MF-04's documented
allowlist hole), and an ORDINAL citation reds **MF-02** — *"has no rule 4
(its numbered rules are )"*. The shipped form is prefixed and
non-ordinal, which is the only spelling that is both checked and legal.

### Security sweep (step 3) — CLEAN

The only new read is `readRepo(rel)` with `rel` one of two hardcoded
literals; no path is derived from file content. No regex is built from
content (`anchor` is used with `String.split`/`String.includes`, never
`new RegExp`); `/\s+/g` and `/^\s/` are linear over a 43 KB input with no
backtracking hazard. No new dependency, no `package.json` change, no
secret, no endpoint, no authz surface. Nothing to report.

### Gates, run here at the tip

| gate | result |
|---|---|
| `npm run build` from `app/` (tsc + tsc test config + vite) | **exit 0** |
| `npm test` from `app/` | **50 files / 1141 passed** |
| `npx vitest run` from `lib/parser/` | **16 files / 363 passed** |
| `npm test` from `tools/e2e/` (ports 25229/26229) | **602 passed, exit 0**, 16.0 m |
| `node tools/method-evals/run.mjs` | **exit 0**, 7 model-free; MF-04 13 refs, MF-02 26 citations |
| `node tools/method-evals/run.mjs --selftest` | **exit 0**, 7, POSITIVE CONTROL |
| `index --check` from `app/src-tauri/` | **exit 1, STALE** — `files +0 -0 ~1`, symbols 20→23, `edges +3`, all three the new helpers' own call edges inside the one changed file. **The integrator's, in the merge commit.** Correctly not regenerated in the lane. |
| `docs-gate.mjs` on the three literal paths | **exit 1, FIRES** on the card paths — `app/`, `tools/e2e/`, `lib/parser/` owed |

**THE e2e INTERMITTENT — MEASURED HERE, NOT ACCEPTED.** I was told the
lane attributes a red at `push-guard.spec.ts:2718` to host load rather
than to this diff, and told to check it myself rather than take that.
**My own full e2e run at this tip is 602 passed, exit 0** — the body did
not red for me. It ran in 16.0 m against a 9.8 m baseline at the same
bench, with three other lanes' playwright suites live on the host
throughout (`nputer-T-228` and `nputer-V-T-214`, four worker processes
counted at `ps` time). So the slow, loaded condition was present and the
body still passed: an independent third reading consistent with an
intermittent and inconsistent with a defect introduced by this diff.
`T-229-s11` is the right disposition. **No red is attributable to this
lane.**

### Fence, and the routed cards

`git diff --name-only` names exactly `app/test/select-board.test.ts`,
`method/lane-protocol.md`, and three paths under `docs/tasks/` — this
card and two routed suggestions, in the unfenceable directory every card
writes to. `method/tasks/TASK-FORMAT.md`, `method/roles/orchestrator.md`,
`app/src/lib/board-model.ts` and `tools/e2e/**` are untouched. Both
routed cards parse: `status: suggested` with `suggested_by` set,
one-level suffix ids, no reserved title indicator. Neither test name in
the file moved, so the CAPABILITIES census is not owed — and it could not
be regardless: `capabilities.mjs` reads `tools/e2e/tests/*.spec.ts` only.

### Two corrections of record, neither a failure

1. **The card's premise about orchestrator.md is partly false.** It says
   that file *"has no equivalent phrase"*. It carries two, each unique in
   that file. I pre-committed this in the sealed attack set (A13) before
   the diff existed; the lane found it independently and recorded it. The
   card's *conclusion* — anchor on the citation declaration — survives.
2. **The figures the card quotes are from `339b8d3`.** At my base the
   same mutant is 50 files / **1141** bodies, not 1131; ten bodies landed
   between the two refs. The claim is unaffected.

### Not blocking, filed by the lane rather than by me

`T-229-s10` (a sibling shape-eight instance with an empty kill set) and
`T-229-s11` (the intermittent) are `status: suggested` and correctly
routed rather than built — both are outside this fence. I did not
re-measure either; they are suggestions, not conditions of this verdict.

**APPROVED.** The card asked for an anchor that is not the needle, a red
on more-than-one and on none, and rule 4's two prose copies given a
citation without disturbing the extraction. All three are met, drilled at
the site the property lives with data mutants, and every floor is
load-bearing by containment rather than by count.
