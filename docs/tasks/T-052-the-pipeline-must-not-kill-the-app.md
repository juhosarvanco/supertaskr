---
id: T-052
title: The pipeline must not kill the app — one checkout, two owners
feature: F-02
milestone: 4
priority: 8
size: M
status: done
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-052
verified_by: claude-opus-5 @T-052-verify — APPROVED, 2026-08-25
review: same-model
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
(`2e55d8e5…`) with a whole-millisecond clock.

**AND T-120'S LANE FOUND IT INDEPENDENTLY IN THE SAME HOUR**, filed as
`T-120-s3` on main at `e5a8f6a` — found after this lane's own diagnosis
was already written, which is how it is known to be independent. That
account is FULLER (a 50-of-50 probe, a three-checkout table, the fix)
and is the primary one. **`T-052-s4` was rewritten down to the single
thing it adds rather than shipped as a duplicate**: `T-120-s3` concludes
the fix needs a fresh checkout to prove, because a healed worktree
cannot re-red — and this lane reproduced it ON DEMAND in an
already-healed worktree by setting the fixture's mtime to a fractional
millisecond, three greens then a named red. That removes the
fresh-worktree prerequisite from whichever card takes the fix. **Two
lanes paying a diagnosis for the same defect in one evening is itself
the argument for dispatching it.**

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

### 2026-08-25 — `claude-opus-5 @T-052-verify` — **APPROVED**

Bounded read taken by the ref: the card at **`c4cfe52`**
(`git show c4cfe52:docs/tasks/T-052-the-pipeline-must-not-kill-the-app.md`),
attack designed AND RUN from that copy alone; the Implementation notes
above were read only afterwards, to check the evidence half. Every figure
below is re-derived at my own refs. Nothing in the dispatch brief was
taken as authority.

**THE DIFF — PRE-MERGE FORM, AT TWO TIPS, BECAUSE MAIN MOVED UNDER ME.**
`merge-tree`'s exit was read BEFORE the substitution was used, both times.

    TREE=$(git merge-tree --write-tree e5a8f6a 966b8dd); rc=$?   -> 0
    git diff --name-only e5a8f6a b0bbc71d…                       -> 8
    TREE=$(git merge-tree --write-tree 1223543 966b8dd); rc=$?   -> 0
    git diff --name-only 1223543 a49291ee…                       -> 8

