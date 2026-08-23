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
built_by: claude-opus-5 @T-070, claude-opus-5 @T-070-fix
verified_by: claude-opus-5 @T-070-verify
review: same-model
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
mode OF THE CODE THIS CARD FOUND is a slow read, never a wrong answer —
which is why this is sized beside its sibling rather than alone.

**CORRECTED IN PLACE, 2026-08-23, BY THE SECOND EXECUTOR** (the first
filed the finding and left the sentence; the verdict caught that a
reader of the criteria alone still got the wrong promise). The sentence
above described the WHOLE-FILE reader and was true of it. **It is NOT
true of the bounded reader this card ships, and the difference is the
price of the fix**: a budget on LINES READ cannot reach further back to
replace an unparseable line, so a tail of garbage now rehydrates as
empty where the whole-file read would have kept the good lines behind
it (`T-070-s3`, pinned in
`the_tail_read_answers_what_the_whole_file_read_would_have_kept`), and a
walk stopped by its byte ceiling answers with fewer lines than the
budget rather than costing the file (pinned in
`the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file`).
Both are wrong ANSWERS in the sentence's own sense, both are on inputs
the module's own writer does not produce, and both are deliberate. The
criteria below are unchanged; only this paragraph's claim about the
outcome was.

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

### 2026-08-23 — THE REBUILD, by a second executor (`claude-opus-5 @T-070-fix`)

**Appended, not rewritten. Everything above this line is the first
executor's and stands as written**, including the eleven-mutant drill —
the verdict confirmed the carry, the DOM delivery pin, the shape-six
removal and `T-070-s1`'s arm trace, and none of them was touched. Cut
from **`f7da6a9`**, the verdict commit; the code commit is **`aec0d66`**.
**FOUR paths moved**: `app/src-tauri/src/agent/mod.rs`,
`app/src-tauri/src/agent/sessions.rs`, this card, and `T-070-s4`. No
production behaviour outside `tail_lines` changed, and no test the first
build wrote was deleted or weakened.

`built_by:` now names both passes, which is T-084's precedent for a card
rebuilt after a rejection.

#### BLOCKING 1 — what binds the ARRIVAL read now, and why it is a SOURCE pin

The verdict's diagnosis is exactly right and worth restating in one
sentence, because the remedy follows from it: **`Counting<R>` can only
observe bytes that pass through the `src` handed to `tail_lines`**, so a
whole-file read planted anywhere ABOVE that argument — in
`read_transcript_tail` (V1) or in `agent::transcript` (V3) — reaches the
disk without touching the instrument. That is not a fixture problem. No
fixture fixes it, because the instrument is not on the path.

**THE THREE OPTIONS WERE WEIGHED AND TWO WERE REFUSED.**

1. **A fixture hostile to a LOSSY whole-file read too — REFUSED, and the
   reason is structural rather than aesthetic.** The verdict's own
   suggestion carries its condition: *"an `fs` bytes-read observation at
   the command boundary IF ONE EXISTS HEADLESSLY"*. There is none. The
   command opens the file itself, so nothing can be injected; `std`
   exposes no per-process bytes-read counter; and `getrusage`'s
   `ru_inblock` counts BLOCK-DEVICE input, which is zero for a file the
   fixture just wrote and the page cache still holds — it would report
   the same number for both implementations and would be a fixture
   pretending to be an instrument. The only fixture a lossy whole-file
   read genuinely cannot survive is one too large to hold in memory, and
   a multi-gigabyte sparse file is hostile to the machine running the
   suite rather than to the mutant. **Refused on the merits, not skipped.**
2. **An injectable opener on `read_transcript_tail` — REFUSED, and it
   would not have worked.** It puts a test-only seam into a production
   signature, which is the shape ADR-011's neighbours avoid; and it
   closes V1 while leaving **V3 wide open**, because V3 lives one hop
   ABOVE the opener. Half a remedy for a whole defect.
