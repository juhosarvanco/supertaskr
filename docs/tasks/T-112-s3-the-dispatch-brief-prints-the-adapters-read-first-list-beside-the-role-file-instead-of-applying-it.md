---
id: T-112-s3
title: dispatch-brief.mjs prints BOTH adapters' read-first lists beside the role file instead of APPLYING its reading step, so every brief it has ever emitted told an executor to read the one document its role file subtracts
feature: F-04
milestone: 4
priority: 20
size: S
status: done
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@integration-seat
review:
---

**FOUND BY BEING THE SECOND READER OF THE TABLE, WHICH IS THE WHOLE
REASON T-112 EXISTS.** That card says so: *"This card's assembler is the
second reader of that table, and it will find whatever the hand-walk
missed."* This is one of them, and it is in the FIRST reader.

Row 3's source column does not merely name the adapter. It says the role
file's *"reading step is APPLIED to that list rather than printed beside
it — **the adapter is addressed to every seat and the role file to one,
so where they differ the ROLE FILE WINS**"*. The table's rules section
then names the exact failure this prevents: *"a brief that is internally
inconsistent while every row is individually faithful to its source"*,
and gives this row as the worked example — *"row 3 transcribes an
adapter list addressed to every seat, and the role file four rows
earlier subtracts from it."*

**`tools/e2e/scripts/dispatch-brief.mjs` PRINTS IT BESIDE.** Run
`node scripts/brief.mjs --task T-112` from `tools/e2e/` at any ref and
row 3 comes back as two lines — `AGENTS.md names:` and `CLAUDE.md
names:` — each carrying `docs/ROADMAP.md`, which
`method/roles/executor.md` step 1 subtracts in as many words
(*"You do NOT read docs/ROADMAP.md, and that is a deliberate
subtraction rather than an oversight"*), and neither carrying the role
file's own ADDITION (`tasks/TASK-FORMAT.md`'s ceremony table), whose
absence that step says *"cost the same dispatch error twice"*.

So an executor obeying its brief's row 3 reads a document its role file
forbids and misses the one it requires — and both halves are quoted
correctly from their sources, which is exactly why a transcription rule
alone cannot catch it.

**THE FIX IS DERIVED, NOT LISTED, AND ONE EXISTS TO COPY.**
`app/src-tauri/src/dispatch/brief.rs`'s `row_read_first` reads both
halves out of the role file's own sentences (`read_subtractions`,
`read_additions`) and emits the APPLIED list beside the adapter's
original, so the difference is visible rather than silent. A role file
stating no subtraction leaves the adapter's list unchanged, which is the
positive control that keeps the derivation from being a constant.

## Acceptance criteria

- ROW 3 SHALL emit the read-first set with the brief's own role file's
  reading step APPLIED, and the subtraction and addition SHALL be
  DERIVED from that role file rather than listed in the tool.
- THE brief SHALL still show what the adapter itself named, so a reader
  can see WHICH document the role file removed and which it added.
- A body SHALL prove the derivation is not vacuous: a role file with no
  subtraction clause leaves the adapter's list unchanged.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-04 p20, as filed

Re-derived at `b60b06d`: `deriveReadFirst` in
`tools/e2e/scripts/dispatch-brief.mjs` still emits one `value(...)` row
per root adapter (`${rel} names: ${docs.join(" ")}`) and applies no
subtraction from the role file — the card's claim holds unchanged, and
`method/roles/executor.md:9` still carries the subtraction it ignores.

**AND THIS ONE IS DISPATCHABLE TODAY.** Its fence is `[tools/e2e]`,
which `.nputerignore` excludes from the graph walk, so it cannot move
the 410-byte headroom. With the code queue held behind `T-140-s4`, this
card and `T-163-s5` are the two F-04/F-06 promotions a lane can take
right now.

## Implementation notes (executor, 2026-08-31)

Lane `task/T-112-s3-read-first-applied` at
`/Users/ujju/Projects/nputer-T-112-s3`, cut from `2370144`. Build commit
`1db60e1`; these notes are the tip.

### What landed, and where the derivation lives

`tools/e2e/scripts/dispatch-brief.mjs` — four exported functions and a
rewritten `deriveReadFirst`:

