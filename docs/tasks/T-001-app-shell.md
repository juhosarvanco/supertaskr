---
id: T-001
title: App shell boots
feature: F-02
milestone: 1
priority: 1
size: M
status: verifying
blocked_by: []
touches: [app-shell]
builder: claude-fable-5
verifier:
built_by: claude-fable-5
verified_by:
review:
---

## Acceptance criteria
- THE system SHALL open a Tauri 2 desktop window on macOS and Linux
  from `npm run tauri dev` run in `app/` (code layout per
  docs/ARCHITECTURE.md) with a React + Vite + Tailwind + shadcn
  frontend rendering a placeholder screen.
- THE frontend SHALL take its colors, spacing, and type exclusively
  from a design tokens file created by this task
  (`app/src/styles/tokens.css`, CSS custom properties, placeholder
  values — T-006 replaces the values, never the mechanism).
- WHEN the app starts THE system SHALL log the resolved project folder
  path (default: the repo the app lives in).
- IF the frontend fails to build THEN THE system SHALL exit non-zero
  with the build error printed (no silent white window).

## Implementation notes

Executor claude-fable-5, 2026-08-14, branch `t001-app-shell`.

### What was built
- `app/` — self-contained package (own package.json; NO root
  package.json/workspace, per ARCHITECTURE code layout). Scaffolded with
  create-tauri-app 4.6.2 (`react-ts` template, Tauri 2): React 19 +
  Vite 7 + TypeScript 5.8. Product/package/crate named `nputer`,
  identifier `dev.nputer.app`, window label `main`, title `nputer`.
- Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/vite`) and shadcn/ui
  (CLI 4.18.0, style `radix-nova`, baseColor neutral, css variables;
  `components.json` committed). One component vendored: `button`.
- Token mechanism (criterion 2): `app/src/styles/tokens.css` is the ONLY
  place visual values live — colors (:root + .dark schemes), spacing base
  unit, radius, font stacks, weights, text sizes; all placeholder
  (shadcn-neutral) values. `app/src/index.css` is mechanism only: it
  disables Tailwind's default color/font/text/spacing namespaces
  (`--color-*: initial` etc. in `@theme inline`) and re-derives every
  utility from the tokens — a color/spacing/type utility with no token
  behind it does not compile to CSS. T-006 edits tokens.css values only.
- Patched vendored `button.tsx`: stock `text-[0.8rem]` (absolute,
  non-token) → token-backed `text-sm`. Placeholder screen (App.tsx):
  name, one line, and a theme-toggle Button proving the .dark token swap.
- Startup logging (criterion 3): `src-tauri/src/lib.rs` setup hook
  resolves the project folder (walk up from cwd to the first `.git`
  entry — file or dir, so worktrees count; fallback cwd) and prints
  `[nputer] project folder: <path>` plus `[nputer] window "main" created`.
  Template `greet` demo command removed.

### Verification per criterion (macOS 15 / Darwin 25.6, node 22.22, rustc 1.95)
1. Window opens — `cd app && npm run tauri dev` (backgrounded, logged):
   cargo compiled (45s), then log shows vite ready :1420, both `[nputer]`
   lines; `pgrep -fl target/debug/nputer` → running pid; `lsappinfo` →
   `"nputer" ASN:0x0-0xb58b58` (registered with the macOS window server,
   i.e. a real on-screen window). Killed cleanly afterwards.
   **Linux half NOT verified — no Linux machine in this environment.**
2. Tokens exclusive — `npm run build` green; built CSS audited: 0
   absolute font-size/family declarations outside `var(--…)` chains (only
   Tailwind-preflight relative sizes `1em/80%/75%`, proportional to the
   tokenized base, plus `#0000` transparent); computed styles checked in a
   browser against the SAME vite bundle: body bg/fg = token oklch values,
   body font = `--font-sans-stack`, h1 = 30px from `--text-3xl-size`;
   theme-toggle click flips body to the `.dark` token values and back; no
   console errors.
3. Startup log — observed in dev log:
   `[nputer] project folder: /Users/ujju/Projects/nputer-t001` (= the
   repo the app lives in, resolved from app/src-tauri cwd via .git
   walk-up).
