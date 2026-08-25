---
id: T-052
title: The pipeline must not kill the app — one checkout, two owners
feature: F-02
milestone: 4
priority: 8
size: M
status: verifying
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

> **@HUMAN RULING 2026-08-25 — THE TWO-CHECKOUT RECOMMENDATION IS
> ADOPTED, AND THE MECHANISM IS A DETACHED WORKTREE.** The card's
> `@human:` clause asked for a workflow choice; here it is, with the
> criteria @human gave, because the criteria change which arguments
> count: **"It doesn't bother me as a user if the app restarts. The only
> thing I'm concerned about is if something breaks or if development
> work suffers."** So the RESTART — the ladder's rungs 1–4 and 6 below —
> is explicitly NOT a cost, and every argument resting on it is void.
> What survives is rung 8 (a fresh install removing `node_modules` under
> the running vite: the one true BREAKAGE channel) and cargo's exclusive
> lock on `app/src-tauri/target/`, which the app and the pipeline share
> (the one true THROUGHPUT channel).
>
> **MEASURED BEFORE RECOMMENDING**, as the card's own criterion demands,
> at `765362e` on this machine: `app/src-tauri/target` **7.5 GB**, the
> three `node_modules` **330 MB** together, `.git` **46 MB**, free disk
> **420 GB**. Disk is not a constraint. The decisive figure is that
> solving the cargo contention WITHOUT a second checkout — giving
> pipeline runs their own `CARGO_TARGET_DIR` — costs that same 7.5 GB,
> so **full isolation costs about 400 MB more than the half-measure**.
>
> **THE MECHANISM IS `git worktree`, NOT `git clone`**, and this
> repository's own facts decide it: `git remote` returns **ZERO**
> remotes, so a clone would need a local-path origin and a second object
> store, while a worktree shares `.git` entirely. It cannot sit on
> `main` (git refuses a branch already checked out), so it is
> **detached**:
>
>     git worktree add --detach ../nputer-app main
>
> **HOW IT UPDATES — the question that decides the whole shape.** One
> command, run when the human chooses:
>
>     git -C ../nputer-app checkout --detach main
>
> No fetch, no pull, no remote: the object store is shared, so `main`
> is already there. **Being detached is the feature, not a wart** — the
> app's code CANNOT move on its own, so the pipeline may merge all night
> and the running app is untouched. And when the human does run that
> command, vite and `tauri dev` see the files change and reload exactly
> as they do today: **the second checkout does not stop the app
> updating, it puts the human in control of WHEN.** That is precisely
> the property the criteria ask for — restarts are fine, surprises are
> not.
>
> **THE APP STILL WATCHES MAIN, so the founding demo survives.** The app
> runs from `../nputer-app` but OPENS `/Users/ujju/Projects/nputer` as
> its project (⌘O). Code and watched folder are independent — @human
> demonstrated this accidentally on 2026-08-24 by running the app from
> the main checkout while it had `~/nputer-genesis-probe` open. So every
> merge still lands on the board live; only the app's own binary is
> pinned.
>
> **THE LANE PROTOCOL ALREADY ACCOMMODATES THE EXTRA ENTRY.** A
> permanent detached worktree appears in `git worktree list`, which
> lane-protocol rule 7 makes the authority on held fences — and that
> rule already says to read it as entries on a `task/T-NNN-*` branch
> rather than as a row count, with transient drill worktrees as the
> standing precedent. The app worktree is one more non-lane entry and
> needs no new rule, but the bullet SHALL name it so nobody counts it as
> a lane.
>
> **WHAT THIS DOES NOT EXCUSE.** The two safety rules the card already
> demands are ratified INDEPENDENTLY of the second checkout, because the
> human may be on one checkout at any moment and a rule that only works
> when the setup is right is not a rule: (1) the pipeline SHALL NOT run
> a fresh dependency install in a checkout serving a live dev server —
> detect and REFUSE LOUDLY, the T-046 form, never silently; (2) an
> integrator whose own work would disturb a running app SHALL record it
> in the checkpoint, which is the practice nine incidents already
> established. Rung 5's `lib/parser/dist` path and rung 9's stray probe
> file keep their criteria unchanged.
>
> **NOT YET CREATED, DELIBERATELY.** Five lanes were live when this was
> ruled, and adding a worktree entry while running lanes read that list
> as the fence authority is a needless perturbation. The setup is two
> commands (the `worktree add` above, then the fresh-clone ORDER from
> CONVENTIONS inside it) and belongs to a quiet tree.

