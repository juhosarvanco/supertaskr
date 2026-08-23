# State

Updated: 2026-08-23 by claude-opus-5 @T-061-integrate (T-061 merged and
checkpointed).

## Just completed

**T-061 — the boot gate cleans up after a killed CLI, and derives its
overlay from the values it overrides.** F-02, milestone 3, size M,
`touches: [tools/e2e]`. Built by `claude-opus-5 @T-061`, verified by
`claude-opus-5 @T-061-verify`; `review: same-model`. Approved on the
FIRST verdict with **five non-blocking findings**. Approved branch tip
**`ed0c622`**; merge **`ea7ea0a`**. The card was at `status: verifying`;
the integrator stamped **`done`** at this checkpoint — the **eleventh**
card running.

**WHAT LANDED.** The boot check's fourth terminal path — `child.once
("exit", …)`, the T-040 case and every future "the app failed to boot"
case — used to print its report and call `process.exit(1)` with NOTHING
signalled, leaving a live vite listener and an orphaned esbuild helper;
on the DEFAULT path that listener is on **1420, the human's port**, so
the gate could break the one thing it exists to protect. Now the pgid is
captured at spawn, a zero-signal liveness probe runs before any signal,
`isSignalableGroup` refuses anything that is not an integer `> 1` (so
`-0`/`0`/`1`/`-1` — the caller's own group and the POSIX broadcast — are
unreachable), and the exit happens INSIDE the reap's continuation so the
process cannot leave before the reap has had its say. The orphan drill
is now a SHIPPED PROCEDURE, `npm run boot:orphan-drill`, with the same
four-code contract the other three gates use. And the `--config` overlay
is DERIVED from the committed `tauri.conf.json` rather than hard-coded:
only the PORT of the committed `devUrl` is rewritten, and the committed
`beforeDevCommand` is APPENDED to, not replaced.

**THE RESIDUAL IS ASSERTED AS RESIDUAL, which is the honest half.** A
wrong committed `devUrl` port is still masked — the verifier re-measured
it, `devUrl` → `http://localhost:14999` still exits **0, green** — and
the lane has a body asserting that residual, distinct from the body
asserting the rewrite. A poison mutant that hard-codes T-046's string
kills the rewrite body and leaves the residual body green, so the two
are genuinely separate claims rather than one claim written twice.

**EIGHTEEN PATHS, ELEVEN OF THEM CODE, SEVEN UNDER `docs/`.** Re-derived
here: `M` the card, `A` six findings `T-061-s1`…`s6`, `A`
`tools/e2e/scripts/orphan-drill.mjs`, `M` `tauri-boot-check.mjs`,
`boot-port.mjs`, `docs-gate.mjs`, `docs-scan.mjs`, `lint-tokens.mjs`,
`token-scan.mjs`, `M` `tools/e2e/package.json` (one script line),
`tsconfig.json` (`checkJs` on, with `scripts/**/*.mjs` as a glob), and
two specs. 2796 insertions, 91 deletions. Suffix census: **7 md, 7 mjs,
2 ts, 2 json**.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree f306ee9 ed0c622  -> tree b118ce50…, exit 0
    git diff --name-only f306ee9 <TREE>                        -> 18   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only f306ee9...ed0c622   (THREE dots)      -> 18   cmp against the forecast: exit 0
    git diff --name-only 2036fb2..ed0c622    (TWO, branch-only)-> 18   cmp against the forecast: exit 0
    git diff --name-only f306ee9..ed0c622    (TWO dots)        -> 130  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only f306ee9..ea7ea0a    (TWO dots)        -> 18   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only f306ee9...ea7ea0a   (THREE dots)      -> 18   collapses onto the line above, cmp exit 0
    git diff --name-only 2036fb2..ea7ea0a    (TWO dots)        -> 130  the naive at-merge range

`git merge-base --is-ancestor f306ee9 ea7ea0a` exits **0**, so at the
merge two dots and three dots COLLAPSE. Merge-base **`2036fb2`**; main
advanced **112** paths from it, the branch **18**, `comm -12` over the
sorted lists is **EMPTY**, and 112 + 18 = 130 — exactly the forbidden
count, and that arithmetic is the check that the two sets are disjoint.

