---
id: T-189
title: Self-integration and the 3–5 concurrent ceiling are incompatible and neither rule mentions the other — every S lane is told to merge AND checkpoint itself, and four of them would collide on `docs/STATE.md`
feature: F-01
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
suggested_by: "architect/integrator seat, 2026-08-31 — reported by T-182's executor, which obeyed a dispatch prompt that contradicted its own derived brief and flagged the conflict rather than silently picking one"
builder: claude-opus-5@subagent
review:
---

**FOUND BY A LANE THAT WAS TOLD TWO DIFFERENT THINGS AND SAID SO.**
`T-182`'s executor reported: *"the brief's ROW 11 says an
S/diff-outside-shipped-code executor self-integrates (merges,
checkpoints, removes its own worktree). Your prompt says do not merge or
push. I obeyed your prompt and flag the conflict."* That is the correct
handling and it surfaced a gap in the method rather than in the lane.

## The two rules, both live, neither aware of the other

- **`method/roles/orchestrator.md:41`** — *"Ceiling: 3–5 concurrent."*
  Concurrency is not an accident here; it is the planned operating mode.
- **`method/lane-protocol.md`** — *"a size-S card has no separate
  integrator, so its executor plays integrator for its OWN work once its
  tests pass — **it merges, checkpoints and removes its own worktree**."*

**At the ceiling, the second rule tells up to five agents to merge into
one branch and write a checkpoint each, concurrently.**

## What actually collides, and it is worse than the merge

The merge race is the obvious half and the least of it. **The checkpoint
half cannot work at all under concurrency:**

- `method/docs-protocol.md` rule 4 requires `docs/STATE.md` to be
  regenerated **in the same commit as the record**. Five lanes writing
  five records means five regenerations of one file — a file that also
  carries a **byte band** and a **staleness gate**.
- The DOCS GATE's own check — *"`docs/STATE.md` is STALE against N newer
  checkpoint record(s)"* — would fire for whichever lanes lost the race,
  reporting a defect that is really a scheduling artefact.
- `docs/STATE.md`'s band has roughly one ordinary merge of headroom
  (`T-162-s1` derived `F` = 2 053 bytes for exactly this reason). Five
  concurrent editors of a document with one merge of slack is not a
  contention problem, it is a guaranteed breach.

So the rules are not merely awkward together; **the smallest ceremony
tier's own procedure is undefined at the operating mode the orchestrator
prescribes.**

## THE FILE ALREADY LEARNED THIS EXACT LESSON ABOUT ITSELF

`method/lane-protocol.md` carries, a few lines above the self-integration
rule:

> **THIS RULE SAID "THE EXECUTOR" UNTIL THE SEAT IT NEVER NAMED BROKE IT
> TWICE IN ONE SESSION.** `architect` appeared nowhere in this file …
> **A prohibition that enumerates seats grows a hole for every seat added
> after it.**

**This is that finding, one axis over.** The rule enumerates the
single-lane case and grows a hole for the concurrent one. The remedy that
worked there — state the COMPLEMENT rather than the enumeration — is the
first thing to try here.

## What the dispatching seat did, and why it is not the fix

This seat's dispatch prompts said *"Do NOT merge, do NOT push, do NOT
touch main"* to all five lanes. **That is almost certainly the right
behaviour and it was still a defect**, because it overrode a derived
contract from memory and did so silently — four times — until a lane
caught it. It is the same failure family `docs/STATE.md` item 7 already
names: *what a dispatcher writes from memory is the half that is wrong.*
**The remedy is to make the contract say it, not to keep saying it in
prompts.**

## What a fix decides

1. **Whether self-integration is conditioned on solitude.** The likely
   shape: an S card self-integrates **when it is the only live lane**,
   and otherwise hands the merge to whoever holds the integrator seat.
   State it as a condition on the world, not as a list of seats.
2. **Whether the CHECKPOINT half separates from the MERGE half.** They
   are bundled in one sentence and they have different collision
   profiles: merges to one branch serialise badly but survive; five
   regenerations of one banded document do not. **A lane may well be able
   to merge and still owe its record to a batched checkpoint** — decide
   it, do not assume it.
