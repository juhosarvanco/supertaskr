#!/usr/bin/env node
/**
 * Unconditional command wrapper for CI's first gate. Keep execution here,
 * outside token-scan.mjs, so importing the scanner is side-effect-free.
 *
 * Do not replace this with an `import.meta.url === process.argv[1]` guard:
 * symlinked checkouts and wrapper scripts can make those paths disagree and
 * silently turn the first CI gate into exit 0 without scanning anything.
 */
import { lintTree, selftest } from "./token-scan.mjs";

if (process.argv.includes("--selftest")) selftest();
else lintTree();