4. Build-failure path — injected `const broken: = 1;` into App.tsx:
   `npm run build` → exit 2, `error TS1110` printed; `npm run tauri
   build` → exit 1, `Error beforeBuildCommand \`npm run build\` failed
   with exit code 2` printed, aborts before any Rust/bundling (no
   artifact produced). Dev mode with same error: vite serves the error
   overlay (`vite-error-overlay` present, #root empty — error text with
   file:line visible in-window) and prints `Pre-transform error` to the
   terminal — not a silent white window. Probe reverted; clean build
   exit 0 re-confirmed.

### Flags for the verifier
- Linux criterion unverified (environment limit); needs a Linux run of
  `npm run tauri dev` (webkit2gtk deps) before "done".
- Window evidence is process + window-server registration + startup log
  + browser render of the same bundle — no human eyeball/screenshot of
  the Tauri window itself.
- Strictness choice: unmapped Tailwind defaults are intentionally dead
  (e.g. `text-white` maps only because `--color-white` is re-derived from
  the `--static-white` token). Future tasks must add tokens rather than
  reach for Tailwind defaults — this is the enforcement of criterion 2,
  not an accident.
- `app/src-tauri/Cargo.lock` committed deliberately (application, not
  library). `dist/`, `node_modules/`, `target/` ignored by scaffold
  .gitignores.
- shadcn CLI v4 is the new preset system (`radix-nova`), not the classic
  `shadcn-ui` CLI; components.json records the exact style so later
  `shadcn add` calls stay consistent.

### Dependency justifications (verifier checks additions)
- `tailwindcss`, `@tailwindcss/vite` — required by criterion stack (v4,
  vite plugin form).
- `shadcn` init/button added: `radix-ui`, `class-variance-authority`,
  `clsx`, `tailwind-merge`, `tw-animate-css`, `shadcn` (runtime
  `shadcn/tailwind.css` import), `lucide-react` — the standard shadcn v4
  runtime set pulled by its registry; lucide is unused by the placeholder
  but is the configured icon library future components import from.
- REMOVED `@fontsource-variable/geist` (preset wanted to bundle Geist):
  font choice belongs to T-006; placeholder tokens use system stacks.
- Scaffold defaults kept: `@tauri-apps/api`, `@tauri-apps/cli`,
  `@tauri-apps/plugin-opener` (+ template Rust crates). Opener is unused
  today but is the stock capability the board will need to open files.

### Build/test commands (for the integrator → CONVENTIONS)
- `cd app && npm install` — setup
- `cd app && npm run build` — typecheck + frontend build; the fast gate
- `cd app && npm run tauri dev` — run the desktop app
- `cd app && npm run tauri build` — package (aborts on frontend error)
- No unit tests exist yet in app/; `npm run build` is the suite until a
  later task adds one.

### Suggestions filed
- `T-001-s1-project-dir-command.md` — promote the resolved project dir
  to Tauri state + `get_project_dir` command (T-003 needs it; packaged
  .app cwd is `/` so an explicit override wants deciding then).

### Fix pass after 2026-08-14 rejection — fresh executor claude-fable-5

2026-08-14. Scope: the verdict's two security findings only; no
acceptance-criteria behavior touched (frontend bundle byte-identical,
same asset hashes).

**Finding 1 — CSP.** `tauri.conf.json` now ships
`"csp": "default-src 'self'; script-src 'self'; style-src 'self';
connect-src ipc: http://ipc.localhost"`. Rationale:
- Stricter than the verdict's example — NO `'unsafe-inline'` for
  styles. Empirically unneeded: built CSS is one linked file (zero
  `url()`/`data:` refs), built JS has no eval/new Function and never
  injects `<style>` on the app's paths (React writes styles via CSSOM,
  which CSP does not gate); full interaction test under the policy
  produced zero violations (below).
- `connect-src ipc: http://ipc.localhost` is Tauri's documented
  baseline for its fetch-based IPC on Linux/Windows (macOS uses
  postMessage instead). Included so the Linux half of criterion 1 —
  which no session so far could test (see T-001-s3) — is not knowingly
  broken; it admits only the IPC pseudo-origins, no network.
