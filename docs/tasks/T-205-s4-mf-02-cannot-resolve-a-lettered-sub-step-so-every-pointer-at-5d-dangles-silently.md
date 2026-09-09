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

Derived against the tree this lane's tip WILL have — the two eval files
plus this card — so the figure does not move when this notes commit
lands.

- **GRAPH REGEN** — NOT OWED. The trigger is `*.ts/*.tsx/*.js/*.jsx` or
  `*.rs` outside `docs/`. This diff is 2 `.mjs` files under `tools/` and
  1 `.md` under `docs/tasks/`: 0 of 3 paths match, and the bullet's own
  measured note (T-054, T-058) is that a diff confined to `tools/**`
  cannot move the graph by construction because `.supertaskrignore`
  excludes `tools/`.
- **BOOT GATE** — NOT OWED. Nothing under `app/src-tauri/**` or
  `app/src/**`, neither manifest. 0 of 3 paths.
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
  citation grammar under `docs/tasks/` (0 of 3 paths), but the suite is
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
