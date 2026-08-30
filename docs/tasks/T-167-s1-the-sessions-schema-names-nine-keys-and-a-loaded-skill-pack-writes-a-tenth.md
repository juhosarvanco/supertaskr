---
id: T-167-s1
title: method/runtime/sessions-schema.md names nine keys and a genesis that loads skill packs writes a tenth — the code says "field-for-field per" a document that does not name the field
feature: F-03
milestone: 4
priority: 3
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-167
blocked_by: []
touches: [method/runtime/sessions-schema.md, app-agent]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-167's LANE WHILE BUILDING ITS OWN THIRD CRITERION, ROUTED
RATHER THAN FIXED: `method/` is outside `app-agent`, and the bump
question this raises belongs to triage BEFORE dispatch (CONVENTIONS,
"what a bump is owed for" — a lane cannot decide it from inside its own
fence).**

## What the two sides say

`app/src-tauri/src/agent/sessions.rs`'s module header:
*"Field-for-field per `method/runtime/sessions-schema.md`."* That
document's JSON example carries exactly nine keys — `id`, `agent`,
`model`, `native_session_id`, `created`, `turns`, `tasks`, `roles`,
`status` — and the pin
`the_written_registry_matches_the_sessions_schema_field_for_field` in the
same file asserts all nine are present and that there are no others.

T-167's third criterion asks the session record to stamp WHICH skill
packs shaped the session, by name and content hash. That landed as
`SessionEntry.skills`, so a genesis run in a project that carries
`.claude/skills/` writes a TENTH key the schema does not name.

## Why it is not a red today, and why that is not the end of it

The field is `#[serde(default, skip_serializing_if = "Vec::is_empty")]`,
so a genesis with no packs writes the same nine keys it always wrote and
that pin is green with its assertions untouched — which is also T-167's
own byte-identity criterion. **The gap is only visible on a project that
HAS packs**, and there is no mechanical reader that will ever say so: the
pin walks the keys the SCHEMA names and asks whether the entry has them,
never the other direction, and its "no extra keys" arm is exercised by a
packless fixture.

So the disagreement is silent by construction, which is the class
CONVENTIONS' "a comment that restates a measured figure is a second
implementation" bullet is about, one category over.

## What the fix has to decide

1. **The document** — add the `skills` key to the schema's example and
   say what it holds (an array of `{dir, name, description, triggers,
   relPath, hash}`, camelCase on disk, absent when no packs loaded).
   Derive the shape from `SkillPack` in
   `app/src-tauri/src/agent/skills.rs` rather than transcribing this
   card, which will go stale.
2. **Whether a method version bump is owed**, which is the part a lane
   must not decide. Against test 1 (SHIPPED BYTES):
   `sessions-schema.md` is NOT in `KIT_FILES` — derive with
   `git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` — so it fails
   the shipped test. Against test 2 (GRAMMAR): the trigger is "a field, a
   status, a normative table, a contract row" for what *a card, a room, a
   brief or a role* may say, and `sessions.json` is none of those — it is
   runtime state, losable by charter. **The honest reading is that NO
   bump is owed and this is an editorial repair to an unshipped method
   file, which rides the next bump** — but the sentence "adds a field to
   a schema" is close enough to the grammar test that the call should be
   made at triage and written down, not left for the next reader to
   re-derive.

If the answer is that a bump IS owed, note that a bump is a three-file
commit whose third file is Rust (`METHOD_SNAPSHOT_VERSION` in
`app/src-tauri/src/agent/kit.rs`) plus a fourth thing that is not a file
(the method-eval `--bump` block), so the fence has to reach all of them
— `[method/runtime]` alone cannot take it.

## The pin to add with the fix

Whatever is decided, the asymmetry above is worth closing: the pin should
also assert the entry's keys are a SUBSET of what the schema names, so
the next field added without the document reds instead of passing. A
fixture with one loaded pack is four lines in that test module —
`skills::SkillPack` is constructible by hand, and
`agent/skills.rs`'s own tests show the shape.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-03 priority 3 — THE BUMP QUESTION IS RULED HERE, which is the half a lane may not decide

**RULING: NO METHOD VERSION BUMP IS OWED. This is an editorial repair to
an unshipped method file and it rides the next bump.** Both tests
re-derived at `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`, not taken
from the card:

