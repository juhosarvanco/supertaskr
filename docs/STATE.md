# State

Updated: 2026-08-24 by the T-113 integrator (executor-integrator, size S).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: ONE LANE IS LIVE.**
`git worktree list` shows the main checkout and **`../nputer-T-090`** on
`task/T-090-docs-gate-ci`, `touches: [tools/e2e, .github/,
docs/CONVENTIONS.md]`, `status: building`. Every other fence is free,
`app-agent` included — this checkpoint just released it. Expect T-090's
own detached drill worktree to appear and disappear beside it; a detached
entry is not a lane (lane-protocol rule 7). **Do not dispatch anything
touching `tools/e2e`, `.github/` or `docs/CONVENTIONS.md` until T-090
lands.**

## Just completed

**T-113 — one refusal, one report: the `exitNonZero` tail stops repeating
the denials the same loop has just announced.** F-03, milestone 4, size
S, `touches: [app-agent]`, fence never widened. Built and self-integrated
by `claude-opus-5 @T-113`; `review: self-verified`. Main-before
**`2daddee`**, lane tip **`1238062`**, merge **`e231e79`**, this
checkpoint after it. **The card WAS stamped `building` before the cut** —
the pre-cut dispatch stamp `9b03ae6` exercised for the first time, which
is the lapse four checkpoints running could only note.

**WHAT LANDED, AND IT IS A DELETION.** In `run_turn`'s
`StreamLine::Result` arm ONE `unannounced` partition drove TWO reports of
one vector: a live `RunEvent::Denied` per entry, and sixty lines later a
`permission_denials: <names>` note pushed into the diagnostic ring, which
becomes `TurnError::ExitNonZero`'s `stderr_tail` and is rendered verbatim
by `failureDetail` inside `FailureBlock`. T-069 added that note when
NOTHING rendered a denial. T-081 added the live events and NARROWED the
note to the unannounced set — **and the narrowing selected exactly the
set the emit loop three statements up had just announced.** It removed
the note for the denials that did not need it and kept it for the ones
that did not either. Latent until T-101 built the second surface, then
live: one result-only refusal rendering as a `DenialNotice` row AND
inside the failure block, which is T-081's own criterion 4 (*the same
denial shall not be reported twice*) broken by the code written to keep
it.

**THE DELETION IS SAFE BECAUSE ONE REPORT WAS STRICTLY WEAKER, and that
is a property rather than a preference.** The live events are emitted
FROM THAT SAME VECTOR, in the same iteration, onto the same channel, so
coverage is identical BY CONSTRUCTION rather than by two lists agreeing.
Each additionally carries its own `tool_use_id`, which a joined `format!`
string cannot spell. Each survives a missing `tool_name`, which
`denial_names`' `filter_map` drops — **so a refusal the CLI never named
contributed NOTHING to the note, and the note was never that shape's
surface.** And the note was the only one of the two that could be LOST:
the ring is bounded at `MAX_STDERR_RING` and `stderr_tail` exists only on
`ExitNonZero`, so on a turn that SUCCEEDED it reached nobody at all.
Untouched: the partition, the `tool_use_id` join, the emit loop, and the
cumulative `denial_names(&denials)` feeding `TurnError::ToolDenied` —
different question, and that variant carries no `stderr_tail` field.

**SIX PATHS — 3 Rust, 3 `docs/tasks`.** 2 added / 4 modified, 737
insertions, 53 deletions. No IPC, no grant, no event, no manifest, no
lockfile, no `tokens.css`, no store change (`agent-store.ts` is a 0-file
diff), and **no graph movement** — `languages: ["ts"]` still hides
`app/src-tauri/src/agent/**`, the T-043/T-069 shape and the fourth
standing argument for T-010.

## THE THING WORTH CARRYING FORWARD: A NEGATIVE ASSERTION'S CONTROL DECIDED WHICH FIXTURE COULD HOLD THE PIN

