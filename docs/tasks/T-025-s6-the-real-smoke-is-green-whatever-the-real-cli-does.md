---
id: T-025-s6
title: The real smoke is green whatever the real CLI does — it asserts nothing, so the one authorized real run's verdict lives in stdout and no exit code carries it
feature: F-03
milestone: 3
priority: 2
size: S
status: done
suggested_by: executor claude-opus-5@subagent @T-025-s5
blocked_by: []
touches: [app-agent]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

**FOUND WHILE FIXING THE DEADLINE (T-025-s5), NOT FIXED THERE.** It is
inside that lane's fence and outside its class: T-025-s5 was ruled to
change the smoke's DEADLINE and nothing else, and widening a lane to
add assertions to the body it was sent to time is how a fence stops
meaning anything.

`real_cli_smoke_records_the_stream_schema`
(`app/src-tauri/tests/agent_runner.rs`) contains no assertion of any
kind. It starts a genesis, waits for a terminal event, and `println!`s
four things: the start outcome, the terminal event, the settled status
and the session registry. Every path through it that does not panic
exits 0 — including:

- a `Failed { AuthFailed }` terminal event 400 ms in, which is what this
  machine produced for the whole of 2026-08-16 → 2026-08-29 and what
  T-025-s2 was parked on;
- a `Failed { StartTimeout }` or `Failed { Stall }` from the runner's
  own bounds;
- `StartOutcome` never reaching `Started` at all — a `cliNotFound`
  prints as a start outcome and the body waits out its whole deadline,
  then panics for the only reason it CAN panic, which reports as a
  timeout rather than as the resolution failure it is.

So the body's name is a promise its code does not keep: it records the
stream schema when there IS one, and is equally green when there is
none. **This is the same class as the defect T-025-s5 fixed** — that
card's own words for the 20 s panic were *"the failure path passing a
test it was never given"* — one layer up: here the whole body passes on
every path, healthy or not.

**WHY IT MATTERS RIGHT NOW.** @human's standing authorization (rulings
sitting, 2026-08-30) buys exactly ONE closing real run, taken by the
integration seat, and T-025-s2 closes on what that run prints. The
verdict is therefore read off `--nocapture` stdout by a human, and
nothing in the tree distinguishes "a real planner turn ran to a terminal
`Completed`" from "the CLI refused at auth in under a second" except
that human reading carefully. A run that costs a ruling to authorize
should not report itself only in prose.

**THE TENSION THIS CARD DOES NOT RESOLVE, and it is why this is a
suggestion rather than a fix.** The body is deliberately a RECORDER: its
docstring says it exists "to record the real stream's line shapes as the
fake fixtures' provenance", and a recorder that reds on an unexpected
real-CLI behaviour destroys the recording it was run for. Assertions and
recording pull opposite ways here, and which wins is a ruling, not a
preference. Two shapes to choose between:

1. **Assert the PREMISE, never the content.** Red only when the body did
   not observe a real turn at all: `StartOutcome::Started`, a native
   session id in the settled status, at least one text delta, and a
   terminal event that is `Completed`. Everything about the stream's
   SHAPE stays printed and unasserted, so the provenance recording is
   untouched and only "there was nothing to record" fails.
2. **Leave the body green and make the RUN's report the artifact** —
   e.g. the operator commits the captured stream beside
   `docs/research/captures/real-planner-turn-2026-08-19.jsonl` (which
   this same file already reads as a fixture) and the verdict is that
   file existing, not an exit code.

Shape 1 is the smaller change and the one this suggestion leans toward;
shape 2 is what the current body implicitly assumes and has never been
written down.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-03 priority 2 — SHAPE 1 RULED, and the fence corrected

**The tension is ruled: SHAPE 1.** Assert the PREMISE, never the
content — red only when the body observed no real turn at all, and leave
every line SHAPE printed and unasserted so the provenance recording this
body exists for is untouched. Shape 2 is declined with its reason
recorded rather than dropped: it makes the verdict a file somebody
remembers to commit, which is the keeper-less figure ADR-019's Law 2
names, and it cannot tell a run that produced nothing from a run nobody
took.

**And the card's "WHY IT MATTERS RIGHT NOW" paragraph is now history, not
forecast, which strengthens rather than weakens it.** The one authorized
closing run HAS been taken: `T-025-s2` is `status: done`, milestone 3's
gate moved on 2026-08-30, and the verdict was read off `--nocapture`
stdout by a human exactly as this card predicted — the capture is
`docs/research/captures/real-planner-turn-2026-08-30.txt`. The surviving
consumer is @human's GENESIS WALK, the open item that closes milestone 3
and the next real turn anybody will run. A body that is equally green on
`Failed { AuthFailed }` would misreport that walk the same way.

