---
id: T-205-s4
title: MF-02 resolves numbered rules and is blind to LETTERED sub-steps, so `roles/orchestrator.md 5d` — now cited from two role files — dangles silently the day 5d is renamed
feature: F-06
milestone: 4
size: S
priority: 4
status: verifying
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

**A HOLE MF-02 ALREADY KNOWS THE SHAPE OF, IN A CITATION FORM T-205 JUST
MADE LOAD-BEARING.** `tools/method-evals/evals/mf-02-rule-citations.mjs`
resolves `<file>.md rule N` against that file's own `^ {0,3}(\d+)\.\s`
items. The method's role files do not number their steps that way in
every case: `roles/orchestrator.md` carries `5b.`, `5c.` and now `5d.`,
and every citation of them — `(roles/orchestrator.md 5c)` in two files
before T-205, `roles/orchestrator.md 5d` in `roles/verifier.md` and
`roles/executor.md` after it — carries no `rule` keyword and names no
ordinal MF-02 can see. **The regex does not match, so the citation is
never examined**, which is the same silent class MF-04's own header
names for a bare unprefixed filename.

**WHY IT MATTERS NOW RATHER THAN BEFORE.** T-205's whole shape is *one
statement, everything else points at it* (`T-057`). A pointer that
cannot be checked is the failure mode of that shape: rename 5d, or
insert a 5d ahead of it, and two role files quietly cite a step that is
not there while every gate stays green. This is MF-02's own opening
argument — *an ordinal IS a line number wearing a rule's clothes* —
applied to the form the method actually writes.

## Acceptance criteria

- MF-02 SHALL resolve a LETTERED sub-step citation (`<file>.md 5d`,
  `<file>.md 5c`) against that file's own `^\d+[a-z]\.` items.
- THE coverage count SHALL rise, and the eval SHALL still throw when it
  examines nothing — a widened predicate that matches nothing is a
  quieter version of the hole it closed.
- THE POSITIVE CONTROL SHALL rename `5d` in the home file and require
  the eval to name the two role files that cite it, demonstrated red.
- THE predicate SHALL NOT start matching ordinary prose: run it over the
  corpus and show the findings count is zero before the degradation.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-225-s2 merge (6691fc5)

The architect seat. Dangling lettered pointers are exactly what the single-source rule now depends on; T-205-s7 rides in the same fence.

## Absorbs: T-205-s7 (2026-09-02, at the T-225-s2 merge (6691fc5))

MF-09's digest-command conjunct is satisfied by the POISON DRILL's own `shasum` mention, so striking the T-205 bullet's command spelling is undetectable

**A CONJUNCT THAT CANNOT FAIL, INSIDE A GUARD BUILT TO END EXACTLY
THAT.** `MF-09`'s third text finding is written as a conjunction:

    if (!/shasum -a 256/.test(conv) || !CITATION.test(conv.replace(...)))

