---
id: T-123
title: An interview that banked stage 0 can still be reached — the plan probe asks whether a folder holds a plan and never whether one of ours is running on it
feature: F-03
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [app-shell, app-agent]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Every source reading below was derived at `45691d9`, against the live
tree, and the reproduction is a REAL one: it happened to @human on
2026-08-24, on the first genesis interview this project has ever run
against a real model (STATE's T-101-look section carries that account).

**THE INTERVIEW'S OWN FIRST ACT MAKES ITSELF UNREACHABLE.** Stage 0
scaffolds `docs/ROADMAP.md`; a folder holding a ROADMAP has a plan; a
folder with a plan is never routed to genesis; the resume offer lives
only on the genesis screen. So the session that wrote the plan is
stranded by the plan it wrote, with no way back in from the UI.

## The mechanism, every hop cited by symbol

1. `probe_plan` in `app/src-tauri/src/docs_watch.rs` **stats and never
   reads content** — `roadmap: fs::symlink_metadata(docs.join(ROADMAP_NAME)).is_ok()`
   — and its own header says so.
2. `PlanProbe::has_plan` is `self.roadmap || self.tasks`.
3. `pick_project`'s `if probe.has_plan()` arm prints *"genesis declined:
   <folder> already has a plan - opening it as a project"* and routes to
   the ordinary open. **This is T-026 criterion 5 and it is CORRECT** —
   there is no overwrite path in this app by construction.
4. The shell therefore never reaches `phase: "genesis"`
   (`watcher-store.ts`), so `screen === "genesis"` never renders
   (`App.tsx`), so C-13's chat never mounts.
5. `resumeGenesis` (`app/src/lib/agent-store.ts`) has **exactly one
   caller** — `takeStart(projectDir, resumeGenesis)` in
   `app/src/genesis/interview-source.ts` — inside that chat. T-029 built
   the resume offer; nothing can reach it.

**MEASURED, NOT REASONED.** `~/nputer-genesis-probe` after one turn:
`docs/ROADMAP.md` is the scaffolded template with **zero features** (every
example inside an HTML comment, exactly as T-030 and T-023 intend),
`docs/tasks/` is EMPTY, and `.nputer/sessions.json` registers
`{"id": "S1", "roles": ["planner"], "turns": 1, "status": "idle"}` with a
live `native_session_id`. `has_plan()` is true on a plan that contains
nothing. Both doors — the board header's "Start an interview" and the
front door's open — land on an empty board, which is itself HONEST (no
features, no task files, nothing to draw).

## The guard is right; the missing input is the session registry

The routing question is *"does this folder already hold a plan?"* and it
has never asked *"is one of our interviews running on it?"* — even though
that second fact has an owner. T-029 gave `.nputer/sessions.json` exactly
this responsibility, and T-070 named the accessor: `sessions::genesis_record`
in `app/src-tauri/src/agent/sessions.rs` is **the ONE place that fact
lives**, already used to tell a CLI-less user what they banked.

A guard built to stop you overwriting SOMEONE ELSE'S plan cannot
currently tell that plan from **the one its own live session wrote thirty
seconds ago**. Resuming an interview that authored a plan is not an
overwrite; it is the opposite.

This is the inverse of T-050's ruling that no reachable screen is a dead
end: here the reachable screen (the board) is a dead end *for the
session*. And it is milestone-4 work rather than a residual because a
real user meets it on their FIRST interview, before they have anything to
lose track of.

## Acceptance criteria

- **IF the picked folder holds a plan AND its `.nputer/sessions.json`
  registers a genesis session THEN the pick SHALL route to genesis**
  rather than to the ordinary open, so T-029's existing resume offer is
  reachable. The routing decision SHALL be made from the registry, never
  from the plan probe alone.
- **THE REGISTRY READ SHALL HAVE ONE OWNER.** The shell SHALL ask
  `sessions::genesis_record` (or a sibling accessor added beside it in
  C-14) and SHALL NOT stat `.nputer/` or re-parse that JSON itself — a
  rule with two implementations is two chances to disagree (T-057). IF
  the accessor's current shape does not answer this question THEN the
  new one lives in C-14 beside it and not in `docs_watch.rs`.
- **THE NO-OVERWRITE GUARANTEE SHALL BE PINNED UNMOVED**: a folder that
  holds a plan and registers NO genesis session SHALL still route to the
  ordinary open. This is the POSITIVE CONTROL the new arm needs
  (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL) — a body
  asserting the new route fires is satisfied equally by a probe that
  routes everything to genesis, and only the pair discriminates.
- **THE CONTENT-BLINDNESS OF `probe_plan` SHALL NOT BE TRADED AWAY, and
  the refusal SHALL BE WRITTEN AT THE PREDICATE.** The tempting fix is to
  teach `has_plan` to read `ROADMAP.md` and rule a features-free template
  "not a plan". It is REFUSED: a real but sparse plan would then lose
  T-026's guard entirely, the probe's own header states it never reads
  content, and content-sniffing makes the routing depend on the parser's
  vocabulary. Say so where the next reader meets it.
- **THE REPRODUCTION SHALL BE THE PIN.** A body SHALL drive exactly the
  shape this card exists for — a template `ROADMAP.md` carrying no
  features, an empty `docs/tasks/`, and a registered planner session —
  and SHALL assert the outcome is genesis. IF the offer needs any
  frontend change to appear THEN that change is `app-interview`, OUTSIDE
  this fence, and SHALL be routed rather than reached for.
