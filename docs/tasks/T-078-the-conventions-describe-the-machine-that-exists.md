---
id: T-078
title: The conventions describe the machine that exists — the walks, the gate's window, and the drill's missing clauses
feature: F-01
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [docs/CONVENTIONS.md, method/]
builder: claude-opus-5 @T-078
verifier: claude-opus-5 @T-078-reverify
built_by: claude-opus-5 @T-078
verified_by: claude-opus-5 @T-078-reverify
review: same-model
---

Absorbs: T-054-s1, T-054-s2, T-054-s3, T-054-s4, T-060-s1, T-060-s2
(fourth triage, 2026-08-19). The suggestion files are removed in the
same commit as this card. Six findings, one file. Two cards touching
only `docs/CONVENTIONS.md` could never run in parallel anyway, so they
are one card.

**HOW A RULE GOES UNWRITTEN WHILE EVERYONE BELIEVES IT EXISTS.** T-060's
re-verification verdict ends "No blocker or new suggestion remains",
which reads as closing all five of its findings. Two of them — s1 and s2
— are filed explicitly as CLASSES whose entire ask is a paragraph in
this file, and their INSTANCES were indeed fixed on that branch. Grep
over `docs/CONVENTIONS.md` and `method/` at the fourth triage for every
phrase in either ask returned **zero hits**. The rules were never
written, the verdict sentence was true about the code and misleading
about the method, and both files sat at `status: suggested` for three
triages while the project believed the lesson had landed. That is the
motivation for this card, and it is also the reason its criteria are
about TEXT rather than about behaviour.

THE POISON DRILL IS THE SHARPEST HALF AND IT BIT ITS OWN VERIFIER ON THE
FIRST DRILL. A global substitution of a message literal over
`workflow-parity.spec.ts` reported three substitutions and stayed GREEN
at 14 passed, exit 0. The literal lives once in the producer and once in
each of two assertions, so the mutation changed both sides at once and
the test still agreed with itself. **A symmetric mutation produces a
green indistinguishable from a vacuous assertion — the exact failure the
drill exists to detect, wearing the drill's own costume.** The recorded
lesson ("count your substitutions, never assume a mutation landed")
would NOT have caught it: three was the true number of occurrences and
three is what applied. The same failure one level deeper, in the same
session: a doc mutation written through a perl one-liner reported one
substitution and changed nothing observable, because without a UTF-8
output layer perl emitted a raw byte rather than the two-byte separator
the splitter looks for. The count was right; the TEXT was wrong.

## Acceptance criteria
- THE POISON DRILL bullet SHALL gain the ONE-SIDEDNESS clause, in its
  "MUTATE every new or changed assertion" sentence: *mutating the code
  under test OR the assertion, never a literal the two SHARE, and
  confirming the mutated TEXT is what you intended rather than only that
  a substitution count was non-zero. A symmetric mutation stays green
  and reads exactly like a vacuous assertion.* The bullet already says
  to mutate every changed ASSERTION rather than every body and is right
  about why; one-sidedness is the natural companion, because both are
  about making the mutation land where the assertion can see it.
- THE SAME BULLET SHALL NUMBER THE TWO SHAPES A VALUE-POISON PASSES,
  because two lanes independently found one in the same week and both
  have now landed. The four already catalogued share one tell — **the
  matcher moved, never the value**. These two do not:
  - **SHAPE FIVE — the assertion SET has no cardinality or coverage
    floor, so deleting an assertion deletes its own failure.** Measured
    on `token-scan.mjs` (filed as T-058-s2, absorbed by **T-080**):
    four deletions applied one at a time each left the selftest green at
    a SMALLER printed number, and the sharpest lost the only positive
    sample for each of four patterns and stayed green everywhere. The
    module already knows this class exists — its own must-cover list
    records T-045 measuring it — and defends exactly one property with
    it. **Shape five is listed FIRST because it has a mechanical
    remedy**: a coverage floor per pattern id, or a cardinality pin,
    makes a deletion fail against something that did not move with it.
  - **SHAPE SIX — a body that reds under an expected-value poison while
    killing no mutant another test does not already kill.** Measured on
    `interview-model.test.ts` (filed as T-057-s1, absorbed by **T-072**):
    a replacement positive was byte-equivalent to a test three cases
    above it, and rewriting one inert string made the two calls
    character-identical with the file still passing 58 of 58. It is not
    vacuous in the poison sense, which is precisely why the poison
    discipline passed it. There is no mechanical remedy — the drill has
    to ask whether the body kills a mutant of its OWN.
- THE TESTING GOTCHAS SHALL GAIN THE NEGATIVE-CONTROL RULE, beside the
  constant-parametrisation rule T-063 produced, because they are one
  lesson from two directions and a reader meeting one should meet the
  other: *a test that asserts something is REFUSED must first prove the
  fixture would otherwise have been ACCEPTED; otherwise it cannot tell
  refusal from absence.* Worked example, measured: a lookup asserted to
  return nothing for a relative path element passed with the
  pre-T-060 VULNERABILITY restored, because the fixture did not exist
  relative to the test's working directory and both implementations
  refused it for different reasons. Counting assertions would not have
  shown it; only mutating the producer did. For a path-shaped fixture
  the control has to be built the way the PRODUCER builds it, not merely
  written to look similar.
- AND THE GUARD-LIFT RULE, which the same session paid for: *when a test
  lifts a safety guard in order to discriminate, the lifted arm SHALL be
  proven to terminate in a fixture, and the body SHALL assert the
  guard's state before it exercises anything.* The discriminating half
  of a SAFETY guard is by construction a deliberate removal of the
  safety, executed in the same process as every other test with whatever
  ambient environment the developer has — **the stronger the guard, the
  more dangerous its own discriminator**. T-060 reached the developer's
  real CLI inside the test written to prove that could not happen. The
  instance is now structurally unreachable (child process, empty search
  path, pre-flight assert) rather than argued away; the RULE is written
  nowhere, and it applies to every guard the project has: the ACL pin,
  the containment rules, the session-id character class, the cleared
  environment.
- A CITATION SHALL NAME A SYMBOL, NOT A LINE. Four of the fourth
  triage's forty-six findings cited line numbers that no longer
  resolved, every one of them drifted downward by a later merge into the
  same file while the finding's SUBSTANCE reproduced exactly. A file
  path plus a function, test or constant name survives the merges a line
  number does not, and it is what a reader can search for.
- THE GRAPH REGEN TRIGGER SHALL STOP SAYING "outside docs/". The
  indexer's walk is narrower than the rule: `.nputerignore` excludes
  `docs/`, `tools/` AND the indexer's own fixture trees, so a diff
  confined to `tools/**` matches the trigger and cannot move the graph
  by construction — demonstrated on T-054's own branch, whose diff
  included a `.ts` file under `tools/` and whose `index --check`
  reported the graph current and unchanged. The error direction is SAFE,
  which is why this is a wording fix and not a defect. **PREFERRED ARM,
  because it cannot go stale**: keep the wide trigger and say the regen
  is a NO-OP unless an INDEXED file moved, with `index --check` as the
  one-second way to find out — inverting the rule from "predict whether
  to regen" into "ask the gate", which is the shape T-054 made
  available.
- THE "WHICH WALK SEES THIS FILE" OPEN QUESTION SHALL BE CLOSED WITH ONE
  SHORT TABLE, stating the walks side by side: the graph's walk, the
  token lint's TOKEN corpus, the token lint's CONTROL corpus, and the
  parser's live-docs walk. STATE carries this as an open question and
  every integrator re-derives it; the 2026-08-17 merge is the live case,
  where five new files split four to the graph and five to the lint.
  **The table SHALL accommodate the fourth walk T-058 added** — a
  CONTROL corpus of 529 files against TOKEN's 118 at `9b15f7d` — and
  SHALL cross-reference `.nputerignore` and the scanner as the
  authorities rather than restating their contents, so it cannot drift
  from the files that decide it.
- GRAPH REGEN's claim that the property is "held by a gate" SHALL STOP
  READING PRESENT-TENSE. `git remote` returns ZERO remotes — verified
  again at the fourth triage — and this file says so itself one section
  above. The bullet SHALL name the local confirmation it already implies
  and say beside it that the CI step becomes the ENFORCING copy at the
  repo's first push. The property is enforced by considerably more than
  nothing (the regen obligation is retained in full, a failing regen
  reds on its own, and deleting the step reds the parity spec), but not
  by what the sentence claims.
- `lint:tokens` SHALL GAIN AN EXIT-CODE LEGEND. This file legends exit
  codes for the graph check, the boot check and the audit; **CI's FIRST
  step is the only gate without one**. The legend SHALL describe what
  the gate does TODAY, including the gap: a tree the gate cannot read
  (git absent, the corpus underivable) and a tree that is genuinely
  dirty both exit 1, so "the gate could not run" and "the tree has a
  violation" are no longer distinguishable. **T-080 restores that
  distinction**; this criterion SHALL be written so it does not depend
  on T-080 landing first, and SHALL gain the second row when it does.
- THE MIDDLE-DOT SEPARATOR RULE SHALL GET A HOME a next editor will
  read: a separator may not appear inside a command's parenthetical,
  only between commands or after the last one. It currently lives only
  in T-054's implementation notes, which the next editor of the build
  section will not open. **PREFERRED HOME: a clause in the CI bullet
  itself, which keeps this card `docs/CONVENTIONS.md`-only.** The
  alternative home — the parity spec's own docstring, which already
  explains the ends-at-first-non-backtick rule in general terms but
  never names the parenthetical hazard — **WIDENS THIS CARD'S FENCE TO
  `tools/e2e`** and SHALL be chosen deliberately if at all.
- AND T-054'S NOTES SHALL BE CORRECTED WITH IT. They say three commands
  "would have silently vanished from CI parity". Measured: the exposed
  command count drops from 19 to 16 and the lane REDS, 2 failed and 12
  passed, naming all three by key — because the derivation's second
  direction catches every truncated command the spec CLAIMS. The
  truncation is silent in exactly ONE case: a command the DOC gains that
  the spec does not yet claim. That is narrower, more precise, and the
  shape of every future edit to that section, which is why it is worth
  stating exactly.

Verification: prose only. The parity spec SHALL stay green — it parses
this file, so every edit to a command bullet is a live test. Poison
discipline applies to any spec change, one-sided per this card's own new
clause. **No code fence is held: `docs/CONVENTIONS.md` and `method/`
collide with no code lane**, which is why this card is dispatchable
beside anything.

## Implementation notes

