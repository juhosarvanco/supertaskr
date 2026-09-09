---
id: T-244
title: npx nputer — the dispatch view, the fence writer, the preflight, the gates, the push guard, the arm and the indexer packaged as the CLI (C-02), so a skill, a CI runner and a hand all call one command
feature: F-01
milestone: 4
size: L
priority: 1
status: verifying
suggested_by: "@human ruling (2026-09-03, ADR-021): nputer is a skill, a CLI and a mirror — and ARCHITECTURE lists C-02 as planned because nothing packages the scripts"
blocked_by: []
touches: [tools/e2e/, README.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-008 made the CLI the plumbing and the power/CI path; ADR-021 makes
it the thing the seat skill (T-241) and the interview skill (T-242)
call. Everything it needs exists: brief.mjs's dispatch view, fence
writer and seat lock, the preflight, docs-gate and gate-run, the push
guard, T-239's arm, and nputer-index's `arch`/`drift`/`cycles`/`blast`.
What does not exist is one command a user installs. ARCHITECTURE's
table says so in one word: C-02 planned. **Size L: dispatch needs
@human's approval by the standing rule.**

## Acceptance criteria

- WHEN `npx supertaskr <verb>` runs in a project THE system SHALL dispatch
  to the existing script for that verb with its arguments unchanged —
  no logic moves, no script is rewritten; the package is a front, and
  a test SHALL prove each verb reaches its script by name.
- WHEN a verb is one the skill (T-241/T-242) calls THE package SHALL
  expose it; the verb set is DERIVED from the skills' own command lines
  and CONVENTIONS' command bullet, never restated here.
- WHEN the package is installed in a project that genesis created THE
  method's relative paths SHALL resolve from the project root, and
  the docs-input-gate SHALL see the package as a derived reader of
  docs/ (T-231's account).
- WHEN the package is built THE tree SHALL carry tools/e2e/bin/ (the
  bin entry), tools/e2e/scripts/cli.mjs, tools/e2e/scripts/undo.mjs,
  tools/e2e/scripts/merge.mjs and tools/e2e/tests/cli.spec.ts — the
  card's creation targets, absent at dispatch and inside its fence
  (amended 2026-09-09 by the architect seat: the preflight reads a
  creation target off the criteria, not the notes).
- IF a verb needs a build (the indexer, the parser package) THEN the package
  SHALL say so on first run with the one command that builds it,
  never fail silently.
- **Folded 2026-09-08 (second version sitting, @human: "fold safe undo
  into T-244"):** THE package SHALL expose an `undo <card>` verb that
  reverts the card's merge commit (`git revert -m 1`) after listing every
  later merge that touched the same fence and refusing when one exists
  unless `--force` names it — the records make the revert derivable; the
  verb makes it one command (GSD Core's safe undo, T-245's second pass).
- **Folded 2026-09-08 (version sitting):** THE installer SHALL target
  Claude Code and Codex in v1 (the two forms T-241/T-242/T-246 carry)
  and SHALL be built so a third harness is one adapter entry, never a
  rewrite — more harnesses are v2 (the multi-harness installer the
  skills frameworks ship, VERSIONS.md UNRULED → v2).
- The npm name SHALL be verified free at the ref the card is built
  (rooms/naming.md recorded it free on 2026-08-14; re-derive, never
  quote) — and IF the product is renamed under docs/rooms/naming.md
  THEN this card SHALL follow the name, which is one more reason it
  waits for that word.

## Implementation notes

**Executor, 2026-09-09, lane `task/T-244-npx-supertaskr`, base
`b679f0a0d4b1aca1e6e8599ea8f492410cc1cbb7`.**

### What landed

Five files this card names as creation targets, plus the two documents in
the fence:

- `tools/e2e/bin/supertaskr.mjs` — the bin entry. Unconditional
  execution (the argument `lint-tokens.mjs` and `tauri-boot-check.mjs`
  carry: a `import.meta.url === argv[1]` guard inside the module would
  turn a `node_modules/.bin` shim, which IS a wrapper, into a silent exit
  0). `tools/e2e/package.json` gains `bin` (`supertaskr`), `files`
  (`bin/`, `scripts/`) and one `cli` script.
- `tools/e2e/scripts/cli.mjs` — the verb table (22 verbs), the two roots,
  four derivations and the harness adapters. Side-effect free at import.
- `tools/e2e/scripts/undo.mjs` — the `undo <card>` verb.
- `tools/e2e/scripts/merge.mjs` — the `merge <card>` verb.
- `tools/e2e/tests/cli.spec.ts` — 21 bodies.
- `docs/CONVENTIONS.md` gains one bullet in "Build & test";
  `README.md` gains a "One command" section.

**No script that already existed was changed.** The only edit to an
existing file is `tools/e2e/package.json`'s three added keys. Every verb
reaches its target by SPAWNING it.

### Each criterion

1. **Each verb dispatches to the existing script, arguments unchanged,
   proved by name.** `planFor` is pure and returns `{command, argv, cwd,
   names}`; the spec resolves every target ON DISK (`existsSync` for a
   script, `Cargo.toml` for a cargo verb) and asserts `argv[0]` is that
   file — *"npx supertaskr dispatches every verb to a target this tree
   already carries, resolved on disk"*. A second body drives the whole
   four-code house set plus 101 through a spawn the spec supplies and
   asserts the return is the CHILD'S, unrelabelled. ONE DEPARTURE FROM
   "arguments unchanged", declared: a LEADING POSITIONAL becomes the flag
   the target names (`supertaskr card T-150` reaches `brief.mjs --card
   T-150`), because `brief.mjs` refuses a positional by design. The
   mapping is a declared `positionalFlag` per verb, never a guess, and a
   verb without one passes its arguments through untouched.
2. **The verb set is DERIVED.** The spec reads `brief.mjs`'s own `FLAGS`
   list out of its source and requires a verb to reach each arm a skill
   invokes (`--state`, `--dispatch`, `--card`, `--preflight`,
   `--write-fence`, `--take-seat`, `--dispatch-lane`); it reads
   docs/ARCHITECTURE.md's C-02 line and requires the five verbs there to
   be either fronted or NAMED as unfronted (`ARCHITECTURE_VERBS`); and it
   requires every verb whose `source` cites docs/CONVENTIONS.md to quote
   a command that document really carries, whitespace-normalised, with a
   non-vacuity check. T-241 and T-242 are `status: planned` and ship no
   skill file at this ref, so their "own command lines" are their cards',
   and both require every command they name to be one CONVENTIONS
   already names — which is the set checked here.
3. **Paths resolve from the project root, and the docs gate sees the
   package.** Two roots are computed and never confused: `packageRoot`
   off `import.meta.url`, `projectRoot` by walking up for `docs/` +
   `method/` (or `docs/` beside `.git`), overridable with `--root`. A
   verb whose target takes `--root` is handed the project root — and the
   spec checks every `rootFlag` claim against the target script's OWN
   flag list, which is how `push-check` was corrected from false to true.
   A verb whose target resolves its own root and takes no `--root` is
   REFUSED when the two roots differ, naming both. For the second half:
   `docs-gate.mjs` at `d4aba93` reports `tools/e2e/scripts/cli.mjs ->
   docs/CONVENTIONS.md`, `merge.mjs -> docs/CONVENTIONS.md` and
   `undo.mjs -> docs/tasks`, all three DERIVED readers with `npm test
   from tools/e2e/` as the suite; `unlinkedFiles()` is empty and
   `unaccountedRootAnchors()` is unchanged at its ledgered six. A body
   pins all three.
4. **The tree carries the creation targets.** All five, listed above.
5. **A verb needing a build says so with the one command.**
   `requirementsFor` walks the target's own import graph
   (`bareDependencies`) and its escapes (`packageEscapes`), and asks the
   tree; nothing enumerates which verb needs what. The build command is
   derived from docs/CONVENTIONS.md's own `run from <dir>/:` bullets
   (`conventionCommandsFor`), so a reworded command moves the message.
   The spec proves the refusal with a package fixture lacking
   `node_modules`, the POSITIVE CONTROL being the same verb against the
   real package owing nothing, and proves nothing is spawned.
6. **`undo <card>`.** Derives the card by its own `id:` line, the fence
   through `.claude/hooks/expand-fence.mjs` (the ONE expansion — there is
   deliberately no weaker fallback, because a fallback would make the
   refusal fail OPEN), and the landing merge by TWO agreeing facts: the
   side the merge brought in carries a commit naming the card (the
   executor's step 6 rule) and, as tie-breaker, the merge's own diff
   carries the card file. It lists every later first-parent merge whose
   diff touches the fence and REFUSES (exit 1) while one is unnamed;
   `--force <sha>` NAMES one, and a `--force` naming a commit that is not
   one of them is exit 2, not a licence. A dirty tree refuses before
   anything. Proved against a git fixture with and without a later merge.
7. **The installer.** `HARNESSES` holds Claude Code
   (`.claude/skills/<n>/SKILL.md`) and Codex (`.codex/prompts/<n>.md`,
   T-246's measured form); `installPlan` reads the table and branches on
   no id anywhere. The spec proves the third-harness property by
   EXTENDING the table with a fabricated adapter and running the same
   function: the plan grows by exactly one step and the two that were
   there do not move. `method/skills/` does not exist until T-241 lands,
   so the verb's copy path is unexercised — filed as T-244-s3.
8. **The npm name, re-derived at this ref, never quoted.**
   `npm view supertaskr version` → `E404 Not Found`
   (2026-09-09T00:07:48Z, Mac.lan): the name is FREE. The POSITIVE
   CONTROL that the query can answer otherwise: `npm view react version`
   → `19.2.8`, exit 0. Nothing was published; the proof that the package
   installs is `npm pack` + `npm install <tarball>` into a scratch
   project, run in the spec on every suite run.
9. **The folded room items 18 and 27.** `merge.mjs`'s tail is DERIVED
   from the merge's own staged paths on every run. A merge bringing
   `app/**` or `lib/**` sources plans the reinstall and rebuild in
   CONVENTIONS' fresh-clone ORDER, and the spec asserts POSITION rather
   than membership — every setup step precedes every suite step, and the
   parser's setup precedes the app's. A merge moving
   `docs/architecture/graph.json` plans the dogfood bodies BEFORE the
   stop, and the pins are PRINTED rather than written (T-211: a lane
   never updates the pins). A documentation-only merge plans neither —
   the positive control that the two above are about the paths.

### What the brief got wrong, and what the card's own prose got wrong

- **The brief's ROW 5 lane list is stale, which is expected of a live
  fact.** At `d4aba93` the live lanes are T-153-s3, T-205-s1, T-241,
  T-244 (read 2026-09-09 on Mac.lan): T-219-s6 is gone and T-241 is new
  since dispatch. None touches `tools/e2e/`, so the disjointness the
  brief asserted still holds at my ref.
- **THE CARD'S OWN DISPATCH NOTE AND ITS `touches:` LINE DISAGREE, AND
  THE `touches:` LINE IS WHAT THE GUARD COMPARES.** The note says *"THE
  FENCE IS PATH-GRANULAR ON PURPOSE ... and NOT tools/e2e/scripts/ or
  tools/e2e/tests/ whole"*, while `touches: [tools/e2e/, README.md,
  docs/CONVENTIONS.md]` and the lane manifest at
  `.supertaskr/lane-fence.json` both reserve `tools/e2e` WHOLE. I kept to
  the note's intent — every new file is a new file, and no existing
  script was edited — and record the disagreement rather than resolving
  it silently.
- **The brief's ROW 6 is right and its consequence bit.** `npm install`
  from `app/` fails EACCES in a lane, because the fence guard leaves
  `app/package-lock.json` read-only and `npm install` rewrites it.
  `npm ci` (CI's own documented divergence) is the spelling that works
  from a lane.

### The poison drill — 21-for-21, and one mutant SURVIVED first

Twenty-one mutants, ONE SIDE ONLY (the code under test, never an
assertion, and no literal shared by the two sides), one per property this
lane added. Each was read back with `git diff` before its suite ran —
the diff-line count is recorded per mutant — and each was restored with
`git restore --source=<commit> --staged --worktree` and PROVED by
sha256 against `git show <commit>:<path>`, with the empty per-path diff
kept only as a companion. Driver and log:
`<scratch>/drill-T-244.mjs`, `<scratch>/drill-run-T-244.log`.

First pass at `643d377`: **20 of 21 killed by the body that owns the
property**, restoration 21-for-21. **M05 SURVIVED, and it was a real
gap.** Mutating `ARCHITECTURE_VERBS.init` from its NOT-FRONTED sentence
to `"next"` left the suite GREEN, because the body only asked whether
the disposition named a verb that exists — so a C-02 verb could be
claimed as fronted by SOME OTHER verb. The body now requires the
disposition to equal its own key (the front does not rename a C-02
verb), and M05 re-drilled at `33927b9` is **1-for-1 killed**, restoration
1-for-1. The kill set therefore stands at 21-for-21 across the two
passes.

The twenty that were killed on the first pass: the target dropped from
`planFor`'s argv; the child's exit relabelled to CLEAN; an unknown verb
accepted; a `rootFlag` claim flipped against its script; a verb source
quoting a command docs/CONVENTIONS.md does not carry; the `run from
<dir>/:` marker regex broken; the package-deps requirement suppressed;
`bareDependencies` blinded; `rootMismatch` never refusing;
`findProjectRoot` never walking up; `installPlan` branching on a harness
id; the `bin` entry removed from the manifest (a DATA mutant, where the
property is data); `CONVENTIONS_PATH` pointed outside docs/;
`forceVerdict` accepting a commit it did not list; `laterOnTheFence`
returning nothing; `insideFence` losing its path boundary; the setup
steps landing after the suite step; the dogfood step dropped;
`movesGraph` always true; and `packageEscapes` blinded.

**One disclosure about the drill's own conduct.** Three of these mutants
(M01-M03) were first executed BY ACCIDENT, while the four-suite battery's
e2e leg was still running — the driver executes at import and it was
imported rather than run. Nothing was left behind: all three restored,
and every drilled file was afterwards sha256-compared against `HEAD` and
matched. The battery's e2e leg finished GREEN at 727 bodies with the
mutations having been live only during `docs-input-gate.spec.ts`, whose
bodies do not read the mutated functions, and the whole e2e suite was
re-run to GREEN at the tip afterwards. The figures below are the re-runs,
not that pass.

### For the verifier and the integrator

- **`npm run capabilities:check` is STALE at my tip and that is owed to
  the integrator, not to me.** This lane adds 21 test bodies in a new
  spec file; docs/CAPABILITIES.md is outside every lane's fence since
  T-210, so the regeneration lands in the MERGE commit
  (docs/CONVENTIONS.md's capabilities bullet).
- **The docs gate FIRES on this diff**: `docs/CONVENTIONS.md` is a code
  input, and at `d4aba93` it names `cargo test from app/src-tauri/` and
  `npm test from tools/e2e/`. The card files this lane writes add
  `docs/tasks` readers (the parser suite and the app suite). Re-derive at
  the merge; the pair of commits is not the same pair before the merge
  exists as at it.
- **One red at the full e2e run was mine and is fixed**:
  `brief-flush.spec.ts`'s sweep named `merge.mjs` and `undo.mjs` for
  ending at `process.exit()`. They now set `process.exitCode`, as does
  the bin entry, and the sweep is green.
- **The suites, with the ref each was measured at.** The blessed
  gate-runner at `643d377`: parser GREEN 377 bodies exit 0, app GREEN
  1163 bodies exit 0, rust GREEN 639 bodies over 18 targets exit 0, e2e
  GREEN 727 bodies exit 0. Re-run after the drill's finding landed: e2e
  GREEN 727 bodies exit 0 at `33927b9`. `index --check` at `643d377`:
  CURRENT, exit 0 — GRAPH REGEN's suffix trigger fires (`cli.spec.ts` is
  a `.ts` outside docs/) and the regen is a NO-OP, which is what asking
  the gate proves rather than predicting.
- Three findings are filed as `status: suggested`: **T-244-s1** (the
  fronted scripts import `../../../.claude/hooks/*`, so an installed copy
  cannot load them — the front refuses by name instead of crashing, but
  the cause is outside this fence), **T-244-s2** (the CLI ships inside
  the private `@supertaskr/e2e` package because that is where the fence
  put it; the name `supertaskr` is free), **T-244-s3** (the installer has
  nothing to install until `method/skills/` exists).

## Fix pass (executor, 2026-09-09, after the REJECTED verdict at `f809cd9`)

Every finding was inside the fence, so every one is fixed in place. The
verdict's own reproductions were re-run against the fix.

- **R1 — `undo` failed OPEN on an empty fence expansion.** `expandFence`
  now carries the expander's whole answer — `paths`, `unusable`,
  `unfenceable` — and `main` REFUSES (exit 3) when `paths` is empty,
  naming the tokens that would not resolve. Re-derived at my ref: of
  **253** done cards carrying a `touches:` line, **99** expand to an
  empty fence and all 99 now refuse; **154** expand to paths and are
  unaffected. The verdict's own reproduction, re-run:
  `undo T-018 … --dry-run` → exit **3**, *"expands to NO paths (the ONE
  expansion could not resolve app-shell) … Nothing was reverted."*
- **R2 — the id was matched as an unbounded substring.** `mentionsCard`
  matches on a token boundary, so `"Merge T-244-s3"` no longer answers to
  `T-244`. Unit-checked in both directions plus an end-to-end body where
  a `T-9` card must not select `Merge T-900`'s merge.
- **R3 — the scanned ref and the mutated ref were uncoupled.** `undo`
  now requires HEAD to be `refs/heads/<the scanned branch>` and refuses
  otherwise, naming both. Re-run from this lane: exit **3**, *"this scans
  main and `git revert` rewrites HEAD, and HEAD is
  refs/heads/task/T-244-npx-supertaskr"*. A body covers the detached case
  and the other-branch case, asserting HEAD did not move.
- **R4 — `merge`'s clean-tree precondition could not fail.** The step
  declares `assert: "empty-output"` and the runner grades it on its
  OUTPUT, because `git status --porcelain` exits 0 on a filthy tree. A
  body drives a dirty fixture (stopped, nothing staged) with the clean
  tree as its positive control.
- **VM1 — the passthrough had no body.** One now asserts the tail of the
  child's argv IS the caller's arguments, over six literal arguments
  including `--`, an empty string and `;id`, both through `planFor` and
  through `main` with the spawn observed.
- **VM2 — the executed revert had no body, and the printed string was a
  second spelling.** The printed command is now built FROM the argv that
  is spawned, and a body runs `undo` WITHOUT `--dry-run` against a
  fixture and asserts the pre-lane tree is back — which is what `-m 1`
  means and what `-m 2` would break.
- **R6 — room item 27's second half was prose.** `graphPinLine` is a
  pure function of the staged graph and a date, producing the house's
  `RECONCILED AT THE <id> MERGE (<date>, integrator)` line with the
  graph's own file, symbol and edge counts; the dogfood step carries
  `action: "graph-pins"` and the runner prints it. A body decides the
  VALUE, with a second graph proving the numbers move.
- **AC-2's under-exposure** — `node tools/method-evals/run.mjs` is now
  the `evals` verb (a new `project` target kind, resolved against the
  PROJECT root), and the body that checks coverage is DERIVED: it reads
  T-241's and T-242's own cards for their backticked command lines and
  requires an exact-membership match, never a substring.
- **The smaller ones:** the `merge` verb now WRITES the done stamp
  (`stampDone`, filling only an EMPTY `built_by:`/`verified_by:`, with
  `--built-by`/`--verified-by` required on a real run) and stages what it
  regenerates (`git add docs/CAPABILITIES.md`, `git add docs/architecture`);
  an absent project docs-gate is named as a step instead of becoming a
  stack trace; a conflicted revert now names `git revert --abort`; and
  the installer REFUSES to clobber a destination that differs, `--force`
  being the named choice.
- **T-244-s4's shape** (a ref reaching git with no `--`): the `--`
  separator is added to every `git log`/`git diff` this lane spawns, and
  R3's branch check makes the `--branch` vector unreachable by
  construction. Re-run of the verifier's own probe:
  `--branch '--output=/tmp/probe-T-244.txt'` → exit **3**, and the file
  was **NOT created**. The card stands; its disposition is triage's.

### The drill at the fix pass — 31-for-31

Ten mutants added to the twenty-one, including the verifier's own two
(VM1, VM2) and one per finding. **31-for-31 killed by the body that owns
the property; restoration 31-for-31 sha256-proved.** Two needed a second
aim and both are recorded rather than quietly re-run: VM10's anchor
matched nothing on the first attempt (NOT-APPLIED, never counted as a
kill), and **VM13 SURVIVED first** — repointing the `evals` verb at
`gate-run.mjs` passed a `toContain("run.mjs")` check, because one
script's name is inside another's. That is the verifier's R2 class in my
own spec, and the body now tests exact membership.

### The suites at the fix-pass tip `4aa3943`

parser GREEN 377 · app GREEN 1163 · rust GREEN 639 over 18 targets · e2e
GREEN **737** (up from 727: ten new bodies), every one exit 0, read off
the blessed gate-runner's `gate-verdict` lines. One e2e failure was
observed in a gate-run temp directory during this window and it is NOT
this lane's run — the concurrent bench's, whose live-board arm reported
*"BOARD MOVED"* while this lane was committing. This lane's own e2e leg
carries zero failures.

## Verdicts

## Folded 2026-09-09 from docs/rooms/loop-efficiency.md (items 18 and 27)

The `merge` verb is the integrator's ritual as one command, and the seat's
scratch script merge-lane.sh is its prototype (read it: precondition,
branch moved to the verdict commit, merge --no-ff --no-commit, the done
stamp by the card's `id:` line, census regen when a spec name moved, the
graph regen with the dogfood pins re-derived, the docs gate). Two rules
the room measured belong in it as criteria:

- WHEN a merge brings in sources under app/ or lib/ THE verb SHALL
  reinstall and rebuild in CONVENTIONS' order BEFORE any suite runs
  (the integrator ran the battery on a stale bundle at T-018-s5; the
  dogfood pins redded at T-264's merge until `npm ci` ran in all three
  packages) — derived from the merge's paths, never remembered.
- WHEN a merge moves docs/architecture/graph.json THE verb SHALL run
  the app's dogfood bodies before the commit and re-derive the pins
  with the dated line the house pattern uses (main was red on the app
  suite for forty minutes at T-112-s6's merge).

## Dispatch note (2026-09-09, the architect seat, at @human's night approval for L cards that need no decision of theirs)

The name is ruled (ADR-022: `supertaskr`; npm free at the 2026-09-08
sweep in rooms/naming.md — re-derive at your ref), so the last
criterion's condition is met and the package is `supertaskr`. THE FENCE
IS PATH-GRANULAR ON PURPOSE: the card says the package is a FRONT and
no script is rewritten, so the fence names the files a front creates
(a bin entry, cli.mjs, the `undo` and `merge` verbs as new scripts — the
seat's merge-lane.sh in the scratchpad is the merge verb's prototype,
read it — the package files, one spec, README and CONVENTIONS' CLI
bullet) and NOT tools/e2e/scripts/ or tools/e2e/tests/ whole, so sibling
lanes on brief.mjs, docs-gate.mjs and the other specs can run beside it.
If a verb genuinely needs an existing script changed, that is an ASK
through the ask file, never a widening from inside. Publishing to npm is
@human's (T-266); the card proves `npx supertaskr` against a local
`npm pack` tarball or `npm link`, never a publish.