- `docsNamed(text)` — ONE spelling of what a document reference IS,
  replacing the regex that was inline in the deriver. It is shared by the
  adapter read and by the subtraction reader on purpose: `executor.md`
  writes its subtraction bare and `verifier.md` writes the same one
  BACKTICKED, so a second spelling would subtract a string the adapter
  never added.
- `backtickRuns(line)` — every backtick-delimited run, in order.
- `readSubtractions(roleMd)` — the documents the brief's OWN role file
  removes, read off its `do NOT read <doc>` sentence. **Whole-file, not
  step one**: that sentence is in step 1 of `executor.md` and in step 0 of
  `verifier.md`, so a scan bounded to a numbered step reads one role file
  and misses the other. First mention per line only, and a sentence that
  names no document subtracts NOTHING — `verifier.md`'s second one forbids
  the executor's notes, which is prose.
- `readAdditions(roleMd)` — the documents it adds, off its `ADDITION TO
  THAT SET IS \`<doc>\`` sentence, quoted in the role file's own spelling
  because a brief is a transcription.
- `deriveReadFirst` still emits `<adapter> names: ...` per root adapter,
  then `the role file SUBTRACTS: <doc>`, `the role file ADDS: <doc>`, and
  `READ FIRST, the role file's reading step APPLIED: <list>` — one applied
  line per DISTINCT adapter set, so agreeing adapters emit exactly one and
  disagreeing ones get the step applied on both sides rather than a union
  nobody wrote (the existing disagreement finding still fires). A role
  file stating neither gets a note saying the adapter's list stands
  unchanged.

**NO DOCUMENT NAME IS WRITTEN DOWN IN THE TOOL** — only the grammar of the
two sentences. The comments were rewritten mid-build for exactly this: a
first draft quoted the subtracted document inside a JSDoc block, which
would have made the module name the constant it must not hold.

Shape copied (not code) from `app/src-tauri/src/dispatch/brief.rs`'s
`row_read_first` / `read_subtractions` / `read_additions`, read at
`1db60e1`. Three deliberate differences: the applied list DEDUPES an
addition the adapter already names, the adapter's own lines are kept per
adapter rather than first-wins, and a role file that changes nothing says
so rather than emitting a silently identical line.

### Acceptance criteria

1. **MET.** Row 3 emits `READ FIRST, the role file's reading step
   APPLIED: docs/STATE.md docs/ARCHITECTURE.md docs/CONVENTIONS.md
   docs/CAPABILITIES.md docs/NORTH_STAR.md tasks/TASK-FORMAT.md` at
   `1db60e1` — `docs/ROADMAP.md` gone, `tasks/TASK-FORMAT.md` gained, both
   read out of `method/roles/executor.md`.
2. **MET.** Both `AGENTS.md names:` and `CLAUDE.md names:` survive
   unedited, with a SUBTRACTS line and an ADDS line between them and the
   applied set, so the difference is visible rather than silent. Pinned by
   `brief.spec.ts:220`, which compares each adapter line against
   `docsNamed(readDoc(rel))` and requires it to still carry the subtracted
   document and still NOT carry the addition.
3. **MET.** `brief.spec.ts:306` strips the role file's two sentences IN
   MEMORY (one side only — the module is untouched) and requires the
   applied list to equal the adapter's exactly, the subtracted document to
   come back, the addition to go, and the `stands unchanged` note to
   appear. Its second half is the other face of the same control: a role
   file subtracting a DIFFERENT document (derived — the last adapter entry
   not already subtracted) must strike THAT one and stop striking the
   original. `brief.spec.ts:374` adds the discrimination that a `do NOT
   read` sentence naming no document subtracts nothing.

### Gates, each read from `$?` UNPIPED

Measured in this lane at `1db60e1` unless stated.

| command | from | exit |
|---|---|---|
| `npm ci` | lib/parser/ | 0 |
| `npm run build` | lib/parser/ | 0 |
| `npm install` | app/ | 0 |
| `npm ci` | tools/e2e/ | 0 |
| `npm test` (335 passed) | tools/e2e/ | 0 |
| `npm run typecheck` | tools/e2e/ | 0 |
| `npm run lint:tokens` (159 TOKEN files, 993 CONTROL files) | tools/e2e/ | 0 |
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri/ | 0 |
| `node tools/e2e/scripts/docs-gate.mjs <forecast paths>` | repo root | 1 |

