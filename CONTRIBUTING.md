# Contributing

This is the product source checkout. Setup, builds and ordinary checks use
product source and representative fixtures, without a private project board,
records binding, credentials or remote. Use ordinary branches/worktrees,
focused tests, independent review and CI. Keep the human app's port 1420 free;
the e2e runner owns a separate port through `SUPERTASKR_E2E_PORT`.

## Build & test

Build lib/parser first, then install app and tools/e2e. Node 22.18 or later,
the Rust toolchain and platform Tauri prerequisites are required. Native tests exercise installed services through finite helpers in tools/e2e,
so install its dependencies before running cargo test. The e2e
package is an independent test harness. The standalone distributable lives
under cli; no registry publication is part of contribution checks.

- lib/parser, run from lib/parser/: `npm ci` · `npx vitest run` ·
  `npx tsc --noEmit` · `npm run build`.
- app/, run from app/: `npm ci` · `npm run build` · `npm test` ·
  `npm run tauri dev` (local desktop) · `npm run tauri build` (local package).
- app/src-tauri, run from app/src-tauri/: `cargo test` · `cargo audit`.
- tools/e2e, run from tools/e2e/: `npm ci` · `npm test` ·
  `npm run typecheck` · `npm run lint:tokens` · `npm run lint:docs` ·
  `npm run capabilities:check` · `npm run capabilities` (local generation) ·
  `npm run boot:orphan-drill` (local regression drill) · `npm run boot:check`.
- CI (.github/workflows/ci.yml) runs the documented ordinary checks. Its
  platform forms are `npm run lint:tokens -- --selftest`,
  `npm run lint:tokens`, `command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked`,
  `npx playwright install --with-deps chromium`,
  `npm test -- ${{ matrix.specs }}` for derived e2e shards, and
  `xvfb-run -a npm run boot:check` for the headless desktop smoke.
  `npm run tauri dev`, `npm run tauri build`, `npm run capabilities` and
  `npm run boot:orphan-drill` remain deliberate local operations. CI checks
  generated output and never regenerates it before judging its currency.

Install the local browser once with `npx playwright install chromium` from
tools/e2e. Install cargo-audit once with
`command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked`.
Dependency installation may use the package registry; an already prepared
checkout's ordinary checks need no private service or remote repository.

`npm run capabilities` generates product `docs/CAPABILITIES.md` and the blank
interview skill from product method sources. It does not read, validate or
save a private INDEX. Commit generated product output with its source change.
`npm run capabilities:check` rejects stale capability or interview output.

The documentation input gate is `tools/e2e/scripts/docs-gate.mjs`, using
`docs-scan.mjs` to derive source readers, root anchors and suites owed by
changed product documentation. Run it from the source checkout root with
separate changed-path arguments; `--census` checks the source account without
judging a diff. `npm run lint:docs` invokes that census in CI. Usage errors,
unresolved readers and unaccounted anchors remain failures.

## Private project checks

Private validation and INDEX derivation/save use the explicitly selected
records service and its committed validation policy. They do not invoke
product generation, tests, builds or publication. Mixed changes require
both their product checks and the selected private checks at the caller.

Deliberate real-board dogfood requires explicit product and bound records
origins and runs outside ordinary test discovery. Committed private graph
currency is one such obligation. Its separated native producer/check route
remains required before activation; a product-only CI run does not discharge
it. Missing or invalid selected records refuse without a fallback board.
