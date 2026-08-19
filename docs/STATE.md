# State

Updated: 2026-08-19 by integrator (T-083 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-083 — the range rule names a pair of commits, not a notation.**
F-06, milestone 4, size M, `touches: [docs/CONVENTIONS.md]`. Built and
verified by `claude-opus-5`, `review: same-model`; **the first verdict
was a REJECTION and both verdicts are in the card**. Approved branch tip
**`72647a1`**; merge **`5c60e5a`**. The card was at `status: verifying`;
the integrator stamped **`done`** at this checkpoint, the eighth card
running (T-043, T-057, T-076, T-073, T-069, T-078, T-080, T-083).

**SIX PATHS, ALL UNDER `docs/`, AND FOUR OF THEM NEW.** `M`
docs/CONVENTIONS.md (+192/−21), `M` the card itself (+1025), and `A`
four findings `T-083-s1` … `s4`. Re-derived here, not inherited from the
verdict. Both gates are **0 and therefore not owed** — the first
docs-only merge since T-078's `fed70a2`.

**WHAT LANDED.** The single sentence the two gate bullets carried from
T-046 is promoted into its own bullet, THE RANGE RULE, and restated as a
question about WHICH TWO COMMITS you compare rather than about notation:
a two-row table addressed to the integrator (who has a merge commit) and
to the executor (who does not), with `git merge-tree --write-tree` named
as the executor's form and `git diff main..HEAD` and `main...HEAD` both
banned by name. The three-dot trap is stated in full — `A...B` IS
`$(git merge-base A B)..B`, so the spelling that looks like a refinement
of the prescribed range IS the forbidden one — and the scoreboard behind
the recommendation is published with **both of its metrics**, which is
what the rejection was about and what the re-verdict approved.

## The rule's first use is on the merge that lands it, and it worked

Every range below states its dot count, because that is now the rule.

    git diff --name-only 5656a10...72647a1   (THREE dots) -> 6
    git diff --name-only ddcc8bb..72647a1    (TWO dots)   -> 6   byte-identical to the line above under cmp
    git diff --name-only 5656a10..72647a1    (TWO dots)   -> 24  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 5656a10..5c60e5a    (TWO dots)   -> 6   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only 5656a10...5c60e5a   (THREE dots) -> 6   collapses onto the line above, cmp exit 0
    git diff --name-only ddcc8bb..5c60e5a    (TWO dots)   -> 24  the naive at-merge range

`A...B` IS DEFINITIONALLY `$(git merge-base A B)..B`, proven here by
`cmp` against the explicit merge-base spelling, exit 0. At the merge
`git merge-base --is-ancestor 5656a10 5c60e5a` exits **0**, so two dots
and three dots COLLAPSE and return the same six paths; before the merge
they differ by main's entire advance.

**THE CARD'S OWN SUBJECT DEMONSTRATED ITSELF ON THIS LANE, and the
sequence is worth keeping** because it is the drift a lane experiences
while it waits. Same left-hand ref moving forward, same right-hand
branch tip `72647a1` throughout:

| main tip used as the left ref | TWO dots | THREE dots |
|---|---|---|
| `ddcc8bb` (the branch point) | 6 | 6 |
| `a114f45` | 15 | 6 |
| `00b90f5` | 20 | 6 |
| `7a37b37` (T-082's merge) | 20 | 6 |
| `88c394f` (T-082's checkpoint) | 22 | 6 |
| `d61e986` | 23 | 6 |
| `373a06e` | 24 | 6 |
| `22e3786` | 24 | 6 |
| `5656a10` (main-before) | 24 | 6 |

**The two-dot answer moved six times without the branch committing
anything; the correct answer never moved.** A docs-only lane reads as
having rewritten a Rust crate and the app's genesis model — the exact
lie the rule exists to prevent, produced by the notation the rule used
to hand its second reader.

## Integration truth

T-083 and main share merge-base **`ddcc8bb`**, eight main commits back.
Main advanced **18** paths from that base; T-083 changed **6**. **Their
changed-file intersection is EMPTY**, `comm -12` over the two sorted
lists; 18 + 6 = 24, which is exactly the forbidden two-dot count, and
that arithmetic is the check that the two sets really are disjoint.
`docs/CONVENTIONS.md` is in T-083's 6 and in neither main's 18 nor the
intersection, which is why this merged clean.

**THE PRE-MERGE FORECAST WAS THE COMMAND THE NEW BULLET PRESCRIBES, AND
IT WAS EXACT UNDER BOTH METRICS.** `git merge-tree --write-tree 5656a10
72647a1` returned tree
**`38328a42b19e81c4aa7f52fa35539ceb10c9158d`** at **exit 0** — the exit
code read from `$?` and not swallowed by the command substitution, which
is `T-083-s3`'s own warning — and `git diff --name-only 5656a10 <TREE>`
gave the same six paths, `cmp` exit 0 against the merge's later diff.
The whole patch is byte-identical too, `cmp` exit 0. **The no-ff merge
`5c60e5a` produced that tree EXACTLY**, with parents `5656a10` and
`72647a1` and nothing else. So this merge is a thirty-second data point
for the scoreboard and it scores in `merge-tree`'s column under both
metrics. The staged set at `git merge --no-commit` was the six paths and
nothing more, read with `git diff --cached --stat` before the commit;
the approved worktree was clean at `72647a1`.

**NOTHING WAS WRITTEN INTO THE MERGE COMMIT**, which is `T-083-s4`'s
request of this role: the merge carries the branch and only the branch,
and every integrator edit is in this checkpoint. That is what the
predicted-tree comparison is able to detect, and it detects nothing only
because there is nothing.

## The two gates, BOTH derivations — and this merge is the THIRTEENTH falsification

| gate | prescribed `5656a10..5c60e5a` (TWO dots) | naive `ddcc8bb..5c60e5a` (TWO dots) |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — DOES NOT FIRE** | 4 — would fire |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **0 — DOES NOT FIRE** | 5 — would fire |

**NEITHER GATE IS OWED.** The merge's six paths are six `.md` files, all
under `docs/`; the suffix census is `6 md` and the non-`docs/` count is
zero. The naive range's four boot paths and five graph paths are main's
own history — T-082's `runner.rs`, `fake_agent.rs`, `interview-model.ts`
and `agent-store.ts`, plus two app tests and one e2e spec — every one of
them already gated at `7a37b37`, its own merge.

**SO THIS MERGE FLIPS BOTH GATES AT ONCE**, the second merge ever to do
so after T-078's `fed70a2`, and the thirteenth distinct merge to falsify
the sentence T-083 retired. **The census was re-derived, never quoted**,
exactly as the new bullet demands — for each first-parent merge M,
`git diff --name-only M^1..M` against
`git diff --name-only $(git merge-base M^1 M^2)..M`, each side matched
against the gate's own trigger:

- **At `ddcc8bb`, over 31 merges: BOOT not owed 10 / naive fires 8;
  GRAPH not owed 5 / naive fires 5. THIRTEEN FLIPS IN FIFTEEN CHANCES
  over TWELVE distinct merges.** Every figure and every hash in the
  merged bullet reproduces exactly, independently of it.
- **At `5c60e5a`, over 33 merges: BOOT not owed 11 / naive fires 9;
  GRAPH not owed 6 / naive fires 6. FIFTEEN FLIPS IN SEVENTEEN CHANCES
  over THIRTEEN distinct merges.** The two added chances are both this
  merge's, and both flipped.

**`T-083-s1` IS CONFIRMED A THIRD TIME, BY DERIVATION RATHER THAN BY
READING.** `79ae34a` (T-076's merge) appears in the BOOT list at 0
against 5 and **does not appear in the GRAPH list at all**. The
checkpoint `cb3aa31` records that flip under GRAPH REGEN. The pair of
numbers was carried faithfully and the gate's name was not.

**WHERE THE CORRECTION WENT, AND WHERE IT DELIBERATELY DID NOT.**
`cb3aa31` is NOT edited — a checkpoint is a statement about a moment,
and rewriting one destroys the only record of what was believed then.
The correction lives in two places instead: inside `docs/CONVENTIONS.md`,
which the merge itself delivered and which cites `T-083-s1` by id, and
in THIS checkpoint, which is what a reader of `cb3aa31` reaches next.
`s1` asked for exactly this — *"whoever writes the next checkpoint
should carry the correction forward rather than re-deriving the wrong
row from `cb3aa31`"* — so its substance is discharged. The FILE is left
in place at `status: suggested` for the triage that owns disposition;
discharging a finding is not the integrator's call to record as
promoted, parked or rejected.

**T-024's three-fixture rule does NOT fire**, verified rather than
assumed: `git diff 5656a10..5c60e5a -- docs/architecture/components/` is
a 0-file diff. The registry still stops at `C-14`.

## The sentence was never true, and that is an integrator correction to the merged text

**`docs/CONVENTIONS.md` IS IN THIS CHECKPOINT AS WELL AS IN THE MERGE,
AND THE EDIT IS ONE CLAIM.** The merged bullet said the falsified
sentence *"had been false for weeks"*. That is a duration with no ref,
in the bullet whose entire subject is figures that go stale without one,
and it does not survive contact with `git log`:

- The sentence was WRITTEN at **`98f931e`, 2026-08-17 05:50**.
- Its earliest counterexample, T-030's merge **`59558de`**, landed at
  **02:21 the same morning** — three and a half hours EARLIER.
- `git merge-base --is-ancestor 59558de 98f931e` exits **0**: the
  counterexample was already in the history of the commit that wrote the
  claim.

**So it was never true for a single commit**, and "weeks" was wrong in
the other direction as well, because the repository was two days old.
The bullet now says that, with the two refs and the ancestry check
printed, and draws the rule out of it: an unrefed DURATION goes stale
exactly the way an unrefed COUNT does. This is the integrator's edit,
not the card's, and it is recorded here rather than folded silently into
the branch's text.

**The eighth item was folded into `T-083-s2`**, which the re-verdict
recorded in the verdict body rather than in the finding that owns the
list: **N11, the corrupted re-derivation recipe** — the bullet prints
the commands a reader should run, and nothing checks that those commands
are the ones that produced the published columns, so a reader that
re-implements the derivation beside the doc stays green while the
instructions rot. `s2`'s item 6's "the sharpest of the seven" is now
"the sharpest of them", because a card about stale numerals should not
ship one.

## The poison drill — run at the MERGED commit, in a detached scratch worktree

**The correspondence was established by hash, not assumed.**
`docs/CONVENTIONS.md` is byte-identical at the approved tip `72647a1`,
at the merge `5c60e5a`, and in the drill worktree on disk — sha256
**`057889b70d84d90c0da48681cc1cede569ea3a0a7944e0d65cc180d67f623429`**,
which is the digest the re-verdict itself quotes for its own
restoration. The drill ran in a DETACHED worktree at `5c60e5a`, with
`node_modules` and `lib/parser/dist` symlinked read-only from the main
checkout — no `npm ci`, no `npm install`, anywhere — and the symlinks
were removed before the worktree was. Baseline in that worktree
reproduced main exactly: workflow-parity 14/14, lint clean at TOKEN 119
/ CONTROL 552, parser 263/263, all exit 0.

| # | mutation, read back with `git diff` before running | result |
|---|---|---|
| A | byte-for-byte column `**24**` → `**30**` — the exact defect that rejected this card | **GREEN EVERYWHERE**: workflow-parity 14/14 exit 0, lint exit 0, selftest exit 0 at 71 walk-policy checks, parser 263/263 exit 0, `## Build & test` digest unmoved at `0662c279…` |
| B | `npx tsc --noEmit` → `npx tsc --no-emit` inside `## Build & test` | **RED**, `workflow-parity` **exit 1**, 2 failed / 12 passed, naming the command in BOTH directions |
| C | T-076 moved from the BOOT list to the GRAPH list — `cb3aa31`'s shipped error, reintroduced verbatim | **GREEN EVERYWHERE**: workflow-parity 14/14 exit 0, lint exit 0, parser 263/263 exit 0 |

**A AND C ARE THE CONFIRMED PROPERTY, NOT A FAILED DRILL.** `T-083-s2`
says every measured figure in the bullet is poisonable to any value with
every reader still green, and A and C are two more instances: A puts
back the rejected metric label, C puts back the wrong gate name, and
nothing in this repository can tell. **B is why that is a finding rather
than an excuse** — the same file, the same worktree, the same three
commands, and a mutation eleven lines from the top of the file reds by
name in both directions ("the doc lists a command this spec has no entry
for", "this spec expects a command the doc no longer lists"). The drill
apparatus is demonstrably live; the RANGE RULE is simply outside every
reader in the tree, which is `s2`'s point and an artefact of the
`[docs/CONVENTIONS.md]` fence rather than of prose.

**THE READ-BACK CAUGHT ITS OWN MISTAKE, WHICH IS THE THIRD LIMB WORKING.**
Drill C's first `perl -0777` pass reported success and applied only ONE
of its two substitutions — the other pattern spanned a line wrap and did
not match — leaving a document that named T-076 under BOTH gates.
`git diff` showed it, the second half was applied with a wrap-tolerant
pattern, and only then was anything run. A substitution that "succeeded"
is not a mutation that landed. Restoration proved three for three:
`git checkout --`, an empty `git diff`, and sha256 back to `057889b7…`
each time.

## Suites, every number derived at this merge, exits read unpiped

Each command's own `$?` was echoed immediately and every count read from
the saved full output. **No exit code in this checkpoint was taken
through a pipe.**

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`;
  `npx tsc --noEmit` `PARSER_TSC_EXIT=0`. Unmoved — and it is the one
  suite whose corpus this merge actually enlarged, since four new flat
  `docs/tasks/T-*.md` entered its live tree and its smoke test requires
  zero issues over them.
- **app: 829/829 across 42 files**, `APP_TEST_EXIT=0`. `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, emitting
  `index-DIZb3mB8.js` **501.37 kB** and `index-CwYF5FQb.css`
  **43.95 kB**. **The 827 the last checkpoint recorded is T-080-era**:
  the +2 arrived with T-082 at `7a37b37`, and this merge's `app/**` diff
  is zero paths. The JS content hash moved for the same reason; the CSS
  hash did not.
- **bare Rust workspace, `cargo test` PLAIN: 343 passed / 0 failed / 3
  ignored**, `CARGO_TEST_EXIT=0`, summed programmatically from
  **fifteen** `test result:` lines. Not `--all-targets`, which skips
  doc-tests and would have reported 342 over 13 lines.
- **E2E: 91/91**, `E2E_EXIT=0`, one worker, zero retries, zero skips, on
  scratch port **19831**; `npm run typecheck` `E2E_TYPECHECK_EXIT=0`.
  Unmoved, as a 0-path `tools/e2e` diff requires.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 119 files under app/src, app/test,
  tools/e2e; CONTROL 552 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples, **71** walk-policy checks, 8 evidence-floor checks.
- **`cargo audit -n`** (no fetch) `CARGO_AUDIT_EXIT=0`: 472 locked
  crates, **0 vulnerabilities / 17 allowed warnings** — 16
  `unmaintained` + 1 `unsound`, counted by exact line match, the
  baseline unmoved, which a 0-file `Cargo.lock` diff requires.
- **`index --check`** `INDEX_CHECK_EXIT=0` from `app/src-tauri` with
  `--root ../..`: `graph.json is CURRENT … 575619 bytes, 118 files, 995
  symbols, 1518 edges`. Byte-for-byte the figure the last three
  checkpoints recorded. **GRAPH REGEN was not owed and was not run**;
  the gate was run by hand anyway, which is what the bullet asks of this
  role at every checkpoint.
- **CONVENTIONS' two live readers, both exercised over the FINAL text**
  — `workflow-parity.spec.ts` 14/14 exit 0 and
  `snapshot_version_matches_the_live_method_stamps` in
  `app/src-tauri/src/agent/kit.rs` ok inside the `cargo test` above.
  **The parser does NOT read this file**; it is seen by the CONTROL walk
  and by those two readers, and by nothing else.

**CONTROL CLOSES ARITHMETICALLY FROM TWO DIRECTIONS, AND EVERY NUMBER
CARRIES ITS REF.** At `5656a10` it is **548**, derived from the tree
rather than remembered: `git ls-tree -r` gives **566** tracked, minus
**0** under a `SKIP_DIRS` entry, minus **18** with a
`CONTROL_BINARY_EXTENSIONS` suffix — both sets read out of
`token-scan.mjs` at that ref. The merge adds four files and deletes
none, so 548 + 4 = **552**, and the lint prints 552 at the merge. TOKEN
is **119 and cannot move**: the merge adds no file under `app/src`,
`app/test` or `tools/e2e` and modifies none.

**THE `## Build & test` SECTION DIGEST REPRODUCES AT AN EIGHTH REF.**
The recipe printed in the card was RUN, not quoted, from the repo root:
`0662c279efb209f8341d39fa9df5f5ab0e0976157352718058e099a4d8feefb9`,
**12817 bytes**, node exit 0 — identical at `5656a10` and at `72647a1`,
`cmp` exit 0 between them, and unmoved by this checkpoint's own edit,
which lands under `## Gotchas`.

## The fixture forecast, and whether it was complete

**Forecast, written before any suite ran.** The merge's diff is six
`.md` under `docs/` — five under `docs/tasks/`, `.nputerignore`d and so
invisible to the graph, outside every TOKEN root, and inside the
PARSER's live tree; plus `docs/CONVENTIONS.md`, seen by CONTROL and by
its two named readers. So: **zero assertions move in the parser, app,
Rust and E2E suites; TOKEN holds at 119; CONTROL moves 548 → 552; the
graph cannot move; the `## Build & test` digest cannot move; and the
selftest's walk-policy count holds at 71, because the merge adds only
`.md` and that suffix class is already present.**

**THE FORECAST WAS CORRECT ON EVERY LINE, INCLUDING THE ONE THE LAST
CHECKPOINT MISSED.** T-080's forecast failed to predict its
walk-policy count moving 70 → 71, because rung A generates one row per
tracked suffix class PRESENT and main's side of that merge carried a
brand-new `.jsonl`. The lesson was recorded as *"a forecast derived from
the merge's own diff cannot see a fixture whose cardinality is a
function of the OTHER side's tree"*, and it was applied here: the
question was asked of BOTH trees, both answered `.md`, and 71 held. A
lesson that gets used one checkpoint later is worth the words it cost.

## Security sweep — zero movement, and a mis-citation corrected AGAIN

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no `.rs`**
— 0 paths matched any of them.

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff across the merge**,
  sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  with **92** grants counted FOUR independent ways over the
  symbol-anchored `EXPECTED_GRANTS` body: 92 quote-bearing lines, 92
  quoted strings in total, 92 UNIQUE quoted strings, and 92 lines
  matching the strict entry shape. No byte count is quoted for the grant
  set, deliberately, and `awk` was used throughout because BSD
  `grep -cE` returned exactly half on this body two checkpoints ago.
  **THE "CORRECTION" THE LAST CHECKPOINT MADE IS ITSELF WRONG, AND THIS
  IS THE THIRD TIME THIS ONE FIGURE HAS MOVED.** `cb3aa31` replaced "92
  lines of span" with *"the anchored span … is 128 lines (36 of them
  comment or blank; 36 + 92 = 128)"*. Measured at this tree: the
  declaration `const EXPECTED_GRANTS` is at line **54**, its closing
  `];` at line **147**, so the anchored span is **94** lines and the
  entries occupy 55–146. **Inside it there are ZERO comment or blank
  lines** — all 92 body lines are grants. The **128** came from
  anchoring on the first MENTION of the symbol, a `//!` doc comment at
  line 18, instead of on the declaration; the 36 "comment or blank"
  lines are the module's own header prose between line 18 and line 54,
  which is not the grant set at any reading. **The count of 92 has been
  right every time; every attempt to name the span it sits in has been
  wrong.** Name the symbol and stop.
- `ENV_ALLOWLIST` in `app/src-tauri/src/agent/runner.rs` is unmoved at
  **423 bytes / 16 entries**, anchored on `const ENV_ALLOWLIST` (line
  939) and its closing `];` (line 958) — never a byte offset. The
  three-entry `ENV_ALLOWLIST_LINUX` beside it is a separate symbol and
  is not in that count; an anchor that matches the prefix catches both
  and then runs off the end of the file, which is how the first attempt
  here reported 251.
- Exactly **three** `#[ignore]` ATTRIBUTES, **pathspec `'*.rs'` from the
  repo ROOT** — 11 raw hits for the string in `*.rs`, of which 8 are
  prose inside doc comments. **The pathspec is load-bearing** (T-082-s2):
  with pathspec `.` the string appears in 24 tracked files, 18 of them
  documentation, and only a `.rs` file can carry an attribute. Cited by
  symbol: `perf_cold_and_incremental_within_ceilings`
  (`app/src-tauri/crates/nputer-index/tests/perf.rs`),
  `self_graph_is_current`
  (`app/src-tauri/crates/nputer-index/tests/self_graph.rs`) and
  `real_cli_smoke_records_the_stream_schema`
  (`app/src-tauri/tests/agent_runner.rs`).
- No secret-shaped or executable content in the added lines; the six
  changed paths are prose.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else, before and after.** No bind, no connect, no signal, on any
interface — the clause `9c62d04` added to the PORT RULE governs the
hand, and it was obeyed. The holder is `node` pid **82549**, one socket,
`TCP [::1]:1420 (LISTEN)`, identical at both ends.

1. **THEIR APP HAD ALREADY BEEN REPLACED BEFORE THIS SESSION STARTED,
   AND THE DISPATCH BRIEF'S PID IS STALE.** The brief named pid 36009;
   `ps -p 36009` exits **1** — that process is gone. The app running now
   is `target/debug/nputer` pid **97844**, ppid 82364, started
   **21:53:30 today**, which is `tauri dev` rebuilding and relaunching
   after T-082's Rust landed on main at `7a37b37`. The supervisor chain
   is the original throughout: `npm run tauri dev` **82342** → `tauri`
   **82364**, and `npm run dev` **82504** → `vite` **82549**, all four
   up since Aug 18 03:45:46 and all four unchanged before and after.
   **Nothing this integration did replaced anything**; pid 97844 is the
   same process at the end as at the start.
2. **`app/src-tauri/target/debug/nputer` WAS RELINKED BY THIS SESSION,
   and the previous checkpoint's reasoning for why it would not be does
   NOT hold.** It was 39,730,872 bytes at mtime 22:17, sha256
   `21773721…`, before this integration; it is 39,764,360 bytes at
   mtime 23:07, sha256 `bef1eadb…`, after `cargo test`. `cb3aa31`
   concluded that a 0-file `.rs` diff means nothing relinks it — but the
   target directory is SHARED with the human's `tauri dev`, and `cargo
   test` builds that tree with its own profile and feature set whatever
   the diff says. **Their running process is unaffected** — it was
   loaded into memory at 21:53:30 and a file on disk cannot reach it —
   and the next `tauri dev` rebuild will overwrite it again anyway. But
   the honest sentence is "a shared target directory is written by any
   cargo invocation", not "no Rust moved so nothing was touched".
3. **The window they are looking at is still current.** `app/src` is a
   0-file diff across this merge and `lib/parser/dist` was not rebuilt,
   so their frontend took no hot update. The dev server was not
   restarted.
4. **The map pane saw NOTHING new.** `docs/architecture/graph.json` is a
   0-file diff and `index --check` says CURRENT. Their map's index hint
   still reads **118 files**, correctly.
5. **Docs-watcher snapshots — this is the whole of what they will see.**
   T-083 now shows `done`, **four** new `T-083-s*` cards appeared, and
   `CONVENTIONS.md` and STATE.md moved with this checkpoint. Their
   suggestion column goes from forty-four to **forty-eight**.
6. **`app/dist` was rewritten** by the pre-suite build. The dev server
   does not serve `dist` and no module in its graph imports it.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,command` at the end: zero `vitest`, zero `playwright`
or `chromium`, zero `cargo` or `rustc`, no stray `tauri dev`, no
orphaned shell. Scratch ports **19831** and **19833** were bind-probed
free on BOTH stacks before use — `::1` and `127.0.0.1` separately,
because an IPv4-only probe of a v6 listener reports FREE — and proven
free again afterwards; both were chosen away from the lane's 14520
default. **No `pkill` was used at any point.** The T-083 worktree and
the detached drill worktree are both removed. The two `nputer-T-060`
`fake_agent` orphans (`52504`/`52505`, ppid 1, started Aug 18 16:21:18)
are unchanged before and after and deliberately left alone — they are
`T-043-s1`.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, SEVENTH OBSERVATION, AND THIS
TIME IT WAS OCCUPIED.** The session-keyed scratch directory already
contained a `T081-base` worktree belonging to the sibling lane when this
session started. Every file this session wrote there was prefixed
`T083-integ-`. Prefix or lose it.

## The board, derived from disk at both ends

Main-before (`5656a10`): **146 task files, 58 done / 25 planned / 19
parked / 44 suggested**; 58 + 25 + 19 + 44 = 146. At this checkpoint:
**150 task files, 59 done / 24 planned / 19 parked / 48 suggested**;
59 + 24 + 19 + 48 = 150. The deltas are exactly T-083 planned →
(verifying, from the branch) → done and the four new suggestion files.
Ten files sit in `docs/tasks/rejected/` and are counted separately, as
always.

## Provenance

T-083 is **built and verified by `claude-opus-5`**, `review:
same-model` — the same model on both sides, honestly stamped, and the
first verdict was a REJECTION that the second overturned on evidence
the executor produced against it. **59 done cards — 47 read
`same-model`, 6 `self-verified`, 5 `independent`, and T-056 is a done
card whose `review:` is EMPTY**; 47 + 6 + 5 + 1 = 59, so every done card
carries the field. T-083 moves `same-model` from 46 to 47. Of the five
`independent` stamps only three have different models on the two sides
(T-057, T-058, T-060). Unchanged by this merge; no card's history was
re-stamped.

**A NINTH DATA POINT ON WHO STAMPS `done`.** T-083's verifier left
`status: verifying` for the integrator, exactly as T-043's, T-076's,
T-073's, T-069's, T-078's and T-080's did, and the integrator stamped it
at the checkpoint — **eight of the last nine**, with T-058's executor
the only outlier, across both size tiers. The question is closed on the
evidence; only the writing-down into `method/` is left, and `T-078-s3`
records why a docs-fenced card cannot do it.

## ROADMAP and ARCHITECTURE: both deliberately NOT touched

**ROADMAP was NOT ticked.** The discriminator is: does it change what a
USER can do or see? T-083 answers **no** — it changes what an INTEGRATOR
and an EXECUTOR compute. `grep` for `T-083` in `docs/ROADMAP.md` returns
nothing, and there is no sentence there this merge makes true or false.
The precedent class is T-019 / T-030 / T-053 / T-076 / T-073 / T-078 /
T-080.

**ARCHITECTURE was NOT touched.** No component interface moved — the
merge's diff contains no `app/**` or `lib/**` source and no IPC, grant
or manifest movement. `grep` for `T-083`, for `merge's diff`, for
`merge-base` and for `range rule` all return nothing there.

## Findings from this integration, none rejection-grade

- **THE DISPATCH BRIEF CARRIED A STALE PROCESS ID AND A WRONG AGE, AND
  BOTH WERE CAUGHT BY MEASURING RATHER THAN BY TRUSTING.** It named the
  human's app as pid 36009 — dead before this session started — and
  called the earliest falsification "weeks old" when it is two days old
  and the repository is three. The second error was inherited from the
  merged text, which is the more interesting direction of travel: **a
  brief quoting a document does not independently confirm it**, and two
  agreeing sources here were one source counted twice.
- **STATE HAS BEEN RUN AS A LOG FOR TWO COMMITS, NOT AS A SNAPSHOT.**
  `88c394f`, T-082's own checkpoint, made a 17-line insertion and a
  9-line deletion and left the header reading *"T-080 merged and
  checkpointed"*; `ddcc8bb` then appended 39 lines to the same
  T-080-headed document. So main has carried a STATE whose masthead and
  "Just completed" described a card two merges back while its body
  described a later one. `method/roles/integrator.md` says *"STATE.md:
  rewrite (it is a snapshot, not a log)"*. This checkpoint rewrites it.
- **A drill's own liveness has to be demonstrated in the same worktree
  as the drill that stays green**, or a green is unreadable. Drills A
  and C are green because nothing reads that bullet; drill B is red
  eleven lines away in the same file. Two facts, one file, one session —
  and only the pair is evidence.
- **`cb3aa31`'s span figure was a correction that introduced an error.**
  See the security sweep. A checkpoint correcting a checkpoint deserves
  the same derivation discipline as the original, and this one anchored
  on a doc comment.

## Health of the tree

At this checkpoint main contains T-083's merge `5c60e5a` plus this
checkpoint. Parser, app, Rust, E2E, token lint, the token lint's own
selftest, `cargo audit` and the graph-currentness gate are all green;
neither merge-time gate fired and both derivations were computed and
recorded. Nothing is broken.

## In progress / broken right now

**ONE SIBLING LANE HOLDS A WORKTREE AND IS ACTIVE RIGHT NOW.**

- **T-081 — `/Users/ujju/Projects/nputer-T-081`, branch
  `task/T-081-denial-relay`.** It committed twice while this integration
  ran and its tip reached `94476b4`, *"T-081: implementation notes, six
  findings, status verifying"*. It is a live lane with a card in
  `verifying`, and it also holds a detached base worktree inside the
  shared scratch directory. **Nothing in this checkpoint touched it**,
  and whoever integrates it should re-derive main's tip rather than
  inherit `5656a10` from anywhere — this checkpoint is exactly the kind
  of movement that produced the 6-to-24 drift table above.
- **A REAL-CLI OBSERVATION SESSION and an F-04 DECOMPOSITION PASS, both
  outside the repo.** Their products are on main already
  (`docs/research/real-cli-observation.md`,
  `docs/design/dispatch-technical-plan.md`,
  `docs/design/cross-harness-plan.md`). Read-only from this tree's point
  of view.

The T-083 worktree is removed; the branch `task/T-083-range-rule` is
kept at `72647a1`. No lane is blocked on this checkpoint.

## Next up

1. **`T-083-s2` is now the sharpest card on the board, and it is sized
   S–M with a working prototype already written.** The range rule is the
   most-consulted paragraph in CONVENTIONS and the least defended; the
   verifier built a ninety-line reader in one pass that goes GREEN on the
   merged file and RED with 13 findings on a poisoned one. It has to live
   in `tools/e2e/tests/`, beside `workflow-parity.spec.ts`, and it now
   carries **eight** items — the eighth being N11, the corrupted recipe,
   folded in at this checkpoint. **This checkpoint's drills A and C are
   two more mutants for its fixture set**, both green today.
2. **Triage the forty-eight undispositioned suggestions** — six
   `T-043-s*`, five `T-076-s*`, five `T-073-s*`, three `T-069-s*`,
   twelve `T-078-s*`, eight `T-080-s*`, four `T-082-s*`, `T-046-s4` and
   four `T-083-s*`. The backlog has grown by 9 since the last
   checkpoint; the fifth triage is badly overdue. **Treat `T-076-s4`,
   `T-069-s3` and `T-073-s4`/`s5` as ONE item**, unchanged;
   **`T-080-s7` and `T-080-s8` are one item too.**
3. **The poison taxonomy renumbering pass is now overdue by THREE
   ordinals.** T-078 shipped FIVE and SIX. `T-078-s13` proposes EIGHT,
   `T-080-s7` proposes NINE, `T-083-s3` proposes another — *a set
   comparison with no non-emptiness floor calls two failures agreement*
   — and SEVEN, the mutant no body kills, still has four independent
   sightings and no owner. Four lanes that cannot see each other are
   extending one list.
4. **`T-069-s2` remains the cheapest real improvement on the board**:
   one arm, one fixture, one body. **`T-069-s1` is one line** and
   improves five bodies at once.
5. **T-070** is dispatchable on the fence T-043 released (`app-agent`,
   `blocked_by: []`), and `app-agent` is free. **T-065**
   (`blocked_by: [T-057, T-058]`) remains unblocked and undispatched;
   **T-067** and **T-068** still wait behind it. **T-077** inherits
   T-053-s1. **T-081** is in `verifying` on its own lane.
6. The human-owned authenticated genesis below — still the whole
   remaining milestone-3 gate.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3). GRAPH REGEN did NOT fire here, so the usual reason applies
only in its weaker form — but this checkpoint edits `CONVENTIONS.md`
and `STATE.md` after the merge, so a lane cut from `5c60e5a` would be
cut from a tree whose range rule still says "false for weeks".

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with
  light and dark completion screenshots. The observation session has
  measured the CLI's real stream shapes; the timed genesis is still
  owed.
- **Confirm the quit-mid-turn behaviour** (T-043's own @human line):
  start a `hang`-scenario genesis, quit the app, and it should close
  promptly rather than after a five-second pause.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes. **And whether
  T-083's split rule reads as one idea or two** — the card's own @human
  line, still unanswered.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **The two `nputer-T-060` `fake_agent` orphans** (`52504`/`52505`) are
  still alive at ppid 1 and safe to kill by pid; recorded as `T-043-s1`
  rather than swept, because nobody has attributed them.
- **Repository remote:** there is still no remote and **CI has never run
  on a real runner**, so `index --check` and the token lint's third exit
  code are properties the code HAS and gates CI does not yet ENFORCE.
  The integrator ran `index --check` by hand at this checkpoint and it
  exited 0.
- **THE SEVEN-DAY QUOTA IS THE BINDING CONSTRAINT, and it is a fact the
  app currently discards.** The real-CLI observation's stream carried a
  `rate_limit_event` line — `{"status":"allowed_warning",
  "rateLimitType":"seven_day","utilization":0.85,
  "surpassedThreshold":0.75,"resetsAt":1787371200}` — measured
  2026-08-19 ~15:5x. **85% spent, resetting 2026-08-22 07:00.** Each
  verifier or integrator lane costs 130k–230k tokens. The runner ignores
  `rate_limit_event` entirely — surfacing it is a candidate card, and it
  is the one line in the stream that is about the user rather than the
  turn.
- **`claude login` was not a command and the app shipped it — CLOSED at
  T-082's merge `7a37b37`.** The app now prints `claude auth login`,
  checked against 2.1.226's own `--help` surface. The fixture question
  was settled on provenance: `fake_agent.rs:176`'s message is COMPOSED,
  not transcribed, proved four ways, left verbatim and marked composed
  in place. The class was swept, not just the instance.
- **THE DISPATCH STAMP LAPSED, AND THE LAPSE IS THE ARCHITECT'S.**
  `status: building` was stamped on main at dispatch for this project's
  first four days — 25 explicit `Dispatch T-NNN` commits — and no such
  commit exists after T-042 on 2026-08-17. The claim that `building` had
  never been used is false (87 commits moved it) and came from grepping
  the current tree, which cannot see a transient state. The conflict
  question was TESTED in a throwaway repo: **stamping before the branch
  is cut merges CLEAN; stamping after the lane exists CONFLICTS.** So
  `TASK-FORMAT.md:97`'s "fields lock at dispatch" is the constraint that
  makes the field safe. Restoring the stamp is a decision, not a repair
  — see `docs/design/dispatch-technical-plan.md` D4.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists.

## Open questions

- **Should a done card's TITLE be corrected when its own body retires
  it?** New, from this merge. T-083's title still ends *"is now false
  three times"*; the merged bullet says thirteen distinct merges, and
  this checkpoint measured a fifteenth and sixteenth flip. The title was
  accurate when the card was filed at `99791ea`. It was left ALONE here
  — `TASK-FORMAT.md` locks fields at dispatch, the verifier approved the
  card as it stands, and a title is a record of what a card was opened
  for. But the board renders it, so the falsehood is the most visible
  sentence T-083 produced. Ruling wanted.
- **Where does a lane whose fence is `app/src-tauri/**` run its poison
  drill?** Still unwritten. This integration is a second worked answer
  for the general case: a detached scratch worktree at the merge commit,
  `node_modules` symlinked read-only, nothing installed, symlinks
  removed before the worktree. The candidate rule stands.
- **How many poison shapes are there, and who renumbers them?** See
  "Next up" 3; `T-083-s3` is the newest claimant.
- **Should a pin ever assert a PROXY for the thing it means?** Unchanged
  (T-073's include pin, T-080-s8's three rungs) — and T-083 adds the
  cleanest statement of it yet, in the argument for `merge-tree` over
  three dots: *three dots answers "what has my branch changed since it
  was cut", which is a PROXY; merge-tree answers the gate's own
  question.*
- **Does TASK-FORMAT's size-S row need a carve-out?** Unchanged.
  `T-078-s3` records why a `[docs/CONVENTIONS.md, method/]` fence cannot
  carry a `method/` format bump — and `T-083-s2` is the same shape from
  the other side: a one-file fence around a claim whose defence must
  live in another tree.
- **What does `review: independent` mean — a different session, or a
  different model?** Unchanged: five done cards carry it, three have
  different models on the two sides.
- **Should `aliasedIdSlots` keep its `compare` parameter?** Endorsed by
  two sessions and filed by neither.
- **Should a card's title be allowed to open with a backtick?**
  Unchanged, from `T-080-s6`. Checked at this merge: none of T-083's
  four new titles does.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves
  against T-056's direction; it is T-072's third criterion.

**Answered by this merge, and left in place rather than edited out:**

- *"Which two commits does 'the merge's diff' mean, and is it the same
  pair before the merge exists?"* — **ANSWERED, and the answer is NO.**
  At the merge it is `<main-before>..<the merge commit>`, where two dots
  and three dots collapse onto the same set. Before the merge there is
  no merge commit, so you BUILD its tree with
  `git merge-tree --write-tree` and diff main against that. Both forms
  were run on this very lane and both returned the same six paths.
- *"Does the naive range ever change WHETHER a gate runs, rather than
  only what you report?"* — **YES, on thirteen distinct merges, and this
  is the thirteenth.** The sentence that said otherwise was never true
  for a single commit.
