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
(`agent/sessions.rs`). A 20,611,682-byte, 10,000-line transcript — 50x
the budget in lines, 50x the tail's own byte length in bytes — read
through a `Counting<R>` wrapper the TEST owns. The measurement is an
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
`41b58d6` (the lane's own commit, since amended into the handoff tip),
never in the lane and never with `git checkout --` (T-072-s1).
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

### Gates, suites and figures

See the section below, all measured at the handoff commit.

## Verdicts
