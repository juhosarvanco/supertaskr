---
id: T-242
title: The interview skill — one interview in two lenses, a slash command in the agent app and the app's split view, over one prompt and one file contract, so the board materializes beside the chat whichever window holds it
feature: F-03
milestone: 4
size: M
tier: guarded
priority: 1
status: verifying
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

### What no body here can reach, said plainly rather than left to be inferred (the verifier's correction 5)

**NO VENDOR SESSION WAS EXECUTED IN THIS LANE.** Nothing above ran a
Claude Code session against the delivered entry, and nothing here could.
Three clauses of the criteria are therefore pinned as GENERATED TEXT and
not as behaviour, and a later reader should not take a green body for
more than it is.

- "asks the banks in their order" is measured as the order the banks
  stand in inside the delivered file. Order-as-asked is not measured.
- "starts no second interview" and "prints no unimplemented command" are
  measured as what the file says — the second as strongly as a file can
  be measured, since the delivered bytes spell no `supertaskr` verb at
  all against the CLI's own verb table. Neither is a reading of what a
  session does.
- `materialize`, which the fresh-project body runs, is the MACHINE
  reading of the seed rule the file's prose gives a session. It writes
  the stage-0 seed files and nothing else: it asks no question, banks no
  answer, writes no card, and applies neither the resume rule nor the
  overwrite rule, both of which ride in the file as text for a reader.
  What that body proves is that the whole stage-0 file contract
  materializes out of the DELIVERED bytes with neither the checkout nor
  the app reachable, which is the criterion's hard half — not that an
  interview ran.

The Codex half is the same shape and the delivered file already says it
in its own words: deferred and unverified, never measured here.

## Verdicts

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Guarded tier, two spawns. Phase 1 wrote the attack set with no tools, no
diff and no notes; this spawn holds tools, read the DIFF and the specs
before the executor's notes, and read the notes last. Bench detached at
the lane's tip, base 5656a05486d8ab748cf78cab556373c4780c4efa, tip
e18e9a2ccf855bda899c60eaaea6e24a489e2287. Port 25242 throughout; nothing
was written in the integration checkout or in the lane worktree.

**The sealed inputs, cited and verified against the saved files:**

- the attack set — sha256 `f3558691b0ce29656450f136afa1f1f372adabed90d701eff211bafba41c22df`
- the ground taken at the base — sha256 `740095985a6e2110c5c85fe35c7beab71def6cd99bc66b89bfd0258676abfe71`
- the measurement transcript beside it (M1 to M25, raw) — sha256 `fa95fd49f649e2b892759e95242829563a162d5180b076888d324199b0d97109`
- the card at the base — sha256 `164b644bce9b208dc8ce0cdca7da53ee1a58b7ec20857d87f71f3a28914b4fd2`, recomputed here from the commit rather than from the worktree

#### The suites, at the tip I was sent, by count as well as by exit

`gate-run.mjs parser app rust e2e`, ref e18e9a2ccf855bda899c60eaaea6e24a489e2287, exit 0 on every leg.

| suite | bodies at the tip | at the base (ground) | verdict |
|---|---|---|---|
| parser | 454 | 454 | GREEN |
| app | 1171 | 1171 | GREEN |
| rust | 661 across 18 targets | 658 (M14: 654 passed + 4 ignored) | GREEN |
| e2e | 1179 | — | GREEN |

The counts move by exactly what the diff adds: three cargo bodies in
`app/src-tauri/src/agent/kit.rs` and twelve in the new
`tools/e2e/tests/interview-skill.spec.ts`. Nothing was skipped, filtered
or dropped from a project's include glob.

**The three push-guard reds were MEASURED ABSENT rather than assumed
absent.** The lane's own graded reading at cb21ebff carried three
`push-guard.spec.ts` failures, attributed by the seat to the fence making
this repository's conventions index read-only in a lane worktree. On this
bench, where the source is writable, the whole e2e leg is GREEN at 1179 —
so the attribution is confirmed by the reading that would have refuted it,
and T-242-s4 is the right card for it. `git status --porcelain` is empty
after the whole battery, so nothing the suite builds is left behind: the
pack staging under the package's `dist/` is created by `prepack` and
removed by `postpack`, and it is gitignored either way.