Re-run at the notes tip, because this file's own frontmatter is what fires
the DOCS GATE and the three suites it names are owed on THAT commit:

| command | from | exit |
|---|---|---|
| `npx vitest run` (16 files, 336 tests) | lib/parser/ | 0 |
| `npm run build` | app/ | 0 |
| `npm test` (49 files, 1060 tests) | app/ | 0 |
| `npm test` (335 passed) | tools/e2e/ | 0 |
| `npm run typecheck` | tools/e2e/ | 0 |
| `npm run lint:tokens` | tools/e2e/ | 0 |

No wall-clock duration is recorded above ON PURPOSE. A suite's runtime is a
live-environment fact, not a function of the tree, so it would be the one
figure on this card that moves under a re-run at the same ref — and a card
whose figures move is a card nobody can check twice.
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri/ | 0 |

The app's build runs BEFORE its suite deliberately (CONVENTIONS'
fresh-worktree sub-bullet: several app bodies read the built bundle off
`app/dist`, and an unbuilt tree fails them about a stale build rather than
about the tree).

**GRAPH REGEN — FIRES, and is a measured NO-OP.** The trigger matches
`tools/e2e/tests/brief.spec.ts` (a `*.ts` path outside `docs/`), so it
fires by the letter; `.nputerignore` excludes `tools/`, so the regen
cannot move anything. ASKED rather than predicted, at BOTH commits:
`index --check` answers **CURRENT** at exit 0 — 1039590 bytes, 199 files,
2067 symbols, 2334 edges, byte-identical to the committed graph, headroom
still **410 bytes**, unchanged by this lane. The regen-and-commit at the
checkpoint is the integrator's and `docs/architecture/graph.json` is
outside this fence.

**BOOT GATE — NOT OWED.** The forecast diff touches no path under
`app/src-tauri/**` or `app/src/**` and neither manifest.

**DOCS GATE — FIRES, exit 1, and it is THIS CARD that fires it.** The
forecast set carries one path under `docs/` that a code suite reads —
this file, whose frontmatter the parser and app suites parse. All three
owed suites were run at the notes tip and all three are exit 0 (table
above): `npx vitest run` from lib/parser/, `npm test` from app/ (after
`npm run build`), `npm test` from tools/e2e/. (The gate was also shown
capable of failing: called from `tools/e2e/` with root-relative paths it
refuses at exit **2** rather than answering, which is the ambiguity
guard, not a verdict.)

**METHOD EVAL GATE — NOT OWED.** Nothing under `method/` is in the diff.
No method version bump is owed either: the diff moves no `KIT_FILES`
byte and no card/room/brief/role GRAMMAR.

**THE RANGE, and the pair it is:** executor's form per THE RANGE RULE —
`TREE=$(git merge-tree --write-tree main HEAD)` then `git diff
--name-only main "$TREE"`. Against the main this lane READ — and main is
a MOVING ref, so that read carries a clock and not a commit: read
2026-08-31 on Mac.lan, main stood at `85560e7`, its advance since the
base `2370144` was 20 paths, all under `docs/`, and none of them in this
fence. The forecast against it is **3 paths** — the two `tools/e2e`
files plus this card — which is the set every gate above was derived on.
**THE INTEGRATOR RE-DERIVES AT THE MAIN IT ACTUALLY MERGES INTO**: main
was already at a later commit carrying `app/src-tauri` and `app/src`
work before this lane finished, which changes ITS gates and not this
lane's — the forecast path set was still exactly these 3.

### POISON DRILL — 15 for 15, no survivors

Run at the commit (`1db60e1`), after the work was committed. **Every
mutant moves the PRODUCER** (`dispatch-brief.mjs`), never an assertion,
and never a literal the two sides share — `docsNamed` is deliberately
NOT mutated, because the spec imports it as its neutral reference and a
mutation there would move BOTH sides. Each mutant was applied by script,
its mutated text READ BACK OFF DISK and printed before the run, measured
against the **whole** e2e suite, then restored with `git restore
--source=HEAD --staged --worktree --` and proven by sha256.