- **THE VETO-ONLY PROPERTY SHALL BE RE-DERIVED AND STATED.**
  `PlanProbe::from_docs_snapshot` is veto-only today (T-064: the post-ack
  re-read can turn genesis OFF and never ON). This card gives "off" a
  second input, so the executor SHALL state whether the veto still holds
  after the change and SHALL pin whichever answer is true.
- IF a registered session is found for a folder whose plan it did NOT
  write — a cloned repository that happens to carry a `.nputer/` — THEN
  the route SHALL still be resume and never a fresh interview:
  `genesis_fresh` stays the only destructive door (T-029's reason for
  keeping it off `genesis_start`'s flag) and SHALL be shown still
  refusing a planned folder.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines), plus `npm test` from app/ if any payload shape
moves. **POISON DRILL on every new or changed assertion, one side only**,
producer mutated and never the assertion; each mutated text read back
with `git diff` before its run; restores proved per-path by sha256
against the drill's own commit; detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it (arm (c)), and name the drill directory for
this card rather than the shared literal `drill` (T-088-s3). Then the
shape-six check on each new body. BOOT GATE fires on `app/src-tauri/**` —
run it on a scratch port and record the exit and both `[nputer]` lines.
DOCS GATE fires on this card; ask it directly, never through `xargs`.
**@human: one look, and it is the reproduction run backwards** — open a
folder whose interview has banked stage 0 and confirm the resume offer is
there. `~/nputer-genesis-probe` is the live instance and its session id
is in its own `.nputer/sessions.json`.

## Implementation notes

Built by `claude-opus-5` in `../nputer-T-123`, branch
`task/T-123-interview-reentry`, base `d46f71f`. **Every figure below was
re-derived in this worktree at the ref it names; nothing is inherited
from the dispatch brief.**

**UNDERSTANDING, CONFIRMED BEFORE ANYTHING WAS TOUCHED.** The interview's
first act writes `docs/ROADMAP.md`; `probe_plan` stats it without reading
it, so `has_plan()` is true on a features-free template; `apply_genesis_folder`
correctly routes a folder-with-a-plan to the ordinary open (T-026
criterion 5); the resume offer lives only behind the genesis screen; so
the session that wrote the plan is stranded by the plan it wrote. The
missing input is not inside the file — it is `.nputer/sessions.json`,
whose owner is T-029 and whose accessor is T-070's
`sessions::genesis_record`. This lane adds that second input to the
ROUTING question, at the shell and at the two agent commands the offer
runs through, without softening the plan test and without opening the
destructive door.

### What moved — three Rust files, no frontend, no IPC, no grant

**`app/src-tauri/src/agent/sessions.rs` (C-14).** New
`sessions::has_genesis_session(project_dir) -> bool`, a one-line delegate
of `genesis_record(..).is_some()`. It is a delegate rather than a second
reader on purpose (T-057): there is ONE read of that file, so the yes/no
and the record cannot disagree.

**`app/src-tauri/src/docs_watch.rs` (C-05).** New
`routes_to_genesis(&PlanProbe, registered) -> bool` = `!probe.has_plan()
|| registered` — **the whole rule, one implementation, four callers.**
`apply_genesis_folder` now reads the registry ONCE through C-14's
accessor and asks `routes_to_genesis` at BOTH readings of the folder,
carrying the same boolean to the post-ack re-read exactly as T-064
carries `probe.git`. The new arm names itself on stdout
(`[nputer] genesis reachable: … holds a plan AND registers an interview
- routing to genesis so the resume offer is reachable`) rather than
reusing the decline line.

**`app/src-tauri/src/agent/mod.rs` (C-14).** `start_genesis` and
`resume_genesis` call the same `routes_to_genesis` instead of a bare
`has_plan`; `resume_genesis` reads `genesis_record` once and spends it on
both the guard and the resume. `start_genesis` gains a SECOND guard
after the registry arm — `if planned { AlreadyPlanned }` — so a planned
folder can reach the resume answers and can never fall through to the
fresh spawn. `fresh_genesis` is UNCHANGED and now carries the argument
for why in its own doc comment. `kickoff` is unchanged and discloses that
in its body (see `T-123-s1`).

**ZERO frontend change, and that is measured rather than hoped.** The
route lands on the existing `PickOutcome::Genesis` variant with its
existing three fields, `reducePickOutcome`'s `case "genesis"` already
sets `phase: "genesis"` + `genesisDir`, `App.tsx` already renders on
`screen.screen === "genesis"`, and `InterviewChat` already auto-starts
and renders `resumeAvailable` as the offer. So criterion 5's IF-branch
(*"IF the offer needs any frontend change…"*) does not fire: `app/src/**`
is a 0-file diff, `generate_handler!` is untouched, `acl_pin.rs` is a
0-file diff, and no payload shape moves — which is also why the app suite
is unmoved at 940/940.

### Criterion by criterion

1. **Plan + registered session routes to genesis, decided from the
   registry.** Built, at `apply_genesis_folder`. The decision is
   `routes_to_genesis(&probe, registered)` and the probe alone can no
   longer answer it. Pinned by
   `a_planned_folder_that_registers_an_interview_is_still_reachable_as_genesis`
   (arm 1) and, at the command the offer comes out of, by
   `a_registered_interview_gets_the_resume_offer_on_the_plan_it_wrote`.