3. **Where the rule lives.** `lane-protocol.md` states it and
   `TASK-FORMAT.md` states the ceremony table; the derived ROW 11 in
   `executor.md` reads both. Whatever changes must keep those three
   agreeing, and the fix SHALL NOT introduce a fourth statement of it
   (`T-057`).

## Acceptance criteria

- THE self-integration rule SHALL state what an S lane does when other
  lanes are live, and SHALL do so as a condition rather than as an
  enumeration of cases.
- THE merge half and the checkpoint half SHALL be addressed separately,
  or the card SHALL say why one answer covers both.
- WHERE a dispatcher must override the ceremony row, the override SHALL
  have a written home, so that stating it in a prompt is repeating the
  contract rather than contradicting it.
- THE derived ROW 11 in `method/roles/executor.md` SHALL still produce a
  correct answer after the change, and a body SHALL prove it for the
  concurrent case specifically — **the case that has no answer today**.
- Verification: headless, the `tools/e2e` suite.

## Read beside

`method/lane-protocol.md` (the rule, and its own prior lesson about
enumeration), `method/roles/orchestrator.md:41` (the ceiling), and
`T-187` (the other place where a rule correct for one lane at a time is
silently wrong once the board moves underneath it).

## Implementation notes

Executor, 2026-08-31. Lane `task/T-189-lane`, base `2eb87f7`, method
commit `7f7716f`. Every figure below re-derived in this lane at the ref
it names.

### THE RESOLUTION: THE ROW GRANTS THE STANDING, THE HOLDER GRANTS THE SEAT

The two rules are not in conflict once the question is split the way
`lane-protocol.md` rule 4 already splits questions. *May an S executor
merge its OWN work* is an **AUTHORITY** question — the ceremony table
answers it yes, unchanged. *May two seats hold the integration checkout
at once* is a **COLLISION** question — rule 4's first sentence already
answers it no. **The exception was phrased as though the second were the
first, so it issued a SEAT where it meant to issue STANDING.** No new
prohibition was needed and none was added.

So self-integration is conditioned on **holding the integration
checkout**, never on the lane count. That is a condition on the world and
the complement of one holder, so it grows no hole per seat added — the
shape rule 4's own prior lesson prescribes.

**WHY NOT "WHEN IT IS THE ONLY LIVE LANE", WHICH THE CARD PROPOSED.**
Solitude is a proxy and it fails in the expensive direction, because the
holder is usually a seat with **no lane at all**. Measured in this lane
at `2eb87f7` — `docs/STATE.md`'s own LANES derivation, which is rule 7's:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'

returned **6** lanes (T-185, T-185-s2, T-189, T-196, T-199, T-200) and
did **not** return `/Users/ujju/Projects/nputer (on refs/heads/main)`,
because a filter selecting task branches excludes by construction the one
checkout that is never on one. A lane can be alone on the board and still
be second into the tree. Hence: **declared at dispatch, never inferred.**

### AC 4 IS ANSWERED BY A MEASUREMENT, NOT A JUDGEMENT

`deriveDeliverable` in `tools/e2e/scripts/dispatch-brief.mjs:2040` builds
ROW 11 from exactly four quoted sources: row 11's own column, the
matching **ceremony CELLS** verbatim, `numberedStep(executor.md, 6)`, and
`numberedStep(lane-protocol.md, 6)` — **rule 6, not rule 4.** Rule 4
reaches the brief under ROW 10. So a change landing only in rule 4 would
have left ROW 11 answering the concurrent case exactly as before. That is
why the operative sentence is in **rule 6 and the two ceremony cells**,
and the argument alone is in rule 4.

Proved by running the assembler either side of the change,
`node tools/e2e/scripts/brief.mjs --task T-189`, exit 0 both times
(223 lines at `2eb87f7`). ROW 11 after `7f7716f` now carries, in the
brief's own words: *"…removes its own worktree WHILE IT HOLDS THE
INTEGRATION CHECKOUT, and hands all three to the holder when it does
not"*, and from rule 6, *"A lane that does not hold it merges nothing,
checkpoints nothing and removes nothing… Being the only live lane is not
the condition and never was."*

### THE MERGE HALF AND THE CHECKPOINT HALF

