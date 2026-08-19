/**
 * Minimal ambient types for the node builtins the dogfood test uses
 * (architecture-dogfood.test.ts reads the live repo tree).
 *
 * The app deliberately ships no @types/node — the webview bundle must
 * never grow node imports, and a missing type package keeps that loud
 * (T-003's pure-entry discipline). Tests run under vitest's node
 * environment where these modules are real; this file declares exactly
 * the surface the test consumes, nothing more, so any broader node usage
 * in app code still fails the typecheck.
 *
 * THIS FILE IS THE SHARED HALF, AND IT IS READ-ONLY BY CONSTRUCTION
 * (T-073). It is the one `test/` path `app/tsconfig.json` names, so
 * `app/src` sees exactly this surface and no other: a webview module
 * that reaches for a node WRITE gets TS2305/TS2724 out of `tsc` for
 * free, which is half of ADR-017 — the spawned planner writes, the app
 * renders what lands — enforced by the type system rather than by a
 * sweep. T-028's write surface now lives in `node-builtins-write.d.ts`,
 * which only `tsconfig.test.json` includes.
 *
 * THE SPLIT HAS TO BE A PROGRAM BOUNDARY, NOT A FILE BOUNDARY, because
 * ambient module declarations are PROGRAM-GLOBAL: a `declare module
 * "node:fs"` block written inside the one test that writes does NOT
 * scope the writes to that test. Measured on this tree at T-073 — with
 * the write block moved into `crescendo-dom.test.tsx` and nowhere else,
 * a four-line probe under `app/src` importing `mkdirSync`/
 * `writeFileSync` still compiled at exit 0.
 *
 * ADD READS HERE; ADD WRITES NEXT DOOR.
 */

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readdirSync(path: string): string[];
  /** Exactly the surface the genesis fixture walkers consume (T-024):
   * directory-vs-file discrimination while recursing a fixture tree —
   * plus, since T-037, mtimeMs, so the built-bundle assertion can refuse
   * a dist/ older than the sources it claims to be evidence about. */
  export function statSync(path: string): { isDirectory(): boolean; mtimeMs: number };
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
}

declare module "node:url" {
  export function fileURLToPath(url: URL | string): string;
}