**THE FENCE WAS CORRECTED AT PROMOTION.** As filed this card carried
`touches: [app/src-tauri/tests]`, a bare directory path whose one
relevant file is reserved by the `app-agent` slug through C-14 — the
shape `T-160-s4` exists to refuse. The fence is now the slug.

## Acceptance criteria

- THE real smoke SHALL distinguish, in its own exit status, a run that
  observed a real planner turn from a run that observed no turn at all.
  (The "or record the ruling" branch this criterion carried as filed is
  SPENT — the ruling is recorded above and it chose shape 1.)
- THE premise the body asserts SHALL be exactly the four the shape-1
  paragraph names — a started outcome, a native session id in the
  settled status, at least one text delta, and a terminal event that is
  `Completed` — and each failure SHALL name which of the four was
  missing, because "no turn observed" and "the CLI refused at auth" are
  the two answers a reader needs told apart.
- THE smoke SHALL keep every gate it has (`#[ignore]`,
  `NPUTER_REAL_CLI=1`, the one deliberate `NO_REAL_CLI_VAR` opt-out) and
  its real-cadence deadline (T-025-s5).
- WHERE assertions are added, THE stream's line SHAPES shall stay
  printed and unasserted, so the body remains the fixtures' provenance
  recording rather than a schema lock.
- THE lane SHALL NOT spawn a real turn as its proof; fixture suites
  green is the evidence, exactly as at T-025-s5.

## Implementation notes

**BUILT AS RULED — SHAPE 1, AND THE TENSION IS RESOLVED BY WHAT THE
ASSERTIONS ARE ABOUT RATHER THAN BY HOW MANY THERE ARE.** The recorder
survives whole: every line of the real stream is still printed by the
emitter closure as it arrives, the terminal event, the settled status and
the registry are still printed in full, and NOT ONE assertion reads a
text, a session id's value, a tool name, a seq or a schema key. What is
asserted is that there was a turn TO record — the four premises, and
nothing else. A stream whose shape has moved since 2026-08-30 records
itself exactly as before and stays green; a run that observed nothing
reds and says which of the four it was missing.

**THE FOUR, each a `const` beside the smoke so the panic names ITSELF:**
`PREMISE_STARTED`, `PREMISE_SESSION_ID`, `PREMISE_TEXT_DELTA`,
`PREMISE_COMPLETED` (`app/src-tauri/tests/agent_runner.rs`). Each opens
with its own ordinal. `missing_real_turn_premises` judges them and
returns the ones NOT observed, in premise order;
`assert_real_turn_observed` carries that list into the exit status. So
`Failed { AuthFailed }` 400 ms in — the run this machine produced for the
whole of 2026-08-16 → 2026-08-29 — now names premises 2, 3 and 4, and a
`Stall` after real text names only 4. Those two are the pair the card
said a reader needs told apart, and they are now different panics rather
than the same green.

**PREMISE 1 IS JUDGED BEFORE THE WAIT, AND THAT IS THE ONE PLACE THE
STRUCTURE CHANGED.** `T-025-s5`'s notes stated this cost and routed it
here in as many words: a start that never reaches `Started` spawns no
child, so no event can ever arrive, and the body would run the full
`REAL_CLI_DEADLINE` out and then panic with a TIMEOUT for what is a
resolution failure. The guard is one call, before the wait, and a
`cliNotFound` now fails in milliseconds naming premise 1.