2. **One owner for the registry read.** Built.
   `crate::agent::sessions::has_genesis_session` is the shell's only
   channel to that file; `docs_watch.rs` contains no `.nputer` string and
   no JSON parse. The accessor is a delegate of `genesis_record`, so
   criterion 2's "sibling accessor added beside it in C-14" is satisfied
   without creating a second reader.
3. **The no-overwrite guarantee, pinned unmoved, with its positive
   control.** Built, and the control is IN THE SAME BODY: arms 2 and 3 of
   the reproduction pin run the identical tree with no registry, and with
   a registry whose only planner is `dead`, and both must still answer
   `Picked`. The drill proves the pair discriminates — mutant **N2**
   (`routes_to_genesis` → `true`) reds five bodies including T-026's own
   `genesis_pick_of_a_folder_that_already_has_a_plan_opens_it_as_a_project`.
4. **Content-blindness not traded away, refusal written at the
   predicate.** Built. `probe_plan` is byte-unchanged; the refusal is a
   new paragraph on `PlanProbe::has_plan` giving three reasons (a sparse
   real plan would lose the guard; the probe's own header promises it
   reads no content; content-sniffing makes routing depend on the
   parser's vocabulary) and pointing at `routes_to_genesis`.
5. **The reproduction is the pin.** Built.
   `a_planned_folder_that_registers_an_interview_is_still_reachable_as_genesis`
   drives the scaffolded template ROADMAP (three headings, every example
   inside an HTML comment, zero feature rows — asserted), an EMPTY
   `docs/tasks/` (asserted by reading the directory), and a
   `.nputer/sessions.json` written as TEXT in the live probe folder's
   own field shape, and asserts `PickOutcome::Genesis` with the plan
   riding the snapshot. No frontend change was needed, so nothing was
   routed under this criterion.
6. **The veto-only property, re-derived and stated.** **IT STILL
   HOLDS**, and the argument is now two-part because "off" has two
   inputs: (a) the re-read is reached only where `routes_to_genesis`
   already said genesis, so it can turn genesis OFF and never ON; (b)
   `registered` is read once and CARRIED, so the only thing that can
   differ between the two readings is the docs half, and the docs half
   can only move `has_plan` from false toward true. A second registry
   read at the re-read could have flipped it back ON, which is why there
   is not one. Pinned by
   `a_plan_written_in_the_window_by_our_own_registered_interview_stays_genesis`,
   driven on T-064's own relay with both columns.
7. **Resume and never a fresh interview; `genesis_fresh` shown still
   refusing.** Built, and it needed a guard the card did not ask for by
   name: `start_genesis`'s registry arm falls through on `Ok(None)` (a
   planner entry with no recorded native id), which before this lane
   would have reached the stage-0 spawn on a planned folder the moment
   the registry opened the door. `if planned { AlreadyPlanned }` closes
   it, pinned by
   `a_registered_session_with_nothing_to_resume_never_starts_a_fresh_one_on_a_plan`
   (which also asserts the registry file is byte-unchanged — a fresh
   start would have upserted `S2`).
   `fresh_genesis_still_refuses_a_planned_folder_even_with_a_session_registered`
   is the other half.

### What was deliberately NOT built, and why

- **The ordinary open (`apply_picked_folder` → `open_as_project`) still
  opens a planned folder as a project, registry or no registry.** The
  card's mechanism hop 3 names the arm that *"routes to the ordinary
  open"*, which is `apply_genesis_folder`'s; the front door's plain
  "Open a project" is a different question with a different answer, and
  making it jump to the interview screen would be the inverse dead end —
  a user who opens a planned project to look at the board would get the
  chat instead. The way back in from the board is the header's
  "Start an interview", which works after this change; the friction it
  still carries is `T-123-s2`.
- **`genesis_kickoff` still refuses a planned folder** — `T-123-s1`,
  disclosed in `kickoff`'s own body. In fence, out of criteria, and a
  routing ruling rather than a follow-through.

### The card's own naming, corrected

The card's mechanism hop 3 says *"`pick_project`'s `if probe.has_plan()`
arm"*. **There is no `pick_project` symbol in this tree.** `git grep` at
`d46f71f` finds `pick_project_folder` (a `lib.rs` command name, the
ORDINARY open) and nothing else; the arm the hop describes, with the
quoted `genesis declined:` line, is `docs_watch::apply_genesis_folder`.
Everything else the card cites resolved exactly as written.

### Commands, in the order run, exits read UNPIPED from `$?`

Setup in a fresh worktree, in CONVENTIONS' order: `lib/parser` `npm ci`
**0** + `npm run build` **0**; `app/` `npm install` **0** +
`npm run build` **0**; `tools/e2e` `npm ci` **0**.