Main advanced `e5a8f6a` → `1223543` (T-120's checkpoint and T-110's
merge) while this verification ran and the forecast stayed **8 paths and
clean**. Cross-checks at my first tip: `c4cfe52...966b8dd` (three dots)
**8**, `c4cfe52..966b8dd` **8**, `c4cfe52..e5a8f6a` (main's advance)
**6**, and the FORBIDDEN `e5a8f6a..966b8dd` **14** — 8 + 6 = 14, the
arithmetic that shows the two sets disjoint and the forbidden form
overstating by 1.75x. `merge-tree` reads COMMITS; the DOCS GATE below
reads the INDEX, so the gate was handed the 8 paths as arguments from the
lane's own clean worktree (`git status --short` = 0 rows) rather than
from a range.

**ZERO CODE PATHS, VERIFIED AGAINST THE DIFF RATHER THAN ACCEPTED.**
`git diff --name-only … | grep -E '\.(ts|tsx|js|jsx|mjs|rs)$'` returns
**0**; no `package*.json`, no `Cargo.*`. **NO POISON DRILL IS OWED** and
none was run. Security sweep: eight markdown files, no new input path, no
endpoint, no dependency, and a grep for key/token/secret shapes over the
added lines returns nothing.

#### 1. THE BUMP QUESTION — RULED INDEPENDENTLY: **NO BUMP IS OWED.**

I reached the lane's answer by a different route and it holds on
structure rather than on taste.

- `METHOD_SNAPSHOT_VERSION` is documented in `kit.rs` as *"The method
  version this snapshot was taken at"*, and the SNAPSHOT is `KIT_FILES`
  — fourteen entries, enumerated `include_str!`s. **Neither edited file
  is one of them**, and the directory-walk that forces new files into the
  table, `the_snapshot_table_covers_every_method_scaffold_file`, walks
  exactly `["docs-templates", "adapters", "tasks"]` — **not `roles/` and
  not the top-level `lane-protocol.md`**. So no compiled byte, no
  `kit.json` `files` entry and no materialized kit moves with this diff.
- CONVENTIONS' trigger is *"Changes to method/ **formats**"*. This diff
  adds no table, field, status, template or vocabulary term.
- **THE T-089 PRECEDENT DOES NOT CUT THE OTHER WAY, AND THAT IS THE
  ONE THING WORTH CHECKING**, because CONVENTIONS says in terms that
  *"T-089's OWN CHANGE TO method/ IS THEREFORE OWED A BUMP TO v0.1.6"*
  and T-089 edited `integrator.md` — the same file this card edits.
  Derived from T-089's merge rather than from the sentence:
  `git diff --name-only 4f25183^1 4f25183 | grep '^method/'` is **6
  paths**, and one of them is **`method/tasks/TASK-FORMAT.md`, which IS
  in `KIT_FILES` and IS a format file**. T-089's debt is fully explained
  by that path; it implies nothing about a role-file-only edit.
- Proved live rather than argued: `cargo test` is **418 passed / 0
  failed / 3 ignored at exit 0** over **15** `test result:` lines,
  including `snapshot_version_matches_the_live_method_stamps`, which
  reads the EDITED `docs/CONVENTIONS.md` off disk and still finds
  `currently v0.1.5` (line 266, untouched by this diff).

The fence therefore does not need `app-agent` and the card is complete
in fence. The lane's routing of the residual to T-104 is the right
disposition and I do not disturb it.

#### 2. THE RUNG-8 REFUTATION — **INDEPENDENTLY REPRODUCED, AND IT IS UNDER-CLAIMED RATHER THAN OVER-CLAIMED.**

The claim that a card's own fatal instance does not reproduce deserved
the hardest attack in this pass, so it got one built from the axes a
200-on-the-index cannot reach: a COLD module, an HMR round trip,
`/@vite/client`, a warm optimized dep, and NEW dependency discovery.
Run in a detached scratch worktree **outside** the repository,
`/Users/ujju/Projects/drill-T-052-verify` at `966b8dd`, installed by
CONVENTIONS' own fresh-clone order, on scratch port **15180**
(`lsof` first, then bind-confirmed on `127.0.0.1`, `0.0.0.0`, `::1` and
`::`, free again after). **Port 1420 was never bound, connected to or
signalled.**

**ARM 1 — a real `npm ci` underneath a real vite.** 25 samples at 100 ms
across the install (`npm ci` exit **0**, 2634 ms). The floor
`app/node_modules/vite/package.json` was ABSENT for **11 consecutive
samples** (t = 317 ms → 1377 ms). During those 11: index **200×11**,
`/@vite/client` **200×11**, a warm optimized dep **200×11**, a **COLD
source module never fetched before 200×11** (104 843 bytes on the first),
and an HMR-shaped `?t=` re-request **200×11**. Same pid (96540), same
start time, same socket. A cache-busted full reload afterwards: **81
modules, zero non-200**, with `node_modules/.vite` **still absent** —
which independently confirms the lane's sharpest sentence, that the
optimize cache is deleted and NOT recreated.

**ARM 2 — the window HELD OPEN, because 1.1 s is too short to prove
anything.** `npm ci`'s destructive half reproduced as an atomic rename
(`node_modules` → `node_modules.away`), held **4094 ms**, floor verified
absent at three points (immediately, after the probe loop, and after a
further 4 s hold). While `node_modules` did not exist at all:

| probe | result |
|---|---|
| 44 cold source modules, none previously fetched | **44/44 = 200**, 1 526 242 bytes total |
| 8 optimized-dep URLs discovered *during* the window | **8/8 = 200**, incl. `radix-ui.js` at 648 366 bytes |
| index, `/@vite/client`, `?t=` HMR re-request | 200, 200, 200 |
| 5 cache-busted re-requests after the 4 s hold | 5/5 = 200 |
| **negative control** `…/deps/lucide-react.js` (no `?v=`) | **404**, with vite's own message |

Same pid (7397) and start time before, during and after; restore proved
by the floor returning and by an 81-module cache-busted reload at zero
non-200. **The 404 control is what makes the 200s mean something** — the
server was discriminating, not answering everything.

**RULING: the card's rung 8 is refuted, the correction in CONVENTIONS is
sound, and its hedges are the right ones.** A vite serves what it has
already transformed — and, measurably, what it has NOT yet transformed —
out of memory. The CONVENTIONS text is careful in all three places it
needs to be: instance 8's cause stays UNDETERMINED, the `.vite` loss is
named as the real residue, and `tauri dev` is named as wider exposure
than what was measured. I did not test `tauri dev` (it opens a window)
and neither did the lane; that limit is stated in both places.

**One caution for the next reader, not a defect:** CONVENTIONS
transcribes *"twelve consecutive 100 ms samples"* and *"200 on every one
of 51 samples"*. My run measured **11** and **25** — different digits,
identical conclusion. The paragraph already says *"DERIVE THE FIGURES
AGAIN IF YOU NEED THEM; they are a property of a vite version"*, which is
exactly why quoting them would be the mistake. They are the only
measurement digits the new prose carries.

#### 3. THE GUARD, WITH ITS POSITIVE CONTROL — **BOTH HALVES, MINE.**

The lane's demonstration is not in the diff (correctly — it was a
one-off), so I did not re-run theirs. I implemented the rule **from the
text as it landed** (`integrator.md` rule 1 + CONVENTIONS' DETECT AND
REFUSE paragraph) and ran both halves against the drill worktree on port
**15184**:

