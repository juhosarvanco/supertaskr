---
id: T-113
title: One refusal, one report — the exitNonZero tail stops repeating the denials the same loop has just announced
feature: F-03
milestone: 4
priority: 57
size: S
status: done
blocked_by: []
touches: [app-agent]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-113
verified_by:
review: self-verified
---

> **RESOLVED (architect, 2026-08-24).** The drafter's note that stood
> here asked the architect to amend `T-102`'s criterion 6 before either
> card dispatched. Ruled the same day, in the commit carrying this
> sentence: T-102's criteria 4–6 are amended to the post-T-113 tree,
> its drill list names the ring-note restoration instead of the
> narrowing revert, and T-102 carries `blocked_by: [T-113]` — see THE
> COLLISION below and the amendment note on T-102. Everything below was
> re-derived at `6b0cf47` (the seventh triage commit; its whole diff is
> `docs/tasks/`, so every source reading also holds at `d41456b`).

Absorbs (seventh triage, 2026-08-24): T-101-s1 — file removed in this
commit.

`T-081`'s criterion 4 reads **"THE SAME DENIAL SHALL NOT BE REPORTED
TWICE."** `T-101`'s criterion 7 makes it a rendering obligation as much
as a runner one. **The runner breaks it, and the narrowing that was
supposed to prevent it selects exactly the set that gets doubled.**

## The mechanism, read at `6b0cf47`

In `run_turn`'s `StreamLine::Result` arm in
`app/src-tauri/src/agent/runner.rs`, ONE partition drives TWO reports
over the SAME vector, about sixty lines apart:

    let unannounced: Vec<&ResultDenial> = denials.iter().filter(…).collect();
    for denial in &unannounced { emitter.denied(req.turn, …) }
    …
    let unreported = denial_names(unannounced.iter().copied());
    if !unreported.is_empty() { ring.push("permission_denials: …") }

Every entry of `unannounced` becomes a live `RunEvent::Denied` **and**
puts its `tool_name` into the stderr ring, which reaches the screen as
`TurnError::ExitNonZero`'s `stderr_tail` and is rendered verbatim by
`failureDetail` inside `FailureBlock`. T-081's own comment on the
`denial_names(unannounced…)` line reads *"a name already delivered as
its own event does not need repeating in the tail"* — right about the
intent, wrong about the set. The narrowing removes the tail note for the
ANNOUNCED denials, which are the ones that do not need it, and keeps it
for the UNANNOUNCED ones, which the loop three statements up has just
announced.

**It is live rather than latent because T-101 built the second surface.**
Before T-101 nothing rendered `GenesisTurn.denials` and the tail was the
only screen, so the redundancy cost nothing. Reproduced by T-101's
verifier against the real store and the real `genesis-turn` channel: one
`result`-only denial produces a live notice *[refused: Bash — the CLI
gave no reason]* and a failure block reading *permission_denials: Bash*,
**two occurrences of the tool name on one turn**.

## The fix is a deletion, and the render side has already declined

Drop the ring note for the `unannounced` set. The live `Denied` events
carry strictly more than the note does — each denial's own
`tool_use_id`, and the entries `denial_names` drops for having no name —
they are emitted from the same vector in the same iteration, and they
reach the same screen. The note is redundant BY CONSTRUCTION for exactly
the set it covers.

`[app-interview]` cannot fix it and `visibleDenials`' doc comment in
`app/src/genesis/interview-model.ts` already says so in the tree, naming
`T-101-s1` and routing the fix here: there is no typed key on the
`exitNonZero` path, matching the tail's text would put a copy of a
`runner.rs` `format!` string in the renderer (T-057), the tail is a
bounded RING so a prefix match un-suppresses at random, and guessing
from the empty `message` is the runner's partition re-implemented as a
proxy.

## THE COLLISION — T-102 pins what this card deletes

`T-102` (planned, `[app-agent]`, priority 58) carries this criterion
**verbatim**:

> - **THE NARROWING SHALL BE PINNED**: the tail names the UNANNOUNCED set
>   only, and the `denial_names(&denials)` revert SHALL be re-run and
>   shown RED. Assert the cumulative `ToolDenied` record separately — the
>   two are different questions and a body that conflates them pins
>   neither.

**That criterion pins the exact runner-side narrowing this card
deletes.** After this card lands there is no `denial_names(unannounced…)`
call to revert and no tail note to narrow, so T-102's criterion 6 is
unbuildable as written — its mutant has no producer. The two cannot both
be right.