- `script-src`/`style-src` are spelled out so Tauri's nonce/hash
  appending extends them instead of creating bare directives that
  would shadow `default-src 'self'` and block the app's own assets.
- Recorded for future verifiers: Tauri v2 applies the CSP at serve
  time (custom-protocol response header + runtime HTML manipulation),
  NOT by rewriting `dist/index.html` on disk as v1 did — so
  `grep csp app/dist/index.html` stays 0 by design. The policy lives
  in the config embedded in the binary
  (`strings <built binary> | grep "default-src"` → 1 hit) and its
  enforcement was proven at runtime (below).

**Finding 2 — opener removed, no replacement.**
`.plugin(tauri_plugin_opener::init())` dropped from lib.rs;
`opener:default` dropped from capabilities/default.json (now
`core:default` only); `cargo remove tauri-plugin-opener` (Cargo.lock
471→429 crates — the zbus/D-Bus + `open` transitive tree left with
it); `npm uninstall @tauri-apps/plugin-opener` (package.json +
lockfile). Per the verdict, no `allow-open-path` added now — the task
that needs file-opening adds the narrow grant.

**Verification (macOS 15/Darwin 25.6, node 22.22.0, rustc 1.95.0):**
- `cd app && npm install` exit 0; `npm run build` exit 0.
- `npm run tauri build` exit 0 → .app + dmg. Compiled artifacts:
  embedded capabilities = `["core:default"]`, compiled ACL manifest
  zero opener entries.
- Packaged .app inner binary run: both `[nputer]` startup lines,
  CGWindowList on-screen layer-0 800×600 window; killed clean.
- CSP enforcement A/B (probe reverted before commit): a temporary
  `<img src="http://127.0.0.1:8099/…">` in index.html. (a) Packaged
  probe build with the CSP: zero requests reached the local listener
  in 8 s while the app ran. (b) The identical built HTML served to a
  browser WITHOUT the policy: GET arrived (probe mechanism valid).
  (c) Served WITH the exact policy as a response header (mirroring
  Tauri's delivery): console logged `Loading the image … violates …
  "default-src 'self'"` and blocked it. So the policy string blocks
  exactly what it should, and the packaged binary enforces it.
  (A planned in-app `csp: null` control build was denied by the
  session's permission classifier — reverting the CSP even temporarily
  looked like undoing the fix — so the browser A/B on the identical
  artifact serves as the positive control.)
- App under the strict policy (browser, exact bundle + header):
  placeholder renders styled, body/h1 = token oklch values + 30px,
  theme toggle flips html.dark and token values both ways, zero
  CSP violations from the app's own code across load + interaction.
- `npm run tauri dev`: vite ready 239 ms, debug rebuild, both
  `[nputer]` lines, window "main" created, window-server-registered
  ("nputer" ASN via lsappinfo); CGWindowList showed the 800×600
  window object with expected bounds but `onscreen: false` — the
  active Space was a fullscreen app during this headless check; dev
  serves from vite where CSP does not apply, and the bundle is
  byte-identical, so render risk from this diff is nil. Killed clean.
- `grep -ri opener app/src app/src-tauri/src app/src-tauri/capabilities
  app/src-tauri/Cargo.toml app/package.json` → zero hits.

## Verdicts

2026-08-14 — claude-fable-5 @fresh (verifier, same-model as builder):
REJECTED — on the mandatory security sweep (2 findings below), not the
acceptance criteria: all four criteria reproduced under this verifier's
own independent probes (macOS half; **Linux half NOT verified — no Linux
machine available to this verifier either; it remains required before
"done"**, see suggestion T-001-s3).

Independent run (clean `npm ci`, 430 pkgs, then `npm run build` exit 0;
macOS 15/Darwin 25.6, node 22.22.0, rustc 1.95.0):

- C1 window (macOS): `cd app && npm run tauri dev` → vite ready :1420,
  cargo run; verified myself: `pgrep -fl target/debug/nputer` (pid),
  `lsappinfo` front app + WebKit helper processes, and CGWindowList
  showing an on-screen layer-0 window 800×600 owner=nputer. Rendered
  DOM/computed styles checked against the same vite bundle: h1 "nputer",
  body bg/fg = token oklch values, h1 30px = --text-3xl-size, theme
  toggle flips html.dark and token values both ways; zero console
  errors. On-screen rendering + dark-mode token flip: confirmed by
  @human directly, 2026-08-14 (relayed by orchestrator; @human entry to
  be appended to the task file — this verifier did not observe the
  screen itself).
- C2 tokens: built-CSS audit — every color literal sits inside the
  :root/.dark token-definition blocks (rest: `#0000` transparent,
  inert `@supports` probes, `@property` initial values); every
  font-size/family declaration is a token var or preflight-relative
  (1em/75%/80%); preflight html/code fonts resolve through
  --default-*-font-family: var(--font-*-stack) tokens. Enforcement
  probe: `bg-red-500`, `text-4xl`, `font-serif` added to App.tsx
  produce NO CSS (control `bg-accent` does). Non-blocking residuals,
  recorded: Tailwind preflight form normalization (20px/4px on
  select-optgroup/::file-selector-button — elements the app never
  renders) and fixed-px non-themeable micro-utilities in stock shadcn
  button (underline-offset-4→4px, translate-y-px→1px, ring-3→3px,
  radius caps min(--radius-md,10|12px)) — outside the criterion's
  colors/spacing/type scales. Known gap, not a criterion failure
  (shipped source is clean): Tailwind v4 arbitrary values bypass the
  namespace disable — probe `p-[13px]` compiled to `padding:13px`;
  no config can block these → suggestion T-001-s2 (lint guard).
