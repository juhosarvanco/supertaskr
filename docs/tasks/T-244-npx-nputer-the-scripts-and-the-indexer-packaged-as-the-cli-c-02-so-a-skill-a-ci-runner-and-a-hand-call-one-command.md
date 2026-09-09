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


### Verdict 2026-09-09 — REJECTED — claude-opus-5@subagent (verifier, phase 2 of the blind two-phase bench)

**Tip** `f809cd90e096128a71ed206a8a978de6de93b725` · **base**
`b679f0a0d4b1aca1e6e8599ea8f492410cc1cbb7` · bench worktree
`nputer-V-T-244`, detached, `SUPERTASKR_E2E_PORT=25244`, headless.

**The two sealed inputs, verified before anything else was opened:**
`sha256:8d174ad1cbb95c0f9ffe0975ccd184c5885e245c4255d35e70cac2148725b511`
(`attack-set-T-244.md` — phase 1, written with no tools) and
`sha256:439a1ce5669f54c8e83bdd1f3d4c379c73265e96f9aca3c30dd5516e2573afc0`
(`ground-T-244.md` — G1–G20, taken by the dispatcher at the base). Both
matched.

**The short of it.** The FRONT is good work and I found nothing wrong
with it: no logic moved, arguments pass through verbatim, exit codes are
the child's, the targets are resolved on disk, the requirements are
derived, the docs-reader account is real, the harness table takes a third
entry without a rewrite, and the npm name is free. The security sweep is
clean end to end. **The two verbs that are NOT fronts — `undo` and
`merge`, the ones the card folded in because the record made them
derivable — carry four reproducible defects**, one of them live on 99 of
the 253 done cards on this board, all four in the part of the command
whose entire job is to make a destructive git operation safe. That is
what this verdict is about.

### The frame I actually had

