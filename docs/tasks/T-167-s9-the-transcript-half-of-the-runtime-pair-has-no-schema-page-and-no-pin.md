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

Range rule, executor form: `TREE=$(git merge-tree --write-tree 40c9b8b
HEAD)` → `a3618ea` at exit 0 (clean); `git diff --name-only 40c9b8b
a3618ea` → **2** paths. This notes commit adds `docs/tasks/T-167-s9-*.md`,
so the gates below are derived on the **3-path** set the tip will carry.

| gate | fires | trigger matched | result |
|---|---|---|---|
| GRAPH REGEN | YES | `.rs` outside docs/ | `index --check` exit **1**, STALE |
| BOOT GATE | YES | `app/src-tauri/**` | see below |
| DOCS GATE | YES | `docs/tasks/*.md` | exit **1**, FIRES, 3 suites owed |
| METHOD EVAL | YES | `method/**` | exit **0**; `--selftest` exit **0** |

Suites, through the blessed runner from the repo root, all at ref
`5fcd646` (read the COUNT, never the code):

    gate-verdict suite=parser exit=0 bodies=344  targets=1  GREEN
    gate-verdict suite=app    exit=0 bodies=1116 targets=1  GREEN
    gate-verdict suite=rust   exit=0 bodies=611  targets=18 GREEN

Those three are exactly the suites the DOCS GATE named (`npm test` from
app/, `npx vitest run` from lib/parser/, `npm test` from tools/e2e/). The
card's own criterion — the app crate's `cargo test`, headless — is the
`rust` row.

A bare `cargo test` from app/src-tauri answers **exit 0 / 607** bodies;
the runner answers **611 over 18 targets** because it passes
`--no-fail-fast`. Both are true and the second is the one to quote.

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

All three at `5fcd646`, each mutating ONE side and restored by sha256:

| # | side | mutation | exit | what fired |
|---|---|---|---|---|
| A | code | `#[serde(rename = "atMillis")]` on `at_ms` | **101** | `…transcript-schema.md names ["atMs"]; the written line lacks them` |
| B | doc | drop `"machine": true` from the example | **101** | the MACHINE-ASSEMBLED guard, printing the short set `{"atMs","role","text","turn"}` |
| C | doc | respell `"atMs"` as `"at_ms"` | **101** | the camelCase guard, by name |

Restoration: `sessions.rs` back to
`aac6fd7c4facc047b96cbe9dfdbfbf88e7f9658ea5afe844a748e5628c5ce1a8`, the
page to `ed23328547687f24963d7c00baf5a23a36c7d264979de095c418fbb6a78517c9`,
`git status --short` empty.

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

1. **The prose in the new page is NOT pinned, and this is stated rather
   than glossed.** The `json` example is checked field-for-field in both
   directions and the file cannot be deleted without breaking the build
   (`include_str!`). But strip the camelCase paragraph, or the whole
   "WHICH KEY A LINE MAY LACK" bullet, leave the example intact, and
   `cargo test`, the docs gate, method-evals and the e2e lane all stay
   green. Two of the three facts survive prose deletion because the
   EXAMPLE carries them (`atMs`, `machine`); the sentences explaining them
   have no keeper. Attack that seam first.
2. The `machine`-may-be-absent arm asserts `missing == ["machine"]`, which
   TRANSCRIBES one key name into the test. It is the one transcription
   left in this pin, and it is the shape T-167-s1 removed elsewhere.
   Whether that is worth a second documented example object is a judgment
   this lane did not take on its own.
3. The old substring assertion was left in place; if the verifier reads
   two copies of one fact as the defect, that is a fair finding.

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
