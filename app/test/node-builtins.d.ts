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
 */

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readdirSync(path: string): string[];
  /** Exactly the surface the genesis fixture walkers consume (T-024):
   * directory-vs-file discrimination while recursing a fixture tree —
   * plus, since T-037, mtimeMs, so the built-bundle assertion can refuse
   * a dist/ older than the sources it claims to be evidence about. */
  export function statSync(path: string): { isDirectory(): boolean; mtimeMs: number };
  /** T-028: writing a REAL decomposition into a TEMP project. The whole
   * surface a scripted planner needs and not one call more — create the
   * temp root, create directories, write files, remove the tree. Nothing
   * here can reach the repo unless a test hands it a path inside it,
   * which is exactly the property `crescendo-dom.test.tsx` guards by
   * building every path from `mkdtempSync(tmpdir(), …)`. */
  export function mkdtempSync(prefix: string): string;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function writeFileSync(path: string, data: string, encoding: "utf8"): void;
  export function rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
}

declare module "node:os" {
  /** The system temp root — where T-028's scripted decomposition lands.
   * Declared here rather than reached for generally: this is the one
   * import that keeps real test files OUT of the repo's own docs/tasks/. */
  export function tmpdir(): string;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
}

declare module "node:url" {
  export function fileURLToPath(url: URL | string): string;
}