**THE FORBIDDEN COUNT MORE THAN DOUBLED IN AN AFTERNOON WHILE THE TRUE
COUNT NEVER MOVED.** The verifier measured the forbidden form at **60**
against main `4d2f03c`; at `f306ee9` it is **130**. The prescribed form
is **18** at both. The whole 70-path swing is main's own triage work
arriving on the LEFT-hand endpoint, and it is why the ban has to name
the PAIR rather than the punctuation. T-084's checkpoint recorded a
count going stale from the RIGHT-hand side; this one goes stale from the
LEFT. **Both endpoints move, and a figure without its ref is not a
figure.**

**THE FORECAST WAS EXACT UNDER BOTH METRICS.** `git merge-tree
--write-tree` returned tree
**`b118ce5026d7b6a909376a7240184564af9927b8`** at exit 0, read from `$?`
and not swallowed by a command substitution — and **the no-ff merge's
own `HEAD^{tree}` IS that tree**, with parents `f306ee9` and `ed0c622`
and nothing else; `cmp` of the whole patch against the merge's later
diff exits **0**. The staged set at `git merge --no-commit` was the
eighteen paths and nothing more, `cmp`-ed against the forecast at exit
0. **NOTHING WAS WRITTEN INTO THE MERGE COMMIT** (`T-083-s4`); every
integrator edit is in this checkpoint.

## THREE gates — and this time the naive range does NOT flip either suffix gate

| gate | prescribed `f306ee9..ea7ea0a` (TWO dots) | naive `2036fb2..ea7ea0a` (TWO dots) |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — NOT OWED** | **0** |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **2 — FIRES** | 2 |
| DOCS GATE (a `docs/` path a code suite reads) | **7 — FIRES**, three suites | 119 — fires |

**THIS IS THE COMPLEMENT OF T-084'S FLIP, AND THE REASON IS DERIVABLE
RATHER THAN LUCKY**: main's 112-path advance is **entirely under
`docs/`** — `git diff --name-only 2036fb2..f306ee9 | grep -v '^docs/'`
returns **0** — so neither suffix-triggered gate can see it, and the
naive range cannot manufacture a BOOT CHECK the way it did at T-084. The
DOCS GATE still differs, 7 against 119, because that gate's trigger is
exactly what main moved: the naive range would have owed the same three
suites **for the wrong reason**, which is what a right answer by a wrong
route looks like and is the harder case to notice.

**BOOT GATE — NOT OWED AT 0 OF 18, AND RUN ANYWAY.** This merge is what
CHANGES the boot check, and a gate whose own implementation moved cannot
be cleared by its trigger arithmetic: the trigger asks *did the app's
shell move*, and here the answer is no while the question-asker itself
moved. `NPUTER_BOOT_PORT=14721 npm run boot:check` from tools/e2e exits
**0** with both `[nputer]` lines (*project folder:* and *window "main"
created*), child pid 45360, captured group 45360, tree stopped on
SIGTERM, no survivor on the port on any of the four stacks afterwards.
**The overlay was read off the wire**: committed `beforeDevCommand: "npm
run dev"` and `devUrl: "http://localhost:1420"` became
`{"build":{"devUrl":"http://localhost:14721","beforeDevCommand":"npm run dev -- --port 14721 --strictPort"}}`
— port-only rewrite, command appended.

**THE SHIPPED ORPHAN DRILL RAN TOO, and it is not the boot gate.**
`NPUTER_BOOT_PORT=14722 npm run boot:orphan-drill` exits **0, PASS** —
*the child-exit path signalled its group before exiting*, with the boot
check's own two new lines visible in the transcript (*still has members
… SIGTERM to the group*, then *is empty — no orphan survives this
check*).

**GRAPH REGEN — OWED on the two `.spec.ts` paths, RUN, and a PROVEN
NO-OP.** `index --check --root ../..` exits **0** before (*CURRENT …
585305 bytes, 119 files, 1018 symbols, 1539 edges*), the regen exits
**0** moving **zero** paths, and `index --check` exits **0** after. The
fourth worked example of the trigger being deliberately wider than the
walk (T-054, T-058, T-084, now T-061): `.nputerignore` excludes `docs/`
and `tools/`, and **all eighteen paths are under one or the other**, so
this merge's indexable-path count is **0**.

**DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with `$(cat <the 18>)`
and never through `xargs`. Seven `docs/` paths owing **three** suites:
`npm test from app/`, `npm test from tools/e2e/`, `npx vitest run from
lib/parser/`. `cargo test from app/src-tauri/` is correctly NOT owed —
its two readers resolve `docs/architecture/components` and
`docs/CONVENTIONS.md`, neither of which this merge touches, which is the
gate's proportionality holding on a fourth prefix. It reports **11
derived readers across 4 suites**, **0 frontmatter issues**, and *every
live task card's frontmatter parses, with a legal status* — the check
that the new findings are legal, run by the gate rather than by eye.
**This checkpoint's own diff is entirely `docs/**`, so the gate fires on
it too and the owed suites were re-run AFTER these edits.**

## The two figures the verifier corrected — and both went stale again

**CONTROL: the notes said 591, the verdict corrected it to 597, and at
the merge it is 566.** All three are right at their own refs, derived
from `git ls-tree` minus the `SKIP_DIRS` and
`CONTROL_BINARY_EXTENSIONS` sets read out of `token-scan.mjs`:

| ref | what it is | tracked | CONTROL | TOKEN |
|---|---|---|---|---|
| `2036fb2` | merge-base | 608 | **590** | 123 |
| `44007bc` | the CODE commit | 609 | **591** ← the notes' figure | 124 |
| `ed0c622` | approved tip | 615 | **597** ← the verdict's figure | 124 |
| `f306ee9` | main-before | 577 | **559** | 123 |
| `ea7ea0a` | **the merge** | 584 | **566** | **124** |
| this checkpoint | +2 findings filed here | 586 | **568** | 124 |

It closes three ways: main NET-REMOVED **31** tracked files (29 A + 12
R099 − 60 D, the sixth triage taking the suggestion backlog to zero),
the branch adds **7** (six findings plus `orphan-drill.mjs`), and
590 − 31 + 7 = **566**, which is what the lint printed. **And the last
row is this checkpoint moving it AGAIN** — the two findings filed below
take it to **568**, printed by the post-edit lint run. The figure was
stale twice before it reached me and I am not going to publish a third
one without its ref. TOKEN is 124
because main's advance is all `docs/` and TOKEN counts only `app/src`,
`app/test`, `tools/e2e`. **The verifier's correction was right and was
overtaken by the left-hand endpoint before it could be merged.**

**`T-061-s4` NAMES THE WRONG BODY — and the flake did not fire for me at
all.** The card is titled for
`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`; the body the
verifier caught red **3 of 7** runs is
`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`
(`app/src-tauri/tests/agent_runner.rs:1066`, panic at :1091), and the
titled body passed in all seven. **I ran the same seven at the merge and
got SEVEN GREEN** — 352/0/3 at exit 0 every time. So the measured rate
is 3-of-7 under the verifier's load and **0-of-7 under mine**: a
load-dependent race, not a fix. `git diff --name-only f306ee9..ea7ea0a
-- app/ lib/ crates/` is **0 paths** and `agent_runner.rs` was last
touched by T-081 at `6251d37`, so nothing here could have fixed it.
**A future integrator who sees it red should not read my seven greens as
a baseline.** Both corrections are appended to the card and to `s4` as
dated integrator sections — history appended, never rewritten (T-081).

## Suites, every number derived at this checkpoint, exits read unpiped

