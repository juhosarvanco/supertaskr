/**
 * The WRITE half of the app's ambient node surface — T-028's, moved out
 * of `node-builtins.d.ts` by T-073 and deliberately kept out of reach of
 * `app/src`.
 *
 * WHO SEES THIS FILE: only `tsconfig.test.json`, whose `include` is
 * `["src", "test"]`. `app/tsconfig.json` — the program bare `tsc` and
 * therefore `npm run build` compiles — includes `["src",
 * "test/node-builtins.d.ts"]` and never picks this file up, so the
 * shipped frontend's `node:fs` stays read-only and a write under
 * `app/src` fails the build gate with TS2305/TS2724 by construction.
 * That free half of ADR-017 is what T-073 restored; the widened sink
 * sweep in `crescendo-dom.test.tsx` is the other, independent closer
 * over the same property, and it catches shapes a type has no opinion
 * about (`writeTextFile` through the Tauri plugin, for one).
 *
 * IT CANNOT LIVE INSIDE THE ONE TEST THAT USES IT. Ambient module
 * declarations merge program-wide, so a `declare module "node:fs"`
 * block inside `crescendo-dom.test.tsx` widens `node:fs` for every file
 * in the same program, `app/src` included — measured at T-073, where
 * exactly that arrangement still let an `app/src` probe importing
 * `mkdirSync`/`writeFileSync` compile at exit 0. Only a program
 * boundary scopes it.
 *
 * WHAT IS DECLARED: the whole surface a scripted planner needs and not
 * one call more — create the temp root, create directories, write
 * files, remove the tree. Nothing here can reach the repo unless a test
 * hands it a path inside it, which is exactly the property
 * `crescendo-dom.test.tsx` guards by building every path from
 * `mkdtempSync(tmpdir(), …)`.
 */

declare module "node:fs" {
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