Built by `claude-opus-5 @T-078`, fresh session, in worktree
`nputer-T-078` off **`e4a5ae7`** (a STATE checkpoint, per DISPATCH FROM
THE LAST CHECKPOINT). Main was never touched. Port 1420 was read-only
`lsof`-probed at session start and again at the end — one healthy
listener, node pid **82549**, `[::1]:1420 (LISTEN)`, the same pid both
times — and was never bound, connected to or signalled. This lane used
scratch port **17851**, bind-probed free first (alongside 17853 and
17855) and empty afterwards. `npm ci` ran only in this worktree, in the
fresh-clone order the doc specifies: lib/parser (55 packages) + build,
app (499), tools/e2e (8), all `found 0 vulnerabilities`.

**Understanding, confirmed before anything was touched** (CLAUDE.md):
this card is about TEXT, not behaviour. Every criterion exists because a
rule this project relies on daily is written nowhere, or because a
bullet describes a machine that differs from the one that runs. I read
`docs/STATE.md`, `docs/CONVENTIONS.md` in full, `method/roles/*` and
`method/tasks/TASK-FORMAT.md`, this card, and the six absorbed findings
(recovered from git where their files were removed) before the first
edit. The one trap I had to plan around: `tools/e2e/tests/workflow-parity.spec.ts`
DERIVES its expectations from the "Build & test" section, so two of these
criteria land inside a live test's input while the rest land in
`## Gotchas`, which is a different `## ` section and outside the parse.

### WHERE EACH EDIT LANDED RELATIVE TO THE PARSED REGION

`buildAndTestSection()` splits on `^## ` and keeps the "Build & test"
chunk, so `## Gotchas` is outside the derivation entirely. Verified per
edit rather than assumed.

**INSIDE the parsed region — two edits, both re-enumerated before and
after:**

1. **`lint:tokens` gains an exit-code legend.** Short legend inline in
   its own parenthetical (`exit 0 clean, 1 EITHER a violation OR a gate
   that could not run`), commas only and no separator character, exactly
   the shape `index --check`'s legend uses; the collapse itself and the
   T-080 pointer are trailing prose at the END of the tools/e2e bullet,
   past the point where the command list already broke. The legend
   describes the gate as it behaves TODAY, names the collapse as a known
   gap, and says it gains its second row when T-080 lands — so neither
   card blocks the other and this one stays docs-only.
2. **The CI bullet gains the MIDDLE-DOT rule.** Preferred home taken;
   `tools/e2e` was NOT widened. The clause names U+00B7 MIDDLE DOT
   without typing it, keeping the card's own discipline, and states the
   rule as "between commands, or after the last one — never inside a
   command's parenthetical".

**OUTSIDE the parsed region — five edits in `## Gotchas`:**

3. **POISON DRILL gains the ONE-SIDEDNESS clause** in the "MUTATE every
   new or changed assertion" sentence, plus the WHY with both
   measurements (the symmetric substitution, and the `perl -0777`
   mutation whose count was right and whose text was wrong).
4. **The same bullet numbers SHAPE FIVE and SHAPE SIX**, five first
   because it has a mechanical remedy, both cited to the files they were
   measured on and to the cards that absorb them. The old "deliberately
   NOT given an ordinal" parenthetical is replaced.
5. **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL** (T-060-s2), with
   T-063's constant-parametrisation rule stated beside it as its
   companion — see the finding below; that rule did not exist either, so
   "beside" had to be made true rather than found true.
6. **LIFTING A SAFETY GUARD TO DISCRIMINATE** (T-060-s1), both halves
   required: the lifted arm proven to terminate in a fixture, and the
   guard's state asserted before anything is exercised.
7. **A CITATION NAMES A SYMBOL, NOT A LINE**, placed with the other
   record-keeping conventions near the top of Gotchas.
8. **THE FOUR WALKS**, a table placed immediately before GRAPH REGEN so
   a reader meets it before the trigger. It cross-references the
   authorities (`.nputerignore`, `Lang::for_extension`, `walk_root`, the
   four scanner constants, `project.ts`) rather than restating them, and
   accommodates T-058's CONTROL corpus as the fourth walk.
9. **GRAPH REGEN keeps its WIDE trigger** and gains the preferred arm:
   the regen is a NO-OP unless an INDEXED file moved, with
   `index --check` as the one-second way to ask instead of predicting.
   Its "held by a gate" sentence now reads in the future tense, names
   the integrator's hand run as the confirmation the property actually
   has today, and is fair about the three tripwires that do hold it
   (retained regen obligation, a failing regen reds on its own, deleting
   the CI step reds the parity spec).

**One edit outside `docs/CONVENTIONS.md`:** the criterion "AND T-054'S
NOTES SHALL BE CORRECTED WITH IT" required
`docs/tasks/T-054-retire-the-interim-graph-rule.md`. Corrected IN PLACE
with a dated attribution, following the T-034 precedent from T-058's
merge rather than appending a footnote. It is documentation, no lane
holds it, and the card names it — but it is outside the literal fence
`[docs/CONVENTIONS.md, method/]` and is flagged here rather than
buried.

**`method/` was deliberately NOT touched.** Every criterion names this
file or a bullet in it, and a `method/` FORMAT change is a three-file
commit whose third file is Rust — see T-078-s3.

### THE DERIVATION, ENUMERATED (the T-054 discipline, re-run here)

The derivation was re-implemented inline and CALIBRATED against
`git show e4a5ae7:docs/CONVENTIONS.md`, where the right answer is known
independently: **19 exposed commands, `structuralProblems` empty, dirs
exactly the four, and every CI-bullet needle present** — byte-for-byte
T-054's recorded enumeration. Against the final wording it returns the
SAME 19, the same four dirs, zero structural problems and zero missing
needles. Nothing entered or left the parsed list.

### THE MIDDLE-DOT DRILL — the claim reproduced, and T-054's notes corrected

Applied to the WORKING file, one substitution, and the mutated text read
back with `git diff` before the suite was run (this card's own
one-sidedness clause, applied to itself). **The first attempt asserted
`count == 1` and got 0** — my pattern assumed a line break in the wrong
place — which is exactly the failure the clause exists to catch, caught
by the assert rather than by a missing red.

    exposed commands   19 → 16   (cargo audit, index --watch, arch)
    parity spec        2 failed, 12 passed, exit 1
    named by key       "this spec expects [app/src-tauri] cargo audit,
                        which docs/CONVENTIONS.md "Build & test" no
                        longer lists" — and the same for the other two

**So "three commands would have silently vanished" is wrong in its most
important word**, and T-054's notes now say the measured thing: the
derivation's second direction catches every truncated command the spec
CLAIMS, and the truncation is silent in exactly ONE case — a command the
DOC gains that the spec does not yet claim.

**RESTORATION PROVED, not asserted**: after the drill the working file
was restored and `shasum -a 256` matched the pre-drill copy exactly
(`ec5b2148…`), with `cmp` reporting identical and the enumerator back to
19.

### SUITES — first-hand in this worktree, every exit code read from `$?` unpiped

| suite | baseline at `e4a5ae7` | after |
|---|---|---|
| lib/parser `npx vitest run` | **234/234**, 12 files, exit 0 | **234/234**, 12 files, exit 0 |
| tools/e2e parity spec alone | **14 passed**, exit 0 | **14 passed**, exit 0 |
| tools/e2e full lane (port 17851) | **88 passed**, exit 0 | **88 passed**, exit 0 |
| `npm run lint:tokens` | TOKEN 118 / CONTROL **496**, exit 0 | see below |
| `npm run lint:tokens -- --selftest` | 49 TOKEN + 2 CONTROL samples, 37 walk checks, exit 0 | unchanged |

The parser suite's smoke test parses the live `docs/` tree and requires
zero issues, so the three new suggestion files below are covered by it.
No suite output was piped through `tail`, `head` or `grep` before its
exit code was read; every run wrote to a file and `$?` was read directly.

### GATE TRIGGERS, COMPUTED RATHER THAN SKIPPED

- **BOOT GATE: DOES NOT FIRE.** The trigger set is `app/src-tauri/**`,
  `app/src/**`, `app/package.json`, `app/src-tauri/Cargo.toml`. Over
  this branch's whole diff plus untracked files it matches **zero
  paths** — the diff is `docs/` only. `boot:check` was not run and there
  is no exit code to record.
- **GRAPH REGEN: DOES NOT FIRE EITHER.** The trigger is
  `*.ts/*.tsx/*.js/*.jsx` outside `docs/`; this diff contains **zero**
  such paths, every file being a `.md` under `docs/`. This is the
  cleaner half of the T-054-s1 story: the wide trigger over-fires on
  `tools/**`, and on a docs-only diff it does not fire at all.
  `docs/architecture/graph.json` was NOT regenerated and is a 0-file
  diff, confirmed by `git diff --name-only` on it.
- **The graph cannot have moved regardless**, and this is ENTAILED
  rather than sampled: `docs/` is `.nputerignore`d, so no file in this
  diff is in the indexer's walk at all.

### CLAIMS THAT DID NOT REPRODUCE

Four, all measured, none of them a defect in the build:

1. **CONTROL is 496 at `e4a5ae7`, not 529.** The dispatch baseline and
   several documents carry 529, which is the count at T-058's merge
   `7c6c5aa`. TOKEN 118 reproduces exactly.
2. **STATE attributes 529 to `9b15f7d`; that ref is 521** — the eight
   files that commit removed. Filed as **T-078-s2**.
3. **"the constant-parametrisation rule T-063 produced" is not in
   `docs/CONVENTIONS.md` or `method/`.** Zero hits for
   `parametris|parametriz` and zero for `T-063` in either. It lives only
   in T-063's implementation notes. Filed as **T-078-s1**; the rule is
   now stated as a companion sentence so the criterion's purpose ("a
   reader meeting one should meet the other") is true rather than
   assumed.
4. **STATE does not carry "which walk sees this file" as an open
   question** at `e4a5ae7`. The card says it does. The question is real
   and the table is worth writing — every integrator has been
   re-deriving it — but it is not in STATE's Open questions section, so
   nothing there needs striking out.

**One hypothesis of my OWN that did not reproduce, recorded because a
near-miss is news:** I believed `docs/CONVENTIONS.md` was pinned at
exactly one `[?]` marker by `app/test/genesis-pane-dom.test.tsx` and
`genesis-derive.test.ts`, and wrote every edit avoiding that character
on that basis. Checked rather than trusted: both tests read
`fixtureTree("streak")`, a fixture repo under
`app/test/fixtures/genesis/`, not the live tree. The constraint is
imaginary. **The live coupling that IS real** is the Rust test
`snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs`, which reads the real
`docs/CONVENTIONS.md` and requires the literal `currently v0.1.5` —
verified present and unchanged. That is T-078-s3.

### SUGGESTIONS FILED

- **T-078-s1** — the rule this card was told to write "beside" does not
  exist either; the ask is a sweep of done-card notes for lessons that
  live nowhere else.