- C3 startup log: this verifier's run printed
  `[nputer] project folder: /Users/ujju/Projects/nputer-t001` — correct
  (the repo/worktree the app lives in; .git-file walk-up works).
  Fallback probed: binary run from /private/tmp (no repo above) logs
  `/private/tmp`, window still created, no panic.
- C4 failure path (own probe, `let verifierProbe: = 1;` in App.tsx):
  `npm run build` → exit 2, `error TS1110` with file:line printed;
  `npm run tauri build` → exit 1, `Error beforeBuildCommand \`npm run
  build\` failed with exit code 2`, aborts before bundling (no
  artifact); dev mode: module request → HTTP 500 with error page,
  `vite-error-overlay` present in the live window with message +
  file:line, error printed to terminal — not a silent white window.
  Probe reverted; clean build exit 0 re-confirmed.

Security findings (both cheap; everything else already reproduces, so
re-verify after the fix is fast):

1. No Content-Security-Policy. `app/src-tauri/tauri.conf.json` ships
   `"security": { "csp": null }` and no CSP reaches the built page
   (`grep -c csp app/dist/index.html` → 0). Tauri's security model
   expects a restrictive CSP on bundled apps; this webview is the
   surface T-003/T-004/T-007 will fill with content read from
   arbitrary repos, no hardening task exists on the roadmap, and this
   diff owns the file. Expected: e.g. `"csp": "default-src 'self';
   style-src 'self' 'unsafe-inline'"` (bundled app only — Tauri
   injects its own script nonces; dev server unaffected) or a recorded
   decision why null is acceptable. Actual: null, unexamined in the
   Implementation notes.
2. Unused IPC surface granted to the webview. `tauri-plugin-opener` is
   initialized (lib.rs) and `opener:default` granted
   (capabilities/default.json) while nothing calls it. That set =
   allow-open-url + allow-default-urls (open any http/https/mailto/tel
   in default apps) + allow-reveal-item-in-dir (reveal any path in
   Finder) — free primitives for any future webview compromise. The
   notes justify keeping it as "open files later", but that need maps
   to `allow-open-path`, not this set. Expected: drop the plugin +
   permission until the task that needs it adds the narrow permission.

