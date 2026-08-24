---
id: T-052
title: The pipeline must not kill the app — one checkout, two owners
feature: F-02
milestone: 4
priority: 8
size: M
status: planned
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder:
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

## Verdicts
