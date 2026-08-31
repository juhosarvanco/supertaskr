---
id: T-167-s9
title: The transcript half of the runtime pair has no schema page and no pin — sessions.json is now documented and mechanically checked, transcript.jsonl is neither
feature: F-03
milestone: 4
priority: 4
size: S
status: verifying
blocked_by: []
touches: [method/runtime, app-agent]
suggested_by: executor claude-opus-5@subagent @T-167-s1
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-167-s1, NOT FIXED THERE.** That card's fence is
`method/runtime/sessions-schema.md` plus `app-agent` — ONE document, named
by path, deliberately narrowed at promotion so the blast radius would not
reach `runtime/nputer.yaml`, which is a `KIT_FILES` entry. Creating a
SECOND file under `method/runtime/` is outside it, and the bump question a
new method file raises belongs to triage before dispatch rather than to a
lane (CONVENTIONS, "what a bump is owed for").

## The asymmetry, now visible because its sibling was closed

`app/src-tauri/src/agent/sessions.rs` owns TWO runtime files, and its
module header names both in one sentence: `.nputer/sessions.json` and
`.nputer/genesis/transcript.jsonl`, "both losable by charter (ADR-017
clause 4)". After T-167-s1 the two are no longer treated alike:

- `sessions.json` has `method/runtime/sessions-schema.md`, and
  `the_written_registry_matches_the_sessions_schema_field_for_field`
  parses that document's own JSON example and compares it with a written
  entry BOTH WAYS, over a packed fixture and a packless one, with a
  positive control.
- `transcript.jsonl` has **no page in `method/runtime/` at all** — derive
  with `ls method/runtime/`, which returns exactly `nputer.yaml` and
  `sessions-schema.md` — and no test anywhere compares `TranscriptLine`'s
  written keys against any documented set.

## Why it is the same defect class, not merely a missing doc

`TranscriptLine` has the identical hazard that hid the tenth key for the
registry — a field that is skipped on write:

    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub machine: bool,

So `machine` is absent from every line where it is false, present where it
is true, and nothing states which. It is also `#[serde(rename_all =
"camelCase")]` while `SessionEntry` is snake_case, which is the same
convention split T-167-s1 had to write down for the pack object — and here
it is undocumented on the wire (`atMs`). The one assertion that touches
the spelling is a `raw.lines().all(|l| l.contains("\"atMs\""))` inside
`transcript_appends_one_line_per_half_turn_and_caps_text`, which pins ONE
key by substring and says nothing about the set.

## What a fix would decide

1. Whether the transcript gets its own page or a second section on the
   existing one. A second section is cheaper and keeps the two runtime
   files' contracts in one place, which is how `sessions.rs` already talks
   about them; a second file matches the current one-file-per-format
   layout. **This is the question that makes it a triage call and not a
   lane's.**
2. Whether the bump tests fire. Re-derive both at the fixing lane's own
   ref rather than taking T-167-s1's answer: test 1 (SHIPPED BYTES) turns
   on `KIT_FILES`, and a NEW file under `method/runtime/` is not
   automatically outside it the way an edit to an existing unshipped file
   was.
3. The pin, which should be the one T-167-s1 already built rather than a
   second implementation of it — `json_example`, `against_the_schema` and
   the non-empty guard in `sessions.rs`'s test module generalise to any
   documented object with one parameter change.

## Acceptance criteria

- THE transcript line's field set SHALL be documented under
  `method/runtime/`, with the shape DERIVED from `TranscriptLine` rather
  than transcribed from this card.
- THE document SHALL state the camelCase wire spelling and say that
  `machine` is omitted when false, absent meaning *not machine-assembled*.
- THE pin SHALL compare a written transcript line with the documented key
  set in BOTH directions, reusing T-167-s1's helpers rather than
  reimplementing them, and SHALL carry a positive control.
- THE lane SHALL re-derive both bump tests at its own ref and record the
  answer on this card, whichever way it falls.
- Verification: headless, the app crate's own `cargo test`.

## Implementation notes
<!-- executor appends before finishing -->

### What landed (`5fcd646`)

`method/runtime/transcript-schema.md` is new, per triage's ruling 1. Its
field set is DERIVED from `TranscriptLine` and not transcribed from this
card: `turn`, `role`, `text`, `atMs`, `machine`. The page documents the
camelCase wire spelling against the registry's snake_case next door, and
states that `machine` is OMITTED when false with absent meaning *not
machine-assembled* rather than *unknown*.

**The page deliberately states no NUMBER for the text cap.** It names the
property (truncated, never dropped) and the constant
(`TRANSCRIPT_TEXT_CAP`), because a figure written into a method file has
no keeper — the same reason CONVENTIONS' own bump bullet refuses to print
a tally.