| # | command | cwd | exit |
|---|---|---|---|
| 1 | `cargo test --no-fail-fast` (baseline at `d46f71f`) | app/src-tauri | **0** |
| 2 | `cargo check --all-targets` | app/src-tauri | **0** |
| 3 | `cargo test --no-fail-fast` | app/src-tauri | **0** |
| 4 | `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri | **0** |
| 5 | `npm test` | app | **0** |
| 6 | `npx vitest run` | lib/parser | **0** |
| 7 | `NPUTER_BOOT_PORT=14970 npm run boot:check` | tools/e2e | **0** |
| 8 | drill: 9 mutants + 2 baselines + 1 clean re-run | detached worktree | see below |
| 9 | `node tools/e2e/scripts/docs-gate.mjs <3 root-relative paths>` | repo root | **1** (the gate's verdict: FIRES) |
| 10 | `npx vitest run` (re-run, post-card-edit) | lib/parser | **0** |
| 11 | `npm test` (re-run, post-card-edit) | app | **0** |
| 12 | `NPUTER_E2E_PORT=14971 npm test` | tools/e2e | **0** |
| 13 | `cargo test --no-fail-fast` (final) | app/src-tauri | **0** |
| 14 | docs gate again, through the RANGE invocation, at the final tip | repo root | **1** (FIRES) |
| 15 | the three owed suites again at the final tip: parser **0**, app **0**, e2e **0** (port 14972) | — | **0** |

**Figures, each at its ref.**

- **cargo, at `d46f71f` (baseline): 383 passed / 0 failed / 3 ignored,
  exit 0**, summed programmatically over **15** `test result:` lines —
  identical to STATE's figure, so the base is the base.
- **cargo, at the lane tip: 389 passed / 0 failed / 3 ignored, exit 0**,
  same 15 lines. **+6 bodies and no file added**: 2 in `docs_watch.rs`,
  4 in `agent/mod.rs`.
- **app: 940/940 across 46 files, exit 0** — UNMOVED, which a 0-file
  `app/src` diff requires. Run twice: before the card edit and again
  after it, because the DOCS GATE owes it.
- **parser: 263/263 across 12 files, exit 0** — unmoved, run twice for
  the same reason.
- **E2E: 143/143, exit 0**, scratch ports **14971** then **14972** —
  unmoved; this lane adds no spec file and no fixture the lane reads.
  Every card edit re-owes the three docs-gate suites, so all three were
  run again on the FINAL card content and all three are green there; the
  Rust tree is byte-identical to command 13's, so `cargo test` was not
  re-run on that last pass and that is stated rather than implied.
  **This paragraph deliberately names no tip hash**: a note that names
  its own commit is stale the moment the commit is amended, which is a
  small instance of the transcribed-figure defect this repo has now met
  four times.

### Gates, DERIVED from this lane's own diff

The diff was derived, not assumed, through the prescribed pre-merge form
— `TREE=$(git merge-tree --write-tree <main tip> HEAD)` with the **exit
read FIRST** (**0**, a tree: `af1a8758…`), then
`git diff --name-only <main tip> "$TREE"`.

**MAIN MOVED UNDER THIS LANE, exactly as the brief's correction clause
warned.** It was `d46f71f` at the cut and is **`cd79f97`** at this tip:
T-015's lane merged as NOT BUILT plus its checkpoint, three commits, six
paths. The two path sets are **DISJOINT** — `comm -12` over the sorted
lists is EMPTY — and the arithmetic closes: main's **6** + this branch's
**6** = **12**, which is exactly what the FORBIDDEN two-dot
`main..HEAD` prints, so that count is pure left-endpoint drift and no
gate answer moves. **6 paths** by the prescribed form, by the three-dot
form, and by the branch-only `d46f71f..HEAD` — all three agree. An
integrator MUST re-derive this against whatever main is at the merge;
these figures are functions of `cd79f97`.

| gate | trigger | on this diff |
|---|---|---|
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **3 of 6 — FIRES, and was RUN** |
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside docs/ | **0 of 6 — NOT OWED, and the gate was ASKED anyway** |
| DOCS GATE | a `docs/` path a code suite reads | **3 of 6 — FIRES** |

- **BOOT GATE — exit 0**, scratch port **14970**, both `[nputer]` lines
  captured: `[nputer] project folder: /Users/ujju/Projects/nputer-T-123`
  and `[nputer] window "main" created`. The port was read with `lsof`
  FIRST (zero rows) and then bind-confirmed free on `127.0.0.1`,
  `0.0.0.0`, `::1` and `::` before use, and was free again after.
- **GRAPH REGEN — NOT OWED, 0 of 6**: three `.rs` files and three
  markdown files, none matching the trigger. **Asked rather than
  predicted** (CONVENTIONS' own instruction): `index --check --root ../..`
  exits **0**, *"graph.json is CURRENT"* at **648863 bytes · 126 files ·
  1126 symbols · 1712 edges** — byte-identical to the base figure, which
  `languages: ["ts"]` requires of a Rust-only source diff (the
  T-043/T-069/T-113 shape, and the fifth standing argument for T-010).
- **DOCS GATE — exit 1 (the gate's verdict: FIRES)**, invoked from the
  repo root with the three ROOT-RELATIVE paths as ARGUMENTS and never
  through `xargs`. The three are this card and the two suggestion files.
  It reports **12 derived readers across 4 suites**, **0 frontmatter
  issues in the live tree**, *"every live task card's frontmatter parses,
  with a legal status"*, a census of **125 docs-shaped sites in 22 files,
  12 of them in 10 files resolving into this repo's docs/**, **25 files
  holding the repository root** (11 derived, 0 unlinked, 14 with no
  linkable site), **1 package-relative site, derived**, and the
  root-anchor ledger at 6 entries. **THREE suites owed and all three
  run**: `npm test` from app/ (940/940, 0), `npx vitest run` from
  lib/parser/ (263/263, 0), `npm test` from tools/e2e/ (143/143, 0 —
  scratch port 14971). `cargo test` is NOT owed by these paths (its only
  docs reader is `kit.rs` on `docs/CONVENTIONS.md`, untouched here) and
  was run anyway because the Rust diff owes it on its own.
  The census figures are DERIVED on every run and transcribed nowhere —
  the 125 above is this tree's, not STATE's 119 at `9b03ae6`.

### The poison drill — NINE mutants, all RED, two detached worktrees

Arm (c): a **detached** scratch worktree at the named commit `8558352`
with its own `CARGO_TARGET_DIR` **inside it** (`<drill>/.drilltarget`),
and the directory named **`drill-T-123`** rather than the shared literal
`drill` (T-088-s3 — three lanes collided on that path last night). The
parent worktree's `target/` was never handed to the drill and never
shared with it.

Every mutation is **ONE SIDE ONLY and always the PRODUCER** — never an
assertion, never a literal the two sides share — applied by a driver that
REFUSES any path outside a directory named `drill-T-123` and requires a
match count of **exactly 1**; and every mutated TEXT was read back with
`git diff --unified=0` **before** its suite ran. Baseline
`cargo test --lib --no-fail-fast`: **154 + 123 = 277 passed / 0 failed,
exit 0.**

| # | producer mutated | the red |
|---|---|---|
| N1 | `routes_to_genesis` → `!probe.has_plan()` (registry input dropped) | exit 101, **4 bodies**: both new docs_watch bodies + the start-offer and resume bodies |
| N2 | `routes_to_genesis` → `true` (route everything to genesis) | exit 101, **5 bodies**, including T-026's `genesis_pick_of_a_folder_that_already_has_a_plan_opens_it_as_a_project` and T-064's race body |
| N3 | `has_genesis_session` → `false` | exit 101, **3 bodies** |
| N4 | `has_genesis_session` → `true` | exit 101, **4 bodies**, both pre-existing no-overwrite pins among them |
| N5 | the post-ack re-read's carried `registered` → `false` | exit 101, **2 bodies** (both new docs_watch bodies) |
| N6 | `start_genesis`'s `if planned { AlreadyPlanned }` deleted | exit 101, **1 body**: `a_registered_session_with_nothing_to_resume_never_starts_a_fresh_one_on_a_plan` |
| N7 | `fresh_genesis`'s guard made to follow `routes_to_genesis` | exit 101, **1 body**: `fresh_genesis_still_refuses_a_planned_folder_even_with_a_session_registered` |
| N8 | `resume_genesis`'s guard reverted to bare `probe.has_plan()` | exit 101, **1 body**: `resuming_the_plan_your_own_interview_wrote_is_not_an_overwrite` |
| N9 | `start_genesis`'s guard reverted to bare `probe.has_plan()` | exit 101, **1 body**: `a_registered_interview_gets_the_resume_offer_on_the_plan_it_wrote` |

**Restoration proved per path after EVERY mutant and again at the end of
both drills**: `git checkout --`, then sha256 of the working file against
`git show HEAD:<path>` from **the drill's own commit** — MATCH every
time — plus an empty tracked `git diff` and a clean re-run at **277/277,
exit 0**. The three hashes at `8558352`:
`docs_watch.rs` `0f7c1c9c…`, `agent/mod.rs` `8dd6ad89…`,
`agent/sessions.rs` `d3bab823…`. Both drill worktrees were removed and
`git worktree prune` run; `.drilltarget` deleted.

**SHAPE SIX, ASKED PER BODY AND ANSWERED HONESTLY.** Five of the six new
bodies kill a mutant no other body kills (N2/N4/N5 for the reproduction
pin, N9 for the start-offer pin, N6, N7, N8 for the other three).
**The sixth does not.** Every mutant that reds
`a_plan_written_in_the_window_by_our_own_registered_interview_stays_genesis`
also reds the reproduction pin, and none reds it alone — because the
reproduction pin's folder holds its plan before the probe runs, so it
passes through BOTH readings too. It is kept, and the reason is recorded
in its own doc comment rather than dressed up as a unique kill: it is the
only body in which the two readings of one folder DISAGREE about
`has_plan` and the registry settles it, which is precisely the state
criterion 6 asks to have pinned. A reader who wants to delete it should
delete criterion 6 first.

**THE DRILL CORRECTED A CLAIM IN THIS LANE'S OWN COMMENT.** That body's
doc comment asserted that mutating the carried `registered` to `false`
*"reds this body and nothing else in the suite"*. N5 redded two bodies.
The sentence is gone and the measurement is in its place — the same
failure mode STATE records for T-090, one file over.

### Prohibitions honoured

Port **1420** was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
nothing else, before and after: holder `node` pid **82549**, one socket
`TCP [::1]:1420 (LISTEN)`, identical throughout (read 2026-08-25 ~00:55
and ~01:20 on this host). The human's app pid **88272** (started
2026-08-24 14:02:15) is unchanged across the whole lane, matched with the
anchored `awk '$NF=="target/debug/nputer"'`. Only scratch port **14970**
was used, of the 14970–14973 range. **No `pkill` at any point.** No
sibling worktree was opened, and the untracked `z` in the main checkout
was not touched. `~/nputer-genesis-probe` was **READ ONLY** — its
`sessions.json`, its `docs/ROADMAP.md` and two directory listings — and
every fixture in this lane is built in a temp directory. No real CLI was
spawned and no model call was made; `real_cli_arms_forbidden` does that
structurally, and the `#[ignore]`d smoke stays ignored (3 ignored, before
and after).

