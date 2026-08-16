# Conventions

## Build & test
- Fresh-clone ORDER (T-003, ADR-011): lib/parser FIRST — `npm ci` +
  `npm run build` from lib/parser/ — then set up app/. The app
  depends on `@nputer/parser` via `file:../lib/parser`: its build
  needs the parser's dist/ (fails with a clear TS2307 if missing),
  and the symlink resolves the parser's deps via the parser's own
  node_modules, so its `npm ci` must have run.
- lib/parser (C-06), run from lib/parser/: `npm ci` ·
  `npx vitest run` (suite) · `npx tsc --noEmit` (types) ·
  `npm run build` (emits dist/, gitignored). The suite's smoke test
  parses this repo's live docs/ tree and requires zero issues.
- app/ (C-05), run from app/: `npm install` (setup) ·
  `npm run build` (typecheck + frontend build — the fast gate) ·
  `npm test` (vitest — model-store unit tests, T-003) ·
  `npm run tauri dev` (run the desktop app) · `npm run tauri build`
  (package).
- app/src-tauri (C-05 Rust half + the C-07 workspace), run from
  app/src-tauri/: `cargo test` (watcher/collector unit tests, T-003;
  + nputer-index crate suite, T-009 — bare `cargo test` runs both
  workspace crates via default-members) · `cargo audit` (T-020 —
  RUSTSEC advisories against the exact `=` pins).
- AUDIT GATE POLICY (human ruling 2026-08-16, closing T-020-s2): the
  gate is VULNERABILITIES — they exit non-zero and stop the lane
  (proven: a crafted lock pinning `time 0.1.44` → exit 1,
  RUSTSEC-2020-0071). Informational warnings stay NON-gating. Today's
  baseline, audited 2026-08-16 over 472 locked crates with cargo-audit
  0.22.2: **0 vulnerabilities / 17 informational warnings** — 16
  `unmaintained` + 1 `unsound`, all transitive under Tauri v2's
  GTK3/glib stack plus `proc-macro-error` and the `unic-*` family,
  nothing ours to re-pin. Warning-count drift is reviewed BY EYE
  against that baseline, not enforced by exit code; `--deny warnings`
  would red CI permanently for no actionable signal.
- tools/e2e (the real-input E2E lane, T-020 — the repo's THIRD npm
  package, self-contained per the ADR-011 family), run from tools/e2e/:
  `npm ci` · `npm test` (the lane — Playwright drives the app's dev
  bundle in HEADLESS Chromium with trusted input; workers 1, retries 0,
  no skips) · `npm run typecheck` · `npm run lint:tokens`
  (+ `-- --selftest`) · `npm run boot:check` (spawns `tauri dev` and
  asserts the two `[nputer]` startup lines; NOT part of `npm test` —
  it opens a real window and needs port 1420 free).
- One-time dev-tool setup, outside the repo and never a repo dep:
  `npx playwright install chromium` from tools/e2e/ (browsers cache in
  ~/Library/Caches/ms-playwright, ~/.cache/ms-playwright on Linux —
  hundreds of MB, deliberately outside the tree) and
  `cargo install cargo-audit --locked` for `cargo audit`, run from
  app/src-tauri/ (fetches the RUSTSEC advisory DB — the one
  network-touching command).
- PORT RULE: 1420 belongs to the human's live `tauri dev`. The lane
  runs its own vite on `NPUTER_E2E_PORT` (default 14520),
  `reuseExistingServer: false`; setting it to 1420 THROWS at config
  load by design, and the boot check bind-probes 1420 and aborts if
  anything holds it. Nothing in the lane ever contacts a server it
  does not own.
- CI (.github/workflows/ci.yml) is a thin invoker of exactly these
  commands — dormant until the repo's first GitHub push. Two
  deliberate divergences: it uses `npm ci` for app/ where local setup
  says `npm install` (lockfile-exact installs in CI, everywhere), and
  `npx playwright install --with-deps chromium` (the Linux system libs
  a fresh runner lacks). tools/e2e/tests/workflow-parity.spec.ts pins
  the correspondence — change a command here, change it there, or the
  lane fails.

## Gotchas
- method/ is the generic, product-agnostic convention — nothing
  nputer-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.5) and noted here.
- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.
- This project was planned in a long chat session before the folder
  existed; the chat is NOT the record — if it isn't in this folder,
  it didn't happen (succession rule).
- Tauri v2 applies the CSP (app/src-tauri/tauri.conf.json) at serve
  time — it never appears in dist/index.html (that was v1 behavior);
  don't "fix" its absence there.