The card asked for one body proving a result-only denial on a non-zero
exit produces a live `Denied` event AND a `stderr_tail` that does not
name it. **The obvious fixture cannot carry it, and the reason is the
whole lesson.** `denied-then-end-turn` writes nothing to stderr and its
`result` line is `is_error: false`, so once the note is deleted its tail
is **empty** — and "the tail does not name the tool" is then satisfied
equally by a dead ring, a dead stderr pump, or a turn that never reached
`ExitNonZero`. That is CONVENTIONS' A NEGATIVE ASSERTION NEEDS A POSITIVE
CONTROL, met head-on: a bare *expected absent, got absent*.

So the lane added `denied-result-only-nonzero`, whose CLI writes a real
sentence to stderr — into the same ring the deleted note used — so the
tail is measured CARRYING something on the very turn the tool name is
measured absent from. **The control is a live assertion and was drilled
as one**: deleting the fixture's `eprintln!` reds that body alone.

**THE TWO HALVES ARE PROVABLY NOT EACH OTHER RESTATED, BY LINE NUMBER.**
Re-adding the ring note reds the body at its `!contains("WebFetch")`
assertion; making the emit loop a no-op reds the SAME body at its
`denied_events` equality. Two mutants, two assertions, one body — the
arm-independence evidence T-101's checkpoint asked future lanes to
reproduce, reproduced in a different component.

## THE FENCE HELD, AND THE REPOSITORY ALREADY KNEW THE THING THE LANE THOUGHT IT WAS FINDING

`visibleDenials`' doc comment in `app/src/genesis/interview-model.ts`
goes stale in TWO ways as of this merge: it calls the `exitNonZero`
double report live (*"double-reports today"*), and it routes the fix to
**`T-101-s1`**, a file the seventh triage `6f2f8ea` REMOVED when it
promoted that finding into T-113. `app/src/genesis/**` is
`app-interview`, outside `[app-agent]`, so the lane routed it as
**`T-113-s1`** rather than editing across the fence — T-101's own
discriminating rule applied (*widen when the fence makes THIS CARD'S
criterion unbuildable; route when it makes a NEIGHBOURING defect
unfixable*), second branch, and the card's own last criterion prescribed
exactly this move.

**AND A CORRECTION THE INTEGRATOR OWES ITSELF.** The lane reported, as a
brief error, that the `app-agent` slug map is narrower than practice:
`docs/architecture/components/C-14-agent-runner.md` declares `paths:` as
`app/src-tauri/src/agent/**` plus `agent-store.ts`, which contains
neither `app/src-tauri/tests/agent_runner.rs` nor
`src/bin/fake_agent.rs` — the two test-surface files this lane edited on
T-081's precedent. **ARCHITECTURE already says so, and has for a while**:
its Code-layout bullet's *Note for T-010* names FOUR `.rs` files under
`app/src-tauri/` claimed by no component — `acl_pin.rs`, `index_cmd.rs`,
`src/bin/fake_agent.rs` and `tests/agent_runner.rs` — and flags them as a
live unmapped-territory question the moment Rust extraction lands. The
authority question behind it is `T-089-s7`'s row 5, riding **T-104**.
Nothing new; the derivation just arrived from a third direction. **The
lesson is the standing one: check whether the repository already knows
before filing it as a discovery.**

## THE `T-101-s4` CORRECTION — AND THE INSTRUCTION TO MAKE IT WAS ALREADY OVERTAKEN

The T-113 lane reported `docs/STATE.md`'s `T-101-s4` section as stale and
was asked to append a dated correction inside it. **That section no
longer exists**: T-088's checkpoint `2daddee` rewrote STATE wholesale and
it went with the rewrite, leaving one clause at the T-088-s1 bullet that
is still true. **There is also no `T-101-s4` FILE** — the seventh triage
disposed it. So the correction lands here, as a fresh dated fact, and
nobody's history is rewritten:

- **The finding was EXACTLY RIGHT at its own ref and is stated as such.**
  At T-101's cut `a15b78e`, `method/roles/executor.md` is **19 lines**
  and `grep -c "widen\|fence"` returns **0** — both re-derived here, at
  that ref, today. The mis-citation is a permanent historical fact about
  that lane, and the exoneration stands: `method/lane-protocol.md` did
  not exist in that worktree.
