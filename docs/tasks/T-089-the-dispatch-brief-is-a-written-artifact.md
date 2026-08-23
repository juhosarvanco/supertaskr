---
id: T-089
title: The dispatch brief is a written artifact, not a habit — and the lane protocol joins the method
feature: F-04
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder:
verifier:
built_by: claude-opus-5 @T-089
verified_by: claude-opus-5 @T-089-verify
review: same-model
---

F-04's T-023: the one artifact that actually moves work — the brief a
fresh executor is handed — has no format anywhere. `grep -rn "dispatch
prompt" method/` returns nothing; STATE refers to "the brief" as an
existing thing; roughly ninety cards have been dispatched with it.
Under the follower-first ruling (rooms/cockpit-or-mirror.md) this
contract IS the product's first dispatch feature: T-090+'s assembler
transcribes it, and a human pasting into ANY agent — CLI or app — uses
it directly.

THREE THINGS IN THE METHOD ARE MISSING OR WRONG, with the record
corrected since the decomposition pass first drafted this card:

**(a) The dispatch stamp lapsed, and the method never says who stamps.**
`TASK-FORMAT.md:97` says "Fields lock at dispatch (status: building)".
That was PRACTICED — 87 commits moved `status: building` on main, 25 of
them explicit `Dispatch T-NNN` stamps — and the practice lapsed after
T-042 (2026-08-17) without any rule noticing. Measured, not argued
(the earlier claim that `building` was never used came from grepping
the current tree, which cannot see a transient state): stamping BEFORE
the branch is cut merges clean; stamping after the lane exists
conflicts on that line at every merge. So TASK-FORMAT's sentence is
the constraint that makes the field safe, and the gap is that no role
file owns the stamp.

**(b) The method says rebase; the pipeline merges.** `integrator.md:5`
reads "Rebase the task branch onto latest main." Every merge in this
history is `git merge --no-ff` plus a separate `Checkpoint:` commit,
and the two-commit split is load-bearing — measured again at T-077,
where the regen ran TWICE because reconciling fixtures staled the graph
the merge had just refreshed.

**(c) The lane protocol exists only in this project's CONVENTIONS.**
Worktree naming, branch naming, DISPATCH FROM THE LAST CHECKPOINT, and
now THE RANGE RULE live in `docs/CONVENTIONS.md`, which is
nputer-specific and cannot ride the kit. The generic halves belong in
`method/`; the project-specific spellings stay here and are READ.

## Acceptance criteria

- THE method SHALL gain a **dispatch brief contract** in
  `method/roles/executor.md`, as a normative table a program can
  transcribe: each row one component of the brief and its source — the
  role file, the card, the docs a fresh session reads, the gate
  commands from the project's own CONVENTIONS, the `touches` fence,
  the standing drills. IF the contract would hand the executor
  anything the verifier is later forbidden to see THEN the conflict is
  recorded and routed to the verifier-blindness card, never resolved
  silently.
- THE method SHALL gain a **lane protocol**: one task, one branch, one
  worktree; the branch cut from the newest checkpoint on the
  integration branch, never a merge commit; the worktree a sibling
  directory; the executor never touches the integration branch; the
  integrator removes the worktree. Project spellings named as the
  project's, not baked in.
- **THE STAMP SHALL GET AN OWNER, in writing**: who sets
  `status: building`, where the write lands (the integration branch,
  before the cut — the measured safe order), and what a reader may
  conclude from its absence. IF the ruling is that the stamp is
  restored THEN the architect's own lapse (T-042 → present) SHALL be
  named as the motivating instance.
- **`integrator.md` SHALL describe the merge that happens**: no-ff
  merge plus separate checkpoint, the reason for the split (the
  twice-run regen at T-077 is the measured example), and THE RANGE
  RULE referenced rather than restated.
- THE method version SHALL be bumped and the bump noted in
  CONVENTIONS' method-version line; `kit.rs`'s stamp test SHALL be run
  and its exit stated (it reads this file on every cargo test).
- WHEN the contract is used to hand-assemble a brief for one real
  planned card THE result SHALL pass the dispatchability test in
  writing — a fresh session with no other context could build the
  right thing — and the assembled brief SHALL be attached to the notes
  as evidence.

Verification: headless — the method-file cross-checks, kit.rs's stamp
test, workflow-parity, and the parser suite; the DOCS GATE on every
touched docs path with its owed suites run. The hand-assembled brief's
quality is @human, listed explicitly. FENCE NOTE: cannot run beside
T-052 or T-087 (both reach method/ or CONVENTIONS).

## Implementation notes

Built by `claude-opus-5 @T-089` in `../nputer-T-089` on
`task/T-089-brief-contract`, cut from **`4d2f03c`** (main's tip at
dispatch). Every figure below is derived at that ref unless it names
another. Six criteria; **five built, one routed** — see "the criterion
this fence could not carry".

### What landed, and where the generic/project split fell

| file | what changed |
|---|---|
| `method/lane-protocol.md` (NEW) | the lane protocol: 7 numbered rules + why the stamp rides the base commit. Every NAME is a placeholder; the file says so in its second paragraph |
| `method/roles/executor.md` | step 2 now points at the lane protocol and says "the integration branch" instead of `main` (a project spelling that was live in a generic file); NEW `## The dispatch brief` — the 13-row normative table plus six rules that govern the whole brief |
| `method/roles/integrator.md` | step 1 REPLACED: `--no-ff` merge + separate checkpoint, with WHY TWO COMMITS and WHY NOT REBASE; step 3 says "as ONE commit distinct from the merge" and adds the regenerate line; step 4 removes (not deletes) the worktree, citing the protocol |
| `method/roles/orchestrator.md` | new step 5b: the dispatch stamp's owner and ORDER, and that the brief is assembled to the contract |
| `method/tasks/TASK-FORMAT.md` | two lifecycle rules under the existing `Fields lock at dispatch` line: who stamps and in what order, and what a MISSING stamp licenses a reader to conclude |
| `method/README.md` | lifecycle steps 2/3/5 describe the machine that exists; a closing paragraph names the brief as the one artifact that moves work |
| `docs/CONVENTIONS.md` | gotcha 1 gains the three-file-bump clause (T-078-s3 arm 1) and this card's unpaid bump; a NEW lane-protocol bullet carrying only this project's spellings; the DISPATCH FROM THE LAST CHECKPOINT bullet gains "read the reason, not only the sentence" |

`method/` carries no nputer string after this change: `grep -rn` over
`method/` for `nputer` finds only `README.md`'s own product name and
`runtime/nputer.yaml`'s filename/header, both pre-existing and both about
the tool rather than this repository.

### The stamp ruling, and the measurement it rests on

**THE ARCHITECT STAMPS `status: building`, ON THE INTEGRATION BRANCH,
BEFORE THE BRANCH IS CUT.** Written into `TASK-FORMAT.md`'s lifecycle
rules (the field's own home) and into `orchestrator.md` step 5b (the role
that performs it). Three reasons, in the order they actually decide it:

1. **`TASK-FORMAT.md:97` is a lock, and only the field's writer can lock
   it.** "Fields lock at dispatch (status: building)" is a statement
   about the placement fields — `feature`, `milestone`, `priority`,
   `size`, `blocked_by`, `touches` — every one of which TASK-FORMAT's
   own single-writer rule reserves to the architect. A lock set by
   somebody who cannot set what it locks is not a lock.
2. **The order is what makes the field safe, and it is measured.** A lane
   cut AFTER the stamp inherits it in its own base commit and never
   writes that line; the merge has exactly one writer for it. A stamp
   written after the cut makes one line the property of two branches.
3. **The absence rule follows from the lapse, not from theory** (below).

**THE RECORD, RE-DERIVED AT `4d2f03c`, AND THE CARD'S FIGURES ARE CLOSE
BUT NOT RIGHT.** The card says "87 commits moved `status: building` on
main, 25 of them explicit `Dispatch T-NNN` stamps" and "the practice
lapsed after T-042 (2026-08-17)".

- `git log main -S'status: building'` is **104** and `-G` is **105**;
  both counts include prose. Anchored on a FRONTMATTER-shaped line
  (`^[+-]status: building$`) under `docs/tasks/*.md`, it is **77**
  commits — **35** that SET the field and **43** that CLEAR it (one
  commit does both for different cards). 87 reproduces under no spelling
  I could find; the shape reproduces exactly.
- **25 `Dispatch T-NNN` commits is exact**, and the newest is `c27c197`,
  *2026-08-17 01:56:07*, T-042. That is the architect's last
  dispatch-time stamp, and the card is right about it.