**T-113 IS SEQUENCED FIRST.** Both cards hold `[app-agent]`, so they can
never run concurrently; the parallelism guardrail does the enforcing.
Whoever builds T-102 must find criterion 6 **already amended** — to pin
what survives, which is that a denial delivered as its own event is NOT
also in the tail — **or stop and open a room.** A T-102 executor who
reverts `denial_names(unannounced…)` to `denial_names(&denials)` to make
its mutant red is re-introducing the double report under a green suite.
The amendment is the architect's; this card does not edit T-102, and a
lane fenced `[app-agent]` that edited `docs/tasks/T-102-*.md` would be
widening its own fence from inside (executor.md).

**RULED (architect, 2026-08-24, on main — the commit carrying this
sentence).** Criterion 6 now pins exactly the surviving property this
section names — a denial delivered as its own live event is NOT also in
the tail — criteria 4–5 are re-targeted off the deleted note, and
`T-102` carries `blocked_by: [T-113]`, so the sequencing this section
could only argue is a parsed fact the board's waves enforce. The
superseded criterion text survives only inside T-102's amendment note,
the T-085 retraction shape.

What T-102 keeps is unaffected: its cumulative-`ToolDenied` half is a
different question and is asserted separately here too, and its
`Activity`-arm, join-order, mirrored-negatives and byte-bound criteria
touch none of this.

## Acceptance criteria

- **THE RUNNER SHALL REPORT AN UNANNOUNCED DENIAL EXACTLY ONCE**: the
  `permission_denials:` ring note for the `unannounced` set SHALL be
  deleted, and the comment that replaces it SHALL say why the live
  `Denied` events are strictly more than the note was.
- **THE CUMULATIVE RECORD SHALL BE UNTOUCHED AND SHALL BE ASSERTED
  SEPARATELY.** `denial_names(&denials)` feeding `permission_denials`
  for `TurnError::ToolDenied` is a different question from what the tail
  says; a body that conflates the two pins neither. The `ToolDenied`
  variant carries no `stderr_tail` field, which is why its record is not
  what this card is about.
- **A PIN SHALL DRIVE THE FULL SHAPE, NOT THE HALF THAT IS EASY**: a
  `result`-only denial (an entry with no `tool_use_id`, or one the
  in-band channel never announced) on a turn that exits NON-ZERO SHALL
  produce a live `Denied` event AND a `stderr_tail` that does not name
  it. Both halves in one body, because "the tail is empty" and "the
  event fired" are each satisfiable without the other.
- **AND THE PIN NEEDS ITS POSITIVE CONTROL** (CONVENTIONS: A NEGATIVE
  ASSERTION NEEDS A POSITIVE CONTROL). Asserting the tail does NOT name
  the tool is satisfied equally by a tail that names nothing at all, so
  the same body — or its sibling — SHALL show the tail carrying
  something else the runner does put there on that turn. A bare
  "expected absent, got absent" is not this property.
- IF a denial arrives on the in-band channel AND is repeated in the
  cumulative `result` array THEN it SHALL reach the screen once,
  unchanged from today: the partition still exists and still joins on
  `tool_use_id`, and this card narrows what the UNANNOUNCED branch does
  rather than removing the branch.
- IF the deleted note turns out to be the only surface for some denial
  shape THEN that shape SHALL be named in the code and filed, never
  covered by restoring the note — the entries `denial_names` drops for
  having no name are the case to check, and the live emit does not drop
  them.
- **THE FIX SHALL NOT REACH THE RENDER SIDE.** `app/src/genesis/**` is
  `app-interview` and outside this fence; `visibleDenials`' doc comment
  stays as the record of why. IF the comment's routing sentence goes
  stale because this card lands THEN say so and route the one-line
  correction rather than editing across the fence.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from
the `test result:` lines rather than eyeballed). **POISON DRILL on every
new or changed assertion, one side only**, producer mutated and never
the assertion: re-add the ring note for the `unannounced` set and
require the new body RED; delete the live emit loop and require it RED
from the other direction. Each mutated text read back with `git diff`
before its run; restores per-path, proved by sha256 against the drill's
own commit; drill in a detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it (POISON DRILL arm (c)). Then the shape-six
check on each new body — does any other test already drive this exact
call. The BOOT GATE trigger fires on `app/src-tauri/**`: run the boot
check on a scratch port and record the exit and both `[nputer]` lines.
The DOCS GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none.