#### A row per acceptance criterion, with the reading that decided it

| criterion | verdict | the evidence |
|---|---|---|
| **AC1** — the entry asks the banks in order, writes to the paths the runner's own code names, and completes the whole file contract with neither checkout nor app; pinned by a fresh-project body outside the checkout with no fabricated `method/skills/` in the fixture | **MET for the file contract; BOUNDED for the asking — see P3** | The fresh-project body packs the package with `npm pack`, installs the tarball into a scratch tree under the system temp directory, runs `supertaskr install` there through `npx`, and materializes out of the DELIVERED bytes, which it first asserts are byte-identical to what this tree generated. The forbidden bridge is refused explicitly: the fixture asserts it has no `method/skills/` at all, and its control runs the same installer against a package that carried nothing and requires `CANNOT_RUN` with nothing written. The contract is checked by BYTE EQUALITY against the method tree, not by `existsSync` — every `docs-templates/**` file, both adapters, the three kit-root files — which is stronger than the criterion's word "resolves" and closes attack A1.3. The destinations are derived and not typed: the docs tree from the banking map's own stage-0 row, and the kit root by reading `KIT_REL_DIR` out of the runner's Rust source, which is the criterion's "derived from the runner's own code, never restated here" done literally. |
| **AC2** — ONE generated file, from canonical sources, no second authored copy, held current by a regenerate-and-compare body | **MET** | The pack directory is one file, measured on the tree from both sides (a cargo body and an e2e body). C10 run at the tip over `git ls-files` whole: the banks' distinctive sentences have exactly two homes, `method/interview/plan-interview.md` and the single generated artefact — no golden, no snapshot, no third copy. Currency is pinned twice, by a byte comparison in the spec and by the command's own `--check` through the house exit contract, and CI runs the second as a step. The control is real: the generator pointed at a fixture tree with one template line changed produces different bytes and `--check` over it answers 1 with STALE. The size condition the owner's ruling attached is measured rather than asserted — 28427 bytes against the 65536 the app's own discoverer accepts, 43 per cent — so the whole-pack fallback is not reached and no dated append is owed. |
| **AC3** — the prompt text comes from ONE file, with a control that reds when EITHER path is repointed | **MET, in the strongest form this card could take** | This is the criterion I expected to be faked and it is not. The app lens is a REAL read of the app's real source: the body parses the `include_str!` path out of `kit.rs`'s own table and reads the file that path names, which ground M17 establishes is how the runner consumes the banks (embedded at build time, never read from disk at runtime). The comparison is over RAW BYTES with no trim, no case fold, no frontmatter strip, so attack A3.4 has nothing to work with. The kickoff-context exemption the amendment allows is not used at all. And the control is TWO separately-armed controls, one per path, exactly as attack A3.2 demanded: the app lens repointed by rewriting the table's `include_str!` target, the skill lens repointed by replacing the banks block's body — each leaves the other untouched, and each reds on a MISMATCH rather than on a missing file, because both are repointed at `decomposition.md`, a real method file. |
| **AC4** — install is the user's explicit command into the path the app's discoverer reads; identical a no-op, differing refused without `--force`, `--dry-run` honoured; opening a folder installs nothing | **MET except the no-op clause — CORRECTION 1** | The destination is derived from the harness table and the discoverer's constant is read out of `skills.rs` by the packs body rather than restated. `--dry-run` I measured MYSELF in all three states the spec does not cover — destination absent, identical, and differing — and with `--force --dry-run`: nothing is written in any of the four, which closes attack A4.5 and control C8 by measurement. "Opening a folder installs nothing" has both halves: the CLI half drives every verb but `install` and asserts no harness directory appears, WITH the positive control that the one arrangement that is supposed to write does; the app half is the Rust body `discovery_writes_nothing_into_the_skills_directory`, and ground M21 establishes structurally that the open path contains no write of any kind. **The no-op clause fails on measurement**: the copy loop is unconditional, so an identical destination is rewritten (mtime moves, inode does not), and because `copyFileSync` gives the destination the SOURCE's mode, a read-only source leaves a `0444` destination and the SECOND run over it throws an uncaught EACCES instead of answering the house exit contract. This is the same defect class the executor filed T-242-s4 for, met again in the installer this lane edited. Correction 1 assigns it. |
| **AC5** — the tarball carries the generated file, generated at pack time | **MET; a boundary named as a card** | Measured on the produced tarball and not on the `files` array, which is what attack A5.1 demanded: `npm pack --dry-run` from the package at the tip reports 35 files, 630.7 kB, carrying `dist/method/skills/supertaskr-interview/SKILL.md` at 28.4 kB. The lifecycle hook chosen is `prepack`, which `npm pack` really runs, not `prepublishOnly`, which it does not. Staleness cannot ship: `--stage` generates from the canonical sources and REFUSES when the committed artefact differs, so the tarball and the tree cannot carry two files under one name. No `postinstall` or `prepare` exists, so nothing of this runs on a consumer's machine. Nothing was published. The bound I record rather than fail: the story "a fresh folder receives the entry" holds for a folder that already carries `docs/` and `method/`, which is what the fixture creates, and NOT for a genuinely empty one — `findProjectRoot` refuses with exit 3 there, and in a nested folder it walks up and targets the ANCESTOR project. Both measured. Pre-existing and outside this diff, filed as T-242-s5. |
| **AC6** — land the board, print the closing line, print no unimplemented command, start no second interview | **MET; the label derivation is CORRECTION 2** | The closing line is the owner's three clauses, and the ellipsis is U+2026, not ASCII — the card's own spelling. "No unimplemented command" is met in its strongest form: the delivered file spells no `supertaskr` verb AT ALL, and the checker derives the legal set from the CLI's own `VERBS` table rather than a blocklist, with a control that injects an invented verb and sees it reported. What fails is the half the body claims to do best: the regex that reads the app's folder label off `App.tsx` matches a DOC COMMENT, not the labelled control. Proved without touching the file — rename only the control's own JSX text and the old regex still returns the old label, so the body stays green through exactly the drift it exists to catch. Correction 2. |
| **AC7** — skill packs loaded and stamped exactly as the app's | **the LOADING half MET; the STAMPING half NOT met in substance — CORRECTION 4 and a card** | Phase 1 pre-committed (P4) that if the skill route's pack handling turned out to be prose, I would say so rather than accept a prose grep dressed as parity. It is prose, and the loading half is done as well as prose can be: the surface is read out of `skills.rs`'s own constants, so a drift in `.claude/skills` reds, and the three commitments the app's kickoff clause makes are each pinned. The STAMPING half is not the app's. The app persists a `SkillPack` record — dir, name, description, triggers, project-relative path and a `sha256:` over the file's bytes — into the session registry (ground M20). The skill's instruction is to NAME the packs in the first turn, which is a sentence in a conversation the entry's own opening paragraph calls disposable. So nothing is stamped anywhere, and "exactly as the app's does" is not true of the delivered entry. The spec's own comment concedes it backwards, calling the turn "the stamp a file-only record keeps" when it is the APP that keeps a file record. The behaviour census then publishes the claim. Correction 4 repairs the census sentence; T-242-s6 is the card for the substance. |
| **AC8** — Codex described as deferred and unverified, the product goal not narrowed | **MET as placement, DEGENERATE as behaviour (P1)** | Graded only as placement, as phase 1 pre-committed. The deferral is in the delivered file itself, which a bare `supertaskr install` places at the Codex prompt path — so it lands where a Codex harness actually reads, which was attack A8.1's demand. Both directions checked by grep over the whole tracked tree at the tip: no living document claims a working Codex interview, the adapters are untouched by this diff and ground M7 establishes neither claimed it at the base, and the file states in as many words that nothing here narrows the provider-flexible goal, so attack A8.2 finds nothing either. The executor filed T-242-s2 for the placement itself, which is the honest card. |
| **AC9** — the method eval gate, the cargo suite, the graph, and `npm run capabilities` | **MET** | All four legs run above. `index --check` CURRENT at the tip. `capabilities:check` CURRENT, and it now covers the generated artefact as well, because the lane chained the generator into it — which means CI's existing census-currency step is what catches a stale entry. The graph moved with `kit.rs` and only with it: the index covers `app/` and `lib/` only, so nothing else in this diff owes it. The census is 1163 to 1175 across 42 spec files, the delta being exactly the twelve new e2e bodies, and `docs/INDEX.md` moved with it in the same command. The kit parity walk really does bite the new entry: attack A9.2's honest direction — a second file added under the pack with no table entry — is what the new cargo body and the pre-existing walk both catch, rather than the deleting-the-detector direction. |

