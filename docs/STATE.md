# State

Updated: 2026-08-20 by architect (T-077 merged and checkpointed),
claude-opus-5 @T-081-integrate.

## Just completed

**T-081 — a denial is news when it happens.** F-03, milestone 4, size M,
`touches: [app-agent]`. Built by `claude-opus-5 @fresh`, **re-built after
a rejection by `claude-opus-5 @T-081-fix`**, verified by
`claude-opus-5 @T-081-verify` and re-verified `@T-081-verify2`;
`review: same-model`. **The first verdict was a REJECTION and both
verdicts are in the card.** Approved branch tip **`7c83e79`**; merge
**`55257a6`**. The card was at `status: verifying`; the integrator
stamped **`done`** at this checkpoint, the **ninth** card running
(T-043, T-057, T-076, T-073, T-069, T-078, T-080, T-083, T-081).

**TWENTY-ONE PATHS, TEN OF THEM CODE, AND ELEVEN UNDER `docs/`.**
Re-derived here, not inherited from the verdict: `M` four `.rs`
(`agent/runner.rs` +470, `bin/fake_agent.rs` +345, `tests/agent_runner.rs`
+485, `agent/mod.rs` +36), `M` five `.ts` + one `.tsx`
(`lib/agent-store.ts` +67, `genesis/interview-model.ts` +7, and four test
files), `M` the card itself (+1304) and `A` ten findings `T-081-s1` …
`s10`. 3369 insertions, 48 deletions. **BOTH GATES FIRE at six paths
each**, and this is the integrator's regen to owe (below).

**THE BRIEF SAID TWENTY AND THE TREE SAYS TWENTY-ONE, and both are
right at their own ref.** The dispatch brief's 20 was the verifier's
figure at `5b14603`; the APPROVED tip is `7c83e79`, the verdict commit,
which adds `T-081-s10`. The range rule's own lesson applied to the
RIGHT-hand endpoint for once instead of the left: **a path count with no
ref is as stale as a duration with no ref.** Same for the forbidden
form, which the brief reports at 31 (`f4f77d7`) and 32 (`073f136`)
against `5b14603` — **against `7c83e79` it is 33**, and the extra path is
`s10` itself.

**WHAT LANDED.** The CLI announces a permission denial the moment it
happens, on a `system`/`permission_denied` line carrying neither `error`
nor `error_status` — so `classify_line`'s `system` arm, which asks
whether an error field is PRESENT, returned `Ignored` and the line never
reached the parse at all. On the observed 2.1.226 turn the denials
preceded the `result` line by roughly forty seconds of silence. The arm
is now keyed POSITIVELY on `subtype`, because a lack cannot be matched.
`StreamLine::Denial` classifies it, `RunEvent::Denied { seq, turn,
tool_name, tool_use_id, message }` relays it live, `GenesisDenial` +
`GenesisTurn.denials` mirror it in the store, and `tool_use_id` joins the
in-band channel against the `result` line's cumulative
`permission_denials` so one denial is reported exactly once while a
`result`-only denial is still reported at all. The classification is
UNTOUCHED — the observed turn carried two denials and completed, which
vindicates T-029-s7's narrow guard rather than merely permitting it.

## The rejection is the substance of this card

**Criterion 4 names `tool_use_id` as the join key, and no body could tell
it from `tool_name`** — moving both join sites together passed 351/0/3
with zero bodies red. Both of the first pass's new fixtures missed it by
construction: one announced both denials in band, the other gave its two
ids different names. **The fix is a fixture with the captured turn's own
shape** — `["Bash", "Bash"]`, the same tool refused twice with one
in-band line absent — plus one body,
`a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first`. **The
runner was correct throughout and was not changed**: `git diff` over
`app/src-tauri/src/agent/runner.rs` between the two executor passes is
byte-empty. The defect was a missing witness, not a wrong mechanism, and
the second verdict re-derived it rather than accepting the fix report.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 073f136 7c83e79   -> tree dd99d3ea…, exit 0
    git diff --name-only 073f136 <TREE>                        -> 21   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 073f136...7c83e79   (THREE dots)      -> 21   cmp against the forecast: exit 0
    git diff --name-only d61e986..7c83e79    (TWO, branch-only)-> 21   cmp against the forecast: exit 0
    git diff --name-only 073f136..7c83e79    (TWO dots)        -> 33   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 073f136..55257a6    (TWO dots)        -> 21   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only 073f136...55257a6   (THREE dots)      -> 21   collapses onto the line above, cmp exit 0
    git diff --name-only d61e986..55257a6    (TWO dots)        -> 33   the naive at-merge range