## Implementation notes (executor `claude-opus-5 @T-113`)

Branch `task/T-113-tail-dedup`, base `9b03ae6`, code tip `55f9b1b`. Every
figure below is re-derived at this lane's own refs; where the dispatch
brief and the repository disagreed, the repository is recorded.

### The change, and what it deliberately did NOT touch

**THREE paths, all Rust, all under `app/src-tauri/**`** — derived, not
listed: `TREE=$(git merge-tree --write-tree 9b03ae6 HEAD)` exits **0**
(read before the tree was used — a conflict report is not a tree), and
`git diff --name-only 9b03ae6 "$TREE"` returns `runner.rs`,
`bin/fake_agent.rs`, `tests/agent_runner.rs`.

In `run_turn`'s `StreamLine::Result` arm the `unreported` binding, its
`permission_denials: {}` `format!` and the two `ring.push` calls are
**deleted**, and a comment stands where they were. What survives
untouched, stated because a reader of the diff should not have to derive
it: the `unannounced` partition itself, the `emitter.denied(...)` loop
above it, and `denial_names(&denials)` feeding `permission_denials` for
`TurnError::ToolDenied` below it. This narrows what the UNANNOUNCED
branch DOES; it does not remove the branch.

`denial_names`' own doc comment said the names view is *"what
`TurnError::ToolDenied` carries, and what the diagnostic ring note
lists"*. The second half is now false, so it is corrected in place — same
file, in fence.

### Each acceptance criterion

1. **THE RUNNER SHALL REPORT AN UNANNOUNCED DENIAL EXACTLY ONCE** — met.
   The ring note is deleted. The replacing comment gives THREE reasons
   the live events are strictly more than the note was, and each is a
   property of the code rather than a claim about it: they are emitted
   FROM THE SAME VECTOR in the same iteration onto the same channel (so
   coverage is identical **by construction**, not by two lists agreeing);
   each carries its own `tool_use_id`, which a joined `format!` string
   could never spell; and each SURVIVES a missing `tool_name`, which
   `denial_names`' `filter_map` drops. It also records the asymmetry the
   other way — the note was the only one of the two that could be LOST,
   being bounded by `MAX_STDERR_RING` and riding `stderr_tail`, which
   exists only on `ExitNonZero`.

2. **THE CUMULATIVE RECORD SHALL BE UNTOUCHED AND ASSERTED SEPARATELY** —
   met, and measured rather than asserted. `denial_names(&denials)` is
   byte-unchanged. Its pin is
   `a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code`,
   which is NOT changed by this card, and drill **M3** proves the two
   questions are separable in both directions: narrowing the cumulative
   record to the unannounced set reds THAT body **alone** (74/75) while
   the new body stays green. Shape six answered: this card adds no second
   assertion of the cumulative record, because one already exists and a
   duplicate positive is `T-057-s1`'s defect.

3. **A PIN SHALL DRIVE THE FULL SHAPE** — met, both halves in ONE body,
   `a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`.
   **The two halves are demonstrably not each other restated, and the
   evidence is line numbers rather than a claim**: mutant M1 (the note
   re-added) reds it at `agent_runner.rs:1777`, the
   `!stderr_tail.contains("WebFetch")` assertion; mutant M2 (the emit loop
   made a no-op) reds it at `:1755`, the `denied_events` equality. Two
   mutants, two assertions, one body.

4. **AND THE PIN NEEDS ITS POSITIVE CONTROL** — met, and it is the reason
   this card adds a fixture instead of reusing one. `denied-then-end-turn`
   CANNOT carry this pin: it writes nothing to stderr and its `result`
   line is `is_error: false`, so once the note is gone its tail is
   **empty**, and "does not name the tool" is then satisfied equally by a
   dead ring, a dead stderr pump, or a turn that never reached
   `ExitNonZero`. The new `denied-result-only-nonzero` CLI writes a real
   sentence to stderr, which the runner's stderr pump puts in the same
   ring the deleted note used, so the tail is measured CARRYING something
   on the very turn the tool name is measured absent from. Drill **M4**
   shows the control is a live assertion and not decoration: deleting the
   fixture's `eprintln!` reds this body **alone**, at a THIRD line
   (`:1772`).