Phase 1 was written by a different spawn with **no tools at all** (the
attack set's own footer records `tool calls made: 0`), because this
harness cannot deny tools to a seat that has them — so the blindness was
kept by INSTRUCTION rather than guaranteed by the spawn, and a later
reader cannot tell those apart from the outside. I say so rather than
claim the stronger thing.

**My brief carried executor-derived specifics and that broke phase 1
above the line**: it names the executor's own commit subjects (read to me
by the dispatcher from the head of the executor's report), the file names
it created, its mutant count and its suite figures. I therefore
re-derived every number in this verdict from the tree at my own ref and
cite the ref beside each. I did not open `report-T-244.md` until after I
had read the whole diff and written my own findings; when I did, it
claims every criterion MET, which is the disagreement this verdict is
about.

One ground truth did not hold. G11 records the `merge` verb's prototype,
the seat's UNTRACKED scratch `merge-lane.sh`, at
`sha256:57172398dbfbddb01b240457eda2d05d83439ff0122da549f5dfe207f98de3d3`
(3659 bytes). The file on disk at verification time is
`sha256:60c0937b7f9de9f17f66f59a9da676948afe0596be41cfaee6d777f3e0f73914`
(3954 bytes, mtime 2026-09-09 02:56, inside the executor's working
window). **The prototype moved after the ground truth sealed it**, so the
"matches its prototype" comparison below is against a mutable untracked
file rather than a record, and I weight it accordingly: I judge the merge
verb against the card's two EARS-shaped folded rules, which are binding,
and report the prototype comparison as secondary.

### The suites, at my own tip

Run with the blessed gate-runner from the bench root at
`f809cd90e096128a71ed206a8a978de6de93b725`, after `npm ci` in
lib/parser, app and tools/e2e and `npm run build` in lib/parser and app
(all exit 0):

| suite | verdict | bodies | exit |
|---|---|---|---|
| parser | GREEN | 377 | 0 |
| app | GREEN | 1163 | 0 |
| rust | GREEN | 639 over 18 targets | 0 |
| e2e | GREEN | 727 | 0 |

Census at the tip: **698** `test("` bodies across **39** spec files,
against G13's **677** across **38** at the base — +21 bodies in one new
file, no decrease, no `.only`, no `.skip`, no `.fixme` anywhere in
`tools/e2e/tests/`. `npm ci` in tools/e2e exits 0 at the tip, so no
dependency was added without its lockfile.

### The security sweep (3b), in full — CLEAN, and nothing here is a rejection

Every item measured, none confirmed.

1. **Shell injection / argument passthrough.** No `execSync`, no `exec`,
   no `spawn(..., {shell:true})` on any user value. The single
   `shell: true` in the diff is `onPath()` probing the literal `"cargo"`.
   Measured with an argv-echo shim over six literal arguments
   (`--`, `--force`, `a b`, the empty string, `-x`, `--y=$(echo pwned)`,
   `;id`): every verb's child received them **verbatim, in order, with no
   shell expansion**. `supertaskr 'ls; touch /tmp/pwned'` → exit 2,
   nothing spawned. `undo 'T-9; touch /tmp/pwned'` and `undo '$(...)'` →
   exit 3, refused on the id shape. No probe file was ever created.
2. **Path resolution.** Two roots, never confused; a card id never
   becomes a path segment; `undo ../../x` refuses on the card lookup.
3. **A bin that executes outside its package.** Every spawn target is
   `path.join(packageRoot, "scripts", …)` off `import.meta.url` — never
   the caller's cwd, never a `node_modules/.bin` shadow. Verified by
   installing the tarball into a scratch project and reading the resolved
   argv.
4. **`--force` naming.** Measured in a synthetic repository: bare
   `--force` → exit 2; `--force <unrelated sha>` → exit 2, named and
   refused; two blockers with one `--force` → still refused, naming the
   unnamed one; both named → proceeds. One name cannot license two.
5. **A publish path.** None. No `npm publish`, no `prepublishOnly`, no
   `prepack`, no `publishConfig`, no publish verb, no workflow added.
   `"private": true` still stands on the package.
6. **Install-time execution.** No `preinstall`, `postinstall` or
   `prepare` in `tools/e2e/package.json` — the diff adds `bin`, `files`
   and one `cli` script and nothing else.
7. **Writes to the user's harness config.** The installer is
   **project-local**: run under `HOME=$(mktemp -d)` it wrote four files
   under the PROJECT's `.claude/skills/` and `.codex/prompts/` and
   **nothing at all under `$HOME`**, and touched no `settings.json`, no
   hooks list and no permission allowlist. It is idempotent (two runs,
   identical sha256 set).
8. **`git push`.** Not present anywhere in the four new files.
9. **Secrets.** None. No token, no `.npmrc`, no `process.env` logging.
10. **Dependencies.** None added.
11. **The README before the name is reserved.** The "One command"
    section leads with `npx supertaskr <verb>` but qualifies it in the
    same section — *the package is not published, the registry name is
    @human's to claim* — and gives the real spelling
    (`node tools/e2e/bin/supertaskr.mjs --help`) as the thing to run.
    Not a finding.

### The criteria, one by one

**AC-1 — the front, arguments unchanged, each verb proved by name.
MET IN THE TREE, UNAIMED IN THE SUITE.** The front really is a front:
`brief.mjs`, `docs-gate.mjs` and `gate-run.mjs` do not appear in
`git diff b679f0a..f809cd9` at all, so removed lines in them are zero and
no logic moved. Every verb spawns; the child's status is returned
unrelabelled; passthrough is verbatim (measured above). Two departures
beyond the one the notes declare: `--root` anywhere is consumed by the
front, and `--help` is intercepted rather than forwarded. Both are
documented in `usageText`, so I record them rather than fault them.
**What has no body is "arguments unchanged" itself** — see MUTANT VM1.

**AC-2 — the verb set DERIVED. NOT MET.** Over-exposure is guarded: every
verb whose `source` cites docs/CONVENTIONS.md must quote a command that
document really carries, with a non-vacuity check. Under-exposure is not.
T-241's card names two command lines; `brief.mjs --dispatch` is fronted
by `next`, and **`node tools/method-evals/run.mjs` is not fronted at
all** — though the file exists in this tree, docs/CONVENTIONS.md gives it
its own section headed *RUN IT — from the repo root, and this is THE ONE
SPELLING*, and it carries the same four house exit codes and the same
zero-dependency property as `tokens`. The seven `brief.mjs` arms the spec
requires are a **hardcoded list inside the spec**, not a derivation: a
command added to CONVENTIONS' bullets obliges no verb, and nothing reds.

**AC-3 — paths from the project root; the docs gate sees the package.
SECOND HALF MET AND MEASURED; FIRST HALF MET AS A MECHANISM ONLY.**
`docsReaders()` at my ref reports `tools/e2e/scripts/cli.mjs -> docs/CONVENTIONS.md`,
`merge.mjs -> docs/CONVENTIONS.md` and `undo.mjs -> docs/tasks`, all
three derived, all three owing `npm test` from `tools/e2e` — exactly the
account T-231 asks for, and a body pins all three. The root walk and the
`--root` handoff work. But I packed the tarball, installed it into a
scratch project that is not this repository, and ran **all 22 verbs**:
**22 of 22 are unusable** — 21 refuse (exit 3), and `merge` reaches its
script only to demand its flags. Every refusal is named and none is a
stack trace, which is the work the executor did; the criterion's promise
that an installed package resolves the method's paths *in a project
genesis created* is nonetheless not delivered. Honestly filed as
**T-244-s1**.

**AC-4 — the creation targets. MET.** All five present, all absent at the
base (G5 records 0 hits), all inside the fence. `git diff --name-only`
is a strict subset of `tools/e2e/**`, `README.md`, `docs/CONVENTIONS.md`
and `docs/tasks/T-244*.md`.

**AC-5 — a verb needing a build says so. MET.** `requirementsFor` derives
from the target's own import graph and the tree; the command comes from
CONVENTIONS' own `run from <dir>/:` bullets, so a rewording moves the
message; the refusal is exit 3 on stderr with nothing spawned; the body
carries a real positive control (the same verb against the installed
package owes nothing).

**AC-6 — `undo <card>`. NOT MET. Three reproducible defects, and the
executed revert has no body at all.**

**AC-7 — the installer. MET, with one correction.** Two harnesses, the
third-harness property proved by extending the table with a fabricated
adapter and running the same function. Measured under a sandboxed HOME:
correct destinations, idempotent, nothing written to `$HOME`, no harness
config touched. **The copy silently clobbers a hand-edited destination
with no backup and no warning**, and the copy path has no body at all
(T-244-s3 says why).

**AC-8 — the npm name, re-derived. MET.** At my ref,
2026-09-09T01:05:46Z, against `https://registry.npmjs.org/`:
`npm view supertaskr version` → `E404 Not Found`. The name is FREE.
POSITIVE CONTROL that the query answers otherwise: `npm view react
version` → `19.2.8`. Nothing was published; nothing in the diff can
publish.

**AC-9/10/11 — the `merge` verb. PARTIALLY MET.** Room item 18 is met and
well aimed. Room item 27 is half met. And the prototype's step 0 is
present in name only.

### The failures, each reproducible

### R1 — `undo` fails OPEN when a card's fence expands to nothing, on 99 of the 253 done cards on this board

`undo.mjs` refuses when the card declares no `touches:` **tokens**, and
never asks whether the EXPANSION produced any **paths**. When it produces
none, `laterOnTheFence` compares every later merge against an empty
domain, matches nothing, prints `0 later merge(s) on this fence`, and
runs `git revert -m 1` on a merge from arbitrarily far back — with the
safety scan the whole verb exists for having measured nothing.

Measured against this repository's own history, from the bench:

    $ node tools/e2e/scripts/undo.mjs T-018 --root <bench> --branch main --dry-run
    undo T-018
      card:   docs/tasks/T-018-watcher-truthfulness.md
      fence:
      merge:  b2d4660b38aa  Merge T-018: watcher truth — root sentinel re-arm, …
      since:  0 later merge(s) on this fence
      --dry-run, nothing was run. The command is:
        git -C <bench> revert -m 1 --no-edit b2d4660b38aadc3d4fab1d72fbf0ba595a64f8bf
    exit=0

`T-018`'s `touches:` is `[app-shell]`, and the ONE expansion answers

    {"paths":[],"excluded":[],"unusable":["app-shell"],"unfenceable":["docs/tasks"]}

— it reports the token as `unusable`, and `expandFence()` in `undo.mjs`
reads only `paths` and discards `unusable` and `unfenceable`. The
information needed to refuse is in the protocol and is thrown away.

**Scale, derived at my ref**: of the 253 done cards carrying a `touches:`
line, **99 expand to an empty fence** (every slug-era card: `app-shell`,
`lib-parser`, `app-board`, `app-map`, `crate-index`, …). For all 99,
`supertaskr undo <card>` reports a clear fence and proceeds.

This is the failure the module's own header names as the one it exists
against — *"a weaker fence read would make the refusal fail OPEN"*. The
read is not weaker; its EMPTY answer is being treated as *nothing landed*
instead of *I could not derive a fence*.

**The fix has to distinguish the two**, and the expander already hands
over what is needed: refuse (exit 3) when `paths` is empty while
`unusable` is not, naming the tokens that would not expand.

### R2 — `undo` finds the landing merge by an unbounded substring, so a card can revert another card's merge

`landingMerge` selects merges whose merged-in side carries a commit
subject where `String.includes(id)` is true. No token boundary. With 320
strict-prefix id pairs on this board (`T-018` ⊂ `T-018-s5`, `T-112` ⊂
`T-112-s6`, …), the id match is not the id.

Where two or more merges match, the verb refuses — that half is
fail-safe, and I confirmed it: `undo T-112` names six merges, one of them
`Merge T-163`, which qualified only because its subject mentions T-112,
and exits 3. **Where exactly one matches, it proceeds on the wrong one.**
Reproduced in a synthetic repository (`git init -b main`, three lanes,
merges `Merge T-244`, `Merge T-244-s3`, `Merge T-900`), adding a card
`T-9` that was never merged:

    $ node tools/e2e/scripts/undo.mjs T-9 --root <syn> --dry-run
    undo T-9
      card:   docs/tasks/T-9-a-card.md
      merge:  7aecad4a77d0  Merge T-900          ← another card's merge
      since:  0 later merge(s) on this fence
    exit=0

No live instance of that exact shape exists on the board today (no
not-done parent currently has a done child), so this is latent rather
than firing — but it is one merged suggestion card away, and the
consequence is a revert of somebody else's lane.

### R3 — `undo` scans one ref and mutates another: on a detached HEAD it reverts, having analysed `main`

The later-merge scan runs against `--branch` (default `main`).
`git revert` runs against **HEAD**. Nothing checks that they are the same
history. The dirty-tree precondition is real and correct — I confirmed
unstaged and staged changes both refuse with exit 3 and zero mutation —
but the ref check is absent.

In the synthetic repository, detached one commit back from `main`:

    $ git checkout --detach HEAD~1        # 7aecad4, detached
    $ node tools/e2e/scripts/undo.mjs T-244-s3 --root <syn>      # no --dry-run
    [detached HEAD 42cf976] Revert "Merge T-244-s3"
     2 files changed, 1 insertion(+), 2 deletions(-)
      reverted 2a38d7fb3630 with: git … revert -m 1 --no-edit 2a38d7…
    exit=0

HEAD moved. The attack set asked for a refusal with zero mutation here;
the command committed. The same applies on a lane branch.

### R4 — `merge`'s clean-tree precondition cannot fail

`preludePlan`'s first step is titled *a clean tree on `main`* and its
stated `why` is *"the prototype's step 0: a merge onto a dirty tree
cannot be told from the dirt"*. Its `run` is
`git -C <root> status --porcelain`, and `runStep` grades the step by
`r.status`. **`git status --porcelain` exits 0 whether the tree is clean
or filthy**, so the step always passes. The prototype it is derived from
does the comparison the step's title claims — `[ -z "$(git status
--porcelain | grep -v …)" ] || exit 1` — and that comparison did not
survive the translation.