- Tauri capability grants compile to code, not strings — `strings`
  on a binary proves NOTHING about ACL grants (vacuously "clean"
  even for granted permissions; only config JSON, e.g. the CSP, is
  string-findable). Prove the webview surface with regenerated
  gen/schemas/capabilities.json plus a runtime ACL probe (T-007
  verdict correction). Since T-021 that proof is PINNED, not
  re-derived per task: `app/src-tauri/src/acl_pin.rs` re-resolves the
  shipped gen/schemas through tauri's own resolver on every
  `cargo test` and fails with a `+`/`-` grant diff if the 92-grant
  `core:default` set moves. A deliberate grant is added by re-pinning
  EXPECTED_GRANTS in the same commit, with the sweep — never by
  deleting or muting the test (see ADR-012 for why the set stays
  empty of app grants).
- DECLARING A COMPONENT moves THREE live-registry fixtures, not two
  (T-024-s5, ratified at the 2026-08-16 second triage after the
  omission cost T-024 a rejection and the lesson recurred at T-025's
  merge): `lib/parser/test/smoke.test.ts` (the exact id array over
  this repo's live docs/ tree), `app/test/architecture-dogfood.test.ts`
  (ids, declared count, findings, the relation table, drift/
  declaredOnly) and `app/test/map-dogfood-render.test.tsx` (rendered
  node + edge counts). Reconcile all three, changed never loosened. A
  MERGE REGEN alone moves only the two app fixtures — the parser pin
  holds unless the REGISTRY itself changed. The knowledge used to live
  only in a T-008 commit message and behind a task fence reading "zero
  diff under lib/parser/**".
- UI work adds tokens to app/src/styles/tokens.css, never Tailwind
  defaults or arbitrary values — unmapped utilities are deliberately
  dead, and arbitrary values (`p-[13px]`) bypass enforcement (see
  suggestion T-001-s2).
- Suggestion-triage encoding is ratified in method/tasks/TASK-FORMAT.md
  (v0.1.4, T-016): promoted → absorbed into the promoted task ("Absorbs:"
  line) + suggestion file removed in the same commit; parked → in place,
  id now required; rejected → `git mv` to docs/tasks/rejected/ with a
  dated one-line reasoning. Flat `status: rejected` in docs/tasks/ stays
  a hard parse failure BY DESIGN (missing placement fields light the
  board's parse-error badge) — move the file, don't "fix" the parser;
  the flat-glob exclusion and the loud trap are both pinned in
  lib/parser/test/rejected-exclusion.test.ts.
- The genesis kit is ratified in method/roles/planner.md +
  method/interview/plan-interview.md (v0.1.5, T-023): interview output
  is INCREMENTALLY BANKED — the stage → artifact table in
  plan-interview.md is normative and gets transcribed by programs
  (T-024 stage inference, T-025 kit packaging); changing it is a
  method version bump, and code reading it must be kept in sync.
  "pushing back:" is a rendering hint, never load-bearing; the
  transcript is not record. docs-templates/ are scaffolded VERBATIM —
  examples live inside HTML comments; a bare example row (e.g. a
  `- F-01:` bullet) would parse as real content on a fresh board, so
  don't add one.
- Outside-click/dismissal listeners must decide on pointerdown, never
  click — under trusted input the browser runs microtask checkpoints
  between listeners, so React's discrete-update flush lands
  mid-propagation and detaches the clicked node; a click-time
  listener then reads inside as outside and misdismisses (cost T-005
  a rejection). Synthetic clicks propagate synchronously and CANNOT
  reproduce it — no unit/jsdom probe will warn you. Reuse
  attachPanelDismissal (app/src/components/board/panel-dismissal.ts);
  its test pins the trusted event order headlessly, and since T-020 the
  real-input lane (tools/e2e) pins it under TRUSTED input — swapping
  those two strings back to `"click"` fails blocker-retarget,
  keyboard-activation and the at-press assertion, which is the whole
  reason that lane exists. The `data-panel-exempt` exemption is a
  SAFETY NET against accidental dismissal, not a guarantee that exempt
  controls stay pointer-reachable while a panel is open: the open panel
  occludes the header's exempt controls and keyboard reach is
  sufficient by design (human ruling 2026-08-16, closing T-020-s1;
  tools/e2e/tests/panel-exempt-controls.spec.ts pins the occlusion as a
  tripwire, so un-occluding it fails loudly).
- INTERIM integrator rule (T-009-s1, ratified at the 2026-08-16
  triage; retires when T-014's `nputer index --check` becomes the
  gate): at any merge whose diff touches `*.ts/*.tsx/*.js/*.jsx`
  outside docs/, regenerate the committed graph —
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
  self_graph -- --ignored` — then re-run
  `cargo test -p nputer-index --test self_graph -- --ignored` to
  confirm byte-identity, and commit docs/architecture/graph.json
  with the merge.