#### The pre-commitments of phase 1, honoured

- **P1 — AC8 CONFIRMED degenerate as behaviour, and graded as placement only.** No body here executes a Codex session, and none claims to. No sentence in the report or the notes calls it verified. Said in advance, and the diff happens to be honest about it.
- **P2 — AC6's "start no second interview" CONFIRMED unfalsifiable in this lane** and graded as a generated-prose pin. The file says it; nothing runs it.
- **P3 — AC1's "asks the banks in order" CONFIRMED half-degenerate.** Order-in-the-file is checked, order-as-asked is not, because no vendor session is executed anywhere in this lane. The generator's header and the spec's header both say `materialize` is a machine reading of the rule the prose gives a session; the implementation notes do not say it in as many words, which is correction 5.
- **P4 — AC7 CONFIRMED to have no executable subject on the skill side**, and graded accordingly above rather than accepted as parity.
- **P5 — AC2's "small" escape hatch: I did not fail the card on size**, as pre-committed, and the fallback was not taken, so no dated append was owed and none was made. The three failure modes I pre-committed to failing — taking the fallback silently, an amendment under its own heading, or a pack that installs half of itself — none occurred; the third is qualified by correction 3's finding and by T-242-s7.
- **The standing refusal conditions did not fire.** Nothing wrote under a home directory outside a fixture, nothing was published, the working tree is clean after the suite, and every control the report names was written and run.