`git merge-base --is-ancestor 073f136 55257a6` exits **0**, so at the
merge two dots and three dots COLLAPSE; before it they differ by main's
entire advance. **THE FORBIDDEN FORM MOVED THREE TIMES ON THIS ONE LANE
AND THE CORRECT ANSWER NEVER MOVED** — 31 at `f4f77d7`, 32 at
`073f136`, 33 at `073f136` against the later right-hand endpoint — and
BOTH endpoints contributed, which is the wrinkle T-083's table (same
right-hand tip throughout) could not show.

## Integration truth

T-081 and main share merge-base **`d61e986`**, five main commits back.
Main advanced **12** paths from that base — **all twelve under `docs/`**;
T-081 changed **21**. **Their changed-file intersection is EMPTY**,
`comm -12` over the two sorted lists; 12 + 21 = 33, which is exactly the
forbidden two-dot count, and that arithmetic is the check that the two
sets really are disjoint.

**THE PRE-MERGE FORECAST WAS THE COMMAND THE RANGE RULE PRESCRIBES, AND
IT WAS EXACT UNDER BOTH METRICS.** `git merge-tree --write-tree 073f136
7c83e79` returned tree **`dd99d3ea8a35beffcf29cca1dd7b1a50cf5097ea`** at
**exit 0**, read from `$?` and not swallowed by a command substitution.
`git diff --name-only 073f136 <TREE>` gave the twenty-one paths, `cmp`
exit 0 against the merge's later diff, **and the whole patch is
byte-identical too, `cmp` exit 0**. **The no-ff merge `55257a6` produced
that tree EXACTLY** — `git rev-parse HEAD^{tree}` IS `dd99d3ea…` — with
parents `073f136` and `7c83e79` and nothing else. Another data point for
the scoreboard, scoring in `merge-tree`'s column under both metrics.

