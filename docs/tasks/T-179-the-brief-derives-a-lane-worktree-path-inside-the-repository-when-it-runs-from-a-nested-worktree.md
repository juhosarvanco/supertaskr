---
id: T-179
title: The brief derives a lane worktree path INSIDE the repository when it is run from a nested worktree — row 4 prints it under the heading "absolute, per lane-protocol rule three", which is the rule it breaks
feature: F-04
milestone: 4
priority: 9
size: S
status: verifying
blocked_by: []
suggested_by: architect/integrator seat @T-112-s3's dispatch (2026-08-30) — found by reading the brief it emitted
touches: [tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**CLASS PARENT: none found.** `command grep -rli "worktree path" docs/tasks/`
at `2370144` finds no card owning this; the nearest neighbour is the
`--root` hazard in `docs/CONVENTIONS.md` (a command answering confidently
and wrongly because of WHERE it ran), which is the same genus one tool
over and is a doc bullet rather than a card. Filed rather than
corroborated for that reason.

## The measurement, at `2370144`

`node scripts/brief.mjs --task T-112-s3` run from a nested worktree
(`/Users/ujju/Projects/nputer/.claude/worktrees/adoring-nash-028cf4`)
emitted, in ROW 4:

    worktree (absolute, per lane-protocol rule three):
      /Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-112-s3
      <- docs/CONVENTIONS.md lane bullet worktree spelling

That path is **inside the repository**. `method/lane-protocol.md` rule
three says in as many words: *"The worktree is a sibling directory, never
a path inside the repository"* — and the brief prints the violating path
under a heading that cites the rule.

The dispatching seat cut the lane at the correct sibling path
(`/Users/ujju/Projects/nputer-T-112-s3`) because it read the rule rather
than the row, and corrected the executor in its launch prompt. **A seat
that trusted the brief would have created exactly the case rule three
exists to forbid** — and rule three's own text says why that is not
cosmetic: a worktree under the root is a second copy of every file to
every walker, and it becomes an untracked directory in the integration
checkout's status, so a wildcard stage there stages a whole second
project.

## The mechanism

CONVENTIONS publishes the worktree spelling as `../nputer-T-NNN` — a
RELATIVE path, resolved by the brief against the checkout it ran in. From
the integration checkout `/Users/ujju/Projects/nputer` that resolves to
the intended sibling. From a nested worktree it resolves one level inside
`.claude/worktrees/`, and nothing notices, because the spelling is
correct and only the base moved. **This is rule three's own stated
failure — *"a RELATIVE worktree path resolves against whatever directory
the dispatching shell happens to sit in"* — arriving through a DERIVED
row instead of through a typed command**, which is worse: a typed command
is the typist's, and a derived row carries a provenance stamp that invites
trust.

It is live now rather than hypothetical: the architect/integrator seat
runs from a nested worktree by construction in this harness, so every
brief that seat generates carries the wrong path.

## What a fix decides

1. **Whose base?** The honest candidate is the REPOSITORY's main
   worktree (`git rev-parse --path-format=absolute --git-common-dir`'s
   parent, or `git worktree list`'s first entry) rather than the running
   checkout — a lane is a sibling of the REPOSITORY, not of whoever
   dispatched it.
2. **Or refuse.** A brief that cannot tell where the repository's own
   root is could emit NOT DERIVED with its source, which is the shape
   this command already uses for rows it cannot derive — better than a
   confident wrong path, and it is the tool's own established idiom.
3. **And the same question is owed for every other row derived from a
   relative spelling** — the sweep is the deliverable, not just this
   row. Record it EVEN IF EMPTY (CONVENTIONS, A FIX NAMES ITS CLASS AND
   ITS SWEEP).

## Disposition hint

Small and self-contained in `tools/e2e` — outside the graph walk, so
dispatchable under any graph-budget hold. It contends with any other live
`tools/e2e` lane, which is the only reason it is not trivially parallel.

## TRIAGE (2026-08-31, standing triage sitting #5 — called by a BAND) — PROMOTED F-04 p9, and its evidence tripled overnight

Filed after one sighting. By this sitting **every executor dispatched
tonight reported it independently** — `T-112-s3`, `T-140-s4`, `T-172`,
`T-177` each opened their brief, read ROW 4's worktree line, and found
it naming a path inside the repository under a heading citing the very
rule it breaks. Four lanes, four correct reports, zero lanes that
actually cut themselves in the wrong place.

**THAT IS THE ARGUMENT FOR FIXING IT AND ALSO THE REASON IT IS NOT
URGENT**: the brief is wrong, and every reader so far has been careful
enough to catch it. The dispatching seat corrected each of them in the
launch prompt, which is a discipline standing in for a construction —
exactly the trade this project keeps converting the other way.

It is fenced `[tools/e2e]`, outside the graph walk, and contends only
with whatever else holds that package.

## Implementation notes (executor, 2026-08-31, at `ecfb736`)

**Diff at `ecfb736`: +475/-13 across three files** — derived with
`git diff --stat 155993f ecfb736`, all inside the fence `[tools/e2e]`.

### WHOSE BASE, AND WHY

`git worktree list --porcelain`'s FIRST entry, parsed by
`mainWorktree()` in `tools/e2e/scripts/dispatch-brief.mjs`. The card
named two candidates and both were MEASURED on this repository from all
three checkout shapes before either was chosen — the integration
checkout, the architect's nested worktree
(`.claude/worktrees/adoring-nash-028cf4`) and this lane
(`/Users/ujju/Projects/nputer-T-179`). Both answered
`/Users/ujju/Projects/nputer` from all three. The porcelain wins on
three counts:

1. It is GIT'S OWN ANSWER rather than a derivation from one —
   git-worktree(1) lists the main working tree first, by contract. The
   parent of `git rev-parse --path-format=absolute --git-common-dir` is
   a guess that holds only where `.git` is a directory at the top of the
   main worktree, and it is wrong under `git init --separate-git-dir`,
   under an exported `GIT_DIR`, and for a bare repository.
2. It SAYS `bare` in one word instead of quietly handing back a
   directory that has no working tree — which is the card's arm 2, the
   REFUSAL, and it is now reachable rather than theoretical.
3. **`context()` ALREADY READS IT** (`ctx.porcelain`). So the fix costs
   NO new git call and NO new failure mode, and row 4's base is derived
   from the same text row 5's lane list is — the two rows cannot
   disagree about where the repository is. Row 5 was right all along
   precisely because it READ the porcelain instead of resolving a
   spelling; row 4 now reads the same text.

**THE REFUSAL IS WIRED, not described.** `mainWorktree` returns
`{ path: "", reason, via }` for an empty porcelain and for a bare first
entry, and row 4 then emits
`worktree (absolute, per lane-protocol rule three): NOT DERIVED — <reason>`
carrying the published spelling and its source. That is the shape this
command already uses for a contract row it has no deriver for.

**AND THE ROW NOW CHECKS ITSELF AGAINST THE RULE IT CITES.** Fixing the
base makes the path right for the spelling this project publishes today;
it does not make it right for a spelling the document could publish
tomorrow. `insideRepository()` is the containment test — spelled the way
`docs-scan.mjs` already spells the DOCS GATE's root check — and a
derived worktree inside the repository is now a FINDING naming both
paths and quoting rule three, not a confident print.

**THE STAMP MOVED FROM TREE TO LIVE, and it should have been live all
along.** Where the repository sits on a disk is not determined by the
commit a checkout holds; the same tree answers one way here and another
on a runner. The row was stamped `@ <ref>`, which is this module's own
contract rule 3 broken inside the row that cites lane-protocol rule
three. The SPELLING is the tree's and the resolved path is the
machine's, and the provenance now names both.

**THE CREATE COMMAND IS SPELLED ABSOLUTELY TOO, where a card is named.**
The row is the report; the command is the ACT. Rule three's own remedy
is *"STATE THE PATH ABSOLUTELY"* and its own stated failure is a
relative path in exactly this command. **The `ctx.taskId !== ""` guard
on that substitution was found BY THE SUITE, not by the author**: with
no task named the create line is the document's own text, placeholders
and all, and a transcription is a TREE fact — so the first draft put a
live stamp on a tree fact, which is this card's defect facing the other
way, and `a figure read from the MOVING integration ref is a LIVE fact`
reddened on it by name.

### THE SWEEP — TWO MEMBERS, BOTH FIXED; THE REST RECORDED

**CLASS:** a filesystem path this command DERIVES by resolving a
RELATIVE spelling against the checkout it ran in, rather than against
the repository.

**SEARCH (one command, recorded):**
`command grep -rn "path\.resolve(" tools/e2e/scripts/*.mjs` — every hit
read, none skipped.

**MEMBERS (2), both fixed at `ecfb736`:**

1. `dispatch-brief.mjs` `deriveLane` — the worktree row AND the create
   command. The card's own row.
2. **`brief.mjs:310` `--write-fence`** — resolved its worktree argument
   against `ctx.root` the same wrong way, **and then WRITES the manifest
   there**. A dispatcher pasting CONVENTIONS' published
   `../nputer-T-NNN` from a nested worktree aimed the manifest one
   directory inside `.claude/worktrees/`. This is the sibling
   CONVENTIONS' sweep bullet warns about — *"left an identical sibling a
   few lines away"* — and it is the worse half, because the row is read
   and this one acts. One base, derived once, spent by both; an ABSOLUTE
   argument (what the live dispatch flow passes) is untouched by either
   spelling. It refuses outright when the argument is relative AND the
   repository root is underivable.

**NOT MEMBERS, each with the reason it is not one:**

- `dispatch-brief.mjs:134` `readDoc`'s `path.join(root, rel)` — a READ
  of *this* checkout's own documents. The running checkout is the
  correct base and the drill affordance depends on it.
- `dispatch-brief.mjs:1823` `path.resolve(entry.path) === path.resolve(ctx.root)`
  — asks "is this porcelain entry MY checkout", where the running
  checkout is again the right base; both operands are already absolute.
- `capabilities.mjs:41-42`, `docs-scan.mjs:231`, `tauri-boot-check.mjs:78`,
  `token-scan.mjs:108` — `path.resolve(here, "..", …)`, a module
  locating itself. No document spelling is involved.
- `docs-scan.mjs`'s many `resolve(...)` hits — literal SAMPLE CORPUS
  text for the call-site analyser, not path resolution.
- `docs-scan.mjs:2329-2353` — already distinguishes cwd from root and
  REFUSES a plain relative path *because it has two readings*. This is
  the house idiom this fix follows, and it is the "nearest neighbour"
  the card's CLASS PARENT section pointed at.
- `health-bands-run.mjs:106,136` — `path.resolve(process.cwd(), …)` on a
  user-typed config path. Resolving a typed path against the typist's
  cwd is the conventional base, not this class.

**ONE RECORDED NON-MEMBER LEFT ALONE, and it is a real question:**
`brief.mjs:394` resolves `--audit <path>` against `cardCtx.root`. Same
mechanism, but the audited file is not a repository artefact and has no
published spelling, so there is no *repository* answer to prefer over
the checkout one — and note it disagrees with `health-bands-run.mjs`,
which resolves its user-typed path against the CWD. Two commands in one
package with two bases for the same kind of argument. Not fixed here
because picking one is a decision about the package's CLI convention,
not about rule three; **ROUTED to the architect** rather than pocketed.

**THE SWEEP'S RESULT, MECHANIZED AND NON-EMPTY-BY-CONSTRUCTION.** The
sweep is not only the grep above: `THE SWEEP: no derived row moves when
only the dispatching checkout moves, and the movers are named` runs the
WHOLE brief twice over one fixture repository — once from its main
worktree, once from a worktree nested inside it — and requires every
moved value to be on a named allowlist. That asks the class's question
of every row at once instead of only row 4.

    lines compared per run                          165
    values that moved                                 2
    unexplained movers                                0

Both movers are allowlisted with their reason ON the allowlist:
`repository: ` (the row that names the checkout the command ran in, and
says so in its own provenance) and `another checkout exists and is not
yours: ` (where "yours" is relative to the asker by construction). A
third entry, `port <n> holder:`, is a stated safety valve for a MACHINE
fact and did not fire. Both structural entries are POSITIVE CONTROLS —
the body requires each to have actually moved, so a zero cannot be the
zero of a comparison that never ran.

**SHOWN CAPABLE OF FAILING BEFORE ITS ZERO WAS WRITTEN DOWN**, twice and
independently:

- The fixture's own tar is a checkout of the PRE-FIX tree, so running
  *its* `tools/e2e/scripts/brief.mjs` over the same two roots produces a
  THIRD mover — `worktree (absolute, per lane-protocol rule three)`,
  naming `<main>/.claude/worktrees/nputer-T-179` from the nested
  checkout and `<dir>/nputer-T-179` from the main one. The defect,
  reproduced in a fixture.
- Mutant M1 below restores the defect in the shipped module and reds the
  sweep by name.

**AND THE SWEEP ALONE IS NOT SUFFICIENT, which the sweep itself showed.**
A row that is equally wrong from BOTH checkouts does not move — and the
`create:` line was exactly that, carrying the bare relative
`../nputer-T-NNN` identically from both. So the body also pins the
VALUE: row 4's path and the create command's path must both equal
`path.resolve(<fixture main>, <published spelling>)`, derived in the
body from the fixture's own layout while the producer derives it from
git — two sides sharing no constant for the property under test.

### MEASURED, BEFORE AND AFTER, ON THE LIVE REPOSITORY

Run from the architect's nested worktree, which is the seat that emitted
every wrong brief:

    pre-fix   worktree: /Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-179
    post-fix  worktree: /Users/ujju/Projects/nputer-T-179
    post-fix  create:   git worktree add /Users/ujju/Projects/nputer-T-179 -b task/T-179-<slug> 6e128c8c5068…

The post-fix value is character-for-character the path this lane
actually occupies, and it is identical to the value the same command
emits from the integration checkout and from this lane.

### THE KNOWN VACUITY TRAP, ANSWERED BY MEASUREMENT

`T-178`'s drill found a body satisfied by an unused `import` line. Both
bodies here pin CALLS and VALUES: `mainWorktree` is asserted to return
the string `/Users/x/nputer` out of a five-entry fixture (so the answer
is a CHOICE among five, not the only path to hand back), the bare
refusal is asserted to name `/Users/x/nputer.git` in its reason, and the
sweep drives the real CLI end to end — a fix living in an exported
function nobody called would pass no body here. Seven mutants, seven
kills, below.

### POISON DRILL — 7 mutants, ALL KILLED, at `ecfb736`

Committed first (a restore cannot tell itself from a revert). ONE SIDE
ONLY: every mutant moves the PRODUCER, never an assertion. Each
mutation was READ BACK from `git diff --unified=0` before its suite ran;
each restore names both sides
(`git restore --source=HEAD --staged --worktree -- <path>`) and is
proven by sha256 against the committed blob.

| # | mutant (producer side) | suite exit | killed by |
|---|------------------------|-----------|-----------|
| M1 | `path.resolve(repo.path, …)` → `path.resolve(ctx.root, …)` — THE DEFECT RESTORED | 1 | THE SWEEP |
| M2 | `entries[0]` → `entries[entries.length - 1]` | 1 | ROOT + SWEEP |
| M3 | `if (first.bare)` → `if (false)` | 1 | ROOT |
| M4 | porcelain drops git's `bare` marker | 1 | ROOT |
| M5 | `insideRepository` return inverted | 1 | ROOT + SWEEP |
| M6 | `spelledAbsolutely` → `false` (create left relative) | 1 | THE SWEEP |
| M7 | `--write-fence` back on `ctx.root` | 1 | THE SWEEP |

("ROOT" = `THE REPOSITORY'S ROOT IS DERIVED FROM GIT, and a repository
with no working tree is REFUSED"; "THE SWEEP" = the body named above.)

**RESTORATION PROOFS** — `git show HEAD:<path> | shasum -a 256` against
the working file after every restore, identical on all seven:

    tools/e2e/scripts/dispatch-brief.mjs
      4b0590ac1a72805bbf7ec2462e1a5031eb0d66a82f8d9a681b6ab1cc91dc6799   (M1–M6)
    tools/e2e/scripts/brief.mjs
      4c8421045c6cd1964a56703866d0e08fe04a2ea866f60bc785a319479204898b   (M7)

`git status --porcelain` was empty after the last restore.

### GATES — every exit read UNPIPED, from `tools/e2e/`

Port derived from the card id (`14500 + 179 = 14679`) and `lsof`-read to
ZERO rows immediately before binding. Port 1420 read with
`lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else: nothing listening.

    npm run typecheck      exit 0
    npm run lint:tokens    exit 0   (TOKEN 161 files; CONTROL 1015 tracked text files)
    npm test               exit 0   341 passed, 4.0m

### THE ONE THING THIS LANE CANNOT DO — `docs/CAPABILITIES.md`

`npm run capabilities:check` **exits 1: STALE — committed 27138 bytes, a
fresh generation is 27333 bytes.** That is this lane's two new test
NAMES and nothing else. `docs/CAPABILITIES.md` is OUTSIDE the fence
`[tools/e2e]`, so this lane did not regenerate it. **The integrator runs
`npm run capabilities` from `tools/e2e/` at the checkpoint** — it is a
CI step as of tonight and will red until it does.

### CEREMONY ROW AND WHAT WAS DELIBERATELY NOT DONE

`method/tasks/TASK-FORMAT.md`'s table, row **"S, diff outside shipped
code"**: `touches: [tools/e2e]`, which ARCHITECTURE names *"dev tooling
under no component, `.nputerignore`d out of the map"* — the rule of
thumb is *"docs, method and tooling self-integrate"*, so no verifier and
no separate integrator is owed. **That row also makes the executor its
own integrator, and this lane did NOT take that half**: the dispatching
seat's launch instruction withheld merge, push, main and worktree
removal. Recorded here rather than silently skipped, so the next reader
knows the row was read and the deviation was instructed.