Nine instances across 2026-08-16/17, escalating from cosmetic to
fatal. The project's founding demo is "open the app and watch nputer
build itself on its own board" — and the pipeline that does the
building repeatedly disrupts, and finally kills, the app doing the
watching. Both behaviours are correct in isolation. They share one
working tree.

**The ladder, as observed:**
1–4. Hot reloads and restarts under the human mid-review (T-037,
   T-041, T-049 merges wrote `app/src`; T-047 wrote Rust and the app
   restarted, pid 1753 → 8392).
5. A lib-only merge (T-030) rebuilt `lib/parser/dist`, which the app
   serves through the `file:` symlink — the board's model badges
   changed under the human with no file under `app/` touched.
6. T-042's merge changed behaviour but not appearance (JS moved, CSS
   byte-identical) — invisible drift.
7. **Fatal, mechanism A**: `tauri dev` watches `app/src-tauri` while
   git rewrites it mid-merge. The watcher fired between git's unlink
   and write, `cargo` read a tree with no
   `crates/nputer-index/Cargo.toml`, and the app **exited 101**.
   Captured verbatim in the relaunch log.
8. **Fatal, mechanism B (the likelier cause of the same death)**: the
   integrator discipline runs FRESH INSTALLS on merged main
   (`npm ci`), which removes `node_modules` under the human's running
   vite. T-014's integrator found 1420 free and both pids gone, and
   exonerated the boot check (its kill is process-group scoped).
   Cause recorded honestly as undetermined between this and "the
   human quit".
9. A `zz-scope-probe.ts` appeared in the MAIN checkout's
   `app/src-tauri/crates/nputer-index/` and triggered two rebuilds.
   Agents are fenced to worktrees; which session wrote it is
   **unknown**, and that is recorded rather than guessed.

**Why this is a method question, not a bug.** Every rule involved is
individually right: fresh installs prove a merge on a clean tree;
`tauri dev` must watch its sources; the human must be able to run the
app while work proceeds. The method has no rule about the shared
tree, so the collision is invisible until something dies.

## A tenth instance, and it is a CONFLATION rather than a kill (seventh triage, 2026-08-24)

**BOOT GATE's trigger set and the app-relaunch trigger set overlap but
are NOT the same set, and three checkpoints treated them as one.**
`tauri dev` restarts the binary on `app/src-tauri/**`; a change under
`app/src/**` goes to vite HMR and the window is never replaced. Two
merges this session relaunched the human's app at the
`git merge --no-commit` working-tree write (measured at ten and thirty
seconds before the merge commit); T-101's merge touched only `app/src`
and correctly did **not**, against a brief that predicted it would.
THE CARD SHALL state both sets and their difference where an integrator
writes the "what reached the human's app" section.

**Carry the measurement pitfall with it**: `ps | grep
'target/debug/nputer'` matches `nputer-index` as a substring, so an
integrator's own graph-gate run reads exactly like a relaunch — a fresh
start time on a second `nputer`. Anchor the match
(`awk '$NF=="target/debug/nputer"'`). One integrator caught this as a
near-false-positive in its own relaunch report.

## Acceptance criteria
- THE method SHALL state, where an integrator will read it, that the
  main checkout may be in use by a human running the app, and SHALL
  name what an integrator may do to it. At minimum the fresh-install
  step needs a rule: run it somewhere that is not the human's
  `node_modules`, or detect a live dev server and refuse loudly (a
  skipped gate is news, never silence — the T-046 form).