**`collect_turn_within` SPLITS OUT OF `collect_turn`**, exactly the way
`wait_for_within` splits out of `wait_for` and for the same one reason
(T-025-s5's own precedent): the real smoke is the only caller in the file
waiting on a MODEL. Premise 3 is a question about the whole stream, so
the smoke collects instead of filtering. Every fake-driven call site is
unchanged and still passes `FIXTURE_DEADLINE`. This changes what the body
can JUDGE and nothing about what it RECORDS — the emitter printed every
event before this change and prints every event after it.

**THE GATES ARE UNTOUCHED, verified by diff**: `#[ignore]` with its
reason string, the `NPUTER_REAL_CLI != "1"` early return (which still
returns BEFORE any new assertion), the single deliberate
`NO_REAL_CLI_VAR = "0"` opt-out and `REAL_CLI_DEADLINE` all stand exactly
as they were. POSITIVE CONTROL, run at `f1fdb27`: with `NPUTER_REAL_CLI`
unset, `cargo test --test agent_runner real_cli_smoke -- --ignored
--nocapture` prints *"NPUTER_REAL_CLI=1 not set - refusing to call a real
model"* and returns without spawning anything — 1 passed, 86 filtered
out.

**AND THE ASSERTIONS ARE GIVEN A BODY THAT CAN RUN THEM, WHICH IS THE
PART THE CARD DOES NOT ASK FOR AND THE DRILL REQUIRES.** The smoke is
`#[ignore]`d and env-gated twice over, so no suite this lane may run can
ever execute a line of it — which is exactly the shape that let it assert
nothing for as long as it did, and it would let a WRONG assertion sit
there just as quietly. So the judgement lives in
`missing_real_turn_premises`, a pure function of a start outcome, a slice
of events and a settled status, and
`the_real_smokes_verdict_names_which_premise_was_missing` drives it off
SYNTHETIC events — no CLI, no fake binary, no harness, no temp tree. That
body runs on every `cargo test`, it is what the drill below poisons, and
it is why the four premises are a claim this lane can prove rather than
one it merely wrote down. **No real turn was spawned by this lane** — the
card's fifth criterion; the evidence is the fixture suite.

**THE DRILL — 7 mutants, 7 kills, every mutation ONE-SIDED (each moves
the CODE UNDER TEST — a judgement arm, a premise constant, the helper's
delegation — never an assertion), each read back with `git diff` before
its suite ran, each restoration sha256-proved with `git restore
--source=<sha> --staged --worktree`.** Run in a DETACHED scratch worktree
at `/Users/ujju/Projects/nputer-drill-T-025-s6`, cut at the work's own
commit `f1fdb27`, with `CARGO_TARGET_DIR` at `<scratch>/target` — the
walk-safe form — and one stem (`T-025-s6`) on the worktree, the target
dir, the driver and every results file. The driver's guard recognises ITS
OWN drill and not the shared prefix: this exact path, detached, at this
exact commit, and that path as the worktree root; a sibling's drill fails
all four. Baseline in the drill worktree before any mutation: `cargo
test` exit 0. Baseline sha256 of the target file
`9cdfc0595e5f4a5fdda4366cd182fa2c1d767135c6f7c648e1110b2964158cac`,
restored to that hash after all seven.

| mutant | what moved | red | failing bodies, WHOLE suite |
|---|---|---|---|
| M1 | premise 1 arm, `!matches!` → `matches!` | exit 101 | **1** |
| M2 | premise 2 arm, `is_none()` → `is_some()` | exit 101 | **1** |
| M3 | premise 3 arm, `!…any(TextDelta)` → `…any(TextDelta)` | exit 101 | **1** |
| M4 | premise 4 arm, `!matches!(terminal, Completed)` → `matches!` | exit 101 | **1** |
| M5 | `PREMISE_STARTED` loses its own ordinal (`"1. "` → `"9. "`) | exit 101 | **1** |
| M6 | `PREMISE_TEXT_DELTA` made a duplicate of `PREMISE_SESSION_ID` | exit 101 | **1** |
| M7 | `collect_turn` stops delegating at `FIXTURE_DEADLINE` (1 ms) | exit 101 | **10** |

**THE FAILING-BODY COUNT IS THE POINT OF THE LAST COLUMN, and it is the
SHAPE SIX question answered mechanically rather than asked** (the
catalogue's own procedure: name a mutant this body kills, run the WHOLE
suite under it, require the count to be ONE). M1–M6 are ONE each, and the
one is always `the_real_smokes_verdict_names_which_premise_was_missing` —
no other body in the repository covers any of them, so the new body is
not a duplicate of anything. M7 is DELIBERATELY not one: it is a liveness
proof for the `collect_turn` delegation rather than a unique-coverage
claim, and its 10 are the existing denial bodies that go through the
helper, which is what says the refactor is on the live path and not dead
code beside it.

**M5 AND M6 EXIST BECAUSE THE OBVIOUS FOUR ARE SYMMETRIC.** The
per-premise assertions compare the returned list against the SAME
constants the function pushes, so rewriting a premise's text moves both
sides at once and stays green — a symmetric mutation, the exact failure
CONVENTIONS' one-sidedness rule names. The ordinal loop and the
distinctness check are what break that symmetry: the ordinal is derived
from the ARRAY INDEX rather than from the constant, and the dedup asserts
the four are four. M5 and M6 are the mutants that prove those two lines
carry weight.

**WHAT COULD NOT BE POISONED, said rather than left to be discovered.**
The two `assert_real_turn_observed` call sites INSIDE
`real_cli_smoke_records_the_stream_schema` cannot be run by any suite
this lane may run, so no mutation of them can be shown to red — the card
forbids a real turn and the fifth criterion is explicit. What IS proven
is the judgement they carry: both call sites pass their arguments to
`missing_real_turn_premises`, and every arm of that function is drilled
above at a failing-body count of one. That is the strongest evidence
available without spending a model turn, and it is offered as exactly
that rather than as a claim about the smoke's own two lines.

**THE SWEEP (class: a `#[test]` body that asserts nothing).**
Two questions, both re-derived at this lane's own ref.
1. *Is there a second real-CLI body?* `grep -rn NPUTER_REAL_CLI app lib
   tools method` returns this file and `runner.rs`'s
   `real_cli_arms_forbidden` doc comment, and nothing else — the same
   answer T-025-s5's sweep got, so the real-CLI class still has exactly
   one member and it is now fixed.
2. *Is there a second body that asserts nothing?* Every `#[test]` in
   every Rust test file, split on the attribute, flagged when its body
   matches neither `\bassert` nor `panic!`. **SHOWN CAPABLE OF FAILING
   FIRST, and the first spelling was not**: run against
   `git show 9ed2b7f:…/agent_runner.rs` — the file before this lane
   touched it, which holds the known hit — an earlier spelling that
   counted `expect(` as an assertion returned NOTHING, because the smoke
   opens with `fs::create_dir_all(&project).expect("mk project")`. The
   sweep was blind to the one defect it was written to find. The
   corrected spelling names
   `real_cli_smoke_records_the_stream_schema` against `9ed2b7f` and names
   nothing in `agent_runner.rs` at `f1fdb27`.
   **ITS ONE KNOWN LIMITATION, named rather than papered over**: it
   cannot see through a helper. Four bodies in
   `app/src-tauri/crates/nputer-index/tests/golden.rs`
   (`ts_basic_matches_golden` and its three siblings) are flagged and are
   NOT defects — each calls `check_fixture`, which asserts `assert_eq!`
   on the golden bytes. No suggestion is filed for them. They are outside
   this fence in any case (`crate-index`, which is `T-167-s2`'s).

**GATES, every figure at `f1fdb27` and every exit read UNPIPED.**
- `cargo test` from `app/src-tauri/`: **exit 0** — 546 passed, 0 failed,
  4 ignored across 18 binaries. The real smoke is among the ignored, as
  it must be. The lib suite finished in **4.05 s**, well inside the
  cargo-cache-cliff's green band (<9.5 s), so
  `startup_arm_watches_the_initial_root` passing means what it says. Zero
  compiler warnings. Re-run after the drill worktree was removed: still
  exit 0, which is arm (c) holding — the drill's own `CARGO_TARGET_DIR`
  left this lane's cache untouched.
- GRAPH VERDICT, **REPORTED not regenerated** (the regen is the
  integrator's): `cargo run -p nputer-index -- index --check --root ../..`
  from `app/src-tauri/` exits **1 — STALE**, and it is a REAL stale, not
  the `--root` false red: the second line prints both byte counts. The
  move is exactly this diff — `files +0 -0 ~1`,
  `~ app/src-tauri/tests/agent_runner.rs (content, loc 5561 -> 5795,
  symbols 136 -> 144)`; workspace symbols 2195 → 2203, edges 2117 → 2117
  unchanged. **AND THE BUDGET FIGURE IS THE ONE TO READ TWICE**: fresh
  index **1,034,777 of 1,040,000 bytes (99.5%) — 5,223 left**, against a
  committed 1,032,605. This lane spends **+2,172 bytes** of the standing
  graph alarm STATE records at 7,395 left. Not a defect of this diff and
  not routed as a new finding — `T-167-s2` is the promoted tripwire for
  exactly this and was building in a sibling lane while this was
  measured; the number is stamped here so the integrator regenerating the
  graph sees what it costs.
- GRAPH REGEN fires (the diff touches a `*.rs` file outside `docs/`) and
  the REGEN is the integrator's at merge.
- BOOT GATE fires on `app/src-tauri/**`. **THE EXECUTOR RUNS IT TOO** and
  did: `NPUTER_BOOT_PORT=14524 npm run boot:check` from `tools/e2e/` —
  **exit 0**, both `[nputer]` lines observed, *"[nputer] project folder:
  /Users/ujju/Projects/nputer-T-025-s6"* and *"[nputer] window "main"
  created"*, tree stopped on SIGTERM with no SIGKILL. The port was read
  with `lsof -nP -iTCP:14524 -sTCP:LISTEN` at ZERO ROWS immediately
  before, and 1420 was neither probed nor bound.
- DOCS GATE, DIFF half, fed the RANGE RULE's own executor pair
  (`TREE=$(git merge-tree --write-tree 9ed2b7f HEAD)` — `$?` read first,
  0 — then `git diff --name-only 9ed2b7f "$TREE"`, which returns the two
  files this lane changed and nothing else): **exit 1, FIRES** — 1 path
  under `docs/` is a code input, this card itself, read by 9 bodies
  across 3 suites. All three run and all three are green:
  `npx vitest run` from `lib/parser/` **exit 0**, 315 passed / 15 files;
  `npm test` from `app/` **exit 0**, 1015 passed / 47 files;
  `npm test` from `tools/e2e/` **exit 0**, **320 passed** on
  `NPUTER_E2E_PORT=14523` (lsof-read at zero rows first; 3.4 min). The
  e2e lane plants and restores control bytes in seven tracked files as it
  runs — `git status` was clean afterwards, and it was run in this
  WORKTREE rather than the main checkout for exactly that reason.
- WHOLE-TREE half: `npm run lint:docs` from `tools/e2e/` **exit 0** — 23
  derived readers, 0 frontmatter issues, every live card's status legal
  (`verifying` included), governing-document budgets hold.
- `npm run lint:tokens` from `tools/e2e/` **exit 0** — clean, TOKEN 155
  files, CONTROL 935 tracked text files.

**SUGGESTION FILED**: `T-025-s7` (`status: suggested`) — a slug fence
buys a verifier for a diff that moves no shipped byte; `T-025-s5` and this
card changed the SAME test file and fall on different ceremony rows,
decided by whether `touches:` was spelled as a bare path or as a slug, and
the fence correction that moved it was made for a disjointness reason with
no ceremony consequence recorded. Named rather than fixed: the rule lives
in `docs/CONVENTIONS.md` and `method/tasks/TASK-FORMAT.md`, both outside
this lane's fence, and `T-145-s2`'s lesson is that a lane cannot decide
its own ceremony from inside it. Three shapes are written on that card so
it is a ruling and not an open question. **The three DOCS-GATE suites were
re-run WITH that card present** — a new `docs/tasks/T-*.md` is exactly the
input `9c64cd8` and `fede266` redded a suite through — and all three are
green again: parser 315, app 1015, e2e 320, `npm run lint:docs` exit 0.

**CONFLICTS BETWEEN CARD AND TREE: none.** Every claim the card makes
about the tree held at `9ed2b7f` — the body with no assertion of any
kind, the four `println!`s, the `#[ignore]` and env gates, the
`REAL_CLI_DEADLINE` caller, and the docstring naming the body a recorder.

**ONE THING THE PROMOTION CHANGED THAT IS NOT WRITTEN ANYWHERE, AND IT IS
THE CEREMONY ROW.** T-025-s5 changed THIS SAME FILE and took the ceremony
table's FIRST row — S, diff outside shipped code, no verifier — because
its `touches:` was the bare path `app/src-tauri/tests`, which CONVENTIONS'
THE SHIPPED PARTITION puts on the NOT SHIPPED side. This card's fence was
corrected at promotion to the SLUG `app-agent`, and a registry slug is
SHIPPED by that same bullet, whose rule is that a size-S card's row is
read off `touches:` rather than judged. So the identical diff now falls
on the SECOND row: executor → verifier. The correction's stated reason
was fence disjointness (C-14 reserves this file), not ceremony, so this
may be a consequence triage did not price. **Stamped `verifying` rather
than `done`, deliberately taking the heavier reading**: the diff is a
test file and moves no shipped byte, which argues the first row, but the
partition bullet's own instruction is to read the row off `touches:`, and
where the two readings disagree the one that buys a verifier is the one a
lane may take on its own. The lighter reading is available to the
integration seat with this paragraph as its argument.

VERDICT (2026-08-30, blind verifier claude-opus-5@subagent): **APPROVED WITH ASSIGNED CORRECTIONS**, both performed at merge by the integration seat, committed-first, and both proven by re-planting the verifier's surviving mutants: (1) `assert_real_turn_observed` — the function that converts the judgement into the exit status — is now pinned BOTH directions in the always-running body (gutting it to `let _ = missing;` reds the suite where it used to stay green at zero warnings); the notes' "WHAT COULD NOT BE POISONED" paragraph is corrected by this stamp — the CALL SITES cannot run, the helper's own assertion can and now is. (2) The find-not-last independence claim is a pin: a trailing event after the terminal must not unmake the turn, and `.last()` now reds it. The verifier also disclosed the dispatch brief gave procedural rather than structural blindness (executor shape-claims below the marker in the same message) — the fix for future dispatches is a factless spawn plus a follow-up message after the attack set is committed.