- **POSITIVE CONTROL — port free.** `lsof` reports no listener → the
  sequence PROCEEDS, `npm ci` runs, exit **0**, `app/node_modules` mtime
  moves `1787646753` → `1787647193`. The destructive step really is
  destructive, which is what makes the other half worth anything.
- **REFUSAL — port held** by my own listener (pid 14908, `TCP
  127.0.0.1:15184 (LISTEN)`). Exit **3**. The message names the step
  being skipped, the pid and socket read, what has to happen first, and
  that the process was not signalled and the port not bound. `npm ci`
  does not run: `node_modules` inode **33603461** and mtime
  **1787647193** are IDENTICAL before and after. The holder is still
  LISTEN afterwards.

"Refused" is distinguishable from "always refuses", by construction and
by measurement. **Criterion 1 MET.** The rule as written is
implementable from the text alone by a reader who was not in the lane —
which is the property a prose rule has to have.

#### 4. IS THE METHOD TEXT PRODUCT-AGNOSTIC? — **YES, MEASURED.**

`git diff … -- method/ | grep '^+' | grep -inE
"nputer|tauri|vite|npm|cargo|1420|node_modules|lib/parser|app/src|Users/ujju|\.tsx|rust|react|typescript"`
returns **zero rows**. The added method text speaks of "a dev server", "a
file watcher", "a fresh dependency install", "a path dependency, a
symlink, a generated bundle", "the port or the binary" — and its only
citation is method-internal (`../lane-protocol.md rule 3`). Every nputer
mechanism — `tauri dev`, `app/src-tauri/**` vs `app/src/**`, `1420`,
`npm ci`, `lib/parser/dist`, the `file:` symlink, the `awk` anchor — is
in `docs/CONVENTIONS.md`. CONVENTIONS' first gotcha is satisfied.

#### 5. WERE `integrator.md`'s STEPS 1–4 RENUMBERED? — **NO.**

Derived from both blobs rather than from the claim. Column-0 numbered
lines at `c4cfe52`: `1.`@5, `2.`@25, `3.`@27, `4.`@35. At `966b8dd`:
`1.`@5, `2.`@25, `3.`@30, `4.`@40 — same four numbers on the same four
sentences. **Even T-089's LINE citation survives**: `integrator.md:5` is
byte-identical on both sides. The five citations in the tree
(`T-089` rows at :111, :538, :1406, :1492 and `integrator.md:5` at :42
and :184) all still resolve.

