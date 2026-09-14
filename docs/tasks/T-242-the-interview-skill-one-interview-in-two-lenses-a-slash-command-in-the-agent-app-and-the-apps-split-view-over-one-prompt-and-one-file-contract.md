---
id: T-242
title: The interview skill — one interview in two lenses, a slash command in the agent app and the app's split view, over one prompt and one file contract, so the board materializes beside the chat whichever window holds it
feature: F-03
milestone: 4
size: M
tier: guarded
priority: 1
status: building
suggested_by: "@human (2026-09-03): \"Should we move the interview also to Claude or Codex as a skill or in other format?\" — ruled with ADR-021 (rooms/cockpit-or-mirror.md RE-RULED)"
blocked_by: []
touches: [method/skills/, method/interview/plan-interview.md, method/interview/decomposition.md, method/adapters/CLAUDE.md, method/adapters/AGENTS.md, app/src-tauri/src/agent/kit.rs, tools/e2e/scripts/cli.mjs, tools/e2e/scripts/interview-skill.mjs, tools/e2e/package.json, tools/e2e/tests/interview-skill.spec.ts, tools/e2e/tests/interview.spec.ts, docs/CAPABILITIES.md, docs/INDEX.md, docs/architecture/graph.json]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-021 decision 3: the interview ships as ONE interview in two
lenses. ADR-017 already makes chips come from the watcher seeing files
and never from what the model said, so a skill-driven interview with
the app open beside it IS the split view with the vendor holding the
chat half. This card makes the skill form real without forking the
interview: one prompt (method/interview/plan-interview.md's banks), one
file contract (the five governing docs and the first cards landing
where genesis lands them), and the app's runner reading the same
prompt so the two lenses cannot drift.

## Acceptance criteria

- WHEN a Claude Code session invokes the interview entry (`/supertaskr-interview`) in a folder with no plan THE entry SHALL ask the banks in method/interview/plan-interview.md's order and write each banked answer to the SAME paths the app's genesis writes (derived from the runner's own code, never restated here), so the app's watcher renders the chips unchanged; and the interview SHALL complete the canonical file contract — the governing documents from their templates, the adapter files at the project root, the decomposition into the first cards on the board, the planner's resume and overwrite rules — with neither the source checkout nor the app present; pinned by a fresh-project body that installs the delivered entry into a scratch project outside the checkout, runs the delivered materialization there, and asserts that every file the contract names resolves, the source never bridged by copying files into a fabricated method/skills/ inside the fixture.
- WHEN the entry is built THE pack SHALL be ONE generated file, method/skills/supertaskr-interview/SKILL.md, generated from the canonical sources (the banks, method/interview/decomposition.md, the templates and the adapter files the contract names) by a generator in the tree with no second authored copy, held current by a body that regenerates it and compares bytes; IF the self-contained file cannot stay a small implementation THEN the card SHALL take the whole-pack route (T-241-s6) and say so by a dated append rather than ship a pack that installs half of itself.
- WHEN the skill and the app's runner are compared THE prompt text SHALL come from ONE file — a parity body asserts both paths consume the same bytes of method/interview/plan-interview.md, with a control that reds when either path is pointed at a different file; harness-specific kickoff context is not required to be byte-identical.
- WHEN the entry is installed THE install SHALL be the user's own explicit command (`supertaskr install`) into the project's skills directory the harness discovers (the path the app's own discoverer reads, never restated here) — an identical file a no-op, a differing file refused without `--force`, `--dry-run` honoured — and opening a folder in the app SHALL install nothing (T-167's read surface stands); the first slice is project-level, user-level installation deferred; pinned by bodies.
- WHEN the packaged command is built THE tarball SHALL carry the generated SKILL.md (tools/e2e/package.json's files list), generated from the canonical sources at pack time, so a fresh folder receives the entry without the checkout; packaging is approved by this ruling and publishing stays the owner's (T-266).
- WHEN the interview ends THE entry SHALL land the board and print the closing line — the project plan and the initial task board are saved in this folder; to view them in Supertaskr, open the app and choose "Open folder…"; the files can also be worked on in this coding-agent session — and SHALL print no unimplemented command and start no second interview; IF the app is not installed THEN the interview SHALL still have completed to files; the automatic-open integration is rechecked when T-243 lands; pinned by a body.
- WHEN skill packs are present in the opened project (T-167) THE skill-driven interview SHALL load and stamp them exactly as the app's does.
- WHEN the harness is Codex THE entry SHALL describe Codex support as deferred and unverified for this entry — the first delivery is Claude Code only, the prompt-file route is not claimed proven, and the product's provider-flexible goal is not narrowed by it.
- WHEN the lane runs THE method eval gate SHALL run since method/ moves, the cargo suite SHALL run since app/src-tauri/src/agent/kit.rs's KIT_FILES gains the new pack file (the parity walk over method/skills refuses a half-carried pack), the graph SHALL be regenerated for the kit.rs edit, and `npm run capabilities` SHALL run for the new spec.

## Former criteria — 2026-09-03, superseded by the consolidation of 2026-09-14 (kept verbatim)

- WHEN a Claude Code session invokes the interview skill in a folder
  with no plan THE system SHALL ask the banks in plan-interview.md's
  order and write each banked answer to the SAME paths the app's
  genesis writes (derive the paths from the runner's own code, never
  restate them here), so the app's watcher renders the chips unchanged.
- WHEN the skill and the app's runner are compared THE prompt text
  SHALL come from ONE file — a test SHALL fail if the two read
  different bytes.
- WHEN the interview ends THE system SHALL land the board (docs/tasks
  with the first cards) and print the one line that opens the mirror
  on this folder — T-243's entry — and IF the app is not installed
  THEN THE interview SHALL still complete to files (terminal-forever).
- WHEN skill packs are present in the opened project (T-167) THE
  skill-driven interview SHALL load and stamp them exactly as the app's
  does.
- WHEN the agent is Codex THE prompt-file form SHALL be measured before
  it is claimed; IF unmeasured THEN the report SHALL say so and ship
  the Claude form alone.
- The method eval gate SHALL run since method/ moves.

## Amendment of 2026-09-13 — native interview delivery at the current stage (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — native interview delivery at the current stage. This card delivers the native-harness interview over the existing canonical banks and project-file contract, preserving the shipped app behavior and adding no in-app steering conversation. Before dispatch, its delivery draft names the discoverable entry, every required pack file, the fresh-project installation or materialization path when the app is absent, and the exact corresponding implementation and test fence. A shipped mechanism used by that route is a landed prerequisite; an unlanded installer is not assumed available. A fresh-project body exercises the delivered entry and its actual referenced files outside the source checkout. The prompt-parity body checks the canonical interview source consumed by both paths, with a control that catches either path using a different source; harness-specific kickoff context is not required to be byte-identical. The interview always completes to files. Until T-243's external-open entry lands, it reports that limitation and gives the existing manual way to open the folder in the mirror; it does not print an unimplemented command. The automatic-open integration is rechecked when T-243 lands. The current skill-pack and honestly measured harness-coverage criteria remain. This is a scope decision, not a complete fence: the seat brings a concrete delivery-and-fence draft before this card is cut.

## Rulings of 2026-09-14 — the six questions of the delivery-and-fence draft (the owner, on the seat's draft as amended by the Codex orchestrator's review; the draft is the seat's scratch file delivery-draft-T-242.md, drawn at 0d194f7c)

The owner ruled the six questions the draft left open: (1) a write into an opened project's .claude/skills/ happens only through the user's explicit install command, with the installer's identical-file no-op, differing-file refusal, `--force` and dry-run kept, and opening a folder installs nothing; (2) one generated SKILL.md, on the condition that it is genuinely self-contained — copying the banks alone is insufficient, the fresh-project demonstration must complete the interview's whole file contract without the checkout or the app, and the whole-pack route (T-241-s6) is the fallback if that stops being small; (3) Claude Code only for this first delivery, Codex described as deferred and unverified rather than the old prompt-file route implied proven, the product goal staying provider-flexible; (4) the tarball carries the generated method text, generated from canonical sources with no second authored copy, packaging approval separate from publishing approval; (5) project-level installation first, user-level to follow without blocking it; (6) the closing line tells the user the plan and task board are saved in the folder and to open the app and choose "Open folder…" to view them, not to start another interview. The criteria above are the consolidated effective contract; the criteria of 2026-09-03 stand verbatim under their own heading; the amendment of 2026-09-13 stands as the scope decision it was. The fence is refreshed from the draft: method/skills/ as the tracked directory token (a new pack directory cannot be fenced by its own file paths), the kit's table, the installer's source, a reservation for the generator beside it, the package manifest for the tarball, a new spec for the bodies, and the generated artefacts the lane moves. Queue: after T-290 (which holds tools/e2e/scripts/ and tools/e2e/tests/ whole); disjoint from T-320 and the T-312 rerun by their fences at 21c0dc9a, so it may run beside either.

## Implementation notes

Built by claude-opus-5@subagent in lane T-242, base 5656a054, tip f4958baa
before this append. Every figure below was measured in that lane at
f4958baa unless another ref is named.

**The shape.** The entry is ONE generated file,
`method/skills/supertaskr-interview/SKILL.md`, 27706 bytes at f4958baa,
written by a new generator `tools/e2e/scripts/interview-skill.mjs`. The
generator reads the canonical sources and embeds each one as a fenced
block labelled with the path it lands at: the banks, decomposition, the
planner's resume and overwrite sections, the docs templates, both
adapters and the card skeleton. Only the framing prose is authored, and
it is authored in the generator, so the artifact has no hand-edited
half. The round trip is checked inside the generator itself — every
block it emits is read back through the same reader the fresh-project
body uses, and a block that does not come back byte-identical is a
refusal rather than a document that looks complete and materializes
something else.

**The kit root is the runner's.** The seed destinations are derived, not
typed: the docs tree from the banking map's stage-0 row applied to
whatever `method/docs-templates/` really holds, the adapters at the
project root because that row says so, and the interview files plus the
card skeleton under the kit root read out of `KIT_REL_DIR` in
`app/src-tauri/src/agent/kit.rs`. A folder interviewed through the skill
and a folder interviewed in the app therefore hold the same bytes at the
same paths.

**What does not ride, and why the small-file condition holds.**
`method/tasks/TASK-FORMAT.md` is 53760 bytes at 5656a054 and
`method/roles/planner.md` is 7212; the app's own discoverer caps one
pack file at 65536 bytes (`MAX_SKILL_BYTES` in
`app/src-tauri/src/agent/skills.rs`), so TASK-FORMAT alone would breach
it, and planner.md's step 4 points at TASK-FORMAT, which would ship a
pointer to a file the folder does not have. The generated file sits at
27706 bytes, roughly 42 per cent of that cap, so the whole-pack fallback
the card names is not reached and no dated append is owed. A cargo body
asserts the margin and its failure message names the fallback.

**The installer.** Its SOURCE root is now derived and its DESTINATION
root is not. A checkout still installs its own tree's skills, byte for
byte as before; an installed package installs what it was packed with.
The package stages its copy under `tools/e2e/dist/`, the one directory
this repository's `.gitignore` already covers at every depth, so the
staging can never be committed by accident. `prepack` generates it from
the canonical sources and REFUSES when the committed artifact is stale,
so a pack of a stale tree cannot ship two different files under one
name; `postpack` removes the staging.

**The tarball**, measured by `npm pack --dry-run` from `tools/e2e/` at
f4958baa: 35 files, 630.1 kB packed and 2.0 MB unpacked, carrying
`dist/method/skills/supertaskr-interview/SKILL.md` at 27.7 kB alongside
`bin/supertaskr.mjs`, `package.json` and the 32 files of `scripts/`
(boot-port, brief, capabilities, card-figures, card-preflight,
checkout-currency, ci-owed, cli, dispatch-brief, dispatch-order,
docs-gate, docs-scan, gate-run, health-bands-run, health-bands.config,
health-bands, interview-skill, lane-fence, lane-lock, lint-tokens,
merge, orphan-drill, push-checks, range-rule, rename-scan, run-record,
session-economics, settings, tauri-boot-check, token-scan, undo,
xargs-dialect).

**In-fence follow-through** — changes inside the fence beyond the
minimum the criteria name, each argued:

- `npm run capabilities` and `npm run capabilities:check` in
  `tools/e2e/package.json` now chain the skill generation and its
  currency check after the census. One command, three generated
  artifacts, for the reason `capabilities.mjs` already gives about the
  index: a separate command is a separate thing to forget. This is what
  makes the bump hazard visible on the runner, since CI already runs
  `capabilities:check` as a step. `npm run skill` and `npm run
  skill:check` exist as the direct spellings.
- `runInstall` gained a `carriedRoot` injection point in its io object.
  Nothing but the suite passes it: a control needs to arrange both a
  package that carried the entry and one that carried nothing, and a
  control that cannot arrange the absent case is not a control.
- The staging step's membership rule is derived rather than listed: a
  pack is carried when its directory is ONE file, and any other is
  skipped with its file count printed. `method/skills/supertaskr-seat/`
  is 5 files at f4958baa, so the tarball carries the interview entry
  alone. That is the shipped installer's one-file-per-skill shape, and
  T-241-s6 is the card that already owns making a whole pack travel.

**Gates, each derived from this lane's own diff.** GRAPH REGEN fires
(`.rs` and `.mjs`/`.ts` outside `docs/`): regenerated, and `index
--check` answers CURRENT at 1230259 of 2145959 bytes, 203 files, 2631
symbols, 2505 edges. BOOT GATE fires (`app/src-tauri/**`): exit 0 with
both startup lines captured, `[supertaskr] project folder:` and
`[supertaskr] window "main" created`, on port 15242. DOCS GATE fires
(`docs/CAPABILITIES.md`, `docs/INDEX.md` and the card move, all read by
code suites): `npm run lint:docs` exit 0 over 246 docs-shaped sites in
49 files. METHOD EVAL GATE fires (`method/**` moves): exit 0 over 12
model-free evals. AUDIT GATE and THE BLESSED GATE declare no merge-diff
trigger, so neither is one of these.

**The census** moved from 1163 to 1175 behaviours across 42 spec files,
and `docs/INDEX.md` moved with it in the same command.

**The method stamp is NOT moved here.** `method/` text moves in this
lane, so `--bump` is owed at the merge and is the seat's. Note the
coupling before running it: the bump rewrites the version parenthetical
in `method/interview/plan-interview.md`, which the generated artifact
carries verbatim, so the bump stales it. Run `npm run capabilities`
from `tools/e2e/` after the bump and stage the regenerated
`method/skills/supertaskr-interview/SKILL.md` in the same commit, the
way the graph regen is staged. T-242-s1 is filed to make that a step of
the verb rather than a sentence here.

**Drills.** Fifteen poison drills, one per body this lane adds, each
planted at the site its property lives, each run at commit f4958baa,
each restored with `git restore --source=HEAD --staged --worktree` and
each restore proved by sha256 against `git show HEAD:<path>`. All
fifteen went RED. The twelve e2e mutants: the generator's framing
heading moved without regenerating (currency); a template body
truncated in the seed plan (block bytes); the banks seed's destination
renamed (parity); the seed marker dropped from the scaffold prose (the
prose against its own reader); the app's folder label dropped from the
closing line; "unverified" dropped from the harness section; the packs
section pointed at a different directory; the carried-root fallback
deleted from the source-root derivation; the collision guard disabled;
a harness directory created by every verb; the staging rule made to
carry every pack; `dist/` dropped from the manifest's files list. The
three cargo mutants: 70000 bytes of padding into the generated file (the
cap); a second file planted beside the pack (one-file); the adapters
dropped from the seed plan (the scaffold walk).

**Suggested cards filed:** T-242-s1 (a method bump stales the generated
artifact and the verb's bump step does not regenerate it), T-242-s2 (a
bare install places the entry in the Codex prompt directory, where this
delivery is explicitly unverified), T-242-s3 (user-level installation,
deferred by the ruling that took the project-level slice).

**Noticed and not carded.** The skill's materialization writes no
`kit.json` beside the seeded kit files, where the app's `materialize`
writes a stamped manifest; an audit of a skill-driven genesis therefore
cannot read which method version scaffolded it off the kit root alone,
though the seeded banks carry their own version parenthetical. Too small
to card on its own and it belongs with T-241-s6's whole-pack work. Both
adapter templates and the STATE template point at
`method/docs-protocol.md`, which no genesis carries in either lens — the
kit's table does not hold it and neither does this entry — so that
pointer is dangling in a scaffolded folder today and this card changes
nothing about it either way.

### What the owed set found, and what was done about it

The battery at 80ddb4a7 came back parser GREEN 454, app GREEN 1171, rust
GREEN 661 across 18 targets, e2e RED with 10 of 1179 bodies failing. Two
causes, one this lane's and one not.

**Mine, corrected at aba731ed.** Seven bodies in
`tools/e2e/tests/docs-input-gate.spec.ts` red on the DOCS GATE's
silent-miss tripwire: the new spec holds this repository's root AND
joined the literal `docs` onto a scratch project root, so the scanner
could not tell a scratch path from a read of this repository's own
`docs/` and said so. It is right not to be able to. Both sites are now
derived — the scratch markers are `ROOT_MARKERS`, which is what
`findProjectRoot` really looks for, and the fresh-folder contract's
destination is read out of the banking map's stage-0 row. That leaves
the expectation anchored in normative method text instead of in the
generator's own view of it, so a generator that stopped seeding a
template still reds. `unlinkedFiles()` is empty again, the root-anchor
account balances against `ROOT_ANCHOR_LEDGER`, a code-only diff owes
nothing again at exit 0, and `docs-input-gate.spec.ts` answers 72 of 72.
The same commit gave the delivered entry the two redirects described
above.

**Not mine, filed as T-242-s4.** Three bodies in
`tools/e2e/tests/push-guard.spec.ts` red with EACCES copying
`docs/CONVENTIONS.md` into the seat fixture. The fixture copies every
`docs/*.md` flat and then copies what `conventionsFiles()` returns, and
since T-290 that set returns the index itself as well as its chapters —
so the index is copied to one destination twice. `copyFileSync` gives
the destination the source's mode, the fence makes out-of-fence files
read-only in a lane, and the repeat copy onto a `0444` destination
fails. Reproduced in isolation at this lane's tip: a read-only source
copied twice is EACCES, a writable one is fine. `push-guard.spec.ts` and
`docs-scan.mjs` both last moved at 7e0ee2c9 (T-290), before this lane's
base, and this lane's diff touches neither file, nor
`docs/CONVENTIONS.md`, nor any file mode. It is invisible on the runner
and in the integration checkout, where the index is writable. An ask was
parked with the seat for a widening to fix it; the card stands either
way.

**The drills were re-run whole at aba731ed** rather than left at the
pre-correction commit, since the corrections moved both the spec and the
generated artifact. All fifteen went RED again, each restored and each
restore proved by sha256.

### The graded reading, at cb21ebff

The owed set was run again at the corrected tip, which is the reading
this lane hands over: parser GREEN 454 bodies, app GREEN 1171, rust
GREEN 661 across 18 targets, e2e RED at 1176 passed and 3 failed. The
three are exactly the push-guard bodies T-242-s4 names, and nothing
else: every one of the seven the DOCS GATE reported at 80ddb4a7 is
green. The earlier battery is superseded by this one and is recorded
above only because it is what found the corrections.

The tarball at this tip, by `npm pack --dry-run` from `tools/e2e/`: 35
files, 630.7 kB packed, 2.0 MB unpacked, carrying
`dist/method/skills/supertaskr-interview/SKILL.md` at 28.4 kB. The
generated entry is 28427 bytes, against the 65536 the app's own
discoverer accepts.

## Verdicts
