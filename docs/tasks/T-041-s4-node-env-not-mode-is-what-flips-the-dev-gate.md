---
id: T-041-s4
title: NODE_ENV — not --mode — is what can flip the DEV half of the harness gate, and nothing pins that
status: suggested
suggested_by: verifier claude-opus-5 @T-041
---

T-041's gate is `!isTauri && import.meta.env.DEV`, and both halves hold
(verified: the harness is absent from the production bundle, present in
the emitted code only when DEV is true, and installed only when
`!isTauri` even then). This is about the exact mechanism of the BUILD
half, which the notes state slightly too simply — "vite replaces it with
`false` for `npm run build`" — and about what would have to go wrong for
that to stop being true.

**Measured, three ways, on this branch:**

| build command | emitted asset | harness in bundle |
|---|---|---|
| `npm run build` | `index-vTAlOtQD.js`, 442,069 B | **no** |
| `npx vite build --mode development` | `index-vTAlOtQD.js`, 442,069 B, **sha-identical** | **no** |
| `NODE_ENV=development npm run build` | `index-0S54RIn6.js`, 696,302 B | **YES** — `__nputerShellHarness`, `__nputerDocsHarness`, `getShell:` and the `browser dev harness active` console line all present |

The surprising half is the middle row: `--mode development` does **not**
flip `import.meta.env.DEV` for a build, because Vite's CLI sets
`NODE_ENV=production` for `vite build` before the config loads whenever
NODE_ENV is unset. The one lever that flips it is an **inherited
`NODE_ENV`** in the build environment. And `app/src-tauri/tauri.conf.json`'s
`beforeBuildCommand` is `npm run build`, so a packaging run inheriting
`NODE_ENV=development` from a shell would embed the harness code in the
shipped `.app`.

**This is not a hole, and here is why — the layering earns its keep.**
In that artifact the harness is still never installed: `isTauri` is true
under the packaged webview, so the block never executes. I confirmed
this at the EMITTED-CODE level rather than by argument — in the
NODE_ENV=development bundle the install still reads
`if(NS=!0,!Wo){…window.__nputerShellHarness={…}…;return}`, with `Wo` the
`__TAURI_INTERNALS__` check. The runtime half is the one that survives a
build-environment mistake, which is exactly the case for having two.
And `app/test/shell-harness.test.ts`'s build-half test reads whatever
`dist/` holds, so the very next `npm test` after such a build goes red
with "the shell harness must not reach production" — CONVENTIONS'
build-then-test order (pinned verbatim by
`tools/e2e/tests/workflow-parity.spec.ts`) makes that the default path.

**Cheapest honest hardening, if it is wanted at all:**

1. **Say it in the source.** One clause in the gate comment at
   `app/src/lib/watcher-store.ts:544` — DEV is false because *vite build
   forces NODE_ENV=production*, and an inherited NODE_ENV is the one
   thing that changes that — so the next reader does not have to
   re-measure it. Nearly free.
2. **Pin the mechanism, not just the outcome.** The bundle test proves
   the harness is absent from `dist/`; nothing proves *why*. A one-line
   assertion that the built asset contains no `import.meta` DEV
   fingerprint, or a CI step asserting `NODE_ENV` is unset/production
   before `npm run build`, closes the gap at its cause.
3. **Do nothing, and say so**: rule that the runtime half plus the
   build-half test is sufficient defence-in-depth, and record it.

Not blocking T-041: nothing here is reachable in any artifact this repo
produces by any configured path, and the branch's own test is the thing
that would catch it.
