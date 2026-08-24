---
id: T-090
title: The DOCS GATE is a hand-run ritual, the invocation CONVENTIONS prints destroys its four-code contract, and two sentences about it are false
feature: F-06
milestone: 4
priority: 46
size: S
status: building
blocked_by: []
touches: [tools/e2e, .github/, docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-061-s3, T-064-s7, T-101-s3, T-061-s5 — files removed in this commit.

> **DRAFTER'S NOTE — remove before landing.** T-084-s2 names ONE false
> sentence. I measured a SECOND while verifying it, and it is sharper
> than the first: the DOCS GATE bullet's empty-list clause states a BSD
> `xargs` premise that is false on this machine in BOTH halves, and the
> consequence is that `T-084-s6`'s remedy never fires through the
> invocation the bullet prints. Every figure below is measured at HEAD
> `4d2f03c` on Darwin 25.6.0 with `/usr/bin/xargs`. The exit-mapping
> figure the T-084 integrator recorded in STATE (*"BSD `xargs` maps a
> utility exit of 1–125 to 123"*) does NOT reproduce here — see the
> third bullet — and the fifth triage assigned that figure to T-091 as
> a reader fixture. Both cards can carry it: this one CORRECTS the
> sentence, T-091 builds the thing that would have caught it. Flagged
> so the overlap is deliberate rather than accidental.

Absorbs: T-084-s2 (sixth triage, 2026-08-20). That file is removed in
this commit.

**The third standing gate is the only one with an enforcing copy and the
only one nobody is obliged to run.** `tools/e2e/scripts/docs-gate.mjs`
is invoked by hand from the repo root and is deliberately not an npm
script: `tools/e2e/package.json` carries exactly four
(`test`, `typecheck`, `lint:tokens`, `boot:check`). The reason is
mechanical rather than preference. Adding a command to CONVENTIONS'
`run from tools/e2e/:` bullet puts it in the section
`tools/e2e/tests/workflow-parity.spec.ts` DERIVES from, and
`deriveExpectedSteps` then pushes a problem by name — *"docs/CONVENTIONS.md
'Build & test' lists [tools/e2e] npm run lint:docs, which this spec has
no entry for"* — until the command is entered in `CI_SEQUENCE` with its
workflow step, or in `LOCAL_ONLY` with the reason CI does not run it.
`CI_SEQUENCE` requires the step to exist in `.github/workflows/ci.yml`,
and T-084's fence was `[docs/CONVENTIONS.md, tools/e2e]`. `LOCAL_ONLY`
would have created a gate CI never runs, which is worse than no command.

**TWO SENTENCES IN CONVENTIONS ARE FALSE, both about this gate, both
measured at `4d2f03c`.**

1. **The CI bullet's *"It is silent in exactly ONE case, a command the
   DOC gains that the spec does not yet claim"*.** `deriveExpectedSteps`
   pushes a problem for exactly that case — the `for (const key of
   doc.keys())` loop, whose message tells the reader to add a
   `CI_SEQUENCE` or `LOCAL_ONLY` entry. The silent case, if there is
   one, is something else. **Note how the sentence hides**: it wraps
   across two lines, so `grep "silent in exactly ONE case"` over
   `docs/CONVENTIONS.md` returns NOTHING while the sentence is live —
   this card's own T-077-s3 sibling, met while verifying this card.
   Search for `silent in exactly`, or read the bullet.

2. **The DOCS GATE bullet's *"the invocation above pipes through
   `xargs`"*.** The invocation printed above it does not pipe through
   anything — it is `node tools/e2e/scripts/docs-gate.mjs <changed
   path>...`. The pipeline it describes lives in `docs-gate.mjs`'s own
   header comment. And its premise about BSD `xargs` is false in both
   halves on this platform, which is what makes it worth a criterion
   rather than a copy-edit:

   - **Empty input does NOT run the utility.** A planted probe script
     that prints on entry printed nothing:
     `printf '' | xargs <probe>` exits **0** with no invocation, and so
     does `printf '' | xargs echo HELLO`. So through the documented
     pipeline, `git diff --name-only HEAD HEAD | xargs node
     tools/e2e/scripts/docs-gate.mjs` exits **0** — the gate never runs
     — while the direct call `node tools/e2e/scripts/docs-gate.mjs`
     exits **2**. **`T-084-s6`'s remedy is unreachable by the route
     `T-084-s6` was written about**: silence still wears a clean gate's
     costume, arrived at by the opposite mechanism.
   - **Every nonzero utility exit collapses to 1.** Measured over the
     whole contract, one invocation per code — utility 1, 2, 3, 125,
     126, 127 and 255 each produce xargs **1**. macOS's own man page
     says so (*"If any other error occurs, xargs exits with a value of
     1"*). The **123** figure is GNU's mapping, which is what CI's
     ubuntu runner will use — so the contract breaks in two DIFFERENT
     ways on the two platforms, and both erase the distinction the four
     codes exist for. Demonstrated: `printf -- '--nope\n' | xargs node
     tools/e2e/scripts/docs-gate.mjs` exits **1** where the direct call
     exits **2**, so *called wrong* arrives as *has a verdict*; an exit
     3 (GATE COULD NOT RUN) would arrive the same way.

**What is held meanwhile is more than nothing**, and the card should not
overstate the gap: `tools/e2e/tests/docs-input-gate.spec.ts` runs inside
`npm test` from tools/e2e, which IS a CI step, and it asserts the live
tree clean and the documented trigger equal to the derivation. The
gate's FINDINGS are enforced today. What is not enforced is that anybody
RUNS the one-shot form before a merge — the standing GRAPH REGEN's regen
already has.

**Placement wants an argument, not a slot.** The token lint is CI's
FIRST step, ahead of every `npm ci`, because `npm run` needs no
installed node_modules and `token-scan.mjs` is deliberately
zero-dependency. `docs-gate.mjs` imports `yaml` — a tools/e2e
devDependency, chosen because it is the SAME package `lib/parser` uses
so a block parses for both or neither — so it CANNOT hold the token
lint's position. `docs-scan.mjs` itself stays zero-dependency and its
header says why.

## Acceptance criteria

- THE gate SHALL become a named command in all three places at once: a
  `lint:docs` script in `tools/e2e/package.json`, the command in
  CONVENTIONS' `run from tools/e2e/:` bullet, and a step in
  `.github/workflows/ci.yml` with its `CI_SEQUENCE` entry beside it.
- IF the command is added to CONVENTIONS without the `CI_SEQUENCE`
  entry THEN `workflow-parity.spec.ts` SHALL red BY NAME — demonstrated
  in the notes with the message quoted, not asserted, because that
  demonstration is also the disproof of false sentence 1.
- **THE CI bullet's "silent in exactly ONE case" sentence SHALL be
  deleted or corrected against the derivation as it stands**, and the
  correction SHALL name the loop that falsifies it rather than restate
  a new tally.
- **THE DOCS GATE bullet SHALL stop prescribing an invocation that
  destroys the gate's own exit codes.** Whatever spelling it ends up
  printing, THE SAME SPELLING SHALL appear in `docs-gate.mjs`'s header
  comment — the two disagree today, and a recipe in two places is two
  chances to disagree (T-057).
- **THE FOUR CODES SHALL BE SHOWN TO SURVIVE THE PRINTED INVOCATION, on
  BOTH `xargs` implementations or on neither.** Produce the matrix: for
  each of 0, 1, 2, 3 the code the reader observes when they run what the
  doc prints, measured on BSD `xargs` (this machine) and on GNU `xargs`
  (CI's runner). IF a spelling cannot preserve all four THEN the doc
  SHALL print one that does not use `xargs` at all and SHALL say why.
- **THE EMPTY-LIST TRAP SHALL BE RE-PROVED AGAINST THE NEW SPELLING,
  with a planted positive**: a range command that FAILS, fed to the
  documented invocation, SHALL reach the reader as a non-zero code that
  is not "not owed". Today it reaches them as exit 0 with the gate
  never invoked.
- IF the CI step cannot hold the token lint's bare-checkout position
  THEN the CI bullet SHALL state where it sits and why (the `yaml`
  import), so the next editor does not "fix" the ordering.
- A pin SHALL hold the new script the way the lint's is held: the
  `EXIT` object in `docs-gate.mjs` stays the single authority and the
  npm script SHALL NOT re-type the numbers.

Verification: headless — `npm test` and `npm run typecheck` from
tools/e2e with `docs-input-gate.spec.ts` and `workflow-parity.spec.ts`
green, the exit matrix printed with each `$?` read UNPIPED, and the
POISON DRILL on every new or changed body: mutate one side only, read
the mutated text back with `git diff` before running, restore and prove
the restoration by sha256 against the commit the drill ran at. The DOCS
GATE fires on the CONVENTIONS edit — run what it owes and record which.
Every figure carries the ref it was measured at. @human: none.

## Implementation notes

Built by `claude-opus-5 @T-090` at base `9b03ae6`, branch
`task/T-090-docs-gate-ci`. **Every figure below was measured in this
lane at `9b03ae6`/`f20f786` on Darwin 25.6.0**, `/usr/bin/xargs` (the
only `xargs` on PATH, `which -a xargs`), node v22.22.0, npm 11.12.1.
Nothing is carried over from the drafter's note at `4d2f03c`; where the
card and the tree disagreed, the tree won and it is said so below.

### The drafter's note is removed, and one of its two sentences was ALREADY FIXED

**FALSE SENTENCE 2 WAS NOT LIVE AT MY BASE, AND THE CARD DID NOT KNOW.**
The card says the DOCS GATE bullet carries *"the invocation above pipes
through `xargs`"*. At `9b03ae6` that bullet had already been rewritten —
T-089 re-measured T-061-s3 and replaced the clause with **NEVER PIPE IT
THROUGH `xargs`**, which is correct, and which explicitly hands the fix
to this card. So the doc-side half of criterion 4 was inherited, not
earned. **But the false premise was still live in THREE CODE SITES**,
all inside this fence, and that is the half this card actually owed:

1. `docs-gate.mjs`'s header printed
   `git diff --name-only … | xargs node …/docs-gate.mjs` — the
   destructive invocation, in the file whose own exit codes it destroys.
2. `docs-gate.mjs`'s EXIT-code legend for **2** said *"the documented
   invocation pipes a range through `xargs`, BSD xargs runs the utility
   once even on empty input"* — false in both halves.
3. `docs-input-gate.spec.ts`'s T-084-s6 body carried the same sentence
   as its comment.

All three are corrected. A doc can be fixed by one lane while the code
that motivated it keeps the retracted reason; the enforcing copy is not
automatically the corrected copy.

### The matrix, and why the doc prints no `xargs`

Measured at `9b03ae6`, one invocation per row, **every observed code read
from `$?` on an unpiped command by the reader's own invocation**. A
pipeline's `$?` IS the reader's observed code, which is the object of
study; `${PIPESTATUS[0]}` is empty in zsh and was never used.

| the gate means | what the doc prints, BSD | piped through `xargs`, BSD | piped, GNU |
|---|---|---|---|
| 0 nothing owed | **0** | 0 | 0 |
| 1 has a verdict | **1** | 1 | **123** |
| 2 called wrong (no paths) | **2** | **0** | **0** |
| 2 called wrong (bad flag) | **2** | **1** | **123** |
| 3 could not run | **3** | **1** | **123** |

**THE GNU COLUMN IS NOT MEASURED AND SAYING SO IS THE POINT.** There is
no GNU `xargs` on this machine and no container runtime to borrow one
from — both probed at `9b03ae6`: `which -a xargs` returns
`/usr/bin/xargs` alone, and `docker version` fails with
*"dial unix /Users/ujju/.docker/run/docker.sock: connect: no such file
or directory"*. The GNU column is therefore **CI-RUNNER-PENDING**, and
its source is GNU findutils' documented mapping (utility exits 1–125
become 123). **It closes for real at the repo's first push**, when the
ubuntu runner executes the new `npm run lint:docs` step. No GNU figure
here was measured and none is presented as if it were.

**SO THE CRITERION'S IF-CLAUSE FIRES**: no `xargs` spelling preserves all
four codes on both platforms — it preserves none of the interesting ones
on either — so the doc prints a spelling that does not use `xargs` at
all, and says why. The `$(…)` form's correctness is *structural* rather
than platform-measured: there is no `xargs` process between the gate's
`process.exit` and the shell that reads it. That asymmetry is the
argument, and it is stated in the doc as an argument, not as a
measurement.

**BSD's mapping, re-derived over the doc's own list** (1, 2, 3, 4, 5,
100, 123, 125, 126, 127, 255): every one collapses to **1**. The man
page's 126/127 are for a utility `xargs` cannot EXECUTE or FIND, not for
one that exits 126/127 — measured separately and they do give 126 and
127, which is why the doc now draws that distinction rather than listing
126/127 among the collapsing codes.

**EMPTY INPUT: the utility NEVER RUNS.** Measured with an on-disk marker
so "did it run" is observed rather than inferred — `printf '' | xargs
<probe>` exits 0 and the marker is ABSENT; the one-word control leaves it
PRESENT. So `T-084-s6`'s exit-2 remedy was unreachable through the
invocation the doc printed, by the OPPOSITE mechanism from the one every
document about it described.

### Criterion 2's demonstration, done by walking into it

The command went into CONVENTIONS' tools/e2e bullet **first**, with no
`CI_SEQUENCE` entry, and the lane was run: **1 failed, 13 passed, exit
1**, `workflow-parity.spec.ts:522`, message verbatim —

> docs/CONVENTIONS.md "Build & test" lists [tools/e2e] npm run
> lint:docs, which this spec has no entry for — add it to CI_SEQUENCE
> (verbatim or mapped, with the workflow step) or to LOCAL_ONLY with the
> reason CI does not run it.

**That run is also the disproof of false sentence 1.** The CI bullet
claimed the derivation *"is silent in exactly ONE case, a command the
DOC gains that the spec does not yet claim"*. That is the case it is
LOUDEST about — `deriveExpectedSteps`' `for (const key of doc.keys())`
loop, named in the correction rather than replaced by a new tally.

**AND THE CORRECTION MAKES A CLAIM, SO THE CLAIM IS MEASURED.** What is
silent is a SHAPE, not a direction: a command written into a bullet
carrying no `run from <dir>/:` marker. `commandBullets` skips it (no
marker) and `structuralProblems` has nothing to say (not indented, not
fenced), so `problems` is empty and the step list does not move. Pinned
by a fixture that asserts BOTH halves plus a positive control — the same
command in a bullet the derivation DOES read is loud — so the fixture
cannot pass because a splice silently failed.

### The absorbed findings

**T-101-s3 and T-064-s7 are IN SCOPE and built.** Both are argument
handling in `docs-gate.mjs`/`docs-scan.mjs`, inside the fence, and both
are the same defect as `T-084-s6`: *"I looked and nothing is owed"* and
*"I could not tell what you asked about"* sharing exit 0. Measured at
`9b03ae6` on `docs/CONVENTIONS.md`, a path that owes two suites:

| spelling | before | after |
|---|---|---|
| `docs/CONVENTIONS.md` (root-relative) | 1 | 1 |
| `./docs/CONVENTIONS.md` | **0** | **1** |
| `<abs>/docs/CONVENTIONS.md` | **0** | **1** |
| `../../docs/CONVENTIONS.md` from tools/e2e | **0** | **1** |
| `""` | **0** | **2** |
| `"   "` | **0** | **2** |
| a newline-joined blob | 1 by luck | **2** |
| `/etc/passwd` | **0** | **2** |

**THE OBVIOUS FIX WAS MEASURED AND REJECTED.** Resolving every argument
against the cwd — what T-101-s3 suggests — closes `../../docs/…` and
OPENS the mirror hole: `docs/CONVENTIONS.md` typed from tools/e2e then
resolves to `tools/e2e/docs/CONVENTIONS.md` and answers *"not owed"* at
**0**. I built that, measured it at exit 0, and changed it: a plain
relative path away from the repository root now has two readings, both
are printed, and the run is CALLED WRONG. `./`, `../` and absolute
spellings are unambiguous by definition and are answered. **Trading one
false-clean for another is not a fix**, and the only reason I know that
is that the drill row existed before the fix did.

**Deliberately NOT built: T-101-s3's "not tracked is exit 2" half.** A
merge's diff names paths the working tree at either endpoint does not
have — everything the lane ADDED is absent from the main checkout before
the merge — so an existence check would refuse the pre-merge forecast
the RANGE RULE prescribes. Named in `normalisePaths`' own comment as
undone on purpose rather than overlooked.

**T-061-s5 is built too**, and it forced a ruling rather than a chore:
naming `npm run boot:orphan-drill` in the tools/e2e bullet puts it in
the derived section, so the same edit must decide whether it is a CI
step. It goes to `LOCAL_ONLY` with the finding's own arguments recorded
in both the spec and the CI bullet — it opens a window, builds the app,
roughly doubles the boot step's cost, deliberately SIGKILLs a process
mid-boot, and pins a property that cannot drift without somebody editing
`tauri-boot-check.mjs`'s exit path. Its smaller half is done as well: the
boot check's exit-3 legend named one reason and the script's own header
names two, so the legend now carries the underivable committed config.

### The named command, and the honest limit of what CI now holds

`"lint:docs": "node scripts/docs-gate.mjs --census"`. **The CI step runs
the WHOLE-TREE half and judges no diff**, because a workflow has no
"merge's diff" to be handed and this tool refuses to compute one. That
half is not the lesser half: both incidents the gate was built for
(`9c64cd8`, `fede266`) are frontmatter, which is exactly what it holds.
**The DIFF half is still a ritual nobody is obliged to run**, and the
bullet now says so in as many words instead of letting a green CI imply
otherwise. `--census` was widened to accept paths beside it, so
`npm run lint:docs -- <path>` answers rather than refusing a flag.

**Placement**: immediately after `npm ci` in tools/e2e. It cannot hold
the token lint's bare-checkout position because `docs-gate.mjs` imports
`yaml`; `docs-scan.mjs` stays zero-dependency so the constraint belongs
to the wrapper alone. Written into the CI bullet, the ci.yml step's own
comment and the `CI_SEQUENCE` entry, each saying *do not "fix" this*.

**Three figures in the spec were transcribed counts and are now derived**
— they would have made this card's own edit red three files from its
cause: the step floor (18, now a floor of 19), the "this spec expects"
tally (a hard 19, now computed from `CI_SEQUENCE` + `LOCAL_ONLY`), and
the middle-dot cost. That last is stated in CONVENTIONS as a DELTA of
three commands with both endpoint pairs named (19→16 when T-054/T-078
measured it, **21→18 re-measured here**), and the fixture asserts the
delta and the three commands BY NAME, because a delta of three could be
any three. The exposed-command count at `f20f786` is **21**, derived by
asking `commandBullets`, not counted by eye.

### Gates, derived from this lane's own seven paths at `f20f786`

- **GRAPH REGEN — FIRES on 2** (`docs-input-gate.spec.ts`,
  `workflow-parity.spec.ts`; `.mjs` is not in the trigger's suffix list,
  the two `.ts` specs are). **ASKED THE GATE RATHER THAN PREDICTING**, as
  the bullet requires: `cargo run -p nputer-index -- index --check --root
  ../..` exits **0**, *"graph.json is CURRENT"* at **648862 bytes, 126
  files, 1126 symbols, 1712 edges** — identical to the base figures. This
  is T-054's and T-058's worked case a third time: a `.ts` under `tools/`
  matches the trigger and cannot move the graph, because `.nputerignore`
  excludes `tools/`. **No regen owed and none performed.**
- **BOOT GATE — NOT OWED, 0 of 7 paths.** No `app/src-tauri/**`, no
  `app/src/**`, neither manifest. This fence cannot produce those paths.
- **DOCS GATE — FIRES, exit 1.** On the code-only diff it named **cargo
  test from app/src-tauri/** and **npm test from tools/e2e/** for
  `docs/CONVENTIONS.md`. With this card's own notes added it names the
  app and parser suites too. Run and recorded below.

### Suites

Run from this lane, every exit off its own `$?` on an unpiped command.

- **tools/e2e `npm test`**: baseline at `9b03ae6` **135/135 exit 0**
  (port 14950); at the finished tree **RESULT_E2E** (port 14953).
- **tools/e2e `npm run typecheck`**: exit **0**.
- **cargo test**: **RESULT_CARGO**.
- **app `npm test`**: **RESULT_APP**.
- **lib/parser `npx vitest run`**: **RESULT_PARSER**.

### The poison drill — eleven mutants at `f20f786`, detached worktree

Detached scratch worktree at `f20f786` (CONVENTIONS arm (c)); no
`CARGO_TARGET_DIR` hazard applies because no Rust body is drilled, and
`node_modules` plus `lib/parser/dist` were SYMLINKED in rather than
installed. Every mutation is **one side only, always the producer**,
applied by a Python driver that REFUSES a path outside the drill and
requires a match count of exactly 1; every mutated TEXT was read back
with `git diff --unified=0` before its suite ran. Baseline **57/57 exit
0** (40 docs-input-gate + 17 workflow-parity).

| # | mutant (producer side only) | exit | tally | reds |
|---|---|---|---|---|
| N1 | `normalisePaths` pushes the raw arg, not the normalised one | 1 | 1F/56P | EVERY SPELLING, at `:686` (`./`) |
| N2 | the blank-argument guard is dead | 1 | 1F/56P | EVERY SPELLING, at `:698` (blank) |
| N3 | the newline-blob guard is dead | 1 | 1F/56P | EVERY SPELLING, at `:702` (blob) |
| N4 | the ambiguity guard is dead | 1 | 1F/56P | EVERY SPELLING, at `:707` (plain relative) |
| N5 | zero paths returns CLEAN, not USAGE | 1 | 3F/54P | T-084-s6 body **+ EXIT MATRIX + EMPTY-LIST TRAP** |
| N6 | the `catch` returns FOUND, not CANNOT_RUN | 1 | 1F/56P | **EXIT MATRIX only** |
| N7 | `lint:docs` gains `\|\| exit 1` | 1 | 1F/56P | **EXIT OBJECT only** |
| N8 | the command is renamed in CONVENTIONS | 1 | 4F/53P | derive + unaccounted + both new fixtures |
| N9 | the ci.yml docs-gate step is deleted | 1 | 1F/56P | **verbatim-and-in-CI-order, by name** |
| N10 | `commandBullets` reads a markerless bullet | 1 | 13F/44P | the SILENT-shape fixture + 12 |
| N11 | a middle dot inside the `index --check` parenthetical | 1 | 5F/52P | the middle-dot fixture + 4 |

**THE FOUR ARMS OF THE PATH VOCABULARY DISCRIMINATE, AND THAT IS THE
PART WORTH HAVING.** N1–N4 all red the same BODY, so "one body reds"
would not have shown they are four rules rather than one. They red at
four DIFFERENT assertions — `:686`, `:698`, `:702`, `:707` — each naming
its own finding. A gate that normalised but did not refuse passes rows 1
and 3 and dies on rows 5 and 7.

**N2 TAUGHT SOMETHING THE CARD DID NOT ASK FOR.** With the trim guard
dead, `""` is STILL refused — it resolves to the repository root and the
root-relative guard catches it — while `"   "` slips through. So the
empty string is doubly guarded and the blank string singly, which makes
`"   "` the strictly dominant pin. That is T-101's `"   "`-over-`""`
lesson arriving independently in a different file.

**N5 vs N6 is the shape-six check asked and answered**: both move an
exit code in the same file, and they red DIFFERENT sets — N5 three
bodies, N6 exactly one — so the EXIT MATRIX body is not the empty-list
body restated.

**Restoration proved THREE ways after every mutant and again at the
end**: `git checkout -- .` with a tracked-change count of 0, sha256 of
each of the seven touched files against `git show f20f786:<path>` (all
seven MATCH), and a clean re-run at **57/57 exit 0**. The symlinks were
UNLINKED rather than deleted and all four targets verified present
afterwards; the worktree was removed and pruned. The main checkout was
never touched.

### Where the brief was wrong, and one measurement pitfall

- **The brief said the exit-mapping figures must carry their platform,
  and that GNU could not be measured here. Both correct.** It also said
  135 specs "at the last checkpoint — re-derive": re-derived, **135**,
  unchanged.
- **The brief's fence and prohibitions held.** Nothing outside
  `[tools/e2e, .github/, docs/CONVENTIONS.md]` plus this card was
  touched. 1420 was read once with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
  and never probed: holder `node` pid **82549**, one socket
  `TCP [::1]:1420 (LISTEN)`.
- **`$?` IS CLOBBERED BY A COMMAND SUBSTITUTION IN THE SAME LINE, and it
  read as a clean sweep.** Measuring the spellings with
  `node … ; echo "$(printf '%-52s' "$spec") -> $?"` printed **0 for every
  row**, including rows that had just been measured as 1 and 2 — the
  `$(printf …)` subshell runs before `$?` is expanded and resets it. Two
  minutes of believing the fix had broken everything. **Capture `rc=$?`
  on the very next token, then print.** This is the same discipline the
  card demands of its own matrix, failing at the shell level rather than
  the pipe level, and it is worth writing down because the false reading
  was uniformly *green-looking*.