Measured in a scratch repository:

    $ git status --porcelain ;  echo exit=$?
     M a
    exit=0

and end to end, with a deliberately dirty tree:

    tree before:  M a
    [precondition] a clean tree on main
    [precondition] 2c6f11ef71fb exists and descends from task/T-900-s
    [git] move task/T-900-s to 2c6f11ef71fb
    [git] git merge --no-ff --no-commit task/T-900-s
    Automatic merge went well; stopped before committing as requested
      the merge stages 1 path(s); the tail is derived from them.
    exit=0
    tree after:   M a ; A  b        ← the merge is staged ON TOP of the dirt

The second precondition (`merge-base --is-ancestor`) is real and does
fail correctly, so this is one step, not the pattern.

### R5 — the two properties this drill did not aim at, proved by mutants

The lane's own 21-mutant drill is genuine work and its sites are real,
but none of the 21 touches the passthrough or the executed revert. Two
mutants of mine, each read from `git diff` and each restored and proved
byte-identical to HEAD by sha256:

**VM1 — the front stops passing the caller's arguments to the child.**
Site `planFor`, one line, landing read from `git diff` (`1 1
tools/e2e/scripts/cli.mjs`):

    -    argv: [file, ...entry.target.args, ...rootArgs, ...rest],
    +    argv: [file, ...entry.target.args, ...rootArgs],

**VM2 — the executed revert takes the wrong parent.** Site the spawned
argv in `undo.mjs`, which is a SEPARATE spelling from the string the
dry-run prints (`1 1 tools/e2e/scripts/undo.mjs`):

    -  const reverted = git(root, ["revert", "-m", "1", "--no-edit", landing.sha]);
    +  const reverted = git(root, ["revert", "-m", "2", "--no-edit", landing.sha]);

Both live in the tree at once — confirmed by `git diff --numstat` while
the suite was reading it — and the FULL e2e suite run over them:

    gate-verdict suite=e2e exit=0 bodies=727 targets=1
      ref=f809cd90e096128a71ed206a8a978de6de93b725 verdict=GREEN reason=ok

**BOTH SURVIVED. 727 bodies, exit 0 — the same figure as the clean run.**
Restored and proved: `cli.mjs` sha256 `fc8084f1b987863e…`, `undo.mjs`
`8dcd3ee63ef63d33…`, each equal to `git show HEAD:<path>`, worktree
clean.

What each survival means:

- **VM1** — the criterion's own words are *"dispatch to the existing
  script for that verb **with its arguments unchanged**"*. A front that
  passes NO arguments at all satisfies every body in this suite: the
  by-name body calls `planFor` with `args: []`, and the exit-code body
  asserts only that the spawned argv contains `gate-run.mjs`. The
  passthrough IS correct in the tree — I measured six literal arguments
  arriving verbatim — but nothing holds it there.
- **VM2** — the two `undo` bodies that run end to end both pass
  `--dry-run`, so **no body has ever executed the revert**. What body 15
  asserts is `toContain("revert -m 1 --no-edit")` against the
  `command` STRING, and that string is built independently of the argv
  that is actually spawned. The mainline, the revert's exit code, its
  output and the conflicted path are all unmeasured. This is the
  attack set's M10 exactly, and its note applies: *if the exit-code-only
  body is the only body, AC-6 is unaimed.*

**VM3 / VM4 / VM5, the controls that show the suite CAN red at these
sites** — each landed, each killed by exactly one body, each restored and
sha256-proved:

| mutant | site | kill set |
|---|---|---|
| VM3 | `planFor`'s target repointed at `not-<file>` | *dispatches every verb to a target this tree already carries, resolved on disk* (1 body) |
| VM4 | data: `scripts/` dropped from `files` | *runs out of a packed tarball installed into a project that is not this repository* (1 body) |
| VM5 | the setup steps moved after the suite steps | *a merge bringing app or lib sources reinstalls and rebuilds BEFORE any suite step* (1 body) |

No kill set contains another, so the dispatch property, the packaging
property and the merge-order property are each decided by their own
arrangement — the containment pairs the attack set asked for (M1/M5 and
M11/M12) hold.

### R6 — room item 27's second half is prose, and the body asserts the prose

The criterion is that a graph-moving merge *"SHALL run the app's dogfood
bodies before the commit **and re-derive the pins with the dated line the
house pattern uses**"*. The first half is built and aimed (VM5's
neighbour body). The second half is not built: the `dogfood` step's only
action is

    npx vitest run test/architecture-dogfood.test.ts test/map-dogfood-render.test.tsx

Nothing re-derives a pin, prints a pin, or prints a dated line — while
`merge.mjs`'s header says *"prints what moved and prints the dated line
ready to be written by the seat"*, the step's title says *"then
re-derive the pins"*, and its `why` says *"print what moved and the dated
line"*. The body that is supposed to hold this reads

    expect(plan[dogfood]?.why, "and the pins are re-derived, never rewritten")
      .toContain("never rewrite a pin");