5. **A DENIAL ON BOTH CHANNELS STILL REACHES THE SCREEN ONCE, UNCHANGED**
   — met, by not touching it. The partition and its `tool_use_id` join are
   byte-unchanged; `one_denial_on_each_channel_is_reported_once_each` and
   `a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first` are
   unchanged bodies and stay green at every ref measured here.

6. **IF THE NOTE WAS THE ONLY SURFACE FOR SOME DENIAL SHAPE** — checked,
   and the answer is that the shape the criterion names is the shape the
   note **never** covered. `denial_names` is a `filter_map` over
   `tool_name`, so a `result` entry the CLI wrote without a name
   contributed NOTHING to the note; restoring the note would not have
   covered it. The live emit does not drop it. That is now driven rather
   than argued: the new fixture's SECOND entry has no `tool_name`, and the
   body asserts it arrives as its own event with `tool_name: None`. **No
   existing body drove that shape** — `denied-partial-fields` puts its
   nameless denial on the IN-BAND channel over an EMPTY
   `permission_denials`, so it never reaches this partition.

7. **THE FIX SHALL NOT REACH THE RENDER SIDE** — met. `app/src/genesis/**`
   is a 0-file diff. The comment's routing sentence DID go stale, in two
   independent ways, and is routed as **`T-113-s1`** rather than edited:
   it says the `exitNonZero` path *"double-reports today"* (false as of
   this card) and routes the fix to *"`T-101-s1`"* (a file the seventh
   triage `6f2f8ea` removed when it promoted the finding into this card).
   This is T-101's own discriminating rule applied — widen when the fence
   makes THIS CARD'S criterion unbuildable, route when it makes a
   NEIGHBOURING defect unfixable — and this is the second branch.

### Three existing assertions RE-TARGETED, not deleted

T-069 put the tool name in the tail because nothing rendered a denial
then, and three bodies assert it. Deleting those assertions would have
dropped T-069's user-facing property (*the user is told WHICH tool*)
rather than moving it, so each is re-pointed at the surviving surface:

| body | was | now |
|---|---|---|
| `a_result_only_denial_with_no_in_band_line_is_still_reported` | `stderr_tail.contains("WebFetch")` | `!stderr_tail.contains(…)`; the live event was already asserted above it |
| `a_denial_the_planner_routed_around_is_not_blamed_for_an_unrelated_exit` | `stderr_tail.contains("WebFetch")` | the `Denied` event names `WebFetch`, AND the tail does not repeat it |
| `a_fatal_denial_the_cli_did_not_flag_as_an_error_still_names_the_tool` | `stderr_tail.contains("Bash")` | the `Denied` event names `Bash`, AND the tail does not repeat it |

**The two `denied-then-end-turn` bodies say IN THE SOURCE that they are
the weak half** — with the note gone their tail is empty, so their
negative has no control — and each names the body that does have one.
That is written down rather than left for a verifier to find, because an
uncontrolled negative that nobody flags is exactly `T-060-s2`.

### Verification, every exit read UNPIPED off `$?`

`${PIPESTATUS[0]}` is empty in zsh; `timeout` is absent from this shell.

- `npm ci` then `npm run build` from lib/parser: **0**, **0**.
- `npm install` from app/: **0**. `npm ci` from tools/e2e: **0**.
- `cargo test --no-fail-fast` from app/src-tauri (BARE, the CONVENTIONS
  command): exit **0**, **383 passed / 0 failed / 3 ignored**, summed
  programmatically over **fifteen** `test result:` lines rather than
  eyeballed. The brief's reference figure was 382/0/3 over fifteen lines
  at `9b03ae6`; **383 = 382 + 1**, this card's single new body, and the
  file count is unmoved because it adds no test FILE.
- `cargo run -p nputer-index -- index --check --root ../..` (the `--root`
  load-bearing): exit **0**, *graph.json is CURRENT … 648862 bytes, 126
  files, 1126 symbols, 1712 edges* — identical to the brief's base
  figures, which a 0-file indexed diff requires.
- Exactly **THREE** `#[ignore]` attributes tree-wide, line-anchored
  (`^[[:space:]]*#\[ignore`): `crates/nputer-index/tests/perf.rs`,
  `crates/nputer-index/tests/self_graph.rs`, `tests/agent_runner.rs` —
  the env-gated real-CLI smoke, left ignored. Cited by FILE and symbol
  rather than by line: STATE's line numbers for these had already drifted.

### Standing gates, DERIVED from this lane's own three paths