One condition covers both, and rule 4 now says **why** rather than
assuming it: both are acts in that one checkout. Their failure modes
differ and the difference is written down, because it decides which half
is unrecoverable — merges SERIALISE (the second is refused, retries,
loses nothing); checkpoints CORRUPT (a banded state document regenerated
by several seats breaches its budget and reds its staleness check for
whoever lost the race, reporting a scheduling artefact as a defect). The
consequence is stated once: **the checkpoint is the holder's, one per
SITTING rather than one per merge** — which `docs-protocol.md` rule 4
already permits and which the practice already is. Evidence at `2eb87f7`:
`docs/checkpoints/2026-08-31-four-lanes-and-a-spec-that-tested-itself.md`
records `T-198`, `T-088-s4`, `T-194` and `T-202` — **four merges, one
record.**

### THE OVERRIDE'S WRITTEN HOME (AC 3)

Under the new rule the dispatcher's *"do NOT merge"* is **not an override
at all** — it is a transcription of the contract by the seat that holds
the checkout, and the brief's deliverable row already owed *explicitly
whether to merge*. That is the whole repair for the instance this card
was filed from: the sentence stops being remembered and starts being
derived. Where a dispatcher departs from the ceremony **ROW** itself,
that IS an override, and rule 4 sends it where `TASK-FORMAT.md` already
rules an override goes — prose in the card's body, with the reason, no
field.

### THE LIVE-INTEGRATOR PROBE STAYS UNBUILT, WITH THE REASON RECORDED

Rule 4 reserved that probe for the day its clause and the habit beside it
leak. **This card is the leak** — not a missed detection but a contract
that never named a holder — and a probe would not have closed it: a seat
reading a diff or waiting for a verdict holds the checkout while running
nothing for any probe to find. Recorded in the rule rather than left for
the next seat to build (`docs-protocol.md` rule 8's discipline, applied
to a machine deliberately NOT built).

### WHAT WAS CHANGED, AND THE FOURTH-STATEMENT TEST (T-057)

Three existing statements amended, no new location:

| path | what |
|---|---|
| `method/lane-protocol.md` rule 4 | the S-exception sentence gains the condition; one closing clause carries the whole argument |
| `method/lane-protocol.md` rule 6 | the operative sentence ROW 11 quotes |
| `method/tasks/TASK-FORMAT.md` | both S ceremony cells |
| `method/roles/executor.md` step 1 | a POINTER, marked as one in the text |

`method/tasks/TASK-FORMAT.md:490` — rung 0 of the ADVISORY blast-radius
table — also reads *"the executor is its OWN integrator"* and was
deliberately left alone: that table declares it BINDS NOTHING until its
flip condition measures true and that the ceremony ROW wins where they
disagree, so amending it would be the fourth statement this card forbids.

`roles/orchestrator.md:41`'s ceiling was deliberately not amended either.
Under this resolution the lane COUNT is not the operative variable, so a
ceiling that says nothing about self-integration is correct rather than
incomplete. **"Neither rule mentions the other" is repaired by one of
them mentioning it, not both** — a rule keyed to the count would be the
enumeration this file already knows grows holes.

### FOR THE VERIFIER

- The condition is **exclusivity**, not solitude. The attack worth making
  is a world where they differ: one live lane, an integrator seat busy in
  the checkout. The old text and the "only live lane" shape both say
  merge; the new text says do not.
- Rule 4 is long and every brief quotes it whole under ROW 10 (`+55`
  lines there). If the reading cost is the objection, the argument
  clauses are the compressible half, never the two operative sentences in
  rule 6 and the cells — those are what ROW 11 reads.
- `session-economics.spec.ts:445` reads the literal
  `| S, diff outside shipped code |` and `brief.mjs`'s signal-size line
  reads the table's FIRST row as its lightest, so the Size column and the
  row order are load-bearing and were not touched; only the Pipeline
  cells moved. `brief.spec.ts:880` only requires more than one S row.
- The drill below is the one that matters: the mutant produced a brief at
  **exit 0** with the answer silently gone. Nothing in the repository
  reds when this clause is deleted. That is `T-189-s1`.

### CEREMONY ROW, RE-DERIVED AND NOT AS DISPATCHED