The second conjunct — the citation grammar `attack set: sha256:<hex>` —
is load-bearing and was drilled RED at the T-205 verification. The first
is not. `docs/CONVENTIONS.md` has carried `shasum -a 256` since long
before T-205, in the POISON DRILL bullet (*"`git show HEAD:<path> |
shasum -a 256` against the working file"*), so the whole-document
presence test is satisfied by a bullet that has nothing to do with
attack-set digests.

**MEASURED, at `48285b5`.** Replacing the T-205 bullet's own
`` `shasum -a 256 <file>` `` with the words *"the usual hashing
command"* leaves `node tools/method-evals/run.mjs` at **exit 0**. The
same edit to the citation-grammar half reds it (exit 1, naming the
finding). So the command half of a two-part check is decorative: the
sentence MF-09 exists to hold can lose its command spelling and no gate
notices.

**WHY IT IS WORTH A CARD AND NOT A SHRUG.** `T-057` is this project's
name for an assertion that cannot fail, and `roles/verifier.md` step 2b
calls a control that grades every arrangement the same the defect this
method produces most. MF-09 is otherwise a careful guard — a five-row
matrix with three wrong judges, all of which were drilled a

## RECOVERY of absorbed texts (the seat's note, 2026-09-02)

The Absorbs sections above were written by a script that cut each absorbed body at 1,400 characters, so their acceptance criteria may end mid-sentence. The whole text of each absorbed card is in history:

- T-205-s7: `git show 866ac33^:docs/tasks/T-205-s7-mf-09s-command-conjunct-is-satisfied-by-an-unrelated-bullet.md`

A lane building this card reads those before it builds.

## Implementation notes — executor claude-opus-5@subagent, 2026-09-09

**WHAT LANDED**, in `86b8803` (`T-205-s4: MF-02 reads LETTERED sub-step
citations, and MF-09's digest-command conjunct is scoped to the bullet
that documents the citation`), on `task/T-205-s4-mf02-lettered-substeps`
from base `52fdbc3e1bd15c7ca516d007757094347cfd78bc`. Two files, both
inside the fence `tools/method-evals`:
`evals/mf-02-rule-citations.mjs` and
`evals/mf-09-attack-set-digest-refusal.mjs`. Nothing outside the fence
was needed and no ask was raised.

**THE CEREMONY ROW, SAID PLAINLY BECAUSE THE BRIEF DECLINED TO GUESS
IT.** `method/tasks/TASK-FORMAT.md`'s rule of thumb — *docs, method and
tooling self-integrate; anything a user could run does not* — puts this
diff (`tools/method-evals` only, plus this card) on **S, diff outside
shipped code**, the row that owes NO verifier and would have me stamp
`done`. The card's own `verifier:` field was filled before the lane was
cut and the dispatch declares a verifier and a bench, so the extra rung
is being taken deliberately and I have stamped `verifying`. The
integrator, not this lane, owns that disagreement; it is recorded here
rather than resolved here.

### Criterion 1 — MF-02 resolves a LETTERED sub-step citation

MET. A second predicate, `LETTERED`, resolves
`<file>.md[`][,] [step ]<N><letter>` against that file's own
`^ {0,3}\d+[a-z]\.` items (`letteredItems`), sharing the `FILE` path
fragment with `QUALIFIED` so the two cannot drift (`T-057`). The file
name is REQUIRED and there is no bare form: `5d` alone is two
characters, and a predicate that hunts those through prose finds dates
and list markers. The keyword is optional (`step`, `steps`, `sub-step`)
because the method writes it both ways, and a code tick may sit between
the name and the ordinal.

EVIDENCE, at `86b8803`: the 8 lettered citations live in the corpus at
`method/lane-protocol.md` (×2, `roles/orchestrator.md 5b`),
`method/roles/verifier.md` (×3, `5d`, `5c`, `5d`),
`method/roles/executor.md` (×2, `` `roles/verifier.md` step 2b `` and
`` `roles/orchestrator.md` 5d ``) and `method/tasks/TASK-FORMAT.md` (×1,
`` `roles/verifier.md` step 2b ``). All 8 resolve.

### Criterion 2 — the coverage count rises, and it still throws on nothing

MET, and the throw is now TWO throws. `examined` went **26 → 34**
(measured at `52fdbc3e` and at `86b8803` respectively, both by
`node tools/method-evals/run.mjs --verbose`), of which **8** are
lettered. The lettered count is thrown on SEPARATELY — a widened
predicate riding the numbered class's coverage to a green is exactly the
quieter hole the criterion names, and the total counter cannot see it.

DEMONSTRATED RED (drill D2 below): neutering the `LETTERED` regex leaves
`run.mjs` at **exit 3** — `no LETTERED sub-step citation was examined` —
and not at exit 0.

### Criterion 3 — the positive control renames 5d and names both role files

MET, demonstrated red. `degrade()` now runs four control arms instead of
returning one. Arm 2 renames `5d.` to `5e.` in
`method/roles/orchestrator.md` — the mutation an inserted step makes for
free — and requires the audit to name EVERY file that cited it, with the
expected set DERIVED from the corpus by `citersOf` rather than typed
beside the assertion. Naming one is not the property: each citing file
is separately wrong, and a control satisfied by the first would pass an
audit that stopped after one.

    renaming method/roles/orchestrator.md 5d to 5e is detected:
    3 finding(s), naming all 2 citing file(s) —
    method/roles/executor.md, method/roles/verifier.md

DEMONSTRATED FAILING AGAINST AN IMPLEMENTATION THAT LACKS THE PROPERTY
(`roles/verifier.md` step 2b, drill D1): with the lettered resolution
neutered, `run.mjs` stays at exit 0 and `--selftest` goes to **exit 1**
with `renaming … left 2 citing file(s) unnamed`. The control, not the
check, is what discriminates — which is the whole point of it.

### Criterion 4 — the predicate does not start matching ordinary prose

MET, twice over. The finding count over the UNDEGRADED corpus is **0**
over 34 citations examined, and `degrade()` now reports that baseline as
its first line so the figure is visible rather than implied:

    baseline: 0 findings over 34 citations examined, 8 of them lettered
    — the predicates match no ordinary prose

A COUNT ALONE WOULD HAVE BEEN A T-057 ASSERTION, so the widened
predicate also got a **false-positive arm**. A lettered citation carries
no keyword, so its separator must be allowed to span a line break — and
a line break is exactly where a sub-step's own DEFINITION sits.
`isOwnDefinition` refuses a match whose ordinal opens its line as a list
item; arm 3 plants the hazard (a DIFFERENT method file's name ending the
line above `5d.`) and requires silence **and** undiminished lettered
coverage, because silence from a predicate that stopped matching is not
the property. Drill D3 shows the arm red when the guard is removed: the
plant then produces `method/roles/orchestrator.md cites
method/lane-protocol.md sub-step 5d…`, a spurious finding.

### The absorbed T-205-s7 — MF-09's conjunct that could not fail

MET, all three of its criteria. The command half of MF-09's third text
finding tested the WHOLE of `docs/CONVENTIONS.md` for `shasum -a 256`,
which the POISON DRILL bullet ~1,400 lines away has satisfied since long
before T-205. It is now SCOPED: `topLevelBullets` splits the document at
its top-level `- ` openers, headings and unindented paragraphs;
`attackSetBullet` picks the bullet that spells the citation GRAMMAR (not
a byte-exact sentence, so rewording survives and moving the command off
the bullet does not); and the command is required on THAT bullet. The
conjunction became two findings so each half names what is missing.

MEASURED at `86b8803`: of the document's 57 top-level bullets, exactly
one carries both the grammar and the command (THE VERIFIER'S BENCH IS
TWO SPAWNS); METHOD EVAL GATE carries the grammar without the command
and POISON DRILL the command without the grammar — which is precisely
the pair that made the old conjunct inert.

The `degrade()` arm the conjunct never had is arm 5, and it asserts BOTH
halves: the strike is detected AND the unrelated mention survives.

    striking the digest command from the bullet that documents the
    citation is detected while 1 unrelated `shasum -a 256` mention(s)
    survive elsewhere in the document: …

DEMONSTRATED FAILING AGAINST THE IMPLEMENTATION THAT LACKS THE PROPERTY
(drill D4): putting the command test back on the whole document — the
exact code T-205-s7 measured at `48285b5` — leaves `run.mjs` at exit 0
and reds `--selftest` at **exit 1** with `striking the digest command
from its own bullet was NOT detected — the command test is still
satisfied from somewhere else`.

### Commands, in the order run, each exit read unpiped

| Command | Ref | Exit |
|---|---|---|
| `node tools/method-evals/run.mjs` | `52fdbc3e` (base) | 0 |
| `node tools/method-evals/run.mjs --selftest` | `52fdbc3e` (base) | 0 |
| `node tools/method-evals/run.mjs --verbose` | `52fdbc3e` (base) | 0 — MF-02 `26 rule citations` |
| `node tools/method-evals/run.mjs --verbose` | working tree | 0 — MF-02 `34 ordinal citations … (8 lettered sub-steps)` |
| `node tools/method-evals/run.mjs` | `86b8803` | 0 |
| `node tools/method-evals/run.mjs --selftest` | `86b8803` | 0 |
| `node tools/method-evals/run.mjs --list` | `86b8803` | 0 |
| `npm ci` from `tools/e2e/` (the gate needs `yaml`; a fresh worktree has no `node_modules`) | this commit | 0 |
| `node tools/e2e/scripts/docs-gate.mjs <both cards>` | this commit | 1 — FIRES, see below |

10 model-free evals in the set at `86b8803`, unchanged in number by this
lane. `--set model-in-loop` was NOT run: it needs `SUPERTASKR_EVAL_RUNNER`
and this diff changes no model-in-loop eval.

### The drills — one side only, read back from `git diff`, sha256-proved

All four were taken at the commit `86b8803`, and every restore used
`git restore --source=86b8803 --staged --worktree -- <path>` with the
hash compared against `git show 86b8803:<path> | shasum -a 256`.

| # | Mutation (one side only) | Expected | Observed |
|---|---|---|---|
| D1 | `mf-02`: `if (!have.has(ord))` → `if (false)` — the lettered resolution removed | `run` green, `--selftest` RED | `run` 0; `--selftest` **1**, `renaming … left 2 citing file(s) unnamed` |
| D2 | `mf-02`: `LETTERED` regex neutered (`${FILE}` → `${FILE}zzz`) | `run` exit 3 | **3**, `no LETTERED sub-step citation was examined` |
| D3 | `mf-02`: `isOwnDefinition` → `return false` | `--selftest` RED | `run` 0; `--selftest` **1**, `planting a file name above the 5d. definition produced 1 spurious finding(s)` |
| D4 | `mf-09`: command test back on the whole document | `run` green, `--selftest` RED | `run` 0; `--selftest` **1**, `striking the digest command from its own bullet was NOT detected` |

`mf-02-rule-citations.mjs` sha256
`23e8dd2379d65248b7510bc025811245037f8220957d6cabdc1a80d9796d562a`
before D1 and after each of D1, D2, D3.
`mf-09-attack-set-digest-refusal.mjs` sha256
`2bddc56669d1bd41387d6264e9d3771081a495ccef78eb2330a508fe8b9ea880`
before and after D4. `git status --porcelain` was empty after every
restore.

**A FIRST ATTEMPT AT D2 CHANGED NOTHING AND SAID SO** — a `perl -0777
-pi` substitution over an escaped pattern produced an EMPTY `git diff`
while the suite stayed green, which reads exactly like a passing drill.
The POISON DRILL's own T-078 clause is what caught it: the mutation was
read back from `git diff` before the suite was believed. Recorded
because the near miss is the bullet's whole argument.

### Gates, DERIVED from the diff

DERIVED ON **4 PATHS**, `git diff --name-only 52fdbc3e..8eaa013`: the two
eval files under `tools/method-evals/evals/`, this card, and the
suggestion card `T-205-s16`. That is the tree the tip HAS, not a
forecast, and a further commit correcting these notes touches only a
path already in the set, so the derivation does not move.

- **GRAPH REGEN** — NOT OWED. The trigger is `*.ts/*.tsx/*.js/*.jsx` or
  `*.rs` outside `docs/`. This diff is 2 `.mjs` files under `tools/` and
  2 `.md` under `docs/tasks/`: 0 of 4 paths match, and the bullet's own
  measured note (T-054, T-058) is that a diff confined to `tools/**`
  cannot move the graph by construction because `.supertaskrignore`
  excludes `tools/`.
- **BOOT GATE** — NOT OWED. Nothing under `app/src-tauri/**` or
  `app/src/**`, neither manifest. 0 of 4 paths.
- **DOCS GATE** — FIRES, on **2** paths: this card and the suggestion
  card `T-205-s16`, both under `docs/tasks/`, which twelve derived
  readers in three suites parse. `node tools/e2e/scripts/docs-gate.mjs`
  exited **1** and named `npm test` from `app/`, `npm test` from
  `tools/e2e/` and `npx vitest run` from `lib/parser/`. **THIS LANE DID
  NOT RUN THOSE THREE**, by the dispatch's own scoping (T-271): the
  verifier runs the full four-suite battery once at its tip. The gate's
  own live-tree frontmatter check DID run here and passed — *every live
  task card's frontmatter parses, with a legal status*, 0 issues over the
  live tree — which is the check both new cards could have broken.
- **METHOD EVAL GATE** — NOT OWED BY ITS TRIGGER and RUN ANYWAY: the
  diff touches no `method/**` path and adds no line matching the
  citation grammar under `docs/tasks/` — `git diff 52fdbc3e..8eaa013 --
  docs/tasks` adds **0** lines matching `attack set: sha256:<64 hex>`, so
  0 of 4 paths trigger it — but the suite is
  this lane's SUBJECT, so it was run at every step above.

### Where the brief was wrong

- **The base.** ROW 4 gives `base commit:
  f83f7f13d4741a911c1f71fe6bfc3ba350db1f86` (the newest `Checkpoint:` on
  main at assembly). The lane was actually cut at
  `52fdbc3e1bd15c7ca516d007757094347cfd78bc`, which is ROW 4's own
  *integration tip right now* and the value in `.supertaskr/lane-fence.json`.
  The repository wins: this lane's base is `52fdbc3e`, a non-merge commit
  later than the checkpoint, which docs/CONVENTIONS.md's dispatch bullet
  permits provided its gates are green — and both eval arms were green
  there (exit 0, exit 0) before a byte was changed.
- **The lane list.** ROW 5 lists T-205-s4 among the lanes "live right
  now" and then repeats it under ROW 10's *another checkout exists and is
  not yours*. `/Users/ujju/Projects/nputer-T-205-s4` IS this lane; the
  ROW 10 line is an artefact of listing every worktree without excluding
  the addressee's own.
- **The ceremony row.** ROW 11 prints both S rows and declines to choose
  ("this tool will not guess it"), which the contract's own note says the
  brief must do at size S. Read here, and recorded above.
- **The eval count.** The brief carries none; the dispatch message's
  "the eval count is 10" is confirmed at `52fdbc3e` and at `86b8803`.
- Everything else the brief asserted that this lane touched — the fence
  (`tools/method-evals`, 1 entry, 0 slugs, 1 path), the card path, the
  title, `size: S`, `feature: F-06`, and the four disjointness rows —
  re-derived true at `86b8803`.

### Filed, not built

- `T-205-s16` (`status: suggested`): the same lettered predicate would
  resolve **9** more citations that live outside `method/` —
  `docs/CONVENTIONS.md` (4), `docs/STATE.md`, `docs/reference/` (3),
  `docs/rooms/team-enablement.md` — and MF-02's corpus stops at
  `method/**`. Widening `reads:` also widens what the METHOD EVAL GATE
  must fire on, which is a decision above this lane.

## Verdicts

## VERDICT — APPROVED WITH ASSIGNED CORRECTIONS at `0bf398c`, 2026-09-09, blind verifier claude-opus-5@subagent (phase 2)

attack set: sha256:72470cbf06fb9096a8cd97d96eeaccb752a276ac0edd33fae179ad843df3f57e (attack-set-T-205-s4.md)
ground truth: sha256:6bdf416b0c94d4a74ec0a601c3ded98071a8baedb7c05cedaf683568e4d5ec93 (ground-T-205-s4.md)

TIP `0bf398c910c0fd99d265a60ef8c0d5868f1915bb` · BASE
`52fdbc3e1bd15c7ca516d007757094347cfd78bc` · branch
`task/T-205-s4-mf02-lettered-substeps` · bench
`/Users/ujju/Projects/nputer-V-T-205-s4`, DETACHED throughout.

**APPROVED WITH ASSIGNED CORRECTIONS.** Every acceptance criterion of
this card and all three of the absorbed `T-205-s7` are MET, re-derived by
this seat rather than accepted: 25 mutants and controls, each applied on
a detached scratch worktree at the tip, each landing read from `git diff`
before any verdict was read, each reverted and each restoration proved by
`shasum -a 256` against `HEAD`. Two corrections are assigned; neither
un-does a criterion, and correction 1 is a demonstrated FALSE POSITIVE in
the very property criterion 4 names.

---

### FRAME — what this seat actually had

Read in this order: (1) `method/roles/verifier.md` whole; (2) the sealed
phase-1 attack set, digest verified BEFORE opening it; (3) the
dispatcher's ground truths, digest verified; (4) the card at its BASE ref
via `git show 52fdbc3:…`; (5) `git diff 52fdbc3..0bf398c`, all four
paths, whole; (6) `docs/STATE.md` for named intermittents (there are
none recorded); (7) `method/tasks/TASK-FORMAT.md` on `review:`; and ONLY
THEN (8) the executor's report at `<scratchpad>/report-T-205-s4.md`.

**PHASE 1 WAS A SEPARATE SPAWN, AND IT WAS TOOL-LESS BY INSTRUCTION
RATHER THAN BY THE HARNESS.** The harness cannot deny a spawn its tools,
so "no tool calls" is a discipline the phase-1 seat kept and reported (0
tool calls, 55,221 tokens, 237 s) — not a guarantee the construction
enforced. Said plainly because `roles/verifier.md` requires it said.

**MY BRIEF CARRIED EXECUTOR-DERIVED SPECIFICS, AND I SAY SO RATHER THAN
PRETEND OTHERWISE.** The duties section named the diff's FOUR PATHS, the
two changed eval files by name, and the executor's claimed coverage
figures **26→34**. That is phase 1's line broken above my head, for
phase 2 — phase 1 itself was clean. I re-derived every one of them
independently before reading the report: 4 paths from `git diff
--name-status`; 26 at `52fdbc3` and 34 (8 lettered) at `0bf398c` from my
own `--verbose` runs at both refs; and the truth set of 8 lettered
citations from my own multiline `perl` sweep of `method/**`, which agrees
file-for-file with what the shipped predicate examines.

**THE DISPATCHER'S GT-3 WAS INCOMPLETE AND I DID NOT LEAN ON IT.** The
hashed record lists two citations (`roles/verifier.md:31`, `:63`) under a
header promising every one. The true set at `52fdbc3` is EIGHT:

    method/lane-protocol.md:57      roles/orchestrator.md 5b
    method/lane-protocol.md:89      roles/orchestrator.md 5b
    method/roles/executor.md:145    `roles/verifier.md` step 2b
    method/roles/executor.md:261    `roles/orchestrator.md` 5d
    method/roles/verifier.md:26     roles/orchestrator.md 5d
    method/roles/verifier.md:31     (roles/orchestrator.md 5c)
    method/roles/verifier.md:63     (roles/orchestrator.md 5d)
    method/tasks/TASK-FORMAT.md:245 `roles/verifier.md` step 2b

GT-1, GT-2, GT-4, GT-5, GT-6, GT-7, GT-8, GT-9 and GT-10 re-derived TRUE
at the base. The card's own central claim — `5d` cited from TWO role
files — re-derives TRUE (`roles/verifier.md` ×2, `roles/executor.md` ×1;
two distinct files).

---

### THE BODY RUNS, with counts and exits, each ref named

| Command | Ref | Count read | Exit |
|---|---|---|---|
| `node tools/method-evals/run.mjs --verbose` | `52fdbc3` (base, detached scratch worktree) | 10 model-free; MF-02 **26 rule citations, all resolving** | **0** |
| `node tools/method-evals/run.mjs` | `52fdbc3` | 10 model-free | **0** |
| `node tools/method-evals/run.mjs --selftest` | `52fdbc3` | 10 model-free, POSITIVE CONTROL | **0** |
| `node tools/method-evals/run.mjs --verbose` | `0bf398c` (bench tip) | 10 model-free; MF-02 **34 ordinal citations, all resolving (8 lettered sub-steps)**; MF-09 **5 matrix rows … the four method sentences**; MF-10 20 citations in 576 cards | **0** |
| `node tools/method-evals/run.mjs` | `0bf398c` | 10 model-free | **0** |
| `node tools/method-evals/run.mjs --selftest` | `0bf398c` | 10 model-free, POSITIVE CONTROL | **0** |
| MF-02 `degrade()` in isolation | `0bf398c` | **4 control arms hold**: baseline `0 findings over 34 citations examined, 8 of them lettered`, 2 degradations, 1 false positive | **0** |
| MF-09 `degrade()` in isolation | `0bf398c` | **5 degradations, all detected** | **0** |

An exit 0 over zero bodies is a harness failure wearing a pass, so every
figure above is a COUNT read beside its exit, never an exit alone.

The four standing suites are run at the tip THIS VERDICT CREATES — a role
that writes to the tree owes the tree's gates — and their figures are in
the AMENDMENT at the end of this verdict, with that commit named.

---

### THE ATTACK SET, RUN — 25 mutants and controls

All applied in a detached scratch worktree at `0bf398c`
(`<scratch>/V-T-205-s4-mut`), never in the bench, never in the lane.
Each: apply → read the landing from `git diff` → run MF-02 and MF-09 in
ISOLATION (a runner that imports one module and calls `check()`, since
`run.mjs` has no per-eval filter) → run the full suite for attribution →
`git checkout -- .` → `git status --porcelain` empty → `git show
HEAD:<path> | shasum -a 256` equal to the working file on all seven
touched paths.

**DATA mutants — the home file's step labels.**

| ID | Mutation | Verdict |
|---|---|---|
| **D2.1** | `5d.` → `5e.` in `method/roles/orchestrator.md` (AC-3's own drill) | **KILL.** MF-02 RED, 3 findings, naming **both** `method/roles/executor.md` and `method/roles/verifier.md`. Suite: `1 of 10 FAILED`, exit 1. |
| **D2.2** | `5c.` → `5f.` | **KILL.** MF-02 RED, 1 finding naming `roles/verifier.md`. The PRE-T-205 PARENTHESISED form `(roles/orchestrator.md 5c)` is examined — attack A1.8 refuted. |
| **D2.5** | every lettered item stripped from the home file | **KILL.** MF-02 RED, 6 findings, `(its lettered sub-steps are none at all)`. No crash, no `TypeError`, exit 1. An empty item set does NOT mean skip — attack A1.5 refuted. |
| **D2.8** | `5d.` → `5d)` (separator drift) | **KILL.** MF-02 RED. The anchor is as strict as the numbered class's. |
| **D2.9** | `5d.` indented by 4 spaces | **KILL.** MF-02 RED. `^ {0,3}` leniency matches the numbered path exactly. |
| **D2.10** | a SECOND `5d.` definition inserted above the first | **SURVIVES**, green. The item set is a `Set`, so a duplicated ordinal is invisible. No criterion demands it; recorded as a diagnostic, not a defect. |

**DATA mutants — the citing files.**

| ID | Mutation | Verdict |
|---|---|---|
| **D2.3** | `roles/verifier.md`: `5d` → `5z` | **KILL.** MF-02 RED naming `roles/verifier.md` and `5z` — and `roles/executor.md` is NOT reported. Findings are per-file, not per-corpus. |
| **D2.4** | a NEW pair: `method/lane-protocol.md` cites `roles/executor.md 9q` | **KILL.** MF-02 RED, 35 examined. **The anti-hard-coding mutant** — the predicate is a resolver, not a lookup table keyed on `orchestrator.md`/`5d`. Attack A1.4 refuted. |
| **D2.6** | target file made nonexistent (`roles/orchestratorX.md 5d`) | **KILL.** MF-02 RED (`…which is not a file in method/`) AND MF-04 RED. A missing target is a finding, never a silent `continue` — attack A1.10 refuted. |
| **D2.7** | `roles/executor.md`'s `5d` citation removed entirely — a LEGITIMATE edit | **GREEN-SIDE CONTROL HOLDS.** MF-02 green, `33 ordinal citations … (7 lettered)`, suite exit 0. `check()` hard-codes no expectation of two citers. |

**DATA mutants — `docs/CONVENTIONS.md`'s bullets (the absorbed `T-205-s7`).**

| ID | Mutation | Verdict |
|---|---|---|
| **D2.11** | the attack-set bullet's `` `shasum -a 256 <file>` `` → "the usual hashing command"; POISON DRILL untouched (**1** `shasum -a 256` survives) | **KILL.** MF-09 RED, exit 1. **This is the exact edit `T-205-s7` measured at exit 0 at `48285b5`.** The decisive mutant, and it is dead. |
| **D2.12** | the POISON DRILL bullet's `shasum -a 256` reworded; the attack-set bullet intact | **CONTROL HOLDS — GREEN**, suite exit 0. Falsifier **F5** refuted: the check is SCOPED to the right bullet, not merely re-pointed at a different whole-document string. |
| **D2.13** | the citation-grammar half struck (`attack set: sha256:<hex>` → `attack set: <hex>`) | **KILL**, MF-09 RED — the T-205-drilled half stays live. (The finding text misattributes; see suggestion 1.) |
| **D2.14a** | command → `sha256sum <file>` | **KILL.** MF-09 RED. |
| **D2.14b** | command → `shasum -a 512 <file>` | **KILL.** MF-09 RED. The check is on the command SPELLING at the RIGHT site. |
| **D2.15a** | 40 lines inserted above the bullet (line numbers all move) | **GREEN.** Not brittle by line number. |
| **D2.15b** | the whole 31-line bullet MOVED to the end of its own section | **GREEN.** Not brittle to local reordering. |
| **D2.15c** | the bullet moved BELOW the `METHOD EVAL GATE` bullet | **RED.** Order-dependence, measured — see suggestion 1. Not an AC failure; no criterion asks for cross-section move tolerance. |
| **D2.16** | the bullet's prose heavily reworded, grammar and command kept | **GREEN.** The absorbed card's third criterion — *shall not be brittle to rewording* — MET by measurement, not by reading. |

**CODE mutants.**

| ID | Mutation | Verdict |
|---|---|---|
| **C2.1** | membership test inverted (`!have.has(ord)` → `have.has(ord)`) | **KILL.** MF-02 RED, **8 of 34** — every one of the 8 lettered citations flows through the assertion. It is reachable; it is not a `T-057`. `degrade()` then throws its own no-baseline guard. |
| **C2.2** | the lettered `findings.push` made dead, THEN D2.1 applied | **THE RED DISAPPEARS.** MF-02 green, whole suite exit 0. So D2.1's red came from MF-02's lettered branch and nowhere else. Falsifiers **F4** and **F6** refuted by experiment, not by reading. |
| **C2.3** | `LETTERED` neutered to `/$^/gi` (matches nothing) | **KILL, and by a DEDICATED guard.** Exit **3**, `COULD NOT RUN — no LETTERED sub-step citation was examined …`. The empty-guard is armed for the LETTERED path SEPARATELY, so the numbered class's 26 cannot carry a dead lettered predicate to green. Falsifier **F1** refuted; attack A2.4 answered where the arming is absent. |
| **C2.4** | `LETTERED` widened to `(\S+\.md)[^\n]*?(\d+[a-z])` | **6 findings over the CLEAN corpus.** AC-4's "zero findings" is therefore a DISCRIMINATING measurement and not a vacuous one — a greedy predicate does not pass it. |
| **C2.5** | (adapted) the whole MF-02 module removed — the eval has no registry entry to unregister, `loadEvals()` is a directory scan | **SURVIVES:** `9 model-free eval(s)`, **exit 0**, silently. PRE-EXISTING, unchanged by this diff, outside the fence — filed as suggestion 3. |
| — | numbered-class mutant alone (`lane-protocol.md` rule `7.`→`8.`) | **KILL** with NUMBERED findings while the lettered path stays green. |

**KILL-SET CONTAINMENT (step 2b), the judgement that matters.** Neither
class's kill set contains the other's: D2.1/D2.2/D2.3/D2.4/D2.5 red MF-02
alone with MF-04, MF-05, MF-08 and MF-09 all green, while the
numbered-rule mutant reds MF-02's numbered findings with the lettered
path untouched. The new predicate is LOAD-BEARING, not a restatement of
MF-04 — and D2.6, where both fire, is the one place they overlap
(a missing FILE is MF-04's own subject).
**AND THE PROPERTY LIVES IN DATA, SO THE DECISIVE MUTANTS ARE DATA
MUTANTS** (`T-221`): 16 of the 25 above mutate `method/**` or
`docs/CONVENTIONS.md`, never the code, and D2.1/D2.11 are the two that
carry the card.

**`--selftest` (S2.1–S2.3).**

- **S2.1** — `--selftest` at the tip: **exit 0**, 10 evals, POSITIVE CONTROL.
- **S2.2 — THE CONTROL WAS SEEN FAILING BEFORE IT WAS TRUSTED PASSING.**
  A `T-057` planted in the lettered branch alone (`findings.push` → a
  discarded array), with NO data mutation: `check()` stays **GREEN**
  (`34 … 8 lettered`) and `--selftest` goes **RED**, exit 1 —
  *renaming method/roles/orchestrator.md 5d to 5e left 2 citing file(s)
  unnamed*. The positive control genuinely covers the new predicate, and
  the control — not the check — is what discriminates.
- **S2.3 — falsifier F3 refuted.** MF-02 and MF-09 degrade the SAME
  corpus the subject reads: `readCorpus()` reads the LIVE `method/**`
  (25 entries) and `degraded()` replaces ONE in-memory entry. There is no
  fixtures-vs-live split for these two evals, so the degradation cannot
  land where the arming is absent. Confirmed by S2.2 above, which is that
  claim executed.
- **A residual, not a failure:** with only ONE citer of `5d` left (D2.7's
  legitimate edit), `--selftest` reds — arm 2 pins `CONTROL_HOME`/
  `CONTROL_ORD` to `orchestrator.md`/`5d` and needs ≥2 citers. It fails
  LOUD and names the true cause (*is cited from 1 file(s) … no
  multi-citer sub-step to demonstrate against*), so it is a false RED on
  a legitimate edit, never a false green. Suggestion 2.

---

### THE CRITERIA, ONE BY ONE

**AC-1 — "MF-02 SHALL resolve a LETTERED sub-step citation (`<file>.md
5d`, `<file>.md 5c`) against that file's own `^\d+[a-z]\.` items." MET.**
All four separable parts are present and none is decorative: the citation
is found (`LETTERED`), the target is resolved (`resolveFile`), the
target's items are enumerated (`letteredItems`, `^ {0,3}(\d+[a-z])\.\s`,
lower-cased on both sides), and a miss pushes a finding that reaches the
result — proved end-to-end by D2.1 and by C2.1/C2.2, not by reading.
Both forms the criterion names are covered: the bare `5d` (D2.1) and the
parenthesised `5c` (D2.2). `FILE` is shared with `QUALIFIED` so the two
path fragments cannot drift. D2.4 proves it is a resolver rather than a
lookup table. The one bare lettered reference in `method/`
(`roles/verifier.md:78`, *"step 2b's demonstration"*, no file) is
deliberately SKIPPED and the header argues why — `5d` alone is two
characters and hunting those through prose finds dates and version
numbers. That is a documented decision, and it is the right one.

**AC-2 — "THE coverage count SHALL rise, and the eval SHALL still throw
when it examines nothing." MET, and better than asked.** Measured by this
seat at both refs: **26 → 34**, and the delta of **8** equals the truth
set of 8 lettered citations exactly, item for item — so the rise is
citations resolved, not prose matched (attack A2.1 refuted) and not the
eval count moving (10 at both refs; A2.2 refuted). No citation is counted
twice: the `5d` in `roles/verifier.md:63` appears once, and D2.1 proves a
`5d` is not silently resolving as rule `5` (A2.3 refuted). The throw is
the strong point: a SECOND guard fires on `lettered === 0` alone, because
the total counter cannot see a widened predicate that has stopped
matching. C2.3 runs that guard where its arming is absent and gets exit
3 with a message naming the lettered path. Falsifier **F1** is refuted by
measurement.

**AC-3 — "THE POSITIVE CONTROL SHALL rename `5d` in the home file and
require the eval to name the two role files that cite it, demonstrated
red." MET, demonstrated BY THIS SEAT and not accepted from the diff.** I
performed the rename myself (D2.1): MF-02 exit 1, three findings, and
the failure output contains both literal paths `method/roles/verifier.md`
and `method/roles/executor.md`. **Isolated against falsifier F4:** with
MF-02 run alone the red is MF-02's; with the full suite, exactly ONE of
ten evals fails and MF-04, MF-05, MF-08 and MF-09 are all green; and
C2.2 shows the red VANISHES when MF-02's lettered push is neutered. The
red is MF-02's, at the site the property lives. The shipped control is
better than the criterion asked for: `citersOf` DERIVES the expected set
from the corpus instead of typing two paths beside the assertion, so
D2.7's legitimate removal moves the expectation instead of falsifying it.
`--selftest` is NOT offered in place of the rename — both were run.

**AC-4 — "THE predicate SHALL NOT start matching ordinary prose: run it
over the corpus and show the findings count is zero before the
degradation." MET AS DEMONSTRATED — AND THIS IS WHERE CORRECTION 1
LANDS.** The corpus run, at both refs, with BOTH numbers, because neither
alone is evidence:

| Ref | examined | lettered | findings |
|---|---|---|---|
| `52fdbc3` | 26 | — (predicate absent) | **0** |
| `0bf398c` | 34 | 8 | **0** |

The demonstration is not vacuous: C2.4 shows a greedy predicate produces
6 findings over the same corpus, so zero discriminates. The corpus was
not narrowed — 25 entries, all `method/**`, identical scope at both refs
(A4.2 refuted). No skip-list or path exclusion was added (A4.3 refuted);
the one exclusion, `isOwnDefinition`, is SYNTACTIC, argued in the header,
and fixtured by the shipped arm 3, which plants the exact hazard and
requires BOTH silence AND undiminished coverage. There is a single
severity, so there are no hidden warnings (A4.4). No citation dangles at
the base, so zero is the correct expectation and the card is not
mis-specified (A4.5 / F8 refuted).
**But the SHALL is violated by a constructible input, and I constructed
it.** See correction 1.

**ABSORBED `T-205-s7`, read WHOLE from GT-7 and not from the card's
1,400-character truncation — all three criteria MET.**

1. *Scoped so that striking the digest command from the documenting
   bullet REDS, while an unrelated `shasum` elsewhere does NOT satisfy
   it.* **MET** — D2.11 red with 1 unrelated mention surviving; D2.12
   green. Both verdicts, as falsifier F5 demands.
2. *A degradation added to `degrade()` that strikes the command spelling
   and requires it detected.* **MET** — MF-09's fifth arm, and it asserts
   BOTH halves: the strike detected AND `elsewhere > 0`, which is the
   half that makes it a control rather than a restatement of the subject.
3. *Not brittle to rewording; scoped to the bullet, not a byte-exact
   sentence.* **MET** — D2.16 (heavy rewording) green; D2.15a and D2.15b
   green. D2.14a/b show it is still the SPELLING that is checked.

---

### SECURITY SWEEP — mandatory, and clean

1. **ReDoS.** A 593 KB pathological corpus entry (100k-char runs of
   `a.-` with no `.md`; a near-match `.m` tail; a real file name followed
   by 100,000 spaces; 20,000 repeats of `step `; 3,000 repeats of
   `.md.md.md.md`) put MF-02's whole `check()` at **22 ms**. No
   backtracking blow-up. `[\w.-]+\.md` is linear in practice here.
2. **Global-flag state.** `QUALIFIED`, `LETTERED` and `BARE` carry `g`
   and are module-level, but are used ONLY with `String.prototype
   .matchAll`, which iterates a clone and never advances the original's
   `lastIndex`. Measured: three consecutive `check()` calls in one
   process return byte-identical details; `CITATION` flags `"i"`
   `lastIndex 0`, `DIGEST_COMMAND` flags `""` `lastIndex 0`. No skipped
   matches by file order.
3. **Cross-file matching.** Findings are emitted per corpus entry and
   name `rel`; D2.3 is the behavioural probe and reports `verifier.md`
   alone.
4. **Flag creep.** No flag changed on any pre-existing regex.
5. **Path traversal — the highest-value item, and it does not exist
   here.** `resolveFile` is a `Map.has` over a corpus read BEFORE any
   citation is parsed; a citation NEVER becomes a filesystem read.
   Planted `../../../../etc/passwd.md 5d`, `/etc/shadow.md 5d`,
   `method/../../../etc/hosts.md 5d` and `..%2f..%2fpasswd.md 5d`: three
   did not match at all (`FILE` admits at most one `../` and no `/`
   inside the name segment, and the lookbehind refuses a mid-path start),
   the fourth matched as `2fpasswd.md`, missed the Map, and became an
   ordinary finding. No read, no throw, no crash.
6. **Reads outside `method/` and `docs/`.** MF-02's corpus is 25 entries,
   every one under `method/`; MF-09's is 26, adding only
   `docs/CONVENTIONS.md`. MF-02 contains no `node:fs` import at all — it
   is a pure function over a `Map`. The diff adds no `readFileSync`, no
   `child_process`, no `fetch`, no dynamic `import`.
7. **Unbounded echo into CI output.** The lettered finding interpolates
   only `m[1]` (bounded by `FILE`'s character class), `ord` (bounded to
   `\d+[a-z]`) and the target's own item set. No file text is echoed.
8. **Case and symlinks on darwin.** The ordinal is lower-cased on BOTH
   sides deliberately; the PATH is compared case-sensitively through
   `Map.has`, so a case-varied citation is a finding rather than a
   platform-dependent pass.
9. **Dependencies, secrets, endpoints.** None added. No key, no token, no
   network, no new package.

**No REJECTED-level security finding.**

---

### ASSIGNED CORRECTION 1 — `LETTERED`'s separator reaches across paragraph breaks, so ordinary prose IS matched

**THE DEFECT, REPRODUCED.** The separator between the cited file and the
ordinal is `\s+`, which crosses blank lines without limit. Plant this in
any `method/**` file — a line ENDING in a bare `<file>.md`, then a
paragraph OPENING with a token shaped `\d+[a-z]`:

    A pointer at roles/orchestrator.md



    9q was a typo in an old note and is nobody's sub-step.

Measured at `0bf398c`: MF-02 **RED** — *method/lane-protocol.md cites
roles/orchestrator.md sub-step 9q, and method/roles/orchestrator.md has
no sub-step 9q*. That is ordinary prose read as a citation, which is the
one thing criterion 4 says the predicate SHALL NOT do. (A sentence-ending
period saves the common case — `…orchestrator.md.` does not match — so
this is a sharp edge, not a live red; the corpus is clean today.)

**AND `\s+`'s newline reach is not currently earning it.** I read the
separator bytes of all 8 live matches: `" "`, `" "`, `"` step "`,
`"` "`, `" "`, `" "`, `" "`, `"` step "`. **Not one spans a newline.**
The reach is defensive breadth for a wrapped citation — a real case, and
one the shipped arm 3 exercises — but the breadth is unbounded.

**THE CORRECTION, WRITTEN AND CHECKED BY THIS SEAT IN A SCRATCH COPY.**
Bound the gap to spaces, or ONE line break, never a paragraph break:

```js
/**
 * The separator between a cited file and its ordinal: spaces, or ONE line
 * break, and never a paragraph break. `\s+` reaches across blank lines, so
 * a line ENDING in a bare `<file>.md` and a later paragraph OPENING with a
 * token shaped `5d` read as a citation of each other — ordinary prose
 * matched, which is the one thing the widened predicate must not do.
 */
const GAP = String.raw`(?:[ \t]+|[ \t]*\n[ \t]*)`;

const LETTERED = new RegExp(
  String.raw`(?<![\w./-])${FILE}\x60?,?${GAP}(?:(?:sub-)?steps?${GAP})?(\d+[a-z])\b`,
  "gi",
);
```

Measured with it applied: (a) the live corpus is UNCHANGED — `34 ordinal
citations, all resolving (8 lettered sub-steps)`, 0 findings; (b) all
four existing control arms still hold, **including arm 3**, which plants
exactly one newline and therefore still tests what it was written to
test; (c) the paragraph-break plant above is now SILENT; (d) D2.1 still
kills, naming both role files; (e) a genuine ONE-newline wrapped citation
is still read and still reds when it dangles. Full suite exit 0,
`--selftest` exit 0.

**THE BODY THAT PINS IT — and I ran it where the arming is absent
BEFORE I trusted it passing (step 2b).** A fifth arm in MF-02's
`degrade()`, shaped like arm 3: plant a file name at the end of a
paragraph and a `9q` opening the next, and require 0 findings AND
`lettered === base.lettered`.

- **Against the UNCORRECTED regex the arm FAILS** — `1 of 5 control
  arm(s) did not hold … a paragraph break between a file name and a
  lettered token was read as a citation`.
- **With the correction it PASSES** — `5 control arms hold`, suite exit
  0, `--selftest` exit 0.

That pair is the arming difference, demonstrated rather than asserted.
The patch is saved at
`<scratchpad>/V-T-205-s4-assigned-correction.patch` (58 lines, one file).
**Also fold in:** `degrade()`'s success detail is typed as `a baseline, 2
degradations, 1 false positive` — with the fifth arm it is **2 false
positives**, and a hard-typed count beside a derived list is the small
version of the defect this eval exists to catch.

### ASSIGNED CORRECTION 2 — the ceremony row: `review:` is EMPTY on a guard-class card, and the field is SET AT DISPATCH

`method/tasks/TASK-FORMAT.md`: **"A GUARD-CLASS CARD REQUIRES `review:
independent`, AND THE FIELD IS SET AT DISPATCH"**, and *"a card that
changes what the guard refuses is one, however small its diff."* This
card changes what MF-02 and MF-09 refuse; it is guard-class beyond
argument. `review:` is EMPTY at the base `52fdbc3` — which IS the
dispatch-stamp commit, the one that filled `builder:` and `verifier:` —
and still empty at `0bf398c`. The rule was therefore never in front of
the seat the rule addresses.

**JUDGED AGAINST `review: independent`, as instructed, AND THE PASS MEETS
IT ON THIS BOARD'S OWN OPERATIVE READING.** I did not assume what the
value means; I measured it. Across the board the three values are all
live (168 `independent`, 89 `same-model`, 31 `self-verified`, 176 empty),
and the guard-class cards that carry `independent` — `T-249` (the secret
read guard), `T-239-s4`, `T-225-s11` — every one of them records
`built_by: claude-opus-5@subagent` and `verified_by:
claude-opus-5@subagent`. `T-216-s4`'s dispatch stamp writes the rule out
in words: *"review: independent, set at this stamp — the subject is the
physical fence layer, a guard."* So on this project `independent` names
the INFORMATIONAL construction — a separate, blind seat — which is what
TASK-FORMAT itself insists the guarantee actually is: *"the guarantee a
verification actually rests on is the INFORMATIONAL CONSTRAINT."*

**That construction was built and held here.** Phase 1 was its own spawn
and wrote the attack set from the card alone; both records were hashed
before phase 2 opened anything; this seat read the executor's report only
after its own reading of the whole diff; the two digests are cited above
and check. What is MISSING is not the guarantee — it is the RECORD of it,
in the field whose whole job is to carry the claim forward to a reader
who cannot re-run the pass.

**The correction is not mine to make silently, because the field is a
dispatch-time act and I am not the dispatcher.** Assigned to the
integrator at the merge: stamp `review: independent` with a dated note
that it is set AT THE MERGE and not at dispatch, and record in the
checkpoint that a guard-class card reached a bench with `review:` empty.
The second half matters more than the first: 176 cards on this board
carry an empty `review:`, so this is a recurring gap in the dispatch
step, not a slip unique to this lane — and a rule that is only ever
discovered at verification time is a rule the dispatch step is not
actually running. This is a CEREMONY finding, not a correctness one:
nothing in the work below it is weakened.

---

### WHAT I CHECKED THAT IS NOT A CRITERION

- **FENCE — CLEAN.** All 4 paths: 2 under `tools/method-evals/` (the
  fence), 2 under `docs/tasks/` (always writable). No `method/**` edit,
  no `docs/CONVENTIONS.md` edit. Falsifier **F7** refuted, including its
  special case — the POISON DRILL bullet is untouched and the T-205-s7
  fix was made in the CODE, which is where it belonged.
- **ADJACENT FEATURES.** MF-04, MF-05, MF-08 and MF-10 are green at the
  tip and stay green under every mutant except D2.6, where MF-04 fires on
  its own subject. `lines` on a passing result is a declared part of
  `harness.mjs`'s interface (*"bounded extra output, printed only under
  `--verbose`"*), so MF-02's new baseline lines are in-contract.
- **`T-205-s16`** is well-formed: legal frontmatter, `status: suggested`,
  `suggested_by` set, `blocked_by: []`, title opening with a letter. Its
  claim re-derives with one caveat worth a line: with the shipped
  predicate I count **15** lettered citations under `docs/` outside
  `docs/tasks/`, of which **9** are the non-`docs/checkpoints/` ones the
  card's table lists. Checkpoints are historical records nobody rewrites,
  so excluding them is defensible — the card should say it does.
- **FIGURES WITH THEIR REFS.** Every number in this verdict names the ref
  it was measured at. Falsifier **F9** does not apply.

---

### WHAT THE INTEGRATOR MUST DO AT THE MERGE

1. **Apply assigned correction 1** — the `GAP` bound plus the fifth
   control arm plus the `2 false positives` detail — or route it to a
   follow-up lane. It is one file, 32 added lines, and the patch is on
   disk with its demonstration recorded above.
2. **Apply assigned correction 2** — stamp `review: independent` on this
   card with a dated note that it was set at the MERGE, and record the
   guard-class shortfall in the checkpoint. The standing rule wants the
   field set AT DISPATCH; this merge is the last place it can be
   recorded at all, and 176 empty `review:` fields on the board say the
   dispatch step needs the reminder more than this card does.
3. **Re-derive the gates at the merge's OWN pair of commits** (the RANGE
   RULE). This lane's set will not move for its own paths, but a merge
   brings other lanes' paths too.
4. **The DOCS GATE fires** (2 of 4 paths under `docs/tasks/`) and this
   lane did not discharge it. The suites are run at THIS verdict's commit
   and recorded in the amendment below; re-run at the merge commit.
5. **RECORD the METHOD EVAL GATE's exit in the checkpoint** — `run.mjs`
   **0** and `--selftest` **0** at `0bf398c`, both re-run at this
   verdict's own commit.
6. **Carry this warning.** The lane WIDENED what a `method/**` edit can
   red: any lane that renames or removes `5b`, `5c`, `5d` or `2b` without
   fixing its citers now reds MF-02 at the merge where it was silent
   before. **That is the card working, not a regression** — and the fix
   is always in the CITING file, never in the eval. `T-241`'s fence is
   `method/`, so it is the lane most likely to meet this first.
7. **`T-205-s16` lands as `status: suggested`** and wants triage, not
   dispatch. Three further findings are filed as suggestion cards below.

### FILED, NOT BLOCKING (`status: suggested`)

- **`T-205-s17`** — `attackSetBullet` binds to the FIRST bullet spelling
  the grammar, and a SECOND already exists (`METHOD EVAL GATE`, line
  1549, grammar without command). Measured: D2.15c moves the attack-set
  bullet past it and MF-09 reds with a message that blames "THAT bullet"
  while reading a different one.
- **`T-205-s18`** — MF-02's lettered control arm pins `CONTROL_ORD = 5d`
  and needs ≥2 citers, so a legitimate edit that drops `5d` to one citer
  reds `--selftest`. `roles/verifier.md` `2b` has two distinct citers
  today, so a derived choice has a fallback.
- **`T-205-s19`** — the method-eval corpus has NO FLOOR: deleting an eval
  file leaves `9 model-free eval(s)` at exit 0. Pre-existing, outside
  this fence, found by mutant C2.5.