| gate | trigger | on these 3 |
|---|---|---|
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **3 — FIRES** |
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **0 on the code diff; FIRES on the notes commit** |

- **BOOT GATE fires on all three and THE EXECUTOR RAN IT** (CONVENTIONS'
  own assignment). `NPUTER_BOOT_PORT=14940 npm run boot:check` from
  tools/e2e: exit **0**, both lines verbatim — *[nputer] project folder:
  /Users/ujju/Projects/nputer-T-113* and *[nputer] window "main"
  created*. Port 14940 was `lsof`-probed FIRST (zero rows — the
  authority) and bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and
  `::` second, in that order and never the reverse (STATE's measured
  rule), and released after.
- **GRAPH REGEN is NOT OWED, and the reason is THE FOUR WALKS rather than
  the gate's own answer**: the indexer deliberately does not collect Rust
  (`Lang::Rust` maps to no extension), so a Rust-only diff cannot move the
  graph. Asked anyway rather than predicted — `index --check` exit **0**.
- **DOCS GATE** — see below; it fires on this notes commit, not on the
  code one, so it is derived twice rather than once.

### The poison drill — arm (c), FOUR mutants, one side only

Detached scratch worktree at **`55f9b1b`** with its own
`CARGO_TARGET_DIR` INSIDE it (2.0 GB, so the parent's cache was
provably not shared — arm (c) exists because the compile-time
`CARGO_MANIFEST_DIR` pollution runs BOTH ways and a mutant can look dead
against a stale binary). Every mutation was applied by a driver that
**REFUSES a non-absolute path and refuses any match count that is not
exactly 1**, so a command that does not name the drill cannot run at all
(T-085's `perl -i` accident made mechanical), and **every mutated text
was read back with `git diff --unified=0` BEFORE its suite ran** (T-078:
the count can be right while the text is wrong). Producer side only,
never an assertion. Baseline **75 passed / 0 failed / 1 ignored, exit 0**.

| # | mutant (producer only) | exit | result | reds |
|---|---|---|---|---|
| M1 | the `permission_denials:` ring note RE-ADDED verbatim | 101 | 71/75 | the four re-targeted tail bodies; new body at `:1777` |
| M2 | the live emit loop made a no-op (`.take(0)`) | 101 | 69/75 | those four **+** the two T-081 join bodies; new body at `:1755` |
| M3 | cumulative record narrowed to the unannounced set | 101 | 74/75 | `a_turn_killed_by_a_denied_tool_…` **ALONE** — new body GREEN |
| M4 | the fixture's `eprintln!` deleted (the control's producer) | 101 | 74/75 | the new body **ALONE**, at `:1772` |

**M1 and M2 are the two directions the card names and they are not one
mutant twice**: M2 reds strictly more than M1 (the two T-081 join bodies
depend on the emit loop and not on the note), and inside the ONE new body
they red at DIFFERENT assertions. **M3 and M4 are this lane's own
additions** and each reds exactly one body, which is what makes criteria
2 and 4 measurements instead of prose.

**Restoration proved THREE ways after every mutant and again at the end**:
an empty `git status` over the whole drill worktree, a per-path sha256
against `git show 55f9b1b:<path>` for all three touched files (`runner.rs`
`43b3d72b…`, `fake_agent.rs` `9b531bbf…`, `agent_runner.rs` `1e3e8062…`),
and a clean re-run at **75/75 exit 0**, identical to the baseline. The
worktree was `git worktree remove`d and pruned; `git worktree list`
afterwards holds only main and the three live lanes.

**SHAPE SIX asked of the one new body and answered in its own doc
comment**: no other test drives this call. The two `denied-then-end-turn`
bodies have no positive control; `one_denial_on_each_channel_is_reported_once_each`
exits ZERO on purpose so it has no `stderr_tail` at all;
`a_denial_missing_its_fields_…` puts its nameless denial on the in-band
channel over an empty `permission_denials`.

### Prohibitions, all observed

- **Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
  nothing else**, before and after: holder `node` pid **82549**, one
  socket `TCP [::1]:1420 (LISTEN)`, identical at 13:11:21 and 13:22:04 —
  the same pid the brief read at 12:43:50. Never bind-probed. IPv6
  loopback only, so an IPv4-only probe would have lied.