which asserts the comment, not the behaviour. (The zero-match hazard the
attack set worried about is not one: I measured `npx vitest run
<nonexistent>` at exit 1, so a dogfood step that matched nothing would
stop the verb.)

### Smaller, and named for the same pass

- **AC-2 under-exposure.** `node tools/method-evals/run.mjs` — named by
  T-241's card as a command the seat skill must run, given its own
  *THE ONE SPELLING* section in docs/CONVENTIONS.md, carrying the same
  four house exit codes — is not a verb. Adding it is one table entry;
  making the criterion's word *DERIVED* true is a body that reads the
  skills' cards rather than the seven `brief.mjs` arms typed into the
  spec today.
- **`merge` does not perform the prototype's step 5.** The `stamp` step
  has `run: null` and prints *(no command — this step is the seat's own
  work)*. Honest, but the folded prose says the verb carries *the done
  stamp by the card's `id:` line*; the card IS resolved by its `id:`
  line, so only the write is missing.
- **`merge` does not stage what it regenerates.** The prototype's steps 7
  and 8 `git add docs/CAPABILITIES.md` and `git add docs/architecture`
  after regenerating them; the verb regenerates and leaves them unstaged,
  so a seat that trusts *the merge is staged* commits without them.
- **The installer clobbers.** A hand-edited
  `.claude/skills/<n>/SKILL.md` is overwritten with no backup and no
  warning; the output says *4 file(s) written* either way. Measured under
  `HOME=$(mktemp -d)`.
- **A conflicted revert is reported without its way out.** `undo` returns
  exit 1 naming the git error, but does not say `git revert --abort`, and
  leaves `REVERT_HEAD` standing.

### What I did not judge

- **The rename (T-264/T-265) and the repo-wide spelling.** Not this card.
- **Publishing.** T-266 is @human's; I judged only that no publish path
  exists, and none does.
- **The real `~/.claude` and `~/.codex`.** The installer was exercised
  only under `HOME=$(mktemp -d)`, where it proved to be project-local
  and to write nothing under `$HOME` at all.
- **Cross-platform behaviour.** darwin only.
- **The `merge` verb's fidelity to `merge-lane.sh` as a RECORD** — the
  prototype is untracked and its digest moved after the ground truth
  sealed it (see the frame). I compared against the card's binding rules
  and treated the prototype as evidence.
- **Wall-clock.** Reported, never failed on.
- **Anything ROADMAP would answer**, and the human approvals in the
  dispatch note, which I take as given.

### One `status: suggested` card filed

**T-244-s4** — `undo` and `merge` hand operator-supplied refs to git with
no `--` separator, so a value shaped like a git option is parsed as one.
This is NOT a security finding and I say so on the card: every value
comes from the operator's own command line, there is no shell anywhere in
these scripts, and all my injection probes were refused or passed through
verbatim. It is filed because the shape stops being harmless the moment
either verb is driven by the seat skill or a CI step rather than a hand.

**The control I propose on that card is mine to check, and I checked
it.** The body I ask for is: pass `--branch '--output=<tmpfile>'` to a
fixture repository and require a refusal with the file NOT created. Run
today, against the implementation that LACKS the property:

    $ node tools/e2e/scripts/undo.mjs T-244-s3 --root <syn> \
        --branch '--output=/tmp/probe.txt' --dry-run
    undo T-244-s3: CANNOT RUN — no first-parent merge … names T-244-s3
    exit=3
    /tmp/probe.txt: created, 162 bytes, containing the merge log

The file was written, so the control CAN fail and its green would mean
something. **And the arrangement matters**: run in a bare `mktemp -d` the
same probe passes for the wrong reason — `undo` refuses at the missing
`docs/tasks` before `git log` is ever reached, and the file is never
created. A fixture with a real board and a working expander is what
separates the control from a tautology, and that is the shape the card
asks for.

### For the integrator

**Do not merge this ref.** If the lane is re-dispatched, R1 is the one
that matters most: it is live on 99 of 253 done cards today, it turns a
destructive `git revert` loose with a safety check that measured nothing,
and the expander already returns the `unusable` list needed to refuse.
R4 is one comparison. R2 and R3 are each a guard. R5 is two bodies.

What is sound and should survive a second pass: the front itself (no
logic moved, verbatim passthrough, exit codes unrelabelled, targets
resolved on disk), the requirements derivation and its message, the docs
reader account, the harness adapter table and its third-harness proof,
room item 18's order, and the npm name. The three suggestion cards the
lane filed (T-244-s1, T-244-s2, T-244-s3) are accurate and should be kept
regardless of what happens to the card.

`npm run capabilities:check` is STALE at this tip and that is correctly
the integrator's, at the merge — docs/CAPABILITIES.md is outside every
lane's fence.

### Verdict 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5[1m]@subagent (verifier, phase 2, SECOND pass over the fix)

**Tip** `870c14ef0c4a380a7791f9300fbede35e2d90134` · **base**
`b679f0a0d4b1aca1e6e8599ea8f492410cc1cbb7` · rejected tip
`f809cd90e096128a71ed206a8a978de6de93b725` · bench worktree
`nputer-V-T-244`, detached, `SUPERTASKR_E2E_PORT=25244`, headless.

**The two sealed inputs, verified before anything else was opened:**
`sha256:8d174ad1cbb95c0f9ffe0975ccd184c5885e245c4255d35e70cac2148725b511`
(`attack-set-T-244.md`) and
`sha256:439a1ce5669f54c8e83bdd1f3d4c379c73265e96f9aca3c30dd5516e2573afc0`
(`ground-T-244.md`). Both matched, unchanged from the first pass.

**The first verdict is commit
`a6d5c1d3ce4767b36c232f6a37c0bb72216fc446`, and it is NOT an ancestor of
this tip.** The fix pass branched from `f809cd9` without it, so at
`870c14e` the card's `## Verdicts` section is EMPTY and
`docs/tasks/T-244-s4-…-end-of-options-separator.md` is not in the tree at
all. **This commit restores both from `a6d5c1d`, byte-for-byte, and
appends this second entry after the first — the first is not rewritten.**
Verified by blob: the restored T-244-s4 card equals
`git show a6d5c1d:<path>`, and the restored verdict section is the exact
25,795-byte span between `## Verdicts` and the folded-room heading at
`a6d5c1d`.

### The frame I actually had

**Phase 1 was tool-less BY INSTRUCTION, not by construction** — this
harness cannot deny tools to a spawn that has them, and the attack set's
own footer records `tool calls made: 0`. I report the weaker honest
thing.

**My brief for this pass named executor-derived specifics and so broke
phase 1 above the line, again**: it gave me the fix pass's three commit
subjects and the string "31-for-31". Both are executor CLAIMS and I
re-derived them: the commit subjects I read from `git log` myself, and
the drill claim I re-derived with fourteen mutants of my own (below),
which is where two of this verdict's corrections come from. I also had a
previous second-pass spawn's scratch files in the scratchpad
(`V2-T-244-*`); I read none of them as measurement and re-derived every
figure here.