#### My own controls, run here rather than read off the notes

| id | control | reading |
|---|---|---|
| C1 | a canonical source changed must move the generated bytes | the lane's own control does it on a template in a copied tree, and `--check` over that tree answers 1 STALE; the seeds body additionally compares every block against the owning file read from the method tree, so a change to the banks reds it too |
| C2 | two separately-armed parity controls, one per path | present, both run, both red on a mismatch rather than a missing file — the demand met in full |
| C5 | opening a folder writes nothing, with a positive control that the snapshot can move | present as a harness-directory assertion plus a positive control; the app half is structural (ground M21) and carries its own Rust body |
| C8 | `--dry-run` writes nothing in every state | RUN BY ME across absent, identical, differing and `--force --dry-run`: nothing written in all four |
| C9 | an invented command reds the "no unimplemented command" assertion | present and run, and the checker derives its legal set from `VERBS` |
| C10 | tree-wide grep for the banks over `git ls-files` | RUN BY ME at the tip: exactly two homes, the method file and the one generated artefact |
| A4.3 | identical install is a no-op | RUN BY ME: it is NOT — mtime moves, and with a read-only source the second run throws EACCES. Correction 1 |
| A6.x | the closing line's label is read off the app | RUN BY ME in memory, no file touched: the regex reads a doc comment, and a rename of the real control leaves the body green. Correction 2 |

#### The security sweep

The artefact this card ships is a document that instructs a model to
write files, so the sweep is about what the document can be made to say
and about what the installer can be made to touch.

- **Seed paths are unbounded, and that is CORRECTION 3.** `materialize`
  joins a block's declared path onto the target directory with no check.
  Driven at the tip: a block labelled with a climbing path writes OUTSIDE
  the target directory, and the file's own prose gives a session the same
  rule with the same missing bound. Inside this repository the paths are
  derived by the generator and safe; the exposure is a delivered entry
  that has been edited in the harness directory it lands in, which is a
  directory the product tells people to keep their own packs in.