- **T-078-s2** — STATE's CONTROL 529 belongs to `7c6c5aa`, not
  `9b15f7d`; a table of the count at four refs.
- **T-078-s3** — a `[docs/CONVENTIONS.md, method/]` fence cannot change
  `method/` formats, because the version bump lands in a Rust constant.

### FOR THE VERIFIER

- **The parsed region is where to attack this.** Re-run the enumeration
  against the final wording and confirm 19 / four dirs / no structural
  problems / no missing CI needle; then re-run the middle-dot drill and
  confirm 19 → 16 with `2 failed, 12 passed`. Both are one command.
- **The E2E lane needs `app/node_modules`** even for the parity spec,
  because playwright.config starts the app's vite server for the whole
  run. The spec itself opens no browser.
- **`docs/tasks/T-054-*.md` is edited** and is outside the literal
  fence; see above for why, and reject that half if the architect reads
  the fence strictly — nothing else depends on it.
- **What I am least confident about**: the walk table's row for the
  GRAPH walk compresses three authorities into one cell
  (`.nputerignore`, `Lang::for_extension`, `walk_root`), and a reader
  could take the row as normative despite the sentence telling them not
  to. It is a signpost by design, but it is the row most likely to be
  quoted as if it were the policy.

### THE REJECTION FIX — second executor, `claude-opus-5 @T-078-fix`

Fresh session in worktree `nputer-T-078`, branch `task/T-078-conventions`
off tip **`041e8ec`**, fixing the 2026-08-19 REJECTED verdict below.
Commits added on top; nothing rebased or rewritten. **The verdict
section is untouched** — it is the record. `status: verifying`,
`verifier:`, `verified_by:` and `review:` all left as they stand.

An earlier attempt at this same fix died on a transient API error after
re-deriving both numbers and before writing anything; it committed
nothing and the worktree was clean, so this is a from-scratch redo with
nothing recovered. This session commits incrementally for that reason.

**Both integers were re-derived here from the commands, not taken from
the verdict or the dispatch.** That mattered: one of the two did not
reproduce a second time.

#### (a) `38 removed` → `46`. CONFIRMED, and the fix is now self-checking.

Derived by SET DIFFERENCE first, which is independent of rename
detection and of any range notation:

    git ls-tree -r --name-only 7c6c5aa -- docs/tasks | wc -l   ->  143
    git ls-tree -r --name-only e4a5ae7 -- docs/tasks | wc -l   ->  110
    comm -23 (sorted 7c6c5aa) (sorted e4a5ae7)   ->  46   removed
    comm -13 (sorted 7c6c5aa) (sorted e4a5ae7)   ->  13   added
    comm -12 (sorted 7c6c5aa) (sorted e4a5ae7)   ->  97   common

46 + 97 = 143 and 13 + 97 = 110, both trees closed. Cross-checked with
`git diff --no-renames --name-status 7c6c5aa e4a5ae7 -- docs/tasks`
(A=13 D=46 M=9) and against the wrong range,
`9b15f7d..e4a5ae7` (A=13 D=38 M=6) — so `38/13` is confirmed as the
count over the LATER range. The eight-file gap was enumerated rather
than asserted: `comm -23` of the two deletion lists returns eight paths,
byte-identical to `git diff --name-status 9b15f7d^ 9b15f7d`'s eight `D`
lines. "nothing outside docs/tasks" re-verified: whole-repo the range is
A=13 D=46 M=10, the extra M being `docs/STATE.md`, which cannot move a
file count.

The bullet now carries the command that re-derives it and the arithmetic
that closes it (`143 − 46 + 13 = 110`), which is T-078-s4's second arm —
a delta a reader can run beats a number they must trust — and it names
its own near-miss: `38` was the count one commit shy of the ref it was
quoted at, and those eight files are exactly the eight the next sentence
already invokes.

#### (b) `three files from the root` — **NOT four either. It is FIVE at this ref, and I did not write a bare numeral.**

Re-derived at every ref on the branch, `git grep -c "POISON DRILL"` from
the repo ROOT (which is finding (b)'s own subject, so it was run from
`/Users/ujju/Projects/nputer-T-078` and separately from `app/`):

    c4208c6  4    d92afc7  4
    e4a5ae7  4    1e96599  5    <- the commit that FILED T-078-s5
    22b31f1  4    5ffe89c  5
                  041e8ec  5

**The count became five at `1e96599` — the commit that filed T-078-s5,
the finding whose entire content is "three should be four".** The
suggestion file quotes the search string, so filing it matched it. Four was true when the verifier measured it and false by the
time the fix was dispatched.

Writing `four` would therefore have shipped, for the THIRD time in this
paragraph's neighbourhood, a figure derived at a ref other than the one
it is written at — the exact defect (a) is about, in the exact bullet
about citing accurately. So I took **T-078-s5's own preferred arm**:
the tally is dropped and the SHAPE is cited — which files, in which
directories, root versus `app/` — with the four-to-five drift kept as
the bullet's worked example, since a bullet warning that counts drift is
better served by a count that visibly drifted than by a new one.
Re-measured against the edited file, the sentence is literally true:
from the root the search finds this file, its cards under `docs/tasks`
and a test under `app/test`; from `app/` it finds the `app/` one and
none of the others.

One quiet defect fixed with it: the parenthetical wrote its own search
string across a line break (`POISON` / `DRILL`), so `git grep "POISON
DRILL"` did not find the sentence that teaches the search — the file's
only hit was the drill bullet itself. Unwrapped; this file now carries
three hits instead of one, and the file count is unchanged.

**If the architect wants the bare numeral after all**, the minimal form
is `four at e4a5ae7` — pinned, permanently true, and one edit away. I
judged the shape better and am flagging the deviation rather than
burying it.

#### (c) T-078-s6 — CLOSED in the walk table.

The table volunteered the E2E coupling and stopped, which reads as a
complete list of the ways an edit here can red something. It now names
**two live readers outside the four walks and says the list is closed at
two**: the E2E lane (unchanged), and the cargo suite, cited by SYMBOL
per this card's own new rule —
`snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs`, which reads this file off disk on every
`cargo test`. Verified first-hand at `kit.rs:437` (the test), `448-453`
(the `read_to_string` and the assert) and `kit.rs:35`
(`METHOD_SNAPSHOT_VERSION: &str = "0.1.5"`), not taken from s6.

**The `currently v0.1.5` literal is deliberately NOT duplicated.** The
new sentence cites the stamp as `currently v<METHOD_SNAPSHOT_VERSION>`,
so a future method bump stays a one-place edit in this file. Quoting the
literal a second time would have made the pin harder to move while
appearing to document it.

**s6's OTHER half — declined, in writing.** s6 also asks for T-078-s3
arm 1: naming `METHOD_SNAPSHOT_VERSION` in the FIRST gotcha. Declined
here for two reasons. T-078-s3 is a separate open suggestion for triage,
not a T-078 criterion; and that gotcha's text is the exact string
`kit.rs` asserts on, so editing it is the one edit on this branch that
can red the cargo suite. The information s6 wanted a reader to have is
now in the walk table, which points back at gotcha one and says the
stamp is an ENFORCED PIN rather than bookkeeping — s6's stated purpose,
without touching the pinned line.

#### SCOPE — three additions beyond the two integers, each separately declinable

The eleven green criteria were not re-opened and no passing prose was
touched. Beyond the integers themselves I added: the re-derivation
command and the closing arithmetic in the counts sentence; the sentence
naming `38` as the near-miss; and the four-to-five drift as the citation
bullet's worked example. Each is inside a sentence the verdict rejected,
each discharges the second arm of s4 or s5, and each can be cut without
touching the fix. Flagged rather than buried.

#### THE TRAP IN THE FENCE — verified, not assumed

`buildAndTestSection()` splits on `^## ` and this file has exactly two
`^## ` headings, "Build & test" (line 3) and "Gotchas" (line 159); all
three edits are in Gotchas. I re-implemented `buildAndTestSection` /
`commandBullets` / `structuralProblems` / `ciBullet` inline from the
spec's source, deriving the CI needle list from `CI_SEQUENCE` and
`LOCAL_ONLY` rather than guessing it, and **calibrated at `e4a5ae7`**:

| ref | dirs | exposed | structuralProblems | missing needles |
|---|---|---|---|---|
| `e4a5ae7` | `["lib/parser","app","app/src-tauri","tools/e2e"]` | **19** | 0 | 0 |
| after these edits | same, same order | **19** | 0 | 0 |

Per-bullet split `4 / 5 / 5 / 5` both times, and the two enumerations
`diff` byte-identically — command strings included. **One real catch
here**: my first draft of the s6 clause used INDENTED SUB-BULLETS, which
is precisely the shape `structuralProblems` flags. It was outside the
parsed region so it derived clean — but this file contains **zero**
indented bullets anywhere, and introducing its first ones, in a card
about not tripping this derivation, was the wrong instinct. Rewritten as
flowing prose; `awk '/^[ \t]+- /'` over the whole file now returns
nothing.

#### MIDDLE DOT — no new one, proved directly rather than by totals

`git diff -U0 -- docs/CONVENTIONS.md | grep '^+' | grep <U+00B7>` returns
**no matches**: not one added line carries the character. That is
stronger than comparing totals, which two cancelling errors could
satisfy. Totals recorded anyway: 17 lines carry one at HEAD and 17 after,
same line set, shifted only by the lines added above them. **The verdict
says 16; every ref measures 17** — filed as T-078-s7, not fixed, since
the verdict is the record.

#### SUITES — first-hand, every exit code from `$?` unpiped, nothing piped through tail/head/grep

| suite | result | exit |
|---|---|---|
| `tools/e2e` parity spec (port 17871) | **14 passed** | 0 |
| `lib/parser` `npx vitest run` | **234 passed (234)**, 12 files | 0 |
| `lib/parser` again, with s7/s8/s9 in the tree | **234 passed (234)** | 0 |
| `npm run lint:tokens` at `1f0f7ae` | clean, TOKEN 118 / CONTROL **502** | 0 |
| `npm run lint:tokens` at `0770049` (final) | clean, TOKEN 118 / CONTROL **505** | 0 |
| `npm run lint:tokens -- --selftest` | 49 TOKEN + 2 CONTROL, 37 walk checks | 0 |

Each suite wrote to a file and `$?` was read from the unpiped command;
the files were read afterwards — nothing was piped through `tail`, `head`
or `grep` ahead of its exit code. CONTROL is 496 at `e4a5ae7`, **502**
once the six suggestion files this branch already carried are counted,
and **505** at the final commit with s7/s8/s9 added. Every count in this
subsection names the ref it was taken at, per T-078-s7.

#### GATE TRIGGERS — both computed, and the notation is a trap

