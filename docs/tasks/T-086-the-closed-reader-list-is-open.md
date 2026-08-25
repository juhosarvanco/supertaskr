---
id: T-086
title: CONVENTIONS says the live-reader list is CLOSED AT TWO — it is four and counting, and the gate that could answer already exists
feature: F-06
milestone: 4
priority: 44
size: S
status: building
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-081-s6, T-078-s10 (fifth triage, 2026-08-20). Both files
removed in this commit.

`docs/CONVENTIONS.md:359-360` states, of files that read
`docs/CONVENTIONS.md` itself off disk: **"TWO LIVE READERS … CLOSED AT
TWO."** False three ways at this triage, and the fifth-triage census
names the third reader outright:
`tools/e2e/tests/docs-input-gate.spec.ts` reads the file through
`conventionsText()` — a reader ADDED BY THE GATE CARD, which means the
sentence went stale as a direct consequence of building the machinery
that could have kept it true. T-078-s10's half: the closure was
asserted over a property ("found by grep for the path") the sentence
never states, so it was unfalsifiable as written.

**The fix is deletion, not re-counting.** T-084's gate derives the
reader set from the tree and prints it on demand
(`node tools/e2e/scripts/docs-gate.mjs --census`). A sentence that
transcribes a count into prose is a second implementation of the
census, and this repository has now measured — five separate times —
what happens to transcribed counts.

## Acceptance criteria

- THE "CLOSED AT TWO" claim SHALL be deleted and replaced with the
  derivation: the reader list for this file is whatever
  `docs-gate.mjs --census` prints, and the bullet SHALL name that
  command rather than any count, matching the ruling T-084 already
  applied to the root-anchored figure.
- WHAT THE BULLET IS FOR SHALL SURVIVE: an editor of CONVENTIONS must
  still learn, from the bullet, that their edit can red suites and
  which command tells them which. The walk-table's purpose is the
  warning, not the census.
- IF any other transcribed reader-count survives in CONVENTIONS THEN
  this card SHALL correct it the same way or state why it stays — the
  class is the finding, not the instance.
