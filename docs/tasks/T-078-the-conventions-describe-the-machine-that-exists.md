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
verifier: claude-opus-5 @T-078-verify
built_by: claude-opus-5 @T-078
verified_by: claude-opus-5 @T-078-verify
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