**NEITHER GATE FIRES.** This branch's contribution at the final commit
`0770049` is **twelve** files, all `.md` under `docs/`; BOOT GATE
matches 0, GRAPH REGEN matches 0.
`docs/architecture/graph.json` was NOT regenerated and is a 0-file diff.
Entailed independently: `docs/` is `.nputerignore`d, so nothing in this
diff is in the indexer's walk at all.

**The first computation I ran was VACUOUS and I threw it away**: a
quoting bug passed the range as one argument, `git diff` errored, the
path list came back EMPTY, and an empty list satisfies every trigger —
a green that means "I measured nothing". Redone with a non-emptiness
assert so the zero is a real zero: at `1f0f7ae` 9 paths, census
`9 docs` / `9 md`; at `0770049` 12 paths, census `12 docs` / `12 md`.

**And the nine-versus-twelve is this card's own defect, caught in these
notes.** I first wrote "nine files" here — measured correctly at
`1f0f7ae`, before I had filed s7, s8 and s9, and stale by three the
moment I did. A bare count in prose went wrong inside the notes of the
fix for two bare counts going wrong, in the same session that filed
T-078-s7 asking that counts carry their ref. Caught by recomputing at
the final commit instead of trusting the earlier run. Every figure in
this subsection now names its ref.

**Main moved while this lane was open** — it is at `79ae34a` (T-043 and
T-076 merged); `git merge-base HEAD main` is still `e4a5ae7`. Computing
the gates as the BOOT GATE bullet literally reads, `git diff main HEAD`,
returns **44 paths and FIRES BOTH GATES** — 5 `.rs` and 13 `.ts` that
belong to T-043 and T-076, shown in reverse because a two-dot diff
between two divergent tips is symmetric. The true merge diff, computed
read-only with `git merge-tree --write-tree main HEAD` and then
`git diff main <tree>`, is exactly the twelve `docs/` files at
`0770049` and fires neither; the merge itself comes out clean.
**The integrator should not attribute a graph obligation to
T-078**: any `.ts` in a merge-time range belongs to T-076 and was
discharged at T-076's merge. Filed as T-078-s9.

#### FINDINGS FILED

- **T-078-s7** — the tally went stale inside the commit that filed the
  correction (four → five), plus the verdict's 16-vs-17 dot count. Ask:
  a tally in prose carries its ref or is not written.
- **T-078-s8** — T-078-s5's PROPOSED replacement sentence is false on
  both halves (`tools/` has zero hits; the `app/` hit it denies is the
  one its contrast needs). Diagnosis measured, remedy not — and the
  remedy is the half that gets copied into the tree.
- **T-078-s9** — the gate bullets' range notation inverts before the
  merge, measured above.

**A near-miss against T-078-s4, recorded because it cuts against me.**
I suspected s4's `M=10` / `M=7` were mis-scoped, because the same ranges
filtered `-- docs/tasks` give 9 and 6, and drafted it as a second
instance inside s8. Measured before filing: s4's worked commands carry
NO path filter, so 10 and 7 are exactly what they print. **All four of
s4's figures reproduce byte-for-byte.** I nearly filed, against the file
that named this defect, the defect itself. What caught it was running
the command as WRITTEN instead of the command I assumed was meant.

#### WHAT DID NOT REPRODUCE

1. **`four files from the root`** — five at this ref, and at every ref
   from `1e96599` on. Detailed above; the dispatch, the verdict and
   T-078-s5 all carry four.
2. **`16 lines carry a U+00B7`** — 17 at `e4a5ae7`, at `22b31f1` and
   here. No consequence; the invariant that matters holds and was
   re-proved a stronger way.
3. **T-078-s5's proposed replacement wording** — false on both halves.
4. **Both gates "do not fire" under the bullet's own notation** — under
   `git diff main HEAD` they both fire. The conclusion survives; the
   route to it in the bullet does not.

#### WHAT I AM LEAST CONFIDENT ABOUT

**The (b) deviation is a judgement call and it is the one to attack.**
The dispatch asked for `three` → `four`; I wrote neither numeral. My
reasoning is that four was measurably false at the ref I was writing at,
and that s5 itself prefers the shape — but a verifier who holds that an
executor should write the integer they were sent to write and file the
staleness separately would be applying a defensible rule, and the fix is
one edit (`four at e4a5ae7`).

Second: the walk table's new sentence now runs long, and the closed list
is only closed as of today. If a third live reader of this file appears,
the sentence becomes exactly the false-completeness s6 objected to, with
"CLOSED AT TWO" making it worse than the open version it replaced. It is
the right shape for a table meant to be trusted, but it is a claim with a
maintenance cost and no gate behind it — no test asserts that only two
non-walk readers exist.

#### PROCESS

Main (`/Users/ujju/Projects/nputer`) was never touched. Port **1420**
was read-only `lsof`-probed at session start and end: one healthy
listener, node pid **82549**, `[::1]:1420 (LISTEN)`, same pid both
times, never bound, connected to or signalled. This lane used scratch
port **17871**, bind-probed free first (with 17873) and left empty. The
three live sibling worktrees (T-069, T-073, T-076) were never entered.
The two `fake_agent` orphans (**52504/52505**, ppid 1, from
`nputer-T-060`) are pre-existing, are not mine, and were left alone. No
process of mine survives this session. No screen control, no model
calls, no new dependencies, no `npm ci` — the worktree's `node_modules`
were already installed.

## Verdicts

### 2026-08-19 — REJECTED (claude-opus-5 @T-078-verify, review: same-model)

Verified `22b31f1` against `e4a5ae7` in worktree `nputer-T-078`, fresh
session, executor's reasoning read only from the committed card. **Range
derived here, not inherited**: `git merge-base HEAD main` = `e4a5ae7`,
`git rev-list --count e4a5ae7..22b31f1` = **3**, diff **6 files,
+605/-33** — `docs/CONVENTIONS.md` (+222/-25), `docs/tasks/T-054-…`
(+23/-5), this card (+229/-3), and three new `T-078-s1..s3`. Zero
untracked files. Main was never touched; port 1420 was read-only
`lsof`-probed at start and end — one listener, node pid **82549**,
`[::1]:1420 (LISTEN)`, same pid both times, never bound, connected to or
signalled. This lane used scratch port **17861** (empty before, empty
after). The two `fake_agent` orphans (52504/52505, ppid 1, from
`nputer-T-060`) are pre-existing and were left alone; no process of mine
survives.

**Eleven of eleven acceptance criteria hold in substance, and every
mechanical claim in the notes reproduced.** The rejection is narrow and
mechanical: **two measured figures this branch WRITES INTO
`docs/CONVENTIONS.md` do not reproduce**, in the file whose whole
purpose under this card is to describe the machine that exists. Both are
one-integer fixes inside the existing fence. Details in "TWO FIGURES
THAT DO NOT REPRODUCE" below.

#### THE TRAP IN ITS OWN FENCE — checked first, and it holds

`buildAndTestSection()` splits on `^## `, so `## Gotchas` is outside the
derivation entirely. I re-implemented `buildAndTestSection` /
`commandBullets` / `structuralProblems` / `ciBullet` inline from the
spec's source and **calibrated at `e4a5ae7`, where the answer is known
independently**:

| ref | dirs | exposed commands | structuralProblems | missing CI needles |
|---|---|---|---|---|
| `e4a5ae7` | `["lib/parser","app","app/src-tauri","tools/e2e"]` | **19** | 0 | 0 |
| `22b31f1` | same, same order | **19** | 0 | 0 |

The per-bullet split is identical too — 4 / 5 / 5 / 5 — and the nineteen
command STRINGS are byte-identical before and after. Nothing entered or
left the parsed list.

**Each of the two in-region edits checked independently.** (a) The
`lint:tokens` legend sits inside the `npm run lint:tokens` parenthetical
and uses commas only; the parse still yields `npm run lint:tokens` as
segment 4 and `npm run boot:check` as segment 5, and the break still
falls at `1 the boot failed`. (b) The whole ~15-line token-lint
exposition is appended AFTER that break, so it is unreachable by the
parse whatever it contains. (c) The middle-dot clause lands in the CI
bullet, which carries no `run from <dir>/:` marker — confirmed by the
dirs list being exactly the four. I enumerated every U+00B7 in the file
with `awk`: 16 lines carry one or more, and **every one is pre-existing
except line 61**, where the separator still sits BETWEEN
`npm run lint:tokens`'s closing paren and `npm run boot:check`. No new
middle dot exists anywhere in the file.

**Live suites, first-hand in this worktree, every exit read from `$?`
unpiped:**

| suite | result | exit |
|---|---|---|
| `lib/parser` `npx vitest run` | **234 passed (234)**, 12 files | 0 |
| parity spec alone (port 17861) | **14 passed** | 0 |
| `tools/e2e` full lane (port 17861) | **88 passed** | 0 |
| `npm run lint:tokens` | `clean (TOKEN 118 …; CONTROL 499 …)` | 0 |
| `npm run lint:tokens -- --selftest` | 49 TOKEN + 2 CONTROL, 37 walk checks | 0 |

CONTROL **499** at `22b31f1` is 496 + the three new suggestion files —
consistent with the doc's own 496 at `e4a5ae7`.

#### BOTH GATES: COMPUTED, NEITHER FIRES

- **BOOT GATE — does not fire.** Trigger set `app/src-tauri/**`,
  `app/src/**`, `app/package.json`, `app/src-tauri/Cargo.toml` over
  `e4a5ae7..22b31f1` plus untracked: **0 of 6 paths match** (all six are
  `.md` under `docs/`). `boot:check` was not run; there is no
  `BOOT_EXIT` to record, and the script does not print one.
- **GRAPH REGEN — does not fire.** Trigger `*.ts/*.tsx/*.js/*.jsx`
  outside `docs/`: **0 matches**. `docs/architecture/graph.json` is a
  0-file diff and was not regenerated. Entailed independently: `docs/`
  is `.nputerignore`d, so no file in this diff is in the indexer's walk
  at all.

#### THE MIDDLE-DOT DRILL — reproduced independently, and it discriminates

Run inline, no scratch script, on the working file. One substitution
(`exit 0 current, 1` → `exit 0 current · 1`), **asserted == 1 and
aborted otherwise** — the discriminating assert, and it is a real one:
it fires on the exact line-break mistake the executor's first attempt
made. The mutated TEXT was then read back before the suite ran, per this
card's own new clause: `git diff` showed the intended line, and
`od -c` showed the separator as `302 267` = U+00B7 in UTF-8, not a raw
byte and not a lookalike.

    exposed commands   19 → 16   (cargo audit, index --watch, arch)
    parity spec        2 failed, 12 passed   exit 1
    named by key       "this spec expects [app/src-tauri] cargo audit,
                        which docs/CONVENTIONS.md "Build & test" no
                        longer lists …" — and the same for the other two