- **Test 1, SHIPPED BYTES — fails.** `git grep -h 'rel: "'
  app/src-tauri/src/agent/kit.rs` prints fourteen entries; `runtime/`
  appears exactly once and it is `runtime/nputer.yaml`. The schema
  document is not among the bytes the kit materialises into a new
  project, so nothing a project inherits changes.
- **Test 2, GRAMMAR — fails.** The trigger is a field, a status, a
  normative table or a contract row governing what a card, a room, a
  brief or a role may say. `.nputer/sessions.json` is none of those: it
  is runtime state, losable by charter, and no seat reads it as a
  contract.

Recorded rather than left to the next reader precisely because the
sentence *"adds a field to a schema"* sits close enough to test 2 that
each reader would re-derive it. If a later reader disagrees, the thing
to argue with is the two derivations above, not this conclusion.

**AND THE FENCE IS NARROWED AT PROMOTION.** As filed the card carried
`touches: [method/runtime]`, a directory that also reaches
`runtime/nputer.yaml` — a KIT_FILES entry, so the blast radius included
shipped bytes this card has no business near. The fence is now the one
document plus `app-agent`, which is where the pin lives. The card still
takes a verifier: `app-agent` is a registry slug and the shipped
partition is read off `touches:`.

## Acceptance criteria

- THE schema document SHALL name the tenth key and say what it holds,
  with the shape DERIVED from the type the code writes rather than
  transcribed from this card, which goes stale.
- THE pin SHALL assert the written entry's keys are a SUBSET of what the
  schema names, so the next field added without the document reds
  instead of passing — today it walks only the schema's side and its
  "no extra keys" arm is exercised by a fixture with no packs.
- THE new arm SHALL be driven by a fixture with at least one loaded
  pack, and SHALL carry a positive control: an entry with a key the
  schema does not name reds, and the packless entry still passes.
- THE lane SHALL NOT bump the method version, and SHALL NOT edit any
  KIT_FILES entry. The ruling above is why; a lane that bumped anyway
  would be deciding at the seat the question this card decided at
  triage.
- Verification: headless. The app crate's own `cargo test` green at the
  lane's ref, with the byte-identity behaviour for a packless genesis
  unchanged.

## Implementation notes

Built in `/Users/ujju/Projects/nputer-T-167-s1` on
`task/T-167-s1-sessions-schema`, cut from `51fa31c`. Every figure below
was re-derived in this lane at its own final commit, against **main at
`16f4821`** — which is NOT the tip this lane was briefed at; see "main
moving under the lane" below.

### The tenth key, as documented

`method/runtime/sessions-schema.md`'s example gained `skills`, with the
shape DERIVED from `SkillPack` in `app/src-tauri/src/agent/skills.rs` and
not transcribed from this card: `dir`, `name`, `description`, `triggers`,
`relPath`, `hash`. **The pack object is camelCase and the entry's own keys
are snake_case** — that is `#[serde(rename_all = "camelCase")]` on
`SkillPack` against a bare `SessionEntry`, and it is stated on the page
because nothing else on it would lead a reader to expect the change of
convention halfway down one object.

**AND THE OMISSIBLE SET IS THREE KEYS, NOT ONE.** Deriving `skills`'s
absence rule off the writer rather than off this card is what found it:
`git grep -n skip_serializing_if app/src-tauri/src/agent/sessions.rs`
returns three hits on `SessionEntry` — `model` (line 38),
`native_session_id` (41) and `skills` (72). `model` and
`native_session_id` have been omissible since T-025 and this document
never said so, so the ordinary mid-flight entry — written before the
CLI's init line reports either — has always been legal and undocumented.
The page now names all three under one rule (*there was nothing to
record*) and says the other six are always written. Naming only `skills`
would have written a second false sentence in the act of repairing the
first.

### The SUBSET-PIN

`the_written_registry_matches_the_sessions_schema_field_for_field` keeps
its name (it is a rustdoc link target) and is rebuilt:

- **The key set is DERIVED from the document**, by parsing its own fenced
  `json` example, rather than transcribed beside it. A transcription is
  a second implementation of the field set and the two disagree in
  silence — which is this card. The document is now the one authority and
  the pin is a reader of it.
- **Both directions, from one helper.** `against_the_schema` returns
  (missing, extra) and every arm goes through it.
- **Arm 1, a PACK-LOADING fixture**: written entry == schema, exactly —
  and the pack object one level down == the schema's pack example, so a
  field added to `SkillPack` cannot go silent the way one added to
  `SessionEntry` did.