`docs/CONVENTIONS.md` states the shipped/not-shipped partition
`TASK-FORMAT.md` leaves to the project: **"SHIPPED — any bare `method/`
path that REACHES a `KIT_FILES` entry"**, and *"REACHES, not equals — a
fence is a blast radius"*. This card's fence is the bare `method/`, and
the diff touches `method/tasks/TASK-FORMAT.md`, which is a literal
`KIT_FILES` entry (derived at `7f7716f` with the documented command,
`git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` — 14 entries). So
the row is **S, touching shipped code** and this card **owes a
verifier**; status stamped `verifying`, verifier fields left empty, and
the worktree stays standing until the verdict (`lane-protocol.md` rule
6). The rule of thumb alone would have said *"method self-integrates"*
and dropped the verifier — the clause in CONVENTIONS exists because
`T-145` did exactly that.

### GATES, DERIVED AT THE TREE THIS TIP WILL HAVE

Range rule, executor's row, at `2eb87f7`:
`TREE=$(git merge-tree --write-tree 2eb87f7 HEAD)` → `982910e`, exit 0;
`git diff --name-only 2eb87f7 982910e` → **3** paths, all `method/`.

- **METHOD EVAL GATE — FIRES** (`method/**`). `node
  tools/method-evals/run.mjs` exit **0**, 6 model-free evals; and the
  positive control is run, never assumed: `--selftest` exit **0**.
- **DOCS GATE — FIRES at the notes commit, not at `7f7716f`.** With the
  3 method paths it answered exit **0**, *"none under docs/ — this gate
  is not owed"*. Forecast with `docs/tasks/T-189-*.md` added it answered
  exit **1** — *"FIRES — 1 path(s) under docs/ are code inputs"* — naming
  `npm test` from `app/`, `npm test` from `tools/e2e/`, and
  `npx vitest run` from `lib/parser/`. All three run and green below.
  This is `docs/STATE.md`'s own hazard: the commit that makes the gate
  fire is the commit that carries the answer to it.
- **CARGO — OWED and no trigger names it.** `method/tasks/TASK-FORMAT.md`
  is a `KIT_FILES` entry. `cargo test` exit **0**, 18 `test result: ok`
  sections, including both method-reading bodies by name
  (`every_compiled_entry_matches_its_method_file_byte_for_byte`,
  `the_snapshot_table_covers_every_method_scaffold_file`).
- **GRAPH REGEN — NOT OWED**: no `*.ts/tsx/js/jsx` outside `docs/` in the
  3-path diff. **BOOT GATE — NOT OWED**: no `app/src/**`,
  `app/src-tauri/**` or manifest.

### COMMANDS, IN ORDER, EXIT READ FROM `$?` UNPIPED

| command | from | exit |
|---|---|---|
| `npm ci` · `npm run build` | `lib/parser/` | 0 · 0 |
| `npm install` · `npm run build` | `app/` | 0 · 0 |
| `npm ci` · `npx playwright install chromium` | `tools/e2e/` | 0 · 0 |
| `node tools/e2e/scripts/brief.mjs --task T-189` (before and after) | root | 0 · 0 |
| `node tools/method-evals/run.mjs` | root | 0 |
| `node tools/method-evals/run.mjs --selftest` | root | 0 |
| `node tools/e2e/scripts/docs-gate.mjs <3 method paths>` | root | 0 |
| `node tools/e2e/scripts/docs-gate.mjs <3 + the card>` | root | 1 |
| `cargo test` (`CARGO_TARGET_DIR` stemmed `T-189-`) | `app/src-tauri/` | 0 |
| `npx vitest run` — 16 files / 344 tests | `lib/parser/` | 0 |
| `npm test` — 50 files / 1105 tests | `app/` | 0 |
| `NPUTER_E2E_PORT=14189 npm test` — 404 passed, 5.0m | `tools/e2e/` | 0 |

Port derived from the card id and `lsof -nP -iTCP:14189 -sTCP:LISTEN`
read to **zero rows** immediately before binding. 1420 was never probed
or bound.

### DRILL — ONE SIDE ONLY, AT A COMMIT

No test body was added or changed, so the POISON DRILL is **not owed** on
its own terms; it is recorded here because the claim AC 4 makes deserved
a measurement rather than an assertion.

