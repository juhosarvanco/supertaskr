---
id: T-241-s6
title: "The seat pack installs from where genesis actually put it, whole, to where each harness actually looks — one fresh-project path per harness, and its two checks run by a gate"
feature: F-04
milestone: 4
size: M
priority: 7
status: suggested
suggested_by: "the pile-2 sitting of 2026-09-13 (the owner's approval of 2026-09-13): T-241-s1, T-241-s2 and T-244-s3 folded; each source's full text is under its absorbed heading below"
blocked_by: []
touches: [app/src-tauri/src/agent/kit.rs, app/src-tauri/src/agent/skills.rs, method/skills, tools/method-evals, tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts, docs/design/cross-harness-plan.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

# T-241-s6 — the seat pack installs from where genesis put it, whole, to where each harness looks

Absorbs: T-241-s1, T-241-s2, T-244-s3 (2026-09-13, the pile-2 sitting, the owner's approval of 2026-09-13). The three files are removed in the same commit as this line; their obligations sit in the criteria below tagged with their source, and each full text is kept under its absorbed heading.

## What was measured

At c9a6be65: genesis writes the pack under the kit directory it materializes per genesis (kit.rs, `KIT_REL_DIR`, `skills/supertaskr-seat/`); `supertaskr install` reads `method/skills/<name>/SKILL.md` and copies that one file (cli.mjs, `SKILL_SOURCE_DIR`), so a project genesis just created has nothing the installer can find, and a project that does has the entry file without its two references and two scripts; the Codex adapter's destination (`.codex/prompts/<name>.md`) and the recorded discovery measurement (`.codex/skills/<name>/SKILL.md`, docs/design/cross-harness-plan.md, from T-246) disagree; the pack's two checks run by hand only. The three sources' own measurements are kept whole below.

## Acceptance criteria

- BEFORE any write THE decision whether the genesis stage may write one pack directory under the opened project's `.claude/skills/` SHALL be obtained on the record, since skills.rs's header states that surface is a READ surface (the preflight ruling of 2026-08-30); this card is sized for either outcome and SHALL NOT assume the write. (absorbed from T-241-s1)
- WHEN a fresh project is scaffolded THE installer SHALL read the pack from ONE declared source location that genesis actually populates (either the kit directory genesis writes, or `method/skills/` populated by genesis — declared on this card, never bridged by copying files into `method/skills/` inside a fixture), and SHALL install the WHOLE pack — SKILL.md with its references and scripts, each installed file byte-identical to its source and their relative paths intact — so the installed skill's companion files resolve. (absorbed from T-241-s1 and T-244-s3)
- FOR EACH supported harness THERE SHALL be one fresh-project acceptance body: materialize the kit, perform the chosen installation or run the exact fallback command the kickoff shows the user, then show, with a negative control (a pack placed where the harness does not look is NOT found), that the harness's discovery finds the installed skill and that its companion files resolve; the destination per harness (Claude: `.claude/skills/<name>/`; Codex: the repo-local shape the recorded measurement names, or a new measurement with a negative control that supersedes it on the record) SHALL be pinned against that evidence, and docs/design/cross-harness-plan.md amended if the measurement moves. IF automatic installation is not chosen THEN the kickoff SHALL say the pack is carried-but-not-installed and name the one command, and that command SHALL work from what genesis actually created. (absorbed from T-241-s1 and T-244-s3)
- THE installer's existing protections SHALL carry forward to the whole-pack installation, pinned by the existing bodies or their successors: a source holding no pack refuses (the empty-source refusal); a destination whose bytes already match is a no-op that leaves it unchanged and succeeds; a destination whose bytes differ refuses BEFORE any write unless `--force` was supplied, the collision check running over every file the whole pack would write; and `--dry-run` prints the plan and writes nothing. (absorbed from T-244-s3; the rule as cli.mjs's runInstall has it at the base)
- WHEN the method eval gate runs THE suite SHALL run both pack checks (golden-check.mjs, host-command-check.mjs) against the repository and both `--selftest` arms and SHALL fail on a finding from either; the wiring SHALL read the count as well as the exit (a check that compared zero commands or loaded zero golden fields exits 3 by itself, surfaced as COULD-NOT-RUN, never a pass); IF the eval suite is judged the wrong home THEN the card SHALL say so and route the wiring to the gate that fits rather than adding a fifth standing gate. (absorbed from T-241-s2)

## Absorbed from T-241-s1 — Genesis carries the seat skill into the kit and nothing installs it where either harness looks — the materialized copy lands at a path both discoverers were measured NOT to read (kept whole)

Title as filed: "Genesis carries the seat skill into the kit and nothing installs it where either harness looks — the materialized copy lands at a path both discoverers were measured NOT to read"

Filed as: status suggested, priority 12, size S, touches [app/src-tauri/src/agent/kit.rs, method/skills], suggested_by executor claude-opus-5@subagent @T-241.

T-241 landed the seat skill in `KIT_FILES`, so a genesis now materializes
the whole pack into `<project>/.supertaskr/genesis/kit/skills/supertaskr-seat/`
beside the rest of the method snapshot. **That directory is not a
discovery location for either harness, and both halves of that were
measured rather than assumed.**

- **Claude**: `app/src-tauri/src/agent/skills.rs`'s `SKILLS_REL_DIR` is
  `.claude/skills`, and `discover` reads that path and only that path.
- **Codex**: `<project>/skills/<name>/SKILL.md` was probed for T-246 and
  is **not** discovered; the three that are — measured again at T-241
  against `codex debug prompt-input` with a negative control — are
  `<project>/.codex/skills/`, `<project>/.agents/skills/` and
  `$CODEX_HOME/skills/`.

So a project scaffolded by a genesis HAS the architect's operating
instructions on disk and no harness offers them. The skill's own install
table says how to fix it by hand, which is the right fallback and the
wrong default: the whole reason the pack rides the kit (ADR-021) is that
a project which got the method without it got the method without its
operating instructions.

### What this card is NOT (T-241-s1)

**It is not "make genesis write into `.claude/skills`" by assumption.**
That directory is the OPENED PROJECT's, and `skills.rs`'s own header
states, twice and in capitals, that the surface is a READ surface and
that nothing in the module writes, moves or deletes anything under it
(the card's dated PREFLIGHT RULING of 2026-08-30). Whether the genesis
stage may write one pack into it is a DECISION, not an implementation
detail — so this card's first act is to get that ruled, and its fence is
sized for the outcome rather than for the guess.

### T-241-s1's acceptance criteria as filed (absorbed into the criteria above)

- WHEN a genesis materializes the kit THE system SHALL either install the
  seat pack where the opened project's harness discovers it, or state in
  the kickoff that the pack is carried-but-not-installed and name the one
  command that installs it — never leave the reader to find out by the
  skill not firing.
- IF the chosen answer writes under `.claude/skills` THEN the ruling that
  makes that surface read-only SHALL be revisited on the record first,
  and the write SHALL be scoped to this one pack directory.
- THE choice SHALL be measured, not asserted: a scaffolded temp project
  followed by the same discovery probe both harnesses were measured with
  at T-241, with a negative control.

## Absorbed from T-241-s2 — The seat pack's two checks run by hand only — no standing gate asks them, so the day the golden or the host-command reference drifts, nothing reds (kept whole)

Title as filed: "The seat pack's two checks run by hand only — no standing gate asks them, so the day the golden or the host-command reference drifts, nothing reds"

Filed as: status suggested, priority 13, size S, touches [tools/method-evals, method/skills], suggested_by executor claude-opus-5@subagent @T-241.

T-241 shipped two zero-dependency programs inside the pack, each of which
reads its own reference at run time and answers:

- `method/skills/supertaskr-seat/scripts/golden-check.mjs` — compares a
  turn's stamp, fence manifest, lane and verdict against the golden's
  `GOLDEN>` field lines, and `--selftest` runs sixteen degradations that
  must each be caught.
- `method/skills/supertaskr-seat/scripts/host-command-check.mjs` —
  resolves every `HOST>` command against that row's own authority file
  and every `CWD>` against the corpus, with its own seven degradations.

**Nothing runs either one on a schedule.** The METHOD EVAL GATE fires on
any merge whose diff touches `method/**`, so it fires the day either
reference changes — and it does not ask these programs anything. The
failure this leaves open is the ordinary one: `docs/CONVENTIONS.md`
rewords a bullet, the transcription in `host-commands.md` silently stops
matching it, and the first reader to notice is a seat that ran a command
that no longer exists.

Both are cheap: no install, no `node_modules`, and both run against a
bare checkout the way the token lint and the method evals already do.
The `--selftest` arms cost nothing at all — they touch no repository
state and hold their fixtures in memory.

### T-241-s2's acceptance criteria as filed (absorbed into the criteria above)

- WHEN the method eval gate runs THE suite SHALL run both pack checks
  against the repository and both `--selftest` arms, and SHALL fail on a
  finding from either.
- THE wiring SHALL read the count as well as the exit: a check that
  compared zero commands or loaded zero golden fields already exits 3 by
  itself, and the gate SHALL surface that as COULD-NOT-RUN rather than
  as a pass.
- IF the eval suite is judged the wrong home — its two sets are a
  model-free half and a model-spending half, and these are neither —
  THEN the card SHALL say so and route the wiring to the gate that fits,
  rather than adding a fifth standing gate.

## Absorbed from T-244-s3 — `supertaskr install` carries its two harness adapters and has nothing to install: `method/skills/` does not exist until T-241 and T-242 land, so the verb's only reachable answer today is its own CANNOT RUN (kept whole)

Title as filed: "`supertaskr install` carries its two harness adapters and has nothing to install: `method/skills/` does not exist until T-241 and T-242 land, so the verb's only reachable answer today is its own CANNOT RUN"

Filed as: status suggested, priority 7, size S, touches [tools/e2e/], suggested_by "executor claude-opus-5@subagent, in T-244's lane, 2026-09-09 — T-244's folded installer criterion is built and its source directory is empty by construction".

### The finding (T-244-s3)

T-244's folded criterion is that the installer *"SHALL target Claude Code
and Codex in v1 and SHALL be built so a third harness is one adapter
entry, never a rewrite"*. That is built and measured: `HARNESSES` in
`tools/e2e/scripts/cli.mjs` holds the two entries, `installPlan` reads
them without branching on an id, and `tools/e2e/tests/cli.spec.ts` proves
the third-harness property by extending the table with a fabricated
adapter and running the same function.

What is NOT provable today is the install itself. The source directory it
copies from is `method/skills/<name>/SKILL.md`, which is T-241's own
first criterion and does not exist yet — `shippedSkills` returns the
empty list, and `supertaskr install` answers CANNOT RUN (3) naming the
absent directory. That is the honest answer and it is the only one
reachable, so the copy path has no body behind it.

### What is owed once T-241 or T-242 lands (T-244-s3)

One body per harness, against a real `method/skills/<name>/SKILL.md`:
`supertaskr install --harness claude` puts the file at
`.claude/skills/<name>/SKILL.md`, `--harness codex` at
`.codex/prompts/<name>.md`, both byte-identical to the source, with the
positive control that a project whose `method/skills/` is empty still
refuses. The destination shapes are T-241's and T-246's to confirm —
T-246 measured Codex's form and is the authority for the second row, and
if its measurement moves, the adapter entry moves with it.

## Implementation notes

## Verdicts