- **Arm 2, the packless fixture**: == schema minus `skills`. That states
  the skip-when-empty rule instead of counting to nine, and it is where
  T-167's byte-identity behaviour now lives.
- **Arm 3, the positive control**: an entry carrying a key the schema does
  not name goes through the SAME comparison and is reported. Without it,
  arms 1 and 2 are satisfied forever by a comparison that cannot fail.
- **The expected side is asserted non-empty first** — the derived set must
  contain `id`, `status` and `skills`, and the pack example must contain
  `hash` — because a renamed fence or a reflow that emptied it would make
  every containment assertion above vacuously true.

The module header's *"field-for-field per"* claim moved WITH the document
and got stronger, never looser: it now says the sentence is mechanical and
names the body that makes it so. The conflict T-167 recorded on
`SessionEntry.skills` is marked closed and KEPT, because the mechanism
that hid it — a disagreement no fixture could reach — is the lesson.

### THE LINT REFUSED THE FIRST PASS AND THE REFUSAL WAS RIGHT

Reading the document meant forming a path to it, and the obvious spelling
— `CARGO_MANIFEST_DIR` plus two `parent()` hops, copied from `kit.rs`'s
own test helper — made `sessions.rs` hold the repository root.
`npm run lint:docs` from tools/e2e/ went **exit 1**:

    docs-gate: the root-anchor ACCOUNT and the tree disagree:
      + app/src-tauri/src/agent/sessions.rs — holds the root, unargued

**AND THE LEDGER IT WANTS IS IN ANOTHER LANE'S FENCE.**
`ROOT_ANCHOR_LEDGER` lives in `tools/e2e/scripts/docs-scan.mjs`, and
`T-154-s2` holds `tools/e2e` right now (`touches: .claude, tools/e2e,
docs/CONVENTIONS.md`, live worktree read at 2026-08-30). So the entry
could not have been written from here — and an entry was not the right
answer anyway. `include_str!` of a fixed relative path is what this crate
already does for every method file `kit.rs` pins: it holds no root, can
reach exactly one file, and recompiles when that file changes. The gate's
question stops arising rather than being answered, and `lint:docs` is back
to **exit 0** with the root-anchored account at its ledgered six.

Recorded rather than smoothed away because the near-miss is the reusable
part: the shape a lane reaches for by copying a sibling helper is the
shape a standing gate is watching for.

### The drill — 4 mutants, 4 reds, RE-RUN against the shipped code

Detached scratch worktree at `/tmp/d167` (short root per T-133-s5), its
own `CARGO_TARGET_DIR=/tmp/d167/target`, cut at the commit under test.
**Every mutant was run twice**: once against the first pass, and again
after `include_str!` replaced the root climb, because a drill against code
that no longer ships is not a drill. The second pass is what is quoted.

| mutant | what moved | exit | the red |
|---|---|---|---|
| A | writer gains `cost_cents`, document does not name it | 101 | `the entry writes ["cost_cents"], which method/runtime/sessions-schema.md does not name` |
| B | document names `sediment_warned`, writer never writes it | 101 | `method/runtime/sessions-schema.md names ["sediment_warned"]; the written entry lacks them` |
| C | document loses `skills` again — this card, reverted | 101 | `must NAME the tenth key a pack-loading genesis writes (T-167-s1): {…the pre-T-167-s1 nine…}` |
| D | `against_the_schema` can no longer report an extra key | 101 | `the subset arm must be able to FAIL, or the arms above are decoration` |

Each is ONE-SIDED: A and D kill only the extra arm, B and C only the
missing side. **A's first attempt was withdrawn before it was run**: it
was named `sediment_score`, which is the literal arm 3 plants — a literal
the two sides SHARE, which the POISON DRILL forbids. Renamed to
`cost_cents` and re-planted. A also has to touch three production
initializers in `agent/mod.rs`; without them the mutant does not compile,
and **a compile error is not the pin's red** — the first run of A was
discarded for exactly that (E0063 ×3, no assertion reached).

**B DOUBLES AS PROOF OF THE `include_str!` STALENESS PROPERTY**: its diff
is one line of markdown and nothing else, and the run reports
`Compiling nputer v0.1.0` exactly once before the red — cargo tracks the
included file, so the pin cannot read a stale copy of the document.