Drilled at `7f7716f`. Mutated the DOCUMENT only — stripped the 8-line
rule-6 clause from `method/lane-protocol.md` with `perl -0777 -i`
(`git diff --stat`: `1 file changed, 8 deletions(-)`; the clause head's
occurrence count read **1 → 0**, so the mutated TEXT was confirmed and
not merely a non-zero substitution count). Re-ran the assembler:
**`brief.mjs` exit 0**, and the clause's occurrence count in ROW 11's
output went **1 → 0**. **The brief did not red. It came back green,
shorter, and wrong** — which is the whole argument for `T-189-s1`.

Restored naming both sides,
`git restore --source=HEAD --staged --worktree -- method/lane-protocol.md`,
exit 0. Proof:
`git show HEAD:method/lane-protocol.md | shasum -a 256` and the working
file both
`0b3dec1e18284bcf2c1e0e434326f52de764b373086670eeb202f5c6f9c55494`,
with an empty `git diff --stat` as the companion, never the alternative.

### WHERE THE BRIEF WAS WRONG

- **The dispatch left the ceremony row to be read and the row is not the
  one the rule of thumb gives.** `method/` reaches `KIT_FILES`, so this
  card is *touching shipped code* and owes a verifier. Stamped
  `verifying`, not `done`.
- **The card proposes solitude as the likely condition** (*"an S card
  self-integrates when it is the only live lane"*). Measured against
  rule 7's own derivation, that condition is unsound in the expensive
  direction; it was refused and the reason is in the rule.
- **AC 4's "a body SHALL prove it" was NOT built**: `tools/e2e/tests/` is
  outside this card's fence, which expands to `method/` and
  `docs/CONVENTIONS.md`. Routed as `T-189-s1` naming the exact path. The
  assembler run and the drill above are what could be measured in fence.
- `docs/CONVENTIONS.md` is in the fence and was **not** changed: no
  sentence in it contradicted the new law (`self-integrat` does not
  appear in the file), and adding the holder's project spelling there
  would have been the fourth statement.

### NOTICED, NOT DONE

- `T-189-s1` — the body AC 4 asks for. `tools/e2e/tests/`.
- `T-189-s2` — the 3–5 ceiling is stated twice, in
  `method/roles/orchestrator.md:41` and `method/tasks/TASK-FORMAT.md`'s
  Parallelism guardrails. Inside this fence, outside these criteria.

### ADDENDUM 2026-08-31 — THE DOCS GATE'S EXIT 1 WAS VERIFIED, NOT ASSUMED

A correction reached this lane after the run above: `docs-gate.mjs` exit
**1** can mean the gate CRASHED rather than that it has a verdict. Its
vocabulary — `{CLEAN:0, FOUND:1, USAGE:2, CANNOT_RUN:3}` at line **148** —
is set in a `catch` at line **466**, inside `main()`, while `yaml` is a
**top-level** import at line **129**. Import resolution precedes the
catch, so a missing `tools/e2e/node_modules` exits 1 with the contract
never engaged. `docs/CONVENTIONS.md`'s fresh-clone ORDER names only
`lib/parser` and `app/`, so a lane that follows it literally reaches
exactly that state. Found by `T-185-s2`'s executor.

**All four docs-gate reads on this card are genuine verdicts**, checked
rather than assumed: `tools/e2e` `npm ci` ran in this worktree (exit 0)
and `tools/e2e/node_modules/yaml` exists; each of the four logs carries
**7** `docs-gate:` lines and **0** stack-trace markers.

**And the discriminator was given a positive control**, because a
negative assertion needs one: a scratch module carrying the gate's exact
`EXIT` object and the same failing `yaml` import, run outside the repo,
exits **1** with a Node stack trace and **0** `docs-gate:` lines. So
"read the output, not the code" separates the two cases in both
directions, on measurement rather than on faith.

**IT IS ALSO A SECOND INSTANCE OF THIS CARD'S OWN FAMILY**, which is why
it is recorded here and not only routed: a setup ORDER that is silent
about a dependency a GATE requires, with nothing connecting the two rules
— the same shape as a ceremony row that is silent about the seat a
ceiling makes contended. **What generalises is not the pair; it is that
each rule was correct alone.** `T-189`'s remedy is the one that scales:
do not enumerate the other rule, state the CONDITION the second rule
makes true or false, so a reader who never opens the other file still
gets the right answer. Fixing the setup-order instance is outside this
fence and is being filed separately by the coordinating seat.