- THE rule SHALL cover the `lib/parser/dist` path too: a merge that
  touches no file under `app/` can still change what the running app
  serves, through the `file:` dependency symlink. A reader who only
  knows "my diff is docs-only" must still learn this.
- WHEN an integrator's own work would disturb a running app THE
  checkpoint SHALL record it — the pipeline already reports this
  faithfully nine times over, and the practice SHALL be ratified
  rather than left to each session's conscience.
- THE recommendation for the human SHALL be recorded with its
  trade-offs: a second checkout for the live app is the obvious fix
  and costs a second `node_modules` and a second Rust target dir
  (measured before recommending); the alternative is accepting that
  the app restarts when the pipeline merges.
- IF a probe or scratch file is ever written into the main checkout
  THEN the method SHALL name it a violation and say where such files
  belong — instance 9 has no known author, which is itself the
  argument for writing the rule down.

Verification: headless — the method text, plus a demonstration that
the fresh-install rule actually protects a running server (start one
on a scratch port, run the integrator sequence, confirm it survives
or refuses loudly). @human: whether to adopt the two-checkout
recommendation, which is a workflow choice only they can make.

## Implementation notes

Built by `claude-opus-5 @T-052` on branch `task/T-052-two-checkouts`,
base `c4cfe52`. Fence `[method/, docs/CONVENTIONS.md]`, **never widened**.
Every figure below was derived in this lane at its own ref.

### THE BUMP QUESTION, ANSWERED FIRST AND IN WRITING — NO BUMP IS TAKEN

The fence holds `method/`, so this had to be settled before anything was
written. **The answer is that no method FORMAT moved, so the version
stays at v0.1.5 and this is a two-file commit rather than a three-file
one.** It is derived, not asserted:

1. **CONVENTIONS' rule is about FORMATS**, not about method prose:
   *"Changes to method/ formats are version-bumped."* Every precedent
   this repository has is a structure that CODE reads or a PROGRAM
   transcribes — v0.1.4's suggestion-triage encoding, v0.1.5's stage
   to artifact table (*"normative and gets transcribed by programs"*),
   the status vocabulary that *"lives in exactly one place in code"*,
   and `executor.md`'s thirteen-row table, which declares itself a bump.
   **This change adds no table, field, status, template or vocabulary
   term.** It is prose rules in two role/protocol files.
2. **NEITHER FILE I TOUCHED SHIPS IN THE KIT.** `KIT_FILES` in
   `app/src-tauri/src/agent/kit.rs` is fourteen entries — the planner's
   driver-contract set — and its header says the other role files are
   *"Deliberately NOT included"*. `method/roles/integrator.md` and
   `method/lane-protocol.md` are both outside it, so the hazard T-104
   names (*"a version that lies about what shipped"*) is structurally
   absent here. Checked mechanically against the `include_str!` table
   rather than by eye.
3. **NO CODE READS EITHER FILE.** `git grep` for `method/roles` and
   `lane-protocol` over `*.ts *.tsx *.mjs *.js *.rs *.yml *.json`
   returns only `planner.md` references. The full set of method paths
   any code names contains neither file.
4. **THE THREE PINNED STAMPS ARE UNTOUCHED** and proved so: `git diff`
   matches no line containing a version number, and `cargo test` is
   **418 passed / 0 failed / 3 ignored at exit 0** over 15
   `test result:` lines, which includes
   `snapshot_version_matches_the_live_method_stamps` reading the edited
   `docs/CONVENTIONS.md` off disk.

**THE RESIDUAL IS ROUTED RATHER THAN DECIDED, because two live tests
disagree and a lane may not settle a method ruling.** T-104's own
criterion asks whether a change is a CLARIFICATION or a NEW NORMATIVE
SENTENCE, and by that test the fresh-install rule is new: `integrator.md`
said nothing about dependency installs, and `lane-protocol.md` rule 4's
install prohibition binds the EXECUTOR, not the integrator. By
CONVENTIONS' own test (a FORMAT) it is not a bump at all. **Both cannot
be the trigger.** T-104 already owns the owed v0.1.6 payment (it absorbs
`T-089-s1`) and is the only planned card whose fence carries `app-agent`,
so it is the seat that can answer this and pay it in the same commit.
**The debt is per-VERSION, not per-change** — one three-file commit
discharges T-089's method change, this one and T-104's own — so nothing
is lost by routing it, and the ruling is recorded here rather than left
silent, which the card's sibling criterion explicitly requires of the
not-moving case.