I read `report-T-244.md`'s FIX PASS section and the card's own fix notes
only AFTER reading the whole fix diff and running my own reproductions.

**A ground truth that still does not hold**: G11's digest for the
untracked prototype `merge-lane.sh` did not match at the first pass and
does not now; as the first pass did, I judge `merge` against the card's
two binding folded rules and treat the prototype as evidence.

### The suites, at the reviewed tip

Run with the blessed gate-runner from the bench root at
`870c14ef0c4a380a7791f9300fbede35e2d90134`. The bench's `npm ci` in
lib/parser, app and tools/e2e and `npm run build` in lib/parser and app
were already standing from the first pass at the same package manifests
(`tools/e2e/package.json` is byte-identical since `f809cd9`, so no
dependency moved).

| suite | verdict | bodies | targets | exit |
|---|---|---|---|---|
| parser | GREEN | 377 | 1 | 0 |
| app | GREEN | 1163 | 1 | 0 |
| rust | GREEN | 639 | 18 | 0 |
| e2e | GREEN | 737 | 1 | 0 |

Census at my ref: **708** `test("` bodies across **39** spec files (698
across 39 at `f809cd9` — the ten new bodies are all in `cli.spec.ts`,
21 → 31), no `.only`, no `.skip`, no `.fixme` anywhere in
`tools/e2e/tests/`. The executor's claim of **737** e2e bodies at
`4aa3943` is independently re-derived at my ref and CONFIRMED — 737 bodies, exit 0, `reason=ok`, over 12.5 minutes.

**A solo-leg disclosure.** A peer session was running the full battery in
the integration checkout (its `e2e` leg, 743s, GREEN at `6c46872`) while
I was drilling. My `parser` and `app` legs are declared `solo: false` and
ran during that window; **`rust` and `e2e`, which are `solo: true`, were
both run after that battery had exited** — I waited on its own marker
(`finished 2026-09-09T03:13:02Z`) rather than on a guess. Every one of my
mutant runs is a single-spec drill against `tools/e2e/tests/cli.spec.ts`,
never a graded suite verdict, so none of them is quoted as a suite figure.
Three of those drills SURVIVED, and a survival is the reading contention
could corrupt — so I did not take any of them on the run alone: for each
I read the body's own source to see WHY the property is unarmed, and then
armed it with a proposed body and watched that body red against the same
mutant (below). D10's re-aim, D10b, kills, which is the proof its
survival was structural.

**And a second contention, which I only found by looking**: a peer
verifier's bench (`nputer-V-T-167-s13`) started its OWN solo `e2e` leg
about ninety seconds after mine and ran alongside it for the whole run.
`gate-run`'s solo guard is per-checkout and does not see across sibling
worktrees. My leg is GREEN with **737 bodies, exit 0, `reason=ok`**, and
contention can turn a green red but not a red green — so the verdict
stands; the **749s wall time is a contention reading and must not be
taken as a health-band figure**, which is the one thing the solo flag
exists to protect. I report it rather than quietly quoting the number.

### What carried by blob hash, and what was re-run

`git diff --stat f809cd9..870c14e` moves exactly four code files and the
card. Everything else the first verdict measured stands on an unchanged
blob:

| path | f809cd9 | 870c14e | class |
|---|---|---|---|
| `tools/e2e/bin/supertaskr.mjs` | `b8d7045163c7` | same | **CARRY** |
| `tools/e2e/package.json` | `2b3db676813f` | same | **CARRY** |
| `README.md` | `befd4f73b5b6` | same | **CARRY** |
| `docs/CONVENTIONS.md` | `7a49960f0204` | same | **CARRY** |
| `tools/e2e/scripts/cli.mjs` | `017c94cc39fb` | `0143865005a2` | RE-RUN |
| `tools/e2e/scripts/undo.mjs` | `37f917ba8e57` | `77d08e424693` | RE-RUN |
| `tools/e2e/scripts/merge.mjs` | `9287cc5cba11` | `a8a5e0a93898` | RE-RUN |
| `tools/e2e/tests/cli.spec.ts` | `d78dd81e2a5f` | `227f6d3fc6c7` | RE-RUN |

**Carried on the strength of the unchanged blob**, from the first
verdict: sweep items 5 (no publish path), 6 (no install-time execution),
8 (no `git push`), 10 (no dependency added), 11 (the README's
qualification), AC-4's creation-target set and its fence subset, and the
`npm ci`/lockfile finding.

**Re-run in full because the file moved**: AC-1's passthrough probe,
AC-2, AC-5's requirement derivation, AC-6 whole, AC-7's installer under a
sandboxed `HOME`, AC-9/10/11's `merge` steps, and sweep items 1, 2, 3, 4,
7 and 9. AC-8 was re-derived at my ref regardless, because it is a claim
about the world rather than about a file.

### The fence held

`git diff --name-only b679f0a..870c14e` is twelve paths and every one is
inside `tools/e2e/**`, `README.md`, `docs/CONVENTIONS.md` or
`docs/tasks/**`. The fix pass widened nothing.

### The refuted claims, each re-run against `870c14e`

**R1 — `undo` failed OPEN when the fence expanded to nothing. FIXED.**
The first verdict's own reproduction, re-run verbatim:

    $ node tools/e2e/scripts/undo.mjs T-018 --root <bench> --branch main --dry-run
    undo T-018: CANNOT RUN — docs/tasks/T-018-watcher-truthfulness.md's `touches:`
    expands to NO paths (the ONE expansion could not resolve app-shell).
    … Nothing was reverted.
    exit=3

was exit **0** with `0 later merge(s) on this fence` and a named revert.
The scale re-derives at my ref: of **255** done cards, **253** carry a
`touches:` line, **99** expand to zero paths — the same 99 — and all 99
now refuse. `expandFence` carries `unusable` and `unfenceable` out, and
`main` refuses on them.

**R2 — the landing merge was found by an unbounded substring. FIXED.**
`mentionsCard` matches on a token boundary. Unit, at my ref:
`("Merge T-244-s3","T-244") → false`, `("Merge T-900","T-9") → false`,
`("Merge T-244","T-244") → true`, `("T-244: work","T-244") → true`. End
to end, in a synthetic repository built for this pass (`git init -b main`,
three lanes, merges `Merge T-244` / `Merge T-244-s3` / `Merge T-900`, plus
a never-merged `T-9` card):

    $ node tools/e2e/scripts/undo.mjs T-9 --root <syn> --dry-run
    undo T-9: CANNOT RUN — no first-parent merge on this branch merged a side
    whose commits name T-9 …
    exit=3

