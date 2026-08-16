---
id: T-014
title: nputer-index binary — watch + check modes
feature: F-06
milestone: 4
priority: 7
size: M
status: building
blocked_by: [T-009]
touches: [crate-index]
builder: claude-opus-5
verifier:
built_by: "claude-opus-5 @fresh"
verified_by:
review:
---

Absorbs: T-009-s1 (ratified as the interim integrator rule in
docs/CONVENTIONS.md at the 2026-08-16 triage; when --check lands and
T-020's CI lane adopts it as a step, REMOVE that CONVENTIONS line in
this task's docs sweep — the check replaces the ritual).

## Acceptance criteria
- THE crate SHALL ship a small `nputer-index` binary (the future Node
  CLI shells out to it — ADR-015/ADR-003; this task builds no Node
  code) with: `index [--root .]` (write graph.json), `--check` (exit
  non-zero when the committed graph differs from a fresh index, with
  a plain-text diff summary), `--watch` (keep graph.json current
  headless, debounced, same containment rules as the app watcher).
- THE binary SHALL print component/drift summaries (`arch`,
  `arch drift [--fail-on undeclared|unmapped|any]`) as plain, stable,
  greppable text with documented exit codes.
- IF graph.json is stale THEN `--check` SHALL exit non-zero; IF drift
  findings meet the --fail-on severity THEN `arch drift` SHALL exit
  non-zero — both verified in a fixture repo.
- WHEN `--watch` runs with the app closed THEN a source change SHALL
  update graph.json within the debounce window; two concurrent
  writers (app + --watch) SHALL converge (byte-identical output makes
  last-write safe — asserted, not assumed).

## Implementation notes

Executor claude-opus-5 @fresh, 2026-08-17, branch `t014-index-binary`
(worktree /Users/ujju/Projects/nputer-t014, branched from `main` =
`5927adc`, T-050's merge). Machine for every number below: macOS 26.6
(Darwin 25.6.0), rustc/cargo 1.95.0, node 22.22.0, npm 11.12.1.
Headless throughout. No model call anywhere. Port 1420 never bound,
contacted or signalled.

### THE HEADLINE, and it is not a build result — with its correction

`--check`'s first run against this repo was RED, and chasing that red is
the most useful thing in this task. **The first conclusion drawn from it
was wrong and is recorded as wrong**, because the corrected version is
narrower and more interesting.

**Wrong first reading**: "the interim ritual was skipped at the T-050
merge." **What is actually true**: the ritual ran — one commit later
than the rule's own wording, in the checkpoint.

| commit | what it is | `index --check` | `self_graph_is_current` |
|---|---|---|---|
| `5927adc` — **this branch's point** | Merge T-050 | **1 STALE** | **101 FAILED** |
| `db8da6c` | Checkpoint: T-050 done | **0 CURRENT** | ok |

At `5927adc` the committed graph is sha256 `815412de…` / 385,451 bytes,
byte-identical to what STATE records the **T-049** integrator writing;
at `db8da6c` it is `a6ede920…` / 396,620 bytes and matches its tree.
Both instruments agree at both commits. The correction was found by
checking the graph's own commit history rather than trusting the first
inference, and the measurement was redone by extracting `db8da6c` with
`git archive` and running the gate against it.

**The finding that survives**, and it is real: CONVENTIONS says "commit
`docs/architecture/graph.json` **with the merge**", the house shape is
merge → checkpoint, and the regen necessarily lands in the second commit
because the checkpoint also edits INDEXED files (T-050's touches
`architecture-dogfood.test.ts` and `map-dogfood-render.test.tsx`, so the
ceaa949 ordering rule forces the regen after them). So `main` points at
a stale graph for the length of that window, and anything branching or
measuring inside it inherits one. **This task is the worked example**:
the dispatch said "branch from main" and predicted `--check` green; the
branch was cut at the merge commit and inherited the red. Four siblings
were dispatched the same night. Filed as **T-014-s3** with three
candidate resolutions — and it directly shapes the GRAPH GATE wording
drafted below, which names the checkpoint rather than the merge.

Consequence for this branch, stated plainly so nobody re-derives it as a
defect: `cargo test -p nputer-index --test self_graph -- --ignored` is
RED here exactly as it is on `5927adc`, and this branch deliberately did
not regenerate — the integrator owns regen and `docs/architecture/graph.json`
is outside the fence.

### What was built (26 files under app/src-tauri/crates/nputer-index/)

    src/bin/nputer-index.rs   19-line shim; all logic is in the lib, so the
                              same path is driven in-process, as a spawned
                              process, and (later) by the Node CLI
    src/cli.rs                argv -> command -> exit code; HELP carries the
                              exit-code contract
    src/check.rs              the staleness gate + its failure tail
    src/diff.rs               GraphDiff — closes T-009 plan §5.5's one
                              deferral ("diff() deferred to T-014, its only
                              consumer")
    src/watch.rs              the debounced headless watcher
    src/arch/{mod,glob,registry}.rs   the reality-side join
    tests/{cli,watch,arch}.rs + tests/fixtures/{gate-repo,clean-repo}

Zero Node code (ADR-015/ADR-003). Zero tauri anywhere in the crate.

### Criteria -> evidence

**C1 — a small binary with `index [--root .]`, `--check`, `--watch`.**
`[[bin]] nputer-index`. `index` writes `docs/architecture/graph.json`
and reports wrote/unchanged with counts; `index --check` byte-compares
and prints a delta; `index --watch` keeps it current. `--check` and
`--watch` are ALSO accepted at the top level as shorthand (the
criterion lists them as three siblings of `index`; both readings now
work and `top_level_check_is_the_same_gate_as_index_check` pins that the
two spellings produce identical bytes and identical codes). Driven as a
real process in `tests/cli.rs` (13 tests) and in-process in `src/cli.rs`
(15). This crate builds no Node code: `git diff --stat main...HEAD`
touches no `.ts`, `.js`, `package.json` or lockfile outside the two
fixture repos, which are indexer INPUT.

**C2 — `arch` / `arch drift [--fail-on …]`, plain, stable, greppable,
documented exit codes.** One record per line, leading keyword, fixed
field order, no blank lines, no indentation except for evidence
sub-records (`  file-edge`, `  file`, `  claim`). `grep '^component'`,
`grep '^edge'`, `grep '^finding'`, `grep '^summary'`, `grep '^verdict'`
each yield a clean table. The exit codes are documented in three places
a reader actually hits: `--help` (legended), the module doc on
`src/cli.rs`, and the drafted CONVENTIONS block below. Output stability
is pinned as an exact golden string over the whole fixture report
(`arch_prints_the_whole_fixture_registry_as_stable_records`,
`arch_drift_prints_one_of_each_rule_with_the_evidence_behind_it`).

**C3 — stale ⇒ `--check` non-zero; severity met ⇒ `arch drift`
non-zero, both in a fixture repo.** `tests/fixtures/gate-repo` carries
one of each finding (D1 side→core undeclared, D2 stray/loose.ts
unclaimed, D3 C-03 owns nothing, D5 C-03 → C-99);
`tests/fixtures/clean-repo` carries none. Every exit code below was read
from `$?` on an unpiped process (`Output::status.code()` in the suite,
`; echo $?` at the shell):

| repo | command | exit |
|---|---|---|
| clean-repo, graph absent | `index --check` | **1** (MISSING) |
| clean-repo, freshly indexed | `index --check` | **0** (CURRENT) |
| clean-repo + a planted `app/late.ts` | `index --check` | **1**, tail names the file AND the new edge |
| clean-repo, re-indexed | `index --check` | **0** |
| gate-repo | `arch drift --fail-on undeclared` | **1** |
| gate-repo | `arch drift --fail-on unmapped` | **1** |
| gate-repo | `arch drift --fail-on any` | **1** |
| clean-repo | all three `--fail-on` levels | **0** |
| clean-repo + D1 only | undeclared **1** · unmapped **0** · any **1** |
| clean-repo + D2 only | undeclared **0** · unmapped **1** · any **1** |

The last two rows are the sharp ones: a fixture that has both findings
cannot show that a severity gates on its OWN rule and not merely on
"something is wrong". They are derived from clean-repo at runtime.

**C4 — `--watch` updates within the debounce window; two writers
converge, asserted not assumed.** See the two measurements below.

### The exit-code contract

    0  clean      graph current / no findings at the requested severity
    1  finding    the gate's own negative verdict: graph.json is STALE,
                  or `arch drift --fail-on <sev>` matched
    2  usage      called wrong (unknown flag/command, bad --fail-on
                  value, missing argument, --check with --watch)
    3  failed     the gate COULD NOT RUN: invalid root, no committed
                  graph, unreadable graph, a registry file it refuses to
                  guess at, IO refused

**Does `arch drift`'s severity flag compose with `--check`'s codes, or
occupy a separate range? They share one range, deliberately.** Three
reasons, in order of weight.

1. They are the same predicate shape — "is the repo still honest?" — and
   the intended caller chains them: `nputer-index index --check &&
   nputer-index arch drift --fail-on any`. A separate range would force
   that caller to remember which command produced the number before it
   could read it. One `case $?` reads both. "Plain and stable; sessions
   will grep it" (plan §7) applies to the exit status too.
2. At the shell the separation would buy nothing anyway: `&&`, `set -e`
   and CI step failure all collapse every non-zero code into "failed".
   A range split costs a rule to remember and pays nothing where the
   codes are actually consumed.
3. What genuinely needs separating is **1 from 2 and 3**, and that is
   why there are four codes rather than two. "The gate says stale" and
   "the gate could not tell you" are different news — T-046's lesson,
   *a skipped gate is news, never silence*. A tool that returned 1 for
   "no registry" would let a repo with a deleted `components/` directory
   read as ordinary drift, and a tool that returned 0 would let it read
   as CLEAN; it returns 3 and says `no component registry`, pinned by
   `a_gate_that_cannot_run_is_exit_three_never_exit_one`.

And the range is not invented: it MIRRORS the one this repo already
uses. `npm run boot:check` is 0 booted · 1 the boot failed · 2 the port
is busy · 3 the override was refused — 0 clean, 1 the gate's verdict,
2/3 could-not-run, the same three positions. Two CONVENTIONS-level gates
with one numbering is one thing to learn.

Two smaller decisions inside the contract, recorded:
- **A red `--check` writes to stderr and says nothing on stdout**; a
  green one writes to stdout and says nothing on stderr. So
  `nputer-index index --check > /dev/null` is a silent gate and
  `2>/dev/null` is a silent success, without parsing.
- **`arch drift` with no `--fail-on` always exits 0** and prints
  `verdict  REPORT`. Reporting and gating are different jobs; a reporter
  that failed by default could not be used to look.

### `--check`'s failure tail, and why it looks like this

The standard to match was T-046's boot-gate tail — headline verdict,
then the child's own last words verbatim, `| `-prefixed — because "a
gate whose failure is not legible is half a gate". The same shape:

    [nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree
    [nputer-index]   committed:   385451 bytes · 92 files · 642 symbols · 1038 edges
    [nputer-index]   fresh index: 396620 bytes · 94 files · 667 symbols · 1063 edges
    [nputer-index]
    [nputer-index]   files  +2  -0  ~4
    [nputer-index]   | + app/test/startup-recovery.test.ts
    [nputer-index]   | ~ app/src/App.tsx  (content, loc 487 -> 623, symbols 6 -> 8)
    [nputer-index]
    [nputer-index]   edges  +30  -5
    [nputer-index]   | + f:app/test/startup-screen.test.tsx -> f:app/src/App.tsx (import) symbols=[default]
    [nputer-index]   | + ... and 10 more
    [nputer-index]
    [nputer-index]   regenerate: nputer-index index --root .

An integrator can act on that without re-running a regen to find out
what moved — which is exactly the T-014-s3 case: the delta above IS the
T-050 knock-on list, read straight off the gate.

Three deliberate details. **The verdict is byte identity, not the
structural diff** — that is ADR-014's contract, and the diff only
explains it. **A payload-identical but byte-different file is reported
as `NO structural difference … a hand edit, a reformat, or a serializer
change`**, because ADR-014 says graph.json is never hand-edited and an
empty delta under a STALE headline would read as a tool bug. **Lists cap
at 20 with `... and N more`** so a big regen cannot bury the headline.
`GraphDiff` renders WHOLE records, not identity keys, so an edge whose
`symbols` list moved appears as one `-` and one `+` rather than
vanishing.

### THE CONVERGENCE MEASUREMENT (criterion 4, measured not argued)

`tests/watch.rs::two_concurrent_writers_converge_byte_identically`.
Writer A is the app's own path — `index()` then `write_graph()`, the
exact calls `app/src-tauri/src/index_cmd.rs::run_index` makes. Writer B
is this binary's `index` command, a separate OS process. A third thread
reads graph.json continuously for the whole race.

    40 app-side writes + 40 binary runs, interleaved
    12,054 reads observed during the race
    0 mismatched   0 empty/torn
    graph 1,563 bytes; final file == the expected bytes
    exactly 1 of the 80 writes reported a byte change (the first);
    the other 79 wrote nothing at all
    0 temp files left in the directory

Before the race, the two producers are compared on identical trees:
byte-identical. That is what makes last-write safe, and it is now a
comparison rather than an inference. The `0 empty` result is the atomic
temp+rename being observed rather than trusted: a reader mid-rename sees
the complete old inode or the complete new one, never a partial file.

The criterion's exact pairing — the app writing while `--watch` is
armed — is a second test
(`the_watcher_and_the_app_writer_converge_while_both_are_live`): ten
app-side writes with a new source file appearing at write 5, each of
which is itself an event the watcher sees. **Converged 2 ms after the
last app write**, and the final bytes equal a fresh index of the final
tree.

### The watch measurements

`a_source_change_reaches_the_graph_within_the_debounce_window`, real
spawned binary, `--debounce-ms 100`:

    startup index (watcher arms + indexes once)   474 ms
    source change -> new symbol in graph.json     112 ms
    ceiling asserted                            10,000 ms

The 112 ms is the debounce window (100) plus notify's delivery plus a
~3 ms index. The assertion uses the generous ceiling in the T-009
perf-harness spirit — the criterion number is demonstrated and recorded,
the assertion never flakes.

`an_unindexable_change_leaves_the_graph_completely_alone`: a README, a
file inside `node_modules/`, and a re-write of a source file with
identical content, over twelve debounce windows — graph.json's bytes AND
its mtime are unchanged. Not "equal bytes": **no write happened**.

**Containment, stated precisely so it can be attacked.** The event
filter is TRIAGE, not the boundary. Containment is enforced where T-003
put it and T-009 inherited it: the walk (symlinks skipped file and dir,
every accepted file canonicalized and prefix-checked against the
canonical root) and `write_graph`'s atomic temp+rename, which REPLACES a
symlinked target instead of writing through it. The checkable
consequence: a filter mistake can only cost an extra, byte-identical,
no-op re-index — it can never widen what the watcher reads or writes.
The triage's own rules are unit-pinned
(`triage_accepts_source_and_config_and_rejects_the_hard_skipped_trees`,
11 accepts / 8 rejects).

**Loop termination**, three brakes, the same three T-012 proved for the
in-app path: byte-determinism; `write_graph`'s read-compare-skip (no
write ⇒ no event); and the triage, which does not even consider
`docs/architecture/graph.json` interesting — pinned directly by
`the_graph_the_watcher_writes_is_never_itself_a_trigger`.

**Debounce = 250 ms, the app watcher's own** (`docs_watch.rs:48`), via
the same `notify-debouncer-mini`, and
`the_debounce_window_matches_the_app_watchers` pins the equality so the
two cannot drift apart silently.

### `arch`: the design decisions worth arguing with

**It READS the committed graph; it never indexes and never writes.**
ADR-014 says "`nputer arch` greps it". Two consequences that decided it:
the report then describes the same bytes the app renders and the
TypeScript engine derives from, so the two views cannot silently
disagree about different trees; and staleness stays ONE gate
(`index --check`) instead of being half-answered in two places. A
missing or unreadable graph is exit 3 with `run nputer-index index …
first`, never a cheerful "no drift". `arch drift` prints a `note` line
saying which file it computed from and which command proves it current.
Measured cost: `arch` on this repo is **< 10 ms** (release), `index
--check` is **60 ms warm / 440 ms cold**, five trials.

**Scope, against ADR-015.** The crate computes the REALITY-SIDE join
only — mapping, observed edges (incl. the T-009 §6.6 package.path
seam), the three relations, D1–D5. It computes NO status rollup, NO
provenance rollup, NO task join, NO ADR-016 marks, NO inferred mode:
those need @nputer/parser's status-aware requiredness and stay
TypeScript's. `status=` in the report is the component file's own field,
copied verbatim. This is a genuine tension with ADR-015 and with C-07's
own text ("parsing and derivation live in TypeScript"), resolved the
narrowest way that leaves no criterion unbuilt, and **filed for the
architect as T-014-s1** with the three options laid out.

**The registry reader REFUSES rather than guesses**, which is the whole
safety argument for a second reader existing at all. It reads six
machine-shaped keys (`id`, `name`, `layer`, `status`, `paths`,
`depends_on`) between the first two `---` lines, strips ` #` comments,
and errors — naming the file, ending "(refusing to guess)" — on: no
frontmatter, an unclosed block, an indented mapping, a list item under
no key, a bad or missing id, a missing name or paths, a duplicate id.
Seven of those are unit-pinned. A second reader is dangerous when it can
quietly disagree; this one either reads the same facts or stops the
gate (exit 3).

**THE ANTI-FORK MEASUREMENT.** Against this repo's live registry and its
committed 92-file graph, `nputer-index arch` reproduces what
`app/test/architecture-dogfood.test.ts` pins for the TypeScript engine —
compared mechanically, not by eye:

    mapping counts        8/8 identical  (C-05 42, C-06 21, C-08 10,
                          C-09 3, C-10 2, C-12 11, C-13 2, C-14 1)
    relation table        28/28 rows identical, in order, including every
                          observedCount  (13 confirmed / 6 undeclared /
                          9 planned)
    finding ids           9/9 identical, in order (6 D1 + 3 D3)
    D1 file edges         22/22 identical, in order, incl. every
                          p:@nputer/parser package annotation
    unmapped              [] on both sides
    drift components      6 on both sides

Reproduce it with the script recorded in this branch's transcript, or by
hand: `nputer-index arch --root .` and diff the `edge` lines against the
`derived.edges` array the dogfood test asserts. That agreement is NOT
pinned as a fourth live-registry fixture — CONVENTIONS already warns
that declaring a component moves three of them, and a fourth in a second
language is a standing merge cost for a property the TS fixture already
guards. `tests/arch.rs` pins what cannot go stale instead (totality,
determinism, order-independence, the package.path seam). Where a
permanent cross-engine pin belongs is **T-014-s2**.

### The one new dependency, and the lock

`notify-debouncer-mini = "=0.7.0"`. **Zero new packages in
Cargo.lock** — the app crate already depends on it at exactly this
version, so `git diff app/src-tauri/Cargo.lock` is literally **one
line**: `+ "notify-debouncer-mini",` inside `nputer-index`'s dependency
list. Exact-pinned per this crate's discipline. Chosen over a poll loop
because the criterion asks for the app watcher's debounce semantics and
the app watcher IS this debouncer — sharing the library is how the two
stay one behaviour instead of two.

### The T-040 hazard this task walked into, and how it was cleared

Adding a `[[bin]]` to a `default-members` workspace member means bare
`cargo run` from `app/src-tauri/` — exactly what `tauri dev` shells out
to — now chooses among **three** binaries in **two** packages:
`nputer`, `fake_agent`, `nputer-index`. That is the T-040 regression
class. It was probed, not assumed, three ways:

1. **Scratch workspace of exactly this shape** (root package with two
   bins + `default-run`, default-member child with a third bin): bare
   `cargo run` runs the root binary. With the `default-run` line
   deleted: `error: cargo run could not determine which binary to run`,
   listing all three — T-040's exact failure text.
2. **The real workspace**, without launching anything:
   `cargo run --bin __no_such_bin__` reports "no bin target named … in
   default-run packages" and lists `fake_agent`, `nputer`,
   `nputer-index`.
3. **The boot gate**, below.

So T-040's one-line fix now carries a three-binary, two-package load.
Nothing in `cargo test` notices if it goes; only the boot gate does.
Filed as **T-014-s4**.

### BOOT GATE — RUN, and it is the fourth trigger limb

The diff touches `app/src-tauri/**`, so the gate fires. Scratch port
**14522**, never 1420. Exit code captured from `$?` on an UNPIPED
command redirecting to a file (the standing zsh `$PIPESTATUS` trap
avoided):

    [boot-check] port 14522 free — spawning `npm run tauri dev -- --config {…}` in /Users/ujju/Projects/nputer-t014/app
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-t014
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

Exit 0, both `[nputer]` lines, one run. After: `lsof -nP -iTCP:14522`
empty, `pgrep -fl tauri-boot-check` empty, `pgrep -fl nputer-t014`
empty. **1420 untouched**: the human's vite holds `[::1]:1420` on the
same pid 64249, the same fd 18u and the same device
`0x8ae7d2d984f8d016` before and after. This is the FIRST exercise of the
gate on a branch whose risk is precisely the one it was built for, and
the executor ran it per T-046 criterion 6.

### The seven proof obligations

**1. Every mode driven in a fixture repo, exit codes from `$?`.** Table
under C3 above; 13 process-level tests in `tests/cli.rs` plus the shell
runs recorded there. `index`, `--check` green and red, `--watch`,
`arch`, `arch drift` at all three levels and with none.

**2. The convergence claim, measured.** 40 + 40 interleaved writes,
12,054 reads, 0 mismatched, 0 empty, 1 of 80 writes changed a byte, 0
temp files. Numbers above.

**3. `--check` against THIS repo's real committed graph, agreeing with
the golden test.** The dispatch predicted green; the branch point had a
stale graph (see the headline) and the honest answer is RED — **and the
two instruments agree in all FIVE states measured**, which is the
stronger claim:

| tree | `index --check` | `self_graph_is_current` (ignored) |
|---|---|---|
| this repo @ `5927adc` (the branch point) | **1** STALE | **101** FAILED |
| `git archive db8da6c` (the T-050 checkpoint) | **0** CURRENT | — |
| `git archive HEAD` copy, freshly indexed | **0** CURRENT | **ok** |
| that copy + one planted `.ts` | **1** STALE, names the file | **101** FAILED |
| that copy re-indexed | **0** CURRENT | **ok** |

The copies are full `git archive` extractions (465 tracked files for
HEAD) built and tested with their own `CARGO_TARGET_DIR`, so the golden
test resolved to the copy's root rather than this worktree's. Red on the
branch point, green one commit later, green after a regen, red on a
plant, green on recovery — the whole cycle, both instruments, agreeing
every time. Nothing in this repo's `docs/architecture/graph.json` was
written: `git status` clean throughout, and the committed file's sha256
is still `815412de…`.

**4. Determinism preserved.** The ignored `self_graph_is_current` still
passes in a current tree (rows 3 and 5 above). Repeated runs are byte-identical
on the copy: three consecutive `index` runs, sha256
`6fcfee9b4dcea54432c7c0ab8fc2792a54feb92c63a988a737c3dec6a4506434`
every time (396,620 bytes). The committed-but-stale graph is sha256
`815412dedcd3fe6ecebce793e76c5f8119aaa91d2274c9c9137e2407795c0e73`
(385,451 bytes) — the exact hash STATE records for T-049, which is how
the staleness was pinned to the T-050 merge rather than guessed at. The
crate's own determinism suite (7 golden + cold-vs-warm + relocation) is
untouched and green.

**5. Every new test executes.** All **79** new test bodies were poisoned
at once with `panic!("POISON T-014")` as their first statement, and the
suite was run with `--no-fail-fast` so every binary reported:
**79 failed, 80 passed** — the 79 poisoned bodies are exactly the
failures (verified by name, not by count: every poisoned name appears in
the failure list, and the 80 that passed are exactly the pre-existing
tests). Reverted with `git checkout`, and **byte-verified**: `shasum -a
256 -c` over all ten touched files, 10/10 OK, `git status` clean, full
suite re-run green.

**6. Suites.** Baselines derived first-hand on this branch point before
any edit, then re-measured after.

| suite | baseline (5927adc) | after | delta |
|---|---|---|---|
| `cargo test` from app/src-tauri | **217 passed + 3 ignored**, 0 failed, exit 0, **0 warnings**, 11 binaries | **296 passed + 3 ignored**, 0 failed, exit 0, **0 warnings**, 15 binaries | **+79**, all mine |
| `cargo build` (workspace) | clean | clean, **0 warnings** | — |
| lib/parser | 159/159 | **159/159** (10 files), tsc clean, build clean | 0 |
| app | 535/535 | **535/535** (32 files), tsc clean, `npm run build` exit 0 | 0 |
| tools/e2e | 40/40 | **40/40** in 9.5 s, 1 worker, `typecheck` clean, `lint:tokens` clean (38 files) | 0 |

All three npm suites were re-run **after** this file and the five
suggestion files landed (the ceaa949 ordering discipline: the parser
smoke test and the dogfood test parse the LIVE docs/ tree, so docs edits
must precede the final measurement). That re-run earned its place
immediately — the first draft of T-014-s5's title began with a backtick,
a reserved YAML character, and both live-tree suites went red naming the
file, the line and the column. Fixed; 159/159 and 535/535 again, and
tools/e2e 40/40.

The three npm baselines are the SAME measurement as the after-value and
that is the point: this branch changes zero files in `lib/parser/`,
`app/src/`, `app/test/` and `tools/e2e/`, so any movement would have
been news. (The dispatch's stated app baseline was 507+; the branch
point is **535** — T-050's merge moved it. Stated, as asked.) Per-binary
cargo split after: 105 / 0 / 0 / 32+1 / **123** / 0 / 7 / **13** / 3 /
**7** / 0+1 / 2+1 / **4** / 0 / 0 — the bolded four are the new lib
tests (55 of the 123) and the three new integration binaries. Not piped
through `tail` (the standing trap).

**7. Fence proof.** `git diff --stat main...HEAD`: **27 files, +4494,
−0**. Twenty-six of them are under
`app/src-tauri/crates/nputer-index/`; the twenty-seventh is
`app/src-tauri/Cargo.lock`, one added line, which the new dependency
requires and which T-009's own expected diff surface already named as
this crate's. Every fenced path is **0 files**: `app/src/`,
`app/src-tauri/src/`, `docs/architecture/graph.json`,
`docs/CONVENTIONS.md`, `lib/parser/`, `tools/e2e/`, `.github/`,
`docs/architecture/components/`. No sibling worktree was entered. The
npm installs left the lockfiles untouched (`git status` clean after all
three suites).

### DRAFTED FOR THE INTEGRATOR — the CONVENTIONS retirement

Not applied here: `docs/CONVENTIONS.md` is outside this task's fence,
and this is the T-020 precedent (executor drafts, integrator applies).

**(a) DELETE the interim rule entirely** — the bullet beginning
"INTERIM integrator rule (T-009-s1, ratified at the 2026-08-16
triage; retires when T-014's `nputer index --check` becomes the gate)",
lines 159–167 of CONVENTIONS today. Its own retirement condition is now
met on its first limb.

**(b) ADD, in its place, in the BOOT GATE bullet's shape** (trigger →
command → record → the IF-it-cannot-run clause → why it exists):

```markdown
- GRAPH GATE (T-014, replacing the T-009-s1 interim regen rule ratified
  at the 2026-08-16 triage): at any merge whose diff touches
  `*.ts/*.tsx/*.js/*.jsx` outside docs/, run the check —
  `nputer-index index --check` from the repo root, after
  `cargo build --release -p nputer-index` from app/src-tauri/ — and
  RECORD the result (exit code, and on a red the delta it prints) in the
  checkpoint. IF it is red THEN regenerate with `nputer-index index`
  and re-run the check to confirm 0. Commit the regenerated
  docs/architecture/graph.json in the merge's CHECKPOINT, after the
  fixture reconciliation and last — the dogfood fixtures are themselves
  indexed, so a graph committed before they are edited is stale again
  immediately (the ceaa949 ordering rule). The merge commit itself is
  therefore expected to carry a stale graph; a session branching from a
  merge commit inherits it, which is what T-014-s3 records. The four
  exit codes are
  legended in the app/src-tauri commands bullet under "Build & test"
  above: 0 current · 1 stale · 2 called wrong · 3 could not run.
  IF the check cannot run THEN say so LOUDLY in the checkpoint, naming
  the reason and the exit code — a skipped gate is news, never silence.
  It exists because the ritual it replaces was a `#[ignore]`d test that
  had to be REMEMBERED, and remembering left a window nobody could see:
  the graph is regenerated in the checkpoint (it must be — the
  checkpoint edits indexed fixtures), so `main` points at a stale graph
  between merge and checkpoint, and every branch cut there inherits one.
  T-014's own branch is the worked example (T-014-s3). `--check` reads
  the same bytes and makes the same comparison `self_graph_is_current`
  does — the two were run against each other in five tree states and
  agreed every time — but it prints WHAT moved, so a red is actionable
  without a second run.
```

**(c) ADD to the `app/src-tauri` commands bullet under "Build & test"**,
after the `cargo audit` sentence (this is where the tools/e2e bullet
legends the boot check's codes, so it is the parallel home):

```markdown
  The workspace also ships the `nputer-index` binary (T-014), which the
  future Node CLI shells out to (ADR-003/ADR-015): `nputer-index index
  [--root .]` (write graph.json) · `index --check` (the GRAPH GATE
  below; writes nothing) · `index --watch` (keep it current headless,
  debounced 250 ms) · `arch` and `arch drift [--fail-on
  undeclared|unmapped|any]` (read the COMMITTED graph and print
  components/drift as one record per line). Exit codes are shared by
  both gates: 0 clean · 1 the gate's verdict (stale, or drift at the
  requested severity) · 2 called wrong · 3 could not run — the same
  positions as `npm run boot:check`, so one `case $?` reads both.
```

**PRECISELY WHEN THE RULE DIES, and the half that is not mine.** T-014's
`Absorbs:` note names TWO limbs: "when --check lands **and** T-020's CI
lane adopts it as a step". Limb one lands with this merge. Limb two is
`.github/workflows/ci.yml`, which is **T-045's lane tonight** and
outside this fence — so the honest reading is:

- **At this merge**: the ritual limb dies. No integrator hand-runs
  `NPUTER_UPDATE_GOLDEN=1 cargo test … self_graph` as a matter of
  routine again; they run `--check` and regenerate only when it is red.
- **The CI step is still owed.** Until it exists, the gate is a
  discipline, not an enforcement — exactly what the boot gate is today,
  and the same bullet shape says so. Whoever owns `.github/` next should
  add `nputer-index index --check` to the ubuntu job after the cargo
  suite step (the cargo cache above it is already warm), and add the
  matching row to `EXPECTED_COMMANDS` in
  `tools/e2e/tests/workflow-parity.spec.ts` — that spec asserts every
  expected command is a verbatim step in order, and its list is
  hand-maintained, so a CONVENTIONS edit alone will NOT red it and will
  NOT be caught. Naming that here is the point: the parity spec cannot
  notice a command it was never told about.
- **`NPUTER_UPDATE_GOLDEN=1` does not retire.** It is still how goldens
  are rewritten, and `self_graph_is_current` is still the crate's own
  hermetic self-check. What retires is the RITUAL — the hand-run at
  every merge — not the mechanism.

### Silences and smaller decisions, recorded

1. **No cache by default.** `--cache-dir` is opt-in for every mode
   including `--watch`. A gate that consults a cache is a gate with
   hidden state, and T-009 measured this repo's cold index at 15–40 ms
   release — `--check` here is 60 ms warm end to end. The crate still
   never invents a location (T-009's rule); the binary just declines to
   pick one.
2. **`--debounce-ms`** exists so the watch tests can measure rather than
   wait, and so a slow filesystem can be tuned. Default 250, the app's.
3. **D3/D4/D5 are printed but only `any` gates on them.** The
   `--fail-on` vocabulary the criterion fixes is `undeclared|unmapped`,
   which is exactly D1 and D2; the other three cost nothing once the
   mapping exists and hiding them would be less honest than showing
   them. `--fail-on any` means any finding of any rule, stated in
   `--help` and pinned by `severity_gates_exactly_what_it_names`.
4. **`arch` prints the unmapped node as a component row** when
   unclaimed territory exists, so a `grep '^component'` table never
   silently omits files that belong to nobody.
5. **The glob matcher is a transcription, not an invention** —
   `app/src/lib/architecture/glob.ts` rule for rule, with one honest
   difference noted in the header: JS iterates UTF-16 code units and
   Rust iterates scalar values, so a `?` against an astral-plane
   character differs. No committed pattern or path contains one, and
   the difference cannot move a claim for any `*`-only pattern, which
   is the entire live registry.
6. **`join()` sorts its own input** by numeric id rather than trusting
   the caller, so first-match-wins can never depend on directory read
   order. Pinned over the live registry by
   `the_join_is_deterministic_and_independent_of_registry_order`.
7. **`diff()` shipped as the plan named it** (`pub fn diff(a, b) ->
   GraphDiff`, re-exported at the crate root), closing T-009 §5.5's
   deferral with its only consumer present, as that plan said it would.

### Flags for the verifier

- **The most likely place to push back is `src/arch/`** — a second
  reality-side join in a repo whose ADR-015 says derivation is
  TypeScript. The argument, the narrowing, the refuse-don't-guess rule
  and the cross-engine measurement are above; the open question is filed
  as T-014-s1 rather than decided here. If you read criterion 2 as
  satisfiable some other way, that is the place to say so.
- **The graph at this branch's point is stale and this branch did not
  fix it.** Deliberate (the integrator owns regen; the fence forbids it),
  so `cargo test -p nputer-index --test self_graph -- --ignored` is RED
  here exactly as it is at `5927adc`. Do not read it as a T-014
  regression — reproduce it at the branch point first, and note it is
  GREEN one commit later at `db8da6c`.
- **The headline carries a correction to the executor's own first
  reading.** It concluded "the ritual was skipped" before checking the
  graph's commit history; it had not been. Both readings and the
  measurement that settled it are in T-014-s3.
- **`tests/watch.rs` spawns processes and sleeps.** The three timing
  assertions all use a 10 s ceiling with the measured value printed;
  if you want the real numbers, run with `-- --nocapture`.
- **Nothing pins the two joins together.** T-014-s2. Today they agree;
  the agreement was measured, not enforced.

### Suggestions filed

- `T-014-s1-where-the-arch-join-belongs.md` — the ADR-015 tension, three
  options, architect's call.
- `T-014-s2-nothing-pins-the-two-joins-together.md` — the cross-engine
  pin and where it should live.
- `T-014-s3-the-interim-regen-ritual-was-missed-at-t-050.md` — the
  merge/checkpoint window: the rule says "with the merge", the ordering
  discipline forces the checkpoint, and every branch cut between them
  inherits a stale graph. Carries the executor's own wrong first reading
  and its correction. (The filename records the wrong version; the file
  corrects it in its first line.)
- `T-014-s4-nothing-in-cargo-test-pins-default-run.md` — three binaries,
  two packages, one unpinned manifest line.
- `T-014-s5-watch-triage-errs-toward-re-indexing.md` — the watcher spins
  during a cargo build; the cheap close.

## Verdicts