The addition to `lane-protocol.md` rule 3 is deliberately on the safe
side of that line: it is a clarification of a sentence already there,
attached to a live instance, and it adds no rule.

### Criterion by criterion

- **THE method SHALL state, where an integrator will read it, that the
  main checkout may be in use — MET.** `method/roles/integrator.md`
  gains a section, "The checkout you merge into may be in use", with
  four numbered rules, reached from step 2 (the suite/install step) and
  step 3 (the checkpoint list). **The existing steps are NOT renumbered**
  — T-089's own table cites them by number and a renumber would silently
  falsify those citations. The section opens by separating INTERRUPTION
  from BREAKAGE, because @human's criteria make that distinction
  load-bearing and treating the two alike is what gets the trade wrong.
  Rule 1 is the fresh-install rule in the T-046 form: detect, refuse
  loudly, name the skipped step and the evidence — with both wrong
  repairs named (do not continue anyway, do not kill the process) and
  the requirement that the check be shown to let the ordinary case
  through, which is CONVENTIONS' NEGATIVE ASSERTION rule applied to a
  procedure. The nputer mechanisms are in `docs/CONVENTIONS.md`, not in
  `method/`, per that file's own first gotcha.
- **THE rule SHALL cover the `lib/parser/dist` path — MET, and
  DEMONSTRATED.** `integrator.md` rule 2 states it generically (a path
  dependency, a symlink, a generated bundle) and refuses the
  docs-only excuse by name. CONVENTIONS carries the mechanism. **Proved
  end to end rather than argued**: `app/node_modules/@nputer/parser` is
  a symlink to `../../../lib/parser`, and a marker line appended to the
  gitignored `lib/parser/dist/index.js` was **served by the running app**
  at `/node_modules/@nputer/parser/dist/index.js` (HTTP 200, 7738 bytes,
  marker present) while `git status --short -- app/` stayed at **0 rows**
  throughout. Restored by rebuilding the parser (exit 0, marker gone).
- **WHEN an integrator's own work would disturb a running app THE
  checkpoint SHALL record it — MET.** `integrator.md` rule 3, and it
  carries the tenth instance's content rather than only the practice:
  say WHICH change reached the app and which did not, because a product
  that reloads on one path set and restarts on another has TWO trigger
  sets. CONVENTIONS names this repository's three sets and their
  differences, and carries the anchored-`awk` pitfall — with the
  addition that the anchored and unanchored forms AGREE when no index
  run is in flight, so a quiet reading is not evidence the hazard is
  absent (measured here: both forms returned only pid 82593).
- **THE recommendation SHALL be recorded with its trade-offs — MET.**
  @human's ruling of 2026-08-25 is written into CONVENTIONS with the
  quoted criteria, the detached-worktree mechanism, the `worktree add`
  setup and the one-command update, the zero-remotes fact that picks
  worktree over clone, and the still-watches-main property that saves
  the founding demo. **No digits are transcribed**, deliberately: the
  ruling's own figures moved between its ref and this one (`target/`
  7.5 GB at `765362e`, **8.6 GB** here; `.git` 46 MB, **50 MB**; free
  disk 420 GB, **410 GB**; the three `node_modules` **330 MB**,
  unchanged), and CONVENTIONS already forbids writing counts it does not
  derive. The decisive trade is recorded as a RELATION instead, which
  does not go stale.
