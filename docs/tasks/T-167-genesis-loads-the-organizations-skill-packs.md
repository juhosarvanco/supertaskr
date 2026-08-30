---
id: T-167
title: Genesis loads the organization's skill packs — the playbook's own SKILL.md format discovered in the opened project, carried into the kickoff, and stamped into the session record
feature: F-03
milestone: 4
priority: 2
size: M
status: building
blocked_by: []
touches: [app-agent]
suggested_by: "@human ruling (2026-08-30, loop-customization sitting): two-track sitting approved — track 1, wire skills into genesis, is form-independent engineering and proceeds"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT THE LOOP-CUSTOMIZATION SITTING (2026-08-30), planned at
filing on @human's ruling.** The playbook's Stage-2 sentence made
real: *"Claude takes the accepted intent and produces a requirements
and design spec, guided by the organization's skills for brand,
security, compliance, and UX."* This card is the smallest slice the
room named — genesis only, no per-stage slots, no UI — and it is
deliberately FORM-INDEPENDENT plumbing: whatever @human rules on the
customization form (T-168's brief), skills discovered from files are
the substrate both forms share.

## Acceptance criteria

- WHEN a genesis session starts THE runner SHALL discover skill packs
  in the OPENED project at `.claude/skills/<name>/SKILL.md` — the
  playbook's format, adopted verbatim: frontmatter with name,
  description, and trigger conditions; body with the guidance. A pack
  that fails to parse is REPORTED by name and skipped, never a crash
  and never silently absorbed.
- THE kickoff assembly SHALL carry the discovered skills into the
  planner's context the way it already carries the kit — and the
  seat SHALL derive where that assembly lives rather than trusting
  this card's guess; the fence is `app-agent`, and if the true
  assembly point sits outside it, STOP and record (the T-163
  criterion-1 precedent).
- THE session record SHALL stamp WHICH packs were loaded, by name and
  content hash — the provenance half, D5's sibling: "which policy
  shaped this decision" must be answerable later from files alone.
- WHEN no packs exist THE behaviour SHALL be byte-identical to today
  — measured, not assumed: the existing genesis tests green unchanged
  is the pin.
- GUARD RULES: a fixture pack that must appear in the assembled
  kickoff (positive control), a malformed pack that must be reported
  and skipped, and a no-packs run proven identical — pinned in the
  cargo suite, mutants disposed per the POISON DRILL bullet.
- THE skills directory is a READ surface: nothing in this card writes
  into `.claude/skills/`, and D3's narrow ruling is untouched.

## Fence note at filing

`touches: [app-agent]` — disjoint from every queued card at filing
(derive at dispatch). The e2e seat is NOT held by this card.

PREFLIGHT RULING (2026-08-30): the finding "STALE PATH .claude/skills" is RULED ACCEPTABLE — `.claude/skills/<name>/SKILL.md` names a RUNTIME surface in the OPENED project (the project genesis is run against: a temp directory in the smoke, a fixture directory in tests), never a tracked path in this repository. This repository deliberately has no such directory today, and the card creates none here; the criteria's third bullet already states the read-only nature of the surface. The preflight cannot know an opened-project path from a repo path, which it says honestly in its cannot-rows — this ruling is the missing knowledge, dated.

## Implementation notes

Built in lane `task/T-167-genesis-skills`, worktree
`/Users/ujju/Projects/nputer-T-167`, cut from checkpoint `1d297c9`.
Every figure below carries the command that derived it or the ref it was
stamped at.

### The lane took the dispatch stamp before it built

The lane was cut one commit BEFORE the dispatch stamp `1bcdb4c`, so its
copy of this card said `status: planned`, named no builder, and carried
no PREFLIGHT RULING. The first commit in the lane (`294a3ca`) brought
the card to main's bytes, so the ruling this work was done under is the
one on this card. Recorded rather than absorbed silently: a lane that
quietly builds under a ruling it cannot show is a lane whose reader
cannot check it.

### Where the kickoff assembly actually is — INSIDE the fence

**`app/src-tauri/src/agent/kit.rs`**, functions `assemble_kickoff`,
`assemble_resume_kickoff` and `assemble_kickoff_for`. Derived from the
call sites, not from the card's guess:

    git grep -n "assemble_kickoff" app/src-tauri/src app/src-tauri/tests app/src

answers `agent/mod.rs` at `start_genesis`, `fresh_genesis` and the
hand-driven `kickoff()`, plus a comment in `app/src/genesis/InterviewChat.tsx`
noting the function is Rust-only. All three call sites and the assembly
itself sit under `app/src-tauri/src/agent/`, inside `app-agent`. **No
STOP was owed** — the T-163 criterion-1 precedent did not fire.

### What was built

- **`app/src-tauri/src/agent/skills.rs` (new)** — `discover(project_dir)`
  walks `<project>/.claude/skills/`, sorts by directory name, and reads
  each `SKILL.md`. Answers `Discovered { packs, rejected }`; a project
  with no such directory answers empty and never an error.
- **`kit.rs`** — a private `skills_clause()` and three `*_with` forms
  (`assemble_kickoff_with`, `assemble_resume_kickoff_with`,
  `assemble_kickoff_for_with`) taking an already-discovered pack list.
  The one-argument forms keep their signatures and discover for
  themselves, so **no existing kit test was edited at all**.
- **`sessions.rs`** — `SessionEntry.skills: Vec<SkillPack>`, `#[serde(default,
  skip_serializing_if = "Vec::is_empty")]`.
- **`mod.rs`** — `report_skills()` runs ONE discovery per spawn, logs
  every rejected pack by name through `docs_watch::sanitize_for_log`, and
  its answer feeds BOTH the prompt and the stamp; the stamp is carried
  forward at every turn completion, where the entry is rebuilt from
  scratch.

### Decisions that are deviations, with their reasoning

1. **The required frontmatter set is `name` + `description`, not three
   keys.** The card's first criterion names "name, description, and
   trigger conditions". In this format the DESCRIPTION states the trigger
   conditions ("Use when …"); there is no separate key, and nothing in
   this repository spells one — `git grep -rn -i "trigger condition"
   docs/ method/` returns only this card and the room. Requiring a third
   key would make every genuine playbook pack malformed, which is exactly
   what `docs/rooms/loop-customization.md` design seed 1 forbids
   ("compatibility IS the import UX"). So `SkillPack::triggers` carries
   the description, and an explicit `when:` is ACCEPTED and never
   required. Unknown keys are ignored rather than refused.
2. **The content hash is a hand-rolled SHA-256.** The workspace's one
   hash is `nputer-index`'s blake3 wrapper, which is `pub(crate)` in a
   crate this fence does not reach, behind a dependency this crate does
   not declare — reaching it edits `app/src-tauri/Cargo.toml` or
   `crates/nputer-index/`, both outside `app-agent`. (`sha2` IS in the
   transitive tree under tauri; a transitive crate is not a usable
   dependency either.) The precedent is `sessions::iso8601_utc`,
   hand-rolled for the same "zero new crates" reason. It is pinned by the
   published vectors in
   `sha256_matches_the_published_vectors` — empty, `abc`, the 56-byte and
   the 112-byte messages. Routed as `T-167-s3`.
3. **The kickoff clause NAMES packs rather than inlining them**, which is
   how the kit is already carried: the kit clause names a kit root and
   tells the planner to read the role file there. The packs are already
   files inside the project directory the CLI is scoped to.
4. **The precedence question is surfaced, not answered.** The room
   carries "when an org skill and project CONVENTIONS disagree, who
   wins" OPEN. The clause therefore says the precedence is not yet
   decided and asks the planner to say so on a conflict rather than
   choose silently — a statement of the current state, and deliberately
   not a ruling this lane had no standing to make.

### CONFLICT between the card and the tree, recorded

`method/runtime/sessions-schema.md` names NINE keys and `sessions.rs`'s
header says "field-for-field per" it. This card's third criterion asks
the session record to stamp the loaded packs, which is a TENTH key
whenever any pack loads. The schema is in `method/`, outside this fence.
The key is skipped when empty, so **a packless genesis still writes
exactly the schema's nine keys** and the existing pin
`the_written_registry_matches_the_sessions_schema_field_for_field` is
green with its assertions untouched — but a genesis WITH packs writes a
key that document does not name. Filed as `T-167-s1`; the method-bump
question it raises is triage's, per CONVENTIONS' "what a bump is owed
for" bullet.

### Containment posture

Everything that reaches a prompt, a log line or the registry goes through
`skills::flatten` — control characters become spaces, so a pack cannot
forge a line in a one-paragraph kickoff or in the JSONL transcript — and
is capped (`MAX_NAME_CHARS` 64, `MAX_DESCRIPTION_CHARS` 300). The file
is capped at `MAX_SKILL_BYTES` 64 KiB before it is read, the pack count
at `MAX_PACKS` 32, and a symlinked entry is REPORTED and never followed,
so a pack cannot point outside the project the CLI is scoped to. Nothing
in this card writes into `.claude/skills/`, pinned by
`discovery_writes_nothing_into_the_skills_directory`.

### The three guard rules, and where each is pinned

Each is pinned twice: at the unit level in `kit.rs`/`skills.rs`, and at
the integration level in `tests/agent_runner.rs`, driven through the real
`start_genesis` against the FAKE CLI (`NPUTER_REAL_CLI` never set; no
model was called by anything in this lane).

1. **Positive control** —
   `a_planted_skill_pack_reaches_the_child_and_the_session_record`: two
   planted packs appear in the bytes the child received on stdin, by
   name, path and trigger conditions; are stamped into
   `.nputer/sessions.json` by name and sha256; survive a second turn;
   and never reach argv. Unit sibling:
   `a_discovered_pack_appears_in_the_assembled_kickoff`.
2. **Malformed reported and skipped** —
   `a_malformed_skill_pack_is_skipped_and_never_stops_the_genesis`: an
   unparseable pack and a nameless one are skipped, the good pack beside
   them still loads, nothing of the broken ones reaches the prompt or the
   stamp, and the genesis starts and completes. Unit sibling:
   `malformed_packs_are_reported_by_name_and_skipped`, which asserts the
   REASON for each, not only membership in the rejected list.
3. **No packs, byte-identical** —
   `a_genesis_with_no_packs_sends_and_records_exactly_what_it_did_before`:
   the child's stdin is compared to the kickoff text TRANSCRIBED FROM
   `1d297c9`, not to this build's own other function — two functions of
   one build agree with each other however far both have drifted — and
   the registry entry is asserted to hold exactly the schema's nine keys
   with no `skills` key at all. Unit sibling:
   `the_no_packs_kickoffs_are_byte_identical_to_the_unskilled_text`, plus
   `the_skilled_kickoff_extends_the_unskilled_one_rather_than_rewriting_it`,
   which asserts the pre-T-167 text is a PREFIX of the skilled one.

### POISON DRILL — 19 mutants, 19 one-sided reds, 19 sha256-proved restorations

Run in a DETACHED scratch worktree at `/tmp/d167` (a short root,
`T-133-s5`) with its own `CARGO_TARGET_DIR=/tmp/d167/target` — the
walk-safe name arm (c) prescribes. Drill baseline there: `cargo test -p
nputer` exit 0, 217 lib + 85 integration. Every mutant mutated the
PRODUCTION side only, was shown in a `git diff -U1` before its run, and
was restored with `git restore --source=HEAD --staged --worktree` and
proved by `shasum -a 256` against the pre-mutation hash. M1 was re-run as
M1b under `--no-fail-fast` after the first run stopped at the lib binary;
M5–M19 ran at `1c797df`, M1b–M4 at `8d841bd`.

| mutant | what it broke | reds |
|---|---|---|
| M1b | `skills_clause` returns empty for any pack list | 4 (2 unit, 2 integration) |
| M2 | the clause is appended even with NO packs | 3 |
| M3 | `skills:` dropped from the entry at spawn | 2 |
| M4 | the stamp not carried forward at turn completion | 2 |
| M5 | one SHA-256 round constant flipped | 1 |
| M6 | the hash taken over a 40-byte prefix | 3 |
| M7 | a missing required key is guessed instead of refused | 2 |
| M8 | `flatten` stops replacing control characters | 1 |
| M9 | symlinked entries followed | 1 |
| M10 | discovery order reversed | 4 |
| M11 | the pack-count cap removed | 1 |
| M12 | the file-size cap removed | 1 |
| M13 | discovery writes a marker beside the pack | 1 |
| M14 | the explicit `when:` key ignored | 2 |
| M15 | a folded block indicator taken literally | 1 |
| M16 | hyphenated frontmatter keys refused | 1 |
| M17 | `skip_serializing_if` dropped from the stamp | 2 |
| M18 | the `---` opener check removed | 1 |
| M19 | a missing `.claude/skills/` panics | 37 |

**M18 IS THE ONE THAT CHANGED THE BUILD.** At `8d841bd` the malformed
body asserted only that `no-frontmatter` was in the rejected list, and
deleting the opener check leaves it rejected for a DIFFERENT reason — the
mutant would have survived. The assertion now pins the reason, like its
siblings, and the fix is committed at `1c797df` before M18 ran and died.

### Gates, all UNPIPED

- `cargo test` from `app/src-tauri/` — **exit 0**. 217 lib · 85
  integration (1 ignored — the env-gated real smoke, untouched) · 190
  nputer-index · 10 arch · 4 budget · 16 cli · 3 containment · 3 depth ·
  9 golden · 3 self_graph · 4 watch · 1 doc-test. Lib suite **4.23 s**,
  well under the 9.5 s green line, so the cargo cache cliff did not fire
  (`target/` measured at 2.5 G by `du -sh target`).
- `npm run lint:docs` from `tools/e2e/` — **exit 0**.
- **BOOT GATE, owed by the executor on the same trigger** (my diff
  touches `app/src-tauri/**`): `NPUTER_BOOT_PORT=14733 npm run
  boot:check` from `tools/e2e/` — **exit 0**, both startup lines
  observed: `[nputer] project folder: /Users/ujju/Projects/nputer-T-167`
  and `[nputer] window "main" created`. Port 14733 read to ZERO rows with
  `lsof -nP -iTCP:14733 -sTCP:LISTEN` immediately before; 1420 was read
  once, held by `node` on `[::1]:1420`, and never touched.
- **GRAPH: STALE, and it is a REAL red, not the `--root` false one** —
  the second line prints both counts and a file diff.
  `cargo run -p nputer-index -- index --check --root ../..` from
  `app/src-tauri/`, **exit 1**: committed 1023730 bytes · 189 files ·
  2163 symbols · 2114 edges; fresh 1032605 · 190 · 2195 · 2117. Files
  `+1 ~4` (`agent/skills.rs` added; `kit.rs`, `mod.rs`, `sessions.rs`,
  `tests/agent_runner.rs` moved), edges `+3`. Per CONVENTIONS' GRAPH
  REGEN bullet the regen belongs to the INTEGRATOR at the checkpoint, and
  `docs/architecture/graph.json` is outside this fence — not regenerated
  here.
- **THE GRAPH BUDGET IS THE NEWS IN THAT VERDICT**: the fresh index is
  **1032605 of 1040000 bytes (99.3 %) — 7395 bytes left**, down from
  16270 before this lane. Filed as `T-167-s2`.

### THE MERGE CONFLICTS, AND THE RESOLUTION IS LOSS-FREE — recorded so it is not a surprise

`git merge-tree --write-tree <main tip> HEAD` exits **1** on
`docs/tasks/T-167-genesis-loads-the-organizations-skill-packs.md`. **READ
THE EXIT CODE BEFORE FEEDING THE PATH LIST ANYWHERE** — the RANGE RULE's
own instruction, and the reason the DOCS GATE's first run in this lane
reported "none under docs/" from a range that had produced nothing.

The mechanism is an add/add at the END OF FILE and it is not caused by
the lane's card sync. At the merge base `1d297c9` the card ends with the
fence note; main appended the PREFLIGHT RULING at `1bcdb4c`; this lane
appended the SAME ruling and then these notes. Two insertions at one
point.

**The resolution is "take the lane's file whole" and it loses nothing
from either side**, proved rather than asserted: main's card is a
BYTE-EXACT PREFIX of this one —

    git show main:docs/tasks/T-167-genesis-…md > /tmp/a
    head -c $(wc -c < /tmp/a) docs/tasks/T-167-genesis-…md > /tmp/b
    cmp /tmp/a /tmp/b          # exit 0

so the frontmatter stamp and the ruling are already present, verbatim,
above the `## Implementation notes` heading.

### DOCS GATE — it FIRES, and all three owed suites are green

Run with the RANGE RULE's own command, with the conflict resolved to this
lane's side (`git merge-tree --write-tree -X ours HEAD <main tip>`, exit
0) so the path list is derivable at all. **MAIN MOVED TWICE UNDER THIS
LANE, so both endpoints are ref-bound and the INVARIANT is the path
count**: 10 paths, measured at main `03f4fef` (tree `8e76e51`) and again
at main `bd3ad6e`, with the conflict reproducing at both. Re-derive at
your own ref: 

    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