Each command's own `$?` was echoed immediately. **No exit code here was
taken through a pipe** — the first `index --check` was read through
`${PIPESTATUS[0]}`, which is EMPTY in zsh and printed nothing, and was
re-run unpiped. `docs-gate.mjs` was fed `$(cat <list>)`, never `xargs`.

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` **0**; `npm run build` **0** FIRST, per the fresh-clone
  order.
- **app: 840/840 across 43 files**, `APP_TEST_EXIT=0`; `npm run build`
  **0**, **265 modules transformed**, `index-kNOKiTKD.js` **502.75 kB**
  and `index-CwYF5FQb.css` **43.95 kB**. **Neither hash is this merge's
  doing** — the merge changes no `app/**` path, so the bundle is a
  function of `f306ee9` alone.
- **bare Rust workspace, `cargo test --no-fail-fast`, SEVEN runs: 352
  passed / 0 failed / 3 ignored, exit 0 every time**, summed
  programmatically over **fifteen** `test result:` lines each. Not
  `--all-targets`, which skips doc-tests.
- **E2E: 129/129**, `E2E_EXIT=0`, one worker, zero retries, zero skips,
  scratch port **14723**; `npm run typecheck` **0** with `checkJs` on.
- **token lint: selftest 0, lint 0** — `clean (TOKEN 124 …; CONTROL 566
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, **71** walk-policy
  checks, 8 evidence-floor checks. This is also the repo's only NUL gate
  and it is green; independently, the merge's eighteen paths were read
  as bytes and **0 carry a NUL**. **THE FIRST NUL PROBE WAS A FALSE
  POSITIVE GENERATOR, and it is written down because it looked
  authoritative**: `grep -qU $'\x00'` reported a NUL in all 18 files,
  because the shell truncates the pattern at the NUL and greps for the
  empty string, which matches everything. A gate that answers YES for
  every input is not a gate.
- **`cargo audit -n`** exit **0**: 472 crate dependencies, **0
  vulnerabilities / 17 allowed warnings**, unmoved — which a 0-file
  `Cargo.lock` diff requires.
- **`index --check`** exit **0** before AND after the regen.
- **DOCS GATE** exit **1**, owing three suites — all three above.
- **BOOT GATE** exit **0** at 0 of 18 paths — not owed, run anyway, and
  the reason is recorded rather than the silence.

## The poison drill — the verifier's headline mutant, at the MERGED commit

Detached scratch worktree at `ea7ea0a`, with `CARGO_TARGET_DIR` set
INSIDE the drill directory (T-013-s7). **Correspondence established by
hash before anything was mutated**: `orphan-drill.mjs` `a026f5cb…`,
`tauri-boot-check.mjs` `344f55a9…`, `boot-port.mjs` `de005bc0…`, each
identical to `git show ea7ea0a:<path>` — so the drilled artifact IS the
merged artifact by construction, and the latter two also reproduce the
verifier's own recorded hashes.

- **CONTROL, shipped code, port 14724: exit 0, PASS.** Run in the same
  scratch worktree as the mutant, so the environment is not the
  variable.
- **MUTANT — the child-exit continuation replaced by a bare
  `process.exit(1)`**, the pre-T-061 behaviour of that one path,
  substitution count **1**, mutated text read back with `git diff`
  before anything ran. Port 14725: **exit 1, `EXIT_LEAK`** — *left 4
  process(es) in group 59945, with port 14725 STILL HELD*: the `npm run
  dev` shell, an `npm list` of the tauri plugins, the vite listener and
  the esbuild helper. The drill then reaped its own mess.

Red, then green, on the same shipped procedure, against the merged
bytes. Restored by byte copy from `git show ea7ea0a:<path>`, proved
twice — empty per-path `git diff`, sha256 back to `344f55a9…`.

**THE T-013-s7 PRECAUTION COST NOTHING AND WAS UNNECESSARY FOR THIS
DRILL, which is worth recording so the next person does not re-derive
it.** The scratch `CARGO_TARGET_DIR` finished at **0 bytes**: the drill
SIGKILLs the tauri CLI as soon as vite is listening, which is during
`beforeDevCommand` and BEFORE cargo is ever invoked. Take the precaution
anyway — it is free here, and the failure it prevents is 33 red bodies.

## Security sweep — zero movement, every figure re-derived

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`tauri.conf.json`, no capability file and no `.entitlements`**. The only
manifest is `tools/e2e/package.json` and its entire diff is the one
`boot:orphan-drill` script line. **No dependency added.**

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
  `EXPECTED_GRANTS`: declaration line **54**, closing `];` line **147**,
  entries 55–146 = **92**, with **ZERO** comment or blank — counted four
  independent ways over the symbol-anchored body (92 quote-bearing
  lines, 92 quoted strings, 92 UNIQUE quoted strings, 0 comment/blank).
  **Name the symbol and stop.**
- **Exactly THREE `#[ignore]` ATTRIBUTES**, anchored on
  `^[[:space:]]*#\[ignore` with pathspec `'*.rs'` from the repo ROOT,
  all three carrying `= "reason"`. The closed literal `#[ignore]`
  matches **8 lines in 5 files and every one is prose**, so the naive
  count is **disjoint** from the truth rather than merely inflated.
- **IPC is THIRTEEN at both ends**: 13 anchored `#[tauri::command]` and
  13 `generate_handler!` entries with comments stripped. Both census
  traps reproduce — the unanchored literal reads **14** (a doc comment),
  and a naive comma-split of the raw macro block over-reads because
  **two comments inside the macro carry commas**. Strip comments, then
  count.
- No secret-shaped content: all **2796** added lines scanned for
  `sk-`/`AKIA`/PEM/bearer/assignment shapes — **0 hits**.
- **THE SWEEP THIS CARD ACTUALLY NEEDS — every signal, and what it is
  addressed to.** No `shell: true` anywhere in `tools/e2e/scripts`; no
  `pkill`, no `killall`, no hardcoded pid, no path outside the worktree.
  Every group signal is `process.kill(-pgid, …)` with `pgid` captured at
  spawn and passed `isSignalableGroup`. **There is exactly ONE signal to
  a bare pid** — `orphan-drill.mjs:308`, `process.kill(cli.pid,
  "SIGKILL")` — and the line above it re-reads that pid's membership out
  of `ps` and requires `cliMembership.pgid === pgid`, exiting
  `EXIT_CANNOT_RUN` with *"Nothing was signalled"* if the CLI left the
  group between the census and the signal. `execFileSync("/bin/ps",
  ["-Ao", …])` is read-only with no interpolation; both `spawn` calls
  are argv arrays.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else, before and after.** No bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket, `TCP [::1]:1420
(LISTEN)`, identical at both ends.

1. **Their app process is unchanged — pid 85379, vite 82549**, identical
   before and after. This merge touches no `app/src-tauri/**` and no
   `app/src/**` path, so the watcher had nothing to rebuild — the
   generalisation T-084's checkpoint proposed, holding a second time:
   **it is the BOOT GATE's own trigger set that predicts whether the
   human's window survives an integration.**
2. **`app/src-tauri/target/debug/nputer` WAS relinked** by the seven
   cargo runs and the regen — sha256 `25cedbed…` → `8ef00495…`. A shared
   target directory is written by any cargo invocation (T-083's
   correction to `cb3aa31`, a fifth time); a file on disk cannot reach a
   loaded process, so pid 85379 is unaffected. **The poison drill did
   not touch it at all.**
3. **The map pane sees the SAME graph** — `docs/architecture/graph.json`
   did not move: 119 files, 1018 symbols, 1539 edges, unchanged by both
   the merge and the regen.
4. **Docs-watcher snapshots.** T-061 now shows `done`, **eight** new
   `T-061-s*` cards are live, and STATE.md moved. The suggestion column
   goes from zero to **eight**.
5. **`app/dist` was rewritten** by the pre-suite build; the merge moved
   no bundle input, so the bytes are `f306ee9`'s.

**No process from this integration survives.** Scratch ports **14721,
14722, 14723, 14724, 14725** were each bind-probed free on all four
stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use — an IPv4-only
probe of a v6 listener reports free, which is why all four — and
verified empty after. **No `pkill` was used at any point.** The T-061
worktree is removed and the branch kept. The two `nputer-T-060`
`fake_agent` orphans (`52504`/`52505`, ppid 1, started Aug 18 16:21:18)
are unchanged before and after and deliberately left alone — `T-043-s1`,
a parked human decision. **This card is about reaping orphans, which is
exactly the reason to be careful with somebody else's.**

**THE SCRATCH DIRECTORY IS NOT PRIVATE, TENTH OBSERVATION.** Every file
this session wrote there was prefixed `T061-integ-`. Prefix or lose it —
and this session shared the scratchpad with two OTHER live sessions'
worktrees (`drill`, `VERIFbase`), which is the concrete reason.

## Findings and corrections from this integration

- **THE VERDICT'S FIVE FINDINGS WERE FILED AS NO FILES AT ALL.** They
  were written into the card's verdict section, and triage reads
  `docs/tasks/*.md`, so they would have been invisible to it. The
  dispatch brief said to check each was "present with a legal status";
  none was present. Disposed of here without inventing work: two are
  genuinely new defects and are filed — **`T-061-s7`** (the drill cannot
  run against pre-fix byte copies and its ESM link failure reports
  itself as `EXIT_LEAK` having spawned nothing — a false ALARM, never a
  false green; **filed and left**, per the brief) and **`T-061-s8`**
  (two sentences claim the spawn-time capture and the probe answer pid
  RECYCLING, which measurement says they do not). The other three are
  corrections and were appended to the cards they correct — verdict 3 to
  **`T-061-s6`** (the probe is pinned by nothing: delete it and the
  guard spec is 14/14 green and the drill exits 0 — confirmed by
  mutation, no second card for one defect), verdict 4 and 5 to the card
  and **`T-061-s4`**. **A finding that exists only inside a verdict is a
  finding the board cannot see.**
- **`CONVENTIONS:690`'s false `xargs` sentence is NOT this merge's**,
  confirmed rather than assumed: `git diff f306ee9..ea7ea0a --
  docs/CONVENTIONS.md` is a **0-file diff**. `T-089`'s live lane owns
  that file and **has already folded the correction in** — its working
  copy now reads *"NEVER PIPE IT THROUGH `xargs`, AND DISTRUST ANY
  SENTENCE THAT NAMES…"*, re-measured at T-089 on Darwin 25.6.0.
  `T-061-s3` is the finding that produced it.
- **ROADMAP was NOT ticked**, and the discriminator is unchanged: does
  it change what a USER can do or see? T-061 answers no — it is a gate
  and a dev-tool drill, and no screen moves. `grep` for `T-061` in
  `docs/ROADMAP.md` returns nothing at all.
- **ARCHITECTURE was NOT amended, and this is a derivation rather than
  an omission.** The nearest candidate is the C-07 row's clause about
  *"ONE exit-code contract shared with `npm run boot:check`"*: this
  merge adds a THIRD command on that contract, `npm run
  boot:orphan-drill`. That makes the sentence **incomplete, not false**
  — and the incompleteness is exactly what `T-061-s5` is filed for,
  with an argued reason (the lane's fence is `[tools/e2e]`, so it could
  not reach the docs that legend commands). Naming commands is
  CONVENTIONS' job, and CONVENTIONS is `T-089`'s live fence. Left for
  triage.
- **No new ADR.** Nothing non-obvious was decided by this role; the
  judgement calls — filing two of the verdict's five, appending the
  other three, running a gate the arithmetic did not owe — are recorded
  above.

## The board, derived from disk at both ends

Main-before (`f306ee9`): **136 flat task files, 64 done / 44 planned /
28 parked / 0 suggested**; 64 + 44 + 28 = 136. At this checkpoint: **144
flat task files, 65 done / 43 planned / 28 parked / 8 suggested**;
65 + 43 + 28 + 8 = 144. The deltas are exactly T-061 planned → done and
the eight new suggestion files (six from the branch, two filed here from
the verdict). Twenty-two files sit in `docs/tasks/rejected/` and are
counted separately, as always.

**THE SUGGESTION BACKLOG WAS AT ZERO AND IS NOW AT EIGHT.** The sixth
triage cleared it at `f306ee9` — the first time this board has been
empty on that column — and this merge is the first deposit against it.
That is the healthy direction for a backlog that peaked at 81, and it
means the eight below are the WHOLE queue rather than the newest layer
of one.

## Provenance

T-061 is **built by `claude-opus-5` and verified by `claude-opus-5`**,
`review: same-model`, **approved on the first verdict** — the executor
handed off at `status: verifying` and the integrator stamped `done`
here, which is **eleven of the last twelve**, with T-058's executor
still the only outlier. The question of who stamps `done` is closed on
the evidence; only the writing-down into `method/` is left, and
`T-078-s3` records why a docs-fenced card cannot do it.

**65 done cards — 50 read `same-model`, 9 `self-verified`, 5
`independent`, and T-056 is a done card whose `review:` is EMPTY**;
50 + 9 + 5 + 1 = 65, so every done card carries the field. T-061 moves
`same-model` from 49 to 50. No card's history was re-stamped.

## Health of the tree

At this checkpoint main contains T-061's merge `ea7ea0a` plus this
checkpoint. Parser, app, Rust, E2E, token lint, the lint's own selftest,
`cargo audit`, the graph-currentness gate and the docs gate are all
green; **all three standing gates were RUN this time** — two because
they fired, and the BOOT GATE because the merge changes the gate itself
even though its trigger matched nothing. Nothing is broken.

**ONE KNOWN-FALSE SENTENCE IS LIVE IN THE MERGED TREE, DELIBERATELY**:
`tauri-boot-check.mjs:212`'s claim that capturing the pgid at spawn
rather than at kill time "is the whole point". It is carried by
`T-061-s8` with the measurement. (The `ROOT_ANCHOR_LEDGER` comment that
T-084's checkpoint flagged is now carried by a promoted card; the
`CONVENTIONS:690` xargs sentence is `T-089`'s, already corrected in its
lane.)

## In progress / broken right now

**FOUR SIBLING LANES ARE LIVE, and all four are PAIRWISE DISJOINT and
disjoint from this merge** — measured at this checkpoint with `comm -12`
over each lane's branch-only path list, every pair returning **0**, and
every lane against this merge's eighteen returning **0** too.

| lane | branch | tip | status on its branch | paths | `touches` |
|---|---|---|---|---|---|
| **T-013** | `task/T-013-semantic-zoom` | `a2173f8` | `verifying`, no verdict yet | 24 | `[app-map, app-shell]` |
| **T-064** | `task/T-064-switch-one-story` | `cdaf5b7` | `verifying`, `@T-064-verify` stamped | 17 | `[app-shell]` |
| **T-070** | `task/T-070-arrival-reads-disk` | `aec0d66` | `verifying`, `@T-070-verify` stamped | 11 | `[app-agent, app-interview]` |
| **T-089** | `task/T-089-brief-contract` | `b416efb` | `verifying`, no verdict yet | 14 | `[method/, docs/CONVENTIONS.md]` |

**T-013 AND T-064 SHARE THE `app-shell` SLUG AND OVERLAP IN ZERO
FILES** — the shared-slug case the fence rules allow and the one worth
re-measuring at every checkpoint rather than trusting, because the
fences are declared and the files are not. **T-070 and T-089 both
advanced DURING this integration** (T-070 `1e0b940` → `aec0d66`, into
verifying with a verdict stamped; T-089 `75a7cec` → `b416efb`), which is
why the table names tips: this board moves under a reader.

`task/T-061-boot-gate-cleanup` is kept as a branch and its worktree is
removed. **Scratch worktrees belonging to OTHER live sessions are
present under the shared scratch directory and were left untouched** —
`drill` at `a2173f8`, `VERIFbase` at `2036fb2`, and `mdrill` at
`b416efb`, which appeared BETWEEN this section being written and the
final process census twenty minutes later. That is the reason this list
is described rather than trusted as a count: at the end of this
checkpoint a `cargo test` writing into `scratchpad/mtarget` and a
`chrome-headless-shell` under `nputer-T-070/tools/e2e` were both live
and both belong to other sessions, not to this one. **Zero processes
from THIS integration survive**, verified by grepping the full `ps` for
this session's scratch prefix and its seven ports.

## Next up

1. **Triage the EIGHT suggestions — the whole queue, for the first time
   in weeks.** `T-061-s6` + `T-061-s8` are one item (the probe is
   unpinned AND over-claimed; a pin must assert the narrow property or
   it encodes the over-claim). `T-061-s5` + `T-061-s7` are one item
   (both are the drill's contract: CONVENTIONS does not name its four
   codes, and one of those codes is unreachable on the path that needs
   it most). `T-061-s3` is mostly discharged by T-089's lane and should
   be checked against it rather than re-argued.
2. **`T-061-s4` is the sharpest of the eight and is not T-061's bug.**
   A pre-existing Rust flake at 3-of-7 under load and 0-of-7 without it,
   in a body that is the RUST MIRROR of the mechanism this card shipped
   — a group reap polling for emptiness across a grace, failing with
   `groupEmpty=true` after 28 ms of 900 while a same-group descendant
   was alive. If the emptiness probe is what is wrong, it matters to
   `reapOrphanedGroup` too. Size it against the shared mechanism, not
   against either test.
3. **`T-061-s1` is a one-line hygiene fix with a real trap behind it**:
   the `T-046-s4` id was reused after promotion, so T-061's own preamble
   tells its executor to delete a live unrelated finding. Ids are not
   free after promotion.
4. **Four lanes are in flight and none has landed.** T-064 and T-070
   both carry verdicts and are the nearest merges; T-013 and T-089 are
   awaiting one. T-089 matters to everyone, because it is the card that
   fixes the range-rule paragraph's own false sentence.
5. **`T-083-s2` remains sharp** — the range rule is the most-consulted
   paragraph in CONVENTIONS and the least defended. **This checkpoint
   adds a fixture its set does not have**: a forbidden count that
   doubled from 60 to 130 in an afternoon purely from LEFT-hand
   endpoint drift, while the prescribed count sat at 18 through both.
   T-084 contributed the right-hand case; the pair is the whole lesson.