- THE three live readers of CONVENTIONS SHALL each be run green at the
  edit (kit.rs's stamp test, workflow-parity, docs-input-gate), since
  editing this file is exactly the act the bullet warns about.

Verification: headless — the three readers run with exits stated; the
docs gate run on the diff and its owed suites run. @human: none.

## Implementation notes

`claude-opus-5`, executor, size S, lane
`/Users/ujju/Projects/nputer-T-086` on `task/T-086-closed-reader-list`,
base **`c4c15c8`**. Fence `[docs/CONVENTIONS.md]`, never widened: the
only tracked file this lane edits is `docs/CONVENTIONS.md`, plus this
card and one suggestion file, which every lane writes.

**MAIN MOVED UNDER THIS LANE AND THE FIGURES BELOW SAY WHICH REF THEY
WERE TAKEN AT.** At dispatch main was `c4c15c8`; while this lane worked
it advanced to **`29c0f4f`** (four commits, T-111 returning `planned` —
NOT BUILT), adding **4** paths, all `docs/tasks/T-111*`. `comm`-style
check: main's advance and this branch share no path, so
`git merge-tree --write-tree 29c0f4f HEAD` exits **0** with a tree and
the merge's diff is this branch's own.

### What changed — three edits, one file

**1. THE CARD'S SUBJECT.** *"BUT TWO LIVE READERS SIT OUTSIDE ALL FOUR
WALKS, AND THIS LIST IS CLOSED AT TWO"* is gone. What stands in its place
is the warning without the census: live readers sit outside all four
walks, this file is one of the things they read, so an edit here can red
a suite no walk row can see — and **which readers is a derivation**,
`node tools/e2e/scripts/docs-gate.mjs --census` from the repo root, or
the same gate on your own diff for the suites you OWE. The retraction is
recorded in place (this file's own T-090 precedent, three bullets down)
with three reasons: it was FALSE, it was UNFALSIFIABLE as written because
it never said what makes a file a reader, and **the reader that broke it
was added by the card that built the census** —
`tools/e2e/tests/docs-input-gate.spec.ts`, via `conventionsText()`.

Two further facts came out of the archaeology and are in the shipped
text because they are the argument for deleting rather than re-counting:
**T-078's executor predicted this exact failure in its own notes**
(*"if a third live reader of this file appears … 'CLOSED AT TWO' [makes]
it worse than the open version it replaced"*, under WHAT I AM LEAST
CONFIDENT ABOUT), and **T-078-s6's ask requested the closed form in as
many words** (*"so the table's list of non-walk readers is closed rather
than open"*). A card can specify a defect into existence and a faithful
editor will build it — the POISON DRILL bullet's own T-057 lesson,
arriving in prose instead of in a test.

**2. A FALSE DURATION IN THE SAME BULLET, MEASURED RATHER THAN LEFT.**
The paragraph above the subject said the TOKEN row went stale *"ONE DAY
LATER"* and closed with *"TWO SIGNPOSTS IN TWO DAYS"*. Both are false.
`git log -1 --format=%ci` puts `d64c673` at **2026-08-25 02:10:07** and
`91398f9` at **03:49:24 the same morning** — **ninety-nine minutes**, one
day. It is the identical error the RANGE RULE bullet already records
about its own *"false for weeks"*, and the file's own rule names it: an
unrefed DURATION goes stale exactly the way an unrefed count does. The
tail now reads THREE stale signposts in this one bullet (the `.rs` row,
the TOKEN row, this retraction), every one caught by the lane that
falsified it and not one by a gate.

**3. CRITERION 3's SWEEP, and the disposition is "they stay, with their
ref".** The only other transcribed counts in this file that are
reader-derived are the DOCS GATE bullet's three proportionality figures.
**ALL THREE ARE TRUE at `c4c15c8`, asked of the gate rather than
reasoned**: `docs/rooms/naming.md` -> **1** command (`npm test from
tools/e2e/`); `docs/CONVENTIONS.md` -> **2** (`cargo test from
app/src-tauri/`, `npm test from tools/e2e/`) and not the app suite; a
flat `docs/tasks/T-*.md` -> **3** (app, tools/e2e, lib/parser). They stay
because they are counts of the gate's ANSWER, not of readers, and because
the sentence they carry — a wide trigger with a narrow answer — collapses
without them. What they gained is the treatment this card is about: the
ref they were derived at, and an explicit sentence that they are the
answer's SHAPE and not its census, so a new reader in a fourth suite
moves them without touching the page.

Also checked and NOT changed: *"THE FOUR SUITES the derived readers sit
in"* is true (`docs-gate: … across 4 suites`) and is a fact about the
repository's package count, already flagged re-derivable in place; and
the `AND THE COUNTS ARE PRINTED, NEVER PINNED` paragraph's TOKEN 118 /
CONTROL 496 already carry the ref `e4a5ae7` and the instruction to
re-derive, which is the shape this card argues for rather than against.

### Each criterion

1. **MET.** The claim is deleted; the bullet names
   `node tools/e2e/scripts/docs-gate.mjs --census` and no count of
   readers. Matches the ruling T-084 applied to the root-anchored figure
   (`NO COUNT IS TRANSCRIBED INTO THIS BULLET`) and the identical one in
   ARCHITECTURE's layout section.
2. **MET, and it is the criterion the edit was built around.** The
   bullet still teaches (a) that an edit to this file can red a suite no
   walk row can see, (b) the command that says WHICH, and (c) the two
   mechanisms most likely to bite — a command-bullet edit reds
   `workflow-parity.spec.ts`, and the method stamp reds
   `snapshot_version_matches_the_live_method_stamps` in `kit.rs` — kept
   verbatim and relabelled as SHAPES, never as the list. The `kit.rs`
   sentences matter beyond this bullet: gotcha one's three-file-bump
   ruling and `T-078-s3` both cite them.
3. **MET, in the "state why it stays" direction** — see edit 3 above.
   The class was swept, every instance was re-derived at this ref, and
   none was false.
4. **MET.** The gate derives **FIVE** readers of `docs/CONVENTIONS.md` at
   this ref, not three, and every one ran green BY NAME — see SUITES.

### The parity derivation — unchanged, and the check ran both ways

`buildAndTestSection` / `commandBullets` / `structuralProblems`
re-implemented from their own doc comments and run over the file before
and after:

| | file lines | section lines | bullets | exposed commands | structural problems | U+00B7 section / file |
|---|---|---|---|---|---|---|
| `c4c15c8` (base) | 1408 | 259 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| after the edit | 1452 | **259** | **4/5/5/7** | **21** | **0** | **20 / 23** |

**FORTY-FOUR LINES WERE ADDED AND THE SECTION DID NOT MOVE BY ONE LINE,
ONE COMMAND OR ONE MIDDLE DOT**, and the 21 commands are identical BY
NAME on both rows. The edit adds **ZERO** U+00B7 — deliberately, since
all of it lands in `## Gotchas` and in the DOCS GATE bullet, which
`buildAndTestSection` cannot reach because it splits on `^## ` first.
Confirmed live: `workflow-parity.spec.ts` is 17 bodies green inside the
146/146 E2E run.

`docs/CONVENTIONS.md` still carries **`currently v0.1.5`** (line 266,
untouched), which is what `cargo test` reads off disk.

### Gates — derived from THIS lane's diff, at main `29c0f4f`

The executor form of the RANGE RULE, exit read first:

    TREE=$(git merge-tree --write-tree 29c0f4f HEAD)   -> exit 0
    git diff --name-only 29c0f4f "$TREE"

| gate | trigger | on this diff |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 paths — NOT OWED** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 paths — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **FIRES** |

- **GRAPH REGEN — NOT OWED on 0 of the diff's paths, AND ASKED ANYWAY**
  as the bullet demands. `cargo run -p nputer-index -- index --check
  --root ../..` is **exit 0, CURRENT** at **920 597 bytes / 178 files /
  1959 symbols / 1878 edges** — the dispatch brief's figures, re-derived
  here rather than quoted, and unmoved.
- **BOOT GATE — NOT OWED, 0 paths.** `npm run boot:check` was NOT run,
  and that is derived rather than skipped.
- **DOCS GATE — exit 1, FIRES**, invoked from the repo root with the
  range rule's own path list as ROOT-RELATIVE `$(…)` arguments, **never
  through `xargs`**. On the CONVENTIONS-only tip it named **two** suites
  (`cargo test from app/src-tauri/`, `npm test from tools/e2e/`) and
  **five** readers of this file: `app/src-tauri/src/agent/kit.rs`,
  `tools/e2e/tests/docs-input-gate.spec.ts`,
  `tools/e2e/tests/shell-frame.spec.ts`,
  `tools/e2e/tests/window-contract.spec.ts`,
  `tools/e2e/tests/workflow-parity.spec.ts`. With this card and
  `T-086-s1` in the diff it names **four** suites, the two above plus
  `npm test from app/` and `npx vitest run from lib/parser/`. **All four
  were run.**

### No POISON DRILL is owed, and that is shown rather than claimed

**THIS DIFF CONTAINS NO TEST BODY.** Its whole content is markdown —
`docs/CONVENTIONS.md`, this card, `docs/tasks/T-086-s1-*.md` — and a grep
of the changed path list for `\.(ts|tsx|js|jsx|mjs|rs)$` returns **0**.
There is no new or changed assertion to mutate, so no drill was run and
none is being claimed. No scratch worktree was created; none was needed.

### Suites — every exit read from `$?` unpiped, every COUNT read too

At `2db5047` (the CONVENTIONS-only tip), in this lane's own worktree:

- **`cargo test` from app/src-tauri — 455 passed / 0 failed / 3 ignored,
  exit 0**, summed over **SIXTEEN** `test result:` lines. **THE HONEST
  TALLY IS 1 RED IN 3 AND THE RED WAS THE FIRST RUN** — see the
  intermittent below; nothing was discarded on the way to a number, and
  both greens are stated with their line count because an exit alone
  cannot tell a green suite from one that stopped early (run 1 produced
  only FOUR `test result:` lines, which is what a `cargo test` looks like
  when it halts at a failing target).
- **`npm test` from tools/e2e — 146/146, exit 0**, on scratch port
  **15251**. The first attempt was **145 passed / 1 failed, exit 1** on
  port **15250** — `T-120-s3`, below.
- **`npm test` from app — 958/958 across 46 files, exit 0**, after
  `npm run build` **exit 0** (the fresh-worktree ordering rule: five app
  bodies read `app/dist`).
- **`npx vitest run` from lib/parser — 264/264 across 12 files, exit 0.**
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0**,
  **`npm run lint:tokens -- --selftest` exit 0** (65 TOKEN + 4 CONTROL
  samples, 87 walk-policy checks, 9 evidence-floor checks) and
  **`npm run lint:tokens` exit 0** at **TOKEN 132 / CONTROL 685**.
  **CONTROL is 685 here against STATE's 688 at T-052's checkpoint** — the
  corpus is `git ls-files`, so it moves with the tree and this lane is
  cut from an older one. Derive it at your own ref.
- Setup, in the fresh-clone ORDER: `npm ci` + `npm run build` from
  lib/parser, `npm install` from app, `npm ci` from tools/e2e — all
  **exit 0**. This is a fresh lane worktree, not the checkout serving
  port 1420, so no live product's dependency tree was touched.

**THE THREE READERS THE CARD NAMES RAN GREEN BY NAME, AND SO DID THE TWO
IT DOES NOT.** `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
reads `ok` in ALL THREE cargo runs, including the red one;
`workflow-parity.spec.ts` is 17 bodies green, `docs-input-gate.spec.ts`
42, `shell-frame.spec.ts` 6 and `window-contract.spec.ts` 5, with **no
non-passing body among the five files**.

### Two known intermittents met, both declared

**`T-120-s3` FIRED, EXACTLY WHERE STATE PREDICTED IT WOULD.**
`tools/e2e/tests/token-scan.spec.ts:201` failed on the FIRST E2E run in
this fresh lane worktree — *"restored its MTIME too"*, `Expected:
1787655727832.5427` against `Received: 1787655727833`, which is the
rounded-`Date` diagnosis in STATE reproduced to the digit — and was green
on the second run in the same checkout. STATE's own words: *"it fires in
exactly the places this project creates most often: a fresh lane worktree
and a fresh poison-drill worktree."* This is a sighting of a filed,
unfixed defect and NOT a new finding, so no suggestion was filed for it;
the one-token fix is in `tools/e2e`, held by another lane tonight.

**THE `a_hostile_session_id…` INTERMITTENT FIRED TOO, AND THAT ONE IS A
FINDING** — filed as **`T-086-s1`**. It redded in cargo run 1 of 3 while
the `docs_watch` body was GREEN and the lib suite finished in **3.97s**,
inside the fast band T-110 measured for an isolated target dir. That
**refutes STATE's own conjecture** that the two bodies share a
slow-checkout condition — a conjecture STATE had already hedged as *"a
hypothesis with two data points, not a diagnosis"*. Run alone the body is
**5 green in 5** (0.18–0.45s), reproducing STATE's other half exactly.
It cannot be this lane's: the diff has zero `.rs` paths.

### Where the dispatch brief and this card were wrong

- **THE CARD'S TITLE SAYS THE LIST IS "FOUR AND COUNTING"; THE GATE SAYS
  FIVE.** At `c4c15c8` `docs-gate.mjs` derives five readers of
  `docs/CONVENTIONS.md` — the three the card's body names plus
  `shell-frame.spec.ts` and `window-contract.spec.ts`, which `walk()` all
  of `docs/`. The card's body is right that three read the file's
  CONTENT; the title's number is a transcribed count that went stale
  before the card was built, which is the finding happening to the card
  that files it. **This is why the shipped text prints no number at all.**
- **THE BRIEF SAID THE FILE HAD PROVED THE RULE AGAINST ITSELF "THREE
  TIMES IN TWO DAYS".** The two prior merges are ninety-nine minutes
  apart on ONE day (`d64c673` 02:10:07, `91398f9` 03:49:24, both
  2026-08-25) — the brief inherited the file's own false duration, which
  edit 2 corrects at its source.
- **THE BRIEF SAID MAIN WAS AT `c4c15c8`.** True at assembly, false by
  the time this lane finished: main is `29c0f4f`, four commits and four
  paths ahead, disjoint from this fence.
- **THE BRIEF'S BASE GRAPH FIGURES AND PARITY FIGURES WERE EXACTLY
  RIGHT** — 920 597 bytes / 178 files / 1959 symbols / 1878 edges, and
  21 commands / 4/5/5/7 / 0 problems / 20 dots in the section and 23 in
  the file. Re-derived, not quoted.
- **THE BRIEF SAID `tools/e2e` IS HELD BY T-091 AND MUST NOT BE EDITED.**
  Obeyed: this lane READ that package (and ran its commands inside its
  OWN worktree's copy) and changed not one byte of it. `git diff
  --name-only c4c15c8..HEAD` names three paths, all under `docs/`.
- **LANE LIST AT DISPATCH, RE-DERIVED FROM `git worktree list` RATHER
  THAN FROM THE BRIEF**: T-033, T-086, T-091, T-102, T-107, T-111 — the
  brief's five plus this one, all disjoint from `[docs/CONVENTIONS.md]`.
  Plus `../nputer-app`, detached, @human's app checkout, not a lane.

### Process

Main (`/Users/ujju/Projects/nputer`) was NEVER entered or written; every
fact about it here came from `git` against the shared object store. Port
**1420** was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else, at the start and at the end: holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, **identical both times** — never
bind-probed, connected to or signalled, and `/Users/ujju/Projects/nputer-app`
was never entered. Scratch ports **15250** and **15251** were `lsof`-read
FIRST (zero rows), then bind-confirmed free on `127.0.0.1`, `0.0.0.0`,
`::1` and `::` in that order and never the reverse, and both were free
again after. **No `pkill`. No `cargo clean` — main's target directory was
not touched at all, and this lane built its own.** No sibling worktree
was entered; the untracked `z` in the main checkout was left alone. No
real CLI spawn, no model call, no screen control. Nothing was merged and
the worktree is left in place for the integration turn.

### Second pass, AT THE NOTES TIP `3ca4ae7` — all four owed suites, green

The suites above ran at `2db5047`, before this card and `T-086-s1`
existed. Re-run with all three paths in the diff, which is what takes the
DOCS GATE from two suites to four:

    git merge-tree --write-tree 29c0f4f HEAD     -> exit 0, tree 2b54976
    git diff --name-only 29c0f4f 2b54976         -> 3 paths
    node tools/e2e/scripts/docs-gate.mjs $(…)    -> exit 1, FIRES on 3

**FOUR SUITES NAMED, FOUR RUN:** `cargo test` from app/src-tauri **exit
0, 455 passed / 0 failed / 3 ignored over 16 `test result:` lines**;
`npm test` from app **exit 0, 958/958 across 46 files**; `npx vitest run`
from lib/parser **exit 0, 264/264 across 12 files**; `npm test` from
tools/e2e **exit 0, 146/146** on scratch port **15252**. The gate's
frontmatter half reports **every live task card parses with a legal
status**, which is `T-086-s1`'s own frontmatter checked rather than
assumed. The parity derivation is unchanged at this tip: 21 exposed
commands, 4/5/5/7, 0 structural problems, 20 U+00B7 in the section and 23
in the file. `snapshot_version_matches_the_live_method_stamps` reads `ok`
here too. **No intermittent fired in this pass** — `T-120-s3` was green,
which is its documented behaviour once a checkout has met it, and the
`a_hostile_session_id…` body was green, taking this lane's tally to
**1 red in 4** full `cargo test` runs.

**THE RE-RUN REGRESS IS SETTLED BY DERIVATION, NOT BY A FIFTH PASS.**
Appending this section edits a card AFTER its suites passed. What those
four suites read out of a `docs/tasks/T-*.md` is its EXISTENCE in the
file set and its FRONTMATTER — the parser's card parse and status
vocabulary, the two app dogfood fixtures' id arrays and counts, and the
two lane specs' `walk()` of the tree, which consumes the FILE LIST. This
append adds no file, removes none, and moves no frontmatter field, so it
cannot move any of their answers. The rule bites on the file set, not on
the prose (STATE's own settlement of the identical regress).
