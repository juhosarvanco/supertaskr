---
id: T-070
title: Arriving at a genesis reads what is on disk — bounded, and without a CLI
feature: F-03
milestone: 3
priority: 13
size: M
status: verifying
blocked_by: []
touches: [app-agent, app-interview]
builder:
verifier:
built_by: claude-opus-5 @T-070
verified_by:
review:
---

Absorbs: T-029-s2, T-029-s3 (fourth triage, 2026-08-19). The suggestion
files are removed in the same commit as this card. Both are the same
seam — what the app reads out of `.nputer/` when the interview screen
mounts — and T-029 is what made that seam reachable in production for
the first time.

THE BOUND IS AT THE WRONG END. `sessions::append_transcript` caps ONE
LINE at `TRANSCRIPT_TEXT_CAP` (256 KiB) and appends forever; nothing
rotates, truncates, compacts or deletes. Until T-029 nothing ever read
the file back in production — it was a write-only cache whose only
reader was a test. Now `genesis_transcript` reads the WHOLE file on
every arrival at the interview screen, `fs::read_to_string`s it, parses
every line, and throws all but the last `MAX_REHYDRATED_LINES` (200)
away. The cap protects the webview; nothing protects the read. Three
honest mitigations hold and none is a fix: the file is losable by
charter so deleting it is always safe, the per-line cap bounds any
single turn, and 200 lines is a generous conversation. Every failure
mode here is a slow read, never a wrong answer — which is why this is
sized beside its sibling rather than alone.

AND THE ONE SCREEN THAT COULD SAY SO NEEDS A CLI TO BE REACHED.
`genesis_start`, `genesis_resume` and `genesis_fresh` all resolve a CLI
before they answer anything else, so a user with a saved session and no
CLI on their path gets `cliNotFound` and is never told a session was
recorded at all. The information exists and costs nothing:
`sessions::genesis_record` reads `.nputer/sessions.json` with no CLI
anywhere in the call. The hand-driven mode they are routed to is correct
and complete, and it says nothing about the turns they already banked
with a CLI they have since uninstalled or renamed. **This is the same
delivery-not-detection shape T-029's whole spine is about, one layer
out.** Ordering note for the executor: `genesis_kickoff` deliberately
does NOT resolve a CLI — that is what makes it the universal fallback —
so the record read is free there.

## Acceptance criteria
- THE transcript read SHALL be bounded AT THE READ, not only at the
  webview: read the tail (seek from the end, or a line budget while
  reading) so a file measured in tens of MiB costs a bounded read rather
  than a whole-file parse. `TRANSCRIPT_TEXT_CAP`'s per-line cap stays.
  IF a file cap with rotate-aside is chosen instead THEN it SHALL follow
  the `sessions.json.corrupt` precedent already in this module, and the
  losable-by-charter property SHALL be preserved either way.
- A pin SHALL prove the read is bounded by CONSTRUCTION and not by the
  fixture: a transcript whose line count and byte size both exceed the
  rehydration budget by a wide margin SHALL be shown to cost a read
  proportional to the budget, not to the file.
- `KickoffOutcome::Ready` SHALL carry the `GenesisRecord` when one
  exists, so the universal fallback answers the question the CLI-gated
  commands cannot.
- THE hand-driven block SHALL say what was banked — the turn count and
  where the artifacts are — in one sentence. No new command, no CLI on
  the path, no new IPC surface.
- A pin SHALL drive the CLI-LESS path end to end and assert the banked
  count reaches the DOM, so "the record exists" and "the record is
  delivered" cannot be confused for one another. WHAT the hand-driven
  card says is a copy judgment; THAT it says something is this card's
  criterion.

Verification: headless. Rust unit and integration tests for the bounded
read and the record carry; one app-side DOM test for the CLI-less
arrival. No real CLI, no model.

FENCE NOTE: the Rust half is `agent/mod.rs` and `agent/sessions.rs`; the
TypeScript half is one block in `InterviewChat.tsx`. **This card cannot
run beside T-069** — both hold `app-agent`.