RESTORATION PROVED BY SHA256 against `git show HEAD:<path>`, both passes,
naming both sides of the restore (`git restore --source=HEAD --staged
--worktree`):

    RESTORED app/src-tauri/src/agent/sessions.rs  a3033810fc8c4f819fe249c1090329bd63c66ce8d6e09ebf2e4b518f8fe7ed91
    RESTORED app/src-tauri/src/agent/mod.rs       f859cb312d028d1ab07a5d59f32dd379cad265c31e5be3fec8ce8890a15f45f5
    RESTORED method/runtime/sessions-schema.md    bff3d77055bed3e202093a4d4c866bf50d07592bfd9a4783ebfe8177923fe2f1

…and the restored tree was re-run GREEN (exit 0), which a restore that had
thrown away the work would not have been. The scratch worktree is removed.

### Gates

- **`cargo test` from app/src-tauri — exit 0, UNPIPED** (`cargo test > <file> 2>&1; echo $?`;
  a redirect, never a pipe). 560 passed, 0 failed, 4 ignored across every
  target. Cache cliff read the way T-088-s4 says — by the lib suite's OWN
  time, not by `target`'s size: **4.24s**, against green-under-9.5s and
  red-over-14.6s, with `target` at 2.5G. No `cargo clean`; three sibling
  lanes were live. One warning in the build and it is NOT this diff's:
  `unused import: Path` at `src/arch_cmd.rs:2`, a file this lane never
  opened.
- **`npm run lint:docs` from tools/e2e — exit 0** (exit 1 before the
  root-anchor correction above; both runs recorded).
