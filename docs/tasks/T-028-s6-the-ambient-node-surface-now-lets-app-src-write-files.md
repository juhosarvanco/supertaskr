---
title: The ambient node types now let app/src write files and still typecheck
status: suggested
suggested_by: verifier claude-opus-5 @T-028
---

Found by attacking ADR-017's fence from the type system rather than from
the source text. **T-028 introduces no write and the shipped tree is
clean** — this is about a guard that used to be free and no longer is.

## The shape

`app/tsconfig.json` reads `"include": ["src", "test"]`, so the ambient
declarations in `app/test/node-builtins.d.ts` are visible to **`app/src`
as well as `app/test`**. That file exists precisely because the app ships
no `@types/node`: a webview module that reaches for a node builtin used
to fail `tsc` by construction, and the declarations were deliberately
narrow — before T-028 the whole `node:fs` surface was READ-ONLY
(`readFileSync`, `readdirSync`, `statSync`).

T-028 needs to write a real decomposition into a temp project, so it
extends the file from 30 to 47 lines with `mkdtempSync`, `mkdirSync`,
**`writeFileSync`**, `rmSync` and `node:os`'s `tmpdir`. Legitimate, and
the file's own comment scopes it honestly. The side effect is that those
write functions are now declared for `app/src` too.

## Measured

A four-line probe placed at `app/src/verify-t028-probe.ts`:

    import { mkdirSync, writeFileSync } from "node:fs";
    export function probe(root: string): void {
      mkdirSync(`${root}/docs/tasks`, { recursive: true });
      writeFileSync(`${root}/docs/tasks/T-999-x.md`, "written by the app", "utf8");
    }

- against T-028's HEAD: `npx tsc --noEmit` → **exit 0, zero diagnostics**;
- against the same tree with only `node-builtins.d.ts` reverted to its
  pre-T-028 content:

      src/verify-t028-probe.ts(1,10): error TS2305: Module '"node:fs"' has no exported member 'mkdirSync'.
      src/verify-t028-probe.ts(1,21): error TS2724: '"node:fs"' has no exported member named 'writeFileSync'. Did you mean 'readFileSync'?

The probe was removed and the declaration restored; `git status` clean.

## Why it matters, and why it is small

ADR-017's rule is that the spawned planner writes and the app renders
what lands. The type system used to enforce half of that for free. What
remains is `crescendo-dom.test.tsx`'s sink sweep, which greps for
`writeFile` / `mkdir` / `writeTextFile` — but **only over
`app/src/genesis/`**. A write introduced anywhere else under `app/src`
would now pass `tsc` and pass every existing gate. Rollup would probably
complain about a node builtin in the webview bundle, but "probably" at
build time is not the same as a red diagnostic at the seam.

It is small because nothing does this today (`git grep` over `app/src`
for `writeTextFile|writeFile|mkdir` returns nothing at T-028's HEAD) and
because the app has no reason to want it.

## The closers, cheapest first

1. **Move the write declarations out of the shared file.** A second
   ambient file included only by a test-scoped tsconfig, or a
   `declare module` block inside the one test that needs it, keeps
   `app/src` at the read-only surface it had. Smallest, and it restores
   the free guard exactly.
2. **Widen the sink sweep from `app/src/genesis/` to all of `app/src`.**
   One `walk()` instead of one `readdirSync`, in a test that already
   exists. Catches more than this and is the same shape as the IPC
   command sweep beside it.
3. Both. They are not alternatives.

Adjacent: **T-045** and **T-038** own the mechanical gates; option 2 is
their shape. Option 1 is a tsconfig question and belongs with whoever
next touches `app/tsconfig.json`.
