---
id: T-229-s8
title: The ceiling body searches two whole method files with no uniqueness floor, so one decoy line keeps it green with the home rewritten
feature: F-06
milestone: 4
size: S
priority: 4
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-229-s4
blocked_by: []
touches: [app/test/select-board.test.ts, method/lane-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