- **Install destinations cannot traverse.** The skill names come from a
  directory listing, so they carry no separator and no `..`; the harness
  directory is a frozen table entry; the only user-supplied path is the
  explicit `--root`.
- **`--force` still destroys a user-authored file of the same name with
  no backup**, which is the shipped behaviour and the card's own ruling
  kept it. Recorded, not corrected.
- **Nothing runs on a consumer's machine.** The manifest gains `prepack`
  and `postpack` and no `postinstall` or `prepare`; both new hooks run
  only where a tarball is BUILT.
- **The tarball is clean**: 35 files, no dotfiles, no absolute path, no
  secret, and the rename keeper answers 0 over the whole tree.
- **No network and no evaluation.** The generator is string concatenation
  over files it reads; nothing in the materialization path opens a socket,
  and the delivered file states that it needs none.
- **No dependency moved.** The manifest's dependency blocks are untouched.

#### What the notes and the report claim, checked against the tree

Every figure in the implementation notes that I re-measured is right: the
generated file's size, the cap, the tarball's shape, the census delta,
`index --check`, and the attribution of the three push-guard reds — which
I confirmed by the reading that could have refuted it. The report claims
no Codex measurement, no executed session, and no publish, and none
occurred. The one thing it does not say, and should, is P3's bound in as
many words; correction 5.

#### The assigned corrections

Five corrections, three mutant blocks. All five are committed on this
bench after this verdict commit; none is BLOCKING — the card is approved
with them applied.

**Correction 1 — an identical destination is not written, and an
installed entry is not left read-only because its source was.** The
card's criterion 4 and the owner's ruling 1 both call an identical file a
NO-OP, and the loop the lane shipped copies unconditionally, so the word
was true of the bytes and of nothing else. That is not cosmetic here:
`copyFileSync` gives the destination the SOURCE's mode, so a read-only
source leaves a `0444` destination, and the second run over it throws an
uncaught EACCES instead of answering the house exit contract — the class
the executor itself filed as T-242-s4 against a fixture, met again in
shipped code. Driven at the lane's tip before the correction: a source at
`0444`, first install exit 0, destination mode `444`, second install
`EACCES: permission denied, copyfile`. Two moves close it — skip a
destination whose bytes already match, and write the bytes rather than
copy the file. The new body reads GREEN against the corrected installer
(14 of 14 in the spec) and RED against the pre-correction loop restored
verbatim, at 1 failed / 13 passed on `the installed entry is writable
even though its source was not`, which is the first of its two properties
to die. Its own control is inside it: `--force` over a DIFFERING
destination still writes, so the skip is a no-op and not a broken
installer.

**Correction 2 — the closing line's label is read off the labelled
control, not off a doc comment.** The body's own comment says the label
is "read off the app rather than remembered", and the read was the first
quoted `"Open folder…"` anywhere in `app/src/App.tsx` — which is a
comment four lines BELOW the control, because the control's own text is
JSX and carries no quotes. Proved first without touching the file and
then by the drill: rename ONLY the button's text and the pre-correction
read still returns the old label, so the body stayed green through
exactly the drift it exists to catch. The label now comes from the
element the app tests by. RED under that mutant at 1 failed / 13 passed
on `the closing line names the app's own label`; the file restored and
the restore proved by sha256 against `git show HEAD:app/src/App.tsx`,
equal.

**Correction 3 — a seed path lands inside the folder or it does not
land.** This is the security sweep's one finding with teeth. The
delivered entry is a document that instructs a reader to write files at
the paths the document itself carries, and it is installed into
`.claude/skills/`, the directory this product tells people to keep their
own packs in and therefore a directory whose contents are editable by
whoever can edit it. Driven at the lane's tip: a block labelled with a
climbing path wrote a file OUTSIDE the target directory, and the file's
prose gave a session the same rule with the same missing bound. Both
readers are now bounded — the parser refuses an absolute or climbing
label, and the scaffold section states the rule so a human reading the
block applies it too. RED with the guard removed at 1 failed / 13 passed
on `a seed labelled ../escaped.md must be refused, not obeyed`. **The
drill also found a defect in my own first draft of the body** and it is
recorded rather than quietly fixed: it asserted over the system temp root
as "outside", which is shared with every other run on the machine, so it
could red on a file no run of this body wrote. The body now creates the
enclosing directory it checks, and the reading above is from the
corrected body.