Sweep items that PASS, for the record: no custom IPC commands (template
`greet` removed — verified by grep); `core:default` is Tauri's curated
introspection-only set; npm lockfile 100% registry.npmjs.org with zero
install-script packages; Cargo.lock 100% crates.io (471 crates); no
secrets in the diff; no remote content (built JS contains only W3C
namespace strings + react.dev error-URL prefix; no eval/new Function;
withGlobalTauri off); diff boundary clean — app/**, this task file, and
T-001-s1 only; no root package.json (ARCHITECTURE code layout); method/
untouched; C-05 scope only, no board features smuggled in.

Re-verify after fix: `cd app && npm ci && npm run build`, `npm run
tauri dev` window + startup-log check, confirm CSP present in built
`dist/index.html`, confirm capabilities carry no unused permissions.

2026-08-14 — @human (visual verification, relayed by orchestrator
claude-fable-5 @chat-session): confirmed directly on macOS — the
nputer window opened, the placeholder screen rendered (not a white
window), and the dark-mode toggle flipped the token values both ways.

2026-08-14 — claude-fable-5 @fresh (verifier, same-model as builder and
as the fix executor; re-verification of fix commit 1960f85):
APPROVED — both security findings closed, acceptance-criteria behavior
demonstrably unchanged. **Linux half of criterion 1 remains unverified
(macOS-only environment again); still required before "done" — see
T-001-s3.** The shipped `connect-src ipc: http://ipc.localhost` is
Tauri's documented allowance for the fetch-based IPC Linux/Windows use,
so the CSP is not expected to break that path, but expectation is not
verification.

Fix scope confirmed minimal: `git diff e012571..1960f85` touches only
tauri.conf.json, capabilities/default.json, lib.rs (one plugin line),
Cargo.toml/lock, package.json/lock, and additive task-file notes; the
interleaved 1dd24e1 is the orchestrator's @human entry, docs-only; zero
deletions in this file; no criteria edits; no frontend source changes.

Finding 1 (CSP) — closed, on this verifier's own evidence:
- Config ships `default-src 'self'; script-src 'self'; style-src
  'self'; connect-src ipc: http://ipc.localhost` — stricter than the
  verdict's example (no 'unsafe-inline').
- Correction adopted from the fix notes, verified: Tauri v2 applies CSP
  at serve time, so `dist/index.html` on disk legitimately carries none;
  my first verdict's "confirm CSP in built dist/index.html" re-check
  step was v1 thinking. Presence verified instead in the artifact: I
  rebuilt the package myself from the fixed source (`npm run tauri
  build` exit 0) and `strings` on MY .app binary finds the exact policy
  once.
- Enforcement + compatibility verified by my own A/B, independent of
  the fixer's: the byte-identical dist served with the exact policy as
  a response header — app fully styled (body bg oklch(1 0 0), h1 30px,
  token font), dark toggle flips both ways, zero violations from app
  code; my three injected probes all blocked and logged via
  securitypolicyviolation: `style-src-elem <- inline` (injected
  <style> had no computed effect), `connect-src` (external fetch
  rejected), `img-src` (external img blocked through default-src
  fallback). Packaged app run (my rebuild): boots, both `[nputer]`
  lines, on-screen layer-0 800×600 window, WebKit helpers, killed
  clean.
- The fixer's inability to build a csp:null control binary (permission
  classifier, correctly) is noted and non-blocking: policy-in-binary
  (strings) + policy-enforces-and-renders (my A/B on the identical
  bundle) + the fixer's packaged listener probe (zero disallowed
  requests) + dev/packaged boots compose a sufficient closure.

Finding 2 (opener) — closed, verified at every layer: grep across
app/src, src-tauri/src, capabilities, Cargo.toml, package.json → zero
hits; regenerated gen/schemas/capabilities.json = `["core:default"]`
only; ACL manifests contain no opener namespace; Cargo.lock 471→429
crates with the zbus/`open` transitive tree gone; `npm ci` installs 429
packages with no @tauri-apps/plugin-opener; `strings` on the rebuilt
binary: the single "opener" hit is the literal HTTP header name
`Cross-Origin-Opener-Policy` inside Tauri's stack — benign. No
replacement permission added, per the verdict.

Criteria unchanged, re-spot-checked: frontend bundle byte-identical —
`npm ci && npm run build` reproduces the same content-hashed assets
this verifier built pre-fix (index-BaSMbl2y.css / index-C_YqnOcf.js);
`npm run tauri dev` → vite ready, both startup lines,
`[nputer] project folder: /Users/ujju/Projects/nputer-t001` correct,
on-screen layer-0 800×600 window (CGWindowList), killed clean. C4 path
untouched by this diff (no build-script/frontend changes). Suggestions
T-001-s2/s3 remain open for architect triage; not blockers.
