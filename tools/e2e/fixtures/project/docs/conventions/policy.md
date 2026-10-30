# Example project policy

These are fixture inputs for the product's readers, not rules for developing Supertaskr.

- THE LANE PROTOCOL (example). See `method/lane-protocol.md` for the role contract.
  Example run records live under `.supertaskr/runs/` and the project uses the `--run` verbs declared by its adapter.
  Example segment 01 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 02 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 03 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 04 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 05 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 06 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 07 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 08 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 09 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 10 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 11 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 12 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 13 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 14 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  Example segment 15 is independently authored to exercise a long citation: the described adapter input remains a prepared project with explicit component ownership and deterministic policy observations.
  - integration branch `main`;
  - branch `task/T-NNN-<slug>`;
  - worktree `../supertaskr-T-NNN`;
  - bench worktree `../supertaskr-T-NNN-verify`;
  - Created with `git worktree add ../supertaskr-T-NNN -b task/T-NNN-<slug> <base>`.
  - A FRESH WORKTREE HAS NOTHING INSTALLED: build the parser before the app and install the independent tools.

- DISPATCH FROM THE LAST CHECKPOINT (example). Choose the latest `Checkpoint:` commit on main as the stable example base; repeated `Checkpoint:` labels refer to the same marker, never infer a cut from a mutable branch.

- E2E PORT — DERIVE IT PER LANE (example): `SUPERTASKR_E2E_PORT=15000+<card number>`.

- SCRATCH RULE — NAME EVERY SCRATCH FILE FOR THE LANE THAT OWNS IT (example): `<purpose>-<card id>.<ext>`.

- PORT RULE: 1420 belongs to the human and their app. Use `lsof -nP -iTCP:<port> -sTCP:LISTEN` for its observation and a separate owned port for tests.

- THE BLESSED GATE-RUNNER (T-202): `node tools/e2e/scripts/gate-run.mjs parser|app|rust|e2e`; scoped form `e2e --owning <path>`; result token `gate-verdict`.

- GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING (example). **THE MAP:** `agent-hooks`: `.claude/hooks/`, `.claude/settings.json`, `.codex/supertaskr-product-hooks.json`; `gate-runners`: `tools/e2e/scripts/gate-*`, `tools/e2e/scripts/docs-gate.mjs`; `fences-and-locks`: `tools/e2e/scripts/lane-lock.mjs`, `cli/lane-fence.mjs`, `cli/expand-fence.mjs`, `tools/e2e/scripts/lane-fence.mjs`; `landing-and-push-guards`: `tools/e2e/scripts/push-checks.mjs`, `cli/push-guard.mjs`, `cli/pre-push-guard.mjs`, `cli/landing-gate.mjs`; `parser`: `lib/parser/`; `method-text`: `method/`; `ci-workflow`: `.github/workflows/`.

- BOOT GATE at any merge whose diff touches `app/src-tauri/**` — run the documented boot check.

- DOCS GATE (T-084) at any merge whose diff touches `docs/**` — `tools/e2e/scripts/docs-gate.mjs` derives the source reader set with `docs-scan.mjs`: `cargo test from app/src-tauri/`, `npm test from app/`, `npx vitest run from lib/parser/`, `npm test from tools/e2e/`.

- GRAPH REGEN at any merge whose diff touches source files — regenerate the selected example graph.

- METHOD EVAL GATE at any merge whose diff touches `method/**` — evaluate reusable method inputs.

- POISON DRILL (example). A named failing assertion needs its corresponding positive control, with exact restoration of fixture bytes.

- A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL (example). Exercise both the accepted and refused cases on owned fixture inputs.

- THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314 (example). Optional product hooks retain `.git/hooks/pre-push`; ordinary development uses native Codex and CI.

- AND THEN READ IT (example). Read the current run through `gh run list` and `gh run view`; these are fixture command shapes, not live remote calls.

- THE SHIPPED PARTITION, IN SLUGS (example). A declared component is shipped; reusable method files included in the kit are shipped. Scratch notes are not.

- A CITATION NAMES A SYMBOL, NOT A LINE (example). Cite a file and a unique symbol so a reader can locate the same input.

- Fresh-clone ORDER (example): lib/parser FIRST — `npm ci` + `npm run build` from lib/parser/, then app/ and tools/e2e/.

- THE MERGE INTO MAIN IS @human'S GATE, BY DESIGN (example). A selected project owns the human decision at its integration boundary.

- **A FRESH WORKTREE HAS NOTHING INSTALLED** (example). Prepare the declared product packages before exercising source commands.

- app/src-tauri (C-05 Rust half example), run from app/src-tauri/: `cargo run -p supertaskr-index -- index --check --root ../..`; exit 0 current, 1 STALE, 2 usage, 3 the gate could not run.