**Restoration proved, not asserted**: working file back to
`1e174732138d2f361c6813141bdbb3e01502ea10a2220eaa1a9fdfa955012556`,
byte-equal to `git show HEAD:docs/CONVENTIONS.md`, `git diff` empty,
enumerator back to **19**.

**Second drill, on a claim the doc makes about itself.** The GRAPH REGEN
bullet now says "deleting the CI step reds
`tools/e2e/tests/workflow-parity.spec.ts` by name". Deleted the three
lines of the `graph currency (nputer-index index --check)` step from
`.github/workflows/ci.yml` (1 substitution, asserted, read back with
`git diff`): **1 failed, 13 passed, exit 1**, message
`missing verbatim step: [app/src-tauri] cargo run -p nputer-index -- index --check --root ../..`.
Restored; sha256 `5598c3eb…` matches `git show HEAD:.github/workflows/ci.yml`.

#### CRITERION BY CRITERION

1. **One-sidedness clause.** Present, and inside the right sentence —
   `docs/CONVENTIONS.md` POISON DRILL bullet: "MUTATE ONE SIDE ONLY: the
   code under test OR the assertion, never a literal the two SHARE; and
   confirm the mutated TEXT is what you intended rather than only that a
   substitution COUNT was non-zero." Both halves the criterion names,
   and the WHY carries both measurements. **HOLDS.**
2. **The two shapes get ordinals, five before six.** `SHAPE FIVE` =
   assertion set with no cardinality/coverage floor (token-scan.mjs
   `selftest()`, T-058-s2 → T-080); `SHAPE SIX` = a body that reds under
   a value poison while killing no unique mutant (interview-model.test.ts,
   T-057-s1 → T-072). Five first, with the mechanical-remedy reason. The
   "deliberately NOT given an ordinal" parenthetical is gone. **Checked
   for a silent renumber across every citing file**, which is the real
   risk: `docs/STATE.md:488-490` already assigns five to T-058-s2/T-080
   and six to T-057-s1/T-072; `T-080` line 63 says "this is poison shape
   five"; `T-072` line 38 says "poison shape SIX". All four agree with
   what landed. **HOLDS, no citation broken.**
3. **Negative-control rule, beside the constant-parametrisation rule.**
   `git grep` (from the repo ROOT, per the standing rule) over
   `docs/CONVENTIONS.md` and `method/`: at `e4a5ae7`, `positive control`
   → **0 hits**, `negative assertion` → **0**, `parametris|parametriz` →
   **0**, `T-063` → **0**. At `22b31f1`: the rule at
   `docs/CONVENTIONS.md:488` and its companion sentence at 510-513
   ("A TEST PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT PIN THAT
   CONSTANT (T-063 …)"). The criterion's premise was false and the
   executor made it true rather than pretending it held — the correct
   call, and the sharpest thing on the branch. **HOLDS.**
4. **Guard-lift rule, both halves.** `docs/CONVENTIONS.md:517`, zero
   hits for `lifting a safety guard` / `lifted arm` at `e4a5ae7`. Both
   obligations are present and stated as SHALLs: the lifted arm proven
   to terminate in a fixture ("pointed at one, not merely started at
   one") and the guard's state asserted before anything is exercised.
   **HOLDS.**
5. **A citation names a symbol, not a line.** Present at
   `docs/CONVENTIONS.md:165`, placed with the record-keeping conventions
   near the top of Gotchas. **HOLDS** — but its worked example carries a
   wrong number; see s5 below.
6. **GRAPH REGEN trigger.** The criterion's headline ("SHALL STOP SAYING
   'outside docs/'") and its **PREFERRED ARM** ("keep the wide trigger")
   contradict each other; the executor took the arm the criterion itself
   labels preferred and said so. Line 311 still reads "outside docs/",
   and lines 317-332 now say the trigger is deliberately wider than the
   walk, that a `tools/**`-only diff matches it and cannot move the
   graph by construction, that narrowing the wording to chase
   `.nputerignore` goes stale, and that `index --check` is the
   one-second way to ask instead of predicting. **HOLDS on substance.**
   Flagged for the record: a reader testing the headline alone would
   score this unmet, and the criterion, not the build, is what is
   ambiguous.
7. **The four-walks table.** Every authority claim re-derived against
   the source, not read: `.nputerignore` really does list `docs/`,
   `tools/` and `app/src-tauri/crates/nputer-index/tests/fixtures/`;
   `Lang::for_extension` (graph.rs:45) really returns a language for
   exactly `ts tsx mts cts js jsx` and for nothing else, so "`Lang::Rust`
   maps to no extension" is literally true (its only other use is
   `as_str()`); `walk_root` (walk.rs:42) really hard-skips `.git` and
   `node_modules` via `filter_entry` regardless of ignore files and
   really skips symlinks outright via its own `symlink_metadata` check
   beyond `follow_links(false)`. TOKEN's row matches `TOKEN_ROOTS` /
   `TOKEN_EXTENSIONS` / `TOKEN_EXCLUDED_FILES`; CONTROL's row matches
   `controlCorpus()`'s `git ls-files -z` minus `SKIP_DIRS` minus
   `CONTROL_BINARY_EXTENSIONS`; the parser's row matches
   `project.ts`'s flat `readdirSync` filters `/^T-.*\.md$/` and
   `/^C-.*\.md$/` plus `docs/ROADMAP.md`. **HOLDS** — but carries the
   `38 removed` error; see s4.
   **On the executor's own low-confidence point**: I do not think the
   GRAPH row misleads. The three-authority cell is the AUTHORITY column,
   whose job is to point; the "what it sees" cell it sits beside is
   accurate standing alone, and the table's most useful property is
   exactly the asymmetry it makes visible in one glance (`.mjs` is in
   TOKEN and NOT in the graph; `.rs` is in CONTROL and nothing else).
   A reader who quotes that row gets a true sentence.
8. **"Held by a gate" now reads future-tense.** `git remote` returns
   **zero** remotes (`git remote -v` prints nothing at exit 0;
   `git remote | wc -l` = 0) — confirmed at this session. The bullet now
   names the integrator's hand run as today's confirmation, says the CI
   step becomes the enforcing copy at the first push and not before, and
   is fair about the three tripwires. One of those three I drilled
   rather than took on trust: deleting the CI step really does red the
   parity spec by name (above). **HOLDS.**
9. **`lint:tokens` exit-code legend.** Present in the parenthetical
   ("exit 0 clean, 1 EITHER a violation OR a gate that could not run")
   with the collapse explained after the bullet's command list, and it
   does not depend on T-080. **The central factual claim drilled, not
   read**: `env PATH=/var/empty/nonexistent node scripts/lint-tokens.mjs`
   → `Error: lint-tokens: cannot derive tracked CONTROL corpus: Error:
   spawnSync git ENOENT`, **exit 1** — byte-for-byte the message the doc
   quotes, at the code the doc claims. `tokenCorpus()` does rethrow
   (`cannot walk TOKEN root …`) rather than `process.exit(2)`. A clean
   run does name both corpora and their counts. **HOLDS.** One wording
   nit, not a defect: the doc says the two failures "look nothing alike
   on stdout" — true, but only because the corpus failure produces no
   stdout at all (it is an uncaught throw on stderr), while a violation
   prints hit lines on stdout and its summary on stderr.
10. **Middle-dot rule homed in the CI bullet.** Preferred home taken,
    `tools/e2e` not widened. The clause names "U+00B7 MIDDLE DOT" and
    **the discipline held**: I enumerated every U+00B7 in the file and
    none is inside the clause, none is new anywhere, and the derivation
    is unchanged at 19. **HOLDS.**
11. **T-054's notes corrected with it.** `docs/tasks/T-054-…` now says
    the measured thing: the exposed count drops 19 → 16 and the lane
    REDS naming all three keys, silent in exactly one case. I reproduced
    that measurement independently before reading their wording.
    **HOLDS.**

#### TWO FIGURES THAT DO NOT REPRODUCE — the rejection

Both are in text this branch ADDS to `docs/CONVENTIONS.md`. Neither
breaks a lane; both are the exact defect class the card exists to
remove, which is why they are a verdict and not a suggestion.

**(a) `38 removed` is measured from the wrong ref — it should be 46.**
The four-walks bullet says: *"the widely-quoted **529** is the count at
T-058's merge `7c6c5aa`, 33 tracked docs/tasks files ago (38 removed, 13
added, nothing outside docs/tasks)"*.

    git ls-tree -r --name-only 7c6c5aa -- docs/tasks | wc -l   ->  143
    git ls-tree -r --name-only e4a5ae7 -- docs/tasks | wc -l   ->  110
    git diff --no-renames --name-status 7c6c5aa e4a5ae7        ->  A=13 D=46 M=10
    143 - 46 + 13 = 110   (the tree)
    143 - 38 + 13 = 118   (the doc's arithmetic — off by 8)

`33` and `13 added` are right; `38 removed` is not. **38/13 is the count
over `9b15f7d..e4a5ae7`** (`A=13 D=38`), not over `7c6c5aa..e4a5ae7`.
The missing 8 are precisely the eight discharged suggestion files that
`9b15f7d` itself removed — the same eight the very next sentence
correctly invokes to explain STATE's 529/521 error. **The bullet whose
thesis is "DERIVE THE COUNT AT YOUR OWN REF" made the identical
off-by-one-commit mistake it is warning about, against the identical
commit.** "nothing outside docs/tasks" does hold: every A and D in that
range is under `docs/tasks/` (the one R is a move into
`docs/tasks/rejected/`); only `docs/STATE.md` is modified, which does
not change a count. Fix: `38` → `46`. Filed as **T-078-s4**.

**(b) `three files from the root` is four.** The new citation bullet
says: *"(measured: `git grep -c "POISON DRILL"` finds three files from
the root and one from app/)"*. Measured from the repo ROOT at
`22b31f1`: **four** files — `app/test/startup-recovery.test.ts`,
`docs/CONVENTIONS.md`, `docs/tasks/T-054-…` (5 hits) and
`docs/tasks/T-078-…` (3 hits). From `app/`: one. It was **four at
`e4a5ae7` too**, and four at `c4208c6`, so this never reproduced at any
point on the branch — it is not drift. The bullet's POINT survives
intact (root sees more than a subdirectory; 4 vs 1 makes it as well as 3
vs 1) and the rule above it is right; only the figure is wrong, in the
bullet about citing accurately. Fix: `three` → `four`, or drop the
count and keep "four files from the root, one from app/". Filed as
**T-078-s5**.

#### THE FOUR CLAIMS THAT DID NOT REPRODUCE — all four confirmed