- **DOCS GATE on this lane's own RANGE RULE pair** — `git merge-tree
  --write-tree` off `main` at `51fa31c`, `$?` read first, no `xargs` in
  the spelling. Before this card edit: **exit 0, not owed** (3 changed
  paths, none under docs/). After it: **exit 1, FIRES** — 2 paths under
  docs/ are code inputs, and it names three suites. See the next section:
  **it caught a real red, and the red was in this card's own prose.**
- **METHOD EVAL GATE — exit 0**, 6 model-free evals. It FIRES: the diff
  touches `method/**`.
- **GRAPH REGEN fires** (`*.rs` outside docs/) and the regen is the
  integrator's. VERDICT REPORTED, not acted on: `index --check` **exit 1,
  STALE**, and the delta is exactly this lane —

      files ~2   app/src-tauri/src/agent/sessions.rs (loc 1197 -> 1358)
                 app/src-tauri/tests/agent_runner.rs (loc 5830 -> 5838)
      edges +1   sessions.rs -> skills.rs (import) symbols=[SkillPack]

  the new edge being the pin's own `use` of `SkillPack`. Headroom after
  this lane: **2,022 bytes of 1,040,000** (committed 1,037,788 → fresh
  1,037,978, so this lane costs **190 bytes**), under the 14,914-byte
  tripwire — the standing alarm STATE calls SURVIVABLE by design, not a
  new condition. Derived with `cargo run -p nputer-index -- index --check
  --root ../..` from app/src-tauri at `9fdc4d4`.

### THE DOCS GATE EARNED ITSELF ON THIS LANE — a red in these notes

The suites it named were run, and `npx vitest run` from lib/parser/ came
back **1 failed / 335 passed, exit 1**:

    FAIL test/task.test.ts > splitSections — shared inert-span view (T-055)
         > keeps every live task section split byte-identical to the pre-pass result
    AssertionError: expected [ { …(3) } ] to deeply equal []

**THE CAUSE WAS ONE LINE OF THIS CARD.** Describing the pin, these notes
wrote the phrase *"by parsing its own"* followed by a bare triple-backtick
`json` INLINE — which opens a fenced block that never closes.
`blankInertSpans` treats a top-level unclosed fence as inert through EOF
(`src/inert-spans.ts` says so in as many words), so every `##` heading
after that point was blanked; the post-T-055 splitter found fewer sections
than the pre-pass one, and the equivalence body reported this file. Fixed
by spelling it as an inline `json` code span instead. Re-run: **336/336,
exit 0.**

This is the CONVENTIONS bullet's own failure mode reproduced exactly — a
commit whose docs/ diff is one markdown file reddening a code suite three
layers away, under a title about section splitting — except that it was
caught by the author at the gate rather than by the next executor. Worth
recording because the trap is invisible while writing: the fence looks
like prose, the card renders acceptably, and nothing about the error
message points at the sentence that caused it.

### THE SUITES THE GATE NAMED, AND MAIN MOVING UNDER THE LANE

All three named suites were run, at the lane's final commit:

- `npx vitest run` from lib/parser/ — **336/336, exit 0** (after the fence
  repair above; the failing run is recorded there rather than hidden).
- `npm test` from app/ — **1047/1047 across 49 files, exit 0**. Needed the
  fresh-worktree order first: `npm ci` + `npm run build` from lib/parser/,
  then `npm install` + `npm run build` from app/, each exit 0.
- `npm test` from tools/e2e/ — **319 passed / 2 failed, exit 1**, on
  `NPUTER_E2E_PORT=14167`. The port is DERIVED FROM THE LANE (T-167) and
  not defaulted, because ports are machine-wide and three sibling lanes
  are live; `lsof -nP -iTCP:14167 -sTCP:LISTEN` read **0 rows immediately
  before binding**. Chromium was already in the machine-wide playwright
  cache; nothing was downloaded.

**THE TWO FAILURES ARE NOT THIS LANE'S, AND THAT IS MEASURED RATHER THAN
ASSERTED.** Both are in `tests/session-economics.spec.ts`, both share one
cause, and the cause is a brief refusal:

    fences are not disjoint: T-154-s2 tools/e2e against T-157 tools/e2e
      — the same entry (lane-protocol rule five).

Those bodies shell out to `brief.mjs --task T-157`, and `T-157-s2`
(`status: parked`, `touches: [tools/e2e]`) collides with the LIVE LANE
`T-154-s2` (`status: building`, `touches: [.claude, tools/e2e,
docs/CONVENTIONS.md]`). Neither card is in this lane's diff. **Reproduced
at main's own tip in a detached worktree with not one line of this diff
present — `exit 1`, same refusal, at `16f4821`.** It is a live-environment
condition of the board — the spec hard-codes `--task T-157`, so it reds
for as long as any lane holds `tools/e2e` — and it will clear itself when
T-154-s2 lands. Routing it is not this card's to do from inside a fence
that cannot reach `tools/e2e`; it is named here so the next reader does
not attribute it to this merge.

**AND MAIN MOVED UNDER THIS LANE MID-SESSION.** The fence manifest and the
opening brief were stamped at `51fa31c`; main is now `16f4821` — standing
triage sitting #3 plus its STATE regeneration, two docs-only first-parent
commits. Every gate above was RE-DERIVED against the new tip rather than
left at the old one, and `git merge-tree --write-tree` is clean against it
(`$?=0`, same five paths). One consequence worth naming: sitting #3 took
the suggested column 14 → 0, so **`T-167-s9` filed by this lane is a
post-sitting arrival** and queues for T-159's metabolism rules rather than
joining that sweep.

### The bump question — re-derived here, and it agrees with the sitting

The ruling on this card is NO BUMP, and a lane may not decide it; it may
re-derive it, and a derivation that disagreed would be news. Both tests
re-derived at this lane's own ref:

- **Test 1, SHIPPED BYTES — fails.** `git grep -h 'rel: "'
  app/src-tauri/src/agent/kit.rs` prints fourteen entries; the only
  `runtime/` one is `runtime/nputer.yaml`. `sessions-schema.md` is not
  among the bytes the kit materialises.
- **Test 2, GRAMMAR — fails.** `.nputer/sessions.json` is runtime state,
  losable by charter; it is not a field, status, normative table or
  contract row governing what a card, room, brief or role may say.

No version stamp moved and no `KIT_FILES` entry was touched. **Note for
the record that this lane now `include_str!`s a method file that is NOT in
`KIT_FILES`** — that is compiling it in for a test to read, not shipping
it, and `the_snapshot_table_covers_every_method_scaffold_file` walks only
`docs-templates/`, `adapters/` and `tasks/`, so `runtime/` is outside its
sweep. The two mechanisms are deliberately unrelated and the distinction
is worth one sentence here because the file paths look identical.

### Where the brief was wrong

Nowhere that mattered. Two additions rather than corrections: ROW 8 named
the METHOD EVAL GATE's trigger but the advisory did not flag that this
diff fires it (it does — `method/**`); and the ROW 11 note that more than
one ceremony row matches size S resolves, for this card, to the
**shipped-code row** — `app-agent` is a registry slug and the shipped
partition is read off `touches:`, which the promotion note already ruled.
So this lane stamps `verifying` and does NOT self-integrate.

### Criteria unmet

None. All five acceptance criteria are met.

### Suggestions filed

`T-167-s9` — the `.nputer/genesis/transcript.jsonl` half of this same
document has no schema page and no pin at all.

## Verdicts