**Correction 4 — the behaviour census stops claiming a stamp that does
not exist.** A wording repair: **it pins no property and owes no mutant
block.** The body named "organization skill packs are loaded and stamped
the way the app's discoverer does" measures the LOADING half only, and
body names are the sentences the census publishes as what this product
does. The app persists a pack record with a `sha256:` into its session
registry; the entry asks for a sentence in the first turn. The name now
says what the body measures. T-242-s6 carries the substance.

**Correction 5 — the implementation notes say plainly that no vendor
session was executed.** A wording repair to a record: **it pins no
property and owes no mutant block.** The bound is stated in the
generator's header and in the spec's header and nowhere in the notes,
and three clauses of the criteria are pinned as generated text rather
than as behaviour. Nothing in the notes or the report claimed otherwise —
this makes the claim's absence explicit rather than inferable, which is
what phase 1 pre-committed to requiring.

```mutant
correction: an identical destination is not written, and an installed entry does not inherit a read-only source's mode
file: tools/e2e/scripts/cli.mjs
spec: tools/e2e/tests/interview-skill.spec.ts
body: an identical destination is not written, and a read-only source does not make one
message: the installed entry is writable even though its source was not
--- old
    const bytes = readFileSync(path.join(sourceRoot, step.from), "utf8");
    const to = path.join(projectRoot, step.to);
    if (existsSync(to) && readFileSync(to, "utf8") === bytes) continue;
    mkdirSync(path.dirname(to), { recursive: true });
    writeFileSync(to, bytes);
--- new
    const from = path.join(sourceRoot, step.from);
    const to = path.join(projectRoot, step.to);
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
```

```mutant
correction: the closing line's label is read off the labelled control rather than off a doc comment
file: app/src/App.tsx
spec: tools/e2e/tests/interview-skill.spec.ts
body: the closing line is the owner's, names a control the app really has, and offers no command
message: the closing line names the app's own label
--- old
                onClick={() => void pickProjectFolder()}
              >
                Open folder…
--- new
                onClick={() => void pickProjectFolder()}
              >
                Choose folder…
```

```mutant
correction: a seed path lands inside the folder being interviewed or it does not land
file: tools/e2e/scripts/interview-skill.mjs
spec: tools/e2e/tests/interview-skill.spec.ts
body: a seed path that climbs out of the folder is refused, by the reader and by the prose
message: a seed labelled ../escaped.md must be refused, not obeyed
--- old
    if (block.kind !== SEED_INFO) continue;
    assertSeedPathInside(block.path);
    const to = path.join(targetDir, ...block.path.split("/"));
--- new
    if (block.kind !== SEED_INFO) continue;
    const to = path.join(targetDir, ...block.path.split("/"));
```

Each of the three anchors was checked BY COUNT against its file before
this verdict was written: every `old` text matches EXACTLY ONCE, and
every `new` text is absent from the live tree, which is what makes each
of them match exactly once the moment it is applied. No anchor is
ambiguous at either end.
Correction 2's mutant is planted in a file OUTSIDE this card's fence,
which is what a drill is for and not what the correction changes — the
correction itself is a line of the spec, inside the fence. Corrections 4
and 5 change wording and pin nothing, which is why the block count is two
short of the correction count.

#### The cards this pass filed

- **T-242-s5** — the install command refuses in a genuinely fresh folder
  and, in a nested one, silently targets an ancestor project. Both
  measured. Pre-existing, outside this diff, and the reason AC5's story
  is graded as MET with a named bound rather than as MET plainly.
- **T-242-s6** — the skill-driven interview keeps no file record of the
  packs it loaded, where the app persists a hashed one. The substance
  behind correction 4.