Re-derived independently, with the instrument calibrated at refs where
the answer is known from outside it (the live lint prints 496 at
`e4a5ae7`; STATE's own table gives 529 at `7c6c5aa`):

| ref | CONTROL | independent check |
|---|---|---|
| `7c6c5aa` | **529** | STATE's table, `| 7c6c5aa merge | 547 | 529 |` |
| `9b15f7d` | **521** | `9b15f7d^` = 529 and the commit deletes exactly 8 files |
| `cb36c29` | **498** | — |
| `e4a5ae7` | **496** | matches the shipped `lint:tokens` |
| `22b31f1` | **499** | 496 + the three new suggestion files; live run agrees |

1. **CONTROL is 496 at `e4a5ae7`, not 529.** Confirmed. The dispatch
   brief's 529 is `7c6c5aa`'s figure. TOKEN 118 reproduces exactly.
2. **STATE attributes 529 to `9b15f7d`, where the tree is 521.**
   Confirmed — `docs/STATE.md` line 500 says "**CONTROL is 529, TOKEN is
   118** at `9b15f7d`", and `git diff --name-status 9b15f7d^ 9b15f7d`
   is 8 D + 3 M. STATE's table one section up is correct. T-078-s2 is
   accurate, including all four rows of its own table.
3. **The constant-parametrisation rule existed nowhere.** Confirmed by
   `git grep` at `e4a5ae7` over `docs/CONVENTIONS.md` and `method/`:
   zero for `parametris|parametriz`, zero for `T-063`. The criterion's
   "beside" rested on a false premise and the executor made it true. The
   right call, and T-078-s1's generalisation (sweep done-card notes for
   lessons that live only there) is the correct shape of the ask.
4. **STATE does not carry "which walk sees this file" as an open
   question** at `e4a5ae7`. Confirmed — its Open questions section
   carries six, and that is not one of them. Nothing there needed
   striking, so touching no STATE was right. Two of STATE's six ARE
   answered by this branch (the token-lint legend and the poison-shape
   ordinals), and STATE already anticipates that: its fourth-triage
   section says both are T-078 criteria and are "left in place rather
   than edited out, since this section is append-only". No gap.

#### THE TWO RULINGS I WAS ASKED FOR

**`docs/tasks/T-054-…` edited outside the literal fence — ALLOWED, keep
both halves.** `method/tasks/TASK-FORMAT.md:18` defines `touches:` as
"expected blast radius; orchestrator never parallelizes tasks with
overlapping touches", and §"Parallelism guardrails" repeats that its
whole function is scheduling. It is not a permission list. Three tests,
all passed: (i) a criterion the card carries — "AND T-054'S NOTES SHALL
BE CORRECTED WITH IT" — is architect-authored authority naming that
exact file; (ii) the scheduling purpose was not defeated: the three live
siblings declare `app-agent` (T-069), `app-shell` (T-073) and
`lib-parser` (T-076), and none of their branches touches any T-054 path
(`git diff --name-only main...HEAD` in each: 0 hits); (iii) the
precedent is real and was merged — T-058 (`touches: [tools/e2e]`)
rewrote `docs/tasks/T-034-map-tasks-lens.md` in place at `7c6c5aa`,
replacing a false paragraph with a measured five-row table. T-078's
version is stricter than that precedent, since it carries a dated
attribution the precedent did not. The improvement worth having is on
the CARD, not the diff: `touches:` should have named the file, or the
format should say a card's criteria widen its own fence.

**`method/` untouched — CORRECT, not a gap.** `touches:` declares blast
radius, never obligation, so listing `method/` reserved it and obliged
nothing. Every one of the eleven criteria names `docs/CONVENTIONS.md` or
a bullet in it; none names a `method/` file. And the executor's reason
is verified sound: `app/src-tauri/src/agent/kit.rs:451` reads the LIVE
`docs/CONVENTIONS.md` off disk on every `cargo test` and asserts it
contains `currently v{METHOD_SNAPSHOT_VERSION}`, with
`METHOD_SNAPSHOT_VERSION` a Rust `const` at `kit.rs:35` — so a `method/`
format bump is a three-file commit whose third file is Rust and could
not have been done under this fence. I confirmed the coupling is intact:
`currently v0.1.5` is present at `docs/CONVENTIONS.md:162` and **zero
added or removed lines in this branch's diff carry that needle**.
T-078-s3 states this accurately.

#### SECURITY SWEEP

Nil surface. The diff is six `.md` files under `docs/`: no input path, no
endpoint, no query, no dependency, no secret or key (`git diff` carries
no token-shaped literal), no default changed. All six files report
`charset=utf-8` under `file --mime`; the only non-ASCII the branch adds
that any machine reads is prose. The one executable behaviour the branch
can reach — the parity spec's derivation — is unchanged at 19 commands,
and the two drills I ran against it were restored with sha256 proof.

#### ONE MORE FINDING, NOT A BLOCKER

**The walk table volunteers one live coupling and omits the other.** It
says "THIS FILE is seen by CONTROL only: the parser never reads it,
which is why an edit here cannot move the parser suite — but see the CI
bullet …, because the E2E lane parses it and an edit there can red that
lane." Both halves are true. But having named ONE non-walk reader, the
sentence reads as a complete list, and it is not: `kit.rs:448-453` reads
this file live on every `cargo test`. An editor who trusts the table has
been warned about the lane that reds on a command bullet and not about
the Rust test that reds on the method stamp — one-sidedness of exactly
the kind this card's own new clause is about. One clause fixes it, and
T-078-s3 arm 1 already proposes the sentence. Filed as **T-078-s6**.

#### VERDICT

**REJECTED**, on (a) and (b) alone. Everything else on this branch is
verified: eleven criteria hold, both in-region edits leave the
derivation at 19/four/0/0, no new middle dot exists, the middle-dot and
CI-step drills both reproduce and both restored byte-exact, all four
non-reproducing claims are confirmed, both fence rulings go the
executor's way, the four suites are green at 234 / 14 / 88 / clean, and
neither gate fires. Re-verification after the fix is two integers and
one `npx playwright test tests/workflow-parity.spec.ts`.

**My own diff re-checked**, since this verdict adds four files to the
live `docs/` tree the parser smoke test walks: `lib/parser` **234 passed
(234)**, 12 files, exit 0; `npm run lint:tokens` clean at TOKEN 118 /
CONTROL **502** (499 + the three new suggestion files), exit 0; parity
spec **14 passed**, exit 0.

`status: verifying` left for the integrator.

### 2026-08-19 — RE-VERIFICATION after the rejection (claude-opus-5 @T-078-reverify, review: same-model)

Verified `5b5e1c7` in worktree `nputer-T-078`, fresh session, second
verifier. **Range derived here, not inherited**: `git merge-base HEAD main`
= `e4a5ae7`; `git rev-list --count 041e8ec..HEAD` = **4** commits
(`1f0f7ae`, `3a5e8ef`, `0770049`, `5b5e1c7`), diff **5 files, +519/-10**;
`git rev-list --count e4a5ae7..HEAD` = **14**, whole-branch diff **12
files, +1632/-36**. Staged set read first and EMPTY; zero untracked files.

**THE REJECTED ENTRY IS UNTOUCHED, PROVED BY HASH.** `## Verdicts` to EOF
at `041e8ec` and at `HEAD` are both 378 lines / 21785 bytes, sha256
`e47e0cbc47acb2fd99616121944dc00898e7ed74491c49b7fc34ab7f626335e3`
at both, `cmp` exit 0. Nothing in the predecessor's rejection was
softened, reworded or re-scoped.

#### (a) `38 removed` → `46` — CONFIRMED, re-derived by set difference

    git ls-tree -r --name-only 7c6c5aa -- docs/tasks | wc -l  ->  143
    git ls-tree -r --name-only e4a5ae7 -- docs/tasks | wc -l  ->  110
    comm -23  ->  46 removed    comm -13  ->  13 added    comm -12  ->  97 common
    46 + 97 = 143      13 + 97 = 110      143 - 46 + 13 = 110

Both trees close. Rename-detection independent, as claimed. Cross-checks
all reproduce: `git diff --no-renames --name-status 7c6c5aa e4a5ae7 --
docs/tasks` is **A=13 D=46 M=9**; whole-repo **A=13 D=46 M=10**, the extra
`M` being `docs/STATE.md`, which cannot move a file count, so "nothing
outside docs/tasks" holds. The wrong range `9b15f7d..e4a5ae7` is
**A=13 D=38 M=6** — so `38/13` is confirmed as the count over the later
range. **The eight-file gap is enumerated, not asserted**: `comm -23` of
the two deletion lists returns eight paths, and `cmp` against
`git diff --name-status 9b15f7d^ 9b15f7d`'s eight `D` lines exits **0** —
byte-identical (T-028-s5, T-029-s1/s6/s7, T-051-s6, T-060-s3/s4/s5). The
landed sentence carries the re-deriving command and the closing
arithmetic. **HOLDS.**

#### (b) the deviation — I RULE FOR THE EXECUTOR, and here is why

The mechanism verified first-hand, `git grep -c "POISON DRILL"` from the
repo ROOT at every ref on the branch:

    c4208c6 4   7f677df 4   22b31f1 4   afeedf8 4   33ba1c8 4
    9931fed 4   d92afc7 4   e4a5ae7 4
    1e96599 5   5ffe89c 5   041e8ec 5   1f0f7ae 5
    3a5e8ef 7   0770049 7   5b5e1c7 7   <- HEAD

**The transition is exactly where the executor says it is, and the cause
is enumerable.** `1e96599` adds exactly two files: `T-078-s4` (0 hits) and
`T-078-s5` (1 hit). So the count became five because the finding whose
entire content is "three should be four" quotes the search string.
`3a5e8ef` adds s7 (1), s8 (1), s9 (0) — five to seven. **Four is now
wrong by three**, and would have been wrong by two the day it was
dispatched.

The shape sentence that landed instead is literally true at HEAD, checked
against the live search: from the ROOT the seven hits are exactly
`docs/CONVENTIONS.md` (this file), five under `docs/tasks`, and one test
under `app/test`; run from `app/`, the search returns exactly
`test/startup-recovery.test.ts` and none of the others.

**The ruling.** The dispatch asked for an integer and the executor wrote
none. That is a deviation, and it is the right one. The verdict's own
`three -> four` was true at `22b31f1` and false before the fix could be
dispatched — falsified by the verifier's own act of filing the finding.
Writing `four` would have put a figure that is false at its own ref
inside the bullet whose thesis is that positional figures drift, in a
file whose purpose under this card is to describe the machine that
EXISTS. T-078-s5 names this arm as its own preferred one. The four-to-five
drift is kept as the bullet's worked example, both halves ref-attributed,
so the bullet now teaches the lesson instead of asserting it. And the
shape survived the test the numeral failed: three more files were added
after it was written and it is still exactly true.