- **A probe or scratch file in the main checkout SHALL be named a
  violation — MET, and it acquired a live instance.** CONVENTIONS names
  it, says where such files belong, and says to record-and-leave rather
  than delete, because provenance is evidence. **The rung-9 example now
  has a sibling with an author**: three live lanes are checked out under
  `tools/` instead of beside the repo root, the mechanism is a relative
  worktree path resolved against an unverified cwd, and the blast radius
  was measured rather than feared (staging surface only). Filed as
  `T-052-s2`; the in-fence half — a clarification to
  `method/lane-protocol.md` rule 3 naming the mechanism and the remedy —
  is built.

### The demonstration the verification clause asked for

Run on scratch port **15140** (`lsof` first, then bind-confirmed FREE on
`127.0.0.1`, `0.0.0.0`, `::1` and `::`, and free again afterwards), with
a real vite serving this lane's own `app/`. **Three parts, and the
control is one of them.**

**THE POSITIVE CONTROL FIRST.** With nothing on the port the sequence
PROCEEDS at exit 0. Without this, a later refusal cannot be told from a
check that always refuses — CONVENTIONS' own NEGATIVE ASSERTION rule.

**THE RULE WORKS.** With the server up, `lsof -nP -iTCP:15140
-sTCP:LISTEN` returns the holder, the sequence REFUSES at exit 3 naming
the skipped step, the evidence and what has to happen first; `npm ci`
does not run; `app/node_modules` is byte-identical afterwards (inode and
mtime unchanged); the server answers 200 and keeps its pid and start
time.

