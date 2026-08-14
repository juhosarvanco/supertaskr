# nputer app (C-05)

Tauri 2 desktop shell + React/Vite/Tailwind/shadcn frontend. Self-contained
package — no root workspace (per docs/ARCHITECTURE.md code layout).

- `npm install` — setup
- `npm run tauri dev` — run the desktop app (dev)
- `npm run build` — typecheck + build the frontend (fails non-zero on error)
- `npm run tauri build` — bundle the desktop app

All colors/spacing/type come from `src/styles/tokens.css` (CSS custom
properties; placeholder values until T-006). The Tailwind mapping in
`src/index.css` is mechanism — restyle in tokens.css, not there.