Recorded against myself: `four at e4a5ae7` — pinned and permanently true —
is also defensible, is one edit away, and the executor offered it in
writing rather than burying the deviation. An architect reading criteria
strictly may prefer it. I do not, because a pinned historical count in a
bullet about a search a reader is meant to RUN informs nothing.

One quiet defect fixed with it, confirmed: at `041e8ec` this file's own
teaching sentence wrote `POISON` / `DRILL` across a line break, so
`git grep "POISON DRILL"` returned **1** hit in this file — the drill
bullet — and never the sentence teaching the search. At HEAD it returns
**3** (lines 175, 304, 435). Findable.

#### SUITES — first-hand in this worktree, every exit from `$?` unpiped

| suite | result | exit |
|---|---|---|
| `lib/parser` `npx vitest run` | **234 passed (234)**, 12 files | 0 |
| `tools/e2e` parity spec alone (port 17881) | **14 passed** | 0 |
| `tools/e2e` full lane (port 17881) | **88 passed** (22.0s), 0 failure marks | 0 |
| `npm run lint:tokens` | clean, **TOKEN 118** / CONTROL **505** | 0 |
| `npm run lint:tokens -- --selftest` | 49 TOKEN + 2 CONTROL samples, 37 walk checks | 0 |

Every run wrote to a file and `$?` was read from the unpiped command
before anything was inspected; nothing went through `tail`, `head` or
`grep` ahead of its exit code. All four baselines match. The tree is
clean after the lane's own plant/restore drills (`git status --porcelain`
empty). **`cargo` was NOT run**: this worktree has no `target/` at all
(0 files in `app/src-tauri/target/debug/deps`), a cold build is not in
the baseline set, and it would fetch dependencies — see the pin drill
below for how the cargo coupling was proved instead.

#### THE DERIVATION — calibrated at `e4a5ae7`, re-implemented from the spec's own exported functions

| ref | dirs | per-bullet | exposed | structuralProblems | ciBullet |
|---|---|---|---|---|---|
| `e4a5ae7` | `["lib/parser","app","app/src-tauri","tools/e2e"]` | 4/5/5/5 | **19** | 0 | found |
| `5b5e1c7` | same, same order | 4/5/5/5 | **19** | 0 | found |

