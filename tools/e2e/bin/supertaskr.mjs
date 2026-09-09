#!/usr/bin/env node
/**
 * `npx supertaskr` — the bin entry (T-244, C-02).
 *
 * UNCONDITIONAL EXECUTION, DELIBERATELY, and this file is the whole
 * reason `cli.mjs` is importable: the same argument `lint-tokens.mjs`
 * and `tauri-boot-check.mjs` carry in their own headers. An
 * `import.meta.url === process.argv[1]` guard inside the module would
 * turn a symlinked checkout or a wrapper — which is exactly what a
 * `node_modules/.bin` shim IS — into a silent exit 0 that ran nothing.
 * So the entry point is this file, it does nothing but call, and the
 * module beside it stays side-effect free so a spec can import it.
 *
 * THE CHILD'S EXIT CODE IS THIS PROCESS'S EXIT CODE. A front that
 * summarises an exit is a front that can turn a red gate green, which is
 * the failure docs/CONVENTIONS.md spends a bullet on per gate.
 */

import { main } from "../scripts/cli.mjs";

// `process.exitCode`, never `process.exit()` — the same rule the scripts
// beside this file keep: exiting drops undrained stdout, silently under
// a pipe. Node leaves with this code once the stream has flushed.
process.exitCode = main(process.argv.slice(2));