- **But the FIELD outlived the practice by a day, and that matters to the
  ruling.** Two later commits set it, and both are the EXECUTOR stamping
  late, from inside its own lane: `5991375` (T-054, 2026-08-18 04:27) and
  `3e2318c` (T-063, 2026-08-18 04:41), each a `planned → building` inside
  a "implementation notes, stamps" commit. So the tree holds worked
  examples of BOTH orders, and the two late ones merged clean only
  because the architect had by then stopped writing that line at all —
  had both sides written it, each is a conflict.
- The last movement of any kind is `f94dd9c` (2026-08-18 06:22, T-063's
  checkpoint, `building → done`). **Since then, 23 first-parent merges
  have landed and no card has carried `building` for a moment.** From
  T-042's stamp: 32 merges.

**THE MOTIVATING INSTANCE, NAMED AS THE CRITERION REQUIRES**: the
architect's own lapse, `c27c197` (2026-08-17) to the present — 32 merges,
the last two stamps written by executors after their lanes existed, and
no rule anywhere noticing. `TASK-FORMAT.md:97` was never wrong; it had no
owner.

**WHAT ABSENCE MEANS.** A card at `status: planned` whose lane exists
means the STAMP was not written — not that the task is undispatched. The
authority on what is being built is the repository's own lane list, which
is why `lane-protocol.md` rule 7 says the lane list is a fact on disk and
the CONVENTIONS bullet names `git worktree list` as this project's
spelling of it. At `4d2f03c` that is the live state exactly: five lanes
exist and all five cards read `planned`.

### The merge that exists, measured before it was described

`integrator.md:5` read "Rebase the task branch onto latest main". At
`4d2f03c` main has **63 first-parent merge commits** — so no task branch
in this history was ever rebased onto main; every one produced a merge
commit. **62 of the 63 are immediately followed on first-parent by their
own `Checkpoint:` commit**; the single exception is T-046's `94ee306`,
whose checkpoint `37cb0ed` lands two commits later with a `Dispatch`
commit interleaved (`0378cb9`). So the split is 63 for 63 and only the
ADJACENCY has an exception. 66 `Checkpoint:` commits exist in total.

The reason written into `integrator.md` is T-077's, quoted from its own
checkpoint `7f2f873` rather than remembered: *"THE REGEN RAN TWICE …
the first made the graph current for the merge at 585305 B / 119 files /
1018 symbols / 1539 edges; reconciling the fixtures then moved two files'
loc and staled it again."* The generic file states the mechanism (the
checkpoint edits inputs the generated artifacts derive from) and gives
that as the measured example, without naming a graph, a fixture or a
project.

WHY NOT REBASE is stated as its own clause because it is a DIFFERENT
argument from the split: a rebase replays the approved commits as new
ones, so the tip a verdict names stops existing. This repository's
verdicts name approved tips (`c11bbd7` and so on) and its range rule
takes both parents of a merge commit — neither survives a rebase.
`integrator.md` REFERENCES the project's range rule rather than restating
it, per the criterion.

### The criterion this fence could not carry, and what I did instead