**exit 1 — it has a verdict**: five paths under `docs/` are code inputs
(this card plus the four suggestions), owed to `npm test` from app/,
`npm test` from tools/e2e/ and `npx vitest run` from lib/parser/. All
three were run in this lane, all UNPIPED:

- `npx vitest run` from `lib/parser/` — **exit 0**, 15 files / 315 tests.
- `npm run build` then `npm test` from `app/` — **exit 0** each, 47 files
  / 1015 tests. (The build first: an unbuilt worktree fails bodies that
  read `app/dist`.)
- `NPUTER_E2E_PORT=14741 npm test` from `tools/e2e/` — **exit 0, 320
  passed** in 3.5 m. Port read to zero rows with `lsof -nP -iTCP:14741
  -sTCP:LISTEN` first; run in this WORKTREE, never the main checkout, and
  `git status --short` is empty afterwards, so the lane's seven planted
  control bytes all came back.

Also run, though it is a CI step rather than a merge-diff gate, because
this lane adds a tracked `.rs` file to the CONTROL corpus:
`npm run lint:tokens` from `tools/e2e/` — **exit 0**, clean (TOKEN 155
files, CONTROL 925 tracked text files).

### Not touched

`app/src/lib/agent-store.ts` and `app/test/` are unchanged — the app and
parser suites above were run because the DOCS GATE fired on the card
edits, not because the TypeScript fence moved. No UI exists for this
card, per the room's FORM-FIRST ruling.
`resume_genesis`'s short nudge does not re-name the packs and does not
re-stamp; the stamp survives a resume because the completion path
carries it forward. Whether a resumed session should be re-briefed on
packs is filed as `T-167-s4`.