- **T-242-s7** — the delivered entry names the planner's driver contract
  and never says it is not carried, while the same file says exactly that
  for the card format and for the archaeology document. Found by
  enumerating every path-shaped token in the delivered file against the
  seeds it carries; the generated index and the docs protocol named by
  the adapter and state templates are the other unanswered pointers, and
  those are pre-existing and IDENTICAL in both lenses, so they are not
  this card's and the executor already recorded them.

#### The step-7 readings, at MY OWN tip

Taken at the tip THIS pass created, e2f1315ec041e448c8f001d5a7aabc598a80b679,
because a figure measured at the commit I was handed is stale at the
commit my corrections made. Port 25242.

| leg | at the tip I was sent (e18e9a2c) | at MY tip (e2f1315e) | verdict |
|---|---|---|---|
| parser | 454 | 454 | GREEN |
| app | 1171 | 1171 | GREEN |
| rust | 661 across 18 targets | 661 across 18 targets | GREEN |
| e2e | 1179 | 1181 | GREEN |

The e2e count moves by exactly the two bodies the corrections add, and
one more body was renamed rather than added. Exit 0 on every leg at both
tips.

Beside the battery, at the same ref: `capabilities:check` CURRENT — the
census at 111903 bytes, `docs/INDEX.md` CURRENT, and the generated entry
current at 28856 bytes, the three that command now answers for. `index
--check` CURRENT at 1230259 bytes, 203 files, 2631 symbols, 2505 edges,
budget 57.3 per cent. `lint:docs` exit 0 with 0 findings over 246
docs-shaped sites in 49 files. The method eval gate exit 0 over 12
model-free evals. The rename keeper exit 0. The card preflight exit 0
over the board including the three cards this pass filed. `git status
--porcelain` empty at the tip and again after a pack.

The tarball at my tip, by `npm pack --dry-run` from the package: 35
files, 632.0 kB packed, 2.1 MB unpacked, carrying
`dist/method/skills/supertaskr-interview/SKILL.md` at 28.9 kB — the
generated entry grew by the seed-path paragraph correction 3 adds, from
28427 to 28856 bytes against the 65536 the app's own discoverer accepts.

**THE CENSUS IS NOT STALE AT THIS TIP**, which is worth saying because
the dispatch expected it might be: the corrections added and renamed
bodies, so `npm run capabilities` was re-run as the LAST write before the
correction commit and the regenerated census went in with it. The merge
still owes its own regeneration from the merged tree, and the coupling
the executor's notes name stands: a `--bump` at the merge rewrites the
version stamp inside the banks, which the generated entry carries
verbatim, so the bump and the regeneration belong in one commit. T-242-s1
is the card for making that a step of the verb.

#### What step 7 found in my OWN correction, said rather than quietly fixed

The gates at my tip caught a defect in the body I committed for
correction 3, and it is the same defect the executor met and fixed
earlier in this lane: the body formed a `docs`-first path by joining the
literal `docs/` onto a scratch project root, which the DOCS GATE's
silent-miss tripwire cannot tell from a read of THIS repository's own
`docs/` — and it is right not to be able to. `npm run lint:docs` reported
it as one unlinked file, `tools/e2e/tests/interview-skill.spec.ts`,
`bases: project`. Nothing about the property under test needed that first
segment: what the body measures is the SHAPE of a seed path, so the
control's destination and one of the three refused labels are now spelled
without it. `lint:docs` answers 0 findings afterwards.

I record it because the executor's own account of the same tripwire is
in the notes above, and a verifier who repeats a defect he graded and
then edits it out of sight has removed the one reading that says the gate
works. It also cost this pass a whole second e2e leg, which is the honest
price of committing a body before running the gates over it.

It also adds one reading worth keeping: the e2e leg was GREEN at 1181
with that body committed, so no spec body caught it — the DOCS GATE's own
whole-tree half did, and it is the only arm that did. That is the arm
working as designed, and it is also why `lint:docs` belongs in a step-7
list rather than only in a merge's owed set.