## Implementation notes

Built by `claude-opus-5 @T-070` on `task/T-070-arrival-reads-disk`, cut
from `2036fb2` (main's tip and a `Checkpoint:` commit at dispatch; main
advanced to `36b7365` while this lane ran and the forecast below is
measured against that tip, not against the cut).

### What changed, and where the bound now sits

**FOUR PRODUCTION FILES, TWO TEST FILES, THREE FINDINGS.**

1. `app/src-tauri/src/agent/sessions.rs` gains `tail_lines` (private,
   generic over `Read + Seek`) and `read_transcript_tail(project_dir,
   max_lines)`. `tail_lines` seeks to the end, walks backwards in
   `TAIL_CHUNK` (64 KiB) steps, and stops the moment the buffer holds
   ONE MORE newline than the budget; it drops the first segment unless
   the walk reached byte 0, because a backward step lands mid-line far
   more often than not. `TRANSCRIPT_TEXT_CAP` is untouched and nothing
   rotates, truncates or deletes — the losable-by-charter property is
   exactly as it was.
2. `app/src-tauri/src/agent/mod.rs`'s `transcript()` calls the tail
   reader with `MAX_REHYDRATED_LINES` and drops the post-hoc `drain`.
   The webview's second bound (`MAX_EVENT_TEXT` per line) stays.
3. The same file's `KickoffOutcome::Ready` gains
   `record: Option<sessions::GenesisRecord>`, filled by
   `sessions::genesis_record(&project_dir)` — the ONE place the fact
   lives (T-026-s3 held; no second copy is assembled).
4. `app/src/lib/agent-store.ts` mirrors it as `GenesisRecordPayload` and
   `record?: GenesisRecordPayload | null` on the ready variant, and
   `app/src/genesis/InterviewChat.tsx`'s `HandDrivenBlock` renders
   `bankedSentence(...)` — the turn count and `docs/` under the project
   dir — behind a `data-testid=interview-hand-driven-banked` span, with
   the count also on the block as `data-banked-turns`.

**NO NEW COMMAND, NO CLI ON THE PATH, NO NEW IPC SURFACE.** The IPC
census is unmoved at 13 both ends and `crescendo-dom.test.tsx`'s two
pins say so on every app run: the frontend's ten commands and Rust's
thirteen `generate_handler!` entries are byte-identical to `2036fb2`.
`git diff` over `app/src-tauri/src/lib.rs` is **zero lines** — the
command bodies did not need to change, because the payload widened
underneath them.

**WHY `genesis_kickoff` AND NOT A FIFTH COMMAND.** It is the one genesis
command that resolves no CLI, which is precisely what makes it the
universal fallback, and `sessions::genesis_record` reads
`.nputer/sessions.json` with no CLI anywhere in the call. The record
read adds no process, no path lookup and no second source of truth.

### THE BOUNDEDNESS PIN, AND THE MUTANT IT IS WRITTEN AGAINST

The card asks for boundedness **by construction, not by the fixture**,
and names the adversary: *an implementation that reads the whole file
but truncates after*. That implementation returns THE SAME TWO HUNDRED
LINES, so **no assertion about content can separate it from a tail
read**. Two pins do, and each kills a mutant the other does not.

**PIN ONE — `the_tail_read_costs_the_budget_and_not_the_file`**
(`agent/sessions.rs`). A **20,611,682-byte, 10,000-line** transcript,
read through a `Counting<R>` wrapper the TEST owns. The body asserts the
margin rather than assuming it: `LINES >= 40 * BUDGET` (it is 50x) and
`file_len >= 40 * tail_bytes` (it is 49.99x — 20,611,682 against
412,303), so the fixture cannot quietly shrink under a later edit and
leave the cost assertion trivially true. The measurement is an
observation at the `Read` impl, never a figure the reader reports about
itself, which is the same rule as CONVENTIONS' positive control one
level out. It asserts the right 200 lines AND that the cost is at most
`tail_bytes + 2 * TAIL_CHUNK` AND that `read * 20 <= file_len`.
Measured: **458,752 bytes read of 20,611,682**, ceiling 543,375.