## Verdicts

### Adversarial verification — `claude-opus-5 @T-123-verify`, 2026-08-25 — **REJECTED**

Verified in a DETACHED scratch worktree at `14670e4`
(`drill-T-123-verify`), with its own `CARGO_TARGET_DIR`. The lane
worktree at `../nputer-T-123` was never built in and its code is
byte-unchanged; only this section and `T-123-s3` were added.

**THE DIFF, RE-DERIVED.** `TREE=$(git merge-tree --write-tree cd79f97
14670e4)` — exit read BEFORE use, **0**, tree `3dfa8a8a…`(`3dfa7a8a`) —
then `git diff --name-only cd79f97 "$TREE"`: **6 paths**, three `.rs`
and three `docs/tasks/*.md`, matching the notes. Main is `cd79f97` at
this verdict, as the notes state. **`git diff --name-only d46f71f
cd79f97 -- app/ lib/ tools/` is 0 files**, so main moved only under
`docs/tasks/` and the lane tip is CODE-IDENTICAL to the merged tree —
which is why testing the tip is testing the merge here.

**THE EVIDENCE HALF REPRODUCES, FIGURE FOR FIGURE.** Read only after my
own attack was formed and run. Every headline number in the notes I
re-measured independently and got the same: cargo **389 passed / 0
failed / 3 ignored, exit 0** over **15** `test result:` lines; app
**940/940 across 46 files, exit 0**; parser **263/263 across 12 files,
exit 0**; e2e **143 passed, exit 0**; graph `index --check --root ../..`
exit **0**, *"graph.json is CURRENT"* at **648863 bytes · 126 files ·
1126 symbols · 1712 edges** — byte-identical to the notes' figure; boot
gate exit **0** with both `[nputer]` lines; docs gate **FIRES on 3
paths**. The card's own `pick_project` correction I re-derived
independently before reading the notes: `git grep 'fn pick_project\b'
d46f71f` finds nothing, `pick_project_folder` is a `lib.rs` command for
the ORDINARY open, and the quoted `genesis declined:` line is at
`docs_watch.rs:899` at the base. **The correction is right.**