**A NEW AMBIGUITY DOES ARRIVE, AND IT IS MANAGED RATHER THAN MISSED.**
The new section carries its own `1.`–`4.`, so `integrator.md` now holds
two 1–4 lists. The file disambiguates by vocabulary — the new list is
called *rules* in three places (*"Rules 1 and 2 are the breakage
channels"*, *"see the last rule of the section below"*) while every
existing citation says *step* — but that convention is nowhere written
down. Filed as **`T-052-s5`**, not blocking.

#### 6. THE CI PARITY DERIVATION — RE-DERIVED MYSELF, BEFORE AND AFTER.

Not by importing the spec: I re-implemented `buildAndTestSection`,
`commandBullets` and `structuralProblems` from their documented rules and
ran them over three blobs of `docs/CONVENTIONS.md`.

| ref | file lines | "Build & test" lines | bullets | **exposed commands** | structural problems | U+00B7 in section / file |
|---|---|---|---|---|---|---|
| `c4cfe52` (base) | 1219 | 260 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| `e5a8f6a` (main) | 1219 | 260 | 4/5/5/7 | **21** | 0 | 20 / 23 |
| `966b8dd` (tip) | **1409** | **260** | 4/5/5/7 | **21** | 0 | **20 / 23** |

**190 lines were added and the section did not move by one line, one
command or one middle dot.** The added prose contains **zero** U+00B7, so
the truncation trap cannot fire from it; its indented code blocks sit in
`## Gotchas`, which `structuralProblems` never scans because
`buildAndTestSection` splits on `^## ` first. The 21 commands are
identical by NAME on both sides, not merely by count. Confirmed live by
`tools/e2e/tests/workflow-parity.spec.ts` — *"the expected commands
derive cleanly"* passes with `problems` empty and the ≥19 step floor met.

#### 7. TRANSCRIBED FIGURES — the new CONVENTIONS prose carries **no disk figure**.

`du`/`df` digits are absent by design and replaced by a RELATION plus the
commands that re-derive them; the `git remote` fact is stated with
*"re-derive it rather than trusting this sentence"*; the worktree's
existence is explicitly demoted to a live-environment fact. The two
sample counts in §2 above are the only measurement digits, and they are
disclaimed in place. **The staleness that DID happen is in the card's
own notes, not in the shipped text — see §10.**

#### 8. SUITES AND GATES — every exit off its own unpiped `$?`, every count re-derived.

Run in the lane worktree at `966b8dd` (`git status --short` = 0 rows).

- **cargo** (`cargo test --no-fail-fast`, `app/src-tauri`): **418 passed
  / 0 failed / 3 ignored, exit 0**, summed over **15** `test result:`
  lines. `T-088-s4`'s watcher flake did NOT fire in my run either.
- **graph gate**: `cargo run -p nputer-index -- index --check --root ../..`
  **exit 0, CURRENT** at **895 891 bytes · 172 files · 1889 symbols ·
  1849 edges** — unmoved. NOT owed (0 code paths) and asked anyway.
- **parser**: `npx vitest run` — **264/264 across 12 files, exit 0**.
- **app**: `npm run build` **exit 0**, then `npm test` — **958/958 across
  46 files, exit 0**.
- **E2E**: `npm test` on scratch port **15182** — **145/145, exit 0**;
  `npm run typecheck` **exit 0**.
- **token lint**: `--selftest` **exit 0** (65 TOKEN + 4 CONTROL samples,
  87 walk-policy checks, 9 evidence-floor checks); lint **exit 0** at
  **TOKEN 131 / CONTROL 661**.
- **`npm run lint:docs` exit 0**, run the way CI runs it.
- **DOCS GATE — exit 1**, invoked from the lane root with the 8 paths as
  ARGUMENTS, root-relative, never through `xargs`: **12 derived readers
  across 4 suites, 0 frontmatter issues**, **6 of 8** paths under `docs/`
  are code inputs, and **all four suites it names were run and are
  green** (cargo, app, tools/e2e, lib/parser).
- **BOOT GATE — not owed**, 0 of 8 paths under `app/src-tauri/**`,
  `app/src/**` or a manifest. Not run.

#### 9. THE KNOWN DETERMINISTIC RED — **it did not fire, and I did not chase it.**

`tools/e2e/tests/token-scan.spec.ts`'s P6 plant-and-restore body was
**green** in my single E2E run (145/145, exit 0, port 15182) because this
worktree is already healed. I read the mechanism rather than re-running
for it: the `finally` calls `utimesSync(target, clock.atime, clock.mtime)`
— a `Date`, integer milliseconds — and the assertion two lines down
compares `statSync(target).mtimeMs`, which carries the filesystem's finer
resolution. The failing restore repairs its own precondition. **Still
unfixed on main at `1223543`** (the body is byte-identical there), with
`T-120-s3` filed as the fuller account and `T-052-s4` correctly reduced
to the one thing it adds. **Not this lane's, and not a flake.**

#### 10. CORRECTIONS TO THE RECORD — two digits in the notes above are stale by one, and the cause is the same for both.

Neither is in shipped text; both are in this card's Implementation notes,
and both were true when written and falsified by this lane's own third
commit. **`T-052-s4` was added at `4c55fec`**, after the sentences below
were written, and neither of the two later commits revisited them.

1. *"it is two method files, `docs/CONVENTIONS.md`, this card and
   **three** suggestion files"* — the diff carries **four**
   (`git diff --name-only c4cfe52...966b8dd | grep -c T-052-s` → **4**).
   2 + 1 + 1 + 4 = **8**, which is the path count the same section's own
   gate table uses.
2. *"**TOKEN 131 / CONTROL 660** … because this lane adds four tracked
   docs files"* — re-derived at `966b8dd`, `npm run lint:tokens` prints
   **CONTROL 661**. Tracked-blob counts settle it: `c4cfe52` **675** →
   `966b8dd` **679**, so the lane adds exactly four, and 660 + 1 = 661 is
   the fourth arriving after the measurement.

**This is worth writing down rather than waving through, because it is
this card's own thesis landing on this card**: a count is a
live-environment fact, and a card that says so twice still transcribed
two. The integrator may correct them in the merge or leave them with this
verdict beside them; nothing downstream reads either digit.

A third figure has moved since it was written, legitimately:
`T-052-s2` says **three** lane worktrees sit inside the repository. At
`1223543` it is **two** — T-120's was removed by its own integrator.
CONVENTIONS states it as a dated past event (*"Three lanes were cut into
`tools/` on 2026-08-25"*), which stays true; the suggestion file's
present tense will not.

#### 11. WHERE THE BRIEF WAS WRONG, AT MY REF

- **The brief's tip figures are one merge stale by construction.** It
  gave main as moving and it moved twice during this pass
  (`e5a8f6a` → `1223543`). Both merge-tree forecasts were re-run; both
  clean, both 8.
- **The brief lists `/Users/ujju/Projects/nputer/tools/nputer-T-120` as a
  LIVE lane not to be touched.** T-120 merged and its worktree is GONE at
  `1223543`. I never touched it.
- **The brief predicted I would probably meet the `token-scan.spec.ts:201`
  red.** I did not — the lane worktree is healed, exactly as the brief's
  own account of the defect predicts.
- **The brief said the lane reports "three lane worktrees" as a live
  fact.** Two, now. See §10.
- **The brief's reference figures were all confirmed**: cargo 418/0/3
  over 15 lines, parser 264/264, app 958/958, e2e 145/145. Its CONTROL
  figure was not stated; mine is 661 against the card's 660.

#### VERDICT

**APPROVED.** Every acceptance criterion is met, the two safety rules are
in the generic file and every mechanism is in the product file, the
demonstration the verification clause asked for reproduces independently
with both halves, the bump answer is right, and the card's own rung 8 is
correctly and honestly refuted — a card's premise corrected by measuring
it is the outcome this pass hoped for rather than the one it feared. The
two stale digits in §10 are corrections to the record, not failures of
the deliverable. Non-blocking idea filed as `T-052-s5`.

**What I ran, and what I left alone.** Scratch ports **15180–15184**,
each `lsof`-read first and then bind-confirmed on `127.0.0.1`, `0.0.0.0`,
`::1` and `::` before use, all free again after; every process I started
was stopped by its exact pid and **no `pkill` at any point**. Port
**1420** was read only with `lsof -nP -iTCP:1420 -sTCP:LISTEN`, before
and after: holder `node` pid **88948**, `TCP [::1]:1420 (LISTEN)`,
identical throughout, and the anchored `awk '$NF=="target/debug/nputer"'`
match is pid **89201** started **2026-08-25 10:54:33**, unchanged.
`/Users/ujju/Projects/nputer-app` was never entered. The lane's worktree
was built and tested in place and no tracked file in it was modified
except this verdict. My drill worktree
`/Users/ujju/Projects/drill-T-052-verify` is detached, outside the
repository, and removed after this commit.

**THIS VERDICT'S OWN WRITES WERE GATED, because two `docs/tasks/**` files
are code inputs and a verdict is not exempt.** With both paths STAGED
first (`T-010-s10`'s hole walked around rather than into), the DOCS GATE
run from the lane root with them as arguments is **exit 1**, naming three
suites and **0 frontmatter issues** — `npm test from app/`, `npm test
from tools/e2e/`, `npx vitest run from lib/parser/`; `cargo test` is NOT
named, because neither path is one of its three readers. All three were
re-run AFTER the writes: **parser 264/264 exit 0**, **app 958/958 across
46 files exit 0**, **E2E 145/145 exit 0** on scratch port **15183**
(`lsof` first, bind-confirmed on all four addresses, free again after).