**PIN TWO — `the_arrival_read_is_bounded_by_the_budget_and_not_by_the_file`**
(`tests/agent_runner.rs`), which pins the COMMAND rather than the
function, with no instrumentation at all. Its fixture opens with two
mebibytes of `0xFF` — bytes no UTF-8 decoder accepts — followed by 400
real half-turns. `fs::read_to_string` FAILS on them, so a whole-file
read answers nothing; the tail read never seeks that far back and
answers the last 200. The body carries its own positive control
(`sessions::read_transcript(...)` is asserted EMPTY on the same file),
because without it "the tail read got 200 lines" would be satisfied
equally by a small fixture and a whole-file reader.

**THE PAIR IS THE POINT.** A "read it all LOSSILY, then truncate"
implementation survives pin two and dies on pin one's byte count; a
`transcript()` that goes back to `sessions::read_transcript` survives
pin one (which drives `tail_lines` directly) and dies on pin two. Both
were planted and both behaved exactly that way — see M1 and M2 below.

### The poison drill — ELEVEN mutants, one-sided, at the handoff commit

Run in a **detached scratch worktree** `../nputer-T-070-drill` at
**`41b58d6`** — this branch's FIRST commit and an ANCESTOR of the
handoff tip, not a rewritten one — never in the lane and never with
`git checkout --` (T-072-s1).

**HOW MUCH OF THE DRILLED ARTIFACT IS THE HANDED-OFF ARTIFACT, STATED
RATHER THAN IMPLIED.** `git diff --name-only 41b58d6..<tip> --
app/src-tauri app/src app/test` returns **one** path,
`app/src-tauri/src/agent/sessions.rs`, and its diff is **5 lines of a
`///` doc comment above `TAIL_CHUNK`** (the bound-wording fix at
`4efa6cb`). So five of the six changed files are byte-identical to what
was drilled, and the sixth differs only in text no compiler or test
reads. Every suite was re-run at the tip afterwards regardless.
**Correspondence established by hash before anything was mutated**: all
six changed files sha256-matched `git show 41b58d6:<path>`, e.g.
`agent/sessions.rs` at
`e6038280e7e4da9d3a925edb1798cfb3774f56c50d56f714cf6924dfd4ae667b` and
`InterviewChat.tsx` at
`00835b32328484699343135807523955f0efde1aa1c5bee5af8fb8bb35b95014`.
Baselines in that worktree first: unit 10/10, `agent_runner` 74/1
ignored, DOM 21/21, all exit 0.

**Every mutation moved the PRODUCER and never an assertion. Every one
reported its substitution COUNT and had its mutated TEXT read back with
`git diff` before a suite ran. Every restore was a byte copy from
`git show 41b58d6:<path>`, proved by an empty per-path `git diff` and
by sha256.**