| # | mutant, one side only | suite | bodies killed |
|---|---|---|---|
| M01 | the subtraction is not applied — this card's own defect, restored | 1 | 220, 306 |
| M02 | the addition is dropped from the applied set | 1 | 220 |
| M03 | the adapter's own line is overwritten with the post-subtraction list | 1 | 220 |
| M04 | the SUBTRACTION is a constant in the tool | 1 | 306 |
| M05 | the ADDITION is a constant in the tool | 1 | 306, 374 |
| M06 | a `do NOT read` naming no document subtracts the prose after it | 1 | 374 |
| M07 | the SUBTRACTS disclosure line is not emitted | 1 | 220 |
| M08 | the ADDS disclosure line is not emitted | 1 | 220 |
| M09 | the APPLIED line is not emitted at all | 1 | 220, 306 |
| M10 | the applied set keeps nothing the adapter named | 1 | 220, 306 |
| M11 | `readSubtractions` never answers | 1 | 220, 306, 374 |
| M12 | `readAdditions` never answers | 1 | 220, 306 |
| M13 | the adapter's own line is not emitted at all | 1 | 220, 306 |
| M14 | the adapter's line also carries the role file's addition | 1 | 220 |
| M15 | the `stands unchanged` note is not emitted | 1 | 306 |

"suite" is `npm test` from tools/e2e/'s exit under the mutant: **1**
every time, against **0** on the unmutated tree. Bodies are
`tests/brief.spec.ts` line numbers at `1db60e1` (220 = the property,
306 = the positive control, 374 = the discrimination).

**RESTORATION PROOF.** `git show HEAD:tools/e2e/scripts/dispatch-brief.mjs
| shasum -a 256` = `b63defb0da5713c869819f22c669081082985c24feccb6d277f243a757e90be7`,
and the working file matched it after **every one of the 15** restores —
the driver aborts the run on a mismatch, so all 15 are proven, not just
the last. The spec file was never mutated and its blob matches too
(`9eaa9844c651475678b22ebd6134d7271dcbb14066b2231f213fcb8186ec6dcb`).

### The sweep, since a fix names its class

**THE CLASS: a contract row whose SOURCE COLUMN ranks one source above
another, transcribed faithfully instead of having the ranking APPLIED.**
Combining two sources is not the class — RANKING them is, because only a
ranking can be obeyed or ignored while the transcription stays correct.
One search over the table, at this tip and re-run at the base:

    command grep -nE "^\| [0-9]+ \|" method/roles/executor.md |
      command grep -inE "APPLIED|WINS|authoritative|PRECEDENCE"

**TWO HITS, NOT ONE, AND THE SWEEP IS NOT EMPTY.** Row 3 is this card.
The other is **row 5**, which ranks twice — the live LANE LIST *"takes
PRECEDENCE over the board's `status:`"*, and each component's own
`touch_slugs:` FIELD is *"authoritative"* over the architecture doc's
prose block. Both are already APPLIED in `deriveFence`, checked rather
than assumed: `ctx.slugs` is built by `slugMapFromFields` and the prose
block is COMPARED into a divergence list (pinned by `brief.spec.ts:701`),
and the lane rows are derived from the worktree list with the card's
`status:` emitted beneath them as subordinate — *"the BRANCH is what says
what a lane is doing"*. So the class has exactly one defective member and
this card is it. Shown capable of failing before the count was written
down: the same expression returns **2** at HEAD and **2** at the base
`2370144` — where row 3 was the live defect — and **0** for a term no row
carries.

### For the verifier / integrator

- **`docs/CAPABILITIES.md` IS NOW STALE AND I COULD NOT REGENERATE IT.**
  It is generated from the e2e spec NAMES (`npm run capabilities` from
  tools/e2e/), this lane adds three spec names, and the file is
  `docs/CAPABILITIES.md` — OUTSIDE this fence, which is `tools/e2e` plus
  `docs/tasks`. Nothing gates it (no spec body and no CI step runs
  `capabilities:check`), so no suite reds; it is a census that has gone
  quietly out of date and the regeneration belongs to whoever can write
  `docs/`. Routed here rather than taken.