The staged set at `git merge --no-commit` was the twenty-one paths and
nothing more, read with `git diff --cached --stat` before the commit and
`cmp`-ed against the forecast list at exit 0; zero untracked and zero
unstaged. The approved worktree was clean at `7c83e79`. **NOTHING WAS
WRITTEN INTO THE MERGE COMMIT** (`T-083-s4`'s request of this role):
every integrator edit is in this checkpoint.

## The two gates — BOTH FIRE, and this merge does NOT flip either

| gate | prescribed `073f136..55257a6` (TWO dots) | naive `d61e986..55257a6` (TWO dots) |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **6 — FIRES** | 6 — fires |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **6 — FIRES** | 6 — fires |

**THE TWO DERIVATIONS AGREE HERE, and the reason is worth writing down
because it is the complement of T-083's case**: main's twelve-path
advance is *entirely* `docs/`, so the naive range adds nothing either
trigger can match. **The naive range is not always wrong — it is
unreliable**, and a merge where it happens to agree is not evidence for
it. The BOOT six are the four `.rs` plus the two `app/src/**` `.ts`; the
GRAPH six are the two `app/src/**` `.ts` plus the four `app/test/**`
files. Their intersection is the two `app/src` files; their union is the
ten code paths. Suffix census of the merge: **11 md, 4 rs, 5 ts, 1 tsx**.

**GRAPH REGEN — OWED, RUN, AND COMMITTED WITH THIS CHECKPOINT.** The
executor deliberately committed no regenerated graph, correctly, because
CONVENTIONS puts the regen at the checkpoint. At the merge
`index --check --root ../..` from app/src-tauri exits **1** — a real red,
not a stale artifact:

    committed:   575619 bytes · 118 files · 995 symbols · 1518 edges
    fresh index: 576235 bytes · 118 files · 996 symbols · 1520 edges
    files  +0  -0  ~6      edges  +2  -0
    | + s:app/src/lib/agent-store.ts#GenesisEvent -> …#GenesisDenial (type_ref)
    | + s:app/src/lib/agent-store.ts#GenesisTurn  -> …#GenesisDenial (type_ref)

`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored` exits **0**, moves exactly one path
(`docs/architecture/graph.json`, +135/−113), and `index --check` then
exits **0**: *graph.json is CURRENT … 576235 bytes, 118 files, 996
symbols, 1520 edges*. **The `~6` files are exactly the GRAPH REGEN
trigger's own six**, which is the trigger being right rather than merely
wide.

**BOOT GATE — RUN FROM `tools/e2e`, NOT `app/`.**
`NPUTER_BOOT_PORT=19841 npm run boot:check`, `BOOT_CHECK_EXIT=0`, both
`[nputer]` lines detected: *`[nputer] project folder:
/Users/ujju/Projects/nputer`* and *`[nputer] window "main" created`*.
Port 19841 bind-probed FREE on all four stacks (`127.0.0.1`, `0.0.0.0`,
`::1`, `::`) before use — an IPv4-only probe of a v6 listener reports
free, which is why all four.

## The fixture forecast, and whether it was complete

**Forecast, written before any suite ran, and DERIVED rather than
assumed.** T-024-s5's three-fixture rule carries its own carve-out — *"A
MERGE REGEN alone moves only the two app fixtures — the parser pin holds
unless the REGISTRY itself changed"* — and
`git diff 073f136..55257a6 -- docs/architecture/components/` is a 0-file
diff, so `lib/parser/test/smoke.test.ts` holds. For the two APP fixtures
the question is the regen's content, and the regen answers it: **both new
edges have BOTH endpoints in `app/src/lib/agent-store.ts`** — one file,
therefore one component — so no cross-component relation and no
`observedCount` can move; and `files +0 -0 ~6` means
`architecture-dogfood.test.ts`'s pinned `fileComponent.size` **must** hold
at 118, because the branch ADDS no indexed file (all ten code paths are
`M`, and the ten new `.md` are `.nputerignore`d). So: **zero assertions
move in any of the three; TOKEN holds at 119; CONTROL moves 553 → 563;
the walk-policy count holds at 71; the registry still stops at C-14.**

**THE FORECAST WAS CORRECT ON EVERY LINE, and it was checked the strong
way rather than the cheap way.** `npm test` was run TWICE — once against
the merge's tree with the OLD committed graph and once after the regen
with the NEW one — **831/831 across 42 files, exit 0, both times**, with
`architecture-dogfood` 9/9 and `map-dogfood-render` 8/8 in each. A single
post-regen green would have proved the fixtures pass; the pair proves the
regen did not MOVE them, which is the claim the three-fixture rule
actually makes.

## Suites, every number derived at this checkpoint, exits read unpiped

Each command's own `$?` was echoed immediately. **No exit code here was
taken through a pipe** — `${PIPESTATUS[0]}` is empty in zsh and `head` at
the end of a pipeline reports its own success.

- **bare Rust workspace, `cargo test` PLAIN: 352 passed / 0 failed / 3
  ignored**, `CARGO_TEST_EXIT=0`, summed programmatically from
  **fifteen** `test result:` lines. Not `--all-targets`, which skips
  doc-tests. **+9 on main's 343** — the five new bodies in
  `tests/agent_runner.rs`, three in `runner.rs`'s unit module, one more.
- **app: 831/831 across 42 files**, `APP_TEST_PRE_EXIT=0` and
  `APP_TEST_POST_EXIT=0`. `npm run build` `APP_BUILD_EXIT=0`, **265
  modules transformed**, emitting `index-3bNJ6pCB.js` **501.54 kB** and
  `index-CwYF5FQb.css` **43.95 kB**. **+2 on main's 829** (the two new
  `agent-store.test.ts` bodies). The JS content hash moved because
  `app/src` moved; **the CSS hash did not**, which is the honest form of
  "zero new tokens".
- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`. Unmoved — and its smoke test parses this
  repo's live `docs/` tree and requires zero issues over ten new flat
  `docs/tasks/T-081-s*.md`, which is the dogfood discipline this card's
  own `s9` is about.
- **E2E: 91/91**, `E2E_EXIT=0`, one worker, zero retries, zero skips, on
  scratch port **19843**; `npm run typecheck` `E2E_TYPECHECK_EXIT=0`.
  Unmoved, as a 0-path `tools/e2e` diff requires.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 119 files under app/src, app/test,
  tools/e2e; CONTROL 563 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples, **71** walk-policy checks, 8 evidence-floor checks.
- **`cargo audit -n`** (no fetch) `CARGO_AUDIT_EXIT=0`: 472 locked
  crates, **0 vulnerabilities / 17 allowed warnings** — 16
  `unmaintained` + 1 `unsound`, counted by exact line match, unmoved,
  which a 0-file `Cargo.lock` diff requires.
- **`index --check`** exit **1** before the regen and **0** after; see
  the gate section.
- **CONVENTIONS' two live readers, both exercised**: `workflow-parity`
  14/14 inside the 91, and
  `snapshot_version_matches_the_live_method_stamps` in
  `app/src-tauri/src/agent/kit.rs` ok inside the `cargo test` above.

**CONTROL CLOSES ARITHMETICALLY FROM THREE DIRECTIONS, EVERY NUMBER AT
ITS OWN REF, ALL DERIVED FROM `git ls-tree` RATHER THAN REMEMBERED**
(tracked − files under a `SKIP_DIRS` component − files with a
`CONTROL_BINARY_EXTENSIONS` suffix, both sets read out of
`token-scan.mjs`; the SKIP set matches nothing tracked and the binary set
matches 18 at every ref below):

| ref | tracked | CONTROL |
|---|---|---|
| `d61e986` merge-base | 566 | **548** |
| `073f136` main-before | 571 | **553** |
| `7c83e79` approved tip | 576 | **558** |
| `55257a6` the merge | 581 | **563**, and the lint prints 563 |

Main added 5 files, the branch added 10, neither deleted any:
548 + 5 = 553, 548 + 10 = 558, 553 + 10 = 558 + 5 = 548 + 15 = **563**.
The brief's two figures (553 on main, 558 on the branch) both reproduce.
TOKEN is **119 and cannot move**: the merge adds no file under
`app/src`, `app/test` or `tools/e2e`, only modifies six.

## The poison drill — run at the MERGED commit, in a detached scratch worktree

**The correspondence was established by hash before anything was
mutated**, three ways: `git show 55257a6:app/src-tauri/src/agent/runner.rs`,
the file in the drill worktree, and the file in the main checkout are all
sha256 **`10c7bca22290862b4224cd10d9564513603914e9614909d33d0baaa2109852bb`**;
`tests/agent_runner.rs` likewise at `4853f296…`. **The drill ran in a
DETACHED worktree at `55257a6`**, which is not fastidiousness: mutating
`app/src-tauri/**` in the main checkout writes into a target directory the
human's `tauri dev` is watching, and it would have hot-pushed a poisoned
build into their window.

**M1 — the verifier's survivor, both join sites `tool_use_id` →
`tool_name`, one-sided (the code under test, never the assertion):**

    M1_EXIT=101 · 351 passed / 1 failed / 3 ignored
    RED: a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first
      left:  [Some("toolu_announced")]
     right:  [Some("toolu_announced"), Some("toolu_never_announced")]

**and it is the ONLY body that reds.** The silence the rejection
demonstrated is a failing assertion now, and the pin is precise rather
than incidental. Both substitutions were counted (1 and 1) AND the
mutated TEXT was read back with `git diff` before the suite ran —
two hunks, one per join site — which is the limb that caught a
half-applied `perl` pass on this repo the night before. Restoration
proved two ways: empty `git diff -- <path>` and sha256 back to
`10c7bca2…` against `git show 55257a6:<path>`. Drill worktree
`git status --porcelain` clean, worktree removed.

**The wider drill set is the executor's and the verifier's** — ten rounds
and five, recorded in the card, including M7's supersession by M10 for
poison shape six. This role re-ran the ONE mutant that isolates the
rejection's defect, at the merged commit, which is the question a
checkpoint can answer that a verdict cannot: *does the fix survive
contact with main.*

## Security sweep — zero movement, every figure re-derived, two traps hit

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no
`.entitlements`** — 0 paths matched any of them, and
`git diff 073f136..55257a6 -- '*Cargo.toml' '*package.json'` is **0
lines**. No dependency added.

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff across the merge**,
  sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
  `EXPECTED_GRANTS`: declaration line **54**, closing `];` line **147**,
  span **94**, entries 55–146 = **92**, with **ZERO** comment or blank —
  counted four independent ways over the symbol-anchored body (92
  quote-bearing lines, 92 quoted strings, 92 UNIQUE quoted strings, 92
  lines matching the strict entry shape). The doc-comment-anchoring error
  that produced STATE's older "128 / 36" is `T-082-s1`'s and is not
  repeated here. **Name the symbol and stop.**
- `ENV_ALLOWLIST` in `app/src-tauri/src/agent/runner.rs`: **16 entries,
  423 bytes, span 20** — and its declaration **MOVED from line 939 to
  line 1000** because T-081 added code above it, while the body is
  `diff`-identical across the merge at exit 0. That is the rule
  demonstrating itself: **anchor on the symbol, never on a line number**,
  and a checkpoint that quotes last night's line number is already wrong.
  The three-entry `ENV_ALLOWLIST_LINUX` at line 1022 is a separate symbol
  and is not in the count.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, pathspec `'*.rs'` from the
  repo ROOT, cited by file and line:
  `crates/nputer-index/tests/perf.rs:53`,
  `crates/nputer-index/tests/self_graph.rs:58`,
  `tests/agent_runner.rs:3767`. **11** raw hits for the string in `*.rs`,
  of which **8** are prose inside doc comments. The pathspec is
  load-bearing (T-082-s2): with pathspec `.` the literal appears in **25**
  tracked files.
- **IPC is THIRTEEN at both ends**: 13 `#[tauri::command]` attributes and
  13 `generate_handler!` entries. An event is not a command — this merge
  adds `RunEvent::Denied` and no IPC.
- No secret-shaped content: a scan of all **3369** added lines for
  key/secret/password/bearer/PEM/`sk-`/`AKIA` shapes exits **1**, zero
  hits. The single added `Command::new` is
  `std::process::Command::new(fake_agent_bin())` in
  `app/src-tauri/tests/agent_runner.rs` — the repo's own test double, not
  a new process surface. The new fixture adds no input path; it is a
  second stream shape through the same bounded, control-stripped parse.

**TWO CENSUS TRAPS WERE HIT AND CAUGHT HERE, AND BOTH ARE THE SAME
SHAPE.** (1) The IPC count reads **14** if you count the literal without
anchoring — the fourteenth is a doc comment at `agent/mod.rs:24`.
(2) `#[ignore]` counted as a literal with the closing bracket reads
**8, and every one of those eight is prose**, because all three real
attributes carry a reason string (`#[ignore = "…"]`) and the bracket is
not adjacent. That second one is the more dangerous direction: the naive
count is not merely inflated, it is **disjoint from the truth** — 8 hits,
0 of them attributes, 3 attributes missed. Anchor on the line's SHAPE
(`^[[:space:]]*#\[ignore`), not on the literal.

## What ACTUALLY reached the human's running app — AND THE APP RESTARTED

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else, before and after.** No bind, no connect, no signal, on any
interface. The holder is `node` pid **82549**, one socket,
`TCP [::1]:1420 (LISTEN)`, identical at both ends.

1. **THEIR APP PROCESS WAS REPLACED DURING THIS INTEGRATION, BY THEIR OWN
   `tauri dev`, AND THE BRIEF'S "REPORT BOTH UNCHANGED" COULD NOT BE
   SATISFIED.** At session start the app was `target/debug/nputer` pid
   **97844** (started Aug 19 21:53:30). It is now pid **85379**, ppid
   82364, **started 2026-08-20 00:20:43** — which is *before* the merge
   COMMIT at 00:21:06 and *after* `git merge --no-commit` wrote the
   branch's four `.rs` files into the working tree. **The merge itself is
   what restarted it**: `tauri dev` watches `app/src-tauri/**`, saw the
   Rust change, rebuilt (`target/debug/nputer` sha `038d0db6…`, mtime
   00:20) and relaunched. This is structural, not a rule breach —
   integrating any `app/src-tauri/**` card into a checkout with a live
   `tauri dev` restarts the human's window, and no previous checkpoint
   records it because the last three merges to touch that tree predate
   the current dev session. **Whoever integrates the next app-agent or
   app-shell card should expect this and say so up front.**
2. **The supervisor chain is the original and is unchanged**: `npm run
   tauri dev` **82342** → `tauri` **82364**, and `npm run dev` **82504**
   → `vite` **82549**, all four up since Aug 18 03:45:46, identical
   before and after. The new app process hangs off the same 82364.
3. **The window they are looking at is running T-081's merged code**, and
   that is the good direction: pid 85379 was built from the merged tree.
   `app/src` moved, so the webview took a hot update at the same moment.
4. **`app/src-tauri/target/debug/nputer` was relinked TWICE more after
   that** — by `cargo test` and by the boot check, both of which build
   into the SAME target directory. It is sha `ec9c580e…` at mtime 00:24
   now, against `038d0db6…` at 00:20 when pid 85379 was loaded. **A file
   on disk cannot reach a loaded process**, so their running window is
   unaffected by the later relinks; the next `tauri dev` rebuild
   overwrites it anyway. This is `T-083`'s correction to `cb3aa31`
   holding a third time: *a shared target directory is written by any
   cargo invocation.*
5. **The map pane sees a NEW graph.** `docs/architecture/graph.json`
   moved with this checkpoint — 118 files still, **996** symbols, **1520**
   edges. Their map's index hint reads 118 files, correctly and
   unchanged; the two new edges are intra-file and draw nothing new.
6. **Docs-watcher snapshots.** T-081 now shows `done`, **ten** new
   `T-081-s*` cards appeared, and ARCHITECTURE.md and STATE.md moved with
   this checkpoint. Their suggestion column goes from forty-eight to
   **fifty-eight**.
7. **`app/dist` was rewritten** by the pre-suite build at 00:23. The dev
   server does not serve `dist` and no module in its graph imports it.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,command` at the end: zero `vitest`, zero `playwright` or
`chromium`, zero `cargo` or `rustc`, no stray `tauri dev` beyond the
human's own 82342/82364, no orphaned shell. The boot check stopped its
own process tree (SIGTERM, `exit=null signal=SIGTERM`) and left nothing.
Scratch ports **19841** and **19843** were bind-probed free on all four
stacks before use and both were chosen away from the lane's 14520
default. **No `pkill` was used at any point.** The T-081 worktree and the
detached drill worktree are both removed. The two `nputer-T-060`
`fake_agent` orphans (`52504`/`52505`, ppid 1, started Aug 18 16:21:18)
are unchanged before and after and deliberately left alone — `T-043-s1`.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, EIGHTH OBSERVATION.** The
session-keyed scratch directory holds 1800+ entries from prior sessions.
Every file this session wrote there was prefixed `T081-integ-`, and the
drill worktree was `T081-integ-drill`. Prefix or lose it.

## Findings and corrections from this integration

- **`T-081-s9`'s first candidate close is DEFERRED to `T-084`, and the
  file now says so.** The verifier ruled the boundary at the second
  verdict and the integrator applied it: s9's item 1 (a frontmatter
  vocabulary gate beside the token lint) is substantially T-084's
  territory — T-084 landed on main at `073f136`, is scoped exactly to
  *"`docs/` is a code input and neither standing gate knows it"*, carries
  `touches: [docs/CONVENTIONS.md, tools/e2e]`, and already cites this
  incident as its second instance and `T-081-s9` by id. Carrying one
  remedy in two places is this card's own decision ONE — T-057's *"a rule
  with two implementations is two chances to disagree"*. **What stays in
  s9 is the ROLE clause**, which no gate can supply: a verifier who
  COMMITS to the branch re-runs whatever gate its own commits could move,
  and the same clause covers the stale printed CONTROL figure, which is
  not a pin and which nothing mechanical will ever catch. The
  cross-reference is bidirectional. `s9` keeps `status: suggested` —
  disposition belongs to triage, not to this role.
- **No `status: closed` survives anywhere.** `git grep "^status: closed"
  -- .` exits **1** over the whole tree — the anchored form, which is the
  only one that can name a frontmatter field. The **twelve** remaining
  occurrences of the unanchored string are all prose: five in T-081's
  card, two in `s7`, two in `s9`, two in T-084 — every one discussing the
  incident — **and the twelfth is this checkpoint's own sentence above**,
  which is `T-081-s8`'s lesson arriving one file later: a finding that
  quotes the string it forbids puts that string in the tree, and only the
  anchored grep still answers. `T-081-s7` reads
  `status: suggested`. Distinct `status:` values in frontmatter position
  across `docs/` and `method/` are the eight the parser accepts plus
  rooms' own `auto`/`open`/`resolved` vocabularies, which are different
  fields in different files.
- **`T-081-s8`'s self-defeating rule is fixed and the fix is in the merge.**
  The recommendation now reads `git grep -- '*.rs'`; the unrestricted
  `-- .` form exits 0 precisely because writing the finding put the
  phantom string into `docs/`. Confirmed at the merge: `git grep "fn
  an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail"
  -- '*.rs'` finds nothing.
- **`T-081-s10` is filed and NOT fixed here**, deliberately. Reverting
  the ring-note narrowing survives at 352/0/3 with zero bodies red; it is
  unreachable across the current fixture set because the tail only
  surfaces on `ExitNonZero` while every fixture with an in-band line
  exits 0. Non-blocking, and closing it is triage's call.
- **A COUNT WITH NO REF GOES STALE FROM THE RIGHT-HAND SIDE TOO.** Every
  published pre-merge figure on this lane (20 paths, 31/32 forbidden,
  CONTROL 557) was measured against `5b14603` and every one of them moves
  at the APPROVED tip `7c83e79`. T-083's table demonstrated left-hand
  drift with the branch tip held fixed; this lane is the other half, and
  the rule that covers both is simply **name the pair**.
- **The `#[ignore]` literal count is disjoint from the truth**, not
  merely inflated — see the security sweep. That is a new shape for the
  pathspec/anchor family `T-082-s2` opened, and it is worth an ordinal
  the next time somebody renumbers that list.

## ROADMAP not ticked; ARCHITECTURE moved

**ROADMAP was NOT ticked.** The discriminator is: does it change what a
USER can do or see? T-081 answers **no, not yet** — the denial reaches
the STORE, and the notice a human would see lives in C-13's chat, outside
this card's fence (`T-081-s1` names it). `grep` for `T-081` in
`docs/ROADMAP.md` returns one line, in the milestone-4 stale-ids note,
and this merge makes no sentence there true or false. The precedent class
is T-076 (*"NONE OF IT IS LIVE ON THIS TREE … it earns no ROADMAP
narrative"*). **One observation, left rather than edited:** that note
says T-081/T-082/T-083 were claimed on 2026-08-19; T-084 was claimed the
same night and is not listed. It landed on main before this merge, so it
is not this merge's to fix, and *"Re-derive the maximum id before
writing"* on the next line already protects the reader.

**ARCHITECTURE WAS TOUCHED, and this is the first app-agent merge in a
while where it had to be.** T-069's entry ends *"No IPC, grant, event or
dependency moved"*; T-081 moves the EVENT set and nothing else in that
list. The new paragraph records what is architectural rather than what is
new: `Denied` is **the first C-14 event that says something happened
without saying how the turn ends** — every prior refusal signal arrived
as part of the turn's OUTCOME (`ToolDenied`, or T-069's ring note riding
`stderr_tail` on `ExitNonZero`), both terminal by construction, so a
denial the planner RECOVERED from reached nobody even after T-069. It
also records the join living in Rust and nowhere else (T-057), that no
IPC and no grant moved (THIRTEEN, `8d24cbad…`, 16 entries), and that the
GRAPH did move this time — the difference from T-069 — because
`agent-store.ts` is TS and therefore indexed. **`C-14-agent-runner.md`
was deliberately NOT edited**: its `status: auto` is derived, its prose
(*"reduces the one `genesis-turn` event channel"*) stays true, and
editing a component file is the one edit that can move the parser
fixture.

**No new ADR.** Nothing non-obvious was decided by this role; the two
judgement calls (s9's boundary, the ARCHITECTURE paragraph) are recorded
above.

## The board, derived from disk at both ends

Main-before (`073f136`): **151 flat task files, 59 done / 25 planned / 19
parked / 48 suggested**; 59 + 25 + 19 + 48 = 151. At this checkpoint:
**161 flat task files, 60 done / 24 planned / 19 parked / 58
suggested**; 60 + 24 + 19 + 58 = 161. The deltas are exactly T-081
planned → done (the branch's `verifying` never reached main) and the ten
new suggestion files. Ten files sit in `docs/tasks/rejected/` and are
counted separately, as always.

## Provenance

T-081 is **built by `claude-opus-5` (two executor passes, `@fresh` then
`@T-081-fix`) and verified by `claude-opus-5`**, `review: same-model` —
the same model on both sides, honestly stamped, and **the first verdict
was a REJECTION that the second overturned on evidence the second
executor produced against it**. The `built_by:` field now names both
passes; a card that was rejected and rebuilt by a different session is
not honestly stamped by the first builder alone.

**60 done cards — 48 read `same-model`, 6 `self-verified`, 5
`independent`, and T-056 is a done card whose `review:` is EMPTY**;
48 + 6 + 5 + 1 = 60, so every done card carries the field. T-081 moves
`same-model` from 47 to 48. Of the five `independent` stamps only three
have different models on the two sides (T-057, T-058, T-060). Unchanged
otherwise by this merge; no card's history was re-stamped.

**A TENTH DATA POINT ON WHO STAMPS `done`.** T-081's verifier left
`status: verifying` for the integrator, exactly as T-043's, T-076's,
T-073's, T-069's, T-078's, T-080's and T-083's did, and the integrator
stamped it at the checkpoint — **nine of the last ten**, with T-058's
executor the only outlier, across both size tiers. The question is closed
on the evidence; only the writing-down into `method/` is left, and
`T-078-s3` records why a docs-fenced card cannot do it.

## Health of the tree

At this checkpoint main contains T-081's merge `55257a6` plus this
checkpoint. Parser, app, Rust, E2E, token lint, the token lint's own
selftest, `cargo audit` and the graph-currentness gate are all green;
both merge-time gates fired, both were RUN, and both derivations were
computed and recorded. Nothing is broken.

## In progress / broken right now

**ONE SIBLING LANE IS LIVE.**

- **T-084 — `../nputer-T-084`, `task/T-084-docs-gate`, at `6a84bd8`,
  REJECTED and being fixed.** Fence `[docs/CONVENTIONS.md, tools/e2e]`.
  Its worktree carries `node_modules` cloned from the main checkout and
  a built `lib/parser/dist`, both gitignored, left in place.

  **The rejection's first finding is the fix reproducing the original
  defect.** The gate defines a reader as a body with a `docs`-first
  literal in its OWN file, but `lib/parser/test/smoke.test.ts` calls
  `parseProject(repoRoot)` and `project.ts` resolves `docs/tasks`,
  `docs/ROADMAP.md` and `docs/architecture/components` off it. Measured
  twice: a one-line edit to `docs/ROADMAP.md` makes the gate owe only
  the e2e lane, that lane goes 114/114 green, and the parser goes
  **262/263 red**. An integrator who obeys the gate merges a red tree.

  Two more: **M6's tripwire fix is real for its shape and blind one
  step out** — the site arm resolves bases through imports while the
  anchor arm reads local bindings only, and that import idiom is how
  three of the nine derived readers get their root. And CONVENTIONS now
  says **twelve** root-anchored readers where the tree says **eleven**,
  with nothing pinning the number — a wrong figure that had propagated
  through three documents by the time the verifier caught it, inside
  the card written to stop exactly that.

**THE THREE-FIXTURE RULE FIRED AT T-077's CHECKPOINT AND THE LEDGER'S
OWN WARNING CAME TRUE ON THE INTEGRATOR.** T-077 ADDS an indexed file,
so the regen moved **four** assertions across **three** bodies:
`fileComponent.size` 118→119 and its test name, C-05's per-component
tally 55→56 in that same body, C-05→C-10's observedCount 33→34 in
another, and map-dogfood's index hint. **vitest surfaces them one at a
time**, so each green run after a fix proved nothing about the rest.
`architecture-dogfood.test.ts`'s ledger warns of this in as many words
and names T-048, T-049 and T-053 as having each learned it once; this
integrator makes four. The ledgers in both files gained an entry rather
than being rewritten.

**And the regen ran TWICE, which is why the merge/checkpoint split is
load-bearing.** The first regen made the graph current for the merge;
reconciling the fixtures then moved two files' `loc` and staled it
again. A graph regenerated into the merge is stale by the time the
checkpoint lands.

## Next up

1. **`T-084` is the sharpest card on the board and it is now `planned`
   with a second confirmed instance behind it.** `docs/` is an input to
   the app suite and neither standing gate knows it; T-081's own `s9` is
   the incident report and has just DEFERRED its mechanical remedy here,
   so T-084 owns it outright with nothing competing.
2. **`T-083-s2` is the other sharp one**, sized S–M with a working
   ninety-line prototype already written: the range rule is the
   most-consulted paragraph in CONVENTIONS and the least defended, and it
   carries eight items. **This checkpoint's `#[ignore]`-literal finding
   is a ninth candidate for its fixture set** — a census whose naive form
   is disjoint from the truth, not merely wide.
3. **Triage the FIFTY-EIGHT undispositioned suggestions** — six
   `T-043-s*`, five `T-076-s*`, five `T-073-s*`, three `T-069-s*`, twelve
   `T-078-s*`, eight `T-080-s*`, four `T-082-s*`, four `T-083-s*`, ten
   `T-081-s*` and `T-046-s4`. The backlog has grown by 10 since the last
   checkpoint and by 19 since the one before; **the fifth triage is now
   badly overdue and is the single largest thing on this board.** Treat
   `T-076-s4`, `T-069-s3` and `T-073-s4`/`s5` as ONE item, unchanged;
   `T-080-s7` and `T-080-s8` are one item too; **`T-081-s1` (the
   rendering C-13 owes a denial) is the one T-081 finding that is user-
   visible work rather than hygiene**, and it is what makes this card's
   own @human question answerable.
4. **The poison taxonomy renumbering pass is overdue by THREE ordinals
   and this checkpoint adds evidence rather than an ordinal.** T-078
   shipped FIVE and SIX; `T-078-s13` proposes EIGHT, `T-080-s7` proposes
   NINE, `T-083-s3` proposes another, and SEVEN — the mutant no body
   kills — still has four independent sightings and no owner. T-081's
   `s10` is a fifth sighting of exactly that shape.
5. **`T-069-s2` remains the cheapest real improvement on the board**:
   one arm, one fixture, one body. **`T-069-s1` is one line** and
   improves five bodies at once.
6. **T-070** is dispatchable on the fence T-043 released (`app-agent`,
   `blocked_by: []`), and **`app-agent` is free again as of this
   merge**. **T-065** (`blocked_by: [T-057, T-058]`) remains unblocked
   and undispatched; **T-067** and **T-068** still wait behind it.