| # | producer mutated | substitutions | what redded |
|---|---|---|---|
| M1 | `tail_lines` → LOSSY whole-file slurp + truncate (**THE CARD'S MUTANT**) | 1 | unit exit **101**, 9/1 — only the byte pin: *read 20611682 bytes, ceiling 543375*. Content body GREEN, `agent_runner` **74/0 exit 0** |
| M2 | `transcript()` → `sessions::read_transcript` + post-hoc `drain` (the pre-T-070 code) | 1 | `agent_runner` exit **101**, 73/1 — *the budget, exactly: left 0, right 200*. Unit bodies GREEN 10/10 |
| M3 | `kickoff()` `record:` → `None` | 1 | `agent_runner` exit **101**, 73/1 at *the record rides Ready* |
| M4 | `MAX_REHYDRATED_LINES` 200 → 50 | 1 | `agent_runner` exit **101** at the LITERAL `turn 201` assertion — the two symbol-parametrised assertions beside it moved with the constant and stayed silent, which is T-063's lesson reproduced |
| M5 | `bankedSentence` count → hard-coded | 1 | DOM exit **1**, 2/21 — *expected … to contain 'banked 7 turns'* |
| M6 | `bankedSentence` drops the `docs/ under …` clause | 1 | DOM exit **1**, 2/21 — *to contain 'docs/'* |
| M7 | `data-banked-turns` → `String(record?.turns ?? 0)` | 1 | DOM exit **1**, 1/21 — *expected '0' to be 'none'* |
| M8 | the `?? null` guard defaulted to a zero record | 1 | DOM exit **1**, 1/21 — *expected `<span>` to be null* |
| M9 | `onHandDriven` also issues `rehydrateInterview()` | 1 | DOM exit **1**, 1/21 — *expected `[ 'genesis_transcript', …(1) ]` to deeply equal `[ 'genesis_kickoff' ]`* |
| M10 | `bankedSentence` split into two sentences | 1 | DOM exit **1**, 2/21 — *expected 2 to be 1* (the one-sentence criterion) |
| M11 | `tail_lines` off-by-one (`max_lines + 1`) | 1 | unit exit **101**, 8/2 — both tail bodies |

After the last restore the drill worktree's `git status --porcelain` was
**empty**, all six files sha256-matched again, and the three suites
returned to 10/10, 74/0/1 and 21/21 at exit 0. The worktree was removed.

**AND THE DRILL'S SECOND QUESTION WAS ASKED, AND CHANGED THE DIFF.** My
first draft also added `assert!(record.is_none(), …)` to the existing
`the_hand_driven_kickoff_materializes_a_real_kit_and_names_it`. It reds
under a poison — and it kills no mutant that
`the_hand_driven_kickoff_carries_what_was_banked` does not already kill,
because that body's FIRST step is the same "nothing has run here yet"
folder. That is **SHAPE SIX** exactly, so it was removed and the match
arm takes `..` with a comment saying why. M3 confirms it: the kit body
stayed green while the carry body redded.

**ONE TRIPWIRE WAS CONSIDERED AND REFUSED FOR THE SAME REASON.** A
source-grep body (`include_str!("mod.rs")`, assert the arrival path
names the tail reader) would kill only mutants M2 already kills. It was
dropped; `read_transcript`'s doc comment names the hazard and points at
M2's body by name instead. **A CITATION NAMES A SYMBOL**, so the comment
cites `the_arrival_read_is_bounded_by_the_budget_and_not_by_the_file`
rather than a line.

### What the verifier should look at hardest

- **`read_transcript` (whole file) is still `pub` and still exists**,
  with no production caller. It is the tests' assertion channel — a body
  that wants "everything that was ever appended" wants exactly that, and
  answering it with a budgeted reader would be a test parametrised by
  the bound it checks. Its doc comment says all of this out loud. If you
  think it should go, the counter-argument is in that comment.
- **The tail reader decodes LOSSILY.** A backward step can split a
  multi-byte character; the segment that split is the one dropped
  anyway. A strict decode would fail the whole read over a boundary the
  caller never asked about and would re-introduce the whole-file
  dependency. `the_arrival_read_is_bounded_by_the_budget_and_not_by_the_file`
  asserts no `U+FFFD` reaches the channel.
- **The budget's meaning moved**, from "parsed lines kept" to "raw lines
  read". Filed as **`T-070-s3`** with the one input on which the answer
  differs, and pinned in
  `the_tail_read_answers_what_the_whole_file_read_would_have_kept`
  rather than left to be discovered. I filed it against my own change
  because the card's sentence *"never a wrong answer"* deserves the
  correction.
- **`record` is OPTIONAL on the TS mirror (`record?:`).** Rust always
  sends the key; the optionality is for a mixed-version dev tree, and
  three pre-existing `genesis_kickoff` fixtures in
  `interview-resume-dom.test.tsx` were deliberately LEFT without it so
  the `undefined` arm is exercised by something.

### Findings filed

- **`T-070-s1`** — the card's premise is wider than the tree.
  `start_genesis` answers `ResumeAvailable { turns }` from the registry
  BEFORE resolving a CLI, and `resume_genesis` answers
  `NothingToResume`/`SessionIdRejected` the same way; only
  `fresh_genesis` matches the card's sentence. The live hole is ONE arm:
  a planner entry with no `native_session_id` falls through to
  `CliNotFound` carrying nothing. The arm is to widen
  `StartOutcome::CliNotFound`, which this card's fence and criteria did
  not carry.
- **`T-070-s2`** — the READ is bounded and the FILE is not.
  `append_transcript` still appends forever; the rotate-aside arm the
  card offered as an alternative was not taken. Size S.
- **`T-070-s3`** — the budget-meaning change above.

### Ranges, every dot count stated, at their own refs

Main was `2036fb2` at dispatch and **`09b83e87`** when this handoff was
measured; the forecast is against the TIP, because it is the RIGHT-HAND
endpoint that decides the left one.

    git merge-tree --write-tree 09b83e87 f018636   -> tree 8b01855c…, exit 0 (read from $?, not swallowed)
    git diff --name-only 09b83e87 <TREE>                        -> 10   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 09b83e87...f018636   (THREE dots)      -> 10   cmp against the forecast: exit 0
    git diff --name-only 2036fb2..f018636     (TWO, branch-only)-> 10
    git diff --name-only 09b83e87..f018636    (TWO dots)        -> 29   THE FORBIDDEN PRE-MERGE FORM

`git merge-base 09b83e87 f018636` is **`2036fb2`** — the cut point — so
three dots and branch-only collapse onto each other here, exactly as the
rule says they do before the merge. Main advanced **19** paths from the
cut, **all of them under `docs/`** and none of them code; 19 + 10 = 29,
which is the forbidden count, and that arithmetic is the check that the
two sets are disjoint.

**10 files, 944 insertions, 10 deletions.** Suffix census: 4 md, 3 rs,
2 tsx, 1 ts.

**THE FORECAST IS STATED AT `f018636` AND THE BRANCH TIP IS TWO COMMITS
LATER**, because the commit that carries this section cannot name its
own hash. Those two commits touch this card and one doc comment in
`app/src-tauri/src/agent/sessions.rs` — **both paths already in the
ten** — so the PATH LIST is invariant across them and every gate
derivation above holds at the tip unchanged (verified: `cmp` of the
sorted list at the tip against the sorted list at `f018636` exits 0).
Only the insertion count moves. **AND MAIN IS A MOVING TARGET WHILE A
LANE RUNS**: it went `2036fb2` → `36b7365` → `09b83e87` → `dc4199d`
during this build, all four docs-only, so the forbidden two-dot count
climbs (29 at `09b83e87`, 50 at `dc4199d`) while the prescribed ten does
not move at all. That is the range rule's own point, observed live:
**the count goes stale from the RIGHT-hand side, and naming the ref is
the whole defence.**

### The three standing gates, derived under BOTH ranges

| gate | prescribed (10) | forbidden two-dot (29) |
|---|---|---|
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **3 — FIRES** | 3 — fires |
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **5 — FIRES** | 5 — fires |
| DOCS GATE (a `docs/` path a code suite reads) | **4 — FIRES**, three suites | 23 — fires |

**NO GATE FLIPS ON THIS LANE**, and the reason is derivable rather than
lucky: main's whole advance is `docs/`, so the two code triggers see the
same paths under either range. This is T-081's shape rather than T-084's
— the complement of the merge that manufactured a boot check — and the
DOCS GATE is the only row where the wrong range would change the
PRESENTATION (23 against 4) without changing whether it fires.

- **GRAPH REGEN — OWED, RUN, AND A REAL RED.** `cargo run -p
  nputer-index -- index --check --root ../..` from `app/src-tauri` exits
  **1** with BOTH count lines and a `~` file diff, which is the
  discriminator for a real red (a `--root` false red prints
  `committed: MISSING`): *committed 585305 bytes · 119 files · 1018
  symbols · 1539 edges* against *fresh 586657 · 119 · 1020 · 1543*,
  `files +0 -0 ~3` naming `InterviewChat.tsx`, `agent-store.ts` and
  `interview-resume-dom.test.tsx`, `edges +5 -1`. **`graph.json` is
  DELIBERATELY NOT REGENERATED HERE — the CHECKPOINT owes it**, per the
  gate's own bullet and because the checkpoint edits indexed fixtures.
  The three-fixture rule does NOT fire: `git diff 09b83e87 <TREE> --
  docs/architecture/components/` is a **0-file** diff, so the parser pin
  holds, and the two app dogfood bodies read the COMMITTED graph, which
  this branch does not move — both green inside the 843 below.
- **BOOT GATE — OWED AND RUN.** `NPUTER_BOOT_PORT=14831 npm run
  boot:check` from `tools/e2e`, exit **0**, both lines: `[nputer]
  project folder: /Users/ujju/Projects/nputer-T-070` and `[nputer]
  window "main" created`, then SIGTERM. Port **14831** was bind-probed
  free on all four stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before
  each of the two runs — an IPv4-only probe of a v6 listener reports
  free, which is why all four.
- **DOCS GATE — OWED AND RUN**, invoked DIRECTLY rather than through
  `xargs` (BSD `xargs` maps a utility exit of 1–125 to 123, so the
  four-code contract survives the pipe only by accident): `node
  tools/e2e/scripts/docs-gate.mjs $(cat <list>)`, exit **1**, owing
  **three** suites — `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — and NOT `cargo test from
  app/src-tauri/`, which is the proportionality the gate promises for a
  flat task card. It reports **11 derived docs readers across 4
  suites**, **0 frontmatter issues in the live tree**, and a census of
  *117 docs-shaped sites in 22 files, 11 of them in 9 files
  root-anchored*. All three owed suites were run AFTER the doc edits,
  and the cargo suite was run anyway because this lane is mostly Rust.

### Suites, every number derived at this ref, every exit read unpiped

No exit code below came through a pipe — `${PIPESTATUS[0]}` is empty in
zsh, so each command's own `$?` was echoed on the next statement.

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`; `npm run build` run FIRST in the fresh
  worktree, because the app build dies at TS2307 without
  `lib/parser/dist`.
- **app: 843/843 across 43 files**, `APP_TEST_EXIT=0` — **840 at
  `2036fb2`, plus this card's three DOM bodies**. `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, emitting
  `index-DdOM3cAL.js` **503.20 kB** and `index-CwYF5FQb.css` **43.95
  kB**; the CSS hash is unmoved and the JS hash is this card's doing.
- **bare Rust workspace, `cargo test --no-fail-fast`: 356 passed / 0
  failed / 3 ignored**, `CARGO_TEST_EXIT=0`, summed programmatically
  from **fifteen** `test result:` lines — **352 at `2036fb2`, plus this
  card's four bodies** (two unit in `agent/sessions.rs`, two integration
  in `tests/agent_runner.rs`). Not `--all-targets`, which skips
  doc-tests.