3. **The source tripwire the first build refused — TAKEN.** The verdict
   falsified the stated reason for refusing it (*"would kill only mutants
   M2 already kills"* — M2's pin is GREEN on V3), and the drill below
   re-proves the point from the other side: V3 and V1 are killed by this
   body and by nothing else in the tree.

**`the_only_production_path_to_the_transcript_is_the_bounded_one`**
(`agent/mod.rs`, in the module the arrival read lives in) is **SIX ARMS
AND ONE CLAIM**: *from the IPC command down to the generic walk, each hop
reaches the next one and reaches the file NO OTHER WAY.*

| arm | what it derives | what it asserts |
|---|---|---|
| hop 0 | callee set of `fn genesis_transcript(`'s body in `lib.rs` | exactly `[agent::transcript]` |
| hop 1 | callee set of `pub fn transcript(`'s body, and the SECOND ARGUMENT of its `read_transcript_tail(` call | exactly five names; the budget is `MAX_REHYDRATED_LINES` and not a multiple of it |
| hop 2 | callee set of `pub fn read_transcript_tail(`'s body | exactly ten names, `tail_lines` and `fs::File::open` among them |
| hop 3 | `tail_lines`' generic signature, and the bodies of the three LEAVES the two hops call (`tail_lines`, `transcript_path`, `truncate_utf8`) | the signature is unmoved; no leaf names `fs::`, `File::` or `include_str` |
| no second reader | `read_transcript(` in the production halves of the three files | 1 in `sessions.rs` (its own declaration), 0 in `mod.rs` and `lib.rs` |
| containment | every `.rs` file under `src/`, production half, comments stripped | only `agent/sessions.rs` may NAME the transcript — and inside it the three spellings are counted at **4 / 2 / 1** |

**WHY AN ALLOWLIST OF CALLEES AND NOT A SEARCH FOR `fs::read`.** A
denylist is bypassed by a new helper with an innocent name; an allowlist
fails on a new callee of ANY name. V1's message is the demonstration —
it does not say "you used `fs::read`", it prints both sets and the
diff is `fs::read` in and `tail_lines` out. And the containment arm is
the same reasoning one level up: a reader cannot read the transcript
without first NAMING it, so the set of files allowed to name it is the
set of files that can possibly read it. **V8 and V9 are the two mutants
that exist only because of that arm**, and neither has any other body in
the tree that sees it.

**WHY THIS SURVIVES A REWRITE OF THE CALLER.** It names no line number,
no call order, no argument count, no body shape and no comment. Reorder
`transcript()`, rename its locals, split its loop, change its early
return, move it in the file — the callee SET is unchanged and the pin
stays green. What it will not tolerate is a new callee, which is
precisely the edit that opens a new path to the file. **IT FAILS
CLOSED**, and that is the trade, stated out loud: a legitimate refactor
that adds a call has to add one name to a list, and the assertion message
says so in as many words. For a twelve-line arrival path whose entire
defect history is "somebody read the whole file", that is the right
direction to fail in.

**WHAT THE COMPOSITION IS, since neither half is sufficient alone.**
`tail_lines` is generic over `R: Read + Seek` and is handed no path, so
**`src` is its only channel to any byte on disk** — that is a property of
the SIGNATURE, not of the body, which is why arm 3 pins the signature.
Given that, `the_tail_read_costs_the_budget_and_not_the_file`'s
`Counting` measurement is TOTAL for `tail_lines`. The tripwire supplies
the missing half: that the arrival read is `tail_lines` and nothing else.
Cost pin plus shape pin, and each kills what the other cannot — V2 is
killed only by the cost pin, V1/V3/V5/V8/V9 only by the shape pin.

#### BLOCKING 2 — the walk's second budgeted exit, in BYTES

`tail_byte_ceiling(max_lines) = max_lines * TRANSCRIPT_TEXT_CAP`
(saturating), and the walk's condition is now
`while pos > 0 && newlines <= max_lines && taken < ceiling`. The
function's doc comment no longer claims a property it lacks: *"Nothing
before that point is ever pulled through `src`, **and there is such a
point on EVERY input**"*.

**THE CONSTANT IS THE BUDGET TIMES THE MODULE'S OWN PER-LINE CAP**,
which is the largest tail the reader was ever asked for:
`append_transcript` caps one `text` at `TRANSCRIPT_TEXT_CAP`, so
`max_lines` of them is the answer's own worst case. **THE CEILING WINS
OVER THE LINE BUDGET**, and that is deliberate: on an input where it
bites, the walk answers with FEWER lines rather than costing the file.
That is reachable only on lines the module's own writer cannot produce
(JSON escaping can expand a capped `text` past its cap on the wire), and
it is the same trade `T-070-s3` already records — the budget is on what
is READ, never on what is found. The card body now says so too.

**`the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file`**
is the pin: a 5 MiB file with **no newline in it**, asserted newline-free
before it is written, read at **three budgets** through the same
`Counting` wrapper. Per budget it asserts the answer is EMPTY (there is
no complete line), the cost is at most `budget * CAP + TAIL_CHUNK`, and
the cost is at most half the file. Then across budgets it asserts the
costs STRICTLY INCREASE and that `cost(4) == 4 * cost(1)`. **Three
budgets rather than one is the whole design**: a hard-coded ceiling
satisfies every per-budget assertion and dies on the last two — V7 below
is that mutant, and it prints `costs [262144, 262144, 262144]`.

**MEASURED AT THE PRODUCTION BUDGET (200), release build, both walks
timed in one process on the same file:**

| newline-free file | BEFORE: read / time / lines | AFTER: read / time / lines |
|---|---|---|
| 20 MiB | 20,971,520 · 381 ms · 1 | 20,971,520 · **11 ms** · 0 |
| 60 MiB | 62,914,560 · 4,063 ms · 1 | **52,428,800** · **26 ms** · 0 |

**THE 20 MiB ROW IS THE VERDICT'S OWN INPUT AND IT IS STILL READ IN
FULL, said plainly rather than buried**: 20 MiB is UNDER
`200 × 256 KiB = 52,428,800`, so the ceiling does not bite there. What
changed on that row is that the cost is now bounded by a CONSTANT
instead of by the file — the 60 MiB row is the same walk stopping at
exactly the ceiling — and that the quadratic term which made 20 MiB cost
381 ms is gone. A file measured in tens of MiB now costs at most
50 MiB and 26 ms; a file measured in GiB costs the same.

#### `T-070-s4`, discharged in the same rewrite

The steps are pushed into a `Vec<Vec<u8>>` and joined once when the walk
stops, `pop`ped so the earliest bytes are copied first and each chunk is
freed as it goes. **BYTES READ DID NOT MOVE ON ANY ROW**, which is the
proof that the seek pattern, the `Read + Seek` seam and `TAIL_CHUNK` are
untouched and that the existing cost pin still measures what it measured:

| text per line | file bytes | bytes read | BEFORE | AFTER | `read_transcript` |
|---|---|---|---|---|---|
| 8 KiB | 3,295,784 | 1,703,936 | 3 ms | **2 ms** | 1 ms |
| 32 KiB | 13,126,184 | 6,619,136 | 25 ms | **5 ms** | 4 ms |
| 128 KiB | 52,447,784 | 26,279,936 | **544 ms** | **16 ms** | 20 ms |

The three read figures are **identical to the verifier's**, measured by a
different session on a different day; the file sizes differ by a few
thousand bytes because this fixture's line shape is slightly different.
At 128 KiB per line, arrival is now FASTER than the whole-file reader it
replaced (16 ms against 20 ms) — the sentence `T-070-s4` said the card's
stated purpose required. The finding keeps `status: suggested` and gains
a `closed_by:` line plus this measurement, per CONVENTIONS' fourth
question: disposition is triage's call, not an executor's.

**THE S4 FIX IS NOT POISON-DETECTABLE AND THAT IS SAID RATHER THAN
GLOSSED** (the POISON DRILL bullet's "if a body cannot be poisoned, say
so"). No assertion in this tree fails when the walk is quadratic — the
answer and the bytes read are identical either way, which is exactly why
the defect survived the first build's eleven mutants. Its evidence is
the measurement above, taken with the pre-fix loop transcribed beside
the shipped one in one process, with the two answers asserted
byte-identical before either time was printed. A timing assertion was
considered and refused: a wall-clock threshold in a unit suite is a
flake generator, and CONVENTIONS' headless-verification posture is
against it.

#### The card BODY, corrected in place

*"Every failure mode here is a slow read, never a wrong answer"* was true
of the whole-file reader it described and is false of the reader this
card ships. It is now qualified in place and followed by a dated
correction naming both wrong-answer modes and the pin for each. The
verdict is right that a reader of the criteria alone got the wrong
promise; the notes' promise to correct it was not the correction.

#### Left as the verdict left it

**The IPC shape is still unpinned across the boundary** — seven
`camelCase` fields asserted on each side against its own mock, agreeing
on inspection. The verdict recorded it as *not a finding*, and closing it
means a pin that serialises Rust's `KickoffOutcome` and feeds the bytes
to the TS parser, which is a new test seam rather than a trivial edit.
Left, deliberately, and named here so it is not mistaken for an
oversight.

#### The poison drill — NINE mutants, one-sided, at the code commit

Run in a **detached scratch worktree** `../nputer-T070-fixdrill` at
**`aec0d66`**, which IS this branch's code tip — never in the lane, never
`git checkout --` (T-072-s1). **Correspondence established by hash before
anything was mutated**: `agent/mod.rs`, `agent/sessions.rs`, `lib.rs` and
`docs_watch.rs` all sha256-matched `git show aec0d66:<path>`. Baseline
there first: `cargo test -p nputer --no-fail-fast` **199 passed / 0
failed / 1 ignored, exit 0** (124 unit + 74 `agent_runner` + 1 doc-test);
bare `cargo test --no-fail-fast` **358 / 0 / 3, exit 0**.

**Every mutation moved the PRODUCER and never an assertion; every one
reported its substitution COUNT; every one had its mutated TEXT read back
with `git diff` before a suite ran; every restore was a byte copy from
`git show aec0d66:<path>` proved by an empty per-path `git diff` AND by
sha256.** V1–V4 are the verdict's own four, transcribed rather than
invented.

| # | producer mutated | subs | result (`-p nputer`) | which body |
|---|---|---|---|---|
| **V1** | `read_transcript_tail` → `fs::read` + `from_utf8_lossy` + last-N, `tail_lines` BYPASSED | 1 | **198/1/1, exit 101** | tripwire hop 2, printing both callee sets |
| **V2** | inside `tail_lines`: `seek(Start(0))` + `read_to_end` through `src`, then truncate | 1 | **197/2/1, exit 101** | the COST pins — *read 20611682 bytes, ceiling 543375* and the new ceiling body |
| **V3** | `agent::transcript` reads the whole file ITSELF, lossily | 1 | **198/1/1, exit 101** | tripwire hop 1 |
| **V4** | `read_transcript_tail` → pre-T-070 semantics: `tail_lines(max*10)`, keep the last `max` PARSED | 1 | **197/2/1, exit 101** | `T-070-s3`'s pin — *three lines READ, two of them parseable, left 3 right 2* — and hop 2 |
| **V5** | **MY OWN DERIVED BYPASS**: `transcript_path`, an ALLOWLISTED LEAF, slurps the file with `fs::read_to_string` | 1 | **198/1/1, exit 101** | ONLY the leaf arm |
| **V6** | `tail_byte_ceiling` → `saturating_mul(usize::MAX)` | 1 | **198/1/1, exit 101** | the ceiling body — *budget 1 answered 1 lines* |
| **V7** | `tail_byte_ceiling` → a CONSTANT, not the budget's multiple | 1 | **196/3/1, exit 101** | the ceiling body's linearity — *costs [262144, 262144, 262144]* — plus both budget pins at *left 127, right 200* |
| **V8** | a second production reader in `docs_watch.rs` naming `sessions::transcript_path` | 1 | **198/1/1, exit 101** | the containment arm, by file name |
| **V9** | a second production reader INSIDE `agent/sessions.rs` (`pub fn read_transcript_bytes`) | 1 | **198/1/1, exit 101** | the name census — *'transcript_path(' … left 5, right 4* |

**V1 AND V3 WERE ALSO RUN UNDER THE FULL BARE SUITE**, because the
verdict's headline figure is a full-suite green: both go **357 passed / 1
failed / 3 ignored, exit 101**, against the 356/0/3 exit 0 the verdict
measured for the same two mutants. That is the finding closed, in the
same units it was written in.

**V5 IS THE ONE I DERIVED AGAINST MY OWN FIX, and it is the sharpest of
the nine.** Both callee sets stay byte-identical, the budget argument
does not move, `read_transcript` gains no caller, no file outside
`sessions.rs` names anything, and `Counting` never sees the read —
because the whole-file read is inside a leaf both hops are ALLOWED to
call. One arm in the tree fails on it. Without arm 3 the tripwire would
have been an allowlist with a hole under it.

After the last restore the drill worktree's `git status --porcelain` was
**empty**, all four files sha256-matched again, bare `cargo test` was
back to **358/0/3 exit 0**, and the worktree was removed.

#### The bypass I could NOT kill, and refuse rather than pretend

**A reader inside `agent/sessions.rs` that reconstructs the path from
fragments** — `project_dir.join(".nputer").join("genesis").join(...)` —
evades every name census above, because the census counts SPELLINGS and
that shape spells none of them. It is refused rather than chased:
defeating deliberate obfuscation with a source pin is an arms race a test
does not win, and each extra fragment pattern added to the census makes
the pin more brittle against honest edits without making it sound. What
the six arms defend against is the ORDINARY edit and the ACCIDENT — a
future task that reaches for `fs::read_to_string` because it is at hand
— and the nine mutants above are every non-obfuscated shape I could
construct. **The honest boundary of a source pin is stated here so the
next reader does not over-trust it.**

Two more, named for the same reason. **A whole-file read on a surface
that is not the arrival read at all** (a future command that legitimately
wants the entire transcript) is not this card's criterion and the pins
correctly say nothing about it; the containment arm will make it
visible by redding, which is the review the change should get.
**`T-070-s2` is still open**: the READ is bounded and the FILE is not.

#### Ranges, every dot count stated, at their own refs

Main at **`ea7ea0a`**, branch tip **`aec0d66`** for the code (the notes
commit is one later and cannot name its own hash),
`git merge-base ea7ea0a aec0d66` = **`2036fb2`**, the cut point, unmoved
across both executor passes.

    git merge-tree --write-tree ea7ea0a aec0d66  -> tree 13073a60…, exit 0 (read from $?)
    git diff --name-only ea7ea0a <TREE>                     -> 11   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only ea7ea0a...aec0d66  (THREE dots)    -> 11
    git diff --name-only 2036fb2..aec0d66   (TWO, branch-only) -> 11
    git diff --name-only ea7ea0a..aec0d66   (TWO dots)      -> 141  THE FORBIDDEN FORM

**ELEVEN, not the ten of both earlier measurements, and the eleventh is
`T-070-s4` — the finding the VERIFIER filed onto this branch.** Main
advanced **130** paths from the cut, **11 of them code** (all under
`tools/e2e`) and 119 under `docs/`; `comm -12` over the sorted lists is
**EMPTY**, and 130 + 11 = 141, which is exactly the forbidden count —
the arithmetic that proves the two sets are disjoint. **The notes commit
adds no path**: it touches this card AND `T-070-s4`, both already in the
eleven, so the PATH LIST is invariant across it and every gate
derivation below holds at the true tip unchanged. Only the insertion
count moves - **11 files, 2478 insertions, 14 deletions** at the notes
tip, against the verdict's 1143/10 over the same eleven.

**AND THE COUNT WENT STALE FROM THE RIGHT-HAND SIDE FOR THE THIRD TIME
ON THIS CARD.** The notes forecast 29 at `09b83e87`, the verdict measured
52 at `4d2f03c`, and it is 141 at `ea7ea0a` — while the prescribed number
moved once, and only because a file was ADDED to the branch. Same lesson,
third observation, one card.

#### The three standing gates, derived under BOTH ranges

| gate | prescribed (11) | forbidden two-dot (141) |
|---|---|---|
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **3 — FIRES** | 5 — fires |
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **5 — FIRES** | 6 — fires |
| DOCS GATE (a `docs/` path a code suite reads) | **5 — FIRES**, three suites | 124 — fires |

**NO GATE FLIPS**, and the reason is derivable: main's 11 code paths are
all `tools/e2e`, which matches BOOT GATE not at all and GRAPH REGEN only
through two `.spec.ts` files. This lane's own three GRAPH REGEN paths and
five BOOT GATE paths are unchanged from the first handoff — **the rebuild
adds no `.ts/.tsx` path and no `app/src/**` path at all**, so both code
triggers see exactly what they saw before.

- **GRAPH REGEN — OWED (3), RUN, AND A REAL RED**, unchanged from the
  first handoff and from the verdict. `cargo run -p nputer-index --
  index --check --root ../..` from `app/src-tauri` exits **1** with BOTH
  count lines (the discriminator for a real red; a `--root` false red
  prints `committed: MISSING`): *committed 585305 bytes · 119 files ·
  1018 symbols · 1539 edges* against *fresh 586657 · 119 · 1020 · 1543*,
  `files +0 -0 ~3` naming `InterviewChat.tsx`, `agent-store.ts` and
  `interview-resume-dom.test.tsx`, `edges +5 -1`. **Byte-for-byte the
  verdict's figures**, which is the check that this rebuild moved no
  indexed file: it is Rust and Markdown only. `graph.json` is
  DELIBERATELY NOT REGENERATED and none is committed — the CHECKPOINT
  owes it.
- **BOOT GATE — OWED (5) AND RUN.** `NPUTER_BOOT_PORT=14833 npm run
  boot:check` from `tools/e2e`, exit **0**, both lines: `[nputer] project
  folder: /Users/ujju/Projects/nputer-T-070` and `[nputer] window "main"
  created`, then SIGTERM. Port **14833** was bind-probed free on all four
  stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before the run — an
  IPv4-only probe of a v6 listener reports free, which is why all four.
- **DOCS GATE — OWED (5) AND RUN, invoked DIRECTLY** and never through
  `xargs` (BSD `xargs` maps a utility exit of 1–125 to 123): `node
  tools/e2e/scripts/docs-gate.mjs $(cat <list>)`, exit **1**, owing
  **three** suites — `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — and NOT `cargo test from
  app/src-tauri/`, the proportionality the gate promises for flat task
  cards. It reports **11 derived docs readers across 4 suites**, **0
  frontmatter issues in the live tree**, a census of *117 docs-shaped
  sites in 22 files, 11 of them in 9 files root-anchored*, and *every
  live task card's frontmatter parses, with a legal status* — which is
  this run's answer to `T-070-s4` gaining a `closed_by:` field. All three
  owed suites were run AFTER the doc edits.

#### Suites, every number derived at this ref, every exit read unpiped

No exit code below came through a pipe — `${PIPESTATUS[0]}` is empty in
zsh, so each command's own `$?` was echoed on the next statement.

- **parser**: `npm run build` **`PARSER_BUILD_EXIT=0`** FIRST (the app
  build dies at TS2307 without `lib/parser/dist`) · `npx tsc --noEmit`
  **`PARSER_TSC_EXIT=0`** · `npx vitest run` **263/263 across 12 files,
  `PARSER_EXIT=0`**, re-run after the doc edits because its smoke test
  parses this repository's live `docs/` tree.
- **app**: `npm run build` **`APP_BUILD_EXIT=0`**, **265 modules
  transformed**, emitting `index-DdOM3cAL.js` **503.20 kB** and
  `index-CwYF5FQb.css` **43.95 kB** — **both hashes identical to the
  first handoff's**, because this rebuild changes no `app/src` file ·
  `npm test` **843/843 across 43 files, `APP_TEST_EXIT=0`**, unmoved,
  which is the check that the DOM half was not disturbed.
- **bare Rust workspace, `cargo test --no-fail-fast`: 358 passed / 0
  failed / 3 ignored**, **`CARGO_TEST_EXIT=0`**, summed programmatically
  from **fifteen** `test result:` lines — **356 at the verdict, plus this
  rebuild's TWO bodies** (`the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file`
  and `the_only_production_path_to_the_transcript_is_the_bounded_one`).
  Not `--all-targets`, which skips doc-tests.
- **E2E: 121/121, `E2E_EXIT=0`**, one worker, zero retries, zero skips ·
  `npm run typecheck` **`E2E_TYPECHECK_EXIT=0`**.
  **THE PORT MOVED MID-SESSION AND THE GUARD IS WHY, recorded because it
  is a live worked example of the PORT RULE rather than a footnote.** The
  first runs used the lane's default 14520, read with `lsof` first and
  free. The last one exited **1** before a single test ran, with *lane
  port 14520 is not bindable on 127.0.0.1 (EADDRINUSE) - something else
  is listening* — and the something else was the **T-013 lane's own
  playwright run**, `node` pid 86233 on `127.0.0.1:14520`, a sibling
  worktree that had started while this one was writing notes. **The
  default port is shared between lanes and `reuseExistingServer: false`
  means the second lane REFUSES rather than borrowing**, which is the
  behaviour the rule wants and is indistinguishable from a real red only
  if you read the exit code instead of the message. Re-run on scratch
  port **14539**, bind-probed free on all four stacks first: 121/121,
  exit 0. Nothing was signalled and the sibling's run was not
  interrupted.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  *lint-tokens: clean (TOKEN 123 files under app/src, app/test,
  tools/e2e; CONTROL 594 tracked text files)*, selftest at 49 TOKEN + 4
  CONTROL samples, 71 walk-policy checks, 8 evidence-floor checks.
  **CONTROL is 593 + 1**, the verifier's `T-070-s4`; TOKEN is unmoved at
  123 because this rebuild adds no `.ts/.tsx/.mjs` FILE. This is also the
  repo's only NUL-byte gate (P5, over raw bytes) and it is green.
- **`cargo audit -n`** **`CARGO_AUDIT_EXIT=0`**: 472 locked crates, **0
  vulnerabilities / 17 allowed warnings**, unmoved — which a 0-file
  `Cargo.lock` diff requires.
- **`index --check`** exit **1**, the real red above.
- **`cargo fmt --check` is NOT a gate here and was not run**: it is red
  on main over pre-existing files with no `rustfmt.toml` in the tree, so
  it says nothing about this diff. Recorded rather than silently skipped.
  New Rust here matches its neighbours' width.

#### Security sweep, re-derived over the rebuild's own diff

- **NO manifest, lockfile, capability file, `tauri.conf.json` or
  `.entitlements`** in the four paths this rebuild moved, and no
  dependency added: no new crate, no new npm package.
- **NO NEW IPC SURFACE.** `app/src-tauri/src/lib.rs` is a **0-line diff**
  across the rebuild — the new pin READS it and does not touch it. IPC is
  **13 at both ends**, unmoved, and both census traps still reproduce.
- **NO NEW PROCESS SURFACE**: 0 added lines match `Command::new`,
  `execFileSync`, `execSync`, `spawn(` or `child_process`.
- **ONE NEW FILE-SYSTEM READ, IN TEST CODE ONLY, AND IT IS NAMED HERE
  RATHER THAN LEFT TO BE FOUND**: the containment arm walks
  `app/src-tauri/src/**` with `std::fs::read_dir`/`read_to_string`,
  rooted at `env!("CARGO_MANIFEST_DIR")` and not at the process's working
  directory. It lives inside `#[cfg(test)]`, reads only this crate's own
  sources, and writes nothing. The other five arms use `include_str!`,
  which binds their text to what was COMPILED; the walk cannot, because
  it is a claim about files nobody has written yet, and that difference
  is stated in its own doc comment.
- **`acl_pin.rs`, `runner.rs` and `ENV_ALLOWLIST` are 0-file diffs** in
  this rebuild; `EXPECTED_GRANTS` unmoved at 92; exactly **THREE**
  `#[ignore]` attributes, unmoved — **this rebuild deliberately adds no
  `#[ignore]`d benchmark**, which is why the s4 timings are a scratch
  probe restored afterwards rather than a fourth ignored body.
- **No secret-shaped content** in the added lines, and **0 NUL bytes** in
  the four paths (the token lint's P5 agrees).

#### The human's app, and what this lane left behind

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else**, before and after. No bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket, `TCP [::1]:1420
(LISTEN)`, identical at both ends. Their app process is unchanged: pid
**85379**. Every edit is in `../nputer-T-070`; the boot check ran against
THIS tree on port 14833, bind-probed on four stacks first. The two
`nputer-T-060` `fake_agent` orphans (**52504**/**52505**, ppid 1) were
left alone (T-043-s1); **no `pkill` was used at any point**. The drill
worktree `../nputer-T070-fixdrill` was created twice and removed twice,
and `git worktree list` is back to main plus the live lanes. **Every
scratch file this session wrote is prefixed `T070fix-`** — the scratch
directory is not private, and two other sessions' worktrees were visible
inside it and left untouched.

#### The board at this handoff

**188 flat task files, 64 done / 19 planned / 19 parked / 85 suggested /
1 verifying**; 64 + 19 + 19 + 85 + 1 = 188. Ten files sit in
`docs/tasks/rejected/` and are counted separately. The delta from the
first handoff is exactly `T-070-s4`, filed by the verifier. **No finding
was filed by this pass**: the two things it found in its own work
(the s4 fix's undetectability by poison, and the obfuscated-path limit of
a source pin) are properties of this change stated above, not work
somebody else should do.


## Verdicts

### 2026-08-23 — REJECTED (claude-opus-5 @T-070-verify, review: same-model)

**Two blocking findings, both against the BOUND, and the first of them
is that criterion 2's pin pair does not bind the arrival read at all.**
Two independent whole-file mutants — one in `read_transcript_tail`, one
in `agent::transcript` — survive the ENTIRE Rust suite at **356 passed /
0 failed / 3 ignored, exit 0**, byte-for-byte the unmutated figure. The
second is that `tail_lines` reads the WHOLE FILE by construction when
the file holds no newline, measured at **20,971,520 of 20,971,520 bytes
and 622 ms against the old reader's 3 ms** on the same input. Everything
else on this card is strong and I want that on the record before the
findings: the carry is a single call to the one reader, the DOM pin
genuinely proves delivery rather than existence, `T-070-s1` corrects the
card's own premise and is RIGHT on an independent arm trace, `T-070-s3`
indicts the executor's own change and its pin reds on the mutant it
claims, the shape-six removal costs no coverage, and every suite and
gate reproduces at my refs. This is a rejection about the READ and the
PIN, not a rebuild of the feature.

I read the card in a single pass, implementation notes included, so I
did not form my view of the criteria in ignorance of them. The mutants
below were derived from the criteria's own adversary class — *any*
implementation that costs the file — and deliberately NOT from the
executor's eleven-row matrix; the two that matter attack sites that
matrix never touches.

**Range derived, every dot count stated.** Main at `4d2f03c`, branch tip
`2143edc`, `git merge-base 4d2f03c 2143edc` = **`2036fb2`** (the cut
point, unmoved).

    git merge-tree --write-tree 4d2f03c 2143edc  -> tree d1da1ba6…, exit 0 (read from $?)
    git diff --name-only 4d2f03c <TREE>                    -> 10   PRESCRIBED
    git diff --name-only 4d2f03c...2143edc  (THREE dots)   -> 10
    git diff --name-only 2036fb2..2143edc   (TWO, branch-only) -> 10
    git diff --name-only 4d2f03c..2143edc   (TWO dots)     -> 52   THE FORBIDDEN FORM

**10 files, 1143 insertions, 10 deletions.** The notes forecast 944 at
`f018636` and said only the insertion count would move; it moved, the
path list did not. The forbidden count is now **52** rather than the
notes' 29 — main advanced `09b83e87` → `dc4199d` → `4d2f03c` while this
lane sat, all docs-only, which is the range rule's own point observed a
second time.

---

### BLOCKING 1 — criterion 2's pins bind `tail_lines` and the STRICT decode, and nothing binds the arrival read

The criterion: *"A pin SHALL prove the read is bounded by CONSTRUCTION
and not by the fixture."* The adversary class it names is any
implementation that costs the file. The pair as built covers exactly two
members of that class, and both are members the executor chose to plant.

Drilled in a **detached scratch worktree at `2143edc`** (T-072-s1), never
in the lane, restores by byte copy from `git show 2143edc:<path>` proved
by an empty per-path `git diff` and by sha256. Every mutation moved the
PRODUCER only, reported its substitution count, and had its mutated text
read back with `git diff` before a suite ran. Baselines there first: unit
**10/10 exit 0**, `agent_runner` **74/0/1 exit 0**.

| # | producer mutated | subs | result |
|---|---|---|---|
| **V1** | `read_transcript_tail` body → `fs::read` + `String::from_utf8_lossy` + last-N-lines. `tail_lines` BYPASSED. | 1 | unit **10/10 exit 0**, `agent_runner` **74/0/1 exit 0**, full `cargo test --no-fail-fast` **356/0/3 exit 0** — **SURVIVES EVERYTHING** |
| **V3** | `agent::transcript` reads the whole file ITSELF, lossily, touching neither `read_transcript_tail` nor `read_transcript` | 1 | full `cargo test --no-fail-fast` **356/0/3 exit 0** — **SURVIVES EVERYTHING** |
| V2 (control) | inside `tail_lines`: `seek(Start(0))` + `read_to_end` through the injected `src`, then truncate | 1 | unit exit **101**, 9/1 — *read 20611682 bytes, ceiling 543375*. `agent_runner` **74/0/1 exit 0** |
| V4 (s3 check) | `read_transcript_tail` → pre-T-070 semantics: `tail_lines(max*10)`, keep the last `max` PARSED | 1 | unit exit **101**, 9/1 — *three lines READ, two of them parseable, left: 3 right: 2* |

**What V2 proves is what the pin pair actually covers.** Pin one is a
real construction pin — a whole-file read that goes THROUGH the injected
reader dies on the byte count, exactly as claimed. But `tail_lines` is
private and `Counting<R>` can only see what passes through `src`. Pin one
therefore proves a helper is bounded; it says nothing about whether the
arrival read calls it. Pin two forbids exactly one thing: a whole-file
read that decodes STRICTLY. `String::from_utf8_lossy` walks straight
past its 2 MiB of `0xFF`, the last 200 lines are clean ASCII either way,
the positive control (`read_transcript` empty) stays true because
`read_to_string` is still strict — and every assertion in the body is
satisfied by a reader that touched all 2,533,676 bytes.

V1 and V3 are the same defect the card was written to close, reinstated
at two different sites, and the tree is green on both. A user's
tens-of-MiB transcript would be read in full on every arrival at the
interview screen, and no pin would say so.

**AND V3 FALSIFIES THE NOTES' OWN REASON FOR REFUSING THE TRIPWIRE.**
The notes drop a source-grep body (*"`include_str!("mod.rs")`, assert the
arrival path names the tail reader"*) on the ground that it *"would kill
only mutants M2 already kills."* V3 is precisely a mod.rs whose arrival
path does not name the tail reader, and M2's pin
(`the_arrival_read_is_bounded_by_the_budget_and_not_by_the_file`) is
**green** on it. The refused body would have killed a mutant nothing in
the tree kills. That is not a shape-six removal; it was the one pin that
composed pin one's measurement onto the path the criterion is about.

**REMEDY, and it is small.** Compose the two claims instead of hoping
they overlap: keep pin one's `Counting` measurement of `tail_lines`, and
add a body that pins the ARRIVAL PATH to it — either structurally (assert
`agent::transcript`'s body names `read_transcript_tail`, and
`read_transcript_tail`'s body names `tail_lines`, which is the refused
tripwire and is now argued FOR by V3), or by giving `read_transcript_tail`
an injectable opener so the command-level pin can carry the same counter.
Either one kills V1 and V3. Neither needs the fixture to grow.

---

### BLOCKING 2 — `tail_lines` reads the whole file when the file holds no newline, and is 200× slower than the reader it replaced there

Criterion 1: *"read the tail … so a file measured in tens of MiB costs a
bounded read rather than a whole-file parse."* `tail_lines`
(`app/src-tauri/src/agent/sessions.rs:392`) loops
`while pos > 0 && newlines <= max_lines`. The newline clause is the only
budgeted exit. **A file with no newline in it has no such exit**, and the
walk runs to byte 0.

The function's own doc comment states the property it does not have:
*"**Nothing before that point is ever pulled through `src`**"*. There is
no such point on this input.

Measured with the test's own `Counting` wrapper at the `Read` impl, in
the drill worktree at `2143edc`:

    PROBE no-newline: file_len=20971520 bytes_read=20971520 lines_out=1 elapsed_ms=622
    PROBE no-newline OLD whole-file path: lines_out=0 elapsed_ms=3

**The whole file, and 200× the time the whole-file reader it replaced
took on the same bytes.** `append_transcript` always writes the newline,
so this is not a shape production writes — but `transcript.jsonl` is
losable by charter and this card's own DOM body pins the ADR-009 posture
that it *"came off a file anything can write"*. The registry one module
over is gated at its read boundary (T-039) for exactly this reason; this
read is not.

**THE SECOND HALF OF THE SAME FUNCTION, AND IT NEEDS NO CORRUPTION AT
ALL.** Line 400 is `chunk.extend_from_slice(&buf); buf = chunk;` — every
backward step copies the entire accumulated buffer forward, so the walk
is O(steps²). On transcripts written by `append_transcript`'s own rules,
every line well under `TRANSCRIPT_TEXT_CAP`, release build:

| text per line | file bytes | bytes read | tail read | old whole-file read |
|---|---|---|---|---|
| 8 KiB | 3,299,276 | 1,703,936 | 1 ms | 1 ms |
| 32 KiB | 13,129,676 | 6,619,136 | 25 ms | 4 ms |
| 128 KiB | 52,451,276 | 26,279,936 | **459 ms** | **16 ms** |

4× the bytes, 18× the time. The READ is bounded on these three — 26 MB
of 52 MB, proportional to the budget — so this row is not a literal
criterion-1 failure, and I am not counting it as one; it is filed
separately as **`T-070-s4`** so it survives a rebuild that fixes only
the loop's exit condition. It is recorded here
because it is the same function, one rewrite fixes both, and because the
card's stated purpose is that *"a tens-of-MiB transcript cost a
tens-of-MiB read and parse on every arrival"* — at the per-line cap the
module itself permits (256 KiB, twice the largest row above), arrival is
now SLOWER than it was before this card. A rebuilt `tail_lines` should
append forward into one buffer and reverse at the end, or collect the
chunks and join once; and its loop needs a byte ceiling beside the
newline count so a newline-free file cannot run it to zero.

---

### What I attacked and could NOT break

**The s1 arm trace, re-derived independently in
`app/src-tauri/src/agent/mod.rs` before reading the finding.** The
executor is RIGHT and the card's motivating sentence overreaches.
`start_genesis` returns `ResumeAvailable { native_session_id, turns,
model }` at **:301**, out of the `sessions::load` / `find_planner` block
at :297–:298, and `resolve_cli` is not reached until **:337** — a user
with a usable saved session and no CLI gets the turn count today.
`SessionIdRejected` leaves the same block at :322. `resume_genesis` reads
`sessions::genesis_record` at **:425** and answers `NothingToResume`
(:426, :439) or `SessionIdRejected` (:429) before its `resolve_cli` at
**:443**. Only `fresh_genesis` (:505) resolves a CLI at **:518** with no
registry read in front of it, and the card is exactly right about that
one. **The live hole is the `Ok(None)` arm at :312** — a planner entry
with no recorded native id falls through to `CliNotFound { probed }` at
:339 carrying nothing. `T-070-s1` names that arm and also catches the
narrower `resume_genesis` case where the record is GOOD and the count is
dropped at :445. Not rejection-grade; the finding is more accurate than
the card it corrects.

**The carry, and the second copy that is not there.**
`sessions::genesis_record` has exactly two production call sites —
`resume_genesis` at mod.rs:425 (pre-existing) and `kickoff` at mod.rs:700
(this card) — and no assembly of the same fact from `SessionEntry`
anywhere in the new code. `KickoffOutcome` carries
`rename_all_fields = "camelCase"` and `GenesisRecord`
`rename_all = "camelCase"`, and all seven fields mirror
`GenesisRecordPayload` name-for-name; `Option` without
`skip_serializing_if` means Rust always sends the key, as the TS comment
claims. No pin crosses the IPC boundary to prove that shape — both sides
are asserted against their own mock — but the shapes agree on
inspection and the field the DOM reads (`turns`) is spelled identically
on both sides. Recorded, not a finding.

**The DOM pin proves DELIVERY, which is the card's own distinction.**
`render()` mounts the real `InterviewChat` through React's reconciler
into a real container; `click()` dispatches a real `MouseEvent` on the
real button; `issued()` reads the actual invoke log and is asserted equal
to `["genesis_kickoff"]`; the count is then read back out of the rendered
DOM by `data-testid` AND by `data-banked-turns`. That is the count
travelling payload → store → component → document, not the record
existing on an outcome. The negative mirror body and the ADR-009
escaping body are both present.

**`T-070-s3` is real, is pinned, and reds on the right mutant.** V4 above
restores the pre-T-070 "budget = parsed lines kept" meaning and
`the_tail_read_answers_what_the_whole_file_read_would_have_kept` reds at
exit 101 with *left: 3, right: 2*. The trade is stated in the card, in
the notes' "look at hardest" list, and in `read_transcript_tail`'s doc
comment. **One gap**: the card's BODY still reads *"Every failure mode
here is a slow read, never a wrong answer"*, uncorrected in place, and
the notes say that sentence *"deserves the correction"* without making
it. A reader of the criteria alone still gets the wrong promise.

**The shape-six removal left nothing uncovered.** The `..` in
`the_hand_driven_kickoff_materializes_a_real_kit_and_names_it` drops an
`assert!(record.is_none())` whose exact equivalent is the FIRST step of
`the_hand_driven_kickoff_carries_what_was_banked`, on the same
nothing-has-run-here folder. Removing it costs no mutant.

**IPC census re-derived, both traps reproduced.** 13 anchored
`#[tauri::command]` repo-wide (pathspec `'*.rs'`, `/target/` excluded); 13
`generate_handler!` entries at `lib.rs:488–502`. The unanchored literal
reads **14** — the fourteenth is `app/src-tauri/src/agent/mod.rs:24`, a
`//!` doc comment. A naive comma split of the handler block reads **15**:
the two-line comment at `lib.rs:493–494` carries two commas.
`git diff` over `app/src-tauri/src/lib.rs` is **0 lines**.

**Security sweep, re-derived.** 0 paths in the diff match
`'*Cargo.toml' '*Cargo.lock' '*package.json' '*package-lock.json'
'*tauri.conf.json' 'app/src-tauri/capabilities/*' '*.entitlements'` — no
dependency added. `acl_pin.rs` is a 0-file diff. Exactly **3**
`#[ignore]` attributes, anchored on `^[[:space:]]*#\[ignore`, unmoved.
`cargo audit -n` exit **0**, 0 vulnerabilities / 17 allowed warnings. The
1,143 added lines carry **0** real secret shapes and **0** new process
surface — the three regex hits are the notes' OWN prose describing the
scan, which is worth naming only because the notes claim 0 over the same
corpus. The new code opens one file read-only and writes nothing. **0**
of the ten paths carry a NUL byte (scanned as raw bytes with `perl`, not
`grep`), and the token lint's P5 agrees.

---

### Suites and gates, re-derived at `2143edc`, every exit read unpiped

- **parser** (build first): `npm run build` **0** · `npx vitest run`
  **263/263 across 12 files, exit 0** · `npx tsc --noEmit` **0**.
- **app**: `npm run build` **0**, `index-DdOM3cAL.js` 503.20 kB and
  `index-CwYF5FQb.css` 43.95 kB — both hashes equal to the notes' ·
  `npm test` **843/843 across 43 files, exit 0**.
- **cargo, bare `cargo test --no-fail-fast`**: **356 passed / 0 failed /
  3 ignored**, exit **0**, summed programmatically from **15**
  `test result:` lines.
- **E2E**: `npm test` **121/121, exit 0** on the lane's default 14520 ·
  `npm run typecheck` **0**.
- **token lint**: `--selftest` **0** (49 TOKEN + 4 CONTROL samples, 71
  walk-policy, 8 evidence-floor) · lint **0** — *TOKEN 123 files;
  CONTROL 593 tracked text files*.
- **GRAPH REGEN — owed (3 paths), run, REAL RED.** `cargo run -p
  nputer-index -- index --check --root ../..` exit **1** with BOTH count
  lines: *committed 585305 bytes · 119 files · 1018 symbols · 1539 edges*
  against *fresh 586657 · 119 · 1020 · 1543*, `files +0 -0 ~3` naming
  `InterviewChat.tsx`, `agent-store.ts`, `interview-resume-dom.test.tsx`,
  `edges +5 -1`. Not the `--root` false red (which prints
  `committed: MISSING`). No `graph.json` is committed on this branch and
  none should be — the checkpoint owes it.
- **BOOT GATE — owed (5 paths), run.** `NPUTER_BOOT_PORT=14877 npm run
  boot:check` from tools/e2e, exit **0**, both lines: `[nputer] project
  folder: /Users/ujju/Projects/nputer-T-070` and `[nputer] window "main"
  created`, then SIGTERM.
- **DOCS GATE — owed (4 paths), run DIRECTLY** (never through `xargs`):
  `node tools/e2e/scripts/docs-gate.mjs <the four>` exit **1**, owing
  **npm test from app/**, **npm test from tools/e2e/** and **npx vitest
  run from lib/parser/** and NOT cargo; 11 derived readers across 4
  suites, 0 frontmatter issues. All three were run.
- **`cargo fmt --check` is not a gate here** and was not run — it is red
  on main over pre-existing files with no `rustfmt.toml` in the tree.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else**, before and after: holder `node` pid **82549**, one
socket, `TCP [::1]:1420 (LISTEN)`, identical at both ends. The human's
app pid **85379** (ppid 82364, started Aug 20 00:20:43) is unchanged. The
T-060 `fake_agent` orphans **52504**/**52505** (ppid 1) were left alone;
no `pkill` was used. Scratch ports 14520/14831/14877 were read with the
same stack-agnostic `lsof` form before use, and the boot check
bind-probed 14877 itself. The drill worktree
`../nputer-T-070-vdrill` was removed and `git worktree list` is back to
main plus the live lanes.


---

### 2026-08-23 — APPROVED (claude-opus-5 @T-070-verify, review: same-model)

**The rebuild closes both blocking findings of my first verdict, and I
re-ran every one of my own break-mutants at the new tip rather than trust
the notes.** V1 and V3 — the two whole-file reads that survived the entire
suite last time — now RED and fail closed; the byte ceiling caps the read
at a file-size-independent constant; `T-070-s4`'s O(steps²) is gone. Two
residuals remain and neither is a correctness hole: the tripwire's doc
comment OVERSTATES its refactor-tolerance (a benign loop-split reds it,
failing closed), and the fragment-reconstruction bypass it cannot kill is
disclosed honestly rather than papered over. I APPROVE, with those two as
named non-blocking findings and one provenance nit.

**Range re-derived at the CURRENT main, every dot count stated.** Main
moved to `ea7ea0a` while the fix ran; my verdict commit `f7da6a9` is
intact and the fix (`aec0d66` code, `fc5f5c9` notes) sits on top.

    git merge-tree --write-tree ea7ea0a fc5f5c9  -> tree f659dfce…, exit 0
    git diff --name-only ea7ea0a <TREE>                    -> 11   PRESCRIBED
    git diff --name-only ea7ea0a...fc5f5c9  (THREE dots)   -> 11
    git diff --name-only 2036fb2..fc5f5c9   (branch-only)  -> 11
    git diff --name-only ea7ea0a..fc5f5c9   (TWO dots)     -> 141  THE FORBIDDEN FORM

`merge-base ea7ea0a fc5f5c9` = `2036fb2`, unmoved across both executor
passes. 11 paths = the original 10 + `T-070-s4` (my first verdict's
filing). The forbidden two-dot climbed 52 → 141 as main advanced, all
outside these eleven — the range rule observed a third time.

---

### The drill — nine of my own mutants, detached worktree at `fc5f5c9`, SCRATCH `CARGO_TARGET_DIR`

Per T-013-s7 the target dir was a scratch path outside every lane, never
the shared one. Restores by byte copy from `git show fc5f5c9:<path>`,
proved by empty per-path `git diff` and sha256 (`sessions.rs`
`e490ded8…`, `mod.rs` `f9b82155…` at start and end). Baseline there:
bare `cargo test --no-fail-fast` **358/0/3 exit 0**.

| # | mutant | result |
|---|---|---|
| **V1** | `read_transcript_tail` → `fs::read` + lossy last-N, `tail_lines` bypassed (my verdict-1 survivor) | full suite **357/1/3 exit 101** — HOP 2 callee set: *read_transcript_tail gained or lost a callee* |
| **V3** | `transcript()` reads the whole file itself, lossily (my verdict-1 survivor) | **357/1/3 exit 101** — HOP 1: *agent::transcript gained or lost a callee* |
| **V5** | whole-file `fs::read` inside `transcript_path`, an allowlisted leaf (the executor's own sharpest) | **exit 101** — arm 3: *an arrival-path leaf names 'fs::'* |
| new-A | ordinary new whole-file reader in `sessions.rs` naming `transcript_path` | **exit 101** — census: *transcript_path( a different number of times, expected 4* |
| new-B | new reader in `mod.rs` naming `sessions::transcript_path` | **exit 101** — containment: *agent/mod.rs names the transcript file in production* |
| M-ceil | drop the `taken < ceiling` walk exit (my verdict-1 BLOCKING 2) | **exit 101** — *the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file* |
| rewrite | benign push-loop refactor of `transcript()` (reorder + rename + split) | **exit 101 — FALSE RED**, see finding 1 |
| shadow-dead | fragment-reconstruction reader added to `sessions.rs`, not wired | **GREEN** — census blind, see finding 2 |
| shadow-live | that reader wired through `transcript_path` so the arrival read slurps the file | full suite **358/0/3 exit 0 — LIVE BYPASS**, see finding 2 |

**V1 and V3 are dead.** The first verdict's BLOCKING 1 — *"the pin pair
binds `tail_lines`, not the arrival read"* — is answered. The six-arm
`the_only_production_path_to_the_transcript_is_the_bounded_one` binds the
callee set of each hop from `genesis_transcript` down, so a whole-file
read at ANY hop (V1, V3), in a leaf that spells `fs::` (V5), or a NEW
ordinary reader in either file (new-A, new-B) all red BY NAME. It fails
closed on every non-obfuscated shape I could build — the composition my
first verdict said the refused source-grep tripwire would have provided,
and the executor's V5/arm-3 reasoning is sound; I reproduced it.

---

### BLOCKING 2 of my first verdict — CLOSED, and I re-measured the constant myself

`tail_lines` now has a second exit, `taken < tail_byte_ceiling(max_lines)`
where the ceiling is `max_lines × TRANSCRIPT_TEXT_CAP`. Measured through
the test's own `Counting` reader, budget 200 (ceiling **52,428,800**):

    file 10 MiB  -> read 10,485,760   (whole; below ceiling)
    file 20 MiB  -> read 20,971,520   (whole; STILL, as the executor states plainly)
    file 55 MiB  -> read 52,428,800   (CAPPED)
    file 60 MiB  -> read 52,428,800   (CAPPED)
    file 80 MiB  -> read 52,428,800   (CAPPED)

The cost is a constant independent of file size, and the pin is
non-vacuous (M-ceil reds it). **RULING on the coordinator's question — is
a 52 MB constant acceptable?** Yes. The constant is not arbitrary: it is
`MAX_REHYDRATED_LINES × TRANSCRIPT_TEXT_CAP`, the largest tail a 200-line
budget of max-width lines could legitimately be, so on a healthy 256 KiB-
per-line transcript the reader genuinely IS asked for ~52 MB and reading
it is correct, not wasteful. A tighter ceiling would assume lines are
smaller than the module's own cap — bounding by the fixture, the very
failure the card names. The one sub-case where it reads a whole sub-52 MB
file is a transcript with NO newline in it, which `append_transcript`
cannot produce; that case is now pinned directly by
`the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file`.
Criterion 1 — *"a file measured in tens of MiB costs a bounded read
rather than a whole-file parse"* — is satisfied for the realistic case,
the pathological case capped at a principled constant.

**`T-070-s4` (O(steps²)) is discharged.** The prepend became a
`Vec<Vec<u8>>` + `pop`-and-join-once. Re-measured, release build, 400
half-turns, budget 200:

    per_line   8 KiB  ->  now  2 ms   (bytes read 1,703,936, unchanged)
    per_line  32 KiB  ->  25 ms -> 5 ms   (6,619,136)
    per_line 128 KiB  -> 459 ms -> 13 ms  (26,279,936)
    per_line 256 KiB  -> ceiling bites: read 52,428,800, 199 lines, 26 ms

459 ms → 13 ms at the row that was the finding, bytes-read unchanged on
every row. My first verdict's 20 MiB newline-free case went 622 ms → 18 ms
for the same reason: still read whole (under the ceiling), but linear.

---

### FINDING 1 (non-blocking) — the tripwire's doc OVERSTATES its refactor-tolerance; a benign loop-split reds it

The pin's own comment promises: *"Reorder the arrival path, rename its
locals, split its loop — as long as it still reaches the file only
through the bounded reader, its callee set is unchanged and this stays
green."* The middle clause is false. I rewrote `transcript()` into an
accumulate-with-`push` loop — reaching the file only through
`read_transcript_tail`, no new file access whatsoever — and the hop-1
exact-set assertion RED at `mod.rs:1118`, because `push` is a new callee.
An idiomatic `.iter().map(…).collect()` reds the same way (`iter`, `map`,
`collect`). "Split its loop … callee set is unchanged" does not hold.

**Why this is NOT rejection-grade** — and I am ruling against the
coordinator's suggested "plausible refactor false-red = reject" bar
deliberately, because my job is the card's criteria, not the coordinator's
attack agenda. The false red fails CLOSED: the developer gets a red with
the exact right instruction — *"if it is not [a new way to reach the
file], add it here deliberately"* — and adds `push` to the allowlist. The
correctness property (no file-reaching callee passes unseen) is intact.
This is the SAME hand-maintained exact-set pattern the codebase already
blesses in `EXPECTED_GRANTS` (acl_pin.rs) and the 13-command IPC census:
those red on ANY set change, benign or not, treated as the review a human
should get. Criterion 2 asks the pin to prove boundedness by construction;
it does, if conservatively.

**What IS wrong is the prose**, and it should be corrected in place before
merge: the comment conflates "reaches the file only through the bounded
reader" (the safety invariant) with "callee set is unchanged" (the
green-ness condition), which are not the same set. Recommend rewording to
state the actual contract — *any* change to a hop's callee set reds and is
re-blessed by hand, like `EXPECTED_GRANTS`. One comment, no code, no
rebuild. Noted here rather than as a separate task because it is a
correction to the delivered artifact's own description.

---

### FINDING 2 (non-blocking, and I concur with the executor) — the fragment-reconstruction bypass is real, live, and honestly bounded

I built the class the executor disclosed and refused: a reader in
`sessions.rs` that assembles the path from split fragments (`"genesis"`,
`"transcript" + "." + "jsonl"`, joined) — spelling none of the three
censused forms — reads the whole file, and is wired onto the arrival path
through the `transcript_path` leaf. The FULL SUITE stays **358/0/3 exit
0**. A genuine live bypass no pin catches.

I RULE it honestly bounded, not a hole to reject on. (1) It is disclosed
in as many words — *"The bypass I could NOT kill, and refuse rather than
pretend … The honest boundary of a source pin is stated here so the next
reader does not over-trust it."* That is the "say so" side of the
coordinator's own dichotomy. (2) The threat model is correct: the T-070
defect was an ACCIDENT (a whole-file read nobody flagged), and the pin
catches every accidental/ordinary shape (V1/V3/V5/new-A/new-B); reaching
this bypass takes deliberate fragment-splitting AND wiring through a leaf
that has no business reading a file — not an accident. (3) It matches the
codebase's precedent for disclosed residuals (`T-080-s4`, *"ONE HOLE
REMAINS, NAMED RATHER THAN PAPERED OVER"*). No pin fails OPEN on any
benign input; the only fail-open is under deliberate obfuscation, which a
source pin cannot close without an arms race that embrittles it against
honest edits. Refusing it is the right call.

---

### FINDING 3 (minor, provenance) — `T-070-s4`'s `closed_by` cites a commit not on the branch

`T-070-s4`'s header reads `closed_by: 1e0b940 (task/T-070-arrival-reads-disk,
…)` and its measurement section says the drill ran "at `1e0b940`". But
`git merge-base --is-ancestor 1e0b940 fc5f5c9` is FALSE — `1e0b940` is a
rewritten predecessor of the delivered code commit `aec0d66` (identical
subject line), not on the branch. The work is real and delivered in
`aec0d66`, and I reproduced its measurements independently, so this is a
documentation nit — the same class the executor itself corrected once at
`2143edc`. Recommend repointing `closed_by` to `aec0d66`. Not blocking.

---

### What carried over from verdict 1, re-confirmed

The fix touched only `agent/mod.rs` and `agent/sessions.rs` among code
files (`git diff f7da6a9 fc5f5c9 --stat`), so the carry and the DOM pin —
validated in verdict 1 — are byte-unchanged: `agent_runner.rs`,
`InterviewChat.tsx`, `agent-store.ts` and `interview-resume-dom.test.tsx`
carry no fix diff. `sessions::genesis_record` still has exactly two
production callers, no second copy. The card BODY's *"never a wrong
answer"* sentence — my verdict-1 open item — is now CORRECTED IN PLACE
(lines 38–55), naming both the `T-070-s3` garbage-tail-empty and the
byte-ceiling fewer-lines behaviours as the deliberate wrong-answers on
writer-impossible inputs, each pinned. IPC census unmoved at 13/13,
`lib.rs` untouched by the fix.

---

### Suites and gates, re-derived at `fc5f5c9`, every exit read unpiped

- **parser**: `npm run build` **0** · `npx vitest run` **263/263 exit 0** · tsc **0**.
- **app**: `npm run build` **0** — `index-DdOM3cAL.js` 503.20 kB (hash unmoved from verdict 1; the fix is Rust-only) and `index-CwYF5FQb.css` 43.95 kB · `npm test` **843/843 across 43 files, exit 0**.
- **cargo, bare `cargo test --no-fail-fast`**: first run **357/1/3 exit 101** — the sole failure `a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail` (agent_runner.rs:1321), the T-061-s4 kill-path flake: **0 lines in the T-070 diff**, **3/3 green re-run in isolation**. Clean re-run **358/0/3 exit 0** (352 at `2036fb2` + four original bodies + two rebuild bodies). Honest tally, not chased.
- **E2E**: `npm test` **121/121 exit 0** (14520 free at run) · typecheck **0**.
- **token lint**: selftest **0** · lint **0** — TOKEN **123**, CONTROL **594** (593 + `T-070-s4`).
- **GRAPH REGEN** — `index --check --root ../..` exit **1**, REAL red: *committed 585305·119·1018·1539* vs *fresh 586657·119·1020·1543*, `files +0 -0 ~3`, `edges +5 -1`. The checkpoint owes it; no `graph.json` committed on the branch.
- **BOOT GATE** — `NPUTER_BOOT_PORT=14883 npm run boot:check` exit **0**, both `[nputer]` lines then SIGTERM; 14883 probed free first.
- **DOCS GATE** — invoked directly on the five T-070 docs, exit **1**, owes app + tools/e2e + parser and NOT cargo; 11 readers / 4 suites, 0 frontmatter issues. All owed suites run above.

**1420 read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else** —
`node` pid **82549**, one socket `[::1]:1420 (LISTEN)`, unchanged. The
human's app respawned under its OWN harness during the interval (pid
**85379 → 93036**, both ppid **82364**, the new one started Aug 23
20:32); this lane never touched it — every boot check ran on a
probed-free scratch port (14883 this pass). The T-060 orphans were left
alone; no `pkill`. The drill worktree used a scratch `CARGO_TARGET_DIR`,
was restored to an empty `git status` with both files sha256-matched, and
was removed — `git worktree list` shows no `vdrill`.