- **The shared capture fixture is byte-identical**, checked before and
  after: `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
  sha256 `273a3d33…`, empty `git diff`.
- No `pkill`. No real CLI spawn and no model call — the
  `real_cli_arms_forbidden()` guard is automatic under cargo test and the
  one env-gated smoke stays `#[ignore]`d. Headless throughout; the boot
  check opens and closes its own window, which is ruled NOT screen
  control. The other lanes' worktrees, the two `fake_agent` orphans and
  the untracked `z` in the main checkout were not touched. Only scratch
  port 14940 of the 14940–14943 range was used.

### Where the dispatch brief was WRONG, or where the repository is

1. **The brief's slug map is NARROWER THAN THE FENCE'S PRACTICE, and the
   brief itself concedes it in passing.** `docs/architecture/components/
   C-14-agent-runner.md` declares `paths:` as exactly
   `app/src-tauri/src/agent/**` and `app/src/lib/agent-store.ts` — which
   contains NEITHER `app/src-tauri/tests/agent_runner.rs` NOR
   `app/src-tauri/src/bin/fake_agent.rs`, the runner's own test harness
   and its fixture CLI. The brief writes "your fix is a DELETION in
   `runner.rs` **plus tests**" without saying which paths those are. The
   repository settles it: T-081, `touches: [app-agent]`, merged at
   `55257a6` with both of those files in its own diff, and T-069 before
   it. **The declared `paths:` are the component's SOURCE, and the fence
   has always covered the tests that drive it** — but that is precedent
   rather than a written rule, and `T-089-s7`'s row-5 finding (the slug
   map is `docs/ARCHITECTURE.md` plus each component's `touch_slugs:`,
   named nowhere) is the same gap seen from the other side.
2. **`docs/STATE.md`'s `T-101-s4` section is STALE about
   `method/roles/executor.md`.** It says that file *"is 19 lines and
   contains neither 'fence' nor 'widen'"*. At `9b03ae6` it is 125 lines
   and contains BOTH, including the sentence T-101's rebuild was accused
   of inventing: *"A criterion that cannot be built inside the fence is
   NOT built. Record it, route it as a suggestion naming the fence it
   needs, and build the rest. Widening the fence from inside the lane is
   the one repair this role may never make."* It is in the brief-contract
   section, verbatim. The finding was TRUE at T-101's ref and the file has
   since grown that section; the ruling it produced is unaffected, but
   STATE now reads as a live accusation about a quotation the tree
   contains. Recorded, not fixed — `docs/STATE.md` is outside this fence.
3. Everything else in the brief re-derived exactly: base `9b03ae6`, the
   three disjoint fences, the 1126/1712 graph, the three `#[ignore]`
   attributes, pid 82549 on `[::1]:1420`, and 382 → 383 on the one body
   added.

### Filed and let go

- **`T-113-s1`** — `visibleDenials`' doc comment describes this defect as
  live and routes it to a removed file. The criterion's own instruction.
- **`T-113-s2`** — the shared-scratch drill collision, **and it is
  explicitly NOT an independent finding**. `T-088-s3` landed on main in
  `9f12769` (merged `bd5864b`) WHILE this lane was running and is the
  same defect, measured between T-088 and T-090; it is the primary and
  this file says so in its own first paragraph and asks triage to FOLD
  rather than park both. What this seat adds is two details: it is
  **three** lanes of three, not two — this lane held
  `<scratchpad>/drill` from 13:07 to 13:11, before either of them — and
  the PREFIX defect `T-088-s3` names (each driver's path guard asks "is
  this A drill" rather than "is this MY drill") is true of THIS lane's
  independently-written driver as well, which is worth owning rather
  than only citing. Three sessions wrote the same guard and all three
  got it wrong the same way, which is the argument that the convention
  is under-specified rather than the sessions careless. `T-090`'s fence
  already contains `docs/CONVENTIONS.md`, so absorbing it needs no
  widening.

**`status:` is left at `building` deliberately.** The card is size S, so
this executor is also its own integrator, but the dispatch TURN-GATES
integration: the merge, the gates at the merge, the checkpoint and the
`done` stamp are Phase 2 and happen only on an explicit instruction.
`method/roles/executor.md` step 6 says "set `status: verifying` (or done,
for size S)" on the same breath as committing; that is the one place this
lane's instructions and the role file differ, and the gate is recorded
here rather than resolved, because stamping `done` on an unmerged branch
would make `git worktree list` and the board disagree in exactly the
direction `T-110` exists to detect.