- **E2E: 121/121**, `E2E_EXIT=0`, on the lane's own default port 14520,
  bind-probed free on all four stacks first; `npm run typecheck`
  `E2E_TYPECHECK_EXIT=0`.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 123 files under app/src, app/test,
  tools/e2e; CONTROL 593 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples, 71 walk-policy checks, 8 evidence-floor checks.
  CONTROL is **590 + 3**, the three finding files; TOKEN is unmoved at
  123 because this card adds no `.ts/.tsx/.mjs` FILE. This is also the
  repo's only NUL-byte gate (P5, over raw bytes) and it is green; the
  ten paths were independently read as bytes and **0 carry a NUL**.
- **`cargo audit -n`** `CARGO_AUDIT_EXIT=0`: 472 locked crates, **0
  vulnerabilities / 17 allowed warnings**, unmoved — which a 0-file
  `Cargo.lock` diff requires.
- **`index --check`** exit **1**, the real red above.
- **`cargo fmt --check` is NOT run and is NOT a gate**: it exits 1 over
  **32 pre-existing files** on this tree with no `rustfmt.toml` anywhere
  (the tree is written wider than rustfmt's default), so it is red on
  main and says nothing about this diff. Recorded rather than silently
  skipped. New Rust here matches its neighbours' width.

### Security sweep, re-derived at this ref

- **NO manifest, lockfile, capability file, `tauri.conf.json` or
  `.entitlements` in the diff** — `git diff --name-only 09b83e87 <TREE>
  -- '*Cargo.toml' '*Cargo.lock' '*package.json' '*package-lock.json'
  '*tauri.conf.json' 'app/src-tauri/capabilities/*' '*.entitlements'` is
  **0 paths**. No dependency added; no new crate, no new npm package.
- **IPC IS THIRTEEN AT BOTH ENDS AND DID NOT MOVE**: 13 anchored
  `#[tauri::command]` attributes repo-wide, 13 `generate_handler!`
  entries with comments stripped. Both census traps reproduce — the
  unanchored literal `tauri::command` reads **14** repo-wide (the
  fourteenth is a doc comment), and a naive comma split of the handler
  block reads **15**, because two COMMENTS inside the macro contain
  commas. `app/src-tauri/src/lib.rs` is a **0-line** diff.
- `app/src-tauri/src/acl_pin.rs` is a **0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`;
  `EXPECTED_GRANTS` unmoved at 92 and `acl_pin` green inside the cargo
  run.
- `ENV_ALLOWLIST` in `agent/runner.rs`: **16 entries**, counted over the
  symbol-anchored body (declaration line 1000). The three-entry
  `ENV_ALLOWLIST_LINUX` is a SEPARATE symbol and is not in the count —
  a regex loose enough to match both reads 3, which is how that figure
  goes wrong. `runner.rs` is a 0-file diff here.
- **Exactly THREE `#[ignore]` attributes**, anchored on
  `^[[:space:]]*#\[ignore` with pathspec `'*.rs'` from the repo root:
  `crates/nputer-index/tests/perf.rs`, `crates/nputer-index/tests/self_graph.rs`,
  `tests/agent_runner.rs`. Unmoved.
- **No secret-shaped content**: all 944 added lines scanned for
  `sk-`/`AKIA`/PEM/bearer/`key|secret|password|token` assignment
  shapes — **0 hits**. **NO new process surface**: 0 added lines match
  `Command::new`, `execFileSync`, `execSync`, `spawn(` or
  `child_process`. The new code opens ONE file read-only
  (`fs::File::open` on the transcript) and adds no write path at all.

### The human's app, and what this lane left behind

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else**, before and after. No bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket, `TCP [::1]:1420
(LISTEN)`, identical at both ends — and the IPv4 side is free while the
app runs, which is the fact CONVENTIONS records so nobody probes it
again. **Their app process is unchanged**: pid **85379** (started Aug 20
00:20:43) under `82364` under `82342`. Nothing in `app/src/**` of the
MAIN checkout was touched — every edit is in `../nputer-T-070`, and the
boot check ran against the LANE's tree on port 14831. The two
`nputer-T-060` `fake_agent` orphans (**52504**/**52505**, ppid 1) are
unchanged and deliberately left alone (T-043-s1); **no `pkill` was used
at any point**. Process census at the end: zero `vitest`, zero
`playwright`/`chromium`, zero `cargo`/`rustc`, no `tauri dev` beyond the
human's own pair. The drill worktree is removed and
`git worktree list` shows the four live lanes and main. Every scratch
file this session wrote is prefixed `T070-`.

### The board at this handoff

**187 flat task files, 64 done / 19 planned / 19 parked / 84 suggested /
1 verifying**; 64 + 19 + 19 + 84 + 1 = 187. Ten files sit in
`docs/tasks/rejected/` and are counted separately. The deltas from main
are T-070 planned → verifying and the three new `T-070-s*` files.

## Verdicts
