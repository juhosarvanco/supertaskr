---
id: T-242
title: The interview skill — one interview in two lenses, a slash command in the agent app and the app's split view, over one prompt and one file contract, so the board materializes beside the chat whichever window holds it
feature: F-03
milestone: 4
size: M
priority: 1
status: planned
suggested_by: "@human (2026-09-03): \"Should we move the interview also to Claude or Codex as a skill or in other format?\" — ruled with ADR-021 (rooms/cockpit-or-mirror.md RE-RULED)"
blocked_by: []
touches: [method/skills/, method/interview/plan-interview.md, method/interview/decomposition.md, method/adapters/CLAUDE.md, method/adapters/AGENTS.md, app/src-tauri/src/agent/kit.rs, tools/e2e/scripts/cli.mjs, tools/e2e/scripts/interview-skill.mjs, tools/e2e/package.json, tools/e2e/tests/interview-skill.spec.ts, tools/e2e/tests/interview.spec.ts, docs/CAPABILITIES.md, docs/INDEX.md, docs/architecture/graph.json]
builder:
verifier:
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
<!-- executor appends before finishing -->

## Verdicts