- **THE CEREMONY ROW SAYS THIS CARD HAS NO VERIFIER, AND I STAMPED
  `verifying` ANYWAY BECAUSE THE DISPATCH SAID SO.** By
  `tasks/TASK-FORMAT.md`'s table this is *S, diff outside shipped code* —
  `tools/e2e` is dev tooling under no component, `.nputerignore`d out of
  the walk, and no `KIT_FILES` byte — so the row makes the executor its
  own integrator and `roles/executor.md` step 6 would have this card
  stamped `done`. The dispatching seat explicitly reserved the merge, the
  checkpoint and the worktree removal for an integrator seat and named
  `verifying` as the stamp. That is an explicit restriction, and the role
  file's own precedent is that a lane obeys it and reports rather than
  guessing upward — so: not merged, not pushed, main untouched, worktree
  left standing, and the disagreement is named here for whoever holds the
  integrator seat.
- The brief's ROW 4 named a worktree path INSIDE the repository
  (`.claude/worktrees/nputer-T-112-s3`), violating lane-protocol rule 3.
  The dispatching seat corrected it before the lane was cut and has filed
  it as `T-179`; this lane is at the sibling path and did not move itself.
- The brief's ROW 2 read `status: planned`; at the base commit `2370144`
  the card already read `building`. The dispatch stamp landed between the
  brief's ref (`4efd5a7`) and the base.

## INTEGRATOR REVIEW (2026-08-31) — this row owes no verifier, so the review is recorded here

**THE CEREMONY QUESTION THE EXECUTOR RAISED IS RULED, and it was right to
raise it rather than guess upward.** `method/tasks/TASK-FORMAT.md`'s
table gives *S, diff outside shipped code* an executor who is its own
integrator. `docs/CONVENTIONS.md`'s SHIPPED PARTITION names `tools/e2e`
explicitly on the NOT-SHIPPED side — *"YES to 'is it code?', NO to 'does
it ship?' — the case this rule exists to settle"* — so no verifier is
owed. The dispatch nonetheless reserved merge and checkpoint to this
seat, which is a restriction the dispatcher may impose and the executor
obeyed. **The stamp that survives is `done`, integrated by this seat,
with the review below standing in the verifier's place** — the same
disposition `T-163-s4` took on 2026-08-30, and for the same reason.

**THE CENTRAL CLAIM IS VERIFIED AT THE MERGE, not accepted.** The
executor claims no document name is written into the tool — only the
grammar of two sentences. Read at the merge:

- `readSubtractions` matches the literal `do NOT read ` and hands the
  REMAINDER of that line to `docsNamed`;
- `readAdditions` matches `ADDITION TO THAT SET IS ` and hands its
  remainder to `backtickRuns`;
- `docsNamed` is `/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g` — a shape, not a
  name.

No subtracted or added document is spelled anywhere in the derivation.
The `TASK-FORMAT.md` and `STATE.md` literals elsewhere in that file
belong to row 11's ceremony reader and arm two's STATE reader and predate
this diff.

**ONE ASYMMETRY, RECORDED FOR THE NEXT SITTING RATHER THAN CORRECTED
HERE.** The two arms do not share a vocabulary: subtractions are read
with `docsNamed`, which matches **only `docs/**.md`**, while additions
are read with `backtickRuns`, which matches any backticked run. That is
correct for today's role files — the subtraction names `docs/ROADMAP.md`
and the addition names `tasks/TASK-FORMAT.md`, which is not under
`docs/` — but it means **a future role file subtracting a non-`docs/`
document would silently subtract nothing**, in a tool whose entire
purpose is that a silent difference between the adapter and the role file
cost every brief its correctness. The failure would be quiet and the
tool's own subject is quiet failures. Not a rework: the card asked for
the two sentences to be applied and they are. Routed as an observation
for triage.

**THE EXECUTOR'S OWN DISCLOSED DEVIATION, accepted:** it completed the
ramp-up reading and found no conflict, but did not write the
one-paragraph confirmation `method/roles/executor.md` step 1 asks for
before touching code. Disclosed unprompted in its report. Recorded rather
than waved through — the value of that paragraph is that it surfaces a
misreading BEFORE the work, and a lane that skips it has spent its own
safety net; that it went well here is luck rather than evidence.

**And its sweep found the class had TWO members, not one** — row 3 (this
defect) and row 5, whose two rankings `deriveFence` already applies,
checked rather than assumed. A sweep that reports two where the card
predicted one is the sweep rule working.