**MY OWN DRILL — five producer-side mutants, all RED**, each read back
with `git diff --unified=0` before its run, each restored and proved by
sha256 against `14670e4` (`docs_watch.rs` `079f0bd0…`, `agent/mod.rs`
`8dd6ad89…`, `agent/sessions.rs` `d3bab823…` — MATCH after every one).
`routes_to_genesis` → `!probe.has_plan()`: **4 bodies**.
`routes_to_genesis` → `true`: **5 bodies**, including T-026's
`genesis_pick_of_a_folder_that_already_has_a_plan_opens_it_as_a_project`
and T-064's race body. `has_genesis_session` → `false`: **3 bodies**.
`if planned` → `if false`: **1 body**. The carried `registered` → `false`:
**2 bodies**. These match N1/N2/N3/N6/N5 exactly. I independently
reached the notes' shape-six answer for
`a_plan_written_in_the_window_by_our_own_registered_interview_stays_genesis`:
it kills no mutant alone. The notes disclose that rather than dressing
it up, and the retention argument (it is the only body where the two
readings DISAGREE and the registry settles it) is sound. **The suite is
load-bearing. The defect below is a MISSING CASE, not a weak assertion.**

#### VERDICT: **REJECTED** — the new routing predicate admits folders it
then refuses, which is the defect class this card exists to remove

`has_genesis_session` is `genesis_record(..).is_some()`, and
`genesis_record` returns `Some` for ANY non-dead planner entry —
including one with no `native_session_id` and one whose recorded id the
T-039 boundary REJECTS. Neither can be resumed. Both now route a
plan-holding folder to the genesis screen, where nothing can happen.

**FAILURE 1 — a registered planner with nothing to resume routes to a
screen with no offer and no exit.**

Fixture: the card's own stage-0 shape (template `docs/ROADMAP.md`, empty
`docs/tasks/`) plus `.nputer/sessions.json` holding one planner entry,
`"status": "running"`, **no `native_session_id` key**. Driven through the
real `apply_genesis_pick` in my worktree at `14670e4`:

```
VERIFIER-PROBE-A: ROUTED TO GENESIS (no resumable id)
```

- **Expected**: the ordinary open — which is what this folder got before
  this diff. The removed line was `if probe.has_plan() { … open_as_project }`
  with no registry involvement, so no plan-holding folder could reach
  `Genesis` at `d46f71f`.
- **Actual**: `PickOutcome::Genesis`. Then `start_genesis` on that same
  folder answers `StartOutcome::AlreadyPlanned` — **this lane's own
  passing test `a_registered_session_with_nothing_to_resume_never_starts_a_fresh_one_on_a_plan`
  asserts exactly that**.

What the user meets: the genesis screen mounts, `InterviewChat`
auto-starts, and the notice reads *"<path> already exists — this folder
has a plan."* There is no resume offer (`outcome.kind` is not
`resumeAvailable`). The genesis screen is full-bleed with **no rail**
(`App.tsx:734-746` passes exactly one prop, `onOpenBoard`), and that
single CTA — `data-testid="genesis-open-board"`,
`BoardCrescendo.tsx:115` — sits inside `{complete && (…)}`, while
`completion()` (`crescendo.ts:165`) returns
`{complete:false, blocker:"noTurns"}` when no turn has run. **No offer,
no working action, no way off the screen.**