The nineteen command STRINGS `diff` byte-identically between the two
refs — nothing entered or left the parsed list. `awk '/^[ \t]+- /'` over
the whole file returns **0**. The live spec agrees: test 2 ("the expected
commands derive cleanly") and test 3 ("every CONVENTIONS command is a
step, verbatim and in CI order") both pass, which is the needle check
run by the machine rather than by my transcription of it.

#### BOTH GATES — computed over a NON-EMPTY list, with the assert made real

The executor's own catch reproduces exactly. Passing the range as ONE
argument gives `fatal: ambiguous argument 'e4a5ae7 HEAD'`, **exit 128**,
an EMPTY path list — and an empty list scores **BOOT 0 / GRAPH 0**, a
green that means "I measured nothing". Redone with the assert
(`git-diff exit != 0 OR count == 0 -> abort`), the assert FIRES on that
run. Against the real list:

    merge-base e4a5ae7 ..HEAD + untracked   ->  12 paths, git diff exit 0
    census                                  ->  12 under docs/ , 12 .md , 0 elsewhere
    BOOT GATE  (app/src-tauri/**, app/src/**, either manifest)  ->  0
    GRAPH REGEN (*.ts/*.tsx/*.js/*.jsx outside docs/)          ->  0

**Neither gate fires, and the zero is a real zero.** Entailed
independently: `docs/` is `.nputerignore`d, so nothing in this diff is in
the indexer's walk. `docs/architecture/graph.json` is a 0-file diff and
was not regenerated.

#### THE ELEVEN GREEN CRITERIA — nothing moved, and this is structural

`git diff 041e8ec HEAD -- docs/CONVENTIONS.md` contains **exactly two
hunks**, `@@ -171,8 +171,15 @@` and `@@ -292,18 +299,37 @@` — the
citation bullet (criterion 5) and the walk table plus its counts sentence
(criterion 7). Every other byte of the file is identical to the version
the first verifier passed on eleven criteria, so the other nine cannot
have moved. `docs/tasks/T-054-…` (criterion 11) is untouched by the fix
range entirely. Needles re-checked live at HEAD anyway: `MUTATE ONE SIDE
ONLY` 1, `SHAPE FIVE` 1, `SHAPE SIX` 1, `A NEGATIVE ASSERTION NEEDS A
POSITIVE CONTROL` (line 514) 1, `A TEST PARAMETRISED BY THE CONSTANT` 1,
`T-063` 1, `LIFTING A SAFETY GUARD TO DISCRIMINATE` (line 543) 1,
`lifted arm` 1, `A CITATION NAMES A SYMBOL, NOT A LINE` 1, `THE FOUR
WALKS` 2, the `exit 0 clean, 1 EITHER a violation` legend (line 59) 1,
`U+00B7` 1, `deliberately NOT given an ordinal` **0** (correctly gone).
The ordinal citations outside this file still agree: `T-080` line 63
"poison shape five", `T-072` line 38 "poison shape SIX", `docs/STATE.md`.

#### THE MIDDLE DOT — settled at SEVENTEEN, and the executor's proof command is weaker than its claim

Measured with a UTF-8 layer at seven refs — `e4a5ae7`, `c4208c6`,
`22b31f1`, `d92afc7`, `041e8ec`, `1f0f7ae`, `5b5e1c7` — the answer is
**17 lines carrying, 21 occurrences, at every single one**, including
`22b31f1`, the ref the rejecting verdict measured at. Line set at HEAD:
`10 11 14 15 16 17 22 25 26 29 56 58 61 65 66` (fifteen, in "Build &
test") plus `419 420` (two, the boot-gate legend) = seventeen.
**T-078-s7 is right and the prior verdict's 16 does not reproduce.**

The invariant that matters holds, re-proved with an explicit range:
**over `041e8ec..HEAD`, across ALL files, zero added lines carry U+00B7.**
Over the whole branch `e4a5ae7..HEAD` exactly ONE added line carries it —
`+  end of this bullet) <U+00B7> npm run boot:check …` replacing
`-  (+ -- --selftest) <U+00B7> npm run boot:check …` — the same pre-existing
separator, still sitting BETWEEN two commands, on a line the build
session reflowed. The prior verdict named that line. **No new middle dot
exists anywhere.**

**But the command the notes quote as proof does not prove it.**
`git diff -U0 -- docs/CONVENTIONS.md | grep '^+' | grep <U+00B7>` carries
NO RANGE, so it compares the working tree to the index. On a clean tree —
the state at the commit where the claim is written — that diff is
**0 bytes, 0 lines**, and the grep can only ever return zero. It is the
same vacuous-green shape the gate computation was redone to avoid, and
the assert was added to one and not the other. The CLAIM is true; the
EVIDENCE offered for it is not evidence. Filed as **T-078-s11**.

#### THE THREE ATTACKS I WAS SENT TO RUN

**T-078-s8 — CONFIRMED on both halves, and it is the sharpest of the
three.** T-078-s5's ask proposes replacement prose verbatim: *"the same
search finds matches in `docs/` and `tools/` from the root and none of
them from `app/`"*. Measured at NINE refs on this branch (`e4a5ae7`,
`c4208c6`, `22b31f1`, `d92afc7`, `1e96599`, `041e8ec`, `1f0f7ae`,
`3a5e8ef`, `5b5e1c7`), `git grep -c "POISON DRILL" -- tools/` returns
**zero files at every one** — the sentence names a directory the search
has never touched. And the `app/` hit it denies is real and load-bearing:
`app/test/startup-recovery.test.ts:722`, which is exactly what a search
run FROM `app/` returns and the entire basis of the 4-vs-1 contrast. An
executor who adopted the ask rather than re-deriving would have replaced
one false sentence with a differently false one, in the bullet about
citing accurately, while believing they had taken the more rigorous arm.
**The general point holds: a finding's evidence block gets measured and
its ASK does not, and the ask is the half that is copied into the tree.**

**T-078-s9 — REPRODUCED, and it should be amended in ITS OWN CARD, not
here.** The mechanism is exactly as filed and is now three times louder
than when it was written, because main moved twice more during this
session (`79ae34a` -> `5edb1c8` -> `16bb47b` -> `a137d20`):

| ref of main | `git diff main HEAD` | BOOT | GRAPH | true merge (`merge-tree`) |
|---|---|---|---|---|
| `79ae34a` (executor's) | 47 paths | FIRES (5) | FIRES (13) | 12 docs files, 0, 0 |
| `a137d20` (now) | **66 paths** | **FIRES (6)** | **FIRES (18)** | **16 docs files, 0, 0** |

`git merge-tree --write-tree main HEAD` exits **0** — the merge is clean
— and `git diff --name-only main <tree>` is **16 files, every one a `.md`
under `docs/`** (0 non-docs, 0 non-md). So the docs-only branch is
reported by the bullet's own notation as having rewritten a Rust crate
and the parser library, and the settlement contradicts it flatly.

**But the amendment does not belong on this branch.** No acceptance
criterion of T-078 touches the BOOT GATE bullet's range notation; the
rule is normative, six integrators deep, and changing what an integrator
computes is a decision for triage rather than a verifier-directed edit
inside a re-verification. The finding is correctly filed, its mechanism
is confirmed first-hand, and its disposition is triage. **Its table does
need its refs pinned before it is acted on** — see T-078-s12.

**The closed list — I found a third and a fourth reader.** Filed as
**T-078-s10**. `tools/e2e/tests/shell-frame.spec.ts` `repoDocs()` and
`tools/e2e/tests/window-contract.spec.ts` `repoBoard()` each walk the
live `docs/` tree and `readFileSync` every file, this one included, on
every full-lane run; `shell-frame` additionally carries a hard floor
(`if (files.length < 50) throw`) that is a live assertion about the tree
this file sits in. Neither can red on this file's CONTENT, and the reason
is one row up in the same table: the shipped parser filters
`/^T-.*\.md$/`, `/^C-.*\.md$/` and `docs/ROADMAP.md`, and
`CONVENTIONS.md` matches none. **So the closure is over "can red", which
the sentence never says, while it claims to be over "readers", which is
checkable and false at four.** It does not falsify the warning the table
exists to give, which is why this is a finding and not the verdict.

#### THE DECLINED HALF OF s6 — the risk is real, drilled, and the reason given was the weaker of two

`app/src-tauri/src/agent/kit.rs:448-453` asserts
`conventions.contains(&format!("currently v{METHOD_SNAPSHOT_VERSION}"))`
against a `const` of `"0.1.5"` at `kit.rs:35`. The literal occurs
**exactly once** in `docs/CONVENTIONS.md`, at line 162, and **zero added
or removed lines in the whole branch diff carry it**. `cargo` was not run
(no `target/` in this worktree, cold build out of scope), so the
predicate was modelled exactly — `grep -F -q 'currently v0.1.5'`, which
is what `String::contains` does — and drilled inline, substitution counts
asserted, mutated text read back, restored byte-exact
(sha256 `965b6219...` against `git show HEAD:docs/CONVENTIONS.md`,
`git diff --quiet` exit 0):

    baseline                                    1 occurrence   predicate 0 (passes)
    rewrite gotcha one to cite the symbol       0 occurrences  predicate 1 (FAILS)

**So editing gotcha one is the one edit on this branch that can red the
cargo suite, and declining s6's other half was right.** The walk table's
`currently v<METHOD_SNAPSHOT_VERSION>` form adds no second occurrence and
keeps a method bump a one-place edit — that reasoning verifies. The
sharper reason it did not give is drill B, and it is an eighth poison
shape: filed as **T-078-s13**.

#### AN EIGHTH POISON SHAPE, MEASURED

**SHAPE EIGHT — a containment assertion over a whole-file haystack has no
UNIQUENESS floor, so any second copy of the needle un-pins the original,
and the likeliest author of that copy is documentation ABOUT the pin.**
Plant a second `currently v0.1.5` in prose about the stamp, THEN delete
the pinned sentence's copy: **1 occurrence remains, the predicate passes,
the suite stays green with its subject gone.** Distinct from one to four
(nothing moved), from five (the assertion set is untouched; the HAYSTACK
gained a member), from six (this body does kill a unique mutant, until a
duplicate appears where it never looks) and from seven. Mechanical
remedy, which puts it beside five: assert the occurrence COUNT, or narrow
the haystack to the section actually pinned. Full derivation and the
sweep for other instances in **T-078-s13**.

#### CRITERION BY CRITERION

Structural argument first: the fix diff is **two hunks**, so criteria
1, 2, 3, 4, 6, 8, 9, 10 and 11 are byte-identical to the text the first
verifier passed. Each re-checked live anyway.

1. **One-sidedness clause.** `MUTATE ONE SIDE ONLY` present, one hit,
   untouched region. **HOLDS.**
2. **Shapes five and six get ordinals, five first.** Both present once;
   `deliberately NOT given an ordinal` gone; `T-080:63` "poison shape
   five", `T-072:38` "poison shape SIX" and `docs/STATE.md` all still
   agree. No citation broken. **HOLDS.**
3. **Negative-control rule beside the parametrisation rule.** Line 514
   `A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`; `A TEST PARAMETRISED
   BY THE CONSTANT` and `T-063` each present. **HOLDS.**
4. **Guard-lift rule, both halves.** Line 543 `LIFTING A SAFETY GUARD TO
   DISCRIMINATE`, `lifted arm` present. **HOLDS.**
5. **A citation names a symbol, not a line.** Present at line 165. Its
   worked example — the defect the rejection named — is now the SHAPE,
   measured true at HEAD and re-measured true after this verdict's own
   four files pushed the count from seven to **eight**: from the ROOT the
   search finds this file, its cards under `docs/tasks` and a test under
   `app/test`; from `app/`, that one and none of the others. **The
   sentence needed no edit while the numeral would now be wrong by
   four.** The split search string is unwrapped and findable (1 hit in
   this file at `041e8ec`, 3 at HEAD). **HOLDS — this is the rejected
   half, discharged.**
6. **GRAPH REGEN trigger.** Wide trigger kept, no-op arm stated,
   `index --check` named as the way to ask instead of predict. The
   criterion's headline and its PREFERRED ARM still contradict each other
   and the executor took the labelled arm. **HOLDS on substance**, as the
   first verifier found; unchanged since.
7. **The four-walks table.** Untouched in its walk rows; the changed part
   is the reader sentence and the counts sentence. `38 removed` -> `46`
   with the re-deriving command and closing arithmetic — **HOLDS**, and
   this is the other rejected half, discharged. The reader sentence
   over-claims at four readers (T-078-s10) without falsifying the
   warning. **HOLDS.**
8. **"Held by a gate" future-tense.** Untouched region. **HOLDS.**
9. **`lint:tokens` exit-code legend.** Line 59, `exit 0 clean, 1 EITHER a
   violation OR a gate that could not run`, inside the parenthetical,
   commas only, and the parse still yields it as segment 4 with
   `npm run boot:check` as segment 5 — confirmed by the 4/5/5/5 split
   being unchanged. **HOLDS.**
10. **Middle-dot rule homed in the CI bullet.** `U+00B7` named without
    being typed; **zero added lines carry the character over the fix
    range, across all files**; the one added over the whole branch is the
    pre-existing separator on a reflowed line, still between two
    commands. **HOLDS.**
11. **T-054's notes corrected.** Untouched by the fix range; the 19 -> 16
    / `2 failed, 12 passed` measurement stands and I re-derived the 19
    independently. **HOLDS.**

#### SECURITY SWEEP

Nil surface. The fix range is five `.md` files under `docs/`: no input
path, endpoint, query, dependency, secret or default. All twelve files
the branch touches, and all four this verdict adds, report
`charset=utf-8` under `file --mime`. No control byte in any added line
(P5 class checked directly). The one executable behaviour the branch can
reach — the parity spec's derivation — is unchanged at 19 commands and
byte-identical command strings. Both drills restored with sha256 proof
against `git show HEAD:<path>` and `git diff --quiet` exit 0.

#### FINDINGS FILED — s10 through s13

- **T-078-s10** — the walk table's reader list is closed over "can red",
  a property it never states; four files read this file's bytes.
- **T-078-s11** — the middle-dot proof command carries no range and so
  cannot fail on a clean tree. The claim is true; the evidence is not.
- **T-078-s12** — each pointed-at instance was fixed and neither class
  swept: the `44` (and s9's whole table) went stale by three inside the
  commit that filed it, the third instance of that shape on one branch;
  and the branch introduced two line-break splits of its own search
  string and unwrapped one.
- **T-078-s13** — **POISON SHAPE EIGHT**, measured: a containment pin has
  no uniqueness floor.

None is a defect against a criterion. s12's first half and s11 are
corrections to the card's own notes and to s9, not to the tree.

#### PROCESS

Main (`/Users/ujju/Projects/nputer`) was never written to. **Disclosed
against myself**: one command lost its `cd` and ran `git rev-parse HEAD`
and `git status --porcelain` in the main checkout — both read-only, no
ref, branch, file or index content changed, though `git status` may
refresh the index mtime cache. It is now at `a137d20` with three files
already modified by whoever is working there; I neither made nor touched
them. Port **1420** was read-only `lsof`-probed at session start and end:
one healthy listener, node pid **82549**, `[::1]:1420 (LISTEN)`, same pid
both times, never bound, connected to or signalled. This lane used
scratch port **17881**, bind-probed free before each use and empty after
(17883 probed and unused). No `playwright`, `vite` or `chromium` process
of mine survives; both scratch ports are free. The two `fake_agent`
orphans (**52504/52505**, ppid 1, from `nputer-T-060`) are pre-existing,
are not mine, and were left alone. The four live sibling worktrees
(T-069, T-073, T-080, and the main checkout) were never entered. No
screen control, no model calls, no new dependencies, no `npm ci`, and
`docs/architecture/graph.json` was not regenerated.

#### VERDICT

**APPROVED.**

Both rejected figures are discharged and each was re-derived here from
the commands rather than taken from the verdict or the dispatch. **(a)**
`46` closes both trees by set difference, rename-detection independent,
and the eight-file gap is enumerated to a byte-identical match. **(b)**
the deviation is ruled FOR the executor: `four` was falsified by the very
act of filing the finding that asked for it, is now wrong by four, and
the shape sentence that replaced it has survived two independent rounds
of additions — including this verdict's own — without an edit. The eleven
green criteria are structurally untouched (two hunks) and were re-checked
live. The four baselines are green at **234/234 (12) / 14 / 88 /
TOKEN 118**, plus CONTROL 509 and the selftest. The derivation is
19 / four dirs / 0 / 0 and byte-identical to `e4a5ae7`. Both gates are
computed over a non-empty list with the assert made real and neither
fires; the merge is clean at today's main and adds 16 `.md` files under
`docs/` and nothing else. The rejecting verdict is untouched, proved by
sha256. Four findings go to triage, one of them an eighth poison shape.

`status: verifying` left for the integrator. **Note for the integrator:
main moved three times while this lane was open** (`79ae34a` ->
`5edb1c8` -> `16bb47b` -> `a137d20`); recompute the merge diff at your
own ref, and per T-078-s9 compute it as what the merge ADDS, not as
`git diff main HEAD`.

#### RE-PROVED AFTER THIS VERDICT WAS WRITTEN

`verifier:` and `verified_by:` stamped to `claude-opus-5 @T-078-reverify`
(one substitution each, asserted); `status: verifying` and
`review: same-model` left as they stand.

**The REJECTED entry re-proved after every edit above, by hash.**
Extracted from `### 2026-08-19 — REJECTED` to the start of this entry and
compared against the same extraction at `041e8ec` (where it runs to EOF):
sha256 **`a6265b6436381567d63c88066411982cdc8cbddafe68ed02e101ed52c1886042`**
on both sides, `cmp` exit 0, 376 lines. The only byte difference in the
raw region is the single blank line separating it from this entry, and
the `041e8ec` text is a strict byte-PREFIX of the region at HEAD
(`head -c` + `cmp` exit 0) — every original byte present, in order,
unchanged.

**Final state, everything re-run with this verdict and the four findings
in the tree:** `lib/parser` **234 passed (234)**, 12 files, exit 0;
`tools/e2e` full lane **88 passed** (22.4s), exit 0; `npm run lint:tokens`
clean at **TOKEN 118 / CONTROL 509**, exit 0; `--selftest` 49 TOKEN + 2
CONTROL samples and 37 walk checks, exit 0; the derivation
`["lib/parser","app","app/src-tauri","tools/e2e"]`, split 4/5/5/5,
**19** exposed, **0** structural. Scratch ports 17881 and 17883 free,
no process of mine surviving, 1420 still one listener at pid 82549.

**Caught in my own verdict, recorded because it cuts against me.** Two
lines of the middle-dot paragraph above quoted the reflowed diff lines
with the LITERAL character in them, so this verdict carried two added
U+00B7 lines while asserting the branch carried none. Caught by running
the same range check over my own commits (`5b5e1c7..HEAD`) rather than
only over the executor's. Rewritten to the `U+00B7` notation the card's
own discipline uses; the check now returns **0** for my lines too. The
one remaining literal in this file is line 785, inside the frozen
REJECTED entry, which is not mine to edit.