**AND THE HAZARD IT GUARDS IS HALF REFUTED, WHICH IS THE FINDING.** With
the guard removed and `npm ci` run underneath, the floor
(`app/node_modules/vite/package.json`) went ABSENT for **12 consecutive
100 ms samples** while the server answered **200 on all 51 samples**,
same pid and start time, and a simulated full reload afterwards resolved
every dependency URL. **A running vite survives `npm ci`.** What is
destroyed is `node_modules/.vite`, which is deleted and not recreated,
so a surviving process serves from memory over a tree that no longer
matches it. The rule therefore stands on the WINDOW rather than on a
kill — the stronger footing, since the card records instance 8's cause
as undetermined and this does not make it determined. Corrected in place
in CONVENTIONS and routed as `T-052-s3` with the untested candidates
(the tauri CLI's own package, the cargo lock), because the app is
`tauri dev` and not vite alone.

**A DOCUMENTED HAZARD RE-DERIVED BY ACCIDENT**: vite bound `[::1]:15140`
and nothing on IPv4, so the first IPv4 probe reported the server down
while it was serving. That is CONVENTIONS' PORT RULE finding for 1420,
reproduced on a scratch port — and it is why the rule as written says to
ask the operating system rather than to connect.

### The drill, and why none is owed

**NO POISON DRILL WAS RUN, AND THAT IS THE ANSWER RATHER THAN AN
OMISSION.** The POISON DRILL bullet fires *"at any task that ADDS OR
CHANGES a test body"*. This diff adds and changes **zero** test bodies:
it is two method files, `docs/CONVENTIONS.md`, this card and three
suggestion files. Derived from the diff rather than recalled — no path
under `app/test/`, `tools/e2e/tests/`, `lib/parser/test/` or any
`#[cfg(test)]` block appears in it. The demonstration above is not a
drill and is not claimed as one.

What stands in for it is the parity instrument. The middle-dot trap
governs any edit near the "Build & test" section, so the derivation was
run BEFORE the edit and again after: **21 exposed commands
(lib/parser 4, app 5, app/src-tauri 5, tools/e2e 7), 19 derived steps, 0
problems, 0 structural problems** — identical on both sides. The new
prose sits in `## Gotchas`, which `buildAndTestSection` cannot reach: it
splits on `^## ` and takes the "Build & test" section alone. **No
command was added to a `run from` bullet, so no `CI_SEQUENCE` entry and
no `ci.yml` step are owed** — which matters because `.github/` is
outside this fence and a needed CI step would have had to be routed.

### Gates, derived from this lane's own diff at its own ref

Main moved under this lane, `c4cfe52` to **`ce8b8e7`** (one first-parent
commit, one path — T-110's room resolution). Every gate below is derived
against that tip, never against the base.

    TREE=$(git merge-tree --write-tree ce8b8e7 HEAD)   -> exit 0, READ FIRST
    git diff --name-only ce8b8e7 "$TREE"               -> 8 paths

| gate | trigger | on these paths |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — NOT OWED** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES**, four suites |

- **GRAPH REGEN — NOT OWED, and ASKED ANYWAY** as its own bullet
  demands. `index --check --root ../..` is **exit 0, CURRENT** at
  **895 891 bytes / 172 files / 1889 symbols / 1849 edges**, unmoved from
  T-079's checkpoint. This fence cannot produce a matching suffix, and
  `docs/` and `method/` are both outside the walk — but that is the
  answer the gate gave, not a prediction it was spared.
- **BOOT GATE — NOT OWED, 0 paths.** No `app/src-tauri/**`, no
  `app/src/**`, neither manifest. `npm run boot:check` was therefore NOT
  run, and that is derived rather than skipped: a boot check on a
  method-and-docs diff would be a gate run against a lane it does not
  apply to.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the merged paths as
  ARGUMENTS, root-relative, never through `xargs`. It reports **12
  derived readers across 4 suites** and **0 frontmatter issues**, and
  names all four suites owed.

### Suites, every exit read from its own unpiped `$?`

- **cargo: 418 passed / 0 failed / 3 ignored, exit 0**, summed over
  **15** `test result:` lines. This is the suite that reads the edited
  `docs/CONVENTIONS.md` off disk, so it is the version-stamp proof.
  **`T-088-s4`'s watcher flake did NOT fire** in this run.
- **parser: 264/264 across 12 files, exit 0.**
- **app: 958/958 across 46 files, exit 0**, after `npm run build` exit 0.
- **E2E: 145/145, exit 0** on scratch port **15143** — after a first run
  on **15141** went **144 passed / 1 failed at exit 1** on a body this
  diff does not touch. See below; filed as `T-052-s4`.
- **token lint: selftest exit 0** (65 TOKEN + 4 CONTROL samples, 87
  walk-policy checks, 9 evidence-floor checks), **lint exit 0** at
  **TOKEN 131 / CONTROL 660**. CONTROL is 660 rather than T-079's 655
  because this lane adds four tracked docs files to a tree that had
  already gained one; derive it at your own ref.
- **`npm run lint:docs` exit 0**, run the way CI will run it.
- **`npm run typecheck` exit 0.**

### The one red, characterised rather than re-run away

`tools/e2e/tests/token-scan.spec.ts`'s P6 plant-and-restore body failed
on the first full E2E run. **It is not this lane's**, derived rather than
asserted: the merge forecast contains **zero** `tools/e2e/**` paths and
the worktree was clean at 0 rows. **And it is not a flake** — it is a
deterministic function of one file's mtime precision. The body restores
with `utimesSync(target, clock.atime, clock.mtime)`, where `clock.mtime`
is a `Date` and therefore integer milliseconds, and then asserts against
`clock.mtimeMs`, which carries the filesystem's finer resolution. Proved
both ways: **three consecutive green runs** with a whole-millisecond
mtime, and a **named red** with a fractional one set deliberately, the
same Expected/Received pair each time. It hides itself because its own
`finally` writes a whole-millisecond mtime, so the next run is green —
the red-green signature `T-079-s3` already records one level up. The
fixture was left sha256-identical to `HEAD:tools/e2e/fixtures/shell.ts`
(`2e55d8e5…`) with a whole-millisecond clock. Routed as `T-052-s4` with
the one-token fix and the probe that shows it round-trips.

### The ruling stopped being a recommendation while this lane ran

**@human switched to the second checkout mid-lane, so the card's own
proposal is now an observed property rather than an argument.** Read
from outside the app, read-only, and NOT guessed from a restart:

- the app's pid and start time changed between two `lsof`/`ps` reads
  (82593 started 03:17:33, then 89201 started 10:54:33), and **the cause
  is measured rather than inferred** — `lsof -p 89201` puts the binary at
  `/Users/ujju/Projects/nputer-app/app/src-tauri/target/debug/nputer`
  with cwd in that checkout, and the vite holding 1420 has
  `/Users/ujju/Projects/nputer-app/app` as its cwd. **The app moved
  house; it was not killed.** This is exactly the distinction rule 3 of
  the new method section asks an integrator to make instead of reporting
  a pid change as a disturbance.
- **THE PINNING PROPERTY HOLDS, LIVE.** The running app sits at the
  detached `c4cfe52` while main advanced to `ce8b8e7` — one commit the
  integration branch has that the running app does not — and the app did
  not move when main did.
- **THE THROUGHPUT CHANNEL IS CLOSED, MEASURED.** The MAIN checkout's
  `app/src-tauri/target/` mtime stayed at **04:16:09** through a session
  in which this lane ran `cargo test` twice and `index --check` once
  (its own target dir, 11:09:49) and the app checkout built its own
  (10:44:56). Three checkouts, three target directories, no contention —
  which is the second of the two channels @human's ruling names.
- **AND THIS LANE DID NOT DISTURB IT.** Port 1420 was read with
  `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else, before, during and
  after — no bind, no connect, no signal. Every scratch server ran on
  15140-15144, each `lsof`-checked then bind-confirmed on `127.0.0.1`,
  `0.0.0.0`, `::1` and `::` before use and free again after, and each was
  stopped by its own exact pid. No `pkill` at any point.

Recorded in CONVENTIONS as a RELATION rather than as commit hashes, so it
stays true; the hashes are here, where a dated note belongs.

### Where the brief and the card were wrong

- **The worktree path.** The brief said `/Users/ujju/Projects/nputer-T-052`.
  The repository says **`/Users/ujju/Projects/nputer/tools/nputer-T-052`**
  — inside the repository, which `method/lane-protocol.md` rule 3
  forbids. Found by `git worktree list` before anything was written, and
  independently confirmed by the dispatcher mid-lane. Not moved: moving
  a worktree under a running session is this card's own hazard. See
  `T-052-s2`.
- **The brief said not to create `../nputer-app`, and it exists.** It was
  created on 2026-08-25 while five lanes were live, detached at
  `c4cfe52` — verified here by `git worktree list` rather than taken on
  report. This lane did not create it. Two sentences drafted against the
  brief's premise ("not yet created", "at this commit it does not exist
  yet") were **falsified within the hour and are corrected in place**;
  the correction is the durable half — a worktree's existence is a
  live-environment fact and a doc must not claim one.
- **@human's ruling mislocates the lane-list clause.** It says
  *"lane-protocol rule 7 ... already says to read it as entries on a
  `task/T-NNN-*` branch rather than as a row count"*. That sentence is
  in `docs/CONVENTIONS.md`'s LANE PROTOCOL bullet; `lane-protocol.md`
  rule 7 says only that the lane list is a fact on disk. The ruling's
  instruction (*"the bullet SHALL name it"*) was therefore executed
  against the CONVENTIONS bullet, which is where the text it describes
  actually lives, and no rule was added to `lane-protocol.md` for it —
  the ruling says none is needed.
- **The brief's bump framing is T-104's, not CONVENTIONS'.**
  "Clarification versus new normative sentence" is T-104's own criterion;
  CONVENTIONS' trigger is a FORMAT change. The two disagree on this
  diff. See the bump answer above.
- **The card's instance-8 mechanism does not reproduce.** See the
  demonstration.
- **STATE.md's lane table is two lanes; the repository has five plus two
  detached entries.** STATE was written at T-079's checkpoint and lists
  T-110 and T-033 only. Derived at this tip: T-033, T-110, T-052, T-120,
  T-124 on task branches, plus `nputer-app` and `drill-T-120` detached.
  This is the board-versus-worktree-list asymmetry CONVENTIONS already
  rules on, working as intended — recorded because a reader of STATE
  would otherwise under-count the live fences by three.

## Verdicts