**FAILURE 2 — a registered planner whose id is REJECTED routes to a
screen whose only button is refused by design.**

Same tree, `"native_session_id": "--dangerously-skip"` (refused by
`validate_session_id`'s leading-dash rule, `adapter.rs:318`):

```
VERIFIER-PROBE-C: ROUTED TO GENESIS (id would be REJECTED downstream)
```

`start_genesis` then returns `SessionIdRejected` from the `Err(rejection)`
arm at `mod.rs:332` — **before** the `if planned` backstop. The webview
renders the session-unusable block with
`data-testid="interview-fresh"` → `freshInterview(projectDir)` →
`fresh_genesis`, which still refuses on bare `probe.has_plan()` and
answers `AlreadyPlanned`. **The one action the screen offers cannot
succeed**, and this lane's `fresh_genesis_still_refuses_a_planned_folder_even_with_a_session_registered`
correctly pins that refusal. The two are consistent only because the
routing should never have sent the user there.

Not hypothetical: T-039's read boundary exists precisely because earlier
builds wrote unvalidated values that "upgrading does not clean"
(`sessions.rs:80-95` makes that argument for `model`; `resume_id` is the
same boundary for the id). And criterion 7's OWN named scenario — a
cloned repository carrying a `.nputer/` — reaches both shapes.

**WHY THIS IS CRITERION-LEVEL AND NOT A ROUTED FINDING.**

- Criterion 1's purpose clause is load-bearing: *"THEN the pick SHALL
  route to genesis … **so T-029's existing resume offer is reachable**."*
  In both shapes the routing fires where no offer exists, so the
  criterion's stated purpose is not served by the arm that fires.
- The card frames itself against T-050 — *"the inverse of T-050's ruling
  that no reachable screen is a dead end"*. The diff creates a fresh
  instance of exactly that ruling's violation, on the reproduction's own
  folder shape.
- **The fix is IN FENCE** (`app-agent`, C-14) and is what criterion 2
  already anticipates: *"IF the accessor's current shape does not answer
  this question THEN the new one lives in C-14 beside it."* The
  accessor's current shape does NOT answer the routing question. Gate the
  predicate on a RESUMABLE record — `record.native_session_id.is_some()`
  — rather than on `genesis_record(..).is_some()`. No frontend change is
  required, so criterion 5's IF-branch still does not fire.
- The existing positive controls cannot catch it: arms 2 and 3 vary
  *registry absent* and *planner dead*. **Nothing drives "planner present
  but not resumable."** A fresh executor should add that arm as a third
  control.

**Criterion by criterion.** 1 — NOT MET (above). 2 — **MET**:
`docs_watch.rs` contains no production `.nputer` stat and no JSON parse
(verified by grep; the only occurrences are comments and test fixtures),
and the accessor is a delegate, not a second reader. 3 — **MET**: arms 2
and 3 both answer `Picked`, and mutant `routes_to_genesis → true` reds
T-026's own pin, so the pair discriminates. 4 — **MET**: `probe_plan` is
byte-unchanged and the three-count refusal is written on `has_plan`
itself. 5 — **MET** for the shape it drives. 6 — **MET**: the veto-only
property genuinely still holds, and I re-derived it independently — the
veto arm fires only on `snapshot.has_plan() && !registered`, so with
`registered` true it can never fire and with `registered` false it is
T-064 unchanged; it can still only turn genesis OFF. 7 — **MET** as
written: `fresh_genesis` is byte-unchanged and the `if planned` backstop
genuinely closes the fresh-spawn hole (my mutant reds exactly one body).
Failure 1 is not a criterion-7 breach — nothing destructive happens — it
is criterion 1 firing where its purpose cannot be served.

#### Security sweep — MANDATORY, and it is an ALL-CLEAR on the destructive question

- **Injection on the new input path.** The new input is
  `.nputer/sessions.json`, a file this project does not author. The only
  value that escapes into a subprocess is `native_session_id`, and it
  passes `validate_session_id` (`adapter.rs:310-330`): non-empty,
  length-capped, first character ASCII alphanumeric, leading `-`
  refused, and the whole string restricted to `[A-Za-z0-9._-]`.
  Argument injection and shell metacharacters are structurally
  excluded. **Clear.**
- **Can a crafted registry open a destructive door?** **No.**
  `fresh_genesis` — the only door that marks a session dead and spawns a
  new planner — is byte-unchanged and still refuses on bare
  `has_plan()`. `start_genesis`'s `if planned` backstop keeps a planned
  folder off the fresh spawn (mutant-confirmed). The worst a crafted
  registry achieves is routing to genesis plus a resume offer for an
  attacker-named but charset-validated session — and criterion 7
  explicitly rules that resume, not fresh, is the correct answer for a
  cloned repo carrying a `.nputer/`. Designed behaviour, not a hole.
- **No-overwrite guarantee (T-026 criterion 5): INTACT.** No new path
  writes `docs/`.
- **No new IPC surface, no new grant, no dependency:** `app/src/**`,
  `lib.rs` and both manifests are 0-file in this diff.
- **ONE finding, non-blocking, routed to `T-123-s3`:** the routing read
  now performs a WRITE. `has_genesis_session` → `genesis_record` →
  `load`, and `load` renames a non-parsing registry aside
  (`sessions.rs:157`). Measured: picking a plan-holding folder whose
  registry is malformed gives
  `original_still_there=false aside_created=true outcome_kind=Picked` —
  correct routing, mutated folder. Confined to `.nputer/` (losable by
  charter), loud, destroys nothing, forbidden by no criterion — so a
  suggestion, not a rejection.

#### Commands, in the order run, exits read UNPIPED from `$?`

Setup in the fresh worktree: `lib/parser` `npm ci` **0** + `npm run
build` **0**; `app/` `npm install` **0** + `npm run build` **0**;
`tools/e2e` `npm ci` **0**.

| # | command | cwd | exit |
|---|---|---|---|
| 1 | `cargo test --no-fail-fast` | app/src-tauri | **0** (389/0/3, 15 lines) |
| 2 | `npm test` | app | **0** (940/940, 46 files) |
| 3 | `npx vitest run` | lib/parser | **0** (263/263, 12 files) |
| 4 | `npm run typecheck` | tools/e2e | **0** |
| 5 | verifier probes A/B/C via `cargo test --lib verifier_probe -- --nocapture` | app/src-tauri | **0** (3/3; probes then removed, tree proved clean) |
| 6 | drill: 5 mutants, read back, run, restored, sha256-proved | detached worktree | 101 each (**all RED**) |
| 7 | `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri | **0** |
| 8 | `node tools/e2e/scripts/docs-gate.mjs <3 root-relative paths>` | repo root | FIRES |
| 9 | `NPUTER_BOOT_PORT=14990 npm run boot:check` | tools/e2e | **0** |
| 10 | `NPUTER_E2E_PORT=14991 npm test` | tools/e2e | **0** (143 passed) |

#### Gates, DERIVED from this lane's own 6-path diff

| gate | trigger | on this diff |
|---|---|---|
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **3 of 6 — FIRES, and was RUN**, exit 0, port 14990, both `[nputer]` lines captured (`project folder: …/drill-T-123-verify`, `window "main" created`) |
| GRAPH REGEN | `*.ts/.tsx/.js/.jsx` outside `docs/` | **0 of 6 — NOT OWED**, and ASKED anyway: exit 0, *"graph.json is CURRENT"*, 648863 bytes · 126 files · 1126 symbols · 1712 edges |
| DOCS GATE | a `docs/` path a code suite reads | **3 of 6 — FIRES**; the three owed suites all run green above (app, lib/parser, tools/e2e). It also reports *"every live task card's frontmatter parses, with a legal status"* |

A first `index --check` reported `files +1` — that was **my own**
`.cargo-target/` sitting inside the worktree, not a lane artifact. Moved
out and re-asked; clean. Recorded because the transcribed-figure defect
is this repo's recurring one.

#### Prohibitions honoured

Port **1420** read ONLY with `lsof -nP -iTCP:1420 -sTCP:LISTEN`, never
bind-probed: holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, unchanged. The human's app pid **88272** (started 2026-08-24
14:02:15, cwd `/Users/ujju/Projects/nputer/app/src-tauri`) is unchanged,
matched with the anchored `awk '$NF=="target/debug/nputer"'`. Only
**14990** and **14991** used, `lsof` first (zero rows), bind-confirmed on
both stacks before use and free again after. **No `pkill`.** Neither
sibling lane (`nputer-T-110`, `nputer-T-010`) was touched; the untracked
`z` was not touched. **`~/nputer-genesis-probe` was never opened at all**
— every fixture was built in a temp directory. No real CLI spawn, no
model call, the `#[ignore]`d smoke stays ignored (3 ignored, unchanged).
Headless throughout.

#### Where this brief and the card were wrong

- **The dispatch brief's bounded read is unperformable as written on
  this card.** It instructs reading "as far as the first `## Implementation
  notes` heading", derived via `grep -n '^## Implementation notes'`. On
  the card as it stands in the MAIN checkout that grep **exits 1 — there
  is no such heading**, because main carries the pre-executor card. The
  blindness was taken a different way and it is a cleaner one: the
  executor's 325-line addition is entirely absent from main, so the
  main checkout's 136-line card IS the planner's spec with no executor
  reasoning in it. Recorded because the next verifier will hit the same
  thing: **the bounded read's boundary is the ref, not a heading.**
- **The brief says the deliverable is appended to `## Verdicts` in the
  card. No `## Verdicts` heading existed** — this section creates it.
- **The card's mechanism hop 3 names `pick_project`, which does not
  exist.** Independently re-derived (see above). The executor's
  correction stands.
- **The brief's `cd79f97` for main was current while this verification
  ran and had already moved by the time it was committed** — main is
  `c6ef751` (T-052, T-104, dispatch batch B). `git diff --name-only
  cd79f97 c6ef751 -- app/ lib/ tools/` is **0 files**, so the movement is
  docs-only and NO figure, gate answer or finding above changes. Against
  `c6ef751` the lane is **7 paths** (the three `.rs` plus four
  `docs/tasks/`, the fourth being `T-123-s3`): BOOT GATE still fires on
  3, GRAPH REGEN is still NOT OWED at 0, DOCS GATE now fires on 4. An
  integrator MUST re-derive against whatever main is at the merge.

**Re-verification, for the FRESH executor this card now goes to:** the
two failures reproduce with nothing but a fixture — a stage-0 tree plus a
`.nputer/sessions.json` whose planner entry has no usable
`native_session_id` — driven through `apply_genesis_pick`. Add that shape
as a third positive control beside arms 2 and 3, and make the routing
predicate mean *resumable*, not *present*.