The first verdict got exit **0** naming `Merge T-900`. And the positive
direction still works: `undo T-244` selects `Merge T-244` (not
`T-244-s3`'s) and refuses on the two later merges by name.

**R3 — it scanned one ref and mutated another. FIXED.** In the same
synthetic repository, detached, with NO `--dry-run`:

    $ git checkout --detach HEAD; node …/undo.mjs T-900 --root <syn>
    undo T-900: CANNOT RUN — this scans main and `git revert` rewrites HEAD,
    and HEAD is DETACHED rather than refs/heads/main. … Nothing was reverted.
    exit=3   HEAD before == HEAD after; worktree clean

and on a wrong branch, `HEAD is refs/heads/task/T-901-elsewhere`, exit 3,
HEAD unmoved. The first verdict's run committed a revert here.
**Positive control that the guard is not simply a refusal machine**: on
`main`, the same command executes, `src/lane-c.txt` is removed, the
commit is `Revert "Merge T-900"`, the tree is left clean, exit 0.

**R4 — `merge`'s clean-tree precondition could not fail. FIXED.** The
step declares `assert: "empty-output"` and `runStep` grades it on the
output. With a deliberately dirty tree, in a synthetic repository:

    the tree is NOT clean — this step is graded on its output, not its exit:
     M src/a.txt
    merge T-901: stopped at precondition:clean (exit 1).
    exit=1 ; git diff --cached --name-only → EMPTY

The first verdict's run staged the merge on top of the dirt. **Positive
control**: the same command on the same fixture, clean, gets past the
precondition, stages the merge, stamps the card `status: done` with
`built_by`/`verified_by` filled, and stops with `MERGE_HEAD` standing and
two paths staged.

**VM1 — the passthrough had no body. FIXED and drilled.** Re-measured
over all 23 verbs through the real entry point with the spawn observed,
six literal arguments (`--`, `--force`, `a b`, the empty string, `-x`,
`--y=$(echo pwned)`, `;id`): **22 of 22 spawning verbs receive them
verbatim, in order**; `install` is a builtin and spawns nothing. Mutant
**D5** (drop `...rest` from `planFor`) now reds
*"the caller's own arguments reach the child verbatim, in order, and
nothing is added"*.

**VM2 — the executed revert had no body and the printed string was a
second spelling. FIXED and drilled.** The printed command is built FROM
`revertArgv`. Mutant **D6** (`-m 1` → `-m 2`) reds three bodies, the
aimed one being *"undo EXECUTES the revert it printed, and it reverts
onto the merge's first parent"*.

**R6 — room item 27's second half was prose. FIXED.** `graphPinLine` is
a pure function of the staged graph and a date and produces
`RECONCILED AT THE <id> MERGE (<date>, integrator). Re-derived from the
staged graph: N files, N symbols, N edges…`; the `dogfood` step carries
`action: "graph-pins"` and the runner prints it. It is a VALUE, not a
comment: mutant **D7** (pin the file count at a constant) reds
*"a graph-moving merge re-derives the pins into a dated line carrying the
graph's own counts"*.

**AC-2's under-exposure — `node tools/method-evals/run.mjs` was not a
verb. FIXED, and the criterion's word DERIVED is now true.** There are 23
verbs; `evals` is one, on a new `project` target kind resolved against
the PROJECT root. End to end at my ref:
`node tools/e2e/bin/supertaskr.mjs evals --selftest` → *10 model-free
eval(s), POSITIVE CONTROL*, exit 0. The coverage body reads T-241's and
T-242's own cards rather than a typed list — at my ref they name exactly
two commands (`brief.mjs --dispatch`, `node tools/method-evals/run.mjs`)
and both are reachable — and it matches by EXACT membership: mutant
**D8** (repoint `evals` at `gate-run.mjs`) reds it, which the executor's
own first spelling (`toContain("run.mjs")`) did not.

**T-244-s4's shape (git end-of-options). PARTLY CLOSED, and the card
stands.** Through `undo`'s main path the probe is now refused before
`git log` runs — R3's branch check fires first:

    $ node …/undo.mjs T-244 --root <syn> --branch '--output=<file>' --dry-run
    exit=3 ; <file> NOT created

But the closure is R3's guard, not an end-of-options separator. The
trailing `--` the fix adds to each `git log`/`git diff` **does not stop
option parsing** — git reads options before `--` — and the site is still
live when reached directly:

    firstParentMerges(<syn>, "--output=<file>")  →  <file> CREATED, 162 bytes

So the card's finding is accurate as filed; only its reachability
through `undo`'s CLI has narrowed. The fix note's phrasing implies the
`--` did the work, and it did not. Not a defect — a record correction,
made here.

### The drill I ran, and the executor's "31-for-31" re-derived

Fifteen mutants (fourteen tabled; D10b is D10 re-aimed), each landing read from `git diff` (`--numstat` 1-1 on
one file every time), each restored and proved byte-identical to
`git show HEAD:<path>` by sha256 with an empty per-path diff as
companion. Run against `tools/e2e/tests/cli.spec.ts` (31 bodies, 7.3s
green at the tip).

| # | mutant | site | verdict | body it reds |
|---|---|---|---|---|
| D1 | the empty-fence refusal deleted | `undo.mjs` main | **KILLED** | *a card whose fence expands to NOTHING is refused, never reverted* |
| D2 | the id match back to `String.includes` | `undo.mjs` `landingMerge` | **KILLED** | *a card id is matched on a token boundary…* |
| D3 | the scanned/mutated-ref guard deleted | `undo.mjs` main | **KILLED** | *undo refuses when the ref it scans is not the ref the revert would rewrite* |
| D4 | `assert: "empty-output"` dropped | `merge.mjs` `preludePlan` | **KILLED** | *the merge's clean-tree precondition is graded on its OUTPUT…* |
| D5 | `...rest` dropped (VM1) | `cli.mjs` `planFor` | **KILLED** | *the caller's own arguments reach the child verbatim…* |
| D6 | `revert -m 1` → `-m 2` (VM2) | `undo.mjs` `revertArgv` | **KILLED** (3 bodies) | *undo EXECUTES the revert it printed…* |
| D7 | the pin line's file count made constant | `merge.mjs` `graphPinLine` | **KILLED** | *a graph-moving merge re-derives the pins…* |
| D8 | `evals` repointed at `gate-run.mjs` (VM13) | `cli.mjs` `VERBS` | **KILLED** | *every command the skills' own cards name is a verb this package exposes* |
| D9 | the installer's collision guard deleted | `cli.mjs` `runInstall` | **KILLED** | *the installer refuses a destination it would clobber…* |
| D11 | `mentionsCard` keeps only the LEFT boundary | `undo.mjs` | **KILLED** | *a card id is matched on a token boundary…* |
| D12 | the R3 guard weakened to detached-only | `undo.mjs` main | **KILLED** | *undo refuses when the ref it scans…* |
| D10 | `stampDone` overwrites a `built_by` already recorded | `merge.mjs` | **SURVIVED** | — (see correction C3) |
| D13 | the `capabilities:add` step deleted | `merge.mjs` `tailPlan` | **SURVIVED** | — (see correction C2) |
| D14 | `git add docs/architecture` → `docs/nothing` | `merge.mjs` `tailPlan` | **SURVIVED** | — (see correction C2) |

**Kill-set containment.** D2 and D11 share one body, and D11's kill set is
contained in D2's — D11 is a restatement, and I record it as one rather
than counting it twice. D3 and D12 likewise. Every other kill set is a
singleton and no two of them overlap, so the eleven properties are each
decided by their own arrangement. D6's kill set has three members; a kill
count of one is a property of a well-chosen mutant, not an invariant.

**Something died at the site the property lives**, for each of the eleven
kills: every mutant is a one-line change inside the function the
criterion names, and the body that reds is the one written for that
criterion.

**On "31-for-31."** I re-derived that claim on the six finding-mutants
plus VM1, VM2 and VM13, and all nine kill. The claim is true of the
executor's own thirty-one mutants. It is NOT a statement that the fix
pass is fully aimed: **three sites the fix pass ADDED have no body at
all** — D10, D13 and D14 landed and the whole spec stayed green. Two of
those three are fixes the first verdict itself asked for, so the fix
reproduces the very defect class R5 rejected on, at smaller sites.

### Both sides of the one exception the fix widened

`rootMismatch` gained `|| entry.target.kind === "project"` — an exception
to the rule that a verb whose script resolves its own repository root is
refused from an installed copy. Measured at my ref against a scratch
project that is not this repository: the eight `script` verbs with
`rootFlag: false` are still REFUSED, and `evals` is allowed — correctly,
because it is the only kind that resolves against the caller's project:

    plan from a foreign project: <that project>/tools/method-evals/run.mjs
    plan from this repository  : <bench>/tools/method-evals/run.mjs

Two different files, so the exception is earned rather than a hole. AC-3's
docs-reader account is unchanged at my ref for all three moved scripts
(`cli.mjs -> docs/CONVENTIONS.md`, `merge.mjs -> docs/CONVENTIONS.md`,
`undo.mjs -> docs/tasks`, all `via: site`, all owing `npm test` from
tools/e2e), and AC-5's requirement derivation still names the one command
with its positive control (`evals` against a project lacking
`tools/method-evals/run.mjs` reports it by name; against this repository
it owes nothing).

### The security sweep (3b) on everything that moved — CLEAN, no rejection

Re-run in full on `cli.mjs`, `undo.mjs`, `merge.mjs` and `cli.spec.ts`;
the rest carried on unchanged blobs (table above).

1. **Injection / passthrough.** No `execSync`, no `exec`, no
   `spawn(…, {shell:true})` on any user value; the only `child_process`
   import in all three scripts is `spawnSync` with an argv ARRAY. Six
   literal arguments arrive verbatim at 22 of 22 spawning verbs.
   `supertaskr 'ls; touch …'`, `'$(touch …)'` and `` '`id`' `` → exit 2,
   **nothing spawned**, no probe file created.
2. **Path resolution.** The new `project` target kind resolves
   `path.join(projectRoot, <constant from the frozen VERBS table>)` — no
   operator value becomes a path segment. `undo ../../etc/passwd` refuses
   at the card lookup.
3. **New WRITE paths, which is what this fix adds.** Exactly one:
   `writeFileSync` in `runStep`'s `stamp-done`, to
   `path.join(projectRoot, card.file)` where `card.file` is a resolved
   real path off the board; it is followed by `git add -- <card>`, with
   the separator. `runInstall`'s new code only READS destinations. The
   installer under `HOME=$(mktemp -d)` wrote four files under the
   PROJECT and **nothing at all under `$HOME`** across four runs.
4. **The clobber guard.** Second run over identical destinations: no-op,
   exit 0. A hand edit then refuses (exit 1) naming the destination, the
   edit intact. `--force` overwrites. `$HOME` untouched throughout.
5. **`--force` naming on `undo`** still refuses to let one name license
   two (carried; `undo.mjs`'s `forceVerdict` is unchanged by the fix).
6. **Secrets, tokens, `.npmrc`, `process.env` logging, publish paths, new
   dependencies**: none. `tools/e2e/package.json` and its lockfile are
   byte-identical to `f809cd9`.
7. **Regex construction from operator input.** `mentionsCard` escapes its
   input before building a `RegExp`. `cardFile` does NOT — see finding N2
   and card T-244-s5. I judge it NOT a security finding, on the same
   reasoning the first verdict applied to T-244-s4: every value comes
   from the operator's own command line, there is no shell anywhere, and
   the failure is a crash or a refusal rather than an escalation.

### The three findings this pass adds, and the corrections assigned for them

**N1 — `undo` still fails open when the fence expands only PARTLY, on 30
of the 253 done cards.** R1's fix refuses when `paths` is empty. It does
not refuse when the expander resolved SOME tokens and reported others
`unusable`: the verb then compares later merges against a fence that is a
strict subset of what the card reserved, prints a clear fence, and
proceeds. Re-derived at my ref: 253 done cards carry `touches:` — 99
expand to nothing (refused, R1), **30 expand to paths WITH unusable
tokens left over** (`T-025:app-agent,app-shell`,
`T-033:lib-parser,app-map,app-shell`, `T-112-s6:app-board`, …), 124
expand cleanly. Reproduced end to end in a synthetic repository, with a
card `touches: [src/, app-shell]` and a later merge landing only on
`app/src/`:

    the ONE expansion: {"paths":["src"],"unusable":["app-shell"],…}
    $ node …/undo.mjs T-900 --root <syn> --dry-run
      fence:  src
      since:  0 later merge(s) on this fence      ← Merge T-901 landed on app/src/
      --dry-run … git … revert -m 1 --no-edit 7c86e3bf87aa
    exit=0

The criterion says *"after listing **every** later merge that touched the
same fence"*. It does not. This is R1's own argument — *an answer it
could not fully derive is being read as a complete one* — one condition
narrower.

**N2 — an unexpected operator value reaches a `throw` instead of a named
refusal.** `cardFile` interpolates the id straight into
`new RegExp(`^id: ${id}\s*$`, "m")`. Two consequences, both reproduced:
`undo 'T-((((((((((a'` exits 1 with an **uncaught SyntaxError and a stack
trace** (`merge` shares the function, so both verbs), and the card lookup
is a REGEX rather than a literal (`cardFile("T-24.")` reports *10 cards
carry `id: T-24.`* on this board). The wrong-card revert is blocked only
by accident — `mentionsCard` DOES escape, so the two lookups disagree and
the disagreement happens to fail safe. Separately, `runInstall`'s new
collision read throws `EISDIR` when a destination is a directory. **This
site is untouched by the fix pass**; the first pass's sweep tested path
traversal here and not regex construction. Filed as **T-244-s5**, with
its control shown failing.

**N3 — three of the fix pass's own additions have no body** (D10, D13,
D14 above): `stampDone`'s "fills only an EMPTY seat" is pinned for
`verified_by` and not for `built_by`; and neither `git add
docs/CAPABILITIES.md` nor `git add docs/architecture` — the first
verdict's "merge does not stage what it regenerates" — is held by
anything. D14 is the sharp one: repointing the staging step at
`docs/nothing` would fail at runtime with `git add` exit 128, and the
whole spec stays green.

**THE CORRECTIONS, each named precisely, each with the body that pins it,
each control checked BY ME against an implementation that lacks the
property.** All three are inside the lane's fence.

**C1 — `undo` SHALL refuse when ANY `touches:` token failed to expand
(N1).** Site: `tools/e2e/scripts/undo.mjs`, `main`, the guard at
`if (fence.paths.length === 0)` → `if (fence.paths.length === 0 ||
fence.unusable.length > 0)`, with the existing message already naming the
unresolved tokens. The body:

    test("a fence with ANY unresolved token is refused, never called clear", () => {
      const { root } = undoFixture({ later: true, touches: "src/, app-shell" });
      … expect(status).toBe(EXIT.CANNOT_RUN);
        expect(said.join("\n")).toContain("app-shell");
      // POSITIVE CONTROL: every token resolvable → the later-merge refusal instead
      const control = undoFixture({ later: true });
      … expect(status).toBe(EXIT.FOUND); expect(said.join("\n")).toContain("REFUSED");
    });

**Checked**: run at `870c14e`, which LACKS the property, it FAILS, on
its own first assertion — `Error: a partly underivable fence is CANNOT
RUN` / `expect(received).toBe(expected)` at the `EXIT.CANNOT_RUN` line —
so its green will mean something. Its positive-control arm is the same
arrangement the fix pass's own R1 body already passes on at this tip, so
the control arm is known-good while the subject arm reds. The mutant for
the drill is the reverse of the one-line widening.

**C2 — the two staging steps SHALL be pinned by their argv (N3).** Site:
`tools/e2e/tests/cli.spec.ts`. The body:

    test("a merge STAGES the census and the graph it regenerated, by the argv it runs", () => {
      const plan = tailPlan({ paths: ["tools/e2e/tests/cli.spec.ts", "app/src/x.ts"], … });
      expect(argvOf("capabilities:add")).toEqual(["-C", repoRoot, "add", "docs/CAPABILITIES.md"]);
      expect(argvOf("graph:add")).toEqual(["-C", repoRoot, "add", "docs/architecture"]);
      expect(at("capabilities:add")).toBeGreaterThan(at("capabilities"));
      expect(at("graph:add")).toBeGreaterThan(at("graph:regen"));
      // POSITIVE CONTROL: a merge that regenerates neither plans neither add.
      const none = tailPlan({ paths: ["README.md"], … });
      expect(none.map((s) => s.id)).not.toContain("capabilities:add");
    });

**Checked, both ways**: it PASSES on the clean tree (33 passed, exit 0)
and it REDS against D13 (the step deleted) and against D14 (the argv
repointed at `docs/nothing`) — one failure each, the other 32 bodies
green, so its kill set is disjoint from every existing body's.

**C3 — the done stamp's "empty seat only" SHALL be pinned for `built_by`
as well as `verified_by` (N3).** Site: `tools/e2e/tests/cli.spec.ts`, one
body (or three lines inside the existing one), asserting a card carrying
`built_by: somebody@already` and an empty `verified_by:` keeps the
builder and fills the verifier. **Checked**: PASSES on the clean tree,
REDS against D10, the mutant that widens the `built_by` anchor to `.*`.

**A note, not a correction.** `graph:add` is planned only when an INDEXED
SOURCE moves, not when `docs/architecture/graph.json` alone moves. I
believe that is right — nothing was regenerated, so nothing is owed
staging — and I record it because my first draft of C2 asserted
otherwise and was wrong, not the implementation.

### What I did not judge

- ROADMAP's question of whether this was the right card. Not mine.
- The rename (T-264/T-265) and the repo-wide spelling; publishing (T-266).
- The real `~/.claude` and `~/.codex`: the installer ran only under
  `HOME=$(mktemp -d)`, where it wrote nothing under `$HOME` at all.
- Cross-platform behaviour — darwin only.
- `merge-lane.sh` as a RECORD; its digest still does not match G11.
- Wall-clock, reported and never failed on.
- The human approvals in the dispatch note, taken as given.

### For the integrator

**This ref may be merged, with the three corrections above performed at
the landing** — held to lane standards, each with its mutant drilled (C1
is code and owes one; C2 and C3 are bodies and their mutants are D13/D14
and D10, already written and demonstrated).

**And two things about the RECORD that are easy to lose:**

1. `a6d5c1d` — the first verdict — **is not in this lane's ancestry**.
   This commit restores its text and the T-244-s4 card into the tree;
   confirm both survive the merge, because nothing else references
   `a6d5c1d` (it carries no branch).
2. `npm run capabilities:check` is STALE at this tip and is correctly the
   integrator's: docs/CAPABILITIES.md is outside every lane's fence, and
   this lane adds ten more bodies on top of the original twenty-one.

What is sound and should not be re-litigated: the front (no logic moved,
verbatim passthrough over 22 verbs, exit codes unrelabelled, targets
resolved on disk), the requirement derivation, the docs-reader account,
the harness table and its third-harness proof, the npm name, room item
18's order, and all six of the first verdict's numbered findings, each of
which is now fixed AND held by a body I killed a mutant against.

**AC-8, re-derived at my own ref**, 2026-09-09T03:08:05Z against
`https://registry.npmjs.org/`: `npm view supertaskr version` → **E404,
the name is FREE**. Positive control that the query answers otherwise:
`npm view react version` → `19.2.8`. Nothing was published; no publish
path exists in the diff.


### Step 7 — the gates my OWN commit could move, re-run at the tip it created

Prose is a code input here, so the verdict commit `057f0f8` (this second
entry, plus the restored T-244-s4 and the new T-244-s5) owes the suites
its three card writes oblige. `docs-gate.mjs` on those three paths at
that tip names them: **`npm test` from app/, `npm test` from tools/e2e/,
`npx vitest run` from lib/parser/** — and reports *every live task card's
frontmatter parses, with a legal status*, `0` injection-scan hits over 3
paths and 7 patterns, and governing-document budgets holding. Re-run
through the blessed gate-runner at
`057f0f8b753a4db4832ab6a6b87144811b9910a6`:

| suite | verdict | bodies | exit |
|---|---|---|---|
| parser | GREEN | 377 | 0 |
| app | GREEN | 1163 | 0 |
| e2e | GREEN | 737 | 0 |

`rust` is not owed by a docs write and was not re-run at this tip; its
figure above carries its own ref, `870c14e`. The e2e leg at this tip ran
in 744s **beside two peer benches' own solo `e2e` legs** — same
disclosure as above: the verdict stands, the wall time is a contention
reading.

**The one commit this record cannot cover is the one carrying this
paragraph**, which adds prose to the same card the `057f0f8` run just
proved does not move these three suites. I name that rather than round it
off.

### Cards filed

**T-244-s5** — *an operator value reaches a `throw` instead of a named
refusal* (N2). Its control is mine and I checked it: run against
`870c14e`, the body dies on the very `SyntaxError` it is meant to refuse
(`Invalid regular expression: /^id: T-((((((((((a\s*$/m: Unterminated
group`), and its positive control — a real id still resolving to its one
card — passes. T-244-s1, s2, s3 stand as the lane filed them; **s4 is
restored by this commit** and stands, with its finding narrowed as
recorded above.


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