`the_written_transcript_matches_the_transcript_schema_field_for_field` in
`sessions.rs`'s test module is the pin. It reuses T-167-s1's
`json_example` and `against_the_schema` unchanged — no second
implementation of either — behind one new reader, `transcript_line_keys`,
which carries the non-empty guard on the expected side. It compares
WRITTEN BYTES (not a struct round-trip, which would re-materialise
`machine` and report the writer's defaults instead of its output) against
the page, both directions, over two arms from one file:

- the **machine-assembled** half-turn, the only line that carries every
  key — `machine` is `skip_serializing_if`, so a typed-turn fixture could
  never see the fifth, which is exactly the blindness that hid the
  registry's tenth key;
- the **typed** half-turn, which must be missing `machine` and nothing
  else. This arm doubles as the positive control for the FIRST direction:
  it proves `against_the_schema` can report a missing key, which the
  registry's pin next door demonstrates only for the second.

Plus a planted undocumented key as the positive control for the extra
direction. The superseded `raw.contains("\"atMs\"")` substring is LEFT IN
PLACE with a pointer to the new body — it is strictly weaker, but removing
it is not what this card asked for.

### AC 4 — BOTH BUMP TESTS RE-DERIVED AT THIS LANE'S OWN REF (`5fcd646`)

**NO BUMP IS OWED. Triage's ruling 2 reproduces, and it was re-derived
rather than taken.**

- **Test 1, SHIPPED BYTES.** `git grep -h 'rel: "'
  app/src-tauri/src/agent/kit.rs` prints **14** entries at `5fcd646`, and
  the only `runtime/` one is `runtime/nputer.yaml`. The new file is not in
  the table and no table entry was edited. **FAILS.**
- **Test 2, GRAMMAR.** A runtime file's key set is not a field, status,
  normative table or contract row — not what a card, room, brief or role
  may SAY. **FAILS.**
- Either test would have been sufficient; neither fires, so no bump, and
  the three-file stamp is untouched.

**A hazard checked because a new file under `method/` invites it:**
`the_snapshot_table_covers_every_method_scaffold_file` in `kit.rs` walks
only `["docs-templates", "adapters", "tasks"]` — **not `runtime`** — so a
new page here does not red it. The already-present, unshipped
`sessions-schema.md` is the standing proof.

### Ceremony row, derived rather than taken

`touches: [method/runtime, app-agent]`. `method/runtime` REACHES the
`KIT_FILES` entry `runtime/nputer.yaml` ("REACHES, not equals — a fence is
a blast radius"), and `app-agent` is a registry slug (C-14's own
`touch_slugs:`). Both SHIPPED clauses fire, so the row is **S, touching
shipped code**: this card owes a VERIFIER, and the executor integrates its
own work only while holding the integration checkout. This lane does not
hold it. Stamped `verifying`; not merged; worktree left in place.

**This is a DIFFERENT row from T-167-s1's**, and the difference is the
fence rather than the work: that card's `touches:` was narrowed to
`method/runtime/sessions-schema.md`, which reaches no `KIT_FILES` entry.
This one names the directory.

### Gates, derived on the merge forecast this tip will have

Range rule, executor form, against main `40c9b8b`: at the final tip
`TREE=$(git merge-tree --write-tree 40c9b8b HEAD)` → `8bb5e46` at exit 0
(a CLEAN merge), and `git diff --name-only 40c9b8b 8bb5e46` → **4**
paths. **The set is a FIXED POINT under the remaining correction
commit**, which touches only paths already inside it, so this figure does
not go stale between here and the handoff. (Derived first at **2** paths
before the notes existed and at **3** with them forecast; the fourth is
the routed suggestion card. **The gate SET never moved — only the
count.**)

| gate | fires | trigger matched | result |
|---|---|---|---|
| GRAPH REGEN | YES | `.rs` outside docs/ | `index --check` exit **1**, STALE — the checkpoint's, not this lane's |
| BOOT GATE | YES | `app/src-tauri/**` | exit **0**, both `[nputer]` lines |
| DOCS GATE | YES | `docs/tasks/*.md` | exit **1**, FIRES, 3 suites owed — all green |
| METHOD EVAL | YES | `method/**` | exit **0**; `--selftest` exit **0** |

Suites, through the blessed runner from the repo root, **re-run at the
notes tip `f4bc430`** because the routed card changes the live
`docs/tasks` tree those readers parse — which is the one thing a
pre-commit gate read cannot catch (read the COUNT, never the code):

    gate-verdict suite=parser exit=0 bodies=344  targets=1  GREEN
    gate-verdict suite=app    exit=0 bodies=1116 targets=1  GREEN
    gate-verdict suite=rust   exit=0 bodies=611  targets=18 GREEN
    gate-verdict suite=e2e    exit=0 bodies=409  targets=1  GREEN

All four answered identically at `5fcd646`, **and again at the prose
correction `0f0a230`, so every suite is green at the exact byte state
being handed over**:

    gate-verdict suite=parser exit=0 bodies=344  targets=1  GREEN  ref=0f0a230
    gate-verdict suite=app    exit=0 bodies=1116 targets=1  GREEN  ref=0f0a230
    gate-verdict suite=rust   exit=0 bodies=611  targets=18 GREEN  ref=0f0a230
    gate-verdict suite=e2e    exit=0 bodies=409  targets=1  GREEN  ref=0f0a230

…and again over the two notes-only commits after it, so the counts are
stable across every commit in this lane rather than sampled once:

    gate-verdict suite=parser exit=0 bodies=344  targets=1  GREEN  ref=a86ce9f / 11d6aed
    gate-verdict suite=app    exit=0 bodies=1116 targets=1  GREEN  ref=a86ce9f / 11d6aed
    gate-verdict suite=rust   exit=0 bodies=611  targets=18 GREEN  ref=11d6aed
    gate-verdict suite=e2e    exit=0 bodies=409  targets=1  GREEN  ref=a86ce9f

Three of them are exactly the suites the DOCS GATE named (`npm test` from
app/, `npx vitest run` from lib/parser/, `npm test` from tools/e2e/); the
card's own criterion — the app crate's `cargo test`, headless — is the
`rust` row.

**THE ONE RESIDUAL, NAMED RATHER THAN PAPERED OVER.** The commit that
writes THIS ledger is necessarily later than the ledger it describes, and
that regress is structural — `roles/executor.md` says so in as many
words: the report is written by the commit that IS the tip, so *"re-derive
at your own tip"* is not literally performable from inside. It is BOUNDED
here rather than left open: the merge forecast is a FIXED POINT, because
every later commit in this lane touches only
`docs/tasks/T-167-s9-*.md`, which is already inside the 4-path set. **So
no later commit can change WHICH gates fire** — only which commit the body
counts were read at. The integrator re-derives at the merge; nothing above
is offered as a substitute for that.

A bare `cargo test` from app/src-tauri answers **exit 0 / 607** bodies;
the runner answers **611 over 18 targets** because it passes
`--no-fail-fast`. Both are true and the second is the one to quote.

BOOT GATE, from tools/e2e/ with `NPUTER_BOOT_PORT=16710` (derived from
the card id, `lsof` to zero rows immediately before binding; 1420 was
READ and held nothing, never probed and never bound): exit **0**, with
`[nputer] project folder: /Users/ujju/Projects/nputer-T-167-s9` and
`[nputer] window "main" created`, then the process tree stopped on
SIGTERM.

**GRAPH REGEN is owed and is NOT this lane's to discharge.**
`docs/architecture/graph.json` is outside the fence, and the gate's own
wording puts the regen in the CHECKPOINT. What moved, at `5fcd646`:
`files +0 -0 ~1` — `app/src-tauri/src/agent/sessions.rs`, loc 1358 → 1511.
The new page does NOT enter the walk.

**THIS CARD'S HEADROOM FIGURE IS STALE AND THE BLOCK IT JUSTIFIES IS
GONE.** The triage note reads "410 bytes of headroom at `b60b06d`
(1,039,590 against the crate's 1,040,000 budget)". Derived at `5fcd646`
from `index --check`'s own output: **1,153,961 of 2,145,959 bytes (53.8%)
— 991,998 left**. The budget was raised; docs/STATE.md's "the GRAPH HOLD
IS OVER" is the current fact. Nothing here was blocked by it.

### Drills — the pin proved able to fail, one side at a time

A, B and C at `5fcd646`, each mutating ONE side and restored by sha256.
**D is the fourth and it runs the other way**: it mutates what the pin is
NOT supposed to hold, and its expected result is GREEN — it is the
measurement behind "For the verifier" item 1 below, and it is a drill
rather than a claim precisely because a negative like *"nothing catches
this"* is the kind that is cheapest to assert and never test.

| # | side | mutation | exit | what fired |
|---|---|---|---|---|
| A | code | `#[serde(rename = "atMillis")]` on `at_ms` | **101** | `…transcript-schema.md names ["atMs"]; the written line lacks them` |
| B | doc | drop `"machine": true` from the example | **101** | the MACHINE-ASSEMBLED guard, printing the short set `{"atMs","role","text","turn"}` |
| C | doc | respell `"atMs"` as `"at_ms"` | **101** | the camelCase guard, by name |
| D | doc, at `a86ce9f` then `11d6aed` | delete **49 of 60 lines** — all prose, keeping the H1 and the fenced block | **0** | **nothing.** `cargo test --lib` 261/0 unchanged, method-evals 0, docs-gate **0** (does not fire) |

**DRILL D WAS RUN TWICE, AND THE SECOND RUN IS THE ONE THAT COUNTS.**
The first invoked `cargo test --lib` DIRECTLY rather than through
`gate-run.mjs`, so it bypassed the SOLO GUARD and took its reading while
the e2e suite held the lock. **The runner caught it on the very next
call** — `gate-verdict suite=rust exit=-1 bodies=0 targets=0
verdict=REFUSED reason=solo-lock: … held by pid 5351 running suite e2e …
REFUSING rather than waiting, because a reading taken after a wait is a
reading of the wait (T-088-s4)`. That refusal is the guard working, and
it is recorded rather than quietly worked around.

The bypass was not harmless in principle: rust's `solo: true` names
`startup_arm`, and `startup_arm_watches_the_initial_root` lives in
`app/src-tauri/src/docs_watch.rs` — the LIB target — so the contended run
did execute the vulnerable body. **What saves the finding is the
DIRECTION of the bias, not luck**: the failure mode that flag exists to
prevent is a spurious **RED**, and this drill's conclusion rests on
**GREEN**. Contention could only have pushed toward "something DID
notice", the opposite of what was concluded. That is an argument about
direction and NOT a substitute for a clean run, so it was re-run with the
lock free and reproduced byte-for-byte: same 261/0, same method-evals 0,
same docs-gate 0, same restore to `6914ba86…`. **A/B/C are unaffected** —
they ran at `5fcd646`, before any e2e existed in this lane.

Restoration: `sessions.rs` back to
`aac6fd7c4facc047b96cbe9dfdbfbf88e7f9658ea5afe844a748e5628c5ce1a8`, the
page to `ed23328547687f24963d7c00baf5a23a36c7d264979de095c418fbb6a78517c9`,
`git status --short` empty. **The page's sha256 then moved to
`6914ba8613fc2196e0f3408a018c22059e42d6bc54a7f12bd1d2f61f3ee0160d` at the
prose-correction commit below** — the drills' `ed233285` is the byte state
they were performed against, and the correction leaves the `json` EXAMPLE
untouched, so every drill result above still describes the shipped pin.

**AND A FOURTH DRILL RESULT NOBODY ASKED FOR, RECORDED BECAUSE IT COST
THIS LANE THE WORK.** The FIRST drill run happened BEFORE the
implementation was committed and restored with `git checkout --
app/src-tauri/src/agent/sessions.rs`. That restores to HEAD, which against
UNCOMMITTED lane work is DESTRUCTION rather than restoration — all four
edits were wiped. **Both restoration proofs `roles/executor.md` accepts
were run and they DISAGREED**: the empty per-path diff PASSED and
certified the destruction; the sha256 against the pre-drill baseline
FAILED (`aac6fd7c` → `a3033810`) and is the only reason it was caught.
**The two proofs are not interchangeable, and the cheaper one is the
unsafe one exactly when a lane has not committed yet.** Recovered
byte-identically, committed, then re-drilled against HEAD. The same script
then ran `cargo test --lib <body>` against a tree where the body no longer
existed and reported *"test result: ok. 0 passed … 260 filtered out"* at
exit **0** — a green over ZERO bodies, `gate-run.mjs`'s charter instance
2, produced by hand inside a session that had already read the rule.

### For the verifier

1. **The prose in the new page is NOT pinned, and that is MEASURED here
   rather than reasoned — DRILL D, at `a86ce9f`.** The `json` example is
   checked field-for-field in both directions and the file cannot be
   deleted at all without breaking the build (`include_str!`). The prose
   around it has no keeper anywhere, and the drill deliberately overshot
   the claim to find out how far it goes: **49 of the page's 60 lines
   deleted — every prose line, keeping only the H1 and the fenced block —
   and nothing in the tree noticed.**

   | instrument | on the stripped page |
   |---|---|
   | `cargo test --lib` (261 bodies, incl. `kit.rs`'s byte-pins) | exit **0**, 261 passed / 0 failed — unchanged |
   | `node tools/method-evals/run.mjs` | exit **0** |
   | `docs-gate.mjs method/runtime/transcript-schema.md` | exit **0** — it does not even FIRE |

   Restored: sha256 back to `6914ba86…`, `git status --short` empty. So
   the two FACTS survive prose deletion because the EXAMPLE carries them
   (`atMs`, `machine`), and every SENTENCE explaining them is unheld. This
   is the seam to attack, and the honest reading is that this card bought
   a mechanically-checked key set and an unenforced explanation — which is
   more than the transcript had and less than the page looks like.
2. The `machine`-may-be-absent arm asserts `missing == ["machine"]`, which
   TRANSCRIBES one key name into the test. It is the one transcription
   left in this pin, and it is the shape T-167-s1 removed elsewhere.
   Whether that is worth a second documented example object is a judgment
   this lane did not take on its own.
3. The old substring assertion was left in place; if the verifier reads
   two copies of one fact as the defect, that is a fair finding.

### Where the brief was wrong

- **The lane census was short by one.** The brief named "two other lanes
  — `T-209` and `T-208`, all three fences pairwise disjoint". STATE's own
  LANES command answers **four** live worktrees on task branches:
  `T-167-s9`, **`T-195`**, `T-208`, `T-209`. `T-195` reads `status:
  planned` on the board, which is the lapsed stamp lane-protocol rule 7
  says to disbelieve beside a live worktree. It expands (`app-dispatch` →
  C-15) to `app/src-tauri/src/dispatch/**`,
  `app/src/lib/dispatch-store.ts`, `app/test/dispatch-store.test.ts` —
  **disjoint from all six of this fence's paths**, so the omission cost
  nothing here. It is recorded because the census, not the outcome, is
  what row 5 asks for.
- **The base was right.** `git merge-base main HEAD` = `d7ec96c`,
  matching both the brief and `.nputer/lane-fence.json`.
- **The ceremony reading was right, and by the ROW.** Derived
  independently from `KIT_FILES` and C-14's `touch_slugs:` rather than
  taken; see above.
- **This card's own graph-headroom figure is stale** — recorded above
  rather than here, because it is the CARD's error and not the brief's.

### Noticed, not done, routed

`TranscriptLinePayload` in `app/src/lib/agent-store.ts` is a THIRD
implementation of this same field set, and nothing compares it with the
Rust struct or with the new page. It is inside this fence, but building a
TypeScript-side pin is not what this card asked for. Filed as
**`T-167-s10`**.

## Verdicts

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-03 p4, and BOTH triage questions RULED

The card names two calls as triage's. Both are taken here so the lane
inherits decisions rather than re-deriving them.

**RULING 1 — A PAGE OF ITS OWN, `method/runtime/transcript-schema.md`,
not a second section.** `ls method/runtime/` at `b60b06d` answers
`nputer.yaml` and `sessions-schema.md`: the existing layout is one file
per FORMAT, and the existing file's own NAME scopes it to the registry.
A transcript section inside `sessions-schema.md` makes that name false,
and a reader looking for the transcript's contract has no reason to open
a file named for the sessions one. The cheaper option is cheaper by one
file and costs the naming property this directory already keeps.

**RULING 2 — NO METHOD VERSION BUMP IS OWED, derived at `b60b06d`
rather than taken from `T-167-s1`'s answer.** Test 1, SHIPPED BYTES:
`git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` prints fourteen
entries and the only `runtime/` one is `runtime/nputer.yaml`, so a NEW
file under `method/runtime/` is not shipped and does not reach a
`KIT_FILES` entry. Test 2, GRAMMAR: a runtime file's key set is not what
a card, a room, a brief or a role may SAY. Both fail, so no bump. **The
lane SHALL still re-derive both at its own ref** — the card asks for it
and `KIT_FILES` is exactly the kind of table that moves under somebody
else's merge.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.

## VERDICT (2026-09-01, blind two-phase verifier claude-opus-5@subagent)

**APPROVED.** All five acceptance criteria met, both triage rulings
obeyed, and the ceremony row re-derived independently to the same answer.
Nine of my own mutants, every one one-sided, restored and sha256-proved.
Every figure below names the ref it was measured at.

### The blind line, and that it held

Phase 1 was written at the BASE ref `d7ec96c` with no diff, branch, note
or report open, and SEALED before any lane fact arrived:
`V-167s9-attack-set.md`, sha256
`17817b1da62cb073d30b74801dc4174bc3df4672bd5ee37f7a144f84b8c4098c`. The
card at base carried an empty `## Implementation notes` template and an
empty `## Verdicts` — scaffolding, not contamination. The dispatching
brief's phase-1 half named no executor-derived specific, so the two
phases were separable and the discipline was kept rather than claimed.

### The criteria, one at a time

- **AC1 — MET, and demonstrably DERIVED rather than transcribed.** The
  page's five keys are `TranscriptLine`'s five. More to the point it
  carries facts THIS CARD DOES NOT CONTAIN — `turn` shared by two lines,
  `role` as the SPEAKER and not the typist, `text` as the FINAL text and
  never a delta, truncated-not-dropped — which a transcription of the
  card could not have produced. It also names `TRANSCRIPT_TEXT_CAP`
  instead of printing its number: the cite-the-shape rule, applied
  unprompted.
- **AC2 — MET on its own terms.** Both sentences are on the page. See
  THE SEAM below for what that does and does not buy; the criterion asks
  the DOCUMENT to state them, and it does.
- **AC3 — MET, and the reuse is mechanical rather than editorial.**
  `json_example` and `against_the_schema` are the T-167-s1 originals,
  unmodified, with one new reader (`transcript_line_keys`) carrying the
  non-empty guard. Proved by drill, not by reading: breaking the shared
  helper ONCE reds BOTH pins (2 bodies), so there is no second copy.
- **AC4 — MET, and re-derived here a third time.** At `07831da`:
  `git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` prints **14**
  entries, the only `runtime/` one `runtime/nputer.yaml`. Test 1 FAILS.
  Test 2 FAILS — a runtime file's key set is not what a card, room,
  brief or role may SAY. **No bump owed**, no stamp moved, no `KIT_FILES`
  entry touched. The lane's independent derivation agrees.
- **AC5 — MET.** `cargo test` from app/src-tauri, headless, in a
  detached verifier bench with its own `CARGO_TARGET_DIR` — **exit 0,
  607 passed / 0 failed / 4 ignored across 18 targets** at `0f0a230`;
  through the blessed runner at `07831da`, `bodies=611 targets=18` (the
  runner counts the four ignored). Nothing was run in the integration
  checkout.
- **RULING 1 — obeyed.** `ls method/runtime/` answers three files; the
  transcript's contract is its own page and `sessions-schema.md` is
  untouched.
- **The writer did not move, and that is checked rather than assumed.**
  Every hunk in `sessions.rs` except the `//!` header sits inside
  `mod tests` (which opens at line 672; hunks at 732, 794, 939, 1253),
  and there are ZERO added lines outside the test module that are not
  `//!`. The page was derived from the struct; the struct was not bent
  to the page, and the wire format is byte-identical to base.

### My drills — nine mutants, one side each, all restored by sha256

Bench: `/Users/ujju/Projects/nputer-V-167s9`, detached at `07831da`,
`CARGO_TARGET_DIR` at `<bench>/target`. Every mutation was READ BACK
(the driver refuses on an empty diff) before its suite ran.

| # | side | mutation | exit | outcome |
|---|---|---|---|---|
| D1 | code | `against_the_schema`'s EXTRA side returns empty | 101 | **2 bodies** red — registry AND transcript |
| D2 | code | its MISSING side returns empty | 101 | **2 bodies** red — the helper is genuinely SHARED |
| D3 | code | `#[serde(rename = "Role")]` on the writer | 101 | `…names ["role"]; the written line lacks them` — EXACT, case-sensitive, not containment |
| D6 | code | drop `skip_serializing_if` on `machine` | 101 | **exactly ONE failing body**, `left: []` / `right: ["machine"]` |
| D7 | doc | delete the page | 101 | COMPILE error naming the path |
| D8 | doc | retag the fence `json` → `jsonl` | 101 | loud parse panic — an emptied expected side cannot pass |
| D9 | doc | a decoy `json` fence ABOVE the real one | 101 | the "must be the transcript LINE" guard fires |
| D4 | doc | **INVERT** the omission rule | **0** | **GREEN** — see THE SEAM |
| D5 | doc | example `"machine": true` → `false` | **0** | **GREEN** — see THE SEAM |

Restoration proved by sha256 against `git show HEAD:<path>` on both
paths after every drill, with `git status --short` empty:
`aac6fd7c4facc047b96cbe9dfdbfbf88e7f9658ea5afe844a748e5628c5ce1a8`
(sessions.rs) and
`6914ba8613fc2196e0f3408a018c22059e42d6bc54a7f12bd1d2f61f3ee0160d`
(the page) — the second reproducing the lane's own published hash.

**D6 is the shape-SIX answer in its mechanical form.** CONVENTIONS asks
for a mutant the new body kills, the WHOLE suite run under it, and a
failing-body count of ONE. That is what D6 measured: the new pin is not
a duplicate, and the omission BEHAVIOUR is uniquely held by it.

**D3 is the near-miss the removal-only mutants could not reach.** The
lane's own A/B/C are sound but A is a wholesale rename and B and C are
killed by the non-empty GUARD rather than by the comparison. D3 changes
one character of case on the wire and the SET comparison catches it, so
the matcher is exact rather than containment — the discriminator this
project has rediscovered three times in two days.

### THE SEAM — measured further than the lane measured it, and still not a defect

The lane disclosed that the page's prose has no keeper and drilled it
(49 of 60 lines deleted, nothing noticed). I confirm that class on an
uncontended bench and extend it in the two directions that matter:

- **D4: the omission rule can be INVERTED, not merely deleted.** With
  the page reading *`machine` is OMITTED when it is true* and *Absent
  means machine-assembled*, `cargo test --lib` is **261 passed / 0
  failed, exit 0** — identical to baseline. A deleted sentence stops
  helping; an inverted one actively misleads, and nothing in the tree
  can tell them apart.
- **D5: the EXAMPLE's values are unheld too, not just the prose.** The
  guard asserts `keys.contains("machine")` under a comment claiming the
  example "must be the MACHINE-ASSEMBLED half-turn"; the value is never
  read, so the example can be set to `"machine": false` — a line the
  writer can never produce — at exit 0.
- **I reproduce the lane's gate readings on the stripped-page class**:
  `docs-gate.mjs method/runtime/transcript-schema.md` answers **exit 0,
  "none under docs/ — this gate is not owed"**, so the page is invisible
  to that gate; `node tools/method-evals/run.mjs` is **exit 0** and its
  `--selftest` positive control **exit 0**, both at `07831da`.

**This is NOT an unmet criterion and it is not a rejection.** AC2 asks
the document to STATE two things and AC3 specifies the pin over the
documented KEY SET; both were delivered as written. What the seam means
is narrower and worth writing down: **this card bought a mechanically
held field set and an explanation nothing holds** — which the lane says
in almost those words itself. The right response is the disclosure plus
a routed card for the one instance with a cheap remedy, not a blocked
merge. D5's remedy is filed as `T-167-s12`; D4's has none that is cheap,
and inventing one from a verdict would be specifying a duplicate into
existence.

### The lane's two self-reported defects, judged

**The solo-guard bypass: the finding stands, and its defence is right
for a narrower reason than it gives.** The argument offered is
directional — the guard prevents spurious REDS and drill D's conclusion
rests on GREEN. `lane-protocol` rule 4 says in as many words that a
second runner corrupts in BOTH directions, so the general form of that
argument is unsound. What rescues THIS reading is mechanism, not
direction: the body carrying the conclusion is a deterministic assertion
over `include_str!` content, cargo's own target-dir lock precludes a
stale-binary green, and the timing-sensitive body the `solo` flag names
fails toward RED. I did not take the lane's word for it — D4 and D5
reproduce the same class on a bench with the lock free and no sibling
runner, and both are green. Disclosing the bypass, quoting the runner's
own REFUSED line, and re-running clean is the correct handling of an
error of this kind.

**The green over zero bodies** (`ok. 0 passed … 260 filtered out` at exit
0) is `gate-run.mjs`'s own charter instance and is correctly named as
one. It reached no published figure.

**The restoration-proof disagreement is the largest thing this lane
found**, and it is a rediscovery rather than a discovery — which makes
it MORE actionable, not less. CONVENTIONS already rules the sha256 the
proof and the empty diff a companion never an alternative (T-092-s4),
and already says drill at a commit (T-072-s1). `method/roles/executor.md`
still offers the two as alternatives in its report contract. That
sentence is outside every fence this card could reach, so it is routed:
**`T-167-s11`**.

### Gates at my own ref, and what I could not measure

All at `07831da` unless named otherwise, through the blessed runner from
the repo root, port DERIVED from the card id (14176), `lsof` to zero
rows on both stacks immediately before binding, 1420 READ and never
probed:

    gate-verdict suite=parser exit=0 bodies=344  targets=1  GREEN
    gate-verdict suite=app    exit=0 bodies=1116 targets=1  GREEN
    gate-verdict suite=rust   exit=0 bodies=611  targets=18 GREEN
    gate-verdict suite=e2e    exit=0 bodies=409  targets=1  GREEN

- **DOCS GATE, RANGE RULE pair, no `xargs`, separate literal paths,
  `$?` read first** — against main at `dcd1c3e` and again at `373f6ac`:
  `git merge-tree --write-tree` exit **0** (a CLEAN merge) both times,
  **4 paths** both times, the same four. The gate FIRES at exit **1**
  and names three suites — `npm test` from app/, `npm test` from
  tools/e2e/, `npx vitest run` from lib/parser/ — all three GREEN above.
  It also reports **every live task card's frontmatter parses with a
  legal status**, which covers the routed `T-167-s10`.
- **`npm run lint:docs` from tools/e2e — exit 0**, whole-tree half, 0
  findings, **and the root-anchor account still at its ledgered six**.
  The `include_str!` choice is what keeps it there; a runtime climb
  would have owed a ledger entry in another package's fence. Run after
  `npm ci` in tools/e2e, and READ as output rather than as an exit code.
- **METHOD EVAL GATE — exit 0**, 6 model-free evals, from the repo ROOT;
  `--selftest` **exit 0, POSITIVE CONTROL**. It fires: `method/**`.
- **GRAPH REGEN fires and is the CHECKPOINT'S, not this lane's.**
  `index --check --root ../..` exit **1, STALE**, and it is a REAL red
  by its second line rather than the `committed: MISSING` false one:
  `files +0 -0 ~1`, `app/src-tauri/src/agent/sessions.rs (loc 1358 ->
  1511)`, no new edge, the page not in the walk.
- **HEADROOM, re-derived at `07831da`: 1,153,961 of 2,145,959 bytes
  (53.8%) — 991,998 left.** The triage note's "410 bytes at `b60b06d`"
  is stale and the block it justified is gone; the lane's correction
  reproduces exactly.
- **THE E2E FIGURE, AND THE ENVIRONMENT IT WAS MEASURED IN.** e2e is
  GREEN at 409 at `07831da` on my bench, and `THE MARGIN GUARD` in
  `brief-flush.spec.ts` did NOT red for me. `git worktree list | wc -l`
  answered **15 before and 15 after** the run — a quiet board across my
  window, which is precisely the condition the lane did not have. The
  lane's red on that body at this same tip is therefore attributable to
  the machine-scoped worktree list moving mid-run and NOT to this diff
  (`T-220`), and my green is evidence for that attribution rather than a
  refutation of the lane's report. **The lane refusing to re-run into a
  live verifier's solo lock, and reporting the red instead of washing it
  out, is the right call** — re-running until green is the defect's own
  healing mechanism, not evidence.

### Security sweep (mandatory, not optional)

The one new read path is `include_str!` of a fixed relative path:
compile-time, no repository root held, reaches exactly one file, no
runtime I/O, no traversal, no symlink following. No dependency was
added — no manifest is in the diff. No secret, key or token appears. The
planted control literal `tokens` occurs nowhere in the page or the
writer, so the drill's one-sidedness cannot be defeated through it. The
new page is prose. **Nothing at REJECTED level, and nothing at any
level.**

### Findings filed, blocking nothing

- **`T-167-s11`** — `roles/executor.md` still offers the two restoration
  proofs as an either/or; three measured instances by three different
  mechanisms, the third this lane's. Method text, so the bump question
  is named and left to triage.
- **`T-167-s12`** — the page's example can contradict the page's own
  omission rule at exit 0; one-line remedy, drilled.
- **`T-167-s10`, routed by the lane, is correctly routed.** I checked
  the scope call rather than accepting it: `app/src/lib/agent-store.ts`
  IS inside this fence (C-14's `paths:` names it), so this was a scope
  decision and not a fence one — and the scope call is right, because
  AC3's "reuse T-167-s1's helpers" names Rust helpers that no TypeScript
  body can call, and AC5 names the app CRATE's `cargo test`, which no
  TypeScript body runs under.

### The three questions the lane put to the verifier, answered

1. **The seam** — answered above. Measured further than the lane
   measured it (D4, D5) and still not an unmet criterion.

2. **The `missing == ["machine"]` transcription: it IS one, it is the
   right call for THIS card, and the shape that would remove it is worth
   naming rather than leaving to the next reader.** The expected KEY SET
   is derived from the page; what is transcribed is the omission RULE, as
   a hard-coded one-element vector. So the page and the test hold that
   rule twice — and D4 is exactly what that costs: invert the page's
   sentence and the test goes on asserting the old rule, green, with the
   two copies disagreeing in silence. That is this card family's own
   defect class, one level down from where it was fixed.
   **The mechanical remedy is a SECOND example object on the page** — the
   TYPED half-turn, four keys — with the arm deriving its expected set
   from that example instead of from `schema` minus a literal. Then the
   omission rule is the page's, both example objects are pinned in both
   directions, and a page whose rule was edited without its second
   example reds. It is the shape T-167-s1 already used one level up (its
   packed and packless arms, from one document). It is also more than
   this card asked for, so it is routed rather than required: recorded on
   `T-167-s12` as the fuller alternative to that card's one-line remedy,
   for triage to choose between. Note what it does NOT close — the
   camelCase paragraph and every other sentence stay unheld; a second
   example holds the omission rule and nothing else.

3. **The old substring assertion is not a defect, and I looked before
   saying so.** The `contains("atMs")` line in
   `transcript_appends_one_line_per_half_turn_and_caps_text` is now
   strictly weaker than the new body, but it is not a second copy of a
   VALUE: the lane annotated it with a pointer NAMING the body that owns
   the field set, which is CONVENTIONS' own cite-the-assertion-by-name
   remedy applied correctly. Its haystack is the written file's own lines
   rather than a whole file, so shape EIGHT does not reach it, and it
   sits in a body about half-turns and caps where an `atMs` tripwire
   costs nothing. Deleting it would remove a check and buy nothing; the
   card did not ask for it either way.

### Where the brief was wrong

- **The tip I was dispatched at did not exist by the time I read it.**
  Phase 2 named `0f0a230`; the lane's tip was `07831da`, three commits
  later. Verified harmless rather than assumed: the delta is ONE file,
  `docs/tasks/T-167-s9-*.md`, +84/-14, nothing outside `docs/tasks/`, so
  every code measurement at `0f0a230` holds. Both refs are named above
  where they were used.
- **The card's own triage note carries a stale headroom figure**, as the
  lane reported and as re-derived here.
- Nothing else. The base (`d7ec96c`), the fence, the 4-path forecast and
  the ceremony row all reproduced.