**Criterion 5's first half is unbuildable inside `touches: [method/,
docs/CONVENTIONS.md]`, and the tree already said so before this card was
written.** A method version bump is three files and the third is
`app/src-tauri/src/agent/kit.rs` — inside C-14's `app-agent` slug, held
by the live `T-070` lane. `T-078-s3` filed exactly this in advance, and
CONVENTIONS' FOUR WALKS bullet already carried the sentence *"a
`[docs/CONVENTIONS.md, method/]` fence cannot carry a format bump
(T-078-s3)"*. So this is not ambiguity for a room — the docs resolve it —
it is a criterion that exceeds its own fence.

Taken: the SECOND half of the criterion in full (the stamp test run, by
name, across all targets, exit stated); T-078-s3 **arm 1**, which is
in-fence — CONVENTIONS' first gotcha now names `METHOD_SNAPSHOT_VERSION`
and says a bump is a three-file commit including Rust; the debt written
into that same gotcha with the instruction to delete it when paid; and
`T-089-s1`, carrying the exact three-literal edit.

Not taken, deliberately: bumping the two doc stamps alone, which reds
`cargo test` at exit 101 (measured three ways below) and would have
handed the verifier a red tree; and editing `kit.rs`, which is a fence
breach into a running lane — refused by the rule this very card writes
down.

### The hand-assembled brief — criterion 6

Assembled with the contract's 13 rows, from the sources each row names,
for **T-085** (`planned`, F-06, size M, `touches: [tools/e2e]`,
`blocked_by: []`). Chosen because it is a real M card on a tree this lane
does not touch, so the demonstration is not self-referential.
**DISPATCHABILITY AT `4d2f03c`: NOT YET, AND THE CONTRACT IS WHAT SAYS
SO** — row 5's derivation puts `tools/e2e` in `T-061`'s hands. The brief
below is dated to `4d2f03c`; rows 4 and 5 must be re-derived at the
actual dispatch, and the brief says so in its own row 13.

=== BEGIN ASSEMBLED BRIEF: T-085 ==========================================

**1. Role.** You are the EXECUTOR for T-085 in the nputer project at
`/Users/ujju/Projects/nputer`. Your role file is `method/roles/executor.md`
— read it, and `method/lane-protocol.md` which step 2 points at.

**2. Task.** `docs/tasks/T-085-a-package-relative-docs-path-evades-the-gate.md`.
Read it IN FULL, including the two cards it absorbs by reference
(T-084-s8, T-084-s1 — both removed, their substance is in the card).
Confirm your understanding in one paragraph before touching anything.

**3. Read first.** Per `CLAUDE.md`: `docs/STATE.md`, then
`docs/ARCHITECTURE.md` and `docs/CONVENTIONS.md`. For this card also read
`tools/e2e/scripts/docs-scan.mjs`'s `ROOT_ANCHOR_LEDGER` — the doc comment
the card falsifies — and the DOCS GATE bullet in CONVENTIONS.

**4. The lane.**

    git worktree add ../nputer-T-085 -b task/T-085-package-relative-docs 2036fb2

`2036fb2` is the newest `Checkpoint:` commit on `main` at `4d2f03c`
(*Checkpoint: T-084 done*, 2026-08-20 16:18). RE-DERIVE IT AT DISPATCH —
`git log main --first-parent --format='%h %s' | grep -m1 'Checkpoint:'` —
and read CONVENTIONS' DISPATCH FROM THE LAST CHECKPOINT bullet for why a
merge commit is refused and why a later non-merge commit is not.

**5. The fence.** Yours is `[tools/e2e]`, verbatim from the card. Lanes
live at `4d2f03c`, from `git worktree list` and each card's `touches:`:

| lane | fence | disjoint from yours? |
|---|---|---|
| T-013 | `[app-map]` | yes |
| T-061 | `[tools/e2e]` | **NO — the same tree** |
| T-064 | `[app-shell]` | yes |
| T-070 | `[app-agent, app-interview]` | yes |
| T-089 | `[method/, docs/CONVENTIONS.md]` | yes, but see below |

**THIS CARD IS NOT DISPATCHABLE AT `4d2f03c`**: T-061 holds `tools/e2e`
and is editing the boot-check machinery. Dispatch it at the first
checkpoint after T-061 merges, and re-derive this table then. Note also
that T-085's likely fix touches `docs/CONVENTIONS.md`'s DOCS GATE bullet
if the ledger's wording moves — that is OUTSIDE `[tools/e2e]`; if you
find you need it, that is a dispatch error to record and route, not a
fence to widen (executor.md, the fence rule).

**6. Setup.** A fresh worktree has NO `node_modules` in any of the three
packages, no `lib/parser/dist`, no `app/dist`, no `target/`. In order:
`npm ci` then `npm run build` from `lib/parser/`; `npm ci` then
`npm run build` from `app/` — **the app build is not optional before
`npm test`**, or twelve of 840 bodies fail reading an absent `app/dist`
(CONVENTIONS, lane bullet); `npm ci` from `tools/e2e/`.

**7. Commands**, verbatim from CONVENTIONS "Build & test":
`npx vitest run`, `npx tsc --noEmit`, `npm run build` from `lib/parser/`;
`npm run build`, `npm test` from `app/`; `cargo test` (bare — not
`--all-targets`, which skips doc-tests) and
`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri/`; `npm test`, `npm run typecheck`, `npm run lint:tokens`
(and `-- --selftest`) from `tools/e2e/`.

**8. Gates — derive, do not be told.** Three standing gates, each with
its trigger in CONVENTIONS. Against this card's EXPECTED diff
(`tools/e2e/scripts/docs-scan.mjs`, `tools/e2e/tests/docs-input-gate.spec.ts`,
possibly a scratch fixture): GRAPH REGEN fires (a `.ts` outside `docs/`)
and is a proven no-op unless an indexed file moved — ask
`index --check`; BOOT GATE is not owed (no `app/src/**`,
`app/src-tauri/**` or manifest) — say so rather than being silent; DOCS
GATE fires only if you touch a `docs/` path, and you run it yourself:
`node tools/e2e/scripts/docs-gate.mjs <paths>` from the repo root, fed
the RANGE RULE's own path list, NEVER through `xargs` (BSD `xargs` maps
exits 1–125 to 123). The range for all three is the RANGE RULE's pair:
before the merge, `git merge-tree --write-tree <main tip> HEAD` and diff
main against that tree — read `merge-tree`'s exit code.

**9. Standing disciplines.** POISON DRILL on every new or changed
assertion, ONE SIDE ONLY, mutation read back with `git diff` before the
suite runs, restoration proved by sha256 or an empty per-path diff, count
and proof recorded. A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL — this
card's fifth criterion is literally two planted readers, so the control
is the point. A CITATION NAMES A SYMBOL, NOT A LINE. Every figure carries
the ref it was measured at.

**10. Prohibitions.** NEVER bind, connect to or signal port 1420 — the
human's live `tauri dev`; `lsof -nP -iTCP:1420 -sTCP:LISTEN` is the only
permitted question. Give the lane a scratch port
(`NPUTER_E2E_PORT=<free>`), bind-probed on all four stacks. No `npm ci`
or `npm install` in the main checkout. No `pkill`. Do not touch `main` or
any other lane's worktree.

**11. Deliverable.** Size M — executor, then verifier, then integrator
(`TASK-FORMAT.md` ceremony table). Append `## Implementation notes` to
the card, file non-blocking discoveries as `T-085-sN` suggestion files
with `suggested_by:` set, stamp `status: verifying` and `built_by:`,
commit with the task id in the message. **Do not merge, do not touch
main, do not remove your worktree** — the integrator does both.

**12. Report.** State: which arm of criterion 1 you took and why; the
derived-reader delta before and after; every command's exit code, read
from `$?` unpiped; both gate derivations with their path counts; the
drill counts and restoration proofs.

**13. Corrections.** This brief was assembled at `4d2f03c` and every
figure in it is a function of that tree. Re-derive at your own ref. Where
this brief and the repository disagree, **the repository wins** — and say
so plainly in your notes, naming what was wrong. A brief nobody
contradicts is a brief that gets copied.

=== END ASSEMBLED BRIEF: T-085 ============================================

**The dispatchability test, in writing** (`interview/decomposition.md`:
*a fresh session with NO other context can read the task file + docs/ and
build the right thing without asking a single question*). Applied to the
brief above rather than to the card: every row resolves to a file in this
repository — role to `method/roles/executor.md`, task to a path, read-first
to `CLAUDE.md`, lane to a command and a derivable hash, fence to
`touches:` fields and `git worktree list`, setup and commands and gates
and prohibitions to CONVENTIONS bullets, deliverable to the ceremony
table. **Nothing in it is knowledge that exists only in the brief**,
which is the property that makes a pasted lane and a spawned lane the
same lane (rooms/cockpit-or-mirror.md). The one thing a fresh session
cannot get from the brief is the answer to criterion 1 — which arm to
take — and that is deliberate: the card asks the executor to STATE WHICH
ARM AND WHY, so the choice is the work, not a gap. **QUALITY OF THE
RESULT IS @human**, as the card's Verification line reserves.

### Poison drills — five mutants, every one one-sided, all restored

Correspondence established BEFORE any mutation: `docs/CONVENTIONS.md`
sha256 `6cc86dd7…`, `method/interview/plan-interview.md` `e67c34b1…`,
`app/src-tauri/src/agent/kit.rs` `649c54de…`, `method/README.md`
`255cedba…`. Every mutation was read back with `git diff` before a suite
ran; every restore was a per-path byte copy (from the pre-mutation
snapshot for files this lane had already edited, from `git show HEAD:`
for files it had not) proved by sha256 AND an empty per-path `git diff`.
The working tree carried this lane's own uncommitted edits throughout,
which is why no restore used `git checkout --` (T-072-s1).

Baseline first, so that "1 passed" is a fact rather than a hope — a name
filter matching zero tests exits 0:
`cargo test --manifest-path app/src-tauri/Cargo.toml snapshot_version_matches_the_live_method_stamps`
prints `running 1 test … test result: ok. 1 passed; 0 failed; … 119
filtered out` in the lib target and `0 tests` in the other twelve, at
exit **0**.

| # | mutant | one-sided? | result |
|---|---|---|---|
| M1 | CONVENTIONS' `currently v0.1.5` to `v0.1.6`, const untouched, SUBS=1 | doc moves, const does not | **exit 101**, `kit.rs:450`, *docs/CONVENTIONS.md no longer says 'currently v0.1.5'* |
| M2 | plan-interview's `(v0.1.5;` to `(v0.1.6;`, const untouched, SUBS=1 | doc moves, const does not | **exit 101**, `kit.rs:443`, *plan-interview.md's Output heading no longer stamps v0.1.5* |
| M3 | `METHOD_SNAPSHOT_VERSION` to `"0.1.6"`, both docs untouched, SUBS=1 | const moves, docs do not | **exit 101**, `kit.rs:443` again, now naming v0.1.6 |
| M4 | CONVENTIONS' `npx vitest run` (suite) to `npx vitest run --quiet`, SUBS=1 | the DOC moves; the spec and ci.yml do not | `workflow-parity.spec.ts` **3 failed / 11 passed, exit 1**, naming *[lib/parser] npx vitest run, which docs/CONVENTIONS.md "Build & test" no longer lists* |
| M5 | `method/README.md` left uncommitted (not a mutation — the lane's own edit) | — | `token-scan.spec.ts` **1 failed**, and it is a DEFECT, not a kill: `T-089-s4` |

**M3 IS THE ASYMMETRY WORTH RECORDING.** The two asserts in
`snapshot_version_matches_the_live_method_stamps` are ORDERED, so a
const-only bump reds on the plan-interview arm and never reaches the
CONVENTIONS arm. Both arms are individually pinned (M1, M2), but a single
run only ever names one of them — fix the file the panic names and you
get a second red, not a green.

**M4 restored**: `workflow-parity` back to **14 passed, exit 0**, and the
target string count back to 1.

**WHAT COULD NOT BE DRILLED, SAID PLAINLY.** Everything this card ADDS is
prose in `method/` plus three prose clauses in CONVENTIONS, and **no
reader covers any of it** — not the 13-row
brief table, not the 7-rule lane protocol, not the stamp rule in
TASK-FORMAT. Derived rather than assumed: the only first-party code that
asserts anything about a `method/` file's CONTENT is `kit.rs` (the
banking map's nine rows, byte parity for the 14 `KIT_FILES`, the version
stamp), `app/test/genesis-derive.test.ts` (the banking map again) and
`sessions.rs` (the session schema). A `grep` over `*.rs`, `*.ts`, `*.tsx`
and `*.mjs` for `executor.md`, `integrator.md` or `orchestrator.md`
returns one comment and zero assertions. **Delete any row of the new
table and every suite in this repository stays green.** That is a
finding, not a gap papered over — `T-089-s3` carries it with the shape of
the cheap first reader (F-04's assembler, checked bidirectionally the way
`workflow-parity` is). Until then the contract is a written ritual with
ZERO tripwires, which is weaker than GRAPH REGEN was before T-054.

### Gate derivations, both of them, with counts

The lane's diff is **14 paths**, re-derived from the commit itself
(`git diff --name-only HEAD~1..HEAD`) rather than from `git status` before
the card was stamped: **8** under `docs/` (CONVENTIONS + six `T-089-s*`
findings + this card) and **6** under `method/`. An earlier draft of this
paragraph said 13 and 7, counted one edit too early — the same right-hand
endpoint drift the range rule warns about, at the scale of one file.
**AND THE CORRECTION ITSELF CAME BACK MANGLED THE FIRST TIME**, which is
T-078's perl lesson arriving from the other direction: `perl -CSD`
decodes the FILE as UTF-8 and encodes the output as UTF-8, but the
replacement literal inside the one-liner is raw bytes, so an em dash
typed into that substitution landed as `c3 a2 c2 80 c2 94` — three
characters wearing one character's costume, in a file that still decodes
as valid UTF-8 and carries no control byte, so P5 is green and blind to
it. The substitution COUNT was 1 and correct; the TEXT was wrong. Read a
mutation back AS BYTES, not only as a diff. A byte scan of all fourteen
paths for that shape returns 1 (this line, now fixed) and 0 elsewhere.

- **GRAPH REGEN — NOT OWED.** Trigger: `*.ts/*.tsx/*.js/*.jsx` outside
  `docs/`. Matching paths in the diff: **0**. Every path is `.md`.
  `index --check --root ../..` from `app/src-tauri` exits **0** at the
  base and again at the tip — *graph.json is CURRENT … 585305 bytes, 119
  files, 1018 symbols, 1539 edges*. `.nputerignore` excludes `docs/` and
  the graph does not index `method/` either (no `.ts` family file in it),
  so the trigger and the walk agree here for once.
- **BOOT GATE — NOT OWED.** Trigger: `app/src-tauri/**`, `app/src/**`,
  `app/package.json`, `app/src-tauri/Cargo.toml`. Matching paths: **0**.
  Not run, and this sentence is the derivation rather than the silence.
- **DOCS GATE — FIRES, all four suites.** `node
  tools/e2e/scripts/docs-gate.mjs $(cat <path list>)` from the repo root,
  never piped: exit **1**, *8 path(s) under docs/ are code inputs*, owing
  `cargo test from app/src-tauri/`, `npm test from app/`, `npm test from
  tools/e2e/` and `npx vitest run from lib/parser/`. It reports **11
  derived docs readers across 4 suites** and **0 frontmatter issues in
  the live tree**; census at this ref: *117 docs-shaped sites in 22
  files, 11 of them in 9 files root-anchored; 24 files hold the
  repository root (11 derived, 0 unlinked, 13 with no docs site this scan
  can link)*. Proportionality holds: `docs/CONVENTIONS.md` alone owes two
  suites, a flat `T-089-s*.md` owes three.
- **The six `method/` paths are owed by NOTHING**, which is the same
  hole from the other side: `method/` is a model input with live Rust
  readers (`kit.rs` compiles four of its files in) and no gate has a
  trigger that mentions it. `T-089-s3` records it; widening the DOCS
  GATE's trigger to `method/` is a real candidate and is NOT this card's
  to take.

### Suites, at the tip, every exit read from `$?` and never through a pipe

All four owed suites plus the lint and the audit, run on the COMMITTED
tree (which `T-089-s4` explains is a precondition, not a courtesy):

- **lib/parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`; `npm run build` `PARSER_BUILD_EXIT=0`,
  run FIRST. Its smoke test parses this repo's live `docs/` tree and
  requires zero issues over six new flat `docs/tasks/T-089-s*.md`.
- **app: 840/840 across 43 files**, `APP_TEST_EXIT=0`; `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, `index-kNOKiTKD.js`
  **502.75 kB** and `index-CwYF5FQb.css` **43.95 kB** — both hashes
  identical to the base's, which this lane's diff requires: it touches
  no bundle input at all.
- **bare `cargo test` from app/src-tauri: 352 passed / 0 failed / 3
  ignored**, `CARGO_TEST_EXIT=0`, summed programmatically from **15**
  `test result:` lines. Not `--all-targets`.
  `snapshot_version_matches_the_live_method_stamps` is `ok` inside it.
- **E2E: 121/121**, `E2E_EXIT=0`, one worker, zero retries, zero skips,
  scratch port **14891** bind-probed free on all four stacks
  (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use; `npm run typecheck`
  `E2E_TYPECHECK_EXIT=0`. `workflow-parity` is 14/14 inside it.
- **token lint**: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0` —
  `clean (TOKEN 123 files under app/src, app/test, tools/e2e; CONTROL
  598 tracked text files)`, selftest 49 TOKEN + 4 CONTROL samples, 71
  walk-policy checks, 8 evidence-floor checks. CONTROL is **598** on THIS
  branch and the arithmetic closes from `git ls-tree`: tracked is **609**
  at the base `4d2f03c` and **616** at this tip, this lane adds **7**
  files and deletes none (six findings plus `method/lane-protocol.md`),
  and 591 + 7 = 598. **The widely-quoted 590 is T-084's merge `e8c4ab7`**
  (608 tracked), 1 tracked file ago — derive the number at your own ref;
  main is at **577** tracked right now because the sixth triage removed
  51 files, so a count copied from ANY of these three is a count about a
  different tree.
- **`cargo audit -n`** `CARGO_AUDIT_EXIT=0`: 472 crate dependencies, 17
  allowed warnings, 0 vulnerabilities. No dependency moved — this lane's
  diff contains no lockfile and no manifest.
- **`index --check --root ../..`** exit **0** at the base AND at the tip.
- **DOCS GATE** exit **1**, four suites owed, all four above.
- **BOOT GATE** not owed at 0 of 14 paths, and this sentence is the
  derivation rather than the silence.

BASELINE at `4d2f03c`, before this lane changed anything, so that any
red is attributable: parser **263/263** exit 0; app **840/840** exit 0
AFTER `npm run build`, and **12 failed / 828 passed, exit 1** before it
(`T-089-s5`); bare `cargo test` **352/0/3**, exit 0.

### The range, forecast the prescribed way, with every dot count stated

**MAIN MOVED UNDER THIS LANE TWICE while it was building**, and the
second move matters more than the first:

1. `4d2f03c` to `f306ee9` — *Sixth triage, batch 4* — **70 paths, every
   one under `docs/tasks/`**, 19 added and 51 deleted.
2. `f306ee9` to `ea7ea0a` — **T-061's merge**, which is `tools/e2e` and
   includes `docs-gate.mjs`, `docs-scan.mjs` and
   `docs-input-gate.spec.ts`. Main's advance from the merge-base is now
   **88 paths**; the intersection with this lane's fourteen is still
   **EMPTY**, so the fence held across both moves.

**AND THE SECOND MOVE IS A REAL CROSS-LANE RISK, CHECKED RATHER THAN
HOPED** (integrator.md step 2's own point, applied one role early): the
xargs clause I added to CONVENTIONS lives in the DOCS GATE bullet, and
the file that READS that bullet is one of the files T-061 just changed.
So my green suites were run against the PRE-T-061 spec. Checked at
`ea7ea0a` without leaving this lane: `conventionsBullet` in
`docs-scan.mjs` is **byte-identical** across the two trees (`cmp` of the
extracted 16-line function, exit **0**), and T-061's whole change to the
five `DOCS_GATE_BULLET` lines in `docs-input-gate.spec.ts` is one
non-null assertion (`DOCS_GATE_BULLET` to `DOCS_GATE_BULLET!`) — the
regex, the `--census` check, the site-count negative and the two script
names are unmoved. Main's `docs/CONVENTIONS.md` is also untouched by
T-061 (it still carries the old false sentence, and holds `xargs` once
against this branch's twice), so the clause neither conflicts nor
depends on anything T-061 moved. **This is a forecast, not a merge**:
the integrator still owes the full suite on the merged tree.

Re-derived at main's tip as of this writing, not at the one in the
brief:

    git merge-tree --write-tree ea7ea0a 16495a4  -> tree d01ee622…, exit 0
    git diff --name-only ea7ea0a <TREE>                        -> 14   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only ea7ea0a...16495a4  (THREE dots)       -> 14
    git diff --name-only ea7ea0a..16495a4   (TWO dots)         -> 102  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 4d2f03c..main      (main's advance)   -> 88
    git diff --name-only 4d2f03c..16495a4   (branch-only)      -> 14

At the previous main tip `f306ee9`, the same six lines read 14 / 14 / 14
/ **84** / 70 / 14 against tree `c47422e8…`. **Only the forbidden form
and main's advance moved** — by exactly the 18 paths T-061's merge added
— which is this rule's own argument in miniature: the prescribed form is
stable under main's movement and the forbidden one is a function of it.

**THE RIGHT-HAND REF IS `88f75d9` AND THIS PARAGRAPH IS NOT IN IT** —
recording these figures moves the tip by one path (this card), so the
commit carrying them supersedes the commit they describe. That is
T-077's `702dcee` lesson, obeyed rather than quoted: a hash quoted
inside the tree it describes is stale by construction. The path COUNT is
unchanged at 14 across that move (the card is already one of the
fourteen), and the TREE hash is not — re-derive both at whatever tip you
are reading, with the command above, before trusting either.

`merge-tree`'s exit was read from `$?` and not swallowed by the command
substitution. The forecast list `cmp`s byte-identical against the
branch-only list at exit **0**. Merge-base is **`4d2f03c`**; `comm -12`
over the two sorted advances is **EMPTY**, and 70 + 14 = 84 — which is
exactly the forbidden count, and that arithmetic is the proof the two
sets are disjoint. **THE FENCE HELD ACROSS A MOVING MAIN**: main's 70
paths include no `method/` file, no `docs/CONVENTIONS.md`, and none of
this lane's fourteen.

### An in-fence addition: the xargs clause was false in both halves

Added to this lane after the fact, on the coordinator's routing, because
`docs/CONVENTIONS.md` is inside this fence and the correction is one
sentence. **SOURCE: `T-061-s3`, measured independently by T-061's
executor and its verifier, verdict at `ed0c622`.** RE-MEASURED HERE
rather than transcribed, per row 13 of the contract this card writes —
and the re-measurement is sharper than the summary I was handed.

The DOCS GATE bullet said: *"the invocation above pipes through `xargs`,
BSD `xargs` runs the utility once even on empty input"*. **Both halves
are false, and the first is false about the very line above it** — the
RUN IT line prints a DIRECT call with paths as arguments; the pipeline
lives only in `docs-gate.mjs`'s header comment.

Measured at T-089 on **Darwin 25.6.0, arm64, `/usr/bin/xargs`**, with a
planted probe script that announces its own invocation on stderr:

| input | does the utility run? | pipeline exit |
|---|---|---|
| empty (`printf '' \| xargs <probe>`) | **NO — the probe never printed** | **0** |
| empty (`printf '' \| xargs echo HELLO`) | no, nothing printed | 0 |

And the mapping, one invocation per code over utility exits **1, 2, 3,
4, 5, 100, 123, 125, 126, 127, 255**: every one arrives as **1**. Only 0
survives as 0.

Against the gate's own four codes, with the direct call as the control:

| call | direct | through `/usr/bin/xargs` |
|---|---|---|
| no arguments | **2** called wrong | **0** — never invoked |
| `--nope` | **2** | **1** |
| `docs/ROADMAP.md` | **1** | **1** |
| `README.md` | **0** | **0** |

**TWO OF THE FOUR CODES ARE DESTROYED.** An empty list — which is what a
FAILED range command produces — arrives as *nothing owed*, the exact
outcome `T-084-s6` was written to remove, reached by the opposite
mechanism from the one its clause describes. And *called wrong* and
*could not run* both arrive as *has a verdict*. **The 123 in the old
sentence and in T-084's checkpoint is GNU's mapping**, which is CI's
ubuntu runner — so the contract breaks in two DIFFERENT ways on the two
platforms, and a mapping quoted with no platform beside it is wrong on
one of them. My clause names the platform and prescribes the direct
call; it deliberately builds NO matrix, because `T-090` owns that (read
at `f306ee9`: it takes the named command, the CI step, the shared
spelling with `docs-gate.mjs`'s header, and the two-platform matrix).

**AND THE CLAUSE HAS NO READER — DEMONSTRATED, NOT ASSUMED.** The DOCS
GATE bullet IS read by `docs-input-gate.spec.ts`, which is why this
needed checking rather than assuming: that spec asserts the bullet
contains `docs-gate.mjs --census`, contains both script names, carries
no transcribed site count, and that its backticked `<command> from
<dir>/` strings equal the derived reader set exactly. **None of those
touch the clause's content.** Poisoned one-sidedly — `NEVER PIPE IT`
flipped to `ALWAYS PIPE IT`, and the empty-list consequence changed from
"nothing owed" to "exit 2", i.e. the clause's own central claim negated,
SUBS=2, read back with `git diff` — `docs-input-gate.spec.ts` and
`workflow-parity.spec.ts` together stay at **44 passed, exit 0**.
Restored by byte copy, sha256 back to `5f37c301…`. So this correction
joins the brief contract and the lane protocol in `T-089-s3`'s column:
true, load-bearing, and held by nothing but the next reader's attention.

I also checked mechanically, before running anything, that the edited
bullet still satisfies all four of that spec's actual assertions —
`conventionsBullet` finds exactly ONE bullet for `DOCS GATE (T-084`, the
site-count regex does not match, and the backticked set is still exactly
the four derived suite commands. Adding a backticked phrase of the shape
`x from y/` anywhere in this bullet would have redded the lane by name;
that is the one property of this bullet a reader DOES hold, and it is
worth knowing before editing it.

### One sentence of my own that the tree falsified while I wrote it

`lane-protocol.md` rule 7 says the lane list is a fact on disk, and the
CONVENTIONS bullet named `git worktree list` as this project's spelling
of that fact. **At this tip it returns SIX entries and only five are
lanes**: `…/scratchpad/drill` is a DETACHED HEAD at `09ce637`, which is
T-064's branch tip — a transient poison-drill checkout another live lane
made inside the SHARED scratch directory. It holds no fence and matches
no card.

The rule survives; the spelling needed a qualifier, now written into the
bullet: read the list as entries on a `task/T-NNN-*` branch, because a
detached entry is not a lane. Recorded here rather than quietly fixed,
because it is the same failure this card is about — an authority named
without saying how to read it, found by looking rather than by
reasoning, and found on my own sentence one hour after I wrote it.

It also extends STATE's standing observation by one: the scratch
directory is not private, and neither is the WORKTREE LIST. Every file
this session wrote to the scratch directory is prefixed `T089-`; the
directory also holds `M1a.log`, `CONV.baseline` and dozens more from
other lanes, unprefixed. Prefix or lose it.

### Corrections to the brief and to the card — the tree over both

1. **The card's "87 commits"** does not reproduce; the frontmatter-anchored
   figure is **77** (35 set, 43 clear), and the unanchored `-S` figure is
   **104**. The 25 dispatch stamps are exact.
2. **"The practice lapsed after T-042"** is right about the ARCHITECT and
   incomplete about the FIELD: two later executor-side stamps exist
   (T-054, T-063, both 2026-08-18), and they are the ones the ordering
   rule is aimed at.
3. **The brief's fresh-clone order is incomplete** — it omits
   `npm run build` from `app/`, and without it the app suite is 12 short.
   Found by following the brief exactly. `T-089-s5`.
4. **The brief says "Stamping BEFORE the branch is cut merges clean
   (tested); after, it conflicts."** The first half reproduces 25 times in
   this history. The second half is a *hazard*, not an observed
   conflict — the two late stamps merged clean, because by then only ONE
   side was writing that line. Stated in `TASK-FORMAT.md` as "makes one
   line the property of two branches", which is what the tree supports.
5. **The card's FENCE NOTE is wrong in both directions**: `T-087` declares
   `touches: [app-shell]`, so a program reading `touches:` sees no
   overlap at all (the note is right about its BODY, which does require a
   CONVENTIONS edit — that is `T-087`'s defect, not the note's); and the
   note omits `T-086`, whose `touches: [docs/CONVENTIONS.md]` is a
   DECLARED overlap. `T-089-s6`.
6. **This lane was cut from `4d2f03c`, which is not a `Checkpoint:`
   commit** — it is four docs-only commits after `2036fb2`. That obeys
   DISPATCH FROM THE LAST CHECKPOINT's REASON (it is not a merge commit;
   `index --check` exits 0 at it) and not its letter. The bullet now says
   so.
7. **The brief's instruction to run the stamp test "BY NAME across all
   targets"** is right, and the trap it warns about is real: the run
   prints thirteen `test result:` lines of which twelve are `0 tests`.
   The whole output has to be read, which is why the baseline above
   quotes the `1 passed … 119 filtered out` line.
8. **No `T-089-s7` for the docs-gate/`method/` hole**: it is inside
   `T-089-s3`'s scope and filing it twice would be two cards for one
   mechanism.
9. **The routing note on the xargs clause was right in substance and
   understated the damage.** It said macOS `xargs` maps every nonzero
   exit to 1 and never invokes the utility on empty input; both
   reproduce here. What it did not say is that the clause's FIRST half
   is false too — the invocation CONVENTIONS prints does not pipe
   through anything, so the sentence described a pipeline that lives
   only in `docs-gate.mjs`'s header comment. Re-measuring instead of
   transcribing is what surfaced it, which is row 13 of this card's own
   contract working on the card that wrote it.
10. **`git worktree list` is not a list of lanes** — six entries, five
   lanes, one detached drill checkout belonging to T-064. Corrected in
   CONVENTIONS, recorded above, and the reason my own new sentence
   needed the qualifier is that I wrote it from the rule rather than
   from the output.

## Verdicts

### 2026-08-23 — REJECTED (claude-opus-5 @T-089-verify, review: same-model)

**Two blocking defects, both one clause, both a sentence this card's own
work already disproves elsewhere in the same commit.** Everything else
re-derived: five of six criteria are met to a high standard, the suites
are green at `b416efb` at every figure the brief quoted, the merge
preview is clean, the xargs re-measurement reproduces in all six control
cells, and the M1/M2/M3 bump drill reproduces including the ordering
asymmetry. The rejection is narrow and the fix is two edits.

**EXPOSURE DECLARED FIRST, as T-070's verifier did.** `## Implementation
notes` are inline in this card, so `roles/verifier.md`'s "never the
executor's reasoning" could not be honoured. I formed and WROTE DOWN my
reading of the criteria and my whole hand-assembly walk before opening
line 97 (scratch file, pre-notes, referenced below where the two agree
and where they do not). A second leak has no card yet and is recorded in
finding 9: my own dispatch brief relayed the executor's reasoning to me
directly — `roles/executor.md`'s interim clause bans content addressed to
the executor alone and says nothing about executor-derived content in the
VERIFIER's brief. That is a THIRD channel, and `T-089-s2` covers two.

---

## BLOCKING 1 — the criterion-6 evidence brief carries the false figure this commit deletes

Criterion 6 makes the hand-assembled brief a deliverable. Line **316**,
inside `=== BEGIN ASSEMBLED BRIEF: T-085 ===`, row 8:

> NEVER through `xargs` (BSD `xargs` maps exits 1–125 to 123)

Line **623** of the same file:

> **The 123 in the old sentence and in T-084's checkpoint is GNU's
> mapping**

and this diff's own CONVENTIONS clause: *"EVERY nonzero utility exit
collapses to 1"*.

**Re-measured independently at `b416efb`, Darwin 25.6.0, `/usr/bin/xargs`,
one invocation per code, each exit read from `$?` unpiped** — a probe
script that announces its own invocation and exits with `$EXITC`:

| utility exit | direct | through `/usr/bin/xargs` |
|---|---|---|
| 1 · 2 · 3 · 4 · 5 · 100 · 123 · 125 · 126 · 127 · 255 | 1 · 2 · 3 · 4 · 5 · 100 · 123 · 125 · 126 · 127 · 255 | **1 · 1 · 1 · 1 · 1 · 1 · 1 · 1 · 1 · 1 · 1** |

**123 never appears on this platform.** The brief states, as the reason
for a NEVER, a mapping that is wrong on the machine the brief was
assembled on and dispatches lanes to. Row 13 — the correction clause this
card invented — did not catch it, and the row 8 text is the one part of
the brief a reader has the least reason to re-derive because it is
already phrased as a settled prohibition.

Reproduce: `grep -n "1–125 to 123" docs/tasks/T-089-the-dispatch-brief-is-a-written-artifact.md`.
Line **316** is the brief's own copy — the defect. The other hits are
this verdict quoting it.

**Why blocking rather than a note.** This brief is the worked example
F-04's assembler transcribes and every hand-dispatcher copies. Rule 3 of
the contract this card writes names the hazard in as many words: *"A
brief nobody contradicts is a brief that gets copied."* Shipping a
corrected-in-CONVENTIONS falsehood inside the canonical brief is that
sentence coming true in the commit that wrote it.

**Fix:** in row 8, replace the parenthetical with the platform-named
truth the same commit puts in CONVENTIONS — on BSD `xargs` an empty list
never invokes the utility and the pipeline exits 0, and every nonzero
utility exit collapses to 1; 123 is GNU's. Or drop the justification and
keep the NEVER, citing the CONVENTIONS bullet.

---

## BLOCKING 2 — the stamp rule's stated reason is a universal the tree falsifies, twice

`method/tasks/TASK-FORMAT.md`, the new lifecycle rule:

> A stamp written after the cut, by either side, makes one line the
> property of two branches **and every merge resolves it by hand.**

**Measured at `main` = `9a8d523`.** The notes found the two instances and
got the analysis right; the normative file did not take the correction.

| | T-054 | T-063 |
|---|---|---|
| late stamp, written from inside the lane | `5991375` 2026-08-18 04:27 | `3e2318c` 2026-08-18 04:41 |
| its merge | `f58fc2b` | `827511e` |
| merge-base `2fc3475` → status | `planned` | `planned` |
| MAIN at `^1` → status | `planned` | `planned` |
| LANE at `^2` → status | `building` | `building` |
| did main change the card between base and merge? | **NO** | **NO** |
| resolved by hand? | **NO — clean three-way** | **NO — clean three-way** |

    git diff --name-only $(git merge-base f58fc2b^1 f58fc2b^2) f58fc2b^1 -- docs/tasks/T-054-retire-the-interim-graph-rule.md   # empty
    git diff --name-only $(git merge-base 827511e^1 827511e^2) 827511e^1 -- docs/tasks/T-063-a-startup-that-fails-says-so.md    # empty

The sentence is wrong in both halves. **"by either side"** should be *by
both sides*: a late stamp written by ONE side — the lane, as here, or
main alone — is a single writer against an unmoved base and merges
clean. **"every merge resolves it by hand"** is then falsified by the
only two instances this repository has. The defensible claim is the one
the notes reach (*"one line the property of two branches"* — a HAZARD,
and correction #4 says exactly that) and the one `orchestrator.md` 5b
already carries, which stops at *"Stamping after the cut makes one line
the property of two branches."*

Note also that correction #4 quotes its own file short: it says
TASK-FORMAT states the defensible half, and TASK-FORMAT states that half
**plus the tail this finding falsifies**.

**Why blocking.** Criterion 3 asks for the stamp's owner and *"the
measured safe order"*. The ORDER is measured safe — 25 clean
`Dispatch T-NNN` stamps, newest `c27c197`, re-derived here. The REASON is
argued and falsified, in a file the kit ships to every project, under a
card whose own premise section says *"Measured, not argued"*. It is one
clause.

**Fix:** end the sentence at *"…the property of two branches"*, or make
the tail conditional — *"and a merge in which BOTH sides wrote it
resolves by hand"*. Then the two copies stop disagreeing (see finding 2).

---

## The hand-assembly walk — my own, on T-096, before reading the notes

Target: **T-096** (`planned`, F-02, **size S**, `touches: [lib-parser]`),
read from `main`. Walking the 13 rows literally and recording every place
*I* had to decide something the table did not:

| row | resolved from its named source? | what I had to decide |
|---|---|---|
| 1 Role | partly | the table never says WHICH role it is for. Rows 4 and 11 are executor-only; a verifier brief built from these 13 rows is wrong. "in one line" has no extraction rule (I used the role file's first prose line) |
| 2 Task | **yes** | — |
| 3 Read-first | **no** | the column says `adapters/*.md`; that is the KIT TEMPLATE dir, with `<project name>` placeholders, and it holds TWO files (`CLAUDE.md`, `AGENTS.md`) with no selection rule. The real source is the copied-to-root `CLAUDE.md` |
| 4 The lane | **no** | the column says `lane-protocol.md`; that file says *"Nothing in this file is a project's actual name."* Branch pattern, worktree path and the `git worktree add` command exist only in CONVENTIONS, which the column does not name |
| 5 The fence | **no** | the two named sources DISAGREE right now: board says **0** building, `git worktree list` says **5** `task/` lanes (T-013/T-064/T-070/T-089 `planned`, T-061 `done` with its worktree still live mid-integration). The precedence rule exists — in CONVENTIONS, unnamed by this row. And disjointness across `[lib-parser]` (slug) vs `[method/, docs/CONVENTIONS.md]` (paths) needs the slug map at `docs/ARCHITECTURE.md:26` + `docs/architecture/components/*.md` `touch_slugs:`, also unnamed |
| 6 Setup | **no** | the column says "the CONVENTIONS **build section**". The load-bearing new fact — `npm run build` from app/ before `npm test`, worth 12 red bodies — is in the LANE PROTOCOL section |
| 7 Commands | partly | no scoping rule. All four packages, or only the fenced ones? Row 8 has an explicit DERIVE instruction; row 7 has none |
| 8 Gates | partly | "standing gate" is not enumerable from CONVENTIONS by any marker — `grep -i gate` returns AUDIT GATE POLICY, GRAPH-CURRENCY GATE, BOOT GATE, DOCS GATE and the token lint. I knew the answer is three; the table does not say how |
| 9 Disciplines | partly | same class, and overlaps row 10 |
| 10 Prohibitions | **conflicts with rule 2** | requires live-environment figures (port holders, pids). Rule 2 stamps every figure with *the REF it was measured at* and says a figure is *"a function of a tree"*. A pid is not. My own brief carried "app pid 85379, vite 82549" with no ref of any kind, and rule 3 ("the repository wins") cannot adjudicate a pid |
| 11 Deliverable | **no, and CONTRADICTS on size S** | see finding 3 |
| 12 The report | **no — the source is empty** | `executor.md` step 6 is *"Commit… Set status… Stop."* There is no report spec in this role file or in `orchestrator.md`. Row 12's own "if absent" column says *"the work lands and the record does not"* — the row is present and still does not prevent it |
| 13 Corrections | **yes**, self-sourcing, and honestly so | — |

**The card's own assembled brief confirms this independently, which is
the strongest form of the finding.** It does not obey its own source
column on four rows and does not say so: row 3 says *"Per `CLAUDE.md`"*
(not `adapters/*.md`); row 4 uses CONVENTIONS' spellings and command; row
6 cites *"(CONVENTIONS, lane bullet)"* by name; row 12 is a bespoke list
derived from the CARD. The table is transcribable by a session that
already knows this project. **It is not transcribable off the source
column, which is what a program has.** Filed as `T-089-s7`, not folded
into the rejection — criterion 1 asks for a normative table with each
row's source, and every source the criterion enumerates is present.

Two things the walk found that the card's M-sized target could not:

- **T-096 is size S, and no role can finish a size-S card.** Ceremony
  table: *"S | executor + tests. No verifier, no separate integrator."*
  `lane-protocol.md` rule 4: the executor never merges. Rule 6: *"The
  integrator removes the worktree. The executor never removes its own."*
  Row 11 names both sources and they contradict. Rule 4's ban pre-existed
  as *"Never touch main"*; rule 6 is new and closes the last exit.
  `T-089-s8`.
- **At `ea7ea0a` there was no legal base at all** under the old letter —
  main's tip was a merge with no checkpoint on it. The new *"read the
  reason, not only the sentence"* text is what makes dispatch possible
  there, and it earns its place. See finding 5 for where it overreaches.

**Dispatchability of the card's own T-085 brief, judged rather than
accepted.** It passes, and its best moment is that it REFUSES: row 5
derives `T-061` holding `tools/e2e` and concludes NOT DISPATCHABLE. Rows
1–7 and 9–13 all resolve to files in the repository. Two exceptions:
row 8's 123 (BLOCKING 1), and row 7's *"not `--all-targets`, which skips
doc-tests"*, which appears nowhere in CONVENTIONS — a second, minor
breach of governing rule 4 by the table's own worked example.

---

## My ruling on the two copies, and on the six rules

**Which copy is authoritative: nothing says, and the very first
application of rule 4 produced two copies that already differ.** The
stamp rule lives in `TASK-FORMAT.md` (the field's home) and
`orchestrator.md` 5b (the role that performs it). Governing rule 4
*requires* the duplication — *"Nothing in the brief may be the only copy
of itself"* — but the method has no companion rule for precedence, and
rule 3 ("the repository wins") is inert when both copies ARE the
repository. They differ twice at birth: TASK-FORMAT adds the falsified
*"and every merge resolves it by hand"* (BLOCKING 2), and orchestrator
says *"cut the lane FROM THAT COMMIT"* where TASK-FORMAT says only
*"BEFORE the lane's branch is cut"* — not the same constraint, though
both are merge-safe. **Ruling: TASK-FORMAT is authoritative for the
FIELD and orchestrator.md for the ACT, and neither file says so.** That
gap is rule 4's missing half and belongs in `T-089-s7`.

Coherence in the card's favour, since it cuts the other way too:
orchestrator 5b's *"cut the lane from that commit"* makes the lane's base
a dispatch-stamp commit — a non-merge, non-checkpoint commit. That is
legal only because of the CONVENTIONS relaxation this same card writes,
and `lane-protocol.md` rule 2 already permits it generically. The two
changes need each other and fit.

**The six rules, each judged falsifiable-or-norm:**

1. *Transcription, not summary* — falsifiable (diff each row against its
   source). **Falsified today on rows 3/4/6/12 by the card's own brief.**
2. *Every figure carries its ref* — falsifiable, and the sharpest rule
   here. Breaks only on row 10's environment figures, which are not
   functions of a tree.
3. *A brief is evidence, never authority* — **NOT decoration, and I
   attacked it hardest.** It does two things nothing else does: it names
   a PRECEDENCE (repository over brief) and an OBLIGATION (say so in
   writing). Row 13 is its operational half; the rule is the tie-break
   the row does not state. Observable difference: a session under it
   produces a corrections list. This card produced ten, three of which
   corrected its own dispatch brief. Rule stands.
4. *Nothing may be the only copy of itself* — falsifiable, and it is the
   dispatchability test correctly transposed. Incomplete: it mandates
   redundancy and supplies no precedence for divergent copies (above).
   Breached twice by the worked example (row 7's `--all-targets` claim;
   row 8's 123, which is worse than uncopied — it is contradicted).
5. *A criterion outside the fence is NOT built* — falsifiable by
   behaviour, and applied to this card's own criterion 5 (see below).
6. *The verifier-blindness conflict* — explicitly a recorded conflict,
   not a rule, and correctly so. See finding 9.

**Criterion 1's conditional is satisfied, and NOT quietly resolved.** The
clause records both sentences verbatim, says *"Both cannot hold"*, and
routes. Its interim constraint — *"the brief carries nothing addressed to
the executor alone"* — is a partial ruling on the BRIEF half, but it is
stated, labelled *"Until it is ruled"*, and is the only interim that
forecloses none of `T-089-s2`'s four arms. The notes conflict
(`executor.md` step 5 vs `verifier.md` line 3) is left open, which is
what the criterion asked.

---

## Findings — not blocking, each concrete

1. **`T-089-s4` duplicates `T-061-s2`.** Same body, same line 145, same
   mechanism, same fix. Honest — `T-061-s2` was not in this lane's tree
   at `4d2f03c`. **Reproduced here from a third target**, and it is real:
   `token-scan.spec.ts` alone on the clean lane tip is **8 passed, exit
   0**; append one comment line to `method/README.md` and leave it
   uncommitted → **7 passed / 1 failed, exit 1**, `Error: all seven plant
   targets restore to an empty diff / Expected: 0 / Received: 1` at line
   145, with all seven sha256 assertions above it PASSING. Restored;
   `method/README.md` sha256 back to `255cedba…`, tree clean, re-run **8
   passed**. Two suggestion cards for one defect will reach triage
   together — absorb one.
2. **Rule 4 has no precedence half.** Above.
3. **The size-S hole.** Above. `T-089-s8`.
4. **The bump is a FOUR-place fact and the account names three.**
   `docs/CONVENTIONS.md:303` carries *"method/interview/plan-interview.md
   (v0.1.5, T-023)"*. No test reads it, so a bump leaves it stale and
   green. `T-089-s1`'s *"the whole edit is three literals"* would ship
   that.
5. **"a non-merge commit later than the checkpoint carries the
   checkpoint's graph and is equally safe" is a graph-only argument
   stated unqualified.** The premise is about `graph.json`; the same file
   documents the OTHER way a docs-only non-merge diff reds a code suite —
   `9c64cd8` and `fede266`, both single-parent, both `docs/tasks/*.md`
   only, both redded a suite through FRONTMATTER, which no graph argument
   covers. Checked rather than asserted: at the live candidate base
   `f306ee9` (19 cards added, 51 deleted, four commits after the
   checkpoint) `index --check --root ../..` is **exit 0**, *graph.json is
   CURRENT — 585305 bytes, 119 files, 1018 symbols, 1539 edges*, and all
   **136** cards' frontmatter parses with a legal status. Every non-merge
   first-parent commit on main from `2cf59da` to `9a8d523` is docs-only
   except the checkpoints. **The claim holds today by practice, not by
   property** — nothing forbids a source commit on main between
   checkpoints. Add *"whose gates are green — which for a docs commit
   means the DOCS GATE, not only the graph"*.
6. **"each naming the file it read" is true and misleading.** Both arms
   of the CONVENTIONS bump measurement name `plan-interview.md`, never
   CONVENTIONS. The thing that will cost the next editor a cycle — the
   ordering asymmetry — is in `T-089-s1` only, not in the bullet that
   editor is reading. Rule 4 applies to CONVENTIONS too.
7. **A citation-spelling nit in a card that legislates citations.** The
   notes anchor the 77 on `^[+-]status: building$`; `git log -G` matches
   diff content WITHOUT the `+`/`-`, so that literal returns **0**. The
   figure is right: `git log main -G'^status: building$' -- 'docs/tasks/*.md'`
   → **77**. Also re-derived: **25** `Dispatch T-NNN` commits, newest
   `c27c197` T-042 2026-08-17 01:56:07; **63** first-parent merges at
   `4d2f03c`.
8. **`T-090` did not exist in this lane's tree.** It was created on main
   at `f306ee9`, after the cut at `4d2f03c`; the notes say it was read
   there, so the reference is sourced. **Checked for contradiction and
   there is none**: T-090's criterion 5 says *"IF a spelling cannot
   preserve all four THEN the doc SHALL print one that does not use
   `xargs` at all"* — this clause pre-takes that branch. Its four
   promises (named command, CI step, spelling shared with `docs-gate.mjs`'s
   header, two-platform matrix) match T-090's criteria one for one, and
   this clause builds no matrix. Only caution: T-090's criterion 4 targets
   a sentence this commit already deletes, so T-090 needs a re-read at
   dispatch, not a rewrite.
9. **The blindness conflict has a third channel and no card.** Above.

---

## Everything re-derived, at my own refs

Suites at the lane tip `b416efb`, every exit from `$?` unpiped:

| suite | result | exit |
|---|---|---|
| `npx vitest run` from lib/parser | **263 passed (263)**, 12 files | **0** |
| `npx tsc --noEmit` from lib/parser | — | **0** |
| `npm run build` from app | built in 719ms | **0** |
| `npm test` from app | **840 passed (840)**, 43 files | **0** |
| bare `cargo test --no-fail-fast` from app/src-tauri | **352 passed / 0 failed / 3 ignored**, summed over **15** `test result:` lines | **0** |
| `npm test` from tools/e2e | **121 passed** | **0** |
| `npm run typecheck` from tools/e2e | — | **0** |
| `npm run lint:tokens` from tools/e2e | clean, **TOKEN 123 / CONTROL 598** | **0** |
| `node tools/e2e/scripts/docs-gate.mjs <14 paths>` direct | FIRES — 8 docs paths are code inputs, 4 suites owed, 11 derived readers, 0 frontmatter issues | **1** |
| `index --check --root ../..` | CURRENT, 585305 B / 119 files / 1018 symbols / 1539 edges | **0** |

Every one of the executor's stated figures reproduces: 263/263, 840/840,
352/0/3 over 15 lines, 121/121, CONTROL 598. **No kill-path flake this
run** — `the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`
passed; tally 1 of 1 green.

**Gate derivations, mine.** GRAPH REGEN — trigger is
`*.ts/*.tsx/*.js/*.jsx` outside `docs/`; **0** of 14 paths match, all are
`.md`; NOT OWED. BOOT GATE — trigger is `app/src-tauri/**`, `app/src/**`,
`app/package.json`, `app/src-tauri/Cargo.toml`; **0** of 14 match; NOT
OWED, and this sentence is the derivation. DOCS GATE — FIRES, exit 1, all
four suites owed and all four run above; re-run after this commit lands,
since it adds three more `docs/tasks` paths.

**The merge, forecast the prescribed way, every dot count stated.** Main
moved again during this verification — `ea7ea0a` → **`9a8d523`**
(*Checkpoint: T-061 done*), so the tip in my brief is stale by one:

    git merge-tree --write-tree 9a8d523 b416efb  -> tree 3b742201…, exit 0
    git diff --name-only 9a8d523 <TREE>   PRESCRIBED  -> 14
    git diff --name-only 9a8d523...b416efb  three dots -> 14
    git diff --name-only 9a8d523..b416efb   two dots   -> 105   FORBIDDEN

**No conflict.** 14 paths, **8** under `docs/` and **6** under `method/`,
identical to the executor's list. Against the previous tip `ea7ea0a` the
same three lines read 14 / 14 / **102** at tree `2bff6c36…` — only the
forbidden form moved, by main's three new paths, which is this rule's own
argument in miniature for a third time.

**xargs, re-measured, all six control cells.** Direct vs
`printf … | /usr/bin/xargs`:

| call | direct | piped |
|---|---|---|
| no arguments | **2** | **0** — utility never invoked (probe silent) |
| `--no-such-flag` | **2** | **1** |
| `docs/CONVENTIONS.md` | **1** | **1** |

Every cell matches the clause. The clause **names its platform** (Darwin
25.6.0, `/usr/bin/xargs`), **prescribes the direct call**, and **builds no
matrix** — it gives one collapse sentence and three control rows and
hands the two-platform matrix to T-090. Correct on all three counts, and
the T-084-s6 premise it replaces (*"BSD `xargs` runs the utility once even
on empty input"*) is indeed false: my probe printed nothing.

**The bump drill — five mutants, one side each, in a DETACHED scratch
worktree at `b416efb` with a scratch `CARGO_TARGET_DIR`.** Every mutation
read back with `git diff` before the run; every restore proved by sha256
against the drill commit and `git status --porcelain` empty at the end.
Pre-drill: `plan-interview.md` `e67c34b1…`, `CONVENTIONS.md` `5f37c301…`,
`kit.rs` `649c54de…`.

| # | mutation (SUBS) | exit | assertion that fired |
|---|---|---|---|
| M0 | none | **0** | `1 passed … 119 filtered out`; 13 result lines read, twelve at `0 tests`, none red |
| M1 | BOTH doc stamps → v0.1.6, const untouched (2) | **101** | `kit.rs:443` — *plan-interview.md … no longer stamps v0.1.5* |
| M2 | const → `"0.1.6"`, docs untouched (1) | **101** | `kit.rs:443` — *… no longer stamps v0.1.6* |
| M3 | = M2, inspected | — | **the CONVENTIONS assert never ran**: `grep -c "no longer says"` = **0** |
| M4 | const + plan-interview → v0.1.6, CONVENTIONS behind (2) | **101** | `kit.rs:450` — *docs/CONVENTIONS.md no longer says 'currently v0.1.6'* |
| M5 | CONVENTIONS stamp alone → v0.1.6 (1) | **101** | `kit.rs:450` — *… no longer says 'currently v0.1.5'* |

**The ordering asymmetry is characterized CORRECTLY** in `T-089-s1`, and
M2→M4 is the proof of its consequence: fix the file the panic names and
you get the SECOND red, not a green. CONVENTIONS' *"moving either stamp
alone reds that test by name"* verifies (M2, M5). Its *"each naming the
file it read"* is true and misleading — finding 6.

**Criterion 5's routing accepted, and the fence claim verified.**
`kit.rs` is under `app/src-tauri/src/agent/**` = C-14's `app-agent`;
`T-070`'s card declares `touches: [app-agent, app-interview]` and its
worktree `/Users/ujju/Projects/nputer-T-070` is live. The bump was
unbuildable inside `[method/, docs/CONVENTIONS.md]` under this card's own
rule 5. **The debt is stated where the next executor must meet it** — in
CONVENTIONS' first gotcha, the bullet a `method/` editor reads to learn a
bump is owed, with a delete-me instruction — not only in a finding file.
Correct placement.

**Board vs worktrees, at `9a8d523`.** T-013 `planned` · T-064 `planned` ·
T-070 `planned` · T-089 `planned` — four live lanes, zero stamps; T-061
`done` with its worktree still live mid-integration. Both of row 5's
sources are wrong in opposite directions right now, which is the card's
own premise holding and the argument for its ruling.

---

## What in my dispatch brief was wrong

- **"Pick a real planned card (say T-096 or T-100)"** — neither exists in
  this lane's tree; the maximum id at `b416efb` is **T-089**. They exist
  on main (created at `f306ee9`), which is where I read T-096.
- **"tip `b416efb`, cut from `4d2f03c`"** — correct.
- **"Main has T-061's merge on it now"** — stale by the time I ran:
  main is **`9a8d523`**, the checkpoint on top of that merge. Both
  forecasts stated above.
- **"14 paths, 8 docs / 6 method"** — reproduces at both main tips.
- **"the fresh-clone order needs `npm run build` from app/ before
  `npm test`"** — correct, and `T-089-s5` is accurate.
- **The brief relayed the executor's reasoning to me** (*"Its answer: one
  writer per line was luck there, not property"*). That is finding 9: the
  answer is right, and I should not have been handed it.


---

### The verdict commit's own gate run (T-081-s9)

The DOCS GATE fires on this verdict's three `docs/` paths, so everything
it owes was re-run AFTER `989731c` landed. Derived at that commit, with
main at `71f49cf` (*Merge T-064* — main moved twice more during this
verification, `ea7ea0a` → `9a8d523` → `71f49cf`):

    node tools/e2e/scripts/docs-gate.mjs <16 paths>   -> exit 1, 10 docs paths are code inputs, 4 suites owed

| suite | result | exit |
|---|---|---|
| `npx vitest run` from lib/parser | 263 passed (263), 12 files | **0** |
| `npm run build` from app | built in 754ms | **0** |
| `npm test` from app | 840 passed (840), 43 files | **0** |
| bare `cargo test --no-fail-fast` | 352 passed / 0 failed / 3 ignored over 15 result lines | **0** |
| `npm test` from tools/e2e | 121 passed | **0** |
| `npm run lint:tokens` | clean, TOKEN 123 / **CONTROL 600** | **0** |

CONTROL moves **598 → 600**, which is exactly the two finding files this
verdict adds; derive it at your own ref rather than quoting either.
The kill-path flake did not appear in either cargo run — tally **2 of 2
green** for
`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`.

Merge preview re-derived at `71f49cf`, every dot count stated:

    git merge-tree --write-tree 71f49cf 989731c  -> tree fae157ba…, exit 0
    git diff --name-only 71f49cf <TREE>   PRESCRIBED  -> 16
    git diff --name-only 71f49cf...989731c  three dots -> 16
    git diff --name-only 71f49cf..989731c   two dots   -> 124   FORBIDDEN

**Clean** at 16 paths — 10 under `docs/`, 6 under `method/`. GRAPH REGEN
and BOOT GATE remain NOT OWED at 0 of 16; every path is `.md`.

Drill hygiene: both scratch worktrees this verification created were
detached, at a commit, on a scratch `CARGO_TARGET_DIR`, and are removed.