- **A PRESENT-TENSE READER RUNNING THE SAME GREP NOW GETS THE OPPOSITE
  ANSWER.** At this merge `e231e79`, `method/roles/executor.md` is **124
  lines** and carries **6** hits for `widen|fence`, including the
  once-"invented" sentence VERBATIM at line 116 — *"…Widening the fence
  from inside the lane is the one repair this role may never make."* It
  landed in **`88f75d9`** (2026-08-23 19:48:02), T-089's brief-contract
  commit, four days after T-101's cut.
- **What is still live and still wrong is `T-101`'s own card**, which
  says at its verdict *"`method/roles/executor.md` is nineteen lines long
  and contains neither 'fence' nor 'widen'"* in the present tense. **It
  is deliberately NOT edited**: it is a verdict, verdicts are history,
  and the T-085 retraction shape says a superseded claim survives inside
  its own record. This section is the correction a reader meets first.
- **The generalisation, which is why this is a section and not a
  footnote**: a claim measured at a ref and written in the present tense
  goes false without anyone touching it. `T-101-s4` was about a
  quotation nobody re-derived; this is the same defect one turn later,
  where the re-derivation itself needs a ref. **Both halves of the
  correction above carry theirs.**

## Ranges, every dot count stated, at their own refs

Main-before **`2daddee`** (T-088's checkpoint, **verified as the tip by
`git rev-parse` at the moment of merge** rather than taken from the
dispatch message), lane tip **`1238062`**, merge-base **`9b03ae6`** (the
dispatch-stamp commit, unmoved across one main advance).

    git merge-tree --write-tree 2daddee 1238062 -> tree 61f3e05e…, exit 0 (read from $?)
    git diff --name-only 2daddee <TREE>                        -> 6   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 2daddee...1238062  (THREE dots)       -> 6
    git diff --name-only 9b03ae6..1238062   (TWO, branch-only) -> 6
    git diff --name-only 2daddee..1238062   (TWO dots)         -> 18  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 9b03ae6..2daddee   (main's advance)   -> 12
    git diff --name-only 2daddee..e231e79   (TWO dots)         -> 6   THE MERGE'S DIFF
    git diff --name-only 2daddee...e231e79  (THREE dots)       -> 6   COLLAPSES
    git diff --name-only 9b03ae6..e231e79   (merge-base..merge)-> 18  FORBIDDEN AT THE MERGE TOO

`git merge-base --is-ancestor 2daddee e231e79` exits **0**, so at the
merge two dots and three dots COLLAPSE. **THE FORBIDDEN COUNT IS 18 AND
IT IS PURE LEFT-ENDPOINT DRIFT**: main advanced **12** paths, the branch
**6**, `comm -12` over the sorted lists is **EMPTY**, and 12 + 6 = 18 —
the arithmetic that proves the two sets disjoint. **AND THIS LANE WATCHED
THE FORBIDDEN FIGURE MOVE UNDER IT**: measured at **14** while main was
still at `9b03ae6`+T-088's lane work, then **18** once T-088's checkpoint
landed, with the branch's own figure unmoved at 6 throughout. Re-derive
at your own ref; the left endpoint is the half that drifts.

**THE FORECAST WAS EXACT AND WAS CHECKED TWO WAYS.** The merge commit's
own `HEAD^{tree}` IS the `merge-tree` forecast tree `61f3e05e…`,
byte-for-byte, and `diff` over the sorted pre-merge path list against the
merge's own diff exits **0**. Parents are `2daddee` and `1238062` and
nothing else. **NOTHING WAS WRITTEN INTO THE MERGE COMMIT**; every
integrator edit is in this checkpoint.

## THREE standing gates — DERIVED from the merge's own six paths

| gate | trigger | on these 6 |
|---|---|---|
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **3 — FIRES** |
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **3 — FIRES**, three suites |

- **BOOT GATE — FIRES on the three `.rs`, and it was run TWICE**: by the
  executor before handing off (CONVENTIONS assigns it in as many words)
  on scratch port **14940** from the lane, and again AT the merge on
  scratch port **14942**. Both exit **0**. At the merge both lines read
  verbatim — *[nputer] project folder: /Users/ujju/Projects/nputer* and
  *[nputer] window "main" created*.
- **GRAPH REGEN — NOT OWED, and the reason is THE FOUR WALKS rather than
  the gate's own answer**: the indexer deliberately does not collect Rust
  (`Lang::Rust` maps to no extension), so a Rust-only code diff cannot
  move the graph. **ASKED ANYWAY rather than predicted** — `cargo run -p
  nputer-index -- index --check --root ../..` exits **0** at the merge:
  *648863 bytes, 126 files, 1126 symbols, 1712 edges*, T-088's
  checkpoint figures carried through untouched. **No regen was performed
  and none was owed**, which is stated rather than left as silence.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the paths as ARGUMENTS,
  ROOT-RELATIVE, never through `xargs`. On the merge's three `docs/`
  paths: **three** suites owed — app, tools/e2e, lib/parser — and NOT
  cargo, because neither `docs/CONVENTIONS.md` nor
  `docs/research/captures/` is in this merge's diff. **0 frontmatter
  issue(s)**, 12 derived readers across 4 suites, census 119 docs-shaped
  sites in 22 files (12 in 10 files resolving into this repo's docs/), 24
  files holding the repository root (11 derived, 0 unlinked, 13 with no
  linkable site), 1 package-relative site derived, root-anchor ledger
  holding at 6. Re-run after EVERY doc write this checkpoint makes
  (T-081-s9), never read.

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command. `timeout` is absent from this shell.

- **bare Rust `cargo test --no-fail-fast`: 383 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines. **It closes from both directions**: main at `2daddee`
  is 382 (T-088's advance is **12 paths and ZERO `.rs`**, derived, so it
  moved no Rust body), and this lane adds exactly ONE new test body. No
  new test FILE, so the file count is main's.
  **`T-088-s4`'s new flake did NOT fire — honest tally 1 of 1 green, no
  re-run performed and none needed**, and this run happened while T-090
  was live and running its own suites, which is the concurrent load that
  finding names.
- **parser: 263/263 across 12 files**, exit **0**. Unmoved — this merge
  adds no parser input beyond three legal task cards.
- **app: 940/940 across 46 files**, exit **0**; `npm run build` **0**
  first (six files read `app/dist`). Unmoved from main — T-088's
  checkpoint left it at 940 and this merge adds no app test.
- **E2E: 135/135**, exit **0**, scratch port **14941**; `npm run
  typecheck` **0**.
- **token lint: selftest 0, lint 0** — *clean (TOKEN 131 files under
  app/src, app/test, tools/e2e; CONTROL 605 tracked text files)*.
  **CONTROL closes from main**: 603 at T-088's checkpoint + the **2**
  files this merge ADDS = 605, and the lint printed 605. **TOKEN is 131
  and does not move**: this merge adds zero `.ts`/`.tsx`/`.mjs` under
  those three roots.
- **`cargo audit -n`** exit **0**, 472 crates, **0 vulnerabilities / 17
  allowed warnings**, unmoved — which a 0-file `Cargo.lock` diff
  requires.

## The poison drill — arm (c), FOUR mutants, one side only

Detached scratch worktree at the lane tip's code commit **`55f9b1b`**
with its own `CARGO_TARGET_DIR` **inside it** (2.0 GB, so the parent's
cache was provably not shared — arm (c) exists because the compile-time
`CARGO_MANIFEST_DIR` pollution runs BOTH ways and a mutant can look DEAD
against a stale binary). Baseline **75 passed / 0 failed / 1 ignored,
exit 0** on `--test agent_runner`.

Every mutation was applied by a driver that **REFUSES a non-absolute path
outright and refuses any match count that is not exactly 1**, so a
command that does not name the drill cannot run at all (T-085's `perl -i`
accident made mechanical rather than careful), and **every mutated TEXT
was read back with `git diff --unified=0` BEFORE its suite ran** (T-078:
the count can be right while the text is wrong). Producer side only,
never an assertion.

| # | mutant (producer only) | exit | result | reds |
|---|---|---|---|---|
| M1 | the `permission_denials:` ring note RE-ADDED verbatim | 101 | 71/75 | the four re-targeted tail bodies; new body at `:1777` |
| M2 | the live emit loop made a no-op | 101 | 69/75 | those four **+** the two T-081 join bodies; new body at `:1755` |
| M3 | cumulative record narrowed to the unannounced set | 101 | 74/75 | `a_turn_killed_by_a_denied_tool_…` **ALONE** — new body GREEN |
| M4 | the fixture's `eprintln!` deleted (the control's producer) | 101 | 74/75 | the new body **ALONE**, at `:1772` |

**M1 and M2 are the card's two named directions and they are not one
mutant twice**: M2 reds strictly more (the T-081 join bodies depend on
the emit loop, not on the note), and inside the ONE new body they red at
DIFFERENT assertions. **M3 is what makes "the cumulative record is
asserted separately" a measurement**: narrowing it reds exactly one body,
and that body is not this card's. **M4 is what makes the positive control
an assertion rather than decoration.**

**Restoration proved THREE ways after every mutant and again at the end**:
an empty `git status` over the whole drill worktree, a per-path sha256
against `git show 55f9b1b:<path>` for all three touched files
(`runner.rs` `43b3d72b…`, `fake_agent.rs` `9b531bbf…`, `agent_runner.rs`
`1e3e8062…`), and a clean re-run at **75/75 exit 0**, identical to the
baseline. Worktree removed and pruned. **The parent's cache is provably
uncontaminated**: bare `cargo test` in the lane AFTER the drill is
383/0/3 exit 0, so T-013's 336-passed/33-failed pollution did not recur.

**SHAPE SIX asked of the one new body and answered in its own doc
comment**: no other test drives this call — the two `denied-then-end-turn`
bodies have no positive control, `one_denial_on_each_channel_is_reported_once_each`
exits ZERO on purpose so it has no `stderr_tail` at all, and
`a_denial_missing_its_fields_…` puts its nameless denial on the IN-BAND
channel over an EMPTY `permission_denials`.

## THE SAME FINDING ARRIVED FROM TWO LANES AT ONCE, AND THE SECOND ONE SAID SO

T-088 and T-113 independently filed the shared-scratchpad drill
collision. **`T-088-s3` is the primary** — it measured the near miss
between T-088 and T-090 and named the mechanism nobody had: each drill
driver's post-T-085 path refusal guards a shared PREFIX, so it asks *"is
this A drill"* rather than *"is this MY drill"*, and what actually kept
the lanes safe was `git worktree add` refusing an existing path, which
protects the CREATE and not the MUTATE.

**`T-113-s2` was rewritten to be explicitly subordinate to it** rather
than left to look like a second sighting: its own first paragraph names
`T-088-s3` as primary and asks triage to FOLD rather than park both. What
it adds is two things — it is **THREE lanes of three**, this one having
held `<scratchpad>/drill` from 13:07 to 13:11 before either of T-088-s3's
two, and the PREFIX defect is true of THIS lane's independently written
driver as well. **Three sessions wrote the same guard and all three got
it wrong the same way**, which is the argument that the convention is
under-specified rather than the sessions careless. The fix is one line —
name the drill `drill-T-NNN` — and **T-090's fence already contains
`docs/CONVENTIONS.md`**, so absorbing it needs no widening.

**The honest limit is recorded on both files**: the near MISS is
measured; the HIT is an inference from git's documented refusal. T-113's
lane deliberately did NOT provoke it, because forcing the collision means
running `git worktree add` onto a path another live lane holds, and a
sibling's scratch worktree is that lane's property.

## Security sweep — every figure re-derived at the merged tree

- **`acl_pin.rs` is a 0-file diff at sha256 `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`**,
  the pinned value, unmoved. `EXPECTED_GRANTS`: declaration line 54,
  closing `];` line 147, entries 55–146 = **92**, zero blank or comment
  lines inside, 92 quoted strings / 92 UNIQUE.
- **IPC 14/14, derived from BOTH ENDS and reconciled BY NAME.**
  Line-anchored `#[tauri::command]` attributes = **14**;
  `generate_handler![…]` entries with `//` stripped = **14**; **`comm -3`
  over the two sorted NAME lists is EMPTY**. Unmoved, which a 0-line
  `lib.rs` diff requires.
- **Exactly THREE `#[ignore]` attributes**, line-anchored:
  `crates/nputer-index/tests/perf.rs`,
  `crates/nputer-index/tests/self_graph.rs` and `tests/agent_runner.rs` —
  the env-gated real-CLI smoke, left ignored. **Cited by FILE and symbol,
  never by line**: the previous checkpoint's line numbers had already
  drifted under this merge.
- **0 manifests, lockfiles, capability files, `.entitlements` or
  `tokens.css`** in the merge's diff — no dependency added.
- **0 secret-shaped hits** over the merge's **737** added lines.
- **0 NUL bytes across all 6 paths**, from a CANARY-VALIDATED byte probe
  — positive canary reports 1, clean control reports 0. **AND THE NAIVE
  PROBE LIED AGAIN IN THE SAME RUN**: `LC_ALL=C grep -qP '\x00'` exits
  **1 on the positive canary**, a false GREEN, for the fifth checkpoint
  running.
  **A NEW WAY TO GET A FALSE ZERO, CAUGHT ON MYSELF AND RECORDED BECAUSE
  IT ALMOST SHIPPED**: the first run of that probe was issued from
  `app/src-tauri/` against repo-root-relative paths. Every `wc -c` failed
  with *no such file*, the arithmetic evaluated to `0 - 0`, and the probe
  printed a clean **0 for all six paths** with the error text scrolling
  past above it. **A probe that cannot find its input must say MISSING,
  never 0** — the corrected form tests `[ -f ]` first. Canary-validating
  the PROBE does not validate the PATHS.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after, throughout both phases — no bind, no connect,
no signal, on any interface. Holder `node` pid **82549**, one socket
`TCP [::1]:1420 (LISTEN)`, identical at 13:11:21, 13:22:04, 13:48:30,
14:05:32 and 14:07:19.

1. **THE APP RELAUNCHED, AND THIS TIME THAT IS THE CORRECT PREDICTION —
   the first merge in several where it is.** T-101's checkpoint recorded
   the distinction and three checkpoints before it got it wrong: `tauri
   dev` restarts the RUST BINARY on `app/src-tauri/**` changes, while
   `app/src/**` changes go to VITE and are HMR'd into the running
   webview. **This merge is `app/src-tauri/**` only**, so it is the
   relaunch case rather than the HMR case. Measured, not assumed: the pid
   this project last recorded (**93529**, T-101's window) is **GONE**,
   and the app is now pid **88272**, started **14:02:15** — the merge
   commit is timestamped **14:02:14** — under the SAME supervisor chain
   (`npm run tauri dev` 82342 → `tauri dev` 82364, both from Aug 18).
   Sampled every ~12 s afterwards to 14:07:19: pid unchanged, stable.
   The process match was ANCHORED (`awk '$NF=="target/debug/nputer"'`),
   because `grep 'target/debug/nputer'` matches `nputer-index` as a
   substring and read exactly like a relaunch once already.
2. **AND A SHARING NOBODY HAS WRITTEN DOWN, MEASURED HERE FOR THE FIRST
   TIME.** `target/debug/nputer` has mtime **14:05:31**, which is LATER
   than the start time of the process running it and is exactly when this
   checkpoint's BOOT GATE was finishing. **The boot check runs `npm run
   tauri dev` from the same `app/` directory as the human's live dev
   server, so it builds into the same `app/src-tauri/target/`** — an
   integrator's boot gate and a `cargo test` in the main checkout both
   contend with the human's running `tauri dev` for that cache, and can
   hand it a freshly rebuilt binary. Nothing broke: the running process
   holds its own inode and was stable across every sample. The PORT RULE
   covers port contention and says nothing about TARGET-DIR contention;
   an executor's boot gate runs in its own worktree and cannot see this
   at all, so **only the integrator meets it**. Recorded here rather than
   filed, because it is an observation about the ceremony rather than a
   defect in the tree — and because the next integrator whose boot gate
   takes four minutes should know why.
3. **The map pane sees NO new graph**: `docs/architecture/graph.json` is
   a 0-file diff in this merge and `index --check` exits 0 on both sides
   of it.

**No process from this integration survives.** FOUR scratch ports were
used across both phases, each more than once — **14940** (the executor's
boot gate), **14941** (a lane e2e re-run, then the merge's e2e), **14942**
(a lane e2e re-run, then the merge's BOOT GATE) and **14943** (a lane
e2e re-run, then the e2e that validates this checkpoint's own sentences)
— each read with
`lsof -nP -iTCP:<port> -sTCP:LISTEN` **FIRST** (zero rows — the
authority) and then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1`
and `::`, in that order and never the reverse, and each free again after.
None is the default 14520 and none is 1420. **No `pkill` at any point.**
No real model call and no real CLI spawn — `real_cli_arms_forbidden()` is
automatic under cargo test and the one env-gated smoke stays ignored. **No
screen control**; the boot check opens and closes its own window, which
is ruled not screen control. The T-113 worktree is removed and the branch
kept. The two `nputer-T-060` `fake_agent` orphans (`52504`/`52505`) are
unchanged and left alone. **The untracked zero-byte file `z`** still sits
in the main checkout — not mine, not staged, left alone for the sixth
checkpoint running.

**The shared capture fixture was checked before and after.**
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` is
byte-identical to `HEAD` (sha256 `273a3d33…`, empty `git diff`) in the
lane and in the main checkout. This card's drill is Rust-only and never
opened it.

## Two documents ticked, and ROADMAP was checked rather than assumed

- **ARCHITECTURE, twice.** C-13's T-101 entry carried *"ONE DEFECT SHIPS,
  DISCLOSED IN THE CODE… a single result-only refusal is reported
  twice"* — **true when written at `5b80d32` and false as of this
  merge.** Corrected IN PLACE on T-101's own precedent for T-081's
  paragraph (tense moved, reasoning kept, both refs named), because the
  three reasons a render-side key would have been wrong still stand and
  are exactly why the fix was C-14's. C-14 gains a full T-113 paragraph
  for the deletion and why one of the two reports was strictly weaker.
- **ROADMAP DID need a tick — and the integrator's first answer was
  WRONG, by exactly the mechanism this checkpoint devotes a section to.**
  The check run first was
  `git grep -n "permission_denials\|stderr_tail" docs/ROADMAP.md`, which
  exits **1 with no output**, and on that basis this bullet briefly read
  *"ROADMAP needs no tick and that was checked, not assumed."* **It was
  green and wrong.** ROADMAP's milestone-3 T-101 paragraph says the thing
  in PROSE, using neither identifier: *"One report is still duplicated,
  on the exit-code path, and it is disclosed in the code and routed
  rather than argued away (T-101-s1)"* — present tense, and false as of
  this merge. Found by READING the paragraph the grep had already cleared.
  Corrected in place with the ref, keeping the disclosure as history and
  naming the card that closed it.
  **THE LESSON IS THE `T-101-s4` LESSON WEARING A GREP'S COSTUME**, and
  it is recorded here because the integrator caught it on itself two
  paragraphs after writing that section: **a negative derived from
  chosen search terms is only as good as the terms.** A document that
  describes a mechanism in English rather than in identifiers is
  invisible to an identifier grep, and "the grep returned nothing" is not
  "the claim is absent" — it is "my vocabulary was absent". For a tick
  check, grep to FIND candidates and then READ the section; the two are
  not substitutes.

## The board, derived from disk at this checkpoint

**167 flat task files — 74 done / 46 planned / 40 parked / 6 SUGGESTED /
0 verifying / 1 building; 26 in `rejected/`.** The one `building` is
**T-090**, the live lane. The six suggestions are `T-088-s1`…`s4` and
`T-113-s1`/`s2`; the backlog reached ZERO at the seventh triage
(`6f2f8ea`) and has climbed to six in two merges.

**74 done — 56 `same-model`, 12 `self-verified`, 5 `independent`, 1 EMPTY
(T-056)**; 56 + 12 + 5 + 1 = 74. T-113 moves `self-verified` from 11 to
12.

## Provenance — and `built_by:` was SELF-DECLARED, never read off a trailer

T-113 is **built and integrated by `claude-opus-5`**, one session, `review:
self-verified`, with `verifier:` and `verified_by:` left EMPTY — the
convention every other `self-verified` card on this board uses, checked
against T-016, T-036 and T-038 rather than assumed.

**The trailer lied again and was ignored again.** Every commit on this
lane carries `Co-Authored-By: Claude Fable 5`, which is a harness
constant and not evidence of a model — T-085 proved it, T-101 sharpened
it with a counterexample inside one lane, and T-088's integrator met it
from a third seat. `built_by: claude-opus-5 @T-113` is this session's own
declaration. **A session's model belongs in that field only if the
session declared it, and reading it off your own commit signature is how
this goes wrong every time.**

## In progress / broken right now

**ONE LANE IS LIVE: T-090**, `task/T-090-docs-gate-ci` at
`../nputer-T-090`, `touches: [tools/e2e, .github/, docs/CONVENTIONS.md]`,
cut from `9b03ae6` and still in Phase 1 at this checkpoint. Its base is
now TWO main advances behind (`9b03ae6` → `2daddee` → this checkpoint),
so **its integrator must re-derive the range at the then-current tip** —
this lane watched its own forbidden figure go 14 → 18 under exactly that
drift.

**Every other fence is free, `app-agent` included.** Nothing is broken.
Parser, app, Rust, E2E, token lint and its selftest, `cargo audit`, the
graph-currency gate and the docs gate are all green at this commit;
**all three standing gates were DERIVED, two FIRED and were RUN, and the
third was asked rather than predicted.**

**Merged and checkpointed today:** T-013, T-097, T-085, T-101, T-088
(`bd5864b`/`2daddee`) and T-113 (`e231e79`/this commit).

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1126 SYMBOLS / 1712
EDGES / 648863 BYTES**, and should forecast the DELTA rather than the
absolutes.

## Next up

1. **`T-102` IS UNBLOCKED — and its criterion 6 is the one to read
   first.** It carries `blocked_by: [T-113]`, which is now satisfied, and
   `touches: [app-agent]`, which is now free. The architect amended its
   criteria 4–6 to the post-T-113 tree on 2026-08-24; **criterion 6 now
   pins the ABSENCE** (a denial delivered as its own live event is NOT
   also in the tail) rather than the deleted narrowing, and the
   superseded text survives only inside its own retraction. A T-102
   executor who reverts `denial_names(unannounced…)` to make a mutant red
   is re-introducing the double report under a green suite. **The pin it
   needs already exists** —
   `a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`
   — so criterion 6 should ask the shape-six question before adding a
   second body.
2. **`T-113-s1` is the cheapest thing this merge deposited.** One
   paragraph of `visibleDenials`' doc comment describes a closed defect
   in the present tense and routes to a removed file. Fence
   `[app-interview]`, now free; no behaviour moves; the app suite's 45
   bodies on that file are untouched by it.
3. **`T-088-s3` + `T-113-s2` should be FOLDED, not both parked.** Same
   defect from two lanes, with `T-113-s2` already naming `T-088-s3` as
   primary in its own frontmatter-adjacent first paragraph. The fix is
   one line of CONVENTIONS (`drill-T-NNN`) and **T-090's fence already
   contains that file**.
4. **`T-101-s3` still has three confirmations and no owner, and it
   belongs to T-090** — the same card, the same fence, and T-090 is live
   RIGHT NOW. A `./`-prefixed or absolute path list disarms the docs gate
   at exit 0. One-line normalisation in `docsGate()`.
5. **`T-088-s4`'s flake did not fire here but is not disproved.** One
   green run under concurrent load is one sample. Keep the honest-tally
   discipline: a re-run is news, never silence.
6. **`T-089-s1` is still unblocked and still unpaid.** The method version
   owes a bump to v0.1.6; it is a three-file commit whose third file is
   Rust (`kit.rs`, `app-agent` — free again as of this checkpoint) plus
   an unpinned fourth hand-edit. Do not split it: the two asserts are
   ORDERED.
7. **@human still owes T-101 one look**, unchanged and now easier to
   judge: provoke a refusal in a genesis turn and check that the notice
   reads as quiet furniture on a turn that still reads COMPLETED. **And
   this merge changes what a FAILED turn looks like**: a result-only
   refusal on a non-zero exit now appears ONCE, as a notice row, with the
   failure block no longer repeating the tool name underneath. **The app
   in front of you already has this code — it arrived by RELAUNCH, not by
   HMR** (pid 88272), which is the opposite of T-101's case and the
   distinction T-052 records.
