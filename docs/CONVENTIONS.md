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
  workspace crates via default-members).

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
  verdict correction; T-007-s2 proposes pinning this as a test —
  see ADR-012 for why the grant set stays empty).
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
  its test pins the trusted event order headlessly (real-input E2E
  lane proposed as T-005-s4).
- INTERIM integrator rule (T-009-s1, ratified at the 2026-08-16
  triage; retires when T-014's `nputer index --check` becomes the
  gate): at any merge whose diff touches `*.ts/*.tsx/*.js/*.jsx`
  outside docs/, regenerate the committed graph —
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
  self_graph -- --ignored` — then re-run
  `cargo test -p nputer-index --test self_graph -- --ignored` to
  confirm byte-identity, and commit docs/architecture/graph.json
  with the merge.
