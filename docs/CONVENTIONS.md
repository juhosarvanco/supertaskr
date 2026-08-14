# Conventions

## Build & test
- lib/parser (C-06), run from lib/parser/: `npm ci` ·
  `npx vitest run` (suite) · `npx tsc --noEmit` (types) ·
  `npm run build` (emits dist/, gitignored). The suite's smoke test
  parses this repo's live docs/ tree and requires zero issues.
- app/ (C-05) commands land here when T-001 integrates.

## Gotchas
- method/ is the generic, product-agnostic convention — nothing
  nputer-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.3) and noted here.
- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.
- This project was planned in a long chat session before the folder
  existed; the chat is NOT the record — if it isn't in this folder,
  it didn't happen (succession rule).
